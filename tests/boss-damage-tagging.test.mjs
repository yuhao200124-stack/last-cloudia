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

test('Boss damage is a complete untyped phrase: only Hero Soul qualifies in the full library',()=>{
 const audit=JSON.parse(read('../docs/boss-damage-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,1);
 assert.equal(audit.rows.filter(r=>r.decision==='not-related').length,934);
 assert.deepEqual(boss.entries.map(e=>Number(e.url.split('/').pop())),[1608]);
 // Do not split away physical, magic, skill, ultimate or critical restrictions.
 for(const n of [411,624,720,837,985,1041,1159,1289,1311,1644,1814]){
  assert(!entry(n),source(n).name);
  assert.equal(audit.rows.find(r=>r.id===source(n).id).decision,'not-related');
 }
 for(const n of [192,246,290,460,638,640,760,888,941,1097,1526,1630,1651,1708,1830,1883,1918,1955,2028])assert(!entry(n),source(n).name);
 assert.equal(catalog.numericEffectInjection,false);
});

test('Hero Soul covers only outgoing Boss damage and remains partial for incoming mitigation',()=>{
 const hero=entry(1608);
 assert.equal(hero.name,'勇者之魂');
 assert.deepEqual(hero.tagDetails['Boss伤害增加'].scope,{boss:true});
 assert.equal(hero.tagDetails['Boss伤害增加'].summary,'对Boss造成的伤害+20%');
 assert.deepEqual(hero.assignedTags,['Boss伤害增加']);
 assert.deepEqual(hero.remainingEffects,['受到Boss的伤害-20%']);
 assert.deepEqual(hero.remainingConditions,['减伤要求攻击来源为Boss']);
 assert.equal(hero.judgment,'partial');
 const pass=registry.tagPasses.find(p=>p.tag==='Boss伤害增加');
 assert.deepEqual(pass.assignments,[{skillId:hero.id,partIds:['boss-damage','boss-target']}]);
 assert.equal(boss.counts.ready,0);assert.equal(boss.counts.partial,1);assert.equal(boss.counts.unknown,0);
 assert.deepEqual(skillLabelRows(box.window.SKILL_DATA,boss).map(r=>r.id),[hero.id]);
});

test('revoking wrong Boss labels restores prior judgments without deleting source skills or earlier tags',()=>{
 for(const [n,key,tag] of [[720,'physical','物理伤害增加'],[837,'magic-damage','魔法伤害增加'],[1159,'magic-damage','魔法伤害增加'],[1644,'magic-damage','魔法伤害增加'],[1814,'magic-damage','魔法伤害增加']]){
  const e=labelingView(catalog,key).entries.find(e=>e.id===source(n).id);
  assert.deepEqual(e.assignedTags,[tag]);
  assert.equal(e.judgment,'partial');
  assert(e.remainingConditions.includes('目标敌人为Boss'));
  assert(!e.tagDetails['Boss伤害增加']);
 }
 for(const n of [411,624,985,1041,1289,1311]){
  assert(source(n));assert(!catalog.entries.some(e=>e.id===source(n).id));
 }
 assert.equal(catalog.views['magic-damage'].counts.ready,0);
 assert.equal(catalog.views['magic-damage'].counts.partial,59);
 assert.equal(catalog.views.damage.counts.relatedUnique,7);
 assert.equal(catalog.entries.length,357);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,357);
 assert.equal(catalog.views.all.counts.ready,44);assert.equal(catalog.views.all.counts.partial,313);
});
