import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Character pages switch to the game's own skill names and descriptions (PassiveSkillMst / SkillMst,
// read out by the out-of-battle reader), written by scripts/sync-character-game-text.mjs from each
// row's data-game-id. The calculator's hand-checked rule catalogs keep matching the earlier wording
// (data-rule-text), so every evaluated rule, status and value stays the same; the catalogs, the
// legacy character-page calculators and the reader decoder only take the new names. The loadout keeps
// binding existing characters' skills exactly as before (game-skill-names.js); version tags bumped
// for every changed module. The main skill table's own names are left as they are.
const allowed=new Set(["dist/account-blessings-panel.mjs","dist/app.js","dist/base-rule-calculator.mjs","dist/bonus-comparison.mjs","dist/character-182.html","dist/character-245.html","dist/character-259.html","dist/character-260.html","dist/character-calculator.js","dist/character-damage-bridge.mjs","dist/character-page.mjs","dist/character-report-loader.mjs","dist/character-template.mjs","dist/common-skill-rules.mjs","dist/damage-calculator.html","dist/damage-calculator.mjs","dist/effect-rule-engine.mjs","dist/effect-rule-learning.mjs","dist/entry-preparation.mjs","dist/entry-workflow.mjs","dist/eris-rules.mjs","dist/game-skill-data.js","dist/game-skill-names.js","dist/game-skill-names.mjs","dist/game-skills.html","dist/index.html","dist/loadout-preview.mjs","dist/magic-buffs.mjs","dist/mayly-data.mjs","dist/mayly-rules.mjs","dist/reader-bonus-decoder.mjs","dist/reader-group-review.mjs","dist/reader-supplements.mjs","dist/roxy-rules.mjs","dist/unified-calculator.mjs"]);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','49fe568'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected game-names edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/game-names-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'角色页的技能、魔法、特技与专属装备名称和说明改为游戏数据原文（按每行 data-game-id 由 scripts/sync-character-game-text.mjs 生成，“?”与神装强化数值按读取器解析值补上）；计算器规则仍按原有措辞（data-rule-text）匹配，所有规则、判定与数值不变，只把名称改为游戏名；旧版角色页计算器与读取器来源名同步改名；配装对已有角色的技能绑定保持原样；各改动模块版本号统一更新。主技能表名称不改。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} game-names edits.`);
