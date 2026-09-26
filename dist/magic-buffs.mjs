import {MAGIC as MAYLY_MAGIC} from './mayly-data.mjs?v=20260926-mayly';
import {projectAttackLayers} from './attack-layers.mjs?v=20260924-condition-tags';
import {SUPPORT_BUFFS,normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-condition-tags';
const normalized=s=>String(s||'').replace(/\s|[,，。、]/g,'').replaceAll('＋','+');
export const nonDamageMagic=profile=>(profile?.magic||[]).filter(spell=>spell.purpose!=='attack');
export const supportMagicRule=(spell,options)=>options.find(rule=>normalized(rule.name)===normalized(spell.name)&&normalized(rule.description)===normalized(spell.description));
export function magicBuffOptions(profile) {
 return [...SUPPORT_BUFFS,{id:'despair-anima',name:MAYLY_MAGIC.name,description:MAYLY_MAGIC.text,cap:0,resistance:{光:-20,暗:-20},label:'光、暗耐性各 -20；自身存活期间',exclusiveGroup:'anima'}].flatMap(def=>{
  const spell=(profile?.magic||[]).find(m=>normalized(m.name)===normalized(def.name)&&normalized(m.description)===normalized(def.description));
  return spell?[{...def,source:'角色页面'}]:[];
 });
}
export function magicResistance(element,base,buffs=[]){
 if(base===''||base==null||!Number.isFinite(Number(base)))return '';
 return Number(base)+buffs.reduce((total,b)=>total+(Number(b.resistance?.[element])||0),0);
}
export function selectedMagicBuffs(options,selection) {return options.filter(b=>selection[b.id]===true);}
export function magicBuffCap(buffs,skillType,references=[]) {
 if(skillType!=='magic')return 0;
 return buffs.reduce((n,b)=>n+(references.some(r=>r.source===b.name&&r.effect?.type==='cap'&&r.effect.target==='魔法伤害上限'&&r.effect.value===b.cap)?0:b.cap),0);
}
export function magicBuffLayer(stat,panel,buffs) {
 if(!buffs.some(b=>b.stat))return null;
 if(!stat)return {ok:false,reason:'已勾选魔法增益；请先确认状态前属性基准。'};
 const relevant=buffs.filter(b=>b.stat===stat.key);if(!relevant.length)return null;
 const selected=relevant.map(b=>normalizeRuntimeBuff({id:b.id,source:b.name,value:b.statPercent,runtime:b.runtime},stat.key));
 if(selected.some(b=>!b))return {ok:false,reason:'所选增益的分组尚未确认。'};
 return projectAttackLayers(stat,panel,selected);
}
