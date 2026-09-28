# 删除旧版（网页规则）计算器；新版配装、面板与加成核对、圣物属性（2026-09-28）

用户要求：只为旧版计算器服务的东西全部删掉，旧代码和旧测试一起删；新版计算器不能受影响。“面板与加成核对”“已确认的伤害加成”接到新版上；配装以新版的配装为准；角色页只保留“已保存配装”。以后所有信息都从游戏数据取，只有个别内容从日本网站（Altema）拿。

## 伤害计算器页面（damage-calculator.html / .mjs）
- 只剩游戏脚本结算（engine-panel.mjs）需要的输入。
- `damage-calculator.mjs` 重写为新版的页面脚本，通过 `lc:calculator-update` 把状态交给 engine-panel。
- **删掉的旧版部分：**
  - 折叠的“网页旧规则”结果、技能参数、高级计算明细、旧上限卡片
  - 暴击／MP满／弱属勾选、贯导（防御参照倍率）、实测降防按钮、格挡、气绝
  - 角色特殊效果表、条件来源说明
  - 配装工作区（嵌入的首页配装）、大页面切换
  - 自带／通用技能确认、圣物伤害效果
- **招式**全部来自游戏数据（`game-data/c/<unitDressId>.json`）：普通攻击、特技1–3、超必杀、形态2、有伤害的魔法和重魔法。无伤害的辅助魔法在“魔法”栏勾选。
  - 没有角色参数时，可以从游戏数据选任意角色。
- **命中段数**只由用户填写，默认 10，按招式分别记住。
- **01 角色基础资料**：六维最大值取 Altema（`docs/site-characters.json` → `game-data/index.json` 的 `siteStats`），加护按账户默认比例。
  - 用户确认：只有六维最大值、角色评价与图片等展示内容从 Altema 拿。
- **读取报告**：格式检查和 v0.35 的 MP 单位修正保留（`battle-report.mjs`），然后直接交给游戏脚本。
  - 报告里第 1 个角色必须是本页角色。
  - 报告里的 Boss 出现在目标预设里。
- **专武名称**：从旧规则模板移到 `character-gear.mjs`，名称已和游戏数据核对。
- **开关**：
  - 默认值与旧版相同，特攻只对洛琪希默认打开。
  - 第一次打开时，沿用旧版保存的开关、专武和圣物属性。
- **圣物属性**（已确认的伤害加成里只保留这一块）：用户规则是“直接加在最终值上”，例如最终攻击力 100、圣物攻击力 10，结果就是 110。
  - 引擎 `finalStat` 在最终值上加 `u.finalAdd`（来自 `addAttacker` 的 `spec.finalAdd`）。
  - 法强／攻击力的计算过程里会显示这一步。
  - 待办：圣物以后改成从游戏数据做，这块再删掉。

## 配装（原“配装”按钮的位置）
新版配装面板在结果卡下面，点“配装”展开。原有功能都在：自带被动基线、专武开关、搜索通用被动、试算、每个被动的收益。本次新增：
- **保存配装**：
  - 可以起名、另存为新、载入、改名（用名称框里的名字）、删除（点两次确认）。
  - 存在 `localStorage` 的 `lc-engine-plans:v1`（这个浏览器），内容是所选通用技能、自带被动开关和专武开关。
- **恢复角色推荐配装**：来自旧配装的角色推荐方案（`app.js` characterLoadouts）。
  - 技能表行先按游戏名称换成游戏被动；同名的两个被动按技能表 SC 对照游戏 COST 区分：神族护罩 SC5 → 16611、SC10 → 27954；勇者之魂 SC20 → 28093。
  - 数据由 `scripts/build-engine-loadout-data.mjs` 生成，写入 `game-data/engine/loadout-data.json`。
- **按每 SC 收益推荐**：
  - 候选是技能表里的每个通用被动（933 个）加上本角色能力盘上要花 SC 的被动。逐个加进当前配装试算，按“收益 ÷ SC”排序。
  - 可以停止，也可以只算搜索到的被动。换招式、条件或配装后会自动停止。
  - 收益只比较招式的第一条伤害弹道，与主结果卡的每次期望一致。
- 用户确认：旧配装的其他功能（按分类浏览、效果／圣物／评价显示、能力盘突破免 SC、加成合计）这次不做，新版配装以后要大改。首页技能表本身完全不动。

## 面板与加成核对
改为显示新版在所选招式第 1 击实际计入的内容，全部由游戏数据和游戏脚本算出：
- 八项属性（HP、MP、攻击、防御、法强、魔抗、暴击率、速度）的面板值、战斗中数值和逐项来源；
- 本招式的法强／攻击力、暴击率和伤害上限的计算过程；
- 伤害倍率：技能系数、属性耐性、特攻、核心前三项倍率、核心伤害，以及结算后修正（按执行顺序）。

## 入口
用户要求：只从各角色页进入计算器（角色页里的“伤害计算器”按钮）。各页面顶部不带角色的“伤害计算器”链接（首页、角色列表、游戏技能页、打标签页、角色页顶部导航、角色页模板）已删除（保存层 calculator-link，基线 0988749）。首页配装面板里的“配装与伤害”按钮属于首页，未改。

## 角色页
- 删掉“基础计算器”“基础伤害上限”“最终伤害上限”三个按钮和面板（`base-rule-calculator`、`character-calculator.js`、`characterCapProfile`、`data.js` 引用）。模板和生成器同步修改。
- “已保存配装”（`character-saved-builds.mjs`）只列新版计算器保存的配装，显示技能和 SC 合计。点“在计算器中打开”，就带着这套配装打开伤害计算器（`…&plan=<id>`）。
  - 用户确认：首页以前保存的旧配装不再显示。

## 删除的旧代码
- **模块（dist）**：
  - attack-layers、base-rule-calculator（.mjs/.css）、basic-stat-rules、battle-entry-data、bonus-comparison、calculator-navigation、character-calculator.js、character-combat-rules、character-report-loader、character-template
  - combat-modes、common-skill-catalog、common-skill-rules、critical-options、damage-condition-display、damage-engine、damage-import、damage-recommendations、effect-rule-learning、effect-totals
  - entry-preparation、entry-workflow、eris-rules、formula-csv-parser、game-skill-timing、loadout-preview、magic-buffs、mayly-data、mayly-rules、panel-calculator
  - reader-bonus-decoder、reader-group-review、reader-process-evidence、reader-supplements、roxy-rules、runtime-buff-definitions、runtime-buff-engine、scenario-bonus-summary、unified-calculator
- **脚本**：build-common-skill-rules、audit-common-calculator-coverage、compile-common-skills、common-calculation-adapter。
- **测试**：只测旧模块的测试整份删除；混合的只删掉用到旧模块的用例（account-blessings、basic-stats、skill-tags、stat-mechanics）。
- **保留的**：
  - 首页技能表的数据管线生成的 basic-stat-catalog、game-skill-names.mjs、skill-tag-catalog、attack-tag-catalog；
  - 账户加护面板（account-blessings-panel → effect-rule-engine、stat-mechanics、stat-condition-fields）；
  - export-old-site.js（本地数据页）。
- **保存层**：`engine-only`（基线 fc7ee3c）。删除的文件记为 `deleted: true`，分类测试通过 `readProtected()` 把它读成空文本后再还原。

## 新版不受影响的核对
- 删除前后，在浏览器里对 4 个角色的全部 23 个招式各跑了默认条件、Break、满血、特攻切换、每个辅助魔法这些情况，共 123 组。
- 对比的项目：每段普通／暴击伤害、法强／攻击力、暴击率、伤害上限、特攻／弱属匹配、三个字段的计算过程、开关状态。结果完全一致。
- “整次期望”因为命中段数默认改成 10，按用户要求变化。

测试：`tests/calculator-page.test.mjs`（新）、`tests/engine-*.test.mjs`、`tests/boss-presets.test.mjs`、`tests/character-game-text.test.mjs`。
