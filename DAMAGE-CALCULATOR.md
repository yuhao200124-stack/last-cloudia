# 手动伤害计算器

入口：`dist/damage-calculator.html`。静态 ES modules，无外部依赖。页面与旧版配装估算分开，保留配装已有功能。

实现依据：用户提供版本的 GameAssembly.dll、process.lua、procCondCommon.lua、luaCommon.lua；研究结论见当前工作区 LastCloudia-General-Damage-Formula.md v2。无在线攻略拟合常数。

- CalcDamage RVA 0x1840290：普通 k=10，暴击 k=6，float32 核心 A × powf(0.9,kF/A) × Q × U，随机 U=0.9～1.0，截断整数。
- BuffAddMul.Calc 0x18237F0：floor((S+add)(1+mul/10000)+postAdd)。输入战斗攻击已包含面板增益。
- Eris S1 process10001 `[0,5180,3340]`：技能内 EditSTR +51.8%，每段系数 0.334；8 段。3805 → 5775。默认无其他伤害增益，无拟合补偿。
- 原生特攻 0x185DE00：匹配本次实际已生效的种族特攻后 1.5 × (1+修正和)，多种族不会重复乘基础特攻。
- 原生攻击/受击侧增伤 0x185F850、减伤 0x1860E10：仅输入合并后保留的有效项。
- Break 0x185C92C：Boss 且 Break，默认防御 ×0.5，与手动当前降防值独立。
- 后置 EditDamagePer：逐条 max(floor(D(1+p/10000)+0.5),1)。用户填写已确认生效、未被覆盖的效果，列表顺序代表实际执行顺序。
- DmgRatio 在核心整数后、Lua 修正前；guard 在后置被动后；每段 cap 在 guard 后。免疫保持零。

范围：PvE 普通物理/魔法、同参数各段。支持手动种族特攻、属性抗性、条件增减伤、核心前原生条目、暴击、格挡、上限。输入每段最终上限，不再推导装备上限。仅手动声明条件，不声称识别所有游戏技能 ID 或 Buff 覆盖关系。

边界：未自动处理护盾、保命、帧内无敌、Boss 专属脚本；未实现 FatalBlow、固定、简易、追加、即死、竞技场路径。混合属性技能须先提供已构造的结算攻击，不自动把 STR 和 INT 平均。不同参数的各段应分别计算。默认种族空白，不按 Boss 名推断种族。默认总暴击率 20% 仅为可编辑测试起点。

浮点精度：JS Math.fround 模拟主要原生 float32 步骤，Math.pow 后转 float32 并不保证与所有平台 powf 最后 1 ulp 完全一致。结果是条件伤害范围，非下一次命中预测。期望值使用 1024 点确定性中点积分，按均匀随机假设，先完成每段限额再求暴击加权期望。

核验：`node --test tests/damage-engine.test.mjs`，`node --check dist/damage-calculator.mjs`。静态托管项目无兼容的受管开发服务器；未进行浏览器视觉验收。
