import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Game-data skill table page (942 relic passives) and its navigation link.
const allowed=new Set(['dist/index.html','dist/game-skills.html','dist/game-skills.js','dist/game-skills.css','dist/game-skill-data.js']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','b5e35e8'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)]){
 if(!allowed.has(path))throw Error(`Unexpected game-table edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/game-table-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'新增“游戏数据技能表”页面：942 个可从圣物学习的被动，名称、SC、效果、圣物取自游戏主数据，分类与排序沿用原技能表；原技能表页头增加入口链接，原表内容不变。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} game-table edits.`);
