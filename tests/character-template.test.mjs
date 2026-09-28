import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATALOG,ERIS_PENDING} from '../dist/eris-rules.mjs';
import {characterDefinition,characterContext,collectCharacterSources} from '../dist/character-template.mjs';
import {characterReportFromDocument} from '../dist/character-report-loader.mjs';
import {makeTemplate,sourceKey} from '../dist/effect-rule-learning.mjs';
import {retargetReport} from '../dist/entry-preparation.mjs';
import {prepareLoadoutPreview,reportLoadoutSnapshot,toggleExclusiveWeapon,loadoutSources} from '../dist/loadout-preview.mjs';
import {defaultInput,calculate} from '../dist/damage-engine.mjs';
import {scenarioBonuses} from '../dist/scenario-bonus-summary.mjs';

// Limited read-only document adapter for the existing static source markup.
// This exercises the shared profile/source loader against actual page text.
function page(id){
 const html=fs.readFileSync(new URL(`../dist/character-${id}.html`,import.meta.url),'utf8');
 const text=s=>s.replace(/<[^>]*>/g,'').trim();
 const nodes=(s,tag)=>[...s.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`,'g'))].map(m=>node(m[0]));
 // data-* attributes, as the browser exposes them (data-rule-text carries the matching wording).
 const dataset=s=>Object.fromEntries([...(s.match(/^<[^>]*>/)?.[0]||'').matchAll(/\sdata-([\w-]+)="([^"]*)"/g)].map(([,k,v])=>[k.replace(/-(\w)/g,(_,c)=>c.toUpperCase()),v.replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')]));
 function node(s){return {textContent:text(s),dataset:dataset(s),classList:{contains:k=>new RegExp(`class="[^"]*\\b${k}\\b`).test(s)},querySelectorAll:q=>nodes(s,q),querySelector:q=>{
  if(q==='td:last-child')return nodes(s,'td').at(-1)||null;
  const tag=q.startsWith('.')?'span':q;
  return nodes(s,tag).find(n=>q!=='.skill-name'||/class="[^"]*skill-name/.test(s))||null;
 }};}
 const section=id=>html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))?.[0]||'';
 return {html,body:{dataset:{characterId:id}},getElementById:()=>null,querySelector:q=>q==='.hero h2'?nodes(html,'h2')[0]:null,querySelectorAll:q=>{
  if(q==='#max-stats .stat-box')return [...section('max-stats').matchAll(/<div class="stat-box">[\s\S]*?<\/div>/g)].map(m=>node(m[0]));
  if(q==='#traits .trait')return nodes(section('traits'),'article');
  if(q==='#equipment .equipment-card')return nodes(section('equipment'),'article');
  const match=q.match(/^#([\w-]+) tbody tr$/);return match?nodes(section(match[1]).match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1]||'','tr'):[];
 }};
}
const makeReport=()=>characterReportFromDocument(page('259'));
const selection={attack:'s1',type:'physical',element:'无',statReference:'str',criticalEnabled:false,specialAttack:false,fullHp:false,lowHp:false,conditionBuffActive:false,dualWield:false};
const input={...defaultInput(),type:'physical',skillType:'skill',element:'无',boss:true,races:['龙'],coefficient:.334,skillPercent:51.8,hits:10,cap:9999999,effects:[]};
function preview({report=makeReport(),snapshot=reportLoadoutSnapshot(report),selected=selection,...rest}={}){
 return prepareLoadoutPreview({baseReport:report,snapshot,selection:selected,input,...rest});
}
const sourceRow=(report,name)=>report.rows.find(r=>r.sourceName===name);

test('all pages use one shared calculator entry and Eris retains the original 43 source IDs and full text',()=>{
 for(const id of ['245','259','260'])assert.match(page(id).html,/src="\.\/character-page\.mjs\?v=/);
 assert.match(page('259').html,/id="bonusCalculator" data-rule-calculator/);
 const sources=collectCharacterSources(page('259')).filter(s=>s.group!=='blessings');
 assert.equal(sources.length,45);
 for(const [index,source] of sources.entries()){
  const seed=CATALOG.find(s=>s.id===source.id);assert.ok(seed,source.name);assert.equal(seed.text,source.text);
  if(index<43)assert.equal(source.id,`259-${source.group}-${index+1}`);
  assert.doesNotThrow(()=>makeTemplate(seed,seed.rules));
 }
 assert.deepEqual(ERIS_PENDING.map(s=>s.name),['你在做什么！','自动EX鼓舞','沉睡的狮子']);
});

test('Eris and Roxy load their own attack, equipment, stats and exact rule catalogs',()=>{
 const eris=makeReport(),roxy=characterReportFromDocument(page('260'));
 assert.equal(eris.characterTemplateRevision,1);assert.equal(eris.context.attack,'s1');assert.equal(eris.context.element,'none');
 assert.equal(eris.profile.baseStats.attack,2437);assert.equal(eris.profile.equipment[1].type,'衣服');
 assert.equal(eris.profile.moves.find(m=>m.id==='s1').statReference,'str');
 assert.equal(eris.profile.moves.find(m=>m.id==='s1').damageType,'physical');
 assert.equal(eris.profile.moves.find(m=>m.id==='s1').element,'无');
 assert(!eris.rows.some(r=>r.rule.effects.some(e=>e.type==='hit')));
 assert.equal(roxy.context.attack,'magic');assert.equal(roxy.context.element,'ice');
 assert(roxy.rows.some(r=>r.sourceId==='water-king'&&r.rule.effects.some(e=>e.type==='hit')));
 assert.equal(characterDefinition('245').catalog.length,0);
 assert.equal(characterContext('245').element,null);
});

test('saved Eris overrides and edited descriptions never silently inherit official values',()=>{
 const source=CATALOG.find(s=>s.name==='攻击提升极');
 const draft=makeTemplate(source,[{...source.rules[0],effects:[{type:'stat',target:'攻击力',value:7,unit:'%'}]}]);
 const report=characterReportFromDocument(page('259'),{drafts:{[sourceKey(source)]:draft},disabledSources:['259-exclusive-3'],context:{fullHp:true}});
 assert.equal(sourceRow(report,'攻击提升极').rule.effects[0].value,7);
 assert.equal(sourceRow(report,'斗志提升极').status,'disabled');assert.equal(report.context.fullHp,true);
});

test('exclusive gear switch equips every exclusive item (weapon and armor) with its panel attributes and damage',()=>{
 const report=makeReport(),sources=loadoutSources(report),original=reportLoadoutSnapshot(report);
 const on=toggleExclusiveWeapon(original,sources,true),off=toggleExclusiveWeapon(on,sources,false);
 const yes=preview({report,snapshot:on}),no=preview({report,snapshot:off});
 assert(yes.input.attackBase>no.input.attackBase);assert(yes.imported.effects.some(e=>e.name.includes('艾莉丝之剑')));
 assert(!no.imported.effects.some(e=>e.name.includes('艾莉丝之剑')));
 assert.equal(yes.input.cap-no.input.cap,134000); // sword +7k, sword style +100k, mastery +15k and two-handed sword +12k
 assert.equal(yes.input.hitMultiplier,1);assert.equal(yes.input.hitDamageRatio,1);
 assert(Number.isFinite(calculate(yes.input).mean));assert(Number.isFinite(calculate(no.input).mean));
 const armor=sources.find(s=>s.name==='艾莉丝的衣服');
 assert(on.items.some(i=>i.sourceId===armor.sourceId),'专武 equips the exclusive armor too');
 assert(!off.items.some(i=>i.sourceId===armor.sourceId),'switching 专武 off removes every exclusive item');
});

test('removing the base blade skill also removes its mastery bonus, with no change to crit proc branch',()=>{
 const report=makeReport(),snapshot=reportLoadoutSnapshot(report);
 const before=preview({report,snapshot});
 const removed={...snapshot,items:snapshot.items.filter(i=>i.sourceId!=='259-exclusive-11')};
 const after=preview({report,snapshot:removed});
 assert.equal(before.input.cap-after.input.cap,45000);
 const mastery=after.report.rows.filter(r=>r.sourceName==='极意・一天真刃');
 assert(!mastery.some(r=>r.status==='active'));
});

test('conditional bonuses, critical and ordinary HP switches keep damage calculable and independent',()=>{
 const report=makeReport(),snapshot=toggleExclusiveWeapon(reportLoadoutSnapshot(report),loadoutSources(report),true);
 const off=preview({report,snapshot});
 const near=preview({report,snapshot,selected:{...selection,nearestEnemy:true}});
 assert.equal(near.input.cap-off.input.cap,5000);
 assert.equal(scenarioBonuses(near.report).filter(m=>m.type==='damage').reduce((s,m)=>s+m.value,0)-scenarioBonuses(off.report).filter(m=>m.type==='damage').reduce((s,m)=>s+m.value,0),25);
 const critical=preview({report,snapshot,selected:{...selection,criticalEnabled:true,conditionBuffActive:true}});
 assert.equal(critical.input.criticalCapAdded,15000);assert.equal(critical.input.critRate,25);
 for(const fullHp of [false,true])for(const openingBuffActive of [false,true])assert(Number.isFinite(calculate(preview({report,snapshot,selected:{...selection,fullHp,openingBuffActive}}).input).mean));
});

test('move bonuses stay scoped: first skill crit and ultimate cap do not leak to other attacks',()=>{
 const report=makeReport();
 const skill=retargetReport(report,{...selection,criticalEnabled:true});
 const second=retargetReport(report,{...selection,attack:'s2',criticalEnabled:true});
 assert.equal(sourceRow(skill,'伯雷亚斯拳').status,'active');assert.equal(sourceRow(second,'伯雷亚斯拳').status,'inactive');
 const ultimate=retargetReport(report,{...selection,attack:'ultimate'});
 assert.equal(sourceRow(ultimate,'无音之太刀').status,'active');assert.equal(sourceRow(skill,'无音之太刀').status,'inactive');
 assert(!ultimate.rows.some(r=>r.sourceName==='一天真刃･弐式'&&r.status==='active'));
 assert(scenarioBonuses(ultimate,{group:'native'}).some(m=>m.sources.some(s=>s.name==='无音之太刀'&&s.value===300000)));
 const dual=characterReportFromDocument(page('259'),{context:{weaponCount:2,sword:true,equipmentIds:['259-equipment-42']}});
 assert.equal(sourceRow(dual,'我会保护你').status,'inactive');
 assert.equal(sourceRow(dual,'一天真刃･弐式').status,'inactive');
});
