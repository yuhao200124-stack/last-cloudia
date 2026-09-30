// The home page's 配装 hide filter (全输出／半肉／全肉／不隐藏), apart from the page so the tests run it (user 2026-09-30, item 34).
// A skill's classification entries are [大类, stat, elements|null, attack types|null, 1 = drawback] (scripts/build-game-skill-table.mjs);
// `move` is what the calculator sends: { element, magical, roles, gear: { weapons, armors, dual } } or null.
// 配装: hide what the current loadout does not need (user 2026-09-29, revised 2026-09-30) — 全输出 hides the defense
// (受到伤害, HP／防御／魔抗, HP 回复), 反击, and the offense that does not apply to the current move; 半肉 only the offense
// that does not apply (反击 stays); 全肉 all offense and 反击; 不隐藏 nothing. MP (最大 MP, MP 回复) and 咏唱 are
// magic's (shown when the move is a magic); 金钱·经验 is hidden in every mode. 异常, 移动, 装备·种族 … always stay; 特攻
// is never hidden as “not applying”. An effect applies when its element and attack type match the move's (attack
// types: the move's SKILL_TYPE, plus 魔法 when it hits with 法强 — 水弹, a 特技, gets both 物理 and 冰魔法 bonuses) and,
// for 攻击力／法强, when it is the stat the move hits with. 全输出 also checks the gear (user 2026-09-30): a skill for a
// weapon or armour type the character cannot wear, for one weapon when it holds two (二刀流) or the other way round,
// or for fighting unarmed is hidden; what it can wear includes what its own and the picked skills add (机械装备 …).
(function (root) {
  const OFFENSE = new Set(['造成伤害', '伤害上限', '特攻', '暴击', 'Break值', '特技充能·必杀']);
  const DEFENSE = new Set(['受到伤害', '回复']);
  const kindOf = ([cat, stat]) => cat === '金钱·经验' ? 'never' : cat === '反击' ? 'counter' : cat === '魔法·咏唱' || stat === 'MP' && (cat === '基础属性' || cat === '回复') ? 'magic'
    : cat === '基础属性' ? (stat === '攻击力' || stat === '法强' ? 'off' : 'def') : OFFENSE.has(cat) ? 'off' : DEFENSE.has(cat) ? 'def' : 'other';
  function applies(move, [cat, stat, els, types]) {
    if (!move || cat === '特攻') return true;
    if (cat === '基础属性' && move.magical != null && stat !== (move.magical ? '法强' : '攻击力')) return false;
    // lowering the enemy's 防御 (DEF 贯通) helps only a move that hits with 攻击力 (a magic hits 魔抗)
    if (stat === 'DEF' && move.magical) return false;
    // (a stat raised only on the hit being made — 海滨洞察: 冰属性攻击时魔力 — carries that hit's element / attack type too)
    if (els && move.element != null && !els.includes(move.element)) return false;
    if (types && move.roles.length && !types.some(t => move.roles.includes(t))) return false;
    return true;
  }
  const WEAPON = { 剑: 10, 斧: 11, 枪: 12, 锤: 13, 弓: 14, 机械: 15, 爪: 16, 杖: 17 }, ARMOR = { 铠甲: 20, 衣服: 21, 法袍: 22 };
  function wearable(move, tags) {
    const gear = move?.gear; if (!gear) return true;
    const w = tags.map(t => t.startsWith('装备') && WEAPON[t.slice(2)] ? WEAPON[t.slice(2)] : null).filter(Boolean);
    if (w.length && !w.some(t => gear.weapons.includes(t))) return false;
    const a = tags.map(t => t.startsWith('装备') && ARMOR[t.slice(2)] ? ARMOR[t.slice(2)] : null).filter(Boolean);
    if (a.length && !a.some(t => gear.armors.includes(t))) return false;
    // how many weapons: two with 二刀流, else one (a skill for fighting unarmed is not for this character)
    const held = tags.filter(t => t === '只装一件武器' || t === '装两件武器' || t === '未装备武器');
    if (held.length && !held.includes(gear.dual ? '装两件武器' : '只装一件武器')) return false;
    return true;
  }
  function keep(mode, move, entries, tags = []) {
    if (mode === 'none' || !entries?.length) return true;
    const list = entries.some(e => !e[4]) ? entries.filter(e => !e[4]) : entries;
    if (mode === 'out' && !wearable(move, tags)) return false;
    const isMagic = !move || !move.roles.length || move.roles.includes(2);
    return list.some(e => {
      const k = kindOf(e);
      if (k === 'never') return false;
      if (k === 'magic') return isMagic;
      if (mode === 'out') return k === 'other' || (k === 'off' && applies(move, e));
      if (mode === 'half') return k === 'other' || k === 'def' || k === 'counter' || (k === 'off' && applies(move, e));
      return k === 'other' || k === 'def';
    });
  }
  root.GameSkillFilter = { kindOf, applies, wearable, keep, WEAPON, ARMOR };
})(typeof window !== 'undefined' ? window : globalThis);
