import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='76ff41da0ae1293c82703eba63675f171c59b6d8';
const allowed=new Set(['dist/app.js','dist/damage-calculator.html','dist/damage-calculator.mjs','dist/entry-workflow.mjs','dist/index.html','dist/loadout-frame.mjs','dist/loadout-preview.mjs','dist/unified-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected exclusive weapon edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/exclusive-weapon-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'专武开关与实际装备双向同步，移动伤害分类并精简用户指定的说明文字；保留既有分类与计算规则保护基线。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} exclusive weapon edits.`);
