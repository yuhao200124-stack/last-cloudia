import {defaultInput,calculate,context,applies,RACES,ELEMENTS,EFFECTS} from './damage-engine.mjs';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(values,current)=>values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('');
const stages={post:'结算后逐条修正（常见增伤）',offense:'核心前：攻击侧增伤',received:'核心前：目标受伤修正',reduction:'核心前：原生物理 / 魔法减伤'};
const bosses={bird:{def:4000,mnd:10000,debuff:2599,res:[25,-25,50,50,-25,25]},beast:{def:5500,mnd:8000,debuff:3574,res:[25,50,25,-25,50,-25]}};
let effects=[],nextId=0,timer;
const newEffect=(kind='all')=>({id:++nextId,kind,percent:0,enabled:true,target:'无',stage:'post',name:''});
const numericKeys=Object.keys(defaultInput()).filter(k=>typeof defaultInput()[k]==='number');
const booleanKeys=Object.keys(defaultInput()).filter(k=>typeof defaultInput()[k]==='boolean');
$('element').innerHTML=options(ELEMENTS,'无');
for(const group of ['races','killerRaces']) $(''+group).innerHTML=RACES.map(r=>`<label><input type="checkbox" value="${r}">${r}</label>`).join('');
function readEffects() {
  return [...document.querySelectorAll('.effect')].map(row=>({id:Number(row.dataset.id),
    kind:row.querySelector('[data-field=kind]').value,
    percent:row.querySelector('[data-field=percent]').valueAsNumber,
    enabled:row.querySelector('[data-field=enabled]').checked,
    target:row.querySelector('[data-field=target]').value,
    stage:row.querySelector('[data-field=stage]').value,
    name:row.querySelector('[data-field=name]').value.trim()}));
}
function read() {
  const s=defaultInput();
  for(const k of numericKeys) s[k]=$(k).valueAsNumber;
  for(const k of booleanKeys) s[k]=$(k).checked;
  for(const k of ['type','skillType','element']) s[k]=$(k).value;
  for(const group of ['races','killerRaces']) s[group]=[...$(group).querySelectorAll('input:checked')].map(e=>e.value);
  s.effects=readEffects();return s;
}
function renderEffects() {
  $('effects').innerHTML=effects.map((e,i)=>{
    const targets=e.kind==='element'?ELEMENTS:e.kind==='race'?RACES:['无需选择'];
    const target=targets.includes(e.target)?e.target:targets[0];
    return `<div class="effect" data-id="${e.id}"><div class="effect-head"><label><input type="checkbox" data-field="enabled" ${e.enabled?'checked':''} aria-label="启用第 ${i+1} 条加成"><span class="order">加成 ${String(i+1).padStart(2,'0')}</span></label><button type="button" data-action="up" aria-label="上移第 ${i+1} 条加成" ${i===0?'disabled':''}>↑</button><button type="button" data-action="down" aria-label="下移第 ${i+1} 条加成" ${i===effects.length-1?'disabled':''}>↓</button><button type="button" data-action="remove" aria-label="删除第 ${i+1} 条加成">删除</button></div>
      <div class="effect-fields"><label>加成类型<select data-field="kind">${Object.entries(EFFECTS).map(([k,v])=>`<option value="${k}" ${k===e.kind?'selected':''}>${v}</option>`).join('')}</select></label><label>数值 %<input data-field="percent" type="number" min="-100" max="10000" step="any" value="${e.percent}" required></label><label>限定对象<select data-field="target" ${targets.length===1?'disabled':''}>${options(targets,target)}</select></label></div>
      <p class="effect-state"></p><details><summary>更多：来源与结算方式</summary><div class="fields two"><label>来源名称（选填）<input data-field="name" maxlength="60" value="${esc(e.name)}" placeholder="装备、技能或个性名称"></label><label>结算方式<select data-field="stage">${Object.entries(stages).map(([k,v])=>`<option value="${k}" ${k===e.stage?'selected':''}>${v}</option>`).join('')}</select></label></div><p class="help">结算后减伤填负数；原生核心前减伤填正数。类型条件以本页选项筛选，其他条件用本条勾选框确认。</p></details></div>`;
  }).join('');
}
function labels() {
  const magic=$('type').value==='magical';
  $('attackLabel').textContent=magic?'战斗魔力':'战斗攻击力';
  $('defenseLabel').textContent=magic?'当前魔抗 MND':'当前防御力 DEF';
  const neutral=$('element').value==='无';
  $('resistance').disabled=neutral;
  $('resistanceHint').textContent=neutral?'无属性默认不使用六属性抗性。':`填写目标对${$('element').value}属性的当前抗性；弱点通常为负值。`;
  const p=bosses[$('bossPreset').value];
  $('debuff').hidden=!p||magic;
  if(p)$('debuff').textContent=`填入实测降防值 ${p.debuff}`;
}
function applyBoss() {
  const p=bosses[$('bossPreset').value];
  if(p) {
    $('defense').value=$('type').value==='physical'?p.def:p.mnd;
    $('resistance').value=$('element').value==='无'?0:p.res[ELEMENTS.indexOf($('element').value)-1];
    $('boss').checked=true;
    $('break').checked=false;
    $('races').querySelectorAll('input').forEach(el=>el.checked=false);
  }
  labels();
}
function update() {
  labels();
  const invalid=[...$('calculator').querySelectorAll('input[type=number]')].find(e=>!e.disabled&&!e.checkValidity());
  try {
    if(invalid) throw new Error(`请检查「${invalid.closest('label')?.textContent.trim()||'数值'}」的输入范围，必填数值不能留空。`);
    const s=read(),r=calculate(s),c=r.context;
    $('error').hidden=true;$('resultValues').hidden=false;
    $('resultState').textContent=c.element<=0?'属性免疫':r.normal.uncappedMax>s.cap?'普通伤害触及上限':'实时计算';
    $('normalDamage').textContent=`${fmt(r.normal.min)} – ${fmt(r.normal.max)}`;
    $('criticalDamage').textContent=`${fmt(r.critical.min)} – ${fmt(r.critical.max)}`;
    $('totalMean').textContent=`≈ ${fmt(r.totalMean)}`;
    $('totalNote').textContent=`${s.hits} 段 · 暴击率 ${fmt(s.critRate)}% · 含逐段上限`;
    $('normalTotal').textContent=r.normalTotal.map(fmt).join(' – ');
    $('effectiveAttack').textContent=fmt(c.attack);
    $('effectiveDefense').textContent=fmt(c.defense);
    $('killerState').textContent=c.killer?`已匹配 · ×${fmt(c.killerFactor)}`:s.races.length?'未触发':'种族未选，不计算特攻';
    $('skillSummary').textContent=`每段系数 ×${s.coefficient} · 技能内攻击修正 ${s.skillPercent>=0?'+':''}${s.skillPercent}% · ${s.hits} 段`;
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
    $('error').hidden=false;$('error').textContent=e.message;$('resultValues').hidden=true;$('resultState').textContent='请检查输入';
    $('trace').replaceChildren();$('formulaText').textContent='';$('activeNote').textContent='输入有效数值后会自动重新计算。';
  }
}
function reset() {
  const s=defaultInput();
  for(const k of numericKeys) $(k).value=s[k];
  for(const k of booleanKeys) $(k).checked=s[k];
  for(const k of ['type','skillType','element']) $(k).value=s[k];
  $('preset').value='eris';$('bossPreset').value='bird';
  document.querySelectorAll('.choices input').forEach(e=>e.checked=false);
  effects=[newEffect('boss'),newEffect('element'),newEffect('skill')];
  renderEffects();labels();update();
}
$('reset').addEventListener('click',reset);
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
$('calculator').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,70);});
$('calculator').addEventListener('change',event=>{
  const id=event.target.id;
  if(id==='preset') {
    if($('preset').value==='eris') {
      for(const [key,value] of Object.entries({coefficient:.334,skillPercent:51.8,skillAdd:0,skillPostAdd:0,hits:8,critRate:20,type:'physical',skillType:'skill',element:'无'}))$(key).value=value;
      applyBoss();
    } else $('skillDetails').open=true;
  }
  if(['coefficient','skillPercent','skillAdd','skillPostAdd','type','skillType','element'].includes(id)){$('preset').value='custom';$('skillDetails').open=true;}
  if(id==='type' || id==='bossPreset')applyBoss();
  if(id==='element'){
    const p=bosses[$('bossPreset').value];
    if(p)$('resistance').value=$('element').value==='无'?0:p.res[ELEMENTS.indexOf($('element').value)-1];
  }
  update();
});
$('debuff').addEventListener('click',()=>{const p=bosses[$('bossPreset').value];if(p)$('defense').value=p.debuff;update();});
reset();
