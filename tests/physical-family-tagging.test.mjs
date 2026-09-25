import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {validatePhysicalBinding} from '../scripts/validate-physical-labels.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));
const audit=JSON.parse(read('../docs/physical-tag-audit.json'));
const preserved=JSON.parse(read('../docs/physical-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data);
const source=n=>rows.find(e=>e.url.endsWith('/'+n)),entry=n=>catalog.entries.find(e=>e.id===source(n).id);
const detail=n=>entry(n).tagDetails['物理'],bindings=n=>detail(n).bindings;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const physical=labelingView(catalog,'physical');

test('physical family reviews all 935 canonical skills and keeps complete qualifiers in 111 groups',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(e=>e.id)).size,935);
 assert.equal(audit.matchedUnique,230);assert.equal(physical.entries.length,230);assert.equal(new Set(physical.entries.map(e=>e.id)).size,230);
 for(const s of rows){const a=audit.rows.find(e=>e.id===s.id);assert.equal(a.sourceHash,hash([s.id,s.url,s.name,s.effect,s.notes||'']));assert.equal(a.decision==='related',physical.entries.some(e=>e.id===s.id));}
 assert.equal(physical.childKeys.length,111);assert.equal(physical.entries.reduce((n,e)=>n+e.tagDetails['物理'].bindings.length,0),318);
 assert.equal(physical.counts.ready,96);assert.equal(physical.counts.partial,134);
 const union=new Set(physical.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)));
 assert.deepEqual([...union].sort(),physical.entries.map(e=>e.id).sort());
 for(const n of [30,38,39,42,125,175,181,182,192,205,212,233,295,366,439,546,618,634,770,902,1121,1270,1296,1366,1497,1518,1651,1666,1667,1692,1729,1754,1872,1881,1955])assert(physical.entries.includes(entry(n)),source(n).name);
 for(const n of [9,122,123,124,186,202,206,1316])assert(!physical.entries.some(e=>e.id===source(n).id));
 const generic=labelingView(catalog,'physical-damage');
 for(const n of [42,125,205,212,295,366,391,439,456,720,880,902,924,1744,1955])assert(!generic.entries.some(e=>e.id===source(n).id),source(n).name);
 assert(!JSON.stringify(physical.childKeys.map(k=>catalog.views[k].label)).includes('undefined'));
});

test('physical expansion preserves all 43 older passes, prior bindings, source records and fragment identities',()=>{
 assert.equal(preserved.entries.length,685);assert.equal(preserved.tagPasses.length,43);
 for(const p of preserved.tagPasses)assert.equal(hash(registry.tagPasses.find(x=>x.tag===p.tag)),p.hash,p.tag);
 for(const old of preserved.entries){
  const e=registry.entries.find(e=>e.id===old.id);assert(e);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes]),old.sourceHash);
  assert.equal(hash(Object.entries(e.tagDetails).filter(([tag,d])=>!['物理','魔法','鸟'].includes(tag)&&d.bindings).map(([tag,d])=>[tag,d.bindings])),old.bindingsHash,e.name);
  for(const p of old.parts){const current=e.parts.find(x=>x.id===p.id);assert(current);assert.equal(current.kind,p.kind);if(![[1446,'other-effect-1'],[418,'condition-3'],[570,'condition-3'],[333,'enemy-race'],[1102,'enemy-race'],[1705,'enemy-race']].some(([n,id])=>e.id===source(n).id&&p.id===id))assert.deepEqual(current,p);}
 }
 assert.equal(registry.tagPasses.length,46);assert.equal(catalog.entries.length,776);assert.equal(catalog.views.all.counts.ready,370);assert.equal(catalog.views.all.counts.partial,406);
 assert.equal(registry.tagPasses.find(p=>p.tag==='物理伤害增加').assignments.length,78);
 assert.equal(catalog.numericEffectInjection,false);
 for(const [n,k]of [[777,'sword'],[181,'dual-weapon'],[570,'machine'],[1955,'ultimate']])assert.strictEqual(labelingView(catalog,k).entries.find(e=>e.id===entry(n).id),entry(n));
 assert(!entry(1446).remainingEffects.some(t=>t.includes('魔法')));assert(!entry(1446).remainingEffects.some(t=>t.includes('物理')));
});

test('physical hit changes, MP cost, DEF and STR references keep their different units and operations',()=>{
 assert.deepEqual(bindings(181).map(b=>b.operation),['hit-count-multiplier','hit-damage-multiplier']);assert.equal(bindings(181)[0].hitMultiplier,2);assert.equal(bindings(181)[1].damageMultiplier,.6);
 const cost=bindings(233).find(b=>b.operation==='consume-current-MP');assert.equal(cost.costPoints,3);assert.equal(cost.costBase,'fixed-points');assert.equal(cost.insufficientResourceStatus,'unconfirmed');assert.equal(bindings(233).find(b=>b.operation==='incoming-damage-down').valuePercent,50);
 for(const n of [175,398,418,570]){const b=bindings(n).find(b=>b.operation==='enemy-defense-reference-reduction');assert.equal(b.appliesPersistentDebuff,false);assert.equal(b.base,'enemy-DEF-for-this-hit');}
 assert.equal(bindings(175)[0].chancePercent,25);assert.equal(bindings(175)[0].valuePercent,50);
 const str=bindings(1955).find(b=>b.operation==='stat-reference-up');assert.equal(str.referencePercent,30);assert.equal(str.referenceStat,'STR');assert.equal(str.valuePercent,undefined);
 const armor=bindings(1013)[0];assert.equal(armor.scope.equipment.armorType,'armor');assert(entry(1013).remainingEffects.some(t=>t.includes('允许装备')));
});

test('physical cap replacements and additions preserve zero-weapon fallback, enemy weakness and probability',()=>{
 for(const n of [1603,1774]){const b=bindings(n).find(b=>b.operation==='conditional-cap-up');assert.deepEqual(b.capCases,[{when:{weaponCountIn:[0,1]},capPoints:3000},{otherwise:true,capPoints:1500}]);assert.equal(b.scope.equipment,undefined);assert.equal(b.capPoints,undefined);}
 const extra=bindings(1651).find(b=>b.addsToPartId);assert.equal(extra.capPoints,3000);assert.deepEqual(extra.scope.equipment.weaponCountIn,[0,1]);assert.deepEqual(extra.condition.weaponCountIn,[0,1]);assert.equal(extra.addsToPartId,'effect-1');
 const boss=bindings(1955).find(b=>b.addsToPartId);assert.equal(boss.capPoints,10000);assert.equal(boss.scope.equipment.weaponCount,1);assert.equal(boss.scope.enemyType,'boss');
 const weak=bindings(1727).find(b=>b.partIds.includes('effect-2'));assert.equal(weak.scope.enemyWeakElement,'thunder');assert.equal(weak.scope.element,undefined);
 const chance=bindings(1518)[0];assert.equal(chance.chancePercent,17);assert.equal(chance.capPoints,20000);assert.equal(chance.scope.equipment.weaponType,undefined);assert.equal(chance.scope.equipment.weaponCount,1);assert.equal(chance.chanceUnit,'physical-hit');
});

test('physical buffs, enemy debuffs and Faith providers retain recipient, trigger, lifetime and non-stacking',()=>{
 for(const n of [104,210,692,1103]){const b=bindings(n)[0];assert.equal(b.isBuff,true);assert.equal(b.durationSeconds,40);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');}
 for(const n of [107,899]){assert.equal(bindings(n)[0].lifetime,'permanent');assert.equal(bindings(n)[0].durationSeconds,undefined);}
 const cap=bindings(1706)[0];assert.equal(cap.target,'highest-STR-other-ally');assert.equal(cap.durationSeconds,90);assert.equal(cap.capPoints,5000);
 const vulnerability=bindings(212)[0];assert.equal(vulnerability.target,'target-enemy');assert.equal(vulnerability.trigger.event,'normal-attack-hit');assert.equal(vulnerability.chancePercent,3);assert.equal(vulnerability.appliedDurationSeconds,40);assert.equal(vulnerability.isBuff,false);
 const debuff=bindings(1270)[0];assert.equal(debuff.target,'enemy-who-defeated-self');assert.equal(debuff.appliedDurationStatus,'unconfirmed');assert.equal(debuff.scope.direction,'enemy-outgoing');
 for(const n of [1754,1756,1881])for(const b of bindings(n)){assert.equal(b.grant.providerMustDifferFromRecipient,true);assert.equal(b.grant.countProviderAndRecipientOnce,true);assert.equal(b.grant.stacking,'one-per-same-named-provider-skill');}
 assert.equal(bindings(1754).find(b=>b.scope.direction==='incoming').grant.providerSkillId,source(1881).id);
 for(const n of [30,38,39,172,182,192,233,372,357,441,1113,1491,915,1858]){assert.equal(entry(n).judgment,'partial');assert(entry(n).remainingConditions.some(t=>/待确认|尚待/.test(t)),source(n).name);}
 for(const n of [125,366,634,357,441,1113,1491,915])for(const b of bindings(n)){assert.equal(b.valuePercent,undefined);assert.equal(b.capPoints,undefined);}
});

test('semantic validation rejects narrowing, duplicate numeric units, forced maxima and lost recipients',()=>{
 const reject=(n,index,mutate)=>{const b=structuredClone(bindings(n)[index]);mutate(b);assert.throws(()=>validatePhysicalBinding(detail(n),{},b));};
 reject(1651,1,b=>b.condition.weaponCount=1);
 reject(233,0,b=>b.costBase='maximum-MP');
 reject(1955,0,b=>b.valuePercent=30);
 reject(1603,0,b=>b.capPoints=3000);
 reject(125,0,b=>b.valuePercent=50);
 reject(212,0,b=>b.target='self');
 reject(1754,0,b=>b.grant.countProviderAndRecipientOnce=false);
 reject(107,0,b=>b.durationSeconds=40);
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 vm.runInNewContext(read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=physical'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not change saved data');}}});
 return{get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}
test('the original physical route displays the full family, subgroup search and cumulative judgment safely',()=>{
 const{get,click}=page();assert.equal(get('#activeTagTitle').textContent,'物理');assert(get('#labelTabs').innerHTML.includes('物理（230）'));assert(!get('#labelTabs').innerHTML.includes('物理伤害增加（78）'));
 assert.match(get('#labelCoverage').textContent,/935.*230.*705/);assert.match(get('#judgmentSummary').textContent,/96.*134.*0/);assert.match(get('#labelResultCount').textContent,/230 \/ 230/);
 const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,111);
 for(const s of sections){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}
 get('#labelSearch').value='二刀流';get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 230/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,2);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','physical-damage');assert.equal(get('#activeTagTitle').textContent,'物理 · 物理伤害增加');assert.match(get('#labelResultCount').textContent,/74 \/ 74/);
 click('#labelTabs','ultimate');assert.match(get('#labelResultCount').textContent,/113 \/ 113/);
 const edits={[`skill:${source(181).id}`]:{effect:'新的未知描述'}};const before=JSON.stringify(edits);const changed=skillLabelRows(data,physical,edits).find(e=>e.id===source(181).id);assert.equal(changed.judgment,'unknown');assert.deepEqual(changed.conditionBindings,{});assert.deepEqual(changed.assignedTags,[]);assert.equal(JSON.stringify(edits),before);
 const other=page(edits).get;assert(other('#labelTable').innerHTML.includes('描述已修改，待重新判断（1）'));
});
