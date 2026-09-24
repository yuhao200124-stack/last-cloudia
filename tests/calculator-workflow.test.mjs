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
