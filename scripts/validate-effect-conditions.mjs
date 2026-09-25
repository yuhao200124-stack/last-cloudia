export function validateEffectConditions(entry,tag,detail,assignment){
 for(const c of detail.effectConditions||[]){
  if(c.numericEffectInjection!==false||!c.effectPartIds?.length||!c.conditionPartIds?.length||!c.predicate||!c.effectBinding||!c.summary)throw Error('Missing attached effect condition');
  for(const id of c.effectPartIds)if(entry.parts.find(p=>p.id===id)?.kind!=='effect'||!assignment.partIds.includes(id))throw Error('Condition must be attached to its actual effect owner');
  for(const id of c.conditionPartIds){const p=entry.parts.find(p=>p.id===id);if(p?.kind!=='condition'||!assignment.partIds.includes(id)||/待确认|未知|尚待/.test(p.text))throw Error('Unknown condition cannot be completed');}
  const q=c.predicate;
  if(q.requiresActualPartyState!==true)throw Error('Party state cannot be assumed');
  if(q.mode==='solo-entry'&&q.downedAlliesDoNotQualify!==true)throw Error('Solo entry differs from only surviving self');
  if(q.mode==='exact-other-same-skill-pair'&&(q.otherEquippedCount!==1||!q.requiredSkillId))throw Error('Pair requires exactly one other holder');
  if(q.mode?.includes('any-allowed-race')&&(q.logicalOperator!=='OR-per-unit'||q.eachUnitCountsOnce!==true))throw Error('Alternative races count each unit once');
  if(JSON.stringify(c.effectBinding.partIds)!==JSON.stringify(c.effectPartIds))throw Error('Attached benefit scope drift');
 }
}
