import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {retargetReport,websiteCandidates} from '../dist/entry-preparation.mjs';
import {selectReaderCriticalBonuses,applyCriticalOption} from '../dist/critical-options.mjs';
import {buildBonusComparison} from '../dist/bonus-comparison.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {withReaderGroupChoices,readerGroupChoice,appendReaderGroups} from '../dist/reader-group-review.mjs';
const e=(type,target,value,extra={})=>({type,target,value,unit:type==='cap'?'':'%',...extra});
const r=(id,conditions,effects)=>({id,conditions,effects,review:'ready'});
const context={attack:'magic',damageType:'magical',element:'ice',accountBlessings:false};
const original={kind:'last-cloudia-effect-report',characterId:'generic',...evaluateCatalog([{id:'generic',name:'通用组合技能',group:'common',rules:[
 r('mixed',[],[e('damage','魔法伤害',10),e('cap','特攻伤害上限',2000),e('killerPower','特攻威力修正',50),e('damage','特攻伤害',20)]),
 r('permission',[],[e('critPermission','冰属性魔法',true,{unit:''}),e('cap','冰属性魔法伤害上限',2000)]),
 r('crit',[],[e('cap','魔法伤害上限',5000,{criticalOnly:true}),e('damage','暴击伤害',40)]),
 r('full',[{field:'fullHp',op:'eq',value:true}],[e('cap','魔法伤害上限',3000),e('damage','魔法伤害',30)]),
 r('trigger',[],[e('killer','Boss',true,{unit:''})])
]}],context)};
const select=flags=>retargetReport(original,{attack:'magic',type:'magical',element:'冰',criticalEnabled:false,specialAttack:false,fullHp:false,...flags});
test('generic mode gating removes only linked effects and preserves original effect identity',()=>{
 const off=select({}),imp=buildDamageImport(off);
 assert.equal(imp.capAdded,0);assert.equal(imp.criticalCapAdded,0);assert.equal(imp.killerCorrection,0);assert.equal(imp.magicCanCrit,false);
 assert.deepEqual(imp.effects.map(e=>e.percent),[10]);
 const row=off.rows.find(r=>r.rule.id==='mixed');assert.deepEqual(row.effectIndices,[0]);
 assert(!websiteCandidates(off).some(r=>r.effect.target.includes('特攻')));
 const killer=buildDamageImport(select({specialAttack:true}));
 assert.equal(killer.capAdded,2000);assert.equal(killer.killerCorrection,50);assert.equal(killer.bossKiller,true);
 assert(killer.effects.some(e=>e.kind==='killer'&&e.percent===20));
 const crit=buildDamageImport(select({criticalEnabled:true}));
 assert.equal(crit.capAdded,2000);assert.equal(crit.criticalCapAdded,5000);assert.equal(crit.magicCanCrit,true);
 assert.equal(buildDamageImport(select({fullHp:true})).capAdded,3000);
 assert.equal(buildDamageImport(select({criticalEnabled:true,specialAttack:true,fullHp:true})).capAdded,7000);
});
test('reader target modes and critical-only metadata obey the same switches as website rows',()=>{
 const bonuses=[
  {id:'killer',effectType:'cap',target:'特攻伤害上限',value:2000,unit:'',state:'candidate',decoded:{conditions:[]}},
  {id:'crit',effectType:'cap',target:'魔法伤害上限',value:5000,unit:'',criticalOnly:true,state:'candidate',decoded:{conditions:[]}},
  {id:'full',effectType:'damage',target:'魔法伤害',value:30,unit:'%',state:'candidate',decoded:{conditions:[{field:'fullHp',op:'eq',value:true}]}},
 ];
 const off=select({}),filtered=selectReaderCriticalBonuses(bonuses,off);
 assert(filtered.every(b=>b.optionExcludedReason));assert(!bonuses.some(b=>b.optionExcludedReason));
 assert.equal(buildBonusComparison([],filtered,off.context).length,0);
 const on=select({criticalEnabled:true,specialAttack:true,fullHp:true});
 assert(selectReaderCriticalBonuses(bonuses,on).every(b=>!b.optionExcludedReason));
 // Direct imports have the same final safeguard, even without retargetReport.
 const direct=buildDamageImport({...original,context:{...original.context,killerOverride:false,criticalEnabled:false,fullHp:false}});
 assert.equal(direct.capAdded,0);assert.equal(direct.criticalCapAdded,0);assert.equal(direct.killerCorrection,0);
 const onlyFlag={...original,context:{...original.context,criticalEnabled:false},rows:[original.rows.find(r=>r.rule.id==='crit')]};
 assert.equal(applyCriticalOption(onlyFlag).rows[0].status,'inactive');
});

test('same-source operations keep independent modes, including metadata hidden by a partial filter',()=>{
 const report={...original,...evaluateCatalog([{id:'mixed',name:'组合技能',group:'common',rules:[
  r('base',[],[e('cap','魔法伤害上限',1000)]),
  r('full',[{field:'fullHp',op:'eq',value:true}],[e('cap','魔法伤害上限',5000)]),
  r('critical',[],[e('damage','魔法伤害',10),e('cap','冰属性魔法伤害上限',2000,{criticalOnly:true})]),
 ]}],{...context,fullHp:false,criticalEnabled:false})};
 const scoped=applyCriticalOption(report);
 const bonuses=[{id:'base',effectType:'cap',target:'魔法伤害上限',value:1000,unit:'',decoded:{sourceId:'mixed',conditions:[]}},
  {id:'full',effectType:'cap',target:'魔法伤害上限',value:5000,unit:'',decoded:{sourceId:'mixed',conditions:[{field:'fullHp',op:'eq',value:true}]}},
  {id:'crit',effectType:'cap',target:'冰属性魔法伤害上限',value:2000,unit:'',decoded:{sourceId:'mixed',conditions:[]}}];
 const selected=selectReaderCriticalBonuses(bonuses,scoped);
 assert(!selected[0].optionExcludedReason);assert(selected[1].optionExcludedReason);assert(selected[2].optionExcludedReason);
 assert.deepEqual(scoped.rows.find(r=>r.rule.id==='critical').effectIndices,[0]);
 const on=applyCriticalOption({...report,context:{...report.context,criticalEnabled:true}});
 const active=selectReaderCriticalBonuses(bonuses.map(b=>({...b,state:'candidate'})),on);
 assert.equal(active[2].criticalOnly,true);assert.equal(bonuses[2].criticalOnly,undefined);
 const groups=withReaderGroupChoices(buildBonusComparison([],active,on.context));
 const choices=Object.fromEntries(groups.map(g=>[g.id,readerGroupChoice(g)]));
 const adopted=appendReaderGroups({...on,rows:[]},withReaderGroupChoices(groups,choices));
 const imported=buildDamageImport(adopted);
 assert.equal(imported.capAdded,1000);assert.equal(imported.criticalCapAdded,2000);
});
