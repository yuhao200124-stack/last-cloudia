// A combat-selection switch, not a claim that every hit is a critical hit.
// A permission rule is one skill bundle: its fixed cap is removed with that
// bundle when disabled, but remains a BOTH-branch cap while enabled.
export const requiresCritical=conditions=>(conditions||[]).some(c=>c.field==='critical'&&(
 c.op==='eq'&&c.value===true||c.op==='in'&&Array.isArray(c.value)&&c.value.length===1&&c.value[0]===true||c.op==='notIn'&&Array.isArray(c.value)&&c.value.includes(false)&&!c.value.includes(true)));
export const criticalEffect=e=>['critPermission','critRate'].includes(e.type)||['damage','cap'].includes(e.type)&&String(e.target).includes('暴击');
export const criticalDamageEffect=(e,conditions=[])=>['damage','cap'].includes(e.type)&&(e.criticalOnly===true||String(e.target).includes('暴击')||requiresCritical(conditions));
export function applyCriticalOption(report) {
 if(typeof report.context?.criticalEnabled!=='boolean')return report;
 const enabled=report.context.criticalEnabled;
 return {...report,rows:report.rows.map(row=>{
  const bundle=row.rule.effects.some(e=>e.type==='critPermission'),trigger=requiresCritical(row.rule.conditions);
  if(enabled)return {...row,criticalLinked:bundle||trigger};
  const excluded=row.rule.effects.map((e,i)=>(bundle||trigger||criticalEffect(e))?i:-1).filter(i=>i>=0);
  if(!excluded.length)return row;
  const reason='暴击选项已关闭，本次不计入';
  if(excluded.length===row.rule.effects.length)return {...row,status:row.status==='disabled'?'disabled':'inactive',criticalLinked:true,optionExcludedReason:reason,reasons:[...row.reasons,reason]};
  return {...row,rule:{...row.rule,effects:row.rule.effects.filter((_,i)=>!excluded.includes(i))},effectIndices:row.rule.effects.flatMap((_,i)=>excluded.includes(i)?[]:[row.effectIndices?.[i]??i])};
 })};
}
export function selectReaderCriticalBonuses(bonuses,report) {
 if(report.context?.criticalEnabled!==false)return bonuses;
 const permissionIds=new Set(bonuses.filter(b=>b.effectType==='critPermission'&&Number.isSafeInteger(b.raw?.localId)&&b.raw.localId>0).map(b=>b.raw.localId));
 const bundles=report.rows.filter(r=>r.optionExcludedReason&&r.rule.effects.some(e=>e.type==='critPermission'));
 return bonuses.map(b=>{
  const effect={type:b.effectType,target:b.target};
  const linked=bundles.some(r=>(b.decoded?.sourceId===r.sourceId||b.sourceName===r.sourceName)&&r.rule.effects.some(e=>e.type===b.effectType&&e.target===b.target));
  const combat=['damage','cap','critPermission','critRate'].includes(b.effectType);
  return criticalEffect(effect)||requiresCritical([...(b.decoded?.conditions||[]),...(b.decoded?.triggerConditions||[])])||linked||combat&&permissionIds.has(b.raw?.localId)
   ?{...b,optionExcludedReason:'暴击选项已关闭；原始读取记录保留，本次不计入'}:b;
 });
}
