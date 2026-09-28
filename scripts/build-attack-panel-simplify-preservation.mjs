import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Two related simplifications on the character-driven entry workflow, both protected-file edits:
// 1. dist/damage-calculator.html: the legacy "基础命中段数（手动填写）" field (#hits) is now hidden — the
//    sandbox result card's own "命中段数" field (#engineHits, unprotected dist/engine-panel.mjs) is the one
//    surface for this value; the two stay synced as before. The (now hidden) label text was updated so if its
//    validation message ever surfaces it points at the sandbox card instead of describing an invisible field.
// 2. dist/entry-workflow.mjs: 具体招式／魔法 becomes one merged, grouped dropdown across all attack
//    categories (普通攻击/特技1-3/超必杀技/魔法), so 攻击方式 no longer needs a separate manual choice —
//    it is derived from whichever move is picked. 伤害分类/伤害参照/攻击属性 are hidden automatically
//    whenever they can be confidently derived from the character page or game data, and stay visible (with
//    their existing "待确认" fallback option) whenever they can't (e.g. no game-data mapping for that
//    character, or a move whose damage type the site itself doesn't pin down) - the ambiguous cases keep
//    requiring the user's own manual choice exactly as before, only the confidently-known ones are hidden.
const allowed=new Set(['dist/damage-calculator.html','dist/entry-workflow.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','e3d5769'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected attack-panel-simplify edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/attack-panel-simplify-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'隐藏旧计算器重复的"基础命中段数（手动填写）"字段（#hits），改用沙盒结果卡片自带的"命中段数"字段（两者仍双向同步）；招式与技能参数区块的"具体招式／魔法"合并为跨攻击方式分组的单一下拉，攻击方式不再单独选择（由所选招式反推），伤害分类／伤害参照／攻击属性在能从角色页面或游戏数据确认时一并隐藏，无法确定时（如未接入游戏数据的角色、站点未标注伤害分类的招式）继续显示手动选择。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} attack-panel-simplify edits.`);
