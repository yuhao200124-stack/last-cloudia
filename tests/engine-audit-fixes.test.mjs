// Fixes from the 2026-09-30 review (user: “可以先改1-10”): triggers the sandbox never fired (MP 42, unit state 59),
// the boss's own Break passives, chances decided inside scripts, chances that only roll on a critical hit, the boss's
// chances kept out of the attacker's list, and assumed enemy-side effects landing on the enemy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario, targetFromMonster } from '../dist/engine/scenario.mjs';
import { attackerFromReport } from '../dist/engine/report-adapter.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const report = JSON.parse(fs.readFileSync(new URL('./fixtures/roxy-battle-report.json', import.meta.url), 'utf8'));
const dataPromise = (async () => {
  const d = await loadEngineData({ unitDressIds: [502220], read });
  d.master.merge(await read('engine/monsters.json')); d.master.merge(await read('engine/monster-passives.json'));
  await loadPassives(d.master, [27534, 14000, 20019115, 1040440, 27233], read);
  return d;
})();
// the calculator's preset 轟鳥龍恩德爾羅納 (fields) with the monster's own passives, as the panel builds it
const bird = master => ({ ...targetFromMonster(master, 320401703), stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: { 1: 25, 2: -25, 3: 50, 4: 50, 5: -25, 6: 25 }, charTypes: [2010] });

async function roxy({ extra = [], skill, state = { hpPercent: 100 }, assume = {} }) {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, {});
  const spec = attackerFromReport(report, master); spec.passives = [...spec.passives, ...extra.map(id => ({ id }))];
  const attacker = addAttacker(battle, spec), target = addTarget(battle, bird(master));
  const out = runScenario({ battle, attacker, target, skill: { id: skill }, state, assume: { probability: 'skip', ...assume }, randoms: [0.95] });
  return { out, attacker, target, battle };
}
const first = out => out.hits.find(h => h.normal && !h.cancelled);

test('MP (trigger 42): 曉 raises attack at full MP and not at low MP', async () => {
  const full = (await roxy({ extra: [27534], skill: 5022201, state: { hpPercent: 100, mpPercent: 100 } })).out.stats.str;
  const low = (await roxy({ extra: [27534], skill: 5022201, state: { hpPercent: 100, mpPercent: 0 } })).out.stats.str;
  assert.ok(full.real > full.panel, `full MP ${full.real} > ${full.panel}`);
  assert.equal(low.real, low.panel);
});

test('skill activation (trigger 59, state MAIN): 星眼 raises a 特技 hit, not a magic', async () => {
  const base = first((await roxy({ skill: 5022203 })).out).normal.mean, eye = first((await roxy({ extra: [14000], skill: 5022203 })).out).normal.mean;
  assert.ok(eye > base * 1.3, `水弹 ${base} → ${eye}`);
  const magic = first((await roxy({ skill: 270090 })).out).normal.mean, magicEye = first((await roxy({ extra: [14000], skill: 270090 })).out).normal.mean;
  assert.equal(magicEye, magic);
});

test('Break: the boss’s own Break passives lower its MND (10000 → 7500) with no extra calculator factor', async () => {
  const off = first((await roxy({ skill: 270090, state: { hpPercent: 100 } })).out);
  const on = first((await roxy({ skill: 270090, state: { hpPercent: 100, targetBreak: true, breakDefenseRatio: 1 } })).out);
  assert.equal(off.defense, 10000);
  assert.equal(on.defense, 7500);
  assert.ok(on.normal.mean > off.normal.mean);
});

test('a chance decided inside a script (lottery) is listed and gives the same numbers every run', async () => {
  const runs = [];
  for (let i = 0; i < 3; i++) { const { out } = await roxy({ extra: [20019115], skill: 5022201 }); runs.push(JSON.stringify(out.hits.map(h => h.normal))); assert.ok(out.probabilistic.some(p => p.passiveId === 20019115), 'listed'); }
  assert.equal(new Set(runs).size, 1);
});

test('chances: only the attacker’s own are listed; one that rolls only on a critical hit is listed and can be ticked', async () => {
  const { out, attacker } = await roxy({ extra: [1040440], skill: 5022203 });
  assert.ok(out.probabilistic.every(p => p.key.startsWith(`${attacker.id}:`)));
  const crit = out.probabilistic.find(p => p.passiveId === 1040440 && /上限/.test(p.processName));
  assert.ok(crit, '剛滅骨巴爾札克: critical-only cap chance listed');
  const on = (await roxy({ extra: [1040440], skill: 5022203, assume: { forced: [crit.key] } })).out;
  assert.ok(first(on).critCap > first(out).critCap);
});

test('an assumed “putting an ailment on the enemy” effect lands on the enemy, not on the attacker', async () => {
  const probe = (await roxy({ extra: [27233], skill: 5022203 })).out;
  const c = probe.conditionals.find(x => x.passiveId === 27233);
  assert.ok(c, '衰弱毒 offered');
  const { attacker, target } = await roxy({ extra: [27233], skill: 5022203, assume: { instances: [c.key] } });
  assert.ok(!attacker.buffs.some(b => b.isDebuff));
  assert.ok(target.buffs.some(b => b.isDebuff));
});

// Boss 自带被动 (user 2026-09-30: “这些boss被动计算器不要算但是在boss界面要写出来” / “除了 Break 都不算”)
test('a monster’s own passives: only the Break ones are computed, all are listed with a text', async () => {
  const { master } = await dataPromise;
  const spec = targetFromMonster(master, 320401703);
  assert.deepEqual(spec.listedPassives, [101, 13675, 13689, 13690, 13746]);
  assert.deepEqual(spec.passives.map(p => p.id), [13689, 13690, 13746]);
  // 瀕死ステアップバフ (DEF/MND +35% under 30% HP) is not computed even when the boss is at 20%
  const low = first((await roxy({ skill: 270090, state: { hpPercent: 100, targetHpPercent: 20 } })).out);
  assert.equal(low.defense, 10000);
  const texts = JSON.parse(fs.readFileSync(new URL('../dist/game-data/engine/monster-passive-text.json', import.meta.url), 'utf8')).texts;
  assert.deepEqual(texts[13746], [['Break 中', [[['防御'], '−25%'], [['魔抗'], '−25%']]]]);
  assert.deepEqual(texts[13675], [['HP降到30%以下时', ['攻击', '防御', '魔力', '魔抗'].map(w => [[w], '+35%'])]]);   // one condition (“写简单点”)
  assert.deepEqual(texts[101], [['', ['开场第一次行动不用等待']]]);
  const panel = fs.readFileSync(new URL('../dist/engine-panel.mjs', import.meta.url), 'utf8');
  assert.ok(panel.includes('renderBossPassives(targetSpec)') && panel.includes('fromReader ? targetSpec.monsterId : latest.bossMonsterId'));
});
