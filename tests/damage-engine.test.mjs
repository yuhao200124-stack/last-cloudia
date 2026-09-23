import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultInput,calculate,context,prepare,damageAt} from '../dist/damage-engine.mjs';
const effect=(kind,percent,extra={})=>({kind,percent,stage:'post',enabled:true,target:'无',...extra});
test('Eris source parameters edit attack before the exponential core',()=>{
  const s=defaultInput(),r=calculate(s);
  assert.equal(r.context.attack,5775);
  assert.deepEqual([r.normal.min,r.normal.max],[836,929]);
  assert.deepEqual([r.critical.min,r.critical.max],[1120,1244]);
  assert.deepEqual(r.normalTotal,[6688,7432]);
  assert.equal(r.active.length,0); // No inferred multiplier to match 910 -> 947.
  assert.equal(s.attack,3805);
});
test('captured integer core values are reachable without changing source coefficients',()=>{
  const p=prepare(defaultInput());
  for(const d of [876,910]) assert.equal(damageAt(p,(d+.5)/Math.fround(p.base*p.q)).value,d);
});
test('current attack is not multiplied by panel bonuses again; custom skill can have no edit',()=>{
  const s={...defaultInput(),attack:4571,skillPercent:0};
  assert.equal(context(s).attack,4571);
});
test('normal/critical and expectations respect per-hit caps',()=>{
  const s={...defaultInput(),cap:900,critRate:100};
  const r=calculate(s);
  assert.deepEqual([r.critical.min,r.critical.max],[900,900]);
  assert.equal(r.totalMean,7200);
  assert(r.normal.mean<900);
  const n=calculate({...s,critRate:0});assert.equal(n.totalMean,n.normal.mean*8);
});
test('Boss status alone does not trigger race killer; multiple matches apply it once',()=>{
  const s={...defaultInput(),races:['龙','神'],killerRaces:['兽']};
  assert.equal(context(s).killerFactor,1);
  s.killerRaces=['龙','神'];assert.equal(context(s).killerFactor,1.5);
  s.killerCorrection=20;assert(Math.abs(context(s).killerFactor-1.8)<1e-6);
});
test('conditions exclude bonuses, including wrong element, race and non-Boss',()=>{
  const s={...defaultInput(),boss:false,effects:[effect('boss',20),effect('element',20,{target:'火'}),effect('race',20,{target:'龙'}),effect('magical',20)]};
  assert.equal(calculate(s).active.length,0);
  assert.equal(calculate(s).normal.max,929);
});
test('independent after-effects round at each step, not as one added group',()=>{
  const s=defaultInput(),base=damageAt(prepare(s),.95).value;
  s.effects=[effect('boss',20),effect('element',20)];
  assert.equal(damageAt(prepare(s),.95).value,Math.round(Math.round(base*1.2)*1.2));
  s.effects[1].enabled=false;assert.equal(damageAt(prepare(s),.95).value,Math.round(base*1.2));
});
test('crit-only damage is excluded from normal branch',()=>{
  const s=defaultInput(),old=calculate(s);s.effects=[effect('critical',30)];
  const r=calculate(s);assert.equal(r.normal.max,old.normal.max);assert.equal(r.critical.max,Math.round(old.critical.max*1.3));
});
test('neutral ignores elemental resistances; immunity stays zero despite after-passives',()=>{
  const s={...defaultInput(),resistance:100,effects:[effect('boss',50)]};
  assert(calculate(s).normal.max>0);
  s.element='火';const r=calculate(s);assert.equal(r.normal.max,0);assert.equal(r.totalMean,0);
});
test('current debuffed defense and Boss Break correction are distinct',()=>{
  const s={...defaultInput(),defense:2599};assert.equal(context(s).defense,2599);
  const original=calculate(s).normal.max;s.break=true;assert.equal(context(s).defense,1299.5);assert(calculate(s).normal.max>original);
  s.boss=false;assert.equal(context(s).defense,2599);
});
test('guard is before cap',()=>{
  const s={...defaultInput(),cap:600,guarded:true,guardReduction:50};
  assert.equal(calculate(s).normal.max,464);
});
test('native core entries and after effects use different rounding stages',()=>{
  const s={...defaultInput(),effects:[effect('all',20,{stage:'offense'})]};
  const p=prepare(s);assert(p.q>Math.fround(.334));
  s.effects=[effect('all',100,{stage:'reduction'})];assert.equal(prepare(s).q,0);
});
test('invalid and unsupported overflow inputs fail explicitly',()=>{
  for(const edit of [{attack:NaN},{hits:1.5},{critRate:101},{defense:-1},{attack:1e8,coefficient:1e4}]) assert.throws(()=>calculate({...defaultInput(),...edit}));
  assert.throws(()=>calculate({...defaultInput(),effects:[effect('all',101,{stage:'reduction'})]}));
});
test('UI input contract covers all numeric/boolean model parameters and imported modules',()=>{
  const html=readFileSync(new URL('../dist/damage-calculator.html',import.meta.url),'utf8');
  const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
  for(const [key,value] of Object.entries(defaultInput())) if(['number','boolean'].includes(typeof value)) assert(ids.includes(key),`missing ${key}`);
  const js=readFileSync(new URL('../dist/damage-calculator.mjs',import.meta.url),'utf8');
  for(const m of js.matchAll(/\$\('([^']+)'\)/g)) assert(ids.includes(m[1]),`missing referenced element ${m[1]}`);
});
