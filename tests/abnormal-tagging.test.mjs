import {passBeforeRemaining} from '../scripts/remaining-preservation-helpers.mjs';
import {registryBeforeCombat} from '../scripts/combat-preservation-helpers.mjs';
import {tagDetailsBeforeBreak} from './break-preservation-helpers.mjs';
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import vm from'node:vm';import{createHash}from'node:crypto';
import{SKILL_LABELING_CATALOG as catalog}from'../dist/skill-labeling-catalog.mjs';import{canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels}from'../dist/skill-labeling-model.mjs';import{partsBeforeAbnormal,validateAbnormalCoverage,validateAbnormalBinding}from'../scripts/validate-abnormal-labels.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),r=JSON.parse(read('docs/skill-labeling-registry.json')),audit=JSON.parse(read('docs/abnormal-tag-audit.json')),preserved=JSON.parse(read('docs/abnormal-preservation-2026-09-25.json')),box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),entry=n=>catalog.entries.find(e=>e.url.endsWith('/'+n)),bs=n=>entry(n).tagDetails['异常'].bindings,hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),view=labelingView(catalog,'abnormal');
const included=[90,91,92,93,94,95,96,97,98,99,100,101,124,147,148,149,150,151,173,193,194,200,212,224,226,324,331,348,381,492,560,620,632,717,746,761,831,849,873,902,923,924,940,954,983,993,1026,1045,1189,1227,1231,1270,1305,1316,1378,1463,1517,1604,1667,1729,1812,1836,1873,1990,1999,2016,2017];

test('abnormal audit covers every canonical source and all resistance, infliction, recovery, status benefits and separate debuffs',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(x=>x.id)).size,935);assert.deepEqual(view.entries.map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b),included);assert.equal(view.childKeys.length,65);assert.equal(view.entries.reduce((n,e)=>n+bs(+e.url.split('/').pop()).length,0),79);
 for(const row of rows){const a=audit.rows.find(x=>x.id===row.id);assert.equal(a.sourceHash,hash([row.id,row.url,row.name,row.effect,row.notes||'']));assert.equal(a.decision==='related',view.entries.some(e=>e.id===row.id));}
 assert.deepEqual([...new Set(view.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)))].sort(),view.entries.map(e=>e.id).sort());
 for(const n of[234,244,471,508,639,830,906,1250,1312,1616,1753,1879,175,398,418,570])assert(!entry(n).assignedTags.includes('异常'));
 assert.deepEqual(view.counts,{reviewedUnique:935,relatedUnique:67,notRelatedUnique:868,ready:40,partial:27,unknown:0});assert.equal(catalog.entries.length,935);assert.equal(r.tagPasses.length,91);assert.equal(catalog.views.all.counts.ready,749);assert.equal(catalog.views.all.counts.partial,186);
});

test('all 866 prior records, 69 passes, identities, source text, bindings and calculator files remain unchanged',()=>{
 assert.equal(preserved.entries.length,866);assert.equal(preserved.tagPassHashes.length,69);
 for(const old of preserved.entries){const e=r.entries.find(e=>e.id===old.id);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,partsBeforeAbnormal(e)]),old.sourceAndPartsHash,e.name);assert.equal(hash(Object.fromEntries(Object.entries(tagDetailsBeforeBreak(e)).filter(([tag])=>tag!=='异常'))),old.tagDetailsHash,e.name);}
 for(const p of preserved.tagPassHashes)assert.equal(hash(passBeforeRemaining(r.tagPasses.find(x=>x.tag===p.tag))),p.hash,p.tag);
 for(const[p,h]of Object.entries(preserved.protectedFiles))assert.equal(createHash('sha256').update(read(p)).digest('hex'),h,p);
 assert.deepEqual(r.views.all.displayOrder.slice(0,866),preserved.previousDisplayOrder);assert.equal(catalog.numericEffectInjection,false);
 const before={...r,entries:r.entries.filter(e=>preserved.entries.some(p=>p.id===e.id)).map(e=>({...e,parts:partsBeforeAbnormal(e)})),tagPasses:r.tagPasses.filter(p=>!['异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置'].includes(p.tag))};const prior=resolveSkillLabels(before);assert.equal(prior.filter(e=>e.judgment==='ready').length,571);
 const currentBeforeBreak=resolveSkillLabels({...registryBeforeCombat(r),tagPasses:registryBeforeCombat(r).tagPasses.filter(p=>p.tag!=='Break')});const promoted=prior.filter(e=>e.judgment==='partial'&&currentBeforeBreak.find(x=>x.id===e.id).judgment==='ready').map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b);assert.deepEqual(promoted,[173,324,717,902,924,940,1026,1045,1227,1463,1517,1667,1729,1990,2017]);for(const e of prior.filter(e=>e.judgment==='ready'))assert.equal(entry(+e.url.split('/').pop()).judgment,'ready');
});

test('resistance grades, weakness removal, conditional armor, cured-type Buff and single-use barrier retain distinct semantics',()=>{
 for(const n of[90,91,92,93,94,96,97,98,99,100,101]){const b=bs(n)[0];assert.equal(b.resistanceSteps,n<96?1:2);assert.equal(b.guaranteesImmunity,false);assert.equal(b.valuePercent,undefined);assert.equal(entry(n).judgment,'ready');}
 assert.equal(bs(95)[0].resistanceSteps,undefined);assert.equal(entry(95).judgment,'partial');assert.equal(bs(1836)[0].scope.status,'freeze');assert.equal(bs(1999)[0].scope.status,'rage');
 for(const n of[940,1026,1045,1227,1990]){const b=bs(n)[0],old=entry(n).tagDetails['铠甲'].bindings[0];assert.equal(b.effectIdentity,old.effectIdentity);assert.deepEqual(b.scope.equipment.armorTypesAnyOf,['armor','clothes','robe']);assert.equal(b.scope.equipment.requiresActuallyEquipped,true);assert.equal(b.perMatchingArmorStacking,false);assert.equal(entry(n).judgment,'ready');}
 const weak=bs(492)[0];assert.equal(weak.appliesOnlyToExistingWeakness,true);assert.equal(weak.changesNonWeakResistances,false);assert.equal(weak.includesSpecialStatuses,false);
 const cure=bs(200)[0];assert.equal(cure.durationSeconds,40);assert.equal(cure.scope.status,'just-cured-basic-status');assert.equal(cure.simultaneouslyRaisesAllStatuses,false);assert.equal(cure.removesAilment,false);assert.equal(cure.stacking,'highest-active-buff-of-same-type-only');
 const barrier=bs(324)[0];assert.equal(barrier.blocks,1);assert.equal(barrier.lifetime,'until-first-blocked-abnormal-status');assert.equal(barrier.includesSpecialStatuses,false);assert.equal(barrier.isBuff,false);
});

test('status applications preserve proc attempts, attack/event sources, recipients and unresolved magnitudes',()=>{
 for(const n of[147,148,149,150,151]){const b=bs(n)[0];assert.equal(b.chancePercent,3);assert.equal(b.chanceMeaning,'application-attempt');assert.equal(b.trigger.event,'normal-attack-hit');assert.equal(b.respectsTargetStatusResistance,true);assert.equal(b.statusDurationStatus,'unconfirmed');assert.equal(entry(n).judgment,'partial');assert(!entry(n).remainingConditions.some(t=>t.includes('普通攻击')));assert(entry(n).assignedTags.includes('普通攻击'));}
 assert.equal(bs(226)[0].chancePercent,undefined);assert.equal(bs(226)[0].chanceStatus,'unconfirmed');assert.equal(bs(923)[0].trigger.event,'counter-hit');assert.equal(bs(1305)[0].target,'enemy-who-defeated-self');assert.equal(bs(1305)[0].statusMeaning,'prevents-HP-recovery');assert.equal(bs(1316)[0].scope.direction,'target-incoming');
 assert.equal(bs(1873)[0].periodicDamage.minimumRemainingHP,1);assert.equal(entry(1873).judgment,'partial');assert.equal(entry(126).tagDetails.Break.bindings[0].changesParalysisResistance,false);assert.equal(entry(126).tagDetails.Break.bindings[0].changesBreakDamage,false);
 assert.equal(bs(193)[0].operation,'status-recovery-time-down');assert.equal(bs(224)[0].operation,'status-recovery-speed-up');assert.equal(bs(1667)[0].operation,'status-recovery-speed-down');assert.equal(bs(1667)[0].valuePercent,20);assert.equal(bs(1667)[0].convertsToDurationPercent,false);
 for(const n of[95,126,147,148,149,150,151,193,224,226,620,849,923,1305,1316,1378,1873])assert.equal(entry(n).judgment,'partial');
});

test('status predicates distinguish self, target and attacker, basic ailments and debuffs, and display-only independent effects',()=>{
 for(const n of[173,717,902,924,1463,1729]){const d=entry(n).tagDetails['异常'];for(const b of d.bindings){assert.equal(b.abnormalRole,'condition-benefit');assert(b.partIds.every(id=>!d.coverage.effectPartIds.includes(id)));}assert.equal(entry(n).judgment,'ready');}
 assert.equal(bs(717)[0].statusPredicate.subject,'self');assert.equal(bs(902)[0].statusPredicate.meansNoDebuffs,false);assert.equal(bs(1463)[0].statusPredicate.meansAilmentCount,false);assert.equal(bs(1463)[0].statusPredicate.count,2);assert.equal(bs(873)[0].statusPredicate.subject,'attacking-enemy');assert(!entry(873).assignedTags.includes('伤害减少'));
 for(const n of[124,331,761,226])assert(!entry(n).assignedTags.includes('伤害增加'));
 for(const n of[381,1604]){const b=bs(n).find(b=>b.operation==='apply-element-resistance-down');assert.equal(b.changesAilmentResistance,false);assert.equal(b.resistancePoints,10);assert.equal(b.resistanceSteps,undefined);assert.equal(b.scope.elements,undefined);}
 for(const n of[632,954,983,993]){assert.equal(bs(n)[0].guaranteedImmunity,false);assert.equal(bs(n)[0].scope.source,'active-skill');}
 for(const n of[560,831]){assert.equal(bs(n)[0].scope.status,undefined);assert.equal(bs(n)[0].lockDurationSeconds??bs(n)[0].lockSeconds,30);}
 const slow=bs(1378).find(b=>b.abnormalRole==='context-only');assert(slow);assert(!entry(1378).tagDetails['异常'].coverage.effectPartIds.includes('physical-damage'));assert.equal(bs(1231)[0].activeByDefault,false);assert.equal(bs(1231)[0].mutuallyExclusiveWith.length,3);
});

test('validation rejects false immunity, wrong resistance units, expanded state conditions and independent effect completion',()=>{
 for(const a of r.tagPasses.find(p=>p.tag==='异常').assignments){const e=r.entries.find(e=>e.id===a.skillId),d=e.tagDetails['异常'];validateAbnormalCoverage(catalog.views.abnormal,d,a,e);for(const b of d.bindings)validateAbnormalBinding(d,a,b);}
 const reject=(n,change,i=0)=>{const d=entry(n).tagDetails['异常'],b=structuredClone(bs(n)[i]),a=r.tagPasses.find(p=>p.tag==='异常').assignments.find(a=>a.skillId===entry(n).id);change(b);assert.throws(()=>validateAbnormalBinding(d,a,b));};
 reject(96,b=>b.guaranteesImmunity=true);reject(90,b=>b.valuePercent=1);reject(95,b=>b.resistanceSteps=1);reject(492,b=>b.changesNonWeakResistances=true);reject(324,b=>b.blocks=Infinity);reject(200,b=>b.simultaneouslyRaisesAllStatuses=true);reject(200,b=>b.stacking='sum');reject(147,b=>b.respectsTargetStatusResistance=false);reject(632,b=>b.guaranteedImmunity=true);reject(902,b=>b.statusPredicate.meansNoDebuffs=true);reject(1463,b=>b.statusPredicate.meansAilmentCount=true);reject(873,b=>b.statusPredicate.subject='self');reject(1667,b=>b.convertsToDurationPercent=true);reject(173,b=>b.abnormalRole='direct-effect');
});

function page(){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v},setAttribute(){},focus(){}});return elements.get(k)};vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=abnormal'},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Preserve user saves')}}});return get;}
test('abnormal page renders every group with stable judgment sorting, unique search counts and edited-description invalidation',()=>{
 const get=page();assert.equal(get('#activeTagTitle').textContent,'异常');assert.match(get('#judgmentSummary').textContent,/40.*27.*0/);assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,83);const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,65);for(const s of sections){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}
 get('#labelSearch').value=entry(761).name;get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/显示 1 \//);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,2);
 const edited=skillLabelRows(data,view,{['skill:'+entry(90).id]:{effect:'新效果'}}).find(e=>e.id===entry(90).id);assert.equal(edited.judgment,'unknown');assert.deepEqual(edited.assignedTags,[]);
});
