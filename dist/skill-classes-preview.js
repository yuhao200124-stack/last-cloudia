(() => {
  // 技能分类预览: one tab per 大类, its 小类 as sub-tabs; each sub-tab lists the skills without conditions first, then
  // those with conditions, each by bonus. A damage-like 小类 is filtered by two rows combined (element or race ×
  // attack type; an entry without that restriction matches every button).
  // Data: skill-classes-preview-data.js (scripts/build-skill-classes.mjs).
  // 配装 (user 2026-09-29: this page is the 配装 page): choose a character (or come from the calculator / a character
  // page's 已保存配装 with ?character=…&plan=…); the damage calculator runs in a frame on this page
  // (damage-calculator.html?embedded=build) — 战斗设置 and 配装详情 show it — and every row gets a “+”; the frame
  // sends back what is picked, each one's gain, SC and the damage, and the move sets the 属性 × 攻击 filters.
  const pages = window.SKILL_CLASS_PREVIEW.pages, skills = window.GAME_SKILL_DATA.skills, characters = window.SKILL_CLASS_PREVIEW.characters || [];
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const RACES = [[1001, '战士'], [1002, '射手'], [1003, '骑士'], [1004, '法师'], [1005, '治疗师'], [2001, '兽'], [2002, '植物'], [2003, '昆虫'], [2004, '鸟'], [2005, '魔法生物'], [2006, '不死生物'], [2007, '石'], [2008, '机械'], [2009, '精灵'], [2010, '龙'], [2011, '神'], [2012, '鱼']];
  // 物理 = 普通攻击＋特技 (SKILL_PHYSIC 10 in the game's code): a bonus written for physical attacks
  const DIMS = {
    el: { label: '属性', field: 'els', opts: [[null, '不限'], [1, '火'], [2, '冰'], [3, '树'], [4, '雷'], [5, '光'], [6, '暗'], [0, '无属性']] },
    type: { label: '攻击', field: 'types', opts: [[null, '全部'], [10, '物理'], [1, '特技'], [2, '魔法'], [5, '超必杀'], [15, '反击']] },
    race: { label: '种族', field: 'races', opts: [[null, '不限'], ...RACES] },
  };
  const pageOf = name => pages.find(p => p.cat === name) || pages[0];
  const subOf = (pg, name) => pg.subs.find(x => x.name === name) || pg.subs[0];
  const num = v => (v === '' || v == null ? null : Number(v));
  let page = pageOf(store.get('lc-class-preview:cat'));
  let sub = subOf(page, store.get(`lc-class-preview:sub:${page.cat}`));
  const sel = {};
  for (const [k, d] of Object.entries(DIMS)) { const v = num(store.get(`lc-class-preview:${k}`, '')); sel[k] = d.opts.some(([x]) => x === v) ? v : null; }
  let script = store.get('lc-game-table:script', 't') === 's' ? 's' : 't';
  let query = '';
  const name = id => (script === 's' ? skills[id].nameS : skills[id].name);
  const effect = id => (script === 's' ? skills[id].effectS : skills[id].effect);
  const matches = id => !query || [skills[id].name, skills[id].nameS].join('\n').toLowerCase().includes(query.toLowerCase());
  const hl = t => { const raw = String(t), q = query.trim(); if (!q) return esc(raw); const i = raw.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(raw) : `${esc(raw.slice(0, i))}<mark>${esc(raw.slice(i, i + q.length))}</mark>${esc(raw.slice(i + q.length))}`; };
  // the entries of a skill that apply to the chosen buttons
  const fitsDim = (e, k, v) => {
    const f = e[DIMS[k].field];
    if (v == null || !f) return true;
    return k === 'type' && v === 10 ? f.includes(9) && f.includes(1) : f.includes(v);
  };
  const fits = (e, s) => sub.filter.every(k => fitsDim(e, k, s[k]));
  function filterBlocks(x, s) {
    return [false, true].map(c => x.skills.map(k => ({ ...k, entries: k.entries.filter(e => e.cond === c && fits(e, s)).sort((a, b) => b.v - a.v) }))
      .filter(k => k.entries.length).sort((a, b) => b.entries[0].v - a.entries[0].v || a.id - b.id));
  }
  const blocksOf = x => (x.filter ? filterBlocks(x, sel) : x.blocks);
  const countOf = x => new Set((x.skills || x.blocks.flat()).map(r => r.id)).size;
  // ---- 配装 ----
  const urlParams = new URLSearchParams(location.search);
  let buildChar = characters.some(c => c.id === urlParams.get('character')) ? urlParams.get('character') : null;
  let buildPlan = buildChar ? urlParams.get('plan') : null;
  let bst = null, panel = null, lastMoveKey = null;
  const frame = () => $('buildFrame');
  const toFrame = msg => { if (buildChar && frame()?.contentWindow) frame().contentWindow.postMessage(msg, location.origin); };
  const ELEM_NAMES = ['无', '火', '冰', '树', '雷', '光', '暗'];
  const TYPE_NAMES = { 9: '普攻', 1: '特技', 2: '魔法', 5: '超必杀', 15: '反击' };
  const TYPE_FILTER = { 9: 10, 1: 1, 2: 2, 5: 5, 15: 15 };   // a normal attack is physical: 物理
  const fmtN = n => (n == null ? '—' : Math.round(n).toLocaleString('zh-CN'));
  const gainText = g => `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%`;
  function setUrl() {
    const u = new URL(location.href);
    u.searchParams.delete('plan');
    if (buildChar) u.searchParams.set('character', buildChar); else u.searchParams.delete('character');
    history.replaceState(null, '', u);
  }
  function startBuild(id, plan = null) {
    buildChar = id; buildPlan = plan; bst = null; lastMoveKey = null; setUrl();
    frame().src = `./damage-calculator.html?character=${encodeURIComponent(id)}&embedded=build${plan ? `&plan=${encodeURIComponent(plan)}` : ''}&v=20260929-classbuild`;
    render();
  }
  function exitBuild() {
    buildChar = buildPlan = null; bst = null; panel = null; setUrl();
    frame().removeAttribute('src'); frame().src = 'about:blank';
    render();
  }
  function setPanel(p) {
    panel = panel === p ? null : p;
    if (panel) toFrame({ type: 'lc-build-view', view: panel });
    renderBar();
  }
  // the move sets the 属性 × 攻击 filters (the user can still change them)
  function followMove() {
    const m = bst?.move; if (!m) return;
    const key = `${buildChar}:${m.id}:${m.element}:${m.skillType}`; if (key === lastMoveKey) return;
    lastMoveKey = key;
    if (m.element != null && DIMS.el.opts.some(([v]) => v === m.element)) { sel.el = m.element; store.set('lc-class-preview:el', String(m.element)); }
    const t = TYPE_FILTER[m.skillType];
    if (t != null) { sel.type = t; store.set('lc-class-preview:type', String(t)); }
  }
  window.addEventListener('message', e => {
    if (e.origin !== location.origin || !frame() || e.source !== frame().contentWindow || !buildChar) return;
    if (e.data?.type === 'lc-damage-ready') { toFrame({ type: 'lc-build-view', view: panel || 'settings' }); toFrame({ type: 'lc-build-hello' }); }
    else if (e.data?.type === 'lc-build-state') { bst = e.data; followMove(); render(); }
  });
  function renderBar() {
    $('buildCharacter').innerHTML = `<option value="">${buildChar ? '选角色' : '选角色开始配装'}</option>${characters.map(c => `<option value="${esc(c.id)}"${c.id === buildChar ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}`;
    $('buildActions').hidden = !buildChar;
    document.querySelectorAll('[data-build-panel]').forEach(b => b.setAttribute('aria-pressed', String(panel === b.dataset.buildPanel)));
    $('buildFrameWrap').classList.toggle('is-collapsed', !buildChar || !panel);
    if (!buildChar) { $('buildInfo').textContent = '选一个角色，就能在下面的表里点“+”加技能，看每个技能的收益和 SC。'; return; }
    if (!bst) { $('buildInfo').textContent = '正在读取角色与游戏数据…'; return; }
    const m = bst.move;
    const move = m ? `招式 <b>${esc(m.name || '—')}</b>（${esc(m.element != null ? `${ELEM_NAMES[m.element] || m.element}属性` : '')}${m.skillType != null ? ` · ${esc(TYPE_NAMES[m.skillType] || '')}` : ''}）` : '招式：读取中…';
    const freed = bst.sc?.freed?.length ? `（${bst.sc.freed.map(f => `${f.by}免 ${esc(skills[f.id]?.nameS || f.id)}`).join('、')}）` : '';
    const dmg = bst.perCall != null ? `每次伤害 <b>${fmtN(bst.perCall)}</b>${bst.baseline ? `（配装前 ${fmtN(bst.baseline)}，<span class="up">${gainText(bst.perCall / bst.baseline - 1)}</span>）` : ''}` : '每次伤害：计算中…';
    $('buildInfo').innerHTML = `${move} · 已选 <b>${bst.selected.length}</b> 个 · SC <b>${bst.sc?.total ?? 0}</b>${freed}${bst.auto?.length ? ` · 角色专属 ${bst.auto.length} 个（0 SC，见配装详情）` : ''}<br>${dmg}${bst.computing ? ' · 计算中…' : ''}`;
  }
  function actionCell(id, n) {
    const on = bst?.selected.includes(id), g = bst?.gains?.[id];
    const gain = on ? (g != null ? `<small class="${g < 0 ? 'down' : ''}">${gainText(g)}</small>` : '<small class="wait">计算中</small>') : '';
    return `<td class="act" rowspan="${n}"><button type="button" class="add-button${on ? ' is-added' : ''}" data-add-skill="${id}" aria-label="${on ? '从配装取消' : '加入配装'}" title="${on ? '已加入配装；再点一次取消' : '加入配装'}"${bst ? '' : ' disabled'}>${on ? '✓' : '+'}</button>${gain}</td>`;
  }
  function table(rows) {
    if (!rows.length) return '<p class="preview-empty">没有技能。</p>';
    const act = !!buildChar;
    return `<div class="preview-scroll"><table class="preview-table${act ? ' with-act' : ''}"><colgroup><col class="name"><col class="sc"><col class="effect"><col class="bonus"><col class="cond">${act ? '<col class="act">' : ''}</colgroup>
      <thead><tr><th>技能名称</th><th>SC</th><th>技能效果</th><th>加成</th><th>条件</th>${act ? '<th>配装</th>' : ''}</tr></thead>${rows.map(r => {
        const n = r.entries.length, meta = r.also.length ? `<div class="meta">也在：${esc(r.also.join('、'))}</div>` : '';
        const cells = e => {
          const chips = [...e.apply.map(t => `<span class="chip apply">${esc(t)}</span>`), ...e.tags.map(t => `<span class="chip">${esc(t)}</span>`)].join('') || '<span class="none">—</span>';
          return `<td class="bonus${/^[−-]|由其他|读不出|见效果/.test(e.text) ? ' minus' : ''}">${esc(e.text)}</td><td class="cond">${chips}</td>`;
        };
        return `<tbody class="skill-rows">${r.entries.map((e, i) => `<tr>${i ? '' : `<td class="name" rowspan="${n}">${hl(name(r.id))}</td><td class="sc" rowspan="${n}">${esc(skills[r.id].sc)}</td><td class="effect" rowspan="${n}">${esc(effect(r.id)).replace(/\n/g, '<br>')}${meta}</td>`}${cells(e)}${act && !i ? actionCell(r.id, n) : ''}</tr>`).join('')}</tbody>`;
      }).join('')}</table></div>`;
  }
  function filterRows() {
    if (!sub.filter) return '';
    const n = (k, v) => sub.skills.filter(r => matches(r.id) && r.entries.some(e => fits(e, { ...sel, [k]: v }))).length;
    return sub.filter.map((k, i) => {
      const d = DIMS[k];
      // a race row lists only the races this 小类 has
      const opts = k === 'race' ? d.opts.filter(([v]) => v == null || sub.skills.some(r => r.entries.some(e => e.races?.includes(v)))) : d.opts;
      return `<div class="filter-row"><span class="filter-label">${esc(sub.labels?.[i] || d.label)}</span>${opts.map(([v, l]) => `<button class="sub-tab filter-tab" type="button" data-dim="${k}" data-val="${v ?? ''}" aria-pressed="${v === sel[k]}">${esc(l)} <small>${n(k, v)}</small></button>`).join('')}</div>`;
    }).join('');
  }
  function render() {
    renderBar();
    const [none, cond] = blocksOf(sub).map(rows => rows.filter(r => matches(r.id)));
    $('catTabs').innerHTML = pages.map(p => `<button class="sheet-tab" type="button" role="tab" data-cat="${esc(p.cat)}" aria-selected="${p === page}">${esc(p.cat)} <small>${p.total}</small></button>`).join('');
    $('subTabs').hidden = page.subs.length < 2;
    $('subTabs').innerHTML = page.subs.map(x => `<button class="sub-tab" type="button" role="tab" data-sub="${esc(x.name)}" aria-selected="${x === sub}">${esc(x.name)} <small>${countOf(x)}</small></button>`).join('');
    $('filterRows').innerHTML = filterRows();
    $('filterRows').hidden = !sub.filter;
    $('previewArea').innerHTML = `<section class="preview-block"><h3>没有条件 <span>${new Set(none.map(r => r.id)).size} 个</span></h3>${table(none)}</section>
      <section class="preview-block"><h3>有条件 <span>${new Set(cond.map(r => r.id)).size} 个</span></h3>${table(cond)}</section>`;
    const pick = sub.filter ? `（${sub.filter.map(k => DIMS[k].opts.find(([v]) => v === sel[k])[1]).join(' × ')}）` : '';
    const title = page.subs.length > 1 ? `${page.cat} · ${sub.name}` : page.cat;
    $('resultSummary').textContent = `${title}${pick}：${new Set([...none, ...cond].map(r => r.id)).size} 个技能${query ? '（搜索中）' : ''}`;
    $('clearSearch').hidden = !query;
    document.querySelectorAll('[data-script]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.script === script)));
  }
  $('catTabs').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; page = pageOf(b.dataset.cat); store.set('lc-class-preview:cat', page.cat); sub = subOf(page, store.get(`lc-class-preview:sub:${page.cat}`)); render(); });
  $('subTabs').addEventListener('click', e => { const b = e.target.closest('[data-sub]'); if (!b) return; sub = subOf(page, b.dataset.sub); store.set(`lc-class-preview:sub:${page.cat}`, sub.name); render(); });
  $('filterRows').addEventListener('click', e => {
    const b = e.target.closest('[data-dim]'); if (!b) return;
    sel[b.dataset.dim] = num(b.dataset.val); store.set(`lc-class-preview:${b.dataset.dim}`, b.dataset.val);
    render();
  });
  $('previewArea').addEventListener('click', e => { const b = e.target.closest('[data-add-skill]'); if (b && !b.disabled) toFrame({ type: 'lc-build-toggle', id: Number(b.dataset.addSkill) }); });
  $('buildCharacter').addEventListener('change', e => { if (e.target.value) startBuild(e.target.value); else exitBuild(); });
  document.querySelectorAll('[data-build-panel]').forEach(b => b.addEventListener('click', () => setPanel(b.dataset.buildPanel)));
  $('buildExit').addEventListener('click', exitBuild);
  document.querySelectorAll('[data-script]').forEach(b => b.addEventListener('click', () => { script = b.dataset.script; store.set('lc-game-table:script', script); render(); }));
  let t; $('searchInput').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { query = e.target.value.trim(); render(); }, 120); });
  $('clearSearch').addEventListener('click', () => { $('searchInput').value = ''; query = ''; render(); });
  if (buildChar) startBuild(buildChar, buildPlan); else render();
})();
