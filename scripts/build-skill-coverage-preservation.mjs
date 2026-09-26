import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='0599b6f9e918af6f2e004801a4e22b77410810f4';
const allowed=new Set(['dist/account-blessings-panel.mjs', 'dist/base-rule-calculator.mjs', 'dist/bonus-comparison.mjs', 'dist/calculator-navigation.mjs', 'dist/character-245.html', 'dist/character-259.html', 'dist/character-260.html', 'dist/character-damage-bridge.mjs', 'dist/character-report-loader.mjs', 'dist/characters.html', 'dist/combat-modes.mjs', 'dist/common-skill-catalog.mjs', 'dist/common-skill-rules.mjs', 'dist/critical-options.mjs', 'dist/damage-calculator.css', 'dist/damage-calculator.html', 'dist/damage-calculator.mjs', 'dist/damage-import.mjs', 'dist/effect-rule-engine.mjs', 'dist/effect-rule-learning.mjs', 'dist/entry-preparation.mjs', 'dist/entry-workflow.mjs', 'dist/index.html', 'dist/loadout-preview.mjs', 'dist/panel-calculator.mjs', 'dist/reader-bonus-decoder.mjs', 'dist/reader-group-review.mjs', 'dist/reader-supplements.mjs', 'dist/roxy-rules.mjs', 'dist/stat-condition-fields.mjs', 'dist/unified-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(!allowed.has(path))throw Error(`Unexpected skill coverage edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/skill-coverage-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'按用户要求接入已记录最大值、补齐通用技能数值适配、区分回复和主攻击、修复BUFF状态与旧存档，并调整技能卡排版；分类原数据不改，未完成项目保留具体记录',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} skill coverage edits.`);
