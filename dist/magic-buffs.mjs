import {resolveAttackLayers} from './attack-layers.mjs?v=20260924-snapshots';
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
export function magicBuffLayer(stat,panel,buffs) {
 const fail=reason=>({ok:false,reason});
 if(!buffs.length)return null;
 if(!stat||stat.key!=='intelligence'||stat.issues?.length)return fail('已勾选魔法增益；请先确认状态前法强，或选择手填属性层。');
 if(buffs.length!==1||buffs[0].id!=='magic-guidance')return fail('这组魔法增益的叠加关系尚未确认，请手填属性层。');
 const base=stat.beforeBuff+stat.crossAdd;
 if(!Number.isSafeInteger(base)||base<=0)return fail('缺少完整的状态前法强。');
 if(!Array.isArray(stat.buffs)||stat.buffs.some(b=>({'ex-aura':50,'moonlight-ii':30})[b.family]!==b.value)||new Set(stat.buffs.map(b=>b.family)).size!==stat.buffs.length)return fail('当前还有未确认的实时属性层，请手填核对。');
 const available=stat.buffs,matches=[];
 for(let mask=0;mask<2**available.length;mask++){
  const active=available.filter((b,i)=>mask&(1<<i)),percent=65+active.reduce((n,b)=>n+b.value,0);
  if(Math.floor(base*(100+percent)/100)===panel)matches.push({base,percent,active:[...active,{source:'魔术指导',value:65}],inactive:stat.buffs.filter(b=>!active.includes(b)),panel});
 }
 // An observed post-cast panel already contains guidance: do not add it again.
 if(matches.length===1)return {ok:true,...matches[0],guidanceObserved:true,scenarios:[]};
 const before=!stat.buffs.length&&panel===base?{ok:true,active:[]}:resolveAttackLayers(stat,panel);
 if(!before.ok)return fail(before.reason);
 const guidance={source:'魔术指导',value:65};
 const make=(replace)=>{
  const active=[...before.active.filter(b=>!replace||b.family!=='ex-aura'),guidance];
  const percent=active.reduce((n,b)=>n+b.value,0);
  return {base,percent,active,inactive:stat.buffs.filter(b=>!active.includes(b)),panel:Math.floor(base*(100+percent)/100),label:replace?'指导替换 EX':'指导与 EX 相加'};
 };
 const alternatives=[make(true),make(false)];
 const scenarios=alternatives.filter((a,i)=>!alternatives.slice(0,i).some(b=>b.percent===a.percent));
 if(scenarios.length===1)scenarios[0].label='魔术指导';
 return {ok:true,...scenarios[0],projected:true,observedPanel:panel,scenarios};
}
