# 维护脚本

- `game-data/`：从读取器导出的游戏主数据生成网站的 `dist/game-data/`（`fulldata.py`、`gametext.py`、`export_engine_data.py` 等）。
- `lua-wasm/`：把官方 Lua 5.3.6 源码编译成 WebAssembly（`dist/engine/lua-wasm.mjs`），给网页里的沙盒引擎用；`sh local-migration-tools/lua-wasm/build.sh` 重新生成（需要 clang 18 和 git）。2026-09-30 起代替原来的 fengari。
- `loadout-reader-v0.9`～`v0.12`：配装读取器的源码副本。v0.12（2026-09-30）多导出 ArkPurityMst、ArkSkillGrowthMst（圣物满级数值要用）。编译：`llvm-dlltool-18 -m i386:x86-64 -d kernel32.def -l kernel32.lib`，两个 .c 用 `clang --target=x86_64-pc-windows-msvc -O2 -ffreestanding -fno-builtin -fno-stack-protector -mno-stack-arg-probe -c`，再 `lld-link /subsystem:console /entry:mainCRTStartup /nodefaultlib`（用同样方法重编 v0.11，与原来的 exe 只差时间戳）。

旧的“本地迁移与备份”页（`local-data.html` 等）和它的本地服务 `server.py`、`rebuild-exporter.py`、`rebuild-manifest.py` 已于 2026-09-30 删除（用户：“没用的就直接删了”）。
