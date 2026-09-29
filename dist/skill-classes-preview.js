(() => {
  // 技能分类预览: one tab per 大类 done so far, its 小类 as sub-tabs; each sub-tab lists the skills without conditions
  // first, then those with conditions, each by bonus. 造成伤害 · 伤害加成 is filtered by element × attack type (an entry
  // without that restriction matches every button). Data: skill-classes-preview-data.js (scripts/build-skill-classes.mjs).
  const pages = window.SKILL_CLASS_PREVIEW.pages, skills = window.GAME_SKILL_DATA.skills;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const ELS = [[null, '不限'], [1, '火'], [2, '冰'], [3, '树'], [4, '雷'], [5, '光'], [6, '暗'], [0, '无属性']];
  // 物理 = 普通攻击＋特技 (SKILL_PHYSIC 10 in the game's code): a bonus written for physical attacks
  const TYPES = [[null, '全部'], [10, '物理'], [1, '特技'], [2, '魔法'], [5, '超必杀'], [15, '反击']];
  const pageOf = name => pages.find(p => p.cat === name) || pages[0];
  const subOf = (pg, name) => pg.subs.find(x => x.name === name) || pg.subs[0];
  const num = v => (v === '' || v == null ? null : Number(v));
  let page = pageOf(store.get('lc-class-preview:cat'));
  let sub = subOf(page, store.get(`lc-class-preview:sub:${page.cat}`));
  let el = num(store.get('lc-class-preview:el', '')), type = num(store.get('lc-class-preview:type', ''));
  if (!ELS.some(([v]) => v === el)) el = null;
  if (!TYPES.some(([v]) => v === type)) type = null;
  let script = store.get('lc-game-table:script', 't') === 's' ? 's' : 't';
  let query = '';
  const name = id => (script === 's' ? skills[id].nameS : skills[id].name);
  const effect = id => (script === 's' ? skills[id].effectS : skills[id].effect);
  const matches = id => !query || [skills[id].name, skills[id].nameS].join('\n').toLowerCase().includes(query.toLowerCase());
  const hl = t => { const raw = String(t), q = query.trim(); if (!q) return esc(raw); const i = raw.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(raw) : `${esc(raw.slice(0, i))}<mark>${esc(raw.slice(i, i + q.length))}</mark>${esc(raw.slice(i + q.length))}`; };
  // 伤害加成: the entries of a skill that apply to the chosen element and attack type
  const fits = (e, x, t) => (x == null || !e.els || e.els.includes(x)) && (t == null || !e.types || (t === 10 ? e.types.includes(9) && e.types.includes(1) : e.types.includes(t)));
  function filterBlocks(s, x, t) {
    return [false, true].map(c => s.skills.map(k => ({ ...k, entries: k.entries.filter(e => e.cond === c && fits(e, x, t)).sort((a, b) => b.rate - a.rate) }))
      .filter(k => k.entries.length).sort((a, b) => b.entries[0].rate - a.entries[0].rate || a.id - b.id));
  }
  const blocksOf = x => (x.filter ? filterBlocks(x, el, type) : x.blocks);
  const countOf = x => (x.filter ? x.skills.length : new Set(x.blocks.flat().map(r => r.id)).size);
  function table(rows) {
    if (!rows.length) return '<p class="preview-empty">没有技能。</p>';
    return `<div class="preview-scroll"><table class="preview-table"><colgroup><col class="name"><col class="sc"><col class="effect"><col class="bonus"><col class="cond"></colgroup>
      <thead><tr><th>技能名称</th><th>SC</th><th>技能效果</th><th>加成</th><th>条件</th></tr></thead>${rows.map(r => {
        const n = r.entries.length, meta = r.also.length ? `<div class="meta">也在：${esc(r.also.join('、'))}</div>` : '';
        const cells = e => {
          const chips = [...e.apply.map(t => `<span class="chip apply">${esc(t)}</span>`), ...e.tags.map(t => `<span class="chip">${esc(t)}</span>`)].join('') || '<span class="none">—</span>';
          return `<td class="bonus${/^[−-]|由其他|读不出/.test(e.text) ? ' minus' : ''}">${esc(e.text)}</td><td class="cond">${chips}</td>`;
        };
        return `<tbody class="skill-rows">${r.entries.map((e, i) => `<tr>${i ? '' : `<td class="name" rowspan="${n}">${hl(name(r.id))}</td><td class="sc" rowspan="${n}">${esc(skills[r.id].sc)}</td><td class="effect" rowspan="${n}">${esc(effect(r.id)).replace(/\n/g, '<br>')}${meta}</td>`}${cells(e)}</tr>`).join('')}</tbody>`;
      }).join('')}</table></div>`;
  }
  function filterRows() {
    if (!sub.filter) return '';
    const btn = (kind, v, label, on, n) => `<button class="sub-tab filter-tab" type="button" data-${kind}="${v ?? ''}" aria-pressed="${on}">${esc(label)} <small>${n}</small></button>`;
    const n = (x, t) => sub.skills.filter(k => matches(k.id) && k.entries.some(e => fits(e, x, t))).length;
    return `<div class="filter-row"><span class="filter-label">属性</span>${ELS.map(([v, l]) => btn('el', v, l, v === el, n(v, type))).join('')}</div>
      <div class="filter-row"><span class="filter-label">攻击</span>${TYPES.map(([v, l]) => btn('type', v, l, v === type, n(el, v))).join('')}</div>`;
  }
  function render() {
    const [none, cond] = blocksOf(sub).map(rows => rows.filter(r => matches(r.id)));
    $('catTabs').innerHTML = pages.map(p => `<button class="sheet-tab" type="button" role="tab" data-cat="${esc(p.cat)}" aria-selected="${p === page}">${esc(p.cat)} <small>${p.total}</small></button>`).join('');
    $('subTabs').innerHTML = page.subs.map(x => `<button class="sub-tab" type="button" role="tab" data-sub="${esc(x.name)}" aria-selected="${x === sub}">${esc(x.name)} <small>${countOf(x)}</small></button>`).join('');
    $('filterRows').innerHTML = filterRows();
    $('filterRows').hidden = !sub.filter;
    $('previewArea').innerHTML = `<section class="preview-block"><h3>没有条件 <span>${none.length} 个</span></h3>${table(none)}</section>
      <section class="preview-block"><h3>有条件 <span>${cond.length} 个</span></h3>${table(cond)}</section>`;
    const pick = sub.filter ? `（${ELS.find(([v]) => v === el)[1]} × ${TYPES.find(([v]) => v === type)[1]}）` : '';
    $('resultSummary').textContent = `${page.cat} · ${sub.name}${pick}：${new Set([...none, ...cond].map(r => r.id)).size} 个技能${query ? '（搜索中）' : ''}`;
    $('clearSearch').hidden = !query;
    document.querySelectorAll('[data-script]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.script === script)));
  }
  $('catTabs').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; page = pageOf(b.dataset.cat); store.set('lc-class-preview:cat', page.cat); sub = subOf(page, store.get(`lc-class-preview:sub:${page.cat}`)); render(); });
  $('subTabs').addEventListener('click', e => { const b = e.target.closest('[data-sub]'); if (!b) return; sub = subOf(page, b.dataset.sub); store.set(`lc-class-preview:sub:${page.cat}`, sub.name); render(); });
  $('filterRows').addEventListener('click', e => {
    const b = e.target.closest('[data-el],[data-type]'); if (!b) return;
    if ('el' in b.dataset) { el = num(b.dataset.el); store.set('lc-class-preview:el', b.dataset.el); }
    else { type = num(b.dataset.type); store.set('lc-class-preview:type', b.dataset.type); }
    render();
  });
  document.querySelectorAll('[data-script]').forEach(b => b.addEventListener('click', () => { script = b.dataset.script; store.set('lc-game-table:script', script); render(); }));
  let t; $('searchInput').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { query = e.target.value.trim(); render(); }, 120); });
  $('clearSearch').addEventListener('click', () => { $('searchInput').value = ''; query = ''; render(); });
  render();
})();
