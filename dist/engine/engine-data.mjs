// Loads the sandbox's data: master-table bundles (dist/game-data/engine/*.json) and the captured game
// scripts (dist/game-data/lua/*.lua). Works in the browser (fetch) and in Node (a `read` function).
import { Master } from './battle.mjs?v=20261001-0649';
import { initLua } from './lua-host.mjs?v=20261001-0649';

export const SCRIPT_NAMES = ['luaCommon', 'procCondCommon', 'condition', 'process', 'battleScriptCommon'];
const base = new URL('../game-data/', import.meta.url);
// data files follow this module's own version (?v=…, scripts/set-version.mjs), so a cached old file never meets new code
const V = new URL(import.meta.url).search;

// Concatenates same-named tables from several bundles (all share the column layout written by export_engine_data.py).
export function mergeTables(...bundles) {
  const out = {};
  for (const bundle of bundles) {
    if (!bundle) continue;
    for (const [name, table] of Object.entries(bundle)) {
      if (!table || !table.cols) continue;
      if (!out[name]) out[name] = { cols: table.cols, rows: [] };
      if (out[name].cols.join() !== table.cols.join()) throw new Error(`engine data: column mismatch in ${name}`);
      out[name].rows.push(...table.rows);
    }
  }
  return out;
}

const defaultRead = async (path, asText) => {
  const r = await fetch(new URL(path + V, base));
  if (!r.ok) throw new Error(`游戏数据读取失败：${path}`);
  return asText ? r.text() : r.json();
};

// read(path, asText) resolves paths relative to dist/game-data/.
export async function loadEngineData({ unitDressIds = [], read = defaultRead } = {}) {
  const [core, shared, ...characters] = await Promise.all([
    read('engine/core.json', false), read('engine/shared.json', false),
    ...unitDressIds.map(id => read(`engine/c/${id}.json`, false)),
  ]);
  const scripts = {};
  await initLua(); // the WebAssembly Lua VM, compiled once (a Battle instantiates it synchronously)
  await Promise.all(SCRIPT_NAMES.map(async n => { scripts[n] = await read(`lua/${n}.lua`, true); }));
  return { master: new Master(mergeTables(core, shared, ...characters)), scripts, tables: { core, shared, characters } };
}

// Passives a loadout carries that no loaded bundle has (learned from other characters): fetch their id buckets
// (engine/p/<id // 10000>.json) and merge them into the master. Returns the ids still missing afterwards.
const loadedBuckets = new WeakMap();
export async function loadPassives(master, ids, read = defaultRead) {
  const missing = [...new Set(ids)].filter(id => id > 0 && !master.passive.has(id));
  if (!missing.length) return [];
  const done = loadedBuckets.get(master) || new Set(); loadedBuckets.set(master, done);
  const buckets = [...new Set(missing.map(id => Math.floor(id / 10000)))].filter(b => !done.has(b));
  await Promise.all(buckets.map(async b => { done.add(b); try { master.merge(await read(`engine/p/${b}.json`, false)); } catch { /* bucket absent */ } }));
  return missing.filter(id => !master.passive.has(id));
}
