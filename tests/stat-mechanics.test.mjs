import test from 'node:test';
import assert from 'node:assert/strict';
import {hpStatRule,upgradeStatRule,decodeHpStatEntry} from '../dist/stat-mechanics.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
const source={id:'moon',name:'月光II',text:'HP全满时，INT+30%',group:'common'};
const old={id:'moon-old',part:1,text:source.text,conditions:[{field:'fullHp',op:'eq',value:true}],effects:[{type:'stat',target:'法强',value:30,unit:'%'}],review:'ready',verification:'description'};
test('known raw HP processes decode as candidates, not activation proof; timed processes remain unknown',()=>{
 const entry={sourceName:'被动技能 ID=26505',effectType:'unknown',value:null,state:'candidate',processId:1030201,conditionId:40002,raw:{localId:26505,function:'process1030201',trigger:40,values:[1,10000,0,3000]}};
 const decoded=decodeHpStatEntry(entry);
 assert.equal(decoded.sourceName,'月光II');assert.equal(decoded.value,30);assert.equal(decoded.state,'candidate');
 assert.equal(decoded.decoded.stage,'runtime');assert.equal(decoded.decoded.lifetime,'hp-condition-continuous');
 assert.equal(entry.value,null);
 const timed={...entry,processId:2030201,raw:{...entry.raw,function:'process2030201'}};assert.equal(decodeHpStatEntry(timed),timed);
 const double={...entry,processId:1030125,raw:{...entry.raw,function:'process1030125',values:[0,3000,0,7500,0,5000]}};
 assert.deepEqual(decodeHpStatEntry(double).decoded.modifiers.map(m=>m.target),['防御力','魔抗']);
});
