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
