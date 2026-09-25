import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,resolveSkillLabels,skillLabelRows} from '../dist/skill-labeling-model.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const all=canonicalSkillRows(box.window.SKILL_DATA),registry=JSON.parse(read('../docs/skill-labeling-registry.json'));
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>catalog.entries.find(e=>e.id===source(n).id);
const members={
 'boss-magic-damage':[837,1159,1644,1814],
 'boss-physical-damage':[720,1883],
 'boss-skill-damage':[411,624,1041,1311],
 'boss-ultimate-damage':[411,624,985,1041,1311]
};

test('each Boss attack-type pass audits the full library and keeps the complete phrase separate',()=>{
 for(const [key,numbers] of Object.entries(members)){
  const view=labelingView(catalog,key),audit=JSON.parse(read(`../docs/${key}-tag-audit.json`));
  assert.deepEqual(view.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),numbers);
  assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
  assert.equal(audit.rows.filter(r=>r.decision==='related').length,numbers.length);
  assert.equal(view.parent,'boss');
  for(const n of [760,1289,1526,1608,1651,1708,1830,1955,2028])assert(!view.entries.some(e=>e.id===source(n).id),`${key}/${n}`);
  for(const e of view.entries)assert(!e.assignedTags.filter(tag=>tag!=='物理').some(t=>['Boss伤害增加','物理伤害增加','魔法伤害增加','伤害增加'].includes(t)));
 }
 assert.deepEqual(entry(720).tagDetails['Boss物理伤害增加'].scope,{boss:true,damageType:'physical'});
 assert.deepEqual(entry(837).tagDetails['Boss魔法伤害增加'].scope,{boss:true,attackKinds:['magic']});
 assert.deepEqual(entry(411).tagDetails['Boss特技伤害增加'].scope,{boss:true,attackKinds:['skill']});
 assert.deepEqual(entry(411).tagDetails['Boss必杀伤害增加'].scope,{boss:true,attackKinds:['ultimate']});
});

test('parallel skill and ultimate clauses share one record and finish only after both type labels',()=>{
 const giant=entry(411),skill=labelingView(catalog,'boss-skill-damage'),ultimate=labelingView(catalog,'boss-ultimate-damage');
 assert.deepEqual(giant.assignedTags.filter(tag=>tag!=='物理'),['Boss特技伤害增加','Boss必杀伤害增加','必杀相关','特技相关']);
 assert.strictEqual(skill.entries.find(e=>e.id===giant.id),ultimate.entries.find(e=>e.id===giant.id));
 assert.equal(giant.judgment,'ready');assert.deepEqual(giant.remainingEffects,[]);assert.deepEqual(giant.remainingConditions,[]);
 const beforeUltimate=structuredClone(registry);beforeUltimate.tagPasses=beforeUltimate.tagPasses.filter(p=>!['Boss必杀伤害增加','必杀相关'].includes(p.tag));
 const unfinished=resolveSkillLabels(beforeUltimate).find(e=>e.id===giant.id);
 assert.equal(unfinished.judgment,'partial');assert.deepEqual(unfinished.remainingEffects,['对Boss的必杀伤害+20%']);
 assert.equal(giant.parts.filter(p=>p.kind==='effect').length,2);
});

test('typed Boss bonuses leave caps and party counts pending without injecting damage twice',()=>{
 assert.equal(entry(837).judgment,'ready');
 for(const n of [624,1041,1311]){assert.equal(entry(n).judgment,'ready');assert.deepEqual(entry(n).remainingEffects,[]);}
 for(const n of [1159,1644,1814]){assert.equal(entry(n).judgment,'partial');assert.equal(entry(n).remainingEffects.length,1);assert(entry(n).remainingEffects[0].includes('上限'));}
 assert.equal(entry(720).judgment,'partial');assert.deepEqual(entry(720).remainingConditions,['按队伍中装备调查兵团的单位数量计算']);
 assert.match(entry(720).tagDetails['Boss物理伤害增加'].summary,/1名\+6%.*2名\+12%.*3名\+18%.*4名\+24%/);
 assert.equal(catalog.numericEffectInjection,false);
});

test('Boss page is a deduplicated union of six categories, not an extra bonus tag',()=>{
 const boss=labelingView(catalog,'boss');
 assert.equal(boss.entries.length,13);assert.equal(new Set(boss.entries.map(e=>e.id)).size,13);
 assert.equal(boss.counts.ready,7);assert.equal(boss.counts.partial,6);
 assert.equal(boss.tagKeys.reduce((sum,key)=>sum+catalog.views[key].counts.relatedUnique,0),17);
 assert.deepEqual(boss.entries.filter(e=>e.judgment==='ready').map(e=>e.name).sort(),['巨人杀手','巨人杀手2','巨人杀手3','巨人杀手4','巨型净化','邪恶织法','锐利一击']);
 assert(boss.entries.every(e=>!e.assignedTags.filter(tag=>tag!=='物理').includes('Boss增伤')));
 const rows=skillLabelRows(box.window.SKILL_DATA,boss);
 assert(rows.slice(0,7).every(r=>r.judgment==='ready'));assert(rows.slice(7).every(r=>r.judgment==='partial'));
 assert.equal(catalog.views.all.counts.relatedUnique,737);assert.equal(catalog.views.all.counts.ready,341);assert.equal(catalog.views.all.counts.partial,396);
 assert.equal(catalog.views.physical.counts.relatedUnique,230);assert.equal(catalog.views['magic-damage'].counts.relatedUnique,22);
});

test('Boss critical damage retains its scope while the critical pass completes its cap',()=>{
 const view=labelingView(catalog,'boss-critical-damage'),audit=JSON.parse(read('../docs/boss-critical-damage-tag-audit.json'));
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.rows.filter(r=>r.decision==='related').length,1);
 assert.deepEqual(view.entries.map(e=>e.name),['锐利一击']);
 const sharp=entry(1289),detail=sharp.tagDetails['Boss暴击伤害增加'];
 assert.deepEqual(sharp.assignedTags.filter(tag=>tag!=='物理'),['Boss暴击伤害增加','暴击']);
 assert.deepEqual(detail.scope,{boss:true,criticalOnly:true});
 assert.equal(detail.relation,'boss-critical-damage-increase');
 assert.match(detail.calculationNote,/不提高暴击率.*不赋予魔法暴击资格/);
 assert.equal(sharp.judgment,'ready');
 assert.deepEqual(sharp.remainingEffects,[]);
 assert.deepEqual(sharp.remainingConditions,[]);
 for(const n of [25,28,216,252,600,763,1519,1775,1884])assert.equal(audit.rows.find(r=>r.id===source(n).id).decision,'not-related');
});

test('requested Dragon Awakening grouping preserves the STR effect and does not grant a physical damage multiplier',()=>{
 const dragon=entry(1883),detail=dragon.tagDetails['Boss物理伤害增加'];
 assert.deepEqual(dragon.assignedTags.filter(tag=>tag!=='物理'),['攻击力','Boss物理伤害增加']);
 assert.equal(detail.relation,'boss-wave-attribute-change');assert.equal(detail.groupingOnly,true);
 assert.deepEqual(detail.scope,{bossWave:true,stat:'STR'});
 assert.match(detail.calculationNote,/不能按物理伤害直接\+20%计算/);
 assert.deepEqual(detail.existingRuleIds,dragon.tagDetails['攻击力'].existingRuleIds);
 const attack=registry.tagPasses.find(p=>p.tag==='攻击力').assignments.find(a=>a.skillId===dragon.id);
 const boss=registry.tagPasses.find(p=>p.tag==='Boss物理伤害增加').assignments.find(a=>a.skillId===dragon.id);
 assert.deepEqual(boss.partIds,attack.partIds);assert.deepEqual(boss.partIds,['attack']);
 assert.deepEqual(dragon.remainingEffects,['类型追加“龙”']);
 assert.deepEqual(dragon.remainingConditions,['BOSS Wave中生效']);
 assert.equal(dragon.judgment,'partial');
 assert.strictEqual(labelingView(catalog,'attack').entries.find(e=>e.id===dragon.id),labelingView(catalog,'boss-physical-damage').entries.find(e=>e.id===dragon.id));
 const withoutGrouping=structuredClone(registry);withoutGrouping.tagPasses.find(p=>p.tag==='Boss物理伤害增加').assignments=withoutGrouping.tagPasses.find(p=>p.tag==='Boss物理伤害增加').assignments.filter(a=>a.skillId!==dragon.id);
 const previous=resolveSkillLabels(withoutGrouping).find(e=>e.id===dragon.id);
 assert.deepEqual(previous.remainingEffects,dragon.remainingEffects);assert.deepEqual(previous.remainingConditions,dragon.remainingConditions);
 assert(!labelingView(catalog,'boss-physical-damage').entries.some(e=>e.id===source(941).id));
 assert.equal(catalog.entries.filter(e=>e.id===dragon.id).length,1);
});
