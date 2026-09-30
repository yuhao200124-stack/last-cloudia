// Turns a loadout-reader battle report (kind: last-cloudia-battle-entry) into sandbox inputs.
// The report's buff inventory lists every process instance the game created for the unit: its source
// (affiliation 4 = passive skill, 6/7/8 = weapon/armour/accessory by equipment id), segment index and the
// parameters actually loaded (blessing levels change them), in the game's own creation order.
import { K, parseInts } from './battle.mjs?v=20260930-1629';

const RESIST_KEYS = { fire: 1, ice: 2, earth: 3, tree: 3, thunder: 4, light: 5, dark: 6 };
const RACE_CODES = { 战士: 1001, 狙击手: 1002, 骑士: 1003, 魔法师: 1004, 治疗师: 1005, 兽: 2001, 植物: 2002, 昆虫: 2003, 鸟: 2004, 魔法生物: 2005, 不死生物: 2006, 石: 2007, 机械: 2008, 精灵: 2009, 龙: 2010, 神: 2011, 鱼: 2012 };
const EQUIP_AFFILIATIONS = new Set([K.AFF.WEAPON, K.AFF.ARMOR, K.AFF.ACCESSORY]);

const statsOf = s => s ? { hp: s.hp, mp: s.mp, str: s.attack, def: s.defense, int: s.intelligence, mnd: s.mind, crt: s.critical ?? s.criticalRate } : null;
const resistOf = r => { const out = {}; for (const [k, v] of Object.entries(r || {})) if (RESIST_KEYS[k]) out[RESIST_KEYS[k]] = Number(v) || 0; return out; };
const racesOf = u => (u.raw?.characterTypes?.length ? u.raw.characterTypes : (u.races || (u.race ? [u.race] : [])).map(r => RACE_CODES[r]).filter(Boolean));

// The out-of-battle panel is the first panel snapshot (elapsed 0, before wave-start buffs); the report's
// `stats` are the final in-battle values and would double-count buffs.
export function panelStatsOf(unit) {
  const first = (unit.panelSnapshots || []).find(s => s.elapsedMs === 0) || (unit.panelSnapshots || [])[0];
  if (first?.stats) return { ...statsOf(first.stats), source: `入场面板快照 ${first.id || ''}`.trim(), inBattle: false };
  return { ...statsOf(unit.stats), crt: unit.statsMeta?.criticalRate, source: '战斗最终值（已含Buff）', inBattle: true };
}

// Process instances → passive specs with runtime parameters, in creation (uid) order. Sources that are not
// passive skills or equipment (affiliation 18 = 徽章/crest traits, 15 = support passives, 5 = ark, 9 = terrain,
// 12 = formation) carry no PassiveSkillMst row, so they become raw process instances (process id + values).
export function passivesOf(unit, master) {
  const buffs = (unit.raw?.buffs || []).filter(b => b.is_exactly_buff === 0 && !b.removed).slice().sort((a, b) => a.uid - b.uid);
  const specs = new Map(); // key → spec
  const equips = [];
  for (const b of buffs) {
    const aff = b.affiliation, localId = b.local_id;
    const key = `${aff}:${localId}`;
    if (aff !== K.AFF.AUTOSKILL && !EQUIP_AFFILIATIONS.has(aff)) {
      const op = b.operations?.[0]; const processId = op?.rule?.id || op?.origin_process_id;
      if (!processId) continue;
      if (!specs.has(key)) specs.set(key, { id: 0, affiliation: aff, localId, level: 1, params: {}, processes: [], uid: b.uid, name: b.provenance?.direct?.carrier?.name || '' });
      specs.get(key).processes.push({ processId, localIndex: b.local_index ?? 0, params: Array.isArray(op.values) ? op.values.slice() : [] });
      continue;
    }
    if (!specs.has(key)) {
      let id = localId;
      if (EQUIP_AFFILIATIONS.has(aff)) {
        const row = master?.itemEquip.get(localId);
        const pids = row ? parseInts(row.PASSIVE_SKILL_INFO).filter(Boolean) : [];
        id = pids[0] || 0;
        const pos = aff === K.AFF.WEAPON ? (equips.some(e => e.pos === 1) ? 2 : 1) : aff === K.AFF.ARMOR ? 2 : (equips.some(e => e.pos === 3) ? 4 : 3);
        equips.push({ pos, id: localId, type: row?.EQUIP_TYPE, elem: row?.ELEM });
      }
      specs.set(key, { id, affiliation: aff, localId, level: b.level || 1, params: {}, uid: b.uid, name: b.provenance?.direct?.carrier?.name || '' });
    }
    const values = b.operations?.[0]?.values;
    if (Array.isArray(values) && b.operations[0].values_read) specs.get(key).params[b.local_index] = values.slice();
  }
  return { passives: [...specs.values()].filter(p => p.id || p.processes?.length), equips };
}

// Full attacker spec for scenario.addAttacker.
export function attackerFromReport(report, master, { unitIndex = 0 } = {}) {
  const unit = report.units?.[unitIndex]; if (!unit) return null;
  const { passives, equips } = passivesOf(unit, master);
  const panel = panelStatsOf(unit);
  const skills = (unit.skills || []).map(s => ({ id: s.skillId, type: master?.skill.get(s.skillId)?.SKILL_TYPE ?? (s.slot === 'normal' ? 9 : s.slot === 'ultimate' ? 5 : 1), name: s.name })).filter(s => s.id);
  // personality pieces are passive ids base..base+9 (UnitDressAbilityPieceMst PARAM passive:level:base)
  const personality = [];
  const dress = master?.unitDress.get(unit.unitId);
  if (dress) for (const base of parseInts(dress.PERSONAL_SKILL).filter(Boolean)) {
    const p = passives.find(x => x.affiliation === K.AFF.AUTOSKILL && x.id && x.id >= base && x.id < base + 10);
    if (p) personality.push({ passive: p.id, level: p.id - base + 1, base });
  }
  return { unitDressId: unit.unitId, name: unit.name, charTypes: racesOf(unit), stats: panel, statsSource: panel.source, equips, passives, skills,
    elemResist: resistOf(unit.resistances), personality, inventoryCount: (unit.raw?.buffs || []).length };
}

export function targetFromReport(report, { bossIndex = 0 } = {}) {
  const boss = report.bosses?.[bossIndex]; if (!boss) return null;
  return { name: boss.name, monsterId: boss.unitId, isBoss: true, charTypes: racesOf(boss), stats: statsOf(boss.stats), elemResist: resistOf(boss.resistances), attackElements: boss.attackElements || [] };
}

export const isBattleReport = report => report && report.kind === 'last-cloudia-battle-entry' && Array.isArray(report.units);
