(() => {
  const panel = document.getElementById("damageSimulator");
  const backdrop = document.getElementById("damageSimulatorBackdrop");
  const openButton = document.getElementById("damageSimulatorOpen");
  const closeButton = document.getElementById("damageSimulatorClose");
  if (!panel || !backdrop || !openButton || !closeButton) return;

  const $ = id => document.getElementById(id);
  const number = id => Number($(id)?.value) || 0;
  const format = value => Math.max(0, Math.round(value)).toLocaleString("zh-CN");
  const formatPrecise = value => Number(Number(value).toFixed(2)).toLocaleString("zh-CN");
  const percent = value => `${value >= 0 ? "+" : ""}${Number(value.toFixed(1))}%`;
  const presets = {
    skill1: { name: "特技1", ratio: .368 },
    skill2: { name: "特技2", ratio: .357 },
    skill3: { name: "特技3", ratio: .347 },
    ultimate: { name: "必杀", ratio: 1.101 },
    magic: { name: "魔法", ratio: 1 },
    heavy_magic: { name: "重魔法", ratio: 1 }
  };
  const magicPresets = {
    "270090": { name: "泽诺克莱昂", ratio: .52 },
    "291020": { name: "冰霜新星", ratio: .652 }
  };
  let innateSkills = [];
  let bonusLayout = "skill";
  let auditFilter = "all";
  let latestAuditEntries = [];
  const auditStorageKey = `lc-damage-audit-hidden:${document.body.dataset.characterId || "default"}`;
  const blessingStorageKey = `lc-damage-blessing-int:${document.body.dataset.characterId || "default"}`;
  const auditHiddenKeys = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(auditStorageKey) || "[]");
    if (Array.isArray(stored)) stored.forEach(key => auditHiddenKeys.add(String(key)));
  } catch { /* Ignore malformed local audit data. */ }
  try {
    const storedBlessing = localStorage.getItem(blessingStorageKey);
    if (storedBlessing !== null && Number.isFinite(Number(storedBlessing))) $("damageBlessingInt").value = storedBlessing;
  } catch { /* Ignore unavailable local storage. */ }
  const saveAuditHiddenKeys = () => localStorage.setItem(auditStorageKey, JSON.stringify([...auditHiddenKeys]));
  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const readPageStats = () => {
    const stats = [...document.querySelectorAll(".stat-box")];
    const read = label => {
      const box = stats.find(item => item.querySelector("span")?.textContent.trim() === label);
      return Number(box?.querySelector("strong")?.textContent.replaceAll(",", "")) || 0;
    };
    const name = document.querySelector(".hero h2")?.textContent.trim() || "当前角色";
    $("damageCharacterAtk").value = read("攻击力") || 0;
    $("damageCharacterInt").value = read("法强") || 0;
    $("damageSimulatorCharacterName").textContent = name;
    $("damageSimulatorCharacterLabel").textContent = `${name} · 当前角色`;
  };

  const readInnateSkills = () => {
    const records = [];
    document.querySelectorAll("#traits .trait").forEach(item => records.push({
      source: "个性",
      name: item.querySelector("h4")?.textContent.trim() || "未命名个性",
      effect: item.querySelector("p")?.textContent.trim() || ""
    }));
    [
      ["#exclusive-skills tbody tr", "专属技能"],
      ["#common-skills tbody tr", "通用/超越"]
    ].forEach(([selector, source]) => document.querySelectorAll(selector).forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return;
      records.push({
        source,
        name: row.querySelector(".skill-name")?.textContent.trim() || cells[0].textContent.trim(),
        effect: cells[cells.length - 1].textContent.trim()
      });
    }));
    document.querySelectorAll("#equipment .equipment-card").forEach(card => {
      const entries = [...card.querySelectorAll("dt")];
      const type = entries.find(item => item.textContent.trim() === "类型")?.nextElementSibling?.textContent.trim() || "";
      const stats = entries.find(item => item.textContent.trim() === "最高属性")?.nextElementSibling?.textContent.trim() || "";
      const effect = entries.find(item => item.textContent.trim() === "最高效果")?.nextElementSibling?.textContent.trim() || "";
      if (!effect) return;
      const atk = stats.match(/(?:STR|攻击力)\+([\d,]+)/);
      const int = stats.match(/(?:INT|法强)\+([\d,]+)/);
      records.push({
        source: "专武",
        name: card.querySelector("h4")?.textContent.trim() || "专属武器",
        effect,
        equipmentType: type,
        fixedAtk: atk ? Number(atk[1].replaceAll(",", "")) : 0,
        fixedInt: int ? Number(int[1].replaceAll(",", "")) : 0
      });
    });
    innateSkills = records;
  };

  const state = () => {
    const skill = $("damageSkill").value;
    const type = $("damageType").value;
    const element = $("damageElement").value;
    const allText = innateSkills.map(item => item.effect).join("；");
    const isSpecial = ["skill1", "skill2", "skill3"].includes(skill);
    const isMagicMode = ["magic", "heavy_magic"].includes(skill);
    const bossRace = $("damageBossRace").value;
    const bossSpecial = bossRace !== "未知" && Boolean($("damageBossName").value.trim());
    return {
      skill, type, element, isSpecial, isMagicMode, bossSpecial, bossRace,
      weak: element === $("damageBossWeakElement").value,
      singleWeapon: true,
      staff: true,
      robe: true,
      fullHp: true,
      magicActive: true,
      magicChain: true,
      exclusiveWeapon: $("damageUseExclusiveWeapon").checked
    };
  };

  const emptyParsedBonus = record => ({
    source: record.group || "基础计算器",
    name: record.source || record.label,
    effect: record.condition || "",
    statPct: 0,
    fixedStat: 0,
    staffFixed: 0,
    robeFixed: 0,
    otherFixed: 0,
    staffStatPct: 0,
    robeStatPct: 0,
    damagePct: 0,
    cap: 0,
    hitMultiplier: 1,
    hitDamageMultiplier: 1,
    parts: [],
    contributions: []
  });

  const addParsedContribution = (result, kind, label, value, unit, text) => {
    result.parts.push(text);
    result.contributions.push({ kind, key: `${kind}:${label}`, label, value, unit, text });
  };

  const baseBonusApplies = (bonus, current) => {
    const key = bonus.key;
    if (bonus.group === "equipment" && !current.exclusiveWeapon) return false;
    if (key === "int_pct") return current.type === "魔法";
    if (key === "str_pct") return current.type === "物理";
    if (key === "staff_int") return current.type === "魔法" && current.exclusiveWeapon;
    if (key === "robe_int") return current.type === "魔法" && current.exclusiveWeapon;
    if (key === "ice_damage" || key === "ice_cap") return current.element === "冰";
    if (key === "ice_magic_damage" || key === "ice_magic_cap") return current.type === "魔法" && current.element === "冰";
    if (key === "magic_damage" || key === "magic_cap") return current.type === "魔法";
    if (key === "physical_damage" || key === "physical_cap") return current.type === "物理";
    if (key === "special_damage" || key === "special_cap") return current.bossSpecial;
    if (key === "boss_magic_damage" || key === "boss_magic_cap") return current.type === "魔法";
    if (key === "boss_ice_magic_cap") return current.type === "魔法" && current.element === "冰";
    if (key === "spell_link_damage") return current.type === "魔法" && current.magicChain;
    if (key === "weak_magic_damage") return current.type === "魔法" && current.weak;
    if (key === "ultimate_damage" || key === "ultimate_cap") return current.skill === "ultimate";
    return false;
  };

  const auditKeyFor = bonus => [bonus.key, bonus.source, bonus.value, bonus.condition].join("::");
  const bonusAuditKind = bonus => {
    if (["int_pct", "str_pct", "staff_int", "robe_int"].includes(bonus.key)) return "stat";
    return bonus.key.endsWith("_cap") ? "cap" : "damage";
  };
  const bonusAuditGroup = bonus => ({
    int_pct: "法强",
    str_pct: "攻击力",
    staff_int: "法杖法强属性",
    robe_int: "长袍法强属性",
    ice_damage: "冰属性伤害",
    ice_magic_damage: "冰属性魔法伤害",
    magic_damage: "魔法伤害",
    physical_damage: "物理伤害",
    boss_magic_damage: "对Boss魔法伤害",
    special_damage: "特攻伤害",
    spell_link_damage: "同魔法连续伤害",
    weak_magic_damage: "弱点魔法伤害",
    ultimate_damage: "超必杀技伤害",
    ice_cap: "冰属性伤害上限",
    ice_magic_cap: "冰属性魔法上限",
    magic_cap: "魔法伤害上限",
    physical_cap: "物理伤害上限",
    boss_ice_magic_cap: "对Boss冰魔法上限",
    boss_magic_cap: "对Boss魔法上限",
    special_cap: "特攻伤害上限",
    ultimate_cap: "超必杀技伤害上限"
  })[bonus.key] || bonus.label;
  const auditGroupOrder = [
    "法强", "攻击力", "法杖法强属性", "长袍法强属性",
    "冰属性伤害", "冰属性魔法伤害", "魔法伤害", "物理伤害", "对Boss魔法伤害", "特攻伤害", "同魔法连续伤害", "弱点魔法伤害", "超必杀技伤害",
    "冰属性伤害上限", "冰属性魔法上限", "魔法伤害上限", "物理伤害上限", "对Boss冰魔法上限", "对Boss魔法上限", "特攻伤害上限", "超必杀技伤害上限"
  ];

  const normalizeSkillName = value => String(value || "")
    .replace(/^【超越】/, "")
    .replace(/^超越[·・]/, "")
    .replace(/[\s·・]/g, "")
    .toLowerCase();

  const fullEffectFor = bonus => {
    const target = normalizeSkillName(bonus.source);
    const record = innateSkills.find(item => normalizeSkillName(item.name) === target);
    return record?.effect || bonus.condition || "暂无完整效果说明";
  };

  const renderAudit = () => {
    const auditPanel = $("damageAuditPanel");
    if (!auditPanel || auditPanel.hidden) return;
    const entries = latestAuditEntries.filter(entry => auditFilter === "all" || entry.kind === auditFilter);
    const groups = new Map();
    entries.forEach(entry => {
      if (!groups.has(entry.group)) groups.set(entry.group, []);
      groups.get(entry.group).push(entry);
    });
    const sortedGroups = [...groups.entries()].sort((a, b) => {
      const left = auditGroupOrder.indexOf(a[0]);
      const right = auditGroupOrder.indexOf(b[0]);
      return (left < 0 ? 999 : left) - (right < 0 ? 999 : right) || a[0].localeCompare(b[0], "zh-CN");
    });
    $("damageAuditList").innerHTML = sortedGroups.length ? sortedGroups.map(([group, items]) => {
      const activeTotal = items.filter(item => !auditHiddenKeys.has(item.auditKey)).reduce((sum, item) => sum + Number(item.value || 0), 0);
      const unit = items[0]?.unit === "%" ? "%" : "";
      return `<section class="damage-audit-group"><header><h4>${escapeHtml(group)}</h4><strong>当前 +${activeTotal.toLocaleString("zh-CN")}${unit}</strong></header>${items.map(item => {
        const removed = auditHiddenKeys.has(item.auditKey);
        const shownValue = item.unit === "%" ? `+${item.value}%` : `+${Number(item.value).toLocaleString("zh-CN")}`;
        return `<article class="damage-audit-item${removed ? " is-removed" : ""}"><div><b>${escapeHtml(item.source)}</b><small>触发条件：${escapeHtml(item.condition || "常驻")}</small></div><span>${escapeHtml(item.label)}</span><strong>${shownValue}</strong><button type="button" data-audit-key="${escapeHtml(item.auditKey)}">${removed ? "恢复" : "删除"}</button><p class="damage-audit-effect"><em>完整效果</em>${escapeHtml(item.fullEffect)}</p></article>`;
      }).join("")}</section>`;
    }).join("") : '<p class="damage-audit-empty">当前攻击条件下没有这一类加成。</p>';
    const removedCount = entries.filter(entry => auditHiddenKeys.has(entry.auditKey)).length;
    $("damageAuditNote").textContent = `按同类加成分组，共 ${entries.length} 项；已删除 ${removedCount} 项。删除后会立即重新计算。`;
    $("damageAuditRestoreAll").disabled = auditHiddenKeys.size === 0;
  };

  const openAudit = (kind = "all") => {
    auditFilter = kind;
    $("damageAuditPanel").hidden = false;
    $("damageAuditBackdrop").hidden = false;
    $("damageAuditPanel").querySelectorAll("[data-audit-filter]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.auditFilter === auditFilter)));
    renderAudit();
  };
  const closeAudit = () => {
    $("damageAuditPanel").hidden = true;
    $("damageAuditBackdrop").hidden = true;
  };

  const parseBaseBonus = (bonus, current) => {
    const result = emptyParsedBonus(bonus);
    if (!baseBonusApplies(bonus, current)) return result;
    const statLabel = current.type === "魔法" ? "法强" : "攻击力";
    const value = Number(bonus.value) || 0;
    const text = `${bonus.label} ${bonus.unit === "%" ? percent(value) : `+${value.toLocaleString("zh-CN")}`}`;
    if (bonus.key === "int_pct" || bonus.key === "str_pct") {
      result.statPct += value;
      addParsedContribution(result, "stat", statLabel, value, "%", text);
    } else if (bonus.key === "staff_int") {
      result.staffStatPct += value;
      addParsedContribution(result, "weapon", "法杖法强属性增幅", value, "%", text);
    } else if (bonus.key === "robe_int") {
      result.robeStatPct += value;
      addParsedContribution(result, "weapon", "长袍法强属性增幅", value, "%", text);
    } else if (bonus.key.endsWith("_cap")) {
      result.cap += value;
      addParsedContribution(result, "cap", bonus.label, value, "number", text);
    } else {
      result.damagePct += value;
      addParsedContribution(result, "damage", bonus.label, value, "%", text);
    }
    return result;
  };

  const parseBlessingBonus = current => {
    const result = emptyParsedBonus({ group: "加护", source: "加护法强" });
    if (current.type !== "魔法") return result;
    const value = Math.max(0, number("damageBlessingInt"));
    if (!value) return result;
    result.statPct = value;
    addParsedContribution(result, "stat", "法强", value, "%", `加护法强 ${percent(value)}`);
    return result;
  };

  const parseExclusiveEquipmentFixedStats = current => innateSkills.filter(item => item.source === "专武").map(equipment => {
    const result = emptyParsedBonus({ group: "专属装备", source: equipment.name });
    if (!current.exclusiveWeapon) return result;
    const statLabel = current.type === "魔法" ? "法强" : "攻击力";
    const fixed = current.type === "魔法" ? equipment.fixedInt : equipment.fixedAtk;
    if (!fixed) return result;
    if (/法杖/.test(equipment.equipmentType)) result.staffFixed = fixed;
    else if (/长袍/.test(equipment.equipmentType)) result.robeFixed = fixed;
    else result.otherFixed = fixed;
    result.fixedStat = fixed;
    addParsedContribution(result, "fixed", `${equipment.equipmentType}${statLabel}`, fixed, "number", `${equipment.name}${statLabel} +${fixed.toLocaleString("zh-CN")}`);
    return result;
  });

  const parseHitRule = current => {
    const result = emptyParsedBonus({ group: "个性", source: "水王级魔术师" });
    if (current.type === "魔法" && current.element === "冰") {
      result.hitMultiplier = 2;
      result.hitDamageMultiplier = .6;
      addParsedContribution(result, "special", "冰属性魔法Hit规则", 1.2, "special", "Hit数×2、单段伤害×60%（整套×1.2）");
    }
    return result;
  };

  const clauseAt = (text, index) => {
    const left = Math.max(text.lastIndexOf("；", index), text.lastIndexOf("。", index)) + 1;
    const rightMarks = [text.indexOf("；", index), text.indexOf("。", index)].filter(value => value >= 0);
    const right = rightMarks.length ? Math.min(...rightMarks) : text.length;
    return text.slice(left, right);
  };

  const conditionsPass = (text, current) => {
    if (/触发特攻/.test(text) && !current.bossSpecial) return false;
    if (/命中弱点属性/.test(text) && !(current.type === "魔法" && current.weak)) return false;
    return true;
  };

  const categoryPass = (label, current) => {
    const elements = [...label.matchAll(/[火冰树雷光暗]/g)].map(match => match[0]);
    if (elements.length && !elements.includes(current.element)) return false;
    if (label.includes("超必杀技") && current.skill !== "ultimate") return false;
    if (label.includes("特技") && !current.isSpecial) return false;
    if (label.includes("魔法") && current.type !== "魔法") return false;
    if (label.includes("物理") && current.type !== "物理") return false;
    return true;
  };

  const parseSkill = (record, current) => {
    const effect = record.effect;
    const result = emptyParsedBonus(record);
    const add = (kind, label, value, unit, text) => {
      result.parts.push(text);
      result.contributions.push({ kind, key: `${kind}:${label}`, label, value, unit, text });
    };
    const statLabel = current.type === "魔法" ? "法强" : "攻击力";
    if (record.source === "专武") {
      const fixed = current.type === "魔法" ? record.fixedInt : record.fixedAtk;
      if (fixed) {
        result.fixedStat += fixed;
        if (/法杖/.test(record.equipmentType)) result.staffFixed += fixed;
        else if (/长袍/.test(record.equipmentType)) result.robeFixed += fixed;
        else result.otherFixed += fixed;
        add("fixed", `${statLabel}固定值`, fixed, "number", `专武${statLabel}固定值 +${fixed.toLocaleString("zh-CN")}`);
      }
    }
    if (current.exclusiveWeapon) {
      const weaponBoost = current.type === "魔法" ? effect.match(/法杖的INT[^+]*\+([\d.]+)%/) : effect.match(/(?:武器|剑|斧|枪|弓|爪|锤|刀)的(?:STR|攻击力)[^+]*\+([\d.]+)%/);
      if (weaponBoost) {
        const value = Number(weaponBoost[1]);
        result.staffStatPct += value;
        add("weapon", `专武${statLabel}增幅`, value, "%", `专武${statLabel} ${percent(value)}`);
      }
    }
    const percentagePattern = /((?:(?:[火冰树雷光暗]、)*[火冰树雷光暗]属性)?(?:物理|魔法|超必杀技|特技)?伤害)\+([\d.]+)%/g;
    for (const match of effect.matchAll(percentagePattern)) {
      const prefix = effect.slice(Math.max(0, match.index - 8), match.index);
      if (/暴击$|受到[^，。；]*$/.test(prefix)) continue;
      const clause = clauseAt(effect, match.index);
      if (!conditionsPass(clause, current) || !categoryPass(match[1], current)) continue;
      const value = Number(match[2]);
      result.damagePct += value;
      add("damage", match[1], value, "%", `${match[1]} ${percent(value)}`);
    }

    if (/连续使用相同攻击魔法时伤害提升/.test(effect) && current.type === "魔法" && current.magicChain) {
      const maximum = effect.match(/最高\+([\d.]+)%/);
      if (maximum) {
        const value = Number(maximum[1]);
        result.damagePct += value;
        add("damage", "伤害", value, "%", `连续魔法最高 ${percent(value)}`);
      }
    }

    const statPattern = /([^+；。]{1,32})\+([\d.]+)%/g;
    for (const match of effect.matchAll(statPattern)) {
      const label = match[1].split(/[，]/).pop().trim();
      if (/法杖的|长袍的|装备的/.test(label)) continue;
      const wantsInt = /INT|法强/.test(label) && current.type === "魔法";
      const wantsAtk = /攻击力|STR/.test(label) && current.type === "物理";
      if (!wantsInt && !wantsAtk) continue;
      const clause = clauseAt(effect, match.index);
      if (!conditionsPass(clause, current)) continue;
      const value = Number(match[2]);
      result.statPct += value;
      add("stat", statLabel, value, "%", `${statLabel} ${percent(value)}`);
    }

    const capPattern = /((?:(?:[火冰树雷光暗]、)*[火冰树雷光暗]属性)?(?:魔法|物理|超必杀技|特技)?伤害上限)\+([\d,]+)/g;
    for (const match of effect.matchAll(capPattern)) {
      const clause = clauseAt(effect, match.index);
      const categoryText = match[1] === "伤害上限" ? clause : match[1];
      if (!conditionsPass(clause, current) || !categoryPass(categoryText, current)) continue;
      let value = Number(match[2].replaceAll(",", ""));
      const following = effect.slice(match.index + match[0].length);
      const upgraded = following.match(/仅装备1件武器(?:或未装备武器)?时(?:提升)?为\+([\d,]+)/);
      if (upgraded && current.singleWeapon) value = Number(upgraded[1].replaceAll(",", ""));
      result.cap += value;
      add("cap", match[1], value, "number", `${match[1]} +${value.toLocaleString("zh-CN")}`);
    }

    if (current.type === "魔法" && current.element === "冰" && /冰属性魔法Hit数变为2倍[^。；]*单次伤害降至60%/.test(effect)) {
      result.hitMultiplier = 2;
      result.hitDamageMultiplier = .6;
      add("special", "冰属性魔法Hit规则", 1.2, "special", "Hit数×2、单段伤害×60%（整套×1.2）");
    }
    return result;
  };

  const renderBySkill = active => active.map(item =>
    `<article class="damage-innate-item"><b>${item.source} · ${item.name}</b><span>${item.parts.join("；")}</span></article>`
  ).join("");

  const renderByBonus = active => {
    const grouped = new Map();
    active.forEach(item => item.contributions.forEach(part => {
      if (!grouped.has(part.key)) grouped.set(part.key, { ...part, total: 0, sources: [] });
      const group = grouped.get(part.key);
      if (part.unit !== "special") group.total += part.value;
      group.sources.push(`${item.source} · ${item.name}（${part.text}）`);
    }));
    const order = { stat: 0, fixed: 1, weapon: 2, damage: 3, cap: 4, special: 5 };
    return [...grouped.values()].sort((a, b) => order[a.kind] - order[b.kind] || a.label.localeCompare(b.label, "zh-CN")).map(group => {
      const total = group.unit === "%" ? percent(group.total) : group.unit === "number" ? `+${group.total.toLocaleString("zh-CN")}` : "特殊规则";
      return `<article class="damage-innate-item is-bonus-group"><b>${group.label}<em>${total}</em></b><span>${group.sources.join("；")}</span></article>`;
    }).join("");
  };

  // 实测分区：属性伤害与同属性、同攻击类型的限定伤害属于同一属性乘区。
  // 目前已由“冰属性伤害 +20%”和“冰属性魔法伤害 +10%”的逐段实伤确认。
  const damageMultiplierGroup = label => {
    const normalized = String(label || "通用伤害").trim();
    if (normalized === "冰属性伤害" || normalized === "冰属性魔法伤害") return "冰属性伤害区";
    return normalized;
  };

  const renderInnate = active => {
    const totalStat = active.reduce((sum, item) => sum + item.statPct, 0);
    const totalFixed = active.reduce((sum, item) => sum + item.fixedStat, 0);
    const staffFixed = active.reduce((sum, item) => sum + item.staffFixed, 0);
    const robeFixed = active.reduce((sum, item) => sum + item.robeFixed, 0);
    const otherFixed = active.reduce((sum, item) => sum + item.otherFixed, 0);
    const staffStatPct = active.reduce((sum, item) => sum + item.staffStatPct, 0);
    const robeStatPct = active.reduce((sum, item) => sum + item.robeStatPct, 0);
    // 游戏面板会先分别结算法杖、长袍的属性增幅，再进入角色百分比加成。
    // 例如长袍 229 × 150% = 343.5，会先四舍五入为 344。
    const effectiveStaffFixed = Math.round(staffFixed * (1 + staffStatPct / 100));
    const effectiveRobeFixed = Math.round(robeFixed * (1 + robeStatPct / 100));
    const effectiveFixed = effectiveStaffFixed + effectiveRobeFixed + otherFixed;
    const totalDamage = active.reduce((sum, item) => sum + item.damagePct, 0);
    const damageGroupMap = new Map();
    active.forEach(item => item.contributions.forEach(part => {
      if (part.kind !== "damage" || part.unit !== "%") return;
      const group = damageMultiplierGroup(part.label);
      damageGroupMap.set(group, (damageGroupMap.get(group) || 0) + Number(part.value || 0));
    }));
    const damageGroups = [...damageGroupMap.entries()].map(([label, value]) => ({ label, value }));
    const groupedDamageMultiplier = damageGroups.reduce((multiplier, group) => multiplier * (1 + group.value / 100), 1);
    const totalCap = active.reduce((sum, item) => sum + item.cap, 0);
    $("damageInnateStat").textContent = percent(totalStat);
    $("damageInnateBonus").textContent = `×${groupedDamageMultiplier.toFixed(3)}`;
    $("damageInnateCap").textContent = `+${totalCap.toLocaleString("zh-CN")}`;
    const groupCount = new Set(active.flatMap(item => item.contributions.map(part => part.key))).size;
    $("damageInnateListTitle").textContent = bonusLayout === "skill" ? "按技能排列" : "按相同加成排列";
    $("damageInnateCount").textContent = bonusLayout === "skill" ? `${active.length}项技能` : `${groupCount}类加成`;
    $("damageInnateList").innerHTML = active.length ? (bonusLayout === "skill" ? renderBySkill(active) : renderByBonus(active)) : '<p class="damage-innate-empty">当前攻击方式下，没有读取到可直接计算的输出加成。</p>';
    const current = state();
    const notes = [];
    notes.push("数值直接读取基础计算器当前保留项目");
    if (current.exclusiveWeapon) notes.push("已计入两件专属装备及法杖、长袍属性增幅");
    if (current.bossSpecial) notes.push(`已按${current.bossRace}系Boss触发特攻，特攻增伤与特攻上限已生效`);
    if (innateSkills.some(item => /暴击率|暴击伤害|有概率将敌方MND减半/.test(item.effect))) notes.push("暴击与概率减防保留为后续独立区间，未混入固定增伤");
    $("damageInnateNote").textContent = notes.join("；") + (notes.length ? "。" : "");
    return {
      totalStat, totalFixed, staffFixed, robeFixed, otherFixed,
      staffStatPct, robeStatPct, effectiveStaffFixed, effectiveRobeFixed, effectiveFixed,
      totalDamage, damageGroups, groupedDamageMultiplier, totalCap
    };
  };

  const calculate = () => {
    const current = state();
    const selectedMagic = magicPresets[$("damageMagic").value] || magicPresets["270090"];
    const skill = current.isMagicMode ? selectedMagic : (presets[current.skill] || presets.skill1);
    $("damageMagicField").hidden = !current.isMagicMode;
    const importedBonuses = window.LC_BASE_CALCULATOR?.getVisibleBonuses?.() || [];
    latestAuditEntries = importedBonuses.filter(item => baseBonusApplies(item, current)).map(item => ({
      ...item,
      auditKey: auditKeyFor(item),
      kind: bonusAuditKind(item),
      group: bonusAuditGroup(item),
      fullEffect: fullEffectFor(item)
    }));
    const activeImportedBonuses = importedBonuses.filter(item => !auditHiddenKeys.has(auditKeyFor(item)));
    const parsed = activeImportedBonuses.map(item => parseBaseBonus(item, current));
    parsed.push(...parseExclusiveEquipmentFixedStats(current), parseBlessingBonus(current), parseHitRule(current));
    const active = parsed.filter(item => item.parts.length);
    const totals = renderInnate(active);
    const baseStat = current.type === "魔法" ? number("damageCharacterInt") : number("damageCharacterAtk");
    const rawEffectiveStat = (baseStat + totals.effectiveFixed) * (1 + totals.totalStat / 100);
    const effectiveStat = Math.floor(rawEffectiveStat);
    const defense = current.type === "魔法" ? number("damageBossMnd") : number("damageBossDef");
    const targetElementResistance = number("damageTargetElementResistance");
    const resistanceMultiplier = Math.max(0, 1 - targetElementResistance / 100);
    const baseCap = Math.max(1, number("damageCap"));
    const effectiveCap = baseCap + totals.totalCap;
    const hitDamageMultiplier = active.reduce((value, item) => value * item.hitDamageMultiplier, 1);
    // 实测基础伤害：面板与防御换算后，还存在固定的核心系数 ×8。
    // 属性抗性随后独立乘算：+50抗性=×0.5，+30=×0.7，-25=×1.25。
    const coreDamageMultiplier = 8;
    const base = effectiveStat * effectiveStat / Math.max(1, effectiveStat + defense) * skill.ratio * coreDamageMultiplier;
    // 实测确认：冰属性伤害与冰属性魔法伤害先在属性区内相加；
    // 魔法伤害、Boss伤害等其他类别再与属性区相乘。
    // 例如冰伤+20%、冰魔法+10%、魔法+35%、Boss魔法+40%
    // 应为 1.30 × 1.35 × 1.40，而不是 1.20 × 1.10 × 1.35 × 1.40。
    const damageMultiplier = totals.groupedDamageMultiplier * hitDamageMultiplier * resistanceMultiplier;
    const rawMin = base * damageMultiplier;
    const rawAvg = rawMin * 1.05;
    const rawMax = rawMin * 1.1;
    const baselineBase = baseStat * baseStat / Math.max(1, baseStat + defense) * skill.ratio * coreDamageMultiplier * resistanceMultiplier;
    const baselineAvg = Math.min(baselineBase * 1.05, baseCap);
    const boostedAvg = Math.min(rawAvg, effectiveCap);
    const actualIncrease = baselineAvg > 0 ? (boostedAvg / baselineAvg - 1) * 100 : 0;
    const gapToStableCap = Math.max(0, effectiveCap - rawMin);
    const statName = current.type === "魔法" ? "法强" : "攻击力";
    let capState = "未触顶";
    let recommendation = `继续提高${statName}或伤害`;
    if (rawMin >= effectiveCap) {
      capState = "稳定触顶";
      recommendation = "优先提高伤害上限";
    } else if (rawMax >= effectiveCap) {
      capState = "部分触顶";
      recommendation = `继续补少量${statName}或伤害`;
    }

    $("damageHitMin").textContent = format(Math.min(rawMin, effectiveCap));
    $("damageHitAvg").textContent = format(Math.min(rawAvg, effectiveCap));
    $("damageHitMax").textContent = format(Math.min(rawMax, effectiveCap));
    $("damageCapGap").textContent = format(gapToStableCap);
    $("damageRecommendation").textContent = recommendation;
    $("damageCapState").textContent = capState;
    $("damageInnateActual").textContent = percent(actualIncrease);
    $("damagePanelStatLabel").textContent = `当前输出面板 · ${statName}`;
    $("damagePanelFinal").textContent = format(effectiveStat);
    const equipmentParts = [];
    if (totals.staffFixed) equipmentParts.push(`法杖 ${format(totals.staffFixed)}×（1+${formatPrecise(totals.staffStatPct)}%）=${format(totals.effectiveStaffFixed)}（先取整）`);
    if (totals.robeFixed) equipmentParts.push(`长袍 ${format(totals.robeFixed)}×（1+${formatPrecise(totals.robeStatPct)}%）=${format(totals.effectiveRobeFixed)}（先取整）`);
    if (totals.otherFixed) equipmentParts.push(`其他装备 ${format(totals.otherFixed)}`);
    const equipmentText = equipmentParts.length ? equipmentParts.join("；") : "装备属性 0";
    const panelFormula = `（基础${statName} ${format(baseStat)} + ${equipmentText}）×（1 + ${statName}加成 ${percent(totals.totalStat)}）=${format(effectiveStat)}（向下取整）`;
    $("damagePanelFormula").textContent = panelFormula;
    $("damageVerifiedStatLabel").textContent = `加成后${statName}${statName === "法强" ? "（魔力）" : ""}`;
    $("damageVerifiedStat").textContent = format(effectiveStat);
    $("damageVerifiedFormula").textContent = panelFormula;
    const effectiveRatio = skill.ratio * hitDamageMultiplier;
    const ratioText = hitDamageMultiplier === 1
      ? `${skill.name}单段倍率 ${(skill.ratio * 100).toFixed(2)}%`
      : `${skill.name}基础单段倍率 ${(skill.ratio * 100).toFixed(2)}% × 特殊修正 ${(hitDamageMultiplier * 100).toFixed(0)}% = ${(effectiveRatio * 100).toFixed(2)}%`;
    const damageGroupText = totals.damageGroups.length
      ? totals.damageGroups.map(group => `${group.label}${percent(group.value)}`).join(" × ")
      : "无增伤";
    $("damageFormula").textContent = `${ratioText}；基础核心系数 ×${coreDamageMultiplier}；计算后${statName} ${format(effectiveStat)}；目标${current.element}抗 ${targetElementResistance >= 0 ? "+" : ""}${formatPrecise(targetElementResistance)}% = ×${resistanceMultiplier.toFixed(3)}；增伤分组乘算 ×${totals.groupedDamageMultiplier.toFixed(4)}（${damageGroupText}）；有效单段上限 ${format(baseCap)} + ${format(totals.totalCap)} = ${format(effectiveCap)}`;
    renderAudit();
  };

  const open = () => {
    readPageStats();
    readInnateSkills();
    panel.hidden = false;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    calculate();
  };
  const close = () => {
    closeAudit();
    panel.hidden = true;
    backdrop.hidden = true;
    document.body.style.overflow = "";
  };

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  $("damageAuditOpen").addEventListener("click", () => openAudit("all"));
  $("damageAuditClose").addEventListener("click", closeAudit);
  $("damageAuditBackdrop").addEventListener("click", closeAudit);
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || panel.hidden) return;
    if (!$("damageAuditPanel").hidden) closeAudit();
    else close();
  });
  panel.querySelectorAll("[data-damage-audit-kind]").forEach(card => {
    card.addEventListener("dblclick", () => openAudit(card.dataset.damageAuditKind));
    card.addEventListener("keydown", event => { if (event.key === "Enter") openAudit(card.dataset.damageAuditKind); });
  });
  $("damageAuditPanel").querySelectorAll("[data-audit-filter]").forEach(button => button.addEventListener("click", () => {
    auditFilter = button.dataset.auditFilter;
    $("damageAuditPanel").querySelectorAll("[data-audit-filter]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    renderAudit();
  }));
  $("damageAuditList").addEventListener("click", event => {
    const button = event.target.closest("[data-audit-key]");
    if (!button) return;
    const key = button.dataset.auditKey;
    if (auditHiddenKeys.has(key)) auditHiddenKeys.delete(key);
    else auditHiddenKeys.add(key);
    saveAuditHiddenKeys();
    calculate();
  });
  $("damageAuditRestoreAll").addEventListener("click", () => {
    auditHiddenKeys.clear();
    saveAuditHiddenKeys();
    calculate();
  });
  panel.addEventListener("input", calculate);
  $("damageBlessingInt").addEventListener("input", () => {
    try { localStorage.setItem(blessingStorageKey, $("damageBlessingInt").value); } catch { /* Ignore unavailable local storage. */ }
  });
  panel.addEventListener("change", event => {
    if (event.target.id === "damageSkill" && ["magic", "heavy_magic"].includes(event.target.value)) $("damageType").value = "魔法";
    calculate();
  });
  window.addEventListener("lc:base-calculator-change", () => {
    if (!panel.hidden) calculate();
  });
  panel.querySelectorAll("[data-damage-layout]").forEach(button => button.addEventListener("click", () => {
    bonusLayout = button.dataset.damageLayout;
    panel.querySelectorAll("[data-damage-layout]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    calculate();
  }));
})();
