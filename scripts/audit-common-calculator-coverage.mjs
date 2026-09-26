import fs from 'node:fs';
import {COMMON_SKILL_CATALOG as catalog} from '../dist/common-skill-catalog.mjs';
import {commonSkillRules} from '../dist/common-skill-rules.mjs';
const entries=Object.values(catalog),all=entries.flatMap(e=>commonSkillRules(e));
const common=entries.flatMap(e=>e.rules);
const remaining=entries.map(e=>({id:e.id,name:e.name,url:e.url,text:e.text,rules:commonSkillRules(e).filter(r=>r.review==='pending').map(r=>({part:r.part,text:r.text,note:r.note,effects:r.effects}))})).filter(e=>e.rules.length);
const stats={skills:entries.length,commonReady:common.filter(r=>r.review==='ready').length,commonInformational:common.filter(r=>r.review==='ready'&&r.effects.every(e=>e.type==='utility')).length,commonPending:common.filter(r=>r.review==='pending').length,remainingSkills:remaining.length,remainingRules:all.filter(r=>r.review==='pending').length,maximumRules:all.filter(r=>r.note?.startsWith('最大值试算')).length};
const output=JSON.stringify({policy:'2026-09-26-explicit-maxima',stats,remaining},null,2)+'\n';
const path='docs/common-calculator-coverage-2026-09-26.json';
if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==output)throw Error('Coverage audit is stale');}
else fs.writeFileSync(path,output);
console.log(JSON.stringify(stats));
