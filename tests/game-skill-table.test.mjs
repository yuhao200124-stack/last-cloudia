// The game-data skill table is the home page (2026-09-29, the original skill table was removed). Its layout lives in
// docs/game-skill-layout.json (imported from the user's Excel); every row is a game passive number, and the name, SC,
// effect and relics come from the game data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const box = { window: {} }; vm.runInNewContext(read('dist/game-skill-data.js'), box);
const data = JSON.parse(JSON.stringify(box.window.GAME_SKILL_DATA));
const game = new Map(JSON.parse(read('docs/game-relic-passives.json')).map(g => [g.gameId, g]));
const layout = JSON.parse(read('docs/game-skill-layout.json'));
const rowsOf = sheet => sheet.kind === 'all' ? sheet.rows : sheet.lanes.flatMap(l => l.rows);

test('the home page is the game-data skill table; the original table and its 配装与伤害 are gone', () => {
  const html = read('dist/index.html');
  assert.match(html, /game-skill-data\.js/); assert.match(html, /game-skills\.js/);
  assert.doesNotMatch(html, /"\.\/data\.js|\/app\.js|loadout-frame|原技能表|showSiteName/);
  for (const f of ['data.js', 'app.js', 'loadout-frame.mjs', 'game-skill-names.js', 'game-skill-names.mjs', 'basic-stat-catalog.mjs'])
    assert(!fs.existsSync(new URL(`../dist/${f}`, import.meta.url)), f);
  assert.match(read('dist/game-skills.html'), /url=\.\/index\.html/, 'the old address forwards to the home page');
});

test('the built table follows the layout, and every row is a game passive number', () => {
  assert.deepEqual(data.sheetOrder, layout.sheetOrder);
  assert.deepEqual(data.added, []); assert.deepEqual(data.removed, []);
  for (const name of data.sheetOrder) {
    const built = rowsOf(data.sheets[name]), own = rowsOf(layout.sheets[name]);
    assert.deepEqual(built.map(r => r.separator ? 'sep' : r.ref), own.map(r => r.separator ? 'sep' : r.id), name);
    for (const r of built) if (!r.separator) assert(game.has(r.ref), `${name}: ${r.ref}`);
  }
  const placed = new Set(data.sheetOrder.flatMap(n => rowsOf(data.sheets[n])).filter(r => !r.separator).map(r => r.ref));
  for (const id of game.keys()) assert(placed.has(id), `game passive ${id} is on the table`);
});

test('name, SC, effect and relics come from the game data; only the layout\'s own texts and ratings override the display', () => {
  for (const [id, g] of game) {
    const s = data.skills[id], own = layout.skills[id] || {};
    assert.equal(s.gameId, id); assert.equal(s.name, g.name); assert.equal(s.effect, g.effect); assert.equal(s.sc, String(g.sc));
    assert.equal(s.nameS, own.name || g.nameS); assert.equal(s.effectS, own.effect || g.effectS); assert.equal(s.mark, own.mark || '');
    assert.equal(s.sources.length, g.relics.length);
    for (const k of ['siteName', 'siteSc', 'siteEffect', 'url']) assert(!(k in s), `${id} has no ${k} (the original table is gone)`);
  }
});

test('every row carries its game number and its classification (大类, 条件, 能否算), which the page does not show', () => {
  const draft = new Map(JSON.parse(read('docs/skill-classes-draft.json')).skills.map(s => [s.id, s]));
  for (const id of game.keys()) {
    const s = data.skills[id], d = draft.get(id);
    const { e, ...rest } = s.cls;
    assert.deepEqual(rest, { cats: d.cats, tags: d.tags, calc: d.calc }, String(id));
    // every effect as [大类, stat, elements, attack types, drawback] for the 配装 filter; every 大类 is there
    for (const cat of d.cats) assert(e.some(x => x[0] === cat), `${id} ${cat}`);
    for (const x of e) assert(x.length === 5 && d.cats.includes(x[0]), `${id} ${JSON.stringify(x)}`);
  }
  // the page only uses the effects (and, for 全输出's gear check, the 装备… tags) to hide rows in 配装; 大类, 条件 and
  // 能否算 are not shown
  const js = read('dist/game-skills.js');
  assert(js.includes('.cls?.e') && !/\.cls\??\.(cats|calc)/.test(js), 'not shown on the page');
  assert(!/\$\{[^}]*cls\??\.tags/.test(js), 'tags are not written into the page');
});

test('配装 filter: 全输出 hides defense and offense the move cannot use, 半肉 only that offense, 全肉 all offense', () => {
  const js = read('dist/game-skills.js');
  for (const s of ["['out', '全输出']", "['half', '半肉']", "['tank', '全肉']", "['none', '不隐藏']", "cat === '特攻'", "move.magical ? '法强' : '攻击力'"]) assert(js.includes(s), s);
  assert.match(read('dist/index.html'), /id="buildFilter"[^>]*hidden/);
  const r = s => data.skills[s].cls.e;
  // 冰攻击提升III is for 冰, 勇者 for 物理 (普攻＋特技) and brings 受到伤害 +10% as a drawback
  assert.deepEqual(r(26466).map(x => x[2]), [[2], [2]]);
  assert.deepEqual(r(27654).find(x => x[0] === '造成伤害')[3], [1, 9]);
  assert.equal(r(27654).find(x => x[0] === '受到伤害')[4], 1);
});

// 2026-09-30 (user): MP and 咏唱 are magic's; 反击 is at most 半肉; 金钱·经验 hidden in every mode; 全输出 checks the gear
// (weapon / armour types the character can wear, one or two weapons, what the picked skills add)
test('配装 filter: MP／咏唱 only for magic, 反击 only in 半肉, 金钱·经验 never, gear in 全输出', () => {
  const js = read('dist/game-skills.js');
  for (const x of ["cat === '金钱·经验' ? 'never'", "cat === '反击' ? 'counter'", "cat === '魔法·咏唱' || stat === 'MP'", 'function wearable(ref)', "if (mode === 'out' && !wearable(ref)) return false;", "gear.dual ? '装两件武器' : '只装一件武器'"]) assert(js.includes(x), x);
  assert.deepEqual(data.skills[9900].cls.e[0].slice(0, 2), ['回复', 'MP'], '荣誉的姿势 MP 回复');
  const panel = read('dist/engine-panel.mjs');
  for (const x of ['function gearFor(', 'pid === 1100000', 'pid === 1080800', 'gear: gearInfo']) assert(panel.includes(x), x);
});

// 2026-09-30 (user: “好多技能的数值还是？但是不可能是？”): the game fills each “?” from PassiveSkillMst.PROCESS_EXPLAIN_QUOTE
// (parameter and arithmetic, e.g. frames ÷ 60, a value × 2); the export now carries the filled texts (checked against the
// Lua scripts and the sandbox, docs/game-skill-table-2026-09-29.md).
test('no effect text keeps a “?” placeholder; the filled values', () => {
  for (const [id, s] of Object.entries(data.skills)) { assert.doesNotMatch(s.effect + s.effectS, /\?/, id); assert.equal(s.values, '', id); }
  const text = id => data.skills[id].effectS;
  assert.match(text(11000), /咏唱速度\+20％/);
  assert.match(text(27151), /仅装备一种武器时提升效果\+4000/);
  assert.match(text(55714), /20秒/);
  assert.match(text(28501), /额外\+5000/);
});

// item 22 of the 2026-09-30 review: what a process changes, read from its script, not from the words in its name
test('classification: effects on the enemy, a heal scaled by 精神, when-used triggers, a stat raised only on the hit', () => {
  const e = id => data.skills[id].cls.e;
  assert.deepEqual(e(27570), [['受到伤害', null, null, [1, 9], 0]]);             // 畏惧的眼光: the enemy's attack −5%
  for (const id of [28094, 54090]) assert.equal(e(id)[0][0], '造成伤害');           // every enemy's element resistance −10
  assert.deepEqual(e(27071)[0], ['回复', 'HP', null, null, 0]);                     // 治愈反击: not a 魔抗 drawback
  assert.deepEqual(e(27820), [['特技充能·必杀', null, null, null, 0]]);               // 循环: fires on 超必杀, helps any move
  assert.deepEqual(e(55010), [['造成伤害', null, null, [1, 9], 0]]);                 // its buff is 物理伤害, fired by 超必杀
  assert.deepEqual(e(28230), [['基础属性', '法强', [2], null, 0]]);                   // 海滨洞察: only on 冰属性 attacks
});
