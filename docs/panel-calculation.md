# 战斗面板计算顺序与原生证据

核验日期：2026-09-24。本文只说明六维面板计算，不是完整伤害公式。

证据来自本次会话提供的 `GameAssembly.dll`、对应元数据、导出的 Lua 脚本，以及洛琪希入场报告。以下 RVA 均相对于这份 DLL；不能直接用于其它版本。原始研究文件位于仓库外的 `reverse_damage/`，没有复制游戏二进制到本仓库。

## 结论和适用范围

当前可确认的主顺序为：

1. 先计算各装备自身的属性强化，并分别取整。
2. 把修正后的装备数值加入角色基础值。
3. 应用同层的常驻属性修改，包括已经确认生效的普通属性技能与加护属性；得到已取整的常驻面板。
4. 按脚本规定的参照阶段产生开场转换效果，例如知识之壁引用实时 Buff 前的 INT。
5. 在常驻面板上另行计算实时属性修改，生成最终战斗面板。

不能把装备自身强化、常驻属性百分比、实时 Buff 百分比全部加在同一个百分比里。也不能仅凭报告中存在某条候选效果，就当成它已经执行。报告里的 `state: candidate` 仍需要条件判断或用户确认。

## 1. 装备自身强化：float32 与 .5 取偶数

`UnitUtil.AddEquipParameter`（RVA `0x115F530`）读取装备的固定属性与装备修改记录：

- `0x115F7C1–0x115F7D0`：将匹配装备类型、属性类型的倍率增量累加。
- `0x115F88A–0x115F897`：用单精度浮点指令将装备数值乘以 `1 + 累计倍率增量`。
- `0x115F89B`：调用整数舍入函数 `0x709BC0`。
- 随后才将修正后的装备属性逐项加入目标 `StatusParam`。

`0x709BC0` 将输入的 float32 转成 double 后判断小数部分；正好为 `.5` 时检查整数奇偶，取最近的偶数。因此这里是 **round to nearest, ties to even**，不是向上取整，也不是 JavaScript 的 `Math.round`。

| 输入 | 装备阶段结果 |
| --- | ---: |
| `229 × 1.5 = 343.5` | 344 |
| `227 × 1.5 = 340.5` | 340 |
| `365 × 2` | 730 |
| `116 × (1 + 0.5 + 1)` | 290 |

实现需要保留单精度运算边界，例如使用 `Math.fround` 模拟原生的倍率累计和最终乘法。对同一件装备同一属性的 `+50%` 与 `+100%`，这里是 `×(1 + 0.5 + 1)`；不能改成 `×1.5×2`。应对每件装备的每项属性分别完成此阶段，再相加。

## 2. 常驻属性与加护属性层

`BattleUnitStatus.CalcUnitStatus2`（RVA `0x17C3580`）提供了明确顺序：

- `0x17C3807`：把 `EquipStatus`（字段 `+0x138`）加入 `UnitStatus`（`+0x6A0`）。
- `0x17C381D`：对 `UnitAddMuls`（`+0x1C8`）调用 `ProcStatus.EvaluateAddMuls`。
- 计算结果随后复制成 `BattleStatus.Status`（整体字段 `+0x740`）。

`ProcStatus.EvaluateAddMuls`（RVA `0x1833650`）先合并本层修改，再对六维逐项调用 `BuffAddMul.Calc`（RVA `0x18237F0`）。六维调用位置为：

| 属性 | 调用 RVA |
| --- | --- |
| HP | `0x18337D1` |
| MP | `0x1833845` |
| ATK | `0x18338CA` |
| DEF | `0x1833948` |
| INT | `0x18339C6` |
| MND | `0x1833A44` |

`BuffAddMul.Calc` 的原生运算为：

```text
result = floor((baseValue + add) × (1 + mul × 0.0001) + postAdd)
```

`mul` 是万分单位；`1500` 表示 `15%`。原生先用 double 乘 `0.0001`、加 `1`，然后计算乘积与 `postAdd`，最后向下取整。`add` 和 `postAdd` 所处阶段不同，不能丢掉这个区别。

对于本次已确认的普通百分比和加护百分比，可在常驻层相加；例如洛琪希 INT 的合计为 `88%`。这里的「加护」是已经由用户和控制报告确认的来源分类；不是依据所有 `6000xxxx` 编号直接推断。原生属性修改本身按字段与操作处理，不要求给加护额外添加一层乘法。

有分组、覆盖、条件或不同操作类型的效果，不应仅凭文本里写着百分比就并入这个合计。

## 3. MP 使用千分单位

MP 在战斗结构中不是显示整数，而是千分单位的整数。

`BattleUiUnit.ApplyMp`（RVA `0x1690AE0`）：

- `0x1690B0C` 调用 `BattleUnitStatus.GetMp`。
- 其后 `0x1690B13` 开始的整数运算将当前 MP 除以 `1000`。
- `0x1690B53` 读取最终最大 MP 后执行相同的除法，再交给 UI 缓存和显示。

`GetMp` 读取战斗结构中的整数；`CryptedInt.get_value` 只做解码，不负责单位换算。

因此 v0.35 报告中的示例应解释为：

| 报告原始 MP | 内部 MP 数值 | 游戏显示整数 |
| ---: | ---: | ---: |
| 1018970 | 1018.970 | 1018 |
| 500580 | 500.580 | 500 |

计算时保留千分单位，在每层调用对应的整数计算；显示时再除以 `1000` 并截断。不要先把 `1018.970` 截成 `1018` 后再继续应用后续 MP 百分比。旧报告单位迁移应依据明确的读取器版本和字段约定，不用数值大小猜测单位。

## 4. 知识之壁：引用 PureINT，然后生成固定加值

本次洛琪希报告的来源 `localId=28607`，过程 `1030206`，原始参数为：

```text
[0, -1000, 10000, 3, 5, 0, 1, 0, 0, 0]
```

`scripts_v31/process.lua:12411` 的 `process1030206`：

```lua
val = params[1] + ((this:PureINT() + params[1]) * params[2] / Pct100)
if params[7] == 0 then this:EditINT(TARGSTAT_REAL, round(val), 0) end
-- 目标为 DEF、MND 时分别执行：
this:EditDEF(TARGSTAT_REAL, round(-val * params[3] * Per2Num), 0)
this:EditMND(TARGSTAT_REAL, round(-val * params[3] * Per2Num), 0)
```

本组参数使 `val = -PureINT × 10%`；`params[7] = 1`，因此不扣除 INT，向 DEF 和 MND 各添加正值。

参照阶段有脚本和原生双重依据：

- `luaCommon.lua:4418`：`Unit:PureINT()` 读取 `c.GetUnitPureStatus`。
- `luaCommon.lua:3456`：该接口调用 `UnitGetValue(unit, stat, true, false)`。
- 原生 `BattleAIBaseLuaExecuter.UnitGetValue`（RVA `0x14F9AB0`）在 `0x14F9C60` 调用的签名确认参数为 `real=true, finalStatus=false`。
- `ProcStatus.GetMaxStatus`（RVA `0x1834040`）在 `finalStatus=false` 时读取 `Status`（结构内 `+0x10`）；只有 `true` 才计算并读取 `FinalStatus`（`+0x94`）。

所以知识之壁引用已经计入装备和常驻加成、但尚未计入实时 Buff 的 INT。不能用 EX 灵气后的 INT 再计算一次。

此脚本的 `round` 定义在 `luaCommon.lua:2814`：

```lua
function round(val)
  return math.floor(val + 0.5)
end
```

它与装备的 .5 取偶数不同。洛琪希得到 `floor(6741 × 0.1 + 0.5) = 674`。

`EditDEF/INT/MND` 的参数顺序是 `add, mul, postAdd`。知识之壁产生的是实时层的 `add`，不是最后无条件追加的 `postAdd`；如果以后还有同层 DEF/MND 百分比，必须遵守 `(base + add) × multiplier + postAdd` 的位置。

## 5. 实时属性层与 EX 灵气

`BattleUnitStatus.CalcBattleStatus`（RVA `0x17C0AA0`）在 `0x17C0EB5` 收集 `bankFlag=2` 的实时属性效果，并合并相应的战斗属性修改、Buff 和 Debuff。

`ProcStatus.CalcFinalStatus`（RVA `0x1832B60`）：

- `0x1832C15`：将已经计算好的 `Status` 复制到 `FinalStatus`。
- `0x1832C35`：对最终层再次调用 `EvaluateAddMuls`。
- 随后执行属性限制处理。

因此常驻层和实时层分别取整。本次只有相应百分比时，可写为：

```text
常驻属性 = floor((角色基础 + 修正后装备) × (1 + 常驻百分比))
最终属性 = floor((常驻属性 + 实时 add) × (1 + 实时 mul/10000) + 实时 postAdd)
```

EX 灵气候选 `localId=55784` 对应 `process2030206`，参数 `[0,5000,2]`。`process.lua:31934` 创建 `BuffIds.E_IntEdit`，参数 `[-1,0,5000]`；`luaCommon.lua:744` 确认该 Buff ID 为 `30202`。该 Buff 的创建与后续执行有时间顺序，首个入场快照可能早于它的生效时刻。

对于本次 EX 灵气，结果是 `floor(6741 × 1.5) = 10111`，不是把 `50%` 加进前一层的 `88%`。

### 满血与类似 HP 条件机制（2026-09-24 修正）

月光 II 不属于常驻 INT+30%。它是每 Wave 开始、其后 HP 变化时判断的实时加成；满血生效，离开满血条件后不再计入，恢复满血后重新计入。不是必须先受伤才启动，也不是只在入场时固定一次。

证据链：

- 入场报告 `localId=26505`、`process1030201`、`conditionId=40002`、trigger40、原始参数 `[1,10000,0,3000]`。
- `procCondCommon.lua` 的 trigger40 是 ChangeHP；`process.lua:12350` 执行 `EditINT(TARGSTAT_REAL, 0, 3000, 0, LIFETYPE_CONTINUOUS)`。
- `BattleUnitStatus` 静态构造 RVA `0x17D1190` 创建的 `WaveStartTriggers` 数组包含40；`OnWaveStart`（`0x17C93B0`）通过 `0x17C9994` 调用这批被动检查。
- `LIFETYPE_CONTINUOUS=3` 是过程控制方法。`Trigger2Life`（`0x1869F10`，分支 `0x1869FA7`）将它映射到 `LifeType.Status=5`，不是永久效果。
- 月光原始 ActiveParam 的 BuffGroup 为0。`SafeGetBuffGroup → EvaluateBuffProcess → SetEditParam` 将组号带入修改记录。
- `CombineAddMuls(List)`（`0x1824EF0`）在 `0x1825308–0x1825319` 对 Add/Mul/PostAdd 分别做整数加法。因此月光3000与已生效 EX 的5000可相加，得到实时倍率8000。

满血的正确 INT 顺序为：

```text
入场前 = floor((2512 + 730 + 344) × 1.88) = 6741
战斗满血且 EX 生效 = floor(6741 × (1 + 0.30 + 0.50)) = 12133
非满血且 EX 生效 = floor(6741 × 1.50) = 10111
满血但 EX 未生效 = floor(6741 × 1.30) = 8763
```

知识之壁仍引用6741，不能因满血或 EX 变化重新使用最终 INT。旧网站的7817/11725来自把月光30%放入常驻层，现已纠正。

已检查的同类过程：

| 过程 | 作用属性 | 原始参数 |
| --- | --- | --- |
| 1030001 | STR | 方向、HP阈值、add、mul |
| 1030102 | DEF | 方向、HP阈值、add、mul |
| 1030201 | INT | 方向、HP阈值、add、mul |
| 1030301 | MND | 方向、HP阈值、add、mul |
| 1030125 | DEF、MND | 方向、HP阈值、DEF add/mul、MND add/mul |

这些过程都使用 Continuous。报告解码同时要求具体过程函数和 trigger40，保留原始阈值、add/mul和候选状态。读到过程不代表已执行；未知阈值的边界不由网页擅自补全。条件40002的正文尚未导出。

通用文本模板现在识别完整且单纯的“HP全满时，STR/INT/DEF/MND+X%”以及“濒死时，属性+X%”，放入实时属性层。此为描述模板复用，不声称已经逐角色读取其具体过程、Buff组或濒死阈值。例如当前站点角色245的堂堂II可复用满血STR模板。带持续时间、首次、每Wave次数、回复或复合触发的文字不套用这项模板，仍需独立拆分。锐气是暴击率条件，不是面板法强；其具体原始过程尚未由报告确认。

不能只看到 `TARGSTAT_REAL` 就归类为实时：装袍MND+20%的过程1030308同样出现REAL，但触发1属于常驻层。也不能把2030001/2030201这种 HP 触发的限时 Buff 创建过程，当成离开HP阈值就立即失效的维持型效果。1030306是等级插值MND，与HP条件无关。

### 多个实时效果的边界

原生会先对同属性、同非零BuffGroup、同增减益方向的记录择强；比较的是整条 Calc 结果，不是逐字段取最大。组0不参加这种互斥。保留记录随后在同层求和并执行一次取整。

网页目前只自动合并已证实的月光II与EX灵气配对；其它多项 `statBuff` 如果缺乏组与操作资料，继续标记待确认，不随意相加或连乘。单项运行百分比仍按实时层计算。

### 旧记录兼容

`stat-mechanics.mjs` 保存共用规则及机制版本。旧模板、角色草稿、缓存基础报告都经过相同的窄迁移：原文、条件、目标与数值完全符合旧拆分时，将stat改成statBuff并保留ID和开关；自定义拆分不同则保留原值、转为待复核。版本变化使旧面板采用选择失效，手填数值和技能参数保留。原始读取报告不改写。


## 洛琪希控制结果

本组输入：

| 属性 | 角色基础 |
| --- | ---: |
| HP | 10702 |
| MP | 459 |
| ATK | 1222 |
| DEF | 1407 |
| INT | 2512 |
| MND | 1619 |

装备固定值：MP `50 + 80`、INT `365 + 229`、MND `97 + 116`、DEF `167`。本组已确认的装备自身强化为杖 INT `+100%`，袍 INT `+50%`、MND 合计 `+150%`。

| 属性 | 本组计算 | 常驻结果 | 指定开场效果生效后 |
| --- | --- | ---: | ---: |
| HP | `floor(10702 × 1.27)` | 13591 | 13591 |
| MP | `floor((459 + 50 + 80) × 1000 × 1.73)` | 原始1018970；显示1018 | 显示1018 |
| ATK | `floor(1222 × 1.04)` | 1270 | 1270 |
| DEF | `floor((1407 + 167) × 1.03)` | 1621 | 知识之壁后2295 |
| INT | `floor((2512 + roundEven(365×2) + roundEven(229×1.5)) × 1.88)` | 6741 | EX灵气后10111 |
| MND | `floor((1619 + 97 + roundEven(116×2.5)) × 1.40)` | 2808 | 知识之壁后3482 |

本组常驻百分比分解：HP `20% + 7%`；MP `15% + 15% + 20% + 20% + 3%`；ATK `4%`；DEF `3%`；INT `15% + 15% + 20% + 20% + 15% + 3%`；MND `15% + 20% + 5%`。这些是本组配置，不是角色不可修改的常数。

初始报告中 HP13591、MP原始1018970、ATK1270、DEF1621、INT6741、MND2808均可复现。后来观测到的 INT10111 与 DEF2295分别符合 EX 灵气和知识之壁已经生效；MND3482是无其它实时 MND 修改时的同规则计算结果。不能把不同时刻的快照差异自动判成算式错误，也不能借此宣称报告已捕获全部开场效果。

## 建议的回归检查

- 装备 `229×1.5→344` 和 `227×1.5→340`，同时防止误用 ceil 与 Math.round。
- 常驻 INT6741 与实时 EX 后10111，防止合并不同阶段百分比。
- 知识之壁使用6741，不使用10111；其转换采用 `floor(x+0.5)`。
- 知识之壁保留实时 `add` 位置，不能误写为 `postAdd`。
- MP 保留千分单位，在展示时才截断。
- 条件不明、执行状态不明或多 Buff 分组未确认时，保留待确认状态，不自动计入最终结果。
