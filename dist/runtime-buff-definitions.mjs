// Shared status definitions. Membership in a group must be established from
// source data or an explicit user confirmation, never from a common stat name.
export const RUNTIME_FAMILIES=Object.freeze({
 'ex-aura':{stat:'intelligence',value:50,layer:'runtime-stat',stackGroup:'int-magic-buff',stackPolicy:'exclusive',evidence:'native-layer; user-confirmed-group-2026-09-24'},
 'moonlight-ii':{stat:'intelligence',value:30,layer:'runtime-stat',stackGroup:'full-hp-int-passive',stackPolicy:'add',evidence:'native-hp-condition'},
});
export const SUPPORT_BUFFS=Object.freeze([
 {id:'magic-guidance',name:'魔术指导',description:'为一名我方单位赋予INT+65%、魔法伤害上限+30,000的增益',statPercent:65,stat:'intelligence',cap:30000,label:'法强 +65%；魔法伤害上限 +30,000',runtime:{layer:'runtime-stat',stackGroup:'int-magic-buff',stackPolicy:'exclusive',evidence:'user-confirmed-replacement-2026-09-24'},scope:'profile-spell'},
]);
export function normalizeRuntimeBuff(buff,stat) {
 const known=RUNTIME_FAMILIES[buff.family];
 const runtime=buff.runtime||(known?.value===buff.value&&known.stat===stat?known:null);
 if(!runtime||runtime.layer!=='runtime-stat'||!['exclusive','add'].includes(runtime.stackPolicy)||typeof runtime.stackGroup!=='string'||!runtime.stackGroup||!runtime.evidence||!Number.isFinite(buff.value))return null;
 return {...buff,stat,runtime};
}
