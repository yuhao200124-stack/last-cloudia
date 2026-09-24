import test from 'node:test';
import assert from 'node:assert/strict';
import {readBossRecord,readMoveParameters} from '../dist/battle-entry-data.mjs';
import {retargetReport,websiteCandidates,compareCandidates,decisionKey,resolveReview} from '../dist/entry-preparation.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
test('Boss report uses separate DEF/MND, preserves negative resistance, does not guess absent race',()=>{
 const boss=readBossRecord({name:'龙',stats:{defense:4000,mind:10000},race:null,resistances:{ice:-25}});
 assert.equal(boss.def,4000);assert.equal(boss.mnd,10000);assert.equal(boss.res[1],-25);assert.equal(boss.res[0],null);assert.deepEqual(boss.races,[]);
});
test('old reports leave skill parameters empty; equal verified process layouts can fill parameters without hits',()=>{
 const move={name:'伯雷亞斯拳',kind:'s1'};
 assert.deepEqual(readMoveParameters({bonuses:[]},move).parameters,{});
 const skill={name:move.name,processes:[{function:'process10001',params:[0,5180,3340]},{function:'process10001',params:[0,5180,3340]}]};
 assert.deepEqual(readMoveParameters({skills:[skill]},move).parameters,{skillAdd:0,skillPercent:51.8,coefficient:.334,skillPostAdd:0});
 skill.processes[1].params[2]=5000;assert.deepEqual(readMoveParameters({skills:[skill]},move).parameters,{});
 skill.processes=[{function:'process10002',params:[0,5180,3340]}];assert.deepEqual(readMoveParameters({skills:[skill]},move).parameters,{});
});
test('explicit special-attack switch overrides eligibility and requires review for newly activated modifiers',()=>{
 const report={kind:'last-cloudia-effect-report',characterId:'260',...evaluateCatalog(CATALOG,{weaponCount:1,staff:true,robe:true})};
 const selection={attack:'magic',type:'magical',element:'冰',specialAttack:false,break:false};
 const off=retargetReport(report,selection);assert.equal(off.context.killer,false);
 assert.equal(off.rows.some(r=>r.status==='active'&&r.rule.effects.some(e=>e.target==='特攻伤害')),false);
 const rows=compareCandidates(websiteCandidates(off),[]),decisions=Object.fromEntries(rows.map(r=>[decisionKey(r),{choice:'web'}]));
 const on=retargetReport(report,{...selection,specialAttack:true,break:true});assert.equal(on.context.killer,true);assert.equal(on.context.break,true);
 assert.throws(()=>resolveReview(on,compareCandidates(websiteCandidates(on),[]),decisions),/请决定/);
 const dual=retargetReport(report,{...selection,dualWield:true});assert.equal(dual.context.weaponCount,1);assert.equal(dual.context.robe,true);
 assert.equal(dual.rows.some(r=>r.status==='active'&&r.rule.id==='water-single'),true);
});
