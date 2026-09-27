import {BASIC_STAT_CATALOG,BASIC_STAT_ALIASES} from './basic-stat-catalog.mjs?v=20260924-condition-tags';
import {applyGameTiming} from './game-skill-timing.mjs?v=20260927-game-timing';
const clean=t=>String(t||'').replace(/＋/g,'+').replace(/％/g,'%').replace(/\s+/g,' ').trim();
export function basicStatIdentity(source){
 const id=source?.catalogId||String(source?.id||'').replace(/^loadout:/,'');
 return BASIC_STAT_ALIASES[id]|| (BASIC_STAT_CATALOG[id]?id:null);
}
export function basicStatNameIdentity(name){
 const matches=Object.values(BASIC_STAT_CATALOG).filter(e=>e.names.includes(name));
 return matches.length===1?matches[0].id:null;
}
export function basicStatRules(source){
 const id=basicStatIdentity(source)||basicStatNameIdentity(source?.name),entry=id&&BASIC_STAT_CATALOG[id];
 // Names may be edited; a changed effect must never inherit official numeric rules.
 if(!entry||source.edited||clean(source.text)!==clean(entry.text))return null;
 return applyGameTiming(id,structuredClone(entry.rules)).map(r=>({...r,id:`${source.id}:${r.id}`}));
}
