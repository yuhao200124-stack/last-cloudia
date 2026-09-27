# 游戏脚本沙盒引擎（dist/engine）

计算器的主结果卡（普通每段／暴击每段／整次期望／上限／结算攻防／特攻）由沙盒引擎驱动：游戏自己的战斗脚本在网页里跑一遍；网页旧规则的结果收在卡片底部「网页旧规则（对照）」里，不参与主结果。段数取计算器的「基础命中段数」（主卡上可直接改，改的是同一个字段，按招式保存）；一段 = 首个伤害弹道的全部调用（二刀流／多段魔法为两次）。

## 组成

| 文件 | 作用 |
| --- | --- |
| `dist/engine/fengari.mjs` | Lua 5.3 虚拟机（fengari，MIT），由 `local-migration-tools/engine/bundle-fengari.mjs` 打包 |
| `dist/engine/lua-host.mjs` | 装载脚本、注册原生函数、JS↔Lua 值转换 |
| `dist/engine/battle.mjs` | 原生战斗核心的 JS 替身：单位、控制项存储（ProcControl2）、两层属性（UnitGetValue）、Buff（BuffControl）、按 PRIORITY 的触发派发、弹道段（双刀／多段魔法）、伤害流水线 |
| `dist/engine/scenario.mjs` | 计算器调用入口：构造攻击方／目标、回放开局触发、施放技能、汇总每段结果 |
| `dist/engine/report-adapter.mjs` | 读取器入场报告 → 攻击方（入场面板、装备、个性等级、每个流程实例及其运行时参数） |
| `dist/engine/panel.mjs` | 未导入报告时按主数据算局外面板：等级成长 + 觉醒 + 能力盘属性格 + 装备参数（含专属装备参数增减）再过状态计算被动 |
| `dist/game-data/engine/monsters.json`, `monster-passives.json` | 目标：HP ≥ 50 万的怪物（按名称/等级/数值去重，4,487 条）及其自带被动（MonsterPassiveSkillMst，独立 ID 空间）；`scenario.targetFromMonster` 生成目标，与读取报告里的 Boss 数值逐项一致 |
| `dist/engine/loadout-adapter.mjs` | 读取器配装报告（LoadoutReport.json，战斗外）→ 本账号每个角色的真实等级／突破／觉醒／已开能力盘（个性等级、技能等级）、已装被动、装备、魔法；位图按游戏 FlagDecryptor 解码，SWITCH_INDEX→ID 表在 `engine/switch.json`（主数据行序，重复取首行） |
| `dist/engine/engine-data.mjs` | 读取 `dist/game-data/engine/{core,shared,c/<dress>}.json` 与 `dist/game-data/lua/*.lua` |
| `dist/engine-panel.mjs` | 计算器面板；监听 `lc:calculator-update` |
| `local-migration-tools/game-data/export_engine_data.py` | 从读取器导出的 *Mst.bin 生成引擎数据 |

脚本（luaCommon / procCondCommon / condition / process / battleScriptCommon）由读取器 v0.9 从游戏进程只读捕获，游戏更新后需重新捕获并重新导出主数据。

## 原生语义（来自 GameAssembly 分析与实测）

- 触发：被动技能 PROCESS_INFO 每段 → 一个流程实例；ProcessMst.PROCESS_COND → ProcessCondMst.HAPPEN_COND 为触发号，LUA_FUNC_NAME 为条件函数；同一触发内按 PRIORITY 降序、创建顺序稳定。
- 参数：`pid:概率:p1:p2…`，空位为 0；脚本收到定长参数表；Buff 的第一个参数固定为持续帧数（-1 永久），脚本看到其余参数。
- 属性：`floor((基础 + Σ值) × (1 + Σ倍率/10000)) + Σ加算`，分两层：状态计算时（触发 1，局外面板）与局内（Buff、技能内修正相加后再乘）。
- 伤害：`A × 0.9^(kF/A) × 系数 × 段倍率 × 属性 × 特攻(1.5×(1+Σ)) × 攻方 504 × 受方 504 × 减伤 × 随机`（单精度），再按触发 27/28 的 EditDamagePer 逐条四舍五入，最后上限 `(9999 + Σ值) × (1 + Σ倍率) + Σ加算`。
- 多段：二刀流（控制 808，防具栏装武器，物理弹道）或多段魔法（控制 825，魔法弹道）时，弹道流程调用两次，两次都按降低后的倍率（6000 = 每次 60%），hitIndex 从 1 起；21/22 触发可改倍率或取消（水王级魔术师对非冰魔法恢复单次全额）。防具栏装武器时 `UnitGetArmorType` 返回 0（Lua 侧 `SubWeaponType` 才能读到副手，神帝劍等"二刀時"被动依赖它）。
- 系数单精度：`f32(f32(per × 0.0001f) × f32(倍率 × 0.0001f))`——两个万分比都先乘 0.0001f 再相乘（5200×6000 → 0.311999977，3410×6000 → 0.204599977，与读取器捕获的 base_ratio 逐位相同；按双精度 /10000 会差一个 ulp）。
- 技能类型组合码（SKILL_CATEGORY_EXPANSION）：bit(type+3) 展开后，其中的 10（物理）再展开为 普攻+技能（270592 → 普攻/技能/特技/反击）。
- 技能目标（TARGET_INFO 第 1、2 段 = 目标侧、规模）通过 `UnitGetSkillTarget/UnitGetSkillTargetType` 提供，`ActValidOwnerSkillBefore` 类条件比较目标侧。
- 报告里 affiliation 18（徽章词条）、15（支援被动）等没有 PassiveSkillMst 行的来源，按"流程 ID + 读取到的参数"直接建实例（`Battle.addProcesses`）。
- 徽章（CrestMst）：`UnitUtil.AddCrestParameter` 按 DataManager.UserItem.CrestInfoList[用户徽章 id] 取 CrestID → CrestMst.PARAMETER_INFO（HP:MP:STR:DEF:INT:MND）与装备一样在倍率层之前加入面板（不经 EquipParam 修正），RESIST_ELEM_INFO 加入属性抗性；词条是 PassiveSkillMst 5,000,000–5,199,999 段的被动（家族 5xxx + 档位后缀，如 5050015 劍魔法增幅界限突破 = 1082608/1082602 各 3200、5004014 攻擊力提升 +15%、5078029 超必殺技界限突破 +15,000，与亞克报告里 affiliation 18 实例的流程与参数相同），CrestInfo.Slot {Rank, MaxRank, Locked, LotteryNumber, PassiveID}；`engine/crests.json` 按需加载，`spec.crest = {crestId, traits}` 由读取器 v0.11 的 `crests`/`equipItems` 生成。配装 equipInfo 的 6 个槽位：1 武器、2 防具、3/4 饰品、5 外观（ItemEquipMst EQUIP_TYPE 40，无数值）、6 徽章（用户徽章 id，即 UserItem.CrestInfoList 的键）；局内词条实例的 local_id 固定为 400218/400219/400220（槽位顺序，两名角色的报告相同）。装备强化等级来自 UserItem.ItemEquipInfoList.AlchemyLevel（按装备 id）；MAX_LV=0 的装备（如均衡的天冥珠）PARAMETER_MAX_INFO 为空，数值取 PARAMETER_INFO。
- 施放前已用技能（`state.preCasts`）：按顺序完整施放（自身/友方目标技能打在自己身上），累计计数类被动、自我 Buff（如神託的誓言 必杀上限 +100,000）由此产生。
- LIFETYPE_CONTINUOUS 的控制在其触发再次评估时失效；ChangeBuff(54) 在一次 Buff 变化结束后统一派发一次。
- fengari 整数为 32 位：`bitToBoolean` 以移位重写，其余脚本按原样运行。
- 局外面板（UnitUtil.GetUnitBasicStatus / FillUnitDressParam）：`裸属性 = min + round(max × GROWTH_RATE[lv] / 10000) + Σ觉醒(UnitDressAwakeMst) + Σ已开属性格(UnitDressAbilityPieceMst 类型 10–15)`，PARAMETER_INFO 的 `min-max` 中 max 是成长量而非 100 级值；所有角色 GROWTH_ID=2，成长率来自 GrowthMst（读取器 v0.10 导出，120 级：Lv100=10000、Lv110=10813、Lv120=12633；12633 与此前用 4 个已验证角色六维拟合的值相同）。装备参数按 ItemEquipParameterGrowthMst：`min + round((max − min) × map[lv] / map[MAX_LV])`（+0 … +MAX_LV，满强化即 PARAMETER_MAX_INFO），`EquipParam`(319: 装备种类, 属性, 倍率) 逐件加算后四舍五入（洛琪希之魔杖 INT 365→730、衣服 INT 229→344、MND 116→290），再进入 `floor((裸 + 装备 + Σ值) × (1 + Σ倍率)) + Σ加算`。

## 验证

`tests/engine-loadout.test.mjs`：用读取器 v0.11 配装报告的成长／装备强化等级／徽章，配合入场报告里的被动实例，亞克（封劍 +0、神帝劍 +40、Crest: Jala Lv9：劍魔法增幅界限突破／攻擊力提升／超必殺技界限突破）与魯迪烏斯的入场面板七项（HP/MP/STR/DEF/INT/MND/CRT）逐项相等（亞克 21,744/359/7,286/3,115/1,281/1,820/22；去掉徽章则 STR −1,230、DEF −283）；词条实例的流程与参数与报告的 affiliation 18 实例相同。

`tests/engine-panel.test.mjs`：4 个角色的裸属性与网站「最大阶段属性」逐项相等；洛琪希 裸属性 + 专属装备 + 状态计算被动 + 本账号加护 = 读取器入场面板 HP 13,591 / MP 1,018 / STR 1,270 / DEF 1,621 / INT 6,741 / MND 2,808 / CRT 11（逐项相等）。

`tests/engine-captures.test.mjs`：亞克（双剑物理）54 击逐位精确——彌賽亞狂擊 25、普攻 4、十字斬 7、勇氣之光 13、必杀勇者之劍 5（含暴击、贯通触发、必杀上限 543,658/618,408，后者需要徽章词条 +15,000 与先放的神託的誓言 +100,000）；魯迪烏斯 豪雷積雨雲（战斗首个动作）4/4 逐位精确。

`tests/engine-roxy.test.mjs`（fixture：`tests/fixtures/roxy-battle-report.json`）：洛琪希入场面板 INT 6,741 → 局内 10,111（EX 光环）→ 12,133（月光II，满血）；DEF 1,621→2,295、MND 2,808→3,482、CRT 11→21 与读取器局内观察一致；异度克里昂 A=14,627/16,650，随机 0.95 核心 11,848，追加段 157,572–175,079（计算器验证值 157,565–175,076，差异来自逐条四舍五入的顺序）。

全角色扫描（268 角色 1,601 招式）无脚本错误、无未实现原生函数。领域展开（Collision）按「所有单位都在范围内」简化（结果里标注为简化假定）；位置／墙距、多人联机、PvP 仍未模拟。嵌套触发（脚本内的原生调用再次进入 Lua，例如 ExpireBuff → Buff变化）前后保存／恢复脚本全局（this/target/units/myTrigger 等），否则 `TimeLine` 的触发门控会在外层脚本里失效。

## 已知限制

- 段数（时间轴）不在主数据中，仍取计算器填写值。
- 目标可直接从游戏怪物表选择（面板「目标：从游戏怪物表选择」），含 Boss 自带被动；Break 状态、Boss 的 HP 阶段等仍需手动条件。
- 导入配装报告后按本账号实际配置结算（面板里「配装报告」文件框，存于浏览器本地）；未导入时按全部自带技能 + 专属武器／防具满强化 + 本账号加护（`dist/account-blessings.mjs` 的读取值）。圣物加成、装备强化等级（报告未含时按满级）仍未计。
- 用户规则（2026-09-28）：配装报告只决定"装了什么"（被动、装备、魔法、徽章及其已抽词条）；凡可升级／强化的一律按最大计——等级、觉醒、整块能力盘（性格按盘上最高级）、装备满强化、徽章同系列最高等级；圣物不计。`attackerFromLoadout(..., { maxGrowth: false })` 仍可按账号实际等级（读取器 v0.11 的 AlchemyLevel 等）精确计算，测试用它对照入场面板。
- 徽章：读取器 v0.11 起按配装报告的徽章实例（本体参数 + 三个词条被动）计入；v0.10 及更早的报告没有徽章数据，按无徽章计。
- 配装模式（面板「配装模式」，2026-09-28）：基线 = 角色不花 SC 的自带被动（个性、COST 99 的固有被动、超越）＋本账号加护，专武可开关，其余按最大；用户逐个加被动（本角色能力盘上要花 SC 的，或 `engine/passive-index.json` 里 2,123 个通用被动，按名称搜索），每个已选被动给出"去掉它"的收益、候选给出"加上它"的试算（随机 0.95 单点，与主结果同一指标：每次调用的期望伤害）。「从配装报告载入已装被动」把报告里装的被动填进来（含徽章）。按角色存于浏览器 `lc-engine-build:<dress>`。
- 配装里从其他角色学来的被动不在角色包里，按 id 桶（`engine/p/<id÷10000>.json`，共 105 个文件 1.5 MB）按需加载；无法解析的 id 在面板摘要里计数。
- 加护数值随账号等级变化，报告或账号加护记录里的运行时参数才是真实值。
