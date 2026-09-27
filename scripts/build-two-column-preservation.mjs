import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Excel two-column look for the ordinary skill table (index.html only).
// The calculator's embedded skill list (html.lc-embedded) keeps its previous look.
const allowed=new Set(['dist/index.html','dist/styles.css']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','a0a5c9b'],{encoding:'utf8'}).trim();
const files={};
for(const path of execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected two-column edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/two-column-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'普通技能表按 Excel 样式改为两列显示；仅新增限定于独立页面的样式，计算器内嵌技能表、技能名称、效果、数据与计算逻辑均不变。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} two-column edits.`);
