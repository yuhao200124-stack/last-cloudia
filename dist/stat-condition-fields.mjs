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
});
export const STAT_CONDITION_FIELDS = Object.freeze(Object.keys(STAT_CONDITIONS));
export const CONDITION_BUFF_FIELDS = Object.freeze(['awakeningBuffActive','magicAwakeningBuffActive','ultimateUsedBuffActive','damageTakenBuffActive','reviveBuffActive','ultimateGaugeFull']);
export const STAT_CONDITION_DEFAULTS = Object.freeze(Object.fromEntries(STAT_CONDITION_FIELDS.map(f=>[f,false])));
export const STAT_CONDITION_ACTIVE = Object.freeze(Object.fromEntries(STAT_CONDITION_FIELDS.map(f=>[f,true])));
export const pickStatConditions = source => Object.fromEntries(STAT_CONDITION_FIELDS.map(f=>[f,source?.[f]===true]));
export const statActivationCondition = rule => rule.conditions?.find(c=>STAT_CONDITION_FIELDS.includes(c.field));
