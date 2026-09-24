import {PROCESS_SIGNATURES,PROCESS_DOCUMENTATION} from './reader-process-evidence.mjs';
import {evaluateCatalog} from './effect-rule-engine.mjs?v=20260924-basic-stats';
import {READ_ID_TO_SOURCE_ID,decodeKnownBlessingEntry} from './account-blessings.mjs?v=20260924-fullpage';
const eq=(field,value)=>({field,op:'eq',value}), inside=(field,value)=>({field,op:'in',value});
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const ELEMENTS=['none','fire','ice','earth','thunder','light','dark'];
const EL=['无','火','冰','树','雷','光','暗'];
const EQUIP={10:['sword','剑'],11:['axe','斧'],12:['spear','枪'],13:['hammer','槌'],14:['bow','弓'],15:['machine','机械'],16:['claw','爪'],17:['staff','法杖'],20:['armor','铠甲'],21:['clothes','衣服'],22:['robe','长袍']};
const KIND={1:['skill','特技'],2:['magic','魔法'],5:['ultimate','超必杀技'],9:['normal','普通攻击'],10:[null,'物理']};
const AUDIT={1050513:'装备条件下受伤修正',1050406:'指定敌类型减伤',1050402:'指定属性／攻击方式减伤',1050415:'指定属性减伤',1050200:'装备条件下物理减伤',1050411:'指定攻击方式减伤',1051208:'被动恢复量上限，不是伤害上限',1020122:'低HP时消耗MP治疗',1020000:'暴击时恢复HP',1020054:'施放指定攻击时治疗队友',2021202:'自动MP持续恢复',2031201:'自动咏唱时间修正',1031206:'条件计数对应咏唱时间',1081631:'单武器条件计数',1081641:'无武器条件计数',1081645:'武器属性／类型条件计数',1081624:'触发用计数设置'};
// Source identity is separate from value decoding. No website values are used here.
const SOURCES={70001409:['trans-life-magic','命导提升'],50222014:['water-king','水王级魔术师'],50222022:['mentor','指导者'],24450:['magic-guide-max','魔导提升极'],28176:['magic-steady-max','魔常提升极'],28180:['killer-cap-v','特攻界限突破V'],28607:['knowledge-wall-ii','知识之壁II'],25400:['auto-recast','自动再咏唱'],27830:['auto-heal-ii','自动治疗II'],26505:['moonlight-ii','月光II'],27552:['ice-ultimate-boost','冰系究极增幅'],26634:['ice-critical-revised','冰属性暴击·改'],27183:['mage-mindset-ii','魔导士心得II'],27362:['staff-ultimate-boost','法杖究极增幅'],27365:['robe-ultimate-boost','长袍究极增幅'],28608:['giant-purge-v','巨型净化V'],26421:['penetration','贯导'],55782:['magic-resonance','魔术共鸣'],55783:['short-incantation','缩短咏唱'],55784:['extraordinary-magician','超规格的魔术师'],180:['mp-up-max','MP提升极'],620:['critical-up-iii','暴击提升III'],800:['proud-force','骄傲之力'],14500:['special-boost','特攻增幅'],27414:['killer-cap-iii','特攻界限突破III'],17000:['ardor','锐气'],24810:['ice-high-boost','冰系超级增幅'],26466:['ice-attack-iii','冰属性攻击提升III'],19100:['ice-critical-boost','冰属性暴击提升'],26100:['spell-link','法术联结'],28333:['giant-purge-iii','巨型净化III'],27460:['giant-shield-ii','巨型护盾II'],70001276:['trans-ultimate-ii','超必杀技增幅II'],70001419:['trans-reduction','受到伤害减轻-20%'],70001312:['trans-robe-ii','长袍精通II'],70001418:['trans-giant-shield','巨型护盾'],70001399:['trans-killer-cap','特攻界限突破'],70001467:['trans-magic-weakness','魔法弱点增幅'],108119:['roxy-staff','洛琪希之杖'],203110:['roxy-robe','洛琪希的衣服']};

function decode(entry) {
 if(READ_ID_TO_SOURCE_ID[entry.raw?.localId]&&!entry.decoded?.accountBlessing){
  entry=decodeKnownBlessingEntry(entry);
  if(!entry.decoded?.accountBlessing)return [{...entry,effectType:'unknown',target:'已知加护 ID，参数待核对',value:null,unit:'',decoded:{},decodeIssue:'此 ID 在账户加护对照中，但本次来源或参数结构不同；保留原始记录，暂不计入。'}];
 }
 const r=entry.raw,p=r?.values,pid=entry.processId,doc=PROCESS_DOCUMENTATION[pid];
 if(!r||!Array.isArray(p)||!p.every(Number.isSafeInteger))return [entry];
 const source=SOURCES[r.localId],original={...entry,sourceName:source?.[1]||entry.sourceName,decoded:{...entry.decoded,...(source?{sourceId:source[0]}:{}),documentation:doc}};
 const signature=[entry.conditionId,r.trigger,r.conditionParams];
 const trusted=r.function===`process${pid}`&&PROCESS_SIGNATURES[pid]?.some(s=>JSON.stringify(s)===JSON.stringify(signature));
 if(entry.decoded?.conditions)return [original];
 if(r.masterFunction)return [{...original,auditCategory:'派生增益',decodeIssue:'已采集派生增益；保留实际状态证据，与赋予配置不重复累加'}];
 if(!trusted)return [{...original,decodeIssue:'处理方式或条件结构尚未验证'}];
 let conditions=[],stage='configuration',extra={},result=[],ok=true;
 const element=id=>{if(id===-2)return '';if(!ELEMENTS[id]){ok=false;return '';}conditions.push(eq('element',ELEMENTS[id]));return `${EL[id]}属性`;};
 const attack=id=>{if(id===0)return '';const k=KIND[id];if(!k){ok=false;return '';}conditions.push(id===10?inside('attackKind',['normal','skill']):eq('attackKind',k[0]));return k[1];};
 const equip=id=>{if(id===0)return '';const e=EQUIP[id];if(!e){ok=false;return '';}conditions.push(eq(e[0],true));return e[1];};
 const emit=(effectType,target,value,unit='%',detail={})=>result.push({effectType,target,value,unit,...detail});
 const clean=n=>{if(p.length<n||p.slice(n).some(v=>v!==0))ok=false;};
 const damage=(target,v)=>emit('damage',`${target||'所有'}伤害`,v/100);
 const cap=(target,add,mul=0)=>{if(add)emit('cap',`${target||'所有'}伤害上限`,add,'');if(mul)emit('cap',`${target||'所有'}伤害上限`,mul/100,'%');};
 switch(pid){
  case 1050450: clean(2);damage(element(p[0]),p[1]);break;
  case 1050350: clean(2);damage(element(p[0])+attack(2),p[1]);break;
  case 1050354: clean(2);equip(p[0]);damage(attack(2),p[1]);break;
  case 1050253: clean(2);equip(p[0]);damage(attack(10),p[1]);break;
  case 1050463: clean(2);damage(attack(p[0]),p[1]);break;
  case 1050598: clean(4);conditions.push(eq('weaponCount',1));equip(p[0]);damage(element(p[1])+attack(p[2]),p[3]);break;
  case 1082655: clean(5);conditions.push(eq('weaponCount',1));equip(p[0]);cap(element(p[1])+attack(p[2]),p[3],p[4]);break;
  case 1082604: clean(4);cap(element(p[0])+attack(p[1]),p[2],p[3]);break;
  case 1082601: clean(3);cap(attack(p[0]),p[1],p[2]);break;
  case 1082608: clean(4);equip(p[0]);cap(attack(p[1]),p[2],p[3]);break;
  case 1050476: clean(4);if(p[0]!==0||p[1]!==2)ok=false;conditions.push(eq('boss',true));damage('对Boss的'+attack(p[2]),p[3]);break;
  case 1082603: clean(4);if(p[0]!==2)ok=false;conditions.push(eq('boss',true));cap('对Boss的'+attack(p[1]),p[2],p[3]);break;
  case 1050545: case 1082461:
   clean(pid===1050545?7:8);if(JSON.stringify(p.slice(0,4))!=='[2,1,-2,1]')ok=false;
   conditions.push(eq('resonance',true));stage='trigger-definition';
   {const target=element(p[4])+attack(p[5]);if(pid===1050545)damage(target,p[6]);else cap(target,p[6],p[7]);}
   extra.note='不可叠加攻击魔法进行中才赋予，魔法结束时移除；此记录是触发配置。';break;
  case 2082663:
   clean(7);if(p[0]!==2||p[1]!==0||p[2]!==-1)ok=false;
   conditions.push(eq('boss',true),eq('bossWaveBuff',true),eq('alive',true));
   stage='trigger-definition';cap(element(p[3]),p[4],p[5]);if(r.localId===50222022&&[2,4].includes(p[3]))result=result.map(e=>({...e,target:'冰／雷属性伤害上限'}));extra.note='Boss Wave开始时赋予；按当前增益存在选项核对，不表示快照已看到生成的增益。';break;
  case 2082661: case 2082662:
   clean(10);if(r.localId!==50222022||p[3]!==0||p[4]!==2||p[5]!==0)ok=false;
   conditions.push(eq('killerBuff',true),eq('alive',true),eq('killer',true));
   cap('特攻',p[7],p[8]);stage='trigger-definition';extra.refreshFamily=`${r.localId}:killer-cap`;extra.note='开战赋予和每40秒刷新同一个增益，只计一份。';break;
  case 1082668:
   clean(4);element(p[0]);attack(p[1]);conditions.push(eq('killer',true));cap('特攻',p[2],p[3]);extra.killerBase=true;break;
  case 1082699:
   clean(7);element(p[3]);attack(p[4]);conditions.push(eq('killer',true));
   cap('特攻',p[5],p[6]);extra.dynamic={kind:'generalCount',index:p[0],min:p[1],max:p[2]};break;
  case 1050443:
   clean(4);attack(p[2]);emit('damage',`${KIND[p[2]]?.[1]||'指定攻击'}伤害`,null);extra.dynamic={kind:'chain',min:p[0],max:p[1],maximum:p[3]};extra.note='依当前法术联结次数计算；最大值不会直接当作当前加成。';stage='trigger-definition';break;
  case 1082627:
   clean(6);cap(element(p[2])+attack(p[3]),p[4],p[5]);extra.dynamic={kind:'targetHits',min:p[0],max:p[1],maximum:p[4],maximumPercent:p[5]};extra.note=`按目标累计命中数变化，${p[1]}次达到配置最大值；未填命中数时不计入。`;break;
  case 1082459:
   clean(8);if(p[3]!==2)ok=false;conditions.push(eq('boss',true));cap('对Boss的'+element(p[4])+attack(p[5]),p[6],p[7]);extra.dynamic={kind:'generalCount',index:p[0],min:p[1],max:p[2]};break;
  case 1082641:
   clean(5);if(p[0]!==0||p[1]!==-2||p[2]!==8224)ok=false;
   conditions.push(eq('alive',true),inside('attackKind',['normal','skill','magic']));cap('物理／魔法',p[3],p[4]);stage='trigger-definition';break;
  case 1030307:
   clean(4);element(p[0]);attack(p[1]);if(p[2]!==0)ok=false;conditions.push(eq('penetration',true));emit('defenseReference','敌方魔抗',100+p[3]/100);stage='attack';break;
  case 2030206:
   clean(3);if(p[0]!==0)ok=false;emit('statBuff','法强',p[1]/100);stage='trigger-definition';extra.note='常驻状态赋予配置；已采用读取面板时不再次加算。';break;
  case 1030201:
   clean(4);if(p[0]!==1||p[1]!==10000||p[2]!==0)ok=false;conditions.push(eq('fullHp',true));emit('statBuff','法强',p[3]/100);stage='runtime';break;
  case 1030206:
   clean(7);if(p[0]!==0||p[3]!==3||p[4]!==5||p[5]!==0||p[6]!==1)ok=false;
   emit('stat','防御力与魔抗',`加算开战时法强的${-p[1]*p[2]/1000000}%`,'');extra.note='以开战纯法强换算固定加值，不是双防百分比。';stage='snapshot-conversion';break;
  case 1030400:
   if(r.operationFlag!==801||r.statType!==8||r.mul!==0||r.postAdd!==0||p[0]!==r.add)ok=false;
   emit('critRate','暴击率',r.add);stage='panel';break;
  case 1030416:
   clean(3);if(p[0]!==1||p[1]!==10000)ok=false;conditions.push(eq('fullHp',true));emit('critRate','暴击率',p[2]);stage='runtime';break;
  case 1030405:
   clean(2);emit('critRate',element(p[0])+'攻击暴击率',p[1]);stage='attack';break;
  case 1050485:
   clean(2);emit('damage',element(p[0])+'暴击伤害',p[1]/100);extra.triggerConditions=[eq('critical',true)];extra.note='仅暴击时参与伤害；此表核对暴伤配置。';break;
  case 1080001:
   clean(1);emit('critPermission',element(p[0])+attack(2),true,'');stage='attack';break;
  case 1050900:
   clean(1);conditions.push(eq('killer',true));emit('killerPower','特攻威力修正',p[0]/100);extra.note='原生特攻倍率的修正，与一般特攻条件增伤分开计算。';break;
  case 1030814:
   clean(3);if(p[0]!==2||p[1]!==0||p[2]!==304)ok=false;
   conditions.push(eq('boss',true),inside('attackKind',['skill','magic','ultimate']),eq('magicFamily','normal'));emit('killer','Boss',true,'');break;
  case 1050367:
   clean(2);if(p[0]!==0)ok=false;conditions.push(eq('weakness',true));attack(2);emit('damage','命中弱点的魔法伤害',p[1]/100);break;
  case 1031904:
   clean(5);equip(p[0]);equip(p[1]);if(!EQUIP[p[2]]||![4,5].includes(p[3]))ok=false;
   emit('equipmentStat',`${EQUIP[p[2]]?.[1]}自身${p[3]===4?'法强':'魔抗'}`,p[4]/100);stage='equipment';break;
  case 1082501:
   clean(8);if(p[0]!==0||!p.slice(1,7).every(v=>v===p[1])||!ELEMENTS[p[1]])ok=false;
   conditions.push(eq('attackKind','magic'),eq('magicFamily','normal'));emit('hit',element(p[1])+'魔法',2,'倍',{secondary:p[7]/10000});stage='configuration';extra.note='原生MultiBullet分支重复2次；单次倍率取实际参数。特殊魔法的排除条件单独保留。';break;
  case 2050419:
   clean(4);damage(element(p[1]),p[2]);conditions.push(eq('readerTimedBuffActive',true));stage='trigger-definition';extra.note=`开战时赋予，持续${p[0]}帧；未读取当前增益及剩余时间，暂不计入。`;break;
  case 1030308:
   clean(3);equip(p[0]);if(p[1]!==0)ok=false;emit('stat','魔抗',p[2]/100);stage='panel';break;
  default:
   if(entry.effectType==='stat'&&entry.conditionId===1000&&r.trigger===1){result=[{effectType:entry.effectType,target:entry.target,value:entry.value,unit:entry.unit}];stage='panel';}
 }
 if(!ok||!result.length)return [{...original,...(ok&&AUDIT[pid]?{auditCategory:AUDIT[pid]}:{}),decodeIssue:!ok?'已采集：参数或条件超出已验证范围':AUDIT[pid]?`已识别：${AUDIT[pid]}；保留原始参数，不加入输出伤害汇总`:'已采集：作用或数值仍需解析'}];
 return result.map((e,i)=>({...original,...e,id:result.length===1?entry.id:`${entry.id}:part${i}`,decoded:{...original.decoded,conditions,stage,...extra,rawEntryId:entry.id,externalConditionImplementationVerified:false,appliedToHitVerified:false}}));
}

export function decodeReaderBonuses(bonuses){
 const result=(bonuses||[]).flatMap(decode);
 return result.map(b=>{
  if(b.processId!=null||!b.raw)return b;
  const parent=result.find(p=>p.raw?.buffUid===b.raw.buffUid&&p.raw?.localId===b.raw.localId&&p.decoded?.conditions&&((b.raw.operationFlag===73&&p.processId===1031904)||(b.raw.operationFlag===806&&p.processId===1030308)||(b.raw.operationFlag===120&&p.processId===1082501)));
  return parent?{...b,sourceName:parent.sourceName,auditCategory:'派生操作',coveredBy:parent.id,decodeIssue:'已由同一Buff的主配置涵盖，保留原始记录，不重复计入'}:b;
 });
}
export function evaluateReaderBonuses(bonuses,context){
 const validController=(b,pid)=>b.processId===pid&&b.raw?.function===`process${pid}`&&!b.raw.masterFunction&&b.raw.buffEnabled!==0&&b.raw.buffRemoved!==1&&b.raw.buffIgnored!==1&&PROCESS_SIGNATURES[pid]?.some(s=>JSON.stringify(s)===JSON.stringify([b.conditionId,b.raw.trigger,b.raw.conditionParams]));
 let result=bonuses.map(original=>{
  const b={...original};
  const d=b.decoded?.dynamic;if(!d)return b;
  const conditions=[...(b.decoded.conditions||[])];
  if(d.kind==='chain'){
   const n=context.chainStacks;
   const value=finite(n)&&d.max>d.min?Math.round(d.maximum*Math.max(0,Math.min(1,(n-d.min)/(d.max-d.min))))/100:null;
   return {...b,value,decoded:{...b.decoded,note:`法术联结${n??'未知'}次：按读取的上限和次数区间计算。`}};
  }
  if(d.kind==='generalCount'){
   if(d.index===0&&d.min===0&&d.max===0)return b;
   const controllers=bonuses.filter(x=>x.raw?.localId===b.raw?.localId);
   const single=controllers.find(x=>validController(x,1081631)&&JSON.stringify(x.raw.values.slice(0,5))===JSON.stringify([0,d.index,1,0,0]));
   const unarmed=controllers.find(x=>validController(x,1081641)&&JSON.stringify(x.raw.values.slice(0,4))===JSON.stringify([d.index,1,0,0]));
   if(single&&d.min===0&&d.max===1){conditions.push(unarmed?inside('weaponCount',[0,1]):eq('weaponCount',1));return {...b,decoded:{...b.decoded,conditions,controllerEvidence:[single.id,...(unarmed?[unarmed.id]:[])],note:'按同来源的单武器／无武器计数赋予配置推导；并非实时计数观测。'}};}
  }
  return {...b,value:null,decoded:{...b.decoded,conditions:[...conditions,eq('readerUnresolvedCondition',true)]},decodeIssue:'已采集可变加成配置，缺少当前计数，不把最大值计入'};
 });
 // Exactly one effect refreshed by multiple triggers. Do not dedupe unrelated equal values.
 const families=new Map();
 result=result.filter(b=>{const family=b.decoded?.refreshFamily;if(!family||readerBonusState(b,context).status!=='active')return true;
  const key=JSON.stringify([family,b.effectType,b.target,b.value,b.unit,b.decoded.conditions]);
  if(!families.has(key)){families.set(key,b);return true;}
  const first=families.get(key);first.decoded={...first.decoded,relatedRecords:[...(first.decoded.relatedRecords||[]),b.id]};return false;
 });
 // Merge verified base + single-weapon increment into one source for website comparison.
 const extras=result.filter(b=>b.decoded?.dynamic?.kind==='generalCount'&&b.processId===1082699&&readerBonusState(b,context).status==='active');
 const used=new Set();
 result=result.map(b=>{
  if(!b.decoded?.killerBase||readerBonusState(b,context).status!=='active')return b;
  const scope=c=>JSON.stringify(c.filter(x=>x.field!=='weaponCount').map(x=>JSON.stringify(x)).sort());
  const extra=extras.filter(x=>x.raw.localId===b.raw.localId&&x.target===b.target&&x.unit===b.unit&&finite(x.value)&&scope(x.decoded.conditions)===scope(b.decoded.conditions));
  if(extra.length!==1)return b;
  used.add(extra[0].id);
  return {...b,id:`${b.id}+${extra[0].id}`,value:b.value+extra[0].value,decoded:{...b.decoded,conditions:extra[0].decoded.conditions,components:[{id:b.id,value:b.value},{id:extra[0].id,value:extra[0].value}],note:`同一来源：基础${b.value}${b.unit}＋条件追加${extra[0].value}${b.unit}。`}};
 });
 return result.filter(b=>!used.has(b.id));
}
export function readerBonusState(b,context){
 if(b.optionExcludedReason)return {status:'inactive',reason:b.optionExcludedReason};
 if(b.coveredBy)return {status:'covered',reason:b.decodeIssue};
 if(['inactive','disabled','removed'].includes(b.state)||b.raw?.buffRemoved===1||b.raw?.buffIgnored===1||b.raw?.buffEnabled===0)return {status:'inactive',reason:'读取到已移除或禁用的记录'};
 if(!Array.isArray(b.decoded?.conditions))return {status:b.auditCategory?'documented':'unresolved',reason:b.decodeIssue||'已采集，条件未解析'};
 const row=evaluateCatalog([{id:'read',group:'common',rules:[{id:'read',conditions:b.decoded.conditions,effects:[{type:'utility'}],review:'ready'}]}],context).rows[0];
 return {status:row.status,reason:row.reasons.join('；')};
}
export function observedCritical(unit){
 const explicit=unit?.statsMeta?.criticalRate;
 const raw=unit?.raw?.criticalRaw;
 const value=finite(explicit)?explicit:unit?.statsMeta?.basis==='battle-final-at-observation'&&finite(raw)?raw:null;
 return {value,note:'观察时面板暴击率，已含当时生效的面板增益；招式与属性暴击修正另行核对，不能重复加入常驻暴击。'};
}
