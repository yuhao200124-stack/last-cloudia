import {effectCombatModes,blockedCombatModes,MODE_LABELS,requiresTrue} from './combat-modes.mjs?v=20260926-skill-coverage';
// A combat-selection switch, not a claim that every hit is a critical hit.
// A permission rule is one skill bundle: its fixed cap is removed with that
// bundle when disabled, but remains a BOTH-branch cap while enabled.
export const requiresCritical=conditions=>requiresTrue(conditions,'critical');
export const criticalEffect=e=>['critPermission','critRate'].includes(e.type)||['damage','cap'].includes(e.type)&&(e.criticalOnly===true||String(e.target).includes('暴击'));
export const criticalDamageEffect=(e,conditions=[])=>['damage','cap'].includes(e.type)&&(e.criticalOnly===true||String(e.target).includes('暴击')||requiresCritical(conditions));
export function applyCriticalOption(report) {
 return {...report,rows:report.rows.map(row=>{
  const links=row.rule.effects.map(e=>effectCombatModes(e,row.rule.conditions,row.rule.effects));
  const excluded=row.rule.effects.map((e,i)=>blockedCombatModes(e,row.rule.conditions,report.context,row.rule.effects).length?i:-1).filter(i=>i>=0);
  if(!excluded.length)return {...row,criticalLinked:links.some(modes=>modes.includes('critical'))};
  const modes=[...new Set(excluded.flatMap(i=>blockedCombatModes(row.rule.effects[i],row.rule.conditions,report.context,row.rule.effects)))];
  const reason=`${modes.map(m=>MODE_LABELS[m]).join('、')}选项已关闭，本次不计入`;
  if(excluded.length===row.rule.effects.length)return {...row,status:row.status==='disabled'?'disabled':'inactive',criticalLinked:links.some(m=>m.includes('critical')),optionExcludedReason:reason,reasons:[...row.reasons,reason]};
  return {...row,modeRule:row.rule,rule:{...row.rule,effects:row.rule.effects.filter((_,i)=>!excluded.includes(i))},effectIndices:row.rule.effects.flatMap((_,i)=>excluded.includes(i)?[]:[row.effectIndices?.[i]??i])};
 })};
}
export function selectReaderCriticalBonuses(bonuses,report) {
 const permissionIds=new Set(bonuses.filter(b=>b.effectType==='critPermission'&&Number.isSafeInteger(b.raw?.localId)&&b.raw.localId>0).map(b=>b.raw.localId));
 return bonuses.map(b=>{
  const effect={type:b.effectType,target:b.target,criticalOnly:b.criticalOnly};
  const conditions=[...(b.decoded?.conditions||b.conditions||[]),...(b.decoded?.triggerConditions||[])];
  const matches=report.rows.filter(r=>b.decoded?.sourceId===r.sourceId||b.sourceName===r.sourceName).flatMap(r=>{
   const rule=r.modeRule||r.rule;
   return rule.effects.filter(e=>e.type===b.effectType&&e.target===b.target).map(e=>({effect:e,rule}));
  });
  // A skill can contain independent unconditional and HP-dependent operations.
  // Do not union their modes merely because they share a source and target.
  const linked=matches.length===1?effectCombatModes(matches[0].effect,matches[0].rule.conditions,matches[0].rule.effects):[];
  const criticalOnly=b.criticalOnly===true||matches.length===1&&criticalDamageEffect(matches[0].effect,matches[0].rule.conditions);
  const combat=['damage','cap','critPermission','critRate'].includes(b.effectType);
  const modeLinks=[...new Set([...effectCombatModes(effect,conditions),...linked,...(combat&&permissionIds.has(b.raw?.localId)?['critical']:[])])];
  const modeConditions=modeLinks.map(field=>({field,op:'eq',value:true}));
  const blocked=blockedCombatModes(effect,[...conditions,...modeConditions],report.context);
  return {...b,modeLinks,...(criticalOnly?{criticalOnly:true}:{}),...(blocked.length?{optionExcludedReason:`${blocked.map(m=>MODE_LABELS[m]).join('、')}选项已关闭；原始读取记录保留，本次不计入`}:{})};
 });
}
