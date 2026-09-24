import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {retargetReport,validateBattleEntry,websiteCandidates,compareCandidates,resolveReview,decisionKey} from '../dist/entry-preparation.mjs';
import {evaluateReaderBonuses,readerBonusState} from '../dist/reader-bonus-decoder.mjs';
import {selectReaderCriticalBonuses} from '../dist/critical-options.mjs';
import {buildBonusComparison} from '../dist/bonus-comparison.mjs';
import {readerSupplementCandidates,appendReaderSupplements,supplementKey} from '../dist/reader-supplements.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {defaultInput,calculate} from '../dist/damage-engine.mjs';
const context={attack:'magic',damageType:'magical',element:'ice',weaponCount:1,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe'],fullHp:true,chainStacks:1,accountBlessings:true};
const fixture=JSON.parse(readFileSync(new URL('./fixtures/roxy-reader-bonuses.json',import.meta.url)));
const unit=validateBattleEntry({kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{...fixture,stats:{}}]}).units[0];
const original={kind:'last-cloudia-effect-report',characterId:'260',...evaluateCatalog(CATALOG,context)};
function review(criticalEnabled,report=original){
 const selected=retargetReport(report,{attack:'magic',type:'magical',element:'冰',criticalEnabled});
 const bonuses=selectReaderCriticalBonuses(evaluateReaderBonuses(unit.bonuses,selected.context),selected);
 const compared=compareCandidates(websiteCandidates(selected),bonuses,{},selected.context);
 const decisions=Object.fromEntries(compared.map(r=>[decisionKey(r),{choice:'web'}]));
 return {selected,bonuses,compared,groups:buildBonusComparison(compared,bonuses,selected.context),imported:buildDamageImport(resolveReview(selected,compared,decisions))};
}
test('critical toggle links website, decoded reader, fixed permission-skill cap and critical damage without deleting evidence',()=>{
 const raw=JSON.stringify(unit),on=review(true),off=review(false),back=review(true);
 const cap=r=>r.groups.find(g=>g.target==='冰属性魔法伤害上限');
 assert.equal(cap(on).total,15000);assert.equal(cap(on).readTotal,15000);
 assert.equal(cap(off).total,13000);assert.equal(cap(off).readTotal,13000);
 assert.equal(on.imported.capAdded-off.imported.capAdded,2000);
 assert.equal(on.imported.criticalCapAdded,0,'permission skill cap is a fixed cap, not critical-only');
 assert.equal(on.imported.magicCanCrit,true);assert.equal(off.imported.magicCanCrit,false);
 assert(on.groups.some(g=>g.target==='冰属性暴击伤害'));
 assert(!off.groups.some(g=>g.target.includes('暴击')));
 assert(!off.imported.effects.some(e=>e.kind==='critical'));
 assert(off.bonuses.some(b=>b.raw.localId===26634&&b.effectType==='cap'&&readerBonusState(b,off.selected.context).status==='inactive'));
 assert(!readerSupplementCandidates(off.bonuses,off.compared,off.selected.context).some(b=>b.target.includes('暴击')));
 assert.equal(JSON.stringify(unit),raw);assert.deepEqual(back.imported,on.imported);
 assert.deepEqual(off.selected.context.equipmentIds,on.selected.context.equipmentIds);
});
test('critical-only caps and conditional damage stay out of the ordinary branch and have separate comparison groups',()=>{
 const rule=(id,conditions,effects)=>({id,conditions,effects,review:'ready'});
 const report={kind:'last-cloudia-effect-report',characterId:'generic',...evaluateCatalog([{id:'generic',name:'组合效果',group:'common',rules:[
  rule('fixed',[],[{type:'cap',target:'魔法伤害上限',value:1000,unit:''}]),
  rule('critical',[{field:'critical',op:'eq',value:true}],[{type:'damage',target:'魔法伤害',value:50,unit:'%'},{type:'cap',target:'魔法伤害上限',value:5000,unit:''}]),
 ]}],{...context,accountBlessings:false})};
 const on=review(true,report),off=review(false,report);
 assert.equal(on.imported.capAdded,1000);assert.equal(off.imported.capAdded,1000);assert.equal(on.imported.criticalCapAdded,5000);
 assert.equal(on.groups.filter(g=>g.target==='魔法伤害上限').length,2);
 assert(on.groups.some(g=>g.target==='魔法伤害上限'&&g.criticalOnly&&g.total===5000));
 const s={...defaultInput(),attack:100000,defense:0,coefficient:1,skillPercent:0,type:'magical',skillType:'magic',element:'冰',critRate:0,cap:2000};
 const base=calculate({...s,effects:[]}),result=calculate({...s,effects:on.imported.effects,criticalCapAdded:on.imported.criticalCapAdded});
 assert.equal(result.normal.max,2000);assert.equal(result.critical.max,7000);assert.equal(result.normal.mean,base.normal.mean);assert.equal(result.totalMean,base.totalMean);
 const uncapped=calculate({...s,cap:1000000,effects:on.imported.effects}),control=calculate({...s,cap:1000000,effects:[]});
 assert.equal(uncapped.normal.max,control.normal.max);assert(uncapped.critical.max>control.critical.max);
});
test('reader-only critical trigger remains conditional after adoption',()=>{
 const b={id:'extra',effectType:'damage',target:'魔法伤害',value:25,unit:'%',state:'candidate',decoded:{stage:'configuration',conditions:[{field:'attackKind',op:'eq',value:'magic'}],triggerConditions:[{field:'critical',op:'eq',value:true}]}};
 const report={kind:'last-cloudia-effect-report',characterId:'generic',...evaluateCatalog([],{...context,criticalEnabled:true,critical:true})};
 const r=appendReaderSupplements(report,[b],[],{[supplementKey(b)]:'reader'}),imported=buildDamageImport(r);
 assert.equal(imported.effects[0].criticalOnly,true);
 const off=selectReaderCriticalBonuses([b],{...report,context:{...report.context,criticalEnabled:false}});
 assert.equal(readerSupplementCandidates(off,[],report.context).length,0);
});
