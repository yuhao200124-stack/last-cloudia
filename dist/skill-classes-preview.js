(() => {
  // 技能分类预览: one tab per 大类 done so far, its 小类 as sub-tabs; each sub-tab lists the skills without conditions
  // first, then those with conditions, each by bonus. Data: skill-classes-preview-data.js (scripts/build-skill-classes.mjs).
  const pages = window.SKILL_CLASS_PREVIEW.pages, skills = window.GAME_SKILL_DATA.skills;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const pageOf = name => pages.find(p => p.cat === name) || pages[0];
  let page = pageOf(store.get('lc-class-preview:cat'));
  const subOf = (pg, name) => pg.subs.find(x => x.name === name) || pg.subs[0];
  let sub = subOf(page, store.get(`lc-class-preview:sub:${page.cat}`));
  let script = store.get('lc-game-table:script', 't') === 's' ? 's' : 't';
  let query = '';
  const name = id => (script === 's' ? skills[id].nameS : skills[id].name);
  const effect = id => (script === 's' ? skills[id].effectS : skills[id].effect);
  const matches = id => !query || [skills[id].name, skills[id].nameS].join('\n').toLowerCase().includes(query.toLowerCase());
  const hl = t => { const raw = String(t), q = query.trim(); if (!q) return esc(raw); const i = raw.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(raw) : `${esc(raw.slice(0, i))}<mark>${esc(raw.slice(i, i + q.length))}</mark>${esc(raw.slice(i + q.length))}`; };
  const count = x => x.blocks[0].length + x.blocks[1].length;
  function table(rows) {
    if (!rows.length) return '<p class="preview-empty">没有技能。</p>';
    return `<div class="preview-scroll"><table class="preview-table"><colgroup><col class="name"><col class="sc"><col class="effect"><col class="bonus"><col class="cond"></colgroup>
      <thead><tr><th>技能名称</th><th>SC</th><th>技能效果</th><th>加成</th><th>条件</th></tr></thead><tbody>${rows.map(r => {
        const cond = r.tags.length ? r.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('') : '<span class="none">—</span>';
        const meta = r.also.length ? `<div class="meta">也在：${esc(r.also.join('、'))}</div>` : '';
        return `<tr><td class="name">${hl(name(r.id))}</td><td class="sc">${esc(skills[r.id].sc)}</td><td class="effect">${esc(effect(r.id)).replace(/\n/g, '<br>')}${meta}</td><td class="bonus${/^−|由其他/.test(r.bonus) ? ' minus' : ''}">${esc(r.bonus)}</td><td class="cond">${cond}</td></tr>`;
      }).join('')}</tbody></table></div>`;
  }
  function render() {
    const [none, cond] = sub.blocks.map(rows => rows.filter(r => matches(r.id)));
    $('catTabs').innerHTML = pages.map(p => `<button class="sheet-tab" type="button" role="tab" data-cat="${esc(p.cat)}" aria-selected="${p === page}">${esc(p.cat)} <small>${p.total}</small></button>`).join('');
    $('subTabs').innerHTML = page.subs.map(x => `<button class="sub-tab" type="button" role="tab" data-sub="${esc(x.name)}" aria-selected="${x === sub}">${esc(x.name)} <small>${count(x)}</small></button>`).join('');
    $('previewArea').innerHTML = `<section class="preview-block"><h3>没有条件 <span>${none.length} 个</span></h3>${table(none)}</section>
      <section class="preview-block"><h3>有条件 <span>${cond.length} 个</span></h3>${table(cond)}</section>`;
    $('resultSummary').textContent = `${page.cat} · ${sub.name}：${none.length + cond.length} 个技能${query ? '（搜索中）' : ''}`;
    $('clearSearch').hidden = !query;
    document.querySelectorAll('[data-script]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.script === script)));
  }
  $('catTabs').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; page = pageOf(b.dataset.cat); store.set('lc-class-preview:cat', page.cat); sub = subOf(page, store.get(`lc-class-preview:sub:${page.cat}`)); render(); });
  $('subTabs').addEventListener('click', e => { const b = e.target.closest('[data-sub]'); if (!b) return; sub = subOf(page, b.dataset.sub); store.set(`lc-class-preview:sub:${page.cat}`, sub.name); render(); });
  document.querySelectorAll('[data-script]').forEach(b => b.addEventListener('click', () => { script = b.dataset.script; store.set('lc-game-table:script', script); render(); }));
  let t; $('searchInput').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { query = e.target.value.trim(); render(); }, 120); });
  $('clearSearch').addEventListener('click', () => { $('searchInput').value = ''; query = ''; render(); });
  render();
})();
