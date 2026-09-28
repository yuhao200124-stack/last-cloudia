// SC of a loadout (配装), shared by the calculator's 配装 and the character pages' 已保存配装.
// 能力盘突破 (the old skill table's rule, unchanged): 一破 / 二破 / 三破 each make one picked skill free — for each
// active break in the order 7, 12, 20, the highest-SC picked skill with SC ≤ that number that is not free yet.
// A character's own SC skill that is not on the skill table is always added and costs 0 (the user's rule); it is
// not in `items` here.
export const BREAKS = [[7, '一破'], [12, '二破'], [20, '三破']];
export const DEFAULT_BREAKS = BREAKS.map(([sc]) => sc);
export const breakName = sc => BREAKS.find(([n]) => n === sc)?.[1] || `${sc}`;
export const cleanBreaks = list => Array.isArray(list) ? [...new Set(list.map(Number).filter(n => DEFAULT_BREAKS.includes(n)))].sort((a, b) => a - b) : [...DEFAULT_BREAKS];

// items: [{ id, sc }] (sc: the game's COST; null / 0 / 99+ cost nothing) → each item's freeBy (a break's SC or null) and the total
export function scTotal(items, breaks = DEFAULT_BREAKS) {
  const out = items.map(item => ({ ...item, sc: Number(item.sc) > 0 && Number(item.sc) < 99 ? Number(item.sc) : 0, freeBy: null }));
  const used = new Set();
  for (const threshold of DEFAULT_BREAKS) {
    if (!breaks.includes(threshold)) continue;
    const eligible = out.filter(item => !used.has(item.id) && item.sc > 0 && item.sc <= threshold);
    if (!eligible.length) continue;
    const best = Math.max(...eligible.map(item => item.sc));
    const chosen = eligible.find(item => item.sc === best);
    chosen.freeBy = threshold; used.add(chosen.id);
  }
  return { items: out, total: out.reduce((sum, item) => sum + (item.freeBy ? 0 : item.sc), 0) };
}
