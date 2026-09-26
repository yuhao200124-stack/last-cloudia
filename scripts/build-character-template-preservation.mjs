import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='6f847fc2ae8a27842779a30867feebdb5268f5f5';
const allowed=new Set(["dist/account-blessings-panel.mjs", "dist/app.js", "dist/base-rule-calculator.mjs", "dist/bonus-comparison.mjs", "dist/calculator-navigation.mjs", "dist/character-245.html", "dist/character-259.html", "dist/character-260.html", "dist/character-damage-bridge.mjs", "dist/character-report-loader.mjs", "dist/characters.html", "dist/damage-calculator.html", "dist/damage-calculator.mjs", "dist/damage-condition-display.mjs", "dist/effect-rule-engine.mjs", "dist/effect-rule-learning.mjs", "dist/entry-preparation.mjs", "dist/entry-workflow.mjs", "dist/index.html", "dist/loadout-preview.mjs", "dist/reader-bonus-decoder.mjs", "dist/reader-group-review.mjs", "dist/reader-supplements.mjs", "dist/roxy-rules.mjs", "dist/scenario-bonus-summary.mjs", "dist/skill-labeling.html", "dist/unified-calculator.mjs"]);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(['dist/character-page.mjs','dist/character-template.mjs','dist/eris-rules.mjs'].includes(path))continue;
 if(!allowed.has(path))throw Error(`Unexpected character template edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/character-template-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'按用户要求将艾莉丝接入洛琪希的确认、配装和伤害计算模板；统一角色入口和来源收集，保留角色数据与存档，修复指定专武重复增加武器位。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} shared character template edits.`);
