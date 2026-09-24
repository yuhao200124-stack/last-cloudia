import {upgradeStatRule, STAT_MECHANICS_REVISION} from './stat-mechanics.mjs?v=20260924-unified';
/* Declarative effect conditions. This module does not compute final damage. */
const options = (entries) => entries.map(([value, label]) => ({ value, label }));
const yesNo = options([[null, '待确认'], [true, '是'], [false, '否']]);
export const ATTACKS = [
  { id: 'normal', label: '普通攻击' }, { id: 's1', label: '特技1' },
  { id: 's2', label: '特技2' }, { id: 's3', label: '特技3' },
  { id: 'magic', label: '魔法' }, { id: 'ultimate', label: '超必杀' },
];
export const DEFAULT_CONTEXT = {
  attack: 'magic', damageType: 'magical', element: 'ice', weaponCount: null,
  staff: false, robe: false, iceStaff: false, magicFamily: 'normal', boss: true,
  fullHp: false, critical: false, weakness: false, resonance: false, chainStacks: 0,
  alive: true, killerBuff: true, bossWaveBuff: true, penetration: null,
  lowHp: null, firstLowHp: null, mpEnough: null, killer: false, killerOverride:null, break:false, equipmentIds: [],
  sword: false, axe: false, spear: false, hammer: false, bow: false, machine: false, claw: false,
  clothes: false, armor: false, incomingElement: null, incomingAttackKind: null,
};
export const CONDITION_FIELDS = {
  attack: { label: '攻击方式', options: ATTACKS.map(({ id, label }) => ({ value: id, label })) },
  attackKind: { label: '攻击类别', options: options([['normal', '普通攻击'], ['skill', '特技'], ['magic', '魔法'], ['ultimate', '超必杀']]) },
  damageType: { label: '伤害类型', options: options([[null, '待确认'], ['physical', '物理'], ['magical', '魔法'], ['mixed', '混合']]) },
  element: { label: '攻击属性', options: options([[null, '待确认'], ['none', '无'], ['fire', '火'], ['ice', '冰'], ['earth', '树'], ['thunder', '雷'], ['light', '光'], ['dark', '暗']]) },
  weaponCount: { label: '武器数量', options: options([[null, '待确认'], [0, '未装备武器'], [1, '一件武器'], [2, '两件武器']]) },
  staff: { label: '装备法杖', options: yesNo }, robe: { label: '装备长袍', options: yesNo },
  iceStaff: { label: '装备冰属性法杖', options: yesNo },
  sword: { label: '装备剑', options: yesNo }, axe: { label: '装备斧', options: yesNo },
  spear: { label: '装备枪', options: yesNo }, bow: { label: '装备弓', options: yesNo },
  hammer: { label: '装备槌', options: yesNo },
  machine: { label: '装备机械', options: yesNo }, claw: { label: '装备爪', options: yesNo },
  clothes: { label: '装备衣服', options: yesNo }, armor: { label: '装备铠甲', options: yesNo },
  incomingElement: { label: '受到攻击的属性', options: options([[null, '待选择'], ['none', '无'], ['fire', '火'], ['ice', '冰'], ['earth', '树'], ['thunder', '雷'], ['light', '光'], ['dark', '暗']]) },
  incomingAttackKind: { label: '受到攻击的类别', options: options([[null, '待选择'], ['physical', '物理'], ['magic', '魔法'], ['ultimate', '超必杀']]) },
  magicFamily: { label: '魔法类型', options: options([[null, '待确认'], ['normal', '普通魔法'], ['science', '科学'], ['sword', '圣剑'], ['other', '其他特殊魔法']]) },
  boss: { label: '目标是 Boss', options: options([[true, '是（当前固定）']]) },
  fullHp: { label: '自身满生命', options: yesNo }, critical: { label: '本次暴击', options: yesNo },
  weakness: { label: '命中弱点属性', options: yesNo }, resonance: { label: '我方正在发动不可叠加魔法', options: yesNo },
  chainStacks: { label: '法术联结状态', options: options([[0, '不叠加 +0%'], [1, '第1次 +4%'], [2, '第2次 +8%'], [3, '第3次 +12%'], [4, '第4次 +16%'], [5, '第5次及以后 +20%']]) },
  alive: { label: '自身存活', options: yesNo }, killerBuff: { label: '指导者特攻上限增益存在', options: yesNo },
  break: { label: 'Boss 正在 Break', options: yesNo },
  bossWaveBuff: { label: '指导者 Boss Wave 增益存在', options: yesNo },
  penetration: { label: '贯导本次触发', options: yesNo }, killer: { label: '本次触发特攻', options: yesNo },
  lowHp: { label: '自身濒死', options: yesNo }, firstLowHp: { label: '首次进入濒死', options: yesNo },
  mpEnough: { label: '至少持有30魔力值', options: yesNo },
};

export function normalizeContext(input = {}) {
  const ctx = { ...DEFAULT_CONTEXT, ...input };
  // HTML/imported settings may retain numeric selectors as strings.
  if (typeof ctx.weaponCount === 'string' && /^[012]$/.test(ctx.weaponCount)) ctx.weaponCount = Number(ctx.weaponCount);
  ctx.equipmentIds = Array.isArray(input.equipmentIds) ? [...new Set(input.equipmentIds)] : [];
  ctx.attack = ATTACKS.some((item) => item.id === ctx.attack) ? ctx.attack : null;
  ctx.attackKind = ctx.attack === 's1' || ctx.attack === 's2' || ctx.attack === 's3' ? 'skill' : ctx.attack;
  // A stat reference change never changes an attack's damage type.
  if (ctx.attack !== 'magic' && !Object.hasOwn(input, 'damageType')) ctx.damageType = null;
  for (const key of ['damageType', 'element', 'weaponCount', 'magicFamily']) {
    if (!CONDITION_FIELDS[key].options.some((o) => o.value === ctx[key])) ctx[key] = null;
  }
  for (const key of ['staff', 'robe', 'iceStaff', 'fullHp', 'critical', 'weakness', 'resonance', 'alive', 'killerBuff', 'bossWaveBuff', 'penetration', 'killer', 'lowHp', 'firstLowHp', 'mpEnough', 'break']) {
    if (ctx[key] !== true && ctx[key] !== false) ctx[key] = null;
  }
  if(ctx.fullHp===true&&ctx.lowHp===true){ctx.fullHp=null;ctx.lowHp=null;}
  else if(ctx.fullHp===true)ctx.lowHp=false;
  else if(ctx.lowHp===true)ctx.fullHp=false;
  if (ctx.iceStaff === true) ctx.staff = true;
  if (ctx.weaponCount === 0) { ctx.staff = false; ctx.iceStaff = false; }
  for (const key of ['sword', 'axe', 'spear', 'hammer', 'bow', 'machine', 'claw']) {
    ctx[key] = ctx.weaponCount === 0 ? false : ctx[key] === true;
  }
  for (const key of ['clothes', 'armor']) ctx[key] = ctx.weaponCount === 2 ? false : ctx[key] === true;
  for (const key of ['incomingElement', 'incomingAttackKind']) {
    if (!CONDITION_FIELDS[key].options.some(o => o.value === ctx[key])) ctx[key] = null;
  }
  if (ctx.weaponCount === 2) ctx.robe = false;
  ctx.chainStacks = Number.isFinite(ctx.chainStacks) ? Math.max(0, Math.min(5, Math.floor(ctx.chainStacks))) : null;
  ctx.boss = true;
  return ctx;
}

function valueLabel(field, value) {
  return CONDITION_FIELDS[field]?.options.find((o) => o.value === value)?.label ?? String(value);
}
export function describeCondition(condition) {
  if (!condition || typeof condition !== 'object') return '条件格式待确认';
  const label = CONDITION_FIELDS[condition.field]?.label ?? condition.field ?? '未知条件';
  const values = Array.isArray(condition.value) ? condition.value : [condition.value];
  const rendered = values.map((v) => valueLabel(condition.field, v)).join('／');
  return `${label}${({ eq: '：', in: '：', notIn: '排除：', gte: '至少：' })[condition.op] ?? '（待确认）：'}${rendered}`;
}
function conditionMatch(condition, ctx) {
  if (!condition || !CONDITION_FIELDS[condition.field]) return null;
  const actual = ctx[condition.field];
  if (actual === null || actual === undefined) return null;
  // A mixed attack can contain physical and magical portions. Until those
  // portions are described separately, neither scope can safely be rejected
  // or applied to the complete attack. An explicitly mixed scope is known.
  if (condition.field === 'damageType' && actual === 'mixed') {
    const values = Array.isArray(condition.value) ? condition.value : [condition.value];
    if (!values.includes('mixed') && values.some((value) => value === 'physical' || value === 'magical')) return null;
  }
  // An unrecognized value in a learned rule is an unresolved interpretation,
  // not evidence that its condition does not apply.
  if (['eq', 'in', 'notIn'].includes(condition.op)) {
    const values = condition.op === 'eq' ? [condition.value] : condition.value;
    if (!Array.isArray(values) || !values.length || values.some((value) => value === null || !CONDITION_FIELDS[condition.field].options.some((option) => option.value === value))) return null;
  }
  if (condition.op === 'eq') return actual === condition.value;
  if (condition.op === 'in' && Array.isArray(condition.value)) return condition.value.includes(actual);
  if (condition.op === 'notIn' && Array.isArray(condition.value)) return !condition.value.includes(actual);
  if (condition.op === 'gte' && typeof actual === 'number' && Number.isFinite(condition.value)) return actual >= condition.value;
  return null;
}

function makeRow(source, original, ctx, overrides) {
  let rule = { ...original, ...(overrides[original.id] ?? {}) };
  // Migrate previously cached Roxy scopes only where the old condition is known.
  // Native physical skill classification excludes the ultimate, regardless of stat reference.
  const magicScope=['staff-ultimate-boost','robe-ultimate-boost','giant-purge-v','giant-purge-iii','short-incantation'];
  if(magicScope.includes(source.id))rule={...rule,conditions:rule.conditions?.map(c=>c.field==='damageType'&&c.op==='eq'&&c.value==='magical'?{field:'attackKind',op:'eq',value:'magic'}:c)};
  if(source.id==='staff-ultimate-boost'&&rule.id==='staff-physical')rule={...rule,conditions:rule.conditions?.map(c=>c.field==='damageType'&&c.op==='eq'&&c.value==='physical'?{field:'attackKind',op:'in',value:['normal','skill']}:c)};
  if(source.id==='roxy-robe'&&rule.id==='roxy-robe-team-cap')rule={...rule,conditions:rule.conditions?.map(c=>c.field==='damageType'&&c.op==='in'&&JSON.stringify(c.value)==='["physical","magical"]'?{field:'attackKind',op:'in',value:['normal','skill','magic']}:c)};
  if(source.id==='special-boost'&&source.name==='特攻增幅'&&rule.effects?.some(e=>e.type==='damage'&&e.target==='特攻伤害')){
    const exact=source.text==='触发特攻时伤害+50%'&&rule.effects.length===1&&rule.effects[0].value===50&&rule.effects[0].unit==='%'&&JSON.stringify(rule.conditions)==='[{"field":"killer","op":"eq","value":true}]';
    rule=exact?{...rule,effects:[{...rule.effects[0],type:'killerPower',target:'特攻威力修正'}]}:{...rule,review:'pending',note:'特攻增幅的自定义拆分需要核对原生特攻威力作用，暂不作为普通增伤。'};
  }
  const row = { sourceId: source.id, sourceName: source.name, group: source.group, sourceText: source.text, rule, status: 'active', reasons: [] };
  if (overrides[`source:${source.id}`]?.disabled || rule.disabled) {
    row.status = 'disabled'; row.reasons.push('已手动停用'); return row;
  }
  if (source.group === 'blessings' && ctx.accountBlessings === false) {
    row.status = 'inactive'; row.reasons.push('账户加护总开关未开启'); return row;
  }
  if (source.group === 'equipment' && !ctx.equipmentIds.includes(source.id)) {
    row.status = 'disabled'; row.reasons.push('未选择这件装备'); return row;
  }
  if (!Array.isArray(rule.conditions) || !Array.isArray(rule.effects) || rule.effects.length === 0) {
    row.status = 'pending'; row.reasons.push('效果或条件尚未完成拆分'); return row;
  }
  const conditions = rule.conditions.map((condition) => ({ condition, matched: conditionMatch(condition, ctx) }));
  if (conditions.some(({ matched }) => matched === false)) {
    row.status = 'inactive';
    row.reasons = conditions.filter(({ matched }) => matched === false).map(({ condition }) => `未满足：${describeCondition(condition)}`);
  } else if (rule.review !== 'ready' || conditions.some(({ matched }) => matched === null)) {
    row.status = 'pending';
    row.reasons = conditions.filter(({ matched }) => matched === null).map(({ condition }) => `尚未确定：${describeCondition(condition)}`);
    if (rule.review !== 'ready') row.reasons.push(rule.note || '这条效果需要人工确认，暂不计入');
  } else {
    row.reasons = conditions.map(({ condition }) => `满足：${describeCondition(condition)}`);
    if (!row.reasons.length) row.reasons.push('常驻效果');
    if (rule.verification === 'untested') row.reasons.push('描述条件已匹配，实际伤害结算尚未经过测试');
  }
  return row;
}

export function evaluateCatalog(catalog, input = {}, overrides = {}) {
  const context = normalizeContext(input);
  const sources = Array.isArray(catalog) ? catalog.map(s=>({...s,rules:(s.rules||[]).map(rule=>upgradeStatRule(rule,s.text))})) : [];
  const initialRows = sources.flatMap((source) => (source.rules ?? []).map((rule) => makeRow(source, rule, context, overrides)));
  const killerRows = initialRows.filter((row) => row.rule.effects?.some((effect) => effect.type === 'killer'));
  const killer = context.killer === true || killerRows.some((row) => row.status === 'active') ? true
    : context.killer === null || killerRows.some((row) => row.status === 'pending') ? null : false;
  context.killer = typeof context.killerOverride==='boolean'?context.killerOverride:killer;
  const rows = sources.flatMap((source) => (source.rules ?? []).map((rule) => makeRow(source, rule, context, overrides)));
  const warnings = [];
  if (rows.some((row) => row.status === 'active' && row.rule.verification === 'untested')) warnings.push('当前招式含尚未完成实测的特殊结算；本页只核对效果，不能保证最终伤害准确。');
  if (rows.some((row) => row.status === 'pending')) warnings.push('存在待确认效果或条件；待确认项目暂不计入。');
  return { mechanicsRevision:STAT_MECHANICS_REVISION, context, rows, killer:context.killer, warnings };
}

export function formatEffect(effect) {
  if (!effect || typeof effect !== 'object') return '待拆分效果';
  const { type, target = '', value, unit = '', secondary } = effect;
  if (type === 'hit') return `${target}命中数×${value}；每段伤害×${secondary ?? '待确认'}（整组生效）`;
  if (type === 'statReference') return `伤害参照：自身${target}／敌方${value}（不改变伤害类型）`;
  if (type === 'defenseReference') return `${target}按${value}${unit}计算（仅本次结算）`;
  if (type === 'killer') return `对${target || 'Boss'}触发特攻（只判定一次）`;
  if (type === 'critPermission') return `${target}可触发暴击`;
  const number = typeof value === 'number' ? `${value >= 0 ? '+' : ''}${value.toLocaleString('en-US')}${unit}` : `${value ?? '待确认'}${unit}`;
  return `${target}${number}${effect.detail ? `（${effect.detail}）` : ''}`;
}
