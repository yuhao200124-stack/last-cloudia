import {textBeforeCommonCalculator} from '../scripts/calculator-preservation-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,resolveSkillLabels,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {remainingKeys,remainingTags,validateRemainingCoverage,validateRemainingBinding} from '../scripts/validate-remaining-labels.mjs';
import {partsBeforeRemaining,tagDetailsBeforeRemaining,passBeforeRemaining,registryBeforeRemaining} from '../scripts/remaining-preservation-helpers.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),registry=JSON.parse(read('docs/skill-labeling-registry.json')),manifest=JSON.parse(read('docs/remaining-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const entry=n=>catalog.entries.find(e=>e.url.endsWith('/'+n)),bs=(n,key)=>key==='party'?Object.values(entry(n).tagDetails).flatMap(d=>(d.effectConditions||[]).map(c=>c.effectBinding)):entry(n).tagDetails[remainingTags[key]||key].bindings;
const expected={misc:[43,38,51],'element-weakness':[25,27,27],combo:[15,15,16],'enemy-defeat':[6,6,6],'battle-end':[13,10,13],aerial:[6,8,9],'back-attack':[4,5,5],'battle-time':[25,36,36],distance:[4,5,5],'hp-consumption':[4,2,4],'lethal-survival':[2,5,5],'damage-cap':[1,1,1],'trigger-limits':[28,52,52]};
for(const key of remainingKeys)test(key+' audits every source and completes only its own effect or condition fragments',()=>{
 const audit=JSON.parse(read('docs/'+key+'-tag-audit.json')),view=labelingView(catalog,key),[members,groups,bindings]=expected[key];
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(view.entries.length,members);assert.equal(view.childKeys.length,groups);assert.equal(view.entries.reduce((n,e)=>n+e.tagDetails[view.label].bindings.length,0),bindings);assert.equal(view.parent,undefined);assert.equal(view.separateSections,true);
 for(const r of rows){const a=audit.rows.find(a=>a.id===r.id);assert.equal(a.sourceHash,hash([r.id,r.url,r.name,r.effect,r.notes||'']));assert.equal(a.decision==='related',view.entries.some(e=>e.id===r.id));assert(a.reason);}
 assert.deepEqual([...new Set(view.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)))].sort(),view.entries.map(e=>e.id).sort());
 for(const a of registry.tagPasses.find(p=>p.tag===view.label).assignments){const e=registry.entries.find(e=>e.id===a.skillId),d=e.tagDetails[view.label];validateRemainingCoverage(key,view,d,a,e);for(const b of d.bindings){validateRemainingBinding(key,d,a,b);for(const id of b.pendingPartIds){assert(e.parts.some(p=>p.id===id));assert(!registry.tagPasses.some(p=>p.assignments.some(x=>x.skillId===e.id&&x.partIds.includes(id))));}}}
});
test('all previous sources, fragments, assignments and protected files survive the explicit reversible stun relocation',()=>{
 assert.equal(manifest.entries.length,920);assert.equal(manifest.tagPassHashes.length,77);assert.equal(manifest.addedParts.length,44);assert.deepEqual(manifest.changedPasses.map(p=>p.tag),['异常','Break']);
 for(const old of manifest.entries){const e=registry.entries.find(e=>e.id===old.id);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,partsBeforeRemaining(e)]),old.sourceAndPartsHash,e.name);assert.equal(hash(tagDetailsBeforeRemaining(e)),old.tagDetailsHash,e.name);}
 for(const old of manifest.tagPassHashes)assert.equal(hash(passBeforeRemaining(registry.tagPasses.find(p=>p.tag===old.tag))),old.hash,old.tag);
 for(const[p,h]of Object.entries(manifest.protectedFiles))assert.equal(createHash('sha256').update(textBeforeCommonCalculator(p,read(p))).digest('hex'),h,p);
 assert.deepEqual(registry.views.all.displayOrder.slice(0,920),manifest.previousDisplayOrder);assert.equal(catalog.numericEffectInjection,false);assert.equal(catalog.entries.length,935);assert.equal(registry.tagPasses.length,93);assert.deepEqual(catalog.views.all.counts,{reviewedUnique:935,relatedUnique:935,notRelatedUnique:0,ready:787,partial:148,unknown:0});
 const before=resolveSkillLabels(registryBeforeRemaining(registry));assert.equal(before.filter(e=>e.judgment==='ready').length,644);for(const e of before.filter(e=>e.judgment==='ready'))assert.equal(catalog.entries.find(x=>x.id===e.id).judgment,'ready');
 assert.equal(before.filter(e=>e.judgment==='partial'&&catalog.entries.find(x=>x.id===e.id).judgment==='ready').length,131);assert(catalog.entries.filter(e=>e.judgment==='ready').every(e=>e.parts.every(p=>!/待确认|未知|尚待/.test(p.text))));
});
test('offensive stun shares Break while stun defenses remain resistance subgroups',()=>{
 for(const n of[126,809]){assert(entry(n).assignedTags.includes('Break'));assert(bs(n,'Break').some(b=>b.operation==='stun-ease-up'));assert.equal(entry(n).judgment,'partial');}
 assert(!entry(126).assignedTags.includes('异常'));assert.equal(catalog.views['abnormal-stun'].parent,'break');
 for(const n of[194,348,1189]){assert(entry(n).assignedTags.includes('异常'));assert(!entry(n).assignedTags.includes('Break'));assert(bs(n,'异常').some(b=>b.group.includes('stun-resistance')||b.group==='stun-duration-resistance'));}
 for(const n of[194,348]){assert.equal(entry(n).judgment,'partial');assert.equal(bs(n,'异常')[0].changesParalysisResistance,false);}
 assert.equal(bs(1189,'异常').at(-1).grantsAllAilmentImmunity,false);
});
test('misc keeps movement, aggro points, distinct rewards and real-clock conditions separate',()=>{
 for(const[n,resource,value]of[[187,'EXP',20],[511,'EXP',35],[188,'ZELL',20],[489,'ZELL',35],[1418,'ZELL',50]]){const b=bs(n,'misc')[0];assert.equal(b.scope.resource,resource);assert.equal(b.valuePercent,value);assert.equal(b.effectStacking,'non-stacking-same-type');assert.equal(b.effectIdentity,bs(n,'battle-end')[0].effectIdentity);}
 const aggro=bs(739,'misc')[0];assert.equal(aggro.branchMode,'mutually-exclusive');assert.deepEqual(aggro.branches.map(b=>b.priorityPoints),[1,-1]);
 for(const n of[170,171,1811]){assert.equal(bs(n,'misc')[0].valuePercent,undefined);assert.equal(Math.abs(bs(n,'misc')[0].priorityPoints),1);}
 for(const[n,start,end]of[[227,'06:00','18:00'],[228,'18:00','06:00'],[242,'18:00','06:00']]){const b=bs(n,'misc')[0];assert.deepEqual([b.realClockPredicate.startInclusive,b.realClockPredicate.endExclusive],[start,end]);assert.equal(b.realClockPredicate.basis,'game-local-clock');assert.equal(b.isBuff,false);assert.equal(entry(n).judgment,'ready');}
 for(const n of[121,174,217,546,615,617])assert.equal(entry(n).judgment,'partial');assert.equal(bs(406,'misc')[0].lifetime,'permanent');assert.equal(bs(1764,'misc')[0].valuePoints,1);assert.equal(bs(1764,'misc')[0].operation,'movement-speed-down');
});
test('actual hit predicates preserve exact 108 Hit, weakness, airborne subjects and back-attack scopes',()=>{
 const cap=bs(1232,'combo').find(b=>b.operation==='cap-up');assert.equal(cap.capPoints,108000);assert.deepEqual(cap.comboPredicate,{subject:'combo',metric:'consecutive-hit-count',operator:'eq',threshold:108});assert.equal(bs(1232,'combo')[0].comboPredicate.operator,'lte');assert.equal(bs(1232,'damage-cap')[0].effectIdentity,cap.effectIdentity);
 assert.equal(bs(628,'combo')[0].comboPredicate.metric,'consecutive-received-hit-count');assert.equal(bs(429,'combo')[0].comboPredicate.chainKey,'same-spell');assert.equal(bs(691,'combo')[0].comboPredicate.chainKey,'same-element');
 for(const n of[90,95,492,2017])assert(!entry(n).assignedTags.includes('属性弱点'));
 const air=bs(1366,'aerial');assert(air.filter(b=>b.scope.direction==='outgoing').every(b=>b.aerialPredicate.subject==='target-enemy'));assert(air.filter(b=>b.scope.direction==='incoming').every(b=>b.aerialPredicate.subject==='self'));
 assert.deepEqual(bs(268,'back-attack').map(b=>b.operation),['rate-up','damage-up']);assert.equal(bs(1295,'back-attack')[0].scope.attackType,'skill');assert.equal(bs(1295,'back-attack')[0].scope.equipment.weaponCount,2);
});
test('party counts retain exact pairs, living state, per-unit race OR and Faith grant direction',()=>{
 assert.equal(bs(976,'party')[0].partyPredicate.mode,'solo-entry');for(const n of[1547,1856])assert.equal(bs(n,'party')[0].partyPredicate.mode,'only-self-alive');
 for(const n of[754,1027,1075,1256,1271,1507,1666])for(const b of bs(n,'party'))assert.equal(b.partyPredicate.otherEquippedCount,1);
 for(const n of[1462,1776,1799])for(const b of bs(n,'party')){assert.equal(b.partyPredicate.logicalOperator,'OR-per-unit');assert.equal(b.partyPredicate.eachUnitCountsOnce,true);}
 assert.equal(bs(2028,'party')[0].partyPredicate.requiresAllOtherAlliesFemale,false);assert.deepEqual(bs(1000,'party')[0].tiers.map(t=>t.valuePercent),[10,20,30]);
 for(const n of[1755,1756,1881,2000,2001]){const provide=bs(n,'party')[0],receive=bs(1754,'party').find(b=>b.grant.providerSkillId===entry(n).id);assert.equal(provide.grant.flowRole,'provide');assert.equal(receive.grant.flowRole,'receive');assert.equal(receive.grant.providerEffectIdentity,provide.grant.providerEffectIdentity);assert.equal(receive.grant.countProviderAndRecipientOnce,true);}
 assert.equal(bs(1477,'misc')[0].grantsDamageBonus,false);for(const n of[1478,1776,1799])assert.equal(entry(n).judgment,'partial');
});
test('battle timers and trigger limits distinguish delays, growth, periodic rolls and reset ownership',()=>{
 const delayed=bs(939,'battle-time')[0];assert.equal(delayed.trigger.delaySeconds,40);assert.equal(delayed.durationSeconds,undefined);assert.equal(delayed.endsOn,'incapacitated');assert.equal(delayed.trigger.retryWhenIncapacitatedSeconds,40);
 assert.equal(bs(1812,'battle-time').find(b=>b.partIds.includes('magic-damage')).isBuff,false);for(const b of bs(244,'battle-time'))assert.equal(b.battleClock.simultaneousSixWalls,false);
 for(const n of[1113,1491,1629,1765,1798,1961,1981,2016])assert.equal(entry(n).judgment,'partial');assert.equal(bs(1370,'battle-time').find(b=>b.partIds.includes('attack')).trigger.chanceStatus,'unconfirmed');
 assert.equal(bs(431,'trigger-limits')[0].triggerLimit.scope,'quest');for(const b of bs(1271,'trigger-limits')){assert.equal(b.triggerLimit.scope,'pair');assert.equal(b.triggerLimit.eachHolderHasSeparateUse,false);}
 for(const n of[183,219,389,493,753,890,917,1022,1370,1858,1998])for(const b of bs(n,'trigger-limits'))assert.equal(b.triggerLimit.scope,'wave');
 for(const n of[1629,1981])assert.equal(bs(n,'trigger-limits')[0].grantsMaximumAtStart,false);for(const n of[1617,1773])assert.equal(bs(n,'trigger-limits')[0].triggerLimit.refreshStatus,'unconfirmed');
});
test('resource costs, proximity and survival retain unresolved parameters and never become unrelated bonuses',()=>{
 for(const n of[346,499,1548,1839]){const b=bs(n,'hp-consumption')[0];assert.equal(b.changesMaximumHP,false);assert.equal(b.minimumHpStatus,'unconfirmed');assert.equal(b.minimumHp,undefined);assert.equal(entry(n).judgment,'partial');}
 assert(!entry(1873).assignedTags.includes('HP持续消耗'));assert.equal(bs(1873,'battle-time')[0].periodicDamage.minimumRemainingHP,1);
 assert.equal(bs(634,'distance')[0].distancePredicate.other,'attacking-enemy');assert.equal(bs(1659,'distance')[0].distancePredicate.direction,'closer-stronger');
 assert.equal(bs(184,'lethal-survival')[0].doesRevive,false);assert.equal(bs(184,'lethal-survival')[0].resetScopeStatus,'unconfirmed');assert(!entry(183).assignedTags.includes('致命伤害存活'));
 for(const n of[1270,1305,1316])assert(!entry(n).assignedTags.includes('击败敌人'));
});
function page(key){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v},setAttribute(){},focus(){}});return elements.get(k)};vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag='+key},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Preserve user saves')}}});return get;}
test('all independent routes preserve stable status order, unique search totals and edited-source invalidation',()=>{
 for(const key of remainingKeys){const get=page(key),view=labelingView(catalog,key);assert.equal(get('#activeTagTitle').textContent,view.label);assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,85);const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,view.childKeys.length);for(const s of sections){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}const e=view.entries[0];get('#labelSearch').value=e.name;get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/显示 \d+ \/ \d+ 个技能（去重）/);const edited=skillLabelRows(data,view,{['skill:'+e.id]:{effect:'用户改写效果'}}).find(x=>x.id===e.id);assert.equal(edited.judgment,'unknown');assert.deepEqual(edited.assignedTags,[]);}
});
