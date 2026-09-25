import {SKILL_LABELING_CATALOG as catalog} from './skill-labeling-catalog.mjs?v=20260925-races';
import {skillLabelRows, labelingView, filterLabelRows} from './skill-labeling-model.mjs?v=20260925-races';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const statusLabels = {ready:'已完整判断', partial:'判断部分', unknown:'没办法判断'};
const pendingList = (title, texts) => texts.length ? `<div class="remaining-effects"><b>${title}</b><ul>${texts.map(text => `<li>${escape(text)}</li>`).join('')}</ul></div>` : '';
const bindingsFor = (row, conditionTag) => row.conditionBindings?.[conditionTag] || (conditionTag === '战斗开始' ? row.openingBindings : []) || [];
export function renderLabelTable(rows, effectGroup, conditionTag = '战斗开始') {
  return `<div class="table-scroll"><table class="excel-table labeling-table" aria-label="技能标签列表"><colgroup><col class="name"><col class="judgment"><col class="effect"><col class="tags"></colgroup><thead><tr class="column-title"><th>技能名称</th><th>判断</th><th>技能效果／说明</th><th>标签／判断说明</th></tr></thead><tbody>${rows.map(row => `<tr data-skill-id="${escape(row.id)}">
    <td><a class="label-name" href="${escape(row.url)}" target="_blank" rel="noreferrer">${escape(row.name)}</a></td>
    <td class="judgment-cell"><span class="judgment-label judgment-${row.judgment}">${statusLabels[row.judgment]}</span></td>
    <td>${effectGroup ? bindingsFor(row, conditionTag).filter(binding => binding.group === effectGroup).map(binding => `<p class="opening-effect"><b>本组${escape(conditionTag === '战斗开始' ? '开场' : conditionTag)}效果：</b>${escape(binding.summary)}</p>`).join('') : ''}<div class="effect-text">${escape(row.effect)}</div>${row.notes ? `<div class="skill-effect-notes"><span>补充说明</span>${escape(row.notes)}</div>` : ''}</td>
    <td>${row.needsReview ? '<p class="skill-tag-note">描述已变化，需重新判断标签关联；原标签暂不沿用。</p>' : `${row.assignedTags.map(tag => `<span class="assigned-tag">${escape(tag)}</span>`).join(' ')}${(row.tagSummaries || []).map(item => `<p class="attack-summary"><b>${escape(item.tag)}：</b>${escape(item.summary)}</p>${item.calculationNote ? `<small class="calculation-note">${escape(item.calculationNote)}</small>` : ''}`).join('')}${pendingList('待判断效果', row.remainingEffects)}${pendingList('待判断条件／机制', row.remainingConditions)}`}</td>
  </tr>`).join('')}</tbody></table></div>`;
}

if (typeof document !== 'undefined') {
  const search = document.querySelector('#labelSearch'), clear = document.querySelector('#clearLabelSearch');
  const tabs = document.querySelector('#labelTabs'), subTabs = document.querySelector('#labelSubTabs');
  const keys = ['all', ...Object.keys(catalog.views).filter(key => key !== 'all' && !catalog.views[key].parent)];
  const requestedView = new URLSearchParams(window.location?.search || '').get('tag');
  let activeView = Object.hasOwn(catalog.views, requestedView) ? requestedView : catalog.activeView;
  let rows = [];
  const readRows = () => {
    let edits = {};
    try { edits = JSON.parse(localStorage.getItem('lc-sheet-table:cell-edits-v1') || '{}') || {}; } catch {}
    const view = labelingView(catalog, activeView), count = view.counts;
    const parent = view.parent || activeView;
    tabs.innerHTML = keys.map(key => `<button class="sheet-tab" type="button" id="label-tab-${escape(key)}" data-tag="${escape(key)}" role="tab" aria-controls="labelPanel" aria-selected="${key === parent}" tabindex="${key === parent ? 0 : -1}">${escape(catalog.views[key].label)}（${catalog.views[key].counts.relatedUnique}）</button>`).join('');
    const group = catalog.views[parent];
    const childKeys = group.childKeys || group.tagKeys;
    subTabs.hidden = !childKeys;
    subTabs.setAttribute('aria-label', `${group.label}子分类`);
    subTabs.innerHTML = childKeys ? [parent, ...childKeys].map(key => `<button class="sheet-tab" type="button" id="label-subtab-${escape(key)}" data-tag="${escape(key)}" role="tab" aria-controls="labelPanel" aria-selected="${key === activeView}" tabindex="${key === activeView ? 0 : -1}">${escape(key === parent ? group.overviewLabel || `全部${group.label}` : catalog.views[key].label)}（${catalog.views[key].counts.relatedUnique}）</button>`).join('') : '';
    document.querySelector('#labelPanel').setAttribute('aria-labelledby', `label-${childKeys ? 'subtab' : 'tab'}-${activeView}`);
    rows = skillLabelRows(window.SKILL_DATA, view, edits);
    document.querySelector('#activeTagTitle').textContent = view.effectGroup ? `${group.label} · ${view.label}` : view.label;
    document.querySelector('#conditionScope').textContent = group.scopeDescription || '所有效果和条件都贴完标签，才算已完整判断。同一技能可出现在多个分类，总数按技能去重；未处理的效果和条件继续待判断。每组按已完整判断、判断部分、没办法判断排序。';
    search.setAttribute('aria-label', `搜索${view.label}技能`);
    document.querySelector('#labelCoverage').textContent = `已核对全库 ${count.reviewedUnique} 个技能（去重） · ${view.label} ${count.relatedUnique} 个 · 此列表未纳入 ${count.notRelatedUnique} 个`;
    document.querySelector('#cumulativeCoverage').textContent = `累计已贴标签 ${catalog.views.all.counts.relatedUnique} 个技能（去重）；同一技能的标签和判断在各列表同步。`;
    const totals = rows.reduce((total, row) => { total[row.judgment]++; return total; }, {ready:0,partial:0,unknown:0});
    document.querySelector('#judgmentSummary').textContent = `已完整判断 ${totals.ready} 个 · 判断部分 ${totals.partial} 个 · 没办法判断 ${totals.unknown} 个`;
  };
  const render = () => {
    const filtered = filterLabelRows(rows, search.value);
    const view = catalog.views[activeView];
    if (view.separateSections) {
      const sections = view.childKeys.map(key => {
        const child = catalog.views[key];
        const members = filtered.filter(row => bindingsFor(row, view.label).some(binding => binding.group === child.effectGroup));
        return members.length ? `<section class="opening-section" aria-labelledby="section-${escape(key)}"><h3 id="section-${escape(key)}">${escape(view.label)} · ${escape(child.label)}（${members.length}）</h3>${renderLabelTable(members, child.effectGroup, view.label)}</section>` : '';
      });
      const changed = filtered.filter(row => row.needsReview);
      if (changed.length) sections.push(`<section class="opening-section"><h3>描述已修改，待重新判断（${changed.length}）</h3>${renderLabelTable(changed)}</section>`);
      document.querySelector('#labelTable').innerHTML = sections.join('');
    } else {
      document.querySelector('#labelTable').innerHTML = filtered.length ? renderLabelTable(filtered, view.effectGroup, view.conditionTag) : '';
    }
    document.querySelector('#labelResultCount').textContent = `显示 ${filtered.length} / ${rows.length} 个技能（去重）`;
    document.querySelector('#labelEmpty').hidden = filtered.length > 0;
    clear.hidden = !search.value;
  };
  const chooseView = (key, prefix) => {
    if (!Object.hasOwn(catalog.views, key)) return;
    activeView = key;
    readRows(); render();
    document.querySelector(`#${prefix}-${key}`).focus();
  };
  const bindTabs = (element, prefix, getKeys) => {
    element.addEventListener('click', event => {
      const tab = event.target.closest('[data-tag]');
      if (tab) chooseView(tab.dataset.tag, prefix);
    });
    element.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-tag]');
      if (!tab) return;
      const available = getKeys(), index = available.indexOf(tab.dataset.tag);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowRight') next = available[(index + 1) % available.length];
      else if (event.key === 'ArrowLeft') next = available[(index - 1 + available.length) % available.length];
      else if (event.key === 'Home') next = available[0];
      else if (event.key === 'End') next = available.at(-1);
      else return;
      event.preventDefault();
      chooseView(next, prefix);
    });
  };
  bindTabs(tabs, 'label-tab', () => keys);
  bindTabs(subTabs, 'label-subtab', () => {
    const parent = catalog.views[activeView].parent || activeView;
    return [parent, ...(catalog.views[parent].childKeys || catalog.views[parent].tagKeys || [])];
  });
  search.addEventListener('input', render);
  clear.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  window.addEventListener('storage', event => { if (event.key === 'lc-sheet-table:cell-edits-v1' || event.key === null) { readRows(); render(); } });
  readRows(); render();
}
