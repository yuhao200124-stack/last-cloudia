import {calculate} from './damage-engine.mjs?v=20260924-fullpage';

export const DEFAULT_SC_RATES={damage:10,stat:10,criticalRate:1.5,criticalDamage:8};
const clone=x=>structuredClone(x);
const signature=r=>JSON.stringify([r.normal.min,r.normal.max,r.normal.mean,r.critical.min,r.critical.max,r.critical.mean,r.mean]);
export function recommendDamage({input,criticalEnabled=true,magicCanCrit=true,statReference='str',projectStatPercent,rates=DEFAULT_SC_RATES}) {
 const baseline=calculate(input),candidates=[],unavailable=[];
 const add=(id,label,amount,make)=>{
  try {
   const next=make(),result=calculate(next),gain=result.mean-baseline.mean;
   if(gain>0)candidates.push({id,label,amount,sc:3,gain,percent:baseline.mean>0?gain/baseline.mean*100:0,perSc:gain/3,expected:result.mean,signature:signature(result)});
  } catch(e){unavailable.push({label,reason:e.message});}
 };
 const value=Number(rates.damage),statValue=Number(rates.stat),rateValue=Number(rates.criticalRate)*3,critValue=Number(rates.criticalDamage)*3;
 if([value,statValue,rateValue,critValue].some(n=>!Number.isFinite(n)||n<=0||n>10000))throw new Error('SC 换算参数必须大于 0');
 const damage=(id,label,kind,target=input.element,percent=value)=>add(id,label,percent,()=>({...clone(input),effects:[...clone(input.effects),{id:`recommend:${id}`,name:label,kind,target,percent,enabled:true,stage:'post'}]}));
 if(['str','int'].includes(statReference)){
  const label=statReference==='int'?'法强':'攻击力';
  if(projectStatPercent)add('stat',label,statValue,()=>projectStatPercent(statValue));
  else unavailable.push({label,reason:'缺少可还原的基础属性，暂不比较属性加成'});
 }
 if(input.element!=='无')damage('element',`${input.element}伤`,'element');
 damage(input.type,input.type==='magical'?'魔法伤害':'物理伤害',input.type);
 if(input.skillType!=='magic')damage(input.skillType,({normal:'普通攻击伤害',skill:'特技伤害',ultimate:'超必杀伤害'})[input.skillType],input.skillType);
 if(input.boss)damage('boss','Boss 伤害','boss');
 if(input.specialAttack)damage('killer','特攻伤害','killer');
 if(input.break)damage('break','break 伤害','break');
 if(criticalEnabled&&(input.skillType!=='magic'||magicCanCrit)){
  if(input.critRate<100)add('criticalRate','暴击率',rateValue,()=>({...clone(input),critRate:Math.min(100,input.critRate+rateValue)}));
  if(input.critRate>0)damage('criticalDamage','暴击伤害','critical','无',critValue);
 }
 const tiers=[];
 for(const item of candidates.sort((a,b)=>b.gain-a.gain)){
  let tier=tiers.find(t=>t.key===item.signature);
  if(!tier){tier={key:item.signature,gain:item.gain,percent:item.percent,items:[]};tiers.push(tier);}
  tier.items.push(item);
 }
 return {baseline:baseline.mean,tiers,unavailable};
}

export function damageGauge(branch,ratio=1){
 const limit=branch.cap*ratio;
 return {min:branch.min,max:branch.max,cap:limit,fill:limit>0?Math.min(100,Math.max(0,branch.mean/limit*100)):0};
}
