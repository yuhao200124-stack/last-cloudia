import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Damage calculator: 法强／攻击力、最终暴击率 and the new 伤害上限 field are the selected move's own values from the
// game scripts, read-only, with the steps behind one shared 👁 (the engine panel fills them); 专武 moves below
// 具体招式／魔法; the old cap card, 高级计算明细 and the 暴击率基准 row are hidden at the user's request.
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','6c7579e'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected basic-steps edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/basic-steps-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'按用户要求：法强／攻击力、最终暴击率、伤害上限三个字段按所选招式由游戏数据算出（只读），三个 👁 统一开关显示计算过程；伤害上限放在原专武位置，专武移到具体招式／魔法下面；移除旧的上限卡片（基础及额外单段上限／每段最终伤害上限／运行时修正）、高级计算明细（通常自动处理）以及暴击率基准／读取器观察时暴击率一行。版本号更新。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} basic-steps edits.`);
