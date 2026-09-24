import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,resolveSkillLabels,skillLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),magicDamage=labelingView(catalog,'magic-damage');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>magicDamage.entries.find(e=>e.id===source(n).id);
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));

test('magic damage audits the full library and separates damage from INT, casting, caps, healing and generic damage',()=>{
 const audit=JSON.parse(read('../docs/magic-damage-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,59);assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,876);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 for(const n of [127,128,129,130,131,132,134,135,136,137,138,139,363,415,416,544,643,701,662,957,1528,1640,1581]){
  assert(entry(n),source(n).name);assert(entry(n).remainingConditions.some(t=>t.includes('属性')));
 }
 for(const n of [17,74,103,105,109,133,140,141,142,143,144,145,146,197,490,523,592,649,656,665,689,711,841,939,994,1130,1164,1480,1563,1666,1694,1754,1755,1756,1800,1911,1941,2000,2017,2028])assert(!entry(n),source(n).name);
 assert.deepEqual(entry(185).remainingEffects,['攻击魔法的MP消耗+50%']);
 assert(entry(380).remainingEffects.some(t=>t.includes('MP消耗+25%')));
 assert.deepEqual(entry(1839).remainingEffects,['自身当前HP持续下降']);
 assert.equal(catalog.numericEffectInjection,false);
});

test('magic damage preserves target, timing, Buff, reference and special attack boundaries',()=>{
 for(const n of [227,228,242]){assert(entry(n).remainingConditions.some(t=>t.includes('时间')));assert.match(entry(n).tagDetails['魔法伤害增加'].calculationNote,/不是限时Buff/);}
 assert.deepEqual(entry(560).remainingEffects,['战斗开始后的前30秒无法使用魔法']);
 assert.match(entry(560).tagDetails['魔法伤害增加'].calculationNote,/没有说明50%.*只持续30秒/);
 for(const n of [690,1060])assert(entry(n).remainingConditions.some(t=>/40秒.*同类型Buff.*一项/.test(t)));
 assert(entry(1812).remainingConditions.some(t=>t.includes('不是魔法增伤的持续时间')));
 assert(entry(2016).remainingConditions.some(t=>t.includes('40秒达到最高30%')));
 assert(entry(2016).remainingEffects.some(t=>t.includes('魔抗-20%')&&t.includes('减益')));
 assert(entry(593).remainingConditions.some(t=>t.includes('换算关系待确认')));
 for(const n of [429,593,691,1799,2016])assert.match(entry(n).tagDetails['魔法伤害增加'].calculationNote,/不直接填入最高值/);
 assert.equal(entry(895).tagDetails['魔法伤害增加'].relation,'magic-killer-damage-increase');
 assert(entry(895).remainingConditions.some(t=>t.includes('不赋予特攻资格')));
 assert.match(entry(895).tagDetails['魔法伤害增加'].calculationNote,/不能直接并入普通魔法增伤池/);
 assert(entry(1233).remainingEffects.includes('类型追加“龙”'));assert.deepEqual(entry(1233).remainingConditions,[]);
 assert.equal(entry(1479).tagDetails['魔法伤害增加'].summary,'魔法攻击伤害+15%');
 assert(!entry(1479).assignedTags.includes('伤害增加'));
 assert.deepEqual(entry(1479).remainingEffects,['暗属性攻击伤害+10%']);assert(entry(1479).remainingConditions.length);
 assert(entry(1366).remainingConditions.some(t=>t.includes('目标敌人在空中')));
});

test('magic damage accumulates across old views and only finishes after remaining effect and condition passes',()=>{
 assert.equal(magicDamage.counts.ready,1);assert.equal(magicDamage.counts.partial,58);assert.equal(magicDamage.counts.unknown,0);
 assert.equal(magicDamage.entries.filter(e=>e.assignedTags.length>1).length,13);
 for(const [n,key] of [[305,'attack'],[305,'defense'],[305,'magic'],[593,'attack'],[1066,'physical'],[241,'physical'],[658,'physical'],[754,'physical'],[1060,'physical'],[1366,'physical'],[1507,'physical']])
  assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));
 assert.deepEqual(entry(305).assignedTags,['攻击力','防御力','魔力','魔法伤害增加']);
 assert.deepEqual(entry(305).remainingEffects,['魔抗提升']);
 assert(entry(305).remainingConditions.some(t=>t.includes('仅限科学类攻击魔法')));
 assert.deepEqual(entry(1066).assignedTags,['攻击力','魔力','物理伤害增加','魔法伤害增加']);
 assert.deepEqual(entry(1066).remainingEffects,[]);assert.equal(entry(1066).remainingConditions.length,2);
 assert.deepEqual(entry(241).assignedTags,['物理伤害增加','魔法伤害增加']);
 assert.deepEqual(entry(241).remainingEffects,[]);assert.deepEqual(entry(241).remainingConditions,['装备法杖时生效']);
 const future=structuredClone(registry);
 future.tagPasses.push({tag:'装备法杖',assignments:[{skillId:source(241).id,partIds:['condition-1']}]});
 const updated=resolveSkillLabels(future).find(e=>e.id===source(241).id);
 assert.equal(updated.judgment,'ready');assert.equal(entry(241).judgment,'partial');
 assert.equal(catalog.entries.length,363);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,363);
 assert.equal(catalog.views.all.counts.ready,46);assert.equal(catalog.views.all.counts.partial,317);
 const sorted=skillLabelRows(box.window.SKILL_DATA,labelingView(catalog,'all'));
 assert(sorted.slice(0,46).every(r=>r.judgment==='ready'));assert(sorted.slice(46).every(r=>r.judgment==='partial'));
});
