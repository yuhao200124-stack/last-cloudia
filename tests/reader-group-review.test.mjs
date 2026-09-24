import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {websiteCandidates,compareCandidates,decisionKey,resolveReview} from '../dist/entry-preparation.mjs';
import {buildBonusComparison,effectSelectionKey} from '../dist/bonus-comparison.mjs';
import {withReaderGroupChoices,readerGroupChoice,readerGroupDecisions,appendReaderGroups} from '../dist/reader-group-review.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
const context={attack:'magic',damageType:'magical',element:'ice',criticalEnabled:true,critical:true};
const target='冰属性魔法伤害上限';
function setup(values=[5000,2000,2000,6000],readerValues=[5000,2000,6000],type='cap',label=target,unit=''){
 const sources=values.map((value,i)=>({id:`web-${i}`,name:`来源${i}`,group:'common',rules:[{id:'r',conditions:[],review:'ready',effects:[{type,target:label,value,unit}]}]}));
 const report={kind:'last-cloudia-effect-report',characterId:'generic',...evaluateCatalog(sources,context)};
 const bonuses=readerValues.map((value,i)=>({id:`read-${i}`,sourceName:`读取来源${i}`,effectType:type,target:label,value,unit,state:'candidate',decoded:{conditions:[],stage:'configuration'}}));
 const compared=compareCandidates(websiteCandidates(report),bonuses,{},report.context);
 const decisions=Object.fromEntries(compared.map(r=>[decisionKey(r),{choice:'web'}]));
 const groups=withReaderGroupChoices(buildBonusComparison(compared,bonuses,report.context,{decisions}));
 return {report,bonuses,compared,decisions,groups};
}
function adopt(s,groups=s.groups){
 const choices=Object.fromEntries(groups.map(g=>[g.id,readerGroupChoice(g)]));
 const selected=withReaderGroupChoices(groups,choices);
 const reviewed=appendReaderGroups(resolveReview(s.report,s.compared,readerGroupDecisions(selected,s.decisions)),selected);
 return {selected,reviewed,imported:buildDamageImport(reviewed),choices};
}
test('partial reader total is explicitly adoptable without requiring equal values or source counts',()=>{
 const s=setup(),g=s.groups[0];
 assert.equal(g.total,15000);assert.equal(g.readTotal,13000);assert.equal(g.fullyMapped,false);assert.equal(g.canUseReader,true);
 const {selected,reviewed,imported}=adopt(s);
 assert.equal(imported.capAdded,13000);assert.equal(reviewed.rows.length,3);
 assert.equal(selected[0].total,15000);assert.equal(selected[0].choice,'reader');
 assert(reviewed.rows.every(r=>r.origin==='readerGroup'));
 assert.equal(buildDamageImport(resolveReview(s.report,s.compared,s.decisions)).capAdded,15000);
});
test('reader percentages stay as independent operations, including reader-only and critical scopes',()=>{
 const s=setup([35],[20,15,1],'damage','魔法伤害','%');
 s.bonuses[2].decoded.triggerConditions=[{field:'critical',op:'eq',value:true}];
 const groups=withReaderGroupChoices(buildBonusComparison(s.compared,s.bonuses,s.report.context,{decisions:s.decisions}));
 const {imported}=adopt(s,groups);
 assert.deepEqual(imported.effects.map(e=>e.percent),[20,15,1]);
 assert.deepEqual(imported.effects.map(e=>e.criticalOnly),[false,false,true]);
 assert.equal(imported.effects.filter(e=>e.name.includes('读取来源2')).length,1);
});
test('unknown scope, disabled, nonmatching and missing reader entries do not enable adoption',()=>{
 const s=setup();
 const values=[{...s.bonuses[0],decoded:undefined},{...s.bonuses[1],state:'disabled'},
  {...s.bonuses[2],decoded:{conditions:[{field:'element',op:'eq',value:'fire'}]}}];
 const g=withReaderGroupChoices(buildBonusComparison(s.compared,values,s.report.context))[0];
 assert.equal(g.readTotal,null);assert.equal(g.canUseReader,false);
});
test('deletion excludes a mapped reader record while retaining its raw comparison subtotal',()=>{
 const s=setup();s.bonuses[0].decoded.sourceId='web-0';
 const compared=compareCandidates(websiteCandidates(s.report),s.bonuses,{},s.report.context);
 const groups=withReaderGroupChoices(buildBonusComparison(compared,s.bonuses,s.report.context));
 const approved=Object.fromEntries(groups.map(g=>[g.id,readerGroupChoice(g)]));
 const removed={[effectSelectionKey(compared[0])]:{}};
 const next=withReaderGroupChoices(buildBonusComparison(compared,s.bonuses,s.report.context,{removed}),approved);
 assert.equal(next[0].total,10000);assert.equal(next[0].readTotal,13000);assert.equal(next[0].adoptableTotal,8000);
 assert.equal(next[0].readerGroupSelected,true);
 const decisions={...s.decisions,[decisionKey(compared[0])]:{choice:'exclude'}};
 const reviewed=appendReaderGroups(resolveReview(s.report,compared,readerGroupDecisions(next,decisions)),next);
 assert.equal(buildDamageImport(reviewed).capAdded,8000);
});
test('approved subsets follow conditions; new values, entries or order need another explicit choice',()=>{
 const s=setup(),{choices}=adopt(s);
 const get=bonuses=>withReaderGroupChoices(buildBonusComparison(s.compared,bonuses,s.report.context),choices)[0];
 assert.equal(get(s.bonuses.slice(1)).choice,'reader');
 for(const bonuses of [[...s.bonuses,{...s.bonuses[0],id:'new'}],s.bonuses.toReversed(),s.bonuses.map((b,i)=>i===0?{...b,value:4999}:b)]){
  const group=get(bonuses);assert.equal(group.choice,'pending');assert.equal(group.readerGroupStale,true);
  assert.throws(()=>readerGroupDecisions([group],s.decisions),/重新选择/);
 }
});
test('deleting one mapped operation does not remove another operation from the same source',()=>{
 const s=setup([10,20],[10,20],'damage','魔法伤害','%');
 for(const b of s.bonuses)b.decoded.sourceId='same-source';
 const compared=s.compared.map((r,i)=>({...r,sourceId:'same-source',reader:s.bonuses[i],compatible:true}));
 const removed={[effectSelectionKey(compared[0])]:{}};
 const g=withReaderGroupChoices(buildBonusComparison(compared,s.bonuses,s.report.context,{removed}))[0];
 assert.equal(g.readTotal,30);assert.equal(g.total,20);assert.equal(g.adoptableTotal,20);
 assert.deepEqual(g.adoptableReader.map(b=>b.id),['read-1']);
});
test('known character ownership and critical-rate stage survive group adoption',()=>{
 const s=setup([5],[5],'critRate','冰属性攻击暴击率','%');
 s.bonuses[0].decoded={conditions:[],stage:'attack',sourceId:'water-king'};
 const groups=withReaderGroupChoices(buildBonusComparison(s.compared,s.bonuses,s.report.context));
 const adopted=adopt(s,groups);
 assert(adopted.imported.blockers.some(x=>x.includes('角色专属')));
 const correct=buildDamageImport({...adopted.reviewed,characterId:'260'});
 assert.equal(correct.critAttackAdded,5);assert.equal(correct.critUnresolved.length,0);
});
