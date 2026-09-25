# Boss 全部效果接续记录（2026-09-25）

用户要求“把boss伤害按照之前魔法伤害和物理伤害那样改，并且把有关boss点补全”。沿用原站 appgprj_6ab13ba277b881919538217cd5e376dc，从种族轮版本 131、源提交 5af8a83b5d536ca29047c267cc525a3514b98c9d 接续，没有新建网站。

原网址：https://last-cloudia-skill-table.yuhao200124.chatgpt.site/skill-labeling.html?tag=boss

## 本轮范围

对全库 935 个去重技能逐项记录审计；31 个 Boss 相关技能、20 个分组、55 个效果绑定。原“Boss增伤”入口原地改名“Boss”，Boss伤害仅为一个子组。六个旧增伤子入口和历史标签／审计保留，原网址可继续访问。当前主标签数仍为 56。

| 分组 | 入口 tag | 技能数 |
| --- | --- | ---: |
| Boss伤害增加 | boss-damage | 1 |
| Boss魔法伤害增加 | boss-magic-damage | 4 |
| Boss物理伤害增加 | boss-physical-damage | 2 |
| Boss特技伤害增加 | boss-skill-damage | 4 |
| Boss必杀伤害增加 | boss-ultimate-damage | 5 |
| Boss暴击伤害增加 | boss-critical-damage | 1 |
| Boss物理伤害上限 | boss-physical-cap | 2 |
| Boss魔法伤害上限 | boss-magic-cap | 4 |
| Boss特技伤害上限 | boss-skill-cap | 5 |
| Boss必杀伤害上限 | boss-ultimate-cap | 6 |
| Boss暴击伤害上限 | boss-critical-cap | 1 |
| 受到Boss伤害减少 | boss-incoming-damage-down | 6 |
| 非Boss特技伤害增加 | boss-non-boss-skill-damage | 2 |
| 受到非Boss伤害减少 | boss-non-boss-incoming-damage-down | 3 |
| Boss即死无效 | boss-instant-kill-exclusion | 1 |
| Boss Wave攻击力 | boss-wave-str | 2 |
| Boss Wave防御力 | boss-wave-def | 1 |
| Boss Wave开始时HP回复 | boss-wave-start-hp | 1 |
| Boss Wave开始时SCT回复 | boss-wave-start-sct | 1 |
| Boss Wave开始时必杀槽回复 | boss-wave-start-ultimate-gauge | 1 |

分组中重复展示同一技能按唯一技能计数。龙觉醒1883应用户此前明确要求继续出现在 Boss物理伤害列表，同时出现在 Boss Wave攻击力组；只保存一条 STR +20% 绑定，通过 associatedGroups 表示显示关联，绝不建成物理伤害 +20%。941 的 Boss Wave属性不自动加入该物理列表。

## 完整限定与独立条件

- 对 Boss 增伤与受到 Boss 减伤分别以目标、攻击来源为条件。勇者之魂1608保留通用对 Boss伤害 +20%，不拆成四条攻击种类增伤；其受到 Boss伤害 -20% 已补齐。
- 铠甲增幅290、高阶246、超阶638的 Boss减伤保留盔甲装备限制，分别 -5%、-10%、-10%。638另外的物理减伤保持独立，不缩成仅 Boss物理减伤。
- 巨型护罩888／1097为受到 Boss伤害 -10%／-20%。王者威装640／1630／1918为受到非 Boss伤害 -10%／-15%／-20%。弱肉强食760／1526只增加对非 Boss敌人的特技伤害。
- 对 Boss的物理、魔法、特技、必杀、暴击伤害与上限分开。锐利一击1289要求实际暴击，不提高暴击率或授予魔法暴击资格。
- 荒神御魂1651保留基础物理上限 +3,000，以及0或1把武器时额外 +3,000；条件为 OR，额外与基础相加。勇者前线1955分别保留物理／必杀基础与单武器额外各 +10,000；原 STR参照计算不绑定 Boss条件。
- 霸幻双刃1830只有额外 +5,000 特技上限限定 Boss；双武器基础特技增伤和上限仍独立。格雷拉特家的血统2028的特技／魔法上限保留“自身以外至少一名女性友方存活”，不要求所有队友均为女性。
- 调查兵团720为装备同技能我方1／2／3／4人时 +6%／12%／18%／24%；英雄传说1708为至少2人，2／3／4人时必杀上限 +5,000／10,000／15,000。均不默认最大档，实际队伍条件仍待判断。
- 941的STR／DEF +7%和1883的STR +20%是 Boss Wave当前状态；不要求当前攻击对象为 Boss，不是开场限时 Buff。电话亭460只在 Boss Wave开始时分别回复HP 50%、全部特技SCT 30秒、最大必杀槽10%，不是SCT库存、回复速度或必杀伤害。
- 死神192的即死对 Boss及竞技场无效；Boss排除条件已完成，竞技场限制、触发概率和目标免疫判定保留待判断，不生成数值概率。巨人格斗战731仅名称含“巨人”，不纳入 Boss。

## 共享判断与旧数据保留

本轮新增5个共享记录：640、888、1097、1630、1918。累计 843 个已贴标签技能、63轮标签，完整524、部分319、无法判断0。Boss页完整24、部分7；部分技能为192、246、290、638、720、1708、2028，剩余均为竞技场／未知概率、盔甲装备、独立物理来袭条件或队伍条件。

9个既有技能随 Boss片段补齐转为完整：941、1883、1955、1651、1608、460、1830、760、1526。跨页状态同步：物理146完整／84部分；魔法80／50；必杀98／15；特技45／37；龙种族14个全完整。

boss-preservation-2026-09-25.json 保存旧838条来源／片段与绑定哈希、旧62轮分配哈希。只拆分192的“Boss及竞技场无效”与638的“物理伤害／Boss来源”两个原来未覆盖的复合条件；保留原ID作Boss分支，新增另一个独立分支。未改写旧技能描述、旧绑定或旧标签分配。旧1883、1608说明中“Boss尚待判断”的文字已随本轮实际完成状态更新。

页面仅给判断文字着色，保留白表格、完整→部分→未知排序、分组显示与去重搜索；修改描述立即使原标签和关联失效。numericEffectInjection=false；dist/data.js、计算规则和用户保存不变。模型与渲染器仅增加对明确显示关联 associatedGroups 的支持，以保留1883；旧模型保留校验通过反向还原这一个表达式核对原哈希。

## 验证及后续

构建：node scripts/build-skill-labels.mjs。
回归：node --test --test-reporter=tap --test-concurrency=2 tests/*tagging.test.mjs，154 项全部通过；覆盖完整全库审计、62轮旧标签与838条记录保留、Boss方向与攻击类型、额外上限、人数档位、Wave时机、即死未知项、1883关联、跨页同步及描述失效。

后续继续同一共享登记表和原站；不要重建、不要把Boss当普通种族、不要以本轮新标签覆盖独立未完成项。保留现有 custom 访问范围。
