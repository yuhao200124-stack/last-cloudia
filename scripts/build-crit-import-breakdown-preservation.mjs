import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Adds a 👁 disclosure next to "基础及额外暴击率 %" (only shown when "暴击率基准"
// is "网站加成＋手填基础" and the confirmed report actually carries at least one
// named critRate-type effect): it isolates just those effects out of the
// existing generic reference list (already shown, mixed with every other
// reference effect, under 已采用的属性、上限与特殊效果) so their names, values and
// count are visible right next to the field they are summed into. Reads
// buildDamageImport()'s existing output only -- damage-import.mjs itself is
// unchanged; no calculation, value or condition-gating changes.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-calculator.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','10669ce'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected crit-import-breakdown edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:10e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/crit-import-breakdown-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'“暴击率基准＝网站加成＋手填基础”时，在“基础及额外暴击率 %”旁加一个👁展开区，把已确认报告里逐条命中的暴击率类加成（名称＋数值）单独列出来，与已有的“已采用的属性、上限与特殊效果”整体列表分开展示；只读取 buildDamageImport() 已有的 reference/critAdded，不改 damage-import.mjs、不改任何计算或生效条件。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} crit-import-breakdown edits.`);
