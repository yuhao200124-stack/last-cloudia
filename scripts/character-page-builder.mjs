// Builds a whole character page from the game database, for characters added after 2026-09-28
// (docs/site-characters.json entries with "generated": true). Everything on the page comes from
// dist/game-data/c/<unitDressId>.json (the out-of-battle reader's export) except the six max stats,
// which are Altema's totals recorded in the registry. The rows are laid out here with their game ids;
// names and descriptions are then written by syncCharacterPage, exactly as for the older pages.
//
// Which skills go where, as on the existing pages:
//   个性      personality (highest level of each)
//   专属技能  ownPassives that cannot be learned from arks (no SC; red)
//   专属装备  exclusive gear at its highest tier (tiers share SERIAL_NUM; the higher RARE is the
//             upgrade) with that tier's max stats and max-stage passives
//   通用技能  ownPassives learnable from arks (SC shown; blue), then the 超越 passives (purple)
//   魔法      the character's magic; ark-learnable magic is 通用 (SC / MP), the rest 专属 (— / MP);
//             non-stacking magic is marked data-non-stacking
//   特技      the three specials and the ultimate (then any second-form skills)
import fs from 'node:fs';
import {syncCharacterPage} from './sync-character-game-text.mjs';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const num=n=>Number(n).toLocaleString('en-US');
// ItemEquipMst ELEM; the game data names element 1 火 in skill data, so the page does too.
const ELEMENT={0:'无',1:'火',2:'冰',3:'树',4:'雷',5:'光',6:'暗'};
const STAT_LABELS=[['hp','HP'],['mp','MP'],['attack','攻击力'],['defense','防御力'],['intelligence','法强'],['mind','魔抗']];

export function characterPageData(game,relics){
 const arkMagic=new Set(relics.relics.flatMap(r=>r.magic||[]));
 const own=game.ownPassives.map(p=>({...p,record:game.passives[String(p.passive)]}));
 // Exclusive gear at its highest tier.
 const bySerial=new Map();
 for(const e of game.exclusiveEquipment){
  const key=e.serial??e.id,best=bySerial.get(key);
  if(!best||(e.rare??0)>(best.rare??0)||((e.rare??0)===(best.rare??0)&&e.id>best.id))bySerial.set(key,e);
 }
 const moves=[...game.specials,game.ultimate].filter(Boolean);
 const elements=[...new Set(moves.map(m=>m.element).filter(Boolean))];
 const kinds=new Set(moves.flatMap(m=>m.parts.map(p=>p.kind)).filter(k=>k==='物理'||k==='魔法'));
 return {
  name:game.fullNameS,shortName:game.nameS,dress:game.dressS,elements,
  damage:[...kinds].sort((a,b)=>a==='物理'?-1:b==='物理'?1:0),
  traits:game.personality.map(p=>p.passive),
  exclusive:own.filter(p=>!p.common).map(p=>p.passive),
  common:own.filter(p=>p.common).map(p=>({id:p.passive,sc:p.record?.sc})),
  transcend:game.transcend.map(p=>p.passive),
  equipment:[...bySerial.values()],
  magic:[...game.magic.normal.map(m=>({m,heavy:false})),...game.magic.heavy.map(m=>({m,heavy:true}))].map(({m,heavy})=>({id:m.id,common:arkMagic.has(m.id),sc:m.sc,mp:m.mpCost,heavy})),
  specials:[...moves,...(game.form2||[]).filter(Boolean)].map(m=>m.id),
 };
}

const gearStats=raw=>String(raw||'').split(':').map(Number).map((v,i)=>v?`${STAT_LABELS[i][1]}+${num(v)}`:null).filter(Boolean).join(' / ');
const row=(id,cls,cells='')=>`<tr data-game-id="${id}"><td><span class="skill-name${cls?` ${cls}`:''}"></span></td>${cells}<td></td></tr>`;

export function buildCharacterPage(siteId,entry,game,relics,problems=[],notices=null){
 const d=characterPageData(game,relics),stats=entry.maxStats||{};
 for(const [key,label] of STAT_LABELS)if(!Number.isFinite(stats[key]))problems.push(`最大阶段属性缺少 ${label}（docs/site-characters.json 的 maxStats）`);
 const sections=[];let n=0;
 const section=(id,title,note,body,numbered=true)=>{sections.push(`          <section id="${id}" class="data-section"><h3 class="section-title">${numbered?`<span class="number">${String(++n).padStart(2,'0')}</span>`:''}${title}</h3>${note?`<p class="section-note">${note}</p>`:''}${body}</section>`);return id;};
 const nav=[['max-stats','属性']];
 sections.push(`          <section id="max-stats" class="data-section"><h3 class="section-title with-action"><span>最大阶段属性</span><span class="section-actions"><button id="savedBuildViewerOpen" class="section-action" type="button">已保存配装</button></span></h3><p class="section-note">Lv120、限界突破、潜在觉醒、神域开眼合计（Altema）；不含装备及战斗增益。</p><div class="stat-grid" aria-label="最大阶段属性">${STAT_LABELS.map(([key,label])=>`<div class="stat-box"><span>${label}</span><strong>${Number.isFinite(stats[key])?num(stats[key]):'—'}</strong></div>`).join('')}</div></section>`);
 nav.push([section('traits','个性','仅记录最终阶段效果。',`<div class="trait-list">${d.traits.map(id=>`<article class="trait" data-game-id="${id}"><h4></h4><p></p></article>`).join('')}</div>`),'个性']);
 nav.push([section('exclusive-skills','专属技能','红色技能在能力盘中SC为“—”，无法通过圣物学习。',`<table class="data-table"><thead><tr><th>技能</th><th>最终效果</th></tr></thead><tbody>${d.exclusive.map(id=>row(id,'exclusive')).join('')}</tbody></table>`),'专属技能']);
 if(d.equipment.length)nav.push([section('equipment','专属装备','数值为强化后最高状态。',`<div class="equipment-grid">${d.equipment.map(e=>`<article class="equipment-card" data-game-id="${e.id}"><h4></h4><dl><dt>类型</dt><dd>${esc(e.type)}｜${ELEMENT[e.element]??e.element}属性</dd><dt>最高属性</dt><dd>${gearStats(e.maxStats)||'—'}</dd><dt>最高效果</dt><dd></dd></dl></article>`).join('')}</div>`),'专属装备']);
 nav.push([section('common-skills','通用技能','蓝色为有SC的通用技能；紫色为超越，计算时也作为独立来源。',`<table class="data-table"><thead><tr><th>技能</th><th class="sc">SC</th><th>效果</th></tr></thead><tbody>${[...d.common.map(c=>row(c.id,'common',`<td class="sc">${c.sc??'—'}</td>`)),...d.transcend.map(id=>row(id,'transcend','<td class="sc">—</td>'))].join('')}</tbody></table>`),'通用技能']);
 nav.push([section('magic','魔法',d.magic.length?'':'该角色没有自带魔法。',d.magic.length?`<table class="data-table"><thead><tr><th>魔法</th><th class="sc">SC / MP</th><th>效果</th></tr></thead><tbody>${d.magic.map(m=>row(m.id,m.common?'common':'exclusive',`<td class="sc">${m.common?m.sc:'—'} / ${m.mp||'—'}</td>`).replace('<tr ',m.heavy?'<tr data-non-stacking="true" ':'<tr ')).join('')}</tbody></table>`:''),'魔法']);
 nav.push([section('specials','特技与超必杀技','',`<table class="data-table"><thead><tr><th>名称</th><th>最终效果</th></tr></thead><tbody>${d.specials.map(id=>row(id,'')).join('')}</tbody></table>`),'特技']);
 sections.push(`          <p class="source-note">最大阶段属性：<a href="https://altema.jp/lastcloudia/chara/${siteId}" target="_blank" rel="noreferrer">Altema 角色资料</a>（${esc(entry.statsChecked||'')}）。其余内容由游戏数据生成（scripts/character-page-builder.mjs）。</p>`);
 const elementText=d.elements.length?`${d.elements.join('／')}属性`:'';
 const hero=`<section class="hero"><p class="eyebrow">${esc(d.dress)}</p><h2>${esc(d.name)}</h2><div class="hero-meta">${[elementText,...d.damage.map(k=>`${k}攻击`)].filter(Boolean).map(t=>`<span>${t}</span>`).join('')}<a class="source-button" href="https://altema.jp/lastcloudia/chara/${siteId}" target="_blank" rel="noreferrer">Altema原资料 ↗</a></div></section>`;
 const navHtml=`<nav class="section-nav" aria-label="角色资料目录">${nav.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav>`;
 const skeleton=read('scripts/templates/character-page.html')
  .replace('{{TITLE}}',`${esc(d.shortName)}角色资料｜最后的克劳迪娅`)
  .replace('{{DESCRIPTION}}',`${esc(d.name)}角色资料：个性、专属技能、专属装备、通用技能、魔法、特技及超越效果。`)
  .replace('{{SITE_ID}}',siteId).replace('{{HERO}}',hero).replace('{{NAV}}',navHtml).replace('{{SECTIONS}}',sections.join('\n'))
  ;
 return syncCharacterPage(siteId,skeleton,game,problems,notices);
}

// The card on the character list page and the entry the loadout page keeps for each character.
export function characterCard(siteId,game,version){
 const d=characterPageData(game,{relics:[]});
 const tags=[d.elements.length?`${d.elements.join('／')}属性`:'',d.damage.map(k=>`${k}攻击`).join(' / ')].filter(Boolean).join(' · ');
 return `<a class="character-card" href="./character-${siteId}.html?v=${version}" aria-label="查看${esc(d.name)}的详细资料" data-site-id="${siteId}"><div class="character-avatar"><img src="https://img.altema.jp/lastcloudia/chara/banner/${siteId}.jpg" alt="${esc(d.name)}" /></div><div class="character-card-body"><strong>${esc(d.name)}</strong><span>${tags}</span></div></a>`;
}

// docs/site-characters.json: one character per line.
export const serializeRegistry=r=>`{\n "note": ${JSON.stringify(r.note)},\n "characters": {\n${Object.entries(r.characters).map(([id,c])=>`  ${JSON.stringify(id)}: ${JSON.stringify(c)}`).join(',\n')}\n }\n}\n`;
