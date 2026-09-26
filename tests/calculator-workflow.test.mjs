import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initEntryWorkflow} from '../dist/entry-workflow.mjs';
import {magicBuffLayer,magicBuffOptions} from '../dist/magic-buffs.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {ACCOUNT_BLESSING_CATALOG} from '../dist/account-blessings.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {resolveAttackLayers,projectAttackLayers} from '../dist/attack-layers.mjs';
import {defaultInput,calculate} from '../dist/damage-engine.mjs';
import {buildCatalog} from '../dist/effect-rule-learning.mjs';
import {BASIC_STAT_CATALOG} from '../dist/basic-stat-catalog.mjs';
// Event adapter for workflow integration, not a browser/rendering test.
function controls() {
 const html=readFileSync(new URL('../dist/damage-calculator.html',import.meta.url),'utf8');
 const make=()=>({value:'',checked:false,innerHTML:'',textContent:'',dataset:{},handlers:{},addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);},fire(name,target=this){for(const fn of this.handlers[name]||[])fn({target});},closest(){return {};},querySelector(){return {};},insertAdjacentHTML(_,text){this.innerHTML+=text;}});
 const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],make()]));
 const saves=[make(),make()],data=new Map();
 globalThis.document={getElementById(id){assert(elements.has(id),`missing HTML control ${id}`);return elements.get(id);},querySelectorAll(q){return q==='[data-review-save]'?saves:[];}};
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 return {get:id=>elements.get(id),saves,data};
}
test('reader-matched Moonlight preserves the 12133 observation and computes every HP/opening combination',async()=>{
 const ui=controls();
 ui.data.set('lc-entry-review:260:v1',JSON.stringify({selection:{attack:'heavy_magic',preset:'magic-2',type:'magical',element:'冰',statReference:'int',fullHp:true,openingBuffActive:false,dualWield:true,specialAttack:true,criticalEnabled:true}}));
 const base={hp:10702,mp:459,attack:1222,defense:1407,intelligence:2512,mind:1619};
 const profile={characterId:'260',name:'洛琪希',baseStats:base,equipment:[{name:'洛琪希之杖',type:'法杖'},{name:'洛琪希的衣服',type:'长袍'}],moves:[],magic:[{id:'magic-2',kind:'magic',name:'泽诺克莱昂',element:'冰',statReference:'int',purpose:'attack'}]};
 const seeds=[...CATALOG,...ACCOUNT_BLESSING_CATALOG];
 const catalog=buildCatalog(seeds.map(({id,name,text,group})=>({id,name,text,group})),seeds);
 const context={attack:'magic',damageType:'magical',element:'ice',weaponCount:1,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe'],fullHp:true,accountBlessings:true};
 const report={kind:'last-cloudia-effect-report',characterId:'260',profile,...evaluateCatalog(catalog,context)};
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/roxy-reader-bonuses.json',import.meta.url)));
 let last;const w=initEntryWorkflow({characterId:'260',onConfirm:(r,review)=>{last={r,review};},onInvalidate(){},onSelection(){}});
 w.receive(report);
 await w.importFile({name:'reader.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{unitId:502220,stats:{...base,intelligence:12133},bonuses:fixture.bonuses}]})});
 for(const choice of ['entryUseWeb','entryUseReader']){
  ui.get(choice).fire('click');
  for(const [fullHp,opening] of [[true,false],[false,false],[true,true],[false,true],[true,false]]){
   for(const [id,value] of [['fullHp',fullHp],['openingBuffActive',opening]]){ui.get(id).checked=value;ui.get(id).fire('change');}
   assert(w.isConfirmed(),ui.get('entryStatus').textContent);
   assert.equal(last.review.panels.intelligence,12133,'checkboxes must not rewrite the reader observation');
   const layer=projectAttackLayers(last.review.panelLayers.intelligence,12133);
   assert(layer.ok,layer.reason);assert.equal(layer.base,6741);assert.equal(layer.percent,fullHp?80:50);
   const result=calculate({...defaultInput(),attackBasis:'layers',attackBase:layer.base,runtimeStatPercent:layer.percent,attack:layer.panel,type:'magical',skillType:'magic',element:'冰',coefficient:.52,skillPercent:67,cap:2e9});
   assert.equal(result.context.attack,fullHp?16650:14627);assert(result.normal.mean>0);
  }
 }
 // A saved v148 group omitted some HP reader approvals. Repair the same
 // report's mode records without accepting changed website numeric rules.
 const session=w.exportSession();
 for(const approved of Object.values(session.groupReaderChoices)){delete approved.readerModesRevision;approved.modeReader=[];}
 const nextUI=controls();let restored;
 const next=initEntryWorkflow({characterId:'260',onConfirm:(r,review)=>{restored=review;},onInvalidate(){},onSelection(){}});
 assert(next.restoreSession(session));
 for(const fullHp of [false,true]){
  nextUI.get('fullHp').checked=fullHp;nextUI.get('fullHp').fire('change');
  assert(next.isConfirmed(),nextUI.get('entryStatus').textContent);
  assert.equal(projectAttackLayers(restored.panelLayers.intelligence,12133).percent,fullHp?80:50);
 }
});

test('full HP, opening and conditional buffs compute all eight combinations from one reader observation',async()=>{
 const ui=controls(),base={hp:1000,mp:1000,attack:1000,defense:1000,intelligence:1000,mind:1000};
 ui.data.set('lc-entry-review:generic:v1',JSON.stringify({selection:{attack:'magic',preset:'m',type:'magical',element:'冰',statReference:'int',fullHp:true,openingBuffActive:true,magicAwakeningBuffActive:true}}));
 const sources=[CATALOG.find(s=>s.id==='moonlight-ii'),...Object.values(BASIC_STAT_CATALOG).filter(s=>['快速大增魔','魔导觉醒'].includes(s.name)).map(s=>({...s,group:'common'}))];
 const profile={characterId:'generic',baseStats:base,equipment:[],moves:[],magic:[{id:'m',name:'测试魔法',kind:'magic',purpose:'attack',element:'冰',statReference:'int'}]};
 const bonuses=sources.flatMap(s=>s.rules.flatMap(r=>r.effects.filter(e=>e.type==='statBuff').map((e,i)=>({id:`${r.id}:${i}`,sourceName:s.name,effectType:e.type,target:e.target,value:e.value,unit:e.unit,conditions:r.conditions,state:'candidate'}))));
 let last;const w=initEntryWorkflow({characterId:'generic',onConfirm:(r,review)=>{last=review;},onInvalidate(){},onSelection(){}});
 w.receive({kind:'last-cloudia-effect-report',characterId:'generic',profile,...evaluateCatalog(sources,{weaponCount:0,fullHp:true,openingBuffActive:true,magicAwakeningBuffActive:true})});
 await w.importFile({name:'conditions.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{unitId:1,stats:{...base,intelligence:1854},bonuses}]})});
 const damage=new Map();
 for(const fullHp of [true,false])for(const opening of [true,false])for(const conditional of [true,false]){
  for(const [id,value] of [['fullHp',fullHp],['openingBuffActive',opening],['conditionBuffActive',conditional]]){ui.get(id).checked=value;ui.get(id).fire('change');}
  assert(w.isConfirmed(),ui.get('entryStatus').textContent);
  const layer=projectAttackLayers(last.panelLayers.intelligence,1854),percent=(fullHp?30:0)+(conditional?50:opening?35:0);
  assert(layer.ok,layer.reason);assert.equal(layer.percent,percent);assert.equal(last.panels.intelligence,1854);
  const result=calculate({...defaultInput(),attackBasis:'layers',attackBase:layer.base,runtimeStatPercent:layer.percent,attack:layer.panel,type:'magical',skillType:'magic',element:'冰',cap:2e9});
  assert(result.normal.mean>0);damage.set(`${fullHp}/${opening}/${conditional}`,result.normal.mean);
 }
 for(const opening of [true,false])for(const conditional of [true,false])assert(damage.get(`true/${opening}/${conditional}`)>damage.get(`false/${opening}/${conditional}`));
});
test('full-page handoff restores imported reader data, reviewed panels, exclusions and in-progress skill parameters',async()=>{
 const ui=controls(),base={hp:100,mp:100,attack:100,defense:100,intelligence:100,mind:100};
 ui.data.set('lc-entry-review:260:v1',JSON.stringify({selection:{attack:'magic',preset:'m',type:'magical',statReference:'int',element:'冰',criticalEnabled:false,specialAttack:false,fullHp:false}}));
 const profile={characterId:'260',baseStats:base,equipment:[],moves:[],magic:[{id:'m',kind:'magic',name:'测试冰魔法',purpose:'attack',element:'冰',statReference:'int'}]};
 const catalog=[{id:'cap',name:'上限技能',group:'common',rules:[{id:'cap-r',review:'ready',conditions:[],effects:[{type:'cap',target:'魔法伤害上限',value:2000,unit:''}]}]}];
 const report={kind:'last-cloudia-effect-report',characterId:'260',profile,...evaluateCatalog(catalog,{attack:'magic',damageType:'magical',element:'ice'})};
 let original;const workflow=initEntryWorkflow({characterId:'260',onConfirm:(r,review)=>{original={r,review};},onInvalidate(){},onSelection(){}});
 workflow.receive(report);await workflow.importFile({name:'battle.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,battleId:'kept-battle',units:[{unitId:502220,stats:base,bonuses:[]}]})});
 ui.get('entryUseWeb').fire('click');workflow.setManualPanel('intelligence',10111);assert(workflow.isConfirmed());
 const capRow=ui.get('entryEffectsReview').innerHTML.split('</tr>').find(r=>r.includes('上限技能'));
 ui.get('entryEffectsReview').fire('change',{dataset:{entryChoice:capRow.match(/data-entry-choice="(\d+)"/)[1]},value:'exclude'});
 ui.get('coefficient').value='0.52';ui.get('hits').value='35';ui.get('skillPercent').value='67';
 const snapshot=workflow.exportSession(),selection=workflow.selection(),expected=buildDamageImport(original.r);
 const nextUi=controls();let restored,reader;
 const next=initEntryWorkflow({characterId:'260',onConfirm:(r,review)=>{restored={r,review};},onRead:value=>{reader=value;},onInvalidate(){},onSelection(){}});
 assert.equal(next.restoreSession(snapshot),true);assert(next.isConfirmed());
 assert.equal(reader.battle.battleId,'kept-battle');assert.equal(reader.unit.unitId,502220);assert.equal(restored.review.panels.intelligence,10111);
 assert.deepEqual(next.selection(),selection);assert.deepEqual(buildDamageImport(restored.r),expected);
 assert.equal(nextUi.get('coefficient').value,'0.52');assert.equal(nextUi.get('hits').value,'35');assert.equal(nextUi.get('skillPercent').value,'67');
 assert.equal(next.restoreSession({...snapshot,characterId:'245'}),false);
});
test('review UI events preserve manual panel, save from both sections, keep reminders inert and migrate dual stage',async()=>{
 const ui=controls();
 ui.data.set('lc-entry-review:260:v1',JSON.stringify({selection:{attack:'magic',preset:'magic-1',type:'magical',element:'冰',statReference:'int',dualWield:true,specialAttack:true},hitParameters:{'magic:magic-1:dual':{hitMultiplier:'2',hitDamageRatio:'0.6',hitScaleStage:'beforeCap'}}}));
 const context={attack:'magic',damageType:'magical',element:'ice',weaponCount:1,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe'],fullHp:true,chainStacks:1,accountBlessings:true};
 const profile={characterId:'260',name:'洛琪希',baseStats:{hp:10702,mp:459,attack:1222,defense:1407,intelligence:2512,mind:1619},equipment:[{name:'洛琪希之杖',type:'法杖'},{name:'洛琪希的衣服',type:'长袍'}],moves:[],magic:[{id:'magic-1',kind:'magic',name:'测试冰魔法',element:'冰',statReference:'int',purpose:'attack'}]};
 const report={kind:'last-cloudia-effect-report',characterId:'260',profile,...evaluateCatalog([...CATALOG,...ACCOUNT_BLESSING_CATALOG],context)};
 const unit={unitId:502220,name:'洛琪希',capturedAt:'entry',stats:{hp:13591,mp:1018,attack:1270,defense:1621,intelligence:6741,mind:2808},bonuses:[]};
 let last=null;
 const workflow=initEntryWorkflow({characterId:'260',onConfirm:(r,review)=>{last={r,review};},onInvalidate:()=>{},onSelection:()=>{}});
 workflow.receive(report);
 await workflow.importFile({name:'entry.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,battleId:'entry-battle',units:[unit]})});
 ui.get('entryUseWeb').fire('click');
 assert(workflow.isConfirmed());assert(last);
 assert.equal(workflow.selection().hitScaleStage,undefined); // old beforeCap removed
 assert.equal(buildDamageImport(last.r).hitScaleStage,'core');
 assert.equal(last.review.panels.intelligence,6741);
 assert(!ui.get('entrySpecialReview').innerHTML.includes('<select'));
 assert(ui.get('entrySpecialReview').innerHTML.includes('水王级魔术师'));
 workflow.setManualPanel('intelligence',10111);
 for(const button of ui.saves){button.fire('click');assert.equal(last.review.finish,true);assert.equal(last.review.panels.intelligence,10111);}
 assert.equal(resolveAttackLayers(last.review.panelLayers.intelligence,last.review.panels.intelligence).percent,50);
 assert.equal(buildDamageImport(last.r).effects.filter(e=>e.name.includes('加护 · 长袍 · 魔法伤害')).length,1);
 const capOff=buildDamageImport(last.r).capAdded;
 assert.equal(workflow.selection().criticalEnabled,false);
 ui.get('criticalEnabled').checked=true;ui.get('criticalEnabled').fire('change');
 assert(workflow.isConfirmed());assert.equal(buildDamageImport(last.r).magicCanCrit,true);
 assert.equal(buildDamageImport(last.r).capAdded,capOff+2000);
 assert(ui.get('entryBonusReview').innerHTML.includes('冰属性暴击伤害'));
 ui.get('criticalEnabled').checked=false;ui.get('criticalEnabled').fire('change');
 assert(workflow.isConfirmed());assert.equal(buildDamageImport(last.r).magicCanCrit,false);
 assert.equal(buildDamageImport(last.r).capAdded,capOff);
 assert(!ui.get('entryBonusReview').innerHTML.includes('冰属性暴击伤害'));
 ui.get('criticalEnabled').checked=true;ui.get('criticalEnabled').fire('change');
 assert(workflow.isConfirmed());assert.equal(buildDamageImport(last.r).capAdded,capOff+2000);
 const capRow=ui.get('entryEffectsReview').innerHTML.split('</tr>').find(r=>r.includes('冰属性暴击·改'));
 const capIndex=capRow.match(/data-entry-choice="(\d+)"/)[1];
 ui.get('entryEffectsReview').fire('change',{dataset:{entryChoice:capIndex},value:'exclude'});
 ui.get('criticalEnabled').checked=false;ui.get('criticalEnabled').fire('change');
 ui.get('criticalEnabled').checked=true;ui.get('criticalEnabled').fire('change');
 assert(workflow.isConfirmed());assert.equal(buildDamageImport(last.r).capAdded,capOff,'excluded permission-skill cap must not return');
 ui.get('criticalEnabled').checked=false;ui.get('criticalEnabled').fire('change');

 ui.get('dualWield').checked=false;ui.get('dualWield').fire('change');
 assert.equal(buildDamageImport(last.r).hitMultiplier,1);assert.equal(last.r.context.weaponCount,1);assert.equal(last.r.context.robe,true);
 const before=last.review.panels.intelligence;ui.get('entryUseReader').fire('click');
 assert.equal(last.review.panels.intelligence,before);assert.match(ui.get('entryBonusBulkNote').textContent,/保留原选择/);
 assert(workflow.adoptAttackObservation({explicitSelection:true,unitId:502220,stats:{intelligence:12133},capturedAt:'later',sampleId:'group'}));
 assert.equal(last.review.panels.intelligence,12133);assert.equal(last.review.panels.defense,1621);assert.equal(unit.stats.intelligence,6741);
 assert(ui.get('entryStatReview').innerHTML.includes('攻击时观察值'));
 // HP simulation must not erase or rewrite the original reader observation.
 const guidance=magicBuffOptions({magic:[{name:'魔术指导',description:'为一名我方单位赋予INT+65%、魔法伤害上限+30,000的增益'}]});
 ui.get('fullHp').checked=false;ui.get('fullHp').fire('change');
 assert(workflow.isConfirmed());assert.equal(last.r.context.fullHp,false);assert.equal(last.r.context.lowHp,false);
 assert.equal(last.review.panels.intelligence,12133);
 let stat=last.review.panelLayers.intelligence;
 assert.equal(stat.value,10111);assert.equal(projectAttackLayers(stat,12133).panel,10111);
 assert.equal(projectAttackLayers(stat,12133).percent,50);
 const offLayer=projectAttackLayers(stat,12133),offImport=buildDamageImport(last.r);
 const offDamage=calculate({...defaultInput(),attackBasis:'layers',attackBase:offLayer.base,runtimeStatPercent:offLayer.percent,attack:offLayer.panel,type:'magical',skillType:'magic',element:'冰',effects:offImport.effects});
 assert(offDamage.normal.mean>0,'switching full HP off must still produce damage');
 assert.equal(magicBuffLayer(stat,12133,guidance).panel,11122);
 ui.get('fullHp').checked=true;ui.get('fullHp').fire('change');stat=last.review.panelLayers.intelligence;
 assert.equal(projectAttackLayers(stat,10111).panel,12133);
 assert.equal(magicBuffLayer(stat,12133,guidance).panel,13144);
 assert.equal(magicBuffLayer(stat,11122,guidance).panel,13144);
 assert.equal(last.review.panels.intelligence,12133);assert.equal(unit.stats.intelligence,6741);

 // Re-importing v0.37 adopts one latest stable snapshot by default, including DEF/MND.
 const snapshots=[{id:'panel-1',elapsedMs:0,stableForMs:750,stats:unit.stats},{id:'panel-2',elapsedMs:1500,stableForMs:1000,capturedAt:'stable',stats:{...unit.stats,defense:2295,intelligence:12133,mind:3482}}];
 await workflow.importFile({name:'new.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,readerVersion:'0.37',units:[{...unit,panelSnapshots:snapshots,latestStablePanelSnapshotId:'panel-2'}]})});
 ui.get('entryUseWeb').fire('click');
 assert.equal(last.review.panels.intelligence,12133);assert.equal(last.review.panels.defense,2295);assert.equal(last.review.panels.mind,3482);
 ui.get('entrySnapshotPick').value='entry';ui.get('entrySnapshotPick').fire('change');workflow.applySelection();
 assert.equal(last.review.panels.intelligence,6741);assert.equal(last.review.panels.defense,1621);
 ui.get('entrySnapshotPick').value='panel-2';ui.get('entrySnapshotPick').fire('change');workflow.applySelection();
 assert.equal(last.review.panels.intelligence,12133);assert.equal(last.review.panels.defense,2295);

});

test('all save routes return incomplete drafts, persist per-report observations and report storage failure honestly',async()=>{
 let ui=controls(),returned=[];
 const makeWorkflow=()=>initEntryWorkflow({characterId:'generic',onConfirm:()=>{throw new Error('no attack selected');},onInvalidate:()=>{},onSelection:()=>{},onDraftSaved:r=>returned.push(r)});
 const report={characterId:'generic',profile:{characterId:'generic',name:'test',baseStats:{hp:100,mp:10,attack:20,defense:30,intelligence:40,mind:50},magic:[],moves:[],equipment:[]},...evaluateCatalog([{id:'bonus',name:'普通加成',group:'common',rules:[{id:'bonus-1',conditions:[],effects:[{type:'damage',target:'伤害',value:10,unit:'%'}],review:'ready'}]}],{accountBlessings:false})};
 const unit={unitId:1,stats:{hp:100,mp:10,attack:20,defense:30,intelligence:40,mind:50},bonuses:[],panelSnapshots:[{id:'later',elapsedMs:1000,stableForMs:750,stats:{hp:100,mp:10,attack:21,defense:31,intelligence:41,mind:51}}],latestStablePanelSnapshotId:'later'};
 const file=(battleId='one')=>({name:'same-name.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,battleId,units:[unit]})});
 let workflow=makeWorkflow();workflow.receive(report);
 for(const button of [...ui.saves,ui.get('entryConfirm')])button.fire('click');
 assert.equal(workflow.saveAndReturn(),true);assert.equal(returned.length,4);assert(returned.every(r=>!r.ready));assert(!workflow.isConfirmed());
 assert.match(ui.get('entrySaveStatus').textContent,/草稿已保存/);
 await workflow.importFile(file());
 ui.get('entryEffectsReview').fire('change',{dataset:{entryChoice:'0'},value:'web'});
 ui.get('entrySnapshotPick').value='entry';ui.get('entrySnapshotPick').fire('change');
 workflow.setManualPanel('defense',66);
 assert(workflow.adoptAttackObservation({explicitSelection:true,unitId:1,stats:{intelligence:45},capturedAt:'attack',sampleId:'sample'}));
 workflow.saveAndReturn();
 const persisted=new Map(ui.data);ui=controls();for(const [k,v] of persisted)ui.data.set(k,v);
 workflow=makeWorkflow();workflow.receive(report);await workflow.importFile(file());
 assert.equal(workflow.panelsPreview().intelligence,45);assert.equal(workflow.panelsPreview().defense,66);
 assert.match(ui.get('entrySnapshotPick').innerHTML,/value="entry" selected/);
 assert.match(ui.get('entrySaveStatus').textContent,/已恢复/);
 assert.match(ui.get('entryEffectsReview').innerHTML.split('</tr>')[0],/<option value="web" selected>/);
 // Identical filename and unit ID are insufficient to carry choices to another battle.
 await workflow.importFile(file('two'));
 assert.equal(workflow.panelsPreview().intelligence,41);assert.equal(workflow.panelsPreview().defense,31);
 assert(!ui.get('entryEffectsReview').innerHTML.split('</tr>')[0].includes('<option value="web" selected>'));
 ui.get('entryEffectsReview').fire('change',{dataset:{entryChoice:'0'},value:'exclude'});
 await workflow.importFile(file());assert.equal(workflow.panelsPreview().intelligence,45);
 assert.match(ui.get('entryEffectsReview').innerHTML.split('</tr>')[0],/<option value="web" selected>/);
 const before=returned.length;globalThis.localStorage.setItem=()=>{throw new Error('quota');};
 assert.equal(workflow.saveAndReturn(),false);assert.equal(returned.length,before);
 assert.match(ui.get('entrySaveStatus').textContent,/未能保存/);
});

test('generic full-HP multi-stat source retains effect identity after deleting one stat',async()=>{
 const ui=controls(),base={hp:100,mp:100,attack:100,defense:100,intelligence:100,mind:100};
 ui.data.set('lc-entry-review:generic:v1',JSON.stringify({selection:{attack:'magic',preset:'m',type:'magical',statReference:'int',element:'冰',fullHp:true}}));
 const rule={id:'hp-r',text:'HP全满时，STR、INT+30%',conditions:[{field:'fullHp',op:'eq',value:true}],effects:['攻击力','法强'].map(target=>({type:'statBuff',target,value:30,unit:'%'})),review:'ready'};
 const report={kind:'last-cloudia-effect-report',characterId:'generic',profile:{characterId:'generic',baseStats:base,equipment:[],moves:[],magic:[{id:'m',kind:'magic',name:'测试',purpose:'attack',element:'冰',statReference:'int'}]},...evaluateCatalog([{id:'hp',name:'共同满血被动',text:rule.text,group:'common',rules:[rule]}],{attack:'magic',damageType:'magical',element:'ice',fullHp:true,weaponCount:0})};
 let last;const workflow=initEntryWorkflow({characterId:'generic',onConfirm:(r,review)=>{last=review;},onInvalidate:()=>{},onSelection:()=>{}});
 workflow.receive(report);
 await workflow.importFile({size:100,name:'generic.json',text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{unitId:1,stats:{...base,intelligence:133},bonuses:[]}]})});
 assert(workflow.isConfirmed());
 ui.get('reviewPage').fire('click',{closest:q=>q==='[data-entry-delete]'?{dataset:{entryDelete:'0'}}:null});
 assert(workflow.isConfirmed());
 let stat=last.panelLayers.intelligence;
 assert.equal(stat.runtimeCandidates.length,1);assert.equal(stat.runtimeCandidates[0].id,'hp:hp-r:1');
 assert.equal(projectAttackLayers(stat,133).panel,133);assert.equal(projectAttackLayers(stat,133).percent,30);
 ui.get('fullHp').checked=false;ui.get('fullHp').fire('change');
 stat=last.panelLayers.intelligence;assert.equal(projectAttackLayers(stat,133).panel,103);
 ui.get('fullHp').checked=true;ui.get('fullHp').fire('change');
 assert.equal(last.panelLayers.attack.buffs.length,0,'deleted STR cannot return when HP changes');
 assert.equal(projectAttackLayers(last.panelLayers.intelligence,133).percent,30);
 ui.get('reviewPage').fire('click',{closest:q=>q==='[data-entry-delete]'?{dataset:{entryDelete:'1'}}:null});
 assert.equal(last.panelLayers.intelligence.runtimeCandidates.length,0,'deleted INT cannot remain as a simulated source');
});

test('reader groups preserve raw totals and add configured mode effects, with per-report persistence',async()=>{
 let ui=controls(),last;
 ui.data.set('lc-entry-review:260:v1',JSON.stringify({selection:{attack:'magic',preset:'m',type:'magical',statReference:'int',element:'冰',criticalEnabled:true}}));
 const base={hp:10702,mp:459,attack:1222,defense:1407,intelligence:2512,mind:1619};
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/roxy-reader-bonuses.json',import.meta.url)));
 const raw=fixture.bonuses.filter(b=>b.raw.localId!==26634);
 const file=(full=false)=>({name:'same.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,battleId:full?'new-battle':'partial',units:[{unitId:502220,stats:base,bonuses:full?fixture.bonuses:raw}]})});
 const report={kind:'last-cloudia-effect-report',characterId:'260',profile:{characterId:'260',baseStats:base,equipment:[{name:'洛琪希之杖',type:'法杖'},{name:'洛琪希的衣服',type:'长袍'}],moves:[],magic:[{id:'m',kind:'magic',name:'测试',purpose:'attack',element:'冰',statReference:'int'}]},...evaluateCatalog(CATALOG,{attack:'magic',damageType:'magical',element:'ice',weaponCount:1,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe'],fullHp:true,chainStacks:1})};
 const make=()=>initEntryWorkflow({characterId:'260',onConfirm:(r,review)=>{last={r,review};},onInvalidate:()=>{},onSelection:()=>{}});
 const capRow=()=>ui.get('entryBonusReview').innerHTML.split('</tr>').find(r=>r.includes('<b>冰属性魔法伤害上限</b>'));
 const choose=choice=>ui.get('entryBonusReview').fire('change',{dataset:{entryBonusChoice:capRow().match(/data-entry-bonus-choice="(\d+)"/)[1]},value:choice});
 let workflow=make();workflow.receive(report);await workflow.importFile(file());
 ui.get('entryUseWeb').fire('click');assert(workflow.isConfirmed());
 const websiteCap=buildDamageImport(last.r).capAdded;
 assert.match(capRow(),/>15,000</);assert.match(capRow(),/>13,000</);
 assert.match(capRow(),/<option value="reader">读取器/);
 choose('reader');assert(workflow.isConfirmed());
 assert.equal(buildDamageImport(last.r).capAdded,websiteCap);
 assert.equal(last.r.rows.filter(r=>r.origin==='readerGroup').length,3);
 assert.match(capRow(),/>15,000</);assert.match(capRow(),/暴击模式 \+2,000（网站）/);assert.match(capRow(),/采用 15,000/);assert(!capRow().includes('本组网站来源不再叠加'));
 assert.equal(workflow.saveAndReturn(),true);
 const persisted=new Map(ui.data);ui=controls();for(const [key,value] of persisted)ui.data.set(key,value);
 workflow=make();workflow.receive(report);await workflow.importFile(file());
 assert(workflow.isConfirmed());assert.equal(buildDamageImport(last.r).capAdded,websiteCap);
 assert.match(capRow(),/<option value="reader" selected>/);
 ui.get('criticalEnabled').checked=false;ui.get('criticalEnabled').fire('change');
 assert(workflow.isConfirmed());assert.match(capRow(),/<option value="reader" selected>/);
 assert.equal(buildDamageImport(last.r).capAdded,websiteCap-2000);
 ui.get('criticalEnabled').checked=true;ui.get('criticalEnabled').fire('change');
 assert(workflow.isConfirmed());assert.equal(buildDamageImport(last.r).capAdded,websiteCap);
 choose('web');assert.equal(buildDamageImport(last.r).capAdded,websiteCap);
 choose('reader');
 await workflow.importFile(file(true));assert(!capRow().includes('<option value="reader" selected>'));
 await workflow.importFile(file());assert(workflow.isConfirmed());assert.match(capRow(),/<option value="reader" selected>/);
 assert.equal(buildDamageImport(last.r).capAdded,websiteCap);
 // A known mapped source deleted from the website cannot return through group adoption.
 const deleteIndex=capRow().match(/data-entry-delete="(\d+)"/)[1];
 ui.get('reviewPage').fire('click',{closest:q=>q==='[data-entry-delete]'?{dataset:{entryDelete:deleteIndex}}:null});
 assert(workflow.isConfirmed());assert.equal(buildDamageImport(last.r).capAdded,websiteCap-5000);
 assert.match(capRow(),/>13,000</);assert.match(capRow(),/采用小计 8,000/);
 // A reader-only supplement selected earlier is transferred once, not added again.
 const extra=structuredClone(raw.find(b=>b.raw.localId===27365&&b.processId===1050354));
 extra.id='additional-robe';extra.sourceName='附加读取1%';extra.raw.localId=99999;extra.raw.values[1]=100;
 await workflow.importFile({name:'extra.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{unitId:502220,stats:base,bonuses:[...raw,extra]}]})});
 ui.get('entryUseWeb').fire('click');
 const supplementRow=ui.get('entrySupplementReview').innerHTML.split('</tr>').find(r=>r.includes('附加读取1%'));
 ui.get('entrySupplementReview').fire('change',{dataset:{readerSupplement:supplementRow.match(/data-reader-supplement="(\d+)"/)[1]},value:'reader'});
 const magicRow=ui.get('entryBonusReview').innerHTML.split('</tr>').find(r=>r.includes('<b>魔法伤害</b>'));
 ui.get('entryBonusReview').fire('change',{dataset:{entryBonusChoice:magicRow.match(/data-entry-bonus-choice="(\d+)"/)[1]},value:'reader'});
 assert(workflow.isConfirmed());
 assert.equal(buildDamageImport(last.r).effects.filter(e=>e.name.includes('附加读取1%')).length,1);
 const supplemental=ui.get('entrySupplementReview').innerHTML.split('</tr>').find(r=>r.includes('附加读取1%'));
 assert.match(supplemental,/disabled/);assert.match(supplemental,/只计入一次/);
 ui.get('entryBonusReview').fire('change',{dataset:{entryBonusChoice:magicRow.match(/data-entry-bonus-choice="(\d+)"/)[1]},value:'web'});
 assert(workflow.isConfirmed());assert(!buildDamageImport(last.r).effects.some(e=>e.name.includes('附加读取1%')));
});

test('switches activate configured critical, killer and full-HP packages after reader adoption while off',async()=>{
 const ui=controls(),base={hp:100,mp:100,attack:100,defense:100,intelligence:100,mind:100};
 ui.data.set('lc-entry-review:generic:v1',JSON.stringify({selection:{attack:'magic',preset:'m',type:'magical',statReference:'int',element:'冰',criticalEnabled:false,specialAttack:false,fullHp:false}}));
 const effect=(type,target,value)=>({type,target,value,unit:type==='damage'?'%':''});
 const source=(id,conditions,effects)=>({id,name:id,group:'common',rules:[{id:`${id}-r`,conditions,effects,review:'ready'}]});
 const catalog=[source('基础冰上限',[],[effect('cap','冰属性魔法伤害上限',1000)]),
  source('通用冰魔法暴击',[],[effect('critPermission','冰属性魔法',true),effect('cap','冰属性魔法伤害上限',2000)]),
  source('通用满血',[{field:'fullHp',op:'eq',value:true}],[effect('cap','冰属性魔法伤害上限',3000),effect('damage','魔法伤害',30)]),
  source('通用特攻',[],[effect('killer','Boss',true)]),
  source('通用特攻增幅',[],[effect('cap','特攻伤害上限',2000),effect('damage','特攻伤害',50)])];
 const profile={characterId:'generic',baseStats:base,equipment:[],moves:[],magic:[{id:'m',kind:'magic',name:'测试',purpose:'attack',element:'冰',statReference:'int'}]};
 const report=()=>({kind:'last-cloudia-effect-report',characterId:'generic',profile,...evaluateCatalog(catalog,{attack:'magic',damageType:'magical',element:'ice'})});
 const bonuses=[{id:'base-cap',sourceName:'基础冰上限',effectType:'cap',target:'冰属性魔法伤害上限',value:1000,unit:'',conditions:[],state:'candidate'},
  {id:'reader-crit',sourceName:'读取器暴击上限',effectType:'cap',target:'暴击伤害上限',value:6000,unit:'',conditions:[],state:'candidate'}];
 let last;const workflow=initEntryWorkflow({characterId:'generic',onConfirm:r=>{last=r;},onInvalidate:()=>{},onSelection:()=>{}});
 workflow.receive(report());await workflow.importFile({name:'generic.json',size:100,text:async()=>JSON.stringify({kind:'last-cloudia-battle-entry',schemaVersion:1,units:[{unitId:1,stats:base,bonuses}]})});
 ui.get('entryUseWeb').fire('click');ui.get('entryUseReader').fire('click');
 assert(workflow.isConfirmed());const baseline=buildDamageImport(last).capAdded;
 const toggle=(id,on)=>{ui.get(id).checked=on;ui.get(id).fire('change');assert(workflow.isConfirmed(),ui.get('entryStatus').textContent);};
 toggle('criticalEnabled',true);
 let imp=buildDamageImport(last);assert.equal(imp.capAdded,baseline+2000);assert.equal(imp.criticalCapAdded,6000);assert.equal(imp.magicCanCrit,true);
 toggle('specialAttack',true);imp=buildDamageImport(last);assert.equal(imp.capAdded,baseline+4000);assert(imp.effects.some(e=>e.kind==='killer'&&e.percent===50));
 toggle('fullHp',true);imp=buildDamageImport(last);assert.equal(imp.capAdded,baseline+7000);assert(imp.effects.some(e=>e.name.includes('通用满血')&&e.percent===30));
 toggle('criticalEnabled',false);assert.equal(buildDamageImport(last).capAdded,baseline+5000);assert.equal(buildDamageImport(last).criticalCapAdded,0);
 toggle('specialAttack',false);imp=buildDamageImport(last);assert.equal(imp.capAdded,baseline+3000);assert(!imp.effects.some(e=>e.kind==='killer'));
 toggle('fullHp',false);assert.equal(buildDamageImport(last).capAdded,baseline);
 toggle('criticalEnabled',true);
 const row=ui.get('entryEffectsReview').innerHTML.split('</tr>').find(r=>r.includes('通用冰魔法暴击')&&r.includes('冰属性魔法伤害上限'));
 ui.get('entryEffectsReview').fire('change',{dataset:{entryChoice:row.match(/data-entry-choice="(\d+)"/)[1]},value:'exclude'});
 toggle('criticalEnabled',false);toggle('criticalEnabled',true);
 assert.equal(buildDamageImport(last).capAdded,baseline,'manual exclusions take priority over mode activation');
 toggle('fullHp',true);
 const capGroup=ui.get('entryBonusReview').innerHTML.split('</tr>').find(r=>r.includes('<b>冰属性魔法伤害上限</b>'));
 ui.get('entryBonusReview').fire('change',{dataset:{entryBonusChoice:capGroup.match(/data-entry-bonus-choice="(\d+)"/)[1]},value:'reader'});
 catalog.find(s=>s.id==='通用满血').rules[0].effects[0].value=3500;
 workflow.receive(report());assert(!workflow.isConfirmed());assert.match(ui.get('entryStatus').textContent,/重新选择|未选择/);
});

test('near-death, opening and bundled conditional Buff retain their state across saved sessions',async()=>{
 const {BASIC_STAT_CATALOG}=await import('../dist/basic-stat-catalog.mjs');
 const ui=controls(),base={hp:1000,mp:100,attack:1000,defense:1000,intelligence:1000,mind:1000};
 const names=['激昂','觉醒','快速鼓舞','自动鼓舞'];
 const sources=Object.values(BASIC_STAT_CATALOG).filter(e=>names.includes(e.name)).map(e=>({...e,group:'common'}));
 const profile={characterId:'generic',baseStats:base,equipment:[],moves:[{id:'s1',kind:'s1',name:'测试',purpose:'attack',element:'无',statReference:'str'}],magic:[]};
 ui.data.set('lc-entry-review:generic:v1',JSON.stringify({selection:{attack:'s1',preset:'s1',type:'physical',statReference:'str',element:'无',fullHp:true}}));
 let last;
 const w=initEntryWorkflow({characterId:'generic',onConfirm:(r,review)=>{last={r,review};},onInvalidate(){},onSelection(){}});
 w.receive({kind:'last-cloudia-effect-report',characterId:'generic',profile,...evaluateCatalog(sources,{weaponCount:0,accountBlessings:false,fullHp:true})});
 const toggle=(id,value)=>{ui.get(id).checked=value;ui.get(id).fire('change');};
 toggle('lowHp',true);assert.equal(w.selection().fullHp,false);assert.equal(ui.get('fullHp').checked,false);
 toggle('conditionBuffActive',true);toggle('fullHp',true);
 assert.equal(w.selection().lowHp,false);assert.equal(ui.get('lowHp').checked,false);assert.equal(w.selection().awakeningBuffActive,true);
 toggle('openingBuffActive',true);
 for(const id of ['awakeningBuffActive','magicAwakeningBuffActive','ultimateUsedBuffActive','damageTakenBuffActive','reviveBuffActive','ultimateGaugeFull'])assert.equal(w.selection()[id],true);
 assert.equal(w.selection().realSunday,false);
 const saved=w.exportSession(),nextUI=controls();
 const next=initEntryWorkflow({characterId:'generic',onConfirm(){},onInvalidate(){},onSelection(){}});
 assert(next.restoreSession(saved));
 assert.equal(nextUI.get('fullHp').checked,true);assert.equal(nextUI.get('lowHp').checked,false);
 assert.equal(nextUI.get('openingBuffActive').checked,true);assert.equal(nextUI.get('conditionBuffActive').checked,true);
 for(const id of ['awakeningBuffActive','magicAwakeningBuffActive','ultimateUsedBuffActive','damageTakenBuffActive','reviveBuffActive','ultimateGaugeFull'])assert.equal(nextUI.get(id).checked,true);
 assert.equal(nextUI.get('realSunday').checked,false);
});
