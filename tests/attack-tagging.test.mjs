import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ATTACK_TAG_CATALOG as catalog} from '../dist/attack-tag-catalog.mjs';
import {SKILL_LABELING_CATALOG as sharedCatalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows, attackLabelRows, skillLabelRows, labelingView, filterLabelRows, resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
import {renderLabelTable} from '../dist/skill-labeling.mjs';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const box = {window:{}};
vm.runInNewContext(read('../dist/data.js'), box);
const data = box.window.SKILL_DATA;
const all = canonicalSkillRows(data);
const skill = n => all.find(row => row.url.endsWith(`/gino/${n}`));
const entry = n => catalog.entries.find(row => row.url.endsWith(`/gino/${n}`));
const registry = JSON.parse(read('../docs/skill-labeling-registry.json'));

test('the attack pass audits all unique skills including category-only rows and every previous attack skill', () => {
  const audit = JSON.parse(read('../docs/attack-tag-audit.json'));
  assert.equal(all.length,935);
  assert.equal(audit.rows.length,935);
  assert.equal(new Set(audit.rows.map(row=>row.id)).size,935);
  for (const n of [2026,2028]) assert(audit.rows.some(row=>row.id===skill(n).id));
  const previous=all.filter(row=>row.basicStats?.targets.includes('攻击力'));
  assert.equal(previous.length,78);
  for(const row of previous)assert(catalog.entries.some(entry=>entry.id===row.id),row.name);
  assert.equal(catalog.entries.length,87);
  assert.equal(new Set(catalog.entries.map(row=>row.url)).size,87);
  assert.equal(audit.rows.filter(row=>row.decision==='not-related').length,848);
});

test('the previous attack tag is retained while only reviewed attribute fragments are added', () => {
  for(const row of catalog.entries){assert.equal(row.assignedTags[0],'攻击力');assert(row.assignedTags.every(tag=>['攻击力','防御力','生命力','魔力','物理伤害增加','魔法伤害增加'].includes(tag)));}
  assert.equal(catalog.entries.filter(row=>row.assignedTags.includes('防御力')).length,26);
  assert.equal(catalog.counts.ready,14);
  assert.equal(catalog.counts.partial,73);
  assert.deepEqual(catalog.entries.filter(row=>row.judgment==='ready').map(row=>Number(row.url.split('/').pop())),[9,10,11,12,251,387,393,528,725,796,986,1571,1864,1912]);
  assert.equal(skill(387).basicStats.status,'ready');
  assert.equal(entry(387).judgment,'ready');
  assert.deepEqual(entry(387).remainingEffects,[]);
  assert.deepEqual(entry(339).remainingEffects,['类型追加“龙”','受到的物理攻击伤害-15%']);
  assert.equal(entry(9).judgment,'ready');
  assert.equal(entry(267).judgment,'partial');
  assert.match(entry(267).calculationNote,/按当前HP计算.*不能.*最高50%/);
  assert.equal(entry(390).judgment,'partial');
  for(const n of [102,106,113,119,195,218,267,552,726,787,851,969,983,1147,1176,1212,1231,1318,1365,1483,1629,1747,1801,2001]){
    assert.equal(entry(n).judgment,'partial',entry(n).name);
    assert(entry(n).remainingConditions.length,entry(n).name);
  }
  assert.deepEqual(entry(119).remainingConditions,['满HP时生效']);
  assert.equal(entry(1747).remainingConditions.length,2);
  assert.equal(entry(1801).remainingConditions.length,3);
  assert.equal(entry(2001).remainingConditions.length,3);
});

test('later passes accumulate on the same skill and promote newly complete skills ahead of partial skills', () => {
  const before=JSON.stringify(registry);
  const shared=structuredClone(registry);
  shared.tagPasses.push({tag:'满HP',assignments:[{skillId:skill(119).id,partIds:['full-hp']}]});
  shared.tagPasses.push({tag:'神类型条件',assignments:[{skillId:skill(2001).id,partIds:['condition-1']}]});
  const updated={...catalog,entries:resolveSkillLabels(shared).filter(row=>row.assignedTags.includes('攻击力'))};
  const rows=attackLabelRows(data,updated);
  const full=rows.find(row=>row.id===skill(119).id);
  assert.deepEqual(full.assignedTags,['攻击力','满HP']);
  assert.equal(full.judgment,'ready');assert.deepEqual(full.remainingConditions,[]);
  assert.deepEqual(rows.find(row=>row.id===skill(387).id).assignedTags,['攻击力','生命力']);
  assert.equal(rows.find(row=>row.id===skill(387).id).judgment,'ready');
  const deity=rows.find(row=>row.id===skill(2001).id);
  assert.equal(deity.judgment,'partial');assert.equal(deity.remainingConditions.length,2);
  const firstPartial=rows.findIndex(row=>row.judgment==='partial');
  assert(rows.slice(0,firstPartial).every(row=>row.judgment==='ready'));
  assert(rows.slice(firstPartial).every(row=>row.judgment==='partial'));
  assert(rows.indexOf(full)<firstPartial);
  for(const status of ['ready','partial']){
    const group=rows.filter(row=>row.judgment===status).map(row=>row.id);
    assert.deepEqual(group,catalog.displayOrder.filter(id=>group.includes(id)));
  }
  assert(filterLabelRows(rows,'满HP').some(row=>row.id===skill(119).id));
  const rendered=renderLabelTable([full]);
  assert(rendered.includes('assigned-tag">攻击力'));assert(rendered.includes('assigned-tag">满HP'));
  assert(rendered.includes('已完整判断'));assert(!rendered.includes('待判断条件'));
  assert.equal(JSON.stringify(registry),before);
});

test('named spell buffs, linked faith and attack references are covered without treating damage as attack', () => {
  assert(entry(390));assert(entry(1103));
  assert(!skill(1754).effect.includes('攻击力'));
  assert.equal(entry(1754).relation,'inherited-effect');
  assert.deepEqual(entry(1754).relatedSkillIds,[entry(2001).id]);
  for(const [n,relation] of [[593,'stat-reference'],[696,'target-selection'],[983,'debuff-protection'],[1066,'stat-comparison'],[1176,'incoming-damage-reference'],[1706,'target-selection'],[1779,'stat-reference'],[1941,'stat-comparison']])assert.equal(entry(n).relation,relation);
  for(const n of [458,1914,499,1605,1756,1999,169,357,441])assert(!entry(n),skill(n).name);
  assert.equal(catalog.numericEffectInjection,false);
});

test('saved description changes invalidate both positive tags and old exclusions without mutating saved data', () => {
  const edits={
    [`skill:${skill(9).id}`]:{name:'我的攻击提升',effect:'改成其他效果',sc:'17'},
    [`skill:${skill(1).id}`]:{effect:'攻击力+99%',sources:'我的来源'},
  };
  const before=JSON.stringify(edits),rows=attackLabelRows(data,catalog,edits);
  assert.equal(rows.length,88);
  for(const n of [9,1]){
    const row=rows.find(row=>row.id===skill(n).id);
    assert.equal(row.judgment,'unknown');assert.deepEqual(row.assignedTags,[]);
  }
  assert.equal(rows.find(row=>row.id===skill(9).id).name,'我的攻击提升');
  assert.equal(JSON.stringify(edits),before);
  assert.equal(skill(9).sc,'1');
  const rank={ready:0,partial:1,unknown:2};
  assert(rows.every((row,index)=>!index||rank[rows[index-1].judgment]<=rank[row.judgment]));
  assert.deepEqual(rows.slice(-2).map(row=>row.id),[skill(9).id,skill(1).id]);
  assert.equal(rows.at(-1).id,skill(1).id);
  const filtered=filterLabelRows(rows,'攻击力');
  assert.deepEqual(filtered.map(row=>row.id),rows.filter(row=>filtered.includes(row)).map(row=>row.id));
});

test('the new table exposes only the agreed columns and scopes color classes to judgment labels', () => {
  const rows=attackLabelRows(data,catalog);
  const html=renderLabelTable(rows);
  assert.equal((html.match(/data-skill-id=/g)||[]).length,87);
  assert.deepEqual([...html.matchAll(/<th>([^<]+)<\/th>/g)].map(match=>match[1]),['技能名称','判断','技能效果／说明','标签／判断说明']);
  assert.equal((html.match(/class="assigned-tag">攻击力/g)||[]).length,87);
  assert(html.includes('待判断条件／机制'));
  assert(!/<tr[^>]*class="judgment-/.test(html));
  assert(!html.includes('获得方式'));
  assert(!html.includes('data-edit-field="sc"'));
  const filtered=filterLabelRows(rows,'暴风龙的加护');assert.equal(filtered.length,1);
  assert.equal(filtered[0].judgment,'partial');
  const escaped=renderLabelTable([{...rows[0],name:'<img onerror=bad>',effect:'<script>bad</script>'}]);
  assert(!escaped.includes('<img'));assert(!escaped.includes('<script>'));
});

test('the page groups Boss labels, switches cumulative views, filters and clears without writing saved data', () => {
  const elements=new Map();
  const get=selector=>{if(!elements.has(selector))elements.set(selector,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},setAttribute(){},focus(){}});return elements.get(selector);};
  const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
  const context={catalog:sharedCatalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Review page must not overwrite saved data.');}}};
  vm.runInNewContext(code,context);
  assert.match(get('#labelCoverage').textContent,/935.*11.*924/);
  assert.match(get('#judgmentSummary').textContent,/2.*9.*0/);
  const tabs=get('#labelTabs');
  assert.equal((tabs.innerHTML.match(/role="tab"/g)||[]).length,10);
  assert(tabs.innerHTML.includes('全部已贴标签（280）'));
  assert(tabs.innerHTML.includes('攻击力（87）'));
  assert(tabs.innerHTML.includes('防御力（70）'));
  assert(tabs.innerHTML.includes('生命力（25）'));
  assert(tabs.innerHTML.includes('魔力（51）'));
  assert(tabs.innerHTML.includes('MP（8）'));
  assert(tabs.innerHTML.includes('物理伤害增加（78）'));
  assert(tabs.innerHTML.includes('魔法伤害增加（22）'));
  assert(tabs.innerHTML.includes('伤害增加（7）'));
  assert(tabs.innerHTML.includes('Boss增伤（11）'));
  assert(!tabs.innerHTML.includes('Boss魔法伤害增加'));
  const sub=get('#labelSubTabs');
  assert.equal(sub.hidden,false);
  assert.equal((sub.innerHTML.match(/role="tab"/g)||[]).length,6);
  for(const label of ['全部Boss增伤（11）','Boss伤害增加（1）','Boss魔法伤害增加（4）','Boss物理伤害增加（1）','Boss特技伤害增加（4）','Boss必杀伤害增加（5）'])assert(sub.innerHTML.includes(label),label);
  const clickSub=tag=>sub.listeners.click({target:{closest:()=>({dataset:{tag}})}});
  clickSub('boss-magic-damage');
  assert.match(get('#labelCoverage').textContent,/935.*4.*931/);
  assert.match(get('#judgmentSummary').textContent,/1.*3.*0/);
  assert.match(get('#activeTagTitle').textContent,/Boss魔法/);
  clickSub('boss-physical-damage');
  assert.match(get('#labelCoverage').textContent,/935.*1.*934/);
  assert(get('#labelTable').innerHTML.includes('调查兵团'));
  clickSub('boss-skill-damage');
  assert(get('#labelTable').innerHTML.includes('巨人杀手'));
  assert(!get('#labelTable').innerHTML.includes('邪恶织法'));
  let prevented=false;
  sub.listeners.keydown({key:'ArrowRight',target:{closest:()=>({dataset:{tag:'boss-skill-damage'}})},preventDefault(){prevented=true;}});
  assert(prevented);assert.match(get('#activeTagTitle').textContent,/Boss必杀/);
  assert(get('#labelTable').innerHTML.includes('邪恶织法'));
  clickSub('boss-damage');
  assert.match(get('#labelCoverage').textContent,/935.*1.*934/);
  assert(get('#labelTable').innerHTML.includes('勇者之魂'));
  const clickTab=tag=>tabs.listeners.click({target:{closest:()=>({dataset:{tag}})}});
  clickTab('attack');
  assert.equal(sub.hidden,true);
  assert.match(get('#labelCoverage').textContent,/935.*87.*848/);
  assert.match(get('#judgmentSummary').textContent,/14.*73.*0/);
  clickTab('all');
  assert.match(get('#labelCoverage').textContent,/935.*280.*655/);
  assert.match(get('#judgmentSummary').textContent,/46.*234.*0/);
  const rowStatuses=[...get('#labelTable').innerHTML.matchAll(/judgment-label judgment-(ready|partial|unknown)/g)].map(match=>match[1]);
  assert.deepEqual(rowStatuses.slice(0,46),Array(46).fill('ready'));
  assert(rowStatuses.slice(46).every(status=>status==='partial'));
  const search=get('#labelSearch');search.value='没有这个技能123';search.listeners.input();
  assert.equal(get('#labelEmpty').hidden,false);assert.equal(get('#labelTable').innerHTML,'');
  get('#clearLabelSearch').listeners.click();assert.equal(get('#labelEmpty').hidden,true);
  assert.match(get('#labelResultCount').textContent,/280 \/ 280/);
});
