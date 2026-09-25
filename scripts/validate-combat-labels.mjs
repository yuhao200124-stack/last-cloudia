export const combatKeys=['guard','counter','normal-attack','follow-up','hp-recovery','lifesteal'];
export const combatTags=['格挡','反击','普通攻击','追击','HP回复','吸血'];

export function validateCombatCoverage(key,view,d,a,e){
 const c=d.coverage;
 if(view.passKind!==key+'-effects-and-condition'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing independent combat-family coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(!ids.length||new Set(ids).size!==ids.length||ids.length!==a.partIds.length||ids.some(id=>!a.partIds.includes(id)))throw Error('Combat coverage mismatch');
 for(const[k,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>e.parts.find(p=>p.id===id)?.kind!==k))throw Error('Mixed effect and condition fragments');
 if(c.conditionPartIds.some(id=>/待确认|未知|尚待|仍待/.test(e.parts.find(p=>p.id===id).text)))throw Error('Unknown combat parameters marked complete');
 if(c.effectPartIds.some(id=>!d.bindings.some(b=>b.combatRole==='direct-effect'&&b.partIds.includes(id))))throw Error('Missing direct effect binding');
 if(new Set(d.bindings.map(b=>b.effectIdentity)).size!==d.bindings.length)throw Error('Duplicate combat effect');
}

export function validateCombatBinding(key,d,a,b){
 if(!b.operation||!b.effectIdentity||!b.target||typeof b.isBuff!=='boolean'||!b.scope||!b.sourceClause||!Array.isArray(b.skillReviewConditions))throw Error('Missing combat semantics');
 if(b.combatRole==='condition-benefit'){
  if(!d.coverage.conditionPartIds.length||b.partIds.some(id=>a.partIds.includes(id)))throw Error('Condition benefit cannot cover its independent effect');
 }else if(b.combatRole!=='direct-effect'||b.partIds.some(id=>!d.coverage.effectPartIds.includes(id)))throw Error('Unreviewed combat effect');
 const unknown=['amountStatus','formulaStatus','chanceStatus','powerStatus','counterPowerStatus','amountBaseStatus','specialHealingExceptionsStatus'].some(k=>b[k]==='unconfirmed');
 if(unknown&&!b.pendingPartIds?.length)throw Error(`Unknown magnitude or probability needs a pending fragment: ${b.effectIdentity}`);
 if(b.operation==='cap-up'&&(!(b.capPoints>0)||b.valuePercent!==undefined))throw Error('Damage caps use fixed points');
 if(['healing-cap-up','healing-received-cap-up'].includes(b.operation)&&(!(b.healingCapPoints>0)||b.valuePercent!==undefined||b.affectsRecipientMaximumHP!==false))throw Error('Healing caps are not maximum HP or percentages');
 if(b.operation==='enable-killer'&&(!b.grantsKillerEligibility||b.guaranteedCritical!==false||b.guaranteedInstantKill!==false||b.valuePercent!==undefined))throw Error('Killer eligibility is not a fixed bonus, guaranteed critical or instant kill');
 if(b.operation==='count-scaled-cap-up'&&(b.count?.metric!=='allied-units-of-race'||b.count.race!=='machine'||b.count.includesSelf!==true||b.count.maxCount!==4||b.capPerUnit!==1000||b.maxCapPoints!==4000||b.capPoints!==undefined))throw Error('Machine cap must count actual allied units including self');
 if(b.operation==='tiered-incoming-damage-down'&&(b.countMetric!=='allies-with-same-skill'||b.minimumCount!==2||!b.requiredSkillId||JSON.stringify(b.tiers)!==JSON.stringify([{count:2,valuePercent:5},{count:3,valuePercent:10},{count:4,valuePercent:15}])||b.valuePercent!==undefined))throw Error('Same-skill count uses exactly one current tier');
 if(key==='guard'){
  if(!['enable-guard','enable-magic-guard','guard-mitigation-up','guard-chance-up','guard-break-resistance-up','release-enemy-guard','restore-hp','restore-current','restore-sct-unconfirmed'].includes(b.operation))throw Error('Non-guard effect in guard family');
  if(['restore-hp','restore-current','restore-sct-unconfirmed'].includes(b.operation)&&(b.combatRole!=='condition-benefit'||b.trigger?.event!=='guard-success'||b.requiresEquippedSkillId!=='全部技能:all:31'))throw Error('Guard success benefits require the equipped guard skill');
  if(b.operation==='release-enemy-guard'&&(b.target!=='target-enemy'||b.scope.attackType!=='physical'||b.chanceStatus!=='unconfirmed'))throw Error('Guard release retains its physical scope and unknown chance');
 }
 if(key==='counter'){
  if(b.requiresCriticalHit&&b.grantsCriticalEligibility!==false)throw Error('Counter critical damage requires an actual critical hit');
  if(b.scope.enemyActionAnyOf&&(JSON.stringify(b.scope.enemyActionAnyOf)!==JSON.stringify(['skill','counter'])||b.scope.attackType!=='skill'||b.statePredicate?.subject!=='target-enemy'||b.statePredicate.logicalOperator!=='OR'||b.matchingMultipleActions!=='apply-once'))throw Error('Enemy skill or counter condition keeps the full OR');
  if(b.group==='during-reduction'&&(b.scope.attackType!=='unspecified'||b.statePredicate?.subject!=='self'||b.statePredicate.state!=='counter-active'))throw Error('During-counter reduction is not received-counter reduction');
  if(['incoming','casting-incoming','same-skill-count-incoming'].includes(b.group)&&(b.scope.direction!=='incoming'||b.scope.attackType!=='counter'))throw Error('Received counter scope missing');
  if(b.operation==='prevent-attack-induced-stun'&&(b.prevents!=='stun'||b.grantsAllAilmentImmunity!==false||b.scope.source!=='enemy-attack'||b.statePredicate?.state!=='counter-active'))throw Error('Counter stun prevention is not all-ailment immunity');
 }
 if(key==='normal-attack'){
  if(b.combatRole==='direct-effect'&&b.scope.attackType!=='normal-attack')throw Error('Normal direct effect must explicitly target normal attacks');
  if(b.group==='mp-absorb'&&(b.scope.resource!=='MP'||b.scope.sourceAttackType!=='normal-attack'))throw Error('MP absorption must retain its resource');
 }
 if(key==='follow-up'){
  if(b.operation==='trigger-follow-up'){
   if(b.trigger?.event!=='normal-attack-used'||b.scope.attackType!=='follow-up'||b.changesMainHitDamage!==false||b.changesMainHitCount!==false||![1,2].includes(b.additionalHitCount))throw Error('Follow-up is a separate hit, not a normal attack multiplier');
   if(b.multiplierCases&&(JSON.stringify(b.multiplierCases)!=='[4,8]'||b.branchMode!=='mutually-exclusive'||b.multiplierBase!=='ordinary-attack-power'||b.outcomeDistributionStatus!=='unconfirmed'||b.chanceStatus!=='unconfirmed'||b.valuePercent!==undefined))throw Error('4 or 8 power cannot be summed or averaged');
  }else if(b.operation==='incoming-damage-down'){
   if(JSON.stringify(b.scope.attackTypeAnyOf)!==JSON.stringify(['follow-up','dual-wield-skill-second-hit'])||b.scope.attackType!==undefined||b.branchMode!=='OR'||b.matchingMultipleAttackTypes!=='apply-once'||b.appliesToAllNormalAttacks!==false||b.valuePercent!==30)throw Error('Follow-up or dual-wield second hit preserves the complete OR');
  }else if(b.operation!=='damage-up'||b.scope.attackType!=='follow-up'||b.changesMainHitDamage!==false)throw Error('Invalid follow-up effect');
 }
 if(key==='lifesteal'||b.operation==='drain-hp'){
  if(b.operation!=='drain-hp'||b.scope.resource!=='HP'||b.scope.sourceAttackType!=='normal-attack'||b.restorePercent!==20||b.restoreBase!=='damage-dealt'||b.chanceStatus!=='unconfirmed'||b.chancePercent!==undefined)throw Error('HP lifesteal retains damage-dealt base, normal source and unknown chance');
 }
 if(key==='hp-recovery'){
  if(!['restore-hp','drain-hp','revive-self','periodic-restore-hp','healing-output-up','healing-cap-up','healing-received-up','healing-received-cap-up','stat-scaled-healing-output-up','restore-sct-seconds','prevent-hp-recovery'].includes(b.operation))throw Error('Unrelated resource in HP recovery');
  if(b.operation==='restore-sct-seconds'&&(b.combatRole!=='condition-benefit'||b.trigger?.requiresHpRecoveryCapability!==true||b.trigger.passiveRegenCounts!==false||b.restoreSeconds!==3))throw Error('Active HP recovery capability is the SCT trigger');
  if(b.operation==='revive-self'&&(!b.requiresIncapacitated||b.healingMode!=='revival-initial-hp'||b.initialHpPercent!==10||b.hpBase!=='maximum-HP'||b.maxTriggers!==1||b.resetScope!=='wave'))throw Error('Revival HP endpoint is distinct from ordinary healing');
  if(b.operation==='stat-scaled-healing-output-up'&&(b.referenceStat!=='STR'||b.changesStat!==false||b.formulaStatus!=='unconfirmed'||b.specialHealingExceptionsStatus!=='unconfirmed'||b.valuePercent!==undefined))throw Error('STR reference formula and special exclusions stay unresolved');
  if(b.target==='paired-living-ally'&&(b.pair?.otherEquippedCount!==1||b.pair.targetMustBeAlive!==true||b.maxTriggers!==1||b.resetScope!=='pair'||b.trigger?.actor!=='self'))throw Error('Dear Hearts retains the living paired recipient and once-per-pair limit');
  if(b.operation==='prevent-hp-recovery'&&(b.target!=='enemy-who-defeated-self'||b.requiresStatus!=='disease'||b.sourceEffectPartId!=='apply-disease'))throw Error('Disease HP prevention applies to the killer while diseased');
  if(b.isBuff&&(b.operation!=='periodic-restore-hp'||b.intervalSeconds!==6||b.buffType!=='hp-regeneration'||b.stacking!=='highest-active-buff-of-same-type-only'||[b.lifetime==='permanent',b.durationSeconds>0].filter(Boolean).length!==1))throw Error('HP regeneration Buff retains interval, lifetime and highest-only stacking');
  if(!b.isBuff&&(b.durationSeconds!==undefined||b.lifetime!==undefined||b.stacking!==undefined))throw Error('Instant healing is not a timed Buff');
 }
}
