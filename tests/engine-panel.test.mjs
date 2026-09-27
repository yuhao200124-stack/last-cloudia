// Out-of-battle panel from master data (dist/engine/panel.mjs): level growth + awakening + ability board,
// equipment parameters (with 特定装備時装備パラメータ増減 edits) and the trigger-1 passives reproduce the
// game's own panel. Reference values: the four characters' in-game maximum panels recorded on the site
// (character-182/245/259/260) and the reader's entry snapshot of 洛琪希 (panel-1, before any buff).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, K } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario, bareStats, equipmentStats, exclusiveEquipment, growthRate, maxLevel, maxAwake } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = loadEngineData({ unitDressIds: [502220, 100642, 101011, 502230], read });

// 最大阶段属性 shown on the character pages (the user's own in-game numbers, Lv120 · awakening 9 · full board, no gear).
const SITE_MAX = { 502220: { hp: 10702, mp: 459, str: 1222, def: 1407, int: 2512, mnd: 1619 }, 100642: { hp: 11628, mp: 281, str: 2073, def: 1642, int: 880, mnd: 1527 }, 101011: { hp: 14494, mp: 262, str: 2499, def: 1781, int: 971, mnd: 1622 }, 502230: { hp: 13057, mp: 241, str: 2437, def: 2005, int: 945, mnd: 1584 } };

test('panel: bare stats of four verified characters match their in-game maximum panels exactly', async () => {
  const { master } = await dataPromise;
  for (const [dress, expected] of Object.entries(SITE_MAX)) {
    const bare = bareStats(master, dress);
    assert.equal(bare.level, 120); assert.equal(bare.awake, 9); assert.equal(bare.estimated, false);
    for (const k of Object.keys(expected)) assert.equal(bare.stats[k], expected[k], `${dress} ${k}`);
  }
  assert.equal(maxLevel(master, 502220), 120); assert.equal(maxLevel(master, 502220, 6), 110); assert.equal(maxAwake(master, 502220), 9);
  assert.deepEqual(growthRate(master, 120), { rate: 12633, estimated: false });
  assert.equal(growthRate(master, 110).estimated, true, 'Lv110 needs GrowthMst (reader v0.10)');
});

test('panel: equipment parameters read the enhanced maximum and carry the piece type / element', async () => {
  const { master } = await dataPromise;
  const staff = equipmentStats(master, 108119), robe = equipmentStats(master, 203110);
  assert.deepEqual([staff.type, staff.elem, staff.level, staff.stats.int, staff.stats.mnd, staff.stats.mp], [17, 2, 40, 365, 97, 50]);
  assert.deepEqual([robe.type, robe.stats.def, robe.stats.int, robe.stats.mnd, robe.stats.mp], [22, 167, 229, 116, 80]);
  assert.deepEqual(robe.elemResist, { 1: 5, 2: 5, 3: 5, 4: 5, 5: 0, 6: 0 });
  assert.equal(equipmentStats(master, 108119, 1).stats.int, 285);
  assert.equal(equipmentStats(master, 108119, 20).estimated, true, 'mid-level enhancement needs ItemEquipParameterGrowthMst');
  assert.deepEqual(exclusiveEquipment(master, 502220), [{ pos: 1, id: 108119 }, { pos: 2, id: 203110 }]);
});

const INVENTORY = [180, 620, 800, 14500, 17000, 19100, 24450, 24810, 25400, 26100, 26466, 27183, 27362, 27365, 27414, 27460, 27552, 27830, 28176, 28180, 28333, 28607, 28608, 55782, 55783, 55784, 50222014, 50222022, 70001276, 70001312, 70001399, 70001409, 70001418, 70001419, 70001467];
const BLESSINGS = { 60001010: [0, 400], 60001040: [0, 300], 60001110: [0, 300], 60001720: [0, 500], 60003280: [0, 700], 60003380: [0, 300] };

test('panel: bare stats + exclusive gear + trigger-1 passives reproduce the reader entry panel of 洛琪希', async () => {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const passives = INVENTORY.map(id => ({ id }));
  for (const [id, params] of Object.entries(BLESSINGS)) passives.push({ id: Number(id), params: { 0: params } });
  const roxy = addAttacker(battle, { unitDressId: 502220, panelGiven: false, equips: exclusiveEquipment(master, 502220), passives, personality: [{ passive: 50222022, level: 2, base: 50222021 }, { passive: 50222014, level: 4, base: 50222011 }] });
  assert.deepEqual(roxy.pure, { 2: 1222, 3: 1407, 4: 2512, 5: 1619, 6: 100, 8: 3, 33: 459, 39: 0, 96: 10702 });
  assert.deepEqual(roxy.elemResist, { 1: 35, 2: 30, 3: 5, 4: -5, 5: 0, 6: 0 }); // dress + board (type 40) + robe
  const boss = addTarget(battle, { name: 'boss', charTypes: [2006], stats: { hp: 22400000, mp: 100, def: 1800, mnd: 2500 } });
  const out = runScenario({ battle, attacker: roxy, target: boss, skill: { id: 270090 }, state: {}, randoms: [0.95] });
  // reader panel-1: {"hp": 13591, "mp": 1018, "attack": 1270, "defense": 1621, "intelligence": 6741, "mind": 2808, "critical": 11}
  assert.deepEqual([out.stats.hp.panel, out.stats.str.panel, out.stats.def.panel, out.stats.int.panel, out.stats.mnd.panel, out.stats.crt.panel], [13591, 1270, 1621, 6741, 2808, 11]);
  assert.equal(battle.finalStat(roxy, K.STAT.MAX_MP, { layer: 'status' }), 1018);
  // 魔導士的心得II: staff INT +100%, robe MND +100%; 【超越】法袍精通II: robe INT/MND +50% — additive per piece, rounded half up
  assert.equal(battle.equipmentStat(roxy, K.STAT.INT), 730 + 344);
  assert.equal(battle.equipmentStat(roxy, K.STAT.MND), 97 + 290);
  assert.equal(out.stats.int.real, 10111);
  assert.deepEqual(out.errors, []);
});

test('panel: manual values override single panel stats while the rest stays computed', async () => {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const roxy = addAttacker(battle, { unitDressId: 502220, panelGiven: false, equips: exclusiveEquipment(master, 502220), passives: INVENTORY.map(id => ({ id })), stats: { int: 7000 }, personality: [{ passive: 50222022, level: 2, base: 50222021 }, { passive: 50222014, level: 4, base: 50222011 }] });
  const boss = addTarget(battle, { name: 'boss', charTypes: [2006], stats: { hp: 1000000, mp: 100, def: 1800, mnd: 2500 } });
  const out = runScenario({ battle, attacker: roxy, target: boss, skill: { id: 270090 }, state: {}, randoms: [0.95] });
  assert.equal(out.stats.int.panel, 7000);
  assert.equal(out.stats.def.panel, 1574); // 1,407 + robe 167, no DEF blessing here
});
