// 追加伤害 and ProcOnProc (2026-09-30, user: “看看还有哪些机制没搞明白去搞明白”). From GameAssembly:
// ProcessUtils.DoAdditionalDamage → CalcDamageHealWrapper.DoCalc(mode 4): count × RandomRange(max(1,⌊min‱·D⌋), ⌈max‱·D⌉) ×
// (1 − resist/100), D = the damage the hit dealt, no cap; trigger-73 passives edit a process's parameters
// (ProcParamModifier + BuffAddMul.Calc: round((old + val)·(1 + per/10000) + add)).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';
import { expectedHit } from '../dist/engine-panel-logic.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} };

async function setup(dress, extra = []) {
  const c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
  const d = await loadEngineData({ unitDressIds: [dress], read });
  const ids = [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...(c.transcend || []).map(p => p.passive)];
  await loadPassives(d.master, [...ids, ...extra], read);
  return { c, ids, battle: new Battle(d.master, d.scripts, {}) };
}

test('夜叉丸 影分身: a dark extra hit of 30–35 % of the hit, and 忍皇刀 raises its ratios by 50 %', async () => {
  const { c, ids, battle } = await setup(200350, [1011372]);
  const run = equips => { battle.reset(); return runScenario({ battle, attacker: addAttacker(battle, { unitDressId: 200350, panelGiven: false, passives: ids.map(id => ({ id })), equips }), target: addTarget(battle, boss), skill: { id: c.specials[0].id }, state: { hpPercent: 100 }, assume: { probability: 'assume' }, randoms: [0.95] }).hits.find(h => h.normal); };
  const plain = run([]);
  const [e] = plain.additional.entries;
  assert.equal(e.elem, 6); assert.equal(e.min, 3000); assert.equal(e.max, 3500); assert.equal(e.prob, 2000);
  const D = plain.normal.min;
  assert.equal(plain.additional.normal.min, Math.max(1, Math.floor(0.3 * D)));
  assert.ok(expectedHit(plain, 0) > plain.normal.mean);
  const katana = run([{ pos: 1, id: 101137 }]);
  assert.equal(katana.additional.entries[0].min, 4500); assert.equal(katana.additional.entries[0].max, 5250);
});

test('without the chance roll (the calculator default) no extra hit is added', async () => {
  const { c, ids, battle } = await setup(200350);
  battle.reset();
  const h = runScenario({ battle, attacker: addAttacker(battle, { unitDressId: 200350, panelGiven: false, passives: ids.map(id => ({ id })) }), target: addTarget(battle, boss), skill: { id: c.specials[0].id }, state: { hpPercent: 100 }, assume: { probability: 'skip' }, randoms: [0.95] }).hits.find(h => h.normal);
  assert.equal(h.additional, null);
});

test("a buff calls its setter's sub-process (luaCommon: “バフ：バフ発生元”) — no missing sub-process", async () => {
  const { c, ids, battle } = await setup(501020);
  const missing = []; battle.options.log = (k, ...r) => { if (k === 'subproc-missing') missing.push(r); };
  battle.reset();
  runScenario({ battle, attacker: addAttacker(battle, { unitDressId: 501020, panelGiven: false, passives: ids.map(id => ({ id })) }), target: addTarget(battle, boss), skill: { id: c.specials[0].id }, state: { hpPercent: 100 }, assume: { probability: 'assume' }, randoms: [0.95] });
  assert.deepEqual(missing, []);
});
