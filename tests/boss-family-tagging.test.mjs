import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {validateBossBinding,validateBossCoverage} from '../scripts/validate-boss-labels.mjs';
import {partsBeforeBoss} from './race-preservation-helpers.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),r=JSON.parse(read('docs/skill-labeling-registry.json')),audit=JSON.parse(read('docs/boss-tag-audit.json')),preserved=JSON.parse(read('docs/boss-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA,rows=canonicalSkillRows(data),source=n=>rows.find(e=>e.url.endsWith('/'+n)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails.Boss,bs=n=>detail(n).bindings,nums=es=>es.map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const expected=[192,246,290,411,460,624,638,640,720,760,837,888,941,985,1041,1097,1159,1289,1311,1526,1608,1630,1644,1651,1708,1814,1830,1883,1918,1955,2028],view=labelingView(catalog,'boss');

test('Boss audits every one of 935 sources and expands the original route into 20 complete effect groups',()=>{
 assert.deepEqual(nums(view.entries),expected);assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(a=>a.id)).size,935);
 for(const s of rows){const a=audit.rows.find(a=>a.id===s.id);assert.equal(a.sourceHash,hash([s.id,s.url,s.name,s.effect,s.notes||'']));assert.equal(a.decision==='related',expected.includes(+s.url.split('/').pop()));}
 assert.equal(view.label,'Boss');assert.equal(view.childKeys.length,20);assert.equal(view.counts.ready,27);assert.equal(view.counts.partial,4);assert.equal(catalog.entries.length,920);assert.equal(catalog.views.all.counts.ready,644);assert.equal(catalog.views.all.counts.partial,276);
 assert.deepEqual([...new Set(view.childKeys.flatMap(k=>labelingView(catalog,k).entries.map(e=>e.id)))].sort(),view.entries.map(e=>e.id).sort());
 assert(!view.entries.includes(entry(731)));assert.equal(catalog.numericEffectInjection,false);
});

test('Boss keeps all 838 prior source records, bindings and 62 tag passes; only two uncovered compound conditions split',()=>{
 assert.equal(preserved.entries.length,838);assert.equal(preserved.tagPassHashes.length,62);assert.equal(r.tagPasses.length,77);
 for(const p of preserved.tagPassHashes)assert.equal(hash(r.tagPasses.find(t=>t.tag===p.tag)),p.hash,p.tag);
 for(const p of preserved.entries){const e=r.entries.find(e=>e.id===p.id);assert.equal(hash([e.id,e.url,e.name,e.text,e.notes,partsBeforeBoss(e)]),p.sourceAndPartsHash,e.name);assert.equal(hash(Object.entries(e.tagDetails).filter(([t,d])=>!['Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血'].includes(t)&&d.bindings).map(([t,d])=>[t,d.bindings])),p.bindingsHash,e.name);}
 assert.equal(preserved.conditionSplits.length,2);
 for(const s of preserved.conditionSplits){const e=r.entries.find(e=>e.id===s.skillId);assert.deepEqual(e.parts.filter(p=>s.replacementParts.some(x=>x.id===p.id)),s.replacementParts);for(const pass of r.tagPasses.filter(t=>t.tag!=='Boss'))assert(!pass.assignments.some(a=>a.skillId===e.id&&a.partIds.includes(s.originalPart.id)));}
 for(const[p,h]of Object.entries(preserved.protectedFiles))assert.equal(createHash('sha256').update(read(p)).digest('hex'),h);
});

test('Boss target and attacker are separate, armor reduction retains equipment, and non-Boss never leaks into Boss damage',()=>{
 assert.deepEqual(nums(labelingView(catalog,'boss-damage').entries),[1608]);assert.equal(bs(1608).find(b=>b.operation==='damage-up').scope.attackType,'unspecified');
 for(const[n,v]of[[246,10],[290,5],[638,10],[888,10],[1097,20],[1608,20]]){const b=bs(n).find(b=>b.operation==='incoming-damage-down');assert.equal(b.scope.attackerType,'boss');assert.equal(b.scope.enemyType,undefined);assert.equal(b.valuePercent,v);assert.equal(b.scope.attackType,'unspecified');if([246,290,638].includes(n))assert.deepEqual(b.scope.equipment,{armorType:'armor'});}
 assert.deepEqual(detail(638).coverage.effectPartIds,['effect-2']);assert.deepEqual(entry(638).remainingConditions,[]);
 for(const[n,v]of[[640,10],[1630,15],[1918,20]]){assert.equal(bs(n)[0].scope.attackerType,'non-boss');assert.equal(bs(n)[0].valuePercent,v);assert.equal(entry(n).judgment,'ready');}
 for(const[n,v]of[[760,10],[1526,20]]){assert.equal(bs(n)[0].scope.enemyType,'non-boss');assert.equal(bs(n)[0].scope.attackType,'skill');assert.equal(bs(n)[0].valuePercent,v);assert.equal(entry(n).judgment,'ready');}
});

test('Boss caps keep attack types, base plus extra semantics, actual ally counts and female ally scope',()=>{
 assert.deepEqual(bs(1955).map(b=>[b.scope.attackType,b.capPoints]).sort(),[['physical',10000],['physical',10000],['ultimate',10000],['ultimate',10000]].sort());assert(!detail(1955).coverage.effectPartIds.includes('attack'));
 const extra=bs(1651).find(b=>b.addsToPartId);assert.equal(extra.capPoints,3000);assert.deepEqual(extra.scope.equipment.weaponCountIn,[0,1]);assert.equal(extra.addsToPartId,'effect-1');
 assert.equal(bs(1830).length,1);assert.equal(bs(1830)[0].addsToPartId,'skill-cap');assert.equal(bs(1830)[0].scope.equipment.weaponCount,2);assert.equal(bs(1830)[0].capPoints,5000);
 for(const n of [720,1708]){const b=bs(n)[0];assert.equal(b.countMetric,'allies-with-same-skill');assert.equal(b.requiredSkillId,entry(n).id);assert.equal(b.valuePercent,undefined);assert.equal(b.capPoints,undefined);assert.equal(entry(n).judgment,'partial');}
 assert.deepEqual(bs(720)[0].tiers.map(t=>[t.count,t.valuePercent]),[[1,6],[2,12],[3,18],[4,24]]);assert.deepEqual(bs(1708)[0].tiers.map(t=>[t.count,t.capPoints]),[[2,5000],[3,10000],[4,15000]]);
 assert.deepEqual(bs(2028).map(b=>b.scope.attackType).sort(),['attack-magic','skill']);const magic=bs(2028).find(b=>b.scope.attackType==='attack-magic');assert.equal(magic.condition.requireAnyLivingFemale,true);assert.equal(magic.condition.excludeSelf,true);assert.equal(magic.condition.requireAllFemale,false);assert.equal(entry(2028).judgment,'partial');
 for(const n of [624,1041,1311]){assert.equal(bs(n).length,4);assert.deepEqual([...new Set(bs(n).map(b=>b.scope.attackType))].sort(),['skill','ultimate']);}
 for(const n of [1159,1644,1814])assert(bs(n).every(b=>b.scope.attackType==='attack-magic'&&b.scope.enemyType==='boss'));
});

test('Boss Wave current attributes and opening recovery keep distinct lifetimes; Dragon Awakening is one shared attribute effect',()=>{
 for(const n of [941,1883])for(const b of bs(n)){assert.equal(b.operation,'stat-up');assert.equal(b.scope.waveType,'boss');assert.equal(b.scope.enemyType,undefined);assert.equal(b.activationMode,'boss-wave-state');assert.equal(b.trigger,undefined);assert.equal(b.isBuff,false);assert.equal(b.durationSeconds,undefined);}
 assert.equal(bs(1883).length,1);assert.equal(bs(1883)[0].scope.stat,'STR');assert.equal(bs(1883)[0].valuePercent,20);assert.deepEqual(bs(1883)[0].associatedGroups,['physical-damage']);assert.equal(bs(1883)[0].effectIdentity,entry(1883).id+':attack');
 assert.deepEqual(nums(labelingView(catalog,'boss-physical-damage').entries),[720,1883]);assert.deepEqual(nums(labelingView(catalog,'boss-wave-str').entries),[941,1883]);
 assert(bs(460).every(b=>b.trigger.event==='boss-wave-start'&&b.isBuff===false));const sct=bs(460).find(b=>b.resource==='SCT');assert.equal(sct.restoreSeconds,30);assert.equal(sct.skillSelection,'all');const gauge=bs(460).find(b=>b.resource==='ultimate-gauge');assert.equal(gauge.restorePercent,10);assert.equal(gauge.restoreBase,'maximum-ultimate-gauge');assert.equal(entry(460).judgment,'ready');
});

test('Boss coverage leaves unknown instant kill and independent conditions partial, while critical effects require actual critical hits',()=>{
 assert.deepEqual(nums(view.entries.filter(e=>e.judgment==='partial')),[192,720,1708,2028]);
 const kill=bs(192)[0];assert.deepEqual(kill.scope.excludedEnemyTypes,['boss']);assert.deepEqual(kill.scope.excludedModes,['arena']);assert.equal(kill.chanceStatus,'unconfirmed');assert.equal(kill.chancePercent,undefined);assert.deepEqual(entry(192).remainingConditions,['即死效果在竞技场无效','即死概率与目标免疫判定待确认']);
 for(const b of bs(1289)){assert.equal(b.requiresCriticalHit,true);assert.equal(b.grantsCriticalEligibility,false);assert.equal(b.scope.attackType,'unspecified');}
 for(const[n,k]of[[1883,'race-dragon'],[1651,'physical'],[1955,'ultimate'],[941,'attack'],[1830,'technique'],[1608,'boss-damage']]){assert.strictEqual(labelingView(catalog,k).entries.find(e=>e.id===entry(n).id),entry(n));assert.equal(entry(n).judgment,'ready');}
});

test('Boss validators reject reversed subjects, forced maxima, invalid wave timing and accidental damage associations',()=>{
 const reject=(n,i,change)=>{const b=structuredClone(bs(n)[i]);change(b);assert.throws(()=>validateBossBinding(detail(n),{},b));};
 reject(888,0,b=>b.scope.direction='outgoing');reject(246,0,b=>b.scope.attackType='physical');reject(720,0,b=>b.valuePercent=24);reject(1708,0,b=>b.capPoints=15000);reject(941,0,b=>b.scope.enemyType='boss');reject(460,1,b=>b.restoreSeconds=3);reject(192,0,b=>b.chancePercent=100);reject(1289,0,b=>b.grantsCriticalEligibility=true);
 const d=structuredClone(detail(1883));d.bindings[0].operation='damage-up';assert.throws(()=>validateBossCoverage(view,d,{partIds:[...d.coverage.effectPartIds,...d.coverage.conditionPartIds]},entry(1883)));
 const armor=structuredClone(detail(246));armor.coverage.conditionPartIds.push('condition-1');assert.throws(()=>validateBossCoverage(view,armor,{partIds:[...armor.coverage.effectPartIds,...armor.coverage.conditionPartIds]},entry(246)));
});

function page(key){const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag='+key},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Do not change user saves');}}});return get;}
test('original Boss route renders all groups, deduplicates search, sorts judgments and clears stale association metadata',()=>{
 const get=page('boss');assert.equal(get('#activeTagTitle').textContent,'Boss');assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,69);const sections=get('#labelTable').innerHTML.split('<section ').slice(1);assert.equal(sections.length,20);for(const s of sections){const ranks=[...s.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(m=>({ready:0,partial:1,unknown:2})[m[1]]);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}
 get('#labelSearch').value='龙觉醒';get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 31/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,2);assert.match(get('#labelTable').innerHTML,/不是物理伤害\+20%/);
 const sub=page('boss-physical-damage');assert.match(sub('#labelTable').innerHTML,/本组Boss效果/);assert.match(sub('#labelTable').innerHTML,/属性关联项/);
 const edited=skillLabelRows(data,labelingView(catalog,'boss-physical-damage'),{[`skill:${entry(1883).id}`]:{effect:'新描述'}}).find(e=>e.id===entry(1883).id);assert.equal(edited.judgment,'unknown');assert.deepEqual(edited.assignedTags,[]);assert.deepEqual(edited.conditionBindings,{});
});
