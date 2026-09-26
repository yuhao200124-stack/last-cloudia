// Exact registry bindings only. A maximum is a user-requested calculation
// scenario, not a claim that a skill is always at its maximum in battle.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const eq=(field,value)=>({field,op:'eq',value});
const maxOf=values=>{const known=values.filter(finite);return known.length?Math.max(...known):null;};
const nonMain=new Map([
 ['restore-hp','HP回复'],['restore-current-hp','HP回复'],['periodic-restore-hp','持续HP回复'],['healing-stat-reference','HP回复参照'],['stat-scaled-healing-output-up','HP回复量'],
 ['break-up','Break槽削减'],['stun-ease-up','气绝效果'],['prevent-stat-down','属性下降抵抗'],['adjust-spell-cost','魔法MP消耗'],['consume-mp','MP消耗'],['consume-current','资源消耗'],['consume-resource','HP／MP消耗'],
 ['release-enemy-guard','解除格挡'],['instant-kill-attempt','即死判定'],['trigger-follow-up','独立追击'],['deal-periodic-damage','独立周期伤害'],['accumulate-laceration','裂伤值累积'],['laceration-value-up','裂伤值'],['reduce-enemy-hp','独立HP扣除']
]);
const maxMechanics=['maxValuePercent','maxPercent','maxCapPoints','minPercent','minValuePercent','distributionStatus','firstValuePercent','incrementPercent','maxStacks','stacksBase','scaling','curveStatus','secondsToMaximum','reachesMaximumAtSeconds','notBuffDurationSeconds','timeBase','resetScope','reset','resetPredicate','comboPredicate','distancePredicate','count','countMetric','requiredSkillId','minimumCount','tiers','capByCount','otherwiseCapPoints','belowMinimumCapPoints','capPerUnit','partyPredicate','classificationPredicate','triggerLimit','progressionWithinOneBuff','stepPercent','alternativeAttackTypes','branchOperator','element'];
export function adaptCommonBinding(entry,original){
 const b=structuredClone(original),op=b.operation;
 if(['selected-other-ally','highest-STR-other-ally','other-allies','allies-except-self'].includes(b.target))return {reference:'赋予其他友方的效果',summary:b.summary};
 const standalone=['counter','follow-up','laceration'].includes(b.scope?.attackType);
 if(nonMain.has(op)||standalone)return {reference:standalone?({counter:'反击专用效果','follow-up':'独立追击',laceration:'独立裂伤伤害'}[b.scope.attackType]):nonMain.get(op),summary:b.summary};
 const maxDamage=/(?:scaled|scaling|tiered|distance|random|stacking-buff)-damage-up$/.test(op);
 const maxCap=/(?:scaled|scaling|tiered|distance)-cap-up$/.test(op);
 if(maxDamage||maxCap){
  const value=maxOf(maxDamage?[b.maxValuePercent,b.maxPercent,finite(b.incrementPercent)&&finite(b.maxStacks)?b.incrementPercent*b.maxStacks:null,...(b.tiers||[]).map(t=>t.valuePercent)]:[b.maxCapPoints,...(b.tiers||[]).map(t=>t.capPoints),...Object.values(b.capByCount||{})]);
  if(value!==null){
   b.operation=maxDamage?'damage-up':'cap-up';b[maxDamage?'valuePercent':'capPoints']=value;
   b.calculatorNote=`最大值试算：${maxDamage?'伤害 +'+value+'%':'伤害上限 +'+value}。`;
   if(b.scope?.chainKey)delete b.scope.chainKey;
   if(b.raceRelation?.subject!=='target-enemy')delete b.raceRelation;
   for(const key of maxMechanics)delete b[key];
   if(b.isBuff){b.calculatorConditions=[eq('conditionBuffActive',true)];b.calculatorBuffGroup=b.buffType||`skill:${entry.id}`;}
   else if(b.trigger?.event==='wave-start')b.calculatorConditions=[eq('openingBuffActive',true)];
   // Only accumulation/maximum triggers are represented by the selected peak.
   for(const key of ['trigger','activationMode','buffType','stacking','durationSeconds','durationStatus','endsOn','activeByDefault','phase'])delete b[key];
   b.isBuff=false;
  }
 }
 if(op==='stat-add'&&finite(b.valuePoints)&&b.target==='self')return {direct:[{type:'stat',target:({STR:'攻击力',INT:'法强',DEF:'防御力',MND:'魔抗'})[b.stat]||b.stat,value:b.valuePoints,unit:''}],conditions:[],note:'固定属性加算。'};
 if(op==='enemy-defense-reference-reduction'&&finite(b.valuePercent)&&b.stat==='DEF'){
  b.operation='defense-reference';b.target='self';b.calculatorDefense=100-b.valuePercent;
  if(b.chancePercent||b.chanceStatus)b.calculatorConditions=[eq('conditionBuffActive',true)];
  for(const k of ['stat','base','appliesPersistentDebuff','chancePercent','chanceUnit','chanceStatus'])delete b[k];
 }
 if(b.target==='self'&&b.isBuff&&b.stacking==='highest-active-buff-of-same-type-only'&&['damage-up','cap-up','rate-up','critical-rate-up'].includes(b.operation)){
  const opening=b.activationMode==='permanent-status'||['battle-start','wave-start'].includes(b.trigger?.event)&&!b.trigger?.delaySeconds;
  b.calculatorConditions=[...(b.calculatorConditions||[]),eq(opening?'openingBuffActive':'conditionBuffActive',true)];
  b.calculatorBuffGroup=b.buffType;
  b.calculatorNote=(b.calculatorNote||'')+'按所选BUFF状态计算，同类型只采用最高一项。';
  // The switch explicitly selects the active Buff, not its trigger probability.
  for(const k of ['trigger','condition','phase','activationMode','buffType','durationSeconds','durationStatus','stacking','lifetime','endsOn','selfIncapacitation','uses','grantIntervalSeconds','triggerLimit','flatValue','maxTriggersPerWave','activeByDefault','chanceStatus'])delete b[k];
  b.isBuff=false;
 }
 if(['continuous-condition','current-state'].includes(b.activationMode)&&b.scope?.selfHpPercent===100)delete b.activationMode;
 if(b.target==='self'&&b.payment&&['damage-up','cap-up'].includes(b.operation)){
  b.calculatorConditions=[...(b.calculatorConditions||[]),eq('conditionBuffActive',true)];
  b.calculatorNote=`条件BUFF已勾选：按已支付${b.payment.resource}代价计算本次攻击。`;
  for(const k of ['payment','trigger','activationMode','phase','flatValue'])delete b[k];
  for(const k of ['requiresHpCost','hpCostPercentOfMaximum'])if(b.scope)delete b.scope[k];
 }
 if(b.target==='self'&&!b.isBuff&&b.trigger?.delaySeconds&&['damage-up','cap-up'].includes(b.operation)){
  b.calculatorConditions=[...(b.calculatorConditions||[]),eq('conditionBuffActive',true)];
  b.calculatorNote=`条件BUFF已勾选：按战斗开始${b.trigger.delaySeconds}秒后计算。`;
  delete b.trigger;delete b.notBuffDurationSeconds;
 }
 const add=c=>{b.calculatorConditions=[...(b.calculatorConditions||[]),c];};
 if(b.comboPredicate?.metric==='consecutive-hit-count'&&['gte','lte','eq'].includes(b.comboPredicate.operator)){
  add({field:'comboHits',op:b.comboPredicate.operator,value:b.comboPredicate.threshold});delete b.comboPredicate;delete b.hitCount;
 }
 if(b.condition?.metric==='STR-vs-INT'||b.condition?.left==='STR'&&b.condition?.right==='INT'){
  add(eq('openingStrAtLeastInt',b.condition.operator==='gte'));
  for(const k of ['condition','trigger','mutuallyExclusiveBranch','mutuallyExclusiveWithPartId'])delete b[k];
 }
 if(b.statusPredicate?.subject==='self'&&b.statusPredicate.mode==='has-ailment'){
  add(eq('selfAilment',true));delete b.statusPredicate;delete b.condition;
 }
 if(b.statusPredicate?.subject==='target-enemy'&&b.statusPredicate.mode==='has-status'&&['poison','silence'].includes(b.statusPredicate.status)){
  add(eq(b.statusPredicate.status==='poison'?'enemyPoison':'enemySilence',true));delete b.statusPredicate;delete b.scope.enemyState;
 }
 if(b.scope?.enemyDebuffCountGte!==undefined&&b.statusPredicate?.meansAilmentCount===false){
  add({field:'enemyDebuffCount',op:'gte',value:b.scope.enemyDebuffCountGte});delete b.scope.enemyDebuffCountGte;delete b.statusPredicate;
 }
 if(JSON.stringify(b.scope?.enemyActionAnyOf)==='["skill","counter"]'){
  add(eq('enemyUsingSkillOrCounter',true));delete b.scope.enemyActionAnyOf;delete b.statePredicate;delete b.matchingMultipleActions;
 }
 if(b.condition?.metric==='used-skill-stock'&&b.condition.operator==='equals-own-maximum'){
  add(eq('usedSkillFull',true));delete b.condition;
 }
 if(b.condition?.mode==='ultimate-gauge-full'){
  add(eq('ultimateGaugeFull',true));for(const k of ['condition','activationMode','phase'])delete b[k];
 }
 if(b.raceRelation?.subject==='target-enemy-and-self'&&b.raceRelation.operator==='shared-type'){
  add(eq('sharedEnemyRace',true));delete b.raceRelation;delete b.sharedTypeMatch;
 }
 return {binding:b};
}

const runtime=(id,target,buff=false)=>({layer:'runtime-stat',stackGroup:buff?({攻击力:'str-attack-buff',法强:'int-magic-buff',防御力:'def-defense-buff',魔抗:'mnd-mind-buff'})[target]||`${id}:${target}`:`conditional:${id}:${target}`,stackPolicy:buff?'exclusive':'add',...(buff?{resolution:'highest',kind:'buff'}:{kind:'conditional-passive',lifetime:'condition'}),evidence:'registry-effects; user-maximum-policy-2026-09-26'});
// Existing basic rules retain their IDs and all ready operations. Only exact
// official descriptions reach this build-time migration.
export function adaptBasicRules(entry,basic){
 if(!basic)return null;
 const num=Number(entry.url.split('/').pop());
 const maxValues={267:50,788:50,1390:15,1164:50,1765:20,1629:20,284:15,514:21,1231:50,305:20};
 return structuredClone(basic.rules).map(r=>{
  if(r.part==='other'||r.review==='ready')return r;
  const allNumeric=r.effects.every(e=>finite(e.value)),maximum=maxValues[num];
  let conditions=null,buff=false;
  if(maximum!==undefined){conditions=[eq([267,788,1390,1164].includes(num)?'lowHp':[1231,305].includes(num)?'openingBuffActive':'conditionBuffActive',true)];buff=num===1231;}
  else if([425,726,1370,1015,196,584,740].includes(num)&&allNumeric){conditions=[eq('conditionBuffActive',true)];buff=true;}
  else if([746,2016].includes(num)&&allNumeric){conditions=[eq('openingBuffActive',true)];buff=true;}
  else if([914,249].includes(num)&&allNumeric)conditions=[eq('ultimateGaugeFull',true)];
  else if([941,1883].includes(num)&&allNumeric)conditions=[eq('boss',true)];
  if(!conditions)return r;
  return {...r,review:'ready',conditions,effects:r.effects.map(e=>{const rt=runtime(entry.id,e.target,buff);if(buff&&e.value<0)rt.stackGroup+=':debuff';return {...e,type:'statBuff',value:maximum??e.value,runtime:rt};}),note:maximum!==undefined?`最大值试算：采用技能已记录的最高 ${maximum}%；仍受对应条件开关控制。`:'按已记录数值与对应条件开关计算，同类型增益只保留最高项。'};
 });
}
