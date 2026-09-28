import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Converts the damage page's 专武 checkbox (equip every exclusive item, or none) into a
// <select> with one option per exclusive-gear item (real display name, verified against
// dist/game-data), plus 都装备/其他 -- generic across every mapped character's gear shape
// (one weapon + one armor, or two weapons with no armor slot, etc.), not hardcoded to any
// one character. Moved from the "特殊伤害改变" inline-options row into its own field next to
// 战斗攻击力/最终暴击率 (the row the 👁 icons' panels now share). No other calculation changes.
const allowed=new Set([
 'dist/character-template.mjs','dist/character-report-loader.mjs','dist/entry-workflow.mjs',
 'dist/base-rule-calculator.mjs','dist/entry-preparation.mjs','dist/damage-calculator.mjs',
 'dist/damage-calculator.html','dist/character-damage-bridge.mjs','dist/unified-calculator.mjs',
 'dist/bonus-comparison.mjs','dist/loadout-preview.mjs','dist/reader-group-review.mjs',
]);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','07dcd5d'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected special-weapon edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/special-weapon-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'“专武”从"equip everything or nothing"的复选框，改成按角色 gear 表生成的下拉框：每件专属装备一个选项（真实名称，取自 game-data 校验过的数据），外加都装备／其他；对没有 gear 数据的角色/装备形态也通用（如梅莉两把武器、没有护甲槽）。位置从"特殊伤害改变"行内选项移到战斗攻击力／最终暴击率同一行，作为第三个字段。仅改选项与选择如何映射到装备条件字段，不改变伤害计算逻辑本身。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} special-weapon edits.`);
