// 竞技场入口和对账工具的测试（2026-10-05）。样本：tests/fixtures/pvp/match-20261005-121337/（一场回放的前 150 帧，精简过）。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readMatch, stateBefore, skillOfSlot } from '../scripts/lib/pvp-record.mjs';
import { createArena, loadArenaTables, ARENA_START_MP } from '../dist/engine/arena.mjs';
import { DEFAULT_BLESSINGS } from '../dist/account-blessing-default.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = ROOT + 'tests/fixtures/pvp/match-20261005-121337';
const read = async (p, asText) => { const t = fs.readFileSync(ROOT + 'dist/game-data/' + p, 'utf8'); return asText ? t : JSON.parse(t); };
const match = readMatch(DIR);
const arena = await createArena({ units: match.units, tables: await loadArenaTables(read), read, blessingParams: DEFAULT_BLESSINGS.blessings });
arena.open();
const index = name => match.units.findIndex(u => (u.isMine ? '我' : '敌') + u.dressName === name);

test('对局记录：八个角色、伤害条目的字段和技能都认得出', () => {
  assert.equal(match.units.length, 8);
  assert.ok(match.units.every(u => u.panel && u.entry && u.skills.length));
  const h = match.hits.find(x => x.frame === 72 && x.attacker === 1);
  assert.deepEqual([h.target, h.skillId, h.skillName, h.skillLv, h.critical], [101, 1012405, '地狱连击', 5, false]);
  assert.deepEqual([h.attack, h.defense, h.coef, h.core, h.damage, h.killer, h.element, h.resist], [23337, 8510, 169, 558, 71206, 2.25, 4, 0]);
  assert.ok(match.hits.every(x => x.skillId), '每一下都对得上技能');
  assert.equal(skillOfSlot(match.units[0], 3, 2).skillId, 1012405);
});

test('竞技场开场：进场面板 40 格和记录完全一致', () => {
  const keys = ['hp', 'atk', 'def', 'matk', 'mdef'];
  match.units.forEach((u, i) => { const p = arena.panelOf(i); for (const k of keys) assert.equal(p[k], u.entry[k], `${u.name} ${k}`); });
  assert.equal(ARENA_START_MP, 5000);
});

test('竞技场开场：身上的增减益和记录里出手前的一样（同类只取最强的重复项除外）', () => {
  // 第一次出招之前那一刻（出招会用掉“特技伤害提升【次数限制】”这类增益）
  const firstCast = Math.min(...match.hits.filter(x => x.castSeq != null).map(x => x.castSeq));
  const st = stateBefore(match, { stateSeq: firstCast, frame: 44, attacker: 0, target: 0 });
  for (const u of match.units) {
    const eng = arena.unit(match.units.indexOf(u)).buffs.filter(b => !/PUID|スキル発動毎情報管理|スキル終了時指定UIDバフ削除/.test(b.mst.NAME)).map(b => b.buffId).sort();
    const rec = [...st.get(u.uid).buffs.values()].filter(b => !/PUID|スキル発動毎情報管理|スキル終了時指定UIDバフ削除/.test(arena.master.buff.get(b.buffId)?.NAME || '')).map(b => b.buffId);
    for (const id of new Set(eng)) assert.ok(rec.includes(id), `${u.name}：引擎有 ${id}，记录没有`);
  }
});

test('打一下：我方朱迪 地狱连击 打 对方琉特，攻击、防御、系数、特攻和记录相同，核心值落在随机范围', () => {
  const h = match.hits.find(x => x.frame === 72 && x.attacker === 1);
  const r = arena.strike(index('我朱迪卡萨梅克'), index('敌琉特'), { skillId: h.skillId, level: h.skillLv, critical: false, random: 1 })[0];
  assert.deepEqual([r.attack, r.defense, r.per, r.resist, r.killer, Math.round(r.killerFactor * 100) / 100], [23337, 8510, 169, 0, true, 2.25]);
  assert.ok(h.core / r.coreDamage >= 0.89 && h.core / r.coreDamage <= 1.0);
  // 核心值换成记录的、去掉一条效果，都改得动
  const same = arena.strike(index('我朱迪卡萨梅克'), index('敌琉特'), { skillId: h.skillId, level: h.skillLv, core: h.core })[0];
  const edit = same.edits.find(e => e.uid && e.value !== h.core);
  const less = arena.strike(index('我朱迪卡萨梅克'), index('敌琉特'), { skillId: h.skillId, level: h.skillLv, core: h.core, disable: [edit.uid] })[0];
  assert.equal(less.edits.length, same.edits.length - 1);
});

test('引擎修正：拟态追加的类型算进类型数；神族护罩关掉对神特攻；雷耐性提升是“雷 +20”', () => {
  const sera = arena.unit(index('敌塞拉')), rada = arena.unit(index('我拉达・多尔'));
  assert.ok(arena.battle.charTypesOf(sera).length >= 1);
  assert.equal(arena.battle.elemResist(rada, 4), 80); // 面板 60 + 神秤的观测者 20
  const h = match.hits.find(x => x.attacker === 103 && x.target === 2);
  const r = arena.strike(index('敌朱迪卡萨梅克'), index('我拉达・多尔'), { skillId: h.skillId, level: h.skillLv })[0];
  assert.equal(r.killer, false);
  assert.equal(r.resist, 80);
});

test('对账脚本：能跑完，面板 40／40，输出里带每组的结论', () => {
  const out = JSON.parse(execFileSync('node', [ROOT + 'scripts/pvp-reconcile.mjs', DIR, '--json', '--max-frame', '100'], { encoding: 'utf8' }));
  assert.deepEqual([out.panel.same, out.panel.total], [40, 40]);
  assert.ok(out.groups.length >= 2 && out.groups.every(g => g.verdict));
  assert.equal(out.unsupported.length, 0);
});

test('对阵表：我方取自一场记录、对手取自对手列表，双方每个招式都有数，对手面板凭配装算出来', () => {
  const out = JSON.parse(execFileSync('node', [ROOT + 'scripts/pvp-matchup.mjs', '--opponents', ROOT + 'tests/fixtures/pvp/opponents-sample.json', '--index', '0', '--mine-from', DIR, '--json'], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  assert.equal(out.panels.length, 8);
  assert.deepEqual(out.opponent.units, ['红丸', '爱蜜莉雅', '朱迪卡萨梅克', '塞拉']);
  assert.ok(out.panels.every(p => p.hp > 5000 && p.atk > 0));
  const mine = out.rows.filter(r => r.side === '我方'), theirs = out.rows.filter(r => r.side === '对方');
  assert.ok(mine.length >= 16 && theirs.length >= 16);
  const r = mine.find(x => x.attacker === '朱迪卡萨梅克' && x.skill === '地狱连击' && x.target === '爱蜜莉雅');
  assert.ok(r.perHit[0] > 1000 && r.perHitCritical[0] >= r.perHit[0] && r.cap >= r.perHitCritical[1] && r.hitsPerCast.median >= 1);
  assert.equal(out.unsupported.length, 0);
});

test('自动格挡：琉特格挡时减 50%，被格挡的一下不高于没格挡的一半；记录里的格挡、暴击标记读自 flag 列', () => {
  const g = arena.guardOf(index('敌琉特'));
  assert.equal(g.can, true); assert.equal(g.ratio, 0.5); assert.ok(g.chance > 0.2 && g.chance < 0.6);
  assert.equal(arena.guardOf(index('我朱迪卡萨梅克')).can, false);
  const h = match.hits.find(x => x.frame === 72 && x.attacker === 1);
  const a = arena.strike(index('我朱迪卡萨梅克'), index('敌琉特'), { skillId: h.skillId, level: h.skillLv, core: h.core })[0];
  const b = arena.strike(index('我朱迪卡萨梅克'), index('敌琉特'), { skillId: h.skillId, level: h.skillLv, core: h.core, guarded: true })[0];
  assert.equal(b.guarded, true); assert.ok(b.damage <= a.damage / 2 && b.damage > 0);
  assert.deepEqual([h.critical, h.guarded, h.saveLife, h.killerFlag], [false, false, true, true]);
  assert.equal(match.hits.find(x => x.frame === 72 && x.attacker === 1 && x.damage === 271970).critical, true);
});
