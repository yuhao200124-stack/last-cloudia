import {statActivationCondition} from './stat-condition-fields.mjs?v=20260924-condition-tags';
import {normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-condition-tags';
import {combineRuntimeBuffs} from './runtime-buff-engine.mjs?v=20260924-condition-tags';
import {upgradeStatRule, verifiedRuntimeFamily,verifiedHpRuntime} from './stat-mechanics.mjs?v=20260924-fullpage';
// Character-panel arithmetic only. Damage/cap/defense-reference effects never enter it.
export const PANEL_LABELS={hp:'HP',mp:'MP',attack:'攻击力',defense:'防御力',intelligence:'法强',mind:'魔抗'};
const aliases={HP:'hp',生命:'hp',MP:'mp',魔力值:'mp',攻击力:'attack',防御力:'defense',法强:'intelligence',魔力:'intelligence',魔抗:'mind'};
const types=['法杖','长袍','衣服','铠甲','剑','斧','枪','槌','弓','机械','爪'];
const n=x=>typeof x==='number'&&Number.isFinite(x);
const fmt=x=>Number.isInteger(x)?String(x):String(Math.round(x*10000)/10000);
const scale=(v,p)=>v*(100+ p)/100;
// UnitUtil.AddEquipParameter uses float32, then nearest integer with ties to even.
export function equipmentRound(value) {
 const lower=Math.floor(value),fraction=value-lower;
 return fraction<0.5?lower:fraction>0.5?lower+1:lower%2===0?lower:lower+1;
}
const targetKeys=target=>String(target).split(/与|、|及|\/|／/).map(s=>aliases[s]).filter(Boolean);
export function calculateWebsitePanel(baseStats,report,{equipment=[],openingStats={}}={}) {
 report={...report,rows:(report?.rows||[]).map(row=>{const rule=upgradeStatRule(row.rule,row.sourceText);return {...row,rule,status:row.status==='active'&&rule.review==='pending'?'pending':row.status};})};
 const out=Object.fromEntries(Object.entries(PANEL_LABELS).map(([key,label])=>[key,{key,label,base:baseStats[key],precision:key==='mp'?1000:1,value:null,subtotal:null,beforeBuff:null,beforeBuffRaw:null,crossAdd:0,flat:0,percent:0,buffs:[],equipment:[],steps:[],issues:[],sources:[]}])) ;
 const equipped=new Map(),boosts=[],cross=[];
 const flat=(report?.rows||[]).filter(r=>r.status==='active').flatMap(row=>row.rule.effects.map((effect,index)=>({row,effect,index:row.effectIndices?.[index]??index})));
 const issue=(keys,text)=>{for(const key of keys)out[key].issues.push(text);};
 for(const row of report?.rows||[])if(row.status==='pending')for(const e of row.rule.effects) {
  if(!['stat','statBuff','equipmentStat'].includes(e.type))continue;
  const plain=String(e.target).replace(/^装备/,'').replace(/^(法杖|长袍|衣服|铠甲|剑|斧|枪|槌|弓|机械|爪)(自身)?/,'');
  const keys=targetKeys(plain);issue(keys.length?keys:Object.keys(out),`${row.sourceName}：属性生效条件待确认`);
 }
 for(const {row,effect:e,index} of flat) {
  if(!['stat','statBuff','equipmentStat'].includes(e.type))continue;
  const source={sourceId:row.sourceId,sourceName:row.sourceName,ruleId:row.rule.id,effectIndex:index,effect:e};
  if(e.type==='equipmentStat') {
   if(e.unit===''&&n(e.value)) {
    const key=aliases[e.target.replace(/^装备/,'')];if(!key){issue(Object.keys(out),`${row.sourceName}：未识别装备属性 ${e.target}`);continue;}
    const identity=equipment.filter(x=>x.name===row.sourceName);
    if(!equipped.has(row.sourceId))equipped.set(row.sourceId,{name:row.sourceName,type:identity.length===1?identity[0].type:null,stats:{}});
    const item=equipped.get(row.sourceId);item.stats[key]=(item.stats[key]||0)+e.value;out[key].sources.push(source);
   } else {
    const type=['武器',...types].find(t=>e.target.startsWith(t));
    const key=type&&aliases[e.target.slice(type.length).replace(/^自身/,'')];
    if(type&&key&&n(e.value)&&e.unit==='%'){boosts.push({type,key,value:e.value,source});out[key].sources.push(source);}
    else issue(Object.keys(out),`${row.sourceName}：装备自身加成尚未解析`);
   }
   continue;
  }
  const keys=targetKeys(e.target);
  for(const key of keys)out[key].sources.push(source);
  if(n(e.value)&&e.unit==='%') {
   for(const key of keys)if(e.type==='stat')out[key].percent+=e.value;else out[key].buffs.push({id:`${row.sourceId}:${row.rule.id}:${index}`,value:e.value,source:row.sourceName,family:verifiedRuntimeFamily(row.rule,e),...verifiedHpRuntime(row.rule,e),...(e.runtime?{runtime:e.runtime}:{}),activationCondition:statActivationCondition(row.rule)||(e.runtime?.lifetime==='permanent'?{field:'permanentBuffActive',op:'eq',value:true}:undefined)});
   if(!keys.length)issue(Object.keys(out),`${row.sourceName}：属性目标尚未解析`);
  } else if(e.type==='statBuff'&&n(e.value)&&e.unit===''&&e.runtime) {
   for(const key of keys)out[key].buffs.push({id:`${row.sourceId}:${row.rule.id}:${index}`,value:0,flatValue:e.value,source:row.sourceName,runtime:e.runtime,activationCondition:statActivationCondition(row.rule)||(e.runtime?.lifetime==='permanent'?{field:'permanentBuffActive',op:'eq',value:true}:undefined)});
  } else if(e.type==='stat'&&n(e.value)&&e.unit==='') {
   for(const key of keys)out[key].flat+=e.value;
   if(!keys.length)issue(Object.keys(out),`${row.sourceName}：固定属性目标尚未解析`);
  } else if(e.type==='stat'&&typeof e.value==='string') {
   const match=e.value.match(/^加算开战时(法强|魔力|攻击力|防御力|魔抗|HP|MP)的(\d+(?:\.\d+)?)%$/);
   if(match&&keys.length)cross.push({keys,from:aliases[match[1]],percent:Number(match[2]),source:row.sourceName});
   else issue(keys.length?keys:Object.keys(out),`${row.sourceName}：${e.value} 尚未计入`);
  } else issue(keys.length?keys:Object.keys(out),`${row.sourceName}：属性计算尚未解析`);
 }
 // Removing a gear stat excludes its contribution, not the equipped item itself.
 for(const removed of report.excludedEquipmentStats||[]) {
  const key=aliases[String(removed.target).replace(/^装备/,'')];if(!key)continue;
  const identity=equipment.filter(x=>x.name===removed.sourceName);
  if(!equipped.has(removed.sourceId))equipped.set(removed.sourceId,{name:removed.sourceName,type:identity.length===1?identity[0].type:null,stats:{}});
  const item=equipped.get(removed.sourceId);if(!Object.hasOwn(item.stats,key))item.stats[key]=0;
 }
 const contextFields={staff:'法杖',robe:'长袍',clothes:'衣服',armor:'铠甲',sword:'剑',axe:'斧',spear:'枪',hammer:'槌',bow:'弓',machine:'机械',claw:'爪'};
 for(const [field,type] of Object.entries(contextFields))if(report?.context?.[field]===true&&![...equipped.values()].some(item=>item.type===type))issue(Object.keys(out),`已勾选${type}，但尚未提供具体装备的固定属性`);
 const weaponItems=[...equipped.values()].filter(item=>item.type&&!['长袍','衣服','铠甲'].includes(item.type));
 if(typeof report?.context?.weaponCount==='number'&&report.context.weaponCount>weaponItems.length)issue(Object.keys(out),'已选武器数量多于已提供固定属性的武器，需补齐装备资料');
 for(const item of equipped.values())for(const [key,value] of Object.entries(item.stats)) {
  const relevant=boosts.filter(b=>b.key===key&&(b.type===item.type||b.type==='武器'&&types.includes(item.type)&&!['长袍','衣服','铠甲'].includes(item.type))),percent=relevant.reduce((s,b)=>s+b.value,0);
  if(!item.type&&boosts.some(b=>b.key===key))issue([key],`${item.name}的装备类型未提供，无法应用装备自身加成`);
  const effective=equipmentRound(Math.fround(value*Math.fround((100+percent)/100)));
  out[key].equipment.push({name:item.name,base:value,percent,value:effective});
 }
 for(const boost of boosts)if(boost.type!=='武器'&&![...equipped.values()].some(item=>item.type===boost.type&&Object.hasOwn(item.stats,boost.key))) {
  issue([boost.key],`已选择${boost.type}自身加成，但缺少该装备的${PANEL_LABELS[boost.key]}数值`);
 }
 for(const [key,p] of Object.entries(out)) {
  if(!n(p.base)||p.base<0){p.issues.push('缺少有效基础值');continue;}
  const equipTotal=p.equipment.reduce((s,e)=>s+e.value,0);
  p.steps.push(`原始基础 ${fmt(p.base)}`);
  for(const item of p.equipment)p.steps.push(`${item.name}：${fmt(item.base)}${item.percent?` × (1 + ${fmt(item.percent)}%) → ${item.value}`:''}`);
  p.beforeBuffRaw=Math.floor(scale((p.base+equipTotal+p.flat)*p.precision,p.percent));
  p.beforeBuff=Math.floor(p.beforeBuffRaw/p.precision);
  p.steps.push(`(${fmt(p.base)} + 装备 ${fmt(equipTotal)}${p.flat?` + 固定加成 ${fmt(p.flat)}`:''}) × (1 + ${fmt(p.percent)}%) → ${p.beforeBuff}`);
  p.subtotal=p.beforeBuffRaw/p.precision;
 }
 for(const c of cross) {
  // Start-of-battle conversions use Pure status (before real-time buffs).
  // An explicitly supplied opening snapshot stays independent of current buffs.
  const ref=openingStats[c.from]??out[c.from].beforeBuff;
  if(!n(ref)||ref<0){issue(c.keys,`${c.source}：需要开战时${PANEL_LABELS[c.from]}快照（${c.percent}%）`);continue;}
  if(openingStats[c.from]==null&&out[c.from].issues.length)issue(c.keys,`${c.source}：开战${PANEL_LABELS[c.from]}计算仍有缺项`);
  const add=Math.floor(ref*c.percent/100+0.5);
  for(const key of c.keys)if(n(out[key].subtotal)){out[key].crossAdd+=add;out[key].steps.push(`${c.source}：开战基础${PANEL_LABELS[c.from]} ${fmt(ref)} × ${fmt(c.percent)}% → ${add}（状态增益前）`);}
 }
 for(const p of Object.values(out)) {
  if(n(p.subtotal)) {
   let raw=p.beforeBuffRaw+p.crossAdd*p.precision;
   p.subtotal=Math.floor(raw/p.precision);
   const classified=p.buffs.map(b=>normalizeRuntimeBuff(b,p.key));
   const combined=combineRuntimeBuffs(classified.filter(Boolean));
   const known=classified.every(Boolean)&&combined.ok;
   if(p.buffs.length===1||p.buffs.length&&known){
    const active=known?combined.active:p.buffs;
    const before=raw/p.precision,percent=active.reduce((s,b)=>s+b.value,0);
    const flat=active.reduce((s,b)=>s+(b.flatValue||0),0);
    raw=Math.floor(scale(raw+flat*p.precision,percent));p.subtotal=Math.floor(raw/p.precision);
    p.steps.push(`实时属性层（${active.map(b=>`${b.source} ${b.flatValue?fmt(b.flatValue):fmt(b.value)+'%'}`).join(' + ')}）：(${fmt(before)} + ${fmt(flat)}) × (1 + ${fmt(percent)}%) → ${p.subtotal}`);
   } else if(p.buffs.length>1)p.issues.push(combined.ok?'多项状态属性加成的分组或叠加关系待确认':combined.reason);
  }
  p.issues=[...new Set(p.issues)];p.value=p.issues.length?null:p.subtotal;
 }
 return {stats:out,values:Object.fromEntries(Object.entries(out).map(([k,p])=>[k,p.value])),openingRequired:[...new Set(cross.map(c=>c.from))]};
}
