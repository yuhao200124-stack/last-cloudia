import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Condition switches split by game trigger; game table puts the 9 missing relic passives in 杂项.
const allowed=new Set(['dist/damage-calculator.css','dist/damage-calculator.html','dist/damage-calculator.mjs','dist/damage-condition-display.mjs','dist/effect-rule-engine.mjs','dist/entry-workflow.mjs','dist/entry-preparation.mjs','dist/game-skill-timing.mjs','dist/stat-condition-fields.mjs','dist/game-skill-data.js','dist/game-skills.js','dist/game-skills.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','77acd70'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)]){
 if(!allowed.has(path))throw Error(`Unexpected game-conditions edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/game-conditions-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'按游戏触发条件拆分伤害计算器的条件开关：自身HP、攻击时判定、开局BUFF、条件BUFF（队友倒下后、自身复活后、击败敌人后、发动必杀后、敌人发动必杀后、受到伤害后、觉醒、魔导觉醒、战斗经过一段时间后）和持续条件（必杀槽满、队伍编成、其他）；原先统一挂在“条件BUFF”的 29 个通用技能按游戏触发改挂到对应开关，“条件BUFF（全部）”仍可一次全开。游戏数据技能表把原表未收录的 9 个圣物被动放入杂项。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} game-conditions edits.`);
