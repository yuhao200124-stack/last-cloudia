/* Lua errors without setjmp: a Lua error throws a JS exception (js_throw); a protected call is run by JS inside
   try/catch (js_try → call_pfunc), which also restores the wasm stack pointer. Used by ldo.c only. */
#ifndef LUA_WASM_PRELUDE
#define LUA_WASM_PRELUDE
__attribute__((import_module("env"), import_name("js_throw"))) void lua_wasm_js_throw(void);
__attribute__((import_module("env"), import_name("js_try"))) int lua_wasm_js_try(void *f, void *L, void *ud);
#define LUAI_THROW(L,c)   lua_wasm_js_throw()
#define LUAI_TRY(L,c,a)   if (lua_wasm_js_try((void *)f, (void *)L, ud) != 0 && (c)->status == 0) (c)->status = -1;
#define luai_jmpbuf       int
#endif
