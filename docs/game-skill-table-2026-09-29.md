# 游戏数据技能表改为首页；原技能表删除；排版用 Excel 来回改（2026-09-29）

## 用户要求
- 以后只改游戏数据技能表。原技能表如果对计算器没影响就删掉，连同技能表里的“配装与伤害”等功能。
- 用户确认的几点：
  - 游戏数据技能表当首页。
  - 跟原表的对照（“原表：名称”“原表未收录”“原表 SC”、显示原表名称开关）和技能名称到 Altema 的链接都去掉。
  - “按每 SC 收益推荐”的候选技能以后再定（见 CONTINUATION 待办）。
- 技能表以后可能更新或改顺序：
  - 用户把表下载成 Excel，改完在聊天里发回来，由 Claude 重新排版上传。
  - 每一行带游戏编号，“不管我写什么就按照编号计算就可以了”。

## 首页
- `dist/index.html` 就是游戏数据技能表（原来的 `game-skills.html`，去掉“原技能表”链接和“显示原表名称”开关）。
- `game-skills.html` 只剩一个跳转页，旧地址会自动转到首页。
- 各页的“返回技能表”原本就指向 `index.html`，未改。

## 删除的内容（原技能表）
- **页面与数据**：原首页（技能表、首页配装面板、“配装与伤害”）、`data.js`、`app.js`、`loadout-frame.mjs`、`game-skill-names.js/.mjs`、`basic-stat-catalog.mjs`。
- **脚本**：
  - `build_data.py`：从原 Excel 生成 `data.js`。
  - `scripts/build-basic-stats.mjs`、`build-game-skill-names.mjs`。
  - `build-engine-loadout-data.mjs`：它的产物 `game-data/engine/loadout-data.json` 保留，现在是固定数据，恢复角色推荐配装和按每 SC 收益推荐继续用它。
- **测试**：`skill-audit.test.mjs`、`basic-stats.test.mjs`。
- **样式**：`styles.css` 和 `game-skills.css` 里只给原首页用的规则（约 2/3）。
  - 删除前后对首页（全部技能、伤害、基础属性）、角色列表和 4 个角色页，在电脑宽度和手机宽度下逐像素比对，完全一致。
- `scripts/new-character.mjs` 不再往 `app.js` 写角色配装条目。
- **保留**：
  - “本地迁移与备份”页（`local-data.html`、`export-old-site.js`、`local-backup.js`），用户没有表态，先不动。
  - 账户加护面板（角色页用）。

## 计算器不受影响
- 计算器页面和引擎不读原技能表的任何文件。
- 唯一的联系是配装的推荐数据（`loadout-data.json`），已保留。

## 技能表的数据从哪里来
- **游戏数据**（`docs/game-relic-passives.json`，游戏主数据 PassiveSkillMst／ArkMst 导出的 942 个可从圣物学习的被动）：
  - 名称、SC、效果、可学圣物。
  - 计算器只按游戏编号用它。
- **排版**（`docs/game-skill-layout.json`）：
  - 工作表（分页）和顺序、每页的行和顺序、分隔行、栏、分组、评价；
  - 用户改写的名称／效果说明，只改“简体”显示，“游戏原文（繁）”始终是游戏数据。
- `node scripts/build-game-skill-table.mjs` 用这两个文件生成 `dist/game-skill-data.js`。
  - 游戏数据里多出来的被动（游戏更新后）会自动放到“全部技能”末尾和“杂项”的“新增待排”组。
  - 排版里有、游戏数据里已经没有的编号不显示，并在 `removed` 里列出。

## Excel 来回改
1. 导出：`python3 scripts/game-skill-excel.py export <文件.xlsx>`，发给用户。
   - 第一页“说明”写了怎么改。之后每个工作表对应网页上的一个分页。
   - 表头黄色的列可以改：栏、分组、名称、效果说明、评价。
   - 表头灰色的列永远按游戏数据：游戏编号、SC、可学圣物。
   - 分隔行在游戏编号那一格写“——分隔——”。
   - 名称或效果说明清空，就恢复游戏原文。
2. 用户改完在聊天里发回。
3. 先检查：`python3 scripts/game-skill-excel.py import <文件.xlsx> --dry-run`。
   - 会列出：
     - 不存在的编号；
     - 同一个技能在几处改得不一样；
     - 栏写法不统一；
     - 改了 SC／圣物（不会生效）；
     - 没放进任何工作表的技能；
     - 名称／效果说明／评价的改动。
   - 有问题就停下问用户，不写文件。
4. 没问题就去掉 `--dry-run` 写入排版文件，再运行 `node scripts/build-game-skill-table.mjs`，测试通过后提交。

核对结果：
- 导出后原样导入，排版文件完全一致。
- 用现在的排版重新生成的 `game-skill-data.js` 与改动前一致，只少了原表对照字段。
- 测试 `tests/game-skill-table.test.mjs` 覆盖三点：首页、每行都是游戏编号、名称等取自游戏数据。
