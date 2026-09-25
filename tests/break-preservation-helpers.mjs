import fs from 'node:fs';
const noteUpdates=JSON.parse(fs.readFileSync(new URL('../docs/break-preservation-2026-09-25.json',import.meta.url),'utf8')).noteUpdates;
export function tagDetailsBeforeBreak(entry){
 const details=Object.fromEntries(Object.entries(structuredClone(entry.tagDetails)).filter(([tag])=>tag!=='Break'));
 for(const fix of noteUpdates.filter(f=>f.skillId===entry.id)){
  if(details[fix.tag].calculationNote!==fix.after)throw Error('Break note transition drift');
  details[fix.tag].calculationNote=fix.before;
 }
 return details;
}
