import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initEntryWorkflow} from '../dist/entry-workflow.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {ACCOUNT_BLESSING_CATALOG} from '../dist/account-blessings.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {resolveAttackLayers} from '../dist/attack-layers.mjs';
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
});
