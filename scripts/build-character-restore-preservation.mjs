import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const baseline='99fcfb46908aa43cff4331624b37d477947591db';
const allowed=new Set(['dist/app.js','dist/index.html','dist/styles.css']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const changed=execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const files={};
for(const path of changed){
 if(!allowed.has(path))throw Error(`Unexpected character restore change: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/character-restore-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'在原配装栏增加还原当前角色自带全部技能的操作，并记录入口、交互和样式的精确变更。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} character restore changes.`);
