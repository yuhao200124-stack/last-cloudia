// 辅助魔法 (magic without damage) checked in the calculator are cast before the move, so the game scripts apply
// them; what each one does is measured from the scripts. Buffs of one category only apply the strongest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, K } from '../dist/engine/battle.mjs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario, measureSupport } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = loadEngineData({ unitDressIds: [502220], read });
const roxy = JSON.parse(fs.readFileSync(new URL('../dist/game-data/c/502220.json', import.meta.url), 'utf8'));
const ownPassives = c => [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...c.transcend.map(p => p.passive)].map(id => ({ id }));
const boss = () => ({ name: '目标', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 5000, mnd: 5000, str: 0, int: 0 }, elemResist: {} });

async function setup() {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, { probability: 'assume' });
  const attacker = addAttacker(battle, { unitDressId: 502220, panelGiven: false, passives: ownPassives(roxy), personality: roxy.personality, equips: [] });
  const target = addTarget(battle, boss());
  return { battle, attacker, target };
}
async function hit(preCasts) {
  const { battle, attacker, target } = await setup();
  const out = runScenario({ battle, attacker, target, skill: { id: 230020 }, state: { preCasts }, assume: { probability: 'assume', instances: [] }, randoms: [0.95] });
  return out.hits.filter(h => !h.cancelled && h.normal)[0];
}

test('亿万虚弱: the game data lowers every element resistance of the target by 20 for 40 seconds', async () => {
  const { battle, attacker, target } = await setup();
  const m = measureSupport(battle, attacker, target, [350110, 391040]);
  const weak = m.get(350110).effects.filter(e => e.side === 'target' && e.entries.length);
  assert.equal(weak.length, 1);
  assert.equal(weak[0].duration, 2400, '2400 frames = 40 s');
  assert.deepEqual(weak[0].entries.map(e => [e.op, e.params[0], e.params[1]]), [1, 2, 3, 4, 5, 6].map(el => [K.OP.ELEM_RESIST, el, -20]));
  assert(m.get(391040).effects.some(e => e.side === 'self' && e.entries.some(x => x.op === K.OP.INT && x.params[1] === 6500)), '魔术指导: 法强 +65% on the caster');
  assert.equal((await hit([])).resist, 0);
  assert.equal((await hit([350110])).resist, -20, 'checked: applied to the target by the game script');
});

test('one buff category applies only its strongest buff: 魔术指导 法强+65% replaces EX灵气 法强+50%', async () => {
  const plain = await hit([]);
  const guided = await hit([391040]);
  const per = h => h.breakdown.attack.runtime.filter(p => p.source?.kind === 'buff').map(p => p.per);
  assert(per(plain).includes(5000), 'EX灵气 on its own');
  assert(per(guided).includes(6500) && !per(guided).includes(5000), `${per(guided)}`);
  assert.equal(guided.capComputed, plain.capComputed + 30000, 'the 魔法伤害上限 +30,000 buff is another category and still applies');
});
