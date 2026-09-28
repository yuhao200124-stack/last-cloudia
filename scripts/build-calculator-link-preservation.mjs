import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// The header link to the damage calculator without a character is removed from every page at the user's request
// (2026-09-28): the calculator is opened only from a character page (its own 伤害计算器 button).
const allowed=new Set(['dist/characters.html','dist/character-182.html','dist/character-245.html','dist/character-259.html','dist/game-skills.html','dist/index.html','dist/skill-labeling.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','0988749'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected calculator-link edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/calculator-link-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'按用户要求删除所有页面顶部不带角色的“伤害计算器”链接，只从各角色页进入计算器。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} calculator-link edits.`);
