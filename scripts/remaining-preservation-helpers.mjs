import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/remaining-preservation-2026-09-25.json',import.meta.url),'utf8'));
const newTags=new Set(manifest.newTags),oldIds=new Set(manifest.entries.map(e=>e.id));
export function partsBeforeRemaining(entry){
 const added=manifest.addedParts.filter(x=>x.skillId===entry.id);
 for(const x of added)if(JSON.stringify(entry.parts.find(p=>p.id===x.part.id))!==JSON.stringify(x.part))throw Error('Remaining fragment transition drift');
 return entry.parts.filter(p=>!added.some(x=>x.part.id===p.id));
}
export function tagDetailsBeforeRemaining(entry){
 const details=Object.fromEntries(Object.entries(structuredClone(entry.tagDetails)).filter(([tag])=>!newTags.has(tag)));
 const change=manifest.changedDetails.find(x=>x.skillId===entry.id);
 for(const[tag,fix]of Object.entries(change?.details||{})){
  if(JSON.stringify(details[tag]??null)!==JSON.stringify(fix.after))throw Error('Remaining detail transition drift');
  if(fix.before===null)delete details[tag];else details[tag]=structuredClone(fix.before);
 }
 return details;
}
export function passBeforeRemaining(pass){
 const fix=manifest.changedPasses.find(x=>x.tag===pass.tag);
 if(!fix)return pass;
 if(JSON.stringify(pass)!==JSON.stringify(fix.after))throw Error('Remaining pass transition drift');
 return structuredClone(fix.before);
}
export function registryBeforeRemaining(registry){
 return {...registry,entries:registry.entries.filter(e=>oldIds.has(e.id)).map(e=>({...e,parts:partsBeforeRemaining(e),tagDetails:tagDetailsBeforeRemaining(e)})),tagPasses:registry.tagPasses.filter(p=>!newTags.has(p.tag)).map(passBeforeRemaining)};
}
