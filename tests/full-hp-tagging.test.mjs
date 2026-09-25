import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/full-hp-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'full-hp');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id);
const mapping=[[119,'attack-up'],[120,'magic-up'],[121,'speed-up'],[237,'critical-rate'],[843,'skill-damage'],[1448,'skill-cap']];

test('full HP audits the whole library and separates six actual effects from full gauges and maximum HP modifiers',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(e=>e.id)).size,935);assert.equal(audit.matchedUnique,6);
 assert.deepEqual(view.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),mapping.map(([n])=>n));
 for(const row of all){const d=audit.rows.find(d=>d.id===row.id);assert.equal(d.sourceHash,createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex'));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 for(const [n,group] of mapping){const groupView=labelingView(catalog,'full-hp-'+group);assert.deepEqual(groupView.entries.map(e=>e.id),[source(n).id]);assert.equal(groupView.parent,'full-hp');}
 for(const n of [218,249,456,914,1163,1909,353,402,666,867,1221,1768,113,1264,267,788,1164,1390,1779])assert(!view.entries.some(e=>e.id===source(n).id),source(n).name);
 assert.equal(view.childKeys.length,6);assert.equal(view.childKeys.reduce((sum,k)=>sum+catalog.views[k].counts.relatedUnique,0),6);
 assert.equal(catalog.entries.length,608);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,608);
});

test('full HP is equality with current maximum HP, not a persistent Buff, and completes only covered effects',()=>{
 for(const [n] of mapping){const d=entry(n).tagDetails['满HP'];assert.deepEqual(d.condition,{mode:'full-hp-state',subject:'self',metric:'current-hp-percent-of-max',operator:'eq',thresholdPercent:100});assert(d.bindings.every(b=>b.isBuff===false && b.durationSeconds===undefined && b.persistsAfterHpRecovery===undefined));assert.match(d.calculationNote,/少于最大HP时不生效.*恢复到满HP后重新满足条件/);}
 assert.deepEqual(entry(119).assignedTags,['攻击力','满HP']);assert.deepEqual(entry(120).assignedTags,['魔力','满HP']);
 assert.deepEqual(view.entries.filter(e=>e.judgment==='ready').map(e=>e.name),['磊落','月光','锐气']);
 assert.equal(view.counts.ready,3);assert.equal(view.counts.partial,3);
 const previous=structuredClone(registry);previous.tagPasses=previous.tagPasses.filter(p=>p.tag!=='满HP');const before=resolveSkillLabels(previous);
 for(const n of [119,120,237]){assert.equal(before.find(e=>e.id===source(n).id).judgment,'partial');assert.deepEqual(entry(n).remainingConditions,[]);}
 for(const n of [121,843,1448]){assert.deepEqual(entry(n).assignedTags,['满HP']);assert.equal(entry(n).judgment,'partial');assert.equal(entry(n).remainingEffects.length,1);}
 assert.match(entry(121).remainingEffects[0],/具体提升量待确认/);assert.deepEqual(entry(237).remainingEffects,[]);assert.deepEqual(entry(237).assignedTags,['满HP','暴击']);assert.match(entry(1448).remainingEffects[0],/上限\+1,500/);
 const pass=registry.tagPasses.find(p=>p.tag==='满HP');for(const a of pass.assignments){const e=catalog.entries.find(e=>e.id===a.skillId);assert(a.partIds.every(id=>e.parts.find(p=>p.id===id).kind==='condition'));}
 assert.equal(catalog.views.all.counts.ready,240);assert.equal(catalog.views.all.counts.partial,368);assert.equal(catalog.numericEffectInjection,false);
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=full-hp'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});
 return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}

test('full HP opens as grouped tables with synchronized status, search, preserved prior tabs and stale edit handling',()=>{
 const {get,click}=page();
 assert.match(get('#labelCoverage').textContent,/935.*6.*929/);assert.match(get('#judgmentSummary').textContent,/3.*3.*0/);assert.match(get('#labelResultCount').textContent,/6 \/ 6/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,38);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,7);
 assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,6);
 for(const [n,g] of mapping){const section=get('#labelTable').innerHTML.split('<section ').find(s=>s.includes(`id="section-full-hp-${g}"`));assert(section.includes(source(n).name));assert.equal((section.match(/data-skill-id=/g)||[]).length,1);}
 const search=get('#labelSearch');search.value='云耀';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 6/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,1);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','full-hp-critical-rate');assert.match(get('#activeTagTitle').textContent,/满HP.*暴击率/);assert(get('#labelTable').innerHTML.includes('锐气'));assert(!get('#labelTable').innerHTML.includes('磊落'));
 click('#labelTabs','low-hp');assert.match(get('#labelResultCount').textContent,/26 \/ 26/);click('#labelTabs','battle-start');assert.match(get('#labelResultCount').textContent,/117 \/ 117/);click('#labelTabs','boss');assert.match(get('#labelResultCount').textContent,/13 \/ 13/);
 const edits={[`skill:${source(119).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新满HP效果'}};const changed=page(edits);
 assert.match(changed.get('#labelResultCount').textContent,/7 \/ 7/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 const changedRow=skillLabelRows(data,view,edits).find(e=>e.id===source(119).id);assert.equal(changedRow.judgment,'unknown');assert.deepEqual(changedRow.conditionBindings,{});
});
