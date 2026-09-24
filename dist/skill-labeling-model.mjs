// Review metadata only. These labels never inject numeric calculator effects.
// Each pass covers explicit fragments of the same stable skill record. Merely
// mentioning a condition in an attack explanation does not tag that condition.
export function resolveSkillLabels(registry) {
  const skills = new Map(registry.entries.map(entry => [entry.id, entry]));
  if (skills.size !== registry.entries.length) throw Error('Duplicate skill identity.');
  const coverage = new Map();
  const passTags = new Set();
  for (const pass of registry.tagPasses) {
    if (!pass.tag || passTags.has(pass.tag)) throw Error('Duplicate or empty tag pass.');
    passTags.add(pass.tag);
    const assignedSkills = new Set();
    for (const assignment of pass.assignments) {
      const skill = skills.get(assignment.skillId);
      if (!skill || assignedSkills.has(skill.id)) throw Error('Unknown or duplicate tag assignment.');
      assignedSkills.add(skill.id);
      const knownParts = new Set(skill.parts.map(part => part.id));
      if (!assignment.partIds.length || assignment.partIds.some(id => !knownParts.has(id))) throw Error('Tag refers to an unknown fragment.');
      const covered = coverage.get(skill.id) || {tags: [], parts: new Set()};
      covered.tags.push(pass.tag);
      assignment.partIds.forEach(id => covered.parts.add(id));
      coverage.set(skill.id, covered);
    }
  }
  return registry.entries.map(entry => {
    const partIds = new Set(entry.parts.map(part => part.id));
    if (!entry.parts.length || partIds.size !== entry.parts.length || entry.parts.some(part => !['effect', 'condition'].includes(part.kind) || !part.text)) throw Error('Invalid skill fragments.');
    const covered = coverage.get(entry.id) || {tags: [], parts: new Set()};
    const pending = entry.parts.filter(part => !covered.parts.has(part.id));
    return {...entry,
      assignedTags: covered.tags,
      judgment: !covered.parts.size ? 'unknown' : pending.length ? 'partial' : 'ready',
      remainingEffects: pending.filter(part => part.kind === 'effect').map(part => part.text),
      remainingConditions: pending.filter(part => part.kind === 'condition').map(part => part.text),
    };
  });
}

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

export function labelingView(catalog, key) {
  const view = catalog.views[key];
  if (!view) throw Error('Unknown tag view.');
  return {...view, entries: key === 'all' ? catalog.entries : catalog.entries.filter(entry => entry.assignedTags.includes(view.label))};
}

export function skillLabelRows(data, catalog, edits = {}) {
  const all = canonicalSkillRows(data);
  const reviewed = new Map(catalog.entries.map(entry => [entry.url || entry.id, entry]));
  // Freeze the existing display positions. Later passes can change labels and
  // judgment without moving a skill the user is reviewing.
  const displayOrder = new Map(catalog.displayOrder.map((id, index) => [id, index]));
  return all.flatMap(row => {
    const entry = reviewed.get(row.url || row.id);
    const edit = edits[`skill:${row.id}`] || {};
    const effect = typeof edit.effect === 'string' ? edit.effect : row.effect;
    const changed = effect !== row.effect;
    // Changed excluded skills must return for review as well: an old exclusion
    // cannot prove that a user's new description is unrelated to this tag.
    if (!entry && !changed) return [];
    const valid = entry && !changed && entry.text === row.effect && entry.notes === (row.notes || '');
    return [{
      id: row.id, url: row.url,
      name: typeof edit.name === 'string' ? edit.name : row.name,
      effect, notes: changed ? '' : row.notes || '',
      judgment: valid ? entry.judgment : 'unknown',
      assignedTags: valid ? entry.assignedTags : [],
      attackSummary: valid ? entry.attackSummary : '',
      tagSummaries: valid ? entry.assignedTags.map(tag => ({tag,
        summary: entry.tagDetails?.[tag]?.summary || (tag === '攻击力' ? entry.attackSummary : ''),
        calculationNote: entry.tagDetails?.[tag]?.calculationNote || '',
      })) : [],
      remainingEffects: valid ? entry.remainingEffects : [],
      remainingConditions: valid ? entry.remainingConditions : [],
      calculationNote: valid ? entry.calculationNote : '',
      needsReview: !valid,
    }];
  }).sort((left, right) => (displayOrder.get(left.id) ?? Infinity) - (displayOrder.get(right.id) ?? Infinity));
}

export const attackLabelRows = skillLabelRows;

export function filterLabelRows(rows, query) {
  const folded = query.trim().toLocaleLowerCase('zh-CN');
  return folded ? rows.filter(row => [row.name, row.effect, row.notes, row.attackSummary, ...(row.tagSummaries || []).map(item => item.summary), ...row.assignedTags, ...row.remainingEffects, ...row.remainingConditions].join(' ').toLocaleLowerCase('zh-CN').includes(folded)) : rows;
}
