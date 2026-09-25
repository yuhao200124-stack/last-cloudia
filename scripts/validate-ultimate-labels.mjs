// Ultimate review metadata. No values from this catalog execute in the calculator.
export function validateUltimateCoverage(view, detail, assignment, entry) {
  const c = detail.coverage;
  if (view.passKind !== 'ultimate-effects-and-condition' || !Array.isArray(c?.effectPartIds) || !Array.isArray(c?.conditionPartIds)) throw Error('Missing ultimate coverage.');
  const ids = [...c.effectPartIds, ...c.conditionPartIds];
  if (new Set(ids).size !== ids.length || ids.length !== assignment.partIds.length || ids.some(id => !assignment.partIds.includes(id))) throw Error('Ultimate coverage mismatch.');
  for (const [kind, covered] of [['effect', c.effectPartIds], ['condition', c.conditionPartIds]]) {
    if (covered.some(id => entry.parts.find(p => p.id === id)?.kind !== kind)) throw Error('Ultimate fragment types mixed.');
  }
  if (c.conditionPartIds.some(id => /待确认|尚待/.test(entry.parts.find(p => p.id === id).text))) throw Error('Unknown mechanisms cannot be marked complete.');
  if (c.effectPartIds.some(id => !detail.bindings.some(b => b.partIds.includes(id)))) throw Error('Ultimate effect lacks a binding.');
  const condition = detail.condition;
  if (!condition) return;
  if (!['ultimate-use', 'ultimate-gauge-full', 'next-ultimate-use'].includes(condition.mode) || !['self', 'enemy'].includes(condition.subject)) throw Error('Invalid ultimate actor or condition.');
  if (condition.mode === 'ultimate-gauge-full' && (condition.subject !== 'self' || condition.metric !== 'current-ultimate-gauge-percent' || condition.operator !== 'eq' || condition.thresholdPercent !== 100)) throw Error('Ultimate gauge must be currently full.');
  if (condition.mode !== 'ultimate-gauge-full' && condition.event !== 'ultimate-used') throw Error('Missing ultimate event.');
  if (condition.mode === 'next-ultimate-use' && (condition.subject !== 'self' || condition.requiresActiveBuff !== true)) throw Error('Next ultimate requires an active Buff.');
  if (condition.alternativeEvents && (condition.operator !== 'or' || !condition.alternativeEvents.some(e => ['ultimate-used', 'ice-ultimate-used'].includes(e)))) throw Error('Ultimate alternatives must remain OR.');
}

export function validateUltimateBinding(detail, assignment, b) {
  if (b.target !== 'self' || typeof b.isBuff !== 'boolean' || b.ultimateRole !== 'direct-effect' || !b.effectIdentity || !b.operation) throw Error('Missing ultimate binding semantics.');
  if (b.partIds.some(id => !detail.coverage.effectPartIds.includes(id))) throw Error('Ultimate binding must cover the reviewed effect.');
  if (!['outgoing', 'incoming', 'resource'].includes(b.scope?.direction)) throw Error('Ultimate direction missing.');
  if (['damage-up', 'incoming-damage-down', 'incoming-damage-up'].includes(b.operation) && !(b.valuePercent > 0)) throw Error('Damage modifier requires a positive magnitude.');
  if (b.operation.startsWith('incoming-') && b.scope.direction !== 'incoming') throw Error('Incoming damage is not outgoing damage.');
  if (b.operation === 'cap-up' && !(b.capPoints > 0)) throw Error('Cap requires points.');
  if (b.operation === 'conditional-cap-up' && (b.branches !== 'mutually-exclusive' || !b.capCases?.length || Object.hasOwn(b, 'capPoints') || b.addsToPartId)) throw Error('Replacement caps must preserve mutually exclusive cases.');
  if (b.operation === 'random-damage-up' && (!(b.maxPercent >= b.minPercent) || b.distributionStatus !== 'unconfirmed' || Object.hasOwn(b, 'valuePercent'))) throw Error('Random damage cannot assume maximum or average.');
  if (b.operation === 'count-scaled-cap-up' && (!(b.capPerUnit > 0) || !(b.count?.maxCount > 0) || b.maxCapPoints !== b.capPerUnit * b.count.maxCount || Object.hasOwn(b, 'capPoints'))) throw Error('Count-based caps must not assume maximum.');
  if (b.operation === 'tiered-cap-up' && (!b.requiredSkillId || b.minimumCount !== 2 || b.tiers?.length !== 3 || Object.hasOwn(b, 'capPoints'))) throw Error('Team tiers require actual equipped skill counts.');
  if (b.operation === 'enable-killer' && (b.grantsKillerEligibility !== true || b.doesNotGrantRace !== true || !b.scope.enemyRace || Object.hasOwn(b, 'valuePercent'))) throw Error('Killer eligibility is not unconditional damage or added race.');
  if (b.operation === 'enable-critical' && (b.grantsCriticalEligibility !== true || b.guaranteedCritical !== false || Object.hasOwn(b, 'ratePoints'))) throw Error('Critical permission is not guaranteed critical or rate.');
  if (b.operation === 'restore-ultimate-gauge' && (b.resource !== 'ultimate-gauge' || b.restoreBase !== 'maximum-ultimate-gauge' || b.restorePercent !== 10 || b.trigger?.event !== 'boss-wave-start')) throw Error('Gauge recovery must preserve its resource, base and trigger.');
  if (b.operation === 'gauge-speed-down' && (b.valueStatus !== 'unconfirmed' || Object.hasOwn(b, 'valuePercent'))) throw Error('Unconfirmed gauge speed must not get an invented percentage.');
  if (b.operation === 'restore-sct' && (b.selection !== 'random-one-skill' || b.restoreUses !== 1 || b.restoreSeconds !== undefined)) throw Error('Random SCT recovery is one stock, not seconds or all skills.');
  if (b.operation === 'consume-mp' && (b.costBase !== 'maximum-MP' || b.costPercent !== 20 || b.isBuff)) throw Error('Ultimate MP cost uses maximum MP.');
  if (b.activationMode === 'ultimate-gauge-full' && (b.phase !== 'current-state' || b.isBuff)) throw Error('Full gauge bonuses are current-state conditions.');
  if (b.activationMode === 'per-ultimate-stat-reference' && (b.isBuff || b.phase !== 'damage-calculation' || b.referenceTarget !== 'self' || b.referenceStat !== 'STR')) throw Error('STR reference is not ultimate damage percentage.');
  if (b.isBuff) {
    if (!b.buffType || b.stacking !== 'highest-active-buff-of-same-type-only') throw Error('Buff identity and same-type exclusivity required.');
    if (b.activationMode === 'next-use-buff') {
      if (b.uses !== 1 || b.grantIntervalSeconds !== 20 || Object.hasOwn(b, 'durationSeconds')) throw Error('Grant interval is not Buff duration.');
    } else if (b.activationMode === 'delayed-buff') {
      if (b.trigger?.delaySeconds !== 40 || b.trigger.retryWhenIncapacitatedSeconds !== 40 || b.endsOn !== 'incapacitated' || Object.hasOwn(b, 'durationSeconds')) throw Error('Delayed ultimate Buff ends on death.');
    } else if (b.activationMode !== 'triggered-buff' || !((b.durationSeconds > 0 && !b.durationStatus) || (b.durationStatus === 'unconfirmed' && !Object.hasOwn(b, 'durationSeconds')))) throw Error('Triggered Buff duration missing.');
  } else if (['durationSeconds', 'durationStatus', 'stacking', 'endsOn'].some(key => Object.hasOwn(b, key))) throw Error('Passive effects must not become Buffs.');
}
