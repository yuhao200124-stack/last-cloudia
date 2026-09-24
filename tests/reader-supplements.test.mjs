import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBattleEntry} from '../dist/entry-preparation.mjs';
import {readerSupplementCandidates,appendReaderSupplements,supplementKey,includeSupplementGroups} from '../dist/reader-supplements.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {normalizeContext} from '../dist/effect-rule-engine.mjs';
const raw={id:'100:60002460:0:mapped_configured_parameter',sourceName:'被动技能 ID=60002460',effectType:'damage',target:'魔法伤害修正',value:1,unit:'%',state:'candidate',processId:1050354,conditionId:27026,
 raw:{buffUid:100,passiveId:0,localId:60002460,affiliation:4,operationIndex:0,operationFlag:1,operationActive:1,buffEnabled:1,buffActive:0,buffRemoved:0,buffIgnored:0,trigger:27,component:'mapped_configured_parameter',add:0,mul:0,postAdd:0,mulDenominator:10000,flags:0,statType:0,values:[22,100,0,0,0,0,0,0,0,0],function:'process1050354',masterFunction:'',conditionParams:[1,1,2,1,1],masterCondition:0,masterConditionParams:[],parameterMeaningRecognized:false,appliedToHit:null}};
const decode=b=>validateBattleEntry({kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{stats:{},bonuses:[b]}]}).units[0].bonuses[0];
const context=normalizeContext({attack:'magic',damageType:'magical',element:'ice',robe:true});
const report={kind:'last-cloudia-effect-report',characterId:'roxy',rows:[],context};
test('real robe configuration is offered without classifying it as a confirmed account blessing',()=>{
 const b=decode(raw),candidates=readerSupplementCandidates([b,b],[],context);
 assert.equal(candidates.length,1);assert.equal(b.target,'魔法伤害');assert.equal(b.value,1);assert(!b.decoded.accountBlessing);
 const empty=appendReaderSupplements(report,[b],[],{});assert.equal(empty.rows.length,0);
 const adopted=appendReaderSupplements(report,[b,b],[],{[supplementKey(b)]:'reader'});
 assert.equal(adopted.rows.length,1);assert.equal(adopted.rows[0].origin,'readerSupplement');
 const imp=buildDamageImport(adopted);assert.equal(imp.effects.length,1);assert.equal(imp.effects[0].percent,1);
 assert.equal(appendReaderSupplements(report,[b],[],{[supplementKey(b)]:'web'}).rows.length,0);
});
test('group reader adoption includes only verified unmatched supplements; website totals stay unchanged',()=>{
 const b=decode(raw),old={id:'existing',value:39};
 const group={web:[{compatible:true,reader:old}],reader:[old,b],total:39,readTotal:40,choice:'web',canUseReader:false};
 const result=includeSupplementGroups([group],[b],{})[0];assert(result.canUseReader);assert.equal(result.total,39);assert.equal(result.readTotal,40);
 assert.equal(result.supplements.length,1);assert.equal(result.choice,'web');
 assert.equal(includeSupplementGroups([{...group,choice:'reader'}],[b],{[supplementKey(b)]:'reader'})[0].choice,'reader');
 assert.equal(includeSupplementGroups([{...group,reader:[old,b,{id:'unknown'}]}],[b],{})[0].canUseReader,false);
 assert.equal(includeSupplementGroups([{...group,web:[{compatible:false,reader:old}]}],[b],{})[0].canUseReader,false);
});
test('inactive equipment, mapped sources and changed signatures cannot silently supplement',()=>{
 const b=decode(raw),choice={[supplementKey(b)]:'reader'};
 assert.equal(readerSupplementCandidates([b],[{reader:b}],context).length,0);
 assert.equal(readerSupplementCandidates([b],[],{...context,robe:false}).length,0);
 assert.equal(readerSupplementCandidates([b],[],normalizeContext({attack:'normal',robe:true})).length,0);
 for(const field of ['buffRemoved','buffIgnored']){const bad=structuredClone(raw);bad.raw[field]=1;assert.equal(readerSupplementCandidates([decode(bad)],[],context).length,0);}
 const changed=structuredClone(raw);changed.raw.values[1]=200;
 assert.equal(appendReaderSupplements(report,[decode(changed)],[],choice).rows.length,0);
 const unknown=structuredClone(raw);unknown.raw.conditionParams[0]=9;
 assert.equal(readerSupplementCandidates([decode(unknown)],[],context).length,0);
});
