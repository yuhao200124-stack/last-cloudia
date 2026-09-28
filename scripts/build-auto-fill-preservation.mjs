import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Character pages: numbers the game text leaves out are now filled in automatically from the exported
// game data instead of per-skill registrations (docs/game-text-fills.json is emptied). The export
// substitutes every PROCESS_EXPLAIN_QUOTE form itself, lists each exclusive gear's max-stage passives
// and each passive's always-on state processes; the generator writes those and, where unambiguous,
// the chance after "一定机率". Display text only; the calculator still matches data-rule-text, so no
// rule, status or value changes.
const allowed=new Set(['dist/character-182.html','dist/character-245.html','dist/character-259.html','dist/character-260.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','6cd8ed2'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected auto-fill edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/auto-fill-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'角色页说明中原文未写出的数值改为全自动补上：导出直接代入所有“{0}”（含乘除运算的引用），专武取最高强化阶段的被动，“始终保持「…」效果”按被动的常驻效果处理补数值，“一定机率”在读取器几率能一一对应时补上几率；docs/game-text-fills.json 的逐条登记清空。仅页面显示文字，计算器规则匹配与数值不变。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} auto-fill edits.`);
