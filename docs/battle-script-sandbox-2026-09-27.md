# 游戏脚本沙盒引擎（dist/engine）

计算器的「游戏脚本结算」面板不再用手写规则，而是让游戏自己的战斗脚本在网页里跑一遍。

## 组成

| 文件 | 作用 |
| --- | --- |
| `dist/engine/fengari.mjs` | Lua 5.3 虚拟机（fengari，MIT），由 `local-migration-tools/engine/bundle-fengari.mjs` 打包 |
| `dist/engine/lua-host.mjs` | 装载脚本、注册原生函数、JS↔Lua 值转换 |
| `dist/engine/battle.mjs` | 原生战斗核心的 JS 替身：单位、控制项存储（ProcControl2）、两层属性（UnitGetValue）、Buff（BuffControl）、按 PRIORITY 的触发派发、弹道段（双刀／多段魔法）、伤害流水线 |
| `dist/engine/scenario.mjs` | 计算器调用入口：构造攻击方／目标、回放开局触发、施放技能、汇总每段结果 |
| `dist/engine/report-adapter.mjs` | 读取器入场报告 → 攻击方（入场面板、装备、个性等级、每个流程实例及其运行时参数） |
| `dist/engine/panel.mjs` | 未导入报告时按主数据算局外面板：等级成长 + 觉醒 + 能力盘属性格 + 装备参数（含专属装备参数增减）再过状态计算被动 |
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
- 多段：二刀流（控制 808，防具栏装武器，物理弹道）或多段魔法（控制 825，魔法弹道）时，弹道流程调用两次，两次都按降低后的倍率（6000 = 每次 60%），hitIndex 从 1 起；21/22 触发可改倍率或取消（水王级魔术师对非冰魔法恢复单次全额）。
- LIFETYPE_CONTINUOUS 的控制在其触发再次评估时失效；ChangeBuff(54) 在一次 Buff 变化结束后统一派发一次。
- fengari 整数为 32 位：`bitToBoolean` 以移位重写，其余脚本按原样运行。
- 局外面板（UnitUtil.GetUnitBasicStatus / FillUnitDressParam）：`裸属性 = min + round(max × GROWTH_RATE[lv] / 10000) + Σ觉醒(UnitDressAwakeMst) + Σ已开属性格(UnitDressAbilityPieceMst 类型 10–15)`，PARAMETER_INFO 的 `min-max` 中 max 是成长量而非 100 级值；所有角色 GROWTH_ID=2，Lv120 的成长率 12633 由 4 个已验证角色（洛琪希／魔神梅莉／龙王阿尔克／艾莉丝）六维全部吻合拟合得到，其余等级待读取器 v0.10 导出 GrowthMst。装备参数按 PARAMETER_MAX_INFO（满强化），`EquipParam`(319: 装备种类, 属性, 倍率) 逐件加算后四舍五入（洛琪希之魔杖 INT 365→730、衣服 INT 229→344、MND 116→290），再进入 `floor((裸 + 装备 + Σ值) × (1 + Σ倍率)) + Σ加算`。

## 验证

`tests/engine-panel.test.mjs`：4 个角色的裸属性与网站「最大阶段属性」逐项相等；洛琪希 裸属性 + 专属装备 + 状态计算被动 + 本账号加护 = 读取器入场面板 HP 13,591 / MP 1,018 / STR 1,270 / DEF 1,621 / INT 6,741 / MND 2,808 / CRT 11（逐项相等）。

`tests/engine-roxy.test.mjs`（fixture：`tests/fixtures/roxy-battle-report.json`）：洛琪希入场面板 INT 6,741 → 局内 10,111（EX 光环）→ 12,133（月光II，满血）；DEF 1,621→2,295、MND 2,808→3,482、CRT 11→21 与读取器局内观察一致；异度克里昂 A=14,627/16,650，随机 0.95 核心 11,848，追加段 157,572–175,079（计算器验证值 157,565–175,076，差异来自逐条四舍五入的顺序）。

全角色扫描（268 角色 1,601 招式）无未实现原生函数；仍未模拟：领域展开（Collision）、位置／墙距、多人联机、PvP。

## 已知限制

- 段数（时间轴）不在主数据中，仍取计算器填写值。
- 导入配装报告后按本账号实际配置结算（面板里「配装报告」文件框，存于浏览器本地）；未导入时按全部自带技能 + 专属武器／防具满强化 + 本账号加护（`dist/account-blessings.mjs` 的读取值）。圣物加成、装备强化等级（报告未含时按满级）仍未计。
- Lv100／120 以外的等级成长率、装备中间强化等级为估算（面板会标注），读取器 v0.10 导出 GrowthMst / ItemEquipParameterGrowthMst 后改为精确值。
- 加护数值随账号等级变化，报告或账号加护记录里的运行时参数才是真实值。
