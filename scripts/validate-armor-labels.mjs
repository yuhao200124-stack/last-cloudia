export const armorTypes=['armor','clothes','robe'];
const armorNames={armor:'盔甲',clothes:'衣服',robe:'长袍'};
export function validateArmorCoverage(key,view,d,a,e){
 const c=d.coverage;
 if(!armorTypes.includes(key)||view.passKind!=='equipment-permission-and-condition'||d.equipmentType!==key||!Array.isArray(c?.permissionPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing armor coverage');
 const ids=[...c.permissionPartIds,...c.conditionPartIds];if(new Set(ids).size!==ids.length||ids.length!==a.partIds.length||ids.some(id=>!a.partIds.includes(id)))throw Error('Armor coverage mismatch');
 if(c.permissionPartIds.some(id=>e.parts.find(p=>p.id===id)?.kind!=='effect')||c.conditionPartIds.some(id=>e.parts.find(p=>p.id===id)?.kind!=='condition'))throw Error('Armor permissions and conditions mixed');
 if(c.permissionPartIds.some(id=>!d.bindings.some(b=>b.armorRole==='permission-effect'&&b.operation==='allow-armor-type'&&b.partIds.includes(id))))throw Error('Only equip permission effects can be covered');
 const q=d.condition;if(c.conditionPartIds.length){
  if(c.conditionPartIds.length!==1||q?.subject!=='self-equipment'||q.requiresActuallyEquipped!==true||q.armorSlotWeaponQualifies!==false)throw Error('Armor requires actual equipment');
  const common=q.mode==='any-armor-equipped';
  if(common?(JSON.stringify(q.armorTypesAnyOf)!==JSON.stringify(armorTypes)||q.logicalOperator!=='OR'||q.requiredArmorType!==undefined):(q.mode!=='armor-type-equipped'||q.requiredArmorType!==key||q.armorTypesAnyOf!==undefined))throw Error('Any armor is OR; a specific armor type is distinct');
  const p=e.parts.find(p=>p.id===c.conditionPartIds[0]);if(!p.text.includes(common?'防具':armorNames[key])||/未装备|参照|增加的是|待确认|数值计算/.test(p.text))throw Error('Armor tag cannot complete empty state or calculation mechanisms');
 }else if(q)throw Error('Permission alone cannot imply actual equipment');
 if(new Set(d.bindings.map(b=>b.effectIdentity)).size!==d.bindings.length)throw Error('Armor effect display duplicated');
}
export function validateArmorBinding(key,d,a,b){
 if(b.isBuff!==false||b.durationSeconds!==undefined||b.stacking!==undefined||b.perMatchingArmorStacking!==false||b.effectStacking!=='once-per-skill'||!b.effectIdentity||!b.operation)throw Error('Armor permissions and current equipment are not timed or repeated buffs');
 if(b.armorRole==='permission-effect'){
  if(b.operation!=='allow-armor-type'||b.grantsArmorType!==key||b.automaticallyEquipsArmor!==false||b.scope?.equipment||b.partIds.some(id=>!d.coverage.permissionPartIds.includes(id)))throw Error('Armor permission does not equip an armor');return;
 }
 if(b.armorRole!=='condition-benefit'||b.partIds.some(id=>a.partIds.includes(id))||!d.coverage.conditionPartIds.length)throw Error('Displaying armor benefits cannot complete other effect tags');
 const q=b.scope?.equipment,common=b.applicability==='any-armor';
 if(q?.requiresActuallyEquipped!==true||(common?(q.armorType!==undefined||JSON.stringify(q.armorTypesAnyOf)!==JSON.stringify(armorTypes)||q.armorSlotWeaponQualifies!==false):(b.applicability!=='specific-armor'||q.armorType!==key||q.armorTypesAnyOf!==undefined)))throw Error('Wrong actual armor scope');
 if(b.operation==='equipment-stat-up'&&(b.base!=='equipped-item-stat'||!q.weaponType||q.minimumMatchingWeaponCount!==1||q.weaponCount!==undefined||b.pairedEquipmentLogicalOperator!=='AND'||![`equipped-${q.weaponType}`,'equipped-armor'].includes(b.target)))throw Error('Paired equipment modifies item stats and requires both types');
 if(b.operation==='stat-up'&&(b.target!=='self'||!['STR','DEF','MND','HP'].includes(b.stat)||!(b.valuePercent>0)||b.base==='equipped-item-stat'))throw Error('Character armor stats are not equipment item stats');
 if(b.operation==='damage-up'&&(b.scope.direction!=='outgoing'||!['physical','attack-magic'].includes(b.scope.attackType)||!(b.valuePercent>0)))throw Error('Armor damage must keep its attack type');
 if(b.operation==='incoming-damage-down'&&(b.scope.direction!=='incoming'||!['physical','attack-magic','ultimate','unspecified'].includes(b.scope.attackType)||!(b.valuePercent>0)))throw Error('Armor reductions must keep incoming attack type');
 if(b.group==='boss-reduction'&&(b.scope.attackerType!=='boss'||b.scope.attackType!=='unspecified'||b.scope.enemyType!==undefined))throw Error('Boss armor reduction depends on attacker, not target');
 if(b.operation==='status-resistance-up'&&(!common||!['blindness','silence','poison','curse','paralysis'].includes(b.scope.status)||b.resistanceSteps!==1||b.valuePercent!==undefined||b.guaranteesImmunity!==false))throw Error('Status resistance +1 is not percent or guaranteed immunity');
 if(b.operation==='healing-received-up'&&(key!=='clothes'||b.scope.direction!=='incoming-healing'||b.scope.healingSource!=='active-skill'||b.valuePercent!==10||b.trigger?.event!=='active-hp-recovery-received'||b.increasesHealingDealt!==false||b.appliesToPassiveRegeneration!==false))throw Error('New Year Outfit improves received active healing');
 if(b.operation==='add-stat-reference'&&(key!=='robe'||b.stat!=='INT'||b.referenceStat!=='MND'||b.referencePercent!==10||b.referenceBase!=='self-MND-at-battle-start'||b.referenceIsConsumed!==false||b.changesReferenceStat!==false||b.trigger?.event!=='battle-start'||b.valuePercent!==undefined))throw Error('Robe opening MND addition is not INT percent or MND loss');
}
