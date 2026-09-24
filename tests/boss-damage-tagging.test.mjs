import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),boss=labelingView(catalog,'boss-damage');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>boss.entries.find(e=>e.id===source(n).id);
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));

test('Boss damage reviews the entire library and rejects caps, reductions, non-Boss damage and Boss-Wave attributes',()=>{
 const audit=JSON.parse(read('../docs/boss-damage-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,12);assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,923);
 assert.deepEqual(boss.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[411,624,720,837,985,1041,1159,1289,1311,1608,1644,1814]);
 for(const n of [192,246,290,460,638,640,760,888,941,1097,1526,1630,1651,1708,1830,1883,1918,1955,2028])assert(!entry(n),source(n).name);
 for(const n of [73,122,655,731,939,1478])assert(!entry(n),source(n).name);
 for(const n of [2026,2028])assert(audit.rows.some(r=>r.id===source(n).id));
 assert.equal(catalog.numericEffectInjection,false);
});

test('complete Boss damage phrases retain attack-type and critical restrictions without absorbing caps or mitigation',()=>{
 for(const n of [411,624,1041,1311])assert.deepEqual(entry(n).tagDetails['Boss伤害增加'].scope,{boss:true,attackKinds:['skill','ultimate']});
 for(const n of [837,1159,1644,1814])assert.deepEqual(entry(n).tagDetails['Boss伤害增加'].scope,{boss:true,attackKinds:['magic']});
 assert.deepEqual(entry(720).tagDetails['Boss伤害增加'].scope,{boss:true,damageType:'physical'});
 assert.deepEqual(entry(985).tagDetails['Boss伤害增加'].scope,{boss:true,attackKinds:['ultimate']});
 assert.deepEqual(entry(1608).tagDetails['Boss伤害增加'].scope,{boss:true});
 assert.deepEqual(entry(1289).tagDetails['Boss伤害增加'].scope,{boss:true,criticalOnly:true});
 assert.equal(entry(1289).tagDetails['Boss伤害增加'].relation,'boss-critical-damage-increase');
 assert.match(entry(1289).tagDetails['Boss伤害增加'].calculationNote,/不是普通伤害\+10%/);
 assert(entry(1289).remainingConditions.some(t=>t.includes('实际发生暴击')));
 assert(entry(1289).remainingEffects.includes('对Boss的暴击伤害上限+2,000'));
 assert.deepEqual(entry(720).remainingConditions,['按队伍中装备调查兵团的单位数量计算']);
 assert.match(entry(720).tagDetails['Boss伤害增加'].summary,/1名\+6%.*2名\+12%.*3名\+18%.*4名\+24%/);
 assert.deepEqual(entry(1608).remainingEffects,['受到Boss的伤害-20%']);
 assert.deepEqual(entry(1608).remainingConditions,['减伤要求攻击来源为Boss']);
 for(const n of [624,1041,1311]){
  assert.deepEqual(entry(n).remainingConditions,[]);assert.equal(entry(n).remainingEffects.length,2);
  assert(entry(n).remainingEffects.every(t=>t.includes('上限')));
 }
 for(const n of [1159,1644,1814]){assert.deepEqual(entry(n).remainingConditions,[]);assert.equal(entry(n).remainingEffects.length,1);assert(entry(n).remainingEffects[0].includes('上限'));}
});

test('Boss scope completes pure bonuses and synchronizes old views without repeating their numeric effect',()=>{
 assert.equal(boss.counts.ready,2);assert.equal(boss.counts.partial,10);assert.equal(boss.counts.unknown,0);
 assert.deepEqual(boss.entries.filter(e=>e.judgment==='ready').map(e=>Number(e.url.split('/').pop())),[837,411]);
 assert.equal(boss.entries.filter(e=>e.assignedTags.length>1).length,5);
 for(const [n,key] of [[720,'physical'],[837,'magic-damage'],[1159,'magic-damage'],[1644,'magic-damage'],[1814,'magic-damage']])assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));
 assert.deepEqual(entry(837).assignedTags,['魔法伤害增加','Boss伤害增加']);
 assert.deepEqual(entry(837).remainingEffects,[]);assert.deepEqual(entry(837).remainingConditions,[]);
 const old=registry.tagPasses.find(p=>p.tag==='魔法伤害增加').assignments.find(a=>a.skillId===source(837).id);
 const current=registry.tagPasses.find(p=>p.tag==='Boss伤害增加').assignments.find(a=>a.skillId===source(837).id);
 assert.deepEqual(old.partIds,['magic-damage']);assert.deepEqual(current.partIds,['magic-damage','condition-1']);
 assert.equal(entry(837).parts.filter(p=>p.kind==='effect').length,1);
 assert(boss.entries.every(e=>!e.assignedTags.includes('伤害增加')));
 assert.equal(catalog.views.damage.counts.relatedUnique,7);
 assert.equal(catalog.views.all.counts.relatedUnique,363);assert.equal(catalog.views.all.counts.ready,46);assert.equal(catalog.views.all.counts.partial,317);
 const rows=skillLabelRows(box.window.SKILL_DATA,boss);
 assert.deepEqual(rows.slice(0,2).map(r=>r.id),[source(411).id,source(837).id]);
 assert(rows.slice(2).every(r=>r.judgment==='partial'));
 assert.equal(new Set(catalog.entries.map(e=>e.id)).size,363);
});
