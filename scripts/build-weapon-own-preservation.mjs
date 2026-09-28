import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Damage calculator: its 专武 selector is the calculator's own choice again — no longer synced with the loadout
// page's 专武 toggle (which reset single-item choices to 未装备); the 专武 → 双刀 link is removed from
// engine-panel.mjs (双刀 is bound to the calculation only). Version tags bumped.
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','489d62e'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected weapon-own edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/weapon-own-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'伤害计算器的专武选择不再和配装页的专武开关同步（原先单选一件会被重置成未装备）；engine-panel.mjs 去掉专武→双刀联动（双刀只和计算绑定，仅在计算里本身已每段打两次时锁定）。版本号更新。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} weapon-own edits.`);
