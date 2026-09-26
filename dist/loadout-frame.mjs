const embedded=new URLSearchParams(location.search).get('embeddedLoadout')==='1'&&window.parent!==window;
if(embedded){
 document.body.classList.add('embedded-loadout');
 document.getElementById('calculatorLauncher').setAttribute('aria-label','展开或收起已选技能、SC 和加成推荐');
 document.getElementById('unifiedCharacterPicker').hidden=false;
 const send=data=>window.parent.postMessage(data,location.origin);
 let previous='';
 const publish=snapshot=>{const key=JSON.stringify(snapshot);if(key!==previous){previous=key;send({type:'lc-loadout-change',snapshot});}};
 window.addEventListener('lc:loadout-change',e=>publish(e.detail));
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  if(e.data?.type==='lc-loadout-init'){window.LC_LOADOUT_CALCULATOR.initialize(e.data);publish(window.LC_LOADOUT_CALCULATOR.snapshot());}
  if(e.data?.type==='lc-loadout-set-equipment'){window.LC_LOADOUT_CALCULATOR.setEquipmentSources(e.data);publish(window.LC_LOADOUT_CALCULATOR.snapshot());}
  if(e.data?.type==='lc-loadout-get-state')publish(window.LC_LOADOUT_CALCULATOR.snapshot());
  if(e.data?.type==='lc-loadout-recommendations'){
   render(e.data.payload);
   window.dispatchEvent(new CustomEvent('lc:scenario-summary',{detail:e.data.payload.scenarioBonuses||[]}));
  }
 });
 const box=document.getElementById('loadoutRecommendations');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
 let payload=null,hidden=new Set(),contextKey='';
 function render(next){
  payload=next;box.hidden=false;
  if(next.contextKey!==contextKey){contextKey=next.contextKey;hidden.clear();}
  const tiers=(next.tiers||[]).filter(t=>!hidden.has(t.key));
  box.innerHTML=`<div class="recommendation-heading"><strong>加成推荐 · 同等 3 SC</strong><button type="button" data-restore-tiers ${hidden.size?'':'hidden'}>恢复</button></div>
   ${next.error?`<p>${esc(next.error)}</p>`:tiers.length?`<ol class="recommendation-tiers">${tiers.map((tier,i)=>`<li><span class="tier-rank">${i+1}</span><div>${tier.items.map(item=>`<button type="button" data-tier="${esc(tier.key)}" title="双击或按 Delete 隐藏这一档">${esc(item.label)} +${fmt(item.amount)}%</button>`).join('')}<small>期望伤害 +${fmt(tier.percent)}%</small></div><button type="button" class="tier-hide" data-hide-tier="${esc(tier.key)}" aria-label="隐藏第 ${i+1} 档">×</button></li>`).join('')}</ol>`:`<p>${hidden.size?'本轮推荐已隐藏。':'当前增伤没有提高期望伤害，可检查伤害上限。'}</p>`}
   <small>同档收益相同，双击隐藏整档。</small><details><summary>SC 换算</summary><div class="sc-rate-fields">${[['damage','普通增伤 / 3 SC'],['stat','属性 / 3 SC'],['criticalRate','暴击率 / 1 SC'],['criticalDamage','暴伤 / 1 SC']].map(([key,label])=>`<label>${label}<input type="number" min="0.01" max="1000" step="any" data-sc-rate="${key}" value="${next.rates?.[key]??0}">%</label>`).join('')}</div></details>
   ${next.unavailable?.length?`<details><summary>暂不可比较 ${next.unavailable.length} 项</summary>${next.unavailable.map(x=>`<p>${esc(x.label)}：${esc(x.reason)}</p>`).join('')}</details>`:''}`;
 }
 const hide=key=>{hidden.add(key);render(payload);};
 box.addEventListener('dblclick',e=>{const key=e.target.closest('[data-tier]')?.dataset.tier;if(key)hide(key);});
 box.addEventListener('keydown',e=>{const key=e.target.closest('[data-tier]')?.dataset.tier;if(key&&['Delete','Backspace'].includes(e.key)){e.preventDefault();hide(key);}});
 box.addEventListener('click',e=>{const key=e.target.closest('[data-hide-tier]')?.dataset.hideTier;if(key)hide(key);if(e.target.closest('[data-restore-tiers]')){hidden.clear();render(payload);}});
 box.addEventListener('change',e=>{if(e.target.dataset.scRate)send({type:'lc-loadout-rates',rates:{...payload.rates,[e.target.dataset.scRate]:e.target.valueAsNumber}});});
 send({type:'lc-loadout-ready'});
}
