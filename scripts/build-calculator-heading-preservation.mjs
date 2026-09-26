import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const baseline='8e7935021df453ae5c91301bc8f09c6a272f90a7';
const paths=['dist/damage-calculator.css','dist/damage-calculator.html'];
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of paths){
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8'});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/calculator-heading-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'将计算器截图指定章节标题统一为角色资料的深色章节栏样式，不改变计算和技能数据。',files},null,2)+'\n');
console.log(`Recorded ${paths.length} calculator heading edits.`);
