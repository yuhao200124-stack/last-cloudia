// scripts/pve-brief.mjs and scripts/pve-skills.mjs: the look-up tools the PvE chat runs on a clone of this repo
// (project doc 《PvE接续文档》). They must keep printing the game's own text first, then the parsed parameters.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const run = (script, ...args) => execFileSync(process.execPath, [fileURLToPath(new URL(`../scripts/${script}`, import.meta.url)), ...args], { encoding: 'utf8' });

test('pve-brief: a character by part of its name, one group, original text before parameters', () => {
  const out = run('pve-brief.mjs', '朱迪', '个性');
  assert.match(out, /^# 魔王朱迪卡萨梅克（unitDressId 101240）/);
  assert.match(out, /### 深渊的魔腕（5 级）（编号 10124015）\n原文：武器仅装备1件时/);
  assert.match(out, /### 魔界的武威（4 级）（编号 10124024）\n原文：[^\n]*雷属性的伤害\+60%[^\n]*\n参数：/);
  assert.doesNotMatch(out, /## 专武/);
});

test('pve-brief: every group in the full brief; several matches are listed instead of guessed', () => {
  const full = run('pve-brief.mjs', '101240');
  for (const h of ['## 个性', '## 专武', '## 固有技能', '## 超越', '## 能力盘上的通用技能', '## 魔法', '## 招式']) assert.ok(full.includes(h), h);
  assert.match(full, /### 神灭枪瓦尔迪斯（枪，雷属性，编号 103072）\n原文：[^\n]+\n满强化属性：攻击 \+375、防御 \+64/);
  assert.match(full, /### 特技 地狱连击（编号 1012405）[\s\S]*?每段：物理 系数 0\.338，技能自带攻击\/魔力 \+78\.5%\n充能（秒）：38/);
  assert.match(run('pve-brief.mjs', '魔王'), /有 \d+ 个匹配，请用编号再查一次/);
});

test('pve-skills: keywords are ANDed, the user sheet filter and the SC limit apply, highest SC first', () => {
  const out = run('pve-skills.mjs', '雷', '伤害上限', '--max-sc', '15');
  assert.match(out, /^找到 \d+ 个（共 942 个圣物技能）/);
  assert.match(out, /### 雷攻击提升III（编号 26468，SC 13）\n原文：雷属性伤害\+30% 雷属性伤害上限\+2000\n[\s\S]*?来源圣物：潘德莫尼姆（UR）/);
  const scs = [...out.matchAll(/，SC (\d+)）/g)].map(m => Number(m[1]));
  assert.ok(scs.length > 1 && scs.every((v, i) => v <= 15 && (i === 0 || v <= scs[i - 1])));
  assert.match(run('pve-skills.mjs', '--sheet', '暴击'), /用户技能表分类：[^\n]*暴击/);
  assert.match(run('pve-skills.mjs', '--id', '100'), /### 体力提升（编号 100，SC 2）\n原文：体力\+5%\n参数：【HP\/MP】倍率=\+5%/);
});

// scripts/pve-calc.mjs drives the site's own 配装 page in headless Chromium, so its numbers are the calculator's.
// Skipped where playwright / Chromium is not installed.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const hasBrowser = (() => { try { createRequire(import.meta.url).resolve('playwright'); return fs.existsSync('/opt/pw-browsers/chromium') || !!process.env.PVE_CHROMIUM; } catch { return false; } })();

test('pve-calc: 朱迪 特技3 with both exclusive gear — the page result, and every step of the documented method', { skip: !hasBrowser && 'playwright / Chromium not installed' }, () => {
  const r = JSON.parse(run('pve-calc.mjs', '朱迪', '--move', '特技3', '--hits', '12', '--json')).result;
  assert.equal(r.move, '特技3 · 地狱连击'); assert.equal(r.gear, '神灭枪瓦尔迪斯＋斗烈铠迪欧鲁克'); assert.equal(r.hits, '12');
  assert.deepEqual(r.switchesOn, ['boss', 'openingBuffActive']);
  assert.equal(r.attack, '20103'); assert.equal(r.critRate, '28'); assert.equal(r.cap, '348,099');
  assert.equal(r.perHit, '135,636 – 150,678'); assert.equal(r.perHitCrit, '236,030 – 262,260'); assert.equal(r.total, '≈ 2,074,225');
  // 《PvE接续文档》 3.2's worked example: base = A × 0.9^(D ÷ A × 10), × 系数 × (1 − 耐性) × 随机, then each “伤害 +x%” in turn, rounded each time
  const A = 20103, D = 4000;
  let d = Math.trunc(A * 0.9 ** (D / A * 10) * 0.338 * 0.5 * 0.95);
  assert.equal(d, 2617);
  for (const x of [60, 80, 30, 40, 30, 50, 30, 30]) d = Math.max(Math.round(d * (1 + x / 100)), 1);
  assert.equal(d, 45204); // … 魔界的武威, 暴威之岚, 雷兆阶驱动, 葬神之魔枪, 雷攻击提升V, 冥霸的绝击, 近身战斗III, 枪精通III (then 加护, 两手枪, 一天真刃, 枪超阶增幅, 专武 → 143,188)
});

test('pve-calc: a character without a page is computed from the game data; --each lists what each candidate skill adds', { skip: !hasBrowser && 'playwright / Chromium not installed' }, () => {
  const kyle = run('pve-calc.mjs', '100010', '--move', '超必杀', '--boss', 'custom', '--def', '2000', '--mnd', '3000');
  assert.match(kyle, /^# 剑士凯尔 · 最后的勇者\n（这个角色没有角色页/); assert.match(kyle, /目标：自定义目标（[^\n]*防御 2000，魔抗 3000）/); assert.match(kyle, /每段（不暴击）：[\d,]+ – [\d,]+/);
  const each = run('pve-calc.mjs', '朱迪', '--move', '特技3', '--gear', 'none', '--each', '26468,600');
  assert.match(each, /专武：未装备/);
  assert.match(each, /- 雷攻击提升III（26468，SC 13）：整次期望 ≈ [\d,]+（\+30\.0%）/);
  assert.match(run('pve-calc.mjs', '朱迪', '--list'), /招式（--move）：普通攻击〔1012401〕、特技1 · 贯穿驱动〔1012403〕/);
});
