import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
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

test('general damage audits all 935 skills and classifies the complete bonus phrase rather than stripping its restrictions',()=>{
 const audit=JSON.parse(read('../docs/damage-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,7);assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,928);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 assert.deepEqual(damage.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[186,253,655,731,939,1232,1478]);
 // “Damage against Bosses / airborne targets” is a complete specialized
 // bonus. It must not also become a generic damage fragment in this pass.
 for(const n of [122,123,124,190,206,226,269,331,761,832,942,1516,1527,1608])assert(!entry(n),source(n).name);
 // Even untyped elemental bonuses, weapon-element matching and inherited
 // light bonuses are outside this user-defined tag.
 for(const n of [73,74,75,76,77,78,229,240,277,296,323,359,386,399,559,648,660,672,681,698,745,711,721,765,842,883,938,1000,1179,1241,1479,1546,1573,1746,1754,1776,1798,1910,1961,1981,2000])assert(!entry(n),source(n).name);
 assert(source(938).effect.includes('伤 害'));assert(!entry(938));
 for(const n of [9,17,28,40,42,127,169,175,177,178,181,185,202,205,212,215,241,325,364,620,754,865,895,1060,1066,1228,1289,1316,1366,1477,1507,1692,1694,1775,1799,1812,1816,1931,1955,2026,2028])assert(!entry(n),source(n).name);
 assert.equal(catalog.numericEffectInjection,false);
});

test('general damage retains its own activation conditions and keeps Buff timing, reduction and caps separate',()=>{
 assert.equal(entry(655).tagDetails['伤害增加'].summary,'队伍至少2名且全员存活时，自身造成伤害+5%');
 assert.deepEqual(entry(655).remainingEffects,[]);
 assert.deepEqual(entry(655).remainingConditions,[]);
 for(const n of [186,253])assert.deepEqual(entry(n).remainingConditions,[]);
 assert.deepEqual(entry(731).remainingConditions,[]);
 assert(entry(939).tagDetails['战斗时间'].bindings[0].durationSeconds===undefined);
 assert.equal(entry(939).tagDetails['战斗时间'].bindings[0].trigger.retryWhenIncapacitatedSeconds,40);
 assert.match(entry(1478).tagDetails['伤害增加'].calculationNote,/不能直接使用最高值/);
 assert.deepEqual(entry(1232).remainingConditions,[]);assert(entry(1232).assignedTags.includes('连击'));
});

test('scope correction preserves old tags and source skills while unfinished conditions remain partial',()=>{
 assert.equal(damage.counts.ready,6);assert.equal(damage.counts.partial,1);assert.equal(damage.counts.unknown,0);
 assert.equal(damage.entries.filter(e=>e.assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)).length>1).length,1);
 const shadow=catalog.entries.find(e=>e.id===source(1479).id),faith=catalog.entries.find(e=>e.id===source(1754).id);
 assert.deepEqual(shadow.assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)),['魔法伤害增加','暗属性']);
 assert.deepEqual(shadow.remainingEffects,[]);assert.equal(shadow.remainingConditions.length,0);
 assert.deepEqual(faith.assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)),['攻击力','物理伤害增加']);
 assert.deepEqual(faith.remainingEffects,[]);assert(faith.assignedTags.includes('神'));assert.deepEqual(faith.remainingConditions,[]);
 assert(source(122));assert(catalog.entries.find(e=>e.id===source(122).id).assignedTags.includes('空中'));assert(catalog.entries.find(e=>e.id===source(1316).id).assignedTags.includes('异常'));assert(!entry(1316));
 assert.deepEqual(catalog.entries.find(e=>e.id===source(1608).id).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)),['Boss伤害增加']);
 assert.deepEqual(catalog.entries.find(e=>e.id===source(73).id).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)),['火属性']);assert(!entry(73));
 const future=structuredClone(registry);
 future.tagPasses.push({tag:'连续Hit达到50',assignments:[{skillId:source(186).id,partIds:['condition-1']}]});
 const updated=resolveSkillLabels(future).find(e=>e.id===source(186).id);
 assert.equal(updated.judgment,'ready');assert.equal(entry(186).judgment,'ready');
 assert.equal(catalog.entries.length,935);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,935);
 assert.equal(catalog.views.all.counts.ready,749);assert.equal(catalog.views.all.counts.partial,186);
 const sorted=skillLabelRows(box.window.SKILL_DATA,labelingView(catalog,'all'));
 assert(sorted.slice(0,749).every(r=>r.judgment==='ready'));assert(sorted.slice(749).every(r=>r.judgment==='partial'));
});
