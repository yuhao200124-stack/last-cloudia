// Lua host for the battle-script sandbox: runs the game's own process/condition scripts
// (captured by the loadout reader v0.9) inside Lua 5.3.6 compiled to WebAssembly and exposes the
// raw native API (ProcControl2, UnitGetValue, ...) as JavaScript functions.
//
// The VM is the official Lua 5.3.6 source built with clang for wasm32 (scripts/build-lua-wasm.sh), with 32-bit
// integers like the fengari VM it replaced (2026-09-30, user: 计算器每次选什么都要等一下). A Lua error throws a
// JS exception (js_throw) that the protected call catches in JS (js_try), so no setjmp is needed.
//
// The host knows nothing about game rules; it only marshals values and dispatches calls.
// Natives are supplied as an object { Name(...args) -> value | Multi | undefined }.
import { LUA_WASM_BASE64 } from './lua-wasm.mjs?v=20261005-0758';

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
const T = { NONE: -1, NIL: 0, BOOLEAN: 1, LIGHTUSERDATA: 2, NUMBER: 3, STRING: 4, TABLE: 5, FUNCTION: 6 };
const LUA_OK = 0;

let wasmModule = null;
const decodeBase64 = b64 => { const bin = atob(b64); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
// Compiles the VM once; every LuaHost instantiates it. Awaited by loadEngineData before a Battle is made.
export async function initLua() {
  if (!wasmModule) wasmModule = await WebAssembly.compile(decodeBase64(LUA_WASM_BASE64));
  return wasmModule;
}

// thrown through the wasm frames by a Lua error; caught by the protected call that is running
const LUA_THROW = { luaThrow: true };
const encoder = new TextEncoder(), decoder = new TextDecoder();

export class LuaHost {
  constructor({ natives = {}, onUnknownNative = null, log = null } = {}) {
    if (!wasmModule) throw new Error('Lua VM not loaded: await initLua() first');
    this.natives = natives;
    this.calls = new Map(); // native name -> count
    this.unknown = new Map(); // unimplemented native -> count
    this.log = log;
    this.onUnknownNative = onUnknownNative;
    this.loaded = [];
    this.fns = [];
    this.names = new Map(); // JS string -> NUL-terminated copy in wasm memory (global and field names)
    const wasiStub = () => 52; // ENOSYS: the sandbox has no files, clock or environment
    const wasi = new Proxy({}, { get: (_, name) => name === 'fd_write' ? (fd, iovs, n, written) => { new DataView(this.ex.memory.buffer).setUint32(written, 0, true); return 0; } : name === 'proc_exit' ? code => { throw new Error(`Lua VM exited (${code})`); } : name === 'environ_sizes_get' || name === 'environ_get' ? (a, b) => { if (name === 'environ_sizes_get') { const v = new DataView(this.ex.memory.buffer); v.setUint32(a, 0, true); v.setUint32(b, 0, true); } return 0; } : wasiStub });
    const instance = new WebAssembly.Instance(wasmModule, {
      env: {
        js_throw: () => { throw LUA_THROW; },
        js_try: (f, L, ud) => {
          const sp = this.ex.__stack_pointer.value;
          try { this.ex.call_pfunc(f, L, ud); return 0; }
          catch (e) { if (e === LUA_THROW) { this.ex.__stack_pointer.value = sp; return 1; } throw e; }
        },
        js_call: (L, id) => this.fns[id](L),
      },
      wasi_snapshot_preview1: wasi,
    });
    this.ex = instance.exports;
    this.ex._initialize();
    this.L = this.ex.new_state();
    this.scratch = this.ex.mem_alloc(4096); this.scratchSize = 4096;
    this.lenPtr = this.ex.mem_alloc(8);
    this._installPrint();
  }

  // ---- memory helpers ----
  _bytes() { return new Uint8Array(this.ex.memory.buffer); }
  _cstr(name) { // a persistent NUL-terminated copy of a name
    let p = this.names.get(name);
    if (p === undefined) { const b = encoder.encode(name); p = this.ex.mem_alloc(b.length + 1); const m = this._bytes(); m.set(b, p); m[p + b.length] = 0; this.names.set(name, p); }
    return p;
  }
  _pushString(L, s) {
    const need = s.length * 3 + 1;
    if (need > this.scratchSize) { this.ex.mem_free(this.scratch); this.scratchSize = Math.max(need, this.scratchSize * 2); this.scratch = this.ex.mem_alloc(this.scratchSize); }
    const { written } = encoder.encodeInto(s, this._bytes().subarray(this.scratch, this.scratch + this.scratchSize));
    this.ex.w_pushlstring(L, this.scratch, written);
  }
  _toString(L, idx) {
    const p = this.ex.w_tolstring(L, idx, this.lenPtr);
    const len = new DataView(this.ex.memory.buffer).getUint32(this.lenPtr, true);
    return decoder.decode(this._bytes().subarray(p, p + len));
  }

  pushValue(L, v) {
    const ex = this.ex;
    if (v === undefined || v === null) { ex.w_pushnil(L); return; }
    switch (typeof v) {
      case 'number':
        if (Number.isInteger(v) && v <= INT_MAX && v >= INT_MIN) ex.w_pushinteger(L, v);
        else ex.w_pushnumber(L, v);
        return;
      case 'boolean': ex.w_pushboolean(L, v ? 1 : 0); return;
      case 'string': this._pushString(L, v); return;
      case 'function': { const id = this.fns.length; this.fns.push(Lx => { const n = ex.w_gettop(Lx); return v(Lx, n) || 0; }); ex.push_jsfunction(L, id); return; }
      case 'object':
        if (v instanceof Multi) throw new Error('Multi may only be returned from a native');
        if (Array.isArray(v)) {
          ex.w_createtable(L, v.length, 0);
          v.forEach((item, i) => { if (item === undefined || item === null) return; this.pushValue(L, item); ex.w_rawseti(L, -2, i + 1); });
          return;
        }
        if (v instanceof LuaTable) {
          ex.w_createtable(L, 0, v.size);
          for (const [k, item] of v.entries()) { if (item === undefined || item === null) continue; this.pushValue(L, k); this.pushValue(L, item); ex.w_rawset(L, -3); }
          return;
        }
        if (v instanceof Map) { this.pushValue(L, new LuaTable(v.entries())); return; }
        ex.w_createtable(L, 0, Object.keys(v).length);
        for (const [k, item] of Object.entries(v)) {
          if (item === undefined || item === null) continue;
          const nk = /^-?\d+$/.test(k) ? Number(k) : k;
          this.pushValue(L, nk); this.pushValue(L, item); ex.w_rawset(L, -3);
        }
        return;
      default: throw new Error(`cannot push ${typeof v} into Lua`);
    }
  }

  readValue(L, idx, depth = 0) {
    const ex = this.ex;
    idx = ex.w_absindex(L, idx);
    switch (ex.w_type(L, idx)) {
      case T.NIL: case T.NONE: return null;
      case T.BOOLEAN: return ex.w_toboolean(L, idx) !== 0;
      case T.NUMBER: return ex.w_isinteger(L, idx) ? ex.w_tointeger(L, idx) : ex.w_tonumber(L, idx);
      case T.STRING: return this._toString(L, idx);
      case T.TABLE: {
        if (depth > 12) return null;
        const entries = [];
        let sequence = true, n = 0;
        ex.w_pushnil(L);
        while (ex.w_next(L, idx) !== 0) {
          const k = this.readValue(L, -2, depth + 1);
          const v = this.readValue(L, -1, depth + 1);
          entries.push([k, v]);
          if (!(Number.isInteger(k) && k >= 1)) sequence = false;
          n++;
          ex.w_settop(L, -2);
        }
        if (sequence) {
          const max = entries.reduce((m, [k]) => Math.max(m, k), 0);
          if (max === n) { const arr = new Array(n); for (const [k, v] of entries) arr[k - 1] = v; return arr; }
        }
        return new LuaTable(entries);
      }
      case T.FUNCTION: return { luaFunction: true };
      default: return null;
    }
  }

  _installPrint() {
    const id = this.fns.length;
    this.fns.push(L => {
      const n = this.ex.w_gettop(L); const parts = [];
      for (let i = 1; i <= n; i++) parts.push(this.ex.w_type(L, i) === T.STRING ? this._toString(L, i) : JSON.stringify(this.readValue(L, i)));
      if (this.log) this.log('print', parts.join('\t'));
      return 0;
    });
    this.ex.push_jsfunction(this.L, id);
    this.ex.w_setglobal(this.L, this._cstr('print'));
  }

  // Register one raw native. `impl` receives JS values and may return a value, a Multi or undefined.
  register(name, impl) {
    const id = this.fns.length;
    this.fns.push(L => {
      const ex = this.ex;
      const n = ex.w_gettop(L);
      const args = new Array(n);
      for (let i = 1; i <= n; i++) args[i - 1] = this.readValue(L, i);
      this.calls.set(name, (this.calls.get(name) || 0) + 1);
      let result;
      try { result = impl(...args); }
      catch (err) {
        if (err === LUA_THROW) throw err;
        if (this.log) this.log('native-error', `${name}(${args.map(a => JSON.stringify(a)).join(', ')}): ${err && err.stack || err}`);
        this.pushValue(L, `${name}: ${err && err.message || err}`);
        return ex.w_error(L); // throws LUA_THROW
      }
      if (result instanceof Multi) { for (const v of result.values) this.pushValue(L, v); return result.values.length; }
      if (result === undefined) return 0;
      this.pushValue(L, result);
      return 1;
    });
    this.ex.push_jsfunction(this.L, id);
    this.ex.w_setglobal(this.L, this._cstr(name));
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

  setGlobal(name, value) { this.pushValue(this.L, value); this.ex.w_setglobal(this.L, this._cstr(name)); }
  getGlobal(name) { const L = this.L; this.ex.w_getglobal(L, this._cstr(name)); const v = this.readValue(L, -1); this.ex.w_settop(L, -2); return v; }
  hasFunction(name) { const L = this.L; const ok = this.ex.w_getglobal(L, this._cstr(name)) === T.FUNCTION; this.ex.w_settop(L, -2); return ok; }

  // Mark a module name as loaded so `require 'name'` inside a later script is a no-op.
  markRequired(name) {
    const L = this.L, ex = this.ex;
    ex.w_getglobal(L, this._cstr('package'));
    ex.w_getfield(L, -1, this._cstr('loaded'));
    ex.w_pushboolean(L, 1);
    ex.w_setfield(L, -2, this._cstr(name));
    ex.w_settop(L, -3);
  }

  // Run a chunk of Lua source (the captured scripts). The chunk name doubles as its require name.
  load(source, chunkName = 'chunk') {
    const L = this.L, ex = this.ex;
    this.markRequired(chunkName);
    const bytes = encoder.encode(source);
    const p = ex.mem_alloc(bytes.length + 1); this._bytes().set(bytes, p);
    const status = ex.w_loadbuffer(L, p, bytes.length, this._cstr('=' + chunkName));
    ex.mem_free(p);
    if (status !== LUA_OK) { const msg = this._toString(L, -1); ex.w_settop(L, -2); throw new Error(`Lua compile error in ${chunkName}: ${msg}`); }
    const run = ex.w_pcall(L, 0, 0, 0);
    if (run !== LUA_OK) { const msg = this._toString(L, -1); ex.w_settop(L, -2); throw new Error(`Lua runtime error in ${chunkName}: ${msg}`); }
    this.loaded.push(chunkName);
  }

  // Call a global Lua function with JS arguments; returns the array of results.
  call(name, args = [], nresults = 1) {
    const L = this.L, ex = this.ex;
    const top = ex.w_gettop(L);
    ex.w_getglobal(L, this._cstr('debug'));
    ex.w_getfield(L, -1, this._cstr('traceback'));
    ex.w_remove(L, -2);
    const tracebackIndex = ex.w_gettop(L);
    if (ex.w_getglobal(L, this._cstr(name)) !== T.FUNCTION) { ex.w_settop(L, top); throw new Error(`Lua function not found: ${name}`); }
    for (const a of args) this.pushValue(L, a);
    const status = ex.w_pcall(L, args.length, nresults, tracebackIndex);
    if (status !== LUA_OK) { const msg = this._toString(L, -1); ex.w_settop(L, top); throw new Error(`Lua error in ${name}: ${msg}`); }
    const results = [];
    for (let i = tracebackIndex + 1; i <= ex.w_gettop(L); i++) results.push(this.readValue(L, i));
    ex.w_settop(L, top);
    return results;
  }
}
