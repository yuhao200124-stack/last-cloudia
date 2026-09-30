// 异常耐性 (user 2026-09-30: “目标 异常耐性（参数 3, -1，数值含义未解读）…去搞清楚”): op 306 StatusResist is “0:タイプ
// 1:段階値(-2～+2)” (procCondCommon.lua) — the ailment and the number of stages; the calculator names both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, measureSupport } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };

test('镇魂的超阶之魂 lowers 疾病 (3) and 诅咒 (5) by one stage and raises the cap while the target has an ailment', async () => {
  const dress = 101270, c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
  const d = await loadEngineData({ unitDressIds: [dress], read });
  const ids = [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive)];
  await loadPassives(d.master, ids, read);
  const battle = new Battle(d.master, d.scripts, {});
  const a = addAttacker(battle, { unitDressId: dress, panelGiven: false, passives: ids.map(id => ({ id })) });
  const t = addTarget(battle, { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} });
  const effects = measureSupport(battle, a, t, [381300], {}).get(381300).effects;
  const soul = effects.find(e => e.buffId === 2030651);
  assert.deepEqual(soul.entries, [{ op: 306, params: [3, -1] }, { op: 306, params: [5, -1] }]);
  assert.equal(soul.duration, -1);
  assert.deepEqual(effects.find(e => e.buffId === 1082619).params.slice(1, 5), [0, -2, 0, 20000]);
});

test('the calculator names the ailment and the stages, and shows the hidden 受伤害上限 buff', () => {
  const panel = fs.readFileSync(new URL('../dist/engine-panel.mjs', import.meta.url), 'utf8');
  assert(panel.includes("const AILMENT_NAMES = { 1: '毒', 2: '麻痹', 3: '疾病', 4: '暗黑', 5: '诅咒', 6: '沉默'"));
  assert(panel.includes('耐性 ${signed(stage)} 级（1 级＝耐性值 50）'));
  assert.match(panel, /1082619: \(\[, ail, , , add, per\]\) =>/);
  assert(panel.includes("'，自身存活期间一直有效'"));
  assert(!panel.includes("306: '异常耐性'"));
});

// 2026-09-30 (user: “看看还有哪些机制没搞明白”): the other controls get words, and a buff that only acts when damage is dealt
// is described by its script's own parameter comments (buff-params.json from process.lua)
test('support magic: controls and damage-time buffs are described, not left as raw parameters', () => {
  const panel = fs.readFileSync(new URL('../dist/engine-panel.mjs', import.meta.url), 'utf8');
  assert(!panel.includes('含义未逐项核对'));
  for (const op of [308, 502, 503, 504, 505, 507, 509, 210, 312, 320, 323, 326, 508, 800, 824, 829]) assert.match(panel, new RegExp(`\\n  ${op}: `));
  const bp = JSON.parse(fs.readFileSync(new URL('../dist/game-data/engine/buff-params.json', import.meta.url), 'utf8'));
  assert.deepEqual(bp['2050417'][1], ['被ダメージ倍率', '与ダメージ倍率', '神専用与ダメージ倍率']);
  assert.ok(Object.keys(bp).length > 700);
});
