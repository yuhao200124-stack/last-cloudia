import {characterHitStage,characterSourceAllowed} from './character-combat-rules.mjs?v=20260924-fullpage';
import {criticalDamageEffect} from './critical-options.mjs?v=20260924-fullpage';
import {blockedCombatModes} from './combat-modes.mjs?v=20260924-fullpage';
// Transfer qualified effects, never reinterpret a stat bonus as a skill multiplier.
export const reportStorageKey = id => `lc-damage-report:${id}:v1`;
const elements = { none:'无', fire:'火', ice:'冰', earth:'树', thunder:'雷', light:'光', dark:'暗' };
const attackNames = {normal:'普通攻击',s1:'特技1',s2:'特技2',s3:'特技3',magic:'魔法',ultimate:'超必杀技'};
const kinds = { '伤害':'all', '所有伤害':'all', '魔法伤害':'magical', '物理伤害':'physical', '特技伤害':'skill', '超必杀技伤害':'ultimate', '普通攻击伤害':'normal', '特攻伤害':'killer', 'Break伤害':'break', 'Break时伤害':'break', '命中弱点的魔法伤害':'weak', '对Boss的魔法伤害':'boss', '对Boss的伤害':'boss' };
export function buildDamageImport(report) {
  if (report?.kind !== 'last-cloudia-effect-report' || !Array.isArray(report.rows) || !report.context) throw new Error('基础加成报告格式不正确');
  const c=report.context;
  const imported={characterId:String(report.characterId),characterName:report.characterName,createdAt:report.createdAt,
    attackName:attackNames[c.attack]||'未选择',attack:c.attack,magicFamily:c.magicFamily,type:c.damageType,skillType:c.attackKind,element:elements[c.element],
    effects:[],reference:[],warnings:[],blockers:[],capAdded:0,criticalCapAdded:0,critAdded:0,critAttackAdded:0,critUnresolved:[],magicCanCrit:false,criticalEnabled:c.criticalEnabled,
    bossKiller:false,killerCorrection:0,defenseRatio:1,hitMultiplier:1,hitDamageRatio:1,hitSources:[],hitSourceKind:null,statReference:null};
  if (!['physical','magical'].includes(c.damageType) || !imported.element) imported.blockers.push('请在基础计算器确认伤害类型和攻击属性。');
  const defense=[],hit=[],refs=[];
  for (const row of report.rows) {
    if(row.status!=='active') continue;
    if(!characterSourceAllowed(report.characterId,row.sourceId)){imported.blockers.push(`${row.sourceName}：角色专属效果与当前角色不匹配。`);continue;}
    for (const [index,e] of row.rule.effects.entries()) {
      if(blockedCombatModes(e,row.rule.conditions,c,row.rule.effects).length)continue;
      const id=`${row.sourceId}:${row.rule.id}:${row.effectIndices?.[index]??index}`;
      const entry={id,sourceId:row.sourceId,ruleId:row.rule.id,source:row.sourceName,effect:e,group:row.group};
      const number=typeof e.value==='number' && Number.isFinite(e.value);
      const criticalOnly=criticalDamageEffect(e,row.rule.conditions);
      if(e.type==='damage') {
        let kind=kinds[e.target];let target=imported.element;
        if(Object.values(elements).some(el=>e.target===`${el}属性伤害`)) kind='element';
        if(Object.values(elements).some(el=>e.target===`${el}属性魔法伤害`)) kind='magical';
        if(e.target.includes('暴击伤害')) kind='critical';
        if(!kind || !number || e.unit!=='%') { imported.blockers.push(`${row.sourceName}：${e.target}尚无伤害字段映射，请先在基础计算器确认或停用。`);continue; }
        imported.effects.push({importId:id,kind,target,percent:e.value,enabled:true,stage:'post',name:`${row.sourceName} · ${e.target}`,
          criticalOnly,scope:{type:c.damageType,skillType:c.attackKind,element:imported.element,boss:c.boss},sourceText:row.sourceText});
      } else if(e.type==='killerPower') {
        if(number&&e.unit==='%')imported.killerCorrection+=e.value;
        else imported.blockers.push(`${row.sourceName}：特攻威力修正未确认。`);
        imported.reference.push(entry);
      } else if(e.type==='cap') {
        if(number && e.unit==='') {if(criticalOnly)imported.criticalCapAdded+=e.value;else imported.capAdded+=e.value;}
        else imported.blockers.push(`${row.sourceName}：上限修正${e.value}${e.unit}尚未确认计算顺序。`);
        imported.reference.push(entry);
      } else if(e.type==='critRate' && number && e.unit==='%') {
        imported.critAdded+=e.value;
        if(e.readerStage==='attack')imported.critAttackAdded+=e.value;
        else if(!['panel','runtime'].includes(e.readerStage))imported.critUnresolved.push(row.sourceName);
        imported.reference.push(entry);
      }
      else if(e.type==='critPermission') { if(e.value===true)imported.magicCanCrit=true; imported.reference.push(entry); }
      else if(e.type==='killer') { if(e.target==='Boss' && e.value===true) imported.bossKiller=true; else imported.blockers.push(`${row.sourceName}：特攻目标尚未映射。`); imported.reference.push(entry); }
      else if(e.type==='defenseReference') { defense.push(entry);imported.reference.push(entry); }
      else if(e.type==='hit') {hit.push(entry);imported.reference.push(entry);}
      else if(e.type==='statReference') {refs.push(entry);imported.reference.push(entry);}
      else if(['stat','statBuff','equipmentStat'].includes(e.type)) imported.reference.push(entry);
    }
    if(row.rule.verification==='untested') imported.warnings.push(`${row.sourceName}：${row.rule.note||'特殊结算尚未实测，结果仅供试算。'}`);
  }
  if(refs.length===1 && refs[0].effect.target==='法强' && refs[0].effect.value==='魔抗') imported.statReference='int';
  else if(refs.length) imported.blockers.push('存在未确认或多个攻击属性参照，需先核对。');
  if(defense.length===1 && defense[0].effect.target==='敌方魔抗' && defense[0].effect.unit==='%' && typeof defense[0].effect.value==='number' && defense[0].effect.value>=0 && defense[0].effect.value<=100) {
    if(c.attackKind==='magic' || imported.statReference==='int') imported.defenseRatio=defense[0].effect.value/100;
    else imported.blockers.push('当前防御参照不是魔抗，不能应用魔抗修正。');
  } else if(defense.length) imported.blockers.push('存在未确认或多个防御参照修正，需先核对。');
  if(hit.length===1 && Number.isInteger(hit[0].effect.value) && hit[0].effect.value>0 && Number.isFinite(hit[0].effect.secondary) && hit[0].effect.secondary>=0) {
    imported.hitMultiplier=hit[0].effect.value;imported.hitDamageRatio=hit[0].effect.secondary;
    imported.hitSources=hit.map(e=>e.source);
    const stage=characterHitStage(report.characterId,hit[0],c);if(stage)imported.hitScaleStage=stage;
    imported.hitSourceKind=['reader','manual'].includes(hit[0].effect.parameterSource)?hit[0].effect.parameterSource:'website';
  } else if(hit.length) imported.blockers.push('存在未确认或多个分段效果，需先核对。');
  if(imported.effects.length) imported.warnings.push('增伤沿用当前引擎的后置逐条结算；导入顺序是来源顺序，尚未确认为游戏实际执行顺序，可在每条“更多”中调整。');
  if(typeof c.killerOverride==='boolean')imported.bossKiller=c.killerOverride;
  return imported;
}
