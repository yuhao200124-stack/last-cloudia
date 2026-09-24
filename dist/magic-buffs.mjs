import {resolveAttackLayers,attackLayerData} from './attack-layers.mjs?v=20260924-buff-groups';
import {SUPPORT_BUFFS,normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-buff-groups';
import {combineRuntimeBuffs,runtimeStates} from './runtime-buff-engine.mjs?v=20260924-buff-groups';
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
 const data=attackLayerData(stat);if(!data.ok)return data;
 const selected=relevant.map(b=>normalizeRuntimeBuff({id:b.id,source:b.name,value:b.statPercent,runtime:b.runtime},stat.key));
 if(selected.some(b=>!b))return {ok:false,reason:'所选增益的分组尚未确认。'};
 // One status per exclusive group. Existing post-cast observations are reused;
 // incoming statuses replace their group, independently of character identity.
 const observed=runtimeStates(data.base,data.buffs,selected).filter(s=>s.panel===panel);
 if(observed.length===1)return {ok:true,...observed[0],buffObserved:true};
 const before=resolveAttackLayers(stat,panel);if(!before.ok)return before;
 const combined=combineRuntimeBuffs(before.active,selected);if(!combined.ok)return combined;
 return {ok:true,...combined,base:data.base,panel:Math.floor(data.base*(100+combined.percent)/100),inactive:[...before.inactive,...combined.replaced],projected:true,observedPanel:panel};
}
