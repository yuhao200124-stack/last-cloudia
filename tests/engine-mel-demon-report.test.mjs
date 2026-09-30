// 魔神梅莉 (unit dress 100642) against 轟鳥龍恩德爾羅納, from the damage reader v0.42 capture of 2026-10-01 (user: “还是一样3个技能伤害
//都有偏差”). The settlement cache gives, per hit, the attack, defense, element resistance and the damage the game dealt; with the
// state of that battle (敌方异常 on, 絕望之魂 cast, the normal attack's defense debuff) the calculator must land every
// sample inside its range. Three things were wrong before: the report's panel already had the battle-start buffs on (攻击 5657
// = 4191 × 1.35), 惡夢三重奏's per-ailment count landed on the boss instead of 梅莉, and applying ailments did not stack it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { runScenario, addAttacker, addTarget } from '../dist/engine/scenario.mjs';
import { attackerFromReport, targetFromReport, reportDressId } from '../dist/engine/report-adapter.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const report = JSON.parse(fs.readFileSync(new URL('./fixtures/mel-demon-battle-report.json', import.meta.url), 'utf8'));
const { samples } = JSON.parse(fs.readFileSync(new URL('./fixtures/mel-demon-damage-samples.json', import.meta.url), 'utf8'));
const dataPromise = (async () => {
  const d = await loadEngineData({ unitDressIds: [100642], read });
  const spec = attackerFromReport(report, d.master);
  await loadPassives(d.master, spec.passives.map(p => p.id), read);
  return { ...d, spec };
})();
const STATE = { targetAilment: true, hpPercent: 100, preCasts: [381160, 1006421] }; // 絕望之魂, then a normal attack (DEF −15%)

async function scenario(skillId, state = STATE) {
  const { master, scripts, spec } = await dataPromise;
  const battle = new Battle(master, scripts);
  return runScenario({ battle, attacker: addAttacker(battle, spec), target: addTarget(battle, targetFromReport(report)), skill: { id: skillId }, state, assume: { probability: 'assume' }, randoms: [0.9, 1] });
}

test('魔神梅莉 report: the outfit is found and the in-battle panel is solved back to the entry panel', async () => {
  const { master, spec } = await dataPromise;
  assert.equal(reportDressId(report.units[0], master), 100642);
  assert.equal(spec.stats.inBattle, true);
  const out = await scenario(1006423);
  assert.deepEqual([out.stats.str.panel, out.stats.str.real], [4191, 5657], '5657 already includes 自動大型鼓舞 +35%');
  assert.deepEqual([out.stats.crt.panel, out.stats.crt.real], [11, 36], '36 already includes 自動暴擊 +15 and 銳氣 +10');
});

test('魔神梅莉 report: every settlement sample of the four moves is inside the calculator range', async () => {
  for (const skillId of [1006421, 1006423, 1006424, 1006425]) {
    const out = await scenario(skillId);
    const dark = out.hits.filter(h => h.normal && h.element === 6);
    assert.ok(dark.length, `${skillId}: a dark call`);
    const h = dark[0];
    const mine = samples.filter(s => s.skillId === skillId);
    assert.equal(h.attack, mine[0].attack, `${skillId}: the settlement attack`);
    assert.equal(h.defense, 3400);
    assert.equal(h.resist, 5, '暗耐性 25 − 20 (絕望之魂)');
    for (const s of mine.filter(s => !s.critical)) assert.ok(s.value >= h.normal.min && s.value <= h.normal.max, `${skillId} normal ${s.value} in ${h.normal.min}–${h.normal.max}`);
    // critical hits once 惡夢三重奏 is full (the first few hits of the battle had fewer stacks)
    const crits = mine.filter(s => s.critical && s.value / s.baseDamage > 20);
    assert.ok(crits.length);
    for (const s of crits) assert.ok(s.value >= h.critical.min && s.value <= h.critical.max, `${skillId} critical ${s.value} in ${h.critical.min}–${h.critical.max}`);
  }
});

test('惡夢三重奏: its count is kept on its owner, one stack per ailment put on the enemy, full with 敌方异常', async () => {
  const off = await scenario(1006423, { ...STATE, targetAilment: false });
  const on = await scenario(1006423);
  const ratio = r => { const h = r.hits.find(x => x.normal && x.element === 6); return h.critical.max / h.normal.max; };
  assert.ok(ratio(on) > ratio(off) * 1.3, 'critical hits +36% with 6 stacks');
  assert.ok(on.assumptions.some(a => a.startsWith('敌方异常：按已对敌人施加异常')));
});

test('敌方异常 counts 出血 (絕命一閃 防御 −15% without the normal attack first) and says what each switch brings', async () => {
  const { master, scripts, spec } = await dataPromise;
  const battle = new Battle(master, scripts);
  const state = { targetAilment: true, hpPercent: 100, preCasts: [381160] };
  const out = runScenario({ battle, attacker: addAttacker(battle, spec), target: addTarget(battle, targetFromReport(report)), skill: { id: 1006424 }, state, assume: { probability: 'skip' }, randoms: [0.95],
    probes: [{ id: 'enemyAilment', state: { ...state, targetAilment: false } }, { id: 'fullHp', state: { ...state, hpPercent: 99 } }] });
  assert.equal(out.hits.find(h => h.normal && h.element === 6).defense, 3400);
  const names = id => out.switchEffects[id].map(x => x.passiveName);
  assert.ok(names('enemyAilment').includes('絕命一閃') && names('enemyAilment').includes('惡夢三重奏'));
  assert.deepEqual(names('fullHp'), ['銳氣']);
  assert.deepEqual([out.elementOverride.element, out.elementOverride.passiveId], [6, 27731], '聖邪之泛濫 makes the special dark');
});

test('the 聖邪之泛濫 element change can be unticked (then the special keeps its own element)', async () => {
  const on = await scenario(1006423), off = await scenario(1006423, { ...STATE, skillElementOff: true });
  assert.ok(on.hits.filter(h => h.normal).every(h => h.element === 6));
  assert.ok(off.hits.filter(h => h.normal).every(h => h.element !== 6));
  assert.equal(off.elementOverride.passiveId, 27731, 'still listed so it can be ticked again');
});

test('濒死 fires the “HP crossed 30%” effects: 覺醒II 攻击 +30% (the second 2026-10-01 battle: 剪刀尾巴 attack 8884)', async () => {
  const out = await scenario(1006423, { ...STATE, hpPercent: 25 });
  const h = out.hits.find(x => x.normal && x.element === 6);
  assert.equal(h.attack, 8884);
  // that battle's settlement samples at DEF 3400: normal 11,345–12,432, critical 18,102–19,726
  assert.ok(h.normal.min <= 11345 && h.normal.max >= 12432 && h.critical.min <= 18102 && h.critical.max >= 19726);
});

test('满血 and 濒死 together: 覺醒II fires on the way down, then 銳氣 holds at full HP; 开局BUFF off removes 自動大型鼓舞', async () => {
  const both = await scenario(1006423, { ...STATE, hpPercent: 100, hpDip: 25 });
  const h = both.hits.find(x => x.normal && x.element === 6);
  assert.equal(h.attack, 8884);
  assert.equal(h.crt, 41);
  const noOpening = await scenario(1006423, { ...STATE, openingBuffActive: false });
  assert.equal(noOpening.hits.find(x => x.normal && x.element === 6).attack, 6160, '4191 × (1 + 47%)');
});
