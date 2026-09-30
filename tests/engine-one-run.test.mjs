// The calculator's switches (满血, 条件增益生效, …) assume every effect of their group that changes something. Since
// 2026-09-30 (faster calculator) runScenario does it in one run (assume.groups) instead of a probe run and a second
// run; the result must be exactly what the two runs gave (checked on 192 cases when it was changed, one kept here).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} };

test('switch groups in one run = the probe run and the second run', async () => {
  const dress = 101011, move = 1010116;                                           // 龙王阿尔克's 超必杀
  const d = await loadEngineData({ unitDressIds: [dress], read });
  const c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
  const ids = [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...(c.transcend || []).map(p => p.passive)];
  await loadPassives(d.master, ids, read);
  const battle = new Battle(d.master, d.scripts, {});
  const spec = { unitDressId: dress, panelGiven: false, passives: ids.map(id => ({ id })) };
  const groups = ['conditionBuffActive', 'selfStateActive', 'partyConditionActive', 'reviveBuffActive'], state = { hpPercent: 20, targetBreak: true };
  const fresh = () => { battle.reset(); return { attacker: addAttacker(battle, spec), target: addTarget(battle, boss) }; };
  const probe = runScenario({ battle, ...fresh(), skill: { id: move }, state, assume: { probability: 'skip' }, randoms: [0.95] });
  const auto = probe.conditionals.filter(x => groups.includes(x.switchGroup)).map(x => x.key);
  assert.ok(auto.length > 0, 'the switches assume something here');
  const two = runScenario({ battle, ...fresh(), skill: { id: move }, state, assume: { probability: 'skip', instances: auto } });
  const one = runScenario({ battle, ...fresh(), skill: { id: move }, state, assume: { probability: 'skip', groups } });
  assert.deepEqual(one.autoAssumed, auto);
  assert.deepEqual({ ...one, autoAssumed: null }, { ...two, autoAssumed: null });
});
