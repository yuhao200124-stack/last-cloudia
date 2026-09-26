import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const baseline='356b99202e751191bb55a40b203acef9d12a50a3';
const allowed=new Set(['dist/app.js','dist/calculator-navigation.mjs','dist/character-245.html','dist/character-259.html','dist/character-260.html','dist/characters.html','dist/damage-calculator.css','dist/damage-calculator.html','dist/damage-calculator.mjs','dist/index.html','dist/loadout-frame.mjs','dist/styles.css','dist/unified-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(path==='dist/scenario-bonus-summary.mjs')continue;
 if(!allowed.has(path))throw Error(`Unexpected scenario summary edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/scenario-summary-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'角色技能总览、按当前攻击条件筛选的伤害及上限汇总、配装详细视图轮换与隐藏加护条目；原伤害计算仍由原引擎执行。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} scenario summary edits.`);
