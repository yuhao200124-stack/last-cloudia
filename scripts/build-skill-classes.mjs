// DRAFT (2026-09-29, waiting for the user's review): classifies every skill on the game-data skill table from the
// game data — 大类 (what it changes) from each of its processes' kind (ProcessMst.NAME, one skill can have several
// joined by “@” in PassiveSkillMst.PROCESS_INFO) and the game's own effect text; 条件标签 (element, move, weapon,
// race, HP …) from the game's condition data (scripts/skill-conditions.mjs); and whether the damage calculator can
// compute it. Writes
// docs/skill-classes-draft.json. The user reviews it as an Excel and the approved classes replace the table's tabs.
import fs from 'node:fs';
import { zhName } from '../dist/engine/gloss.mjs';
import { decodeProcess, tagsOf } from './skill-conditions.mjs';
import { categoriesOf, raisesAttack } from './skill-categories.mjs';
const R = p => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const core = R('dist/game-data/engine/core.json');
const P = core.ProcessMst, pc = Object.fromEntries(P.cols.map((c, i) => [c, i]));
const proc = new Map(P.rows.map(r => [r[pc.PROCESS_ID], r]));
const cond = new Map(core.ProcessCondMst.rows.map(r => [r[0], r]));
const B = core.BuffMst, bc = Object.fromEntries(B.cols.map((c, i) => [c, i]));
const game = new Map(R('docs/game-relic-passives.json').map(g => [g.gameId, g]));
const pas = new Map();
for (const f of fs.readdirSync(new URL('../dist/game-data/engine/p/', import.meta.url))) { const t = R('dist/game-data/engine/p/' + f).PassiveSkillMst; if (t) for (const r of t.rows) pas.set(r[0], r); }
const skills = [];
for (const [id, g] of game) {
  const r = pas.get(id);
  const procs = String(r[4]).split('@').map(seg => {
    const [pid, prob, ...params] = seg.split(':');
    const q = proc.get(Number(pid)); if (!q) return { pid: Number(pid), missing: true };
    const obj = Object.fromEntries(P.cols.map((c, i) => [c, q[i]])); const cn = cond.get(q[pc.PROCESS_COND]);
    return { pid: Number(pid), kind: obj.NAME, kindZh: zhName(obj.NAME), trigger: cn ? cn[1] : String(obj.PROCESS_COND), triggerZh: cn ? zhName(cn[1]) : '', condParam: obj.PROCESS_COND_PARAM, ope: obj.OPE_INFO, script: obj.USE_SCRIPT, prob: Number(prob), params: params.join(':') };
  });
  skills.push({ id, name: g.nameS, sc: g.sc, effect: g.effectS, procs });
}

const DAMAGE = new Set(['伤害上限', '特攻', '暴击', '造成伤害']);
// conditions that need a switch or are not simulated by the calculator (the target is always a boss and the battle
// start is simulated, so BOSS / 开局 need nothing; element / move / weapon / race are checked by the game scripts)
const SWITCHED = /^HP|满血|Break|队伍|异常状态|复活时|死亡时|未装备武器|现实时间|击杀时|致命伤害|定时发动|移动中|咏唱中|空中|连击数|距离|特殊计数|MP条件|需要装备特定技能|援护|超必杀槽|连续发动|增益／减益|朝向|以太|受击次数|特技次数|第几击|种类数|属性比较|角色类别|目标属性耐性|敌人类型条件|战斗结束时|受到致命/;
// a process only defends when it changes the damage the character takes (or its resistances)
const DEFENSIVE = p => /被ダメージ|被命中|被弾|ガード|バリア|耐性/.test(p.kind) || /被ダメージ|を受けた/.test(p.trigger);
const out = [];
for (const s of skills) {
  // 大类 only from the game data (scripts/skill-categories.mjs): process names, operation codes, script parameters, buffs
  const cats = categoriesOf(s.procs, DEFENSIVE);
  // 条件标签 from the game's condition data (scripts/skill-conditions.mjs), not from the description
  const conds = s.procs.map(p => { const d = decodeProcess(p.pid, p.params); return { kind: p.kind, defensive: DEFENSIVE(p), d, tags: tagsOf(d, DEFENSIVE(p)) }; });
  const tags = [...new Set(conds.flatMap(c => c.tags))];
  const undecoded = [...new Set(conds.flatMap(c => c.d.undecoded || []))];
  const conditional = tags.some(t => SWITCHED.test(t));
  const dmg = [...cats.keys()].some(c => DAMAGE.has(c)) || (cats.has('基础属性') && raisesAttack(s.procs));
  const calc = cats.has('待确认') || undecoded.length ? '待确认' : dmg ? (conditional ? '看条件' : '能算') : '不影响每段伤害';
  // 减伤 (damage taken; computed later): the processes that change the damage the character takes, with the attacks
  // they apply to — ready for when the calculator also simulates the enemy's attacks
  const guard = conds.filter(c => c.defensive && (cats.has('受到伤害') || cats.has('基础属性')));
  const defense = guard.length ? { calc: guard.some(c => c.tags.some(t => SWITCHED.test(t))) ? '看条件' : '能算', tags: [...new Set(guard.flatMap(c => c.tags))] } : null;
  // the decoded conditions per process, for the 配装's “只看本招式吃得到的” filter later
  const conditions = conds.map(({ kind, defensive, d }) => ({ kind, defensive, ...Object.fromEntries(Object.entries(d).filter(([k, v]) => Array.isArray(v) ? v.length : v).map(([k, v]) => [k, Array.isArray(v) && typeof v[0] !== 'object' ? [...new Set(v)] : v])) }));
  out.push({ ...s, cats: [...cats.keys()], reasons: Object.fromEntries([...cats].map(([c, r]) => [c, [...r]])), tags, undecoded, conditions, calc, defense, triggers: [...new Set(s.procs.map(p => p.triggerZh || p.trigger))] });
}
// the user's decisions (docs/skill-classes-user.json) win over the automatic classes
const user = JSON.parse(fs.readFileSync(new URL('../docs/skill-classes-user.json', import.meta.url), 'utf8'));
for (const s of out) {
  const u = user.skills[s.id]; if (!u) continue;
  if (u.cats) { s.cats = [...u.cats]; s.reasons = Object.fromEntries(u.cats.map(c => [c, ['用户决定']])); }
  for (const c of u.addCats || []) if (!s.cats.includes(c)) { s.cats.push(c); s.reasons[c] = ['用户决定']; }
  if (u.calc) s.calc = u.calc;
  if (u.note) s.userNote = u.note;
}
fs.writeFileSync(new URL('../docs/skill-classes-draft.json', import.meta.url), JSON.stringify({ note: '技能分类初稿（自动）：每个技能的大类（效果种类＋游戏效果说明）、条件标签、计算器能否算；等用户核对后替换技能表分页', categories: user.categories, skills: out.map(s => ({ id: s.id, name: s.name, cats: s.cats, tags: s.tags, calc: s.calc, reasons: s.reasons, ...(s.undecoded.length ? { undecoded: s.undecoded } : {}), ...(s.defense ? { defense: s.defense } : {}), conditions: s.conditions, ...(s.userNote ? { userNote: s.userNote } : {}), kinds: s.procs.map(p => p.kind), triggers: s.triggers })) }) + '\n');
const count = new Map(); for (const s of out) for (const c of s.cats) count.set(c, (count.get(c) || 0) + 1);
console.log([...count].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(' · '));
const calc = new Map(); for (const s of out) calc.set(s.calc, (calc.get(s.calc) || 0) + 1); console.log([...calc].map(([c, n]) => `${c} ${n}`).join(' · '));
console.log('multi-category', out.filter(s => s.cats.length > 1).length, 'no conditions', out.filter(s => !s.tags.length).length, 'undecoded', out.filter(s => s.undecoded.length).length);
