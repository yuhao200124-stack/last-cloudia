import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Damage calculator: the result card script's version tag is bumped for the 双刀 lock (a move that already hits
// twice by the character's own skills or gear locks the 双刀 button on) and the 专武 link for characters with two
// exclusive weapons; both live in engine-panel.mjs, outside the protected set.
const allowed=new Set(['dist/damage-calculator.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','13e429b'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected dual-lock edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/dual-lock-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'结果卡模块版本号更新：招式本身已由技能／装备每段打两次时锁定双刀按钮（显示开启、不再叠加）；有两把专属武器的角色选“全部装备”时自动打开双刀、选其他时关闭。逻辑在 engine-panel.mjs 内。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} dual-lock edits.`);
