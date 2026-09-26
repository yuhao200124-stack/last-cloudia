import {blockedCombatModes} from './combat-modes.mjs?v=20260926-skill-coverage';
import {criticalDamageEffect} from './critical-options.mjs?v=20260926-skill-coverage';

// Use evaluated rules for the selected move, element and enemy. A description
// can mention several bonuses which do not apply to the current hit.
export function scenarioBonuses(report,{group='all',disabledCommonIds=[]}={}){
 const metrics=new Map(),seen=new Set(),disabled=new Set(disabledCommonIds);
 if(!report?.rows)return [];
 for(const row of report.rows){
  if(row.status!=='active'||group==='common'&&!row.sourceId.startsWith('loadout:')||group==='native'&&(row.sourceId.startsWith('loadout:')||!['traits','equipment','exclusive','common','transcend','blessings'].includes(row.group)))continue;
  if(row.sourceId.startsWith('loadout:')&&disabled.has(row.sourceId.slice(8)))continue;
  for(const [index,effect] of row.rule.effects.entries()){
   if(!['damage','cap'].includes(effect.type)||!Number.isFinite(effect.value)||blockedCombatModes(effect,row.rule.conditions,report.context,row.rule.effects).length)continue;
   if(criticalDamageEffect(effect,row.rule.conditions)&&report.context.criticalEnabled===false)continue;
   const key=`${row.sourceId}:${row.rule.id}:${row.effectIndices?.[index]??index}`;
   if(seen.has(key))continue;seen.add(key);
   const metric=effect.target||'伤害',unit=effect.unit||'',type=effect.type;
   const label=type==='cap'&&!metric.includes('上限')?`${metric}上限`:metric;
   const bucketKey=`${type}:${label}:${unit}`;
   const bucket=metrics.get(bucketKey)||{key:bucketKey,type,label,unit,value:0,sources:[]};
   bucket.value+=effect.value;
   bucket.sources.push({name:row.sourceName,text:row.sourceText||'',value:effect.value,hidden:row.group==='blessings'});
   metrics.set(bucketKey,bucket);
  }
 }
 return [...metrics.values()];
}
