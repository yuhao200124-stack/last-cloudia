export function validateTechniqueCoverage(view, detail, assignment, entry) {
  const c = detail.coverage;
  if (view.passKind !== 'technique-effects-and-condition' || !Array.isArray(c?.effectPartIds) || !Array.isArray(c?.conditionPartIds)) throw Error('Missing technique coverage.');
  const ids = [...c.effectPartIds, ...c.conditionPartIds];
  if (new Set(ids).size !== ids.length || ids.length !== assignment.partIds.length || ids.some(id => !assignment.partIds.includes(id))) throw Error('Technique coverage mismatch.');
  for (const [kind, list] of [['effect', c.effectPartIds], ['condition', c.conditionPartIds]]) if (list.some(id => entry.parts.find(p => p.id === id)?.kind !== kind)) throw Error('Technique fragment types mixed.');
  if (c.conditionPartIds.some(id => /待确认|尚待/.test(entry.parts.find(p => p.id === id).text))) throw Error('Unknown technique mechanisms cannot be marked complete.');
  if (c.effectPartIds.some(id => !detail.bindings.some(b => b.partIds.includes(id)))) throw Error('Technique effect lacks a binding.');
}

export function validateTechniqueBinding(detail, assignment, b) {
  if (!['self', 'paired-living-ally', 'target-enemy'].includes(b.target) || typeof b.isBuff !== 'boolean' || b.techniqueRole !== 'direct-effect' || !b.effectIdentity || !b.operation || !b.scope) throw Error('Technique semantics missing.');
  if (b.partIds.some(id => !detail.coverage.effectPartIds.includes(id))) throw Error('Technique must cover only its reviewed effects.');
  if (['damage-up','sct-speed-up','sct-speed-down','break-up','laceration-value-up'].includes(b.operation) && !(b.valuePercent > 0)) throw Error('Missing technique modifier magnitude.');
  if (b.operation === 'cap-up' && !(b.capPoints > 0)) throw Error('Cap must use points.');
  if (b.operation === 'conditional-cap-up' && (b.branches !== 'mutually-exclusive' || !b.capCases?.some(c => c.otherwise) || Object.hasOwn(b, 'capPoints') || b.scope.equipment || b.addsToPartId)) throw Error('Global cap branches must permit the fallback equipment state.');
  if (b.operation === 'consume-resource' && (!['HP','MP'].includes(b.resource) || b.costBase !== 'maximum-' + b.resource || b.costPercent !== (b.resource === 'HP' ? 15 : 3) || b.scope.skillKind !== 'attack' || b.isBuff)) throw Error('Attack-skill cost base or scope is incorrect.');
  if (b.operation === 'restore-sct-seconds' && (!(b.restoreSeconds > 0) || b.restoreStocks !== undefined || b.resource !== 'SCT')) throw Error('SCT seconds must not become stocks.');
  if (b.operation === 'restore-sct-stocks' && (b.restoreStocks !== 1 || !['all','random-one'].includes(b.skillSelection) || b.restoreSeconds !== undefined)) throw Error('One SCT stock is not one second or maximum stock.');
  if (b.operation === 'restore-sct-full' && (b.skillSelection !== 'all' || b.fillTo !== 'each-skill-maximum-stock' || b.restoreSeconds !== undefined)) throw Error('Full SCT refill must fill all stocks.');
  if (b.operation === 'restore-stocks-from-ally' && (b.amountSource !== 'incapacitated-ally-stocks' || b.mapping !== 'corresponding-skill-slot' || b.restoreSeconds !== undefined || b.target !== 'self')) throw Error('Inherited stocks must preserve their source and recipient.');
  if (b.operation === 'stock-limit-up' && (b.stocks !== 1 || b.immediatelyRestoresStocks !== false || b.scope.resource !== 'skill-stock')) throw Error('Stock capacity is not immediate recovery.');
  if (b.target === 'paired-living-ally' && (b.restoreSeconds !== 15 || b.pair?.otherEquippedCount !== 1 || b.pair.targetMustBeAlive !== true || b.resetScope !== 'pair' || b.maxTriggers !== 1 || b.trigger?.actor !== 'self')) throw Error('Dear Hearts must preserve its pairing, recipient and shared use limit.');
  if (b.operation === 'disable-skills' && (b.lockSeconds !== 30 || b.trigger?.event !== 'battle-start' || b.valuePercent !== undefined)) throw Error('Initial skill lock is not damage Buff duration.');
  if (b.operation === 'reduce-enemy-hp' && (b.target !== 'target-enemy' || b.hpBase !== 'target-maximum-HP' || b.hpLossPercent !== 15 || b.hpLossCapPoints !== 30000000 || b.scope.attackType !== 'laceration')) throw Error('Laceration HP loss is not skill damage percentage.');
  if (b.operation === 'accumulate-laceration' && (b.per !== 'skill-activation' || b.amountStatus !== 'unconfirmed' || b.thresholdStatus !== 'unconfirmed')) throw Error('Laceration thresholds cannot be invented.');
  if (b.operation === 'laceration-value-up' && (b.grantsLacerationSource !== false || b.hpLossPercent !== undefined)) throw Error('Laceration accumulation increase does not grant the source or increase HP loss.');
  if (b.operation === 'random-damage-up' && (b.distributionStatus !== 'unconfirmed' || b.valuePercent !== undefined)) throw Error('Random skill damage cannot use its maximum as a fixed value.');
  if (['stock-scaled-damage-up','kill-scaled-damage-up','team-scaled-damage-up','distance-damage-up'].includes(b.operation) && (b.valuePercent !== undefined || !(b.maxValuePercent > 0))) throw Error('Scaling damage needs a bound, not a fixed current bonus.');
  if (b.operation === 'distance-cap-up' && (b.capPoints !== undefined || b.scaling?.curveStatus !== 'unconfirmed')) throw Error('Distance cap cannot assume maximum.');
  if (b.isBuff) {
    if (!b.buffType || b.stacking !== 'highest-active-buff-of-same-type-only') throw Error('SCT/skill Buff type and exclusivity required.');
    if (b.activationMode === 'permanent-status') {
      if (b.lifetime !== 'permanent' || b.durationSeconds !== undefined) throw Error('Permanent Haste has no fixed timer.');
    } else if (b.activationMode === 'next-use-buff') {
      if (b.uses !== 1 || b.grantIntervalSeconds !== 10 || b.chanceStatus !== 'unconfirmed' || b.durationSeconds !== undefined || b.activeByDefault !== false) throw Error('Periodic chance is not an always-active 10-second Buff.');
    } else if (b.activationMode === 'moving-charge-buff') {
      if (b.progressionWithinOneBuff !== true || b.stepPercent !== 10 || b.maxValuePercent !== 100 || b.endsOn !== 'skill-attack-or-timeout' || b.durationStatus !== 'unconfirmed' || b.valuePercent !== undefined) throw Error('Movement strengthens one Buff; it does not stack independent Buffs.');
    } else if (b.activationMode !== 'triggered-buff' || b.durationSeconds !== 40) throw Error('Missing 40-second triggered Buff duration.');
  } else if (['stacking','durationSeconds','lifetime','endsOn'].some(k => Object.hasOwn(b,k))) throw Error('Passive technique effects must not gain Buff lifetimes.');
}
