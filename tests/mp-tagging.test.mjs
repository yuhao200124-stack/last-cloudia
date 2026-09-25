import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),mp=labelingView(catalog,'mp-max');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>mp.entries.find(e=>e.id===source(n).id);

test('MP maximum attribute pass covers all eight modifiers after a full-library audit',()=>{
 const audit=JSON.parse(read('../docs/mp-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,32);
 assert.equal(audit.rows.filter(r=>r.classification==='mp-maximum').length,8);
 assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,903);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 const prior=all.filter(r=>r.basicStats?.targets.includes('MP'));assert.equal(prior.length,8);
 assert.deepEqual(mp.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[5,6,7,8,262,412,433,561]);
 for(const [n,value] of [[5,5],[6,8],[7,12],[8,20],[262,15],[412,5],[433,8],[561,3]])assert.equal(entry(n).tagDetails.MP.summary,`自身MP上限+${value}%`);
 // Resource recovery/costs and MP thresholds are distinct groups in the MP page.
 for(const n of [35,154,157,160,161,173,185,202,208,209,233,380,389,753,787,821,915,1145,1147,1214,1449,1555,1766,1847])assert(!entry(n),source(n).name);
 for(const n of [209,787,1147,1555]){
  const e=catalog.entries.find(e=>e.id===source(n).id);
  assert(e.assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('MP'));
  if(n===209){assert.equal(e.judgment,'ready');assert.deepEqual(e.remainingEffects,[]);}
  else {assert.equal(e.judgment,'ready');assert.deepEqual(e.remainingConditions,[]);}
 }
 assert.equal(catalog.numericEffectInjection,false);
});

test('MP completes three existing magic compounds without losing their labels or duplicating skills',()=>{
 assert.equal(mp.counts.ready,8);assert.equal(mp.counts.partial,0);assert.equal(mp.counts.unknown,0);
 for(const n of [412,433,561]){
  assert.deepEqual(entry(n).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)),['魔力','MP']);assert.equal(entry(n).judgment,'ready');
  assert.deepEqual(entry(n).remainingEffects,[]);assert.deepEqual(entry(n).remainingConditions,[]);
  assert.deepEqual(labelingView(catalog,'magic').entries.find(e=>e.id===source(n).id),entry(n));
 }
 for(const n of [5,6,7,8,262])assert.deepEqual(entry(n).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)),['MP']);
 assert.equal(catalog.views.magic.counts.ready,32);assert.equal(catalog.views.magic.counts.partial,19);
 assert.equal(catalog.entries.length,935);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,935);
 assert.equal(catalog.views.all.counts.ready,749);assert.equal(catalog.views.all.counts.partial,186);
 const rows=skillLabelRows(box.window.SKILL_DATA,labelingView(catalog,'all'));
 assert(rows.slice(0,749).every(r=>r.judgment==='ready'));assert(rows.slice(749).every(r=>r.judgment==='partial'));
});
