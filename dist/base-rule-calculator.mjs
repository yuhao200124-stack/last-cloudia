import {STAT_CONDITIONS} from './stat-condition-fields.mjs?v=20260926-skill-coverage';
import {characterDefinition,characterContext,collectCharacterSources} from './character-template.mjs?v=20260928-game-names';
import {readCharacterProfile} from './entry-preparation.mjs?v=20260928-game-names';
import { DEFAULT_CONTEXT, ATTACKS, CONDITION_FIELDS, evaluateCatalog, formatEffect, describeCondition } from './effect-rule-engine.mjs?v=20260928-game-names';
import { buildCatalog, makeTemplate, sourceKey, validateTemplates, LEARNING_STORAGE_KEY } from './effect-rule-learning.mjs?v=20260928-game-names';
import { summarizeEffects } from './effect-totals.mjs';
import { ACCOUNT_BLESSING_CATALOG, ACCOUNT_BLESSING_META } from './account-blessings.mjs?v=20260924-fullpage';
import { mountAccountBlessings } from './account-blessings-panel.mjs?v=20260928-game-names';

mountAccountBlessings();

const panel = document.querySelector('#bonusCalculator[data-rule-calculator]');
if (panel) mount();

function mount() {
  const characterId = document.body.dataset.characterId;
  const definition=characterDefinition(characterId), profile=readCharacterProfile(document);
  const gear=definition.gear;
  const characterName = document.querySelector('.hero h2')?.textContent.trim() || '当前角色';
  const stateKey = `lc-effect-rules:character:${characterId}:v1`;
  const root = document.getElementById('bonusSummary');
  const esc = (x = '') => String(x ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const clone = x => JSON.parse(JSON.stringify(x));
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const groups = { traits: '个性', exclusive: '专属技能', common: '通用技能', transcend: '超越', equipment: '装备', specials:'招式效果', blessings: '账户加护' };
  const statuses = { active: '生效', inactive: '未生效', pending: '待确认', disabled: '未启用' };
  const types = { attackElement:'招式属性转换', stat: '面板属性', statBuff: '属性状态增益', equipmentStat: '装备属性', damage: '伤害增加', cap: '伤害上限', killer: '特攻触发', killerPower:'特攻威力修正', hit: '命中与分段', statReference: '攻击与防御参照', defenseReference: '防御参照修正', critRate: '暴击率', critPermission: '暴击资格', defense: '防御与减伤', recovery: '回复', castSpeed: '咏唱速度', utility: '其他效果' };
  const attackNames = Object.fromEntries(ATTACKS.map(a=>[a.id,profile.moves.find(m=>m.id===a.id)?.name||a.label]));
  const elements = [[null, '待确认'], ['none', '无'], ['fire', '火'], ['ice', '冰'], ['earth', '树'], ['thunder', '雷'], ['light', '光'], ['dark', '暗']];
  const saved = read(stateKey, {});
  const state = {
    context: { ...characterContext(characterId), ...(saved.context || {}) },
    disabledSources: Array.isArray(saved.disabledSources) ? saved.disabledSources : [],
    disabledRules: Array.isArray(saved.disabledRules) ? saved.disabledRules : [],
    drafts: saved.drafts && typeof saved.drafts === 'object' ? saved.drafts : {},
    attackSettings: saved.attackSettings || {},
    view: { page: 'totals', expandedMetrics: new Set() },
  };
  let templates = validateTemplates({ schemaVersion: 1, templates: read(LEARNING_STORAGE_KEY, {}) }).templates;
  const sources = collectSources();
  const auditStorageKey = `lc-effect-audit:character:${characterId}:v1`;
  let auditedSources = readAuditMarks();
  const auditInputs = new Map();
  let catalog = [];
  let result;
  let metrics = [];
  let editorSource;
  let draftRules = [];
  let reuseDraft = true;
  let lastEditorButton;
  let lastEditorMetricId;
  let highlightedSource;
  let sourceHighlightTimer;
  let storageWarning = '';
  const editor = document.createElement('dialog');
  editor.id = 'brEditor'; editor.className = 'br-editor'; editor.setAttribute('aria-labelledby', 'brEditorTitle');
  document.body.append(editor);
  root.classList.add('br-app');
  panel.querySelector('.calculator-tools').hidden = true;

  function collectSources() { return collectCharacterSources(document,{withElements:true}); }

  function auditSourceKey(source) {
    return JSON.stringify([source.group, source.name, sourceKey(source)]);
  }
  function readAuditMarks() {
    const saved = read(auditStorageKey, []);
    return new Set(Array.isArray(saved) ? saved.filter(key => typeof key === 'string') : []);
  }
  function saveAuditMarks() {
    try { localStorage.setItem(auditStorageKey, JSON.stringify([...auditedSources])); }
    catch { notify('核对标记未能保存到浏览器。', true, false); }
  }
  function syncAuditMarks() {
    for (const source of sources) {
      const input = auditInputs.get(source.id);
      if (!input) continue;
      input.hidden = panel.hidden;
      input.checked = auditedSources.has(auditSourceKey(source));
    }
  }
  function setAudited(source, checked) {
    const key = auditSourceKey(source);
    if (checked) auditedSources.add(key); else auditedSources.delete(key);
    saveAuditMarks(); syncAuditMarks();
  }
  function installAuditControls() {
    for (const source of sources) {
      const target = source.originalElement;
      if (!target) continue;
      const holder = target.matches('tr') ? target.querySelector('td') : target.querySelector('h4');
      if (!holder) continue;
      let input = holder.querySelector('.br-source-audit');
      if (!input) {
        input = document.createElement('input');
        input.type = 'checkbox'; input.className = 'br-source-audit';
        holder.prepend(input);
      }
      input.dataset.auditSource = source.id;
      input.setAttribute('aria-label', `已核对收录：${source.name}`);
      input.title = `标记“${source.name}”已核对收录`;
      input.onchange = () => setAudited(source, input.checked);
      auditInputs.set(source.id, input);
    }
    let clear = panel.querySelector('[data-clear-audit]');
    if (!clear) {
      clear = document.createElement('button');
      clear.type = 'button'; clear.className = 'br-clear-audit'; clear.dataset.clearAudit = '';
      clear.textContent = '清除核对'; clear.title = '清除本角色全部核对标记';
      panel.querySelector('#bonusCalculatorClose').before(clear);
    }
    clear.onclick = () => { auditedSources.clear(); saveAuditMarks(); syncAuditMarks(); };
    // Visibility follows every panel close path, including Escape and mobile tab switches.
    panel.__lcAuditObserver?.disconnect();
    panel.__lcAuditObserver = new window.MutationObserver(syncAuditMarks);
    panel.__lcAuditObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    syncAuditMarks();
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
    catalog = buildCatalog(sources.map(({ originalElement, ...s }) => s), [...definition.catalog, ...ACCOUNT_BLESSING_CATALOG], templates);
    catalog = catalog.map(s => {
      const local = state.drafts[sourceKey(s)];
      if (!local) return s;
      try { return { ...s, rules: clone(makeTemplate(s, local.rules).rules), manual: true }; }
      catch { delete state.drafts[sourceKey(s)]; return s; }
    });
  }
  function prepareContext() {
    const c = state.context;
    if (typeof c.weaponCount === 'string' && /^[012]$/.test(c.weaponCount)) c.weaponCount = Number(c.weaponCount);
    if (![0, 1, 2].includes(c.weaponCount)) c.weaponCount = 1;
    c.lowHp = c.lowHp === true;
    if (c.lowHp) c.fullHp = false;
    // This view totals bonuses; it does not simulate individual random events.
    for (const field of ['critical', 'firstLowHp', 'mpEnough']) c[field] = false;
    c.penetration = c.penetration === true;
    c.alive = true;
    if (characterId === '260') { c.killerBuff = true; c.bossWaveBuff = true; }
    if (c.attack === 'magic') c.damageType = 'magical';
    c.equipmentIds = Array.isArray(c.equipmentIds) ? c.equipmentIds : [];
    const overflow=c.equipmentIds.filter(id=>gear[id]&&!gear[id].armor).slice(c.weaponCount);
    c.equipmentIds=c.equipmentIds.filter(id=>!overflow.includes(id));
    for(const id of overflow)if(!c.equipmentIds.some(other=>gear[other]?.field===gear[id].field))c[gear[id].field]=false;
    for(const [id,g] of Object.entries(gear)){
      if(g.armor&&c.weaponCount===2||!g.armor&&c.weaponCount===0){c.equipmentIds=c.equipmentIds.filter(x=>x!==id);c[g.field]=false;if(g.iceStaff)c.iceStaff=false;}
      if(c.equipmentIds.includes(id)){c[g.field]=true;if(g.iceStaff)c.iceStaff=true;if(g.armor)for(const f of ['robe','clothes','armor'])if(f!==g.field)c[f]=false;}
    }
    const knownWeapons=c.equipmentIds.flatMap(id=>gear[id]?.element?[{type:gear[id].field,element:gear[id].element}]:[]);
    if(Object.values(gear).some(g=>g.element))c.weaponDetails=knownWeapons;
    if (c.iceStaff) c.staff = true;
    const weaponFields=['staff','sword','axe','spear','hammer','bow','machine','claw'];
    const selected=weaponFields.filter(k=>c[k]);
    for(const field of selected.slice(c.weaponCount))c[field]=false;
    if(c.weaponCount===2){c.clothes=false;c.armor=false;}
    c.boss = true;
  }
  function calculate() {
    prepareContext();
    const overrides = {};
    state.disabledSources.forEach(id => { overrides[`source:${id}`] = { disabled: true }; });
    state.disabledRules.forEach(id => { overrides[id] = { disabled: true }; });
    result = evaluateCatalog(catalog, state.context, overrides);
    if(result.context.nativeElementAttacks?.includes(result.context.attack))state.context.element=result.context.element;
    // Keep an eligible conditional defense effect discoverable without counting
    // it as triggered. All other conditions, reviews and disabled flags still apply.
    const availableRows = [];
    if (!state.context.penetration) {
      const triggered = evaluateCatalog(catalog, { ...state.context, penetration: true }, overrides);
      for (const row of triggered.rows) {
        if (row.status !== 'active' || !row.rule.conditions.some(c => c.field === 'penetration' && c.op === 'eq' && c.value === true)) continue;
        const current = result.rows.find(r => r.sourceId === row.sourceId && r.rule.id === row.rule.id);
        if (current?.status !== 'inactive') continue;
        if (row.rule.effects.some(e => e.type === 'defenseReference')) availableRows.push(current);
      }
    }
    metrics = summarizeEffects(result, { availableRows });
    window.LC_EFFECT_CALCULATOR = { getReport: makeReport, getIndependentReport: makeIndependentReport, characterId };
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
      <div id="brPageNav" class="br-page-nav"></div>
      <div id="brConditionsPanel">
        <div class="br-context">
          ${select('attack', '攻击方式', ATTACKS.map(a => [a.id, attackNames[a.id]]))}
          ${select('damageType', '伤害类型', [[null, '待确认'], ['physical', '物理'], ['magical', '魔法'], ['mixed', '混合 · 待确认']], c.attack === 'magic')}
          ${select('element', '攻击属性', elements)}
          ${select('weaponCount', '实际武器数量', [[1, '1件武器'], [2, '2件武器'], [0, '未装备武器']])}
        </div>
        <fieldset class="br-equipment"><legend>装备条件</legend>
          ${Object.entries(gear).map(([id,g])=>checkbox(g.field,`装备${CONDITION_FIELDS[g.field].label.replace('装备','')}`,c.equipmentIds.includes(id)||(g.armor?c.weaponCount===2:c.weaponCount===0))).join('')}
          ${characterId==='260'?checkbox('iceStaff','装备冰属性法杖',c.equipmentIds.includes('roxy-staff')||c.weaponCount===0):''}
          ${catalog.filter(s => s.group === 'equipment').map(s => `<label class="br-check"><input type="checkbox" data-equipment="${esc(s.id)}"${c.equipmentIds.includes(s.id) ? ' checked' : ''}${gear[s.id]?.armor && c.weaponCount === 2 ? ' disabled' : ''}>${esc(s.name)}（最高强化）</label>`).join('')}
        </fieldset>
        <details class="br-equipment"><summary>其他装备与受击条件（加护）</summary>
          <div class="br-context">${[['staff','法杖'],['sword','剑'],['axe','斧'],['spear','枪'],['hammer','槌'],['bow','弓'],['machine','机械'],['claw','爪'],['robe','长袍'],['clothes','衣服'],['armor','铠甲']].filter(([f])=>!Object.values(gear).some(g=>g.field===f)).map(([f,l])=>checkbox(f,`装备${l}`, ['robe','clothes','armor'].includes(f)?c.weaponCount===2:c.weaponCount===0)).join('')}</div>
          <div class="br-context">${select('incomingElement','受到攻击的属性',CONDITION_FIELDS.incomingElement.options.map(o=>[o.value,o.label]))}${select('incomingAttackKind','受到攻击的类别',CONDITION_FIELDS.incomingAttackKind.options.map(o=>[o.value,o.label]))}</div>
        </details>
        <fieldset class="br-equipment"><legend>加成条件</legend>
          ${checkbox('accountBlessings', '计入账户加护')}
          ${definition.conditions.map(([field,label])=>checkbox(field,label)).join('')}
          ${checkbox('fullHp', 'HP全满')}${checkbox('weakness', '命中弱点')}
          ${checkbox('resonance', '重魔法（我方正在发动不可叠加魔法）')}${checkbox('lowHp', '濒死')}
          ${Object.entries(STAT_CONDITIONS).filter(([,condition])=>!condition.deferred).map(([field,{label}])=>checkbox(field,label)).join('')}
        </fieldset>
        ${c.attack === 'magic' ? `<div class="br-magic-family">${select('magicFamily', '魔法类别', [['normal', '一般魔法'], ['science', '科学'], ['sword', '圣剑'], ['other', '其他特殊类型'], [null, '待确认']])}</div>` : ''}
      </div>
      <p id="brContextNote" class="br-context-note"></p>
      <div id="brWarnings"></div>
      <div id="brResults" aria-live="polite"></div>
      <details class="br-maintenance"><summary>更多操作</summary>
        <div class="br-toolbar">
          <button class="br-button" data-action="manage">查看全部技能</button>
          <button class="br-button" data-action="restore-enabled">恢复停用加成</button>
          <button class="br-button" data-action="report">导出当前加成</button>
          <button class="br-button" data-action="export-rules">导出学习规则</button>
          <button class="br-button" data-action="import-rules">导入学习规则</button>
        </div><p id="brLearnedNote" class="br-muted"></p>
      </details>
      <p id="brMessage" class="br-notice" role="status" hidden></p>
      <input id="brImportFile" type="file" accept="application/json,.json" hidden>
    `;
    renderResults();
  }
  function numberText(value, unit = '%') {
    return `${value >= 0 ? '+' : ''}${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })}${unit}`;
  }
  function metricValue(item) {
    if (item.numeric) return numberText(item.total, item.unit);
    const included = item.contributions.filter(p => p.included !== false);
    const first = included[0]?.effect;
    if (!first) return '未触发 · 未计入';
    if (included.length > 1 && !['killer', 'critPermission'].includes(first.type)) return `${included.length}项效果 · 查看来源`;
    if (first.type === 'hit') return `命中×${first.value} · 每段×${first.secondary}`;
    if (first.type === 'killer') return '已触发';
    if (first.type === 'critPermission') return '可暴击';
    if (first.type === 'statReference') return `${first.target} / ${first.value}`;
    return [...new Set(included.map(x => formatEffect(x.effect)))].join('；');
  }
  function contributionCount(item) {
    const included = item.contributions.filter(p => p.included !== false && p.effect.value !== 0).length;
    const adjustable = item.contributions.filter(p => p.effect.value === 0 && p.rule.conditions.some(c => c.field === 'chainStacks'));
    const conditional = item.contributions.filter(p => p.included === false);
    return [included ? `${included}项计入` : '', ...adjustable.map(p => `${p.sourceName} · 未叠加，可调整`), ...conditional.map(p => `${p.sourceName} · 可勾选触发`)].filter(Boolean).join(' · ');
  }
  function contributionControls(p, source) {
    if (p.effect.type === 'defenseReference' && p.rule.conditions.some(c => c.field === 'penetration' && c.op === 'eq' && c.value === true)) {
      return `<div class="br-source-adjustment">${checkbox('penetration', '贯导触发')}<p class="br-muted">勾选后按触发时的效果统计；不勾选则不计入。触发概率未提供。</p></div>`;
    }
    if (!p.rule.conditions.some(c => c.field === 'chainStacks')) return '';
    const tiers = CONDITION_FIELDS.chainStacks.options.map(({value}) => {
      const rule = source.rules.find(r => r.conditions.some(c => c.field === 'chainStacks' && c.op === 'eq' && c.value === value));
      const effect = rule?.effects.find(e => e.type === p.effect.type && e.target === p.effect.target && e.unit === p.effect.unit);
      const prefix = value === 0 ? '不叠加' : value === 5 ? '第5次及以后' : `第${value}次`;
      return [value, `${prefix} · ${rule?.review === 'ready' && typeof effect?.value === 'number' ? numberText(effect.value, effect.unit) : '待确认'}`];
    });
    return `<div class="br-source-adjustment">${select('chainStacks', '连续使用相同攻击魔法', tiers)}</div>`;
  }
  // Show the description as the character page shows it (the game's own text); s.text may be the
  // earlier wording the rules are matched by.
  function sourceDescription(s) {
    return `<p class="br-full-effect">${esc(s.displayText || s.text)}</p>`;
  }
  function renderResults() {
    calculate();
    const c = result.context;
    const atHome = state.view.page === 'totals';
    root.querySelector('#brConditionsPanel').hidden = !atHome;
    root.querySelector('#brPageNav').innerHTML = atHome
      ? '<strong>当前生效加成</strong>'
      : `<button class="br-button" data-action="back-totals">← 返回加成合计</button><strong>${state.view.page === 'pending' ? '未确认的加成' : '全部技能'}</strong>`;
    const chain = [characterId === '260' ? attackNames[c.attack] : ATTACKS.find(a => a.id === c.attack)?.label,
      c.element == null ? '属性待确认' : elements.find(e => e[0] === c.element)?.[1] + '属性',
      `${c.weaponCount}件武器`, 'Boss'];
    if (result.killer === true) chain.push('对Boss特攻');
    root.querySelector('#brContextNote').textContent = chain.join(' · ');
    const pending = result.rows.filter(r => r.status === 'pending');
    const warnings = [];
    if (c.damageType == null || c.damageType === 'mixed') warnings.push('请确认伤害类型，相关加成暂不计入。');
    if (storageWarning) warnings.push(storageWarning);
    root.querySelector('#brWarnings').innerHTML = warnings.map(w => `<p class="br-notice is-warning">${esc(w)}</p>`).join('');
    root.querySelector('#brLearnedNote').textContent = `已保存 ${Object.keys(templates).length} 条可复用修正。修改保存在当前浏览器，可导出备份。`;
    const target = root.querySelector('#brResults');
    if (atHome) {
      const sections = ['属性加成', '伤害加成', '伤害上限', '状态加成', '暴击与咏唱', '本次攻击效果', '装备属性', '其他效果'];
      const sectionHtml = section => {
        const items = metrics.filter(m => m.section === section);
        if (!items.length) return '';
        return `<section class="br-summary-group br-totals-group"><h3>${section === '伤害加成' ? '伤害增加' : section}</h3>
          ${section === '状态加成' ? '<p class="br-total-note">例如 EX灵气，与上面的普通法强加成分开保留。</p>' : ''}
          <ul>${items.map(m => {
            const expanded = state.view.expandedMetrics.has(m.id);
            return `<li><button type="button" class="br-total-row" data-toggle-metric="${esc(m.id)}" aria-expanded="${expanded}" aria-controls="${esc(metricPanelId(m.id))}" title="点击展开或收起来源"><span><b>${esc(m.label)}</b><small>${esc(contributionCount(m))}</small></span><strong data-total-value="${esc(m.id)}">${esc(metricValue(m))}</strong><span class="br-row-chevron" aria-hidden="true">›</span></button><div class="br-metric-sources" id="${esc(metricPanelId(m.id))}" data-metric-sources="${esc(m.id)}"${expanded ? '' : ' hidden'}>${expanded ? renderContributions(m) : ''}</div></li>`;
          }).join('')}</ul></section>`;
      };
      target.innerHTML = `<p class="br-summary-hint">满强化 · 只统计加成。点击一项展开来源，再点一次收起；双击技能名定位原始出处。</p>`
        + sections.filter(s => !['装备属性', '其他效果'].includes(s)).map(sectionHtml).join('')
        + (metrics.some(m => ['装备属性', '其他效果'].includes(m.section)) ? `<details class="br-secondary-effects"><summary>装备属性与其他效果</summary>${sectionHtml('装备属性')}${sectionHtml('其他效果')}</details>` : '')
        + (pending.length ? `<button type="button" class="br-pending-link" data-action="pending">另有 ${pending.length} 项待确认，未计入合计 · 查看</button>` : '')
        + '<p class="br-total-note">冰伤、冰魔法、魔法、Boss增伤分别统计；这里显示词条合计，不把它们直接相加当作最终伤害倍率。</p>';
      return;
    }
    const pendingOnly = state.view.page === 'pending';
    const shown = pendingOnly ? catalog.filter(s => pending.some(r => r.sourceId === s.id)) : catalog;
    target.innerHTML = (pendingOnly ? '<p class="br-muted">这些内容没有混入已生效合计。可以进入修改补全。</p>' : '<p class="br-muted">这里用于管理技能。返回合计后只会计算已勾选且满足条件的效果。</p>') + shown.map(s => {
      const rows = result.rows.filter(r => r.sourceId === s.id);
      return `<article class="br-source" data-source="${esc(s.id)}"><div class="br-source-header"><h3>${s.group !== 'equipment' ? `<label><input type="checkbox" data-source-enabled="${esc(s.id)}"${state.disabledSources.includes(s.id) ? '' : ' checked'}>${esc(s.name)}</label>` : esc(s.name)}</h3><button class="br-button" data-edit-source="${esc(s.id)}">修改</button></div>${sourceDescription(s)}<div class="br-contribution-body">${rows.filter(r=>pendingOnly?r.status==='pending':r.status==='active').map(r=>`<p>${esc(r.rule.effects.map(formatEffect).join('；'))}</p>${pendingOnly?`<p class="br-muted">${esc(r.reasons.join('；'))}</p>`:''}`).join('') || '<p class="br-muted">当前未计入。</p>'}</div></article>`;
    }).join('');
  }
  function metricPanelId(id) { return `brMetric-${encodeURIComponent(id)}`; }
  function renderContributions(metric) {
    return metric.contributions.map(p => {
      const source = catalog.find(s => s.id === p.sourceId);
      const value = p.included === false ? '未触发 · 未计入' : metric.numeric ? numberText(p.effect.value, p.effect.unit) : formatEffect(p.effect);
      return `<article class="br-inline-source" data-source="${esc(p.sourceId)}"><div class="br-inline-source-header"><h4><button type="button" class="br-source-jump" data-jump-source="${esc(p.sourceId)}" title="双击定位到${esc(groups[p.group] || '原始出处')}：${esc(p.sourceName)}" aria-label="${esc(p.sourceName)}，双击或按回车定位原始出处">${esc(p.sourceName)}</button></h4><strong>${esc(value)}</strong><button type="button" class="br-button" data-edit-source="${esc(p.sourceId)}" data-focus-rule="${esc(p.ruleId)}">修改</button></div>
        ${contributionControls(p, source)}
        <div class="br-inline-description">${sourceDescription(source)}<details class="br-contribution-details"><summary>显示完整</summary><p><b>本项计入：</b>${esc(p.included === false ? '未触发，未计入' : formatEffect(p.effect))}</p><p class="br-muted">${esc(p.reasons.join('；'))}</p>${p.rule.note ? `<p class="br-muted">${esc(p.rule.note)}</p>` : ''}
        <button type="button" class="br-button" data-rule-toggle="${esc(p.ruleId)}">停用这一段效果</button>${p.rule.effects.length > 1 ? `<p class="br-muted">会一并停用本段的：${esc(p.rule.effects.map(formatEffect).join('；'))}</p>` : ''}</details></div></article>`;
    }).join('');
  }
  function toggleMetric(button) {
    const id = button.dataset.toggleMetric;
    const body = document.getElementById(button.getAttribute('aria-controls'));
    const metric = metrics.find(m => m.id === id);
    if (!body || !metric) return;
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    if (expanded) {
      state.view.expandedMetrics.add(id);
      if (!body.childElementCount) body.innerHTML = renderContributions(metric);
    } else state.view.expandedMetrics.delete(id);
    button.setAttribute('aria-expanded', String(expanded));
    body.hidden = !expanded;
  }
  function jumpToSource(id) {
    const source = sources.find(source => source.id === id);
    const target = source?.originalElement;
    if (!target?.isConnected) { notify('没有找到这项的原始出处。', true, false); return; }
    setAudited(source, true);
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    // Locate the original while keeping the calculator open and its state intact.
    window.requestAnimationFrame(() => {
      highlightedSource?.classList.remove('source-highlight', 'br-located-source');
      window.clearTimeout(sourceHighlightTimer);
      if (!target.hasAttribute('tabindex')) {
        target.tabIndex = -1;
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
      void target.offsetWidth;
      target.classList.add('source-highlight', 'br-located-source');
      highlightedSource = target;
      sourceHighlightTimer = window.setTimeout(() => {
        target.classList.remove('source-highlight', 'br-located-source');
        if (highlightedSource === target) highlightedSource = null;
      }, 2600);
    });
  }
  function metricButton(id) { return [...root.querySelectorAll('[data-toggle-metric]')].find(el => el.dataset.toggleMetric === id); }
  function notify(message, error = false, scroll = true) {
    const el = root.querySelector('#brMessage'); el.hidden = false; el.textContent = message; el.classList.toggle('is-error', error);
    if (scroll) el.scrollIntoView({ block: 'nearest' });
  }
  // The damage calculator must not follow this panel's checkboxes. It receives the
  // character's rules evaluated under the default context; its own switches
  // (专武, 满血, BOSS ...) decide the conditions from there.
  function makeIndependentReport() {
    const keep = { context: state.context, disabledSources: state.disabledSources, disabledRules: state.disabledRules, result };
    try {
      // Default: the character wears all of its exclusive gear (the damage page's 专武 switch starts on).
      const context = characterContext(characterId);
      context.equipmentIds = Object.keys(gear);
      for (const g of Object.values(gear)) { context[g.field] = true; if (g.iceStaff) context.iceStaff = true; }
      const weapons = Object.values(gear).filter(g => !g.armor).length;
      if (weapons) context.weaponCount = Math.min(2, weapons);
      state.context = context; state.disabledSources = []; state.disabledRules = [];
      prepareContext();
      result = evaluateCatalog(catalog, state.context, {});
      if (result.context.nativeElementAttacks?.includes(result.context.attack)) state.context.element = result.context.element;
      return makeReport();
    } finally {
      state.context = keep.context; state.disabledSources = keep.disabledSources; state.disabledRules = keep.disabledRules; result = keep.result;
    }
  }
  function makeReport() {
    return { schemaVersion: 1, characterTemplateRevision:1, mechanicsRevision: result.mechanicsRevision, kind: 'last-cloudia-effect-report', characterId, characterName, accountBlessings: ACCOUNT_BLESSING_META, createdAt: new Date().toISOString(), scope: '当前条件下的加成合计，非最终伤害', totals: clone(metrics), context: result.context, killer: result.killer, warnings: result.warnings,
      rows: result.rows.map(r => ({ sourceId: r.sourceId, sourceName: r.sourceName, group: r.group, sourceText: r.sourceText, status: r.status, reasons: r.reasons, rule: clone(r.rule) })) };
  }
  function download(name, value) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  root.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.context) {
      const scrollTop = panel.scrollTop;
      const metricId = el.closest('[data-metric-sources]')?.dataset.metricSources;
      const field = el.dataset.context;
      const value = el.type === 'checkbox' ? el.checked : JSON.parse(el.value);
      if (field === 'attack') {
        state.attackSettings[state.context.attack] = { damageType: state.context.damageType, element: state.context.element };
        Object.assign(state.context, state.attackSettings[value] || { damageType: value === 'magic' ? 'magical' : definition.moveDefaults?.damageType||null, element: value === 'normal' ? definition.context.element??null : definition.context.element??(characterId==='260'?'ice':null) });
      }
      state.context[field] = value;
      const weaponFields=['staff','sword','axe','spear','hammer','bow','machine','claw'];
      if(weaponFields.includes(field)&&value&&state.context.weaponCount===1){
        for(const key of weaponFields)if(key!==field)state.context[key]=false;
        if(field!=='staff')state.context.iceStaff=false;
        state.context.equipmentIds=state.context.equipmentIds.filter(id=>!gear[id]||gear[id].armor||gear[id].field===field);
      }
      if(['robe','clothes','armor'].includes(field)&&value){
        for(const key of ['robe','clothes','armor'])if(key!==field)state.context[key]=false;
        state.context.equipmentIds=state.context.equipmentIds.filter(id=>!gear[id]?.armor||gear[id].field===field);
      }
      if (field === 'fullHp' && value) state.context.lowHp = false;
      if (field === 'lowHp' && value) state.context.fullHp = false;
      if (field === 'staff' && !value) state.context.iceStaff = false;
      if (state.context.attack === 'magic') state.context.damageType = 'magical';
      prepareContext(); persist(); renderShell();
      const scope = metricId ? document.getElementById(metricPanelId(metricId)) : root;
      const replacement = [...(scope?.querySelectorAll('[data-context]') || [])].find(input => input.dataset.context === field);
      replacement?.focus({ preventScroll: true }); panel.scrollTop = scrollTop;
    } else if (el.dataset.equipment) {
      const id = el.dataset.equipment;
      state.context.equipmentIds = state.context.equipmentIds.filter(x => x !== id);
      if (el.checked) {
        state.context.equipmentIds.push(id);
        if (!gear[id]?.armor) state.context.weaponCount = Math.max(state.context.weaponCount||0,state.context.equipmentIds.filter(id=>gear[id]&&!gear[id].armor).length,1);
      } else {
        if(gear[id])state.context[gear[id].field]=false;
        if(gear[id]?.iceStaff)state.context.iceStaff=false;
      }
      prepareContext(); persist(); renderShell();
    } else if (el.dataset.sourceEnabled) {
      state.disabledSources = state.disabledSources.filter(x => x !== el.dataset.sourceEnabled);
      if (!el.checked) state.disabledSources.push(el.dataset.sourceEnabled);
      persist(); renderResults();
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
    if (b.dataset.jumpSource) {
      if (e.detail === 0 || e.pointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches) jumpToSource(b.dataset.jumpSource);
    }
    else if (b.dataset.toggleMetric) toggleMetric(b);
    else if (b.dataset.action === 'back-totals') { state.view.page = 'totals'; renderResults(); panel.scrollTop = 0; }
    else if (b.dataset.action === 'manage' || b.dataset.action === 'pending') { state.view.page = b.dataset.action === 'manage' ? 'skills' : 'pending'; renderResults(); panel.scrollTop = 0; }
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

  root.addEventListener('dblclick', e => {
    const name = e.target.closest('[data-jump-source]');
    if (name) { e.preventDefault(); jumpToSource(name.dataset.jumpSource); }
  });

  function openEditor(id, button) {
    editorSource = catalog.find(s => s.id === id); if (!editorSource) return;
    draftRules = clone(editorSource.rules); lastEditorButton = button; reuseDraft = true;
    lastEditorMetricId = button?.closest('[data-metric-sources]')?.dataset.metricSources;
    renderEditor(); editor.showModal();
    const focusRule = button?.dataset.focusRule;
    if (focusRule) { const i = draftRules.findIndex(r => r.id === focusRule); editor.querySelector(`[data-rule-edit="${i}:part"]`)?.scrollIntoView({block:'center'}); }
  }
  function editorOption(value, label, current) { return `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`; }
  function renderCondition(c, ri, ci) {
    const field = CONDITION_FIELDS[c.field];
    const opts = (field?.options || []).filter(o => o.value !== null);
    const multi = ['in','notIn','intersects'].includes(c.op);
    const values = multi ? (Array.isArray(c.value) ? c.value : [c.value]) : [c.value];
    const input = opts.length && c.op !== 'gte'
      ? `<select data-cond-value="${ri}:${ci}"${multi ? ' multiple size="3"' : ''} aria-label="条件值">${opts.map(o => `<option value="${esc(JSON.stringify(o.value))}"${values.some(v => JSON.stringify(v) === JSON.stringify(o.value)) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
      : `<input data-cond-number="${ri}:${ci}" type="number" value="${esc(Number(c.value) || 0)}" aria-label="条件数值">`;
    const ops = [['eq', '等于'], ['in', '符合任一种'], ['notIn', '排除这些']];
    if(field?.multiple)ops.push(['intersects','包含任一种']);
    if (['weaponCount', 'chainStacks'].includes(c.field)) ops.push(['gte', '至少']);
    return `<div class="br-edit-condition"><select data-cond-field="${ri}:${ci}" aria-label="条件项目">${Object.entries(CONDITION_FIELDS).map(([k, f]) => editorOption(k, f.label, c.field)).join('')}</select><select data-cond-op="${ri}:${ci}" aria-label="条件关系">${ops.map(([k,l]) => editorOption(k,l,c.op)).join('')}</select>${input}<button type="button" class="br-button" data-remove-cond="${ri}:${ci}" aria-label="删除条件">删除</button></div>`;
  }
  function renderEffect(e, ri, ei) {
    return `<div class="br-edit-effect"><label>效果类型<select data-effect="${ri}:${ei}:type">${Object.entries(types).map(([k,l]) => editorOption(k,l,e.type)).join('')}</select></label><label>作用对象<input data-effect="${ri}:${ei}:target" value="${esc(e.target)}" placeholder="如法强、冰属性伤害"></label><label>数值／参照<input data-effect="${ri}:${ei}:value" value="${esc(e.value)}" placeholder="如50或魔抗"></label><label>单位<select data-effect="${ri}:${ei}:unit">${[['%', '%'], ['', '无单位／固定值'], ['×', '倍率'], ['倍', '倍数']].map(([k,l]) => editorOption(k,l,e.unit || '')).join('')}</select></label>${e.type === 'hit' ? `<label>每段倍率<input data-effect="${ri}:${ei}:secondary" type="number" min="0" step="0.01" value="${esc(e.secondary ?? 0.6)}"></label>` : ''}<button class="br-button" type="button" data-remove-effect="${ri}:${ei}">删除效果</button><label class="br-effect-detail">补充说明<input data-effect="${ri}:${ei}:detail" value="${esc(e.detail || '')}"></label></div>`;
  }
  function renderEditor() {
    editor.innerHTML = `<header><div><small>当前生效加成　›　修改来源</small><h2 id="brEditorTitle">${esc(editorSource.name)} · 修改加成</h2></div><button class="br-button" type="button" data-editor-close aria-label="关闭编辑">×</button></header>
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
      if (['in','notIn','intersects'].includes(c.op)) c.value = Array.isArray(c.value) ? c.value : [c.value];
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
      const original = buildCatalog([sources.find(s => s.id === editorSource.id)], [...definition.catalog, ...ACCOUNT_BLESSING_CATALOG], {})[0];
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
      const scrollTop = panel.scrollTop;
      persist(); rebuildCatalog(); renderResults(); editor.close();
      panel.scrollTop = scrollTop; notify('修改已保存，当前加成合计已更新。', false, false);
    } catch (err) { const el = editor.querySelector('#brEditError'); el.hidden = false; el.textContent = err.message; }
  }
  editor.addEventListener('close', () => {
    const replacement = [...root.querySelectorAll('[data-edit-source]')].find(el => el.dataset.editSource === editorSource?.id && el.closest('[data-metric-sources]')?.dataset.metricSources === lastEditorMetricId);
    const target = lastEditorButton?.isConnected ? lastEditorButton : replacement || metricButton(lastEditorMetricId) || root.querySelector('[data-toggle-metric]') || panel.querySelector('#bonusCalculatorClose');
    target?.focus({ preventScroll: true });
  });
  editor.addEventListener('keydown', e => { if (e.key === 'Escape') e.stopPropagation(); });
  window.addEventListener('storage', e => {
    if (e.key === auditStorageKey) { auditedSources = readAuditMarks(); syncAuditMarks(); }
    if (e.key === LEARNING_STORAGE_KEY) { templates = validateTemplates({ schemaVersion: 1, templates: read(LEARNING_STORAGE_KEY, {}) }).templates; rebuildCatalog(); renderResults(); }
  });
  rebuildCatalog(); renderShell(); installAuditControls();
  if (new URLSearchParams(location.search).get('calculator') === 'base') document.getElementById('bonusCalculatorOpen').click();
}
