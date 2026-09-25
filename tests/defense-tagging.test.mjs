import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,skillLabelRows,labelingView,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {renderLabelTable} from '../dist/skill-labeling.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const data=box.window.SKILL_DATA,all=canonicalSkillRows(data);
const source=n=>all.find(row=>row.url.endsWith(`/gino/${n}`));
const defense=labelingView(catalog,'defense');
const entry=n=>defense.entries.find(row=>row.id===source(n).id);

test('defense audits the entire unique library, retains all 64 known skills and adds six missing relationships',()=>{
 const audit=JSON.parse(read('../docs/defense-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,70);
 assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,865);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 const prior=all.filter(r=>r.basicStats?.targets.includes('防御力'));
 assert.equal(prior.length,64);for(const row of prior)assert(defense.entries.some(e=>e.id===row.id),row.name);
 const additions=defense.entries.filter(e=>!prior.some(r=>r.id===e.id)).map(e=>Number(e.url.split('/').pop()));
 assert.deepEqual(additions,[175,398,418,570,632,1969]);
 assert.equal(catalog.numericEffectInjection,false);
});

test('defense keeps pure damage reduction, guard, armor names and unprovided faith effects out',()=>{
 for(const n of [30,31,37,104,107,181,204,210,577,683,710,731,763,875,887,1013,1103,1312,1606,1754,1755,1881,1873,1999]){
  if(n===875){assert(entry(n));continue;} // This one explicitly has DEF as well as damage reduction.
  assert(!entry(n),source(n).name);
 }
 for(const n of [175,398,418,570]){
  assert.equal(entry(n).tagDetails['防御力'].target,'enemy');
  assert.equal(entry(n).tagDetails['防御力'].relation,'enemy-defense-calculation');
  assert.equal(entry(n).judgment,'ready');
 }
 assert.equal(entry(632).tagDetails['防御力'].relation,'debuff-protection');
 assert.match(entry(1969).tagDetails['防御力'].summary,/固定\+100/);
 assert(!entry(1969).tagDetails['防御力'].summary.includes('%'));
});

test('cumulative judgments agree across views and do not claim unfinished conditions or other stats are tagged',()=>{
 assert.equal(defense.counts.ready,24);assert.equal(defense.counts.partial,46);
 assert.deepEqual(defense.entries.filter(e=>e.judgment==='ready').map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[13,14,15,16,114,175,254,398,418,473,507,570,636,666,796,914,986,1171,1177,1205,1555,1571,1704,1969]);
 const shared=defense.entries.filter(e=>e.assignedTags.filter(tag=>tag!=='物理').includes('攻击力'));
 assert.equal(shared.length,26);
 for(const e of shared){
  assert.deepEqual(e.assignedTags.filter(tag=>tag!=='物理').slice(0,2),['攻击力','防御力']);
  const attack=labelingView(catalog,'attack').entries.find(r=>r.id===e.id);
  assert.deepEqual(attack,e);
 }
 assert.equal(entry(1571).judgment,'ready');assert.deepEqual(entry(1571).remainingEffects,[]);
 assert.deepEqual(entry(796).remainingEffects,[]);
 assert.deepEqual(entry(304).remainingEffects,['魔抗+10%']);
 for(const n of [118,284,293,788,890,1133,1256]){
  assert.equal(entry(n).judgment,'partial',entry(n).name);assert(entry(n).remainingConditions.length,entry(n).name);
 }
 assert.deepEqual(entry(419).remainingEffects,['魔抗+8%']);
 assert.equal(catalog.entries.length,737);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,737);
 assert.deepEqual(catalog.views.all.displayOrder.slice(0,87),catalog.views.attack.displayOrder);
 const rows=skillLabelRows(data,defense);
 const single=filterLabelRows(rows,'御子与守护者');assert.equal(single.length,1);
 const html=renderLabelTable(single);assert(html.includes('assigned-tag">攻击力'));assert(html.includes('assigned-tag">防御力'));assert(html.includes('已完整判断'));
});

test('edited defense descriptions invalidate labels without changing stable source or storage',()=>{
 const row=source(13),edits={[`skill:${row.id}`]:{name:'我的防御提升',effect:'其他效果',sc:'99'}};
 const before=JSON.stringify(edits);
 const shown=skillLabelRows(data,defense,edits);
 const changed=shown.find(e=>e.id===row.id);
 assert.equal(changed.judgment,'unknown');assert.deepEqual(changed.assignedTags.filter(tag=>tag!=='物理'),[]);
 assert.deepEqual(shown.map(e=>e.id),[...skillLabelRows(data,defense).map(e=>e.id).filter(id=>id!==row.id),row.id]);
 assert.equal(JSON.stringify(edits),before);assert.equal(row.name,'防御提升');assert.equal(row.effect,'防御力+2%');
});
