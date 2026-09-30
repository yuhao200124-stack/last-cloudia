// Battle-script sandbox: a JavaScript stand-in for the game's native battle core that hosts the
// game's own Lua process/condition scripts (see lua-host.mjs). Master data comes from the reader's
// *Mst tables; scripts drive every passive/buff decision; this file only reproduces the native
// pieces the scripts call into (ProcControl2, UnitGetValue, BuffControl, ...) and the fixed
// damage pipeline order established from GameAssembly (ProcessWork.ProcControlDamage/CalcDamage).
import { LuaHost, multi, LuaTable } from './lua-host.mjs?v=20260930-1549';

const f32 = Math.fround;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const luaRound = v => Math.floor(v + 0.5);

// ---- constants shared with the scripts (luaCommon.lua / procCondCommon.lua) ----
export const K = {
  UNKNOWN_RACE: 9999, // stand-in race of a target given none (see Battle.charTypesOf)
  STAT: { HP: 64, MP: 1, STR: 2, DEF: 3, INT: 4, MND: 5, SPD: 6, VIT: 7, CRT: 8, SUPER_ARMOR: 9, MAX_HP: 96, TOTAL_MAX_HP: 32, MAX_MP: 33, MAX_VIT: 39 },
  TS: { SUBJECT_WORK: 1, UNIT_WORK: 2, BULLET_WORK: 3, BUFF_WORK: 4, BUFF_OWNER_WORK: 5, SUBJECT_REAL: 9, UNIT_REAL: 10, BULLET_SAMPLE: 11, BUFF_SAMPLE: 12, BUFF_OWNER_SAMPLE: 13, SUBJECT_LOCAL: 17, UNIT_LOCAL: 18, BULLET_LOCAL: 19, BUFF_LOCAL: 20, BUFF_OWNER_LOCAL: 21 },
  LIFE: { NORMAL: 0, TRANSIENT: 2, CONTINUOUS: 3 },
  SIDE: { ALLY: 2, OPPONENT: 1 },
  TARGET_SIDE: { ALL: 0, OPPONENT: 1, ALLY: 2, ME: 3, NONE: 5 },
  TARGET_COND: { ALL: -1, BOTH: 0, ALIVE: 1, DEAD: 2, SECEDE: 3 },
  AFF: { NONE: 0, BUFF: 2, AUTOSKILL: 4, ARK: 5, WEAPON: 6, ARMOR: 7, ACCESSORY: 8, TERRAIN: 9, FORMATION: 12, SUPPORT: 15, CREST: 18, SUB_BUFF: 64 },
  TRIG: { STATUS: 1, WAVE_START: 10, BEFORE_SKILL: 18, BEFORE_CREATE_BULLET: 19, BULLET_PROCESS: 20, BULLET_HIT: 21, BULLET_WAS_HIT: 22, ON_CALC_ATTACK: 23, ON_CALC_DAMAGE: 24, AFTER_ATTACK: 25, AFTER_DAMAGE: 26, AFTER_CALC_ATTACK: 27, AFTER_CALC_DAMAGE: 28, PRE_AFTER_ATTACK: 29, PRE_AFTER_DAMAGE: 30, BEFORE_CHANT: 16, CHANGE_MP: 42, BREAK_CHANGE: 52, UNIT_STATE: 59, BOSS_BREAK: 68, CHANGE_HP: 40, CHANGE_BUFF: 54, ON_ADDED_BUFF: 60, CHANGE_SURVIVORS: 65 },
  OP: { PHYS_DMG: 100, MAG_DMG: 101, STR: 300, DEF: 301, INT: 302, MND: 303, CRT: 304, MAX_HP: 305, STATUS_RESIST: 306, ELEM_RESIST: 307, KILLER: 308, SPD: 310, MAX_MP: 318, EQUIP_PARAM: 319, REDUCTION_PHYS: 502, REDUCTION_MAG: 503, DMG_POWER: 504, INVALID_DMG: 505, OVERRIDE_ELEMENT: 507, KILLER_POWER: 509, DMG_LIMIT_OFF: 824, MULTI_BULLET: 825, DMG_LIMIT_UP: 826, MAGIC_CRITICAL: 800, SPECIAL_CRITICAL: 829 },
  // unit states (luaCommon.lua STATE_*): 59 (単位状態変化) fires on every change
  STATE: { IDLE: 0, MOVE: 1, STANDBY: 2, MAIN: 3, DAMAGE: 4 },
  SKILL: { SKILL: 1, MAGIC: 2, PRECAST: 3, SUMMON: 4, SPECIAL: 5, PASSIVE: 6, ARK: 7, ATTACK: 9, PHYSIC: 10, COUNTER: 15 },
  ROLE: { ATTACK: 1, HEAL: 2, BUFF: 3, DEBUFF: 8, CAST: 16, RESURRECT: 32 },
  ELEM: { NONE: 0, FIRE: 1, ICE: 2, TREE: 3, THUNDER: 4, LIGHT: 5, DARK: 6 },
  PARAM_BEHAV: { FLAME: 1, COUNT: 2, PROB: 3, VAL: 4, PER: 5, ADD: 6, RESULT_ADD: 7, RESULT_PER: 8 },
  UNIT_PROPERTY: { LEVEL: 50, LIMITBREAK_LV: 51, AWAKE_LV: 52, PROC_VALUE: 151, CALC_LUA_VALUE: 152, ACTIVE_TIME: 170, IS_REMOTE: 200, IS_OWNER: 201, CAST_MIN_CLAMP: 220, PERSONALITY_LV: 300, SKILL_LV: 310, ACTIVE_SKILL_PUID: 1000, IS_BUFF_BY_UID: 3000, GET_BUFF_UID_BY_ID: 3001 },
  MASTER: { UNIT_DRESS: 10, MONSTER: 20, ITEM_EQUIP: 40, SKILL: 50, BUFF: 53 },
  BULLET_PROPERTY: { ISVALID: 0, UID: 1, BUFF_UID: 2, SKILL_ID: 3, ID: 4, LOCAL_ID: 5, ISBULLET: 6, SKILL_TYPE: 100, SKILL_TARGET_SIDE: 101, SKILL_TARGET_RANGE: 102, SKILL_ROLE: 103, SKILL_ROLE_DETAIL: 104, SKILL_KILLER_VALUE: 105, SKILL_ELEMENT_FROM_WEAPON: 106, SKILL_ELEMENT: 107, SKILL_KIND: 108, TARGET_SIDE: 111, WEAPON_INDEX: 400, DAMAGE_RATIO_READ_ONLY: 401, HIT_INDEX: 402, DAMAGE_LIMIT: 410, HEAL_LIMIT: 411, OWNER_UID: 520, TARGET_UID: 521, LUA_VALUE: 500, CALC_LUA_VALUE: 502 },
  CS_CALC: { OVR: 0, ADD: 1, SUB: 2, MULT: 3, DIV: 5, MOD: 8, MIN: 15, MAX: 16 },
};
const STAT_OF_OP = { 300: 2, 301: 3, 302: 4, 303: 5, 304: 8, 305: 96, 310: 6, 318: 33 };
const ELEMENT_EXPANSION = { [-1]: [1, 2, 3, 4, 5, 6], [-2]: [0, 1, 2, 3, 4, 5, 6], [-11]: [0, 2, 3, 4, 5, 6], [-12]: [0, 1, 3, 4, 5, 6], [-13]: [0, 1, 2, 4, 5, 6], [-14]: [0, 1, 2, 3, 5, 6], [-15]: [0, 1, 2, 3, 4, 6], [-16]: [0, 1, 2, 3, 4, 5] };
// Skill-type combination codes (SKILL_CATEGORY_EXPANSION in luaCommon.lua): bit (type+3) marks a type.
// (SKILL_PHYSIC inside a combination still means 通常攻撃 + スキル: 270592 → {攻撃, スキル, 特技, カウンター}.)
const expandSkillTypes = v => {
  if (v === K.SKILL.PHYSIC) return [K.SKILL.ATTACK, K.SKILL.SKILL];
  if (v > K.SKILL.COUNTER) { const out = []; for (let t = 1; t <= 15; t++) if (v & (1 << (t + 3))) out.push(...(t === K.SKILL.PHYSIC ? [K.SKILL.ATTACK, K.SKILL.SKILL] : [t])); return out; }
  return [v];
};

export const parseInts = (str, fill = 0) => String(str ?? '').split(':').map(x => { const t = x.trim(); return t === '' ? fill : (Number(t) || 0); });
// "pid:prob:p1:p2:..." segments separated by '@'
export function parseProcessInfo(str) {
  const out = [];
  for (const seg of String(str ?? '').split('@')) {
    const fields = seg.split(':');
    const pid = Number(fields[0]);
    if (!fields[0] || !Number.isFinite(pid) || pid === 0) continue;
    out.push({ processId: pid, prob: fields[1] === '' || fields[1] == null ? 10000 : Number(fields[1]) || 0, params: fields.slice(2).map(x => x.trim() === '' ? 0 : Number(x) || 0) });
  }
  return out;
}

// ---- master data ----
export class Master {
  constructor(tables) {
    const map = (name, key) => { const t = tables[name]; if (!t) return new Map(); const ki = t.cols.indexOf(key); const m = new Map(); for (const r of t.rows) { const o = {}; t.cols.forEach((c, i) => o[c] = r[i]); m.set(r[ki], o); } return m; };
    this.process = map('ProcessMst', 'PROCESS_ID');
    this.processCond = map('ProcessCondMst', 'PROCESS_COND_ID');
    this.buff = map('BuffMst', 'BUFF_ID');
    this.passive = map('PassiveSkillMst', 'PASSIVE_SKILL_ID');
    this.skill = map('SkillMst', 'SKILL_ID');
    this.bullet = map('BulletMst', 'BULLET_ID');
    this.unitDress = map('UnitDressMst', 'UNIT_DRESS_ID');
    this.itemEquip = map('ItemEquipMst', 'ITEM_EQUIP_ID');
    // out-of-battle panel sources (dist/engine/panel.mjs): rows grouped by unit dress / growth id
    const group = (name, key) => { const t = tables[name], out = new Map(); if (!t) return out; const ki = t.cols.indexOf(key); for (const r of t.rows) { const o = {}; t.cols.forEach((c, i) => o[c] = r[i]); if (!out.has(r[ki])) out.set(r[ki], []); out.get(r[ki]).push(o); } return out; };
    this.awake = group('UnitDressAwakeMst', 'UNIT_DRESS_ID');
    this.limitBreak = group('UnitDressLimitbreakMst', 'UNIT_DRESS_ID');
    this.abilityPieces = group('UnitDressAbilityPieceMst', 'UNIT_DRESS_ID');
    this.growth = map('GrowthMst', 'GROWTH_ID');
    this.equipGrowth = map('ItemEquipParameterGrowthMst', 'EQUIP_GROWTH_TYPE');
    // targets: boss-class monsters and their own passives (a separate id space from PassiveSkillMst)
    this.monster = map('MonsterMst', 'MONSTER_ID');
    this.monsterPassive = map('MonsterPassiveSkillMst', 'MONSTER_PASSIVE_SKILL_ID');
    // crests (徽章, engine/crests.json on demand): the crest's own stats and the trait passive groups
    this.crest = map('CrestMst', 'CREST_ID');
    this.crestTraitGroup = group('CrestTraitParameterGroupMst', 'CREST_TRAIT_PARAMETER_GROUP_NUMBER');
    this.bulletLv = new Map();
    const bl = tables.BulletLvInfoMst;
    if (bl) { const bi = bl.cols.indexOf('BULLET_ID'), li = bl.cols.indexOf('LV'); for (const r of bl.rows) { const o = {}; bl.cols.forEach((c, i) => o[c] = r[i]); if (!this.bulletLv.has(r[bi])) this.bulletLv.set(r[bi], new Map()); this.bulletLv.get(r[bi]).set(r[li], o); } }
    this._segments = new Map();
  }
  // Adds rows of further bundles (e.g. engine/monsters.json loaded on demand) to the existing maps.
  merge(tables) {
    const add = (name, key, target) => { const t = tables[name]; if (!t) return; const ki = t.cols.indexOf(key); for (const r of t.rows) { const o = {}; t.cols.forEach((c, i) => o[c] = r[i]); if (!target.has(r[ki])) target.set(r[ki], o); } };
    add('MonsterMst', 'MONSTER_ID', this.monster); add('MonsterPassiveSkillMst', 'MONSTER_PASSIVE_SKILL_ID', this.monsterPassive);
    add('PassiveSkillMst', 'PASSIVE_SKILL_ID', this.passive); add('SkillMst', 'SKILL_ID', this.skill); add('BulletMst', 'BULLET_ID', this.bullet);
    add('CrestMst', 'CREST_ID', this.crest);
    const g = tables.CrestTraitParameterGroupMst;
    if (g) { const ki = g.cols.indexOf('CREST_TRAIT_PARAMETER_GROUP_NUMBER'); for (const r of g.rows) { const o = {}; g.cols.forEach((c, i) => o[c] = r[i]); if (!this.crestTraitGroup.has(r[ki])) this.crestTraitGroup.set(r[ki], []); this.crestTraitGroup.get(r[ki]).push(o); } }
  }
  processSegments(processInfo) {
    if (!this._segments.has(processInfo)) this._segments.set(processInfo, parseProcessInfo(processInfo));
    return this._segments.get(processInfo);
  }
  bulletLevel(bulletId, level) {
    const levels = this.bulletLv.get(bulletId); if (!levels) return null;
    if (levels.has(level)) return levels.get(level);
    let best = null; for (const [lv, row] of levels) if (lv <= level && (!best || lv > best.LV)) best = row;
    return best || levels.get(Math.min(...levels.keys()));
  }
  skillInfo(skillId) {
    const s = this.skill.get(skillId); if (!s) return null;
    const killer = parseInts(s.KILLER_INFO);
    const target = parseInts(s.TARGET_INFO);
    return { skillId: s.SKILL_ID, name: s.NAME, skillType: s.SKILL_TYPE, skillRole: parseInts(s.SKILL_ROLE), skillRoleDetail: parseInts(s.SKILL_ROLE_DETAIL), elem: s.ELEM, weaponElem: s.INHERIT_WEAPON_ELEM, killer: killer[0] || 0, killerValue: killer[1] || 0, needAp: s.NEED_AP, useCnt: s.USE_CNT, invokeCost: s.INVOKE_COST, absoluteLv: s.ABSOLUTE_LV, multiCast: parseInts(s.SKILL_PARAM)[1] || 0, targetSide: target[0] || 0, targetType: target[1] || 0, cost: s.COST, kind: 0 };
  }
}

// ---- helpers for nested Lua-value stores ----
const pathOf = key => Array.isArray(key) ? key.map(String) : key instanceof LuaTable ? key.toArray().map(String) : [String(key)];
function plainValue(v) {
  if (v instanceof LuaTable) { const o = {}; for (const [k, item] of v.entries()) o[String(k)] = plainValue(item); return o; }
  if (Array.isArray(v)) { const o = {}; v.forEach((item, i) => { if (item != null) o[String(i + 1)] = plainValue(item); }); return o; }
  return v;
}
function getPath(root, path) { let cur = root; for (const k of path) { if (cur == null || typeof cur !== 'object') return undefined; cur = cur[k]; } return cur; }
function setPath(root, path, value) { let cur = root; for (let i = 0; i < path.length - 1; i++) { if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') cur[path[i]] = {}; cur = cur[path[i]]; } cur[path[path.length - 1]] = value; }
function toLua(v) {
  if (v && typeof v === 'object') { const t = new LuaTable(); for (const [k, item] of Object.entries(v)) t.set(/^-?\d+$/.test(k) ? Number(k) : k, toLua(item)); return t; }
  return v;
}
function csCalc(calc, old, val) {
  old = old ?? 0;
  switch (calc) { case 0: return val; case 1: return old + val; case 2: return old - val; case 3: return old * val; case 5: return val === 0 ? old : old / val; case 8: return val === 0 ? old : old % val; case 15: return Math.min(old, val); case 16: return Math.max(old, val); default: return val; }
}
const listOf = v => v == null ? [] : Array.isArray(v) ? v : v instanceof LuaTable ? v.toArray() : [v];

// ---- battle ----
export class Battle {
  constructor(master, scripts, options = {}) {
    this.master = master;
    this.options = { probability: 'assume', log: null, ...options };
    this.units = new Map();
    this.nextId = 1;
    this.DUMMY = 9999; // GetDummyUnitID: a valid-but-empty unit the scripts fall back to
    this.nextUid = 1;
    this.fieldValues = {};
    this.wave = 1;
    this.frame = 0;
    this.stack = []; // current process contexts (innermost last)
    this._buffChangeDepth = 0; this._buffChangePending = new Set();
    this.trace = [];
    this.unsupported = new Map();
    this.assumptions = new Set(); // simplifications the sandbox made (reported to the user)
    this.collisions = new Map(); this.nextCollision = 1; this.scores = {};
    this.host = new LuaHost({ natives: this.natives(), onUnknownNative: (name, args) => { this.unsupported.set(name, (this.unsupported.get(name) || 0) + 1); this.log('native-missing', name, args); return undefined; }, log: (k, m) => this.log(k, m) });
    this.host.registerAll(NATIVE_NAMES);
    this.host.setGlobal('procTrigger', 0); this.host.setGlobal('ownUnit', 0);
    for (const name of ['luaCommon', 'procCondCommon', 'condition', 'process', 'battleScriptCommon']) if (scripts[name]) this.host.load(scripts[name], name);
    this.host.load(CONTEXT_STACK_LUA, '__sandbox');
  }
  log(kind, ...rest) { if (this.options.log) this.options.log(kind, ...rest); }
  // Clears every unit and battle state so the loaded VM can run another scenario.
  reset() { this.units = new Map(); this.nextId = 1; this.nextUid = 1; this.fieldValues = {}; this.wave = 1; this.frame = 0; this.stack = []; this.trace = []; this.timeline = null; this.assumptions = new Set(); this.collisions = new Map(); this.nextCollision = 1; this.scores = {}; }
  // BattleControl: battle scores, timers and 領域展開 collisions. The sandbox has no positions, so every
  // alive unit counts as inside every area (flagged as an assumption).
  battleControl(code, ...a) {
    switch (code) {
      case 100: return this.scores[a[0]] || 0;
      case 101: this.scores[a[0]] = (this.scores[a[0]] || 0) + (a[1] || 0); return true;
      case 102: case 103: this.scores[a[0]] = a[1] || 0; return true;
      case 150: return 0;
      case 210: return 0; case 211: return 0; case 212: return Math.floor(this.frame / 60); case 213: case 214: return true;
      case 451: { const id = this.nextCollision++; this.collisions.set(id, { id, owner: a[0], collisionId: a[8], active: true }); this.assumptions.add('领域展开：沙盒没有位置，按所有单位都在领域范围内计算'); return id; }
      case 452: { const c = this.collisions.get(a[0]); if (c) c.active = false; return true; }
      case 453: return [...this.collisions.values()].filter(c => c.active && c.owner === a[0]).map(c => c.id);
      case 454: case 456: return this.collisions.get(a[0])?.active ? this.aliveUnits().map(u => u.id) : [];
      case 455: return this.collisions.get(a[0])?.owner ?? 0;
      case 457: return !!this.collisions.get(a[0])?.active;
      case 620: return false;
      default: return undefined;
    }
  }
  get current() { return this.stack[this.stack.length - 1] || null; }

  // ---- units ----
  addUnit(spec) {
    const id = this.nextId++;
    const u = {
      id, name: spec.name || `unit${id}`, side: spec.side ?? K.SIDE.ALLY, unitDressId: spec.unitDressId || 0, monsterId: spec.monsterId || 0, isBoss: !!spec.isBoss, level: spec.level || 1, limitBreak: spec.limitBreak || 0, awake: spec.awake || 0,
      charTypes: spec.charTypes || [], gender: spec.gender || 0,
      pure: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 100, 8: 0, 96: 1, 33: 0, 39: 0, ...spec.stats },
      hp: null, mp: null, vit: 0, alive: true, excluded: false, index: this.units.size,
      equips: spec.equips || [], elemResist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, ...(spec.elemResist || {}) }, statResist: {},
      status: [], real: [], work: [], // control entries
      instances: [], buffs: [], values: {}, procValues: {}, personality: spec.personality || [], passiveIds: [], skills: spec.skills || [],
      combo: 0, skillUsed: 0, castLevel: 0, state: 0,
    };
    u.hp = spec.hp ?? u.pure[96]; u.mp = spec.mp ?? u.pure[33];
    this.units.set(id, u);
    for (const p of spec.passives || []) if (p.processes) this.addProcesses(u, p); else this.addPassive(u, p.id ?? p, p.affiliation ?? K.AFF.AUTOSKILL, p.localId, p.level, p.params);
    return u;
  }
  // Instances given directly as process id + parameters (crest traits, support passives, ark effects the
  // battle report lists without a passive-skill row).
  addProcesses(u, spec) {
    const made = [];
    for (const p of spec.processes || []) {
      const inst = this.makeInstance({ owner: u.id, affiliation: spec.affiliation ?? K.AFF.NONE, localId: spec.localId ?? 0, localIndex: p.localIndex ?? 0, passiveId: 0, level: spec.level || 1, processId: p.processId, prob: p.prob ?? 10000, params: (p.params || []).slice() });
      if (inst) { u.instances.push(inst); made.push(inst); }
    }
    return made;
  }
  unit(id) { return this.units.get(Number(id)) || null; }
  aliveUnits() { return [...this.units.values()].filter(u => u.alive && !u.excluded); }

  // A passive (PassiveSkillMst) becomes one process instance per PROCESS_INFO segment.
  // `paramOverrides` ({segmentIndex: [params...]}) replaces master parameters with runtime ones, e.g. the
  // account's blessing levels (the reader reports the values the game actually loaded).
  addPassive(u, passiveId, affiliation = K.AFF.AUTOSKILL, localId = passiveId, level = 1, paramOverrides = null, table = 'passive') {
    const row = (table === 'monster' ? this.master.monsterPassive : this.master.passive).get(passiveId);
    if (!row) { this.log('missing-passive', passiveId); return []; }
    u.passiveIds.push(passiveId);
    const made = [];
    this.master.processSegments(row.PROCESS_INFO).forEach((seg, index) => {
      const override = paramOverrides && (paramOverrides[index] || paramOverrides[String(index)]);
      const inst = this.makeInstance({ owner: u.id, affiliation, localId: localId ?? passiveId, localIndex: index, passiveId, level, ...seg, params: override ? override.slice() : seg.params });
      if (inst) { u.instances.push(inst); made.push(inst); }
    });
    return made;
  }
  makeInstance({ owner, affiliation, localId, localIndex, passiveId, level, processId, prob, params, related }) {
    const mst = this.master.process.get(processId);
    if (!mst) { this.log('missing-process', processId); return null; }
    const cond = this.master.processCond.get(mst.PROCESS_COND) || { HAPPEN_COND: 0, LUA_FUNC_NAME: '' };
    return { uid: this.nextUid++, kind: 'process', owner, affiliation, localId, localIndex, passiveId: passiveId || 0, level: level || 1, processId, prob, params: params.slice(), mst, cond, trigger: cond.HAPPEN_COND, condParams: parseInts(mst.PROCESS_COND_PARAM), priority: mst.PRIORITY ?? 100, related: related || null, enabled: true, procValues: {} };
  }

  // ---- control entries (ProcControl2 targets) ----
  storeFor(dstType, dstUnit, bullet) {
    switch (dstType) {
      case K.TS.SUBJECT_WORK: case K.TS.SUBJECT_LOCAL: { const u = this.unit(this.current?.ownUnit ?? dstUnit); return u ? u.work : null; }
      case K.TS.UNIT_WORK: case K.TS.UNIT_LOCAL: { const u = this.unit(dstUnit); return u ? u.work : null; }
      case K.TS.SUBJECT_REAL: { const u = this.unit(this.current?.ownUnit ?? dstUnit); return u ? (this.current?.trigger === K.TRIG.STATUS ? u.status : u.real) : null; }
      case K.TS.UNIT_REAL: { const u = this.unit(dstUnit); return u ? (this.current?.trigger === K.TRIG.STATUS ? u.status : u.real) : null; }
      case K.TS.BULLET_WORK: case K.TS.BULLET_LOCAL: return (bullet || this.current?.bullet)?.work || null;
      case K.TS.BUFF_WORK: case K.TS.BUFF_LOCAL: case K.TS.BUFF_OWNER_WORK: case K.TS.BUFF_OWNER_LOCAL: { const b = this.current?.buff; if (!b) return null; b.work = b.work || []; return b.work; }
      default: return null;
    }
  }
  entriesFor(u, op, { work = false, bullet = null } = {}) {
    const out = [];
    for (const e of u.status) if (e.op === op) out.push(e);
    for (const e of u.real) if (e.op === op) out.push(e);
    if (work) for (const e of u.work) if (e.op === op) out.push(e);
    if (bullet) for (const e of bullet.work) if (e.op === op) out.push(e);
    return out;
  }
  // Two layers, each floor((base + Σval) × (1 + Σper/10000)) + Σadd: the persistent status layer
  // (trigger 1: passives such as INT+20%) forms the panel value; runtime entries (buffs, skill %)
  // add their percentages together on top of that panel value.
  finalStat(u, statType, { work = false, bullet = null, layer = 'runtime' } = {}) {
    if (statType === K.STAT.HP) return u.hp;
    if (statType === K.STAT.MP) return u.mp;
    if (statType === K.STAT.VIT) return u.vit;
    if (statType === K.STAT.TOTAL_MAX_HP) statType = K.STAT.MAX_HP;
    const op = Object.keys(STAT_OF_OP).find(k => STAT_OF_OP[k] === statType);
    const base = (u.pure[statType] ?? 0) + (u.panelGiven ? 0 : this.equipmentStat(u, statType));
    if (!op) return base;
    const sum = list => { let val = 0, per = 0, add = 0; for (const e of list) { val += e.params[0] || 0; per += e.params[1] || 0; add += e.params[2] || 0; } return { val, per, add }; };
    const s = sum(u.panelGiven ? [] : u.status.filter(e => e.op === Number(op)));
    const override = u.panelOverride?.[statType];
    const panel = override != null ? override : Math.floor((base + s.val) * (1 + s.per * 0.0001)) + s.add;
    if (layer === 'status') return panel;
    const runtime = [...u.real.filter(e => e.op === Number(op)), ...(work ? u.work.filter(e => e.op === Number(op)) : []), ...(bullet ? bullet.work.filter(e => e.op === Number(op)) : [])];
    const r = sum(runtime);
    // 圣物属性 from the calculator: flat, on the final value (最终攻击力 100 + 圣物 10 → 110; the user's rule)
    return Math.floor((panel + r.val) * (1 + r.per * 0.0001)) + r.add + (u.finalAdd?.[statType] || 0);
  }
  // Where a control entry came from (for showing a stat's calculation step by step): the process instance, buff
  // or bullet process whose run pushed it (procControl records its uid as `source`).
  sourceOf(uid) {
    if (!uid) return { kind: 'none' };
    const bullet = this.current?.bullet;
    const bi = bullet?.instances?.find(i => i.uid === uid);
    if (bi) return { kind: 'bullet', bulletId: bullet.bulletId, skillId: bullet.skillId };
    for (const u of this.units.values()) {
      const inst = u.instances.find(i => i.uid === uid);
      if (inst) return { kind: 'process', localId: inst.localId, passiveId: inst.passiveId, affiliation: inst.affiliation, processId: inst.processId };
      const b = u.buffs.find(x => x.uid === uid);
      if (b) return { kind: 'buff', buffId: b.buffId, buffName: b.mst?.NAME || '', localId: b.localId, affiliation: b.affiliation };
    }
    return { kind: 'unknown', uid };
  }
  // The parts of finalStat(): the bare value, each equipment piece (with its EquipParam raise), the status
  // (panel) entries and the runtime entries (buffs, this call's work, this bullet) — with their sources.
  statParts(u, statType, { work = false, bullet = null } = {}) {
    const op = Number(Object.keys(STAT_OF_OP).find(k => STAT_OF_OP[k] === statType));
    const entry = (e, layer) => ({ layer, val: e.params[0] || 0, per: e.params[1] || 0, add: e.params[2] || 0, source: this.sourceOf(e.source) });
    const equips = u.panelGiven ? [] : u.equips.map(e => {
      const v = e.stats?.[statType] || 0; if (!v) return null;
      let per = 0; for (const c of [...u.status, ...u.real]) if (c.op === K.OP.EQUIP_PARAM && c.params[0] === e.type && c.params[1] === statType) per += c.params[2] || 0;
      return { id: e.id, raw: v, per, value: per ? Math.floor(v * (1 + per * 0.0001) + 0.5) : v };
    }).filter(Boolean);
    return {
      stat: statType, pure: u.pure[statType] ?? 0, crest: u.panelGiven ? 0 : (u.crest?.stats?.[statType] || 0), equips, panelGiven: !!u.panelGiven, panelOverride: u.panelOverride?.[statType] ?? null,
      status: u.panelGiven ? [] : u.status.filter(e => e.op === op).map(e => entry(e, 'status')),
      runtime: [...u.real.filter(e => e.op === op).map(e => entry(e, 'real')), ...(work ? u.work.filter(e => e.op === op).map(e => entry(e, 'work')) : []), ...(bullet ? bullet.work.filter(e => e.op === op).map(e => entry(e, 'bullet')) : [])],
      panel: this.finalStat(u, statType, { layer: 'status' }), final: this.finalStat(u, statType, { work, bullet }), finalAdd: u.finalAdd?.[statType] || 0,
    };
  }
  // Equipment parameters enter the panel before the percentage layer (the crest's own parameters join them
  // unedited, UnitUtil.AddCrestParameter); EquipParam (319: equip type, stat,
  // per) from 特定装備時装備パラメータ増減 passives raises the piece's own value, percentages adding up
  // (洛琪希: staff INT 365 ×(1+100%), robe INT 229 ×(1+50%) → 344, robe MND 116 ×(1+100%+50%)).
  equipmentStat(u, statType) {
    let total = u.crest?.stats?.[statType] || 0;
    for (const e of u.equips) {
      const v = e.stats?.[statType] || 0; if (!v) continue;
      let per = 0;
      for (const c of [...u.status, ...u.real]) if (c.op === K.OP.EQUIP_PARAM && c.params[0] === e.type && c.params[1] === statType) per += c.params[2] || 0;
      total += per ? Math.floor(v * (1 + per * 0.0001) + 0.5) : v;
    }
    return total;
  }
  elemResist(u, elem, { work = true } = {}) {
    let v = u.elemResist[elem] ?? 0;
    for (const e of [...u.status, ...u.real, ...(work ? u.work : [])]) if (e.op === K.OP.ELEM_RESIST && (e.params[0] === elem || e.params[0] === -1)) v += e.params[1] || 0;
    return v;
  }
  removeEntriesBySource(sourceUid) {
    for (const u of this.units.values()) { u.status = u.status.filter(e => e.source !== sourceUid); u.real = u.real.filter(e => e.source !== sourceUid); u.work = u.work.filter(e => e.source !== sourceUid); }
  }

  // ---- buffs ----
  buffControl(unitId, buffId, params, contTrig, behaviours, options) {
    const u = this.unit(unitId); const mst = this.master.buff.get(buffId);
    if (!u || !mst) { this.log('missing-buff', buffId); return false; }
    const cur = this.current;
    const cond = this.master.processCond.get(mst.PROCESS_COND) || { HAPPEN_COND: 0, LUA_FUNC_NAME: '' };
    // The first buff parameter is always its duration in frames (-1 = permanent; PARAM_BEHAV_FLAME);
    // the scripts and native operations see the remaining parameters.
    const raw = listOf(params).map(x => x == null ? 0 : x);
    let beh = listOf(behaviours);
    if (beh[0] === K.PARAM_BEHAV.FLAME) beh = beh.slice(1);
    const p = raw.slice(1);
    const buff = { uid: this.nextUid++, kind: 'buff', buffId, mst, cond, trigger: cond.HAPPEN_COND, condParams: parseInts(mst.PROCESS_COND_PARAM), priority: mst.PRIORITY ?? 100, params: p, behaviours: beh, duration: raw[0] ?? -1, owner: u.id, subject: cur?.ownUnit ?? u.id, affiliation: K.AFF.SUB_BUFF | (cur?.affiliation ?? 0), localId: cur?.localId ?? buffId, localIndex: cur?.localIndex ?? 0, processId: cur?.processId ?? 0, related: cur ? { affiliation: cur.affiliation, localId: cur.localId, localIndex: cur.localIndex, processId: cur.processId, uid: cur.uid } : null, remain: -1, contTrig: contTrig || 0, options: options || {}, enabled: true, work: [], procValues: {}, category: mst.BUFF_CATEGORY, group: mst.BUFF_GROUP, isDebuff: mst.BUFF_TYPE === 1 || mst.BUFF_TYPE === 25 };
    buff.remain = buff.duration;
    // Same buff group replaces an existing one (a stronger value wins is handled by the scripts; keep the latest).
    if (buff.group) { const old = u.buffs.find(b => b.group === buff.group && b.buffId === buffId); if (old) this.removeBuff(u, old.uid); }
    // Buffs of one category (BUFF_CATEGORY, 0 = none) do not stack: only the strongest applies (the user's rule,
    // 2026-09-28 — 魔术指导 法强+65% and EX灵气 法强+50% are both 「魔力提升」 category 300 → +65% only). Two buffs of a
    // category with the same operation type are compared by their first differing parameter (by size); a weaker new
    // one is not applied, an equal or stronger one replaces the old. Different operation types are kept (logged).
    if (buff.category) {
      for (const old of u.buffs.filter(b => b.category === buff.category)) {
        if (old.mst.PROCESS_OPE_TYPE !== mst.PROCESS_OPE_TYPE) { this.log('buff-category-uncompared', u.name, old.buffId, buffId); continue; }
        let diff = 0; for (let i = 0; i < Math.max(old.params.length, p.length) && !diff; i++) diff = Math.abs(p[i] || 0) - Math.abs(old.params[i] || 0);
        if (diff < 0) { this.log('buff-category-weaker', u.name, buffId, mst.NAME, 'kept', old.buffId); return false; }
        this.log('buff-category-replace', u.name, old.buffId, '→', buffId); this.removeBuff(u, old.uid);
      }
    }
    u.buffs.push(buff);
    this.log('buff-add', u.name, buffId, mst.NAME, p);
    // "While this buff is on" (trigger 60) effects apply immediately and last until removal.
    if (buff.trigger === K.TRIG.ON_ADDED_BUFF) this.runInstance(buff, u, u, null, K.TRIG.ON_ADDED_BUFF);
    this.notifyBuffChange(u);
    return buff.uid;
  }
  // ChangeBuff (54) is delivered once after the current buff change settles, never re-entrantly
  // (a 54-triggered process may itself add buffs; the game evaluates the trigger per frame).
  notifyBuffChange(u) {
    if (this._buffChangeDepth > 0) { this._buffChangePending.add(u.id); return; }
    this._buffChangeDepth = 1; this._buffChangePending = new Set([u.id]);
    try {
      for (let round = 0; round < 4 && this._buffChangePending.size; round++) {
        const ids = [...this._buffChangePending]; this._buffChangePending = new Set();
        for (const id of ids) { const unit = this.unit(id); if (unit) this.dispatch(K.TRIG.CHANGE_BUFF, unit, unit, null); }
      }
    } finally { this._buffChangeDepth = 0; this._buffChangePending = new Set(); }
  }
  removeBuff(u, uid) {
    const i = u.buffs.findIndex(b => b.uid === uid); if (i < 0) return false;
    u.buffs.splice(i, 1); this.removeEntriesBySource(uid); this.notifyBuffChange(u); return true;
  }
  buffInfo(b) {
    const u = this.unit(b.owner);
    return new LuaTable(Object.entries({ buffId: b.buffId, name: b.mst.NAME, condition: b.mst.PROCESS_COND, condParam: b.condParams, method: b.mst.OPE_WAY, ope: b.mst.PROCESS_OPE_TYPE, source: b.mst.SOURCE, target: b.mst.TARGET, script: b.mst.USE_SCRIPT === 1, buffType: b.mst.BUFF_TYPE, category: b.category, group: b.group, subj: b.subject, owner: b.owner, uid: b.uid, remain: b.remain, iconId: b.mst.BUFF_ICON_ID, param: b.params.slice(), description: '', quote: b.options?.quote || null }));
  }

  // ---- process execution ----
  // Runs one process/buff instance: condition function → probability → script or native operation.
  runInstance(inst, owner, target, bullet, trigger, { force = false } = {}) {
    const ctx = { uid: inst.uid, inst, trigger, ownUnit: owner.id, target: target ? target.id : owner.id, bullet, buff: inst.kind === 'buff' ? inst : (this.current?.buff || null), affiliation: inst.affiliation, localId: inst.localId, localIndex: inst.localIndex, processId: inst.processId, succeeded: true, params: inst.params };
    const saved = this.saveGlobals();
    this.stack.push(ctx);
    this.host.setGlobal('procTrigger', trigger); this.host.setGlobal('ownUnit', owner.id);
    let fired = false;
    try {
      const funcName = inst.cond.LUA_FUNC_NAME;
      let ok = true;
      if (funcName && !force) {
        if (!this.host.hasFunction(funcName)) { this.log('missing-condition', funcName); ok = false; }
        else ok = !!this.host.call(funcName, [ctx.target, inst.condParams], 1)[0];
      }
      // a chance-based instance whose condition held but whose roll failed is still listed (missed), so the user can tick it
      let missed = false;
      if (ok && !force && inst.kind === 'process' && inst.prob < 10000) { ok = this.roll(inst); missed = !ok; }
      if (ok) {
        fired = true;
        if (inst.mst.USE_SCRIPT === 1) {
          const fn = (inst.kind === 'buff' ? 'buff' : 'process') + (inst.kind === 'buff' ? inst.buffId : inst.processId);
          // The native passes a fixed-size parameter array (missing entries read as 0).
          const padded = inst.params.slice(); while (padded.length < 12) padded.push(0);
          if (this.host.hasFunction(fn)) this.host.call(fn, [ctx.target, padded], 0);
          else this.log('missing-script', fn);
        } else this.nativeOperation(inst, ctx, owner, target);
      }
      this.trace.push({ trigger, owner: owner.name, target: target?.name, kind: inst.kind, id: inst.kind === 'buff' ? inst.buffId : inst.processId, name: inst.mst.NAME, ownerId: owner.id, localId: inst.localId, passiveId: inst.passiveId, index: inst.localIndex, prob: inst.kind === 'process' ? inst.prob : 10000, fired, missed, lottery: ctx.lottery || null, succeeded: ctx.succeeded });
    } catch (err) {
      this.log('script-error', inst.kind, inst.kind === 'buff' ? inst.buffId : inst.processId, err.message);
      this.trace.push({ trigger, owner: owner.name, kind: inst.kind, id: inst.kind === 'buff' ? inst.buffId : inst.processId, name: inst.mst.NAME, error: err.message });
    } finally {
      this.stack.pop();
      this.restoreGlobals(saved);
    }
    return fired && ctx.succeeded;
  }
  // Chance rolls: the instance's own probability (roll) and the scripts' own lottery() calls (chance).
  // A key is `${owner unit}:${localId}:${segment}` (the attacker's and the boss's passives share ids).
  chance(inst, rate) {
    const key = `${inst.owner}:${inst.localId}:${inst.localIndex}`;
    if (this.options.forced?.has(key)) return true; // explicitly assumed (per instance)
    if (this.options.skipped?.has(key)) return false;
    const mode = this.options.probability;
    if (mode === 'assume') return true;
    if (mode === 'skip') return false;
    return Math.random() * 10000 < rate;
  }
  roll(inst) { return this.chance(inst, inst.prob); }
  // USE_SCRIPT=0 rows: OPE_INFO / PROCESS_OPE_TYPE is a ControlType applied through ProcControl2 with the
  // parameters picked out by PARAM_BEHAVIOR (process) or the buff's behaviours (VAL/PER/ADD → 0/1/2).
  nativeOperation(inst, ctx, owner, target) {
    const op = inst.kind === 'buff' ? inst.mst.PROCESS_OPE_TYPE : inst.mst.OPE_INFO;
    if (!op) return;
    const behaviours = inst.kind === 'buff' ? inst.behaviours : parseInts(inst.mst.PARAM_BEHAVIOR);
    const params = [0, 0, 0, 0];
    const slot = { [K.PARAM_BEHAV.VAL]: 0, [K.PARAM_BEHAV.PER]: 1, [K.PARAM_BEHAV.ADD]: 2, [K.PARAM_BEHAV.RESULT_ADD]: 0, [K.PARAM_BEHAV.RESULT_PER]: 0 };
    let used = 0;
    behaviours.forEach((b, i) => { if (b in slot && inst.params[i] != null) { params[slot[b]] = inst.params[i]; used++; } });
    if (!used) inst.params.forEach((v, i) => { if (i < 4) params[i] = v; });
    const src = inst.mst.SOURCE || K.TS.SUBJECT_WORK, dst = inst.mst.TARGET || (inst.kind === 'buff' ? K.TS.UNIT_REAL : K.TS.SUBJECT_REAL);
    const dstUnit = dst === K.TS.UNIT_REAL || dst === K.TS.UNIT_WORK ? (inst.kind === 'buff' ? owner.id : ctx.target) : owner.id;
    this.procControl(src, owner.id, dst, dstUnit, op, params, inst.kind === 'buff' ? K.LIFE.NORMAL : K.LIFE.NORMAL, false);
  }
  // A native called from a script (e.g. Bullet:Damage → ProcControl2) re-enters Lua for the damage
  // triggers; Field:FrameUpdate then rewrites the script globals (this/target/units/Bullet/...), so the
  // outer script's view is saved on a Lua-side stack before the nested calls and restored afterwards.
  saveGlobals() { const nested = this.stack.length > 0; if (nested) this.host.call('__sandboxSaveContext', [], 0); return nested; }
  restoreGlobals(saved) { if (saved) this.host.call('__sandboxRestoreContext', [], 0); }

  // Fire a trigger for the owner's own instances (passives + buffs), highest PRIORITY first.
  dispatch(trigger, owner, target, bullet) {
    const list = [...owner.instances.filter(i => i.enabled && i.trigger === trigger), ...owner.buffs.filter(b => b.enabled && b.trigger === trigger)];
    list.sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));
    // LIFETYPE_CONTINUOUS (3) controls last until their trigger is evaluated again.
    const uids = new Set(list.map(i => i.uid));
    if (uids.size) for (const u of this.units.values()) { u.real = u.real.filter(e => !(e.lifeType === K.LIFE.CONTINUOUS && uids.has(e.source))); u.status = u.status.filter(e => !(e.lifeType === K.LIFE.CONTINUOUS && uids.has(e.source))); }
    for (const inst of list) this.runInstance(inst, owner, target || owner, bullet, trigger);
  }

  // ---- snapshot / restore (evaluate several random rolls or crit branches from one prepared state) ----
  snapshot() { return cloneState({ units: this.units, fieldValues: this.fieldValues, nextUid: this.nextUid, timeline: this.timeline, wave: this.wave, frame: this.frame, traceLength: this.trace.length }); }
  restore(snap) {
    const copy = cloneState(snap);
    this.units = copy.units; this.fieldValues = copy.fieldValues; this.nextUid = copy.nextUid; this.timeline = copy.timeline; this.wave = copy.wave; this.frame = copy.frame;
    this.trace.length = snap.traceLength; this.stack = [];
  }

  // ---- ProcControl2: the native operation switchboard ----
  procControl(srcType, srcUnit, dstType, dstUnit, op, params, lifeType = 0, forceShow = false) {
    const p = listOf(params).map(x => (x == null ? 0 : x));
    if (op === K.OP.PHYS_DMG || op === K.OP.MAG_DMG) return this.damageOperation(op, p, srcType, srcUnit, dstUnit);
    if (op === 836) { const b = this.current?.bullet; if (b) b.cancelled = true; return !!b; } // CancelBullet
    if (op === 801) { // 追加ダメージ: its amount is computed by the game's native code, not in the scripts
      const cur = this.current, name = String(this.master.passive.get(cur?.inst?.passiveId || cur?.localId)?.NAME || this.master.itemEquip.get(cur?.localId)?.NAME || cur?.localId || '').replace(/<[^>]+>/g, '');
      this.assumptions.add(`追加伤害：${name} 的追加伤害没有算进去（伤害量由游戏程序本体计算，不在游戏脚本里）`);
      return false;
    }
    const store = this.storeFor(dstType, dstUnit);
    if (!store) { this.log('control-no-store', dstType, dstUnit, op, p); return false; }
    const cur = this.current;
    store.push({ op, params: p, lifeType, srcType, srcUnit, dstType, dstUnit, source: cur?.buff?.uid ?? cur?.uid ?? 0, layer: cur?.trigger === K.TRIG.STATUS ? 'status' : 'runtime' });
    this.log('control', dstType, dstUnit, op, p, lifeType);
    return true;
  }

  // Start casting a skill: the active-skill/timeline context the BeforeSkill (18) conditions read.
  beginSkill(owner, target, skillId) {
    const skill = this.master.skill.get(skillId);
    const type = skill?.SKILL_TYPE ?? K.SKILL.SKILL;
    const index = owner.skills.filter(s => s.type === type).findIndex(s => s.id === skillId) + 1;
    this.timeline = { owner: owner.id, target: target.id, skillId, skillType: type, skillIndex: index || 1, puid: this.nextUid++ };
    owner.activeSkill = { id: skillId, type, index: index || 1, target: target.id, puid: this.timeline.puid };
    owner.skillUsed++;
    // a magic is chanted first: 16 (before the chant), then the standby state (59, 「特定スキルを詠唱した時」)
    if (type === K.SKILL.MAGIC) { this.dispatch(K.TRIG.BEFORE_CHANT, owner, owner); this.setState(owner, K.STATE.STANDBY); }
    this.dispatch(K.TRIG.BEFORE_SKILL, owner, owner);
    // activation: the main state (59, 「特定スキルを発動した時」 — e.g. 星眼, 全力以赴的一擊)
    this.setState(owner, K.STATE.MAIN);
    return this.timeline;
  }
  // A unit's state (UnitGetState); every change fires 59. Returning to idle after a cast is silent (idle-state
  // effects such as a boss's 待機状態 checks are not part of one cast).
  setState(u, state, { silent = false } = {}) { if (u.state === state) return; u.state = state; if (!silent) this.dispatch(K.TRIG.UNIT_STATE, u, u); }

  // ---- bullets & the damage pipeline ----
  // bulletSpec: {skillId, bulletId, level, dmgRatio, hitIndex, elementOverride}
  createBullet(owner, target, spec) {
    const skill = this.master.skillInfo(spec.skillId) || { skillType: K.SKILL.SKILL, skillRole: [1], skillRoleDetail: [10], elem: 0, weaponElem: 0, killer: 0, killerValue: 0, multiCast: false };
    const lvRow = this.master.bulletLevel(spec.bulletId, spec.level ?? 1);
    const segments = lvRow ? this.master.processSegments(lvRow.PROCESS_INFO) : [];
    const weaponElem = owner.equips.find(e => e.pos === 1)?.elem ?? 0;
    const element = spec.elementOverride ?? (skill.weaponElem && skill.elem === 0 ? weaponElem : skill.elem);
    const b = { uid: this.nextUid++, owner: owner.id, target: target.id, skillId: spec.skillId, skill, bulletId: spec.bulletId, level: spec.level ?? 1, lvRow, segments, dmgRatio: spec.dmgRatio ?? 10000, hitIndex: spec.hitIndex ?? 0, element, work: [], values: {}, edits: [], damage: 0, orgDamage: 0, lastDamage: 0, critical: !!spec.critical, random: spec.random ?? 1, killer: false, puid: this.timeline && this.timeline.skillId === spec.skillId && this.timeline.owner === owner.id ? this.timeline.puid : this.nextUid++, instances: [], results: [] };
    b.instances = segments.map((seg, i) => this.makeInstance({ owner: owner.id, affiliation: K.AFF.NONE, localId: spec.bulletId, localIndex: i, processId: seg.processId, prob: seg.prob, params: seg.params })).filter(Boolean);
    this.dispatch(K.TRIG.BEFORE_CREATE_BULLET, owner, target, b);
    return b;
  }
  // One bullet hit. 二刀流 (control 808 with a weapon in the armour slot, physical bullets) and 多段魔法
  // (MultiBullet control 825) make the native call the bullet process twice, every call at the reduced
  // damage ratio (e.g. 6000 = 60% each: 「連撃数が2倍、毎回のダメージは60%」). Hit indexes are 1-based;
  // BulletHit/BulletWasHit (21/22) run before each call and may rewrite the ratio or cancel the call
  // (that is how 水王級魔術師 restores non-ice attacks to one full hit).
  hit(bullet) {
    const owner = this.unit(bullet.owner), target = this.unit(bullet.target);
    bullet.results = [];
    const passes = [{ hitIndex: 1, dmgRatio: 10000, weaponIndex: 0 }];
    const controls = [...owner.status, ...owner.real];
    const subWeapon = owner.equips.find(e => e.pos === 2 && e.type >= 10 && e.type < 20);
    const physical = bullet.segments.some(seg => seg.processId >= 10000 && seg.processId < 10100);
    const dual = controls.find(e => e.op === 808);
    const multi = controls.find(e => e.op === K.OP.MULTI_BULLET);
    if (dual && subWeapon && physical) { passes[0].dmgRatio = dual.params[0] || 10000; passes.push({ hitIndex: 2, dmgRatio: dual.params[0] || 10000, weaponIndex: 1 }); }
    else if (multi && bullet.skill.skillType === K.SKILL.MAGIC) { passes[0].dmgRatio = multi.params[0] || 10000; passes.push({ hitIndex: 2, dmgRatio: multi.params[0] || 10000, weaponIndex: 0 }); }
    if (bullet.singlePass) passes.length = 1;
    for (const pass of passes) {
      // each call is a new bullet process: transient work stores start empty again
      owner.work = []; target.work = [];
      bullet.hitIndex = pass.hitIndex; bullet.dmgRatio = pass.dmgRatio; bullet.weaponIndex = pass.weaponIndex; bullet.cancelled = false; bullet.work = [];
      this.dispatch(K.TRIG.BULLET_HIT, owner, target, bullet);
      this.dispatch(K.TRIG.BULLET_WAS_HIT, target, owner, bullet);
      if (bullet.cancelled) { bullet.results.push({ hitIndex: pass.hitIndex, cancelled: true, damage: 0 }); continue; }
      const list = bullet.instances.filter(i => i.trigger === K.TRIG.BULLET_PROCESS).sort((a, b) => b.priority - a.priority);
      for (const inst of list) this.runInstance(inst, owner, target, bullet, K.TRIG.BULLET_PROCESS);
      this.dispatch(K.TRIG.PRE_AFTER_ATTACK, owner, target, bullet);
      this.dispatch(K.TRIG.PRE_AFTER_DAMAGE, target, owner, bullet);
      this.dispatch(K.TRIG.AFTER_ATTACK, owner, target, bullet);
      this.dispatch(K.TRIG.AFTER_DAMAGE, target, owner, bullet);
    }
    return bullet.results;
  }
  // ProcessWork.ProcControlDamage → CalcDamage, in the native order.
  damageOperation(op, p, srcType, srcUnit, dstUnit) {
    const ctx = this.current; const bullet = ctx?.bullet;
    const owner = this.unit(srcUnit || ctx?.ownUnit), target = this.unit(dstUnit);
    if (!owner || !target || !bullet) { this.log('damage-no-context', op, p); return false; }
    const magical = op === K.OP.MAG_DMG;
    const per = p[0] || 0;
    const atkStat = p[1] ? p[1] - 1 : (magical ? K.STAT.INT : K.STAT.STR);
    const defStat = p[2] ? p[2] - 1 : (magical ? K.STAT.MND : K.STAT.DEF);
    // Bullet-level triggers 23 (attacker) / 24 (defender) edit the work stores before the core.
    this.dispatch(K.TRIG.ON_CALC_ATTACK, owner, target, bullet);
    this.dispatch(K.TRIG.ON_CALC_DAMAGE, target, owner, bullet);
    const attack = this.finalStat(owner, atkStat, { work: true, bullet });
    let defense = this.finalStat(target, defStat, { work: true });
    // The break state's defense change comes from the target's own Break passives (fired by setupBattle);
    // options.breakDefenseRatio is the calculator's extra Break 时防御倍率 (default 1), reported when it is not 1.
    if (target.breakRemain > 0 && this.options.breakDefenseRatio != null) defense = f32(defense * this.options.breakDefenseRatio);
    const element = this.bulletElement(bullet);
    const resist = element === 0 ? 0 : this.elemResist(target, element);
    const elementFactor = f32(1 - clamp(f32(resist / 100), -9.99, 1));
    const killer = this.isKiller(bullet, owner, target);
    let killerPower = 0; for (const e of this.entriesFor(owner, K.OP.KILLER_POWER, { work: true, bullet })) killerPower += e.params[0] || 0;
    const killerFactor = killer ? f32(f32(1.5) * Math.max(f32(1 + f32(killerPower / 10000)), 0)) : 1;
    let offense = 1; for (const e of this.entriesFor(owner, K.OP.DMG_POWER, { work: true, bullet })) offense = f32(offense * Math.max(f32(1 + f32((e.params[0] || 0) / 10000)), 0));
    let received = 1; for (const e of this.entriesFor(target, K.OP.DMG_POWER, { work: true })) received = f32(received * Math.max(f32(1 + f32((e.params[0] || 0) / 10000)), 0));
    let reduction = 1; for (const e of this.entriesFor(target, magical ? K.OP.REDUCTION_MAG : K.OP.REDUCTION_PHYS, { work: true })) reduction = f32(reduction * f32(1 - (e.params[0] || 0) / 10000));
    const invalid = this.entriesFor(target, K.OP.INVALID_DMG, { work: true }).length > 0;
    // coefficient: the single-precision skill ratio times the call's damage ratio as a double
    // Both factors are per-10000 integers scaled by the float constant 0.0001f before the float multiply:
    // 5200 → 0.51999998 × 6000 → 0.59999996 = 0.311999977 (洛琪希) and 3410 × 6000 → 0.204599977 (亞克), the
    // base_ratio the damage reader captures; dividing by 10000 in double lands one ulp off for 3410.
    let q = f32(f32(per * f32(0.0001)) * f32(bullet.dmgRatio * f32(0.0001)));
    // The calculator's 双刀 switch (双刀信息: 单段伤害倍率 at 修正试算位置), applied as the old rules do, with no
    // check of gear or skills: 'core' multiplies the core coefficient here; 'beforeCap' / 'afterCap' below.
    const hitScale = this.options.hitScale;
    if (hitScale?.stage === 'core') q = f32(q * f32(hitScale.ratio));
    q = f32(q * elementFactor); q = f32(q * killerFactor); q = f32(q * f32(offense * received)); q = f32(q * reduction);
    const critical = bullet.critical;
    const exponent = attack > 0 ? f32(f32(defense / attack) * (critical ? 6 : 10)) : 0;
    const base = attack > 0 ? f32(f32(Math.pow(f32(0.9), exponent)) * attack) : 0;
    let damage = elementFactor <= 0 || invalid ? 0 : Math.trunc(f32(f32(base * q) * f32(bullet.random)));
    bullet.orgDamage = damage; bullet.damage = damage; bullet.killer = killer;
    const core = { attack, defense, element, resist, elementFactor, killer, killerFactor, offense, received, reduction, per, dmgRatio: bullet.dmgRatio, critical, random: bullet.random, base, q, coreDamage: damage };
    // what this very hit gets (the move's own bonuses included): its critical rate and the parts of its attack stat
    const crt = this.finalStat(owner, K.STAT.CRT, { work: true, bullet });
    const breakdown = { attack: this.statParts(owner, atkStat, { work: true, bullet }), crit: this.statParts(owner, K.STAT.CRT, { work: true, bullet }), cap: [] };
    // After-calc triggers 27 (attacker) / 28 (defender): scripts call ProcEditProcDamage with rounded values.
    this.dispatch(K.TRIG.AFTER_CALC_ATTACK, owner, target, bullet);
    this.dispatch(K.TRIG.AFTER_CALC_DAMAGE, target, owner, bullet);
    damage = bullet.damage;
    if (hitScale?.stage === 'beforeCap' && hitScale.ratio !== 1 && damage > 0) damage = Math.trunc(damage * hitScale.ratio);
    // Damage limit: 9999 base, DmgLimitUp {val, per, add} on the bullet work, DmgLimitOff replaces it.
    let cap = 9999, capVal = 0, capPer = 0, capAdd = 0, capOff = null;
    const capPart = (e, layer) => breakdown.cap.push({ layer, val: e.params[0] || 0, per: e.params[1] || 0, add: e.params[2] || 0, source: this.sourceOf(e.source) });
    for (const e of bullet.work) { if (e.op === K.OP.DMG_LIMIT_UP) { capVal += e.params[0] || 0; capPer += e.params[1] || 0; capAdd += e.params[2] || 0; capPart(e, 'bullet'); } if (e.op === K.OP.DMG_LIMIT_OFF) { capOff = e.params[0]; breakdown.capOff = { value: capOff, source: this.sourceOf(e.source) }; } }
    for (const [layer, list] of [['status', owner.status], ['real', owner.real], ['work', owner.work]]) for (const e of list) { if (e.op === K.OP.DMG_LIMIT_UP) { capVal += e.params[0] || 0; capPer += e.params[1] || 0; capAdd += e.params[2] || 0; capPart(e, layer); } }
    cap = capOff != null ? capOff : Math.floor((9999 + capVal) * (1 + capPer * 0.0001)) + capAdd;
    const capComputed = cap;
    const uncapped = Math.max(damage, 1);
    let finalDamage = damage <= 0 ? 0 : clamp(uncapped, 1, cap);
    if (hitScale?.stage === 'afterCap' && hitScale.ratio !== 1 && finalDamage > 0) finalDamage = Math.max(1, Math.trunc(finalDamage * hitScale.ratio));
    bullet.lastDamage = finalDamage;
    target.hp = Math.max(0, target.hp - finalDamage);
    const result = { ...core, hitIndex: bullet.hitIndex, afterPassives: damage, cap, capComputed, capVal, capPer, capAdd, uncapped, damage: finalDamage, edits: bullet.edits.slice(), crt, breakdown };
    bullet.edits = [];
    bullet.results.push(result);
    this.log('damage', result);
    return true;
  }
  bulletElement(bullet) {
    const owner = this.unit(bullet.owner);
    for (const e of [...bullet.work, ...owner.work, ...owner.real]) if (e.op === K.OP.OVERRIDE_ELEMENT) return e.params[0];
    // a weapon-element skill takes the element of the weapon swung in this call (sub weapon on the second)
    if (bullet.skill.weaponElem && bullet.skill.elem === 0 && bullet.weaponIndex) return owner.equips.find(e => e.pos === 2)?.elem ?? bullet.element;
    return bullet.element;
  }
  // Character types the bullet has a killer against: the skill's KILLER_INFO plus Killer (308) controls.
  // options.killer (the calculator's 特攻 switch) overrides the skills: 'on' = every attack is a killer
  // against the target (so killer-bound bonuses of the skills apply), 'off' = never; unset = by the skills.
  killerTypes(bullet) {
    if (this.options.killer === 'off') return [];
    const owner = this.unit(bullet.owner);
    const out = new Set();
    if (bullet.skill.killer) out.add(bullet.skill.killer);
    for (const e of [...owner.status, ...owner.real, ...owner.work, ...bullet.work]) if (e.op === K.OP.KILLER && e.params[0]) out.add(e.params[0]);
    if (this.options.killer === 'on') for (const t of this.charTypesOf(this.unit(bullet.target))) out.add(t);
    return [...out];
  }
  // A target the user gave no race still has one in the game; with the killer forced on it stands in as
  // UNKNOWN_RACE so the scripts' "for each race of the target" loops have something to match.
  charTypesOf(u) { if (!u) return []; return u.charTypes.length || this.options.killer !== 'on' || u.side !== K.SIDE.OPPONENT ? u.charTypes.slice() : [K.UNKNOWN_RACE]; }
  isKiller(bullet, owner, target) {
    if (this.options.killer === 'on') return true;
    if (this.options.killer === 'off') return false;
    if (bullet.forceKiller) return true;
    const types = new Set(this.charTypesOf(target));
    return this.killerTypes(bullet).some(t => types.has(t));
  }

  // ---- natives ----
  natives() {
    const B = this;
    const cur = () => B.current;
    const curBullet = () => B.current?.bullet || null;
    const curBuff = () => B.current?.buff || null;
    const unitOf = id => B.unit(id);
    const listUnits = (side, cond) => {
      const me = B.unit(cur()?.ownUnit);
      return [...B.units.values()].filter(u => {
        if (side === K.TARGET_SIDE.ME) return me && u.id === me.id;
        if (side === K.TARGET_SIDE.ALLY) return me && u.side === me.side;
        if (side === K.TARGET_SIDE.OPPONENT) return me && u.side !== me.side;
        return true;
      }).filter(u => cond === K.TARGET_COND.ALIVE ? u.alive && !u.excluded : cond === K.TARGET_COND.DEAD ? !u.alive : cond === K.TARGET_COND.SECEDE ? u.excluded : !u.excluded).map(u => u.id);
    };
    // Native comparison helper shared by BulletGetSkillType/SkillRole/Element. mode 1 (CS_COMPARE_DIRECT)
    // compares literal values, mode 2 (CS_COMPARE_PARAM) reads process parameters at the given indices.
    // For skill types/roles 0 means "any"; for elements 0 is the literal no-element and -2 is "any".
    const compare = (mode, comp, actual, expand, zeroIsAny = true) => {
      const list = listOf(comp);
      if (list.length === 0 || list[0] == null) return true;
      const actuals = new Set(listOf(actual));
      const values = [];
      for (let i = 0; i < list.length; i++) {
        let v = list[i];
        if (mode === 2) { v = B.current?.params?.[v - 1] ?? 0; if (v === 0 && (zeroIsAny || i === 0)) return i === 0; }
        else if (v === 0 && zeroIsAny) return true;
        for (const x of expand(v)) values.push(x);
      }
      return values.some(v => actuals.has(v));
    };
    return {
      // --- master / battle info ---
      GetMasterInfo(masterType, id, paramNo, subId) {
        if (masterType === K.MASTER.SKILL) { const s = B.master.skillInfo(id); return s ? new LuaTable(Object.entries(s)) : null; }
        if (masterType === K.MASTER.BUFF) { const m = B.master.buff.get(id); return m ? new LuaTable(Object.entries({ buffId: m.BUFF_ID, name: m.NAME, condition: m.PROCESS_COND, condParam: parseInts(m.PROCESS_COND_PARAM), method: m.OPE_WAY, ope: m.PROCESS_OPE_TYPE, source: m.SOURCE, target: m.TARGET, script: m.USE_SCRIPT === 1, buffType: m.BUFF_TYPE, category: m.BUFF_CATEGORY, group: m.BUFF_GROUP, iconId: m.BUFF_ICON_ID, description: '' })) : null; }
        if (masterType === K.MASTER.UNIT_DRESS) { const d = B.master.unitDress.get(id); if (!d) return null; if (paramNo === 1) { const ps = parseInts(d.PERSONAL_SKILL); return ps[subId - 1] ?? 0; } return new LuaTable(Object.entries({ unitDressId: d.UNIT_DRESS_ID, name: d.NAME, unitId: d.UNIT_ID, characterType: d.CHARACTER_TYPE, personalSkill: parseInts(d.PERSONAL_SKILL), group: parseInts(d.CHARACTER_INFO) })); }
        B.log('native-partial', 'GetMasterInfo', masterType, id, paramNo, subId); return null;
      },
      GetBattleInfo(kind) { switch (kind) { case 4: return 0; case 5: return B.options.questId ?? 0; case 6: return 0; case 7: return 0; case 10: return B.options.questType ?? 0; case 700: return false; case 900: return [B.options.difficulty ?? 0]; case 1001: return false; default: B.log('native-partial', 'GetBattleInfo', kind); return 0; } },
      GetWaveCount() { return B.wave; },
      NumWaves() { return B.options.waves ?? 1; },
      GetWaveTimer() { return B.frame / 60; },   // seconds: Field:Time() (luaCommon.lua) multiplies it by OneSec
      GetDateTime() { return multi(...(B.options.dateTime || [2026, 1, 1, 12, 0, 0, 1])); },
      GetScriptStatus() { return false; },
      IsSucceeded() { return true; },
      GetOperationUnit() { return B.options.operationUnit ?? 1; },
      GetDummyUnitID() { return B.DUMMY; },
      IsDummyUnit(t) { return t === B.DUMMY; },
      IsValidUnit(t) { return t === B.DUMMY || !!B.unit(t); },
      UnitGetOperationUnit() { return B.options.operationUnit ?? 1; },
      // --- unit basics ---
      UnitGetName(t) { return t === B.DUMMY ? 'dummy' : (B.unit(t)?.name ?? 'nil'); },
      UnitSetName(t, n) { const u = B.unit(t); if (u) u.name = n; },
      UnitGetSide(t, opposit) { const u = B.unit(t); if (!u) return t === B.DUMMY ? K.SIDE.ALLY : -1; return opposit ? (u.side === K.SIDE.ALLY ? K.SIDE.OPPONENT : K.SIDE.ALLY) : u.side; },
      UnitIsAlive(t) { return !!B.unit(t)?.alive; },
      UnitIsExcluded(t) { return !!B.unit(t)?.excluded; },
      UnitIsExiled(t) { return false; },
      UnitGetIndex(t) { return B.unit(t)?.index ?? 0; },
      UnitGetUnitID(t, isMonster) { const u = B.unit(t); return u ? (isMonster ? u.monsterId : u.unitDressId) : 0; },
      UnitGetMonsterID(t) { const u = B.unit(t); return multi(u?.monsterId ?? 0, 0); },
      UnitGetCharacterID(t) { return B.unit(t)?.unitDressId ?? 0; },
      UnitGetLevel(t) { return B.unit(t)?.level ?? 1; },
      UnitGetCharType(t) { return B.charTypesOf(B.unit(t)); },
      UnitGetGender(t) { return B.unit(t)?.gender ?? 0; },
      UnitGetBossFlg(t) { return !!B.unit(t)?.isBoss; },
      UnitGetState(t) { return B.unit(t)?.state ?? 0; },
      // lottery() of the scripts (CONTEXT_STACK_LUA replaces it): a chance of the running instance, decided like
      // its own probability (the user's per-effect tick, off by default) and recorded so the effect is listed
      SandboxLottery(rate) {
        const ctx = cur(), r = Number(rate) || 0;
        if (r >= 10000) return true; if (r <= 0 || !ctx?.inst) return false;
        const hit = B.chance(ctx.inst, r);
        ctx.lottery = ctx.lottery === 'hit' || hit ? 'hit' : 'miss';
        return hit;
      },
      UnitGetList(side, cond) { return listUnits(side, cond); },
      GetUnits() { return [...B.units.keys()]; },
      UnitGetComboCount(t) { return B.unit(t)?.combo ?? 0; },
      UnitGetSkillUsed(t) { return B.unit(t)?.skillUsed ?? 0; },
      UnitGetCastLevel(t) { return B.unit(t)?.castLevel ?? 0; },
      UnitGetSp(t) { return B.unit(t)?.ether ?? 0; },
      // Break: the calculator's Break switch puts the target in the break state (setupBattle sets breakRemain)
      UnitGetBreakRemain(t) { return B.unit(t)?.breakRemain || 0; }, UnitGetBreakCount() { return 0; }, UnitGetBreakTime() { return 0; },
      UnitHaveCounter() { return false; }, UnitGetAimedCount() { return 0; }, UnitGetAimedList() { return []; },
      UnitGetSelectWeight() { return 100; }, UnitTotalSelectWeight() { return 100; },
      UnitGetBadStatus(t) { return []; },
      UnitGetRadius() { return 1; }, UnitGetDir() { return 1; }, UnitGetPos() { return multi(0, 0, 0); },
      UnitGetOpacity() { return 1; }, UnitGetScale() { return multi(1, 1, 1); },
      UnitGetTriggers() { return new LuaTable(); },
      UnitGetChangedAlives() { return []; },
      UnitGetActionHistory() { return []; },
      UnitCanAction() { return true; }, UnitCanUseSpecial() { return true; },
      UnitSavedLife() { return false; },
      // --- equipment ---
      UnitGetEquipID(t, pos) { const u = B.unit(t); return u?.equips.find(e => e.pos === pos)?.id ?? 0; },
      UnitGetEquipType(t, pos) { const u = B.unit(t); return u?.equips.find(e => e.pos === pos)?.type ?? 0; },
      UnitGetEquipElem(t, pos) { const u = B.unit(t); return u?.equips.find(e => e.pos === pos)?.elem ?? 0; },
      UnitGetWeaponType(t) { const u = B.unit(t); return u?.equips.find(e => e.pos === 1)?.type ?? 0; },
      // the armour type is 0 when a second weapon sits in the armour slot (二刀流); Unit:SubWeaponType() then
      // reads the slot's raw type through UnitGetEquipType
      UnitGetArmorType(t) { const u = B.unit(t); const type = u?.equips.find(e => e.pos === 2)?.type ?? 0; return type >= 20 ? type : 0; },
      UnitGetAccessoryElem(t) { const u = B.unit(t); return u ? u.equips.filter(e => e.pos === 3 || e.pos === 4).map(e => e.elem ?? 0) : []; },
      // --- stats ---
      UnitGetValue(t, statType, isReal, isFinal) {
        const u = B.unit(t); if (!u) return 0;
        if (isFinal === false) return statType === K.STAT.HP ? u.hp : statType === K.STAT.MP ? u.mp : (u.pure[statType === K.STAT.TOTAL_MAX_HP ? K.STAT.MAX_HP : statType] ?? 0);
        return B.finalStat(u, statType, { work: !isReal });
      },
      UnitGetElemResists(t, isFinal) { const u = B.unit(t); if (!u) return null; const out = new LuaTable(); for (let e = 1; e <= 6; e++) out.set(e, isFinal === false ? (u.elemResist[e] ?? 0) : B.elemResist(u, e)); return out; },
      UnitGetStatResists(t) { const out = new LuaTable(); for (const k of [1, 2, 3, 4, 5, 6, 10, 11, 12]) out.set(k, 0); return out; },
      // --- lua value stores ---
      UnitGetLuaValue(t, key) { const root = t == null ? B.fieldValues : B.unit(t)?.values; if (!root) return null; const v = getPath(root, pathOf(key)); return v === undefined ? null : toLua(v); },
      UnitSetLuaValue(t, key, val, ever) { const root = t == null ? B.fieldValues : B.unit(t)?.values; if (!root) return false; setPath(root, pathOf(key), plainValue(val)); return true; },
      UnitGetProperty(t, prop, ...args) {
        const u = B.unit(t);
        switch (prop) {
          case K.UNIT_PROPERTY.PROC_VALUE: { const [aff, lid, pindex, key] = args; const v = u?.procValues[`${aff}:${lid}:${pindex}:${key}`]; return v === undefined ? null : toLua(v); }
          case K.UNIT_PROPERTY.LIMITBREAK_LV: return u?.limitBreak ?? 0;
          case K.UNIT_PROPERTY.AWAKE_LV: return u?.awake ?? 0;
          case K.UNIT_PROPERTY.LEVEL: return u?.level ?? 1;
          case K.UNIT_PROPERTY.PERSONALITY_LV: { const pid = args[0]; const p = u?.personality.find(x => x.base === pid || x.passive === pid); return multi(p ? p.level : 0, p ? p.passive : 0); }
          case K.UNIT_PROPERTY.IS_REMOTE: return false;
          case K.UNIT_PROPERTY.IS_OWNER: return true;
          case K.UNIT_PROPERTY.ACTIVE_TIME: return B.frame / 60;
          case K.UNIT_PROPERTY.CAST_MIN_CLAMP: return 0;
          case K.UNIT_PROPERTY.ACTIVE_SKILL_PUID: return curBullet()?.puid ?? u?.activeSkill?.puid ?? 0;
          case K.UNIT_PROPERTY.IS_BUFF_BY_UID: return !!u?.buffs.find(b => b.uid === args[0]);
          case K.UNIT_PROPERTY.GET_BUFF_UID_BY_ID: return u?.buffs.find(b => b.buffId === args[0])?.uid ?? 0;
          case K.UNIT_PROPERTY.SKILL_LV: return 1;
          default: B.log('native-partial', 'UnitGetProperty', prop, args); return null;
        }
      },
      UnitSetProperty(t, prop, ...args) {
        const u = B.unit(t);
        switch (prop) {
          case K.UNIT_PROPERTY.CALC_LUA_VALUE: { const [key, calc, val] = args; const root = t == null ? B.fieldValues : u?.values; if (!root) return null; const path = pathOf(key); const now = csCalc(calc, getPath(root, path), val); setPath(root, path, now); return now; }
          case K.UNIT_PROPERTY.PROC_VALUE: { const [aff, lid, pindex, key, val] = args; if (u) u.procValues[`${aff}:${lid}:${pindex}:${key}`] = plainValue(val); return true; }
          default: B.log('native-partial', 'UnitSetProperty', prop, args); return null;
        }
      },
      // --- passives / buffs ---
      UnitGetPassiveList(t, affiliation) { const u = B.unit(t); if (!u) return []; return [...new Set(u.instances.filter(i => affiliation == null || i.affiliation === affiliation).map(i => i.localId))]; },
      UnitGetBuffs(t) { const u = B.unit(t); return u ? u.buffs.filter(b => !b.isDebuff).map(b => B.buffInfo(b)) : []; },
      UnitGetDebuffs(t) { const u = B.unit(t); return u ? u.buffs.filter(b => b.isDebuff).map(b => B.buffInfo(b)) : []; },
      GetBuffInfo(uid) { for (const u of B.units.values()) { const b = u.buffs.find(x => x.uid === uid); if (b) return B.buffInfo(b); } return null; },
      UnitGetChangedBuffs() { return []; },
      BuffControl(t, buffId, params, contTrig, behaviours, options) { return B.buffControl(t, buffId, params, contTrig, behaviours, options); },
      UnitRemoveBuff(t, uid) { const u = B.unit(t); return u ? B.removeBuff(u, uid) : false; },
      GetCurrentBuffUID() { return curBuff()?.uid ?? 0; },
      BuffGetValue(t, statType, isSample) { const u = B.unit(t); return u ? B.finalStat(u, statType) : 0; },
      GetBuffWork(index) { const b = curBuff(); return b ? (b.values?.[index] ?? null) : null; },
      SetBuffWork(index, val, calc) { const b = curBuff(); if (!b) return null; b.values = b.values || {}; b.values[index] = csCalc(calc || 0, b.values[index], val); return b.values[index]; },
      // --- process context ---
      ProcGetOwner() { return cur()?.ownUnit ?? 0; },
      ProcGetTarget() { return cur()?.target ?? 0; },
      ProcGetBuffUnit() { const b = curBuff(); return b ? multi(b.subject, b.owner) : multi(null, null); },
      ProcGetUnitUID(targetStatus) { const c = cur(); if (!c) return 0; return targetStatus === K.TS.UNIT_REAL || targetStatus === K.TS.UNIT_WORK ? c.target : c.ownUnit; },
      ProcGetParam(index) { const c = cur(); return c?.params?.[index - 1] ?? 0; },
      ProcGetParameter(index) { return cur()?.inst?.parameters?.[index] ?? 0; },
      ProcSetParameter(index, val) { const c = cur(); if (c?.inst) { c.inst.parameters = c.inst.parameters || {}; c.inst.parameters[index] = val; } return true; },
      ProcGetFlag(index) { return !!cur()?.inst?.flags?.[index]; },
      ProcSetFlag(index, val) { const c = cur(); if (c?.inst) { c.inst.flags = c.inst.flags || {}; c.inst.flags[index] = val; } return true; },
      ProcGetProcessID(mode) { const c = cur(); if (!c) return multi(0, 0); if (mode === 1 && c.inst.related) return multi(c.inst.related.processId, c.inst.related.uid); return multi(c.processId, c.uid); },
      ProcGetProcessIndex(mode) { const c = cur(); if (!c) return 0; if (mode === 1 && c.inst.related) return c.inst.related.localIndex; return c.localIndex; },
      ProcGetAffiliation(uid, mode) { const c = cur(); if (!c) return multi(0, 0); if (mode === 1 && c.inst.related) return multi(c.inst.related.affiliation, c.inst.related.localId); return multi(c.affiliation, c.localId); },
      ProcGetSucceeded() { return new LuaTable(); },
      ProcGetOwnerActiveSkill() { return null; },
      ProcessControl(code, ...args) {
        switch (code) {
          case 4000: return !!cur()?.succeeded;
          case 4001: { const c = cur(); if (c) c.succeeded = !!args[0]; return true; }
          case 4700: { for (const u of B.units.values()) if (u.buffs.find(b => b.uid === args[0])) return u.id; return 0; }
          case 4701: { const owners = []; for (const u of B.units.values()) if (u.buffs.find(b => b.buffId === args[0])) owners.push(u.id); return args[1] ? owners : (owners[0] ?? 0); }
          case 3000: { for (const u of B.units.values()) { const b = u.buffs.find(x => x.uid === args[0]); if (b) { b.remain = args[2] ? -1 : args[1]; return true; } } return false; }
          case 4601: return cur()?.optionParams ?? null;
          case 4611: { const c = cur(); if (c) c.subResult = args; return true; }
          case 4612: return cur()?.subResult ?? null;
          case 24000: return true; case 24001: return true;
          default: B.log('native-partial', 'ProcessControl', code, args); return null;
        }
      },
      ProcControl2(srcType, srcUnit, dstType, dstUnit, op, params, lifeType, forceShow) { return B.procControl(srcType, srcUnit, dstType, dstUnit, op, params, lifeType, forceShow); },
      LoadStat2Work() { return true; },
      ExecSubProcess(index, subj, targ, prob, params, optionParams) {
        const c = cur(); if (!c) return false;
        const ref = parseInts(c.inst.mst.REF_PROCESS);
        const pid = ref[index - 1]; if (!pid) { B.log('subproc-missing', index, c.processId); return false; }
        const owner = B.unit(subj || c.ownUnit), target = B.unit(targ || c.target);
        const inst = B.makeInstance({ owner: owner.id, affiliation: c.affiliation, localId: c.localId, localIndex: c.localIndex, processId: pid, prob: prob ?? 10000, params: listOf(params).map(x => x ?? 0), related: { affiliation: c.affiliation, localId: c.localId, localIndex: c.localIndex, processId: c.processId, uid: c.uid } });
        if (!inst) return false;
        inst.optionParams = optionParams;
        return B.runInstance(inst, owner, target, c.bullet, inst.trigger || c.trigger);
      },
      RaiseProcTrigger(targ, trigger) { const u = B.unit(targ); if (u) B.dispatch(trigger, u, u, null); },
      ProcEditProcDamage(v) { const b = curBullet(); if (!b) return false; const c = cur(); b.damage = Math.max(0, Math.trunc(v)); b.edits.push({ value: b.damage, by: c?.inst?.mst?.NAME, id: c?.processId, localId: c?.localId }); B.log('edit-damage', v); return true; },
      ProcGetProcDamage() { return curBullet()?.damage ?? 0; },
      ProcGetOrgProcDamage() { return curBullet()?.orgDamage ?? 0; },
      ProcGetLastDamage() { return curBullet()?.lastDamage ?? 0; },
      ProcEditProcHeal() { return false; }, ProcGetProcHeal() { return 0; }, ProcGetOrgProcHeal() { return 0; }, ProcGetLastHeal() { return 0; },
      ProcGetAddBadStatus() { return 0; },
      GetTargProcProbability() { return 10000; }, GetTargProcParameters() { return []; }, GetTargProcBehaviours() { return []; }, GetTargProcCategories() { return []; }, GetTargProcBuffs() { return []; }, GetTargProcAffiliation() { return multi(0, 0); },
      // --- bullets ---
      GetCurrentBulletUID() { return curBullet()?.uid ?? 0; },
      BulletGetOwner() { return curBullet()?.owner ?? null; },
      BulletGetTarget() { return curBullet()?.target ?? null; },
      BulletGetSkillID() { return curBullet()?.skillId ?? 0; },
      BulletGetSkillPUID() { return curBullet()?.puid ?? 0; },
      BulletGetSkillKind() { return 0; },
      BulletGetSkillRange() { return curBullet()?.skill.targetType ?? 0; },
      BulletGetSkillTarget(mode) { return curBullet()?.target ?? 0; },
      BulletGetSkillType(mode, comp, exp) { const b = curBullet(); if (!b) return null; if (comp == null) return b.skill.skillType; return compare(mode, comp, b.skill.skillType, expandSkillTypes); },
      BulletGetSkillRole(mode, comp) { const b = curBullet(); if (!b) return null; if (comp == null) return b.skill.skillRole.slice(); return compare(mode, comp, b.skill.skillRole, v => [v]); },
      BulletGetElement(mode, comp, exp) { const b = curBullet(); if (!b) return null; const el = B.bulletElement(b); if (comp == null) return el; return compare(mode, comp, el, v => (v < 0 ? (ELEMENT_EXPANSION[v] || []) : [v]), false); },
      BulletGetValue(statType, isSample, isFinal) { const b = curBullet(); if (!b) return 0; const u = B.unit(b.owner); if (isFinal === false) return u.pure[statType] ?? 0; return B.finalStat(u, statType, { work: true, bullet: isSample ? null : b }); },
      BulletGetProperty(uid, prop, ...args) {
        const b = curBullet(); if (!b) return null;
        switch (prop) {
          case K.BULLET_PROPERTY.LUA_VALUE: { const v = b.values[String(args[0])]; return v === undefined ? null : toLua(v); }
          case K.BULLET_PROPERTY.SKILL_TYPE: return args.length ? compare(args[0], args[1], b.skill.skillType, expandSkillTypes) : b.skill.skillType;
          case K.BULLET_PROPERTY.SKILL_ROLE: return args.length ? compare(args[0], args[1], b.skill.skillRole, v => [v]) : b.skill.skillRole.slice();
          case K.BULLET_PROPERTY.SKILL_ROLE_DETAIL: return b.skill.skillRoleDetail.slice();
          case K.BULLET_PROPERTY.SKILL_ELEMENT: return B.bulletElement(b);
          case K.BULLET_PROPERTY.SKILL_ELEMENT_FROM_WEAPON: return !!b.skill.weaponElem;
          case K.BULLET_PROPERTY.SKILL_KILLER_VALUE: return b.skill.killerValue;
          case K.BULLET_PROPERTY.SKILL_KIND: return 0;
          case K.BULLET_PROPERTY.SKILL_ID: return b.skillId;
          case K.BULLET_PROPERTY.ID: return b.bulletId;
          case K.BULLET_PROPERTY.UID: return b.uid;
          case K.BULLET_PROPERTY.HIT_INDEX: return b.hitIndex;
          case K.BULLET_PROPERTY.DAMAGE_RATIO_READ_ONLY: return b.dmgRatio;
          case K.BULLET_PROPERTY.WEAPON_INDEX: return b.weaponIndex ?? 0;
          case K.BULLET_PROPERTY.TARGET_SIDE: case K.BULLET_PROPERTY.SKILL_TARGET_SIDE: { const o = B.unit(b.owner), t = B.unit(b.target); return o && t ? (o.side === t.side ? K.TARGET_SIDE.ALLY : K.TARGET_SIDE.OPPONENT) : 0; }
          case K.BULLET_PROPERTY.OWNER_UID: return b.owner; case K.BULLET_PROPERTY.TARGET_UID: return b.target;
          case K.BULLET_PROPERTY.ISVALID: case K.BULLET_PROPERTY.ISBULLET: return true;
          case K.BULLET_PROPERTY.DAMAGE_LIMIT: return 9999;
          case 433: case 434: return 0; // fatal blow incidence / attack ratio
          default: B.log('native-partial', 'BulletGetProperty', prop, args); return null;
        }
      },
      BulletSetProperty(uid, prop, ...args) {
        const b = curBullet(); if (!b) return false;
        if (prop === K.BULLET_PROPERTY.LUA_VALUE) { b.values[String(args[0])] = plainValue(args[1]); return true; }
        // the scripts write 1000 to restore a full-damage call (per-mille); reads report 10000/6000
        if (prop === K.BULLET_PROPERTY.DAMAGE_RATIO_READ_ONLY) { b.dmgRatio = args[0] <= 1000 ? args[0] * 10 : args[0]; return true; }
        if (prop === K.BULLET_PROPERTY.CALC_LUA_VALUE) { const [key, calc, val] = args; b.values[String(key)] = csCalc(calc, b.values[String(key)], val); return b.values[String(key)]; }
        B.log('native-partial', 'BulletSetProperty', prop, args); return false;
      },
      // Process:KeepParam / GetKeptParam: per-process-instance work values (kept across triggers).
      GetBulletWork(index, ever) { const c = cur(); if (!c?.inst) return null; const store = ever ? (c.inst.keptEver || {}) : (c.inst.kept || {}); return store[index] ?? null; },
      SetBulletWork(index, val, ever, calc) { const c = cur(); if (!c?.inst) return null; const key = ever ? 'keptEver' : 'kept'; c.inst[key] = c.inst[key] || {}; c.inst[key][index] = csCalc(calc || 0, c.inst[key][index], val); return c.inst[key][index]; },
      BulletWasCritical() { return !!curBullet()?.critical; },
      BulletWasGuarded() { return false; }, BulletTargetUseCounter() { return false; }, BulletWasLastAttack() { return false; },
      BulletGetKiller() { const b = curBullet(); if (!b) return [0]; return B.killerTypes(b); },
      BulletGetSkillTotalDamage() { const b = curBullet(); return b ? b.results.reduce((s, r) => s + r.damage, 0) : 0; },
      BulletGetDeleteOnHit() { return true; },
      BulletCanKB() { return false; }, BulletGetKnockBack() { return false; }, BulletMadeBreak() { return false; },
      BulletGetSp() { return multi(0, 0); },
      GenerateBullet() { B.log('native-partial', 'GenerateBullet'); return 0; },
      IsSkillActive() { return false; },
      // --- skills on units ---
      UnitNumSkills(t, skillType) { const u = B.unit(t); return u ? u.skills.filter(s => s.type === skillType).length : 0; },
      UnitGetSkillSlots(t) { return []; },
      UnitGetSkillID(t, skillType, index) { const u = B.unit(t); return u?.skills.filter(s => s.type === skillType)[index - 1]?.id ?? 0; },
      UnitGetSkillName(t, skillType, index) { const u = B.unit(t); const id = u?.skills.filter(s => s.type === skillType)[index - 1]?.id; return id ? (B.master.skill.get(id)?.NAME ?? '') : ''; },
      UnitGetSkillKind() { return 0; }, UnitGetSkillIndex(t, skillType, index) { return index; },
      UnitGetSkillCharge() { return 0; }, UnitGetSkillCost(t, skillType, index) { const u = B.unit(t); const id = u?.skills.filter(s => s.type === skillType)[index - 1]?.id; return id ? (B.master.skill.get(id)?.INVOKE_COST ?? 0) : 0; },
      UnitGetSkillElement(t, skillType, index) { const u = B.unit(t); const id = u?.skills.filter(s => s.type === skillType)[index - 1]?.id; return id ? (B.master.skill.get(id)?.ELEM ?? 0) : 0; },
      // TARGET_INFO "side:scale:cond:range": SKILL_TARGET_XXX and SKILL_SCALE_XXX (conditions such as ActValidOwnerSkillBefore compare the side)
      UnitGetSkillTarget(t, skillType, index) { const u = B.unit(t); const id = u?.skills.filter(s => s.type === skillType)[index - 1]?.id; return id ? (B.master.skillInfo(id)?.targetSide ?? 0) : 0; },
      UnitGetSkillTargetType(t, skillType, index) { const u = B.unit(t); const id = u?.skills.filter(s => s.type === skillType)[index - 1]?.id; return id ? (B.master.skillInfo(id)?.targetType ?? 0) : 0; },
      UnitGetSkillType(t, skillType, index) { const u = B.unit(t); const id = u?.skills.filter(s => s.type === skillType)[index - 1]?.id; return id ? parseInts(B.master.skill.get(id)?.SKILL_ROLE ?? '0') : [0]; },
      UnitGetSkillRoleDetail(t, skillType, index) { const u = B.unit(t); const id = u?.skills.filter(s => s.type === skillType)[index - 1]?.id; return id ? parseInts(B.master.skill.get(id)?.SKILL_ROLE_DETAIL ?? '0') : [0]; },
      UnitGetSkillLevel() { return 1; }, GetSkillAbsLevel() { return 1; },
      UnitGetSkillKiller() { return 0; }, UnitGetSkillAvail() { return 0; }, UnitGetSkillMaxAvail() { return 0; },
      UnitGetActiveSkill(t) { const u = B.unit(t); const a = u?.activeSkill; if (a) return multi(0, a.type, a.index, a.target); const b = curBullet(); return b ? multi(0, b.skill.skillType, 1, b.target) : multi(0, 0, 0, 0); },
      // the plays of one skill still running: only the cast being evaluated ({elapsed, puid}, e.g. 星眼's per-cast list)
      UnitGetSkillPlayInfo(t, type, index) { const a = B.unit(t)?.activeSkill; return a && a.type === type && a.index === index ? [{ elapsed: 0, puid: a.puid }] : []; },
      UnitIsSkillDisabled() { return false; },
      UnitControl(t, code, ...args) {
        if (code === 511) { const sub = args[2]; if (sub === 100) return 0; if (sub === 101) return [0, []]; if (sub === 102) return []; }
        B.log('native-partial', 'UnitControl', code, args); return 0;
      },
      UnitSkillControl() { return true; },
      UnitPlaySkill() { return false; }, UnitPlaySkillDirect() { return false; }, PreloadSkill() {},
      // --- presentation / misc (no effect in the sandbox) ---
      PlayPassiveLine() {}, PlayPassiveLine2() {}, PlayProcTimeline() {}, UIControl() {}, SetCacheInfo() {}, SetPendingJudge() {},
      UnitSetMissTypeMode() {}, UnitShowTargetMarker() {}, UnitSetOpacity() {}, UnitSetScale() {}, UnitSetExclude() {}, UnitSetProperty2() {},
      UnitChangeBossFlag() {}, UnitChangeBossGaugeOwner() {}, UnitChangeCharacter() {}, UnitPrepareCharacter() {},
      UnitSelectTarget() { return 0; }, UnitFindInCircle() { return []; }, UnitCalcPos() { return multi(0, 0, 0); }, UnitPosVector() { return multi(0, 0, 0); },
      GetNearestUnit() { return 0; }, GetNearestUnitForFirst() { return 0; }, GetDistanceWall() { return multi(3000, 3000, 3000, 3000); }, InsideArea() { return false; },
      GetTerrain() { return 0; }, GetBgTerrainType() { return 0; }, GetTotalZel() { return 0; }, GetRarityOfStolenItem() { return 0; },
      GetUserInfo() { return null; }, GetUiMsg() { return ''; }, CallQuestFunc() {}, InvokeQuestFunc() {}, BattleControl: (...a) => B.battleControl(...a), CalculateType() { return 0; },
      // The skill timeline being played (set by Battle.beginSkill); property ids from procCondCommon.lua.
      GetTimelineParameter(propId, puid) {
        const tl = B.timeline; if (propId === 100) return 0.5; // a random draw: the middle (see CONTEXT_STACK_LUA)
        if (!tl) return 0;
        switch (propId) { case 1: return tl.owner; case 2: case 3: return tl.target; case 10: case 11: return tl.puid; case 12: return 0; case 13: return 1; case 20: return tl.skillId; case 21: return tl.skillType; case 22: return tl.skillIndex; case 23: return tl.slot ?? 0; case 30: return false; case 50: return false; default: return 0; }
      },
      UnitGetDamageInfo() { return null; },
      UnitGetArenaInfo() { return 0; }, UnitGetBossGaugeOwner() { return 0; },
      EFFECT_TIMELINE_SEGMENT_ELEMENT2() { return 0; },
    };
  }
}

// Deep-copies the mutable battle state; master rows (mst/cond) stay shared references.
function cloneState(state) {
  const cloneEntries = list => list.map(e => ({ ...e, params: e.params.slice() }));
  const cloneInst = i => ({ ...i, params: i.params.slice(), procValues: structuredClone(i.procValues || {}), kept: structuredClone(i.kept || null), keptEver: structuredClone(i.keptEver || null), flags: structuredClone(i.flags || null), parameters: structuredClone(i.parameters || null), work: i.work ? cloneEntries(i.work) : undefined, values: i.values ? structuredClone(i.values) : undefined });
  const units = new Map();
  for (const [id, u] of state.units) units.set(id, { ...u, status: cloneEntries(u.status), real: cloneEntries(u.real), work: cloneEntries(u.work), buffs: u.buffs.map(cloneInst), instances: u.instances.map(cloneInst), values: structuredClone(u.values), procValues: structuredClone(u.procValues), passiveIds: u.passiveIds.slice(), activeSkill: u.activeSkill ? { ...u.activeSkill } : u.activeSkill });
  return { units, fieldValues: structuredClone(state.fieldValues), nextUid: state.nextUid, timeline: state.timeline ? { ...state.timeline } : null, wave: state.wave, frame: state.frame, traceLength: state.traceLength };
}

// Saves/restores the script-side context around nested dispatches (see Battle.saveGlobals).
const CONTEXT_STACK_LUA = `
-- Chance and randomness follow the calculator's rules: lottery() is a chance of the running effect that the user
-- ticks (off by default; SandboxLottery), every other random draw (a value in a range, one of several skills or
-- targets) takes the middle, so the same inputs always give the same numbers.
function lottery(rate) return SandboxLottery(rate) end
math.random = function(m, n)
  if m == nil then return 0.5 end
  if n == nil then m, n = 1, m end
  return (m + n) // 2
end
-- the VM's integers are 32-bit (as in fengari, which it replaced): 2^31 has no integer representation there, so the bit helpers of
-- luaCommon.lua are re-expressed with shifts (same results for the 32-bit values the scripts use).
function bitToBoolean(_val, _bit)
  if not isNumber(_val) or _bit > 32 then return false end
  return ((_val >> (_bit - 1)) & 1) == 1
end
__sandboxStack = {}
function __sandboxSaveContext()
  table.insert(__sandboxStack, {this = this, target = target, units = units, myTrigger = myTrigger, procTrigger = procTrigger, ownUnit = ownUnit,
    bParent = Bullet.parent, bTarget = Bullet.target, bSource = Bullet.source, bCache = Bullet.cache,
    pParent = Process.parent, pTarget = Process.target, pCache = Process.cache, pParam = Process.param,
    fParent = Buff.parent, fTarget = Buff.target, fEnable = Buff.enable, fSource = Buff.source, fCache = Buff.cache,
    fieldCache = Field.cache, tCache = TrigProc.cache, tlCache = TimeLine.cache})
end
function __sandboxRestoreContext()
  local s = table.remove(__sandboxStack)
  if s == nil then return end
  this, target, units, myTrigger, procTrigger, ownUnit = s.this, s.target, s.units, s.myTrigger, s.procTrigger, s.ownUnit
  Bullet.parent, Bullet.target, Bullet.source, Bullet.cache = s.bParent, s.bTarget, s.bSource, s.bCache
  Process.parent, Process.target, Process.cache, Process.param = s.pParent, s.pTarget, s.pCache, s.pParam
  Buff.parent, Buff.target, Buff.enable, Buff.source, Buff.cache = s.fParent, s.fTarget, s.fEnable, s.fSource, s.fCache
  Field.cache, TrigProc.cache, TimeLine.cache = s.fieldCache, s.tCache, s.tlCache
end
`;

// Every raw native the captured scripts reference (derived from the scripts themselves).
export const NATIVE_NAMES = ['SetBulletWork', 'SetBuffWork', 'BattleControl', 'BuffControl', 'BuffGetValue', 'BulletCanKB', 'BulletGetDeleteOnHit', 'BulletGetElement', 'BulletGetKiller', 'BulletGetKnockBack', 'BulletGetOwner', 'BulletGetProperty', 'BulletGetSkillID', 'BulletGetSkillKind', 'BulletGetSkillPUID', 'BulletGetSkillRange', 'BulletGetSkillRole', 'BulletGetSkillTarget', 'BulletGetSkillTotalDamage', 'BulletGetSkillType', 'BulletGetSp', 'BulletGetTarget', 'BulletGetValue', 'BulletMadeBreak', 'BulletSetProperty', 'BulletTargetUseCounter', 'BulletWasCritical', 'BulletWasGuarded', 'BulletWasLastAttack', 'CalculateType', 'CallQuestFunc', 'EFFECT_TIMELINE_SEGMENT_ELEMENT2', 'ExecSubProcess', 'GenerateBullet', 'GetBattleInfo', 'GetBgTerrainType', 'GetBuffInfo', 'GetBuffWork', 'GetBulletWork', 'GetCurrentBuffUID', 'GetCurrentBulletUID', 'GetDateTime', 'GetDistanceWall', 'GetDummyUnitID', 'GetMasterInfo', 'GetNearestUnit', 'GetNearestUnitForFirst', 'GetOperationUnit', 'GetRarityOfStolenItem', 'GetScriptStatus', 'GetSkillAbsLevel', 'GetTargProcAffiliation', 'GetTargProcBehaviours', 'GetTargProcBuffs', 'GetTargProcCategories', 'GetTargProcParameters', 'GetTargProcProbability', 'GetTerrain', 'GetTimelineParameter', 'GetTotalZel', 'GetUiMsg', 'GetUnits', 'GetUserInfo', 'GetWaveCount', 'GetWaveTimer', 'InsideArea', 'InvokeQuestFunc', 'IsDummyUnit', 'IsSkillActive', 'IsSucceeded', 'IsValidUnit', 'LoadStat2Work', 'NumWaves', 'PlayPassiveLine', 'PlayPassiveLine2', 'PlayProcTimeline', 'PreloadSkill', 'ProcControl2', 'ProcEditProcDamage', 'ProcEditProcHeal', 'ProcGetAddBadStatus', 'ProcGetAffiliation', 'ProcGetBuffUnit', 'ProcGetFlag', 'ProcGetLastDamage', 'ProcGetLastHeal', 'ProcGetOrgProcDamage', 'ProcGetOrgProcHeal', 'ProcGetOwner', 'ProcGetOwnerActiveSkill', 'ProcGetParam', 'ProcGetParameter', 'ProcGetProcDamage', 'ProcGetProcHeal', 'ProcGetProcessID', 'ProcGetProcessIndex', 'ProcGetSucceeded', 'ProcGetTarget', 'ProcGetUnitUID', 'ProcSetFlag', 'ProcSetParameter', 'ProcessControl', 'RaiseProcTrigger', 'SetCacheInfo', 'SetPendingJudge', 'UIControl', 'UnitCalcPos', 'UnitCanAction', 'UnitCanUseSpecial', 'UnitChangeBossFlag', 'UnitChangeBossGaugeOwner', 'UnitChangeCharacter', 'UnitControl', 'UnitFindInCircle', 'UnitGetAccessoryElem', 'UnitGetActionHistory', 'UnitGetActiveSkill', 'UnitGetAimedCount', 'UnitGetAimedList', 'UnitGetArenaInfo', 'UnitGetArmorType', 'UnitGetBadStatus', 'UnitGetBossFlg', 'UnitGetBossGaugeOwner', 'UnitGetBreakCount', 'UnitGetBreakRemain', 'UnitGetBreakTime', 'UnitGetBuffs', 'UnitGetCastLevel', 'UnitGetChangedAlives', 'UnitGetChangedBuffs', 'UnitGetCharType', 'UnitGetCharacterID', 'UnitGetComboCount', 'UnitGetDamageInfo', 'UnitGetDebuffs', 'UnitGetDir', 'UnitGetElemResists', 'UnitGetEquipElem', 'UnitGetEquipID', 'UnitGetEquipType', 'UnitGetGender', 'UnitGetIndex', 'UnitGetLevel', 'UnitGetList', 'UnitGetLuaValue', 'UnitGetMonsterID', 'UnitGetName', 'UnitGetOpacity', 'UnitGetOperationUnit', 'UnitGetPassiveList', 'UnitGetPos', 'UnitGetProperty', 'UnitGetRadius', 'UnitGetScale', 'UnitGetSelectWeight', 'UnitGetSide', 'UnitGetSkillAvail', 'UnitGetSkillCharge', 'UnitGetSkillCost', 'UnitGetSkillElement', 'UnitGetSkillID', 'UnitGetSkillIndex', 'UnitGetSkillKiller', 'UnitGetSkillKind', 'UnitGetSkillLevel', 'UnitGetSkillMaxAvail', 'UnitGetSkillName', 'UnitGetSkillPlayInfo', 'UnitGetSkillRoleDetail', 'UnitGetSkillSlots', 'UnitGetSkillTarget', 'UnitGetSkillTargetType', 'UnitGetSkillType', 'UnitGetSkillUsed', 'UnitGetSp', 'UnitGetStatResists', 'UnitGetState', 'UnitGetTriggers', 'UnitGetUnitID', 'UnitGetValue', 'UnitGetWeaponType', 'UnitHaveCounter', 'UnitIsAlive', 'UnitIsExcluded', 'UnitIsExiled', 'UnitIsSkillDisabled', 'UnitNumSkills', 'UnitPlaySkill', 'UnitPlaySkillDirect', 'UnitPosVector', 'UnitPrepareCharacter', 'UnitRemoveBuff', 'UnitSavedLife', 'UnitSelectTarget', 'UnitSetExclude', 'UnitSetLuaValue', 'UnitSetMissTypeMode', 'UnitSetName', 'UnitSetOpacity', 'UnitSetProperty', 'UnitSetScale', 'UnitShowTargetMarker', 'UnitSkillControl', 'UnitTotalSelectWeight', 'SandboxLottery'];
