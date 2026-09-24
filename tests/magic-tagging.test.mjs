import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),magic=labelingView(catalog,'magic');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>magic.entries.find(e=>e.id===source(n).id);

test('magic reviews all 935 skills, covers 43 known attributes and eight additional relationships',()=>{
 const audit=JSON.parse(read('../docs/magic-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,51);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 const previous=all.filter(r=>r.basicStats?.targets.includes('法强'));
 assert.equal(previous.length,43);for(const r of previous)assert(entry(Number(r.url.split('/').pop())),r.name);
 const additions=magic.entries.filter(e=>!previous.some(r=>r.id===e.id)).map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
 assert.deepEqual(additions,[169,357,441,524,954,1066,1365,1941]);
 for(const n of [5,6,7,8,21,35,105,185,197,262,389,560,593,649,690,1449,1754,1798,1839,1847,1911,2017])assert(!entry(n),source(n).name);
 assert.equal(catalog.numericEffectInjection,false);
});

test('magic keeps targets, fixed numbers, decreases, references and conditional calculations distinct',()=>{
 for(const n of [169,357,441,524,1365])assert.equal(entry(n).tagDetails['魔力'].relation,'stat-reference');
 for(const n of [1066,1941])assert.equal(entry(n).tagDetails['魔力'].relation,'stat-comparison');
 assert.equal(entry(954).tagDetails['魔力'].relation,'debuff-protection');
 for(const n of [176,641,1059])assert.equal(entry(n).tagDetails['魔力'].target,'weapon');
 assert.match(entry(1476).tagDetails['魔力'].summary,/固定\+100/);
 assert(!entry(1476).tagDetails['魔力'].summary.includes('%'));
 assert.match(entry(746).tagDetails['魔力'].summary,/常驻\+10%.*-20%.*40秒/);
 assert(!entry(746).remainingEffects.some(text=>/法强/.test(text)));
 assert.match(entry(1505).tagDetails['魔力'].summary,/-15%/);
 assert.match(entry(1765).tagDetails['魔力'].summary,/-20%/);
 assert.equal(entry(1694).tagDetails['魔力'].relation,'attack-calculation-stat');
 assert.match(entry(1164).tagDetails['魔力'].calculationNote,/不能.*\+50%/);
 assert.match(entry(1813).tagDetails['魔力'].calculationNote,/不是魔力\+10%/);
 for(const n of [103,108,115,120,169,196,249,357,441,584,641,890,954,1088,1143,1144,1164,1461,1694,1802,1813]){
  assert.equal(entry(n).judgment,'partial',entry(n).name);assert(entry(n).remainingConditions.length,entry(n).name);
 }
 for(const [n,mp] of [[412,5],[433,8],[561,3]])assert.deepEqual(entry(n).remainingEffects,[`MP+${mp}%`]);
 assert.deepEqual(entry(1813).remainingEffects,['魔抗作为属性转换的参照量']);
});

test('magic accumulates on 20 existing skills and completes only fully covered attributes',()=>{
 assert.equal(magic.counts.ready,9);assert.equal(magic.counts.partial,42);assert.equal(magic.counts.unknown,0);
 assert.equal(magic.entries.filter(e=>e.assignedTags.length>1).length,20);
 assert.deepEqual(magic.entries.filter(e=>e.judgment==='ready').map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[17,18,19,20,291,490,1476,1864,1912]);
 for(const n of [1864,1912]){
  assert.deepEqual(entry(n).assignedTags,['攻击力','魔力']);
  assert.deepEqual(labelingView(catalog,'attack').entries.find(e=>e.id===source(n).id),entry(n));
 }
 assert.deepEqual(entry(304).assignedTags,['攻击力','防御力','魔力']);
 assert.deepEqual(entry(304).remainingEffects,['魔抗+10%']);
 assert(entry(304).remainingConditions.length);
 assert.equal(catalog.views.all.counts.relatedUnique,178);assert.equal(catalog.views.all.counts.ready,36);
 assert.equal(new Set(catalog.entries.map(e=>e.id)).size,178);
 const rows=skillLabelRows(box.window.SKILL_DATA,magic);
 assert(rows.slice(0,9).every(r=>r.judgment==='ready'));
 assert(rows.slice(9).every(r=>r.judgment==='partial'));
});
