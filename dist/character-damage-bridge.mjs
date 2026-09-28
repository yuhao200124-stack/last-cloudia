import {characterReportFromDocument} from './character-report-loader.mjs?v=20260928-game-names';
import {reportStorageKey} from './damage-import.mjs?v=20260926-mayly';
import {readCharacterProfile} from './entry-preparation.mjs?v=20260928-game-names';
import {unifiedPageUrl} from './calculator-navigation.mjs?v=20260926-mayly';
const panel=document.getElementById('damageSimulator');
const frame=document.getElementById('damageCalculatorFrame');
const open=document.getElementById('damageSimulatorOpen');
const close=document.getElementById('damageSimulatorClose');
const backdrop=document.getElementById('damageSimulatorBackdrop');
const characterId=document.body.dataset.characterId;
let ready=false;
let lastStored='';
function publish() {
  const calc=window.LC_EFFECT_CALCULATOR;
  const base=(calc?.getIndependentReport?.()||calc?.getReport())||characterReportFromDocument(document);
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
  if(!frame.getAttribute('src'))frame.src=`./damage-calculator.html?character=${encodeURIComponent(characterId)}&embedded=1&v=20260926-character-template`;
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
  if(e.data?.type==='lc-damage-fullpage'&&/^[a-z0-9-]{1,80}$/.test(e.data.session||'')){
    publish();location.assign(unifiedPageUrl(location.href,characterId,{session:e.data.session}));
  }
});
publish();
