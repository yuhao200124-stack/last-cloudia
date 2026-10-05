// 竞技场（PvP）入口（2026-10-05）：两队各四人放进同一场战斗，打开游戏脚本的竞技场开关，跑开场，
// 然后可以问“某人用某招打某人一下是多少”。不改 runScenario，也不改现有网页的任何行为。
// 方案和已知缺口见 docs/pvp-arena-calculator-2026-10-05.md。
//   const tables = await loadArenaTables(read)             阵型表、圣物每一级的数据（dist/game-data/engine/arena.json）
//   const arena = await createArena({ units, tables, read, panel })
//   arena.open()                                           开场（状态计算、Wave 开始、存活人数变化；所有人满体力满法力）
//   arena.strike(attackerIndex, targetIndex, { skillId, level, critical, random })   打一下（算完恢复原状）
//     core：把核心值换成对局记录里的那个数（只比核心值之后的部分）；disable：这次不算的效果；fromBehind：从背后命中；targetCasting：目标正在出招
// units：scripts/lib/pvp-record.mjs 的 normalizeUnit() 给出的样子（对局记录或对手列表都转成它）。
// panel：'given' = 面板直接用 unit.panel（对局记录里的开场前面板）；'calc' = 只凭配装让引擎自己算。
import { Battle, K } from './battle.mjs?v=20261005-2041';
import { loadEngineData, loadPassives } from './engine-data.mjs?v=20261005-2041';
import { addAttacker } from './scenario.mjs?v=20261005-2041';
import { personalityFromPieces } from './loadout-adapter.mjs?v=20261005-2041';

export async function loadArenaTables(read) { return read('engine/arena.json'); }

// 竞技场开场每个人的法力：5 点（引擎里法力 ×1000）。三场对局记录里 24 个角色开场都是 5000（能力变化条目的 1001 项），
// 游戏表里没找到出处，按观察值用；对局记录带 entryMp 时用记录的。
export const ARENA_START_MP = 5000;
// 绑在“某一次出招”上的隐藏增益（参数里带那次出招的流水号）：出招时由脚本自己生成，重放状态时不搬也不删
const RUN_BOUND = /PUID|スキル発動毎情報管理|スキル終了時指定UIDバフ削除/;
const MP_SCALE = 1000; // 对局记录里的法力是游戏内部值（×1000）；脚本比较用的是点数（枯竭之勇“法力 20 以下”）
const STAT_KEYS = [['hp', K.STAT.MAX_HP], ['atk', K.STAT.STR], ['def', K.STAT.DEF], ['matk', K.STAT.INT], ['mdef', K.STAT.MND]];
const parseInts = s => String(s ?? '').split(/[:,\-]/).map(Number).filter(Number.isFinite);

// 一个角色 → addAttacker 的参数。blessingParams：{加护编号: {段: {v: [参数]}}}（本账号那份；对手的加护等级记录里没有，
// 也用这份，会在 notes 里标出来）。
export function arenaUnitSpec(master, u, { tables, panel = 'given', blessingParams = null, notes = [] } = {}) {
  const given = panel === 'given' && u.panel;
  const st = given ? u.panel : null;
  const personality = u.personality?.length ? u.personality.map(p => ({ passive: p.id, level: p.level, base: p.base ?? p.id })) : personalityFromPieces(master, u.dress, master.abilityPieces?.get(u.dress) || []);
  let ark = null;
  if (u.ark?.id) {
    const row = tables?.arkLevels?.[u.ark.id]?.[u.ark.level];
    if (row) ark = { id: u.ark.id, name: u.ark.name || '', level: u.ark.level, stats: row.stats, process: row.process };
    else notes.push(`${u.name}：圣物 ${u.ark.id} 的 ${u.ark.level} 级数据没有，圣物效果没算`);
    const skillRow = ark && u.ark.skillLevel ? tables?.arkSkillLevels?.[u.ark.id]?.[u.ark.skillLevel] : null;
    if (skillRow) ark.skill = { process: skillRow };
  }
  const blessings = (u.blessings || []).filter(id => master.passive.has(id)).map(id => { const segs = blessingParams?.[id]; return segs ? { id, params: Object.fromEntries(Object.entries(segs).map(([i, x]) => [i, x.v])) } : { id }; });
  return {
    name: (u.isMine ? '我方' : '对方') + u.name, unitDressId: u.dress, panelGiven: !!given,
    stats: st ? { hp: st.hp, mp: st.mp / MP_SCALE, str: st.atk, def: st.def, int: st.matk, mnd: st.mdef, crt: st.critical } : undefined,
    elemResist: st ? Object.fromEntries(st.elem.map((v, i) => [i + 1, v])) : undefined,
    level: u.level, limitBreak: u.limitBreak, awake: u.awake, pieces: 'all',
    equips: (u.equipment || []).map(e => ({ pos: e.slot, id: e.id, level: e.lv ?? null })),
    skills: (u.skills || []).map(s => ({ type: s.skillType, id: s.skillId, level: s.lv })),
    personality, passives: [...(u.passives || []).map(p => ({ id: p.id })), ...personality.map(p => ({ id: p.passive })), ...blessings],
    crest: u.crest?.id ? { crestId: u.crest.id, traits: u.crest.traits.map(t => t.passive).filter(Boolean), maxLevel: true } : null,
    ark,
  };
}

export async function createArena({ units, tables, read, panel = 'given', blessingParams = null, options = {} }) {
  const notes = [];
  const { master, scripts } = await loadEngineData({ unitDressIds: [...new Set(units.map(u => u.dress))], read });
  await loadPassives(master, units.flatMap(u => [...(u.blessings || []), ...(u.passives || []).map(p => p.id), ...(u.personality || []).map(p => p.id), ...(u.crest?.traits || []).map(t => t.passive)]), read);
  const battle = new Battle(master, scripts, { probability: 'skip', ...options });
  battle.host.setGlobal('isArena', true); // luaCommon.lua: Field:IsPvP() = isArena or isGvG
  const made = units.map(u => {
    const x = addAttacker(battle, arenaUnitSpec(master, u, { tables, panel, blessingParams, notes }));
    x.side = u.isMine ? K.SIDE.ALLY : K.SIDE.OPPONENT; x.isBoss = false; x.arenaIndex = u.index; x.formationPos = u.formationPos;
    const f = tables?.formations?.[u.formationId];
    if (f) battle.addProcesses(x, { affiliation: K.AFF.FORMATION, localId: Number(u.formationId), level: 1, processes: master.processSegments(f.process).map((seg, i) => ({ ...seg, localIndex: i })) });
    else if (u.formationId) notes.push(`${u.name}：阵型 ${u.formationId} 不在阵型表里，阵型效果没算`);
    return x;
  });
  const arena = {
    battle, master, units, made, notes, K,
    unit: i => battle.unit(made[i].id),
    // 开场：和游戏一样先算状态，再 Wave 开始、存活人数变化；所有人满体力满法力（阈值类条件记下起点）
    open() {
      for (const u of made) battle.dispatch(K.TRIG.STATUS, u, u);
      for (const u of made) battle.dispatch(K.TRIG.WAVE_START, u, u);
      for (const u of made) battle.dispatch(K.TRIG.CHANGE_SURVIVORS, u, u);
      // 计时类效果在第 0 帧的那一跳（触发 71）：没有条件函数的当场生效（圣诞颂歌：受伤害 -10%，之后每 10 秒减弱），
      // “每隔 N 帧”的条件函数第一次调用只记起点、不生效，和游戏一样
      for (const u of made) battle.dispatch(71, u, u);
      // 法力：先满（阈值类条件记下起点），再落到竞技场的开场法力
      for (const u of made) { u.hp = battle.finalStat(u, K.STAT.MAX_HP); u.mp = battle.finalStat(u, K.STAT.MAX_MP); u.combo = 0; }
      for (const u of made) { battle.dispatch(K.TRIG.CHANGE_HP, u, u); battle.dispatch(K.TRIG.CHANGE_MP, u, u); }
      for (const [i, u] of made.entries()) { u.mp = Math.min(battle.finalStat(u, K.STAT.MAX_MP), (units[i].entryMp ?? ARENA_START_MP) / MP_SCALE); battle.dispatch(K.TRIG.CHANGE_MP, u, u); battle.dispatch(55, u, u); }
      // 属性耐性：实战记录里“开场前面板”的属性耐性其实已经含开场增减益（回放记录的不含），直接喂会重复算。
      // 所以面板用记录的时候，开场后把每个属性的基础值校到“引擎开场后的耐性＝记录里进场时的耐性”。
      if (panel === 'given') made.forEach((u, i) => { const want = units[i].entry?.elem; if (!want) return; for (let e = 1; e <= 6; e++) { const d = want[e - 1] - battle.elemResist(u, e, { work: false }); if (d) { u.elemResist[e] = (u.elemResist[e] || 0) + d; (arena.elemCalibrated ||= []).push({ unit: u.name, element: e, delta: d }); } } });
      return arena;
    },
    panelOf(i) { const u = arena.unit(i); return Object.fromEntries(STAT_KEYS.map(([k, code]) => [k, Math.round(battle.finalStat(u, code))])); },
    // 这个技能会造成伤害的弹道
    damageBullets(skillId, level) {
      const skill = master.skill.get(skillId); if (!skill) return [];
      return parseInts(skill.BULLET_INFO).filter(b => b > 1000).filter(b => { const row = master.bulletLevel(b, level); return row && row.PROCESS_INFO.replace(/[:@]/g, ''); });
    },
    // 把场上状态换成对局记录里某一刻的（对账用；配合 strike 的 before，在快照里做，算完自动恢复）。
    // state[i] = { buffs: [{buffId, duration, params, from(角色序号), affiliation, localId, localIndex, processId}], alive, hp, mp, acting: 'standby'|'main'|null }
    // 增减益：引擎开场自己加的、记录里也还在的（同一个人、同编号、同来源）保留；记录里已经没有的去掉；记录里有而引擎
    // 没有的按记录的数值加上。体力法力按记录的值，然后触发“体力变化／法力变化／存活人数变化”，让阈值类被动重新判断。
    setState(state) {
      const behaviours = battle.host.getGlobal('BuffParamBehavior');
      const report = { added: 0, removed: 0, kept: 0, failed: [] };
      state.forEach((st, i) => {
        if (!st) return; const u = arena.unit(i);
        const want = (st.buffs || []).slice();
        for (const b of u.buffs.slice()) {
          if (RUN_BOUND.test(b.mst.NAME || '')) continue;
          const k = want.findIndex(w => w.buffId === b.buffId && (!w.localId || w.localId === b.localId) && (w.from == null || made[w.from]?.id === b.subject));
          if (k >= 0) { want.splice(k, 1); report.kept++; } else { battle.removeBuff(u, b.uid); report.removed++; }
        }
        for (const w of want) {
          if (!master.buff.has(w.buffId)) { report.failed.push(w.buffId); continue; }
          if (RUN_BOUND.test(master.buff.get(w.buffId).NAME || '')) continue;
          const from = made[w.from] || u, name = master.buff.get(w.buffId).NAME || '';
          // “特定UID…”类隐藏增益的第一个数是来源角色在游戏里的编号，换成引擎里的
          const params = w.params.slice(); if (/UID/.test(name) && w.uidOf && w.uidOf(params[0]) != null) params[0] = made[w.uidOf(params[0])].id;
          const ctx = { uid: 0, inst: null, trigger: 0, ownUnit: from.id, target: u.id, bullet: null, buff: null, affiliation: (w.affiliation || 0) & 63, localId: w.localId, localIndex: w.localIndex || 0, processId: w.processId || 0, params: [] };
          const saved = battle.inProcOnProc; battle.inProcOnProc = true; battle.stack.push(ctx);
          try { const ok = battle.buffControl(u.id, w.buffId, [w.duration, ...params], 0, behaviours?.get?.(w.buffId) ?? null, null); if (ok) report.added++; else report.failed.push(w.buffId); }
          catch (e) { report.failed.push(w.buffId); }
          finally { battle.stack.pop(); battle.inProcOnProc = saved; }
        }
      });
      // 正在出招的人（准备中／发动中）：切到那个状态，让“准备中／发动中受伤害增减”这类被动生效
      state.forEach((st, i) => { if (st?.acting) battle.setState(arena.unit(i), st.acting === 'standby' ? K.STATE.STANDBY : K.STATE.MAIN); });
      let lifeChanged = false;
      state.forEach((st, i) => { if (!st) return; const u = arena.unit(i); if (st.alive != null && u.alive !== st.alive) { u.alive = st.alive; lifeChanged = true; } });
      state.forEach((st, i) => {
        if (!st) return; const u = arena.unit(i);
        if (st.hp != null) u.hp = Math.max(u.alive ? 1 : 0, Math.min(st.hp, battle.finalStat(u, K.STAT.MAX_HP)));
        if (st.mp != null) u.mp = Math.min(st.mp / MP_SCALE, battle.finalStat(u, K.STAT.MAX_MP));
      });
      for (const u of made.map((x, i) => arena.unit(i))) { if (!u.alive) continue; if (lifeChanged) battle.dispatch(K.TRIG.CHANGE_SURVIVORS, u, u); battle.dispatch(K.TRIG.CHANGE_HP, u, u); battle.dispatch(K.TRIG.CHANGE_MP, u, u); battle.dispatch(55, u, u); }
      return report;
    },
    // 打一下：attacker 用 skillId 的一颗弹道打 target；算完恢复原状。before(battle, A, T) 可在出手前改状态（对账用）。
    strike(ai, ti, { skillId, level = 1, bulletId = null, critical = false, random = 1, before = null, core = null, disable = null, fromBehind = false, targetCasting = false } = {}) {
      const snap = battle.snapshot();
      try {
        const A = arena.unit(ai), T = arena.unit(ti);
        if (before) before(battle, A, T);
        // 目标自己正在出招：它的“出招中受伤害增减”类被动生效（拉达・多尔出招中受伤害 -20%）
        if (targetCasting) battle.setState(T, K.STATE.MAIN);
        T.dir = fromBehind ? 0 : 1; // 从背后打：引擎没有位置，用“目标背对”表示（出其不意 +50%、骑士领域“正面受击”不生效）
        // disable：这次不算的效果（被动或增减益的流水号 uid；对账时用来找“去掉哪一条就对上”）
        if (disable?.length) { const off = new Set(disable); for (const u of battle.units.values()) { for (const i of u.instances) if (off.has(i.uid)) i.enabled = false; for (const b of u.buffs) if (off.has(b.uid)) b.enabled = false; } }
        const bullets = bulletId ? [bulletId] : arena.damageBullets(skillId, level).slice(0, 1);
        if (!bullets.length) return [];
        battle.beginSkill(A, T, skillId);
        const bl = battle.createBullet(A, T, { skillId, bulletId: bullets[0], level, critical, random, coreOverride: core });
        battle.hit(bl);
        return bl.results.map(r => ({ ...r, bulletId: bullets[0] }));
      } finally { battle.restore(snap); }
    },
  };
  return arena;
}
