// The battle clock the game scripts read: GetWaveTimer() is in seconds — luaCommon.lua's Field:Time() multiplies it by
// OneSec (60) to get frames. Returning frames made every “after N seconds” effect 60× too early (found 2026-09-30 while
// filling the “?” of 艾姬多娜的試煉: 经过 20 秒后魔法伤害 +20%, process1050353 scales 19 s → 20 s).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = (async () => { const d = await loadEngineData({ unitDressIds: [502220], read }); await loadPassives(d.master, [55714], read); return d; })();

async function magicAt(seconds, passives) {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, {});
  const a = addAttacker(battle, { unitDressId: 502220, panelGiven: false, passives: passives.map(id => ({ id })), magic: [270090] });
  const t = addTarget(battle, { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} });
  const out = runScenario({ battle, attacker: a, target: t, skill: { id: 270090 }, state: { hpPercent: 100, elapsedSeconds: seconds }, assume: { probability: 'skip' } });
  return out.hits.find(h => h.normal && !h.cancelled).normal.mean;
}

test('艾姬多娜的試煉: no bonus at 18 s, magic damage +20% from 20 s', async () => {
  const base = await magicAt(18, []);
  assert.equal(await magicAt(18, [55714]), base);
  const at20 = await magicAt(20, [55714]), base20 = await magicAt(20, []);
  assert.ok(Math.abs(at20 / base20 - 1.2) < 0.01, `${base20} → ${at20}`);
});
