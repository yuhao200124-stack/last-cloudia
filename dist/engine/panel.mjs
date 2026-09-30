// Out-of-battle panel from master data, the way UnitUtil.GetUnitBasicStatus / FillUnitDressParam build it:
//   stat = min + round(max × GROWTH_RATE[lv] / 10000)      (UnitDressMst PARAMETER_INFO "min-max", GrowthMst id 2)
//        + Σ UnitDressAwakeMst rows up to the awakening level
//        + Σ opened ability-board stat pieces (UnitDressAbilityPieceMst types 10–15)
// then equipment parameters (ItemEquipMst, enhanced) join before the trigger-1 passives (battle.mjs finalStat).
// Verified against four characters' in-game maximum panels (洛琪希 / 魔神梅莉 / 龙王阿尔克 / 艾莉丝, all six stats).
import { K, parseInts } from './battle.mjs?v=20260930-1532';

// GrowthMst GROWTH_RATE (reader v0.10: 120 levels, Lv100 = 10000, Lv110 = 10813, Lv120 = 12633) is the
// source; these points are the fallback when an older export has no GrowthMst.
export const KNOWN_GROWTH_RATE = { 1: 0, 100: 10000, 110: 10813, 120: 12633 };
const STAT_ORDER = ['hp', 'mp', 'str', 'def', 'int', 'mnd']; // PARAMETER_INFO / awake / equipment column order
const STAT_CODE = { hp: K.STAT.MAX_HP, mp: K.STAT.MAX_MP, str: K.STAT.STR, def: K.STAT.DEF, int: K.STAT.INT, mnd: K.STAT.MND, crt: K.STAT.CRT };
const PIECE_STAT = { 10: 'hp', 11: 'mp', 12: 'str', 13: 'def', 14: 'int', 15: 'mnd' };
const round = x => Math.floor(x + 0.5);

// Growth rate (per 10000 of the max growth) for a level; `estimated` when the curve is interpolated.
export function growthRate(master, level, growthId = 2) {
  const row = master.growth?.get(growthId);
  if (row) {
    const rates = parseInts(String(row.GROWTH_RATE).replace(/,/g, ':'));
    if (rates.length >= level) return { rate: rates[level - 1], estimated: false };
  }
  if (KNOWN_GROWTH_RATE[level] != null) return { rate: KNOWN_GROWTH_RATE[level], estimated: false };
  const known = Object.keys(KNOWN_GROWTH_RATE).map(Number).sort((a, b) => a - b);
  const lo = known.filter(l => l < level).pop() ?? known[0], hi = known.find(l => l > level) ?? known[known.length - 1];
  const t = hi === lo ? 0 : (level - lo) / (hi - lo);
  return { rate: round(KNOWN_GROWTH_RATE[lo] + (KNOWN_GROWTH_RATE[hi] - KNOWN_GROWTH_RATE[lo]) * t), estimated: true };
}

export function maxLevel(master, unitDressId, limitBreak = null) {
  const rows = master.limitBreak?.get(Number(unitDressId)) || [];
  const usable = limitBreak == null ? rows : rows.filter(r => r.LIMITBREAK_LV <= limitBreak);
  return usable.length ? Math.max(...usable.map(r => r.MAX_LV)) : 100;
}
export function maxAwake(master, unitDressId) {
  const rows = master.awake?.get(Number(unitDressId)) || [];
  return rows.length ? Math.max(...rows.map(r => r.AWAKE_LV)) : 0;
}

// `pieces`: 'all' (every board piece opened), a Set of piece numbers, or the reader's abilityPieceInfo hex bitmask.
function openedPieces(rows, pieces) {
  if (pieces === 'all' || pieces == null) return rows;
  if (pieces instanceof Set) return rows.filter(r => pieces.has(r.PIECE_NO));
  if (typeof pieces === 'string') { // hex string, bit n = piece n (low bit of the first nibble first, as the reader lists it)
    const bits = []; for (const ch of pieces) { const v = parseInt(ch, 16); for (let b = 3; b >= 0; b--) bits.push((v >> b) & 1); }
    return rows.filter(r => bits[r.PIECE_NO] === 1);
  }
  return rows;
}

// Bare (装備なし) stats of a character: level growth + awakening + opened stat pieces; plus its resistances.
export function bareStats(master, unitDressId, { level = null, awake = null, pieces = 'all', limitBreak = null } = {}) {
  const dress = master.unitDress.get(Number(unitDressId));
  if (!dress) return null;
  const lv = level ?? maxLevel(master, unitDressId, limitBreak);
  const aw = awake ?? maxAwake(master, unitDressId);
  const { rate, estimated } = growthRate(master, lv, dress.GROWTH_ID ?? 2);
  const ranges = String(dress.PARAMETER_INFO).split(',').filter(Boolean).map(p => p.split('-').map(Number));
  const parts = { level: {}, awake: {}, pieces: {} }, stats = {};
  STAT_ORDER.forEach((k, i) => { const [min, max] = ranges[i] || [0, 0]; parts.level[k] = min + round(max * rate / 10000); parts.awake[k] = 0; parts.pieces[k] = 0; });
  for (const r of master.awake?.get(Number(unitDressId)) || []) if (r.AWAKE_LV <= aw) { parts.awake.hp += r.HP; parts.awake.mp += r.MP; parts.awake.str += r.ATK; parts.awake.def += r.DEF; parts.awake.int += r.MATK; parts.awake.mnd += r.MDEF; }
  const elemResist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  parseInts(dress.RESIST_ELEM_INFO).forEach((v, i) => { if (i < 6) elemResist[i + 1] += v; });
  const opened = openedPieces((master.abilityPieces?.get(Number(unitDressId)) || []).filter(r => limitBreak == null || r.LIMITBREAK_LV <= limitBreak), pieces);
  for (const r of opened) {
    const stat = PIECE_STAT[r.ABILITY_PIECE_TYPE];
    if (stat) parts.pieces[stat] += Number(r.PARAM) || 0;
    else if (r.ABILITY_PIECE_TYPE === 40) { const [elem, v] = parseInts(r.PARAM); if (elemResist[elem] != null) elemResist[elem] += v || 0; }
  }
  for (const k of STAT_ORDER) stats[k] = parts.level[k] + parts.awake[k] + parts.pieces[k];
  stats.crt = dress.CRITICAL_RATE || 0;
  return { stats, parts, elemResist, level: lv, awake: aw, rate, estimated, pieceCount: opened.length };
}

// Equipment parameters at an enhancement level +0…+MAX_LV (max by default). ItemEquipParameterGrowthMst
// PARAM_MAP gives one value per level (0 at +0, e.g. 99 at +40 for growth type 3, 40 for type 0); the
// growth fraction is map[lv] / map[MAX_LV], so +MAX_LV is exactly PARAMETER_MAX_INFO (神帝劍 +40 = 198).
// Without the table the value is interpolated linearly and flagged `estimated`.
export function equipmentStats(master, equipId, level = null) {
  const row = master.itemEquip.get(Number(equipId));
  if (!row) return null;
  const lo = parseInts(row.PARAMETER_INFO), hi0 = parseInts(row.PARAMETER_MAX_INFO), maxLv = row.MAX_LV || 0;
  const hi = maxLv > 0 ? hi0 : lo; // MAX_LV 0 (e.g. 均衡的天冥珠): not enhanceable, PARAMETER_MAX_INFO is empty and PARAMETER_INFO is the value
  const lv = level == null ? maxLv : Math.max(0, Math.min(maxLv, level));
  let t = maxLv <= 0 ? 1 : lv / maxLv, estimated = false;
  const g = master.equipGrowth?.get(row.EQUIP_GROWTH_TYPE);
  if (lv > 0 && lv < maxLv) {
    const map = g ? parseInts(String(g.PARAM_MAP).replace(/,/g, ':')) : [];
    if (map.length > maxLv && map[maxLv] > 0) t = map[lv] / map[maxLv]; else estimated = true;
  }
  const stats = {};
  STAT_ORDER.forEach((k, i) => { const a = lo[i] || 0, b = hi[i] || 0; stats[k] = lv >= maxLv ? b : lv <= 0 ? a : round(a + (b - a) * t); });
  const elemResist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  parseInts(row.RESIST_ELEM_INFO).forEach((v, i) => { if (i < 6) elemResist[i + 1] = v; });
  return { id: row.ITEM_EQUIP_ID, name: row.NAME, type: row.EQUIP_TYPE, elem: row.ELEM, level: lv, maxLevel: maxLv, stats, elemResist, estimated };
}

// A crest's own parameters (CrestMst PARAMETER_INFO "HP:MP:STR:DEF:INT:MND", added like equipment) and resistances.
// `maxLevel`: the top level of the same crest line (ids share the prefix, LV 1–10: 200101 … 200110).
export function crestStats(master, crestId, { maxLevel = false } = {}) {
  let row = master.crest?.get(Number(crestId));
  if (!row) return null;
  if (maxLevel) { const family = Math.floor(row.CREST_ID / 100); for (const r of master.crest.values()) if (Math.floor(r.CREST_ID / 100) === family && r.LV > row.LV) row = r; }
  const vals = parseInts(row.PARAMETER_INFO), stats = {};
  STAT_ORDER.forEach((k, i) => { stats[k] = vals[i] || 0; });
  const elemResist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  parseInts(row.RESIST_ELEM_INFO).forEach((v, i) => { if (i < 6) elemResist[i + 1] = v; });
  return { id: row.CREST_ID, name: row.NAME, level: row.LV, rare: row.RARE, stats, elemResist, lotteryGroup: row.CREST_TRAIT_LOTTERY_GROUP_NUMBER, upgradedFrom: row.CREST_ID !== Number(crestId) ? Number(crestId) : null };
}

// The character's exclusive weapon and armour (ItemEquipMst UNIT_DRESS_ID), the default loadout without a report.
export function exclusiveEquipment(master, unitDressId) {
  const out = [];
  for (const row of master.itemEquip.values()) if (row.UNIT_DRESS_ID === Number(unitDressId)) out.push(row);
  const weapon = out.find(r => r.EQUIP_TYPE >= 10 && r.EQUIP_TYPE < 20), armour = out.find(r => r.EQUIP_TYPE >= 20 && r.EQUIP_TYPE < 30);
  return [weapon && { pos: 1, id: weapon.ITEM_EQUIP_ID }, armour && { pos: 2, id: armour.ITEM_EQUIP_ID }].filter(Boolean);
}

export const statCodes = stats => { const out = {}; for (const [k, code] of Object.entries(STAT_CODE)) if (stats[k] != null) out[code] = stats[k]; return out; };
