import {validateRemainingCoverage,validateRemainingBinding} from './validate-remaining-labels.mjs';
export const supplementTags={'equipment-stat':'装备自身数值强化',grounded:'地面状态','self-incapacitated':'自身倒下／战斗不能'};
export const supplementKeys=Object.keys(supplementTags);
export function validateClassificationContext(tag,d,a,b){
 const c=b.classificationContext;if(!c)return;
 if(!b.operation||!b.effectIdentity||!b.sourceClause||!b.scope||!b.target||b.partIds.some(id=>!a.partIds.includes(id)))throw Error('Unreviewed contextual effect');
 if(c.kind==='associated-drawback'){
  if(c.isBenefit!==false||!c.benefitPartIds?.length||c.benefitPartIds.some(id=>!a.partIds.includes(id)||b.partIds.includes(id))||b.operation!=='incoming-damage-up'||b.scope.direction!=='incoming'||!['unspecified','physical','ultimate'].includes(b.scope.attackType)||!(b.valuePercent>0)||b.target!=='self')throw Error('A drawback must retain incoming scope and its actual associated benefit');
  if(b.isDebuff&&(b.appliedDurationSeconds!==20||b.trigger?.event!=='wave-start'))throw Error('Opening vulnerability keeps its own 20-second duration');
 }else if(c.kind==='stat-source'){
  const allowed={'物理':'STR','魔法':'INT','防御':'DEF','魔抗':'MND'};
  if(!c.sourceStats?.includes(allowed[tag])||!c.destination||c.changesFinalSourceStat!==false||b.isBuff!==false)throw Error('Classify a reference by its source without changing final source stats');
  if(c.mode==='scaling'&&(b.formulaStatus!=='unconfirmed'||b.valuePercent!==undefined))throw Error('Unknown conversion formula cannot become a flat percentage');
  if(c.mode==='addition'&&(!(b.referencePercent>0)||b.changesReferenceStat!==false||b.referenceIsConsumed!==false||b.valuePercent!==undefined))throw Error('Reference addition is neither a source cost nor destination percentage');
  if(c.mode==='lost-value-addition'&&(b.additionBase!=='actual-decreased-values-sum'||JSON.stringify(b.sourceDecreasePercent)!=='{"DEF":10,"MND":10}'||b.valuePercent!==undefined))throw Error('Convert the actual DEF/MND losses, not an attack percentage');
  if(c.mode==='comparison'&&(b.comparison?.left!=='STR'||b.comparison.right!=='INT'||!['gte','lt'].includes(b.comparison.operator)||b.comparison.snapshot!=='wave-start'||b.comparison.branchesMutuallyExclusive!==true))throw Error('Comparison branches must partition equality at wave start');
  if(!['scaling','addition','lost-value-addition','comparison','per-hit'].includes(c.mode))throw Error('Unknown stat reference mode');
 }else throw Error('Unknown classification context');
}
export function validateMatchingElement(d,a,b){
 const c=d.matchingElementReview;if(!b.matchingElementReviewed)return;
 if(!c||c.dynamicElement!==true||c.numericEffectInjection!==false||!c.conditionPartIds?.includes('attack-matches-weapon-element')||!a.partIds.includes('attack-matches-weapon-element'))throw Error('Missing dynamic weapon/attack element review');
 if(b.scope.element!==undefined||!['same-as-equipped-sword','same-as-equipped-weapon','same-as-both-equipped-weapons'].includes(b.scope.attackElementRelation)||![1,2].includes(b.scope.equipment?.weaponCount))throw Error('Dynamic matching must preserve actual weapon count and element relation');
 if(c.effectPartIds.some(id=>!a.partIds.includes(id))||!b.effectIdentity)throw Error('Missing reviewed matching effect');
 if(b.scope.equipment.weaponCount===2&&(b.scope.equipment.sameWeaponElement!==true||!['skill','ultimate'].includes(b.scope.attackType)))throw Error('Two-weapon matching requires equal weapon elements and scoped attacks');
}
export function validateSupplementCoverage(key,v,d,a,e){
 validateRemainingCoverage(key,v,d,a,e);
 if(key==='equipment-stat'&&d.coverage.effectPartIds.length===0)throw Error('Equipment-stat category owns the equipment-local effects');
 if(key!=='equipment-stat'&&(d.coverage.effectPartIds.length||d.coverage.conditionPartIds.length===0))throw Error('Ground/death conditions must not complete unrelated benefits');
}
export function validateSupplementBinding(key,d,a,b){
 validateRemainingBinding(key,d,a,b);
 if(key==='equipment-stat'){
  if(b.operation!=='equipment-stat-up'||b.base!=='equipped-item-stat'||b.changesFinalCharacterStatByPercent!==false||!b.target.startsWith('equipped-')&&b.target!=='each-equipped-weapon'||!(b.valuePercent>0))throw Error('Equipment enhancement must use item stats, not the final character panel');
  if(b.target==='each-equipped-weapon'&&(b.requiresDualForBaseEffect!==false||b.scope.equipment.weaponCount!==undefined))throw Error('General weapon enhancement also works with a single weapon');
  if(b.target!=='each-equipped-weapon'&&(b.pairedEquipmentLogicalOperator!=='AND'||!b.scope.equipment.weaponType||!b.scope.equipment.armorType))throw Error('Paired equipment requires both items');
 }
 if(key==='grounded'&&(b.condition?.subject!=='self'||b.condition.state!=='grounded'||b.scope.attackType!=='physical'||b.scope.direction!=='incoming'||b.valuePercent!==10))throw Error('Grounded self is distinct from an airborne enemy');
 if(key==='self-incapacitated'){
  const c=b.selfIncapacitation;if(c?.actor!=='self'||!['opening-downed-check','trigger','effect-termination'].includes(c.mode))throw Error('Self death differs from an ally dying');
  if(c.mode==='opening-downed-check'&&(b.operation!=='revive-self'||b.initialHpPercent!==50||b.resetScope!=='quest'))throw Error('Opening revival is a task-limited downed-state check');
  if(c.mode==='effect-termination'&&!['incapacitated','self-incapacitated'].includes(b.endsOn)&&b.appliedEndsOn!=='incapacitated')throw Error('Death ends this effect rather than reapplying it');
 }
}
