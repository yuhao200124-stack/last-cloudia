// 大类 of a skill's game processes, only from the game data (not from its description):
// - the process's name (ProcessMst.NAME): the thing a process changes is at the END of its name
//   (“特定状態異常中SCT回復量増減” = charge recovery while under an ailment), so of all keyword matches the one ending
//   last wins; damage on a critical hit is 暴击, 魔転相 (damage from 魔力／攻击力) is 造成伤害;
// - for a built-in operation without a script, its operation code (ProcessMst.OPE_INFO: 304 暴击, 308 特攻 …);
// - for a process whose name says nothing: its script's value parameters (exact forms: STR倍率, SCT…) and the buffs the
//   script applies (BuffMst.PROCESS_OPE_TYPE + trigger: 504 on a damage-taken trigger = 受到伤害);
// - a one-off script none of these explain is 待确认.
import fs from 'node:fs';
import { luaDocs } from './skill-conditions.mjs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const lua = f => read(`dist/game-data/lua/${f}`);
const core = JSON.parse(read('dist/game-data/engine/core.json'));
const P = core.ProcessMst, pc = Object.fromEntries(P.cols.map((c, i) => [c, i]));
const row = new Map(P.rows.map(r => [r[pc.PROCESS_ID], r]));
const docs = luaDocs('process.lua');

// ---- the buffs a process script applies (BuffIds.X in process<id>), resolved to BuffMst rows ----
const B = core.BuffMst, bc = Object.fromEntries(B.cols.map((c, i) => [c, i]));
const buffRow = new Map(B.rows.map(r => [r[0], r]));
const condName = new Map(core.ProcessCondMst.rows.map(r => [r[0], r[1]]));
const common = lua('luaCommon.lua');
const table = common.slice(common.indexOf('BuffIds = {'));
const buffIds = new Map();
for (const m of table.slice(0, table.indexOf('\n}')).matchAll(/^\s*([A-Za-z0-9_]+)\s*=\s*(\d+)/gm)) buffIds.set(m[1], Number(m[2])); // last one wins, as in Lua
const procSrc = lua('process.lua');
const bodies = new Map();
for (const m of procSrc.matchAll(/^function\s+process(\d+)\s*\(([\s\S]*?)^end/gm)) bodies.set(Number(m[1]), m[2]);
export const scriptBody = pid => bodies.get(pid) || '';
export function buffsOf(pid) {
  const body = bodies.get(pid) || '';
  return [...new Set([...body.matchAll(/BuffIds\.([A-Za-z0-9_]+)/g)].map(m => buffIds.get(m[1])).filter(Boolean))]
    .map(id => buffRow.get(id)).filter(Boolean)
    .map(r => ({ id: r[0], ope: r[bc.PROCESS_OPE_TYPE], trigger: condName.get(r[bc.PROCESS_COND]) || '', category: r[bc.BUFF_CATEGORY] }));
}

export const KIND = [
  ['伤害上限', /ダメージ上限/], ['Break值', /VITダメージ|ガードブレイク/], ['回复', /回復時.*変換|回復量/],
  ['特攻', /キラー|スレイヤー/], ['暴击', /クリティカル|CRT/], ['魔法·咏唱', /詠唱|魔転相|消費MP/],
  ['造成伤害', /与ダメージ|追加ダメージ|DOTダメージ|貫通/], ['受到伤害', /被ダメージ|被追加ダメージ|貫通耐性|相手.*与ダメージ減少|ダメージ軽減|バリア|ガード|被命中|ダメージカット|無効|壁/],
  ['异常', /異常|気絶|ブレイク回復|状態回復|裂傷|死神|状態異常回復速度|異常回復速度/], ['基础属性', /STR|INT|DEF|MND|HP増減|最大HP|最大MP|パラメータ|全ステ|属性耐性|同盟|ステータス増減/],
  ['特技充能·必杀', /SCT(回復量?|自動回復)?|AP|ストック|チャージ|超必殺ゲージ(増減|増加|回復)?/], ['回复', /回復|リジェネ|吸収|ドレイン|蘇生|復活|リレイズ|根性/],
  ['移动与行动', /移動速度|狙われ|距離|スーパーアーマー|ノックバック|怯/], ['装备·种族', /装備可否|キャラタイプ追加|キャラタイプランダム追加|二刀流/],
  ['金钱·经验', /お金|経験値|ドロップ/], ['反击', /カウンター/],
];
// the thing a process changes is at the END of its name (“特定状態異常中SCT回復量増減” = charge recovery while under
// an ailment): of all keyword matches, the one ending last wins (the longest on a tie); damage on a critical hit is 暴击
export function kindCategory(kind) {
  // “(MND補正)” says what the value is scaled by, not what changes (治愈反击: a heal scaled by 精神)
  kind = kind.replace(/\((STR|INT|DEF|MND|MDEF)補正\)/g, '');
  // the attacker's stat on a hit taken (畏惧的眼光: BulletFunc:EditSTR on 被弾 = the enemy's attack): less damage taken
  if (/被弾時対象(STR|INT)増減/.test(kind)) return '受到伤害';
  // immunity to the enemy's critical hits (皇家铠甲) is defense, not the 暴击 of our own attacks
  if (/クリティカル耐性/.test(kind)) return '受到伤害';
  if (/クリティカル(時|発生時).*与ダメージ/.test(kind)) return '暴击';
  if (/魔転相/.test(kind)) return '造成伤害';            // damage from converting 魔力 / 攻击力
  if (/被ダメージ増減付与/.test(kind)) return '造成伤害';  // a debuff put on the target: the enemy takes more damage (腐坏之牙)
  if (/詠唱中スーパーアーマー/.test(kind)) return '魔法·咏唱'; // casting is not interrupted
  let best = null;
  for (const [cat, re] of KIND) for (const m of kind.matchAll(new RegExp(re.source, 'g'))) {
    const end = m.index + m[0].length;
    if (!best || end > best.end || (end === best.end && m[0].length > best.len)) best = { cat, end, len: m[0].length };
  }
  return best?.cat || null;
}
// a process whose script gives its effect to every unit of the side named in its 敵・味方 parameter
// (units:GetCondUnitList(params[N], …)) with that side = TARGET_SIDE_OPPONENT (1): the effect is on the enemies
// (魔断之楔 / 终焉的眼神: 所有属性耐性降低 −10 on every enemy for 40 s)
export function onEnemies(p) {
  const m = (bodies.get(p.pid) || '').match(/GetCondUnitList\(params\[(\d+)\]/);
  return !!m && Number(String(p.params ?? '').split(':')[Number(m[1]) - 1]) === 1;
}
// the 大类 of one process of a skill: from its name (kindCategory), except an effect on the enemies — their element
// resistance going down is damage we deal (the sandbox confirms: 冰耐性 −25 → −35, damage ×1.08); any other stat given to the
// enemies is not known yet and is left for a look
export function processCategory(p) {
  const k = kindCategory(p.kind);
  if (k === '基础属性' && onEnemies(p)) return /属性耐性/.test(p.kind) ? '造成伤害' : '待确认';
  return k;
}
// value parameters of a process script, in their exact forms (a heal “回復値(MND補正)” is not a stat)
const PARAM = [
  [/^ダメージ上限(加算|倍率)/, () => '伤害上限'], [/^VITダメージ/, () => 'Break值'], [/^状態異常継続時間|^即死/, () => '异常'],
  [/^キラー倍率/, () => '特攻'], [/^CRT(加算|倍率)|^クリティカル(率|ダメージ)/, () => '暴击'],
  [/^(STR|INT|DEF|MND|MDEF|HP|MP|最大HP|最大MP|ステータス|全ステ)(加算値|倍率|加算最大値|倍率最大値)$/, () => '基础属性'],
  [/^SCT/, () => '特技充能·必杀'], [/^(HP|MP)?回復(値|倍率|量|最低値)|^HP回復量倍率/, () => '回复'], [/^移動速度/, () => '移动与行动'],
  [/^詠唱時間/, () => '魔法·咏唱'], [/お金|経験値/, () => '金钱·经验'],
];
// a damage multiplier alone says nothing about direction: only used when the process name says nothing either
const DAMAGE_PARAM = /^ダメージ倍率/;
const IGNORE = /消費|閾値|条件|演出|方向|INDEX|番号|オプション|フレーム|秒|確率|回数|人数|WAVE|割合$/;
const OPE = { 300: '基础属性', 301: '基础属性', 302: '基础属性', 303: '基础属性', 305: '基础属性', 318: '基础属性', 304: '暴击', 800: '暴击', 306: '异常', 402: '异常', 406: '异常', 314: 'Break值', 308: '特攻', 509: '特攻', 310: '移动与行动', 320: '移动与行动', 215: '移动与行动', 322: '魔法·咏唱', 600: '受到伤害', 601: '受到伤害', 602: '受到伤害', 603: '受到伤害', 604: '受到伤害', 801: '造成伤害', 802: '造成伤害', 81303: '造成伤害', 81304: '造成伤害', 700: '反击', 808: '装备·种族', 814: '装备·种族', 829: '装备·种族', 1000: '装备·种族', 900: '金钱·经验', 902: '金钱·经验', 201: '回复', 202: '特技充能·必杀', 205: '回复', 207: '回复', 212: '回复' };
export function categoriesOf(procs, defensiveOf) {
  const cats = new Map();
  const put = (c, why) => { if (!cats.has(c)) cats.set(c, new Set()); cats.get(c).add(why); };
  for (const p of procs) {
    const r = row.get(p.pid); if (!r) continue;
    const def = defensiveOf(p);
    const k = processCategory(p); if (k) put(k, '效果种类');
    if (!k && r[pc.USE_SCRIPT] !== 1 && OPE[r[pc.OPE_INFO]]) put(OPE[r[pc.OPE_INFO]], '操作类型');
    if (!k) for (const name of docs.get(`process${p.pid}`)?.params || []) {
      if (!name) continue;
      const m = PARAM.find(([re]) => re.test(name));
      if (m && !(m[1]() === '回复' && k === '特技充能·必杀')) put(m[1](def), '效果数值');
      else if (DAMAGE_PARAM.test(name) && def) put('受到伤害', '效果数值');
    }
    // a process whose name says nothing: the buffs its script applies (BuffMst operation and trigger)
    let fromBuff = false;
    if (!k) for (const b of buffsOf(p.pid)) {
      const c = b.ope === 504 ? (/被ダメージ/.test(b.trigger) ? '受到伤害' : '造成伤害') : { 300: '基础属性', 301: '基础属性', 302: '基础属性', 303: '基础属性', 305: '基础属性', 318: '基础属性', 304: '暴击', 502: '受到伤害', 503: '受到伤害' }[b.ope];
      if (c) { put(c, '所加的增益'); fromBuff = true; }
    }
    // a one-off script (its own name, none of the generic words) that no buff explains: whatever its parameters
    // show, it still needs a look; bookkeeping steps (…情報付与, target choice, costs) pair with a named process
    if (!k && !fromBuff && r[pc.USE_SCRIPT] === 1 && !/情報|ターゲット|消費|増減|増加|付与|変更/.test(p.kind)) put('待确认', '专用脚本');
  }
  if (!cats.size) put('待确认', '看不出');
  return cats;
}

// does a skill raise the attack / magic stat (the damage calculator's 法强／攻击力)? From the process names, the
// built-in operation (300 STR, 302 INT) or the buffs it applies — never from the description
export function raisesAttack(procs) {
  return procs.some(p => {
    const r = row.get(p.pid); if (!r) return false;
    if (/STR増減|INT増減|全ステ|パラメータ増減|ステータス増減|STR変換(?!.*回復)/.test(p.kind) && !/回復/.test(p.kind)) return true;
    if (r[pc.USE_SCRIPT] !== 1 && [300, 302].includes(r[pc.OPE_INFO])) return true;
    return buffsOf(p.pid).some(b => [300, 302].includes(b.ope));
  });
}

// ---- 基础属性 小类: which stats a skill's stat processes change (a skill changing several is in each) ----
// From the game data only: the stat named at the end of the process name (P_HP条件STR増減 = 攻击力, the HP part is
// a condition); the value parameters with a non-zero value (STR倍率 / DEF加算値 …); 全ステ = STR, DEF, INT, MND (the
// game's all-stat processes list exactly these four); 対象ステータスタイプ / ステータス変換先 = STATUS_TYPE codes of
// luaCommon.lua; built-in operations 300–305 / 318; the buffs a script applies.
export const STATS = ['HP', 'MP', '攻击力', '法强', '防御力', '魔抗', '属性耐性'];
const STAT_TOKEN = [['攻击力', /STR/], ['法强', /INT|MAG/], ['防御力', /DEF/], ['魔抗', /MND|MDEF/], ['HP', /最大HP|HP(?=増減|$)/], ['MP', /最大MP|MP(?=増減|$)/], ['属性耐性', /属性耐性/], ['全ステ', /全ステ/]];
const STATUS_TYPE = { 2: '攻击力', 3: '防御力', 4: '法强', 5: '魔抗', 96: 'HP', 32: 'HP', 64: 'HP', 33: 'MP', 1: 'MP' };
const OPE_STAT = { 300: '攻击力', 301: '防御力', 302: '法强', 303: '魔抗', 305: 'HP', 318: 'MP' };
const ALL_STATS = ['攻击力', '防御力', '法强', '魔抗'];
// each stat a skill's stat processes change, with the value: PARAM_BEHAVIOR 4 = 加算值, 5 = 倍率 (1/100 %); a process
// that names its stat wins over its script's parameter comments (PB_被ダメージ時MND増減's comments say INT); an
// equipment-parameter process (対象ステータスタイプ + ステータス倍率) raises the equipment's own value (basis 装备);
// a conversion (…変換) lowers its source and adds to its targets (basis 转换, no fixed value)
const STAT_NAME = { STR: '攻击力', INT: '法强', DEF: '防御力', MND: '魔抗', MDEF: '魔抗', HP: 'HP', MP: 'MP', 全ステ: '全ステ' };
function kindStat(kind) {
  let best = null;
  for (const [stat, re] of STAT_TOKEN) for (const m of kind.matchAll(new RegExp(re.source, 'g'))) {
    const end = m.index + m[0].length;
    if (!best || end > best.end) best = { stat, end };
  }
  return best && /^(増減|増加|変換|デバフ耐性|貫通耐性|$)/.test(kind.slice(best.end)) ? best.stat : null;
}
export function statEntries(procs) {
  const out = [];
  procs.forEach((p, i) => {
    const r = row.get(p.pid); if (!r) return;
    const k = processCategory(p);
    if (k && k !== '基础属性') return;                 // a heal scaled by 魔抗 etc. is not a stat change
    const names = docs.get(`process${p.pid}`)?.params || [];
    const beh = String(r[pc.PARAM_BEHAVIOR] ?? '').split(':').map(Number);
    const vals = String(p.params ?? '').split(':').map(v => (v === '' ? 0 : Number(v)));
    const ks = kindStat(p.kind);
    const got = new Map();
    const bump = (stat, field, v, basis = '角色', max = false) => {
      for (const st of stat === '全ステ' ? ALL_STATS : [stat]) {
        const e = got.get(st) || { stat: st, rate: 0, add: 0, basis, proc: i, max: false };
        if (field && Math.abs(v) > Math.abs(e[field])) { e[field] = v; e.max = e.max || max; }
        got.set(st, e);
      }
    };
    const typeAt = names.indexOf('対象ステータスタイプ');
    if (typeAt >= 0 && STATUS_TYPE[vals[typeAt]]) bump(STATUS_TYPE[vals[typeAt]], 'rate', vals[names.indexOf('ステータス倍率')] || 0, '装备');
    else beh.forEach((b, j) => {
      if (b !== 4 && b !== 5) return;
      const m = (names[j] || '').match(/^(STR|INT|DEF|MND|MDEF|HP|MP|全ステ)/);
      const stat = ks && ks !== '全ステ' ? ks : m ? STAT_NAME[m[1]] : ks;
      if (stat && vals[j]) bump(stat, b === 4 ? 'add' : 'rate', vals[j], '角色', /最大/.test(names[j] || ''));
    });
    // conversions: the targets get part of the source (no fixed value)
    names.forEach((n, j) => { if (/^ステータス変換先\d$/.test(n) && STATUS_TYPE[vals[j]]) bump(STATUS_TYPE[vals[j]], null, 0, '转换'); });
    if (!got.size && ks) bump(ks, null, 0);                       // named, value not readable (e.g. 属性耐性 as a code)
    if (!got.size && r[pc.USE_SCRIPT] !== 1 && OPE_STAT[r[pc.OPE_INFO]]) bump(OPE_STAT[r[pc.OPE_INFO]], null, 0);
    if (!got.size) for (const b of buffsOf(p.pid)) if (OPE_STAT[b.ope]) bump(OPE_STAT[b.ope], null, 0);
    // 属性耐性: the resist value is the process's value parameter
    for (const e of got.values()) out.push(e);
  });
  return out;
}
export function statsOf(procs) {
  const out = new Set();
  const add = s => (s === '全ステ' ? ALL_STATS : [s]).forEach(x => out.add(x));
  for (const p of procs) {
    const r = row.get(p.pid); if (!r) continue;
    const k = processCategory(p);
    if (k && k !== '基础属性') continue;                 // a heal scaled by 魔抗 etc. is not a stat change
    // the stat at the end of the name, when the name ends with it (…STR増減 / …DEFデバフ耐性 / …最大HP増減)
    let best = null;
    for (const [stat, re] of STAT_TOKEN) for (const m of p.kind.matchAll(new RegExp(re.source, 'g'))) {
      const end = m.index + m[0].length;
      if (!best || end > best.end) best = { stat, end };
    }
    const tail = best ? p.kind.slice(best.end) : '';
    if (best && /^(増減|増加|変換|デバフ耐性|貫通耐性|$)/.test(tail)) add(best.stat);
    // the value parameters with a value, the status codes, the conversion targets
    const values = String(p.params ?? '').split(':');
    (docs.get(`process${p.pid}`)?.params || []).forEach((name, i) => {
      const v = Number(values[i]);
      const m = name?.match(/^(STR|INT|DEF|MND|MDEF|HP|MP|全ステ)(加算値|倍率|最大倍率|加算最大値|倍率最大値)$/);
      if (m && v) add({ STR: '攻击力', INT: '法强', DEF: '防御力', MND: '魔抗', MDEF: '魔抗', HP: 'HP', MP: 'MP', 全ステ: '全ステ' }[m[1]]);
      if (/^対象ステータスタイプ$|^ステータス変換先\d$/.test(name || '') && STATUS_TYPE[v]) add(STATUS_TYPE[v]);
    });
    if (r[pc.USE_SCRIPT] !== 1 && OPE_STAT[r[pc.OPE_INFO]]) add(OPE_STAT[r[pc.OPE_INFO]]);
    for (const b of buffsOf(p.pid)) if (OPE_STAT[b.ope]) add(OPE_STAT[b.ope]);
  }
  return STATS.filter(s => out.has(s));
}
