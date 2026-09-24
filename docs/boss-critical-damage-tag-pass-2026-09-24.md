# Boss暴击伤害与龙觉醒归类（2026-09-24，最新接续）

用户明确要求：“做boss暴伤还有把龙觉醒放到boss物理伤害”。沿用第109版0e42a48b8b9be5603a1f3a0e25bd9e59be84c5ce及原Boss分组页。

## Boss暴击伤害增加

从全库935个唯一技能的原文和补充说明中核对Boss／首领／头目与暴击／暴伤相关词条。只有锐利一击1289（e3085e506db3fa44）符合：对Boss的暴击伤害+10%。暴击率、赋予暴击资格、普通／属性／弱点／方位暴伤、仅暴击上限等均不混入。

新增Boss暴击伤害增加标签，放在原Boss页的第六个子分类。目标为Boss与实际发生暴击属于该完整词条内在范围，由此标签覆盖；不提高暴击率，不赋予魔法暴击资格。对Boss暴击伤害上限+2,000是另一条未处理效果，所以锐利一击仍为部分判断。

机器可读范围：relation=boss-critical-damage-increase；scope={boss:true,criticalOnly:true}。沿用历史稳定片段ID，不恢复以前错误的宽泛Boss伤害标签。

## 用户指定龙觉醒放入Boss物理列表

龙觉醒1883（86c11809d76a7959）原文为“类型追加龙；Boss Wave中攻击力+20%”。用户明确指定本条归入Boss物理伤害，因此在此列表加入它，同时保留原攻击力标签与同一个技能ID。

本条是明确指定的属性关联项，不改变伤害计算含义：

- tagDetails中标为groupingOnly=true、relation=boss-wave-attribute-change、scope={bossWave:true,stat:STR}。
- 摘要明确显示“Boss Wave中，攻击力+20%（属性加成）”。
- 与攻击力标签指向同一个attack片段及已有basic规则，不能重复计入攻击力，更不能作为物理伤害直接+20%。
- 本次只归类，不完成类型追加或Boss Wave条件；原remainingEffects、remainingConditions和部分判断状态保留。
- docs/boss-physical-damage-tag-registry.json的userRequestedGroupingIds仅包含龙觉醒。不要据此自动把941等其它Boss Wave属性技能也放入此类。

原技能描述、基础属性计算规则和计算器公式不变；本页标签仍为metadata，numericEffectInjection=false。

## 当前数量

| Boss子分类 | 唯一技能 | 完整 | 部分 |
| --- | ---: | ---: | ---: |
| Boss伤害增加 | 1 | 0 | 1 |
| Boss魔法伤害增加 | 4 | 1 | 3 |
| Boss物理伤害增加 | 2 | 0 | 2 |
| Boss特技伤害增加 | 4 | 1 | 3 |
| Boss必杀伤害增加 | 5 | 1 | 4 |
| Boss暴击伤害增加 | 1 | 0 | 1 |
| Boss页合计（去重） | 13 | 2 | 11 |

Boss物理列表现为调查兵团、龙觉醒。各子类成员数相加17，去重13。全站累计281个已贴标签唯一技能，完整46、部分235、无法判断0。原库仍935个。

## 页面与验证

默认Boss总览?tag=boss保持。Boss暴伤可用?tag=boss-critical-damage；龙觉醒位于?tag=boss-physical-damage。六个子分类仍集中在同一Boss页，连同“全部Boss增伤”共有七个子页签。白底黑字、判断列颜色、按完成程度排序、搜索与存档读取保持。

48项相关检查通过。攻击力旧测试的标签白名单按本次明确指定，只给龙觉醒加入Boss物理归类例外；复测已通过。验证包括全库来源、暴伤与暴击率／资格／上限区分、龙觉醒不产生物理伤害倍率、不重复覆盖／重复计数、原待判断项保留、页面子分类与累计计数、原始数据和存档保留。未执行真实浏览器视觉测试。

后续优先沿用本条用户指定，其余完整词条分类规则仍有效。继续从全库查找用户指定的新类别，不以281个已贴标签记录代替全部候选。
