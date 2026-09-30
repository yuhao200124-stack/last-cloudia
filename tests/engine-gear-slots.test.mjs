// 其他装备 (user 2026-09-30: “计算器里选装备”, keeping the 专武 selector): any piece from dist/game-data/equipment.json goes
// into a free slot at max level; its stats and its effects (equipment passives) count like the game's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} };
const equipment = JSON.parse(fs.readFileSync(new URL('../dist/game-data/equipment.json', import.meta.url), 'utf8'));
const item = id => Object.fromEntries(equipment.cols.map((c, i) => [c, equipment.items.find(r => r[0] === id)[i]]));

test('equipment.json: every piece but the outfits, its max stats, its effects with text, the top tier of each series', () => {
  assert.ok(equipment.items.length > 1900);
  assert.ok(!equipment.items.some(r => r[2] === 40));
  const nus = item(304488);                                                 // 「努斯」之冠
  assert.equal(nus.name, '「努斯」之冠'); assert.equal(nus.type, 30); assert.equal(nus.stats, '0:50:120:0:142:0');
  assert.match(equipment.passiveText[nus.passives[0]], /炎属性的伤害\+20%/);
  assert.equal(item(106091).dress, 101270);                                // 幻夜之魔暗锁 belongs to 凯娜雷殊
});

test('a chosen accessory adds its stats and its effect', async () => {
  const dress = 101270, c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
  const d = await loadEngineData({ unitDressIds: [dress], read });
  const ids = [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...(c.transcend || []).map(p => p.passive)];
  await loadPassives(d.master, [...ids, 3042000], read);
  const battle = new Battle(d.master, d.scripts, {});
  const run = equips => { battle.reset(); return runScenario({ battle, attacker: addAttacker(battle, { unitDressId: dress, panelGiven: false, passives: ids.map(id => ({ id })), equips }), target: addTarget(battle, boss), skill: { id: 1012703 }, state: { hpPercent: 100 }, assume: { probability: 'skip' }, randoms: [0.95] }); };
  const without = run([]), withIt = run([{ pos: 3, id: 304200 }]);   // 憎恨之祈祷: 攻防法抗 +84, 对神类型以外的敌人伤害 +7%
  assert.equal(withIt.stats.int.panel - without.stats.int.panel >= 84, true);
  assert.ok(withIt.hits.find(h => h.normal).edits.some(e => e.localId === 304200), 'its passive counts');
  assert.ok(withIt.hits.find(h => h.normal).normal.mean > without.hits.find(h => h.normal).normal.mean);
});
