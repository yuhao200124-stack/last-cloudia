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

test('specific Boss bonuses enter neither broad damage view while source skills remain available',()=>{
 for(const n of [411,624,720,837,985,1041,1159,1289,1311,1644,1814]){
  assert(source(n));
  for(const key of ['physical','magic-damage','damage','boss-damage'])assert(!labelingView(catalog,key).entries.some(e=>e.id===source(n).id));
 }
 assert.equal(catalog.views['magic-damage'].counts.ready,0);
 assert.equal(catalog.views['magic-damage'].counts.partial,22);
 assert.equal(catalog.views.damage.counts.relatedUnique,7);
 assert.equal(catalog.entries.length,280);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,280);
 assert.equal(catalog.views.all.counts.ready,46);assert.equal(catalog.views.all.counts.partial,234);
});
