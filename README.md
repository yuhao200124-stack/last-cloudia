# 最后的克劳迪娅技能表与伤害计算器

网站：https://yuhao200124-stack.github.io/last-cloudia/

- 网站文件在 `dist/`，推送到 `main` 后由 `.github/workflows/pages.yml` 自动发布。
- 修改前先读 `docs/CONTINUATION.md` 与 `DAMAGE-CALCULATOR.md`；技能名称和效果以 `dist/data.js` 为准，不用旧 Excel 覆盖。
- 发布前运行 `node --test tests/*.test.mjs`，必须全部通过。
- 伤害计算器只用游戏数据与游戏脚本结算（`dist/engine/*`、`dist/engine-panel.mjs`、`dist/damage-calculator.mjs`），只从各角色页进入；旧版规则计算器、打标签页与“保存层”流程已于 2026-09-28／29 按用户要求删除（见 `docs/old-calculator-removal-2026-09-28.md`）。
- Claude 和 ChatGPT 共用本仓库：动手前先拉取最新版本，一次只由一方修改。

- 游戏数据技能表（`dist/game-skills.html`）：数据来自 `docs/game-relic-passives.json`（游戏主数据导出，942 个可从圣物学习的被动），运行 `node scripts/build-game-skill-table.mjs` 生成 `dist/game-skill-data.js`；分类、排序、评价沿用 `dist/data.js`。

- 游戏主数据后台（`dist/game-data/`）：读取器 v0.8 导出的主数据表经 `local-migration-tools/game-data/`（active.py → fulldata.py → publish.py）生成；`dist/game-data.mjs` 负责读取。计算器选择招式时，未手填、读取报告也没有的系数、攻击修正自动取自这里。
