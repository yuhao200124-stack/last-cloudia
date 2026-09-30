// Adds a character to the site from the game database:
//   node scripts/new-character.mjs <altemaId> --lv1 HP,MP,STR,DEF,INT,MND --max HP,MP,STR,DEF,INT,MND [--checked 2026-09-28] [--unit <unitDressId>]
//
// <altemaId> is the character's number on Altema (https://altema.jp/lastcloudia/chara/<altemaId>),
// which is also the site's character number. --lv1 and --max are the Lv1 column and the 合計 row of
// that page's stat table. The script
//   1. finds the unitDressId whose Lv1 stats in the game data equal --lv1 (--unit only when two
//      characters share them), and records the character in docs/site-characters.json;
//   2. adds it to dist/game-data/index.json (site), so the damage calculator uses its game data;
//   3. writes dist/character-<altemaId>.html from the game data (scripts/character-page-builder.mjs);
//   4. adds its card to dist/characters.html.
// Running it again for the same character updates everything in place. Pages made by hand before
// this script ("generated": false) are never overwritten.
import fs from 'node:fs';
import {buildCharacterPage,characterCard,serializeRegistry} from './character-page-builder.mjs';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const write=(p,t)=>fs.writeFileSync(new URL(p,root),t);
const fail=message=>{console.error(message);process.exit(1);};

const args=process.argv.slice(2),opt=name=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:undefined;};
const siteId=args[0];
if(!/^\d+$/.test(siteId||''))fail('用法：node scripts/new-character.mjs <Altema角色编号> --lv1 HP,MP,STR,DEF,INT,MND --max HP,MP,STR,DEF,INT,MND [--checked 日期] [--unit unitDressId]');
const six=(name,value)=>{const v=String(value||'').split(/[,，\s]+/).filter(Boolean).map(Number);if(v.length!==6||!v.every(Number.isFinite))fail(`--${name} 需要 6 个数字（HP,MP,STR,DEF,INT,MND）`);return v;};
const lv1=six('lv1',opt('lv1')),max=six('max',opt('max'));
const checked=opt('checked')||new Date().toISOString().slice(0,10);

const registry=JSON.parse(read('docs/site-characters.json'));
const previous=registry.characters[siteId];
if(previous&&!previous.generated)fail(`character-${siteId} 是早先手工整理的页面，不用此脚本覆盖。`);

// 1. unitDressId by Lv1 stats
const candidates=[];
for(const file of fs.readdirSync(new URL('dist/game-data/c/',root))){
 const game=JSON.parse(read(`dist/game-data/c/${file}`));
 const base=String(game.parameters||'').split(',').filter(Boolean).map(x=>Number(x.split('-')[0]));
 if(base.join(',')===lv1.join(','))candidates.push(game);
}
const forced=opt('unit');
const matches=forced?candidates.filter(g=>String(g.unitDressId)===String(forced)):candidates;
if(!matches.length)fail(candidates.length?`--unit ${forced} 的 Lv1 属性与 --lv1 不符。`:`游戏数据里没有 Lv1 属性为 ${lv1.join('/')} 的角色：可能是游戏数据导出之后才出的新角色，需要先用读取器重新读取并导出游戏数据。`);
if(matches.length>1)fail(`有 ${matches.length} 个角色的 Lv1 属性相同，请用 --unit 指定：\n${matches.map(g=>`  ${g.unitDressId} ${g.fullNameS}（${g.dressS}）`).join('\n')}`);
const game=matches[0];
const taken=Object.entries(registry.characters).find(([id,c])=>id!==siteId&&c.unitDressId===game.unitDressId);
if(taken)fail(`${game.fullNameS}（${game.unitDressId}）已经是网站角色 ${taken[0]}。`);

const keys=['hp','mp','attack','defense','intelligence','mind'];
const entry={unitDressId:game.unitDressId,name:game.fullNameS,generated:true,lv1,maxStats:Object.fromEntries(keys.map((k,i)=>[k,max[i]])),statsChecked:`Altema ${checked}`};

// 3. the page (built before anything is written, so a problem leaves no half-added character)
const relics=JSON.parse(read('dist/game-data/relics.json'));
const problems=[],notices=[];
const html=buildCharacterPage(siteId,entry,game,relics,problems,notices);
if(problems.length)fail(problems.join('\n'));

// 1–2. registry and the game-data index
registry.characters[siteId]=entry;
write('docs/site-characters.json',serializeRegistry(registry));
// Only the "site" map is rewritten (the rest keeps publish.py's byte layout; e.g. magicAlias key order).
const indexText=read('dist/game-data/index.json'),site={...JSON.parse(indexText).site,[siteId]:game.unitDressId};
const siteStats={...(JSON.parse(indexText).siteStats||{}),[siteId]:registry.characters[siteId]?.maxStats};
write('dist/game-data/index.json',indexText.replace(/"site":\{[^}]*\}/,`"site":${JSON.stringify(site)}`).replace(/"siteStats":\{(?:[^{}]|\{[^{}]*\})*\}/,`"siteStats":${JSON.stringify(siteStats)}`));
write(`dist/character-${siteId}.html`,html);

// 4. character list card and loadout entry
const version=`${checked.replaceAll('-','')}-c${siteId}`;
let list=read('dist/characters.html');
const card=characterCard(siteId,game,version);
const existing=new RegExp(`<a class="character-card" href="\\./character-${siteId}\\.html[^"]*"[\\s\\S]*?</a>`);
if(existing.test(list))list=list.replace(existing,card);
else{
 const end=list.indexOf('</div>\n      </section>',list.indexOf('<div class="character-grid">'));
 if(end<0)fail('characters.html 里找不到角色列表的结尾');
 list=`${list.slice(0,end)}${card}\n        ${list.slice(end)}`;
}
write('dist/characters.html',list);

// 5. the calculator's 专武 selector (dist/character-gear.mjs): every exclusive item at its top tier, weapons first
const tops=new Map();
for(const e of game.exclusiveEquipment){if(e.type==='外观'&&!e.passives?.length)continue;const k=e.serial??e.id,b=tops.get(k);if(!b||(e.rare??0)>(b.rare??0)||((e.rare??0)===(b.rare??0)&&e.id>b.id))tops.set(k,e);}
const WEAPON_TYPES=['剑','斧','枪','锤','弓','机械','爪','杖'];
const items=[...tops.values()].sort((a,b)=>Number(!WEAPON_TYPES.includes(a.type))-Number(!WEAPON_TYPES.includes(b.type)));
let gear=read('dist/character-gear.mjs');
const line=`  '${siteId}': { ${items.map(e=>`'${siteId}-equipment-${e.id}': { name: '${e.nameS}' }`).join(', ')} },`;
const lineRe=new RegExp(`^  '${siteId}': .*$`,'m');
gear=lineRe.test(gear)?gear.replace(lineRe,line):gear.replace(/\n};\nexport const characterGear/,`\n${line}\n};\nexport const characterGear`);
write('dist/character-gear.mjs',gear);

console.log(`已加入 ${game.fullNameS}（网站编号 ${siteId}，unitDressId ${game.unitDressId}）：dist/character-${siteId}.html`);
if(notices.length)console.warn(`提示（不影响生成）：\n${notices.join('\n')}`);
