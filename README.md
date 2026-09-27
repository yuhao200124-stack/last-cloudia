# 最后的克劳迪娅技能分类表

网站：https://yuhao200124-stack.github.io/last-cloudia/

- 网站文件在 `dist/`，推送到 `main` 后由 `.github/workflows/pages.yml` 自动发布。
- 修改前先读 `docs/CONTINUATION.md` 与 `DAMAGE-CALCULATOR.md`；技能名称和效果以 `dist/data.js` 为准，不用旧 Excel 覆盖。
- 发布前运行 `node --test tests/*.test.mjs`（目前 466 项中 4 项为既有失败）和 `node scripts/build-common-skill-rules.mjs --check`。
- 受保护文件的修改要按 `scripts/build-*-preservation.mjs` 的方式新增保护层。
- Claude 和 ChatGPT 共用本仓库：动手前先拉取最新版本，一次只由一方修改。

- 游戏数据技能表（`dist/game-skills.html`）：数据来自 `docs/game-relic-passives.json`（游戏主数据导出，942 个可从圣物学习的被动），运行 `node scripts/build-game-skill-table.mjs` 生成 `dist/game-skill-data.js`；分类、排序、评价沿用 `dist/data.js`。
