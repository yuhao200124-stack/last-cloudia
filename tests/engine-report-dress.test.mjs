// 2026-10-01 (user: 魔神梅莉“和计算器算出来的不一样”): a battle report's unitId is the character's UNIT_ID (梅莉 100640);
// the outfit (魔神 100642) is the dress of that unit whose skills the report lists — before, the page ignored the report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadEngineData } from '../dist/engine/engine-data.mjs';
import { reportDressId } from '../dist/engine/report-adapter.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };

test('the report unit resolves to the outfit whose skills it lists', async () => {
  const { master } = await loadEngineData({ read });
  const unit = id => ({ unitId: 100640, skills: [id, id + 1, id + 2, id + 3].map(skillId => ({ skillId })) });
  assert.equal(reportDressId(unit(1006423), master), 100642);   // 剪刀尾巴… → 魔神
  assert.equal(reportDressId(unit(1006403), master), 100640);   // 剪刀魅影… → 神徒
  assert.equal(reportDressId({ unitId: 101270, skills: [] }, master), 101270);
  const panel = fs.readFileSync(new URL('../dist/engine-panel.mjs', import.meta.url), 'utf8');
  assert(!panel.includes('report.units?.[0]?.unitId === dress'));
});
