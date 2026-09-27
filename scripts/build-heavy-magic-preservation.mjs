import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Non-stackable spells are cast as 重魔法.
const allowed=new Set(['dist/character-260.html','dist/entry-preparation.mjs','dist/entry-workflow.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','bba001b'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)]){
 if(!allowed.has(path))throw Error(`Unexpected heavy-magic edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/heavy-magic-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'泽诺克莱昂是不可叠加魔法（游戏 SkillMst 異度克里昂 SKILL_PARAM=1:1）：选中它时攻击方式自动改为重魔法，使魔术共鸣（冰属性伤害+30%、上限+50,000）等“不可叠加魔法期间”效果生效；原先存在“魔法”下的招式参数一并带过去。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} heavy-magic edits.`);
