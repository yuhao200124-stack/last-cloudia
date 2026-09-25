import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows, labelingView, skillLabelRows, filterLabelRows, resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
import {renderLabelTable} from '../dist/skill-labeling.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json'));
const audit=JSON.parse(read('../docs/battle-start-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);
const data=box.window.SKILL_DATA,all=canonicalSkillRows(data);
const source=n=>all.find(row=>row.url.endsWith(`/gino/${n}`));
const entry=n=>catalog.entries.find(row=>row.id===source(n).id);
const detail=n=>entry(n).tagDetails['战斗开始'];
const numbers=key=>labelingView(catalog,key).entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
const opening=labelingView(catalog,'battle-start');
const groups=n=>detail(n).bindings.map(b=>b.group);
const permanentNumbers=[106,107,108,109,110,112,239,350,406,636,683,700,710,887,899,969,1088,1190,1221,1250,1312,1364,1381,1395,1768,1828];

test('opening pass audits the full 935-skill library, including previously untagged recovery and debuff skills',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);
 assert.equal(audit.matchedUnique,117);assert.equal(audit.rows.filter(r=>r.decision==='related').length,117);
 for(const row of all){
  const decision=audit.rows.find(r=>r.id===row.id);
  const digest=createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex');
  assert.equal(decision.sourceHash,digest,row.name);
  assert.equal(decision.decision==='related',opening.entries.some(e=>e.id===row.id),row.name);
 }
 assert.deepEqual(numbers('battle-start').filter(n=>!permanentNumbers.includes(n)),[102,103,104,105,164,201,203,207,208,210,214,234,243,256,305,324,353,358,381,390,402,431,460,471,473,508,512,524,560,592,620,627,639,649,692,696,699,746,830,831,851,859,867,886,906,916,984,992,994,1009,1028,1066,1074,1092,1103,1144,1205,1231,1241,1256,1365,1378,1425,1432,1459,1462,1482,1604,1605,1616,1629,1674,1693,1706,1747,1753,1776,1799,1801,1802,1812,1813,1873,1879,1884,1941,1954,1981,1987,1988,2016]);
 const newEntries=opening.entries.filter(e=>e.assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)).length===1);
 assert.equal(newEntries.length,22);assert(newEntries.every(e=>e.assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag))[0]==='战斗开始'));
 assert.equal(catalog.views.all.counts.relatedUnique,838);assert.equal(catalog.numericEffectInjection,false);
});

test('attack and magic opening clauses occupy different groups while compound skills share stable labels',()=>{
 assert.deepEqual(numbers('battle-start-attack-up'),[102,106,210,305,390,851,969,984,1103,1231,1256,1365,1747,1801]);
 assert.deepEqual(numbers('battle-start-magic-up'),[103,108,210,305,592,1088,1103,1144,1802,1813]);
 assert.deepEqual(entry(102).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)),['攻击力','战斗开始']);
 assert.deepEqual(entry(103).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)),['魔力','战斗开始']);
 for(const n of [210,1103]){
  assert.deepEqual(groups(n),['attack-up','magic-up','physical-reduction','magic-reduction']);
  assert.strictEqual(labelingView(catalog,'battle-start-attack-up').entries.find(e=>e.id===entry(n).id),labelingView(catalog,'battle-start-magic-up').entries.find(e=>e.id===entry(n).id));
  assert.equal(entry(n).judgment,'ready');assert.deepEqual(entry(n).remainingEffects,[]);
 }
 assert.equal(opening.counts.relatedUnique,117);assert.equal(opening.counts.ready,72);assert.equal(opening.counts.partial,45);
 const union=new Set(opening.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)));
 assert.deepEqual([...union].sort(),opening.entries.map(e=>e.id).sort());
 assert.equal(opening.childKeys.length,59);
 assert.equal(catalog.views.all.counts.ready,510);assert.equal(catalog.views.all.counts.partial,328);
});

test('opening grouping follows its own clause, never passive stats, comparison operands, delayed damage or a maximum',()=>{
 assert.deepEqual(groups(627),['type-add']);assert.deepEqual(groups(1873),['self-poison']);
 assert.deepEqual(groups(746),['attack-down','magic-down']);
 assert.deepEqual(groups(524),['defense-up','mnd-up']);assert.deepEqual(groups(1365),['attack-up']);
 assert.deepEqual(groups(1066),['physical-damage','magic-damage']);
 assert.deepEqual(groups(1941),['skill-cap','magic-cap']);
 assert.deepEqual(groups(696),['killer-cap']);assert.deepEqual(groups(1706),['physical-cap']);
 assert.deepEqual(groups(1812),['self-damage-up']);assert.deepEqual(groups(2016),['mnd-down']);
 assert.deepEqual(groups(560),['magic-lock']);assert.deepEqual(groups(831),['skill-lock']);assert.deepEqual(groups(1378),['speed-down']);
 assert.deepEqual(numbers('battle-start-reset'),[1629,1981,1987]);
 for(const n of [1629,1981,1987]){assert(entry(n).remainingConditions.length);assert.match(detail(n).calculationNote,/不自动取得最高加成/);}
 assert.deepEqual(groups(1241),['light-damage']);assert(!entry(1241).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('伤害增加'));
 assert.deepEqual(groups(1884),['ultimate-critical-cap']);assert(!entry(1884).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('Boss暴击伤害增加'));
 assert.match(detail(305).bindings.find(b=>b.group==='science-magic-damage').summary,/\+5%/);
});

test('the condition pass completes known opening buffs but leaves equipment, party, random, conversion and missing effects pending',()=>{
 const pass=registry.tagPasses.find(p=>p.tag==='战斗开始');
 for(const a of pass.assignments){const e=catalog.entries.find(e=>e.id===a.skillId);assert(a.partIds.every(id=>e.parts.find(p=>p.id===id).kind==='condition'));}
 const before=structuredClone(registry);before.tagPasses=before.tagPasses.filter(p=>p.tag!=='战斗开始');
 const old=resolveSkillLabels(before);
 const promoted=opening.entries.filter(e=>e.judgment==='ready').map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
 assert.deepEqual(promoted,[102,103,104,105,106,107,108,109,112,164,201,207,210,214,234,239,243,256,353,358,471,473,508,560,592,636,639,649,683,692,700,710,746,830,831,851,867,886,887,899,906,969,994,1028,1088,1103,1144,1190,1205,1221,1241,1250,1312,1364,1381,1395,1425,1432,1459,1462,1482,1605,1616,1674,1693,1753,1768,1828,1879,1884,1954,1988]);
 for(const n of promoted){const current=entry(n);assert.equal(old.find(e=>e.id===current.id).judgment,'partial');assert.deepEqual(entry(n).remainingEffects,[]);assert.deepEqual(entry(n).remainingConditions,[]);}
 for(const n of [305,524,696,1066,1231,1256,1365,1747,1799,1801,1802,1813,1941,2016]){assert.equal(entry(n).judgment,'partial');assert(entry(n).remainingConditions.length,entry(n).name);}
 assert(!entry(390).remainingEffects.some(t=>t.includes('暴击率')));assert(entry(390).remainingEffects.some(t=>t.includes('速度')));
 assert(entry(402).remainingEffects.some(t=>t.includes('魔抗')));
 assert.deepEqual(entry(1884).remainingEffects,[]);
 assert(entry(2016).remainingConditions.some(t=>t.includes('持续时间待确认')));
});

test('opening timing, termination and same-type buff limits retain their individual rules',()=>{
 for(const n of [102,103,210,851,1103,1144])for(const b of detail(n).bindings){assert.equal(b.durationSeconds,40);assert.equal(b.stacking,'highest-active-buff-of-same-type-only');}
 for(const [n,seconds] of [[992,20],[1812,20],[560,30],[831,30],[1706,90],[699,100]])for(const b of detail(n).bindings)assert.equal(b.durationSeconds,seconds);
 assert.equal(detail(460).trigger.waveScope,'boss');assert.deepEqual(groups(460),['hp-heal','sct-recover','ultimate-gauge']);assert(entry(460).remainingConditions.some(t=>t.includes('Boss')));
 for(const n of [916,1009,1378])for(const b of detail(n).bindings){assert.equal(b.endsOn,'incapacitated');assert.equal(b.durationSeconds,undefined);}
 assert.equal(detail(859).bindings[0].endsOn,'hit-by-enemy-ice-attack');
 assert.equal(detail(324).bindings[0].durationSeconds,undefined);
 for(const n of [118,158,159,160,161,162,183,187,188,219,289,389,489,493,511,753,821,890,917,939,948,1022,1113,1370,1418,1617,1773,1798,1858,1961,1998])assert(!opening.entries.some(e=>e.id===source(n).id),source(n).name);
 for(const n of [1231,1066,1941])assert(detail(n).bindings.every(b=>b.mutuallyExclusiveBranch));
 for(const n of [524,984,1066,1365,1747,1801,1813])assert(detail(n).bindings.every(b=>!b.stacking),'non-Buff mechanisms must not receive blanket Buff rules');
});

function page(edits={}){
 const elements=new Map(),get=key=>{if(!elements.has(key))elements.set(key,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.listeners[k]=v;},focus(){}});return elements.get(key);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=battle-start'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Must preserve saved state.');}}});
 const click=(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}});
 return {get,click};
}

test('opening overview separates effect tables, counts unique skills and preserves judgment sorting and search',()=>{
 const {get,click}=page();
 assert.match(get('#labelCoverage').textContent,/935.*117.*818/);assert.match(get('#judgmentSummary').textContent,/72.*45.*0/);
 assert.match(get('#labelResultCount').textContent,/117 \/ 117/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,56);
 assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,60);
 const sections=get('#labelTable').innerHTML.split('<section ').slice(1);
 assert.equal(sections.length,59);
 const attack=sections.find(s=>s.includes('id="section-battle-start-attack-up"'));
 const magic=sections.find(s=>s.includes('id="section-battle-start-magic-up"'));
 assert(attack.includes('快速鼓舞'));assert(!attack.includes('快速增魔'));
 assert(magic.includes('快速增魔'));assert(!magic.includes('快速鼓舞'));
 for(const s of sections){const statuses=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>m[1]);const rank={ready:0,partial:1,unknown:2};assert(statuses.every((s,i)=>!i||rank[statuses[i-1]]<=rank[s]));}
 click('#labelSubTabs','battle-start-magic-up');
 assert.match(get('#activeTagTitle').textContent,/战斗开始.*魔力增加/);assert.match(get('#labelResultCount').textContent,/10 \/ 10/);
 assert.match(get('#labelTable').innerHTML,/本组开场效果/);
 click('#labelSubTabs','battle-start');
 const search=get('#labelSearch');search.value='快速假期';search.listeners.input();
 assert.match(get('#labelResultCount').textContent,/2 \/ 117/);
 assert.equal((get('#labelTable').innerHTML.match(/data-skill-id=/g)||[]).length,8);
 get('#clearLabelSearch').listeners.click();assert.match(get('#labelResultCount').textContent,/117 \/ 117/);
 click('#labelTabs','boss');assert.match(get('#labelResultCount').textContent,/13 \/ 13/);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,7);
 click('#labelTabs','attack');assert.equal(get('#labelSubTabs').hidden,true);
});

test('changed saved descriptions lose stale opening bindings and appear in a separate unknown section',()=>{
 const edits={[`skill:${source(102).id}`]:{effect:'新的未知效果'},[`skill:${source(9).id}`]:{effect:'战斗开始时的新效果'}};
 const before=JSON.stringify(edits),{get}=page(edits);
 assert.match(get('#labelResultCount').textContent,/118 \/ 118/);
 assert.match(get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 assert.equal((get('#labelTable').innerHTML.match(/judgment-label judgment-unknown/g)||[]).length,2);
 assert.equal(JSON.stringify(edits),before);
 const row=skillLabelRows(data,opening,edits).find(e=>e.id===source(102).id);assert.deepEqual(row.openingBindings,[]);
 const safe=renderLabelTable([{...row,openingBindings:[{group:'test',summary:'<img onerror=bad>'}]}],'test');assert(!safe.includes('<img'));
});

test('permanent named statuses are the exact user-approved extension and retain continuous activation without a timer',()=>{
 const ids=JSON.parse(read('../docs/battle-start-tag-registry.json')).permanentStatusIds;
 const permanent=opening.entries.filter(e=>e.tagDetails['战斗开始'].activationMode==='permanent-status');
 assert.deepEqual(permanent.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),permanentNumbers);
 assert.equal(permanent.length,26);assert.equal(audit.permanentStatusUnique,26);
 assert.deepEqual([...ids].sort(),permanent.map(e=>e.id).sort());
 for(const e of permanent){
  const d=e.tagDetails['战斗开始'];
  assert.deepEqual(d.trigger,{event:'always-active'});
  assert.equal(d.relation,'permanent-status-condition');assert.equal(d.target,'self');
  assert(audit.rows.some(r=>r.id===e.id && r.classification==='permanent-status' && r.decision==='related'));
  for(const b of d.bindings){
   assert.equal(b.lifetime,'permanent');assert.equal(b.durationSeconds,undefined);assert.equal(b.endsOn,undefined);
   assert.equal(b.stacking,'highest-active-buff-of-same-type-only');assert.equal(b.target,'self');
   assert.match(b.summary,/永久获得.*无固定倒计时/);
  }
 }
 assert.equal(catalog.entries.filter(e=>e.tagDetails['战斗开始']?.activationMode==='permanent-status' && e.assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)).length===1).length,7);
 assert.deepEqual(permanent.filter(e=>e.judgment==='ready').map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b),[106,107,108,109,112,239,636,683,700,710,887,899,969,1088,1190,1221,1250,1312,1364,1381,1395,1768,1828]);
 assert.equal(registry.tagPasses.filter(p=>p.tag==='战斗开始').length,1);
 assert.equal(registry.tagPasses.length,62);assert.equal(catalog.numericEffectInjection,false);
});

test('permanent effect groups preserve stats, HP caps, speed, recovery and self-only elemental walls separately',()=>{
 for(const [n,expected] of [[106,'attack-up'],[108,'magic-up'],[636,'defense-up'],[350,'mnd-up'],[1221,'hp-max'],[1768,'hp-max'],[110,'hp-regen'],[112,'sct-speed'],[406,'speed-up'],[239,'critical-rate'],[107,'physical-reduction'],[109,'magic-reduction'],[683,'received-thunder'],[700,'received-fire'],[710,'received-dark'],[887,'received-light'],[1190,'received-tree'],[1250,'received-ice'],[1312,'received-dark'],[1381,'received-tree'],[1395,'received-light'],[1828,'received-thunder']])assert.deepEqual(groups(n),[expected]);
 assert.match(detail(106).calculationNote,/与开场限时.*同类型Buff.*最高一项/);
 assert.match(detail(969).calculationNote,/更高的限时Buff结束后，仍有永久状态/);
 for(const n of [683,710,887,1190,1250,1312,1381,1395,1828]){assert.equal(entry(n).judgment,'ready');assert.equal(entry(n).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag))[0],'战斗开始');assert.equal(entry(n).assignedTags.filter(tag=>!['物理','魔法','鸟',...ADDITIONAL_RACE_TAGS].includes(tag)).length,2);assert.match(detail(n).calculationNote,/仅作用于自身.*不是提高属性耐性/);}
 // A barrier consumed by the first blocked status and triggered buffs lasting
 // until death are not the same thing as an always-active permanent status.
 for(const n of [324,746,916,1009,1378])assert.notEqual(detail(n).activationMode,'permanent-status');
 for(const n of [9,17,97,173,200,244,425,754,917,939,948])assert(!opening.entries.some(e=>e.id===source(n).id));
 assert.equal(detail(102).bindings[0].durationSeconds,40);assert.equal(detail(103).bindings[0].durationSeconds,40);
});

test('permanent and timed statuses share their effect group with explicit lifetime text and a deduplicated count',()=>{
 const {get,click}=page();
 click('#labelSubTabs','battle-start-attack-up');
 const html=get('#labelTable').innerHTML;
 assert.match(get('#labelResultCount').textContent,/14 \/ 14/);
 assert(html.includes('快速鼓舞'));assert(html.includes('自动鼓舞'));assert(!html.includes('自动增魔'));
 assert(html.includes('永久获得「勇敢」：自身攻击力+20%（无固定倒计时）'));
 assert(html.includes('攻击力+20%，勇敢Buff，40秒'));
 const search=get('#labelSearch');search.value='自动鼓舞';search.listeners.input();
 assert.match(get('#labelResultCount').textContent,/1 \/ 14/);
 assert.match(get('#labelTable').innerHTML,/judgment-label judgment-ready/);
 get('#clearLabelSearch').listeners.click();
 click('#labelSubTabs','battle-start-magic-up');assert.match(get('#labelResultCount').textContent,/10 \/ 10/);
 assert(get('#labelTable').innerHTML.includes('自动增魔'));assert(!get('#labelTable').innerHTML.includes('自动鼓舞'));
});
