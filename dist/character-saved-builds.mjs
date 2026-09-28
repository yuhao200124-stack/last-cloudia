// 已保存配装 on a character page: the loadouts saved in the damage calculator's 配装 (localStorage
// lc-engine-plans:v1, per character, this browser) with the common skills each one picked; 在计算器中打开 starts
// the calculator with that loadout. (The old skill-table loadouts are no longer listed — the user's decision.)
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const characterId = document.body.dataset.characterId;
const PLANS_KEY = 'lc-engine-plans:v1';
const FREE_COST = 99;
function plans() {
  try { const list = JSON.parse(localStorage.getItem(PLANS_KEY) || '[]'); return Array.isArray(list) ? list.filter(p => String(p.siteId) === String(characterId)).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) : []; } catch { return []; }
}
let passiveIndex = null;
async function passives() {
  if (!passiveIndex) passiveIndex = fetch(new URL('./game-data/engine/passive-index.json', import.meta.url)).then(r => r.json()).then(t => new Map(t.rows.map(r => [r[0], { name: r[1], nameS: r[2], cost: r[3] }]))).catch(() => new Map());
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
  if (!plan) { $('savedBuildSkills').innerHTML = '<p class="saved-build-empty">在伤害计算器里打开“配装”，选好通用技能后点“保存配装”，就会列在这里。</p>'; $('savedBuildTotal').textContent = '0 SC'; return; }
  const index = await passives();
  const rows = (plan.build?.selected || []).map(id => ({ id, ...(index.get(id) || { nameS: `编号 ${id}`, cost: null }) }));
  const sc = rows.reduce((sum, r) => sum + (r.cost && r.cost < FREE_COST ? r.cost : 0), 0);
  $('savedBuildSkills').innerHTML = `<p class="saved-build-note">${esc(String(plan.updatedAt || '').slice(0, 10))} 保存 · ${rows.length} 个通用技能${plan.build?.exclusive === false ? ' · 无专武' : ''}</p>` +
    (rows.length ? rows.map(r => `<div class="saved-build-skill saved-build-row"><span class="saved-build-skill-name">${esc(r.nameS)}${r.name && r.name !== r.nameS ? ` <small>${esc(r.name)}</small>` : ''}</span><span class="saved-build-skill-sc">${r.cost != null && r.cost < FREE_COST ? `${r.cost} SC` : '—'}</span></div>`).join('') : '<p class="saved-build-empty">这套配装没有选通用技能。</p>');
  $('savedBuildTotal').textContent = `${sc} SC`;
}
function show() { viewer.hidden = false; overlay.hidden = false; opener?.setAttribute('aria-expanded', 'true'); render(); $('savedBuildViewerClose').focus(); }
function hide() { viewer.hidden = true; overlay.hidden = true; opener?.setAttribute('aria-expanded', 'false'); opener?.focus(); }
if (viewer && opener) {
  opener.addEventListener('click', show);
  $('savedBuildViewerClose').addEventListener('click', hide);
  overlay?.addEventListener('click', () => { if (!viewer.hidden) hide(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !viewer.hidden) { e.preventDefault(); hide(); } });
  $('savedBuildSelect').addEventListener('change', render);
  $('savedBuildOpen').addEventListener('click', () => { const id = $('savedBuildSelect').value; if (!id) return; hide(); window.dispatchEvent(new CustomEvent('lc:open-damage-calculator', { detail: { plan: id } })); });
  window.addEventListener('storage', e => { if (e.key === PLANS_KEY && !viewer.hidden) render(); });
}
