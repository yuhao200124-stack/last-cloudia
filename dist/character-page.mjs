// Every character page loads this entry. Change shared UI here, never copy it.
// (The old 基础计算器／基础伤害上限／最终伤害上限 were removed with the old calculator; 已保存配装 lists the
// calculator's saved loadouts.)
import {mountAccountBlessings} from './account-blessings-panel.mjs?v=20260928-game-names';
import './character-saved-builds.mjs?v=20260928-engine-only';
mountAccountBlessings();
const hero=document.querySelector('.hero-meta');
if(hero){
 let open=document.getElementById('damageSimulatorOpen');
 if(!open){open=document.createElement('button');open.id='damageSimulatorOpen';open.type='button';open.className='source-button calculator-entry';open.textContent='伤害计算器';hero.append(open);}
 open.setAttribute('aria-controls','damageSimulator');open.setAttribute('aria-expanded','false');
 if(!document.getElementById('damageSimulator')){
  const template=document.createElement('template');
  template.innerHTML='<div id="damageSimulatorBackdrop" class="damage-simulator-backdrop" hidden></div><aside id="damageSimulator" class="damage-simulator damage-calculator-shell" hidden aria-label="伤害计算器"><header class="damage-simulator-header"><div><small id="damageCharacterName"></small><strong>伤害计算器</strong></div><button id="damageSimulatorClose" type="button" aria-label="关闭伤害计算器">×</button></header><iframe id="damageCalculatorFrame" title="伤害计算器" class="damage-calculator-frame"></iframe></aside>';
  document.body.append(template.content);
  document.getElementById('damageCharacterName').textContent=document.querySelector('.hero h2')?.textContent.trim()||'当前角色';
 }
 await import('./character-damage-bridge.mjs?v=20260928-engine-only');
}
