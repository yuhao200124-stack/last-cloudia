import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const baseline='af787c65731cb5324e2f67d46af0ae05074116f3';
const allowed=new Set([
 'dist/damage-calculator.css','dist/damage-calculator.html','dist/damage-calculator.mjs',
 'dist/damage-engine.mjs','dist/effect-rule-engine.mjs','dist/entry-preparation.mjs','dist/entry-workflow.mjs',
 'dist/loadout-preview.mjs','dist/magic-buffs.mjs','dist/stat-condition-fields.mjs','dist/unified-calculator.mjs'
]);
const hash=text=>createHash('sha256').update(text).digest('hex');
const changed=execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const files={};
for(const path of changed){
 if(!allowed.has(path))throw Error(`Unexpected damage condition change: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/damage-conditions-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'在原计算器按用户确认的手动开关控制双刀、特攻、Break、暴击、BOSS、弱属；合并条件BUFF，保留原有读取器与分类保护记录。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} exact damage-calculator changes.`);
