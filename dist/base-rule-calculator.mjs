import { CATALOG as ROXY_CATALOG } from './roxy-rules.mjs';
import { DEFAULT_CONTEXT, ATTACKS, CONDITION_FIELDS, evaluateCatalog, formatEffect, describeCondition } from './effect-rule-engine.mjs';
import { buildCatalog, makeTemplate, sourceKey, validateTemplates, LEARNING_STORAGE_KEY } from './effect-rule-learning.mjs';

const panel = document.querySelector('#bonusCalculator[data-rule-calculator]');
if (panel) mount();

function mount() {
  const characterId = document.body.dataset.characterId;
  const characterName = document.querySelector('.hero h2')?.textContent.trim() || '当前角色';
  const stateKey = `lc-effect-rules:character:${characterId}:v1`;
  const root = document.getElementById('bonusSummary');
  const esc = (x = '') => String(x ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const clone = x => JSON.parse(JSON.stringify(x));
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const groups = { traits: '个性', exclusive: '专属技能', common: '通用技能', transcend: '超越', equipment: '装备' };
  const statuses = { active: '生效', inactive: '未生效', pending: '待确认', disabled: '未启用' };
  const types = { stat: '面板属性', equipmentStat: '装备属性', damage: '伤害增加', cap: '伤害上限', killer: '特攻触发', hit: '命中与分段', statReference: '攻击与防御参照', defenseReference: '防御参照修正', critRate: '暴击率', critPermission: '暴击资格', defense: '防御与减伤', recovery: '回复', castSpeed: '咏唱速度', utility: '其他效果' };
  const attackNames = { normal: '普通攻击', s1: '特技1 · 水球', s2: '特技2 · 冰柱破碎', s3: '特技3 · 暴风雪', magic: '魔法', ultimate: '超必杀 · 积雨云' };
  const elements = [[null, '待确认'], ['none', '无'], ['fire', '火'], ['ice', '冰'], ['earth', '树'], ['thunder', '雷'], ['light', '光'], ['dark', '暗']];
  const saved = read(stateKey, {});
  const state = {
    context: { ...DEFAULT_CONTEXT, ...(characterId === '260' ? {} : { element: null, magicFamily: null, killerBuff: false, bossWaveBuff: false }), ...(saved.context || {}) },
    disabledSources: Array.isArray(saved.disabledSources) ? saved.disabledSources : [],
    disabledRules: Array.isArray(saved.disabledRules) ? saved.disabledRules : [],
    drafts: saved.drafts && typeof saved.drafts === 'object' ? saved.drafts : {},
    attackSettings: saved.attackSettings || {},
    view: { tab: 'rules', group: 'all', status: 'all', query: '' },
  };
  let templates = validateTemplates({ schemaVersion: 1, templates: read(LEARNING_STORAGE_KEY, {}) }).templates;
  const sources = collectSources();
  let catalog = [];
  let result;
  let editorSource;
  let draftRules = [];
  let reuseDraft = true;
  let lastEditorButton;
  let storageWarning = '';
  const editor = document.createElement('dialog');
  editor.id = 'brEditor'; editor.className = 'br-editor'; editor.setAttribute('aria-labelledby', 'brEditorTitle');
  document.body.append(editor);
  root.classList.add('br-app');
  panel.querySelector('.calculator-tools').hidden = true;

  function collectSources() {
    const list = [];
    const add = (name, text, group, el) => {
      const seed = characterId === '260' && ROXY_CATALOG.find(x => x.group === group && x.name === name);
      list.push({ id: seed?.id || `${characterId}-${group}-${list.length + 1}`, name, text, group, originalElement: el });
    };
    document.querySelectorAll('#traits .trait').forEach(el => add(el.querySelector('h4').textContent.trim(), el.querySelector('p').textContent.trim(), 'traits', el));
    for (const section of ['exclusive-skills', 'common-skills']) {
      document.querySelectorAll(`#${section} tbody tr`).forEach(el => {
        const name = el.querySelector('.skill-name');
        const group = name.classList.contains('transcend') ? 'transcend' : section === 'exclusive-skills' ? 'exclusive' : 'common';
        add(name.textContent.trim(), el.querySelector('td:last-child').textContent.trim(), group, el);
      });
    }
    document.querySelectorAll('#equipment .equipment-card').forEach(el => {
      const dds = [...el.querySelectorAll('dd')];
      add(el.querySelector('h4').textContent.trim(), `最高属性：${dds[1].textContent.trim()}；最高效果：${dds[2].textContent.trim()}`, 'equipment', el);
    });
    return list;
  }

  function persist() {
    try {
      const { view, ...durable } = state;
      localStorage.setItem(stateKey, JSON.stringify(durable));
      localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(templates));
      storageWarning = '';
    } catch { storageWarning = '浏览器未能保存修改，请导出规则备份。'; }
  }
  function rebuildCatalog() {
    catalog = buildCatalog(sources.map(({ originalElement, ...s }) => s), ROXY_CATALOG, templates);
    catalog = catalog.map(s => {
      const local = state.drafts[sourceKey(s)];
      if (!local) return s;
      try { return { ...s, rules: clone(makeTemplate(s, local.rules).rules), manual: true }; }
      catch { delete state.drafts[sourceKey(s)]; return s; }
    });
  }
  function prepareContext() {
    const c = state.context;
    if (c.attack === 'magic') c.damageType = 'magical';
    c.equipmentIds = Array.isArray(c.equipmentIds) ? c.equipmentIds : [];
    if (c.weaponCount === 2) { c.equipmentIds = c.equipmentIds.filter(id => id !== 'roxy-robe'); c.robe = false; }
    if (c.weaponCount === 0) { c.equipmentIds = c.equipmentIds.filter(id => id !== 'roxy-staff'); c.staff = false; c.iceStaff = false; }
    if (c.equipmentIds.includes('roxy-staff')) { c.staff = true; c.iceStaff = true; }
    if (c.equipmentIds.includes('roxy-robe')) c.robe = true;
    if (c.iceStaff) c.staff = true;
    c.boss = true;
  }
  function calculate() {
    prepareContext();
    const overrides = {};
    state.disabledSources.forEach(id => { overrides[`source:${id}`] = { disabled: true }; });
    state.disabledRules.forEach(id => { overrides[id] = { disabled: true }; });
    result = evaluateCatalog(catalog, state.context, overrides);
    window.LC_EFFECT_CALCULATOR = { getReport: makeReport, characterId };
    window.dispatchEvent(new CustomEvent('lc:effect-rules-change', { detail: { characterId } }));
  }
  function option(value, label, current) { return `<option value="${esc(JSON.stringify(value))}"${JSON.stringify(value) === JSON.stringify(current) ? ' selected' : ''}>${esc(label)}</option>`; }
  function select(field, label, items, disabled = false) {
    return `<label class="br-field">${esc(label)}<select data-context="${field}"${disabled ? ' disabled' : ''}>${items.map(([v, l]) => option(v, l, state.context[field])).join('')}</select></label>`;
  }
  function checkbox(field, label, disabled = false) { return `<label class="br-check"><input type="checkbox" data-context="${field}"${state.context[field] ? ' checked' : ''}${disabled ? ' disabled' : ''}>${esc(label)}</label>`; }
  function renderShell() {
    prepareContext();
    const c = state.context;
    root.innerHTML = `
      <p class="br-intro">满强化角色 · 默认目标为 Boss。先核对各条效果是否生效，再与战斗读取报告比较。</p>
      <div class="br-context">
        ${select('attack', '攻击方式', ATTACKS.map(a => [a.id, characterId === '260' ? attackNames[a.id] : a.label]))}
        ${select('damageType', '伤害类型', [[null, '待确认'], ['physical', '物理'], ['magical', '魔法'], ['mixed', '混合 · 待确认']], c.attack === 'magic')}
        ${select('element', '攻击属性', elements)}
        ${select('weaponCount', '实际武器数量', [[null, '待确认'], [0, '未装备武器'], [1, '1件武器'], [2, '2件武器']])}
      </div>
      <div id="brContextNote" class="br-context-note"></div>
      <fieldset class="br-equipment"><legend>装备条件</legend>
        ${checkbox('staff', '装备法杖', c.equipmentIds.includes('roxy-staff') || c.weaponCount === 0)}
        ${checkbox('iceStaff', '装备冰属性法杖', c.equipmentIds.includes('roxy-staff') || c.weaponCount === 0)}
        ${checkbox('robe', '装备长袍', c.equipmentIds.includes('roxy-robe') || c.weaponCount === 2)}
        ${catalog.filter(s => s.group === 'equipment').map(s => `<label class="br-check"><input type="checkbox" data-equipment="${esc(s.id)}"${c.equipmentIds.includes(s.id) ? ' checked' : ''}${s.id === 'roxy-robe' && c.weaponCount === 2 ? ' disabled' : ''}>${esc(s.name)}（最高强化）</label>`).join('')}
      </fieldset>
      <p class="br-muted">专属装备分别勾选后才计入；双武器会取消自身长袍和专属衣服。装备条件不等于二刀流已生效。</p>
      <details class="br-conditions"><summary>战斗条件与魔法类别</summary><div class="br-condition-grid">
        ${select('magicFamily', '魔法类别', [['normal', '一般魔法'], ['science', '科学'], ['sword', '圣剑'], ['other', '其他特殊类型'], [null, '待确认']], c.attack !== 'magic')}
        ${select('chainStacks', '法术联结层数', [[0, '未叠加'], [1, '1层'], [2, '2层'], [3, '3层'], [4, '4层'], [5, '5层（最高）']])}
        ${select('penetration', '本次贯导是否触发', [[null, '未知'], [false, '未触发'], [true, '已触发']])}
        ${checkbox('fullHp', 'HP全满')}${checkbox('critical', '本次为暴击')}${checkbox('weakness', '命中弱点属性')}
        ${checkbox('resonance', '我方正在发动不可叠加魔法')}${checkbox('alive', '自身存活')}
        ${checkbox('killerBuff', '指导者：特攻上限增益生效')}${checkbox('bossWaveBuff', '指导者：Boss波次增益生效')}
        ${select('lowHp', '当前是否濒死', [[null, '待确认'], [false, '否'], [true, '是']])}
        ${select('firstLowHp', '本次是否首次进入濒死', [[null, '待确认'], [false, '否'], [true, '是']])}
        ${select('mpEnough', '自动治疗所需MP是否足够', [[null, '待确认'], [false, '否'], [true, '是']])}
      </div></details>
      <div id="brWarnings"></div>
      <div id="brStats" class="br-stats" aria-live="polite"></div>
      <div class="br-toolbar">
        <button class="br-button" data-action="report">导出判定报告</button>
        <button class="br-button" data-action="export-rules">导出学习规则</button>
        <button class="br-button" data-action="import-rules">导入学习规则</button>
        <button class="br-button" data-action="restore-enabled">恢复停用条目</button>
      </div>
      <p id="brLearnedNote" class="br-muted"></p>
      <div class="br-tabs" role="group" aria-label="显示方式">
        <button class="br-button" data-tab="rules" aria-pressed="${state.view.tab === 'rules'}">按技能查看拆分</button>
        <button class="br-button" data-tab="effects" aria-pressed="${state.view.tab === 'effects'}">当前生效效果</button>
      </div>
      <div class="br-filterbar"><input id="brSearch" type="search" aria-label="搜索技能或词条" placeholder="搜索技能、效果或原文" value="${esc(state.view.query)}">
        <select id="brGroupFilter" aria-label="来源筛选">${[['all', '全部来源'], ...Object.entries(groups)].map(([v, l]) => `<option value="${v}"${state.view.group === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <select id="brStatusFilter" aria-label="生效状态筛选">${[['all', '全部状态'], ...Object.entries(statuses), ['untested', '结算待测试']].map(([v, l]) => `<option value="${v}"${state.view.status === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div id="brResults"></div><p id="brMessage" class="br-notice" role="status" hidden></p>
      <input id="brImportFile" type="file" accept="application/json,.json" hidden>
    `;
    renderResults();
  }
  function visibleRows() {
    const v = state.view;
    return result.rows.filter(r => (v.group === 'all' || v.group === r.group)
      && (v.status === 'all' || (v.status === 'untested' ? r.rule.verification === 'untested' && r.status === 'active' : r.status === v.status))
      && (!v.query || `${r.sourceName} ${r.sourceText} ${r.rule.part} ${r.rule.effects.map(formatEffect).join(' ')}`.toLowerCase().includes(v.query.toLowerCase())));
  }
  function renderResults() {
    calculate();
    const active = result.rows.filter(r => r.status === 'active');
    const pending = result.rows.filter(r => r.status === 'pending');
    const untested = active.filter(r => r.rule.verification === 'untested');
    root.querySelector('#brStats').innerHTML = [['当前生效', active.length], ['待确认', pending.length], ['结算待测试', untested.length]].map(([l, n]) => `<div><span>${l}</span><strong>${n}</strong></div>`).join('');
    const c = result.context;
    const chain = [characterId === '260' ? attackNames[c.attack] : ATTACKS.find(a => a.id === c.attack)?.label, c.element == null ? '属性待确认' : elements.find(e => e[0] === c.element)?.[1] + '属性', 'Boss'];
    if (c.attack === 'magic' && c.element === 'ice') chain.push('同时满足「魔法」「冰属性」「冰魔法」条件');
    chain.push(result.killer === true ? '对Boss特攻成立' : result.killer === null ? '特攻状态待确认' : '当前未触发特攻');
    root.querySelector('#brContextNote').textContent = chain.filter(Boolean).join(' · ');
    const warnings = [...new Set((result.warnings || []).map(w => typeof w === 'string' ? w : w.message || '存在待验证规则'))];
    if (characterId === '260' && ['s1', 's2', 's3', 'ultimate'].includes(c.attack)) warnings.unshift('该招式的特殊结算尚未完成实测。参照法强与魔抗的规则单独列出，不能据此将伤害类型改为魔法。');
    if (c.damageType == null || c.damageType === 'mixed') warnings.unshift('伤害类型尚未确认：依赖物理／魔法类型的词条会保留待确认。');
    if (c.weaponCount === 2) warnings.push('已按两件武器检查装备条件；二刀流的适用攻击与每段倍率需另行确认，本页不会自动翻倍。');
    if (storageWarning) warnings.push(storageWarning);
    root.querySelector('#brWarnings').innerHTML = [...new Set(warnings)].map(w => `<p class="br-notice is-warning">${esc(w)}</p>`).join('');
    root.querySelector('#brLearnedNote').textContent = `已保存 ${Object.keys(templates).length} 条可复用拆分。修正保存在当前浏览器，导出规则可备份或迁移。`;
    const rows = visibleRows();
    const target = root.querySelector('#brResults');
    if (state.view.tab === 'effects') {
      const buckets = new Map();
      rows.filter(r => r.status === 'active').forEach(r => r.rule.effects.forEach(e => {
        if (!buckets.has(e.type)) buckets.set(e.type, []);
        buckets.get(e.type).push({ r, e });
      }));
      target.innerHTML = '<p class="br-help">以下是匹配当前条件的效果条目。不同来源的百分比尚不直接合并；最终伤害与上限需按结算顺序计算。</p>' + [...buckets].map(([type, items]) => `<section class="br-summary-group"><h3>${esc(types[type] || type)}</h3><ul>${items.map(({r,e}) => `<li><strong>${esc(formatEffect(e))}</strong><span>${esc(r.sourceName)}${r.rule.verification === 'untested' ? ' · 结算待测试' : ''}</span></li>`).join('')}</ul></section>`).join('');
      if (!buckets.size) target.innerHTML += '<p class="br-empty">当前筛选下没有已确认生效的效果。</p>';
      return;
    }
    const bySource = new Map();
    rows.forEach(r => { if (!bySource.has(r.sourceId)) bySource.set(r.sourceId, []); bySource.get(r.sourceId).push(r); });
    target.innerHTML = [...bySource].map(([id, rs]) => {
      const s = catalog.find(x => x.id === id);
      const total = result.rows.filter(r => r.sourceId === id);
      return `<article class="br-source" data-source="${esc(id)}"><div class="br-source-header">
        <div><h3>${s.group !== 'equipment' ? `<label><input type="checkbox" data-source-enabled="${esc(id)}"${state.disabledSources.includes(id) ? '' : ' checked'}> ${esc(s.name)}</label>` : esc(s.name)}</h3><small>${groups[s.group]} · ${total.filter(r => r.status === 'active').length}/${total.length} 条生效${s.learned || s.manual ? ' · 已保存修正' : ''}</small></div>
        <button class="br-button" data-edit-source="${esc(id)}">编辑拆分</button></div>
        <details class="br-source-original"><summary>完整原文</summary><p>${esc(s.text)}</p></details>
        ${rs.map(r => `<section class="br-rule" data-rule="${esc(r.rule.id)}"><div class="br-rule-head"><strong>${esc(r.rule.part || '独立效果')}</strong><span class="br-badge is-${r.status}">${statuses[r.status]}</span>${r.rule.verification === 'untested' ? '<span class="br-badge is-untested">结算待测试</span>' : ''}</div>
          <ul class="br-effects">${r.rule.effects.map(e => `<li>${esc(formatEffect(e))}</li>`).join('') || '<li>尚未确定效果，请编辑拆分。</li>'}</ul>
          <p class="br-reason">${esc(r.reasons.join('；'))}</p>
          <p class="br-muted">条件：${esc(r.rule.conditions.length ? r.rule.conditions.map(describeCondition).join('；') : '无额外条件')}</p>
          ${r.rule.note ? `<p class="br-help">${esc(r.rule.note)}</p>` : ''}
          <details class="br-source-original"><summary>对应原句</summary><p>${esc(r.rule.text || s.text)}</p></details>
          <div class="br-rule-actions"><button class="br-button" data-rule-toggle="${esc(r.rule.id)}">${state.disabledRules.includes(r.rule.id) ? '重新启用' : '暂不计入'}</button></div>
        </section>`).join('')}
      </article>`;
    }).join('') || '<p class="br-empty">没有符合筛选条件的条目。</p>';
  }

  function notify(message, error = false) {
    const el = root.querySelector('#brMessage'); el.hidden = false; el.textContent = message; el.classList.toggle('is-error', error);
    el.scrollIntoView({ block: 'nearest' });
  }
  function makeReport() {
    return { schemaVersion: 1, kind: 'last-cloudia-effect-report', characterId, characterName, createdAt: new Date().toISOString(), scope: '技能效果与条件判定，非最终伤害', context: result.context, killer: result.killer, warnings: result.warnings,
      rows: result.rows.map(r => ({ sourceId: r.sourceId, sourceName: r.sourceName, group: r.group, sourceText: r.sourceText, status: r.status, reasons: r.reasons, rule: clone(r.rule) })) };
  }
  function download(name, value) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  root.addEventListener('input', e => {
    if (e.target.id === 'brSearch') { state.view.query = e.target.value; renderResults(); }
  });
  root.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.context) {
      const field = el.dataset.context;
      const value = el.type === 'checkbox' ? el.checked : JSON.parse(el.value);
      if (field === 'attack') {
        state.attackSettings[state.context.attack] = { damageType: state.context.damageType, element: state.context.element };
        Object.assign(state.context, state.attackSettings[value] || { damageType: value === 'magic' ? 'magical' : null, element: value === 'normal' ? null : characterId === '260' ? 'ice' : null });
      }
      state.context[field] = value;
      if (field === 'staff' && !value) state.context.iceStaff = false;
      if (state.context.attack === 'magic') state.context.damageType = 'magical';
      prepareContext(); persist(); renderShell();
    } else if (el.dataset.equipment) {
      const id = el.dataset.equipment;
      state.context.equipmentIds = state.context.equipmentIds.filter(x => x !== id);
      if (el.checked) {
        state.context.equipmentIds.push(id);
        if (id === 'roxy-staff' && !state.context.weaponCount) state.context.weaponCount = 1;
      } else {
        if (id === 'roxy-staff') { state.context.staff = false; state.context.iceStaff = false; }
        if (id === 'roxy-robe') state.context.robe = false;
      }
      prepareContext(); persist(); renderShell();
    } else if (el.dataset.sourceEnabled) {
      state.disabledSources = state.disabledSources.filter(x => x !== el.dataset.sourceEnabled);
      if (!el.checked) state.disabledSources.push(el.dataset.sourceEnabled);
      persist(); renderResults();
    } else if (el.id === 'brGroupFilter' || el.id === 'brStatusFilter') {
      state.view[el.id === 'brGroupFilter' ? 'group' : 'status'] = el.value; renderResults();
    } else if (el.id === 'brImportFile' && el.files[0]) {
      try {
        if (el.files[0].size > 2_000_000) throw new Error('文件过大，请选择导出的规则文件。');
        const imported = validateTemplates(JSON.parse(await el.files[0].text()));
        if (imported.errors.length) throw new Error(imported.errors.slice(0, 3).join('；'));
        const count = Object.keys(imported.templates).length;
        if (!count) throw new Error('文件中没有可导入的规则。');
        templates = { ...templates, ...imported.templates };
        for (const key of Object.keys(imported.templates)) delete state.drafts[key];
        persist(); rebuildCatalog(); renderShell(); notify(`已导入 ${count} 条拆分；仅完整描述相同的技能会自动复用。`);
      } catch (err) { notify(`导入失败：${err.message}`, true); }
      el.value = '';
    }
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { state.view.tab = b.dataset.tab; renderShell(); }
    else if (b.dataset.editSource) openEditor(b.dataset.editSource, b);
    else if (b.dataset.ruleToggle) {
      const id = b.dataset.ruleToggle;
      state.disabledRules = state.disabledRules.includes(id) ? state.disabledRules.filter(x => x !== id) : [...state.disabledRules, id];
      persist(); renderResults();
    } else if (b.dataset.action === 'report') download(`LastCloudia-${characterId}-EffectReport.json`, makeReport());
    else if (b.dataset.action === 'export-rules') download('LastCloudia-LearnedRules.json', { schemaVersion: 1, templates });
    else if (b.dataset.action === 'import-rules') root.querySelector('#brImportFile').click();
    else if (b.dataset.action === 'restore-enabled') { state.disabledSources = []; state.disabledRules = []; persist(); renderResults(); }
  });

  function openEditor(id, button) {
    editorSource = catalog.find(s => s.id === id); if (!editorSource) return;
    draftRules = clone(editorSource.rules); lastEditorButton = button; reuseDraft = true;
    renderEditor(); editor.showModal();
  }
  function editorOption(value, label, current) { return `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`; }
  function renderCondition(c, ri, ci) {
    const field = CONDITION_FIELDS[c.field];
    const opts = (field?.options || []).filter(o => o.value !== null);
    const multi = c.op === 'in' || c.op === 'notIn';
    const values = multi ? (Array.isArray(c.value) ? c.value : [c.value]) : [c.value];
    const input = opts.length && c.op !== 'gte'
      ? `<select data-cond-value="${ri}:${ci}"${multi ? ' multiple size="3"' : ''} aria-label="条件值">${opts.map(o => `<option value="${esc(JSON.stringify(o.value))}"${values.some(v => JSON.stringify(v) === JSON.stringify(o.value)) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
      : `<input data-cond-number="${ri}:${ci}" type="number" value="${esc(Number(c.value) || 0)}" aria-label="条件数值">`;
    const ops = [['eq', '等于'], ['in', '符合任一种'], ['notIn', '排除这些']];
    if (['weaponCount', 'chainStacks'].includes(c.field)) ops.push(['gte', '至少']);
    return `<div class="br-edit-condition"><select data-cond-field="${ri}:${ci}" aria-label="条件项目">${Object.entries(CONDITION_FIELDS).map(([k, f]) => editorOption(k, f.label, c.field)).join('')}</select><select data-cond-op="${ri}:${ci}" aria-label="条件关系">${ops.map(([k,l]) => editorOption(k,l,c.op)).join('')}</select>${input}<button type="button" class="br-button" data-remove-cond="${ri}:${ci}" aria-label="删除条件">删除</button></div>`;
  }
  function renderEffect(e, ri, ei) {
    return `<div class="br-edit-effect"><label>效果类型<select data-effect="${ri}:${ei}:type">${Object.entries(types).map(([k,l]) => editorOption(k,l,e.type)).join('')}</select></label><label>作用对象<input data-effect="${ri}:${ei}:target" value="${esc(e.target)}" placeholder="如法强、冰属性伤害"></label><label>数值／参照<input data-effect="${ri}:${ei}:value" value="${esc(e.value)}" placeholder="如50或魔抗"></label><label>单位<select data-effect="${ri}:${ei}:unit">${[['%', '%'], ['', '无单位／固定值'], ['×', '倍率'], ['倍', '倍数']].map(([k,l]) => editorOption(k,l,e.unit || '')).join('')}</select></label>${e.type === 'hit' ? `<label>每段倍率<input data-effect="${ri}:${ei}:secondary" type="number" min="0" step="0.01" value="${esc(e.secondary ?? 0.6)}"></label>` : ''}<button class="br-button" type="button" data-remove-effect="${ri}:${ei}">删除效果</button><label class="br-effect-detail">补充说明<input data-effect="${ri}:${ei}:detail" value="${esc(e.detail || '')}"></label></div>`;
  }
  function renderEditor() {
    editor.innerHTML = `<header><div><small>人工确认 · ${esc(groups[editorSource.group])}</small><h2 id="brEditorTitle">${esc(editorSource.name)} · 编辑拆分</h2></div><button class="br-button" type="button" data-editor-close aria-label="关闭编辑">×</button></header>
      <div class="br-editor-body"><details open class="br-source-original"><summary>原始完整描述</summary><p>${esc(editorSource.text)}</p></details><p class="br-help">每部分独立判断；同一部分的条件必须同时满足。“符合任一种”可选多个值。无法确认的部分保留待确认，不会计入生效列表。</p>
      <div id="brEditRules">${draftRules.map((r, i) => `<fieldset class="br-edit-rule"><legend>第 ${i + 1} 部分</legend><div class="br-edit-grid">
        <label class="br-field">部分名称<input data-rule-edit="${i}:part" value="${esc(r.part)}"></label>
        <label class="br-field">判断状态<select data-rule-edit="${i}:review">${editorOption('pending','待确认',r.review)}${editorOption('ready','描述已确认',r.review)}</select></label>
        <label class="br-field">结算状态<select data-rule-edit="${i}:verification">${editorOption('description','按描述判定效果',r.verification)}${editorOption('untested','特殊结算待实测',r.verification)}</select></label></div>
        <label class="br-field">对应原句<textarea data-rule-edit="${i}:text">${esc(r.text)}</textarea></label>
        <p class="br-inline"><strong>生效条件</strong><button class="br-button" type="button" data-add-cond="${i}">添加条件</button></p><div class="br-edit-list">${r.conditions.map((c,j) => renderCondition(c,i,j)).join('') || '<p class="br-muted">无额外条件。只有确认常驻时才保留为空。</p>'}</div>
        <p class="br-inline"><strong>效果</strong><button class="br-button" type="button" data-add-effect="${i}">添加效果</button></p><div class="br-edit-list">${r.effects.map((e,j) => renderEffect(e,i,j)).join('')}</div>
        <label class="br-field">备注<input data-rule-edit="${i}:note" value="${esc(r.note || '')}"></label>
        <button class="br-button" type="button" data-remove-rule="${i}">删除这部分</button></fieldset>`).join('')}</div>
      <button class="br-button" type="button" data-add-rule>再拆一部分</button><p class="br-help">拆分后的规则应覆盖完整原文；暂时不清楚的内容也请留为“待确认”。命中翻倍用“命中与分段”，特攻用“特攻触发”，不要改写成普通增伤百分比。</p>
      <label class="br-check"><input id="brSaveReusable" type="checkbox"${reuseDraft ? ' checked' : ''}>保存为通用规则，今后相同完整描述自动复用</label><p id="brEditError" class="br-notice is-error" hidden></p></div>
      <footer><button class="br-button" type="button" data-reset-source>恢复原始拆分</button><button class="br-button" type="button" data-editor-close>取消</button><button class="br-button is-primary" type="button" data-save-source>保存修改</button></footer>`;
  }
  editor.addEventListener('input', e => updateEditorValue(e.target, false));
  editor.addEventListener('change', e => updateEditorValue(e.target, true));
  function updateEditorValue(el, structural) {
    if (el.id === 'brSaveReusable') reuseDraft = el.checked;
    else if (el.dataset.ruleEdit) {
      const [i, key] = el.dataset.ruleEdit.split(':'); draftRules[i][key] = el.value;
    } else if (el.dataset.effect) {
      const [i,j,key] = el.dataset.effect.split(':');
      let value = el.value;
      if (key === 'value' && value.trim() !== '' && Number.isFinite(Number(value))) value = Number(value);
      if (key === 'secondary') value = Number(value);
      draftRules[i].effects[j][key] = value;
      if (key === 'type' && structural) renderEditor();
    } else if (el.dataset.condValue) {
      const [i,j] = el.dataset.condValue.split(':');
      draftRules[i].conditions[j].value = el.multiple ? [...el.selectedOptions].map(o => JSON.parse(o.value)) : JSON.parse(el.value);
    } else if (el.dataset.condNumber) {
      const [i,j] = el.dataset.condNumber.split(':'); draftRules[i].conditions[j].value = Number(el.value);
    } else if ((el.dataset.condField || el.dataset.condOp) && structural) {
      const [i,j] = (el.dataset.condField || el.dataset.condOp).split(':'); const c = draftRules[i].conditions[j];
      if (el.dataset.condField) {
        c.field = el.value; c.value = CONDITION_FIELDS[c.field].options?.find(o => o.value !== null)?.value ?? 0;
        if (c.op === 'gte' && !['weaponCount', 'chainStacks'].includes(c.field)) c.op = 'eq';
      }
      else c.op = el.value;
      if (c.op === 'in' || c.op === 'notIn') c.value = Array.isArray(c.value) ? c.value : [c.value];
      else if (Array.isArray(c.value)) c.value = c.value[0] ?? null;
      renderEditor();
    }
  }
  editor.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if ('editorClose' in d) { editor.close(); return; }
    if ('saveSource' in d) { saveSource(); return; }
    if ('resetSource' in d) {
      const original = buildCatalog([sources.find(s => s.id === editorSource.id)], ROXY_CATALOG, {})[0];
      draftRules = clone(original.rules); renderEditor(); return;
    }
    if ('addRule' in d) draftRules.push({ id: `${editorSource.id}-custom-${Date.now()}`, part: '新的独立效果', text: '', conditions: [], effects: [], review: 'pending', verification: 'description' });
    else if ('removeRule' in d) draftRules.splice(Number(d.removeRule), 1);
    else if ('addCond' in d) draftRules[Number(d.addCond)].conditions.push({ field: 'weaponCount', op: 'eq', value: 1 });
    else if ('removeCond' in d) { const [i,j] = d.removeCond.split(':'); draftRules[i].conditions.splice(Number(j), 1); }
    else if ('addEffect' in d) draftRules[Number(d.addEffect)].effects.push({ type: 'damage', target: '伤害', value: 0, unit: '%' });
    else if ('removeEffect' in d) { const [i,j] = d.removeEffect.split(':'); draftRules[i].effects.splice(Number(j), 1); }
    renderEditor();
  });
  function saveSource() {
    try {
      if (!draftRules.length) throw new Error('至少保留一部分；不清楚的原文可以设为待确认。');
      for (const r of draftRules) {
        if (!String(r.part ?? '').trim() || !r.text?.trim()) throw new Error('请填写各部分名称和对应原句。');
        if (r.review === 'ready' && !r.effects.length) throw new Error('已确认的部分至少需要一个效果。');
        for (const e of r.effects) {
          if (!e.target?.trim()) throw new Error('请填写效果的作用对象。');
          if (e.type === 'hit' && (!(Number(e.value) > 0) || !(Number(e.secondary) > 0))) throw new Error('命中与分段需要同时填写命中倍数和每段倍率。');
        }
      }
      const template = makeTemplate(editorSource, draftRules);
      const key = sourceKey(editorSource);
      if (reuseDraft) { templates[key] = template; delete state.drafts[key]; }
      else state.drafts[key] = { text: editorSource.text, rules: clone(template.rules) };
      state.disabledRules = state.disabledRules.filter(id => !editorSource.rules.some(r => r.id === id));
      persist(); rebuildCatalog(); renderResults(); editor.close(); notify('拆分已保存。当前条件已重新判断，待确认部分继续保留。');
    } catch (err) { const el = editor.querySelector('#brEditError'); el.hidden = false; el.textContent = err.message; }
  }
  editor.addEventListener('close', () => { if (lastEditorButton?.isConnected) lastEditorButton.focus(); else panel.querySelector('#bonusCalculatorClose').focus(); });
  editor.addEventListener('keydown', e => { if (e.key === 'Escape') e.stopPropagation(); });
  window.addEventListener('storage', e => {
    if (e.key === LEARNING_STORAGE_KEY) { templates = validateTemplates({ schemaVersion: 1, templates: read(LEARNING_STORAGE_KEY, {}) }).templates; rebuildCatalog(); renderResults(); }
  });
  rebuildCatalog(); renderShell();
  if (new URLSearchParams(location.search).get('calculator') === 'base') document.getElementById('bonusCalculatorOpen').click();
}
