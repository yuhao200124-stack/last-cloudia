import {CATALOG as ROXY} from './roxy-rules.mjs?v=20260928-game-names';
import {CATALOG as MAYLY} from './mayly-rules.mjs?v=20260928-game-names';
import {CATALOG as ERIS} from './eris-rules.mjs?v=20260928-game-names';
import {DEFAULT_CONTEXT} from './effect-rule-engine.mjs?v=20260928-game-names';
import {ACCOUNT_BLESSING_CATALOG} from './account-blessings.mjs?v=20260924-fullpage';

// Character data belongs here; the page, confirmation and loadout UI are shared.
// Each gear entry's `name` is the item's real display name (verified against
// dist/game-data), used by the damage page's 专武 selector to label its
// per-item options; it never affects the damage calculation itself. Mayly's
// two exclusive weapons each have a further-upgraded tier in game data (higher
// maxStats, lower maxLv) -- per this project's "arks/enhancement calculated at
// maximum" convention, `name` here is that upgraded tier's name.
const definitions={
 '182':{catalog:MAYLY,context:{attack:'s1',damageType:'physical',element:'light',nativeAttackElement:'light',nativeElementAttacks:['s1','s2','s3','ultimate'],statReference:'str',weaponCount:0,magicFamily:null,killerBuff:false,bossWaveBuff:false},moveDefaults:{element:'光',damageType:'physical',statReference:'str'},gear:{'182-equipment-1693':{field:'axe',element:'light',name:'崇神狂翼基格罗亚'},'182-equipment-1694':{field:'sword',element:'dark',name:'魔祸呪翼格吉尔斯'}},conditions:[['bleeding','目标出血'],['enemyLightWeak','目标弱光'],['enemyDarkWeak','目标弱暗']]},
 '260':{catalog:ROXY,context:{},gear:{'roxy-staff':{field:'staff',iceStaff:true,name:'洛琪希之魔杖'},'roxy-robe':{field:'robe',armor:true,name:'洛琪希的衣服'}},conditions:[]},
 '259':{catalog:ERIS,context:{attack:'s1',damageType:'physical',element:'none',statReference:'str',weaponCount:1,magicFamily:null,killerBuff:false,bossWaveBuff:false},moveDefaults:{element:'无',damageType:'physical',statReference:'str'},gear:{'259-equipment-42':{field:'sword',name:'艾莉丝之剑'},'259-equipment-43':{field:'clothes',armor:true,name:'艾莉丝的衣服'}},conditions:[['nearestEnemy','攻击最近的敌人'],['partyAllAlive','我方至少2人且全员存活'],['enemyAttacking','敌人正在进行攻击动作'],['selfAilment','自身处于异常状态']]},
};
export function characterDefinition(id){return definitions[String(id)]||{catalog:[],context:{attack:'s1',damageType:null,element:null,magicFamily:null,killerBuff:false,bossWaveBuff:false},gear:{},conditions:[]};}
export function characterContext(id){const d=characterDefinition(id);return {...DEFAULT_CONTEXT,accountBlessings:false,...Object.fromEntries(d.conditions.map(([field])=>[field,false])),...d.context,equipmentIds:[]};}
export function characterMoveDefaults(id,kind){return kind==='magic'?{}:String(id)==='182'&&kind==='normal'?{damageType:'physical',statReference:'str'}:characterDefinition(id).moveDefaults||{};}
// Character pages show the game's own description text; pages written before that rule keep their
// earlier wording in data-rule-text, which is what the hand-checked rule catalogs were split from
// and are matched by. `text` is that matching key, `displayText` what the page actually shows.
const ruleText=el=>(el.dataset?.ruleText??el.textContent).trim();
const shownText=el=>el.textContent.trim();
export function collectCharacterSources(doc,{withElements=false}={}){
 const id=String(doc.body.dataset.characterId),seeds=characterDefinition(id).catalog,sources=[];
 const add=(name,text,group,el,displayText=text)=>{
  const seed=seeds.find(s=>s.group===group&&s.name===name);
  sources.push({id:seed?.id||`${id}-${group}-${sources.length+1}`,name,text,...(displayText!==text?{displayText}:{}),group,...(withElements?{originalElement:el}:{})});
 };
 doc.querySelectorAll('#traits .trait').forEach(el=>{const p=el.querySelector('p');add(el.querySelector('h4').textContent.trim(),ruleText(p),'traits',el,shownText(p));});
 for(const section of ['exclusive-skills','common-skills'])doc.querySelectorAll(`#${section} tbody tr`).forEach(el=>{const name=el.querySelector('.skill-name'),td=el.querySelector('td:last-child');add(name.textContent.trim(),ruleText(td),name.classList.contains('transcend')?'transcend':section==='exclusive-skills'?'exclusive':'common',el,shownText(td));});
 doc.querySelectorAll('#equipment .equipment-card').forEach(el=>{const dds=[...el.querySelectorAll('dd')];add(el.querySelector('h4').textContent.trim(),`最高属性：${dds[1].textContent.trim()}；最高效果：${ruleText(dds[2])}`,'equipment',el,`最高属性：${dds[1].textContent.trim()}；最高效果：${shownText(dds[2])}`);});
 // Move-specific bonuses are data too, and only apply to their own move.
 doc.querySelectorAll('#specials tbody tr').forEach(el=>{
  const name=el.querySelector('.skill-name')?.textContent.trim(),td=el.querySelector('td:last-child');
  if(seeds.some(s=>s.group==='specials'&&s.name===name))add(name,ruleText(td),'specials',el,shownText(td));
 });
 sources.push(...ACCOUNT_BLESSING_CATALOG.map(s=>({...s,...(withElements?{originalElement:doc.getElementById(s.id)}:{})})));
 return sources;
}
