// 读 PvP 读取器的一场对局文件夹（PvPLogs/<对局>/：PvPBattle.json + PvPLog.csv），整理成计算器引擎能用的样子。
// 只读文件，不联网。字段含义见 docs/pvp-arena-calculator-2026-10-05.md 和项目文档《PvP读取器状态》。
//   readMatch(dir) → { meta, units[8], hits[], buffs[], warnings[] }
// units：每个角色的配装（记录里游戏自己的出场资料）、panel（开场前面板）、entry（开场后第 15 帧的面板）。
// hits：记录器的每条伤害（source=recorder 才完整；实时队列那一路可能漏，不用）。
import fs from 'node:fs';
import path from 'node:path';

export function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += ch; continue; }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() || [];
  return rows.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const ints = s => String(s ?? '').split(';').filter(x => /^-?\d+$/.test(x)).map(Number);
const STAT = s => s && s.hp > 0 && s.hp < 2000000000 ? { hp: s.hp, mp: s.mp, atk: s.atk, def: s.def, matk: s.matk, mdef: s.mdef, critical: s.critical, elem: (s.elem || []).slice(0, 6), ailment: (s.ailment || []).slice() } : null;

// 弹道的出招格（GenerateBullet 第 7、8 个数；和 PvPActions.csv 的 skillSlot、skillIndex 一致）→ 这个角色的哪个技能
//   0 = 普通攻击；1～3 = 第几个特技；4 = 超必杀（没在记录里见过，按顺序推的）；5 起 = 第几个魔法
export function skillOfSlot(unit, slot, index) {
  const list = n => unit.skills.filter(s => s.list === n);
  if (slot === 0) return list(1)[0] || null;
  if (slot >= 1 && slot <= 3) return list(2)[slot - 1] || null;
  if (slot === 4) return list(5)[0] || null;
  if (slot >= 5) return list(3)[slot - 5] || null;
  return null;
}

export function normalizeUnit(u, index) {
  const lu = u.logUnit || {}, d = u.decoded || {};
  const lv = Object.fromEntries((d.equipmentLevels || []).map(e => [e.slot, e.lv]));
  const crest = u.crest?.id ? u.crest : d.crestFromString?.id ? d.crestFromString : null;
  // 回放：unitStatus 是裸面板，initialStatus 才是开场前面板；实战：initialStatus 读不到，unitStatus 就是开场前面板
  const initial = STAT(u.initialStatus), status = STAT(u.unitStatus);
  return {
    index, uid: lu.uid, isMine: !!u.isMine, partyType: u.partyType, name: u.name, dressName: d.dressName || u.dressName || u.name, dress: lu.dress,
    level: lu.lv, limitBreak: lu.lmtLv, awake: lu.awkLv,
    ark: lu.arkID ? { id: lu.arkID, level: lu.arkLv, skillLevel: lu.arkSklLv, name: d.ark || '' } : null, arkStats: STAT(lu.arkSt) || lu.arkSt || null,
    equipment: (d.equipment || []).filter(e => e.slot <= 4 && e.id).map(e => ({ slot: e.slot, id: e.id, name: e.name, lv: lv[e.slot] ?? null })),
    passives: (d.passives || []).map(p => ({ id: p.id, name: p.name })), magics: (d.magics || []).map(m => ({ id: m.id, name: m.name })),
    blessings: (d.blessings || []).map(b => b.id),
    crest: crest ? { id: crest.id, name: crest.name, traits: (crest.slots || []).filter(s => s.passiveId).map(s => ({ passive: s.passiveId, rank: s.rank, name: s.name })) } : null,
    // 个性：base＝这一条个性 1 级时的编号（游戏脚本按它查个性等级）；记录的 passiveLevels 里有，没有时按编号规律推（末位换成 1）
    personality: (u.personality || []).map(p => ({ id: p.id, level: p.level, name: p.name, base: (u.passiveLevels || []).find(x => x.isPersonality && x.id === p.id)?.baseId ?? Math.floor(p.id / 10) * 10 + 1 })),
    skills: (u.skills || []).map(s => ({ skillId: s.skillId, skillType: s.skillType, lv: s.lv, list: s.list, ruid: s.ruid ?? null, name: s.name })),
    formationId: u.formationId, formationName: u.formationName, formationPos: u.formationPos,
    naked: STAT(lu.nakedSt), panel: initial || status, panelSource: initial ? 'initialStatus' : status ? 'unitStatus' : null, entry: STAT(u.finalStatusAtEntry), entryFrame: u.statusReadFrame ?? null, entryHp: u.entryHp ?? null, entryMp: u.entryMp ?? null,
  };
}

export function readMatch(dir) {
  const warnings = [];
  const text = name => fs.readFileSync(path.join(dir, name), 'utf8');
  const b = JSON.parse(text('PvPBattle.json'));
  const units = (b.units || []).map(normalizeUnit);
  const byUid = new Map(units.map(u => [u.uid, u]));
  const meta = { match: path.basename(dir), reader: b.reader, isArena: !!b.isArena, isPlayback: !!b.isPlayback, battleKind: b.battleKind, myResult: b.myResult, lastFrame: b.lastFrame, pauses: b.pauses || [],
    parties: (b.parties || []).map(p => ({ isMine: !!p.isMine, partyType: p.partyType, formationId: p.formationId, formationName: p.formationName })) };
  const hits = [], buffs = [], dead = [], stats = [], life = [], snapshots = [];
  if (!fs.existsSync(path.join(dir, 'PvPLog.csv'))) { warnings.push('这一场没有 PvPLog.csv（没有伤害记录）'); return { meta, units, hits, buffs, dead, stats, life, snapshots, warnings }; }
  const all = parseCsv(text('PvPLog.csv'));
  const rows = all.filter(r => r.source === 'recorder');
  if (!rows.length) warnings.push('PvPLog.csv 里没有记录器（recorder）那一路的条目');
  const bullets = new Map(), runs = new Map(); let lastHit = null, seq = 0;
  for (const r of rows) {
    const iv = ints(r.intv), frame = Number(r.frame), targ = Number(r.targ_unitId), rel = Number(r.related_unitId); seq++;
    if (r.typeName === 'GenerateBullet' && iv.length >= 8) bullets.set(iv[4], { caster: targ, target: rel, run: iv[0], level: iv[1], slot: iv[6], index: iv[7] });
    // 出招（SkillMain）：targ＝出招的人，intv 第 1 个数＝技能在这个人技能表里的编号（ruid），第 2 个＝这次出招的流水号（伤害条目第 19 个数）
    else if (r.typeName === 'SkillMain') runs.set(iv[1], { seq, frame, caster: targ, target: rel, ruid: iv[0] });
    else if (r.typeName === 'BulletHit') lastHit = { run: iv[0], bullet: iv[1], frame, seq };
    else if (r.typeName === 'UnitStats') { const o = {}; for (let i = 4, n = iv[0]; n > 0 && i + 1 < iv.length; i += 2, n--) o[iv[i]] = iv[i + 1]; stats.push({ frame, unit: targ, head: iv.slice(0, 4), values: o }); } // 能力变化：前三个数是 能力／属性耐性／异常耐性 各有几对，第四个数含义未确认，这里只取能力那几对（0 体力上限 1 法力上限 2 攻击 3 防御 4 魔力 5 精神 8 暴击）
    else if (r.typeName === 'Dead') { dead.push({ frame, unit: targ, by: rel }); life.push({ seq, frame, unit: targ, alive: false }); }
    else if (r.typeName === 'DoResurrect' || r.typeName === 'Respawn') life.push({ seq, frame, unit: targ, alive: true });
    // 增减益：str = c|设置它的效果编号&次序&第几段&来源类别&来源编号；intv 第 4 个数＝持续帧数（-1 永久），第 5 个＝流水号，第 6 个＝增减益编号；effs＝数值
    else if (r.typeName === 'Buff') { const p = (String(r.str).split('|')[1] || '').split('&').map(x => Number(x) || 0); buffs.push({ seq, frame, kind: 'Buff', unit: targ, from: rel, str: r.str, intv: iv, effs: ints(r.effs), uid: iv[4], buffId: iv[5], duration: iv[3], processId: p[0], localIndex: p[2], affiliation: p[3], localId: p[4] }); }
    else if (r.typeName === 'RemoveBuff') buffs.push({ seq, frame, kind: 'RemoveBuff', unit: targ, uid: iv[0], intv: iv, effs: [] });
    else if (r.typeName === 'Damage') {
      const ev = ints(r.extv); if (ev.length < 9) continue;
      const A = byUid.get(rel), T = byUid.get(targ); if (!A || !T) continue;
      const g = lastHit && lastHit.frame === frame && lastHit.run === iv[18] ? bullets.get(lastHit.bullet) : null;
      const run = runs.get(iv[18]);
      const skill = (run && run.caster === rel && A.skills.find(s => s.ruid != null && s.ruid === run.ruid)) || (g ? skillOfSlot(A, g.slot, g.index) : null);
      const killer = ev[8] >= 10000, o = killer ? 9 : 8;
      // stateSeq：这一下“出手前”的界线——命中条目（BulletHit）那一行；它和伤害条目之间记下的增减益是这一下自己引发的（如“从零开始”）
      hits.push({ seq, stateSeq: g ? lastHit.seq : seq, run: iv[18], castSeq: run && run.caster === rel ? run.seq : null, frame, attacker: rel, target: targ, damage: iv[0], serial: iv[3], critical: !!(iv[19] & 256), hitKind: iv[14], hpRemoved: iv[21], hpLeft: iv[22],
        slot: g ? g.slot : null, slotIndex: g ? g.index : null, skillId: skill?.skillId ?? null, skillName: skill?.name ?? null, skillLv: skill?.lv ?? null, skillType: skill?.skillType ?? null,
        attack: ev[3], defense: ev[4], coef: ev[5] / 10, coefAfter: ev[6] / 10, core: ev[7], killer: killer ? ev[8] / 10000 : 0, element: ev[o], resist: ev[o + 1] / 100 });
    }
  }
  // 快照（每 15 帧一次的体力、法力）：PvPSnapshots.csv
  if (fs.existsSync(path.join(dir, 'PvPSnapshots.csv'))) for (const r of parseCsv(text('PvPSnapshots.csv'))) { const uid = Number(r.uid); if (byUid.has(uid)) snapshots.push({ frame: Number(r.frame), unit: uid, hp: Number(r.hp), mp: Number(r.mp) }); }
  // 同一帧里打在同一个目标上的几下，游戏是按这一帧第一下出手前的状态一起算的（第一下引发的“从零开始”不影响同帧的第二下）
  const first = new Map();
  for (const h of hits) { const k = `${h.frame}:${h.target}`; if (!first.has(k)) first.set(k, h.stateSeq); else h.stateSeq = Math.min(h.stateSeq, first.get(k)); }
  return { meta, units, hits, buffs, dead, stats, life, snapshots, warnings };
}

// 记录里某一下伤害出手前一刻的场上状态：每个角色身上还在的增减益、是否倒下、体力和法力（体力法力取最近一次快照；
// 这一下的目标用伤害条目自己带的“剩余体力＋扣掉的体力”）。
export function stateBefore(match, hit) {
  const out = new Map(match.units.map(u => [u.uid, { buffs: new Map(), alive: true, hp: null, mp: null }]));
  // 出手的人在“出招那一刻到这一下之间”被去掉的增减益（如“特技伤害提升【次数限制】”出招时被用掉）仍算在身上：
  // 引擎是从出招重新算起的，要的是出招前的样子
  for (const b of match.buffs) {
    if (b.seq >= hit.stateSeq) break; const s = out.get(b.unit); if (!s) continue;
    if (b.kind === 'Buff') s.buffs.set(b.uid, b);
    else if (!(b.unit === hit.attacker && hit.castSeq != null && b.seq > hit.castSeq)) s.buffs.delete(b.uid);
  }
  for (const e of match.life) { if (e.seq >= hit.stateSeq) break; const s = out.get(e.unit); if (s) s.alive = e.alive; }
  for (const sn of match.snapshots) { if (sn.frame > hit.frame) break; const s = out.get(sn.unit); if (s) { s.hp = sn.hp; s.mp = sn.mp; } }
  const t = out.get(hit.target); if (t && hit.hpLeft != null && hit.hpRemoved != null && hit.hpRemoved <= 100000000) t.hp = hit.hpLeft + hit.hpRemoved;
  return out;
}
