// 配装 workspace (2026-09-29): skills are picked from the game-data skill table with “+” (only inside the calculator),
// the SC total follows the old skill table's 能力盘突破 rule, and a character's own SC skills that are not on the table
// are always added at 0 SC.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { scTotal, cleanBreaks, DEFAULT_BREAKS } from '../dist/build-sc.mjs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('能力盘突破: for 7, 12, 20 in order, the highest-SC picked skill within each break becomes free', () => {
  const items = [{ id: 1, sc: 15 }, { id: 2, sc: 7 }, { id: 3, sc: 12 }, { id: 4, sc: 6 }, { id: 5, sc: 20 }];
  const all = scTotal(items);
  assert.deepEqual(all.items.map(i => i.freeBy), [null, 7, 12, null, 20]);
  assert.equal(all.total, 21);
  const none = scTotal(items, []);
  assert.equal(none.total, 60); assert(none.items.every(i => i.freeBy === null));
  // 一破 off: 二破 takes the 12, 三破 the 20
  assert.deepEqual(scTotal(items, [12, 20]).items.map(i => i.freeBy), [null, null, 12, null, 20]);
  // a break with nothing small enough frees nothing; free / unknown costs count 0
  assert.deepEqual(scTotal([{ id: 1, sc: 13 }, { id: 2, sc: 99 }, { id: 3, sc: null }], [7, 12]).total, 13);
  assert.deepEqual(cleanBreaks(undefined), DEFAULT_BREAKS);
  assert.deepEqual(cleanBreaks(['20', 7, 7, 5]), [7, 20]);
});

test('the table lists every game passive number, so the calculator can tell a character\'s own off-table skills', () => {
  const ids = JSON.parse(read('dist/game-data/engine/table-passives.json')).ids;
  const game = JSON.parse(read('docs/game-relic-passives.json')).map(g => g.gameId).sort((a, b) => a - b);
  assert.deepEqual(ids, game);
  // Roxy's 月光II / 贯导 are hers only (0 SC in her loadouts); 冰暴击提升 is on the table (picked with “+”)
  const set = new Set(ids);
  assert(!set.has(26505) && !set.has(24450)); assert(set.has(19100) && set.has(26466));
});

test('the calculator\'s 配装 picks from the skill table with “+”: no search box, no 试算', () => {
  const panel = read('dist/engine-panel.mjs');
  for (const s of ['buildTableFrame', 'lc-build-toggle', 'lc-build-state', 'lc-table-ready', 'data-build-break', 'autoPaidIds', 'changesOf'])
    assert(panel.includes(s), s);
  for (const s of ['engineBuildSearch', 'engineBuildCandidates', 'data-build-probe', 'engineRecommendSearchOnly'])
    assert(!panel.includes(s), s);
  const table = read('dist/game-skills.js');
  assert.match(table, /const embedded = new URLSearchParams\(location\.search\)\.get\('embedded'\) === '1' && window\.parent !== window;/, 'the “+” only inside the calculator');
  assert.match(read('dist/index.html'), /lc-in-calculator/);
  assert.match(read('dist/character-saved-builds.mjs'), /scTotal\(/, 'the character page counts SC the same way');
});
