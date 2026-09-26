import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='4cd2f0354ad8d7d58fb6bd4c30b27aaaead91e1d';
const allowed=new Set(['dist/app.js','dist/styles.css','dist/index.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected change outside ordinary list: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:5e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/excel-layout-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'用户提供原Excel作为布局参考，恢复普通列表SC与圣物列、分栏和表头，沿用当前译名、效果与全部计算及标签数据。保留上一轮保护记录，精确还原至上一轮后再进行历史保护校验。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} ordinary-list presentation changes.`);
