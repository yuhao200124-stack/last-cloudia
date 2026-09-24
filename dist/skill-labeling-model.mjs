// Review metadata only. These labels never inject numeric calculator effects.
export function canonicalSkillRows(data) {
  const unique = new Map();
  const add = row => {
    if (!row || row.separator) return;
    const key = row.url || row.id;
    if (!unique.has(key)) unique.set(key, row);
  };
  (data.sheets['全部技能']?.rows || []).forEach(add);
  for (const sheet of Object.values(data.sheets)) {
    (sheet.rows || sheet.lanes.flatMap(lane => lane.rows)).forEach(add);
  }
  return [...unique.values()];
}

export function attackLabelRows(data, catalog, edits = {}) {
  const all = canonicalSkillRows(data);
  const reviewed = new Map(catalog.entries.map(entry => [entry.url || entry.id, entry]));
  const statusOrder = {ready: 0, partial: 1, unknown: 2};
  return all.flatMap(row => {
    const entry = reviewed.get(row.url || row.id);
    const edit = edits[`skill:${row.id}`] || {};
    const effect = typeof edit.effect === 'string' ? edit.effect : row.effect;
    const changed = effect !== row.effect;
    // Changed excluded skills must return for review as well: an old exclusion
    // cannot prove that a user's new description is unrelated to attack.
    if (!entry && !changed) return [];
    const valid = entry && !changed && entry.text === row.effect && entry.notes === (row.notes || '');
    return [{
      id: row.id, url: row.url,
      name: typeof edit.name === 'string' ? edit.name : row.name,
      effect, notes: changed ? '' : row.notes || '',
      judgment: valid ? entry.judgment : 'unknown',
      assignedTags: valid ? entry.assignedTags : [],
      attackSummary: valid ? entry.attackSummary : '',
      remainingEffects: valid ? entry.remainingEffects : [],
      calculationNote: valid ? entry.calculationNote : '',
      needsReview: !valid,
    }];
  }).sort((left, right) => statusOrder[left.judgment] - statusOrder[right.judgment]);
}

export function filterLabelRows(rows, query) {
  const folded = query.trim().toLocaleLowerCase('zh-CN');
  return folded ? rows.filter(row => [row.name, row.effect, row.notes, row.attackSummary, ...row.remainingEffects].join(' ').toLocaleLowerCase('zh-CN').includes(folded)) : rows;
}
