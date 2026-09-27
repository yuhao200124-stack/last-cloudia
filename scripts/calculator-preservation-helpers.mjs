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
const gameConditions=JSON.parse(fs.readFileSync(new URL('../docs/game-conditions-preservation-2026-09-27.json',import.meta.url)));
const gameTable=JSON.parse(fs.readFileSync(new URL('../docs/game-table-preservation-2026-09-27.json',import.meta.url)));
const gameTiming=JSON.parse(fs.readFileSync(new URL('../docs/game-timing-preservation-2026-09-27.json',import.meta.url)));
const independentGear=JSON.parse(fs.readFileSync(new URL('../docs/independent-gear-preservation-2026-09-27.json',import.meta.url)));
const hitCore=JSON.parse(fs.readFileSync(new URL('../docs/hit-core-preservation-2026-09-27.json',import.meta.url)));
const twoColumn=JSON.parse(fs.readFileSync(new URL('../docs/two-column-preservation-2026-09-27.json',import.meta.url)));
const hash=text=>createHash('sha256').update(text).digest('hex');
// Historical classification assertions still compare against their original
// bytes. Only an exact, separately audited calculator edit can be rolled back.
export function textBeforeCommonCalculator(path,text){
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
