import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const audit=JSON.parse(read('../docs/technique-tag-audit.json')),registry=JSON.parse(read('../docs/skill-labeling-registry.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'technique');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['特技相关'],bindings=n=>detail(n).bindings;
const numbers=v=>v.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);

test('technique scans all 935 skills and separates whole clauses into 55 effect groups',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,82);
 assert.deepEqual(numbers(view),[112,156,159,162,164,173,199,202,204,207,213,243,256,264,289,358,402,411,458,460,461,493,510,583,604,624,626,666,721,730,753,760,827,831,843,866,965,968,976,994,1041,1046,1067,1191,1204,1257,1271,1272,1295,1311,1335,1349,1352,1368,1390,1427,1448,1463,1526,1582,1607,1637,1658,1659,1695,1743,1745,1764,1766,1773,1799,1816,1830,1846,1856,1874,1914,1931,1941,1987,1998,2028]);
 for(const r of all){const a=audit.rows.find(x=>x.id===r.id);assert.equal(a.sourceHash,createHash('sha256').update(JSON.stringify([r.id,r.url,r.name,r.effect,r.notes||''])).digest('hex'));assert.equal(a.decision==='related',view.entries.some(e=>e.id===r.id));}
 assert.equal(view.childKeys.length,55);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),107);
 const generic=numbers(labelingView(catalog,'technique-skill-damage'));for(const n of [411,624,1272,1582,1659,1695,760,1526,1204,1463,1743,1816,1931])assert(!generic.includes(n),source(n).name);
 assert.deepEqual(numbers(labelingView(catalog,'technique-boss-skill-damage')),[411,624,1041,1311]);assert.deepEqual(numbers(labelingView(catalog,'technique-non-boss-skill-damage')),[760,1526]);
 for(const n of [117,406,917,1021])assert(!numbers(view).includes(n));
 assert.deepEqual(entry(1021).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少',...ADDITIONAL_RACE_TAGS].includes(tag)),['物理伤害增加','必杀相关']);assert(entry(1335).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('必杀相关'));assert(entry(1335).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('特技相关'));
});

test('SCT recovery preserves seconds, stocks, capacity, trigger and recipient',()=>{
 for(const[n,sec]of[[156,5],[159,10],[199,3],[730,1],[753,15],[460,30]]){const b=bindings(n)[0];assert.equal(b.restoreSeconds,sec);assert.equal(b.skillSelection,'all');assert.equal(b.restoreStocks,undefined);}
 for(const[n,slot]of[[164,1],[207,2],[256,3]]){assert.equal(bindings(n)[0].scope.skillSlot,slot);assert.equal(bindings(n)[0].restoreSeconds,20);}
 for(const n of[243,1335,1998]){const b=bindings(n)[0];assert.equal(b.skillSelection,'random-one');assert.equal(b.restoreStocks,1);assert.equal(b.restoreSeconds,undefined);}
 assert.equal(bindings(289)[0].skillSelection,'all');assert.equal(bindings(289)[0].restoreStocks,1);assert.equal(bindings(162)[0].fillTo,'each-skill-maximum-stock');
 for(const n of[213,264,461]){assert.equal(bindings(n)[0].stocks,1);assert.equal(bindings(n)[0].immediatelyRestoresStocks,false);}
 assert.equal(bindings(493)[0].amountSource,'incapacitated-ally-stocks');assert.equal(bindings(493)[0].mapping,'corresponding-skill-slot');assert.equal(bindings(493)[0].target,'self');
 const pair=bindings(1271)[0];assert.equal(pair.target,'paired-living-ally');assert.equal(pair.trigger.actor,'self');assert.equal(pair.pair.otherEquippedCount,1);assert.equal(pair.maxTriggers,1);assert.equal(pair.resetScope,'pair');
 assert.equal(bindings(753)[0].trigger.method,'own-active-skill');assert.equal(bindings(753)[0].target,'self');assert.equal(bindings(753)[0].maxTriggers,1);
 assert.equal(bindings(199)[0].trigger.passiveRegenCounts,false);assert.equal(bindings(204)[0].requiresEquippedSkillId,source(30).id);assert.equal(bindings(204)[0].amountStatus,'unconfirmed');
 for(const n of[583,604,827]){const b=bindings(n).find(b=>b.operation==='sct-speed-down');assert.equal(b.valuePercent,10);assert.equal(b.cooldownPercent,undefined);}
});

test('technique caps, costs, buffs and special effects retain their calculation boundaries',()=>{
 for(const n of[866,965,1046,1352,1637,1846,1427]){const b=bindings(n).find(b=>b.operation==='conditional-cap-up');assert.equal(b.scope.equipment,undefined);assert.equal(b.branches,'mutually-exclusive');assert(b.capCases.some(c=>c.otherwise));assert.equal(b.capPoints,undefined);const old=entry(n).tagDetails['单手'].bindings.find(b=>b.operation==='conditional-cap-up');assert.equal(old.scope.equipment.weaponCount,1);assert.equal(old.effectIdentity??`${entry(n).id}:${old.partIds[0]}`,b.effectIdentity);}
 const extra=bindings(1830).find(b=>b.group==='boss-skill-cap');assert.equal(extra.addsToPartId,'skill-cap');assert.equal(extra.capPoints,5000);assert.equal(extra.scope.enemyType,'boss');
 for(const[n,r,p]of[[202,'MP',3],[1766,'MP',3],[1257,'HP',15],[1914,'HP',15]]){const b=bindings(n).find(b=>b.operation==='consume-resource');assert.equal(b.costBase,'maximum-'+r);assert.equal(b.costPercent,p);assert.equal(b.scope.skillKind,'attack');assert.equal(b.payment.insufficientResourceStatus,'unconfirmed');}
 assert.equal(bindings(112)[0].lifetime,'permanent');assert.equal(bindings(112)[0].durationSeconds,undefined);assert.equal(bindings(666)[0].durationSeconds,40);assert.equal(bindings(112)[0].buffType,bindings(666)[0].buffType);assert.equal(bindings(173)[0].isBuff,false);
 const moving=bindings(510)[0];assert.equal(moving.progressionWithinOneBuff,true);assert.equal(moving.maxValuePercent,100);assert.equal(moving.valuePercent,undefined);assert.equal(moving.durationSeconds,undefined);
 const next=bindings(1773)[0];assert.equal(next.grantIntervalSeconds,10);assert.equal(next.uses,1);assert.equal(next.durationSeconds,undefined);assert.equal(next.activeByDefault,false);
 assert.equal(bindings(626)[0].condition.allSkillsNeedFull,false);for(const n of[458,1987,1799,1695])assert.equal(bindings(n)[0].valuePercent,undefined);
 assert.equal(bindings(831).find(b=>b.operation==='disable-skills').lockSeconds,30);assert.equal(bindings(831).find(b=>b.operation==='damage-up').durationSeconds,undefined);
 assert(bindings(1764).every(b=>b.operation==='break-up'));assert.equal(bindings(1816)[0].per,'skill-activation');assert.equal(bindings(1816)[1].hpBase,'target-maximum-HP');assert.equal(bindings(1816)[1].hpLossPercent,15);assert.equal(bindings(1816)[1].hpLossCapPoints,30000000);assert.equal(bindings(1931)[0].grantsLacerationSource,false);
});

test('technique completes only reviewed fragments and shares the resulting status with earlier pages',()=>{
 assert.equal(registry.tagPasses.length,69);assert.equal(catalog.numericEffectInjection,false);assert.equal(catalog.entries.length,866);assert.equal(view.counts.ready,46);assert.equal(view.counts.partial,36);assert.equal(catalog.views.all.counts.ready,571);assert.equal(catalog.views.all.counts.partial,295);
 for(const n of[112,164,213,243,583,604,626,721,753,827,831,843,866,1041,1311,1349,1427,1448,1658,1931,1998,968,1191,1607])assert.equal(entry(n).judgment,'ready',source(n).name);
 for(const n of[173,202,204,458,510,976,1257,1271,1272,1695,1764,1773,1799,1816,1914,1987])assert.equal(entry(n).judgment,'partial',source(n).name);
 assert.deepEqual(entry(1272).remainingEffects,[]);assert.match(entry(1272).remainingConditions.join(''),/共同属性/);assert.deepEqual(entry(1695).remainingEffects,[]);assert.deepEqual(entry(1695).remainingConditions,['伤害加成在10%～40%间随机；分布待确认']);
 for(const[n,key]of[[624,'boss'],[666,'ultimate'],[753,'revive'],[843,'full-hp'],[1427,'low-hp'],[866,'single-weapon'],[1658,'dual-weapon']])assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=technique'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});
 return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}
test('technique page renders grouped and deduplicated results, updates search, and invalidates edited descriptions',()=>{
 const {get,click}=page();assert.match(get('#labelCoverage').textContent,/935.*82.*853/);assert.match(get('#judgmentSummary').textContent,/46.*36.*0/);assert.match(get('#labelResultCount').textContent,/82 \/ 82/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,61);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,56);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,55);
 const search=get('#labelSearch');search.value='循环';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 82/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,1);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','technique-skill-damage');const html=get('#labelTable').innerHTML;assert(html.includes('神式-技-'));assert(!html.includes('巨人杀手'));assert(!html.includes('冲浪冲击'));assert(html.indexOf('神式-技-')<html.indexOf('星眼'));
 click('#labelTabs','ultimate');assert.match(get('#labelResultCount').textContent,/113 \/ 113/);
 const edits={[`skill:${source(626).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新增特技效果'}};const changed=page(edits);assert.match(changed.get('#labelResultCount').textContent,/83 \/ 83/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 const stale=skillLabelRows(data,view,edits).find(e=>e.id===source(626).id);assert.equal(stale.judgment,'unknown');assert.deepEqual(stale.conditionBindings,{});
});
