import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {ACCOUNT_BLESSING_CATALOG} from '../dist/account-blessings.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {validateBattleEntry,websiteCandidates,compareCandidates,resolveReview,decisionKey} from '../dist/entry-preparation.mjs';
import {evaluateReaderBonuses,readerBonusState,observedCritical} from '../dist/reader-bonus-decoder.mjs';
import {buildBonusComparison} from '../dist/bonus-comparison.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/roxy-reader-bonuses.json',import.meta.url)));
const input=()=>({schemaVersion:1,kind:'last-cloudia-battle-entry',units:[{...structuredClone(fixture),stats:{}}]});
function setup(ctx={},raw=input()){
 const unit=validateBattleEntry(raw).units[0];
 const report={kind:'last-cloudia-effect-report',characterId:'260',...evaluateCatalog([...CATALOG,...ACCOUNT_BLESSING_CATALOG],{weaponCount:1,staff:true,robe:true,fullHp:true,resonance:true,chainStacks:2,penetration:true,equipmentIds:['roxy-staff','roxy-robe'],...ctx})};
 const bonuses=evaluateReaderBonuses(unit.bonuses,report.context),compared=compareCandidates(websiteCandidates(report),bonuses,{},report.context);
 return {unit,report,bonuses,compared,groups:buildBonusComparison(compared,bonuses,report.context)};
}
test('real report accounts for all numeric offensive groups across weapons and attacks',()=>{
 for(const ctx of [{},{weaponCount:2},{weaponCount:0},{attack:'s1',damageType:'physical'},{attack:'ultimate',damageType:'physical'}]){
  const s=setup(ctx);
  for(const g of s.groups){assert.equal(g.readTotal,g.total,JSON.stringify(ctx)+g.target);assert(g.fullyMapped,g.target);}
 }
 const s=setup();assert.equal(s.groups.find(g=>g.target==='冰属性伤害').readTotal,114.06);
 assert.equal(s.groups.find(g=>g.target==='冰属性伤害上限').readTotal,112100);
 assert.equal(s.bonuses.filter(b=>b.decoded?.refreshFamily).length,1);
 assert.equal(s.bonuses.filter(b=>b.coveredBy).length,6);
 assert.equal(s.bonuses.filter(b=>readerBonusState(b,s.report.context).status==='unresolved').length,0);
 assert(s.bonuses.every(b=>b.state==='candidate'),'decoding must not promote configuration to observed');
});
test('conditional counters change with selections and disabled controllers cannot create extra caps',()=>{
 const single=setup(),dual=setup({weaponCount:2});
 const cap=s=>s.bonuses.find(b=>b.decoded?.sourceId==='killer-cap-v'&&b.effectType==='cap'&&b.decoded.killerBase);
 assert.equal(cap(single).value,15000);assert.equal(cap(dual).value,7500);
 const raw=input(),controller=raw.units[0].bonuses.find(b=>b.raw.localId===28180&&b.processId===1081631);controller.raw.buffEnabled=0;
 const stopped=setup({},raw);assert.equal(cap(stopped).value,7500);
 assert(stopped.bonuses.some(b=>b.processId===1082699&&b.raw.localId===28180&&b.value===null));
});
test('HP, resonance, chain and element conditions use current choices instead of maxima',()=>{
 const s=setup({fullHp:false,resonance:false,chainStacks:0});
 assert.equal(s.groups.find(g=>g.target==='冰属性伤害').readTotal,84.06);
 assert.equal(s.groups.find(g=>g.target==='暴击率').readTotal,8);
 assert.equal(s.groups.find(g=>g.target==='魔法伤害').readTotal,36); // 杖20 + 袍15 + 雷尼烏斯的加護(长袍·魔法伤害)1；链击0
 const phys=setup({attack:'s1',damageType:'physical'});
 const dynamic=phys.bonuses.find(b=>b.processId===1082627);assert.equal(dynamic.value,null);assert.notEqual(readerBonusState(dynamic,phys.report.context).status,'active');
});
test('raw evidence is authoritative; removed records and forged decoded metadata cannot be adopted',()=>{
 const raw=input(),crit=raw.units[0].bonuses.find(b=>b.processId===1030400);crit.decoded={conditions:[]};crit.raw.function='invalid';
 assert.notEqual(readerBonusState(setup({},raw).unit.bonuses.find(b=>b.id===crit.id),{}).status,'active');
 const removed=input(),entry=removed.units[0].bonuses.find(b=>b.processId===1030400);entry.raw.buffRemoved=1;
 const s=setup({},removed),row=s.compared.find(r=>r.sourceId==='critical-up-iii');assert.equal(row.compatible,false);
 assert.throws(()=>resolveReview(s.report,s.compared,Object.fromEntries(s.compared.map(r=>[decisionKey(r),{choice:r===row?'reader':'web'}]))),/不符合/);
});
test('CRT panel and attack additions remain separate and killer power is applied once',()=>{
 const s=setup(),d=Object.fromEntries(s.compared.map(r=>[decisionKey(r),{choice:'web'}]));
 const imported=buildDamageImport(resolveReview(s.report,s.compared,d));
 assert.equal(observedCritical(s.unit).value,11);assert.equal(imported.critAdded,23);assert.equal(imported.critAttackAdded,5);assert.deepEqual(imported.critUnresolved,[]);
 assert.equal(imported.killerCorrection,50);assert(!imported.effects.some(e=>e.name.startsWith('特攻增幅')));
 const old={id:'special-boost',name:'特攻增幅',text:'触发特攻时伤害+50%',group:'common',rules:[{id:'s',review:'ready',conditions:[{field:'killer',op:'eq',value:true}],effects:[{type:'damage',target:'特攻伤害',value:50,unit:'%'}]}]};
 assert.equal(evaluateCatalog([old],{killer:true}).rows[0].rule.effects[0].type,'killerPower');
 const modified=evaluateCatalog([old],{killer:true},{s:{effects:[{type:'damage',target:'特攻伤害',value:70,unit:'%'}]}});assert.equal(modified.rows[0].status,'pending');
});
test('reader multi-magic configuration adopts both hit values and records their origin',()=>{
 const s=setup(),hit=s.compared.find(r=>r.effect.type==='hit');
 assert(hit.compatible);assert.equal(hit.reader.value,2);assert.equal(hit.reader.secondary,0.6);
 const d=Object.fromEntries(s.compared.map(r=>[decisionKey(r),{choice:r===hit?'reader':'web'}]));
 const imported=buildDamageImport(resolveReview(s.report,s.compared,d));
 assert.equal(imported.hitMultiplier,2);assert.equal(imported.hitDamageRatio,0.6);assert.equal(imported.hitSourceKind,'reader');
 const changed=input();changed.units[0].bonuses.find(b=>b.processId===1082501&&!b.raw.masterFunction).raw.values[7]=7500;
 const next=setup({},changed),newHit=next.compared.find(r=>r.effect.type==='hit');
 assert(newHit.compatible);assert.match(newHit.comparison,/数值不同/);
 assert.notEqual(decisionKey(hit),decisionKey(newHit),'changing only the per-hit ratio requires a new choice');
 assert.throws(()=>resolveReview(next.report,next.compared,d),/请决定/);
 const chosen=Object.fromEntries(next.compared.map(r=>[decisionKey(r),{choice:r===newHit?'reader':'web'}]));
 assert.equal(buildDamageImport(resolveReview(next.report,next.compared,chosen)).hitDamageRatio,0.75);
 const incomplete={...newHit.reader,secondary:null};
 assert.equal(compareCandidates([newHit],[incomplete],{},next.report.context)[0].compatible,false);
 const fire={...s.report.context,element:'fire'};
 assert.equal(compareCandidates([hit],[hit.reader],{},fire)[0].compatible,false);
 d[decisionKey(hit)]={choice:'exclude'};
 const excluded=buildDamageImport(resolveReview(s.report,s.compared,d));
 assert.equal(excluded.hitMultiplier,1);assert.equal(excluded.hitDamageRatio,1);assert.equal(excluded.hitSourceKind,null);
});
