import {readerBonusState} from './reader-bonus-decoder.mjs?v=20260924-reader-choice';
import {evaluateCatalog} from './effect-rule-engine.mjs';
import {requiresCritical} from './critical-options.mjs?v=20260924-reader-choice';

// A supplement is a reader source, never a fabricated website/account value.
// Only fully decoded, scoped outgoing percentages are supported here.
export const supplementKey=b=>JSON.stringify([b.id,b.effectType,b.target,b.value,b.unit,b.decoded?.conditions,b.decoded?.stage,b.raw]);
export function readerSupplementCandidates(bonuses,compared,context) {
 const seen=new Set();
 return bonuses.filter(b=>{
  if(seen.has(b.id)||b.effectType!=='damage'||b.unit!=='%'||!Number.isFinite(b.value)||b.decoded?.stage!=='configuration'||readerBonusState(b,context).status!=='active')return false;
  if(compared.some(w=>w.reader?.id===b.id||(b.decoded?.sourceId&&w.sourceId===b.decoded.sourceId&&w.effect.type===b.effectType&&w.effect.target===b.target&&w.effect.unit===b.unit)))return false;
  seen.add(b.id);return true;
 });
}
export function appendReaderSupplements(report,bonuses,compared,choices) {
 const selected=readerSupplementCandidates(bonuses,compared,report.context).filter(b=>choices[supplementKey(b)]==='reader');
 const sources=selected.map(b=>({id:`reader-supplement:${b.id}`,name:`读取器补充 · ${b.sourceName||b.id}`,group:'readerSupplement',text:`${b.target}+${b.value}%`,
  rules:[{id:'decoded',part:'读取器配置',conditions:b.decoded.conditions,review:'ready',verification:'untested',
   effects:[{type:'damage',target:b.target,value:b.value,unit:'%',...(requiresCritical(b.decoded.triggerConditions)?{criticalOnly:true}:{})}],note:'已解析的读取器配置，经用户采用；非逐击生效证明。'}]}));
 const rows=evaluateCatalog(sources,report.context).rows.map(r=>({...r,origin:'readerSupplement'}));
 return {...report,rows:[...report.rows,...rows]};
}
// Reader-only values can complete a group only when every original website
// source still maps uniquely and every remaining reader value is a valid supplement.
export function includeSupplementGroups(groups,supplements,choices) {
 return groups.map(g=>{
  const mapped=g.web.map(w=>w.compatible?w.reader?.id:null);
  const extras=g.reader.filter(b=>!mapped.includes(b.id));
  const complete=mapped.every(Boolean)&&new Set(mapped).size===mapped.length&&extras.length>0&&extras.every(b=>supplements.some(s=>s.id===b.id))&&g.reader.length===mapped.length+extras.length;
  if(!complete)return g;
  const extraChoices=extras.map(b=>choices[supplementKey(b)]||'pending');
  const choice=(!g.web.length||g.choice==='reader')&&extraChoices.every(v=>v==='reader')?'reader':g.choice==='web'&&extraChoices.every(v=>v!=='reader')?'web':'mixed';
  return {...g,canUseReader:true,choice,supplements:extras};
 });
}
