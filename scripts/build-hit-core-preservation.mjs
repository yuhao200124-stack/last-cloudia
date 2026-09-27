import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Hit-ratio placement defaults to the core coefficient (verified in GameAssembly.dll: ProcControlDamage multiplies CalcDamageHealWrapper.dmgRatio into the skill coefficient).
const allowed=new Set(['dist/damage-engine.mjs','dist/damage-calculator.mjs','dist/damage-calculator.html','dist/loadout-preview.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','99c3011'],{encoding:'utf8'}).trim();
const files={};
for(const path of execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected hit-core edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/hit-core-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'游戏代码确认：双刀/多段魔法的单段伤害倍率（CalcDamageHealWrapper.dmgRatio）在 ProcessWork.ProcControlDamage 中乘入技能系数，属于核心系数；未选择位置时默认核心，不再阻止计算。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} hit-core edits.`);
