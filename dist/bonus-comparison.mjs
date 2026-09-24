import {evaluateCatalog} from './effect-rule-engine.mjs';
import {criticalDamageEffect} from './critical-options.mjs?v=20260924-fullpage';
import {decisionKey} from './entry-preparation.mjs?v=20260924-fullpage';
const numeric=value=>typeof value==='number'&&Number.isFinite(value);
export const effectSelectionKey=row=>JSON.stringify([row.id,row.effect,row.condition]);
const groupKey=e=>JSON.stringify([e.type,e.target,e.unit,...(e.criticalOnly?['critical']:[])]);
const comparable=e=>['damage','cap','critRate','killerPower'].includes(e.type)&&numeric(e.value);
const elements=['none','fire','ice','earth','thunder','light','dark'];
const elementNames=['无','火','冰','树','雷','光','暗'];
const sum=values=>Math.round(values.reduce((a,b)=>a+b,0)*1e8)/1e8;
function qualifies(conditions,context) {
 const row=evaluateCatalog([{id:'reader',group:'common',rules:[{id:'reader',conditions,effects:[{type:'utility'}],review:'ready'}]}],context).rows[0];
 return row.status==='active';
}
function readerConditions(b,matches) {
 if(Array.isArray(b.decoded?.conditions))return b.decoded.conditions;
 if(Array.isArray(b.conditions))return b.conditions;
 // Same known configuration as elemental account blessings, irrespective of source ID.
 // This decodes a configuration candidate; it does not assert application to a hit.
 const p=b.raw?.values,r=b.raw;
 if(b.processId===1050450&&b.conditionId===27001&&r?.function==='process1050450'&&r.trigger===27&&r.parameterMeaningRecognized===true&&
  JSON.stringify(r.conditionParams)==='[1,1,0,1,3]'&&Array.isArray(p)&&p.length===10&&p.every(Number.isFinite)&&Number.isInteger(p[0])&&elements[p[0]]&&p.slice(2).every(v=>v===0)&&
  b.effectType==='damage'&&b.target===`${elementNames[p[0]]}属性伤害`&&b.unit==='%'&&b.value===p[1]/100)return [{field:'element',op:'eq',value:elements[p[0]]}];
 // An explicitly mapped source follows its corresponding website conditions, labelled as such.
 if(matches.length===1&&matches[0].compatible)return matches[0].condition;
 return null;
}

/** Totals of like-labelled bonuses, not a combined damage multiplier. Missing != zero. */
export function buildBonusComparison(compared,bonuses,context,{removed={},decisions={}}={}) {
 const groups=new Map();
 const get=e=>{const id=groupKey(e);if(!groups.has(id))groups.set(id,{id,type:e.type,target:e.target,unit:e.unit,criticalOnly:!!e.criticalOnly,web:[],reader:[],removed:[]});return groups.get(id);};
 for(const row of compared)if(comparable(row.effect)){
  const g=get({...row.effect,criticalOnly:criticalDamageEffect(row.effect,row.condition)});(removed[effectSelectionKey(row)]||decisions[decisionKey(row)]?.choice==='exclude'?g.removed:g.web).push(row);
 }
 const seen=new Set();
 for(const b of bonuses||[]){
  const e={type:b.effectType,target:b.target,value:b.value,unit:b.unit||'',criticalOnly:b.criticalOnly===true};
  e.criticalOnly=criticalDamageEffect(e,[...(b.decoded?.conditions||[]),...(b.decoded?.triggerConditions||[])]);
  if(!comparable(e)||seen.has(b.id)||b.optionExcludedReason||['inactive','disabled','removed'].includes(b.state)||b.raw?.buffRemoved===1||b.raw?.buffIgnored===1||b.raw?.buffEnabled===0)continue;
  const matches=compared.filter(r=>r.reader?.id===b.id),conditions=readerConditions(b,matches);
  if(!conditions||!qualifies(conditions,context))continue;
  seen.add(b.id);get(e).reader.push({...b,conditions,websiteCondition:!b.decoded?.conditions&&!b.conditions&&b.processId!==1050450});
 }
 return [...groups.values()].map(g=>{
  const total=sum(g.web.map(r=>r.effect.value)),readTotal=g.reader.length?sum(g.reader.map(r=>r.value)):null;
  const ids=g.web.map(r=>r.compatible?r.reader?.id:null);
  const fullyMapped=g.web.length>0&&ids.every(Boolean)&&new Set(ids).size===ids.length&&ids.length===g.reader.length&&g.reader.every(r=>ids.includes(r.id));
  const choices=g.web.map(r=>decisions[decisionKey(r)]?.choice||'pending');
  const choice=choices.length&&choices.every(c=>c===choices[0])?choices[0]:'pending';
  const candidate=g.reader.some(r=>r.state!=='observed');
  return {...g,total,readTotal,fullyMapped,canUseReader:fullyMapped,choice,candidate,
   difference:readTotal==null?null:Math.round((total-readTotal)*1e8)/1e8};
 }).filter(g=>g.web.length||g.reader.length);
}
