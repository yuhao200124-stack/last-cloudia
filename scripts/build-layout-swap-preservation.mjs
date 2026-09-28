import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Layout pass: the sandbox engine card becomes the primary results card (the plain "计算结果" card moves below
// it as the auxiliary/comparison one); the boss-monster target picker moves from the engine card into "Boss 与
// 战斗条件" via a new #engineTargetSlot anchor; cache-busting version query strings bumped. All DOM/behavior
// changes live in dist/engine-panel.mjs (unprotected); the only protected-file edit is the new anchor div and
// the version bumps in dist/damage-calculator.html.
const allowed=new Set(['dist/damage-calculator.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','b6c2a67'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected layout-swap edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/layout-swap-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'游戏脚本结算（沙盒引擎）卡片挪到「计算结果」卡片之前成为主卡片，旧的「计算结果」卡片挪到后面作为辅助对照；「目标：从游戏怪物表选择」从沙盒卡片移到「Boss 与战斗条件」区（新增 #engineTargetSlot 锚点）；角色等级／觉醒下拉、手填局外攻击力／法强、手填 HP%／MP% 均按用户要求直接删除（全部按最大计算／按局内开关判断）。行为改动都在不受保护的 dist/engine-panel.mjs 里；受保护文件只多了锚点 div 与缓存版本号。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} layout-swap edits.`);
