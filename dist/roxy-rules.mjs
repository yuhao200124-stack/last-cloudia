/* Roxy's source descriptions are preserved from character-260.html.
 * Rules declare applicability, not an invented damage stacking formula. */
export { DEFAULT_CONTEXT, CONDITION_FIELDS, normalizeContext, evaluateCatalog, formatEffect, describeCondition } from './effect-rule-engine.mjs';
export const ATTACKS = [
  { id: 'normal', label: '普通攻击' }, { id: 's1', label: '特技1 · 水球' },
  { id: 's2', label: '特技2 · 冰柱破碎' }, { id: 's3', label: '特技3 · 暴风雪' },
  { id: 'magic', label: '魔法' }, { id: 'ultimate', label: '超必杀 · 积雨云' },
];
const eq = (field, value) => ({ field, op: 'eq', value });
const inside = (field, value) => ({ field, op: 'in', value });
const outside = (field, value) => ({ field, op: 'notIn', value });
const effect = (type, target, value, unit = '%', extra = {}) => ({ type, target, value, unit, ...extra });
const rule = (id, part, text, conditions, effects, extra = {}) => ({ id, part, text, conditions, effects, review: 'ready', verification: 'description', ...extra });
const source = (id, name, group, text, rules) => ({ id, name, group, text, rules });
const ice = eq('element', 'ice');
const magic = eq('attackKind', 'magic');
const magicDamage = eq('damageType', 'magical');
const boss = eq('boss', true);
const killer = eq('killer', true);
const staff = eq('staff', true);
const robe = eq('robe', true);
const ultimate = eq('attackKind', 'ultimate');
const damage = (target, value) => effect('damage', target, value);
const cap = (target, value) => effect('cap', target, value, '');
const stat = (target, value, detail) => effect('stat', target, value, '%', detail ? { detail } : {});
const iceMagic = [magic, ice];

function simple(id, name, group, text, conditions, effects, extra = {}) {
  return source(id, name, group, text, [rule(`${id}-effect`, '效果', text, conditions, effects, extra)]);
}
function killerCap(id, name, group, text, base, single, unarmed = false) {
  return source(id, name, group, text, [
    rule(`${id}-single`, unarmed ? '单武器／无武器上限' : '单武器上限', text,
      [killer, unarmed ? inside('weaponCount', [0, 1]) : eq('weaponCount', 1)], [cap('特攻伤害上限', single)], { note: '替换基础数值，不与本技能另一档叠加。' }),
    rule(`${id}-base`, '其余武器配置上限', text,
      [killer, unarmed ? eq('weaponCount', 2) : outside('weaponCount', [1])], [cap('特攻伤害上限', base)], { note: '与本技能的另一档互斥。' }),
  ]);
}

export const CATALOG = [
  source('water-king', '水王级魔术师', 'traits', '仅装备1件武器时，冰属性伤害+50%、伤害上限+60,000。使用魔法攻击时，对BOSS触发特攻；冰属性魔法Hit数变为2倍，但单次伤害降至60%（不包含“科学”“圣剑”等特殊类型魔法）。使用特技或超必杀技攻击时，以自身INT及敌方MND计算伤害，并对BOSS触发特攻。', [
    rule('water-single', '① 单武器冰属性加成', '仅装备1件武器时，冰属性伤害+50%、伤害上限+60,000。', [eq('weaponCount', 1), ice], [damage('冰属性伤害', 50), cap('冰属性伤害上限', 60000)]),
    rule('water-magic-killer', '② 魔法对 Boss 特攻', '使用魔法攻击时，对BOSS触发特攻', [magic, boss], [effect('killer', 'Boss', true, '')]),
    rule('water-ice-hits', '③ 冰魔法多段', '冰属性魔法Hit数变为2倍，但单次伤害降至60%（不包含“科学”“圣剑”等特殊类型魔法）。', [...iceMagic, outside('magicFamily', ['science', 'sword', 'other'])], [effect('hit', '冰属性魔法', 2, '倍', { secondary: 0.6 })]),
    rule('water-skill-reference', '④ 特技／超必特殊结算', '使用特技或超必杀技攻击时，以自身INT及敌方MND计算伤害，并对BOSS触发特攻。', [inside('attackKind', ['skill', 'ultimate']), boss], [effect('statReference', '法强', '魔抗', ''), effect('killer', 'Boss', true, '')], { verification: 'untested', note: '按描述记录参照属性和特攻；特技1、2、3及超必杀需分别验证，不能套用其他角色的倍率。' }),
  ]),
  source('mentor', '指导者', 'traits', '战斗开始时及每40秒，为我方全体赋予“触发特攻时伤害上限+30,000”的增益。BOSS Wave开始时，为我方全体赋予“冰、雷属性伤害上限+20,000”的增益，持续至陷入无法战斗状态。发动攻击系特技或魔法时，有概率中幅回复除自身外我方全体的HP。', [
    rule('mentor-killer-cap', '特攻上限增益', '战斗开始时及每40秒，为我方全体赋予“触发特攻时伤害上限+30,000”的增益。', [eq('killerBuff', true), killer], [cap('特攻伤害上限', 30000)], { note: '由条件选项表示当前增益存在；同一增益的再次赋予不重复累加。' }),
    rule('mentor-boss-wave', 'Boss Wave 冰雷上限', 'BOSS Wave开始时，为我方全体赋予“冰、雷属性伤害上限+20,000”的增益，持续至陷入无法战斗状态。', [boss, eq('bossWaveBuff', true), eq('alive', true), inside('element', ['ice', 'thunder'])], [cap('冰／雷属性伤害上限', 20000)]),
    rule('mentor-heal', '攻击时概率回复队友', '发动攻击系特技或魔法时，有概率中幅回复除自身外我方全体的HP。', [inside('attackKind', ['skill', 'magic'])], [effect('recovery', '其他我方单位生命', '概率中幅回复', '')], { note: '仅表示这类攻击可以触发，未假设每次必定回复；概率和回复数值原文未提供。' }),
  ]),
  simple('magic-guide-max', '魔导提升极', 'exclusive', 'INT、MP+15%', [], [stat('法强', 15), stat('MP', 15)]),
  simple('magic-steady-max', '魔常提升极', 'exclusive', 'INT、MND、MP+15%', [], [stat('法强', 15), stat('魔抗', 15), stat('MP', 15)]),
  killerCap('killer-cap-v', '特攻界限突破V', 'exclusive', '触发特攻时伤害上限+7,500；仅装备1件武器时提升为+15,000', 7500, 15000),
  simple('knowledge-wall-ii', '知识之壁II', 'exclusive', '战斗开始时，将INT的10%加算至DEF与MND', [], [effect('stat', '防御力与魔抗', '加算开战时法强的10%', '')], { note: '需使用开战时的法强取值，不是防御力与魔抗各自增加10%；不能从当前面板再次重复加算。' }),
  simple('auto-recast', '自动再咏唱', 'exclusive', '始终保持魔法“再咏唱”的效果：魔法咏唱速度+30%。', [magic], [effect('castSpeed', '魔法咏唱速度', 30)], { note: '自动技能为常驻效果。再咏唱的具体数值依据 Altema /maho/49；不属于伤害加成。' }),
  simple('auto-heal-ii', '自动治疗II', 'exclusive', 'HP首次进入濒死时，消耗30MP自动超回复HP（HP回复上限+5,000）', [eq('lowHp', true), eq('firstLowHp', true), eq('mpEnough', true)], [effect('recovery', '自身生命', '消耗30魔力值后超回复；回复上限+5,000', '')], { note: '濒死判定及具体回复量原文未列；条件由使用者或读取报告确认。' }),
  simple('moonlight-ii', '月光II', 'exclusive', 'HP全满时，INT+30%', [eq('fullHp', true)], [effect('statBuff', '法强', 30)], { note: '每Wave开始及HP变化时重新判断满血条件；实时法强层+30%，不计入入场前面板。与已生效EX灵气+50%同层加算。' }),
  simple('ice-ultimate-boost', '冰系究极增幅', 'exclusive', '冰属性魔法伤害+30%、冰属性魔法伤害上限+5,000', iceMagic, [damage('冰属性魔法伤害', 30), cap('冰属性魔法伤害上限', 5000)]),
  simple('ice-critical-revised', '冰属性暴击·改', 'exclusive', '冰属性魔法可触发暴击；冰属性魔法伤害上限+2,000', iceMagic, [effect('critPermission', '冰属性魔法', true, ''), cap('冰属性魔法伤害上限', 2000)]),
  simple('mage-mindset-ii', '魔导士心得II', 'exclusive', '同时装备法杖与长袍时，法杖的INT和长袍的MND+100%', [staff, robe], [effect('equipmentStat', '法杖自身法强', 100), effect('equipmentStat', '长袍自身魔抗', 100)], { note: '提升装备提供的对应属性，不是角色总法强／魔抗翻倍。' }),
  source('staff-ultimate-boost', '法杖究极增幅', 'exclusive', '装备法杖时，物理伤害+10%、魔法伤害+20%、魔法伤害上限+5,000', [
    rule('staff-physical', '法杖物理增伤', '装备法杖时，物理伤害+10%', [staff, eq('damageType', 'physical')], [damage('物理伤害', 10)]),
    rule('staff-magical', '法杖魔法增伤及上限', '装备法杖时，物理伤害+10%、魔法伤害+20%、魔法伤害上限+5,000', [staff, magicDamage], [damage('魔法伤害', 20), cap('魔法伤害上限', 5000)]),
  ]),
  source('robe-ultimate-boost', '长袍究极增幅', 'exclusive', '装备长袍时，MND+20%、魔法伤害+15%、受到的伤害-10%', [
    rule('robe-stats-defense', '长袍属性及减伤', '装备长袍时，MND+20%、魔法伤害+15%、受到的伤害-10%', [robe], [stat('魔抗', 20), effect('defense', '受到的伤害', -10)]),
    rule('robe-magic-damage', '长袍魔法增伤', '装备长袍时，MND+20%、魔法伤害+15%、受到的伤害-10%', [robe, magicDamage], [damage('魔法伤害', 15)]),
  ]),
  simple('giant-purge-v', '巨型净化V', 'exclusive', '对BOSS的魔法伤害+20%、伤害上限+10,000', [boss, magicDamage], [damage('对Boss的魔法伤害', 20), cap('对Boss的魔法伤害上限', 10000)]),
  simple('penetration', '贯导', 'exclusive', '魔法攻击时，有概率将敌方MND减半后计算伤害', [magic, eq('penetration', true)], [effect('defenseReference', '敌方魔抗', 50, '%')], { note: '本次是否触发需要手动或读取器确认；触发概率未知，不按必定触发计算。' }),
  simple('maze-conqueror', '迷宫踏破', 'exclusive', '战斗获得EXP+100%、敌人掉落金币+100%（两种增益均不可叠加）', [], [effect('utility', '获得经验', 100), effect('utility', '掉落金币', 100)], { note: '经验和金币各自不可叠加；不属于伤害加成。' }),
  source('magic-resonance', '魔术共鸣', 'exclusive', 'MP、INT+20%；我方发动不可叠加魔法期间，冰属性伤害+30%、伤害上限+50,000', [
    rule('resonance-stats', '常驻属性', 'MP、INT+20%', [], [stat('MP', 20), stat('法强', 20)]),
    rule('resonance-ice', '不可叠加魔法期间的冰伤', '我方发动不可叠加魔法期间，冰属性伤害+30%、伤害上限+50,000', [eq('resonance', true), ice], [damage('冰属性伤害', 30), cap('冰属性伤害上限', 50000)]),
  ]),
  source('short-incantation', '缩短咏唱', 'exclusive', '装备法杖时，魔法伤害上限+30,000；装备冰属性法杖时，攻击魔法咏唱速度+50%', [
    rule('incantation-cap', '法杖魔法上限', '装备法杖时，魔法伤害上限+30,000', [staff, magicDamage], [cap('魔法伤害上限', 30000)]),
    rule('incantation-speed', '冰杖攻击魔法咏唱', '装备冰属性法杖时，攻击魔法咏唱速度+50%', [eq('iceStaff', true), magic], [effect('castSpeed', '攻击魔法咏唱速度', 50)]),
  ]),
  source('extraordinary-magician', '超规格的魔术师', 'exclusive', '始终保持“EX灵气”（法强+50%）与“超级魔法阵”（持续大量恢复MP）的效果；超必杀技伤害+100%、伤害上限+200,000', [
    rule('extraordinary-aura', '常驻 EX 灵气', '始终保持“EX灵气”（法强+50%）与“超级魔法阵”（持续大量恢复MP）的效果', [], [effect('statBuff', '法强', 50, '%', { detail: 'EX灵气；已计入战斗面板时不重复加算' })]),
    rule('extraordinary-mp', '常驻超级魔法阵', '始终保持“EX灵气”（法强+50%）与“超级魔法阵”（持续大量恢复MP）的效果', [], [effect('recovery', 'MP', '持续大量恢复', '')], { note: '原文没有每次恢复数值和间隔，不猜测回复量。' }),
    rule('extraordinary-ultimate', '超必增伤与上限', '超必杀技伤害+100%、伤害上限+200,000', [ultimate], [damage('超必杀技伤害', 100), cap('超必杀技伤害上限', 200000)]),
  ]),
  simple('mp-up-max', 'MP提升极', 'common', 'MP+20%', [], [stat('MP', 20)]),
  simple('critical-up-iii', '暴击提升III', 'common', '暴击率+8%', [], [effect('critRate', '暴击率', 8)], { note: '提高暴击率不会自行赋予魔法暴击资格。' }),
  simple('proud-force', '骄傲之力', 'common', '触发暴击时回复HP', [eq('critical', true)], [effect('recovery', '自身生命', '回复，数值未列', '')]),
  simple('special-boost', '特攻增幅', 'common', '触发特攻时伤害+50%', [killer], [damage('特攻伤害', 50)], { note: '记录特攻伤害修正，不能当作触发特攻的能力；与其他增伤的结算层级需另行验证。' }),
  killerCap('killer-cap-iii', '特攻界限突破III', 'common', '触发特攻时伤害上限+3,000；仅装备1件武器时提升为+6,000', 3000, 6000),
  simple('ardor', '锐气', 'common', 'HP全满时，暴击率+10%', [eq('fullHp', true)], [effect('critRate', '暴击率', 10)]),
  simple('ice-high-boost', '冰系超级增幅', 'common', '冰属性魔法伤害+30%、冰属性魔法伤害上限+2,000', iceMagic, [damage('冰属性魔法伤害', 30), cap('冰属性魔法伤害上限', 2000)]),
  simple('ice-attack-iii', '冰属性攻击提升III', 'common', '冰属性伤害+30%、冰属性伤害上限+2,000', [ice], [damage('冰属性伤害', 30), cap('冰属性伤害上限', 2000)]),
  source('ice-critical-boost', '冰属性暴击提升', 'common', '冰属性攻击暴击率+5%、暴击伤害+50%', [
    rule('ice-critical-rate', '冰属性暴击率', '冰属性攻击暴击率+5%', [ice], [effect('critRate', '冰属性攻击暴击率', 5)]),
    rule('ice-critical-damage', '冰属性暴击伤害', '冰属性攻击暴击率+5%、暴击伤害+50%', [ice], [effect('damage', '冰属性暴击伤害', 50, '%', { detail: '仅暴击时适用；此处统计加成，不判定本次是否暴击' })]),
  ]),
  source('spell-link', '法术联结', 'common', '连续使用相同攻击魔法时伤害提升（第1次+4%，最高+20%）',
    [0, 1, 2, 3, 4, 5].map(n => rule(`spell-link-${n}`, n === 0 ? '未叠加' : `连续魔法第${n}次`,
      '连续使用相同攻击魔法时伤害提升（第1次+4%，最高+20%）',
      [magic, eq('chainStacks', n)], [damage('魔法伤害', n * 4)],
      { note: '用户已确认：每次增加4%，依次为4%／8%／12%／16%／20%，最高20%；0档保留可调整来源，不增加合计。' }))),
  simple('giant-purge-iii', '巨型净化III', 'common', '对BOSS的魔法伤害+20%、伤害上限+4,000', [boss, magicDamage], [damage('对Boss的魔法伤害', 20), cap('对Boss的魔法伤害上限', 4000)]),
  simple('giant-shield-ii', '巨型护盾II', 'common', '受到BOSS的伤害-20%', [boss], [effect('defense', '受到Boss的伤害', -20)]),
  simple('trans-ultimate-ii', '超必杀技增幅II', 'transcend', '【超越】超必杀技伤害+50%、伤害上限+10,000', [ultimate], [damage('超必杀技伤害', 50), cap('超必杀技伤害上限', 10000)]),
  simple('trans-reduction', '受到伤害减轻-20%', 'transcend', '【超越】受到敌人的伤害-20%', [], [effect('defense', '受到敌人的伤害', -20)]),
  simple('trans-life-magic', '命导提升', 'transcend', '【超越】HP、INT+20%', [], [stat('HP', 20), stat('法强', 20)]),
  simple('trans-robe-ii', '长袍精通II', 'transcend', '【超越】装备长袍时，长袍的INT与MND+50%、受到的伤害-15%', [robe], [effect('equipmentStat', '长袍自身法强', 50), effect('equipmentStat', '长袍自身魔抗', 50), effect('defense', '受到的伤害', -15)]),
  simple('trans-giant-shield', '巨型护盾', 'transcend', '【超越】受到BOSS的伤害-20%', [boss], [effect('defense', '受到Boss的伤害', -20)]),
  killerCap('trans-killer-cap', '特攻界限突破', 'transcend', '【超越】触发特攻时伤害上限+10,000；仅装备1件武器或未装备武器时提升为+20,000', 10000, 20000, true),
  simple('trans-magic-weakness', '魔法弱点增幅', 'transcend', '【超越】魔法攻击命中弱点属性时，伤害+30%', [magic, eq('weakness', true)], [damage('命中弱点的魔法伤害', 30)]),
  source('roxy-staff', '洛琪希之杖', 'equipment', '最高属性：MP+50 / INT+365 / MND+97；最高效果：仅装备1件武器时，冰属性魔法伤害+35%、伤害上限+6,000。触发特攻时伤害上限+5,000。INT+15%', [
    rule('roxy-staff-stats', '装备固定属性', 'MP+50 / INT+365 / MND+97', [], [effect('equipmentStat', '装备魔力值', 50, ''), effect('equipmentStat', '装备法强', 365, ''), effect('equipmentStat', '装备魔抗', 97, '')]),
    rule('roxy-staff-ice', '单武器冰魔法加成', '仅装备1件武器时，冰属性魔法伤害+35%、伤害上限+6,000', [eq('weaponCount', 1), ...iceMagic], [damage('冰属性魔法伤害', 35), cap('冰属性魔法伤害上限', 6000)]),
    rule('roxy-staff-killer', '特攻上限', '触发特攻时伤害上限+5,000', [killer], [cap('特攻伤害上限', 5000)], { note: '装备原文以句号分隔；本句仅要求触发特攻。依据 Altema /soubi/1890。' }),
    rule('roxy-staff-int', '法强加成', 'INT+15%', [], [stat('法强', 15)], { note: '装备原文以句号分隔；法强+15%是装备常驻属性。依据 Altema /soubi/1890。' }),
  ]),
  source('roxy-robe', '洛琪希的衣服', 'equipment', '最高属性：MP+80 / DEF+167 / INT+229 / MND+116；最高效果：受到的物理攻击、超必杀技伤害-15%；对BOSS的冰属性魔法伤害上限+5,000；自身存活时，我方全体物理与魔法伤害上限+5,000', [
    rule('roxy-robe-stats', '装备固定属性', 'MP+80 / DEF+167 / INT+229 / MND+116', [], [effect('equipmentStat', '装备魔力值', 80, ''), effect('equipmentStat', '装备防御力', 167, ''), effect('equipmentStat', '装备法强', 229, ''), effect('equipmentStat', '装备魔抗', 116, '')]),
    rule('roxy-robe-reduction', '物理与超必减伤', '受到的物理攻击、超必杀技伤害-15%', [], [effect('defense', '受到的物理攻击／超必杀技伤害', -15)]),
    rule('roxy-robe-boss-cap', '对Boss冰魔法上限', '对BOSS的冰属性魔法伤害上限+5,000', [boss, ...iceMagic], [cap('对Boss的冰属性魔法伤害上限', 5000)]),
    rule('roxy-robe-team-cap', '存活时全体上限', '自身存活时，我方全体物理与魔法伤害上限+5,000', [eq('alive', true), inside('damageType', ['physical', 'magical'])], [cap('物理／魔法伤害上限', 5000)], { note: '适用于自身及其他我方单位；同一来源不因团队人数重复计入自身。' }),
  ]),
];
