// The skill classification draft (scripts/build-skill-classes.mjs): every skill on the table has a class, and the
// user's decisions (docs/skill-classes-user.json) win over the automatic ones.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

test('every table skill is classified, and the user\'s decisions are applied', () => {
  const draft = read('docs/skill-classes-draft.json'), user = read('docs/skill-classes-user.json');
  const ids = read('dist/game-data/engine/table-passives.json').ids;
  const byId = new Map(draft.skills.map(s => [s.id, s]));
  for (const id of ids) { const s = byId.get(id); assert(s && s.cats.length, `${id} has a class`); assert(['能算', '看条件', '不影响每段伤害', '待确认'].includes(s.calc), `${id} calc`); }
  for (const [id, u] of Object.entries(user.skills)) {
    const s = byId.get(Number(id));
    if (u.cats) assert.deepEqual(s.cats, u.cats, id);
    for (const c of u.addCats || []) assert(s.cats.includes(c), `${id} ${c}`);
    if (u.calc) assert.equal(s.calc, u.calc, id);
  }
  assert.deepEqual(byId.get(1100).cats, ['反击']); assert.deepEqual(byId.get(28302).cats, ['信仰']);
  // 条件标签 come from the game's condition data (scripts/skill-conditions.mjs), every parameter read
  const tags = id => byId.get(id).tags;
  for (const s of draft.skills) assert(!s.undecoded, `${s.id} has undecoded conditions`);
  assert.deepEqual(tags(26466), ['冰属性']);                               // 冰攻击提升III: 属性条件 2
  assert.deepEqual(tags(25710), ['冰属性', '物理', '超必杀']);              // skill type 8448 = 物理 + 超必杀
  assert.deepEqual(tags(1410), ['物理', '对昆虫']);                        // built-in 特攻 (308) with race 2003
  assert.deepEqual(tags(55567).filter(t => t.startsWith('对')).sort(), ['对兽', '对植物', '对昆虫', '对鸟', '对魔法生物', '对鱼'].sort()); // packed race bits
  assert.deepEqual(tags(15300), ['受·火属性']);                            // 冰壁 reduces fire damage (属性ID 1)
  assert.deepEqual(tags(16010), ['物理', '装备机械']);
  // 大类 only from the game data: never from the description
  for (const s of draft.skills) for (const r of Object.values(s.reasons)) assert(!r.includes('说明文字'), `${s.id} uses the description`);
  const cats = id => byId.get(id).cats;
  assert(cats(11500).includes('特技充能·必杀') && !cats(11500).includes('异常'));   // 特定状態異常中SCT回復量増減: charge while under an ailment
  assert(cats(7300).includes('造成伤害') && !cats(7300).includes('异常'));           // 对异常状态的敌人 is a condition
  assert(cats(10900).includes('魔法·咏唱'));                                         // 不动之阵: casting is not interrupted
  assert(cats(18100).includes('受到伤害'));                                          // 光照明: its buff (504) works on damage taken
  assert(cats(55591).includes('暴击') && cats(55591).includes('基础属性'));           // 极速战士: three processes
  assert.deepEqual(byId.get(23300).defense, { calc: '能算', tags: ['受·树属性'] });  // prepared for 减伤 later
  // damage the character takes, by the process name: 被追加ダメージ (追击护盾), 貫通耐性 (石之世界), 相手…与ダメージ減少 (爱的监狱)
  for (const id of [26862, 52500, 27695]) assert(cats(id).includes('受到伤害') && !cats(id).includes('造成伤害'), `${id} is damage taken`);
  // 造成伤害 entries: element × attack type from the game data (弱点 with element 0 = any element; PB_… buffs name the
  // attack type before 与ダメージ); a time-scaling process is conditional and its value is the most (最多)
  const dmg = id => byId.get(id).sub.造成伤害;
  assert.deepEqual(dmg(26140).map(e => [e.els, e.types, e.text, e.tags]), [[null, [1, 9], '+30%', ['打弱点属性时']]]);   // 物理弱点增幅
  assert.deepEqual(dmg([...byId.values()].find(s => s.name === '火焰增幅').id).map(e => e.text).sort(), ['+15%', '+50%']);
  assert(dmg([...byId.values()].find(s => s.name === '冰冻增收').id)[0].tags.includes('随时间变强'));
  assert.equal(dmg([...byId.values()].find(s => s.name === '冰冻增收').id)[0].text, '最多+20%');
  assert.deepEqual(dmg([...byId.values()].find(s => s.name === '英灵附体').id).map(e => e.types), [[1, 2, 9]]);
  assert(!byId.get([...byId.values()].find(s => s.name === '狂战士').id).sub.造成伤害.some(e => e.way !== '伤害加成')); // DOT is its own HP loss
  // 爆裂者 / 驱动: “物理攻击・超必杀技” is not a stat list
  assert(!byId.get(26872).cats.includes('基础属性') && !byId.get(25710).cats.includes('基础属性'));
  // other 大类: ranged parameter docs (params[1]～params[10]) give the races of 複数タイプ killers; types a skill adds
  // are not targets; a debuff put on the target is damage dealt; our own side's types are not the target's
  const named = n => [...byId.values()].find(s => s.name === n);
  assert.deepEqual(named('海洋斩灭者').sub.特攻.map(e => e.races), [[1001, 2007, 2010, 2012]]);
  assert(named('人类模仿').tags.includes('追加战士类型') && !named('人类模仿').tags.includes('对战士'));
  assert(named('腐坏之牙').cats.includes('造成伤害') && !named('腐坏之牙').cats.includes('受到伤害'));
  assert(named('剑阵').tags.includes('我方战士类型') && !named('剑阵').tags.includes('对战士'));
  assert.equal(named('英灵战士').sub.受到伤害[0].text, '受到伤害 −10%');     // its comments name 2 of 6 parameters
  assert.equal(named('沦落').sub.伤害上限.length, 2);                          // two +5000: both apply
});

test('the classification preview lists every skill of each previewed 大类, with all its other classes', async () => {
  const draft = read('docs/skill-classes-draft.json'), byId = new Map(draft.skills.map(s => [s.id, s]));
  const src = fs.readFileSync(new URL('../dist/skill-classes-preview-data.js', import.meta.url), 'utf8');
  const { pages } = JSON.parse(src.slice(src.indexOf('=') + 1).trim().replace(/;$/, ''));
  // 特攻・暴击・Break值・反击 are one page, 特殊伤害造成 (user 2026-09-29)
  const SPECIAL = ['特攻', '暴击', 'Break值', '反击'], pageOf = c => (SPECIAL.includes(c) ? '特殊伤害造成' : c);
  assert.deepEqual([...new Set(draft.skills.flatMap(s => s.cats).map(pageOf))].sort(), pages.map(p => p.cat).sort());
  for (const pg of pages) {
    const rows = pg.subs.flatMap(x => x.skills || x.blocks.flat());
    const ids = new Set(rows.map(r => r.id));
    assert.equal(ids.size, draft.skills.filter(s => s.cats.some(c => pageOf(c) === pg.cat)).length, pg.cat);
    assert.equal(pg.total, ids.size);
    for (const r of rows) for (const c of byId.get(r.id).cats) if (pageOf(c) !== pg.cat) assert(r.also.some(a => a === pageOf(c) || a.startsWith(`${pageOf(c)}（`)), `${r.id} also in ${c}`);
    for (const x of pg.subs) {
      if (x.skills) { for (const r of x.skills) for (const e of r.entries) assert.equal(e.cond, e.tags.length > 0, `${r.id} ${x.name}`); continue; }
      for (const [i, block] of x.blocks.entries()) for (const r of block) for (const e of r.entries) assert.equal(e.tags.length > 0, i === 1, `${r.id} ${x.name}`);
    }
  }
});
