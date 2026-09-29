// Opens the damage calculator (damage-calculator.html?character=…&embedded=1) in the character page's panel;
// 已保存配装 opens it with one saved loadout (…&plan=<id>). The calculator works from the game data only, so the
// page no longer hands it a report of its own.
const panel = document.getElementById('damageSimulator');
const frame = document.getElementById('damageCalculatorFrame');
const open = document.getElementById('damageSimulatorOpen');
const close = document.getElementById('damageSimulatorClose');
const backdrop = document.getElementById('damageSimulatorBackdrop');
const characterId = document.body.dataset.characterId;
const url = plan => `./damage-calculator.html?character=${encodeURIComponent(characterId)}&embedded=1${plan ? `&plan=${encodeURIComponent(plan)}` : ''}&v=20260929-build`;
function show(plan = null) {
  panel.hidden = false; backdrop.hidden = false; open.setAttribute('aria-expanded', 'true');
  if (plan || !frame.getAttribute('src')) frame.src = url(plan);
  close.focus();
}
function hide() { panel.hidden = true; backdrop.hidden = true; open.setAttribute('aria-expanded', 'false'); open.focus(); }
open.addEventListener('click', () => show()); close.addEventListener('click', hide); backdrop.addEventListener('click', hide);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); hide(); } });
window.addEventListener('lc:open-damage-calculator', e => show(e.detail?.plan || null));
window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
  if (e.data?.type === 'lc-damage-close') hide();
});
