import {characterMoveDefaults,characterDefinition} from './character-template.mjs?v=20260926-mayly';
import {STAT_CONDITION_FIELDS,CONDITION_BUFF_FIELDS} from './stat-condition-fields.mjs?v=20260926-skill-coverage';
import {decodeHpStatEntry} from './stat-mechanics.mjs?v=20260924-fullpage';
import {applyCriticalOption,criticalEffect} from './critical-options.mjs?v=20260926-skill-coverage';
import {effectCombatModes} from './combat-modes.mjs?v=20260926-skill-coverage';
import {decodeReaderBonuses} from './reader-bonus-decoder.mjs?v=20260926-mayly';
import {evaluateCatalog} from './effect-rule-engine.mjs?v=20260926-mayly';
import {upgradeCommonSource} from './common-skill-rules.mjs?v=20260926-skill-coverage';
import {decodeKnownBlessingEntry,ACCOUNT_BLESSING_CATALOG} from './account-blessings.mjs?v=20260924-fullpage';
export const SIX_STATS={hp:'HP',mp:'MP',attack:'攻击力',defense:'防御力',intelligence:'法强',mind:'魔抗'};
export const ATTACK_CHOICES=[['normal','普通攻击'],['s1','特技1'],['s2','特技2'],['s3','特技3'],['ultimate','超必杀技'],['magic','魔法'],['heavy_magic','重魔法']];
const elementIds={无:'none',火:'fire',冰:'ice',树:'earth',雷:'thunder',光:'light',暗:'dark'};
const recognizedTypes=new Set(['attackElement','stat','statBuff','equipmentStat','damage','cap','critRate','critPermission','killer','killerPower','defenseReference','hit','statReference']);
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const clean=x=>String(x??'').trim();
export function readCharacterProfile(doc) {
 const characterId=String(doc.body.dataset.characterId);
 const baseStats=Object.fromEntries(Object.keys(SIX_STATS).map(k=>[k,null]));
 const aliases={HP:'hp',生命:'hp',MP:'mp',魔力值:'mp',攻击力:'attack',防御力:'defense',法强:'intelligence',魔力:'intelligence',魔抗:'mind'};
 for(const box of doc.querySelectorAll('#max-stats .stat-box')) {
  const strong=box.querySelector('strong');
  const key=aliases[clean(box.querySelector('span')?.textContent)],raw=clean(strong?.dataset.rawBase??strong?.textContent).replaceAll(',',''),value=Number(raw);
  if(key&&raw&&Number.isFinite(value))baseStats[key]=value;
 }
 function move(el,kind,id) {
  const name=clean(el.querySelector('.skill-name')?.textContent||el.querySelector('td')?.textContent),text=clean(el.querySelector('td:last-child')?.textContent);
  const attackText=text.match(/对[^。；]*?(?:发动|进行)[^。；]*?攻击/)?.[0]||'';
  const es=[...attackText.matchAll(/([火冰树雷光暗无])属性/g)].map(m=>m[1]);
  const hit=text.match(/(?:命中数|Hit数|基础段数)\s*[：:=]\s*(\d+)/i);
  // A damage-up percentage, an extra cap or Hit x2 is never a base coefficient.
  const coef=text.match(/(?:每段基础系数|基础伤害倍率)\s*[：:=]\s*[×x]?\s*(\d+(?:\.\d+)?)/i);
  return {id,name,kind,description:text,damageType:characterMoveDefaults(characterId,kind).damageType||null,element:new Set(es).size===1?es[0]:characterMoveDefaults(characterId,kind).element||null,hits:hit?Number(hit[1]):null,
   coefficient:coef?Number(coef[1]):null,skillPercent:null,statReference:kind==='magic'?'int':characterMoveDefaults(characterId,kind).statReference||null,
   purpose:attackText?'attack':/我方|降低.*敌|降低全体/.test(text)?'support':'unknown',source:'角色页面'};
 }
 const moves=[{id:'normal',name:'普通攻击',kind:'normal',element:null,hits:null,coefficient:null,skillPercent:null,statReference:null,purpose:'attack',source:'通用入口，参数待确认',...characterMoveDefaults(characterId,'normal')}];
 [...doc.querySelectorAll('#specials tbody tr')].forEach((el,i)=>{if(i<4)moves.push(move(el,['s1','s2','s3','ultimate'][i],['s1','s2','s3','ultimate'][i]));});
 const magic=[...doc.querySelectorAll('#magic tbody tr')].map((el,i)=>move(el,'magic',`magic-${i+1}`));
 const equipment=[...doc.querySelectorAll('#equipment .equipment-card')].map(el=>({name:clean(el.querySelector('h4')?.textContent),type:clean(el.querySelector('dd')?.textContent).split(/[｜|]/)[0].replace(/^服装$/,'衣服'),element:elementIds[clean(el.querySelector('dd')?.textContent).split(/[｜|]/)[1]?.replace('属性','')]||null}));
 return {schemaVersion:1,characterId:String(doc.body.dataset.characterId),name:clean(doc.querySelector('.hero h2')?.textContent),
  statsBasis:'max-growth-character-page',baseStats,moves,magic,equipment};
}
export function retargetReport(report,selection) {
 const grouped=new Map(),overrides={};
 for(const row of report.rows||[]) {
  if(!grouped.has(row.sourceId))grouped.set(row.sourceId,{id:row.sourceId,name:row.sourceName,text:row.sourceText,group:row.group,rules:[]});
  grouped.get(row.sourceId).rules.push(row.rule);
  // Only a manual switch-off carries over; an unequipped item is re-evaluated
  // under this page's own equipment context.
  if(row.status==='disabled'&&!(row.group==='equipment'&&(row.reasons||[]).includes('未选择这件装备')))overrides[row.rule.id]={disabled:true};
 }
 // Add newly recognized account entries to older saved calculator reports.
 // Existing rules, exclusions and user edits keep their identity.
 for(const source of ACCOUNT_BLESSING_CATALOG)if(!report.reviewedByUser&&!grouped.has(source.id))grouped.set(source.id,source);
 const attack=selection.attack==='heavy_magic'?'magic':selection.attack;
 const context={...report.context,killer:false,attack,damageType:selection.type,element:elementIds[selection.element]??null,statReference:selection.statReference??report.context.statReference};
 context.nonStackingMagic=selection.attack==='heavy_magic';
 // Casting a non-stackable (heavy) magic is exactly the 魔术共鸣-type condition
 // "我方正在发动不可叠加魔法" (game: buff granted at skill start, applied at trigger 27).
 if(selection.attack==='heavy_magic')context.resonance=true;
 // 魔法连锁 (process1050443) counts the current cast before checking, so an
 // attack magic always has at least the first tier; later casts are chosen explicitly.
 if(['magic','heavy_magic'].includes(selection.attack))context.chainStacks=Number.isFinite(selection.chainStacks)?selection.chainStacks:Math.max(1,Number(context.chainStacks)||0);
 if(typeof selection.specialAttack==='boolean')context.killerOverride=selection.specialAttack;
 if(typeof selection.break==='boolean')context.break=selection.break;
 if(typeof selection.boss==='boolean')context.boss=selection.boss;
  if(typeof selection.fullHp==='boolean')context.fullHp=selection.fullHp;
  for(const field of ['back','air','ailment','ground','weakness','stunned','nearestEnemy','partyAllAlive','enemyAttacking','selfAilment','bleeding','enemyLightWeak','enemyDarkWeak'])if(typeof selection[field]==='boolean')context[field]=selection[field];
  if(Object.hasOwn(selection,'enemyRaces'))context.enemyRaces=selection.enemyRaces;
  for(const field of ['lowHp',...STAT_CONDITION_FIELDS])if(typeof selection[field]==='boolean')context[field]=selection[field];
  // “条件BUFF（全部）” covers each event buff the selection does not set on its own.
  if(typeof selection.conditionBuffActive==='boolean')for(const field of CONDITION_BUFF_FIELDS)if(typeof selection[field]!=='boolean')context[field]=selection.conditionBuffActive;
  if(selection.fullHp===true&&selection.lowHp!==true)context.lowHp=false;
  if(selection.lowHp===true&&selection.fullHp!==true)context.fullHp=false;
 if(typeof selection.criticalEnabled==='boolean'){context.criticalEnabled=selection.criticalEnabled;context.critical=selection.criticalEnabled;}
 // Damage-page dual wield is a manual hit-calculation option.
 // The damage page's 专武 switch equips every exclusive item of the character
 // (weapon and armor); it does not follow the basic calculator's checkboxes.
 if(typeof selection.specialWeapon==='boolean'){
  const gear=characterDefinition(report.characterId).gear||{},ids=Object.keys(gear);
  const equipped=new Set((context.equipmentIds||[]).filter(id=>!ids.includes(id)));
  for(const [id,g] of Object.entries(gear)){
   if(selection.specialWeapon)equipped.add(id);
   context[g.field]=selection.specialWeapon;
   if(g.iceStaff)context.iceStaff=selection.specialWeapon;
  }
  context.equipmentIds=[...equipped];
  const weapons=Object.values(gear).filter(g=>!g.armor).length;
  if(selection.specialWeapon&&weapons)context.weaponCount=Math.max(1,Math.min(2,weapons));
 }
 const sources=[...grouped.values()].map(s=>s.rules.some(r=>overrides[r.id]?.disabled)?s:upgradeCommonSource(s));
 const evaluated=evaluateCatalog(sources,context,overrides);
 const originals=new Map((report.rows||[]).map(row=>[JSON.stringify([row.sourceId,row.rule.id]),row]));
 const order=new Map([...originals.keys()].map((key,i)=>[key,i]));
 evaluated.rows=evaluated.rows.map(row=>{const original=originals.get(JSON.stringify([row.sourceId,row.rule.id]));return {...row,...(original?{sourceText:original.sourceText,sourceName:original.sourceName,group:original.group}:{}),...(original?.effectIndices?{effectIndices:original.effectIndices}:{}),...(original?.origin?{origin:original.origin}:{})};})
  .sort((a,b)=>(order.get(JSON.stringify([a.sourceId,a.rule.id]))??Infinity)-(order.get(JSON.stringify([b.sourceId,b.rule.id]))??Infinity));
 return applyCriticalOption({...report,...evaluated});
}
export function websiteCandidates(report) {
 return (report.rows||[]).filter(r=>r.status==='active').flatMap(r=>r.rule.effects.map((effect,i)=>{const index=r.effectIndices?.[i]??i;return {
  id:`${r.sourceId}:${r.rule.id}:${index}`,sourceName:r.sourceName,sourceId:r.sourceId,ruleId:r.rule.id,index,effect,
  condition:r.rule.conditions,modeLinks:effectCombatModes(effect,r.rule.conditions,r.rule.effects),criticalLinked:r.criticalLinked||criticalEffect(effect),evidence:r.group==='blessings'?'账户加护报告与规则核对':'网站条件推演，待核对',group:r.group
 };}).filter(r=>recognizedTypes.has(r.effect.type)));
}
export function validateBattleEntry(input) {
 if(input?.kind!=='last-cloudia-battle-entry'||input.schemaVersion!==1||!Array.isArray(input.units)||input.units.length>64)throw new Error('请选择v0.35或更新版生成的 BattleEntryReport.json，文件格式不匹配。');
 for(const unit of input.units) {
  if(!unit||!unit.stats||!Array.isArray(unit.bonuses)||unit.bonuses.length>20000)throw new Error('角色或加成记录格式不完整。');
  for(const key of Object.keys(SIX_STATS))if(unit.stats[key]!=null&&(num(unit.stats[key])===null||unit.stats[key]<0))throw new Error('读取报告包含无效面板数值。');
  if(unit.panelSnapshots!=null&&(!Array.isArray(unit.panelSnapshots)||unit.panelSnapshots.length>512))throw new Error('读取报告的面板快照清单格式不正确。');
  for(const b of unit.bonuses)if(!b||typeof b.id!=='string'||(b.value!=null&&typeof b.value!=='string'&&typeof b.value!=='boolean'&&num(b.value)===null))throw new Error('读取报告包含无效加成记录。');
 }
 input={...input,units:input.units.map(unit=>({...unit,bonuses:decodeReaderBonuses(unit.bonuses.map(b=>{const {decoded,decodeIssue,auditCategory,coveredBy,...rawEntry}=b;return rawEntry;}).map(decodeKnownBlessingEntry).map(decodeHpStatEntry))}))};
 // v0.35 exported the game's MP thousandths. BattleUiUnit.ApplyMp divides
 // both GetMp and GetMaxStatus(MP) by 1000 before showing the values.
 // Restrict migration to that real-reader schema, never guess by magnitude.
 if(input.readerVersion==='0.35'&&input.statsBasis==='battle-final-at-observation'&&input.collection?.method==='read_only_process_memory'&&!input.testFixture&&!input.normalization?.mpThousandths) {
  const migrated=JSON.parse(JSON.stringify(input));
  for(const unit of [...migrated.units,...(migrated.bosses||[])]) {
   const original={maximum:unit.stats?.mp??null,current:unit.current?.mp??null};
   if(num(unit.stats?.mp)!==null)unit.stats.mp=Math.trunc(unit.stats.mp/1000);
   if(num(unit.current?.mp)!==null)unit.current.mp=Math.trunc(unit.current.mp/1000);
   unit.mpRawThousandths=original;
  }
  migrated.normalization={...migrated.normalization,mpThousandths:true,reason:'v0.35 MP原始值按游戏界面规则除1000取整；原值保留在mpRawThousandths。'};
  return migrated;
 }
 return input;
}
export function readerScopeAllows(reader,context) {
 if(reader?.optionExcludedReason)return false;
 if(reader&&(['inactive','disabled','removed'].includes(reader.state)||reader.raw?.buffRemoved===1||reader.raw?.buffIgnored===1||reader.raw?.buffEnabled===0))return false;
 const conditions=reader?.decoded?.conditions??reader?.conditions;
 if(!Array.isArray(conditions)||!context)return true; // Legacy manual mapping has no decoded scope to test.
 return evaluateCatalog([{id:'reader-scope',group:'common',rules:[{id:'reader-scope',conditions,effects:[{type:'utility'}],review:'ready'}]}],context).rows[0].status==='active';
}
const completeReaderHit=reader=>reader?.decoded?.stage==='configuration'&&Array.isArray(reader.decoded.conditions)&&Number.isInteger(reader.value)&&reader.value>0&&num(reader.secondary)!==null&&reader.secondary>=0;
export function compareCandidates(web,bonuses,mappings={},context) {
 const token=b=>[clean(b.sourceName),b.effectType,b.target,b.unit].join('|');
 return web.map(w=>{
  const localId=w.sourceId?.match(/^account-blessing-(\d+)$/)?.[1];
  let matches=Object.hasOwn(mappings,w.id)?bonuses.filter(b=>b.id===mappings[w.id]):localId?bonuses.filter(b=>String(b.raw?.localId)===localId):bonuses.filter(b=>(b.decoded?.sourceId===w.sourceId||clean(b.sourceName)===clean(w.sourceName))&&b.effectType===w.effect.type&&b.target===w.effect.target&&(b.unit||'')===(w.effect.unit||''));
  if(!Object.hasOwn(mappings,w.id)&&matches.length>1&&context){const qualified=matches.filter(b=>readerScopeAllows(b,context));if(qualified.length)matches=qualified;}
  const reader=matches.length===1?matches[0]:null;
  const scopeAllowed=readerScopeAllows(reader,context);
  const compatible=reader&&scopeAllowed&&(!localId||(reader.decoded?.accountBlessing?.localId===Number(localId)&&reader.decoded.sourceId===w.sourceId&&JSON.stringify(reader.decoded.conditions)===JSON.stringify(w.condition)))&&reader.effectType===w.effect.type&&reader.target===w.effect.target&&(reader.unit||'')===(w.effect.unit||'')&&typeof reader.value===typeof w.effect.value&&(w.effect.type!=='hit'||completeReaderHit(reader));
  const difference=compatible&&w.effect.type!=='hit'&&num(reader.value)!==null&&num(w.effect.value)!==null?reader.value-w.effect.value:null;
  const equal=compatible&&JSON.stringify(reader.value)===JSON.stringify(w.effect.value)&&(w.effect.type!=='hit'||reader.secondary===w.effect.secondary);
  return {...w,reader,compatible:Boolean(compatible),difference,comparison:!reader?(matches.length>1?'多个候选，待对应':'尚未对应'):
   !scopeAllowed?'读取器条件不满足或待确认':!compatible?'口径不同，不能直接替换':reader.value==null?'读取值未解析':equal?'数值一致，仍待确认':'数值不同，待选择'};
 });
}
export const decisionKey=row=>JSON.stringify([row.id,row.effect,row.condition,row.reader?.id,row.reader?.value,row.reader?.state,row.reader?.evidence,row.reader?.decoded?.conditions??row.reader?.conditions,row.reader?.decoded?.stage,row.reader?.raw?.buffEnabled,row.reader?.raw?.buffRemoved,row.reader?.raw?.buffIgnored,...(row.effect.type==='hit'?[row.reader?.secondary]:[])]);
export function resolveReview(report,compared,decisions) {
 const entries=new Map(),usedReader=new Set();
 for(const row of compared) {
  const d=decisions[decisionKey(row)];
  if(!d?.choice||d.choice==='pending')throw new Error(`请决定“${row.sourceName} · ${row.effect.target}”采用哪份数据，或暂不计入。`);
  if(d.choice==='exclude')continue;
  let effect={...row.effect};
  if(effect.type==='critRate'&&row.compatible&&row.reader?.decoded?.stage)effect.readerStage=row.reader.decoded.stage;
  if(d.choice==='reader') {
   if(!readerScopeAllows(row.reader,report.context))throw new Error(`“${row.sourceName}”的读取器条件不符合当前攻击，请重新选择。`);
   if(!row.compatible||row.reader?.value==null)throw new Error(`“${row.sourceName}”读取字段未对应，不能直接替换。`);
   if(effect.type==='statReference')throw new Error('属性参照请采用网站规则或在基础计算器修改完整拆分。');
   if(effect.type==='hit'&&!completeReaderHit(row.reader))throw new Error('读取器分段配置不完整，需同时读取命中数倍率与单段伤害倍率。');
   if(usedReader.has(row.reader.id))throw new Error('同一读取字段不能重复计入多个效果，请重新对应。');
   usedReader.add(row.reader.id);
   effect.value=row.reader.value;
   if(effect.type==='hit')effect={...effect,secondary:row.reader.secondary,parameterSource:'reader',readerId:row.reader.id};
  } else if(d.choice==='manual') {
   if(typeof effect.value!=='number'||!Number.isFinite(d.value))throw new Error('手动填写只接受已知单位的数值。');
   effect.value=d.value;
   if(effect.type==='hit')effect.parameterSource='manual';
  } else if(d.choice!=='web')throw new Error('核对选项无效。');
  entries.set(row.id,effect);
 }
 const rows=report.rows.filter(r=>r.status==='active').map(r=>{
  const effects=[],effectIndices=[];
  r.rule.effects.forEach((e,i)=>{const index=r.effectIndices?.[i]??i,value=entries.get(`${r.sourceId}:${r.rule.id}:${index}`);if(value){effects.push(value);effectIndices.push(index);}});
  return {...r,effectIndices,rule:{...r.rule,effects}};
 }).filter(r=>r.rule.effects.length);
 const sources=new Map();
 for(const row of rows){if(!sources.has(row.sourceId))sources.set(row.sourceId,{id:row.sourceId,name:row.sourceName,text:row.sourceText,group:row.group,rules:[]});sources.get(row.sourceId).rules.push(row.rule);}
 const evaluated=evaluateCatalog([...sources.values()],{...report.context,killer:false});
 const indices=new Map(rows.map(r=>[JSON.stringify([r.sourceId,r.rule.id]),r.effectIndices]));
 evaluated.rows=evaluated.rows.map(r=>({...r,effectIndices:indices.get(JSON.stringify([r.sourceId,r.rule.id]))}));
 return {...report,...evaluated,kind:'last-cloudia-effect-report',reviewedByUser:true};
}
