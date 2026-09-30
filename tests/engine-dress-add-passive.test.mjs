// UnitDressMst.ADD_PASSIVE (2026-09-30, user asked what 忘却终焉 does): 魔王凯娜雷殊 always carries 28586 / 28587; the latter
// gives 攻击·防御·魔力 +80% and 超必杀 伤害 +50%·上限 +200000 while the 终剧 buff (忘却终焉's 汎用ユニットバフ 81748) is on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario, dressAddPassives } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 400, mnd: 1000, str: 0, int: 0 }, elemResist: {} };

test('the engine data carry ADD_PASSIVE and the character bundles its passives', () => {
  const shared = JSON.parse(fs.readFileSync(new URL('../dist/game-data/engine/shared.json', import.meta.url), 'utf8')).UnitDressMst;
  const col = shared.cols.indexOf('ADD_PASSIVE'); assert.ok(col > 0);
  assert.equal(shared.rows.find(r => r[0] === 101270)[col], '28586:28587');
  const c = JSON.parse(fs.readFileSync(new URL('../dist/game-data/engine/c/101270.json', import.meta.url), 'utf8')).PassiveSkillMst.rows;
  assert.ok(c.some(r => r[0] === 28587 && /1082607:10000:17700:5:200000/.test(r[4])));
});

test('忘却终焉 before the 超必杀: the 终剧 passive raises its cap by 200,000 and its damage', async () => {
  const dress = 101270, c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
  const d = await loadEngineData({ unitDressIds: [dress], read });
  const ids = [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive)];
  await loadPassives(d.master, ids, read);
  assert.deepEqual(dressAddPassives(d.master, d.master.unitDress.get(dress)).map(p => p.id), [28586, 28587]);
  const battle = new Battle(d.master, d.scripts, {});
  const run = preCasts => { battle.reset(); return runScenario({ battle, attacker: addAttacker(battle, { unitDressId: dress, panelGiven: false, passives: ids.map(id => ({ id })) }), target: addTarget(battle, boss), skill: { id: 1012706 }, state: { hpPercent: 100, preCasts }, assume: { probability: 'skip' }, randoms: [0.95] }).hits.find(h => h.normal); };
  const plain = run([]), finale = run([385440]);
  assert.equal(finale.capComputed - plain.capComputed, 200000);
  assert.ok(finale.normal.mean > plain.normal.mean * 2);
});
