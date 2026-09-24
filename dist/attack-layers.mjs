// Only native-verified INT families are automatically combined with the skill
// edit. The base comes from the website's independently calculated pure panel,
// never from dividing a final panel or from a captured settlement attack.
const families=new Map([['ex-aura',50],['moonlight-ii',30]]);
export function resolveAttackLayers(stat,panel) {
 const fail=reason=>({ok:false,reason});
 if(!stat||stat.key!=='intelligence')return fail('当前参照没有已核对的自动属性层，请选择明确的计算方式。');
 if(stat.issues?.length)return fail(`属性基准仍有缺项：${stat.issues.join('；')}`);
 const base=stat.beforeBuff+stat.crossAdd,buffs=stat.buffs||[];
 if(!Number.isFinite(stat.beforeBuff)||!Number.isFinite(stat.crossAdd)||!Number.isSafeInteger(base)||base<=0)return fail('缺少状态加成前的完整属性基准。');
 if(!buffs.length||buffs.some(b=>families.get(b.family)!==b.value)||new Set(buffs.map(b=>b.family)).size!==buffs.length)return fail('当前实时加成的同层关系尚未验证，请手动确认基准和实时加成。');
 if(!Number.isFinite(panel))return fail('请填写或读取当前战斗法强。');
 const matches=[];
 // An entry snapshot and a damage-time snapshot need not have the same active
// HP/state buffs. Compare all known states against the observed panel exactly.
 for(let mask=0;mask<2**buffs.length;mask++){
  const active=buffs.filter((b,i)=>mask&(1<<i)),percent=active.reduce((n,b)=>n+b.value,0);
  if(Math.floor(base*(100+percent)/100)===panel)matches.push({base,percent,active,inactive:buffs.filter(b=>!active.includes(b))});
 }
 if(matches.length!==1)return fail('当前法强无法与已确认的属性基准及状态对应，请核对面板时刻和生效状态。');
 return {ok:true,...matches[0],panel,basis:'website-pure-panel-matched-to-observation'};
}
