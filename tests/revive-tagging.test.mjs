import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/revive-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'revive');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['复活'];
const numbers=v=>v.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
const mapping={'self':[183,431],'attack-up':[272],'magic-up':[272],'critical-rate':[272],'physical-damage':[1060],'magic-damage':[1060],'sct-self':[1998],'mp-ally':[753],'sct-ally':[753]};

test('revival audits the full library and distinguishes resurrection from surviving lethal damage, healing and death triggers',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,6);assert.deepEqual(numbers(view),[183,272,431,753,1060,1998]);
 for(const row of all){const d=audit.rows.find(d=>d.id===row.id);assert.equal(d.sourceHash,createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex'));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 for(const [g,ns] of Object.entries(mapping))assert.deepEqual(numbers(labelingView(catalog,'revive-'+g)),ns,g);
 assert.equal(view.childKeys.length,9);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),10);
 for(const n of [110,113,118,184,195,219,389,493,584,690,726,849,890,916,917,939,948,976,1009,1015,1022,1092,1212,1270,1271,1305,1316,1378])assert(!view.entries.some(e=>e.id===source(n).id),source(n).name);
 assert.equal(catalog.entries.length,776);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,776);
});

test('revival preserves initial HP, Wave versus quest limits, recipient identity, Buff lifetime and distinct SCT units',()=>{
 for(const [n,event,hp,scope] of [[183,'self-incapacitated',10,'wave'],[431,'battle-start',50,'quest']]){const d=detail(n),b=d.bindings[0];assert.equal(d.condition.mode,'self-revival');assert.equal(d.condition.event,event);assert.equal(d.condition.requiresIncapacitated,true);assert.equal(b.operation,'revive-self');assert.equal(b.initialHpPercent,hp);assert.equal(b.hpBase,'maximum-HP');assert.equal(b.resetScope,scope);assert.equal(b.maxTriggers,1);assert.equal(b.isBuff,false);}
 for(const n of [272,1060,1998]){assert.equal(detail(n).condition.mode,'after-self-revival');assert.equal(detail(n).condition.event,'revived');assert.deepEqual(detail(n).coverage.revivalPartIds,[]);assert(detail(n).bindings.every(b=>!b.operation));}
 const ally=detail(753);assert.deepEqual(ally.condition,{mode:'after-ally-revival',actor:'self',revivedTarget:'ally',event:'ally-revived',method:'own-active-skill'});assert(ally.bindings.every(b=>b.target==='self' && b.phase==='after-ally-revival' && !b.isBuff));assert.equal(ally.bindings[0].amountPoints,30);assert.equal(ally.bindings[1].restoreSeconds,15);
 const seed=detail(1998).bindings[0];assert.equal(seed.selection,'random-one-skill');assert.equal(seed.restoreUses,1);assert.equal(seed.restoreSeconds,undefined);assert.equal(seed.maxTriggersPerWave,1);
 for(const n of [272,1060])for(const b of detail(n).bindings){assert.equal(b.isBuff,true);assert.equal(b.phase,'after-revival');assert.equal(b.durationSeconds,40);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');}
 assert.deepEqual(detail(272).bindings.map(b=>b.valuePercent),[30,30,15]);assert.deepEqual(detail(1060).bindings.map(b=>b.valuePercent),[20,20]);
 assert.deepEqual(entry(431).tagDetails['战斗开始'].bindings,[{group:'revive',partIds:['opening-effect-1'],summary:'开场处于倒地状态时，以50%HP复活'}]);
});

test('revival operations and conditions accumulate without completing other effects or use-limit mechanisms',()=>{
 assert.equal(registry.tagPasses.length,46);assert.equal(catalog.numericEffectInjection,false);
 const pass=registry.tagPasses.find(p=>p.tag==='复活');for(const a of pass.assignments){const e=catalog.entries.find(e=>e.id===a.skillId),d=e.tagDetails['复活'];assert.deepEqual(a.partIds,[...d.coverage.revivalPartIds,...d.coverage.conditionPartIds]);assert.equal(e.judgment,[753,1998].some(n=>e.id===source(n).id)?'ready':'partial');for(const b of d.bindings.filter(b=>b.revivalRole==='post-revival-benefit'))assert(b.partIds.every(id=>!a.partIds.includes(id)));}
 assert.deepEqual(entry(272).assignedTags.filter(tag=>!['物理','魔法','鸟'].includes(tag)),['攻击力','魔力','复活','暴击']);assert.deepEqual(entry(1060).assignedTags.filter(tag=>!['物理','魔法','鸟'].includes(tag)),['物理伤害增加','魔法伤害增加','复活']);assert.deepEqual(entry(753).assignedTags.filter(tag=>!['物理','魔法','鸟'].includes(tag)),['MP','复活','特技相关']);assert.deepEqual(entry(431).assignedTags.filter(tag=>!['物理','魔法','鸟'].includes(tag)),['战斗开始','复活']);
 assert.deepEqual(entry(272).remainingEffects,[]);assert(entry(1060).remainingConditions.some(c=>c.includes('40秒')));assert.deepEqual(entry(753).remainingEffects,[]);assert.deepEqual(entry(753).remainingConditions,[]);assert.deepEqual(entry(1998).remainingConditions,[]);
 for(const n of [183,431])assert(entry(n).remainingConditions.some(c=>c.includes('最多')));
 assert.equal(view.counts.ready,2);assert.equal(view.counts.partial,4);assert.equal(catalog.views.all.counts.ready,370);assert.equal(catalog.views.all.counts.partial,406);
 assert.deepEqual(labelingView(catalog,'attack').entries.find(e=>e.id===source(272).id),entry(272));assert.deepEqual(labelingView(catalog,'mp').entries.find(e=>e.id===source(753).id),entry(753));
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=revive'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});
 return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}
test('revival page separates self and ally benefits, deduplicates grouped searches and preserves prior views and stale edit review',()=>{
 const {get,click}=page();assert.match(get('#labelCoverage').textContent,/935.*6.*929/);assert.match(get('#judgmentSummary').textContent,/2.*4.*0/);assert.match(get('#labelResultCount').textContent,/6 \/ 6/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,40);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,10);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,9);
 const search=get('#labelSearch');search.value='黄泉之理';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 6/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,3);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','revive-sct-ally');assert(get('#labelTable').innerHTML.includes('守护至今的约定'));assert(!get('#labelTable').innerHTML.includes('再起之种'));
 click('#labelSubTabs','revive-self');assert(get('#labelTable').innerHTML.includes('诱饵'));assert(get('#labelTable').innerHTML.includes('转生'));assert(!get('#labelTable').innerHTML.includes('黄泉之理'));
 for(const [key,count] of [['mp',32],['ultimate',113],['received-attack',21],['full-hp',6],['low-hp',26],['battle-start',117],['boss',13]]){click('#labelTabs',key);assert.equal(get('#labelResultCount').textContent,`显示 ${count} / ${count} 个技能（去重）`);}
 const edits={[`skill:${source(272).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新复活条件'}};const changed=page(edits);assert.match(changed.get('#labelResultCount').textContent,/7 \/ 7/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);const stale=skillLabelRows(data,view,edits).find(e=>e.id===source(272).id);assert.equal(stale.judgment,'unknown');assert.deepEqual(stale.conditionBindings,{});
});
