export function validateSwordCoverage(view, detail, assignment, entry) {
  const c = detail.coverage;
  if (view.passKind !== 'equipment-permission-and-condition' || detail.equipmentType !== 'sword' || !Array.isArray(c?.permissionPartIds) || !Array.isArray(c?.conditionPartIds)) throw Error('Missing sword permission/condition coverage.');
  const ids = [...c.permissionPartIds, ...c.conditionPartIds];
  if (new Set(ids).size !== ids.length || ids.length !== assignment.partIds.length || ids.some(id => !assignment.partIds.includes(id))) throw Error('Sword coverage must match reviewed fragments.');
  if (c.permissionPartIds.some(id => entry.parts.find(p => p.id === id)?.kind !== 'effect') || c.conditionPartIds.some(id => entry.parts.find(p => p.id === id)?.kind !== 'condition')) throw Error('Sword permissions and conditions are mixed.');
  if (c.conditionPartIds.length && (detail.condition?.subject !== 'self-equipment' || detail.condition.requiredWeaponType !== 'sword' || detail.condition.minimumMatchingWeaponCount !== 1 || Object.hasOwn(detail.condition,'weaponCount'))) throw Error('Sword type must not cover weapon-count or paired-equipment conditions.');
}
export function validateSwordBinding(detail, assignment, b) {
  if (b.isBuff !== false || Object.hasOwn(b, 'durationSeconds') || !b.operation || b.perMatchingWeaponStacking !== false) throw Error('Sword passives and permissions are neither timed Buffs nor per-sword multipliers.');
  if (b.swordRole === 'permission-effect') {
    if (b.operation !== 'allow-weapon-type' || b.grantsWeaponType !== 'sword' || b.automaticallyEquipsWeapon !== false || b.scope?.equipment || b.partIds.some(id => !detail.coverage.permissionPartIds.includes(id))) throw Error('Sword permission does not automatically equip a sword.');
    return;
  }
  const e = b.scope?.equipment;
  if (b.swordRole !== 'condition-benefit' || b.partIds.some(id => assignment.partIds.includes(id)) || !detail.coverage.conditionPartIds.length || e?.weaponType !== 'sword' || e.minimumMatchingWeaponCount !== 1) throw Error('Sword groups must preserve conditions without completing other effect tags.');
  if (b.group.startsWith('single-') && e.weaponCount !== 1) throw Error('Single sword means exactly one total weapon.');
  if (b.group.startsWith('equipped-') && Object.hasOwn(e, 'weaponCount')) throw Error('Any equipped sword is not necessarily single wield.');
  if (b.group.startsWith('sword-claw-') && (e.weaponCount !== 2 || JSON.stringify(e.weaponTypesAllOf) !== '["sword","claw"]' || Object.hasOwn(e, 'sameElement'))) throw Error('Sword and claw require both types, without an invented same-element condition.');
  if (b.operation === 'equipment-stat-up' && (b.base !== 'equipped-item-stat' || !['equipped-sword','equipped-armor'].includes(b.target) || !['armor','clothes'].includes(e.armorType))) throw Error('Equipment stats are not final character stats.');
  if (b.operation === 'critical-rate-up' && (b.ratePoints !== 10 || b.grantsCriticalEligibility !== false || Object.hasOwn(b,'valuePercent'))) throw Error('Critical chance points do not grant magic critical eligibility.');
  if (b.group === 'single-matching-element-damage' && (b.scope.attackElementRelation !== 'same-as-equipped-sword' || Object.hasOwn(b.scope,'element'))) throw Error('Sword attribute matching must remain dynamic.');
  if (b.group.startsWith('fire-sword-') && (e.weaponElement !== 'fire' || Object.hasOwn(b.scope,'element'))) throw Error('Fire sword condition does not require a fire attack.');
  if (b.group === 'single-enemy-thunder-weak-cap' && (b.scope.enemyWeakElement !== 'thunder' || Object.hasOwn(b.scope,'element') || b.requiresAttackElement !== false || b.addsToPartId !== 'effect-1')) throw Error('Enemy thunder weakness is distinct from the attack element; the extra cap adds to its base clause.');
}
