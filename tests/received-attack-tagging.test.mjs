import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));
const audit=JSON.parse(read('../docs/received-attack-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'received-attack');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['受到攻击'];
const mapping={'attack-up':[195],'magic-up':[196],'mnd-up':[740],'defense-reference':[1133],'enemy-attack-reference':[1176],'hp-heal':[172,184,372,389,401,440,553],'mp-cost':[233,389],'physical-reduction':[233],'damage-reduction-buff':[389],'consecutive-reduction':[628],'guard-physical':[30],'guard-magic':[33],'dodge-physical':[38],'critical-to-normal':[37],'counter':[39],'survive-lethal':[184],'speed-end':[617],'damage-reduction-end':[859]};
const nums=v=>v.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);

test('received attack reviews all source rows, separates actual responses and terminations from passive reduction and other triggers',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,21);
 assert.deepEqual(nums(view),[30,33,37,38,39,172,184,195,196,233,372,389,401,440,553,617,628,740,859,1133,1176]);
 for(const row of all){const d=audit.rows.find(d=>d.id===row.id);assert.equal(d.sourceHash,createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex'));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 for(const [group,numbers] of Object.entries(mapping))assert.deepEqual(nums(labelingView(catalog,'received-attack-'+group)),numbers,group);
 assert.equal(view.childKeys.length,18);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),25);
 for(const n of [31,32,34,35,36,40,104,107,199,212,232,339,634,730,763,780,816,873,888,923,966,993,1036,1121,1123,1130,1138,1189,1281,1305,1307,1316,1417,1446,1497,1608,1812,1872])assert(!view.entries.some(e=>e.id===source(n).id),source(n).name);
});

test('received attack retains event timing, exact resource and heal bases, chance, Buff lifetime and single-type limits',()=>{
 for(const n of [30,33,37,38,39,628,859,1133,1176]){assert.equal(detail(n).condition.event,'attack-received');assert.equal(detail(n).condition.requiresHpDamage,false);}
 for(const n of [172,184,195,196,233,372,389,401,440,553,617,740]){assert.equal(detail(n).condition.event,'damage-received');assert.equal(detail(n).condition.requiresHpDamage,true);}
 assert.equal(detail(195).summary,'受到伤害时');assert(!/概率|5%/.test(detail(195).summary));assert.equal(detail(195).bindings[0].chancePercent,undefined);
 for(const n of [195,196,740]){const b=detail(n).bindings[0];assert.equal(b.phase,'after-damage');assert.equal(b.valuePercent,20);assert.equal(b.durationSeconds,40);assert.equal(b.isBuff,true);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');}
 assert.equal(detail(196).bindings[0].chancePercent,5);assert.equal(detail(740).bindings[0].chancePercent,5);
 assert.equal(detail(233).bindings[0].amount,3);assert.equal(detail(233).bindings[1].multiplier,0.5);assert(detail(233).bindings.every(b=>!b.isBuff && b.phase==='damage-calculation'));
 const zero=detail(389).bindings.find(b=>b.group==='mp-cost');assert.equal(zero.operation,'set-current');assert.equal(zero.value,0);
 const reduction=detail(389).bindings.find(b=>b.group==='damage-reduction-buff');assert.equal(reduction.durationSeconds,10);assert.equal(reduction.phase,'after-damage');assert.equal(reduction.buffTypeStatus,'unconfirmed');
 assert(entry(389).remainingConditions.includes('每Wave仅一次'));assert.match(entry(184).remainingConditions.join(''),/重置范围待确认/);
 for(const [n,p] of [[372,25],[401,10],[440,25],[553,40]]){const b=detail(n).bindings[0];assert.equal(b.healingBase,'damage-received');assert.equal(b.healingPercent,p);}
 assert.equal(detail(172).bindings[0].healingBase,'unconfirmed');assert.match(entry(172).remainingConditions.join('；'),/基数待确认/);
 assert.equal(detail(628).bindings[0].curveStatus,'unconfirmed');assert.equal(detail(628).bindings[0].hitsAtMaximum,50);assert.match(detail(628).calculationNote,/不使用自身打出的Hit数/);
 assert.equal(detail(37).bindings[0].chancePercent,50);assert.match(detail(37).bindings[0].summary,/仍承受普通伤害/);
 for(const n of [1133,1176]){const b=detail(n).bindings[0];assert.equal(b.phase,'damage-calculation');assert.equal(b.isBuff,false);assert.equal(b.durationSeconds,undefined);}
 assert.equal(detail(1133).bindings[0].referenceTarget,'self');assert.equal(detail(1176).bindings[0].referenceTarget,'attacking-enemy');
 for(const n of [617,859]){const b=detail(n).bindings[0];assert.equal(b.phase,'end-effect');assert.equal(b.activationMode,'effect-termination');assert(b.endsOn);assert.equal(b.durationSeconds,undefined);}
 assert.equal(detail(859).condition.element,'ice');assert.deepEqual(entry(859).assignedTags.filter(tag=>!['物理','魔法'].includes(tag)),['战斗开始','受到攻击','冰属性']);assert.equal(entry(859).tagDetails['战斗开始'].bindings[0].endsOn,'hit-by-enemy-ice-attack');
});

test('one condition pass accumulates on stable identities without marking future effects or mechanisms complete',()=>{
 assert.equal(registry.tagPasses.length,45);assert.equal(catalog.numericEffectInjection,false);
 const pass=registry.tagPasses.find(p=>p.tag==='受到攻击');
 for(const a of pass.assignments){const e=catalog.entries.find(e=>e.id===a.skillId);assert(a.partIds.every(id=>e.parts.find(p=>p.id===id).kind==='condition'));assert.equal(e.judgment,'partial');}
 for(const [n,oldTag] of [[195,'攻击力'],[196,'魔力'],[1133,'防御力'],[1176,'攻击力']]){
  assert.deepEqual(entry(n).assignedTags.filter(tag=>!['物理','魔法'].includes(tag)),[oldTag,'受到攻击']);assert.deepEqual(labelingView(catalog,{攻击力:'attack',魔力:'magic',防御力:'defense'}[oldTag]).entries.find(e=>e.id===source(n).id),entry(n));
 }
 assert(entry(1133).remainingConditions.includes('概率触发，具体概率待确认'));
 assert.match(entry(195).remainingConditions.join(''),/持续40秒/);assert.match(entry(1176).remainingConditions.join(''),/该次受伤计算/);
 assert.deepEqual(entry(740).assignedTags.filter(tag=>!['物理','魔法'].includes(tag)),['受到攻击']);assert.match(entry(740).remainingEffects.join(''),/魔抗\+20%/);
 assert.equal(view.counts.ready,0);assert.equal(view.counts.partial,21);assert.equal(catalog.entries.length,772);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,772);
 assert.equal(catalog.views.all.counts.ready,364);assert.equal(catalog.views.all.counts.partial,408);
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=received-attack'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});
 return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}
test('received attack page groups effects, deduplicates totals, searches and preserves old tabs and stale edit review',()=>{
 const {get,click}=page();
 assert.match(get('#labelCoverage').textContent,/935.*21.*914/);assert.match(get('#judgmentSummary').textContent,/0.*21.*0/);assert.match(get('#labelResultCount').textContent,/21 \/ 21/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,39);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,19);
 assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,18);assert.equal((get('#labelTable').innerHTML.match(/data-skill-id=/g)||[]).length,25);
 const search=get('#labelSearch');search.value='从零开始';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 21/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,3);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','received-attack-magic-up');assert.match(get('#activeTagTitle').textContent,/受到攻击.*魔力/);assert(get('#labelTable').innerHTML.includes('复仇增魔'));assert(!get('#labelTable').innerHTML.includes('复仇鼓舞'));
 click('#labelTabs','full-hp');assert.match(get('#labelResultCount').textContent,/6 \/ 6/);click('#labelTabs','low-hp');assert.match(get('#labelResultCount').textContent,/26 \/ 26/);click('#labelTabs','battle-start');assert.match(get('#labelResultCount').textContent,/117 \/ 117/);click('#labelTabs','boss');assert.match(get('#labelResultCount').textContent,/13 \/ 13/);
 const edits={[`skill:${source(195).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新的受伤效果'}};const changed=page(edits);
 assert.match(changed.get('#labelResultCount').textContent,/22 \/ 22/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 const stale=skillLabelRows(data,view,edits).find(e=>e.id===source(195).id);assert.equal(stale.judgment,'unknown');assert.deepEqual(stale.conditionBindings,{});
});
