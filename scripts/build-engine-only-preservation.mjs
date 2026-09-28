import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// The old rule-based calculator is removed at the user's request (2026-09-28): the damage calculator page keeps only
// the game-script calculation (moves from the game data, hit count by the user, 圣物属性 on the final stats), the
// character pages drop 基础计算器／基础伤害上限／最终伤害上限 and list the calculator's saved loadouts, and the old
// calculator's modules and rule data are deleted. A deleted file is recorded with `deleted: true` (its current
// text is empty; readProtected() in the helpers reads it as '').
const DELETED=['attack-layers.mjs','base-rule-calculator.css','base-rule-calculator.mjs','basic-stat-rules.mjs','battle-entry-data.mjs','bonus-comparison.mjs','calculator-navigation.mjs','character-calculator.js','character-combat-rules.mjs','character-report-loader.mjs','character-template.mjs','combat-modes.mjs','common-skill-catalog.mjs','common-skill-rules.mjs','critical-options.mjs','damage-condition-display.mjs','damage-engine.mjs','damage-import.mjs','damage-recommendations.mjs','effect-rule-learning.mjs','effect-totals.mjs','entry-preparation.mjs','entry-workflow.mjs','eris-rules.mjs','formula-csv-parser.mjs','game-skill-timing.mjs','loadout-preview.mjs','magic-buffs.mjs','mayly-data.mjs','mayly-rules.mjs','panel-calculator.mjs','reader-bonus-decoder.mjs','reader-group-review.mjs','reader-process-evidence.mjs','reader-supplements.mjs','roxy-rules.mjs','runtime-buff-definitions.mjs','runtime-buff-engine.mjs','scenario-bonus-summary.mjs','unified-calculator.mjs'].map(f=>`dist/${f}`);
const allowed=new Set(['dist/damage-calculator.html','dist/damage-calculator.mjs','dist/damage-calculator.css','dist/character-182.html','dist/character-245.html','dist/character-259.html','dist/character-260.html','dist/character-page.mjs','dist/character-damage-bridge.mjs','dist/character.css','dist/character-gear.mjs','dist/battle-report.mjs','dist/character-saved-builds.mjs',...DELETED]);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','fc7ee3c'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected engine-only edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 const deleted=!fs.existsSync(path);
 files[path]={beforeHash:hash(beforeText),afterHash:hash(deleted?'':fs.readFileSync(path,'utf8')),...(deleted?{deleted:true}:{}),beforeText};
}
fs.writeFileSync('docs/engine-only-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'按用户要求删除旧版（网页规则）计算器：伤害计算器只保留游戏脚本结算（招式来自游戏数据，命中段数由用户填写默认10，圣物属性加在最终值上，配装移到原“配装”按钮处并可保存）；角色页删去基础计算器／基础伤害上限／最终伤害上限，已保存配装改为列出计算器保存的配装；旧计算器模块与规则资料一并删除。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} engine-only edits (${Object.values(files).filter(f=>f.deleted).length} deleted).`);
