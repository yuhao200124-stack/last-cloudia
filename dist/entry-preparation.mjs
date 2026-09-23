import {evaluateCatalog} from './effect-rule-engine.mjs';
import {withAccountBlessings} from './account-blessings-panel.mjs';
import {decodeKnownBlessingEntry} from './account-blessings.mjs';
export const SIX_STATS={hp:'HP',mp:'MP',attack:'攻击力',defense:'防御力',intelligence:'法强',mind:'魔抗'};
export const ATTACK_CHOICES=[['normal','普通攻击'],['s1','特技1'],['s2','特技2'],['s3','特技3'],['ultimate','超必杀技'],['magic','魔法'],['heavy_magic','重魔法']];
const elementIds={无:'none',火:'fire',冰:'ice',树:'earth',雷:'thunder',光:'light',暗:'dark'};
const recognizedTypes=new Set(['stat','statBuff','equipmentStat','damage','cap','critRate','critPermission','killer','defenseReference','hit','statReference']);
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const clean=x=>String(x??'').trim();
export function readCharacterProfile(doc) {
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
  return {id,name,kind,description:text,element:new Set(es).size===1?es[0]:null,hits:hit?Number(hit[1]):null,
   coefficient:coef?Number(coef[1]):null,skillPercent:null,statReference:kind==='magic'?'int':null,
   purpose:attackText?'attack':/我方|降低.*敌|降低全体/.test(text)?'support':'unknown',source:'角色页面'};
 }
 const moves=[{id:'normal',name:'普通攻击',kind:'normal',element:null,hits:null,coefficient:null,skillPercent:null,statReference:null,purpose:'attack',source:'通用入口，参数待确认'}];
 [...doc.querySelectorAll('#specials tbody tr')].forEach((el,i)=>{if(i<4)moves.push(move(el,['s1','s2','s3','ultimate'][i],['s1','s2','s3','ultimate'][i]));});
 const magic=[...doc.querySelectorAll('#magic tbody tr')].map((el,i)=>move(el,'magic',`magic-${i+1}`));
 return {schemaVersion:1,characterId:String(doc.body.dataset.characterId),name:clean(doc.querySelector('.hero h2')?.textContent),
  statsBasis:'max-growth-character-page',baseStats,defaultPanelStats:withAccountBlessings(baseStats),moves,magic};
}
export function retargetReport(report,selection) {
 const grouped=new Map(),overrides={};
 for(const row of report.rows||[]) {
  if(!grouped.has(row.sourceId))grouped.set(row.sourceId,{id:row.sourceId,name:row.sourceName,text:row.sourceText,group:row.group,rules:[]});
  grouped.get(row.sourceId).rules.push(row.rule);
  if(row.status==='disabled')overrides[row.rule.id]={disabled:true};
 }
 const attack=selection.attack==='heavy_magic'?'magic':selection.attack;
 const evaluated=evaluateCatalog([...grouped.values()],{...report.context,killer:false,attack,damageType:selection.type,element:elementIds[selection.element]??null},overrides);
 return {...report,...evaluated};
}
export function websiteCandidates(report) {
 return (report.rows||[]).filter(r=>r.status==='active').flatMap(r=>r.rule.effects.map((effect,index)=>({
  id:`${r.sourceId}:${r.rule.id}:${index}`,sourceName:r.sourceName,sourceId:r.sourceId,ruleId:r.rule.id,index,effect,
  condition:r.rule.conditions,evidence:r.group==='blessings'?'账户加护报告与规则核对':'网站条件推演，待核对',group:r.group
 })).filter(r=>recognizedTypes.has(r.effect.type)));
}
export function validateBattleEntry(input) {
 if(input?.kind!=='last-cloudia-battle-entry'||input.schemaVersion!==1||!Array.isArray(input.units)||input.units.length>64)throw new Error('请选择v0.35生成的 BattleEntryReport.json，文件格式不匹配。');
 for(const unit of input.units) {
  if(!unit||!unit.stats||!Array.isArray(unit.bonuses)||unit.bonuses.length>20000)throw new Error('角色或加成记录格式不完整。');
  for(const key of Object.keys(SIX_STATS))if(unit.stats[key]!=null&&(num(unit.stats[key])===null||unit.stats[key]<0))throw new Error('读取报告包含无效面板数值。');
  for(const b of unit.bonuses)if(!b||typeof b.id!=='string'||(b.value!=null&&typeof b.value!=='string'&&typeof b.value!=='boolean'&&num(b.value)===null))throw new Error('读取报告包含无效加成记录。');
 }
 input={...input,units:input.units.map(unit=>({...unit,bonuses:unit.bonuses.map(decodeKnownBlessingEntry)}))};
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
export function compareCandidates(web,bonuses,mappings={}) {
 const token=b=>[clean(b.sourceName),b.effectType,b.target,b.unit].join('|');
 return web.map(w=>{
  const localId=w.sourceId?.match(/^account-blessing-(\d+)$/)?.[1];
  const matches=Object.hasOwn(mappings,w.id)?bonuses.filter(b=>b.id===mappings[w.id]):localId?bonuses.filter(b=>String(b.raw?.localId)===localId):bonuses.filter(b=>token(b)===token({sourceName:w.sourceName,effectType:w.effect.type,target:w.effect.target,unit:w.effect.unit}));
  const reader=matches.length===1?matches[0]:null;
  const compatible=reader&&(!localId||(reader.decoded&&JSON.stringify(reader.decoded.conditions)===JSON.stringify(w.condition)))&&reader.effectType===w.effect.type&&reader.target===w.effect.target&&(reader.unit||'')===(w.effect.unit||'')&&typeof reader.value===typeof w.effect.value;
  const difference=compatible&&num(reader.value)!==null&&num(w.effect.value)!==null?reader.value-w.effect.value:null;
  return {...w,reader,compatible:Boolean(compatible),difference,comparison:!reader?(matches.length>1?'多个候选，待对应':'尚未对应'):
   !compatible?'口径不同，不能直接替换':reader.value==null?'读取值未解析':JSON.stringify(reader.value)===JSON.stringify(w.effect.value)?'数值一致，仍待确认':'数值不同，待选择'};
 });
}
export const decisionKey=row=>JSON.stringify([row.id,row.effect,row.condition,row.reader?.id,row.reader?.value,row.reader?.state,row.reader?.evidence]);
export function resolveReview(report,compared,decisions) {
 const entries=new Map(),usedReader=new Set();
 for(const row of compared) {
  const d=decisions[decisionKey(row)];
  if(!d?.choice||d.choice==='pending')throw new Error(`请决定“${row.sourceName} · ${row.effect.target}”采用哪份数据，或暂不计入。`);
  if(d.choice==='exclude')continue;
  let effect={...row.effect};
  if(d.choice==='reader') {
   if(!row.compatible||row.reader?.value==null)throw new Error(`“${row.sourceName}”读取字段未对应，不能直接替换。`);
   if(['hit','statReference'].includes(effect.type))throw new Error('复合效果请采用网站规则或在基础计算器修改完整拆分。');
   if(usedReader.has(row.reader.id))throw new Error('同一读取字段不能重复计入多个效果，请重新对应。');
   usedReader.add(row.reader.id);
   effect.value=row.reader.value;
  } else if(d.choice==='manual') {
   if(typeof effect.value!=='number'||!Number.isFinite(d.value))throw new Error('手动填写只接受已知单位的数值。');
   effect.value=d.value;
  } else if(d.choice!=='web')throw new Error('核对选项无效。');
  entries.set(row.id,effect);
 }
 const rows=report.rows.filter(r=>r.status==='active').map(r=>({...r,rule:{...r.rule,effects:r.rule.effects.flatMap((e,i)=>{
  const value=entries.get(`${r.sourceId}:${r.rule.id}:${i}`);return value?[value]:[];
 })}})).filter(r=>r.rule.effects.length);
 const sources=new Map();
 for(const row of rows){if(!sources.has(row.sourceId))sources.set(row.sourceId,{id:row.sourceId,name:row.sourceName,text:row.sourceText,group:row.group,rules:[]});sources.get(row.sourceId).rules.push(row.rule);}
 const evaluated=evaluateCatalog([...sources.values()],{...report.context,killer:false});
 return {...report,...evaluated,kind:'last-cloudia-effect-report',reviewedByUser:true};
}
