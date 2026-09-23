/* Sum qualified, comparable effect entries. These totals are not damage multipliers. */
const STAT_LABELS = { '攻击力': '攻击力加成', '法强': '法强加成', 'HP': '生命加成', 'MP': '魔力值加成', '防御力': '防御力加成', '魔抗': '魔抗加成' };
const ELEMENT_LABELS = { none: '无', fire: '火', ice: '冰', earth: '树', thunder: '雷', light: '光', dark: '暗' };

export function summarizeEffects(result) {
  const metrics = new Map();
  function metric(id, section, label, unit = '%', numeric = true) {
    if (!metrics.has(id)) metrics.set(id, { id, section, label, unit, numeric, total: 0, contributions: [] });
    return metrics.get(id);
  }
  for (const [target, label] of Object.entries(STAT_LABELS)) metric(`stat:${target}`, '属性加成', label);
  const element = ELEMENT_LABELS[result.context.element];
  if (element) metric(`damage:${element}属性伤害`, '伤害加成', `${element}属性伤害`);
  if (result.context.attackKind === 'magic') {
    if (element) metric(`damage:${element}属性魔法伤害`, '伤害加成', `${element}属性魔法伤害`);
    metric('damage:魔法伤害', '伤害加成', '魔法伤害');
    metric('damage:对Boss的魔法伤害', '伤害加成', '对Boss的魔法伤害');
  } else if (result.context.damageType === 'physical') metric('damage:物理伤害', '伤害加成', '物理伤害');
  metric('critRate', '暴击与咏唱', '暴击率加成');
  if (result.context.attackKind === 'magic') metric('castSpeed', '暴击与咏唱', '咏唱速度加成');
  metric('cap', '伤害上限', '本次攻击伤害上限加成', '');
  for (const row of result.rows) {
    if (row.status !== 'active') continue;
    for (const [index, effect] of row.rule.effects.entries()) {
      const number = typeof effect.value === 'number' && Number.isFinite(effect.value);
      let item;
      if (effect.type === 'stat' && number && effect.unit === '%') item = metric(`stat:${effect.target}`, '属性加成', STAT_LABELS[effect.target] || `${effect.target}加成`);
      else if (effect.type === 'statBuff' && number && effect.unit === '%') item = metric(`statBuff:${effect.target}`, '状态加成', `${effect.target}状态加成`);
      else if (effect.type === 'damage' && number && effect.unit === '%') item = metric(`damage:${effect.target}`, effect.target.includes('暴击伤害') ? '暴击与咏唱' : '伤害加成', effect.target);
      else if (effect.type === 'cap' && number && ['', '%'].includes(effect.unit)) item = metric(effect.unit === '%' ? 'cap-percent' : 'cap', '伤害上限', effect.unit === '%' ? '伤害上限百分比加成' : '本次攻击伤害上限加成', effect.unit);
      else if (effect.type === 'critRate' && number && effect.unit === '%') item = metric('critRate', '暴击与咏唱', '暴击率加成');
      else if (effect.type === 'castSpeed' && number && effect.unit === '%') item = metric('castSpeed', '暴击与咏唱', '咏唱速度加成');
      else if (effect.type === 'equipmentStat' && number && ['', '%'].includes(effect.unit)) item = metric(`equipmentStat:${effect.target}:${effect.unit}`, '装备属性', effect.target, effect.unit);
      else {
        const section = ['hit', 'killer', 'statReference', 'defenseReference', 'critPermission'].includes(effect.type) ? '本次攻击效果' : '其他效果';
        item = metric(`other:${effect.type}:${effect.target}`, section, effect.target, effect.unit, false);
      }
      const contribution = { sourceId: row.sourceId, sourceName: row.sourceName, sourceText: row.sourceText,
        group: row.group, ruleId: row.rule.id, rule: row.rule, effect, effectIndex: index, reasons: row.reasons };
      item.contributions.push(contribution);
      if (item.numeric) item.total += effect.value;
    }
  }
  return [...metrics.values()].filter(item => item.contributions.length > 0).map(item => ({ ...item, total: Math.round(item.total * 1e8) / 1e8 }));
}
