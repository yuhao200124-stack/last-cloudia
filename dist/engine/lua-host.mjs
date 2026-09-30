// Lua host for the battle-script sandbox: runs the game's own process/condition scripts
// (captured by the loadout reader v0.9) inside the fengari Lua 5.3 VM and exposes the
// raw native API (ProcControl2, UnitGetValue, ...) as JavaScript functions.
//
// The host knows nothing about game rules; it only marshals values and dispatches calls.
// Natives are supplied as an object { Name(...args) -> value | Multi | undefined }.
import { fengari } from './fengari.mjs?v=20260930-1100';

const { lua, lauxlib, lualib, to_luastring } = fengari;

// Several return values from a native.
export class Multi { constructor(values) { this.values = values; } }
export const multi = (...values) => new Multi(values);

// A Lua table that is not a plain sequence: keys kept as given (numbers stay numbers).
export class LuaTable {
  constructor(entries = []) { this.map = new Map(entries); }
  get(k) { return this.map.get(k); }
  set(k, v) { this.map.set(k, v); return this; }
  has(k) { return this.map.has(k); }
  get size() { return this.map.size; }
  entries() { return this.map.entries(); }
  // Sequence view (1..n) when the table is one.
  toArray() { const out = []; for (let i = 1; this.map.has(i); i++) out.push(this.map.get(i)); return out; }
  toJSON() { return Object.fromEntries(this.map); }
}

const INT_MAX = 2147483647, INT_MIN = -2147483648;

export function pushValue(L, v) {
  if (v === undefined || v === null) { lua.lua_pushnil(L); return; }
  switch (typeof v) {
    case 'number':
      if (Number.isInteger(v) && v <= INT_MAX && v >= INT_MIN) lua.lua_pushinteger(L, v);
      else lua.lua_pushnumber(L, v);
      return;
    case 'boolean': lua.lua_pushboolean(L, v); return;
    case 'string': lua.lua_pushstring(L, to_luastring(v)); return;
    case 'function': lua.lua_pushjsfunction(L, v); return;
    case 'object':
      if (v instanceof Multi) throw new Error('Multi may only be returned from a native');
      if (Array.isArray(v)) {
        lua.lua_createtable(L, v.length, 0);
        v.forEach((item, i) => { if (item === undefined || item === null) return; pushValue(L, item); lua.lua_rawseti(L, -2, i + 1); });
        return;
      }
      if (v instanceof LuaTable) {
        lua.lua_createtable(L, 0, v.size);
        for (const [k, item] of v.entries()) { if (item === undefined || item === null) continue; pushValue(L, k); pushValue(L, item); lua.lua_rawset(L, -3); }
        return;
      }
      if (v instanceof Map) { pushValue(L, new LuaTable(v.entries())); return; }
      lua.lua_createtable(L, 0, Object.keys(v).length);
      for (const [k, item] of Object.entries(v)) {
        if (item === undefined || item === null) continue;
        const nk = /^-?\d+$/.test(k) ? Number(k) : k;
        pushValue(L, nk); pushValue(L, item); lua.lua_rawset(L, -3);
      }
      return;
    default: throw new Error(`cannot push ${typeof v} into Lua`);
  }
}

export function readValue(L, idx, depth = 0) {
  idx = lua.lua_absindex(L, idx);
  switch (lua.lua_type(L, idx)) {
    case lua.LUA_TNIL: case lua.LUA_TNONE: return null;
    case lua.LUA_TBOOLEAN: return lua.lua_toboolean(L, idx);
    case lua.LUA_TNUMBER: return lua.lua_isinteger(L, idx) ? lua.lua_tointeger(L, idx) : lua.lua_tonumber(L, idx);
    case lua.LUA_TSTRING: return lua.lua_tojsstring(L, idx);
    case lua.LUA_TTABLE: {
      if (depth > 12) return null;
      const entries = [];
      let sequence = true, n = 0;
      lua.lua_pushnil(L);
      while (lua.lua_next(L, idx) !== 0) {
        const k = readValue(L, -2, depth + 1);
        const v = readValue(L, -1, depth + 1);
        entries.push([k, v]);
        if (!(Number.isInteger(k) && k >= 1)) sequence = false;
        n++;
        lua.lua_pop(L, 1);
      }
      if (sequence) {
        const max = entries.reduce((m, [k]) => Math.max(m, k), 0);
        if (max === n) { const arr = new Array(n); for (const [k, v] of entries) arr[k - 1] = v; return arr; }
      }
      return new LuaTable(entries);
    }
    case lua.LUA_TFUNCTION: return { luaFunction: true };
    default: return null;
  }
}

export class LuaHost {
  constructor({ natives = {}, onUnknownNative = null, log = null } = {}) {
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);
    this.natives = natives;
    this.calls = new Map(); // native name -> count
    this.unknown = new Map(); // unimplemented native -> count
    this.log = log;
    this.onUnknownNative = onUnknownNative;
    this.loaded = [];
    this._installPrint();
  }

  _installPrint() {
    const L = this.L;
    lua.lua_pushjsfunction(L, (L) => {
      const n = lua.lua_gettop(L); const parts = [];
      for (let i = 1; i <= n; i++) parts.push(lua.lua_type(L, i) === lua.LUA_TSTRING ? lua.lua_tojsstring(L, i) : JSON.stringify(readValue(L, i)));
      if (this.log) this.log('print', parts.join('\t'));
      return 0;
    });
    lua.lua_setglobal(L, to_luastring('print'));
  }

  // Register one raw native. `impl` receives JS values and may return a value, a Multi or undefined.
  register(name, impl) {
    const L = this.L;
    lua.lua_pushjsfunction(L, (L) => {
      const n = lua.lua_gettop(L);
      const args = new Array(n);
      for (let i = 1; i <= n; i++) args[i - 1] = readValue(L, i);
      this.calls.set(name, (this.calls.get(name) || 0) + 1);
      let result;
      try { result = impl(...args); }
      catch (err) {
        if (this.log) this.log('native-error', `${name}(${args.map(a => JSON.stringify(a)).join(', ')}): ${err && err.stack || err}`);
        return lauxlib.luaL_error(L, to_luastring(`${name}: ${err && err.message || err}`));
      }
      if (result instanceof Multi) { for (const v of result.values) pushValue(L, v); return result.values.length; }
      if (result === undefined) return 0;
      pushValue(L, result);
      return 1;
    });
    lua.lua_setglobal(L, to_luastring(name));
  }

  // Register every name in `names`: implemented ones from this.natives, the rest as recording stubs.
  registerAll(names) {
    for (const name of names) {
      if (typeof this.natives[name] === 'function') this.register(name, this.natives[name]);
      else this.register(name, (...args) => {
        this.unknown.set(name, (this.unknown.get(name) || 0) + 1);
        if (this.onUnknownNative) return this.onUnknownNative(name, args);
        return undefined;
      });
    }
  }

  setGlobal(name, value) { pushValue(this.L, value); lua.lua_setglobal(this.L, to_luastring(name)); }
  getGlobal(name) { lua.lua_getglobal(this.L, to_luastring(name)); const v = readValue(this.L, -1); lua.lua_pop(this.L, 1); return v; }
  hasFunction(name) { lua.lua_getglobal(this.L, to_luastring(name)); const ok = lua.lua_type(this.L, -1) === lua.LUA_TFUNCTION; lua.lua_pop(this.L, 1); return ok; }

  // Mark a module name as loaded so `require 'name'` inside a later script is a no-op.
  markRequired(name) {
    const L = this.L;
    lua.lua_getglobal(L, to_luastring('package'));
    lua.lua_getfield(L, -1, to_luastring('loaded'));
    lua.lua_pushboolean(L, true);
    lua.lua_setfield(L, -2, to_luastring(name));
    lua.lua_pop(L, 2);
  }

  // Run a chunk of Lua source (the captured scripts). The chunk name doubles as its require name.
  load(source, chunkName = 'chunk') {
    const L = this.L;
    this.markRequired(chunkName);
    const status = lauxlib.luaL_loadbuffer(L, to_luastring(source), source.length, to_luastring('=' + chunkName));
    if (status !== lua.LUA_OK) { const msg = lua.lua_tojsstring(L, -1); lua.lua_pop(L, 1); throw new Error(`Lua compile error in ${chunkName}: ${msg}`); }
    const run = lua.lua_pcall(L, 0, 0, 0);
    if (run !== lua.LUA_OK) { const msg = lua.lua_tojsstring(L, -1); lua.lua_pop(L, 1); throw new Error(`Lua runtime error in ${chunkName}: ${msg}`); }
    this.loaded.push(chunkName);
  }

  // Call a global Lua function with JS arguments; returns the array of results.
  call(name, args = [], nresults = 1) {
    const L = this.L;
    const top = lua.lua_gettop(L);
    lua.lua_getglobal(L, to_luastring('debug'));
    lua.lua_getfield(L, -1, to_luastring('traceback'));
    lua.lua_remove(L, -2);
    const tracebackIndex = lua.lua_gettop(L);
    lua.lua_getglobal(L, to_luastring(name));
    if (lua.lua_type(L, -1) !== lua.LUA_TFUNCTION) { lua.lua_settop(L, top); throw new Error(`Lua function not found: ${name}`); }
    for (const a of args) pushValue(L, a);
    const status = lua.lua_pcall(L, args.length, nresults, tracebackIndex);
    if (status !== lua.LUA_OK) { const msg = lua.lua_tojsstring(L, -1); lua.lua_settop(L, top); throw new Error(`Lua error in ${name}: ${msg}`); }
    const results = [];
    for (let i = tracebackIndex + 1; i <= lua.lua_gettop(L); i++) results.push(readValue(L, i));
    lua.lua_settop(L, top);
    return results;
  }
}
