import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBonusComparison,effectSelectionKey} from '../dist/bonus-comparison.mjs';
const row=(id,target,value,type='damage',unit='%')=>({id,sourceName:id,sourceId:id,ruleId:id,index:0,effect:{type,target,value,unit},condition:[]});
const read=(id,target,value,conditions=[],type='damage',unit='%')=>({id,sourceName:id,effectType:type,target,value,unit,state:'candidate',decoded:{conditions}});
const context={attack:'magic',element:'ice',damageType:'magical'};
const get=(groups,target)=>groups.find(g=>g.target===target);
test('sum comparable scopes separately; reader data are independent and missing is not zero',()=>{
 const web=[row('ice','冰属性伤害',50),row('ice2','冰属性伤害',30),row('magic','冰属性魔法伤害',30),row('cap','冰属性伤害上限',60000,'cap','')];
 const reader=[read('ice-r','冰属性伤害',4.06),read('fire-r','火属性伤害',10,[{field:'element',op:'eq',value:'fire'}]),read('extra','魔法伤害',20)];
 const g=buildBonusComparison(web,reader,context);
 assert.equal(get(g,'冰属性伤害').total,80);assert.equal(get(g,'冰属性伤害').readTotal,4.06);assert.equal(get(g,'冰属性伤害').fullyMapped,false);
 assert.equal(get(g,'冰属性魔法伤害').total,30);assert.equal(get(g,'冰属性魔法伤害').readTotal,null);
 assert.equal(get(g,'冰属性伤害上限').total,60000);assert.equal(get(g,'魔法伤害').total,0);assert.equal(get(g,'火属性伤害'),undefined);
});
test('deleting one source recomputes website only; matching excludes ambiguous or repeated reader entries',()=>{
 const w=row('x','冰属性伤害',30),r=read('r','冰属性伤害',30);w.reader=r;w.compatible=true;
 let g=buildBonusComparison([w],[r,r],context)[0];assert.equal(g.readTotal,30);assert.equal(g.canUseReader,true);assert.equal(g.candidate,true);
 g=buildBonusComparison([w],[r],context,{removed:{[effectSelectionKey(w)]:{}}})[0];assert.equal(g.total,0);assert.equal(g.readTotal,30);assert.equal(g.canUseReader,false);
 const w2={...w,id:'second'};g=buildBonusComparison([w,w2],[r],context)[0];assert.equal(g.canUseReader,false);
});
test('known elemental configuration keeps candidate provenance and rejects changed scope signatures',()=>{
 const r={id:'ice',effectType:'damage',target:'冰属性伤害',value:30,unit:'%',state:'candidate',processId:1050450,conditionId:27001,
  raw:{function:'process1050450',trigger:27,parameterMeaningRecognized:true,conditionParams:[1,1,0,1,3],values:[2,3000,0,0,0,0,0,0,0,0]}};
 const w=row('ice-web','冰属性伤害',80);
 assert.equal(buildBonusComparison([w],[r],context)[0].readTotal,30);
 assert.equal(buildBonusComparison([w],[{...r,raw:{...r.raw,conditionParams:[1,1,2,1,3]}}],context)[0].readTotal,null);
 assert.equal(buildBonusComparison([w],[r],{...context,element:'fire'})[0].readTotal,null);
});
