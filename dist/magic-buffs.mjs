// Buff values come from the character's supplied spell description. Their
// presence on the character page is not evidence that they were cast.
const normalized=s=>String(s||'').replace(/\s|[,，。、]/g,'').replaceAll('＋','+');
export function magicBuffOptions(profile) {
 const spell=(profile?.magic||[]).find(m=>normalized(m.name)==='魔术指导'&&normalized(m.description)==='为一名我方单位赋予INT+65%魔法伤害上限+30000的增益');
 return spell?[{id:'magic-guidance',name:spell.name,description:spell.description,statPercent:65,stat:'intelligence',cap:30000,label:'法强 +65%；魔法伤害上限 +30,000',source:'角色页面'}]:[];
}
export function selectedMagicBuffs(options,selection) {return options.filter(b=>selection[b.id]===true);}
// A selected buff may already be represented in adopted sources. Never count
// its cap twice, and never turn an INT buff into outgoing damage percent.
export function magicBuffCap(buffs,skillType,references=[]) {
 if(skillType!=='magic')return 0;
 return buffs.reduce((n,b)=>n+(references.some(r=>r.source===b.name&&r.effect?.type==='cap'&&r.effect.target==='魔法伤害上限'&&r.effect.value===b.cap)?0:b.cap),0);
}
export function magicBuffLayer(stat,panel,buffs,mode='') {
 const fail=reason=>({ok:false,reason});
 if(!buffs.length)return null;
 if(!stat||stat.key!=='intelligence'||stat.issues?.length)return fail('已勾选魔法增益；请先确认状态前法强，或选择手填属性层。');
 if(buffs.length!==1||buffs[0].id!=='magic-guidance')return fail('这组魔法增益的叠加关系尚未确认，请手填属性层。');
 if(!['add','replace'].includes(mode))return fail('已勾选魔术指导。请选择它与 EX 灵气的关系；该关系尚未由读取资料证实，计算器不会自动猜测。');
 const base=stat.beforeBuff+stat.crossAdd;
 if(!Number.isSafeInteger(base)||base<=0)return fail('缺少完整的状态前法强。');
 if(stat.buffs.some(b=>!['ex-aura','moonlight-ii'].includes(b.family)))return fail('当前还有未确认的实时属性层，请手填核对。');
 const available=stat.buffs.filter(b=>mode==='add'||b.family!=='ex-aura'),matches=[];
 for(let mask=0;mask<2**available.length;mask++){
  const active=available.filter((b,i)=>mask&(1<<i)),percent=65+active.reduce((n,b)=>n+b.value,0);
  if(Math.floor(base*(100+percent)/100)===panel)matches.push({base,percent,active:[...active,{source:'魔术指导',value:65}],inactive:stat.buffs.filter(b=>!active.includes(b)),panel});
 }
 if(matches.length!==1)return fail('当前法强与所选魔术指导状态不对应。请填写或读取增益生效后的法强；不能沿用指导前面板。');
 return {ok:true,...matches[0],manualBuffRelation:true};
}
