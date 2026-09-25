import {partsBeforeAbnormal} from '../scripts/validate-abnormal-labels.mjs';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
export const ADDITIONAL_RACE_TAGS=read('../docs/races-pass-definitions.json').map(d=>d.label);
const splits=read('../docs/races-preservation-2026-09-25.json').conditionSplits;
export function partsBeforeRaces(entry){
 let parts=partsBeforeBoss(entry);
 for(const split of splits.filter(s=>s.skillId===entry.id))parts=parts.flatMap(p=>p.id===split.originalPart.id?[split.originalPart]:split.replacementParts.some(x=>x.id===p.id)?[]:[p]);
 return parts;
}

const bossSplits=read('../docs/boss-preservation-2026-09-25.json').conditionSplits;
export function partsBeforeBoss(entry){
 let parts=partsBeforeAbnormal(entry).filter(p=>p.id!=='mnd-healing-reference');
 for(const split of bossSplits.filter(s=>s.skillId===entry.id))parts=parts.flatMap(p=>p.id===split.originalPart.id?[split.originalPart]:split.replacementParts.some(x=>x.id===p.id)?[]:[p]);
 return parts;
}
export const textBeforeBoss=(path,text)=>path==='dist/skill-labeling-model.mjs'?text.replace('(binding.group === view.effectGroup || binding.associatedGroups?.includes(view.effectGroup))','binding.group === view.effectGroup'):text;
