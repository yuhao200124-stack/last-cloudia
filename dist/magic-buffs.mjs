import {projectAttackLayers} from './attack-layers.mjs?v=20260924-combat-modes';
import {SUPPORT_BUFFS,normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-combat-modes';
const normalized=s=>String(s||'').replace(/\s|[,，。、]/g,'').replaceAll('＋','+');
export function magicBuffOptions(profile) {
 return SUPPORT_BUFFS.flatMap(def=>{
  const spell=(profile?.magic||[]).find(m=>normalized(m.name)===normalized(def.name)&&normalized(m.description)===normalized(def.description));
  return spell?[{...def,source:'角色页面'}]:[];
 });
}
export function selectedMagicBuffs(options,selection) {return options.filter(b=>selection[b.id]===true);}
export function magicBuffCap(buffs,skillType,references=[]) {
 if(skillType!=='magic')return 0;
 return buffs.reduce((n,b)=>n+(references.some(r=>r.source===b.name&&r.effect?.type==='cap'&&r.effect.target==='魔法伤害上限'&&r.effect.value===b.cap)?0:b.cap),0);
}
export function magicBuffLayer(stat,panel,buffs) {
 if(!buffs.length)return null;
 if(!stat)return {ok:false,reason:'已勾选魔法增益；请先确认状态前属性基准。'};
 const relevant=buffs.filter(b=>b.stat===stat.key);if(!relevant.length)return null;
 const selected=relevant.map(b=>normalizeRuntimeBuff({id:b.id,source:b.name,value:b.statPercent,runtime:b.runtime},stat.key));
 if(selected.some(b=>!b))return {ok:false,reason:'所选增益的分组尚未确认。'};
 return projectAttackLayers(stat,panel,selected);
}
