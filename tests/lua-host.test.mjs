// The WebAssembly Lua VM of the battle-script sandbox (dist/engine/lua-host.mjs, 2026-09-30: replaced fengari to make
// the calculator faster). Errors must behave like real Lua (pcall, error from a native, nested protected calls), numbers
// like the fengari VM it replaced (32-bit integers), and values must cross in both directions unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LuaHost, LuaTable, initLua, multi } from '../dist/engine/lua-host.mjs';

await initLua();

test('values cross both ways: numbers, strings (UTF-8), booleans, sequences, keyed tables', () => {
  const h = new LuaHost();
  h.load('function echo(...) return ... end', 't');
  assert.deepEqual(h.call('echo', [1, -2.5, '魔力 +20%', true, null, [1, 2, 3]], 6), [1, -2.5, '魔力 +20%', true, null, [1, 2, 3]]);
  const [t] = h.call('echo', [new LuaTable([[1, 'a'], ['k', 2], [10, 3]])]);
  assert.ok(t instanceof LuaTable); assert.equal(t.get('k'), 2); assert.equal(t.get(10), 3);
  h.setGlobal('G', { a: 1, 2: 'two' }); h.load('function g() return G.a, G[2] end', 'g');
  assert.deepEqual(h.call('g', [], 2), [1, 'two']);
});

test('integers are 32-bit and floats double, as in fengari', () => {
  const h = new LuaHost();
  h.load('function f() return math.maxinteger, 7 // 2, 7 / 2, 2^31, 3 & 5, tostring(0.1 + 0.2) end', 'f');
  assert.deepEqual(h.call('f', [], 6), [2147483647, 3, 3.5, 2147483648, 1, '0.3']);
});

test('errors: pcall inside Lua, an error from a native, a failing call reported to JS; the VM keeps working', () => {
  const h = new LuaHost({ natives: { Boom() { throw new Error('bad'); }, Two() { return multi(1, 2); } } });
  h.registerAll(['Boom', 'Two', 'Missing']);
  h.load(`function safe() local ok, err = pcall(error, 'x') return ok, err end
          function viaNative() local ok, err = pcall(Boom) return ok, err end
          function deep(n) if n == 0 then error('deep') end return deep(n - 1) end
          function two() return Two() end`, 'e');
  assert.deepEqual(h.call('safe', [], 2), [false, 'x']);
  const [ok, msg] = h.call('viaNative', [], 2); assert.equal(ok, false); assert.match(msg, /Boom: bad/);
  assert.throws(() => h.call('deep', [50]), /deep/);
  for (let i = 0; i < 1000; i++) assert.throws(() => h.call('deep', [3]));    // the wasm stack is restored every time
  assert.deepEqual(h.call('two', [], 2), [1, 2]);
  assert.equal(h.call('Missing', [])[0], null);
  assert.equal(h.unknown.get('Missing'), 1);
});
