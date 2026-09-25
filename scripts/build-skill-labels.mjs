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
for(const [key,label,previousKey,basicTarget=label] of [['attack','攻击力','previousBasicAttackUnique'],['defense','防御力','previousBasicDefenseUnique'],['hp','生命力','previousBasicHpUnique','HP'],['magic','魔力','previousBasicMagicUnique','法强'],['mp','MP','previousBasicMpUnique'],['physical','物理伤害增加',null],['magic-damage','魔法伤害增加',null],['damage','伤害增加',null],['boss-damage','Boss伤害增加',null],['boss-magic-damage','Boss魔法伤害增加',null],['boss-physical-damage','Boss物理伤害增加',null],['boss-skill-damage','Boss特技伤害增加',null],['boss-ultimate-damage','Boss必杀伤害增加',null],['boss-critical-damage','Boss暴击伤害增加',null],['battle-start','战斗开始',null],['low-hp','濒死',null],['full-hp','满HP',null],['received-attack','受到攻击',null],['ultimate','必杀相关',null]]){
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
    if(assignment.partIds.some(id=>entry.parts.find(part=>part.id===id)?.kind!=='condition'))throw Error('Condition pass must not cover unreviewed effect tags.');
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
    for(const binding of detail.bindings){
      if(!groups.has(binding.group) || !binding.summary || !binding.partIds?.length || binding.partIds.some(id=>entry.parts.find(part=>part.id===id)?.kind!=='effect'))throw Error('Invalid opening effect binding.');
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
