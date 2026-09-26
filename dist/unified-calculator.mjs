import {prepareLoadoutPreview,loadoutSources,exclusiveWeaponSourceIds} from './loadout-preview.mjs?v=20260926-exclusive-weapon';
import {recommendDamage,DEFAULT_SC_RATES,damageGauge} from './damage-recommendations.mjs?v=20260924-fullpage';
import {LEARNING_STORAGE_KEY} from './effect-rule-learning.mjs?v=20260926-common-skills';
import {formatEffect} from './effect-rule-engine.mjs?v=20260926-common-skills';
import {retargetReport} from './entry-preparation.mjs?v=20260926-loadout-sources';
import {buildDamageImport} from './damage-import.mjs?v=20260926-loadout-sources';
import {loadoutFrameUrl} from './calculator-navigation.mjs?v=20260924-condition-tags';
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const saved=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
export function renderDamageGauges(result,input){
 for(const [name,branch] of [['normal',result.normal],['critical',result.critical]]){
  const gauge=damageGauge(branch,input.hitScaleStage==='afterCap'?input.hitDamageRatio:1),track=$(`${name}Gauge`);
  $(`${name}GaugeDamage`).textContent=`${fmt(gauge.min)}–${fmt(gauge.max)}`;$(`${name}GaugeCap`).textContent=fmt(gauge.cap);
  track.firstElementChild.style.width=`${gauge.fill}%`;track.setAttribute('aria-valuenow',String(Math.round(branch.mean)));track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(gauge.cap));track.setAttribute('aria-valuetext',`每段 ${fmt(gauge.min)} 至 ${fmt(gauge.max)}，上限 ${fmt(gauge.cap)}`);
 }
}
export function mountUnifiedCalculator({getContext,onChange,beforeOpen,onWeaponChange}){
 const frame=$('unifiedLoadoutFrame');let active=false,ready=false,snapshot=null,sourceKey='',showSettings=false,resultsCollapsed=false,anchor=[],criticalAnchor=null,rates=saved('lc-recommendation-sc-rates:v1',DEFAULT_SC_RATES),pendingWeapon=null;
 const send=(type,extra={})=>{if(ready)frame.contentWindow.postMessage({type,...extra},location.origin);};
 const weaponIds=()=>{const report=getContext().baseReport;return report?exclusiveWeaponSourceIds(loadoutSources(report)):[];};
 function setExclusiveWeapon(enabled){
  const sourceIds=weaponIds();if(!sourceIds.length)return;
  pendingWeapon=enabled===true;
  if(ready){send('lc-loadout-set-equipment',{sourceIds,enabled:pendingWeapon});pendingWeapon=null;}
 }
 function layout(){
  document.body.classList.toggle('unified-mode',active);document.body.classList.toggle('unified-settings',active&&showSettings);
  document.body.classList.toggle('unified-results-collapsed',active&&resultsCollapsed);
  $('unifiedWorkspace').hidden=!active;$('unifiedStart').hidden=active;$('unifiedSummary').hidden=!active;
  $('unifiedSettings').textContent=showSettings?'返回技能配装':'战斗设置';
 }
 function initialize(){const {baseReport,characterId,manualEffects}=getContext();if(baseReport){const sources=loadoutSources(baseReport,manualEffects);sourceKey=JSON.stringify(sources);send('lc-loadout-init',{characterId:baseReport.characterId,sources});}else if(!characterId)send('lc-loadout-get-state');}
 function captureCritical(context){
  return Number.isFinite(context.criticalObservation)&&context.baseReport?{rate:context.criticalObservation,contribution:buildDamageImport(retargetReport(context.baseReport,context.selection)).critAdded}:null;
 }
 function open(){
  if(beforeOpen?.()===false)return;
  const context=getContext();anchor=context.runtimeAnchor||[];criticalAnchor=captureCritical(context);active=true;layout();
  if(!frame.src)frame.src=loadoutFrameUrl(location.href);else initialize();
  onChange();
 }
 $('unifiedStart').addEventListener('click',open);
 $('unifiedExit').addEventListener('click',()=>{active=false;layout();$('unifiedUnresolved').hidden=true;onChange();});
 $('unifiedSettings').addEventListener('click',()=>{showSettings=!showSettings;layout();});
 $('unifiedResultToggle')?.addEventListener('click',()=>{resultsCollapsed=!resultsCollapsed;$('unifiedResultToggle').textContent=resultsCollapsed?'显示结果':'收起结果';$('unifiedResultToggle').setAttribute('aria-expanded',String(!resultsCollapsed));layout();});
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
  if(e.data?.type==='lc-loadout-ready'){
   ready=true;initialize();
   if(pendingWeapon!==null)setExclusiveWeapon(pendingWeapon);
   const url=new URL(location.href);url.searchParams.delete('editPlan');url.searchParams.delete('draft');globalThis.history?.replaceState(null,'',url.href);
  }
  if(e.data?.type==='lc-loadout-change'){
   const next=e.data.snapshot,context=getContext();
   if(!next||!Array.isArray(next.items))return;
   if(String(next.characterId)!==String(context.characterId||'')){
    const url=new URL(location.href);if(next.characterId)url.searchParams.set('character',next.characterId);else url.searchParams.delete('character');url.searchParams.set('unified','1');for(const key of ['embedded','session','editPlan','draft'])url.searchParams.delete(key);location.assign(url.href);return;
   }
   snapshot=next;
   const ids=weaponIds();if(ids.length&&pendingWeapon===null)onWeaponChange?.(next.items.some(item=>item.sourceIds?.some(id=>ids.includes(id))));
   onChange();
  }
  if(e.data?.type==='lc-loadout-rates'){
   const next=e.data.rates;if(!Object.keys(DEFAULT_SC_RATES).every(k=>Number.isFinite(next?.[k])&&next[k]>0&&next[k]<=1000))return;
   rates=next;try{localStorage.setItem('lc-recommendation-sc-rates:v1',JSON.stringify(rates));}catch{}onChange();
  }
 });
 function prepare(input){
  const context=getContext();
  if(!snapshot)throw new Error('正在载入配装；请在配装区选择角色。');
  if(!context.baseReport)throw new Error('请在配装区选择角色，以加载基础属性。');
  if(ready&&sourceKey!==JSON.stringify(loadoutSources(context.baseReport,context.manualEffects)))initialize();
  if(!criticalAnchor)criticalAnchor=captureCritical(context);
  const preview=prepareLoadoutPreview({...context,input,snapshot,templates:saved(LEARNING_STORAGE_KEY,{}),runtimeAnchor:anchor,criticalAnchor});
  $('unifiedStats').innerHTML=Object.values(preview.panel.stats).map(stat=>`<div><span>${esc(stat.label)}</span><strong>${preview.panel.values[stat.key]==null?'待补全':fmt(preview.panel.values[stat.key])}</strong><small>属性 +${fmt(stat.percent)}%</small></div>`).join('');
  const groups=new Map();
  for(const row of preview.report.rows)for(const effect of row.rule.effects)if(['damage','cap','critRate'].includes(effect.type)&&typeof effect.value==='number'){
   const key=`${effect.type}:${effect.target}:${effect.unit}:${effect.criticalOnly}`;
   const entry=groups.get(key)||{...effect,value:0};entry.value+=effect.value;groups.set(key,entry);
  }
  $('unifiedBonuses').innerHTML=[...groups.values()].map(effect=>`<span>${esc(formatEffect(effect))}</span>`).join('');
  $('unifiedStatus').textContent=`${snapshot.items.length} 个配装来源 · ${snapshot.totalSc} SC${context.baseReport.reviewedByUser?' · 沿用已核对数值':''}${criticalAnchor?'；暴击率按所选来源增减':''}`;
  showUnresolved(preview.unresolved);
  const recommendations=recommendDamage({input:preview.input,criticalEnabled:context.selection.criticalEnabled,magicCanCrit:context.selection.criticalEnabled||preview.imported.magicCanCrit,statReference:context.selection.statReference,projectStatPercent:preview.projectStatPercent,rates});
  send('lc-loadout-recommendations',{payload:{...recommendations,rates,contextKey:JSON.stringify([snapshot,context.selection,preview.input,rates])}});
  return preview;
 }
 function showUnresolved(items){
  $('unifiedUnresolved').hidden=!active||!items.length;$('unifiedUnresolvedCount').textContent=`(${items.length})`;
  $('unifiedUnresolvedList').innerHTML=items.map(x=>`<li><b>${esc(x.name)}</b><p>${esc(x.reason)}</p>${x.text?`<details><summary>技能原文</summary><p>${esc(x.text)}</p></details>`:''}</li>`).join('');
 }
 function error(message){if(active)send('lc-loadout-recommendations',{payload:{error:message,rates,contextKey:'incomplete'}});}
 return {get active(){return active;},get hasLoadout(){return !!snapshot;},open,prepare,error,refreshSources:initialize,setExclusiveWeapon};
}
