// Battle-script sandbox: reproduces the verified Roxy (洛琪希, unit dress 502220) numbers from game data +
// the game's own Lua scripts. Reference values come from the real battle captured by the loadout
// reader (panel INT 10,111 = 6,741 × 1.5) and from the calculator run the user confirmed against battle
// damage (異度克里昂 sub-hit 157,565–175,076; 183,331–203,687 at full HP with 月光II). The sandbox lands
// within a few points of the calculator (157,564–175,070 / 183,327–203,687): it rounds after every
// EditDamagePer the way the Lua scripts do (per-instance, Lua double arithmetic), whereas the hand-written
// rules multiply the percentages in a different order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, K, parseInts } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = loadEngineData({ unitDressIds: [502220], read });

// Passives present in the captured battle (reader buff inventory, affiliation 4 local ids) and the
// runtime parameters of the account's blessings (blessing levels scale the master value 100 → e.g. 406).
const INVENTORY = [180, 620, 800, 14500, 17000, 19100, 24450, 24810, 25400, 26100, 26466, 27183, 27362, 27365, 27414, 27460, 27552, 27830, 28176, 28180, 28333, 28607, 28608, 55782, 55783, 55784, 50222014, 50222022,
  70001276, 70001312, 70001399, 70001409, 70001418, 70001419, 70001467];
const BLESSINGS = { 60001010: [0, 400], 60001020: [4, 406], 60001040: [0, 300], 60001110: [0, 300], 60001130: [21, -297], 60001260: [1, 406], 60001280: [2, 406], 60001360: [13, 100], 60001410: [11, 100], 60001460: [12, 100], 60001490: [4, -394], 60001500: [1, 0, 200], 60001520: [6, -297], 60001590: [4, 0, 1000], 60001630: [3, 0, 900], 60001650: [6, 0, 1100], 60001660: [1, -199], 60001670: [5, -100], 60001680: [0, 0, 1500], 60001720: [0, 500], 60001790: [12, 10, 100], 60001930: [16, 10, 1100], 60001980: [17, 2, 2300], 60001990: [6, 615], 60002070: [22, -100], 60002330: [15, 201], 60002450: [10, 10, 600], 60002460: [22, 100], 60002550: [5, 1000], 60002760: [14, 10, 100], 60002800: [2, -199], 60002870: [2, 0, 100, 0], 60002940: [20, -297], 60003030: [11, 10, 900], 60003040: [5, 0, 200, 0], 60003090: [21, 2, -199], 60003140: [22, 2, -297], 60003280: [0, 700], 60003310: [10, 201], 60003340: [5, 201], 60003380: [0, 300], 60003410: [20, 2, -297], 60003460: [16, 201], 60003520: [5, 615], 60003540: [3, 303], 60003590: [0, 406], 60003629: [15, 10, 600], 60003637: [14, 201] };

async function roxyBattle({ moon = false } = {}) {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const passives = [...INVENTORY, ...(moon ? [26505] : [])].map(id => ({ id }));
  for (const [id, params] of Object.entries(BLESSINGS)) passives.push({ id: Number(id), params: { 0: params } });
  const roxy = battle.addUnit({ name: '洛琪希', side: K.SIDE.ALLY, unitDressId: 502220, level: 120, limitBreak: 7, awake: 9, charTypes: [1004],
    stats: { 2: 1270, 3: 2295, 4: 6741, 5: 3482, 8: 21, 96: 13591, 33: 1018 },
    equips: [{ pos: 1, id: 108119, type: 17, elem: 2 }, { pos: 2, id: 203110, type: 22, elem: 0 }],
    elemResist: { 1: 35, 2: 30, 3: 5, 4: -5, 5: 0, 6: 0 },
    personality: [{ passive: 50222022, level: 2, base: 50222021 }, { passive: 50222014, level: 4, base: 50222011 }],
    skills: [{ type: 9, id: 5022201 }, { type: 1, id: 5022203 }, { type: 1, id: 5022204 }, { type: 1, id: 5022205 }, { type: 2, id: 360240 }, { type: 2, id: 270090 }, { type: 2, id: 391040 }, { type: 5, id: 5022206 }],
    passives });
  roxy.panelGiven = true;
  for (const [eid, aff] of [[108119, K.AFF.WEAPON], [203110, K.AFF.ARMOR]]) for (const pid of parseInts(master.itemEquip.get(eid).PASSIVE_SKILL_INFO).filter(Boolean)) battle.addPassive(roxy, pid, aff, eid);
  const boss = battle.addUnit({ name: '吸血鬼阿努彌拉', side: K.SIDE.OPPONENT, monsterId: 320602001, isBoss: true, level: 100, charTypes: [2006],
    stats: { 2: 2750, 3: 1800, 4: 1875, 5: 2500, 8: 0, 96: 22400000, 33: 100 }, elemResist: { 1: 0, 2: -25, 3: 0, 4: 0, 5: -25, 6: 50 } });
  battle.dispatch(K.TRIG.STATUS, roxy, roxy);
  battle.dispatch(K.TRIG.WAVE_START, roxy, roxy);
  battle.dispatch(K.TRIG.WAVE_START, boss, boss);
  battle.dispatch(K.TRIG.CHANGE_SURVIVORS, roxy, roxy);
  battle.dispatch(K.TRIG.CHANGE_HP, roxy, roxy);
  return { battle, roxy, boss };
}

// One cast of the skill, first bullet, one hit: the battle is fresh so consecutive-use counters (魔法連鎖) are at 1.
async function castOnce(skillId, { moon = false, critical = false, random = 0.95 } = {}) {
  const { battle, roxy, boss } = await roxyBattle({ moon });
  battle.beginSkill(roxy, boss, skillId);
  // first bullet that carries processes at its top level (skills start with a targeting bullet without any)
  const bulletId = parseInts(battle.master.skill.get(skillId).BULLET_INFO).find(b => battle.master.bulletLevel(b, 9)?.PROCESS_INFO.replace(/[:@]/g, ''));
  const bullet = battle.createBullet(roxy, boss, { skillId, bulletId, level: 9, critical, random });
  battle.hit(bullet);
  return { battle, roxy, boss, results: bullet.results };
}

test('engine: the game scripts load and no native is missing for the Roxy battle', async () => {
  const { battle } = await castOnce(270090);
  assert.deepEqual([...battle.unsupported.entries()], []);
  assert.equal(battle.trace.filter(t => t.error).length, 0, JSON.stringify(battle.trace.filter(t => t.error).slice(0, 3)));
});

test('engine: in-battle INT comes from the EX aura buff (6,741 → 10,111) and 月光II at full HP (12,133)', async () => {
  const a = await roxyBattle();
  assert.equal(a.battle.finalStat(a.roxy, K.STAT.INT, { layer: 'status' }), 6741);
  assert.equal(a.battle.finalStat(a.roxy, K.STAT.INT), 10111);
  assert.ok(a.roxy.buffs.some(b => b.mst.NAME.includes('INT') || b.buffId === 30022 || b.params.includes(5000)), 'EX aura buff present');
  const b = await roxyBattle({ moon: true });
  assert.equal(b.battle.finalStat(b.roxy, K.STAT.INT), 12133);
});

test('engine: 異度克里昂 reproduces the verified sub-hit damage (multi-magic pass at 60%)', async () => {
  const lo = (await castOnce(270090, { random: 0.9 })).results;
  const hi = (await castOnce(270090, { random: 1.0 })).results;
  assert.equal(lo[0].attack, 14627); // 6,741 × (1 + 50% EX + 67% skill)
  assert.equal(lo[0].defense, 2500);
  assert.equal(lo[0].killer, true); // 水王級魔術師 grants an undead killer; 特攻増幅 raises it to ×2.25
  assert.equal(lo[0].killerFactor, Math.fround(2.25));
  assert.equal(lo[1].dmgRatio, 6000);
  assert.deepEqual([lo[1].damage, hi[1].damage], [157564, 175070]);
});

test('engine: full HP with 月光II raises the sub-hit to 183,331–203,687 (core 11,848 at 0.95)', async () => {
  const mid = (await castOnce(270090, { moon: true, random: 0.95 })).results;
  assert.equal(mid[0].attack, 16650);
  assert.equal(mid[1].coreDamage, 11848);
  const lo = (await castOnce(270090, { moon: true, random: 0.9 })).results;
  const hi = (await castOnce(270090, { moon: true, random: 1.0 })).results;
  assert.deepEqual([lo[1].damage, hi[1].damage], [183327, 203687]);
});

test('engine: the damage cap collects every DmgLimitUp control from passives, buffs and the weapon', async () => {
  const [main] = (await castOnce(270090, { critical: true, random: 1.0 })).results;
  assert.ok(main.cap > 9999 && main.damage === Math.min(main.uncapped, main.cap));
  const ult = (await castOnce(5022206, { random: 1.0 })).results;
  assert.ok(ult[0].capVal >= 150000, `ultimate own cap +150,000 counted (got ${ult[0].capVal})`);
});

// ---- the report path the calculator uses: reader battle report → adapter → scenario ----
import { runScenario, addAttacker, addTarget } from '../dist/engine/scenario.mjs';
import { attackerFromReport, targetFromReport, isBattleReport } from '../dist/engine/report-adapter.mjs';

const report = JSON.parse(fs.readFileSync(new URL('./fixtures/roxy-battle-report.json', import.meta.url), 'utf8'));

async function reportScenario(skillId, state = {}) {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts);
  const attacker = addAttacker(battle, attackerFromReport(report, master));
  const target = addTarget(battle, targetFromReport(report));
  return runScenario({ battle, attacker, target, skill: { id: skillId }, state });
}

test('report adapter: entry panel, equipment and every process instance (with runtime parameters) come from the report', async () => {
  const { master } = await dataPromise;
  assert.ok(isBattleReport(report));
  const spec = attackerFromReport(report, master);
  assert.equal(spec.unitDressId, 502220);
  assert.deepEqual(spec.stats, { hp: 13591, mp: 1018, str: 1270, def: 1621, int: 6741, mnd: 2808, crt: 11, source: '入场面板快照 panel-1', inBattle: false });
  assert.deepEqual(spec.equips.map(e => [e.pos, e.id, e.type, e.elem]), [[1, 108119, 17, 2], [2, 203110, 22, 0]]);
  const ice = spec.passives.find(p => p.id === 60001280);
  assert.deepEqual(ice.params[0].slice(0, 2), [2, 406], 'blessing level value read from the battle, not the master 100');
  assert.equal(spec.passives[0].id, 50222014, 'game creation order: personality first');
  assert.deepEqual(spec.personality, [{ passive: 50222014, level: 4, base: 50222011 }, { passive: 50222022, level: 2, base: 50222021 }]);
});

test('scenario: replaying the setup reproduces the reader\'s in-battle panel (DEF 2,295 / INT 10,111 / MND 3,482 / CRT 21)', async () => {
  const out = await reportScenario(270090);
  assert.equal(out.stats.def.real, 2295);
  assert.equal(out.stats.int.real, 10111);
  assert.equal(out.stats.mnd.real, 3482);
  assert.equal(out.stats.crt.real, 21);
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.unsupported, []);
});

test('scenario: 異度克里昂 from the report gives main + 60% passes with normal/critical ranges and the calculator-verified sub-hit', async () => {
  const out = await reportScenario(270090);
  const sub = out.hits.find(h => h.bulletId === 2700900 && h.hitIndex === 1);
  assert.equal(sub.dmgRatio, 6000);
  assert.equal(sub.attack, 14627);
  assert.deepEqual([sub.normal.min, sub.normal.max], [157572, 175079]); // calculator: 157,565–175,076
  assert.ok(sub.critical.min > sub.normal.max);
  assert.ok(out.hits.find(h => h.hitIndex === 0).cap === sub.cap && sub.cap > 200000);
  assert.ok(out.probabilistic.some(p => p.passiveName === '指導者' && p.prob === 25));
  assert.ok(out.conditionals.length >= 1);
  assert.ok(sub.edits.some(e => e.passiveName === '冰之皇帝賽裡歐斯的加護'));
});

test('scenario: HP below the 月光/knowledge thresholds switches those layers off automatically', async () => {
  const full = await reportScenario(270090, { hpPercent: 100 });
  const low = await reportScenario(270090, { hpPercent: 30 });
  assert.equal(full.stats.crt.real, 21);
  assert.ok(low.stats.crt.real < full.stats.crt.real, '銳氣 (HP condition) drops at low HP');
});
