import {textBeforeCommonCalculator,readProtected} from '../scripts/calculator-preservation-helpers.mjs';
import {passBeforeRemaining,registryBeforeRemaining} from '../scripts/remaining-preservation-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,resolveSkillLabels,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {combatKeys,combatTags,validateCombatCoverage,validateCombatBinding} from '../scripts/validate-combat-labels.mjs';
import {partsBeforeCombat,tagDetailsBeforeCombat,registryBeforeCombat} from '../scripts/combat-preservation-helpers.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),registry=JSON.parse(read('docs/skill-labeling-registry.json')),preserved=JSON.parse(read('docs/combat-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const entry=n=>catalog.entries.find(e=>e.url.endsWith('/'+n)),bs=(n,k)=>entry(n).tagDetails[catalog.views[k].label].bindings,nums=es=>es.map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b);
const members={guard:[30,31,32,33,34,35,36,182,204,482],counter:[39,40,730,772,780,789,814,815,816,860,889,923,1036,1120,1136,1189,1191,1263,1281,1296,1336,1417,1426,1497,1691,1743,1815,1913],'normal-attack':[41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,147,148,149,150,151,153,154,169,177,178,179,212,226,314,907,1354,1557],'follow-up':[177,178,179,314,776,865],'hp-recovery':[29,34,110,118,133,140,153,155,158,172,183,184,199,219,220,372,389,401,440,460,493,553,682,711,816,890,966,1022,1092,1153,1271,1305,1370,1438,1446,1537,1563,1779,1982],lifesteal:[153]};
const expected={guard:[10,10,0,10],counter:[25,30,25,3],'normal-attack':[32,33,20,13],'follow-up':[6,6,2,4],'hp-recovery':[31,40,14,25],lifesteal:[1,1,0,1]};

for(const key of combatKeys)test(key+' independently audits every canonical skill and exposes only its own complete groups',()=>{
 const audit=JSON.parse(read('docs/'+key+'-tag-audit.json')),view=labelingView(catalog,key),[groups,bindings,ready,partial]=expected[key];
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(e=>e.id)).size,935);assert.deepEqual(nums(view.entries),members[key]);assert.equal(view.parent,undefined);assert.equal(view.tagKeys,undefined);assert.equal(view.separateSections,true);assert.equal(view.childKeys.length,groups);assert.equal(view.entries.reduce((n,e)=>n+e.tagDetails[view.label].bindings.length,0),bindings);assert.equal(view.counts.ready,ready);assert.equal(view.counts.partial,partial);assert.equal(view.counts.unknown,0);
 for(const row of rows){const a=audit.rows.find(x=>x.id===row.id);assert.equal(a.sourceHash,hash([row.id,row.url,row.name,row.effect,row.notes||'']));assert.equal(a.decision==='related',view.entries.some(e=>e.id===row.id));assert(a.reason);}
 assert.deepEqual([...new Set(view.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)))].sort(),view.entries.map(e=>e.id).sort());
 for(const a of registry.tagPasses.find(p=>p.tag===view.label).assignments){const e=entry(+rows.find(r=>r.id===a.skillId).url.split('/').pop()),d=e.tagDetails[view.label];validateCombatCoverage(key,view,d,a,e);for(const b of d.bindings){validateCombatBinding(key,d,a,b);for(const pending of b.pendingPartIds){assert(e.parts.some(p=>p.id===pending));assert(!registryBeforeRemaining(registry).tagPasses.some(p=>p.assignments.some(a=>a.skillId===e.id&&a.partIds.includes(pending))));}if(b.combatRole==='condition-benefit')assert(b.partIds.every(id=>!a.partIds.includes(id)));}}
});

test('all 902 previous sources, fragments, 71 passes, numeric bindings and calculator files are preserved',()=>{
 assert.equal(preserved.entries.length,902);assert.equal(preserved.tagPassHashes.length,71);assert.equal(preserved.addedParts.length,16);assert.equal(preserved.noteUpdates.length,3);
 for(const old of preserved.entries){const e=registry.entries.find(e=>e.id===old.id);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,partsBeforeCombat(e)]),old.sourceAndPartsHash,e.name);assert.equal(hash(tagDetailsBeforeCombat(e)),old.tagDetailsHash,e.name);}
 for(const p of preserved.tagPassHashes)assert.equal(hash(passBeforeRemaining(registry.tagPasses.find(x=>x.tag===p.tag))),p.hash,p.tag);
 for(const[p,h]of Object.entries(preserved.protectedFiles))assert.equal(createHash('sha256').update(textBeforeCommonCalculator(p,readProtected(p))).digest('hex'),h,p);
 assert.deepEqual(registry.views.all.displayOrder.slice(0,902),preserved.previousDisplayOrder);assert.equal(catalog.numericEffectInjection,false);assert.equal(catalog.entries.length,935);assert.equal(registry.tagPasses.length,93);assert.equal(catalog.views.all.counts.ready,787);assert.equal(catalog.views.all.counts.partial,148);
 const before=resolveSkillLabels(registryBeforeCombat(registry));assert.equal(before.filter(e=>e.judgment==='ready').length,622);for(const e of before.filter(e=>e.judgment==='ready'))assert.equal(catalog.entries.find(x=>x.id===e.id).judgment,'ready');
 assert.deepEqual(nums(before.filter(e=>e.judgment==='partial'&&resolveSkillLabels(registryBeforeRemaining(registry)).find(x=>x.id===e.id).judgment==='ready')),[199,212,682,730,780,966,1036,1153,1263,1446,1497,1743]);
});

test('guard distinguishes equipment skills, physical and magic guard, success benefits and enemy release',()=>{
 assert.equal(bs(30,'guard')[0].scope.attackType,'physical');assert.equal(bs(33,'guard')[0].scope.attackType,'attack-magic');assert.equal(entry(33).tagDetails['格挡'].coverage.conditionPartIds[0],'guard-equipped');
 for(const n of[34,35,204]){const b=bs(n,'guard')[0];assert.equal(b.combatRole,'condition-benefit');assert.equal(b.requiresEquippedSkillId,entry(30).id);assert.equal(b.trigger.event,'guard-success');assert.deepEqual(entry(n).tagDetails['格挡'].coverage.effectPartIds,[]);assert.equal(entry(n).judgment,'partial');}
 assert(entry(35).remainingEffects.some(t=>t.includes('具体回复值')));assert(entry(204).remainingConditions.some(t=>t.includes('具体SCT')));assert.equal(bs(482,'guard')[0].scope.equipment.weaponType,'spear');for(const n of[182,482]){const b=bs(n,'guard')[0];assert.equal(b.target,'target-enemy');assert.equal(b.scope.attackType,'physical');assert.equal(b.chancePercent,undefined);}
 assert(!entry(36).assignedTags.includes('Break'));assert(!entry(30).assignedTags.includes('伤害减少'));
});

test('counter retains attack direction, active-state mitigation, race eligibility and OR conditions',()=>{
 for(const[n,val]of[[780,35],[1036,50]]){const b=bs(n,'counter')[0];assert.equal(b.valuePercent,val);assert.equal(b.statePredicate.subject,'self');assert.equal(b.scope.attackType,'unspecified');assert.equal(b.combatRole,'condition-benefit');assert.equal(b.effectIdentity,bs(n,'damage-reduction')[0].effectIdentity);assert.equal(entry(n).judgment,'ready');}
 for(const[n,val]of[[1281,20],[1417,30]]){const b=bs(n,'counter')[0];assert.equal(b.scope.direction,'incoming');assert.equal(b.scope.attackType,'counter');assert.equal(b.valuePercent,val);assert(!entry(n).assignedTags.includes('伤害减少'));}
 assert.equal(bs(814,'counter').find(b=>b.operation==='cap-up').capPoints,5000);assert.equal(bs(815,'counter').find(b=>b.operation==='cap-up').capPoints,7500);assert.equal(bs(1263,'counter')[0].requiresCriticalHit,true);assert.equal(bs(1263,'counter')[0].grantsCriticalEligibility,false);
 const count=bs(1191,'counter')[0];assert.equal(count.count.includesSelf,true);assert.equal(count.capPerUnit,1000);assert.equal(count.capPoints,undefined);assert.equal(count.count.maxCount,4);
 const tier=bs(1296,'counter')[0];assert.deepEqual(tier.tiers.map(t=>[t.count,t.valuePercent]),[[2,5],[3,10],[4,15]]);assert.equal(tier.scope.attackType,'counter');assert(!entry(1296).assignedTags.includes('队伍联动'));assert(entry(1296).tagDetails['反击'].effectConditions.length);assert.equal(entry(1296).judgment,'ready');
 const action=bs(1743,'counter')[0];assert.deepEqual(action.scope.enemyActionAnyOf,['skill','counter']);assert.equal(action.scope.attackType,'skill');assert.equal(action.statePredicate.subject,'target-enemy');assert.equal(action.matchingMultipleActions,'apply-once');
 assert.equal(bs(1189,'counter')[0].prevents,'stun');assert.equal(bs(1189,'counter')[0].grantsAllAilmentImmunity,false);assert(!entry(218).assignedTags.includes('反击'));
 for(const n of[772,789,860,889,1120,1136,1336,1426,1691,1815,1913]){const b=bs(n,'counter')[0];assert.equal(b.grantsKillerEligibility,true);assert.equal(b.scope.attackType,'counter');assert.equal(b.guaranteedInstantKill,false);}
});

test('normal attacks and follow-ups keep one effect identity and separate main hits, resources and target states',()=>{
 for(const n of[177,178,179,314]){const normal=bs(n,'normal-attack')[0],follow=bs(n,'follow-up')[0];assert.equal(normal.effectIdentity,follow.effectIdentity);assert.equal(normal.combatRole,'condition-benefit');assert.equal(follow.combatRole,'direct-effect');assert.equal(follow.changesMainHitDamage,false);assert.equal(follow.changesMainHitCount,false);assert.equal(entry(n).judgment,'partial');assert(!entry(n).remainingConditions.some(t=>t==='自身发起普通攻击时'));}
 assert.equal(bs(179,'follow-up')[0].additionalHitCount,2);assert.equal(bs(178,'follow-up')[0].chanceStatus,undefined);const power=bs(314,'follow-up')[0];assert.deepEqual(power.multiplierCases,[4,8]);assert.equal(power.branchMode,'mutually-exclusive');assert.equal(power.outcomeDistributionStatus,'unconfirmed');assert.equal(power.multiplier,undefined);
 const incoming=bs(776,'follow-up')[0];assert.deepEqual(incoming.scope.attackTypeAnyOf,['follow-up','dual-wield-skill-second-hit']);assert.equal(incoming.matchingMultipleAttackTypes,'apply-once');assert.equal(incoming.appliesToAllNormalAttacks,false);assert(!entry(776).assignedTags.includes('普通攻击'));assert(!entry(776).assignedTags.includes('伤害减少'));
 assert.equal(bs(226,'normal-attack').length,1);assert.deepEqual(bs(226,'normal-attack')[0].partIds,['apply-silence']);assert.equal(entry(212).judgment,'ready');assert.equal(bs(147,'normal-attack')[0].chancePercent,3);assert.equal(bs(147,'normal-attack')[0].respectsTargetStatusResistance,true);assert(entry(147).remainingConditions.some(t=>t.includes('持续时间')));
 for(const n of[907,1354,1557]){const b=bs(n,'normal-attack')[0];assert.equal(b.matchingMultipleRaces,'apply-once');assert.equal(b.guaranteedInstantKill,false);assert.equal(b.scope.attackType,'normal-attack');}
 assert.equal(bs(169,'normal-attack')[0].referenceStat,'INT');assert.equal(bs(169,'normal-attack')[0].changesStat,false);assert.equal(bs(154,'normal-attack')[0].scope.resource,'MP');
});

test('HP recovery keeps recipients, percentage bases, outgoing versus received boosts and fixed healing caps',()=>{
 for(const[n,base,pct]of[[172,'unconfirmed',10],[372,'received-physical-damage',25]]){const b=bs(n,'hp-recovery')[0];assert.equal(b.restoreBase,base);assert.equal(b.restorePercent,pct);assert.equal(b.chanceStatus,'unconfirmed');}
 for(const[n,pct]of[[401,10],[440,25],[553,40]]){const b=bs(n,'hp-recovery')[0];assert.equal(b.healingBase,'damage-received');assert.equal(b.healingPercent,pct);}
 for(const n of[155,158]){assert.equal(bs(n,'hp-recovery')[0].restoreBase,'unconfirmed');assert(entry(n).remainingConditions.some(t=>t.includes('基数')));}
 assert.equal(bs(682,'hp-recovery')[0].condition.subject,'healing-target-ally');for(const n of[1153,1446])assert.equal(bs(n,'hp-recovery')[0].condition.subject,'self');
 const clothes=bs(966,'hp-recovery')[0];assert.equal(clothes.scope.equipment.armorType,'clothes');assert.equal(clothes.scope.equipment.requiresActuallyEquipped,true);assert.equal(clothes.appliesToPassiveRegeneration,false);assert.equal(clothes.increasesHealingDealt,false);assert.equal(entry(966).judgment,'ready');
 assert.equal(bs(1537,'hp-recovery')[0].operation,'healing-received-cap-up');assert.equal(bs(1537,'hp-recovery')[0].healingCapPoints,1000);assert.equal(bs(1563,'hp-recovery').find(b=>b.operation==='healing-cap-up').healingCapPoints,2000);assert.equal(bs(1982,'hp-recovery')[0].healingCapPoints,1500);
 const pair=bs(1271,'hp-recovery')[0];assert.equal(pair.target,'paired-living-ally');assert.equal(pair.pair.otherEquippedCount,1);assert.equal(pair.pair.targetMustBeAlive,true);assert.equal(pair.resetScope,'pair');assert.equal(pair.trigger.actor,'self');assert.equal(pair.maxTriggers,1);assert.equal(pair.amountStatus,'unconfirmed');
 const revival=bs(183,'hp-recovery')[0];assert.equal(revival.healingMode,'revival-initial-hp');assert.equal(revival.initialHpPercent,10);assert.equal(revival.requiresIncapacitated,true);for(const n of[184,389])assert.equal(bs(n,'hp-recovery')[0].doesRevive,false);
 const sct=bs(199,'hp-recovery')[0];assert.equal(sct.combatRole,'condition-benefit');assert.equal(sct.restoreSeconds,3);assert.equal(sct.trigger.requiresHpRecoveryCapability,true);assert.equal(sct.trigger.passiveRegenCounts,false);
 assert.equal(bs(1305,'hp-recovery')[0].target,'enemy-who-defeated-self');assert.equal(bs(1305,'hp-recovery')[0].requiresStatus,'disease');assert(entry(1305).remainingConditions.some(t=>t.includes('概率')));
});

test('regeneration and lifesteal do not invent values, Buff durations, maximum HP or trigger probabilities',()=>{
 const permanent=bs(110,'hp-recovery')[0],opening=bs(1092,'hp-recovery')[0],low=bs(219,'hp-recovery')[0];assert.equal(permanent.lifetime,'permanent');assert.equal(permanent.durationSeconds,undefined);assert.equal(opening.durationSeconds,40);assert.equal(low.durationSeconds,30);for(const b of[permanent,opening,low]){assert.equal(b.intervalSeconds,6);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');assert.equal(b.amountStatus,'unconfirmed');}
 const talk=bs(220,'hp-recovery')[0];assert.equal(talk.intervalSeconds,6);assert.equal(talk.chancePercent,30);assert.equal(talk.guaranteedEveryTick,false);assert.equal(talk.isBuff,false);
 const chaos=bs(1370,'hp-recovery')[0];assert.equal(chaos.intervalSeconds,10);assert.equal(chaos.maxTriggers,1);assert.equal(chaos.resetScope,'wave');assert.equal(chaos.durationSeconds,undefined);assert.equal(chaos.chanceStatus,'unconfirmed');
 const str=bs(1779,'hp-recovery')[0];assert.equal(str.referenceStat,'STR');assert.equal(str.changesStat,false);assert.equal(str.formulaStatus,'unconfirmed');assert.equal(str.specialHealingExceptionsStatus,'unconfirmed');assert.equal(str.valuePercent,undefined);
 const drain=bs(153,'lifesteal')[0];assert.equal(drain.restorePercent,20);assert.equal(drain.restoreBase,'damage-dealt');assert.equal(drain.scope.resource,'HP');assert.equal(drain.chanceStatus,'unconfirmed');assert.equal(drain.chancePercent,undefined);assert.equal(drain.effectIdentity,bs(153,'hp-recovery')[0].effectIdentity);assert.equal(drain.effectIdentity,bs(153,'normal-attack')[0].effectIdentity);assert(!entry(154).assignedTags.includes('吸血'));assert(!entry(29).assignedTags.includes('吸血'));
 for(const n of[29,34,110,118,172,184,219,220,389,493,816,890,1022,1092,1271,1370,1779])assert.equal(entry(n).judgment,'partial');
});

test('generic mitigation is independently re-audited without merging typed reductions or losing conditions',()=>{
 const a=JSON.parse(read('docs/damage-reduction-recheck-2026-09-25.json')),view=labelingView(catalog,'damage-reduction');assert.equal(a.rows.length,935);assert.deepEqual(nums(view.entries),[389,628,655,699,731,780,859,976,992,1036,1075,1478,1481,1490]);assert.equal(view.childKeys.length,8);assert.equal(view.counts.ready,11);assert.equal(view.counts.partial,3);
 for(const row of rows){const d=a.rows.find(x=>x.id===row.id);assert.equal(d.sourceHash,hash([row.id,row.url,row.name,row.effect,row.notes||'']));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 for(const n of[30,33,104,105,776,873,1281,1417,1497])assert(!entry(n).assignedTags.includes('伤害减少'));assert(entry(628).remainingConditions.length);assert.equal(entry(1075).judgment,'ready');assert.equal(entry(699).judgment,'ready');
});

function page(key){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v},setAttribute(){},focus(){}});return elements.get(k);};vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag='+key},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('User saves must be preserved');}}});return get;}
test('six independent routes render all groups, stable status order, deduplicated search and stale-description invalidation',()=>{
 for(const key of combatKeys){const get=page(key),v=catalog.views[key];assert.equal(get('#activeTagTitle').textContent,v.label);assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,85);const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,v.childKeys.length);for(const section of sections){const ranks=[...section.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}const n=members[key][0];get('#labelSearch').value=entry(n).name;get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/显示 \d+ \/ \d+ 个技能（去重）/);const changed=skillLabelRows(data,labelingView(catalog,key),{['skill:'+entry(n).id]:{effect:'用户改写后的新效果'}}).find(e=>e.id===entry(n).id);assert.equal(changed.judgment,'unknown');assert.deepEqual(changed.assignedTags,[]);}
 const get=page('counter');get('#labelSearch').value=entry(814).name;get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/显示 1 \//);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,2);
});

test('validation rejects wrong resources, invented values, collapsed OR scopes and false completion',()=>{
 const reject=(n,k,edit)=>{const e=entry(n),d=e.tagDetails[catalog.views[k].label],a=registry.tagPasses.find(p=>p.tag===catalog.views[k].label).assignments.find(a=>a.skillId===e.id),b=structuredClone(bs(n,k)[0]);edit(b);assert.throws(()=>validateCombatBinding(k,d,a,b));};
 reject(153,'lifesteal',b=>b.scope.resource='MP');reject(153,'lifesteal',b=>b.restoreBase='maximum-HP');reject(153,'lifesteal',b=>b.chancePercent=20);reject(776,'follow-up',b=>b.matchingMultipleAttackTypes='stack');reject(314,'follow-up',b=>b.branchMode='sum');reject(179,'follow-up',b=>b.changesMainHitCount=true);reject(1743,'counter',b=>b.statePredicate.subject='self');reject(1281,'counter',b=>b.scope.attackType='unspecified');reject(1189,'counter',b=>b.grantsAllAilmentImmunity=true);reject(1191,'counter',b=>b.capPoints=4000);reject(1296,'counter',b=>b.valuePercent=15);reject(110,'hp-recovery',b=>b.stacking='sum');reject(1370,'hp-recovery',b=>b.durationSeconds=20);reject(1779,'hp-recovery',b=>b.valuePercent=10);reject(1537,'hp-recovery',b=>b.affectsRecipientMaximumHP=true);reject(1271,'hp-recovery',b=>b.resetScope='wave');reject(34,'guard',b=>b.combatRole='direct-effect');
});
