import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT_BLESSING_CATALOG as catalog,RAW_BLESSING_RECORDS,decodeKnownBlessingEntry} from '../dist/account-blessings.mjs';
import {withAccountBlessings} from '../dist/account-blessings-panel.mjs';
import {evaluateCatalog} from '../dist/effect-rule-engine.mjs';

const base={hp:11252,mp:486,attack:1232,defense:1733,intelligence:1574,mind:2056};
test('Lucia control six stats match max-growth base plus account blessings',()=>{
 assert.deepEqual(withAccountBlessings(base),{hp:12039,mp:500,attack:1281,defense:1784,intelligence:1621,mind:2158});
 assert.equal(catalog.length,47);assert.equal(RAW_BLESSING_RECORDS.length,46);
});
test('element and weapon blessings respect current attack rather than all stacking',()=>{
 const r=evaluateCatalog(catalog,{attack:'magic',damageType:'magical',weaponCount:1,staff:true,element:'ice'});
 const rows=r.rows.filter(r=>r.status==='active');
 assert(rows.some(r=>r.rule.effects.some(e=>e.type==='damage'&&e.value===4.06&&e.target==='冰属性伤害')));
 assert(!rows.some(r=>r.rule.effects.some(e=>e.type==='damage'&&e.target==='暗属性伤害')));
 const naked=evaluateCatalog(catalog,{attack:'normal',damageType:'physical',weaponCount:0,sword:true,staff:true,element:'none'});
 assert(!naked.rows.some(r=>r.status==='active'&&r.rule.conditions.some(c=>['sword','staff'].includes(c.field))));
});
