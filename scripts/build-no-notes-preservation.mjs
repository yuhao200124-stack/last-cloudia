import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Damage calculator: the explanatory sentence above the 法强／攻击力 steps and the reader-observation note behind
// 最终暴击率's 👁 are removed at the user's request (the 👁 of 最终暴击率 is hidden, having nothing left to show).
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','2f26ac4'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected no-notes edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/no-notes-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'按用户要求移除两段说明：法强／攻击力明细上方的“正常面板…由下方开关决定…”一句，以及最终暴击率 👁 里的“观察时面板暴击率…”说明（该 👁 因此隐藏）。版本号更新。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} no-notes edits.`);
