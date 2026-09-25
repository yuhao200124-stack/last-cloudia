export const defensiveKeys=['defense','mnd','damage-reduction'];
export function validateDefensiveCoverage(view,d,a,e){
 const c=d.coverage;if(view.passKind!=='defensive-effects-and-condition'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing defensive coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];if(new Set(ids).size!==ids.length||ids.length!==a.partIds.length||ids.some(id=>!a.partIds.includes(id)))throw Error('Defensive coverage mismatch');
 for(const[k,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>e.parts.find(p=>p.id===id)?.kind!==k))throw Error('Defensive fragment kinds mixed');
 if(c.conditionPartIds.some(id=>/待确认|未知/.test(e.parts.find(p=>p.id===id).text)))throw Error('Unknown defensive condition marked complete');
 if(c.effectPartIds.some(id=>!d.bindings.some(b=>b.familyRole==='direct-effect'&&b.partIds.includes(id))))throw Error('Missing direct defensive binding');
 if(new Set(d.bindings.map(b=>b.effectIdentity)).size!==d.bindings.length)throw Error('Duplicate defensive effect');
}
export function validateDefensiveBinding(key,d,a,b){
 if(!b.operation||!b.effectIdentity||!b.target||typeof b.isBuff!=='boolean'||!b.scope||!b.sourceClause||!Array.isArray(b.skillReviewConditions))throw Error('Missing defensive semantics');
 if(b.familyRole==='condition-benefit'){
  if(!d.coverage.conditionPartIds.length||b.partIds.some(id=>a.partIds.includes(id))||b.trigger?.event!=='guard-success'||!b.requiresEquippedSkillId)throw Error('Guard benefits cannot complete independent healing/resource effects');
 }else if(b.familyRole!=='direct-effect'||b.partIds.some(id=>!d.coverage.effectPartIds.includes(id)))throw Error('Unreviewed defensive effect');
 if(['stat-up','stat-down','incoming-damage-down','incoming-damage-up','equipment-stat-up'].includes(b.operation)&&!(b.valuePercent>0))throw Error('Missing defensive magnitude '+b.summary);
 if(b.operation==='stat-add'&&(!(b.valuePoints>0)||b.valuePercent!==undefined))throw Error('Fixed defense cannot be a percentage');
 if(b.operation==='equipment-stat-up'&&(b.base!=='equipped-item-stat'||b.target!=='equipped-armor'||b.pairedEquipmentLogicalOperator!=='AND'||!b.scope.equipment?.weaponType||!b.scope.equipment?.armorType))throw Error('Equipment stat is not final character stat');
 if(/scaled-/.test(b.operation)&&b.valuePercent!==undefined)throw Error('Scaling cannot assume its maximum');
 if(['add-stat-reference','stat-reference','healing-stat-reference'].includes(b.operation)&&(b.changesReferenceStat!==false||b.valuePercent!==undefined))throw Error('Reference cannot change its source stat or imply percent gain');
 if(b.operation==='healing-stat-reference'&&(b.completesHealingEffect!==false||b.formulaStatus!=='unconfirmed'))throw Error('MND reference is not a resolved heal');
 if(b.isBuff){if(!b.buffType||b.stacking!=='highest-active-buff-of-same-type-only'||[b.durationSeconds>0,b.lifetime==='permanent',!!b.durationStatus].filter(Boolean).length!==1)throw Error('Buff lifetime and stacking missing '+b.summary);}
 else if(b.durationSeconds!==undefined||b.lifetime!==undefined||b.stacking!==undefined)throw Error('Passive defensive effect cannot acquire a Buff lifetime');
 if(key==='defense'&&b.scope.attackType==='attack-magic'&&b.scope.direction==='incoming')throw Error('Magic mitigation belongs to MND');
 if(key==='mnd'&&b.scope.direction==='incoming'&&b.scope.attackType!=='attack-magic')throw Error('MND cannot broaden element or physical damage into magical mitigation');
 if(key==='damage-reduction'){
  if(b.scope.direction!=='incoming'||b.scope.attackType!=='unspecified'||!['incoming-damage-down','hit-scaled-reduction','party-scaled-reduction','decaying-reduction'].includes(b.operation))throw Error('Generic reduction must reduce overall incoming damage');
  if(['element','attackerType','enemyType','enemyTypes','attackerRace','attackerState','enemyState','hitsSelfElementWeakness','requiresKillerHit','critical'].some(k=>b.scope[k]!==undefined)||b.raceRelation&&b.raceRelation.subject!=='self')throw Error('Restricted damage cannot become generic reduction');
  if(b.operation==='decaying-reduction'&&(b.valuePercent!==undefined||b.initialReductionPercent!==10||b.decayPercentagePoints!==1||b.decayIntervalSeconds!==10||b.durationSeconds!==100))throw Error('Decaying reduction is not fixed 10 percent');
 }
}
