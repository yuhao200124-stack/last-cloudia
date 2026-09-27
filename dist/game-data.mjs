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

// The damage part the calculator uses: the first part that carries a damage coefficient.
export function gameMoveParameters(move) {
  const part = move?.parts?.find(p => p.coef != null);
  if (!part) return null;
  const type = part.kind === '物理' ? 'physical' : part.kind === '魔法' ? 'magical' : 'mixed';
  const cap = Math.max(0, ...move.parts.map(p => p.cap || 0));
  const variants = new Set(move.parts.filter(p => p.coef != null).map(p => `${p.statPercent}/${p.coef}`)).size;
  return {
    coefficient: part.coef, skillPercent: part.statPercent ?? 0, skillAdd: part.statAdd ?? 0, skillPostAdd: 0,
    type, element: move.inheritWeaponElement && move.element === '无' ? null : move.element, heavy: !!move.nonStackable,
    skillType: { 特技: 'skill', 魔法: 'magic', 超必杀: 'ultimate', 普通攻击: 'normal' }[move.type] || null,
    extraCap: cap, level: part.level, variants,
    note: `游戏数据：${move.nameS}${part.level ? ` Lv.${part.level}` : ''}，攻击修正 +${part.statPercent ?? 0}%，每段系数 ${part.coef}${cap ? `，招式自带伤害上限 +${cap.toLocaleString('zh-CN')}` : ''}${move.nonStackable ? '，不可叠加魔法（重魔法）' : ''}${variants > 1 ? '；该招式有多种弹道参数，这里取第一段' : ''}。段数不在游戏主数据中，需实测填写。`
  };
}
