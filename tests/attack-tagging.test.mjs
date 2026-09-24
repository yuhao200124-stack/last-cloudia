import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ATTACK_TAG_CATALOG as catalog} from '../dist/attack-tag-catalog.mjs';
import {canonicalSkillRows, attackLabelRows, filterLabelRows} from '../dist/skill-labeling-model.mjs';
import {renderLabelTable} from '../dist/skill-labeling.mjs';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const box = {window:{}};
vm.runInNewContext(read('../dist/data.js'), box);
const data = box.window.SKILL_DATA;
const all = canonicalSkillRows(data);
const skill = n => all.find(row => row.url.endsWith(`/gino/${n}`));
const entry = n => catalog.entries.find(row => row.url.endsWith(`/gino/${n}`));

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

test('one tag is assigned and unrelated fragments remain pending even when old basic stats were complete', () => {
  for(const row of catalog.entries)assert.deepEqual(row.assignedTags,['攻击力']);
  assert.equal(catalog.counts.ready,29);
  assert.equal(catalog.counts.partial,58);
  assert.equal(skill(387).basicStats.status,'ready');
  assert.equal(entry(387).judgment,'partial');
  assert.deepEqual(entry(387).remainingEffects,['HP+10%']);
  assert.deepEqual(entry(339).remainingEffects,['类型追加“龙”','受到的物理攻击伤害-15%']);
  assert.equal(entry(9).judgment,'ready');
  assert.equal(entry(267).judgment,'ready');
  assert.match(entry(267).calculationNote,/按当前HP计算.*不能.*最高50%/);
  assert.equal(entry(390).judgment,'partial');
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
  assert(rows.every((row,index)=>!index||rank[row.judgment]>=rank[rows[index-1].judgment]));
  const expectedPartial=all.filter(row=>catalog.entries.some(entry=>entry.id===row.id&&entry.judgment==='partial')).map(row=>row.id);
  assert.deepEqual(rows.filter(row=>row.judgment==='partial').map(row=>row.id),expectedPartial);
  const filtered=filterLabelRows(rows,'攻击力');
  assert(filtered.every((row,index)=>!index||rank[row.judgment]>=rank[filtered[index-1].judgment]));
});

test('the new table exposes only the agreed columns and scopes color classes to judgment labels', () => {
  const rows=attackLabelRows(data,catalog);
  const html=renderLabelTable(rows);
  assert.equal((html.match(/data-skill-id=/g)||[]).length,87);
  assert.deepEqual([...html.matchAll(/<th>([^<]+)<\/th>/g)].map(match=>match[1]),['技能名称','判断','技能效果／说明','标签／判断说明']);
  assert.equal((html.match(/class="assigned-tag">攻击力/g)||[]).length,87);
  assert(!/<tr[^>]*class="judgment-/.test(html));
  assert(!html.includes('获得方式'));
  assert(!html.includes('data-edit-field="sc"'));
  const filtered=filterLabelRows(rows,'暴风龙的加护');assert.equal(filtered.length,1);
  assert.equal(filtered[0].judgment,'partial');
  const escaped=renderLabelTable([{...rows[0],name:'<img onerror=bad>',effect:'<script>bad</script>'}]);
  assert(!escaped.includes('<img'));assert(!escaped.includes('<script>'));
});

test('the page boots, filters and clears without writing existing browser storage', () => {
  const elements=new Map();
  const get=selector=>{if(!elements.has(selector))elements.set(selector,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},focus(){}});return elements.get(selector);};
  const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
  const context={catalog,attackLabelRows,filterLabelRows,document:{querySelector:get},window:{SKILL_DATA:data,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){assert.fail('Review page must not overwrite saved data.');}}};
  vm.runInNewContext(code,context);
  assert.match(get('#labelCoverage').textContent,/935.*87.*848/);
  assert.match(get('#judgmentSummary').textContent,/29.*58.*0/);
  const search=get('#labelSearch');search.value='没有这个技能123';search.listeners.input();
  assert.equal(get('#labelEmpty').hidden,false);assert.equal(get('#labelTable').innerHTML,'');
  get('#clearLabelSearch').listeners.click();assert.equal(get('#labelEmpty').hidden,true);
  assert.match(get('#labelResultCount').textContent,/87 \/ 87/);
});
