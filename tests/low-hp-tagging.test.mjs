import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
import {renderLabelTable} from '../dist/skill-labeling.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));
const audit=JSON.parse(read('../docs/low-hp-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'low-hp');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`));
const entry=n=>catalog.entries.find(e=>e.id===source(n).id);
const detail=n=>entry(n).tagDetails['濒死'];
const groups=n=>detail(n).bindings.map(b=>b.group);
const numbers=key=>labelingView(catalog,key).entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);

test('low HP audits every canonical skill, including explicit 25% HP and untagged allies or enemy targets',()=>{
 assert.equal(all.length,935);assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.matchedUnique,26);assert.equal(audit.rows.filter(r=>r.decision==='related').length,26);
 assert.deepEqual(numbers('low-hp'),[113,114,115,116,117,118,219,267,507,523,552,615,682,788,890,1022,1143,1153,1164,1204,1264,1349,1390,1427,1446,1744]);
 for(const row of all){const d=audit.rows.find(d=>d.id===row.id);assert.equal(d.sourceHash,createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex'));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 assert.equal(view.entries.filter(e=>e.assignedTags.length===1).length,14);
 assert(view.entries.filter(e=>e.assignedTags.length===1).every(e=>e.assignedTags[0]==='濒死'));
 assert.equal(catalog.entries.length,393);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,393);
 assert.equal(catalog.views.all.counts.ready,75);assert.equal(catalog.views.all.counts.partial,318);
 assert.equal(catalog.numericEffectInjection,false);
});

test('low HP groups bind each actual effect and share identities without multiplying skill counts',()=>{
 assert.deepEqual(numbers('low-hp-attack-up'),[113,118,267,552]);
 assert.deepEqual(numbers('low-hp-defense-up'),[114,118,507,788,890,1390]);
 assert.deepEqual(numbers('low-hp-magic-up'),[115,890,1143,1164]);
 assert.deepEqual(numbers('low-hp-mnd-up'),[116,118,890,1390]);
 assert.equal(view.childKeys.length,19);assert.equal(view.childKeys.reduce((sum,k)=>sum+catalog.views[k].counts.relatedUnique,0),41);
 assert.equal(new Set(view.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id))).size,26);
 for(const key of ['attack-up','defense-up','mnd-up','speed-up','hp-heal'])assert.strictEqual(labelingView(catalog,'low-hp-'+key).entries.find(e=>e.id===source(118).id),entry(118));
 assert.deepEqual(groups(1390),['defense-up','mnd-up']);assert(entry(1390).remainingEffects.includes('特技伤害+10%'));
 assert.deepEqual(groups(1446),['incoming-healing']);assert(entry(1446).remainingEffects.some(t=>t.includes('常驻')));
 assert.deepEqual(groups(1022),['hp-heal']);assert(entry(1022).remainingEffects.some(t=>t.includes('魔法生物')));
 assert(!labelingView(catalog,'hp').entries.some(e=>e.id===source(1022).id));
 assert.deepEqual(numbers('low-hp-skill-damage'),[1349,1427]);
 assert.deepEqual(groups(1264),['ultimate-damage','ultimate-cap']); // Name contains crit; the effect does not.
});

test('HP scaling retains its missing curve and stays distinct from a completed threshold condition',()=>{
 for(const n of [267,788,1164,1390]){
  const d=detail(n);assert.equal(d.condition.mode,'hp-scaling');assert.equal(d.condition.direction,'lower-hp-stronger');
  assert.equal(d.condition.thresholdPercent,undefined);assert.equal(d.condition.curveStatus,'unconfirmed');
  assert(d.bindings.every(b=>b.isBuff===false && b.durationSeconds===undefined));
  assert.equal(entry(n).judgment,'partial');assert(entry(n).remainingConditions.some(t=>/曲线|公式/.test(t)),entry(n).name);
  assert.match(d.calculationNote,/不代表只有HP≤30%.*不能直接使用最高值/);
 }
 const completed=[113,114,115,507,552,1143];
 assert.deepEqual(view.entries.filter(e=>e.judgment==='ready').map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),completed);
 const before=structuredClone(registry);before.tagPasses=before.tagPasses.filter(p=>p.tag!=='濒死');const beforeEntries=resolveSkillLabels(before);
 for(const n of completed){assert.equal(beforeEntries.find(e=>e.id===source(n).id).judgment,'partial');assert.deepEqual(entry(n).remainingConditions,[]);assert.equal(detail(n).condition.mode,'threshold-state');}
 assert.deepEqual(entry(113).assignedTags,['攻击力','濒死']);assert.deepEqual(entry(115).assignedTags,['魔力','濒死']);
 for(const a of registry.tagPasses.find(p=>p.tag==='濒死').assignments){const e=entry(Number(catalog.entries.find(e=>e.id===a.skillId).url.split('/').pop()));assert(a.partIds.every(id=>e.parts.find(p=>p.id===id).kind==='condition'));}
});

test('own low HP, enemy low HP, healed ally low HP, single-weapon limits and lethal damage are not interchangeable',()=>{
 assert.equal(detail(1264).condition.thresholdPercent,25);assert.equal(detail(1264).condition.subject,'self');
 for(const n of [113,114,115,116,117,118,219,507,523,552,615,890,1022,1143,1153,1349,1427,1446]){assert.equal(detail(n).condition.subject,'self');assert.equal(detail(n).condition.thresholdPercent,30);}
 for(const n of [1204,1744])assert.equal(detail(n).condition.subject,'target-enemy');
 assert.equal(detail(682).condition.subject,'healing-target-ally');
 assert.deepEqual(groups(1204),['enemy-skill-damage']);assert.deepEqual(groups(1744),['enemy-physical-damage','enemy-physical-cap']);
 assert.deepEqual(groups(682),['heal-low-hp-ally']);assert.deepEqual(groups(1153),['incoming-healing']);
 assert(entry(1744).remainingConditions.includes('仅装备一把武器'));
 assert.equal(detail(1427).bindings.find(b=>b.group==='skill-cap').singleWeaponCapReplacesBase,true);
 assert(entry(1427).remainingConditions.some(t=>t.includes('不与原+15,000相加')));
 for(const n of [119,120,121,183,184,237,346,389,493,499,843,1257,1271,1448,1548,1816,1839,1873,1914])assert(!view.entries.some(e=>e.id===source(n).id),source(n).name);
 assert.equal(entry(615).judgment,'partial');assert(entry(615).remainingEffects.some(t=>t.includes('具体提升量待确认')));
 assert.equal(detail(117).bindings[0].isBuff,false);assert.match(detail(117).bindings[0].summary,/移动速度\+2/);
});

test('awakening buffs keep their duration after HP recovery, while instant heals and HP-dependent attributes have no timer',()=>{
 for(const n of [118,890]){
  assert.equal(detail(n).condition.mode,'threshold-trigger');
  for(const b of detail(n).bindings){if(b.group==='hp-heal'){assert.equal(b.isBuff,false);assert.equal(b.durationSeconds,undefined);}else{assert.equal(b.isBuff,true);assert.equal(b.durationSeconds,40);assert.equal(b.persistsAfterHpRecovery,true);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');}}
  assert(entry(n).remainingConditions.includes('每个Wave最多触发1次'));
 }
 for(const b of detail(219).bindings){assert.equal(b.durationSeconds,b.group==='hp-regen'?30:40);assert.equal(b.persistsAfterHpRecovery,true);}
 assert.equal(detail(1022).bindings[0].durationSeconds,undefined);assert.equal(detail(1022).bindings[0].isBuff,false);
 for(const n of [113,114,115,267,507,552,788,1143,1164,1264,1349,1390,1427,1744])assert(detail(n).bindings.every(b=>!b.isBuff && b.durationSeconds===undefined));
 assert.equal(view.counts.ready,6);assert.equal(view.counts.partial,20);
});

function page(edits={}){
 const elements=new Map(),get=key=>{if(!elements.has(key))elements.set(key,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.listeners[k]=v;},focus(){}});return elements.get(key);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=low-hp'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Must preserve saved state.');}}});
 const click=(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}});
 return {get,click};
}

test('low HP page separates effect tables, keeps status ordering and search, and switches cleanly to opening and Boss views',()=>{
 const {get,click}=page();
 assert.match(get('#labelCoverage').textContent,/935.*26.*909/);assert.match(get('#judgmentSummary').textContent,/6.*20.*0/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,15);
 assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,20);
 assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,19);
 assert.match(get('#labelResultCount').textContent,/26 \/ 26/);
 const sections=get('#labelTable').innerHTML.split('<section ').slice(1);
 const attack=sections.find(s=>s.includes('id="section-low-hp-attack-up"'));
 const magic=sections.find(s=>s.includes('id="section-low-hp-magic-up"'));
 assert(attack.includes('生命鼓舞'));assert(!attack.includes('生命光环'));assert(magic.includes('生命光环'));assert(!magic.includes('生命鼓舞'));
 for(const s of sections){const rank={ready:0,partial:1,unknown:2},states=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>m[1]);assert(states.every((s,i)=>!i||rank[states[i-1]]<=rank[s]));}
 const search=get('#labelSearch');search.value='秘传斗法';search.listeners.input();
 assert.match(get('#labelResultCount').textContent,/1 \/ 26/);assert.equal((get('#labelTable').innerHTML.match(/data-skill-id=/g)||[]).length,2);
 assert(!get('#labelTable').innerHTML.includes('id="section-low-hp-skill-damage"'));
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','low-hp-attack-up');
 assert.match(get('#activeTagTitle').textContent,/濒死.*攻击力/);assert.match(get('#labelResultCount').textContent,/4 \/ 4/);assert(get('#labelTable').innerHTML.includes('本组濒死效果'));
 click('#labelTabs','battle-start');assert.match(get('#labelResultCount').textContent,/117 \/ 117/);assert(get('#conditionScope').textContent.includes('永久'));assert(!get('#labelTable').innerHTML.includes('生命鼓舞'));
 click('#labelTabs','boss');assert.match(get('#labelResultCount').textContent,/13 \/ 13/);
 click('#labelTabs','low-hp');assert.match(get('#labelResultCount').textContent,/26 \/ 26/);assert(get('#conditionScope').textContent.includes('25%'));
 const edits={[`skill:${source(113).id}`]:{effect:'未知新效果'},[`skill:${source(9).id}`]:{effect:'新的濒死效果'}};
 const changed=page(edits);assert.match(changed.get('#labelResultCount').textContent,/27 \/ 27/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 const changedRow=skillLabelRows(data,view,edits).find(r=>r.id===source(113).id);assert.deepEqual(changedRow.conditionBindings,{});assert.equal(changedRow.judgment,'unknown');
 const row=skillLabelRows(data,view).find(r=>r.id===source(113).id);
 const escaped=renderLabelTable([{...row,conditionBindings:{濒死:[{group:'attack-up',summary:'<img onerror=bad>'}]}}],'attack-up','濒死');assert(!escaped.includes('<img'));
});
