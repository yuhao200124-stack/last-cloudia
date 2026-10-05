// 竞技场可行性试验（2026-10-05，PvP 对局分析聊天写；只读，不改网站任何文件）。
// 把一场竞技场对局记录里的八个角色全放进计算器引擎，打开竞技场开关，跑开场，然后：
//   1. 把引擎算出的进场面板和记录里的进场面板逐项对比；
//   2. 让一个我方角色的一个技能打一个对方角色，和记录里的同一下伤害对比。
// 用法：node scripts/pvp-arena-probe.mjs [样本文件] [我方角色名的一部分] [对方角色名的一部分] [技能名的一部分] [entry|calc]
//   entry（默认）= 面板喂记录里的“初始面板”（开场前）；calc = 只凭配装让引擎自己算面板（赛前没有对手面板时的情形）
// 说明见 docs/pvp-arena-calculator-2026-10-05.md。
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const { Battle, K } = await import(ROOT + 'dist/engine/battle.mjs');
const { loadEngineData } = await import(ROOT + 'dist/engine/engine-data.mjs');
const { addAttacker, setupBattle } = await import(ROOT + 'dist/engine/scenario.mjs');
const { personalityFromPieces } = await import(ROOT + 'dist/engine/loadout-adapter.mjs');
const read = async (path, asText) => { const text = fs.readFileSync(ROOT + 'dist/game-data/' + path, 'utf8'); return asText ? text : JSON.parse(text); };
const arks = JSON.parse(fs.readFileSync(ROOT + 'dist/game-data/arks.json', 'utf8')).items;
const [file = ROOT + 'tests/fixtures/pvp/arena-20261005-121337.json', atkName = '朱迪', defName = '琉特', skillName = '地狱', mode = 'entry'] = process.argv.slice(2);
const fx = JSON.parse(fs.readFileSync(file, 'utf8'));
const { master, scripts } = await loadEngineData({ unitDressIds: [...new Set(fx.units.map(u => u.dress))], read });
const battle = new Battle(master, scripts, { probability: 'assume' });
battle.host.setGlobal('isArena', true); // luaCommon.lua: Field:IsPvP() = isArena or isGvG
function specOf(u) {
  const personality = personalityFromPieces(master, u.dress, master.abilityPieces?.get(u.dress) || []);
  const a = arks.find(x => x.id === u.ark.id), st = mode === 'entry' ? u.initialStatus : null;
  return { name: u.name, unitDressId: u.dress, panelGiven: !!st,
    stats: st ? { hp: st.hp, mp: st.mp, str: st.atk, def: st.def, int: st.matk, mnd: st.mdef, crt: st.critical } : undefined,
    elemResist: st ? Object.fromEntries(st.elem.map((v, i) => [i + 1, v])) : undefined,
    level: u.level, limitBreak: u.limitBreak, awake: u.awake, pieces: 'all',
    equips: u.equipment.slice(0, 4).map((e, i) => ({ pos: i + 1, id: e.id })).filter(e => e.id),
    personality, passives: [...u.passives.map(p => ({ id: p.id })), ...personality.map(p => ({ id: p.passive }))],
    crest: u.crest?.id ? { crestId: u.crest.id, traits: (u.crest.slots || []).map(s => s.passiveId).filter(Boolean), maxLevel: true } : null,
    ark: a ? { id: a.id, name: a.name, level: a.level, stats: a.stats, process: a.process } : null }; // 圣物按最高等级（arks.json），没用记录里的等级；加护、装备强化等级也没喂
}
const made = fx.units.map(u => { const x = addAttacker(battle, specOf(u)); if (!u.isMine) { x.side = K.SIDE.OPPONENT; x.isBoss = false; } return x; });
const ai = fx.units.findIndex(u => u.isMine && u.name.includes(atkName)), di = fx.units.findIndex(u => !u.isMine && u.name.includes(defName));
const A = made[ai], D = made[di];
setupBattle(battle, A, D, { party: made.filter(x => x !== A && x !== D) });
const KEYS = [['hp', 96, '体力'], ['atk', 2, '攻击'], ['def', 3, '防御'], ['matk', 4, '魔力'], ['mdef', 5, '精神']];
let same = 0, total = 0;
console.log(`== 进场面板（${mode === 'entry' ? '喂初始面板，看引擎跑完开场后是否等于记录的进场面板' : '只凭配装算'}）`);
fx.units.forEach((u, i) => {
  const cells = KEYS.map(([k, code, zh]) => { const v = Math.round(battle.finalStat(made[i], code)), r = u.finalStatusAtEntry[k]; total++; if (v === r) same++; return v === r ? `${zh} ${v} ✓` : `${zh} 算 ${v}／记录 ${r}（${(v / r * 100).toFixed(0)}%）`; });
  console.log((u.isMine ? '我方' : '对方') + u.name, '|', cells.join('  '));
});
console.log(`完全一致 ${same}／${total}`);
const sk = fx.units[ai].skills.find(s => s.name.includes(skillName)), specialIndex = fx.units[ai].skills.filter(s => s.list === 2).indexOf(sk) + 1;
const bullets = String(master.skill.get(sk.skillId).BULLET_INFO).split(/[-:,]/).map(Number).filter(b => b > 1000);
console.log(`== ${fx.units[ai].name} 的 ${sk.name}（${sk.skillId}，Lv${sk.lv}）打 ${fx.units[di].name}，第一段弹道 ${bullets[0]}`);
for (const critical of [false, true]) {
  const snap = battle.snapshot(), a = battle.unit(A.id), d = battle.unit(D.id);
  battle.beginSkill(a, d, sk.skillId);
  const bl = battle.createBullet(a, d, { skillId: sk.skillId, bulletId: bullets[0], level: sk.lv, critical, random: 0.95 });
  battle.hit(bl);
  for (const r of bl.results) console.log(critical ? '引擎 暴击' : '引擎 普通', `攻击 ${r.attack} 防御 ${r.defense} 耐性 ${r.resist} 特攻 ${r.killer} 系数 ${r.per} → 核心值 ${r.coreDamage}，最终 ${r.damage}（×${(r.damage / r.coreDamage).toFixed(1)}）`);
  battle.restore(snap);
}
for (const h of fx.hits.filter(h => h.attacker === ai && h.target === di && h.specialIndex === specialIndex).slice(0, 8))
  console.log(h.critical ? '记录 暴击' : '记录 普通', `第 ${h.frame} 帧 特攻 ${h.killer} → 核心值 ${h.core}，最终 ${h.damage}（×${(h.damage / h.core).toFixed(1)}）`);
console.log('引擎未实现的原生函数：', [...battle.unsupported.keys()].join('、') || '无');
