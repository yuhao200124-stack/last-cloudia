// Turns one battle captured by the damage reader (v0.42+) into a regression fixture for tests/engine-captures.test.mjs:
//   node scripts/reader-capture-fixture.mjs <name> <BattleCurrentReport.json> <DamageFormulaCapture.csv> <session> '<state json>'
// Writes tests/fixtures/captures/<name>.json: a slim report (what report-adapter.mjs reads), the settlement samples of that
// session (attack, defense, critical, final value, core damage) and the calculator state the battle was in (the switches:
// {"targetAilment":true,"hpPercent":100,"hpDip":25,"preCasts":[381160]} …). Every capture the user sends is kept this way,
// so a later change that moves any captured hit out of the calculator's range fails the tests (2026-10-01, user: “为什么这个会
// 出现这么多问题，找出原因并且避免之后出现相同情况”).
import fs from 'node:fs';
const [name, reportPath, csvPath, session, stateJson] = process.argv.slice(2);
if (!name || !reportPath || !csvPath || !session) { console.error('usage: <name> <report.json> <DamageFormulaCapture.csv> <session> [state json]'); process.exit(1); }
const r = JSON.parse(fs.readFileSync(reportPath, 'utf8').replace(/^﻿/, ''));
const slimBuff = b => ({ ...Object.fromEntries(['uid', 'affiliation', 'local_id', 'local_index', 'level', 'is_exactly_buff', 'removed'].filter(k => k in b).map(k => [k, b[k]])),
  operations: (b.operations || []).slice(0, 1).map(o => ({ ...Object.fromEntries(['values', 'values_read', 'origin_process_id'].filter(k => k in o).map(k => [k, o[k]])), ...(o.rule?.id ? { rule: { id: o.rule.id } } : {}) })),
  provenance: { direct: { carrier: { name: b.provenance?.direct?.carrier?.name || '' } } } });
const u = r.units[0], boss = r.bosses[0];
const pick = (o, keys) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));
const report = { kind: r.kind, readerVersion: r.readerVersion,
  units: [{ ...pick(u, ['unitId', 'name', 'stats', 'statsMeta', 'race', 'races', 'resistances']), skills: u.skills.map(s => pick(s, ['skillId', 'name', 'slot'])),
    panelSnapshots: (u.panelSnapshots || []).map(s => pick(s, ['id', 'elapsedMs', 'phase', 'stats'])), raw: { characterTypes: u.raw?.characterTypes, buffs: (u.raw?.buffs || []).map(slimBuff) } }],
  bosses: [{ ...pick(boss, ['unitId', 'name', 'stats', 'race', 'races', 'resistances', 'attackElements']), raw: { characterTypes: boss.raw?.characterTypes } }] };
// CSV: quoted fields
const lines = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
const parse = line => { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
const head = parse(lines[0]);
const rows = lines.slice(1).map(l => Object.fromEntries(parse(l).map((v, i) => [head[i], v]))).filter(x => x.session === session && x.event === 'CACHE' && x.state.startsWith('boss'));
const samples = rows.map(x => ({ attack: +x.settlement_atk, defense: +x.settlement_def, critical: (+x.log_flags & 256) !== 0, value: +x.game_value, baseDamage: +x.base_damage }));
const out = { name, source: `damage reader ${r.readerVersion ?? ''}, session ${session}`, state: stateJson ? JSON.parse(stateJson) : {}, report, samples };
fs.writeFileSync(new URL(`../tests/fixtures/captures/${name}.json`, import.meta.url), JSON.stringify(out));
console.log(`${name}: ${samples.length} samples`);
