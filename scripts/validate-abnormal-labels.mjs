export const abnormalAddedPartIds=['abnormal-parameters','abnormal-slow-amount','abnormal-opening-str-down','abnormal-random-str-down'];
export const partsBeforeAbnormal=entry=>entry.parts.filter(p=>!abnormalAddedPartIds.includes(p.id));

export function validateAbnormalCoverage(view,d,a,e){
 const c=d.coverage;
 if(view.passKind!=='abnormal-effects-and-condition'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing abnormal coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(new Set(ids).size!==ids.length||ids.length!==a.partIds.length||ids.some(id=>!a.partIds.includes(id)))throw Error('Abnormal coverage mismatch');
 for(const[k,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>e.parts.find(p=>p.id===id)?.kind!==k))throw Error('Abnormal fragment kinds mixed');
 if(c.conditionPartIds.some(id=>/待确认|未知|未明确|未给出/.test(e.parts.find(p=>p.id===id).text)))throw Error('Unknown abnormal condition marked complete');
 if(c.effectPartIds.some(id=>!d.bindings.some(b=>b.abnormalRole==='direct-effect'&&b.partIds.includes(id))))throw Error('Missing direct abnormal binding');
 if(new Set(d.bindings.map(b=>b.effectIdentity)).size!==d.bindings.length)throw Error('Duplicate abnormal effect');
}

export function validateAbnormalBinding(d,a,b){
 if(!b.operation||!b.effectIdentity||!b.target||typeof b.isBuff!=='boolean'||!b.scope||!b.sourceClause)throw Error('Missing abnormal semantics');
 if(b.abnormalRole==='direct-effect'){
  if(b.partIds.some(id=>!d.coverage.effectPartIds.includes(id)))throw Error('Unreviewed abnormal effect');
 }else if(['condition-benefit','context-only'].includes(b.abnormalRole)){
  if(b.partIds.some(id=>a.partIds.includes(id))||!b.statusPredicate||b.abnormalRole==='condition-benefit'&&!d.coverage.conditionPartIds.length)throw Error('Condition display cannot complete independent effects');
 }else throw Error('Missing abnormal role');
 if(b.operation==='status-resistance-up'&&(![1,2].includes(b.resistanceSteps)||b.valuePercent!==undefined||b.guaranteesImmunity!==false||b.scope.direction!=='self-resistance'))throw Error('Resistance grades are not percent or guaranteed immunity');
 if(b.operation==='status-resistance-up-unquantified'&&(b.resistanceSteps!==undefined||b.resistanceStepsStatus!=='unconfirmed'||b.guaranteesImmunity!==false))throw Error('Unspecified resistance cannot acquire a grade');
 if(b.operation==='remove-basic-ailment-weakness'&&(b.appliesOnlyToExistingWeakness!==true||b.changesNonWeakResistances!==false||b.includesSpecialStatuses!==false||b.resultingState!=='normal'||b.resistanceSteps!==undefined))throw Error('Weakness removal cannot raise all resistances');
 if(b.operation==='block-basic-ailment-once'&&(b.blocks!==1||b.lifetime!=='until-first-blocked-abnormal-status'||b.consumedOn!=='first-blocked-basic-ailment'||b.includesSpecialStatuses!==false||b.isBuff))throw Error('Single-use barrier is not permanent immunity');
 if(b.operation==='apply-status'){
  if(!b.scope.status||!b.scope.statusKind||!b.trigger?.event||!b.statusDurationStatus)throw Error('Status application must retain its kind, trigger and lifetime');
  if(b.target!=='self'&&b.respectsTargetStatusResistance!==true)throw Error('Status application must respect target resistance');
  if(b.chancePercent!==undefined&&b.chanceMeaning!=='application-attempt')throw Error('Proc probability cannot guarantee status success');
 }
 if(b.operation==='apply-element-resistance-down'&&(b.changesAilmentResistance!==false||b.resistanceSteps!==undefined||b.scope.elements?.includes('neutral')))throw Error('Element resistance is separate from ailment resistance');
 if(b.operation==='prevent-stat-down'&&(b.chanceStatus!=='unconfirmed'||b.guaranteedImmunity!==false||b.scope.source!=='active-skill'||b.resistanceSteps!==undefined))throw Error('Debuff avoidance is probabilistic and source-restricted');
 if(b.statusPredicate?.mode==='has-no-ailment'&&b.statusPredicate.meansNoDebuffs!==false)throw Error('No ailment does not mean no debuffs');
 if(b.statusPredicate?.mode==='debuff-count'&&b.statusPredicate.meansAilmentCount!==false)throw Error('Debuff count cannot become ailment count');
 if(b.scope.attackerState&&b.statusPredicate?.subject!=='attacking-enemy')throw Error('Mitigation must test the damage source');
 if(b.scope.enemyState&&b.statusPredicate?.subject!=='target-enemy')throw Error('Damage bonus must test the target');
 if(b.operation==='status-recovery-speed-down'&&(b.changesResistance!==false||b.convertsToDurationPercent!==false))throw Error('Recovery speed is not resistance or duration');
 if(b.operation==='stun-ease-up'&&(b.changesBreakDamage!==false||b.changesParalysisResistance!==false))throw Error('Stun is separate from Break and paralysis');
 if(b.isDebuff&&b.isBuff||b.statusKind==='special-status'&&b.isBuff)throw Error('Debuffs and abnormal states are not ordinary Buffs');
 if(b.isBuff&&(b.buffType!=='resistance-for-cured-status'||b.durationSeconds!==40||b.stacking!=='highest-active-buff-of-same-type-only'||b.scope.status!=='just-cured-basic-status'||b.removesAilment!==false||b.simultaneouslyRaisesAllStatuses!==false))throw Error('Cure resistance Buff affects only the cured ailment');
}
