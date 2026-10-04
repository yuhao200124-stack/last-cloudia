// 命令行里用网站的伤害计算器：给“PvE 角色介绍与配装”聊天用。
// 它不另写一套算法，而是在无界面浏览器里打开网站自己的配装页（index.html?character=…，里面嵌着 damage-calculator.html），
// 把招式、专武、所选圣物技能、Boss、开关填进去，等游戏脚本引擎算完，把页面上的结果读出来。所以数字和用户在网站上看到的完全一样。
//
//   node scripts/pve-calc.mjs <角色名或编号> [选项]
//     --list                 只列出这个角色能选的招式、专武、开关、Boss 预设，不计算
//     --move <特技3|超必杀|普攻|招式名的一部分|招式编号>     默认：页面的默认招式（第一个特技）
//     --gear <both|none|专武名的一部分|装备编号>             专武；默认 both（全带）
//     --skills <编号,编号,…>   额外从圣物学的技能（pve-skills.mjs 查编号）。角色自己的个性／固有／超越／盘上技能／加护一律自动算上
//     --each <编号,编号,…>     在 --skills 的基础上，把这些技能一个一个加进去各算一次，列出每个带来多少（用来比较候选技能）
//     --hits <n>              这个招式打几段（用户实测；默认 10）
//     --on <开关,…> --off <开关,…>   开关名见 --list（如 fullHp 满血、lowHp 濒死、enemyAilment 敌方异常、break、specialAttack 特攻、dualWield 双刀）
//     --boss <bird|beast|custom>  计算器的目标预设；custom 时用 --def <n> --mnd <n>
//     --monster <怪物编号>     改用游戏怪物表里的 Boss（--monsters <名字的一部分> 查编号）
//     --detail                再输出“触发效果／每段明细”和“面板与加成核对”全文
//     --json                  用 JSON 输出
// 没有角色页的角色也能算：脚本在本地把它临时登记成网站角色（编号用 unitDressId），按游戏数据的最大成长计算（没有和 Altema 核对过）。
// 需要 playwright（这类环境一般已全局装好；没有就 npm i -g playwright）和它的 Chromium。
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const json = p => JSON.parse(fs.readFileSync(path.join(dist, p), 'utf8'));
const fail = m => { console.error(m); process.exit(1); };
const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(`--${name}`); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = name => { const i = args.indexOf(`--${name}`); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
const ids = v => String(v || '').split(/[,，\s]+/).filter(Boolean).map(Number).filter(Number.isFinite);

// ---- 怪物表查找（不用开浏览器）----
const monsterQuery = opt('monsters');
if (monsterQuery !== undefined) {
  const t = json('game-data/engine/monsters.json').MonsterMst, col = n => t.cols.indexOf(n);
  const rows = t.rows.filter(r => String(r[col('NAME')]).includes(monsterQuery) || String(r[col('MONSTER_ID')]) === monsterQuery);
  console.log(`找到 ${rows.length} 个（名字是游戏原文，可能是繁体）`);
  for (const r of rows.slice(0, 80)) console.log(`${r[col('MONSTER_ID')]}  ${r[col('NAME')]}  Lv${r[col('LV')]}  HP ${r[col('HP')]}  防御 ${r[col('DEF')]}  魔抗 ${r[col('MDEF')]}`);
  process.exit(0);
}

const o = { list: flag('list'), detail: flag('detail'), json: flag('json'), move: opt('move'), gear: opt('gear') ?? 'both', skills: ids(opt('skills')), each: ids(opt('each')), hits: Number(opt('hits')) || null,
  on: String(opt('on') || '').split(/[,，\s]+/).filter(Boolean), off: String(opt('off') || '').split(/[,，\s]+/).filter(Boolean), boss: opt('boss'), def: opt('def'), mnd: opt('mnd'), monster: Number(opt('monster')) || null };
const query = args.find(a => !a.startsWith('--'));
if (!query) fail('用法：node scripts/pve-calc.mjs <角色名或编号> [--list] [--move …] [--gear both|none|…] [--skills 编号,…] [--each 编号,…] [--hits n] [--on 开关,…] [--off 开关,…] [--boss bird|beast|custom --def n --mnd n] [--monster 编号] [--detail] [--json]');

// ---- 角色 ----
const index = json('game-data/index.json');
const found = index.characters.filter(c => String(c.u) === query || `${c.d}${c.n}`.includes(query) || c.n.includes(query));
if (!found.length) fail(`游戏数据里没有“${query}”。`);
if (found.length > 1 && !found.some(c => String(c.u) === query)) { console.log(`有 ${found.length} 个匹配，请用编号再算：`); for (const c of found) console.log(`  ${c.u}  ${c.d}${c.n}`); process.exit(0); }
const who = found.find(c => String(c.u) === query) || found[0], dress = who.u;
const game = json(`game-data/c/${dress}.json`);
const siteEntry = Object.entries(index.site || {}).find(([, u]) => u === dress);
const siteId = siteEntry ? siteEntry[0] : String(dress), temporary = !siteEntry;

// ---- 招式、专武（和页面同一套规则；编号最后由页面的下拉框核对）----
const moves = [];
const addMove = (group, x, label) => { if (x && x.parts?.some(p => p.coef != null)) moves.push({ group, label: label || x.nameS, id: x.id, name: x.nameS }); };
(game.normal || []).forEach((x, i, all) => addMove('普通攻击', x, all.length > 1 ? `普通攻击${i + 1}` : '普通攻击'));
(game.specials || []).forEach((x, i) => addMove('特技', x, `特技${i + 1} · ${x.nameS}`));
addMove('超必杀', game.ultimate, game.ultimate ? `超必杀 · ${game.ultimate.nameS}` : '');
(game.form2 || []).forEach((x, i) => addMove('形态2', x, i < 3 ? `形态2 特技${i + 1} · ${x.nameS}` : `形态2 超必杀 · ${x.nameS}`));
(game.magic?.normal || []).forEach(x => addMove('魔法', x)); (game.magic?.heavy || []).forEach(x => addMove('重魔法', x));
let move = null;
if (o.move) {
  const q = o.move.replace('普攻', '普通攻击');
  move = moves.find(m => String(m.id) === q) || moves.find(m => m.label.replace(/\s/g, '').startsWith(q.replace(/\s/g, ''))) || moves.find(m => m.label.includes(q)) || (q === '超必杀' ? moves.find(m => m.group === '超必杀') : null);
  if (!move) fail(`这个角色没有招式“${o.move}”。可选：${moves.map(m => `${m.label}（${m.id}）`).join('、')}`);
}

const SWITCHES = { dualWield: '双刀', specialAttack: '特攻', break: 'Break', boss: 'BOSS', fullHp: '满血', lowHp: '濒死', mpLow: 'MP≤20', enemyAilment: '敌方异常', openingBuffActive: '开局BUFF', conditionBuffActive: '条件BUFF', reviveBuffActive: '复活后', guardBuffActive: '自身格挡', selfStateActive: '自身状态', partyConditionActive: '队伍' };
for (const k of [...o.on, ...o.off]) if (!SWITCHES[k]) fail(`没有开关“${k}”。可选：${Object.entries(SWITCHES).map(([k, v]) => `${k}（${v}）`).join('、')}`);

// ---- 本地静态服务（只读 dist）----
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.lua': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.join(dist, rel);
  if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
  if (temporary && rel === 'game-data/index.json') { // 没有角色页的角色：只在这次运行里临时登记
    const body = JSON.stringify({ ...index, site: { ...index.site, [siteId]: dress } });
    res.writeHead(200, { 'content-type': TYPES['.json'] }).end(body); return;
  }
  fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(buf); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { server.close(); fail('找不到 playwright。先运行：npm i -g playwright（并确保有 Chromium：环境里通常在 /opt/pw-browsers，或 npx playwright install chromium）'); }
const exe = ['/opt/pw-browsers/chromium', process.env.PVE_CHROMIUM].filter(Boolean).find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } });
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

// 一次计算：全新的浏览器存储 → 填好状态 → 打开配装页 → 等结果
async function compute(selected, { list = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); // 头像等外部图片不需要
  const switches = Object.fromEntries([...o.on.map(k => [k, true]), ...o.off.map(k => [k, false])]);
  const seed = { siteId, dress, calc: { switches, specialWeapon: 'none', move: move?.id ?? null, hits: move && o.hits ? { [move.id]: o.hits } : {}, dual: {}, ark: {} }, build: { on: true, selected, breaks: [7, 12, 20] }, monster: o.monster };
  await context.addInitScript(s => {
    if (sessionStorage.getItem('pve-calc-seeded')) return; sessionStorage.setItem('pve-calc-seeded', '1');
    localStorage.setItem(`lc-calculator:${s.siteId}:v2`, JSON.stringify(s.calc));
    localStorage.setItem(`lc-engine-build:${s.dress}`, JSON.stringify(s.build));
    if (s.monster) localStorage.setItem(`lc-engine-target-monster:${s.siteId}`, String(s.monster));
  }, seed);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(`${base}/index.html?character=${siteId}`, { waitUntil: 'load' });
  let frame = null;
  for (let i = 0; i < 100 && !frame; i++) { frame = page.frames().find(f => /damage-calculator\.html/.test(f.url())); if (!frame) await page.waitForTimeout(200); }
  if (!frame) { await context.close(); throw new Error('配装页里没有出现计算器'); }
  await frame.waitForFunction(() => document.querySelector('#preset option[value="0"]') && document.querySelector('#specialWeapon option'), null, { timeout: 60000 });
  const settle = async () => { // 等到“游戏脚本 · 时间”并且结果不再变
    let last = '', same = 0;
    for (let i = 0; i < 150; i++) {
      const now = await frame.evaluate(() => `${document.getElementById('ep-state')?.textContent}|${document.getElementById('ep-total')?.textContent}|${document.getElementById('ep-normal')?.textContent}|${document.getElementById('engineBuildStatus')?.textContent}`);
      if (/^游戏脚本 ·/.test(now) && now === last) { if (++same >= 2) return; } else same = 0;
      last = now; await page.waitForTimeout(500);
    }
    throw new Error('等了 75 秒计算器还没算完');
  };
  // 专武、Boss、命中段数：按页面自己的控件设置（和用户手点一样）
  const options = await frame.evaluate(() => ({ gear: [...document.getElementById('specialWeapon').options].map(x => ({ value: x.value, label: x.textContent.trim() })), moves: [...document.getElementById('preset').options].map(x => x.textContent.trim()), boss: [...document.getElementById('bossPreset').options].map(x => ({ value: x.value, label: x.textContent.trim() })) }));
  if (list) { await context.close(); return { options }; }
  let gearValue = 'none';
  if (o.gear !== 'none') {
    const g = options.gear.find(x => x.value === o.gear) || options.gear.find(x => x.value === `eq-${o.gear}`) || (o.gear === 'both' ? (options.gear.find(x => x.value === 'both') || options.gear.filter(x => x.value !== 'none').pop()) : options.gear.find(x => x.label.includes(o.gear)));
    if (!g && o.gear !== 'both') { await context.close(); throw new Error(`没有专武“${o.gear}”。可选：${options.gear.map(x => `${x.label}（${x.value}）`).join('、')}`); }
    gearValue = g?.value || 'none';
  }
  await frame.evaluate(({ gearValue, boss, def, mnd, hits }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (!e || v == null) return; e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    set('specialWeapon', gearValue);
    if (boss) set('bossPreset', boss);
    if (def != null) set('bossDefense', def); if (mnd != null) set('bossMind', mnd);
    if (hits) set('hits', hits);
  }, { gearValue, boss: o.boss, def: o.def, mnd: o.mnd, hits: o.hits });
  await page.waitForTimeout(600);
  await settle();
  const r = await frame.evaluate(detail => {
    const t = id => document.getElementById(id)?.textContent.replace(/\s+/g, ' ').trim() ?? null, v = id => document.getElementById(id)?.value ?? null;
    const steps = id => [...(document.getElementById(id)?.querySelectorAll('li') || [])].map(li => li.textContent.replace(/\s+/g, ' ').trim());
    const sel = id => { const e = document.getElementById(id); return e?.selectedOptions[0]?.textContent.trim() ?? null; };
    const on = [...document.querySelectorAll('input[type=checkbox][id]')].filter(e => e.checked && /^(dualWield|specialAttack|break|boss|fullHp|lowHp|mpLow|enemyAilment|openingBuffActive|conditionBuffActive|reviveBuffActive|guardBuffActive|selfStateActive|partyConditionActive)$/.test(e.id)).map(e => e.id);
    return { move: sel('preset'), gear: sel('specialWeapon'), boss: document.getElementById('engineMonsterNote')?.textContent.includes('未选择') ? sel('bossPreset') : t('engineMonsterNote'), bossIdentity: t('bossIdentity'), bossDef: v('bossDefense'), bossMnd: v('bossMind'), switchesOn: on, hits: v('hits'),
      perHit: t('ep-normal'), perHitCrit: t('ep-critical'), cap: t('ep-normalCap'), critCap: t('ep-critCap'), total: t('ep-total'), totalNote: t('ep-totalNote'), totalNoCrit: t('ep-normalTotal'), killer: t('ep-killer'), weak: t('ep-weak'), note: t('ep-note'),
      attackLabel: t('attackLabel'), attack: v('attack'), attackSteps: steps('attackBreakdownSteps'), critRate: v('critRate'), critSteps: steps('critBreakdownSteps'), capSteps: steps('damageCapBreakdownSteps'),
      build: t('engineBuildStatus'), support: t('engineSupportMagic'), switchGains: document.getElementById('engineSwitchGains')?.innerText.replace(/\n{2,}/g, '\n').trim() || null,
      detail: detail ? { effects: document.getElementById('engineResult')?.innerText ?? null, review: document.getElementById('reviewBody')?.innerText ?? null } : undefined };
  }, o.detail);
  r.errors = errors;
  await context.close();
  return r;
}

const num = s => Number(String(s ?? '').replace(/[^\d.]/g, '')) || 0;
const names = (() => { const w = {}; new Function('window', fs.readFileSync(path.join(dist, 'game-skill-data.js'), 'utf8'))(w); return new Map(Object.values(w.GAME_SKILL_DATA.skills).map(k => [k.gameId, { name: k.nameS, sc: Number(k.sc) || 0 }])); })();
const label = id => { const k = names.get(id); return k ? `${k.name}（${id}，SC ${k.sc}）` : `编号 ${id}（不在圣物技能表里）`; };

try {
  if (o.list) {
    const { options } = await compute([], { list: true });
    console.log(`# ${game.fullNameS}（unitDressId ${dress}${temporary ? '，没有角色页：按游戏数据最大成长临时计算' : `，网站角色 ${siteId}`}）`);
    console.log(`招式（--move）：${moves.map(m => `${m.label}〔${m.id}〕`).join('、')}`);
    console.log(`专武（--gear）：${options.gear.map(x => `${x.label}〔${x.value}〕`).join('、')}`);
    console.log(`开关（--on／--off）：${Object.entries(SWITCHES).map(([k, v]) => `${k}＝${v}`).join('、')}（默认开：boss、openingBuffActive）`);
    console.log(`目标预设（--boss）：${options.boss.map(x => `${x.label}〔${x.value}〕`).join('、')}；或 --monster <怪物编号>（--monsters <名字> 查）`);
  } else {
    const baseRun = await compute(o.skills);
    const each = [];
    for (const id of o.each) { const r = await compute([...o.skills, id]); each.push({ id, label: label(id), total: r.total, perHit: r.perHit, cap: r.cap, build: r.build, gain: num(baseRun.total) ? num(r.total) / num(baseRun.total) - 1 : null }); }
    if (o.json) console.log(JSON.stringify({ character: game.fullNameS, unitDressId: dress, temporary, skills: o.skills, result: baseRun, each }, null, 1));
    else {
      const r = baseRun;
      console.log(`# ${game.fullNameS} · ${r.move}`);
      if (temporary) console.log('（这个角色没有角色页：按游戏数据的最大成长临时计算，没有和 Altema 核对过）');
      console.log(`专武：${r.gear}　命中段数：${r.hits}　开关：${r.switchesOn.map(k => SWITCHES[k] || k).join('、') || '无'}`);
      console.log(`目标：${r.boss}（${r.bossIdentity}；防御 ${r.bossDef}，魔抗 ${r.bossMnd}）`);
      console.log(`额外圣物技能：${o.skills.length ? o.skills.map(label).join('、') : '无（只有角色自带的）'}`);
      if (r.build) console.log(`配装：${r.build}`);
      console.log('\n## 结果（和网站计算器相同）');
      console.log(`每段（不暴击）：${r.perHit}　每段上限：${r.cap}`);
      console.log(`每段（暴击）：${r.perHitCrit}　暴击上限：${r.critCap}`);
      console.log(`整次期望：${r.total}（${r.totalNote}）`);
      console.log(`整次不暴击：${r.totalNoCrit}`);
      console.log(`特攻：${r.killer}　弱点／耐性：${r.weak}`);
      if (r.note) console.log(`注：${r.note}`);
      console.log(`\n## ${r.attackLabel}：${r.attack}`); for (const s of r.attackSteps) console.log(`- ${s}`);
      console.log(`\n## 最终暴击率：${r.critRate}%`); for (const s of r.critSteps) console.log(`- ${s}`);
      console.log(`\n## 伤害上限`); for (const s of r.capSteps) console.log(`- ${s}`);
      if (r.switchGains) console.log(`\n## 开关\n${r.switchGains}`);
      if (each.length) { console.log('\n## 逐个加入候选技能（在上面配装的基础上各加一个）'); for (const e of each.sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))) console.log(`- ${e.label}：整次期望 ${e.total}（${e.gain == null ? '—' : `${e.gain >= 0 ? '+' : ''}${(e.gain * 100).toFixed(1)}%`}），每段 ${e.perHit}，上限 ${e.cap}`); }
      if (o.detail) { console.log('\n## 触发效果与每段明细\n' + (r.detail?.effects || '')); console.log('\n## 面板与加成核对\n' + (r.detail?.review || '')); }
      if (r.errors.length) console.log(`\n页面报错：${r.errors.join('；')}`);
    }
  }
} catch (err) { console.error(`计算失败：${err.message}`); process.exitCode = 1; }
await browser.close(); server.close();
