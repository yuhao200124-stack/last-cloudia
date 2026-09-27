import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Move's own damage cap from game data.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-import.mjs','dist/entry-workflow.mjs','dist/game-data.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','880d8d5'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/'))){
 if(!allowed.has(path))throw Error(`Unexpected move-cap edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/move-cap-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'招式自带伤害上限（游戏 BulletLvInfoMst 82600，如豪雷积雨云 +150,000）自动计入每段上限；角色规则已计入同一上限时（技能来源组 specials）不重复。游戏数据同时补齐伤害分类、伤害参照、攻击属性。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} move-cap edits.`);
