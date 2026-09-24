import {evaluateCatalog} from './effect-rule-engine.mjs';
import {decisionKey} from './entry-preparation.mjs?v=20260924-result-cap';

const sum=values=>Math.round(values.reduce((a,b)=>a+b,0)*1e8)/1e8;
const clean=s=>String(s||'').replace(/[\s·・]/g,'');
const sameSource=(row,b)=>row.reader?.id?row.reader.id===b.id:b.decoded?.sourceId===row.sourceId||!!b.sourceName&&clean(row.sourceName)===clean(b.sourceName);
const readerKey=b=>JSON.stringify([b.id,b.effectType,b.target,b.value,b.unit,b.state,b.conditions,b.decoded,b.raw,b.evidence]);
const signature=g=>({web:g.web.map(decisionKey),reader:g.adoptableReader.map(readerKey)});
// A condition may remove approved entries, but must not introduce new values,
// scopes or a new execution order without a fresh explicit choice.
function subsequence(current,approved=[]) {
 let from=0;
 return current.every(key=>{const i=approved.indexOf(key,from);if(i<0)return false;from=i+1;return true;});
}
export function readerGroupChoice(group) {return signature(group);}
export function withReaderGroupChoices(groups,choices={}) {
 return groups.map(g=>{
  const excluded=new Set(g.removed.flatMap(row=>{
   const matches=g.reader.filter(b=>sameSource(row,b));
   return matches.length===1?[matches[0].id]:[];
  }));
  const adoptableReader=g.reader.filter(b=>!excluded.has(b.id));
  const next={...g,adoptableReader,adoptableTotal:sum(adoptableReader.map(b=>b.value)),canUseReader:adoptableReader.length>0};
  const approved=choices[g.id],current=signature(next);
  const valid=!!approved&&current.web.every(key=>approved.web?.includes(key))&&subsequence(current.reader,approved.reader);
  return {...next,readerGroupSelected:valid,readerGroupStale:!!approved&&!valid,
   choice:approved?(valid?'reader':'pending'):g.choice};
 });
}
export function readerGroupDecisions(groups,decisions) {
 const selected={...decisions};
 for(const g of groups){
  if(g.readerGroupStale)throw new Error(`“${g.target}”的来源或数值已变化，请重新选择采用数据。`);
  if(g.readerGroupSelected)for(const row of g.web)selected[decisionKey(row)]={choice:'exclude'};
 }
 return selected;
}
export const adoptedGroupReaderIds=groups=>new Set(groups.filter(g=>g.readerGroupSelected).flatMap(g=>g.adoptableReader.map(b=>b.id)));
export function appendReaderGroups(report,groups) {
 const seen=new Set(),sources=[];
 for(const g of groups.filter(g=>g.readerGroupSelected))for(const b of g.adoptableReader){
  if(seen.has(b.id))throw new Error('同一读取字段不能重复计入多个效果，请重新对应。');
  seen.add(b.id);
  const matched=g.web.find(row=>sameSource(row,b));
  // Retain known character ownership instead of disguising an exclusive source
  // as a generic reader effect. Each record remains an independent operation.
  sources.push({id:b.decoded?.sourceId||matched?.sourceId||`reader-group:${b.id}`,name:b.sourceName||matched?.sourceName||b.id,group:'readerGroup',
   rules:[{id:`reader-group:${b.id}`,conditions:b.conditions,review:'ready',verification:'untested',
    effects:[{type:b.effectType,target:b.target,value:b.value,unit:b.unit||'',readerId:b.id,
     ...(g.criticalOnly?{criticalOnly:true}:{}),...(b.effectType==='critRate'?{readerStage:b.decoded?.stage}:{})}],
    note:'按当前条件采用读取器来源；配置候选不代表已证明逐击触发。'}]});
 }
 const rows=evaluateCatalog(sources,report.context).rows.map(r=>({...r,origin:'readerGroup'}));
 return {...report,rows:[...report.rows,...rows]};
}
