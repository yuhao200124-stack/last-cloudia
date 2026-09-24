// Character-independent arithmetic. Definitions supply groups and percentages;
// this engine never recognizes spell names, character IDs or preset values.
export function combineRuntimeBuffs(active,selected=[]) {
 const valid=b=>Number.isFinite(b.value)&&(b.flatValue==null||Number.isFinite(b.flatValue))&&typeof b.stat==='string'&&b.stat&&b.runtime?.layer==='runtime-stat'&&typeof b.runtime.stackGroup==='string'&&b.runtime.stackGroup&&['exclusive','add'].includes(b.runtime.stackPolicy);
 if([...active,...selected].some(b=>!valid(b)))return {ok:false,reason:'实时属性的分组或叠加关系尚未确认。'};
 const policies=new Map(),chosen=new Set();
 for(const b of [...active,...selected]){
  const key=JSON.stringify([b.stat,b.runtime.stackGroup]),policy=policies.get(key);
  if(policy&&policy!==b.runtime.stackPolicy)return {ok:false,reason:'同一 Buff 组的互斥规则存在冲突，请核对分组资料。'};
  policies.set(key,b.runtime.stackPolicy);
 }
 for(const b of selected)if(b.runtime.stackPolicy==='exclusive'){
  const key=JSON.stringify([b.stat,b.runtime.stackGroup]);
  if(chosen.has(key))return {ok:false,reason:'同时选择了多个同类型 Buff，请只保留本次生效的一项。'};
  chosen.add(key);
 }
 if(new Set([...active,...selected].map(b=>b.stat)).size>1)return {ok:false,reason:'不同属性需要分别结算实时层。'};
 const retained=[...active],replaced=[];
 for(const buff of selected){
  if(buff.runtime.stackPolicy==='exclusive')for(let i=retained.length-1;i>=0;i--)if(retained[i].stat===buff.stat&&retained[i].runtime.stackGroup===buff.runtime.stackGroup){replaced.push(...retained.splice(i,1));}
  retained.push(buff);
 }
 const groups=new Set();
 // Only documented standard status groups opt in to highest-active-value.
 // Other exclusive groups still require explicit choice, as before.
 const automatic=new Map();
 for(const buff of retained)if(buff.runtime.stackPolicy==='exclusive'){
  const key=JSON.stringify([buff.stat,buff.runtime.stackGroup]);
  if(!automatic.has(key))automatic.set(key,[]);automatic.get(key).push(buff);
 }
 for(const buffs of automatic.values())if(buffs.length>1&&buffs.every(b=>b.runtime.resolution==='highest')){
  const flat=b=>b.flatValue||0;
  if(buffs.some(b=>b.value!==0)&&buffs.some(b=>flat(b)!==0))return {ok:false,reason:'同组固定值和百分比不能直接比较，请核对状态。'};
  const winner=buffs.reduce((best,b)=>b.value+flat(b)>best.value+flat(best)?b:best);
  for(const buff of buffs)if(buff!==winner){retained.splice(retained.indexOf(buff),1);replaced.push(buff);}
 }
 for(const b of retained)if(b.runtime.stackPolicy==='exclusive'){
  const key=JSON.stringify([b.stat,b.runtime.stackGroup]);
  if(groups.has(key))return {ok:false,reason:'同类型 Buff 只能保留一个，请确认本次生效的来源。'};
  groups.add(key);
 }
 return {ok:true,active:retained,replaced,percent:retained.reduce((n,b)=>n+b.value,0),flat:retained.reduce((n,b)=>n+(b.flatValue||0),0)};
}
export function runtimeStates(base,buffs,selected=[]) {
 // Bound uncertain observations. A large unresolved inventory is not a panel.
 if(buffs.length>16)return [];
 const states=[],keys=new Set();
 for(let mask=0;mask<2**buffs.length;mask++){
  const active=buffs.filter((_,i)=>mask&(1<<i)),combined=combineRuntimeBuffs(active,selected);
  if(!combined.ok)continue;
  const key=JSON.stringify(combined.active.map(b=>[b.stat,b.runtime.resolution==='highest'?'standard-status':b.source,b.value,b.flatValue||0,b.runtime.stackGroup]).sort());
  if(keys.has(key))continue;keys.add(key);
  states.push({key,...combined,base,panel:Math.floor((base+combined.flat)*(100+combined.percent)/100),inactive:buffs.filter(b=>!combined.active.includes(b))});
 }
 return states;
}
