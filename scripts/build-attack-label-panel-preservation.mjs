import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// dist/damage-calculator.mjs: the "当前战斗攻击力"/"当前战斗法强" attack-input label (#attackLabel) is
// renamed to "当前面板攻击力"/"当前面板法强" to match this section's own "面板" terminology (the
// #attackBasis control already calls its no-runtime-buff option "面板"), and because the value this field
// actually takes (workflow.panelsPreview()) is the panel-stat computation, not an in-battle value. The
// mixed-reference-mode label ("已确认的混合结算攻击值") is left untouched pending a separate follow-up on
// how to compute/display a physical:magic contribution ratio for genuinely mixed-type moves.
const allowed=new Set(['dist/damage-calculator.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','e617098'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected attack-label-panel edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/attack-label-panel-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'把攻击输入框的标签"当前战斗攻击力"／"当前战斗法强"改成"当前面板攻击力"／"当前面板法强"，与本区"计算方式"下拉里"面板"这个说法统一（该字段取的数值本来就是面板计算结果，不是战斗中的实时值）；混合参照（"已确认的混合结算攻击值"）暂不改动，待后续确认物理/魔力比例如何计算再处理。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} attack-label-panel edits.`);
