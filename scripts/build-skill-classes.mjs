// DRAFT (2026-09-29, waiting for the user's review): classifies every skill on the game-data skill table from the
// game data — 大类 (what it changes) from each of its processes' kind (ProcessMst.NAME, one skill can have several
// joined by “@” in PassiveSkillMst.PROCESS_INFO) and the game's own effect text; 条件标签 (element, move, weapon,
// race, HP …) from the game's condition data (scripts/skill-conditions.mjs); and whether the damage calculator can
// compute it. Writes
// docs/skill-classes-draft.json. The user reviews it as an Excel and the approved classes replace the table's tabs.
import fs from 'node:fs';
import { zhName } from '../dist/engine/gloss.mjs';
import { decodeProcess, tagsOf } from './skill-conditions.mjs';
import { categoriesOf, kindCategory, raisesAttack, statEntries } from './skill-categories.mjs';
import { luaDocs } from './skill-conditions.mjs';
const procDocs = luaDocs('process.lua');
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
const SWITCHED = /^HP|满血|随时间|受到攻击时|Break|队伍|异常状态|复活时|死亡时|未装备武器|现实时间|击杀时|致命伤害|定时发动|移动中|咏唱中|空中|连击数|距离|特殊计数|MP条件|需要装备特定技能|援护|超必杀槽|连续发动|增益／减益|朝向|以太|受击次数|特技次数|第几击|种类数|属性比较|角色类别|目标属性耐性|敌人类型条件|战斗结束时|受到致命/;
// a process only defends when it changes the damage the character takes (or its resistances)
// the element / attack-type tags: what a damage bonus applies to (the preview's filter rows), not a condition
const APPLY = /^(火|冰|树|雷|光|暗|无)属性$|^(物理|魔法|普攻|特技|超必杀|反击)$/;
const DEFENSIVE = p => /被ダメージ|被追加ダメージ|被命中|被弾|ガード|バリア|耐性|相手.*与ダメージ減少/.test(p.kind) || /被ダメージ|を受けた/.test(p.trigger);
const out = [];
for (const s of skills) {
  // 大类 only from the game data (scripts/skill-categories.mjs): process names, operation codes, script parameters, buffs
  const cats = categoriesOf(s.procs, DEFENSIVE);
  // 条件标签 from the game's condition data (scripts/skill-conditions.mjs), not from the description
  const conds = s.procs.map(p => { const d = decodeProcess(p.pid, p.params); return { kind: p.kind, defensive: DEFENSIVE(p), d, tags: tagsOf(d, DEFENSIVE(p)) }; });
  let tags = [...new Set(conds.flatMap(c => c.tags))];
  if (tags.some(t => /^HP\d|满血|HP越|HP降到|HP回到/.test(t))) tags = tags.filter(t => t !== 'HP条件');
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
  // 小类 of 基础属性: each stat it changes (a skill changing several is in each), with the value and that process's
  // own conditions (+ probability, and a duration after the battle start / the trigger)
  let sub = null;
  // a process's own conditions for a 小类 entry: its condition tags, plus probability and duration (after the battle
  // start / after the trigger)
  const entryTags = i => {
    const p = s.procs[i], names = procDocs.get(`process${p.pid}`)?.params || [], vals = String(p.params ?? '').split(':').map(Number);
    const tags = conds[i].tags.filter(t => !/^追加|^可装备|^受·/.test(t));
    if (p.prob < 10000) tags.push(`概率发动（${p.prob / 100}%）`);
    const d = vals[names.indexOf('継続時間')];
    if (names.includes('継続時間') && d > 0) tags.push(/Wave開始/.test(p.trigger) ? `开局${Math.round(d / 60)}秒内` : `${Math.round(d / 60)}秒内（触发后）`);
    return tags;
  };
  // a process that scales between a start and a full point (効果最小… / 効果最大… / 適正…) gives its value at full: “最多”
  const scales = i => (procDocs.get(`process${s.procs[i].pid}`)?.params || []).some(n => /^効果(最小|最大)|^適正/.test(n || ''));
  if (cats.has('基础属性')) {
    const byStat = new Map();
    for (const e of statEntries(s.procs)) {
      const tags = entryTags(e.proc);
      const entry = { stat: e.stat, rate: e.rate, add: e.add, basis: e.basis, ...(e.max || scales(e.proc) ? { max: true } : {}), cond: tags.length > 0, tags: [...new Set(tags)] };
      const old = byStat.get(e.stat);
      const better = !old || (old.cond && !entry.cond) || (old.cond === entry.cond && (Math.abs(entry.rate) > Math.abs(old.rate) || (entry.rate === old.rate && Math.abs(entry.add) > Math.abs(old.add))));
      if (better) byStat.set(e.stat, entry);
    }
    sub = { 基础属性: ['HP', 'MP', '攻击力', '法强', '防御力', '魔抗', '属性耐性'].filter(x => byStat.has(x)).map(x => byStat.get(x)) };
  }
  // 造成伤害 entries, one per damage process: the element(s) and attack type(s) it applies to (the preview's two filter
  // rows; null = any), its value and its own conditions. 伤害加成 = …与ダメージ… (ダメージ倍率(最大)補正, 1/100 %);
  // 其他方式 = 追加伤害, 追加伤害增幅, 无视防御 (DEF貫通), 魔转相. P_DOTダメージ is the character's own HP loss (the
  // drawback of 狂战士 etc.), not damage dealt, so it has no entry.
  if (cats.has('造成伤害')) {
    const list = [];
    s.procs.forEach((p, i) => {
      if (kindCategory(p.kind) !== '造成伤害' || /DOTダメージ/.test(p.kind)) return;
      const d = conds[i].d, names = procDocs.get(`process${p.pid}`)?.params || [], vals = String(p.params ?? '').split(':').map(v => (v === '' ? 0 : Number(v)));
      const v = n => vals[names.indexOf(n)];
      // a damage bonus's 対象属性 is the element it applies to; an extra hit's element is only that hit's own
      const els = [...new Set([...(d.elements || []), ...(/与ダメージ/.test(p.kind) ? d.aboutElements || [] : [])])].sort();
      const tags = entryTags(i).filter(t => !APPLY.test(t));
      const e = { way: '伤害加成', els: els.length ? els : null, types: d.skillTypes?.length ? [...new Set(d.skillTypes)].sort((a, b) => a - b) : null, rate: 0, cond: tags.length > 0, tags };
      const pct = x => `${Number((x / 100).toFixed(2))}%`;
      if (/与ダメージ/.test(p.kind)) {
        // no attack-type parameter (the buff processes PB_…): the process name says it right before 与ダメージ
        const named = p.kind.match(/(物理|魔法|特技|超必殺技|通常攻撃)与ダメージ/);
        if (!e.types && named) e.types = { 物理: [1, 9], 魔法: [2], 特技: [1], 超必殺技: [5], 通常攻撃: [9] }[named[1]];
        const j = names.findIndex(n => /^ダメージ倍率(補正|最大補正)?$/.test(n || ''));
        if (j >= 0) { e.rate = vals[j]; if (/最大/.test(names[j]) || scales(i)) e.max = true; }
        e.text = j >= 0 ? `${e.max ? '最多' : ''}${e.rate < 0 ? '−' : '+'}${pct(Math.abs(e.rate))}` : '（数值读不出）';
      } else if (/追加ダメージ威力/.test(p.kind)) { e.way = '追加伤害增幅'; e.rate = v('追加ダメージ倍率MIN倍率'); e.text = `追加伤害 +${pct(e.rate)}`; }
      else if (/追加ダメージ2種/.test(p.kind)) { e.way = '追加伤害'; e.rate = v('追加ダメージ1割合MIN'); e.text = `追加 ${pct(v('追加ダメージ1割合MIN'))}～${pct(v('追加ダメージ1割合MAX'))}（${pct(v('追加ダメージ1発生確率'))}）或 ${pct(v('追加ダメージ2割合MIN'))}～${pct(v('追加ダメージ2割合MAX'))}`; }
      else if (/追加ダメージ/.test(p.kind)) { e.way = '追加伤害'; const [, n, lo, hi] = vals; e.rate = lo; e.text = `追加${n > 1 ? ` ${n} 次` : ''} ${pct(lo)}～${pct(hi)}`; }  // built-in 801: element, count, MIN, MAX
      else if (/貫通/.test(p.kind)) { e.way = '无视防御'; const r = names.length ? v('DEF倍率') : vals[1]; e.rate = -r; e.text = `敌方防御 −${pct(-r)}`; } // built-in 301: DEF加算値, DEF倍率
      else if (/魔転相\(STR\)/.test(p.kind)) { e.way = '魔转相'; e.rate = v('攻撃力変換率'); e.text = `攻击力、法强各加攻击力的 ${pct(e.rate)}`; }
      else if (/魔転相/.test(p.kind)) { e.way = '魔转相'; e.rate = v('魔力変換率'); e.text = `攻击力、法强各加魔力的 ${pct(e.rate)}`; }
      else throw new Error(`造成伤害: unknown ${p.kind} (${s.name})`);
      list.push(e);
    });
    // entries that differ in one of element / attack type only are one entry (exact: the game applies each)
    const key = (e, skip) => JSON.stringify([e.way, e.rate, e.max, e.text, e.tags, skip === 'els' ? null : e.els, skip === 'types' ? null : e.types]);
    for (let merged = true; merged;) {
      merged = false;
      for (const dim of ['els', 'types']) for (let a = 0; a < list.length && !merged; a++) for (let b = a + 1; b < list.length && !merged; b++) {
        const x = list[a], y = list[b];
        if (key(x, dim) !== key(y, dim) || !x[dim] || !y[dim]) continue;
        x[dim] = [...new Set([...x[dim], ...y[dim]])].sort((p, q) => p - q); list.splice(b, 1); merged = true;
      }
    }
    // what each entry applies to, as chips: 火属性… and 物理 (普攻＋特技) / 普攻 / 特技 / 魔法 / 超必杀 / 反击 …
    for (const e of list) {
      const t = new Set(e.types || []), names = [];
      if (t.has(9) && t.has(1)) names.push('物理'); else { if (t.has(9)) names.push('普攻'); if (t.has(1)) names.push('特技'); }
      for (const [c, n] of [[2, '魔法'], [5, '超必杀'], [15, '反击'], [3, '魔法阵'], [4, '召唤']]) if (t.has(c)) names.push(n);
      e.apply = [...(e.els || []).map(x => `${{ 0: '无', 1: '火', 2: '冰', 3: '树', 4: '雷', 5: '光', 6: '暗' }[x]}属性`), ...names];
    }
    if (list.length) (sub ||= {}).造成伤害 = list;
  }
  out.push({ ...s, cats: [...cats.keys()], reasons: Object.fromEntries([...cats].map(([c, r]) => [c, [...r]])), tags, undecoded, conditions, calc, defense, sub, triggers: [...new Set(s.procs.map(p => p.triggerZh || p.trigger))] });
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
fs.writeFileSync(new URL('../docs/skill-classes-draft.json', import.meta.url), JSON.stringify({ note: '技能分类初稿（自动）：每个技能的大类（效果种类＋游戏效果说明）、条件标签、计算器能否算；等用户核对后替换技能表分页', categories: user.categories, skills: out.map(s => ({ id: s.id, name: s.name, cats: s.cats, tags: s.tags, calc: s.calc, reasons: s.reasons, ...(s.undecoded.length ? { undecoded: s.undecoded } : {}), ...(s.defense ? { defense: s.defense } : {}), ...(s.sub ? { sub: s.sub } : {}), conditions: s.conditions, ...(s.userNote ? { userNote: s.userNote } : {}), kinds: s.procs.map(p => p.kind), triggers: s.triggers })) }) + '\n');
const count = new Map(); for (const s of out) for (const c of s.cats) count.set(c, (count.get(c) || 0) + 1);
console.log([...count].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(' · '));
const calc = new Map(); for (const s of out) calc.set(s.calc, (calc.get(s.calc) || 0) + 1); console.log([...calc].map(([c, n]) => `${c} ${n}`).join(' · '));
console.log('multi-category', out.filter(s => s.cats.length > 1).length, 'no conditions', out.filter(s => !s.tags.length).length, 'undecoded', out.filter(s => s.undecoded.length).length);

// ---- the preview page (dist/skill-classes-preview.html): one tab per 大类 done so far, each with its 小类 as sub-tabs;
// every sub-tab lists the skills without conditions first, then those with conditions, each by bonus (user's rule).
// “也在” lists every other place the skill is in: the other 小类 of the same 大类 and every other 大类 (done or not).
{
  const CAT_ORDER = ['基础属性', '造成伤害', '暴击', '特攻', '伤害上限', 'Break值', '受到伤害', '回复', '异常', '特技充能·必杀', '魔法·咏唱', '移动与行动', '装备·种族', '反击', '信仰', '金钱·经验', '待确认'];
  const STATS = ['HP', 'MP', '攻击力', '法强', '防御力', '魔抗', '属性耐性'];
  const bonusText = e => {
    if (e.basis === '转换') return '由其他属性转换';
    const n = v => Number((Math.abs(v) / 100).toFixed(2));
    const parts = [];
    if (e.rate) parts.push(`${e.rate > 0 ? '+' : '−'}${n(e.rate)}%`);
    if (e.add) parts.push(`${e.add > 0 ? '+' : '−'}${Math.abs(e.add)}`);
    const t = parts.join('、') || '（数值读不出）';
    return `${e.max ? '最多' : ''}${e.basis === '装备' ? '装备的' : ''}${t}`;
  };
  const order = e => [{ 角色: 0, 装备: 1, 转换: 2 }[e.basis] ?? 3, -(e.rate || 0), -(e.add || 0)];
  const cmp = (a, b) => { const x = order(a.e), y = order(b.e); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return a.id - b.id; };
  // the 小类 of each 大类 that has a preview; the other 大类 are listed by name only
  const OTHER_WAYS = ['追加伤害', '追加伤害增幅', '无视防御', '魔转相'];
  const damageSubs = s => [...new Set((s.sub?.造成伤害 || []).map(e => (e.way === '伤害加成' ? '伤害加成' : '其他方式')))].sort().reverse();
  const subsOf = s => ({ 基础属性: (s.sub?.基础属性 || []).map(e => e.stat), 造成伤害: damageSubs(s) });
  const also = (s, cat, sub) => {
    const subs = subsOf(s), parts = [];
    for (const c of [...CAT_ORDER, ...s.cats.filter(c => !CAT_ORDER.includes(c))]) {
      if (!s.cats.includes(c)) continue;
      const rest = (subs[c] || []).filter(x => !(c === cat && x === sub));
      if (c === cat) { if (rest.length) parts.push(`${c}（${rest.join('、')}）`); }
      else parts.push(rest.length ? `${c}（${rest.join('、')}）` : c);
    }
    return parts;
  };
  const groups = Object.fromEntries(STATS.map(st => [st, []]));
  for (const s of out) for (const e of s.sub?.基础属性 || []) groups[e.stat].push({ s, e });
  const pages = [{
    cat: '基础属性', total: out.filter(s => s.cats.includes('基础属性')).length,
    subs: STATS.map(st => ({ name: st, blocks: [false, true].map(c => groups[st].filter(x => x.e.cond === c).sort((a, b) => cmp({ e: a.e, id: a.s.id }, { e: b.e, id: b.s.id })).map(x => ({ id: x.s.id, entries: [{ text: bonusText(x.e), apply: [], tags: x.e.tags }], also: also(x.s, '基础属性', st) }))) })),
  }];
  // 造成伤害: 伤害加成 is filtered in the page by element × attack type (user's choice: two rows combined; an entry with
  // no element / attack-type restriction matches every button); 其他方式 = extra hits, extra-hit boost, DEF ignore, 魔转相
  const dmg = out.filter(s => s.sub?.造成伤害);
  const entry = e => ({ text: e.text, rate: e.rate, apply: e.apply, tags: e.tags, cond: e.cond, els: e.els, types: e.types });
  const otherBlocks = [false, true].map(c => dmg.map(s => ({ s, es: s.sub.造成伤害.filter(e => e.way !== '伤害加成' && e.cond === c) })).filter(x => x.es.length)
    .map(x => ({ x, es: x.es.sort((a, b) => OTHER_WAYS.indexOf(a.way) - OTHER_WAYS.indexOf(b.way) || b.rate - a.rate) }))
    .sort((a, b) => OTHER_WAYS.indexOf(a.es[0].way) - OTHER_WAYS.indexOf(b.es[0].way) || b.es[0].rate - a.es[0].rate || a.x.s.id - b.x.s.id)
    .map(({ x, es }) => ({ id: x.s.id, entries: es.map(entry), also: also(x.s, '造成伤害', '其他方式') })));
  pages.push({
    cat: '造成伤害', total: out.filter(s => s.cats.includes('造成伤害')).length,
    subs: [
      { name: '伤害加成', filter: true, skills: dmg.filter(s => s.sub.造成伤害.some(e => e.way === '伤害加成')).map(s => ({ id: s.id, entries: s.sub.造成伤害.filter(e => e.way === '伤害加成').map(entry), also: also(s, '造成伤害', '伤害加成') })) },
      { name: '其他方式', blocks: otherBlocks },
    ],
  });
  // nothing left out: every skill of a previewed 大类 is in at least one of its 小类
  for (const pg of pages) {
    const shown = new Set(pg.subs.flatMap(x => (x.skills || x.blocks.flat()).map(r => r.id)));
    const missing = out.filter(s => s.cats.includes(pg.cat) && !shown.has(s.id));
    if (missing.length) throw new Error(`${pg.cat}: not in any 小类: ${missing.map(s => s.name).join('、')}`);
  }
  fs.writeFileSync(new URL('../dist/skill-classes-preview-data.js', import.meta.url), `// Generated by scripts/build-skill-classes.mjs from the classification draft (docs/skill-classes-draft.json)\nwindow.SKILL_CLASS_PREVIEW=${JSON.stringify({ pages })};\n`);
}
