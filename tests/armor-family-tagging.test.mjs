import {textBeforeCommonCalculator} from '../scripts/calculator-preservation-helpers.mjs';
import {entryBeforeClassificationSupplements} from '../scripts/classification-supplement-preservation-helpers.mjs';
import {passBeforeRemaining} from '../scripts/remaining-preservation-helpers.mjs';
import {partsBeforeAbnormal} from '../scripts/validate-abnormal-labels.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
import {armorTypes,validateArmorCoverage,validateArmorBinding} from '../scripts/validate-armor-labels.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),r=JSON.parse(read('docs/skill-labeling-registry.json')),defs=JSON.parse(read('docs/armor-pass-definitions.json')),preserved=JSON.parse(read('docs/armor-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),source=n=>rows.find(e=>e.url.endsWith('/'+n)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),label=k=>defs.find(d=>d.key===k).label,detail=(n,k)=>entry(n).tagDetails[label(k)],bs=(n,k)=>detail(n,k).bindings,nums=es=>es.map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const common=[778,874,940,1026,1045,1227,1989,1990],specific={armor:[87,246,290,293,638,775,1013,1490,1606,1690],clothes:[88,265,388,599,823,828,875,966,1059,1350,1483,1515,1797,1848,1940],robe:[89,258,428,641,706,1093,1562,1813]},expected=[['armor',18,19,29,18],['clothes',23,31,46,23],['robe',16,15,24,16]];

test('three armor passes audit all 935 sources with exact membership, complete groups and common armor scope',()=>{
 const union=new Set();for(const[k,total,groups,bindings,ready]of expected){const v=labelingView(catalog,k),audit=JSON.parse(read('docs/'+k+'-tag-audit.json'));assert.deepEqual(nums(v.entries),[...specific[k],...common].sort((a,b)=>a-b));assert.equal(v.entries.length,total);assert.equal(v.childKeys.length,groups);assert.equal(v.entries.reduce((n,e)=>n+e.tagDetails[label(k)].bindings.length,0),bindings);assert.equal(v.counts.ready,ready);assert.equal(v.counts.partial,total-ready);assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(e=>e.id)).size,935);
 for(const s of rows){const a=audit.rows.find(e=>e.id===s.id);assert.equal(a.sourceHash,hash([s.id,s.url,s.name,s.effect,s.notes||'']));assert.equal(a.decision==='related',v.entries.some(e=>e.id===s.id));}
 assert.deepEqual([...new Set(v.childKeys.flatMap(c=>labelingView(catalog,c).entries.map(e=>e.id)))].sort(),v.entries.map(e=>e.id).sort());for(const e of v.entries)union.add(e.id);
 for(const n of [37,181,304,577,683,700,710,731,887,1171,1190,1250,1306,1312,1318,1381,1395,1461,1828])assert(!v.entries.includes(entry(n)),k+'/'+n);
 }assert.equal(union.size,41);assert.equal(catalog.entries.length,935);assert.equal(catalog.views.all.counts.ready,787);assert.equal(catalog.views.all.counts.partial,148);assert.equal(catalog.numericEffectInjection,false);
});

test('armor expansion retains every previous record, source, fragment, binding, tag assignment and calculator file',()=>{
 assert.equal(preserved.entries.length,843);assert.equal(preserved.tagPassHashes.length,63);assert.equal(r.tagPasses.length,93);
 for(const old of preserved.entries){const e=r.entries.find(e=>e.id===old.id);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,partsBeforeAbnormal(e).filter(p=>p.id!=='mnd-healing-reference')]),old.sourceAndPartsHash,e.name);assert.equal(hash(Object.entries(entryBeforeClassificationSupplements(e).tagDetails).filter(([t,d])=>!['铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置','装备自身数值强化','地面状态','自身倒下／战斗不能'].includes(t)&&d.bindings).map(([t,d])=>[t,d.bindings])),old.bindingsHash,e.name);}
 for(const p of preserved.tagPassHashes)assert.equal(hash(passBeforeRemaining(r.tagPasses.find(x=>x.tag===p.tag))),p.hash,p.tag);
 for(const[p,h]of Object.entries(preserved.protectedFiles))assert.equal(createHash('sha256').update(textBeforeCommonCalculator(p,read(p))).digest('hex'),h,p);
});

test('armor equip permissions do not equip items or fulfill wearer conditions; armor passes cover conditions only',()=>{
 for(const[n,k]of[[87,'armor'],[88,'clothes'],[89,'robe']]){const b=bs(n,k)[0];assert.equal(b.operation,'allow-armor-type');assert.equal(b.grantsArmorType,k);assert.equal(b.automaticallyEquipsArmor,false);assert.equal(b.scope.equipment,undefined);assert.equal(detail(n,k).condition,undefined);assert.equal(entry(n).judgment,'ready');}
 const soul=bs(1013,'armor');assert.equal(soul.length,2);assert.equal(soul.find(b=>b.operation==='incoming-damage-down').scope.equipment.requiresActuallyEquipped,true);assert.equal(entry(1013).judgment,'ready');
 for(const k of armorTypes)for(const a of r.tagPasses.find(p=>p.tag===label(k)).assignments){const e=r.entries.find(e=>e.id===a.skillId),d=e.tagDetails[label(k)];for(const b of d.bindings)if(b.armorRole==='condition-benefit')assert(b.partIds.every(id=>!a.partIds.includes(id)));for(const p of a.partIds)assert(e.parts.find(x=>x.id===p).kind==='condition'||d.coverage.permissionPartIds.includes(p));}
 const previous=structuredClone(r);previous.tagPasses=previous.tagPasses.filter(p=>!defs.some(d=>d.label===p.tag));const old=resolveSkillLabels(previous);for(const n of [1013,1606,1797,1848,1350,1483,1093,1562,778,874,1989,246,290])assert.equal(old.find(e=>e.id===source(n).id).judgment,'partial');
});

test('paired weapon and armor is AND and raises item stats, with unchanged independent mechanism judgments',()=>{
 for(const[n,k,w,wp,ap]of[[293,'armor','sword',50,50],[775,'armor','sword',100,100],[1690,'armor','axe',50,50],[599,'clothes','claw',50,30],[823,'clothes','sword',100,50],[828,'clothes','sword',50,30],[1059,'clothes','staff',50,30],[1515,'clothes','spear',50,30],[1940,'clothes','machine',50,30],[641,'robe','staff',50,50]]){
  const bindings=bs(n,k);for(const b of bindings){assert.equal(b.operation,'equipment-stat-up');assert.equal(b.base,'equipped-item-stat');assert.equal(b.scope.equipment.weaponType,w);assert.equal(b.scope.equipment.armorType,k);assert.equal(b.scope.equipment.minimumMatchingWeaponCount,1);assert.equal(b.scope.equipment.weaponCount,undefined);assert.equal(b.pairedEquipmentLogicalOperator,'AND');assert.equal(b.valuePercent,b.target==='equipped-armor'?ap:wp);}
  assert.equal(entry(n).judgment,'ready');assert.deepEqual(entry(n).remainingConditions,[]);assert(!entry(n).remainingConditions.some(t=>t.includes('同时装备')));
 }
 for(const n of [265,388,875]){const mnd=bs(n,'clothes').find(b=>b.stat==='MND');assert.equal(mnd.target,'self');assert.equal(mnd.base,'character-base-stat');assert(!entry(n).remainingEffects.some(t=>t.includes('魔抗')));}
});

test('common armor clauses are any-of predicates with one shared effect, distinct from empty armor or a second weapon',()=>{
 for(const n of common){let identities;for(const k of armorTypes){const d=detail(n,k);assert.equal(d.condition.mode,'any-armor-equipped');assert.equal(d.condition.logicalOperator,'OR');assert.deepEqual(d.condition.armorTypesAnyOf,armorTypes);assert.equal(d.condition.requiredArmorType,undefined);assert.equal(d.condition.armorSlotWeaponQualifies,false);for(const b of d.bindings){assert.deepEqual(b.scope.equipment.armorTypesAnyOf,armorTypes);assert.equal(b.scope.equipment.armorType,undefined);assert.equal(b.effectStacking,'once-per-skill');assert.equal(b.perMatchingArmorStacking,false);}const ids=d.bindings.map(b=>b.effectIdentity);if(identities)assert.deepEqual(ids,identities);identities=ids;}}
 for(const[n,v]of[[778,15],[874,10]]){assert.equal(bs(n,'armor')[0].stat,'HP');assert.equal(bs(n,'armor')[0].valuePercent,v);assert.equal(bs(n,'armor')[0].base,'maximum-HP');assert.equal(entry(n).judgment,'ready');}
 for(const n of [940,1026,1045,1227,1990]){const b=bs(n,'armor')[0];assert.equal(b.resistanceSteps,1);assert.equal(b.valuePercent,undefined);assert.equal(b.guaranteesImmunity,false);assert.equal(entry(n).judgment,'ready');assert.deepEqual(entry(n).remainingConditions,[]);assert.equal(entry(n).remainingEffects.length,0);}
});

test('armor benefits preserve damage directions, Boss attacker scope, received active healing and opening MND reference',()=>{
 assert.deepEqual(bs(1606,'armor').map(b=>[b.scope.direction,b.scope.attackType,b.valuePercent]).sort(),[['incoming','physical',10],['incoming','attack-magic',10]].sort());
 assert.deepEqual(bs(1989,'armor').map(b=>[b.scope.direction,b.scope.attackType,b.valuePercent]).sort(),[['incoming','ultimate',20],['incoming','attack-magic',20]].sort());
 const boss=bs(638,'armor').find(b=>b.scope.attackerType==='boss');assert.equal(boss.scope.attackType,'unspecified');assert.equal(boss.scope.enemyType,undefined);assert(bs(638,'armor').some(b=>b.scope.attackType==='physical'&&b.scope.attackerType===undefined));assert.equal(entry(638).judgment,'ready');assert.deepEqual(entry(638).remainingConditions,[]);
 for(const n of [1797,1848]){const b=bs(n,'clothes');assert(b.some(b=>b.scope.direction==='incoming'&&b.scope.attackType==='attack-magic'));assert(b.some(b=>b.scope.direction==='outgoing'&&b.scope.attackType==='physical'));}
 const heal=bs(966,'clothes')[0];assert.equal(heal.operation,'healing-received-up');assert.equal(heal.target,'self');assert.equal(heal.scope.healingSource,'active-skill');assert.equal(heal.valuePercent,10);assert.equal(heal.increasesHealingDealt,false);assert.equal(heal.appliesToPassiveRegeneration,false);assert.deepEqual(entry(966).remainingConditions,[]);assert.equal(entry(966).judgment,'ready');assert(entry(966).assignedTags.includes('HP回复'));
 const ref=bs(1813,'robe')[0];assert.equal(ref.operation,'add-stat-reference');assert.equal(ref.referenceStat,'MND');assert.equal(ref.referencePercent,10);assert.equal(ref.stat,'INT');assert.equal(ref.referenceIsConsumed,false);assert.equal(ref.changesReferenceStat,false);assert.equal(ref.valuePercent,undefined);assert.equal(ref.trigger.event,'battle-start');assert.equal(ref.isBuff,false);assert.equal(ref.durationSeconds,undefined);assert.equal(entry(1813).judgment,'ready');
 for(const[n,k]of[[246,'boss'],[1483,'attack'],[1350,'defense'],[1013,'physical'],[1562,'magic-damage'],[1989,'ultimate']]){assert.strictEqual(labelingView(catalog,k).entries.find(e=>e.id===entry(n).id),entry(n));assert.equal(entry(n).judgment,'ready');}
});

test('armor validation rejects false equipment, wrong numeric bases, narrowed common scope and completion of displayed effects',()=>{
 const reject=(n,k,i,change)=>{const d=detail(n,k),b=structuredClone(bs(n,k)[i]),a=r.tagPasses.find(p=>p.tag===label(k)).assignments.find(a=>a.skillId===entry(n).id);change(b);assert.throws(()=>validateArmorBinding(k,d,a,b));};
 reject(87,'armor',0,b=>b.automaticallyEquipsArmor=true);reject(293,'armor',0,b=>b.base='character-base-stat');reject(293,'armor',0,b=>b.pairedEquipmentLogicalOperator='OR');reject(778,'robe',0,b=>b.scope.equipment.armorType='robe');reject(940,'clothes',0,b=>b.guaranteesImmunity=true);reject(966,'clothes',0,b=>b.scope.direction='outgoing-healing');reject(1813,'robe',0,b=>b.valuePercent=10);
 const d=structuredClone(detail(258,'robe'));d.coverage.permissionPartIds.push('effect-1');assert.throws(()=>validateArmorCoverage('robe',catalog.views.robe,d,{partIds:[...d.coverage.permissionPartIds,...d.coverage.conditionPartIds]},entry(258)));
 const pair=structuredClone(detail(293,'armor'));pair.coverage.conditionPartIds=['condition-2'];assert.throws(()=>validateArmorCoverage('armor',catalog.views.armor,pair,{partIds:['condition-2']},entry(293)));
});

function page(key){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag='+key},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Do not change user saves');}}});return get;}
test('three original-site armor pages render every group, unique search counts, judgment sorting and stale-description review',()=>{
 for(const[k,total,groups]of expected){const get=page(k);assert.equal(get('#activeTagTitle').textContent,label(k));assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,85);const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,groups);for(const s of sections){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}
  get('#labelSearch').value='神域的加护';get('#labelSearch').listeners.input();assert.equal(get('#labelResultCount').textContent,`显示 1 / ${total} 个技能（去重）`);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,2);assert.match(get('#labelTable').innerHTML,/任意防具/);
 }
 const rows=skillLabelRows(data,labelingView(catalog,'armor'),{[`skill:${source(1013).id}`]:{effect:'已修改描述'},[`skill:${source(37).id}`]:{effect:'新的防具条件'}});for(const n of[1013,37]){const e=rows.find(e=>e.id===source(n).id);assert.equal(e.judgment,'unknown');assert.deepEqual(e.assignedTags,[]);assert.deepEqual(e.conditionBindings,{});}
});
