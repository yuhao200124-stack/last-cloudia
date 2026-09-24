(() => {
  const roxyBonuses = [
    ["hp_pct", "HP", 20, "%", "超越·命导提升", "transcend", "常驻"],
    ["mp_pct", "MP", 15, "%", "魔导提升极", "exclusive", "常驻"],
    ["mp_pct", "MP", 15, "%", "魔常提升极", "exclusive", "常驻"],
    ["mp_pct", "MP", 20, "%", "魔术共鸣", "exclusive", "常驻"],
    ["mp_pct", "MP", 20, "%", "MP提升极", "common", "常驻"],
    ["int_pct", "法强", 15, "%", "魔导提升极", "exclusive", "常驻"],
    ["int_pct", "法强", 15, "%", "魔常提升极", "exclusive", "常驻"],
    ["int_pct", "法强", 50, "%", "超规格的魔术师", "exclusive", "常驻EX灵气"],
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
    ["ultimate_damage", "超必杀技伤害", 100, "%", "超规格的魔术师", "exclusive", "常驻"],
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
    ["ultimate_cap", "超必杀技伤害上限", 200000, "", "超规格的魔术师", "exclusive", "常驻"],
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

  const arkuBonuses = [
    ["hp_pct", "HP", 10, "%", "斗志提升IV", "common", "常驻"],
    ["hp_pct", "HP", 15, "%", "勇士提升极", "exclusive", "常驻"],
    ["hp_pct", "HP", 20, "%", "不朽龙壳", "exclusive", "常驻"],
    ["str_pct", "攻击力", 15, "%", "攻击提升极", "common", "常驻"],
    ["str_pct", "攻击力", 10, "%", "斗志提升IV", "common", "常驻"],
    ["str_pct", "攻击力", 15, "%", "勇士提升极", "exclusive", "常驻"],
    ["str_pct", "攻击力", 30, "%", "堂堂II", "exclusive", "HP全满时"],
    ["str_pct", "攻击力", 30, "%", "龙之咆哮", "exclusive", "龙类型限定"],
    ["def_pct", "防御力", 15, "%", "勇士提升极", "exclusive", "常驻"],
    ["int_pct", "法强", 30, "%", "龙之咆哮", "exclusive", "龙类型限定"],
    ["crit_rate", "暴击率", 8, "%", "暴击提升III", "common", "常驻"],
    ["crit_rate", "暴击率", 15, "%", "自动暴击", "common", "始终保持暴击魔法效果"],
    ["crit_rate", "暴击率", 5, "%", "炎暴击提升", "common", "仅火属性攻击"],
    ["crit_rate", "暴击率", 5, "%", "超越·暴击提升", "transcend", "常驻"],
    ["crit_damage", "暴击伤害", 50, "%", "炎暴击提升", "common", "火属性攻击触发暴击时"],
    ["fire_damage", "火属性伤害", 80, "%", "继承龙之意志者", "traits", "常驻"],
    ["fire_damage", "火属性伤害", 20, "%", "炎攻击提升", "common", "常驻"],
    ["fire_damage", "火属性伤害", 30, "%", "炎攻击提升V", "exclusive", "常驻"],
    ["fire_damage", "火属性伤害", 20, "%", "炎攻击之魂", "exclusive", "常驻"],
    ["fire_damage", "火属性伤害", 15, "%", "炎之强化", "common", "常驻"],
    ["fire_damage", "火属性伤害", 20, "%", "超越·火焰武器II", "transcend", "装备火属性武器"],
    ["fire_physical_damage", "火属性物理/超必杀技伤害", 30, "%", "炎究极驱动", "exclusive", "常驻"],
    ["fire_physical_damage", "火属性物理/超必杀技伤害", 30, "%", "炎超阶驱动", "exclusive", "常驻"],
    ["special_damage", "特攻伤害", 50, "%", "特攻增幅", "common", "触发特攻时"],
    ["single_physical_damage", "单武器物理伤害", 30, "%", "一天真刃", "common", "仅装备1件武器"],
    ["break_physical_damage", "Break中物理伤害", 30, "%", "Break增幅V", "exclusive", "敌人处于Break状态"],
    ["boss_damage", "对BOSS伤害", 20, "%", "勇者之魂", "common", "攻击BOSS时"],
    ["boss_skill_damage", "对BOSS特技/超必杀技伤害", 20, "%", "巨型杀戮V", "exclusive", "攻击BOSS时"],
    ["ultimate_damage", "超必杀技伤害", 50, "%", "炎之强化", "common", "常驻"],
    ["damage_reduction", "受到伤害减少", 35, "%", "不朽龙壳", "exclusive", "常驻"],
    ["damage_reduction", "受到伤害减少", 20, "%", "超越·受到伤害减轻", "transcend", "常驻"],
    ["boss_reduction", "受到BOSS伤害减少", 20, "%", "勇者之魂", "common", "受到BOSS攻击时"],
    ["sct_speed", "SCT回复速度", 35, "%", "自动究极加速", "exclusive", "常驻"]
  ].map(([key, label, value, unit, source, group, condition]) => ({ key, label, value, unit, source, group, condition }));
  const erisBonuses = [
    ["hp_pct","HP",8,"%","HP提升2","common","常驻"],
    ["hp_pct","HP",15,"%","斗志提升极","exclusive","常驻"],
    ["hp_pct","HP",15,"%","勇士提升极","exclusive","常驻"],
    ["hp_pct","HP",20,"%","超越·斗志提升","transcend","常驻"],
    ["hp_pct","HP",10,"%","艾莉丝的服装","equipment","装备专属服装"],
    ["str_pct","攻击力",15,"%","攻击提升极","common","常驻"],
    ["str_pct","攻击力",15,"%","斗志提升极","exclusive","常驻"],
    ["str_pct","攻击力",15,"%","勇士提升极","exclusive","常驻"],
    ["str_pct","攻击力",20,"%","超越·斗志提升","transcend","常驻"],
    ["str_pct","攻击力",50,"%","反杀","exclusive","常驻"],
    ["str_pct","攻击力",100,"%","沉睡的狮子","exclusive","濒死触发后"],
    ["str_pct","攻击力",15,"%","艾莉丝之剑","equipment","装备专属剑"],
    ["str_pct","攻击力",10,"%","艾莉丝的服装","equipment","装备专属服装"],
    ["def_pct","防御力",10,"%","刚坚提升4","exclusive","常驻"],
    ["def_pct","防御力",15,"%","勇士提升极","exclusive","常驻"],
    ["mnd_pct","魔抗",10,"%","刚坚提升4","exclusive","常驻"],
    ["crit_rate","暴击率",20,"%","波瑞阿斯拳","specials","仅特技1"],
    ["crit_rate","暴击率",5,"%","无属性暴击增幅","common","无属性攻击"],
    ["crit_damage","暴击伤害",50,"%","要害攻击·改","common","暴击时"],
    ["crit_damage","暴击伤害",50,"%","无属性暴击增幅","common","无属性暴击时"],
    ["neutral_damage","无属性伤害",40,"%","我会保护你","traits","单武器"],
    ["neutral_damage","无属性伤害",30,"%","剑神流","exclusive","单剑"],
    ["neutral_damage","无属性伤害",30,"%","无属性攻击提升4","exclusive","常驻"],
    ["neutral_damage","无属性伤害",30,"%","无属性攻击提升5","exclusive","常驻"],
    ["physical_damage","物理伤害",30,"%","一天真刃·二之型","exclusive","单武器"],
    ["physical_damage","物理伤害",30,"%","双手剑增幅4","exclusive","单剑"],
    ["physical_damage","物理伤害",35,"%","艾莉丝之剑","equipment","单武器"],
    ["physical_damage","物理伤害",20,"%","超越·剑精通2","transcend","装备剑"],
    ["physical_damage","物理伤害",15,"%","服装究极增幅","exclusive","装备服装"],
    ["special_damage","特攻伤害",50,"%","特攻增幅","common","触发特攻时"],
    ["ultimate_damage","超必杀技伤害",30,"%","双手剑增幅4","exclusive","单剑"],
    ["neutral_cap","无属性伤害上限",140000,"","我会保护你","traits","单武器"],
    ["neutral_cap","无属性伤害上限",100000,"","剑神流","exclusive","单剑"],
    ["neutral_cap","无属性伤害上限",5000,"","无属性攻击提升4","exclusive","常驻"],
    ["neutral_cap","无属性伤害上限",10000,"","无属性攻击提升5","exclusive","常驻"],
    ["physical_cap","物理伤害上限",30000,"","一天真刃·二之型","exclusive","单武器"],
    ["physical_cap","物理伤害上限",60000,"","超越·一刀极致","transcend","单武器"],
    ["physical_cap","物理伤害上限",15000,"","超越·剑精通2","transcend","单剑时；非单剑+7,500"],
    ["physical_cap","物理伤害上限",7000,"","艾莉丝之剑","equipment","单武器"],
    ["physical_cap","物理伤害上限",8000,"","艾莉丝之剑","equipment","异常状态中"],
    ["ultimate_cap","超必杀技伤害上限",300000,"","无声之太刀","specials","超必杀技"],
    ["ultimate_cap","超必杀技伤害上限",12000,"","双手剑增幅4","exclusive","单剑"],
    ["damage_reduction","受到伤害减少",20,"%","超越·受到伤害减轻","transcend","常驻"],
    ["damage_reduction","受到伤害减少",50,"%","守护的力量","exclusive","至少2名队友且全员存活"],
    ["sct_speed","SCT回复速度",50,"%","沉睡的狮子","exclusive","濒死触发后"]
  ].map(([key,label,value,unit,source,group,condition])=>({key,label,value,unit,source,group,condition}));
  const bonuses = document.body.dataset.characterId === "259" ? erisBonuses : document.body.dataset.characterId === "245" ? arkuBonuses : roxyBonuses;

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
  const capAttackHeading = document.getElementById("capAttackHeading");
  const capTypesElement = document.getElementById("capTypes");
  const capBreakdown = document.getElementById("capBreakdown");
  const capSourcePicker = document.getElementById("capSourcePicker");
  const capTotal = document.getElementById("capTotal");
  const capAdded = document.getElementById("capAdded");
  const capAttackElement = document.getElementById("capAttacks");
  const finalDamagePanel = document.getElementById("finalDamageCalculator");
  const finalDamageOpenButton = document.getElementById("finalDamageCalculatorOpen");
  const finalDamageCloseButton = document.getElementById("finalDamageCalculatorClose");
  const finalDamagePlanSelect = document.getElementById("finalDamagePlanSelect");
  const finalDamagePlanNote = document.getElementById("finalDamagePlanNote");
  const finalDamageCapTotal = document.getElementById("finalDamageCapTotal");
  const finalDamageCapAdded = document.getElementById("finalDamageCapAdded");
  const finalDamageCapReset = document.getElementById("finalDamageCapReset");
  const finalDamageAttackHeading = document.getElementById("finalDamageAttackHeading");
  const finalDamageAttacks = document.getElementById("finalDamageAttacks");
  const finalDamageCapTypes = document.getElementById("finalDamageCapTypes");
  const finalDamageCapSources = document.getElementById("finalDamageCapSources");
  const finalDamageSummary = document.getElementById("finalDamageSummary");
  const savedBuildViewerOpen = document.getElementById("savedBuildViewerOpen");
  const savedBuildViewer = document.getElementById("savedBuildViewer");
  const savedBuildViewerClose = document.getElementById("savedBuildViewerClose");
  const savedBuildAddSkills = document.getElementById("savedBuildAddSkills");
  const savedBuildSaveChanges = document.getElementById("savedBuildSaveChanges");
  const savedBuildSort = document.getElementById("savedBuildSort");
  const savedBuildRatingSort = document.getElementById("savedBuildRatingSort");
  const savedBuildSelect = document.getElementById("savedBuildSelect");
  const savedBuildNote = document.getElementById("savedBuildNote");
  const savedBuildBreaks = document.getElementById("savedBuildBreaks");
  const savedBuildEffects = document.getElementById("savedBuildEffects");
  const savedBuildDetails = document.getElementById("savedBuildDetails");
  const savedBuildSkills = document.getElementById("savedBuildSkills");
  const savedBuildRestore = document.getElementById("savedBuildRestore");
  const savedBuildTotal = document.getElementById("savedBuildTotal");
  const expanded = new Set();
  const hiddenKeys = new Set();
  const selectedCapTypes = new Set();
  const selectedCapSources = new Set();
  let selectedCapAttack = "zeno_claion";
  let lastOpenedCalculator = "bonus";
  let highlightTimer = null;
  let savedBuildSortDirection = "desc";
  let savedBuildSortMode = "sc";
  let savedBuildRatingDirection = "desc";
  let savedBuildDetailsOpen = false;
  let savedBuildEffectsOpen = false;
  let expandedSavedBuildBonusKey = "";
  const expandedSavedBuildEffects = new Set();
  const selectedFinalCapTypes = new Set();
  const selectedFinalCapSources = new Set();
  let selectedFinalCapAttack = "zeno_claion";
  let selectedSavedBuildId = new URLSearchParams(location.search).get("plan") || "";
  let selectedFinalDamagePlanId = selectedSavedBuildId;
  let savedBuildDraftPlanId = "";
  let savedBuildDraftSkillIds = [];
  let savedBuildDraftDirty = false;

  const savedBuildStorageKey = "lc-sheet-table:loadout-plans-v1";
  const savedBuildTransferKey = "lc-sheet-table:loadout-draft-v1";
  const savedBuildEditsKey = "lc-sheet-table:cell-edits-v1";
  const currentSavedBuildCharacterId = document.body.dataset.characterId || "";
  const hiddenBonusStorageKey = `lc-sheet-table:hidden-base-metrics:${currentSavedBuildCharacterId || "default"}`;
  try {
    const storedHiddenKeys = JSON.parse(localStorage.getItem(hiddenBonusStorageKey) || "[]");
    if (Array.isArray(storedHiddenKeys)) storedHiddenKeys.forEach((key) => hiddenKeys.add(String(key)));
  } catch { /* Ignore malformed local data and start with all metrics visible. */ }
  const saveHiddenBonusKeys = () => localStorage.setItem(hiddenBonusStorageKey, JSON.stringify([...hiddenKeys]));
  const publishBaseCalculatorState = () => {
    window.dispatchEvent(new CustomEvent("lc:base-calculator-change", {
      detail: { characterId: currentSavedBuildCharacterId }
    }));
  };
  window.LC_BASE_CALCULATOR = {
    getVisibleBonuses: () => bonuses
      .filter((bonus) => !hiddenKeys.has(bonus.key))
      .map((bonus) => ({ ...bonus })),
    getHiddenKeys: () => [...hiddenKeys],
    characterId: currentSavedBuildCharacterId
  };
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
  const installUnifiedSavedSkills = () => {
    try {
      const catalog = JSON.parse(localStorage.getItem('lc-sheet-table:unified-character-skills-v1') || '{}');
      for (const [characterId, record] of Object.entries(catalog)) for (const source of record.sources || []) {
        const id = `character:${characterId}:${source.sourceId}`;
        savedBuildSkillIndex.set(id, {id, name: source.name, effect: source.text, sc: '0', sources: [], type: '角色技能'});
      }
    } catch {}
  };

  const escapeSavedBuildHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const parseSavedBuildSc = (value) => {
    const match = String(value ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    const parsed = match ? Number(match[0]) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };
  const formatSavedBuildSc = (value) => Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  const readAllSavedBuildPlans = () => {
    installUnifiedSavedSkills();
    try {
      const plans = JSON.parse(localStorage.getItem(savedBuildStorageKey) || "[]");
      return Array.isArray(plans) ? plans.filter((plan) => plan && typeof plan.id === "string") : [];
    } catch { return []; }
  };
  const readSavedBuildPlans = () => readAllSavedBuildPlans().filter((plan) => plan.characterId === currentSavedBuildCharacterId);
  const readSavedBuildEdits = () => {
    try { return JSON.parse(localStorage.getItem(savedBuildEditsKey) || "{}"); }
    catch { return {}; }
  };
  const saveSkillRating = (row, value) => {
    const edits = readSavedBuildEdits();
    const key = `skill:${row.id}`;
    edits[key] = { ...(edits[key] || {}), mark: value.trim() };
    localStorage.setItem(savedBuildEditsKey, JSON.stringify(edits));
  };
  const saveSavedBuildDraft = () => {
    if (!savedBuildDraftPlanId) return null;
    const skillIds = [...new Set(savedBuildDraftSkillIds.map(String))];
    let savedPlan = null;
    const plans = readAllSavedBuildPlans().map((plan) => {
      if (plan.id !== savedBuildDraftPlanId || plan.characterId !== currentSavedBuildCharacterId) return plan;
      savedPlan = {
        ...plan,
        skillIds,
        characterFreeIds: Array.isArray(plan.characterFreeIds) ? plan.characterFreeIds.map(String).filter((id) => skillIds.includes(id)) : [],
        updatedAt: new Date().toISOString(),
      };
      return savedPlan;
    });
    if (!savedPlan) return null;
    localStorage.setItem(savedBuildStorageKey, JSON.stringify(plans));
    savedBuildDraftDirty = false;
    return savedPlan;
  };
  const discardSavedBuildDraft = () => {
    savedBuildDraftPlanId = "";
    savedBuildDraftSkillIds = [];
    savedBuildDraftDirty = false;
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
        const existingSkill = current.skills.find((skill) => skill.id === item.id);
        if (existingSkill) existingSkill.value += value;
        else current.skills.push({
          id: item.id,
          name: savedBuildRowValue(item.row, "name", edits),
          effect: savedBuildRowValue(item.row, "effect", edits),
          value,
          unit,
        });
        totals.set(key, current);
      }
    });
    return [...totals.values()];
  };
  const formatSavedBuildBonus = (value, unit) => `${value > 0 ? "+" : ""}${unit ? formatSavedBuildSc(value) : Math.round(value).toLocaleString("zh-CN")}${unit}`;
  const savedBuildRatingWeight = (rating) => {
    const value = String(rating || "").trim().toUpperCase();
    const gradeWeights = { SSS: 900, SS: 800, "S+": 750, S: 700, "S-": 650, "A+": 600, A: 550, "A-": 500, "B+": 450, B: 400, "B-": 350, "C+": 300, C: 250, "C-": 200, D: 150 };
    if (Object.prototype.hasOwnProperty.call(gradeWeights, value)) return gradeWeights[value];
    const numeric = Number(value);
    return Number.isFinite(numeric) && value !== "" ? numeric : null;
  };

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
      savedBuildDraftPlanId = "";
      savedBuildDraftSkillIds = [];
      savedBuildDraftDirty = false;
      savedBuildNote.hidden = true;
      savedBuildBreaks.innerHTML = "";
      savedBuildSkills.innerHTML = '<div class="saved-build-empty">还没有这个角色的已保存方案。<br>请先使用上方“配装计算器”选择技能并保存。</div>';
      savedBuildTotal.textContent = "0 SC";
      savedBuildDetails.disabled = true;
      savedBuildEffects.disabled = true;
      savedBuildAddSkills.disabled = true;
      savedBuildSaveChanges.disabled = true;
      savedBuildRestore.disabled = true;
      savedBuildDetails.classList.remove("is-active");
      savedBuildEffects.classList.remove("is-active");
      savedBuildDetails.setAttribute("aria-pressed", "false");
      savedBuildEffects.setAttribute("aria-pressed", "false");
      return;
    }
    if (savedBuildDraftPlanId !== plan.id) {
      savedBuildDraftPlanId = plan.id;
      savedBuildDraftSkillIds = Array.isArray(plan.skillIds) ? [...new Set(plan.skillIds.map(String))] : [];
      savedBuildDraftDirty = false;
    }
    const workingPlan = { ...plan, skillIds: [...savedBuildDraftSkillIds] };
    savedBuildDetails.disabled = false;
    savedBuildEffects.disabled = false;
    savedBuildAddSkills.disabled = false;
    savedBuildSaveChanges.disabled = !savedBuildDraftDirty;
    savedBuildRestore.disabled = !savedBuildDraftDirty;
    savedBuildDetails.classList.toggle("is-active", savedBuildDetailsOpen);
    savedBuildDetails.setAttribute("aria-pressed", String(savedBuildDetailsOpen));
    savedBuildEffects.classList.toggle("is-active", savedBuildEffectsOpen);
    savedBuildEffects.setAttribute("aria-pressed", String(savedBuildEffectsOpen));
    savedBuildNote.hidden = !plan.note;
    savedBuildNote.textContent = plan.note || "";
    const result = calculateSavedBuild(workingPlan, edits);
    savedBuildBreaks.innerHTML = [7, 12, 20].map((level) => `<span class="saved-build-break${result.activeBreaks.includes(level) ? " is-active" : ""}">${level} SC突破</span>`).join("");
    const descending = savedBuildSortDirection === "desc";
    savedBuildSort.textContent = descending ? "SC▽" : "SC△";
    savedBuildSort.setAttribute("aria-label", descending ? "当前SC从大到小，点击改为从小到大" : "当前SC从小到大，点击改为从大到小");
    savedBuildSort.classList.toggle("is-active", savedBuildSortMode === "sc");
    savedBuildSort.setAttribute("aria-pressed", String(savedBuildSortMode === "sc"));
    savedBuildRatingSort.textContent = savedBuildRatingDirection === "desc" ? "评分▽" : "评分△";
    savedBuildRatingSort.classList.toggle("is-active", savedBuildSortMode === "rating");
    savedBuildRatingSort.setAttribute("aria-pressed", String(savedBuildSortMode === "rating"));
    const displayItems = [...result.items].sort((a, b) => {
      if (savedBuildSortMode === "rating") {
        const aRating = savedBuildRowValue(a.row, "mark", edits);
        const bRating = savedBuildRowValue(b.row, "mark", edits);
        const aHasRating = Boolean(aRating.trim());
        const bHasRating = Boolean(bRating.trim());
        if (!aHasRating && bHasRating) return 1;
        if (aHasRating && !bHasRating) return -1;
        const aWeight = savedBuildRatingWeight(aRating);
        const bWeight = savedBuildRatingWeight(bRating);
        if (aWeight === null && bWeight !== null) return 1;
        if (aWeight !== null && bWeight === null) return -1;
        if (aWeight !== null && bWeight !== null && aWeight !== bWeight) return savedBuildRatingDirection === "desc" ? bWeight - aWeight : aWeight - bWeight;
        if (aRating !== bRating) return savedBuildRatingDirection === "desc" ? bRating.localeCompare(aRating, "zh-CN") : aRating.localeCompare(bRating, "zh-CN");
        return b.sc - a.sc;
      }
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
      ? displayItems.map((item) => {
        const rating = savedBuildRowValue(item.row, "mark", edits).trim();
        return `<div class="saved-build-skill${item.freeBy ? " is-free" : ""}">
          <button class="saved-build-skill-name" type="button" data-saved-skill-effect="${escapeSavedBuildHtml(item.id)}" title="双击查看技能效果">${escapeSavedBuildHtml(savedBuildRowValue(item.row, "name", edits))}</button>
          <input class="saved-build-skill-rating${rating ? "" : " is-empty"}" type="text" value="${escapeSavedBuildHtml(rating)}" placeholder="+评分" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" inputmode="text" data-edit-skill-rating="${escapeSavedBuildHtml(item.id)}" aria-label="${escapeSavedBuildHtml(savedBuildRowValue(item.row, "name", edits))}的评分" title="直接输入评分，回车或离开输入框保存">
          <div class="saved-build-skill-sc">${item.freeBy === "character" ? `<strong>0 SC</strong><small>角色自带</small><del>原 ${formatSavedBuildSc(item.sc)} SC</del>` : item.freeBy ? `<strong>0 SC</strong><small>${item.freeBy} SC突破减免</small><del>原 ${formatSavedBuildSc(item.sc)} SC</del>` : `<strong>${formatSavedBuildSc(item.sc)} SC</strong>`}</div>
          <button class="saved-build-skill-remove" type="button" data-remove-saved-skill="${escapeSavedBuildHtml(item.id)}" aria-label="移除${escapeSavedBuildHtml(savedBuildRowValue(item.row, "name", edits))}" title="从方案移除">×</button>
          ${savedBuildEffectsOpen || expandedSavedBuildEffects.has(item.id) ? `<p class="saved-build-skill-effect">${escapeSavedBuildHtml(savedBuildRowValue(item.row, "effect", edits))}</p>` : ""}
        </div>`;
      }).join("")
      : '<div class="saved-build-empty">这个方案没有技能</div>';
    savedBuildTotal.textContent = `${formatSavedBuildSc(result.total)} SC`;
  };

  const finalMetricCapTypes = (label) => {
    const value = String(label);
    const types = new Set();
    if (/冰属性.*魔法|魔法.*冰属性/.test(value)) types.add("ice_magic");
    if (/冰属性/.test(value)) types.add("ice");
    if (/火属性/.test(value)) types.add("fire");
    if (/不可叠加魔法|重魔法/.test(value)) types.add("heavy_magic");
    if (/魔法/.test(value)) types.add("magic");
    if (/物理/.test(value)) types.add("physical");
    if (/特技/.test(value)) types.add("skill");
    if (/必杀/.test(value)) types.add("ultimate");
    if (/Break|破防/.test(value)) types.add("break");
    if (/暴击/.test(value)) types.add("critical");
    if (/特攻/.test(value)) types.add("special");
    if (!types.size) types.add("general");
    return [...types];
  };
  const getFinalCapAttack = () => damageCapCharacter.attacks.find((attack) => attack.id === selectedFinalCapAttack) || damageCapCharacter.attacks[0];
  const getSelectedFinalCapProfile = () => {
    const types = new Set();
    const tags = new Set();
    damageCapCharacter.capTypes.filter((type) => selectedFinalCapTypes.has(type.id)).forEach((type) => {
      type.includes.forEach((included) => types.add(included));
      (type.tags || []).forEach((tag) => tags.add(tag));
    });
    return { types, tags };
  };
  const buildFinalCapSources = (plan) => {
    if (!plan) return [];
    const sources = damageCapCharacter.sources.map((source) => ({ ...source, origin: "角色/装备" }));
    const edits = readSavedBuildEdits();
    const result = calculateSavedBuild(plan, edits);
    const characterOwnedIds = new Set(Array.isArray(plan.characterFreeIds) ? plan.characterFreeIds.map(String) : []);
    const equippedItems = result.items.filter((item) => !characterOwnedIds.has(item.id));
    summarizeSavedBuildBonuses(equippedItems, edits)
      .filter((metric) => metric.unit === "" && /伤害上限/.test(metric.metric) && !/HP恢复上限/.test(metric.metric))
      .forEach((metric) => metric.skills.forEach((skill, index) => {
        sources.push({
          id: `build:${skill.id}:${metric.key}:${index}`,
          label: skill.name,
          value: skill.value,
          capTypes: finalMetricCapTypes(metric.metric),
          requires: [],
          target: skill.name,
          condition: `${metric.metric}｜${skill.effect}`,
          origin: "配装技能",
        });
      }));
    return sources;
  };
  const finalSourceApplies = (source, tags, types) => {
    const sourceTypes = source.capTypes || [source.capType || "general"];
    return sourceTypes.some((type) => types.has(type)) && (source.requires || []).every((requirement) => tags.has(requirement));
  };
  const selectAllFinalCapSources = (sources) => {
    const retainedOptional = sources.filter((source) => source.autoSelect === false && selectedFinalCapSources.has(source.id)).map((source) => source.id);
    selectedFinalCapSources.clear();
    sources.filter((source) => source.autoSelect !== false).forEach((source) => selectedFinalCapSources.add(source.id));
    retainedOptional.forEach((id) => selectedFinalCapSources.add(id));
  };

  const renderFinalDamageCalculator = () => {
    const plans = readSavedBuildPlans();
    if (!plans.some((plan) => plan.id === selectedFinalDamagePlanId)) selectedFinalDamagePlanId = plans[0]?.id || "";
    finalDamagePlanSelect.innerHTML = plans.length
      ? plans.map((plan) => `<option value="${escapeSavedBuildHtml(plan.id)}"${plan.id === selectedFinalDamagePlanId ? " selected" : ""}>${escapeSavedBuildHtml(plan.name || "未命名方案")}</option>`).join("")
      : '<option value="">还没有保存的配装方案</option>';
    finalDamagePlanSelect.disabled = !plans.length;
    const plan = plans.find((item) => item.id === selectedFinalDamagePlanId);
    finalDamagePlanNote.hidden = !plan?.note;
    finalDamagePlanNote.textContent = plan?.note || "";
    if (!plan) {
      finalDamageCapTotal.textContent = "9,999";
      finalDamageCapAdded.textContent = "基础上限 9,999";
      finalDamageAttacks.innerHTML = "";
      finalDamageCapTypes.innerHTML = "";
      finalDamageCapSources.innerHTML = "";
      finalDamageSummary.innerHTML = '<div class="bonus-empty">请先使用“配装计算器”保存这个角色的方案。</div>';
      return;
    }

    const sources = buildFinalCapSources(plan);
    const attack = getFinalCapAttack();
    const profile = getSelectedFinalCapProfile();
    const tags = new Set([...attack.tags, ...profile.tags]);
    const available = sources.filter((source) => finalSourceApplies(source, tags, profile.types));
    const applied = available.filter((source) => selectedFinalCapSources.has(source.id));
    const added = applied.filter((source) => source.unit !== "%").reduce((total, source) => total + getSourceValue(source, tags), 0);
    const percent = applied.filter((source) => source.unit === "%").reduce((total, source) => total + getSourceValue(source, tags), 0);

    finalDamageAttackHeading.textContent = damageCapCharacter.attackPickerLabel || "选择攻击方式";
    finalDamageAttacks.innerHTML = damageCapCharacter.attacks.map((item) => `<label class="cap-condition cap-attack"><input type="radio" name="finalCapAttack" value="${escapeSavedBuildHtml(item.id)}" ${item.id === selectedFinalCapAttack ? "checked" : ""}><span>${escapeSavedBuildHtml(item.label)}</span></label>`).join("");
    finalDamageCapTypes.innerHTML = damageCapCharacter.capTypes.map((type) => `<label class="cap-condition"><input type="checkbox" value="${escapeSavedBuildHtml(type.id)}" ${selectedFinalCapTypes.has(type.id) ? "checked" : ""}><span>${escapeSavedBuildHtml(type.label)}</span></label>`).join("");
    finalDamageCapTotal.textContent = Math.round(attack.baseCap * (1 + percent / 100) + added).toLocaleString("zh-CN");
    const typeLabels = damageCapCharacter.capTypes.filter((type) => selectedFinalCapTypes.has(type.id)).map((type) => type.label);
    finalDamageCapAdded.textContent = `${attack.label}：基础 ${attack.baseCap.toLocaleString("zh-CN")}${percent ? ` × ${1 + percent / 100}` : ""} + 固定上限 ${added.toLocaleString("zh-CN")}${typeLabels.length ? `｜${typeLabels.join(" + ")}` : "｜未选择上限分类"}`;

    finalDamageCapSources.innerHTML = available.length ? available.map((source) => {
      const value = getSourceValue(source, tags);
      const selected = selectedFinalCapSources.has(source.id);
      return `<label class="cap-skill-option${selected ? " is-selected" : ""}"><input type="checkbox" value="${escapeSavedBuildHtml(source.id)}" ${selected ? "checked" : ""}><span>${escapeSavedBuildHtml(source.label)}<small>${escapeSavedBuildHtml(source.origin)}</small></span><strong>+${value.toLocaleString("zh-CN")}${source.unit === "%" ? "%" : ""}</strong></label>`;
    }).join("") : '<div class="cap-empty cap-picker-empty">当前选择下没有可计入的伤害上限来源。</div>';

    finalDamageSummary.innerHTML = applied.length ? applied.map((source) => {
      const value = getSourceValue(source, tags);
      return `<section class="cap-source-option"><div class="cap-selected-source"><span><strong>${escapeSavedBuildHtml(source.label)}</strong><small>${escapeSavedBuildHtml(source.condition)}</small></span><b>+${value.toLocaleString("zh-CN")}${source.unit === "%" ? "%" : ""}</b><button type="button" data-final-cap-remove="${escapeSavedBuildHtml(source.id)}" aria-label="取消选择${escapeSavedBuildHtml(source.label)}" title="取消选择">×</button></div></section>`;
    }).join("") : '<div class="cap-empty">当前没有满足条件并计入总数的伤害上限加成。</div>';
  };

  const openSavedBuildViewer = () => {
    renderSavedBuildViewer();
    if (isMobile()) {
      resetPanelPosition(savedBuildViewer);
      panel.hidden = true;
      capPanel.hidden = true;
      finalDamagePanel.hidden = true;
    }
    savedBuildViewer.hidden = false;
    savedBuildViewerClose.focus();
  };
  const closeSavedBuildViewer = () => {
    if (savedBuildDraftDirty && !window.confirm("当前技能修改尚未保存，关闭后将放弃这些修改。确定关闭吗？")) return false;
    discardSavedBuildDraft();
    savedBuildViewer.hidden = true;
    savedBuildViewerOpen.focus();
    return true;
  };

  // 每个角色按编号独立配置攻击方式、基础上限、上限类型和来源。
  // attackPickerLabel 可按角色写成“选择攻击魔法”“选择特技”或“选择必杀技”。
  const damageCapProfiles = {
    "259": {
      id: "259", attackPickerLabel: "选择特技或超必杀技",
      attacks: [
        {id:"boreas_punch",label:"波瑞阿斯拳（特技1）",baseCap:9999,tags:["physical","neutral","skill"],note:"无属性物理特技；暴击率另+20%。"},
        {id:"boreas_dance",label:"波瑞阿斯之舞（特技2）",baseCap:9999,tags:["physical","neutral","skill"],note:"无属性物理特技。"},
        {id:"one_slash",label:"一刀两断（特技3）",baseCap:9999,tags:["physical","neutral","skill"],note:"无属性物理特技。"},
        {id:"silent_blade",label:"无声之太刀（超必杀技）",baseCap:9999,tags:["physical","neutral","ultimate"],note:"无属性超必杀技，固有上限+300,000。"}
      ],
      capTypes: [
        {id:"general",label:"通用伤害上限",includes:["general"]},
        {id:"physical",label:"物理伤害上限",includes:["general","physical"]},
        {id:"skill",label:"特技伤害上限",includes:["general","skill"]},
        {id:"ultimate",label:"超必杀技伤害上限",includes:["general","ultimate"]},
        {id:"neutral",label:"无属性伤害上限",includes:["general","neutral"]},
        {id:"single_weapon",label:"只装备1件武器",includes:[],tags:["single_weapon"]},
        {id:"single_sword",label:"只装备1把剑",includes:[],tags:["single_weapon","single_sword","sword"]},
        {id:"sword",label:"装备剑",includes:[],tags:["sword"]},
        {id:"eris_sword_equip",label:"装备艾莉丝之剑",includes:[],tags:["exclusive_sword","sword"]},
        {id:"critical",label:"触发暴击",includes:["critical"],tags:["critical"]},
        {id:"angered",label:"激昂Buff生效",includes:["angered"],tags:["angered"]},
        {id:"abnormal",label:"自身处于异常状态",includes:["abnormal"],tags:["abnormal"]},
        {id:"nearest",label:"目标距离最近",includes:["nearest"],tags:["nearest"]}
      ],
      sources: [
        {id:"eris_trait",capType:"neutral",label:"我会保护你",value:140000,requires:["single_weapon"],target:"我会保护你",condition:"单武器时无属性上限+140,000"},
        {id:"sword_style",capType:"neutral",label:"剑神流",value:100000,requires:["single_sword"],target:"剑神流",condition:"单剑时无属性上限+100,000"},
        {id:"neutral_raise4",capType:"neutral",label:"无属性攻击提升4",value:5000,requires:[],target:"无属性攻击提升4",condition:"无属性上限+5,000"},
        {id:"neutral_raise5",capType:"neutral",label:"无属性攻击提升5",value:10000,requires:[],target:"无属性攻击提升5",condition:"无属性上限+10,000"},
        {id:"single_blade2",capType:"physical",label:"一天真刃·二之型",value:30000,requires:["single_weapon"],target:"一天真刃·二之型",condition:"单武器物理上限+30,000"},
        {id:"single_transcend",capType:"physical",label:"【超越】一刀极致",value:60000,requires:["single_weapon"],target:"超越·一刀极致",condition:"单武器物理上限+60,000"},
        {id:"sword_mastery",capType:"physical",label:"【超越】剑精通2",value:7500,variants:[{requires:["single_sword"],value:15000}],requires:["sword"],target:"超越·剑精通2",condition:"装备剑时+7,500；单剑时变为+15,000"},
        {id:"eris_sword",capType:"physical",label:"艾莉丝之剑",value:7000,requires:["single_weapon","exclusive_sword"],target:"艾莉丝之剑",condition:"装备专属剑且单武器时+7,000"},
        {id:"eris_sword_abnormal",capType:"physical",label:"艾莉丝之剑：异常",value:8000,requires:["abnormal","exclusive_sword"],target:"艾莉丝之剑",condition:"装备专属剑且自身异常时+8,000"},
        {id:"twohand_sword4",capTypes:["physical","ultimate"],label:"双手剑增幅4",value:12000,requires:["single_sword"],target:"双手剑增幅4",condition:"单剑时物理与超必杀技上限+12,000"},
        {id:"near_combat",capType:"physical",label:"近身战斗2",value:5000,requires:["nearest"],target:"近身战斗2",condition:"攻击距离最近目标时+5,000"},
        {id:"one_blade_art",capType:"physical",label:"一天真刃之极意",value:15000,requires:["single_weapon","critical"],autoSelect:false,target:"一天真刃之极意",condition:"单武器物理暴击时概率触发；确认触发后勾选"},
        {id:"ultimate_base",capType:"ultimate",label:"无声之太刀",value:300000,requires:["ultimate"],target:"无声之太刀",condition:"该超必杀技自身上限+300,000"},
        {id:"angered_cap",capTypes:["skill","ultimate"],label:"你要干什么！：激昂",value:3000,requires:["angered"],autoSelect:false,target:"你要干什么！",condition:"每1,000攻击力+3,000；在来源中按实际千位数调整；默认不计入"}
      ]
    },
    "245": {
      id: "245",
      attackPickerLabel: "选择特技或超必杀技",
      attacks: [
        { id: "blaze_hunt", label: "烈焰狩猎（特技1）", baseCap: 9999, tags: ["physical", "fire", "skill"], note: "火属性物理特技。" },
        { id: "burn_stride", label: "燃烧突进（特技2）", baseCap: 9999, tags: ["physical", "fire", "skill"], note: "火属性物理特技。" },
        { id: "atomic_dragon", label: "原子龙（特技3）", baseCap: 9999, tags: ["physical", "fire", "skill"], note: "火属性物理特技。" },
        { id: "revenant_blazer", label: "亡魂烈焰（超必杀技）", baseCap: 9999, tags: ["physical", "fire", "ultimate"], note: "单体火属性超必杀技。" }
      ],
      capTypes: [
        { id: "general", label: "通用伤害上限", includes: ["general"] },
        { id: "physical", label: "物理伤害上限", includes: ["general", "physical"] },
        { id: "skill", label: "特技伤害上限", includes: ["general", "skill"] },
        { id: "ultimate", label: "超必杀技伤害上限", includes: ["general", "ultimate"] },
        { id: "fire", label: "火属性伤害上限", includes: ["general", "fire"] },
        { id: "boss", label: "对BOSS伤害上限", includes: ["general", "boss"], tags: ["boss"] },
        { id: "break", label: "Break中伤害上限", includes: ["general", "break"], tags: ["break"] },
        { id: "weak", label: "火属性弱点上限", includes: ["general", "weak"], tags: ["weak"] },
        { id: "single_weapon", label: "单武器", includes: [], tags: ["single_weapon"] },
        { id: "dual_red_buff", label: "双武器·红龙王Buff", includes: ["red_buff"], tags: ["dual_weapon", "red_buff"] },
        { id: "fire_weapon", label: "装备火属性武器", includes: [], tags: ["fire_weapon"] },
        { id: "self_break", label: "自身完成Break", includes: ["self_break"], tags: ["self_break"] },
        { id: "elapsed_20", label: "经过20秒", includes: ["elapsed"], tags: ["elapsed_20"] },
        { id: "elapsed_40", label: "经过40秒", includes: ["elapsed"], tags: ["elapsed_40"] },
        { id: "elapsed_60", label: "经过60秒", includes: ["elapsed"], tags: ["elapsed_60"] }
      ],
      sources: [
        { id: "dragon_will", capType: "fire", label: "继承龙之意志者", value: 80000, requires: ["fire"], target: "继承龙之意志者", condition: "火属性伤害上限+80,000" },
        { id: "red_dragon_buff", capType: "red_buff", label: "红龙王Buff", value: 50, unit: "%", requires: ["skill", "dual_weapon", "red_buff"], target: "继承龙之意志者", condition: "双武器时的红龙王Buff：特技伤害上限+50%" },
        { id: "primal_single", capTypes: ["physical", "ultimate"], label: "原始怒火：单武器", value: 100000, requires: ["single_weapon"], target: "原始怒火", condition: "仅装备1件武器时，物理与超必杀技上限+100,000" },
        { id: "elapsed_skill", capType: "elapsed", label: "原始怒火：经过时间", value: 20000, variants: [{ requires: ["elapsed_60"], value: 100000 }, { requires: ["elapsed_40"], value: 50000 }], requires: ["skill"], target: "原始怒火", condition: "特技上限：20秒+20,000／40秒+50,000／60秒+100,000" },
        { id: "fire_giga_drive", capTypes: ["physical", "ultimate"], label: "炎究极驱动", value: 5000, requires: ["fire"], target: "炎究极驱动", condition: "火属性物理与超必杀技上限+5,000" },
        { id: "fire_tera_drive", capTypes: ["physical", "ultimate"], label: "炎超阶驱动", value: 10000, requires: ["fire"], target: "炎超阶驱动", condition: "火属性物理与超必杀技上限+10,000" },
        { id: "fire_drive_limit", capTypes: ["physical", "ultimate"], label: "炎驱动界限突破IV", value: 10000, variants: [{ requires: ["single_weapon"], value: 20000 }], requires: ["fire"], target: "炎驱动界限突破IV", condition: "火属性物理与超必杀技上限+10,000；单武器为+20,000" },
        { id: "fire_raise_v", capType: "fire", label: "炎攻击提升V", value: 10000, requires: ["fire"], target: "炎攻击提升V", condition: "火属性伤害上限+10,000" },
        { id: "fire_soul", capType: "fire", label: "炎攻击之魂", value: 10000, requires: ["fire"], target: "炎攻击之魂", condition: "火属性伤害上限+10,000" },
        { id: "fire_soul_weak", capType: "weak", label: "炎攻击之魂：命中弱点", value: 10000, requires: ["fire", "weak"], target: "炎攻击之魂", condition: "以火属性命中弱点时再+10,000" },
        { id: "one_true_blade", capType: "physical", label: "一天真刃", value: 10000, requires: ["single_weapon"], target: "一天真刃", condition: "单武器时物理伤害上限+10,000" },
        { id: "break_boost_v", capType: "break", label: "Break增幅V", value: 30000, requires: ["physical", "break"], target: "Break增幅V", condition: "对Break状态敌人的物理伤害上限+30,000" },
        { id: "limit_breaker", capType: "physical", label: "界限破坏者II（3层）", value: 15000, requires: ["self_break"], target: "界限破坏者II", condition: "自身完成3次Break后，物理伤害上限合计+15,000" },
        { id: "giant_killing", capTypes: ["skill", "ultimate"], label: "巨型杀戮V", value: 10000, requires: ["boss"], target: "巨型杀戮V", condition: "对BOSS的特技与超必杀技上限+10,000" },
        { id: "crimson_jaw", capType: "ultimate", label: "红莲之颚", value: 100000, requires: ["self_break"], target: "红莲之颚", condition: "自身完成Break后，超必杀技伤害上限+100,000" },
        { id: "mega_charisma", capTypes: ["skill", "ultimate"], label: "龙王巨型领袖魅力", value: 15000, variants: [{ requires: ["single_weapon"], value: 30000 }], requires: [], target: "龙王巨型领袖魅力", condition: "全体特技与超必杀技上限+15,000；单武器为+30,000" },
        { id: "break_mastery", capType: "break", label: "【超越】Break精通II", value: 40000, variants: [{ requires: ["single_weapon"], value: 80000 }], requires: ["break"], target: "超越·Break精通II", condition: "对Break状态敌人+40,000；单武器为+80,000" },
        { id: "fire_weapon_ii", capType: "fire", label: "【超越】火焰武器II", value: 15000, variants: [{ requires: ["single_weapon"], value: 30000 }], requires: ["fire", "fire_weapon"], target: "超越·火焰武器II", condition: "装备火属性武器时+15,000；单武器为+30,000" }
      ]
    },
    "260": {
    id: "260",
    attackPickerLabel: "选择攻击魔法",
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
    capTypes: [
      { id: "general", label: "通用伤害上限", includes: ["general"] },
      { id: "physical", label: "物理伤害上限", includes: ["general", "physical"] },
      { id: "magic", label: "魔法伤害上限", includes: ["general", "magic"] },
      { id: "ice", label: "冰属性伤害上限", includes: ["general", "ice"] },
      { id: "ice_magic", label: "冰属性魔法上限", includes: ["general", "ice", "magic", "ice_magic"] },
      { id: "heavy_magic", label: "重魔法伤害上限", includes: ["general", "magic", "heavy_magic"] },
      { id: "boss", label: "对BOSS伤害上限", includes: ["general", "boss_magic", "boss_ice_magic"], tags: ["boss"] },
      { id: "critical", label: "暴击伤害上限", includes: ["general", "critical"], tags: ["critical"] },
      { id: "special", label: "特攻伤害上限", includes: ["general", "special"], tags: ["special"] },
      { id: "single_weapon", label: "单武器伤害上限", includes: [], tags: ["single_weapon"] },
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
      { id: "unusual_magician", capType: "ultimate", label: "超规格的魔术师", value: 200000, requires: [], target: "超规格的魔术师", condition: "超必杀技伤害上限+200,000" },
      { id: "transcend_ultimate", capType: "ultimate", label: "【超越】超必杀技增幅II", value: 10000, requires: [], target: "超越·超必杀技增幅II", condition: "超必杀技伤害上限+10,000" }
    ]
    }
  };
  const damageCapCharacter = damageCapProfiles[currentSavedBuildCharacterId] || {
    id: currentSavedBuildCharacterId,
    attackPickerLabel: "选择攻击方式",
    attacks: [],
    capTypes: [],
    sources: [],
  };
  if (!damageCapCharacter.attacks.some((attack) => attack.id === selectedCapAttack)) selectedCapAttack = damageCapCharacter.attacks[0]?.id || "";
  if (!damageCapCharacter.attacks.some((attack) => attack.id === selectedFinalCapAttack)) selectedFinalCapAttack = damageCapCharacter.attacks[0]?.id || "";

  const getCapAttack = () => damageCapCharacter.attacks.find((attack) => attack.id === selectedCapAttack) || damageCapCharacter.attacks[0];
  const getSelectedCapProfile = () => {
    const types = new Set();
    const tags = new Set();
    damageCapCharacter.capTypes.filter((type) => selectedCapTypes.has(type.id)).forEach((type) => {
      type.includes.forEach((included) => types.add(included));
      (type.tags || []).forEach((tag) => tags.add(tag));
    });
    return { types, tags };
  };
  const sourceApplies = (source, tags, types) => (source.capTypes || [source.capType || "general"]).some((type) => types.has(type)) && (source.requires || []).every((requirement) => tags.has(requirement));
  const getSourceValue = (source, tags) => {
    const variant = source.variants?.find((candidate) => candidate.requires.every((requirement) => tags.has(requirement)));
    return variant?.value ?? source.value;
  };
  const calculateDamageCap = () => {
    const attack = getCapAttack();
    const profile = getSelectedCapProfile();
    const tags = new Set([...attack.tags, ...profile.tags]);
    const selected = damageCapCharacter.sources.filter((source) => selectedCapSources.has(source.id));
    const applied = selected.filter((source) => sourceApplies(source, tags, profile.types));
    const flatSources = applied.filter((source) => source.unit !== "%");
    const percentSources = applied.filter((source) => source.unit === "%");
    const added = flatSources.reduce((total, source) => total + getSourceValue(source, tags), 0);
    const percent = percentSources.reduce((total, source) => total + getSourceValue(source, tags), 0);
    return { attack, tags, types: profile.types, selected, applied, added, percent, total: Math.round(attack.baseCap * (1 + percent / 100) + added) };
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
    if (panel.hasAttribute('data-rule-calculator')) return;
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
      publishBaseCalculatorState();
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
        saveHiddenBonusKeys();
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
    publishBaseCalculatorState();
  };

  const renderCapCalculator = () => {
    capAttackHeading.textContent = damageCapCharacter.attackPickerLabel || "选择攻击方式";
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

    const result = calculateDamageCap();
    capTotal.textContent = result.total.toLocaleString("zh-CN");
    const typeLabels = damageCapCharacter.capTypes.filter(({ id }) => selectedCapTypes.has(id)).map(({ label }) => label);
    const typeScenario = typeLabels.length ? `｜${typeLabels.join(" + ")}` : "｜未选择上限分类";
    capAdded.textContent = `${result.attack.label}：基础 ${result.attack.baseCap.toLocaleString("zh-CN")}${result.percent ? ` × ${1 + result.percent / 100}` : ""} + 固定上限 ${result.added.toLocaleString("zh-CN")}${typeScenario}`;

    capSourcePicker.innerHTML = "";
    const availableSources = damageCapCharacter.sources.filter((source) => sourceApplies(source, result.tags, result.types));
    availableSources.forEach((source) => {
      const value = getSourceValue(source, result.tags);
      const option = document.createElement("label");
      option.className = `cap-skill-option${selectedCapSources.has(source.id) ? " is-selected" : ""}`;
      option.innerHTML = `
        <input type="checkbox" ${selectedCapSources.has(source.id) ? "checked" : ""}>
        <span>${source.label}</span>
        <strong>+${value.toLocaleString("zh-CN")}${source.unit === "%" ? "%" : ""}</strong>
      `;
      option.querySelector("input").addEventListener("change", (event) => {
        if (event.target.checked) selectedCapSources.add(source.id);
        else selectedCapSources.delete(source.id);
        renderCapCalculator();
      });
      capSourcePicker.appendChild(option);
    });
    if (!availableSources.length) {
      capSourcePicker.innerHTML = '<div class="cap-empty cap-picker-empty">当前选择下没有可计入的来源。</div>';
    }

    capBreakdown.innerHTML = "";
    if (!result.applied.length) {
      capBreakdown.innerHTML = '<div class="cap-empty">当前没有满足条件并计入总数的上限加成。</div>';
      return;
    }

    result.applied.forEach((source) => {
      const value = getSourceValue(source, result.tags);
      const item = document.createElement("section");
      item.className = "cap-source-option";
      item.innerHTML = `
        <div class="cap-selected-source">
          <span><strong>${source.label}</strong><small>${source.condition}</small></span>
          <b>+${value.toLocaleString("zh-CN")}${source.unit === "%" ? "%" : ""}</b>
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
    const calculators = {
      bonus: { panel, close: closeButton },
      cap: { panel: capPanel, close: capCloseButton },
      final: { panel: finalDamagePanel, close: finalDamageCloseButton },
    };
    const target = calculators[calculator] || calculators.bonus;
    if (calculator === "final") renderFinalDamageCalculator();
    if (isMobile()) {
      if (!savedBuildViewer.hidden && !closeSavedBuildViewer()) return;
      Object.values(calculators).forEach((entry) => {
        resetPanelPosition(entry.panel);
        if (entry.panel !== target.panel) entry.panel.hidden = true;
      });
    }
    target.panel.hidden = false;
    target.close.focus();
  };
  const closeCalculator = (calculator) => {
    const calculators = {
      bonus: { panel, opener: openButton },
      cap: { panel: capPanel, opener: capOpenButton },
      final: { panel: finalDamagePanel, opener: finalDamageOpenButton },
    };
    const target = calculators[calculator] || calculators.bonus;
    target.panel.hidden = true;
    target.opener.focus();
  };

  openButton.addEventListener("click", () => openCalculator("bonus"));
  capOpenButton.addEventListener("click", () => openCalculator("cap"));
  finalDamageOpenButton.addEventListener("click", () => openCalculator("final"));
  closeButton.addEventListener("click", () => closeCalculator("bonus"));
  capCloseButton.addEventListener("click", () => closeCalculator("cap"));
  finalDamageCloseButton.addEventListener("click", () => closeCalculator("final"));
  savedBuildViewerOpen.addEventListener("click", openSavedBuildViewer);
  savedBuildViewerClose.addEventListener("click", closeSavedBuildViewer);
  savedBuildSaveChanges.addEventListener("click", () => {
    if (!saveSavedBuildDraft()) return;
    renderSavedBuildViewer();
  });
  savedBuildAddSkills.addEventListener("click", () => {
    const plan = readSavedBuildPlans().find((item) => item.id === selectedSavedBuildId);
    if (!plan) return;
    sessionStorage.setItem(savedBuildTransferKey, JSON.stringify({
      planId: plan.id,
      characterId: plan.characterId,
      skillIds: [...savedBuildDraftSkillIds],
      characterFreeIds: Array.isArray(plan.characterFreeIds) ? plan.characterFreeIds.map(String).filter((id) => savedBuildDraftSkillIds.includes(id)) : [],
      activeBreaks: Array.isArray(plan.activeBreaks) ? [...plan.activeBreaks] : [],
    }));
    location.href = `./index.html?editPlan=${encodeURIComponent(plan.id)}&draft=1#全部技能`;
  });
  savedBuildRestore.addEventListener("click", () => {
    const plan = readSavedBuildPlans().find((item) => item.id === selectedSavedBuildId);
    if (!plan) return;
    savedBuildDraftPlanId = plan.id;
    savedBuildDraftSkillIds = Array.isArray(plan.skillIds) ? [...new Set(plan.skillIds.map(String))] : [];
    savedBuildDraftDirty = false;
    expandedSavedBuildEffects.clear();
    renderSavedBuildViewer();
  });
  savedBuildSort.addEventListener("click", () => {
    if (savedBuildSortMode === "sc") savedBuildSortDirection = savedBuildSortDirection === "desc" ? "asc" : "desc";
    else savedBuildSortMode = "sc";
    renderSavedBuildViewer();
  });
  savedBuildRatingSort.addEventListener("click", () => {
    if (savedBuildSortMode === "rating") savedBuildRatingDirection = savedBuildRatingDirection === "desc" ? "asc" : "desc";
    else savedBuildSortMode = "rating";
    renderSavedBuildViewer();
  });
  finalDamagePlanSelect.addEventListener("change", () => {
    selectedFinalDamagePlanId = finalDamagePlanSelect.value;
    selectedFinalCapSources.clear();
    renderFinalDamageCalculator();
  });
  finalDamageAttacks.addEventListener("change", (event) => {
    const input = event.target.closest('input[name="finalCapAttack"]');
    if (!input) return;
    selectedFinalCapAttack = input.value;
    const plan = readSavedBuildPlans().find((item) => item.id === selectedFinalDamagePlanId);
    selectAllFinalCapSources(buildFinalCapSources(plan));
    renderFinalDamageCalculator();
  });
  finalDamageCapTypes.addEventListener("change", (event) => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) selectedFinalCapTypes.add(input.value);
    else selectedFinalCapTypes.delete(input.value);
    const plan = readSavedBuildPlans().find((item) => item.id === selectedFinalDamagePlanId);
    selectAllFinalCapSources(buildFinalCapSources(plan));
    renderFinalDamageCalculator();
  });
  finalDamageCapSources.addEventListener("change", (event) => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) selectedFinalCapSources.add(input.value);
    else selectedFinalCapSources.delete(input.value);
    renderFinalDamageCalculator();
  });
  finalDamageSummary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-final-cap-remove]");
    if (!button) return;
    selectedFinalCapSources.delete(String(button.dataset.finalCapRemove));
    renderFinalDamageCalculator();
  });
  finalDamageCapReset.addEventListener("click", () => {
    selectedFinalCapTypes.clear();
    selectedFinalCapSources.clear();
    renderFinalDamageCalculator();
  });
  savedBuildDetails.addEventListener("click", () => {
    savedBuildDetailsOpen = !savedBuildDetailsOpen;
    savedBuildEffectsOpen = false;
    expandedSavedBuildBonusKey = "";
    renderSavedBuildViewer();
  });
  savedBuildEffects.addEventListener("click", () => {
    savedBuildEffectsOpen = !savedBuildEffectsOpen;
    savedBuildDetailsOpen = false;
    expandedSavedBuildBonusKey = "";
    renderSavedBuildViewer();
  });
  savedBuildSelect.addEventListener("change", () => {
    if (savedBuildDraftDirty && !window.confirm("当前移除修改尚未保存，确定切换方案吗？")) {
      savedBuildSelect.value = selectedSavedBuildId;
      return;
    }
    selectedSavedBuildId = savedBuildSelect.value;
    savedBuildDraftPlanId = "";
    savedBuildDetailsOpen = false;
    savedBuildEffectsOpen = false;
    expandedSavedBuildBonusKey = "";
    expandedSavedBuildEffects.clear();
    renderSavedBuildViewer();
  });
  savedBuildSkills.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-saved-skill]");
    if (removeButton) {
      const id = String(removeButton.dataset.removeSavedSkill);
      savedBuildDraftSkillIds = savedBuildDraftSkillIds.filter((skillId) => skillId !== id);
      expandedSavedBuildEffects.delete(id);
      savedBuildDraftDirty = true;
      renderSavedBuildViewer();
      return;
    }
    const button = event.target.closest("[data-saved-bonus-key]");
    if (!button) return;
    const key = String(button.dataset.savedBonusKey);
    expandedSavedBuildBonusKey = expandedSavedBuildBonusKey === key ? "" : key;
    renderSavedBuildViewer();
  });
  savedBuildSkills.addEventListener("input", (event) => {
    const input = event.target.closest("[data-edit-skill-rating]");
    if (!input) return;
    const start = input.selectionStart;
    input.value = input.value.toUpperCase();
    input.classList.toggle("is-empty", !input.value.trim());
    if (start !== null) input.setSelectionRange(start, start);
  });
  savedBuildSkills.addEventListener("focusout", (event) => {
    const input = event.target.closest("[data-edit-skill-rating]");
    if (!input) return;
    const row = savedBuildSkillIndex.get(String(input.dataset.editSkillRating));
    if (!row) return;
    const edits = readSavedBuildEdits();
    const value = input.value.trim().toUpperCase();
    if (value === savedBuildRowValue(row, "mark", edits).trim().toUpperCase()) return;
    saveSkillRating(row, value);
    renderSavedBuildViewer();
  });
  savedBuildSkills.addEventListener("keydown", (event) => {
    const input = event.target.closest("[data-edit-skill-rating]");
    if (!input) return;
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    } else if (event.key === "Escape") {
      const row = savedBuildSkillIndex.get(String(input.dataset.editSkillRating));
      if (row) input.value = savedBuildRowValue(row, "mark", readSavedBuildEdits());
      input.blur();
    }
  });
  savedBuildSkills.addEventListener("dblclick", (event) => {
    const nameButton = event.target.closest("[data-saved-skill-effect]");
    if (!nameButton || savedBuildDetailsOpen) return;
    const id = String(nameButton.dataset.savedSkillEffect);
    if (expandedSavedBuildEffects.has(id)) expandedSavedBuildEffects.delete(id);
    else expandedSavedBuildEffects.add(id);
    renderSavedBuildViewer();
  });
  overlay.addEventListener("click", () => closeCalculator("bonus"));
  document.querySelectorAll("[data-calculator-target]").forEach((button) => {
    button.addEventListener("click", () => openCalculator(button.dataset.calculatorTarget));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!savedBuildViewer.hidden) {
      closeSavedBuildViewer();
      return;
    }
    const activePanel = lastOpenedCalculator === "bonus" ? panel : lastOpenedCalculator === "cap" ? capPanel : finalDamagePanel;
    if (!activePanel.hidden) closeCalculator(lastOpenedCalculator);
  });

  restoreAllButton.addEventListener("click", () => {
    hiddenKeys.clear();
    saveHiddenBonusKeys();
    renderSummary();
  });
  renderSummary();
  capResetButton.addEventListener("click", () => {
    selectedCapTypes.clear();
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
  enableDragging(finalDamagePanel);
  enableDragging(savedBuildViewer);

  window.matchMedia("(max-width: 720px)").addEventListener("change", (event) => {
    if (!event.matches) return;
    resetPanelPosition(panel);
    resetPanelPosition(capPanel);
    resetPanelPosition(finalDamagePanel);
    resetPanelPosition(savedBuildViewer);
    if (!savedBuildViewer.hidden) {
      panel.hidden = true;
      capPanel.hidden = true;
      finalDamagePanel.hidden = true;
      return;
    }
    const calculators = { bonus: panel, cap: capPanel, final: finalDamagePanel };
    const visible = Object.values(calculators).filter((entry) => !entry.hidden);
    if (visible.length < 2) return;
    Object.entries(calculators).forEach(([key, entry]) => { if (key !== lastOpenedCalculator) entry.hidden = true; });
  });

  if (selectedSavedBuildId) {
    openSavedBuildViewer();
    history.replaceState(null, "", `${location.pathname}${location.hash}`);
  }
})();
