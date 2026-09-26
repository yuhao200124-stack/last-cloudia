import {CATALOG as ROXY} from './roxy-rules.mjs?v=20260926-mayly';
import {CATALOG as MAYLY} from './mayly-rules.mjs?v=20260926-mayly';
import {CATALOG as ERIS} from './eris-rules.mjs?v=20260926-character-template';
import {DEFAULT_CONTEXT} from './effect-rule-engine.mjs?v=20260926-mayly';
import {ACCOUNT_BLESSING_CATALOG} from './account-blessings.mjs?v=20260924-fullpage';

// Character data belongs here; the page, confirmation and loadout UI are shared.
const definitions={
 '182':{catalog:MAYLY,context:{attack:'s1',damageType:'physical',element:'light',nativeAttackElement:'light',nativeElementAttacks:['s1','s2','s3','ultimate'],statReference:'str',weaponCount:0,magicFamily:null,killerBuff:false,bossWaveBuff:false},moveDefaults:{element:'光',damageType:'physical',statReference:'str'},gear:{'182-equipment-1693':{field:'axe',element:'light'},'182-equipment-1694':{field:'sword',element:'dark'}},conditions:[['bleeding','目标出血'],['enemyLightWeak','目标弱光'],['enemyDarkWeak','目标弱暗']]},
 '260':{catalog:ROXY,context:{},gear:{'roxy-staff':{field:'staff',iceStaff:true},'roxy-robe':{field:'robe',armor:true}},conditions:[]},
 '259':{catalog:ERIS,context:{attack:'s1',damageType:'physical',element:'none',statReference:'str',weaponCount:1,magicFamily:null,killerBuff:false,bossWaveBuff:false},moveDefaults:{element:'无',damageType:'physical',statReference:'str'},gear:{'259-equipment-42':{field:'sword'},'259-equipment-43':{field:'clothes',armor:true}},conditions:[['nearestEnemy','攻击最近的敌人'],['partyAllAlive','我方至少2人且全员存活'],['enemyAttacking','敌人正在进行攻击动作'],['selfAilment','自身处于异常状态']]},
};
export function characterDefinition(id){return definitions[String(id)]||{catalog:[],context:{attack:'s1',damageType:null,element:null,magicFamily:null,killerBuff:false,bossWaveBuff:false},gear:{},conditions:[]};}
export function characterContext(id){const d=characterDefinition(id);return {...DEFAULT_CONTEXT,accountBlessings:false,...Object.fromEntries(d.conditions.map(([field])=>[field,false])),...d.context,equipmentIds:[]};}
export function characterMoveDefaults(id,kind){return kind==='magic'?{}:String(id)==='182'&&kind==='normal'?{damageType:'physical',statReference:'str'}:characterDefinition(id).moveDefaults||{};}
export function collectCharacterSources(doc,{withElements=false}={}){
 const id=String(doc.body.dataset.characterId),seeds=characterDefinition(id).catalog,sources=[];
 const add=(name,text,group,el)=>{
  const seed=seeds.find(s=>s.group===group&&s.name===name);
  sources.push({id:seed?.id||`${id}-${group}-${sources.length+1}`,name,text,group,...(withElements?{originalElement:el}:{})});
 };
 doc.querySelectorAll('#traits .trait').forEach(el=>add(el.querySelector('h4').textContent.trim(),el.querySelector('p').textContent.trim(),'traits',el));
 for(const section of ['exclusive-skills','common-skills'])doc.querySelectorAll(`#${section} tbody tr`).forEach(el=>{const name=el.querySelector('.skill-name');add(name.textContent.trim(),el.querySelector('td:last-child').textContent.trim(),name.classList.contains('transcend')?'transcend':section==='exclusive-skills'?'exclusive':'common',el);});
 doc.querySelectorAll('#equipment .equipment-card').forEach(el=>{const dds=[...el.querySelectorAll('dd')];add(el.querySelector('h4').textContent.trim(),`最高属性：${dds[1].textContent.trim()}；最高效果：${dds[2].textContent.trim()}`,'equipment',el);});
 // Move-specific bonuses are data too, and only apply to their own move.
 doc.querySelectorAll('#specials tbody tr').forEach(el=>{
  const name=el.querySelector('.skill-name')?.textContent.trim();
  if(seeds.some(s=>s.group==='specials'&&s.name===name))add(name,el.querySelector('td:last-child').textContent.trim(),'specials',el);
 });
 sources.push(...ACCOUNT_BLESSING_CATALOG.map(s=>({...s,...(withElements?{originalElement:doc.getElementById(s.id)}:{})})));
 return sources;
}
