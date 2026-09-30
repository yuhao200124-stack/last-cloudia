// 敌方异常 (user 2026-09-30: “我打开这个选项就说明敌方进入异常了”, a general switch): the target has the six basic
// ailments, so the “对异常状态中的敌人” effects count — e.g. 魔王凯娜雷殊's 异常痛击III / V / 【超越】异常痛击.
// And her moves are 魔法剣 (物理＋魔法): 攻击力 × (1 − 83.79%) plus 法强 × (1 + 45.89%), shown with the ratio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} };

test('敌方异常: the ailment effects count only with the switch', async () => {
  const dress = 101270, c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
  const d = await loadEngineData({ unitDressIds: [dress], read });
  const ids = [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...(c.transcend || []).map(p => p.passive)];
  await loadPassives(d.master, ids, read);
  const battle = new Battle(d.master, d.scripts, {});
  const run = targetAilment => { battle.reset(); const out = runScenario({ battle, attacker: addAttacker(battle, { unitDressId: dress, panelGiven: false, passives: ids.map(id => ({ id })) }), target: addTarget(battle, boss), skill: { id: 1012703 }, state: { hpPercent: 100, targetAilment }, assume: { probability: 'skip' }, randoms: [0.95] }); return out.hits.find(h => h.normal); };
  const off = run(false), on = run(true);
  const names = h => new Set(h.edits.map(e => e.localId));
  assert.ok(on.normal.mean > off.normal.mean * 1.5, `${off.normal.mean} → ${on.normal.mean}`);
  assert.ok(on.capComputed > off.capComputed);
  assert.ok(on.edits.length > off.edits.length);
  // 魔法剣: the bullet's attack is 攻击力 × 16.21% plus the move's 法强
  const bullet = off.breakdown.attack.runtime.find(r => r.source?.kind === 'bullet');
  assert.equal(bullet.per, -8379); assert.ok(bullet.add > 0);
  assert.deepEqual(c.specials[0].parts[0].otherStatPercent, 45.89);
});

test('the switch is on the calculator page', () => {
  const html = fs.readFileSync(new URL('../dist/damage-calculator.html', import.meta.url), 'utf8'), js = fs.readFileSync(new URL('../dist/damage-calculator.mjs', import.meta.url), 'utf8');
  assert.match(html, /<input id="enemyAilment" type="checkbox">敌方异常/);
  assert.match(js, /'mpLow','enemyAilment'/);
});
