import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Calculator reads move parameters from game master data.
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.mjs','dist/entry-workflow.mjs','dist/game-data.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','c02744c'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/'))){
 if(!allowed.has(path))throw Error(`Unexpected game-data edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/game-data-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'计算器改为调用游戏主数据（dist/game-data/，读取器 v0.8 导出的 SkillMst/BulletMst/BulletLvInfoMst/UnitDressMst/ItemEquipMst/ArkMst/PassiveSkillMst）：选择招式时，没有手填、也没有读取报告数值的系数、攻击修正、属性加算自动带入；不可叠加魔法自动选重魔法；独立计算器可按角色或魔法直接选择游戏招式。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} game-data edits.`);
