import {buildCatalog} from './effect-rule-learning.mjs?v=20260926-mayly';
import {retargetReport} from './entry-preparation.mjs?v=20260928-special-weapon';
import {buildDamageImport} from './damage-import.mjs?v=20260926-mayly';
import {calculateWebsitePanel} from './panel-calculator.mjs?v=20260926-skill-coverage';
import {normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-condition-tags';
import {combineRuntimeBuffs} from './runtime-buff-engine.mjs?v=20260924-condition-tags';
import {magicBuffCap} from './magic-buffs.mjs?v=20260926-mayly';
import {basicStatIdentity,basicStatNameIdentity} from './basic-stat-rules.mjs?v=20260924-condition-tags';
import {commonSkillIdentity} from './common-skill-rules.mjs?v=20260926-skill-coverage';
import {formatEffect,describeCondition} from './effect-rule-engine.mjs?v=20260926-mayly';
import {EFFECTS} from './damage-engine.mjs?v=20260927-hit-core';

const eq=(field,value)=>({field,op:'eq',value});
const elements={火:'fire',冰:'ice',树:'earth',雷:'thunder',光:'light',暗:'dark',无:'none'};
const stats={攻击力:'攻击力',魔力:'法强',法强:'法强',防御力:'防御力',魔抗:'魔抗',HP:'HP',MP:'MP'};
// Only whole, unconditional numeric descriptions are parsed here. A trailing
// condition or an unknown clause leaves the entire source visible for review.
export function simpleLoadoutRules(source){
 const text=source.text.replace(/＋/g,'+').replace(/％/g,'%').trim().replace(/[。.]$/,'');
 const parts=text.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g,'').split(/[；;、，,]/).map(x=>x.trim()).filter(Boolean),rules=[];
 if(!parts.length)return null;
 for(const part of parts){
  const effects=[],conditions=[];
  const match=part.match(/^(.+?)\s*\+\s*(\d+(?:\.\d+)?)\s*(%)?$/);if(!match)return null;
  const target=match[1].trim(),value=Number(match[2]),unit=match[3]||'';
  let type;
  if(stats[target]&&unit==='%')effects.push({type:'stat',target:stats[target],value,unit});
  else if(target==='暴击率'&&unit==='%')effects.push({type:'critRate',target,value,unit});
  else {
  if(!/^(?:[火冰树雷光暗无]属性)?(?:魔法|物理|特技|超必杀技|普通攻击|特攻|暴击|对Boss的)?伤害(?:上限)?$/.test(target))return null;
  type=target.endsWith('上限')?'cap':'damage';if(type==='cap'&&unit||type==='damage'&&unit!=='%')return null;
  if(/^[火冰树雷光暗无]属性/.test(target))conditions.push(eq('element',elements[target[0]]));
  for(const [word,kind] of [['魔法','magic'],['特技','skill'],['超必杀技','ultimate'],['普通攻击','normal']])if(target.includes(word))conditions.push(eq('attackKind',kind));
  if(target.includes('物理'))conditions.push(eq('damageType','physical'));
  if(target.includes('特攻'))conditions.push(eq('killer',true));
  if(target.includes('对Boss'))conditions.push(eq('boss',true));
  effects.push({type,target,value,unit});
  }
  rules.push({id:`${source.id}-simple-${rules.length}`,part:rules.length+1,text:part,conditions,effects,review:'ready',verification:'description'});
 }
 return rules;
}

export function loadoutSources(report,manualEffects=[]){
 const sources=new Map();
 for(const row of [...(report.loadoutInventory||[]),...(report.rows||[])]){
  if(!sources.has(row.sourceId))sources.set(row.sourceId,{sourceId:row.sourceId,name:row.sourceName,text:row.sourceText||'',group:row.group,enabled:false,effects:[]});
  const source=sources.get(row.sourceId);
  if(row.status!=='disabled')source.enabled=true;
  if(!source.text&&row.sourceText)source.text=row.sourceText;
 }
 for(const row of report.rows||[]){
  const source=sources.get(row.sourceId);
  const text=(row.rule.effects||[]).map(formatEffect).join('；');
  if(text)source.effects.push(`${row.rule.conditions?.length?row.rule.conditions.map(describeCondition).join('、')+'：':''}${text}`);
 }
 for(const source of sources.values()){
  source.effects=[...new Set(source.effects)];
  if(!source.text)source.text=source.effects.join('；');
  if(source.group==='blessings'&&report.context.accountBlessings===false)source.enabled=false;
  if(source.group==='equipment'){
   source.equipmentType=(report.profile?.equipment?.find(e=>e.name===source.name)?.type||'').trim();
   source.enabled=source.enabled&&(report.context.equipmentIds||[]).includes(source.sourceId);
  }
 }
 for(const e of manualEffects)if(!e.importId)sources.set(`manual-effect:${e.id}`,{sourceId:`manual-effect:${e.id}`,name:e.name||'手动加成',text:`${EFFECTS[e.kind]||e.kind}${['element','race'].includes(e.kind)?'（'+e.target+'）':''} ${e.percent}%`,group:'manual',enabled:e.enabled===true,effects:[`${e.percent}% · ${{post:'结算后逐条修正',offense:'核心前攻击侧',received:'核心前目标受伤',reduction:'核心前减伤'}[e.stage]||e.stage}`]});
 return [...sources.values()];
}

// The character's weapon is distinct from their armor and other equipment.
export function exclusiveWeaponSourceIds(sources){
 return sources.filter(s=>s.group==='equipment'&&['法杖','剑','斧','枪','槌','弓','机械','爪','刀','弩','锤'].includes(s.equipmentType)).map(s=>s.sourceId);
}

// The damage page's 专武 switch equips every exclusive item the character has
// (weapon and armor alike), independent of the basic calculator.
export function exclusiveGearSourceIds(sources){
 return sources.filter(s=>s.group==='equipment').map(s=>s.sourceId);
}

export function reportLoadoutSnapshot(report,manualEffects=[]){
 const sources=loadoutSources(report,manualEffects);
 return {characterId:report.characterId,totalSc:0,sourceIds:sources.map(s=>s.sourceId),items:sources.filter(s=>s.enabled).map(s=>({...s,id:s.sourceId,sourceIds:[s.sourceId]}))};
}
export function toggleExclusiveWeapon(snapshot,sources,enabled){
 const ids=exclusiveGearSourceIds(sources),weapons=new Set(ids);
 const items=snapshot.items.filter(item=>!item.sourceIds?.some(id=>weapons.has(id)));
 if(enabled)for(const source of sources.filter(s=>weapons.has(s.sourceId))){
  const previous=snapshot.items.find(item=>item.sourceIds?.includes(source.sourceId));
  items.push(previous||{...source,id:source.sourceId,sourceIds:[source.sourceId]});
 }
 return {...snapshot,sourceIds:[...new Set([...(snapshot.sourceIds||[]),...ids])],items};
}

export function resolvedLoadoutItems(baseReport,snapshot){
 // Category copies share their catalog identity. Native character rules retain
 // their source IDs, including exclusions and confirmed reader replacements.
 const native=new Map();
 for(const row of baseReport.rows||[])if(['common','exclusive','transcend'].includes(row.group)){
  const id=commonSkillIdentity({name:row.sourceName,text:row.sourceText})||basicStatNameIdentity(row.sourceName);if(id){const set=native.get(id)||new Set();set.add(row.sourceId);native.set(id,set);}
 }
 const items=new Map();
 for(const original of snapshot.items){
  const catalogId=commonSkillIdentity(original)||basicStatIdentity(original)||basicStatNameIdentity(original.name);
  const sourceIds=original.sourceIds?.length?original.sourceIds:!original.edited&&catalogId&&native.has(catalogId)?[...native.get(catalogId)]:[];
  const item={...original,catalogId,sourceIds},key=catalogId||original.id;
  if(!items.has(key)||sourceIds.length&&!items.get(key).sourceIds.length)items.set(key,item);
 }
 return [...items.values()];
}

export function extraCommonSkills(baseReport,snapshot){
 return resolvedLoadoutItems(baseReport,snapshot).filter(s=>!s.sourceIds.length||s.edited).map(s=>({...s,confirmationKey:String(s.catalogId||s.id)}));
}

export const ARK_STATS={hp:'HP',mp:'MP',attack:'攻击力',defense:'防御力',intelligence:'法强',mind:'魔抗'};
export function withArkStats(report,values={}){
 const effects=Object.entries(ARK_STATS).flatMap(([key,target])=>{
  const raw=values[key],value=raw===''||raw==null?0:Number(raw);
  if(!Number.isFinite(value)||value<0)throw new Error(`圣物${target}请填写不小于 0 的数值`);
  return value?[{type:'stat',target,value,unit:''}]:[];
 });
 return {...report,rows:[...report.rows,...(effects.length?[{sourceId:'custom-ark-stats',sourceName:'圣物固定属性',sourceText:'手填圣物固定属性',group:'ark',status:'active',rule:{id:'custom-ark-stats',review:'ready',conditions:[],effects}}]:[])]};
}

export function buildLoadoutReport(baseReport,snapshot,selection,templates={}){
 if(String(snapshot.characterId)!==String(baseReport.characterId))throw new Error('配装角色与伤害资料不一致');
 snapshot={...snapshot,items:resolvedLoadoutItems(baseReport,snapshot)};
 const represented=new Set(snapshot.sourceIds||[]),selected=new Set(snapshot.items.flatMap(s=>s.sourceIds||[]));
 const availableIds=new Set(baseReport.rows.map(r=>r.sourceId));
 const newlySelected=(baseReport.loadoutInventory||[]).filter(r=>!availableIds.has(r.sourceId)&&selected.has(r.sourceId)&&
  (r.group==='equipment'&&r.reasons?.includes('未选择这件装备')||r.group==='blessings'&&baseReport.context.accountBlessings===false));
 const rows=[...baseReport.rows,...newlySelected].map(r=>{
  if(represented.has(r.sourceId)&&!selected.has(r.sourceId))return {...r,status:'disabled'};
  if(selected.has(r.sourceId)&&r.group==='equipment'&&r.reasons?.includes('未选择这件装备'))return {...r,status:'inactive'};
  return r;
 });
 const equipmentFields={'法杖':'staff','长袍':'robe','衣服':'clothes','铠甲':'armor','剑':'sword','斧':'axe','枪':'spear','槌':'hammer','弓':'bow','机械':'machine','爪':'claw'};
 const context={...baseReport.context};
 const gear=loadoutSources(baseReport).filter(s=>s.group==='equipment');
 const equippedIds=new Set(context.equipmentIds||[]);
 const removed=gear.filter(s=>equippedIds.has(s.sourceId)&&represented.has(s.sourceId)&&!selected.has(s.sourceId));
 for(const item of removed){
  const type=baseReport.profile.equipment?.find(e=>e.name===item.name)?.type,field=equipmentFields[type];
  if(field){
   const other=gear.some(s=>s.sourceId!==item.sourceId&&selected.has(s.sourceId)&&baseReport.profile.equipment?.some(e=>e.name===s.name&&e.type===type));
   if(!other){context[field]=false;if(field==='staff')context.iceStaff=false;}
   if(!['robe','clothes','armor'].includes(field)&&Number.isFinite(context.weaponCount))context.weaponCount=Math.max(0,context.weaponCount-1);
  }
 }
 context.equipmentIds=(context.equipmentIds||[]).filter(id=>!removed.some(s=>s.sourceId===id));
 const knownWeaponCount=gear.filter(s=>context.equipmentIds.includes(s.sourceId)&&exclusiveWeaponSourceIds([s]).length).length;
 // Choosing the concrete weapon fills an already selected weapon slot first.
 // It must not turn a one-weapon character into a two-weapon build by accident.
 let emptyWeaponSlots=Number.isFinite(context.weaponCount)?Math.max(0,context.weaponCount-knownWeaponCount):0;
 for(const item of gear.filter(s=>represented.has(s.sourceId)&&selected.has(s.sourceId)&&!equippedIds.has(s.sourceId))){
  context.equipmentIds.push(item.sourceId);
  const type=baseReport.profile.equipment?.find(e=>e.name===item.name)?.type,field=equipmentFields[type];
  if(field){context[field]=true;if(!['robe','clothes','armor'].includes(field)){
   if(emptyWeaponSlots>0)emptyWeaponSlots--;
   else context.weaponCount=(Number.isFinite(context.weaponCount)?context.weaponCount:knownWeaponCount)+1;
  }}
 }
 if(JSON.stringify(context.equipmentIds)!==JSON.stringify(baseReport.context.equipmentIds||[]))delete context.weaponDetails;
 const knownWeapons=gear.filter(s=>context.equipmentIds.includes(s.sourceId)).flatMap(s=>{
  const item=baseReport.profile.equipment?.find(e=>e.name===s.name),type=equipmentFields[item?.type];
  return item?.element&&type&&!['robe','clothes','armor'].includes(type)?[{type,element:item.element}]:[];
 });
 if(knownWeapons.length)context.weaponDetails=knownWeapons;
 if(loadoutSources(baseReport).some(s=>s.group==='blessings'&&represented.has(s.sourceId)&&selected.has(s.sourceId)))context.accountBlessings=true;
 const extra=snapshot.items.filter(s=>!s.sourceIds?.length||s.edited).map(s=>({id:`loadout:${s.id}`,catalogId:s.catalogId,edited:s.edited,name:s.name,text:s.text,group:'common'}));
 const editedIds=new Set(snapshot.items.filter(s=>s.edited).flatMap(s=>s.sourceIds||[]));
 const seeds=Object.values(Object.groupBy(baseReport.rows,r=>r.sourceId)).map(rs=>({id:rs[0].sourceId,name:rs[0].sourceName,text:rs[0].sourceText,rules:rs.map(r=>r.rule)}));
 const catalog=buildCatalog(extra,seeds,templates).map(s=>s.unknown&&simpleLoadoutRules(s)?{...s,unknown:false,rules:simpleLoadoutRules(s)}:s);
 const additions=catalog.flatMap(s=>s.rules.map(rule=>({sourceId:s.id,sourceName:s.name,sourceText:s.text,group:s.group,status:'active',rule})));
 return retargetReport({...baseReport,context,rows:[...rows.filter(r=>!editedIds.has(r.sourceId)),...additions]},selection);
}

export function prepareLoadoutPreview({baseReport,snapshot,selection,input,baseCap=9999,baseCritRate=0,templates={},selectedBuffs=[],runtimeAnchor=[],criticalAnchor=null,manualDefenseRatio=null,baselineImport=null,attackOverride=null,arkStats={},disabledCommonIds=[]}){
 const raceIds={'战士':'soldier','狙击手':'sniper','骑士':'knight','魔法师':'sorcerer','兽':'beast','植物':'plant','昆虫':'insect','鸟':'bird','魔法生物':'creature','不死生物':'undead','石':'stone','机械':'machine','精灵':'spirit','龙':'dragon','神':'god','鱼':'fish'};
 selection={...selection,boss:input.boss===true,back:input.back,air:input.air,ailment:input.ailment,ground:input.ground,stunned:input.stunned===true,weakness:input.weakness===true,
  enemyRaces:input.races?.length?input.races.map(r=>raceIds[r]||r):null};
 snapshot={...snapshot,items:resolvedLoadoutItems(baseReport,snapshot)};
 const commonSkills=extraCommonSkills(baseReport,snapshot),disabled=new Set(disabledCommonIds);
 const offIds=new Set(commonSkills.filter(s=>disabled.has(s.confirmationKey)).map(s=>s.id));
 snapshot={...snapshot,items:snapshot.items.filter(s=>!offIds.has(s.id))};
 const report=withArkStats(buildLoadoutReport(baseReport,snapshot,selection,templates),arkStats);
 const unresolved=[];
 for(const row of report.rows)if(row.status==='pending')unresolved.push({name:row.sourceName,text:row.sourceText,reason:row.reasons.join('；')||'尚未识别'});
 // Keep known effects calculable while exposing unmapped operations explicitly.
 const safeRows=report.rows.filter(r=>r.status==='active').map(row=>{
  const effectIndices=[];
  const effects=row.rule.effects.filter((effect,index)=>{
   const one=buildDamageImport({...report,rows:[{...row,effectIndices:[row.effectIndices?.[index]??index],rule:{...row.rule,effects:[effect]}}]});
   if(one.blockers.length){unresolved.push({name:row.sourceName,text:row.sourceText,reason:one.blockers.join('；')});return false;}
   effectIndices.push(row.effectIndices?.[index]??index);
   return true;
  });return {...row,effectIndices,rule:{...row.rule,effects}};
 });
 const safe={...report,rows:safeRows},imported=buildDamageImport(safe);
 if(imported.blockers.length)throw new Error(imported.blockers.join('；'));
 const base=baseReport.profile.baseStats,equipment=baseReport.profile.equipment;
 function panelFor(source){return calculateWebsitePanel(base,source,{equipment});}
 // Attributes and damage use the same current scenario. A saved reader HP
 // state must not pin Moonlight or near-death stat bonuses in the preview.
 const panelReport=report;
 const panel=panelFor(panelReport),key=selection.statReference==='int'?'intelligence':selection.statReference==='str'?'attack':null;
 for(const p of Object.values(panel.stats))for(const reason of p.issues)unresolved.push({name:p.label,text:'',reason});
 const buffsFor=stat=>{
  const known=stat.buffs.flatMap(b=>{const normalized=normalizeRuntimeBuff(b,stat.key);if(normalized)return [normalized];unresolved.push({name:b.source,text:'',reason:'实时属性增益的叠加类型尚未识别，暂未计入'});return [];});
  // An observed runtime buff is retained only while its source still exists;
  // selected HP conditions and selected spells are evaluated anew.
  const existing=new Set(panelReport.rows.filter(r=>r.status==='active').map(r=>r.sourceName));
  const anchors=runtimeAnchor.filter(b=>!b.hpCondition&&!b.activationCondition&&(!b.source||existing.has(b.source))&&!known.some(x=>x.runtime.stackGroup===b.runtime.stackGroup));
  const selected=selectedBuffs.filter(b=>b.stat===stat.key).map(b=>normalizeRuntimeBuff({id:b.id,source:b.name,value:b.statPercent,runtime:b.runtime},stat.key));
  if(selected.some(b=>!b))throw new Error('所选魔法增益的类型尚未确认');
  const result=combineRuntimeBuffs([...known,...anchors],selected);
  if(!result.ok)throw new Error(result.reason);return result.percent;
 };
 // Preserve edits, deletions and ordering made in the calculator's imported
 // effect list while filtering out operations whose loadout source was removed.
 const retained=new Map(imported.effects.map(e=>[e.importId,e]));
 const representedSources=new Set(snapshot.sourceIds||[]),selectedSources=new Set(snapshot.items.flatMap(item=>item.sourceIds||[]));
 const manualEffect=e=>{if(e.bonusGroup==='ark')return [e];const sourceId=`manual-effect:${e.id}`;return !representedSources.has(sourceId)?[e]:selectedSources.has(sourceId)?[{...e,enabled:true}]:[];};
 const matched=new Set();
 const draftEffects=input.effects.flatMap(e=>{
  if(!e.importId)return manualEffect(e);
  const current=retained.get(e.importId),original=baselineImport?.effects.find(b=>b.importId===e.importId);
  if(!current)return [];
  matched.add(e.importId);
  return [original&&JSON.stringify(original)===JSON.stringify(current)?e:current];
 });
 const newEffects=imported.effects.filter(e=>!matched.has(e.importId)&&!(baselineImport?.effects.some(b=>b.importId===e.importId&&JSON.stringify(b)===JSON.stringify(e))));
 const next={...structuredClone(input),...(report.context.nativeElementAttacks?.includes(report.context.attack)?{element:imported.element}:{}),effects:baselineImport?[...draftEffects,...newEffects]:[...imported.effects,...input.effects.filter(e=>!e.importId).flatMap(manualEffect)],cap:baseCap+imported.capAdded+magicBuffCap(selectedBuffs,imported.skillType,imported.reference),criticalCapAdded:imported.criticalCapAdded,
  defenseRatio:Number.isFinite(manualDefenseRatio)?manualDefenseRatio:imported.defenseRatio,
  killerCorrection:imported.killerCorrection,specialAttack:selection.specialAttack===true,critRate:selection.criticalEnabled?Math.min(100,Math.max(0,(criticalAnchor?criticalAnchor.rate-criticalAnchor.contribution:baseCritRate)+imported.critAdded)):0};
 let projectStatPercent;
 if(key){
  const stat=panel.stats[key];
  if(!Number.isFinite(stat.beforeBuff)||stat.beforeBuff<=0)throw new Error(`${stat.label}缺少有效基础值，请先补齐角色属性`);
  const runtime=buffsFor(stat);
  next.attackBasis='layers';next.attackBase=stat.beforeBuff+stat.crossAdd;next.runtimeStatPercent=runtime;next.attack=Math.floor(next.attackBase*(100+runtime)/100);
  if(attackOverride)Object.assign(next,attackOverride);
  panel.values[key]=next.attack;
  if(!stat.issues.length)projectStatPercent=percent=>{
   const row={sourceId:'recommend-stat',sourceName:'属性推荐',status:'active',rule:{id:'recommend-stat',review:'ready',conditions:[],effects:[{type:'stat',target:stat.label,value:percent,unit:'%'}]}};
   const changed=panelFor({...panelReport,rows:[...panelReport.rows,row]}).stats[key];
   if(changed.issues.length)throw new Error(changed.issues.join('；'));
   const attackBase=changed.beforeBuff+changed.crossAdd;
   return {...structuredClone(next),attackBase,attack:Math.floor(attackBase*(100+runtime)/100)};
  };
 }
 if(selection.dualWield){
  next.hitMultiplier=selection.hitMultiplier??(imported.hitSources.length?imported.hitMultiplier:2);
  next.hitDamageRatio=selection.hitDamageRatio??(imported.hitSources.length?imported.hitDamageRatio:0.6);
  next.hitScaleStage=selection.hitScaleStage||imported.hitScaleStage||(input.hitScaleStage||'core');
 }else{next.hitMultiplier=1;next.hitDamageRatio=1;}
 return {input:next,report:safe,imported,panel,projectStatPercent,commonSkills:commonSkills.map(s=>({...s,enabled:!disabled.has(s.confirmationKey),rows:safe.rows.filter(r=>r.sourceId===`loadout:${s.id}`),issues:unresolved.filter(item=>item.name===s.name).map(item=>item.reason)})),unresolved:[...new Map(unresolved.map(x=>[JSON.stringify(x),x])).values()]};
}
