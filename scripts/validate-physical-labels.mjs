import {validateClassificationContext} from './validate-classification-supplements.mjs';
export function validatePhysicalCoverage(view,detail,assignment,entry){
 const c=detail.coverage;
 if(view.passKind!=='physical-effects-and-condition'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing physical coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(new Set(ids).size!==ids.length||ids.length!==assignment.partIds.length||ids.some(id=>!assignment.partIds.includes(id)))throw Error('Physical coverage mismatch');
 for(const[kind,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>entry.parts.find(p=>p.id===id)?.kind!==kind))throw Error('Physical fragment kinds mixed');
 if(c.effectPartIds.some(id=>!detail.bindings.some(b=>b.partIds.includes(id))))throw Error('Physical effect lacks binding');
 if(c.conditionPartIds.some(id=>/待确认|尚待/.test(entry.parts.find(p=>p.id===id).text)))throw Error('Unknown physical condition marked complete');
 if(new Set(detail.bindings.map(b=>b.effectIdentity)).size!==detail.bindings.length)throw Error('Physical effect duplicated within pass');
}
export function validatePhysicalBinding(detail,assignment,b){
 if(b.classificationContext)return validateClassificationContext('物理',detail,assignment,b);
 if(b.scope?.attackType!=='physical'||!['outgoing','incoming','target-incoming','enemy-outgoing'].includes(b.scope.direction)||typeof b.isBuff!=='boolean'||!b.effectIdentity||!b.operation||!b.target)throw Error('Missing physical semantics '+b.summary);
 if(!['direct-effect','trigger-benefit'].includes(b.physicalRole)||b.partIds.some(id=>!detail.coverage.effectPartIds.includes(id)))throw Error('Unreviewed physical effect');
 if(['damage-up','incoming-damage-up','incoming-damage-down','break-up','apply-physical-vulnerability','apply-enemy-physical-damage-down','enemy-defense-reference-reduction'].includes(b.operation)&&!(b.valuePercent>0))throw Error('Missing physical magnitude '+b.summary);
 if(b.operation==='cap-up'&&!(b.capPoints>0))throw Error('Missing physical cap '+b.summary);
 if(b.scope.equipment?.weaponCountIn&&b.condition?.weaponCount!==undefined&&!b.scope.equipment.weaponCountIn.every(n=>n===b.condition.weaponCount))throw Error('Physical equipment branches narrowed by copied condition');
 if(b.operation==='consume-current-MP'&&(b.costPoints!==3||b.costBase!=='fixed-points'||b.insufficientResourceStatus!=='unconfirmed'))throw Error('Physical shield cost is fixed current MP with unknown insufficient-MP behavior');
 if(b.operation==='stat-reference-up'&&(b.valuePercent!==undefined||!b.referencePercent))throw Error('Physical STR reference is not a damage multiplier');
 if(b.operation==='rate-up'&&(!(b.ratePoints>0)||b.grantsCriticalEligibility!==false))throw Error('Rate is not critical permission');
 if(b.requiresCriticalHit&&b.operation==='damage-up'&&b.group==='damage')throw Error('Critical damage mixed with plain damage');
 if(b.operation==='conditional-cap-up'&&(b.branches!=='mutually-exclusive'||!b.capCases?.some(c=>c.otherwise)||b.capPoints!==undefined||b.scope.equipment))throw Error('Physical cap branches must include fallback, without a global equipment restriction');
 if(b.operation.includes('scaled-')&&(b.valuePercent!==undefined||b.capPoints!==undefined))throw Error('Physical scaling cannot assume maximum as current value');
 if(b.operation==='enable-killer'&&(!b.grantsKillerEligibility||!b.scope.enemyTypes?.length||b.valuePercent!==undefined))throw Error('Killer permission is not a fixed damage modifier');
 if(b.operation==='hit-count-multiplier'&&b.hitMultiplier!==2||b.operation==='hit-damage-multiplier'&&b.damageMultiplier!==0.6)throw Error('Dual wield hit count and per-hit damage must stay separate');
 if(b.operation==='enemy-defense-reference-reduction'&&(b.appliesPersistentDebuff!==false||b.base!=='enemy-DEF-for-this-hit'))throw Error('Per-hit defense reference is not persistent defense down');
 if(b.operation==='apply-physical-vulnerability'&&(b.target!=='target-enemy'||b.scope.direction!=='target-incoming'||!b.isDebuff||b.trigger.event!=='normal-attack-hit'||b.appliedDurationSeconds!==40))throw Error('Physical vulnerability source and target mixed');
 if(b.operation==='apply-enemy-physical-damage-down'&&(b.target!=='enemy-who-defeated-self'||b.scope.direction!=='enemy-outgoing'||b.appliedDurationStatus!=='unconfirmed'))throw Error('Enemy damage debuff target or duration lost');
 if(b.grant&&(!b.grant.providerMustDifferFromRecipient||!b.grant.countProviderAndRecipientOnce||!b.grant.providerSkillId||b.grant.stacking!=='one-per-same-named-provider-skill'))throw Error('Faith grant must preserve provider, recipient and non-stacking');
 if(b.operation==='instant-kill-attempt'&&(!b.scope.excludedEnemyTypes?.includes('boss')||!b.scope.excludedModes?.includes('arena')||b.chanceStatus!=='unconfirmed'))throw Error('Instant kill restrictions missing');
 if(b.isBuff){
  if(!b.buffType||b.stacking!=='highest-active-buff-of-same-type-only'||[b.durationSeconds>0,b.lifetime==='permanent',b.durationStatus==='unconfirmed'].filter(Boolean).length!==1)throw Error('Physical Buff duration or stacking missing '+b.summary);
 }else if(b.durationSeconds!==undefined||b.lifetime!==undefined||b.stacking!==undefined)throw Error('Passive physical effect cannot acquire Buff lifetime');
 if(b.group==='damage'&&(b.scope.element||b.scope.enemyType||b.scope.enemyTypes?.length||b.scope.enemyState||b.scope.position||b.scope.hitsElementWeakness||b.requiresCriticalHit))throw Error('Scoped physical bonus mixed with generic group');
}
