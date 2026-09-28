import {DEFAULT_CONTEXT,evaluateCatalog} from './effect-rule-engine.mjs?v=20260926-mayly';
import {buildCatalog,LEARNING_STORAGE_KEY,sourceKey,makeTemplate} from './effect-rule-learning.mjs?v=20260926-mayly';
import {characterDefinition,characterContext,collectCharacterSources} from './character-template.mjs?v=20260928-special-weapon';
import {ACCOUNT_BLESSING_CATALOG} from './account-blessings.mjs?v=20260924-fullpage';
import {readCharacterProfile} from './entry-preparation.mjs?v=20260928-special-weapon';
export function characterReportFromDocument(doc,saved={},templates={}){
 const profile=readCharacterProfile(doc),id=profile.characterId,sources=collectCharacterSources(doc);
 const catalog=buildCatalog(sources,[...characterDefinition(id).catalog,...ACCOUNT_BLESSING_CATALOG],templates).map(s=>{
  const draft=saved.drafts?.[sourceKey(s)];if(!draft)return s;
  try{return {...s,rules:makeTemplate(s,draft.rules).rules};}catch{return s;}
 });
 const overrides={};for(const source of saved.disabledSources||[])overrides[`source:${source}`]={disabled:true};for(const rule of saved.disabledRules||[])overrides[rule]={disabled:true};
 return {schemaVersion:1,characterTemplateRevision:1,kind:'last-cloudia-effect-report',characterId:id,characterName:profile.name,profile,createdAt:new Date().toISOString(),...evaluateCatalog(catalog,{...characterContext(id),...saved.context},overrides)};
}
export async function loadCharacterReport(id){
 if(!/^\d+$/.test(id))throw new Error('请先选择角色');
 const response=await fetch(`./character-${id}.html?v=20260926-mayly`);if(!response.ok)throw new Error('角色资料加载失败');
 const doc=new DOMParser().parseFromString(await response.text(),'text/html');
 if(String(doc.body.dataset.characterId)!==String(id))throw new Error('角色资料不匹配');
 const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}};
 return characterReportFromDocument(doc,read(`lc-effect-rules:character:${id}:v1`),read(LEARNING_STORAGE_KEY));
}
