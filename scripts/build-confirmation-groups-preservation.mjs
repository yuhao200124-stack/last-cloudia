import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='21c1168983ecfeb85ddb51988be4f4cdcc4fb080';
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.css','dist/damage-calculator.mjs','dist/loadout-preview.mjs','dist/unified-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected confirmation group edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/confirmation-groups-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'按用户要求添加圣物固定属性和伤害效果，分开确认角色与额外通用技能，并共用实时结果；保留原采用规则、来源ID、执行顺序和条件开关。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} confirmation group edits.`);
