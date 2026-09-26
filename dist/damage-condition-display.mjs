import {CONDITION_BUFF_FIELDS} from './stat-condition-fields.mjs';

export const GENERAL_CONDITIONS={fullHp:['fullHp'],lowHp:['lowHp'],air:['air'],back:['back'],ailment:['ailment'],ground:['ground'],openingBuffActive:['openingBuffActive'],conditionBuffActive:CONDITION_BUFF_FIELDS};

export function weakElementFromBoss(element,resistance,correction=0){
 if(!element||element==='无'||resistance===''||resistance==null)return false;
 const raw=Number(resistance),offset=Number(correction);
 return Number.isFinite(raw)&&Number.isFinite(offset)&&raw+offset<0;
}

export function activeConditionSources(report,control){
 const fields=GENERAL_CONDITIONS[control]||[];
 if(!fields.length)return [];
 const unique=new Map();
 for(const row of report?.rows||[]){
  if(row.status!=='active'||!row.rule?.effects?.length)continue;
  if(!row.rule.conditions?.some(condition=>fields.includes(condition.field)&&condition.value===true&&condition.op==='eq'))continue;
  const key=row.sourceId||row.sourceName;
  if(!unique.has(key))unique.set(key,{name:row.sourceName,text:row.sourceText||row.rule.text||row.rule.effects.map(e=>`${e.target||e.type} +${e.value??''}${e.unit||''}`).join('、')});
 }
 return [...unique.values()];
}

export function keepsObservedPanel(previous,next){
 return !!previous&&!!next&&Object.keys({...previous,...next}).every(key=>
  ['fullHp','lowHp','weakness'].includes(key)||JSON.stringify(previous[key])===JSON.stringify(next[key]));
}
