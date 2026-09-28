import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Follow-up to the panel-breakdown disclosure: moves the 👁 details for "当前面板法强/攻击力"
// to sit right after that one field (inside its own <label>, so the two-column layout keeps
// exactly one cell per field) instead of as a separate block spanning both fields below the
// row, and adds a matching 👁 for 最终暴击率 -- a reference-only note (observedCritical()'s own
// note text) shown only when #critRate was actually filled from a reader observation. Neither
// change touches what fills #attack or #critRate, or any damage calculation.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-calculator.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','a0f7df9'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected attack/crit-breakdown edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/attack-crit-breakdown-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'“面板计算明细”👁 从两列字段下方的独立 details 移到 #attack 自己的 <label> 内（紧跟在“当前面板法强/攻击力”字段后面），两列布局仍然各自一个 label 单元格；同时给“最终暴击率”加了一个对应的 👁，展示 observedCritical() 已有的说明文字（暴击率取自读取器观察面板时的提示），只在 #critRate 确实取用了读取器观察值时显示。面板明细的说明文字里补充了一句：这些实时加成是否计入由下方对应的战斗条件开关决定（如“开局BUFF”覆盖了自动X、EX灵气这类常驻BUFF）——不新增任何开关，也不改变 #attack/#critRate 的取值或任何伤害计算。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} attack/crit-breakdown edits.`);
