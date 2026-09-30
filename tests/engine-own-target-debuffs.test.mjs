// 敌方异常 counts the attacker's own marks on the enemy (2026-10-01, user: “你再找找其他角色有没有什么遗漏的地方，有的话改正”):
// the characters whose effects read “对<减益>中的敌人” — 出血、斷罪、監獄、目標固定、恐懼、復仇、反叛的意志 — get the mark put on the target by
// their own effect (with its own values) when 敌方异常 is on. Found by scanning all 268 characters (audit of 2026-10-01).
// Still missing, listed so a change is noticed: marks that only a 领域 (field) puts on (魔術理論體系 特雷斯缇欧, 腐蝕 罗格亚),
// 突擊號令 (玛乌娜), GEASS (鲁路修), and the Phantom Thieves' marks put on by a teammate (喪失／反叛的意志 for Morgana, Crow, Violet;
// Joker's 喪失 replaces his own 反叛的意志 in the game, so one of the two is kept).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Battle } from '../dist/engine/battle.mjs';
import { loadEngineData, loadPassives } from '../dist/engine/engine-data.mjs';
import * as M from '../dist/engine/scenario.mjs';

const read = async (path, asText) => { const text = fs.readFileSync(new URL(`../dist/game-data/${path}`, import.meta.url), 'utf8'); return asText ? text : JSON.parse(text); };
const EXPECT = { 100460: [5501], 100642: [5501], 100870: [5501], 100760: [13718], 100941: [13000], 101290: [13781], 500250: [13757], 500831: [13762], 500910: [14900] };

test('敌方异常 puts each character’s own “对<减益>中的敌人” mark on the target', async () => {
  for (const [dress, cats] of Object.entries(EXPECT)) {
    const c = JSON.parse(fs.readFileSync(new URL(`../dist/game-data/c/${dress}.json`, import.meta.url), 'utf8'));
    const pids = [...new Set([...(c.personality || []).map(p => p.passive), ...(c.ownPassives || []).map(p => p.passive), ...(c.transcend || []).map(p => p.passive)].filter(Boolean))];
    const d = await loadEngineData({ unitDressIds: [Number(dress)], read }); await loadPassives(d.master, pids, read);
    const battle = new Battle(d.master, d.scripts, { probability: 'skip' });
    const A = M.addAttacker(battle, { unitDressId: Number(dress), panelGiven: false, passives: pids.map(id => ({ id })), personality: c.personality || [], equips: M.exclusiveEquipment(d.master, Number(dress)), ownGear: true });
    const T = M.addTarget(battle, { name: 'boss', isBoss: true, charTypes: [2010], stats: { hp: 38500000, mp: 100, def: 4000, mnd: 10000, str: 4000, int: 3000 }, elemResist: {} });
    M.setupBattle(battle, A, T, { hpPercent: 100, targetAilment: true });
    for (const cat of cats) assert.ok(T.buffs.some(b => b.category === cat), `${c.nameS} (${dress}): category ${cat} on the target`);
  }
});
