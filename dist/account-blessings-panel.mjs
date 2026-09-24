import {ACCOUNT_BLESSING_CATALOG, STAT_BLESSINGS} from './account-blessings.mjs?v=20260924-fullpage';
import {describeCondition} from './effect-rule-engine.mjs?v=20260924-condition-tags';
const labels={hp:'HP',mp:'MP',attack:'攻击力',defense:'防御力',intelligence:'法强',mind:'魔抗'};
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function blessingPercentages(report) {
  if(!report?.rows)return {...STAT_BLESSINGS};
  const result=Object.fromEntries(Object.keys(labels).map(k=>[k,0]));
  for(const row of report.rows)if(row.group==='blessings'&&row.status==='active') {
    for(const effect of row.rule.effects)if(effect.type==='stat'&&effect.unit==='%'&&typeof effect.value==='number'&&Number.isFinite(effect.value)) {
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
  container.innerHTML=`<summary>账户加护资料</summary><p>角色首页保留原始六维。账户加护仅在伤害计算器中默认启用，可随时关闭。</p><div>${ACCOUNT_BLESSING_CATALOG.map(s=>`<article id="${escape(s.id)}"><h4>${escape(s.name)}</h4><p>${escape(s.text)}</p><small>${s.rules.flatMap(r=>r.conditions.map(describeCondition)).map(escape).join('；')||'常驻'} · 读取记录 ${escape(s.id.replace('account-blessing-',''))}</small></article>`).join('')}</div>`;
  section.append(container);
}
