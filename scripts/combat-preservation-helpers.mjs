import fs from 'node:fs';
import {partsBeforeRemaining,tagDetailsBeforeRemaining,passBeforeRemaining} from './remaining-preservation-helpers.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/combat-preservation-2026-09-25.json',import.meta.url),'utf8'));
const newTags=new Set(manifest.newTags),oldIds=new Set(manifest.entries.map(e=>e.id));
export function partsBeforeCombat(entry){
 entry={...entry,parts:partsBeforeRemaining(entry)};
 const added=manifest.addedParts.filter(x=>x.skillId===entry.id);
 for(const x of added)if(JSON.stringify(entry.parts.find(p=>p.id===x.part.id))!==JSON.stringify(x.part))throw Error('Combat fragment transition drift');
 return entry.parts.filter(p=>!added.some(x=>x.part.id===p.id));
}
export function tagDetailsBeforeCombat(entry){
 const details=Object.fromEntries(Object.entries(tagDetailsBeforeRemaining(entry)).filter(([tag])=>!newTags.has(tag)));
 for(const fix of manifest.noteUpdates.filter(x=>x.skillId===entry.id)){
  if(details[fix.tag].calculationNote!==fix.after)throw Error('Combat note transition drift');
  details[fix.tag].calculationNote=fix.before;
 }
 return details;
}
export function registryBeforeCombat(registry){
 return {...registry,entries:registry.entries.filter(e=>oldIds.has(e.id)).map(e=>({...e,parts:partsBeforeCombat(e),tagDetails:tagDetailsBeforeCombat(e)})),tagPasses:registry.tagPasses.filter(p=>!newTags.has(p.tag)&&!['杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置'].includes(p.tag)).map(passBeforeRemaining)};
}
