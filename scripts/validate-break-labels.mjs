export function validateBreakCoverage(view,d,a,e){
 const c=d.coverage;
 if(view.passKind!=='break-effects-and-condition'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing Break coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(new Set(ids).size!==ids.length||ids.length!==a.partIds.length||ids.some(id=>!a.partIds.includes(id)))throw Error('Break coverage mismatch');
 for(const[k,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>e.parts.find(p=>p.id===id)?.kind!==k))throw Error('Break fragment kinds mixed');
 if(c.conditionPartIds.some(id=>/待确认|未知|仍待/.test(e.parts.find(p=>p.id===id).text)))throw Error('Unknown Break condition marked complete');
 if(c.effectPartIds.some(id=>!d.bindings.some(b=>b.breakRole==='direct-effect'&&b.partIds.includes(id))))throw Error('Missing direct Break binding');
 if(new Set(d.bindings.map(b=>b.effectIdentity)).size!==d.bindings.length)throw Error('Duplicate Break effect');
}

export function validateBreakBinding(d,a,b){
 if(!b.operation||!b.effectIdentity||!b.target||typeof b.isBuff!=='boolean'||!b.scope||!b.sourceClause||!Array.isArray(b.skillReviewConditions))throw Error('Missing Break semantics');
 if(b.breakRole==='condition-benefit'){
  if(!d.coverage.conditionPartIds.length||!b.statePredicate||b.partIds.some(id=>a.partIds.includes(id)))throw Error('Break condition cannot complete independent damage effects');
 }else if(b.breakRole!=='direct-effect'||b.partIds.some(id=>!d.coverage.effectPartIds.includes(id)))throw Error('Unreviewed Break effect');
 if(!['break-up','damage-up','cap-up'].includes(b.operation)||b.scope.direction!=='outgoing')throw Error('Not a Break effect or state-conditioned bonus');
 if(b.operation==='cap-up'&&(!(b.capPoints>0)||b.valuePercent!==undefined))throw Error('Damage cap uses fixed points');
 if(b.operation!=='cap-up'&&!(b.valuePercent>0))throw Error('Missing Break or damage magnitude');
 if(b.operation==='break-up'){
  if(b.affects!=='break-gauge-damage'||b.changesHpDamage!==false||b.appliesBreakImmediately!==false||b.statePredicate||b.scope.enemyState||b.scope.enemyStateAnyOf)throw Error('Break gauge damage is not HP damage or an active Break predicate');
  if(b.scope.requiresElementWeakHit&&(b.condition?.event!=='element-weakness-hit'||b.condition.checksTargetForThisHit!==true))throw Error('Weakness must be checked for the actual hit');
  if(b.condition?.metric==='consecutive-hit-count'&&(b.condition.subject!=='combo'||b.condition.operator!=='gte'||b.condition.threshold!==50||b.activeByDefault!==false))throw Error('Consecutive hit threshold cannot become received hits or unconditional');
  if(b.addsToPartId&&(b.scope.attackType!=='skill'||b.scope.equipment?.weaponCount!==1||b.valuePercent!==30||b.addsToPartId!=='skill-break'))throw Error('Extra Break branch keeps its single-weapon skill scope');
 }else{
  if(b.statePredicate?.subject!=='target-enemy'||b.changesBreakGaugeDamage!==false||b.affects!==(b.operation==='cap-up'?'hp-damage-cap':'hp-damage'))throw Error('State-conditioned damage is not Break gauge damage');
  if(b.scope.enemyStateAnyOf){
   if(JSON.stringify(b.scope.enemyStateAnyOf)!==JSON.stringify(['stunned','break'])||JSON.stringify(b.statePredicate.statesAnyOf)!==JSON.stringify(b.scope.enemyStateAnyOf)||b.statePredicate.logicalOperator!=='OR'||b.matchingMultipleStates!=='apply-once')throw Error('Stun or Break must retain full OR without duplicate stacking');
  }else if(b.scope.enemyState!=='break'||b.statePredicate.mode!=='break-active')throw Error('Break-only target condition must not include stun');
 }
 if(b.isBuff){
  if(b.operation!=='break-up'||b.buffType!=='break-value-up'||b.endsOn!=='incapacitated'||b.durationSeconds!==undefined||b.lifetime!==undefined||b.trigger?.event!=='battle-start'||b.stacking!=='highest-active-buff-of-same-type-only')throw Error('Opening Break Buff retains its end event and highest-only stacking');
 }else if(b.durationSeconds!==undefined||b.endsOn!==undefined||b.stacking!==undefined)throw Error('Passive Break bonus cannot become a timed Buff');
}
