// Game master data (SkillMst / BulletMst / BulletLvInfoMst / UnitDressMst / ItemEquipMst / ArkMst / PassiveSkillMst,
// exported by the read-only loadout reader v0.8). Files live in ./game-data/; this module only reads them.
const base = new URL('./game-data/', import.meta.url);
const cache = new Map();
const json = path => {
  if (!cache.has(path)) cache.set(path, fetch(new URL(path, base)).then(r => { if (!r.ok) throw new Error(`游戏数据读取失败：${path}`); return r.json(); }).catch(err => { cache.delete(path); throw err; }));
  return cache.get(path);
};
export const loadGameIndex = () => json('index.json');
export const loadGameCharacter = unitDressId => json(`c/${unitDressId}.json`);
export const loadGameMagic = () => json('magic.json');
export const loadGameRelics = () => json('relics.json');

export async function gameCharacterForSite(siteCharacterId) {
  const index = await loadGameIndex();
  const unit = index.site?.[String(siteCharacterId)];
  return unit ? { character: await loadGameCharacter(unit), alias: index.magicAlias?.[String(siteCharacterId)] || {} } : null;
}

const plain = s => String(s || '').replace(/[\s・･·]/g, '');
// A site move ({kind, name}) → the game move of the same character.
export function findGameMove(game, move) {
  if (!game?.character || !move) return null;
  const c = game.character;
  if (move.kind === 'normal') return c.normal?.[0] || null;
  const slot = { s1: 0, s2: 1, s3: 2 }[move.kind];
  if (slot !== undefined) return c.specials?.[slot] || null;
  if (move.kind === 'ultimate') return c.ultimate || null;
  if (move.kind === 'magic') {
    const name = plain(game.alias?.[move.name] || move.name);
    return [...(c.magic?.normal || []), ...(c.magic?.heavy || [])].find(m => plain(m.nameS) === name || plain(m.name) === name) || null;
  }
  return null;
}

const kindOf = k => k === '物理' ? 'physical' : k === '魔法' ? 'magical' : 'mixed';
const gcd = (a, b) => b ? gcd(b, a % b) : a;
// The damage part the calculator uses: the first part that carries a damage coefficient.
export function gameMoveParameters(move) {
  const coefParts = move?.parts?.filter(p => p.coef != null) || [];
  const part = coefParts[0];
  if (!part) return null;
  // A genuinely mixed move in the game data is a multi-part skill where some parts are
  // physical-kind and others magical-kind (e.g. a 4-hit ultimate, 3 physical + 1 magic) --
  // never a single hit split across both stats. Only that case sets type:'mixed' and a
  // reference ratio; a move whose parts are all one kind keeps the original single-kind type.
  const kinds = new Set(coefParts.map(p => kindOf(p.kind)));
  let type = kindOf(part.kind), mixedRatio = null;
  if (kinds.has('physical') && kinds.has('magical')) {
    type = 'mixed';
    // Reference ratio: each side's share of total per-part damage weight (coef × statPercent),
    // rounded to whole tenths so it reads as a small physical/magic integer ratio (e.g. 3/7)
    // the way a player would write it by hand -- this only guides the user's own manually
    // confirmed mixed-settlement value, it is never applied automatically to any calculation.
    const weight = kind => coefParts.filter(p => kindOf(p.kind) === kind).reduce((sum, p) => sum + Math.abs(p.coef * (p.statPercent ?? 0)), 0);
    const physicalWeight = weight('physical'), magicWeight = weight('magical'), total = physicalWeight + magicWeight;
    if (total > 0) {
      const physicalShare = physicalWeight / total;
      const physicalUnits = Math.min(9, Math.max(1, Math.round(physicalShare * 10)));
      const magicUnits = 10 - physicalUnits;
      const divisor = gcd(physicalUnits, magicUnits) || 1;
      mixedRatio = { physical: physicalUnits / divisor, magic: magicUnits / divisor, physicalPercent: Math.round(physicalShare * 1000) / 10, magicPercent: Math.round((1 - physicalShare) * 1000) / 10 };
    }
  }
  const cap = Math.max(0, ...move.parts.map(p => p.cap || 0));
  const variants = new Set(coefParts.map(p => `${p.statPercent}/${p.coef}`)).size;
  return {
    id: move.id, name: move.nameS,
    coefficient: part.coef, skillPercent: part.statPercent ?? 0, skillAdd: part.statAdd ?? 0, skillPostAdd: 0,
    type, mixedRatio, element: move.inheritWeaponElement && move.element === '无' ? null : move.element, heavy: !!move.nonStackable,
    skillType: { 特技: 'skill', 魔法: 'magic', 超必杀: 'ultimate', 普通攻击: 'normal' }[move.type] || null,
    extraCap: cap, level: part.level, variants,
    note: `游戏数据：${move.nameS}${part.level ? ` Lv.${part.level}` : ''}，攻击修正 +${part.statPercent ?? 0}%，每段系数 ${part.coef}${cap ? `，招式自带伤害上限 +${cap.toLocaleString('zh-CN')}（已计入上限）` : ''}${move.nonStackable ? '，不可叠加魔法（重魔法）' : ''}${variants > 1 ? '；该招式有多种弹道参数，这里取第一段' : ''}${mixedRatio ? `；物理／魔力伤害权重比约 ${mixedRatio.physical}／${mixedRatio.magic}` : ''}。段数不在游戏主数据中，需实测填写。`
  };
}
