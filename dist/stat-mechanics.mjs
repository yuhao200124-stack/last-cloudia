// Shared HP-condition knowledge. Native evidence and limits: docs/panel-calculation.md.
export const STAT_MECHANICS_REVISION = 1;
const clean = text => String(text || '').replace(/＋/g, '+').replace(/％/g, '%').replace(/\s+/g, '').replace(/[。.]$/, '');
const names = {STR:'攻击力',ATK:'攻击力',攻击力:'攻击力',攻擊力:'攻击力',INT:'法强',法强:'法强',法強:'法强',魔力:'法强',DEF:'防御力',防御力:'防御力',防禦力:'防御力',MND:'魔抗',魔抗:'魔抗'};
export const HP_STAT_PROCESSES = Object.freeze({1030001:['攻击力'],1030102:['防御力'],1030201:['法强'],1030301:['魔抗'],1030125:['防御力','魔抗']});
export const HP_STAT_NOTE = '每Wave开始及HP变化时判断条件，计入实时属性层，不计入入场前面板。条件不满足时不计入；首次濒死、限时Buff和回复效果需独立判断。';

// Whole descriptions only. Never discard a duration, a once-per-wave limit or a recovery clause.
export function parseHpStatDescription(text) {
 const match=clean(text).match(/^(HP全满时|HP全滿時|满血时|滿血時|濒死时|瀕死時)[，,]?([^+]+)\+(\d+(?:\.\d+)?)%$/);
 if(!match)return null;
 const targets=match[2].split(/[、,，/／・]/).map(name=>names[name.toUpperCase()]);
 const value=Number(match[3]);
 if(targets.some(t=>!t)||new Set(targets).size!==targets.length||!Number.isFinite(value)||value>10000)return null;
 return {conditions:[{field:/濒死|瀕死/.test(match[1])?'lowHp':'fullHp',op:'eq',value:true}],
  effects:targets.map(target=>({type:'statBuff',target,value,unit:'%'}))};
}
export function hpStatRule(source) {
 const parsed=parseHpStatDescription(source.text);if(!parsed)return null;
 return {id:`${source.id}-r1`,part:1,text:source.text,...parsed,review:'ready',verification:'description',mechanicsRevision:STAT_MECHANICS_REVISION,note:HP_STAT_NOTE};
}

// Old templates, local drafts and cached reports share this narrow migration.
// Only the old, exact decomposition is corrected. Custom values/conditions remain reviewable.
export function upgradeStatRule(rule,sourceText) {
 const exactText=parseHpStatDescription(rule.text);
 const parsed=exactText||parseHpStatDescription(sourceText);
 if(!parsed||rule.mechanicsRevision===STAT_MECHANICS_REVISION)return rule;
 const sameConditions=JSON.stringify(rule.conditions)===JSON.stringify(parsed.conditions);
 const sameEffects=rule.effects?.length===parsed.effects.length&&rule.effects.every((e,i)=>
  ['stat','statBuff'].includes(e.type)&&e.target===parsed.effects[i].target&&e.value===parsed.effects[i].value&&e.unit==='%');
 if(!exactText||!sameConditions||!sameEffects)return {...rule,mechanicsRevision:STAT_MECHANICS_REVISION,review:'pending',note:`HP条件属性的计算层级已更新，请复核原有自定义拆分。${rule.note||''}`};
 return {...rule,mechanicsRevision:STAT_MECHANICS_REVISION,effects:rule.effects.map(e=>({...e,type:'statBuff'})),note:rule.note?.includes(HP_STAT_NOTE)?rule.note:[rule.note,HP_STAT_NOTE].filter(Boolean).join(' ')};
}

// This pairing is proven by raw process 1030201 + E_IntEdit (EX), not by a fitted total.
// Other multi-buff combinations still need their native group/operation identified.
export function verifiedRuntimeFamily(rule,effect) {
 if(effect.type!=='statBuff'||effect.target!=='法强'||effect.unit!=='%')return null;
 const parsed=parseHpStatDescription(rule.text);
 if(parsed?.conditions[0].field==='fullHp'&&parsed.effects.length===1&&parsed.effects[0].target==='法强'&&parsed.effects[0].value===30&&effect.value===30&&
  JSON.stringify(rule.conditions)===JSON.stringify(parsed.conditions))return 'moonlight-ii';
 if(clean(rule.text)==='始终保持“EX灵气”（法强+50%）与“超级魔法阵”（持续大量恢复MP）的效果'&&effect.value===50&&rule.conditions?.length===0)return 'ex-aura';
 return null;
}

// Read-only decode: an inventory candidate stays a candidate; presence is not activation proof.
export function decodeHpStatEntry(entry) {
 const targets=HP_STAT_PROCESSES[entry.processId],raw=entry.raw,values=raw?.values;
 if(!targets||raw?.trigger!==40||raw?.function!==`process${entry.processId}`||!Array.isArray(values)||values.length<2+targets.length*2||
  !values.slice(0,2+targets.length*2).every(Number.isFinite)||![0,1].includes(values[0])||values[1]<0||values[1]>10000)return entry;
 const modifiers=targets.map((target,i)=>({target,add:values[2+i*2],mul:values[3+i*2],postAdd:0}));
 const decoded={stage:'runtime',lifetime:'hp-condition-continuous',trigger:raw.trigger,hpCondition:{direction:values[0],threshold:values[1]},modifiers};
 const one=modifiers.length===1&&modifiers[0].add===0;
 return {...entry,...(one?{effectType:'statBuff',target:targets[0],value:modifiers[0].mul/100,unit:'%'}:{}),
  sourceName:raw.localId===26505&&entry.processId===1030201&&entry.conditionId===40002&&raw.trigger===40&&JSON.stringify(values.slice(0,4))==='[1,10000,0,3000]'?'月光II':entry.sourceName,decoded};
}
