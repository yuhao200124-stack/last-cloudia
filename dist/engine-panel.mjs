// 游戏脚本结算面板：在伤害计算器里用沙盒引擎（游戏自带 Lua 脚本 + 主数据）直接结算所选招式。
// 输入来自计算器页面（damage-calculator.mjs 的 `lc:calculator-update` 事件）：读取报告、所选招式、局内开关、Boss 栏位、圣物属性。
// 网页旧规则的结果保持不变，这里只是并列的对照。
import { K } from './engine/battle.mjs';
import { RAW_BLESSING_RECORDS, USER_CONFIRMED_BLESSING_RECORDS } from './account-blessings.mjs';
import { characterGear } from './character-gear.mjs?v=20260928-engine-only';
import { BREAKS, breakName, cleanBreaks, scTotal } from './build-sc.mjs?v=20260929-build';

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
let latest = null, report = null, assumed = new Set(), probabilityMode = 'assume', running = false, pending = false;
// No-report path: the out-of-battle panel is computed from master data (level growth + awakening + board +
// exclusive gear + trigger-1 passives), always at maximum — character level, awakening, ability board and
// equipment/crest enhancement are never modeled below max (user's rule), so there is no manual override for them.
const growthChoice = { accountBlessings: true };
// Reader loadout report (LoadoutReport.json): the account's real growth and loadout for every owned character.
const LOADOUT_KEY = 'lc-engine-loadout-report';
let loadoutReport = null, switches = null;
try { const saved = localStorage.getItem(LOADOUT_KEY); if (saved) loadoutReport = JSON.parse(saved); } catch {}
// Loadout builder (配装): start = the character's free own passives (个性 / 固有 / 超越) + account blessings + every
// SC skill on its own ability board (always added, 0 SC — user 2026-09-29, as the old skill table did), all always on (user 2026-09-29:
// no switches for them), with the exclusive gear chosen in the calculator's own 专武 field; everything upgradable at
// its maximum; the user adds skills with “+” and sees what each one brings to the
// current build. 能力盘突破 (一破 / 二破 / 三破) free one skill each (build-sc.mjs). Per character, kept in the browser.
// Since 2026-09-29 (user) the 配装 happens on the home page's skill table, in the whole window (not in the character
// page's panel): the character is chosen first (character page → calculator → 配装), then index.html?character=…
// shows the table with “+” on the left and this calculator in a frame on the right (…&embedded=build); the frame
// gets the “+” clicks and sends back what it computes. Opened on its own, the calculator computes without a loadout
// and its 配装 button goes to that page.
const BUILD_KEY = dress => `lc-engine-build:${dress}`;
const defaultBuild = () => ({ on: false, selected: [], breaks: cleanBreaks() });
let build = defaultBuild(), buildDress = null, passiveIndex = null, buildCtx = null, buildGen = 0;
const buildGains = new Map(); // passive id → { gain, perCall } relative to the current build (removed) or candidate (added)
let buildCurrent = null, buildBaseline = null, lastBuildKey = '', buildOwnPaid = [], buildAuto = [], lastAdded = null;
function loadBuildFor(dress) {
  if (buildDress === dress) return;
  buildDress = dress; buildGains.clear(); buildCurrent = buildBaseline = null;
  try { const saved = JSON.parse(localStorage.getItem(BUILD_KEY(dress)) || 'null'); build = saved ? { ...defaultBuild(), ...saved, own: { ...defaultBuild().own, ...(saved.own || {}) }, breaks: cleanBreaks(saved.breaks) } : defaultBuild(); } catch { build = defaultBuild(); }
  build.on = buildEmbed;    // the loadout counts only on the 配装 page; the calculator alone computes without it
  // opened from a character page's 已保存配装 (…&plan=<id>): that saved loadout, once
  const planId = new URLSearchParams(location.search).get('plan');
  if (planId && !urlPlanUsed) { urlPlanUsed = true; const plan = loadPlans().find(p => p.id === planId && p.dress === dress); if (plan) { applyPlan(plan); return; } }
  syncBuildControls();
}
// ---- saved loadouts (保存配装): the chosen common skills of the 配装 panel, per character, in this browser;
// the character pages' 已保存配装 list them (lc-engine-plans:v1) ----
const PLANS_KEY = 'lc-engine-plans:v1';
let urlPlanUsed = false;
function loadPlans() { try { const l = JSON.parse(localStorage.getItem(PLANS_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; } }
function storePlans(list) { try { localStorage.setItem(PLANS_KEY, JSON.stringify(list)); return true; } catch { return false; } }
const siteCharacterId = () => new URLSearchParams(location.search).get('character') || null;
const planStatus = text => { if ($('enginePlanStatus')) $('enginePlanStatus').textContent = text; };
// ---- 配装 on the home page: this calculator in its frame (?embedded=build) ----
const pageParams = new URLSearchParams(location.search);
const buildEmbed = pageParams.get('embedded') === 'build' && window.parent !== window;
let buildView = 'results', moveInfo = null;
// the page asks for one of two views of this frame: 结果与配装 (the results column: result card and 配装 panel, beside
// the table) or 战斗设置 (the whole calculator: move, 专武, switches, target, results and 配装 panel)
function setBuildView(view) {
  buildView = view === 'settings' ? 'settings' : 'results';
  document.body.classList.toggle('build-view-results', buildView === 'results');
  document.body.classList.toggle('build-view-settings', buildView === 'settings');
}
if (buildEmbed) { document.body.classList.add('is-build-embedded'); setBuildView('results'); }
// what the page shows: the picked skills, the character's own 0-SC ones, each one's gain, SC, the damage now and
// before the loadout, and the move (its element and skill type set the page's filters)
function sendState() {
  if (!buildEmbed) return;
  const gains = {};
  for (const id of [...build.selected, ...buildAuto]) { const g = buildGains.get(id); if (g?.removed && g.gain != null) gains[id] = g.gain; }
  const sc = buildSc();
  window.parent.postMessage({ type: 'lc-build-state', dress: buildDress, selected: pickedIds(), auto: [...buildAuto], gains,
    sc: { total: sc.total, freed: sc.items.filter(i => i.freeBy).map(i => ({ id: i.id, by: breakName(i.freeBy), sc: i.sc })) }, breaks: [...build.breaks],
    perCall: buildCurrent?.perCall ?? null, baseline: buildBaseline?.perCall ?? null, hits: currentHits().hits, move: moveInfo, computing: running,
    lastAdded: lastAdded != null && build.selected.includes(lastAdded) ? { id: lastAdded, name: passiveText(lastAdded), gain: buildGains.get(lastAdded)?.removed ? buildGains.get(lastAdded).gain : null } : null }, location.origin);
}
window.addEventListener('message', e => {
  if (!buildEmbed || e.origin !== location.origin || e.source !== window.parent) return;
  if (e.data?.type === 'lc-build-toggle') toggleSkill(Number(e.data.id));
  else if (e.data?.type === 'lc-build-view') setBuildView(e.data.view);
  else if (e.data?.type === 'lc-build-hello') sendState();
});
function toggleSkill(id) {
  if (!Number.isFinite(id) || buildAuto.includes(id)) return;
  if (build.selected.includes(id)) { build.selected = build.selected.filter(x => x !== id); if (lastAdded === id) lastAdded = null; }
  else { build.selected.push(id); lastAdded = id; }
  build.on = buildEmbed; saveBuild(); buildGains.clear(); syncBuildControls(); renderBuild(buildCtx); sendState(); run();
}
function applyPlan(plan) {
  build = { ...defaultBuild(), selected: [...(plan.build?.selected || [])], breaks: cleanBreaks(plan.build?.breaks), on: buildEmbed, planId: plan.id };
  saveBuild(); buildGains.clear(); syncBuildControls();
  if ($('enginePlanName')) $('enginePlanName').value = plan.name || '';
  planStatus(`已载入「${plan.name}」。`);
}
function savePlan(asNew) {
  if (!buildDress) { planStatus('先选择招式，等角色读取完。'); return; }
  const list = loadPlans(), now = new Date().toISOString();
  const name = ($('enginePlanName')?.value || '').trim() || `配装方案 ${list.filter(p => p.dress === buildDress).length + 1}`;
  const data = { selected: [...build.selected], breaks: [...build.breaks] };
  let plan = !asNew && build.planId ? list.find(p => p.id === build.planId && p.dress === buildDress) : null;
  if (plan) Object.assign(plan, { name, build: data, updatedAt: now });
  else { plan = { id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, siteId: siteCharacterId(), dress: buildDress, build: data, createdAt: now, updatedAt: now }; list.push(plan); }
  if (!storePlans(list)) { planStatus('保存失败：这个浏览器不允许保存。'); return; }
  build.planId = plan.id; saveBuild(); if ($('enginePlanName')) $('enginePlanName').value = name;
  planStatus(`已保存「${name}」（${data.selected.length} 个技能 · ${buildSc().total} SC）。`); renderPlans();
}
function planAction(action, id, button) {
  const list = loadPlans(), plan = list.find(p => p.id === id); if (!plan) { renderPlans(); return; }
  if (action === 'load') { applyPlan(plan); run(); }
  else if (action === 'rename') {
    const name = ($('enginePlanName')?.value || '').trim();
    if (!name) { planStatus('先在“配装名称”里填新名字，再点改名。'); return; }
    plan.name = name; plan.updatedAt = new Date().toISOString(); storePlans(list); planStatus(`已改名为「${name}」。`); renderPlans();
  } else if (action === 'delete') {
    if (button.dataset.confirm !== '1') { button.dataset.confirm = '1'; button.textContent = '确定删除？'; return; }
    storePlans(list.filter(p => p.id !== id)); if (build.planId === id) { build.planId = null; saveBuild(); }
    planStatus(`已删除「${plan.name}」。`); renderPlans();
  }
}
function renderPlans() {
  const box = $('enginePlanList'); if (!box) return;
  const plans = loadPlans().filter(p => p.dress === buildDress).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  $('enginePlanCount').textContent = String(plans.length);
  box.innerHTML = plans.length ? plans.map(p => `<li${p.id === build.planId ? ' class="is-current"' : ''}><b>${esc(p.name)}</b> <small>${(p.build?.selected || []).length} 个技能 · ${esc(String(p.updatedAt || '').slice(0, 10))}${p.id === build.planId ? ' · 当前' : ''}</small><span class="inline-options"><button type="button" class="secondary" data-plan-action="load" data-plan="${esc(p.id)}">载入</button><button type="button" class="secondary" data-plan-action="rename" data-plan="${esc(p.id)}" title="用上面“配装名称”里的名字">改名</button><button type="button" class="secondary" data-plan-action="delete" data-plan="${esc(p.id)}">删除</button></span></li>`).join('') : '<li class="help">还没有保存的配装。</li>';
}
// ---- 恢复角色推荐配装 / 按每 SC 收益推荐: data from the old loadout (game-data/engine/loadout-data.json, fixed since the
// original skill table was removed on 2026-09-29; which skills 按每 SC 收益推荐 tries is to be decided later) ----
let loadoutData = null;
async function ensureLoadoutData() { if (!loadoutData) loadoutData = await fetch(new URL('./game-data/engine/loadout-data.json', import.meta.url)).then(r => r.json()).catch(() => ({ commonPassives: [], recommended: {} })); return loadoutData; }
async function restoreRecommended() {
  const data = await ensureLoadoutData();
  let site = siteCharacterId();
  if (!site && buildDress) { if (!siteIndex) siteIndex = await fetch(new URL('./game-data/index.json', import.meta.url)).then(r => r.json()).catch(() => ({})); site = Object.entries(siteIndex?.site || {}).find(([, d]) => d === buildDress)?.[0] || null; }
  const rec = site && data.recommended?.[site];
  if (!rec?.passives?.length) { planStatus('这个角色没有推荐配装。'); return; }
  const c = await gameCharacter(buildDress); await ensureTablePassives();
  const own = new Set([...ownPassiveIds(c).filter(isFreePassive), ...autoPaidIds(c)]);
  build.selected = rec.passives.filter(id => !own.has(id)); build.on = buildEmbed; build.planId = null; saveBuild(); buildGains.clear(); syncBuildControls(); sendState();
  const mine = rec.passives.length - build.selected.length;
  planStatus(`已恢复推荐配装：另外选 ${build.selected.length} 个${mine ? `，其余 ${mine} 个是能力盘自带（已经算在里面）` : ''}；需要的话再保存。`); run();
}
const recommendState = { running: false, gen: 0, rows: [] };
function stopRecommend(text) {
  recommendState.gen++; recommendState.running = false;
  if ($('engineRecommendStart')) { $('engineRecommendStart').disabled = false; $('engineRecommendStop').disabled = true; }
  if (text && $('engineRecommendStatus')) $('engineRecommendStatus').textContent = text;
}
function renderRecommend(done, total) {
  const rows = [...recommendState.rows].filter(r => r.gain != null).sort((a, b) => b.perSc - a.perSc || b.gain - a.gain).slice(0, 30);
  $('engineRecommendRows').innerHTML = rows.map(r => `<tr><td>${passiveLabel(r.id)}</td><td>${r.cost}</td><td>${pct(r.gain)}</td><td>${pct(r.perSc)}</td><td><button type="button" class="primary" data-build-add="${r.id}">加入</button></td></tr>`).join('') || '<tr><td colspan="5" class="help">还没有结果。</td></tr>';
  $('engineRecommendStatus').textContent = `${done < total ? '计算中' : '完成'}：${done} / ${total}；按每 SC 收益列出前 ${rows.length} 个（收益按随机 0.95 单点比较）。`;
}
async function startRecommend() {
  if (!build.on || !buildCtx || !buildCurrent) { $('engineRecommendStatus').textContent = '先启用配装模式，等“当前配装”结算完再开始。'; return; }
  stopRecommend(); const gen = recommendState.gen, ctx = buildCtx;
  recommendState.running = true; $('engineRecommendStart').disabled = true; $('engineRecommendStop').disabled = false;
  $('engineRecommendStatus').textContent = '准备候选被动…';
  const data = await ensureLoadoutData(); await ensurePassiveIndex();
  const taken = new Set([...build.selected, ...ctx.buildOwn.map(p => p.id ?? p)]);
  let ids = [...new Set([...buildOwnPaid, ...(data.commonPassives || [])])].filter(id => !taken.has(id)).filter(id => { const c = passiveCost(id); return c > 0 && c < FREE_COST; });
  await engineModules.loadPassives(battle.master, ids);
  if (gen !== recommendState.gen) return;
  ids = ids.filter(id => battle.master.passive.has(id));
  recommendState.rows = [];
  for (let i = 0; i < ids.length; i++) {
    if (gen !== recommendState.gen || ctx !== buildCtx || running) { if (gen === recommendState.gen) stopRecommend('配装、招式或条件已改变，已停止；可重新开始。'); return; }
    const id = ids[i]; let g = buildGains.get(id);
    if (!g || g.removed) { const withIt = evalBuild(ctx, [...ctx.buildPassives, { id }]); g = { removed: false, perCall: withIt.perCall, gain: buildCurrent.perCall > 0 ? withIt.perCall / buildCurrent.perCall - 1 : null }; buildGains.set(id, g); }
    const cost = passiveCost(id);
    recommendState.rows.push({ id, cost, gain: g.gain, perSc: g.gain != null ? g.gain / cost : null });
    if (i % 4 === 3 || i === ids.length - 1) { renderRecommend(i + 1, ids.length); await yieldUi(); }
  }
  if (gen === recommendState.gen) { recommendState.running = false; $('engineRecommendStart').disabled = false; $('engineRecommendStop').disabled = true; renderRecommend(ids.length, ids.length); }
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

const STYLE = `.engine-build-table td{vertical-align:middle}.engine-build-table{min-width:0!important}.engine-build-table td,.engine-build-table th{padding:7px 8px}.engine-build-table small{min-width:0!important}#engineBuild{margin-top:18px;padding-top:4px}#engineBuild .section-heading{margin-bottom:6px}#engineBuild .section-heading h3{margin:0;font-size:1rem}.engine-build-on{flex-direction:row!important;align-items:center;gap:6px;font-weight:500!important}#engineBuildWrap{margin-top:14px}#engineBuildStatus{margin:6px 2px 0}.engine-build-sc{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:14px;padding:10px 12px;border:1px solid #cfdfef;border-radius:6px;background:#edf4fb}.engine-build-sc span{font-size:.85rem;color:#445c79;font-weight:600}.engine-build-sc strong{font-size:1.45rem;margin-left:8px;font-variant-numeric:tabular-nums;color:#172d49}.engine-build-breaks{display:inline-flex;gap:6px}.engine-build-breaks button{min-height:32px;padding:4px 10px}.engine-build-breaks button[aria-pressed=true]{background:#285b95;color:#fff;border-color:#285b95}.engine-build-changes{font-size:.8rem;color:#445c79;margin-top:3px;line-height:1.55}.engine-build-sccell{text-align:center!important}.engine-build-sccell b{display:block}.engine-build-sccell small{font-size:.75rem}.engine-build-auto td{background:#f7f9fc}.engine-build-auto td:last-child{white-space:nowrap;text-align:center}.engine-build-tag{display:inline!important;font-size:.72rem!important;background:#e3ebf5;border-radius:3px;padding:1px 5px;color:#35577d}.engine-build-table td button{min-height:28px;padding:2px 10px}.engine-build-picked{table-layout:fixed}.engine-build-picked td{overflow-wrap:anywhere}.engine-plan-list{list-style:none;padding:0;margin:.4rem 0}.engine-plan-list li{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:6px 0;border-bottom:1px solid #dbe4ef}.engine-plan-list li.is-current b{color:#1f5ea8}.engine-plan-actions{align-self:end}#reviewBody table{margin-top:6px}#reviewBody h3{margin:18px 0 6px}#enginePrimary .ep-hits{display:flex;gap:8px;align-items:center;justify-content:flex-end}#enginePrimary .ep-hits input{width:5.5em;min-height:32px;padding:4px 6px;font-size:.9rem}#enginePrimary .ep-hits small{color:#a5c0dc}#resultState{display:none}#ep-state{font-size:.8125rem;color:#b3d6f4;background:#234566;padding:5px 8px;border-radius:4px}#legacyResults{border-top:1px solid #3a526f;margin-top:14px;padding-top:10px}#legacyResults summary{color:#b3d6f4;font-size:.85rem}#legacyResults p{color:#c0d3e8}.engine-panel .engine-fields{margin:.5rem 0}.engine-panel .engine-hits td,.engine-panel .engine-hits th{white-space:nowrap}.engine-panel .engine-edits{margin:.5rem 0 0;padding-left:1.2rem}.engine-panel .engine-edits li{display:flex;justify-content:space-between;gap:1rem}.engine-panel .engine-conditional{display:block;margin:.25rem 0}.engine-panel .engine-conditional small{color:var(--muted,#6b7280)}.engine-panel details{margin-top:.5rem}.engine-panel ul{margin:.25rem 0 0;padding-left:1.2rem}`;
// ---- the main result card ----
// 命中段数 is only the user's own count (default 10), kept per move by the page (damage-calculator.mjs); the card
// edits it through the page.
function siteHits() { const n = Number($('hits')?.value); return Number.isFinite(n) && n > 0 ? n : null; }
function currentHits() { const n = siteHits(); return n ? { hits: n, source: '命中段数' } : { hits: 10, source: '默认 10 段' }; }
function mountPrimary() {
  const panel = $('enginePanel'); if (!panel || $('enginePrimary')) return;
  const heading = panel.querySelector('.section-heading'); if (!heading) return;
  // Carries the same "result-main" class as the old standalone card so it keeps the dark result-card styling
  // (the light text colors in primary-result/total-result/etc. are designed against that dark background).
  const wrap = document.createElement('div'); wrap.className = 'result-main';
  const block = document.createElement('div'); block.id = 'enginePrimary';
  block.innerHTML = `<div class="result-top"><h2>计算结果</h2><span id="ep-state" class="help">等待招式</span></div>
    <article class="primary-result"><span>普通每段伤害</span><strong id="ep-normal">—</strong><small id="ep-normalNote">游戏脚本结算 · 含随机波动与每段上限</small></article>
    <section class="damage-gauges" aria-label="伤害与上限">
      <div class="damage-gauge"><div class="gauge-label"><span>普通每段 <b id="ep-normalGauge">—</b></span><span>上限 <b id="ep-normalCap">—</b></span></div><div class="gauge-track" role="progressbar" aria-label="普通每段伤害占上限"><span id="ep-normalBar"></span></div></div>
      <div class="damage-gauge"><div class="gauge-label"><span>暴击每段 <b id="ep-critGauge">—</b></span><span>上限 <b id="ep-critCap">—</b></span></div><div class="gauge-track critical" role="progressbar" aria-label="暴击每段伤害占上限"><span id="ep-critBar"></span></div></div>
    </section>
    <article class="critical-result"><span title="触发暴击时的伤害；整次期望按局内暴击率计算">暴击每段伤害</span><strong id="ep-critical">—</strong></article>
    <div class="total-result"><span>整次技能期望伤害</span><strong id="ep-total">—</strong><small id="ep-totalNote"></small></div>
    <dl class="result-details">
      <div><dt>命中段数</dt><dd class="ep-hits"><input id="engineHits" type="number" min="1" max="999" step="1" placeholder="10"></dd></div>
      <div><dt>全为普通命中时</dt><dd id="ep-normalTotal">—</dd></div><div><dt>特攻匹配</dt><dd id="ep-killer">—</dd></div><div><dt>弱属匹配</dt><dd id="ep-weak">—</dd></div>
    </dl><p id="ep-note" class="result-cap-note"></p>`;
  wrap.append(block);
  heading.after(wrap);
  $('engineHits').addEventListener('change', e => document.dispatchEvent(new CustomEvent('lc:hits-change', { detail: { hits: e.target.value } })));
}
// ---- 法强／攻击力、最终暴击率、伤害上限：the selected move's own values and how the game data gets there ----
// Every number is what this move's first damaging hit actually receives (its own bonuses included), computed
// by the game scripts; the three fields are read-only and their 👁 open and close together.
const BASIC_FIELDS = [['attack', 'attackBreakdownToggle', 'attackBreakdown', 'attackBreakdownSteps'], ['critRate', 'critBreakdownToggle', 'critBreakdown', 'critBreakdownSteps'], ['damageCapInput', 'damageCapBreakdownToggle', 'damageCapBreakdown', 'damageCapBreakdownSteps']];
let basicOpen = false, passiveNames = null;
function syncBasicPanels() {
  for (const [, t, p] of BASIC_FIELDS) { const tog = $(t), pan = $(p); if (!tog || !pan) continue; pan.hidden = tog.hidden || !basicOpen; tog.setAttribute('aria-expanded', String(!pan.hidden)); }
}
function wireBasicFields() {
  for (const [, t] of BASIC_FIELDS) { const tog = $(t); if (!tog || tog.dataset.basicWired) continue; tog.dataset.basicWired = '1'; tog.addEventListener('click', e => { e.preventDefault(); basicOpen = !basicOpen; syncBasicPanels(); }); }
}
async function ensurePassiveNames() { await ensurePassiveIndex(); if (!passiveNames) passiveNames = new Map(passiveIndex.map(r => [r.id, r.nameS || r.name])); }
const pctPer = per => `${(per / 100).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}%`;
function sourceName(src, ctx) {
  const master = battle.master;
  if (!src || src.kind === 'none') return '未识别来源';
  if (src.kind === 'bullet') return `招式自带（${ctx.moveName}）`;
  if (src.kind === 'unknown') return `未识别来源（${src.uid}）`;
  const gear = ctx.gearNames.get(Number(src.localId));
  const name = passiveNames?.get(src.passiveId) || (gear ?? passiveNames?.get(src.localId)) || master.passive.get(src.passiveId || src.localId)?.NAME || master.itemEquip.get(src.localId)?.NAME || `编号 ${src.localId}`;
  return src.kind === 'buff' ? `${name}（增益）` : name;
}
// "月光II +30%、自动充能 +15" — one entry per source, the move's own (this call / this bullet) marked
function listParts(parts, ctx, unit = '', tagMove = true) {
  const by = new Map();
  for (const p of parts) {
    const key = `${sourceName(p.source, ctx)}${tagMove && p.source?.kind !== 'bullet' && (p.layer === 'work' || p.layer === 'bullet') ? '（本招式）' : ''}`;
    const g = by.get(key) || { val: 0, per: 0, add: 0 }; g.val += p.val; g.per += p.per; g.add += p.add; by.set(key, g);
  }
  return [...by].map(([name, g]) => `${name} ${[g.val && `${g.val > 0 ? '+' : ''}${fmt(g.val)}${unit}`, g.per && `${g.per > 0 ? '+' : ''}${pctPer(g.per)}`, g.add && `${g.add > 0 ? '+' : ''}${fmt(g.add)}${unit}`].filter(Boolean).join(' ')}`).join('、');
}
const sum = parts => parts.reduce((a, p) => ({ val: a.val + p.val, per: a.per + p.per, add: a.add + p.add }), { val: 0, per: 0, add: 0 });
function statSteps(parts, ctx, { baseLabel, unit = '' }) {
  const lines = [];
  if (parts.panelGiven) lines.push(`面板（${parts.panelOverride != null ? '配装报告' : '已给定'}）${fmt(parts.panel)}${unit}`);
  else {
    lines.push(`${baseLabel} ${fmt(parts.pure)}${unit}`);
    if (parts.crest) lines.push(`徽章 +${fmt(parts.crest)}`);
    for (const e of parts.equips) lines.push(e.per ? `${ctx.gearNames.get(Number(e.id)) || battle.master.itemEquip.get(e.id)?.NAME || e.id}：${fmt(e.raw)} × (1 + ${pctPer(e.per)}) → ${fmt(e.value)}` : `${ctx.gearNames.get(Number(e.id)) || battle.master.itemEquip.get(e.id)?.NAME || e.id}：+${fmt(e.raw)}`);
    const eq = parts.crest + parts.equips.reduce((a, e) => a + e.value, 0), st = sum(parts.status);
    if (parts.status.length) lines.push(`面板加成（${listParts(parts.status, ctx, unit)}）：(${fmt(parts.pure)}${eq ? ` + 装备 ${fmt(eq)}` : ''}${st.val ? ` + ${fmt(st.val)}` : ''})${st.per ? ` × (1 + ${pctPer(st.per)})` : ''}${st.add ? ` + ${fmt(st.add)}` : ''} → ${fmt(parts.panel)}${unit}`);
    else if (eq) lines.push(`${fmt(parts.pure)} + 装备 ${fmt(eq)} → ${fmt(parts.panel)}${unit}`);
  }
  if (parts.runtime.length) { const r = sum(parts.runtime); lines.push(`战斗中与本招式（${listParts(parts.runtime, ctx, unit)}）：(${fmt(parts.panel)}${r.val ? ` + ${fmt(r.val)}` : ''})${r.per ? ` × (1 + ${pctPer(r.per)})` : ''}${r.add ? ` + ${fmt(r.add)}` : ''} → ${fmt(parts.final - (parts.finalAdd || 0))}${unit}`); }
  if (parts.finalAdd) lines.push(`圣物属性 +${fmt(parts.finalAdd)}${unit}（加在最终值上）→ ${fmt(parts.final)}${unit}`);
  if (!parts.runtime.length && !parts.status.length && !parts.equips.length && !parts.crest && !parts.panelGiven && !parts.finalAdd) lines.push(`没有其他加成 → ${fmt(parts.final)}${unit}`);
  return lines;
}
function capSteps(first, ctx) {
  const b = first.breakdown, parts = b.cap, s = sum(parts), lines = ['基础上限 9,999'];
  if (b.capOff) lines.push(`上限改写为 ${fmt(b.capOff.value)}（${sourceName(b.capOff.source, ctx)}）`);
  else {
    if (parts.length) lines.push(`上限加成：${listParts(parts, ctx, '', false)}`);
    lines.push(`(9,999${s.val ? ` + ${fmt(s.val)}` : ''})${s.per ? ` × (1 + ${pctPer(s.per)})` : ''}${s.add ? ` + ${fmt(s.add)}` : ''} → ${fmt(first.capComputed)}`);
  }
  if (first.critCap != null && first.critCap !== first.cap) {
    const extra = (first.critBreakdown?.cap || []).filter(p => !parts.some(q => q.source && p.source && JSON.stringify(q.source) === JSON.stringify(p.source) && q.val === p.val && q.per === p.per && q.add === p.add));
    lines.push(`暴击时上限 ${fmt(first.critCap)}${extra.length ? `（另加：${listParts(extra, ctx, '', false)}）` : ''}`);
  }
  const order = [...new Set((ctx.hits || []).map(h => h.bulletId))];
  const others = [...new Map((ctx.hits || []).filter(h => h.bulletId !== first.bulletId && h.capComputed != null && h.capComputed !== first.capComputed).map(h => [h.bulletId, h])).values()];
  for (const h of others) lines.push(`第 ${order.indexOf(h.bulletId) + 1} 条弹道的计算上限为 ${fmt(h.capComputed)}（上面是第 1 条）`);
  return lines;
}
function renderBasicFields(first, ctx) {
  wireBasicFields();
  const show = (id, lines) => { const [field, t, , list] = BASIC_FIELDS.find(f => f[0] === id); if (!$(t)) return; $(t).hidden = !lines.length; if ($(list)) $(list).innerHTML = lines.map(l => `<li>${esc(l)}</li>`).join(''); };
  if (!first?.breakdown) { for (const [id] of BASIC_FIELDS) show(id, []); syncBasicPanels(); return; }
  const b = first.breakdown, magical = b.attack.stat === K.STAT.INT;
  if ($('attack')) { $('attack').value = String(first.attack); $('attack').readOnly = true; $('attack').title = '所选招式实际吃到的数值（游戏数据计算）'; }
  if ($('attackLabel')) $('attackLabel').textContent = magical ? '当前面板法强' : '当前面板攻击力';
  if ($('critRate')) { $('critRate').value = String(first.crt); $('critRate').readOnly = true; $('critRate').title = '所选招式实际吃到的暴击率（游戏数据计算）'; }
  if ($('damageCapInput')) { $('damageCapInput').value = String(first.capComputed); $('damageCapInput').readOnly = true; }
  show('attack', statSteps(b.attack, ctx, { baseLabel: magical ? '基础法强（等级·觉醒·能力盘）' : '基础攻击力（等级·觉醒·能力盘）' }));
  show('critRate', statSteps(b.crit, ctx, { baseLabel: '角色基础暴击率', unit: '%' }));
  show('damageCapInput', capSteps(first, ctx));
  syncBasicPanels();
}
// ---- 辅助魔法 (support magic without damage): the calculator's 魔法 checkboxes ----
// A checked one is cast before the evaluated move, so the game scripts apply it (a debuff lands on the target,
// a buff on the attacker). The label next to each box is what casting it does, measured from the game scripts:
// the buff/debuff it adds, its duration and the values it applies; anything that cannot be read as a number yet
// is shown with its raw game parameters and marked.
const ELEM_NAMES = ['无', '火', '冰', '树', '雷', '光', '暗'];
const STAT_OP_NAMES = { 300: '攻击力', 301: '防御力', 302: '法强', 303: '魔抗', 304: '暴击率', 305: 'HP', 310: '速度', 318: 'MP' };
const RAW_OP_NAMES = { 306: '异常耐性', 308: '特攻', 502: '物理伤害减轻', 503: '魔法伤害减轻', 504: '伤害增幅', 505: '伤害无效', 507: '属性改变', 509: '特攻增幅', 824: '伤害上限改写' };
const signed = (n, unit = '') => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}${unit}`;
function describeEntries(entries) {
  const out = [], resist = new Map();
  for (const e of entries) {
    const [a = 0, b = 0, c = 0] = e.params;
    if (e.op === K.OP.ELEM_RESIST) { for (const el of a === -1 ? [1, 2, 3, 4, 5, 6] : [a]) resist.set(el, (resist.get(el) || 0) + b); continue; }
    if (STAT_OP_NAMES[e.op]) { const unit = e.op === K.OP.CRT ? '%' : ''; out.push(`${STAT_OP_NAMES[e.op]} ${[a && signed(a, unit), b && signed(b / 100, '%'), c && signed(c, unit)].filter(Boolean).join(' ')}`); continue; }
    if (e.op === K.OP.DMG_LIMIT_UP) { out.push(`伤害上限 ${[a && signed(a), b && signed(b / 100, '%'), c && signed(c)].filter(Boolean).join(' ')}`); continue; }
    out.push(`${RAW_OP_NAMES[e.op] || `游戏效果 ${e.op}`}（参数 ${e.params.join(', ')}，数值含义未解读）`);
  }
  if (resist.size) {
    const vals = [...resist.values()];
    if (resist.size === 6 && vals.every(v => v === vals[0])) out.unshift(`全属性耐性 ${signed(vals[0])}`);
    else out.unshift(...[...resist].map(([el, v]) => `${ELEM_NAMES[el] || el}耐性 ${signed(v)}`));
  }
  return out;
}
function describeSupport(m) {
  if (!m) return '读取中…';
  if (m.error) return `游戏脚本出错（${m.error}）`;
  if (!m.effects.length) return '游戏脚本没有加上可显示的效果（可能对这个目标无效）';
  // the game's own hidden control buffs (非表示バフ) carry no value of their own: shown only when they apply one
  const shown = m.effects.filter(e => e.entries.length || !String(e.name).startsWith('非表示'));
  if (!shown.length) return '游戏脚本没有加上可显示的效果（可能对这个目标无效）';
  return shown.map(e => {
    const who = e.side === 'target' ? '目标' : '自身';
    const time = e.duration > 0 ? `，${Math.round(e.duration / 60 * 10) / 10} 秒` : e.duration === -1 ? '，一直有效' : '';
    const vals = describeEntries(e.entries);
    const body = vals.length ? vals.join('、') : `${e.name}（原始参数 ${e.params.filter(v => v !== 0).join(', ') || '无'}，造成伤害时才生效，含义未逐项核对）`;
    return `${who} ${body}${time}`;
  }).join('；');
}
let supportCache = { key: null, map: new Map() }, supportDress = null, supportChecked = new Set(), supportList = [], supportActive = [];
const supportOf = c => [...(c?.magic?.normal || []), ...(c?.magic?.heavy || [])].filter(m => m.parts?.length && m.parts.every(p => p.kind == null));
function renderSupportMagic(c, dress) {
  const host = $('magicBuffOptions'); supportList = supportOf(c);
  if (!host || !supportList.length) { supportActive = []; if ($('engineSupportMagic')) $('engineSupportMagic').innerHTML = ''; if (host) host.hidden = true; return; }
  let box = $('engineSupportMagic');
  if (!box) {
    box = document.createElement('div'); box.id = 'engineSupportMagic'; host.append(box);
    box.addEventListener('change', e => {
      const id = Number(e.target.dataset.supportMagic); if (!id) return;
      if (e.target.checked) supportChecked.add(id); else supportChecked.delete(id);
      try { localStorage.setItem(`lc-support-magic:${supportDress}`, JSON.stringify([...supportChecked])); } catch {}
      run();
    });
  }
  if (supportDress !== dress) {
    supportDress = dress; supportChecked = new Set();
    let saved = null; try { saved = JSON.parse(localStorage.getItem(`lc-support-magic:${dress}`)); } catch {}
    // first visit after the old calculator: its saved 魔法 choices (魔术指导 / 绝望之魂 by name)
    const old = Array.isArray(saved) ? null : (() => { try { return JSON.parse(localStorage.getItem(`lc-magic-buffs:${new URLSearchParams(location.search).get('character')}`)) || {}; } catch { return {}; } })();
    const OLD_IDS = { 'magic-guidance': '魔术指导', 'despair-anima': '绝望之魂' };
    for (const m of supportList) if (Array.isArray(saved) ? saved.includes(m.id) : Object.entries(OLD_IDS).some(([k, n]) => old?.[k] === true && n === m.nameS)) supportChecked.add(m.id);
  }
  const key = JSON.stringify([dress, supportList.map(m => m.id)]);
  if (box.dataset.key !== key) { box.dataset.key = key; box.innerHTML = supportList.map(m => `<label class="magic-buff-check" title="${esc(m.explainS || '')}"><input type="checkbox" data-support-magic="${m.id}"${supportChecked.has(m.id) ? ' checked' : ''}><span>${esc(m.nameS)}<span data-support-effect="${m.id}">：读取中…</span></span></label>`).join(''); supportCache.key = null; }
  for (const i of box.querySelectorAll('[data-support-magic]')) i.checked = supportChecked.has(Number(i.dataset.supportMagic));
  host.hidden = false;
  supportActive = supportList.filter(m => supportChecked.has(m.id)).map(m => m.id);
}
function renderSupportEffects(map) {
  for (const el of document.querySelectorAll('[data-support-effect]')) el.textContent = `：${describeSupport(map.get(Number(el.dataset.supportEffect)))}`;
}
async function measureSupportMagic(M, attackerSpec, targetSpec, state, dress) {
  const ids = [...document.querySelectorAll('[data-support-effect]')].map(el => Number(el.dataset.supportEffect)).filter(Boolean);
  if (!ids.length) return;
  const key = JSON.stringify([dress, ids, targetSpec, state.hpPercent, state.killer, state.targetBreak]);
  if (supportCache.key !== key) {
    battle.reset();
    const a = M.addAttacker(battle, attackerSpec), t = M.addTarget(battle, targetSpec);
    supportCache = { key, map: M.measureSupport(battle, a, t, ids, state) };
  }
  renderSupportEffects(supportCache.map);
}

// ---- 面板与加成核对: every value and bonus the selected move's first hit actually gets, with its sources ----
const REVIEW_STATS = [['hp', 'HP'], ['mp', 'MP'], ['str', '攻击力'], ['def', '防御力'], ['int', '法强'], ['mnd', '魔抗'], ['crt', '暴击率', '%'], ['spd', '速度']];
const stepList = lines => `<ul class="entry-source-list">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
function renderReview(out, first, ctx) {
  const body = $('reviewBody'); if (!body) return;
  if (!first?.breakdown) { body.innerHTML = '<p class="help">这个招式没有伤害段。</p>'; return; }
  const statRows = REVIEW_STATS.map(([k, label, unit = '']) => { const parts = out.statParts?.[k]; if (!parts) return ''; return `<tr><th>${label}</th><td>${fmt(parts.panel)}${unit}</td><td>${fmt(parts.final)}${unit}</td><td>${stepList(statSteps(parts, ctx, { baseLabel: k === 'crt' ? '角色基础暴击率' : '基础值（等级·觉醒·能力盘）', unit }))}</td></tr>`; }).join('');
  const b = first.breakdown, magical = b.attack.stat === K.STAT.INT;
  const moveRows = [[magical ? '法强' : '攻击力', fmt(first.attack), statSteps(b.attack, ctx, { baseLabel: magical ? '基础法强（等级·觉醒·能力盘）' : '基础攻击力（等级·觉醒·能力盘）' })], ['暴击率', `${fmt(first.crt)}%`, statSteps(b.crit, ctx, { baseLabel: '角色基础暴击率', unit: '%' })], ['伤害上限', fmt(first.capComputed), capSteps(first, ctx)]]
    .map(([label, value, lines]) => `<tr><th>${label}</th><td>${value}</td><td>${stepList(lines)}</td></tr>`).join('');
  const resist = first.resist || 0, elem = ELEM_NAMES[first.element] || '无';
  const factors = [['技能系数', `× ${first.coefficient}`], ['攻击属性', first.element ? `${elem}：目标耐性 ${resist} → × ${(1 - Math.min(1, Math.max(-9.99, resist / 100))).toFixed(2)}` : '无属性'], ['特攻', first.killer ? `触发 × ${first.killerFactor.toFixed(2)}` : '未触发'], ['目标防御（结算用）', fmt(first.defense)],
    ['核心前：攻击侧增伤', `× ${first.offense.toFixed(3)}`], ['核心前：目标受伤修正', `× ${first.received.toFixed(3)}`], ['核心前：减伤', `× ${first.reduction.toFixed(3)}`], ['核心伤害（随机 0.95）', fmt(first.core)], ['结算后修正后', fmt(first.afterPassives)]];
  const edits = first.edits.map(e => `<li><span>${esc(e.passiveName || e.name)}</span><b>${fmt(e.value)}</b></li>`).join('');
  body.innerHTML = `<h3>面板（战斗开始后、施放本招式前）</h3><div class="entry-table-wrap"><table class="entry-table"><thead><tr><th>属性</th><th>面板</th><th>战斗中</th><th>计算过程</th></tr></thead><tbody>${statRows}</tbody></table></div>
    <h3>本招式第 1 击：${esc(ctx.moveName)}</h3><div class="entry-table-wrap"><table class="entry-table"><thead><tr><th>项目</th><th>数值</th><th>计算过程</th></tr></thead><tbody>${moveRows}</tbody></table></div>
    <h3>伤害倍率</h3><div class="entry-table-wrap"><table class="entry-table"><tbody>${factors.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></div>
    <h3>结算后修正（按游戏脚本的执行顺序）</h3><ol class="engine-edits">${edits || '<li>无</li>'}</ol>`;
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
  // each hit's own critical rate (the move's own crit bonuses included), not the unit's general one
  const first = live[0]; const st = out.stats; const rateOf = h => Math.min(100, Math.max(0, h?.crt ?? st.crt.real ?? 0)) / 100; const critRate = rateOf(first);
  const { hits } = currentHits();
  if (dualLocked && $('dualWield')) { $('dualWield').checked = true; $('dualWield').disabled = true; }
  if (document.activeElement !== $('engineHits')) $('engineHits').value = siteHits() || '';
  if (!first) { for (const id of ['ep-normal', 'ep-critical', 'ep-total', 'ep-normalTotal', 'ep-killer', 'ep-weak', 'ep-normalGauge', 'ep-normalCap', 'ep-critGauge', 'ep-critCap']) $(id).textContent = '—'; $('ep-note').textContent = out.errors.length ? `脚本错误：${out.errors[0].name}` : '这个招式没有伤害段。'; return; }
  const range = (a, b) => `${fmt(a)} – ${fmt(b)}`;
  const expect = h => h.normal.mean * (1 - rateOf(h)) + (h.critical ? h.critical.mean : h.normal.mean) * rateOf(h);
  const perCall = live.reduce((sum, h) => sum + expect(h), 0);
  $('ep-normal').textContent = range(first.normal.min, first.normal.max);
  $('ep-normalNote').textContent = `游戏脚本结算 · ${live.length > 1 ? `第1击（×${(first.dmgRatio / 10000).toLocaleString('zh-CN')}）；` : ''}含随机波动与每段上限`;
  $('ep-critical').textContent = first.critical ? range(first.critical.min, first.critical.max) : '—';
  $('ep-normalGauge').textContent = fmt(first.normal.max); $('ep-normalCap').textContent = fmt(first.cap);
  $('ep-critGauge').textContent = first.critical ? fmt(first.critical.max) : '—'; $('ep-critCap').textContent = fmt(first.critCap ?? first.cap);
  $('ep-normalBar').style.width = `${Math.min(100, first.cap ? first.normal.max / first.cap * 100 : 0)}%`;
  $('ep-critBar').style.width = `${Math.min(100, (first.critCap ?? first.cap) && first.critical ? first.critical.max / (first.critCap ?? first.cap) * 100 : 0)}%`;
  const mult = dualHitMultiplier(), scale = dualScale();
  $('ep-total').textContent = `≈ ${fmt(perCall * hits * mult)}`;
  $('ep-totalNote').textContent = `${hits} 段${live.length > 1 ? ` × ${live.length} 次调用` : ''}${mult > 1 ? ` × 双刀 ${mult}` : ''} · 暴击率 ${Math.round(critRate * 100)}%（本招式）· 含逐段上限`;
  $('ep-normalTotal').textContent = range(live.reduce((a, h) => a + h.normal.min, 0) * hits * mult, live.reduce((a, h) => a + h.normal.max, 0) * hits * mult);
  $('ep-killer').textContent = first.killer ? `触发 · ×${first.killerFactor.toFixed(2)}` : '未触发';
  // Weakness: the target's resistance to the hit's element (negative = weak), the game's factor 1 − resistance/100
  const weakFactor = 1 - Math.min(1, Math.max(-9.99, (first.resist || 0) / 100));
  $('ep-weak').textContent = !first.element ? '无属性' : first.resist < 0 ? `触发 · ×${weakFactor.toFixed(2)}` : first.resist > 0 ? `未触发 · 耐性 ×${weakFactor.toFixed(2)}` : '未触发';
  const notes = [...(ctx.gearNotes || [])];
  if (dualLocked) notes.push('双刀：这个招式已由技能／装备每段打两次，计算器的双刀不再叠加');
  if (dualOn()) notes.push(`双刀：命中数 ×${mult}、单段伤害 ×${scale ? scale.ratio : 1}（${DUAL_STAGE_LABELS[scale?.stage] || '核心系数中'}）`);
  if (first.normal.max >= first.cap) notes.push('普通伤害触及上限');
  if (otherBullets) notes.push(`另有 ${otherBullets} 条弹道未计入整次期望，见下方明细`);
  if (out.assumptions?.length) notes.push(out.assumptions.join('；'));
  if (out.errors.length) notes.push(`${out.errors.length} 个脚本未能完整执行`);
  $('ep-note').textContent = notes.join(' · ');
}

function mount() {
  const aside = $('unifiedResults'); if (!aside || $('enginePanel')) return;
  if (!$('enginePanelStyle')) { const st = document.createElement('style'); st.id = 'enginePanelStyle'; st.textContent = STYLE; document.head.append(st); }
  const card = document.createElement('section');
  card.id = 'enginePanel'; card.className = 'card engine-panel'; card.setAttribute('aria-labelledby', 'enginePanelTitle');
  card.innerHTML = `<div class="section-heading"><h3 id="enginePanelTitle">游戏脚本结算（沙盒引擎）</h3><span id="engineState" class="help">未开始</span></div>
    <div class="inline-options" id="engineAccountRow"><label><input id="engineAccountBlessings" type="checkbox" checked>计入本账号加护（${ACCOUNT_BLESSINGS.size} 项读取值）</label><label>配装报告<input id="engineLoadoutFile" type="file" accept=".json,application/json"></label><button type="button" id="engineLoadoutClear" class="secondary">清除</button></div>
    <details id="enginePreCasts"><summary>施放前已用过的技能（累计次数类被动、自我 Buff 魔法）</summary><p class="help">按这场战斗里在本招之前已经用过的顺序填次数：例如先放神託的誓言再打必杀，必杀上限就会多 100,000；累计类被动（超必殺技階段增幅等）也按次数累加。默认全为 0。</p><div id="enginePreCastList" class="fields two engine-fields"></div></details>
    <div class="inline-options"><label><input id="engineProbability" type="checkbox" checked>概率效果按已触发计算</label><button type="button" id="engineRun" class="primary">用游戏脚本结算</button></div>
    <div id="engineResult"></div>`;
  aside.insertBefore(card, aside.firstChild);
  // 配装 is on the home page's skill table (with this character); inside that page's frame the button is not shown
  const buildWrap = document.createElement('div'); buildWrap.id = 'engineBuildWrap';
  buildWrap.innerHTML = `<button id="engineBuildToggle" class="primary unified-start" type="button">配装</button><p class="help" id="engineBuildStatus">在首页技能表配装：点“+”加技能，右边显示每个技能的收益和 SC。</p>`;
  card.after(buildWrap);
  const buildPanel = document.createElement('section'); buildPanel.id = 'engineBuild'; buildPanel.className = 'engine-build'; buildPanel.hidden = true; buildPanel.setAttribute('aria-labelledby', 'engineBuildTitle');
  buildPanel.innerHTML = `<div class="section-heading"><h3 id="engineBuildTitle">配装</h3><label class="engine-build-on"><input id="engineBuildOn" type="checkbox">主结果按配装计算</label></div>
      <div class="engine-build-sc"><div><span>SC 合计</span><strong id="engineBuildScTotal">0</strong></div><div class="engine-build-breaks" role="group" aria-label="能力盘突破">${BREAKS.map(([sc, name]) => `<button type="button" data-build-break="${sc}" aria-pressed="true" title="${name}：SC ≤ ${sc} 的一个技能免费">${name}</button>`).join('')}</div></div>
      <p class="help" id="engineBuildSummary" hidden></p>
      <div class="entry-table-wrap"><table class="entry-table engine-build-table engine-build-picked"><colgroup><col style="width:27%"><col style="width:15%"><col><col style="width:44px"></colgroup><thead><tr><th>技能</th><th>SC</th><th>对当前配装的收益</th><th></th></tr></thead><tbody id="engineBuildRows"><tr><td colspan="4" class="help">还没有加技能。</td></tr></tbody></table></div>
      <div class="inline-options"><button type="button" id="engineBuildRecommended" class="secondary">恢复角色推荐配装</button><button type="button" id="engineBuildFromReport" class="secondary">从配装报告载入已装被动</button><button type="button" id="engineBuildRecalc" class="secondary">重算全部收益</button><button type="button" id="engineBuildClear" class="secondary">清空所选</button></div>
      <div class="fields two engine-fields"><label>配装名称<input id="enginePlanName" maxlength="40" placeholder="配装方案"></label><div class="inline-options engine-plan-actions"><button type="button" id="enginePlanSave" class="primary">保存配装</button><button type="button" id="enginePlanSaveNew" class="secondary">另存为新配装</button></div></div>
      <p class="help" id="enginePlanStatus" role="status"></p>
      <details id="enginePlans"><summary>已保存配装（<span id="enginePlanCount">0</span>）</summary><ul id="enginePlanList" class="engine-plan-list"></ul></details>
      <details id="engineRecommend"><summary>按每 SC 收益推荐</summary><p class="help">把原技能表里的每个通用被动（以及本角色能力盘上、技能表里有的要花 SC 的被动）逐个加进当前配装试算，按“收益 ÷ SC”排序。逐个计算，较慢；可随时停止。换招式、条件或配装后会停止，需要重新开始。</p>
        <div class="inline-options"><button type="button" id="engineRecommendStart" class="primary">开始计算</button><button type="button" id="engineRecommendStop" class="secondary" disabled>停止</button></div>
        <p class="help" id="engineRecommendStatus" role="status"></p>
        <div class="entry-table-wrap"><table class="entry-table engine-build-table"><thead><tr><th>被动</th><th>SC</th><th>收益</th><th>每 SC</th><th></th></tr></thead><tbody id="engineRecommendRows"></tbody></table></div></details>`;
  card.append(buildPanel);
  // the result display (big number / gauges / total) sits right under this card's heading, the 配装 panel under it
  mountPrimary();
  card.querySelector('.result-main')?.after(buildPanel);
  // 目标：从游戏怪物表选择 lives with the rest of the Boss/target fields (Boss 与战斗条件 section) instead of in
  // this card; fall back to appending here if that section's slot isn't on the page.
  const targetHtml = `<details id="engineTarget"><summary>目标：从游戏怪物表选择</summary><p class="help">直接用游戏 MonsterMst 的数值（HP、防御、魔抗、种族、属性抗性、Boss 自带被动），与读取报告里的 Boss 完全一致。不选时按上方的目标栏位或读取报告的 Boss。</p>
      <div class="fields two engine-fields"><label>Boss 名称<input id="engineMonsterName" list="engineMonsterNames" placeholder="输入名称筛选"><datalist id="engineMonsterNames"></datalist></label><label>版本（等级 / HP / 防御 / 魔抗）<select id="engineMonsterVariant"><option value="">先输入名称</option></select></label></div>
      <p class="help" id="engineMonsterNote">未选择怪物表目标。</p><button type="button" id="engineMonsterClear" class="secondary">改回计算器目标</button></details>`;
  const targetSlot = $('engineTargetSlot');
  if (targetSlot) targetSlot.innerHTML = targetHtml; else card.insertAdjacentHTML('beforeend', targetHtml);
  $('engineRun').addEventListener('click', () => run(true));
  $('engineProbability').addEventListener('change', e => { probabilityMode = e.target.checked ? 'assume' : 'skip'; run(); });
  $('engineAccountBlessings').addEventListener('change', e => { growthChoice.accountBlessings = e.target.checked; run(); });
  $('engineLoadoutFile').addEventListener('change', async e => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); const M = await ensureEngine(null); if (!M.isLoadoutReport(j)) throw new Error('不是读取器的配装报告（LoadoutReport.json）'); keepLoadout(j); run(); }
    catch (err) { setState(`配装报告未导入：${err.message}`); }
    e.target.value = '';
  });
  $('engineMonsterName').addEventListener('input', () => fillMonsterVariants($('engineMonsterName').value));
  $('engineMonsterName').addEventListener('focus', () => ensureMonsters().then(() => fillMonsterVariants($('engineMonsterName').value)));
  $('engineMonsterVariant').addEventListener('change', e => { monsterChoice = Number(e.target.value) || null; try { if (monsterChoice) localStorage.setItem(MONSTER_KEY, String(monsterChoice)); else localStorage.removeItem(MONSTER_KEY); } catch {} run(); });
  $('engineMonsterClear').addEventListener('click', () => { monsterChoice = null; try { localStorage.removeItem(MONSTER_KEY); } catch {} $('engineMonsterName').value = ''; $('engineMonsterVariant').innerHTML = '<option value="">先输入名称</option>'; $('engineMonsterNote').textContent = '未选择怪物表目标。'; run(); });
  $('engineLoadoutClear').addEventListener('click', () => { loadoutReport = null; try { localStorage.removeItem(LOADOUT_KEY); } catch {} run(); });
  $('engineResult').addEventListener('change', e => { const key = e.target.dataset.assume; if (!key) return; if (e.target.checked) assumed.add(key); else assumed.delete(key); run(); });
  // loadout builder controls
  // the calculator may sit in a character page's panel: the home page opens in the whole window
  $('engineBuildToggle').addEventListener('click', () => {
    const url = new URL(`./index.html?character=${encodeURIComponent(siteCharacterId() || '')}`, location.href).href;
    try { window.top.location.href = url; } catch { location.href = url; }
  });
  buildPanel.hidden = !buildEmbed;
  $('enginePlanSave').addEventListener('click', () => savePlan(false));
  $('enginePlanSaveNew').addEventListener('click', () => savePlan(true));
  $('enginePlanList').addEventListener('click', e => { const b = e.target.closest('[data-plan-action]'); if (b) planAction(b.dataset.planAction, b.dataset.plan, b); });
  $('engineBuildRecommended').addEventListener('click', () => restoreRecommended());
  $('engineRecommendStart').addEventListener('click', () => startRecommend());
  $('engineRecommendStop').addEventListener('click', () => stopRecommend('已停止。'));
  $('engineRecommendRows').addEventListener('click', e => { const add = e.target.closest('[data-build-add]'); if (!add) return; stopRecommend('已加入，配装改变后需要重新计算推荐。'); const id = Number(add.dataset.buildAdd); if (!build.selected.includes(id)) toggleSkill(id); });
  $('engineBuildOn').addEventListener('change', e => { build.on = buildEmbed && e.target.checked; saveBuild(); buildGains.clear(); run(); });
  buildPanel.querySelector('.engine-build-breaks').addEventListener('click', e => {
    const b = e.target.closest('[data-build-break]'); if (!b) return;
    const sc = Number(b.dataset.buildBreak);
    build.breaks = build.breaks.includes(sc) ? build.breaks.filter(x => x !== sc) : cleanBreaks([...build.breaks, sc]);
    saveBuild(); syncBuildControls(); renderBuild(buildCtx);   // SC only: the damage does not change
  });
  $('engineBuildClear').addEventListener('click', () => { build.selected = []; lastAdded = null; saveBuild(); buildGains.clear(); sendState(); run(); });
  $('engineBuildRecalc').addEventListener('click', () => { buildGains.clear(); if (buildCtx) computeGains(buildCtx); });
  $('engineBuildFromReport').addEventListener('click', async () => {
    if (!loadoutReport || !buildDress) { buildMessage('先导入配装报告（上方文件框）。'); return; }
    const M = await ensureEngine(buildDress);
    const lo = M.unitLoadout(loadoutReport, battle.master, await ensureSwitches(), buildDress);
    if (!lo) { buildMessage('配装报告里没有这个角色。'); return; }
    const c = await gameCharacter(buildDress); await ensureTablePassives();
    const own = new Set([...ownPassiveIds(c), ...autoPaidIds(c)]);
    build.selected = lo.passives.filter(id => !own.has(id)); build.on = buildEmbed; saveBuild(); buildGains.clear(); syncBuildControls(); sendState(); run();
  });
  $('engineBuildRows').addEventListener('click', e => { const rm = e.target.closest('[data-build-remove]'); if (rm) toggleSkill(Number(rm.dataset.buildRemove)); });
}
function syncBuildControls() {
  if (!$('engineBuildOn')) return;
  $('engineBuildOn').checked = build.on;
  document.querySelectorAll('[data-build-break]').forEach(b => b.setAttribute('aria-pressed', String(build.breaks.includes(Number(b.dataset.buildBreak)))));
  renderBuildStatus();
  renderPlans();
}
// SC of the picked skills (the character's own skills off the table are not in it: 0 SC)
function buildSc() { return scTotal(pickedIds().map(id => ({ id, sc: passiveCost(id) })), build.breaks); }
// the picked skills without the character's own board skills (those are always in, at 0 SC)
function pickedIds() { return build.selected.filter(id => !buildAuto.includes(id)); }
// the status line under the 配装 button (in the page's frame) and the state for the page
function renderBuildStatus() {
  const { total } = buildSc(), n = pickedIds().length;
  const cur = buildCurrent && build.on ? ` · 当前配装每次 ${fmt(buildCurrent.perCall)}` : '';
  if ($('engineBuildStatus') && buildEmbed) $('engineBuildStatus').textContent = `主结果按配装计算：已选 ${n} 个技能 · SC 合计 ${total}${cur}`;
  sendState();
}
// The character's own passives (game-data/c/<dress>.json) split by SC: COST 99 marks the free ones (unique
// passives such as 赤裸之力II / 救世的聖劍, 【超越】, 迷宮踏破) that are always on; the rest cost SC in the game. Every one
// of those on the character's own ability board — also the common ones a relic can teach (冰攻击提升III …) — is the
// character's own: always added at 0 SC, like the old skill table (user 2026-09-29: “算 0 SC（和原来技能表一样）”);
// only skills learned from relics on top cost SC, and 能力盘突破 only frees among those. 个性 / 固有 / 超越 / 加护 are
// always all on.
const FREE_COST = 99;
const isFreePassive = id => { const c = battle?.master.passive.get(id)?.COST; return c == null || c >= FREE_COST; };
function ownPassiveIds(c) {
  if (!c) return [];
  return [...(c.personality || []).map(p => p.passive), ...(c.ownPassives || []).map(p => p.passive).filter(isFreePassive), ...(c.transcend || []).map(p => p.passive), ...(c.blessings || [])];
}
const ownPaidIds = c => (c?.ownPassives || []).map(p => p.passive).filter(id => !isFreePassive(id));
let tablePassives = null;
async function ensureTablePassives() {
  if (!tablePassives) tablePassives = new Set(await fetch(new URL('./game-data/engine/table-passives.json?v=20260929-build', import.meta.url)).then(r => r.json()).then(t => t.ids).catch(() => []));
  return tablePassives;
}
const autoPaidIds = c => ownPaidIds(c);
// where an own board skill comes from: the limit-break stage its board area opens at, and whether a relic teaches it too
const boardInfo = (c, id) => { const p = (c?.ownPassives || []).find(x => x.passive === id); return p ? { limitBreak: p.limitBreak, common: !!p.common } : null; };
// Expected damage per call of the move (the main card's metric) from one scenario run, and what its first hit
// received (the numbers a skill can change).
function metricOf(out) {
  const all = out.hits.filter(h => !h.cancelled && h.normal), live = all.filter(h => h.bulletId === all[0]?.bulletId);
  const rateOf = h => Math.min(100, Math.max(0, h?.crt ?? out.stats.crt.real ?? 0)) / 100;
  const perCall = live.reduce((sum, h) => sum + h.normal.mean * (1 - rateOf(h)) + (h.critical ? h.critical.mean : h.normal.mean) * rateOf(h), 0);
  const h = live[0];
  const detail = h ? { magical: h.breakdown?.attack?.stat === K.STAT.INT, attack: h.attack, crt: h.crt ?? out.stats.crt.real, cap: h.capComputed ?? h.cap, killer: h.killerFactor, offense: h.offense, received: h.received, reduction: h.reduction, resist: h.resist,
    post: h.core ? h.afterPassives / h.core : null, crit: h.critical && h.normal?.mean ? h.critical.mean / h.normal.mean : null } : null;
  return { perCall, cap: h?.cap ?? null, errors: out.errors.length, detail };
}
// What a skill changes: the metric with it against the metric without it (same wording as the result card).
const num2 = n => Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const mul = n => `×${Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
const CHANGES = [
  ['attack', d => d.magical ? '法强' : '攻击力', (a, b) => signed(a - b)],
  ['crt', () => '暴击率', (a, b) => signed(a - b, '%')],
  ['cap', () => '伤害上限', (a, b) => signed(a - b)],
  ['killer', () => '特攻倍率', (a, b) => `${mul(b)} → ${mul(a)}`],
  ['offense', () => '核心前倍率·攻', (a, b) => `${mul(b)} → ${mul(a)}`],
  ['received', () => '核心前倍率·受', (a, b) => `${mul(b)} → ${mul(a)}`],
  ['reduction', () => '核心前倍率·减伤', (a, b) => `${mul(b)} → ${mul(a)}`],
  ['resist', () => '属性抗性', (a, b) => `${num2(b)} → ${num2(a)}`],
  ['post', () => '核心后修正', (a, b) => `${mul(b)} → ${mul(a)}`],
  ['crit', () => '暴击伤害倍率', (a, b) => `${mul(b)} → ${mul(a)}`],
];
function changesOf(withIt, without) {
  const a = withIt?.detail, b = without?.detail; if (!a || !b) return [];
  const out = [];
  for (const [key, label, show] of CHANGES) {
    const x = a[key], y = b[key]; if (x == null || y == null) continue;
    const tiny = ['attack', 'cap'].includes(key) ? 0.5 : key === 'crt' || key === 'resist' ? 0.005 : 0.0005;
    if (Math.abs(x - y) >= tiny) out.push(`${label(a)} ${show(x, y)}`);
  }
  return out;
}
// One evaluation of a passive set with the current move / target / state (single random 0.95: relative gains only).
function evalBuild(ctx, passiveIds) {
  const M = engineModules;
  battle.reset();
  const spec = { ...ctx.attackerSpec, passives: passiveIds.map(id => (typeof id === 'object' ? id : { id })) };
  const a = M.addAttacker(battle, spec), t = M.addTarget(battle, ctx.targetSpec);
  return metricOf(M.runScenario({ battle, attacker: a, target: t, skill: { id: ctx.move.id, ...(ctx.firstBullet ? { bulletId: ctx.firstBullet } : {}) }, state: ctx.state, assume: { probability: probabilityMode, instances: [...ctx.assumeSet] }, randoms: [0.95] }));
}
const yieldUi = () => new Promise(r => setTimeout(r, 0));
// The current build, the start (配装前: no picked skill) and the marginal of every picked and automatic skill,
// computed one run at a time so the page stays live — the skill added last first; a new main run cancels the loop.
async function computeGains(ctx) {
  const gen = ++buildGen;
  const rows = $('engineBuildRows'); if (!rows) return;
  try {
    if (!buildCurrent) { buildCurrent = evalBuild(ctx, ctx.buildPassives); renderBuild(ctx); await yieldUi(); if (gen !== buildGen) return; }
    const order = [...(lastAdded != null && build.selected.includes(lastAdded) ? [lastAdded] : []), ...[...build.selected].reverse().filter(id => id !== lastAdded), ...ctx.autoIds];
    for (const id of order) {
      if (buildGains.has(id)) continue;
      const without = evalBuild(ctx, ctx.buildPassives.filter(p => (p.id ?? p) !== id));
      buildGains.set(id, { removed: true, perCall: without.perCall, gain: without.perCall > 0 ? buildCurrent.perCall / without.perCall - 1 : null, changes: changesOf(buildCurrent, without) });
      renderBuild(ctx); await yieldUi(); if (gen !== buildGen || running) return;
    }
    if (!buildBaseline) { buildBaseline = evalBuild(ctx, ctx.buildOwn); renderBuild(ctx); }
  } catch (err) { console.error(err); buildMessage(`收益计算失败：${err.message}`); }
}
const pct = g => g == null ? '—' : `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%`;
const passiveText = id => { const row = passiveIndex?.find(r => r.id === id); return row?.nameS || battle?.master.passive.get(id)?.NAME || `编号 ${id}`; };
function gainCell(id) {
  const g = buildGains.get(id);
  if (!g || !g.removed) return '<small>计算中…</small>';
  const changes = g.changes?.length ? g.changes.map(esc).join(' · ') : '本招式没有变化（本招不吃这个技能的效果，或条件没有触发）';
  return `<b>${pct(g.gain)}</b> <small>去掉它每次 ${fmt(g.perCall)}</small><div class="engine-build-changes">${changes}</div>`;
}
// the 配装 panel shows no summary paragraph (user 2026-09-29: “把这段都删掉”); the line is only used for a message
function buildMessage(text) { const el = $('engineBuildSummary'); if (el) { el.textContent = text || ''; el.hidden = !text; } }
function renderBuild(ctx) {
  const rows = $('engineBuildRows'); if (!rows) return;
  const sc = buildSc();
  if ($('engineBuildScTotal')) $('engineBuildScTotal').textContent = String(sc.total);
  renderBuildStatus(); sendState();
  buildMessage('');
  if (!build.on) { rows.innerHTML = '<tr><td colspan="4" class="help">还没有加技能。</td></tr>'; return; }
  const picked = [...sc.items].sort((a, b) => b.sc - a.sc);
  const nameTd = id => { const row = passiveIndex?.find(r => r.id === id); return `<span title="${esc(row?.name || '')}">${esc(passiveText(id))}</span>`; };
  const pickedRows = picked.map(i => `<tr><td>${nameTd(i.id)}${battle && !battle.master.passive.has(i.id) ? ' <small>（主数据缺失）</small>' : ''}</td><td class="engine-build-sccell">${i.freeBy ? `<b>0</b><small>${breakName(i.freeBy)}（原 ${i.sc}）</small>` : i.sc || '—'}</td><td>${gainCell(i.id)}</td><td><button type="button" class="secondary" data-build-remove="${i.id}" aria-label="移除">×</button></td></tr>`);
  const boardTitle = id => { const b = ctx?.buildAutoInfo?.get(id); return b ? `角色自己能力盘上的技能（限界突破第 ${b.limitBreak} 阶段的区域）${b.common ? '，也能从圣物学' : '，只有这个角色有'}；算 0 SC` : '角色自己能力盘上的技能；算 0 SC'; };
  const autoRows = [...(ctx?.autoIds || [])].sort((a, b) => (passiveCost(b) ?? 0) - (passiveCost(a) ?? 0)).map(id => `<tr class="engine-build-auto"><td>${nameTd(id)}<br><small class="engine-build-tag" title="${esc(boardTitle(id))}">能力盘自带</small></td><td class="engine-build-sccell"><b>0</b><small>原 ${passiveCost(id) ?? '—'}</small></td><td>${gainCell(id)}</td><td><small>固定</small></td></tr>`);
  rows.innerHTML = [...pickedRows, ...autoRows].join('') || '<tr><td colspan="4" class="help">还没有加技能：在左边的技能表点“+”。</td></tr>';
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

// ---- 专武（按最大） ----
// Exclusive gear is taken at its maximum (the user's rule): each item at its highest tier (tiers of one item share
// SERIAL_NUM; the higher RARE is the upgrade, e.g. 魔祸翼 → 魔祸呪翼) with the passives of its highest enhancement
// stage (game-data c/<dress>.json: serial, rare, maxPassives). ItemEquipMst only points to the base stage.
function exclusiveTiers(c) {
  const best = new Map();
  for (const e of c?.exclusiveEquipment || []) { const k = e.serial ?? e.id, b = best.get(k); if (!b || (e.rare ?? 0) > (b.rare ?? 0) || ((e.rare ?? 0) === (b.rare ?? 0) && e.id > b.id)) best.set(k, e); }
  return [...best.values()];
}
const tierOf = c => { const m = new Map(); for (const top of exclusiveTiers(c)) for (const e of c.exclusiveEquipment) if ((e.serial ?? e.id) === (top.serial ?? top.id)) m.set(e.id, top); return m; };
const isWeapon = t => t >= 10 && t < 20;
// The calculator's 专武 selector: 未装备／其他 → none, 全部装备 → every item, one item → that item (matched by name).
function chosenExclusive(c, master) {
  const choice = $('specialWeapon')?.value || 'both';
  const tiers = exclusiveTiers(c);
  const gear = characterGear(new URLSearchParams(location.search).get('character') || '');
  const order = Object.values(gear).map(g => g.name);
  const rank = e => { const i = order.indexOf(e.nameS); return i < 0 ? order.length : i; };
  const sorted = tiers.map((e, i) => ({ e, i })).sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i).map(x => x.e);
  if (choice === 'none' || choice === 'other') return [];
  if (choice === 'both') return sorted;
  const name = gear[choice]?.name;
  return sorted.filter(e => e.nameS === name);
}
// Slots: weapon 1, armour 2 (a second exclusive weapon takes it when there is no exclusive armour), accessories 3–4.
function exclusiveEquips(items, master) {
  const typed = items.map(e => ({ e, type: master.itemEquip.get(e.id)?.EQUIP_TYPE ?? 0 }));
  const weapons = typed.filter(x => isWeapon(x.type)), armours = typed.filter(x => x.type >= 20 && x.type < 30), others = typed.filter(x => x.type >= 30 && x.type < 40);
  const equips = [];
  if (weapons[0]) equips.push({ pos: 1, id: weapons[0].e.id });
  if (armours[0]) equips.push({ pos: 2, id: armours[0].e.id });
  else if (weapons[1]) equips.push({ pos: 2, id: weapons[1].e.id });
  others.slice(0, 2).forEach((x, i) => equips.push({ pos: 3 + i, id: x.e.id }));
  return equips;
}
// Every exclusive item on the attacker at its top tier and top stage (also for a report's gear).
function maximizeExclusive(spec, c) {
  const tiers = tierOf(c); if (!tiers.size || !spec.equips) return;
  spec.equips = spec.equips.map(e => { const top = tiers.get(Number(e.id)); return top ? { ...e, id: top.id } : e; });
  spec.equipPassiveIds = { ...(spec.equipPassiveIds || {}) };
  for (const e of spec.equips) { const top = [...tiers.values()].find(t => t.id === e.id); if (top?.maxPassives?.length) spec.equipPassiveIds[top.id] = top.maxPassives; }
}
// 双刀: the calculator's 双刀信息 fields, exactly as the old rules use them and only when the switch is on —
// 命中数倍率 multiplies the hit count, 单段伤害倍率 each hit at 修正试算位置. Gear and skills are not checked.
// When the move itself already hits twice per 段 through the character's own skills or gear (the game script
// makes the two calls, e.g. 洛琪希's ice magic, or 梅莉 with both exclusive weapons and 二刀流), the 双刀 button is
// shown on and locked, and the calculator's own 双刀 is not stacked on top. Unlocking restores the user's choice.
let dualLocked = false;
function setDualLock(locked) {
  const box = $('dualWield'); if (!box || locked === dualLocked) return false;
  dualLocked = locked;
  const label = box.closest('label');
  if (locked) { box.checked = true; box.disabled = true; label?.setAttribute('title', '这个招式的双刀效果已由技能／装备生效，计算器不再叠加'); }
  else { box.disabled = false; box.checked = !!(latest?.selection?.dualWield ?? false); label?.removeAttribute('title'); }
  document.dispatchEvent(new CustomEvent('lc:dual-lock', { detail: { locked } }));
  return true;
}
function dualOn() { return !dualLocked && !!(latest?.selection?.dualWield ?? $('dualWield')?.checked); }
function dualScale() { if (!dualOn()) return null; const ratio = Number($('hitDamageRatio')?.value); return Number.isFinite(ratio) ? { ratio, stage: $('hitScaleStage')?.value || 'core' } : null; }
function dualHitMultiplier() { if (!dualOn()) return 1; const n = Number($('hitMultiplier')?.value); return Number.isInteger(n) && n >= 1 ? n : 1; }
const DUAL_STAGE_LABELS = { core: '核心系数中', beforeCap: '伤害上限前', afterCap: '伤害上限后' };

// HP follows the calculator's two switches exactly like the old rules: 满血 → 100% (full-HP effects such as
// 月光II fire), 濒死 → 25%, neither → 99% (alive and healthy, but nothing that needs full HP fires).
function stateFromSwitches(detail) {
  const sel = detail.selection || {};
  const full = sel.fullHp || $('fullHp')?.checked, low = sel.lowHp || $('lowHp')?.checked;
  const hp = low ? 25 : full ? 100 : 99;
  const mp = (sel.mpLow || $('mpLow')?.checked) ? 20 : 100;
  // 特攻 / Break: the switch alone decides (bonuses tied to them still come from the skills)
  const targetBreak = sel.break ?? $('break')?.checked ?? false, ratio = Number($('breakDefenseRatio')?.value);
  return { hpPercent: hp, mpPercent: mp, openingBuffActive: $('openingBuffActive') ? $('openingBuffActive').checked : true, preCasts: [...supportActive, ...preCastList()],
    killer: (sel.specialAttack ?? $('specialAttack')?.checked) ? 'on' : 'off', targetBreak: !!targetBreak, breakDefenseRatio: Number.isFinite(ratio) ? ratio : null,
    hitScale: dualScale() };
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

// 圣物属性 (the page's 已确认的伤害加成): added to the final stats (最终攻击力 100 + 圣物 10 → 110, the user's rule)
const ARK_KEYS = { hp: 'hp', mp: 'mp', attack: 'str', defense: 'def', intelligence: 'int', mind: 'mnd' };
function arkFinalAdd(ark) { const out = {}; for (const [k, v] of Object.entries(ark || {})) if (ARK_KEYS[k] && Number(v)) out[ARK_KEYS[k]] = Number(v); return Object.keys(out).length ? out : null; }

function activeSwitchGroups() {
  return Object.keys(SWITCH_LABELS).filter(id => id !== 'openingBuffActive' && $(id)?.checked);
}

async function run(force = false) {
  if (recommendState.running) stopRecommend('配装、招式或条件已改变，已停止；可重新开始。');
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
      // no report: the game character at its maximum growth with every own passive and its exclusive gear;
      // the out-of-battle panel comes entirely from master data (scenario.mjs panelGiven:false)
      const c = await gameCharacter(dress);
      const ids = latest.ownPassives?.length ? latest.ownPassives : c ? [...(c.personality || []).map(p => p.passive), ...(c.ownPassives || []).map(p => p.passive), ...(c.transcend || []).map(p => p.passive), ...(c.blessings || [])] : [];
      const blessings = growthChoice.accountBlessings ? [...ACCOUNT_BLESSINGS].filter(([id]) => battle.master.passive.has(id)).map(([id, params]) => ({ id, params })) : [];
      const fromLoadout = loadoutReport ? M.attackerFromLoadout(loadoutReport, battle.master, await ensureSwitches(), dress, { extraPassives: blessings }) : null;
      // passives learned from other characters live outside the character bundle: fetch their id buckets first
      const unresolved = fromLoadout ? await M.loadPassives(battle.master, fromLoadout.passives.map(p => p.id)) : [];
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
        attackerSpec = { ...fromLoadout, name: c?.nameS || fromLoadout.name, statsSource: `配装报告（${lo.passives.length} 个被动 · ${gearNote}${crestNote}${growthChoice.accountBlessings ? ' ＋本账号加护' : ''}；等级／觉醒／能力盘／强化／徽章等级按最大${unknown ? `；${unknown} 个被动未在主数据中找到` : ''}）` };
      } else {
        const equips = exclusiveEquips(chosenExclusive(c, battle.master), battle.master);
        const passives = [...ids.map(id => ({ id })), ...blessings.filter(b => !ids.includes(b.id))];
        attackerSpec = { unitDressId: dress, name: c?.nameS, panelGiven: false, passives, personality: c?.personality || [], equips, statsSource: `游戏数据计算（${loadoutReport ? '配装报告里没有这个角色；' : ''}${equips.length ? equips.map(e => battle.master.itemEquip.get(e.id)?.NAME).join('、') + ' 满强化' : '无专属装备'}；被动按全部自带技能${growthChoice.accountBlessings ? '＋本账号加护' : ''}；等级／觉醒／能力盘按最大）` };
      }
      // 配装模式 replaces both: all own passives + the picked common passives, the exclusive gear chosen in the 专武 field
      loadBuildFor(dress);
      if (build.on) {
        await ensurePassiveIndex(); await ensureTablePassives();
        await M.loadPassives(battle.master, [...ownPassiveIds(c), ...(c?.ownPassives || []).map(p => p.passive), ...build.selected]);
        const own = ownPassiveIds(c), ownSet = new Set(own);
        // the character's own SC skills that are not on the skill table: always added, 0 SC
        const auto = autoPaidIds(c).filter(id => !ownSet.has(id)), autoSet = new Set(auto);
        const picked = build.selected.filter(id => !ownSet.has(id) && !autoSet.has(id));
        buildOwnPaid = ownPaidIds(c).filter(id => !autoSet.has(id)); buildAuto = auto;
        // a loadout saved before (or a report / recommendation) may list own board skills: they are in already
        if (build.selected.some(id => autoSet.has(id))) { build.selected = build.selected.filter(id => !autoSet.has(id)); saveBuild(); }
        const equips = exclusiveEquips(chosenExclusive(c, battle.master), battle.master);
        const bless = blessings.filter(b => !ownSet.has(b.id));
        const buildOwn = [...own.map(id => ({ id })), ...bless, ...auto.map(id => ({ id }))];
        const buildPassives = [...buildOwn, ...picked.map(id => ({ id }))];
        const crest = fromLoadout?.crest || null;
        attackerSpec = { unitDressId: dress, name: c?.nameS, panelGiven: false, passives: buildPassives, personality: c?.personality || [], equips, crest,
          statsSource: `配装（自带免费被动 ${own.length} 个${bless.length ? '＋加护' : ''}＋能力盘自带 ${auto.length} 个＋所选 ${picked.length} 个技能 · ${equips.length ? `专武 ${equips.map(e => battle.master.itemEquip.get(e.id)?.NAME).join('、')}` : '无专武'}${crest ? ' · 徽章按配装报告' : ''}；全部按最大）` };
        attackerSpec.buildOwn = buildOwn; attackerSpec.buildPassives = buildPassives; attackerSpec.buildAuto = auto; attackerSpec.buildAutoInfo = new Map(auto.map(id => [id, boardInfo(c, id)])); attackerSpec.buildNote = crest ? '徽章按配装报告' : '';
        attackerSpec.buildGear = equips.length ? `专武：${equips.map(e => battle.master.itemEquip.get(e.id)?.NAME).join('、')}` : '无专武';
      } else renderBuild(null);
    }
    // 专武 at its maximum (not for a captured battle, which records what was really equipped)
    const gearNotes = [];
    const gameChar = await gameCharacter(dress);
    if (!(report && M.isBattleReport(report) && report.units?.[0]?.unitId === dress)) maximizeExclusive(attackerSpec, gameChar);
    // the top enhancement stages live in the passive id buckets, not in the character bundle
    const stageMissing = await M.loadPassives(battle.master, Object.values(attackerSpec.equipPassiveIds || {}).flat());
    if (stageMissing.length) gearNotes.push(`专武最高强化阶段的被动 ${stageMissing.join('、')} 在游戏数据里没找到，按基础阶段计算`);
    if (stageMissing.length) for (const [id, list] of Object.entries(attackerSpec.equipPassiveIds)) if (list.some(p => stageMissing.includes(p))) delete attackerSpec.equipPassiveIds[id];
    const attacker = M.addAttacker(battle, attackerSpec);
    renderPreCasts(attacker, battle.master, move.id);
    let targetSpec = null;
    if (monsterChoice) { await ensureMonsters(); await ensureMonsterPassives(); targetSpec = M.targetFromMonster(battle.master, monsterChoice); if (targetSpec) { targetSpec.source = '游戏怪物表'; $('engineMonsterNote').textContent = monsterNote(targetSpec); if ($('engineMonsterName') && !$('engineMonsterName').value) { $('engineMonsterName').value = targetSpec.name; fillMonsterVariants(targetSpec.name); } } }
    if (!targetSpec) targetSpec = report && $('bossPreset')?.value?.startsWith('reader-') ? M.targetFromReport(report, { bossIndex: Number($('bossPreset').value.slice(7)) || 0 }) : targetFromFields(latest);
    const target = M.addTarget(battle, targetSpec);
    renderSupportMagic(gameChar, dress);
    attackerSpec.finalAdd = arkFinalAdd(latest.arkStats);
    const state = stateFromSwitches(latest);
    // switches assume every conditional instance in their group
    const groups = new Set(activeSwitchGroups());
    const probe = M.runScenario({ battle, attacker, target, skill: { id: move.id }, state, assume: { probability: probabilityMode, instances: [...assumed] }, randoms: [0.95] });
    const autoAssume = probe.conditionals.filter(c => groups.has(c.switchGroup)).map(c => c.key);
    battle.reset();
    const attacker2 = M.addAttacker(battle, attackerSpec), target2 = M.addTarget(battle, targetSpec);
    const out = M.runScenario({ battle, attacker: attacker2, target: target2, skill: { id: move.id }, state, assume: { probability: probabilityMode, instances: [...new Set([...assumed, ...autoAssume])] } });
    // the move already hits twice per 段 by itself → lock 双刀 (and run again if the lock changes what was applied)
    const damaging = out.hits.filter(h => !h.cancelled && h.normal);
    if (setDualLock(damaging.filter(h => h.bulletId === damaging[0]?.bulletId).length > 1)) pending = true;
    render(out, { move, attackerSpec, targetSpec, state, autoAssume: new Set(autoAssume), attacker: attacker2, out, dress });
    renderPrimary(out, { move, dress, gearNotes });
    await ensurePassiveNames();
    const firstHit = damaging.filter(h => h.bulletId === damaging[0]?.bulletId)[0];
    const moveName = gameChar ? [...(gameChar.specials || []), gameChar.ultimate, ...(gameChar.magic?.normal || []), ...(gameChar.magic?.heavy || [])].filter(Boolean).find(m => m.id === move.id)?.nameS : null;
    const fieldCtx = { hits: damaging, gearNames: new Map((gameChar?.exclusiveEquipment || []).map(e => [e.id, e.nameS])), moveName: moveName || move.name || '本招式' };
    moveInfo = { id: move.id, name: fieldCtx.moveName, element: firstHit?.element ?? battle.master.skillInfo?.(move.id)?.elem ?? null, skillType: battle.master.skillInfo?.(move.id)?.skillType ?? null, character: gameChar?.nameS || null };
    renderBasicFields(firstHit, fieldCtx);
    renderReview(out, firstHit, fieldCtx);
    try { await measureSupportMagic(M, attackerSpec, targetSpec, state, dress); } catch (err) { console.error(err); }
    setState(`已结算 · ${new Date().toLocaleTimeString('zh-CN')}`); setPrimaryState(`游戏脚本 · ${new Date().toLocaleTimeString('zh-CN')}`);
    if (attackerSpec.buildPassives) {
      const { buildOwn, buildPassives, buildAuto: autoIds, buildAutoInfo, buildNote, buildGear, ...rest } = attackerSpec;
      // gains only compare the move's first damaging bullet (as the main card's per-call metric does)
      buildCtx = { move, attackerSpec: rest, targetSpec, state, assumeSet: new Set([...assumed, ...autoAssume]), buildOwn, buildPassives, autoIds, buildAutoInfo, buildNote, buildGear, firstBullet: damaging[0]?.bulletId ?? null };
      const key = JSON.stringify([move.id, targetSpec, state, [...buildCtx.assumeSet], probabilityMode, buildPassives.map(p => p.id), buildOwn.map(p => p.id), (rest.equips || []).map(e => e.id), currentHits().hits]);
      if (key !== lastBuildKey) { buildGains.clear(); buildCurrent = buildBaseline = null; }
      lastBuildKey = key; buildCtx.key = key;
      renderBuild(buildCtx);
      computeGains(buildCtx); // continues between main runs; a new run cancels it
    } else buildCtx = null;
  } catch (err) {
    setState('结算失败'); setPrimaryState('结算失败'); $('engineResult').innerHTML = `<p class="help">${esc(err.message)}</p>`; console.error(err);
  } finally {
    running = false;
    if (pending) { pending = false; run(); } else sendState();
  }
}

function render(out, ctx) {
  const rawHits = out.hits.filter(h => !h.cancelled);
  const first = rawHits[0];
  const chain = first ? first.edits.map(e => `<li><span>${esc(e.passiveName || e.name)}</span><b>${fmt(e.value)}</b></li>`).join('') : '';
  const groups = new Map();
  for (const c of out.conditionals) { const g = SWITCH_LABELS[c.switchGroup] || '条件BUFF'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(c); }
  const conditionals = [...groups.entries()].map(([g, list]) => `<p class="help"><b>${esc(g)}</b>${$(Object.keys(SWITCH_LABELS).find(k => SWITCH_LABELS[k] === g))?.checked ? '（开关已打开，同组默认勾选）' : ''}</p>` + list.map(c => `<label class="engine-conditional"><input type="checkbox" data-assume="${esc(c.key)}" ${assumed.has(c.key) || ctx.autoAssume.has(c.key) ? 'checked' : ''}>${esc(c.passiveName)} · ${esc(c.processName)} <small>${esc(c.triggerLabel)}${c.condition ? ` · ${esc(c.condition)}` : ''}</small></label>`).join('')).join('');
  const prob = out.probabilistic.map(p => `<li>${esc(p.passiveName)} · ${esc(p.processName)} <small>${p.prob}% · ${esc(p.triggerLabel)}</small></li>`).join('');
  const buffs = out.buffs.filter(b => b.remain !== 0).map(b => `<li>${esc(b.name)}${b.from ? ` <small>来自 ${esc(b.from)}</small>` : ''}${b.remain > 0 ? ` <small>${Math.round(b.remain / 60)} 秒</small>` : ''}</li>`).join('');
  const issues = [...out.errors.map(e => `脚本 ${esc(e.name)} (${e.id})：${esc(e.error)}`), ...out.unsupported.map(n => `未实现的原生函数：${esc(n)}`), ...(out.assumptions || []).map(a => `简化假定：${esc(a)}`)];
  $('engineResult').innerHTML = `
    ${first ? `<details class="engine-chain"><summary>第1击结算链（随机 0.95）：核心 ${fmt(first.core)} → 修正后 ${fmt(first.afterPassives)}${first.edits.length ? `（${first.edits.length} 项）` : ''}</summary><p class="help">系数 ${first.coefficient} · 属性 ${['无', '火', '冰', '树', '雷', '光', '暗'][first.element] || first.element}（抗性 ${first.resist}）· 核心前倍率 攻 ×${first.offense.toFixed(3)} 受 ×${first.received.toFixed(3)} 减伤 ×${first.reduction.toFixed(3)} · 上限 9,999 + ${fmt(first.capVal)}${first.capPer ? ` ×(1+${first.capPer / 100}%)` : ''}${first.capAdd ? ` + ${fmt(first.capAdd)}` : ''}</p><ol class="engine-edits">${chain}</ol></details>` : ''}
    <details class="engine-buffs"><summary>局内 Buff（${out.buffs.length}）</summary><ul>${buffs || '<li>无</li>'}</ul></details>
    ${conditionals ? `<details class="engine-conditionals" open><summary>可假定触发的条件效果（${out.conditionals.length}）</summary><p class="help">勾选后按已触发计算；对应局内开关打开时同组自动勾选。</p>${conditionals}</details>` : ''}
    ${prob ? `<details class="engine-prob"><summary>概率效果（${out.probabilistic.length}，${probabilityMode === 'assume' ? '按已触发计算' : '按未触发计算'}）</summary><ul>${prob}</ul></details>` : ''}
    ${issues.length ? `<details class="engine-issues" open><summary>未能完整模拟（${issues.length}）</summary><ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul></details>` : ''}`;
}

function receiveState(detail) { latest = detail || {}; report = latest.battle || null; mount();
  if ($('engineAccountRow')) $('engineAccountRow').hidden = !!(report && report.units?.length); run(); }
document.addEventListener('lc:calculator-update', e => receiveState(e.detail));
mount();
// the page may have handed its state over before this module finished loading
if (window.LC_CALCULATOR_STATE && !latest) receiveState(window.LC_CALCULATOR_STATE);

