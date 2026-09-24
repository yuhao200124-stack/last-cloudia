import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseCsv,parseDamageFormulaCsv,decodePackedUnit} from '../dist/formula-csv-parser.mjs';
const head='event,session,battle,time_ms,state,source_raw,target_raw,panel_atk,panel_int,skill_id,action_id,settlement_atk,settlement_def,base_ratio,final_ratio,base_damage,game_value,log_flags,ck_flags,remain_hp,hp_before,hp_after,address,raw_values,raw_extensions,note'.split(',');
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const line=r=>head.map(k=>quote(r[k])).join(',');
const row=(event,extra={})=>({event,session:'100',battle:'1',time_ms:'10',...extra});
const csv=rs=>head.join(',')+'\r\n'+rs.map(line).join('\r\n');
const identities=[row('IDENTITY',{state:'player',source_raw:'1',note:'log_unit=502220;log_unique=1;name=洛琪希'}),row('IDENTITY',{state:'boss',target_raw:'101',note:'log_unit=320901401;log_unique=101;name=Boss'})];
const cache=row('CACHE',{state:'ally_id_only_unpaired',time_ms:'101',source_raw:'1',target_raw:'1',panel_int:'10111',settlement_atk:'14627',settlement_def:'8000',base_ratio:'.312',final_ratio:'.351',game_value:'35000',remain_hp:'87965000'});
const raw=Array(23).fill('0');raw[0]='35000';raw[22]='87965000';
const log=row('LOG',{time_ms:'100',state:'no_damage_ck',source_raw:'17',target_raw:'1616',panel_int:'10111',skill_id:'270090',action_id:'4',game_value:'35000',raw_values:raw.join('|')});
test('CSV quotes, CRLF, embedded newline, BOM and malformed bounds',()=>{
 assert.deepEqual(parseCsv('\uFEFF"a,b","a""b"\r\n"x\ny",z'),[['a,b','a"b'],['x\ny','z']]);
 assert.throws(()=>parseCsv('"unclosed'));assert.throws(()=>parseCsv('"a"oops,b'));assert.throws(()=>parseCsv('abc',{maxCellChars:2}));
 assert.throws(()=>parseCsv('a,b',{maxColumns:1}));assert.throws(()=>parseCsv('a\nb',{maxRows:1}));
});
test('packed ID decoding is explicit',()=>{assert.equal(decodePackedUnit(17),1);assert.equal(decodePackedUnit(1616),101);assert.equal(decodePackedUnit(65536),null);});
test('exact LOG+cache binds identity and skill; stale cache target never overrides LOG',()=>{
 const result=parseDamageFormulaCsv(csv([...identities,log,cache]));const b=result.battles[0],c=b.samples.find(s=>s.event==='CACHE');
 assert.deepEqual(c.knownLogSkillIds,[270090]);assert.equal(c.targetId,101);assert.equal(c.workTargetHint,1);
 assert.equal(b.settlementGroups[0].exactLogLinkedCacheCount,1);assert.equal(b.settlementGroups[0].attack,14627);
});
test('same source and nearby time do not bind different damage or remainingHP',()=>{
 const b=parseDamageFormulaCsv(csv([...identities,log,{...cache,game_value:'34999'}])).battles[0];
 assert.deepEqual(b.samples.at(-1).knownLogSkillIds,[]);assert.equal(b.samples.at(-1).targetId,null);
});
test('battle/session boundaries and repeated headers cannot cross-link',()=>{
 const text=csv([...identities,log])+'\n'+head.join(',')+'\n'+line({...cache,battle:'2'});
 const r=parseDamageFormulaCsv(text);assert.equal(r.repeatedHeaders,1);assert.equal(r.battleCount,2);assert.deepEqual(r.battles[1].samples[0].knownLogSkillIds,[]);
});
test('HP totals remain target-only; boundary match never invents a skill',()=>{
 const h=row('HP',{time_ms:'102',target_raw:'101',hp_before:'88000000',hp_after:'87930000',game_value:'70000'});
 const b=parseDamageFormulaCsv(csv([...identities,cache,h])).battles[0];
 assert.equal(b.hpTargets[0].totalDecrease,70000);assert.equal(b.hpTargets[0].attributedSkillId,null);
 assert.deepEqual(b.samples[0].hpBoundaryTargetIds,[101]);assert.deepEqual(b.samples[0].knownLogSkillIds,[]);
});
test('one linked sample does not identify every sample in its settlement group',()=>{
 const other={...cache,time_ms:'150',remain_hp:'87930000'};
 const g=parseDamageFormulaCsv(csv([...identities,log,cache,other])).battles[0].settlementGroups[0];
 assert.deepEqual(g.knownLogSkillIds,[270090]);assert.equal(g.sampleCount,2);assert.equal(g.adoption.canIdentifyOneSkill,false);
});
test('ambiguous direct LOG counterparts do not assign a skill',()=>{
 const other={...log,skill_id:'999',action_id:'5'};
 const c=parseDamageFormulaCsv(csv([...identities,log,other,cache])).battles[0].samples.at(-1);
 assert.deepEqual(c.knownLogSkillIds,[]);assert.equal(c.targetId,null);
});
test('conflicting explicit and raw LOG remainingHP disables pairing',()=>{
 const r=parseDamageFormulaCsv(csv([...identities,{...log,remain_hp:'1'},cache]));
 assert.equal(r.issues.length,1);assert.deepEqual(r.battles[0].samples.at(-1).knownLogSkillIds,[]);
});
test('invalid HP arithmetic is not added to total',()=>{
 const r=parseDamageFormulaCsv(csv([...identities,row('HP',{target_raw:'101',hp_before:'100',hp_after:'50',game_value:'999'})]));
 assert.equal(r.issues.length,1);assert.equal(r.battles[0].hpTargets.length,0);
});
// Optional real upload check; never copy/upload the full input into a repository.
if(process.env.FORMULA_CSV_FIXTURE)test('provided recording: exact requested battle and conservative links',()=>{
 const r=parseDamageFormulaCsv(fs.readFileSync(process.env.FORMULA_CSV_FIXTURE,'utf8'));
 const b=r.battles.find(b=>b.session==='1790218789141'&&b.battle==='1');
 assert.equal(r.battleCount,15);assert.equal(r.repeatedHeaders,6);assert.equal(b.hpTargets[0].eventCount,35);
 assert.equal(b.hpTargets[0].totalDecrease,2410222);
 const g=b.settlementGroups.find(g=>g.sourceId===1&&g.attack===14627&&g.defense===8000);
 assert.equal(g.sampleCount,39);assert.equal(g.exactLogLinkedCacheCount,1);assert.deepEqual(g.knownLogSkillIds,[270090]);
 assert.equal(g.adoption.canIdentifyOneSkill,false);
});
