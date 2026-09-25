import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8'),registry=JSON.parse(read('../docs/skill-labeling-registry.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id);
const labels={ice:'冰属性',earth:'树属性',thunder:'雷属性',light:'光属性',dark:'暗属性',neutral:'无属性'},detail=(n,k)=>entry(n).tagDetails[labels[k]],bindings=(n,k)=>detail(n,k).bindings;
const expected={ice:[74,128,135,142,240,244,377,379,380,471,527,535,662,663,698,701,840,842,853,859,1110,1220,1250,1408,1409,1572,1616,1640,1693,1694,1695,1774,1776,1798,1929,1980,1981],earth:[75,129,136,143,244,277,332,349,508,544,563,566,662,663,681,728,765,1079,1085,1190,1367,1381,1506,1572,1640,1778,1829],thunder:[76,130,137,144,244,252,363,391,397,399,639,662,663,672,673,683,721,723,1187,1280,1326,1327,1498,1572,1640,1674,1675,1727,1828,1988],light:[77,131,138,145,227,242,244,292,296,315,415,509,513,625,660,711,755,830,887,956,957,1000,1001,1142,1179,1239,1241,1395,1482,1528,1529,1556,1591,1665,1753,1776,1857,1961,2000],dark:[78,132,139,146,228,234,244,315,323,325,335,341,403,416,457,559,710,752,956,957,1020,1065,1154,1312,1424,1425,1432,1479,1528,1529,1536,1581,1582,1583,1603,1707,1728,1879,1880,1908,1970],neutral:[229,294,329,386,745,906,1514,1726,1837,1910]};
test('six passes independently audit all 935 unique skills and preserve complete elemental scope',()=>{
 for(const[key,label]of Object.entries(labels)){
  const audit=JSON.parse(read(`../docs/${key}-tag-audit.json`)),view=labelingView(catalog,key),ids=view.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
  assert.deepEqual(ids,expected[key]);assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,ids.length);
  for(const r of all){const a=audit.rows.find(x=>x.id===r.id);assert.equal(a.sourceHash,createHash('sha256').update(JSON.stringify([r.id,r.url,r.name,r.effect,r.notes||''])).digest('hex'));assert.equal(a.decision==='related',ids.includes(Number(r.url.split('/').pop())));}
  for(const n of [91,97,148,381,439,691,836,938,1272,1519,1573,1604,1746])assert(!ids.includes(n));
  for(const a of registry.tagPasses.find(p=>p.tag===label).assignments){const e=catalog.entries.find(e=>e.id===a.skillId),d=e.tagDetails[label];assert.deepEqual(a.partIds,[...d.coverage.effectPartIds,...d.coverage.conditionPartIds]);for(const b of d.bindings.filter(b=>b.elementRole==='condition-benefit'))assert(b.partIds.every(id=>!a.partIds.includes(id)));}
 }
 assert.equal(catalog.numericEffectInjection,false);assert.equal(catalog.entries.length,737);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,737);
});
test('multi-element records accumulate tags and synchronize completeness without widening generic damage',()=>{
 for(const n of [662,663,1572,1640]){assert.deepEqual(entry(n).assignedTags.filter(tag=>tag!=='物理'),[...([663,1572].includes(n)?['必杀相关']:[]),'火属性','冰属性','树属性','雷属性']);assert.equal(entry(n).judgment,'ready');assert.deepEqual(entry(n).remainingEffects,[]);assert.equal(labelingView(catalog,'fire').entries.find(e=>e.id===source(n).id).judgment,'ready');}
 for(const n of [956,957,1528,1529]){assert.deepEqual(entry(n).assignedTags.filter(tag=>tag!=='物理'),[...([956,1529].includes(n)?['必杀相关']:[]),'光属性','暗属性']);assert.equal(entry(n).judgment,'ready');}
 assert.deepEqual(entry(315).assignedTags.filter(tag=>tag!=='物理'),['光属性','暗属性']);assert.equal(entry(315).judgment,'ready');
 assert.deepEqual(entry(380).assignedTags.filter(tag=>tag!=='物理'),['MP','冰属性']);assert.equal(entry(380).judgment,'ready');assert.equal(bindings(380,'ice')[0].costAdjustmentPercent,25);
 for(const[n,k,text]of[[842,'ice','魔法'],[711,'light','治疗']]){assert.equal(entry(n).judgment,'partial');assert(entry(n).remainingEffects.some(x=>x.includes(text)));assert.equal(bindings(n,k).length,1);}
 for(const n of [74,128,527,1582])assert(!entry(n).assignedTags.filter(tag=>tag!=='物理').includes('伤害增加'));
 assert.equal(catalog.views.fire.counts.ready,21);assert.equal(catalog.views.critical.counts.ready,34);assert.equal(catalog.views.mp.counts.ready,14);
});
test('walls, resistance and termination use their actual element, target, duration and stacking',()=>{
 for(const[n,k,v]of[[471,'ice',20],[508,'earth',20],[639,'thunder',20],[830,'light',20],[234,'dark',20],[906,'neutral',20],[1482,'light',35],[1988,'thunder',35]]){const b=bindings(n,k)[0];assert.equal(b.target,'all-allies');assert.equal(b.valuePercent,v);assert.equal(b.durationSeconds,40);assert.equal(b.changesResistance,false);assert.equal(b.buffType,`received-${k}-damage-down`);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');}
 for(const[n,k,v]of[[1250,'ice',20],[1381,'earth',35],[1828,'thunder',35],[1395,'light',35],[1312,'dark',35]]){const b=bindings(n,k)[0];assert.equal(b.target,'self');assert.equal(b.valuePercent,v);assert.equal(b.lifetime,'permanent');assert.equal(b.durationSeconds,undefined);}
 for(const[k,wall]of[['ice','thunder-wall'],['earth','flame-wall'],['thunder','stone-wall'],['light','shadow-wall'],['dark','holy-wall']]){const b=bindings(244,k)[0];assert.equal(b.requiredSelectedStatus,wall);assert.equal(b.intervalSeconds,10);assert.equal(b.durationSeconds,30);assert.equal(b.activeByDefault,false);}
 assert.equal(entry(244).judgment,'partial');assert.deepEqual(entry(244).remainingEffects,[]);assert.equal(entry(244).remainingConditions.length,3);
 for(const[n,k]of[[1616,'ice'],[1753,'light'],[1879,'dark']]){const b=bindings(n,k)[0];assert.equal(b.operation,'element-resistance-up');assert.equal(b.resistancePoints,20);assert.equal(b.valuePercent,undefined);assert.equal(b.changesResistance,true);assert.equal(b.target,'self');}
 const end=bindings(859,'ice')[0];assert.equal(end.operation,'end-buff');assert.equal(end.scope.element,undefined);assert.equal(end.scope.triggerElement,'ice');assert.equal(end.endsOn,'hit-by-enemy-ice-attack');assert.equal(entry(859).judgment,'partial');
});
test('weapon attribute, attack attribute and enemy weakness stay separate; cap alternatives never add',()=>{
 for(const b of bindings(1695,'ice')){assert.equal(b.scope.element,'ice');assert.equal(b.scope.equipment.weaponElement,'ice');assert.equal(b.branchOperator,'or');assert.equal(b.minValuePercent,10);assert.equal(b.maxValuePercent,40);assert.equal(b.valuePercent,undefined);}
 assert(entry(1695).remainingConditions.some(x=>x.includes('随机')));assert(!entry(1695).remainingConditions.some(x=>x.includes('特技')));assert.equal(entry(721).judgment,'ready');
 const ref=bindings(1694,'ice')[0];assert.equal(ref.stat,'INT');assert.equal(ref.operation,'stat-reference-up');assert.equal(ref.phase,'damage-calculation');assert.equal(ref.isBuff,false);
 const sword=bindings(1727,'thunder')[0];assert.equal(sword.scope.element,undefined);assert.equal(sword.scope.enemyWeakElement,'thunder');assert.equal(sword.requiresAttackElement,false);assert.equal(sword.capPoints,3000);assert.deepEqual(detail(1727,'thunder').coverage.effectPartIds,[]);
 for(const[n,k]of[[1774,'ice'],[1603,'dark']])for(const b of bindings(n,k)){assert.deepEqual(b.capCases,[{when:{weaponCountIn:[0,1]},capPoints:3000},{otherwise:true,capPoints:1500}]);assert.equal(b.capPoints,undefined);assert.equal(b.branches,'mutually-exclusive');}
 assert.deepEqual(bindings(1110,'ice')[0].capCases,[{when:{weaponCount:1},capPoints:4000},{otherwise:true,capPoints:2000}]);
 const dark=bindings(1707,'dark');assert.equal(dark[0].scope.element,'dark');assert.equal(dark[1].scope.element,undefined);assert.equal(dark[1].scope.equipment.weaponElement,'dark');assert.equal(entry(1707).judgment,'ready');
});
test('real time, wave scaling, party and skill conditions do not default to maximum or become buffs',()=>{
 for(const[n,k,start]of[[227,'light','06:00'],[242,'light','18:00'],[228,'dark','18:00']]){const b=bindings(n,k)[0];assert.equal(b.isBuff,false);assert.equal(b.realTimeWindow.start,start);assert.equal(entry(n).judgment,'partial');}
 for(const[n,k,t]of[[1798,'ice',30],[1981,'ice',90],[1961,'light',90]]){const b=bindings(n,k)[0];assert.equal(b.secondsToMaximum,t);assert.equal(b.maxValuePercent,20);assert.equal(b.resetScope,'wave');assert.equal(b.curveStatus,'unconfirmed');assert.equal(b.valuePercent,undefined);}
 for(const k of ['ice','light']){const b=bindings(1776,k)[0];assert.equal(b.tiersStatus,'unconfirmed');assert.equal(b.maxCount,4);assert.equal(b.valuePercent,undefined);}
 const ensemble=bindings(1000,'light')[0];assert.equal(ensemble.requiredSkillId,source(1000).id);assert.equal(ensemble.countMetric,'allies-with-same-skill');assert.deepEqual(ensemble.tiers.map(t=>t.valuePercent),[10,20,30]);
 const face=bindings(1583,'dark');assert.equal(face[0].scope.attackType,'ultimate');assert.equal(face[0].requiredSkillIds,undefined);assert.equal(face[1].scope.attackType,'unspecified');assert.equal(face[1].requiredSkillIds.length,3);assert.equal(entry(1583).judgment,'partial');
 const aura=bindings(2000,'light')[0];assert.equal(aura.target,'allies-with-faith');assert.equal(aura.providerCondition.type,'god');assert.equal(aura.sameNameStacking,'one-instance-only');assert.equal(entry(2000).judgment,'partial');
 const periodic=bindings(325,'dark')[0];assert.equal(periodic.operation,'deal-periodic-damage');assert.equal(periodic.valuePercent,undefined);assert.equal(periodic.intervalStatus,'unconfirmed');assert.equal(entry(325).judgment,'partial');
});
test('all element tabs render grouped rows, deduplicate searches, sort status and invalidate user-edited descriptions',()=>{
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Do not overwrite stored data');}}});
 for(const k of Object.keys(labels)){
  get('#labelTabs').listeners.click({target:{closest:()=>({dataset:{tag:k}})}});const v=labelingView(catalog,k);
  assert.equal(get('#labelResultCount').textContent,`显示 ${expected[k].length} / ${expected[k].length} 个技能（去重）`);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,v.childKeys.length);
  const ranks=skillLabelRows(data,v).map(r=>({ready:0,partial:1,unknown:2})[r.judgment]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));
 }
 get('#labelTabs').listeners.click({target:{closest:()=>({dataset:{tag:'ice'}})}});get('#labelSearch').value='冰属性超阶驱动';get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 37/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,4);
 const edits={[`skill:${source(662).id}`]:{effect:'未知的新描述'}};for(const k of ['fire','ice','earth','thunder']){const r=skillLabelRows(data,labelingView(catalog,k),edits).find(r=>r.id===source(662).id);assert.equal(r.judgment,'unknown');assert.deepEqual(r.conditionBindings,{});}
});
