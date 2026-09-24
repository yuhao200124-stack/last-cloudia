import {reportStorageKey} from './damage-import.mjs?v=20260924-reader-choice';
import {readCharacterProfile} from './entry-preparation.mjs?v=20260924-reader-choice';
const panel=document.getElementById('damageSimulator');
const frame=document.getElementById('damageCalculatorFrame');
const open=document.getElementById('damageSimulatorOpen');
const close=document.getElementById('damageSimulatorClose');
const backdrop=document.getElementById('damageSimulatorBackdrop');
const characterId=document.body.dataset.characterId;
let ready=false;
let lastStored='';
function publish() {
  const base=window.LC_EFFECT_CALCULATOR?.getReport();
  const report=base?{...base,profile:readCharacterProfile(document)}:null;
  if(!report || String(report.characterId)!==characterId) return;
  const fingerprint=JSON.stringify({...report,createdAt:''});
  if(fingerprint!==lastStored) {
    try {localStorage.setItem(reportStorageKey(characterId),JSON.stringify(report));lastStored=fingerprint;} catch {}
  }
  if(ready) frame.contentWindow.postMessage({type:'lc-damage-report',report},location.origin);
}
function show() {
  publish();panel.hidden=false;backdrop.hidden=false;open.setAttribute('aria-expanded','true');
  if(!frame.getAttribute('src'))frame.src=`./damage-calculator.html?character=${encodeURIComponent(characterId)}&embedded=1&v=20260924-reader-choice`;
  close.focus();
}
function hide() {panel.hidden=true;backdrop.hidden=true;open.setAttribute('aria-expanded','false');open.focus();}
open.addEventListener('click',show);close.addEventListener('click',hide);backdrop.addEventListener('click',hide);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();hide();}});
window.addEventListener('lc:effect-rules-change',publish);
window.addEventListener('message',e=>{
  if(e.origin!==location.origin || e.source!==frame.contentWindow)return;
  if(e.data?.type==='lc-damage-ready' || e.data?.type==='lc-damage-request'){ready=true;publish();}
  if(e.data?.type==='lc-damage-close')hide();
  if(e.data?.type==='lc-damage-edit-base'){hide();document.getElementById('bonusCalculatorOpen').click();}
});
publish();
