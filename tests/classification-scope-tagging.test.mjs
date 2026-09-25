import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as raw} from '../dist/skill-labeling-catalog.mjs';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-classification-catalog.mjs';
import {CLASSIFICATION_REVIEW_POLICY as policy} from '../dist/classification-review-policy.mjs';
import {applyClassificationReviewPolicy,classificationSourceSignature} from '../dist/classification-review.mjs';
import {labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const audit=JSON.parse(read('docs/classification-review-scope-audit-2026-09-26.json'));
const entry=(n,c=catalog)=>c.entries.find(e=>e.url.endsWith('/'+n));
const box={window:{}};vm.runInNewContext(read('dist/data.js'),box);const data=box.window.SKILL_DATA;
const examples=[195,267,983,1231,1629,118,272,425,593,627,849,1370,1380,1765,1779,1873];

test('the public page completes the named examples and analogous details while keeping the unresolved attack type',()=>{
 assert.deepEqual(catalog.views.all.counts,{reviewedUnique:935,relatedUnique:935,notRelatedUnique:0,ready:934,partial:1,unknown:0});
 assert.equal(policy.entries.length,148);assert.equal(policy.entries.flatMap(e=>e.fragments).filter(p=>p.disposition==='non-blocking').length,164);
 for(const n of examples){assert.equal(entry(n).judgment,'ready',entry(n).name);assert.deepEqual(entry(n).remainingConditions,[]);assert.deepEqual(entry(n).remainingEffects,[]);}
 assert.deepEqual(catalog.entries.filter(e=>e.judgment==='partial').map(e=>+e.url.split('/').pop()),[325]);
 assert.deepEqual(entry(325).remainingConditions,['周期暗属性伤害的攻击类型待确认（物理、魔法等归属）']);
 for(const[key,v]of Object.entries(catalog.views)){const es=labelingView(catalog,key).entries;for(const s of['ready','partial','unknown'])assert.equal(v.counts[s],es.filter(e=>e.judgment===s).length,key+'/'+s);assert.deepEqual(v.displayOrder,raw.views[key].displayOrder);assert.deepEqual(v.childKeys,raw.views[key].childKeys);assert.equal(v.label,raw.views[key].label);}
 assert.equal(catalog.numericEffectInjection,false);assert.equal(Object.values(catalog.views).filter(v=>!v.parent&&!v.hidden).length,85);
});

test('source text, actual effects, qualifiers, strict numeric review and calculator files are preserved',()=>{
 for(const[path,digest]of Object.entries({...audit.protectedFiles,...audit.unchangedFiles}))assert.equal(createHash('sha256').update(read(path)).digest('hex'),digest,path);
 for(const previous of raw.entries){const now=catalog.entries.find(e=>e.id===previous.id);for(const key of Object.keys(previous).filter(k=>!['judgment','remainingEffects','remainingConditions'].includes(k)))assert.deepEqual(now[key],previous[key],previous.name+'/'+key);}
 assert.equal(raw.views.all.counts.ready,787);assert.equal(raw.views.all.counts.partial,148);
 assert.equal(entry(267).tagDetails['濒死'].condition.curveStatus,'unconfirmed');
 assert.equal(entry(593).tagDetails['物理'].bindings[0].formulaStatus,'unconfirmed');
 assert.equal(entry(157).tagDetails['MP'].bindings[0].amountBase,'unconfirmed');
 assert.equal(entry(1145).tagDetails['MP'].condition.thresholdPercent,1);
 assert.deepEqual(entry(1271).tagDetails['自身倒下／战斗不能'].bindings[0].pair,entry(1271,raw).tagDetails['自身倒下／战斗不能'].bindings[0].pair);
 assert.equal(entry(1746).tagDetails['斧'].bindings[0].effectIdentity,entry(1746).tagDetails['枪'].bindings[0].effectIdentity);
});

test('the policy is exact, rejects stale sources, and cannot waive attack types or real effects',()=>{
 const changed=structuredClone(policy);changed.entries[0].sourceSignature+='changed';assert.throws(()=>applyClassificationReviewPolicy(raw,changed),/Stale/);
 const duplicate=structuredClone(policy);duplicate.entries.push(duplicate.entries[0]);assert.throws(()=>applyClassificationReviewPolicy(raw,duplicate),/duplicate/);
 const attack=structuredClone(policy),required=attack.entries.find(e=>e.skillNumber===325).fragments[0];required.disposition='non-blocking';required.reason='magnitude-details';delete required.remainingText;assert.throws(()=>applyClassificationReviewPolicy(raw,attack),/non-blocking/);
 const incomplete=structuredClone(raw),e=entry(118,incomplete);e.parts.push({id:'new-weapon','kind':'condition',text:'仅装备一把剑时才生效，尚未归类'});e.remainingConditions.push(e.parts.at(-1).text);
 const result=applyClassificationReviewPolicy(incomplete,policy);assert.equal(entry(118,result).judgment,'partial');assert.deepEqual(entry(118,result).remainingConditions,['仅装备一把剑时才生效，尚未归类']);
 e.parts.push({id:'new-effect',kind:'effect',text:'对敌人造成火属性伤害'});e.remainingEffects.push(e.parts.at(-1).text);
 const invalid=structuredClone(policy);invalid.entries.find(r=>r.skillNumber===118).fragments.push({partId:'new-effect',kind:'effect',text:e.parts.at(-1).text,disposition:'non-blocking',reason:'magnitude-details',supportingEffectPartIds:['heal']});
 assert.throws(()=>applyClassificationReviewPolicy(incomplete,invalid),/Actual effects/);
 const removal=applyClassificationReviewPolicy(incomplete,policy);assert.equal(entry(118,removal).judgment,'partial');assert.deepEqual(entry(118,removal).remainingEffects,['对敌人造成火属性伤害']);
});

test('MP numeric fragments are non-blocking only with their actual covered resource effect',()=>{
 for(const n of[35,157,160,161,821,1145]){assert.equal(entry(n).judgment,'ready');assert.deepEqual(entry(n).remainingEffects,[]);assert(entry(n).assignedTags.includes('MP'));const review=policy.entries.find(e=>e.skillNumber===n);assert(review.fragments.every(p=>p.supportingEffectPartIds?.length));}
 const broken=structuredClone(policy);broken.entries.find(e=>e.skillNumber===35).fragments[0].supportingEffectPartIds=['not-covered'];assert.throws(()=>applyClassificationReviewPolicy(raw,broken),/Actual effects/);
});

test('the actual classification page hides the waived pending blocks, retains source descriptions and invalidates edits',()=>{
 assert.match(read('dist/skill-labeling.mjs'),/import \{SKILL_LABELING_CATALOG as catalog\} from '\.\/skill-classification-catalog\.mjs/);
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v},setAttribute(){},focus(){}});return elements.get(k)};
 vm.runInNewContext(read('dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable'),{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=all'},addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Keep user saves')}}});
 assert.match(get('#judgmentSummary').textContent,/934.*1.*0/);assert.match(get('#conditionScope').textContent,/数值与机制细节不单独拆分/);
 for(const n of examples){get('#labelSearch').value=entry(n).name;get('#labelSearch').listeners.input();const html=get('#labelTable').innerHTML;assert(!html.includes('待判断条件／机制'),entry(n).name);assert(!html.includes('待判断效果'),entry(n).name);assert(html.includes('judgment-ready'));assert(html.includes(entry(n).name));assert.equal(html.split('data-skill-id="'+entry(n).id+'"').length-1,1);}
 get('#labelSearch').value=entry(1873).name;get('#labelSearch').listeners.input();assert(get('#labelTable').innerHTML.includes('猛毒'));
 const rows=skillLabelRows(data,labelingView(catalog,'all'));assert(rows.slice(0,934).every(e=>e.judgment==='ready'));assert.equal(rows[934].judgment,'partial');
 const edited=skillLabelRows(data,labelingView(catalog,'attack'),{['skill:'+entry(195).id]:{effect:'用户修改了效果描述'}}).find(e=>e.id===entry(195).id);assert.equal(edited.judgment,'unknown');assert.deepEqual(edited.assignedTags,[]);assert.deepEqual(edited.conditionBindings,{});
});
