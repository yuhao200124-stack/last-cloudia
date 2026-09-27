// These flags describe the current scenario, not an automatic event simulator.
// A trigger and a continuous condition have different lifetimes/stacking rules.
export const STAT_CONDITIONS = Object.freeze({
 conditionBuffActive:{label:'条件BUFF',kind:'buff'},
 openingBuffActive:{label:'开场Buff（40秒内）',kind:'buff'},
 awakeningBuffActive:{label:'觉醒Buff（触发后40秒）',kind:'buff'},
 magicAwakeningBuffActive:{label:'魔导觉醒Buff（触发后40秒）',kind:'buff'},
 ultimateUsedBuffActive:{label:'使用必杀后Buff（40秒内）',kind:'buff',deferred:true},
 damageTakenBuffActive:{label:'受到伤害时',kind:'buff',deferred:true},
 reviveBuffActive:{label:'复活Buff（40秒内）',kind:'buff',deferred:true},
 realSunday:{label:'现实时间为周日',kind:'conditional-passive',deferred:true},
 ultimateGaugeFull:{label:'必杀槽满',kind:'conditional-passive',deferred:true},
 // Event buffs split by the game's own trigger (ProcessCondMst): each is a separate scenario switch.
 allyDownBuffActive:{label:'队友倒下后Buff',kind:'buff',deferred:true},
 killBuffActive:{label:'击败敌人后Buff',kind:'buff',deferred:true},
 enemyUltimateBuffActive:{label:'敌人发动必杀后Buff',kind:'buff',deferred:true},
 timedBuffActive:{label:'战斗经过一段时间后（定时/随时间）',kind:'buff',deferred:true},
 partyConditionActive:{label:'队伍（编成、存活人数、指定队友存活）',kind:'conditional-passive',deferred:true},
 otherConditionActive:{label:'其他条件（概率触发、移动中等）',kind:'buff',deferred:true},
 permanentBuffActive:{label:'永久获得的BUFF（自动X、EX灵气等）',kind:'buff',deferred:true},
 mpFull:{label:'MP满',kind:'conditional-passive',deferred:true},
 mpLow:{label:'MP≤20',kind:'conditional-passive',deferred:true},
 guardBuffActive:{label:'自身格挡',kind:'buff',deferred:true},
 selfStateActive:{label:'自身状态（必杀槽满、身上有指定BUFF、异常、移动中、特技储存满）',kind:'conditional-passive',deferred:true},
});
export const STAT_CONDITION_FIELDS = Object.freeze(Object.keys(STAT_CONDITIONS));
export const CONDITION_BUFF_FIELDS = Object.freeze(['ultimateUsedBuffActive','damageTakenBuffActive','allyDownBuffActive','killBuffActive','enemyUltimateBuffActive','timedBuffActive']);
// In-battle switches shown in the calculator; each one also covers the listed detail fields.
export const SWITCH_GROUPS = Object.freeze({lowHp:['awakeningBuffActive','magicAwakeningBuffActive'],openingBuffActive:['realSunday','permanentBuffActive'],conditionBuffActive:CONDITION_BUFF_FIELDS,selfStateActive:['ultimateGaugeFull','ground']});
export const STAT_CONDITION_DEFAULTS = Object.freeze(Object.fromEntries(STAT_CONDITION_FIELDS.map(f=>[f,f==='permanentBuffActive'])));
export const STAT_CONDITION_ACTIVE = Object.freeze(Object.fromEntries(STAT_CONDITION_FIELDS.map(f=>[f,true])));
export const pickStatConditions = source => Object.fromEntries(STAT_CONDITION_FIELDS.map(f=>[f,source?.[f]===true]));
// permanentBuffActive only decides whether the rule is selected at all; observed-panel matching keeps the older lifetime handling.
export const statActivationCondition = rule => rule.conditions?.find(c=>STAT_CONDITION_FIELDS.includes(c.field)&&c.field!=='permanentBuffActive');
