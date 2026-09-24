import {STAT_CONDITIONS} from './stat-condition-fields.mjs?v=20260924-condition-tags';
// Generic combat modes. Character ownership and attack/equipment conditions
// remain in the configured rules; a mode never grants an unconfigured skill.
export const MODE_LABELS={critical:'暴击',killer:'特攻',fullHp:'满血',lowHp:'濒死',...Object.fromEntries(Object.entries(STAT_CONDITIONS).map(([field,{label}])=>[field,label])),break:'break'};
export const requiresTrue=(conditions,field)=>(conditions||[]).some(c=>c.field===field&&(
 c.op==='eq'&&c.value===true||c.op==='in'&&Array.isArray(c.value)&&c.value.length===1&&c.value[0]===true||
 c.op==='notIn'&&Array.isArray(c.value)&&c.value.includes(false)&&!c.value.includes(true)));
export function effectCombatModes(effect,conditions=[],bundle=[effect]) {
 const modes=new Set(Object.keys(MODE_LABELS).filter(field=>requiresTrue(conditions,field)));
 const target=String(effect.target||''),combat=['damage','cap'].includes(effect.type);
 if(['critPermission','critRate'].includes(effect.type)||combat&&(effect.criticalOnly===true||target.includes('暴击'))||bundle.some(e=>e.type==='critPermission'))modes.add('critical');
 if(['killer','killerPower'].includes(effect.type)||combat&&target.includes('特攻'))modes.add('killer');
 if(combat&&/break/i.test(target))modes.add('break');
 return [...modes];
}
export function modeValue(context,mode) {
 if(mode==='critical')return context.criticalEnabled;
 if(mode==='killer'&&typeof context.killerOverride==='boolean')return context.killerOverride;
 return context[mode];
}
export const blockedCombatModes=(effect,conditions,context,bundle)=>effectCombatModes(effect,conditions,bundle).filter(mode=>modeValue(context,mode)===false);
