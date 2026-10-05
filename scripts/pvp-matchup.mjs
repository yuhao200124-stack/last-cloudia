// 竞技场对阵表（升级方案第 2 步，赛前用）：我方四人 × 对手四人，双方每个特技／超必杀打对面每个人一下是多少。
//   node scripts/pvp-matchup.mjs --opponents <PvPOpponents.json> [--index N] --mine-from <对局文件夹> [--calibrate] [--json]
// --opponents：PvP 读取器在选对手界面写的 PvPOpponents.json。--index：第几个对手（从 0 起；不给就列出有哪些对手）。
// --mine-from：取我方四人的一场对局记录（PvPLogs/<对局>/）。我方的配装、加护、开场前面板都用这一场里的；
//   所以要选“配装和现在一样”的最近一场。对手没有面板，由引擎凭配装算（和实际差 ±10% 上下）。
// --calibrate：先对 --mine-from 那一场跑一遍对账（按开场状态，要 1 分钟左右），把“这一招引擎是记录的几倍”标在每一行；
//   结果存在系统临时目录，下次同一场不用再跑。不加这个参数、又没有存过的，标“没对过”。
// 算的是“开场状态下打一下”：所有人满体力、法力 5 点、开场增减益都在；随机取中间值 0.95。
// 每一行给：正面命中 不暴击／暴击、从背后命中 不暴击（背后差别大的招式才有意义）、暴击率、伤害上限、
// 记录里这招一次出招打几下（只有 --mine-from 那一场出现过的招式有）、目标开场体力、按不暴击算几下打掉。
// 这些数的可信程度见 docs/pvp-arena-calculator-2026-10-05.md 末尾：进场面板和核心值是准的，最终伤害目前只能当量级。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readMatch, normalizeOpponentUnit } from './lib/pvp-record.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const { createArena, loadArenaTables } = await import(ROOT + 'dist/engine/arena.mjs');
const { DEFAULT_BLESSINGS } = await import(ROOT + 'dist/account-blessing-default.mjs');
const read = async (p, asText) => { const t = fs.readFileSync(ROOT + 'dist/game-data/' + p, 'utf8'); return asText ? t : JSON.parse(t); };

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf('--' + n); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = n => { const i = args.indexOf('--' + n); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const asJson = flag('json'), calibrate = flag('calibrate');
const oppFile = opt('opponents'), mineDir = opt('mine-from'), indexArg = opt('index');
if (!oppFile || !mineDir) { console.error('用法：node scripts/pvp-matchup.mjs --opponents <PvPOpponents.json> [--index N] --mine-from <对局文件夹> [--calibrate] [--json]'); process.exit(1); }
const opp = JSON.parse(fs.readFileSync(oppFile, 'utf8'));
if (indexArg == null) {
  console.log(`对手列表（${opp.reader}，${opp.readAt || ''}）：`);
  opp.opponents.forEach((o, i) => console.log(`  ${i}：阵型 ${o.formationName || o.formationId}｜` + o.units.map(u => u.dressName).join('、')));
  console.log('加 --index 数字 选一个。'); process.exit(0);
}
const opponent = opp.opponents[Number(indexArg)];
if (!opponent) { console.error(`没有第 ${indexArg} 个对手（共 ${opp.opponents.length} 个）。`); process.exit(1); }

// ---- 我方：取那一场记录里的四个人；属性耐性的基础值从那一场的开场校出来
const src = readMatch(mineDir);
const tables = await loadArenaTables(read);
const blessingParams = DEFAULT_BLESSINGS.blessings;
const srcArena = await createArena({ units: src.units, tables, read, blessingParams });
srcArena.open();
const mine = src.units.filter(u => u.isMine).map((u, k) => ({ ...u, index: k, uid: 1 + k, elemBase: srcArena.elemBaseOf(src.units.indexOf(u)), entry: null }));
if (mine.length !== 4) { console.error(`--mine-from 那一场里我方不是 4 个人（${mine.length}）。`); process.exit(2); }
const theirs = opponent.units.map((u, k) => normalizeOpponentUnit(u, opponent, k));
const units = [...mine, ...theirs];
units.forEach((u, i) => { u.index = i; });

// ---- 记录里每招一次出招打几下（同一个目标）
const hitsPerCast = new Map();
{ const per = new Map();
  for (const h of src.hits) { if (!h.skillId || h.run == null) continue; const k = `${h.skillId}|${h.run}|${h.target}`; per.set(k, (per.get(k) || 0) + 1); }
  const by = new Map(); for (const [k, n] of per) { const id = Number(k.split('|')[0]); (by.get(id) || by.set(id, []).get(id)).push(n); }
  for (const [id, list] of by) { list.sort((a, b) => a - b); hitsPerCast.set(id, { median: list[Math.floor(list.length / 2)], max: list[list.length - 1], casts: list.length }); } }

// ---- 对账结论（按“装束＋技能”）
const cacheFile = path.join(os.tmpdir(), `pvp-reconcile-opening-${src.meta.match}.json`);
let calib = null;
if (calibrate && !fs.existsSync(cacheFile)) fs.writeFileSync(cacheFile, execFileSync('node', [ROOT + 'scripts/pvp-reconcile.mjs', mineDir, '--json', '--opening'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
if (fs.existsSync(cacheFile)) { calib = new Map(); const r = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); const acc = new Map();
  for (const g of r.groups) { if (!g.compared || g.finalRatio == null) continue; const k = `${g.attacker.replace(/^(我方|对方)/, '')}|${g.skillId}`; const a = acc.get(k) || acc.set(k, { n: 0, sum: 0 }).get(k); a.n += g.compared; a.sum += g.finalRatio * g.compared; }
  for (const [k, a] of acc) calib.set(k, { ratio: a.sum / a.n, n: a.n }); }
const trustOf = (u, skillId) => { if (!calib) return { text: '没对过' }; const c = calib.get(`${u.dressName}|${skillId}`); return c ? { ratio: c.ratio, n: c.n, text: `引擎是记录的 ${c.ratio.toFixed(2)} 倍（${c.n} 下）` } : { text: '这场记录里没有可比的' }; };

// ---- 对阵
const arena = await createArena({ units, tables, read, blessingParams });
arena.open();
const RANDOM = 0.95, K = arena.K;
const skillName = id => (units.flatMap(u => u.skills).find(s => s.skillId === id)?.name) || String(arena.master.skill.get(id)?.NAME || id);
function attackSkills(i) {
  const u = arena.unit(i), rec = units[i];
  return u.skills.filter(s => s.type === K.SKILL.SKILL || s.type === 5).map(s => {
    const lv = rec.skills.find(x => x.skillId === s.id)?.lv ?? (arena.master.skill.get(s.id)?.ABSOLUTE_LV || (s.type === 5 ? 7 : 5));
    // 效果段完全相同的弹道只算一颗（多数招式每一下都一样）
    const seen = new Set(), bullets = arena.damageBullets(s.id, lv).filter(b => { const k = arena.master.bulletLevel(b, lv)?.PROCESS_INFO; if (seen.has(k)) return false; seen.add(k); return true; });
    return { id: s.id, type: s.type, level: lv, name: skillName(s.id), bullets };
  }).filter(s => s.bullets.length);
}
// 只有出手的人或目标带“正面／背后”条件的效果时，才另算一遍从背后命中
const directional = units.map((u, i) => arena.unit(i).instances.some(x => /^Direction/.test(x.cond.LUA_FUNC_NAME || '')));
const rows = [];
function oneSide(from, to) {
  for (const ai of from) for (const sk of attackSkills(ai)) for (const ti of to) {
    const run = (extra) => { let lo = Infinity, hi = 0, last = null; for (const b of sk.bullets) { const r = arena.strike(ai, ti, { skillId: sk.id, level: sk.level, bulletId: b, random: RANDOM, ...extra })[0]; if (!r || r.cancelled) continue; lo = Math.min(lo, r.damage); hi = Math.max(hi, r.damage); last = r; } return last ? { lo, hi, r: last } : null; };
    const n = run({}), c = run({ critical: true }), b = directional[ai] || directional[ti] ? run({ fromBehind: true }) : null;
    if (!n) continue;
    const hp = arena.panelOf(ti).hp, per = hitsPerCast.get(sk.id) || null, crt = Math.max(0, Math.min(100, n.r.crt));
    const expected = (1 - crt / 100) * (n.lo + n.hi) / 2 + crt / 100 * (c ? (c.lo + c.hi) / 2 : (n.lo + n.hi) / 2);
    rows.push({ side: units[ai].isMine ? '我方' : '对方', attacker: units[ai].dressName, skill: sk.name, skillId: sk.id, skillType: sk.type === 5 ? '超必杀' : '特技', target: units[ti].dressName,
      perHit: [n.lo, n.hi], perHitCritical: c ? [c.lo, c.hi] : null, perHitFromBehind: b ? [b.lo, b.hi] : null, critRate: crt, cap: n.r.cap, killer: !!n.r.killer, resist: n.r.resist,
      attack: n.r.attack, defense: n.r.defense, expectedPerHit: Math.round(expected), hitsPerCast: per, targetHp: hp, hitsToKill: n.hi > 0 ? Math.ceil(hp / ((n.lo + n.hi) / 2)) : null,
      castShare: per ? Math.round(expected * per.median / hp * 100) : null, trust: trustOf(units[ai], sk.id) });
  }
}
oneSide([0, 1, 2, 3], [4, 5, 6, 7]);
oneSide([4, 5, 6, 7], [0, 1, 2, 3]);
const panels = units.map((u, i) => ({ side: u.isMine ? '我方' : '对方', unit: u.dressName, source: u.isMine ? `记录 ${src.meta.match} 的开场前面板` : '凭配装算', ...arena.panelOf(i), hidden: !!u.hidden }));
const result = { opponent: { index: Number(indexArg), formation: opponent.formationName || opponent.formationId, units: theirs.map(u => u.dressName) }, mineFrom: src.meta.match, random: RANDOM, calibrated: !!calib, panels, rows, notes: arena.notes, unsupported: [...arena.battle.unsupported.keys()] };
if (asJson) { console.log(JSON.stringify(result, null, 1)); process.exit(0); }

const range = a => !a ? '—' : a[0] === a[1] ? a[0].toLocaleString('en') : `${a[0].toLocaleString('en')}～${a[1].toLocaleString('en')}`;
console.log(`对阵：我方（取自 ${src.meta.match}）对 第 ${indexArg} 个对手（阵型 ${result.opponent.formation}）`);
console.log('说明：开场状态下打一下，随机取 0.95；对手面板是凭配装算的（±10% 上下）；最终伤害目前只能当量级，看最右一列的对账结论。\n');
console.log('开场面板：'); for (const p of panels) console.log(`  ${p.side}${p.unit}：体力 ${p.hp}，攻击 ${p.atk}，防御 ${p.def}，魔力 ${p.matk}，精神 ${p.mdef}（${p.source}）`);
for (const side of ['我方', '对方']) {
  console.log(`\n${side}打${side === '我方' ? '对方' : '我方'}：\n| 出手 | 招式 | 目标 | 每下（不暴击） | 每下（暴击） | 从背后（不暴击） | 暴击率 | 上限 | 一次出招几下 | 目标体力 | 几下打掉 | 一次出招占体力 | 对账 |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const r of rows.filter(r => r.side === side)) console.log(`| ${r.attacker} | ${r.skill}（${r.skillType}） | ${r.target} | ${range(r.perHit)}${r.killer ? '（特攻）' : ''} | ${range(r.perHitCritical)} | ${r.perHitFromBehind && r.perHitFromBehind[1] !== r.perHit[1] ? range(r.perHitFromBehind) : '同正面'} | ${r.critRate}% | ${r.cap.toLocaleString('en')} | ${r.hitsPerCast ? `${r.hitsPerCast.median}（记录 ${r.hitsPerCast.casts} 次）` : '没记录'} | ${r.targetHp.toLocaleString('en')} | ${r.hitsToKill ?? '—'} | ${r.castShare == null ? '—' : r.castShare + '%'} | ${r.trust.text} |`);
}
if (result.notes.length) console.log('\n注：' + result.notes.join('；'));
if (result.unsupported.length) console.log('引擎还没实现的原生函数：' + result.unsupported.join('、'));
