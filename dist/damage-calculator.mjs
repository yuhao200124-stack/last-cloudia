import {STAT_CONDITION_FIELDS} from './stat-condition-fields.mjs?v=20260924-condition-tags';
import {defaultInput,calculate,context,prepare,applies,RACES,ELEMENTS,EFFECTS} from './damage-engine.mjs?v=20260924-fullpage';
import {buildDamageImport,reportStorageKey} from './damage-import.mjs?v=20260926-common-skills';
import {formatEffect} from './effect-rule-engine.mjs?v=20260926-common-skills';
import {initEntryWorkflow} from './entry-workflow.mjs?v=20260926-common-skills';
import {BOSS_ELEMENTS,readBossRecord} from './battle-entry-data.mjs?v=20260924-fullpage';
import {observedCritical} from './reader-bonus-decoder.mjs?v=20260926-common-skills';
import {parseDamageFormulaCsv} from './formula-csv-parser.mjs';
import {projectAttackLayers,needsAttributeLayers} from './attack-layers.mjs?v=20260924-condition-tags';
import {magicBuffOptions,selectedMagicBuffs,magicBuffCap,magicBuffLayer,nonDamageMagic,supportMagicRule} from './magic-buffs.mjs?v=20260926-support-magic';
import {mountUnifiedCalculator,renderDamageGauges} from './unified-calculator.mjs?v=20260926-common-skills';
import {loadCharacterReport} from './character-report-loader.mjs?v=20260926-common-skills';
import {captureControls,restoreControls,saveCalculatorSession,loadCalculatorSession,removeCalculatorSession} from './calculator-navigation.mjs?v=20260924-condition-tags';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(values,current)=>values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('');
const stages={post:'结算后逐条修正（常见增伤）',offense:'核心前：攻击侧增伤',received:'核心前：目标受伤修正',reduction:'核心前：原生物理 / 魔法减伤'};
const bosses={bird:{def:4000,mnd:10000,debuff:2599,res:[25,-25,50,50,-25,25]},beast:{def:5500,mnd:8000,debuff:3574,res:[25,50,25,-25,50,-25]}};
let effects=[],nextId=0,timer;
const params=new URLSearchParams(location.search);
const characterId=params.get('character');
if(characterId&&/^\d+$/.test(characterId)){$('calculatorCharacterBack').href=`./character-${characterId}.html`;$('calculatorCharacterBack').textContent='返回角色';}
const embedded=params.get('embedded')==='1' && window.parent!==window;
let imported=null,latestReport=null,workflow=null,readUnit=null,bossRaces=[],reviewBlocker='请导入读取报告并选择采用的数据。',lastHitKey='';
let manualCriticalBase='';
let retainedImportDraft=null;
let formulaCapture=null,captureOptions=[],captureApplication=null;
let panelLayers=null,layerSourceKey='',attackBasisTouched=false,autoLayer=null;
let magicOptions=[],magicSelection={};
let defenseRatioTouched=false;
let unified=null;
let openingFullPage=false;
async function openFullPage(){
 if(openingFullPage)return;openingFullPage=true;$('unifiedStart').disabled=true;
 try{
  const session=await saveCalculatorSession({characterId,workflow:workflow?.exportSession(),controls:captureControls($('calculator')),
   calculator:{effects:readEffects(),nextId,imported,readUnit,manualCriticalBase,retainedImportDraft,formulaCapture,captureOptions,captureApplication,panelLayers,layerSourceKey,attackBasisTouched,autoLayer,magicSelection,defenseRatioTouched,bossRaces,reviewBlocker,lastHitKey},
   captureNote:$('formulaCaptureNote').textContent});
  window.parent.postMessage({type:'lc-damage-fullpage',session},location.origin);
 }catch{$('error').hidden=false;$('error').textContent='暂时无法带上当前数据打开大页面，请重试。当前填写内容已保留。';openingFullPage=false;$('unifiedStart').disabled=false;}
}
try {magicSelection=JSON.parse(localStorage.getItem(`lc-magic-buffs:${characterId}`))||{};}catch{}
const activeMagicBuffs=()=>selectedMagicBuffs(magicOptions,magicSelection);
const criticalDisabled=()=>!$('criticalEnabled').checked||imported?.skillType==='magic'&&!imported.magicCanCrit;
const attackStat=()=>panelLayers?.[referenceMode()==='int'?'intelligence':referenceMode()==='str'?'attack':''];
function renderMagicBuffs(profile) {
  magicOptions=magicBuffOptions(profile);
  const spells=nonDamageMagic(profile);$('magicBuffOptions').hidden=!spells.length;
  $('magicBuffChoices').innerHTML=spells.map(spell=>{
    const rule=supportMagicRule(spell,magicOptions);
    return rule?`<label class="magic-buff-check"><input type="checkbox" data-magic-buff="${esc(rule.id)}"${magicSelection[rule.id]?' checked':''}>${esc(rule.name)}：${esc(rule.label)}</label>`:
      `<div class="magic-buff-check">${esc(spell.name)}：${esc(spell.description||'效果尚待核对')}</div>`;
  }).join('');
}
for(const id of ['fullHp','lowHp'])$(id).addEventListener('change',()=>{if($(id).checked)$(id==='fullHp'?'lowHp':'fullHp').checked=false;});
$('magicBuffOptions').addEventListener('change',e=>{
  if(e.target.dataset.magicBuff){
    const chosen=magicOptions.find(b=>b.id===e.target.dataset.magicBuff);
    if(chosen&&e.target.checked&&chosen.runtime.stackPolicy==='exclusive')for(const other of magicOptions)if(other.stat===chosen.stat&&other.runtime.stackGroup===chosen.runtime.stackGroup)magicSelection[other.id]=false;
    magicSelection[e.target.dataset.magicBuff]=e.target.checked;
    renderMagicBuffs(latestReport?.profile);
  }
  try{localStorage.setItem(`lc-magic-buffs:${characterId}`,JSON.stringify(magicSelection));}catch{}
  if(activeMagicBuffs().some(b=>b.stat===attackStat()?.key)){$('attackBasis').value='auto';attackBasisTouched=false;}
  clearSettlementCapture('魔法增益已改变，请采用对应状态下的结算样本。');update();
});
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
$('closeReview').addEventListener('click',()=>workflow?.saveAndReturn());
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
  $('hitScaleStage').value=s.dualWield?s.hitScaleStage||imported?.hitScaleStage||'':'';
  if(s.dualWield||Number($('hitDamageRatio').value)!==1)$('hitDetails').open=true;
}
function hitSourceNote(){
  const s=workflow?.selection(),manual=s?.dualWield&&['hitMultiplier','hitDamageRatio'].some(k=>s[k]!=null&&s[k]!=='');
  const values=`命中 ×${$('hitMultiplier').value||'待填'}，单段 ×${$('hitDamageRatio').value||'待填'}`;
  $('hitSourceNote').textContent=!s?.dualWield?'本次未启用双刀／魔法双段，命中 ×1、单段 ×1；此项不改变配装。':
    manual?`手动填写：${values}。重新应用核对结果会保留你的数值；清空某个倍率可恢复自动值。`:
    imported?.hitSources.length?`来源：${{reader:'读取器技能配置',manual:'手动核对',website:'网站技能效果'}[imported.hitSourceKind]} · ${imported.hitSources.join('、')}；${values}。已自动填写，只执行这一份分段修正，未代表本次实际命中观测。`:
    '已启用双刀／魔法双段。已识别的角色分段规则会自动填写；未识别的倍率请在下方手动填写。';
  $('hitScaleControl').hidden=$('hitDamageRatio').value!==''&&$('hitDamageRatio').valueAsNumber===1;
}
function receiveEntryData({battle,unit,panelOnly=false}) {
  readUnit=unit;
  panelLayers=null;layerSourceKey='';attackBasisTouched=false;$('attackBasis').value='panel';$('attackBase').value='';$('runtimeStatPercent').value='';
  clearSettlementCapture('读取报告或角色已改变，请重新选择结算样本。');renderCaptureOptions();
  if(panelOnly){fillReaderPreview();update();return;}
  defenseRatioTouched=false;
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
function attackFormula(s,c) {
  if(s.attackBasis==='settlement')return `直接采用读取器结算攻击 ${fmt(c.attack)}；不再应用技能攻击修正或 AtkRatio。`;
  if(s.attackBasis==='layers')return `同层属性：(${fmt(s.attackBase)} + ${s.skillAdd}) × (1 + ${s.runtimeStatPercent}% + ${s.skillPercent}%) + ${s.skillPostAdd}，再应用 AtkRatio。`;
  return '按无实时属性加成的面板应用技能攻击修正。';
}
function syncAttackBasis() {
  let mode=$('attackBasis').value;
  const stat=attackStat();
  // Never let a previously selected panel mode multiply an already buffed INT
  // again. Missing layer evidence stays unresolved instead of falling back.
  if(needsAttributeLayers(mode,stat,$('attack').valueAsNumber)){mode='auto';$('attackBasis').value=mode;}
  $('attackLayerControls').hidden=!['layers','auto'].includes(mode);$('settledAttackControl').hidden=mode!=='settlement';
  for(const id of ['attackBase','runtimeStatPercent']){$(id).disabled=mode!=='layers';$(id).required=mode==='layers';}
  $('settledAttack').disabled=mode!=='settlement';$('settledAttack').required=mode==='settlement';
  $('attack').required=mode==='panel';
  for(const id of ['skillAdd','skillPercent','skillPostAdd','attackRatio'])$(id).disabled=mode==='settlement';
  autoLayer=mode==='auto'?(magicBuffLayer(stat,$('attack').valueAsNumber,activeMagicBuffs())||projectAttackLayers(stat,$('attack').valueAsNumber)):null;
  if(mode==='auto'){
    $('attackBase').value=autoLayer.ok?autoLayer.base:'';$('runtimeStatPercent').value=autoLayer.ok?autoLayer.percent:'';
    $('attackBasisNote').textContent=!autoLayer.ok?autoLayer.reason:autoLayer.projected?
      `原观察属性 ${fmt(autoLayer.observedPanel)}；当前条件预估 ${fmt(autoLayer.panel)}，实时加成 ${autoLayer.percent}%。${autoLayer.replaced.length?`已替换同组来源：${autoLayer.replaced.map(b=>`${b.source} ${b.value}%`).join('、')}。`:''}技能攻击修正另外在同一层相加。`:
      `状态前基准 ${fmt(autoLayer.base)}；观察属性 ${fmt(autoLayer.panel)} 对应实时加成 ${autoLayer.percent}%（${autoLayer.active.map(b=>b.source).join('、')||'未含已知实时加成'}）。${autoLayer.buffObserved?'该面板已包含所选增益，不重复加入。':''}技能修正在同一层相加。`;
    return;
  }
  $('attackBasisNote').textContent=mode==='settlement'?'结算值已含技能修正和 AtkRatio，直接进入攻防核心。读取器记录为整数；其他倍率及伤害加成仍按本页计算。':mode==='layers'?'只合并已确认属于同一实时属性层的加成。例：6,741 × (1 + 50% + 67%) → 14,627；不能给已经加过 50% 的 10,111 再乘 1.67。':'如果面板含 EX 灵气、月光等实时加成，请改用属性分层或读取器结算值；不能直接再次乘技能攻击修正。';
}
function captureKey() {
  return JSON.stringify([readUnit?.unitId,workflow?.selection(),magicSelection,...['preset','type','skillType','element','readerSkillPick','attack','coefficient','skillPercent','skillAdd','skillPostAdd','attackRatio','runtimeRatio','hitMultiplier','hitDamageRatio','hitScaleStage','bossPreset','bossDefense','bossMind','defenseRatio','resistCorrection'].map(id=>$(id)?.value),...['dualWield','specialAttack','break'].map(id=>$(id).checked)]);
}
function clearSettlementCapture(reason) {
  const hadValue=!!captureApplication||$('settledAttack').value!=='';
  captureApplication=null;$('settledAttack').value='';
  if(hadValue)$('formulaCaptureNote').textContent=reason;
}
function renderCaptureOptions() {
  captureOptions=(formulaCapture?.battles||[]).flatMap(b=>b.settlementGroups.filter(g=>g.sourceIdentity&&(!readUnit||String(g.sourceIdentity.unitId)===String(readUnit.unitId))).map(g=>({battle:b,group:g})));
  const time=(b,g)=>{const date=new Date(Number(b.session)+g.timeRange[0]);return Number.isFinite(date.getTime())?date.toISOString().slice(0,19).replace('T',' '):'时间未提供';};
  $('formulaCapturePick').innerHTML='<option value="">请选择本次战斗与结算值</option>'+captureOptions.map(({battle:b,group:g},i)=>`<option value="${i}">${esc(time(b,g))} · 第${esc(b.battle)}场 · ${esc(g.sourceIdentity.name)} · A ${g.attack} / F ${g.defense} · ${b.hpTargets.reduce((n,h)=>n+h.eventCount,0)}次掉血 / ${fmt(b.hpTargets.reduce((n,h)=>n+h.totalDecrease,0))}</option>`).join('');
  $('applyFormulaCapture').disabled=true;
}
function selectedCapture() {return $('formulaCapturePick').value===''?null:captureOptions[Number($('formulaCapturePick').value)];}
function showCaptureChoice() {
  const value=selectedCapture();$('applyFormulaCapture').disabled=!value;
  if(!value)return;
  const {battle:b,group:g}=value;
  $('formulaCaptureNote').textContent=`${g.sampleCount} 条结算样本：攻击 ${g.attack}，防御 ${g.defense}，基础倍率 ${Number(g.baseRatio.toPrecision(6))}，最终倍率 ${Number(g.finalRatio.toPrecision(6))}。观察法强：${g.panelIntValues.map(v=>v.value).join('／')||'未读取'}。${g.knownLogSkillIds.length?`部分样本与技能 ${g.knownLogSkillIds.join('、')} 日志对应。`:''}缓存未完整绑定招式；点击后将该值用于当前所选招式。掉血合计属于本场目标，不能直接当作逐段伤害。`;
}
$('formulaCaptureFile').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try {
    if(file.size>25*1024*1024)throw new Error('文件超过25MB，请拆分战斗记录。');
    const parsed=parseDamageFormulaCsv(await file.text());
    clearSettlementCapture('已载入新的结算记录，请重新选择。');formulaCapture=parsed;renderCaptureOptions();
    $('formulaCaptureNote').textContent=`${file.name}：${parsed.battleCount} 场战斗，${captureOptions.length} 组我方结算值。请选择本次样本。${parsed.issues.length?`${parsed.issues.length} 条字段不完整或冲突的记录未用于对应。`:''}`;
  }catch(error){$('formulaCaptureNote').textContent=`结算文件未导入：${error.message}`;}
  e.target.value='';update();
});
$('formulaCapturePick').addEventListener('change',showCaptureChoice);
$('applyFormulaCapture').addEventListener('click',()=>{
  const selected=selectedCapture();if(!selected)return;
  const {group:g,battle:b}=selected,mode=referenceMode();
  const values=mode==='int'?g.panelIntValues:mode==='str'?g.panelAttackValues:[];
  if(!['int','str'].includes(mode)||!attackStat()){
    $('settledAttack').value=g.attack;
    captureApplication={key:captureKey(),groupId:g.id};
    $('formulaCaptureNote').textContent=`读取器结算攻击 ${g.attack}，结算防御 ${g.defense}，核心倍率 ${Number(g.finalRatio.toPrecision(6))}。当前参照尚无可自动核对的属性层，已保留原计算输入。需要直接对照时，可明确选择“直接采用读取器结算攻击值”；这不代表原公式已通过验证。`;
    update();return;
  }
  if(values.length!==1){
    clearSettlementCapture('本组没有唯一的观察面板。');
    $('formulaCaptureNote').textContent='本组没有唯一的参照属性面板，无法确定对应状态。已保留当前输入，请选择面板明确的样本组后再核对。';
    update();return;
  }
  // Adopt a sampled panel only when it is unique within this selected group.
  const c=$('coefficient').valueAsNumber,h=$('hitDamageRatio').valueAsNumber;
  let coreMatched=false;
  if($('dualWield').checked&&Number.isFinite(c)&&c>0&&Number.isFinite(h)&&h!==1&&$('runtimeRatio').valueAsNumber===1&&Math.abs(g.baseRatio-c*h)<1e-6){
    $('hitScaleStage').value='core';$('hitScaleStage').dispatchEvent(new Event('change',{bubbles:true}));coreMatched=true;
  }
  const observedStats={};
  if(g.panelAttackValues.length===1)observedStats.attack=g.panelAttackValues[0].value;
  if(g.panelIntValues.length===1)observedStats.intelligence=g.panelIntValues[0].value;
  const time=new Date(Number(b.session)+g.timeRange[0]);
  const adopted=workflow?.adoptAttackObservation({explicitSelection:true,unitId:g.sourceIdentity?.unitId,sampleId:g.id,stats:observedStats,capturedAt:Number.isFinite(time.getTime())?time.toISOString():''});
  if(!adopted&&values.length===1)$('attack').value=values[0].value;
  $('attackBasis').value='auto';attackBasisTouched=false;$('settledAttack').value=g.attack;
  captureApplication={key:captureKey(),groupId:g.id,expectedAttack:g.attack,expectedDefense:g.defense,expectedRatio:g.finalRatio,formulaValidation:true};
  $('formulaCaptureNote').textContent=`已读取本组观察面板；结算攻击 ${g.attack} 仅用于检查公式，不代替公式输入。${coreMatched?'分段倍率已按样本放入核心系数。':''}正在核对属性来源。`;
  update();
});
function read() {
  const s=defaultInput();
  for(const k of numericKeys) if($(k))s[k]=$(k).valueAsNumber;
  for(const k of booleanKeys) if($(k))s[k]=$(k).checked;
  if(characterId&&!imported?.hitSources.length){s.hitMultiplier=1;s.hitDamageRatio=1;}
  for(const k of ['type','skillType','element','hitScaleStage','attackBasis']) s[k]=$(k).value;
  if(s.attackBasis==='auto')s.attackBasis='layers';
  s.races=bossRaces;s.stunned=$('stunned').checked;s.killerRaces=[];s.specialAttack=$('specialAttack').checked&&(!characterId||imported?.reference.some(row=>row.effect.type==='killer'&&row.effect.value===true)===true);s.killerCorrection=imported?.killerCorrection??0;
  if(criticalDisabled())s.critRate=0;
  s.criticalCapAdded=imported?.criticalCapAdded??0;
  s.effects=readEffects().map(e=>!$('criticalEnabled').checked&&(e.kind==='critical'||e.criticalOnly)?{...e,enabled:false}:e);return s;
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
  syncAttackBasis();
  const mode=referenceMode(),magic=mode==='int';
  $('attackLabel').textContent=mode==='mixed'?'已确认的混合结算攻击值':magic?'当前战斗法强':'当前战斗攻击力';
  $('mixedReferenceNote').hidden=mode!=='mixed';$('mixedDefenseControl').hidden=mode!=='mixed';
  $('defenseLabel').textContent=mode==='mixed'?'混合结算防御值':magic?'当前魔抗 MND':'当前防御力 DEF';
  const neutral=$('element').value==='无';$('resistance').disabled=neutral;
  syncBossReference();
  $('bossReference').textContent=`本次参照：${mode==='mixed'?'手填混合防御值':magic?'魔抗 MND':'防御力 DEF'}；${neutral?'无属性不使用六属性抗性':`使用${$('element').value||'所选'}抗性`}。`;
  const p=bosses[$('bossPreset').value];$('debuff').hidden=!p?.debuff||magic||mode==='mixed';
  if(p?.debuff)$('debuff').textContent=`填入实测降防值 ${p.debuff}`;
  const resistance=$('resistance').valueAsNumber,correction=$('resistCorrection').valueAsNumber;
  $('weaknessStatus').textContent=`弱点：${$('element').value==='无'?'无属性':Number.isFinite(resistance)&&Number.isFinite(correction)?resistance+correction<0?'已命中':'未命中':'目标抗性待确认'}`;
  hitSourceNote();
}
$('bossRaceChoices').innerHTML=RACES.map((race,i)=>`<label><input id="bossRace${i}" data-boss-race="${esc(race)}" type="checkbox">${esc(race)}</label>`).join('');
function syncBossRaces(){
  document.querySelectorAll('[data-boss-race]').forEach(el=>el.checked=bossRaces.includes(el.dataset.bossRace));
  $('bossIdentity').textContent=`种族：${bossRaces.length?bossRaces.join('、'):'未确认（种族限定加成不自动计入）'}`;
}
function applyBoss() {
  const p=bosses[$('bossPreset').value];
  $('bossDefense').value=p?.def??'';$('bossMind').value=p?.mnd??'';
  document.querySelectorAll('[data-boss-resistance]').forEach((el,i)=>el.value=p?.res?.[i]??'');
  bossRaces=p?.races||[];syncBossRaces();
  $('boss').checked=true;labels();
}
function update() {
  if(captureApplication&&captureApplication.key!==captureKey())clearSettlementCapture('面板、招式或战斗条件已改变，请重新采用相应的结算样本。');
  if(imported) {
    const magicCap=magicBuffCap(activeMagicBuffs(),imported.skillType,imported.reference);
    const cap=$('baseCap').valueAsNumber+imported.capAdded+magicCap;
    $('capImportNote').textContent=`已确认固定上限 +${fmt(imported.capAdded)}${magicCap?`；所选魔法增益 +${fmt(magicCap)}`:''}${imported.criticalCapAdded?`；仅暴击命中时另加 +${fmt(imported.criticalCapAdded)}`:''}。`;
    const fromReader=$('critBasis').value==='reader',observed=observedCritical(readUnit).value;
    $('baseCritRate').readOnly=fromReader;
    $('baseCritRate').required=!criticalDisabled();
    $('baseCritLabel').textContent=fromReader?'读取器观察时暴击率 %':'基础及额外暴击率 %';
    if(fromReader)$('baseCritRate').value=observed??'';
    const added=fromReader?imported.critAttackAdded:imported.critAdded;
    const crit=$('baseCritRate').valueAsNumber+added;
    $('critImportNote').textContent=fromReader?`读取面板＋本次攻击追加 ${added}%。常驻及满血等面板加成不再重复加入；面板状态以采样时为准。${imported.critUnresolved.length?`尚需核对暴击作用阶段：${imported.critUnresolved.join('、')}`:''}`:`手填基础＋已确认网站加成 ${added}%。`;
    if(!$('criticalEnabled').checked)$('critImportNote').textContent='暴击已关闭，相关技能、暴伤及附带上限不计入；结果保留暴击伤害对照。';
    $('cap').value=Number.isFinite(cap)?cap:'';
    $('critRate').value=criticalDisabled()?0:Number.isFinite(crit)?Math.min(100,Math.max(0,crit)):'';
  }
  labels();
  const invalid=[...$('calculator').querySelectorAll('input[type=number]')].find(e=>!e.disabled&&!e.checkValidity());
  try {
    if(!unified?.active){
      if(characterId&&(!imported||!workflow?.isConfirmed()))throw new Error(reviewBlocker);
      if(imported&&!criticalDisabled()&&$('critBasis').value==='reader'&&imported.critUnresolved.length)throw new Error('部分暴击加成的作用阶段未确认，请核对或改用网站加成＋手填基础。');
      if(imported?.blockers.length)throw new Error(imported.blockers.join('；'));
      if(activeMagicBuffs().some(b=>b.stat===attackStat()?.key)&&$('attackBasis').value==='panel')throw new Error('已勾选属性增益，请使用自动属性分层。');
      if($('attackBasis').value==='auto'&&!autoLayer?.ok)throw new Error(autoLayer?.reason||'请先核对属性层来源。');
      if(invalid) throw new Error(`请检查「${invalid.closest('label')?.textContent.trim()||'数值'}」的输入范围，必填数值不能留空。`);
    }
    if(unified?.active)for(const [id,label] of [['coefficient','每段基础系数'],['hits','基础命中段数'],['skillPercent','技能内攻击修正'],['skillAdd','技能内攻击前加算'],['skillPostAdd','技能内攻击后加算']])if(!Number.isFinite($(id).valueAsNumber))throw new Error(`请在“战斗设置”中填写${label}。`);
    const preview=unified?.active?unified.prepare(read()):null;
    const s=preview?.input||read(),r=calculate(s),c=r.context;
    $('error').hidden=true;$('resolveReview').hidden=true;$('resultValues').hidden=false;
    $('resultState').textContent=c.element<=0?'属性免疫':r.normal.uncappedMax>s.cap?'普通伤害触及上限':imported?'导入条件下试算':'实时计算';
    if(preview)$('resultState').textContent=preview.unresolved.length?'配装预览 · 有待研究项':'实时配装';
    renderDamageGauges(r,s);
    if(!preview&&captureApplication?.formulaValidation&&$('attackBasis').value!=='settlement'){
      const e=captureApplication,q=prepare(s).q,match=c.attack===e.expectedAttack&&Math.abs(c.defense-e.expectedDefense)<1e-6&&Math.abs(q-e.expectedRatio)<1e-6;
      $('formulaCaptureNote').textContent=`公式／读取器：结算攻击 ${fmt(c.attack)}／${fmt(e.expectedAttack)}；结算防御 ${fmt(c.defense)}／${fmt(e.expectedDefense)}；核心倍率 ${Number(q.toPrecision(6))}／${Number(e.expectedRatio.toPrecision(6))}。${match?'三项一致；后置加成仍按已采用来源计算，逐条执行顺序尚未完全核对。':'存在差异，请继续核对所选面板、技能及战斗条件。'}读取值没有代替属性公式输入。`;
      if(!match)$('resultState').textContent='与读取结算有差异';
    }
    $('normalDamage').textContent=`${fmt(r.normal.min)} – ${fmt(r.normal.max)}`;
    $('criticalDamage').textContent=`${fmt(r.critical.min)} – ${fmt(r.critical.max)}`;
    $('criticalDamage').closest('article').hidden=false;
    $('totalMean').textContent=`≈ ${fmt(r.totalMean)}`;
    $('totalNote').textContent=`${s.hits} 原始段 × ${s.hitMultiplier} = ${r.totalHits} 段 · 暴击率 ${fmt(s.critRate)}% · 含逐段上限`;
    $('normalTotal').textContent=r.normalTotal.map(fmt).join(' – ');
    const differentCaps=r.critical.cap!==r.normal.cap;
    $('damageCapLabel').textContent=differentCaps?'普通每段上限':'每段伤害上限';
    $('damageCap').textContent=fmt(r.normal.cap);
    $('criticalCapResult').hidden=!differentCaps;
    $('criticalCap').textContent=fmt(r.critical.cap);
    $('resultCapNote').hidden=s.hitScaleStage!=='afterCap'||s.hitDamageRatio===1;
    $('resultCapNote').textContent=`以上为每段采用的伤害上限；单段倍率 ×${fmt(s.hitDamageRatio)} 在上限后生效。`;
    $('effectiveAttack').textContent=fmt(c.attack);
    $('effectiveDefense').textContent=fmt(c.defense);
    $('killerState').textContent=c.killer?`本次触发 · 基础 ×${fmt(c.killerFactor)}`:'未触发';
    $('skillSummary').textContent=`每段系数 ×${s.coefficient} · ${s.attackBasis==='settlement'?'读取器结算攻击已含技能修正':`技能内攻击修正 ${s.skillPercent>=0?'+':''}${s.skillPercent}%`} · ${r.totalHits} 段`;
    const count=r.active.filter(e=>e.percent!==0).length;
    $('activeNote').textContent=`已计入 ${count} 条非零加成${s.boss&&s.break?'；Boss Break 防御修正已生效':''}。${autoLayer?.projected&&$('attackBasis').value==='auto'?`当前条件下预估面板 ${fmt(autoLayer.panel)}；同类型 Buff 只保留本次启用的一份。`:''}`;
    $('trace').innerHTML=r.normal.trace.map(t=>`<li><span>${esc(t.label)}</span><b>${fmt(t.value)}</b></li>`).join('');
    $('formulaText').textContent=`${attackFormula(s,c)} A=${fmt(c.attack)}，F=${fmt(c.defense)}，C=${s.coefficient}。先算普通核心，再按生效列表逐条修正，最后格挡与限额。`;
    if(!preview)document.querySelectorAll('.effect').forEach((el,i)=>{
      const e=s.effects[i],normal=applies(e,s,c,false),crit=applies(e,s,c,true);
      el.classList.toggle('is-inactive',!normal&&!crit);
      el.querySelector('.effect-state').textContent=!e.enabled?'已关闭':!normal&&!crit?'条件不匹配，不计入':e.percent===0?'当前为 0%，不改变伤害':normal?'条件匹配，已计入':'仅暴击命中时计入';
    });
  } catch(e) {
    unified?.error(e.message);
    $('error').hidden=false;$('error').textContent=e.message;$('resultValues').hidden=true;$('resultState').textContent=characterId&&!workflow?.isConfirmed()?'等待核对':'请检查输入';
    $('resolveReview').hidden=unified?.active||!characterId||workflow?.isConfirmed();
    $('trace').replaceChildren();$('formulaText').textContent='';$('activeNote').textContent='输入有效数值后会自动重新计算。';
    $('skillSummary').textContent=imported?`${imported.attackName} · 请填写该招式自己的原始系数、攻击修正及段数。`:'请检查技能参数。';
  }
}
function reset(clearSaved=true) {
  defenseRatioTouched=false;
  captureApplication=null;panelLayers=null;layerSourceKey='';attackBasisTouched=false;$('attackBasis').value='panel';
  if(clearSaved){magicSelection={};try{localStorage.removeItem(`lc-magic-buffs:${characterId}`);}catch{}renderMagicBuffs(latestReport?.profile);}
  retainedImportDraft=null;
  const s=defaultInput();
  for(const k of numericKeys) if($(k))$(k).value=s[k];
  $('settledAttack').value='';$('attackBase').value='';
  for(const k of booleanKeys) if($(k))$(k).checked=s[k];
  $('stunned').checked=false;$('ground').checked=false;
  for(const k of ['type','skillType','element']) $(k).value=s[k];
  $('preset').value='eris';$('bossPreset').value='bird';
  document.querySelectorAll('.choices input').forEach(e=>e.checked=false);
  effects=[newEffect('boss'),newEffect('element'),newEffect('skill')];
  $('dualWield').checked=false;$('specialAttack').checked=false;if(!characterId)$('criticalEnabled').checked=true;applyBoss();
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
  if(id==='attack'&&workflow)workflow.setManualPanel(referenceMode()==='int'?'intelligence':referenceMode()==='str'?'attack':'mixed',$('attack').valueAsNumber);
  if(id==='attackBasis')attackBasisTouched=true;
  if(id==='defenseRatio')defenseRatioTouched=true;
  if(id==='attackBasis'&&$('attackBasis').value!=='settlement')clearSettlementCapture('已切换计算方式；重新采用结算值时需选择对应样本或填写。');
  if(id==='settledAttack')captureApplication={key:captureKey(),manual:true};
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
  if(event.target.dataset.bossRace){bossRaces=[...document.querySelectorAll('[data-boss-race]:checked')].map(el=>el.dataset.bossRace);syncBossRaces();}
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
  const sourceKey=JSON.stringify([review.unitId,review.battleId,review.selection.statReference,review.panelLayers]);
  if(layerSourceKey&&sourceKey!==layerSourceKey&&$('attackBasis').value==='layers'){$('attackBase').value='';$('runtimeStatPercent').value='';}
  panelLayers=review.panelLayers;layerSourceKey=sourceKey;
  if(!attackBasisTouched)$('attackBasis').value=(attackStat()?.runtimeCandidates?.length||attackStat()?.buffs?.length||activeMagicBuffs().some(b=>b.stat===attackStat()?.key))?'auto':'panel';
  $('critBasis').querySelector('[value="reader"]').disabled=observedCritical(readUnit).value==null;
  if(observedCritical(readUnit).value==null)$('critBasis').value='website';
  reviewBlocker='';
  for(const [id,value] of Object.entries({skillType:next.skillType,defenseRatio:next.defenseRatio})) {
    if(id==='defenseRatio'&&defenseRatioTouched)continue;
    if(typeof value==='boolean')$(id).checked=value;else $(id).value=value??'';
  }
  $('attack').value=next.statReference==='int'?review.panels.intelligence:next.statReference==='str'?review.panels.attack:'';
  if(next.statReference==='mixed')$('defense').value='';else syncBossReference();
  $('boss').checked=true;
  $('boss').disabled=true;$('defenseRatio').disabled=false;
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
    renderMagicBuffs(report.profile);
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
    panelLayers=null;
    clearSettlementCapture('核对条件已改变，请重新选择本次结算值。');
    reviewBlocker=message;
    if(imported)retainedImportDraft={base:imported.effects,rows:readEffects().filter(e=>e.importId)};
    imported=null;effects=readEffects().filter(e=>!e.importId);renderEffects();
    $('importReferences').replaceChildren();$('importWarnings').replaceChildren();
    fillReaderPreview();$('cap').value=$('baseCap').value;
    $('entryReviewSummary').textContent=message;update();
  },
  onSelection(){fillReaderPreview();syncHitControls(true);labels();update();},
  onDraftSaved(){showReview(false);},
  onRead:receiveEntryData,
  onConfirm:applyImport
});
reset(false);
let transferred=null;
if(!embedded&&params.has('session'))try{transferred=await loadCalculatorSession(params.get('session'),characterId);}catch{}
if(transferred?.workflow?.report){latestReport=transferred.workflow.report;renderMagicBuffs(latestReport.profile);workflow?.restoreSession(transferred.workflow);}
else if(characterId){loadReport();if(embedded)window.parent.postMessage({type:'lc-damage-ready'},location.origin);}
if(transferred?.calculator){
 ({effects,nextId,imported,readUnit,manualCriticalBase,retainedImportDraft,formulaCapture,captureOptions,captureApplication,panelLayers,layerSourceKey,attackBasisTouched,autoLayer,magicSelection,defenseRatioTouched,bossRaces,reviewBlocker,lastHitKey}=transferred.calculator);
 renderMagicBuffs(latestReport?.profile);renderEffects();renderCaptureOptions();restoreControls($('calculator'),transferred.controls);syncBossRaces();
 $('applyFormulaCapture').disabled=!selectedCapture();$('formulaCaptureNote').textContent=transferred.captureNote||'';labels();update();
 const restoredUrl=new URL(location.href);restoredUrl.searchParams.delete('session');history.replaceState(null,'',restoredUrl.href);
 removeCalculatorSession(params.get('session')).catch(()=>{});
}
unified=mountUnifiedCalculator({
 beforeOpen:()=>{if(!embedded)return true;openFullPage();return false;},
 getContext:()=>({characterId,baseReport:workflow?.planningBase()||latestReport,selection:workflow?.selection()||{attack:$('skillType').value==='magic'?'magic':$('skillType').value==='skill'?'s1':$('skillType').value,type:$('type').value,element:$('element').value,statReference:referenceMode(),criticalEnabled:$('criticalEnabled').checked,specialAttack:$('specialAttack').checked,fullHp:$('fullHp').checked,lowHp:$('lowHp').checked,...Object.fromEntries(STAT_CONDITION_FIELDS.map(f=>[f,$(f).checked])),break:$('break').checked,dualWield:$('dualWield').checked},
  baseCap:$('baseCap').valueAsNumber,baseCritRate:$('critBasis').value==='reader'?Number(manualCriticalBase)||0:$('baseCritRate').valueAsNumber||0,
  selectedBuffs:activeMagicBuffs(),runtimeAnchor:autoLayer?.active||[],manualDefenseRatio:defenseRatioTouched?$('defenseRatio').valueAsNumber:null,
  criticalObservation:imported&&workflow?.isConfirmed()&&$('critBasis').value==='reader'&&$('criticalEnabled').checked?$('critRate').valueAsNumber:null}),
 onChange:update
});
if(characterId&&!latestReport)loadCharacterReport(characterId).then(report=>{if(!latestReport){receiveReport(report);unified.refreshSources();}}).catch(e=>unified.error(e.message));
if(params.get('unified')==='1')unified.open();
