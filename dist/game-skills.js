(() => {
  const data = window.GAME_SKILL_DATA;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  let active = data.sheetOrder.includes(store.get('lc-game-table:sheet')) ? store.get('lc-game-table:sheet') : data.sheetOrder[0];
  let script = store.get('lc-game-table:script', 't') === 's' ? 's' : 't';
  let query = '';
  // 配装 (user 2026-09-29): a character is chosen first — character page → calculator → 配装 opens this page in the
  // whole window as index.html?character=…[&plan=…]. The skill table stays as it is, with a “+” on every row; the
  // damage calculator runs in a frame beside it (damage-calculator.html?embedded=build: the results and the 配装 panel,
  // or the whole calculator for 战斗设置), gets the “+” clicks and sends back what is picked, each one's gain and SC.
  const params = new URLSearchParams(location.search);
  const buildChar = /^\d+$/.test(params.get('character') || '') ? params.get('character') : null;
  const embedded = !!buildChar;
  let picked = new Set(), own = new Set(), gains = {}, bst = null;
  const gainText = g => `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%`;
  function addButton(id) {
    const g = gains[id];
    // a skill on the character's own ability board is always in the loadout, at 0 SC (no “+”)
    if (own.has(id)) return `<span class="own-skill-badge" title="角色自己能力盘上的技能，已经算在配装里（0 SC）${g != null ? ` · 收益 ${gainText(g)}` : ''}">自带</span>${g != null ? `<small class="build-gain">${gainText(g)}</small>` : ''}`;
    const on = picked.has(id);
    return `<button class="add-skill-button${on ? ' is-added' : ''}" type="button" data-add-skill="${id}" aria-label="${on ? '从配装取消' : '加入配装'}" title="${on ? `已加入配装${g != null ? ` · 收益 ${gainText(g)}` : ''}；再点一次取消` : '加入配装'}"${bst ? '' : ' disabled'}><span aria-hidden="true">${on ? '✓' : '+'}</span></button>${on ? `<small class="build-gain">${g != null ? gainText(g) : '计算中'}</small>` : ''}`;
  }
  const actionTd = s => embedded ? `<td class="action-cell" data-action-for="${s.gameId}">${addButton(s.gameId)}</td>` : '';
  const extra = embedded ? 1 : 0;
  const skill = ref => data.skills[ref];
  const txt = (s, f) => script === 's' ? s[f + 'S'] : s[f];
  const hay = s => [s.name, s.nameS, s.effect, s.effectS, ...s.sources, ...s.sourcesS].join('\n').toLocaleLowerCase('zh-CN');
  const found = row => row.separator || !query || hay(skill(row.ref)).includes(query.toLocaleLowerCase('zh-CN'));
  // 配装: hide what the current loadout does not need (user 2026-09-29) — 全输出 hides the defense (受到伤害, HP／防御／
  // 魔抗, 回复) and the offense that does not apply to the current move; 半肉 only the offense that does not apply;
  // 全肉 all offense; 不隐藏 nothing. 异常 (耐性 and 赋予), MP, 移动, 装备·种族 … always stay; 特攻 is never hidden as
  // “not applying” (user: keep every 特攻). An effect applies when its element and attack type match the move's
  // (attack types: the move's SKILL_TYPE, plus 魔法 when it hits with 法强 — the game script gives 水弹, a 特技, both
  // 物理 and 冰魔法 bonuses) and, for 攻击力／法强, when it is the stat the move hits with.
  const OFFENSE = new Set(['造成伤害', '伤害上限', '特攻', '暴击', 'Break值', '反击', '特技充能·必杀', '魔法·咏唱']);
  const DEFENSE = new Set(['受到伤害', '回复']);
  const HIDE_MODES = [['out', '全输出'], ['half', '半肉'], ['tank', '全肉'], ['none', '不隐藏']];
  let hideMode = HIDE_MODES.some(([k]) => k === store.get('lc-build-hide')) ? store.get('lc-build-hide') : 'none', move = null;
  const kindOf = ([cat, stat]) => cat === '基础属性' ? (stat === '攻击力' || stat === '法强' ? 'off' : stat === 'MP' ? 'other' : 'def') : OFFENSE.has(cat) ? 'off' : DEFENSE.has(cat) ? 'def' : 'other';
  function applies([cat, stat, els, types]) {
    if (!move || cat === '特攻') return true;
    if (cat === '基础属性') return move.magical == null || stat === (move.magical ? '法强' : '攻击力');
    if (els && move.element != null && !els.includes(move.element)) return false;
    if (types && move.roles.length && !types.some(t => move.roles.includes(t))) return false;
    return true;
  }
  function kept(ref) {
    const mode = embedded ? hideMode : 'none', all = skill(ref).cls?.e;
    if (mode === 'none' || !all?.length) return true;
    const list = all.some(e => !e[4]) ? all.filter(e => !e[4]) : all;
    return list.some(e => { const k = kindOf(e); return mode === 'out' ? k === 'other' || (k === 'off' && applies(e)) : mode === 'half' ? k !== 'off' || applies(e) : k !== 'off'; });
  }
  const matches = row => found(row) && (row.separator || kept(row.ref));
  // no separator at the start / end of a lane or twice in a row once rows are hidden
  const tidy = rows => rows.filter((r, i, a) => !r.separator || (i > 0 && i < a.length - 1 && !a[i - 1].separator && a.slice(i + 1).some(x => !x.separator) && a.slice(0, i).some(x => !x.separator)));
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
  const tr = (s, typeTd = '') => `<tr data-game-id="${s.gameId}">${typeTd}<td class="skill-name">${cell(nameCell(s), 'cell-center')}</td><td class="sc-cell">${cell(scCell(s), 'cell-center')}</td><td>${cell(effectCell(s))}</td><td class="sources-cell">${cell(sourcesCell(s))}</td><td class="rating-cell">${cell(esc(s.mark), 'cell-center')}</td>${actionTd(s)}</tr>`;
  const head = (cols, withType) => `<thead><tr class="book-title"><th colspan="${cols + extra}">一、被动技能（游戏数据）</th></tr><tr class="column-title">${withType ? '<th>技能类型</th>' : ''}<th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th>${embedded ? '<th>添加</th>' : ''}</tr></thead>`;
  const actionCol = embedded ? '<col class="action">' : '';
  function allTable(rows, label) {
    return `<div class="table-scroll"><table class="excel-table skill-list-table all-skills game-table" aria-label="${esc(label)}"><colgroup><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating">${actionCol}</colgroup>${head(5, false)}<tbody>${rows.map(r => r.separator ? `<tr class="separator-row" aria-hidden="true"><td colspan="${5 + extra}"></td></tr>` : tr(skill(r.ref))).join('')}</tbody></table></div>`;
  }
  function splitTable(rows, label) {
    const groups = [];
    for (const row of rows) {
      const last = groups.at(-1);
      if (row.separator) groups.push({ separator: true });
      else if (last && !last.separator && last.type === row.type) last.rows.push(row);
      else groups.push({ type: row.type || '未分类', rows: [row] });
    }
    const body = groups.map(g => g.separator ? `<tr class="separator-row" aria-hidden="true"><td colspan="${6 + extra}"></td></tr>`
      : g.rows.map((r, i) => tr(skill(r.ref), i === 0 ? `<td class="type-cell" rowspan="${g.rows.length}">${cell(hl(g.type), 'cell-center')}</td>` : '')).join('')).join('');
    return `<div class="table-scroll"><table class="excel-table skill-list-table game-table" aria-label="${esc(label)}"><colgroup><col class="type"><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating">${actionCol}</colgroup>${head(6, true)}<tbody>${body}</tbody></table></div>`;
  }
  const uniq = rows => new Set(rows.filter(r => !r.separator).map(r => r.ref)).size;
  function render() {
    const sheet = data.sheets[active];
    $('sheetTitle').textContent = active;
    $('sheetHint').textContent = '名称、SC、效果、圣物取自游戏数据；分类、排序和评价按技能表排版';
    let visible = 0, hidden = 0, html = '';
    if (sheet.kind === 'all') {
      // a separator row (blank line between groups) is drawn here too, like on the split sheets (2026-09-30)
      const rows = tidy(sheet.rows.filter(matches)); visible = uniq(rows); hidden = uniq(sheet.rows.filter(found)) - visible;
      html = visible ? allTable(rows, active) : '';
    } else if (sheet.kind === 'lanes') {
      const lanes = sheet.lanes.map(l => ({ ...l, rows: tidy(l.rows.filter(matches)) }));
      visible = uniq(lanes.flatMap(l => l.rows)); hidden = uniq(sheet.lanes.flatMap(l => l.rows.filter(found))) - visible;
      html = lanes.filter(l => l.rows.some(r => !r.separator)).map(l => `<section class="basic-stat-section"><h3>${esc(l.label || '')} <span>${uniq(l.rows)} 个技能</span></h3>${allTable(l.rows, l.label || active)}</section>`).join('');
    } else {
      const lanes = sheet.lanes.map(l => ({ ...l, rows: tidy(l.rows.filter(matches)) }));
      visible = uniq(lanes.flatMap(l => l.rows)); hidden = uniq(sheet.lanes.flatMap(l => l.rows.filter(found))) - visible;
      html = visible ? `<div class="split-grid">${lanes.filter(l => l.rows.some(r => !r.separator)).map((l, i) => splitTable(l.rows, `${active} 第${i + 1}栏`)).join('')}</div>` : '';
    }
    $('tableArea').innerHTML = html;
    $('emptyState').hidden = visible !== 0;
    const total = sheet.kind === 'all' ? uniq(sheet.rows) : uniq(sheet.lanes.flatMap(l => l.rows));
    const hideNote = hidden > 0 ? ` · 按“${HIDE_MODES.find(([k]) => k === hideMode)[1]}”隐藏了 ${hidden} 个` : '';
    $('resultSummary').textContent = query ? `找到 ${visible} 个技能（本页共 ${total} 个）${hideNote}` : `本页 ${visible} 个技能${hideNote || ` · 游戏可从圣物学习 ${data.total} 个`}`;
    if (embedded) {
      document.querySelectorAll('[data-hide-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.hideMode === hideMode)));
      const how = move ? `按当前招式${move.name ? `「${move.name}」` : ''}判断：${['无属性', '火', '冰', '树', '雷', '光', '暗'][move.element] ?? '—'}属性 · ${move.magical == null ? '' : move.magical ? '法强' : '攻击力'}` : '等计算器读取招式';
      $('buildFilter').title = how;
    }
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
  if (embedded) {
    const frame = $('buildFrame'), fmtN = n => (n == null ? '—' : Math.round(n).toLocaleString('zh-CN'));
    let leftView = 'table', phoneView = 'left', collapsed = false;
    const phone = () => window.matchMedia('(max-width: 900px)').matches;
    const toFrame = msg => frame.contentWindow?.postMessage(msg, location.origin);
    // desktop: 技能表 = the table, with the 配装 panel on the right and (wide windows) the results frame on the left;
    // 战斗设置 = the whole calculator where the table was; phone: one of 技能表 / 战斗设置 / 配装 at a time
    function frameView() { return (phone() ? phoneView === 'results' : false) ? 'results' : leftView === 'settings' ? 'settings' : 'results'; }
    function layout() {
      const cls = document.body.classList;
      cls.add('build-mode');
      cls.toggle('build-settings', leftView === 'settings' && (!phone() || phoneView === 'left'));
      cls.toggle('build-view-results', phone() && phoneView === 'results');
      cls.toggle('build-collapsed', collapsed);
      document.querySelectorAll('[data-build-view]').forEach(b => { const v = b.dataset.buildView; b.setAttribute('aria-pressed', String(v === 'results' ? phoneView === 'results' : phoneView === 'left' && leftView === v)); });
      $('buildResultsToggle').textContent = collapsed ? '显示配装' : '收起配装'; $('buildResultsToggle').setAttribute('aria-expanded', String(!collapsed));
      toFrame({ type: 'lc-build-view', view: frameView() });
    }
    function status() {
      if (!bst) { $('buildStatus').textContent = '计算器读取中…'; return; }
      const last = bst.lastAdded ? ` · 刚加入 ${bst.lastAdded.name} ${bst.lastAdded.gain != null ? gainText(bst.lastAdded.gain) : '计算中…'}` : '';
      $('buildCharName').textContent = bst.move?.character || buildChar;
      $('buildStatus').textContent = `已选 ${bst.selected.length} 个 · SC ${bst.sc?.total ?? 0}${bst.perCall != null ? ` · 当前配装每次 ${fmtN(bst.perCall)}` : ''}${last}${bst.computing ? ' · 计算中…' : ''}`;
    }
    $('buildToolbar').hidden = false;
    $('buildFilter').hidden = false;
    $('buildFilter').addEventListener('click', e => { const b = e.target.closest('[data-hide-mode]'); if (!b) return; hideMode = b.dataset.hideMode; store.set('lc-build-hide', hideMode); render(); });
    frame.src = `./damage-calculator.html?character=${encodeURIComponent(buildChar)}&embedded=build${params.get('plan') ? `&plan=${encodeURIComponent(params.get('plan'))}` : ''}&v=20260930-allsep`;
    document.querySelector('.build-views').addEventListener('click', e => {
      const b = e.target.closest('[data-build-view]'); if (!b) return;
      if (b.dataset.buildView === 'results') phoneView = 'results'; else { leftView = b.dataset.buildView; phoneView = 'left'; }
      layout(); window.scrollTo({ top: 0 });
    });
    $('buildResultsToggle').addEventListener('click', () => { collapsed = !collapsed; layout(); });
    $('buildExit').addEventListener('click', () => { location.href = `./character-${buildChar}.html`; });
    window.addEventListener('resize', () => layout());
    $('tableArea').addEventListener('click', e => { const b = e.target.closest('[data-add-skill]'); if (b && !b.disabled) toFrame({ type: 'lc-build-toggle', id: Number(b.dataset.addSkill) }); });
    window.addEventListener('message', e => {
      if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
      if (e.data?.type === 'lc-damage-ready') { layout(); toFrame({ type: 'lc-build-hello' }); }
      else if (e.data?.type === 'lc-build-state') {
        bst = e.data; picked = new Set((bst.selected || []).map(Number)); own = new Set((bst.auto || []).map(Number)); gains = bst.gains || {};
        // the current move decides what 全输出／半肉 hide: re-draw the table only when it changes
        const m = bst.move, next = m ? { name: m.name, element: m.element ?? null, magical: m.magical ?? null, roles: m.skillType == null ? [] : [m.skillType, ...(m.magical && m.skillType !== 2 ? [2] : [])] } : null;
        if (JSON.stringify(next) !== JSON.stringify(move)) { move = next; render(); }
        else document.querySelectorAll('[data-action-for]').forEach(td => { td.innerHTML = addButton(Number(td.dataset.actionFor)); });
        status();
      }
    });
    layout(); status();
  }
})();
