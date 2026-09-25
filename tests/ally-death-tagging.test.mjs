import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/ally-death-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'ally-death');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['友军死亡'];
const numbers=v=>v.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
const mapping={'attack-state':[1212],'attack-buff':[726],'defense-buff':[1015],'magic-buff':[584],'magic-damage-buff':[690],'hp-restore':[493],'sct-stock':[493],'rage-attack':[849],'rage-defense':[849],'rage-magic-disable':[849]};
test('ally death audits all skills and distinguishes actor, resurrection and survival-count conditions',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,7);assert.deepEqual(numbers(view),[493,584,690,726,849,1015,1212]);
 for(const r of all){const a=audit.rows.find(a=>a.id===r.id);assert.equal(a.sourceHash,createHash('sha256').update(JSON.stringify([r.id,r.url,r.name,r.effect,r.notes||''])).digest('hex'));assert.equal(a.decision==='related',view.entries.some(e=>e.id===r.id));}
 for(const [g,ns] of Object.entries(mapping))assert.deepEqual(numbers(labelingView(catalog,'ally-death-'+g)),ns);
 assert.equal(view.childKeys.length,10);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),10);
 for(const n of [183,184,272,431,655,753,770,916,917,939,948,976,1009,1060,1270,1271,1305,1316,1378,1547,1856,1998,2028])assert(!view.entries.some(e=>e.id===source(n).id),source(n).name);
 assert.equal(catalog.entries.length,866);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,866);
});
test('ally death event Buffs, current-state bonus, rage and stock recovery retain different meanings',()=>{
 for(const n of [493,584,690,726,849,1015])assert.deepEqual(detail(n).condition,{mode:'ally-death-trigger',subject:'other-ally',event:'became-incapacitated'});
 assert.deepEqual(detail(1212).condition,{mode:'ally-incapacitated-state',subject:'other-ally',metric:'incapacitated-ally-count',operator:'gte',minimumCount:1});
 const b=detail(1212).bindings[0];assert.equal(b.isBuff,false);assert.equal(b.phase,'current-state');assert.equal(b.valuePercent,20);assert.equal(b.scalesWithAllyCount,false);assert.equal(b.durationSeconds,undefined);
 for(const n of [584,690,726,1015]){const b=detail(n).bindings[0];assert.equal(b.isBuff,true);assert.equal(b.valuePercent,30);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');if([584,690].includes(n))assert.equal(b.durationSeconds,40);else {assert.equal(b.durationStatus,'unconfirmed');assert.equal(b.durationSeconds,undefined);}}
 for(const b of detail(849).bindings){assert.equal(b.isBuff,false);assert.equal(b.statusKind,'abnormal');assert.equal(b.statusId,'rage');assert.equal(b.statusDurationStatus,'unconfirmed');assert.equal(b.valuePercent,undefined);assert.equal(b.stacking,undefined);}
 const stocks=detail(493).bindings.find(b=>b.resource==='SCT');assert.equal(stocks.operation,'restore-stocks');assert.equal(stocks.unit,'skill-stock-count');assert.equal(stocks.amountSource,'incapacitated-ally-stocks');assert.equal(stocks.restoreSeconds,undefined);assert.equal(stocks.maxTriggers,1);assert.equal(stocks.resetScope,'wave');
 assert.equal(detail(493).bindings.find(b=>b.resource==='HP').amountStatus,'unconfirmed');
 for(const e of view.entries)assert(e.tagDetails['友军死亡'].bindings.every(b=>b.target==='self'));
});
test('only ally-death conditions are covered; existing effects accumulate and fully understood skills advance',()=>{
 assert.equal(registry.tagPasses.length,69);assert.equal(catalog.numericEffectInjection,false);
 for(const a of registry.tagPasses.find(p=>p.tag==='友军死亡').assignments){const e=catalog.entries.find(e=>e.id===a.skillId);assert(a.partIds.every(id=>e.parts.find(p=>p.id===id).kind==='condition'));assert(e.tagDetails['友军死亡'].bindings.every(b=>b.partIds.every(id=>!a.partIds.includes(id))));}
 assert.deepEqual(entry(1212).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少',...ADDITIONAL_RACE_TAGS].includes(tag)),['攻击力','友军死亡']);assert.equal(entry(1212).judgment,'ready');assert.deepEqual(entry(1212).remainingConditions,[]);
 assert.deepEqual(entry(849).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少',...ADDITIONAL_RACE_TAGS].includes(tag)),['攻击力','防御力','友军死亡']);assert(!entry(849).remainingEffects.includes('无法使用魔法'));
 for(const n of [493,584,690,726,849,1015])assert.equal(entry(n).judgment,'partial');
 assert.equal(view.counts.ready,1);assert.equal(view.counts.partial,6);assert.equal(catalog.views.all.counts.ready,571);assert.equal(catalog.views.all.counts.partial,295);
 assert.deepEqual(labelingView(catalog,'attack').entries.find(e=>e.id===source(1212).id),entry(1212));
});
function page(edits={}){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=ally-death'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};}
test('ally death page separates effects, deduplicates, switches old categories and rejects stale labels',()=>{
 const {get,click}=page();assert.match(get('#labelCoverage').textContent,/935.*7.*928/);assert.match(get('#judgmentSummary').textContent,/1.*6.*0/);assert.match(get('#labelResultCount').textContent,/7 \/ 7/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,61);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,11);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,10);
 const search=get('#labelSearch');search.value='怒气';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 7/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,3);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','ally-death-attack-state');assert(get('#labelTable').innerHTML.includes('复仇心'));assert(!get('#labelTable').innerHTML.includes('美丽而残酷的世界'));assert(get('#labelTable').innerHTML.includes('judgment-ready'));
 for(const [key,count] of [['revive',6],['mp',32],['ultimate',113],['received-attack',21],['full-hp',6],['low-hp',26],['battle-start',117],['boss',31],['attack',87]]){click('#labelTabs',key);assert.equal(get('#labelResultCount').textContent,`显示 ${count} / ${count} 个技能（去重）`);}
 const rows=skillLabelRows(data,view);assert.equal(rows[0].id,source(1212).id);assert(rows.slice(1).every(r=>r.judgment==='partial'));
 const edits={[`skill:${source(1212).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新友军死亡条件'}};const changed=page(edits);assert.match(changed.get('#labelResultCount').textContent,/8 \/ 8/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);const stale=skillLabelRows(data,view,edits).find(e=>e.id===source(1212).id);assert.equal(stale.judgment,'unknown');assert.deepEqual(stale.conditionBindings,{});
});
