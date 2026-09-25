export function validateBirdCoverage(view,detail,assignment,entry){
 const c=detail.coverage;
 if(view.passKind!=='race-effects-and-condition'||detail.race!=='bird'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing bird coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(new Set(ids).size!==ids.length||ids.length!==assignment.partIds.length||ids.some(id=>!assignment.partIds.includes(id)))throw Error('Bird coverage mismatch');
 for(const[kind,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>entry.parts.find(p=>p.id===id)?.kind!==kind))throw Error('Bird fragment kinds mixed');
 if(c.effectPartIds.some(id=>!detail.bindings.some(b=>b.partIds.includes(id))))throw Error('Missing bird effect');
 for(const id of c.conditionPartIds){const p=entry.parts.find(p=>p.id===id);if(p.race&&p.race!=='bird'||p.alternativeGroup&&p.logicalOperator!=='OR'||/待确认/.test(p.text))throw Error('Bird pass cannot cover other race branches or unknown conditions');}
 if(new Set(detail.bindings.map(b=>b.effectIdentity)).size!==detail.bindings.length)throw Error('Bird effects duplicated');
}
export function validateBirdBinding(detail,assignment,b){
 if(b.birdRole!=='direct-effect'||!b.operation||!b.effectIdentity||b.target!=='self'||b.isBuff!==false||b.durationSeconds!==undefined||b.stacking!==undefined||b.effectStacking!=='once-per-skill'||b.partIds.some(id=>!detail.coverage.effectPartIds.includes(id)))throw Error('Invalid bird effect semantics');
 if(b.operation==='add-race'){
  if(b.scope?.direction!=='self-type'||b.scope.subject!=='self'||b.scope.addsRace!=='bird'||b.preservesExistingTypes!==true||b.grantsAirborneState!==false||b.valuePercent!==undefined||b.capPoints!==undefined||b.condition||b.scope.enemyTypes||b.scope.attackerTypes)throw Error('Bird mimicry adds self type, not enemy qualification or flight');
  return;
 }
 const incoming=b.operation==='incoming-damage-down',rs=incoming?b.scope?.attackerTypes:b.scope?.enemyTypes;
 if(!Array.isArray(rs)||!rs.includes('bird')||new Set(rs).size!==rs.length||b.scope.direction!==(incoming?'incoming':'outgoing')||b.condition?.subject!==(incoming?'attacking-enemy':'target-enemy')||b.condition.operator!=='OR'||JSON.stringify(b.condition.raceAnyOf)!==JSON.stringify(rs)||b.matchingMultipleRaces!=='apply-once')throw Error('Bird race subject, OR range or single application lost');
 if(incoming){if(b.scope.attackType!=='unspecified'||b.scope.enemyTypes||b.valuePercent!==10||b.changesDefenseStat!==false)throw Error('Bird shield is all incoming damage from bird, not physical-only or DEF');}
 else if(!['normal-attack','physical','attack-magic','ultimate'].includes(b.scope.attackType)||b.scope.attackerTypes)throw Error('Wrong bird outgoing damage type');
 if(b.operation==='enable-killer'&&(b.grantsKillerEligibility!==true||b.guaranteedInstantKill!==false||b.guaranteedCritical!==false||b.valuePercent!==undefined||b.capPoints!==undefined||b.scope.attackType==='ultimate'))throw Error('Killer eligibility is not guaranteed critical, instant kill or a fixed damage bonus');
 if(b.operation==='damage-up'&&(!(b.valuePercent>0)||b.capPoints!==undefined||b.grantsKillerEligibility!==false))throw Error('Bird damage must remain distinct from killer permission and cap');
 if(b.operation==='cap-up'&&(!(b.capPoints>0)||b.valuePercent!==undefined))throw Error('Bird cap is points, not damage percent');
}
