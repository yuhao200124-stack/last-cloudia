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

  const savedSheet = localStorage.getItem('lc-sheet-table:sheet');
  const hashSheet = decodeURIComponent(location.hash.slice(1));
  let activeSheet = data.sheetOrder.includes(hashSheet)
    ? hashSheet
    : data.sheetOrder.includes(savedSheet) ? savedSheet : data.sheetOrder[0];
  let query = '';

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const fold = (value = '') => String(value).toLocaleLowerCase('zh-CN').replace(/\s+/g, '');

  function rowText(row) {
    return fold([row.type, row.name, row.sc, row.effect, ...(row.sources || [])].join(' '));
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
    return `<ul class="source-list">${(row.sources || []).map(item => `<li>${highlight(item)}</li>`).join('')}</ul>`;
  }

  function cell(content, extraClass = '') {
    return `<div class="cell-content ${extraClass}">${content}</div>`;
  }

  function skillName(row) {
    const label = highlight(row.name);
    return row.url
      ? `<a href="${escapeHtml(row.url)}" target="_blank" rel="noreferrer">${label}</a>`
      : label;
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
      ? '<tr class="separator-row" aria-hidden="true"><td colspan="6"></td></tr>'
      : group.rows.map((row, index) => `
      <tr>
        ${index === 0 ? `<td class="type-cell" rowspan="${group.rows.length}">${highlight(group.type)}</td>` : ''}
        <td class="skill-name">${cell(skillName(row), 'cell-center')}</td>
        <td class="sc-cell">${cell(escapeHtml(row.sc), 'cell-center')}</td>
        <td>${cell(highlight(row.effect))}</td>
        <td>${cell(sourceList(row), 'cell-center')}</td>
        <td class="rating-cell">${cell(escapeHtml(row.mark), 'cell-center')}</td>
      </tr>`).join('')).join('');
    return `<div class="table-scroll"><table class="excel-table" aria-label="${escapeHtml(label)}">
      <colgroup><col class="type"><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"></colgroup>
      <thead>
        <tr class="book-title"><th colspan="6">一、被动技能</th></tr>
        <tr class="column-title"><th>技能类型</th><th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function allTable(rows) {
    const body = rows.map(row => `<tr>
      <td class="skill-name">${cell(skillName(row), 'cell-center')}</td>
      <td class="sc-cell">${cell(escapeHtml(row.sc), 'cell-center')}</td>
      <td>${cell(highlight(row.effect))}</td>
      <td>${cell(sourceList(row), 'cell-center')}</td>
      <td class="rating-cell">${cell(escapeHtml(row.mark), 'cell-center')}</td>
    </tr>`).join('');
    return `<div class="table-scroll"><table class="excel-table all-skills" aria-label="全部技能">
      <colgroup><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"></colgroup>
      <thead>
        <tr class="book-title"><th colspan="5">一、被动技能</th></tr>
        <tr class="column-title"><th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th></tr>
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
