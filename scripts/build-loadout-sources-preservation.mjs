import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='c124bab69e86cdc089bffeedf2cbcea5787ef372';
const allowed=new Set(['dist/app.js','dist/index.html','dist/styles.css','dist/damage-calculator.html','dist/damage-calculator.mjs','dist/damage-import.mjs','dist/entry-preparation.mjs','dist/entry-workflow.mjs','dist/loadout-preview.mjs','dist/unified-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected loadout source change: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/loadout-sources-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'按用户截图修复普通计算与配装计算的数据差异，将个性、装备、加护和已采用读取器来源加入原配装界面。保留既有分类与公式保护基线。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} loadout integration changes.`);
