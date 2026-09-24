import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveAttackLayers} from '../dist/attack-layers.mjs';
import {calculateWebsitePanel} from '../dist/panel-calculator.mjs';
import {defaultInput,calculate,prepare} from '../dist/damage-engine.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {ACCOUNT_BLESSING_CATALOG} from '../dist/account-blessings.mjs';
import {parseDamageFormulaCsv} from '../dist/formula-csv-parser.mjs';
const base={hp:10702,mp:459,attack:1222,defense:1407,intelligence:2512,mind:1619};
const equipment=[{name:'洛琪希之杖',type:'法杖'},{name:'洛琪希的衣服',type:'长袍'}];
function panel(fullHp=true){
 const r=evaluateCatalog([...CATALOG,...ACCOUNT_BLESSING_CATALOG],{accountBlessings:true,weaponCount:1,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe'],fullHp});
 return calculateWebsitePanel(base,r,{equipment}).stats.intelligence;
}
function damageInput(p,observed){
 const layer=resolveAttackLayers(p,observed);assert(layer.ok);
 return {...defaultInput(),attackBasis:'layers',attack:observed,attackBase:layer.base,runtimeStatPercent:layer.percent,
  coefficient:.52,skillPercent:67,defense:8000,type:'magical',skillType:'magic',element:'冰',resistance:50,
  specialAttack:true,killerCorrection:50,hits:35,hitMultiplier:2,hitDamageRatio:.6,hitScaleStage:'core',cap:200000,critRate:0,
  effects:[50,30,20,15,20,30,30,30,4,20,35,4.06,1].map(percent=>({percent,kind:'magical',stage:'post',enabled:true}))};
}
test('normal imports use independently calculated pre-buff base, not final subtotal',()=>{
 const p=panel(false),s=damageInput(p,p.value),r=calculate(s);
 assert.equal(p.beforeBuff,6741);assert.equal(p.subtotal,10111);
 assert.equal(s.attackBase,6741);assert.equal(s.runtimeStatPercent,50);
 assert.equal(r.context.attack,14627);assert.deepEqual([r.normal.min,r.normal.max],[32611,36247]);
});
test('known HP and EX states are matched to the selected observation without reverse division',()=>{
 const p=panel(true);
 for(const [observed,percent,attack] of [[6741,0,11257],[8763,30,13279],[10111,50,14627],[12133,80,16650]]){
  const s=damageInput(p,observed);assert.equal(s.runtimeStatPercent,percent);assert.equal(calculate(s).context.attack,attack);
 }
 assert.equal(resolveAttackLayers(p,8888).ok,false);
 const missing={...p,issues:['装备属性未提供']};assert.equal(resolveAttackLayers(missing,10111).ok,false);
 assert.equal(resolveAttackLayers({...p,buffs:[...p.buffs,{value:65,family:null}]},12133).ok,false);
 assert.equal(resolveAttackLayers({...p,buffs:[...p.buffs,p.buffs[0]]},12133).ok,false);
});
if(process.env.FORMULA_CSV_FIXTURE)test('pre-guidance formula predicts recorded A/F/Q independently of settledAttack',()=>{
 const csv=parseDamageFormulaCsv(readFileSync(process.env.FORMULA_CSV_FIXTURE,'utf8'));
 const b=csv.battles.find(b=>b.session==='1790218789141'&&b.battle==='1');
 const g=b.settlementGroups.find(g=>g.sourceId===1&&g.attack===14627&&g.defense===8000);
 assert.deepEqual(g.panelIntValues,[{value:10111,count:39}]);
 const s=damageInput(panel(true),g.panelIntValues[0].value);
 // Deliberately poison direct-settlement input: this must remain a formula prediction.
 s.settledAttack=999999;
 const r=calculate(s),p=prepare(s);
 assert.equal(r.context.attack,g.attack);assert.equal(r.context.defense,g.defense);assert(Math.abs(p.q-g.finalRatio)<1e-6);
 assert.equal(b.hpTargets[0].totalDecrease,2410222);
 // Range coverage is not exact per-hit verification; random draws/order are missing.
 for(const event of b.samples.filter(e=>e.sourceId===1&&e.settlement?.attack===14627))assert(event.value>=r.normal.min&&event.value<=r.normal.max);
});
