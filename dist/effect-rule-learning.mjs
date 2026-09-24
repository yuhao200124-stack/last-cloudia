import {hpStatRule, upgradeStatRule} from './stat-mechanics.mjs?v=20260924-combat-modes';
/** Reusable, description-matched rule templates. No imported content is executable. */
import { CONDITION_FIELDS } from './effect-rule-engine.mjs';

export const LEARNING_STORAGE_KEY = 'lc-effect-rules:learned:v1';

const LIMITS = Object.freeze({ text: 8192, templates: 1000, rules: 100, conditions: 30, effects: 40, bytes: 2_000_000 });
const TYPES = new Set(['stat', 'statBuff', 'damage', 'cap', 'critRate', 'critPermission', 'hit', 'statReference', 'equipmentStat', 'defense', 'recovery', 'utility', 'castSpeed', 'defenseReference', 'killer', 'killerPower']);
const FIELDS = new Set(Object.keys(CONDITION_FIELDS));
const OPS = new Set(['eq', 'in', 'notIn', 'gte']);
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const finite = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e12;
const shortString = (value, max = 2000) => typeof value === 'string' && value.length <= max;
const scalar = value => finite(value) || typeof value === 'boolean' || shortString(value, 512);

/** Keep sentence boundaries, words and punctuation intact; normalize whitespace and ＋％ only. */
export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/＋/g, '+').replace(/％/g, '%').replace(/\s+/gu, ' ').trim();
}

/** Full text is the key: a changed description cannot silently inherit an older rule. */
export function sourceKey(source) {
  const normalized = normalizeText(typeof source === 'string' ? source : source?.text);
  if (!normalized || normalized.length > LIMITS.text) return '';
  return `text:v1:${normalized}`;
}

function unknownKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key) || !allowed.includes(key)) errors.push(`${path}：不支持字段 ${key}`);
  }
}

function validateRule(rule, path, errors, sourceText) {
  const start = errors.length;
  if (!record(rule)) { errors.push(`${path}：规则必须是对象`); return null; }
  unknownKeys(rule, ['id', 'part', 'text', 'conditions', 'effects', 'review', 'verification', 'note', 'mechanicsRevision'], path, errors);
  if (!shortString(rule.id, 256) || !rule.id) errors.push(`${path}：规则 ID 无效`);
  if (!(shortString(rule.part, 256) || (Number.isInteger(rule.part) && rule.part >= 0 && rule.part <= 1000))) errors.push(`${path}：分段编号无效`);
  if (!shortString(rule.text, LIMITS.text) || !rule.text.trim()) errors.push(`${path}：原文不能为空`);
  if (!['ready', 'pending'].includes(rule.review)) errors.push(`${path}：确认状态无效`);
  if (!['description', 'untested'].includes(rule.verification)) errors.push(`${path}：验证状态只能是描述依据或待测试`);
  if (hasOwn(rule, 'mechanicsRevision') && rule.mechanicsRevision !== 1) errors.push(`${path}：计算机制版本无效`);
  if (hasOwn(rule, 'note') && !shortString(rule.note)) errors.push(`${path}：备注过长或格式错误`);
  if (!Array.isArray(rule.conditions) || rule.conditions.length > LIMITS.conditions) {
    errors.push(`${path}：条件列表无效或过多`);
  } else {
    rule.conditions.forEach((condition, index) => {
      const p = `${path}.conditions[${index}]`;
      if (!record(condition)) { errors.push(`${p}：条件必须是对象`); return; }
      unknownKeys(condition, ['field', 'op', 'value'], p, errors);
      if (!FIELDS.has(condition.field)) errors.push(`${p}：未知条件字段`);
      if (!OPS.has(condition.op)) errors.push(`${p}：未知比较方式`);
      if (condition.op === 'in' || condition.op === 'notIn') {
        if (!Array.isArray(condition.value) || condition.value.length < 1 || condition.value.length > 30 || !condition.value.every(scalar)) errors.push(`${p}：集合值无效`);
      } else if (condition.op === 'gte') {
        if (!finite(condition.value)) errors.push(`${p}：阈值必须是有限数值`);
      } else if (!scalar(condition.value)) errors.push(`${p}：条件值无效`);
      const permitted = CONDITION_FIELDS[condition.field]?.options?.map(option => option.value).filter(value => value !== null);
      const values = Array.isArray(condition.value) ? condition.value : [condition.value];
      if (permitted && values.some(value => !permitted.includes(value))) errors.push(`${p}：条件值不在当前支持范围内`);
      if (condition.op === 'gte' && !['weaponCount', 'chainStacks'].includes(condition.field)) errors.push(`${p}：只有数值条件支持阈值比较`);
    });
  }
  if (!Array.isArray(rule.effects) || rule.effects.length > LIMITS.effects) {
    errors.push(`${path}：效果列表无效或过多`);
  } else {
    rule.effects.forEach((effect, index) => {
      const p = `${path}.effects[${index}]`;
      if (!record(effect)) { errors.push(`${p}：效果必须是对象`); return; }
      unknownKeys(effect, ['type', 'target', 'value', 'unit', 'detail', 'secondary'], p, errors);
      if (!TYPES.has(effect.type)) errors.push(`${p}：未知效果类型`);
      if (!shortString(effect.target, 256) || !effect.target) errors.push(`${p}：效果目标无效`);
      if (!scalar(effect.value)) errors.push(`${p}：效果值无效`);
      if (!shortString(effect.unit, 64)) errors.push(`${p}：单位无效`);
      if (hasOwn(effect, 'detail') && !shortString(effect.detail)) errors.push(`${p}：效果说明无效`);
      if (hasOwn(effect, 'secondary') && !scalar(effect.secondary)) errors.push(`${p}：附属数值无效`);
    });
  }
  if (rule.review === 'ready' && Array.isArray(rule.effects) && rule.effects.length === 0) errors.push(`${path}：已确认规则必须有明确效果`);
  return errors.length === start ? upgradeStatRule(JSON.parse(JSON.stringify(rule)),sourceText) : null;
}

function validateTemplate(template, key, path, errors) {
  const start = errors.length;
  if (!record(template)) { errors.push(`${path}：模板必须是对象`); return null; }
  unknownKeys(template, ['schemaVersion', 'text', 'normalizedText', 'name', 'rules', 'confirmedAt'], path, errors);
  if (template.schemaVersion !== 1) errors.push(`${path}：不支持该模板版本`);
  if (!shortString(template.text, LIMITS.text) || !template.text.trim()) errors.push(`${path}：完整原文无效`);
  if (template.normalizedText !== normalizeText(template.text) || !template.normalizedText) errors.push(`${path}：标准化原文不一致`);
  if (sourceKey(template) !== key) errors.push(`${path}：模板键与完整原文不一致`);
  if (!shortString(template.name, 256)) errors.push(`${path}：技能名称无效`);
  if (!shortString(template.confirmedAt, 40) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(template.confirmedAt) || !Number.isFinite(Date.parse(template.confirmedAt))) errors.push(`${path}：确认时间无效`);
  const rules = [];
  if (!Array.isArray(template.rules) || template.rules.length < 1 || template.rules.length > LIMITS.rules) {
    errors.push(`${path}：规则列表为空或过多`);
  } else {
    const ids = new Set();
    template.rules.forEach((rule, index) => {
      const validated = validateRule(rule, `${path}.rules[${index}]`, errors, template.text);
      if (validated) {
        if (ids.has(validated.id)) errors.push(`${path}：规则 ID 重复`);
        ids.add(validated.id);
        rules.push(validated);
      }
    });
  }
  return errors.length === start ? { schemaVersion: 1, text: template.text, normalizedText: template.normalizedText, name: template.name, rules, confirmedAt: template.confirmedAt } : null;
}

/** Validate an entire import atomically: on any error, no templates are accepted. */
export function validateTemplates(payload) {
  const templates = Object.create(null);
  const errors = [];
  if (!record(payload)) return { templates, errors: ['导入内容必须是规则库对象'] };
  try {
    if (JSON.stringify(payload).length > LIMITS.bytes) return { templates, errors: ['规则文件过大，请拆分后导入'] };
  } catch { return { templates, errors: ['规则文件含循环引用或不支持的数据'] }; }
  unknownKeys(payload, ['schemaVersion', 'templates'], '规则库', errors);
  if (payload.schemaVersion !== 1) errors.push('规则库：不支持该文件版本');
  if (!record(payload.templates)) errors.push('规则库：templates 必须是对象');
  else {
    const entries = Object.entries(payload.templates);
    if (entries.length > LIMITS.templates) errors.push('规则库：模板数量过多');
    else entries.forEach(([key, template], index) => {
      if (DANGEROUS_KEYS.has(key)) { errors.push(`模板 ${index + 1}：不允许的模板键`); return; }
      const validated = validateTemplate(template, key, `模板 ${index + 1}`, errors);
      if (validated) templates[key] = validated;
    });
  }
  return { templates: errors.length ? Object.create(null) : templates, errors };
}

/** User confirmation records a description rule; it never asserts live-game verification. */
export function makeTemplate(source, rules) {
  const template = {
    schemaVersion: 1,
    text: source?.text,
    normalizedText: normalizeText(source?.text),
    name: source?.name ?? '',
    rules,
    confirmedAt: new Date().toISOString()
  };
  const errors = [];
  const validated = validateTemplate(template, sourceKey(source), '模板', errors);
  if (!validated) throw new TypeError(errors.join('；'));
  return validated;
}

const STAT_NAMES = new Map([
  ['STR', '攻击力'], ['ATK', '攻击力'], ['攻击力', '攻击力'], ['攻擊力', '攻击力'], ['攻击', '攻击力'], ['攻擊', '攻击力'],
  ['INT', '法强'], ['魔力', '法强'], ['法强', '法强'], ['法強', '法强'],
  ['DEF', '防御力'], ['防御力', '防御力'], ['防禦力', '防御力'], ['防御', '防御力'], ['防禦', '防御力'],
  ['MND', '魔抗'], ['魔抗', '魔抗'],
  ['HP', 'HP'], ['生命', 'HP'], ['生命值', 'HP'], ['体力', 'HP'], ['體力', 'HP'], ['MP', 'MP']
]);

function simpleStatRule(source) {
  // Anchored over the complete description: no discarded trailing conditions or sentences.
  const text = normalizeText(source.text).replace(/^【超越】\s*/u, '');
  const match = text.match(/^([^+。.!！?？;；:：]+?)\s*\+\s*(\d+(?:\.\d+)?)\s*%[。.]?$/u);
  if (!match) return null;
  const names = match[1].split(/[、,，/／・]/u).map(name => name.trim());
  const targets = names.map(name => STAT_NAMES.get(name.toUpperCase()));
  if (!names.length || targets.some(target => !target) || new Set(targets).size !== targets.length) return null;
  const value = Number(match[2]);
  if (!finite(value) || value < 0 || value > 10000) return null;
  return {
    id: `${source.id}-r1`, part: 1, text: source.text, conditions: [],
    effects: targets.map(target => ({ type: 'stat', target, value, unit: '%' })),
    review: 'ready', verification: 'description', note: '仅根据完整原文识别直接基础属性加成；未标记为实测验证。'
  };
}

function rebaseRules(rules, source) {
  return JSON.parse(JSON.stringify(rules)).map((rule, index) => ({ ...rule, id: `${source.id}-r${index + 1}` }));
}

/** Match saved templates, then exact-text seeds, then a deliberately narrow parser. */
export function buildCatalog(sources, seedCatalog = [], learnedTemplates = {}) {
  if (!Array.isArray(sources)) throw new TypeError('sources 必须是数组');
  const seedSources = Array.isArray(seedCatalog) ? seedCatalog : (seedCatalog?.sources ?? []);
  const seedIndex = new Map();
  for (const seed of seedSources) {
    const key = sourceKey(seed);
    if (key && Array.isArray(seed.rules) && seed.rules.length && !seedIndex.has(key)) seedIndex.set(key, seed);
  }
  return sources.map(source => {
    const key = sourceKey(source);
    const template = key && record(learnedTemplates) && hasOwn(learnedTemplates, key) ? learnedTemplates[key] : null;
    if (template) {
      const errors = [];
      const validated = validateTemplate(template, key, '已保存模板', errors);
      if (validated) return { ...source, rules: rebaseRules(validated.rules, source), learned: true, seeded: false, unknown: false };
    }
    const seed = seedIndex.get(key);
    if (seed) return { ...source, rules: rebaseRules(seed.rules, source), learned: false, seeded: true, unknown: false };
    const parsed = hpStatRule(source) || simpleStatRule(source);
    if (parsed) return { ...source, rules: [parsed], learned: false, seeded: false, unknown: false, parsed: true };
    return {
      ...source, learned: false, seeded: false, unknown: true,
      rules: [{ id: `${source.id}-r1`, part: 1, text: source.text, conditions: [], effects: [], review: 'pending', verification: 'description', note: '尚无完整原文匹配的已确认规则，请人工拆分并确认；当前不计入。' }]
    };
  });
}
