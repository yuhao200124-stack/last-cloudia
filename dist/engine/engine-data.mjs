// Loads the sandbox's data: master-table bundles (dist/game-data/engine/*.json) and the captured game
// scripts (dist/game-data/lua/*.lua). Works in the browser (fetch) and in Node (a `read` function).
import { Master } from './battle.mjs';

export const SCRIPT_NAMES = ['luaCommon', 'procCondCommon', 'condition', 'process', 'battleScriptCommon'];
const base = new URL('../game-data/', import.meta.url);

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
  const r = await fetch(new URL(path, base));
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
  await Promise.all(SCRIPT_NAMES.map(async n => { scripts[n] = await read(`lua/${n}.lua`, true); }));
  return { master: new Master(mergeTables(core, shared, ...characters)), scripts, tables: { core, shared, characters } };
}
