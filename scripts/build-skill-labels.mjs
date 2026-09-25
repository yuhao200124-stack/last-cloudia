import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {canonicalSkillRows, resolveSkillLabels} from '../dist/skill-labeling-model.mjs';
const root = new URL('../', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, root), 'utf8'));
const shared = read('docs/skill-labeling-registry.json');
if (shared.numericEffectInjection !== false) throw Error('Label metadata must not inject calculator effects.');
const resolved = resolveSkillLabels(shared);
const box = {window:{}};
vm.runInNewContext(fs.readFileSync(new URL('dist/data.js', root), 'utf8'), box);
const rows = canonicalSkillRows(box.window.SKILL_DATA);
const source = new Map(rows.map(row=>[row.id,row]));
const digest = row => createHash('sha256').update(JSON.stringify([row.id,row.url,row.name,row.effect,row.notes || ''])).digest('hex');
for (const entry of resolved) {
  const row=source.get(entry.id);
  if (!row || entry.name!==row.name || entry.text!==row.effect || entry.notes!==(row.notes||'') || entry.url!==row.url) throw Error(`Shared source drift: ${entry.id}`);
  for (const tag of entry.assignedTags) if (!entry.tagDetails?.[tag]?.summary) throw Error(`Missing tag explanation: ${entry.id}/${tag}`);
  for (const dependency of entry.relatedSkillIds || []) if (!resolved.some(other=>other.id===dependency)) throw Error(`Missing linked skill: ${entry.id}`);
}
const countsFor = entries => ({reviewedUnique:rows.length,relatedUnique:entries.length,notRelatedUnique:rows.length-entries.length,
  ready:entries.filter(entry=>entry.judgment==='ready').length,
  partial:entries.filter(entry=>entry.judgment==='partial').length,
  unknown:entries.filter(entry=>entry.judgment==='unknown').length});
const checkOrder = (view,entries) => {
  const ids=new Set(entries.map(entry=>entry.id));
  if(new Set(view.displayOrder).size!==view.displayOrder.length || view.displayOrder.length!==ids.size || view.displayOrder.some(id=>!ids.has(id))) throw Error('View order membership drift.');
};
const views={};
for(const [key,label,previousKey,basicTarget=label] of [['attack','攻击力','previousBasicAttackUnique'],['defense','防御力','previousBasicDefenseUnique'],['hp','生命力','previousBasicHpUnique','HP'],['magic','魔力','previousBasicMagicUnique','法强'],['mp','MP','previousBasicMpUnique'],['physical','物理伤害增加',null],['magic-damage','魔法伤害增加',null],['damage','伤害增加',null],['boss-damage','Boss伤害增加',null],['boss-magic-damage','Boss魔法伤害增加',null],['boss-physical-damage','Boss物理伤害增加',null],['boss-skill-damage','Boss特技伤害增加',null],['boss-ultimate-damage','Boss必杀伤害增加',null],['boss-critical-damage','Boss暴击伤害增加',null],['battle-start','战斗开始',null],['low-hp','濒死',null],['full-hp','满HP',null],['received-attack','受到攻击',null],['ultimate','必杀相关',null],['revive','复活',null],['ally-death','友军死亡',null],['critical','暴击',null]]){
  const registry=read(`docs/${key}-tag-registry.json`),audit=read(`docs/${key}-tag-audit.json`);
  if(registry.label!==label || audit.label!==label || registry.numericEffectInjection!==false)throw Error('Tag pass metadata mismatch.');
  const entries=resolved.filter(entry=>entry.assignedTags.includes(label)), byId=new Map(entries.map(entry=>[entry.id,entry]));
  if(new Set(registry.skillIds).size!==registry.skillIds.length || entries.length!==registry.skillIds.length || registry.skillIds.some(id=>!byId.has(id)))throw Error(`Missing or duplicate ${label} member.`);
  const decisions=new Map(audit.rows.map(row=>[row.id,row]));
  if(decisions.size!==audit.rows.length || rows.length!==audit.reviewedUnique || decisions.size!==rows.length)throw Error('Full-library review is incomplete.');
  for(const row of rows){
    const decision=decisions.get(row.id);
    if(!decision || decision.url!==row.url || decision.sourceHash!==digest(row))throw Error(`Source changed; review again: ${row.id}`);
    if(!['related','not-related'].includes(decision.decision) || (decision.decision==='related')!==byId.has(row.id))throw Error(`Unreviewed or inconsistent tag: ${row.id}`);
  }
  if(entries.length!==audit.matchedUnique)throw Error('Related skill total drifted.');
  if(key==='battle-start'){
    const permanent=entries.filter(entry=>entry.tagDetails[label].activationMode==='permanent-status');
    if(registry.permanentStatusIds?.length!==permanent.length || new Set(registry.permanentStatusIds).size!==permanent.length || permanent.some(entry=>!registry.permanentStatusIds.includes(entry.id)) || audit.permanentStatusUnique!==permanent.length)throw Error('Permanent status membership drifted.');
    for(const decision of audit.rows)if((decision.classification==='permanent-status')!==registry.permanentStatusIds.includes(decision.id))throw Error('Permanent status audit mismatch.');
  }
  const previous=previousKey ? rows.filter(row=>row.basicStats?.targets.includes(basicTarget)) : [];
  if(previousKey && (previous.length!==audit[previousKey] || previous.some(row=>!byId.has(row.id))))throw Error(`Previously known ${label} skill missed.`);
  const view=shared.views[key];
  if(view.label!==label)throw Error('View label mismatch.');
  checkOrder(view,entries);
  const counts={...countsFor(entries),...(previousKey?{[previousKey]:previous.length,additionalRelatedUnique:entries.length-previous.length}:{})};
  views[key]={...view,counts};
  if(key==='attack'){
    const catalog={...registry,entries,displayOrder:view.displayOrder,counts};
    fs.writeFileSync(new URL('dist/attack-tag-catalog.mjs',root),`// Generated by scripts/build-skill-labels.mjs. Labels are not executable bonuses.\nexport const ATTACK_TAG_CATALOG = ${JSON.stringify(catalog,null,2)};\n`);
  }
}
// A group is a union of existing tag views, never another assigned skill tag.
for(const [key,view] of Object.entries(shared.views).filter(([,view])=>Array.isArray(view.tagKeys))){
  if(!view.tagKeys.length || new Set(view.tagKeys).size!==view.tagKeys.length || view.tagKeys.some(child=>!views[child] || views[child].parent!==key))throw Error('Invalid grouped label views.');
  const tags=new Set(view.tagKeys.map(child=>views[child].label));
  const entries=resolved.filter(entry=>entry.assignedTags.some(tag=>tags.has(tag)));
  checkOrder(view,entries);
  views[key]={...view,counts:countsFor(entries)};
}
// Conditional subviews use reviewed effect bindings. Intersecting whole-skill
// tags would incorrectly include unrelated passive and delayed effects.
for(const [key,view] of Object.entries(shared.views).filter(([,view])=>view.effectGroup)){
  const parent=views[view.parent];
  if(!parent || parent.label!==view.conditionTag || !parent.childKeys?.includes(key))throw Error('Invalid condition effect group.');
  const entries=resolved.filter(entry=>entry.assignedTags.includes(view.conditionTag) && entry.tagDetails[view.conditionTag].bindings?.some(binding=>binding.group===view.effectGroup));
  checkOrder(view,entries);
  views[key]={...view,counts:countsFor(entries)};
}
for(const [key,view] of Object.entries(views)){
  if(view.parent && !(views[view.parent]?.tagKeys || views[view.parent]?.childKeys)?.includes(key))throw Error('Unlisted child label view.');
  if(!view.childKeys)continue;
  if(new Set(view.childKeys).size!==view.childKeys.length || view.childKeys.some(child=>views[child]?.parent!==key))throw Error('Invalid condition child views.');
  const groups=new Set(view.childKeys.map(child=>views[child].effectGroup));
  const pass=shared.tagPasses.find(pass=>pass.tag===view.label);
  for(const assignment of pass.assignments){
    const entry=resolved.find(entry=>entry.id===assignment.skillId),detail=entry.tagDetails[view.label];
    // MP is an existing resource tag expanded in place. Its resource effects
    // and MP-state conditions can be covered; displayed benefits keep their
    // own effect tags. All other grouped passes remain condition-only.
    if(key==='mp'){
      const coverage=detail.coverage;
      if(view.passKind!=='resource-and-condition' || detail.resource!=='MP' || !Array.isArray(coverage?.resourcePartIds) || !Array.isArray(coverage?.conditionPartIds))throw Error('MP resource coverage is missing.');
      const ids=[...coverage.resourcePartIds,...coverage.conditionPartIds];
      if(new Set(ids).size!==ids.length || ids.length!==assignment.partIds.length || ids.some(id=>!assignment.partIds.includes(id)))throw Error('MP must cover only reviewed MP fragments.');
      if(coverage.resourcePartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='effect') || coverage.conditionPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='condition'))throw Error('MP resource and condition fragments are mixed.');
      const condition=detail.condition;
      if(coverage.conditionPartIds.length){
        if(condition?.subject!=='self' || !['mp-full','mp-threshold','mp-scaling'].includes(condition.mode))throw Error('Missing MP condition.');
        if(condition.mode==='mp-full' && (condition.metric!=='current-MP-percent-of-maximum' || condition.operator!=='eq' || condition.thresholdPercent!==100))throw Error('Full MP must equal current maximum MP.');
        if(condition.mode==='mp-threshold'){
          if(condition.metric==='current-MP-points'){
            if(!(condition.thresholdPoints>=0) || Object.hasOwn(condition,'thresholdPercent'))throw Error('MP point thresholds are not percentages.');
          }else if(condition.metric!=='current-MP-percent-of-maximum' || !(condition.thresholdPercent>=0 && condition.thresholdPercent<=100) || Object.hasOwn(condition,'thresholdPoints'))throw Error('MP percent threshold is invalid.');
        }
        if(condition.mode==='mp-scaling' && (condition.metric!=='current-MP' || !['higher-MP-stronger','lower-MP-stronger'].includes(condition.direction) || condition.curveStatus!=='unconfirmed' || Object.hasOwn(condition,'thresholdPoints') || Object.hasOwn(condition,'thresholdPercent')))throw Error('MP scaling must not become a fixed threshold.');
      }
    }else if(key==='critical'){
      const coverage=detail.coverage;
      if(view.passKind!=='critical-effects-and-condition' || !Array.isArray(coverage?.effectPartIds) || !Array.isArray(coverage?.conditionPartIds))throw Error('Missing critical coverage.');
      const ids=[...coverage.effectPartIds,...coverage.conditionPartIds];
      if(new Set(ids).size!==ids.length || ids.length!==assignment.partIds.length || ids.some(id=>!assignment.partIds.includes(id)))throw Error('Critical coverage must match reviewed fragments.');
      if(coverage.effectPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='effect') || coverage.conditionPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='condition'))throw Error('Critical effects and conditions are mixed.');
      if(coverage.conditionPartIds.length && (!['self-attack','enemy-attack'].includes(detail.condition?.subject) || !['critical-hit','critical-hit-received'].includes(detail.condition?.event)))throw Error('Actual critical events must identify the attacking side.');
    }else if(key==='revive'){
      const coverage=detail.coverage,c=detail.condition;
      if(view.passKind!=='revival-and-condition' || !Array.isArray(coverage?.revivalPartIds) || !Array.isArray(coverage?.conditionPartIds))throw Error('Missing revival coverage.');
      const ids=[...coverage.revivalPartIds,...coverage.conditionPartIds];
      if(new Set(ids).size!==ids.length || ids.length!==assignment.partIds.length || ids.some(id=>!assignment.partIds.includes(id)))throw Error('Revival must cover only revival operations or conditions.');
      if(coverage.revivalPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='effect') || coverage.conditionPartIds.some(id=>entry.parts.find(p=>p.id===id)?.kind!=='condition'))throw Error('Invalid revival fragment types.');
      if(c?.actor!=='self' || !['self-revival','after-self-revival','after-ally-revival'].includes(c.mode))throw Error('Invalid revival event actor or mode.');
      if(c.mode==='self-revival'){
        if(c.revivedTarget!=='self' || c.requiresIncapacitated!==true || !['self-incapacitated','battle-start'].includes(c.event) || !coverage.revivalPartIds.length || coverage.conditionPartIds.length)throw Error('Automatic revival requires an incapacitated self.');
      }else{
        if(coverage.revivalPartIds.length || !coverage.conditionPartIds.length)throw Error('A post-revival benefit must not grant revival ability.');
        if(c.mode==='after-self-revival' && (c.revivedTarget!=='self' || c.event!=='revived'))throw Error('Missing self-revival trigger.');
        if(c.mode==='after-ally-revival' && (c.revivedTarget!=='ally' || c.event!=='ally-revived' || c.method!=='own-active-skill'))throw Error('Ally revival must preserve its caster and method.');
      }
    }else if(assignment.partIds.some(id=>entry.parts.find(part=>part.id===id)?.kind!=='condition'))throw Error('Condition pass must not cover unreviewed effect tags.');
    if(!detail.bindings?.length)throw Error('Missing condition effect bindings.');
    const permanent=detail.activationMode==='permanent-status';
    if(key==='battle-start' && (permanent ? detail.trigger?.event!=='always-active' || Object.hasOwn(detail.trigger,'delaySeconds') : detail.trigger?.delaySeconds!==0))throw Error('Invalid opening trigger or permanent state.');
    if(key==='low-hp'){
      const condition=detail.condition;
      if(!['self','target-enemy','healing-target-ally'].includes(condition?.subject) || !['hp-scaling','threshold-state','threshold-trigger'].includes(condition?.mode) || condition.metric!=='current-hp-percent-of-max')throw Error('Invalid low HP condition target or mode.');
      if(condition.mode==='hp-scaling'){
        if(Object.hasOwn(condition,'thresholdPercent') || condition.direction!=='lower-hp-stronger' || condition.curveStatus!=='unconfirmed')throw Error('HP scaling must not become a fixed near-death threshold.');
      }else if(condition.operator!=='lte' || !(condition.thresholdPercent>0 && condition.thresholdPercent<100))throw Error('Missing low HP threshold.');
    }
    if(key==='full-hp'){
      const condition=detail.condition;
      if(condition?.mode!=='full-hp-state' || condition.subject!=='self' || condition.metric!=='current-hp-percent-of-max' || condition.operator!=='eq' || condition.thresholdPercent!==100)throw Error('Full HP requires current HP equal to maximum HP.');
    }
    if(key==='received-attack'){
      const condition=detail.condition;
      if(condition?.subject!=='self' || !['attack-received','damage-received'].includes(condition.event) || !['any','physical','magic'].includes(condition.incomingType) || condition.requiresHpDamage!==(condition.event==='damage-received'))throw Error('Received attack and actual received damage must be distinguished.');
    }
    if(key==='ultimate'){
      const condition=detail.condition;
      if(!['ultimate-use','ultimate-gauge-full','next-ultimate-use'].includes(condition?.mode) || !['self','enemy'].includes(condition.subject))throw Error('Missing ultimate condition mode or actor.');
      if(condition.mode==='ultimate-gauge-full' && (condition.subject!=='self' || condition.metric!=='current-ultimate-gauge-percent' || condition.operator!=='eq' || condition.thresholdPercent!==100))throw Error('Ultimate gauge state must require a full current gauge.');
      if(condition.mode!=='ultimate-gauge-full' && condition.event!=='ultimate-used')throw Error('Ultimate use event must be explicit.');
      if(condition.mode==='next-ultimate-use' && (condition.subject!=='self' || condition.requiresActiveBuff!==true))throw Error('Next ultimate requires the previously granted Buff.');
      if(condition.alternativeEvents && (condition.operator!=='or' || !condition.alternativeEvents.includes('ultimate-used') && !condition.alternativeEvents.includes('ice-ultimate-used')))throw Error('Ultimate alternatives must preserve OR semantics.');
    }
    if(key==='ally-death'){
      const c=detail.condition;
      if(view.passKind!=='condition-only' || c?.subject!=='other-ally' || !['ally-death-trigger','ally-incapacitated-state'].includes(c.mode))throw Error('Ally death must identify another ally, not the skill holder.');
      if(c.mode==='ally-death-trigger' && c.event!=='became-incapacitated')throw Error('Missing ally death event.');
      if(c.mode==='ally-incapacitated-state' && (c.metric!=='incapacitated-ally-count' || c.operator!=='gte' || c.minimumCount!==1 || Object.hasOwn(c,'event')))throw Error('A downed ally state requires at least one currently incapacitated ally.');
    }
    for(const binding of detail.bindings){
      if(!groups.has(binding.group) || !binding.summary || !binding.partIds?.length || binding.partIds.some(id=>entry.parts.find(part=>part.id===id)?.kind!=='effect'))throw Error('Invalid opening effect binding.');
      if(key==='mp'){
        if(binding.target!=='self' || typeof binding.isBuff!=='boolean' || !['resource-effect','condition-benefit','cost-benefit'].includes(binding.mpRole))throw Error('Missing MP binding role.');
        if(binding.mpRole==='resource-effect' && (binding.partIds.some(id=>!detail.coverage.resourcePartIds.includes(id)) || !binding.operation))throw Error('MP resource binding must cover an actual resource effect.');
        if(binding.mpRole!=='resource-effect' && binding.partIds.some(id=>assignment.partIds.includes(id)))throw Error('Displaying a benefit must not complete another effect tag.');
        if(binding.mpRole==='condition-benefit' && (!detail.condition || binding.isBuff))throw Error('Current MP conditions are not triggered Buffs.');
        if(binding.isBuff && (binding.operation!=='periodic-restore-current' || !(binding.durationSeconds>0) || !(binding.intervalSeconds>0) || binding.stacking!=='highest-active-buff-of-same-type-only'))throw Error('Invalid MP regeneration Buff.');
        if(!binding.isBuff && (Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'stacking')))throw Error('Non-Buff MP effects must not gain Buff duration or stacking.');
      }
      if(key==='critical'){
        const c=detail.coverage;
        if(binding.target!=='self' || typeof binding.isBuff!=='boolean' || !['outgoing','incoming'].includes(binding.scope?.direction) || !['unspecified','physical','attack-magic','ultimate','counter'].includes(binding.scope.attackType))throw Error('Critical scope or target missing.');
        if(binding.criticalRole==='condition-benefit'){
          if(binding.operation!=='restore-current-hp' || !c.conditionPartIds.length || binding.partIds.some(id=>assignment.partIds.includes(id)))throw Error('Critical trigger must not complete its HP recovery effect.');
        }else if(binding.criticalRole!=='direct-effect' || binding.partIds.some(id=>!c.effectPartIds.includes(id)))throw Error('Unreviewed critical effect.');
        if(binding.operation==='rate-up' && (!(binding.ratePoints>0) || binding.grantsCriticalEligibility!==false || Object.hasOwn(binding,'valuePercent')))throw Error('Critical rate points are distinct from critical permission and damage.');
        if(['damage-up','cap-up'].includes(binding.operation) && (binding.requiresCriticalHit!==true || binding.grantsCriticalEligibility!==false))throw Error('Critical damage and caps require actual critical hits.');
        if(binding.operation==='damage-up' && !(binding.valuePercent>0) || binding.operation==='cap-up' && !(binding.capPoints>0))throw Error('Missing critical bonus value.');
        if(binding.operation==='enable-critical' && (binding.grantsCriticalEligibility!==true || binding.guaranteedCritical!==false || !['attack-magic','ultimate'].includes(binding.scope.attackType) || Object.hasOwn(binding,'ratePoints')))throw Error('Permission is neither rate nor a guaranteed critical hit.');
        if(['incoming-damage-down','convert-to-normal'].includes(binding.operation) && binding.scope.direction!=='incoming')throw Error('Incoming critical defense must not increase outgoing critical damage.');
        if(binding.operation==='convert-to-normal' && (binding.chancePercent!==50 || Object.hasOwn(binding,'valuePercent')))throw Error('Royal Armor probability must not become damage reduction.');
        if(binding.isBuff){
          const lifetimes=[binding.durationSeconds>0,binding.lifetime==='permanent',binding.endsOn==='incapacitated'].filter(Boolean).length;
          if(binding.operation!=='rate-up' || binding.buffType!=='critical-rate-up' || lifetimes!==1 || binding.stacking!=='highest-active-buff-of-same-type-only')throw Error('Critical Buff lifetime and same-type stacking must be explicit.');
        }else if(Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'lifetime') || Object.hasOwn(binding,'endsOn') || Object.hasOwn(binding,'stacking'))throw Error('Passive critical bonuses must not acquire Buff expiry.');
      }
      if(key==='ally-death'){
        if(binding.target!=='self' || typeof binding.isBuff!=='boolean' || binding.partIds.some(id=>assignment.partIds.includes(id)))throw Error('Ally death conditions must not cover their effect tags or change the recipient.');
        if(detail.condition.mode==='ally-incapacitated-state'){
          if(binding.activationMode!=='conditional-stat' || binding.phase!=='current-state' || binding.isBuff || binding.scalesWithAllyCount!==false)throw Error('A current ally state is not a triggered Buff or a per-ally stack.');
        }else if(binding.phase!=='after-ally-death' || !['triggered-buff','triggered-action','triggered-abnormal-status'].includes(binding.activationMode))throw Error('Missing ally death response phase.');
        if(binding.isBuff){
          if(binding.activationMode!=='triggered-buff' || binding.stacking!=='highest-active-buff-of-same-type-only' || !((binding.durationSeconds>0 && !binding.durationStatus) || (binding.durationStatus==='unconfirmed' && !Object.hasOwn(binding,'durationSeconds'))))throw Error('Ally death Buff duration and same-type limit must be explicit.');
        }else if(Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'stacking'))throw Error('Ally state bonuses, recovery and rage are not ordinary timed Buffs.');
        if(binding.activationMode==='triggered-abnormal-status' && (binding.isBuff || binding.statusId!=='rage' || binding.statusKind!=='abnormal' || binding.statusDurationStatus!=='unconfirmed'))throw Error('Rage must retain its abnormal-status semantics.');
        if(binding.operation==='restore-stocks' && (binding.unit!=='skill-stock-count' || binding.amountSource!=='incapacitated-ally-stocks' || Object.hasOwn(binding,'restoreSeconds')))throw Error('Inherited stocks must not become SCT seconds.');
      }
      if(key==='revive'){
        if(binding.target!=='self' || typeof binding.isBuff!=='boolean')throw Error('Revival target and benefit recipient must be separate.');
        if(binding.revivalRole==='revival-effect'){
          if(binding.operation!=='revive-self' || binding.isBuff || binding.hpBase!=='maximum-HP' || !(binding.initialHpPercent>0 && binding.initialHpPercent<=100) || !['wave','quest'].includes(binding.resetScope) || binding.maxTriggers!==1 || binding.partIds.some(id=>!detail.coverage.revivalPartIds.includes(id)))throw Error('Invalid automatic revival parameters.');
        }else if(binding.revivalRole!=='post-revival-benefit' || binding.partIds.some(id=>assignment.partIds.includes(id)))throw Error('Displaying revival benefits must not complete their effect tags.');
        if(binding.isBuff && (binding.activationMode!=='triggered-buff' || binding.phase!=='after-revival' || !(binding.durationSeconds>0) || binding.stacking!=='highest-active-buff-of-same-type-only'))throw Error('Revival Buff needs its duration and same-type limit.');
        if(!binding.isBuff && (Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'stacking')))throw Error('Revival actions and instant resource recovery are not timed Buffs.');
      }
      if(permanent && (binding.lifetime!=='permanent' || Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'endsOn') || binding.stacking!=='highest-active-buff-of-same-type-only'))throw Error('Permanent state must have no timed expiry and must preserve same-type Buff limits.');
      if(key==='low-hp'){
        if(binding.activationMode!==detail.condition.mode || typeof binding.isBuff!=='boolean')throw Error('Invalid low HP effect activation.');
        if(binding.isBuff && (detail.condition.mode!=='threshold-trigger' || !(binding.durationSeconds>0) || binding.persistsAfterHpRecovery!==true || binding.stacking!=='highest-active-buff-of-same-type-only'))throw Error('Triggered low HP buffs must retain their lifetime after healing.');
        if(!binding.isBuff && Object.hasOwn(binding,'durationSeconds'))throw Error('Conditional attributes are not timed buffs.');
      }
      if(key==='full-hp' && (binding.activationMode!=='full-hp-state' || binding.isBuff!==false || Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'persistsAfterHpRecovery')))throw Error('Full HP bonuses are current-state conditions, not timed buffs.');
      if(key==='received-attack'){
        if(typeof binding.isBuff!=='boolean' || !['before-damage','on-attack','after-damage','damage-calculation','lethal-damage-resolution','end-effect'].includes(binding.phase))throw Error('Missing received attack effect phase.');
        if(binding.activationMode==='effect-termination'){
          if(binding.phase!=='end-effect' || !binding.endsOn || Object.hasOwn(binding,'durationSeconds'))throw Error('Receiving a hit must end, not reapply, this effect.');
        }else if(binding.isBuff){
          if(binding.activationMode!=='triggered-buff' || binding.phase!=='after-damage' || !(binding.durationSeconds>0) || binding.stacking!=='highest-active-buff-of-same-type-only')throw Error('Received damage Buff must have its own lifetime and stacking rule.');
        }else if(Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'stacking'))throw Error('Per-hit effects are not lasting Buffs.');
        if(binding.activationMode==='per-hit-stat-reference' && (binding.phase!=='damage-calculation' || binding.isBuff || !['self','attacking-enemy'].includes(binding.referenceTarget)))throw Error('Invalid incoming damage stat reference.');
      }
      if(key==='ultimate'){
        if(binding.target!=='self' || typeof binding.isBuff!=='boolean')throw Error('Ultimate trigger actor must not replace the effect target.');
        if(detail.condition.mode==='ultimate-gauge-full' && (binding.activationMode!=='ultimate-gauge-full' || binding.phase!=='current-state' || binding.isBuff))throw Error('Full gauge attributes are current-state bonuses.');
        if(binding.isBuff){
          if(binding.stacking!=='highest-active-buff-of-same-type-only')throw Error('Ultimate Buff stacking must be explicit.');
          if(binding.activationMode==='next-use-buff'){
            if(detail.condition.mode!=='next-ultimate-use' || binding.uses!==1 || binding.phase!=='next-ultimate' || Object.hasOwn(binding,'durationSeconds'))throw Error('Periodic grant interval is not a next-use Buff duration.');
          }else if(binding.activationMode!=='triggered-buff' || binding.phase!=='on-ultimate-use' || !((binding.durationSeconds>0 && !binding.durationStatus) || (binding.durationStatus==='unconfirmed' && !Object.hasOwn(binding,'durationSeconds'))))throw Error('Triggered ultimate Buff needs a known duration or an explicit unknown.');
        }else if(Object.hasOwn(binding,'durationSeconds') || Object.hasOwn(binding,'durationStatus') || Object.hasOwn(binding,'stacking'))throw Error('Non-Buff ultimate effects must not gain Buff metadata.');
        if(binding.activationMode==='per-ultimate-stat-reference' && (binding.isBuff || binding.phase!=='damage-calculation' || binding.referenceTarget!=='self'))throw Error('Ultimate stat reference must stay within the current damage calculation.');
      }
    }
  }
}
checkOrder(shared.views.all,resolved);
views.all={...shared.views.all,counts:countsFor(resolved)};
const catalog={schemaVersion:2,numericEffectInjection:false,activeView:shared.activeView,entries:resolved,views};
fs.writeFileSync(new URL('dist/skill-labeling-catalog.mjs',root),`// Generated by scripts/build-skill-labels.mjs. Shared labels never inject calculator effects.\nexport const SKILL_LABELING_CATALOG = ${JSON.stringify(catalog,null,2)};\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(views).map(([key,view])=>[key,view.counts]))));
