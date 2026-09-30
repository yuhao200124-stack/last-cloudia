# 维护脚本

- `game-data/`：从读取器导出的游戏主数据生成网站的 `dist/game-data/`（`fulldata.py`、`gametext.py`、`export_engine_data.py` 等）。
- `engine/`：把 fengari（Lua）打包给网页里的沙盒引擎用。
- `loadout-reader-v0.9`～`v0.11`：配装读取器的源码副本。

旧的“本地迁移与备份”页（`local-data.html` 等）和它的本地服务 `server.py`、`rebuild-exporter.py`、`rebuild-manifest.py` 已于 2026-09-30 删除（用户：“没用的就直接删了”）。
