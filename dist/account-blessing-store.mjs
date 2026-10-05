// The account's blessings (加护). Every character gets them; the game applies each one's own condition (attack
// element, weapon / armour type, skill type …), and of blessings with the same effect only the strongest is in a
// battle at all (a new, stronger one replaces the old: 基爾巴特 DEF +4% replaced 戈爾穆王子 DEF +3%). They grow as the
// account plays, so the user updates them from a new battle report (更新加护, user 2026-09-30: always on, only an
// update). The set is what a battle report lists: affiliation-4 passives with ids 60000000–60999999 (every
// PassiveSkillMst row in that range is a “…的加護”) and the values the game loaded (blessing levels scale them).
// The newest capture wins: the site's default (from the user's latest report) or the user's own update.
import { DEFAULT_BLESSINGS } from './account-blessing-default.mjs?v=20261005-1947';

const KEY = 'lc-account-blessings:v2';
export const isBlessingId = id => id >= 60000000 && id < 61000000;
const STAT_PROCESS = { 1030000: 'attack', 1030100: 'defense', 1030200: 'intelligence', 1030300: 'mind', 1030500: 'hp', 1031800: 'mp' };

// A battle report (reader kind last-cloudia-battle-entry) → {capturedAt, unit, blessings: {id: {segment: {p, v}}}}
export function blessingsFromReport(report) {
  const unit = report?.units?.[0]; if (!unit) return null;
  const blessings = {};
  for (const b of unit.raw?.buffs || []) {
    if (b.affiliation !== 4 || !isBlessingId(b.local_id) || b.removed) continue;
    const op = b.operations?.[0]; if (!Array.isArray(op?.values)) continue;
    (blessings[b.local_id] ||= {})[b.local_index ?? 0] = { p: op.rule?.id || op.origin_process_id || 0, v: op.values.slice() };
  }
  return Object.keys(blessings).length ? { capturedAt: report.capturedAt || new Date().toISOString(), unit: unit.name || '', blessings } : null;
}

function stored() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s?.blessings ? s : null; } catch { return null; } }
export function currentBlessingSet() {
  const mine = stored();
  return mine && String(mine.capturedAt) > String(DEFAULT_BLESSINGS.capturedAt) ? { ...mine, source: 'mine' } : { ...DEFAULT_BLESSINGS, source: 'site' };
}
export function saveBlessingSet(set) { try { localStorage.setItem(KEY, JSON.stringify(set)); return true; } catch { return false; } }

// id → {segment: values}, what the engine takes as passive parameters
export function accountBlessings() {
  const m = new Map();
  for (const [id, segs] of Object.entries(currentBlessingSet().blessings)) m.set(Number(id), Object.fromEntries(Object.entries(segs).map(([i, s]) => [i, s.v])));
  return m;
}
// the plain stat blessings (攻击力 / 防御 / 法强 / 魔抗 / HP / MP +x%), for the calculator's six-stat line
export function statBlessingPercents() {
  const out = { hp: 0, mp: 0, attack: 0, defense: 0, intelligence: 0, mind: 0 };
  for (const segs of Object.values(currentBlessingSet().blessings)) for (const s of Object.values(segs)) { const k = STAT_PROCESS[s.p]; if (k) out[k] += (s.v[1] || 0) / 100; }
  return out;
}
