import {COMMON_SKILL_CATALOG,COMMON_SKILL_ALIASES} from './common-skill-catalog.mjs?v=20260926-common-skills';
import {basicStatRules} from './basic-stat-rules.mjs?v=20260924-condition-tags';
const clean=t=>String(t||'').replace(/＋/g,'+').replace(/％/g,'%').replace(/\s+/g,' ').trim();
const names=new Map();
for(const entry of Object.values(COMMON_SKILL_CATALOG)){const list=names.get(entry.name)||[];list.push(entry);names.set(entry.name,list);}
export function commonSkillIdentity(source){
 if(source?.edited)return null;
 const raw=source?.catalogId||String(source?.id||'').replace(/^loadout:/,'');
 const byId=COMMON_SKILL_CATALOG[COMMON_SKILL_ALIASES[raw]||raw];
 if(byId)return clean(source.text)===clean(byId.text)?byId.id:null;
 const candidates=(names.get(source?.name)||[]).filter(e=>clean(source.text)===clean(e.text));
 return candidates.length===1?candidates[0].id:null;
}
export function commonSkillRules(source){
 const id=commonSkillIdentity(source);if(!id)return null;
 const entry=COMMON_SKILL_CATALOG[id],basic=basicStatRules({...source,catalogId:id})||[];
 const extra=structuredClone(entry.rules).map(r=>({...r,id:`${source.id}:${r.id}`}));
 // Keep existing stat layers (and unresolved stat formulas), replacing only
 // their former catch-all non-stat placeholder with explicit common rules.
 const rules=[...basic.filter(r=>r.part!=='other'),...extra];
 return rules.length?rules:[{id:`${source.id}:reference`,part:'reference',text:entry.text,conditions:[],effects:[{type:'utility',target:'不直接改变本次主攻击伤害',value:0,unit:''}],review:'ready',verification:'description'}];
}

// Refresh only machine-generated, empty legacy placeholders. Confirmed reader
// values, user templates, disabled rules and existing stat rules take priority.
export function upgradeCommonSource(source){
 const replaceable=r=>!r.disabled&&r.review==='pending'&&r.effects?.length===0&&(r.part==='other'||r.note?.startsWith('尚无完整原文匹配的已确认规则'));
 if(!source.rules?.some(replaceable))return source;
 const registered=commonSkillRules(source);if(!registered)return source;
 const existing=source.rules.filter(r=>!replaceable(r));
 const rules=existing.length?[...existing,...registered.filter(r=>!r.id.includes(':basic:'))]:registered;
 return {...source,rules};
}
