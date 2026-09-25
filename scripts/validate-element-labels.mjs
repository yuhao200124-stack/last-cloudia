// Shared validation for additional element passes; labels remain non-executable.
export const additionalElements = ['ice', 'earth', 'thunder', 'light', 'dark', 'neutral'];
export function validateElementCoverage(key, view, detail, assignment, entry) {
  const element = key === 'neutral' ? 'none' : key;
  const c = detail.coverage;
  if (view.passKind !== 'element-effects-and-condition' || detail.element !== element || !Array.isArray(c?.effectPartIds) || !Array.isArray(c?.conditionPartIds)) throw Error('Missing elemental coverage.');
  const ids = [...c.effectPartIds, ...c.conditionPartIds];
  if (new Set(ids).size !== ids.length || ids.length !== assignment.partIds.length || ids.some(id => !assignment.partIds.includes(id))) throw Error('Element coverage must match reviewed fragments.');
  if (c.effectPartIds.some(id => entry.parts.find(p => p.id === id)?.kind !== 'effect') || c.conditionPartIds.some(id => entry.parts.find(p => p.id === id)?.kind !== 'condition')) throw Error('Element effects and conditions are mixed.');
  if (c.conditionPartIds.some(id => !detail.effectConditions?.some(attached => attached.conditionPartIds.includes(id)))) {
    const t = detail.condition;
    const valid = ['self-attack', 'enemy-attack'].includes(t?.subject) && t.element === element
      || t?.subject === 'equipped-weapon' && t.weaponElement === element
      || t?.subject === 'target-enemy' && t.weakElement === element;
    if (!valid) throw Error('Attack, equipment and enemy-weakness element conditions must be distinct.');
  }
}
export function validateElementBinding(key, detail, assignment, b) {
  const element = key === 'neutral' ? 'none' : key;
  if (!['self', 'all-allies', 'allies-with-faith'].includes(b.target) || typeof b.isBuff !== 'boolean' || !b.operation) throw Error('Element recipient or operation missing.');
  if (b.elementRole === 'condition-benefit') {
    if (!detail.coverage.conditionPartIds.length || b.partIds.some(id => assignment.partIds.includes(id))) throw Error('Showing an elemental condition benefit must not complete its unrelated effect.');
    if (![b.scope?.element, b.scope?.triggerElement, b.scope?.equipment?.weaponElement, b.scope?.enemyWeakElement].includes(element)) throw Error('Element condition benefit scope missing.');
    if (b.scope.enemyWeakElement && Object.hasOwn(b.scope, 'element')) throw Error('Enemy weakness does not imply this attack element.');
  } else if (b.elementRole !== 'direct-effect' || b.scope?.element !== element || !['incoming', 'outgoing'].includes(b.scope.direction) || b.partIds.some(id => !detail.coverage.effectPartIds.includes(id))) throw Error('Only explicit elemental effect fragments may be covered.');
  if (b.operation === 'incoming-damage-down' && (b.scope.direction !== 'incoming' || b.changesResistance !== false)) throw Error('Damage reduction is distinct from resistance points.');
  if (b.operation === 'element-resistance-up' && (b.scope.direction !== 'incoming' || b.resistancePoints !== 20 || b.changesResistance !== true || Object.hasOwn(b, 'valuePercent'))) throw Error('Resistance must use points, not a damage multiplier.');
  if (b.operation === 'conditional-cap-up') {
    const condition = b.capCases?.[0]?.when;
    if (b.branches !== 'mutually-exclusive' || b.capCases?.length !== 2 || b.capCases[1].otherwise !== true || Object.hasOwn(b, 'capPoints') || !(condition?.weaponCount === 1 || JSON.stringify(condition?.weaponCountIn) === '[0,1]')) throw Error('Weapon-count cap branches must replace rather than stack.');
  }
  if (b.operation === 'tiered-damage-up' && (b.countMetric !== 'allies-with-same-skill' || b.minimumCount !== 2 || !b.requiredSkillId || b.tiers?.length !== 3 || Object.hasOwn(b, 'valuePercent'))) throw Error('Ensembles count same-skill users without assuming the maximum.');
  if (b.operation === 'random-damage-up' && (b.minValuePercent !== 10 || b.maxValuePercent !== 40 || b.distributionStatus !== 'unconfirmed' || Object.hasOwn(b, 'valuePercent') || b.scope.equipment?.weaponElement !== key || b.branchOperator !== 'or')) throw Error('Random damage must preserve its range and equipment/attack scopes.');
  if (b.operation === 'time-scaling-damage-up' && (b.curveStatus !== 'unconfirmed' || b.resetScope !== 'wave' || b.maxValuePercent !== 20 || ![30,90].includes(b.secondsToMaximum) || Object.hasOwn(b, 'valuePercent'))) throw Error('Wave scaling maxima are not opening bonuses.');
  if (b.operation === 'party-scaling-damage-up' && (b.tiersStatus !== 'unconfirmed' || b.maxCount !== 4 || Object.hasOwn(b, 'valuePercent'))) throw Error('Unknown party tiers must not assume the maximum.');
  if (b.operation === 'enable-critical' && (b.guaranteedCritical !== false || b.grantsCriticalEligibility !== true || b.scope.attackType !== 'attack-magic' || Object.hasOwn(b, 'ratePoints'))) throw Error('Magic critical permission is not guaranteed critical.');
  if (b.isBuff) {
    if (b.stacking !== 'highest-active-buff-of-same-type-only' || [b.durationSeconds > 0, b.lifetime === 'permanent', !!b.endsOn].filter(Boolean).length !== 1) throw Error('Buff lifetime and same-type limit required.');
    if (b.operation === 'incoming-damage-down' && b.buffType !== `received-${key}-damage-down`) throw Error('Wall type must match actual damage reduction.');
    if (b.activationMode === 'random-periodic-buff' && (b.selection !== 'random-one-of-six-walls' || b.requiredSelectedStatus !== ({ice:'thunder-wall',earth:'flame-wall',thunder:'stone-wall',light:'shadow-wall',dark:'holy-wall'})[key] || b.intervalSeconds !== 10 || b.durationSeconds !== 30 || b.activeByDefault !== false)) throw Error('Random wall interval, duration and selected status must remain distinct.');
  } else if (Object.hasOwn(b, 'durationSeconds') || Object.hasOwn(b, 'lifetime') || Object.hasOwn(b, 'stacking')) throw Error('Conditional passives are not timed Buffs.');
}
