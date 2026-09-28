import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {BASIC_STAT_CATALOG as catalog} from '../dist/basic-stat-catalog.mjs';
const box={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../dist/data.js',import.meta.url),'utf8'),box);const data=box.window.SKILL_DATA;

test('181 unique classified skills cover six projects; every duplicate retains the same canonical ID',()=>{
 const lanes=data.sheets['基础属性'].lanes,rows=lanes.flatMap(l=>l.rows),unique=new Set(rows.map(r=>r.url||r.id));
 assert.equal(unique.size,181);assert.equal(Object.keys(catalog).length,181);
 assert.equal(data.skillCensus.uniqueTotal,935);assert.equal(data.skillCensus.mainTotal,933);
 assert.equal(data.skillCensus.basicReady+data.skillCensus.basicPartial+data.skillCensus.basicPending,181);
 const counts=Object.fromEntries(lanes.map(l=>[l.label,l.rows.length]));
 assert.deepEqual(counts,{HP:25,MP:8,攻击力:78,法强:43,防御力:64,魔抗:45});
 for(const row of rows){const e=catalog[row.id];assert(e);assert.equal(row.effect,e.text);assert(lanes.filter(l=>l.rows.some(r=>r.id===row.id)).every(l=>e.targets.includes(l.label)));}
 assert(lanes.find(l=>l.label==='HP').rows.some(r=>r.name==='勇士提升2'));
 assert(lanes.find(l=>l.label==='攻击力').rows.some(r=>r.name==='勇士提升2'));
 assert(lanes.find(l=>l.label==='防御力').rows.some(r=>r.name==='勇士提升2'));
});
