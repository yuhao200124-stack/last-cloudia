// Opens the damage calculator (damage-calculator.html?character=…&embedded=1) in the character page's panel;
// (已保存配装 opens the 配装 on the home page's skill table instead.) The calculator works from the game data only, so the
// page no longer hands it a report of its own.
const panel = document.getElementById('damageSimulator');
const frame = document.getElementById('damageCalculatorFrame');
const open = document.getElementById('damageSimulatorOpen');
const close = document.getElementById('damageSimulatorClose');
const backdrop = document.getElementById('damageSimulatorBackdrop');
const characterId = document.body.dataset.characterId;
const url = () => `./damage-calculator.html?character=${encodeURIComponent(characterId)}&embedded=1&v=20260930-1214`;
function show() {
  panel.hidden = false; backdrop.hidden = false; open.setAttribute('aria-expanded', 'true');
  if (!frame.getAttribute('src')) frame.src = url();
  close.focus();
}
function hide() { panel.hidden = true; backdrop.hidden = true; open.setAttribute('aria-expanded', 'false'); open.focus(); }
open.addEventListener('click', () => show()); close.addEventListener('click', hide); backdrop.addEventListener('click', hide);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); hide(); } });
window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
  if (e.data?.type === 'lc-damage-close') hide();
});
