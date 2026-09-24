import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT_BLESSING_CATALOG as catalog,RAW_BLESSING_RECORDS,decodeKnownBlessingEntry} from '../dist/account-blessings.mjs';
import {withAccountBlessings} from '../dist/account-blessings-panel.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {validateBattleEntry,websiteCandidates,compareCandidates,resolveReview,decisionKey} from '../dist/entry-preparation.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {buildBonusComparison} from '../dist/bonus-comparison.mjs';
import {readerBonusState} from '../dist/reader-bonus-decoder.mjs';

const base={hp:11252,mp:486,attack:1232,defense:1733,intelligence:1574,mind:2056};
test('Lucia control six stats match max-growth base plus account blessings',()=>{
 assert.deepEqual(withAccountBlessings(base),{hp:12039,mp:500,attack:1281,defense:1784,intelligence:1621,mind:2158});
 assert.equal(catalog.length,46);
});
test('element and weapon blessings respect current attack rather than all stacking',()=>{
 const r=evaluateCatalog(catalog,{attack:'magic',damageType:'magical',weaponCount:1,staff:true,element:'ice'});
 const rows=r.rows.filter(r=>r.status==='active');
 assert(rows.some(r=>r.rule.effects.some(e=>e.type==='damage'&&e.value===4.06&&e.target==='冰属性伤害')));
 assert(!rows.some(r=>r.rule.effects.some(e=>e.type==='damage'&&e.target==='暗属性伤害')));
 const naked=evaluateCatalog(catalog,{attack:'normal',damageType:'physical',weaponCount:0,sword:true,staff:true,element:'none'});
 assert(!naked.rows.some(r=>r.status==='active'&&r.rule.conditions.some(c=>['sword','staff'].includes(c.field))));
});
test('disabled and excluded stat blessings are not included again in base-panel choice',()=>{
 const report={kind:'last-cloudia-effect-report',...evaluateCatalog(catalog,{weaponCount:0,attack:'normal',damageType:'physical',element:'none'})};
 const rows=compareCandidates(websiteCandidates(report),[]);
 const decisions=Object.fromEntries(rows.map(r=>[decisionKey(r),{choice:r.effect.type==='stat'&&r.effect.target==='攻击力'?'exclude':'web'}]));
 const resolved=resolveReview(report,rows,decisions);
 assert.equal(withAccountBlessings(base,resolved).attack,1232);
 assert.equal(withAccountBlessings(base,resolved).intelligence,1621);
 const imported=buildDamageImport(resolved);
 assert(!imported.effects.some(e=>e.effect?.type==='stat'));
});
test('only v0.35 real process-memory MP is migrated, original is retained, migration is idempotent',()=>{
 const r={kind:'last-cloudia-battle-entry',schemaVersion:1,readerVersion:'0.35',statsBasis:'battle-final-at-observation',collection:{method:'read_only_process_memory'},units:[{stats:{mp:500580},current:{mp:495800},bonuses:[]}]};
 const migrated=validateBattleEntry(r);
 assert.equal(migrated.units[0].stats.mp,500);
 assert.equal(migrated.units[0].current.mp,495);
 assert.equal(migrated.units[0].mpRawThousandths.maximum,500580);
 assert.equal(r.units[0].stats.mp,500580);
 assert.equal(validateBattleEntry(migrated).units[0].stats.mp,500);
 assert.equal(validateBattleEntry({...r,readerVersion:'0.36'}).units[0].stats.mp,500580);
 assert.equal(validateBattleEntry({...r,testFixture:true}).units[0].stats.mp,500580);
});

// v0.36 exporter fallback names 19 scalar configurations; its other fields are unchanged.
function reader036Blessings(){
 return structuredClone(RAW_BLESSING_RECORDS).map(b=>{
  if([1050253,1050463,1050415,1050200,1050513].includes(b.processId)){
   b.raw.component='mapped_configured_parameter';b.id=b.id.replace('unmapped_operation',b.raw.component);
   b.effectType='unknown';b.target='导出摘要';b.value=null;
  }
  return b;
 });
}
const reportFrom=bonuses=>({kind:'last-cloudia-battle-entry',schemaVersion:1,readerVersion:'0.36',units:[{stats:{},bonuses}]});
test('v0.35 and v0.36 identify all 46 account blessings without adding records or trusting summary values',()=>{
 for(const source of [RAW_BLESSING_RECORDS,reader036Blessings()]){
  const imported=validateBattleEntry(reportFrom(source)),bs=imported.units[0].bonuses;
  assert.equal(bs.length,46);assert.equal(bs.filter(b=>b.decoded?.accountBlessing).length,46);
  assert(bs.every(b=>b.sourceName.startsWith('加护 · ')&&b.state==='candidate'));
  const byId=id=>bs.find(b=>b.raw.localId===id);
  assert.equal(byId(60002070).value,-1);assert.match(byId(60002070).decoded.accountBlessing.description,/装备长袍.*受到的物理伤害-1%/);
  assert.equal(byId(60002800).target,'受到的冰属性伤害');assert.equal(byId(60002800).value,-1.99);
  assert.equal(byId(60003340).value,2.01);assert.equal(byId(60001500).value,200);
  assert.deepEqual(bs.map(b=>b.raw),source.map(b=>b.raw));
  assert.deepEqual(validateBattleEntry(imported).units[0].bonuses.map(b=>[b.id,b.value,b.effectType,b.target]),bs.map(b=>[b.id,b.value,b.effectType,b.target]));
 }
});
test('blessing compatibility changes only the exporter label; new values and unverified scopes remain distinct',()=>{
 const b=reader036Blessings().find(b=>b.raw.localId===60003340);b.raw.values[1]=314;
 const d=decodeKnownBlessingEntry(b);assert.equal(d.value,3.14);assert.match(d.decoded.accountBlessing.description,/3.14%/);
 const report=evaluateCatalog(catalog,{attack:'ultimate',element:'fire'}),rows=compareCandidates(websiteCandidates(report),[d],{},report.context);
 assert(Math.abs(rows.find(r=>r.sourceId==='account-blessing-60003340').difference-1.13)<1e-10);
 for(const change of [r=>r.values[0]=2,r=>r.values[9]=1,r=>r.conditionParams[0]=0,r=>r.function='process1050450',r=>r.affiliation=1,r=>r.component='variable_parameter_not_actual',r=>r.component='mapped_parameter_missing',r=>r.component='mul']){
  const bad=structuredClone(b);change(bad.raw);assert.equal(decodeKnownBlessingEntry(bad).decoded,undefined);
 }
 const stats=structuredClone(RAW_BLESSING_RECORDS.find(b=>b.effectType==='stat'));stats.raw.component='mapped_configured_parameter';
 assert.equal(decodeKnownBlessingEntry(stats).decoded,undefined);
});
test('recognized blessing inventory does not activate fire, ultimate or incoming reductions for ice magic',()=>{
 const bonuses=validateBattleEntry(reportFrom(reader036Blessings())).units[0].bonuses;
 const report=evaluateCatalog(catalog,{attack:'magic',damageType:'magical',element:'ice',weaponCount:1,robe:true,staff:true});
 const rows=compareCandidates(websiteCandidates(report),bonuses,{},report.context);
 const groups=buildBonusComparison(rows,bonuses,report.context);
 assert.equal(readerBonusState(bonuses.find(b=>b.raw.localId===60003340),report.context).status,'inactive');
 assert.equal(readerBonusState(bonuses.find(b=>b.raw.localId===60001500),report.context).status,'inactive');
 assert(!groups.some(g=>g.type==='defense'||/超必杀|火属性/.test(g.target)));
 assert.equal(groups.find(g=>g.target==='冰属性伤害').readTotal,4.06);
 assert.equal(groups.find(g=>g.target==='冰属性伤害上限').readTotal,100);
 const incoming=bonuses.find(b=>b.raw.localId===60002800);
 assert.notEqual(readerBonusState(incoming,report.context).status,'active');
 assert.equal(readerBonusState(incoming,{...report.context,incomingElement:'ice'}).status,'active');
});
