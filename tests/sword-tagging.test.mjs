import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8'),registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/sword-tag-audit.json'));const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'sword'),source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['剑'];
const included=[79,215,222,293,502,537,775,777,823,828,829,901,938,1034,1538,1548,1727];
test('sword audits every source skill and includes only explicit sword permissions/conditions',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,17);assert.deepEqual(view.entries.map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b),included);
 for(const r of all){const a=audit.rows.find(a=>a.id===r.id);assert.equal(a.sourceHash,createHash('sha256').update(JSON.stringify([r.id,r.url,r.name,r.effect,r.notes||''])).digest('hex'));assert.equal(a.decision==='related',included.includes(+r.url.split('/').pop()));}
 for(const n of[176,181,327,1073,1138,1272,1573,1607,1615,1658,1746,1830])assert(!view.entries.some(e=>e.id===source(n).id));
 assert.equal(view.childKeys.length,21);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),41);assert.equal(catalog.numericEffectInjection,false);
});
test('sword permission, one sword, sword plus claw/armor and equipment-stat bases remain distinct',()=>{
 const permission=detail(79).bindings[0];assert.equal(permission.grantsWeaponType,'sword');assert.equal(permission.automaticallyEquipsWeapon,false);assert.equal(permission.scope.equipment,undefined);
 for(const n of[215,222,537,1034])for(const b of detail(n).bindings){assert.equal(b.scope.equipment.minimumMatchingWeaponCount,1);assert.equal(b.scope.equipment.weaponCount,undefined);assert.equal(b.perMatchingWeaponStacking,false);}
 for(const n of[502,777,829,901,938,1727])for(const b of detail(n).bindings)assert.equal(b.scope.equipment.weaponCount,1);
 for(const b of detail(1538).bindings){assert.deepEqual(b.scope.equipment.weaponTypesAllOf,['sword','claw']);assert.equal(b.scope.equipment.weaponCount,2);assert.equal(b.scope.equipment.sameElement,undefined);}
 for(const n of[293,775,823,828])for(const b of detail(n).bindings){assert.equal(b.base,'equipped-item-stat');assert.equal(b.target,b.stat==='STR'?'equipped-sword':'equipped-armor');assert.equal(b.scope.equipment.armorType,[293,775].includes(n)?'armor':'clothes');}
 const crit=detail(502).bindings.find(b=>b.operation==='critical-rate-up');assert.equal(crit.ratePoints,10);assert.equal(crit.grantsCriticalEligibility,false);assert.equal(crit.valuePercent,undefined);
 for(const[n,v,c]of[[777,20,6000],[829,10,3000],[901,30,9000]]){const bs=detail(n).bindings;assert.equal(bs.length,4);assert.deepEqual(bs.map(b=>b.scope.attackType),['physical','ultimate','physical','ultimate']);assert.deepEqual(bs.map(b=>b.valuePercent??b.capPoints),[v,v,c,c]);}
});
test('sword element matching and enemy weakness preserve their separate conditions without completing other labels',()=>{
 const same=detail(938).bindings[0];assert.equal(same.scope.attackElementRelation,'same-as-equipped-sword');assert.equal(same.scope.element,undefined);
 for(const b of detail(1548).bindings){assert.equal(b.scope.equipment.weaponElement,'fire');assert.equal(b.scope.element,undefined);}
 const weak=detail(1727).bindings.find(b=>b.scope.enemyWeakElement);assert.equal(weak.scope.enemyWeakElement,'thunder');assert.equal(weak.requiresAttackElement,false);assert.equal(weak.scope.element,undefined);assert.equal(weak.capPoints,3000);assert.equal(weak.addsToPartId,'effect-1');
 for(const a of registry.tagPasses.find(p=>p.tag==='剑').assignments){const e=catalog.entries.find(e=>e.id===a.skillId),d=e.tagDetails['剑'];assert.deepEqual(a.partIds,[...d.coverage.permissionPartIds,...d.coverage.conditionPartIds]);for(const b of d.bindings.filter(b=>b.swordRole==='condition-benefit'))assert(b.partIds.every(id=>!a.partIds.includes(id)));}
 assert.deepEqual(view.entries.filter(e=>e.judgment==='ready').map(e=>+e.url.split('/').pop()).sort((a,b)=>a-b),[79,215,222,502,537,777,829,901,1034,1538,1727]);
 for(const n of[502,777,829,901,938,1727])assert(!entry(n).remainingConditions.some(x=>x.includes('仅装备一把武器')));assert(entry(938).remainingConditions.some(x=>x.includes('属性')));
 for(const n of[293,775])assert(entry(n).remainingConditions.some(x=>x.includes('盔甲')));for(const n of[823,828]){assert(entry(n).remainingConditions.some(x=>x.includes('衣服')));assert(entry(n).remainingEffects.some(x=>x.includes('魔抗')));}
 assert.deepEqual(entry(1538).remainingConditions,[]);assert.deepEqual(entry(1548).remainingConditions,[]);assert.equal(entry(1548).judgment,'partial');assert(entry(1548).remainingEffects.some(x=>x.includes('HP')));assert(!entry(1548).remainingEffects.some(x=>x.includes('上限')));
 assert.equal(catalog.views.physical.counts.ready,90);assert.equal(catalog.views.fire.counts.ready,21);assert.equal(catalog.views.all.counts.relatedUnique,737);
 // Claw completes the paired condition; the physical pass covers the cap.
 const earlier=structuredClone(registry);earlier.tagPasses=earlier.tagPasses.filter(p=>p.tag!=='爪');assert(resolveSkillLabels(earlier).find(e=>e.id===source(1538).id).remainingConditions.some(x=>x.includes('爪')));
 assert.equal(entry(1538).judgment,'ready');assert(entry(1538).assignedTags.filter(tag=>tag!=='物理').includes('剑'));assert(entry(1538).assignedTags.filter(tag=>tag!=='物理').includes('爪'));
});
test('sword page separates 21 groups, counts 17 identities, sorts judgments and reviews edited descriptions',()=>{
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=sword'},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Do not overwrite saved data');}}});
 assert.match(get('#labelCoverage').textContent,/935.*17.*918/);assert.match(get('#judgmentSummary').textContent,/11.*6.*0/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,21);assert.match(get('#labelResultCount').textContent,/17 \/ 17/);
 get('#labelSearch').value='两手剑增幅2';get('#labelSearch').listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 17/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,4);
 const ordered=skillLabelRows(data,view);assert(ordered.slice(0,11).every(e=>e.judgment==='ready'));assert(ordered.slice(11).every(e=>e.judgment==='partial'));
 const edits={[`skill:${source(1548).id}`]:{effect:'改成未确认效果'}};for(const k of ['sword','fire','physical']){const e=skillLabelRows(data,labelingView(catalog,k),edits).find(e=>e.id===source(1548).id);assert.equal(e.judgment,'unknown');assert.deepEqual(e.conditionBindings,{});}
});
