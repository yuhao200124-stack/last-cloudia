// 连击数 (user 2026-09-30: “连击数都默认200也不用改就当他生效”): the scripts read the target's hit count
// (Bullet:Target():Hits()); the sandbox gives the target 200 unless told otherwise, so 连击大师 (50 连击以上伤害 +20%) counts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = (async () => { const d = await loadEngineData({ unitDressIds: [502220], read }); await loadPassives(d.master, [12600], read); return d; })();

async function hit(passives, state = {}) {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, {});
  const a = addAttacker(battle, { unitDressId: 502220, panelGiven: false, passives: passives.map(id => ({ id })), magic: [270090] });
  const t = addTarget(battle, { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} });
  const out = runScenario({ battle, attacker: a, target: t, skill: { id: 5022203 }, state: { hpPercent: 100, ...state }, assume: { probability: 'skip' } });
  return out.hits.find(h => h.normal && !h.cancelled).normal.mean;
}

test('连击大师 counts at the default 200 hits, not at 0', async () => {
  const base = await hit([]), on = await hit([12600]), zero = await hit([12600], { comboHits: 0 });
  assert.ok(Math.abs(on / base - 1.2) < 0.01, `${base} → ${on}`);
  assert.equal(zero, base);
});
