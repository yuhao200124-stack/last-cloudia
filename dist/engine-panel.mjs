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
// The site's own panel preview (old rules), shown beside the game-data panel as a comparison.
function websitePanel() {
  const p = latest?.panels || {};
  const base = Number.isFinite(latest?.attackBase) ? latest.attackBase : null;
  return { str: Number.isFinite(p.attack) ? p.attack : latest?.referenceMode === 'str' ? base : null, int: Number.isFinite(p.intelligence) ? p.intelligence : latest?.referenceMode === 'int' ? base : null };
}

const STYLE = `.engine-panel .engine-fields{margin:.5rem 0}.engine-panel .engine-hits td,.engine-panel .engine-hits th{white-space:nowrap}.engine-panel .engine-edits{margin:.5rem 0 0;padding-left:1.2rem}.engine-panel .engine-edits li{display:flex;justify-content:space-between;gap:1rem}.engine-panel .engine-conditional{display:block;margin:.25rem 0}.engine-panel .engine-conditional small{color:var(--muted,#6b7280)}.engine-panel details{margin-top:.5rem}.engine-panel ul{margin:.25rem 0 0;padding-left:1.2rem}`;
function mount() {
  const aside = $('unifiedResults'); if (!aside || $('enginePanel')) return;
  if (!$('enginePanelStyle')) { const st = document.createElement('style'); st.id = 'enginePanelStyle'; st.textContent = STYLE; document.head.append(st); }
  const card = document.createElement('section');
  card.id = 'enginePanel'; card.className = 'card engine-panel'; card.setAttribute('aria-labelledby', 'enginePanelTitle');
  card.innerHTML = `<div class="section-heading"><h3 id="enginePanelTitle">游戏脚本结算（沙盒引擎）</h3><span id="engineState" class="help">未开始</span></div>
    <p class="help">用读取器捕获的游戏 Lua 脚本和主数据逐段结算：每个被动、Buff、弹道按游戏自己的触发时机与顺序计算。这是与上方网页规则并列的对照，不改变上方结果。</p>
    <div class="fields two engine-fields"><label>当前 HP %<input id="engineHp" type="number" min="1" max="100" step="1" placeholder="按开关"></label><label>当前 MP %<input id="engineMp" type="number" min="0" max="100" step="1" placeholder="按开关"></label></div>
    <div class="fields two engine-fields" id="enginePanelStats"><label>角色等级<select id="engineLevel"><option value="">最大</option></select></label><label>觉醒<select id="engineAwake"><option value="">最大</option></select></label><label>手填局外攻击力<input id="engineStr" type="number" min="0" step="1" placeholder="按游戏数据"></label><label>手填局外法强<input id="engineInt" type="number" min="0" step="1" placeholder="按游戏数据"></label></div>
    <div class="inline-options" id="engineAccountRow"><label><input id="engineAccountBlessings" type="checkbox" checked>计入本账号加护（${ACCOUNT_BLESSINGS.size} 项读取值）</label></div>
    <p class="help" id="enginePanelNote">未导入读取报告时，局外面板直接按游戏数据计算：等级成长 + 觉醒 + 全开能力盘 + 专属武器／防具满强化，再过一遍状态计算被动（与游戏面板一致）；手填只用于覆盖。导入报告后自动改用报告里的入场面板与实际配置。</p>
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
  $('engineLevel').addEventListener('change', e => { growthChoice.level = e.target.value === '' ? null : Number(e.target.value); run(); });
  $('engineAwake').addEventListener('change', e => { growthChoice.awake = e.target.value === '' ? null : Number(e.target.value); run(); });
  $('engineResult').addEventListener('change', e => { const key = e.target.dataset.assume; if (!key) return; if (e.target.checked) assumed.add(key); else assumed.delete(key); run(); });
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
  if (!engineModules) engineModules = await Promise.all([import('./engine/battle.mjs'), import('./engine/engine-data.mjs'), import('./engine/scenario.mjs'), import('./engine/report-adapter.mjs')]).then(([b, d, s, r]) => ({ ...b, ...d, ...s, ...r }));
  if (!battle || loadedDress !== unitDressId) {
    setState('正在读取游戏脚本与主数据…');
    const { master, scripts } = await engineModules.loadEngineData({ unitDressIds: unitDressId ? [unitDressId] : [] });
    battle = new engineModules.Battle(master, scripts, { probability: probabilityMode });
    loadedDress = unitDressId;
  }
  return engineModules;
}

const setState = text => { const el = $('engineState'); if (el) el.textContent = text; };

function targetFromFields(detail) {
  const races = [...document.querySelectorAll('[data-boss-race]:checked')].map(el => RACE_CODES[el.dataset.bossRace]).filter(Boolean);
  const res = [...document.querySelectorAll('[data-boss-resistance]')].map(el => Number(el.value) || 0);
  return { name: $('bossPreset')?.selectedOptions[0]?.textContent || '目标', isBoss: $('boss')?.checked !== false, charTypes: races, stats: { hp: 99999999, mp: 100, def: Number($('bossDefense')?.value) || 0, mnd: Number($('bossMind')?.value) || 0, str: 0, int: 0 }, elemResist: { 1: res[0] || 0, 2: res[1] || 0, 3: res[2] || 0, 4: res[3] || 0, 5: res[4] || 0, 6: res[5] || 0 } };
}

function stateFromSwitches(detail) {
  const sel = detail.selection || {};
  const hp = hpPercent ?? (sel.lowHp || $('lowHp')?.checked ? 25 : 100);
  const mp = mpPercent ?? (sel.mpLow || $('mpLow')?.checked ? 20 : 100);
  return { hpPercent: hp, mpPercent: mp, openingBuffActive: $('openingBuffActive') ? $('openingBuffActive').checked : true };
}

function activeSwitchGroups() {
  return Object.keys(SWITCH_LABELS).filter(id => id !== 'openingBuffActive' && $(id)?.checked);
}

async function run(force = false) {
  mount();
  if (!latest) { setState('等待计算器状态'); return; }
  if (running) { pending = true; return; }
  const move = latest.gameMove;
  if (!move?.id) { setState('先选择有游戏数据的招式'); $('engineResult').innerHTML = ''; return; }
  running = true;
  try {
    const dress = report?.units?.[0]?.unitId || Number(latest.unitDressId) || await siteDress();
    if (!dress) { setState('先导入读取报告或选择游戏角色'); running = false; return; }
    const M = await ensureEngine(dress);
    setState('结算中…');
    battle.reset();
    let attackerSpec;
    if (report && M.isBattleReport(report) && report.units?.[0]?.unitId === dress) attackerSpec = M.attackerFromReport(report, battle.master);
    else {
      // no report: the game character at the chosen growth (default max) with every own passive and its exclusive gear;
      // the out-of-battle panel comes from master data (scenario.mjs panelGiven:false), manual fields override it
      const c = await gameCharacter(dress);
      fillGrowthChoices(M, dress);
      const ids = latest.ownPassives?.length ? latest.ownPassives : c ? [...(c.personality || []).map(p => p.passive), ...(c.ownPassives || []).map(p => p.passive), ...(c.transcend || []).map(p => p.passive), ...(c.blessings || [])] : [];
      const override = {}; if (manualPanel.engineStr != null) override.str = manualPanel.engineStr; if (manualPanel.engineInt != null) override.int = manualPanel.engineInt;
      const equips = M.exclusiveEquipment(battle.master, dress);
      const passives = ids.map(id => ({ id }));
      if (growthChoice.accountBlessings) for (const [id, params] of ACCOUNT_BLESSINGS) if (!ids.includes(id) && battle.master.passive.has(id)) passives.push({ id, params });
      attackerSpec = { unitDressId: dress, name: c?.nameS, panelGiven: false, level: growthChoice.level, awake: growthChoice.awake, stats: override, passives, personality: c?.personality || [], equips, statsSource: `游戏数据计算（${equips.length ? equips.map(e => battle.master.itemEquip.get(e.id)?.NAME).join('、') + ' 满强化' : '无专属装备'}；被动按全部自带技能${growthChoice.accountBlessings ? '＋本账号加护' : ''}${Object.keys(override).length ? '；' + Object.keys(override).map(k => ({ str: '攻击力', int: '法强' }[k]) + '按手填').join('、') : ''}）` };
    }
    const attacker = M.addAttacker(battle, attackerSpec);
    const targetSpec = report && $('bossPreset')?.value?.startsWith('reader-') ? M.targetFromReport(report, { bossIndex: Number($('bossPreset').value.slice(7)) || 0 }) : targetFromFields(latest);
    const target = M.addTarget(battle, targetSpec);
    const state = stateFromSwitches(latest);
    // switches assume every conditional instance in their group
    const groups = new Set(activeSwitchGroups());
    const probe = M.runScenario({ battle, attacker, target, skill: { id: move.id }, state, assume: { probability: probabilityMode, instances: [...assumed] }, randoms: [0.95] });
    const autoAssume = probe.conditionals.filter(c => groups.has(c.switchGroup)).map(c => c.key);
    battle.reset();
    const attacker2 = M.addAttacker(battle, attackerSpec), target2 = M.addTarget(battle, targetSpec);
    const out = M.runScenario({ battle, attacker: attacker2, target: target2, skill: { id: move.id }, state, assume: { probability: probabilityMode, instances: [...new Set([...assumed, ...autoAssume])] } });
    render(out, { move, attackerSpec, targetSpec, state, autoAssume: new Set(autoAssume), attacker: attacker2, out });
    setState(`已结算 · ${new Date().toLocaleTimeString('zh-CN')}`);
  } catch (err) {
    setState('结算失败'); $('engineResult').innerHTML = `<p class="help">${esc(err.message)}</p>`; console.error(err);
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
  const issues = [...out.errors.map(e => `脚本 ${esc(e.name)} (${e.id})：${esc(e.error)}`), ...out.unsupported.map(n => `未实现的原生函数：${esc(n)}`)];
  $('engineResult').innerHTML = `
    <p class="help">招式 <b>${esc(ctx.move.name || ctx.move.id)}</b>（${ctx.move.id}）· 攻击方 ${esc(ctx.attackerSpec.name || ctx.attackerSpec.unitDressId)} · 面板来源：${esc(ctx.attackerSpec.statsSource || '读取报告')} · 目标 ${esc(ctx.targetSpec.name)} · HP ${ctx.state.hpPercent}% · MP ${ctx.state.mpPercent}%</p>
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
  return `<p class="help">局外面板（游戏数据 Lv${p.level}${p.estimated ? '·成长率估算' : ''} · 觉醒${p.awake} · 属性格 ${p.pieceCount}）：裸属性 ${parts} · CRT ${p.stats.crt}；装备 ${gear}；经状态计算被动后 HP ${fmt(pct('hp'))} · STR ${fmt(pct('str'))} · DEF ${fmt(pct('def'))} · INT ${fmt(pct('int'))} · MND ${fmt(pct('mnd'))} · CRT ${fmt(pct('crt'))}${compare ? `（网站旧规则面板：${compare}）` : ''}</p>`;
}

document.addEventListener('lc:calculator-update', e => { latest = e.detail || {}; if (latest.battle) report = latest.battle; mount();
  if ($('enginePanelStats')) { const hide = !!(report && report.units?.length); $('enginePanelStats').hidden = hide; $('engineAccountRow').hidden = hide; } if (battle || $('engineResult')?.innerHTML) run(); else setState(latest.gameMove?.id ? '点击“用游戏脚本结算”' : '先选择有游戏数据的招式'); });
$('entryReportFile')?.addEventListener('change', e => { const f = e.target.files?.[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); if (j && j.kind === 'last-cloudia-battle-entry') report = j; } catch {} }); });
mount();
