import fs from 'node:fs';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/calculator-integration-preservation-2026-09-26.json',import.meta.url)));
const layout=JSON.parse(fs.readFileSync(new URL('../docs/excel-layout-preservation-2026-09-26.json',import.meta.url)));
const damageConditions=JSON.parse(fs.readFileSync(new URL('../docs/damage-conditions-preservation-2026-09-26.json',import.meta.url)));
const characterRestore=JSON.parse(fs.readFileSync(new URL('../docs/character-restore-preservation-2026-09-26.json',import.meta.url)));
const loadoutSources=JSON.parse(fs.readFileSync(new URL('../docs/loadout-sources-preservation-2026-09-26.json',import.meta.url)));
const exclusiveWeapon=JSON.parse(fs.readFileSync(new URL('../docs/exclusive-weapon-preservation-2026-09-26.json',import.meta.url)));
const weaponCalculation=JSON.parse(fs.readFileSync(new URL('../docs/weapon-calculation-preservation-2026-09-26.json',import.meta.url)));
const confirmedEffects=JSON.parse(fs.readFileSync(new URL('../docs/confirmed-effects-preservation-2026-09-26.json',import.meta.url)));
const confirmationGroups=JSON.parse(fs.readFileSync(new URL('../docs/confirmation-groups-preservation-2026-09-26.json',import.meta.url)));
const skillCoverage=JSON.parse(fs.readFileSync(new URL('../docs/skill-coverage-preservation-2026-09-26.json',import.meta.url)));
const calculatorHeadings=JSON.parse(fs.readFileSync(new URL('../docs/calculator-heading-preservation-2026-09-26.json',import.meta.url)));
const scenarioSummary=JSON.parse(fs.readFileSync(new URL('../docs/scenario-summary-preservation-2026-09-26.json',import.meta.url)));
const characterTemplate=JSON.parse(fs.readFileSync(new URL('../docs/character-template-preservation-2026-09-26.json',import.meta.url)));
const mayly=JSON.parse(fs.readFileSync(new URL('../docs/mayly-preservation-2026-09-26.json',import.meta.url)));
const moveCapLayer=JSON.parse(fs.readFileSync(new URL('../docs/move-cap-preservation-2026-09-27.json',import.meta.url)));
const enginePanel=JSON.parse(fs.readFileSync(new URL('../docs/engine-panel-preservation-2026-09-27.json',import.meta.url)));
const gameData=JSON.parse(fs.readFileSync(new URL('../docs/game-data-preservation-2026-09-27.json',import.meta.url)));
const heavyMagic=JSON.parse(fs.readFileSync(new URL('../docs/heavy-magic-preservation-2026-09-27.json',import.meta.url)));
const switchPlan=JSON.parse(fs.readFileSync(new URL('../docs/switch-plan-preservation-2026-09-27.json',import.meta.url)));
const alwaysBuffs=JSON.parse(fs.readFileSync(new URL('../docs/always-buffs-preservation-2026-09-27.json',import.meta.url)));
const gameConditions=JSON.parse(fs.readFileSync(new URL('../docs/game-conditions-preservation-2026-09-27.json',import.meta.url)));
const gameTable=JSON.parse(fs.readFileSync(new URL('../docs/game-table-preservation-2026-09-27.json',import.meta.url)));
const gameTiming=JSON.parse(fs.readFileSync(new URL('../docs/game-timing-preservation-2026-09-27.json',import.meta.url)));
const independentGear=JSON.parse(fs.readFileSync(new URL('../docs/independent-gear-preservation-2026-09-27.json',import.meta.url)));
const hitCore=JSON.parse(fs.readFileSync(new URL('../docs/hit-core-preservation-2026-09-27.json',import.meta.url)));
const twoColumn=JSON.parse(fs.readFileSync(new URL('../docs/two-column-preservation-2026-09-27.json',import.meta.url)));
const layoutSwap=JSON.parse(fs.readFileSync(new URL('../docs/layout-swap-preservation-2026-09-28.json',import.meta.url)));
const attackPanelSimplify=JSON.parse(fs.readFileSync(new URL('../docs/attack-panel-simplify-preservation-2026-09-28.json',import.meta.url)));
const attackLabelPanel=JSON.parse(fs.readFileSync(new URL('../docs/attack-label-panel-preservation-2026-09-28.json',import.meta.url)));
const mixedRatio=JSON.parse(fs.readFileSync(new URL('../docs/mixed-ratio-preservation-2026-09-28.json',import.meta.url)));
const panelBreakdown=JSON.parse(fs.readFileSync(new URL('../docs/panel-breakdown-preservation-2026-09-28.json',import.meta.url)));
const attackCritBreakdown=JSON.parse(fs.readFileSync(new URL('../docs/attack-crit-breakdown-preservation-2026-09-28.json',import.meta.url)));
const inlineIcon=JSON.parse(fs.readFileSync(new URL('../docs/inline-icon-preservation-2026-09-28.json',import.meta.url)));
const specialWeapon=JSON.parse(fs.readFileSync(new URL('../docs/special-weapon-preservation-2026-09-28.json',import.meta.url)));
const critImportBreakdown=JSON.parse(fs.readFileSync(new URL('../docs/crit-import-breakdown-preservation-2026-09-28.json',import.meta.url)));
const gameNames=JSON.parse(fs.readFileSync(new URL('../docs/game-names-preservation-2026-09-28.json',import.meta.url)));
const stateNotes=JSON.parse(fs.readFileSync(new URL('../docs/state-notes-preservation-2026-09-28.json',import.meta.url)));
const autoFill=JSON.parse(fs.readFileSync(new URL('../docs/auto-fill-preservation-2026-09-28.json',import.meta.url)));
const hash=text=>createHash('sha256').update(text).digest('hex');
// Historical classification assertions still compare against their original
// bytes. Only an exact, separately audited calculator edit can be rolled back.
export function textBeforeCommonCalculator(path,text){
 const autoFillLayer=autoFill.files[path];
 if(autoFillLayer){
  if(hash(text)!==autoFillLayer.afterHash||hash(autoFillLayer.beforeText)!==autoFillLayer.beforeHash)throw Error(`Auto-fill preservation drift: ${path}`);
  text=autoFillLayer.beforeText;
 }
 const stateLayer=stateNotes.files[path];
 if(stateLayer){
  if(hash(text)!==stateLayer.afterHash||hash(stateLayer.beforeText)!==stateLayer.beforeHash)throw Error(`State-notes preservation drift: ${path}`);
  text=stateLayer.beforeText;
 }
 const namesLayer=gameNames.files[path];
 if(namesLayer){
  if(hash(text)!==namesLayer.afterHash||hash(namesLayer.beforeText)!==namesLayer.beforeHash)throw Error(`Game-names preservation drift: ${path}`);
  text=namesLayer.beforeText;
 }
 const critImportLayer=critImportBreakdown.files[path];
 if(critImportLayer){
  if(hash(text)!==critImportLayer.afterHash||hash(critImportLayer.beforeText)!==critImportLayer.beforeHash)throw Error(`Crit-import-breakdown preservation drift: ${path}`);
  text=critImportLayer.beforeText;
 }
 const weaponLayer=specialWeapon.files[path];
 if(weaponLayer){
  if(hash(text)!==weaponLayer.afterHash||hash(weaponLayer.beforeText)!==weaponLayer.beforeHash)throw Error(`Special-weapon preservation drift: ${path}`);
  text=weaponLayer.beforeText;
 }
 const iconLayer=inlineIcon.files[path];
 if(iconLayer){
  if(hash(text)!==iconLayer.afterHash||hash(iconLayer.beforeText)!==iconLayer.beforeHash)throw Error(`Inline-icon preservation drift: ${path}`);
  text=iconLayer.beforeText;
 }
 const critLayer=attackCritBreakdown.files[path];
 if(critLayer){
  if(hash(text)!==critLayer.afterHash||hash(critLayer.beforeText)!==critLayer.beforeHash)throw Error(`Attack/crit-breakdown preservation drift: ${path}`);
  text=critLayer.beforeText;
 }
 const breakdownLayer=panelBreakdown.files[path];
 if(breakdownLayer){
  if(hash(text)!==breakdownLayer.afterHash||hash(breakdownLayer.beforeText)!==breakdownLayer.beforeHash)throw Error(`Panel-breakdown preservation drift: ${path}`);
  text=breakdownLayer.beforeText;
 }
 const ratioLayer=mixedRatio.files[path];
 if(ratioLayer){
  if(hash(text)!==ratioLayer.afterHash||hash(ratioLayer.beforeText)!==ratioLayer.beforeHash)throw Error(`Mixed-ratio preservation drift: ${path}`);
  text=ratioLayer.beforeText;
 }
 const labelLayer=attackLabelPanel.files[path];
 if(labelLayer){
  if(hash(text)!==labelLayer.afterHash||hash(labelLayer.beforeText)!==labelLayer.beforeHash)throw Error(`Attack-label-panel preservation drift: ${path}`);
  text=labelLayer.beforeText;
 }
 const simplifyLayer=attackPanelSimplify.files[path];
 if(simplifyLayer){
  if(hash(text)!==simplifyLayer.afterHash||hash(simplifyLayer.beforeText)!==simplifyLayer.beforeHash)throw Error(`Attack-panel-simplify preservation drift: ${path}`);
  text=simplifyLayer.beforeText;
 }
 const layoutLayer=layoutSwap.files[path];
 if(layoutLayer){
  if(hash(text)!==layoutLayer.afterHash||hash(layoutLayer.beforeText)!==layoutLayer.beforeHash)throw Error(`Layout-swap preservation drift: ${path}`);
  text=layoutLayer.beforeText;
 }
 const engineLayer=enginePanel.files[path];
 if(engineLayer){
  if(hash(text)!==engineLayer.afterHash||hash(engineLayer.beforeText)!==engineLayer.beforeHash)throw Error(`Engine-panel preservation drift: ${path}`);
  text=engineLayer.beforeText;
 }
 const capLayer=moveCapLayer.files[path];
 if(capLayer){
  if(hash(text)!==capLayer.afterHash||hash(capLayer.beforeText)!==capLayer.beforeHash)throw Error(`Move-cap preservation drift: ${path}`);
  text=capLayer.beforeText;
 }
 const dataLayer=gameData.files[path];
 if(dataLayer){
  if(hash(text)!==dataLayer.afterHash||hash(dataLayer.beforeText)!==dataLayer.beforeHash)throw Error(`Game-data preservation drift: ${path}`);
  text=dataLayer.beforeText;
 }
 const heavyLayer=heavyMagic.files[path];
 if(heavyLayer){
  if(hash(text)!==heavyLayer.afterHash||hash(heavyLayer.beforeText)!==heavyLayer.beforeHash)throw Error(`Heavy-magic preservation drift: ${path}`);
  text=heavyLayer.beforeText;
 }
 const planLayer=switchPlan.files[path];
 if(planLayer){
  if(hash(text)!==planLayer.afterHash||hash(planLayer.beforeText)!==planLayer.beforeHash)throw Error(`Switch-plan preservation drift: ${path}`);
  text=planLayer.beforeText;
 }
 const alwaysLayer=alwaysBuffs.files[path];
 if(alwaysLayer){
  if(hash(text)!==alwaysLayer.afterHash||hash(alwaysLayer.beforeText)!==alwaysLayer.beforeHash)throw Error(`Always-buffs preservation drift: ${path}`);
  text=alwaysLayer.beforeText;
 }
 const conditionsLayer=gameConditions.files[path];
 if(conditionsLayer){
  if(hash(text)!==conditionsLayer.afterHash||hash(conditionsLayer.beforeText)!==conditionsLayer.beforeHash)throw Error(`Game-conditions preservation drift: ${path}`);
  text=conditionsLayer.beforeText;
 }
 const tableLayer=gameTable.files[path];
 if(tableLayer){
  if(hash(text)!==tableLayer.afterHash||hash(tableLayer.beforeText)!==tableLayer.beforeHash)throw Error(`Game-table preservation drift: ${path}`);
  text=tableLayer.beforeText;
 }
 const timingLayer=gameTiming.files[path];
 if(timingLayer){
  if(hash(text)!==timingLayer.afterHash||hash(timingLayer.beforeText)!==timingLayer.beforeHash)throw Error(`Game-timing preservation drift: ${path}`);
  text=timingLayer.beforeText;
 }
 const gearLayer=independentGear.files[path];
 if(gearLayer){
  if(hash(text)!==gearLayer.afterHash||hash(gearLayer.beforeText)!==gearLayer.beforeHash)throw Error(`Independent-gear preservation drift: ${path}`);
  text=gearLayer.beforeText;
 }
 const hitCoreLayer=hitCore.files[path];
 if(hitCoreLayer){
  if(hash(text)!==hitCoreLayer.afterHash||hash(hitCoreLayer.beforeText)!==hitCoreLayer.beforeHash)throw Error(`Hit-core preservation drift: ${path}`);
  text=hitCoreLayer.beforeText;
 }
 const layoutTwoColumn=twoColumn.files[path];
 if(layoutTwoColumn){
  if(hash(text)!==layoutTwoColumn.afterHash||hash(layoutTwoColumn.beforeText)!==layoutTwoColumn.beforeHash)throw Error(`Two-column preservation drift: ${path}`);
  text=layoutTwoColumn.beforeText;
 }
 const character=mayly.files[path];
 if(character){
  if(hash(text)!==character.afterHash||hash(character.beforeText)!==character.beforeHash)throw Error(`Mayly preservation drift: ${path}`);
  text=character.beforeText;
 }
 const shared=characterTemplate.files[path];
 if(shared){
  if(hash(text)!==shared.afterHash||hash(shared.beforeText)!==shared.beforeHash)throw Error(`Character template preservation drift: ${path}`);
  text=shared.beforeText;
 }
 const scenario=scenarioSummary.files[path];
 if(scenario){
  if(hash(text)!==scenario.afterHash||hash(scenario.beforeText)!==scenario.beforeHash)throw Error(`Scenario summary preservation drift: ${path}`);
  text=scenario.beforeText;
 }
 const headings=calculatorHeadings.files[path];
 if(headings){
  if(hash(text)!==headings.afterHash||hash(headings.beforeText)!==headings.beforeHash)throw Error(`Calculator heading preservation drift: ${path}`);
  text=headings.beforeText;
 }
 const coverage=skillCoverage.files[path];
 if(coverage){
  if(hash(text)!==coverage.afterHash||hash(coverage.beforeText)!==coverage.beforeHash)throw Error(`Skill coverage preservation drift: ${path}`);
  text=coverage.beforeText;
 }
 const groups=confirmationGroups.files[path];
 if(groups){
  if(hash(text)!==groups.afterHash||hash(groups.beforeText)!==groups.beforeHash)throw Error(`Confirmation group preservation drift: ${path}`);
  text=groups.beforeText;
 }
 const effects=confirmedEffects.files[path];
 if(effects){
  if(hash(text)!==effects.afterHash||hash(effects.beforeText)!==effects.beforeHash)throw Error(`Confirmed effects preservation drift: ${path}`);
  text=effects.beforeText;
 }
 const calculation=weaponCalculation.files[path];
 if(calculation){
  if(hash(text)!==calculation.afterHash||hash(calculation.beforeText)!==calculation.beforeHash)throw Error(`Weapon calculation preservation drift: ${path}`);
  text=calculation.beforeText;
 }
 const weapon=exclusiveWeapon.files[path];
 if(weapon){
  if(hash(text)!==weapon.afterHash||hash(weapon.beforeText)!==weapon.beforeHash)throw Error(`Exclusive weapon preservation drift: ${path}`);
  text=weapon.beforeText;
 }
 const integration=loadoutSources.files[path];
 if(integration){
  if(hash(text)!==integration.afterHash||hash(integration.beforeText)!==integration.beforeHash)throw Error(`Loadout source preservation drift: ${path}`);
  text=integration.beforeText;
 }
 const restore=characterRestore.files[path];
 if(restore){
  if(hash(text)!==restore.afterHash||hash(restore.beforeText)!==restore.beforeHash)throw Error(`Character restore preservation drift: ${path}`);
  text=restore.beforeText;
 }
 const current=damageConditions.files[path];
 if(current){
  if(hash(text)!==current.afterHash||hash(current.beforeText)!==current.beforeHash)throw Error(`Damage condition preservation drift: ${path}`);
  text=current.beforeText;
 }
 const presentation=layout.files[path];
 if(presentation){
  if(hash(text)!==presentation.afterHash||hash(presentation.beforeText)!==presentation.beforeHash)throw Error(`Excel layout preservation drift: ${path}`);
  text=presentation.beforeText;
 }
 const change=manifest.files[path];if(!change)return text;
 if(hash(text)!==change.afterHash||hash(change.beforeText)!==change.beforeHash)throw Error(`Calculator preservation drift: ${path}`);
 return change.beforeText;
}
