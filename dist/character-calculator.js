(() => {
  const bonuses = [
    ["hp_pct", "HP", 20, "%", "超越·命导提升", "transcend", "常驻"],
    ["mp_pct", "MP", 15, "%", "魔导提升极", "exclusive", "常驻"],
    ["mp_pct", "MP", 15, "%", "魔常提升极", "exclusive", "常驻"],
    ["mp_pct", "MP", 20, "%", "魔术共鸣", "exclusive", "常驻"],
    ["mp_pct", "MP", 20, "%", "MP提升极", "common", "常驻"],
    ["int_pct", "法强", 15, "%", "魔导提升极", "exclusive", "常驻"],
    ["int_pct", "法强", 15, "%", "魔常提升极", "exclusive", "常驻"],
    ["int_pct", "法强", 30, "%", "月光II", "exclusive", "HP全满时"],
    ["int_pct", "法强", 20, "%", "魔术共鸣", "exclusive", "常驻"],
    ["int_pct", "法强", 15, "%", "洛琪希之杖", "equipment", "装备专属法杖"],
    ["int_pct", "法强", 20, "%", "超越·命导提升", "transcend", "常驻"],
    ["int_pct", "法强", 65, "%", "魔术指导", "magic", "魔法增益生效期间"],
    ["mnd_pct", "魔抗", 15, "%", "魔常提升极", "exclusive", "常驻"],
    ["mnd_pct", "魔抗", 20, "%", "长袍究极增幅", "exclusive", "装备长袍"],
    ["crit_rate", "暴击率", 8, "%", "暴击提升III", "common", "常驻"],
    ["crit_rate", "暴击率", 10, "%", "锐气", "common", "HP全满时"],
    ["crit_rate", "暴击率", 5, "%", "冰属性暴击提升", "common", "仅冰属性攻击"],
    ["crit_damage", "暴击伤害", 50, "%", "冰属性暴击提升", "common", "冰属性攻击触发暴击时"],
    ["ice_damage", "冰属性伤害", 50, "%", "水王级魔术师", "traits", "仅装备1件武器"],
    ["ice_damage", "冰属性伤害", 30, "%", "魔术共鸣", "exclusive", "我方发动不可叠加魔法期间"],
    ["ice_damage", "冰属性伤害", 30, "%", "冰属性攻击提升III", "common", "常驻"],
    ["ice_magic_damage", "冰属性魔法伤害", 30, "%", "冰系究极增幅", "exclusive", "常驻"],
    ["ice_magic_damage", "冰属性魔法伤害", 30, "%", "冰系超级增幅", "common", "常驻"],
    ["ice_magic_damage", "冰属性魔法伤害", 35, "%", "洛琪希之杖", "equipment", "仅装备1件武器"],
    ["magic_damage", "魔法伤害", 20, "%", "法杖究极增幅", "exclusive", "装备法杖"],
    ["magic_damage", "魔法伤害", 15, "%", "长袍究极增幅", "exclusive", "装备长袍"],
    ["physical_damage", "物理伤害", 10, "%", "法杖究极增幅", "exclusive", "装备法杖"],
    ["special_damage", "特攻伤害", 50, "%", "特攻增幅", "common", "触发特攻时"],
    ["boss_magic_damage", "对BOSS魔法伤害", 20, "%", "巨型净化V", "exclusive", "攻击BOSS时"],
    ["boss_magic_damage", "对BOSS魔法伤害", 20, "%", "巨型净化III", "common", "攻击BOSS时"],
    ["spell_link_damage", "同魔法连续伤害", 20, "%", "法术联结", "common", "连续使用相同攻击魔法达到最大层数"],
    ["weak_magic_damage", "弱点魔法伤害", 30, "%", "超越·魔法弱点增幅", "transcend", "魔法命中弱点属性时"],
    ["ultimate_damage", "超必杀技伤害", 100, "%", "规格外的魔术师", "exclusive", "常驻"],
    ["ultimate_damage", "超必杀技伤害", 50, "%", "超越·超必杀技增幅II", "transcend", "常驻"],
    ["ice_cap", "冰属性伤害上限", 60000, "", "水王级魔术师", "traits", "仅装备1件武器"],
    ["ice_cap", "冰属性伤害上限", 20000, "", "指导者", "traits", "BOSS Wave中，作用于我方全体"],
    ["ice_cap", "冰属性伤害上限", 50000, "", "魔术共鸣", "exclusive", "我方发动不可叠加魔法期间"],
    ["ice_cap", "冰属性伤害上限", 2000, "", "冰属性攻击提升III", "common", "常驻"],
    ["ice_magic_cap", "冰属性魔法上限", 5000, "", "冰系究极增幅", "exclusive", "常驻"],
    ["ice_magic_cap", "冰属性魔法上限", 2000, "", "冰属性暴击·改", "exclusive", "常驻"],
    ["ice_magic_cap", "冰属性魔法上限", 2000, "", "冰系超级增幅", "common", "常驻"],
    ["ice_magic_cap", "冰属性魔法上限", 6000, "", "洛琪希之杖", "equipment", "仅装备1件武器"],
    ["boss_ice_magic_cap", "对BOSS冰魔法上限", 5000, "", "洛琪希的衣服", "equipment", "攻击BOSS时"],
    ["magic_cap", "魔法伤害上限", 5000, "", "法杖究极增幅", "exclusive", "装备法杖"],
    ["magic_cap", "魔法伤害上限", 30000, "", "缩短咏唱", "exclusive", "装备法杖"],
    ["magic_cap", "魔法伤害上限", 5000, "", "洛琪希的衣服", "equipment", "自身存活时，作用于我方全体"],
    ["magic_cap", "魔法伤害上限", 30000, "", "魔术指导", "magic", "魔法增益生效期间"],
    ["boss_magic_cap", "对BOSS魔法上限", 10000, "", "巨型净化V", "exclusive", "攻击BOSS时"],
    ["boss_magic_cap", "对BOSS魔法上限", 4000, "", "巨型净化III", "common", "攻击BOSS时"],
    ["special_cap", "特攻伤害上限", 30000, "", "指导者", "traits", "增益生效且触发特攻时，作用于我方全体"],
    ["special_cap", "特攻伤害上限", 15000, "", "特攻界限突破V", "exclusive", "仅装备1件武器时的最大值"],
    ["special_cap", "特攻伤害上限", 6000, "", "特攻界限突破III", "common", "仅装备1件武器时的最大值"],
    ["special_cap", "特攻伤害上限", 5000, "", "洛琪希之杖", "equipment", "触发特攻时"],
    ["special_cap", "特攻伤害上限", 20000, "", "超越·特攻界限突破", "transcend", "仅装备1件武器或未装备武器时的最大值"],
    ["physical_cap", "物理伤害上限", 5000, "", "洛琪希的衣服", "equipment", "自身存活时，作用于我方全体"],
    ["ultimate_cap", "超必杀技伤害上限", 200000, "", "规格外的魔术师", "exclusive", "常驻"],
    ["ultimate_cap", "超必杀技伤害上限", 10000, "", "超越·超必杀技增幅II", "transcend", "常驻"],
    ["damage_reduction", "受到伤害减少", 10, "%", "长袍究极增幅", "exclusive", "装备长袍"],
    ["damage_reduction", "受到伤害减少", 20, "%", "超越·受到伤害减轻", "transcend", "常驻"],
    ["damage_reduction", "受到伤害减少", 15, "%", "超越·长袍精通II", "transcend", "装备长袍"],
    ["boss_reduction", "受到BOSS伤害减少", 20, "%", "巨型护盾II", "common", "受到BOSS攻击时"],
    ["boss_reduction", "受到BOSS伤害减少", 20, "%", "超越·巨型护盾", "transcend", "受到BOSS攻击时"],
    ["physical_ult_reduction", "物理/超必杀技减伤", 15, "%", "洛琪希的衣服", "equipment", "受到物理攻击或超必杀技时"],
    ["cast_speed", "攻击魔法咏唱速度", 50, "%", "缩短咏唱", "exclusive", "装备冰属性法杖"],
    ["staff_int", "法杖法强属性", 100, "%", "魔导士心得II", "exclusive", "同时装备法杖与长袍"],
    ["robe_int", "长袍法强属性", 50, "%", "超越·长袍精通II", "transcend", "装备长袍"],
    ["robe_mnd", "长袍魔抗属性", 100, "%", "魔导士心得II", "exclusive", "同时装备法杖与长袍"],
    ["robe_mnd", "长袍魔抗属性", 50, "%", "超越·长袍精通II", "transcend", "装备长袍"],
    ["knowledge_wall", "法强转化为防御/魔抗", 10, "%", "知识之壁II", "exclusive", "战斗开始时，将法强的10%分别加算至防御力与魔抗"]
  ].map(([key, label, value, unit, source, group, condition]) => ({ key, label, value, unit, source, group, condition }));

  const panel = document.getElementById("bonusCalculator");
  const overlay = document.getElementById("bonusCalculatorOverlay");
  const openButton = document.getElementById("bonusCalculatorOpen");
  const closeButton = document.getElementById("bonusCalculatorClose");
  const restoreAllButton = document.getElementById("bonusRestoreAll");
  const summary = document.getElementById("bonusSummary");
  const capPanel = document.getElementById("capCalculator");
  const capOpenButton = document.getElementById("capCalculatorOpen");
  const capCloseButton = document.getElementById("capCalculatorClose");
  const capResetButton = document.getElementById("capReset");
  const capTypesElement = document.getElementById("capTypes");
  const capConditionsElement = document.getElementById("capConditions");
  const capBreakdown = document.getElementById("capBreakdown");
  const capSourcePicker = document.getElementById("capSourcePicker");
  const capTotal = document.getElementById("capTotal");
  const capAdded = document.getElementById("capAdded");
  const capAttackElement = document.getElementById("capAttacks");
  const savedBuildViewerOpen = document.getElementById("savedBuildViewerOpen");
  const savedBuildViewer = document.getElementById("savedBuildViewer");
  const savedBuildViewerClose = document.getElementById("savedBuildViewerClose");
  const savedBuildSort = document.getElementById("savedBuildSort");
  const savedBuildSelect = document.getElementById("savedBuildSelect");
  const savedBuildNote = document.getElementById("savedBuildNote");
  const savedBuildBreaks = document.getElementById("savedBuildBreaks");
  const savedBuildDetails = document.getElementById("savedBuildDetails");
  const savedBuildSkills = document.getElementById("savedBuildSkills");
  const savedBuildTotal = document.getElementById("savedBuildTotal");
  const expanded = new Set();
  const hiddenKeys = new Set();
  const selectedCapTypes = new Set(["general", "magic", "ice", "ice_magic", "heavy_magic", "boss_magic", "boss_ice_magic", "critical", "special"]);
  const selectedCapConditions = new Set();
  const selectedCapSources = new Set();
  let selectedCapAttack = "zeno_claion";
  let lastOpenedCalculator = "bonus";
  let highlightTimer = null;
  let savedBuildSortDirection = "desc";
  let savedBuildDetailsOpen = false;
  let expandedSavedBuildBonusKey = "";
  let selectedSavedBuildId = new URLSearchParams(location.search).get("plan") || "";

  const savedBuildStorageKey = "lc-sheet-table:loadout-plans-v1";
  const savedBuildEditsKey = "lc-sheet-table:cell-edits-v1";
  const currentSavedBuildCharacterId = document.body.dataset.characterId || "";
  const skillData = window.SKILL_DATA;
  const savedBuildSkillIndex = new Map();
  if (skillData?.sheetOrder) {
    skillData.sheetOrder.forEach((sheetName) => {
      const sheet = skillData.sheets[sheetName];
      const rows = sheet.kind === "all" ? sheet.rows : sheet.lanes.flatMap((lane) => lane.rows);
      rows.forEach((row) => {
        if (!row.separator && !savedBuildSkillIndex.has(String(row.id))) savedBuildSkillIndex.set(String(row.id), row);
      });
    });
  }

  const escapeSavedBuildHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const parseSavedBuildSc = (value) => {
    const match = String(value ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    const parsed = match ? Number(match[0]) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };
  const formatSavedBuildSc = (value) => Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  const readSavedBuildPlans = () => {
    try {
      const plans = JSON.parse(localStorage.getItem(savedBuildStorageKey) || "[]");
      return Array.isArray(plans) ? plans.filter((plan) => plan?.characterId === currentSavedBuildCharacterId && typeof plan.id === "string") : [];
    } catch { return []; }
  };
  const readSavedBuildEdits = () => {
    try { return JSON.parse(localStorage.getItem(savedBuildEditsKey) || "{}"); }
    catch { return {}; }
  };
  const savedBuildRowValue = (row, field, edits) => {
    const fallback = field === "sources" ? (row.sources || []).join("\n") : row[field] ?? "";
    const record = edits[`skill:${row.id}`];
    return String(record && Object.prototype.hasOwnProperty.call(record, field) ? record[field] : fallback);
  };

  const savedBuildBonusPattern = /(受到的?(?:敌人)?(?:物理|魔法|火|炎|冰|树|雷|光|暗|无属性)?(?:攻击)?伤害|(?:火|炎|冰|树|雷|光|暗|无属性)属性物理攻击(?:与|和)必杀伤害上限|物理攻击(?:与|和)必杀伤害上限|特技(?:与|和)必杀伤害上限|物理攻击(?:与|和)魔法攻击伤害上限|(?:火|炎|冰|树|雷|光|暗|无属性)属性(?:物理攻击|魔法攻击|攻击)?伤害上限|不可叠加魔法(?:的)?伤害上限|物理(?:攻击)?伤害上限|魔法(?:攻击)?伤害上限|特技伤害上限|(?:超级|超)?必杀技?伤害上限|反击伤害上限|特攻伤害上限|暴击伤害上限|HP恢复上限|伤害上限|(?:火|炎|冰|树|雷|光|暗|无属性)属性物理攻击(?:与|和)必杀伤害|物理攻击(?:与|和)必杀伤害|特技(?:与|和)必杀伤害|物理攻击(?:与|和)魔法攻击伤害|(?:火|炎|冰|树|雷|光|暗|无属性)属性(?:物理攻击|魔法攻击|攻击)?伤害|不可叠加魔法伤害|物理(?:攻击)?伤害|魔法(?:攻击)?伤害|普通攻击伤害|特技伤害|(?:超级|超)?必杀技?伤害|反击伤害|特攻伤害|暴击伤害|弱点伤害|受到的伤害|造成的伤害|伤害|攻击力|防御力|魔力|魔抗|HP上限|MP上限|暴击率|SCT恢复速度|SCT回复速度|Break值|治疗魔法威力|HP恢复量)([^。；，,+＋-]{0,16})([+＋-])\s*([\d,]+(?:\.\d+)?)\s*(%)?/g;
  const inferSavedBuildMetric = (effect, index, suffix) => {
    const context = effect.slice(Math.max(0, index - 80), index);
    const end = suffix.includes("上限") ? "伤害上限" : "伤害";
    if (/物理攻击(?:与|和)必杀/.test(context)) return `物理/必杀${end}`;
    if (/特技(?:与|和)必杀/.test(context)) return `特技/必杀${end}`;
    if (/物理攻击(?:与|和)魔法攻击/.test(context)) return `物理/魔法${end}`;
    const attribute = context.match(/(火|炎|冰|树|雷|光|暗|无)属性[^，。；]{0,18}$/)?.[1];
    if (attribute) return `${attribute === "火" ? "炎" : attribute}属性${end}`;
    if (/物理攻击[^，。；]{0,24}$/.test(context)) return `物理${end}`;
    if (/魔法攻击[^，。；]{0,24}$/.test(context)) return `魔法${end}`;
    if (/特技[^，。；]{0,24}$/.test(context)) return `特技${end}`;
    if (/(?:超级|超)?必杀[^，。；]{0,24}$/.test(context)) return `必杀${end}`;
    if (/反击[^，。；]{0,24}$/.test(context)) return `反击${end}`;
    if (/特攻[^，。；]{0,24}$/.test(context)) return `特攻${end}`;
    return suffix;
  };
  const normalizeSavedBuildMetric = (raw, effect, index) => {
    let label = raw.replace(/^受到的?敌人?/, "受到的").replaceAll("攻击伤害", "伤害").replaceAll("火属性", "炎属性");
    label = label.replace(/超级必杀技?|超必杀技?|必杀技/g, "必杀");
    label = label.replace("物理攻击与必杀", "物理/必杀").replace("物理攻击和必杀", "物理/必杀");
    label = label.replace("特技与必杀", "特技/必杀").replace("特技和必杀", "特技/必杀");
    label = label.replace("物理攻击与魔法攻击", "物理/魔法").replace("物理攻击和魔法攻击", "物理/魔法");
    label = label.replace(/^物理攻击/, "物理").replace(/^魔法攻击/, "魔法");
    return label === "伤害" || label === "伤害上限" ? inferSavedBuildMetric(effect, index, label) : label;
  };
  const summarizeSavedBuildBonuses = (items, edits) => {
    const totals = new Map();
    items.forEach((item) => {
      const effect = savedBuildRowValue(item.row, "effect", edits).replaceAll("＋", "+").replace(/\s+/g, " ");
      savedBuildBonusPattern.lastIndex = 0;
      for (const match of effect.matchAll(savedBuildBonusPattern)) {
        const metric = normalizeSavedBuildMetric(match[1], effect, match.index || 0);
        const unit = match[5] ? "%" : "";
        const value = Number(match[4].replaceAll(",", "")) * (match[3] === "-" ? -1 : 1);
        if (!Number.isFinite(value)) continue;
        const key = `${metric}|${unit}`;
        const current = totals.get(key) || { key, metric, unit, value: 0, skills: [] };
        current.value += value;
        if (!current.skills.some((skill) => skill.id === item.id)) current.skills.push({
          id: item.id,
          name: savedBuildRowValue(item.row, "name", edits),
          effect: savedBuildRowValue(item.row, "effect", edits),
        });
        totals.set(key, current);
      }
    });
    return [...totals.values()];
  };
  const formatSavedBuildBonus = (value, unit) => `${value > 0 ? "+" : ""}${unit ? formatSavedBuildSc(value) : Math.round(value).toLocaleString("zh-CN")}${unit}`;

  const calculateSavedBuild = (plan, edits) => {
    const characterFreeIds = new Set(Array.isArray(plan.characterFreeIds) ? plan.characterFreeIds.map(String) : []);
    const items = (Array.isArray(plan.skillIds) ? plan.skillIds : [])
      .map((id) => savedBuildSkillIndex.get(String(id)))
      .filter(Boolean)
      .map((row) => ({
        id: String(row.id),
        row,
        sc: parseSavedBuildSc(savedBuildRowValue(row, "sc", edits)),
        freeBy: characterFreeIds.has(String(row.id)) ? "character" : 0,
      }));
    const used = new Set(items.filter((item) => item.freeBy === "character").map((item) => item.id));
    const activeBreaks = Array.isArray(plan.activeBreaks) ? plan.activeBreaks.map(Number) : [];
    [7, 12, 20].forEach((threshold) => {
      if (!activeBreaks.includes(threshold)) return;
      const eligible = items.filter((item) => !used.has(item.id) && item.sc > 0 && item.sc <= threshold);
      if (!eligible.length) return;
      const bestSc = Math.max(...eligible.map((item) => item.sc));
      const chosen = eligible.find((item) => item.sc === bestSc);
      chosen.freeBy = threshold;
      used.add(chosen.id);
    });
    return {
      items,
      total: items.reduce((sum, item) => sum + (item.freeBy ? 0 : item.sc), 0),
      activeBreaks,
    };
  };

  const renderSavedBuildViewer = () => {
    const plans = readSavedBuildPlans();
    const edits = readSavedBuildEdits();
    if (!plans.some((plan) => plan.id === selectedSavedBuildId)) selectedSavedBuildId = plans[0]?.id || "";
    savedBuildSelect.innerHTML = plans.length
      ? plans.map((plan) => `<option value="${escapeSavedBuildHtml(plan.id)}"${plan.id === selectedSavedBuildId ? " selected" : ""}>${escapeSavedBuildHtml(plan.name || "未命名方案")}</option>`).join("")
      : '<option value="">还没有保存的配装方案</option>';
    savedBuildSelect.disabled = !plans.length;
    const plan = plans.find((item) => item.id === selectedSavedBuildId);
    if (!plan) {
      savedBuildNote.hidden = true;
      savedBuildBreaks.innerHTML = "";
      savedBuildSkills.innerHTML = '<div class="saved-build-empty">还没有这个角色的已保存方案。<br>请先使用上方“配装计算器”选择技能并保存。</div>';
      savedBuildTotal.textContent = "0 SC";
      savedBuildDetails.disabled = true;
      savedBuildDetails.classList.remove("is-active");
      savedBuildDetails.setAttribute("aria-pressed", "false");
      return;
    }
    savedBuildDetails.disabled = false;
    savedBuildDetails.classList.toggle("is-active", savedBuildDetailsOpen);
    savedBuildDetails.setAttribute("aria-pressed", String(savedBuildDetailsOpen));
    savedBuildNote.hidden = !plan.note;
    savedBuildNote.textContent = plan.note || "";
    const result = calculateSavedBuild(plan, edits);
    savedBuildBreaks.innerHTML = [7, 12, 20].map((level) => `<span class="saved-build-break${result.activeBreaks.includes(level) ? " is-active" : ""}">${level} SC突破</span>`).join("");
    const descending = savedBuildSortDirection === "desc";
    savedBuildSort.textContent = descending ? "▽" : "△";
    savedBuildSort.setAttribute("aria-label", descending ? "当前SC从大到小，点击改为从小到大" : "当前SC从小到大，点击改为从大到小");
    const displayItems = [...result.items].sort((a, b) => {
      const aCharacterFree = a.freeBy === "character";
      const bCharacterFree = b.freeBy === "character";
      if (aCharacterFree !== bCharacterFree) return aCharacterFree ? 1 : -1;
      return descending ? b.sc - a.sc : a.sc - b.sc;
    });
    const bonuses = summarizeSavedBuildBonuses(result.items, edits);
    savedBuildSkills.innerHTML = savedBuildDetailsOpen
      ? (bonuses.length ? `<div class="saved-build-bonus-summary">${bonuses.map((item) => {
          const expanded = expandedSavedBuildBonusKey === item.key;
          return `<button class="saved-build-bonus-row${expanded ? " is-expanded" : ""}" type="button" data-saved-bonus-key="${escapeSavedBuildHtml(item.key)}" aria-expanded="${expanded}"><span>${escapeSavedBuildHtml(item.metric)}</span><strong>${escapeSavedBuildHtml(formatSavedBuildBonus(item.value, item.unit))}</strong></button>${expanded ? `<div class="saved-build-bonus-sources">${item.skills.map((skill) => `<article><strong>${escapeSavedBuildHtml(skill.name)}</strong><p>${escapeSavedBuildHtml(skill.effect)}</p></article>`).join("")}</div>` : ""}`;
        }).join("")}<p class="saved-build-bonus-note">仅合计所选技能描述中的明确数值，技能发动条件仍需满足。</p></div>` : '<div class="saved-build-empty">当前方案没有可合并的明确数值</div>')
      : displayItems.length
      ? displayItems.map((item) => `<div class="saved-build-skill${item.freeBy ? " is-free" : ""}">
          <div class="saved-build-skill-name">${escapeSavedBuildHtml(savedBuildRowValue(item.row, "name", edits))}</div>
          <div class="saved-build-skill-sc">${item.freeBy === "character" ? `<strong>0 SC</strong><small>角色自带</small><del>原 ${formatSavedBuildSc(item.sc)} SC</del>` : item.freeBy ? `<strong>0 SC</strong><small>${item.freeBy} SC突破减免</small><del>原 ${formatSavedBuildSc(item.sc)} SC</del>` : `<strong>${formatSavedBuildSc(item.sc)} SC</strong>`}</div>
        </div>`).join("")
      : '<div class="saved-build-empty">这个方案没有技能</div>';
    savedBuildTotal.textContent = `${formatSavedBuildSc(result.total)} SC`;
  };

  const openSavedBuildViewer = () => {
    renderSavedBuildViewer();
    if (isMobile()) {
      resetPanelPosition(savedBuildViewer);
      panel.hidden = true;
      capPanel.hidden = true;
    }
    savedBuildViewer.hidden = false;
    savedBuildViewerClose.focus();
  };

  // 新角色只需要提供攻击档案、条件和来源；通用计算逻辑不依赖角色名或技能名。
  const damageCapCharacter = {
    id: "260",
    attacks: [
      {
        id: "frost_nova",
        label: "冰霜新星",
        baseCap: 9999,
        tags: ["magic", "ice", "exclusive_magic"],
        note: "专属冰属性魔法；不计入不可叠加重魔法期间的限定来源。"
      },
      {
        id: "zeno_claion",
        label: "泽诺克莱昂",
        baseCap: 9999,
        tags: ["magic", "ice", "exclusive_magic", "non_stackable_magic"],
        note: "专属冰属性重魔法；可计入“不可叠加魔法期间”的限定来源。"
      }
    ],
    contexts: [
      { id: "critical", label: "暴击" },
      { id: "boss", label: "BOSS" },
      { id: "special", label: "特攻" },
      { id: "single_weapon", label: "单武器" }
    ],
    capTypes: [
      { id: "general", label: "通用伤害上限", includes: ["general"] },
      { id: "physical", label: "物理伤害上限", includes: ["general", "physical"] },
      { id: "magic", label: "魔法伤害上限", includes: ["general", "magic"] },
      { id: "ice", label: "冰属性伤害上限", includes: ["general", "ice"] },
      { id: "ice_magic", label: "冰属性魔法上限", includes: ["general", "ice", "magic", "ice_magic"] },
      { id: "heavy_magic", label: "重魔法伤害上限", includes: ["general", "magic", "heavy_magic"] },
      { id: "boss_magic", label: "对BOSS魔法上限", includes: ["general", "magic", "boss_magic"] },
      { id: "boss_ice_magic", label: "对BOSS冰魔法上限", includes: ["general", "ice", "magic", "ice_magic", "boss_magic", "boss_ice_magic"] },
      { id: "critical", label: "暴击伤害上限", includes: ["general", "critical"] },
      { id: "special", label: "特攻伤害上限", includes: ["general", "special"] },
      { id: "ultimate", label: "超必杀技伤害上限", includes: ["general", "ultimate"] }
    ],
    sources: [
      { id: "water_master", capType: "ice", label: "水王级魔术师", value: 60000, requires: ["ice", "single_weapon"], target: "水王级魔术师", condition: "仅装备1件武器时，冰属性伤害上限+60,000" },
      { id: "mentor_special", capType: "special", label: "指导者：特攻发生时", value: 30000, requires: ["special"], target: "指导者", condition: "指导者增益生效且触发特攻" },
      { id: "mentor_boss_wave", capType: "ice", label: "指导者：BOSS Wave", value: 20000, requires: ["ice", "boss"], target: "指导者", condition: "BOSS Wave开始后的冰属性上限增益" },
      { id: "magic_guidance", capType: "magic", label: "魔术指导（魔法增益）", value: 30000, requires: ["magic"], autoSelect: false, target: "魔术指导", condition: "需要主动施放；默认不计入，魔法增益生效期间可手动勾选" },
      { id: "short_cast", capType: "magic", label: "缩短咏唱：装备法杖", value: 30000, requires: ["magic"], target: "缩短咏唱", condition: "装备法杖时，魔法伤害上限+30,000" },
      { id: "magic_resonance", capType: "heavy_magic", label: "魔术共鸣：重魔法期间", value: 50000, requires: ["ice", "non_stackable_magic"], target: "魔术共鸣", condition: "我方发动不可叠加魔法期间" },
      { id: "special_limit_v", capType: "special", label: "特攻界限突破V", value: 7500, variants: [{ requires: ["single_weapon"], value: 15000 }], requires: ["special"], target: "特攻界限突破V", condition: "触发特攻时+7,500；单武器时变为+15,000" },
      { id: "giant_purge_v", capType: "boss_magic", label: "巨型净化V：BOSS", value: 10000, requires: ["magic", "boss"], target: "巨型净化V", condition: "对BOSS发动魔法攻击" },
      { id: "ice_critical_mod", capType: "ice_magic", label: "冰属性暴击·改", value: 2000, requires: ["ice", "magic"], target: "冰属性暴击·改", condition: "使冰属性魔法可以暴击，并使冰属性魔法上限+2,000" },
      { id: "staff_ultimate", capType: "magic", label: "法杖究极增幅", value: 5000, requires: ["magic"], target: "法杖究极增幅", condition: "装备法杖时，魔法伤害上限+5,000" },
      { id: "ice_super_boost", capType: "ice_magic", label: "冰系超级增幅", value: 2000, requires: ["ice", "magic"], target: "冰系超级增幅", condition: "冰属性魔法伤害上限+2,000" },
      { id: "ice_billion_boost", capType: "ice_magic", label: "冰系究极增幅", value: 5000, requires: ["ice", "magic"], target: "冰系究极增幅", condition: "冰属性魔法伤害上限+5,000" },
      { id: "ice_attack_iii", capType: "ice", label: "冰属性攻击提升III", value: 2000, requires: ["ice"], target: "冰属性攻击提升III", condition: "冰属性攻击" },
      { id: "giant_purge_iii", capType: "boss_magic", label: "巨型净化III：BOSS", value: 4000, requires: ["magic", "boss"], target: "巨型净化III", condition: "对BOSS发动魔法攻击时，伤害上限+4,000" },
      { id: "special_limit_iii", capType: "special", label: "特攻界限突破III", value: 3000, variants: [{ requires: ["single_weapon"], value: 6000 }], requires: ["special"], target: "特攻界限突破III", condition: "触发特攻时+3,000；单武器时变为+6,000" },
      { id: "transcend_special_limit", capType: "special", label: "【超越】特攻界限突破", value: 10000, variants: [{ requires: ["single_weapon"], value: 20000 }], requires: ["special"], target: "超越·特攻界限突破", condition: "触发特攻时+10,000；单武器或无武器时变为+20,000" },
      { id: "roxy_staff_ice", capType: "ice_magic", label: "洛琪希之杖：冰魔法", value: 6000, requires: ["ice", "magic", "single_weapon"], target: "洛琪希之杖", condition: "仅装备1件武器时，冰属性魔法伤害上限+6,000" },
      { id: "roxy_staff_special", capType: "special", label: "洛琪希之杖：特攻", value: 5000, requires: ["special"], target: "洛琪希之杖", condition: "触发特攻时，伤害上限+5,000" },
      { id: "roxy_clothes_boss_ice", capType: "boss_ice_magic", label: "洛琪希的衣服：对BOSS冰魔法", value: 5000, requires: ["boss", "ice", "magic"], target: "洛琪希的衣服", condition: "对BOSS的冰属性魔法伤害上限+5,000" },
      { id: "roxy_clothes_party", capType: "magic", label: "洛琪希的衣服：全体魔法上限", value: 5000, requires: ["magic"], target: "洛琪希的衣服", condition: "自身存活时，我方全体魔法伤害上限+5,000" },
      { id: "roxy_clothes_physical", capType: "physical", label: "洛琪希的衣服：全体物理上限", value: 5000, requires: [], target: "洛琪希的衣服", condition: "自身存活时，我方全体物理伤害上限+5,000" },
      { id: "unusual_magician", capType: "ultimate", label: "规格外的魔术师", value: 200000, requires: [], target: "规格外的魔术师", condition: "超必杀技伤害上限+200,000" },
      { id: "transcend_ultimate", capType: "ultimate", label: "【超越】超必杀技增幅II", value: 10000, requires: [], target: "超越·超必杀技增幅II", condition: "超必杀技伤害上限+10,000" }
    ]
  };

  const getCapAttack = () => damageCapCharacter.attacks.find((attack) => attack.id === selectedCapAttack) || damageCapCharacter.attacks[0];
  const getSelectedCapProfile = () => {
    const types = new Set();
    damageCapCharacter.capTypes.filter((type) => selectedCapTypes.has(type.id)).forEach((type) => {
      type.includes.forEach((included) => types.add(included));
    });
    return { types };
  };
  const sourceApplies = (source, tags, types) => types.has(source.capType || "general") && source.requires.every((requirement) => tags.has(requirement));
  const getSourceValue = (source, tags) => {
    const variant = source.variants?.find((candidate) => candidate.requires.every((requirement) => tags.has(requirement)));
    return variant?.value ?? source.value;
  };
  const calculateDamageCap = () => {
    const attack = getCapAttack();
    const profile = getSelectedCapProfile();
    const tags = new Set([...attack.tags, ...selectedCapConditions]);
    const selected = damageCapCharacter.sources.filter((source) => selectedCapSources.has(source.id));
    const applied = selected.filter((source) => sourceApplies(source, tags, profile.types));
    const added = applied.reduce((total, source) => total + getSourceValue(source, tags), 0);
    return { attack, tags, types: profile.types, selected, applied, added, total: attack.baseCap + added };
  };
  const selectAllCapSources = () => {
    const retainedOptionalSources = damageCapCharacter.sources
      .filter((source) => source.autoSelect === false && selectedCapSources.has(source.id))
      .map((source) => source.id);
    selectedCapSources.clear();
    damageCapCharacter.sources.filter((source) => source.autoSelect !== false).forEach((source) => selectedCapSources.add(source.id));
    retainedOptionalSources.forEach((sourceId) => selectedCapSources.add(sourceId));
  };

  const formatValue = (value, unit) => {
    const number = Number(value).toLocaleString("zh-CN");
    return unit === "%" ? `+${number}%` : `+${number}`;
  };

  const normalizeSourceName = (value) => value
    .replace(/^超越[·・]/, "")
    .replace(/[\s（）()【】〖〗·・—–_-]/g, "")
    .toLowerCase();

  const findSourceTarget = (sourceName) => {
    const scope = document.querySelector(".content");
    if (!scope) return null;

    const source = normalizeSourceName(sourceName);
    const labels = [...scope.querySelectorAll(".skill-name, .trait h4, .equipment-card h4")];
    const exact = labels.find((label) => normalizeSourceName(label.textContent) === source);
    const partial = labels.find((label) => {
      const candidate = normalizeSourceName(label.textContent);
      return candidate.startsWith(source) || source.startsWith(candidate);
    });
    const label = exact || partial;
    return label?.closest("tr, .trait, .equipment-card") || label || null;
  };

  const jumpToOriginal = (sourceName) => {
    const target = findSourceTarget(sourceName);
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.remove("source-highlight");
      void target.offsetWidth;
      target.classList.add("source-highlight");
      window.clearTimeout(highlightTimer);
      highlightTimer = window.setTimeout(() => target.classList.remove("source-highlight"), 2600);
    });
  };

  const renderSummary = () => {
    const metrics = new Map();
    bonuses.forEach((bonus) => {
      if (!metrics.has(bonus.key)) metrics.set(bonus.key, { label: bonus.label, unit: bonus.unit, total: 0, providers: [] });
      const metric = metrics.get(bonus.key);
      metric.total += bonus.value;
      metric.providers.push(bonus);
    });

    const visibleMetrics = [...metrics.entries()].filter(([key]) => !hiddenKeys.has(key));
    summary.innerHTML = "";
    if (!visibleMetrics.length) {
      summary.innerHTML = '<div class="bonus-empty">全部词条都已隐藏，可点击“恢复全部”重新显示。</div>';
      return;
    }

    visibleMetrics.forEach(([key, metric]) => {
      const row = document.createElement("section");
      row.className = "bonus-row";
      const isOpen = expanded.has(key);
      row.innerHTML = `
        <div class="bonus-row-head">
          <button class="bonus-row-button" type="button" aria-expanded="${isOpen}">
            <span>${metric.label}</span>
            <strong>${formatValue(metric.total, metric.unit)}</strong>
            <span class="bonus-chevron" aria-hidden="true">${isOpen ? "△" : "▽"}</span>
          </button>
          <button class="bonus-row-remove" type="button" aria-label="隐藏${metric.label}" title="取消显示">×</button>
        </div>
      `;
      const button = row.querySelector(".bonus-row-button");
      button.addEventListener("click", () => {
        if (expanded.has(key)) expanded.delete(key);
        else expanded.add(key);
        renderSummary();
      });
      row.querySelector(".bonus-row-remove").addEventListener("click", () => {
        hiddenKeys.add(key);
        expanded.delete(key);
        renderSummary();
      });
      if (isOpen) {
        const list = document.createElement("ul");
        list.className = "bonus-providers";
        metric.providers.forEach((provider) => {
          const item = document.createElement("li");
          item.className = "bonus-provider";
          item.tabIndex = 0;
          item.title = "双击返回原文并查看完整描述";
          item.setAttribute("aria-label", `${provider.source}，双击返回原文并查看完整描述`);
          item.innerHTML = `
            <div class="bonus-provider-head"><span>${provider.source}</span><span>${formatValue(provider.value, provider.unit)}</span></div>
            <small>${provider.condition}</small>
          `;
          item.addEventListener("dblclick", () => jumpToOriginal(provider.source));
          item.addEventListener("keydown", (event) => {
            if (event.key === "Enter") jumpToOriginal(provider.source);
          });
          list.appendChild(item);
        });
        row.appendChild(list);
      }
      summary.appendChild(row);
    });
  };

  const renderCapCalculator = () => {
    capAttackElement.innerHTML = "";
    damageCapCharacter.attacks.forEach((attack) => {
      const label = document.createElement("label");
      label.className = "cap-condition cap-attack";
      label.innerHTML = `
        <input type="radio" name="capAttack" value="${attack.id}" ${attack.id === selectedCapAttack ? "checked" : ""}>
        <span>${attack.label}</span>
      `;
      label.querySelector("input").addEventListener("change", () => {
        selectedCapAttack = attack.id;
        selectAllCapSources();
        renderCapCalculator();
      });
      capAttackElement.appendChild(label);
    });

    capTypesElement.innerHTML = "";
    damageCapCharacter.capTypes.forEach(({ id, label }) => {
      const option = document.createElement("label");
      option.className = "cap-condition";
      option.innerHTML = `<input type="checkbox" value="${id}" ${selectedCapTypes.has(id) ? "checked" : ""}><span>${label}</span>`;
      option.querySelector("input").addEventListener("change", (event) => {
        if (event.target.checked) selectedCapTypes.add(id);
        else selectedCapTypes.delete(id);
        selectAllCapSources();
        renderCapCalculator();
      });
      capTypesElement.appendChild(option);
    });

    capConditionsElement.innerHTML = "";
    damageCapCharacter.contexts.forEach(({ id, label }) => {
      const option = document.createElement("label");
      option.className = "cap-condition";
      option.innerHTML = `<input type="checkbox" value="${id}" ${selectedCapConditions.has(id) ? "checked" : ""}><span>${label}</span>`;
      option.querySelector("input").addEventListener("change", (event) => {
        if (event.target.checked) selectedCapConditions.add(id);
        else selectedCapConditions.delete(id);
        selectAllCapSources();
        renderCapCalculator();
      });
      capConditionsElement.appendChild(option);
    });

    const result = calculateDamageCap();
    capTotal.textContent = result.total.toLocaleString("zh-CN");
    const typeLabels = damageCapCharacter.capTypes.filter(({ id }) => selectedCapTypes.has(id)).map(({ label }) => label);
    const selectedLabels = damageCapCharacter.contexts.filter(({ id }) => selectedCapConditions.has(id)).map(({ label }) => label);
    const typeScenario = typeLabels.length ? `｜${typeLabels.join(" + ")}` : "｜未选择上限分类";
    const conditionScenario = selectedLabels.length ? `｜${selectedLabels.join(" + ")}` : "";
    capAdded.textContent = `${result.attack.label}：基础 ${result.attack.baseCap.toLocaleString("zh-CN")} + 已叠加 ${result.added.toLocaleString("zh-CN")}${typeScenario}${conditionScenario}`;

    capSourcePicker.innerHTML = "";
    const availableSources = damageCapCharacter.sources.filter((source) => sourceApplies(source, result.tags, result.types));
    availableSources.forEach((source) => {
      const value = getSourceValue(source, result.tags);
      const option = document.createElement("label");
      option.className = `cap-skill-option${selectedCapSources.has(source.id) ? " is-selected" : ""}`;
      option.innerHTML = `
        <input type="checkbox" ${selectedCapSources.has(source.id) ? "checked" : ""}>
        <span>${source.label}</span>
        <strong>+${value.toLocaleString("zh-CN")}</strong>
      `;
      option.querySelector("input").addEventListener("change", (event) => {
        if (event.target.checked) selectedCapSources.add(source.id);
        else selectedCapSources.delete(source.id);
        renderCapCalculator();
      });
      capSourcePicker.appendChild(option);
    });
    if (!availableSources.length) {
      capSourcePicker.innerHTML = '<div class="cap-empty cap-picker-empty">当前分类和附加条件下没有可计入的来源。</div>';
    }

    capBreakdown.innerHTML = "";
    if (!result.applied.length) {
      capBreakdown.innerHTML = '<div class="cap-empty">当前没有满足全部战斗条件并计入总数的上限加成。</div>';
      return;
    }

    result.applied.forEach((source) => {
      const value = getSourceValue(source, result.tags);
      const item = document.createElement("section");
      item.className = "cap-source-option";
      item.innerHTML = `
        <div class="cap-selected-source">
          <span><strong>${source.label}</strong><small>${source.condition}</small></span>
          <b>+${value.toLocaleString("zh-CN")}</b>
          <button type="button" aria-label="取消选择${source.label}" title="取消选择">×</button>
        </div>
      `;
      item.querySelector("button").addEventListener("click", () => {
        selectedCapSources.delete(source.id);
        renderCapCalculator();
      });
      item.addEventListener("dblclick", (event) => {
        if (event.target.closest("button")) return;
        jumpToOriginal(source.target);
      });
      capBreakdown.appendChild(item);
    });
  };

  const isMobile = () => window.matchMedia("(max-width: 720px)").matches;
  const resetPanelPosition = (targetPanel) => {
    targetPanel.style.removeProperty("left");
    targetPanel.style.removeProperty("right");
    targetPanel.style.removeProperty("top");
  };
  const openCalculator = (calculator) => {
    lastOpenedCalculator = calculator;
    const targetPanel = calculator === "bonus" ? panel : capPanel;
    const targetClose = calculator === "bonus" ? closeButton : capCloseButton;
    const otherPanel = calculator === "bonus" ? capPanel : panel;
    if (isMobile()) {
      resetPanelPosition(targetPanel);
      resetPanelPosition(otherPanel);
      otherPanel.hidden = true;
      savedBuildViewer.hidden = true;
    }
    targetPanel.hidden = false;
    targetClose.focus();
  };
  const closeCalculator = (calculator) => {
    if (calculator === "bonus") {
      panel.hidden = true;
      openButton.focus();
    } else {
      capPanel.hidden = true;
      capOpenButton.focus();
    }
  };

  openButton.addEventListener("click", () => openCalculator("bonus"));
  capOpenButton.addEventListener("click", () => openCalculator("cap"));
  closeButton.addEventListener("click", () => closeCalculator("bonus"));
  capCloseButton.addEventListener("click", () => closeCalculator("cap"));
  savedBuildViewerOpen.addEventListener("click", openSavedBuildViewer);
  savedBuildViewerClose.addEventListener("click", () => {
    savedBuildViewer.hidden = true;
    savedBuildViewerOpen.focus();
  });
  savedBuildSort.addEventListener("click", () => {
    savedBuildSortDirection = savedBuildSortDirection === "desc" ? "asc" : "desc";
    renderSavedBuildViewer();
  });
  savedBuildDetails.addEventListener("click", () => {
    savedBuildDetailsOpen = !savedBuildDetailsOpen;
    expandedSavedBuildBonusKey = "";
    renderSavedBuildViewer();
  });
  savedBuildSelect.addEventListener("change", () => {
    selectedSavedBuildId = savedBuildSelect.value;
    savedBuildDetailsOpen = false;
    expandedSavedBuildBonusKey = "";
    renderSavedBuildViewer();
  });
  savedBuildSkills.addEventListener("click", (event) => {
    const button = event.target.closest("[data-saved-bonus-key]");
    if (!button) return;
    const key = String(button.dataset.savedBonusKey);
    expandedSavedBuildBonusKey = expandedSavedBuildBonusKey === key ? "" : key;
    renderSavedBuildViewer();
  });
  overlay.addEventListener("click", () => closeCalculator("bonus"));
  document.querySelectorAll("[data-calculator-target]").forEach((button) => {
    button.addEventListener("click", () => openCalculator(button.dataset.calculatorTarget));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!savedBuildViewer.hidden) {
      savedBuildViewer.hidden = true;
      savedBuildViewerOpen.focus();
      return;
    }
    const activePanel = lastOpenedCalculator === "bonus" ? panel : capPanel;
    if (!activePanel.hidden) closeCalculator(lastOpenedCalculator);
  });

  restoreAllButton.addEventListener("click", () => {
    hiddenKeys.clear();
    renderSummary();
  });
  renderSummary();
  capResetButton.addEventListener("click", () => {
    selectedCapTypes.clear();
    selectedCapConditions.clear();
    selectedCapSources.clear();
    renderCapCalculator();
  });
  selectAllCapSources();
  renderCapCalculator();

  const enableDragging = (targetPanel) => {
    const handle = targetPanel.querySelector(".bonus-calculator-header");
    let dragState = null;
    handle.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") || isMobile()) return;
      const rect = targetPanel.getBoundingClientRect();
      dragState = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      targetPanel.style.left = `${rect.left}px`;
      targetPanel.style.top = `${rect.top}px`;
      targetPanel.style.right = "auto";
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove", (event) => {
      if (!dragState) return;
      const maxLeft = Math.max(8, window.innerWidth - targetPanel.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - targetPanel.offsetHeight - 8);
      targetPanel.style.left = `${Math.min(Math.max(8, event.clientX - dragState.x), maxLeft)}px`;
      targetPanel.style.top = `${Math.min(Math.max(8, event.clientY - dragState.y), maxTop)}px`;
    });
    const stopDragging = () => { dragState = null; };
    handle.addEventListener("pointerup", stopDragging);
    handle.addEventListener("pointercancel", stopDragging);
  };
  enableDragging(panel);
  enableDragging(capPanel);
  enableDragging(savedBuildViewer);

  window.matchMedia("(max-width: 720px)").addEventListener("change", (event) => {
    if (!event.matches) return;
    resetPanelPosition(panel);
    resetPanelPosition(capPanel);
    resetPanelPosition(savedBuildViewer);
    if (!savedBuildViewer.hidden) {
      panel.hidden = true;
      capPanel.hidden = true;
      return;
    }
    if (panel.hidden || capPanel.hidden) return;
    if (lastOpenedCalculator === "bonus") capPanel.hidden = true;
    else panel.hidden = true;
  });

  if (selectedSavedBuildId) {
    openSavedBuildViewer();
    history.replaceState(null, "", `${location.pathname}${location.hash}`);
  }
})();
