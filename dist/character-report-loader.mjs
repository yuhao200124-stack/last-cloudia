import {DEFAULT_CONTEXT,evaluateCatalog} from './effect-rule-engine.mjs';
import {buildCatalog,LEARNING_STORAGE_KEY,sourceKey,makeTemplate} from './effect-rule-learning.mjs?v=20260924-unified';
import {CATALOG} from './roxy-rules.mjs?v=20260924-unified';
import {ACCOUNT_BLESSING_CATALOG} from './account-blessings.mjs?v=20260924-unified';
import {readCharacterProfile} from './entry-preparation.mjs?v=20260924-unified';
export function characterReportFromDocument(doc,saved={},templates={}){
 const profile=readCharacterProfile(doc),id=profile.characterId,sources=[];
 const add=(name,text,group)=>{const seed=id==='260'&&CATALOG.find(s=>s.group===group&&s.name===name);sources.push({id:seed?.id||`${id}-${group}-${sources.length+1}`,name,text,group});};
 doc.querySelectorAll('#traits .trait').forEach(el=>add(el.querySelector('h4').textContent.trim(),el.querySelector('p').textContent.trim(),'traits'));
 for(const section of ['exclusive-skills','common-skills'])doc.querySelectorAll(`#${section} tbody tr`).forEach(el=>{const name=el.querySelector('.skill-name');add(name.textContent.trim(),el.querySelector('td:last-child').textContent.trim(),name.classList.contains('transcend')?'transcend':section==='exclusive-skills'?'exclusive':'common');});
 doc.querySelectorAll('#equipment .equipment-card').forEach(el=>{const dds=[...el.querySelectorAll('dd')];add(el.querySelector('h4').textContent.trim(),`最高属性：${dds[1].textContent.trim()}；最高效果：${dds[2].textContent.trim()}`,'equipment');});
 sources.push(...ACCOUNT_BLESSING_CATALOG);
 const catalog=buildCatalog(sources,[...(id==='260'?CATALOG:[]),...ACCOUNT_BLESSING_CATALOG],templates).map(s=>{
  const draft=saved.drafts?.[sourceKey(s)];if(!draft)return s;
  try{return {...s,rules:makeTemplate(s,draft.rules).rules};}catch{return s;}
 });
 const overrides={};for(const source of saved.disabledSources||[])overrides[`source:${source}`]={disabled:true};for(const rule of saved.disabledRules||[])overrides[rule]={disabled:true};
 return {schemaVersion:1,kind:'last-cloudia-effect-report',characterId:id,characterName:profile.name,profile,createdAt:new Date().toISOString(),...evaluateCatalog(catalog,{...DEFAULT_CONTEXT,accountBlessings:false,...saved.context},overrides)};
}
export async function loadCharacterReport(id){
 if(!/^\d+$/.test(id))throw new Error('请先选择角色');
 const response=await fetch(`./character-${id}.html`);if(!response.ok)throw new Error('角色资料加载失败');
 const doc=new DOMParser().parseFromString(await response.text(),'text/html');
 if(String(doc.body.dataset.characterId)!==String(id))throw new Error('角色资料不匹配');
 const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}};
 return characterReportFromDocument(doc,read(`lc-effect-rules:character:${id}:v1`),read(LEARNING_STORAGE_KEY));
}
