import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATALOG} from '../dist/mayly-rules.mjs';
import {MAGIC} from '../dist/mayly-data.mjs';
import {collectCharacterSources} from '../dist/character-template.mjs';
import {characterReportFromDocument} from '../dist/character-report-loader.mjs';
import {makeTemplate} from '../dist/effect-rule-learning.mjs';
import {retargetReport,websiteCandidates,resolveReview,decisionKey} from '../dist/entry-preparation.mjs';
import {prepareLoadoutPreview,reportLoadoutSnapshot,toggleExclusiveWeapon,loadoutSources} from '../dist/loadout-preview.mjs';
import {defaultInput,calculate} from '../dist/damage-engine.mjs';
import {magicBuffOptions,magicResistance,magicBuffCap,selectedMagicBuffs} from '../dist/magic-buffs.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
// Same restricted read-only adapter used by the template integration test.
function page(id){
 const html=fs.readFileSync(new URL(`../dist/character-${id}.html`,import.meta.url),'utf8');
 const text=s=>s.replace(/<[^>]*>/g,'').trim();
 const nodes=(s,tag)=>[...s.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`,'g'))].map(m=>node(m[0]));
 function node(s){return {textContent:text(s),dataset:{},classList:{contains:k=>new RegExp(`class="[^"]*\\b${k}\\b`).test(s)},querySelectorAll:q=>nodes(s,q),querySelector:q=>{
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
const makeReport=()=>characterReportFromDocument(page('182'));
const selection={attack:'s1',type:'physical',element:'光',statReference:'str',criticalEnabled:false,specialAttack:false,fullHp:false,lowHp:false,conditionBuffActive:false,openingBuffActive:false,dualWield:false,bleeding:false,enemyLightWeak:false,enemyDarkWeak:false};
const input={...defaultInput(),type:'physical',skillType:'skill',element:'光',boss:true,races:['龙'],coefficient:1,skillPercent:0,hits:10,defense:500,cap:9999999,effects:[]};
function preview({report=makeReport(),snapshot=reportLoadoutSnapshot(report),selected=selection,attackInput=input,...rest}={}){return prepareLoadoutPreview({baseReport:report,snapshot,selection:selected,input:attackInput,...rest});}
const rows=(report,name)=>report.rows.filter(r=>r.sourceName===name&&r.status==='active');
const total=(report,name,type)=>rows(report,name).flatMap(r=>r.rule.effects).filter(e=>e.type===type).reduce((n,e)=>n+e.value,0);

test('Mayly source page covers all 38 sources, with exact descriptions and shared template',()=>{
 const doc=page('182'),sources=collectCharacterSources(doc).filter(s=>s.group!=='blessings');
 assert.equal(sources.length,38);assert.match(doc.html,/src="\.\/character-page\.mjs\?v=/);
 for(const s of sources){const original=CATALOG.find(x=>x.id===s.id);assert.ok(original,s.name);assert.equal(s.text,original.text);assert.doesNotThrow(()=>makeTemplate(original,original.rules));}
 const report=makeReport();assert.deepEqual(report.profile.baseStats,{hp:11628,mp:281,attack:2073,defense:1642,intelligence:880,mind:1527});
 assert.equal(report.profile.moves.length,5);assert.equal(report.profile.moves[1].element,'光');assert.equal(report.profile.moves[1].coefficient,null);assert.equal(report.profile.moves[1].hits,null);
 assert.equal(report.profile.magic[0].purpose,'support');
 assert.deepEqual(report.profile.equipment.map(e=>[e.type,e.element]),[['斧','light'],['剑','dark']]);
 const cap=JSON.parse(doc.html.match(/id="characterCapProfile">(.*?)<\/script>/s)[1]);assert.equal(cap.attacks.length,8);assert(cap.attacks.every(a=>a.tags.length&&a.baseCap===9999));
});

test('equipped conversion changes skill and ultimate to dark; removing restores light without losing damage bonuses',()=>{
 const report=makeReport(),snapshot=reportLoadoutSnapshot(report);
 const dark=preview({report,snapshot});assert.equal(dark.report.context.element,'dark');assert.equal(dark.input.element,'暗');
 assert(dark.imported.effects.every(e=>e.scope.element==='暗'));
 const removed={...snapshot,items:snapshot.items.filter(s=>s.sourceId!=='182-exclusive-1297')};
 const light=preview({report,snapshot:removed,selected:{...selection,element:'暗'}});assert.equal(light.input.element,'光');assert.equal(light.report.context.element,'light');
 for(const attack of ['s1','s2','s3','ultimate'])assert.equal(retargetReport(report,{...selection,attack}).context.element,'dark');
 assert.equal(retargetReport(report,{...selection,attack:'normal',element:'火'}).context.element,'fire');
 assert.equal(retargetReport(report,{...selection,attack:'magic',element:'冰',type:'magical'}).context.element,'ice');
 assert(Number.isFinite(calculate(dark.input).mean));assert(Number.isFinite(calculate(light.input).mean));
 // A confirmed website/reader review keeps the configuration operation too.
 const web=websiteCandidates(report);assert(web.some(w=>w.effect.type==='attackElement'));
 const decisions=Object.fromEntries(web.map(w=>[decisionKey(w),{choice:'web'}]));
 const confirmed=resolveReview(report,web,decisions);assert.equal(confirmed.context.element,'dark');
});

test('both divine weapons supply fixed stats, attribute matching and caps; off removes all gear operations',()=>{
 const report=makeReport(),base=reportLoadoutSnapshot(report),on=toggleExclusiveWeapon(base,loadoutSources(report),true);
 const yes=preview({report,snapshot:on}),no=preview({report,snapshot:toggleExclusiveWeapon(on,loadoutSources(report),false)});
 assert.equal(yes.report.context.weaponCount,2);assert.equal(no.report.context.weaponCount,0);
 assert.deepEqual(new Set(yes.report.context.weaponSignatures),new Set(['axe:light','sword:dark']));
 assert.equal(total(yes.report,'魔性祝福','damage'),30);
 assert.equal(total(yes.report,'超越·特技上限','cap'),1500);assert.equal(total(no.report,'超越·特技上限','cap'),3000);
 assert(yes.input.attackBase>no.input.attackBase+740); // fixed STR740 plus axe passive15%
 assert.equal(total(yes.report,'魔祸咒翼·加基尔斯','equipmentStat'),429);
 assert(!no.report.rows.some(r=>r.group==='equipment'));assert.equal(total(no.report,'魔性祝福','damage'),0);
 const single={...on,items:on.items.filter(s=>s.sourceId!=='182-equipment-1694')};
 const axe=preview({report,snapshot:single});assert.equal(axe.report.context.weaponCount,1);assert.equal(total(axe.report,'魔性祝福','damage'),0);
 const light={...single,items:single.items.filter(s=>s.sourceId!=='182-exclusive-1297')};assert.equal(total(preview({report,snapshot:light}).report,'魔性祝福','damage'),30);
});

test('bleed and basic ailments are independent; defense penetration and ailment caps never leak',()=>{
 const base=preview();
 const ailment=preview({attackInput:{...input,ailment:true}});
 assert.equal(total(ailment.report,'魔性祝福','cap'),20000);assert.equal(ailment.input.defenseRatio,1);
 const bleed=preview({selected:{...selection,bleeding:true,criticalEnabled:true}});
 assert.equal(bleed.input.defenseRatio,.85);assert.equal(bleed.input.critRate,20); // 双龙 crit lasts until KO (game 継続時間 -1)assert.equal(total(bleed.report,'魔性祝福','cap'),0);
 assert.equal(base.input.defenseRatio,1);
});

test('full HP, opening and conditional buffs remain independent and all combinations calculate',()=>{
 for(const fullHp of [false,true])for(const openingBuffActive of [false,true])for(const conditionBuffActive of [false,true]){
  const result=preview({selected:{...selection,criticalEnabled:true,fullHp,openingBuffActive,conditionBuffActive}});
  assert.equal(result.input.critRate,(fullHp?10:0)+15); // 双龙: game duration -1, always on
  assert.equal(total(result.report,'噩梦三重奏','damage'),conditionBuffActive?36:0);
  assert(Number.isFinite(calculate(result.input).mean));
 }
 const on=preview({selected:{...selection,conditionBuffActive:true,specialAttack:true,criticalEnabled:true},attackInput:{...input,weakness:true}});
 assert.equal(total(on.report,'噩梦三重奏','damage'),108); // three independently scoped 36% entries, never one unconditional 108%
 assert.equal(on.imported.killerCorrection,50); // only the established killer-power boost
});

test('nongod killer and separate light/dark weaknesses follow their own conditions',()=>{
 const yes=preview({selected:{...selection,specialAttack:true,enemyLightWeak:true,enemyDarkWeak:true}});
 assert.equal(total(yes.report,'魔神化','damage'),30);assert.equal(total(yes.report,'启明星','cap'),8000);
 const god=preview({selected:{...selection,specialAttack:true},attackInput:{...input,races:['神','龙']}});
 assert.equal(total(god.report,'魔神化','damage'),0);
 const unknown=preview({selected:{...selection,specialAttack:true},attackInput:{...input,races:[]}});assert.equal(total(unknown.report,'魔神化','damage'),0);
 const off=preview();assert.equal(total(off.report,'启明星','cap'),0);
});

test('Anima is an exact-description support magic and resistance updates are reversible, without NaN caps',()=>{
 const report=makeReport(),options=magicBuffOptions(report.profile);assert.equal(options.length,1);
 const buffs=selectedMagicBuffs(options,{'despair-anima':true});
 assert.equal(magicResistance('光',10,buffs),-10);assert.equal(magicResistance('暗',-20,buffs),-40);
 assert.equal(magicResistance('火',10,buffs),10);assert.equal(magicResistance('光','',buffs),'');
 assert.equal(magicResistance('光',10,[]),10);assert.equal(magicBuffCap(buffs,'magic'),0);
 assert.equal(magicBuffOptions({magic:[{name:MAGIC.name,description:'自定义修改过的效果'}]}).length,0);
 assert(Number.isFinite(calculate(preview({selectedBuffs:buffs}).input).mean));
});

test('known partial equipment proves positive attribute match but cannot prove a missing match',()=>{
 const s=CATALOG.find(s=>s.name==='魔性祝福');
 const r=evaluateCatalog([s],{attack:'s1',damageType:'physical',element:'light',weaponCount:2,weaponDetails:[{type:'axe',element:'light'}],ailment:false});
 assert.equal(total(r,'魔性祝福','damage'),30);
 const incomplete=evaluateCatalog([s],{...r.context,element:'dark'});assert(incomplete.rows.some(row=>row.status==='pending'));
});
