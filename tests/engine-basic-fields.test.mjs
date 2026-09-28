// 法强／攻击力、最终暴击率 and 伤害上限 of the damage calculator are the selected move's own values from the
// game scripts (the move's own bonuses included), each with the parts it is made of; all three are read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = loadEngineData({ unitDressIds: [502220, 502230], read });
const character = dress => JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
const ownPassives = c => [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...c.transcend.map(p => p.passive)].map(id => ({ id }));
const boss = () => ({ name: '目标', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 5000, mnd: 5000, str: 0, int: 0 }, elemResist: {} });

async function run(dress, skillId, state = {}) {
  const { master, scripts } = await dataPromise;
  const c = character(dress);
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const a = addAttacker(battle, { unitDressId: dress, panelGiven: false, passives: ownPassives(c), personality: c.personality, equips: [] });
  const t = addTarget(battle, boss());
  const out = runScenario({ battle, attacker: a, target: t, skill: { id: skillId }, state, assume: { probability: 'assume', instances: [] }, randoms: [0.95] });
  const hits = out.hits.filter(h => !h.cancelled && h.normal);
  return { out, hits, first: hits[0] };
}
const total = parts => parts.reduce((a, p) => ({ val: a.val + p.val, per: a.per + p.per, add: a.add + p.add }), { val: 0, per: 0, add: 0 });

test('the parts rebuild the move\'s own attack value, critical rate and cap', async () => {
  for (const [dress, skill] of [[502220, 230020], [502230, 5022303]]) {
    const { first } = await run(dress, skill);
    const { attack, crit, cap } = first.breakdown;
    assert.equal(attack.final, first.attack, 'the attack value used by the damage formula');
    const r = total(attack.runtime);
    assert.equal(Math.floor((attack.panel + r.val) * (1 + r.per / 1e4)) + r.add, attack.final);
    assert.equal(crit.final, first.crt);
    const c = total(cap);
    assert.equal(Math.floor((9999 + c.val) * (1 + c.per / 1e4)) + c.add, first.capComputed);
    assert.equal(first.cap, first.capComputed);
    for (const p of [...attack.status, ...attack.runtime, ...crit.runtime, ...cap]) assert.notEqual(p.source?.kind, 'none', 'every part names where it comes from');
  }
});

test('the critical rate follows the move: bonuses bound to the move\'s element are in its hits only', async () => {
  // 艾莉丝's 无属性暴击提升 counts for her non-element skill, on top of the unit's general rate
  const { first, out } = await run(502230, 5022303);
  assert(first.crt > out.stats.crt.real, `${first.crt} vs ${out.stats.crt.real}`);
  assert(first.breakdown.crit.runtime.some(p => p.layer === 'work' || p.layer === 'bullet'));
});
