import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Game-code skill timing (opening / always / conditional buffs) from PassiveSkillMst + ProcessMst triggers.
const allowed=new Set(['dist/common-skill-rules.mjs','dist/basic-stat-rules.mjs','dist/damage-calculator.mjs','dist/damage-calculator.html','dist/damage-calculator.css','dist/game-skill-timing.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','511a825'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)]){
 if(!allowed.has(path))throw Error(`Unexpected game-timing edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/game-timing-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'导入游戏技能目录的时机判定：按 ProcessCondMst 触发类型与継続時間区分局外常驻、局内常驻、开局BUFF（trigger 10，多为2400帧=40秒）、HP条件、条件BUFF（事件触发）和攻击时判定；仅修正与游戏数据矛盾的开关（自动暴击、双龙、圣诞派对！去掉开局BUFF；作战行动、师徒之绊加开局BUFF；万物尽灭、炼金术资质、无法抗拒的力量洪流、一击入魂、星眼去掉条件BUFF），并在计算器中显示游戏判定。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} game-timing edits.`);
