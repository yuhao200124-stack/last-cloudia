// Reader loadout report (LoadoutReport.json, out of battle) → attacker spec: the account's real growth and
// loadout of every owned character — level / limit break / awakening, opened ability-board pieces
// (personality level, stat pieces), equipped passives, equipment and magic. Bitmasks follow the game's
// CommonUtil.FlagDecryptor (hex char p, bit 3..0 → index 4p + (3 − bit)); the index is a SWITCH_INDEX which
// maps back to an id in master row order, first row wins (engine/switch.json).
import { parseInts } from './battle.mjs';

export const isLoadoutReport = r => !!(r && r.tool === 'LastCloudiaLoadoutReader' && Array.isArray(r.units));

export function decodeFlags(hex) {
  const out = [];
  if (typeof hex !== 'string') return out;
  for (let p = 0; p < hex.length; p++) {
    const v = parseInt(hex[p], 16); if (Number.isNaN(v)) continue;
    for (let bit = 3; bit >= 0; bit--) if ((v >> bit) & 1) out.push(4 * p + (3 - bit));
  }
  return out;
}

const switchMap = pairs => { const m = new Map(); for (const [si, id] of pairs || []) if (!m.has(si)) m.set(si, id); return m; };

// Everything the report knows about one character (null when the account does not own it).
export function unitLoadout(report, master, switches, unitDressId) {
  const id = Number(unitDressId);
  const unit = (report.units || []).find(u => u.unitDressId === id);
  if (!unit) return null;
  const equip = (report.equipList || []).find(e => e.unitDressId === id) || unit.equip || {};
  const passiveOf = switchMap(switches?.PassiveSkillMst), skillOf = switchMap(switches?.SkillMst);
  const pieceRows = master.abilityPieces?.get(id) || [];
  const openedSwitch = new Set(decodeFlags(unit.abilityPieceInfo));
  const opened = pieceRows.filter(r => openedSwitch.has(Number(r.SWITCH_INDEX)));
  const pieces = new Set(opened.map(r => r.PIECE_NO));
  // personality: the highest opened level per base (UnitDressMst PERSONAL_SKILL lists the level-1 passives)
  const dress = master.unitDress.get(id);
  const personality = new Map();
  for (const base of parseInts(dress?.PERSONAL_SKILL || '').filter(Boolean)) personality.set(base, { passive: base, level: 1, base });
  for (const r of opened) if (r.ABILITY_PIECE_TYPE === 61) { const [passive, level, base] = parseInts(r.PARAM); if (base && (!personality.has(base) || personality.get(base).level < level)) personality.set(base, { passive, level, base }); }
  const skillLevels = {};
  for (const r of opened) if (r.ABILITY_PIECE_TYPE === 50 || r.ABILITY_PIECE_TYPE === 51) { const [skill, level] = parseInts(r.PARAM); if (skill) skillLevels[skill] = Math.max(skillLevels[skill] || 0, level || 1); }
  const passives = decodeFlags(equip.passiveSkillInfo).map(i => passiveOf.get(i)).filter(Boolean);
  const magic = decodeFlags(equip.magicInfo).map(i => skillOf.get(i)).filter(Boolean);
  const equips = [];
  for (const part of String(equip.equipInfo || '').split('-')) { const [pos, eid] = part.split(':').map(Number); if (eid) equips.push({ pos, id: eid }); }
  const equipLevels = {};
  for (const part of String(equip.equipLvInfo || '').split('-')) { const [pos, lv] = part.split(':').map(Number); if (pos && lv) equipLevels[pos] = lv; }
  for (const e of equips) if (equipLevels[e.pos]) e.level = equipLevels[e.pos];
  // reader v0.11: enhancement level per owned equipment id (UserItem.ItemEquipInfoList AlchemyLevel) and the
  // crest instance in slot 5 (UserItem.CrestInfoList keyed by user crest id) with its rolled trait passives
  const itemLevels = equipItemLevels(report);
  for (const e of equips) if (e.level == null && itemLevels.has(e.id)) e.level = itemLevels.get(e.id);
  const crestSlot = equips.find(e => e.pos === 5), gear = equips.filter(e => e.pos !== 5 && e.pos !== 6);
  const crest = crestSlot ? crestOf(report, crestSlot.id) : null;
  return { unitDressId: id, level: unit.lv, limitBreak: unit.limitbreakLv, awake: unit.awakeLv, pieces, pieceCount: opened.length, personality: [...personality.values()], skillLevels, passives, magic, equips: gear, crest, slots: equips, missingPassives: decodeFlags(equip.passiveSkillInfo).length - passives.length };
}

// Map equipment id → enhancement level from the report's owned-equipment rows (v0.11 `equipItems`).
export function equipItemLevels(report) {
  const m = new Map();
  const cols = report.equipItemColumns || ['itemEquipId', 'possession', 'newRecord', 'alchemyLevel', 'favorite'];
  const idI = cols.indexOf('itemEquipId'), lvI = cols.indexOf('alchemyLevel');
  for (const row of report.equipItems || []) if (Array.isArray(row) && row[idI] > 0) m.set(row[idI], row[lvI] || 0);
  return m;
}

// The crest instance behind a loadout's slot 5 (user crest id): crest id and its slot traits.
export function crestOf(report, userCrestId) {
  const c = (report.crests || []).find(x => x.userCrestId === userCrestId || x.key === userCrestId);
  if (!c) return userCrestId ? { userCrestId, crestId: 0, traits: [], missing: true } : null;
  const cols = report.crestSlotColumns || ['rank', 'maxRank', 'locked', 'lotteryNumber', 'passiveId'];
  const at = (row, name) => row[cols.indexOf(name)] || 0;
  const traits = (c.slots || []).map((row, i) => ({ slot: i + 1, rank: at(row, 'rank'), maxRank: at(row, 'maxRank'), locked: at(row, 'locked'), lotteryNumber: at(row, 'lotteryNumber'), passive: at(row, 'passiveId') })).filter(t => t.passive);
  return { userCrestId, crestId: c.crestId, favorite: c.favorite, traits };
}

// Attacker spec for scenario.addAttacker: computed panel (panelGiven false) from the report's growth and loadout.
export function attackerFromLoadout(report, master, switches, unitDressId, { extraPassives = [] } = {}) {
  const lo = unitLoadout(report, master, switches, unitDressId);
  if (!lo) return null;
  const listed = new Set(lo.passives);
  const passives = [...lo.passives.map(id => ({ id })), ...lo.personality.map(p => ({ id: p.passive })), ...extraPassives.filter(p => !listed.has(p.id))];
  return { unitDressId: lo.unitDressId, name: master.unitDress.get(lo.unitDressId)?.NAME, panelGiven: false, level: lo.level, limitBreak: lo.limitBreak, awake: lo.awake, pieces: lo.pieces, personality: lo.personality, passives, equips: lo.equips, magic: lo.magic, crest: lo.crest?.crestId ? { crestId: lo.crest.crestId, traits: lo.crest.traits } : null, loadout: lo };
}
