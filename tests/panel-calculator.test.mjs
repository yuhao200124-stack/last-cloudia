import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateWebsitePanel,equipmentRound} from '../dist/panel-calculator.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {ACCOUNT_BLESSING_CATALOG} from '../dist/account-blessings.mjs';
const base={hp:10702,mp:459,attack:1222,defense:1407,intelligence:2512,mind:1619};
const gear=[{name:'洛琪希之杖',type:'法杖'},{name:'洛琪希的衣服',type:'长袍'}];
const report=(context={},overrides={})=>evaluateCatalog([...CATALOG,...ACCOUNT_BLESSING_CATALOG],{accountBlessings:true,weaponCount:1,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe'],fullHp:false,...context},overrides);
const result=(context={},overrides={})=>calculateWebsitePanel(base,report(context,overrides),{equipment:gear});
test('Roxy six-stat control follows equipment, pure and runtime stages without fitted offsets',()=>{
 const r=result();
 assert.deepEqual(r.values,{hp:13591,mp:1018,attack:1270,defense:2295,intelligence:10111,mind:3482});
 assert.equal(r.stats.intelligence.beforeBuff,6741);
 assert.equal(r.stats.defense.beforeBuff,1621);
 assert.equal(r.stats.mind.beforeBuff,2808);
 assert.equal(r.stats.mp.beforeBuffRaw,1018970);
});
test('full HP Moonlight shares the runtime layer with EX; opening conversion never uses either',()=>{
 const full=result({fullHp:true});
 assert.equal(full.stats.intelligence.beforeBuff,6741);
 assert.equal(full.stats.intelligence.percent,88);
 assert.equal(full.values.intelligence,12133);
 assert.equal(full.stats.defense.crossAdd,674);
 assert.equal(full.values.defense,2295);
 assert.match(full.stats.intelligence.steps.at(-1),/80%/);
 assert.equal(result({fullHp:false}).values.intelligence,10111);
 assert.equal(result({fullHp:true},{'source:extraordinary-magician':{disabled:true}}).values.intelligence,8763);
 assert.equal(result({fullHp:true},{'source:moonlight-ii':{disabled:true}}).values.intelligence,10111);
});
test('equipment .5 rounds to even, distinct from Lua conversion and native stat floor',()=>{
 assert.equal(equipmentRound(229*1.5),344);
 assert.equal(equipmentRound(227*1.5),340);
 const r=calculateWebsitePanel(base,report(),{equipment:gear,openingStats:{intelligence:6746}});
 assert.equal(r.stats.defense.crossAdd,675);
});
test('knowledge wall references opening pure INT and adds before a runtime defense multiplier',()=>{
 const r=report();r.rows.push({sourceId:'def-buff',sourceName:'防御状态',status:'active',rule:{effects:[{type:'statBuff',target:'防御力',value:40,unit:'%'}]}});
 const p=calculateWebsitePanel(base,r,{equipment:gear});
 assert.equal(p.stats.defense.crossAdd,674);
 assert.equal(p.values.defense,3213); // floor((1621 + 674) * 1.4)
});
test('MP keeps its thousandths until the final display even with a runtime percentage',()=>{
 const r=report();r.rows.push({sourceId:'mp-buff',sourceName:'MP状态',status:'active',rule:{effects:[{type:'statBuff',target:'MP',value:50,unit:'%'}]}});
 assert.equal(calculateWebsitePanel(base,r,{equipment:gear}).values.mp,1528);
});
test('disabled blessings and unequipped items disappear without changing the raw base',()=>{
 const off=result({accountBlessings:false});assert.equal(off.values.attack,1222);
 const naked=result({weaponCount:0,staff:false,robe:false,equipmentIds:[]});
 assert.equal(naked.stats.intelligence.equipment.length,0);
 assert.equal(naked.stats.mp.equipment.length,0);
 assert.equal(base.intelligence,2512);
});
test('unknown equipment type or multiple unclassified runtime buffs stay incomplete',()=>{
 const missing=calculateWebsitePanel(base,report(),{equipment:[]});
 assert.equal(missing.values.intelligence,null);
 const r=report();r.rows.push({sourceId:'unknown-aura',sourceName:'未知状态',status:'active',rule:{effects:[{type:'statBuff',target:'法强',value:65,unit:'%'}]}});
 const p=calculateWebsitePanel(base,r,{equipment:gear});
 assert.equal(p.values.intelligence,null);assert.match(p.stats.intelligence.issues.join(''),/叠加/);
});
test('pending stat conditions and generic equipment without fixed values cannot become complete totals',()=>{
 const pending=result({fullHp:null});
 assert.equal(pending.values.intelligence,null);
 assert.match(pending.stats.intelligence.issues.join(''),/条件待确认/);
 const unknownGear=result({equipmentIds:[]});
 assert.equal(unknownGear.values.mp,null);
 assert.match(unknownGear.stats.mp.issues.join(''),/固定属性/);
});
