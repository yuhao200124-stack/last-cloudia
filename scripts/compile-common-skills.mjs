import {adaptCommonBinding} from './common-calculation-adapter.mjs';
// Calculator adapter, not a label renderer. Only explicit numeric operations and
// completely translated predicates become executable rules. Everything else is
// a reference or a pending rule; classification-ready is never numeric-ready.
const eq=(field,value)=>({field,op:'eq',value});
const inside=(field,value)=>({field,op:'in',value});
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const races={ore:'stone',magical:'creature','magical-creature':'creature'};
const race=id=>races[id]||id;
const offensive=new Set(['damage-up','critical-damage-up','cap-up','conditional-cap-up','rate-up','critical-rate-up','enable-critical','enable-killer','defense-reference']);
const descriptive=new Set(['group','partIds','summary','target','isBuff','operation','scope','effectIdentity','valuePercent','capPoints','ratePoints','condition','sourceClause','skillReviewConditions','pendingPartIds','damageType','effectStacking','perMatchingWeaponStacking','perMatchingArmorStacking','matchingMultipleRaces','grantsCriticalEligibility','grantsKillerEligibility','guaranteedCritical','guaranteedInstantKill','doesNotGrantRace','damageMultiplierSource','requiresCriticalHit','addsToPartId','capCases','branches','raceRelation','changesMainHitDamage','calculatorNote','calculatorConditions','calculatorDefense','calculatorBuffGroup']);

function scopeConditions(scope={},conditions,issues) {
 const equipment=spec=>{
  for(const [key,value] of Object.entries(spec)){
   if(['weaponType','requiredWeaponType','armorType'].includes(key))conditions.push(eq(value,true));
   else if(key==='weaponCount')conditions.push(eq('weaponCount',value));
   else if(key==='weaponCountIn')conditions.push(inside('weaponCount',value));
   else if(key==='weaponTypesAllOf')for(const weapon of value)conditions.push(eq(weapon,true));
   else if(['sameWeaponType','sameWeaponElement'].includes(key))conditions.push(eq(key,value));
   else if(key==='weaponElement')conditions.push({field:'weaponSignatures',op:'intersects',value:(spec.weaponType?[spec.weaponType]:['sword','axe','spear','hammer','bow','machine','claw','staff']).map(t=>`${t}:${value}`)});
   else if(key==='minimumMatchingWeaponCount'&&value===1||key==='requiresActuallyEquipped'&&value===true||key==='subject'&&value==='self-equipment')continue;
   else if(key==='armorCount'&&value===0)conditions.push(eq('bodyArmor',false));
   else issues.push(`装备条件 ${key} 尚未接入`);
  }
 };
 for(const [key,value] of Object.entries(scope)){
  if(key==='direction'&&value==='outgoing')continue;
  if(key==='attackType'){
   if(value==='unspecified')continue;
   if(value==='physical'){conditions.push(inside('attackKind',['normal','skill']),eq('damageType','physical'));continue;}
   const kind={'attack-magic':'magic',magic:'magic',skill:'skill',ultimate:'ultimate',normal:'normal','normal-attack':'normal'}[value];
   if(kind)conditions.push(eq('attackKind',kind));else issues.push(`攻击类别 ${value} 不属于当前主攻击计算`);
  }else if(key==='equipment')equipment(value);
  else if(key==='element')conditions.push(eq('element',value));
  else if(key==='spellSubtype'&&value==='science')conditions.push(eq('magicFamily','science'));
  else if(key==='spellSubtype'&&value==='nonstackable-magic')conditions.push(eq('nonStackingMagic',true));
  else if(key==='attackElementRelation'&&['same-as-equipped-sword','same-as-equipped-weapon','same-as-both-equipped-weapons'].includes(value))conditions.push(eq('weaponAttackMatches',true));
  else if(key==='weaponType')equipment({weaponType:value});
  else if(key==='validWeaponCounts')conditions.push(inside('weaponCount',value));
  else if(key==='enemyType'&&['boss','non-boss'].includes(value))conditions.push(eq('boss',value==='boss'));
  else if(key==='enemyIsBoss')conditions.push(eq('boss',value));
  else if(['enemyRace','enemyTypes','enemyTypesAnyOf','enemyRaceIn'].includes(key))conditions.push({field:'enemyRaces',op:'intersects',value:(Array.isArray(value)?value:[value]).map(race)});
  else if(key==='requiresKillerHit')conditions.push(eq('killer',value));
  else if(['hitsElementWeakness','requiresElementWeakHit'].includes(key))conditions.push(eq('weakness',value));
  else if(key==='position'&&['behind','behind-target'].includes(value)||key==='requiresAttackFromBehind'&&value===true)conditions.push(eq('back',true));
  else if(key==='enemyAirborne')conditions.push(eq('air',value));
  else if(key==='enemyStateAnyOf'&&JSON.stringify(value.slice().sort())==='["break","stunned"]')conditions.push(eq('breakOrStunned',true));
  else if(key==='enemyState'&&['break','airborne','abnormal-status','no-abnormal-status'].includes(value))conditions.push(eq({break:'break',airborne:'air','abnormal-status':'ailment','no-abnormal-status':'ailment'}[value],value!=='no-abnormal-status'));
  else if(key==='selfHpPercent'&&value===100)conditions.push(eq('fullHp',true));
  else if(key==='selfHpPercentLte'&&value===30)conditions.push(eq('lowHp',true));
  else if(key==='enemyHpPercentLte')conditions.push({field:'enemyHpPercent',op:'lte',value});
  else if(key==='range'&&value==='ranged')conditions.push(eq('rangedAttack',true));
  else if(key==='skillSlot'&&[1,2,3].includes(value))conditions.push(eq('attack',`s${value}`));
  else if(['skillKind','ultimateKind'].includes(key)&&value==='attack')continue;
  else issues.push(`范围条件 ${key} 尚未接入`);
 }
 return equipment;
}

export function compileCommonEntry(entry,{hasBasicStats=false}={}) {
 if(entry.id==='5ac756efac795660'&&entry.text==='允许在防具栏位装备武器。装备两把武器时，物理攻击命中次数翻倍（单次伤害降至60%）。')return [{id:`common:${entry.id}:physical-hit`,part:'physical-hit',text:entry.text,conditions:[eq('weaponCount',2),inside('attackKind',['normal','skill']),eq('damageType','physical')],effects:[{type:'hit',target:'物理攻击',value:2,secondary:0.6,unit:''}],review:'ready',verification:'untested',note:'按完整描述读取双段与每段60%；结算位置沿用用户已确认的分段设置，不自动更换装备。'}];
 const groups=new Map();
 for(const detail of Object.values(entry.tagDetails))for(const binding of [...(detail.bindings||[]),...(detail.effectConditions||[]).filter(c=>c.effectBinding).map(c=>({...c.effectBinding,classificationPredicate:c.predicate}))]){
  if(!binding.operation||!binding.partIds?.length)continue;
  const key=binding.partIds.slice().sort().join('|');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(binding);
 }
 const rules=[];
 for(const [parts,copies] of groups){
  // Later family passes contain complete predicates. Prefer an explicit shared
  // identity; category copies must not each contribute their own multiplier.
  const conditional=copies.filter(b=>b.classificationPredicate),identified=copies.filter(b=>b.effectIdentity),original=(conditional.length?conditional:identified.length?identified:copies).at(-1);
  const adapted=adaptCommonBinding(entry,original),b=adapted.binding||original;
  const id=`common:${entry.id}:${parts}`,conditions=[],issues=[];
  if(adapted.reference){
   rules.push({id,part:parts,text:b.summary,conditions:[],effects:[{type:'utility',target:adapted.reference,value:0,unit:'',detail:'不直接改变本次主攻击伤害'}],review:'ready',verification:'description',note:adapted.summary});continue;
  }
  if(adapted.direct){rules.push({id,part:parts,text:b.summary,conditions:adapted.conditions,effects:adapted.direct,review:'ready',verification:'description',note:adapted.note});continue;}
  if(hasBasicStats&&/stat|maximum-hp|increase-maximum/.test(b.operation))continue;
  conditions.push(...(b.calculatorConditions||[]));
  const relevant=offensive.has(b.operation)||['outgoing','target-incoming'].includes(b.scope?.direction)||!b.operation.includes('status')&&/^(?:stat-|.*-stat-|equipment-stat-|add-stat-|hit-count-|hit-damage-)/.test(b.operation);
  if(!relevant)continue; // HP recovery, defense, SC, movement etc are not outgoing multipliers.
  if(!offensive.has(b.operation))issues.push('数值公式或结算层尚未接入');
  const equipment=scopeConditions(b.scope,conditions,issues);
  if(b.target!=='self')issues.push('作用对象不是自身');
  if(b.isBuff)issues.push('需确认本次Buff状态与叠加规则');
  const translated=new Set();
  if(JSON.stringify(b.weaknessPredicate)===JSON.stringify({subject:'self-attack-hit',metric:'actual-element-weakness-hit',notRaceKiller:true})){conditions.push(eq('weakness',true));translated.add('weaknessPredicate');}
  if(b.positionPredicate?.subject==='self-attack'&&b.positionPredicate.relativeTo==='target-enemy'&&b.positionPredicate.position==='behind'){conditions.push(eq('back',true));translated.add('positionPredicate');}
  if(b.aerialPredicate?.subject==='target-enemy'&&b.aerialPredicate.state==='airborne'){conditions.push(eq('air',true));translated.add('aerialPredicate');}
  if(b.statePredicate?.subject==='target-enemy'&&b.statePredicate.mode==='break-active'){conditions.push(eq('break',true));translated.add('statePredicate');}
  if(b.statePredicate?.subject==='target-enemy'&&b.statePredicate.logicalOperator==='OR'&&JSON.stringify(b.statePredicate.statesAnyOf?.slice().sort())==='["break","stunned"]'){conditions.push(eq('breakOrStunned',true));translated.add('statePredicate');}
  if(b.statusPredicate?.subject==='target-enemy'&&['has-ailment','has-no-ailment'].includes(b.statusPredicate.mode)){conditions.push(eq('ailment',b.statusPredicate.mode==='has-ailment'));translated.add('statusPredicate');}
  if(b.applicability==='specific-armor'&&b.scope?.equipment?.armorType)translated.add('applicability');
  if(b.changesBreakGaugeDamage===false)translated.add('changesBreakGaugeDamage');
  if(['hp-damage','hp-damage-cap'].includes(b.affects))translated.add('affects');
  if(b.matchingMultipleStates==='apply-once')translated.add('matchingMultipleStates');
  if(b.requiresSpellClassification===true&&b.scope?.spellSubtype==='nonstackable-magic')translated.add('requiresSpellClassification');
  if(b.matchingElementReviewed===true&&b.scope?.attackElementRelation)translated.add('matchingElementReviewed');
  for(const key of Object.keys(b))if(!descriptive.has(key)&&!translated.has(key)&&!key.endsWith('Role'))issues.push(`条件或机制 ${key} 尚未接入`);
  if(b.perMatchingWeaponStacking===true||b.perMatchingArmorStacking===true)issues.push('逐件装备叠加尚未接入');
  if(b.condition){
   const c=b.condition;
   if(c.subject==='self-equipment')equipment(c);
   else if(c.subject==='equipped-sword'&&c.weaponElement===b.scope?.equipment?.weaponElement&&b.scope.equipment.weaponType==='sword'){} // Already represented by the same weapon predicate.
   else if(c.subject==='target-enemy'&&c.operator==='OR'&&Array.isArray(c.raceAnyOf))conditions.push({field:'enemyRaces',op:'intersects',value:c.raceAnyOf.map(race)});
   else if(c.subject==='self'&&c.metric==='current-hp-percent-of-max'&&c.operator==='eq'&&c.thresholdPercent===100&&Object.keys(c).every(k=>['subject','metric','operator','thresholdPercent'].includes(k)))conditions.push(eq('fullHp',true));
   else if(c.subject==='self'&&c.metric==='current-hp-percent-of-max'&&c.operator==='lte'&&c.thresholdPercent===30&&Object.keys(c).every(k=>['subject','metric','operator','thresholdPercent'].includes(k)))conditions.push(eq('lowHp',true));
   else if(c.subject==='self'&&c.metric==='current-hp-percent-of-max'&&c.operator==='lte'&&finite(c.thresholdPercent)&&Object.keys(c).every(k=>['subject','metric','operator','thresholdPercent'].includes(k)))conditions.push({field:'selfHpPercent',op:'lte',value:c.thresholdPercent});
   else issues.push('附加生效条件尚未接入');
  }
  if(b.raceRelation){
   const r=b.raceRelation;
   if(r.subject==='target-enemy'&&r.operator==='any-of')conditions.push({field:'enemyRaces',op:'intersects',value:r.races.map(race)});
   else if(r.subject==='target-enemy'&&r.operator==='none-of')conditions.push({field:'enemyRaces',op:'disjoint',value:r.races.map(race)});
   else issues.push('自身／队伍种族条件尚未接入');
  }
  const critical=b.requiresCriticalHit===true||b.operation==='critical-damage-up';
  if(critical)conditions.push(eq('critical',true));
  let effects=[];
  if(['damage-up','critical-damage-up'].includes(b.operation)&&finite(b.valuePercent)){
   // Native engine treats 特攻增幅 as a correction to the killer factor, not
   // an additional post multiplier. Keep that already-verified exception.
   effects=[entry.id==='9146eb2670c69122'
    ?{type:'killerPower',target:'特攻威力修正',value:b.valuePercent,unit:'%'}
    :{type:'damage',target:critical?'暴击伤害':'伤害',value:b.valuePercent,unit:'%'}];
  }else if(b.operation==='cap-up'&&Number.isSafeInteger(b.capPoints))effects=[{type:'cap',target:critical?'暴击伤害上限':'伤害上限',value:b.capPoints,unit:''}];
  else if(['rate-up','critical-rate-up'].includes(b.operation)&&finite(b.ratePoints??b.valuePercent))effects=[{type:'critRate',target:'暴击率',value:b.ratePoints??b.valuePercent,unit:'%'}];
  else if(b.operation==='enable-critical'&&b.grantsCriticalEligibility===true)effects=[{type:'critPermission',target:b.scope.attackType==='ultimate'?'超必杀技':'魔法',value:true,unit:''}];
  else if(b.operation==='defense-reference'&&finite(b.calculatorDefense))effects=[{type:'defenseReference',target:'敌方防御力',value:b.calculatorDefense,unit:'%'}];
  else if(b.operation==='enable-killer'&&b.grantsKillerEligibility===true)effects=[{type:'killer',target:'本次目标',value:true,unit:''}];
  const uniqueConditions=[...new Map(conditions.map(c=>[JSON.stringify(c),c])).values()];
  if(b.calculatorBuffGroup)effects=effects.map(e=>({...e,runtime:{layer:'runtime-effect',stackGroup:b.calculatorBuffGroup,stackPolicy:'exclusive',resolution:'highest',kind:'buff',evidence:'registry-effects; active-buff-switch'}}));
  const base={id,part:parts,text:b.summary,conditions:uniqueConditions,effects,review:issues.length||!effects.length?'pending':'ready',verification:'description',note:[b.calculatorNote,...new Set(issues)].filter(Boolean).join('；')};
  if(b.operation==='conditional-cap-up'&&b.branches==='mutually-exclusive'&&b.capCases?.length===2){
   const [a,z]=b.capCases;
   const counts=a.when?.weaponCount===1?[1]:a.when?.weaponCountIn;
   if(Array.isArray(counts)&&counts.length&&counts.every(n=>[0,1,2].includes(n))&&Object.keys(a.when).length===1&&z.otherwise===true&&[a,z].every(c=>Number.isSafeInteger(c.capPoints))){
    for(const [i,c] of b.capCases.entries())rules.push({...base,id:`${id}:${i}`,conditions:[...uniqueConditions,{field:'weaponCount',op:i===0?'in':'notIn',value:counts}],effects:[{type:'cap',target:critical?'暴击伤害上限':'伤害上限',value:c.capPoints,unit:''}],review:issues.length?'pending':'ready'});
    continue;
   }
  }
  if(!effects.length){
   base.note=b.operation==='stat-scaled-damage-up'||b.operation==='stat-reference'?`${b.summary}：未记录属性与伤害的换算公式，也没有明确最大值。`:base.note||`${b.summary}：缺少可执行的数值或公式。`;
  }
  rules.push(base);
 }
 return rules;
}
