// Reader loadout report (LoadoutReport.json) → the account's real growth and loadout (dist/engine/loadout-adapter.mjs).
// Fixture: 洛琪希's entry of the user's report; the battle report captured the same loadout, so the decoded
// passives / magic / gear / personality levels and the computed panel must match it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, K } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';
import { decodeFlags, isLoadoutReport, unitLoadout, attackerFromLoadout } from '../dist/engine/loadout-adapter.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = loadEngineData({ unitDressIds: [502220], read });
const switches = JSON.parse(fs.readFileSync(new URL('../dist/game-data/engine/switch.json', import.meta.url), 'utf8'));
const report = JSON.parse(fs.readFileSync(new URL('./fixtures/roxy-loadout-report.json', import.meta.url), 'utf8'));

test('loadout: bitmask decode follows CommonUtil.FlagDecryptor (hex char p, bit 3..0 → 4p + 3 − bit)', () => {
  assert.deepEqual(decodeFlags('8'), [0]); assert.deepEqual(decodeFlags('1'), [3]); assert.deepEqual(decodeFlags('c9'), [0, 1, 4, 7]); assert.deepEqual(decodeFlags(''), []);
  assert.equal(isLoadoutReport(report), true); assert.equal(isLoadoutReport({ kind: 'last-cloudia-battle-entry' }), false);
});

test('loadout: 洛琪希 decodes to the loadout the battle report saw (passives, magic, gear, personality levels)', async () => {
  const { master } = await dataPromise;
  const lo = unitLoadout(report, master, switches, 502220);
  assert.deepEqual([lo.level, lo.limitBreak, lo.awake, lo.pieceCount], [120, 7, 9, 134]);
  // battle-report inventory (affiliation 4) minus the personality passives, plus 迷宮踏破 (a non-battle passive the reader's battle inventory omits)
  const inventory = [180, 620, 800, 14500, 17000, 19100, 24450, 24810, 25400, 26100, 26466, 27183, 27362, 27365, 27414, 27460, 27552, 27830, 28176, 28180, 28333, 28607, 28608, 55782, 55783, 55784, 70001276, 70001312, 70001399, 70001409, 70001418, 70001419, 70001467];
  assert.deepEqual([...lo.passives].sort((a, b) => a - b), [...inventory, 55781].sort((a, b) => a - b));
  assert.equal(lo.missingPassives, 0);
  assert.deepEqual(lo.magic, [360240, 270090, 391040]);
  assert.deepEqual(lo.equips, [{ pos: 1, id: 108119 }, { pos: 2, id: 203110 }]);
  assert.deepEqual(lo.personality.sort((a, b) => a.base - b.base), [{ passive: 50222014, level: 4, base: 50222011 }, { passive: 50222022, level: 2, base: 50222021 }]);
  assert.deepEqual(lo.skillLevels, { 5022203: 5, 5022204: 5, 5022205: 5 });
  assert.equal(unitLoadout(report, master, switches, 100010), null);
});

test('loadout: the attacker built from the report reproduces the reader entry panel and casts its own magic', async () => {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const blessings = Object.entries({ 60001010: [0, 400], 60001040: [0, 300], 60001110: [0, 300], 60001720: [0, 500], 60003280: [0, 700], 60003380: [0, 300] }).map(([id, p]) => ({ id: Number(id), params: { 0: p } }));
  const spec = attackerFromLoadout(report, master, switches, 502220, { extraPassives: blessings });
  const roxy = addAttacker(battle, spec);
  assert.deepEqual(roxy.skills.map(s => s.id), [5022201, 5022203, 5022204, 5022205, 5022206, 360240, 270090, 391040]);
  const boss = addTarget(battle, { name: 'boss', charTypes: [2006], stats: { hp: 22400000, mp: 100, def: 1800, mnd: 2500 } });
  const out = runScenario({ battle, attacker: roxy, target: boss, skill: { id: 270090 }, state: {}, randoms: [0.95] });
  assert.deepEqual([out.stats.hp.panel, out.stats.str.panel, out.stats.def.panel, out.stats.int.panel, out.stats.mnd.panel, out.stats.crt.panel], [13591, 1270, 1621, 6741, 2808, 11]);
  assert.equal(battle.finalStat(roxy, K.STAT.MAX_MP, { layer: 'status' }), 1018);
  assert.equal(out.stats.int.real, 10111); // EX aura only: 月光II is not in this loadout
  assert.deepEqual(out.errors, []);
});

// ---- reader v0.11: crest instance (徽章 + 词条) and per-item enhancement levels ----
import { crestOf, equipItemLevels } from '../dist/engine/loadout-adapter.mjs';
test('loadout v0.11: the crest in slot 5 adds its parameters and its trait passives register under affiliation 18', async () => {
  const { master, scripts } = await dataPromise;
  master.merge(await read('engine/crests.json', false));
  // 洛琪希's entry with a synthetic 亞克-style crest (Crest: Jala Lv10, STR +352 / DEF +185) whose three traits are the
  // passives the battle report showed as crest instances: 劍魔法增幅界限突破, 攻擊力提升, 超必殺技界限突破
  const r = JSON.parse(JSON.stringify(report));
  r.equipList[0].equipInfo = '1:108119-2:203110-3:0-4:0-5:400096-6:0';
  r.crests = [{ key: 400096, crestId: 200110, userCrestId: 400096, favorite: 1, slots: [[5, 5, 0, 218, 5050015], [3, 5, 1, 219, 5004014], [4, 5, 0, 220, 5078029]] }];
  r.crestSlotColumns = ['rank', 'maxRank', 'locked', 'lotteryNumber', 'passiveId'];
  r.equipItems = [[108119, 1, 0, 30, 0], [203110, 1, 0, 40, 1]]; r.equipItemColumns = ['itemEquipId', 'possession', 'newRecord', 'alchemyLevel', 'favorite'];
  assert.deepEqual([...equipItemLevels(r)], [[108119, 30], [203110, 40]]);
  assert.deepEqual(crestOf(r, 400096).traits.map(t => [t.slot, t.rank, t.passive]), [[1, 5, 5050015], [2, 3, 5004014], [3, 4, 5078029]]);
  assert.equal(crestOf(r, 400099).missing, true);
  const lo = unitLoadout(r, master, switches, 502220);
  assert.deepEqual(lo.equips, [{ pos: 1, id: 108119, level: 30 }, { pos: 2, id: 203110, level: 40 }]);
  assert.deepEqual(lo.slots.map(e => e.pos), [1, 2, 5]);
  assert.equal(lo.crest.crestId, 200110);
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const spec = attackerFromLoadout(r, master, switches, 502220);
  const roxy = addAttacker(battle, spec);
  assert.deepEqual([roxy.crest.stats[K.STAT.STR], roxy.crest.stats[K.STAT.DEF], roxy.crest.stats[K.STAT.INT]], [352, 185, 0], 'CrestMst PARAMETER_INFO STR/DEF');
  const base = new Battle(master, scripts, { probability: 'assume' }); const noCrest = addAttacker(base, attackerFromLoadout(report, master, switches, 502220));
  assert.deepEqual([roxy.elemResist[2] - noCrest.elemResist[2], roxy.elemResist[4] - noCrest.elemResist[4], roxy.elemResist[1] - noCrest.elemResist[1]], [10, 10, 0], 'crest RESIST_ELEM_INFO');
  const crestInst = roxy.instances.filter(i => i.affiliation === K.AFF.CREST).map(i => [i.localId, i.localIndex, i.processId, i.params.slice(0, 3)]);
  assert.deepEqual(crestInst, [[5050015, 0, 1082608, [10, 10, 3200]], [5050015, 1, 1082602, [10, 10, 3200]], [5004014, 0, 1030000, [0, 1500, 0]], [5078029, 0, 1082604, [-2, 5, 15000]]]);
  // the panel: bare + equipment (+30 staff instead of +40) + crest, before the percentage layer
  assert.equal(battle.finalStat(roxy, K.STAT.DEF, { layer: 'status' }) - base.finalStat(noCrest, K.STAT.DEF, { layer: 'status' }), 185);
  assert.ok(roxy.equips[0].stats[K.STAT.INT] < noCrest.equips[0].stats[K.STAT.INT], 'staff +30 gives less INT than +40');
});
