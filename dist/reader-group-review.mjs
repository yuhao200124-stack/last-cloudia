import {evaluateCatalog} from './effect-rule-engine.mjs?v=20260926-mayly';
import {decisionKey} from './entry-preparation.mjs?v=20260926-mayly';

const sum=values=>Math.round(values.reduce((a,b)=>a+b,0)*1e8)/1e8;
const clean=s=>String(s||'').replace(/[\s·・]/g,'');
const sameSource=(row,b)=>row.reader?.id?row.reader.id===b.id:b.decoded?.sourceId===row.sourceId||!!b.sourceName&&clean(row.sourceName)===clean(b.sourceName);
const readerKey=b=>JSON.stringify([b.id,b.effectType,b.target,b.value,b.unit,b.state,b.conditions,b.decoded,b.raw,b.evidence]);
const signature=g=>({web:g.web.map(decisionKey),reader:g.adoptableReader.map(readerKey)});
export const modeGroupCatalog=groups=>Object.fromEntries(groups.map(g=>[g.id,{
 web:g.web.filter(r=>r.modeLinks?.length).map(decisionKey),reader:g.reader.filter(b=>b.modeLinks?.length).map(readerKey),readerOrder:g.reader.map(readerKey)
}]));
// A condition may remove approved entries, but must not introduce new values,
// scopes or a new execution order without a fresh explicit choice.
function subsequence(current,approved=[]) {
 let from=0;
 return current.every(key=>{const i=approved.indexOf(key,from);if(i<0)return false;from=i+1;return true;});
}
export function upgradeReaderGroupChoice(current,availableModes={}) {
 const readerOrder=[...(current.readerOrder||current.reader||[])],potential=availableModes.readerOrder||[];
 for(const [i,key] of potential.entries())if(!readerOrder.includes(key)){
  const next=potential.slice(i+1).find(k=>readerOrder.includes(k));
  readerOrder.splice(next?readerOrder.indexOf(next):readerOrder.length,0,key);
 }
 return {...current,readerOrder,modeWeb:availableModes.web||[],modeReader:availableModes.reader||[]};
}
export const readerGroupChoice=group=>upgradeReaderGroupChoice(signature(group),group.availableModes);
export function withReaderGroupChoices(groups,choices={},modeCatalog={}) {
 return groups.map(g=>{
  const excluded=new Set(g.removed.flatMap(row=>{
   const matches=g.reader.filter(b=>sameSource(row,b));
   return matches.length===1?[matches[0].id]:[];
  }));
  const adoptableReader=g.reader.filter(b=>!excluded.has(b.id));
  const availableModes=modeCatalog[g.id]||{web:[],reader:[]};
  const modeWebsiteFallback=g.web.filter(row=>row.modeLinks?.length&&!adoptableReader.some(b=>sameSource(row,b)));
  const modeWebsiteTotal=sum(modeWebsiteFallback.map(r=>r.effect.value));
  const next={...g,adoptableReader,availableModes,modeWebsiteFallback,modeWebsiteTotal,adoptableTotal:sum(adoptableReader.map(b=>b.value)),canUseReader:adoptableReader.length>0};
  const approved=choices[g.id],current=signature(next);
  const valid=!!approved&&current.web.every(key=>approved.web?.includes(key)||availableModes.web.includes(key)&&approved.modeWeb?.includes(key))&&
   current.reader.every(key=>approved.reader?.includes(key)||availableModes.reader.includes(key)&&approved.modeReader?.includes(key))&&subsequence(current.reader,approved.readerOrder||approved.reader);
  return {...next,readerGroupSelected:valid,readerGroupStale:!!approved&&!valid,
   adoptedTotal:next.adoptableTotal+modeWebsiteTotal,
   choice:approved?(valid?'reader':'pending'):g.choice};
 });
}
export function readerGroupDecisions(groups,decisions) {
 const selected={...decisions};
 for(const g of groups){
  if(g.readerGroupStale)throw new Error(`“${g.target}”的来源或数值已变化，请重新选择采用数据。`);
  if(g.readerGroupSelected)for(const row of g.web)selected[decisionKey(row)]={choice:g.modeWebsiteFallback.includes(row)?'web':'exclude'};
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
 const fallbackIds=new Set(groups.filter(g=>g.readerGroupSelected).flatMap(g=>g.modeWebsiteFallback.map(r=>`${r.sourceId}:${r.ruleId}`)));
 return {...report,rows:[...report.rows.map(r=>fallbackIds.has(`${r.sourceId}:${r.rule.id}`)?{...r,origin:'modeWebsiteFallback'}:r),...rows]};
}
