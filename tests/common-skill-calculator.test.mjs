import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {COMMON_SKILL_CATALOG as catalog,COMMON_SKILL_ALIASES as aliases} from '../dist/common-skill-catalog.mjs';
import {commonSkillIdentity,commonSkillRules} from '../dist/common-skill-rules.mjs';
import {compileCommonEntry} from '../scripts/compile-common-skills.mjs';
import {buildCatalog,makeTemplate} from '../dist/effect-rule-learning.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {prepareLoadoutPreview,buildLoadoutReport} from '../dist/loadout-preview.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {retargetReport} from '../dist/entry-preparation.mjs';
import {defaultInput,calculate} from '../dist/damage-engine.mjs';
const registry=JSON.parse(fs.readFileSync(new URL('../docs/skill-labeling-registry.json',import.meta.url)));
const entry=name=>{const e=Object.values(catalog).find(e=>e.name===name);assert(e,name);return e;};
const item=name=>{const e=entry(name);return {id:e.id,name:e.name,text:e.text};};
const base={kind:'last-cloudia-effect-report',characterId:'test',profile:{baseStats:{hp:1000,mp:100,attack:1000,intelligence:1000,defense:1000,mind:1000},equipment:[]},context:{accountBlessings:false,weaponCount:0},rows:[]};
const selection={attack:'s1',type:'physical',element:'火',statReference:'str',criticalEnabled:false,fullHp:false,lowHp:false,break:false,dualWield:false};
const input={...defaultInput(),attack:1000,defense:1000,type:'physical',skillType:'skill',element:'火',effects:[]};
function run(names,{context={},select={},battle={},snapshotItems=null,baseReport=null}={}){
 return prepareLoadoutPreview({baseReport:baseReport||{...base,context:{...base.context,...context}},snapshot:{characterId:'test',sourceIds:[],items:snapshotItems||names.map(item)},selection:{...selection,...select},input:{...input,...battle}});
}

test('all 935 canonical common skills and category aliases resolve by exact description',()=>{
 assert.equal(Object.keys(catalog).length,935);
 const box={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../dist/data.js',import.meta.url),'utf8'),box);
 for(const sheet of Object.values(box.window.SKILL_DATA.sheets))for(const row of sheet.rows||sheet.lanes.flatMap(l=>l.rows))if(!row.separator){
  assert.equal(commonSkillIdentity({id:row.id,name:row.name,text:row.effect}),aliases[row.id]);
 }
 for(const e of Object.values(catalog))assert.doesNotThrow(()=>makeTemplate(e,commonSkillRules(e)),e.name);
 const sword=item('剑增幅');assert.equal(commonSkillIdentity({...sword,name:'我的名称'}),sword.id);
 assert.equal(commonSkillRules({...sword,text:'装备剑时伤害+99%',edited:true}),null);
 assert.equal(commonSkillRules({...sword,text:'不同原文'}),null);
});

test('weapon scopes and physical/magic/ultimate are separate; category copies count once',()=>{
 const sword=item('剑增幅');
 const selected=run([],{context:{weaponCount:1,sword:true},snapshotItems:[sword,{...sword,id:'another-category',catalogId:sword.id}]});
 assert.equal(selected.imported.effects.length,1);assert.equal(selected.imported.effects[0].percent,10);
 assert.equal(run(['剑增幅']).imported.effects.length,0);
 assert.equal(run(['剑增幅'],{context:{weaponCount:2,sword:true}}).imported.effects.length,1);
 for(const attack of ['magic','ultimate'])assert.equal(run(['剑增幅'],{context:{weaponCount:1,sword:true},select:{attack,type:attack==='magic'?'magical':'physical'}}).imported.effects.length,0);
 assert(calculate(selected.input).mean>calculate(run([]).input).mean);
});

test('elements, magic Boss bonuses and caps reach the damage import once',()=>{
 const fire=run(['炎攻击提升3']);assert.equal(fire.imported.effects.length,1);assert.equal(fire.imported.effects[0].percent,30);assert.equal(fire.imported.capAdded,2000);
 const ice=run(['炎攻击提升3'],{select:{element:'冰'},battle:{element:'冰'}});assert.equal(ice.imported.effects.length,0);assert.equal(ice.imported.capAdded,0);
 const magic=run(['巨型净化3'],{select:{attack:'magic',type:'magical',statReference:'int'},battle:{type:'magical',skillType:'magic'}});
 assert.equal(magic.imported.effects[0].percent,20);assert.equal(magic.imported.capAdded,4000);
 assert.equal(run(['巨型净化3']).imported.effects.length,0);
});

test('basic stat penalties and independent additive cap clauses both survive',()=>{
 for(const [weaponCount,cap] of [[0,6000],[1,6000],[2,3000]]){
  const result=run(['荒神御魂'],{context:{weaponCount}});
  assert.equal(result.panel.stats.hp.percent,-15);if(weaponCount===0)assert.equal(result.panel.values.hp,850);assert.equal(result.imported.capAdded,cap);
 }
 assert.equal(run(['荒神御魂'],{select:{attack:'magic',type:'magical'}}).imported.capAdded,0);
});

test('replacement cap branches are exclusive and require the weak-element switch',()=>{
 for(const [weaponCount,cap] of [[0,2000],[1,4000],[2,2000]])assert.equal(run(['炎属性弱点突破2'],{context:{weaponCount},battle:{resistance:-20,weakness:true}}).imported.capAdded,cap);
 assert.equal(run(['炎属性弱点突破2'],{context:{weaponCount:1}}).imported.capAdded,0);
 const unknown=run(['炎属性弱点突破2'],{context:{weaponCount:null},battle:{resistance:-20,weakness:true}});assert.equal(unknown.imported.capAdded,0);assert(unknown.unresolved.length);
});

test('Boss and weak-element switches control only their matching effects',()=>{
 const bossOn=run(['巨型净化3'],{select:{attack:'magic',type:'magical',statReference:'int'},battle:{boss:true,type:'magical',skillType:'magic'}}),bossOff=run(['巨型净化3'],{select:{attack:'magic',type:'magical',statReference:'int'},battle:{boss:false,type:'magical',skillType:'magic'}});
 assert(bossOn.imported.effects.length>0);assert.equal(bossOff.imported.effects.length,0);
 const weakOff=run(['炎属性弱点突破2'],{context:{weaponCount:1},battle:{resistance:-20,weakness:false}});
 const weakOn=run(['炎属性弱点突破2'],{context:{weaponCount:1},battle:{resistance:-20,weakness:true}});
 assert.equal(weakOff.imported.capAdded,0);assert.equal(weakOn.imported.capAdded,4000);
});

test('multi-race targets match OR once, missing race remains unresolved',()=>{
 const one=run(['美食猎人'],{battle:{races:['鸟']}}),many=run(['美食猎人'],{battle:{races:['鸟','兽','鱼']}});
 assert.equal(one.imported.effects[0].percent,10);assert.deepEqual(many.imported.effects,one.imported.effects);
 assert.equal(run(['美食猎人'],{battle:{races:['神']}}).imported.effects.length,0);
 const unknown=run(['美食猎人']);assert.equal(unknown.imported.effects.length,0);assert(unknown.unresolved.some(e=>/目标种族/.test(e.reason)));
});

test('killer qualification and 特攻增幅 use the existing killer factor, not another damage multiplier',()=>{
 const skills=['战士杀手','特攻增幅'].map(name=>({...item(name),group:'common'}));
 const report={...base,...evaluateCatalog(buildCatalog(skills),{attack:'s1',damageType:'physical',element:'fire',enemyRaces:['soldier'],accountBlessings:false})};
 const imported=buildDamageImport(report);assert.equal(imported.bossKiller,true);assert.equal(imported.killerCorrection,50);assert.equal(imported.effects.length,0);
 const other={...base,...evaluateCatalog(buildCatalog(skills),{attack:'s1',damageType:'physical',element:'fire',enemyRaces:['bird']})};
 assert.equal(buildDamageImport(other).killerCorrection,0);
});

test('special attack and dual wield work as manual switches without equipped skills',()=>{
 const plain=run([],{select:{specialAttack:true,dualWield:true},battle:{races:['战士']}});
 assert.equal(plain.input.specialAttack,true);assert.equal(plain.input.hitMultiplier,2);assert.equal(plain.input.hitDamageRatio,0.6);assert.equal(plain.input.hitScaleStage,'core');
 const selected=run(['战士杀手'],{select:{specialAttack:true},battle:{races:['战士']}});
 const disabled=run(['战士杀手'],{select:{specialAttack:false},battle:{races:['战士']}});
 assert.equal(selected.input.specialAttack,true);assert.equal(disabled.input.specialAttack,false);
 const wrongRace=run(['战士杀手'],{select:{specialAttack:true},battle:{races:['鸟']}});
 assert.equal(wrongRace.input.specialAttack,true);assert.equal(wrongRace.input.killerCorrection,0);
});

test('critical bonuses stay in the critical branch and switches remove them',()=>{
 const on=run(['暴击提升','瞄准要害'],{select:{criticalEnabled:true}}),off=run(['暴击提升','瞄准要害']);
 assert.equal(on.imported.critAdded,2);assert.equal(off.imported.critAdded,0);assert.equal(off.imported.effects.length,0);
 assert.equal(on.imported.effects[0].criticalOnly,true);
 const baseline={...on.input,effects:[]};assert.equal(calculate(on.input).normal.mean,calculate(baseline).normal.mean);assert(calculate(on.input).critical.mean>calculate(baseline).critical.mean);
});

test('back, air, ailment and Break predicates recalculate from battle settings',()=>{
 assert.equal(run(['背闪击']).imported.effects.length,0);assert.equal(run(['背闪击'],{battle:{back:true}}).imported.effects[0].percent,30);
 assert.equal(run(['空中增幅'],{battle:{air:true}}).imported.effects.length,1);
 assert.equal(run(['空中增幅']).imported.effects.length,0);
 assert.equal(run(['破防增幅']).imported.effects.length,0);assert.equal(run(['破防增幅'],{select:{break:true},battle:{break:true}}).imported.effects[0].percent,30);
 for(const flags of [{break:true},{stunned:true},{break:true,stunned:true}])assert.equal(run(['机会驱动'],{select:{break:flags.break===true},battle:flags}).imported.effects.length,1);
 assert.equal(run(['机会驱动']).imported.effects.length,0);
});

test('dual wield reads one combined hit rule and does not equip weapons by itself',()=>{
 const p=run(['二刀流'],{context:{weaponCount:2},select:{dualWield:true,hitScaleStage:'core'}});
 assert.equal(p.imported.hitSources.length,1);assert.equal(p.input.hitMultiplier,2);assert.equal(p.input.hitDamageRatio,.6);
 assert.equal(run(['二刀流'],{context:{weaponCount:1},select:{dualWield:true}}).imported.hitSources.length,0);
 const off=run(['二刀流'],{context:{weaponCount:2},select:{dualWield:false}});assert.equal(off.input.hitMultiplier,1);
});

test('classification-ready mechanics do not inject guesses; incoming defense is not outgoing damage',()=>{
 const p=run(['狂战士','生命鼓舞','星眼','命运抽签','巨型护罩']);
 assert(p.imported.effects.some(e=>e.name.startsWith('狂战士')&&e.percent===30));
 assert(!p.imported.effects.some(e=>/生命鼓舞|命运抽签|巨型护罩/.test(e.name)));
 // 2026-09-27 switch plan: 发动时自动消耗MP/HP的效果直接计入（星眼）。
 assert(p.imported.effects.some(e=>e.name.startsWith('星眼')&&e.percent===50));
 assert(!p.unresolved.some(e=>e.name==='生命鼓舞'));assert(!p.unresolved.some(e=>e.name==='星眼'));
 assert(!p.unresolved.some(e=>e.name==='巨型护罩'));
 const source=structuredClone(registry.entries.find(e=>e.name==='剑增幅'));
 for(const d of Object.values(source.tagDetails))for(const b of d.bindings||[])b.scope.extraUnknownCondition=true;
 assert(compileCommonEntry(source).every(r=>r.review==='pending'));
});

test('party predicates distributed into effectConditions are never lost or silently treated as constants',()=>{
 // 2026-09-27 switch plan: 阵形由「队伍」开关决定。
 assert.equal(run(['阵形：进击的奥尔达纳']).imported.effects.length,0);
 assert.deepEqual(run(['阵形：进击的奥尔达纳'],{select:{partyConditionActive:true}}).imported.effects.map(e=>e.percent),[5]);
 for(const name of ['腐蚀之牙']){
  const p=run([name]);assert.equal(p.imported.effects.length,0,name);assert(p.unresolved.some(e=>e.name===name),name);
 }
 for(const source of registry.entries)for(const detail of Object.values(source.tagDetails))for(const condition of detail.effectConditions||[]){
  const binding=condition.effectBinding;if(!binding||binding.scope?.direction!=='outgoing')continue;
  const matching=catalog[source.id].rules.filter(rule=>binding.partIds.slice().sort().join('|')===rule.part);
  assert(matching.length,source.name);assert(matching.every(r=>r.review==='pending'||r.note?.startsWith('最大值试算：')||r.effects.every(e=>e.type==='utility')),source.name+' requires actual party state unless an explicit maximum was selected');
 }
});

test('saved legacy unknown common sources upgrade without losing disabled or confirmed edits',()=>{
 const skill=item('剑增幅'),source={...skill,id:'native-sword',group:'common'};
 const oldRule={id:'old-pending',part:1,text:skill.text,conditions:[],effects:[],review:'pending',verification:'description',note:'尚无完整原文匹配的已确认规则，请人工拆分并确认；当前不计入。'};
 const old={...base,...evaluateCatalog([{...source,rules:[oldRule]}],{...base.context,weaponCount:1,sword:true})};
 const upgraded=retargetReport(old,selection);assert.equal(buildDamageImport(upgraded).effects[0].percent,10);
 const disabled=structuredClone(old);disabled.rows[0].status='disabled';assert.equal(buildDamageImport(retargetReport(disabled,selection)).effects.length,0);
 const custom=structuredClone(old);custom.rows[0].rule={...oldRule,review:'ready',effects:[{type:'damage',target:'伤害',value:17,unit:'%'}]};
 assert.equal(buildDamageImport(retargetReport(custom,selection)).effects[0].percent,17);
 const snapshot={characterId:'test',sourceIds:['native-sword'],items:[skill,{...skill,id:'character:test:sword',sourceIds:['native-sword']}]};
 const once=buildLoadoutReport(old,snapshot,selection);assert.equal(buildDamageImport(once).effects.length,1);
 assert.equal(buildDamageImport(buildLoadoutReport(old,{...snapshot,items:[]},selection)).effects.length,0);
});

test('new character/common source loading recognizes official rules without a loadout-specific parser',()=>{
 const source={...item('炎攻击提升3'),id:'character-common-123',group:'common'};
 const result=buildCatalog([source])[0];assert.equal(result.registered,true);assert(result.rules.every(r=>r.review==='ready'));
 const report={...base,...evaluateCatalog([result],{attack:'magic',damageType:'magical',element:'fire'})};
 assert.equal(buildDamageImport(report).effects[0].percent,30);
});

test('healing is recognized without changing main-hit damage; explicit chain maximum changes magic only',()=>{
 const baseline=run([]),healing=run(['骄傲之力']);
 assert.deepEqual(healing.imported.effects,baseline.imported.effects);assert.equal(calculate(healing.input).mean,calculate(baseline.input).mean);assert.equal(healing.unresolved.length,0);
 assert(healing.commonSkills[0].rows.some(r=>r.rule.effects.some(e=>e.type==='utility'&&e.target==='HP回复')));
 const select={attack:'magic',type:'magical',statReference:'int'},battle={type:'magical',skillType:'magic'};
 const magic=run(['魔法连锁'],{select,battle}),empty=run([],{select,battle});
 assert.equal(magic.imported.effects[0].percent,20);assert.equal(magic.unresolved.length,0);assert(calculate(magic.input).mean>calculate(empty.input).mean);
 assert.equal(run(['魔法连锁']).imported.effects.length,0);
 const off=prepareLoadoutPreview({baseReport:base,snapshot:{characterId:'test',items:[item('魔法连锁')],sourceIds:[]},selection:{...selection,...select},input:{...input,...battle},disabledCommonIds:[magic.commonSkills[0].confirmationKey]});
 assert.equal(off.imported.effects.length,0);
});

test('maximum stat scenarios and grouped Buff switches preserve negatives and active-only stacking',()=>{
 const on=run(['生命鼓舞'],{select:{lowHp:true}}),off=run(['生命鼓舞']);
 assert.equal(on.panel.values.attack,1500);assert.equal(off.panel.values.attack,1000);
 assert.equal(run(['命运抽签'],{select:{openingBuffActive:true}}).panel.values.attack,1500);
 const negative=run(['寻找“有趣的东西”'],{select:{conditionBuffActive:true}});
 assert.equal(negative.panel.values.attack,1200);assert.equal(negative.panel.values.intelligence,800);
 // 2026-09-27 switch plan: 永久获得（自动暴击）与开局（快速暴击）都跟「开局BUFF」开关。
 for(const [flag,on] of [['openingBuffActive',false],['openingBuffActive',true]]){
  const result=run(['快速暴击','自动暴击'],{select:{[flag]:on,criticalEnabled:true}});
  assert.equal(result.imported.critAdded,on?15:0);
  assert.equal(run(['快速暴击'],{select:{[flag]:on,criticalEnabled:true}}).imported.critAdded,on?15:0);
 }
 const damage=run(['龙卷攻击','进击的姿势','桶～子'],{select:{conditionBuffActive:true}});
 assert.deepEqual(damage.imported.effects.map(e=>e.percent),[30]);
 assert.equal(run(['龙卷攻击','进击的姿势','桶～子']).imported.effects.length,0);
 assert.equal(run(['星眼'],{select:{conditionBuffActive:true}}).imported.effects[0].percent,50);
});

test('equipment maximum respects real weapon element and heavy magic retains its own scope',()=>{
 for(const [element,count] of [['ice',1],['fire',0]]){
  const result=run(['冲浪冲击'],{context:{weaponCount:1,staff:true,weaponDetails:[{type:'staff',element}]},select:{element:'冰'},battle:{element:'冰'}});
  assert.equal(result.imported.effects.length,count);if(count)assert.equal(result.imported.effects[0].percent,40);
 }
 const heavy=run(['人工精灵'],{select:{attack:'heavy_magic',type:'magical',statReference:'int'},battle:{type:'magical',skillType:'magic'}});
 const normal=run(['人工精灵'],{select:{attack:'magic',type:'magical',statReference:'int'},battle:{type:'magical',skillType:'magic'}});
 assert.equal(heavy.imported.capAdded-normal.imported.capAdded,5000);
});

test('v155 machine pending rules upgrade by full signature; custom, disabled and edited sources survive',()=>{
 const e=entry('魔法连锁'),original=structuredClone(e.legacyPending[0]);
 const source={...item(e.name),id:'saved-chain',rules:[{...original,id:'old-chain'}]};
 const select={...selection,attack:'magic',type:'magical',statReference:'int'};
 const report={...base,...evaluateCatalog([source],{attack:'magic',damageType:'magical',element:'fire',accountBlessings:false})};
 const upgraded=retargetReport(report,select);assert.equal(buildDamageImport(upgraded).effects[0].percent,20);assert.equal(upgraded.rows.find(r=>r.sourceId==='saved-chain').rule.id,'old-chain');
 const disabled=structuredClone(report);disabled.rows[0].status='disabled';assert.equal(buildDamageImport(retargetReport(disabled,select)).effects.length,0);
 const custom=structuredClone(report);custom.rows[0].rule.effects=[{type:'damage',target:'伤害',value:13,unit:'%'}];custom.rows[0].rule.review='ready';assert.equal(buildDamageImport(retargetReport(custom,select)).effects[0].percent,13);
 const modified=structuredClone(report);modified.rows[0].sourceText+='（我修改过）';assert.equal(buildDamageImport(retargetReport(modified,select)).effects.length,0);
});

test('all 935 skills have specific explanations and unrecorded conversion formulas never get a fabricated maximum',()=>{
 for(const e of Object.values(catalog)){
  const source={...e,rules:commonSkillRules(e)};
  for(const row of evaluateCatalog([source],{attack:'magic',damageType:'magical'}).rows)assert(!row.reasons.some(r=>r.includes('效果或条件尚未完成拆分')),e.name);
 }
 const unknown=run(['斗智转轮'],{select:{attack:'magic',type:'magical',statReference:'int'},battle:{type:'magical',skillType:'magic'}});
 assert.equal(unknown.imported.effects.length,0);assert(unknown.unresolved.some(r=>r.reason.includes('没有明确最大值')));
});

test('numeric conditions preserve Hit and HP boundaries; missing observations do not mean zero',()=>{
 const source=name=>{const e=entry(name);return {...e,rules:commonSkillRules(e)};};
 const damage=(name,ctx)=>buildDamageImport({kind:'last-cloudia-effect-report',characterId:'test',...evaluateCatalog([source(name)],{attack:'s1',damageType:'physical',element:'fire',accountBlessings:false,...ctx})});
 // 2026-09-27 switch plan: 连击数条件直接按面板计入（不再要求填写连续Hit数）。
 for(const hits of [10,108,undefined]){
  const r=damage('百八之钟',hits===undefined?{}:{comboHits:hits});assert.equal(r.effects[0]?.percent,10);assert.equal(r.capAdded,108000);
 }
 assert.equal(damage('连击大师',{}).effects[0]?.percent,20);
 // 2026-09-27 switch plan: 其他HP线（≤25%）也归「濒死」开关。
 for(const [lowHp,on] of [[true,true],[false,false]])assert.equal(damage('暴击艺术',{attack:'ultimate',lowHp}).effects.length,on?1:0);
 assert.equal(damage('毒之力',{enemyPoison:true}).effects[0].percent,30);assert.equal(damage('毒之力',{ailment:true}).effects.length,0);
 // Game data: 作战行动 is a 40s opening buff (trigger 10, 継続時間 2400).
 for(const [atk,int,on] of [[100,100,true],[99,100,false]])assert.equal(damage('作战行动',{openingBuffActive:true,openingStats:{attack:atk,intelligence:int}}).effects.length,on?1:0);
 assert.equal(damage('作战行动',{openingStats:{attack:100,intelligence:100}}).effects.length,0);
});
