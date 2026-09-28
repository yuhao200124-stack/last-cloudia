import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Reference-only "面板计算明细" disclosure next to the attack/panel input in the generic
// calculator. It never changes what fills #attack (panelsPreview() is untouched) -- it only
// exposes, via a new entry-workflow.mjs panelBreakdown() alongside the existing panelsPreview(),
// the same per-stat steps/beforeBuff/value/issues that calculateWebsitePanel() already computed,
// so the user can see the pre-buff baseline and which named real-time buff (e.g. 常驻 EX 灵气)
// got added on top, without changing the number itself or any damage calculation.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-calculator.html','dist/entry-workflow.mjs']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','8b20b11'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected panel-breakdown edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/panel-breakdown-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'新增“面板计算明细”展开区（damage-calculator.html 里 #attack 输入框旁的 👁 details），点开后展示 calculateWebsitePanel() 已经算出来的每项 steps（基准值→实时属性层加成→最终值）与 issues，帮助核对“当前面板法强/攻击力”里是否叠加了常驻EX灵气一类局内才生效的实时BUFF。entry-workflow.mjs 新增 panelBreakdown()（与既有 panelsPreview() 并列暴露），只读出 websitePanel().stats，不改变 panelsPreview() 本身的取值逻辑，也不影响任何伤害计算。damage-calculator.mjs 新增 renderAttackBreakdown()，在 fillReaderPreview() 里按当前参照（str/int）取用对应的 stat 明细渲染到该 details 里；mixed 参照或没有游戏数据时该区域保持隐藏。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} panel-breakdown edits.`);
