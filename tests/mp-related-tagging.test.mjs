import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/mp-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'mp');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails.MP;
const numbers=v=>v.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
const maxIds=[5,6,7,8,262,412,433,561];
const mapping={'max':maxIds,'restore':[35,154,157,160,161,753,821],'regen':[208],'regen-speed':[173],'cost-fixed':[233],'cost-max-percent':[202,1214,1766],'zero':[389],'drain':[1145],'spell-cost':[185],'ice-spell-cost':[380],'full-attack':[1147],'full-defense':[209],'full-mnd':[209],'low-attack':[787],'low-defense':[1555],'more-physical-reduction':[915],'more-magic-reduction':[1847],'less-magic-reduction':[1449],'threshold-ultimate-reduction':[1145],'cost-physical-reduction':[233],'cost-skill-damage':[202],'cost-skill-cap':[1766],'cost-ultimate-damage':[1214],'cost-ultimate-cap':[1214],'cost-magic-damage':[185],'cost-ice-magic-damage':[380]};

test('MP expands the existing page across the entire library without mixing INT, HP, SCT or ultimate gauges',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,32);
 assert.deepEqual(numbers(view),[5,6,7,8,35,154,157,160,161,173,185,202,208,209,233,262,380,389,412,433,561,753,787,821,915,1145,1147,1214,1449,1555,1766,1847]);
 for(const row of all){const d=audit.rows.find(d=>d.id===row.id);assert.equal(d.sourceHash,createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex'));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 for(const [g,ns] of Object.entries(mapping))assert.deepEqual(numbers(labelingView(catalog,'mp-'+g)),ns,g);
 assert.equal(view.childKeys.length,26);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),41);
 for(const n of [17,18,19,20,29,110,112,119,120,121,164,1858,196,199,217,218,249,460,666,914,1163,1335,1768,1909])assert(!view.entries.some(e=>e.id===source(n).id),source(n).name);
 assert.equal(registry.tagPasses.length,62);assert.equal(registry.tagPasses.filter(p=>p.tag==='MP').length,1);assert.equal(catalog.numericEffectInjection,false);
 assert.equal(catalog.entries.length,838);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,838);
});

test('MP states preserve absolute points, percentages and unknown scaling curves while costs preserve their own bases',()=>{
 for(const n of [787,1555])assert.deepEqual(detail(n).condition,{mode:'mp-threshold',subject:'self',metric:'current-MP-points',operator:'lte',thresholdPoints:20});
 for(const n of [209,1147])assert.deepEqual(detail(n).condition,{mode:'mp-full',subject:'self',metric:'current-MP-percent-of-maximum',operator:'eq',thresholdPercent:100});
 assert.deepEqual(detail(1145).condition,{mode:'mp-threshold',subject:'self',metric:'current-MP-percent-of-maximum',operator:'gte',thresholdPercent:1});
 assert.equal(detail(1145).bindings.find(b=>b.group==='drain').rateStatus,'unconfirmed');assert.match(entry(1145).remainingEffects.join(''),/消耗速率待确认/);
 for(const n of [915,1449,1847]){const c=detail(n).condition;assert.equal(c.mode,'mp-scaling');assert.equal(c.curveStatus,'unconfirmed');assert.equal(c.thresholdPoints,undefined);assert.equal(c.thresholdPercent,undefined);assert.equal(c.direction,n===1449?'lower-MP-stronger':'higher-MP-stronger');assert(detail(n).bindings.every(b=>!b.isBuff));}
 for(const [n,p] of [[202,3],[1214,20],[1766,3]]){const b=detail(n).bindings.find(b=>b.mpRole==='resource-effect');assert.equal(b.operation,'consume-current');assert.equal(b.costBase,'maximum-MP');assert.equal(b.costPercent,p);assert(entry(n).remainingConditions.some(c=>c.includes('MP不足')));}
 assert.equal(detail(233).bindings[0].costPoints,3);assert.equal(detail(233).bindings[0].costBase,'fixed-points');assert.equal(detail(233).bindings[1].multiplier,0.5);
 assert.equal(detail(389).bindings[0].operation,'set-current');assert.equal(detail(389).bindings[0].value,0);assert.equal(detail(389).bindings.length,1);
 assert.equal(detail(185).bindings[0].costAdjustmentPercent,50);assert.equal(detail(380).bindings[0].costAdjustmentPercent,25);assert.equal(detail(380).bindings[0].element,'ice');
 assert.equal(detail(154).bindings[0].amountBase,'damage-dealt');assert.equal(detail(154).bindings[0].amountPercent,2);
 assert.equal(detail(753).bindings[0].amountPoints,30);assert.equal(detail(753).bindings[0].amountBase,'fixed-points');
 for(const n of [157,160,161,821]){assert.equal(detail(n).bindings[0].amountBase,'unconfirmed');assert.match(entry(n).remainingEffects.join(''),/参照基数/);}
 const regen=detail(208).bindings[0];assert.equal(regen.flatPerTick,1);assert.equal(regen.percentOfMaximumPerTick,0.7);assert.equal(regen.intervalSeconds,6);assert.equal(regen.durationSeconds,40);assert.equal(regen.stacking,'highest-active-buff-of-same-type-only');
 assert.equal(detail(173).bindings[0].operation,'increase-regen-speed');assert.equal(detail(173).bindings[0].valuePercent,25);assert.deepEqual(entry(173).remainingEffects,[]);assert.match(entry(173).remainingConditions.join(''),/异常状态/);
});

test('MP covers resource fragments and MP conditions, preserves old MP maxima, and does not complete displayed unrelated benefits',()=>{
 const pass=registry.tagPasses.find(p=>p.tag==='MP');
 for(const a of pass.assignments){const e=catalog.entries.find(e=>e.id===a.skillId),d=e.tagDetails.MP;assert.deepEqual(a.partIds,[...d.coverage.resourcePartIds,...d.coverage.conditionPartIds]);for(const b of d.bindings.filter(b=>b.mpRole!=='resource-effect'))assert(b.partIds.every(id=>!a.partIds.includes(id)));}
 assert.deepEqual(numbers({...view,entries:view.entries.filter(e=>e.judgment==='ready')}),[5,6,7,8,185,262,380,412,433,561,753,787,1147,1555]);
 const before=structuredClone(registry);before.tagPasses=before.tagPasses.filter(p=>p.tag!=='魔法');before.tagPasses.find(p=>p.tag==='MP').assignments=before.tagPasses.find(p=>p.tag==='MP').assignments.filter(a=>maxIds.some(n=>a.skillId===source(n).id));const prior=resolveSkillLabels(before);
 for(const n of [185,787,1147,1555]){assert.equal(prior.find(e=>e.id===source(n).id).judgment,'partial');assert.equal(entry(n).judgment,'ready');}
 assert.equal(entry(209).judgment,'partial');assert(entry(209).remainingEffects.includes('魔抗+20%'));assert.equal(entry(208).judgment,'partial');assert(entry(208).remainingConditions.some(c=>c.includes('Buff')));
 assert.deepEqual(entry(1214).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)),['MP','必杀相关']);assert.deepEqual(entry(233).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)),['MP','受到攻击']);
 for(const n of [202,1766])assert.equal(entry(n).judgment,'partial');assert(!entry(380).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('魔法伤害增加'));
 assert.equal(view.counts.ready,14);assert.equal(view.counts.partial,18);assert.equal(catalog.views.all.counts.ready,510);assert.equal(catalog.views.all.counts.partial,328);
 const ordered=skillLabelRows(data,view);assert(ordered.slice(0,14).every(e=>e.judgment==='ready'));assert(ordered.slice(14).every(e=>e.judgment==='partial'));
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=mp'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});
 return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}
test('expanded MP page keeps one main tab, grouped effects, deduplicated searches, old pages and stale edit review',()=>{
 const {get,click}=page();assert.match(get('#labelCoverage').textContent,/935.*32.*903/);assert.match(get('#judgmentSummary').textContent,/14.*18.*0/);assert.match(get('#labelResultCount').textContent,/32 \/ 32/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,56);assert.equal((get('#labelTabs').innerHTML.match(/data-tag="mp"/g)||[]).length,1);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,27);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,26);
 const search=get('#labelSearch');search.value='万物尽灭';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 32/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,3);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','mp-max');assert.match(get('#labelResultCount').textContent,/8 \/ 8/);assert.match(get('#judgmentSummary').textContent,/8.*0.*0/);
 click('#labelSubTabs','mp-full-defense');assert(get('#labelTable').innerHTML.includes('黄昏'));assert(!get('#labelTable').innerHTML.includes('空无堡垒'));
 click('#labelSubTabs','mp-cost-magic-damage');assert(get('#labelTable').innerHTML.includes('魔导光环'));assert(!get('#labelTable').innerHTML.includes('与帕克的契约'));
 for(const [key,count] of [['ultimate',113],['received-attack',21],['full-hp',6],['low-hp',26],['battle-start',117],['boss',13]]){click('#labelTabs',key);assert.equal(get('#labelResultCount').textContent,`显示 ${count} / ${count} 个技能（去重）`);}
 const edits={[`skill:${source(787).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新MP条件'}};const changed=page(edits);assert.match(changed.get('#labelResultCount').textContent,/33 \/ 33/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 const stale=skillLabelRows(data,view,edits).find(e=>e.id===source(787).id);assert.equal(stale.judgment,'unknown');assert.deepEqual(stale.conditionBindings,{});
});
