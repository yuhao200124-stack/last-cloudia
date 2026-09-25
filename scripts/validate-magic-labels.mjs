export function validateMagicCoverage(view,detail,assignment,entry){
 const c=detail.coverage;
 if(view.passKind!=='magic-effects-and-condition'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing magic coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(new Set(ids).size!==ids.length||ids.length!==assignment.partIds.length||ids.some(id=>!assignment.partIds.includes(id)))throw Error('Magic coverage mismatch');
 for(const[kind,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>entry.parts.find(p=>p.id===id)?.kind!==kind))throw Error('Magic fragment kinds mixed');
 if(c.effectPartIds.some(id=>!detail.bindings.some(b=>b.magicRole!=='condition-benefit'&&b.partIds.includes(id))))throw Error('Magic effect lacks direct binding');
 if(c.conditionPartIds.some(id=>/待确认|尚待/.test(entry.parts.find(p=>p.id===id).text)))throw Error('Unknown magic condition marked complete');
 if(new Set(detail.bindings.map(b=>b.effectIdentity)).size!==detail.bindings.length)throw Error('Magic effect duplicated');
}
export function validateMagicBinding(detail,assignment,b){
 const c=detail.coverage;
 if(!b.operation||!b.effectIdentity||!b.target||typeof b.isBuff!=='boolean'||!b.scope)throw Error('Missing magic semantics');
 if(!['direct-effect','trigger-benefit','condition-benefit','spell-benefit'].includes(b.magicRole))throw Error('Missing magic relation');
 if(b.magicRole==='condition-benefit'){
  if(b.partIds.some(id=>c.effectPartIds.includes(id))||!c.conditionPartIds.length||b.condition?.event!=='casting-magic')throw Error('Casting benefits must not cover unrelated physical/counter effects');
 }else if(b.partIds.some(id=>!c.effectPartIds.includes(id)))throw Error('Unreviewed magic effect');
 if(b.magicRole==='spell-benefit'){
  if(b.scope.attackType!=='unspecified'||b.trigger?.event!=='periodic-magic-cast'||b.selection!=='random-one-of-six-walls'||b.activeByDefault!==false||b.changesResistance!==false)throw Error('Random wall magic cannot become permanent magic-only reduction or resistance');
 }else if(b.magicRole!=='condition-benefit'&&!['casting','healing','reference'].includes(b.scope.direction)&&b.scope.attackType!=='attack-magic')throw Error('Wrong magic damage type');
 if(['damage-up','incoming-damage-down','cast-speed-up','healing-output-up'].includes(b.operation)&&!(b.valuePercent>0))throw Error('Missing magic magnitude '+b.summary);
 if(b.operation==='cap-up'&&!(b.capPoints>0))throw Error('Missing magic cap');
 if(['healing-output-up','healing-cap-up'].includes(b.operation)&&(b.scope.spellType!=='healing-magic'||b.affectsRecipientMaximumHP!==false||b.operation==='healing-cap-up'&&(!(b.healingCapPoints>0)||b.capPoints!==undefined)))throw Error('Healing output is not HP maximum or attack damage cap');
 if(b.operation==='cast-speed-up'&&(b.scope.spellType!=='all-magic'||b.additionalCastCount!==0))throw Error('Recast is casting speed, not an extra cast');
 if(b.operation==='enable-critical'&&(!b.grantsCriticalEligibility||b.guaranteedCritical!==false||b.ratePoints!==undefined))throw Error('Magic critical permission is not critical rate');
 if(b.operation==='enable-killer'&&(!b.grantsKillerEligibility||!b.scope.enemyTypes?.length||b.valuePercent!==undefined))throw Error('Magic killer permission is not fixed damage');
 if(b.operation==='adjust-spell-cost'&&(!(b.costAdjustmentPercent>0)||b.costBase!=='spell-MP-cost'||b.resource!=='MP'||b.valuePercent!==undefined))throw Error('Spell cost is not damage or maximum MP');
 if(b.operation.includes('scaled-')&&(b.valuePercent!==undefined||b.capPoints!==undefined))throw Error('Magic scaling cannot assume its maximum');
 if(b.scope.spellSubtype==='nonstackable-magic'&&(!b.requiresSpellClassification||b.isBuff||b.stacking))throw Error('Nonstackable spell class is not a Buff stacking rule');
 if(b.operation==='restore-hp'&&(b.healingBase!=='damage-received'||b.trigger?.event!=='magic-damage-received'||b.chanceStatus!=='unconfirmed'))throw Error('Magic received heal must keep actual damage and unknown chance');
 if(b.operation==='prevent-cast-interruption'&&(!b.hasExceptions||b.exceptionsStatus!=='unconfirmed'||b.grantsDamageImmunity!==false||b.preventsAllStagger!==false))throw Error('Casting protection has exceptions and does not grant immunity');
 if(b.operation==='nullify-magic-hit'&&(b.chanceStatus!=='unconfirmed'||b.guaranteedImmunity!==false))throw Error('Unknown magic nullification cannot become immunity');
 if(b.grant&&(!b.grant.providerMustDifferFromRecipient||!b.grant.countProviderAndRecipientOnce||!b.grant.providerSkillId||b.grant.stacking!=='one-per-same-named-provider-skill'))throw Error('Faith source must not be counted twice');
 if(b.isBuff){
  if(!b.buffType||b.stacking!=='highest-active-buff-of-same-type-only'||[b.durationSeconds>0,b.lifetime==='permanent',b.durationStatus==='unconfirmed'].filter(Boolean).length!==1)throw Error('Magic Buff lifetime or stacking missing '+b.summary);
 }else if(b.durationSeconds!==undefined||b.lifetime!==undefined||b.stacking!==undefined)throw Error('Passive magic effect cannot acquire Buff lifetime');
 if(b.group==='damage'&&(b.scope.element||b.scope.enemyType||b.scope.enemyTypes?.length||b.scope.spellSubtype||b.scope.enemyState||b.scope.hitsElementWeakness||b.scope.requiresKillerHit))throw Error('Scoped magic damage mixed into generic group');
}
