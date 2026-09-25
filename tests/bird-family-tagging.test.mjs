import {passBeforeRemaining} from '../scripts/remaining-preservation-helpers.mjs';
import {ADDITIONAL_RACE_TAGS,partsBeforeRaces,textBeforeBoss} from './race-preservation-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {validateBirdBinding,validateBirdCoverage} from '../scripts/validate-bird-labels.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8'),r=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/bird-tag-audit.json')),preserved=JSON.parse(read('../docs/bird-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),source=n=>rows.find(e=>e.url.endsWith('/'+n)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['鸟'],bs=n=>detail(n).bindings,view=labelingView(catalog,'bird');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),ns=[47,48,333,858,918,1102,1178,1557,1705,1971],monster=['beast','plant','insect','bird','fish','creature'];

test('bird audits all 935 skills, includes complete bird clauses, and excludes airborne or generic matching races',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(e=>e.id)).size,935);assert.equal(audit.matchedUnique,10);
 assert.deepEqual(view.entries.map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b),ns);assert.equal(view.childKeys.length,14);assert.equal(view.entries.reduce((n,e)=>n+e.tagDetails['鸟'].bindings.length,0),14);
 for(const s of rows){const a=audit.rows.find(e=>e.id===s.id);assert.equal(a.sourceHash,hash([s.id,s.url,s.name,s.effect,s.notes||'']));assert.equal(a.decision==='related',ns.includes(+s.url.split('/').pop()));}
 for(const n of [122,269,284,289,366,880,984,1138,1240,1366,1619])assert(!view.entries.includes(entry(n)),source(n).name);
 assert.equal(view.counts.ready,10);assert.equal(view.counts.partial,0);assert.equal(view.counts.unknown,0);
 const union=new Set(view.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)));assert.deepEqual([...union].sort(),view.entries.map(e=>e.id).sort());
});

test('bird preserves old source, 45 tag passes and bindings; only previously uncovered OR conditions are split',()=>{
 assert.equal(preserved.entries.length,772);assert.equal(preserved.tagPasses.length,45);assert.equal(r.tagPasses.length,91);
 for(const p of preserved.tagPasses)assert.equal(hash(passBeforeRemaining(r.tagPasses.find(t=>t.tag===p.tag))),p.hash,p.tag);
 for(const old of preserved.entries){const e=r.entries.find(x=>x.id===old.id),split=preserved.conditionSplits.find(x=>x.skillId===old.id);let parts=partsBeforeRaces(e);
  if(split){assert.equal(split.wasExisting,true);assert.deepEqual(e.parts.filter(p=>split.replacementParts.some(x=>x.id===p.id)),split.replacementParts);for(const t of r.tagPasses.filter(t=>t.tag!=='鸟'&&!['Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(t.tag)))assert(!t.assignments.some(a=>a.skillId===e.id&&a.partIds.includes(split.originalPart.id)));parts=parts.flatMap(p=>p.id===split.originalPart.id?[split.originalPart]:split.replacementParts.some(x=>x.id===p.id)?[]:[p]);}
  assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,parts]),old.sourceAndPartsHash,e.name);assert.equal(hash(Object.entries(e.tagDetails).filter(([t,d])=>!['鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(t)&&d.bindings).map(([t,d])=>[t,d.bindings])),old.bindingsHash,e.name);
 }
 for(const[p,h]of Object.entries(preserved.protectedFiles))assert.equal(createHash('sha256').update(textBeforeBoss(p,read('../'+p))).digest('hex'),h,p);
 assert.equal(catalog.entries.length,935);assert.equal(catalog.views.all.counts.ready,749);assert.equal(catalog.views.all.counts.partial,186);assert.equal(catalog.numericEffectInjection,false);
 for(const[n,key,tag]of [[48,'physical','物理'],[918,'magic-damage','魔法'],[1971,'ultimate','必杀相关']]){assert.strictEqual(labelingView(catalog,key).entries.find(e=>e.id===entry(n).id),entry(n));assert.equal(entry(n).judgment,'ready');for(const b of entry(n).tagDetails[tag].bindings)assert(bs(n).some(x=>x.effectIdentity===b.effectIdentity));}
});

test('normal, physical and magic killer permissions retain attack types without invented multipliers',()=>{
 for(const[n,type,rs]of [[47,'normal-attack',['bird']],[48,'physical',['bird']],[918,'attack-magic',['bird']],[333,'physical',monster],[1557,'normal-attack',monster]]){
  const b=bs(n)[0];assert.equal(b.operation,'enable-killer');assert.equal(b.scope.attackType,type);assert.deepEqual(b.scope.enemyTypes,rs);assert.equal(b.grantsKillerEligibility,true);assert.equal(b.guaranteedInstantKill,false);assert.equal(b.guaranteedCritical,false);assert.equal(b.valuePercent,undefined);
 }
 for(const n of [333,1102,1557,1705]){const e=entry(n),rs=n===1102?['beast','fish','bird']:monster;assert.equal(e.judgment,'ready');assert.deepEqual(e.remainingEffects,[]);assert.equal(e.remainingConditions.length,0);assert.deepEqual(detail(n).coverage.conditionPartIds,['enemy-race']);
  for(const p of e.parts.filter(p=>p.kind==='condition')){assert.equal(p.logicalOperator,'OR');assert.equal(p.alternativeGroup,'enemy-race-choice');}
  for(const b of bs(n)){assert.deepEqual(b.condition.raceAnyOf,rs);assert.equal(b.condition.operator,'OR');assert.equal(b.matchingMultipleRaces,'apply-once');}
 }
});

test('bird shield, mimicry, damage and cap preserve subjects, units and scope',()=>{
 const shield=bs(858)[0];assert.equal(shield.scope.direction,'incoming');assert.equal(shield.scope.attackType,'unspecified');assert.deepEqual(shield.scope.attackerTypes,['bird']);assert.equal(shield.condition.subject,'attacking-enemy');assert.equal(shield.valuePercent,10);assert.equal(shield.changesDefenseStat,false);
 const mimic=bs(1178)[0];assert.equal(mimic.operation,'add-race');assert.equal(mimic.scope.subject,'self');assert.equal(mimic.scope.addsRace,'bird');assert.equal(mimic.preservesExistingTypes,true);assert.equal(mimic.grantsAirborneState,false);assert.equal(mimic.condition,undefined);
 assert.equal(bs(1102)[0].valuePercent,10);assert.equal(bs(1102)[0].grantsKillerEligibility,false);
 assert.deepEqual(bs(1705).map(b=>[b.scope.attackType,b.operation,b.capPoints]).sort(),[['physical','cap-up',5000],['ultimate','cap-up',5000]].sort());
 assert.deepEqual(bs(1971).map(b=>[b.scope.attackType,b.operation,b.valuePercent??b.capPoints]).sort(),[['physical','damage-up',10],['physical','cap-up',2000],['ultimate','damage-up',10],['ultimate','cap-up',2000]].sort());
 for(const n of ns)for(const b of bs(n))assert.equal(b.isBuff,false);
});

test('bird validator rejects race direction, OR, duplication and permission confusion',()=>{
 const reject=(n,mutate)=>{const b=structuredClone(bs(n)[0]);mutate(b);assert.throws(()=>validateBirdBinding(detail(n),{},b));};
 reject(47,b=>b.valuePercent=50);reject(48,b=>b.guaranteedCritical=true);reject(918,b=>b.scope.attackType='ultimate');reject(858,b=>b.scope.attackType='physical');reject(858,b=>b.condition.subject='self');reject(1178,b=>b.preservesExistingTypes=false);reject(1178,b=>b.grantsAirborneState=true);reject(333,b=>b.condition.operator='AND');reject(1102,b=>b.matchingMultipleRaces='apply-per-match');reject(1705,b=>b.valuePercent=5000);
 const d=structuredClone(detail(333));d.coverage.conditionPartIds.push('enemy-race-beast');assert.throws(()=>validateBirdCoverage(view,d,{partIds:[...d.coverage.effectPartIds,...d.coverage.conditionPartIds]},entry(333)));
});

function page(){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};vm.runInNewContext(read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=bird'},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Do not change user saves');}}});return get;}
test('bird route shows 14 scoped groups and unique search counts; edited descriptions lose stale judgments',()=>{
 const get=page();assert.equal(get('#activeTagTitle').textContent,'鸟');assert.match(get('#labelCoverage').textContent,/935.*10.*925/);assert.match(get('#judgmentSummary').textContent,/10.*0.*0/);assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,83);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,14);
 get('#labelSearch').value='鸟类斩灭者';get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 10/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,4);
 const result=skillLabelRows(data,view),rank=result.map(e=>({ready:0,partial:1,unknown:2})[e.judgment]);assert.deepEqual(rank,[...rank].sort((a,b)=>a-b));
 const edits={[`skill:${source(1178).id}`]:{effect:'新描述'}},changed=skillLabelRows(data,view,edits).find(e=>e.id===source(1178).id);assert.equal(changed.judgment,'unknown');assert.deepEqual(changed.assignedTags,[]);assert.deepEqual(changed.conditionBindings,{});
});
