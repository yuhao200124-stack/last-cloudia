import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CATALOG } from '../dist/roxy-rules.mjs';
import { evaluateCatalog, normalizeContext, formatEffect, describeCondition } from '../dist/effect-rule-engine.mjs';

const evaluate = (context = {}, overrides = {}) => evaluateCatalog(CATALOG, context, overrides);
const find = (result, id) => result.rows.find((row) => row.rule.id === id);
const status = (result, id) => find(result, id)?.status;

test('catalog preserves every included source and exact page descriptions', () => {
  assert.deepEqual(Object.fromEntries(['traits', 'exclusive', 'common', 'transcend', 'equipment'].map((group) => [group, CATALOG.filter((source) => source.group === group).length])),
    { traits: 2, exclusive: 18, common: 12, transcend: 7, equipment: 2 });
  const html = fs.readFileSync(new URL('../dist/character-260.html', import.meta.url), 'utf8');
  const section = (id) => html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
  const text = (value) => value.replace(/<[^>]+>/g, '').trim();
  const expected = [];
  for (const match of section('traits').matchAll(/<article class="trait"><h4>(.*?)<\/h4><p>(.*?)<\/p><\/article>/g)) expected.push({ name: text(match[1]), description: text(match[2]) });
  for (const id of ['exclusive-skills', 'common-skills']) {
    for (const match of section(id).matchAll(/<tr>(.*?)<\/tr>/g)) {
      const cells = [...match[1].matchAll(/<td[^>]*>(.*?)<\/td>/g)];
      if (cells.length) expected.push({ name: text(cells[0][1]), description: text(cells.at(-1)[1]) });
    }
  }
  for (const match of section('equipment').matchAll(/<article class="equipment-card"><h4>(.*?)<\/h4>(.*?)<\/article>/g)) {
    const attrs = [...match[2].matchAll(/<dd>(.*?)<\/dd>/g)].map((m) => text(m[1]));
    expected.push({ name: text(match[1]), description: `最高属性：${attrs[1]}；最高效果：${attrs[2]}` });
  }
  assert.equal(expected.length, CATALOG.length);
  for (const entry of expected) {
    const matches = CATALOG.filter((source) => source.name === entry.name);
    assert.equal(matches.length, 1, entry.name);
    assert.equal(matches[0].text, entry.description, entry.name);
  }
  const sourceIds = CATALOG.map((source) => source.id);
  const ruleIds = CATALOG.flatMap((source) => source.rules.map((rule) => rule.id));
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  assert.equal(new Set(ruleIds).size, ruleIds.length);
});

test('water king keeps four independent parts and ice magic inherits magic Boss killer', () => {
  const result = evaluate({ weaponCount: 1, attack: 'magic', damageType: 'magical', element: 'ice' });
  assert.deepEqual(result.rows.filter((row) => row.sourceId === 'water-king').map((row) => row.status), ['active', 'active', 'active', 'inactive']);
  assert.equal(result.killer, true);
  assert.equal(status(result, 'killer-cap-v-single'), 'active');
  assert.equal(status(result, 'killer-cap-v-base'), 'inactive');
  const hit = find(result, 'water-ice-hits').rule.effects[0];
  assert.equal(hit.type, 'hit'); assert.equal(hit.value, 2); assert.equal(hit.secondary, .6);
  assert.match(formatEffect(hit), /命中数×2.*每段伤害×0.6/);
});

test('science excludes split hits without excluding general magic Boss killer', () => {
  for (const magicFamily of ['science', 'sword', 'other']) {
    const result = evaluate({ weaponCount: 1, magicFamily });
    assert.equal(status(result, 'water-ice-hits'), 'inactive');
    assert.equal(status(result, 'water-magic-killer'), 'active');
    assert.equal(status(result, 'water-single'), 'active');
  }
});

test('two weapons remove single-weapon bonus without removing ice magic or Boss killer', () => {
  const result = evaluate({ weaponCount: 2 });
  assert.equal(status(result, 'water-single'), 'inactive');
  assert.equal(status(result, 'water-ice-hits'), 'active');
  assert.equal(status(result, 'water-magic-killer'), 'active');
  assert.equal(status(result, 'killer-cap-v-base'), 'active');
  assert.equal(normalizeContext({ weaponCount: 2, robe: true }).robe, false);
});

test('equipment is opt-in and independent from innate rules', () => {
  const off = evaluate({ weaponCount: 1 });
  assert.ok(off.rows.filter((row) => row.group === 'equipment').every((row) => row.status === 'disabled'));
  assert.equal(status(off, 'water-single'), 'active');
  const on = evaluate({ weaponCount: 1, staff: true, iceStaff: true, equipmentIds: ['roxy-staff'] });
  assert.equal(status(on, 'roxy-staff-stats'), 'active');
  assert.equal(status(on, 'roxy-staff-ice'), 'active');
  assert.equal(status(on, 'roxy-staff-killer'), 'active');
  assert.equal(status(on, 'roxy-robe-stats'), 'disabled');
});

test('skills and ultimate get stat reference without being reclassified as magic', () => {
  for (const attack of ['s1', 's2', 's3', 'ultimate']) {
    const result = evaluate({ attack, damageType: 'physical', weaponCount: 1, staff: true });
    assert.equal(status(result, 'water-skill-reference'), 'active');
    assert.equal(find(result, 'water-skill-reference').rule.verification, 'untested');
    assert.equal(result.context.damageType, 'physical');
    assert.equal(status(result, 'water-magic-killer'), 'inactive');
    assert.equal(status(result, 'water-ice-hits'), 'inactive');
    assert.equal(status(result, 'staff-physical'), 'active');
    assert.equal(status(result, 'staff-magical'), 'inactive');
    assert.ok(result.warnings.some((warning) => warning.includes('尚未完成实测')));
  }
  assert.equal(normalizeContext({ attack: 's1' }).damageType, null);
});

test('unarmed transcend cap is larger but other single-weapon clauses stay off', () => {
  const result = evaluate({ weaponCount: 0 });
  assert.equal(status(result, 'trans-killer-cap-single'), 'active');
  assert.equal(find(result, 'trans-killer-cap-single').rule.effects[0].value, 20000);
  assert.equal(status(result, 'trans-killer-cap-base'), 'inactive');
  assert.equal(status(result, 'killer-cap-v-single'), 'inactive');
  assert.equal(status(result, 'killer-cap-v-base'), 'active');
  assert.equal(status(result, 'water-single'), 'inactive');
});

test('unknown conditions remain pending and cannot accidentally satisfy negative conditions', () => {
  const result = evaluate({ weaponCount: null, magicFamily: 'unknown' });
  for (const id of ['water-single', 'water-ice-hits', 'killer-cap-v-single', 'killer-cap-v-base']) assert.equal(status(result, id), 'pending', id);
  assert.equal(status(result, 'water-magic-killer'), 'active');
  assert.equal(status(result, 'penetration-effect'), 'pending');
  const custom = [{ id: 'unseen', name: '未识别条件', group: 'common', text: '原文', rules: [{ id: 'unseen-rule', part: '条件', text: '原文', conditions: [{ field: 'invented', op: 'eq', value: true }], effects: [{ type: 'damage', target: '伤害', value: 20, unit: '%' }], review: 'ready', verification: 'description' }] }];
  assert.equal(evaluateCatalog(custom, { invented: true }).rows[0].status, 'pending');
});

test('manual confirmation replaces a pending rule and disabling source disables all its parts', () => {
  const overrides = { 'spell-link-later': { review: 'ready', manual: true, effects: [{type:'damage',target:'相同攻击魔法伤害',value:8,unit:'%'}] }, 'source:water-king': { disabled: true } };
  const result = evaluate({ equipmentIds: ['roxy-staff'], weaponCount: 1, chainStacks: 2 }, overrides);
  assert.equal(status(result, 'spell-link-later'), 'active');
  assert.equal(find(result, 'spell-link-later').rule.manual, true);
  assert.ok(result.rows.filter((row) => row.sourceId === 'water-king').every((row) => row.status === 'disabled'));
  assert.equal(result.killer, false);
  assert.equal(status(result, 'killer-cap-v-single'), 'inactive');
  assert.equal(CATALOG.find((source) => source.id === 'spell-link').rules.find((rule) => rule.id === 'spell-link-later').review, 'pending');
});

test('multiple killer sources remain one trigger and unrelated stats remain listed', () => {
  const extra = structuredClone(CATALOG.find((source) => source.id === 'water-king'));
  extra.id = 'other-killer'; extra.rules = [structuredClone(extra.rules[1])]; extra.rules[0].id = 'second-killer';
  const result = evaluateCatalog([...CATALOG, extra], { weaponCount: 1, killer: true });
  assert.equal(result.killer, true);
  assert.equal(result.rows.filter((row) => row.rule.id === 'killer-cap-v-single' && row.status === 'active').length, 1);
  assert.equal(status(result, 'magic-guide-max-effect'), 'active');
  assert.equal(status(result, 'trans-life-magic-effect'), 'active');
  assert.ok(find(result, 'trans-life-magic-effect').rule.effects.some((effect) => effect.target === 'HP'));
});

test('general engine has no Roxy equipment assumptions and conditions are readable', () => {
  const result = normalizeContext({ equipmentIds: ['roxy-staff'], boss: false });
  assert.equal(result.staff, false);
  assert.equal(result.boss, true);
  assert.match(describeCondition({ field: 'attackKind', op: 'in', value: ['skill', 'ultimate'] }), /特技.*超必杀/);
});

test('mixed damage leaves physical and magical scopes pending until portions are known', () => {
  const result = evaluate({ attack: 's1', damageType: 'mixed', staff: true, robe: true, weaponCount: 1, equipmentIds: ['roxy-robe'] });
  for (const id of ['staff-physical', 'staff-magical', 'robe-magic-damage', 'roxy-robe-team-cap']) assert.equal(status(result, id), 'pending', id);
  assert.equal(status(result, 'water-skill-reference'), 'active');
  const fixture = (condition) => [{ id: 'mixed-fixture', name: '混合条件', group: 'common', text: '原文', rules: [{ id: 'mixed-rule', part: '条件', text: '原文', conditions: [condition], effects: [{ type: 'damage', target: '伤害', value: 20, unit: '%' }], review: 'ready', verification: 'description' }] }];
  const check = (condition) => evaluateCatalog(fixture(condition), { damageType: 'mixed' }).rows[0].status;
  assert.equal(check({ field: 'damageType', op: 'eq', value: 'mixed' }), 'active');
  assert.equal(check({ field: 'damageType', op: 'in', value: ['physical', 'mixed'] }), 'active');
  assert.equal(check({ field: 'damageType', op: 'notIn', value: ['physical', 'magical'] }), 'pending');
  assert.equal(check({ field: 'damageType', op: 'notIn', value: ['mixed'] }), 'inactive');
  assert.equal(check({ field: 'damageType', op: 'eq', value: 'unmapped-type' }), 'pending');
});

test('unrecognized expected values in learned conditions remain pending', () => {
  const overrides = { 'water-single': { conditions: [{ field: 'element', op: 'eq', value: 'unmapped-element' }] } };
  assert.equal(status(evaluate({ element: 'ice' }, overrides), 'water-single'), 'pending');
  assert.equal(status(evaluate({ element: 'unmapped-element' }), 'water-single'), 'pending');
});
