// Calculator-facing entry point of the battle-script sandbox: builds the attacker and target from the
// calculator's inputs, replays the game's setup triggers, casts one skill and reports every hit with
// normal/critical ranges, the damage cap, the attack stat layers and which passives fired.
import { Battle, K, parseInts } from './battle.mjs?v=20260930-1214';
import { bareStats, crestStats, equipmentStats, exclusiveEquipment, statCodes } from './panel.mjs?v=20260930-1214';
import { zhName, zhCondition } from './gloss.mjs?v=20260930-1214';
export { bareStats, crestStats, equipmentStats, exclusiveEquipment, maxLevel, maxAwake, growthRate, KNOWN_GROWTH_RATE } from './panel.mjs?v=20260930-1214';

export const TRIGGER_LABELS = { 1: '状态计算', 10: 'Wave开始', 11: 'Wave结束', 12: 'Wave中每帧', 16: '咏唱前', 17: '技能结束时', 18: '技能发动前', 19: '弹道生成前', 20: '弹道处理', 21: '命中时', 22: '被命中时', 23: '伤害计算时', 24: '被伤害计算时', 25: '命中后', 26: '被命中后', 27: '伤害计算后', 28: '被伤害计算后', 29: '命中后（前）', 30: '被命中后（前）', 35: '分割HP归零', 36: '造成致死伤害', 37: '受到致死伤害', 40: 'HP变化', 41: 'SCT变化', 42: 'MP变化', 43: 'STR变化', 44: 'DEF变化', 45: 'INT变化', 46: 'MND变化', 50: '状态异常变化', 51: '角色类型变化', 52: '气绝/Break变化', 53: '咏唱等级变化', 54: 'Buff变化', 55: '必杀量表变化', 59: '单位状态变化', 60: 'Buff持续中', 61: '施加Buff前', 62: '被施加Buff前', 65: '生存人数变化', 66: '地形效果变化', 68: 'Boss Break变化', 69: '生存人数变化2', 70: '按间隔', 71: '按间隔（条件）', 72: '发动方抽选时', 73: '发动方效果前', 74: '发动方效果后', 75: '目标抽选时', 76: '目标效果前', 77: '目标效果后', 78: '施加异常前', 79: '被施加异常前', 80: '获得Zel', 81: '获得宝箱', 92: '流程内触发', 93: '流程内触发（参数）', 94: '背景变化', 95: '时间轴条件', 96: '复活时', 97: '复活对象时', 98: '领域进出' };
// Triggers the sandbox fires on its own during setup and the cast; everything else is an event the
// user can assume ("假定已触发") through `assume.instances`.
// (53 魔法陣展開 and 69 生存状態変化 are not simulated, so they are offered to be assumed.)
export const AUTOMATIC_TRIGGERS = new Set([1, 10, 12, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 40, 42, 54, 55, 59, 60, 65]);
// Triggers that in a battle fire with the enemy as the process target (hitting it, knocking it down, putting an
// ailment on it): an assumed one runs against the target, the others on the attacker itself.
const OPPONENT_TRIGGERS = new Set([21, 23, 25, 27, 29, 35, 36, 78]);
// The user's ten in-battle switches, by trigger.
export const SWITCH_OF_TRIGGER = { 17: 'conditionBuffActive', 25: 'conditionBuffActive', 26: 'conditionBuffActive', 29: 'conditionBuffActive', 30: 'conditionBuffActive', 35: 'conditionBuffActive', 36: 'conditionBuffActive', 37: 'conditionBuffActive', 50: 'selfStateActive', 52: 'selfStateActive', 61: 'conditionBuffActive', 62: 'conditionBuffActive', 68: 'conditionBuffActive', 70: 'conditionBuffActive', 71: 'conditionBuffActive', 72: 'conditionBuffActive', 73: 'conditionBuffActive', 74: 'conditionBuffActive', 75: 'conditionBuffActive', 76: 'conditionBuffActive', 77: 'conditionBuffActive', 78: 'conditionBuffActive', 79: 'conditionBuffActive', 80: 'conditionBuffActive', 81: 'conditionBuffActive', 92: 'conditionBuffActive', 93: 'conditionBuffActive', 94: 'openingBuffActive', 96: 'reviveBuffActive', 97: 'reviveBuffActive', 98: 'partyConditionActive' };

const WEAPON_TYPES = new Set([10, 11, 12, 13, 14, 15, 16, 17]);
const STAT_KEYS = { hp: K.STAT.MAX_HP, mp: K.STAT.MAX_MP, str: K.STAT.STR, def: K.STAT.DEF, int: K.STAT.INT, mnd: K.STAT.MND, spd: K.STAT.SPD, crt: K.STAT.CRT };
const toStats = stats => { const out = {}; for (const [k, code] of Object.entries(STAT_KEYS)) if (stats && stats[k] != null) out[code] = Number(stats[k]); return out; };

function equipSpec(master, e) {
  const row = master.itemEquip.get(Number(e.id));
  return { pos: e.pos, id: Number(e.id) || 0, type: e.type ?? row?.EQUIP_TYPE ?? 0, elem: e.elem ?? row?.ELEM ?? 0, level: e.level ?? null };
}

// Builds a unit from a calculator-side description. With `panelGiven: false` the out-of-battle panel is not
// supplied but computed from master data (panel.mjs: level growth + awakening + board pieces, equipment
// parameters, then the trigger-1 passives); `spec.stats` then only overrides individual panel values.
export function addAttacker(battle, spec) {
  const master = battle.master;
  const equips = (spec.equips || []).map(e => equipSpec(master, e)).filter(e => e.id);
  const dress = master.unitDress.get(Number(spec.unitDressId));
  let stats = toStats(spec.stats), elemResist = { ...(spec.elemResist || {}) }, panel = null, panelOverride = null, level = spec.level ?? 120, crest = null;
  if (spec.panelGiven === false) {
    panel = bareStats(master, spec.unitDressId, { level: spec.level, awake: spec.awake, pieces: spec.pieces, limitBreak: spec.limitBreak });
    if (panel) { level = panel.level; panelOverride = stats; stats = statCodes(panel.stats); elemResist = { ...panel.elemResist, ...(spec.elemResist || {}) }; }
    for (const e of equips) {
      const es = equipmentStats(master, e.id, e.level); if (!es) continue;
      e.stats = statCodes(es.stats); e.name = es.name; e.estimated = es.estimated; e.level = es.level;
      for (const [k, v] of Object.entries(es.elemResist)) elemResist[k] = (elemResist[k] || 0) + v;
    }
    if (spec.crest?.crestId) {
      const cs = crestStats(master, spec.crest.crestId, { maxLevel: !!spec.crest.maxLevel });
      if (cs) { crest = { id: cs.id, name: cs.name, level: cs.level, upgradedFrom: cs.upgradedFrom, stats: statCodes(cs.stats), traits: spec.crest.traits || [] }; for (const [k, v] of Object.entries(cs.elemResist)) elemResist[k] = (elemResist[k] || 0) + v; }
      else crest = { id: spec.crest.crestId, name: null, missing: true, stats: {}, traits: spec.crest.traits || [] };
    }
  }
  const skills = spec.skills || [];
  if (!skills.length && dress) {
    for (const id of parseInts(dress.PRESET_SKILL).filter(Boolean)) skills.push({ type: master.skill.get(id)?.SKILL_TYPE ?? 9, id });
    for (const id of parseInts(dress.SKILL_SLOT_INFO).filter(Boolean)) skills.push({ type: master.skill.get(id)?.SKILL_TYPE ?? 1, id });
    for (const id of spec.magic || []) skills.push({ type: 2, id });
  }
  const unit = battle.addUnit({
    name: spec.name || dress?.NAME || '攻击方', side: K.SIDE.ALLY, unitDressId: Number(spec.unitDressId) || 0, level, limitBreak: spec.limitBreak ?? 7, awake: panel ? panel.awake : spec.awake ?? 0,
    charTypes: spec.charTypes || (dress ? [dress.CHARACTER_TYPE] : []), stats, hp: panel ? undefined : spec.stats?.hp, mp: panel ? undefined : spec.stats?.mp,
    equips, elemResist, personality: spec.personality || [], skills,
    passives: (spec.passives || []).filter(p => !p.affiliation || p.affiliation === K.AFF.AUTOSKILL),
  });
  unit.panelGiven = spec.panelGiven !== false;
  // spec.finalAdd {hp, mp, str, def, int, mnd}: flat amounts on the final stats (the calculator's 圣物属性)
  if (spec.finalAdd) unit.finalAdd = statCodes(spec.finalAdd);
  unit.panelOverride = panelOverride && Object.keys(panelOverride).length ? panelOverride : null;
  unit.panelParts = panel;
  unit.crest = crest;
  // crest traits (徽章词条): passives of the trait pool, registered under affiliation 18 like the game does
  if (crest) for (const t of crest.traits) { const pid = typeof t === 'object' ? t.passive : t; if (pid && master.passive.has(pid)) battle.addPassive(unit, pid, K.AFF.CREST, (typeof t === 'object' && t.localId) || pid); else if (pid) battle.log('missing-crest-trait', pid); }
  for (const p of spec.passives || []) if (p.affiliation && p.affiliation !== K.AFF.AUTOSKILL) { if (p.processes) battle.addProcesses(unit, p); else battle.addPassive(unit, p.id, p.affiliation, p.localId ?? p.id, p.level ?? 1, p.params); }
  // equipment passives (weapon 6 / armour 7 / accessories 8) come from ItemEquipMst unless the caller listed them;
  // spec.equipPassiveIds {equipId: [passive ids]} replaces an item's ItemEquipMst passives (e.g. its highest
  // enhancement stage, which ItemEquipMst does not point to)
  const listed = new Set((spec.passives || []).filter(p => p.affiliation && p.affiliation !== K.AFF.AUTOSKILL).map(p => `${p.affiliation}:${p.localId ?? p.id}`));
  if (spec.equipPassives !== false) for (const e of equips) {
    const row = master.itemEquip.get(e.id); if (!row) continue;
    if ([K.AFF.WEAPON, K.AFF.ARMOR, K.AFF.ACCESSORY].some(aff => listed.has(`${aff}:${e.id}`))) continue;
    const aff = e.pos === 1 || (e.pos === 2 && WEAPON_TYPES.has(e.type)) ? K.AFF.WEAPON : e.pos === 2 ? K.AFF.ARMOR : K.AFF.ACCESSORY;
    for (const pid of (spec.equipPassiveIds?.[e.id] ?? parseInts(row.PASSIVE_SKILL_INFO)).filter(Boolean)) battle.addPassive(unit, pid, aff, e.id);
  }
  return unit;
}

// A monster's own passives (user 2026-09-30: “除了 Break 都不算”): only the processes that work while the monster itself
// is broken are computed (気絶・ブレイク中 / ブレイク状態が変化した時 / 自分が気絶・ブレイク状態の被ダメージ…: e.g. 恩德爾羅納's
// DEF/MND −25%, 属性耐性 −25); everything else (瀕死 / 覚醒 stat-ups, 魔法耐性, 初回WAIT, ailment resistances …) is only
// listed in the calculator's Boss section (dist/game-data/engine/monster-passive-text.json).
export const OWN_BREAK_COND = /^(気絶・ブレイク中|ブレイク状態が変化した時|自分が気絶・ブレイク状態)/;
export function ownBreakSegments(master, passiveId) {
  const row = master.monsterPassive?.get(passiveId); if (!row) return [];
  return master.processSegments(row.PROCESS_INFO).map((seg, i) => { const mst = master.process.get(seg.processId); return mst && OWN_BREAK_COND.test(master.processCond.get(mst.PROCESS_COND)?.NAME || '') ? i : -1; }).filter(i => i >= 0);
}
export function monsterPassiveIds(master, monsterId) {
  const m = master.monster?.get(Number(monsterId)); if (!m) return [];
  return String(m.PASSIVE_SKILL_INFO || '').split('-').map(part => Number(part.split(':')[1])).filter(Boolean);
}
// A target from MonsterMst: stats, race, resistances and the monster's own Break passives (above); `listedPassives` are
// all its passive ids, for the list.
export function targetFromMonster(master, monsterId, overrides = {}) {
  const m = master.monster?.get(Number(monsterId)); if (!m) return null;
  const elemResist = {}; parseInts(m.RESIST_ELEM_INFO).forEach((v, i) => { if (i < 6) elemResist[i + 1] = v; });
  const listedPassives = monsterPassiveIds(master, monsterId);
  const passives = listedPassives.map(pid => ({ id: pid, table: 'monster', affiliation: K.AFF.AUTOSKILL, segments: ownBreakSegments(master, pid) })).filter(p => p.segments.length);
  return { name: m.NAME, monsterId: m.MONSTER_ID, isBoss: true, level: m.LV, charTypes: [m.CHARACTER_TYPE], stats: { hp: m.HP, mp: m.MP, str: m.ATK, def: m.DEF, int: m.MATK, mnd: m.MDEF, crt: m.CRITICAL_RATE }, elemResist, passives, listedPassives, breakTime: m.BREAK_TIME, ...overrides };
}

export function addTarget(battle, spec) {
  if (spec.monsterId && !spec.stats && battle.master.monster?.has(Number(spec.monsterId))) spec = { ...targetFromMonster(battle.master, spec.monsterId), ...spec };
  const unit = battle.addUnit({ name: spec.name || '目标', side: K.SIDE.OPPONENT, monsterId: spec.monsterId || 0, isBoss: spec.isBoss !== false, level: spec.level ?? 100,
    charTypes: spec.charTypes || [], stats: toStats(spec.stats), hp: spec.stats?.hp, mp: spec.stats?.mp, elemResist: spec.elemResist || {}, passives: (spec.passives || []).filter(p => p.table !== 'monster') });
  for (const p of spec.passives || []) if (p.table === 'monster') {
    const made = battle.addPassive(unit, p.id, p.affiliation ?? K.AFF.AUTOSKILL, p.id, 1, null, 'monster');
    if (p.segments) for (const inst of made) if (!p.segments.includes(inst.localIndex)) unit.instances.splice(unit.instances.indexOf(inst), 1);
  }
  return unit;
}

export const COMBO_HITS = 200;

// Replays the battle start: status calc, wave start, survivors, then the HP/MP/ether state the user chose.
export function setupBattle(battle, attacker, target, state = {}) {
  // The calculator's 特攻 / Break / 双刀 switches decide the state itself; the bonuses bound to it come from the skills.
  //   state.killer 'on' | 'off' (unset: by the skills and the target's race)
  //   state.targetBreak: the target is in the break state (its own Break passives fire, 52); state.breakDefenseRatio: an
  //   extra defense factor on top while broken (the calculator's field, default 1)
  //   state.hitScale {ratio, stage}: the 双刀 switch's 单段伤害倍率 and 修正试算位置 (the hit count multiplier is the caller's)
  battle.options.killer = state.killer ?? null;
  battle.options.hitScale = state.hitScale && Number.isFinite(state.hitScale.ratio) ? { ratio: state.hitScale.ratio, stage: state.hitScale.stage || 'core' } : null;
  battle.options.breakDefenseRatio = state.targetBreak && Number.isFinite(state.breakDefenseRatio) ? state.breakDefenseRatio : null;
  target.breakRemain = state.targetBreak ? 600 : 0;
  if (state.killer === 'on' && !target.charTypes.length) battle.assumptions.add('特攻：目标没选种族，按“种族未知”结算（针对具体种族的加成不计入，“对非某种族”的加成会计入）');
  if (battle.options.breakDefenseRatio != null && battle.options.breakDefenseRatio !== 1) battle.assumptions.add(`Break：在目标自己的破防效果之外，防御再按 ×${battle.options.breakDefenseRatio}（计算器“Break 时防御倍率”，游戏数据里没有这一步）`);
  battle.wave = state.wave ?? 1;
  battle.frame = Math.round((state.elapsedSeconds ?? 0) * 60);
  if (state.dateTime) battle.options.dateTime = state.dateTime;
  const all = [attacker, target, ...(state.party || [])];
  for (const u of all) battle.dispatch(K.TRIG.STATUS, u, u);
  for (const u of all) battle.dispatch(K.TRIG.WAVE_START, u, u);
  for (const u of all) battle.dispatch(K.TRIG.CHANGE_SURVIVORS, u, u);
  // MP starts full (MP-threshold conditions record where it was), then drops to the chosen MP
  attacker.mp = battle.finalStat(attacker, K.STAT.MAX_MP);
  battle.dispatch(K.TRIG.CHANGE_MP, attacker, attacker);
  attacker.hp = Math.max(1, Math.round(battle.finalStat(attacker, K.STAT.MAX_HP) * (state.hpPercent ?? 100) / 100));
  attacker.mp = Math.round(battle.finalStat(attacker, K.STAT.MAX_MP) * (state.mpPercent ?? 100) / 100);
  attacker.ether = state.etherPercent ?? 0;
  // the hit count the game scripts read is the target's (Bullet:Target():Hits() in OverHits, UnderHits, 急击 …): the user's
  // rule (2026-09-30, “连击数都默认200也不用改就当他生效”) — always 200, so the 50+ / 108 combo effects count
  target.combo = state.comboHits ?? COMBO_HITS;
  battle.dispatch(K.TRIG.CHANGE_HP, attacker, attacker);
  battle.dispatch(K.TRIG.CHANGE_MP, attacker, attacker);
  battle.dispatch(55, attacker, attacker);
  // Break on: the target's own Break passives (e.g. 恩德爾羅納 DEF/MND −25%, 属性耐性 −25) and the “boss broke” effects
  if (state.targetBreak) { battle.dispatch(K.TRIG.BREAK_CHANGE, target, target); for (const u of all) if (u !== target) battle.dispatch(K.TRIG.BOSS_BREAK, u, u); }
  if (target.hp != null && state.targetHpPercent != null) target.hp = Math.max(1, Math.round(battle.finalStat(target, K.STAT.MAX_HP) * state.targetHpPercent / 100));
  // Time-limited opening buffs are dropped when the user says the opening window has passed.
  if (state.openingBuffActive === false) for (const b of attacker.buffs.slice()) if (b.remain > 0) battle.removeBuff(attacker, b.uid);
}

export const instanceKey = inst => `${inst.affiliation}:${inst.localId}:${inst.localIndex}`;

// Passive instances the sandbox did not fire on its own: events the user may assume.
// `keep`: keys the user assumed (force-run, so they fired) stay listed so their tick can be undone.
export function conditionalInstances(battle, unit, keep = new Set()) {
  const fired = new Set(battle.trace.filter(t => t.fired && t.ownerId === unit.id).map(t => `${t.localId}:${t.index}`));
  return unit.instances.filter(i => !AUTOMATIC_TRIGGERS.has(i.trigger) && (keep.has(instanceKey(i)) || !fired.has(`${i.localId}:${i.localIndex}`))).map(i => ({
    key: instanceKey(i), localId: i.localId, localIndex: i.localIndex, passiveId: i.passiveId || i.localId, passiveName: clean(battle.master.passive.get(i.passiveId || i.localId)?.NAME || battle.master.itemEquip.get(i.localId)?.NAME || ''), processId: i.processId, processName: zhName(i.mst.NAME),
    trigger: i.trigger, triggerLabel: TRIGGER_LABELS[i.trigger] || `触发${i.trigger}`, condition: zhCondition(i.cond.NAME) || '', luaCondition: i.cond.LUA_FUNC_NAME || '', switchGroup: SWITCH_OF_TRIGGER[i.trigger] || 'conditionBuffActive', prob: i.prob,
  }));
}

// Conditional instances that would change nothing if assumed: force-run one on the setup state and nothing about the
// two units differs afterwards (buffs and their values, control entries, counters, HP/MP) — e.g. 指導者's every-40-seconds
// renewal of the +30000 cap buff the battle start already gave (user 2026-09-29: such effects are not offered, “去掉这种”).
// (the force-run instance's own bookkeeping, e.g. how often it ran, is left out: `skip`)
function stateSignature(battle, units, skip = null) {
  const inst = i => instanceKey(i) === skip ? null : [i.localId, i.localIndex, i.procValues, i.kept, i.flags, i.parameters, i.values];
  return JSON.stringify([battle.fieldValues, units.map(u => [u.buffs.map(b => `${b.buffId}:${b.params.join(',')}`).sort(), [...u.status, ...u.real, ...u.work].map(e => `${e.op}:${e.params.join(',')}`).sort(),
    u.values, u.procValues, u.hp, u.mp, u.ether, u.combo, u.charTypes, u.passiveIds.length, u.instances.map(inst)])]);
}
function unchangedInstances(battle, attackerId, targetId, setupSnap, candidates) {
  const out = new Set(); if (!candidates.length) return out;
  const end = battle.snapshot(), trace = battle.trace.slice();
  const sig = key => stateSignature(battle, [battle.unit(attackerId), battle.unit(targetId)], key);
  const unsupported = () => [...battle.unsupported.values()].reduce((a, b) => a + b, 0);
  for (const c of candidates) {
    battle.restore(setupSnap);
    const A = battle.unit(attackerId), T = battle.unit(targetId), inst = A.instances.find(i => instanceKey(i) === c.key); if (!inst) continue;
    const before = sig(c.key), from = battle.trace.length, missing = unsupported();
    try { battle.runInstance(inst, A, OPPONENT_TRIGGERS.has(inst.trigger) ? T : A, null, inst.trigger, { force: true }); } catch { continue; }
    // a script error or an unimplemented native: the run tells nothing, so the effect stays offered
    if (battle.trace.slice(from).some(t => t.error) || unsupported() !== missing) continue;
    if (sig(c.key) === before) out.add(c.key);
  }
  battle.restore(end); battle.trace.length = 0; for (const t of trace) battle.trace.push(t);
  return out;
}

// Force-runs assumed instances (condition and probability skipped) after the normal setup.
export function assumeInstances(battle, unit, keys, opponent = null) {
  const wanted = new Set(keys || []);
  for (const inst of unit.instances) if (wanted.has(instanceKey(inst))) battle.runInstance(inst, unit, opponent && OPPONENT_TRIGGERS.has(inst.trigger) ? opponent : unit, null, inst.trigger, { force: true });
}

function damageBullets(master, skillId, level) {
  const skill = master.skill.get(skillId); if (!skill) return [];
  return parseInts(skill.BULLET_INFO).filter(Boolean).filter(b => { const row = master.bulletLevel(b, level); return row && row.PROCESS_INFO.replace(/[:@]/g, ''); });
}

// One evaluation: cast the skill once and hit with the given bullet; returns the per-pass results.
function evaluate(battle, attacker, target, skillId, bulletId, level, critical, random) {
  const A = battle.unit(attacker.id), T = battle.unit(target.id);
  battle.beginSkill(A, T, skillId);
  const bullet = battle.createBullet(A, T, { skillId, bulletId, level, critical, random });
  battle.hit(bullet);
  return bullet.results;
}

const clean = s => String(s ?? '').replace(/<[^>]+>/g, '');
const summarize = values => ({ min: Math.min(...values), max: Math.max(...values), mean: values.reduce((a, b) => a + b, 0) / values.length });

// Skills the attacker already used in this battle before the evaluated cast (self buffs such as 神託的誓言,
// counters that grow per use such as 超必殺技階段增幅): every bullet of each one is played, self/ally-targeted
// skills on the attacker, so their buffs, counts and cooldown states exist when the evaluated skill fires.
export function preCast(battle, attacker, target, skillIds, level = 9) {
  for (const id of skillIds || []) {
    const info = battle.master.skillInfo(Number(id)); if (!info) continue;
    const tgt = info.targetSide === K.TARGET_SIDE.ME || info.targetSide === K.TARGET_SIDE.ALLY ? attacker : target;
    battle.beginSkill(attacker, tgt, Number(id));
    for (const bulletId of parseInts(battle.master.skill.get(Number(id)).BULLET_INFO).filter(Boolean)) { const b = battle.createBullet(attacker, tgt, { skillId: Number(id), bulletId, level, random: 0.95 }); battle.hit(b); }
    battle.dispatch(17, attacker, attacker); // skill end
    battle.setState(attacker, K.STATE.IDLE, { silent: true });
  }
}

// What casting one support magic does, read from the game scripts themselves: cast it once on a clean battle
// and list the buffs / debuffs it puts on the attacker (self / ally side) or the target (enemy side), each with
// its duration (frames) and the control entries it already applies (op + params). A buff whose effect only
// fires later (for example when damage is dealt) has no entries yet; its own parameters are reported instead.
export function measureSupport(battle, attacker, target, skillIds, state = {}, level = 9) {
  setupBattle(battle, attacker, target, { ...state, preCasts: [] });
  const base = battle.snapshot();
  const out = new Map();
  for (const id of skillIds || []) {
    battle.restore(base);
    const A = battle.unit(attacker.id ?? attacker), T = battle.unit(target.id ?? target);
    const before = new Set([...A.buffs, ...T.buffs].map(b => b.uid));
    try { preCast(battle, A, T, [id], level); } catch (err) { out.set(Number(id), { error: err.message, effects: [] }); continue; }
    const effects = [];
    for (const [side, u] of [['self', A], ['target', T]]) for (const b of u.buffs) {
      if (before.has(b.uid)) continue;
      const entries = [...u.status, ...u.real, ...u.work].filter(e => e.source === b.uid).map(e => ({ op: e.op, params: [...e.params] }));
      effects.push({ side, buffId: b.buffId, name: b.mst?.NAME || String(b.buffId), duration: b.duration, params: [...b.params], isDebuff: !!b.isDebuff, entries });
    }
    out.set(Number(id), { effects });
  }
  battle.restore(base);
  return out;
}

// Full scenario: returns hits (per bullet pass) with normal/critical ranges, plus what fired and what could be assumed.
export function runScenario({ battle, attacker, target, skill, state = {}, assume = {}, randoms = [0.9, 0.925, 0.95, 0.975, 1.0] }) {
  battle.options.probability = assume.probability || 'assume';
  // assume.forced: chance-based instances (`${unit id}:${localId}:${index}`, the probabilistic list's keys) counted as
  // triggered whatever the mode (the user's ticks)
  battle.options.forced = new Set(assume.forced || []);
  setupBattle(battle, attacker, target, state);
  const setupSnap = battle.snapshot();
  assumeInstances(battle, attacker, assume.instances, target);
  preCast(battle, attacker, target, state.preCasts, skill.level ?? 9);
  const conditionals = conditionalInstances(battle, attacker, new Set(assume.instances || []));
  const level = skill.level ?? 9;
  const bullets = skill.bulletId ? [skill.bulletId] : damageBullets(battle.master, skill.id, level);
  const stats = code => ({ panel: battle.finalStat(attacker, code, { layer: 'status' }), real: battle.finalStat(attacker, code) });
  const base = battle.snapshot();
  // each stat's parts before the evaluated cast (panel + in-battle layers), for the calculator's 面板与加成核对
  const statParts = Object.fromEntries([['hp', K.STAT.MAX_HP], ['mp', K.STAT.MAX_MP], ['str', K.STAT.STR], ['def', K.STAT.DEF], ['int', K.STAT.INT], ['mnd', K.STAT.MND], ['crt', K.STAT.CRT], ['spd', K.STAT.SPD]].map(([k, code]) => [k, battle.statParts(attacker, code)]));
  const hits = [];
  for (const bulletId of bullets) {
    const passes = new Map();
    for (const critical of [false, true]) for (const random of randoms) {
      battle.restore(base);
      const results = evaluate(battle, attacker, target, skill.id, bulletId, level, critical, random);
      results.forEach((r, i) => {
        if (!passes.has(i)) passes.set(i, { bulletId, hitIndex: r.hitIndex ?? i, normal: [], critical: [], sample: null, cancelled: !!r.cancelled });
        const p = passes.get(i);
        if (r.cancelled) return;
        (critical ? p.critical : p.normal).push(r.damage);
        if (!critical && random === randoms[Math.floor(randoms.length / 2)]) p.sample = r;
        if (critical && random === randoms[Math.floor(randoms.length / 2)]) p.critSample = r;
      });
    }
    for (const p of passes.values()) {
      const s = p.sample;
      hits.push({ bulletId: p.bulletId, bulletName: battle.master.bullet.get(p.bulletId)?.NAME || '', hitIndex: p.hitIndex, cancelled: p.cancelled, dmgRatio: s?.dmgRatio ?? null, normal: p.normal.length ? summarize(p.normal) : null, critical: p.critical.length ? summarize(p.critical) : null, core: s?.coreDamage ?? null, afterPassives: s?.afterPassives ?? null,
        crt: s?.crt ?? null, capComputed: s?.capComputed ?? null, breakdown: s?.breakdown ?? null, critBreakdown: p.critSample?.breakdown ?? null,
        attack: s?.attack ?? null, defense: s?.defense ?? null, element: s?.element ?? null, resist: s?.resist ?? null, killer: s?.killer ?? false, killerFactor: s?.killerFactor ?? 1, offense: s?.offense ?? 1, received: s?.received ?? 1, reduction: s?.reduction ?? 1, coefficient: s ? s.per / 10000 : null, cap: s?.cap ?? null, critCap: p.critSample?.cap ?? null, capVal: s?.capVal ?? 0, capPer: s?.capPer ?? 0, capAdd: s?.capAdd ?? 0,
        edits: (s?.edits || []).map(e => ({ name: zhName(e.by), id: e.id, localId: e.localId, value: e.value, passiveName: clean(battle.master.passive.get(e.localId)?.NAME || battle.master.itemEquip.get(e.localId)?.NAME || '') })) });
    }
  }
  // representative casts (every bullet, normal and critical) keep their traces, so callers see what fired during
  // the attack and every chance that came up — also the ones that only roll on a critical hit
  const mid = randoms[Math.floor(randoms.length / 2)];
  const trace = battle.trace.slice(0, base.traceLength);
  for (const critical of [true, false]) for (const bulletId of bullets) { battle.restore(base); evaluate(battle, attacker, target, skill.id, bulletId, level, critical, mid); trace.push(...battle.trace.slice(base.traceLength)); }
  battle.restore(base);
  if (bullets.length) evaluate(battle, attacker, target, skill.id, bullets[0], level, false, mid);
  const fired = trace.filter(t => t.fired && t.ownerId === attacker.id);
  const listed = new Set(conditionals.map(c => `${c.localId}:${c.localIndex}`)); // already offered as a conditional
  // the attacker's chance effects that came up: its own probability (fired, or the condition held and the roll
  // failed) or a lottery inside its script; `on`: counted in the result
  const chanceOf = t => t.prob < 10000 ? (t.fired || t.missed) : !!t.lottery;
  // the move's own bullets (e.g. 剪刀尾巴's chance to blind): named after the move, not a passive
  const moveBullets = new Set(parseInts(battle.master.skill.get(skill.id)?.BULLET_INFO).filter(Boolean)), moveName = clean(battle.master.skill.get(skill.id)?.NAME || '');
  const probabilistic = [...new Map(trace.filter(t => t.ownerId === attacker.id && chanceOf(t) && !listed.has(`${t.localId}:${t.index}`)).map(t => [`${t.ownerId}:${t.localId}:${t.index}`, t])).values()].map(t => ({ key: `${t.ownerId}:${t.localId}:${t.index}`, localId: t.localId, passiveId: t.passiveId || t.localId, on: !!t.fired && t.lottery !== 'miss', ...(moveBullets.has(t.localId) && !t.passiveId ? { fromMove: true, skillId: skill.id } : {}), passiveName: moveBullets.has(t.localId) && !t.passiveId ? moveName : clean(battle.master.passive.get(t.passiveId || t.localId)?.NAME || battle.master.itemEquip.get(t.localId)?.NAME || ''), processName: zhName(t.name), prob: t.prob < 10000 ? t.prob / 100 : null, trigger: t.trigger, triggerLabel: TRIGGER_LABELS[t.trigger] || '' }));
  // conditionals that would change nothing are not offered (an assumed one stays so its tick can be undone)
  const assumedKeys = new Set(assume.instances || []);
  const unchanged = unchangedInstances(battle, attacker.id, target.id, setupSnap, conditionals.filter(c => !assumedKeys.has(c.key)));
  return {
    statParts,
    stats: { str: stats(K.STAT.STR), def: stats(K.STAT.DEF), int: stats(K.STAT.INT), mnd: stats(K.STAT.MND), crt: stats(K.STAT.CRT), hp: { panel: battle.finalStat(attacker, K.STAT.MAX_HP, { layer: 'status' }), real: battle.finalStat(attacker, K.STAT.MAX_HP), current: attacker.hp } },
    buffs: attacker.buffs.map(b => ({ uid: b.uid, buffId: b.buffId, name: clean(zhName(b.mst.NAME)), params: b.params, remain: b.remain, from: clean(battle.master.passive.get(b.related?.localId)?.NAME || battle.master.itemEquip.get(b.related?.localId)?.NAME || '') })),
    hits, conditionals: conditionals.filter(c => !unchanged.has(c.key)), unchangedConditionals: conditionals.filter(c => unchanged.has(c.key)), probabilistic,
    fired: fired.map(t => ({ trigger: t.trigger, triggerLabel: TRIGGER_LABELS[t.trigger] || '', passiveName: clean(battle.master.passive.get(t.localId)?.NAME || battle.master.itemEquip.get(t.localId)?.NAME || ''), processName: zhName(t.name), localId: t.localId, index: t.index })),
    errors: [...new Map(trace.filter(t => t.error).map(t => [`${t.id}:${t.error}`, { name: t.name, id: t.id, error: t.error }])).values()],
    unsupported: [...battle.unsupported.keys()],
    assumptions: [...battle.assumptions],
  };
}
