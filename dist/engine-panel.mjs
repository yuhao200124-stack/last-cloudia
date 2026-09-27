// 游戏脚本结算面板：在伤害计算器里用沙盒引擎（游戏自带 Lua 脚本 + 主数据）直接结算所选招式。
// 输入来自计算器已有的状态（`lc:calculator-update` 事件）：读取报告、所选招式、局内开关、Boss 栏位。
// 网页旧规则的结果保持不变，这里只是并列的对照。
import { K } from './engine/battle.mjs';
import { RAW_BLESSING_RECORDS, USER_CONFIRMED_BLESSING_RECORDS } from './account-blessings.mjs';

// This account's blessings (加护) with the runtime values the reader captured (blessing levels scale the
// master value, e.g. 100 → 406), keyed by passive id and process segment; used when no report is imported.
const ACCOUNT_BLESSINGS = (() => {
  const m = new Map();
  for (const r of [...RAW_BLESSING_RECORDS, ...USER_CONFIRMED_BLESSING_RECORDS]) { const raw = r.raw; if (!raw?.localId || !Array.isArray(raw.values)) continue; if (!m.has(raw.localId)) m.set(raw.localId, {}); m.get(raw.localId)[raw.operationIndex ?? 0] = raw.values; }
  return m;
})();

const $ = id => document.getElementById(id);
const fmt = n => n == null || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString('zh-CN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RACE_CODES = { 战士: 1001, 狙击手: 1002, 骑士: 1003, 魔法师: 1004, 治疗师: 1005, 兽: 2001, 植物: 2002, 昆虫: 2003, 鸟: 2004, 魔法生物: 2005, 不死生物: 2006, 石: 2007, 机械: 2008, 精灵: 2009, 龙: 2010, 神: 2011, 鱼: 2012 };
const SWITCH_LABELS = { conditionBuffActive: '条件BUFF', reviveBuffActive: '复活后', guardBuffActive: '自身格挡', selfStateActive: '自身状态', partyConditionActive: '队伍', openingBuffActive: '开局BUFF' };

let engineModules = null, battle = null, loadedDress = null, loading = null;
let latest = null, report = null, assumed = new Set(), probabilityMode = 'assume', hpPercent = null, mpPercent = null, running = false, pending = false;
// No-report path: the out-of-battle panel is computed from master data (level growth + awakening + board +
// exclusive gear + trigger-1 passives); these fields only override it.
const manualPanel = { engineStr: null, engineInt: null };
const growthChoice = { level: null, awake: null, accountBlessings: true };
// Reader loadout report (LoadoutReport.json): the account's real growth and loadout for every owned character.
const LOADOUT_KEY = 'lc-engine-loadout-report';
let loadoutReport = null, switches = null;
try { const saved = localStorage.getItem(LOADOUT_KEY); if (saved) loadoutReport = JSON.parse(saved); } catch {}
// Loadout builder (配装模式): baseline = the character's own passives (个性 / 自带 / 超越) + account blessings, with or
// without the exclusive gear, everything upgradable at its maximum; the user then adds common passives one by one
// and sees what each one adds to the current build. Per character, kept in the browser.
const BUILD_KEY = dress => `lc-engine-build:${dress}`;
const defaultBuild = () => ({ on: false, exclusive: true, own: { personality: true, ownPassives: true, transcend: true, blessings: true }, selected: [] });
let build = defaultBuild(), buildDress = null, passiveIndex = null, buildCtx = null, buildGen = 0;
const buildGains = new Map(); // passive id → { gain, perCall } relative to the current build (removed) or candidate (added)
let buildCurrent = null, buildBaseline = null, buildQuery = '', lastBuildKey = '', buildOwnPaid = [];
function loadBuildFor(dress) {
  if (buildDress === dress) return;
  buildDress = dress; buildGains.clear(); buildCurrent = buildBaseline = null;
  try { const saved = JSON.parse(localStorage.getItem(BUILD_KEY(dress)) || 'null'); build = saved ? { ...defaultBuild(), ...saved, own: { ...defaultBuild().own, ...(saved.own || {}) } } : defaultBuild(); } catch { build = defaultBuild(); }
  syncBuildControls();
}
function saveBuild() { try { if (buildDress) localStorage.setItem(BUILD_KEY(buildDress), JSON.stringify(build)); } catch {} }
async function ensurePassiveIndex() {
  if (!passiveIndex) { const t = await fetch(new URL('./game-data/engine/passive-index.json', import.meta.url)).then(r => r.json()); passiveIndex = t.rows.map(r => ({ id: r[0], name: r[1], nameS: r[2], cost: r[3], order: r[4] })); }
  return passiveIndex;
}
const passiveLabel = id => { const row = passiveIndex?.find(r => r.id === id); const m = battle?.master.passive.get(id); const name = row?.nameS || m?.NAME || String(id); const trad = row?.name && row.name !== row.nameS ? ` <small>${esc(row.name)}</small>` : ''; return `${esc(name)}${trad}`; };
const passiveCost = id => passiveIndex?.find(r => r.id === id)?.cost ?? battle?.master.passive.get(id)?.COST ?? null;
function keepLoadout(report) {
  // keep only what the engine uses so the report fits in storage
  const slim = { tool: report.tool, version: report.version, capturedAt: report.capturedAt || null, units: (report.units || []).map(u => ({ unitDressId: u.unitDressId, lv: u.lv, limitbreakLv: u.limitbreakLv, awakeLv: u.awakeLv, abilityPieceInfo: u.abilityPieceInfo })), equipList: (report.equipList || []).map(e => ({ unitDressId: e.unitDressId, passiveSkillInfo: e.passiveSkillInfo, magicInfo: e.magicInfo, equipInfo: e.equipInfo, equipLvInfo: e.equipLvInfo })) };
  // reader v0.11: only the crests that are equipped and the enhancement levels of equipped items
  const used = new Set(), crestIds = new Set();
  for (const e of report.equipList || []) for (const part of String(e.equipInfo || '').split('-')) { const [pos, id] = part.split(':').map(Number); if (!id) continue; if (pos === 6) crestIds.add(id); else if (pos <= 4) used.add(id); }
  if (Array.isArray(report.crests)) { slim.crests = report.crests.filter(c => crestIds.has(c.userCrestId) || crestIds.has(c.key)).map(c => ({ key: c.key, crestId: c.crestId, userCrestId: c.userCrestId, favorite: c.favorite, slots: c.slots })); slim.crestSlotColumns = report.crestSlotColumns; }
  if (Array.isArray(report.equipItems)) { const cols = report.equipItemColumns || ['itemEquipId', 'possession', 'newRecord', 'alchemyLevel', 'favorite']; const idI = cols.indexOf('itemEquipId'); slim.equipItems = report.equipItems.filter(r => used.has(r[idI])); slim.equipItemColumns = cols; }
  loadoutReport = slim;
  try { localStorage.setItem(LOADOUT_KEY, JSON.stringify(slim)); } catch {}
}
async function ensureSwitches() { if (!switches) switches = await fetch(new URL('./game-data/engine/switch.json', import.meta.url)).then(r => r.json()); return switches; }
const loadoutNote = () => loadoutReport ? `已导入配装报告：${loadoutReport.units.length} 个角色${loadoutReport.capturedAt ? ` · ${loadoutReport.capturedAt}` : ''}` : '未导入配装报告（读取器 v0.9+ 在游戏角色页面运行生成的 LoadoutReport.json）';
// The site's own panel preview (old rules), shown beside the game-data panel as a comparison.
function websitePanel() {
  const p = latest?.panels || {};
  const base = Number.isFinite(latest?.attackBase) ? latest.attackBase : null;
  return { str: Number.isFinite(p.attack) ? p.attack : latest?.referenceMode === 'str' ? base : null, int: Number.isFinite(p.intelligence) ? p.intelligence : latest?.referenceMode === 'int' ? base : null };
}

const STYLE = `.engine-build-table td{vertical-align:middle}.engine-build-cands{display:flex;flex-wrap:wrap;gap:6px}.engine-build-cand{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid #3a526f;border-radius:6px;background:#1c2f45}.engine-build-cand button{min-height:26px;padding:2px 8px;font-size:.8rem}#enginePrimary .ep-hits{display:flex;gap:8px;align-items:center;justify-content:flex-end}#enginePrimary .ep-hits input{width:5.5em;min-height:32px;padding:4px 6px;font-size:.9rem}#enginePrimary .ep-hits small{color:#a5c0dc}#resultState{display:none}#ep-state{font-size:.8125rem;color:#b3d6f4;background:#234566;padding:5px 8px;border-radius:4px}#legacyResults{border-top:1px solid #3a526f;margin-top:14px;padding-top:10px}#legacyResults summary{color:#b3d6f4;font-size:.85rem}#legacyResults p{color:#c0d3e8}.engine-panel .engine-fields{margin:.5rem 0}.engine-panel .engine-hits td,.engine-panel .engine-hits th{white-space:nowrap}.engine-panel .engine-edits{margin:.5rem 0 0;padding-left:1.2rem}.engine-panel .engine-edits li{display:flex;justify-content:space-between;gap:1rem}.engine-panel .engine-conditional{display:block;margin:.25rem 0}.engine-panel .engine-conditional small{color:var(--muted,#6b7280)}.engine-panel details{margin-top:.5rem}.engine-panel ul{margin:.25rem 0 0;padding-left:1.2rem}`;
// ---- the main result card: driven by the sandbox; the old rules move under 网页旧规则（对照） ----
// The hit count is the calculator's own 基础命中段数 field (the user's tested count, saved per move by the
// workflow); the card edits that same field.
function siteHits() { const n = Number($('hits')?.value); return Number.isFinite(n) && n > 0 ? n : null; }
function currentHits() { const n = siteHits(); return n ? { hits: n, source: '基础命中段数' } : { hits: 1, source: '未填（按 1 段）' }; }
function mountPrimary() {
  const main = document.querySelector('#unifiedResults .result-main'); if (!main || $('enginePrimary')) return;
  const values = $('resultValues'); if (!values) return;
  const block = document.createElement('div'); block.id = 'enginePrimary';
  block.innerHTML = `<article class="primary-result"><span>普通每段伤害</span><strong id="ep-normal">—</strong><small id="ep-normalNote">游戏脚本结算 · 含随机波动与每段上限</small></article>
    <section class="damage-gauges" aria-label="伤害与上限">
      <div class="damage-gauge"><div class="gauge-label"><span>普通每段 <b id="ep-normalGauge">—</b></span><span>上限 <b id="ep-normalCap">—</b></span></div><div class="gauge-track" role="progressbar" aria-label="普通每段伤害占上限"><span id="ep-normalBar"></span></div></div>
      <div class="damage-gauge"><div class="gauge-label"><span>暴击每段 <b id="ep-critGauge">—</b></span><span>上限 <b id="ep-critCap">—</b></span></div><div class="gauge-track critical" role="progressbar" aria-label="暴击每段伤害占上限"><span id="ep-critBar"></span></div></div>
    </section>
    <article class="critical-result"><span title="触发暴击时的伤害；整次期望按局内暴击率计算">暴击每段伤害</span><strong id="ep-critical">—</strong></article>
    <div class="total-result"><span>整次技能期望伤害</span><strong id="ep-total">—</strong><small id="ep-totalNote"></small></div>
    <dl class="result-details">
      <div class="result-cap"><dt>每段伤害上限</dt><dd id="ep-cap">—</dd></div><div class="result-cap"><dt>暴击每段上限</dt><dd id="ep-capCrit">—</dd></div>
      <div><dt>命中段数</dt><dd class="ep-hits"><input id="engineHits" type="number" min="1" max="999" step="1" placeholder="网站"><small id="ep-hitsNote"></small></dd></div>
      <div><dt>全为普通命中时</dt><dd id="ep-normalTotal">—</dd></div><div><dt>本段结算攻击力</dt><dd id="ep-attack">—</dd></div><div><dt>本段结算防御力</dt><dd id="ep-defense">—</dd></div><div><dt>特攻匹配</dt><dd id="ep-killer">—</dd></div>
    </dl><p id="ep-note" class="result-cap-note"></p>`;
  const legacy = document.createElement('details'); legacy.id = 'legacyResults'; legacy.innerHTML = '<summary>网页旧规则（对照，不参与上方结果）</summary>';
  main.insertBefore(block, values); main.append(legacy);
  for (const id of ['error', 'resolveReview', 'resultValues']) if ($(id)) legacy.append($(id));
  const state = document.createElement('span'); state.id = 'ep-state'; state.textContent = '等待招式'; $('resultState')?.after(state);
  $('engineHits').addEventListener('change', e => { const h = $('hits'); if (!h) return; h.value = e.target.value; h.dispatchEvent(new Event('input', { bubbles: true })); h.dispatchEvent(new Event('change', { bubbles: true })); run(); });
}
let lastCtx = null;
const setPrimaryState = text => { const el = $('ep-state'); if (el) el.textContent = text; };
function renderPrimary(out, ctx) {
  mountPrimary(); lastCtx = ctx;
  // one 段 = the calls of the skill's first damaging bullet (二刀流／多段魔法 make two calls per 段); further bullets
  // (finishers, single-target variants) are listed in the detail table below
  const all = out.hits.filter(h => !h.cancelled && h.normal);
  const live = all.filter(h => h.bulletId === all[0]?.bulletId);
  const otherBullets = new Set(all.filter(h => h.bulletId !== all[0]?.bulletId).map(h => h.bulletId)).size;
  const first = live[0]; const st = out.stats; const critRate = Math.min(100, Math.max(0, st.crt.real || 0)) / 100;
  const { hits, source } = currentHits();
  if (document.activeElement !== $('engineHits')) $('engineHits').value = siteHits() || '';
  $('ep-hitsNote').textContent = `${source}${live.length > 1 ? ` · 每段 ${live.length} 次调用` : ''}`;
  if (!first) { for (const id of ['ep-normal', 'ep-critical', 'ep-total', 'ep-cap', 'ep-capCrit', 'ep-normalTotal', 'ep-attack', 'ep-defense', 'ep-killer', 'ep-normalGauge', 'ep-normalCap', 'ep-critGauge', 'ep-critCap']) $(id).textContent = '—'; $('ep-note').textContent = out.errors.length ? `脚本错误：${out.errors[0].name}` : '这个招式没有伤害段。'; return; }
  const range = (a, b) => `${fmt(a)} – ${fmt(b)}`;
  const expect = h => h.normal.mean * (1 - critRate) + (h.critical ? h.critical.mean : h.normal.mean) * critRate;
  const perCall = live.reduce((sum, h) => sum + expect(h), 0);
  $('ep-normal').textContent = range(first.normal.min, first.normal.max);
  $('ep-normalNote').textContent = `游戏脚本结算 · ${live.length > 1 ? `第1击（×${(first.dmgRatio / 10000).toLocaleString('zh-CN')}）；` : ''}含随机波动与每段上限`;
  $('ep-critical').textContent = first.critical ? range(first.critical.min, first.critical.max) : '—';
  $('ep-normalGauge').textContent = fmt(first.normal.max); $('ep-normalCap').textContent = fmt(first.cap);
  $('ep-critGauge').textContent = first.critical ? fmt(first.critical.max) : '—'; $('ep-critCap').textContent = fmt(first.critCap ?? first.cap);
  $('ep-normalBar').style.width = `${Math.min(100, first.cap ? first.normal.max / first.cap * 100 : 0)}%`;
  $('ep-critBar').style.width = `${Math.min(100, (first.critCap ?? first.cap) && first.critical ? first.critical.max / (first.critCap ?? first.cap) * 100 : 0)}%`;
  $('ep-total').textContent = `≈ ${fmt(perCall * hits)}`;
  $('ep-totalNote').textContent = `${hits} 段${live.length > 1 ? ` × ${live.length} 次调用` : ''} · 暴击率 ${Math.round(critRate * 100)}%（局内 CRT ${st.crt.real}）· 含逐段上限`;
  $('ep-cap').textContent = fmt(first.cap); $('ep-capCrit').textContent = fmt(first.critCap ?? first.cap);
  $('ep-normalTotal').textContent = range(live.reduce((a, h) => a + h.normal.min, 0) * hits, live.reduce((a, h) => a + h.normal.max, 0) * hits);
  $('ep-attack').textContent = fmt(first.attack); $('ep-defense').textContent = fmt(first.defense);
  $('ep-killer').textContent = first.killer ? `触发 · ×${first.killerFactor.toFixed(2)}` : '未触发';
  const notes = [];
  if (first.normal.max >= first.cap) notes.push('普通伤害触及上限');
  if (otherBullets) notes.push(`另有 ${otherBullets} 条弹道未计入整次期望，见下方明细`);
  if (out.assumptions?.length) notes.push(out.assumptions.join('；'));
  if (out.errors.length) notes.push(`${out.errors.length} 个脚本未能完整执行`);
  $('ep-note').textContent = notes.join(' · ');
}

function mount() {
  const aside = $('unifiedResults'); if (!aside || $('enginePanel')) return;
  mountPrimary();
  if (!$('enginePanelStyle')) { const st = document.createElement('style'); st.id = 'enginePanelStyle'; st.textContent = STYLE; document.head.append(st); }
  const card = document.createElement('section');
  card.id = 'enginePanel'; card.className = 'card engine-panel'; card.setAttribute('aria-labelledby', 'enginePanelTitle');
  card.innerHTML = `<div class="section-heading"><h3 id="enginePanelTitle">游戏脚本结算（沙盒引擎）</h3><span id="engineState" class="help">未开始</span></div>
    <p class="help">用读取器捕获的游戏 Lua 脚本和主数据逐段结算：每个被动、Buff、弹道按游戏自己的触发时机与顺序计算。上方「计算结果」卡即由这里驱动；网页旧规则的数值收在卡片底部的对照区。</p>
    <div class="fields two engine-fields"><label>当前 HP %<input id="engineHp" type="number" min="1" max="100" step="1" placeholder="满血100／濒死25／否则99"></label><label>当前 MP %<input id="engineMp" type="number" min="0" max="100" step="1" placeholder="按开关"></label></div>
    <div class="fields two engine-fields" id="enginePanelStats"><label>角色等级<select id="engineLevel"><option value="">最大</option></select></label><label>觉醒<select id="engineAwake"><option value="">最大</option></select></label><label>手填局外攻击力<input id="engineStr" type="number" min="0" step="1" placeholder="按游戏数据"></label><label>手填局外法强<input id="engineInt" type="number" min="0" step="1" placeholder="按游戏数据"></label></div>
    <div class="inline-options" id="engineAccountRow"><label><input id="engineAccountBlessings" type="checkbox" checked>计入本账号加护（${ACCOUNT_BLESSINGS.size} 项读取值）</label><label>配装报告<input id="engineLoadoutFile" type="file" accept=".json,application/json"></label><button type="button" id="engineLoadoutClear" class="secondary">清除</button></div>
    <p class="help" id="engineLoadoutNote"></p>
    <p class="help" id="enginePanelNote">未导入读取报告时，局外面板直接按游戏数据计算：等级成长 + 觉醒 + 全开能力盘 + 专属武器／防具满强化，再过一遍状态计算被动（与游戏面板一致）；手填只用于覆盖。导入报告后自动改用报告里的入场面板与实际配置。</p>
    <details id="engineBuild"><summary>配装模式：自带被动基线 → 逐个加被动看收益</summary>
      <p class="help">基线只装角色不花 SC 的自带被动（个性、固有被动、超越）＋本账号加护，等级／觉醒／能力盘／强化全按最大，专武可开关。启用后主结果卡按这里的配装结算；每加一个被动（本角色能力盘上要花 SC 的，或任意通用被动），就重新结算并给出它对当前配装的收益（去掉它伤害会少多少）。</p>
      <div class="inline-options"><label><input id="engineBuildOn" type="checkbox">启用配装模式</label><label><input id="engineBuildExclusive" type="checkbox" checked>有专武（专属武器＋防具）</label><label><input id="engineBuildOwnPersonality" type="checkbox" checked>个性</label><label><input id="engineBuildOwnPassives" type="checkbox" checked>固有免费被动</label><label><input id="engineBuildOwnTranscend" type="checkbox" checked>超越</label><label><input id="engineBuildOwnBlessings" type="checkbox" checked>加护</label></div>
      <div class="inline-options"><button type="button" id="engineBuildFromReport" class="secondary">从配装报告载入已装被动</button><button type="button" id="engineBuildRecalc" class="secondary">重算全部收益</button><button type="button" id="engineBuildClear" class="secondary">清空所选</button></div>
      <p class="help" id="engineBuildSummary">未启用。</p>
      <div class="entry-table-wrap"><table class="entry-table engine-build-table"><thead><tr><th>已选被动</th><th>SC</th><th>对当前配装的收益</th><th></th></tr></thead><tbody id="engineBuildRows"><tr><td colspan="4" class="help">还没有加被动。</td></tr></tbody></table></div>
      <div class="fields two engine-fields"><label>添加被动（名称，简体或繁体）<input id="engineBuildSearch" type="search" placeholder="例如 光魔法 / 月光 / 贯导"></label></div>
      <div id="engineBuildCandidates" class="help"></div>
    </details>
    <details id="engineTarget"><summary>目标：从游戏怪物表选择</summary><p class="help">直接用游戏 MonsterMst 的数值（HP、防御、魔抗、种族、属性抗性、Boss 自带被动），与读取报告里的 Boss 完全一致。不选时按上方计算器的目标栏位或读取报告的 Boss。</p>
      <div class="fields two engine-fields"><label>Boss 名称<input id="engineMonsterName" list="engineMonsterNames" placeholder="输入名称筛选"><datalist id="engineMonsterNames"></datalist></label><label>版本（等级 / HP / 防御 / 魔抗）<select id="engineMonsterVariant"><option value="">先输入名称</option></select></label></div>
      <p class="help" id="engineMonsterNote">未选择怪物表目标。</p><button type="button" id="engineMonsterClear" class="secondary">改回计算器目标</button></details>
    <details id="enginePreCasts"><summary>施放前已用过的技能（累计次数类被动、自我 Buff 魔法）</summary><p class="help">按这场战斗里在本招之前已经用过的顺序填次数：例如先放神託的誓言再打必杀，必杀上限就会多 100,000；累计类被动（超必殺技階段增幅等）也按次数累加。默认全为 0。</p><div id="enginePreCastList" class="fields two engine-fields"></div></details>
    <div class="inline-options"><label><input id="engineProbability" type="checkbox" checked>概率效果按已触发计算</label><button type="button" id="engineRun" class="primary">用游戏脚本结算</button></div>
    <div id="engineResult"></div>`;
  const anchor = $('unifiedSummary') || aside.querySelector('.result-notes');
  if (anchor) aside.insertBefore(card, anchor); else aside.append(card);
  $('engineRun').addEventListener('click', () => run(true));
  $('engineProbability').addEventListener('change', e => { probabilityMode = e.target.checked ? 'assume' : 'skip'; run(); });
  $('engineHp').addEventListener('change', e => { hpPercent = e.target.value === '' ? null : Number(e.target.value); run(); });
  $('engineMp').addEventListener('change', e => { mpPercent = e.target.value === '' ? null : Number(e.target.value); run(); });
  for (const id of ['engineStr', 'engineInt']) $(id).addEventListener('change', () => { manualPanel[id] = $(id).value === '' ? null : Number($(id).value); run(); });
  $('engineAccountBlessings').addEventListener('change', e => { growthChoice.accountBlessings = e.target.checked; run(); });
  $('engineLoadoutNote').textContent = loadoutNote();
  $('engineLoadoutFile').addEventListener('change', async e => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); const M = await ensureEngine(null); if (!M.isLoadoutReport(j)) throw new Error('不是读取器的配装报告（LoadoutReport.json）'); keepLoadout(j); $('engineLoadoutNote').textContent = loadoutNote(); run(); }
    catch (err) { $('engineLoadoutNote').textContent = `配装报告未导入：${err.message}`; }
    e.target.value = '';
  });
  $('engineMonsterName').addEventListener('input', () => fillMonsterVariants($('engineMonsterName').value));
  $('engineMonsterName').addEventListener('focus', () => ensureMonsters().then(() => fillMonsterVariants($('engineMonsterName').value)));
  $('engineMonsterVariant').addEventListener('change', e => { monsterChoice = Number(e.target.value) || null; try { if (monsterChoice) localStorage.setItem(MONSTER_KEY, String(monsterChoice)); else localStorage.removeItem(MONSTER_KEY); } catch {} run(); });
  $('engineMonsterClear').addEventListener('click', () => { monsterChoice = null; try { localStorage.removeItem(MONSTER_KEY); } catch {} $('engineMonsterName').value = ''; $('engineMonsterVariant').innerHTML = '<option value="">先输入名称</option>'; $('engineMonsterNote').textContent = '未选择怪物表目标。'; run(); });
  $('engineLoadoutClear').addEventListener('click', () => { loadoutReport = null; try { localStorage.removeItem(LOADOUT_KEY); } catch {} $('engineLoadoutNote').textContent = loadoutNote(); run(); });
  $('engineLevel').addEventListener('change', e => { growthChoice.level = e.target.value === '' ? null : Number(e.target.value); run(); });
  $('engineAwake').addEventListener('change', e => { growthChoice.awake = e.target.value === '' ? null : Number(e.target.value); run(); });
  $('engineResult').addEventListener('change', e => { const key = e.target.dataset.assume; if (!key) return; if (e.target.checked) assumed.add(key); else assumed.delete(key); run(); });
  // loadout builder controls
  $('engineBuildOn').addEventListener('change', e => { build.on = e.target.checked; saveBuild(); buildGains.clear(); if (build.on) ensurePassiveIndex().then(renderCandidates); run(); });
  $('engineBuildExclusive').addEventListener('change', e => { build.exclusive = e.target.checked; saveBuild(); buildGains.clear(); run(); });
  for (const [id, key] of [['engineBuildOwnPersonality', 'personality'], ['engineBuildOwnPassives', 'ownPassives'], ['engineBuildOwnTranscend', 'transcend'], ['engineBuildOwnBlessings', 'blessings']]) $(id).addEventListener('change', e => { build.own[key] = e.target.checked; saveBuild(); buildGains.clear(); run(); });
  $('engineBuildClear').addEventListener('click', () => { build.selected = []; saveBuild(); buildGains.clear(); run(); });
  $('engineBuildRecalc').addEventListener('click', () => { buildGains.clear(); if (buildCtx) computeGains(buildCtx); });
  $('engineBuildFromReport').addEventListener('click', async () => {
    if (!loadoutReport || !buildDress) { $('engineBuildSummary').textContent = '先导入配装报告（上方文件框）。'; return; }
    const M = await ensureEngine(buildDress);
    const lo = M.unitLoadout(loadoutReport, battle.master, await ensureSwitches(), buildDress);
    if (!lo) { $('engineBuildSummary').textContent = '配装报告里没有这个角色。'; return; }
    const c = await gameCharacter(buildDress); const own = new Set(ownPassiveIds(c, true));
    build.selected = lo.passives.filter(id => !own.has(id)); build.on = true; saveBuild(); buildGains.clear(); syncBuildControls(); run();
  });
  $('engineBuildSearch').addEventListener('input', e => { buildQuery = e.target.value.trim(); ensurePassiveIndex().then(renderCandidates); });
  $('engineBuildCandidates').addEventListener('click', async e => {
    const add = e.target.closest('[data-build-add]'), probe = e.target.closest('[data-build-probe]');
    if (add) { const id = Number(add.dataset.buildAdd); if (!build.selected.includes(id)) build.selected.push(id); build.on = true; saveBuild(); buildGains.clear(); syncBuildControls(); run(); }
    else if (probe) { const id = Number(probe.dataset.buildProbe); probe.disabled = true; probe.textContent = '…'; const r = await probeCandidate(id); probe.disabled = false; probe.textContent = r == null ? '试算' : `${r >= 0 ? '+' : ''}${(r * 100).toFixed(1)}%`; }
  });
  $('engineBuildRows').addEventListener('click', e => { const rm = e.target.closest('[data-build-remove]'); if (!rm) return; build.selected = build.selected.filter(id => id !== Number(rm.dataset.buildRemove)); saveBuild(); buildGains.clear(); run(); });
}
function syncBuildControls() {
  if (!$('engineBuildOn')) return;
  $('engineBuildOn').checked = build.on; $('engineBuildExclusive').checked = build.exclusive;
  $('engineBuildOwnPersonality').checked = build.own.personality; $('engineBuildOwnPassives').checked = build.own.ownPassives; $('engineBuildOwnTranscend').checked = build.own.transcend; $('engineBuildOwnBlessings').checked = build.own.blessings;
  if (build.on) $('engineBuild').open = true;
}
// The character's own passives (game-data/c/<dress>.json) split by SC: COST 99 marks the free ones (unique
// passives such as 赤裸之力II / 救世的聖劍, 【超越】, 迷宮踏破) that are always on; the rest cost SC like any common
// passive and are offered as candidates. `all` ignores the group toggles.
const FREE_COST = 99;
const isFreePassive = id => { const c = battle?.master.passive.get(id)?.COST; return c == null || c >= FREE_COST; };
function ownPassiveIds(c, all = false) {
  if (!c) return [];
  const g = all ? { personality: true, ownPassives: true, transcend: true, blessings: true } : build.own;
  return [...(g.personality ? (c.personality || []).map(p => p.passive) : []), ...(g.ownPassives ? (c.ownPassives || []).map(p => p.passive).filter(isFreePassive) : []), ...(g.transcend ? (c.transcend || []).map(p => p.passive) : []), ...(g.blessings ? (c.blessings || []) : [])];
}
const ownPaidIds = c => (c?.ownPassives || []).map(p => p.passive).filter(id => !isFreePassive(id));
// Expected damage per call of the move (the main card's metric) from one scenario run.
function metricOf(out) {
  const all = out.hits.filter(h => !h.cancelled && h.normal), live = all.filter(h => h.bulletId === all[0]?.bulletId);
  const critRate = Math.min(100, Math.max(0, out.stats.crt.real || 0)) / 100;
  const perCall = live.reduce((sum, h) => sum + h.normal.mean * (1 - critRate) + (h.critical ? h.critical.mean : h.normal.mean) * critRate, 0);
  return { perCall, cap: live[0]?.cap ?? null, errors: out.errors.length };
}
// One evaluation of a passive set with the current move / target / state (single random 0.95: relative gains only).
function evalBuild(ctx, passiveIds) {
  const M = engineModules;
  battle.reset();
  const spec = { ...ctx.attackerSpec, passives: passiveIds.map(id => (typeof id === 'object' ? id : { id })) };
  const a = M.addAttacker(battle, spec), t = M.addTarget(battle, ctx.targetSpec);
  return metricOf(M.runScenario({ battle, attacker: a, target: t, skill: { id: ctx.move.id }, state: ctx.state, assume: { probability: probabilityMode, instances: [...ctx.assumeSet] }, randoms: [0.95] }));
}
const yieldUi = () => new Promise(r => setTimeout(r, 0));
// Baseline (own only) and the marginal of every selected passive, computed one run at a time so the page stays live;
// a new main run cancels the loop and reschedules it.
async function computeGains(ctx) {
  const gen = ++buildGen;
  const rows = $('engineBuildRows'); if (!rows) return;
  try {
    if (!buildCurrent) { buildCurrent = evalBuild(ctx, ctx.buildPassives); renderBuild(ctx); await yieldUi(); if (gen !== buildGen) return; }
    if (!buildBaseline) { buildBaseline = evalBuild(ctx, ctx.buildOwn); renderBuild(ctx); await yieldUi(); if (gen !== buildGen) return; }
    for (const id of build.selected) {
      if (buildGains.has(id)) continue;
      const without = evalBuild(ctx, ctx.buildPassives.filter(p => (p.id ?? p) !== id));
      buildGains.set(id, { removed: true, perCall: without.perCall, gain: without.perCall > 0 ? buildCurrent.perCall / without.perCall - 1 : null });
      renderBuild(ctx); await yieldUi(); if (gen !== buildGen || running) return;
    }
  } catch (err) { console.error(err); $('engineBuildSummary').textContent = `收益计算失败：${err.message}`; }
}
async function probeCandidate(id) {
  if (!buildCtx || !buildCurrent) return null;
  await engineModules.loadPassives(battle.master, [id]);
  if (!battle.master.passive.has(id)) return null;
  const withIt = evalBuild(buildCtx, [...buildCtx.buildPassives, { id }]);
  buildGains.set(id, { removed: false, perCall: withIt.perCall, gain: buildCurrent.perCall > 0 ? withIt.perCall / buildCurrent.perCall - 1 : null });
  return buildGains.get(id).gain;
}
const pct = g => g == null ? '—' : `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%`;
function renderBuild(ctx) {
  const rows = $('engineBuildRows'), summary = $('engineBuildSummary'); if (!rows) return;
  if (!build.on) { summary.textContent = '未启用。启用后基线按自带被动结算，加的每个被动都单独给出收益。'; rows.innerHTML = '<tr><td colspan="4" class="help">还没有加被动。</td></tr>'; return; }
  const sc = build.selected.reduce((s, id) => { const c = passiveCost(id); return s + (c && c < 99 ? c : 0); }, 0);
  const hits = currentHits().hits;
  const cur = buildCurrent ? `当前配装每次 <b>${fmt(buildCurrent.perCall)}</b>（${hits} 段 ≈ ${fmt(buildCurrent.perCall * hits)}）` : '当前配装：结算中…';
  const base = buildBaseline ? ` · 自带基线每次 ${fmt(buildBaseline.perCall)}${buildCurrent && buildBaseline.perCall > 0 ? `（当前比基线 ${pct(buildCurrent.perCall / buildBaseline.perCall - 1)}）` : ''}` : '';
  summary.innerHTML = `${cur}${base} · 已选 ${build.selected.length} 个被动 · SC 合计 ${sc}${build.exclusive ? ' · 有专武' : ' · 无专武'}${ctx?.buildNote ? ` · ${esc(ctx.buildNote)}` : ''}<br><small>收益按随机 0.95 单点比较；上限附近的被动收益会随段数上限变化。</small>`;
  rows.innerHTML = build.selected.length ? build.selected.map(id => { const g = buildGains.get(id); const missing = !battle?.master.passive.has(id); return `<tr><td>${passiveLabel(id)}${missing ? ' <small>（主数据缺失）</small>' : ''}</td><td>${passiveCost(id) ?? '—'}</td><td>${g ? (g.removed ? `<b>${pct(g.gain)}</b> <small>去掉它每次 ${fmt(g.perCall)}</small>` : pct(g.gain)) : '<small>计算中…</small>'}</td><td><button type="button" class="secondary" data-build-remove="${id}">移除</button></td></tr>`; }).join('') : '<tr><td colspan="4" class="help">还没有加被动：在下面搜索并点「加入」。</td></tr>';
}
function candidateChip(id, nameS, name, cost) {
  const g = buildGains.get(id);
  return `<span class="engine-build-cand"><b>${esc(nameS)}</b>${name && name !== nameS ? ` <small>${esc(name)}</small>` : ''} <small>SC ${cost == null ? '—' : cost >= FREE_COST ? '免' : cost}</small> <button type="button" class="secondary" data-build-probe="${id}" title="加进当前配装的收益">${g && !g.removed ? pct(g.gain) : '试算'}</button><button type="button" class="primary" data-build-add="${id}">加入</button></span>`;
}
function renderCandidates() {
  const box = $('engineBuildCandidates'); if (!box || !passiveIndex) return;
  const q = buildQuery.toLowerCase(), taken = new Set(build.selected);
  const byId = new Map(passiveIndex.map(r => [r.id, r]));
  const own = buildOwnPaid.filter(id => !taken.has(id)).map(id => { const r = byId.get(id), m = battle?.master.passive.get(id); return candidateChip(id, r?.nameS || m?.NAME || String(id), r?.name, r?.cost ?? m?.COST); });
  const ownBlock = own.length ? `<p class="help">本角色能力盘上要花 SC 的被动：</p><div class="engine-build-cands">${own.join('')}</div>` : '';
  if (!q) { box.innerHTML = `${ownBlock}<p class="help">或输入名称筛选任意通用被动（例如 光魔法、暴击、上限、月光）。</p>`; return; }
  const list = passiveIndex.filter(r => !taken.has(r.id) && (r.nameS.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))).sort((a, b) => a.order - b.order || a.id - b.id).slice(0, 40);
  box.innerHTML = `${ownBlock}${list.length ? `<p class="help">搜索结果：</p><div class="engine-build-cands">${list.map(r => candidateChip(r.id, r.nameS, r.name, r.cost)).join('')}</div>` : '<p class="help">没有匹配的被动。</p>'}`;
}

let siteIndex = null, characterCache = new Map();
async function siteDress() {
  const characterId = new URLSearchParams(location.search).get('character');
  if (!characterId) return null;
  if (!siteIndex) siteIndex = await fetch(new URL('./game-data/index.json', import.meta.url)).then(r => r.json()).catch(() => ({}));
  return siteIndex?.site?.[characterId] || null;
}
async function gameCharacter(unitDressId) {
  if (!characterCache.has(unitDressId)) characterCache.set(unitDressId, fetch(new URL(`./game-data/c/${unitDressId}.json`, import.meta.url)).then(r => r.json()).catch(() => null));
  return characterCache.get(unitDressId);
}
async function ensureEngine(unitDressId) {
  if (!engineModules) engineModules = await Promise.all([import('./engine/battle.mjs'), import('./engine/engine-data.mjs'), import('./engine/scenario.mjs'), import('./engine/report-adapter.mjs'), import('./engine/loadout-adapter.mjs')]).then(([b, d, s, r, l]) => ({ ...b, ...d, ...s, ...r, ...l }));
  if (unitDressId == null) return engineModules;
  if (!battle || loadedDress !== unitDressId) {
    setState('正在读取游戏脚本与主数据…');
    const { master, scripts } = await engineModules.loadEngineData({ unitDressIds: unitDressId ? [unitDressId] : [] });
    battle = new engineModules.Battle(master, scripts, { probability: probabilityMode });
    loadedDress = unitDressId;
    if (monsterBundle) battle.master.merge(monsterBundle); if (monsterPassiveBundle) battle.master.merge(monsterPassiveBundle); if (crestBundle) battle.master.merge(crestBundle);
  }
  return engineModules;
}
// Crests (徽章): CrestMst + the trait passive pool (engine/crests.json), loaded when a loadout carries one.
let crestBundle = null;
async function ensureCrests() {
  if (!crestBundle) { crestBundle = await fetch(new URL('./game-data/engine/crests.json', import.meta.url)).then(r => r.json()); if (battle) battle.master.merge(crestBundle); }
  return crestBundle;
}

const setState = text => { const el = $('engineState'); if (el) el.textContent = text; };

// Boss-class monsters from MonsterMst (engine/monsters.json, loaded on demand) for the target picker.
const MONSTER_KEY = 'lc-engine-target-monster';
let monsterBundle = null, monsterPassiveBundle = null, monsterChoice = null;
try { monsterChoice = Number(localStorage.getItem(MONSTER_KEY)) || null; } catch {}
async function ensureMonsters() {
  if (!monsterBundle) { monsterBundle = await fetch(new URL('./game-data/engine/monsters.json', import.meta.url)).then(r => r.json()); if (battle) battle.master.merge(monsterBundle);
    const names = [...new Set(monsterBundle.MonsterMst.rows.map(r => r[1]))].sort((a, b) => a.localeCompare(b, 'zh'));
    if ($('engineMonsterNames')) $('engineMonsterNames').innerHTML = names.map(n => `<option value="${esc(n)}"></option>`).join(''); }
  return monsterBundle;
}
async function ensureMonsterPassives() {
  if (!monsterPassiveBundle) { monsterPassiveBundle = await fetch(new URL('./game-data/engine/monster-passives.json', import.meta.url)).then(r => r.json()); if (battle) battle.master.merge(monsterPassiveBundle); }
  return monsterPassiveBundle;
}
const monsterRows = () => { const t = monsterBundle?.MonsterMst; if (!t) return []; return t.rows.map(r => Object.fromEntries(t.cols.map((c, i) => [c, r[i]]))); };
function fillMonsterVariants(name) {
  const sel = $('engineMonsterVariant'); if (!sel || !monsterBundle) return;
  const rows = monsterRows().filter(r => name && (r.NAME === name || r.NAME.includes(name))).sort((a, b) => (b.LV - a.LV) || (b.HP - a.HP)).slice(0, 60);
  sel.innerHTML = `<option value="">${rows.length ? '选择版本' : '没有匹配的怪物'}</option>` + rows.map(r => `<option value="${r.MONSTER_ID}" ${r.MONSTER_ID === monsterChoice ? 'selected' : ''}>${esc(r.NAME)} Lv${r.LV} · HP ${fmt(r.HP)} · 防 ${fmt(r.DEF)} · 魔抗 ${fmt(r.MDEF)} · ${esc(RACE_NAMES[r.CHARACTER_TYPE] || r.CHARACTER_TYPE)}</option>`).join('');
}
const RACE_NAMES = Object.fromEntries(Object.entries(RACE_CODES).map(([k, v]) => [v, k]));
function monsterNote(spec) {
  if (!spec) return '未选择怪物表目标。';
  const res = ['火', '冰', '树', '雷', '光', '暗'].map((n, i) => `${n}${spec.elemResist[i + 1] > 0 ? '+' : ''}${spec.elemResist[i + 1]}`).join(' ');
  return `${spec.name} Lv${spec.level} · HP ${fmt(spec.stats.hp)} · 攻 ${fmt(spec.stats.str)} · 防 ${fmt(spec.stats.def)} · 法强 ${fmt(spec.stats.int)} · 魔抗 ${fmt(spec.stats.mnd)} · ${RACE_NAMES[spec.charTypes[0]] || spec.charTypes[0]} · 抗性 ${res} · 自带被动 ${spec.passives.length} 项`;
}

function targetFromFields(detail) {
  const races = [...document.querySelectorAll('[data-boss-race]:checked')].map(el => RACE_CODES[el.dataset.bossRace]).filter(Boolean);
  const res = [...document.querySelectorAll('[data-boss-resistance]')].map(el => Number(el.value) || 0);
  return { name: $('bossPreset')?.selectedOptions[0]?.textContent || '目标', isBoss: $('boss')?.checked !== false, charTypes: races, stats: { hp: 99999999, mp: 100, def: Number($('bossDefense')?.value) || 0, mnd: Number($('bossMind')?.value) || 0, str: 0, int: 0 }, elemResist: { 1: res[0] || 0, 2: res[1] || 0, 3: res[2] || 0, 4: res[3] || 0, 5: res[4] || 0, 6: res[5] || 0 } };
}

// HP follows the calculator's two switches exactly like the old rules: 满血 → 100% (full-HP effects such as
// 月光II fire), 濒死 → 25%, neither → 99% (alive and healthy, but nothing that needs full HP fires).
function stateFromSwitches(detail) {
  const sel = detail.selection || {};
  const full = sel.fullHp || $('fullHp')?.checked, low = sel.lowHp || $('lowHp')?.checked;
  const hp = hpPercent ?? (low ? 25 : full ? 100 : 99);
  const mp = mpPercent ?? (sel.mpLow || $('mpLow')?.checked ? 20 : 100);
  return { hpPercent: hp, mpPercent: mp, openingBuffActive: $('openingBuffActive') ? $('openingBuffActive').checked : true, preCasts: preCastList() };
}

// Skills used earlier in the battle (per character): id → count; the list is rebuilt for the attacker's own skills.
const preCastCounts = new Map();
function preCastList() { const out = []; for (const [id, n] of preCastCounts) for (let i = 0; i < n; i++) out.push(Number(id)); return out; }
function renderPreCasts(attacker, master, currentMoveId) {
  const box = $('enginePreCastList'); if (!box) return;
  const skills = (attacker?.skills || []).filter(s => s.type !== 9);
  const key = skills.map(s => s.id).join(',');
  if (box.dataset.key === key) return; box.dataset.key = key;
  for (const id of [...preCastCounts.keys()]) if (!skills.some(s => s.id === Number(id))) preCastCounts.delete(id);
  box.innerHTML = skills.map(s => `<label>${esc(master.skill.get(s.id)?.NAME || s.id)}<small> · ${{ 1: '技能', 2: '魔法', 5: '必杀', 3: '咏唱', 4: '召唤', 7: '圣物' }[s.type] || s.type}</small><input type="number" min="0" max="20" step="1" data-precast="${s.id}" value="${preCastCounts.get(String(s.id)) || 0}"></label>`).join('');
  box.onchange = e => { const id = e.target.dataset.precast; if (!id) return; const n = Math.max(0, Math.min(20, Number(e.target.value) || 0)); if (n) preCastCounts.set(id, n); else preCastCounts.delete(id); run(); };
}

function activeSwitchGroups() {
  return Object.keys(SWITCH_LABELS).filter(id => id !== 'openingBuffActive' && $(id)?.checked);
}

async function run(force = false) {
  mount();
  if (!latest) { setState('等待计算器状态'); return; }
  if (running) { pending = true; return; }
  const move = latest.gameMove;
  if (!move?.id) { setState('先选择有游戏数据的招式'); setPrimaryState('该招式没有游戏数据，见下方网页旧规则'); $('engineResult').innerHTML = ''; return; }
  setPrimaryState('计算中…');
  running = true;
  try {
    const dress = report?.units?.[0]?.unitId || Number(latest.unitDressId) || await siteDress();
    if (!dress) { setState('先导入读取报告或选择游戏角色'); running = false; return; }
    const M = await ensureEngine(dress);
    setState('结算中…');
    battle.reset();
    let attackerSpec;
    if (report && M.isBattleReport(report) && report.units?.[0]?.unitId === dress) { attackerSpec = M.attackerFromReport(report, battle.master); await M.loadPassives(battle.master, attackerSpec.passives.map(p => p.id)); const extra = attackerSpec.passives.filter(p => p.processes).length; if (extra) attackerSpec.statsSource = `${attackerSpec.statsSource}（含徽章／支援等 ${extra} 项非被动来源）`; }
    else {
      // no report: the game character at the chosen growth (default max) with every own passive and its exclusive gear;
      // the out-of-battle panel comes from master data (scenario.mjs panelGiven:false), manual fields override it
      const c = await gameCharacter(dress);
      fillGrowthChoices(M, dress);
      const ids = latest.ownPassives?.length ? latest.ownPassives : c ? [...(c.personality || []).map(p => p.passive), ...(c.ownPassives || []).map(p => p.passive), ...(c.transcend || []).map(p => p.passive), ...(c.blessings || [])] : [];
      const override = {}; if (manualPanel.engineStr != null) override.str = manualPanel.engineStr; if (manualPanel.engineInt != null) override.int = manualPanel.engineInt;
      const blessings = growthChoice.accountBlessings ? [...ACCOUNT_BLESSINGS].filter(([id]) => battle.master.passive.has(id)).map(([id, params]) => ({ id, params })) : [];
      const fromLoadout = loadoutReport ? M.attackerFromLoadout(loadoutReport, battle.master, await ensureSwitches(), dress, { extraPassives: blessings }) : null;
      // passives learned from other characters live outside the character bundle: fetch their id buckets first
      const unresolved = fromLoadout ? await M.loadPassives(battle.master, fromLoadout.passives.map(p => p.id)) : [];
      for (const id of ['engineLevel', 'engineAwake']) if ($(id)) $(id).disabled = !!fromLoadout;
      if (fromLoadout) {
        // the account's real loadout: its level / awakening / opened board, equipped passives, gear, magic and crest
        const lo = fromLoadout.loadout;
        let crestNote = '';
        if (lo.crest) {
          await ensureCrests();
          const cm = battle.master.crest.get(lo.crest.crestId);
          const traitNames = lo.crest.traits.map(t => battle.master.passive.get(t.passive)?.NAME || `词条${t.passive}`);
          crestNote = ` · 徽章 ${cm ? cm.NAME.replace(/^Crest:\s*/, '') : `#${lo.crest.crestId}（主数据缺失）`}${traitNames.length ? '：' + traitNames.join('、') : '（无词条）'}`;
        }
        const gearNote = lo.equips.map(e => battle.master.itemEquip.get(e.id)?.NAME || e.id).join('、') || '无装备';
        const unknown = lo.missingPassives + unresolved.length;
        // the user's rule: the report decides what is equipped; everything upgradable is taken at its maximum
        attackerSpec = { ...fromLoadout, name: c?.nameS || fromLoadout.name, stats: override, statsSource: `配装报告（${lo.passives.length} 个被动 · ${gearNote}${crestNote}${growthChoice.accountBlessings ? ' ＋本账号加护' : ''}；等级／觉醒／能力盘／强化／徽章等级按最大${unknown ? `；${unknown} 个被动未在主数据中找到` : ''}）` };
      } else {
        const equips = M.exclusiveEquipment(battle.master, dress);
        const passives = [...ids.map(id => ({ id })), ...blessings.filter(b => !ids.includes(b.id))];
        attackerSpec = { unitDressId: dress, name: c?.nameS, panelGiven: false, level: growthChoice.level, awake: growthChoice.awake, stats: override, passives, personality: c?.personality || [], equips, statsSource: `游戏数据计算（${loadoutReport ? '配装报告里没有这个角色；' : ''}${equips.length ? equips.map(e => battle.master.itemEquip.get(e.id)?.NAME).join('、') + ' 满强化' : '无专属装备'}；被动按全部自带技能${growthChoice.accountBlessings ? '＋本账号加护' : ''}${Object.keys(override).length ? '；' + Object.keys(override).map(k => ({ str: '攻击力', int: '法强' }[k]) + '按手填').join('、') : ''}）` };
      }
      // 配装模式 replaces both: own passives (by group) + the picked common passives, exclusive gear on / off
      loadBuildFor(dress);
      if (build.on) {
        await ensurePassiveIndex();
        await M.loadPassives(battle.master, [...ownPassiveIds(c, true), ...build.selected]);
        const own = ownPassiveIds(c), ownSet = new Set(own);
        const picked = build.selected.filter(id => !ownSet.has(id));
        buildOwnPaid = ownPaidIds(c);
        const equips = build.exclusive ? M.exclusiveEquipment(battle.master, dress) : [];
        const bless = build.own.blessings ? blessings.filter(b => !ownSet.has(b.id)) : [];
        const buildOwn = [...own.map(id => ({ id })), ...bless];
        const buildPassives = [...buildOwn, ...picked.map(id => ({ id }))];
        const crest = fromLoadout?.crest || null;
        attackerSpec = { unitDressId: dress, name: c?.nameS, panelGiven: false, level: growthChoice.level, awake: growthChoice.awake, stats: override, passives: buildPassives, personality: build.own.personality ? c?.personality || [] : [], equips, crest,
          statsSource: `配装模式（自带免费被动 ${own.length} 个${bless.length ? '＋加护' : ''}＋所选 ${picked.length} 个被动 · ${equips.length ? '有专武' : '无专武'}${crest ? ' · 徽章按配装报告' : ''}；全部按最大）` };
        attackerSpec.buildOwn = buildOwn; attackerSpec.buildPassives = buildPassives; attackerSpec.buildNote = crest ? '徽章按配装报告' : '';
      } else renderBuild(null);
    }
    const attacker = M.addAttacker(battle, attackerSpec);
    renderPreCasts(attacker, battle.master, move.id);
    let targetSpec = null;
    if (monsterChoice) { await ensureMonsters(); await ensureMonsterPassives(); targetSpec = M.targetFromMonster(battle.master, monsterChoice); if (targetSpec) { targetSpec.source = '游戏怪物表'; $('engineMonsterNote').textContent = monsterNote(targetSpec); if ($('engineMonsterName') && !$('engineMonsterName').value) { $('engineMonsterName').value = targetSpec.name; fillMonsterVariants(targetSpec.name); } } }
    if (!targetSpec) targetSpec = report && $('bossPreset')?.value?.startsWith('reader-') ? M.targetFromReport(report, { bossIndex: Number($('bossPreset').value.slice(7)) || 0 }) : targetFromFields(latest);
    const target = M.addTarget(battle, targetSpec);
    const state = stateFromSwitches(latest);
    // switches assume every conditional instance in their group
    const groups = new Set(activeSwitchGroups());
    const probe = M.runScenario({ battle, attacker, target, skill: { id: move.id }, state, assume: { probability: probabilityMode, instances: [...assumed] }, randoms: [0.95] });
    const autoAssume = probe.conditionals.filter(c => groups.has(c.switchGroup)).map(c => c.key);
    battle.reset();
    const attacker2 = M.addAttacker(battle, attackerSpec), target2 = M.addTarget(battle, targetSpec);
    const out = M.runScenario({ battle, attacker: attacker2, target: target2, skill: { id: move.id }, state, assume: { probability: probabilityMode, instances: [...new Set([...assumed, ...autoAssume])] } });
    render(out, { move, attackerSpec, targetSpec, state, autoAssume: new Set(autoAssume), attacker: attacker2, out, dress });
    renderPrimary(out, { move, dress });
    setState(`已结算 · ${new Date().toLocaleTimeString('zh-CN')}`); setPrimaryState(`游戏脚本 · ${new Date().toLocaleTimeString('zh-CN')}`);
    if (attackerSpec.buildPassives) {
      const { buildOwn, buildPassives, buildNote, ...rest } = attackerSpec;
      buildCtx = { move, attackerSpec: rest, targetSpec, state, assumeSet: new Set([...assumed, ...autoAssume]), buildOwn, buildPassives, buildNote };
      const key = JSON.stringify([move.id, targetSpec, state, [...buildCtx.assumeSet], probabilityMode, buildPassives.map(p => p.id), buildOwn.map(p => p.id), currentHits().hits]);
      if (key !== lastBuildKey) { buildGains.clear(); buildCurrent = buildBaseline = null; }
      lastBuildKey = key; buildCtx.key = key;
      renderBuild(buildCtx); renderCandidates();
      computeGains(buildCtx); // continues between main runs; a new run cancels it
    } else buildCtx = null;
  } catch (err) {
    setState('结算失败'); setPrimaryState('结算失败'); $('engineResult').innerHTML = `<p class="help">${esc(err.message)}</p>`; console.error(err);
  } finally {
    running = false;
    if (pending) { pending = false; run(); }
  }
}

// Level / awakening choices for the character (limit-break MAX_LV steps and awakening levels from master data).
function fillGrowthChoices(M, dress) {
  const levels = [...new Set((battle.master.limitBreak.get(Number(dress)) || []).map(r => r.MAX_LV))].filter(v => v >= 100).sort((a, b) => b - a);
  const awakes = [...new Set((battle.master.awake.get(Number(dress)) || []).map(r => r.AWAKE_LV))].sort((a, b) => b - a);
  const fill = (el, values, chosen, label) => { if (!el || el.dataset.dress === String(dress)) return; el.dataset.dress = String(dress); el.innerHTML = `<option value="">最大（${values[0] ?? '—'}）</option>` + values.slice(1).map(v => `<option value="${v}" ${chosen === v ? 'selected' : ''}>${label(v)}</option>`).join(''); };
  fill($('engineLevel'), levels, growthChoice.level, v => `Lv${v}${M.KNOWN_GROWTH_RATE[v] == null && !battle.master.growth.size ? '（估算，待成长表）' : ''}`);
  fill($('engineAwake'), awakes, growthChoice.awake, v => `觉醒${v}`);
}

function render(out, ctx) {
  const st = out.stats;
  const statLine = ['str', 'def', 'int', 'mnd', 'crt'].filter(k => st[k].panel || st[k].real).map(k => `${{ str: 'STR', def: 'DEF', int: 'INT', mnd: 'MND', crt: 'CRT' }[k]} ${fmt(st[k].panel)}→${fmt(st[k].real)}`).join(' · ');
  // identical bullets (e.g. single-target / area variants of one move) collapse into one row
  const hits = [];
  for (const h of out.hits.filter(h => !h.cancelled)) {
    const key = JSON.stringify([h.hitIndex, h.dmgRatio, h.normal, h.critical, h.cap, h.attack]);
    const same = hits.find(x => x.key === key);
    if (same) same.bullets.push(h.bulletName || String(h.bulletId)); else hits.push({ ...h, key, bullets: [h.bulletName || String(h.bulletId)] });
  }
  const critRate = Math.min(100, Math.max(0, st.crt.real || 0)) / 100;
  const hitCount = Number($('hits')?.value) || 0;
  const expect = h => h.normal ? (h.normal.mean * (1 - critRate) + (h.critical ? h.critical.mean : h.normal.mean) * critRate) : null;
  const hitRows = hits.map(h => `<tr><td>第${h.hitIndex}击 ×${(h.dmgRatio / 10000).toLocaleString('zh-CN')}${h.bullets.length > 1 ? ` <small>${h.bullets.length} 条弹道相同</small>` : ''}</td><td>${h.normal ? `${fmt(h.normal.min)}–${fmt(h.normal.max)}` : '—'}</td><td>${h.critical ? `${fmt(h.critical.min)}–${fmt(h.critical.max)}` : '—'}</td><td>${fmt(expect(h))}</td><td>${fmt(h.cap)}</td><td>${fmt(h.attack)} / ${fmt(h.defense)}</td><td>${h.killer ? `×${h.killerFactor.toFixed(2)}` : '—'}</td></tr>`).join('');
  const perCast = hits.reduce((sum, h) => sum + (expect(h) || 0), 0);
  const first = hits[0];
  const chain = first ? first.edits.map(e => `<li><span>${esc(e.passiveName || e.name)}</span><b>${fmt(e.value)}</b></li>`).join('') : '';
  const groups = new Map();
  for (const c of out.conditionals) { const g = SWITCH_LABELS[c.switchGroup] || '条件BUFF'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(c); }
  const conditionals = [...groups.entries()].map(([g, list]) => `<p class="help"><b>${esc(g)}</b>${$(Object.keys(SWITCH_LABELS).find(k => SWITCH_LABELS[k] === g))?.checked ? '（开关已打开，同组默认勾选）' : ''}</p>` + list.map(c => `<label class="engine-conditional"><input type="checkbox" data-assume="${esc(c.key)}" ${assumed.has(c.key) || ctx.autoAssume.has(c.key) ? 'checked' : ''}>${esc(c.passiveName)} · ${esc(c.processName)} <small>${esc(c.triggerLabel)}${c.condition ? ` · ${esc(c.condition)}` : ''}</small></label>`).join('')).join('');
  const prob = out.probabilistic.map(p => `<li>${esc(p.passiveName)} · ${esc(p.processName)} <small>${p.prob}% · ${esc(p.triggerLabel)}</small></li>`).join('');
  const buffs = out.buffs.filter(b => b.remain !== 0).map(b => `<li>${esc(b.name)}${b.from ? ` <small>来自 ${esc(b.from)}</small>` : ''}${b.remain > 0 ? ` <small>${Math.round(b.remain / 60)} 秒</small>` : ''}</li>`).join('');
  const issues = [...out.errors.map(e => `脚本 ${esc(e.name)} (${e.id})：${esc(e.error)}`), ...out.unsupported.map(n => `未实现的原生函数：${esc(n)}`), ...(out.assumptions || []).map(a => `简化假定：${esc(a)}`)];
  $('engineResult').innerHTML = `
    <p class="help">招式 <b>${esc(ctx.move.name || ctx.move.id)}</b>（${ctx.move.id}）· 攻击方 ${esc(ctx.attackerSpec.name || ctx.attackerSpec.unitDressId)} · 面板来源：${esc(ctx.attackerSpec.statsSource || '读取报告')} · 目标 ${esc(ctx.targetSpec.name)}${ctx.targetSpec.source ? `（${esc(ctx.targetSpec.source)}）` : ''} · HP ${ctx.state.hpPercent}%${hpPercent == null ? ctx.state.hpPercent === 100 ? '（满血开关）' : ctx.state.hpPercent === 25 ? '（濒死开关）' : '（未勾选满血：满HP条件不触发）' : ''} · MP ${ctx.state.mpPercent}%${ctx.state.preCasts?.length ? ` · 施放前已用：${esc([...new Map(ctx.state.preCasts.map(id => [id, ctx.state.preCasts.filter(x => x === id).length])).entries()].map(([id, n]) => `${battle.master.skill.get(id)?.NAME || id}×${n}`).join('、'))}` : ''}</p>
    <p class="help">面板→局内：${statLine}</p>${panelLine(ctx)}
    <div class="entry-table-wrap"><table class="entry-table engine-hits"><thead><tr><th>段</th><th>普通每段</th><th>暴击每段</th><th>期望（暴击率 ${Math.round(critRate * 100)}%）</th><th>每段上限</th><th>A / F</th><th>特攻</th></tr></thead><tbody>${hitRows || '<tr><td colspan="7">没有伤害段</td></tr>'}</tbody></table></div>
    <p class="help">每次命中（含双刀／多段魔法的追加击）期望 <b>${fmt(perCast)}</b>${hitCount ? `；按计算器填写的 ${hitCount} 段命中，整次期望 <b>${fmt(perCast * hitCount)}</b>` : '；段数取自计算器的“基础命中段数”'}。暴击率用局内 CRT 面板值。</p>
    ${first ? `<details class="engine-chain"><summary>第1击结算链（随机 0.95）：核心 ${fmt(first.core)} → 修正后 ${fmt(first.afterPassives)}${first.edits.length ? `（${first.edits.length} 项）` : ''}</summary><p class="help">系数 ${first.coefficient} · 属性 ${['无', '火', '冰', '树', '雷', '光', '暗'][first.element] || first.element}（抗性 ${first.resist}）· 核心前倍率 攻 ×${first.offense.toFixed(3)} 受 ×${first.received.toFixed(3)} 减伤 ×${first.reduction.toFixed(3)} · 上限 9,999 + ${fmt(first.capVal)}${first.capPer ? ` ×(1+${first.capPer / 100}%)` : ''}${first.capAdd ? ` + ${fmt(first.capAdd)}` : ''}</p><ol class="engine-edits">${chain}</ol></details>` : ''}
    <details class="engine-buffs"><summary>局内 Buff（${out.buffs.length}）</summary><ul>${buffs || '<li>无</li>'}</ul></details>
    ${conditionals ? `<details class="engine-conditionals" open><summary>可假定触发的条件效果（${out.conditionals.length}）</summary><p class="help">勾选后按已触发计算；对应局内开关打开时同组自动勾选。</p>${conditionals}</details>` : ''}
    ${prob ? `<details class="engine-prob"><summary>概率效果（${out.probabilistic.length}，${probabilityMode === 'assume' ? '按已触发计算' : '按未触发计算'}）</summary><ul>${prob}</ul></details>` : ''}
    ${issues.length ? `<details class="engine-issues" open><summary>未能完整模拟（${issues.length}）</summary><ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul></details>` : ''}`;
}

// The computed out-of-battle panel (no-report path): its parts, the gear it assumed and the site's own preview beside it.
function panelLine(ctx) {
  const u = ctx.attacker; if (!u || u.panelGiven || !u.panelParts) return '';
  const p = u.panelParts, site = websitePanel(), pct = st => ctx.out.stats[st].panel;
  const parts = ['hp', 'mp', 'str', 'def', 'int', 'mnd'].map(k => `${{ hp: 'HP', mp: 'MP', str: 'STR', def: 'DEF', int: 'INT', mnd: 'MND' }[k]} ${fmt(p.stats[k])}`).join(' · ');
  const gear = u.equips.map(e => `${esc(e.name)}${e.estimated ? '（强化估算）' : ''}`).join('、') || '无装备';
  const compare = [site.str != null ? `攻击力 ${fmt(site.str)}` : '', site.int != null ? `法强 ${fmt(site.int)}` : ''].filter(Boolean).join('、');
  return `<p class="help">局外面板（游戏数据 Lv${p.level}${p.estimated ? '·成长率估算' : ''} · 觉醒${p.awake} · 能力盘 ${p.pieceCount} 格）：裸属性 ${parts} · CRT ${p.stats.crt}；装备 ${gear}；经状态计算被动后 HP ${fmt(pct('hp'))} · STR ${fmt(pct('str'))} · DEF ${fmt(pct('def'))} · INT ${fmt(pct('int'))} · MND ${fmt(pct('mnd'))} · CRT ${fmt(pct('crt'))}${compare ? `（网站旧规则面板：${compare}）` : ''}</p>`;
}

document.addEventListener('lc:calculator-update', e => { latest = e.detail || {}; if (latest.battle) report = latest.battle; mount();
  if ($('enginePanelStats')) { const hide = !!(report && report.units?.length); $('enginePanelStats').hidden = hide; $('engineAccountRow').hidden = hide; } run(); });
$('entryReportFile')?.addEventListener('change', e => { const f = e.target.files?.[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); if (j && j.kind === 'last-cloudia-battle-entry') report = j; } catch {} }); });
mount();
