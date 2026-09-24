import test from 'node:test';
import assert from 'node:assert/strict';
import {hpStatRule,upgradeStatRule,decodeHpStatEntry} from '../dist/stat-mechanics.mjs';
import {buildCatalog,makeTemplate,sourceKey} from '../dist/effect-rule-learning.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {retargetReport} from '../dist/entry-preparation.mjs';
import {calculateWebsitePanel} from '../dist/panel-calculator.mjs';
const source={id:'moon',name:'月光II',text:'HP全满时，INT+30%',group:'common'};
const old={id:'moon-old',part:1,text:source.text,conditions:[{field:'fullHp',op:'eq',value:true}],effects:[{type:'stat',target:'法强',value:30,unit:'%'}],review:'ready',verification:'description'};
test('HP maintained attribute templates work across characters; timed and compound effects remain pending',()=>{
 for(const text of ['HP全满时，STR+30%','濒死时，DEF+75%','HP全滿時，MND+20%']){
  const s=buildCatalog([{...source,text}])[0];assert.equal(s.rules[0].effects[0].type,'statBuff');
  const field=s.rules[0].conditions[0].field;
  assert.equal(evaluateCatalog([s],{[field]:true}).rows[0].status,'active');
  assert.equal(evaluateCatalog([s],{[field]:false}).rows[0].status,'inactive');
 }
 for(const text of ['濒死时攻击力+30%，持续20秒。','濒死时大量恢复HP，攻击力+100%；每Wave限1次','HP全满时，暴击率+10%','HP低于80%时，攻击力+30%'])assert.equal(hpStatRule({...source,text}),null);
 const r=evaluateCatalog(buildCatalog([{...source,text:'HP全满时，STR+30%'}]),{fullHp:true});
 const p=calculateWebsitePanel({hp:100,mp:100,attack:1000,defense:100,intelligence:100,mind:100},r);
 assert.equal(p.stats.attack.beforeBuff,1000);assert.equal(p.values.attack,1300);
});
test('old learned/local rules and cached reports migrate without losing IDs or disabled state',()=>{
 const migrated=upgradeStatRule(old);assert.equal(migrated.id,old.id);assert.equal(migrated.effects[0].type,'statBuff');
 assert.equal(old.effects[0].type,'stat');assert.deepEqual(upgradeStatRule(migrated),migrated);
 const template=makeTemplate(source,[old]);
 assert.equal(buildCatalog([source],[],{[sourceKey(source)]:template})[0].rules[0].effects[0].type,'statBuff');
 const report={context:{fullHp:true},rows:[{sourceId:'moon',sourceName:'月光II',sourceText:source.text,group:'common',status:'active',rule:old}]};
 const r=retargetReport(report,{attack:'magic',type:'magical',element:'冰'});assert.equal(r.rows[0].rule.effects[0].type,'statBuff');
 report.rows[0].status='disabled';assert.equal(retargetReport(report,{attack:'magic',type:'magical',element:'冰'}).rows[0].status,'disabled');
 const custom=structuredClone(old);custom.effects[0].value=45;
 const pending=upgradeStatRule(custom);assert.equal(pending.review,'pending');assert.equal(pending.effects[0].value,45);
 assert.equal(evaluateCatalog([{...source,rules:[custom]}],{fullHp:true}).rows[0].status,'pending');
 const rewritten={...old,text:'满血提升法强'};
 assert.equal(evaluateCatalog([{...source,rules:[rewritten]}],{fullHp:true}).rows[0].status,'pending');
 assert.equal(makeTemplate(source,[rewritten]).rules[0].review,'pending');
});
test('contradictory HP conditions cannot count both full HP and near-death',()=>{
 const r=evaluateCatalog(buildCatalog([source,{...source,id:'low',text:'濒死时，INT+20%'}]),{fullHp:true,lowHp:true});
 assert(r.rows.every(r=>r.status==='pending'));
});
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
