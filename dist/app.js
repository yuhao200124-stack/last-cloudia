(() => {
  const data = window.SKILL_DATA;
  if (!data?.sheetOrder?.length) return;

  const tabs = document.querySelector('#sheetTabs');
  const title = document.querySelector('#sheetTitle');
  const tableArea = document.querySelector('#tableArea');
  const emptyState = document.querySelector('#emptyState');
  const searchInput = document.querySelector('#searchInput');
  const clearSearch = document.querySelector('#clearSearch');
  const resultSummary = document.querySelector('#resultSummary');
  const backTop = document.querySelector('#backTop');
  const calculator = document.querySelector('#scCalculator');
  const calculatorLauncher = document.querySelector('#calculatorLauncher');
  const calculatorClose = document.querySelector('#calculatorClose');
  const calculatorSort = document.querySelector('#calculatorSort');
  const calculatorSortIcon = document.querySelector('#calculatorSortIcon');
  const calculatorBadge = document.querySelector('#calculatorBadge');
  const calculatorSkills = document.querySelector('#calculatorSkills');
  const calculatorTotal = document.querySelector('#calculatorTotal');

  const savedSheet = localStorage.getItem('lc-sheet-table:sheet');
  const editStorageKey = 'lc-sheet-table:cell-edits-v1';
  let edits = {};
  try {
    edits = JSON.parse(localStorage.getItem(editStorageKey) || '{}');
  } catch { edits = {}; }
  const calculatorStorageKey = 'lc-sheet-table:sc-calculator-v1';
  let calculatorState = { skillIds: [], activeBreaks: [7, 12, 20], sortDirection: 'desc' };
  try {
    const savedCalculator = JSON.parse(localStorage.getItem(calculatorStorageKey) || '{}');
    const savedBreaks = Array.isArray(savedCalculator.activeBreaks)
      ? savedCalculator.activeBreaks.map(Number).filter(value => [7, 12, 20].includes(value))
      : [7, 12, 20];
    calculatorState = {
      skillIds: Array.isArray(savedCalculator.skillIds) ? [...new Set(savedCalculator.skillIds.map(String))] : [],
      activeBreaks: [...new Set(savedBreaks)],
      sortDirection: savedCalculator.sortDirection === 'asc' ? 'asc' : 'desc',
    };
  } catch { calculatorState = { skillIds: [], activeBreaks: [7, 12, 20], sortDirection: 'desc' }; }
  const hashSheet = decodeURIComponent(location.hash.slice(1));
  let activeSheet = data.sheetOrder.includes(hashSheet)
    ? hashSheet
    : data.sheetOrder.includes(savedSheet) ? savedSheet : data.sheetOrder[0];
  let query = '';

  const skillIndex = new Map();
  for (const sheetName of data.sheetOrder) {
    const sheet = data.sheets[sheetName];
    const rows = sheet.kind === 'all' ? sheet.rows : sheet.lanes.flatMap(lane => lane.rows);
    for (const row of rows) {
      if (!row.separator && !skillIndex.has(String(row.id))) skillIndex.set(String(row.id), row);
    }
  }
  calculatorState.skillIds = calculatorState.skillIds.filter(id => skillIndex.has(id));

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const fold = (value = '') => String(value).toLocaleLowerCase('zh-CN').replace(/\s+/g, '');

  function readEdit(key, field, fallback = '') {
    const record = edits[key];
    return record && Object.prototype.hasOwnProperty.call(record, field) ? record[field] : fallback;
  }

  function rowKey(row) {
    return `skill:${row.id}`;
  }

  function rowValue(row, field) {
    const fallback = field === 'sources' ? (row.sources || []).join('\n') : row[field] ?? '';
    return String(readEdit(rowKey(row), field, fallback));
  }

  function editedSources(row) {
    return rowValue(row, 'sources').split('\n').map(item => item.trim()).filter(Boolean);
  }

  function parseSc(value) {
    const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    const parsed = match ? Number(match[0]) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function formatSc(value) {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }

  function rowText(row) {
    return fold([row.type, rowValue(row, 'name'), rowValue(row, 'sc'), rowValue(row, 'effect'), ...editedSources(row)].join(' '));
  }

  function matches(row) {
    if (row.separator) return !query;
    return !query || rowText(row).includes(fold(query));
  }

  function highlight(value) {
    const raw = String(value || '');
    const needle = query.trim();
    if (!needle) return escapeHtml(raw);
    const index = raw.toLocaleLowerCase('zh-CN').indexOf(needle.toLocaleLowerCase('zh-CN'));
    if (index < 0) return escapeHtml(raw);
    return `${escapeHtml(raw.slice(0, index))}<mark>${escapeHtml(raw.slice(index, index + needle.length))}</mark>${escapeHtml(raw.slice(index + needle.length))}`;
  }

  function sourceList(row) {
    return `<ul class="source-list">${editedSources(row).map(item => `<li>${highlight(item)}</li>`).join('')}</ul>`;
  }

  function cell(content, extraClass = '') {
    return `<div class="cell-content ${extraClass}">${content}</div>`;
  }

  function editableTd(key, field, value, content, className = '') {
    return `<td class="editable-cell ${className}" data-edit-key="${escapeHtml(key)}" data-edit-field="${escapeHtml(field)}" data-edit-value="${escapeHtml(value)}" title="双击编辑">${content}</td>`;
  }

  function skillName(row) {
    const label = highlight(rowValue(row, 'name'));
    return row.url
      ? `<a href="${escapeHtml(row.url)}" target="_blank" rel="noreferrer">${label}</a>`
      : label;
  }

  function addButton(row) {
    const added = calculatorState.skillIds.includes(String(row.id));
    return `<button class="add-skill-button${added ? ' is-added' : ''}" type="button" data-add-skill="${escapeHtml(row.id)}" aria-label="${added ? '从SC计算器取消' : '添加到SC计算器'}" title="${added ? '再次点击取消' : '添加到SC计算器'}"><span aria-hidden="true">${added ? '✓' : '+'}</span></button>`;
  }

  function saveCalculatorState() {
    localStorage.setItem(calculatorStorageKey, JSON.stringify(calculatorState));
  }

  function calculateSc() {
    const items = calculatorState.skillIds
      .map(id => skillIndex.get(id))
      .filter(Boolean)
      .map(row => ({ id: String(row.id), row, sc: parseSc(rowValue(row, 'sc')), freeBy: 0 }));
    const used = new Set();
    for (const threshold of [7, 12, 20]) {
      if (!calculatorState.activeBreaks.includes(threshold)) continue;
      const eligible = items.filter(item => !used.has(item.id) && item.sc > 0 && item.sc <= threshold);
      if (!eligible.length) continue;
      const bestSc = Math.max(...eligible.map(item => item.sc));
      const chosen = eligible.find(item => item.sc === bestSc);
      chosen.freeBy = threshold;
      used.add(chosen.id);
    }
    return {
      items,
      total: items.reduce((sum, item) => sum + (item.freeBy ? 0 : item.sc), 0),
    };
  }

  function renderCalculator() {
    const result = calculateSc();
    document.querySelectorAll('[data-break-level]').forEach(button => {
      const level = Number(button.dataset.breakLevel);
      const active = calculatorState.activeBreaks.includes(level);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const descending = calculatorState.sortDirection === 'desc';
    calculatorSortIcon.textContent = descending ? '▽' : '△';
    calculatorSort.setAttribute('aria-label', descending ? '当前SC从大到小，点击改为从小到大' : '当前SC从小到大，点击改为从大到小');
    calculatorSort.title = descending ? 'SC从大到小' : 'SC从小到大';
    const displayItems = [...result.items].sort((a, b) => descending ? b.sc - a.sc : a.sc - b.sc);
    calculatorSkills.innerHTML = displayItems.length
      ? displayItems.map(item => `<div class="calculator-skill${item.freeBy ? ' is-free' : ''}">
          <div class="calculator-skill-name">${escapeHtml(rowValue(item.row, 'name'))}</div>
          <div class="calculator-skill-sc">${item.freeBy ? `<strong>0 SC</strong><del>原 ${formatSc(item.sc)} SC</del>` : `<strong>${formatSc(item.sc)} SC</strong>`}</div>
          <button type="button" data-remove-skill="${escapeHtml(item.id)}" aria-label="移除${escapeHtml(rowValue(item.row, 'name'))}" title="从计算器移除">×</button>
        </div>`).join('')
      : '<div class="calculator-empty">点击技能右侧的“＋”添加技能</div>';
    calculatorTotal.textContent = `${formatSc(result.total)} SC`;
    calculatorBadge.textContent = `${formatSc(result.total)} SC`;
  }

  function setCalculatorOpen(open) {
    calculator.hidden = !open;
    calculatorLauncher.setAttribute('aria-expanded', String(open));
  }

  function groupRows(rows) {
    const groups = [];
    for (const row of rows) {
      const last = groups.at(-1);
      if (row.separator) groups.push({ separator: true });
      else if (last && !last.separator && last.type === row.type) last.rows.push(row);
      else groups.push({ type: row.type || '未分类', rows: [row] });
    }
    return groups;
  }

  function splitTable(rows, label) {
    const groups = groupRows(rows);
    const body = groups.map(group => group.separator
      ? '<tr class="separator-row" aria-hidden="true"><td colspan="7"></td></tr>'
      : group.rows.map((row, index) => {
        const key = rowKey(row);
        const typeKey = `type:${activeSheet}:${label}:${group.type}`;
        const typeValue = String(readEdit(typeKey, 'type', group.type));
        const name = rowValue(row, 'name');
        const sc = rowValue(row, 'sc');
        const effect = rowValue(row, 'effect');
        const sources = rowValue(row, 'sources');
        const markValue = rowValue(row, 'mark');
        return `<tr>
          ${index === 0 ? `<td class="type-cell editable-cell" rowspan="${group.rows.length}" data-edit-key="${escapeHtml(typeKey)}" data-edit-field="type" data-edit-value="${escapeHtml(typeValue)}" title="双击编辑">${cell(highlight(typeValue), 'cell-center')}</td>` : ''}
          ${editableTd(key, 'name', name, cell(skillName(row), 'cell-center'), 'skill-name')}
          ${editableTd(key, 'sc', sc, cell(escapeHtml(sc), 'cell-center'), 'sc-cell')}
          ${editableTd(key, 'effect', effect, cell(highlight(effect)), '')}
          ${editableTd(key, 'sources', sources, cell(sourceList(row), 'cell-center'), '')}
          ${editableTd(key, 'mark', markValue, cell(escapeHtml(markValue), 'cell-center'), 'rating-cell')}
          <td class="action-cell">${addButton(row)}</td>
        </tr>`;
      }).join('')).join('');
    return `<div class="table-scroll"><table class="excel-table" aria-label="${escapeHtml(label)}">
      <colgroup><col class="type"><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"><col class="action"></colgroup>
      <thead>
        <tr class="book-title"><th colspan="7">一、被动技能</th></tr>
        <tr class="column-title"><th>技能类型</th><th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th><th>添加</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function allTable(rows) {
    const body = rows.map(row => {
      const key = rowKey(row);
      const name = rowValue(row, 'name');
      const sc = rowValue(row, 'sc');
      const effect = rowValue(row, 'effect');
      const sources = rowValue(row, 'sources');
      const markValue = rowValue(row, 'mark');
      return `<tr>
        ${editableTd(key, 'name', name, cell(skillName(row), 'cell-center'), 'skill-name')}
        ${editableTd(key, 'sc', sc, cell(escapeHtml(sc), 'cell-center'), 'sc-cell')}
        ${editableTd(key, 'effect', effect, cell(highlight(effect)), '')}
        ${editableTd(key, 'sources', sources, cell(sourceList(row), 'cell-center'), '')}
        ${editableTd(key, 'mark', markValue, cell(escapeHtml(markValue), 'cell-center'), 'rating-cell')}
        <td class="action-cell">${addButton(row)}</td>
      </tr>`;
    }).join('');
    return `<div class="table-scroll"><table class="excel-table all-skills" aria-label="全部技能">
      <colgroup><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"><col class="action"></colgroup>
      <thead>
        <tr class="book-title"><th colspan="6">一、被动技能</th></tr>
        <tr class="column-title"><th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th><th>添加</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function sheetCount(name) {
    const sheet = data.sheets[name];
    return sheet.kind === 'all'
      ? sheet.rows.length
      : sheet.lanes.reduce((sum, lane) => sum + lane.rows.filter(row => !row.separator).length, 0);
  }

  function renderTabs() {
    tabs.innerHTML = data.sheetOrder.map(name => `<button class="sheet-tab" type="button" data-sheet="${escapeHtml(name)}" role="tab" aria-selected="${name === activeSheet}">${escapeHtml(name)}</button>`).join('');
  }

  function render() {
    title.textContent = activeSheet;
    const sheet = data.sheets[activeSheet];
    let visible = 0;
    if (sheet.kind === 'all') {
      const rows = sheet.rows.filter(matches);
      visible = rows.length;
      tableArea.innerHTML = rows.length ? allTable(rows) : '';
    } else {
      const lanes = sheet.lanes.map(lane => ({ ...lane, rows: lane.rows.filter(matches) }));
      visible = lanes.reduce((sum, lane) => sum + lane.rows.filter(row => !row.separator).length, 0);
      tableArea.innerHTML = visible
        ? `<div class="split-grid">${lanes.filter(lane => lane.rows.length).map((lane, index) => splitTable(lane.rows, `${activeSheet} 第${index + 1}栏`)).join('')}</div>`
        : '';
    }
    emptyState.hidden = visible !== 0;
    resultSummary.textContent = query
      ? `找到 ${visible} 条（本页共 ${sheetCount(activeSheet)} 条）`
      : `共 ${visible} 条`;
    clearSearch.hidden = !query;
    renderTabs();
    renderCalculator();
  }

  function selectSheet(name) {
    if (!data.sheetOrder.includes(name)) return;
    activeSheet = name;
    localStorage.setItem('lc-sheet-table:sheet', name);
    history.replaceState(null, '', `#${encodeURIComponent(name)}`);
    render();
    document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-sheet]');
    if (button) selectSheet(button.dataset.sheet);
  });

  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    render();
  });

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    query = '';
    searchInput.focus();
    render();
  });

  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  function saveCellEdit(key, field, value) {
    edits[key] = { ...(edits[key] || {}), [field]: value };
    localStorage.setItem(editStorageKey, JSON.stringify(edits));
  }

  function startCellEdit(target) {
    if (!target || target.querySelector('.cell-editor')) return;
    const { editKey: key, editField: field, editValue: value = '' } = target.dataset;
    if (!key || !field) return;
    const multiline = field === 'effect' || field === 'sources';
    const editor = document.createElement(multiline ? 'textarea' : 'input');
    editor.className = 'cell-editor';
    editor.value = value;
    if (!multiline) editor.type = 'text';
    target.classList.add('is-editing');
    target.replaceChildren(editor);
    editor.focus();
    editor.select();
    let finished = false;
    const finish = save => {
      if (finished) return;
      finished = true;
      if (save) saveCellEdit(key, field, editor.value.trim());
      render();
    };
    editor.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      } else if (event.key === 'Enter' && (!multiline || event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        finish(true);
      }
    });
    editor.addEventListener('blur', () => finish(true));
  }

  let pendingLink = 0;
  tableArea.addEventListener('click', event => {
    const add = event.target.closest('[data-add-skill]');
    if (add) {
      event.preventDefault();
      const id = String(add.dataset.addSkill);
      if (calculatorState.skillIds.includes(id)) {
        calculatorState.skillIds = calculatorState.skillIds.filter(skillId => skillId !== id);
        saveCalculatorState();
        render();
      } else if (skillIndex.has(id)) {
        calculatorState.skillIds.push(id);
        saveCalculatorState();
        render();
      }
      return;
    }
    const link = event.target.closest('.skill-name a');
    if (!link) return;
    event.preventDefault();
    window.clearTimeout(pendingLink);
    if (event.detail === 1) {
      pendingLink = window.setTimeout(() => window.open(link.href, '_blank', 'noopener,noreferrer'), 260);
    }
  });

  tableArea.addEventListener('dblclick', event => {
    const target = event.target.closest('.editable-cell');
    if (!target) return;
    event.preventDefault();
    window.clearTimeout(pendingLink);
    startCellEdit(target);
  });

  calculatorLauncher.addEventListener('click', event => {
    event.stopPropagation();
    setCalculatorOpen(calculator.hidden);
  });

  calculatorClose.addEventListener('click', () => setCalculatorOpen(false));

  calculatorSort.addEventListener('click', () => {
    calculatorState.sortDirection = calculatorState.sortDirection === 'desc' ? 'asc' : 'desc';
    saveCalculatorState();
    renderCalculator();
  });

  calculator.addEventListener('click', event => {
    const breakButton = event.target.closest('[data-break-level]');
    if (breakButton) {
      const level = Number(breakButton.dataset.breakLevel);
      calculatorState.activeBreaks = calculatorState.activeBreaks.includes(level)
        ? calculatorState.activeBreaks.filter(item => item !== level)
        : [...calculatorState.activeBreaks, level].sort((a, b) => a - b);
      saveCalculatorState();
      renderCalculator();
      return;
    }
    const removeButton = event.target.closest('[data-remove-skill]');
    if (removeButton) {
      calculatorState.skillIds = calculatorState.skillIds.filter(id => id !== String(removeButton.dataset.removeSkill));
      saveCalculatorState();
      render();
    }
  });

  document.addEventListener('pointerdown', event => {
    if (!calculator.hidden && !calculator.contains(event.target) && !calculatorLauncher.contains(event.target)) {
      setCalculatorOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setCalculatorOpen(false);
  });

  window.addEventListener('hashchange', () => {
    const name = decodeURIComponent(location.hash.slice(1));
    if (data.sheetOrder.includes(name) && name !== activeSheet) selectSheet(name);
  });

  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = tool => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
    register({
      name: 'search_skills',
      title: '搜索技能',
      description: '在当前工作表中按技能名称、效果或圣物搜索，并更新页面结果。',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input.query !== 'string') throw new Error('query 必须是字符串');
        searchInput.value = input.query.slice(0, 120);
        query = searchInput.value;
        render();
        return { sheet: activeSheet, query, matches: Number(resultSummary.textContent.match(/\d+/)?.[0] || 0) };
      },
    });
    register({
      name: 'open_skill_category',
      title: '打开技能分类',
      description: '切换到指定的 Excel 技能分类工作表。',
      inputSchema: { type: 'object', properties: { category: { type: 'string', enum: data.sheetOrder } }, required: ['category'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (!input || !data.sheetOrder.includes(input.category)) throw new Error('分类不存在');
        selectSheet(input.category);
        return { category: activeSheet, entries: sheetCount(activeSheet) };
      },
    });
  }

  render();
  registerWebMcp();
})();
