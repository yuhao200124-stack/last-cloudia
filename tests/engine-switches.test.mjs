// The damage calculator's 特攻 / Break / 双刀 switches decide the state themselves (the bonuses bound to that
// state still come from the skills), and exclusive gear is taken at its highest enhancement stage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, K } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario, DUAL_WIELD_PROCESS } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = loadEngineData({ unitDressIds: [502220, 101011, 502230, 100642], read });
const character = dress => JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
const ownPassives = c => [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...c.transcend.map(p => p.passive)].map(id => ({ id }));
const boss = (charTypes = [2010]) => ({ name: '目标', isBoss: true, charTypes, stats: { hp: 99999999, mp: 100, def: 5000, mnd: 5000, str: 0, int: 0 }, elemResist: {} });

async function run(dress, skillId, { spec = {}, target = boss(), state = {} } = {}) {
  const { master, scripts } = await dataPromise;
  const c = character(dress);
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const a = addAttacker(battle, { unitDressId: dress, panelGiven: false, passives: ownPassives(c), personality: c.personality, equips: [], ...spec });
  const t = addTarget(battle, target);
  const out = runScenario({ battle, attacker: a, target: t, skill: { id: skillId }, state, assume: { probability: 'assume', instances: [] }, randoms: [0.95] });
  return { out, first: out.hits.filter(h => !h.cancelled && h.normal)[0], attacker: a };
}

test('特攻 switch: on = killer against any target, off = never; unset keeps the skills and the race deciding', async () => {
  // 洛琪希's 水王级魔术师: magic is a killer against a BOSS (applied by the game script to the target's races)
  assert.equal((await run(502220, 230020)).first.killer, true);
  assert.equal((await run(502220, 230020, { target: boss([]) })).first.killer, false, 'no race: the game script has nothing to apply it to');
  assert.equal((await run(502220, 230020, { state: { killer: 'off' } })).first.killer, false);
  const forced = await run(502220, 230020, { target: boss([]), state: { killer: 'on' } });
  assert.equal(forced.first.killer, true);
  assert.equal(forced.first.killerFactor.toFixed(2), '2.25', '特攻增幅 +50% still comes from her skills');
  assert(forced.out.assumptions.some(a => a.includes('种族未知')), 'a target without a race is reported');
  // 艾莉丝 has no killer against a dragon; the switch makes it one anyway
  assert.equal((await run(502230, 5022303)).first.killer, false);
  assert.equal((await run(502230, 5022303, { state: { killer: 'on' } })).first.killer, true);
});

test('Break switch: the target is in break, so break-bound bonuses of the skills apply; its defense factor is reported', async () => {
  const off = await run(101011, 1010113, { state: { targetBreak: false } });
  const on = await run(101011, 1010113, { state: { targetBreak: true, breakDefenseRatio: 1 } });
  // 阿尔克's 【超越】破防精通II: +40,000 cap against a broken target (+80,000 with one or no weapon)
  assert(on.first.cap >= off.first.cap + 40000, `${off.first.cap} → ${on.first.cap}`);
  assert.equal(on.first.defense, off.first.defense, 'ratio 1: defense unchanged');
  const halved = await run(101011, 1010113, { state: { targetBreak: true, breakDefenseRatio: 0.5 } });
  assert.equal(halved.first.defense, off.first.defense * 0.5);
  assert(halved.out.assumptions.some(a => a.includes('Break')));
});

test('双刀 switch: a stand-in sub weapon and the 二刀流 ratio make every physical hit two calls at 60%, without doubling the gear', async () => {
  const { master } = await dataPromise;
  const single = await run(502230, 5022303, { spec: { equips: [{ pos: 1, id: 101311 }] } });
  const dual = await run(502230, 5022303, { spec: { equips: [{ pos: 1, id: 101311 }, { pos: 2, id: 101311, copy: true }], dualWieldRatio: 6000 } });
  assert.equal(single.out.hits.filter(h => !h.cancelled && h.normal && h.bulletId === single.first.bulletId).length, 1);
  const calls = dual.out.hits.filter(h => !h.cancelled && h.normal && h.bulletId === dual.first.bulletId);
  assert.equal(calls.length, 2); assert.deepEqual(calls.map(h => h.dmgRatio), [6000, 6000]);
  assert(dual.attacker.instances.some(i => i.processId === DUAL_WIELD_PROCESS));
  assert.equal(dual.out.stats.str.panel, single.out.stats.str.panel, 'the stand-in adds no weapon stats');
  assert.equal(master.itemEquip.get(101311).EQUIP_TYPE, 10);
});

test('exclusive gear passives can be replaced by the highest enhancement stage (ItemEquipMst points to the base stage)', async () => {
  const { master } = await dataPromise;
  await loadPassives(master, [1020482], read);
  const base = await run(100642, 1006423, { spec: { equips: [{ pos: 1, id: 102048 }] } });
  const max = await run(100642, 1006423, { spec: { equips: [{ pos: 1, id: 102048 }], equipPassiveIds: { 102048: [1020482] } } });
  const has = (r, id) => r.attacker.instances.some(i => i.localId === 102048 && i.affiliation === K.AFF.WEAPON && i.passiveId === id);
  assert(has(base, 1020480) && !has(base, 1020482));
  assert(has(max, 1020482) && !has(max, 1020480));
  // 攻击 +15% instead of +10%
  assert(max.out.stats.str.panel > base.out.stats.str.panel);
});
