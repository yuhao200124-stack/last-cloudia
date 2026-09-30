// The calculator panel's own logic, run for real (user 2026-09-30, item 34: several tests only looked for text in the
// source): equipping the move, what the character can wear, the 触发效果 sentence, the board skills of a loadout,
// 圣物属性 on the final value, and the buff-category rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle, parseInts } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';
import { effectSentence, equipMove, gearFor, isFree, splitBuild } from '../dist/engine-panel-logic.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dataPromise = (async () => { const d = await loadEngineData({ unitDressIds: [502220], read }); await loadPassives(d.master, [3900, 12100, 26100, 55782], read); return d; })();
const roxy = JSON.parse(fs.readFileSync(new URL('../dist/game-data/c/502220.json', import.meta.url), 'utf8'));
const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} };

test('equipMove: a magic that is not equipped is carried; the character’s own skills are not added again', async () => {
  const { master, scripts } = await dataPromise;
  const spec = { unitDressId: 502220, panelGiven: false, passives: [{ id: 26100 }, { id: 55782 }] };
  equipMove(spec, 270090, master, parseInts);
  assert.deepEqual(spec.magic, [270090]);
  equipMove(spec, 5022203, master, parseInts);                    // 水弹: her own 特技
  assert.deepEqual(spec.magic, [270090]);
  const listed = { skills: [{ id: 5022203, type: 1 }] }; equipMove(listed, 270090, master, parseInts);
  assert.deepEqual(listed.skills.map(s => s.id), [5022203, 270090]);
  // with it, 魔法連鎖 / 魔術共鳴 read the cast magic from her skills (the ×1.35 of 2026-09-29)
  const battle = new Battle(master, scripts, {});
  const out = runScenario({ battle, attacker: addAttacker(battle, spec), target: addTarget(battle, boss), skill: { id: 270090 }, state: { hpPercent: 100 }, assume: { probability: 'skip' } });
  const ids = out.hits.find(h => h.normal).edits.map(e => e.localId);
  assert.ok(ids.includes(26100) && ids.includes(55782));
});

test('gearFor: her own weapons and armour, plus what a picked skill adds; 二刀流 makes two weapons', async () => {
  const { master } = await dataPromise;
  assert.deepEqual(gearFor(master, 502220, []), { weapons: [12, 14, 17], armors: [21, 22], dual: false });
  const more = gearFor(master, 502220, [3900, 12100]);            // 机械装备 (1100000 → 15), 二刀流 (1080800)
  assert.deepEqual(more.weapons, [12, 14, 15, 17]); assert.equal(more.dual, true);
});

test('触发效果: the sentence of the description that is this effect', () => {
  const text = roxy.passives['50222022'].textS;
  assert.match(effectSentence(text, 10, '伤害上限'), /^战斗开始时以及每40秒/);
  assert.match(effectSentence(text, 18, '体力回复'), /^发动攻击系的特技时/);
  assert.equal(effectSentence('只有一句', 10, '伤害'), '只有一句');
});

test('配装: board skills are in at 0 SC; a saved loadout that lists one loses it', async () => {
  const { master } = await dataPromise;
  const free = id => isFree(master, id);
  const board = roxy.ownPassives.map(p => p.passive).filter(id => !free(id));
  assert.ok(board.length > 0, 'she has SC skills on her board');
  const split = splitBuild(roxy, [board[0], 12600], free);
  assert.ok(split.auto.includes(board[0]));
  assert.deepEqual(split.picked, [12600]);
  assert.deepEqual(split.selected, [12600]);
});

test('圣物属性 is added on the final stat', async () => {
  const { master, scripts } = await dataPromise;
  const run = finalAdd => { const battle = new Battle(master, scripts, {}); const a = addAttacker(battle, { unitDressId: 502220, panelGiven: false, magic: [270090], ...(finalAdd ? { finalAdd } : {}) }); return runScenario({ battle, attacker: a, target: addTarget(battle, boss), skill: { id: 270090 }, state: { hpPercent: 100 }, assume: { probability: 'skip' } }); };
  const without = run(null), withArk = run({ int: 1000 });
  assert.equal(withArk.stats.int.real - without.stats.int.real, 1000);
  assert.ok(withArk.hits.find(h => h.normal).normal.mean > without.hits.find(h => h.normal).normal.mean);
});

test('buffs of one category: the stronger replaces the weaker; different operations of a category both stay', async () => {
  const { master, scripts } = await dataPromise;
  const battle = new Battle(master, scripts, {});
  const u = addAttacker(battle, { unitDressId: 502220, panelGiven: false });
  battle.buffControl(u.id, 30200, [-1, 0, 5000]); battle.buffControl(u.id, 30202, [-1, 0, 6500]);   // 魔力提升 ×2 (category 300)
  assert.deepEqual(u.buffs.filter(b => b.category === 300).map(b => b.buffId), [30202]);
  battle.buffControl(u.id, 30203, [-1, 0, 1000]); battle.buffControl(u.id, 30302, [-1, 0, 1000]);   // 千變萬化 攻/防 (12500: 302 and 303)
  assert.deepEqual(u.buffs.filter(b => b.category === 12500).map(b => b.buffId).sort(), [30203, 30302]);
});
