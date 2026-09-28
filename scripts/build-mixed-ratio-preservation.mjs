import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Real "mixed" (物理+魔法) moves in the game database are multi-part skills where some parts
// are physical-kind and others magical-kind (e.g. a 4-hit ultimate, 3 physical + 1 magic) --
// never a single hit split across both stats. dist/game-data.mjs's gameMoveParameters() now
// detects that case across ALL of a move's coefficient-carrying parts (previously it only ever
// looked at the first one) and reports a reference physical/magic ratio, reduced to a small
// integer ratio from each side's share of total per-part damage weight (coef × statPercent).
// dist/damage-calculator.mjs's mixed-reference note (#mixedReferenceNote) now appends that
// ratio when the game database has it for the selected move; it is display-only guidance for
// the user's own manually confirmed mixed-settlement value and is never applied automatically
// to any calculation. None of the 4 characters currently mapped to game data (182/245/259/260)
// have a real mixed-kind move, so this was verified against real mixed moves elsewhere in the
// game database (spliced into a mapped character's data for an end-to-end browser check) plus
// a direct unit check of the ratio math; no currently reachable character exercises this path
// yet, so behavior for every existing move is unchanged (mixedRatio stays null).
const allowed=new Set(['dist/damage-calculator.mjs','dist/game-data.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','8baf788'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected mixed-ratio edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/mixed-ratio-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'gameMoveParameters() 现在会检查招式所有带系数的段，若同时存在物理段和魔法段（比如某个大招4段里3段物理+1段魔法）才判定为真正的"混合"，并按各自段伤害权重（系数×攻击修正）算出四舍五入后的物理/魔力参考比例（如 3/7）；混合结算区的说明文字（#mixedReferenceNote）在能读到这个比例时会附带显示，仅作参考，不会自动代入任何计算，用户仍需手填已确认的混合结算攻击值。目前站上接入游戏数据库的4个角色都没有真正的混合招式，所有现有招式的行为不变（mixedRatio 仍是 null）。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} mixed-ratio edits.`);
