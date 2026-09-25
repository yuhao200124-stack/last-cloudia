import {validateMatchingElement} from './validate-classification-supplements.mjs';
export const additionalWeapons = ['axe','spear','hammer','bow','machine','claw','staff'];

export function validateWeaponCoverage(key, view, detail, assignment, entry) {
  const c=detail.coverage;
  if (!additionalWeapons.includes(key) || view.passKind!=='equipment-permission-and-condition' || detail.equipmentType!==key || !Array.isArray(c?.permissionPartIds) || !Array.isArray(c?.conditionPartIds)) throw Error('Missing weapon coverage.');
  const ids=[...c.permissionPartIds,...(c.effectPartIds||[]),...c.conditionPartIds];
  if (new Set(ids).size!==ids.length || ids.length!==assignment.partIds.length || ids.some(id=>!assignment.partIds.includes(id))) throw Error('Weapon coverage must match reviewed fragments.');
  if (c.permissionPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='effect') || c.conditionPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='condition')) throw Error('Weapon permissions and conditions are mixed.');
  const condition=detail.condition;
  if (c.conditionPartIds.length && (condition?.subject!=='self-equipment' || condition.requiredWeaponType!==key || condition.minimumMatchingWeaponCount!==1 || Object.hasOwn(condition,'weaponCount'))) throw Error('Weapon type must not cover weapon count or armor type.');
  if (condition?.mode==='allowed-weapon-type-branch') {
    if (condition.logicalOperator!=='OR' || condition.alternativeGroup!=='weapon-type-choice' || JSON.stringify(condition.allowedWeaponTypesAnyOf)!=='["axe","spear","machine"]') throw Error('Alternative weapons are OR branches.');
    for(const id of c.conditionPartIds.filter(id=>!detail.matchingElementReview?.conditionPartIds.includes(id))){const part=entry.parts.find(p=>p.id===id);if(part.alternativeGroup!==condition.alternativeGroup || part.logicalOperator!=='OR' || part.weaponType!==key)throw Error('Missing alternative weapon branch.');}
  }
}

export function validateWeaponBinding(key, detail, assignment, b) {
  validateMatchingElement(detail,assignment,b);
  if (b.isBuff!==false || Object.hasOwn(b,'durationSeconds') || !b.operation || b.perMatchingWeaponStacking!==false) throw Error('Weapon effects are not timed or per-weapon Buffs.');
  if (b.weaponRole==='permission-effect') {
    if (b.operation!=='allow-weapon-type' || b.grantsWeaponType!==key || b.automaticallyEquipsWeapon!==false || b.scope?.equipment || b.partIds.some(id=>!detail.coverage.permissionPartIds.includes(id))) throw Error('Permission is distinct from actual equipment.');
    return;
  }
  const e=b.scope?.equipment;
  if (b.weaponRole!=='condition-benefit' || (!b.matchingElementReviewed&&b.partIds.some(id=>assignment.partIds.includes(id))) || !detail.coverage.conditionPartIds.length || e?.weaponType!==key || e.minimumMatchingWeaponCount!==1) throw Error('Weapon groups cannot complete other effects.');
  if (b.group.startsWith('single-') && e.weaponCount!==1) throw Error('Single weapon requires exactly one total weapon.');
  if (b.group.startsWith('equipped-') && Object.hasOwn(e,'weaponCount')) throw Error('Equipped weapon has no implicit single-wield requirement.');
  if (b.group.startsWith('sword-claw-') && (key!=='claw' || e.weaponCount!==2 || JSON.stringify(e.weaponTypesAllOf)!=='["sword","claw"]' || Object.hasOwn(e,'sameElement'))) throw Error('Sword and claw require both types.');
  if (b.operation==='equipment-stat-up' && (b.base!=='equipped-item-stat' || !['equipped-'+key,'equipped-armor'].includes(b.target) || !['armor','clothes','robe'].includes(e.armorType))) throw Error('Equipment stats are not final character stats.');
  if (b.operation==='critical-rate-up' && (b.ratePoints!==10 || b.grantsCriticalEligibility!==false || Object.hasOwn(b,'valuePercent'))) throw Error('Critical rate uses percentage points.');
  if (b.group.includes('critical-damage') && (!b.requiresCriticalHit || b.grantsCriticalEligibility!==false || b.scope.attackType!==(b.group.includes('physical-critical')?'physical':'unspecified'))) throw Error('Critical damage must preserve its attack scope.');
  if (b.operation==='damage-reduction' && b.scope.direction!=='incoming') throw Error('Damage reduction applies to incoming attacks.');
  if (b.operation==='enemy-defense-reference-reduction' && (key!=='machine' || b.target!=='target-enemy' || b.base!=='enemy-DEF-for-this-hit' || b.appliesPersistentDebuff!==false || b.scope.attackType!=='physical')) throw Error('DEF reference is neither self DEF nor a persistent debuff.');
  if (b.operation==='add-stat-reference' && (key!=='machine' || b.stat!=='STR' || b.referenceStat!=='INT' || b.referencePercent!==10 || b.trigger?.event!=='battle-start')) throw Error('Opening INT-to-STR addition must preserve its reference.');
  if (b.group==='single-matching-element-damage' && (b.scope.attackElementRelation!=='same-as-equipped-weapon' || Object.hasOwn(b.scope,'element') || b.effectStacking!=='once-per-skill' || !b.effectIdentity || b.weaponBranch!==key || JSON.stringify(e.weaponTypesAnyOf)!=='["axe","spear","machine"]')) throw Error('Dynamic attribute matching has one shared effect across alternative weapons.');
  if (b.group==='single-killer-damage' && (b.scope.requiresKillerHit!==true || Object.hasOwn(b.scope,'requiresElementWeakHit'))) throw Error('Killer hit is a distinct branch.');
  if (b.group==='single-weak-element-damage' && (b.scope.requiresElementWeakHit!==true || Object.hasOwn(b.scope,'requiresKillerHit'))) throw Error('Element weakness is a distinct branch.');
}

export function validateSwordCoverage(view, detail, assignment, entry) {
  const c = detail.coverage;
  if (view.passKind !== 'equipment-permission-and-condition' || detail.equipmentType !== 'sword' || !Array.isArray(c?.permissionPartIds) || !Array.isArray(c?.conditionPartIds)) throw Error('Missing sword permission/condition coverage.');
  const ids = [...c.permissionPartIds, ...(c.effectPartIds||[]), ...c.conditionPartIds];
  if (new Set(ids).size !== ids.length || ids.length !== assignment.partIds.length || ids.some(id => !assignment.partIds.includes(id))) throw Error('Sword coverage must match reviewed fragments.');
  if (c.permissionPartIds.some(id => entry.parts.find(p => p.id === id)?.kind !== 'effect') || c.conditionPartIds.some(id => entry.parts.find(p => p.id === id)?.kind !== 'condition')) throw Error('Sword permissions and conditions are mixed.');
  if (c.conditionPartIds.length && (detail.condition?.subject !== 'self-equipment' || detail.condition.requiredWeaponType !== 'sword' || detail.condition.minimumMatchingWeaponCount !== 1 || Object.hasOwn(detail.condition,'weaponCount'))) throw Error('Sword type must not cover weapon-count or paired-equipment conditions.');
}
export function validateSwordBinding(detail, assignment, b) {
  validateMatchingElement(detail,assignment,b);
  if (b.isBuff !== false || Object.hasOwn(b, 'durationSeconds') || !b.operation || b.perMatchingWeaponStacking !== false) throw Error('Sword passives and permissions are neither timed Buffs nor per-sword multipliers.');
  if (b.swordRole === 'permission-effect') {
    if (b.operation !== 'allow-weapon-type' || b.grantsWeaponType !== 'sword' || b.automaticallyEquipsWeapon !== false || b.scope?.equipment || b.partIds.some(id => !detail.coverage.permissionPartIds.includes(id))) throw Error('Sword permission does not automatically equip a sword.');
    return;
  }
  const e = b.scope?.equipment;
  if (b.swordRole !== 'condition-benefit' || (!b.matchingElementReviewed&&b.partIds.some(id => assignment.partIds.includes(id))) || !detail.coverage.conditionPartIds.length || e?.weaponType !== 'sword' || e.minimumMatchingWeaponCount !== 1) throw Error('Sword groups must preserve conditions without completing other effect tags.');
  if (b.group.startsWith('single-') && e.weaponCount !== 1) throw Error('Single sword means exactly one total weapon.');
  if (b.group.startsWith('equipped-') && Object.hasOwn(e, 'weaponCount')) throw Error('Any equipped sword is not necessarily single wield.');
  if (b.group.startsWith('sword-claw-') && (e.weaponCount !== 2 || JSON.stringify(e.weaponTypesAllOf) !== '["sword","claw"]' || Object.hasOwn(e, 'sameElement'))) throw Error('Sword and claw require both types, without an invented same-element condition.');
  if (b.operation === 'equipment-stat-up' && (b.base !== 'equipped-item-stat' || !['equipped-sword','equipped-armor'].includes(b.target) || !['armor','clothes'].includes(e.armorType))) throw Error('Equipment stats are not final character stats.');
  if (b.operation === 'critical-rate-up' && (b.ratePoints !== 10 || b.grantsCriticalEligibility !== false || Object.hasOwn(b,'valuePercent'))) throw Error('Critical chance points do not grant magic critical eligibility.');
  if (b.group === 'single-matching-element-damage' && (b.scope.attackElementRelation !== 'same-as-equipped-sword' || Object.hasOwn(b.scope,'element'))) throw Error('Sword attribute matching must remain dynamic.');
  if (b.group.startsWith('fire-sword-') && (e.weaponElement !== 'fire' || Object.hasOwn(b.scope,'element'))) throw Error('Fire sword condition does not require a fire attack.');
  if (b.group === 'single-enemy-thunder-weak-cap' && (b.scope.enemyWeakElement !== 'thunder' || Object.hasOwn(b.scope,'element') || b.requiresAttackElement !== false || b.addsToPartId !== 'effect-1')) throw Error('Enemy thunder weakness is distinct from the attack element; the extra cap adds to its base clause.');
}
