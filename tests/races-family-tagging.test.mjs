import {entryBeforeClassificationSupplements} from '../scripts/classification-supplement-preservation-helpers.mjs';
import {passBeforeRemaining} from '../scripts/remaining-preservation-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {validateRaceBinding,validateRaceCoverage} from '../scripts/validate-race-labels.mjs';
import {ADDITIONAL_RACE_TAGS,partsBeforeRaces,textBeforeBoss} from './race-preservation-helpers.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8'),r=JSON.parse(read('../docs/skill-labeling-registry.json')),defs=JSON.parse(read('../docs/races-pass-definitions.json')),preserved=JSON.parse(read('../docs/races-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),source=n=>rows.find(e=>e.url.endsWith('/'+n)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),tag=k=>defs.find(d=>d.race===k).label,detail=(n,k)=>entry(n).tagDetails[tag(k)],bs=(n,k)=>detail(n,k).bindings;
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),human=['soldier','knight','sniper','sorcerer'],monster=['beast','plant','insect','bird','fish','creature'];
const expected=[['beast',13,17,19,13],['plant',10,13,14,10],['insect',9,13,13,9],['creature',14,18,20,13],['undead',13,16,18,13],['stone',8,7,8,8],['machine',9,10,14,9],['fish',12,17,18,12],['spirit',13,16,17,12],['dragon',14,16,20,14],['god',20,26,29,20],['soldier',17,24,27,14],['knight',14,21,22,11],['sniper',14,21,22,11],['sorcerer',14,17,19,11],['common',16,11,17,15]];

test('all remaining races and common mechanisms audit every canonical source and retain exact group counts',()=>{
 assert.equal(defs.length,16);const union=new Set(catalog.views.bird.displayOrder);
 for(const[k,total,groups,bindings,ready]of expected){const v=labelingView(catalog,'race-'+k),audit=JSON.parse(read('../docs/race-'+k+'-tag-audit.json'));assert.equal(v.entries.length,total,k);assert.equal(v.childKeys.length,groups,k);assert.equal(v.entries.reduce((n,e)=>n+e.tagDetails[tag(k)].bindings.length,0),bindings,k);assert.equal(v.counts.ready,ready,k);assert.equal(v.counts.partial,total-ready,k);assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(x=>x.id)).size,935);
  for(const s of rows){const a=audit.rows.find(x=>x.id===s.id);assert.equal(a.sourceHash,hash([s.id,s.url,s.name,s.effect,s.notes||'']));assert.equal(a.decision==='related',v.entries.some(e=>e.id===s.id));}
  assert.deepEqual([...new Set(v.childKeys.flatMap(g=>labelingView(catalog,g).entries.map(e=>e.id)))].sort(),v.entries.map(e=>e.id).sort());for(const e of v.entries)union.add(e.id);
 }
 assert.equal(union.size,164);assert.equal(catalog.views.bird.counts.ready,10);assert.equal(catalog.views.bird.counts.partial,0);assert.equal(catalog.entries.length,935);assert.equal(catalog.views.all.counts.ready,787);assert.equal(catalog.views.all.counts.partial,148);assert.equal(catalog.numericEffectInjection,false);
 for(const n of [84,122,269,284,289,398,418,570,619,984,1000,1014,1067,1240,1365,1366,1615,1746,1801,1802,1874,1940])assert(!union.has(source(n).id),source(n).name);
 assert.equal(catalog.views.machine.label,'机械');assert.equal(catalog.views['race-machine'].label,'机械种族');
});

test('race passes preserve all 776 previous records and 46 passes, refining only unassigned compound conditions',()=>{
 assert.equal(preserved.entries.length,776);assert.equal(preserved.tagPasses.length,46);assert.equal(r.tagPasses.length,93);
 for(const p of preserved.tagPasses)assert.equal(hash(passBeforeRemaining(r.tagPasses.find(t=>t.tag===p.tag))),p.hash,p.tag);
 for(const p of preserved.entries){const e=r.entries.find(e=>e.id===p.id);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,partsBeforeRaces(e)]),p.sourceAndPartsHash,e.name);assert.equal(hash(Object.entries(entryBeforeClassificationSupplements(e).tagDetails).filter(([t,d])=>!['Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置','装备自身数值强化','地面状态','自身倒下／战斗不能',...ADDITIONAL_RACE_TAGS].includes(t)&&d.bindings).map(([t,d])=>[t,d.bindings])),p.bindingsHash,e.name);}
 for(const s of preserved.conditionSplits){const e=r.entries.find(e=>e.id===s.skillId);assert.deepEqual(e.parts.filter(p=>s.replacementParts.some(x=>x.id===p.id)),s.replacementParts);for(const pass of r.tagPasses.filter(p=>!['装备自身数值强化','地面状态','自身倒下／战斗不能'].includes(p.tag)).map(passBeforeRemaining).filter(t=>!['Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置','装备自身数值强化','地面状态','自身倒下／战斗不能',...ADDITIONAL_RACE_TAGS].includes(t.tag)))assert(!pass.assignments.some(a=>a.skillId===e.id&&a.partIds.includes(s.originalPart.id)));}
 for(const[p,h]of Object.entries(preserved.protectedFiles))assert.equal(createHash('sha256').update(textBeforeBoss(p,read('../'+p))).digest('hex'),h);
 for(const[n,key]of [[42,'physical'],[665,'magic-damage'],[772,'ultimate'],[1191,'technique'],[1884,'critical'],[1179,'light']]){assert.strictEqual(labelingView(catalog,key).entries.find(e=>e.id===entry(n).id),entry(n));assert.equal(entry(n).judgment,'ready');}
});

test('all three eligibility sources, destroyer counter/ultimate clauses, slayer percent and caps remain separate',()=>{
 const races=['beast','plant','insect','bird','creature','undead','stone','machine','fish','spirit','dragon','god','soldier','knight','sniper','sorcerer'];
 for(let i=0;i<16;i++){const k=races[i];if(k==='bird')continue;for(const offset of[0,1]){const b=bs(41+i*2+offset,k)[0];assert.equal(b.scope.attackType,offset?'physical':'normal-attack');assert.deepEqual(b.raceRelation.races,[k]);assert.equal(b.operation,'enable-killer');assert.equal(b.valuePercent,undefined);assert.equal(b.guaranteedCritical,false);assert.equal(b.guaranteedInstantKill,false);}}
 for(const[n,k]of [[772,'god'],[789,'machine'],[860,'fish'],[889,'creature'],[1120,'undead'],[1136,'soldier'],[1336,'sniper'],[1426,'sorcerer'],[1691,'dragon'],[1815,'beast'],[1913,'knight']]){assert.deepEqual(bs(n,k).map(b=>b.scope.attackType).sort(),['counter','physical','ultimate']);assert.equal(entry(n).judgment,'ready');}
 for(const[n,k]of [[1180,'spirit'],[1213,'creature'],[1317,'god'],[1398,'beast'],[1416,'fish'],[1592,'soldier'],[1636,'knight'],[1780,'insect'],[1838,'plant'],[1930,'sniper'],[1962,'undead'],[2026,'dragon']])assert.deepEqual(bs(n,k).map(b=>[b.scope.attackType,b.operation,b.valuePercent??b.capPoints]).sort(),[['physical','damage-up',10],['physical','cap-up',2000],['ultimate','damage-up',10],['ultimate','cap-up',2000]].sort());
 assert.deepEqual(bs(1426,'sorcerer')[0].scope.enemyTypes,['sorcerer']);assert(!entry(1426).assignedTags.includes('神'));
});

test('compound race families use OR and stable effect identities across pages, never multiple applications',()=>{
 for(const[n,rs]of [[333,monster],[1557,monster],[1705,monster],[395,['god','dragon','spirit','undead']],[1354,['god','dragon','spirit','undead']],[589,['soldier','fish','dragon','stone']],[656,human],[907,human],[1102,['beast','fish','bird']],[1179,['creature','undead','spirit']]]){assert.equal(entry(n).judgment,'ready');assert.deepEqual(entry(n).remainingConditions,[]);let identities;for(const k of rs){const d=k==='bird'?entry(n).tagDetails['鸟']:detail(n,k);for(const b of d.bindings){assert.equal(b.matchingMultipleRaces,'apply-once');if(k!=='bird'){assert.deepEqual(b.raceRelation.races,rs);assert.equal(b.raceRelation.operator,'any-of');}}const ids=d.bindings.map(b=>b.effectIdentity).sort();if(identities)assert.deepEqual(ids,identities);identities=ids;}}
});

test('incoming shields, negative predicates and shared-type conditions retain their correct subjects',()=>{
 for(const[n,k,v]of [[232,'god',10],[255,'soldier',10],[257,'undead',10],[276,'sorcerer',10],[280,'dragon',10],[334,'beast',10],[347,'spirit',10],[459,'creature',10],[491,'stone',10],[591,'fish',10],[715,'machine',10],[769,'sniper',10],[1086,'plant',10],[1275,'soldier',20],[1351,'knight',10],[1388,'insect',10],[1445,'god',20],[1972,'sorcerer',20]]){const b=bs(n,k)[0];assert.equal(b.scope.direction,'incoming');assert.equal(b.scope.attackType,'unspecified');assert.equal(b.raceRelation.subject,'attacking-enemy');assert.equal(b.valuePercent,v);}
 for(const[n,incoming]of [[500,true],[832,false]]){const b=bs(n,'god')[0];assert.equal(b.raceRelation.operator,'none-of');assert.equal(b.raceRelation.subject,incoming?'attacking-enemy':'target-enemy');assert.equal(b.valuePercent,incoming?7:10);}
 for(const k of human){const b=bs(1481,k)[0];assert.equal(b.raceRelation.subject,'self');assert.equal(b.raceRelation.operator,'none-of');assert.deepEqual(b.raceRelation.races,human);assert.equal(b.scope.attackType,'unspecified');}
 assert(entry(1481).parts.filter(p=>p.kind==='condition').every(p=>p.logicalOperator==='AND'));assert.equal(entry(1481).judgment,'ready');
 for(const n of [880,1138]){const b=bs(n,'common')[0];assert.equal(b.sharedTypeMatch,'at-least-one-common-type');assert.equal(b.scope.attackType,'physical');assert.equal(b.matchingMultipleRaces,'apply-once');assert.deepEqual(b.raceRelation.races,[]);}
});

test('type additions do not acquire independent bonuses and random choices keep their candidate sets and lifetimes',()=>{
 for(const[n,k]of [[306,'stone'],[339,'dragon'],[577,'machine'],[616,'machine'],[968,'beast'],[1022,'creature'],[1233,'dragon'],[1480,'undead'],[1517,'plant'],[1520,'god'],[1800,'spirit'],[1883,'dragon']]){assert.equal(bs(n,k).length,1);const b=bs(n,k)[0];assert.equal(b.operation,'add-race');assert.equal(b.preservesExistingTypes,true);assert.equal(b.grantsOtherRaceSkills,false);assert.equal(b.grantsAirborneState,false);assert.equal(b.valuePercent,undefined);}
 for(const k of human){const b=bs(627,k)[0];assert.equal(b.operation,'add-random-race');assert.deepEqual(b.raceRelation.races,human);assert.equal(b.addedTypeCount,1);assert.equal(b.endsOn,'battle-end');assert.equal(b.selection,'one-of-candidates');}
 assert.equal(entry(627).judgment,'partial');assert(entry(627).remainingConditions.some(t=>t.includes('活动时间')));
 const random=bs(916,'common')[0];assert.equal(random.endsOn,'incapacitated');assert.equal(random.candidatePoolStatus,'unconfirmed');assert.equal(entry(916).judgment,'partial');
 const speed=bs(917,'common')[0];assert.equal(speed.movementSpeedPoints,2);assert.equal(speed.changesSctSpeed,false);assert.equal(speed.endsOn,'incapacitated');assert.equal(speed.trigger.maxTriggersPerWave,1);assert.equal(speed.stacking,'highest-active-buff-of-same-type-only');
});

test('team race membership is per unit, all-allies conditions include self, and unknown scaling is not forced to maximum',()=>{
 for(const[n,k,types]of [[1191,'machine',['skill','ultimate','counter']],[1607,'soldier',['skill','ultimate']]]){const effects=bs(n,k).filter(b=>b.operation==='count-scaled-cap-up');assert.deepEqual(effects.map(b=>b.scope.attackType).sort(),types.sort());for(const b of effects){assert.equal(b.count.includesSelf,true);assert.equal(b.capPerUnit,1000);assert.equal(b.maxCapPoints,4000);assert.equal(b.count.maxCount,4);assert.equal(b.count.eachUnitCountsOnce,true);assert.equal(b.capPoints,undefined);}}
 for(const k of ['creature','undead','spirit']){const b=bs(1462,k)[0];assert.deepEqual(b.condition.allAlliesHaveOneOfTypes,['creature','undead','spirit']);assert.equal(b.condition.includesSelf,true);assert.equal(b.condition.snapshot,'wave-start');}
 for(const[n,ks]of [[1776,human],[1799,[...human,'spirit']]])for(const k of ks){for(const b of bs(n,k)){assert.equal(b.curveStatus,'unconfirmed');assert.equal(b.maxValuePercent,20);assert.equal(b.valuePercent,undefined);assert.equal(b.count.eachUnitCountsOnce,true);}assert.equal(entry(n).judgment,'partial');assert(entry(n).remainingConditions.every(t=>t.includes('待确认')));}
 const raid=bs(1963,'god')[0];assert.equal(raid.count.metric,'allies-with-same-skill');assert.deepEqual(raid.capByCount,{2:2500,3:5000,4:7500});assert.equal(raid.otherwiseCapPoints,0);assert.equal(raid.capPoints,undefined);assert.equal(entry(1963).judgment,'ready');
});

test('Faith source relations and dragon ultimate critical eligibility stay distinct from self race addition',()=>{
 assert.equal(bs(1754,'god').length,5);
 for(const n of [1755,1756,1881,2000,2001]){const b=bs(n,'god')[0],receive=bs(1754,'god').find(x=>x.grant.providerSkillId===entry(n).id);assert.equal(b.grant.flowRole,'provide');assert.equal(receive.grant.flowRole,'receive');assert.equal(b.grant.providerEffectIdentity,receive.grant.providerEffectIdentity);for(const x of [b,receive]){assert.equal(x.grant.providerMustDifferFromRecipient,true);assert.equal(x.grant.recipientMustEquipFaith,true);assert.equal(x.grant.countProviderAndRecipientOnce,true);assert.equal(x.grant.stacking,'one-per-same-named-provider-skill');}assert.equal(entry(n).judgment,'ready');assert(!entry(n).remainingConditions.some(t=>t==='自身为神类型'||t==='提供者必须为神类型'));}
 const caps=bs(1884,'dragon');assert.equal(caps.length,2);const cap=caps.find(b=>b.operation==='cap-up'),permission=caps.find(b=>b.operation==='enable-critical');assert.equal(cap.capPoints,100000);assert.equal(cap.requiresCriticalHit,true);assert.equal(cap.trigger.event,'battle-start');assert.equal(permission.guaranteedCritical,false);assert.equal(permission.trigger,undefined);assert.equal(entry(1884).judgment,'ready');
});

test('common killer bonuses preserve their actual hit conditions, conditional cap fallback and independent weakness clauses',()=>{
 for(const[n,v]of [[206,50],[942,20],[895,20]]){const b=bs(n,'common').find(b=>b.operation==='damage-up');assert.equal(b.scope.requiresKillerHit,true);assert.equal(b.valuePercent,v);assert.equal(b.grantsKillerEligibility,false);}
 for(const[n,base]of [[1030,1000],[1071,2000],[1320,3000],[1655,5000]]){const b=bs(n,'common')[0];assert.equal(b.branches,'mutually-exclusive');assert.equal(b.capCases.find(x=>x.otherwise).capPoints,base);assert.equal(b.capCases.find(x=>!x.otherwise).capPoints,base*2);assert.equal(b.scope.equipment,undefined);assert.equal(b.capPoints,undefined);assert.equal(entry(n).judgment,'ready');}
 const gift=bs(696,'common')[0];assert.equal(gift.target,'selected-other-ally');assert.equal(gift.selection.excludeSelf,true);assert.equal(gift.selection.metric,'STR');assert.equal(gift.durationSeconds,40);assert.equal(gift.capPoints,5000);
 assert.deepEqual(bs(1516,'common').map(b=>b.partIds[0]),['killer-damage']);assert(entry(1516).assignedTags.includes('属性弱点'));assert.deepEqual(entry(1516).remainingEffects,[]);
 const shield=bs(1123,'common')[0];assert.equal(shield.condition.operator,'OR');assert.equal(shield.matchingMultipleConditions,'apply-once');assert.equal(shield.valuePercent,10);assert.equal(entry(1123).judgment,'ready');assert.deepEqual(entry(1123).remainingConditions,[]);
});

test('race validators reject swapped subjects, type conversion, invented maxima, stacking and coverage of other races',()=>{
 const reject=(n,k,index,mutate)=>{const b=structuredClone(bs(n,k)[index]);mutate(b);assert.throws(()=>validateRaceBinding(detail(n,k),{},b));};
 reject(41,'beast',0,b=>b.valuePercent=50);reject(334,'beast',0,b=>b.scope.direction='outgoing');reject(500,'god',0,b=>b.scope.attackerTypes=['god']);reject(339,'dragon',0,b=>b.preservesExistingTypes=false);reject(627,'soldier',0,b=>b.addedTypeCount=4);reject(1776,'soldier',0,b=>b.valuePercent=20);reject(1462,'spirit',0,b=>b.condition.includesSelf=false);reject(1191,'machine',1,b=>b.count.eachUnitCountsOnce=false);reject(1963,'god',0,b=>b.count.metric='target-races');reject(1754,'god',0,b=>b.grant.providerMustDifferFromRecipient=false);reject(917,'common',0,b=>b.changesSctSpeed=true);reject(1030,'common',0,b=>b.scope.equipment={weaponCount:1});reject(1123,'common',0,b=>b.matchingMultipleConditions='sum');
 const d=structuredClone(detail(395,'god'));d.coverage.conditionPartIds.push('enemy-race-dragon');assert.throws(()=>validateRaceCoverage(catalog.views['race-god'],d,{partIds:[...d.coverage.effectPartIds,...d.coverage.conditionPartIds]},entry(395)));
});

function page(key){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};vm.runInNewContext(read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag='+key},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Do not change user saves');}}});return get;}
test('all race pages keep unique totals, scoped groups, judgment sorting, search and stale-description invalidation',()=>{
 for(const[k,total,groups]of expected){const get=page('race-'+k);assert.equal(get('#activeTagTitle').textContent,tag(k));assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,85);const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,groups);for(const s of sections){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}}
 const get=page('race-god');get('#labelSearch').value='神族斩灭者';get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 20/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,4);
 const edited=skillLabelRows(data,labelingView(catalog,'race-machine'),{[`skill:${source(577).id}`]:{effect:'新描述'}}).find(e=>e.id===source(577).id);assert.equal(edited.judgment,'unknown');assert.deepEqual(edited.assignedTags,[]);assert.deepEqual(edited.conditionBindings,{});
});
