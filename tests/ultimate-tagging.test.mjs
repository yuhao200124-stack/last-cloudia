import {ADDITIONAL_RACE_TAGS,partsBeforeRaces} from './race-preservation-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {SKILL_LABELING_CATALOG as catalog} from '../dist/skill-labeling-catalog.mjs';
import {canonicalSkillRows,labelingView,skillLabelRows,filterLabelRows,resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const registry=JSON.parse(read('../docs/skill-labeling-registry.json')),audit=JSON.parse(read('../docs/ultimate-tag-audit.json'));
const box={window:{}};vm.runInNewContext(read('../dist/data.js'),box);const data=box.window.SKILL_DATA,all=canonicalSkillRows(data),view=labelingView(catalog,'ultimate');
const source=n=>all.find(r=>r.url.endsWith(`/gino/${n}`)),entry=n=>catalog.entries.find(e=>e.id===source(n).id),detail=n=>entry(n).tagDetails['必杀相关'];
const numbers=v=>v.entries.map(e=>Number(e.url.split('/').pop())).sort((a,b)=>a-b);
const mapping={'attack-up':[218,425],'magic-up':[249],'defense-up':[425,666,914],'mnd-up':[666],'hp-max':[666],'sct-speed':[666],'sct-restore':[1335],'mp-cost':[1214],'physical-damage':[1021],'ranged-physical-damage':[456],'physical-cap':[1858],'ultimate-damage':[1214,1617],'ultimate-cap':[1214,1617],'ice-ultimate-damage':[1695],'attack-reference':[1955],'physical-reduction':[1163],'magic-reduction':[1909]};

test('ultimate review audits all 935 skills, includes all 113 explicit ultimate clauses, and preserves typed subgroups',()=>{
 assert.equal(audit.rows.length,935);assert.equal(new Set(audit.rows.map(r=>r.id)).size,935);assert.equal(audit.matchedUnique,113);
 assert.deepEqual(numbers(view),[217,218,249,364,369,391,403,411,425,450,451,456,457,460,509,521,527,535,563,566,573,582,624,625,663,666,673,717,723,728,732,752,755,772,777,789,829,853,860,883,889,901,914,925,948,956,976,985,1014,1021,1037,1041,1057,1109,1120,1122,1136,1145,1163,1180,1191,1213,1214,1230,1239,1251,1264,1272,1284,1311,1317,1335,1336,1369,1398,1410,1416,1426,1447,1484,1520,1529,1547,1572,1583,1592,1603,1607,1617,1636,1658,1689,1691,1695,1705,1708,1726,1774,1780,1811,1815,1837,1838,1858,1884,1909,1913,1930,1955,1962,1971,1989,2026]);
 for(const row of all){const d=audit.rows.find(d=>d.id===row.id);assert.equal(d.sourceHash,createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes||''])).digest('hex'));assert.equal(d.decision==='related',view.entries.some(e=>e.id===row.id));}
 for(const [group,ns] of Object.entries(mapping)){const members=numbers(labelingView(catalog,'ultimate-'+group));assert(ns.every(n=>members.includes(n)),group);}
 assert.equal(view.childKeys.length,80);assert.equal(view.childKeys.reduce((n,k)=>n+catalog.views[k].counts.relatedUnique,0),173);
 const generic=numbers(labelingView(catalog,'ultimate-ultimate-damage'));
 for(const n of [411,391,1180,1272,1695,1884,1021,1858,1955])assert(!generic.includes(n),source(n).name);
 assert.deepEqual(numbers(labelingView(catalog,'ultimate-boss-ultimate-damage')),[411,624,985,1041,1311]);
 assert.deepEqual(numbers(labelingView(catalog,'ultimate-incoming-ultimate-down')),[521,573,1145,1989]);
 assert.equal(catalog.entries.length,935);assert.equal(new Set(catalog.entries.map(e=>e.id)).size,935);
});

test('ultimate conditions distinguish full gauges, enemy and self use, single-use buffs, and exact damage and resource effects',()=>{
 for(const n of [218,249,456,914,1163,1909]){const d=detail(n);assert.deepEqual(d.condition,{mode:'ultimate-gauge-full',subject:'self',metric:'current-ultimate-gauge-percent',operator:'eq',thresholdPercent:100});assert(d.bindings.every(b=>!b.isBuff && b.phase==='current-state' && !b.durationSeconds));}
 assert.equal(detail(425).condition.subject,'enemy');assert(detail(425).bindings.every(b=>b.target==='self' && b.durationStatus==='unconfirmed' && !b.durationSeconds));
 assert.equal(detail(666).condition.subject,'self');assert(detail(666).bindings.every(b=>b.isBuff && b.durationSeconds===40 && b.stacking==='highest-active-buff-of-same-type-only'));
 assert.equal(detail(666).bindings.find(b=>b.group==='hp-max').flatValue,1000);assert.equal(detail(666).bindings.find(b=>b.group==='sct-speed').valuePercent,25);
 assert.equal(detail(1021).bindings[0].group,'physical-damage');assert.equal(detail(1021).bindings[0].durationSeconds,40);
 assert.equal(detail(1858).bindings[0].group,'physical-cap');assert.equal(detail(1858).bindings[0].maxTriggersPerWave,1);assert.equal(detail(1858).bindings[0].durationStatus,'unconfirmed');assert(!detail(1858).bindings[0].durationSeconds);
 assert.equal(detail(1214).condition.ultimateKind,'attack');const cost=detail(1214).bindings.find(b=>b.group==='mp-cost');assert.equal(cost.costBase,'maximum-MP');assert.equal(cost.costPercent,20);assert(detail(1214).bindings.every(b=>!b.isBuff && b.phase==='damage-calculation'));
 const cycle=detail(1335).bindings[0];assert.equal(cycle.resource,'SCT');assert.equal(cycle.selection,'random-one-skill');assert.equal(cycle.restoreUses,1);assert.equal(cycle.restoreSeconds,undefined);
 assert.equal(detail(1617).condition.requiresActiveBuff,true);for(const b of detail(1617).bindings){assert.equal(b.activationMode,'next-use-buff');assert.equal(b.uses,1);assert.equal(b.grantIntervalSeconds,20);assert.equal(b.durationSeconds,undefined);}
 for(const n of [1695,1955])assert.equal(detail(n).condition.operator,'or');
 assert.match(entry(1695).remainingConditions.join(''),/随机.*待确认/);assert.match(entry(1955).parts.find(p=>p.id==='condition-1').text,/物理攻击.*或/);
 const ice=detail(1695).bindings[0];assert.equal(ice.element,'ice');assert.equal(ice.distributionStatus,'unconfirmed');assert.equal(ice.minPercent,10);assert.equal(ice.maxPercent,40);
 assert.equal(detail(1955).bindings.length,3);assert.equal(detail(1955).bindings[0].referenceStat,'STR');assert.equal(detail(1955).bindings[0].referencePercent,30);assert.deepEqual(entry(1955).remainingConditions,[]);
});

test('ultimate effects complete cumulatively while unrelated effects and unreviewed conditions stay pending',()=>{
 assert.equal(registry.tagPasses.length,90);assert.equal(catalog.numericEffectInjection,false);
 const pass=registry.tagPasses.find(p=>p.tag==='必杀相关');for(const a of pass.assignments){const e=entry(Number(catalog.entries.find(e=>e.id===a.skillId).url.split('/').pop())),d=e.tagDetails['必杀相关'];assert.deepEqual(a.partIds,[...d.coverage.effectPartIds,...d.coverage.conditionPartIds]);assert(d.coverage.effectPartIds.length);}
 for(const n of [364,369,732,883,948,1037,1057,1122,1264,1284,1335,1447,666,456,1163,1909,777,1520,1884])assert.equal(entry(n).judgment,'ready',source(n).name);
 for(const n of [217,425,1145,1214,1272,1617,1695,1858])assert.equal(entry(n).judgment,'partial',source(n).name);
 assert.equal(view.counts.ready,104);assert.equal(view.counts.partial,9);assert.equal(catalog.views.all.counts.ready,757);assert.equal(catalog.views.all.counts.partial,178);
 assert.deepEqual(entry(666).remainingEffects,[]);assert.deepEqual(entry(666).remainingConditions,[]);
 assert(entry(425).remainingConditions.some(t=>t.includes('持续时间待确认')));
 assert.deepEqual(entry(717).remainingEffects,[]);assert.deepEqual(entry(717).remainingConditions,[]);assert.equal(entry(717).judgment,'ready');
 assert.deepEqual(entry(777).remainingEffects,[]);
 assert.deepEqual(entry(1272).remainingEffects,[]);assert(entry(1272).remainingEffects.every(t=>!t.includes('必杀')));
 assert(entry(1955).remainingEffects.every(t=>t.includes('物理')&&!t.includes('必杀')));
 assert(!entry(1695).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('物理伤害增加'));assert(!entry(1695).assignedTags.filter(tag=>!['物理','魔法','鸟','Boss','铠甲','衣服','法袍','防御','魔抗','伤害减少','异常','Break','格挡','反击','普通攻击','追击','HP回复','吸血','杂项','属性弱点','连击','击败敌人','战斗结束','空中','背后攻击','队伍联动','战斗时间','距离','HP持续消耗','致命伤害存活','通用伤害上限','触发次数与重置',...ADDITIONAL_RACE_TAGS].includes(tag)).includes('伤害增加'));
 const prior=structuredClone(registry);prior.tagPasses=prior.tagPasses.filter(p=>p.tag!=='必杀相关');assert.equal(resolveSkillLabels(prior).find(e=>e.id===source(883).id).judgment,'partial');
 for(const[n,key]of[[883,'fire'],[1264,'low-hp'],[777,'single-weapon'],[1884,'critical'],[985,'boss']])assert.deepEqual(labelingView(catalog,key).entries.find(e=>e.id===source(n).id),entry(n));
});

test('ultimate metadata distinguishes eligibility, targets, delayed buffs, party counts, and additive versus replacement caps',()=>{
 const bindings=n=>detail(n).bindings;
 for(const b of bindings(948)){assert.equal(b.trigger.delaySeconds,40);assert.equal(b.trigger.retryWhenIncapacitatedSeconds,40);assert.equal(b.endsOn,'incapacitated');assert.equal(b.durationSeconds,undefined);}
 const crit=bindings(1884).find(b=>b.operation==='enable-critical');assert.equal(crit.grantsCriticalEligibility,true);assert.equal(crit.guaranteedCritical,false);assert.equal(crit.scope.selfRace,'dragon');assert.equal(crit.ratePoints,undefined);
 const killer=bindings(1426)[0];assert.equal(killer.scope.enemyRace,'sorcerer');assert.equal(killer.operation,'enable-killer');assert.equal(killer.valuePercent,undefined);
 const race=bindings(2026);assert(race.every(b=>b.scope.enemyRace==='dragon' && b.scope.attackType==='ultimate'));assert.equal(race[0].valuePercent,10);assert.equal(race[1].capPoints,2000);
 const match=bindings(1272);assert(match.every(b=>b.scope.equipment.weaponCount===2&&b.scope.equipment.sameWeaponElement&&b.scope.attackElementRelation==='same-as-both-equipped-weapons'));
 for(const n of[1603,1774]){const b=bindings(n)[0];assert.equal(b.operation,'conditional-cap-up');assert.deepEqual(b.capCases.map(c=>c.capPoints),[3000,1500]);assert.equal(b.capPoints,undefined);}
 const extra=bindings(1955).find(b=>b.addsToPartId);assert.equal(extra.capPoints,10000);assert.equal(extra.addsToPartId,'boss-ultimate-cap');assert.equal(extra.scope.equipment.weaponCount,1);
 for(const n of[1191,1607]){const b=bindings(n)[0];assert.equal(b.capPerUnit,1000);assert.equal(b.count.maxCount,4);assert.equal(b.capPoints,undefined);}
 assert.deepEqual(bindings(1708)[0].tiers.map(t=>t.capPoints),[5000,10000,15000]);
 assert.equal(bindings(976)[0].condition.metric,'participating-unit-count');assert.equal(bindings(1547)[0].condition.metric,'living-allied-unit-count');
 assert.equal(bindings(1811)[0].operation,'incoming-damage-up');assert.equal(bindings(1989)[0].scope.equipment.armorCount,1);
 assert.equal(bindings(460)[0].restorePercent,10);assert.equal(bindings(460)[0].restoreBase,'maximum-ultimate-gauge');assert.equal(bindings(217)[0].valuePercent,undefined);
});

function page(edits={}){
 const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,{value:'',textContent:'',innerHTML:'',hidden:false,listeners:{},addEventListener(k,v){this.listeners[k]=v;},setAttribute(){},focus(){}});return elements.get(k);};
 const code=read('../dist/skill-labeling.mjs').replace(/^import .*;\n/gm,'').replace('export function renderLabelTable','function renderLabelTable');
 vm.runInNewContext(code,{catalog,skillLabelRows,labelingView,filterLabelRows,URLSearchParams,document:{querySelector:get},window:{SKILL_DATA:data,location:{search:'?tag=ultimate'},addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(edits),setItem(){assert.fail('Do not modify saved data.');}}});
 return {get,click:(nav,tag)=>get(nav).listeners.click({target:{closest:()=>({dataset:{tag}})}})};
}
test('ultimate view shows separate effects, synchronized status ordering, deduplicated search and previous views',()=>{
 const {get,click}=page();assert.match(get('#labelCoverage').textContent,/935.*113.*822/);assert.match(get('#judgmentSummary').textContent,/104.*9.*0/);assert.match(get('#labelResultCount').textContent,/113 \/ 113/);
 assert.equal((get('#labelTabs').innerHTML.match(/role="tab"/g)||[]).length,82);assert.equal((get('#labelSubTabs').innerHTML.match(/role="tab"/g)||[]).length,81);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,80);
 const def=get('#labelTable').innerHTML.split('<section ').find(s=>s.includes('id="section-ultimate-defense-up"'));assert(def.indexOf('护罩之力')<def.indexOf('能量循环'));
 const search=get('#labelSearch');search.value='万圣节派对';search.listeners.input();assert.match(get('#labelResultCount').textContent,/1 \/ 113/);assert.equal((get('#labelTable').innerHTML.match(/<section /g)||[]).length,4);
 get('#clearLabelSearch').listeners.click();click('#labelSubTabs','ultimate-ultimate-damage');assert(get('#labelTable').innerHTML.includes('万物尽灭'));assert(get('#labelTable').innerHTML.includes('鸣动之深渊'));assert(!get('#labelTable').innerHTML.includes('冲浪冲击'));assert(!get('#labelTable').innerHTML.includes('我想成为完美的存在'));
 for(const [key,count] of [['received-attack',21],['full-hp',6],['low-hp',26],['battle-start',117],['boss',31]]){click('#labelTabs',key);assert.equal(get('#labelResultCount').textContent,`显示 ${count} / ${count} 个技能（去重）`);}
 const edits={[`skill:${source(218).id}`]:{effect:'未知效果'},[`skill:${source(9).id}`]:{effect:'新必杀条件'}};const changed=page(edits);assert.match(changed.get('#labelResultCount').textContent,/114 \/ 114/);assert.match(changed.get('#labelTable').innerHTML,/描述已修改，待重新判断（2）/);
 const stale=skillLabelRows(data,view,edits).find(e=>e.id===source(218).id);assert.equal(stale.judgment,'unknown');assert.deepEqual(stale.conditionBindings,{});
});
