// Read only explicit report fields. Missing fields stay unknown, never inherit a preset.
import {RACES} from './damage-engine.mjs';
const valid=v=>typeof v==='number'&&Number.isFinite(v);
export const BOSS_ELEMENTS={fire:'火',ice:'冰',earth:'树',thunder:'雷',light:'光',dark:'暗'};
export function readBossRecord(record={}) {
 const raw=Array.isArray(record.race)?record.race:record.race==null?[]:[record.race];
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
 const matches=unit.skills.filter(s=>move.skillId!=null?String(s.skillId)===String(move.skillId):s.name===move.name||(move.kind==='normal'&&s.kind==='normal'));
 if(matches.length!==1)return {...empty,source:matches.length>1?'读取到多份同名招式，参数待确认。':empty.source};
 const skill=matches[0],parameters={};
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
