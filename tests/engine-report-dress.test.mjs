// 2026-10-01 (user: 魔神梅莉“和计算器算出来的不一样”): a battle report's unitId is the character's UNIT_ID (梅莉 100640);
// the outfit (魔神 100642) is the dress of that unit whose skills the report lists — before, the page ignored the report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { reportDressId } from '../dist/engine/report-adapter.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };

test('the report unit resolves to the outfit whose skills it lists', async () => {
  const { master } = await loadEngineData({ read });
  const unit = id => ({ unitId: 100640, skills: [id, id + 1, id + 2, id + 3].map(skillId => ({ skillId })) });
  assert.equal(reportDressId(unit(1006423), master), 100642);   // 剪刀尾巴… → 魔神
  assert.equal(reportDressId(unit(1006403), master), 100640);   // 剪刀魅影… → 神徒
  assert.equal(reportDressId({ unitId: 101270, skills: [] }, master), 101270);
  const panel = fs.readFileSync(new URL('../dist/engine-panel.mjs', import.meta.url), 'utf8');
  assert(!panel.includes('report.units?.[0]?.unitId === dress'));
});

// 27731 圣邪之泛滥 “特技和超必杀技的属性变成暗属性” (process1083700 → Skill:SetElement → SkillElement 837): the damage reader's
// settlement for 魔神梅莉's specials showed final ratio = base ratio × 0.75 (dark vs the boss's +25), not × 1.25 (light)
test('a skill-element change makes 魔神梅莉 special hit dark', async () => {
  const { Battle } = await import('../dist/engine/battle.mjs');
  const { loadPassives } = await import('../dist/engine/engine-data.mjs');
  const { addAttacker, addTarget, runScenario } = await import('../dist/engine/scenario.mjs');
  const d = await loadEngineData({ unitDressIds: [100642], read });
  await loadPassives(d.master, [27731], read);
  const battle = new Battle(d.master, d.scripts, {});
  const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: { 5: -25, 6: 25 } };
  const run = passives => { battle.reset(); return runScenario({ battle, attacker: addAttacker(battle, { unitDressId: 100642, panelGiven: false, passives }), target: addTarget(battle, boss), skill: { id: 1006423 }, state: { hpPercent: 100 }, assume: { probability: 'skip' }, randoms: [0.95] }).hits.find(h => h.normal); };
  assert.equal(run([]).element, 5);
  const dark = run([{ id: 27731 }]);
  assert.equal(dark.element, 6); assert.equal(dark.resist, 25);
});
