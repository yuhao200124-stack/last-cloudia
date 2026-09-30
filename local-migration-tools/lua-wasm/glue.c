#include <stdlib.h>
#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"
#define EXPORT(n) __attribute__((export_name(n)))

__attribute__((import_module("env"), import_name("js_call"))) int js_call(lua_State *L, int id);
static int dispatch(lua_State *L) { return js_call(L, (int)lua_tointeger(L, lua_upvalueindex(1))); }

typedef void (*Pfunc)(lua_State *L, void *ud);
EXPORT("call_pfunc") void call_pfunc(Pfunc f, lua_State *L, void *ud) { f(L, ud); }

EXPORT("new_state") lua_State *new_state(void) { lua_State *L = luaL_newstate(); luaL_openlibs(L); return L; }
EXPORT("push_jsfunction") void push_jsfunction(lua_State *L, int id) { lua_pushinteger(L, id); lua_pushcclosure(L, dispatch, 1); }
EXPORT("mem_alloc") void *mem_alloc(int n) { return malloc(n); }
EXPORT("mem_free") void mem_free(void *p) { free(p); }
/* the API used by the host (macros in lua.h become functions here) */
EXPORT("w_gettop") int w_gettop(lua_State *L) { return lua_gettop(L); }
EXPORT("w_settop") void w_settop(lua_State *L, int i) { lua_settop(L, i); }
EXPORT("w_absindex") int w_absindex(lua_State *L, int i) { return lua_absindex(L, i); }
EXPORT("w_type") int w_type(lua_State *L, int i) { return lua_type(L, i); }
EXPORT("w_toboolean") int w_toboolean(lua_State *L, int i) { return lua_toboolean(L, i); }
EXPORT("w_isinteger") int w_isinteger(lua_State *L, int i) { return lua_isinteger(L, i); }
EXPORT("w_tointeger") int w_tointeger(lua_State *L, int i) { return (int)lua_tointegerx(L, i, NULL); }
EXPORT("w_tonumber") double w_tonumber(lua_State *L, int i) { return (double)lua_tonumberx(L, i, NULL); }
EXPORT("w_tolstring") const char *w_tolstring(lua_State *L, int i, size_t *len) { return lua_tolstring(L, i, len); }
EXPORT("w_next") int w_next(lua_State *L, int i) { return lua_next(L, i); }
EXPORT("w_pushnil") void w_pushnil(lua_State *L) { lua_pushnil(L); }
EXPORT("w_pushinteger") void w_pushinteger(lua_State *L, int n) { lua_pushinteger(L, n); }
EXPORT("w_pushnumber") void w_pushnumber(lua_State *L, double n) { lua_pushnumber(L, n); }
EXPORT("w_pushboolean") void w_pushboolean(lua_State *L, int b) { lua_pushboolean(L, b); }
EXPORT("w_pushlstring") void w_pushlstring(lua_State *L, const char *s, int len) { lua_pushlstring(L, s, len); }
EXPORT("w_createtable") void w_createtable(lua_State *L, int a, int h) { lua_createtable(L, a, h); }
EXPORT("w_rawseti") void w_rawseti(lua_State *L, int i, int n) { lua_rawseti(L, i, n); }
EXPORT("w_rawset") void w_rawset(lua_State *L, int i) { lua_rawset(L, i); }
EXPORT("w_getglobal") int w_getglobal(lua_State *L, const char *name) { return lua_getglobal(L, name); }
EXPORT("w_setglobal") void w_setglobal(lua_State *L, const char *name) { lua_setglobal(L, name); }
EXPORT("w_getfield") int w_getfield(lua_State *L, int i, const char *k) { return lua_getfield(L, i, k); }
EXPORT("w_setfield") void w_setfield(lua_State *L, int i, const char *k) { lua_setfield(L, i, k); }
EXPORT("w_remove") void w_remove(lua_State *L, int i) { lua_remove(L, i); }
EXPORT("w_pcall") int w_pcall(lua_State *L, int nargs, int nres, int msgh) { return lua_pcall(L, nargs, nres, msgh); }
EXPORT("w_loadbuffer") int w_loadbuffer(lua_State *L, const char *s, int len, const char *name) { return luaL_loadbuffer(L, s, len, name); }
EXPORT("w_error") int w_error(lua_State *L) { return lua_error(L); }
#include <stdio.h>
/* the io library is opened but there are no files in the sandbox */
FILE *tmpfile(void) { return NULL; }
/* os.execute / os.tmpname: not available in the sandbox */
int system(const char *cmd) { (void)cmd; return -1; }
char *tmpnam(char *s) { (void)s; return NULL; }
