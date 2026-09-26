import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='470e668d70478c7ab5af47e0c61251e444fd09a7';
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.mjs','dist/loadout-preview.mjs','dist/unified-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected weapon calculation edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/weapon-calculation-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'修复普通计算页面专武开关仅发消息而不计算的问题；装备固定属性与词条同步启停并保存。暴击与双刀区按开关显示；删除指定展示内容。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} weapon calculation edits.`);
