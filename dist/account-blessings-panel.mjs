import {ACCOUNT_BLESSING_CATALOG, STAT_BLESSINGS} from './account-blessings.mjs';
import {describeCondition} from './effect-rule-engine.mjs';
const labels={hp:'HP',mp:'MP',attack:'攻击力',defense:'防御力',intelligence:'法强',mind:'魔抗'};
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function blessingPercentages(report) {
  if(!report?.rows)return {...STAT_BLESSINGS};
  const result=Object.fromEntries(Object.keys(labels).map(k=>[k,0]));
  for(const row of report.rows)if(row.group==='blessings'&&row.status==='active') {
    for(const effect of row.rule.effects)if(effect.type==='stat'&&effect.unit==='%'&&typeof effect.value==='number') {
      const key=Object.keys(labels).find(k=>labels[k]===effect.target);if(key)result[key]+=effect.value;
    }
  }
  return result;
}
export function withAccountBlessings(baseStats,report) {
  const percentages=blessingPercentages(report);
  return Object.fromEntries(Object.entries(baseStats).map(([k,value])=>[k,
    typeof value==='number'&&Number.isFinite(value)?Math.floor(value*(100+(percentages[k]||0))/100):null]));
}
export function mountAccountBlessings(doc=document) {
  const section=doc.querySelector('#max-stats');
  if(!section||section.querySelector('[data-account-blessings]'))return;
  const container=doc.createElement('details');container.dataset.accountBlessings='';container.className='account-blessings';
  container.innerHTML=`<summary>账户加护 · 默认启用</summary><p>采用本次露西亚裸装报告的账户加护。六维默认计入；增伤、上限与减伤按装备和攻击条件计入。${doc.querySelector('#bonusCalculator[data-rule-calculator]')?'可在基础计算器修改或停用。':''}</p><div>${ACCOUNT_BLESSING_CATALOG.map(s=>`<article id="${escape(s.id)}"><h4>${escape(s.name)}</h4><p>${escape(s.text)}</p><small>${s.rules.flatMap(r=>r.conditions.map(describeCondition)).map(escape).join('；')||'常驻'} · 读取记录 ${escape(s.id.replace('account-blessing-',''))}</small></article>`).join('')}</div>`;
  section.append(container);
  const boxes=[...section.querySelectorAll('.stat-box')];
  const base={};
  for(const box of boxes) {
    const key=Object.keys(labels).find(k=>labels[k]===box.querySelector('span')?.textContent.trim());if(!key)continue;
    const strong=box.querySelector('strong'),value=Number(strong.textContent.replaceAll(',',''));
    if(!Number.isFinite(value))continue;base[key]=value;strong.dataset.rawBase=String(value);
    const note=doc.createElement('small');note.dataset.blessingStat=key;box.append(note);
  }
  function refresh(report) {
    const percentages=blessingPercentages(report),adjusted=withAccountBlessings(base,report);
    for(const box of boxes) {
      const note=box.querySelector('[data-blessing-stat]');if(!note)continue;const key=note.dataset.blessingStat;
      box.querySelector('strong').textContent=adjusted[key].toLocaleString('en-US');
      note.textContent=`原始 ${base[key].toLocaleString('en-US')} · 加护 +${percentages[key]}%`;
    }
  }
  refresh();
  const note=section.querySelector('.section-note');if(note)note.textContent='最大成长六维已默认计入账户加护；下方保留原始值。不包含装备或角色技能。';
  window.addEventListener('lc:effect-rules-change',()=>refresh(window.LC_EFFECT_CALCULATOR?.getReport()));
}
