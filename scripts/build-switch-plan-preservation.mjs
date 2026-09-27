import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// In-battle switch plan from the user (2026-09-27).
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.mjs','dist/damage-condition-display.mjs','dist/effect-rule-engine.mjs','dist/entry-preparation.mjs','dist/entry-workflow.mjs','dist/game-skill-timing.mjs','dist/roxy-rules.mjs','dist/stat-condition-fields.mjs','dist/stat-mechanics.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','d501d7d'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)]){
 if(!allowed.has(path))throw Error(`Unexpected switch-plan edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/switch-plan-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'按用户确定的局内条件分组改写“通用伤害改变”：满血；濒死（含其他HP线、HP越低越强、觉醒类）；MP满；MP≤20；开局BUFF（含永久获得的BUFF如自动X/EX灵气、BOSS Wave、每Wave叠层、现实时间）；条件BUFF（击败敌人、受到伤害、发动必杀、敌人必杀、队友倒下、战斗经过时间）；复活后；自身格挡；自身状态（必杀槽满、身上指定BUFF、异常、移动中、特技储存满）；队伍。自动消耗MP/HP与连击数直接计入；目标状态开关移出面板。局外常驻加成仍默认计入。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} switch-plan edits.`);
