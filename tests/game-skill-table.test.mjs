// The game-data skill table is the home page (2026-09-29, the original skill table was removed). Its layout lives in
// docs/game-skill-layout.json (imported from the user's Excel); every row is a game passive number, and the name, SC,
// effect and relics come from the game data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const box = { window: {} }; vm.runInNewContext(read('dist/game-skill-data.js'), box);
const data = JSON.parse(JSON.stringify(box.window.GAME_SKILL_DATA));
const game = new Map(JSON.parse(read('docs/game-relic-passives.json')).map(g => [g.gameId, g]));
const layout = JSON.parse(read('docs/game-skill-layout.json'));
const rowsOf = sheet => sheet.kind === 'all' ? sheet.rows : sheet.lanes.flatMap(l => l.rows);

test('the home page is the game-data skill table; the original table and its 配装与伤害 are gone', () => {
  const html = read('dist/index.html');
  assert.match(html, /game-skill-data\.js/); assert.match(html, /game-skills\.js/);
  assert.doesNotMatch(html, /"\.\/data\.js|\/app\.js|loadout-frame|原技能表|showSiteName/);
  for (const f of ['data.js', 'app.js', 'loadout-frame.mjs', 'game-skill-names.js', 'game-skill-names.mjs', 'basic-stat-catalog.mjs'])
    assert(!fs.existsSync(new URL(`../dist/${f}`, import.meta.url)), f);
  assert.match(read('dist/game-skills.html'), /url=\.\/index\.html/, 'the old address forwards to the home page');
});

test('the built table follows the layout, and every row is a game passive number', () => {
  assert.deepEqual(data.sheetOrder, layout.sheetOrder);
  assert.deepEqual(data.added, []); assert.deepEqual(data.removed, []);
  for (const name of data.sheetOrder) {
    const built = rowsOf(data.sheets[name]), own = rowsOf(layout.sheets[name]);
    assert.deepEqual(built.map(r => r.separator ? 'sep' : r.ref), own.map(r => r.separator ? 'sep' : r.id), name);
    for (const r of built) if (!r.separator) assert(game.has(r.ref), `${name}: ${r.ref}`);
  }
  const placed = new Set(data.sheetOrder.flatMap(n => rowsOf(data.sheets[n])).filter(r => !r.separator).map(r => r.ref));
  for (const id of game.keys()) assert(placed.has(id), `game passive ${id} is on the table`);
});

test('name, SC, effect and relics come from the game data; only the layout\'s own texts and ratings override the display', () => {
  for (const [id, g] of game) {
    const s = data.skills[id], own = layout.skills[id] || {};
    assert.equal(s.gameId, id); assert.equal(s.name, g.name); assert.equal(s.effect, g.effect); assert.equal(s.sc, String(g.sc));
    assert.equal(s.nameS, own.name || g.nameS); assert.equal(s.effectS, own.effect || g.effectS); assert.equal(s.mark, own.mark || '');
    assert.equal(s.sources.length, g.relics.length);
    for (const k of ['siteName', 'siteSc', 'siteEffect', 'url']) assert(!(k in s), `${id} has no ${k} (the original table is gone)`);
  }
});

test('every row carries its game number and its classification (大类, 条件, 能否算), which the page does not show', () => {
  const draft = new Map(JSON.parse(read('docs/skill-classes-draft.json')).skills.map(s => [s.id, s]));
  for (const id of game.keys()) {
    const s = data.skills[id], d = draft.get(id);
    const { e, ...rest } = s.cls;
    assert.deepEqual(rest, { cats: d.cats, tags: d.tags, calc: d.calc }, String(id));
    // every effect as [大类, stat, elements, attack types, drawback] for the 配装 filter; every 大类 is there
    for (const cat of d.cats) assert(e.some(x => x[0] === cat), `${id} ${cat}`);
    for (const x of e) assert(x.length === 5 && d.cats.includes(x[0]), `${id} ${JSON.stringify(x)}`);
  }
  // the page only uses the effects (and, for 全输出's gear check, the 装备… tags) to hide rows in 配装; 大类, 条件 and
  // 能否算 are not shown
  const js = read('dist/game-skills.js');
  assert(js.includes('.cls?.e') && !/\.cls\??\.(cats|calc)/.test(js), 'not shown on the page');
  assert(!/\$\{[^}]*cls\??\.tags/.test(js), 'tags are not written into the page');
});

// 配装 hide filter (dist/game-skills-filter.js, run here for real — item 34): 全输出 hides defense and the offense the move
// cannot use, 半肉 only that offense, 全肉 all offense; MP／咏唱 only for magic, 反击 only in 半肉, 金钱·经验 never, and
// 全输出 checks the gear (weapon / armour types, one or two weapons, what picked skills add)
const filterBox = { window: {} }; vm.runInNewContext(read('dist/game-skills-filter.js'), filterBox);
const F = filterBox.window.GameSkillFilter;
const keep = (mode, move, id) => F.keep(mode, move, data.skills[id].cls.e, data.skills[id].cls.tags);
const iceMagic = { element: 2, magical: true, roles: [2], gear: { weapons: [12, 14, 17], armors: [21, 22], dual: false } };     // 洛琪希
const physical = { element: 0, magical: false, roles: [1], gear: { weapons: [10, 11, 12, 13], armors: [21], dual: false } };   // 艾莉丝

test('配装 filter: 全输出 hides defense and offense the move cannot use, 半肉 only that offense, 全肉 all offense', () => {
  assert.match(read('dist/index.html'), /id="buildFilter"[^>]*hidden/);
  assert.match(read('dist/index.html'), /game-skills-filter\.js\?v=[^"]+"><\/script>\s*<script src="\.\/game-skills\.js/);
  const r = s => data.skills[s].cls.e;
  // 冰攻击提升III is for 冰, 勇者 for 物理 (普攻＋特技) and brings 受到伤害 +10% as a drawback
  assert.deepEqual(r(26466).map(x => x[2]), [[2], [2]]);
  assert.deepEqual(r(27654).find(x => x[0] === '造成伤害')[3], [1, 9]);
  assert.equal(r(27654).find(x => x[0] === '受到伤害')[4], 1);
  assert.deepEqual(['out', 'half', 'tank'].map(m => keep(m, iceMagic, 26466)), [true, true, false]);   // 冰攻击提升III, ice magic
  assert.deepEqual(['out', 'half', 'tank'].map(m => keep(m, physical, 26466)), [false, false, false]); // not for a 无属性 punch
  assert.deepEqual(['out', 'half', 'tank'].map(m => keep(m, iceMagic, 27570)), [false, true, true]);   // 畏惧的眼光: defense
  assert.equal(keep('out', physical, 28230), false);                                                 // 海滨洞察: 冰 attacks, 法强
  assert.equal(keep('none', physical, 12700), true);
});

test('配装 filter: MP／咏唱 only for magic, 反击 only in 半肉, 金钱·经验 never, gear in 全输出', () => {
  for (const id of [11000, 9900]) { assert.equal(keep('out', iceMagic, id), true, `${id} magic`); assert.equal(keep('out', physical, id), false, `${id} physical`); }
  assert.deepEqual(data.skills[9900].cls.e[0].slice(0, 2), ['回复', 'MP'], '荣誉的姿势 MP 回复');
  assert.deepEqual(['out', 'half', 'tank'].map(m => keep(m, physical, 1100)), [false, true, false]);   // 反击
  assert.deepEqual(['out', 'half', 'tank'].map(m => keep(m, iceMagic, 12700)), [false, false, false]); // 经验提升
  assert.equal(keep('out', iceMagic, 16210), true);                                                  // 杖高阶增幅: she holds a 杖
  assert.equal(keep('out', iceMagic, 16000), false);                                                 // 机械增幅: she cannot hold a 机械 …
  assert.equal(keep('out', { ...iceMagic, gear: { ...iceMagic.gear, weapons: [12, 14, 15, 17] } }, 16000), false); // …and its 物理伤害 / 防御 −5% do not help a magic
  assert.equal(keep('out', { ...physical, gear: { ...physical.gear, weapons: [10, 11, 12, 13, 15] } }, 16000), true); // 机械装备 picked
  assert.equal(keep('out', physical, 27410), false);                                                 // 同种双刀: one weapon
  assert.equal(keep('out', { ...physical, gear: { ...physical.gear, dual: true } }, 27410), true);  // 二刀流
  assert.equal(keep('out', physical, 27627), false);                                                 // 徒手空拳: never unarmed
});

// 2026-09-30 (user: “好多技能的数值还是？但是不可能是？”): the game fills each “?” from PassiveSkillMst.PROCESS_EXPLAIN_QUOTE
// (parameter and arithmetic, e.g. frames ÷ 60, a value × 2); the export now carries the filled texts (checked against the
// Lua scripts and the sandbox, docs/game-skill-table-2026-09-29.md).
test('no effect text keeps a “?” placeholder; the filled values', () => {
  for (const [id, s] of Object.entries(data.skills)) { assert.doesNotMatch(s.effect + s.effectS, /\?/, id); if (/[0-9０-９]/.test(s.effectS)) assert.equal(s.values, '', id); }
  const text = id => data.skills[id].effectS;
  assert.match(text(11000), /咏唱速度\+20％/);
  assert.match(text(27151), /仅装备一种武器时提升效果\+4000/);
  assert.match(text(55714), /20秒/);
  assert.match(text(28501), /额外\+5000/);
});

// 2026-09-30 (user: “神圣光环 装备武器的攻击力提升 像这种你去看看能不能解析出来数值”): a description without a number gets
// the values of its effects from the game data, in the game's words (体力 / 法力 / 魔力 / 矿石)
test('实际数值: the numbers of a description that has none', () => {
  const v = id => data.skills[id].values;
  assert.equal(v(11800), '武器的攻击力 +25%；武器的魔力 +25%');                               // 神圣光环, process1031902
  assert.equal(v(1200), '普攻对兽特攻（伤害 ×1.5）');                                        // 兽族克星
  assert.equal(v(1810), '物理对矿石特攻（伤害 ×1.5）');
  assert.equal(v(13200), '普攻：使敌人即死（2%几率）；特技：使敌人即死（0.1%几率）');           // 死神
  assert.equal(v(13500), '攻击力 +20%（受到攻击时，5%几率，触发后40秒内）');
  assert.equal(v(28331), '回复时把攻击力的 10% 加到精神上计算（回复技能）');                   // 强力治愈, process1030074
  assert.equal(v(800), '回复体力（按精神计算，最少 50）（暴击时）');
  assert.equal(v(11000), '');                                                               // its text has the number
  const shown = Object.values(data.skills).filter(s => s.values);
  assert.ok(shown.length > 180, `${shown.length}`);
  for (const s of shown) { assert.match(s.values, /\d/, s.nameS); assert.doesNotMatch(s.values, /法强|回复HP|回复MP|（见效果说明）|即死条件/, s.nameS); }
});

// 2026-09-30 (user: “不动之阵和加速施法的是一起的…直接放在法术伤害里头得了”): the 咏唱 skills of the 法强 tab are in its 法伤 group
test('法强: 高位魔法咏唱阵、不动之阵、守护咏唱阵、快速咏唱、夏日狂欢 are in the 法伤 group, right after its damage skills', () => {
  const rows = data.sheets['法强'].lanes[1].rows.filter(r => !r.separator);
  const group = id => rows.find(r => r.ref === id)?.type;
  for (const id of [11000, 10900, 27999, 26640, 26495]) assert.equal(group(id), '法伤', id);
  assert.ok(!rows.some(r => r.type === '施法'));
  const ids = rows.map(r => r.ref); assert.deepEqual(ids.slice(ids.indexOf(12500), ids.indexOf(12500) + 3), [12500, 11000, 10900]);
});

// item 22 of the 2026-09-30 review: what a process changes, read from its script, not from the words in its name
test('classification: effects on the enemy, a heal scaled by 精神, when-used triggers, a stat raised only on the hit', () => {
  const e = id => data.skills[id].cls.e;
  assert.deepEqual(e(27570), [['受到伤害', null, null, [1, 9], 0]]);             // 畏惧的眼光: the enemy's attack −5%
  for (const id of [28094, 54090]) assert.equal(e(id)[0][0], '造成伤害');           // every enemy's element resistance −10
  assert.deepEqual(e(27071)[0], ['回复', 'HP', null, null, 0]);                     // 治愈反击: not a 魔抗 drawback
  assert.deepEqual(e(27820), [['特技充能·必杀', null, null, null, 0]]);               // 循环: fires on 超必杀, helps any move
  assert.deepEqual(e(55010), [['造成伤害', null, null, [1, 9], 0]]);                 // its buff is 物理伤害, fired by 超必杀
  assert.deepEqual(e(28230), [['基础属性', '法强', [2], null, 0]]);                   // 海滨洞察: only on 冰属性 attacks
});

// 暴击 (user 2026-09-30: “新建一个类型叫暴击…把暴击和暴击伤害有关的都放进去”, “配装…打开这个页面就能找到全部我可以带的暴击率和暴击伤害”):
// every skill that raises the crit rate or the crit damage (a 暴击 entry that is not defense) is on the sheet, and only those
test('暴击 page: every crit-rate / crit-damage skill, in two lanes with groups', () => {
  const sheet = data.sheets['暴击'];
  assert.equal(data.sheetOrder[data.sheetOrder.indexOf('伤害上限') + 1], '暴击');
  assert.equal(sheet.lanes.length, 2);
  const onPage = new Set(sheet.lanes.flatMap(l => l.rows).filter(r => !r.separator).map(r => r.ref));
  const crit = Object.values(data.skills).filter(s => s.cls?.e.some(e => e[0] === '暴击')).map(s => s.gameId);
  assert.deepEqual([...onPage].sort((a, b) => a - b), crit.sort((a, b) => a - b));
  for (const r of sheet.lanes.flatMap(l => l.rows)) if (!r.separator) assert.ok(r.type, `${r.ref} has a group`);
  assert.ok(!onPage.has(960), '皇家铠甲 (免疫暴击) is defense');
  assert.deepEqual(data.skills[960].cls.e, [['受到伤害', null, null, null, 0]]);
});

// 全部伤害 (user 2026-09-30: “把所有伤害都归类到一个…”, 新建一页、325 个全放、“按照sc换伤害的比例来”): every skill that
// raises the damage dealt, ranked by damage % per SC (the group is that ratio); the ones without a % (追加伤害, 无视防御,
// 魔转相, 减敌人耐性 …) at the end as 其他方式
test('全部伤害 page: every damage skill, by damage % per SC', () => {
  const draft = JSON.parse(read('docs/skill-classes-draft.json')).skills;
  const rows = data.sheets['全部伤害'].lanes.flatMap(l => l.rows).filter(r => !r.separator);
  assert.deepEqual(rows.map(r => r.ref).sort((a, b) => a - b), draft.filter(s => s.cats.includes('造成伤害')).map(s => s.id).sort((a, b) => a - b));
  const ratios = rows.filter(r => r.type !== '其他方式').map(r => Number(r.type.match(/每SC ([\d.]+)%/)[1]));
  for (let i = 1; i < ratios.length; i++) assert.ok(ratios[i] <= ratios[i - 1], `${ratios[i - 1]} → ${ratios[i]}`);
  assert.ok(rows.slice(-3).every(r => r.type === '其他方式'));
  assert.ok(data.sheets['伤害'], 'the user’s own 伤害 page stays');
});

// 全部攻击力／全部魔力 (user 2026-09-30: “下一个做攻击力还有魔力”, the same way as 全部伤害): every skill that raises 攻击力 /
// 魔力 (法强), by % per SC; 装备加成, 属性转换, 固定值 and 魔转相 after it; one that only lowers it is not there
test('全部攻击力 / 全部魔力 pages: every skill that raises the stat, by % per SC', () => {
  const draft = JSON.parse(read('docs/skill-classes-draft.json')).skills;
  for (const [page, stat] of [['全部攻击力', '攻击力'], ['全部魔力', '法强']]) {
    const rows = data.sheets[page].lanes.flatMap(l => l.rows).filter(r => !r.separator), ids = new Set(rows.map(r => r.ref));
    for (const s of draft) {
      const up = (s.sub?.基础属性 || []).some(e => e.stat === stat && (e.rate > 0 || e.add > 0 || e.basis === '转换'));
      assert.equal(ids.has(s.id), up || (s.sub?.造成伤害 || []).some(e => e.way === '魔转相'), `${page} ${s.id} ${s.name}`);
    }
    const ratios = rows.filter(r => /^每SC/.test(r.type)).map(r => Number(r.type.match(/([\d.]+)%/)[1]));
    for (let i = 1; i < ratios.length; i++) assert.ok(ratios[i] <= ratios[i - 1]);
  }
  assert.ok(!data.sheets['全部魔力'].lanes[0].rows.some(r => r.ref === 26310), '知识的防壁 turns 魔力 into 防御／精神: not a 魔力 skill');
});
