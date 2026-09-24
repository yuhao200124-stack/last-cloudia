import {STAT_MECHANICS_REVISION} from './stat-mechanics.mjs';
import {SIX_STATS,ATTACK_CHOICES,retargetReport,websiteCandidates,validateBattleEntry,compareCandidates,decisionKey,resolveReview} from './entry-preparation.mjs';
import {formatEffect} from './effect-rule-engine.mjs';
import {withAccountBlessings,blessingPercentages} from './account-blessings-panel.mjs';
import {calculateWebsitePanel} from './panel-calculator.mjs';
import {readMoveParameters} from './battle-entry-data.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const clone=x=>JSON.parse(JSON.stringify(x));
const option=(v,label,current)=>`<option value="${esc(v)}"${v===current?' selected':''}>${esc(label)}</option>`;
const meaningful=report=>JSON.stringify({...report,createdAt:''});
export function initEntryWorkflow({characterId,onConfirm,onInvalidate,onSelection,onRead=()=>{}}) {
 const storageKey=`lc-entry-review:${characterId}:v1`;
 let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey))||{};}catch{}
 let state={parameterSchema:2,accountBlessings:true,base:{},selection:saved.selection||{},parameters:saved.parameterSchema===2?saved.parameters||{}:{},hitParameters:saved.hitParameters||{},decisions:saved.decisions||{},statDecisions:saved.statDecisions||{},mappings:saved.mappings||{}};
 if(saved.mechanicsRevision!==STAT_MECHANICS_REVISION)for(const d of Object.values(state.statDecisions))d.choice='pending';
 state.mechanicsRevision=STAT_MECHANICS_REVISION;
 let report=null,profile=null,candidate=null,compared=[],battle=null,unit=null,signature='',initialized=false;
 let confirmed=false,hasApproval=false;
 const parameterIds=['hits','coefficient','skillPercent','skillAdd','skillPostAdd','hitScaleStage'];
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{$('entryStatus').textContent='浏览器未能保存核对选择，请保持当前页面打开。';}};
 const selection=()=>({...state.selection,hitMultiplier:state.hitParameters[hitKey()]?.hitMultiplier,hitDamageRatio:state.hitParameters[hitKey()]?.hitDamageRatio,hitScaleStage:state.hitParameters[hitKey()]?.hitScaleStage||state.parameters[paramKey()]?.hitScaleStage});
 const selectedMove=()=>[...(profile?.moves||[]),...(profile?.magic||[])].find(m=>m.id===state.selection.preset);
 const paramKey=()=>`${state.selection.attack}:${state.selection.preset||'unselected'}`;
 const hitKey=()=>`${paramKey()}:${state.selection.dualWield?'dual':'single'}`;
 const websitePanel=(source=currentPanelReport())=>calculateWebsitePanel({...profile.baseStats,...state.base},source,{equipment:profile.equipment||[]});
 function invalidate(message='数据待核对，确认后才会用于伤害计算。') {confirmed=false;onInvalidate(message);$('entryStatus').textContent=message;$('entryReviewSummary').textContent=message;}
 function saveParameter(id){state.parameters[paramKey()]={...state.parameters[paramKey()],[id]:$(id).value};save();}
 function setParameters() {
  const move=selectedMove(),p=state.parameters[paramKey()],read=readMoveParameters(unit,move);
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
  compared=compareCandidates(websiteCandidates(candidate),unit?.bonuses||[],state.mappings);
  for(const row of compared)if(row.group==='blessings'&&!state.decisions[decisionKey(row)]&&(!row.reader||(row.compatible&&row.difference===0)))state.decisions[decisionKey(row)]={choice:'web'};
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
 function currentPanelReport() {
  const rows=(candidate||report)?.rows||[];
  return {...(candidate||report),rows:rows.map(r=>({...r,rule:{...r.rule,effects:r.rule.effects.flatMap((effect,index)=>{
   const row=compared.find(w=>w.sourceId===r.sourceId&&w.ruleId===r.rule.id&&w.index===index);
   const decision=row&&state.decisions[decisionKey(row)];
   if(decision?.choice==='exclude')return [];
   if(decision?.choice==='manual')return [{...effect,value:Number.isFinite(decision.value)?decision.value:NaN}];
   if(decision?.choice==='reader')return [{...effect,value:row.compatible?row.reader.value:NaN}];
   return [effect];
  })}}))};
 }
 function renderReview() {
  const move=selectedMove();
  $('entryMoveNote').textContent=move?`${move.source}：${move.name}。${move.purpose==='support'?'这是辅助魔法，不按攻击伤害计算。':''}${state.selection.attack==='heavy_magic'?'按你选定的重魔法条件核对。':''}`:'请选择攻击方式和具体招式。';
  $('entryCandidateCount').textContent=`${compared.length} 项加成${state.accountBlessings?'（含账户加护）':''}`;
  const pending=candidate.rows.filter(r=>r.status==='pending');
  $('entryPendingCount').textContent=`网站待确认项（${pending.length}）`;
  $('entryPending').innerHTML=pending.map(r=>`<li><b>${esc(r.sourceName)}</b><small>${r.reasons.map(esc).join('；')}</small></li>`).join('')||'<li>没有待确认项。</li>';
  const readerOptions=(row)=>option('','未对应',state.mappings[row.id]||'')+(unit?.bonuses||[]).filter(b=>b.effectType===row.effect.type&&b.target===row.effect.target&&b.unit===(row.effect.unit||'')).map(b=>option(b.id,`${b.sourceName||b.id}：${b.value??'未解析'}${b.unit||''}`,state.mappings[row.id]||row.reader?.id)).join('');
  $('entryEffectsReview').innerHTML=compared.map((r,i)=>{
   const d=state.decisions[decisionKey(r)]||{},numeric=typeof r.effect.value==='number';
   return `<tr><td><b>${esc(r.sourceName)}</b><small>${esc(formatEffect(r.effect))}</small></td><td>${esc(r.effect.value)}${esc(r.effect.unit||'')}<small>${esc(r.group==='blessings'?'账户加护默认值':'网站条件推演')}</small></td><td>${r.reader?`${esc(r.reader.value??'未解析')}${esc(r.reader.unit||'')}<small>${esc(r.reader.state==='observed'?'读取观测':'读取候选，未证明触发')}</small><details><summary>读取条件与原始字段</summary><small>Process ${esc(r.reader.processId??'—')} · Condition ${esc(r.reader.conditionId??'—')} · ${esc(r.reader.decoded?.stage==='runtime'?'实时属性层（HP条件）':r.reader.raw?.component||'阶段未解析')}</small><pre>${esc(JSON.stringify(r.reader.raw??r.reader,null,2))}</pre></details>`:'未对应'}<details><summary>选择读取来源</summary><select data-entry-map="${i}" aria-label="${esc(r.sourceName)}读取来源">${readerOptions(r)}</select></details></td><td>${esc(r.comparison)}${r.difference!=null?`<small>差值 ${r.difference>=0?'+':''}${esc(r.difference)}${esc(r.effect.unit||'')}</small>`:''}</td><td><select data-entry-choice="${i}" aria-label="${esc(r.sourceName)}核对决定">${option('pending','待决定',d.choice||'pending')}${option('web','采用网站值',d.choice)}${r.compatible&&r.reader?.value!=null&&!['hit','statReference'].includes(r.effect.type)?option('reader','采用读取值',d.choice):''}${numeric?option('manual','手动填写',d.choice):''}${option('exclude','暂不计入',d.choice)}</select>${numeric?`<input data-entry-value="${i}" type="number" step="any" value="${esc(d.value??'')}" placeholder="自填数值" aria-label="${esc(r.sourceName)}手动数值"${d.choice==='manual'?'':' hidden'}>`:''}</td></tr>`;
  }).join('');
  const computed=websitePanel();
  $('entryStatReview').innerHTML=Object.entries(SIX_STATS).map(([k,label])=>{
   const d=state.statDecisions[k]||{},base=state.base[k]??profile.baseStats[k],observed=unit?.stats?.[k];
   const p=computed.stats[k],diff=typeof observed==='number'&&p.value!=null?p.value-observed:null;
   const value=p.value==null?'待补齐':p.value.toLocaleString('en-US');
   const difference=diff==null?'':`<small class="entry-panel-difference ${diff===0?'is-match':'is-different'}">${diff===0?'与读取值一致':`网站比读取${diff>0?'多':'少'} ${Math.abs(diff).toLocaleString('en-US')}`}</small>`;
   return `<tr><td><b>${label}</b></td><td><strong class="entry-panel-total" data-website-panel="${k}">${esc(value)}</strong>${p.value==null?`<small>已算部分：${esc(p.subtotal??'—')}</small>`:'<small>本次勾选加成计算结果</small>'}${difference}${p.buffs.length?`<small>入场前面板（实时增益前）：${esc(p.beforeBuff??'—')}</small>`:''}${p.issues.map(msg=>`<small class="entry-panel-missing">${esc(msg)}</small>`).join('')}<details><summary>计算明细与加成来源</summary><ol class="entry-panel-steps">${p.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><small>${p.sources.map(s=>`${esc(s.sourceName)}：${esc(formatEffect(s.effect))}`).join('<br>')||'无额外属性加成'}</small></details></td><td>${esc(observed??'未读到')}<small>入场最终面板${k==='hp'||k==='mp'?'（上限）':''}</small></td><td><select data-entry-stat="${k}" aria-label="${label}面板来源">${option('pending','待决定',d.choice||'pending')}${p.value!=null?option('website','采用网站计算结果',d.choice):''}${observed!=null?option('reader','采用入场面板',d.choice):''}${option('manual','手动填写最终值',d.choice)}${option('blessed','基础＋已采用加护',d.choice)}${option('base','只用原始基础值（不含加护）',d.choice)}</select><input data-entry-stat-value="${k}" type="number" min="0" max="100000000" step="1" value="${esc(d.value??'')}" aria-label="${label}手动面板"${d.choice==='manual'?'':' hidden'}></td></tr>`;
  }).join('');
  const mapped=new Set(compared.map(r=>r.reader?.id).filter(Boolean));
  const unmatched=(unit?.bonuses||[]).filter(b=>!mapped.has(b.id));
  $('entryUnmatchedCount').textContent=`读取器未对应项（${unmatched.length}）`;
  $('entryUnmatched').innerHTML=unmatched.map(b=>`<li><b>${esc(b.sourceName||b.id)}</b>：${esc(b.target||b.effectType||'未解析')} ${esc(b.value??'数值未解析')}${esc(b.unit||'')}<small>${esc(b.state||'candidate')} · Process ${esc(b.processId??'—')} · Condition ${esc(b.conditionId??'—')}</small><details><summary>原始证据</summary><pre>${esc(JSON.stringify(b.raw??b,null,2))}</pre></details></li>`).join('')||'<li>没有未对应项。</li>';
 }
 function initialize() {
  initialized=true;
  state.selection={attack:report.context.attack==='magic'?'magic':report.context.attack||'normal',type:report.context.damageType||'',element:'',statReference:'',dualWield:report.context.weaponCount===2,specialAttack:report.context.killer===true,break:report.context.break===true,...state.selection};
  for(const id of ['dualWield','specialAttack','break'])$(id).checked=state.selection[id]===true;
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
  signature=fingerprint;report=clone(next);profile=report.profile;hasApproval=false;
  if(!initialized)initialize();
  invalidate('固定资料已补齐；导入读取报告后可填写参数并核对面板。');updateCandidate();
 }
 async function importFile(file) {
  if(!file)return;if(file.size>25_000_000)throw new Error('报告超过25MB，请使用读取器生成的入场JSON报告。');
  battle=validateBattleEntry(JSON.parse(await file.text()));unit=null;hasApproval=false;state.mappings={};state.statDecisions={};
  $('entryUnit').innerHTML=option('','请选择本次测试角色','')+battle.units.map((u,i)=>option(String(i),`${u.name||'未命名'} · Unit ${u.unitId}`,'')).join('');
  $('entryFileNote').textContent=`${file.name} · ${battle.testFixture?'模拟示例，非实际战斗 · ':''}${battle.capturedAt||'时间未提供'} · ${battle.snapshotState==='partial'?'部分读取，缺项不代表没有效果':'入场报告'}。${battle.normalization?.mpThousandths?'MP已按游戏显示单位修正，原始值保留。':''}请选择正确角色；Buff清单本身不代表全部触发。`;
  if(battle.units.length===1){unit=battle.units[0];$('entryUnit').value='0';}
  invalidate('报告已载入；已有资料已暂填，请在面板与加成核对页确认。');setParameters();updateCandidate();onRead({battle,unit});
 }
 $('entryReportFile').addEventListener('change',async e=>{try{await importFile(e.target.files[0]);}catch(err){invalidate(`新文件未导入：${err.message}`);}e.target.value='';});
 $('entryUnit').addEventListener('change',e=>{unit=battle?.units[Number(e.target.value)]||null;if(e.target.value==='')unit=null;hasApproval=false;state.mappings={};state.statDecisions={};invalidate('读取资料已暂填；数值差异由你决定。');setParameters();updateCandidate();onRead({battle,unit});});
 for(const id of ['dualWield','specialAttack','break'])$(id).addEventListener('change',()=>{
  state.selection[id]=$(id).checked;invalidate('战斗选项已改变，按本次条件重新核对加成。');updateCandidate();
  if(hasApproval)$('entryConfirm').click();
 });
 $('attackChoice').addEventListener('change',()=>{state.selection.attack=$('attackChoice').value;renderPresets(true);applyMove();invalidate('攻击方式已改变，请核对这次攻击对应的加成。');updateCandidate();});
 $('preset').addEventListener('change',()=>{if(!initialized)return;state.selection.preset=$('preset').value;applyMove();invalidate('具体招式已改变，倍率与命中数按该招式单独保留。');updateCandidate();});
 for(const id of ['element','statReference','type'])$(id).addEventListener('change',()=>{if(!initialized)return;state.selection[id]=$(id).value;invalidate();updateCandidate();});
 for(const id of parameterIds)$(id).addEventListener('change',()=>{if(initialized)saveParameter(id);});
 for(const id of ['hitMultiplier','hitDamageRatio','hitScaleStage'])$(id).addEventListener('change',()=>{state.hitParameters[hitKey()]={...state.hitParameters[hitKey()],[id]:$(id).value};save();});
 $('entryEffectsReview').addEventListener('change',e=>{
  const el=e.target;
  if(el.dataset.entryMap!=null){state.mappings[compared[Number(el.dataset.entryMap)].id]=el.value;invalidate();updateCandidate();return;}
  const index=el.dataset.entryChoice??el.dataset.entryValue;if(index==null)return;
  const key=decisionKey(compared[Number(index)]),d=state.decisions[key]||{};
  if(el.dataset.entryChoice!=null)d.choice=el.value;else d.value=el.valueAsNumber;
  state.decisions[key]=d;invalidate();save();renderProfile();renderReview();
 });
 $('entryStatReview').addEventListener('change',e=>{const el=e.target,key=el.dataset.entryStat??el.dataset.entryStatValue;if(!key)return;const d=state.statDecisions[key]||{};if(el.dataset.entryStat)d.choice=el.value;else d.value=el.valueAsNumber;state.statDecisions[key]=d;invalidate();save();renderReview();});
 $('entryUseWeb').addEventListener('click',()=>{for(const row of compared)state.decisions[decisionKey(row)]={choice:'web'};invalidate('已选择沿用网站候选；仍需核对面板并确认应用。');save();renderProfile();renderReview();});
 $('entryUseStats').addEventListener('click',()=>{if(!unit){$('entryStatus').textContent='请先选择读取报告中的角色。';return;}for(const k of Object.keys(SIX_STATS))if(unit.stats[k]!=null)state.statDecisions[k]={choice:'reader'};invalidate('已选择入场最终面板；属性加成不会再次乘入。');save();renderReview();});
 $('entryUseWebsiteStats').addEventListener('click',()=>{if(!candidate)return;const computed=websitePanel();let count=0;for(const k of Object.keys(SIX_STATS))if(computed.values[k]!=null){state.statDecisions[k]={choice:'website'};count++;}invalidate(`已选择 ${count} 项网站计算结果；仍需确认后应用。`);save();renderReview();});
 $('entryConfirm').addEventListener('click',()=>{
  try {
   if(!unit)throw new Error('请导入一次基础状态战斗报告，并选择本次角色。');
   if(!selectedMove())throw new Error('请选择具体招式。');
   if(selectedMove().purpose==='support')throw new Error('当前是辅助魔法，请改选攻击招式。');
   if(!['str','int','mixed'].includes(state.selection.statReference))throw new Error('请选择攻击力、法强或混合参照。');
   if(!['physical','magical'].includes(state.selection.type)||!state.selection.element)throw new Error('请确认伤害分类和攻击属性。');
   for(const k of Object.keys(SIX_STATS))if(!['reader','manual','blessed','base','website'].includes(state.statDecisions[k]?.choice))throw new Error(`请确认${SIX_STATS[k]}最终采用的数值。`);
   const reviewed=resolveReview(candidate,compared,state.decisions);
   const blessed=withAccountBlessings({...profile.baseStats,...state.base},reviewed);
   const computed=websitePanel({...reviewed,rows:[...reviewed.rows,...candidate.rows.filter(r=>r.status==='pending')]});
   const panels={};for(const k of Object.keys(SIX_STATS)){
    const d=state.statDecisions[k]||{};panels[k]=d.choice==='reader'?unit.stats[k]:d.choice==='website'?computed.values[k]:d.choice==='manual'?d.value:d.choice==='blessed'?blessed[k]:d.choice==='base'?state.base[k]??profile.baseStats[k]:null;
    if(!Number.isFinite(panels[k])||panels[k]<0)throw new Error(`请确认${SIX_STATS[k]}最终采用的数值。`);
   }
   const refs=reviewed.rows.flatMap(r=>r.rule.effects).filter(e=>e.type==='statReference');
   if(refs.some(e=>e.target==='法强')&&state.selection.statReference!=='int')throw new Error('已选规则要求以法强参照；请改选法强，或把该参照规则暂不计入。');
   const defenseRefs=reviewed.rows.filter(r=>r.status==='active').flatMap(r=>r.rule.effects).filter(e=>e.type==='defenseReference');
   if(defenseRefs.some(e=>e.target==='敌方魔抗')&&state.selection.statReference!=='int')throw new Error('已选魔抗修正要求以魔抗结算；请确认属性参照或暂不计入该修正。');
   confirmed=true;hasApproval=true;
   onConfirm(reviewed,{panels,selection:selection(),profile:{...clone(profile),baseStats:{...profile.baseStats,...state.base}},unitId:unit.unitId,battleId:battle.battleId});
   $('entryStatus').textContent='已按你的选择生成计算数据；后续候选变化不会直接覆盖，需重新确认。';
   $('entryReviewSummary').textContent='已确认面板与加成，可返回计算器试算。';
   save();
  }catch(err){confirmed=false;$('entryStatus').textContent=err.message;$('entryReviewSummary').textContent=err.message;onInvalidate(err.message);}
 });
 return {receive,selection,hasReport:()=>!!report,isConfirmed:()=>confirmed,importFile,reset:()=>{
  hasApproval=false;state.parameters={};state.hitParameters={};state.decisions={};state.statDecisions={};
  for(const key of ['hitMultiplier','hitDamageRatio','hitScaleStage'])delete state.selection[key];
  if(initialized){state.selection={...state.selection,dualWield:report.context.weaponCount===2,specialAttack:report.context.killer===true,break:false};for(const id of ['dualWield','specialAttack','break'])$(id).checked=state.selection[id];renderPresets();for(const key of ['element','statReference','type'])$(key).value=state.selection[key]||'';setParameters();invalidate();updateCandidate();}save();
 }};
}
