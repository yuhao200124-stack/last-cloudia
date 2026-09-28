# 角色页技能名称与说明＝游戏数据原文（2026-09-28）

用户要求：角色页里每个技能的名字和效果必须是游戏数据库里的原文，不用最早机翻的技能表；以后新建角色也必须一样。主技能表（`index.html`／`data.js`）之后会删除，本轮不改它的名称。

## 规则

- 个性、专属技能、通用技能、超越、特技／超必杀、魔法、专武卡的名称与说明，全部由 `scripts/sync-character-game-text.mjs` 从 `dist/game-data/c/<unitDressId>.json`（局外读取器从游戏主数据导出）写入角色页。
  - 被动：`passives[id].nameS`／`textS`；特技、超必杀、魔法：`nameS`／`explainS`（导出时由 `publish.py` 用 OpenCC 转成简体）；专武卡：装备 `nameS` 与其被动的 `textS`（只替换“最高效果”一栏）。
  - 说明中的换行按空格连接；原文里的日文字形（如 攻撃、効果、麻痺、悪行症候群）照用。
- 每个技能行、个性卡、专武卡都带 `data-game-id`（被动编号／技能编号／装备编号）。脚本按编号取数据，不靠名字匹配。
- 原文里导出时没代入的“?”、以及专武的神装强化数值，登记在 `docs/game-text-fills.json`，每条写明依据的读取器解析值。未登记的“?”、未登记的神装强化同名被动，脚本直接报错，不会留在页面上。
- `tests/character-game-text.test.mjs` 对 `dist/game-data/index.json` 的 `site` 里每个角色检查：页面必须与脚本输出完全一致，每一行都有 `data-game-id`。不符合就过不了测试。

## 新建角色的做法

1. 在 `dist/game-data/index.json` 的 `site` 里加上 站点角色编号 → unitDressId。
2. 角色页各表格照现有结构放行：技能名放在 `<span class="skill-name …">`，说明放在该行最后一个 `<td>`；个性用 `<article class="trait"><h4>…</h4><p>…</p>`；专武用 `<article class="equipment-card">`（含“最高效果”一栏）。每行写上 `data-game-id`。名称和说明可以先留空。
3. 运行 `node scripts/sync-character-game-text.mjs`，名称与说明即为游戏原文；按报错补登 `docs/game-text-fills.json`。
4. 该角色的规则目录（`*-rules.mjs`）按页面上的游戏名称和原文编写。

## 已有 4 个角色的兼容

梅莉 182、阿尔克 245、艾莉丝 259、洛琪希 260 的规则目录是按早先措辞拆分的，按原文匹配。改名后：

- 页面显示游戏原文；早先措辞保留在说明元素的 `data-rule-text`，`collectCharacterSources`／`readCharacterProfile` 用它匹配规则，所以每条规则、判定和数值不变（已在浏览器中对比全部来源的规则、状态、数值与招式参数，除名称外完全一致）。基础计算器展示的说明用页面原文（`displayText`）。
- 规则目录、旧版角色页计算器（`character-calculator.js`、梅莉页内上限配置）、读取器来源名、`effect-rule-engine.mjs` 中按名称判断的一天真刃･弐式，均改为游戏名。对照表：`docs/game-name-map-2026-09-28.json`；每行编号：`docs/character-game-ids-2026-09-28.json`。
- 配装 iframe 仍按原先的名称把角色技能绑定到主技能表同一行（`game-skill-names.js` 的 `CHARACTER_SKILL_LEGACY_NAMES`），绑定结果与改名前逐一相同；新角色按游戏名绑定（`GAME_SKILL_NAMES`）。
- 通用技能身份识别同时认主技能表名称和游戏名称（`common-skill-rules.mjs`）。

## 核对结果

- 游戏数据数值与计算器规则一致。梅莉两件专武的页面最高效果使用神装强化后的被动（1020482：伤害 +40%、上限 +6,000、攻击 +15%；1012782：光暗伤害 +35%、上限 +5,000、暴击率 +7%），与规则原有数值相同；导出数据只带基础被动 1020480／1012780 的说明，数值替换登记在补值表里。
- 艾莉丝「拜托你了喵☆」页面原写“实测约28/100次”，游戏数据为发动几率 40%，已按游戏数据补注。
- 游戏数据中“神族护罩”（16611、27954）两个不同被动同名，属游戏原数据如此。
- 自动充能、自动暴击、自动速咏等原文只写“始终保持「…」效果”，不写数值；计算器仍按对应 Buff 的数值计算。
- 主技能表与游戏数据的旧对照有一条配错（麻痹研究被配成 9400 疾病研究），已在 `docs/game-relic-passives.json` 取消，游戏数据技能表重新生成；麻痹研究的游戏名为 9300 麻痺研究。
