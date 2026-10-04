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
