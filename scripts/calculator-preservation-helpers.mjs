import fs from 'node:fs';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/calculator-integration-preservation-2026-09-26.json',import.meta.url)));
const layout=JSON.parse(fs.readFileSync(new URL('../docs/excel-layout-preservation-2026-09-26.json',import.meta.url)));
const damageConditions=JSON.parse(fs.readFileSync(new URL('../docs/damage-conditions-preservation-2026-09-26.json',import.meta.url)));
const characterRestore=JSON.parse(fs.readFileSync(new URL('../docs/character-restore-preservation-2026-09-26.json',import.meta.url)));
const hash=text=>createHash('sha256').update(text).digest('hex');
// Historical classification assertions still compare against their original
// bytes. Only an exact, separately audited calculator edit can be rolled back.
export function textBeforeCommonCalculator(path,text){
 const restore=characterRestore.files[path];
 if(restore){
  if(hash(text)!==restore.afterHash||hash(restore.beforeText)!==restore.beforeHash)throw Error(`Character restore preservation drift: ${path}`);
  text=restore.beforeText;
 }
 const current=damageConditions.files[path];
 if(current){
  if(hash(text)!==current.afterHash||hash(current.beforeText)!==current.beforeHash)throw Error(`Damage condition preservation drift: ${path}`);
  text=current.beforeText;
 }
 const presentation=layout.files[path];
 if(presentation){
  if(hash(text)!==presentation.afterHash||hash(presentation.beforeText)!==presentation.beforeHash)throw Error(`Excel layout preservation drift: ${path}`);
  text=presentation.beforeText;
 }
 const change=manifest.files[path];if(!change)return text;
 if(hash(text)!==change.afterHash||hash(change.beforeText)!==change.beforeHash)throw Error(`Calculator preservation drift: ${path}`);
 return change.beforeText;
}
