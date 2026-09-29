// The move being evaluated must be one the attacker has equipped. A magic (魔法) is carried only when equipped;
// without it the game's conditions that read the cast skill from the unit's own skills fail, e.g. 洛琪希's
// 魔法連鎖 (ActValidOwnerSkillBefore) and 魔術共鳴 (ActValidMagicMultiCastBefore): in 配装 / 游戏数据 modes the
// calculator was ×1.35 below the real battle (user's two battle reports, 2026-09-29).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = loadEngineData({ unitDressIds: [502220], read });

async function cast(spec) {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, {});
  const a = addAttacker(battle, { unitDressId: 502220, panelGiven: false, passives: [{ id: 26100 }, { id: 55782 }], ...spec });
  const t = addTarget(battle, { name: '轟鳥龍恩德爾羅納', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} });
  const out = runScenario({ battle, attacker: a, target: t, skill: { id: 270090 }, state: { hpPercent: 100 }, assume: { probability: 'skip' } });
  return out.hits.find(h => h.normal).edits.map(e => e.localId);
}

test('engine: an equipped magic lets 魔法連鎖 / 魔術共鳴 count; without it they do not', async () => {
  const without = await cast({});
  assert.ok(!without.includes(26100) && !without.includes(55782));
  const withMagic = await cast({ magic: [270090] });
  assert.ok(withMagic.includes(26100), '魔法連鎖');
  assert.ok(withMagic.includes(55782), '魔術共鳴');
});

test('panel: the evaluated move is equipped before the attacker is built', () => {
  const src = fs.readFileSync(new URL('../dist/engine-panel.mjs', import.meta.url), 'utf8');
  const i = src.indexOf('equipMove(attackerSpec, move.id');
  assert.ok(i > 0 && i < src.indexOf('const attacker = M.addAttacker(battle, attackerSpec)'));
});

// 概率效果 (user 2026-09-29): off by default and ticked one by one; one not rolled is still listed so it can be ticked.
test('scenario: a chance effect that did not roll is listed (on: false); ticking it (assume.forced) counts it', async () => {
  const { master, scripts } = await dataPromise;
  const run = forced => {
    const battle = new Battle(master, scripts, {});
    const a = addAttacker(battle, { unitDressId: 502220, panelGiven: false, passives: [{ id: 26421 }], magic: [270090] });
    const t = addTarget(battle, { name: '轟鳥龍恩德爾羅納', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} });
    return runScenario({ battle, attacker: a, target: t, skill: { id: 270090 }, state: { hpPercent: 100 }, assume: { probability: 'skip', forced } });
  };
  const off = run([]);
  const item = off.probabilistic.find(x => x.passiveId === 26421);
  assert.ok(item && item.on === false, '贯导 listed, not counted');
  const on = run([item.key]);
  assert.ok(on.probabilistic.find(x => x.passiveId === 26421).on);
  assert.ok(on.hits.find(h => h.normal).normal.mean > off.hits.find(h => h.normal).normal.mean * 1.3);
});
