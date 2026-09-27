// Reader loadout report (LoadoutReport.json) → the account's real growth and loadout (dist/engine/loadout-adapter.mjs).
// Fixture: 洛琪希's entry of the user's report; the battle report captured the same loadout, so the decoded
// passives / magic / gear / personality levels and the computed panel must match it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, K } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario, setupBattle } from '../dist/engine/scenario.mjs';
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
  const spec = attackerFromLoadout(report, master, switches, 502220, { extraPassives: blessings, maxGrowth: false });
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
test('loadout v0.11: the crest in slot 6 adds its parameters and its trait passives register under affiliation 18', async () => {
  const { master, scripts } = await dataPromise;
  master.merge(await read('engine/crests.json', false));
  // 洛琪希's entry with a synthetic 亞克-style crest (Crest: Jala Lv10, STR +352 / DEF +185) whose three traits are the
  // passives the battle report showed as crest instances: 劍魔法增幅界限突破, 攻擊力提升, 超必殺技界限突破
  const r = JSON.parse(JSON.stringify(report));
  r.equipList[0].equipInfo = '1:108119-2:203110-3:0-4:0-5:0-6:400096';
  r.crests = [{ key: 400096, crestId: 200110, userCrestId: 400096, favorite: 1, slots: [[5, 5, 0, 218, 5050015], [3, 5, 1, 219, 5004014], [4, 5, 0, 220, 5078029]] }];
  r.crestSlotColumns = ['rank', 'maxRank', 'locked', 'lotteryNumber', 'passiveId'];
  r.equipItems = [[108119, 1, 0, 30, 0], [203110, 1, 0, 40, 1]]; r.equipItemColumns = ['itemEquipId', 'possession', 'newRecord', 'alchemyLevel', 'favorite'];
  assert.deepEqual([...equipItemLevels(r)], [[108119, 30], [203110, 40]]);
  assert.deepEqual(crestOf(r, 400096).traits.map(t => [t.slot, t.rank, t.passive]), [[1, 5, 5050015], [2, 3, 5004014], [3, 4, 5078029]]);
  assert.equal(crestOf(r, 400099).missing, true);
  const lo = unitLoadout(r, master, switches, 502220);
  assert.deepEqual(lo.equips, [{ pos: 1, id: 108119, level: 30 }, { pos: 2, id: 203110, level: 40 }]);
  assert.deepEqual(lo.slots.map(e => e.pos), [1, 2, 6]);
  assert.equal(lo.crest.crestId, 200110);
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const spec = attackerFromLoadout(r, master, switches, 502220, { maxGrowth: false });
  const roxy = addAttacker(battle, spec);
  assert.deepEqual([roxy.crest.stats[K.STAT.STR], roxy.crest.stats[K.STAT.DEF], roxy.crest.stats[K.STAT.INT]], [352, 185, 0], 'CrestMst PARAMETER_INFO STR/DEF');
  const base = new Battle(master, scripts, { probability: 'assume' }); const noCrest = addAttacker(base, attackerFromLoadout(report, master, switches, 502220, { maxGrowth: false }));
  assert.deepEqual([roxy.elemResist[2] - noCrest.elemResist[2], roxy.elemResist[4] - noCrest.elemResist[4], roxy.elemResist[1] - noCrest.elemResist[1]], [10, 10, 0], 'crest RESIST_ELEM_INFO');
  const crestInst = roxy.instances.filter(i => i.affiliation === K.AFF.CREST).map(i => [i.localId, i.localIndex, i.processId, i.params.slice(0, 3)]);
  assert.deepEqual(crestInst, [[400218, 0, 1082608, [10, 10, 3200]], [400218, 1, 1082602, [10, 10, 3200]], [400219, 0, 1030000, [0, 1500, 0]], [400220, 0, 1082604, [-2, 5, 15000]]], 'local ids as the battle numbers them');
  // the panel: bare + equipment (+30 staff instead of +40) + crest, before the percentage layer
  assert.equal(battle.finalStat(roxy, K.STAT.DEF, { layer: 'status' }) - base.finalStat(noCrest, K.STAT.DEF, { layer: 'status' }), 185);
  assert.ok(roxy.equips[0].stats[K.STAT.INT] < noCrest.equips[0].stats[K.STAT.INT], 'staff +30 gives less INT than +40');
});

// ---- real v0.11 data: 亞克 and 魯迪烏斯 panels from growth + gear levels + crest, with the passives the battles had ----
import { attackerFromReport, panelStatsOf } from '../dist/engine/report-adapter.mjs';
const v011 = JSON.parse(fs.readFileSync(new URL('./fixtures/loadout-v011.json', import.meta.url), 'utf8'));
test('loadout v0.11: 亞克 / 魯迪烏斯 entry panels (7 stats) are reproduced from the report growth, item levels and crest', async () => {
  const { master: base } = await loadEngineData({ unitDressIds: [502130, 502210], read });
  base.merge(await read('engine/crests.json', false));
  const cases = [['ark-battle-report.json', 502130, 5021305], ['rudeus-battle-report.json', 502210, 291010]];
  const scripts = (await dataPromise).scripts;
  for (const [file, dress, skillId] of cases) {
    const report = JSON.parse(fs.readFileSync(new URL(`./fixtures/${file}`, import.meta.url), 'utf8'));
    const rep = attackerFromReport(report, base), lo = attackerFromLoadout(v011, base, switches, dress, { maxGrowth: false });
    assert.equal(lo.crest.crestId, 200109, 'Crest: Jala Lv9');
    assert.deepEqual(lo.crest.traits.map(t => t.localId), [400218, 400219, 400220]);
    // the battle's own passive instances (the loadout has since changed passives / accessories), gear the battle had
    const spec = { ...lo, passives: rep.passives.filter(p => p.affiliation !== K.AFF.CREST), personality: rep.personality, equips: lo.equips.filter(e => rep.equips.some(r => r.id === e.id)) };
    const battle = new Battle(base, scripts, { probability: 'skip' });
    const a = addAttacker(battle, spec), t = addTarget(battle, { name: 'boss', charTypes: [2006], stats: { hp: 22400000, mp: 100, def: 1800, mnd: 2500 } });
    setupBattle(battle, a, t, { hpPercent: 100 }); // status calc (trigger 1) builds the panel
    const game = panelStatsOf(report.units[0]);
    const mine = { hp: battle.finalStat(a, K.STAT.MAX_HP, { layer: 'status' }), mp: battle.finalStat(a, K.STAT.MAX_MP, { layer: 'status' }), str: battle.finalStat(a, K.STAT.STR, { layer: 'status' }), def: battle.finalStat(a, K.STAT.DEF, { layer: 'status' }), int: battle.finalStat(a, K.STAT.INT, { layer: 'status' }), mnd: battle.finalStat(a, K.STAT.MND, { layer: 'status' }), crt: battle.finalStat(a, K.STAT.CRT, { layer: 'status' }) };
    assert.deepEqual(mine, { hp: game.hp, mp: game.mp, str: game.str, def: game.def, int: game.int, mnd: game.mnd, crt: game.crt }, `${dress} panel`);
    // crest traits register as the game's affiliation-18 instances (same processes and parameters as the report)
    const three = v => [0, 1, 2].map(i => v[i] || 0).join(':'); // the report pads parameter lists with zeros
    const mineCrest = a.instances.filter(i => i.affiliation === K.AFF.CREST).map(i => [i.localId, i.localIndex, i.processId, three(i.params)]).sort();
    const reportCrest = rep.passives.filter(p => p.affiliation === K.AFF.CREST).flatMap(p => p.processes.map(x => [p.localId, x.localIndex, x.processId, three(x.params)])).sort();
    assert.deepEqual(mineCrest, reportCrest, `${dress} crest traits`);
    assert.ok(skillId);
  }
  // 亞克's gear at its recorded levels: 封劍 +0 (225 STR), 神帝劍 +40 (198), 均衡的天冥珠 (MAX_LV 0 → PARAMETER_INFO)
  const ark = unitLoadout(v011, base, switches, 502130);
  assert.deepEqual(ark.equips.map(e => [e.id, e.level]), [[101033, 0], [101308, 40], [304469, 20], [302220, 0]]);
  const { equipmentStats } = await import('../dist/engine/panel.mjs');
  assert.deepEqual([equipmentStats(base, 101033, 0).stats.str, equipmentStats(base, 101308, 40).stats.str, equipmentStats(base, 302220, 0).stats.str, equipmentStats(base, 302220, 0).stats.hp], [225, 198, 100, 300]);
});

// ---- passives learned from other characters: fetched by id bucket (engine/p/<id // 10000>.json) ----
import { loadPassives } from '../dist/engine/engine-data.mjs';
test('loadout: passives outside the character bundle load from their id buckets (亞克 carries 12 of them)', async () => {
  const { master } = await loadEngineData({ unitDressIds: [502130], read });
  const lo = attackerFromLoadout(v011, master, switches, 502130, { maxGrowth: false });
  const before = lo.passives.filter(p => !master.passive.has(p.id)).map(p => p.id);
  assert.deepEqual(before, [210, 700, 5500, 6800, 12600, 24900, 25640, 25740, 26484, 27576, 27956, 28140]);
  const unresolved = await loadPassives(master, lo.passives.map(p => p.id), read);
  assert.deepEqual(unresolved, []);
  assert.equal(master.passive.get(26484).NAME, '光屬性超階驅動');
  assert.deepEqual(await loadPassives(master, [26484, 999999999], read), [999999999]);
});

// ---- default (the user's rule): the report picks the gear / passives / crest, every upgrade is taken at its maximum ----
test('loadout: by default level, awakening, board, enhancement and crest level are maximal; only the configuration is the account\'s', async () => {
  const { master, scripts } = await dataPromise;
  master.merge(await read('engine/crests.json', false));
  const r = JSON.parse(JSON.stringify(report));
  r.units[0].lv = 100; r.units[0].awakeLv = 5; r.units[0].abilityPieceInfo = '8'; // a barely raised 洛琪希 …
  r.equipList[0].equipInfo = '1:108119-2:203110-3:0-4:0-5:0-6:1006';
  r.crests = [{ key: 1006, crestId: 200103, userCrestId: 1006, favorite: 1, slots: [[4, 4, 1, 36, 5050015], [4, 4, 1, 4, 5004014], [5, 5, 0, 56, 5078029]] }];
  r.equipItems = [[108119, 1, 0, 3, 0], [203110, 1, 0, 0, 1]];
  const spec = attackerFromLoadout(r, master, switches, 502220);
  assert.equal(spec.maxGrowth, true);
  assert.deepEqual([spec.level, spec.awake, spec.pieces, spec.limitBreak], [null, null, 'all', null]);
  assert.deepEqual(spec.equips, [{ pos: 1, id: 108119 }, { pos: 2, id: 203110 }], 'no enhancement levels → full enhancement');
  assert.deepEqual(spec.personality.map(p => [p.base, p.level]).sort(), [[50222011, 4], [50222021, 2]], 'personality at the board\'s top level (4 / 2 for 洛琪希)');
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const roxy = addAttacker(battle, spec);
  assert.deepEqual([roxy.level, roxy.awake, roxy.panelParts.pieceCount], [120, 9, 134]);
  assert.equal(roxy.equips[0].level, 40);
  assert.deepEqual([roxy.crest.id, roxy.crest.level, roxy.crest.upgradedFrom], [200110, 10, 200103], 'Crest: Jala Lv3 → its Lv10 line, traits as rolled');
  assert.deepEqual(roxy.instances.filter(i => i.affiliation === K.AFF.CREST).map(i => i.localId), [400218, 400218, 400219, 400220]);
  // the same report with the actual levels
  const exact = addAttacker(new Battle(master, scripts, { probability: 'assume' }), attackerFromLoadout(r, master, switches, 502220, { maxGrowth: false }));
  assert.deepEqual([exact.level, exact.awake, exact.panelParts.pieceCount, exact.equips[0].level, exact.crest.id], [100, 5, 1, 3, 200103]);
});
