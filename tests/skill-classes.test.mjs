// The skill classification draft (scripts/build-skill-classes.mjs): every skill on the table has a class, and the
// user's decisions (docs/skill-classes-user.json) win over the automatic ones.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

test('every table skill is classified, and the user\'s decisions are applied', () => {
  const draft = read('docs/skill-classes-draft.json'), user = read('docs/skill-classes-user.json');
  const ids = read('dist/game-data/engine/table-passives.json').ids;
  const byId = new Map(draft.skills.map(s => [s.id, s]));
  for (const id of ids) { const s = byId.get(id); assert(s && s.cats.length, `${id} has a class`); assert(['能算', '看条件', '不影响每段伤害', '待确认'].includes(s.calc), `${id} calc`); }
  for (const [id, u] of Object.entries(user.skills)) {
    const s = byId.get(Number(id));
    if (u.cats) assert.deepEqual(s.cats, u.cats, id);
    for (const c of u.addCats || []) assert(s.cats.includes(c), `${id} ${c}`);
    if (u.calc) assert.equal(s.calc, u.calc, id);
  }
  assert.deepEqual(byId.get(1100).cats, ['反击']); assert.deepEqual(byId.get(28302).cats, ['信仰']);
  // 爆裂者 / 驱动: “物理攻击・超必杀技” is not a stat list
  assert(!byId.get(26872).cats.includes('基础属性') && !byId.get(25710).cats.includes('基础属性'));
});
