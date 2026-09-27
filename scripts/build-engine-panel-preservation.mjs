import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Sandbox engine panel: the calculator publishes its state (`lc:calculator-update`) and hosts engine-panel.mjs.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-calculator.html','dist/game-data.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','8ce0bdf'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected engine-panel edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/engine-panel-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'游戏脚本结算面板（沙盒引擎 dist/engine）：计算器在每次重算后发布 lc:calculator-update 事件（读取报告、所选招式的游戏技能 id、局内开关、参照属性、游戏角色的自带技能），页面加载 engine-panel.mjs；gameMoveParameters 附带招式 id 与名称。网页旧规则结果不变，面板为并列对照。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} engine-panel edits.`);
