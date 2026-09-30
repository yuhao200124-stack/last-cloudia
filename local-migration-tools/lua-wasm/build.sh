#!/bin/sh
# Builds dist/engine/lua-wasm.mjs: the official Lua 5.3.6 compiled to WebAssembly for the battle-script sandbox
# (replaced the fengari JS VM on 2026-09-30: about 4.5x faster, same results). Needs clang/wasm-ld 18 and git.
#   sh local-migration-tools/lua-wasm/build.sh [work-dir]
# 32-bit integers (-DLUA_INT_TYPE=1) like fengari; Lua errors throw a JS exception instead of longjmp
# (wasm_prelude.h, caught in dist/engine/lua-host.mjs), so no wasm exception-handling support is needed.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); OUT="$HERE/../../dist/engine/lua-wasm.mjs"; W=${1:-/tmp/lua-wasm-build}
mkdir -p "$W" && cd "$W"
[ -d lua53 ] || git clone -q --depth 1 -b v5.3.6 https://github.com/lua/lua lua53
[ -d wasi-libc ] || git clone -q --depth 1 -b wasi-sdk-22 https://github.com/WebAssembly/wasi-libc wasi-libc
[ -f wasi-libc/sysroot/lib/wasm32-wasi/libc.a ] || make -C wasi-libc -j8 CC=clang AR=llvm-ar NM=llvm-nm THREAD_MODEL=single >/dev/null
if [ ! -f rt/libclang_rt.builtins-wasm32.a ]; then   # long double helpers used by printf/strtod
  [ -d llvm ] || { git clone -q --depth 1 --filter=blob:none --sparse -b llvmorg-18.1.3 https://github.com/llvm/llvm-project llvm; git -C llvm sparse-checkout set compiler-rt/lib/builtins; }
  mkdir -p rt; for f in llvm/compiler-rt/lib/builtins/*.c; do clang --target=wasm32-wasi --sysroot=wasi-libc/sysroot -O2 -c "$f" -o "rt/$(basename "$f" .c).o" -Illvm/compiler-rt/lib/builtins 2>/dev/null || true; done
  llvm-ar crs rt/libclang_rt.builtins-wasm32.a rt/*.o
fi
SYS="$W/wasi-libc/sysroot"; mkdir -p obj; cd obj; rm -f *.o
FL="--target=wasm32-wasi --sysroot=$SYS -O2 -DLUA_INT_TYPE=1 -DLUA_FLOAT_TYPE=2 -DL_tmpnam=32 -D_WASI_EMULATED_SIGNAL -D_WASI_EMULATED_PROCESS_CLOCKS -include $HERE/wasm_prelude.h -I$HERE -I$W/lua53"
for s in lapi lcode lctype ldebug ldo ldump lfunc lgc llex lmem lobject lopcodes lparser lstate lstring ltable ltm lundump lvm lzio lauxlib lbaselib lbitlib lcorolib ldblib liolib lmathlib loslib lstrlib ltablib lutf8lib loadlib linit; do clang $FL -c "$W/lua53/$s.c" -o $s.o; done
clang $FL -c "$HERE/glue.c" -o glue.o
clang --target=wasm32-wasi -O2 -mexec-model=reactor -nostdlib "$SYS/lib/wasm32-wasi/crt1-reactor.o" *.o -L"$SYS/lib/wasm32-wasi" -lc -lwasi-emulated-signal -lwasi-emulated-process-clocks "$W/rt/libclang_rt.builtins-wasm32.a" \
  -Wl,--export=__stack_pointer -Wl,-z,stack-size=1048576 -Wl,--strip-all -o lua.wasm
python3 -c "import base64,sys; open(sys.argv[2],'w').write('// Lua 5.3.6 compiled to WebAssembly (32-bit integers); built by local-migration-tools/lua-wasm/build.sh from the official source.\nexport const LUA_WASM_BASE64 = \"'+base64.b64encode(open(sys.argv[1],'rb').read()).decode()+'\";\n')" lua.wasm "$OUT"
echo "wrote $OUT ($(wc -c < lua.wasm) bytes of wasm)"
