// 加护 (user 2026-09-30): always counted for every character, updated from a new battle report (更新加护).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { blessingsFromReport, currentBlessingSet, accountBlessings, statBlessingPercents, isBlessingId } from '../dist/account-blessing-store.mjs';

test('a battle report gives the account’s blessings (ids 60000000–60999999) with their loaded values and processes', () => {
  const report = JSON.parse(fs.readFileSync(new URL('./fixtures/roxy-battle-report.json', import.meta.url), 'utf8'));
  const set = blessingsFromReport(report);
  assert.ok(set && Object.keys(set.blessings).length > 30);
  assert.ok(Object.keys(set.blessings).every(id => isBlessingId(Number(id))));
  assert.ok(Object.values(set.blessings).every(segs => Object.values(segs).every(s => s.p > 0 && Array.isArray(s.v))));
  assert.equal(blessingsFromReport({ units: [{ raw: { buffs: [] } }] }), null);
});

test('without an update the site default is used: 48 blessings, the stronger replacements (DEF / MP +4%)', () => {
  const set = currentBlessingSet();
  assert.equal(set.source, 'site');
  assert.equal(Object.keys(set.blessings).length, 48);
  assert.ok(accountBlessings().has(60003000), '基爾巴特 DEF');
  assert.ok(!accountBlessings().has(60001110), '戈爾穆王子 DEF (replaced)');
  assert.deepEqual(statBlessingPercents(), { hp: 7, mp: 4, attack: 4, defense: 4, intelligence: 3, mind: 5 });
});
