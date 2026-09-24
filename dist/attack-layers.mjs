import {normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-critical-link';
import {runtimeStates,combineRuntimeBuffs} from './runtime-buff-engine.mjs?v=20260924-critical-link';
export function needsAttributeLayers(mode,stat,panel) {
 return mode==='panel'&&Number.isFinite(stat?.beforeBuff)&&Number.isFinite(stat.crossAdd)&&Number.isFinite(panel)&&panel!==stat.beforeBuff+stat.crossAdd;
}
export function attackLayerData(stat) {
 const fail=reason=>({ok:false,reason});
 if(!stat)return fail('当前参照缺少属性基准，请核对角色面板。');
 if(stat.issues?.length)return fail(`属性基准仍有缺项：${stat.issues.join('；')}`);
 const base=stat.beforeBuff+stat.crossAdd;
 if(!Number.isFinite(stat.beforeBuff)||!Number.isFinite(stat.crossAdd)||!Number.isSafeInteger(base)||base<=0)return fail('缺少状态加成前的完整属性基准。');
 const buffs=(stat.runtimeCandidates||stat.buffs||[]).map(b=>normalizeRuntimeBuff(b,stat.key));
 if(buffs.some(b=>!b)||new Set(buffs.map(b=>b.id||b.family||b.source)).size!==buffs.length)return fail('当前实时加成的分组或叠加关系尚未验证，请核对来源。');
 return {ok:true,base,buffs};
}
export function resolveAttackLayers(stat,panel) {
 const data=attackLayerData(stat);if(!data.ok)return data;
 if(!Number.isFinite(panel))return {ok:false,reason:'请填写或读取当前战斗属性。'};
 const matches=runtimeStates(data.base,data.buffs).filter(s=>s.panel===panel);
 if(matches.length!==1)return {ok:false,reason:'当前战斗属性无法与已确认的基准及状态对应，请核对面板时刻和生效状态。'};
 return {ok:true,...matches[0],basis:'website-pure-panel-matched-to-observation'};
}

export function projectAttackLayers(stat,panel,selected=[]) {
 const data=attackLayerData(stat);if(!data.ok)return data;
 // First explain the observation, including a selected buff already present in it.
 const matches=selected.length?runtimeStates(data.base,data.buffs,selected).filter(s=>s.panel===panel):[];
 if(matches.length>1)return {ok:false,reason:'所选增益对应多个观察状态，请核对属性来源。'};
 const observed=matches.length===1?{ok:true,...matches[0]}:resolveAttackLayers(stat,panel);
 if(!observed.ok)return observed;
 const conditions=stat.runtimeConditions||{};
 const controlled=b=>b.hpCondition?.op==='eq'&&typeof conditions[b.hpCondition.field]==='boolean';
 const desired=data.buffs.filter(b=>controlled(b)&&conditions[b.hpCondition.field]===b.hpCondition.value);
 const active=[...observed.active.filter(b=>!controlled(b)),...desired];
 const combined=combineRuntimeBuffs(active,matches.length===1?[]:selected);if(!combined.ok)return combined;
 const projectedPanel=Math.floor(data.base*(100+combined.percent)/100);
 const identity=b=>JSON.stringify([b.id,b.source,b.stat,b.value,b.runtime.stackGroup]);
 const applied=new Set(combined.active.map(identity));
 return {ok:true,...combined,base:data.base,panel:projectedPanel,observedPanel:panel,...(projectedPanel!==panel?{projected:true}:{}),buffObserved:matches.length===1,
  inactive:data.buffs.filter(b=>!applied.has(identity(b)))};
}
