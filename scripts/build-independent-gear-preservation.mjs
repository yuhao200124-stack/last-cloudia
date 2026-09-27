import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Damage calculator independent of the basic calculator; 专武 equips all exclusive gear (see reason).
const allowed=new Set(['dist/base-rule-calculator.mjs','dist/character-damage-bridge.mjs','dist/entry-preparation.mjs','dist/entry-workflow.mjs','dist/loadout-preview.mjs','dist/unified-calculator.mjs','dist/damage-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','ff36274'],{encoding:'utf8'}).trim();
const files={};
for(const path of execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected independent-gear edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/independent-gear-preservation-2026-09-27.json',JSON.stringify({baseline:base,reason:'伤害计算器与基础计算器解耦：伤害计算器使用角色默认条件下的规则，专武开关装备全部专属装备；未选装备不再被当作手动停用；重魔法即不可叠加魔法（魔术共鸣）；魔法连锁至少第1档。均按游戏代码与实战记录核对。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} independent-gear edits.`);
