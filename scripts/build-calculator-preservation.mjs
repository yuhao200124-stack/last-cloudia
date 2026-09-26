import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='bc06cad7e245ede3e777b31e89cc8e7dd3c7d01c';
const sourceFiles=new Set(['app.js','base-rule-calculator.mjs','damage-calculator.html','damage-calculator.mjs','damage-import.mjs','effect-rule-engine.mjs','effect-rule-learning.mjs','entry-preparation.mjs','index.html','loadout-preview.mjs','styles.css']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const ignoreAssetVersions=text=>text.replace(/\?v=[\w.-]+/g,'?v=VERSION');
const files={};
for(const file of execFileSync('git',['diff',baseline,'--name-only','--diff-filter=M','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
 const beforeText=execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8',maxBuffer:5e6});
 const afterText=fs.readFileSync(file,'utf8');
 if(!sourceFiles.has(file.slice(5))&&ignoreAssetVersions(beforeText)!==ignoreAssetVersions(afterText))throw Error(`Unexpected non-cache edit: ${file}`);
 files[file]={kind:sourceFiles.has(file.slice(5))?'requested-source-edit':'cache-only',beforeHash:hash(beforeText),afterHash:hash(afterText),beforeText};
}
fs.writeFileSync('docs/calculator-integration-preservation-2026-09-26.json',JSON.stringify({baseline,reason:'用户明确要求恢复普通列表，并更新通用技能计算读取。旧分类轮次的原始保护基线保留，通过精确前后哈希记录本次授权变更。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} exact authorized changes; classification data unchanged.`);
