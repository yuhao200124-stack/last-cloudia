// Damage calculator page: the inputs of the game-script calculation. engine-panel.mjs does the calculation
// (dist/engine: the game's own scripts and master data) and fills the result card, 法强／暴击率／伤害上限, the
// 魔法 checkboxes, 配装 and 面板与加成核对; this module keeps the page's own state and hands it over through the
// `lc:calculator-update` event. The old rule-based calculator (网页旧规则) was removed at the user's request
// (2026-09-28); moves come from the game data, the hit count is the user's own (default 10), and 圣物属性 add to
// the final stats.
import {characterGear} from './character-gear.mjs?v=20260928-engine-only';
import {gameCharacterForSite,gameMoveParameters,loadGameIndex,loadGameCharacter} from './game-data.mjs?v=20260927-game-data';
import {validateBattleEntry} from './battle-report.mjs?v=20260928-engine-only';
import {STAT_BLESSINGS} from './account-blessings.mjs?v=20260924-fullpage';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);
const characterId=/^\d+$/.test(params.get('character')||'')?params.get('character'):null;
// embedded=1: a character page's panel; embedded=build: the 配装 on the skill classification page
const embedded=['1','build'].includes(params.get('embedded'))&&window.parent!==window;
document.body.classList.toggle('is-embedded',embedded);
if(characterId){$('calculatorCharacterBack').href=`./character-${characterId}.html`;$('calculatorCharacterBack').textContent='返回角色';}

// ---- saved page state (per character; a per-viewer convenience) ----
const SWITCHES=['dualWield','specialAttack','break','boss','fullHp','lowHp','mpLow','openingBuffActive','conditionBuffActive','reviveBuffActive','guardBuffActive','selfStateActive','partyConditionActive'];
// 特攻 was on by default for 洛琪希 only (the old flow read it from her catalog: her magic is a Boss killer)
const DEFAULT_SWITCHES={dualWield:false,specialAttack:characterId==='260',break:false,boss:true,fullHp:false,lowHp:false,mpLow:false,openingBuffActive:true,conditionBuffActive:false,reviveBuffActive:false,guardBuffActive:false,selfStateActive:false,partyConditionActive:false};
const DUAL_DEFAULTS={hitMultiplier:'2',hitDamageRatio:'0.6',hitScaleStage:'core'};
const stateKey=`lc-calculator:${characterId||'generic'}:v2`;
const read=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
let state=read(stateKey);
if(!state){
 // first visit after the old calculator: keep the switches, 专武 and ark stats the user had there
 const old=read(`lc-entry-review:${characterId}:v1`)?.selection||{},ark=read(`lc-confirmed-bonuses:${characterId||'generic'}:v1`)?.stats||{};
 state={switches:Object.fromEntries(SWITCHES.map(k=>[k,typeof old[k]==='boolean'?old[k]:DEFAULT_SWITCHES[k]])),specialWeapon:old.specialWeapon||'none',move:null,hits:{},dual:{},ark};
}
state={switches:{...DEFAULT_SWITCHES,...state.switches},specialWeapon:state.specialWeapon||'none',move:state.move??null,hits:state.hits||{},dual:state.dual||{},ark:state.ark||{},dress:state.dress??null};
if(state.switches.fullHp&&state.switches.lowHp)state.switches.lowHp=false;
const save=()=>{try{localStorage.setItem(stateKey,JSON.stringify(state));}catch{}};

// ---- 专武: this character's own exclusive gear by name (character-gear.mjs), plus 全部／其他 ----
(function setupSpecialWeaponOptions(){
 const select=$('specialWeapon'),entries=Object.entries(characterId?characterGear(characterId):{});
 if(entries.length)select.innerHTML=['<option value="none">未装备</option>',...entries.map(([id,g])=>`<option value="${esc(id)}">${esc(g.name||id)}</option>`),`<option value="both">${esc(entries.map(([,g])=>g.name).filter(Boolean).join('＋')||'都装备')}</option>`,'<option value="other">其他</option>'].join('');
 select.value=[...select.options].some(o=>o.value===state.specialWeapon)?state.specialWeapon:'none';
})();

// ---- 01 角色基础资料: the character's maximum six stats (Altema, docs/site-characters.json) and account blessings ----
const SIX={hp:'HP',mp:'MP',attack:'攻击力',defense:'防御力',intelligence:'法强',mind:'魔抗'};
async function renderProfile(name){
 if(!characterId)return;
 let stats=null;try{stats=(await loadGameIndex()).siteStats?.[characterId]||null;}catch{}
 $('characterPanel').hidden=false;
 $('entryProfileName').textContent=`${name||'角色'} · 最大成长基础资料`;
 $('entrySixStats').innerHTML=`<thead><tr>${Object.values(SIX).map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody><tr>${Object.keys(SIX).map(k=>{const v=stats?.[k],p=STAT_BLESSINGS[k]||0;return `<td><strong>${v!=null?v.toLocaleString('en-US'):'未提供'}</strong><small>加护 +${p}%<br>→ ${v!=null?Math.floor(v*(100+p)/100).toLocaleString('en-US'):'未提供'}</small></td>`;}).join('')}</tr></tbody>`;
}

// ---- 招式: every damaging move of the character from the game data ----
let game=null,moves=[];
function moveList(c){
 const out=[],add=(group,x,label)=>{if(x&&x.parts?.some(p=>p.coef!=null))out.push({group,label:label||x.nameS,move:x});};
 (c.normal||[]).forEach((x,i,all)=>add('普通攻击',x,all.length>1?`普通攻击${i+1}`:'普通攻击'));(c.specials||[]).forEach((x,i)=>add('特技',x,`特技${i+1} · ${x.nameS}`));add('超必杀',c.ultimate);
 (c.form2||[]).forEach((x,i)=>add('形态2',x,i<3?`形态2 特技${i+1} · ${x.nameS}`:`形态2 超必杀 · ${x.nameS}`));
 (c.magic?.normal||[]).forEach(x=>add('魔法',x));(c.magic?.heavy||[]).forEach(x=>add('重魔法',x));
 return out;
}
function renderMoves(){
 const groups=[...new Set(moves.map(m=>m.group))];
 $('preset').innerHTML=moves.length?groups.map(g=>`<optgroup label="${esc(g)}">${moves.map((m,i)=>m.group===g?`<option value="${i}">${esc(m.label)}</option>`:'').join('')}</optgroup>`).join(''):'<option value="">这个角色没有游戏数据</option>';
 let i=moves.findIndex(m=>m.move.id===state.move);
 if(i<0)i=Math.max(0,moves.findIndex(m=>m.group==='特技'));
 $('preset').value=moves.length?String(i):'';
}
const selectedMove=()=>moves[Number($('preset').value)]?.move||null;
function syncHits(){const m=selectedMove();$('hits').value=String(m&&state.hits[m.id]||10);}

// ---- 双刀信息: only while 双刀 is on (the calculator's own 双刀; the engine locks it when the move already hits twice) ----
function syncDual(){
 const on=$('dualWield').checked&&!$('dualWield').disabled;
 $('hitDetails').hidden=!$('dualWield').checked;
 for(const id of ['hitMultiplier','hitDamageRatio'])$(id).disabled=!on;
 for(const id of ['hitMultiplier','hitDamageRatio','hitScaleStage'])$(id).value=on?(state.dual[id]??DUAL_DEFAULTS[id]):id==='hitScaleStage'?'core':'1';
 $('hitScaleControl').hidden=on&&$('hitDamageRatio').value!==''&&Number($('hitDamageRatio').value)===1;
}

// ---- 04 目标: two boss presets (MonsterMst monsters and their races) and the bosses of a reader report ----
const RACES=['战士','狙击手','骑士','魔法师','兽','植物','昆虫','鸟','魔法生物','不死生物','石','机械','精灵','龙','神','鱼'];
const ELEMENTS={fire:'火',ice:'冰',earth:'树',thunder:'雷',light:'光',dark:'暗'};
const bosses={bird:{monsterId:320401703,races:['龙'],def:4000,mnd:10000,res:[25,-25,50,50,-25,25]},beast:{monsterId:320901401,races:['鱼'],def:5500,mnd:8000,res:[25,50,25,-25,50,-25]}};
let bossRaces=[];
$('bossResistances').innerHTML=Object.entries(ELEMENTS).map(([key,label])=>`<label>${label}抗性 %<input data-boss-resistance="${key}" type="number" min="-999" max="1000" step="any"></label>`).join('');
$('bossRaceChoices').innerHTML=RACES.map((race,i)=>`<label><input id="bossRace${i}" data-boss-race="${esc(race)}" type="checkbox">${esc(race)}</label>`).join('');
function syncBossRaces(){
 document.querySelectorAll('[data-boss-race]').forEach(el=>el.checked=bossRaces.includes(el.dataset.bossRace));
 $('bossIdentity').textContent=`种族：${bossRaces.length?bossRaces.join('、'):'未确认（种族限定加成不自动计入）'}`;
}
function applyBoss(){
 const p=bosses[$('bossPreset').value];
 if(!p)return;
 $('bossDefense').value=p.def??'';$('bossMind').value=p.mnd??'';
 document.querySelectorAll('[data-boss-resistance]').forEach((el,i)=>el.value=p.res?.[i]??'');
 bossRaces=[...(p.races||[])];syncBossRaces();
}
function readBossRecord(record={}){
 const raw=Array.isArray(record.races)?record.races:Array.isArray(record.race)?record.race:record.race==null?[]:[record.race];
 const ok=v=>typeof v==='number'&&Number.isFinite(v);
 return {name:record.name||'未命名 Boss',def:ok(record.stats?.defense)?record.stats.defense:null,mnd:ok(record.stats?.mind)?record.stats.mind:null,races:raw.filter(v=>typeof v==='string'&&RACES.includes(v)),res:Object.keys(ELEMENTS).map(k=>ok(record.resistances?.[k])?record.resistances[k]:null)};
}

// ---- 02 读取报告: handed to the engine as it is (validated / MP-normalized) ----
let battle=null;
$('entryReportFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>25_000_000)throw new Error('报告超过25MB，请使用读取器生成的入场JSON报告。');
  battle=validateBattleEntry(JSON.parse(await file.text()));
  const first=battle.units?.[0];
  $('entryFileNote').textContent=`${file.name} · ${battle.capturedAt||'时间未提供'}；按报告里第 1 个角色（${first?.name||'未命名'}）结算，它必须是本页角色，否则按游戏数据的最大成长计算。`;
  $('bossPreset').querySelectorAll('[data-reader-boss]').forEach(el=>el.remove());
  for(const key of Object.keys(bosses))if(key.startsWith('reader-'))delete bosses[key];
  (battle.bosses||[]).forEach((record,index)=>{const key=`reader-${index}`,boss=readBossRecord(record);bosses[key]=boss;const o=document.createElement('option');o.value=key;o.dataset.readerBoss='';o.textContent=`读取：${boss.name}`;$('bossPreset').append(o);});
  if(battle.bosses?.length){$('bossPreset').value='reader-0';applyBoss();}
 }catch(err){$('entryFileNote').textContent=`新文件未导入：${err.message}`;}
 e.target.value='';notify();
});

// ---- 圣物属性 (kept until 圣物 is done from the game data): added to the final stats by the engine ----
for(const el of document.querySelectorAll('[data-ark-stat]'))el.value=state.ark[el.dataset.arkStat]??'';
const arkStats=()=>Object.fromEntries([...document.querySelectorAll('[data-ark-stat]')].map(el=>[el.dataset.arkStat,Number(el.value)||0]).filter(([,v])=>v));

// ---- views: 已确认的伤害加成 / 面板与加成核对 ----
function showConfirmedEffects(open){
 document.body.classList.toggle('confirmed-effects-view',open);
 $('confirmedEffectsSection').hidden=!open;$('openConfirmedEffects').setAttribute('aria-expanded',String(open));
 if(open){$('reviewPage').hidden=true;$('calculationPage').hidden=false;$('confirmedEffectsTitle').focus();window.scrollTo(0,0);}else $('openConfirmedEffects').focus();
}
function showReview(open){
 if(open)showConfirmedEffects(false);
 $('reviewPage').hidden=!open;$('calculationPage').hidden=open;
 document.dispatchEvent(new CustomEvent('lc:review-toggle',{detail:{open}}));
 if(open)$('reviewTitle').focus();else $('openReview').focus();
}
$('openReview').addEventListener('click',()=>showReview(true));
$('closeReview').addEventListener('click',()=>showReview(false));
$('openConfirmedEffects').addEventListener('click',()=>showConfirmedEffects(true));
$('closeConfirmedEffects').addEventListener('click',()=>showConfirmedEffects(false));

// ---- hand-over to engine-panel.mjs ----
function notify(){
 const m=selectedMove();
 $('entryMoveNote').textContent=m?'':'这个招式没有游戏数据。';
 // the latest state also stays on window: engine-panel.mjs may finish loading after the first hand-over
 const detail={battle,gameMove:m?gameMoveParameters(m):null,selection:{...Object.fromEntries(SWITCHES.map(k=>[k,$(k).checked])),dualWield:!!state.switches.dualWield},unitDressId:game?.unitDressId||null,arkStats:arkStats(),hits:Number($('hits').value)||10};
 window.LC_CALCULATOR_STATE=detail;
 document.dispatchEvent(new CustomEvent('lc:calculator-update',{detail}));
}
let timer=null;const later=()=>{clearTimeout(timer);timer=setTimeout(notify,70);};

function applySwitches(){for(const k of SWITCHES)$(k).checked=!!state.switches[k];syncDual();}
$('calculator').addEventListener('submit',e=>e.preventDefault());
$('calculator').addEventListener('change',e=>{
 const id=e.target.id;
 if(SWITCHES.includes(id)){
  if(id==='fullHp'&&$('fullHp').checked)$('lowHp').checked=false;
  if(id==='lowHp'&&$('lowHp').checked)$('fullHp').checked=false;
  if(!$('dualWield').disabled)state.switches.dualWield=$('dualWield').checked;
  for(const k of SWITCHES)if(k!=='dualWield')state.switches[k]=$(k).checked;
  if(id==='dualWield')syncDual();
 }
 if(['hitMultiplier','hitDamageRatio','hitScaleStage'].includes(id)){if($(id).value==='')delete state.dual[id];else state.dual[id]=$(id).value;syncDual();}
 if(id==='preset'){state.move=selectedMove()?.id??null;syncHits();}
 if(id==='specialWeapon')state.specialWeapon=$('specialWeapon').value;
 if(e.target.dataset.arkStat!=null)state.ark=arkStats();
 if(id==='bossPreset')applyBoss();
 if(['bossDefense','bossMind'].includes(id)||e.target.dataset.bossResistance)$('bossPreset').value='custom';
 if(e.target.dataset.bossRace!=null){bossRaces=[...document.querySelectorAll('[data-boss-race]:checked')].map(el=>el.dataset.bossRace);syncBossRaces();}
 save();later();
});
// the result card's 命中段数 is saved per move (only the user's own count; 10 until changed)
document.addEventListener('lc:hits-change',e=>{const m=selectedMove();if(!m)return;const n=Math.round(Number(e.detail?.hits));if(n>=1)state.hits[m.id]=n;else delete state.hits[m.id];save();syncHits();notify();});
// the engine locks 双刀 when the move already hits twice by itself; the page only follows it
document.addEventListener('lc:dual-lock',()=>syncDual());
$('reset').addEventListener('click',()=>{
 state.switches={...DEFAULT_SWITCHES};state.dual={};state.ark={};
 const m=selectedMove();if(m)delete state.hits[m.id];
 for(const el of document.querySelectorAll('[data-ark-stat]'))el.value='';
 $('specialWeapon').value='none';state.specialWeapon='none';
 $('bossPreset').value='bird';applyBoss();applySwitches();syncHits();save();
 document.dispatchEvent(new CustomEvent('lc:calculator-reset'));notify();
});

// ---- embedded in a character page ----
document.addEventListener('keydown',e=>{if(embedded&&e.key==='Escape')window.parent.postMessage({type:'lc-damage-close'},location.origin);});

// without a character page: any character of the game data
async function pickCharacter(dress){
 try{game=dress?await loadGameCharacter(dress):null;}catch{game=null;}
 moves=game?moveList(game):[];renderMoves();syncHits();
}
applySwitches();applyBoss();
if(characterId){
 try{game=(await gameCharacterForSite(characterId))?.character||null;}catch{game=null;}
 moves=game?moveList(game):[];
 renderProfile(game?.fullNameS||game?.nameS);
 renderMoves();syncHits();
}else{
 $('gamePicker').hidden=false;
 try{const index=await loadGameIndex();$('gameCharacter').innerHTML='<option value="">选择角色</option>'+index.characters.map(c=>`<option value="${c.u}">${esc(c.n)}${c.d?` · ${esc(c.d)}`:''}</option>`).join('');}catch{}
 $('gameCharacter').value=state.dress?String(state.dress):'';
 await pickCharacter(Number($('gameCharacter').value)||null);
 $('gameCharacter').addEventListener('change',async()=>{state.dress=Number($('gameCharacter').value)||null;state.move=null;save();await pickCharacter(state.dress);notify();});
}
if(embedded)window.parent.postMessage({type:'lc-damage-ready'},location.origin);
notify();
