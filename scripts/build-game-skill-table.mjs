// Builds dist/game-skill-data.js: the skill table shown on game-skills.html and in the calculator's 配装.
// - Every skill is identified by its game number (PassiveSkillMst id). Name, SC, effect and relics come from the
//   game data (docs/game-relic-passives.json, exported from PassiveSkillMst / ArkMst: the passives learnable from
//   relics); the calculator always works from the number.
// - The layout — tabs, order, lanes, groups, ratings, and names / effect texts the user rewrote (display only) —
//   comes from docs/game-skill-layout.json, which is imported from the user's Excel
//   (python3 scripts/user-skill-excel.py import <file.xlsx>; the old game-skill-excel.py was deleted on 2026-09-30).
// - A game passive the layout does not have yet (after a game-data update) is added at the end of 全部技能 and in a
//   “新增待排” group of 杂项; a layout number the game data no longer has is left out and listed as removed.
// The page is the site's home page (dist/index.html); the original skill table was removed on 2026-09-29.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const game = JSON.parse(read('docs/game-relic-passives.json'));
const layout = JSON.parse(read('docs/game-skill-layout.json'));
const byId = new Map(game.map(g => [g.gameId, g]));
// every row carries its game number (the key) and its classification from the game data (scripts/build-skill-classes.mjs →
// docs/skill-classes-draft.json): 大类, 条件标签 and whether the calculator can compute it. Not shown on the page (user
// 2026-09-29: “补上编号和条件…藏在后台”), for the calculation and filters to use.
// every effect of a skill as [大类, 基础属性 stat (回复: MP or HP; 无视防御: DEF — it only matters to a move that hits with 攻击力) or null, elements or null, attack types or null, 1 when it is a
// drawback (e.g. 受到伤害 +10%)] — what the 配装's 全输出／半肉／全肉 filter needs to tell offense from defense and what
// applies to the current move
function entriesOf(s) {
  const out = [];
  for (const [cat, list] of Object.entries(s.sub || {})) for (const e of list) { const v = e.value ?? e.rate ?? e.add; out.push([cat, e.stat ?? (e.sub === 'MP回复' ? 'MP' : e.sub === 'HP回复' ? 'HP' : e.way === '无视防御' ? 'DEF' : null), e.els ?? null, e.types ?? null, typeof v === 'number' && v < 0 ? 1 : 0]); }
  for (const cat of s.cats) if (!out.some(e => e[0] === cat)) out.push([cat, null, null, null, 0]);
  return out.filter((e, i) => out.findIndex(x => JSON.stringify(x) === JSON.stringify(e)) === i);
}
// 实际数值 (user 2026-09-30: “神圣光环 装备武器的攻击力提升 像这种你去看看能不能解析出来数值”): a skill whose game text has no number
// gets its values read from the game data — the classification's entries (scripts/build-skill-classes.mjs, each read
// from the process parameters) written as one line, with its conditions in brackets. 特攻 is the game's ×1.5 (the
// damage formula: killer factor = 1.5 × (1 + 特攻伤害加成), dist/engine/battle.mjs). Nothing is written when the data has
// no number either (可以装备剑, 追加类型 …).
const STAT_WORD = { 攻击力: '攻击力', 法强: '魔力', 防御力: '防御力', 魔抗: '精神', HP: '体力', MP: '法力', 属性耐性: '属性耐性' };
const pct = v => `${Number((Math.abs(v) / 100).toFixed(2))}%`;
const sgn = v => (v < 0 ? '−' : '+');
const condText = tags => { const t = (tags || []).filter(x => !/^(装备状况条件|特定效果类别|有特定增益／减益时|特殊计数条件|即死条件|队伍／人数条件|距离条件)$/.test(x)).map(x => x.replace(/^概率发动（(.+)）$/, '$1几率').replace(/^(\d+秒内)（触发后）$/, '触发后$1')); return t.length ? `（${t.join('，')}）` : ''; };
// the game's own words: 体力 / 法力 / 魔力 / 矿石 (the site's classification says HP / MP / 法强 / 石)
const gameWords = t => t.replace(/回复HP/g, '回复体力').replace(/回复MP/g, '回复法力').replace(/按精神算，最低/g, '按精神计算，最少').replace(/法强/g, '魔力').replace(/(^|、)对石(?=、|$)/g, '$1对矿石');
function valuesOf(d) {
  if (!d?.sub) return '';
  const parts = [];
  const put = t => { if (t && !parts.includes(t)) parts.push(t); };
  for (const [cat, list] of Object.entries(d.sub)) for (const e of list) {
    const apply = (e.apply || []).join('、'), c = condText(e.tags);
    if (cat === '基础属性') {
      if (e.basis === '转换') continue;
      if (!e.rate && !e.add) { if (d.kinds.some(k => /デバフ耐性/.test(k))) put(`免疫${STAT_WORD[e.stat] || e.stat}降低${c}`); continue; }
      // P_武器パラメータ増減 (process1031902) raises the weapons' own stat (both, when two kinds are worn)
      put(`${e.basis === '装备' ? (d.kinds.some(k => /武器パラメータ/.test(k)) ? '武器的' : '装备的') : ''}${STAT_WORD[e.stat] || e.stat} ${e.rate ? `${sgn(e.rate)}${pct(e.rate)}` : `${sgn(e.add)}${Math.abs(e.add)}`}${c}`);
    } else if (cat === '造成伤害') put(e.way === '伤害加成' ? `${apply ? `${apply}的` : ''}伤害 ${e.text}${c}` : `${e.text}${c}`);
    else if (cat === '伤害上限') put(`${apply ? `${apply}的` : ''}伤害上限 ${e.text}${c}`);
    else if (e.way === '特攻') { const races = (e.apply || []).filter(a => a.startsWith('对')).map(a => (a === '对石' ? '矿石' : a.slice(1))), types = (e.apply || []).filter(a => !a.startsWith('对')); put(`${types.join('、')}对${races.join('、')}特攻（伤害 ×1.5）${c}`); }
    else if (e.way === '回避' && /被命中率 −100%/.test(e.text)) put(`回避${apply ? `${apply}` : ''}攻击${c}`);
    else if (cat === '受到伤害' && e.way === '受到伤害' && apply) put(`受到的${apply}伤害 ${e.text.replace(/^受到伤害 /, '')}${c}`);
    else if ((cat === '暴击' || cat === 'Break值') && apply && !/属性魔法/.test(e.text)) put(`${apply}：${e.text}${c}`);
    else put(`${apply && !e.text.includes(apply) ? `${apply}：` : ''}${e.text}${c}`);
  }
  const line = parts.filter(t => !/（见效果说明）|（数值读不出）/.test(t)).map(gameWords).join('；');
  return /\d/.test(line) ? line : '';
}
const drafts = new Map(fs.existsSync(new URL('docs/skill-classes-draft.json', root)) ? JSON.parse(read('docs/skill-classes-draft.json')).skills.map(s => [s.id, s]) : []);
const classes = fs.existsSync(new URL('docs/skill-classes-draft.json', root))
  ? new Map(JSON.parse(read('docs/skill-classes-draft.json')).skills.map(s => [s.id, { cats: s.cats, tags: s.tags, calc: s.calc, e: entriesOf(s) }])) : new Map();

const skills = {};
for (const g of game) {
  const own = layout.skills?.[g.gameId] || {};
  skills[g.gameId] = {
    id: `g${g.gameId}`, gameId: g.gameId, name: g.name, nameS: own.name || g.nameS, sc: String(g.sc), ap: g.ap, effect: g.effect, effectS: own.effect || g.effectS,
    values: /[0-9０-９]/.test(own.effect || g.effectS) ? '' : valuesOf(drafts.get(g.gameId)), io: g.io || '',
    sources: g.relics.map(r => `${r.name}（${r.rarity}）`), sourcesS: g.relics.map(r => `${r.nameS}（${r.rarity}）`),
    mark: own.mark || '', cls: classes.get(g.gameId) || null,
    ...(own.name ? { renamed: true } : {}), ...(own.effect ? { rewritten: true } : {}),
  };
}
const removed = new Set();
// rows of the split tabs always carry their group (empty = no group); 全部技能 / 基础属性 rows have none
const convert = kind => row => {
  if (row.separator) return { separator: true };
  if (!byId.has(row.id)) { removed.add(row.id); return null; }
  return kind === 'split' ? { ref: row.id, type: row.group || '' } : { ref: row.id };
};
const sheets = {}, order = [...layout.sheetOrder];
for (const name of order) {
  const sh = layout.sheets[name];
  sheets[name] = sh.kind === 'all' ? { kind: 'all', rows: sh.rows.map(convert('all')).filter(Boolean) } : { kind: sh.kind, lanes: sh.lanes.map(l => ({ label: l.label ?? null, rows: l.rows.map(convert(sh.kind)).filter(Boolean) })) };
}
// game passives the layout does not place anywhere yet
const placed = new Set(order.flatMap(n => sheets[n].kind === 'all' ? sheets[n].rows : sheets[n].lanes.flatMap(l => l.rows)).filter(r => !r.separator).map(r => r.ref));
const added = game.filter(g => !placed.has(g.gameId)).map(g => g.gameId);
if (added.length) {
  const all = order.find(n => sheets[n].kind === 'all'); if (all) sheets[all].rows.push(...added.map(ref => ({ ref })));
  const misc = sheets['杂项'] || (order.push('杂项'), sheets['杂项'] = { kind: 'split', lanes: [{ label: null, rows: [] }, { label: null, rows: [] }] });
  misc.lanes[0].rows.push({ separator: true }, ...added.map(ref => ({ ref, type: '新增待排' })));
}
const out = { generatedFrom: '游戏主数据 PassiveSkillMst / ArkMst（可从圣物学习的被动）；排版 docs/game-skill-layout.json', total: game.length, sheetOrder: order, sheets, skills, added, removed: [...removed] };
fs.writeFileSync(new URL('dist/game-skill-data.js', root), `// Generated by scripts/build-game-skill-table.mjs\nwindow.GAME_SKILL_DATA=${JSON.stringify(out)};\n`);
// the table's game numbers for the calculator's 配装 (a character's own SC skill that is not on the table is its own,
// added automatically at 0 SC) and the character pages' 已保存配装
fs.writeFileSync(new URL('dist/game-data/engine/table-passives.json', root), JSON.stringify({ note: '游戏数据技能表里的全部技能（游戏编号），由 scripts/build-game-skill-table.mjs 生成', ids: game.map(g => g.gameId).sort((a, b) => a - b) }) + '\n');
console.log(JSON.stringify({ total: game.length, sheets: order.length, added: added.length, removed: removed.size }));
