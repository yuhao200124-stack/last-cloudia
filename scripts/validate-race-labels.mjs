const operations=new Set(['enable-killer','damage-up','cap-up','incoming-damage-down','add-race','add-random-race','rate-up','enable-critical','count-scaled-cap-up','team-scaled-damage-up','team-tiered-cap-up','stat-up','conditional-cap-up','movement-speed-up']);
export function validateRaceCoverage(view,detail,assignment,entry){
 const c=detail.coverage,ids=[...(c?.effectPartIds||[]),...(c?.conditionPartIds||[])];
 if(view.passKind!=='race-effects-and-condition'||view.race!==detail.race||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds)||ids.length!==new Set(ids).size||ids.length!==assignment.partIds.length||ids.some(id=>!assignment.partIds.includes(id)))throw Error('Race coverage mismatch');
 for(const[kind,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>entry.parts.find(p=>p.id===id)?.kind!==kind))throw Error('Race effect/condition mismatch');
 for(const id of c.conditionPartIds){const p=entry.parts.find(p=>p.id===id);const attached=detail.effectConditions?.some(c=>c.conditionPartIds.includes(id));if(p.race&&p.race!==detail.race&&!attached||/待确认|尚待/.test(p.text))throw Error('Other race branch or unknown condition covered');}
 if(c.effectPartIds.some(id=>!detail.bindings.some(b=>b.partIds.includes(id)))||new Set(detail.bindings.map(b=>b.effectIdentity)).size!==detail.bindings.length)throw Error('Missing or duplicated race effect');
}
export function validateRaceBinding(detail,assignment,b){
 if(!operations.has(b.operation)||b.raceRole!=='direct-effect'||!b.effectIdentity||!b.scope||!b.target||typeof b.isBuff!=='boolean'||b.effectStacking!=='once-per-skill'||b.partIds.some(id=>!detail.coverage.effectPartIds.includes(id)))throw Error('Missing race semantics');
 const q=b.raceRelation;
 if(detail.race!=='common'&&(!q?.races?.includes(detail.race)||new Set(q.races).size!==q.races.length||!['any-of','none-of','random-one-of'].includes(q.operator)))throw Error('Missing specific race predicate');
 if(q&&q.subject!=='self-type-addition'&&b.matchingMultipleRaces!=='apply-once')throw Error('Race overlap must not multiply one effect');
 if(q?.subject==='target-enemy'&&b.scope.direction!=='outgoing'||q?.subject==='attacking-enemy'&&b.scope.direction!=='incoming')throw Error('Race attacker/target direction reversed');
 if(q?.operator==='none-of'&&(b.scope.enemyTypes||b.scope.attackerTypes||b.scope.addsRace))throw Error('Negative race condition turned positive');
 if(b.operation==='add-race'&&(q?.subject!=='self-type-addition'||b.scope.direction!=='self-type'||b.scope.subject!=='self'||b.scope.addsRace!==q.races[0]||q.races.length!==1||b.preservesExistingTypes!==true||b.grantsOtherRaceSkills!==false||b.grantsAirborneState!==false||b.valuePercent!==undefined))throw Error('Mimicry only adds a type');
 if(b.operation==='add-random-race'&&(b.addedTypeCount!==1||!b.preservesExistingTypes||!['battle-end','incapacitated'].includes(b.endsOn)||b.trigger?.event!=='battle-start'||!['confirmed','unconfirmed'].includes(b.candidatePoolStatus)||b.candidatePoolStatus==='confirmed'&&(q?.operator!=='random-one-of'||b.selection!=='one-of-candidates')))throw Error('Random type is one candidate with its own lifetime');
 if(b.operation==='enable-killer'&&(!['normal-attack','physical','attack-magic','ultimate','counter'].includes(b.scope.attackType)||q?.subject!=='target-enemy'||b.grantsKillerEligibility!==true||b.guaranteedCritical!==false||b.guaranteedInstantKill!==false||b.valuePercent!==undefined||b.capPoints!==undefined))throw Error('Killer permission is not fixed damage or guaranteed critical');
 if(['damage-up','incoming-damage-down','stat-up'].includes(b.operation)&&!(b.valuePercent>0))throw Error('Missing race effect magnitude');
 if(b.operation==='incoming-damage-down'&&b.scope.direction!=='incoming')throw Error('Reduction must be incoming');
 if(b.operation==='rate-up'&&(!(b.ratePoints>0)||b.valuePercent!==undefined||b.grantsCriticalEligibility!==false))throw Error('Rate points are not damage or eligibility');
 if(b.operation==='enable-critical'&&(b.guaranteedCritical!==false||b.grantsCriticalEligibility!==true||b.ratePoints!==undefined))throw Error('Critical permission is not guaranteed critical');
 if(b.operation==='cap-up'&&(!(b.capPoints>0)||b.valuePercent!==undefined))throw Error('Cap is points, not percentage');
 if(['team-scaled-damage-up','count-scaled-cap-up','team-tiered-cap-up'].includes(b.operation)){
  if(b.valuePercent!==undefined||b.capPoints!==undefined||!b.count?.eachUnitCountsOnce||b.count.maxCount!==4)throw Error('Team effects must use actual unique unit count');
  if(b.operation==='team-scaled-damage-up'&&(b.curveStatus!=='unconfirmed'||b.maxValuePercent!==20))throw Error('Unconfirmed team curve cannot assume maximum');
  if(b.operation==='count-scaled-cap-up'&&(b.capPerUnit!==1000||b.maxCapPoints!==4000||b.count.includesSelf!==true))throw Error('Race unit cap must include self and retain per-unit points');
  if(b.operation==='team-tiered-cap-up'&&(b.count.metric!=='allies-with-same-skill'||b.count.minCount!==2||JSON.stringify(b.capByCount)!==JSON.stringify({2:2500,3:5000,4:7500})||b.otherwiseCapPoints!==0))throw Error('Raid count is equipped allies, not target race count');
 }
 if(q?.subject==='all-allies'&&(JSON.stringify(b.condition?.allAlliesHaveOneOfTypes)!==JSON.stringify(q.races)||b.condition.includesSelf!==true||b.condition.snapshot!=='wave-start'))throw Error('Every ally must qualify at wave start');
 if(b.operation==='conditional-cap-up'&&(b.branches!=='mutually-exclusive'||b.capCases?.length!==2||b.scope.equipment||b.capPoints!==undefined||!b.capCases.some(c=>c.otherwise)||!b.scope.requiresKillerHit))throw Error('Conditional cap must preserve fallback, not sum or require single weapon globally');
 if(b.grant&&(!b.grant.providerMustDifferFromRecipient||!b.grant.recipientMustEquipFaith||!b.grant.countProviderAndRecipientOnce||b.grant.stacking!=='one-per-same-named-provider-skill'||!b.grant.providerEffectIdentity||q?.subject!=='provider'))throw Error('Faith provider/recipient relation lost');
 if(b.sharedTypeMatch&&(!['target-enemy-and-self','attacking-enemy-and-self'].includes(q?.subject)||q.operator!=='shared-type'||q.races.length||b.sharedTypeMatch!=='at-least-one-common-type'))throw Error('Shared types are not a fixed race or identical whole sets');
 if(b.condition?.events&&(b.condition.operator!=='OR'||b.matchingMultipleConditions!=='apply-once'||b.valuePercent!==10))throw Error('Killer-or-weakness reduction must not stack');
 if(b.operation==='movement-speed-up'&&(b.movementSpeedPoints!==2||b.changesSctSpeed!==false||b.condition?.count!==2||b.condition.operator!=='gte'||b.trigger?.maxTriggersPerWave!==1))throw Error('Speed is movement +2, not SCT');
 if(b.isBuff){if(!b.buffType||b.stacking!=='highest-active-buff-of-same-type-only'||[b.durationSeconds>0,b.endsOn==='incapacitated'].filter(Boolean).length!==1)throw Error('Race Buff lifetime or stacking lost');}
 else if(b.durationSeconds!==undefined||b.stacking!==undefined||b.endsOn&&b.operation!=='add-random-race')throw Error('Passive race effect acquired Buff lifetime');
}
