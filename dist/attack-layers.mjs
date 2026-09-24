import {normalizeRuntimeBuff} from './runtime-buff-definitions.mjs?v=20260924-buff-groups';
import {runtimeStates} from './runtime-buff-engine.mjs?v=20260924-buff-groups';
export function needsAttributeLayers(mode,stat,panel) {
 return mode==='panel'&&Number.isFinite(stat?.beforeBuff)&&Number.isFinite(stat.crossAdd)&&Number.isFinite(panel)&&panel!==stat.beforeBuff+stat.crossAdd;
}
export function attackLayerData(stat) {
 const fail=reason=>({ok:false,reason});
 if(!stat)return fail('当前参照缺少属性基准，请核对角色面板。');
 if(stat.issues?.length)return fail(`属性基准仍有缺项：${stat.issues.join('；')}`);
 const base=stat.beforeBuff+stat.crossAdd;
 if(!Number.isFinite(stat.beforeBuff)||!Number.isFinite(stat.crossAdd)||!Number.isSafeInteger(base)||base<=0)return fail('缺少状态加成前的完整属性基准。');
 const buffs=(stat.buffs||[]).map(b=>normalizeRuntimeBuff(b,stat.key));
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
