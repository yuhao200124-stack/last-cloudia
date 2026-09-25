import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/combat-preservation-2026-09-25.json',import.meta.url),'utf8'));
const newTags=new Set(manifest.newTags),oldIds=new Set(manifest.entries.map(e=>e.id));
export function partsBeforeCombat(entry){
 const added=manifest.addedParts.filter(x=>x.skillId===entry.id);
 for(const x of added)if(JSON.stringify(entry.parts.find(p=>p.id===x.part.id))!==JSON.stringify(x.part))throw Error('Combat fragment transition drift');
 return entry.parts.filter(p=>!added.some(x=>x.part.id===p.id));
}
export function tagDetailsBeforeCombat(entry){
 const details=Object.fromEntries(Object.entries(structuredClone(entry.tagDetails)).filter(([tag])=>!newTags.has(tag)));
 for(const fix of manifest.noteUpdates.filter(x=>x.skillId===entry.id)){
  if(details[fix.tag].calculationNote!==fix.after)throw Error('Combat note transition drift');
  details[fix.tag].calculationNote=fix.before;
 }
 return details;
}
export function registryBeforeCombat(registry){
 return {...registry,entries:registry.entries.filter(e=>oldIds.has(e.id)).map(e=>({...e,parts:partsBeforeCombat(e),tagDetails:tagDetailsBeforeCombat(e)})),tagPasses:registry.tagPasses.filter(p=>!newTags.has(p.tag))};
}
