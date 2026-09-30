// Builds dist/game-data/engine/monster-passive-text.json: a short simplified-Chinese line for every monster passive
// (MonsterPassiveSkillMst) a monster in the monster table has, for the calculator's Boss section (user 2026-09-30:
// “这些boss被动计算器不要算但是在boss界面要写出来” / “除了 Break 都不算”). The game has no text for monster passives, so
// each line is read from the passive's processes, the same way the skill table's classes are (scripts/skill-*.mjs):
// the condition from the game's condition data, the effect from the value parameters. A process this cannot put in
// words is shown by its process name (glossed) so nothing is hidden.
//   node scripts/build-monster-passive-text.mjs
import fs from 'node:fs';
import { zhName } from '../dist/engine/gloss.mjs';
import { decodeProcess, tagsOf, luaDocs, ELEM } from './skill-conditions.mjs';
import { describe } from './skill-entries.mjs';
import { statEntries, processCategory } from './skill-categories.mjs';
import { OWN_BREAK_COND } from '../dist/engine/scenario.mjs';

const R = p => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const core = R('dist/game-data/engine/core.json');
const P = core.ProcessMst, pc = Object.fromEntries(P.cols.map((c, i) => [c, i]));
const proc = new Map(P.rows.map(r => [r[0], r]));
const cond = new Map(core.ProcessCondMst.rows.map(r => [r[0], r]));
const passives = new Map(R('dist/game-data/engine/monster-passives.json').MonsterPassiveSkillMst.rows.map(r => [r[0], r]));
const M = R('dist/game-data/engine/monsters.json').MonsterMst, pi = M.cols.indexOf('PASSIVE_SKILL_INFO');
const docs = luaDocs('process.lua');

const STAT_WORD = { 攻击力: '攻击', 法强: '魔力', 防御力: '防御', 魔抗: '魔抗', HP: '最大HP', MP: '最大MP' };
const pct = v => `${Number((Math.abs(v) / 100).toFixed(2))}%`;
const sign = v => (v < 0 ? '−' : '+');
// the condition of one process, as read by the skill table (tags), for a monster that is the boss: an enemy-type
// condition says which of its own versions (普通敌人 / BOSS) a segment is for — the BOSS one is kept, the other dropped
function conditionOf(p, d) {
  const c = cond.get(proc.get(p.pid)?.[pc.PROCESS_COND]);
  let tags = tagsOf(d, false).filter(t => !/^(火|冰|树|雷|光|暗|无)属性$|^异常:|^特定效果类别$/.test(t));
  if (tags.includes('对普通敌人') && !tags.includes('对BOSS')) return null;
  tags = tags.filter(t => t !== '对BOSS' && t !== '对普通敌人');
  if (OWN_BREAK_COND.test(c?.[1] || '')) tags = ['Break 中', ...tags.filter(t => t !== 'Break／眩晕')];
  const names = docs.get(`process${p.pid}`)?.params || [], vals = String(p.params).split(':').map(Number);
  const dur = vals[names.indexOf('継続時間')];
  if (names.includes('継続時間') && dur > 0) tags.push(`持续${Math.round(dur / 60)}秒`);
  if (p.prob < 10000) tags.push(`${p.prob / 100}%几率`);
  // (user 2026-09-30: “写简单点”) how many times an HP trigger may fire is left out
  return tags.map(t => t.replace(/（仅\d+次）$/, '')).join('，');
}
// what one process does
function effectOf(p) {
  const q = proc.get(p.pid), names = docs.get(`process${p.pid}`)?.params || [];
  const vals = String(p.params).split(':').map(v => (v === '' ? 0 : Number(v)));
  const V = n => vals[names.indexOf(n)];
  if (/属性耐性増減/.test(p.kind) && names.includes('増減値')) {
    const el = V('属性ID'), n = V('増減値');
    return { key: `耐性${n}`, word: el ? `${ELEM[el]}` : '全', tail: `属性耐性 ${sign(n)}${Math.abs(n)}` };
  }
  if (/初回行動Wait/.test(p.kind)) return { text: vals[0] ? `开场第一次行动等待 ${vals[0]}` : '开场第一次行动不用等待' };
  if (processCategory(p) === '基础属性' || /STR|DEF|INT|MND|最大HP|全ステ/.test(p.kind)) {
    const st = statEntries([p]).filter(e => e.rate || e.add);
    if (st.length) return st.map(e => ({ key: `属性${e.rate}:${e.add}`, word: STAT_WORD[e.stat] || e.stat, tail: e.rate ? `${sign(e.rate)}${pct(e.rate)}` : `${sign(e.add)}${Math.abs(e.add)}` }));
  }
  const d = describe(p, { names, vals, ope: q?.[pc.OPE_INFO], script: q?.[pc.USE_SCRIPT], beh: String(q?.[pc.PARAM_BEHAVIOR] ?? '').split(':').map(Number) });
  if (d?.text) return { text: d.text };
  return { text: zhName(p.kind.replace(/^(P|PB|B|SP)_/, '')), raw: true };
}
// one passive → its effects grouped by condition: [[condition, [item …]]], an item being a text or [words, tail]
// (攻击、防御 share “+35%”); the calculator merges the passives of one monster by condition (engine-panel.mjs)
export function passiveText(id) {
  const r = passives.get(id); if (!r) return null;
  const groups = new Map(); let raw = 0;
  for (const seg of String(r[2]).split('@').filter(Boolean)) {
    const [pid, prob, ...ps] = seg.split(':'); const q = proc.get(Number(pid)); if (!q) continue;
    const p = { pid: Number(pid), kind: q[pc.NAME], params: ps.join(':'), prob: Number(prob) };
    const c = conditionOf(p, decodeProcess(p.pid, p.params)); if (c == null) continue;
    if (!groups.has(c)) groups.set(c, []);
    for (const e of [effectOf(p)].flat()) { if (e.raw) raw++; groups.get(c).push(e.text ? e.text : [[e.word], e.tail]); }
  }
  return { groups: [...groups], raw };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const used = new Set();
  for (const m of M.rows) for (const part of String(m[pi] || '').split('-')) { const id = Number(part.split(':')[1]); if (id) used.add(id); }
  const texts = {}; let raw = 0;
  for (const id of [...used].sort((a, b) => a - b)) { const t = passiveText(id); if (!t) continue; texts[id] = t.groups; if (t.raw) raw++; }
  fs.writeFileSync(new URL('../dist/game-data/engine/monster-passive-text.json', import.meta.url), JSON.stringify({ note: '怪物自带被动的简体说明（游戏里没有文字，按处理的条件和数值生成；读不出的写处理名称）。每个被动：[[条件, [文字 或 [[属性…], 数值]]]]，由 scripts/build-monster-passive-text.mjs 生成', texts }) + '\n');
  console.log(JSON.stringify({ passives: Object.keys(texts).length, withProcessNameOnly: raw }));
}
