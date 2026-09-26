import test from 'node:test';
import assert from 'node:assert/strict';
import {scenarioBonuses} from '../dist/scenario-bonus-summary.mjs';

const row=(sourceId,group,target,value,type='damage',status='active',conditions=[])=>({
 sourceId,sourceName:sourceId,sourceText:`${target} +${value}`,group,status,
 rule:{id:`${sourceId}-${target}`,conditions,effects:[{type,target,value,unit:type==='damage'?'%':''}]}
});

test('ice magic summary includes matching damage and cap, counts hidden blessings and excludes inactive or unrelated rows',()=>{
 const report={context:{damageType:'magical',attack:'magic',attackKind:'magic',element:'ice',criticalEnabled:true,killerOverride:true},rows:[
  row('trait','traits','伤害',10),row('ice','exclusive','冰属性伤害',20),row('magic','exclusive','魔法伤害',30),
  row('loadout:skill','common','不可叠加魔法伤害',15),row('blessing','blessings','冰属性伤害',5),
  row('loadout:skill','common','魔法伤害上限',200,'cap'),row('fire','exclusive','火属性伤害',99,'damage','inactive'),
  row('off','exclusive','伤害',70,'damage','disabled'),
  row('crit','exclusive','暴击伤害',25,'damage','active',[{field:'critical',op:'eq',value:true}]),
 ]};
 const all=scenarioBonuses(report);
 assert.equal(all.filter(x=>x.type==='damage').reduce((s,x)=>s+x.value,0),105);
 assert.equal(all.find(x=>x.type==='cap').value,200);
 assert.equal(all.find(x=>x.label==='冰属性伤害').sources.find(x=>x.hidden).value,5);
 assert.equal(scenarioBonuses(report,{group:'common'}).filter(x=>x.type==='damage').reduce((s,x)=>s+x.value,0),15);
 assert.equal(scenarioBonuses(report,{group:'native'}).filter(x=>x.type==='damage').reduce((s,x)=>s+x.value,0),90);
 assert.equal(scenarioBonuses(report,{disabledCommonIds:['skill']}).filter(x=>x.type==='damage').reduce((s,x)=>s+x.value,0),90);
 assert.equal(scenarioBonuses({...report,context:{...report.context,criticalEnabled:false}}).filter(x=>x.type==='damage').reduce((s,x)=>s+x.value,0),80);
});
