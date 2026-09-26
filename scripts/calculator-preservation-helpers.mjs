import fs from 'node:fs';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/calculator-integration-preservation-2026-09-26.json',import.meta.url)));
const hash=text=>createHash('sha256').update(text).digest('hex');
// Historical classification assertions still compare against their original
// bytes. Only an exact, separately audited calculator edit can be rolled back.
export function textBeforeCommonCalculator(path,text){
 const change=manifest.files[path];if(!change)return text;
 if(hash(text)!==change.afterHash||hash(change.beforeText)!==change.beforeHash)throw Error(`Calculator preservation drift: ${path}`);
 return change.beforeText;
}
