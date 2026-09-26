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
  const calculatorRatingSort = document.querySelector('#calculatorRatingSort');
  const calculatorRatingSortIcon = document.querySelector('#calculatorRatingSortIcon');
  const calculatorEffects = document.querySelector('#calculatorEffects');
  const calculatorDetails = document.querySelector('#calculatorDetails');
  const calculatorCharacterSelect = document.querySelector('#calculatorCharacterSelect');
  const calculatorBadge = document.querySelector('#calculatorBadge');
  const calculatorSkills = document.querySelector('#calculatorSkills');
  const calculatorTotal = document.querySelector('#calculatorTotal');
  const calculatorClear = document.querySelector('#calculatorClear');
  const calculatorRestore = document.querySelector('#calculatorRestore');
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
  const loadoutDraftTransferKey = 'lc-sheet-table:loadout-draft-v1';
  const characterLoadouts = {
    '259': {
      name: '艾莉丝·格雷拉特',
      page: './character-259.html',
      skillIds: [],
    },
    '245': {
      name: '龙王阿尔克',
      page: './character-245.html',
      skillIds: [
        'e73807e621f213b2', 'f201c9d8e9ee87ed', '全部技能:all:30', '9146eb2670c69122',
        '478822878a23edb4', '97d948f5e3717d10', 'ea3727ee373b623b', '2a62c41d8d3fb3d0',
        'f504f03347fe02ac', '28ccf85b5f31c394', '68bd1c7efd3638c0', 'b7297c3eb4e46bba',
      ],
    },
    '260': {
      name: '洛琪希',
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
  let calculatorSortMode = 'sc';
  let calculatorRatingDirection = 'desc';
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
  const embeddedLoadout = new URLSearchParams(location.search).get('embeddedLoadout') === '1' && window.parent !== window;
  const unifiedCatalogKey = 'lc-sheet-table:unified-character-skills-v1';
  let unifiedCatalog = {}, sourceBindings = {};
  const sourceGroupNames = {traits:'个性',equipment:'专武／装备',exclusive:'专属技能',common:'自带通用技能',transcend:'超越',blessings:'账户加护',readerGroup:'读取器加成',readerSupplement:'读取器补充',manual:'手动加成'};
  try { unifiedCatalog = JSON.parse(localStorage.getItem(unifiedCatalogKey) || '{}'); } catch {}
  const sourceNameKey = name => String(name || '').replace(/[\s·・]/g, '').replace(/III$|Ⅲ$/g,'3').replace(/II$|Ⅱ$/g,'2').replace(/IV$|Ⅳ$/g,'4').replace(/V$|Ⅴ$/g,'5').replace(/I$|Ⅰ$/g,'1')
    .replace('MP提升','法力提升').replace('特攻界限突破','特攻极限突破').replace('冰系超级增幅','冰魔法超阶增幅')
    .replace('冰属性暴击提升','冰霜暴击提升').replace('法术联结','魔法连锁').replace('巨型护盾','巨型护罩').replace(/([火冰树雷光暗无])属性攻击提升/,'$1攻击提升');
  function installCharacterSources(id, sources) {
    const bindings = {};
    for (const source of sources) {
      const candidates = [...skillIndex.values()].filter(row => !row.unifiedCharacter);
      // Keep existing character/source IDs stable across translated-name corrections.
      const skillSource = !source.group || ['common','exclusive','transcend'].includes(source.group);
      let matches = skillSource ? candidates.filter(row => sourceNameKey(row.bindingName || row.name) === sourceNameKey(source.name)) : [];
      if (skillSource && !matches.length) matches = candidates.filter(row => [row.name, ...(row.aliases || [])].some(name => sourceNameKey(name) === sourceNameKey(source.name)));
      const row = matches.length === 1 ? matches[0] : { id: `character:${id}:${source.sourceId}`, name: source.name, effect: source.text, sc: '0', sources: [], type: '角色技能', unifiedCharacter: id };
      skillIndex.set(String(row.id), row);
      (bindings[row.id] ||= []).push(source.sourceId);
    }
    sourceBindings[id] = bindings;
  }
  for (const [id, record] of Object.entries(unifiedCatalog)) if (Array.isArray(record.sources)) installCharacterSources(id, record.sources);
  calculatorState.skillIds = calculatorState.skillIds.filter(id => skillIndex.has(id));
  calculatorState.characterFreeIds = calculatorState.characterFreeIds.filter(id => skillIndex.has(id));

  const inboundParams = new URLSearchParams(location.search);
  const inboundPlanId = inboundParams.get('editPlan');
  const inboundPlan = loadoutPlans.find(plan => plan.id === inboundPlanId);
  let inboundDraft = null;
  if (inboundPlan && inboundParams.get('draft') === '1') {
    try {
      const draft = JSON.parse(sessionStorage.getItem(loadoutDraftTransferKey) || 'null');
      if (draft?.planId === inboundPlan.id && draft?.characterId === inboundPlan.characterId) inboundDraft = draft;
    } catch { inboundDraft = null; }
    sessionStorage.removeItem(loadoutDraftTransferKey);
  }
  const inboundPlanState = inboundDraft ? { ...inboundPlan, ...inboundDraft } : inboundPlan;
  const inboundCharacterId = inboundParams.get('loadout');
  const inboundLoadout = characterLoadouts[inboundCharacterId];
  if (inboundPlanState) {
    calculatorState.skillIds = [...new Set((inboundPlanState.skillIds || []).map(String))].filter(id => skillIndex.has(id));
    calculatorState.characterFreeIds = [...new Set((inboundPlanState.characterFreeIds || []).map(String))].filter(id => skillIndex.has(id));
    calculatorState.characterId = typeof inboundPlanState.characterId === 'string' ? inboundPlanState.characterId : '';
    calculatorState.currentPlanId = inboundPlanState.id;
    calculatorState.activeBreaks = [...new Set((inboundPlanState.activeBreaks || []).map(Number).filter(value => [7, 12, 20].includes(value)))];
    calculatorState.detailsOpen = false;
    calculatorState.expandedBonusKey = '';
    openCalculatorOnLoad = true;
    localStorage.setItem(calculatorStorageKey, JSON.stringify(calculatorState));
    history.replaceState(null, '', `${location.pathname}${embeddedLoadout?'?embeddedLoadout=1':''}${location.hash}`);
  } else if (inboundLoadout) {
    const includedIds = inboundLoadout.skillIds.filter(id => skillIndex.has(id));
    calculatorState.skillIds = [...includedIds];
    calculatorState.characterFreeIds = [...includedIds];
    calculatorState.characterId = inboundCharacterId;
    calculatorState.currentPlanId = '';
    calculatorState.detailsOpen = false;
    calculatorState.expandedBonusKey = '';
    openCalculatorOnLoad = true;
    localStorage.setItem(calculatorStorageKey, JSON.stringify(calculatorState));
    history.replaceState(null, '', `${location.pathname}${embeddedLoadout?'?embeddedLoadout=1':''}${location.hash}`);
  }

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  calculatorCharacterSelect.innerHTML = [
    '<option value="">通用</option>',
    ...Object.entries(characterLoadouts).map(([id, character]) => `<option value="${escapeHtml(id)}">${escapeHtml(character.name)}</option>`),
  ].join('');

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

  function effectNotes(row) {
    // A custom description takes precedence over the standard supplementary text.
    return rowValue(row, 'effect') === String(row.effect || '') ? String(row.notes || '') : '';
  }

  function skillTagLabels(row) {
    return rowValue(row, 'effect') === String(row.effect || '') ? row.skillTags?.labels || [] : [];
  }

  function effectContent(row) {
    const notes = effectNotes(row);
    return highlight(rowValue(row, 'effect')) + (notes ? `<div class="skill-effect-notes"><span>补充说明</span>${highlight(notes)}</div>` : '');
  }

  function editedSources(row) {
    return rowValue(row, 'sources').split('\n').map(item => item.trim()).filter(Boolean);
  }

  function sourcesContent(row) {
    return `<div class="source-list">${editedSources(row).map(source => `<div>${highlight(source)}</div>`).join('')}</div>`;
  }

  function parseSc(value) {
    const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    const parsed = match ? Number(match[0]) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function formatSc(value) {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }

  function ratingWeight(rating) {
    const value = String(rating || '').trim().toUpperCase();
    const gradeWeights = { SSS: 900, SS: 800, 'S+': 750, S: 700, 'S-': 650, 'A+': 600, A: 550, 'A-': 500, 'B+': 450, B: 400, 'B-': 350, 'C+': 300, C: 250, 'C-': 200, D: 150 };
    if (Object.prototype.hasOwnProperty.call(gradeWeights, value)) return gradeWeights[value];
    const numeric = Number(value);
    return Number.isFinite(numeric) && value !== '' ? numeric : null;
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
    return fold([row.type, rowValue(row, 'name'), ...(row.aliases || []), rowValue(row, 'sc'), rowValue(row, 'effect'), effectNotes(row), ...skillTagLabels(row), ...(rowValue(row,'effect')===String(row.effect||'')?row.basicStats?.targets||[]:[]), ...editedSources(row)].join(' '));
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
    calculatorRestore.disabled = !calculatorState.characterId || !characterLoadouts[calculatorState.characterId];
    const matchingPlans = currentCharacterPlans();
    calculatorCharacterSelect.value = calculatorState.characterId || '';
    savedLoadoutCount.textContent = String(matchingPlans.length);
    document.querySelectorAll('[data-break-level]').forEach(button => {
      const level = Number(button.dataset.breakLevel);
      const active = calculatorState.activeBreaks.includes(level);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const descending = calculatorState.sortDirection === 'desc';
    calculatorSortIcon.textContent = descending ? 'SC▽' : 'SC△';
    calculatorSort.setAttribute('aria-label', descending ? '当前SC从大到小，点击改为从小到大' : '当前SC从小到大，点击改为从大到小');
    calculatorSort.title = descending ? 'SC从大到小' : 'SC从小到大';
    calculatorSort.classList.toggle('is-active', calculatorSortMode === 'sc');
    calculatorSort.setAttribute('aria-pressed', String(calculatorSortMode === 'sc'));
    calculatorRatingSortIcon.textContent = calculatorRatingDirection === 'desc' ? '评分▽' : '评分△';
    calculatorRatingSort.classList.toggle('is-active', calculatorSortMode === 'rating');
    calculatorRatingSort.setAttribute('aria-pressed', String(calculatorSortMode === 'rating'));
    calculatorDetails.classList.toggle('is-active', calculatorState.detailsOpen);
    calculatorDetails.setAttribute('aria-pressed', String(calculatorState.detailsOpen));
    calculatorEffects.classList.toggle('is-active', calculatorEffectsOpen);
    calculatorEffects.setAttribute('aria-pressed', String(calculatorEffectsOpen));
    const displayItems = [...result.items].sort((a, b) => {
      if (calculatorSortMode === 'rating') {
        const aRating = rowValue(a.row, 'mark');
        const bRating = rowValue(b.row, 'mark');
        const aHasRating = Boolean(aRating.trim());
        const bHasRating = Boolean(bRating.trim());
        if (!aHasRating && bHasRating) return 1;
        if (aHasRating && !bHasRating) return -1;
        const aWeight = ratingWeight(aRating);
        const bWeight = ratingWeight(bRating);
        if (aWeight === null && bWeight !== null) return 1;
        if (aWeight !== null && bWeight === null) return -1;
        if (aWeight !== null && bWeight !== null && aWeight !== bWeight) return calculatorRatingDirection === 'desc' ? bWeight - aWeight : aWeight - bWeight;
        if (aRating !== bRating) return calculatorRatingDirection === 'desc' ? bRating.localeCompare(aRating, 'zh-CN') : aRating.localeCompare(bRating, 'zh-CN');
        return b.sc - a.sc;
      }
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
      ? displayItems.map(item => {
        const rating = rowValue(item.row, 'mark').trim();
        return `<div class="calculator-skill${item.freeBy ? ' is-free' : ''}">
          <button class="calculator-skill-name" type="button" data-skill-effect="${escapeHtml(item.id)}" title="双击查看技能效果">${escapeHtml(rowValue(item.row, 'name'))}</button>
          <input class="calculator-skill-rating${rating ? '' : ' is-empty'}" type="text" value="${escapeHtml(rating)}" placeholder="+评分" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" inputmode="text" data-edit-calculator-rating="${escapeHtml(item.id)}" aria-label="${escapeHtml(rowValue(item.row, 'name'))}的评分" title="直接输入评分，回车或离开输入框保存">
          <div class="calculator-skill-sc">${item.freeBy === 'character' ? `<strong>0 SC</strong><small>${escapeHtml(sourceGroupNames[characterSource(item.id)?.group]||'角色自带')}</small>${item.sc?`<del>原 ${formatSc(item.sc)} SC</del>`:''}` : item.freeBy ? `<strong>0 SC</strong><small>${item.freeBy} SC突破减免</small><del>原 ${formatSc(item.sc)} SC</del>` : `<strong>${formatSc(item.sc)} SC</strong>`}</div>
          <button type="button" data-remove-skill="${escapeHtml(item.id)}" aria-label="移除${escapeHtml(rowValue(item.row, 'name'))}" title="从计算器移除">×</button>
          ${calculatorEffectsOpen || expandedSkillEffects.has(item.id) ? `<div class="calculator-skill-effect">${effectContent(item.row)}${sourceEffectDetails(item.id)}</div>` : ''}
        </div>`;
      }).join('')
      : '<div class="calculator-empty">点击技能右侧的“＋”添加技能</div>';
    calculatorTotal.textContent = `${formatSc(result.total)} SC`;
    calculatorBadge.textContent = embeddedLoadout ? `已选技能 · ${formatSc(result.total)} SC` : '配装与伤害';
    if (embeddedLoadout && window.LC_LOADOUT_CALCULATOR) {
      window.dispatchEvent(new CustomEvent('lc:loadout-change', { detail: window.LC_LOADOUT_CALCULATOR.snapshot() }));
      renderCharacterSkillPicker();
    }
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
    sessionStorage.removeItem(loadoutDraftTransferKey);
    saveCalculatorState();
    saveLoadoutDialog.close();
    renderCalculator();
    if (returnPage && !embeddedLoadout) location.href = `${returnPage}?plan=${encodeURIComponent(snapshot.id)}`;
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
    if (!embeddedLoadout && open) {
      saveCalculatorState();
      const url = new URL('./damage-calculator.html', location.href);
      url.searchParams.set('unified', '1');
      if (calculatorState.characterId) url.searchParams.set('character', calculatorState.characterId);
      location.assign(url.href);
      return;
    }
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
        const effect = rowValue(row, 'effect');
        const markValue = rowValue(row, 'mark');
        return `<tr data-skill-id="${escapeHtml(row.id)}">
          ${index === 0 ? `<td class="type-cell" rowspan="${group.rows.length}">${cell(highlight(typeValue), 'cell-center')}</td>` : ''}
          ${editableTd(key, 'name', name, cell(skillName(row), 'cell-center'), 'skill-name')}
          ${editableTd(key, 'sc', rowValue(row, 'sc'), cell(highlight(rowValue(row, 'sc')), 'cell-center'), 'sc-cell')}
          ${editableTd(key, 'effect', effect, cell(effectContent(row)), '')}
          ${editableTd(key, 'sources', rowValue(row, 'sources'), cell(sourcesContent(row)), 'sources-cell')}
          ${editableTd(key, 'mark', markValue, cell(escapeHtml(markValue), 'cell-center'), 'rating-cell')}
          <td class="action-cell">${addButton(row)}</td>
        </tr>`;
      }).join('')).join('');
    return `<div class="table-scroll"><table class="excel-table skill-list-table" aria-label="${escapeHtml(label)}">
      <colgroup><col class="type"><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"><col class="action"></colgroup>
      <thead>
        <tr class="book-title"><th colspan="7">一、被动技能</th></tr>
        <tr class="column-title"><th>技能类型</th><th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th><th>添加</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function allTable(rows, label='全部技能') {
    const body = rows.map(row => {
      const key = rowKey(row);
      const name = rowValue(row, 'name');
      const effect = rowValue(row, 'effect');
      const markValue = rowValue(row, 'mark');
      return `<tr data-skill-id="${escapeHtml(row.id)}">
        ${editableTd(key, 'name', name, cell(skillName(row), 'cell-center'), 'skill-name')}
        ${editableTd(key, 'sc', rowValue(row, 'sc'), cell(highlight(rowValue(row, 'sc')), 'cell-center'), 'sc-cell')}
        ${editableTd(key, 'effect', effect, cell(effectContent(row)), '')}
        ${editableTd(key, 'sources', rowValue(row, 'sources'), cell(sourcesContent(row)), 'sources-cell')}
        ${editableTd(key, 'mark', markValue, cell(escapeHtml(markValue), 'cell-center'), 'rating-cell')}
        <td class="action-cell">${addButton(row)}</td>
      </tr>`;
    }).join('');
    return `<div class="table-scroll"><table class="excel-table skill-list-table all-skills" aria-label="${escapeHtml(label)}">
      <colgroup><col class="name"><col class="sc"><col class="effect"><col class="sources"><col class="rating"><col class="action"></colgroup>
      <thead>
        <tr class="book-title"><th colspan="6">${activeSheet==='基础属性'?escapeHtml(label):'一、被动技能'}</th></tr>
        <tr class="column-title"><th>技能名称</th><th>SC</th><th>技能效果／说明</th><th>可学习圣物</th><th>评价</th><th>添加</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function sheetCount(name) {
    const sheet = data.sheets[name];
    const rows=sheet.kind==='all'?sheet.rows:sheet.lanes.flatMap(lane=>lane.rows);
    return new Set(rows.filter(row=>!row.separator).map(row=>row.url||row.id)).size;
  }

  function renderTabs() {
    tabs.innerHTML = data.sheetOrder.map(name => `<button class="sheet-tab" type="button" data-sheet="${escapeHtml(name)}" role="tab" aria-selected="${name === activeSheet}">${escapeHtml(name)}</button>`).join('');
  }

  function render() {
    title.textContent = activeSheet;
    const sheet = data.sheets[activeSheet];
    let visible = 0;
    if (sheet.kind === 'basicStats') {
      const lanes=sheet.lanes.map(lane=>({...lane,rows:lane.rows.filter(matches)}));
      visible=new Set(lanes.flatMap(l=>l.rows.map(r=>r.url||r.id))).size;
      const census=data.skillCensus;
      tableArea.innerHTML=`<div class="basic-stat-overview"><p>本类共 <strong>${census.basicTotal}</strong> 个技能（去重）。同一技能可归入多个属性项目，添加到配装后只计一次。</p><p>属性已接入 ${census.basicReady} 个 · 部分接入 ${census.basicPartial} 个 · 待确认 ${census.basicPending} 个。已接入只表示本轮的基础属性效果；其他效果会在计算器中单独提示。</p><nav aria-label="基础属性项目">${lanes.map((l,i)=>`<a href="#basic-stat-${i}" data-basic-stat-jump="${i}">${escapeHtml(l.label)} <b>${l.rows.length}</b></a>`).join('')}</nav></div>`+
        lanes.map((lane,i)=>`<section class="basic-stat-section" id="basic-stat-${i}" aria-label="${escapeHtml(lane.label)}"><h3>${escapeHtml(lane.label)} <span>${lane.rows.length} 个技能${query?` / 全部 ${sheet.lanes[i].rows.length} 个`:''}</span></h3>${lane.rows.length?allTable(lane.rows,lane.label):'<p>没有符合搜索条件的技能。</p>'}</section>`).join('');
    } else if (sheet.kind === 'all') {
      const rows = sheet.rows.filter(matches);
      visible = rows.length;
      tableArea.innerHTML = rows.length ? allTable(rows) : '';
    } else {
      const lanes = sheet.lanes.map(lane => ({ ...lane, rows: lane.rows.filter(matches) }));
      visible = new Set(lanes.flatMap(lane => lane.rows.filter(row => !row.separator).map(row=>row.url||row.id))).size;
      tableArea.innerHTML = visible
        ? `<div class="split-grid">${lanes.filter(lane => lane.rows.length).map((lane, index) => splitTable(lane.rows, `${activeSheet} 第${index + 1}栏`)).join('')}</div>`
        : '';
    }
    emptyState.hidden = visible !== 0;
    resultSummary.textContent = query
      ? `找到 ${visible} 个技能（去重，本页共 ${sheetCount(activeSheet)} 个）`
      : `本页 ${visible} 个技能（去重） · 全库 ${data.skillCensus?.uniqueTotal||sheetCount('全部技能')} 个（去重）`;
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

  tableArea.addEventListener('click',event=>{
    const link=event.target.closest('[data-basic-stat-jump]');
    if(link){event.preventDefault();document.getElementById(`basic-stat-${link.dataset.basicStatJump}`)?.scrollIntoView({behavior:'smooth',block:'start'});}
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
    if (!['name','effect','mark','sc','sources'].includes(field)) return;
    edits[key] = { ...(edits[key] || {}), [field]: value };
    localStorage.setItem(editStorageKey, JSON.stringify(edits));
  }

  function startCellEdit(target) {
    if (!target || target.querySelector('.cell-editor')) return;
    const { editKey: key, editField: field, editValue: value = '' } = target.dataset;
    if (!key || !['name','effect','mark','sc','sources'].includes(field)) return;
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
    if (calculatorSortMode === 'sc') calculatorState.sortDirection = calculatorState.sortDirection === 'desc' ? 'asc' : 'desc';
    else calculatorSortMode = 'sc';
    saveCalculatorState();
    renderCalculator();
  });

  calculatorRatingSort.addEventListener('click', () => {
    if (calculatorSortMode === 'rating') calculatorRatingDirection = calculatorRatingDirection === 'desc' ? 'asc' : 'desc';
    else calculatorSortMode = 'rating';
    renderCalculator();
  });

  calculatorCharacterSelect.addEventListener('change', () => {
    const previous = characterLoadouts[calculatorState.characterId];
    const nextId = calculatorCharacterSelect.value;
    const next = characterLoadouts[nextId];
    const previousOwned = new Set([...(previous?.skillIds || []), ...calculatorState.characterFreeIds]);
    const keptIds = calculatorState.skillIds.filter(id => !previousOwned.has(id));
    const nextOwned = [...new Set([...(next?.skillIds || []), ...Object.keys(sourceBindings[nextId] || {})])].filter(id => skillIndex.has(id));
    calculatorState.skillIds = [...new Set([...keptIds, ...nextOwned])];
    calculatorState.characterFreeIds = [...nextOwned];
    calculatorState.characterId = nextId;
    calculatorState.currentPlanId = '';
    saveCalculatorState();
    render();
  });

  calculatorClear.addEventListener('click', () => {
    calculatorState.skillIds = [];
    calculatorState.characterFreeIds = [];
    calculatorState.currentPlanId = '';
    expandedSkillEffects.clear();
    saveCalculatorState();
    render();
  });

  calculatorRestore.addEventListener('click', () => {
    const id = calculatorState.characterId;
    if (!characterLoadouts[id]) return;
    const owned = [...new Set([...(characterLoadouts[id].skillIds || []), ...Object.keys(sourceBindings[id] || {})])]
      .filter(skill => skillIndex.has(skill) && characterSource(skill)?.group !== 'manual');
    calculatorState.skillIds = owned;
    calculatorState.characterFreeIds = [...owned];
    calculatorState.currentPlanId = '';
    expandedSkillEffects.clear();
    saveCalculatorState();
    render();
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

  calculator.addEventListener('input', event => {
    const input = event.target.closest('[data-edit-calculator-rating]');
    if (!input) return;
    const start = input.selectionStart;
    input.value = input.value.toUpperCase();
    input.classList.toggle('is-empty', !input.value.trim());
    if (start !== null) input.setSelectionRange(start, start);
  });

  calculator.addEventListener('focusout', event => {
    const input = event.target.closest('[data-edit-calculator-rating]');
    if (!input) return;
    const row = skillIndex.get(String(input.dataset.editCalculatorRating));
    if (!row) return;
    const value = input.value.trim().toUpperCase();
    if (value === rowValue(row, 'mark').trim().toUpperCase()) return;
    saveCellEdit(rowKey(row), 'mark', value);
    render();
  });

  calculator.addEventListener('keydown', event => {
    const input = event.target.closest('[data-edit-calculator-rating]');
    if (!input) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    } else if (event.key === 'Escape') {
      const row = skillIndex.get(String(input.dataset.editCalculatorRating));
      if (row) input.value = rowValue(row, 'mark');
      input.blur();
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

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try { edits = JSON.parse(localStorage.getItem(editStorageKey) || '{}'); }
    catch { edits = {}; }
    render();
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

  function characterSource(id) {
    const ids = sourceBindings[calculatorState.characterId]?.[id] || [];
    return unifiedCatalog[calculatorState.characterId]?.sources?.find(s => ids.includes(s.sourceId));
  }
  function sourceEffectDetails(id) {
    const effects = characterSource(id)?.effects || [];
    return effects.length ? `<details><summary>当前计算词条</summary><ul>${effects.map(text=>`<li>${escapeHtml(text)}</li>`).join('')}</ul></details>` : '';
  }
  function renderCharacterSkillPicker() {
    const picker = document.getElementById('unifiedCharacterSkills'); if (!picker) return;
    const bindings = sourceBindings[calculatorState.characterId] || {};
    const groups = new Map();
    for (const id of Object.keys(bindings)) {
      const group = characterSource(id)?.group || 'common';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(id);
    }
    picker.innerHTML = [...groups].map(([group,ids])=>`<section class="loadout-source-group"><h3>${escapeHtml(sourceGroupNames[group]||'其他来源')}</h3>${ids.map(id => {
      const row = skillIndex.get(id), checked = calculatorState.skillIds.includes(id);
      return `<div><label><input type="checkbox" data-unified-skill="${escapeHtml(id)}" ${checked ? 'checked' : ''}>${escapeHtml(rowValue(row, 'name'))}</label><details><summary>效果</summary><p>${escapeHtml(rowValue(row,'effect'))}</p>${sourceEffectDetails(id)}</details></div>`;
    }).join('')}</section>`).join('');
  }
  window.LC_LOADOUT_CALCULATOR = {
    snapshot() {
      const bindings = sourceBindings[calculatorState.characterId] || {};
      return { characterId: calculatorState.characterId, characterName: characterLoadouts[calculatorState.characterId]?.name || '通用', characterPage: characterLoadouts[calculatorState.characterId]?.page,
        sourceIds: Object.values(bindings).flat(), activeBreaks: [...calculatorState.activeBreaks], totalSc: calculateSc().total,
        items: calculateSc().items.map(item => ({ id: item.id, catalogId:item.row.basicStats?.catalogId, name: rowValue(item.row, 'name'), text: rowValue(item.row, 'effect'), sc: item.freeBy ? 0 : item.sc,
          sourceIds: bindings[item.id] || [], skillTags:skillTagLabels(item.row).length?item.row.skillTags:null, edited: rowValue(item.row, 'effect') !== String(item.row.effect || '') })) };
    },
    setEquipmentSources({sourceIds,enabled}) {
      const id=calculatorState.characterId, sources=unifiedCatalog[id]?.sources||[];
      const allowed=new Set(sources.filter(s=>s.group==='equipment'&&['法杖','剑','斧','枪','槌','弓','机械','爪','刀','弩','锤'].includes(s.equipmentType)).map(s=>s.sourceId));
      const requested=new Set((sourceIds||[]).filter(sourceId=>allowed.has(sourceId)));
      if(!requested.size)return;
      for(const [skill,ids] of Object.entries(sourceBindings[id]||{}))if(ids.length&&ids.every(sourceId=>requested.has(sourceId))){
        calculatorState.skillIds=calculatorState.skillIds.filter(item=>item!==skill);
        if(enabled)calculatorState.skillIds.push(skill);
      }
      saveCalculatorState();render();
    },
    initialize({characterId, sources}) {
      const id = String(characterId), wasSame = calculatorState.characterId === id, oldOwned = new Set(characterLoadouts[id]?.skillIds || []);
      const knownSources = new Set((unifiedCatalog[id]?.sources || []).map(s=>s.sourceId));
      const incomingSources = new Set(sources.map(s=>s.sourceId));
      sources = [...sources,...(unifiedCatalog[id]?.sources || []).filter(s=>!incomingSources.has(s.sourceId)).map(s=>({...s,enabled:false,effects:[]}))];
      installCharacterSources(id, sources);
      if (!wasSame) {
        const previousOwned = new Set(calculatorState.characterFreeIds);
        calculatorState.skillIds = calculatorState.skillIds.filter(skill => !previousOwned.has(skill));
        calculatorState.characterId = id; calculatorState.currentPlanId = '';
      }
      const bindings = sourceBindings[id], enabled = new Set(sources.filter(s => s.enabled).map(s => s.sourceId));
      for (const [skill, ids] of Object.entries(bindings)) {
        const newlyAvailable = ids.some(source => !knownSources.has(source));
        if ((!unifiedCatalog[id]?.initialized || !wasSame || newlyAvailable) && ids.some(source => enabled.has(source)) && (newlyAvailable || !wasSame || !oldOwned.has(skill)) && !calculatorState.skillIds.includes(skill)) calculatorState.skillIds.push(skill);
      }
      calculatorState.characterFreeIds = [...new Set([...(characterLoadouts[id]?.skillIds || []), ...Object.keys(bindings)])];
      unifiedCatalog[id] = {sources, initialized: true};
      localStorage.setItem(unifiedCatalogKey, JSON.stringify(unifiedCatalog));
      saveCalculatorState(); render();
    }
  };
  document.getElementById('unifiedCharacterSkills')?.addEventListener('change', event => {
    const id = event.target.dataset.unifiedSkill; if (!id || !skillIndex.has(id)) return;
    calculatorState.skillIds = calculatorState.skillIds.filter(skill => skill !== id);
    if (event.target.checked) calculatorState.skillIds.push(id);
    saveCalculatorState(); render();
  });
  render();
  if (openCalculatorOnLoad) setCalculatorOpen(true);
  registerWebMcp();
})();
