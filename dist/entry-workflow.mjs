import {selectReaderCriticalBonuses} from './critical-options.mjs?v=20260924-unified';
import {migrateCharacterHitDrafts} from './character-combat-rules.mjs?v=20260924-unified';
import {buildBonusComparison,effectSelectionKey} from './bonus-comparison.mjs?v=20260924-unified';
import {STAT_MECHANICS_REVISION} from './stat-mechanics.mjs?v=20260924-unified';
import {SIX_STATS,ATTACK_CHOICES,retargetReport,websiteCandidates,validateBattleEntry,compareCandidates,decisionKey,resolveReview} from './entry-preparation.mjs?v=20260924-unified';
import {formatEffect,describeCondition} from './effect-rule-engine.mjs';
import {withAccountBlessings,blessingPercentages} from './account-blessings-panel.mjs';
import {calculateWebsitePanel} from './panel-calculator.mjs?v=20260924-unified';
import {readMoveParameters,panelObservation,capturePanelObservation,readerPanelSnapshots,defaultReaderSnapshot,observedReaderUnit} from './battle-entry-data.mjs?v=20260924-unified';
import {readerBonusState,observedCritical,evaluateReaderBonuses} from './reader-bonus-decoder.mjs?v=20260924-unified';
import {readerSupplementCandidates,appendReaderSupplements,supplementKey,includeSupplementGroups} from './reader-supplements.mjs?v=20260924-unified';
import {withReaderGroupChoices,readerGroupChoice,upgradeReaderGroupChoice,readerGroupDecisions,adoptedGroupReaderIds,appendReaderGroups,modeGroupCatalog} from './reader-group-review.mjs?v=20260924-unified';
import {MODE_LABELS} from './combat-modes.mjs?v=20260924-unified';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const clone=x=>JSON.parse(JSON.stringify(x));
const option=(v,label,current)=>`<option value="${esc(v)}"${v===current?' selected':''}>${esc(label)}</option>`;
const meaningful=report=>JSON.stringify({...report,createdAt:''});
const panelTypes=new Set(['stat','statBuff','equipmentStat']);
const summaryTypes=new Set(['damage','cap','critRate','killerPower']);
export function initEntryWorkflow({characterId,onConfirm,onInvalidate,onSelection,onRead=()=>{},onDraftSaved=()=>{}}) {
 const storageKey=`lc-entry-review:${characterId}:v1`;
 let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey))||{};}catch{}
 let state={parameterSchema:2,accountBlessings:true,base:{},selection:saved.selection||{},parameters:saved.parameterSchema===2?saved.parameters||{}:{},hitParameters:saved.hitParameters||{},decisions:saved.decisions||{},statDecisions:saved.statDecisions||{},mappings:saved.mappings||{},removedEffects:saved.removedEffects||{}};
 if(saved.mechanicsRevision!==STAT_MECHANICS_REVISION)for(const d of Object.values(state.statDecisions))d.choice='pending';
 state.mechanicsRevision=STAT_MECHANICS_REVISION;
 if(typeof state.selection.criticalEnabled!=='boolean'&&typeof state.selection.magicCanCrit==='boolean')state.selection.criticalEnabled=state.selection.magicCanCrit;
 delete state.selection.magicCanCrit;
 state.bonusPreference=saved.bonusPreference||null;
 // Older UI defaulted Roxy's 0.6 to before-cap, before its core placement was
 // checked against native settlement samples. Migrate that exact old default.
 migrateCharacterHitDrafts(characterId,saved,state.hitParameters);
 state.hitMechanicsRevision=2;
 let report=null,profile=null,candidate=null,compared=[],battle=null,unit=null,signature='',initialized=false;
 let confirmed=false,bonusGroups=[],readerBonuses=[],modeCatalog={},potentialModeGroups=[];
 let reportFingerprint=null,storageSaveFailed=false,importGeneration=0;
 state.readerDrafts=saved.readerDrafts||{};
 let supplementChoices={},supplements=[],groupReaderChoices={},attackObservations={},snapshotSelection='entry';
 const selectedUnit=()=>observedReaderUnit(unit,snapshotSelection);
 const observation=k=>panelObservation(battle,unit,k,attackObservations,snapshotSelection);
 const readStat=k=>observation(k).value;
 state.readerSkillMappings=saved.readerSkillMappings||{};
 const parameterIds=['hits','coefficient','skillPercent','skillAdd','skillPostAdd'];
 const draftKey=()=>reportFingerprint&&unit?`${reportFingerprint}:${unit.unitId}`:null;
 const saveStatus=message=>{for(const id of ['entrySaveStatus','reviewSaveStatus'])$(id).textContent=message;};
 function rememberReaderDraft(){
  const key=draftKey();if(!key)return;
  delete state.readerDrafts[key];
  state.readerDrafts[key]=clone({statDecisions:state.statDecisions,decisions:state.decisions,mappings:state.mappings,supplementChoices,groupReaderChoices,attackObservations,snapshotSelection});
  for(const old of Object.keys(state.readerDrafts).slice(0,-4))delete state.readerDrafts[old];
 }
 function restoreReaderDraft(){
  const draft=state.readerDrafts[draftKey()];
  state.statDecisions=clone(draft?.statDecisions||{});state.decisions=clone(draft?.decisions||{});state.mappings=clone(draft?.mappings||{});
  supplementChoices=clone(draft?.supplementChoices||{});attackObservations=clone(draft?.attackObservations||{});
  groupReaderChoices=clone(draft?.groupReaderChoices||{});
  snapshotSelection=draft?.snapshotSelection??defaultReaderSnapshot(unit);
  if(snapshotSelection!=='entry'&&!readerPanelSnapshots(unit).some(s=>s.id===snapshotSelection))snapshotSelection=defaultReaderSnapshot(unit);
  return !!draft;
 }
 const save=()=>{rememberReaderDraft();try{localStorage.setItem(storageKey,JSON.stringify(state));storageSaveFailed=false;return true;}catch{storageSaveFailed=true;saveStatus('浏览器未能保存选择，请保持页面打开后重试；当前修改仍在本页。');return false;}};
 function saveAndReturn(){
  if(!save())return false;
  const ready=syncSelection(true),reason=ready?'':$('entryStatus').textContent;
  saveStatus(ready?'已保存。':`草稿已保存；${reason}`);
  onDraftSaved({ready,reason});return true;
 }
 const selection=()=>({...state.selection,hitMultiplier:state.hitParameters[hitKey()]?.hitMultiplier,hitDamageRatio:state.hitParameters[hitKey()]?.hitDamageRatio,hitScaleStage:state.hitParameters[hitKey()]?.hitScaleStage});
 const selectedMove=()=>[...(profile?.moves||[]),...(profile?.magic||[])].find(m=>m.id===state.selection.preset);
 const paramKey=()=>`${state.selection.attack}:${state.selection.preset||'unselected'}`;
 const hitKey=()=>`${paramKey()}:${state.selection.dualWield?'dual':'single'}`;
 const decisions=()=>{const values={...state.decisions};for(const row of compared){const key=decisionKey(row);if(state.removedEffects[effectSelectionKey(row)])values[key]={choice:'exclude'};
  // The six-stat source choice adopts the final panel. These reference entries
  // do not become damage bonuses and need no second approval in a hidden table.
  else if(!panelTypes.has(row.effect.type)&&!summaryTypes.has(row.effect.type))values[key]={choice:(row.effect.type==='hit'&&state.selection.dualWield||row.effect.type==='critPermission'&&state.selection.criticalEnabled)?(row.compatible?'reader':'web'):'exclude'};
  else if(panelTypes.has(row.effect.type)&&(!values[key]||values[key].choice==='pending'))values[key]={choice:'web'};
 }return values;};
 function websitePanel(source=currentPanelReport()){
  const base={...profile.baseStats,...state.base},equipment={equipment:profile.equipment||[]};
  const computed=calculateWebsitePanel(base,{...source,excludedEquipmentStats:currentPanelReport().excludedEquipmentStats},equipment);
  // Keep eligible full-HP definitions to interpret past reader observations.
  // They are not automatically applied to the current simulated condition.
  const fullReport=retargetReport({...report,context:{...report.context,accountBlessings:state.accountBlessings}},{...state.selection,fullHp:true});
  const potential=calculateWebsitePanel(base,currentPanelReport(fullReport),equipment);
  for(const [key,stat] of Object.entries(computed.stats)){
   stat.runtimeCandidates=[...new Map([...stat.buffs,...potential.stats[key].buffs.filter(b=>b.hpCondition?.field==='fullHp')].map(b=>[b.id,b])).values()];
   stat.runtimeConditions={fullHp:state.selection.fullHp,...(state.selection.fullHp?{lowHp:false}:{})};
  }
  return computed;
 }
 function invalidate(message='数据待核对，确认后才会用于伤害计算。') {confirmed=false;onInvalidate(message);$('entryStatus').textContent=message;$('entryReviewSummary').textContent=message;}
 function saveParameter(id){state.parameters[paramKey()]={...state.parameters[paramKey()],[id]:$(id).value};save();}
 function setParameters() {
  const move=selectedMove(),p=state.parameters[paramKey()],mappingKey=`${unit?.unitId}:${paramKey()}`,mapped=state.readerSkillMappings[mappingKey];
  const read=readMoveParameters(unit,mapped?{...move,skillId:mapped}:move);
  const expected=move?.kind?.startsWith('s')?'skill':move?.kind;
  const choices=(unit?.skills||[]).filter(s=>!s.kind||s.kind===expected);
  $('readerSkillControl').hidden=!choices.length;
  $('readerSkillPick').innerHTML=option('','自动对应同名招式',mapped||'')+choices.map(s=>option(String(s.skillId),`${s.name||'未命名'} · ${s.skillId}`,mapped||'')).join('');
  for(const id of parameterIds)$(id).value=p?.[id]!==''&&p?.[id]!=null?p[id]:id==='hits'?'':read.parameters[id]??'';
  $('parameterReadNote').textContent=read.source;
 }
 function renderPresets(reset=false) {
  const magic=['magic','heavy_magic'].includes(state.selection.attack);
  const list=magic?(profile?.magic||[]):(profile?.moves||[]).filter(m=>m.kind===state.selection.attack);
  if(reset||!list.some(m=>m.id===state.selection.preset))state.selection.preset=magic?'':list[0]?.id||'';
  $('preset').innerHTML=option('','请选择具体招式',state.selection.preset)+list.map(m=>option(m.id,`${m.name}${m.purpose==='support'?'（辅助，不计算攻击伤害）':''}`,state.selection.preset)).join('');
  $('preset').disabled=false;
 }
 function applyMove() {
  const move=selectedMove();
  state.selection.element=move?.element||'';
  state.selection.statReference=move?.statReference||'';
  if(['magic','heavy_magic'].includes(state.selection.attack))state.selection.type='magical';
  else state.selection.type='';
  for(const key of ['element','statReference','type'])$(key).value=state.selection[key];
  setParameters();
 }
 function updateCandidate() {
  if(!report)return;
  candidate=retargetReport({...report,context:{...report.context,accountBlessings:state.accountBlessings}},state.selection);
  readerBonuses=selectReaderCriticalBonuses(evaluateReaderBonuses(unit?.bonuses||[],candidate.context),candidate);
  compared=compareCandidates(websiteCandidates(candidate),readerBonuses,state.mappings,candidate.context);
  // The mode switches activate configured skills. Approve their known scopes
  // together with a group selection, so toggling a mode can add its sources.
  const modesReport=retargetReport({...report,context:{...report.context,accountBlessings:state.accountBlessings}},{...state.selection,criticalEnabled:true,specialAttack:true,fullHp:true,break:true});
  const modesBonuses=selectReaderCriticalBonuses(evaluateReaderBonuses(unit?.bonuses||[],modesReport.context),modesReport);
  const modesCompared=compareCandidates(websiteCandidates(modesReport),modesBonuses,state.mappings,modesReport.context);
  potentialModeGroups=buildBonusComparison(modesCompared,modesBonuses,modesReport.context,{removed:state.removedEffects,decisions:state.decisions});
  modeCatalog=modeGroupCatalog(potentialModeGroups);
  // One-time upgrade for previously saved choices in this exact report/unit.
  for(const [id,approved] of Object.entries(groupReaderChoices))if(!Object.hasOwn(approved,'modeWeb')){
   Object.assign(approved,upgradeReaderGroupChoice(approved,modeCatalog[id]));
  }
  supplements=readerSupplementCandidates(readerBonuses,compared,candidate.context);
  for(const row of compared)if(state.decisions[decisionKey(row)]?.choice==='reader'&&!row.compatible)state.decisions[decisionKey(row)]={choice:'pending'};
  for(const row of compared)if(row.modeLinks?.length&&!state.decisions[decisionKey(row)]){
   const prior=bonusGroups.find(g=>g.type===row.effect.type&&g.target===row.effect.target&&g.unit===(row.effect.unit||''));
   const choice=state.bonusPreference||prior?.choice||'reader';
   if(choice==='web'||choice==='reader')state.decisions[decisionKey(row)]={choice:choice==='reader'&&row.compatible?'reader':'web'};
  }
  for(const row of compared)if(row.group==='blessings'&&!state.decisions[decisionKey(row)]&&(!row.reader||(row.compatible&&row.difference===0)))state.decisions[decisionKey(row)]={choice:'web'};
  if(unit)for(const k of Object.keys(SIX_STATS))if(Number.isFinite(readStat(k))&&(!state.statDecisions[k]?.choice||state.statDecisions[k].choice==='pending'))state.statDecisions[k]={...state.statDecisions[k],choice:'reader'};
  $('skillType').value=['magic','heavy_magic'].includes(state.selection.attack)?'magic':/^s[123]$/.test(state.selection.attack)?'skill':state.selection.attack;
  renderProfile();renderReview();save();onSelection(selection());
 }
 function renderProfile() {
  $('entryProfileName').textContent=`${profile.name} · 最大成长基础资料`;
  const current=currentBlessings(),base={...profile.baseStats,...state.base},adjusted=withAccountBlessings(base,current),percentages=blessingPercentages(current);
  $('entrySixStats').innerHTML=`<thead><tr>${Object.values(SIX_STATS).map(label=>`<th>${label}</th>`).join('')}</tr></thead><tbody><tr>${Object.keys(SIX_STATS).map(k=>`<td><strong>${esc(base[k]?.toLocaleString('en-US')??'未提供')}</strong><small>加护 +${esc(percentages[k])}%<br>→ ${esc(adjusted[k]?.toLocaleString('en-US')??'未提供')}</small></td>`).join('')}</tr></tbody>`;
 }
 function currentBlessings() {
  return {rows:currentPanelReport().rows.filter(r=>r.group==='blessings')};
 }
 function panelsPreview(){
  if(!profile||!candidate)return {};
  const computed=websitePanel(),blessed=withAccountBlessings({...profile.baseStats,...state.base},currentPanelReport());
  return Object.fromEntries(Object.keys(SIX_STATS).map(k=>{const d=state.statDecisions[k]||{};return [k,d.choice==='reader'?readStat(k):d.choice==='website'?computed.values[k]:d.choice==='manual'?d.value:d.choice==='blessed'?blessed[k]:d.choice==='base'?state.base[k]??profile.baseStats[k]:null];}));
 }
 function currentPanelReport(source=candidate||report) {
  const rows=source?.rows||[],selected=decisions(),excludedEquipmentStats=[];
  const sourceRows=source===candidate?compared:compareCandidates(websiteCandidates(source),readerBonuses,state.mappings,source.context);
  for(const row of compared)if(selected[decisionKey(row)]?.choice==='exclude'&&row.effect.type==='equipmentStat'&&row.effect.unit==='')excludedEquipmentStats.push({sourceId:row.sourceId,sourceName:row.sourceName,target:row.effect.target});
  return {...source,excludedEquipmentStats,rows:rows.map(r=>{
   const effects=[],effectIndices=[];
   r.rule.effects.forEach((effect,i)=>{
    const index=r.effectIndices?.[i]??i;
    const row=sourceRows.find(w=>w.sourceId===r.sourceId&&w.ruleId===r.rule.id&&w.index===index);
    const decision=row&&selected[decisionKey(row)];
    const identity={id:`${r.sourceId}:${r.rule.id}:${index}`,effect,condition:r.rule.conditions};
    if(decision?.choice==='exclude'||state.removedEffects[effectSelectionKey(identity)])return;
    effects.push(decision?.choice==='manual'?{...effect,value:Number.isFinite(decision.value)?decision.value:NaN}:decision?.choice==='reader'?{...effect,value:row.compatible?row.reader.value:NaN}:effect);
    effectIndices.push(index);
   });
   return {...r,effectIndices,rule:{...r.rule,effects}};
  })};
 }
 function sourceLine(sourceName,effect,index,extra='') {
  return `<li><span>${esc(sourceName)}：${esc(formatEffect(effect))}${extra}</span>${index>=0?`<button type="button" class="entry-delete" data-entry-delete="${index}" aria-label="删除${esc(sourceName)}的${esc(effect.target)}">删除</button>`:''}</li>`;
 }
 function renderBonusReview() {
  supplements=readerSupplementCandidates(readerBonuses,compared,candidate.context);
  bonusGroups=withReaderGroupChoices(includeSupplementGroups(buildBonusComparison(compared,readerBonuses,candidate.context,{removed:state.removedEffects,decisions:decisions()}),supplements,supplementChoices),groupReaderChoices,modeCatalog);
  const val=(n,u)=>`${n.toLocaleString('en-US')}${u}`;
  const inventory=unit?.raw,states=readerBonuses.map(b=>readerBonusState(b,candidate.context));
  const count=status=>states.filter(s=>s.status===status).length;
  $('entryReadCoverage').textContent=unit?`采集 ${inventory?.buffsRead??'未知'} / ${inventory?.buffsListed??'未知'} 条 Buff；当前条件符合 ${count('active')} 项，条件不符合 ${count('inactive')} 项，条件待确认 ${count('pending')} 项，其他已说明 ${count('documented')} 项，已涵盖派生操作 ${count('covered')} 项，待解析 ${count('unresolved')} 项。配置条目不等于已触发。`:'导入报告后显示采集与解析情况。';
  const crt=observedCritical(selectedUnit());$('entryObservedCritical').textContent=crt.value==null?'暴击面板：未读取。':`读取器观察时暴击率：${crt.value}%。${crt.note}`;
  $('entryBonusReview').innerHTML=bonusGroups.map((g,i)=>{
   const difference=g.difference==null?'':g.fullyMapped?`<small class="entry-panel-difference ${g.difference===0?'is-match':'is-different'}">${g.difference===0?`数值一致${g.candidate?'（候选）':''}`:`网站比读取器${g.difference>0?'多':'少'} ${val(Math.abs(g.difference),g.unit)}`}</small>`:`<small class="entry-panel-missing">已读部分，待完整核对</small>`;
   const formula=g.web.map(r=>val(r.effect.value,g.unit)).join(' + ');
   const webDetails=`<details data-entry-details="${esc(g.id)}"><summary>计算明细与加成来源</summary><p class="entry-bonus-formula">${esc(formula?`${formula} = ${val(g.total,g.unit)}`:'当前无计入项目')}</p><ul class="entry-source-list">${g.web.map(r=>sourceLine(r.sourceName,r.effect,compared.indexOf(r))).join('')}</ul></details>`;
   const readDetails=g.reader.length?`<details data-entry-details="reader:${esc(g.id)}"><summary>计算明细与加成来源</summary><p class="entry-bonus-formula">${esc(g.reader.map(r=>val(r.value,g.unit)).join(' + '))} = ${esc(val(g.readTotal,g.unit))}</p><ul class="entry-source-list">${g.reader.map(r=>`<li><span>${esc(r.sourceName||r.id)}：${esc(val(r.value,g.unit))}<small>${r.state==='observed'?'读取观测':'配置候选，未证明本次触发'}${r.websiteCondition?'；按对应网站条件筛选':''}${r.decoded?.note?`；${esc(r.decoded.note)}`:''}</small></span></li>`).join('')}</ul></details>`:'';
   return `<tr data-bonus-group="${esc(g.id)}"><td><b>${esc(g.target)}${g.criticalOnly?'（仅暴击）':''}${g.type==='cap'&&g.unit==='%'?'（百分比）':''}</b></td><td><strong class="entry-panel-total" data-website-bonus="${i}">${esc(val(g.total,g.unit))}</strong>${difference}${webDetails}</td><td><strong class="entry-panel-total" data-reader-bonus="${i}">${g.readTotal==null?'未读到':esc(val(g.readTotal,g.unit))}</strong>${g.reader.length?`<small>${g.candidate?'候选小计':'已读小计'} · ${g.reader.length} 项</small>`:''}${readDetails}</td><td>${g.web.length||g.reader.length?`<select data-entry-bonus-choice="${i}" aria-label="${esc(g.target)}采用数据">${option('pending','待选择',g.choice)}${g.web.length?option('web','网站',g.choice):''}${g.canUseReader?option('reader','读取器',g.choice):'<option value="reader" disabled title="没有符合当前条件且未被删除的读取器加成">读取器</option>'}${!['pending','web','reader'].includes(g.choice)?option(g.choice,'逐项设置',g.choice):''}</select>${g.readerGroupStale?'<small>来源或数值已变化，请重新选择。</small>':''}${g.readerGroupSelected&&g.modeWebsiteFallback.length?`<small>${esc([...new Set(g.modeWebsiteFallback.flatMap(r=>r.modeLinks))].map(m=>MODE_LABELS[m]).join('、'))}模式 +${esc(val(g.modeWebsiteTotal,g.unit))}（网站）<br>采用 ${esc(val(g.adoptedTotal,g.unit))}</small>`:''}${g.adoptableReader.length<g.reader.length?`<small>你已删除或排除 ${g.reader.length-g.adoptableReader.length} 项对应来源，采用小计 ${esc(val(g.adoptableTotal,g.unit))}。</small>`:''}`:'<small>暂无可采用来源</small>'}</td></tr>`;
  }).join('')||'<tr><td colspan="4">当前没有可比较的伤害加成或上限项目。</td></tr>';
  const removed=Object.entries(state.removedEffects);
  $('entryRemovedDetails').hidden=!removed.length;$('entryRemovedCount').textContent=`已删除的加成（${removed.length}）`;
  $('entryRemovedEffects').innerHTML=removed.map(([key,r])=>`<li><span>${esc(r.sourceName)}：${esc(formatEffect(r.effect))}</span><button type="button" data-entry-restore="${esc(key)}">恢复</button></li>`).join('');
 }
 function renderSnapshotPicker() {
  const samples=readerPanelSnapshots(unit);
  $('entrySnapshotControl').hidden=!samples.length;
  $('entrySnapshotPick').innerHTML=option('entry','首次入场观察',snapshotSelection)+samples.map(s=>option(s.id,`${(s.elapsedMs/1000).toFixed(2)} 秒 · 法强 ${s.stats.intelligence} / 防御 ${s.stats.defense} / 魔抗 ${s.stats.mind}${s.stableForMs>=750?' · 稳定观察':' · 变化中'}`,snapshotSelection)).join('');
  $('entrySnapshotNote').textContent=!unit?'':samples.length?'默认采用报告中最近的稳定快照。可以选择其他采样时刻；整组六维一起切换，Buff 候选仍以原入场清单为准。':'这份报告只保存了最初的面板，缺少战斗中的六维。请用 v0.37 或更新版重新读取一场；旧报告也可配合结算 CSV 补入攻击时法强。';
 }
 $('entrySnapshotPick').addEventListener('change',e=>{
  const id=e.target.value;
  if(id!=='entry'&&!readerPanelSnapshots(unit).some(s=>s.id===id))return;
  snapshotSelection=id;attackObservations={};
  invalidate('已切换读取器面板时刻，请保存并返回。');
  onRead({battle,unit:selectedUnit(),panelOnly:true});save();renderReview();
 });
 function renderReview() {
  const openDetails=new Set([...document.querySelectorAll('[data-entry-details][open]')].map(el=>el.dataset.entryDetails));
  renderSnapshotPicker();
  const move=selectedMove();
  $('entryMoveNote').textContent=move?`${move.source}：${move.name}。${move.purpose==='support'?'这是辅助魔法，不按攻击伤害计算。':''}${state.selection.attack==='heavy_magic'?'按你选定的重魔法条件核对。':''}`:'请选择攻击方式和具体招式。';
  $('entryCandidateCount').textContent=`${compared.length} 项加成${state.accountBlessings?'（含账户加护）':''}`;
  const pending=candidate.rows.filter(r=>r.status==='pending');
  $('entryPendingCount').textContent=`网站待确认项（${pending.length}）`;
  $('entryPending').innerHTML=pending.map(r=>`<li><b>${esc(r.sourceName)}</b><small>${r.reasons.map(esc).join('；')}</small></li>`).join('')||'<li>没有待确认项。</li>';
  const readerOptions=(row)=>option('','未对应',state.mappings[row.id]||'')+readerBonuses.filter(b=>b.effectType===row.effect.type&&b.target===row.effect.target&&b.unit===(row.effect.unit||'')).map(b=>option(b.id,`${b.sourceName||b.id}：${b.value??'未解析'}${b.unit||''}`,state.mappings[row.id]||row.reader?.id)).join('');
  const selected=decisions();
  const special=candidate.rows.flatMap(r=>r.rule.effects.filter(e=>['hit','killer','critPermission','defenseReference','statReference'].includes(e.type)).map(effect=>({sourceName:r.sourceName,effect,conditions:r.rule.conditions})));
  $('entrySpecialSection').hidden=!special.length;
  $('entrySpecialReview').innerHTML=special.map(r=>`<tr><td><b>${esc(r.sourceName)}</b></td><td>${esc(formatEffect(r.effect))}${r.conditions.length?`<small>${esc(r.conditions.map(describeCondition).join('；'))}</small>`:''}</td></tr>`).join('');
  $('entryEffectsReview').innerHTML=compared.flatMap((r,i)=>{
   if(!panelTypes.has(r.effect.type)&&!summaryTypes.has(r.effect.type))return [];
   const d=selected[decisionKey(r)]||{},numeric=typeof r.effect.value==='number';
   return `<tr><td><b>${esc(r.sourceName)}</b><small>${esc(formatEffect(r.effect))}</small></td><td>${esc(r.effect.value)}${esc(r.effect.unit||'')}<small>${esc(r.group==='blessings'?'账户加护默认值':'网站条件推演')}</small></td><td>${r.reader?`${esc(r.effect.type==='hit'?formatEffect({type:'hit',...r.reader}):`${r.reader.value??'未解析'}${r.reader.unit||''}`)}<small>${esc(r.reader.state==='observed'?'读取观测':'读取候选，未证明触发')}</small><details><summary>读取条件与原始字段</summary><small>Process ${esc(r.reader.processId??'—')} · Condition ${esc(r.reader.conditionId??'—')} · ${esc(r.reader.decoded?.stage==='runtime'?'实时属性层（HP条件）':r.reader.raw?.component||'阶段未解析')}</small><pre>${esc(JSON.stringify(r.reader.raw??r.reader,null,2))}</pre></details>`:'未对应'}<details><summary>选择读取来源</summary><select data-entry-map="${i}" aria-label="${esc(r.sourceName)}读取来源">${readerOptions(r)}</select></details></td><td>${esc(r.comparison)}${r.difference!=null?`<small>差值 ${r.difference>=0?'+':''}${esc(r.difference)}${esc(r.effect.unit||'')}</small>`:''}</td><td><select data-entry-choice="${i}" aria-label="${esc(r.sourceName)}核对决定"${r.effect.type==='hit'&&!state.selection.dualWield?' disabled':''}>${option('pending','待决定',d.choice||'pending')}${option('web','网站',d.choice)}${r.compatible&&r.reader?.value!=null&&r.effect.type!=='statReference'?option('reader','读取器',d.choice):''}${numeric?option('manual','手动填写',d.choice):''}${option('exclude','暂不计入',d.choice)}</select>${numeric?`<input data-entry-value="${i}" type="number" step="any" value="${esc(d.value??'')}" placeholder="自填数值" aria-label="${esc(r.sourceName)}手动数值"${d.choice==='manual'?'':' hidden'}>`:''}</td></tr>`;
  }).join('');
  const computed=websitePanel();
  $('entryStatReview').innerHTML=Object.entries(SIX_STATS).map(([k,label])=>{
   const d=state.statDecisions[k]||{},base=state.base[k]??profile.baseStats[k],observed=readStat(k),obs=observation(k);
   const p=computed.stats[k],diff=typeof observed==='number'&&p.value!=null?p.value-observed:null;
   const value=p.value==null?'待补齐':p.value.toLocaleString('en-US');
   const difference=diff==null?'':`<small class="entry-panel-difference ${diff===0?'is-match':'is-different'}">${diff===0?'与读取器一致':`当前条件比${obs.kind==='entry'?'入场':obs.kind==='snapshot'?'所选快照':'攻击时'}观察${diff>0?'多':'少'} ${Math.abs(diff).toLocaleString('en-US')}`}</small>`;
   return `<tr><td><b>${label}</b></td><td><strong class="entry-panel-total" data-website-panel="${k}">${esc(value)}</strong>${p.value==null?`<small>已算部分：${esc(p.subtotal??'—')}</small>`:'<small>本次勾选加成计算结果</small>'}${difference}${p.buffs.length?`<small>入场前面板（实时增益前）：${esc(p.beforeBuff??'—')}</small>`:''}${p.issues.map(msg=>`<small class="entry-panel-missing">${esc(msg)}</small>`).join('')}<details data-entry-details="stat:${k}"><summary>计算明细与加成来源</summary><ol class="entry-panel-steps">${p.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><ul class="entry-source-list">${p.sources.map(s=>sourceLine(s.sourceName,s.effect,compared.findIndex(r=>r.sourceId===s.sourceId&&r.ruleId===s.ruleId&&r.index===s.effectIndex))).join('')||'<li>无额外属性加成</li>'}</ul></details></td><td><strong class="entry-panel-total">${esc(observed==null?'未读到':observed.toLocaleString('en-US'))}</strong><small>${esc(obs.label)}${k==='hp'||k==='mp'?'（上限）':''}</small><small>${esc(obs.time||'采样时间未提供')}</small><small>${esc(obs.note)}</small>${attackObservations[k]?`<small>原入场值：${esc(unit.stats[k]??'未读取')}</small><button type="button" data-entry-restore-observation="${k}">恢复所选快照</button>`:''}</td><td><select data-entry-stat="${k}" aria-label="${label}面板来源">${option('pending','待决定',d.choice||'pending')}${p.value!=null?option('website','网站',d.choice):''}${observed!=null?option('reader','读取器',d.choice):''}${option('manual','手动',d.choice)}${option('blessed','基础＋加护',d.choice)}${option('base','角色基础',d.choice)}</select><input data-entry-stat-value="${k}" type="number" min="0" max="100000000" step="1" value="${esc(d.value??'')}" aria-label="${label}手动面板"${d.choice==='manual'?'':' hidden'}></td></tr>`;
  }).join('');
  renderBonusReview();
  const mapped=new Set(compared.filter(r=>r.compatible).map(r=>r.reader?.id).filter(Boolean));
  const blessings=readerBonuses.filter(b=>b.decoded?.accountBlessing);
  $('entryReadBlessingsDetails').hidden=!blessings.length;
  $('entryReadBlessingsCount').textContent=`读取器账户加护（${blessings.length}）`;
  $('entryReadBlessings').innerHTML=blessings.map(b=>{
   const status=readerBonusState(b,candidate.context);
   const removed=['inactive','disabled','removed'].includes(b.state)||b.raw?.buffRemoved===1||b.raw?.buffIgnored===1||b.raw?.buffEnabled===0;
   const webRows=compared.filter(r=>r.reader?.id===b.id);
   const excluded=webRows.length&&webRows.every(r=>selected[decisionKey(r)]?.choice==='exclude');
   const reason=removed?status.reason:b.effectType==='defense'?'减伤效果：已识别，单独保留，不加入输出增伤或六维面板。':
    excluded?'网站未计入：你已删除或排除此项；读取记录保留。':
    candidate.context.accountBlessings===false?'网站未计入：账户加护已关闭；读取记录保留。':
    mapped.has(b.id)?'已对应网站项目；采用数据及删除状态以上方选择为准。':
    status.status==='active'?'符合当前条件，网站尚未对应。':status.reason||'条件待确认。';
   return `<li data-reader-blessing="${esc(b.decoded.accountBlessing.localId)}"><b>${esc(b.sourceName)}</b><div>${esc(b.decoded.accountBlessing.description)}</div><small>${esc(reason)}</small><details data-entry-details="blessing:${esc(b.id)}"><summary>原始证据</summary><p>来源：${b.decoded.accountBlessing.identificationBasis==='user-confirmed-account-blessing'?'你确认的账户加护':'裸装对照确认的账户加护'} · 技能 ID ${esc(b.raw.localId)}。这是读取到的配置，非逐击触发证明。</p><pre>${esc(JSON.stringify(b.raw,null,2))}</pre></details></li>`;
  }).join('');
  const unmatched=readerBonuses.filter(b=>!mapped.has(b.id)&&!b.decoded?.accountBlessing);
  supplements=readerSupplementCandidates(readerBonuses,compared,candidate.context);
  $('entrySupplementSection').hidden=!supplements.length;
  const groupReaderIds=adoptedGroupReaderIds(bonusGroups);
  $('entrySupplementReview').innerHTML=supplements.map((b,i)=>`<tr><td><b>${esc(b.sourceName||b.id)}</b><small>${esc(b.decoded.conditions.map(describeCondition).join('；')||'已解析配置')}</small></td><td>${esc(b.target)} +${esc(b.value)}%<small>配置候选，需选择采用</small></td><td><select data-reader-supplement="${i}" aria-label="${esc(b.sourceName)}补充加成"${groupReaderIds.has(b.id)?' disabled':''}>${option('pending','待选择（暂不计入）',groupReaderIds.has(b.id)?'reader':supplementChoices[supplementKey(b)]||'pending')}${option('reader','读取器',groupReaderIds.has(b.id)?'reader':supplementChoices[supplementKey(b)])}${option('exclude','不计入',groupReaderIds.has(b.id)?'reader':supplementChoices[supplementKey(b)])}</select>${groupReaderIds.has(b.id)?'<small>已由上方整组采用，只计入一次。</small>':''}</td></tr>`).join('');
  const unresolved=unmatched.filter(b=>readerBonusState(b,candidate.context).status==='unresolved').length;
  $('entryUnmatchedCount').textContent=`其他读取记录（${unmatched.length}，其中 ${unresolved} 项待解析）`;
  $('entryUnmatched').innerHTML=unmatched.map(b=>{const status=readerBonusState(b,candidate.context);return `<li><b>${esc(b.sourceName||b.id)}</b>：${esc(b.target||b.effectType||'未解析')} ${esc(b.value??'数值未解析')}${esc(b.unit||'')}<small>${esc(status.reason)}${b.decoded?.note?`；${esc(b.decoded.note)}`:''}</small><details><summary>原始证据</summary>${b.decoded?.documentation?`<p>游戏脚本：${esc(b.decoded.documentation.description)}</p>`:''}<pre>${esc(JSON.stringify(b.raw??b,null,2))}</pre></details></li>`;}).join('')||'<li>没有其他读取记录。</li>';
  for(const el of document.querySelectorAll('[data-entry-details]'))if(openDetails.has(el.dataset.entryDetails))el.open=true;
  syncSelection();
 }
 function initialize() {
  initialized=true;
  state.selection={attack:report.context.attack==='magic'?'magic':report.context.attack||'normal',type:report.context.damageType||'',element:'',statReference:'',dualWield:false,criticalEnabled:report.context.attack!=='magic',fullHp:report.context.fullHp===true,specialAttack:report.context.killer===true,break:report.context.break===true,...state.selection};
  for(const id of ['dualWield','specialAttack','break','fullHp','criticalEnabled'])$(id).checked=state.selection[id]===true;
  $('characterPanel').hidden=false;$('entryPreparation').hidden=false;$('entryReview').hidden=false;$('attackChoice').closest('label').hidden=false;$('statReference').closest('label').hidden=false;
  $('skillType').closest('label').hidden=true;
  $('attackChoice').innerHTML=ATTACK_CHOICES.map(([v,l])=>option(v,l,state.selection.attack)).join('');
  if(!$('element').querySelector('option[value=""]'))$('element').insertAdjacentHTML('afterbegin','<option value="">待确认</option>');
  if(!$('type').querySelector('option[value=""]'))$('type').insertAdjacentHTML('afterbegin','<option value="">待确认</option>');
  renderProfile();renderPresets();
  for(const key of ['element','statReference','type']){$(key).value=state.selection[key]||'';$(key).disabled=false;}
  setParameters();$('skillDetails').open=true;$('hitDetails').open=true;
 }
 function receive(next) {
  if(!next.profile)throw new Error('角色固定资料尚未带入，请刷新角色页面后重新打开。');
  if(next.profile.characterId!==characterId)throw new Error('角色固定资料与当前角色不一致。');
  const fingerprint=meaningful(next);if(fingerprint===signature)return;
  signature=fingerprint;report=clone(next);profile=report.profile;
  if(!initialized)initialize();
  invalidate('固定资料已补齐；导入读取报告后可填写参数并核对面板。');updateCandidate();
 }
 async function importFile(file) {
  if(!file)return;if(file.size>25_000_000)throw new Error('报告超过25MB，请使用读取器生成的入场JSON报告。');
  const generation=++importGeneration;
  let text,nextBattle,digest;
  try{text=await file.text();if(generation!==importGeneration)return;nextBattle=validateBattleEntry(JSON.parse(text));digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));}
  catch(err){if(generation!==importGeneration)return;throw err;}
  if(generation!==importGeneration)return;
  rememberReaderDraft();reportFingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  battle=nextBattle;unit=null;
  $('entryUnit').innerHTML=option('','请选择本次测试角色','')+battle.units.map((u,i)=>option(String(i),`${u.name||'未命名'} · Unit ${u.unitId}`,'')).join('');
  $('entryFileNote').textContent=`${file.name} · ${battle.testFixture?'模拟示例，非实际战斗 · ':''}${battle.capturedAt||'时间未提供'} · ${battle.snapshotState==='partial'?'部分读取，缺项不代表没有效果':'入场报告'}。${battle.normalization?.mpThousandths?'MP已按游戏显示单位修正，原始值保留。':''}请选择正确角色；Buff清单本身不代表全部触发。`;
  if(battle.units.length===1){unit=battle.units[0];$('entryUnit').value='0';}
  const restored=restoreReaderDraft();
  invalidate('报告已载入；已有资料已暂填，请在面板与加成核对页确认。');setParameters();onRead({battle,unit:selectedUnit()});updateCandidate();
  if(restored&&!storageSaveFailed)saveStatus('已恢复这份报告、这个角色的核对选择和面板时刻。');
 }
 $('entryReportFile').addEventListener('change',async e=>{try{await importFile(e.target.files[0]);}catch(err){invalidate(`新文件未导入：${err.message}`);}e.target.value='';});
 $('readerSkillPick').addEventListener('change',e=>{state.readerSkillMappings[`${unit?.unitId}:${paramKey()}`]=e.target.value;state.parameters[paramKey()]={...state.parameters[paramKey()],coefficient:'',skillPercent:'',skillAdd:'',skillPostAdd:''};setParameters();save();syncSelection();});
 $('entryUnit').addEventListener('change',e=>{rememberReaderDraft();unit=battle?.units[Number(e.target.value)]||null;if(e.target.value==='')unit=null;restoreReaderDraft();invalidate('读取资料已暂填；数值差异由你决定。');setParameters();onRead({battle,unit:selectedUnit()});updateCandidate();});
 $('entrySupplementReview').addEventListener('change',e=>{const b=supplements[Number(e.target.dataset.readerSupplement)];if(!b||adoptedGroupReaderIds(bonusGroups).has(b.id))return;supplementChoices[supplementKey(b)]=e.target.value;invalidate('读取器补充加成已更新。');save();renderReview();});
 for(const id of ['dualWield'])$(id).addEventListener('change',()=>{state.selection[id]=$(id).checked;save();renderReview();onSelection(selection());});
 for(const id of ['specialAttack','break','fullHp','criticalEnabled'])$(id).addEventListener('change',()=>{
  state.selection[id]=$(id).checked;invalidate('战斗选项已改变，按本次条件重新核对加成。');updateCandidate();
 });
 $('attackChoice').addEventListener('change',()=>{state.selection.attack=$('attackChoice').value;renderPresets(true);applyMove();invalidate('攻击方式已改变，请核对这次攻击对应的加成。');updateCandidate();});
 $('preset').addEventListener('change',()=>{if(!initialized)return;state.selection.preset=$('preset').value;applyMove();invalidate('具体招式已改变，倍率与命中数按该招式单独保留。');updateCandidate();});
 for(const id of ['element','statReference','type'])$(id).addEventListener('change',()=>{if(!initialized)return;state.selection[id]=$(id).value;invalidate();updateCandidate();});
 for(const id of parameterIds)$(id).addEventListener('change',()=>{if(initialized)saveParameter(id);});
 for(const id of ['hitMultiplier','hitDamageRatio','hitScaleStage'])$(id).addEventListener('change',()=>{
  const draft=state.hitParameters[hitKey()]={...state.hitParameters[hitKey()]};
  if($(id).value==='')delete draft[id];else draft[id]=$(id).value;
  save();onSelection(selection());
 });
 $('reviewPage').addEventListener('click',e=>{
  const remove=e.target.closest('[data-entry-delete]'),restore=e.target.closest('[data-entry-restore]');
  if(!remove&&!restore)return;
  if(remove){const row=compared[Number(remove.dataset.entryDelete)];if(!row)return;state.removedEffects[effectSelectionKey(row)]={sourceName:row.sourceName,effect:clone(row.effect)};}
  else delete state.removedEffects[restore.dataset.entryRestore];
  invalidate(remove?'已删除这条加成，网站数值已重算。':'已恢复这条加成，网站数值已重算。');save();renderProfile();renderReview();
 });
 $('entryBonusReview').addEventListener('change',e=>{
  if(e.target.dataset.entryBonusChoice==null)return;
  const group=bonusGroups[Number(e.target.dataset.entryBonusChoice)],choice=e.target.value;
  if(!group||!['web','reader','pending'].includes(choice)||choice==='reader'&&!group.canUseReader)return;
  chooseBonusGroup(group,choice);
  invalidate();save();renderProfile();renderReview();
 });
 function chooseBonusGroup(group,choice) {
  if(choice==='reader'){groupReaderChoices[group.id]=readerGroupChoice(group);return;}
  delete groupReaderChoices[group.id];
  for(const row of group.web)state.decisions[decisionKey(row)]={choice};
  for(const b of supplements.filter(b=>group.reader.some(r=>r.id===b.id)))supplementChoices[supplementKey(b)]=choice==='web'?'exclude':choice;
 }
 function clearGroupChoice(row) {
  for(const g of bonusGroups)if([...g.web,...g.removed].some(r=>r.id===row?.id))delete groupReaderChoices[g.id];
 }
 const changeEffect=e=>{
  const el=e.target;
  if(el.dataset.entryMap!=null){const row=compared[Number(el.dataset.entryMap)];clearGroupChoice(row);state.mappings[row.id]=el.value;invalidate();updateCandidate();return;}
  const index=el.dataset.entryChoice??el.dataset.entryValue;if(index==null)return;
  clearGroupChoice(compared[Number(index)]);
  const key=decisionKey(compared[Number(index)]),d=state.decisions[key]||{};
  if(el.dataset.entryChoice!=null)d.choice=el.value;else d.value=el.valueAsNumber;
  state.decisions[key]=d;invalidate();save();renderProfile();renderReview();
 };
 $('entryEffectsReview').addEventListener('change',changeEffect);
 $('entryStatReview').addEventListener('change',e=>{const el=e.target,key=el.dataset.entryStat??el.dataset.entryStatValue;if(!key)return;const d=state.statDecisions[key]||{};if(el.dataset.entryStat)d.choice=el.value;else d.value=el.valueAsNumber;state.statDecisions[key]=d;invalidate();save();renderReview();});
 function useBonusGroups(choice) {
  state.bonusPreference=choice;
  let applied=0,skipped=0;
  for(const group of bonusGroups){
   if(choice==='reader'&&!group.canUseReader||choice==='web'&&!group.web.length){skipped++;continue;}
   chooseBonusGroup(group,choice);
   applied++;
  }
  if(choice==='reader')for(const group of withReaderGroupChoices(potentialModeGroups,{},modeCatalog)){
   if(!bonusGroups.some(g=>g.id===group.id)&&group.canUseReader&&group.web.every(r=>r.modeLinks?.length)&&group.adoptableReader.every(b=>b.modeLinks?.length))groupReaderChoices[group.id]=readerGroupChoice(group);
  }
  invalidate();save();renderProfile();renderReview();
  $('entryBonusBulkNote').textContent=`已将 ${applied} 组增伤与上限选择为${choice==='reader'?'读取器':'网站'}。${skipped?`${skipped} 组没有可采用的${choice==='reader'?'读取器':'网站'}来源，保留原选择。`:''}`;
 }
 $('entryUseWeb').addEventListener('click',()=>useBonusGroups('web'));
 $('entryUseReader').addEventListener('click',()=>useBonusGroups('reader'));
 document.querySelectorAll('[data-review-save]').forEach(el=>el.addEventListener('click',saveAndReturn));
 $('entryStatReview').addEventListener('click',e=>{const key=e.target.dataset.entryRestoreObservation;if(!key)return;delete attackObservations[key];invalidate();save();renderReview();});
 $('entryUseStats').addEventListener('click',()=>{if(!unit){$('entryStatus').textContent='请先选择读取报告中的角色。';return;}for(const k of Object.keys(SIX_STATS))if(readStat(k)!=null)state.statDecisions[k]={choice:'reader'};invalidate('已选择读取器观察值；以每项标注的采样时刻为准。');save();renderReview();});
 $('entryUseWebsiteStats').addEventListener('click',()=>{if(!candidate)return;const computed=websitePanel();let count=0;for(const k of Object.keys(SIX_STATS))if(computed.values[k]!=null){state.statDecisions[k]={choice:'website'};count++;}invalidate(`已选择 ${count} 项网站计算结果；仍需确认后应用。`);save();renderReview();});
 function syncSelection(finish=false){
  try {
   if(!unit)throw new Error('请导入一次基础状态战斗报告，并选择本次角色。');
   if(!selectedMove())throw new Error('请选择具体招式。');
   if(selectedMove().purpose==='support')throw new Error('当前是辅助魔法，请改选攻击招式。');
   if(!['str','int','mixed'].includes(state.selection.statReference))throw new Error('请选择攻击力、法强或混合参照。');
   if(!['physical','magical'].includes(state.selection.type)||!state.selection.element)throw new Error('请确认伤害分类和攻击属性。');
   for(const k of Object.keys(SIX_STATS))if(!['reader','manual','blessed','base','website'].includes(state.statDecisions[k]?.choice))throw new Error(`请确认${SIX_STATS[k]}最终采用的数值。`);
   const selected=readerGroupDecisions(bonusGroups,decisions()),pending=compared.filter(r=>!selected[decisionKey(r)]||selected[decisionKey(r)].choice==='pending');
   if(pending.length)throw new Error(`还有 ${pending.length} 项加成未选择采用数据：${pending.slice(0,3).map(r=>`${r.sourceName} · ${r.effect.target}`).join('、')}${pending.length>3?'等':''}。请在“面板与加成核对”选择网站、读取器或暂不计入。`);
   const groupIds=adoptedGroupReaderIds(bonusGroups);
   if(compared.some(r=>selected[decisionKey(r)]?.choice==='reader'&&groupIds.has(r.reader?.id)))throw new Error('同一读取字段不能重复计入多个效果，请重新对应。');
   const reviewed=appendReaderGroups(appendReaderSupplements(resolveReview(candidate,compared,selected),readerBonuses.filter(b=>!groupIds.has(b.id)),compared,supplementChoices),bonusGroups);
   const blessed=withAccountBlessings({...profile.baseStats,...state.base},reviewed);
   const computed=websitePanel({...reviewed,rows:[...reviewed.rows,...candidate.rows.filter(r=>r.status==='pending')]});
   const panels={};for(const k of Object.keys(SIX_STATS)){
    const d=state.statDecisions[k]||{};panels[k]=d.choice==='reader'?readStat(k):d.choice==='website'?computed.values[k]:d.choice==='manual'?d.value:d.choice==='blessed'?blessed[k]:d.choice==='base'?state.base[k]??profile.baseStats[k]:null;
    if(!Number.isFinite(panels[k])||panels[k]<0)throw new Error(`请确认${SIX_STATS[k]}最终采用的数值。`);
   }
   const refs=reviewed.rows.flatMap(r=>r.rule.effects).filter(e=>e.type==='statReference');
   if(refs.some(e=>e.target==='法强')&&state.selection.statReference!=='int')throw new Error('已选规则要求以法强参照；请改选法强，或把该参照规则暂不计入。');
   const defenseRefs=reviewed.rows.filter(r=>r.status==='active').flatMap(r=>r.rule.effects).filter(e=>e.type==='defenseReference');
   if(defenseRefs.some(e=>e.target==='敌方魔抗')&&state.selection.statReference!=='int')throw new Error('已选魔抗修正要求以魔抗结算；请确认属性参照或暂不计入该修正。');
   confirmed=true;
   onConfirm(reviewed,{panels,panelLayers:computed.stats,selection:selection(),profile:{...clone(profile),baseStats:{...profile.baseStats,...state.base}},unitId:unit.unitId,battleId:battle.battleId,finish});
   $('entryStatus').textContent='已按你的选择同步到伤害计算器。修改采用数据会自动更新。';
   $('entryReviewSummary').textContent='已确认面板与加成，已自动带入计算器。';
   return true;
  }catch(err){confirmed=false;$('entryStatus').textContent=err.message;$('entryReviewSummary').textContent=err.message;onInvalidate(err.message);return false;}
 }
 $('entryConfirm').addEventListener('click',saveAndReturn);
 function adoptAttackObservation(sample) {
  const next=capturePanelObservation(battle,unit,sample);if(!next)return false;
  attackObservations=next;
  for(const key of Object.keys(next))state.statDecisions[key]={choice:'reader'};
  invalidate('已采用所选结算样本的攻击时观察值。');save();renderReview();return true;
 }
 function setManualPanel(key,value) {
  if(!unit||!Object.hasOwn(SIX_STATS,key)||!Number.isFinite(value)||value<0)return;
  state.statDecisions[key]={choice:'manual',value};save();invalidate('已保存手填战斗面板。');renderReview();
 }
 function planningBase(){
  if(!report)return null;
  const explicit=state.decisions;
  const rows=report.rows.map(r=>{
   const effects=[],effectIndices=[];
   r.rule.effects.forEach((effect,i)=>{
    const index=r.effectIndices?.[i]??i,identity={id:`${r.sourceId}:${r.rule.id}:${index}`,effect,condition:r.rule.conditions};
    const related=compared.find(w=>w.sourceId===r.sourceId&&w.ruleId===r.rule.id&&w.index===index);
    if(state.removedEffects[effectSelectionKey(identity)]||related&&explicit[decisionKey(related)]?.choice==='exclude')return;
    effects.push(effect);effectIndices.push(index);
   });
   return {...r,rule:{...r.rule,effects},effectIndices};
  });
  return {...report,profile:{...profile,baseStats:{...profile.baseStats,...state.base}},context:{...report.context,accountBlessings:state.accountBlessings},rows};
 }
 return {receive,selection,panelsPreview,planningBase,adoptAttackObservation,setManualPanel,applySelection:syncSelection,saveAndReturn,hasReport:()=>!!report,isConfirmed:()=>confirmed,importFile,reset:()=>{
  state.parameters={};state.hitParameters={};state.decisions={};state.statDecisions={};state.removedEffects={};supplementChoices={};groupReaderChoices={};
  for(const key of ['hitMultiplier','hitDamageRatio','hitScaleStage'])delete state.selection[key];
  if(initialized){state.selection={...state.selection,dualWield:false,criticalEnabled:report.context.attack!=='magic',fullHp:report.context.fullHp===true,specialAttack:report.context.killer===true,break:false};for(const id of ['dualWield','specialAttack','break','fullHp','criticalEnabled'])$(id).checked=state.selection[id];renderPresets();for(const key of ['element','statReference','type'])$(key).value=state.selection[key]||'';setParameters();invalidate();updateCandidate();}save();
 }};
}
