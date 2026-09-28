import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Damage calculator: the 弱属 switch is gone from the page (weakness follows the target's resistance to the
// attack element, as the game decides it); the result card script's version tag is bumped. The result card and
// the 双刀／特攻／Break handling live in engine-panel.mjs and dist/engine/, outside the protected set.
const allowed=new Set(['dist/damage-calculator.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','27458b5'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected switches edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/switches-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'伤害计算器去掉“弱属”勾选（按目标对攻击属性的抗性自动判定，抗性为负即弱点，隐藏输入仍供网页旧规则同步）；结果卡模块版本号更新。双刀／特攻／Break 开关直接决定状态、专武按最高阶与最高强化、结果卡删行与“弱属匹配”在 engine-panel.mjs 与 dist/engine/ 内。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} switches edits.`);
