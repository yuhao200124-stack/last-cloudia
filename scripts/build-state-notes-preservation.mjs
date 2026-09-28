import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Character pages: "始终保持「速充」效果"-style descriptions (an always-on state named without its
// numbers) now carry the state's effect and values, read from the reader-decoded game values and
// written by scripts/sync-character-game-text.mjs right after that clause. Display text only; the
// calculator still matches data-rule-text, so no rule, status or value changes.
const allowed=new Set(['dist/character-182.html','dist/character-245.html','dist/character-259.html','dist/character-260.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','a193ce4'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected state-notes edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/state-notes-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'角色页“始终保持「…」效果”一类只写状态名的说明，按读取器解析值在该句后补上状态的效果与数值（自动充能、自动暴击、自动大型鼓舞、自动EX鼓舞、自动速咏、超规格的魔术师、龙与皇的多年羁绊）；仅页面显示文字，计算器规则匹配与数值不变。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} state-notes edits.`);
