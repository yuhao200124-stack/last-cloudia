import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,skillLabelRows,labelingView,filterLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),hp=labelingView(catalog,'hp');
const source=n=>all.find(row=>row.url.endsWith(`/gino/${n}`));
const entry=n=>hp.entries.find(row=>row.id===source(n).id);

test('HP attribute pass audits the full library and includes all 25 maximum-HP modifiers',()=>{
 const audit=JSON.parse(read('../docs/hp-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,25);
 assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,910);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 const previous=all.filter(r=>r.basicStats?.targets.includes('HP'));
 assert.equal(previous.length,25);for(const row of previous)assert(hp.entries.some(e=>e.id===row.id),row.name);
 assert.deepEqual(hp.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[1,2,3,4,279,353,387,393,402,432,528,666,725,778,796,867,874,955,967,986,991,1177,1221,1651,1768]);
 assert.equal(catalog.numericEffectInjection,false);
});

test('HP attribute tags do not cover healing, recovery caps, current-HP costs/loss or full/low-HP conditions',()=>{
 for(const n of [29,34,110,113,114,118,119,133,153,172,183,184,219,237,267,346,499,788,890,1022,1164,1257,1264,1390,1537,1548,1563,1779,1816,1839,1873,1914,1982])assert(!entry(n),source(n).name);
 assert.equal(catalog.entries.find(e=>e.id===source(119).id).judgment,'partial');
 assert.deepEqual(catalog.entries.find(e=>e.id===source(119).id).remainingConditions,['满HP时生效']);
 for(const n of [353,402,432,666,867,955,967,1221,1768])assert.match(entry(n).tagDetails['生命力'].summary,/固定\+/);
 assert.match(entry(1651).tagDetails['生命力'].summary,/HP上限-15%/);
 assert.equal(entry(1651).judgment,'partial');
});

test('HP merges earlier attribute tags, completes six compounds, and leaves other effects/Buff conditions pending',()=>{
 assert.equal(hp.counts.ready,15);assert.equal(hp.counts.partial,10);
 assert.equal(hp.entries.filter(e=>e.assignedTags.length>1).length,9);
 for(const n of [387,393,528,725]){assert.deepEqual(entry(n).assignedTags,['攻击力','生命力']);assert.equal(entry(n).judgment,'ready');}
 for(const n of [796,986]){assert.deepEqual(entry(n).assignedTags,['攻击力','防御力','生命力']);assert.equal(entry(n).judgment,'ready');}
 assert.deepEqual(entry(1177).remainingEffects,['受到的暴击伤害-10%']);
 for(const n of [353,402,666,778,867,874,1221,1651,1768]){assert.equal(entry(n).judgment,'partial');assert(entry(n).remainingConditions.length);}
 assert.deepEqual(entry(402).remainingEffects,['梅蒂斯：魔抗+20%','加速：SCT恢复速度+25%']);
 for(const n of [387,796])for(const key of ['attack',...(n===796?['defense']:[])])assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));
 const allView=labelingView(catalog,'all');assert.equal(allView.entries.length,178);assert.equal(allView.counts.ready,36);assert.equal(allView.counts.partial,142);
 for(const key of ['all','attack','defense','hp','magic']){
  const rows=skillLabelRows(data,labelingView(catalog,key));const rank={ready:0,partial:1,unknown:2};
  assert(rows.every((r,i)=>!i||rank[rows[i-1].judgment]<=rank[r.judgment]));
  const filtered=filterLabelRows(rows,'HP');assert.deepEqual(filtered.map(r=>r.id),rows.filter(r=>filtered.includes(r)).map(r=>r.id));
 }
});
