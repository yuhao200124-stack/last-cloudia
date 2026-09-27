// Bit-exact reproduction of real hits captured by the damage reader (v0.41) for two more characters, from
// their battle-entry reports alone: 亞克 (physical, dual swords 封劍【塞爾比烏斯】 + 神帝劍瑪格納雷夫, crest
// traits, 貫通 25%, crits, and the 超必殺 whose cap depends on the skills used earlier in the battle) and
// 魯迪烏斯 (thunder magic 豪雷積雨雲 as the first action of the battle). Every sample records the game's
// settlement attack / defence, coefficient ratios, core and final value; the fixture also keeps the sandbox
// inputs (random roll, critical, forced probabilistic instance, skills cast before) that reproduce it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, K } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, setupBattle, preCast, runScenario } from '../dist/engine/scenario.mjs';
import { attackerFromReport, targetFromReport } from '../dist/engine/report-adapter.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const fixture = name => JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const dataPromise = loadEngineData({ unitDressIds: [502130, 502210], read });
const f32 = Math.fround;

// Replays every sample with its recorded inputs and counts exact final values.
async function replay(report, samples) {
  const { master, scripts } = await dataPromise;
  const spec = attackerFromReport(report, master);
  const groups = new Map();
  for (const s of samples) { const key = `${s.skillId}:${s.bulletId}:${s.preCasts.join(',')}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(s); }
  let exact = 0, checked = 0; const details = [];
  for (const list of groups.values()) {
    const { skillId, bulletId, preCasts } = list[0];
    const battle = new Battle(master, scripts, { probability: 'skip' });
    const attacker = addAttacker(battle, spec), target = addTarget(battle, targetFromReport(report));
    setupBattle(battle, attacker, target, { hpPercent: 100 });
    preCast(battle, attacker, target, preCasts);
    battle.beginSkill(attacker, target, skillId);
    const base = battle.snapshot();
    for (const s of list) {
      battle.restore(base); battle.options.forced = new Set(s.forced || []);
      const bullet = battle.createBullet(attacker, target, { skillId, bulletId, level: 9, random: s.random, critical: s.critical }); bullet.singlePass = true; battle.hit(bullet);
      const r = bullet.results[0]; checked++;
      assert.equal(r.attack, s.settlementAtk, `${skillId} settlement attack`);
      assert.equal(r.defense, s.settlementDef, `${skillId} settlement defence`);
      assert.equal(f32(r.q), f32(s.finalRatio), `${skillId} final ratio`);
      assert.equal(r.coreDamage, s.core, `${skillId} core`);
      if (r.damage === s.value) exact++; else details.push(`${skillId} core ${s.core}: sandbox ${r.damage} vs game ${s.value}`);
    }
  }
  return { exact, checked, details };
}

test('亞克: the report adapter keeps crest traits and support passives as raw process instances', async () => {
  const { master } = await dataPromise;
  const spec = attackerFromReport(fixture('ark-battle-report.json'), master);
  assert.deepEqual(spec.equips.map(e => [e.pos, e.id, e.type]), [[1, 101033, 10], [2, 101308, 10]], 'two swords: the second sits in the armour slot');
  const raw = spec.passives.filter(p => p.processes);
  assert.deepEqual(raw.map(p => [p.affiliation, p.localId, p.processes.length]).sort(), [[15, 55765, 1], [18, 400218, 2], [18, 400219, 1], [18, 400220, 1]]);
  assert.deepEqual(raw.find(p => p.localId === 400220).processes[0], { processId: 1082604, localIndex: 0, params: [-2, 5, 15000, 0, 0, 0, 0, 0, 0, 0] }, '徽章: ultimate cap +15,000');
  assert.deepEqual(spec.personality, [{ passive: 50213015, level: 5, base: 50213011 }, { passive: 50213023, level: 3, base: 50213021 }]);
});

test('亞克: 54 captured hits of 4 skills, the normal attack and the ultimate are reproduced exactly', async () => {
  const { exact, checked, details } = await replay(fixture('ark-battle-report.json'), fixture('ark-damage-samples.json').samples);
  assert.equal(checked, 54);
  assert.equal(exact, 54, details.join('\n'));
});

test('亞克: dual-wield sword passive, 天靈爆裂者 undead killer and the ultimate cap need the earlier casts', async () => {
  const { master, scripts } = await dataPromise;
  const report = fixture('ark-battle-report.json');
  const cast = (skillId, preCasts) => {
    const battle = new Battle(master, scripts, { probability: 'skip' });
    const attacker = addAttacker(battle, attackerFromReport(report, master)), target = addTarget(battle, targetFromReport(report));
    const out = runScenario({ battle, attacker, target, skill: { id: skillId }, state: { hpPercent: 100, preCasts }, assume: { probability: 'skip' }, randoms: [0.95] });
    return { out, battle, attacker };
  };
  const { out, attacker } = cast(5021305, []);
  assert.equal(out.stats.str.real, 10929, 'panel 7,286 → in-battle STR (report panel-4)');
  const hit = out.hits.find(h => !h.cancelled);
  assert.equal(hit.attack, 15322); assert.equal(hit.killer, true); assert.equal(hit.killerFactor, f32(2.25));
  assert.equal(f32(hit.coefficient * 0.6 * 1.25 * 2.25) > 0, true);
  assert.deepEqual(out.hits.filter(h => !h.cancelled && h.bulletId === 50213050).map(h => h.dmgRatio), [6000, 6000], '二刀流: both calls at 60%');
  assert.ok(out.fired.some(f => f.passiveName.includes('神帝劍')), 'the armour-slot sword\'s passive fires (SubWeaponType)');
  // the ultimate: fresh battle vs after 神託的誓言 (+100,000 cap buff) and the skills used before it
  const fresh = cast(5021306, []).out.hits.find(h => !h.cancelled);
  const after = cast(5021306, [391020, 5021305, 5021301, 5021301, 5021301, 5021301, 5021303, 5021304]).out.hits.find(h => !h.cancelled);
  assert.equal(after.cap, 543658, 'game cap of the captured 勇者之劍 hits');
  assert.ok(fresh.cap < after.cap);
  assert.deepEqual(attacker.equips.map(e => e.type), [10, 10]);
});

test('魯迪烏斯: 豪雷積雨雲 as the first action of a battle is reproduced exactly (4 captured hits)', async () => {
  const { exact, checked } = await replay(fixture('rudeus-battle-report.json'), fixture('rudeus-damage-samples.json').samples);
  assert.equal(checked, 4); assert.equal(exact, 4);
});

// ---- targets from MonsterMst (engine/monsters.json + engine/monster-passives.json, loaded on demand) ----
import { targetFromMonster } from '../dist/engine/scenario.mjs';
test('targets: MonsterMst reproduces the reader\'s boss and monster passives load without errors', async () => {
  const { master, scripts } = await dataPromise;
  master.merge(await read('engine/monsters.json', false)); master.merge(await read('engine/monster-passives.json', false));
  const report = fixture('ark-battle-report.json');
  const fromReport = targetFromReport(report), fromMst = targetFromMonster(master, 320602001);
  assert.equal(fromMst.name, fromReport.name);
  assert.deepEqual([fromMst.stats.hp, fromMst.stats.def, fromMst.stats.mnd, fromMst.stats.str, fromMst.stats.int], [fromReport.stats.hp, fromReport.stats.def, fromReport.stats.mnd, fromReport.stats.str, fromReport.stats.int]);
  assert.deepEqual(fromMst.elemResist, { 1: 0, 2: -25, 3: 0, 4: 0, 5: -25, 6: 50 });
  assert.deepEqual(fromMst.charTypes, [2006]);
  const run = spec => { const battle = new Battle(master, scripts, { probability: 'skip' }); const a = addAttacker(battle, attackerFromReport(report, master)), t = addTarget(battle, spec); const out = runScenario({ battle, attacker: a, target: t, skill: { id: 5021305 }, state: { hpPercent: 100 }, assume: { probability: 'skip' }, randoms: [0.95] }); return { hit: out.hits.find(h => !h.cancelled), errors: out.errors, passives: t.instances.length }; };
  const a = run(fromReport), b = run({ monsterId: 320602001 });
  assert.deepEqual([b.hit.attack, b.hit.defense, b.hit.normal.min, b.hit.cap], [a.hit.attack, a.hit.defense, a.hit.normal.min, a.hit.cap]);
  const c = run({ monsterId: 320901401 }); // 神獸帕帕拉納 carries its own passives (瀕死ステアップバフ, ブレイク時基本 …)
  assert.equal(c.passives > 0, true); assert.deepEqual(c.errors, []); assert.equal(c.hit.defense, 5500);
});
