// Writes every character page's skill names and descriptions from the game database, so what the
// page shows is the game's own text (PassiveSkillMst NAME_S / text, SkillMst name / description).
//   node scripts/sync-character-game-text.mjs          rewrite dist/character-*.html
//   node scripts/sync-character-game-text.mjs --check  fail if any page differs (used by tests)
//
// Every skill element carries data-game-id: passive id for 个性/专属/通用/超越 rows, skill id for
// 特技/超必杀/魔法 rows, equipment id for 专武 cards. Adding a new character: give each row its id
// (see docs/character-game-text-2026-09-28.md), run this script, and it fills in the game's names and text.
//
// Pages written before this rule kept their older description as data-rule-text: the calculator's
// hand-checked rule catalogs were split from that wording and are matched by it, so it stays the
// internal matching key while the page displays the game text. New characters need no such key.
//
// Numbers the game's own text leaves out are filled in automatically from the exported game data,
// so a new character needs no per-skill registration:
//   - "{0}"-style placeholders are substituted by the export itself (gametext.py understands every
//     PROCESS_EXPLAIN_QUOTE form), so no "?" reaches the page; a "?" that still shows up is an error.
//   - Exclusive gear is shown at its maximum: the export lists, for each gear, the passives of its
//     highest enhancement (神装) stage as maxPassives, and the card uses those.
//   - "始终保持「速充」效果"-style clauses name always-on states without numbers; the export lists each
//     passive's always-on state processes (autoStates, ProcessMst "PB_オート…") with their decoded
//     values, and the numbers are written right after the clause.
//   - "一定机率" and the like get the chance when the reader data gives it unambiguously.
// docs/game-text-fills.json stays for the rare case where the game data itself needs a correction.
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const index=JSON.parse(read('dist/game-data/index.json'));
const fills=JSON.parse(read('docs/game-text-fills.json')).passives;
// One-off id assignment for rows that existed before ids were stored on the page (2026-09-28).
const legacyIds=JSON.parse(read('docs/character-game-ids-2026-09-28.json'));
const check=process.argv.includes('--check');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr=s=>esc(s).replace(/"/g,'&quot;');
const unesc=s=>String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
const textOf=html=>unesc(String(html).replace(/<[^>]+>/g,'')).trim();
const attr=(attrs,name)=>attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const withAttr=(attrs,name,value)=>attr(attrs,name)!==undefined?attrs:`${attrs} ${name}="${escAttr(value)}"`;

// Always-on states ("始终保持「速充」效果", "常时保有EX鼓舞与EX守护的效果"): each named state takes the
// passive's next unused always-on process of that kind (autoStates, in process order); a name the table
// does not know takes the next process no other name claims. Names that already carry numbers
// ("常时保有精神+35%的增益以及…") are described by the text itself.
const STATE_CLAUSE=/((?:始终|始終|常时|常時|永久|一直)[^。]*?(?:保持|保有|处于|處於)[^。]*?效果)/g;
const ELEMENT={炎:'炎',冰:'冰',樹:'树',树:'树',雷:'雷',光:'光',暗:'暗',無:'无',无:'无'};
const nonZero=v=>v&&!/^[+-]?0(\.0+)?%?$/.test(v);
const STATE_KINDS=[
 // [process name (ProcessMst, without PB_), words naming that state in the text, phrase from the decoded
 //  values, parameter that identifies the same effect in a conditional (non-auto) process]
 ['オートSTR増減',/鼓舞/,p=>[nonZero(p['STR倍率'])&&`攻击${p['STR倍率']}`,nonZero(p['INT倍率'])&&`魔力${p['INT倍率']}`],'STR倍率'],
 ['オートINT増減',/增魔/,p=>[nonZero(p['STR倍率'])&&`攻击${p['STR倍率']}`,nonZero(p['INT倍率'])&&`魔力${p['INT倍率']}`],'INT倍率'],
 ['オートDEF増減',/堡垒|守护/,p=>[nonZero(p['DEF倍率'])&&`防御${p['DEF倍率']}`,nonZero(p['MND倍率'])&&`精神${p['MND倍率']}`],'DEF倍率'],
 ['オートMND増減',/振奋/,p=>[nonZero(p['DEF倍率'])&&`防御${p['DEF倍率']}`,nonZero(p['MND倍率'])&&`精神${p['MND倍率']}`],null],
 ['オート物理被ダメージ増減',/(?<!魔法)护盾|守护/,p=>[`受到的物理伤害${p['伤害倍率']}`],null],
 ['オート魔法被ダメージ増減',/屏障|魔法护盾/,p=>[`受到的魔法伤害${p['伤害倍率']}`],null],
 ['オート属性被ダメージ増減',/壁/,p=>[`受到的${ELEMENT[p['属性ID']]??p['属性ID']??''}属性伤害${p['伤害倍率']}`],null],
 ['オート被ダメージ増減',/护盾|屏障|壁/,p=>[`受到的伤害${p['伤害倍率']}`],null],
 ['オートSCT回復量増減',/速充/,p=>[nonZero(p['特技槽自动恢复倍率'])&&`充能恢复速度${p['特技槽自动恢复倍率']}`],'特技槽自动恢复倍率'],
 ['オート詠唱速度増減',/速咏/,p=>[nonZero(p['咏唱时间增减值'])&&`魔法咏唱时间${p['咏唱时间增减值']}`],'咏唱时间增减值'],
 ['オートクリティカル率増減',/暴击/,p=>[nonZero(p['CRT加算值'])&&`暴击发生率+${p['CRT加算值']}%`],'CRT加算值'],
 ['オートMPリジェネ',/法力自愈|魔法阵/,p=>[`法力持续恢复：${[nonZero(p['MP恢复值'])&&`恢复值${p['MP恢复值']}`,nonZero(p['MP恢复倍率'])&&`恢复倍率${p['MP恢复倍率']}`].filter(Boolean).join('、')}`],'MP恢复倍率'],
 ['オートリジェネ',/(?<!法力)自愈/,p=>{const mnd=p['MND倍率']??p['MDEF倍率'];return [`体力持续恢复：${[nonZero(mnd)&&`精神倍率${mnd}`,p['恢复最低值']&&`恢复最低值${p['恢复最低值']}`,p['恢复倍率']&&`恢复倍率${p['恢复倍率']}`].filter(Boolean).join('、')}`];},'恢复最低值'],
 ['オート移動速度増減',/提速/,p=>[`移动速度+${p['移动速度加算值']}`,nonZero(p['移动速度倍率'])&&`移动速度${p['移动速度倍率']}`],'移动速度加算值'],
 ['オート超音速',/超音速|提速/,p=>[`移动速度+${p['移动速度加算值']}`],null],
 ['オート最大HP増減',/生命注入/,p=>[nonZero(p['HP加算值'])&&`体力+${p['HP加算值']}`,nonZero(p['HP倍率'])&&`体力${p['HP倍率']}`],'HP加算值'],
];
const kindOf=process=>STATE_KINDS.find(k=>k[0]===process);
const decoded=seg=>{
 const m=String(seg).match(/^【([^】]*)】(.*?)(（几率[^）]*）)?$/);if(!m)return {head:'',params:{}};
 const params={};for(const kv of m[2].split('，')){const i=kv.indexOf('=');if(i>0)params[kv.slice(0,i)]=kv.slice(i+1);}
 return {head:m[1],params};
};
// A state the table has no phrase for is written with the reader's own labels, so nothing blocks.
const genericPhrase=({params})=>Object.entries(params).filter(([k,v])=>!/^演出(等级|编号)$/.test(k)&&nonZero(v)).map(([k,v])=>`${k}${/^[+-]/.test(v)?'':'='}${v}`).join('、');
const statePhrases=state=>{
 const kind=kindOf(state.process),d=decoded(state.values);
 const phrases=kind?kind[2](d.params).filter(Boolean):[genericPhrase(d)].filter(Boolean);
 return phrases.join('、');
};
function stateNotes(text,states,values,notices,label){
 const clauses=[...text.matchAll(STATE_CLAUSE)];
 if(!clauses.length)return text;
 const pool=(states||[]).map(state=>({state,used:false}));
 // The same effect given by a conditional process (e.g. 自愈 only below 50% HP, or only in water) when
 // the passive has no always-on process of that kind: used when exactly one segment carries it.
 const conditional=(values==null?[]:String(values).split('；')).map(seg=>({seg,used:false}));
 const namesOf=clause=>clause.replace(/^[\s\S]*?(?:保持|保有|处于|處於)/,'').replace(/的?(?:增益)?效果$/,'').split(/[「」『』･・、，,\s]+|与|以及|和/).map(n=>n.trim()).filter(n=>n&&!/\d/.test(n));
 const kindsOf=name=>STATE_KINDS.filter(k=>k[1].test(name));
 const claimed=new Set(clauses.flatMap(c=>namesOf(c[1])).flatMap(n=>kindsOf(n).map(k=>k[0])));
 let out='',at=0;
 for(const c of clauses){
  const picked=[];
  for(const name of namesOf(c[1])){
   const kinds=kindsOf(name);
   // A name the table knows takes that kind; otherwise (or when the passive has none of that kind,
   // e.g. 「提速」 written for haste) the next always-on process no other name in the text claims.
   let slot=kinds.length?pool.find(s=>!s.used&&kinds.some(k=>k[0]===s.state.process)):null;
   if(!slot&&kinds.length){
    const keyed=kinds.map(k=>k[3]).filter(Boolean),hits=conditional.filter(s=>!s.used&&keyed.some(key=>nonZero(decoded(s.seg).params[key])));
    if(hits.length===1)slot={...hits[0],state:{process:kinds[0][0],values:hits[0].seg},mark:hits[0]};
   }
   slot??=pool.find(s=>!s.used&&!claimed.has(s.state.process));
   if(!slot)continue;
   (slot.mark??slot).used=true;picked.push(slot);
  }
  const phrases=picked.map(s=>statePhrases(s.state)).filter(Boolean);
  const numbers=phrases.join('').match(/\d+(\.\d+)?/g)||[];
  if(!phrases.length){if(namesOf(c[1]).length)notices?.push(`${label}：“${c[1]}”在读取器数据里没有对应的效果数值，未补数值`);continue;}
  if(numbers.every(n=>c[1].includes(n)))continue;
  const end=c.index+c[1].length;
  out+=text.slice(at,end)+`（${phrases.join(phrases.some(x=>x.includes('、'))?'；':'、')}）`;at=end;
 }
 return out+text.slice(at);
}

// Chances ("一定机率…") the text leaves out: the reader gives a process's own chance as "（几率X%）" and
// some processes take it as a 发生几率/发动几率 parameter. Written after each chance phrase only when
// that is unambiguous: one value for every phrase; exactly one value per phrase, in order; or one run
// of same-kind processes per phrase (e.g. 即死 on 特技 0.25% and 超必杀 0.8%, labelled by skill type).
const CHANCE_PHRASE=/一定[机几]率|有[机几]率|低[机几]率|高[机几]率/g;
const pct=v=>`${v}%`;
const chancesOf=values=>{
 const out=[];
 for(const seg of String(values||'').split('；')){
  const d=decoded(seg),suffix=seg.match(/（几率([\d.]+)%）$/);
  const found=suffix?[Number(suffix[1])]:[...seg.matchAll(/(?:^|[】，])(?:发生|发动)几率=\+?([\d.]+)%/g)].map(m=>Number(m[1]));
  for(const value of found)if(value>0&&value<100)out.push({value,head:d.head,skill:d.params['技能类型条件']});
 }
 return out;
};
function chanceNotes(text,values,notices,label){
 const phrases=[...text.matchAll(CHANCE_PHRASE)];
 if(!phrases.length||values==null)return text;
 const chances=chancesOf(values);if(!chances.length)return text;
 const distinct=[...new Set(chances.map(c=>c.value))];
 const groups=[];for(const c of chances){const last=groups[groups.length-1];if(last&&last[0].head===c.head)last.push(c);else groups.push([c]);}
 const groupNote=g=>{
  const vs=[...new Set(g.map(c=>c.value))];if(vs.length===1)return pct(vs[0]);
  const skills=g.map(c=>c.skill);return skills.every(Boolean)&&new Set(skills).size===g.length?g.map(c=>`${c.skill}${pct(c.value)}`).join('、'):null;
 };
 let each=null;
 if(distinct.length===1&&chances.length>=phrases.length)each=phrases.map(()=>pct(distinct[0]));
 else if(chances.length===phrases.length)each=chances.map(c=>pct(c.value));
 else if(groups.length===phrases.length&&groups.every(groupNote))each=groups.map(groupNote);
 if(!each){notices?.push(`${label}：说明里有${phrases.length}处机率，读取器数据有${chances.length}个几率（${chances.map(c=>pct(c.value)).join('、')}），无法一一对应，未补数值`);return text;}
 let out='',at=0;
 phrases.forEach((m,i)=>{const end=m.index+m[0].length;out+=text.slice(at,end)+`（${each[i]}）`;at=end;});
 return out+text.slice(at);
}

// docs/game-text-fills.json (by game id): "replace" [[from,to],…] and "append" correct the game text
// in the rare case the game data itself is wrong; nothing needs registering for ordinary skills.
export function gameDescription(id,raw,problems,label,entry={},notices=null){
 const f=fills[String(id)]||{};
 let text=String(raw||'');
 for(const [from,to] of f.replace||[]){
  if(text.split(from).length!==2){problems.push(`${label}：登记的原文更正“${from}”在原文中不是恰好出现一次（游戏编号 ${id}）`);continue;}
  text=text.replace(from,to);
 }
 if(/\?/.test(text))problems.push(`${label}：游戏数据的说明里还有未代入的“?”，请检查导出（local-migration-tools/game-data/gametext.py）（游戏编号 ${id}）`);
 text=text.replace(/\s+/g,' ').trim();
 if(!text)problems.push(`${label}：游戏数据里没有说明原文（游戏编号 ${id}）`);
 text=stateNotes(text,entry.autoStates,entry.values??null,notices,label);
 text=chanceNotes(text,entry.values??null,notices,label);
 return text+(f.append||'');
}

export function syncCharacterPage(siteId,html,game,problems=[],notices=null){
 const passive=id=>{const p=game.passives[String(id)];return p&&{name:p.nameS,text:p.textS,values:p.values,autoStates:p.autoStates};};
 const moves=[...(game.normal||[]),...(game.specials||[]),game.ultimate,...(game.form2||[]),...(game.magic?.normal||[]),...(game.magic?.heavy||[])].filter(Boolean);
 const move=id=>{const m=moves.find(x=>String(x.id)===String(id));return m&&{name:m.nameS,text:m.explainS??m.explain};};
 // Exclusive gear at its maximum: the passives of its highest enhancement (神装) stage.
 const equipment=id=>{
  const e=game.exclusiveEquipment.find(x=>String(x.id)===String(id));
  if(!e)return null;
  if(!e.maxPassives){problems.push(`装备「${e.nameS}」：游戏数据缺少 maxPassives（最高强化阶段的被动），请用 local-migration-tools/game-data 重新导出`);return null;}
  const ps=e.maxPassives.map(p=>game.passives[String(p)]).filter(Boolean);
  return {name:e.nameS,text:ps.map(p=>p.textS||'').join('\n'),values:ps.map(p=>p.values||'').join('；'),autoStates:ps.flatMap(p=>p.autoStates||[]),passiveId:e.maxPassives[0]};
 };
 const lookup={traits:passive,'exclusive-skills':passive,'common-skills':passive,transcend:passive,specials:move,magic:move};
 const legacy=legacyIds[siteId]||{};
 const idFor=(section,attrs,name)=>attr(attrs,'data-game-id')??legacy[section]?.[name];
 const describe=(id,entry,label)=>gameDescription(entry.passiveId??id,entry.text,problems,label,entry,notices);

 // 个性
 html=html.replace(/<article class="trait"([^>]*)><h4>([\s\S]*?)<\/h4><p([^>]*)>([\s\S]*?)<\/p>/g,(all,attrs,name,pAttrs,text)=>{
  const id=idFor('traits',attrs,textOf(name)),entry=id&&passive(id);
  if(!entry){problems.push(`个性「${textOf(name)}」：未标记游戏编号或编号不存在`);return all;}
  const migrated=attr(attrs,'data-game-id')!==undefined;
  return `<article class="trait"${withAttr(attrs,'data-game-id',id)}><h4>${esc(entry.name)}</h4><p${migrated?pAttrs:withAttr(pAttrs,'data-rule-text',textOf(text))}>${esc(describe(id,entry,`个性「${entry.name}」`))}</p>`;
 });
 // 专属技能、通用技能（含超越）、特技／超必杀、魔法
 for(const section of ['exclusive-skills','common-skills','transcend','specials','magic']){
  html=html.replace(new RegExp(`(<section id="${section}"[\\s\\S]*?</section>)`),block=>block.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/g,(all,attrs,inner)=>{
   if(!/<td/.test(inner))return all;
   const nameMatch=inner.match(/<span class="skill-name[^"]*">([\s\S]*?)<\/span>/);
   if(!nameMatch){problems.push(`${section}：有一行没有技能名称元素`);return all;}
   const name=textOf(nameMatch[1]),id=idFor(section,attrs,name),entry=id&&lookup[section](id);
   if(!entry){problems.push(`${section}「${name}」：未标记游戏编号或编号不存在`);return all;}
   const migrated=attr(attrs,'data-game-id')!==undefined;
   let row=inner.replace(nameMatch[0],nameMatch[0].replace(/>[\s\S]*?<\/span>$/,()=>`>${esc(entry.name)}</span>`));
   const cells=[...row.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)],last=cells[cells.length-1];
   const tdAttrs=migrated?last[1]:withAttr(last[1],'data-rule-text',textOf(last[2]));
   row=row.slice(0,last.index)+`<td${tdAttrs}>${esc(describe(id,entry,`「${entry.name}」`))}</td>`+row.slice(last.index+last[0].length);
   return `<tr${withAttr(attrs,'data-game-id',id)}>${row}</tr>`;
  }));
 }
 // 专武／装备卡：名称与“最高效果”
 html=html.replace(/<article class="equipment-card"([^>]*)><h4>([\s\S]*?)<\/h4>([\s\S]*?)<\/article>/g,(all,attrs,name,body)=>{
  const id=idFor('equipment',attrs,textOf(name)),entry=id&&equipment(id);
  if(!entry){problems.push(`装备「${textOf(name)}」：未标记游戏编号或编号不存在`);return all;}
  const migrated=attr(attrs,'data-game-id')!==undefined;
  const newBody=body.replace(/(<dt>最高效果<\/dt><dd)([^>]*)>([\s\S]*?)<\/dd>/,(m,open,ddAttrs,text)=>`${open}${migrated?ddAttrs:withAttr(ddAttrs,'data-rule-text',textOf(text))}>${esc(describe(id,entry,`装备「${entry.name}」`))}</dd>`);
  if(newBody===body&&!/<dt>最高效果<\/dt>/.test(body))problems.push(`装备「${entry.name}」：没有“最高效果”一栏`);
  return `<article class="equipment-card"${withAttr(attrs,'data-game-id',id)}><h4>${esc(entry.name)}</h4>${newBody}</article>`;
 });
 // Tell readers where the names and descriptions now come from (added once, before the source note).
 const note='<p class="source-note" data-game-text-note>技能、魔法、特技与专属装备的名称和说明为游戏数据中的原文（读取器从游戏主数据读出）；原文未写出的数值按读取器解析的参数补上。</p>';
 if(!html.includes('data-game-text-note')){
  if(!/<p class="source-note">/.test(html))problems.push('页面没有 source-note，无法注明说明来源');
  else html=html.replace(/<p class="source-note">/,`${note}<p class="source-note">`);
 }
 return html;
}

// (An async function rather than top-level await: the builder imports this module, so this module
// has to finish loading before the builder can.)
if(import.meta.url===`file://${process.argv[1]}`)(async()=>{
 // Pages generated from the game data (docs/site-characters.json "generated") are rebuilt whole, so a
 // re-exported game database also brings in skills added to the character later.
 const {buildCharacterPage}=await import('./character-page-builder.mjs');
 const registry=JSON.parse(read('docs/site-characters.json')).characters;
 const relics=JSON.parse(read('dist/game-data/relics.json'));
 const problems=[],notices=[],changed=[];
 for(const [siteId,unitDressId] of Object.entries(index.site)){
  const path=`dist/character-${siteId}.html`,before=read(path);
  const game=JSON.parse(read(`dist/game-data/c/${unitDressId}.json`));
  const local=[],info=[];const after=registry[siteId]?.generated?buildCharacterPage(siteId,registry[siteId],game,relics,local,info):syncCharacterPage(siteId,before,game,local,info);
  problems.push(...local.map(p=>`character-${siteId}：${p}`));notices.push(...info.map(p=>`character-${siteId}：${p}`));
  if(after!==before){changed.push(path);if(!check)fs.writeFileSync(new URL(path,root),after);}
 }
 if(notices.length)console.warn(`提示（不影响生成）：\n${notices.join('\n')}`);
 if(problems.length){console.error(problems.join('\n'));process.exit(1);}
 if(check&&changed.length){console.error(`以下角色页的技能名称／说明与游戏数据不一致，请运行 node scripts/sync-character-game-text.mjs：\n${changed.join('\n')}`);process.exit(1);}
 console.log(check?'角色页技能名称与说明均与游戏数据一致。':`已按游戏数据更新：${changed.join('、')||'无变化'}`);
})();
