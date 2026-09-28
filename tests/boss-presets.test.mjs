import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The damage calculator's preset targets are real bosses: their race must be the game's (MonsterMst
// CHARACTER_TYPE), since killers like 洛琪希's "对BOSS特攻" are applied by the game script to the
// target's races and never fire on a target without one.
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const RACE_CODES={战士:1001,狙击手:1002,骑士:1003,魔法师:1004,治疗师:1005,兽:2001,植物:2002,昆虫:2003,鸟:2004,魔法生物:2005,不死生物:2006,石:2007,机械:2008,精灵:2009,龙:2010,神:2011,鱼:2012};

test('every boss preset carries the race and stats of its monster in the game data',()=>{
 const src=read('dist/damage-calculator.mjs');
 const bosses=Function(`return ${src.match(/const bosses=(\{[\s\S]*?\});\n/)[1]}`)();
 const table=JSON.parse(read('dist/game-data/engine/monsters.json')).MonsterMst,col=n=>table.cols.indexOf(n);
 const rows=new Map(table.rows.map(r=>[r[col('MONSTER_ID')],r]));
 assert(Object.keys(bosses).length>0);
 for(const [key,preset] of Object.entries(bosses)){
  const row=rows.get(preset.monsterId);
  assert(row,`${key}: monster ${preset.monsterId}`);
  assert.deepEqual(preset.races.map(r=>RACE_CODES[r]),[row[col('CHARACTER_TYPE')]],key);
  assert.equal(preset.def,row[col('DEF')],key);assert.equal(preset.mnd,row[col('MDEF')],key);
 }
 // the race checkboxes the calculator offers are the ones the engine maps to game races
 const races=Function(`return ${read('dist/damage-calculator.mjs').match(/const RACES=(\[[^\]]*\]);/)[1]}`)();
 for(const preset of Object.values(bosses))for(const r of preset.races)assert(races.includes(r),r);
});
test('the race checkboxes of the calculator are exactly the races the engine maps',()=>{
 const races=Function(`return ${read('dist/damage-calculator.mjs').match(/const RACES=(\[[^\]]*\]);/)[1]}`)();
 for(const r of races)assert(RACE_CODES[r],r);
});
