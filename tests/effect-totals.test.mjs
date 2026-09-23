import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../dist/roxy-rules.mjs';
import { evaluateCatalog } from '../dist/effect-rule-engine.mjs';
import { summarizeEffects } from '../dist/effect-totals.mjs';
const totals = (context = {}, overrides = {}, catalog = CATALOG) => summarizeEffects(evaluateCatalog(catalog, {weaponCount:1,...context}, overrides));
const get = (list,id) => list.find(m=>m.id===id);
test('qualified totals keep damage scopes and stat buffs separate',()=>{
  const result=totals();
  for(const [id,value] of Object.entries({'stat:攻击力':0,'stat:法强':70,'statBuff:法强':50,'damage:冰属性伤害':80,'damage:冰属性魔法伤害':60,'damage:对Boss的魔法伤害':40,'damage:特攻伤害':50,'castSpeed':30})) assert.equal(get(result,id).total,value,id);
  assert.deepEqual(get(result,'damage:冰属性伤害').contributions.map(c=>c.sourceId),['water-king','ice-attack-iii']);
});
test('weapon, element, equipment and full HP changes alter both sum and eligible sources',()=>{
  const two=totals({weaponCount:2});
  assert.equal(get(two,'damage:冰属性伤害').total,30);
  assert.deepEqual(get(two,'damage:冰属性伤害').contributions.map(c=>c.sourceId),['ice-attack-iii']);
  const fire=totals({element:'fire'});
  assert.equal(get(fire,'damage:冰属性伤害'),undefined);
  assert.equal(get(totals({fullHp:true}),'stat:法强').total,100);
  const equipment=totals({staff:true,iceStaff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe']});
  assert.equal(get(equipment,'stat:法强').total,85);
  assert.equal(get(equipment,'damage:魔法伤害').total,35);
  assert.equal(get(equipment,'damage:冰属性魔法伤害').total,95);
  assert.equal(get(equipment,'castSpeed').total,80);
});
test('single weapon never admits a dual weapon contribution in the same damage metric',()=>{
  const dual={id:'dual',name:'双武器限定',group:'common',text:'测试',rules:[{id:'dual-r1',part:'效果',text:'测试',review:'ready',verification:'description',conditions:[{field:'weaponCount',op:'eq',value:2}],effects:[{type:'damage',target:'冰属性伤害',value:99,unit:'%'}]}]};
  const catalog=[...CATALOG,dual];
  const single=get(totals({weaponCount:1},{},catalog),'damage:冰属性伤害');
  assert.equal(single.total,80);assert.ok(single.contributions.every(c=>c.sourceId!=='dual'));
  const double=get(totals({weaponCount:2},{},catalog),'damage:冰属性伤害');
  assert.equal(double.total,129);assert.ok(double.contributions.some(c=>c.sourceId==='dual'));
});
test('disabled and pending rules are absent from sums and source list',()=>{
  const list=totals({chainStacks:2},{'water-single':{disabled:true}});
  assert.equal(get(list,'damage:冰属性伤害').total,30);
  assert.equal(get(list,'damage:相同攻击魔法伤害'),undefined);
  const max=totals({chainStacks:5});
  assert.equal(get(max,'damage:相同攻击魔法伤害').total,20);
});
test('numeric weapon count restored from an older setting retains single weapon rules',()=>{
  assert.equal(get(totals({weaponCount:'1'}),'damage:冰属性伤害').total,80);
});
test('multipliers cannot be added to flat caps or equipment values',()=>{
  const catalog=[{id:'units',name:'单位',group:'common',text:'测试',rules:[{id:'units-r',part:'效果',text:'测试',conditions:[],review:'ready',verification:'description',effects:[
    {type:'cap',target:'伤害上限',value:60000,unit:''},
    {type:'cap',target:'伤害上限',value:2,unit:'×'},
    {type:'equipmentStat',target:'装备法强',value:300,unit:''},
    {type:'equipmentStat',target:'装备法强',value:2,unit:'倍'}
  ]}]}];
  const list=totals({}, {}, catalog);
  assert.equal(get(list,'cap').total,60000);
  assert.equal(get(list,'equipmentStat:装备法强:').total,300);
  assert.equal(get(list,'other:cap:伤害上限').numeric,false);
  assert.equal(get(list,'other:equipmentStat:装备法强').numeric,false);
});
