import {ATTACK_TAG_CATALOG as catalog} from './attack-tag-catalog.mjs?v=20260924-attack-conditions';
import {attackLabelRows, filterLabelRows} from './skill-labeling-model.mjs?v=20260924-attack-conditions';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const statusLabels = {ready:'已完整判断', partial:'判断部分', unknown:'没办法判断'};
export function renderLabelTable(rows) {
  return `<div class="table-scroll"><table class="excel-table labeling-table" aria-label="攻击力标签列表"><colgroup><col class="name"><col class="judgment"><col class="effect"><col class="tags"></colgroup><thead><tr class="column-title"><th>技能名称</th><th>判断</th><th>技能效果／说明</th><th>标签／判断说明</th></tr></thead><tbody>${rows.map(row => `<tr data-skill-id="${escape(row.id)}">
    <td><a class="label-name" href="${escape(row.url)}" target="_blank" rel="noreferrer">${escape(row.name)}</a></td>
    <td class="judgment-cell"><span class="judgment-label judgment-${row.judgment}">${statusLabels[row.judgment]}</span></td>
    <td><div class="effect-text">${escape(row.effect)}</div>${row.notes ? `<div class="skill-effect-notes"><span>补充说明</span>${escape(row.notes)}</div>` : ''}</td>
    <td>${row.needsReview ? '<p class="skill-tag-note">描述已变化，需重新判断攻击力关联；原标签暂不沿用。</p>' : `${row.assignedTags.map(tag => `<span class="assigned-tag">${escape(tag)}</span>`).join('')}<p class="attack-summary">${escape(row.attackSummary)}</p>${row.remainingEffects.length ? `<div class="remaining-effects"><b>待判断效果</b><ul>${row.remainingEffects.map(text => `<li>${escape(text)}</li>`).join('')}</ul></div>` : ''}${row.remainingConditions.length ? `<div class="remaining-effects"><b>待判断条件／机制</b><ul>${row.remainingConditions.map(text => `<li>${escape(text)}</li>`).join('')}</ul></div>` : ''}${row.calculationNote ? `<small class="calculation-note">${escape(row.calculationNote)}</small>` : ''}`}</td>
  </tr>`).join('')}</tbody></table></div>`;
}

if (typeof document !== 'undefined') {
  const search = document.querySelector('#labelSearch'), clear = document.querySelector('#clearLabelSearch');
  let rows = [];
  const readRows = () => {
    let edits = {};
    try { edits = JSON.parse(localStorage.getItem('lc-sheet-table:cell-edits-v1') || '{}') || {}; } catch {}
    rows = attackLabelRows(window.SKILL_DATA, catalog, edits);
    const count = catalog.counts;
    document.querySelector('#labelCoverage').textContent = `已核对全库 ${count.reviewedUnique} 个技能（去重） · 攻击力相关 ${count.relatedUnique} 个 · 本轮未纳入 ${count.notRelatedUnique} 个`;
    const totals = rows.reduce((total, row) => { total[row.judgment]++; return total; }, {ready:0,partial:0,unknown:0});
    document.querySelector('#judgmentSummary').textContent = `已完整判断 ${totals.ready} 个 · 判断部分 ${totals.partial} 个 · 没办法判断 ${totals.unknown} 个`;
  };
  const render = () => {
    const filtered = filterLabelRows(rows, search.value);
    document.querySelector('#labelTable').innerHTML = filtered.length ? renderLabelTable(filtered) : '';
    document.querySelector('#labelResultCount').textContent = `显示 ${filtered.length} / ${rows.length} 个技能（去重）`;
    document.querySelector('#labelEmpty').hidden = filtered.length > 0;
    clear.hidden = !search.value;
  };
  search.addEventListener('input', render);
  clear.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  window.addEventListener('storage', event => { if (event.key === 'lc-sheet-table:cell-edits-v1' || event.key === null) { readRows(); render(); } });
  readRows(); render();
}
