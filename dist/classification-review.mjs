import {labelingView} from './skill-labeling-model.mjs';

// Classification completeness is independent of unresolved numeric mechanics.
// Only individually reviewed detail fragments may be made non-blocking.
const reasons = new Set(['status-mechanics', 'scaling-details', 'formula-details',
  'chance-details', 'resource-details', 'reset-details', 'event-schedule',
  'implementation-details', 'magnitude-details']);
export const classificationSourceSignature = entry => JSON.stringify([
  entry.id, entry.url, entry.name, entry.text, entry.notes,
]);

const scopeReplacements = [
  ['所有效果和条件都完成才判完整', '效果与影响归属的条件完成分类即可'],
  ['所有效果和条件贴完标签才算完整', '效果与影响归属的条件完成分类即可'],
  ['所有效果和条件均完成才算已完整判断', '效果与影响归属的条件完成分类即可'],
  ['所有效果和条件完成后才算完整判断', '效果与影响归属的条件完成分类即可'],
  ['未完成的其他效果和条件继续待判断', '尚未归类的效果与关键条件继续待判断'],
  ['未完成的效果和机制继续待判断', '尚未归类的效果与关键条件继续待判断'],
  ['未知数值与独立条件继续待确认', '数值与机制细节不单独拆分'],
  ['未处理的其他条件及未知参数继续待判断', '尚未归类的效果与关键条件继续待判断'],
  ['次数限制与未完成效果继续待判断', '尚未归类的效果与关键条件继续待判断'],
];
const scopeFor = text => scopeReplacements.reduce((value, [before, after]) => value.replaceAll(before, after), text);

export function applyClassificationReviewPolicy(catalog, policy) {
  if (policy.schemaVersion !== 1 || policy.basis !== 'effects-and-classification-qualifiers'
      || policy.numericEffectInjection !== false || catalog.numericEffectInjection !== false
      || !Array.isArray(policy.entries)) throw Error('Invalid classification review policy.');
  const entriesById = new Map(catalog.entries.map(entry => [entry.id, entry]));
  const reviews = new Map();
  for (const review of policy.entries) {
    const entry = entriesById.get(review.skillId);
    if (!entry || reviews.has(entry.id) || classificationSourceSignature(entry) !== review.sourceSignature)
      throw Error('Stale or duplicate classification review.');
    if (!Array.isArray(review.fragments) || !review.fragments.length) throw Error('Missing reviewed fragments.');
    const seen = new Set();
    for (const condition of review.fragments) {
      const part = entry.parts.find(part => part.id === condition.partId);
      if (!part || part.kind !== condition.kind || part.text !== condition.text || seen.has(part.id)
          || !(part.kind === 'condition' ? entry.remainingConditions : entry.remainingEffects).includes(part.text))
        throw Error('Only exact pending detail fragments can be reviewed.');
      // Older MP reviews stored pure numeric questions as effect fragments.
      // Their actual resource effect must already be covered independently.
      if (part.kind === 'effect') {
        const numericParts = {'mp-restore-amount':'少量MP的具体回复值待确认',
          'mp-restore-base':'原文未说明百分比回复的参照基数，待确认',
          'mp-drain-rate':'MP持续消耗速率待确认'};
        if (numericParts[part.id] !== part.text || condition.disposition !== 'non-blocking'
            || !condition.supportingEffectPartIds?.length
            || condition.supportingEffectPartIds.some(id => !entry.tagDetails['MP']?.coverage.resourcePartIds.includes(id)
              || entry.remainingEffects.includes(entry.parts.find(part => part.id === id)?.text)))
          throw Error('Actual effects cannot be waived as numeric detail.');
      }
      seen.add(part.id);
      if (condition.disposition === 'non-blocking') {
        if (!reasons.has(condition.reason) || condition.remainingText !== undefined || part.text.includes('攻击类型待确认'))
          throw Error('Invalid non-blocking mechanism detail.');
      } else if (condition.disposition === 'classification-required') {
        if (condition.reason !== 'attack-type' || !condition.remainingText
            || !part.text.includes('攻击类型') || !condition.remainingText.includes('攻击类型'))
          throw Error('An unresolved attack type must remain visible.');
      } else throw Error('Unknown classification review disposition.');
    }
    reviews.set(entry.id, review);
  }
  const entries = catalog.entries.map(entry => {
    const review = reviews.get(entry.id);
    if (!review) return entry;
    const reviewed = new Map(review.fragments.map(condition => [condition.text, condition]));
    const retain = texts => texts.flatMap(text => {
      const condition = reviewed.get(text);
      if (!condition) return [text];
      return condition.disposition === 'non-blocking' ? [] : [condition.remainingText];
    });
    const remainingConditions = retain(entry.remainingConditions), remainingEffects = retain(entry.remainingEffects);
    return {...entry, remainingConditions, remainingEffects,
      judgment: entry.judgment === 'unknown' ? 'unknown'
        : remainingEffects.length || remainingConditions.length ? 'partial' : 'ready',
    };
  });
  const projected = {...catalog, entries};
  const views = Object.fromEntries(Object.entries(catalog.views).map(([key, view]) => {
    const rows = labelingView(projected, key).entries;
    const counts = {...view.counts,
      ready: rows.filter(entry => entry.judgment === 'ready').length,
      partial: rows.filter(entry => entry.judgment === 'partial').length,
      unknown: rows.filter(entry => entry.judgment === 'unknown').length,
    };
    return [key, {...view, ...(view.scopeDescription ? {scopeDescription: scopeFor(view.scopeDescription)} : {}), counts}];
  }));
  return {...projected, views, classificationReviewBasis: policy.basis};
}
