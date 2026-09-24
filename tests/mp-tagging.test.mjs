import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),mp=labelingView(catalog,'mp');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>mp.entries.find(e=>e.id===source(n).id);

test('MP maximum attribute pass covers all eight modifiers after a full-library audit',()=>{
 const audit=JSON.parse(read('../docs/mp-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,8);
 assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,927);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 const prior=all.filter(r=>r.basicStats?.targets.includes('MP'));assert.equal(prior.length,8);
 assert.deepEqual(mp.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[5,6,7,8,262,412,433,561]);
 for(const [n,value] of [[5,5],[6,8],[7,12],[8,20],[262,15],[412,5],[433,8],[561,3]])assert.equal(entry(n).tagDetails.MP.summary,`自身MP上限+${value}%`);
 // Resource recovery/costs and MP thresholds are separate future tags.
 for(const n of [35,154,157,160,161,173,185,202,208,209,233,380,389,753,787,821,915,1145,1147,1214,1449,1555,1766,1847])assert(!entry(n),source(n).name);
 for(const n of [209,787,1147,1555]){
  const e=catalog.entries.find(e=>e.id===source(n).id);
  assert.equal(e.judgment,'partial');assert(e.remainingConditions.length);assert(!e.assignedTags.includes('MP'));
 }
 assert.equal(catalog.numericEffectInjection,false);
});

test('MP completes three existing magic compounds without losing their labels or duplicating skills',()=>{
 assert.equal(mp.counts.ready,8);assert.equal(mp.counts.partial,0);assert.equal(mp.counts.unknown,0);
 for(const n of [412,433,561]){
  assert.deepEqual(entry(n).assignedTags,['魔力','MP']);assert.equal(entry(n).judgment,'ready');
  assert.deepEqual(entry(n).remainingEffects,[]);assert.deepEqual(entry(n).remainingConditions,[]);
  assert.deepEqual(labelingView(catalog,'magic').entries.find(e=>e.id===source(n).id),entry(n));
 }
 for(const n of [5,6,7,8,262])assert.deepEqual(entry(n).assignedTags,['MP']);
 assert.equal(catalog.views.magic.counts.ready,12);assert.equal(catalog.views.magic.counts.partial,39);
 assert.equal(catalog.entries.length,280);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,280);
 assert.equal(catalog.views.all.counts.ready,46);assert.equal(catalog.views.all.counts.partial,234);
 const rows=skillLabelRows(box.window.SKILL_DATA,labelingView(catalog,'all'));
 assert(rows.slice(0,46).every(r=>r.judgment==='ready'));assert(rows.slice(46).every(r=>r.judgment==='partial'));
});
