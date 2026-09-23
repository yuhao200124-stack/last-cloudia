import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT_BLESSING_CATALOG as catalog} from '../dist/account-blessings.mjs';
import {withAccountBlessings} from '../dist/account-blessings-panel.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';
import {validateBattleEntry,websiteCandidates,compareCandidates,resolveReview,decisionKey} from '../dist/entry-preparation.mjs';
import {buildDamageImport} from '../dist/damage-import.mjs';

const base={hp:11252,mp:486,attack:1232,defense:1733,intelligence:1574,mind:2056};
test('Lucia control six stats match max-growth base plus account blessings',()=>{
 assert.deepEqual(withAccountBlessings(base),{hp:12039,mp:500,attack:1281,defense:1784,intelligence:1621,mind:2158});
 assert.equal(catalog.length,46);
});
test('element and weapon blessings respect current attack rather than all stacking',()=>{
 const r=evaluateCatalog(catalog,{attack:'magic',damageType:'magical',weaponCount:1,staff:true,element:'ice'});
 const rows=r.rows.filter(r=>r.status==='active');
 assert(rows.some(r=>r.rule.effects.some(e=>e.type==='damage'&&e.value===4.06&&e.target==='冰属性伤害')));
 assert(!rows.some(r=>r.rule.effects.some(e=>e.type==='damage'&&e.target==='暗属性伤害')));
 const naked=evaluateCatalog(catalog,{attack:'normal',damageType:'physical',weaponCount:0,sword:true,staff:true,element:'none'});
 assert(!naked.rows.some(r=>r.status==='active'&&r.rule.conditions.some(c=>['sword','staff'].includes(c.field))));
});
test('disabled and excluded stat blessings are not included again in base-panel choice',()=>{
 const report={kind:'last-cloudia-effect-report',...evaluateCatalog(catalog,{weaponCount:0,attack:'normal',damageType:'physical',element:'none'})};
 const rows=compareCandidates(websiteCandidates(report),[]);
 const decisions=Object.fromEntries(rows.map(r=>[decisionKey(r),{choice:r.effect.type==='stat'&&r.effect.target==='攻击力'?'exclude':'web'}]));
 const resolved=resolveReview(report,rows,decisions);
 assert.equal(withAccountBlessings(base,resolved).attack,1232);
 assert.equal(withAccountBlessings(base,resolved).intelligence,1621);
 const imported=buildDamageImport(resolved);
 assert(!imported.effects.some(e=>e.effect?.type==='stat'));
});
test('only v0.35 real process-memory MP is migrated, original is retained, migration is idempotent',()=>{
 const r={kind:'last-cloudia-battle-entry',schemaVersion:1,readerVersion:'0.35',statsBasis:'battle-final-at-observation',collection:{method:'read_only_process_memory'},units:[{stats:{mp:500580},current:{mp:495800},bonuses:[]}]};
 const migrated=validateBattleEntry(r);
 assert.equal(migrated.units[0].stats.mp,500);
 assert.equal(migrated.units[0].current.mp,495);
 assert.equal(migrated.units[0].mpRawThousandths.maximum,500580);
 assert.equal(r.units[0].stats.mp,500580);
 assert.equal(validateBattleEntry(migrated).units[0].stats.mp,500);
 assert.equal(validateBattleEntry({...r,readerVersion:'0.36'}).units[0].stats.mp,500580);
 assert.equal(validateBattleEntry({...r,testFixture:true}).units[0].stats.mp,500580);
});
