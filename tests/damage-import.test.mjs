import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDamageImport} from '../dist/damage-import.mjs';
import {CATALOG} from '../dist/roxy-rules.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {defaultInput,calculate,context} from '../dist/damage-engine.mjs';
const report=(c={},overrides={})=>({kind:'last-cloudia-effect-report',characterId:'260',characterName:'洛琪希',...evaluateCatalog(CATALOG,{weaponCount:1,...c},overrides)});
test('import retains individual damage sources, cap components and independent special rules',()=>{
 const d=buildDamageImport(report({penetration:true,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe']}));
 assert.deepEqual(d.blockers,[]);assert.equal(d.bossKiller,true);assert.equal(d.defenseRatio,.5);
 assert.equal(d.hitMultiplier,2);assert.equal(d.hitDamageRatio,.6);assert.equal(d.magicCanCrit,true);assert.equal(d.critAdded,13);
 assert.equal(d.effects.filter(e=>e.kind==='boss').length,2);
 assert.equal(d.effects.filter(e=>e.percent===30&&e.kind==='magical').length,2);
 assert.equal(d.effects.find(e=>e.name.startsWith('特攻增幅')).kind,'killer');
 assert.equal(d.effects.find(e=>e.kind==='critical').percent,50);
 assert(d.reference.some(r=>r.effect.type==='statBuff'&&r.effect.value===50));
 assert(!d.effects.some(e=>/魔导提升极|EX灵气/.test(e.name)));
 assert(d.capAdded>9999);assert.equal(new Set(d.effects.map(e=>e.importId)).size,d.effects.length);
 assert.deepEqual(buildDamageImport(report({penetration:true,staff:true,robe:true,equipmentIds:['roxy-staff','roxy-robe']})),d);
});
test('conditions and disabled sources remain excluded; INT reference does not become magic damage',()=>{
 const d=buildDamageImport(report({attack:'s1',damageType:'physical',penetration:true}));
 assert.equal(d.type,'physical');assert.equal(d.statReference,'int');assert.equal(d.skillType,'skill');
 assert.equal(d.defenseRatio,1);assert.equal(d.hitMultiplier,1);assert.equal(d.bossKiller,true);
 assert(d.warnings.some(w=>w.includes('需分别验证')));
 const inactive=buildDamageImport(report({weaponCount:2,penetration:false},{'source:special-boost':{disabled:true}}));
 assert.equal(inactive.defenseRatio,1);assert(!inactive.effects.some(e=>e.kind==='killer'));
 assert(!inactive.effects.some(e=>e.importId.startsWith('water-king:water-single')));
 assert.equal(inactive.effects.some(e=>e.importId.startsWith('roxy-staff:')),false);
});
test('unsupported damage and cap rules are explicitly blocked rather than dropped',()=>{
 const r=report();r.rows.push({sourceId:'custom',sourceName:'自定义',status:'active',rule:{id:'custom',effects:[{type:'damage',target:'未知效果',value:20,unit:'%'},{type:'cap',target:'上限',value:50,unit:'%'}]}});
 assert.equal(buildDamageImport(r).blockers.length,2);
});
test('Boss killer applies once, defense scaling does not mutate input, and scope stays bound',()=>{
 const s={...defaultInput(),bossKiller:true,defenseRatio:.5,races:['龙'],killerRaces:['龙']};
 assert.equal(context(s).killerFactor,1.5);assert.equal(context(s).defense,2000);
 calculate(s);calculate(s);assert.equal(s.defense,4000);
 assert.equal(context({...s,boss:false,races:[]}).killer,false);
 const effects=buildDamageImport(report()).effects;
 assert.equal(calculate({...defaultInput(),effects}).active.length,0,'ice magic import cannot leak to Eris physical');
});
test('split hit correction requires explicit placement and caps apply at chosen stage',()=>{
 const s={...defaultInput(),cap:600,hitMultiplier:2,hitDamageRatio:.6,hitScaleStage:''};
 assert.throws(()=>calculate(s),/试算位置/);
 const before=calculate({...s,hitScaleStage:'beforeCap'}),after=calculate({...s,hitScaleStage:'afterCap'});
 assert.equal(before.totalHits,16);assert.equal(after.totalHits,16);
 assert.equal(after.normal.max,360);assert(before.normal.max>360);
 assert.equal(after.totalMean,after.mean*16);
});
