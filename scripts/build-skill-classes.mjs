// DRAFT (2026-09-29, waiting for the user's review): classifies every skill on the game-data skill table from the
// game data — 大类 (what it changes) from each of its processes' kind (ProcessMst.NAME, one skill can have several
// joined by “@” in PassiveSkillMst.PROCESS_INFO) and the game's own effect text; 条件标签 (element, move, weapon,
// race, HP …) from the game's condition data (scripts/skill-conditions.mjs); and whether the damage calculator can
// compute it. Writes
// docs/skill-classes-draft.json. The user reviews it as an Excel and the approved classes replace the table's tabs.
import fs from 'node:fs';
import { zhName } from '../dist/engine/gloss.mjs';
import { decodeProcess, tagsOf } from './skill-conditions.mjs';
import { categoriesOf, kindCategory, processCategory, onEnemies, raisesAttack, scriptBody, statEntries } from './skill-categories.mjs';
import { describe, subOf, WAYS } from './skill-entries.mjs';
import { ELEM, RACE } from './skill-conditions.mjs';
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
// (not: a resistance given to the enemies, 魔断之楔; a condition on the target's resistance, 剑雷's 対象属性耐性条件)
const DEFENSIVE = p => !onEnemies(p) && (/被ダメージ(?!増減付与)|被追加ダメージ|被命中|被弾|ガード|バリア|耐性(?!条件)|相手.*与ダメージ減少/.test(p.kind) || /被ダメージ|を受けた/.test(p.trigger));
// a process fired by using a skill (its trigger: ActValid… / StandbyValid…) whose effect comes after it — a timed buff
// not tied to that skill's own hits (星眼 / 魔法连锁 buff the used skill's PUID: those are tied), a charge, a heal: the attack
// types its trigger reads say when it fires (发动超必杀时), not what the effect applies to (user 2026-09-30, item 22:
// 循环 is for any move, 我想成为一个完美的存在's buff is 物理伤害)
const condFn = new Map(core.ProcessCondMst.rows.map(r => [r[0], r[3] || '']));
const afterUse = p => {
  const fn = condFn.get(proc.get(p.pid)?.[pc.PROCESS_COND]) || '', body = scriptBody(p.pid);
  return /^(ActValid|StandbyValid)/.test(fn) && !/AndValidAttackSkill/.test(fn) && /SetBuff|EditSCT|EditSingleSCT|:Heal\(/.test(body) && !/PUID|Bullet:/.test(body);
};
const typeWords = ts => { const t = new Set(ts), w = []; if (t.has(9) && t.has(1)) w.push('物理'); else { if (t.has(9)) w.push('普攻'); if (t.has(1)) w.push('特技'); } for (const [c, n] of [[2, '魔法'], [5, '超必杀'], [15, '反击']]) if (t.has(c)) w.push(n); return w.join('／'); };
// a stat raised only on the hit being made (BulletFunc:EditINT on an attack trigger, 海滨洞察: 冰属性攻击时魔力+15%) applies to
// that hit's element / attack type, as a damage bonus does
const onOwnHit = (p, defensive) => !defensive && /Bullet:Edit(STR|INT|DEF|MND)/.test(scriptBody(p.pid));
// entries that differ in one of element / attack type only are one entry (exact: the game applies each); then what
// each entry applies to, as chips: 火属性… and 物理 (普攻＋特技) / 普攻 / 特技 / 魔法 / 超必杀 / 反击 …
function finishEntries(list) {
  const key = (e, skip) => JSON.stringify([e.way, e.rate, e.add, e.max, e.text, e.tags, skip === 'races' ? null : e.races, skip === 'els' ? null : e.els, skip === 'types' ? null : e.types]);
  for (let merged = true; merged;) {
    merged = false;
    for (const dim of ['els', 'types', 'races']) for (let a = 0; a < list.length && !merged; a++) for (let b = a + 1; b < list.length && !merged; b++) {
      const x = list[a], y = list[b];
      // identical entries are two bonuses that both apply: only entries differing in this one dimension merge
      if (key(x, dim) !== key(y, dim) || !x[dim] || !y[dim] || JSON.stringify(x[dim]) === JSON.stringify(y[dim])) continue;
      x[dim] = [...new Set([...x[dim], ...y[dim]])].sort((p, q) => p - q); list.splice(b, 1); merged = true;
    }
  }
  for (const e of list) {
    const t = new Set(e.types || []), names = [];
    if (t.has(9) && t.has(1)) names.push('物理'); else { if (t.has(9)) names.push('普攻'); if (t.has(1)) names.push('特技'); }
    for (const [c, n] of [[2, '魔法'], [5, '超必杀'], [15, '反击'], [3, '魔法阵'], [4, '召唤']]) if (t.has(c)) names.push(n);
    e.apply = [...(e.els || []).map(x => `${{ 0: '无', 1: '火', 2: '冰', 3: '树', 4: '雷', 5: '光', 6: '暗' }[x]}属性`), ...names];
  }
  return list;
}
// no attack-type parameter (the buff processes PB_…, 指定特技…): the process name says it right before 与ダメージ /
// ダメージ上限
const NAMED_TYPE = /(物理|魔法|特技|超必殺技|通常攻撃)(与ダメージ|ダメージ上限)/;
const TYPE_OF_NAME = { 物理: [1, 9], 魔法: [2], 特技: [1], 超必殺技: [5], 通常攻撃: [9] };
const out = [];
for (const s of skills) {
  // 大类 only from the game data (scripts/skill-categories.mjs): process names, operation codes, script parameters, buffs
  const cats = categoriesOf(s.procs, DEFENSIVE);
  // 条件标签 from the game's condition data (scripts/skill-conditions.mjs), not from the description
  const conds = s.procs.map(p => {
    const d = decodeProcess(p.pid, p.params);
    if (afterUse(p) && d.triggerTypes.length) { d.skillTypes = d.ownTypes; d.other.push(`发动${typeWords(d.triggerTypes)}时`); }
    return { kind: p.kind, defensive: DEFENSIVE(p), d, tags: tagsOf(d, DEFENSIVE(p)) };
  });
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
  const extraTags = i => {
    const p = s.procs[i], names = procDocs.get(`process${p.pid}`)?.params || [], vals = String(p.params ?? '').split(':').map(Number);
    const tags = [];
    if (p.prob < 10000) tags.push(`概率发动（${p.prob / 100}%）`);
    const d = vals[names.indexOf('継続時間')];
    if (names.includes('継続時間') && d > 0) tags.push(/Wave開始/.test(p.trigger) ? `开局${Math.round(d / 60)}秒内` : `${Math.round(d / 60)}秒内（触发后）`);
    return tags;
  };
  const entryTags = i => [...conds[i].tags.filter(t => !/^追加|^可装备|^受·|^特定效果类别$/.test(t)), ...extraTags(i)];
  // a process that scales between a start and a full point (効果最小… / 効果最大… / 適正…) gives its value at full: “最多”
  const scales = i => (procDocs.get(`process${s.procs[i].pid}`)?.params || []).some(n => /^効果(最小|最大)|^適正/.test(n || ''));
  if (cats.has('基础属性')) {
    const byStat = new Map();
    for (const e of statEntries(s.procs)) {
      const tags = entryTags(e.proc), c = conds[e.proc];
      const hit = onOwnHit(s.procs[e.proc], c.defensive) ? { els: c.d.elements.length ? [...new Set(c.d.elements)].sort() : null, types: c.d.skillTypes.length ? [...new Set(c.d.skillTypes)].sort((a, b) => a - b) : null } : {};
      const entry = { stat: e.stat, rate: e.rate, add: e.add, basis: e.basis, ...(e.max || scales(e.proc) ? { max: true } : {}), ...(hit.els ? { els: hit.els } : {}), ...(hit.types ? { types: hit.types } : {}), cond: tags.length > 0, tags: [...new Set(tags)] };
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
      if (processCategory(p) !== '造成伤害' || /DOTダメージ/.test(p.kind)) return;
      const d = conds[i].d, names = procDocs.get(`process${p.pid}`)?.params || [], vals = String(p.params ?? '').split(':').map(v => (v === '' ? 0 : Number(v)));
      const v = n => vals[names.indexOf(n)];
      // a damage bonus's 対象属性 is the element it applies to; an extra hit's element is only that hit's own
      const els = [...new Set([...(d.elements || []), ...(/与ダメージ/.test(p.kind) ? d.aboutElements || [] : [])])].sort();
      const tags = entryTags(i).filter(t => !APPLY.test(t));
      const e = { way: '伤害加成', els: els.length ? els : null, types: d.skillTypes?.length ? [...new Set(d.skillTypes)].sort((a, b) => a - b) : null, rate: 0, cond: tags.length > 0, tags };
      const pct = x => `${Number((x / 100).toFixed(2))}%`;
      if (/与ダメージ/.test(p.kind)) {
        // no attack-type parameter (the buff processes PB_…): the process name says it right before 与ダメージ
        const named = p.kind.match(NAMED_TYPE);
        if (!e.types && named) e.types = TYPE_OF_NAME[named[1]];
        const j = names.findIndex(n => /^ダメージ倍率(補正|最大補正)?$/.test(n || ''));
        if (j >= 0) { e.rate = vals[j]; if (/最大/.test(names[j]) || scales(i)) e.max = true; }
        e.text = j >= 0 ? `${e.max ? '最多' : ''}${e.rate < 0 ? '−' : '+'}${pct(Math.abs(e.rate))}` : '（数值读不出）';
      } else if (/被ダメージ増減付与/.test(p.kind)) {
        // a debuff put on the target (腐坏之牙): the enemy takes more damage; the attack type is in the name
        e.way = '敌人受到伤害增加'; e.rate = vals[names.findIndex(n => /^ダメージ倍率/.test(n || ''))] || 0; e.text = `敌人受到的伤害 ${e.rate < 0 ? '−' : '+'}${pct(Math.abs(e.rate))}`;
        const named = p.kind.match(/(物理|魔法)被ダメージ/); e.els = null; e.types = named ? TYPE_OF_NAME[named[1]] : null;
      } else if (/追加ダメージ威力/.test(p.kind)) { e.way = '追加伤害增幅'; e.rate = v('追加ダメージ倍率MIN倍率'); e.text = `追加伤害 +${pct(e.rate)}`; }
      else if (/追加ダメージ2種/.test(p.kind)) { e.way = '追加伤害'; e.rate = v('追加ダメージ1割合MIN'); e.text = `追加 ${pct(v('追加ダメージ1割合MIN'))}～${pct(v('追加ダメージ1割合MAX'))}（${pct(v('追加ダメージ1発生確率'))}）或 ${pct(v('追加ダメージ2割合MIN'))}～${pct(v('追加ダメージ2割合MAX'))}`; }
      else if (/追加ダメージ/.test(p.kind)) { e.way = '追加伤害'; const [, n, lo, hi] = vals; e.rate = lo; e.text = `追加${n > 1 ? ` ${n} 次` : ''} ${pct(lo)}～${pct(hi)}`; }  // built-in 801: element, count, MIN, MAX
      else if (/貫通/.test(p.kind)) { e.way = '无视防御'; const r = names.length ? v('DEF倍率') : vals[1]; e.rate = -r; e.text = `敌方防御 −${pct(-r)}`; } // built-in 301: DEF加算値, DEF倍率
      else if (/魔転相\(STR\)/.test(p.kind)) { e.way = '魔转相'; e.rate = v('攻撃力変換率'); e.text = `攻击力、法强各加攻击力的 ${pct(e.rate)}`; }
      else if (/魔転相/.test(p.kind)) { e.way = '魔转相'; e.rate = v('魔力変換率'); e.text = `攻击力、法强各加魔力的 ${pct(e.rate)}`; }
      else if (onEnemies(p) && /属性耐性/.test(p.kind)) {
        // every enemy's element resistance (属性ID 0 = ELEMENT_NONE: the game's 所有属性耐性 buff) for a while: our element damage
        const el = v('属性ID'), n = v('増減値');
        e.way = '敌人属性耐性降低'; e.rate = -n; e.els = el ? [el] : null; e.text = `敌人${el ? ELEM[el] : '全'}属性耐性 ${n < 0 ? '−' : '+'}${Math.abs(n)}`;
      }
      else throw new Error(`造成伤害: unknown ${p.kind} (${s.name})`);
      list.push(e);
    });
    finishEntries(list);
    if (list.length) (sub ||= {}).造成伤害 = list;
  }
  // 伤害上限 entries, one per cap process: element × attack type as for 造成伤害; the value is ダメージ上限加算(最大)値
  // (flat) and ダメージ上限倍率(最大)補正 (1/100 %); a value kept in a counter (一天真刃) cannot be read
  if (cats.has('伤害上限')) {
    const list = [];
    s.procs.forEach((p, i) => {
      if (processCategory(p) !== '伤害上限') return;
      const d = conds[i].d, names = procDocs.get(`process${p.pid}`)?.params || [], vals = String(p.params ?? '').split(':').map(v => (v === '' ? 0 : Number(v)));
      const els = [...new Set([...(d.elements || []), ...(d.aboutElements || [])])].sort();
      const tags = entryTags(i).filter(t => !APPLY.test(t));
      const e = { way: '伤害上限', els: els.length ? els : null, types: d.skillTypes?.length ? [...new Set(d.skillTypes)].sort((a, b) => a - b) : null, add: 0, rate: 0, cond: tags.length > 0, tags };
      const named = p.kind.match(NAMED_TYPE);
      if (!e.types && named) e.types = TYPE_OF_NAME[named[1]];
      const ja = names.findIndex(n => /^ダメージ上限加算(最大)?値$/.test(n || '')), jr = names.findIndex(n => /^ダメージ上限倍率(最大)?補正$/.test(n || ''));
      if (ja >= 0) e.add = vals[ja];
      if (jr >= 0) e.rate = vals[jr];
      e.max = [ja, jr].some(j => j >= 0 && /最大/.test(names[j])) || scales(i);
      const parts = [];
      if (e.add) parts.push(`${e.add < 0 ? '−' : '+'}${Math.abs(e.add)}`);
      if (e.rate) parts.push(`${e.rate < 0 ? '−' : '+'}${Number((Math.abs(e.rate) / 100).toFixed(2))}%`);
      e.text = parts.length ? `${e.max ? '最多' : ''}${parts.join('、')}` : '（数值读不出）';
      list.push(e);
    });
    if (list.length) (sub ||= {}).伤害上限 = finishEntries(list);
  }
  Object.assign(s, { _d: conds.map(c => c.d), _tags: conds.map(c => c.tags), _extra: s.procs.map((p, i) => extraTags(i)), _defensive: conds.map(c => c.defensive) });
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
// ---- 小类 entries of the other 大类 (scripts/skill-entries.mjs), after the user's decisions (反击 / 信仰 are theirs): one
// per process of that 大类; a skill that is in a 大类 without such a process (the user's classes, a buff, a one-off
// script) gets its own processes except the bookkeeping ones (…情報付与)
const GENERIC = ['特攻', '暴击', 'Break值', '反击', '受到伤害', '回复', '装备·种族', '异常', '特技充能·必杀', '移动与行动', '魔法·咏唱', '信仰', '金钱·经验', '待确认'];
const ELEM_TAG = /^(受·)?((火|冰|树|雷|光|暗|无)属性|物理|魔法|普攻|特技|超必杀|反击|魔法阵|召唤|圣物技能|被动)$/;
// what an effect of these 大类 applies to is an element / attack type; elsewhere an element code is not what it is about
const WITH_ELEMENT = ['特攻', '暴击', 'Break值', '反击', '受到伤害', '信仰'];
// being hit is how these work, not a condition
const WHEN_HIT = ['受到伤害', '免疫暴击', '受到的破防值', '格挡', '回避', '受到的追击伤害', '不受防御贯通', '免疫异常', '反击', '回复效果', '敌人造成的伤害'];
const RACE_NAMES = Object.values(RACE).join('|');
for (const s of out) for (const cat of s.cats.filter(c => GENERIC.includes(c))) {
  let idx = s.procs.map((p, i) => i).filter(i => processCategory(s.procs[i]) === cat);
  if (!idx.length) idx = s.procs.map((p, i) => i).filter(i => !/情報付与$/.test(s.procs[i].kind));
  if (!idx.length) idx = s.procs.map((p, i) => i);
  const list = idx.map(i => {
    const p = s.procs[i], row = proc.get(p.pid), d = s._d[i] || {};
    const names = procDocs.get(`process${p.pid}`)?.params || [], vals = String(p.params ?? '').split(':').map(v => (v === '' ? 0 : Number(v)));
    const desc = describe(p, { names, vals, ope: row?.[pc.OPE_INFO], script: row?.[pc.USE_SCRIPT], beh: String(row?.[pc.PARAM_BEHAVIOR] ?? '').split(':').map(Number) })
      || { way: '其他', text: s.reasons[cat]?.includes('所加的增益') ? '（数值在所加的增益里，读不出）' : '（见效果说明）', value: 0 };
    // what it applies to: the element / attack type (for damage taken: of the attack that hits), and for 特攻 the race
    const defensive = s._defensive[i];
    let els = WITH_ELEMENT.includes(cat) ? [...new Set([...(d.elements || []), ...(defensive || /クリティカル|魔法キラー/.test(p.kind) ? d.aboutElements || [] : [])])].sort() : [];
    let types = d.skillTypes?.length ? [...new Set(d.skillTypes)].sort((a, b) => a - b) : null;
    if (types && [1, 2, 5, 9].every(t => types.includes(t))) types = null;                  // every kind of skill
    const named = p.kind.match(/(物理|魔法|特技|超必殺技|通常攻撃)(被ダメージ|クリティカル|与ダメージ)/);
    if (!types && named) types = TYPE_OF_NAME[named[1]];
    if (row?.[pc.USE_SCRIPT] !== 1 && row?.[pc.OPE_INFO] === 800) types = [2];                 // 属性魔法クリティカル: magic of that element
    const races = cat === '特攻' && d.races?.length ? [...new Set(d.races)].sort((a, b) => a - b) : null;
    // conditions: the process's own tags, less what the entry applies to; damage taken from a race / BOSS reads 来自…
    let tags = (s._tags[i] || []).filter(t => !ELEM_TAG.test(t) && !/^追加|^可装备/.test(t) && !(races && new RegExp(`^对(${RACE_NAMES})$`).test(t)))
      .map(t => t.replace(new RegExp(`^受·(${RACE_NAMES})$`), '来自$1类型的敌人').replace(/^受·(BOSS|普通敌人)$/, '来自$1'));
    if (WHEN_HIT.includes(desc.way) || /^受到/.test(desc.text)) tags = tags.filter(t => t !== '受到攻击时');
    if (['异常耐性', '赋予异常', '恢复速度'].includes(desc.way)) tags = tags.filter(t => !/^异常:/.test(t));   // the ailment is the effect
    tags = tags.filter(t => t !== '特定效果类别');
    // on a defensive process the trigger is the enemy's: hit on a weakness / by a 特攻 / by a critical
    if (defensive) tags = tags.map(t => ({ 打弱点属性时: '受到弱点属性攻击时', 特攻发动时: '受到特攻时', 暴击时: '受到暴击时' }[t] || t));
    if (desc.way === '反击') types = null;                     // the counter's own attack types: not what it applies to
    if (cat === '受到伤害' && desc.way === '伤害') { desc.way = '受到伤害'; desc.text = desc.text.replace(/^伤害/, '受到伤害'); desc.value = -desc.value; }
    tags = [...new Set([...tags, ...s._extra[i]])];
    // a process that scales between a start and a full point gives its value at full (最多), as for 造成伤害
    if ((names.some(n => /^効果(最小|最大)|^適正/.test(n || '')) || names.some(n => /最大(補正|値)$/.test(n || ''))) && / [+−]/.test(desc.text)) desc.text = desc.text.replace(/ ([+−])/, ' 最多$1');
    const sub = ['特攻', '暴击', 'Break值', '反击'].includes(cat) ? cat : subOf(cat, p.kind);
    return { way: desc.way, sub, text: desc.text, value: desc.value, els: els.length ? els : null, types, races, cond: tags.length > 0, tags };
  });
  finishEntries(list);
  for (const e of list) if (e.races) e.apply = [...e.races.map(r => `对${RACE[r]}`), ...e.apply];
  (s.sub ||= {})[cat] = list;
}
fs.writeFileSync(new URL('../docs/skill-classes-draft.json', import.meta.url), JSON.stringify({ note: '技能分类初稿（自动）：每个技能的大类（效果种类＋游戏效果说明）、条件标签、计算器能否算；等用户核对后替换技能表分页', categories: user.categories, skills: out.map(s => ({ id: s.id, name: s.name, cats: s.cats, tags: s.tags, calc: s.calc, reasons: s.reasons, ...(s.undecoded.length ? { undecoded: s.undecoded } : {}), ...(s.defense ? { defense: s.defense } : {}), ...(s.sub ? { sub: s.sub } : {}), conditions: s.conditions, ...(s.userNote ? { userNote: s.userNote } : {}), kinds: s.procs.map(p => p.kind), triggers: s.triggers })) }) + '\n');
const count = new Map(); for (const s of out) for (const c of s.cats) count.set(c, (count.get(c) || 0) + 1);
console.log([...count].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(' · '));
const calc = new Map(); for (const s of out) calc.set(s.calc, (calc.get(s.calc) || 0) + 1); console.log([...calc].map(([c, n]) => `${c} ${n}`).join(' · '));
console.log('multi-category', out.filter(s => s.cats.length > 1).length, 'no conditions', out.filter(s => !s.tags.length).length, 'undecoded', out.filter(s => s.undecoded.length).length);

// ---- the preview page (dist/skill-classes-preview.html): one tab per 大类 (user 2026-09-29: 基础属性 gathers the stats,
// 伤害上限 on its own, 特攻・暴击・Break值・反击 are 特殊伤害造成, 信仰・金钱·经验・待确认 are 杂项), each with its 小类 as sub-tabs; every sub-tab lists the
// skills without conditions first, then those with conditions, each by bonus (user's rule). A damage-like 小类 is
// filtered in the page by two rows combined (element / race × attack type; an entry without that restriction
// matches every button). “也在” lists every other place the skill is in.
{
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
  const OTHER_WAYS = ['追加伤害', '追加伤害增幅', '无视防御', '魔转相', '敌人受到伤害增加', '敌人属性耐性降低'];
  const SPECIAL = ['特攻', '暴击', 'Break值', '反击'];
  const GENERIC_PAGES = ['受到伤害', '回复', '异常', '特技充能·必杀', '魔法·咏唱', '移动与行动', '装备·种族'];
  const MISC = ['信仰', '金钱·经验', '待确认'];          // user 2026-09-29: these three are one page, 杂项
  const SUB_ORDER = { 受到伤害: ['减伤', '其他方式'], 回复: ['HP回复', 'MP回复', '复活', '回复效果'], 异常: ['异常耐性', '赋予异常', '恢复速度'], '特技充能·必杀': ['充能速度', '立即充能', '特技次数', '超必杀槽'], '魔法·咏唱': ['咏唱', '消耗MP'], 移动与行动: ['移动速度', '被瞄准'], 装备·种族: ['追加类型', '可装备', '二刀流'] };
  // where each skill is: [page, 小类] (a page with one 小类 is named alone)
  const places = s => {
    const out = [];
    for (const e of s.sub?.基础属性 || []) out.push(['基础属性', e.stat]);
    for (const x of [...new Set((s.sub?.造成伤害 || []).map(e => (e.way === '伤害加成' ? '伤害加成' : '其他方式')))].sort().reverse()) out.push(['造成伤害', x]);
    if (s.cats.includes('伤害上限')) out.push(['伤害上限', '伤害上限']);
    for (const c of SPECIAL) if (s.cats.includes(c)) out.push(['特殊伤害造成', c]);
    for (const c of MISC) if (s.cats.includes(c)) out.push(['杂项', c]);
    for (const c of GENERIC_PAGES) if (s.cats.includes(c)) for (const x of (SUB_ORDER[c] || [c]).filter(x => (s.sub?.[c] || []).some(e => e.sub === x))) out.push([c, x]);
    return out;
  };
  const multi = new Set(['基础属性', '造成伤害', '特殊伤害造成', '杂项', ...Object.keys(SUB_ORDER)]);
  const also = (s, page, sub) => {
    const byPage = new Map();
    for (const [pg, x] of places(s)) if (!(pg === page && x === sub)) { if (!byPage.has(pg)) byPage.set(pg, []); byPage.get(pg).push(x); }
    return [...byPage].map(([pg, xs]) => (multi.has(pg) ? `${pg}（${xs.join('、')}）` : pg));
  };
  const WAY_RANK = w => WAYS.length - Math.max(0, WAYS.indexOf(w));
  const entry = e => ({ text: e.text, v: e.v ?? (e.way === '伤害上限' ? e.add * 100 + e.rate : e.way && WAYS.includes(e.way) ? WAY_RANK(e.way) * 1e7 + Math.max(-4e6, Math.min(4e6, e.value || 0)) : e.rate), apply: e.apply, tags: e.tags, cond: e.cond, els: e.els, types: e.types, ...(e.races ? { races: e.races } : {}) });
  // plain 小类: rows (one per skill, its entries in that 小类), without conditions then with, by the best entry
  const blocksOf = (skills, pick, page, sub) => [false, true].map(c => skills.map(s => ({ s, es: pick(s).filter(e => e.cond === c).map(entry).sort((a, b) => b.v - a.v) })).filter(x => x.es.length)
    .sort((a, b) => b.es[0].v - a.es[0].v || a.s.id - b.s.id).map(x => ({ id: x.s.id, entries: x.es, also: also(x.s, page, sub) })));
  const filterOf = (skills, pick, page, sub) => skills.map(s => ({ s, es: pick(s) })).filter(x => x.es.length).map(x => ({ id: x.s.id, entries: x.es.map(entry), also: also(x.s, page, sub) }));
  const inCat = c => out.filter(s => s.cats.includes(c));
  const groups = Object.fromEntries(STATS.map(st => [st, []]));
  for (const s of out) for (const e of s.sub?.基础属性 || []) groups[e.stat].push({ s, e });
  const pages = [{
    cat: '基础属性', total: inCat('基础属性').length,
    subs: STATS.map(st => ({ name: st, blocks: [false, true].map(c => groups[st].filter(x => x.e.cond === c).sort((a, b) => cmp({ e: a.e, id: a.s.id }, { e: b.e, id: b.s.id })).map(x => ({ id: x.s.id, entries: [{ text: bonusText(x.e), apply: [], tags: x.e.tags }], also: also(x.s, '基础属性', st) }))) })),
  }];
  const dmg = inCat('造成伤害').filter(s => s.sub?.造成伤害);
  const otherBlocks = [false, true].map(c => dmg.map(s => ({ s, es: s.sub.造成伤害.filter(e => e.way !== '伤害加成' && e.cond === c) })).filter(x => x.es.length)
    .map(x => ({ x, es: x.es.sort((a, b) => OTHER_WAYS.indexOf(a.way) - OTHER_WAYS.indexOf(b.way) || b.rate - a.rate) }))
    .sort((a, b) => OTHER_WAYS.indexOf(a.es[0].way) - OTHER_WAYS.indexOf(b.es[0].way) || b.es[0].rate - a.es[0].rate || a.x.s.id - b.x.s.id)
    .map(({ x, es }) => ({ id: x.s.id, entries: es.map(entry), also: also(x.s, '造成伤害', '其他方式') })));
  pages.push({ cat: '造成伤害', total: inCat('造成伤害').length, subs: [
    { name: '伤害加成', filter: ['el', 'type'], skills: filterOf(dmg, s => s.sub.造成伤害.filter(e => e.way === '伤害加成'), '造成伤害', '伤害加成') },
    { name: '其他方式', blocks: otherBlocks },
  ] });
  pages.push({ cat: '伤害上限', total: inCat('伤害上限').length, subs: [{ name: '伤害上限', filter: ['el', 'type'], skills: filterOf(inCat('伤害上限').filter(s => s.sub?.伤害上限), s => s.sub.伤害上限, '伤害上限', '伤害上限') }] });
  // 特殊伤害造成 (user: 特攻・暴击・Break值・反击)
  pages.push({ cat: '特殊伤害造成', total: out.filter(s => SPECIAL.some(c => s.cats.includes(c))).length, members: SPECIAL, subs: [
    { name: '特攻', filter: ['race', 'type'], skills: filterOf(inCat('特攻'), s => s.sub?.特攻 || [], '特殊伤害造成', '特攻') },
    { name: '暴击', filter: ['el', 'type'], skills: filterOf(inCat('暴击'), s => s.sub?.暴击 || [], '特殊伤害造成', '暴击') },
    { name: 'Break值', blocks: blocksOf(inCat('Break值'), s => s.sub?.Break值 || [], '特殊伤害造成', 'Break值') },
    { name: '反击', blocks: blocksOf(inCat('反击'), s => s.sub?.反击 || [], '特殊伤害造成', '反击') },
  ] });
  for (const c of GENERIC_PAGES) {
    const names = SUB_ORDER[c] || [c];
    pages.push({ cat: c, total: inCat(c).length, subs: names.map(x => (c === '受到伤害' && x === '减伤'
      ? { name: x, filter: ['el', 'type'], labels: ['受到的属性', '受到的攻击'], skills: filterOf(inCat(c), s => (s.sub?.[c] || []).filter(e => e.sub === x), c, x) }
      : { name: x, blocks: blocksOf(inCat(c), s => (s.sub?.[c] || []).filter(e => e.sub === x), c, x) })) });
  }
  pages.push({ cat: '杂项', total: out.filter(s => MISC.some(c => s.cats.includes(c))).length, members: MISC,
    subs: MISC.map(c => ({ name: c, blocks: blocksOf(inCat(c), s => s.sub?.[c] || [], '杂项', c) })) });
  // nothing left out: every skill of every 大类 is in at least one 小类 of its page
  const covered = new Set(pages.flatMap(pg => pg.members || [pg.cat]));
  const allCats = new Set(out.flatMap(s => s.cats));
  for (const c of allCats) if (!covered.has(c)) throw new Error(`大类 ${c} has no page`);
  for (const pg of pages) {
    const shown = new Set(pg.subs.flatMap(x => (x.skills || x.blocks.flat()).map(r => r.id)));
    const missing = out.filter(s => (pg.members || [pg.cat]).some(c => s.cats.includes(c)) && !shown.has(s.id));
    if (missing.length) throw new Error(`${pg.cat}: not in any 小类: ${missing.map(s => s.name).join('、')}`);
  }
  fs.writeFileSync(new URL('../dist/skill-classes-preview-data.js', import.meta.url), `// Generated by scripts/build-skill-classes.mjs from the classification draft (docs/skill-classes-draft.json)\nwindow.SKILL_CLASS_PREVIEW=${JSON.stringify({ pages })};\n`);
}
