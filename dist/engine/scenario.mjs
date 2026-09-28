// Calculator-facing entry point of the battle-script sandbox: builds the attacker and target from the
// calculator's inputs, replays the game's setup triggers, casts one skill and reports every hit with
// normal/critical ranges, the damage cap, the attack stat layers and which passives fired.
import { Battle, K, parseInts } from './battle.mjs';
import { bareStats, crestStats, equipmentStats, exclusiveEquipment, statCodes } from './panel.mjs';
import { zhName, zhCondition } from './gloss.mjs';
export { bareStats, crestStats, equipmentStats, exclusiveEquipment, maxLevel, maxAwake, growthRate, KNOWN_GROWTH_RATE } from './panel.mjs';

export const TRIGGER_LABELS = { 1: '状态计算', 10: 'Wave开始', 11: 'Wave结束', 12: 'Wave中每帧', 16: '咏唱前', 17: '技能结束时', 18: '技能发动前', 19: '弹道生成前', 20: '弹道处理', 21: '命中时', 22: '被命中时', 23: '伤害计算时', 24: '被伤害计算时', 25: '命中后', 26: '被命中后', 27: '伤害计算后', 28: '被伤害计算后', 29: '命中后（前）', 30: '被命中后（前）', 35: '分割HP归零', 36: '造成致死伤害', 37: '受到致死伤害', 40: 'HP变化', 41: 'SCT变化', 42: 'MP变化', 43: 'STR变化', 44: 'DEF变化', 45: 'INT变化', 46: 'MND变化', 50: '状态异常变化', 51: '角色类型变化', 52: '气绝/Break变化', 53: '咏唱等级变化', 54: 'Buff变化', 55: '必杀量表变化', 59: '单位状态变化', 60: 'Buff持续中', 61: '施加Buff前', 62: '被施加Buff前', 65: '生存人数变化', 66: '地形效果变化', 68: 'Boss Break变化', 69: '生存人数变化2', 70: '按间隔', 71: '按间隔（条件）', 72: '发动方抽选时', 73: '发动方效果前', 74: '发动方效果后', 75: '目标抽选时', 76: '目标效果前', 77: '目标效果后', 78: '施加异常前', 79: '被施加异常前', 80: '获得Zel', 81: '获得宝箱', 92: '流程内触发', 93: '流程内触发（参数）', 94: '背景变化', 95: '时间轴条件', 96: '复活时', 97: '复活对象时', 98: '领域进出' };
// Triggers the sandbox fires on its own during setup and the cast; everything else is an event the
// user can assume ("假定已触发") through `assume.instances`.
export const AUTOMATIC_TRIGGERS = new Set([1, 10, 12, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 40, 42, 53, 54, 55, 59, 60, 65, 69]);
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

// A target from MonsterMst: stats, race, resistances and the monster's own passives (MonsterPassiveSkillMst).
export function targetFromMonster(master, monsterId, overrides = {}) {
  const m = master.monster?.get(Number(monsterId)); if (!m) return null;
  const elemResist = {}; parseInts(m.RESIST_ELEM_INFO).forEach((v, i) => { if (i < 6) elemResist[i + 1] = v; });
  const passives = [];
  for (const part of String(m.PASSIVE_SKILL_INFO || '').split('-')) { const [, pid] = part.split(':').map(Number); if (pid) passives.push({ id: pid, table: 'monster', affiliation: K.AFF.AUTOSKILL }); }
  return { name: m.NAME, monsterId: m.MONSTER_ID, isBoss: true, level: m.LV, charTypes: [m.CHARACTER_TYPE], stats: { hp: m.HP, mp: m.MP, str: m.ATK, def: m.DEF, int: m.MATK, mnd: m.MDEF, crt: m.CRITICAL_RATE }, elemResist, passives, breakTime: m.BREAK_TIME, ...overrides };
}

export function addTarget(battle, spec) {
  if (spec.monsterId && !spec.stats && battle.master.monster?.has(Number(spec.monsterId))) spec = { ...targetFromMonster(battle.master, spec.monsterId), ...spec };
  const unit = battle.addUnit({ name: spec.name || '目标', side: K.SIDE.OPPONENT, monsterId: spec.monsterId || 0, isBoss: spec.isBoss !== false, level: spec.level ?? 100,
    charTypes: spec.charTypes || [], stats: toStats(spec.stats), hp: spec.stats?.hp, mp: spec.stats?.mp, elemResist: spec.elemResist || {}, passives: (spec.passives || []).filter(p => p.table !== 'monster') });
  for (const p of spec.passives || []) if (p.table === 'monster') battle.addPassive(unit, p.id, p.affiliation ?? K.AFF.AUTOSKILL, p.id, 1, null, 'monster');
  return unit;
}

// Replays the battle start: status calc, wave start, survivors, then the HP/MP/ether state the user chose.
export function setupBattle(battle, attacker, target, state = {}) {
  // The calculator's 特攻 / Break / 双刀 switches decide the state itself; the bonuses bound to it come from the skills.
  //   state.killer 'on' | 'off' (unset: by the skills and the target's race)
  //   state.targetBreak: the target is in the break state; state.breakDefenseRatio: its defense factor while broken
  //   state.hitScale {ratio, stage}: the 双刀 switch's 单段伤害倍率 and 修正试算位置 (the hit count multiplier is the caller's)
  battle.options.killer = state.killer ?? null;
  battle.options.hitScale = state.hitScale && Number.isFinite(state.hitScale.ratio) ? { ratio: state.hitScale.ratio, stage: state.hitScale.stage || 'core' } : null;
  battle.options.breakDefenseRatio = state.targetBreak && Number.isFinite(state.breakDefenseRatio) ? state.breakDefenseRatio : null;
  target.breakRemain = state.targetBreak ? 600 : 0;
  if (state.killer === 'on' && !target.charTypes.length) battle.assumptions.add('特攻：目标没选种族，按“种族未知”结算（针对具体种族的加成不计入，“对非某种族”的加成会计入）');
  if (battle.options.breakDefenseRatio != null && battle.options.breakDefenseRatio !== 1) battle.assumptions.add(`Break：目标防御按 ×${battle.options.breakDefenseRatio}（计算器“Break 时防御倍率”，游戏脚本里没有这一步）`);
  battle.wave = state.wave ?? 1;
  battle.frame = Math.round((state.elapsedSeconds ?? 0) * 60);
  if (state.dateTime) battle.options.dateTime = state.dateTime;
  const all = [attacker, target, ...(state.party || [])];
  for (const u of all) battle.dispatch(K.TRIG.STATUS, u, u);
  for (const u of all) battle.dispatch(K.TRIG.WAVE_START, u, u);
  for (const u of all) battle.dispatch(K.TRIG.CHANGE_SURVIVORS, u, u);
  attacker.hp = Math.max(1, Math.round(battle.finalStat(attacker, K.STAT.MAX_HP) * (state.hpPercent ?? 100) / 100));
  attacker.mp = Math.round(battle.finalStat(attacker, K.STAT.MAX_MP) * (state.mpPercent ?? 100) / 100);
  attacker.ether = state.etherPercent ?? 0;
  attacker.combo = state.comboHits ?? 0;
  battle.dispatch(K.TRIG.CHANGE_HP, attacker, attacker);
  battle.dispatch(K.TRIG.CHANGE_MP, attacker, attacker);
  battle.dispatch(55, attacker, attacker);
  if (target.hp != null && state.targetHpPercent != null) target.hp = Math.max(1, Math.round(battle.finalStat(target, K.STAT.MAX_HP) * state.targetHpPercent / 100));
  // Time-limited opening buffs are dropped when the user says the opening window has passed.
  if (state.openingBuffActive === false) for (const b of attacker.buffs.slice()) if (b.remain > 0) battle.removeBuff(attacker, b.uid);
}

export const instanceKey = inst => `${inst.affiliation}:${inst.localId}:${inst.localIndex}`;

// Passive instances the sandbox did not fire on its own: events the user may assume.
export function conditionalInstances(battle, unit) {
  const fired = new Set(battle.trace.filter(t => t.fired && t.owner === unit.name).map(t => `${t.localId}:${t.index}`));
  return unit.instances.filter(i => !AUTOMATIC_TRIGGERS.has(i.trigger) && !fired.has(`${i.localId}:${i.localIndex}`)).map(i => ({
    key: instanceKey(i), passiveId: i.passiveId || i.localId, passiveName: clean(battle.master.passive.get(i.passiveId || i.localId)?.NAME || battle.master.itemEquip.get(i.localId)?.NAME || ''), processId: i.processId, processName: zhName(i.mst.NAME),
    trigger: i.trigger, triggerLabel: TRIGGER_LABELS[i.trigger] || `触发${i.trigger}`, condition: zhCondition(i.cond.NAME) || '', luaCondition: i.cond.LUA_FUNC_NAME || '', switchGroup: SWITCH_OF_TRIGGER[i.trigger] || 'conditionBuffActive', prob: i.prob,
  }));
}

// Force-runs assumed instances (condition and probability skipped) after the normal setup.
export function assumeInstances(battle, unit, keys) {
  const wanted = new Set(keys || []);
  for (const inst of unit.instances) if (wanted.has(instanceKey(inst))) battle.runInstance(inst, unit, unit, null, inst.trigger, { force: true });
}

function damageBullets(master, skillId, level) {
  const skill = master.skill.get(skillId); if (!skill) return [];
  return parseInts(skill.BULLET_INFO).filter(Boolean).filter(b => { const row = master.bulletLevel(b, level); return row && row.PROCESS_INFO.replace(/[:@]/g, ''); });
}

// One evaluation: cast the skill once and hit with the given bullet; returns the per-pass results.
function evaluate(battle, attacker, target, skillId, bulletId, level, critical, random) {
  battle.beginSkill(attacker, target, skillId);
  const bullet = battle.createBullet(attacker, target, { skillId, bulletId, level, critical, random });
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
  setupBattle(battle, attacker, target, state);
  assumeInstances(battle, attacker, assume.instances);
  preCast(battle, attacker, target, state.preCasts, skill.level ?? 9);
  const conditionals = conditionalInstances(battle, attacker);
  const level = skill.level ?? 9;
  const bullets = skill.bulletId ? [skill.bulletId] : damageBullets(battle.master, skill.id, level);
  const stats = code => ({ panel: battle.finalStat(attacker, code, { layer: 'status' }), real: battle.finalStat(attacker, code) });
  const base = battle.snapshot();
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
  // a final representative cast keeps its trace so callers see what fired during the attack too
  battle.restore(base);
  if (bullets.length) evaluate(battle, attacker, target, skill.id, bullets[0], level, false, randoms[Math.floor(randoms.length / 2)]);
  const fired = battle.trace.filter(t => t.fired && t.owner === attacker.name);
  const probabilistic = [...new Map(battle.trace.filter(t => t.fired && t.prob < 10000).map(t => [`${t.localId}:${t.index}`, t])).values()].map(t => ({ key: `${t.localId}:${t.index}`, passiveName: clean(battle.master.passive.get(t.localId)?.NAME || battle.master.itemEquip.get(t.localId)?.NAME || ''), processName: zhName(t.name), prob: t.prob / 100, trigger: t.trigger, triggerLabel: TRIGGER_LABELS[t.trigger] || '' }));
  return {
    stats: { str: stats(K.STAT.STR), def: stats(K.STAT.DEF), int: stats(K.STAT.INT), mnd: stats(K.STAT.MND), crt: stats(K.STAT.CRT), hp: { panel: battle.finalStat(attacker, K.STAT.MAX_HP, { layer: 'status' }), real: battle.finalStat(attacker, K.STAT.MAX_HP), current: attacker.hp } },
    buffs: attacker.buffs.map(b => ({ uid: b.uid, buffId: b.buffId, name: clean(zhName(b.mst.NAME)), params: b.params, remain: b.remain, from: clean(battle.master.passive.get(b.related?.localId)?.NAME || battle.master.itemEquip.get(b.related?.localId)?.NAME || '') })),
    hits, conditionals, probabilistic,
    fired: fired.map(t => ({ trigger: t.trigger, triggerLabel: TRIGGER_LABELS[t.trigger] || '', passiveName: clean(battle.master.passive.get(t.localId)?.NAME || battle.master.itemEquip.get(t.localId)?.NAME || ''), processName: zhName(t.name), localId: t.localId, index: t.index })),
    errors: battle.trace.filter(t => t.error).map(t => ({ name: t.name, id: t.id, error: t.error })),
    unsupported: [...battle.unsupported.keys()],
    assumptions: [...battle.assumptions],
  };
}
