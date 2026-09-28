import {COMMON_SKILL_CATALOG,COMMON_SKILL_ALIASES} from './common-skill-catalog.mjs?v=20260926-skill-coverage';
import {basicStatRules} from './basic-stat-rules.mjs?v=20260924-condition-tags';
import {applyGameTiming} from './game-skill-timing.mjs?v=20260927-game-timing';
import {GAME_SKILL_NAMES} from './game-skill-names.mjs?v=20260928-game-names';
const clean=t=>String(t||'').replace(/＋/g,'+').replace(/％/g,'%').replace(/\s+/g,' ').trim();
const names=new Map();
// Character pages name common skills as the game database does; index each entry under that name
// too (GAME_SKILL_NAMES, by skill-table id), alongside the skill table's own name.
for(const entry of Object.values(COMMON_SKILL_CATALOG))for(const name of new Set([entry.name,GAME_SKILL_NAMES[entry.id]].filter(Boolean))){const list=names.get(name)||[];list.push(entry);names.set(name,list);}
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
 const entry=COMMON_SKILL_CATALOG[id],basic=entry.basicRules?structuredClone(entry.basicRules).map(r=>({...r,id:`${source.id}:${r.id}`})):basicStatRules({...source,catalogId:id})||[];
 const extra=structuredClone(entry.rules).map(r=>({...r,id:`${source.id}:${r.id}`}));
 // Keep existing stat layers (and unresolved stat formulas), replacing only
 // their former catch-all non-stat placeholder with explicit common rules.
 const rules=applyGameTiming(id,[...basic.filter(r=>r.part!=='other'),...extra]);
 return rules.length?rules:[{id:`${source.id}:reference`,part:'reference',text:entry.text,conditions:[],effects:[{type:'utility',target:'不直接改变本次主攻击伤害',value:0,unit:''}],review:'ready',verification:'description'}];
}

// Refresh only machine-generated, empty legacy placeholders. Confirmed reader
// values, user templates, disabled rules and existing stat rules take priority.
export function upgradeCommonSource(source){
 const canonical=commonSkillIdentity(source),entry=COMMON_SKILL_CATALOG[canonical];
 if(entry?.legacyPending?.length&&source.rules?.length){
  const signature=r=>JSON.stringify([r.part,r.text,r.conditions,r.effects,r.review,r.verification,r.note||'']);
  const registered=commonSkillRules(source);
  let changed=false;
  const rules=source.rules.flatMap(r=>{
   if(r.disabled||r.review!=='pending')return [r];
   const old=entry.legacyPending.find(o=>signature(o)===signature(r));
   if(!old)return [r];
   const candidates=registered.filter(n=>n.id===`${source.id}:${old.id}`||n.id.startsWith(`${source.id}:${old.id}:`));
   if(!candidates.length)return [r];
   changed=true;
   return candidates.map((n,i)=>({...n,id:candidates.length===1?r.id:`${r.id}:${i}`}));
  });
  if(changed)return {...source,rules};
 }
 const replaceable=r=>!r.disabled&&r.review==='pending'&&r.effects?.length===0&&(r.part==='other'||r.note?.startsWith('尚无完整原文匹配的已确认规则'));
 if(!source.rules?.some(replaceable))return source;
 const registered=commonSkillRules(source);if(!registered)return source;
 const existing=source.rules.filter(r=>!replaceable(r));
 const rules=existing.length?[...existing,...registered.filter(r=>!r.id.includes(':basic:'))]:registered;
 return {...source,rules};
}
