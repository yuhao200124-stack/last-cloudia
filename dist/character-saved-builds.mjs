// 已保存配装 on a character page: the loadouts saved in the damage calculator's 配装 (localStorage
// lc-engine-plans:v1, per character, this browser) with the skills each one picked; 打开配装 opens the 配装 on the
// home page's skill table (index.html?character=…&plan=…) with that loadout. (The old skill-table loadouts are no longer listed — the user's decision.)
// SC as in the calculator (build-sc.mjs): 能力盘突破 free one skill each; every SC skill on the character's own
// ability board is always there at 0 SC (user 2026-09-29, as the old skill table did).
import { breakName, cleanBreaks, scTotal } from './build-sc.mjs?v=20261005-1959';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const characterId = document.body.dataset.characterId;
const PLANS_KEY = 'lc-engine-plans:v1';
const FREE_COST = 99;
// data files follow this module's own version (?v=…, scripts/set-version.mjs), so a cached old file never meets new code
const V = new URL(import.meta.url).search;
const json = path => fetch(new URL(path + V, import.meta.url)).then(r => r.json());
let ownSkills = null;
// the SC skills on the character's own ability board (0 SC in every loadout)
async function ownBoard(index) {
  if (!ownSkills) ownSkills = json('./game-data/index.json').then(async site => {
    const dress = site.site?.[characterId]; if (!dress) return [];
    const c = await json(`./game-data/c/${dress}.json`);
    return (c.ownPassives || []).map(p => p.passive).filter(id => { const cost = index.get(id)?.cost; return cost > 0 && cost < FREE_COST; }).sort((a, b) => index.get(b).cost - index.get(a).cost);
  }).catch(() => []);
  return ownSkills;
}
function plans() {
  try { const list = JSON.parse(localStorage.getItem(PLANS_KEY) || '[]'); return Array.isArray(list) ? list.filter(p => String(p.siteId) === String(characterId)).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) : []; } catch { return []; }
}
let passiveIndex = null;
async function passives() {
  if (!passiveIndex) passiveIndex = fetch(new URL('./game-data/engine/passive-index.json' + V, import.meta.url)).then(r => r.json()).then(t => new Map(t.rows.map(r => [r[0], { name: r[1], nameS: r[2], cost: r[3] }]))).catch(() => new Map());
  return passiveIndex;
}
const viewer = $('savedBuildViewer'), overlay = $('bonusCalculatorOverlay'), opener = $('savedBuildViewerOpen');
async function render() {
  const list = plans(), select = $('savedBuildSelect');
  const current = select.value;
  select.innerHTML = list.length ? list.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('') : '<option value="">还没有保存的配装</option>';
  if (list.some(p => p.id === current)) select.value = current;
  const plan = list.find(p => p.id === select.value);
  $('savedBuildOpen').disabled = !plan;
  if (!plan) { $('savedBuildSkills').innerHTML = '<p class="saved-build-empty">在伤害计算器里点“配装”，在首页技能表点“+”选好技能后，在右边的配装面板点“保存配装”，就会列在这里。</p>'; $('savedBuildTotal').textContent = '0 SC'; return; }
  const index = await passives(), auto = await ownBoard(index), autoSet = new Set(auto);
  const info = id => index.get(id) || { nameS: `编号 ${id}`, cost: null };
  const sc = scTotal((plan.build?.selected || []).filter(id => !autoSet.has(id)).map(id => ({ id, sc: info(id).cost })), cleanBreaks(plan.build?.breaks));
  const name = r => `<span class="saved-build-skill-name">${esc(r.nameS)}${r.name && r.name !== r.nameS ? ` <small>${esc(r.name)}</small>` : ''}</span>`;
  const picked = [...sc.items].sort((a, b) => b.sc - a.sc).map(i => `<div class="saved-build-skill saved-build-row">${name(info(i.id))}<span class="saved-build-skill-sc">${i.freeBy ? `0 SC <small>${breakName(i.freeBy)}（原 ${i.sc}）</small>` : i.sc ? `${i.sc} SC` : '—'}</span></div>`);
  const own = auto.map(id => `<div class="saved-build-skill saved-build-row">${name(info(id))}<span class="saved-build-skill-sc">0 SC <small>能力盘自带（原 ${info(id).cost}）</small></span></div>`);
  $('savedBuildSkills').innerHTML = `<p class="saved-build-note">${esc(String(plan.updatedAt || '').slice(0, 10))} 保存 · ${sc.items.length} 个技能</p>` +
    (sc.items.length ? picked.join('') : '<p class="saved-build-empty">这套配装没有选技能。</p>') + own.join('');
  $('savedBuildTotal').textContent = `${sc.total} SC`;
}
function show() { viewer.hidden = false; overlay.hidden = false; opener?.setAttribute('aria-expanded', 'true'); render(); $('savedBuildViewerClose').focus(); }
function hide() { viewer.hidden = true; overlay.hidden = true; opener?.setAttribute('aria-expanded', 'false'); opener?.focus(); }
if (viewer && opener) {
  opener.addEventListener('click', show);
  $('savedBuildViewerClose').addEventListener('click', hide);
  overlay?.addEventListener('click', () => { if (!viewer.hidden) hide(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !viewer.hidden) { e.preventDefault(); hide(); } });
  $('savedBuildSelect').addEventListener('change', render);
  $('savedBuildOpen').addEventListener('click', () => { const id = $('savedBuildSelect').value; if (!id) return; location.href = `./index.html?character=${encodeURIComponent(characterId)}&plan=${encodeURIComponent(id)}`; });
  window.addEventListener('storage', e => { if (e.key === PLANS_KEY && !viewer.hidden) render(); });
}
