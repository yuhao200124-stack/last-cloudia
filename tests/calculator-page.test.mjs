// The damage calculator page after the old rule-based calculator was removed (2026-09-28): only the inputs of the
// game-script calculation remain, moves come from the game data, the hit count is the user's own (default 10), and
// the 配装 data (the common skills the SC recommendation tries) is the old loadout's, as game passive ids.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateBattleEntry } from '../dist/battle-report.mjs';
import { characterGear } from '../dist/character-gear.mjs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the page keeps only the inputs of the game-script calculation', () => {
  const html = read('dist/damage-calculator.html');
  for (const id of ['preset', 'specialWeapon', 'attack', 'critRate', 'damageCapInput', 'dualWield', 'specialAttack', 'break', 'boss', 'fullHp', 'lowHp', 'mpLow', 'openingBuffActive', 'conditionBuffActive', 'hitMultiplier', 'hitDamageRatio', 'hitScaleStage', 'hits', 'bossPreset', 'bossDefense', 'bossMind', 'bossResistances', 'breakDefenseRatio', 'entryReportFile', 'openReview', 'reviewBody', 'arkAttack', 'magicBuffOptions'])
    assert.match(html, new RegExp(`id="${id}"`), id);
  for (const id of ['criticalEnabled', 'mpFull', 'skillDetails', 'coefficient', 'legacyCapCard', 'settlementDetails', 'unifiedStart', 'unifiedWorkspace', 'arkEffects', 'nativeEffects', 'commonEffects', 'entrySpecialSection', 'defenseRatio', 'guarded', 'stunned', 'resultValues', 'trace'])
    assert.doesNotMatch(html, new RegExp(`id="${id}"`), id);
  const js = read('dist/damage-calculator.mjs');
  assert.match(js, /\$\('hits'\)\.value=String\(m&&state\.hits\[m\.id\]\|\|10\)/, 'the hit count is the user\'s own, 10 until changed');
  assert.doesNotMatch(js, /entry-workflow|damage-engine|unified-calculator|character-template/);
});

test('the reader report keeps its format checks and the v0.35 MP unit fix', () => {
  const r = { kind: 'last-cloudia-battle-entry', schemaVersion: 1, readerVersion: '0.35', statsBasis: 'battle-final-at-observation', collection: { method: 'read_only_process_memory' }, units: [{ stats: { mp: 500580 }, current: { mp: 495800 }, bonuses: [] }] };
  const migrated = validateBattleEntry(r);
  assert.equal(migrated.units[0].stats.mp, 500);
  assert.equal(migrated.units[0].current.mp, 495);
  assert.equal(migrated.units[0].mpRawThousandths.maximum, 500580);
  assert.equal(r.units[0].stats.mp, 500580);
  assert.equal(validateBattleEntry(migrated).units[0].stats.mp, 500);
  assert.equal(validateBattleEntry({ ...r, readerVersion: '0.36' }).units[0].stats.mp, 500580);
  assert.equal(validateBattleEntry({ ...r, testFixture: true }).units[0].stats.mp, 500580);
  assert.throws(() => validateBattleEntry({ kind: 'other' }));
});

test('专武 options name each character\'s real exclusive gear from the game data', () => {
  for (const [site, dress] of Object.entries(JSON.parse(read('dist/game-data/index.json')).site)) {
    const names = new Set(JSON.parse(read(`dist/game-data/c/${dress}.json`)).exclusiveEquipment.map(e => e.nameS));
    for (const g of Object.values(characterGear(site))) assert(names.has(g.name), `${site}: ${g.name}`);
  }
});

test('配装 data: every skill-table row is a game passive; duplicate names are settled by SC, not guessed', () => {
  const data = JSON.parse(read('dist/game-data/engine/loadout-data.json'));
  const index = new Map(JSON.parse(read('dist/game-data/engine/passive-index.json')).rows.map(r => [r[0], r]));
  assert.deepEqual(data.ambiguous, {}); assert.deepEqual(data.unmatched, []);
  assert(data.commonPassives.length > 900);
  for (const id of data.commonPassives) assert(index.has(id), id);
});

test('01 角色基础资料 shows each site character\'s Altema maximum stats', () => {
  const index = JSON.parse(read('dist/game-data/index.json'));
  const registry = JSON.parse(read('docs/site-characters.json')).characters;
  for (const site of Object.keys(index.site)) assert.deepEqual(index.siteStats[site], registry[site].maxStats, site);
});

test('the calculator is opened only from a character page (no header link without a character)', () => {
  for (const f of fs.readdirSync(new URL('../dist/', import.meta.url)).filter(f => f.endsWith('.html'))) assert.doesNotMatch(read(`dist/${f}`), /<a[^>]*href="\.\/damage-calculator\.html(?:\?v=[^"&]*)?"/, f);
  assert.doesNotMatch(read('scripts/templates/character-page.html'), /damage-calculator\.html/);
  assert.match(read('dist/character-page.mjs'), /damageSimulatorOpen/, 'the character page keeps its own 伤害计算器 button');
});
