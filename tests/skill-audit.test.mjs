import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync(new URL('../dist/data.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const holder={window:{}};vm.runInNewContext(js,holder);const data=holder.window.SKILL_DATA;
const audit=JSON.parse(fs.readFileSync(new URL('../docs/skill-audit-2026-09-24.json',import.meta.url)));
const rows=Object.values(data.sheets).flatMap(s=>s.kind==='all'?s.rows:s.lanes.flatMap(l=>l.rows)).filter(r=>!r.separator);
const primary=data.sheets['全部技能'].rows;
const skill=n=>primary.find(r=>r.url?.endsWith(`/gino/${n}`));

function boot(storage={},sheet=''){
 const elements=new Map(),saved=new Map(Object.entries(storage).map(([k,v])=>[k,JSON.stringify(v)]));
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',hidden:true,dataset:{},listeners:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(k,f){this.listeners[k]=f;},querySelector(){return null;},querySelectorAll(){return [];},focus(){},scrollIntoView(){}});return elements.get(id);};
 const window={SKILL_DATA:data,addEventListener(){},dispatchEvent(){},scrollTo(){}};window.parent=window;
 const context={window,document:{querySelector:element,querySelectorAll:()=>[],getElementById:id=>element('#'+id),addEventListener(){}},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},sessionStorage:{getItem:()=>null,removeItem(){}},location:{hash:sheet?'#'+encodeURIComponent(sheet):'',search:'',pathname:'/index.html',href:'https://example.test/index.html'},history:{replaceState(){}},URLSearchParams,URL,console};
 vm.runInNewContext(app,context);
 return {window,elements,saved,search(q){const el=element('#searchInput');el.value=q;el.listeners.input();return element('#tableArea').innerHTML;}};
}

test('category copies agree on audited fields and stable IDs are retained',()=>{
 const byKey=new Map();for(const r of rows){if(!r.url)continue;const key=r.url;const fields=JSON.stringify([r.name,r.sc,r.effect,r.notes||'']);if(byKey.has(key))assert.equal(fields,byKey.get(key),key);else byKey.set(key,fields);}
 const ids=new Set(rows.map(r=>r.id));for(const c of audit.changes)assert(ids.has(c.id),c.id);
 assert.equal(primary.filter(r=>r.id==='4aafd29a15ad98c4').length,1);
 assert.equal(primary.length,933);
 for(const [n,sc] of [[186,'5'],[253,'7'],[372,'5'],[821,'2'],[1191,'4'],[1398,'4'],[1640,'9'],[1963,'7']])assert.equal(skill(n).sc,sc);
});

test('basic attribute page renders six sections and searches compound skills with a unique total',()=>{
 const row=primary.find(r=>r.name==='勇士提升2');
 const page=boot({'lc-sheet-table:sc-calculator-v1':{skillIds:[row.id],characterId:'',activeBreaks:[]}},'基础属性');
 assert.match(page.elements.get('#sheetTabs').innerHTML,/基础属性/);
 const html=page.elements.get('#tableArea').innerHTML;
 assert.equal((html.match(/class="basic-stat-section"/g)||[]).length,6);
 assert.match(page.elements.get('#resultSummary').textContent,/181.*935/);
 const filtered=page.search('勇士提升2');
 assert.match(page.elements.get('#resultSummary').textContent,/找到 1 个技能/);
 assert.equal((filtered.match(/data-add-skill=/g)||[]).length,3);
 const snapshot=page.window.LC_LOADOUT_CALCULATOR.snapshot();assert.equal(snapshot.items.length,1);assert.equal(snapshot.items[0].catalogId,row.id);
});

test('recast aliases and supplementary effects are searchable in the actual page',()=>{
 const page=boot();const html=page.search('快速再施法');
 assert.match(html,/快速再吟唱/);assert.match(html,/持续40秒/);assert.match(html,/不是把魔法额外施放一次/);
 assert.match(page.search('固定1,000'),/快速活力/);
 assert(!skill(1988).effect.includes('SC:7'));assert.match(skill(1988).effect,/全体.*雷属性.*35%/);
 assert.match(skill(1426).effect,/魔法师/);assert(!skill(1426).effect.includes('神级'));
});

test('saved selections, custom edits, SC overrides and calculation text survive audit',()=>{
 const recast=skill(649),vitality=skill(353);
 const state={skillIds:[recast.id,vitality.id],characterFreeIds:[],activeBreaks:[],characterId:''};
 const edits={[`skill:${vitality.id}`]:{effect:'我的自定义说明',sc:'8',mark:'S'}};
 const page=boot({'lc-sheet-table:sc-calculator-v1':state,'lc-sheet-table:cell-edits-v1':edits});
 const snapshot=page.window.LC_LOADOUT_CALCULATOR.snapshot();assert.equal(snapshot.items.length,2);assert.equal(snapshot.totalSc,10);
 assert.equal(snapshot.items.find(r=>r.id===recast.id).text,recast.effect);
 assert(!snapshot.items.find(r=>r.id===recast.id).text.includes(recast.notes));
 assert.equal(snapshot.items.find(r=>r.id===vitality.id).text,'我的自定义说明');
 assert.equal(snapshot.items.find(r=>r.id===vitality.id).edited,true);
 assert(!page.search('快速活力').includes('补充说明'));
 assert.deepEqual(JSON.parse(page.saved.get('lc-sheet-table:cell-edits-v1')),edits);
});

test('translated names preserve the original character binding identity',()=>{
 const oldName='快速再施法',renamed=skill(649);
 const oldMatches=[...new Map(rows.map(r=>[r.id,r])).values()].filter(r=>(r.bindingName||r.name)===oldName);
 const selected=oldMatches.length===1?oldMatches[0].id:'character:260:test-recast';
 const page=boot({'lc-sheet-table:unified-character-skills-v1':{'260':{sources:[{sourceId:'test-recast',name:oldName,text:renamed.effect}],initialized:true}},'lc-sheet-table:sc-calculator-v1':{characterId:'260',skillIds:[selected],characterFreeIds:[selected],activeBreaks:[]}});
 const snapshot=page.window.LC_LOADOUT_CALCULATOR.snapshot();assert.equal(snapshot.items.length,1);assert.equal(snapshot.items[0].id,selected);assert.equal(snapshot.items[0].sourceIds[0],'test-recast');assert.equal(snapshot.totalSc,0);
});

test('condition tags display and search; edited effects drop stale tags from loadout snapshots',()=>{
 const monkey=skill(304),life=skill(267),alliance=skill(284);
 const state={skillIds:[monkey.id,life.id,alliance.id],characterId:'',activeBreaks:[]};
 const page=boot({'lc-sheet-table:sc-calculator-v1':state});
 assert.match(page.search('都空'),/光头猴/);
 assert.match(page.search('濒死'),/生命鼓舞/);
 assert.match(page.search('多人'),/魔兽同盟/);
 const snapshot=page.window.LC_LOADOUT_CALCULATOR.snapshot();
 assert(snapshot.items.find(r=>r.id===monkey.id).skillTags.labels.includes('空手 / 都空'));
 const edited=boot({'lc-sheet-table:sc-calculator-v1':state,'lc-sheet-table:cell-edits-v1':{[`skill:${monkey.id}`]:{effect:'我的新效果'}}});
 assert.equal(edited.window.LC_LOADOUT_CALCULATOR.snapshot().items.find(r=>r.id===monkey.id).skillTags,null);
 assert(!edited.search('光头猴').includes('条件标签'));
});
