import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='0ede45e5e08a0a287b078f3cac1473956d1b0746';
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.css','dist/damage-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected confirmed effects edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/confirmed-effects-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'将原隐藏的已确认伤害加成恢复为独立入口，放在面板与加成核对按钮右侧，替换角色固定资料说明；复用现有编辑与计算事件。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} confirmed effects interface edits.`);
