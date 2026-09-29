// 小类 entries for the 大类 after 基础属性 / 造成伤害 / 伤害上限 (the preview page, user 2026-09-29: “按你的逻辑直接写”):
// one entry per game process of the 大类 — which 小类 it is in, what it gives (text) and a sort value, all from the
// game data: the process name (ProcessMst.NAME), the built-in operation (OPE_INFO) and the parameter names of its
// script (process.lua `-- params[N]:名称`). The effect text on the page is the game's own; an entry whose value
// cannot be read from the data says so.
import { ELEM, EQUIP, RACE, AILMENT } from './skill-conditions.mjs';

const pct = x => `${Number((Math.abs(x) / 100).toFixed(2))}%`;
const sgn = x => (x < 0 ? '−' : '+');
const signed = (x, unit = '') => `${sgn(x)}${Math.abs(x)}${unit}`;
const ail = v => (v === '' || v == null || Number.isNaN(v) ? '异常' : AILMENT[v] ?? `异常${v}`);

// the 小类 of each 大类, by the process name (the part that says what it changes)
export const SUBS = {
  受到伤害: [['减伤', k => /被ダメージ増減$/.test(k) && !/付与/.test(k)], ['其他方式', () => true]],
  回复: [['复活', k => /リレイズ|復活|根性/.test(k)], ['回复效果', k => /回復量増減|回復上限増減/.test(k)], ['MP回复', k => /MP(回復|リジェネ)/.test(k)], ['HP回复', () => true]],
  装备·种族: [['追加类型', k => /キャラタイプ/.test(k)], ['可装备', k => /装備可否/.test(k)], ['二刀流', () => true]],
  异常: [['异常耐性', k => /耐性/.test(k)], ['恢复速度', k => /回復速度/.test(k)], ['赋予异常', () => true]],
  '特技充能·必杀': [['超必杀槽', k => /超必殺ゲージ|エーテル/.test(k)], ['特技次数', k => /ストック数/.test(k)], ['充能速度', k => /SCT(自動)?回復量/.test(k)], ['立即充能', () => true]],
  移动与行动: [['被瞄准', k => /狙われ/.test(k)], ['移动速度', () => true]],
  '魔法·咏唱': [['消耗MP', k => /消費MP/.test(k)], ['咏唱', () => true]],
};
export const subOf = (cat, kind) => (SUBS[cat] ? SUBS[cat].find(([, f]) => f(kind))[0] : cat);

// what a process gives: { way, text, value } (value: bigger = listed first within its way); ways are listed in
// the order of WAYS within a 小类
export const WAYS = ['特攻伤害', '特攻', '暴击率', '暴击时伤害', '可以暴击', '免疫暴击', '破防值', '解除格挡', '受到的破防值', '反击',
  '受到伤害', '回避', '格挡', '受到的追击伤害', '不受防御贯通', '免疫异常', '敌人造成的伤害', '敌人受到的伤害',
  '伤害', '伤害上限', '复活', '回复HP', '持续回复HP', '吸取HP', '回复MP', '持续回复MP', '回复效果', '追加类型', '可装备', '二刀流',
  '异常耐性', '恢复速度', '赋予异常', '即死', '裂伤', '超必杀槽', '特技次数', '充能速度', '充能', '移动速度', '被瞄准程度',
  '咏唱时间', '咏唱不中断', '消耗MP', '金钱', '经验', '援护', '其他'];
export function describe(p, { names, vals, ope, script, beh = [] }) {
  const k = p.kind, has = n => names.includes(n), V = n => vals[names.indexOf(n)] ?? 0;
  const out = (way, text, value = 0) => ({ way, text, value });
  if (script !== 1) switch (ope) {       // built-in operations: their parameters in the ProcessMst order
    case 308: return out('特攻', '特攻');
    case 509: return out('特攻伤害', `特攻伤害 ${sgn(vals[0])}${pct(vals[0])}`, vals[0]);
    case 304: return out('暴击率', `暴击率 ${signed(vals[0], '%')}`, vals[0] * 100);
    case 800: return out('可以暴击', `${ELEM[vals[0]] ?? ''}属性魔法可以暴击`);
    case 829: return out('可以暴击', '超必杀可以暴击');
    case 314: return out('受到的破防值', `受到的破防值 ${sgn(vals[1])}${pct(vals[1])}`, -vals[1]);
    case 700: return out('反击', `受到攻击时反击（${pct(vals[0])}几率）`, vals[0]);
    case 600: return out('格挡', `自动格挡（${pct(vals[0])}几率）`, vals[0]);
    case 601: return out('格挡', `格挡几率 ${sgn(vals[0])}${pct(vals[0])}`, vals[0]);
    case 602: return out('格挡', `格挡减伤 ${sgn(vals[0])}${pct(vals[0])}`, vals[0]);
    case 603: return out('格挡', '可以格挡魔法');
    case 604: return out('格挡', vals[1] ? `格挡耐久 ${sgn(vals[1])}${pct(vals[1])}` : `格挡耐久 ${signed(vals[0])}`, vals[1] || vals[0]);
    case 201: return out('回复HP', vals[1] ? `回复HP ${pct(vals[1])}` : `回复HP ${vals[0]}`, vals[1] || vals[0]);
    case 212: return out('回复MP', vals[1] ? `回复MP ${pct(vals[1])}` : `回复MP ${vals[0]}`, vals[1] || vals[0]);
    case 202: return out('充能', vals[1] ? `充能 ${pct(vals[1])}` : `充能 +${vals[0]}`, vals[1] || vals[0] * 100);
    case 205: return out('复活', `复活（HP ${pct(vals[0])}）`, vals[0]);
    case 207: return out('吸取HP', `吸取伤害的 ${pct(vals[0])} 为HP`, vals[0]);
    case 306: return out('异常耐性', `${ail(vals[0])}耐性 ${signed(vals[1])}`, vals[1]);
    case 402: return out('恢复速度', `${ail(vals[0])}恢复速度 ${sgn(vals[1])}${pct(vals[1])}`, vals[1]);
    case 406: return out('恢复速度', `眩晕恢复速度 ${sgn(vals[0])}${pct(vals[0])}`, vals[0]);
    case 814: return out('追加类型', `追加${RACE[vals[0]] ?? vals[0]}类型`);
    case 1000: return out('可装备', `可装备${EQUIP[vals[0]] ?? vals[0]}`);
    case 808: return out('二刀流', '二刀流');
    case 310: return out('移动速度', vals[0] ? `移动速度 ${signed(vals[0])}` : `移动速度 ${sgn(vals[1])}${pct(vals[1])}`, vals[0] * 100 || vals[1]);
    case 320: return out('被瞄准程度', `容易被瞄准的程度 ${signed(vals[0])}`, -vals[0]);
    case 215: return out('超必杀槽', `超必杀槽累积 ${sgn(vals[1])}${pct(vals[1])}`, vals[1]);
    case 802: return out('消耗MP', `攻击魔法消耗MP ${sgn(vals[2])}${pct(vals[2])}`, -vals[2]);
    case 818: return out('消耗MP', `${ELEM[vals[0]] ?? ''}属性魔法消耗MP ${sgn(vals[2])}${pct(vals[2])}`, -vals[2]);
    case 322: return out('咏唱不中断', '咏唱不会被打断');
    case 900: return out('经验', `经验 ${sgn(vals[0])}${pct(vals[0])}`, vals[0]);
    case 902: return out('金钱', `金钱 ${sgn(vals[0])}${pct(vals[0])}`, vals[0]);
  }
  // scripts: by their parameter names
  if (has('CRT加算値')) return out('暴击率', `暴击率 ${signed(V('CRT加算値'), '%')}`, V('CRT加算値') * 100);
  if (has('キラー倍率増減値')) return out('特攻伤害', `特攻伤害 ${sgn(V('キラー倍率増減値'))}${pct(V('キラー倍率増減値'))}`, V('キラー倍率増減値'));
  if (/対象キャラクタータイプ/.test(names.join()) && /キラー|スレイヤー/.test(k)) return out('特攻', '特攻');
  if (/VIT/.test(k) || has('VITダメージ倍率')) {
    const add = has('VITダメージ加算値') ? V('VITダメージ加算値') : V('増減値'), rate = has('VITダメージ倍率') ? V('VITダメージ倍率') : V('増減倍率');
    const who = /被ダメージ/.test(k) ? '受到的破防值' : '破防值';
    if (rate <= -10000) return out(who, `不受${who.replace('受到的', '')}`, 10000);
    return out(who, `${who} ${rate ? `${sgn(rate)}${pct(rate)}` : signed(add)}`, who === '破防值' ? rate || add : -(rate || add));
  }
  if (/ガードブレイク/.test(k)) return out('解除格挡', '解除敌人的格挡');
  const dmg = ['ダメージ倍率補正', 'ダメージ倍率', 'ダメージ倍率最大補正'].find(has);
  if (dmg) {
    // a script whose comments name fewer parameters than it has: the damage rate is the one of behaviour 8
    const r = V(dmg) || (beh.includes(8) ? vals[beh.indexOf(8)] || 0 : 0);
    if (/被ダメージ増減付与/.test(k)) return out('敌人受到的伤害', `敌人受到的伤害 ${sgn(r)}${pct(r)}`, r);
    if (/相手.*与ダメージ/.test(k)) return out('敌人造成的伤害', `敌人造成的伤害 ${sgn(r)}${pct(r)}`, -r);
    if (/被ダメージ|被弾/.test(k)) return out('受到伤害', `受到伤害 ${sgn(r)}${pct(r)}`, -r);
    return out('伤害', `伤害 ${sgn(r)}${pct(r)}`, r);
  }
  if (has('ダメージ上限加算値')) return out('伤害上限', `伤害上限 ${signed(V('ダメージ上限加算値'))}`, V('ダメージ上限加算値'));
  if (has('命中率加算値')) return out('回避', `被命中率 ${sgn(V('命中率加算値'))}${pct(V('命中率加算値'))}`, -V('命中率加算値'));
  if (has('追加ダメージ倍率MIN倍率')) return out('受到的追击伤害', `受到的追击伤害 ${sgn(V('追加ダメージ倍率MIN倍率'))}${pct(V('追加ダメージ倍率MIN倍率'))}`, -V('追加ダメージ倍率MIN倍率'));
  if (has('発生確率') && /クリティカル耐性/.test(k)) return out('免疫暴击', `${pct(V('発生確率'))}几率免疫暴击`, V('発生確率'));
  if (has('発生確率') && /貫通耐性/.test(k)) return out('不受防御贯通', `${pct(V('発生確率'))}几率不受防御贯通`, V('発生確率'));
  if (/異常無効/.test(k)) return out('免疫异常', `免疫基本异常 ${V('制限回数') || 1} 次`, V('制限回数'));
  if (has('HP回復量倍率')) { const who = /被/.test(k) ? '受到的回复量' : '回复量'; return out('回复效果', `${who} ${sgn(V('HP回復量倍率'))}${pct(V('HP回復量倍率'))}`, V('HP回復量倍率')); }
  if (has('回復上限増減値')) { const who = /被/.test(k) ? '受到的回复上限' : '回复上限'; return out('回复效果', `${who} ${signed(V('回復上限増減値'))}`, V('回復上限増減値') * 100); }
  if (has('被ダメージ吸収倍率')) return out('吸取HP', `受到伤害的 ${pct(V('被ダメージ吸収倍率'))} 转为HP`, V('被ダメージ吸収倍率'));
  if (has('復活時HP割合')) return out('复活', `复活（HP ${pct(V('復活時HP割合'))}）`, V('復活時HP割合'));
  if (has('HP回復倍率') && /根性/.test(k)) return out('复活', `不会倒下（HP ${pct(V('HP回復倍率'))}）`, V('HP回復倍率'));
  if (has('ステータス変換効率')) return out('回复HP', '回复时把攻击力的一部分转换');
  if (has('回復倍率') && (has('MND倍率') || has('MDEF倍率') || has('回復最低値'))) {
    const regen = /リジェネ/.test(k);
    return out(regen ? '持续回复HP' : '回复HP', `${regen ? '持续回复HP' : '回复HP'}（按精神算，最低 ${V('回復最低値')}）`, V('回復最低値'));
  }
  if (/MP/.test(k) && (has('MP回復値') || has('MP回復倍率') || has('最大MP割合') || has('吸収割合'))) {
    if (has('吸収割合') && V('吸収割合')) return out('回复MP', `吸取伤害的 ${pct(V('吸収割合'))} 为MP`, V('吸収割合'));
    const regen = /リジェネ/.test(k), way = regen ? '持续回复MP' : '回复MP';
    const r = V('MP回復倍率') || V('最大MP割合');
    return out(way, `${way} ${V('MP回復値') ? `+${V('MP回復値')}` : ''}${V('MP回復値') && r ? '、' : ''}${r ? pct(r) : ''}`.trim(), r || V('MP回復値') * 100);
  }
  const sctRate = ['SCT自動回復倍率', 'SCT自動回復倍率最大値'].find(has), sctAdd = ['SCT自動回復加算値', 'SCT自動回復加算最大値'].find(has);
  if (sctRate || sctAdd) {
    const r = sctRate ? V(sctRate) : 0, a = sctAdd ? V(sctAdd) : 0;
    return out('充能速度', `充能速度 ${r ? `${sgn(r)}${pct(r)}` : signed(a)}`, r || a * 100);
  }
  if (/SCT回復/.test(k)) {
    if (V('回復倍率(1ストック)')) return out('充能', `充满 ${V('回復倍率(1ストック)') / 10000} 次`, V('回復倍率(1ストック)'));
    if (V('回復倍率')) return out('充能', `充能 ${pct(V('回復倍率'))}`, V('回復倍率'));
    return out('充能', `充能 +${V('回復値')}`, V('回復値') * 100);
  }
  if (has('ストック増減値')) return out('特技次数', `特技可积蓄次数 ${signed(V('ストック増減値'))}`, V('ストック増減値'));
  if (has('エーテル増減倍率')) return out('超必杀槽', `超必杀槽 ${sgn(V('エーテル増減倍率'))}${pct(V('エーテル増減倍率'))}`, V('エーテル増減倍率'));
  if (has('移動速度加算値') || has('移動速度倍率')) return out('移动速度', V('移動速度加算値') ? `移动速度 ${signed(V('移動速度加算値'))}` : `移动速度 ${sgn(V('移動速度倍率'))}${pct(V('移動速度倍率'))}`, V('移動速度加算値') * 100 || V('移動速度倍率'));
  if (has('狙われやすさ増減値')) return out('被瞄准程度', `容易被瞄准的程度 ${signed(V('狙われやすさ増減値'))}`, -V('狙われやすさ増減値'));
  const cast = ['詠唱時間倍率', '詠唱時間増減値'].find(has);
  if (cast) return out('咏唱时间', `咏唱时间 ${sgn(V(cast))}${pct(V(cast))}`, -V(cast));
  if (/耐性/.test(k) && (has('増減値') || has('増減段階'))) {
    const id = names.indexOf('状態異常ID'), n = V('増減値') || V('増減段階');
    return out('异常耐性', `${id >= 0 ? ail(vals[id]) : '基本异常'}耐性 ${signed(n)}`, n);
  }
  if (/弱点軽減/.test(k)) return out('异常耐性', '消除异常耐性的弱点');
  if (/裂傷/.test(k)) return out('裂伤', has('蓄積量倍率') && V('蓄積量倍率') ? `裂伤累积 ${sgn(V('蓄積量倍率'))}${pct(V('蓄積量倍率'))}` : V('蓄積量加算値') ? `攻击时累积裂伤 +${V('蓄積量加算値')}` : '攻击时累积裂伤', V('蓄積量倍率') || V('蓄積量加算値') * 100);
  if (/死神/.test(k)) return out('即死', '使敌人即死');
  if (/異常付与/.test(k)) { const j = names.findIndex(n => /^状態異常(種類|ID)$/.test(n || '')); return out('赋予异常', `赋予${j >= 0 ? ail(vals[j]) : '异常'}`); }
  if (/キャラタイプ(ランダム)?追加/.test(k)) return out('追加类型', '随机追加一种类型');
  if (/援護/.test(k)) return out('援护', '援护效果');
  return null;
}
