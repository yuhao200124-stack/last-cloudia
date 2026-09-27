import test from 'node:test';
import assert from 'node:assert/strict';
import {retargetReport,websiteCandidates,compareCandidates,decisionKey,resolveReview,validateBattleEntry} from '../dist/entry-preparation.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
const initial=()=>({kind:'last-cloudia-effect-report',characterId:'260',...evaluateCatalog(CATALOG,{weaponCount:1,staff:true,robe:true})});
const magic=()=>retargetReport(initial(),{attack:'magic',type:'magical',element:'冰'});
const decisions=rows=>Object.fromEntries(rows.map(r=>[decisionKey(r),{choice:'web'}]));
test('damage-page dual wield never changes weapon count, equipment or qualifying bonuses',()=>{
 const source={...initial(),profile:{equipment:[{name:'洛琪希的衣服',type:'长袍'}]}};
 source.context.equipmentIds=['roxy-staff','roxy-robe'];
 const s={attack:'magic',type:'magical',element:'冰'};
 const off=retargetReport(source,{...s,dualWield:false}),on=retargetReport(source,{...s,dualWield:true});
 assert.deepEqual(on,off);assert.equal(on.context.weaponCount,1);assert.deepEqual(on.context.equipmentIds,['roxy-staff','roxy-robe']);
 const two={...source,context:{...source.context,weaponCount:2}};
 assert.equal(retargetReport(two,{...s,dualWield:false}).context.weaponCount,2);
});
test('changing magic to normal clears derived killer eligibility',()=>{
 const r=retargetReport(initial(),{attack:'normal',type:'physical',element:'无'});
 assert.equal(r.context.killer,false);
 assert.equal(r.rows.some(r=>r.status==='active'&&r.rule.conditions.some(c=>c.field==='killer')),false);
});
test('heavy magic inherits magic conditions and is itself a non-stackable magic cast (resonance)',()=>{
 const r=retargetReport(initial(),{attack:'heavy_magic',type:'magical',element:'冰'});
 assert.equal(r.context.attackKind,'magic');assert.equal(r.context.resonance,true,'game: 魔術共鳴 buff is granted while our non-stackable magic is being cast');
 assert.equal(retargetReport(initial(),{attack:'magic',type:'magical',element:'冰'}).context.resonance,false);
 assert(r.rows.some(r=>r.status==='active'&&r.rule.effects.some(e=>e.type==='hit')));
});
test('unresolved choices cannot be silently applied',()=>{
 const r=magic(),rows=compareCandidates(websiteCandidates(r),[]);
 assert.throws(()=>resolveReview(r,rows,{}),/请决定/);
 const final=resolveReview(r,rows,decisions(rows));assert(final.reviewedByUser);
});
test('excluding killer rechecks dependent damage and cap effects',()=>{
 const r=magic(),rows=compareCandidates(websiteCandidates(r),[]),d=decisions(rows);
 for(const row of rows.filter(r=>r.effect.type==='killer'))d[decisionKey(row)]={choice:'exclude'};
 const final=resolveReview(r,rows,d);assert.equal(final.context.killer,false);
 assert(final.rows.some(r=>r.status==='inactive'&&r.rule.conditions.some(c=>c.field==='killer')));
 assert.equal(final.rows.some(r=>r.status==='active'&&r.rule.conditions.some(c=>c.field==='killer')),false);
});
test('null reader values and mismatched value types are not a valid zero replacement',()=>{
 const web=[{id:'a',sourceName:'test',effect:{type:'damage',target:'魔法伤害',value:20,unit:'%'}}];
 for(const value of [null,'20',true]){
  const [row]=compareCandidates(web,[{id:'b',sourceName:'test',effectType:'damage',target:'魔法伤害',value,unit:'%'}]);
  assert.equal(row.compatible,false);assert.equal(row.difference,null);
 }
 const [row]=compareCandidates(web,[{id:'b',sourceName:'test',effectType:'damage',target:'魔法伤害',value:0,unit:'%',state:'candidate'}]);
 assert.equal(row.compatible,true);assert.equal(row.difference,-20);assert.match(row.comparison,/待选择/);
});
test('ambiguous reader mappings remain unassigned; candidate state is preserved',()=>{
 const web=[{id:'a',sourceName:'test',effect:{type:'damage',target:'魔法伤害',value:20,unit:'%'}}];
 const b={sourceName:'test',effectType:'damage',target:'魔法伤害',value:20,unit:'%',state:'candidate'};
 assert.equal(compareCandidates(web,[{...b,id:'1'},{...b,id:'2'}])[0].reader,null);
 const row=compareCandidates(web,[{...b,id:'1'},{...b,id:'2'}],{a:'2'})[0];
 assert.equal(row.reader.state,'candidate');assert.match(row.comparison,/仍待确认/);
});
test('one reader field cannot be counted for two website effects',()=>{
 const r=magic(),rows=compareCandidates(websiteCandidates(r),[]),d=decisions(rows);
 const damage=rows.filter(r=>r.effect.type==='damage').slice(0,2);
 for(const row of damage){row.reader={id:'same',value:20};row.compatible=true;d[decisionKey(row)]={choice:'reader'};}
 assert.throws(()=>resolveReview(r,rows,d),/不能重复/);
});
test('condition and evidence changes invalidate stored decisions',()=>{
 const row={id:'x',effect:{value:10},condition:[{field:'fullHp',value:true}],reader:{id:'r',value:10,state:'candidate'}};
 assert.notEqual(decisionKey(row),decisionKey({...row,condition:[{field:'lowHp',value:true}]}));
 assert.notEqual(decisionKey(row),decisionKey({...row,reader:{...row.reader,state:'observed'}}));
});
test('a saved reader selection cannot carry skill-only damage into a magic attack',()=>{
 const r=magic(),rows=compareCandidates(websiteCandidates(r),[]),d=decisions(rows);
 const row=rows.find(r=>r.effect.type==='damage');
 row.reader={id:'skill-only',effectType:row.effect.type,target:row.effect.target,unit:row.effect.unit,value:60,decoded:{conditions:[{field:'attackKind',op:'eq',value:'skill'}]}};
 row.compatible=true;d[decisionKey(row)]={choice:'reader'};
 assert.throws(()=>resolveReview(r,rows,d),/读取器条件不符合/);
 const [checked]=compareCandidates([row],[row.reader],{[row.id]:row.reader.id},r.context);
 assert.equal(checked.compatible,false);assert.match(checked.comparison,/条件不满足/);
});
test('battle report null stats stay null; wrong kind and invalid numbers rejected',()=>{
 const r={kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{stats:{attack:null,intelligence:123},bonuses:[]}]};
 assert.equal(validateBattleEntry(r).units[0].stats.attack,null);
 assert.throws(()=>validateBattleEntry({...r,kind:'other'}),/格式不匹配/);
 assert.throws(()=>validateBattleEntry({...r,units:[{stats:{hp:-1},bonuses:[]}]}),/无效/);
});
test('damage page 专武 switch equips every exclusive item even when the report had none selected',()=>{
 const base=initial(),unequipped={...base,context:{...base.context,equipmentIds:[],staff:false,robe:false,iceStaff:false},rows:(base.rows||[]).map(r=>r.group==='equipment'?{...r,status:'disabled',reasons:['未选择这件装备']}:r)};
 const on=retargetReport(unequipped,{attack:'magic',type:'magical',element:'冰',specialWeapon:true});
 const gear=[...new Set(on.rows.filter(r=>r.group==='equipment').map(r=>r.sourceId))];
 assert(gear.length>0);
 for(const id of gear)assert(on.context.equipmentIds.includes(id));
 assert(on.rows.filter(r=>r.group==='equipment').some(r=>r.status==='active'),'unequipped gear is re-evaluated, not treated as manually disabled');
 const off=retargetReport(on,{attack:'magic',type:'magical',element:'冰',specialWeapon:false});
 assert(!off.rows.some(r=>r.group==='equipment'&&r.status==='active'));
});
