import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SKILL_TAG_CATALOG as tags} from '../dist/skill-tag-catalog.mjs';
import {STAT_CONDITIONS} from '../dist/stat-condition-fields.mjs';
import {nonDamageMagic,supportMagicRule} from '../dist/magic-buffs.mjs';
const box={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../dist/data.js',import.meta.url),'utf8'),box);
const data=box.window.SKILL_DATA,entry=name=>Object.values(tags).find(e=>e.name===name);
test('partial tags retain canonical identities across categories without changing skill counts',()=>{
 assert.equal(Object.keys(tags).length,76);assert.equal(data.skillCensus.taggedUnique,76);
 assert.equal(data.skillCensus.uniqueTotal,935);assert.equal(data.skillCensus.basicTotal,181);
 for(const sheet of Object.values(data.sheets))for(const row of sheet.rows||sheet.lanes.flatMap(l=>l.rows))if(row.skillTags){
  const e=tags[row.skillTags.catalogId];assert(e);assert.equal(row.effect,e.text);
  assert.deepEqual(JSON.parse(JSON.stringify(row.skillTags.facets)),e.facets);assert.equal(row.skillTags.status,'partial');
 }
});
test('empty slots, weapon count and matching type/element retain distinct requirements',()=>{
 assert.deepEqual(entry('光头猴').facets[0].requirements,{weaponCount:[0],armorEquipped:false});
 assert.deepEqual(entry('裸身之力').facets[0].requirements,{armorEquipped:false});
 assert.deepEqual(entry('徒手空拳').facets[0].requirements,{weaponCount:[0]});
 assert.deepEqual(entry('两手剑').facets[0].requirements,{weaponCount:[1],weaponTypes:['剑']});
 const sameType=entry('同类二刀增幅').facets[0].requirements,sameElement=entry('和谐节拍').facets[0].requirements;
 assert.equal(sameType.weaponTypeRelation,'same');assert.equal(sameType.weaponElementRelation,'unrestricted');
 assert.equal(sameElement.weaponElementRelation,'same');assert.equal(sameElement.weaponTypeRelation,'unrestricted');
 assert.equal(entry('Zero之骑士').facets[0].requirements.weaponTypeRelation,'unrestricted');
 const partial=entry('荒神御魂').facets[0];assert.equal(partial.scope,'clause');assert(!partial.sourceText.includes('HP-15%'));assert.deepEqual(partial.requirements.weaponCount,[0,1]);
});
test('low HP scaling and shared-skill counts are not reduced to fixed near-death or multiplayer booleans',()=>{
 const life=entry('生命鼓舞').facets[0],alliance=entry('魔兽同盟').facets[0];
 assert.equal(life.calculationClass,'conditional-passive');assert.equal(life.requirements.hpDependency,'continuous-decreasing');assert.equal(life.requirements.lowHp,undefined);assert.equal(life.formulaStatus,'pending');
 assert.equal(alliance.requirements.countIncludesSelf,true);assert.equal(alliance.requirements.partySkillId,entry('魔兽同盟').id);assert.deepEqual(alliance.percentByCount,{2:5,3:10,4:15});
});
test('special damage switches are separate from general conditions',()=>{
 const html=fs.readFileSync(new URL('../dist/damage-calculator.html',import.meta.url),'utf8');
 const row=html.match(/<div class="inline-options attack-options">([\s\S]*?)<\/div>/)[1];
 assert.deepEqual([...row.matchAll(/id="([^"]+)"/g)].map(m=>m[1]),['dualWield','specialAttack','break','criticalEnabled','boss','weakness']);
 assert.match(html,/<h3>魔法<\/h3>/);assert.match(html,/<h3 id="generalDamageTitle">通用伤害改变<\/h3>/);
 assert.match(html,/id="conditionBuffActive"/);assert.doesNotMatch(html,/现实时间为周日/);
 for(const field of ['ultimateUsedBuffActive','damageTakenBuffActive','reviveBuffActive','realSunday','ultimateGaugeFull'])assert.equal(STAT_CONDITIONS[field].deferred,true);
});
test('magic area includes all non-damage spells and only applies recognized support formulas',()=>{
 const profile={magic:[{name:'火炎术',purpose:'attack'},{name:'魔术指导',purpose:'support',description:'已确认'}, {name:'守护祈祷',purpose:'unknown',description:'尚待核对'}]};
 const spells=nonDamageMagic(profile),known=[{name:'魔术指导',description:'已确认',id:'guidance'}];
 assert.deepEqual(spells.map(s=>s.name),['魔术指导','守护祈祷']);
 assert.equal(supportMagicRule(spells[0],known)?.id,'guidance');
 assert.equal(supportMagicRule(spells[1],known),undefined);
});
