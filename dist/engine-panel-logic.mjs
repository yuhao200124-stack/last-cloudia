// Pure pieces of the calculator's panel (engine-panel.mjs), kept apart so the tests can run them (user 2026-09-30, item 34).
import { K } from './engine/battle.mjs?v=20260930-1757';
export const FREE_COST = 99;
// COST 99 marks the always-on free passives (unique ones, 【超越】 …); a passive missing from the master counts as free
export const isFree = (master, id) => { const c = master?.passive.get(id)?.COST; return c == null || c >= FREE_COST; };

// What the character can wear, for the home page's 全输出 filter (user 2026-09-30): its own equipment types
// (UnitDressMst EQUIP_TYPE_INFO), types its own or the picked skills add (P_装備可否変更 1100000, e.g. 机械装备), and
// whether it can hold two weapons (P_二刀流 1080800 — its own, e.g. 梅莉 二刀流 / 阿尔克 真・二刀流, or a picked 二刀流).
export function gearFor(master, dress, passiveIds) {
  const row = master.unitDress.get(Number(dress));
  const types = new Set(String(row?.EQUIP_TYPE_INFO || '').split(/[,:]/).map(Number).filter(Boolean));
  let dual = false;
  for (const id of passiveIds) {
    const p = master.passive.get(Number(id)); if (!p) continue;
    for (const seg of String(p.PROCESS_INFO || '').split('@')) { const [pid, , first] = seg.split(':').map(Number); if (pid === 1100000 && first) types.add(first); if (pid === 1080800) dual = true; }
  }
  return { weapons: [...types].filter(t => t >= 10 && t < 20).sort(), armors: [...types].filter(t => t >= 20 && t < 30).sort(), dual };
}

// The move being evaluated is one the attacker has equipped. A character's own skills and 必杀 come with the
// character, but a magic (魔法) is carried only when it is equipped: without it the game's conditions that read
// the cast skill from the unit's own skills fail (洛琪希's 魔法連鎖 / 魔術共鳴 did not count in 配装 and
// 游戏数据 modes, about ×1.35 less than the real battle; found 2026-09-29 against the user's battle reports).
export function equipMove(spec, moveId, master, parseInts) {
  const id = Number(moveId); if (!id || !master.skill.has(id)) return;
  const type = master.skill.get(id).SKILL_TYPE;
  if (spec.skills?.length) { if (!spec.skills.some(s => Number(s.id) === id)) spec.skills = [...spec.skills, { id, type }]; return; }
  const dress = master.unitDress.get(Number(spec.unitDressId));
  const own = dress ? [...parseInts(dress.PRESET_SKILL), ...parseInts(dress.SKILL_SLOT_INFO)] : [];
  if (!own.includes(id) && !(spec.magic || []).map(Number).includes(id)) spec.magic = [...(spec.magic || []), id];
}

// 触发效果 lines: the sentence of a passive's game description that is this effect — by the trigger's words and the process
// name's effect words (user 2026-09-29: “直接写内容不要写哪些没用的”)
const TRIGGER_WORDS = [[[70, 71], /每\s*\d+(?:\.\d+)?\s*秒|每隔/], [[10], /战斗开始|开始时|入场/], [[11], /结束时/], [[40, 37], /体力|濒死|战斗不能/], [[42], /法力/],
  [[17, 74], /发动后|使用后|结束/], [[16, 18, 72, 73], /发动|使用|咏唱/], [[21, 23, 25, 27, 29], /攻击时|命中|造成/], [[22, 24, 26, 28, 30], /受到|被/], [[35, 36], /击倒|击败|打倒/],
  [[50, 78, 79], /异常|状态/], [[52, 68], /气绝|Break|破防|击破/], [[54, 60, 61, 62], /增益|减益|赋予/], [[65, 69], /存活|人数|战斗不能/], [[96, 97], /复活/], [[55], /必杀/], [[53], /咏唱/], [[66, 94], /地形|背景/], [[98], /领域/]];
const EFFECT_WORDS = ['伤害上限', '回复上限', '上限', '回复', '伤害', '攻击力', '防御', '精神', '魔力', '暴击', '速度', '法力', '体力', '特攻', '必杀', '特技', '魔法', '属性', '异常', '护盾', '减轻', '减半', '全体', '自身', '增益', '减益', '冰', '火', '雷', '树', '光', '暗', '咏唱', '气绝', 'Break'];
const effectNorm = t => String(t || '').replace(/恢复/g, '回复').replace(/MP/gi, '法力').replace(/HP/gi, '体力').replace(/法强|智力/g, '魔力');
export function effectSentence(text, trigger, processName) {
  const parts = String(text || '').replace(/\s*\n\s*/g, '').split('。').map(x => x.trim()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  const re = TRIGGER_WORDS.find(([ts]) => ts.includes(trigger))?.[1];
  const words = EFFECT_WORDS.filter(w => effectNorm(processName).includes(w));
  let best = null, bestScore = 0;
  for (const part of parts) { const n = effectNorm(part); const score = (re && re.test(n) ? 3 : 0) + words.filter(w => n.includes(w)).length; if (score > bestScore) { best = part; bestScore = score; } }
  return best || parts.join('。');
}

// 配装: the character's own SC skills (on its ability board, ownPassives with COST < 99) are always in the loadout at 0 SC;
// a loadout saved before may list some of them — they are taken out of the picked ones (they are in already)
export function splitBuild(c, selected, isFreeId) {
  const own = [...(c?.personality || []).map(p => p.passive), ...(c?.ownPassives || []).map(p => p.passive).filter(isFreeId), ...(c?.transcend || []).map(p => p.passive)];
  const ownSet = new Set(own);
  const auto = (c?.ownPassives || []).map(p => p.passive).filter(id => !isFreeId(id)).filter(id => !ownSet.has(id)), autoSet = new Set(auto);
  return { own, auto, picked: selected.filter(id => !ownSet.has(id) && !autoSet.has(id)), selected: selected.filter(id => !autoSet.has(id)) };
}

// The 配装 metric of one evaluation (single random 0.95): the move's first damaging bullet per call, crits weighted by
// the crit rate, and the parts shown as “what this skill changes”. Also used by the background evaluations (engine/eval-worker.mjs).
export function metricOf(out) {
  const all = out.hits.filter(h => !h.cancelled && h.normal), live = all.filter(h => h.bulletId === all[0]?.bulletId);
  const rateOf = h => Math.min(100, Math.max(0, h?.crt ?? out.stats.crt.real ?? 0)) / 100;
  const perCall = live.reduce((sum, h) => sum + h.normal.mean * (1 - rateOf(h)) + (h.critical ? h.critical.mean : h.normal.mean) * rateOf(h), 0);
  const h = live[0];
  const detail = h ? { magical: h.breakdown?.attack?.stat === K.STAT.INT, attack: h.attack, crt: h.crt ?? out.stats.crt.real, cap: h.capComputed ?? h.cap, killer: h.killerFactor, offense: h.offense, received: h.received, reduction: h.reduction, resist: h.resist,
    post: h.core ? h.afterPassives / h.core : null, crit: h.critical && h.normal?.mean ? h.critical.mean / h.normal.mean : null } : null;
  return { perCall, cap: h?.cap ?? null, errors: out.errors.length, detail };
}
