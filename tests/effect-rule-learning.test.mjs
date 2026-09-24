import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, sourceKey, makeTemplate, validateTemplates, buildCatalog, LEARNING_STORAGE_KEY } from '../dist/effect-rule-learning.mjs';

const source = { id: 'roxy-trait-1', name: '水王级魔术师', group: '个性', text: '仅装备1件武器时，冰属性伤害+50%、伤害上限+60,000。' };
const rules = [{ id: `${source.id}-r1`, part: 1, text: source.text, conditions: [{ field: 'weaponCount', op: 'eq', value: 1 }, { field: 'element', op: 'eq', value: 'ice' }], effects: [{ type: 'damage', target: '冰属性伤害', value: 50, unit: '%' }, { type: 'cap', target: '冰属性伤害上限', value: 60000, unit: '' }], review: 'ready', verification: 'description' }];
const seed = { ...source, rules };
const payloadFor = template => ({ schemaVersion: 1, templates: { [sourceKey(template)]: template } });

test('normalization preserves punctuation and sentence boundaries', () => {
  assert.equal(normalizeText('  INT＋15％。\n MP+20%。  '), 'INT+15%。 MP+20%。');
  assert.notEqual(sourceKey({ text: '装备1件时。冰伤+50%。' }), sourceKey({ text: '装备1件时，冰伤+50%。' }));
  assert.notEqual(sourceKey({ text: '【超越】INT+15%' }), sourceKey({ text: 'INT+15%' }));
  assert.equal(LEARNING_STORAGE_KEY, 'lc-effect-rules:learned:v1');
});

test('a confirmed full description transfers to a differently named character/source', () => {
  const template = makeTemplate(source, rules);
  const other = { ...source, id: 'new-character-passive', name: '不同名称', group: '通用技能' };
  const [catalog] = buildCatalog([other], [], { [sourceKey(source)]: template });
  assert.equal(catalog.learned, true);
  assert.equal(catalog.id, other.id);
  assert.equal(catalog.name, other.name);
  assert.equal(catalog.rules[0].id, `${other.id}-r1`);
  assert.equal(catalog.rules[0].effects[0].value, 50);
  catalog.rules[0].effects[0].value = 99;
  assert.equal(template.rules[0].effects[0].value, 50, 'catalog edits never mutate a shared template');
});

test('same name with a changed description cannot inherit learned or seed rules', () => {
  const changed = { ...source, text: source.text.replace('+50%', '+55%') };
  const [catalog] = buildCatalog([changed], [seed], { [sourceKey(source)]: makeTemplate(source, rules) });
  assert.equal(catalog.unknown, true);
  assert.equal(catalog.rules[0].review, 'pending');
  assert.deepEqual(catalog.rules[0].effects, []);
});

test('a user template overrides an exact-text seed without claiming live verification', () => {
  const customRules = structuredClone(rules);
  customRules[0].verification = 'untested';
  customRules[0].note = '用户确认条件，尚待游戏对照';
  const [catalog] = buildCatalog([source], [seed], { [sourceKey(source)]: makeTemplate(source, customRules) });
  assert.equal(catalog.learned, true);
  assert.equal(catalog.seeded, false);
  assert.equal(catalog.rules[0].verification, 'untested');
});

test('complete simple stat descriptions parse, including shared values and transcendence', () => {
  const texts = ['INT、MP+15%', 'HP、INT+20%。', '【超越】法强＋15％', '攻击力+10%。'];
  const catalog = buildCatalog(texts.map((text, index) => ({ id: `s${index}`, text })));
  assert.deepEqual(catalog[0].rules[0].effects.map(e => e.target), ['法强', 'MP']);
  assert.deepEqual(catalog[1].rules[0].effects.map(e => e.target), ['HP', '法强']);
  assert.equal(catalog[2].rules[0].effects[0].value, 15);
  assert.equal(catalog[3].rules[0].effects[0].target, '攻击力');
  assert.ok(catalog.every(s => s.parsed && !s.unknown && s.rules[0].verification === 'description'));
});

test('conditional, partial, ambiguous and name-only descriptions remain pending in full', () => {
  const texts = ['装备法杖时，INT+15%。', '濒死时攻击力+30%，持续20秒。', 'INT+15%。仅装备1件武器时生效。', 'INT+15%、冰伤+20%。', 'INT+15%，但MP减半。', '攻击力提升。', 'INT、INT+15%', '战斗开始时INT+15%'];
  for (const text of texts) {
    const [catalog] = buildCatalog([{ id: 'x', name: '攻击提升极', text }]);
    assert.equal(catalog.rules[0].review, 'pending', text);
    assert.equal(catalog.rules[0].text, text);
    assert.deepEqual(catalog.rules[0].effects, []);
  }
});

test('template export/import round trip retains conditions and combined mechanisms', () => {
  const combined = structuredClone(rules);
  combined.push({ id: 'r2', part: '冰魔法多段', text: '冰魔法Hit数变为2倍，每段伤害60%。', conditions: [{ field: 'attack', op: 'eq', value: 'magic' }, { field: 'magicFamily', op: 'notIn', value: ['science', 'sword'] }], effects: [{ type: 'hit', target: '冰魔法', value: 2, secondary: 0.6, unit: '倍', detail: '每段伤害60%' }], review: 'ready', verification: 'untested' });
  const template = makeTemplate(source, combined);
  const result = validateTemplates(JSON.parse(JSON.stringify(payloadFor(template))));
  assert.deepEqual(result.errors, []);
  assert.equal(Object.getPrototypeOf(result.templates), null);
  assert.deepEqual(result.templates[sourceKey(source)], template);
});

test('invalid and unsupported imports are rejected atomically', () => {
  const mutations = [
    p => { p.schemaVersion = 2; },
    p => { p.extra = 'unsupported'; },
    p => { p.templates[sourceKey(source)].normalizedText = 'changed'; },
    p => { p.templates[sourceKey(source)].text += '实际还需要满血。'; },
    p => { p.templates[sourceKey(source)].rules[0].conditions[0].op = 'eval'; },
    p => { p.templates[sourceKey(source)].rules[0].conditions[0].field = 'notSupported'; },
    p => { p.templates[sourceKey(source)].rules[0].conditions[0].value = '1'; },
    p => { p.templates[sourceKey(source)].rules[0].conditions[0] = { field: 'element', op: 'eq', value: 'cold' }; },
    p => { p.templates[sourceKey(source)].rules[0].conditions[0] = { field: 'boss', op: 'gte', value: true }; },
    p => { p.templates[sourceKey(source)].rules[0].effects[0].value = Infinity; },
    p => { p.templates[sourceKey(source)].rules[0].effects[0].type = 'javascript'; },
    p => { p.templates[sourceKey(source)].rules[0].effects[0].execute = 'alert(1)'; },
    p => { p.templates[sourceKey(source)].rules[0].verification = 'tested'; },
    p => { p.templates[sourceKey(source)].rules[0].conditions = null; },
    p => { p.templates[sourceKey(source)].rules[0].effects[0].secondary = {}; },
    p => { p.templates[sourceKey(source)].rules.push(structuredClone(p.templates[sourceKey(source)].rules[0])); }
  ];
  for (const mutate of mutations) {
    const payload = payloadFor(makeTemplate(source, rules));
    mutate(payload);
    const result = validateTemplates(payload);
    assert.ok(result.errors.length > 0);
    assert.deepEqual(Object.keys(result.templates), []);
  }
});

test('prototype pollution keys and oversized payloads are not accepted', () => {
  const bad = JSON.parse('{"schemaVersion":1,"templates":{"__proto__":{"polluted":true}}}');
  assert.ok(validateTemplates(bad).errors.length);
  assert.equal({}.polluted, undefined);
  const large = payloadFor(makeTemplate(source, rules));
  large.templates[sourceKey(source)].text = 'x'.repeat(2_000_001);
  assert.ok(validateTemplates(large).errors.length);
});

test('invalid stored templates fall back safely and pending fragments can be saved', () => {
  const invalid = makeTemplate(source, rules);
  invalid.rules[0].verification = 'tested';
  const [catalog] = buildCatalog([source], [seed], { [sourceKey(source)]: invalid });
  assert.equal(catalog.seeded, true);
  const pending = buildCatalog([{ id: 'unknown', name: '待确认', text: '某个尚未理解的效果。' }])[0];
  assert.equal(makeTemplate(pending, pending.rules).rules[0].review, 'pending');
  assert.throws(() => makeTemplate(source, [{ ...rules[0], effects: [] }]), /明确效果/);
});
