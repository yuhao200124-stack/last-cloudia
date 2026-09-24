// PvE ordinary HP damage. Sources: supplied GameAssembly + process/procCondCommon.lua.
// See tests/damage-engine.test.mjs and DAMAGE-CALCULATOR.md for scope/evidence.
const f = Math.fround;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const RACES = ['战士','狙击手','骑士','魔法师','兽','植物','昆虫','鸟','魔法生物','不死生物','石','机械','精灵','龙','神','鱼'];
export const ELEMENTS = ['无','火','冰','树','雷','光','暗'];
export const EFFECTS = {
  all:'通用增伤', boss:'对 Boss 增伤', element:'属性增伤', physical:'物理增伤',
  magical:'魔法增伤', skill:'特技增伤', ultimate:'超必杀技增伤', normal:'普通攻击增伤',
  critical:'暴击增伤', race:'对指定种族增伤', killer:'特攻触发时增伤',
  weak:'弱点增伤', break:'Break 增伤', back:'背后增伤', air:'对空增伤',
  ailment:'对异常目标增伤', reduction:'受到伤害修正'
};
export function defaultInput() {
  return {attack:3805, attackBasis:'panel', attackBase:3805, runtimeStatPercent:0, settledAttack:3805, defense:4000, hits:8, critRate:20, coefficient:0.334,
    skillAdd:0, skillPercent:51.8, skillPostAdd:0, attackRatio:0, runtimeRatio:1,
    integerRatio:0, type:'physical', skillType:'skill', element:'无', resistance:0,
    resistCorrection:0, boss:true, races:[], killerRaces:[], killerCorrection:0,
    break:false, breakDefenseRatio:0.5, back:false, air:false, ailment:false,
    guarded:false, guardReduction:50, cap:9999, bossKiller:false, defenseRatio:1,
    hitMultiplier:1, hitDamageRatio:1, hitScaleStage:'core', effects:[]};
}
export function validate(s) {
  if(!['panel','layers','settlement'].includes(s.attackBasis??'panel'))throw new Error('请选择结算攻击值的来源');
  if(s.attackBasis==='layers'&&(!Number.isFinite(s.attackBase)||s.attackBase<0||s.attackBase>1e8||!Number.isFinite(s.runtimeStatPercent)||s.runtimeStatPercent < -100||s.runtimeStatPercent>1e5))throw new Error('请填写状态加成前的面板与已确认的实时属性加成');
  if(s.attackBasis==='settlement'&&(!Number.isFinite(s.settledAttack)||s.settledAttack<0||s.settledAttack>1e8))throw new Error('请填写读取器的实际结算攻击值');
  const bounds = {attack:[0,1e8],defense:[0,1e8],hits:[1,1000],critRate:[0,100],
    coefficient:[0,1e4],skillAdd:[-1e8,1e8],skillPercent:[-100,1e5],skillPostAdd:[-1e8,1e8],
    attackRatio:[-100,1e5],runtimeRatio:[0,1e4],integerRatio:[-100,1e5],
    resistance:[-999,1000],resistCorrection:[-999,1000],killerCorrection:[-100,1e4],
    breakDefenseRatio:[0,1],guardReduction:[0,100],cap:[1,2e9],defenseRatio:[0,1],hitMultiplier:[1,100],hitDamageRatio:[0,100]};
  for (const [key,[lo,hi]] of Object.entries(bounds)) {
    if(s.attackBasis==='settlement'&&['attack','skillAdd','skillPercent','skillPostAdd','attackRatio'].includes(key))continue;
    if(s.attackBasis==='layers'&&key==='attack')continue;
    if (!Number.isFinite(s[key]) || s[key]<lo || s[key]>hi) throw new Error(`参数 ${key} 超出可计算范围`);
  }
  if (!Number.isInteger(s.hits) || !Number.isInteger(s.cap)) throw new Error('段数和伤害上限必须是整数');
  if (!Number.isInteger(s.hitMultiplier) || s.hits*s.hitMultiplier>10000) throw new Error('请检查原始段数与段数倍率');
  if (s.hitDamageRatio!==1 && !['core','beforeCap','afterCap'].includes(s.hitScaleStage)) throw new Error('分段修正已导入；请选择单段伤害修正的试算位置，当前尚未确认实际执行顺序。');
  if (!['physical','magical'].includes(s.type) || !ELEMENTS.includes(s.element)) throw new Error('请选择有效的攻击类型与属性');
  for (const e of s.effects) {
    if (!(e.kind in EFFECTS) || !['post','offense','received','reduction'].includes(e.stage) ||
      !Number.isFinite(e.percent) || e.percent < -100 || e.percent > 10000 ||
      (e.stage==='reduction' && (e.percent<0 || e.percent>100))) throw new Error('请检查加成百分比及结算方式');
  }
}
export function context(s) {
  // ProcStatus combines runtime and skill modifiers on their original base.
  // A final battle panel cannot be multiplied by the skill modifier again when
  // it already contains modifiers in that same layer. Never reverse-divide it.
  const layered=s.attackBasis==='layers';
  const edited = Math.floor(((layered?s.attackBase:s.attack)+s.skillAdd)*(1+((layered?s.runtimeStatPercent:0)+s.skillPercent)/100)+s.skillPostAdd);
  // CACHE +0x90 is the actual CalcDamage input: all attack edits are included.
  const attack = s.attackBasis==='settlement'?f(s.settledAttack):Math.max(f(f(edited)*f(1+f(s.attackRatio/100))),0);
  const defense = f(s.defense * s.defenseRatio * (s.boss && s.break ? s.breakDefenseRatio : 1));
  const resistance = (s.element==='无' ? 0 : s.resistance)+s.resistCorrection;
  const element = f(1-clamp(f(resistance/100),-9.99,1));
  const killer = typeof s.specialAttack==='boolean'?s.specialAttack:(s.boss && s.bossKiller) || s.races.some(r=>s.killerRaces.includes(r));
  return {attack,defense,resistance,element,killer,weak:resistance<0,
    killerFactor:killer ? f(f(1.5)*Math.max(f(1+f(s.killerCorrection/100)),0)) : 1};
}
export function applies(e,s,c,critical) {
  if (!e.enabled) return false;
  if (e.scope && Object.entries(e.scope).some(([key,value])=>s[key]!==value)) return false;
  switch(e.kind) {
    case 'boss': return s.boss;
    case 'element': return e.target===s.element;
    case 'physical': case 'magical': return s.type===e.kind;
    case 'skill': case 'ultimate': case 'normal': return s.skillType===e.kind;
    case 'critical': return critical;
    case 'race': return s.races.includes(e.target);
    case 'killer': return c.killer;
    case 'weak': return c.weak;
    case 'break': return s.break;
    case 'back': return s.back;
    case 'air': return s.air;
    case 'ailment': return s.ailment;
    default: return true;
  }
}
export function prepare(s,critical=false) {
  const c=context(s), effects=s.effects.filter(e=>applies(e,s,c,critical));
  let offense=1,received=1,reduction=1;
  for(const e of effects) {
    const p=f(e.percent/100);
    if(e.stage==='offense') offense=f(offense*Math.max(f(1+p),0));
    if(e.stage==='received') received=f(received*Math.max(f(1+p),0));
    if(e.stage==='reduction') reduction=f(reduction*f(1-p));
  }
  let q=f(f(s.coefficient)*f(s.runtimeRatio));
  if(s.hitScaleStage==='core') q=f(q*f(s.hitDamageRatio));
  q=f(q*c.element); q=f(q*c.killerFactor); q=f(q*f(offense*received)); q=f(q*reduction);
  const exponent=c.attack>0 ? f(f(c.defense/c.attack)*(critical?6:10)) : 0;
  const base=c.attack>0 ? f(f(Math.pow(f(.9),exponent))*c.attack) : 0;
  if(!Number.isFinite(base*q) || f(base*q)>2147483647) throw new Error('该组参数超过普通整数伤害的计算范围，请检查技能系数与增伤数值');
  return {s,c,q,base,effects,critical,immune:c.element<=0};
}
export function damageAt(prepared,random=.95,withTrace=false) {
  const {s,c,q,base,effects,immune}=prepared;
  const trace=[];
  const record=(label,value)=>{if(withTrace)trace.push({label,value});return value;};
  if(immune) return {value:0,uncapped:0,trace:[{label:'属性抗性达到 100%，伤害无效',value:0}]};
  let d=record('攻防、技能系数、抗性与核心前修正',Math.trunc(f(f(base*q)*f(random))));
  if(s.integerRatio!==0) d=record('运行时整数伤害修正',Math.trunc(d*(1+f(s.integerRatio/100))));
  for(const e of effects) if(e.stage==='post' && e.percent!==0) {
    d=record(`${e.name||EFFECTS[e.kind]} ${e.percent>=0?'+':''}${e.percent}%`,Math.max(Math.floor(d*(1+e.percent/100)+.5),1));
  }
  if(s.guarded) d=record('格挡',Math.floor(d*(1-s.guardReduction/100)));
  if(s.hitScaleStage==='beforeCap' && s.hitDamageRatio!==1) d=record('分段单段修正（上限前试算）',Math.trunc(d*s.hitDamageRatio));
  const uncapped=Math.max(d,1);
  d=record('每段伤害上限',clamp(uncapped,1,s.cap));
  if(s.hitScaleStage==='afterCap' && s.hitDamageRatio!==1) d=record('分段单段修正（上限后试算）',Math.max(1,Math.trunc(d*s.hitDamageRatio)));
  return {value:d,uncapped,trace,attack:c.attack};
}
export function calculate(s) {
  validate(s);
  const normal=prepare(s,false),critical=prepare(s,true);
  function branch(p) {
    const lo=damageAt(p,.9),hi=damageAt(p,1);
    // Deterministic quadrature: expectation is approximate; endpoints are not sampled.
    let sum=0;
    const samples=1024;
    for(let i=0;i<samples;i++) sum+=damageAt(p,.9+(i+.5)*.1/samples).value;
    return {min:lo.value,max:hi.value,mean:sum/samples,uncappedMax:hi.uncapped,trace:damageAt(p,.95,true).trace};
  }
  const n=branch(normal),cr=branch(critical),chance=s.critRate/100;
  const mean=n.mean*(1-chance)+cr.mean*chance;
  const totalHits=s.hits*s.hitMultiplier;
  return {normal:n,critical:cr,mean,totalHits,totalMean:mean*totalHits,
    normalTotal:[n.min*totalHits,n.max*totalHits],
    possibleTotal:[(chance===1?cr.min:chance===0?n.min:Math.min(n.min,cr.min))*totalHits,
      (chance===0?n.max:chance===1?cr.max:Math.max(n.max,cr.max))*totalHits],
    context:normal.c,
    active:s.effects.filter(e=>applies(e,s,normal.c,false)||applies(e,s,normal.c,true))};
}
