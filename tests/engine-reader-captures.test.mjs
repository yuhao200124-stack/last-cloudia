// Every battle the damage reader captured for us (tests/fixtures/captures/*.json, made by scripts/reader-capture-fixture.mjs)
// against the calculator: with the switches that battle was in, each settlement sample the game dealt must lie inside the
// calculator's range for a hit with the same attack and defense (samples taken in another state — before a debuff landed,
// before a buff fired, while 惡夢三重奏-like stacks were still building — match no hit or are below the settled ratio and are
// skipped). The report itself must also pass the calculator's own check (报告核对). Added 2026-10-01 after several fixes in
// a row were each found only by the user (“为什么这个会出现这么多问题…避免之后出现相同情况”).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import { runScenario, addAttacker, addTarget } from '../dist/engine/scenario.mjs';
import { attackerFromReport, targetFromReport, reportDressId } from '../dist/engine/report-adapter.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const dir = new URL('./fixtures/captures/', import.meta.url);
const captures = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));

for (const cap of captures) test(`capture ${cap.name}: every settled game hit is inside the calculator range`, async () => {
  const d0 = await loadEngineData({ unitDressIds: [], read });
  const dress = reportDressId(cap.report.units[0], d0.master);
  const { master, scripts } = await loadEngineData({ unitDressIds: [dress], read });
  const spec = attackerFromReport(cap.report, master);
  await loadPassives(master, spec.passives.map(p => p.id), read);
  const hits = [];
  for (const s of spec.skills.filter(s => [1, 5, 9].includes(s.type))) {
    const battle = new Battle(master, scripts);
    const out = runScenario({ battle, attacker: addAttacker(battle, spec), target: addTarget(battle, targetFromReport(cap.report)), skill: { id: s.id }, state: cap.state, assume: { probability: 'skip' }, randoms: [0.9, 1] });
    assert.ok(!out.assumptions.some(a => a.startsWith('报告核对不一致')), `${cap.name}: ${out.assumptions.join(' ')}`);
    for (const h of out.hits.filter(h => h.normal)) hits.push({ skill: s.name, ...h });
  }
  const match = s => hits.filter(h => h.attack === s.attack && h.defense === s.defense);
  const candidates = cap.samples.filter(s => s.baseDamage > 0 && match(s).length);
  const top = new Map();
  for (const s of candidates) { const k = `${s.attack}:${s.critical}`; top.set(k, Math.max(top.get(k) || 0, s.value / s.baseDamage)); }
  const settled = candidates.filter(s => s.value / s.baseDamage >= 0.98 * top.get(`${s.attack}:${s.critical}`));
  assert.ok(settled.length >= 20, `${cap.name}: only ${settled.length} comparable samples`);
  const outside = settled.filter(s => !match(s).some(h => { const r = s.critical ? h.critical : h.normal; return r && s.value >= r.min && s.value <= r.max; }));
  assert.deepEqual(outside.map(s => `${s.critical ? '暴击' : '普通'} 攻${s.attack} 防${s.defense} ${s.value}`), []);
});
