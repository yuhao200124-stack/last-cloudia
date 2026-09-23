import {SIX_STATS,ATTACK_CHOICES,retargetReport,websiteCandidates,validateBattleEntry,compareCandidates,decisionKey,resolveReview} from './entry-preparation.mjs';
import {formatEffect} from './effect-rule-engine.mjs';
import {withAccountBlessings,blessingPercentages} from './account-blessings-panel.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const clone=x=>JSON.parse(JSON.stringify(x));
const option=(v,label,current)=>`<option value="${esc(v)}"${v===current?' selected':''}>${esc(label)}</option>`;
const meaningful=report=>JSON.stringify({...report,createdAt:''});
export function initEntryWorkflow({characterId,onConfirm,onInvalidate,onSelection}) {
 const storageKey=`lc-entry-review:${characterId}:v1`;
 let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey))||{};}catch{}
 let state={accountBlessings:saved.accountBlessings!==false,base:saved.base||{},selection:saved.selection||{},parameters:saved.parameters||{},decisions:saved.decisions||{},statDecisions:saved.statDecisions||{},mappings:saved.mappings||{}};
 let report=null,profile=null,candidate=null,compared=[],battle=null,unit=null,signature='',initialized=false;
 let confirmed=false;
 const parameterIds=['hits','coefficient','skillPercent','skillAdd','skillPostAdd','hitScaleStage'];
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{$('entryStatus').textContent='浏览器未能保存核对选择，请保持当前页面打开。';}};
 const selection=()=>({...state.selection});
 const selectedMove=()=>[...(profile?.moves||[]),...(profile?.magic||[])].find(m=>m.id===state.selection.preset);
 const paramKey=()=>`${state.selection.attack}:${state.selection.preset||'unselected'}`;
 function invalidate(message='数据待核对，确认后才会用于伤害计算。') {confirmed=false;onInvalidate(message);$('entryStatus').textContent=message;}
 function saveParameters(){state.parameters[paramKey()]=Object.fromEntries(parameterIds.map(id=>[id,$(id).value]));save();}
 function setParameters() {
  const move=selectedMove(),p=state.parameters[paramKey()];
  for(const id of parameterIds)$(id).value=p?.[id]??(id==='skillAdd'||id==='skillPostAdd'?0:move?.[id]??'');
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
  $('entryAccountBlessings').checked=state.accountBlessings;
  const current=currentBlessings(),base={...profile.baseStats,...state.base},adjusted=withAccountBlessings(base,current),percentages=blessingPercentages(current);
  $('entrySixStats').innerHTML=Object.entries(SIX_STATS).map(([k,label])=>`<label>${label}（原始基础）<input type="number" data-entry-base="${k}" min="0" max="100000000" step="1" value="${esc(base[k]??'')}"><small>加护 +${esc(percentages[k])}% → <b>${esc(adjusted[k]??'未提供')}</b></small></label>`).join('');
 }
 function currentBlessings() {
  const rows=(candidate||report)?.rows?.filter(r=>r.group==='blessings')||[];
  return {rows:rows.map(r=>({...r,rule:{...r.rule,effects:r.rule.effects.flatMap((effect,index)=>{
   const row=compared.find(w=>w.sourceId===r.sourceId&&w.ruleId===r.rule.id&&w.index===index);
   const decision=row&&state.decisions[decisionKey(row)];
   if(decision?.choice==='exclude')return [];
   if(decision?.choice==='manual')return Number.isFinite(decision.value)?[{...effect,value:decision.value}]:[];
   if(decision?.choice==='reader')return row.compatible?[{...effect,value:row.reader.value}]:[];
   return [effect];
  })}}))};
 }
 function renderReview() {
  const move=selectedMove();
  $('entryMoveNote').textContent=move?`${move.source}：${move.name}。${move.purpose==='support'?'这是辅助魔法，不按攻击伤害计算。':''}${move.hits==null?'原始命中数未提供；':''}${move.coefficient==null?'倍率未提供；':''}${state.selection.attack==='heavy_magic'?'是否属于重魔法由你选择确认；':''}未知参数留在备选阶段。`:'请先选择攻击方式和具体魔法。';
  $('entryCandidateCount').textContent=`${compared.length} 项加成${state.accountBlessings?'（含账户加护）':''}`;
  const pending=candidate.rows.filter(r=>r.status==='pending');
  $('entryPendingCount').textContent=`网站待确认项（${pending.length}）`;
  $('entryPending').innerHTML=pending.map(r=>`<li><b>${esc(r.sourceName)}</b><small>${r.reasons.map(esc).join('；')}</small></li>`).join('')||'<li>没有待确认项。</li>';
  const readerOptions=(row)=>option('','未对应',state.mappings[row.id]||'')+(unit?.bonuses||[]).filter(b=>b.effectType===row.effect.type&&b.target===row.effect.target&&b.unit===(row.effect.unit||'')).map(b=>option(b.id,`${b.sourceName||b.id}：${b.value??'未解析'}${b.unit||''}`,state.mappings[row.id]||row.reader?.id)).join('');
  $('entryEffectsReview').innerHTML=compared.map((r,i)=>{
   const d=state.decisions[decisionKey(r)]||{},numeric=typeof r.effect.value==='number';
   return `<tr><td><b>${esc(r.sourceName)}</b><small>${esc(formatEffect(r.effect))}</small></td><td>${esc(r.effect.value)}${esc(r.effect.unit||'')}<small>${esc(r.group==='blessings'?'账户加护默认值':'网站条件推演')}</small></td><td>${r.reader?`${esc(r.reader.value??'未解析')}${esc(r.reader.unit||'')}<small>${esc(r.reader.state==='observed'?'读取观测':'读取候选，未证明触发')}</small><details><summary>读取条件与原始字段</summary><small>Process ${esc(r.reader.processId??'—')} · Condition ${esc(r.reader.conditionId??'—')} · ${esc(r.reader.raw?.component||'阶段未解析')}</small><pre>${esc(JSON.stringify(r.reader.raw??r.reader,null,2))}</pre></details>`:'未对应'}<details><summary>选择读取来源</summary><select data-entry-map="${i}" aria-label="${esc(r.sourceName)}读取来源">${readerOptions(r)}</select></details></td><td>${esc(r.comparison)}${r.difference!=null?`<small>差值 ${r.difference>=0?'+':''}${esc(r.difference)}${esc(r.effect.unit||'')}</small>`:''}</td><td><select data-entry-choice="${i}" aria-label="${esc(r.sourceName)}核对决定">${option('pending','待决定',d.choice||'pending')}${option('web','采用网站值',d.choice)}${r.compatible&&r.reader?.value!=null&&!['hit','statReference'].includes(r.effect.type)?option('reader','采用读取值',d.choice):''}${numeric?option('manual','手动填写',d.choice):''}${option('exclude','暂不计入',d.choice)}</select>${numeric?`<input data-entry-value="${i}" type="number" step="any" value="${esc(d.value??'')}" placeholder="自填数值" aria-label="${esc(r.sourceName)}手动数值"${d.choice==='manual'?'':' hidden'}>`:''}</td></tr>`;
  }).join('');
  $('entryStatReview').innerHTML=Object.entries(SIX_STATS).map(([k,label])=>{
   const d=state.statDecisions[k]||{},base=state.base[k]??profile.baseStats[k],observed=unit?.stats?.[k];
   const blessed=withAccountBlessings({[k]:base},currentBlessings())[k];
   const website=compared.filter(r=>['stat','statBuff','equipmentStat'].includes(r.effect.type)&&r.effect.target.includes(label));
   return `<tr><td><b>${label}</b></td><td>${esc(base??'未提供')}<small>仅加护后：${esc(blessed??'未提供')}</small><small>${website.map(r=>`${esc(r.sourceName)}：${esc(formatEffect(r.effect))}`).join('<br>')||'无已识别属性词条'}</small></td><td>${esc(observed??'未读到')}<small>入场最终面板${k==='hp'||k==='mp'?'（上限）':''}</small></td><td><select data-entry-stat="${k}" aria-label="${label}面板来源">${option('pending','待决定',d.choice||'pending')}${observed!=null?option('reader','采用入场面板',d.choice):''}${option('manual','手动填写最终值',d.choice)}${option('blessed','基础＋已采用加护',d.choice)}${option('base','只用原始基础值（不含加护）',d.choice)}</select><input data-entry-stat-value="${k}" type="number" min="0" max="100000000" step="1" value="${esc(d.value??'')}" aria-label="${label}手动面板"${d.choice==='manual'?'':' hidden'}></td></tr>`;
  }).join('');
  const mapped=new Set(compared.map(r=>r.reader?.id).filter(Boolean));
  const unmatched=(unit?.bonuses||[]).filter(b=>!mapped.has(b.id));
  $('entryUnmatchedCount').textContent=`读取器未对应项（${unmatched.length}）`;
  $('entryUnmatched').innerHTML=unmatched.map(b=>`<li><b>${esc(b.sourceName||b.id)}</b>：${esc(b.target||b.effectType||'未解析')} ${esc(b.value??'数值未解析')}${esc(b.unit||'')}<small>${esc(b.state||'candidate')} · Process ${esc(b.processId??'—')} · Condition ${esc(b.conditionId??'—')}</small><details><summary>原始证据</summary><pre>${esc(JSON.stringify(b.raw??b,null,2))}</pre></details></li>`).join('')||'<li>没有未对应项。</li>';
 }
 function initialize() {
  initialized=true;
  state.selection={attack:report.context.attack==='magic'?'magic':report.context.attack||'normal',type:report.context.damageType||'',element:'',statReference:'',...state.selection};
  $('entryPreparation').hidden=false;$('entryReview').hidden=false;$('attackChoice').closest('label').hidden=false;$('statReference').closest('label').hidden=false;
  $('skillType').closest('label').hidden=true;
  $('attackChoice').innerHTML=ATTACK_CHOICES.map(([v,l])=>option(v,l,state.selection.attack)).join('');
  if(!$('element').querySelector('option[value=""]'))$('element').insertAdjacentHTML('afterbegin','<option value="">待确认</option>');
  if(!$('type').querySelector('option[value=""]'))$('type').insertAdjacentHTML('afterbegin','<option value="">待确认</option>');
  renderProfile();renderPresets();
  for(const key of ['element','statReference','type']){$(key).value=state.selection[key]||'';$(key).disabled=false;}
  setParameters();$('skillDetails').open=true;
 }
 function receive(next) {
  if(!next.profile)throw new Error('角色固定资料尚未带入，请刷新角色页面后重新打开。');
  if(next.profile.characterId!==characterId)throw new Error('角色固定资料与当前角色不一致。');
  const fingerprint=meaningful(next);if(fingerprint===signature)return;
  signature=fingerprint;report=clone(next);profile=report.profile;
  if(!initialized)initialize();
  invalidate('固定资料已补齐；加成保留为候选，请导入入场报告后核对。');updateCandidate();
 }
 async function importFile(file) {
  if(!file)return;if(file.size>25_000_000)throw new Error('报告超过25MB，请使用读取器生成的入场JSON报告。');
  battle=validateBattleEntry(JSON.parse(await file.text()));unit=null;state.mappings={};state.statDecisions={};
  $('entryUnit').innerHTML=option('','请选择本次测试角色','')+battle.units.map((u,i)=>option(String(i),`${u.name||'未命名'} · Unit ${u.unitId}`,'')).join('');
  $('entryFileNote').textContent=`${file.name} · ${battle.testFixture?'模拟示例，非实际战斗 · ':''}${battle.capturedAt||'时间未提供'} · ${battle.snapshotState==='partial'?'部分读取，缺项不代表没有效果':'入场报告'}。${battle.normalization?.mpThousandths?'MP已按游戏显示单位修正，原始值保留。':''}请选择正确角色；Buff清单本身不代表全部触发。`;
  invalidate('报告已载入，先选择对应角色，再逐项核对。');updateCandidate();
 }
 $('entryReportFile').addEventListener('change',async e=>{try{await importFile(e.target.files[0]);}catch(err){invalidate(`新文件未导入：${err.message}`);}e.target.value='';});
 $('entryUnit').addEventListener('change',e=>{unit=battle?.units[Number(e.target.value)]||null;if(e.target.value==='')unit=null;state.mappings={};state.statDecisions={};invalidate('入场面板和读取候选已列出，数值差异由你决定。');updateCandidate();});
 $('entrySixStats').addEventListener('change',e=>{if(e.target.dataset.entryBase){state.base[e.target.dataset.entryBase]=e.target.valueAsNumber;invalidate();updateCandidate();}});
 $('entryAccountBlessings').addEventListener('change',e=>{state.accountBlessings=e.target.checked;invalidate('加护选项已更新；读取器的最终面板保持原值，不额外加算或反算。');updateCandidate();});
 $('attackChoice').addEventListener('change',()=>{saveParameters();state.selection.attack=$('attackChoice').value;renderPresets(true);applyMove();invalidate('攻击方式已改变，请核对这次攻击对应的加成。');updateCandidate();});
 $('preset').addEventListener('change',()=>{if(!initialized)return;saveParameters();state.selection.preset=$('preset').value;applyMove();invalidate('具体招式已改变，倍率与命中数按该招式单独保留。');updateCandidate();});
 for(const id of ['element','statReference','type'])$(id).addEventListener('change',()=>{if(!initialized)return;state.selection[id]=$(id).value;invalidate();updateCandidate();});
 for(const id of parameterIds)$(id).addEventListener('change',()=>{if(initialized)saveParameters();});
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
 $('entryConfirm').addEventListener('click',()=>{
  try {
   if(!unit)throw new Error('请导入一次基础状态战斗报告，并选择本次角色。');
   if(!selectedMove())throw new Error('请选择具体招式。');
   if(selectedMove().purpose==='support')throw new Error('当前是辅助魔法，请改选攻击招式。');
   if(!['str','int','mixed'].includes(state.selection.statReference))throw new Error('请选择攻击力、法强或混合参照。');
   if(!['physical','magical'].includes(state.selection.type)||!state.selection.element)throw new Error('请确认伤害分类和攻击属性。');
   for(const k of Object.keys(SIX_STATS))if(!['reader','manual','blessed','base'].includes(state.statDecisions[k]?.choice))throw new Error(`请确认${SIX_STATS[k]}最终采用的数值。`);
   const reviewed=resolveReview(candidate,compared,state.decisions);
   const blessed=withAccountBlessings({...profile.baseStats,...state.base},reviewed);
   const panels={};for(const k of Object.keys(SIX_STATS)){
    const d=state.statDecisions[k]||{};panels[k]=d.choice==='reader'?unit.stats[k]:d.choice==='manual'?d.value:d.choice==='blessed'?blessed[k]:d.choice==='base'?state.base[k]??profile.baseStats[k]:null;
    if(!Number.isFinite(panels[k])||panels[k]<0)throw new Error(`请确认${SIX_STATS[k]}最终采用的数值。`);
   }
   const refs=reviewed.rows.flatMap(r=>r.rule.effects).filter(e=>e.type==='statReference');
   if(refs.some(e=>e.target==='法强')&&state.selection.statReference!=='int')throw new Error('已选规则要求以法强参照；请改选法强，或把该参照规则暂不计入。');
   const defenseRefs=reviewed.rows.filter(r=>r.status==='active').flatMap(r=>r.rule.effects).filter(e=>e.type==='defenseReference');
   if(defenseRefs.some(e=>e.target==='敌方魔抗')&&state.selection.statReference!=='int')throw new Error('已选魔抗修正要求以魔抗结算；请确认属性参照或暂不计入该修正。');
   confirmed=true;
   onConfirm(reviewed,{panels,selection:selection(),profile:{...clone(profile),baseStats:{...profile.baseStats,...state.base}},unitId:unit.unitId,battleId:battle.battleId});
   $('entryStatus').textContent='已按你的选择生成计算数据；后续候选变化不会直接覆盖，需重新确认。';
   save();
  }catch(err){confirmed=false;$('entryStatus').textContent=err.message;onInvalidate(err.message);}
 });
 return {receive,selection,hasReport:()=>!!report,isConfirmed:()=>confirmed,importFile,reset:()=>{state.parameters={};state.decisions={};state.statDecisions={};save();if(initialized){renderPresets();for(const key of ['element','statReference','type'])$(key).value=state.selection[key]||'';setParameters();invalidate();updateCandidate();}}};
}
