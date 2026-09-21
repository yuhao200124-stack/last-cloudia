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
  const calculatorEffects = document.querySelector('#calculatorEffects');
  const calculatorDetails = document.querySelector('#calculatorDetails');
  const calculatorContextTitle = document.querySelector('#calculatorContextTitle');
  const calculatorBadge = document.querySelector('#calculatorBadge');
  const calculatorSkills = document.querySelector('#calculatorSkills');
  const calculatorTotal = document.querySelector('#calculatorTotal');
  const saveLoadoutButton = document.querySelector('#saveLoadout');
  const openSavedLoadoutsButton = document.querySelector('#openSavedLoadouts');
  const savedLoadoutCount = document.querySelector('#savedLoadoutCount');
  const saveLoadoutDialog = document.querySelector('#saveLoadoutDialog');
  const savedLoadoutsDialog = document.querySelector('#savedLoadoutsDialog');
  const loadoutNameInput = document.querySelector('#loadoutName');
  const loadoutNoteInput = document.querySelector('#loadoutNote');
  const confirmSaveLoadout = document.querySelector('#confirmSaveLoadout');
  const saveAsNewLoadout = document.querySelector('#saveAsNewLoadout');
  const closeSavedLoadouts = document.querySelector('#closeSavedLoadouts');
  const savedLoadoutsList = document.querySelector('#savedLoadoutsList');

  const savedSheet = localStorage.getItem('lc-sheet-table:sheet');
  const editStorageKey = 'lc-sheet-table:cell-edits-v1';
  let edits = {};
  try {
    edits = JSON.parse(localStorage.getItem(editStorageKey) || '{}');
  } catch { edits = {}; }
  const calculatorStorageKey = 'lc-sheet-table:sc-calculator-v1';
  const loadoutPlansStorageKey = 'lc-sheet-table:loadout-plans-v1';
  const characterLoadouts = {
    '260': {
      name: '洛琪希·米格路迪亚·格雷拉特',
      page: './character-260.html',
      skillIds: [
        '3ab5e4ec857b4879', 'f201c9d8e9ee87ed', '全部技能:all:30', '9146eb2670c69122',
        'cc874bcc3159e258', 'ccfbbcc9f91d8332', '2901b40ce3f38847', '351f8b7c824ec758',
        '726408324afe28b6', '3a0b205292a15907', '42656c3afdc8103a', '920fb55fe5cd8123',
      ],
    },
  };
  let calculatorState = { skillIds: [], characterFreeIds: [], characterId: '', currentPlanId: '', activeBreaks: [7, 12, 20], sortDirection: 'desc', detailsOpen: false, expandedBonusKey: '' };
  let loadoutPlans = [];
  let editingPlanId = '';
  let editingPlanMetadataOnly = false;
  let calculatorEffectsOpen = false;
  const expandedSkillEffects = new Set();
  try {
    const savedCalculator = JSON.parse(localStorage.getItem(calculatorStorageKey) || '{}');
    const savedBreaks = Array.isArray(savedCalculator.activeBreaks)
      ? savedCalculator.activeBreaks.map(Number).filter(value => [7, 12, 20].includes(value))
      : [7, 12, 20];
    calculatorState = {
      skillIds: Array.isArray(savedCalculator.skillIds) ? [...new Set(savedCalculator.skillIds.map(String))] : [],
      characterFreeIds: Array.isArray(savedCalculator.characterFreeIds) ? [...new Set(savedCalculator.characterFreeIds.map(String))] : [],
      characterId: typeof savedCalculator.characterId === 'string' ? savedCalculator.characterId : '',
      currentPlanId: typeof savedCalculator.currentPlanId === 'string' ? savedCalculator.currentPlanId : '',
      activeBreaks: [...new Set(savedBreaks)],
      sortDirection: savedCalculator.sortDirection === 'asc' ? 'asc' : 'desc',
      detailsOpen: false,
      expandedBonusKey: '',
    };
  } catch { calculatorState = { skillIds: [], characterFreeIds: [], characterId: '', currentPlanId: '', activeBreaks: [7, 12, 20], sortDirection: 'desc', detailsOpen: false, expandedBonusKey: '' }; }
  try {
    const storedPlans = JSON.parse(localStorage.getItem(loadoutPlansStorageKey) || '[]');
    loadoutPlans = Array.isArray(storedPlans) ? storedPlans.filter(plan => plan && typeof plan.id === 'string') : [];
  } catch { loadoutPlans = []; }
  const hashSheet = decodeURIComponent(location.hash.slice(1));
  let activeSheet = data.sheetOrder.includes(hashSheet)
    ? hashSheet
    : data.sheetOrder.includes(savedSheet) ? savedSheet : data.sheetOrder[0];
  let query = '';
  let openCalculatorOnLoad = false;

  const skillIndex = new Map();
  for (const sheetName of data.sheetOrder) {
    const sheet = data.sheets[sheetName];
    const rows = sheet.kind === 'all' ? sheet.rows : sheet.lanes.flatMap(lane => lane.rows);
    for (const row of rows) {
      if (!row.separator && !skillIndex.has(String(row.id))) skillIndex.set(String(row.id), row);
    }
  }
  calculatorState.skillIds = calculatorState.skillIds.filter(id => skillIndex.has(id));
  calculatorState.characterFreeIds = calculatorState.characterFreeIds.filter(id => skillIndex.has(id));

  const inboundCharacterId = new URLSearchParams(location.search).get('loadout');
  const inboundLoadout = characterLoadouts[inboundCharacterId];
  if (inboundLoadout) {
    const includedIds = inboundLoadout.skillIds.filter(id => skillIndex.has(id));
    calculatorState.skillIds = [...includedIds];
    calculatorState.characterFreeIds = [...includedIds];
    calculatorState.characterId = inboundCharacterId;
    calculatorState.currentPlanId = '';
    calculatorState.detailsOpen = false;
    calculatorState.expandedBonusKey = '';
    openCalculatorOnLoad = true;
    localStorage.setItem(calculatorStorageKey, JSON.stringify(calculatorState));
    history.replaceState(null, '', `${location.pathname}${location.hash}`);
  }

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

  const bonusMetricPattern = /(受到的?(?:敌人)?(?:物理|魔法|火|炎|冰|树|雷|光|暗|无属性)?(?:攻击)?伤害|(?:火|炎|冰|树|雷|光|暗|无属性)属性物理攻击(?:与|和)必杀伤害上限|物理攻击(?:与|和)必杀伤害上限|特技(?:与|和)必杀伤害上限|物理攻击(?:与|和)魔法攻击伤害上限|(?:火|炎|冰|树|雷|光|暗|无属性)属性(?:物理攻击|魔法攻击|攻击)?伤害上限|不可叠加魔法(?:的)?伤害上限|物理(?:攻击)?伤害上限|魔法(?:攻击)?伤害上限|特技伤害上限|(?:超级|超)?必杀技?伤害上限|反击伤害上限|特攻伤害上限|暴击伤害上限|HP恢复上限|伤害上限|(?:火|炎|冰|树|雷|光|暗|无属性)属性物理攻击(?:与|和)必杀伤害|物理攻击(?:与|和)必杀伤害|特技(?:与|和)必杀伤害|物理攻击(?:与|和)魔法攻击伤害|(?:火|炎|冰|树|雷|光|暗|无属性)属性(?:物理攻击|魔法攻击|攻击)?伤害|不可叠加魔法伤害|物理(?:攻击)?伤害|魔法(?:攻击)?伤害|普通攻击伤害|特技伤害|(?:超级|超)?必杀技?伤害|反击伤害|特攻伤害|暴击伤害|弱点伤害|受到的伤害|造成的伤害|伤害|攻击力|防御力|魔力|魔抗|HP上限|MP上限|暴击率|SCT恢复速度|SCT回复速度|Break值|治疗魔法威力|HP恢复量)([^。；，,+＋-]{0,16})([+＋-])\s*([\d,]+(?:\.\d+)?)\s*(%)?/g;

  function inferDamageMetric(effect, index, suffix) {
    const context = effect.slice(Math.max(0, index - 80), index);
    const isLimit = suffix.includes('上限');
    const end = isLimit ? '伤害上限' : '伤害';
    if (/物理攻击(?:与|和)必杀/.test(context)) return `物理/必杀${end}`;
    if (/特技(?:与|和)必杀/.test(context)) return `特技/必杀${end}`;
    if (/物理攻击(?:与|和)魔法攻击/.test(context)) return `物理/魔法${end}`;
    const attribute = context.match(/(火|炎|冰|树|雷|光|暗|无)属性[^，。；]{0,18}$/)?.[1];
    if (attribute) return `${attribute === '火' ? '炎' : attribute}属性${end}`;
    if (/物理攻击[^，。；]{0,24}$/.test(context)) return `物理${end}`;
    if (/魔法攻击[^，。；]{0,24}$/.test(context)) return `魔法${end}`;
    if (/特技[^，。；]{0,24}$/.test(context)) return `特技${end}`;
    if (/(?:超级|超)?必杀[^，。；]{0,24}$/.test(context)) return `必杀${end}`;
    if (/反击[^，。；]{0,24}$/.test(context)) return `反击${end}`;
    if (/特攻[^，。；]{0,24}$/.test(context)) return `特攻${end}`;
    return suffix;
  }

  function normalizeBonusMetric(raw, effect, index) {
    let label = raw.replace(/^受到的?敌人?/, '受到的').replaceAll('攻击伤害', '伤害').replaceAll('火属性', '炎属性');
    label = label.replace(/超级必杀技?|超必杀技?|必杀技/g, '必杀');
    label = label.replace('物理攻击与必杀', '物理/必杀').replace('物理攻击和必杀', '物理/必杀');
    label = label.replace('特技与必杀', '特技/必杀').replace('特技和必杀', '特技/必杀');
    label = label.replace('物理攻击与魔法攻击', '物理/魔法').replace('物理攻击和魔法攻击', '物理/魔法');
    label = label.replace(/^物理攻击/, '物理').replace(/^魔法攻击/, '魔法');
    if (label === '伤害' || label === '伤害上限') label = inferDamageMetric(effect, index, label);
    return label;
  }

  function summarizeBonuses(items) {
    const totals = new Map();
    for (const item of items) {
      const effect = rowValue(item.row, 'effect').replaceAll('＋', '+').replace(/\s+/g, ' ');
      bonusMetricPattern.lastIndex = 0;
      for (const match of effect.matchAll(bonusMetricPattern)) {
        const metric = normalizeBonusMetric(match[1], effect, match.index || 0);
        const unit = match[5] ? '%' : '';
        const value = Number(match[4].replaceAll(',', '')) * (match[3] === '-' ? -1 : 1);
        if (!Number.isFinite(value)) continue;
        const key = `${metric}|${unit}`;
        const current = totals.get(key) || { key, metric, unit, value: 0, count: 0, skills: [] };
        current.value += value;
        current.count += 1;
        if (!current.skills.some(skill => skill.id === item.id)) {
          current.skills.push({
            id: item.id,
            name: rowValue(item.row, 'name'),
            effect: rowValue(item.row, 'effect'),
          });
        }
        totals.set(key, current);
      }
    }
    return [...totals.values()];
  }

  function formatBonus(value, unit) {
    const sign = value > 0 ? '+' : '';
    const amount = unit ? formatSc(value) : Math.round(value).toLocaleString('zh-CN');
    return `${sign}${amount}${unit}`;
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

  function saveLoadoutPlans() {
    localStorage.setItem(loadoutPlansStorageKey, JSON.stringify(loadoutPlans));
  }

  function currentCharacterPlans() {
    const characterId = calculatorState.characterId || '';
    return loadoutPlans.filter(plan => (plan.characterId || '') === characterId);
  }

  function createPlanId() {
    return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function calculateSc() {
    const characterFreeIds = new Set(calculatorState.characterFreeIds);
    const items = calculatorState.skillIds
      .map(id => skillIndex.get(id))
      .filter(Boolean)
      .map(row => ({ id: String(row.id), row, sc: parseSc(rowValue(row, 'sc')), freeBy: characterFreeIds.has(String(row.id)) ? 'character' : 0 }));
    const used = new Set(items.filter(item => item.freeBy === 'character').map(item => item.id));
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
    const characterLoadout = characterLoadouts[calculatorState.characterId];
    const matchingPlans = currentCharacterPlans();
    const currentPlan = matchingPlans.find(plan => plan.id === calculatorState.currentPlanId);
    calculatorContextTitle.textContent = currentPlan?.name || (characterLoadout ? `配装 · ${characterLoadout.name}` : 'SC计算器');
    savedLoadoutCount.textContent = String(matchingPlans.length);
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
    calculatorDetails.classList.toggle('is-active', calculatorState.detailsOpen);
    calculatorDetails.setAttribute('aria-pressed', String(calculatorState.detailsOpen));
    calculatorEffects.classList.toggle('is-active', calculatorEffectsOpen);
    calculatorEffects.setAttribute('aria-pressed', String(calculatorEffectsOpen));
    const displayItems = [...result.items].sort((a, b) => {
      const aCharacterFree = a.freeBy === 'character';
      const bCharacterFree = b.freeBy === 'character';
      if (aCharacterFree !== bCharacterFree) return aCharacterFree ? 1 : -1;
      return descending ? b.sc - a.sc : a.sc - b.sc;
    });
    const bonuses = summarizeBonuses(result.items);
    calculatorSkills.innerHTML = calculatorState.detailsOpen
      ? (bonuses.length
        ? `<div class="bonus-summary">${bonuses.map(item => {
          const expanded = calculatorState.expandedBonusKey === item.key;
          return `<button class="bonus-row${expanded ? ' is-expanded' : ''}" type="button" data-bonus-key="${escapeHtml(item.key)}" aria-expanded="${expanded}" title="点击查看提供该效果的技能"><span>${escapeHtml(item.metric)}</span><strong>${escapeHtml(formatBonus(item.value, item.unit))}</strong></button>${expanded ? `<div class="bonus-sources">${item.skills.map(skill => `<article><strong>${escapeHtml(skill.name)}</strong><p>${escapeHtml(skill.effect)}</p></article>`).join('')}</div>` : ''}`;
        }).join('')}<p class="bonus-note">仅合计技能描述中的明确数值，技能发动条件仍需满足。</p></div>`
        : '<div class="calculator-empty">当前技能没有可合并的明确数值</div>')
      : displayItems.length
      ? displayItems.map(item => `<div class="calculator-skill${item.freeBy ? ' is-free' : ''}">
          <button class="calculator-skill-name" type="button" data-skill-effect="${escapeHtml(item.id)}" title="双击查看技能效果">${escapeHtml(rowValue(item.row, 'name'))}</button>
          <div class="calculator-skill-sc">${item.freeBy === 'character' ? `<strong>0 SC</strong><small>角色自带</small><del>原 ${formatSc(item.sc)} SC</del>` : item.freeBy ? `<strong>0 SC</strong><small>${item.freeBy} SC突破减免</small><del>原 ${formatSc(item.sc)} SC</del>` : `<strong>${formatSc(item.sc)} SC</strong>`}</div>
          <button type="button" data-remove-skill="${escapeHtml(item.id)}" aria-label="移除${escapeHtml(rowValue(item.row, 'name'))}" title="从计算器移除">×</button>
          ${calculatorEffectsOpen || expandedSkillEffects.has(item.id) ? `<p class="calculator-skill-effect">${escapeHtml(rowValue(item.row, 'effect'))}</p>` : ''}
        </div>`).join('')
      : '<div class="calculator-empty">点击技能右侧的“＋”添加技能</div>';
    calculatorTotal.textContent = `${formatSc(result.total)} SC`;
    calculatorBadge.textContent = `${formatSc(result.total)} SC`;
  }

  function calculatePlanTotal(plan) {
    const freeIds = new Set(Array.isArray(plan.characterFreeIds) ? plan.characterFreeIds.map(String) : []);
    const items = (Array.isArray(plan.skillIds) ? plan.skillIds : [])
      .map(id => skillIndex.get(String(id)))
      .filter(Boolean)
      .map(row => ({ id: String(row.id), sc: parseSc(rowValue(row, 'sc')), free: freeIds.has(String(row.id)) }));
    const used = new Set(items.filter(item => item.free).map(item => item.id));
    const breaks = Array.isArray(plan.activeBreaks) ? plan.activeBreaks.map(Number) : [];
    for (const threshold of [7, 12, 20]) {
      if (!breaks.includes(threshold)) continue;
      const eligible = items.filter(item => !used.has(item.id) && item.sc > 0 && item.sc <= threshold);
      if (!eligible.length) continue;
      const bestSc = Math.max(...eligible.map(item => item.sc));
      const chosen = eligible.find(item => item.sc === bestSc);
      used.add(chosen.id);
    }
    return items.reduce((sum, item) => sum + (used.has(item.id) ? 0 : item.sc), 0);
  }

  function openSaveDialog(planId = '', forceNew = false, metadataOnly = false) {
    const plan = !forceNew && planId ? currentCharacterPlans().find(item => item.id === planId) : null;
    editingPlanId = plan?.id || '';
    editingPlanMetadataOnly = Boolean(plan && metadataOnly);
    const characterName = characterLoadouts[calculatorState.characterId]?.name;
    loadoutNameInput.value = plan?.name || `${characterName || '我的'}配装方案`;
    loadoutNoteInput.value = plan?.note || '';
    confirmSaveLoadout.textContent = plan ? '保存修改' : '保存';
    saveAsNewLoadout.hidden = !plan || metadataOnly;
    saveLoadoutDialog.showModal();
    requestAnimationFrame(() => loadoutNameInput.select());
  }

  function persistCurrentPlan(asNew = false) {
    const name = loadoutNameInput.value.trim();
    if (!name) {
      loadoutNameInput.focus();
      return;
    }
    const now = new Date().toISOString();
    const existing = !asNew && editingPlanId ? loadoutPlans.find(plan => plan.id === editingPlanId) : null;
    const snapshot = editingPlanMetadataOnly && existing ? {
      ...existing,
      name,
      note: loadoutNoteInput.value.trim(),
      updatedAt: now,
    } : {
      id: existing?.id || createPlanId(),
      name,
      note: loadoutNoteInput.value.trim(),
      characterId: calculatorState.characterId,
      skillIds: [...calculatorState.skillIds],
      characterFreeIds: [...calculatorState.characterFreeIds],
      activeBreaks: [...calculatorState.activeBreaks],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const returnPage = !editingPlanMetadataOnly ? characterLoadouts[snapshot.characterId]?.page : '';
    if (existing) loadoutPlans = loadoutPlans.map(plan => plan.id === existing.id ? snapshot : plan);
    else loadoutPlans.unshift(snapshot);
    if (!editingPlanMetadataOnly || asNew) calculatorState.currentPlanId = snapshot.id;
    editingPlanId = snapshot.id;
    saveLoadoutPlans();
    saveCalculatorState();
    saveLoadoutDialog.close();
    renderCalculator();
    if (returnPage) location.href = `${returnPage}?plan=${encodeURIComponent(snapshot.id)}`;
  }

  function renderSavedLoadouts() {
    const matchingPlans = currentCharacterPlans();
    savedLoadoutCount.textContent = String(matchingPlans.length);
    savedLoadoutsList.innerHTML = matchingPlans.length
      ? matchingPlans.map(plan => {
        const characterName = characterLoadouts[plan.characterId]?.name;
        const skillCount = Array.isArray(plan.skillIds) ? plan.skillIds.filter(id => skillIndex.has(String(id))).length : 0;
        const updated = plan.updatedAt ? new Date(plan.updatedAt).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' }) : '';
        return `<article class="saved-loadout-card${plan.id === calculatorState.currentPlanId ? ' is-current' : ''}">
          <h3>${escapeHtml(plan.name || '未命名方案')}</h3>
          ${plan.note ? `<p>${escapeHtml(plan.note)}</p>` : ''}
          <div class="saved-loadout-meta"><span>${characterName ? escapeHtml(characterName) : '通用方案'}</span><span>${skillCount}个技能</span><span>${formatSc(calculatePlanTotal(plan))} SC</span>${updated ? `<span>${escapeHtml(updated)}</span>` : ''}</div>
          <div class="saved-loadout-actions">
            <button class="primary" type="button" data-load-plan="${escapeHtml(plan.id)}">载入</button>
            <button type="button" data-edit-plan="${escapeHtml(plan.id)}">改名与备注</button>
            <button class="danger" type="button" data-delete-plan="${escapeHtml(plan.id)}">删除</button>
          </div>
        </article>`;
      }).join('')
      : '<div class="saved-loadout-empty">还没有保存的配装方案</div>';
  }

  function loadSavedPlan(planId) {
    const plan = currentCharacterPlans().find(item => item.id === planId);
    if (!plan) return;
    calculatorState.skillIds = [...new Set((plan.skillIds || []).map(String))].filter(id => skillIndex.has(id));
    calculatorState.characterFreeIds = [...new Set((plan.characterFreeIds || []).map(String))].filter(id => skillIndex.has(id));
    calculatorState.characterId = typeof plan.characterId === 'string' ? plan.characterId : '';
    calculatorState.currentPlanId = plan.id;
    calculatorState.activeBreaks = [...new Set((plan.activeBreaks || []).map(Number).filter(value => [7, 12, 20].includes(value)))];
    calculatorState.detailsOpen = false;
    calculatorEffectsOpen = false;
    expandedSkillEffects.clear();
    calculatorState.expandedBonusKey = '';
    saveCalculatorState();
    savedLoadoutsDialog.close();
    render();
    setCalculatorOpen(true);
  }

  function setCalculatorOpen(open) {
    if (!open) {
      calculatorState.detailsOpen = false;
      calculatorEffectsOpen = false;
      expandedSkillEffects.clear();
      calculatorState.expandedBonusKey = '';
      saveCalculatorState();
      renderCalculator();
    }
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

  calculatorDetails.addEventListener('click', () => {
    calculatorState.detailsOpen = !calculatorState.detailsOpen;
    calculatorEffectsOpen = false;
    calculatorState.expandedBonusKey = '';
    saveCalculatorState();
    renderCalculator();
  });

  calculatorEffects.addEventListener('click', () => {
    calculatorEffectsOpen = !calculatorEffectsOpen;
    calculatorState.detailsOpen = false;
    calculatorState.expandedBonusKey = '';
    saveCalculatorState();
    renderCalculator();
  });

  saveLoadoutButton.addEventListener('click', () => openSaveDialog(calculatorState.currentPlanId));

  openSavedLoadoutsButton.addEventListener('click', () => {
    renderSavedLoadouts();
    savedLoadoutsDialog.showModal();
  });

  confirmSaveLoadout.addEventListener('click', () => persistCurrentPlan(false));
  saveAsNewLoadout.addEventListener('click', () => persistCurrentPlan(true));
  closeSavedLoadouts.addEventListener('click', () => savedLoadoutsDialog.close());

  savedLoadoutsList.addEventListener('click', event => {
    const loadButton = event.target.closest('[data-load-plan]');
    if (loadButton) {
      loadSavedPlan(String(loadButton.dataset.loadPlan));
      return;
    }
    const editButton = event.target.closest('[data-edit-plan]');
    if (editButton) {
      const planId = String(editButton.dataset.editPlan);
      savedLoadoutsDialog.close();
      openSaveDialog(planId, false, true);
      return;
    }
    const deleteButton = event.target.closest('[data-delete-plan]');
    if (deleteButton) {
      const planId = String(deleteButton.dataset.deletePlan);
      const plan = loadoutPlans.find(item => item.id === planId);
      if (!plan || !window.confirm(`删除方案“${plan.name}”？`)) return;
      loadoutPlans = loadoutPlans.filter(item => item.id !== planId);
      if (calculatorState.currentPlanId === planId) calculatorState.currentPlanId = '';
      saveLoadoutPlans();
      saveCalculatorState();
      renderSavedLoadouts();
      renderCalculator();
    }
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
    const bonusButton = event.target.closest('[data-bonus-key]');
    if (bonusButton) {
      const key = String(bonusButton.dataset.bonusKey);
      calculatorState.expandedBonusKey = calculatorState.expandedBonusKey === key ? '' : key;
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

  calculator.addEventListener('dblclick', event => {
    const nameButton = event.target.closest('[data-skill-effect]');
    if (!nameButton || calculatorState.detailsOpen) return;
    const id = String(nameButton.dataset.skillEffect);
    if (expandedSkillEffects.has(id)) expandedSkillEffects.delete(id);
    else expandedSkillEffects.add(id);
    renderCalculator();
  });

  document.addEventListener('pointerdown', event => {
    if (saveLoadoutDialog.open || savedLoadoutsDialog.open) return;
    if (!calculator.hidden && !calculator.contains(event.target) && !calculatorLauncher.contains(event.target)) {
      setCalculatorOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (saveLoadoutDialog.open || savedLoadoutsDialog.open) return;
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
  if (openCalculatorOnLoad) setCalculatorOpen(true);
  registerWebMcp();
})();
