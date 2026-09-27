import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Always-on battle buffs listed in the condition panel.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-calculator.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','252d779'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)]){
 if(!allowed.has(path))throw Error(`Unexpected always-buffs edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/always-buffs-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'条件开关下方列出战斗中常驻的状态BUFF（如洛琪希的EX灵气，游戏为 trigger 65 自动效果、常时保有），说明已自动计入、无需勾选；不改变任何计算。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} always-buffs edits.`);
