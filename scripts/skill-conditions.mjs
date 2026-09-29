// The conditions of a skill's game processes, read from the game data (not from its description):
// - the process's own parameters, named by the doc comments of its script (process.lua: `-- params[N]:名称`), or —
//   for built-in operations without a script — by the operation (308 特攻 → race, 306 异常耐性 → ailment …);
// - its trigger condition (ProcessMst.PROCESS_COND → ProcessCondMst.LUA_FUNC_NAME) with PROCESS_COND_PARAM, named by
//   the condition function's doc comments; where the function's “パラメータタイプ(bit)” flag is set, the value is an
//   index into the process's own parameters (read from the function's code);
// - the trigger's own name (詠唱中, クリティカル, トドメ …);
// - values through the game scripts' code tables (luaCommon.lua: ELEMENT_*, SKILL_*, EQUIP_TYPE_*, CHARA_TYPE_* with
//   int32ToUnitTypeArray, ENEMY_TYPE_*, AILMENT_*, GENDER_*). A parameter that cannot be read is listed as undecoded.
import fs from 'node:fs';

export function luaDocs(file) {
  const lines = fs.readFileSync(new URL(`../dist/game-data/lua/${file}`, import.meta.url), 'utf8').split('\n'), out = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^function\s+([A-Za-z0-9_]+)\s*\(/); if (!m) continue;
    const params = [], title = [];
    for (let j = i - 1; j >= 0 && /^\s*--/.test(lines[j]); j--) {
      const p = lines[j].match(/^\s*--\s*params\[(\d+)\]\s*[:：]\s*(.*)$/);
      // a range: `params[1]～params[10]:対象キャラクタータイプ` (複数タイプスレイヤー)
      const range = lines[j].match(/^\s*--\s*params\[(\d+)\]\s*[～~]\s*params\[(\d+)\]\s*[:：]\s*(.*)$/);
      if (p) params[Number(p[1]) - 1] = p[2].trim();
      else if (range) for (let k = Number(range[1]); k <= Number(range[2]); k++) params[k - 1] = range[3].trim();
      else title.unshift(lines[j].replace(/^\s*--\s*/, '').trim());
    }
    out.set(m[1], { title: title.join(' '), params });
  }
  return out;
}

const R = p => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const LUA = p => fs.readFileSync(new URL(`../dist/game-data/lua/${p}`, import.meta.url), 'utf8');
const core = R('dist/game-data/engine/core.json');
const P = core.ProcessMst, pc = Object.fromEntries(P.cols.map((c, i) => [c, i]));
const procRow = new Map(P.rows.map(r => [r[pc.PROCESS_ID], r]));
const condRow = new Map(core.ProcessCondMst.rows.map(r => [r[0], r]));
const procDocs = luaDocs('process.lua');
const condDocs = new Map([...luaDocs('condition.lua'), ...luaDocs('procCondCommon.lua')]);
// which condition parameter a flag bit turns into “an index into the process parameters”
const condSrc = LUA('condition.lua') + '\n' + LUA('procCondCommon.lua');
const gating = new Map();
for (const m of condSrc.matchAll(/^function\s+([A-Za-z0-9_]+)\s*\(([\s\S]*?)^end/gm)) {
  const g = [], direct = new Set();
  const INDEX_READ = /(?:Process:Param|GetProcParamIndex|GetProcParamArray)\(\s*params\[(\d+)\]/g;
  for (const line of m[2].split('\n')) {
    const test = line.match(/params\[(\d+)\]\s*&\s*(\d+)\s*==\s*\d+/);
    for (const x of line.matchAll(INDEX_READ)) {
      if (test) g.push({ flag: Number(test[1]), bit: Number(test[2]), param: Number(x[1]) });
      else direct.add(Number(x[1]));
    }
  }
  // an element read from the process that may be ELEMENT_NONE meaning “any element” (IsWeakElement: `params[2]==0 or
  // Process:Param(params[2])==ELEMENT_NONE or Bullet:Element(…)` after `Bullet:Element() == ELEMENT_NONE → false`)
  const noneAny = new Set([...m[2].matchAll(/Process:Param\(params\[(\d+)\]\)\s*==\s*ELEMENT_NONE\s+or/g)].map(x => Number(x[1])));
  gating.set(m[1], { bits: g, direct: [...direct].filter(n => !g.some(b => b.param === n)), noneAny });
}

export const ELEM = { 0: '无', 1: '火', 2: '冰', 3: '树', 4: '雷', 5: '光', 6: '暗' };
const ELEM_ALL = [1, 2, 3, 4, 5, 6], ELEM_ANY = [0, 1, 2, 3, 4, 5, 6];
function elements(v) {
  if (v === -2) return null;                      // unmentioned: any
  if (v === -1) return ELEM_ALL;                  // all six (not 无)
  if (v <= -11 && v >= -16) return ELEM_ANY.filter(e => e !== -v - 10);
  if (v <= -3 && v >= -10) return 'weapon';       // the element of this character's weapon
  return ELEM[v] != null ? [v] : undefined;
}
export const SKILL = { 9: '普攻', 1: '特技', 2: '魔法', 3: '魔法阵', 4: '召唤', 5: '超必杀', 6: '被动', 7: '圣物技能', 15: '反击' };
function skillTypes(v) {
  if (!v) return null;
  if (v === 10) return [9, 1];
  if (v > 15) { const out = []; for (let t = 1; t <= 15; t++) if (v & (1 << (t + 3))) out.push(...(t === 10 ? [9, 1] : [t])); return out.length ? out : undefined; }
  return SKILL[v] ? [v] : undefined;
}
export const ROLE = { 1: '攻击', 2: '回复', 3: '辅助', 8: '减益', 16: '魔法阵', 32: '复活' };
export const EQUIP = { 10: '剑', 11: '斧', 12: '枪', 13: '锤', 14: '弓', 15: '机械', 16: '爪', 17: '杖', 20: '铠甲', 21: '衣服', 22: '法袍', 30: '饰品' };
// int32ToUnitTypeArray (luaCommon.lua): a code with bit 10 set is one race; otherwise each set bit i (1-based) is
// the race ((i // 16) + 1) * 1000 + i % 16
export function racesOf(v) {
  if (!v || v < 0) return [];
  if (v & 512) return [v];
  const out = []; for (let i = 1; i <= 31; i++) if (v & (2 ** (i - 1))) out.push((Math.floor(i / 16) + 1) * 1000 + (i % 16));
  return out;
}
export const RACE = { 1001: '战士', 1002: '射手', 1003: '骑士', 1004: '法师', 1005: '治疗师', 2001: '兽', 2002: '植物', 2003: '昆虫', 2004: '鸟', 2005: '魔法生物', 2006: '不死生物', 2007: '石', 2008: '机械', 2009: '精灵', 2010: '龙', 2011: '神', 2012: '鱼' };
export const ENEMY = { 1: '普通敌人', 2: 'BOSS' };
const GENDER = { 1: '男性', 2: '女性', 3: '性别不明' };
export const AILMENT = { 0: '全部异常', 1: '毒', 2: '麻痹', 3: '疾病', 4: '暗黑', 5: '诅咒', 6: '沉默', 10: '封印', 11: '冻结', 12: '愤怒', 13: '腐化', 20: '剧毒', 21: '妨碍', 22: '忧郁' };

// other condition parameters (by name) → a readable condition; value-only parameters are not conditions
const OTHER_LABELS = [[/パッシブスキルID/, '需要装备特定技能'], [/特技.*INDEX|特技INDEX/, '指定特技栏'], [/プロセスカテゴリ/, '特定效果类别'], [/バフ(カテゴリ|タイプ|グループ)|バフ数/, '有特定增益／减益时'], [/援護/, '援护条件'], [/向き/, '朝向条件'], [/MP閾値|残りMP/, 'MP条件'], [/超必殺/, '超必杀槽条件'], [/エーテル/, '以太条件'], [/キャラカテゴリ/, '角色类别条件'], [/ステータス条件|比較元ステータス|比較先ステータス/, '属性比较条件'], [/距離/, '距离条件'], [/トリガ/, '触发编号条件'], [/死神/, '即死条件'], [/高さ/, '空中'], [/移動タイプ/, '移动中'], [/ヒットINDEX|バレットヒット/, '第几击条件'], [/キャラ種類数|キャラタイプ数/, '自身类型数条件'], [/属性耐性条件/, '目标属性耐性条件'], [/曜日/, '现实时间条件'], [/スキル種別/, '技能种别条件'], [/ストック数/, '特技次数条件'], [/被弾回数/, '受击次数条件'], [/ヒット数/, '连击数条件'], [/連続発動/, '连续发动条件'], [/種類数/, '种类数条件']];
const NOT_CONDITION = /最小|最大|MIN|MAX|変換|率$|表示|死亡するか|段階|^追加|追加数|オプション|選択方法|ターゲット|可否|固定\/割合|以上・未満|条件INDEX$|制限時間|自分\/死者|対象ステータスタイプ|回復値|一致数|消費|割合|値$/;
// a parameter name → which dimension it constrains
function dimOf(name) {
  if (!name) return null;
  if (/^効果(最小|最大)HP割合$/.test(name)) return 'hpScale';
  if (/^復活時HP割合$/.test(name)) return null;                    // the HP it revives with, a value
  if (/^(STR|INT|DEF|MND|MDEF|HP|MP|全ステ)(加算|倍率|最大)|回復|消費/.test(name)) return null;   // values, not conditions
  if (/^効果発生/.test(name)) return /時刻/.test(name) ? 'time' : /超必殺/.test(name) ? 'ultimate' : /ヒット/.test(name) ? 'hits' : /HP/.test(name) ? 'hp' : /距離/.test(name) ? 'distance' : /人数/.test(name) ? 'party' : 'other';
  if (/パラメータタイプ|演出|継続時間|倍率|加算|補正|最大値|最小値|確率|回数|間隔|フレーム|オプション|効率|変換先|WAVE|秒|距離|ヒット数|割合$|値$/.test(name) && !/HP|閾値|条件/.test(name)) return null;
  if (/重複可否/.test(name)) return 'multiCast';
  if (/敵・味方|敵味方|バレットオーナー|発動者/.test(name)) return 'side';
  if (/自分キャラ|自分キャラクター|特定キャラ条件/.test(name)) return 'ownRace';
  if (/キャラタイプ条件\(Not\)/.test(name)) return 'notRace';
  if (/キャラ(クター)?タイプ|キャラタイプ/.test(name) && !/数|予備|カテゴリ/.test(name)) return 'race';
  if (/エネミータイプ|^敵タイプ$/.test(name)) return 'enemy';
  if (/^属性ID$/.test(name)) return 'aboutElement';
  if (/時刻/.test(name)) return 'time';
  if (/^フリー\d|条件種別\(bit\)|^条件\dM(IN|AX)$/.test(name)) return null;
  if (/耐性属性|対象属性|追加ダメージ\d属性/.test(name)) return 'aboutElement';
  if (/装備属性/.test(name)) return 'weaponElement';
  if (/属性/.test(name) && !/耐性条件M/.test(name)) return 'element';
  if (/スキルタイプ/.test(name)) return 'skillType';
  if (/スキルロール/.test(name)) return 'role';
  if (/武器装備状況|防具装備状況|アクセサリ装備状況/.test(name)) return 'gearState';
  if (/装備|装備種/.test(name)) return 'equip';
  if (/性別/.test(name)) return 'gender';
  if (/状態異常/.test(name) && !/継続時間/.test(name)) return 'ailment';
  if (/HP/.test(name) && /閾値|条件|割合/.test(name)) return 'hp';
  if (/方向/.test(name)) return 'direction';
  if (/汎用数値|汎用情報|スキル発動毎情報|発動毎情報|汎用トリガ/.test(name)) return 'scriptValue';
  if (/人数|生存/.test(name)) return 'party';
  if (/気絶|ブレイク/.test(name)) return 'break';
  return 'other';
}
// the trigger's own name says when it works
const TRIGGER_TAGS = [[/Wave終了|バトル終了/, '战斗结束时'], [/被ダメージ時|被ダメージ計算|バレットを受けた|被弾/, '受到攻击时'], [/詠唱中|準備中/, '咏唱中'], [/クリティカル/, '暴击时'], [/気絶・ブレイク|ブレイク状態/, 'Break／眩晕'], [/空中/, '空中'], [/トドメ|撃破/, '击杀时'], [/致死ダメージ/, '受到致命伤害时'], [/生存人数|生存数/, '队伍／人数条件'], [/ステ比較/, '属性比较条件'], [/移動中/, '移动中'], [/フレーム間隔/, '定时发动'], [/キラー発生/, '特攻发动时'], [/弱点属性/, '打弱点属性时'], [/ヒット数|ヒット中/, '连击数条件'], [/距離/, '距离条件'], [/HP/, 'HP条件'], [/MP値/, 'MP条件']];
// conditions written into the process itself show in its name (the part before what it changes)
const KIND_TAGS = [[/対状態異常|状態異常中の相手|異常状態の相手/, '对异常状态的敌人'], [/特定状態異常中|状態異常中(?!の相手)|状態異常時/, '自身异常状态时'], [/対気絶・ブレイク中|気絶・ブレイク中/, 'Break／眩晕'], [/距離状況|距離条件/, '距离条件'], [/HP状況|HP条件/, 'HP条件'], [/超必殺ゲージ(状況|条件)/, '超必杀槽条件'], [/MP状況|MP値条件/, 'MP条件'], [/ヒット数(状況|条件)/, '连击数条件'], [/生存人数|生存数|人数状況/, '队伍／人数条件'], [/ステ比較/, '属性比较条件'], [/一刀時|一刀で/, '只装一件武器'], [/二刀時/, '装两件武器'], [/武器未装備時/, '未装备武器'], [/空中/, '空中'], [/復活時/, '复活时'], [/死亡時/, '死亡时'], [/キル時|撃破時|トドメ/, '击杀时'], [/移動中/, '移动中'], [/詠唱中|準備中/, '咏唱中'], [/クリティカル時/, '暴击时'], [/キラー発生時|キラー時/, '特攻发动时'], [/弱点属性/, '打弱点属性时'], [/対BOSS|ボス/, '对BOSS'], [/同一キャラタイプ/, '对与自身同类型的敌人'], [/経過時間状況/, '随时间变强'], [/同一攻撃Hit数/, '受到连续攻击时']];
const nibbles = n => { const out = []; for (let i = 0; i < 6 && n > 0; i++) { out.push(n & 15); n >>= 4; } return out; };

export function decodeProcess(pid, paramStr) {
  const row = procRow.get(pid); if (!row) return { missing: true };
  const params = String(paramStr ?? '').split(':').map(v => v === '' ? null : Number(v));
  // a process that only sets a counter is not a condition; one that reads it (…状況 / …条件) is
  let scriptCond = /汎用(数値)?情報(状況|条件)|状況|条件/.test(row[pc.NAME]);
  const out = { hpScale: {}, elements: [], skillTypes: [], roles: [], equips: [], races: [], allyRaces: [], notRaces: [], ownRaces: [], addRaces: [], canEquip: [], enemy: [], gender: [], ailments: [], hp: [], gearState: [], weaponElement: [], aboutElements: [], script: false, other: [], undecoded: [], anyElement: false, anyType: false };
  const own = /特定キャラ専用/.test(row[pc.NAME]);
  const add = (dim, raw, name) => {
    if (raw == null || Number.isNaN(raw)) return;
    if (dim === 'race' && own && !/対象|相手/.test(name)) dim = 'ownRace';
    if (dim === 'race' && /キャラタイプ(ランダム)?追加/.test(row[pc.NAME])) dim = 'addRace';   // 人类模仿: the types it may add
    switch (dim) {
      case 'element': { const e = elements(raw); if (e === null) out.anyElement = true; else if (e === 'weapon') out.weaponElement.push('武器的属性'); else if (e) out.elements.push(...e); else out.undecoded.push(`${name}=${raw}`); break; }
      case 'aboutElement': { const e = elements(raw); if (Array.isArray(e)) out.aboutElements.push(...e); else if (e !== null) out.undecoded.push(`${name}=${raw}`); break; }
      case 'weaponElement': { const e = elements(raw); if (Array.isArray(e)) out.weaponElement.push(...e.map(x => ELEM[x])); else if (e === 'weapon') out.weaponElement.push('同武器属性'); break; }
      case 'skillType': { const t = skillTypes(raw); if (t === null) out.anyType = true; else if (t) out.skillTypes.push(...t); else out.undecoded.push(`${name}=${raw}`); break; }
      case 'role': if (raw && ROLE[raw]) out.roles.push(raw); else if (raw) out.undecoded.push(`${name}=${raw}`); break;
      case 'equip': if (raw && EQUIP[raw]) out.equips.push(raw); else if (raw > 0) out.undecoded.push(`${name}=${raw}`); break;
      case 'race': case 'notRace': case 'ownRace': case 'addRace': { if (raw === -1) { out.other.push('与自身同类型'); break; } const rs = racesOf(raw); if (rs.length && rs.every(r => RACE[r])) out[{ race: 'races', notRace: 'notRaces', ownRace: 'ownRaces', addRace: 'addRaces' }[dim]].push(...rs); else if (raw > 0) out.undecoded.push(`${name}=${raw}`); break; }
      case 'wall': out.undecoded.push(`壁的种类 ${name}=${raw}`); break;
      case 'time': out.other.push('现实时间条件'); break;
      case 'canEquip': if (EQUIP[raw]) out.canEquip.push(raw); break;
      case 'enemy': if (ENEMY[raw]) out.enemy.push(raw); break;
      case 'gender': if (GENDER[raw]) out.gender.push(raw); break;
      case 'ailment': if (AILMENT[raw] != null) out.ailments.push(raw); break;
      case 'hp': out.hp.push({ name, value: raw }); break;
      case 'hpScale': out.hpScale[/最小/.test(name) ? 'min' : 'max'] = raw; break;
      case 'direction': out.hp.push({ name, dir: raw }); break;
      case 'gearState': out.gearState.push(`${name}=${raw}`); break;
      case 'scriptValue': if (scriptCond) out.script = true; break;
      case 'ultimate': out.other.push('超必杀槽条件'); break;
      case 'hits': out.other.push('连击数条件'); break;
      case 'distance': out.other.push('距离条件'); break;
      case 'party': out.other.push('队伍／人数条件'); break;
      case 'break': out.other.push('Break／眩晕'); break;
      // skl:MultiCast() (IsValidSkillMultiCast …): 1 = the game's “不可重复” skills (人工精灵: 不可重复魔法的伤害上限+5000)
      case 'multiCast': if (raw === 1) out.other.push('不可重复的技能'); else if (raw) out.undecoded.push(`${name}=${raw}`); break;
      case 'side': if (out.side == null) out.side = raw; break;   // TARGET_SIDE_* (1 opponent, 2 ally, 3 me): the process's own, read first
      default: { const l = OTHER_LABELS.find(([re]) => re.test(name)); if (l) out.other.push(l[1]); else if (!NOT_CONDITION.test(name)) out.undecoded.push(`${name}=${raw}`); }
    }
  };
  // 1) the process's own parameters
  const pdoc = procDocs.get(`process${pid}`);
  const OPE = { 308: ['race'], 800: ['element'], 306: ['ailment'], 814: ['addRace'], 829: ['addRace'], 1000: ['canEquip'] };
  if (row[pc.USE_SCRIPT] !== 1) (OPE[row[pc.OPE_INFO]] || []).forEach((dim, i) => add(dim, params[i], `操作${row[pc.OPE_INFO]}参数${i + 1}`));
  else if (pdoc) pdoc.params.forEach((name, i) => { const dim = dimOf(name); if (dim) add(dim, params[i], name); });
  else out.undecoded.push('处理脚本没有参数说明');
  // 2) its trigger condition
  const cond = condRow.get(row[pc.PROCESS_COND]), fn = cond?.[3];
  const cparams = String(row[pc.PROCESS_COND_PARAM] ?? '').split(':').map(v => v === '' ? 0 : Number(v));
  for (const [re, tag] of KIND_TAGS) if (re.test(row[pc.NAME])) out.other.push(tag);
  const trig = cond?.[1] || '';
  for (const [re, tag] of TRIGGER_TAGS) {
    if (!re.test(trig)) continue;
    if (tag === '队伍／人数条件' && /オート/.test(row[pc.NAME])) continue;          // auto buffs re-apply, not a condition
    if (tag === '受到攻击时' && /被ダメージ(増減|軽減|増加)|被命中|ガード|バリア/.test(row[pc.NAME])) continue; // a damage-taken effect works when hit by nature
    out.other.push(tag);
  }
  if (fn) {
    scriptCond = true;
    const cdoc = condDocs.get(fn), gate = gating.get(fn) || { bits: [], direct: [] };
    if (fn === 'IsCritical') out.other.push('暴击时');
    if (fn === 'IsBossWave' || /Boss/.test(fn)) out.enemy.push(2);
    if (/Break/.test(fn)) out.other.push('Break／眩晕');
    // HP conditions without documented parameters, read from their code (condition.lua):
    // HpTrigger(limit INDEX, direction INDEX 0 = drops to / 1 = rises to, threshold INDEX); HpCond(direction 1 = ≥ / 0 = <, threshold)
    const P = n => (n ? params[n - 1] : null);
    if (/^HpTrigger|HpTrigger$/.test(fn) && P(cparams[2])) {
      const lim = P(cparams[0]), dir = P(cparams[1]), thr = P(cparams[2]);
      out.other.push(`HP${dir === 1 ? '回到' : '降到'}${thr / 100}%${dir === 1 ? '以上' : '以下'}时${lim > 0 ? `（仅${lim}次）` : ''}`);
    } else if (fn === 'HpCond' && P(cparams[1]) != null) {
      const dir = P(cparams[0]), thr = P(cparams[1]);
      out.other.push(thr >= 9999 && dir === 1 ? '满血' : `HP${thr / 100}%${dir === 1 ? '以上' : '以下'}`);
    } else if (/Hp/.test(fn) && !cdoc?.params?.length) out.hp.push({ name: fn });
    if (/Mp/.test(fn) && !cdoc?.params?.length) out.other.push('MP条件');
    if (/FrameInterval/.test(fn)) out.other.push('定时发动');
    if (/SingleWeapon/.test(fn)) out.gearState.push('只装一件武器');
    if (!cdoc?.params?.length && !/IsCritical|IsBossWave|Hp|Mp|FrameInterval/.test(fn)) out.undecoded.push(`条件 ${fn} 没有参数说明`);
    let noneAny = false;
    (cdoc?.params || []).forEach((name, i) => {
      const dim = dimOf(name); if (!dim) return;
      const idx = i + 1;
      const g = gate.bits.find(b => b.param === idx);
      const viaIndex = (g && (cparams[g.flag - 1] & g.bit) === g.bit) || /INDEX/.test(name) || gate.direct.includes(idx);
      if (viaIndex) { for (const n of nibbles(cparams[i])) if (n) { if (dim === 'element' && params[n - 1] === 0 && gate.noneAny?.has(idx)) noneAny = true; else add(dim, params[n - 1], name); } }
      else if (dim === 'element' && cparams[i] === 0 && g) add(dim, 0, name);
      else add(dim, cparams[i], name);
    });
    // the process's own element parameter (read in step 1 too) is ELEMENT_NONE = any element with an element here
    if (noneAny) { out.elements = out.elements.filter(e => e !== 0); out.anyElement = true; }
  }
  // a race counted on our own side (敵・味方 = TARGET_SIDE_ALLY, e.g. 剑阵: per ally of the 战士 type) is not the target's
  if (out.side === 2 && out.races.length) { out.allyRaces.push(...out.races); out.races = []; }
  return out;
}

// readable tags of one process
export function tagsOf(d, defensive) {
  if (d.missing) return ['（处理缺失）'];
  const pre = defensive ? '受·' : '';
  const t = [];
  const els = [...new Set(d.elements)];
  if (els.length && !(els.length >= 6 && [1, 2, 3, 4, 5, 6].every(e => els.includes(e)))) t.push(...els.map(e => pre + ELEM[e] + '属性'));
  const types = [...new Set(d.skillTypes)];
  const physical = types.includes(9) && types.includes(1);
  if (physical) t.push(pre + '物理');
  for (const x of types) if (!(physical && (x === 9 || x === 1))) t.push(pre + SKILL[x]);
  for (const r of new Set(d.roles)) if (r !== 1) t.push(`${ROLE[r]}技能`);
  for (const e of new Set(d.equips)) t.push(`装备${EQUIP[e]}`);
  for (const r of new Set(d.races)) t.push(defensive ? `受·${RACE[r]}` : `对${RACE[r]}`);
  for (const r of new Set(d.allyRaces || [])) t.push(`我方${RACE[r]}类型`);
  for (const r of new Set(d.notRaces)) t.push(`不对${RACE[r]}`);
  for (const r of new Set(d.ownRaces)) t.push(`自身是${RACE[r]}`);
  for (const r of new Set(d.addRaces)) t.push(`追加${RACE[r]}类型`);
  for (const e of new Set(d.canEquip)) t.push(`可装备${EQUIP[e]}`);
  for (const e of new Set(d.enemy)) t.push(defensive ? `受·${ENEMY[e]}` : `对${ENEMY[e]}`);
  for (const g of new Set(d.gender)) t.push(GENDER[g]);
  for (const a of new Set(d.ailments)) t.push(`异常:${AILMENT[a]}`);
  for (const e of new Set(d.aboutElements)) t.push(`${pre}${ELEM[e]}属性`);
  for (const w of new Set(d.weaponElement)) t.push(`武器属性:${w}`);
  const hpv = d.hp.filter(h => h.value != null && h.value >= 100).map(h => h.value), dir = d.hp.find(h => h.dir != null)?.dir;
  // a bare HP condition only from an HP condition function without documented parameters (a direction alone is not one)
  if (hpv.length || d.hp.some(h => h.value == null && !('dir' in h) && /Hp/.test(h.name || ''))) {
    const v = Math.max(0, ...hpv);
    t.push(v >= 9999 ? '满血' : v > 0 && v <= 3000 && dir !== 1 ? `HP${v / 100}%以下` : v > 0 ? `HP${v / 100}%${dir === 1 ? '以上' : dir === 0 ? '以下' : ''}` : 'HP条件');
  }
  if (d.hpScale && d.hpScale.min != null && d.hpScale.max != null) t.push(d.hpScale.min > d.hpScale.max ? 'HP越低越强' : 'HP越高越强');
  for (const g of new Set(d.gearState)) t.push(g === '只装一件武器' ? g : '装备状况条件');
  for (const o of new Set(d.other)) t.push(o);
  if (d.script) t.push('特殊计数条件');
  let out = [...new Set(t)];
  if (out.includes('复活时')) out = out.filter(x => x !== '队伍／人数条件');
  return out.some(x => /^HP\d|满血|HP越|HP降到|HP回到/.test(x)) ? out.filter(x => x !== 'HP条件') : out;
}
