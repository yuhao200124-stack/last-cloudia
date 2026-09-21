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
  const capConditionsElement = document.getElementById("capConditions");
  const capBreakdown = document.getElementById("capBreakdown");
  const capTotal = document.getElementById("capTotal");
  const capAdded = document.getElementById("capAdded");
  const expanded = new Set();
  const hiddenKeys = new Set();
  const selectedCapConditions = new Set();
  let lastOpenedCalculator = "bonus";
  let highlightTimer = null;

  const baseDamageCap = 9999;
  const capConditionOptions = [
    ["magic", "魔法"],
    ["exclusive_magic", "专属魔法"],
    ["critical", "暴击"],
    ["boss", "BOSS"],
    ["ice", "冰属性"],
    ["special", "特攻"],
    ["physical", "物理"],
    ["ultimate", "超必杀技"]
  ];
  const capRequirements = {
    ice_cap: ["ice"],
    ice_magic_cap: ["ice", "magic"],
    boss_ice_magic_cap: ["ice", "magic", "boss"],
    magic_cap: ["magic"],
    boss_magic_cap: ["magic", "boss"],
    exclusive_magic_cap: ["exclusive_magic"],
    boss_exclusive_magic_cap: ["exclusive_magic", "boss"],
    critical_cap: ["critical"],
    boss_critical_cap: ["critical", "boss"],
    magic_critical_cap: ["magic", "critical"],
    boss_magic_critical_cap: ["magic", "critical", "boss"],
    exclusive_magic_critical_cap: ["exclusive_magic", "critical"],
    boss_exclusive_magic_critical_cap: ["exclusive_magic", "critical", "boss"],
    special_cap: ["special"],
    physical_cap: ["physical"],
    ultimate_cap: ["ultimate"]
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
    const isTranscend = /^超越[·・]/.test(sourceName);
    const scope = isTranscend ? document.getElementById("transcend") : document.querySelector(".content");
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
    capConditionsElement.innerHTML = "";
    capConditionOptions.forEach(([key, label]) => {
      const option = document.createElement("label");
      option.className = "cap-condition";
      option.innerHTML = `<input type="checkbox" value="${key}" ${selectedCapConditions.has(key) ? "checked" : ""}><span>${label}</span>`;
      option.querySelector("input").addEventListener("change", (event) => {
        if (event.target.checked) selectedCapConditions.add(key);
        else selectedCapConditions.delete(key);
        renderCapCalculator();
      });
      capConditionsElement.appendChild(option);
    });

    const effectiveCapConditions = new Set(selectedCapConditions);
    if (effectiveCapConditions.has("exclusive_magic")) effectiveCapConditions.add("magic");

    const applied = bonuses.filter((bonus) => {
      const requirements = capRequirements[bonus.key];
      return requirements && requirements.every((condition) => effectiveCapConditions.has(condition));
    });
    const addedValue = applied.reduce((total, bonus) => total + bonus.value, 0);
    capTotal.textContent = (baseDamageCap + addedValue).toLocaleString("zh-CN");

    const selectedLabels = capConditionOptions
      .filter(([key]) => selectedCapConditions.has(key))
      .map(([, label]) => label);
    const scenario = selectedLabels.length ? `｜${selectedLabels.join(" + ")}` : "";
    capAdded.textContent = `基础 9,999 + 已叠加 ${addedValue.toLocaleString("zh-CN")}${scenario}`;

    capBreakdown.innerHTML = "";
    if (!applied.length) {
      capBreakdown.innerHTML = '<div class="cap-empty">勾选伤害条件后，这里会列出所有计入的角色技能、装备和通用技能。</div>';
      return;
    }

    const groups = new Map();
    applied.forEach((bonus) => {
      if (!groups.has(bonus.key)) groups.set(bonus.key, { label: bonus.label, total: 0, providers: [] });
      const group = groups.get(bonus.key);
      group.total += bonus.value;
      group.providers.push(bonus);
    });

    groups.forEach((group) => {
      const section = document.createElement("section");
      section.className = "cap-breakdown-group";
      section.innerHTML = `<div class="cap-breakdown-title"><span>${group.label}</span><strong>+${group.total.toLocaleString("zh-CN")}</strong></div>`;
      const list = document.createElement("ul");
      list.className = "cap-source-list";
      group.providers.forEach((provider) => {
        const item = document.createElement("li");
        item.className = "cap-source";
        item.tabIndex = 0;
        item.title = "双击定位原文并查看完整描述";
        item.innerHTML = `
          <div class="cap-source-head"><span>${provider.source}</span><strong>+${provider.value.toLocaleString("zh-CN")}</strong></div>
          <small>${provider.condition}</small>
        `;
        item.addEventListener("dblclick", () => jumpToOriginal(provider.source));
        item.addEventListener("keydown", (event) => {
          if (event.key === "Enter") jumpToOriginal(provider.source);
        });
        list.appendChild(item);
      });
      section.appendChild(list);
      capBreakdown.appendChild(section);
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
  overlay.addEventListener("click", () => closeCalculator("bonus"));
  document.querySelectorAll("[data-calculator-target]").forEach((button) => {
    button.addEventListener("click", () => openCalculator(button.dataset.calculatorTarget));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const activePanel = lastOpenedCalculator === "bonus" ? panel : capPanel;
    if (!activePanel.hidden) closeCalculator(lastOpenedCalculator);
  });

  restoreAllButton.addEventListener("click", () => {
    hiddenKeys.clear();
    renderSummary();
  });
  renderSummary();
  capResetButton.addEventListener("click", () => {
    selectedCapConditions.clear();
    renderCapCalculator();
  });
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

  window.matchMedia("(max-width: 720px)").addEventListener("change", (event) => {
    if (!event.matches) return;
    resetPanelPosition(panel);
    resetPanelPosition(capPanel);
    if (panel.hidden || capPanel.hidden) return;
    if (lastOpenedCalculator === "bonus") capPanel.hidden = true;
    else panel.hidden = true;
  });
})();
