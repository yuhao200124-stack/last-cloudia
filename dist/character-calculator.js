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
  const capSourcePicker = document.getElementById("capSourcePicker");
  const capTotal = document.getElementById("capTotal");
  const capAdded = document.getElementById("capAdded");
  const capAttackElement = document.getElementById("capAttacks");
  const expanded = new Set();
  const hiddenKeys = new Set();
  const selectedCapConditions = new Set();
  const selectedCapSources = new Set();
  let selectedCapAttack = "zeno_claion";
  let lastOpenedCalculator = "bonus";
  let highlightTimer = null;

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
    sources: [
      { id: "water_master", label: "水王级魔术师", value: 60000, requires: ["ice", "single_weapon"], target: "水王级魔术师", condition: "仅装备1件武器时，冰属性伤害上限+60,000" },
      { id: "mentor_special", label: "指导者：特攻发生时", value: 30000, requires: ["special"], target: "指导者", condition: "指导者增益生效且触发特攻" },
      { id: "mentor_boss_wave", label: "指导者：BOSS Wave", value: 20000, requires: ["ice", "boss"], target: "指导者", condition: "BOSS Wave开始后的冰属性上限增益" },
      { id: "magic_guidance", label: "魔术指导", value: 30000, requires: ["magic"], target: "魔术指导", condition: "魔法增益生效期间" },
      { id: "short_cast", label: "缩短咏唱：装备法杖", value: 30000, requires: ["magic"], target: "缩短咏唱", condition: "装备法杖时，魔法伤害上限+30,000" },
      { id: "magic_resonance", label: "魔术共鸣：重魔法期间", value: 50000, requires: ["ice", "non_stackable_magic"], target: "魔术共鸣", condition: "我方发动不可叠加魔法期间" },
      { id: "special_limit_v", label: "特攻界限突破V", value: 7500, variants: [{ requires: ["single_weapon"], value: 15000 }], requires: ["special"], target: "特攻界限突破V", condition: "触发特攻时+7,500；单武器时变为+15,000" },
      { id: "giant_purge_v", label: "巨型净化V：BOSS", value: 10000, requires: ["magic", "boss"], target: "巨型净化V", condition: "对BOSS发动魔法攻击" },
      { id: "ice_critical_mod", label: "冰属性暴击·改", value: 2000, requires: ["ice", "magic"], target: "冰属性暴击·改", condition: "使冰属性魔法可以暴击，并使冰属性魔法上限+2,000" },
      { id: "staff_ultimate", label: "法杖究极增幅", value: 5000, requires: ["magic"], target: "法杖究极增幅", condition: "装备法杖时，魔法伤害上限+5,000" },
      { id: "ice_super_boost", label: "冰系超级增幅", value: 2000, requires: ["ice", "magic"], target: "冰系超级增幅", condition: "冰属性魔法伤害上限+2,000" },
      { id: "ice_billion_boost", label: "冰系究极增幅", value: 5000, requires: ["ice", "magic"], target: "冰系究极增幅", condition: "冰属性魔法伤害上限+5,000" },
      { id: "ice_attack_iii", label: "冰属性攻击提升III", value: 2000, requires: ["ice"], target: "冰属性攻击提升III", condition: "冰属性攻击" },
      { id: "giant_purge_iii", label: "巨型净化III：BOSS", value: 4000, requires: ["magic", "boss"], target: "巨型净化III", condition: "对BOSS发动魔法攻击时，伤害上限+4,000" },
      { id: "special_limit_iii", label: "特攻界限突破III", value: 3000, variants: [{ requires: ["single_weapon"], value: 6000 }], requires: ["special"], target: "特攻界限突破III", condition: "触发特攻时+3,000；单武器时变为+6,000" },
      { id: "transcend_special_limit", label: "【超越】特攻界限突破", value: 10000, variants: [{ requires: ["single_weapon"], value: 20000 }], requires: ["special"], target: "超越·特攻界限突破", condition: "触发特攻时+10,000；单武器或无武器时变为+20,000" },
      { id: "roxy_staff_ice", label: "洛琪希之杖：冰魔法", value: 6000, requires: ["ice", "magic", "single_weapon"], target: "洛琪希之杖", condition: "仅装备1件武器时，冰属性魔法伤害上限+6,000" },
      { id: "roxy_staff_special", label: "洛琪希之杖：特攻", value: 5000, requires: ["special"], target: "洛琪希之杖", condition: "触发特攻时，伤害上限+5,000" },
      { id: "roxy_clothes_boss_ice", label: "洛琪希的衣服：对BOSS冰魔法", value: 5000, requires: ["boss", "ice", "magic"], target: "洛琪希的衣服", condition: "对BOSS的冰属性魔法伤害上限+5,000" },
      { id: "roxy_clothes_party", label: "洛琪希的衣服：全体上限", value: 5000, requires: ["magic"], target: "洛琪希的衣服", condition: "自身存活时，我方全体魔法伤害上限+5,000" }
    ]
  };

  const getCapAttack = () => damageCapCharacter.attacks.find((attack) => attack.id === selectedCapAttack) || damageCapCharacter.attacks[0];
  const sourceApplies = (source, tags) => source.requires.every((requirement) => tags.has(requirement));
  const getSourceValue = (source, tags) => {
    const variant = source.variants?.find((candidate) => candidate.requires.every((requirement) => tags.has(requirement)));
    return variant?.value ?? source.value;
  };
  const calculateDamageCap = () => {
    const attack = getCapAttack();
    const tags = new Set([...attack.tags, ...selectedCapConditions]);
    const selected = damageCapCharacter.sources.filter((source) => selectedCapSources.has(source.id));
    const applied = selected.filter((source) => sourceApplies(source, tags));
    const added = applied.reduce((total, source) => total + getSourceValue(source, tags), 0);
    return { attack, tags, selected, applied, added, total: attack.baseCap + added };
  };
  const selectAllCapSources = () => {
    selectedCapSources.clear();
    damageCapCharacter.sources.forEach((source) => selectedCapSources.add(source.id));
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
    const selectedLabels = damageCapCharacter.contexts.filter(({ id }) => selectedCapConditions.has(id)).map(({ label }) => label);
    const scenario = selectedLabels.length ? `｜${selectedLabels.join(" + ")}` : "";
    capAdded.textContent = `${result.attack.label}：基础 ${result.attack.baseCap.toLocaleString("zh-CN")} + 已叠加 ${result.added.toLocaleString("zh-CN")}${scenario}`;

    capSourcePicker.innerHTML = "";
    damageCapCharacter.sources.filter((source) => sourceApplies(source, result.tags)).forEach((source) => {
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

  window.matchMedia("(max-width: 720px)").addEventListener("change", (event) => {
    if (!event.matches) return;
    resetPanelPosition(panel);
    resetPanelPosition(capPanel);
    if (panel.hidden || capPanel.hidden) return;
    if (lastOpenedCalculator === "bonus") capPanel.hidden = true;
    else panel.hidden = true;
  });
})();
