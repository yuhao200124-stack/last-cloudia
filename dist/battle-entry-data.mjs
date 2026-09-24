// Read only explicit report fields. Missing fields stay unknown, never inherit a preset.
import {RACES} from './damage-engine.mjs?v=20260924-critical-link';
const valid=v=>typeof v==='number'&&Number.isFinite(v);
const panelKeys=['hp','mp','attack','defense','intelligence','mind'];
export function readerPanelSnapshots(unit) {
 if(!Array.isArray(unit?.panelSnapshots))return [];
 const ids=new Set();
 return unit.panelSnapshots.filter(s=>{
  if(!s||typeof s.id!=='string'||s.id==='entry'||ids.has(s.id)||!valid(s.elapsedMs)||s.elapsedMs<0||!panelKeys.every(k=>valid(s.stats?.[k])&&s.stats[k]>=0)||s.stats.hp<=0)return false;
  ids.add(s.id);return true;
 }).sort((a,b)=>a.elapsedMs-b.elapsedMs);
}
export function defaultReaderSnapshot(unit) {
 const samples=readerPanelSnapshots(unit),sample=samples.find(s=>s.id===unit?.latestStablePanelSnapshotId&&s.stableForMs>=750);
 return sample?.id||'entry';
}
export function readerSnapshot(unit,selected=defaultReaderSnapshot(unit)) {return readerPanelSnapshots(unit).find(s=>s.id===selected)||null;}
export function observedReaderUnit(unit,selected) {
 const s=readerSnapshot(unit,selected);if(!s)return unit;
 const critical=valid(s.stats.critical)?s.stats.critical:valid(s.criticalRate)?s.criticalRate:null;
 return {...unit,stats:{...s.stats},statsMeta:{...unit.statsMeta,criticalRate:critical},raw:{...unit.raw,criticalRaw:critical},capturedAt:s.capturedAt,current:s.current||{hp:s.hp,mp:s.mp}};
}
export function panelObservation(battle,unit,key,later={},selected=defaultReaderSnapshot(unit)) {
 const sample=later[key];
 if(sample&&valid(sample.value))return {value:sample.value,label:'攻击时观察值',time:sample.capturedAt||'',note:'来自所选结算样本；只更新实际读取到的这一项。',kind:'attack'};
 const snapshot=readerSnapshot(unit,selected);
 if(snapshot)return {value:valid(snapshot.stats[key])?snapshot.stats[key]:null,label:snapshot.stableForMs>=750?'战斗中稳定观察值':'战斗中变化值',time:snapshot.capturedAt||'',kind:'snapshot',note:`入场后 ${(snapshot.elapsedMs/1000).toFixed(2)} 秒，整组六维来自同次读取。稳定表示数值暂时未变，不代表所有增益生效。`};
 return {value:valid(unit?.stats?.[key])?unit.stats[key]:null,label:'入场观察值',time:unit?.capturedAt||battle?.capturedAt||'',kind:'entry',
  note:battle?.collection?.buffApplicationVerified===true?'报告标记已核对增益生效。':'采集完整不代表开场效果已生效；与网站当前条件可能处于不同时刻。'};
}
export function capturePanelObservation(battle,unit,sample) {
 // Entry battle IDs and CSV session IDs use different clocks. This is an
 // explicit adoption of the selected group's panel, never a guessed join.
 if(!battle||!unit||sample.explicitSelection!==true||String(sample.unitId)!==String(unit.unitId))return null;
 const values={};
 for(const key of ['attack','intelligence'])if(valid(sample.stats?.[key])&&sample.stats[key]>=0)values[key]={value:sample.stats[key],capturedAt:sample.capturedAt||'',sampleId:sample.sampleId};
 return Object.keys(values).length?values:null;
}
export const BOSS_ELEMENTS={fire:'火',ice:'冰',earth:'树',thunder:'雷',light:'光',dark:'暗'};
export function readBossRecord(record={}) {
 const raw=Array.isArray(record.races)?record.races:Array.isArray(record.race)?record.race:record.race==null?[]:[record.race];
 const races=raw.filter(v=>typeof v==='string'&&RACES.includes(v));
 return {name:record.name||'未命名 Boss',def:valid(record.stats?.defense)?record.stats.defense:null,
  mnd:valid(record.stats?.mind)?record.stats.mind:null,races,
  raceLabel:races.length?races.join('／'):'未读取',
  res:Object.keys(BOSS_ELEMENTS).map(k=>valid(record.resistances?.[k])?record.resistances[k]:null)};
}
export const SKILL_PARAMETER_KEYS=['coefficient','skillPercent','skillAdd','skillPostAdd'];
export function readMoveParameters(unit,move) {
 const empty={parameters:{},source:'读取报告未包含此招式的技能参数，未读到的项目请手动填写。'};
 if(!unit||!move||!Array.isArray(unit.skills))return empty;
 const matches=unit.skills.filter(s=>move.skillId!=null?String(s.skillId)===String(move.skillId):s.name===move.name||(move.kind==='normal'&&s.kind==='normal')||(s.slot&&s.slot===move.kind));
 if(matches.length!==1)return {...empty,source:matches.length>1?'读取到多份同名招式，参数待确认。':empty.source};
 const skill=matches[0],parameters={};
 if(skill.statReference==='mixed'||skill.parameterState==='mixed_reference_requires_runtime_value')return {...empty,source:'读取到混合攻击计算；原始参数已保留，尚需另一项战斗属性，不能当作单一攻击力或法强计算。'};
 // Optional structured reader extension. Never use maxima or candidate bonus values.
 for(const key of SKILL_PARAMETER_KEYS)if(valid(skill.parameters?.[key]))parameters[key]=skill.parameters[key];
 if(!Object.keys(parameters).length&&Array.isArray(skill.processes)) {
  if(skill.processes.some(p=>!['process10001','process10101','process10103','process30401'].includes(p.function)))return {...empty,source:'此招式包含尚未解码的处理，技能参数留空等待核对。'};
  const damage=skill.processes.filter(p=>/^process(?:10001|10002|10101|10102|10103)$/.test(p.function||''));
  const decoded=damage.map(p=>{
   if(!['process10001','process10101','process10103'].includes(p.function)||!Array.isArray(p.params)||!p.params.slice(0,3).every(valid)||p.params.length<3)return null;
   return {skillAdd:p.params[0],skillPercent:p.params[1]/100,coefficient:p.params[2]/10000,skillPostAdd:0};
  });
  if(decoded.length&&decoded.every(p=>p&&JSON.stringify(p)===JSON.stringify(decoded[0])))Object.assign(parameters,decoded[0]);
 }
 return {parameters,source:Object.keys(parameters).length?`读取参数：${skill.name||move.name}；未读取项留空，命中段数由你手动填写。`:empty.source};
}
