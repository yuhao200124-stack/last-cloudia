import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {activeConditionSources,weakElementFromBoss} from '../dist/damage-condition-display.mjs';

test('Boss resistance and current attack element set the default weak-element flag',()=>{
 assert.equal(weakElementFromBoss('冰',-25),true);
 assert.equal(weakElementFromBoss('冰',25),false);
 assert.equal(weakElementFromBoss('冰',25,-30),true);
 assert.equal(weakElementFromBoss('冰',''),false);
 assert.equal(weakElementFromBoss('无',-25),false);
 assert.equal(weakElementFromBoss('火',-25),true);
});

test('active general conditions list the selected skill and its original effect',()=>{
 const source=(id,name,text,field)=>({id,name,text,group:'common',rules:[{id,review:'ready',conditions:[{field,op:'eq',value:true}],effects:[{type:'damage',target:'魔法伤害',value:30,unit:'%'}]}]});
 const sources=[CATALOG.find(s=>s.id==='moonlight-ii'),source('awakening','觉醒','HP较低时，魔法伤害+30%','awakeningBuffActive')];
 const selected=evaluateCatalog(sources,{attack:'magic',damageType:'magical',element:'ice',fullHp:true,awakeningBuffActive:false});
 assert.deepEqual(activeConditionSources(selected,'fullHp'),[{name:'月光II',text:'HP全满时，INT+30%'}]);
 assert.deepEqual(activeConditionSources(selected,'conditionBuffActive'),[]);
 const off=evaluateCatalog(sources,{attack:'magic',damageType:'magical',element:'ice',fullHp:false,awakeningBuffActive:true});
 assert.deepEqual(activeConditionSources(off,'fullHp'),[]);
 assert.equal(activeConditionSources(off,'conditionBuffActive')[0].name,'觉醒');
});
