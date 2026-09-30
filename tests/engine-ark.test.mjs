// 添加圣物 (user 2026-09-30: “在添加装备右边再弄一个添加圣物”, “圣物直接按照最大的算”): one ark per character at its top
// level; its six stats join the panel after the equipment and the crest (UnitUtil.AddArkParameter), its effect counts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { addAttacker, addTarget, runScenario } from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const boss = { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 99999999, mp: 100, def: 4000, mnd: 10000, str: 0, int: 0 }, elemResist: {} };
const arks = JSON.parse(fs.readFileSync(new URL('../dist/game-data/arks.json', import.meta.url), 'utf8'));

test('arks.json: every released ark at its top level with its stats and effect text', () => {
  assert.ok(arks.items.length > 290);
  const a = arks.items.find(x => x.id === 202220);
  assert.equal(a.name, '迷宫最深部的死斗'); assert.equal(a.rarity, 'LR'); assert.equal(a.level, 15);
  assert.deepEqual(a.stats, [1466, 91, 226, 316, 359, 261]);
  assert.match(a.text, /魔法攻击的伤害\+35%/);
  assert.ok(!arks.items.some(x => /^Ark\d+$/.test(x.name)));
});

test('a chosen ark adds its stats to the panel and its effect to the damage', async () => {
  const dress = 101270, c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
  const d = await loadEngineData({ unitDressIds: [dress], read });
  const ids = [...c.personality.map(p => p.passive), ...c.ownPassives.map(p => p.passive), ...(c.transcend || []).map(p => p.passive)];
  await loadPassives(d.master, ids, read);
  const battle = new Battle(d.master, d.scripts, {});
  const run = ark => { battle.reset(); return runScenario({ battle, attacker: addAttacker(battle, { unitDressId: dress, panelGiven: false, passives: ids.map(id => ({ id })), ark }), target: addTarget(battle, boss), skill: { id: 1012703 }, state: { hpPercent: 100 }, assume: { probability: 'skip' }, randoms: [0.95] }); };
  const mean = r => r.hits.find(h => h.normal).normal.mean;
  const without = run(null), deep = run(arks.items.find(x => x.id === 202220));
  assert.ok(deep.stats.int.panel - without.stats.int.panel >= 359, 'its 法强 joins the panel');
  assert.ok(mean(deep) > mean(without));
  // 破神侵攻: 未装备武器时特技伤害 +40% — its effect counts, named after the ark
  const god = arks.items.find(x => x.name === '破神侵攻'), withEffect = run(god), statsOnly = run({ ...god, process: '' });
  const edit = withEffect.hits.find(h => h.normal).edits.find(e => e.localId === god.id);
  assert.ok(edit, 'its effect counts'); assert.equal(edit.passiveName, '破神侵攻');
  assert.ok(mean(withEffect) > mean(statsOnly) * 1.3);
});

test('the calculator has 添加圣物 next to 添加装备, with its own page (rarity tabs, one ark, page stays open)', () => {
  const panel = fs.readFileSync(new URL('../dist/engine-panel.mjs', import.meta.url), 'utf8');
  assert(panel.includes('<button type="button" id="engineGearAdd" class="secondary">添加装备</button><button type="button" id="engineArkAdd" class="secondary">添加圣物</button>'));
  assert.match(panel, /data-ark-rarity/);
  assert.match(panel, /已添加 ×/);
  assert.match(panel, /这里手填的数值不再计入/);
});
