// 游戏脚本结算面板：在伤害计算器里用沙盒引擎（游戏自带 Lua 脚本 + 主数据）直接结算所选招式。
// 输入来自计算器已有的状态（`lc:calculator-update` 事件）：读取报告、所选招式、局内开关、Boss 栏位。
// 网页旧规则的结果保持不变，这里只是并列的对照。
import { K } from './engine/battle.mjs';

const $ = id => document.getElementById(id);
const fmt = n => n == null || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString('zh-CN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RACE_CODES = { 战士: 1001, 狙击手: 1002, 骑士: 1003, 魔法师: 1004, 治疗师: 1005, 兽: 2001, 植物: 2002, 昆虫: 2003, 鸟: 2004, 魔法生物: 2005, 不死生物: 2006, 石: 2007, 机械: 2008, 精灵: 2009, 龙: 2010, 神: 2011, 鱼: 2012 };
const SWITCH_LABELS = { conditionBuffActive: '条件BUFF', reviveBuffActive: '复活后', guardBuffActive: '自身格挡', selfStateActive: '自身状态', partyConditionActive: '队伍', openingBuffActive: '开局BUFF' };

let engineModules = null, battle = null, loadedDress = null, loading = null;
let latest = null, report = null, assumed = new Set(), probabilityMode = 'assume', hpPercent = null, mpPercent = null, running = false, pending = false;
const manualPanel = { engineStr: null, engineInt: null };
// Out-of-battle panel for the no-report path: the user's own numbers first, then the site's panel preview / 状态前面板.
function websitePanel() {
  const p = latest?.panels || {};
  const pick = (manual, key, fallback) => manual ?? (Number.isFinite(p[key]) ? p[key] : fallback);
  const base = Number.isFinite(latest?.attackBase) ? latest.attackBase : null;
  return { hp: Number.isFinite(p.hp) ? p.hp : 1, mp: Number.isFinite(p.mp) ? p.mp : 0, str: pick(manualPanel.engineStr, 'attack', latest?.referenceMode === 'str' ? base : null), def: Number.isFinite(p.defense) ? p.defense : 0, int: pick(manualPanel.engineInt, 'intelligence', latest?.referenceMode === 'int' ? base : null), mnd: Number.isFinite(p.mind) ? p.mind : 0, crt: Number($('baseCritRate')?.value) || 0 };
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
    <div class="fields two engine-fields" id="enginePanelStats"><label>局外面板 攻击力<input id="engineStr" type="number" min="0" step="1" placeholder="网站面板"></label><label>局外面板 法强<input id="engineInt" type="number" min="0" step="1" placeholder="网站面板"></label></div>
    <p class="help" id="enginePanelNote">未导入读取报告时，用这里的局外面板（不含局内 Buff）与全部自带技能结算；导入报告后自动改用报告里的入场面板与实际配置。</p>
    <div class="inline-options"><label><input id="engineProbability" type="checkbox" checked>概率效果按已触发计算</label><button type="button" id="engineRun" class="primary">用游戏脚本结算</button></div>
    <div id="engineResult"></div>`;
  const anchor = $('unifiedSummary') || aside.querySelector('.result-notes');
  if (anchor) aside.insertBefore(card, anchor); else aside.append(card);
  $('engineRun').addEventListener('click', () => run(true));
  $('engineProbability').addEventListener('change', e => { probabilityMode = e.target.checked ? 'assume' : 'skip'; run(); });
  $('engineHp').addEventListener('change', e => { hpPercent = e.target.value === '' ? null : Number(e.target.value); run(); });
  $('engineMp').addEventListener('change', e => { mpPercent = e.target.value === '' ? null : Number(e.target.value); run(); });
  for (const id of ['engineStr', 'engineInt']) $(id).addEventListener('change', () => { manualPanel[id] = $(id).value === '' ? null : Number($(id).value); run(); });
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
      // no report: the game character with the calculator's reference stat and every own passive (max loadout)
      const c = await gameCharacter(dress);
      const panel = websitePanel();
      const need = latest.referenceMode === 'str' ? 'str' : 'int';
      if (!Number.isFinite(panel[need]) || panel[need] == null) { setState(`请填写局外面板${need === 'str' ? '攻击力' : '法强'}（不含局内 Buff）`); running = false; return; }
      const ids = latest.ownPassives?.length ? latest.ownPassives : c ? [...(c.personality || []).map(p => p.passive), ...(c.ownPassives || []).map(p => p.passive), ...(c.transcend || []).map(p => p.passive), ...(c.blessings || [])] : [];
      attackerSpec = { unitDressId: dress, name: c?.nameS, stats: { str: panel.str ?? 0, int: panel.int ?? 0, def: panel.def, mnd: panel.mnd, hp: panel.hp, mp: panel.mp, crt: panel.crt }, passives: ids.map(id => ({ id })), personality: c?.personality || [], equips: [], statsSource: '局外面板（网站面板／手填）；被动按全部自带技能，装备未计（未导入报告）' };
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
    render(out, { move, attackerSpec, targetSpec, state, autoAssume: new Set(autoAssume) });
    setState(`已结算 · ${new Date().toLocaleTimeString('zh-CN')}`);
  } catch (err) {
    setState('结算失败'); $('engineResult').innerHTML = `<p class="help">${esc(err.message)}</p>`; console.error(err);
  } finally {
    running = false;
    if (pending) { pending = false; run(); }
  }
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
  const conditionals = out.conditionals.map(c => `<label class="engine-conditional"><input type="checkbox" data-assume="${esc(c.key)}" ${assumed.has(c.key) || ctx.autoAssume.has(c.key) ? 'checked' : ''}>${esc(c.passiveName)} · ${esc(c.processName)} <small>${esc(c.triggerLabel)}${c.condition ? ` · ${esc(c.condition)}` : ''} · ${esc(SWITCH_LABELS[c.switchGroup] || '条件BUFF')}</small></label>`).join('');
  const prob = out.probabilistic.map(p => `<li>${esc(p.passiveName)} · ${esc(p.processName)} <small>${p.prob}% · ${esc(p.triggerLabel)}</small></li>`).join('');
  const buffs = out.buffs.filter(b => b.remain !== 0).map(b => `<li>${esc(b.name)}${b.from ? ` <small>来自 ${esc(b.from)}</small>` : ''}${b.remain > 0 ? ` <small>${Math.round(b.remain / 60)} 秒</small>` : ''}</li>`).join('');
  const issues = [...out.errors.map(e => `脚本 ${esc(e.name)} (${e.id})：${esc(e.error)}`), ...out.unsupported.map(n => `未实现的原生函数：${esc(n)}`)];
  $('engineResult').innerHTML = `
    <p class="help">招式 <b>${esc(ctx.move.name || ctx.move.id)}</b>（${ctx.move.id}）· 攻击方 ${esc(ctx.attackerSpec.name || ctx.attackerSpec.unitDressId)} · 面板来源：${esc(ctx.attackerSpec.statsSource || '读取报告')} · 目标 ${esc(ctx.targetSpec.name)} · HP ${ctx.state.hpPercent}% · MP ${ctx.state.mpPercent}%</p>
    <p class="help">面板→局内：${statLine}</p>
    <div class="entry-table-wrap"><table class="entry-table engine-hits"><thead><tr><th>段</th><th>普通每段</th><th>暴击每段</th><th>期望（暴击率 ${Math.round(critRate * 100)}%）</th><th>每段上限</th><th>A / F</th><th>特攻</th></tr></thead><tbody>${hitRows || '<tr><td colspan="7">没有伤害段</td></tr>'}</tbody></table></div>
    <p class="help">每次命中（含双刀／多段魔法的追加击）期望 <b>${fmt(perCast)}</b>${hitCount ? `；按计算器填写的 ${hitCount} 段命中，整次期望 <b>${fmt(perCast * hitCount)}</b>` : '；段数取自计算器的“基础命中段数”'}。暴击率用局内 CRT 面板值。</p>
    ${first ? `<details class="engine-chain"><summary>第1击结算链（随机 0.95）：核心 ${fmt(first.core)} → 修正后 ${fmt(first.afterPassives)}${first.edits.length ? `（${first.edits.length} 项）` : ''}</summary><p class="help">系数 ${first.coefficient} · 属性 ${['无', '火', '冰', '树', '雷', '光', '暗'][first.element] || first.element}（抗性 ${first.resist}）· 核心前倍率 攻 ×${first.offense.toFixed(3)} 受 ×${first.received.toFixed(3)} 减伤 ×${first.reduction.toFixed(3)} · 上限 9,999 + ${fmt(first.capVal)}${first.capPer ? ` ×(1+${first.capPer / 100}%)` : ''}${first.capAdd ? ` + ${fmt(first.capAdd)}` : ''}</p><ol class="engine-edits">${chain}</ol></details>` : ''}
    <details class="engine-buffs"><summary>局内 Buff（${out.buffs.length}）</summary><ul>${buffs || '<li>无</li>'}</ul></details>
    ${conditionals ? `<details class="engine-conditionals" open><summary>可假定触发的条件效果（${out.conditionals.length}）</summary><p class="help">勾选后按已触发计算；对应局内开关打开时同组自动勾选。</p>${conditionals}</details>` : ''}
    ${prob ? `<details class="engine-prob"><summary>概率效果（${out.probabilistic.length}，${probabilityMode === 'assume' ? '按已触发计算' : '按未触发计算'}）</summary><ul>${prob}</ul></details>` : ''}
    ${issues.length ? `<details class="engine-issues" open><summary>未能完整模拟（${issues.length}）</summary><ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul></details>` : ''}`;
}

document.addEventListener('lc:calculator-update', e => { latest = e.detail || {}; if (latest.battle) report = latest.battle; mount();
  const p = websitePanel(); if ($('engineStr') && manualPanel.engineStr == null) $('engineStr').placeholder = Number.isFinite(p.str) && p.str != null ? `网站面板 ${p.str}` : '请填写'; if ($('engineInt') && manualPanel.engineInt == null) $('engineInt').placeholder = Number.isFinite(p.int) && p.int != null ? `网站面板 ${p.int}` : '请填写';
  if ($('enginePanelStats')) $('enginePanelStats').hidden = !!(report && report.units?.length); if (battle || $('engineResult')?.innerHTML) run(); else setState(latest.gameMove?.id ? '点击“用游戏脚本结算”' : '先选择有游戏数据的招式'); });
$('entryReportFile')?.addEventListener('change', e => { const f = e.target.files?.[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); if (j && j.kind === 'last-cloudia-battle-entry') report = j; } catch {} }); });
mount();
