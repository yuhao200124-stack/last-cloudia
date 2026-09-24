import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {BASIC_STAT_CATALOG as catalog} from '../dist/basic-stat-catalog.mjs';
import {basicStatRules} from '../dist/basic-stat-rules.mjs';
import {buildLoadoutReport,prepareLoadoutPreview} from '../dist/loadout-preview.mjs';
import {calculateWebsitePanel} from '../dist/panel-calculator.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {defaultInput,calculate} from '../dist/damage-engine.mjs';
const box={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../dist/data.js',import.meta.url),'utf8'),box);const data=box.window.SKILL_DATA;
const entry=name=>Object.values(catalog).find(e=>e.name===name);
const item=name=>{const e=entry(name);assert(e,name);return {id:e.id,catalogId:e.id,name:e.name,text:e.text};};
const base={hp:1000,mp:100,attack:1000,defense:1000,intelligence:1000,mind:1000};
const selection={attack:'s1',type:'physical',element:'无',statReference:'str',criticalEnabled:false,fullHp:false};
const baseReport={kind:'last-cloudia-effect-report',characterId:'test',profile:{baseStats:base,equipment:[]},context:{weaponCount:0,accountBlessings:false},rows:[]};
const snapshot=names=>({characterId:'test',sourceIds:[],items:names.map(item)});
const report=(names,options={})=>buildLoadoutReport({...baseReport,...options},snapshot(names),selection);
const panel=(names,options={})=>calculateWebsitePanel(base,report(names,options));

test('181 unique classified skills cover six projects; every duplicate retains the same canonical ID',()=>{
 const lanes=data.sheets['基础属性'].lanes,rows=lanes.flatMap(l=>l.rows),unique=new Set(rows.map(r=>r.url||r.id));
 assert.equal(unique.size,181);assert.equal(Object.keys(catalog).length,181);
 assert.equal(data.skillCensus.uniqueTotal,935);assert.equal(data.skillCensus.mainTotal,933);
 assert.equal(data.skillCensus.basicReady+data.skillCensus.basicPartial+data.skillCensus.basicPending,181);
 const counts=Object.fromEntries(lanes.map(l=>[l.label,l.rows.length]));
 assert.deepEqual(counts,{HP:25,MP:8,攻击力:78,法强:43,防御力:64,魔抗:45});
 for(const row of rows){const e=catalog[row.id];assert(e);assert.equal(row.effect,e.text);assert(lanes.filter(l=>l.rows.some(r=>r.id===row.id)).every(l=>e.targets.includes(l.label)));}
 assert(lanes.find(l=>l.label==='HP').rows.some(r=>r.name==='勇士提升2'));
 assert(lanes.find(l=>l.label==='攻击力').rows.some(r=>r.name==='勇士提升2'));
 assert(lanes.find(l=>l.label==='防御力').rows.some(r=>r.name==='勇士提升2'));
});
test('compound stats, negative stats and fixed increases use their own panel layer',()=>{
 const p=panel(['勇士提升2','魔导提升3','体力增加','体力提升','魔力增加','圣诞狂热']);
 assert.equal(p.values.hp,1695); // (1000+500) * (1+.08+.05)
 assert.equal(p.values.attack,1180);assert.equal(p.values.defense,1080);
 assert.equal(p.values.mp,108);assert.equal(p.values.intelligence,1023); // (1000+100)*(1+.08-.15)
 assert.equal(p.values.mind,1100);
 assert.equal(panel(['荒神御魂']).values.hp,850);
});
test('a shared skill adds once across projects and native exclusions are retained',()=>{
 const added=item('勇士提升2');const duplicate={...added,id:'category-copy'};
 const r=buildLoadoutReport(baseReport,{...snapshot([]),items:[added,duplicate]},selection);
 assert.equal(calculateWebsitePanel(base,r).values.attack,1080);
 const source={id:'native-warrior',name:added.name,text:added.text,group:'common',rules:basicStatRules({...added,id:'native-warrior'})};
 const native={...baseReport,...evaluateCatalog([source],baseReport.context)};
 const linked={...added,id:'character:test:native-warrior',sourceIds:['native-warrior']};
 const selected={characterId:'test',sourceIds:['native-warrior'],items:[linked,added]};
 assert.equal(calculateWebsitePanel(base,buildLoadoutReport(native,selected,selection)).values.attack,1080);
 native.rows[0].rule.effects=native.rows[0].rule.effects.filter(e=>e.target!=='攻击力');
 assert.equal(calculateWebsitePanel(base,buildLoadoutReport(native,selected,selection)).values.attack,1000);
 native.rows[0].status='disabled';
 assert.equal(calculateWebsitePanel(base,buildLoadoutReport(native,selected,selection)).values.defense,1000);
});
test('HP runtime conditions turn on/off; equipment gates do not become permanent stats',()=>{
 const s=snapshot(['磊落']);
 const full=buildLoadoutReport(baseReport,s,{...selection,fullHp:true});
 assert.equal(calculateWebsitePanel(base,full).stats.attack.percent,0);
 assert.equal(calculateWebsitePanel(base,full).values.attack,1200);
 assert.equal(calculateWebsitePanel(base,buildLoadoutReport(baseReport,s,selection)).values.attack,1000);
 assert.equal(panel(['防具体力增加2']).values.hp,1000);
 const armored=report(['防具体力增加2'],{context:{...baseReport.context,armor:true}});
 assert(armored.rows.some(r=>r.sourceName==='防具体力增加2'&&r.status==='active'));
 const dual=report(['防具体力增加2'],{context:{...baseReport.context,weaponCount:2,armor:true,robe:true}});
 assert(!dual.rows.some(r=>r.sourceName==='防具体力增加2'&&r.status==='active'));
});
test('weapon stat upgrades touch each equipped weapon only; damage receives changed STR',()=>{
 const gearSource={id:'gear',name:'测试剑',text:'',group:'equipment',rules:[{id:'gear-stat',conditions:[],review:'ready',effects:[{type:'equipmentStat',target:'装备攻击力',value:200,unit:''}]}]};
 const ctx={accountBlessings:false,weaponCount:1,sword:true,equipmentIds:['gear']};
 const gearReport={...baseReport,...evaluateCatalog([gearSource],ctx)};
 const r=buildLoadoutReport(gearReport,snapshot(['神圣光环']),selection);
 assert.equal(calculateWebsitePanel(base,r,{equipment:[{name:'测试剑',type:'剑'}]}).values.attack,1250);
 const input={...defaultInput(),attack:1000,defense:1000,cap:1e9};
 const first=prepareLoadoutPreview({baseReport,snapshot:snapshot([]),selection,input});
 const changed=prepareLoadoutPreview({baseReport,snapshot:snapshot(['攻击提升极']),selection,input});
 assert.equal(changed.input.attackBase,1150);assert(calculate(changed.input).mean>calculate(first.input).mean);
 assert.equal(changed.imported.effects.length,0,'stat increase must not also become damage +15%');
});
test('timed, maximum and unknown mechanics remain visible; editing text invalidates official rules',()=>{
 for(const name of ['快速鼓舞','生命鼓舞','自动活力']){
  const r=report([name]);assert(r.rows.some(r=>r.sourceName===name&&r.status==='pending'));
  assert(!r.rows.some(r=>r.sourceName===name&&r.status==='active'));
 }
 const renamed={...item('攻击提升极'),name:'我的名字'};assert(basicStatRules(renamed));
 assert.equal(basicStatRules({...renamed,text:'攻击力+99%',edited:true}),null);
 const compound=report(['石之世界']);assert(compound.rows.some(r=>r.status==='active'&&r.rule.effects.some(e=>e.target==='防御力')));assert(compound.rows.some(r=>r.status==='pending'));
});
