import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/ultimate-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'ultimate');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['必杀相关'];
const numbers=v=>v.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
const mapping={'attack-up':[218,425],'magic-up':[249],'defense-up':[425,666,914],'mnd-up':[666],'hp-max':[666],'sct-speed':[666],'sct-restore':[1335],'mp-cost':[1214],'physical-damage':[1021],'ranged-physical-damage':[456],'physical-cap':[1858],'ultimate-damage':[1214,1617],'ultimate-cap':[1214,1617],'ice-ultimate-damage':[1695],'attack-reference':[1955],'physical-reduction':[1163],'magic-reduction':[1909]};

test('ultimate conditions audit all 935 skills and separate complete effect scopes from mere ultimate keywords',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,15);
 assert.deepEqual(numbers(view),[218,249,425,456,666,914,1021,1163,1214,1335,1617,1695,1858,1909,1955]);
 for(const row of all){const d=audit.rows.find(d=>d.id===row.id);assert.equal(d.sourceHash,createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex'));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 for(const [group,ns] of Object.entries(mapping))assert.deepEqual(numbers(labelingView(catalog,'ultimate-'+group)),ns,group);
 assert.equal(view.childKeys.length,17);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),22);
 for(const n of [217,364,369,391,411,460,521,573,624,732,883,948,976,985,1037,1145,1180,1191,1264,1272,1284,1311,1520,1583,1607,1708,1884,1989,2026])assert(!view.entries.some(e=>e.id===source(n).id),source(n).name);
 assert.equal(catalog.entries.length,608);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,608);
});

test('ultimate conditions distinguish full gauges, enemy and self use, single-use buffs, and exact damage and resource effects',()=>{
 for(const n of [218,249,456,914,1163,1909]){const d=detail(n);assert.deepEqual(d.condition,{mode:'ultimate-gauge-full',subject:'self',metric:'current-ultimate-gauge-percent',operator:'eq',thresholdPercent:100});assert(d.bindings.every(b=>!b.isBuff && b.phase==='current-state' && !b.durationSeconds));}
 assert.equal(detail(425).condition.subject,'enemy');assert(detail(425).bindings.every(b=>b.target==='self' && b.durationStatus==='unconfirmed' && !b.durationSeconds));
 assert.equal(detail(666).condition.subject,'self');assert(detail(666).bindings.every(b=>b.isBuff && b.durationSeconds===40 && b.stacking==='highest-active-buff-of-same-type-only'));
 assert.equal(detail(666).bindings.find(b=>b.group==='hp-max').flatValue,1000);assert.equal(detail(666).bindings.find(b=>b.group==='sct-speed').valuePercent,25);
 assert.equal(detail(1021).bindings[0].group,'physical-damage');assert.equal(detail(1021).bindings[0].durationSeconds,40);
 assert.equal(detail(1858).bindings[0].group,'physical-cap');assert.equal(detail(1858).bindings[0].maxTriggersPerWave,1);assert.equal(detail(1858).bindings[0].durationStatus,'unconfirmed');assert(!detail(1858).bindings[0].durationSeconds);
 assert.equal(detail(1214).condition.ultimateKind,'attack');const cost=detail(1214).bindings.find(b=>b.group==='mp-cost');assert.equal(cost.costBase,'maximum-MP');assert.equal(cost.costPercent,20);assert(detail(1214).bindings.every(b=>!b.isBuff && b.phase==='damage-calculation'));
 const cycle=detail(1335).bindings[0];assert.equal(cycle.resource,'SCT');assert.equal(cycle.selection,'random-one-skill');assert.equal(cycle.restoreUses,1);assert.equal(cycle.restoreSeconds,undefined);
 assert.equal(detail(1617).condition.requiresActiveBuff,true);for(const b of detail(1617).bindings){assert.equal(b.activationMode,'next-use-buff');assert.equal(b.uses,1);assert.equal(b.grantIntervalSeconds,20);assert.equal(b.durationSeconds,undefined);}
 for(const n of [1695,1955])assert.equal(detail(n).condition.operator,'or');
 assert.match(entry(1695).remainingConditions.join(''),/冰属性特技.*或/);assert.match(entry(1955).remainingConditions.join(''),/物理攻击.*或/);
 const ice=detail(1695).bindings[0];assert.equal(ice.element,'ice');assert.equal(ice.distributionStatus,'unconfirmed');assert.equal(ice.minPercent,10);assert.equal(ice.maxPercent,40);
 assert.equal(detail(1955).bindings.length,1);assert.equal(detail(1955).bindings[0].referenceStat,'STR');assert.equal(detail(1955).bindings[0].referencePercent,30);assert.match(entry(1955).remainingEffects.join(''),/Boss/);
});

test('ultimate pass completes only covered full-gauge attributes and preserves pending alternatives and other effect tags',()=>{
 assert.equal(registry.tagPasses.length,42);assert.equal(catalog.numericEffectInjection,false);
 const pass=registry.tagPasses.find(p=>p.tag==='必杀相关');for(const a of pass.assignments){const e=catalog.entries.find(e=>e.id===a.skillId);assert(a.partIds.every(id=>e.parts.find(p=>p.id===id).kind==='condition'));}
 const before=structuredClone(registry);before.tagPasses=before.tagPasses.filter(p=>p.tag!=='必杀相关');const prior=resolveSkillLabels(before);
 assert.deepEqual(numbers({...view,entries:view.entries.filter(e=>e.judgment==='ready')}),[218,249,914]);
 for(const [n,tag,key] of [[218,'攻击力','attack'],[249,'魔力','magic'],[914,'防御力','defense']]){assert.equal(prior.find(e=>e.id===source(n).id).judgment,'partial');assert.deepEqual(entry(n).assignedTags,[tag,'必杀相关']);assert.deepEqual(entry(n).remainingConditions,[]);assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));}
 assert.equal(view.counts.ready,3);assert.equal(view.counts.partial,12);assert.equal(catalog.views.all.counts.ready,240);assert.equal(catalog.views.all.counts.partial,368);
 assert.deepEqual(entry(666).assignedTags,['防御力','生命力','必杀相关']);assert.equal(entry(666).remainingEffects.length,2);assert.match(entry(666).remainingEffects.join(''),/魔抗.*SCT/);
 assert.equal(entry(425).judgment,'partial');assert(entry(425).remainingConditions.some(t=>t.includes('持续时间待确认')));
 assert.deepEqual(entry(1695).assignedTags,['必杀相关','冰属性']);assert(!entry(1695).assignedTags.includes('物理伤害增加'));assert(!entry(1695).assignedTags.includes('伤害增加'));
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=ultimate'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});
 return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}
test('ultimate view shows separate effects, synchronized status ordering, deduplicated search and previous views',()=>{
 const {get,click}=page();assert.match(get('#labelCoverage').textContent,/935.*15.*920/);assert.match(get('#judgmentSummary').textContent,/3.*12.*0/);assert.match(get('#labelResultCount').textContent,/15 \/ 15/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,38);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,18);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,17);
 const def=get('#labelTable').innerHTML.split('<section ').find(s=>s.includes('id="section-ultimate-defense-up"'));assert(def.indexOf('护罩之力')<def.indexOf('能量循环'));
 const search=get('#labelSearch');search.value='万圣节派对';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 15/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,4);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','ultimate-ultimate-damage');assert(get('#labelTable').innerHTML.includes('万物尽灭'));assert(get('#labelTable').innerHTML.includes('鸣动之深渊'));assert(!get('#labelTable').innerHTML.includes('冲浪冲击'));assert(!get('#labelTable').innerHTML.includes('我想成为完美的存在'));
 for(const [key,count] of [['received-attack',21],['full-hp',6],['low-hp',26],['battle-start',117],['boss',13]]){click('#labelTabs',key);assert.equal(get('#labelResultCount').textContent,`显示 ${count} / ${count} 个技能（去重）`);}
 const edits={[`skill:${source(218).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新必杀条件'}};const changed=page(edits);assert.match(changed.get('#labelResultCount').textContent,/16 \/ 16/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 const stale=skillLabelRows(data,view,edits).find(e=>e.id===source(218).id);assert.equal(stale.judgment,'unknown');assert.deepEqual(stale.conditionBindings,{});
});
