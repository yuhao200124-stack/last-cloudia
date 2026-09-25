import {validateMatchingElement} from './validate-classification-supplements.mjs';
export const equipmentStateKeys=['single-weapon','dual-weapon','empty-weapon','empty-armor','empty-gear'];
const stateFor=k=>k==='single-weapon'?{weaponCount:1}:k==='dual-weapon'?{weaponCount:2}:k==='empty-weapon'?{weaponCount:0}:k==='empty-armor'?{armorCount:0}:{weaponCount:0,armorCount:0};
export function validateEquipmentStateCoverage(key,view,detail,assignment,entry){
 const c=detail.coverage,ids=[...(c?.permissionPartIds||[]),...(c?.effectPartIds||[]),...(c?.conditionPartIds||[])];
 if(view.passKind!=='equipment-state-and-permission'||!Array.isArray(c?.permissionPartIds)||!Array.isArray(c?.conditionPartIds)||new Set(ids).size!==ids.length||ids.length!==assignment.partIds.length||ids.some(id=>!assignment.partIds.includes(id)))throw Error('Equipment-state coverage mismatch.');
 if(c.permissionPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='effect')||c.conditionPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='condition'))throw Error('Permission and state fragments are mixed.');
 if(detail.condition?.subject!=='self-equipment'||Object.entries(stateFor(key)).some(([k,v])=>detail.condition[k]!==v))throw Error('Missing exact equipment-state predicate.');
 if(key==='empty-armor'&&Object.hasOwn(detail.condition,'weaponCount'))throw Error('No armor does not require no weapons.');
 if(key==='empty-weapon'&&Object.hasOwn(detail.condition,'armorCount'))throw Error('No weapons does not require no armor.');
}
export function validateEquipmentStateBinding(key,detail,assignment,b){
 validateMatchingElement(detail,assignment,b);
 if(b.isBuff!==false||Object.hasOwn(b,'durationSeconds')||!b.operation||b.effectStacking!=='once-per-skill')throw Error('Equipment state is not a timed Buff.');
 if(b.equipmentRole==='permission-effect'){
  if(key!=='dual-weapon'||b.operation!=='allow-weapon-in-armor-slot'||b.slot!=='armor'||b.allows!=='weapon'||b.automaticallyEquipsWeapon!==false||b.scope?.equipment||b.partIds.some(id=>!detail.coverage.permissionPartIds.includes(id)))throw Error('Dual permission is not actual dual equipment.');return;
 }
 if(b.equipmentRole!=='condition-benefit'||(!b.matchingElementReviewed&&b.partIds.some(id=>assignment.partIds.includes(id)))||Object.entries(stateFor(key)).some(([k,v])=>b.scope?.equipment?.[k]!==v))throw Error('Bindings preserve exact state and cannot cover unrelated effects.');
 if(b.group.startsWith('both-empty-')&&(b.scope.equipment.weaponCount!==0||b.scope.equipment.armorCount!==0))throw Error('Both empty requires AND conditions.');
 if(b.scope.equipment.sameWeaponType&&Object.hasOwn(b.scope.equipment,'sameWeaponElement'))throw Error('Same weapon type does not imply same element.');
 if(b.scope.equipment.sameWeaponElement&&(Object.hasOwn(b.scope.equipment,'sameWeaponType')||b.scope.attackElementRelation!=='same-as-both-equipped-weapons'))throw Error('Same element must preserve attack matching without a type restriction.');
 if(b.operation==='conditional-cap-up'){
  if(b.branches!=='mutually-exclusive'||!b.capCases?.length||Object.hasOwn(b,'capPoints'))throw Error('Cap branches replace rather than add.');
  const conditional=b.capCases.find(c=>!c.otherwise);if(!(conditional?.capPoints>0)||!b.capCases.some(c=>c.otherwise))throw Error('Missing cap fallback.');
 }
 if(b.addsToPartId&&b.operation==='conditional-cap-up')throw Error('Additive and replacement caps are distinct.');
 if(b.operation==='damage-reduction'&&b.scope.direction!=='incoming')throw Error('Incoming reduction must not become outgoing damage.');
 if(b.operation==='equipment-stat-up'&&(b.base!=='equipped-item-stat'||b.target!=='each-equipped-weapon'||b.requiresDualForBaseEffect!==false))throw Error('Dual application does not make a general equipment bonus dual-only.');
 if(b.operation==='hit-count-multiplier'&&(b.hitMultiplier!==2||b.scope.attackType!=='physical'))throw Error('Dual wield changes physical hits only.');
 if(b.operation==='hit-damage-multiplier'&&(b.damageMultiplier!==0.6||b.scope.attackType!=='physical'))throw Error('Dual wield per-hit damage remains 60%.');
}
