import {defaultInput,calculate,context,applies,RACES,ELEMENTS,EFFECTS} from './damage-engine.mjs';
import {buildDamageImport,reportStorageKey} from './damage-import.mjs';
import {formatEffect} from './effect-rule-engine.mjs';
import {initEntryWorkflow} from './entry-workflow.mjs';
import {BOSS_ELEMENTS,readBossRecord} from './battle-entry-data.mjs';
import {observedCritical} from './reader-bonus-decoder.mjs';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(values,current)=>values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('');
const stages={post:'结算后逐条修正（常见增伤）',offense:'核心前：攻击侧增伤',received:'核心前：目标受伤修正',reduction:'核心前：原生物理 / 魔法减伤'};
const bosses={bird:{def:4000,mnd:10000,debuff:2599,res:[25,-25,50,50,-25,25]},beast:{def:5500,mnd:8000,debuff:3574,res:[25,50,25,-25,50,-25]}};
let effects=[],nextId=0,timer;
const params=new URLSearchParams(location.search);
const characterId=params.get('character');
const embedded=params.get('embedded')==='1' && window.parent!==window;
let imported=null,latestReport=null,workflow=null,readUnit=null,bossRaces=[],reviewBlocker='请导入读取报告并选择采用的数据。',lastHitKey='';
let manualCriticalBase='';
let retainedImportDraft=null;
document.body.classList.toggle('is-embedded',embedded);
const newEffect=(kind='all')=>({id:++nextId,kind,percent:0,enabled:true,target:'无',stage:'post',name:''});
const numericKeys=Object.keys(defaultInput()).filter(k=>typeof defaultInput()[k]==='number');
const booleanKeys=Object.keys(defaultInput()).filter(k=>typeof defaultInput()[k]==='boolean');
$('element').innerHTML=options(ELEMENTS,'无');
$('bossResistances').innerHTML=Object.entries(BOSS_ELEMENTS).map(([key,label])=>`<label>${label}抗性 %<input data-boss-resistance="${key}" type="number" min="-999" max="1000" step="any"></label>`).join('');
function showReview(open) {
  $('reviewPage').hidden=!open;$('calculationPage').hidden=open;
  if(open){$('reviewTitle').tabIndex=-1;$('reviewTitle').focus();}
  else $('openReview').focus();
}
$('openReview').addEventListener('click',()=>showReview(true));
$('closeReview').addEventListener('click',()=>{workflow?.applySelection();showReview(false);});
$('resolveReview').addEventListener('click',()=>showReview(true));
function fillReaderPreview() {
  if(workflow?.isConfirmed())return;
  const mode=referenceMode(),key=mode==='int'?'intelligence':mode==='str'?'attack':null;
  $('attack').value=key?workflow?.panelsPreview()?.[key]??'':$('attack').value;
  const crit=observedCritical(readUnit).value;
  $('critRate').value=typeof crit==='number'&&Number.isFinite(crit)?crit:'';
}
function syncHitControls(force=false){
  const s=workflow?.selection();if(!s)return;
  const key=JSON.stringify([s.attack,s.preset,s.dualWield]);
  if(!force&&key===lastHitKey)return;lastHitKey=key;
  for(const id of ['hitMultiplier','hitDamageRatio']){
    $(id).disabled=!s.dualWield;
    $(id).value=!s.dualWield?1:s[id]!=null&&s[id]!==''?s[id]:imported?.hitSources.length?imported[id]:'';
  }
  $('hitScaleStage').value=s.dualWield?s.hitScaleStage||'':'';
  if(s.dualWield||Number($('hitDamageRatio').value)!==1)$('hitDetails').open=true;
}
function hitSourceNote(){
  const s=workflow?.selection(),manual=s?.dualWield&&['hitMultiplier','hitDamageRatio'].some(k=>s[k]!=null&&s[k]!=='');
  const values=`命中 ×${$('hitMultiplier').value||'待填'}，单段 ×${$('hitDamageRatio').value||'待填'}`;
  $('hitSourceNote').textContent=!s?.dualWield?'本次未启用双刀／魔法双段，命中 ×1、单段 ×1；此项不改变配装。':
    manual?`手动填写：${values}。重新应用核对结果会保留你的数值；清空某个倍率可恢复自动值。`:
    imported?.hitSources.length?`来源：${{reader:'读取器技能配置',manual:'手动核对',website:'网站技能效果'}[imported.hitSourceKind]} · ${imported.hitSources.join('、')}；${values}。已自动填写，只执行这一份分段修正，未代表本次实际命中观测。`:
    '已启用双刀／魔法双段，当前没有已核对的分段倍率。请先在核对页采用读取器或网站的分段效果；未读到的倍率需手动填写。';
  $('hitScaleControl').hidden=$('hitDamageRatio').value!==''&&$('hitDamageRatio').valueAsNumber===1;
}
function receiveEntryData({battle,unit}) {
  readUnit=unit;
  const old=$('bossPreset').value;
  $('bossPreset').querySelectorAll('[data-reader-boss]').forEach(el=>el.remove());
  for(const key of Object.keys(bosses))if(key.startsWith('reader-'))delete bosses[key];
  (battle.bosses||[]).forEach((record,index)=>{
    const key=`reader-${index}`,boss=readBossRecord(record);bosses[key]=boss;
    const option=document.createElement('option');option.value=key;option.dataset.readerBoss='';option.textContent=`读取：${boss.name}`;$('bossPreset').append(option);
  });
  $('bossPreset').value=bosses[old]&&old.startsWith('reader-')?old:battle.bosses?.length?'reader-0':'custom';
  applyBoss();fillReaderPreview();update();
}
function readEffects() {
  return [...document.querySelectorAll('.effect')].map(row=>({...effects.find(e=>e.id===Number(row.dataset.id)),id:Number(row.dataset.id),
    kind:row.querySelector('[data-field=kind]').value,
    percent:row.querySelector('[data-field=percent]').valueAsNumber,
    enabled:row.querySelector('[data-field=enabled]').checked,
    target:row.querySelector('[data-field=target]').value,
    stage:row.querySelector('[data-field=stage]').value,
    name:row.querySelector('[data-field=name]').value.trim()}));
}
function read() {
  const s=defaultInput();
  for(const k of numericKeys) if($(k))s[k]=$(k).valueAsNumber;
  for(const k of booleanKeys) if($(k))s[k]=$(k).checked;
  for(const k of ['type','skillType','element','hitScaleStage']) s[k]=$(k).value;
  s.races=bossRaces;s.killerRaces=[];s.specialAttack=$('specialAttack').checked;s.killerCorrection=imported?.killerCorrection??0;
  s.effects=readEffects();return s;
}
function renderEffects() {
  $('effects').innerHTML=effects.map((e,i)=>{
    const targets=e.kind==='element'?ELEMENTS:e.kind==='race'?RACES:['无需选择'];
    const target=targets.includes(e.target)?e.target:targets[0];
    return `<div class="effect" data-id="${e.id}"><div class="effect-head"><label><input type="checkbox" data-field="enabled" ${e.enabled?'checked':''} aria-label="启用第 ${i+1} 条加成"><span class="order">加成 ${String(i+1).padStart(2,'0')}</span></label><button type="button" data-action="up" aria-label="上移第 ${i+1} 条加成" ${i===0?'disabled':''}>↑</button><button type="button" data-action="down" aria-label="下移第 ${i+1} 条加成" ${i===effects.length-1?'disabled':''}>↓</button><button type="button" data-action="remove" aria-label="删除第 ${i+1} 条加成">删除</button></div>
      ${e.importId?`<p class="import-source">${esc(e.name)}</p>`:''}<div class="effect-fields"><label>加成类型<select data-field="kind">${Object.entries(EFFECTS).map(([k,v])=>`<option value="${k}" ${k===e.kind?'selected':''}>${v}</option>`).join('')}</select></label><label>数值 %<input data-field="percent" type="number" min="-100" max="10000" step="any" value="${e.percent}" required></label><label>限定对象<select data-field="target" ${targets.length===1?'disabled':''}>${options(targets,target)}</select></label></div>
      <p class="effect-state"></p><details><summary>更多：来源与结算方式</summary><div class="fields two"><label>来源名称（选填）<input data-field="name" maxlength="60" value="${esc(e.name)}" placeholder="装备、技能或个性名称"></label><label>结算方式<select data-field="stage">${Object.entries(stages).map(([k,v])=>`<option value="${k}" ${k===e.stage?'selected':''}>${v}</option>`).join('')}</select></label></div><p class="help">结算后减伤填负数；原生核心前减伤填正数。类型条件以本页选项筛选，其他条件用本条勾选框确认。</p></details></div>`;
  }).join('');
}
function referenceMode() {return workflow?.selection().statReference||imported?.statReference||(!characterId&&$('type').value==='magical'?'int':'str');}
function syncBossReference() {
  const mode=referenceMode(),keys=Object.keys(BOSS_ELEMENTS),index=Object.values(BOSS_ELEMENTS).indexOf($('element').value);
  if(mode!=='mixed')$('defense').value=$(mode==='int'?'bossMind':'bossDefense').value;
  $('resistance').value=$('element').value==='无'?0:index<0?'':document.querySelector(`[data-boss-resistance="${keys[index]}"]`).value;
}
function labels() {
  const mode=referenceMode(),magic=mode==='int';
  $('attackLabel').textContent=mode==='mixed'?'已确认的混合结算攻击值':magic?'当前战斗法强':'当前战斗攻击力';
  $('mixedReferenceNote').hidden=mode!=='mixed';$('mixedDefenseControl').hidden=mode!=='mixed';
  $('defenseLabel').textContent=mode==='mixed'?'混合结算防御值':magic?'当前魔抗 MND':'当前防御力 DEF';
  const neutral=$('element').value==='无';$('resistance').disabled=neutral;
  syncBossReference();
  $('bossReference').textContent=`本次参照：${mode==='mixed'?'手填混合防御值':magic?'魔抗 MND':'防御力 DEF'}；${neutral?'无属性不使用六属性抗性':`使用${$('element').value||'所选'}抗性`}。`;
  const p=bosses[$('bossPreset').value];$('debuff').hidden=!p?.debuff||magic||mode==='mixed';
  if(p?.debuff)$('debuff').textContent=`填入实测降防值 ${p.debuff}`;
  $('conditionStatus').textContent=$('dualWield').checked?'已启用双刀／魔法双段，只按下方一组命中及单段倍率计算；配装与面板保持原设置。':'特攻与 Break 按本次选择计算；装备条件沿用基础计算器。';
  hitSourceNote();
}
function applyBoss() {
  const p=bosses[$('bossPreset').value];
  $('bossDefense').value=p?.def??'';$('bossMind').value=p?.mnd??'';
  document.querySelectorAll('[data-boss-resistance]').forEach((el,i)=>el.value=p?.res?.[i]??'');
  bossRaces=p?.races||[];$('bossIdentity').textContent=`种族：${p?.raceLabel||'未读取'}`;
  $('boss').checked=true;labels();
}
function update() {
  if(imported) {
    const cap=$('baseCap').valueAsNumber+imported.capAdded;
    const fromReader=$('critBasis').value==='reader',observed=observedCritical(readUnit).value;
    $('baseCritRate').readOnly=fromReader;
    $('baseCritRate').required=!(imported.skillType==='magic'&&!imported.magicCanCrit);
    $('baseCritLabel').textContent=fromReader?'读取器观察时暴击率 %':'基础及额外暴击率 %';
    if(fromReader)$('baseCritRate').value=observed??'';
    const added=fromReader?imported.critAttackAdded:imported.critAdded;
    const crit=$('baseCritRate').valueAsNumber+added;
    $('critImportNote').textContent=fromReader?`读取面板＋本次攻击追加 ${added}%。常驻及满血等面板加成不再重复加入；面板状态以采样时为准。${imported.critUnresolved.length?`尚需核对暴击作用阶段：${imported.critUnresolved.join('、')}`:''}`:`手填基础＋已确认网站加成 ${added}%。`;
    $('cap').value=Number.isFinite(cap)?cap:'';
    $('critRate').value=imported.skillType==='magic'&&!imported.magicCanCrit?0:Number.isFinite(crit)?Math.min(100,Math.max(0,crit)):'';
  }
  labels();
  const invalid=[...$('calculator').querySelectorAll('input[type=number]')].find(e=>!e.disabled&&!e.checkValidity());
  try {
    if(characterId&&(!imported||!workflow?.isConfirmed()))throw new Error(reviewBlocker);
    if(imported&&$('critBasis').value==='reader'&&imported.critUnresolved.length)throw new Error('部分暴击加成的作用阶段未确认，请核对或改用网站加成＋手填基础。');
    if(imported?.blockers.length)throw new Error(imported.blockers.join('；'));
    if(invalid) throw new Error(`请检查「${invalid.closest('label')?.textContent.trim()||'数值'}」的输入范围，必填数值不能留空。`);
    const s=read(),r=calculate(s),c=r.context;
    $('error').hidden=true;$('resolveReview').hidden=true;$('resultValues').hidden=false;
    $('resultState').textContent=c.element<=0?'属性免疫':r.normal.uncappedMax>s.cap?'普通伤害触及上限':imported?'导入条件下试算':'实时计算';
    $('normalDamage').textContent=`${fmt(r.normal.min)} – ${fmt(r.normal.max)}`;
    $('criticalDamage').textContent=`${fmt(r.critical.min)} – ${fmt(r.critical.max)}`;
    $('totalMean').textContent=`≈ ${fmt(r.totalMean)}`;
    $('totalNote').textContent=`${s.hits} 原始段 × ${s.hitMultiplier} = ${r.totalHits} 段 · 暴击率 ${fmt(s.critRate)}% · 含逐段上限`;
    $('normalTotal').textContent=r.normalTotal.map(fmt).join(' – ');
    $('effectiveAttack').textContent=fmt(c.attack);
    $('effectiveDefense').textContent=fmt(c.defense);
    $('killerState').textContent=c.killer?`本次触发 · 基础 ×${fmt(c.killerFactor)}`:'未触发';
    $('skillSummary').textContent=`每段系数 ×${s.coefficient} · 技能内攻击修正 ${s.skillPercent>=0?'+':''}${s.skillPercent}% · ${r.totalHits} 段`;
    const count=r.active.filter(e=>e.percent!==0).length;
    $('activeNote').textContent=`已计入 ${count} 条非零加成${s.boss&&s.break?'；Boss Break 防御修正已生效':''}。`;
    $('trace').innerHTML=r.normal.trace.map(t=>`<li><span>${esc(t.label)}</span><b>${fmt(t.value)}</b></li>`).join('');
    $('formulaText').textContent=`A=${fmt(c.attack)}，F=${fmt(c.defense)}，C=${s.coefficient}。先算普通核心，再按生效列表逐条修正，最后格挡与限额。`;
    document.querySelectorAll('.effect').forEach((el,i)=>{
      const e=s.effects[i],normal=applies(e,s,c,false),crit=applies(e,s,c,true);
      el.classList.toggle('is-inactive',!normal&&!crit);
      el.querySelector('.effect-state').textContent=!e.enabled?'已关闭':!normal&&!crit?'条件不匹配，不计入':e.percent===0?'当前为 0%，不改变伤害':normal?'条件匹配，已计入':'仅暴击命中时计入';
    });
  } catch(e) {
    $('error').hidden=false;$('error').textContent=e.message;$('resultValues').hidden=true;$('resultState').textContent=characterId&&!workflow?.isConfirmed()?'等待核对':'请检查输入';
    $('resolveReview').hidden=!characterId||workflow?.isConfirmed();
    $('trace').replaceChildren();$('formulaText').textContent='';$('activeNote').textContent='输入有效数值后会自动重新计算。';
    $('skillSummary').textContent=imported?`${imported.attackName} · 请填写该招式自己的原始系数、攻击修正及段数。`:'请检查技能参数。';
  }
}
function reset(clearSaved=true) {
  retainedImportDraft=null;
  const s=defaultInput();
  for(const k of numericKeys) if($(k))$(k).value=s[k];
  for(const k of booleanKeys) if($(k))$(k).checked=s[k];
  for(const k of ['type','skillType','element']) $(k).value=s[k];
  $('preset').value='eris';$('bossPreset').value='bird';
  document.querySelectorAll('.choices input').forEach(e=>e.checked=false);
  effects=[newEffect('boss'),newEffect('element'),newEffect('skill')];
  $('dualWield').checked=false;$('specialAttack').checked=false;applyBoss();
  renderEffects();labels();update();
  if(characterId) {
    imported=null;effects=[];renderEffects();
    $('baseCritRate').value=0;$('baseCap').value=9999;
    for(const id of ['attack','hits','coefficient','skillPercent','skillAdd','skillPostAdd'])$(id).value='';
    $('preset').value='custom';$('hitScaleStage').value='';
    $('critRate').value=0;$('cap').value=9999;
    if(workflow&&clearSaved)workflow.reset();
    update();
  }
}
$('reset').addEventListener('click',()=>reset());
$('addEffect').addEventListener('click',()=>{effects=readEffects();effects.push(newEffect());renderEffects();update();$('effects').lastElementChild.querySelector('select').focus();});
$('effects').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  effects=readEffects();const i=effects.findIndex(e=>e.id===Number(button.closest('.effect').dataset.id));
  if(button.dataset.action==='remove')effects.splice(i,1);
  else {const j=i+(button.dataset.action==='up'?-1:1);[effects[i],effects[j]]=[effects[j],effects[i]];}
  renderEffects();update();
});
$('effects').addEventListener('change',event=>{
  if(event.target.dataset.field==='kind'){
    effects=readEffects();const id=Number(event.target.closest('.effect').dataset.id),e=effects.find(e=>e.id===id);
    e.target=e.kind==='race'?RACES[0]:$('element').value;renderEffects();
  }
  update();
});
$('calculator').addEventListener('submit',e=>e.preventDefault());
$('calculator').addEventListener('input',event=>{clearTimeout(timer);timer=setTimeout(update,70);});
$('calculator').addEventListener('change',event=>{
  const id=event.target.id;
  if(['bossDefense','bossMind'].includes(id)||event.target.dataset.bossResistance){$('bossPreset').value='custom';labels();}
  if(!characterId&&id==='preset') {
    if($('preset').value==='eris') {
      for(const [key,value] of Object.entries({coefficient:.334,skillPercent:51.8,skillAdd:0,skillPostAdd:0,hits:8,critRate:20,type:'physical',skillType:'skill',element:'无'}))$(key).value=value;
      applyBoss();
    } else $('skillDetails').open=true;
  }
  if(!characterId&&['coefficient','skillPercent','skillAdd','skillPostAdd','type','skillType','element'].includes(id)){$('preset').value='custom';$('skillDetails').open=true;}
  if(!characterId&&['dualWield','type'].includes(id)&&$('type').value==='physical') {
    for(const key of ['hitMultiplier','hitDamageRatio'])$(key).value=$('dualWield').checked?'':1;
    if($('dualWield').checked){$('hitScaleStage').value='';$('hitDetails').open=true;}
  }
  if(id==='bossPreset')applyBoss();
  update();
});
$('debuff').addEventListener('click',()=>{const p=bosses[$('bossPreset').value];if(p)$('bossDefense').value=p.debuff;update();});
$('critBasis').addEventListener('change',()=>{if($('critBasis').value==='website')$('baseCritRate').value=manualCriticalBase;update();});
$('baseCritRate').addEventListener('change',()=>{if($('critBasis').value==='website')manualCriticalBase=$('baseCritRate').value;});
function applyImport(report,review) {
  const next=buildDamageImport(report);
  if(next.characterId!==characterId)throw new Error('导入报告与当前角色不一致');
  next.statReference=review.selection.statReference;
  const current=readEffects(),previous=imported?{base:imported.effects,rows:current}:retainedImportDraft;
  effects=[...next.effects.flatMap(e=>{
    const old=previous?.base.find(x=>x.importId===e.importId);
    if(old&&JSON.stringify(old)===JSON.stringify(e)){
      const draft=previous.rows.find(x=>x.importId===e.importId);
      return draft?[{...draft,id:++nextId}]:[]; // Keep an unchanged source's edits or deletion.
    }
    return [{...e,id:++nextId}];
  }),...current.filter(e=>!e.importId)];
  retainedImportDraft=null;
  imported=next;
  $('critBasis').querySelector('[value="reader"]').disabled=observedCritical(readUnit).value==null;
  if(observedCritical(readUnit).value==null)$('critBasis').value='website';
  reviewBlocker='';
  for(const [id,value] of Object.entries({skillType:next.skillType,defenseRatio:next.defenseRatio})) {
    if(typeof value==='boolean')$(id).checked=value;else $(id).value=value??'';
  }
  $('attack').value=next.statReference==='int'?review.panels.intelligence:next.statReference==='str'?review.panels.attack:'';
  if(next.statReference==='mixed')$('defense').value='';else syncBossReference();
  $('boss').checked=true;
  for(const id of ['boss','defenseRatio'])$(id).disabled=true;
  for(const id of ['hitMultiplier','hitDamageRatio'])$(id).disabled=false;
  syncHitControls(true);
  $('critRate').readOnly=true;$('cap').readOnly=true;
  $('importStatControls').hidden=false;$('importCapControls').hidden=false;
  $('skillDetails').open=true;
  $('entryReviewSummary').textContent=`${next.characterName} · ${next.attackName} · ${next.element||'属性待确认'} · 已确认 ${next.effects.length} 条伤害加成`;
  $('critImportNote').textContent=`已确认 +${next.critAdded}% 暴击率${next.skillType==='magic'&&!next.magicCanCrit?'；当前魔法没有已确认的暴击资格，按0%计算。':'；最终值为左侧输入与确认加成之和，上限100%。'}`;
  $('capImportNote').textContent=`已确认固定上限 +${fmt(next.capAdded)}；最终值为左侧输入与确认加成之和。`;
  $('importReferences').innerHTML=`<ul>${next.reference.map(e=>`<li><b>${esc(e.source)}</b>：${esc(formatEffect(e.effect))}${['stat','statBuff','equipmentStat'].includes(e.effect.type)?'（面板核对，不重复乘算）':''}</li>`).join('')}</ul>`;
  const noLongerActive=report.rows.filter(r=>r.status!=='active').map(r=>`${r.sourceName}：确认后的前置条件不成立，相关效果未计入。`);
  $('importWarnings').innerHTML=[...next.blockers,...next.warnings,...noLongerActive].map(w=>`<p class="import-warning">${esc(w)}</p>`).join('');
  renderEffects();labels();update();if(review.finish)showReview(false);
}
function receiveReport(report,force=false) {
  try {
    if(String(report?.characterId)!==characterId)return;
    latestReport=report;
    workflow.receive(report);
    if(!workflow.isConfirmed())$('entryReviewSummary').textContent=`${report.characterName} · 固定资料已补齐；请核对采用的数据。`;
  } catch(e){imported=null;$('entryReviewSummary').textContent=`导入失败：${e.message}`;update();}
}
function loadReport(force=false) {
  if(!characterId)return;
  try {const report=JSON.parse(localStorage.getItem(reportStorageKey(characterId)));if(report)receiveReport(report,force);}catch(e){$('entryReviewSummary').textContent=`无法读取基础加成：${e.message}`;}
  if(embedded)window.parent.postMessage({type:'lc-damage-request'},location.origin);
}
window.addEventListener('message',e=>{if(embedded&&e.origin===location.origin&&e.source===window.parent&&e.data?.type==='lc-damage-report')receiveReport(e.data.report);});
// Embedded frames receive direct messages; responding to storage by requesting
// another report would cause a parent/child write-request feedback loop.
window.addEventListener('storage',e=>{if(!embedded&&characterId&&e.key===reportStorageKey(characterId))loadReport();});
document.addEventListener('keydown',e=>{if(embedded&&e.key==='Escape')window.parent.postMessage({type:'lc-damage-close'},location.origin);});
if(characterId)workflow=initEntryWorkflow({
  characterId,
  onInvalidate(message){
    reviewBlocker=message;
    if(imported)retainedImportDraft={base:imported.effects,rows:readEffects().filter(e=>e.importId)};
    imported=null;effects=readEffects().filter(e=>!e.importId);renderEffects();
    $('importReferences').replaceChildren();$('importWarnings').replaceChildren();
    fillReaderPreview();$('cap').value=$('baseCap').value;
    $('entryReviewSummary').textContent=message;update();
  },
  onSelection(){fillReaderPreview();syncHitControls(true);labels();update();},
  onRead:receiveEntryData,
  onConfirm:applyImport
});
reset(false);
if(characterId){loadReport();if(embedded)window.parent.postMessage({type:'lc-damage-ready'},location.origin);}
