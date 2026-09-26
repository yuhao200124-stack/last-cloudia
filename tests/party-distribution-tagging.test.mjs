import {textBeforeCommonCalculator} from '../scripts/calculator-preservation-helpers.mjs';
import {registryBeforeClassificationSupplements} from '../scripts/classification-supplement-preservation-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,resolveSkillLabels,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {registryBeforePartyDistribution} from '../scripts/party-distribution-preservation-helpers.mjs';
import {validateEffectConditions} from '../scripts/validate-effect-conditions.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const registry=JSON.parse(read('docs/skill-labeling-registry.json')),manifest=JSON.parse(read('docs/party-distribution-preservation-2026-09-25.json'));
const box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA;
const partyBase=registryBeforeClassificationSupplements(registry),partyBaseRows=resolveSkillLabels(partyBase);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),entry=n=>catalog.entries.find(e=>e.url.endsWith('/'+n));
const attached=(n,tag)=>entry(n).tagDetails[tag].effectConditions;
test('the party root and every independent party label are removed while the other roots retain their order',()=>{
 assert.equal(catalog.views.party,undefined);assert(!Object.values(catalog.views).some(v=>v.parent==='party'));
 assert(!registry.tagPasses.some(p=>p.tag==='队伍联动'));assert(catalog.entries.every(e=>!e.assignedTags.includes('队伍联动')&&!e.tagDetails['队伍联动']));
 assert.equal(registry.tagPasses.length,93);assert.equal(Object.values(catalog.views).filter(v=>!v.parent&&!v.hidden).length,85);
 const previousRoots=manifest.baselineViews.map(v=>v.key).filter(k=>!registry.views[k]?.parent&&!registry.views[k]?.hidden&&!manifest.removedViews[k]);
 assert.deepEqual(Object.keys(partyBase.views).filter(k=>!partyBase.views[k].parent&&!partyBase.views[k].hidden),previousRoots);
});
test('all 935 records and 91 earlier passes can be restored exactly and protected calculation files are unchanged',()=>{
 const before=registryBeforePartyDistribution(registry);
 assert.equal(manifest.baselineEntries.length,935);assert.equal(manifest.baselinePasses.length,91);
 for(const p of manifest.baselineEntries)assert.equal(hash(before.entries.find(e=>e.id===p.id)),p.hash,p.id);
 for(const p of manifest.baselinePasses)assert.equal(hash(before.tagPasses.find(x=>x.tag===p.tag)),p.hash,p.tag);
 for(const p of manifest.baselineViews){const change=manifest.changedViews[p.key];if(change)assert.deepEqual(partyBase.views[p.key]??null,change.after);assert.equal(hash(change?change.before:partyBase.views[p.key]),p.hash,p.key);}
 assert.equal(hash(Object.fromEntries(Object.entries(registry).filter(([k])=>!['entries','tagPasses','views'].includes(k)))),manifest.baselineFieldsHash);
 for(const[p,h]of Object.entries(manifest.protectedFiles))assert.equal(createHash('sha256').update(textBeforeCommonCalculator(p,read(p))).digest('hex'),h,p);
 const old=resolveSkillLabels(before);assert.equal(old.filter(e=>e.judgment==='ready').length,749);
 assert(old.filter(e=>e.judgment==='ready').every(e=>catalog.entries.find(x=>x.id===e.id).judgment==='ready'));
 const promoted=old.filter(e=>e.judgment==='partial'&&partyBaseRows.find(x=>x.id===e.id).judgment==='ready').map(e=>e.id).sort();
 assert.deepEqual(promoted,[...manifest.addedSkillIds].sort());assert.deepEqual(catalog.views.all.counts,{reviewedUnique:935,relatedUnique:935,notRelatedUnique:0,ready:787,partial:148,unknown:0});
});
test('every transferred condition belongs to an actual benefit and every source retains its audit fingerprint',()=>{
 assert.equal(manifest.reviewedSkillIds.length,48);assert.equal(manifest.transfers.length,77);
 for(const x of manifest.transfers){const e=registry.entries.find(e=>e.id===x.skillId);assert(x.targetTags.length);
  for(const tag of x.targetTags){const a=registry.tagPasses.find(p=>p.tag===tag).assignments.find(a=>a.skillId===e.id),d=e.tagDetails[tag];assert(x.effectPartIds.every(id=>a.partIds.includes(id)));assert(x.conditionPartIds.every(id=>a.partIds.includes(id)));assert(d.effectConditions.some(c=>JSON.stringify(c.effectPartIds)===JSON.stringify(x.effectPartIds)));validateEffectConditions(e,tag,d,a);}
 }
 const audit=JSON.parse(read('docs/party-conditions-audit.json'));assert.equal(audit.rows.length,935);assert.equal(audit.matchedUnique,48);
 for(const r of canonicalSkillRows(data)){const a=audit.rows.find(a=>a.id===r.id);assert.equal(a.sourceHash,hash([r.id,r.url,r.name,r.effect,r.notes||'']));assert.equal(a.decision==='related',manifest.reviewedSkillIds.includes(r.id));}
 assert.equal(catalog.numericEffectInjection,false);
});
test('the eight omissions retain solo, exact-pair and elemental tier conditions in their benefit categories',()=>{
 for(const tag of ['攻击力','防御'])assert.equal(attached(1249,tag)[0].predicate.mode,'solo-entry');
 const pair=attached(1747,'攻击力')[0];assert.equal(pair.predicate.otherEquippedCount,1);assert.equal(pair.predicate.snapshot,'wave-start');assert.equal(pair.effectBinding.valuePercent,20);assert.equal(pair.effectBinding.isBuff,false);
 for(const[n,tag]of[[1229,'火属性'],[1409,'冰属性'],[1506,'树属性'],[1327,'雷属性'],[1154,'暗属性'],[1910,'无属性']]){const c=attached(n,tag)[0];assert.equal(c.predicate.minimumCount,2);assert.equal(c.predicate.includesSelf,true);assert.equal(c.predicate.requiredSkillId,entry(n).id);assert.deepEqual(c.effectBinding.tiers,[{count:2,valuePercent:10},{count:3,valuePercent:20},{count:4,valuePercent:30}]);assert.equal(c.effectBinding.valuePercent,undefined);assert.equal(entry(n).judgment,'ready');}
 assert.deepEqual(entry(1477).assignedTags,['杂项']);assert.equal(entry(1477).tagDetails['杂项'].bindings[0].grantsDamageBonus,false);
 for(const n of[1478,1776,1799])assert.equal(entry(n).judgment,'partial');
 const reduction=attached(1296,'防御')[0];assert.deepEqual(reduction.effectPartIds,['physical-reduction']);assert(attached(1296,'反击').some(c=>c.effectPartIds.includes('counter-reduction')));
});
test('invalid ownership, unconfirmed conditions and inexact pair counts cannot be marked complete',()=>{
 const e=registry.entries.find(e=>e.url.endsWith('/1747')),d=structuredClone(e.tagDetails['攻击力']),a=registry.tagPasses.find(p=>p.tag==='攻击力').assignments.find(a=>a.skillId===e.id);
 assert.throws(()=>validateEffectConditions(e,'攻击力',d,{...a,partIds:a.partIds.filter(id=>id!=='attack')}),/actual effect owner/);
 d.effectConditions[0].predicate.otherEquippedCount=2;assert.throws(()=>validateEffectConditions(e,'攻击力',d,a),/exactly one/);
 const unknown=registry.entries.find(e=>e.url.endsWith('/1478')),tag=manifest.transfers.find(x=>x.skillId===unknown.id).targetTags[0],detail=structuredClone(unknown.tagDetails[tag]);detail.effectConditions[0].conditionPartIds.push('condition-3');
 const assignment=registry.tagPasses.find(p=>p.tag===tag).assignments.find(a=>a.skillId===unknown.id);assert.throws(()=>validateEffectConditions(unknown,tag,detail,{...assignment,partIds:[...assignment.partIds,'condition-3']}),/Unknown condition/);
});
test('benefit pages show the conditions without a party tab and source edits invalidate the attached labels',()=>{
 for(const[key,n,condition]of[['attack',1747,'恰好1名盟友'],['defense',1249,'唯一参战单位'],['fire',1229,'人数']]){
  const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v},setAttribute(){},focus(){}});return elements.get(k)};
  vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag='+key},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Preserve user saves')}}});
  assert(!get('#labelTabs').innerHTML.includes('队伍联动'));get('#labelSearch').value=entry(n).name;get('#labelSearch').listeners.input();assert(get('#labelTable').innerHTML.includes(condition));assert.match(get('#labelResultCount').textContent,/显示 1 \/ /);
  const edited=skillLabelRows(data,labelingView(catalog,key),{['skill:'+entry(n).id]:{effect:'用户修改效果'}}).find(e=>e.id===entry(n).id);assert.equal(edited.judgment,'unknown');assert.deepEqual(edited.assignedTags,[]);assert.deepEqual(edited.conditionBindings,{});
 }
});
