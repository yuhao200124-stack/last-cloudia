// 竞技场对账（升级方案第 1 步）：拿 PvP 读取器录的一场对局，让计算器引擎按“开场状态”把每一下伤害重算一遍，和记录比。
//   node scripts/pvp-reconcile.mjs <对局文件夹> [--panel calc] [--explain] [--detail 名字] [--json]
// 对局文件夹：PvPLogs/<对局>/（要有 PvPBattle.json 和 PvPLog.csv）。只读，不改任何文件。
// 比三样：
//   1. 进场面板：引擎跑完开场后的 体力／攻击／防御／魔力／精神，和记录里第 15 帧的面板逐项比（8 人 × 5 项 = 40 格）。
//   2. 每一下伤害的“状态”：攻击、防御、系数、属性耐性、特攻 这五个数，引擎的开场状态和记录里这一下用到的是否相同。
//      出手前先把场上状态换成记录里那一刻的（身上的增减益、谁倒下了、体力法力；--opening 关掉这一步）。换完这五个数还不同，
//      记为“状态对不上”，不往下比。
//   3. 状态相同的那些：核心值（引擎按随机 1.0 算，记录应落在它的 0.9～1.0 倍）和最终伤害（把核心值换成记录的数，
//      只比核心值之后那一长串增减；完全相同＝一致，差 10% 以内＝接近，否则＝对不上）。
// --panel calc：面板不喂记录的，只凭配装让引擎自己算（赛前估算时的情形）。
// --explain：对“对不上”的组，逐条去掉引擎算进去的效果，找去掉哪一条（或哪两条）就和记录完全一致。
// --detail 名字：把“攻击者 技能 → 目标”里含这个名字的组的第一下，列出引擎的整条增减链。
// --opening：不重放，所有人都按开场状态算（赛前估算时的情形）。--only 文字：只比“攻击者｜技能｜目标”里含这段文字的组。--max-frame 数字：只比这一帧之前的。
// --json：输出机器读的结果（字段见 docs/pvp-arena-calculator-2026-10-05.md）。
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readMatch, stateBefore } from './lib/pvp-record.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const { createArena, loadArenaTables } = await import(ROOT + 'dist/engine/arena.mjs');
const { DEFAULT_BLESSINGS } = await import(ROOT + 'dist/account-blessing-default.mjs');
const read = async (p, asText) => { const t = fs.readFileSync(ROOT + 'dist/game-data/' + p, 'utf8'); return asText ? t : JSON.parse(t); };

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf('--' + n); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = n => { const i = args.indexOf('--' + n); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const asJson = flag('json'), explain = flag('explain'), replay = !flag('opening'), only = opt('only'), maxFrame = Number(opt('max-frame') ?? Infinity), detail = opt('detail'), panelMode = opt('panel') || 'given';
const dir = args[0];
if (!dir) { console.error('用法：node scripts/pvp-reconcile.mjs <对局文件夹> [--panel calc] [--explain] [--detail 名字] [--json]'); process.exit(1); }

export const TOLERANCE = { coreLow: 0.89, coreHigh: 1.01, finalSame: 0.03, finalNear: 0.10, minCore: 20 };
const m = readMatch(dir);
const usable = m.units.length === 8 && m.units.every(u => u.entry && (panelMode === 'calc' || u.panel));
if (!usable) { console.error('这一场的记录不完整（要 8 个角色都有开场前面板和进场面板），不能对账。' + m.warnings.join('；')); process.exit(2); }
const arena = await createArena({ units: m.units, tables: await loadArenaTables(read), read, panel: panelMode, blessingParams: DEFAULT_BLESSINGS.blessings });
arena.open();
const nameOf = u => (u.isMine ? '我方' : '对方') + u.dressName;
const idx = new Map(m.units.map((u, i) => [u.uid, i]));
const passiveName = id => arena.master.passive.get(id)?.NAME || arena.master.itemEquip?.get(id)?.NAME || '';

// ---- 1. 进场面板
const PANEL = [['hp', '体力'], ['atk', '攻击'], ['def', '防御'], ['matk', '魔力'], ['mdef', '精神']];
const panel = m.units.map((u, i) => { const p = arena.panelOf(i); return { unit: nameOf(u), cells: PANEL.map(([k, zh]) => ({ key: k, name: zh, engine: p[k], record: u.entry[k], same: p[k] === u.entry[k] })) }; });
const panelSame = panel.reduce((a, r) => a + r.cells.filter(c => c.same).length, 0);

// ---- 2、3. 每一下伤害
const bulletCache = new Map();
// 重放（--replay，默认开）：每一下出手前，把场上的增减益、倒下的人、体力法力换成记录里那一刻的
const uidIndex = uid => idx.get(uid) ?? null;
function recordedState(h) {
  const st = stateBefore(m, h);
  return m.units.map(u => { const s = st.get(u.uid); return { alive: s.alive, hp: s.hp, mp: s.mp, buffs: [...s.buffs.values()].map(b => ({ buffId: b.buffId, duration: b.duration, params: b.effs, from: idx.get(b.from) ?? null, affiliation: b.affiliation, localId: b.localId, localIndex: b.localIndex, processId: b.processId, uidOf: uidIndex })) }; });
}
let replayReport = { added: 0, removed: 0, failed: new Set() };
function engineHit(h, extra = {}) {
  const ai = idx.get(h.attacker), ti = idx.get(h.target);
  if (replay && !extra.before) { const state = recordedState(h); extra = { ...extra, before: () => { const r = arena.setState(state); replayReport.added += r.added; replayReport.removed += r.removed; for (const f of r.failed) replayReport.failed.add(f); } }; }
  const bullets = arena.damageBullets(h.skillId, h.skillLv); if (!bullets.length) return null;
  const key = `${h.attacker}:${h.skillId}:${h.coef}`;
  const order = bulletCache.has(key) ? [bulletCache.get(key)] : bullets;
  let best = null;
  for (const b of order) {
    const r = arena.strike(ai, ti, { skillId: h.skillId, level: h.skillLv, bulletId: b, critical: h.critical, random: 1, ...extra })[0];
    if (!r || r.cancelled) continue;
    // 记录里的系数已经乘了这一下的伤害比例（二刀流每下 60%），引擎的 per 没乘，这里补上再比
    r.coef = Math.round(r.per * r.dmgRatio / 1000) / 10;
    if (!best || Math.abs(r.coef - h.coef) < Math.abs(best.coef - h.coef)) best = r;
    if (Math.abs(r.coef - h.coef) < 0.11) { bulletCache.set(key, b); break; }
  }
  return best;
}
const groups = new Map();
let skipped = { noSkill: 0, zero: 0, small: 0 };
for (const h of m.hits) {
  if (!h.skillId) { skipped.noSkill++; continue; }
  if (h.core <= 0 || h.damage <= 0) { skipped.zero++; continue; }
  const A = m.units[idx.get(h.attacker)], T = m.units[idx.get(h.target)];
  const key = `${nameOf(A)}｜${h.skillName}｜${nameOf(T)}`;
  if ((only && !key.includes(only)) || h.frame > maxFrame) continue;
  const g = groups.get(key) || groups.set(key, { key, attacker: nameOf(A), skill: h.skillName, skillId: h.skillId, target: nameOf(T), hits: [] }).get(key);
  const e = engineHit(h);
  if (!e) { g.hits.push({ h, status: 'noEngine' }); continue; }
  const diff = [];
  if (e.attack !== h.attack) diff.push(`攻击 引擎 ${e.attack}／记录 ${h.attack}`);
  if (e.defense !== h.defense) diff.push(`防御 引擎 ${e.defense}／记录 ${h.defense}`);
  if (Math.abs(e.coef - h.coef) >= 0.11) diff.push(`系数 引擎 ${e.coef}／记录 ${h.coef}`);
  if (Math.abs(e.resist - h.resist) > 0.001) diff.push(`属性耐性 引擎 ${e.resist}／记录 ${h.resist}`);
  const ek = e.killer ? Math.round(e.killerFactor * 10000) / 10000 : 0;
  if (Math.abs(ek - h.killer) > 0.0001) diff.push(`特攻 引擎 ${ek || '无'}／记录 ${h.killer || '无'}`);
  if (diff.length) { g.hits.push({ h, e, status: 'state', diff }); continue; }
  const coreRatio = h.core / Math.max(1, e.coreDamage);
  const coreOk = coreRatio >= TOLERANCE.coreLow && coreRatio <= TOLERANCE.coreHigh || Math.abs(h.core - e.coreDamage) <= 1;
  // 正面还是背后命中记录里没有（位置每 15 帧才记一次）：两种都算，取更接近记录的那个，并记下是哪一种
  let f = engineHit(h, { core: h.core }), behind = false;
  const fb = engineHit(h, { core: h.core, fromBehind: true });
  if (fb && fb.damage !== f.damage && Math.abs(Math.log(fb.damage / h.damage)) < Math.abs(Math.log(f.damage / h.damage))) { f = fb; behind = true; }
  const finalRatio = f.damage / h.damage;
  const small = h.core < TOLERANCE.minCore; if (small) skipped.small++;
  // 伤害上限：引擎这一下顶到了上限、或记录的数比引擎的上限还高，说明两边的上限不一样，单独归一类
  const capDiff = f.damage !== h.damage && (f.damage >= f.cap || h.damage > f.cap);
  const status = capDiff ? 'cap' : f.damage === h.damage ? 'exact' : Math.abs(finalRatio - 1) <= TOLERANCE.finalSame ? 'same' : Math.abs(finalRatio - 1) <= TOLERANCE.finalNear ? 'near' : 'off';
  g.hits.push({ h, e, f, status: small ? 'small' : status, coreOk, coreRatio, finalRatio, behind, capped: f.damage >= f.cap });
}
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
function summarize(g) {
  const c = k => g.hits.filter(x => x.status === k).length;
  const cmp = g.hits.filter(x => ['exact', 'same', 'near', 'off', 'cap'].includes(x.status));
  const s = { key: g.key, attacker: g.attacker, skill: g.skill, skillId: g.skillId, target: g.target, hits: g.hits.length, stateChanged: c('state'), tooSmall: c('small'), compared: cmp.length, exact: c('exact'), same: c('same'), near: c('near'), off: c('off'), capDiff: c('cap'),
    coreOk: cmp.filter(x => x.coreOk).length, behind: cmp.filter(x => x.behind).length, finalRatio: median(cmp.map(x => x.finalRatio)), firstFrame: g.hits[0].h.frame,
    stateDiff: [...new Set(g.hits.filter(x => x.status === 'state').flatMap(x => x.diff.map(d => d.split(' ')[0])))] };
  s.verdict = !s.compared ? (s.stateChanged ? '状态对不上' : '太小不比') : s.off ? '对不上' : s.capDiff ? '上限不同' : s.near ? '接近' : s.coreOk === s.compared ? '一致' : '核心值有出入';
  return s;
}
const table = [...groups.values()].map(g => ({ ...summarize(g), g }));

// ---- --explain：去掉哪一条就完全一致
function explainGroup(g) {
  const sample = g.hits.filter(x => x.status === 'off' || x.status === 'near').slice(0, 6); if (!sample.length) return null;
  // 每条效果的倍率（这一条前后两个数之比）；只试“去掉后大致能凑到记录”的组合，再逐下核对是否完全相同
  const first = sample[0]; let prev = first.h.core;
  const edits = first.f.edits.filter(e => e.uid).map(e => { const f = e.value / Math.max(1, prev); prev = e.value; return { ...e, factor: f }; }).filter(e => e.factor > 0 && e.factor !== 1);
  const need = first.f.damage / first.h.damage, close = x => Math.abs(x - 1) <= 0.06;
  // 完全相同做不到时（对手的加护等级读不到，会差 1% 上下），差 1.5% 以内也算凑上
  const fits = off => sample.every(x => { const r = engineHit(x.h, { core: x.h.core, disable: off, fromBehind: x.behind }); return r && Math.abs(r.damage / x.h.damage - 1) <= 0.015; });
  const label = e => `${passiveName(e.localId) || e.localId}（${e.localId}，${e.by}）`;
  const singles = edits.filter(e => close(need / e.factor) && fits([e.uid])).map(label);
  if (singles.length) return { remove: singles.length === 1 ? singles : [singles.join(' 或 ')] };
  let tried = 0;
  for (let i = 0; i < edits.length; i++) for (let j = i + 1; j < edits.length; j++) if (close(need / edits[i].factor / edits[j].factor) && tried++ < 40 && fits([edits[i].uid, edits[j].uid])) return { remove: [label(edits[i]), label(edits[j])] };
  return { remove: null };
}
if (explain) for (const r of table) if (r.off || r.near) r.explain = explainGroup(r.g);

const total = table.reduce((a, r) => ({ hits: a.hits + r.hits, compared: a.compared + r.compared, exact: a.exact + r.exact, same: a.same + r.same, near: a.near + r.near, off: a.off + r.off, capDiff: a.capDiff + r.capDiff, behind: a.behind + r.behind, stateChanged: a.stateChanged + r.stateChanged, coreOk: a.coreOk + r.coreOk }), { hits: 0, compared: 0, exact: 0, same: 0, near: 0, off: 0, capDiff: 0, behind: 0, stateChanged: 0, coreOk: 0 });
const ratios = table.flatMap(r => r.g.hits.filter(x => x.finalRatio != null && x.status !== 'small' && x.status !== 'cap').map(x => x.finalRatio));
const within = p => ratios.filter(x => Math.abs(x - 1) <= p).length;
const result = { match: m.meta.match, spread: { n: ratios.length, within3: within(0.03), within10: within(0.10), within20: within(0.20), within50: within(0.5) }, reader: m.meta.reader, isPlayback: m.meta.isPlayback, panelMode, panel: { same: panelSame, total: panel.length * PANEL.length, rows: panel }, total, skipped,
  groups: table.map(({ g, ...r }) => r), notes: arena.notes, unsupported: [...arena.battle.unsupported.keys()], warnings: m.warnings };

if (asJson) { console.log(JSON.stringify(result, null, 1)); process.exit(0); }
console.log(`对局 ${result.match}（${result.reader}${result.isPlayback ? '，回放' : '，实战'}）　面板：${panelMode === 'calc' ? '只凭配装算' : '用记录里的开场前面板'}`);
console.log(`\n一、进场面板：${panelSame}／${result.panel.total} 格一致`);
for (const r of panel) { const bad = r.cells.filter(c => !c.same); if (bad.length) console.log(`  ${r.unit}：` + bad.map(c => `${c.name} 引擎 ${c.engine}／记录 ${c.record}（${(c.engine / c.record * 100).toFixed(0)}%）`).join('，')); }
console.log(`\n二、伤害：记录里有 ${m.hits.length} 下，其中 ${skipped.noSkill} 下认不出是哪个技能、${skipped.zero} 下伤害是 0，不比。`);
console.log(`  能比的 ${total.hits} 下里：${total.stateChanged} 下的状态对不上（攻击、防御、系数、属性耐性、特攻这五个数里有不一样的${replay ? '——已经按记录重放了增减益、倒下的人、体力法力，仍不一样' : '——按开场状态算，出手时场上已经变了'}）；${skipped.small} 下核心值小于 ${TOLERANCE.minCore}（取整误差太大，不比）。`);
console.log(`  剩下 ${total.compared} 下：最终伤害完全相同 ${total.exact}，差 3% 以内 ${total.same}，差 3%～10% ${total.near}，对不上 ${total.off}，伤害上限不同 ${total.capDiff}；核心值落在随机范围内 ${total.coreOk}；按“从背后命中”才更接近的 ${total.behind} 下。`);
console.log(`  这 ${ratios.length} 下（不含上限不同的）引擎÷记录：差 3% 内 ${within(0.03)}，10% 内 ${within(0.10)}，20% 内 ${within(0.20)}，50% 内 ${within(0.5)}。`);
console.log('\n| 攻击者 | 技能 | 目标 | 下数 | 状态对不上 | 比了 | 完全相同 | 差 3% 内 | 差 3%～10% | 对不上 | 上限不同 | 引擎÷记录 | 结论 |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of table) console.log(`| ${r.attacker} | ${r.skill} | ${r.target} | ${r.hits} | ${r.stateChanged}${r.stateDiff.length ? `（${r.stateDiff.join('、')}）` : ''} | ${r.compared} | ${r.exact} | ${r.same} | ${r.near} | ${r.off} | ${r.capDiff} | ${r.finalRatio == null ? '—' : r.finalRatio.toFixed(2)} | ${r.verdict}${r.explain ? (r.explain.remove ? `：去掉「${r.explain.remove.join('」和「')}」后和记录相差 1.5% 以内` : '：去掉一两条也凑不出记录的数') : ''} |`);
if (result.notes.length) console.log('\n注：' + result.notes.join('；'));
if (result.unsupported.length) console.log('引擎还没实现的原生函数：' + result.unsupported.join('、'));
if (flag('hits')) for (const r of table) { console.log(`\n${r.key}`); for (const x of r.g.hits) console.log(`  第 ${x.h.frame} 帧${x.h.critical ? ' 暴击' : ''}：记录 核心值 ${x.h.core} 最终 ${x.h.damage}` + (x.f ? `；引擎 核心值 ${x.e.coreDamage} 最终 ${x.f.damage}（${(x.finalRatio * 100).toFixed(1)}%${x.behind ? '，按背后命中' : ''}${x.capped ? '，到上限' : ''}）` : x.diff ? `；状态对不上：${x.diff.join('；')}` : '')); }
if (detail) {
  const r = table.find(r => r.key.includes(detail) && r.g.hits.some(x => x.f)) || table.find(r => r.key.includes(detail));
  const x = r?.g.hits.find(x => x.f) || r?.g.hits.find(x => x.e);
  if (!x) console.log(`\n没有含“${detail}”的组。`);
  else {
    const h = x.h, e = x.f || x.e;
    console.log(`\n三、明细：${r.key}　第 ${h.frame} 帧${h.critical ? '（暴击）' : ''}`);
    console.log(`  记录：攻击 ${h.attack}，防御 ${h.defense}，系数 ${h.coef}，耐性 ${h.resist}，特攻 ${h.killer || '无'}，核心值 ${h.core}，最终 ${h.damage}（×${(h.damage / h.core).toFixed(2)}）`);
    console.log(`  引擎：攻击 ${e.attack}，防御 ${e.defense}，系数 ${e.coef}，耐性 ${e.resist}，特攻 ${e.killer ? e.killerFactor : '无'}，核心值 ${x.e.coreDamage}（随机按 1.0）；核心值换成记录的 ${h.core} 后最终 ${e.damage}（×${(e.damage / h.core).toFixed(2)}），上限 ${e.cap}`);
    console.log(`  引擎核心值里的几项：属性 ×${x.e.elementFactor.toFixed(3)}，特攻 ×${x.e.killerFactor.toFixed(3)}，攻击方伤害威力 ×${x.e.offense.toFixed(3)}，目标受伤害威力 ×${x.e.received.toFixed(3)}，目标减伤 ×${x.e.reduction.toFixed(3)}，伤害比例 ${x.e.dmgRatio / 100}%${x.e.critical ? '，暴击' : ''}`);
    if (x.diff) console.log('  状态不同：' + x.diff.join('；'));
    let prev = x.f ? h.core : x.e.coreDamage;
    for (const ed of e.edits) { console.log(`    ×${(ed.value / Math.max(1, prev)).toFixed(3)}  ${(arena.battle.unit(ed.owner)?.name || '').padEnd(8)} ${passiveName(ed.localId) || ''}（${ed.localId}）${ed.by}`); prev = ed.value; }
  }
}
