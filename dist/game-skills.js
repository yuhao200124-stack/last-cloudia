(() => {
  const data = window.GAME_SKILL_DATA;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  let active = data.sheetOrder.includes(store.get('lc-game-table:sheet')) ? store.get('lc-game-table:sheet') : data.sheetOrder[0];
  let script = store.get('lc-game-table:script', 't') === 's' ? 's' : 't';
  let query = '';
  const skill = ref => data.skills[ref];
  const txt = (s, f) => script === 's' ? s[f + 'S'] : s[f];
  const hay = s => [s.name, s.nameS, s.effect, s.effectS, ...s.sources, ...s.sourcesS].join('\n').toLocaleLowerCase('zh-CN');
  const matches = row => row.separator || !query || hay(skill(row.ref)).includes(query.toLocaleLowerCase('zh-CN'));
  function hl(value) {
    const raw = String(value ?? ''), q = query.trim();
    if (!q) return esc(raw);
    const i = raw.toLocaleLowerCase('zh-CN').indexOf(q.toLocaleLowerCase('zh-CN'));
    return i < 0 ? esc(raw) : `${esc(raw.slice(0, i))}<mark>${esc(raw.slice(i, i + q.length))}</mark>${esc(raw.slice(i + q.length))}`;
  }
  const cell = (c, cls = '') => `<div class="cell-content ${cls}">${c}</div>`;
  const nameCell = s => `<div class="name-stack">${hl(txt(s, 'name'))}</div>`;
  const scCell = s => hl(s.sc);
  function effectCell(s) {
    const lines = String(txt(s, 'effect')).split('\n').map(hl).join('<br>');
    const io = s.io ? `<span class="io-tag">${esc(s.io)}</span>` : '';
    const vals = s.values ? `<div class="skill-effect-notes"><span>游戏描述中“?”的实际参数</span>${esc(s.values)}</div>` : '';
    return lines + (io ? `<div class="io-line">${io}</div>` : '') + vals;
  }
  const sourcesCell = s => `<div class="source-list">${(script === 's' ? s.sourcesS : s.sources).map(x => `<div>${hl(x)}</div>`).join('')}</div>`;
  const tr = (s, typeTd = '') => `<tr data-game-id="${s.gameId}">${typeTd}<td class="skill-name">${cell(nameCell(s), 'cell-center')}</td><td class="sc-cell">${cell(scCell(s), 'cell-center')}</td><td>${cell(effectCell(s))}</td><td class="sources-cell">${cell(sourcesCell(s))}</td><td class="rating-cell">${cell(esc(s.mark), 'cell-center')}</td></tr>`;
  const head = (cols, withType) => `<thead><tr class="book-title"><th colspan="${cols}">一、被动技能（游戏数据）</th></tr><tr class="column-title">${withType ? '<th>技能类型</th>' : ''}<th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th></tr></thead>`;
  function allTable(rows, label) {
    return `<div class="table-scroll"><table class="excel-table skill-list-table all-skills game-table" aria-label="${esc(label)}"><colgroup><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"></colgroup>${head(5, false)}<tbody>${rows.map(r => tr(skill(r.ref))).join('')}</tbody></table></div>`;
  }
  function splitTable(rows, label) {
    const groups = [];
    for (const row of rows) {
      const last = groups.at(-1);
      if (row.separator) groups.push({ separator: true });
      else if (last && !last.separator && last.type === row.type) last.rows.push(row);
      else groups.push({ type: row.type || '未分类', rows: [row] });
    }
    const body = groups.map(g => g.separator ? '<tr class="separator-row" aria-hidden="true"><td colspan="6"></td></tr>'
      : g.rows.map((r, i) => tr(skill(r.ref), i === 0 ? `<td class="type-cell" rowspan="${g.rows.length}">${cell(hl(g.type), 'cell-center')}</td>` : '')).join('')).join('');
    return `<div class="table-scroll"><table class="excel-table skill-list-table game-table" aria-label="${esc(label)}"><colgroup><col class="type"><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"></colgroup>${head(6, true)}<tbody>${body}</tbody></table></div>`;
  }
  const uniq = rows => new Set(rows.filter(r => !r.separator).map(r => r.ref)).size;
  function render() {
    const sheet = data.sheets[active];
    $('sheetTitle').textContent = active;
    $('sheetHint').textContent = '名称、SC、效果、圣物取自游戏数据；分类、排序和评价按技能表排版';
    let visible = 0, html = '';
    if (sheet.kind === 'all') {
      const rows = sheet.rows.filter(matches); visible = uniq(rows);
      html = rows.length ? allTable(rows, active) : '';
    } else if (sheet.kind === 'lanes') {
      const lanes = sheet.lanes.map(l => ({ ...l, rows: l.rows.filter(matches) }));
      visible = uniq(lanes.flatMap(l => l.rows));
      html = lanes.filter(l => l.rows.length).map(l => `<section class="basic-stat-section"><h3>${esc(l.label || '')} <span>${uniq(l.rows)} 个技能</span></h3>${allTable(l.rows, l.label || active)}</section>`).join('');
    } else {
      const lanes = sheet.lanes.map(l => ({ ...l, rows: l.rows.filter(matches) }));
      visible = uniq(lanes.flatMap(l => l.rows));
      html = visible ? `<div class="split-grid">${lanes.filter(l => l.rows.some(r => !r.separator)).map((l, i) => splitTable(l.rows, `${active} 第${i + 1}栏`)).join('')}</div>` : '';
    }
    $('tableArea').innerHTML = html;
    $('emptyState').hidden = visible !== 0;
    const total = sheet.kind === 'all' ? uniq(sheet.rows) : uniq(sheet.lanes.flatMap(l => l.rows));
    $('resultSummary').textContent = query ? `找到 ${visible} 个技能（本页共 ${total} 个）` : `本页 ${visible} 个技能 · 游戏可从圣物学习 ${data.total} 个`;
    $('clearSearch').hidden = !query;
    $('sheetTabs').innerHTML = data.sheetOrder.map(n => `<button class="sheet-tab" type="button" data-sheet="${esc(n)}" role="tab" aria-selected="${n === active}">${esc(n)}</button>`).join('');
    document.querySelectorAll('[data-script]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.script === script)));
  }
  $('sheetTabs').addEventListener('click', e => { const b = e.target.closest('[data-sheet]'); if (!b) return; active = b.dataset.sheet; store.set('lc-game-table:sheet', active); render(); });
  document.querySelectorAll('[data-script]').forEach(b => b.addEventListener('click', () => { script = b.dataset.script; store.set('lc-game-table:script', script); render(); }));
  let t; $('searchInput').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { query = e.target.value.trim(); render(); }, 120); });
  $('clearSearch').addEventListener('click', () => { $('searchInput').value = ''; query = ''; render(); });
  $('backTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  render();
})();
