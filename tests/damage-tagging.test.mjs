import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,resolveSkillLabels,skillLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),damage=labelingView(catalog,'damage');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>damage.entries.find(e=>e.id===source(n).id);
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));

test('general damage audits all 935 skills including split words and excludes specific attack types and unrelated damage events',()=>{
 const audit=JSON.parse(read('../docs/damage-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,85);assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,850);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 assert(source(938).effect.includes('伤 害'));assert(entry(938));
 for(const n of [73,74,75,76,77,78,229,240,277,296,323,359,386,399,559,648,660,672,681,698,745]){
  assert(entry(n));assert(entry(n).remainingConditions.some(t=>t.includes('攻击属性')));
 }
 for(const n of [9,17,28,40,42,127,169,175,177,178,181,185,202,205,212,215,241,325,364,620,754,865,895,1060,1066,1228,1289,1366,1477,1507,1692,1694,1775,1799,1812,1816,1931,1955,2026,2028])assert(!entry(n),source(n).name);
 assert.equal(catalog.numericEffectInjection,false);
});

test('general damage keeps Buff timing, opposing targets, empty slots and special multipliers separate',()=>{
 assert.equal(entry(1316).tagDetails['伤害增加'].target,'enemy');
 assert.equal(entry(1316).tagDetails['伤害增加'].relation,'enemy-damage-vulnerability');
 assert.match(entry(1316).tagDetails['伤害增加'].calculationNote,/不能混作自身增伤或自身易伤/);
 assert(entry(1316).remainingConditions.some(t=>t.includes('不假定为40秒')));
 for(const n of [206,942]){
  assert.equal(entry(n).tagDetails['伤害增加'].relation,'killer-damage-increase');
  assert.match(entry(n).tagDetails['伤害增加'].calculationNote,/不能直接并入通用增伤池/);
 }
 const pass=registry.tagPasses.find(p=>p.tag==='伤害增加');
 assert.deepEqual(pass.assignments.find(a=>a.skillId===source(1516).id).partIds,['damage-killer','damage-weakness']);
 assert.match(entry(1516).tagDetails['伤害增加'].calculationNote,/不无条件合并成40%/);
 assert.deepEqual(entry(731).remainingConditions,['空武器：未装备武器','空防具：未装备防具；须与空武器同时满足']);
 assert.deepEqual(entry(938).remainingConditions,['只装备一把武器','该武器为剑','本次攻击属性与所装备剑的属性相同']);
 assert(entry(939).remainingConditions.some(t=>t.includes('不是Buff持续时间')));
 assert(entry(939).remainingConditions.some(t=>t.includes('再过40秒')));
 for(const n of [1241,1425,1674,1693,1954])assert(entry(n).remainingConditions.some(t=>/持续40秒.*同类型Buff.*一项/.test(t)));
 for(const n of [1478,1776,1798,1961,1981])assert.match(entry(n).tagDetails['伤害增加'].calculationNote,/不能直接使用最高值/);
 assert(entry(1232).remainingConditions.some(t=>t.includes('≤10')));assert(entry(1232).remainingConditions.some(t=>t.includes('达到108')));
 assert(entry(226).remainingEffects.some(t=>t.includes('普通攻击')));
 assert(entry(226).remainingConditions.some(t=>t.includes('目标敌人处于沉默')));
 assert(entry(1608).remainingEffects.includes('受到Boss的伤害-20%'));
 assert(entry(1608).remainingConditions.includes('增伤要求目标敌人为Boss'));
 assert(entry(1608).remainingConditions.includes('减伤要求攻击来源为Boss'));
 assert.deepEqual(entry(721).remainingEffects,['特技伤害+15%']);
 assert.deepEqual(entry(883).remainingEffects,['必杀伤害+50%']);
});

test('general damage merges with previous tags without declaring untagged conditions complete',()=>{
 assert.equal(damage.counts.ready,0);assert.equal(damage.counts.partial,85);assert.equal(damage.counts.unknown,0);
 assert.equal(damage.entries.filter(e=>e.assignedTags.length>1).length,2);
 assert.deepEqual(entry(1479).assignedTags,['魔法伤害增加','伤害增加']);
 assert.deepEqual(entry(1479).remainingEffects,[]);assert.equal(entry(1479).remainingConditions.length,1);
 assert.deepEqual(labelingView(catalog,'magic-damage').entries.find(e=>e.id===source(1479).id),entry(1479));
 assert.deepEqual(entry(1754).assignedTags,['攻击力','物理伤害增加','伤害增加']);
 assert.equal(entry(1754).remainingEffects.length,2);
 assert(entry(1754).remainingConditions.some(t=>t.includes('仅限光属性')));
 assert.equal(entry(2000).tagDetails['伤害增加'].target,'allies-with-faith');
 assert.deepEqual(entry(2000).tagDetails['伤害增加'].relatedSkillIds,[source(1754).id]);
 assert.deepEqual(entry(1754).tagDetails['伤害增加'].relatedSkillIds,[source(2000).id]);
 const future=structuredClone(registry);
 future.tagPasses.push({tag:'暗属性',assignments:[{skillId:source(1479).id,partIds:['condition-1']}]});
 const updated=resolveSkillLabels(future).find(e=>e.id===source(1479).id);
 assert.equal(updated.judgment,'ready');assert.equal(entry(1479).judgment,'partial');
 assert.equal(catalog.entries.length,432);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,432);
 assert.equal(catalog.views.all.counts.ready,44);assert.equal(catalog.views.all.counts.partial,388);
 const sorted=skillLabelRows(box.window.SKILL_DATA,labelingView(catalog,'all'));
 assert(sorted.slice(0,44).every(r=>r.judgment==='ready'));assert(sorted.slice(44).every(r=>r.judgment==='partial'));
});
