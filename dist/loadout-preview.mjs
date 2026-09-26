import {buildCatalog} from './effect-rule-learning.mjs?v=20260926-common-skills';
import {retargetReport} from './entry-preparation.mjs?v=20260926-switch-controls';
import {buildDamageImport} from './damage-import.mjs?v=20260926-common-skills';
import {calculateWebsitePanel} from './panel-calculator.mjs?v=20260924-condition-tags';
import {normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-condition-tags';
import {combineRuntimeBuffs} from './runtime-buff-engine.mjs?v=20260924-condition-tags';
import {magicBuffCap} from './magic-buffs.mjs?v=20260924-condition-tags';
import {basicStatIdentity,basicStatNameIdentity} from './basic-stat-rules.mjs?v=20260924-condition-tags';
import {commonSkillIdentity} from './common-skill-rules.mjs?v=20260926-common-skills';

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

export function loadoutSources(report){
 const sources=new Map();
 for(const row of report.rows||[])if(['common','exclusive','transcend'].includes(row.group)){
  if(!sources.has(row.sourceId))sources.set(row.sourceId,{sourceId:row.sourceId,name:row.sourceName,text:row.sourceText,group:row.group,enabled:false});
  if(row.status!=='disabled')sources.get(row.sourceId).enabled=true;
 }
 return [...sources.values()];
}

export function buildLoadoutReport(baseReport,snapshot,selection,templates={}){
 if(String(snapshot.characterId)!==String(baseReport.characterId))throw new Error('配装角色与伤害资料不一致');
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
 snapshot={...snapshot,items:[...items.values()]};
 const represented=new Set(snapshot.sourceIds||[]),selected=new Set(snapshot.items.flatMap(s=>s.sourceIds||[]));
 const rows=baseReport.rows.filter(r=>!represented.has(r.sourceId)||selected.has(r.sourceId));
 const extra=snapshot.items.filter(s=>!s.sourceIds?.length||s.edited).map(s=>({id:`loadout:${s.id}`,catalogId:s.catalogId,edited:s.edited,name:s.name,text:s.text,group:'common'}));
 const editedIds=new Set(snapshot.items.filter(s=>s.edited).flatMap(s=>s.sourceIds||[]));
 const seeds=Object.values(Object.groupBy(baseReport.rows,r=>r.sourceId)).map(rs=>({id:rs[0].sourceId,name:rs[0].sourceName,text:rs[0].sourceText,rules:rs.map(r=>r.rule)}));
 const catalog=buildCatalog(extra,seeds,templates).map(s=>s.unknown&&simpleLoadoutRules(s)?{...s,unknown:false,rules:simpleLoadoutRules(s)}:s);
 const additions=catalog.flatMap(s=>s.rules.map(rule=>({sourceId:s.id,sourceName:s.name,sourceText:s.text,group:s.group,status:'active',rule})));
 return retargetReport({...baseReport,rows:[...rows.filter(r=>!editedIds.has(r.sourceId)),...additions]},selection);
}

export function prepareLoadoutPreview({baseReport,snapshot,selection,input,baseCap=9999,baseCritRate=0,templates={},selectedBuffs=[],runtimeAnchor=[],criticalAnchor=null,manualDefenseRatio=null}){
 const raceIds={'战士':'soldier','狙击手':'sniper','骑士':'knight','魔法师':'sorcerer','兽':'beast','植物':'plant','昆虫':'insect','鸟':'bird','魔法生物':'creature','不死生物':'undead','石':'stone','机械':'machine','精灵':'spirit','龙':'dragon','神':'god','鱼':'fish'};
 selection={...selection,boss:input.boss===true,back:input.back,air:input.air,ailment:input.ailment,ground:input.ground,stunned:input.stunned===true,weakness:input.weakness===true,
  enemyRaces:input.races?.length?input.races.map(r=>raceIds[r]||r):null};
 const report=buildLoadoutReport(baseReport,snapshot,selection,templates);
 const unresolved=[];
 for(const row of report.rows)if(row.status==='pending')unresolved.push({name:row.sourceName,text:row.sourceText,reason:row.reasons.join('；')||'尚未识别'});
 // Keep known effects calculable while exposing unmapped operations explicitly.
 const safeRows=report.rows.filter(r=>r.status==='active').map(row=>{
  const effects=row.rule.effects.filter(effect=>{
   const one=buildDamageImport({...report,rows:[{...row,rule:{...row.rule,effects:[effect]}}]});
   if(one.blockers.length){unresolved.push({name:row.sourceName,text:row.sourceText,reason:one.blockers.join('；')});return false;}
   return true;
  });return {...row,rule:{...row.rule,effects}};
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
 const next={...structuredClone(input),effects:[...imported.effects,...input.effects.filter(e=>!e.importId)],cap:baseCap+imported.capAdded+magicBuffCap(selectedBuffs,imported.skillType,imported.reference),criticalCapAdded:imported.criticalCapAdded,
  defenseRatio:Number.isFinite(manualDefenseRatio)?manualDefenseRatio:imported.defenseRatio,
  killerCorrection:imported.killerCorrection,specialAttack:selection.specialAttack===true,critRate:selection.criticalEnabled?Math.min(100,Math.max(0,(criticalAnchor?criticalAnchor.rate-criticalAnchor.contribution:baseCritRate)+imported.critAdded)):0};
 let projectStatPercent;
 if(key){
  const stat=panel.stats[key];
  if(!Number.isFinite(stat.beforeBuff)||stat.beforeBuff<=0)throw new Error(`${stat.label}缺少有效基础值，请先补齐角色属性`);
  const runtime=buffsFor(stat);
  next.attackBasis='layers';next.attackBase=stat.beforeBuff+stat.crossAdd;next.runtimeStatPercent=runtime;next.attack=Math.floor(next.attackBase*(100+runtime)/100);
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
  next.hitScaleStage=selection.hitScaleStage||imported.hitScaleStage||(imported.hitSources.length?input.hitScaleStage:'core');
 }else{next.hitMultiplier=1;next.hitDamageRatio=1;}
 return {input:next,report:safe,imported,panel,projectStatPercent,unresolved:[...new Map(unresolved.map(x=>[JSON.stringify(x),x])).values()]};
}
