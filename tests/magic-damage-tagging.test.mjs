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
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,22);assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,913);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 for(const n of [127,128,129,130,131,132,134,135,136,137,138,139,227,228,242,363,380,415,416,544,643,701,662,957,1528,1640,1581,305,429,691,836,837,895,1159,1366,1644,1814]){
  assert(!entry(n),source(n).name);assert.equal(audit.rows.find(r=>r.id===source(n).id).decision,'not-related');
 }
 for(const n of [17,74,103,105,109,133,140,141,142,143,144,145,146,197,490,523,592,649,656,665,689,711,841,939,994,1130,1164,1480,1563,1666,1694,1754,1755,1756,1800,1911,1941,2000,2017,2028])assert(!entry(n),source(n).name);
 assert.deepEqual(entry(185).remainingEffects,[]);assert(entry(185).assignedTags.includes('MP'));
 assert.deepEqual(entry(1839).remainingEffects,['自身当前HP持续下降']);
 assert.equal(catalog.numericEffectInjection,false);
});

test('magic damage preserves target, timing, Buff, reference and special attack boundaries',()=>{
 assert.deepEqual(entry(560).remainingEffects,['战斗开始后的前30秒无法使用魔法']);
 assert.match(entry(560).tagDetails['魔法伤害增加'].calculationNote,/没有说明50%.*只持续30秒/);
 for(const n of [690,1060])assert(entry(n).remainingConditions.some(t=>/40秒.*同类型Buff.*一项/.test(t)));
 assert(entry(1812).remainingConditions.some(t=>t.includes('不是魔法增伤的持续时间')));
 assert(entry(2016).remainingConditions.some(t=>t.includes('40秒达到最高30%')));
 assert(entry(2016).remainingEffects.some(t=>t.includes('魔抗-20%')&&t.includes('减益')));
 assert(entry(593).remainingConditions.some(t=>t.includes('换算关系待确认')));
 for(const n of [593,1799,2016])assert.match(entry(n).tagDetails['魔法伤害增加'].calculationNote,/不直接填入最高值/);
 assert(entry(1233).remainingEffects.includes('类型追加“龙”'));assert.deepEqual(entry(1233).remainingConditions,[]);
 assert.equal(entry(1479).tagDetails['魔法伤害增加'].summary,'魔法攻击伤害+15%');
 assert(!entry(1479).assignedTags.includes('伤害增加'));
 assert.deepEqual(entry(1479).remainingEffects,[]);assert.equal(entry(1479).remainingConditions.length,0);
});

test('magic damage accumulates across old views and only finishes after remaining effect and condition passes',()=>{
 assert.equal(magicDamage.counts.ready,4);assert.equal(magicDamage.counts.partial,18);assert.equal(magicDamage.counts.unknown,0);
 assert.equal(magicDamage.entries.filter(e=>e.assignedTags.length>1).length,15);
 for(const [n,key] of [[593,'attack'],[1066,'physical'],[241,'physical'],[658,'physical'],[754,'physical'],[1060,'physical'],[1507,'physical']])
  assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));
 const science=catalog.entries.find(e=>e.id===source(305).id);
 assert.deepEqual(science.assignedTags,['攻击力','防御力','魔力','战斗开始']);
 assert(science.remainingEffects.includes('魔抗提升'));
 assert(science.remainingEffects.some(t=>t.includes('科学')));
 assert(science.remainingConditions.some(t=>t.includes('仅限科学类攻击魔法')));
 for(const key of ['attack','defense','magic'])assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===science.id),science);
 assert.deepEqual(entry(1066).assignedTags,['攻击力','魔力','物理伤害增加','魔法伤害增加','战斗开始']);
 assert.deepEqual(entry(1066).remainingEffects,[]);assert.equal(entry(1066).remainingConditions.length,1);
 assert.deepEqual(entry(241).assignedTags,['物理伤害增加','魔法伤害增加','杖']);
 assert.deepEqual(entry(241).remainingEffects,[]);assert.deepEqual(entry(241).remainingConditions,[]);
 const earlier=structuredClone(registry);earlier.tagPasses=earlier.tagPasses.filter(p=>p.tag!=='杖');
 assert.equal(resolveSkillLabels(earlier).find(e=>e.id===source(241).id).judgment,'partial');assert.equal(entry(241).judgment,'ready');
 assert.equal(catalog.entries.length,587);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,587);
 assert.equal(catalog.views.all.counts.ready,234);assert.equal(catalog.views.all.counts.partial,353);
 const sorted=skillLabelRows(box.window.SKILL_DATA,labelingView(catalog,'all'));
 assert(sorted.slice(0,234).every(r=>r.judgment==='ready'));assert(sorted.slice(234).every(r=>r.judgment==='partial'));
});
