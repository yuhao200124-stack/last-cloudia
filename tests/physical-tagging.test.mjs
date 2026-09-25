import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),physical={entries:catalog.entries.filter(e=>e.assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('物理伤害增加')),counts:Object.fromEntries(['ready','partial','unknown'].map(status=>[status,catalog.entries.filter(e=>e.assignedTags.includes('物理伤害增加')&&e.judgment===status).length]))};
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>physical.entries.find(e=>e.id===source(n).id);
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));

test('physical damage audits all 935 skills and excludes complete elemental and target-specific bonuses',()=>{
 const audit=JSON.parse(read('../docs/physical-damage-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,78);assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,857);
 assert(!entry(2026));assert(audit.rows.some(r=>r.id===source(2026).id));assert(!entry(2028));assert(entry(1754));assert(entry(1756));
 const elemental=[391,403,450,451,457,509,527,535,563,566,582,625,663,673,723,728,752,755,853,956,1239,1529,1572,1726,1837];
 const slayers=[1180,1213,1317,1398,1416,1592,1636,1780,1838,1930,1962,1971,2026];
 for(const n of [...elemental,...slayers,125,205,212,295,366,439,456,720,880,902,924,1102,1366,1744]){
  assert(!entry(n),source(n).name);
  assert.equal(audit.rows.find(r=>r.id===source(n).id).decision,'not-related');
 }
 for(const n of [365,410,502,556,594,619,977]){assert(!entry(n).remainingEffects.includes('暴击率+10%'));assert(entry(n).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('暴击'));assert(entry(n).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('单手'));assert.deepEqual(entry(n).remainingConditions,[]);}
 assert.equal(catalog.numericEffectInjection,false);
});

test('physical bonuses remain distinct from caps, crits, killers, stat changes, generic bonuses and received damage',()=>{
 for(const n of [9,28,40,42,74,122,123,124,169,175,181,186,202,206,210,268,339,772,850,1103,1121,1176,1220,1270,1316,1519,1651,1692,1706,1727,1811,1830,1858,1955])assert(!entry(n),source(n).name);
 // A physical vulnerability on an enemy is not an outgoing physical bonus.
 assert(!entry(212));
 assert.equal(entry(1756).tagDetails['物理伤害增加'].target,'allies-with-faith');
 assert.deepEqual(entry(1754).tagDetails['物理伤害增加'].relatedSkillIds,[source(1756).id]);
 assert(!entry(1754).remainingEffects.some(t=>t.includes('铁锤')||t.includes('非攻击力效果')));
 assert.equal(entry(1754).remainingEffects.length,0);
 for(const n of [357,441]){assert.deepEqual(entry(n).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break',...ADDITIONAL_RACE_TAGS].includes(tag)),['魔力','物理伤害增加']);assert.deepEqual(entry(n).remainingEffects,[]);assert(entry(n).remainingConditions.some(t=>t.includes('公式')));}
 for(const n of [1113,1491])assert.match(entry(n).tagDetails['物理伤害增加'].calculationNote,/不直接填入最高值/);
 for(const n of [1073,1615])assert.deepEqual(entry(n).remainingConditions,[]);
 assert.deepEqual(entry(1548).remainingConditions,[]);
 // The weapon has a fire requirement, but the physical damage itself has none.
 for(const n of [1548,717,1378,1462,1605])assert(entry(n),source(n).name);
});

test('physical tags accumulate and leave each unfinished effect/condition pending until its own pass',()=>{
 assert.equal(physical.counts.ready,61);assert.equal(physical.counts.partial,17);assert.equal(physical.counts.unknown,0);
 assert.equal(physical.entries.filter(e=>e.assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break',...ADDITIONAL_RACE_TAGS].includes(tag)).length>1).length,69);
 for(const [n,key] of [[273,'attack'],[281,'attack'],[398,'defense'],[1704,'defense'],[357,'magic'],[441,'magic']])assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));
 assert.deepEqual(entry(273).remainingEffects,[]);assert.deepEqual(entry(273).remainingConditions,[]);
 assert(entry(1228).remainingEffects.includes('自身受到来自敌人的伤害+10%'));
 assert.equal(catalog.entries.length,902);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,902);
 const allRows=skillLabelRows(box.window.SKILL_DATA,labelingView(catalog,'all'));
 assert(allRows.slice(0,622).every(r=>r.judgment==='ready'));assert(allRows.slice(622).every(r=>r.judgment==='partial'));
 // Removing the weapon type pass leaves its condition pending; restoring it completes the shared skill.
 const earlier=structuredClone(registry);earlier.tagPasses=earlier.tagPasses.filter(p=>p.tag!=='锤');
 assert.equal(resolveSkillLabels(earlier).find(e=>e.id===source(273).id).judgment,'partial');
 assert.equal(entry(273).judgment,'ready');assert.deepEqual(entry(273).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break',...ADDITIONAL_RACE_TAGS].includes(tag)),['攻击力','物理伤害增加','锤']);
});
