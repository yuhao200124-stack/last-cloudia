// 圣物技能查找（942 个可从圣物学的被动，游戏数据原文）：给“PvE 角色介绍与配装”聊天用。
//   node scripts/pve-skills.mjs <关键词> [关键词2 …] [--sheet 分类] [--max-sc 数字] [--id 编号,编号]
// 关键词之间是“同时满足”，在 名称 + 原文 + 用户技能表里的分类 里找；--sheet 只看用户技能表的某一页（如 伤害上限、暴击、特技）；
// 不给关键词只给 --sheet 就列出那一页。--sheets 列出全部分类页。输出按 SC 从高到低。
// 数据：dist/game-skill-data.js（scripts/build-game-skill-table.mjs 从游戏主数据和用户的技能表排版生成）。
import fs from 'node:fs';

const window = {};
new Function('window', fs.readFileSync(new URL('../dist/game-skill-data.js', import.meta.url), 'utf8'))(window);
const data = window.GAME_SKILL_DATA;
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(`--${name}`); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
if (args.includes('--sheets')) { console.log(data.sheetOrder.join('、')); process.exit(0); }
const sheet = opt('sheet'), maxSc = Number(opt('max-sc') ?? 99), ids = opt('id')?.split(/[,，]/).map(Number);
const words = args.filter(a => !a.startsWith('--'));
if (!words.length && !sheet && !ids) { console.error('用法：node scripts/pve-skills.mjs <关键词> [关键词2 …] [--sheet 分类] [--max-sc 数字] [--id 编号,编号]　（--sheets 看有哪些分类）'); process.exit(1); }

// 每个技能在用户技能表里出现的位置：页 / 小类
const where = new Map();
for (const [name, s] of Object.entries(data.sheets)) {
  if (s.kind === 'all') continue;
  for (const lane of s.lanes || []) for (const row of lane.rows || []) {
    if (!row.ref) continue;
    const label = [name, lane.label, row.type].filter(Boolean).join('/');
    (where.get(row.ref) || where.set(row.ref, []).get(row.ref)).push({ sheet: name, label });
  }
}
const one = s => String(s ?? '').replace(/\s*\n\s*/g, '');
// 参数和计算位置在 dist/game-data/relics.json 的 passives 里（读取器从主数据解析）
const parsed = JSON.parse(fs.readFileSync(new URL('../dist/game-data/relics.json', import.meta.url), 'utf8')).passives || {};
const rows = Object.values(data.skills).map(k => ({ id: k.gameId, name: k.nameS, sc: Number(k.sc) || 0, text: one(k.effectS), values: k.values || parsed[k.gameId]?.values, steps: parsed[k.gameId]?.steps, io: k.io, sources: k.sourcesS || [], where: where.get(k.gameId) || [] }))
  .filter(k => (!ids || ids.includes(k.id)) && k.sc <= maxSc && (!sheet || k.where.some(w => w.sheet === sheet)))
  .filter(k => { const hay = `${k.name} ${k.text} ${k.where.map(w => w.label).join(' ')}`; return words.every(w => hay.includes(w)); })
  .sort((a, b) => b.sc - a.sc || a.id - b.id);

console.log(`找到 ${rows.length} 个（共 ${data.total} 个圣物技能）`);
for (const k of rows) {
  console.log(`\n### ${k.name}（编号 ${k.id}，SC ${k.sc}）`);
  console.log(`原文：${k.text}`);
  if (k.values) console.log(`参数：${k.values}`);
  if (k.steps) console.log(`计算位置：${k.steps}`);
  if (k.io) console.log(`生效范围：${k.io}`);
  console.log(`来源圣物：${k.sources.join('、') || '（没有记录）'}`);
  if (k.where.length) console.log(`用户技能表分类：${[...new Set(k.where.map(w => w.label))].join('；')}`);
}
