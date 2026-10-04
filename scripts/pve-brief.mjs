// 角色资料（游戏数据原文，简体）：给“PvE 角色介绍与配装”聊天用。
//   node scripts/pve-brief.mjs <角色名或编号> [组]
// 组：个性 / 专武 / 固有 / 超越 / 通用 / 魔法 / 招式 / 全部（默认 全部）。名字可以只写一部分；有多个匹配时列出来让你选编号。
// 每条先给游戏原文（textS），再给读取器从主数据解析出的参数（values）和它在伤害公式里的位置（steps）。
// 数据：dist/game-data/index.json、dist/game-data/c/<unitDressId>.json（scripts/publish 流程从游戏主数据导出）。
import fs from 'node:fs';

const root = new URL('../dist/game-data/', import.meta.url);
const json = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const [query, group = '全部'] = process.argv.slice(2);
if (!query) { console.error('用法：node scripts/pve-brief.mjs <角色名或编号> [个性|专武|固有|超越|通用|魔法|招式|全部]'); process.exit(1); }

const index = json('index.json');
const matches = index.characters.filter(c => String(c.u) === query || `${c.d}${c.n}`.includes(query) || c.n.includes(query));
if (!matches.length) { console.error(`游戏数据里没有“${query}”。`); process.exit(1); }
if (matches.length > 1 && !matches.some(c => String(c.u) === query)) {
  console.log(`有 ${matches.length} 个匹配，请用编号再查一次：`);
  for (const c of matches) console.log(`  ${c.u}  ${c.d}${c.n}`);
  process.exit(0);
}
const pick = matches.find(c => String(c.u) === query) || matches[0];
const c = json(`c/${pick.u}.json`);
const P = id => c.passives?.[String(id)];
const one = s => String(s ?? '').replace(/\s*\n\s*/g, '');
const ELEM = ['炎', '冰', '树', '雷', '光', '暗'];

const out = [];
const item = (title, text, extra = []) => { out.push(`### ${title}`, `原文：${one(text) || '（游戏数据里没有说明）'}`); for (const [k, v] of extra) if (v !== undefined && v !== null && v !== '') out.push(`${k}：${v}`); out.push(''); };
const passiveItem = (id, title) => { const p = P(id); if (!p) { item(`${title || id}（编号 ${id}）`, '', [['注', '这个被动的说明不在角色文件里']]); return; } item(`${title || p.nameS}（编号 ${id}${p.sc > 0 && p.sc < 99 ? `，SC ${p.sc}` : ''}）`, p.textS, [['参数', p.values], ['计算位置', p.steps], ['生效范围', p.scope]]); };
const want = g => group === '全部' || group === g;

out.push(`# ${c.fullNameS}（unitDressId ${c.unitDressId}）`, '');
if (group === '全部') {
  const stat = String(c.parameters || '').split(',').filter(Boolean).map(x => x.split('-'));
  const names = ['HP', 'MP', '攻击', '防御', '魔力', '精神'];
  out.push(`可装备：${(c.equipTypes || []).join('、')}`);
  out.push(`Lv1 → 满级（不含突破、觉醒）：${stat.map((s, i) => `${names[i]} ${s[0]}→${s[1]}`).join('，')}`);
  out.push(`基础暴击率：${c.criticalRate}　属性耐性：${String(c.resistElem || '').split(':').map((v, i) => `${ELEM[i]} ${v}`).join('、')}（顺序按游戏的 炎冰树雷光暗）`, '');
}
if (want('个性')) { out.push('## 个性'); for (const p of c.personality || []) passiveItem(p.passive, `${P(p.passive)?.nameS || p.passive}（${p.level} 级）`); }
if (want('专武')) {
  out.push('## 专武');
  const st = s => String(s || '').split(':').map(Number);
  const names = ['HP', 'MP', '攻击', '防御', '魔力', '精神'];
  for (const e of c.exclusiveEquipment || []) {
    if (!(e.maxPassives || e.passives || []).length && st(e.maxStats).every(v => !v)) continue; // 外观
    const stats = st(e.maxStats).map((v, i) => v ? `${names[i]} +${v}` : '').filter(Boolean).join('、');
    const texts = (e.maxPassives || e.passives || []).map(id => P(id)).filter(Boolean);
    item(`${e.nameS}（${e.type}${e.element ? `，${ELEM[e.element - 1]}属性` : ''}，编号 ${e.id}）`, texts.map(p => p.textS).join(' '), [['满强化属性', stats], ['参数', texts.map(p => p.values).join('；')], ['计算位置', texts.map(p => p.steps).join('；')]]);
  }
}
const own = c.ownPassives || [];
if (want('固有')) { out.push('## 固有技能（不占 SC，圣物学不到）'); for (const p of own.filter(p => !p.common)) passiveItem(p.passive); }
if (want('超越')) { out.push('## 超越（不占 SC）'); for (const p of c.transcend || []) passiveItem(p.passive); }
if (want('通用')) { out.push('## 能力盘上的通用技能（自己盘上的按 0 SC 算；括号里是从圣物学时的 SC）'); for (const p of own.filter(p => p.common)) passiveItem(p.passive); }
if (want('魔法')) {
  out.push('## 魔法');
  const list = [...(c.magic?.normal || []).map(m => [m, false]), ...(c.magic?.heavy || []).map(m => [m, true])];
  if (!list.length) out.push('（没有自带魔法）', '');
  for (const [m, heavy] of list) item(`${m.nameS}（编号 ${m.id}${heavy ? '，重魔法' : ''}）`, m.explainS, [['属性', m.element], ['系数', (m.parts || []).filter(p => p.coef != null).map(p => `${p.kind} ${p.coef}`).join('、')]]);
}
if (want('招式')) {
  out.push('## 招式（系数是每一段的；打几段游戏数据里没有，网站按用户实测填）');
  const move = m => item(`${m.type} ${m.nameS}（编号 ${m.id}）`, m.type === '普通攻击' ? '' : m.explainS, [['属性', m.inheritWeaponElement ? '跟随武器' : m.element], ['每段', (m.parts || []).map(p => `${p.kind} 系数 ${p.coef}${p.statPercent ? `，技能自带攻击/魔力 +${p.statPercent}%` : ''}${p.cap ? `，伤害上限 +${p.cap}` : ''}`).join('；')], [m.type === '特技' ? '充能（秒）' : '消耗', m.mpCost || undefined]]);
  for (const m of c.normal || []) move(m);
  for (const m of c.specials || []) move(m);
  if (c.ultimate) move(c.ultimate);
  for (const m of c.form2 || []) move(m);
}
console.log(out.join('\n'));
