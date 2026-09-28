// Data for the calculator's 配装 (engine-panel.mjs), from what the old loadout already had:
// - commonPassives: every row of the skill table (the common skills a loadout picks from) as game passive ids,
//   matched by the game name (game-skill-names.js: table row → NAME_S) against passive-index.json;
// - recommended: each character's recommended loadout (app.js characterLoadouts) as game passive ids.
// A name shared by two game passives is settled by the table's SC against the game's COST (神族护罩 SC 5 → 16611,
// SC 10 → 27954; 勇者之魂 SC 20 → 28093); a name still shared after that keeps every id and is listed under
// `ambiguous` (not guessed).
// Writes dist/game-data/engine/loadout-data.json.
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(read('dist/game-skill-names.js'), sandbox);
vm.runInNewContext(read('dist/data.js'), sandbox);
const names = sandbox.window.GAME_SKILL_NAMES;
const tableSc = new Map(sandbox.window.SKILL_DATA.sheets['全部技能'].rows.map(r => [String(r.id), Number(r.sc)]));
const app = read('dist/app.js');
const start = app.indexOf('{', app.indexOf('const characterLoadouts'));
let depth = 0, end = start;
for (let i = start; i < app.length; i++) { if (app[i] === '{') depth++; else if (app[i] === '}' && --depth === 0) { end = i + 1; break; } }
const loadouts = vm.runInNewContext(`(${app.slice(start, end)})`);
const index = JSON.parse(read('dist/game-data/engine/passive-index.json'));
const byName = new Map();
const costOf = new Map(index.rows.map(r => [r[0], r[3]]));
for (const [id, name, nameS] of index.rows) for (const n of new Set([nameS, name])) { if (!byName.has(n)) byName.set(n, new Set()); byName.get(n).add(id); }
const ambiguous = {}, unmatched = new Set();
const idsOf = rowId => {
  const name = names[rowId]; if (!name) { unmatched.add(rowId); return []; }
  let ids = [...(byName.get(name) || [])].sort((a, b) => a - b);
  if (ids.length > 1) { const sc = tableSc.get(String(rowId)), same = ids.filter(id => costOf.get(id) === sc); if (same.length === 1) ids = same; }
  if (!ids.length) unmatched.add(name);
  if (ids.length > 1) ambiguous[name] = ids;
  return ids;
};
const commonPassives = [...new Set(Object.keys(names).flatMap(idsOf))].sort((a, b) => a - b);
const recommended = Object.fromEntries(Object.entries(loadouts).map(([site, l]) => [site, { name: l.name, passives: [...new Set((l.skillIds || []).flatMap(idsOf))] }]));
const out = { generated: 'scripts/build-engine-loadout-data.mjs', commonPassives, recommended, ambiguous, unmatched: [...unmatched] };
fs.writeFileSync(new URL('../dist/game-data/engine/loadout-data.json', import.meta.url), JSON.stringify(out) + '\n');
console.log(`common ${commonPassives.length}, recommended ${Object.entries(recommended).map(([k, v]) => `${k}:${v.passives.length}`).join(' ')}, ambiguous ${Object.keys(ambiguous).join('、') || '—'}, unmatched ${out.unmatched.length}`);
