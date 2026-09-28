// DRAFT (2026-09-29, waiting for the user's review): classifies every skill on the game-data skill table from the
// game data — 大类 (what it changes) from each of its processes' kind (ProcessMst.NAME, one skill can have several
// joined by “@” in PassiveSkillMst.PROCESS_INFO) and the game's own effect text; 条件标签 (element, move, weapon,
// race, HP …) from the game's condition data (scripts/skill-conditions.mjs); and whether the damage calculator can
// compute it. Writes
// docs/skill-classes-draft.json. The user reviews it as an Excel and the approved classes replace the table's tabs.
import fs from 'node:fs';
import { zhName } from '../dist/engine/gloss.mjs';
import { decodeProcess, tagsOf } from './skill-conditions.mjs';
const R = p => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const core = R('dist/game-data/engine/core.json');
const P = core.ProcessMst, pc = Object.fromEntries(P.cols.map((c, i) => [c, i]));
const proc = new Map(P.rows.map(r => [r[pc.PROCESS_ID], r]));
const cond = new Map(core.ProcessCondMst.rows.map(r => [r[0], r]));
const B = core.BuffMst, bc = Object.fromEntries(B.cols.map((c, i) => [c, i]));
const game = new Map(R('docs/game-relic-passives.json').map(g => [g.gameId, g]));
const pas = new Map();
for (const f of fs.readdirSync(new URL('../dist/game-data/engine/p/', import.meta.url))) { const t = R('dist/game-data/engine/p/' + f).PassiveSkillMst; if (t) for (const r of t.rows) pas.set(r[0], r); }
const skills = [];
for (const [id, g] of game) {
  const r = pas.get(id);
  const procs = String(r[4]).split('@').map(seg => {
    const [pid, prob, ...params] = seg.split(':');
    const q = proc.get(Number(pid)); if (!q) return { pid: Number(pid), missing: true };
    const obj = Object.fromEntries(P.cols.map((c, i) => [c, q[i]])); const cn = cond.get(q[pc.PROCESS_COND]);
    return { pid: Number(pid), kind: obj.NAME, kindZh: zhName(obj.NAME), trigger: cn ? cn[1] : String(obj.PROCESS_COND), triggerZh: cn ? zhName(cn[1]) : '', condParam: obj.PROCESS_COND_PARAM, ope: obj.OPE_INFO, script: obj.USE_SCRIPT, prob: Number(prob), params: params.join(':') };
  });
  skills.push({ id, name: g.nameS, sc: g.sc, effect: g.effectS, procs });
}

const RULES = [
  ['伤害上限', /ダメージ上限/],
  ['Break值', /VITダメージ|ガードブレイク/],
  ['回复', /回復時.*変換|回復量/],
  ['特攻', /キラー|スレイヤー/],
  ['暴击', /クリティカル/],
  ['魔法·咏唱', /詠唱|消費MP|魔転相/],
  ['造成伤害', /与ダメージ|追加ダメージ|DOTダメージ|貫通/],
  ['受到伤害', /被ダメージ|ダメージ軽減|バリア|ガード|被命中|ダメージカット|無効/],
  ['异常', /異常|気絶|ブレイク回復|状態回復/],
  ['基础属性', /STR|INT|DEF|MND|HP増減|最大HP|最大MP|パラメータ|全ステ|属性耐性/],
  ['特技充能·必杀', /SCT|AP|ストック|チャージ/],
  ['回复', /回復|リジェネ|吸収|ドレイン|蘇生|復活/],
  ['移动与行动', /移動速度|狙われ|距離|スーパーアーマー|ノックバック|怯/],
  ['装备·种族', /装備可否|キャラタイプ追加|武器パラメータ/],
  ['金钱·经验', /お金|経験値|ドロップ/],
  ['待确认（脚本数值）', /汎用数値情報付与|汎用情報付与/],
];
const TEXT = [
  ['伤害上限', /伤害上限/],
  ['特攻', /特攻|剋星|克星|斩灭|爆裂者|凝视者/],
  ['暴击', /暴击/],
  ['魔法·咏唱', /咏唱|消耗.{0,4}法力|法力消耗|MP消耗/],
  ['造成伤害', /(攻击|魔法|特技|超必杀技?|反击|普通攻击|属性)(的)?伤害\s*[+＋]|(?<!受(到的?)?|受到敌人的|来自敌人的)伤害\s*[+＋]|伤害越(高|大)|伤害提升|追加伤害|无视.{0,4}防御|防御.{0,2}贯通/],
  ['受到伤害', /受(到的?)?伤害\s*[-－]|受伤害\s*[-－]|减伤|格挡|屏障|护盾|壁/],
  ['异常', /异常|毒|麻痹|沉默|暗黑|诅咒|眩晕|冻结|睡眠|即死/],
  ['基础属性', /(体力|法力|攻击力?|防御力?|魔力|精神|全属性|全能力|HP|MP)\s*[+＋-]|属性耐性|(攻击|防御|魔力|精神)(、|・|･)(攻击|防御|魔力|精神)/],
  ['特技充能·必杀', /充能|超必杀技槽|特技次数|特技的?使用次数/],
  ['Break值', /破防值|眩晕值|不容易发生眩晕/],
  ['回复', /恢复.{0,3}体力|体力.{0,3}恢复|复活|吸收|再生|自愈/],
  ['移动与行动', /移动速度|目标的程度|仇恨|不会被打断|击退|距离/],
];
const DAMAGE = new Set(['伤害上限', '特攻', '暴击', '造成伤害']);
// base stats that change damage: attack / magic (process kinds, or the text naming them with a number)
const DMG_STAT_KIND = /STR増減|INT増減|全ステ|パラメータ増減|STR変換?(?!.*回復)/;
const DMG_STAT_TEXT = /(攻击力?|魔力|法强|全属性|全能力)\s*[+＋]|攻击[、・･](防御|魔力)|大型?鼓舞|大型?增魔|鼓舞|增魔/;
// conditions that need a switch or are not simulated by the calculator (the target is always a boss and the battle
// start is simulated, so BOSS / 开局 need nothing; element / move / weapon / race are checked by the game scripts)
const SWITCHED = /^HP|满血|Break|队伍|现实时间|击杀时|致命伤害|定时发动|移动中|咏唱中|空中|连击数|距离|特殊计数|MP条件|需要装备特定技能|援护|超必杀槽|连续发动|增益／减益|朝向|以太|受击次数|特技次数|第几击|种类数|属性比较|角色类别|目标属性耐性|敌人类型条件|战斗结束时|受到致命/;
// a process only defends when it changes the damage the character takes (or its resistances)
const DEFENSIVE = p => /被ダメージ|被命中|被弾|ガード|バリア|耐性/.test(p.kind) || /被ダメージ|を受けた/.test(p.trigger);
const out = [];
for (const s of skills) {
  const cats = new Map(); // category → reasons
  for (const p of s.procs) { const c = RULES.find(([, re]) => re.test(p.kind))?.[0] || '其他'; if (!cats.has(c)) cats.set(c, new Set()); cats.get(c).add('效果种类'); }
  for (const [c, re] of TEXT) if (re.test(s.effect)) { if (!cats.has(c)) cats.set(c, new Set()); cats.get(c).add('说明文字'); }
  // a vague kind (generic script value / other) is dropped when the text or another kind says what it is
  const concrete = [...cats.keys()].filter(c => c !== '待确认（脚本数值）' && c !== '其他');
  if (concrete.length) { cats.delete('待确认（脚本数值）'); cats.delete('其他'); }
  const text = s.effect;
  // 条件标签 from the game's condition data (scripts/skill-conditions.mjs), not from the description
  const conds = s.procs.map(p => { const d = decodeProcess(p.pid, p.params); return { kind: p.kind, defensive: DEFENSIVE(p), d, tags: tagsOf(d, DEFENSIVE(p)) }; });
  const tags = [...new Set(conds.flatMap(c => c.tags))];
  const undecoded = [...new Set(conds.flatMap(c => c.d.undecoded || []))];
  const conditional = tags.some(t => SWITCHED.test(t));
  const dmg = [...cats.keys()].some(c => DAMAGE.has(c)) || (cats.has('基础属性') && (s.procs.some(p => DMG_STAT_KIND.test(p.kind) && !/回復/.test(p.kind)) || DMG_STAT_TEXT.test(text)));
  const calc = cats.has('待确认（脚本数值）') || cats.has('其他') || undecoded.length ? '待确认' : dmg ? (conditional ? '看条件' : '能算') : '不影响每段伤害';
  // the decoded conditions per process, for the 配装's “只看本招式吃得到的” filter later
  const conditions = conds.map(({ kind, defensive, d }) => ({ kind, defensive, ...Object.fromEntries(Object.entries(d).filter(([k, v]) => Array.isArray(v) ? v.length : v).map(([k, v]) => [k, Array.isArray(v) && typeof v[0] !== 'object' ? [...new Set(v)] : v])) }));
  out.push({ ...s, cats: [...cats.keys()], reasons: Object.fromEntries([...cats].map(([c, r]) => [c, [...r]])), tags, undecoded, conditions, calc, triggers: [...new Set(s.procs.map(p => p.triggerZh || p.trigger))] });
}
// the user's decisions (docs/skill-classes-user.json) win over the automatic classes
const user = JSON.parse(fs.readFileSync(new URL('../docs/skill-classes-user.json', import.meta.url), 'utf8'));
for (const s of out) {
  const u = user.skills[s.id]; if (!u) continue;
  if (u.cats) { s.cats = [...u.cats]; s.reasons = Object.fromEntries(u.cats.map(c => [c, ['用户决定']])); }
  for (const c of u.addCats || []) if (!s.cats.includes(c)) { s.cats.push(c); s.reasons[c] = ['用户决定']; }
  if (u.calc) s.calc = u.calc;
  if (u.note) s.userNote = u.note;
}
fs.writeFileSync(new URL('../docs/skill-classes-draft.json', import.meta.url), JSON.stringify({ note: '技能分类初稿（自动）：每个技能的大类（效果种类＋游戏效果说明）、条件标签、计算器能否算；等用户核对后替换技能表分页', categories: user.categories, skills: out.map(s => ({ id: s.id, name: s.name, cats: s.cats, tags: s.tags, calc: s.calc, reasons: s.reasons, ...(s.undecoded.length ? { undecoded: s.undecoded } : {}), conditions: s.conditions, ...(s.userNote ? { userNote: s.userNote } : {}), kinds: s.procs.map(p => p.kind), triggers: s.triggers })) }) + '\n');
const count = new Map(); for (const s of out) for (const c of s.cats) count.set(c, (count.get(c) || 0) + 1);
console.log([...count].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(' · '));
const calc = new Map(); for (const s of out) calc.set(s.calc, (calc.get(s.calc) || 0) + 1); console.log([...calc].map(([c, n]) => `${c} ${n}`).join(' · '));
console.log('multi-category', out.filter(s => s.cats.length > 1).length, 'no conditions', out.filter(s => !s.tags.length).length, 'undecoded', out.filter(s => s.undecoded.length).length);
