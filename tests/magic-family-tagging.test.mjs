import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {validateMagicBinding} from '../scripts/validate-magic-labels.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8'),registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/magic-damage-tag-audit.json')),preserved=JSON.parse(read('../docs/magic-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),source=n=>rows.find(e=>e.url.endsWith('/'+n)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['魔法'],bs=n=>detail(n).bindings,magic=labelingView(catalog,'magic-damage');
function beforeBirdParts(e){const split=JSON.parse(read('../docs/bird-preservation-2026-09-25.json')).conditionSplits.find(s=>s.skillId===e.id);return split?partsBeforeRaces(e).flatMap(p=>p.id===split.originalPart.id?[split.originalPart]:split.replacementParts.some(x=>x.id===p.id)?[]:[p]):partsBeforeRaces(e);}
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

test('magic family audits the full 935-skill source and excludes race names, MP labels and negated notes',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(e=>e.id)).size,935);assert.equal(audit.matchedUnique,130);assert.equal(magic.entries.length,130);assert.equal(new Set(magic.entries.map(e=>e.id)).size,130);
 for(const r of rows){const a=audit.rows.find(e=>e.id===r.id);assert.equal(a.sourceHash,hash([r.id,r.url,r.name,r.effect,r.notes||'']));assert.equal(a.decision==='related',magic.entries.some(e=>e.id===r.id));}
 for(const n of [33,105,109,127,133,140,141,167,185,197,219,221,244,305,380,401,429,523,560,592,649,656,665,691,711,836,849,895,994,1028,1130,1307,1364,1366,1449,1480,1497,1563,1754,1755,1800,1847,1911,1982,2017,2028])assert(magic.entries.includes(entry(n)),source(n).name);
 for(const n of [49,50,71,72,208,239,259,276,333,389,400,459,627,867,889,907,1022,1179,1213,1426,1462,1481,1527,1557,1705,1776,1963,1972])assert(!magic.entries.some(e=>e.id===source(n).id),source(n).name);
 assert.equal(magic.childKeys.length,71);assert.equal(magic.entries.reduce((n,e)=>n+e.tagDetails['魔法'].bindings.length,0),163);assert.equal(magic.counts.ready,86);assert.equal(magic.counts.partial,44);
 const union=new Set(magic.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)));assert.deepEqual([...union].sort(),magic.entries.map(e=>e.id).sort());
 const generic=labelingView(catalog,'magic-damage-damage');assert.equal(generic.entries.length,19);
 for(const n of [127,227,305,380,429,593,691,711,836,837,895,1159,1366,1480,1799,2016])assert(!generic.entries.some(e=>e.id===source(n).id));
});

test('magic family preserves all prior 737 records, all 44 tag passes, original bindings and shared IDs',()=>{
 assert.equal(preserved.entries.length,737);assert.equal(preserved.tagPasses.length,44);
 for(const p of preserved.tagPasses)assert.equal(hash(registry.tagPasses.find(t=>t.tag===p.tag)),p.hash,p.tag);
 for(const old of preserved.entries){const e=registry.entries.find(x=>x.id===old.id);assert(e);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,beforeBirdParts(e)]),old.sourceAndPartsHash,e.name);assert.equal(hash(Object.entries(e.tagDetails).filter(([tag,d])=>!['魔法','鸟','Boss','铠甲','衣服','法袍',...ADDITIONAL_RACE_TAGS].includes(tag)&&d.bindings).map(([tag,d])=>[tag,d.bindings])),old.bindingsHash,e.name);}
 assert.equal(catalog.entries.length,852);assert.equal(registry.tagPasses.length,66);assert.equal(catalog.views.all.counts.ready,540);assert.equal(catalog.views.all.counts.partial,312);assert.equal(catalog.numericEffectInjection,false);
 assert.equal(registry.tagPasses.find(p=>p.tag==='魔法伤害增加').assignments.length,22);assert.equal(catalog.views.magic.label,'魔力');assert.equal(catalog.views.physical.counts.relatedUnique,230);
 for(const[n,key]of [[210,'physical'],[658,'staff'],[994,'technique'],[1159,'boss-magic-damage'],[842,'ice'],[711,'light']]){assert.strictEqual(labelingView(catalog,key).entries.find(e=>e.id===entry(n).id),entry(n));assert.equal(entry(n).judgment,'ready');}
 assert(entry(1446).remainingEffects.every(t=>!t.includes('物理')&&!t.includes('魔法')));assert(entry(1446).remainingEffects.some(t=>t.includes('回复')));
});

test('nonstackable spell caps are additive spell-class effects, distinct from same-type Buff rules',()=>{
 for(const[n,v]of [[1480,3000],[1911,5000]]){const normal=bs(n).find(b=>b.partIds.includes('magic-cap')),extra=bs(n).find(b=>b.partIds.includes('exclusive-magic-cap'));assert.equal(normal.capPoints,v);assert.equal(normal.scope.spellSubtype,undefined);assert.equal(extra.capPoints,v);assert.equal(extra.addsToPartId,'magic-cap');assert.equal(extra.scope.spellSubtype,'nonstackable-magic');assert.equal(extra.isBuff,false);assert.equal(extra.stacking,undefined);assert.equal(extra.requiresSpellClassification,true);assert.equal(entry(n).judgment,n===1480?'ready':'partial');}
 for(const n of [1800,2017]){assert.equal(bs(n).length,1);assert.equal(bs(n)[0].scope.spellSubtype,'nonstackable-magic');assert.equal(bs(n)[0].addsToPartId,undefined);}
 const boss=bs(2028)[0];assert.equal(boss.scope.enemyType,'boss');assert.equal(boss.capPoints,10000);assert.equal(boss.condition.requireAnyLivingFemale,true);assert.equal(boss.condition.excludeSelf,true);assert.equal(boss.condition.requireAllFemale,false);
});

test('casting, healing, MP cost and received-damage recovery keep their different units and subjects',()=>{
 for(const[n,v]of [[197,20],[523,20],[592,30],[649,30],[994,30]]){const b=bs(n)[0];assert.equal(b.operation,'cast-speed-up');assert.equal(b.valuePercent,v);assert.equal(b.scope.spellType,'all-magic');assert.equal(b.additionalCastCount,0);}
 assert.equal(bs(523)[0].isBuff,false);assert.equal(bs(523)[0].condition.thresholdPercent,30);assert.equal(bs(649)[0].durationSeconds,40);
 for(const[n,v]of [[133,10],[140,30],[711,30],[1563,30]]){const b=bs(n).find(b=>b.operation==='healing-output-up');assert.equal(b.valuePercent,v);assert.equal(b.scope.spellType,'healing-magic');assert.equal(b.affectsRecipientMaximumHP,false);}
 for(const[n,v]of [[1563,2000],[1982,1500]]){const b=bs(n).find(b=>b.operation==='healing-cap-up');assert.equal(b.healingCapPoints,v);assert.equal(b.capPoints,undefined);assert.equal(b.affectsRecipientMaximumHP,false);}
 for(const[n,v]of [[185,50],[380,25]]){const b=bs(n).find(b=>b.operation==='adjust-spell-cost');assert.equal(b.costAdjustmentPercent,v);assert.equal(b.costBase,'spell-MP-cost');assert.equal(b.valuePercent,undefined);if(n===380)assert.equal(b.scope.element,'ice');}
 for(const[n,v]of [[401,10],[440,25],[553,40]]){const b=bs(n)[0];assert.equal(b.healingPercent,v);assert.equal(b.healingBase,'damage-received');assert.equal(b.trigger.event,'magic-damage-received');assert.equal(b.chanceStatus,'unconfirmed');assert.equal(entry(n).judgment,'partial');}
 assert.equal(bs(167)[0].hasExceptions,true);assert.equal(bs(167)[0].grantsDamageImmunity,false);assert.equal(bs(221)[0].guaranteedImmunity,false);
});

test('magic critical and killer eligibility remain separate from guaranteed hits, weakness and killer damage',()=>{
 for(const[n,element]of [[141,'fire'],[142,'ice'],[143,'earth'],[144,'thunder'],[145,'light'],[146,'dark']]){const b=bs(n)[0];assert.equal(b.scope.element,element);assert.equal(b.operation,'enable-critical');assert.equal(b.grantsCriticalEligibility,true);assert.equal(b.guaranteedCritical,false);assert.equal(b.ratePoints,undefined);}
 const human=bs(656)[0];assert.deepEqual(human.scope.enemyTypes,['soldier','knight','sniper','sorcerer']);assert.equal(human.operation,'enable-killer');assert.equal(human.valuePercent,undefined);
 assert.equal(bs(665)[0].scope.enemyTypes[0],'creature');assert.equal(bs(741)[0].scope.enemyTypes[0],'sorcerer');
 assert.equal(bs(836)[0].scope.hitsElementWeakness,true);assert.equal(bs(836)[0].valuePercent,30);assert.equal(bs(895)[0].scope.requiresKillerHit,true);assert.equal(bs(895)[0].valuePercent,20);assert.equal(bs(895)[0].grantsKillerEligibility,false);
 assert.equal(bs(1307)[0].scope.direction,'incoming');assert.equal(bs(1307)[0].scope.hitsSelfElementWeakness,true);
});

test('magic timers, scaling, stat branches and Faith ownership cannot be flattened into fixed generic bonuses',()=>{
 for(const n of [429,691,593,305,1799,2016,1449,1847])for(const b of bs(n)){assert.equal(b.valuePercent,undefined);assert.equal(b.capPoints,undefined);}
 assert.equal(bs(429)[0].scope.chainKey,'same-spell');assert.equal(bs(429)[0].firstValuePercent,4);assert.equal(bs(429)[0].reset.status,'unconfirmed');assert.equal(bs(691)[0].scope.chainKey,'same-element');assert.equal(bs(691)[0].reset.elapsedSecondsAtLeast,10);assert.equal(bs(691)[0].reset.onDifferentMagicElement,true);
 assert.equal(bs(305)[0].incrementPercent,5);assert.equal(bs(305)[0].maxStacks,10);assert.equal(bs(305)[0].scope.spellSubtype,'science');assert.equal(bs(1799)[0].count.eachUnitCountsOnce,true);assert.equal(bs(2016)[0].reachesMaximumAtSeconds,40);
 for(const n of [1066,1941]){assert.equal(bs(n)[0].condition.operator,'lt');assert.equal(bs(n)[0].condition.snapshot,'wave-start');assert.equal(bs(n)[0].mutuallyExclusiveWithPartId,'effect-1');assert.equal(bs(n)[0].isBuff,false);}
 assert.equal(bs(560).find(b=>b.operation==='disable-magic').lockDurationSeconds,30);assert.equal(bs(560).find(b=>b.operation==='damage-up').durationSeconds,undefined);
 assert.equal(bs(1812)[0].trigger.delaySeconds,20);assert.equal(bs(1812)[0].durationSeconds,undefined);assert.equal(bs(849)[0].whileStatus,'rage');assert.equal(bs(849)[0].statusKind,'abnormal');
 for(const n of [109,1364]){assert.equal(bs(n)[0].lifetime,'permanent');assert.equal(bs(n)[0].durationSeconds,undefined);}for(const n of [105,210,219,1028,1103]){assert.equal(bs(n)[0].durationSeconds,40);assert.equal(bs(n)[0].stacking,'highest-active-buff-of-same-type-only');}
 for(const n of [1754,1755]){const b=bs(n)[0];assert.equal(b.grant.providerSkillId,source(1755).id);assert.equal(b.grant.recipientSkillId,source(1754).id);assert.equal(b.grant.providerMustDifferFromRecipient,true);assert.equal(b.grant.countProviderAndRecipientOnce,true);assert.equal(b.grant.stacking,'one-per-same-named-provider-skill');}
});

test('automatic wall magic and casting-condition benefits preserve actual damage types and uncovered counter effect',()=>{
 for(const b of bs(244)){assert.equal(b.magicRole,'spell-benefit');assert.equal(b.scope.attackType,'unspecified');assert.equal(b.selection,'random-one-of-six-walls');assert.equal(b.intervalSeconds,10);assert.equal(b.durationSeconds,30);assert.equal(b.activeByDefault,false);assert.equal(b.changesResistance,false);}
 const d=detail(1497);assert.deepEqual(d.coverage.effectPartIds,['magic-reduction']);assert.deepEqual(d.coverage.conditionPartIds,['casting']);assert.equal(d.bindings.length,3);assert(entry(1497).remainingEffects.some(t=>t.includes('反击')));assert(!entry(1497).remainingConditions.some(t=>t.includes('咏唱')));
 const p=bs(1497).find(b=>b.scope.attackType==='physical');assert.equal(p.magicRole,'condition-benefit');assert.equal(p.effectIdentity,entry(1497).tagDetails['物理'].bindings[0].effectIdentity);
});

test('magic validation rejects healing/HP mixups, forced maxima, Buff/spell confusion and false damage scopes',()=>{
 const reject=(n,index,mutate)=>{const b=structuredClone(bs(n)[index]);mutate(b);assert.throws(()=>validateMagicBinding(detail(n),{},b));};
 reject(1563,1,b=>b.capPoints=2000);reject(691,0,b=>b.valuePercent=20);reject(141,0,b=>b.guaranteedCritical=true);reject(656,0,b=>b.valuePercent=50);reject(649,0,b=>b.additionalCastCount=1);reject(1480,1,b=>b.isBuff=true);reject(244,0,b=>b.scope.attackType='attack-magic');reject(1754,0,b=>b.grant.countProviderAndRecipientOnce=false);reject(185,1,b=>b.costBase='maximum-MP');reject(836,0,b=>b.group='damage');
});

function page(edits={}){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};vm.runInNewContext(read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=magic-damage'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not change user saves');}}});return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};}
test('the original magic route exposes all family groups, deduplicates search, sorts judgments and rejects stale descriptions',()=>{
 const{get,click}=page();assert.equal(get('#activeTagTitle').textContent,'魔法');assert(get('#labelTabs').innerHTML.includes('魔法（130）'));assert(get('#labelTabs').innerHTML.includes('魔力（51）'));assert(!get('#labelTabs').innerHTML.includes('魔法伤害增加（22）'));
 assert.match(get('#labelCoverage').textContent,/935.*130.*805/);assert.match(get('#judgmentSummary').textContent,/86.*44.*0/);assert.match(get('#labelResultCount').textContent,/130 \/ 130/);
 const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,71);for(const s of sections){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}
 get('#labelSearch').value='回复魔法超阶增幅';get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 130/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,2);get('#clearLabelSearch').listeners.click();
 click('#labelSubTabs','magic-damage-damage');assert.equal(get('#activeTagTitle').textContent,'魔法 · 魔法伤害增加');assert.match(get('#labelResultCount').textContent,/19 \/ 19/);click('#labelTabs','physical');assert.match(get('#labelResultCount').textContent,/230 \/ 230/);
 const edits={[`skill:${source(1563).id}`]:{effect:'用户新描述'},[`skill:${source(49).id}`]:{effect:'新魔法效果'}};const before=JSON.stringify(edits),changed=skillLabelRows(data,magic,edits);for(const n of [1563,49]){const r=changed.find(e=>e.id===source(n).id);assert.equal(r.judgment,'unknown');assert.deepEqual(r.conditionBindings,{});assert.deepEqual(r.assignedTags,[]);}assert.equal(JSON.stringify(edits),before);assert(page(edits).get('#labelTable').innerHTML.includes('描述已修改，待重新判断（2）'));
});
