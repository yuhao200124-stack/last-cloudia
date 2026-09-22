(() => {
  const panel = document.getElementById("damageSimulator");
  const backdrop = document.getElementById("damageSimulatorBackdrop");
  const openButton = document.getElementById("damageSimulatorOpen");
  const closeButton = document.getElementById("damageSimulatorClose");
  if (!panel || !backdrop || !openButton || !closeButton) return;

  const $ = id => document.getElementById(id);
  const number = id => Number($(id)?.value) || 0;
  const format = value => Math.max(0, Math.round(value)).toLocaleString("zh-CN");
  const percent = value => `${value >= 0 ? "+" : ""}${Number(value.toFixed(1))}%`;
  const presets = {
    skill1: { ratio: .368, hits: 6 },
    skill2: { ratio: .357, hits: 12 },
    skill3: { ratio: .347, hits: 20 },
    ultimate: { ratio: 1.101, hits: 54 },
    magic: { ratio: 1, hits: 1 },
    heavy_magic: { ratio: 1, hits: 1 }
  };
  let innateSkills = [];

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
    innateSkills = records;
  };

  const state = () => {
    const skill = $("damageSkill").value;
    const type = $("damageType").value;
    const element = $("damageElement").value;
    const allText = innateSkills.map(item => item.effect).join("；");
    const isSpecial = ["skill1", "skill2", "skill3"].includes(skill);
    const isMagicMode = ["magic", "heavy_magic"].includes(skill);
    const bossSpecial = (type === "魔法" && /魔法攻击时[^。；]*对BOSS触发特攻/.test(allText)) ||
      ((isSpecial || skill === "ultimate") && /使用特技或超必杀技攻击时[^。；]*对BOSS触发特攻/.test(allText));
    return {
      skill, type, element, isSpecial, isMagicMode, bossSpecial,
      weak: element === $("damageBossWeakElement").value,
      singleWeapon: $("damageCondSingleWeapon").checked,
      staff: $("damageCondStaff").checked,
      robe: $("damageCondRobe").checked,
      fullHp: $("damageCondFullHp").checked,
      magicActive: $("damageCondMagicActive").checked,
      magicChain: $("damageCondMagicChain").checked
    };
  };

  const clauseAt = (text, index) => {
    const left = Math.max(text.lastIndexOf("；", index), text.lastIndexOf("。", index)) + 1;
    const rightMarks = [text.indexOf("；", index), text.indexOf("。", index)].filter(value => value >= 0);
    const right = rightMarks.length ? Math.min(...rightMarks) : text.length;
    return text.slice(left, right);
  };

  const conditionsPass = (text, current) => {
    if (/仅装备1件武器|未装备武器/.test(text) && !current.singleWeapon) return false;
    if (/装备法杖/.test(text) && !current.staff) return false;
    if (/装备长袍/.test(text) && !current.robe) return false;
    if (/HP全满/.test(text) && !current.fullHp) return false;
    if (/不可叠加魔法/.test(text) && !current.magicActive) return false;
    if (/连续使用相同攻击魔法/.test(text) && !current.magicChain) return false;
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
    const result = { ...record, statPct: 0, damagePct: 0, cap: 0, hitMultiplier: 1, hitDamageMultiplier: 1, parts: [] };
    const percentagePattern = /((?:(?:[火冰树雷光暗]、)*[火冰树雷光暗]属性)?(?:物理|魔法|超必杀技|特技)?伤害)\+([\d.]+)%/g;
    for (const match of effect.matchAll(percentagePattern)) {
      const prefix = effect.slice(Math.max(0, match.index - 8), match.index);
      if (/暴击$|受到[^，。；]*$/.test(prefix)) continue;
      const clause = clauseAt(effect, match.index);
      if (!conditionsPass(clause, current) || !categoryPass(match[1], current)) continue;
      const value = Number(match[2]);
      result.damagePct += value;
      result.parts.push(`${match[1]} ${percent(value)}`);
    }

    if (/连续使用相同攻击魔法时伤害提升/.test(effect) && current.type === "魔法" && current.magicChain) {
      const maximum = effect.match(/最高\+([\d.]+)%/);
      if (maximum) {
        const value = Number(maximum[1]);
        result.damagePct += value;
        result.parts.push(`连续魔法最高 ${percent(value)}`);
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
      result.parts.push(`${current.type === "魔法" ? "INT" : "攻击力"} ${percent(value)}`);
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
      result.parts.push(`${match[1]} +${value.toLocaleString("zh-CN")}`);
    }

    if (current.type === "魔法" && current.element === "冰" && /冰属性魔法Hit数变为2倍[^。；]*单次伤害降至60%/.test(effect)) {
      result.hitMultiplier = 2;
      result.hitDamageMultiplier = .6;
      result.parts.push("Hit数×2、单段伤害×60%（整套×1.2）");
    }
    return result;
  };

  const renderInnate = active => {
    const totalStat = active.reduce((sum, item) => sum + item.statPct, 0);
    const totalDamage = active.reduce((sum, item) => sum + item.damagePct, 0);
    const totalCap = active.reduce((sum, item) => sum + item.cap, 0);
    $("damageInnateStat").textContent = percent(totalStat);
    $("damageInnateBonus").textContent = percent(totalDamage);
    $("damageInnateCap").textContent = `+${totalCap.toLocaleString("zh-CN")}`;
    $("damageInnateCount").textContent = `${active.length}项`;
    $("damageInnateList").innerHTML = active.length ? active.map(item =>
      `<article class="damage-innate-item"><b>${item.source} · ${item.name}</b><span>${item.parts.join("；")}</span></article>`
    ).join("") : '<p class="damage-innate-empty">当前攻击方式下，没有读取到可直接计算的自带增伤。</p>';
    const current = state();
    const notes = [];
    if (current.bossSpecial) notes.push("当前攻击可由角色个性对BOSS触发特攻，特攻增幅已自动生效");
    if (innateSkills.some(item => /暴击率|暴击伤害|有概率将敌方MND减半/.test(item.effect))) notes.push("暴击与概率减防保留为后续独立区间，未混入固定增伤");
    $("damageInnateNote").textContent = notes.join("；") + (notes.length ? "。" : "");
    return { totalStat, totalDamage, totalCap };
  };

  const calculate = () => {
    const current = state();
    const skill = presets[current.skill] || presets.skill1;
    const parsed = innateSkills.map(item => parseSkill(item, current));
    const active = parsed.filter(item => item.parts.length);
    const totals = renderInnate(active);
    const baseStat = current.type === "魔法" ? number("damageCharacterInt") : number("damageCharacterAtk");
    const effectiveStat = baseStat * (1 + totals.totalStat / 100);
    const defense = current.type === "魔法" ? number("damageBossMnd") : number("damageBossDef");
    const baseCap = Math.max(1, number("damageCap"));
    const effectiveCap = baseCap + totals.totalCap;
    const hitMultiplier = active.reduce((value, item) => value * item.hitMultiplier, 1);
    const hitDamageMultiplier = active.reduce((value, item) => value * item.hitDamageMultiplier, 1);
    const base = effectiveStat * effectiveStat / Math.max(1, effectiveStat + defense) * skill.ratio;
    const damageMultiplier = (1 + totals.totalDamage / 100) * hitDamageMultiplier;
    const rawMin = base * damageMultiplier;
    const rawAvg = rawMin * 1.05;
    const rawMax = rawMin * 1.1;
    const hits = Math.max(1, Math.round(skill.hits * hitMultiplier));
    const baselineBase = baseStat * baseStat / Math.max(1, baseStat + defense) * skill.ratio;
    const baselineAvg = Math.min(baselineBase * 1.05, baseCap) * skill.hits;
    const boostedAvg = Math.min(rawAvg, effectiveCap) * hits;
    const actualIncrease = baselineAvg > 0 ? (boostedAvg / baselineAvg - 1) * 100 : 0;

    $("damageHitMin").textContent = format(Math.min(rawMin, effectiveCap));
    $("damageHitAvg").textContent = format(Math.min(rawAvg, effectiveCap));
    $("damageHitMax").textContent = format(Math.min(rawMax, effectiveCap));
    $("damageCastAvg").textContent = format(boostedAvg);
    $("damageHitCount").textContent = `${hits}段全部命中`;
    $("damageCapState").textContent = rawMin >= effectiveCap ? "稳定触顶" : rawMax >= effectiveCap ? "部分触顶" : "未触顶";
    $("damageInnateActual").textContent = percent(actualIncrease);
    $("damageFormula").textContent = `${current.type === "魔法" ? "法强" : "攻击力"} ${format(baseStat)} × 自带面板 ${percent(totals.totalStat)} = ${format(effectiveStat)}；直接增伤 ${percent(totals.totalDamage)}；有效单段上限 ${format(baseCap)} + ${format(totals.totalCap)} = ${format(effectiveCap)}`;
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
    panel.hidden = true;
    backdrop.hidden = true;
    document.body.style.overflow = "";
  };

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !panel.hidden) close(); });
  panel.addEventListener("input", calculate);
  panel.addEventListener("change", event => {
    if (event.target.id === "damageSkill" && ["magic", "heavy_magic"].includes(event.target.value)) $("damageType").value = "魔法";
    calculate();
  });
})();
