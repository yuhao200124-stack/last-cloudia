import {textBeforeCommonCalculator} from '../scripts/calculator-preservation-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,resolveSkillLabels,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {registryBeforeClassificationSupplements} from '../scripts/classification-supplement-preservation-helpers.mjs';
import {validateClassificationContext,validateMatchingElement,validateSupplementBinding} from '../scripts/validate-classification-supplements.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const registry=JSON.parse(read('docs/skill-labeling-registry.json')),manifest=JSON.parse(read('docs/classification-supplement-preservation-2026-09-25.json')),audit=JSON.parse(read('docs/classification-supplement-audit.json'));
const box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const entry=n=>catalog.entries.find(e=>e.url.endsWith('/'+n)),detail=(n,t)=>entry(n).tagDetails[t],bs=(n,t)=>detail(n,t).bindings;
const assignment=(n,t)=>registry.tagPasses.find(p=>p.tag===t).assignments.find(a=>a.skillId===entry(n).id);
const nums=entries=>entries.map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b);
const newRoots=[['equipment-stat','装备自身数值强化',[176,293,599,641,775,823,828,1059,1515,1690,1940],28,11],['grounded','地面状态',[618],1,1],['self-incapacitated','自身倒下／战斗不能',[183,431,916,917,939,948,1009,1270,1271,1305,1316,1378],15,6]];
test('the 935-skill audit covers the eight requested topics and all three independent roots',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(e=>e.id)).size,935);
 assert.deepEqual(Object.fromEntries(Object.entries(audit.topics).map(([k,v])=>[k,v.length])),{'weapon-element-match':4,'incoming-drawback':5,accuracy:1,'stat-reference':23,'equipment-stat':11,grounded:1,'self-incapacitated':12,'required-skills':8});
 for(const r of canonicalSkillRows(data)){const a=audit.rows.find(e=>e.id===r.id);assert.equal(a.sourceHash,hash([r.id,r.url,r.name,r.effect,r.notes||'']));assert.deepEqual(a.topics.sort(),Object.keys(audit.topics).filter(k=>audit.topics[k].includes(r.id)).sort());}
 for(const[key,tag,ids,groups,ready]of newRoots){const v=labelingView(catalog,key);assert.deepEqual(nums(v.entries),ids);assert.equal(v.label,tag);assert.equal(v.parent,undefined);assert.equal(v.childKeys.length,groups);assert.equal(v.counts.ready,ready);assert.equal(v.counts.partial,ids.length-ready);const all=new Set(v.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)));assert.deepEqual([...all].sort(),v.entries.map(e=>e.id).sort());}
 assert.equal(registry.tagPasses.length,93);assert.equal(Object.values(catalog.views).filter(v=>!v.parent&&!v.hidden).length,85);assert.equal(catalog.views.party,undefined);assert.equal(catalog.numericEffectInjection,false);
});
test('all previous sources, passes, views and protected calculation files remain recoverable without numeric drift',()=>{
 const before=registryBeforeClassificationSupplements(registry);assert.equal(before.entries.length,935);assert.equal(before.tagPasses.length,90);
 for(const p of manifest.baselineEntries)assert.equal(hash(before.entries.find(e=>e.id===p.id)),p.hash,p.id);
 for(const p of manifest.baselinePasses)assert.equal(hash(before.tagPasses.find(e=>e.tag===p.tag)),p.hash,p.tag);
 for(const p of manifest.baselineViews)assert.equal(hash(before.views[p.key]),p.hash,p.key);
 for(const[p,h]of Object.entries(manifest.protectedFiles))assert.equal(createHash('sha256').update(textBeforeCommonCalculator(p,read(p))).digest('hex'),h,p);
 const previous=resolveSkillLabels(before);assert.equal(previous.filter(e=>e.judgment==='ready').length,757);
 for(const e of previous.filter(e=>e.judgment==='ready'))assert.equal(catalog.entries.find(x=>x.id===e.id).judgment,'ready');
 assert.deepEqual(nums(previous.filter(e=>e.judgment==='partial'&&catalog.entries.find(x=>x.id===e.id).judgment==='ready')),[176,183,293,431,524,599,618,641,775,823,828,938,984,1059,1066,1074,1176,1228,1272,1365,1515,1573,1583,1690,1694,1746,1775,1813,1940,1941]);
 assert.deepEqual(catalog.views.all.counts,{reviewedUnique:935,relatedUnique:935,notRelatedUnique:0,ready:787,partial:148,unknown:0});
});
test('weapon matching preserves dynamic elements, exact weapon counts and OR alternatives without duplicate bonuses',()=>{
 for(const[n,t,count]of[[938,'剑',1],[1746,'斧',1],[1746,'枪',1],[1746,'机械',1],[1573,'单手',1],[1272,'双手',2]]){
  const d=detail(n,t),a=assignment(n,t);assert.equal(entry(n).judgment,'ready');assert(a.partIds.includes('attack-matches-weapon-element'));
  for(const b of d.bindings.filter(b=>b.matchingElementReviewed)){validateMatchingElement(d,a,b);assert.equal(b.scope.equipment.weaponCount,count);assert.equal(b.scope.element,undefined);const invalid=structuredClone(b);invalid.scope.element='fire';assert.throws(()=>validateMatchingElement(d,a,invalid),/Dynamic matching/);}
 }
 const alternatives=['斧','枪','机械'].map(t=>bs(1746,t)[0]);assert.equal(new Set(alternatives.map(b=>b.effectIdentity)).size,1);for(const b of alternatives){assert.equal(b.valuePercent,15);assert.equal(b.effectStacking,'once-per-skill');assert.equal(b.perMatchingWeaponStacking,false);}
 for(const b of bs(1272,'双手')){assert.equal(b.scope.equipment.sameWeaponElement,true);assert.equal(b.scope.equipment.sameWeaponType,undefined);assert(['skill','ultimate'].includes(b.scope.attackType));}
});
test('incoming drawbacks retain their benefit owner, direction, attack type and independent duration',()=>{
 for(const[n,t]of[[1775,'攻击力'],[1775,'暴击'],[1228,'物理'],[1812,'魔法'],[1692,'魔法'],[1692,'魔抗'],[1811,'杂项']]){
  const d=detail(n,t),a=assignment(n,t),b=d.bindings.find(b=>b.classificationContext?.kind==='associated-drawback');validateClassificationContext(t,d,a,b);assert.equal(b.scope.direction,'incoming');assert.equal(b.classificationContext.isBenefit,false);assert(b.classificationContext.benefitPartIds.every(id=>a.partIds.includes(id)));
  const invalid=structuredClone(b);invalid.classificationContext.benefitPartIds=[b.partIds[0]];assert.throws(()=>validateClassificationContext(t,d,a,invalid),/drawback/);
 }
 assert.equal(bs(1775,'攻击力')[0].valuePercent,10);assert.equal(bs(1692,'魔抗').find(b=>b.operation==='incoming-damage-up').scope.attackType,'physical');
 const gain=bs(1812,'魔法').find(b=>b.operation==='damage-up'),cost=bs(1812,'魔法').find(b=>b.isDebuff);assert.equal(gain.trigger.delaySeconds,20);assert.equal(gain.durationSeconds,undefined);assert.equal(cost.appliedDurationSeconds,20);
});
test('references are classified by source stat while unknown formulas remain partial and comparisons partition equality',()=>{
 for(const[n,t,stat]of[[593,'物理','STR'],[1779,'物理','STR'],[169,'魔法','INT'],[357,'魔法','INT'],[441,'魔法','INT'],[524,'魔法','INT'],[1365,'魔法','INT'],[984,'防御','DEF'],[984,'魔抗','MND']]){
  const d=detail(n,t),a=assignment(n,t),b=d.bindings.find(b=>b.classificationContext?.kind==='stat-source');assert(b.classificationContext.sourceStats.includes(stat));validateClassificationContext(t,d,a,b);assert.equal(b.valuePercent,undefined);
 }
 for(const[n,pct,destination]of[[1074,7,'DEF'],[1813,10,'INT']]){const b=bs(n,'魔抗')[0];assert.equal(b.referenceStat,'MND');assert.equal(b.referencePercent,pct);assert.equal(b.destinationStat,destination);assert.equal(b.referenceIsConsumed,false);assert.equal(b.changesReferenceStat,false);assert.equal(entry(n).judgment,'ready');}
 for(const n of[169,357,441,593,1779]){assert.equal(entry(n).judgment,'partial');assert(entry(n).remainingConditions.some(s=>/公式|换算/.test(s)));}
 for(const n of[1066,1941])for(const[t,op]of[['物理','gte'],['魔法','lt']]){const b=bs(n,t).find(b=>b.operation==='compare-stats');assert.equal(b.comparison.operator,op);assert.equal(b.comparison.snapshot,'wave-start');assert.equal(b.comparison.branchesMutuallyExclusive,true);assert.equal(b.comparison.resultPartIds.length,1);}
 const lost=bs(984,'防御').find(b=>b.operation==='add-lost-stat-values');assert.equal(lost.additionBase,'actual-decreased-values-sum');assert.deepEqual(lost.sourceDecreasePercent,{DEF:10,MND:10});
 const hit=bs(1694,'魔法')[0];assert.equal(hit.valuePercent,15);assert.equal(hit.scope.element,'ice');assert.equal(hit.phase,'damage-calculation');assert.equal(hit.isBuff,false);assert.equal(hit.classificationContext.changesFinalSourceStat,false);
 const invalid=structuredClone(bs(593,'物理').find(b=>b.classificationContext));invalid.valuePercent=100;assert.throws(()=>validateClassificationContext('物理',detail(593,'物理'),assignment(593,'物理'),invalid),/Unknown conversion/);
});
test('equipment bases, grounded self, death recipients and required own skills remain distinct',()=>{
 for(const b of bs(176,'装备自身数值强化')){assert.equal(b.valuePercent,25);assert.equal(b.requiresDualForBaseEffect,false);assert.equal(b.target,'each-equipped-weapon');assert.equal(b.changesFinalCharacterStatByPercent,false);}
 for(const n of[293,599,641,775,823,828,1059,1515,1690,1940])for(const b of bs(n,'装备自身数值强化')){assert.equal(b.base,'equipped-item-stat');assert.equal(b.pairedEquipmentLogicalOperator,'AND');assert(b.scope.equipment.weaponType&&b.scope.equipment.armorType);}
 const grounded=bs(618,'地面状态')[0];assert.equal(grounded.condition.subject,'self');assert.equal(grounded.valuePercent,10);const bad=structuredClone(grounded);bad.condition.subject='enemy';assert.throws(()=>validateSupplementBinding('grounded',detail(618,'地面状态'),assignment(618,'地面状态'),bad),/Grounded self/);
 for(const b of bs(1271,'自身倒下／战斗不能')){assert.equal(b.target,'paired-living-ally');assert.equal(b.pair.otherEquippedCount,1);assert.equal(b.pair.targetMustBeAlive,true);assert.equal(b.maxTriggers,1);assert.equal(b.resetScope,'pair');}
 assert.equal(entry(1271).judgment,'partial');const opening=bs(431,'自身倒下／战斗不能')[0];assert.equal(opening.initialHpPercent,50);assert.equal(opening.resetScope,'quest');
 for(const n of[939,948,916,1009,917,1378])assert(bs(n,'自身倒下／战斗不能').every(b=>b.selfIncapacitation.mode==='effect-termination'));
 for(const n of[31,32,33,34,35,36,204]){const b=bs(n,'杂项').find(b=>b.requiredSelfSkills);assert.deepEqual(b.requiredSelfSkills.skillIds,[entry(30).id]);assert.equal(b.requiredSelfSkills.subject,'self');assert.equal(b.requiredSelfSkills.mustBeEquipped,true);}
 const faces=bs(1583,'杂项')[0];assert.equal(faces.requiredSelfSkills.operator,'AND');assert.equal(faces.requiredSelfSkills.skillIds.length,3);assert.deepEqual(faces.partIds,['dark-three-faces-cap']);assert.equal(faces.capPoints,3000);
 assert.equal(entry(603).judgment,'partial');assert(entry(603).assignedTags.includes('杂项'));assert.deepEqual(entry(603).remainingConditions,['命中率降低的具体幅度待确认']);
});
test('new pages preserve deduplicated search, judgment ordering, edited-description review and user saves',()=>{
 for(const[key,tag,ids,groups]of newRoots){
  const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v},setAttribute(){},focus(){}});return elements.get(k)};
  vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag='+key},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Preserve user saves')}}});
  assert.equal(get('#activeTagTitle').textContent,tag);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,groups);assert(!get('#labelTabs').innerHTML.includes('队伍联动'));
  for(const s of get('#labelTable').innerHTML.split('<section ').slice(1)){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}
  get('#labelSearch').value=entry(ids[0]).name;get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/显示 1 \/ /);
  const edited=skillLabelRows(data,labelingView(catalog,key),{['skill:'+entry(ids[0]).id]:{effect:'用户新描述'}}).find(e=>e.id===entry(ids[0]).id);assert.equal(edited.judgment,'unknown');assert.deepEqual(edited.assignedTags,[]);assert.deepEqual(edited.conditionBindings,{});
 }
});
