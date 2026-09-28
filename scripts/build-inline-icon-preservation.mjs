import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Moves the 👁 disclosure icon for "当前面板法强/攻击力" and "最终暴击率" from a
// below-the-field <details><summary> row into the field's own box (a small icon button
// overlaid on the input's right edge, matching where the user circled it in a screenshot).
// Switches from native <details> to a plain button + hidden panel toggled by a click
// listener, since the icon now needs to sit inside the input's box while its expanded
// content still opens as a full-width panel below -- <details>/<summary> can't be split
// that way. No calculation, no value, and no other behavior changes.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-calculator.html','dist/damage-calculator.css']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','766efca'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected inline-icon edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/inline-icon-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'“当前面板法强/攻击力”与“最终暴击率”的👁从字段下方的 <details> 行，改成字段输入框自己右侧内嵌的小图标按钮；展开内容仍在下方以整行面板显示，但由按钮点击手动切换（.field-icon-wrap/.field-icon-btn/.field-icon-panel 新样式），不再依赖 <details> 原生开合。不改变任何数值、判定或伤害计算。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} inline-icon edits.`);
