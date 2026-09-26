import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='b8b1e48bc327e47fe12becb3e7348a57e5abe151';
const allowed=new Set(["dist/account-blessings-panel.mjs", "dist/app.js", "dist/base-rule-calculator.mjs", "dist/bonus-comparison.mjs", "dist/calculator-navigation.mjs", "dist/character-245.html", "dist/character-259.html", "dist/character-260.html", "dist/character-calculator.js", "dist/character-damage-bridge.mjs", "dist/character-page.mjs", "dist/character-report-loader.mjs", "dist/character-template.mjs", "dist/characters.html", "dist/damage-calculator.html", "dist/damage-calculator.mjs", "dist/damage-condition-display.mjs", "dist/damage-import.mjs", "dist/effect-rule-engine.mjs", "dist/effect-rule-learning.mjs", "dist/entry-preparation.mjs", "dist/entry-workflow.mjs", "dist/index.html", "dist/loadout-preview.mjs", "dist/magic-buffs.mjs", "dist/reader-bonus-decoder.mjs", "dist/reader-group-review.mjs", "dist/reader-supplements.mjs", "dist/roxy-rules.mjs", "dist/skill-labeling.html", "dist/unified-calculator.mjs"]);
const hash=text=>createHash('sha256').update(text).digest('hex');
const files={};
for(const path of execFileSync('git',['diff',baseline,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 if(['dist/character-182.html','dist/mayly-data.mjs','dist/mayly-rules.mjs'].includes(path))continue;
 if(!allowed.has(path))throw Error(`Unexpected Mayly template edit: ${path}`);
 const beforeText=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:10e6});
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/mayly-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'按用户指定Altema182新增魔神梅莉，共用现有角色模板；接入声明式光暗转换、装备属性、独立出血条件及辅助魔法耐性。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} shared character template edits.`);
