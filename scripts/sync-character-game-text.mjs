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
// "?" that the game-data export could not substitute are filled from docs/game-text-fills.json
// (each value checked against the reader-decoded parameters); an unregistered "?" is an error.
// Exclusive gear with an enhanced (神装) passive of the same name shows the enhanced numbers, since
// the page lists gear at its maximum; the export only carries the base passive's text, so the
// enhanced values are registered there too, and an unregistered enhanced variant is an error.
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const index=JSON.parse(read('dist/game-data/index.json'));
const fills=JSON.parse(read('docs/game-text-fills.json')).passives;
// One-off id assignment for rows that existed before ids were stored on the page (2026-09-28).
const legacyIds=JSON.parse(read('docs/character-game-ids-2026-09-28.json'));
const check=process.argv.includes('--check');
// Passives that share a name (PassiveSkillMst): an exclusive gear's enhanced passive keeps its name.
const passiveNames=new Map();
for(const file of fs.readdirSync(new URL('dist/game-data/engine/p/',root))){
 const table=JSON.parse(read(`dist/game-data/engine/p/${file}`)).PassiveSkillMst;if(!table)continue;
 const id=table.cols.indexOf('PASSIVE_SKILL_ID'),name=table.cols.indexOf('NAME');
 for(const row of table.rows)passiveNames.set(row[id],row[name]);
}
const sameNamePassives=id=>[...passiveNames].filter(([other,name])=>other!==Number(id)&&name===passiveNames.get(Number(id))).map(([other])=>other);

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr=s=>esc(s).replace(/"/g,'&quot;');
const unesc=s=>String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
const textOf=html=>unesc(String(html).replace(/<[^>]+>/g,'')).trim();
const attr=(attrs,name)=>attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const withAttr=(attrs,name,value)=>attr(attrs,name)!==undefined?attrs:`${attrs} ${name}="${escAttr(value)}"`;

// "始终保持「速充」效果"-style text names an always-on state without its numbers; the reader's decoded
// values carry them (state segments: those with 演出等级/演出编号, or an 自动… process). Each known
// kind is written in the game's own wording right after that clause; an unknown kind must be
// registered as stateNote in docs/game-text-fills.json.
const STATE_CLAUSE=/((?:始终|始終|常时|常時|永久|一直)[^。]*?(?:保持|保有)[^。]*?效果)/;
const nonZero=v=>v&&!/^[+-]?0(\.0+)?%?$/.test(v);
const STATE_PHRASES={
 '攻击/魔力(战斗中)':p=>[nonZero(p['STR倍率'])&&`攻击${p['STR倍率']}`,nonZero(p['INT倍率'])&&`魔力${p['INT倍率']}`],
 '防御/精神':p=>[nonZero(p['DEF倍率'])&&`防御${p['DEF倍率']}`,nonZero(p['MND倍率'])&&`精神${p['MND倍率']}`],
 '暴击率':p=>[nonZero(p['CRT加算值'])&&`暴击发生率+${p['CRT加算值']}%`],
 '自动SCT恢复量增减':p=>[nonZero(p['特技槽自动恢复倍率'])&&`充能恢复速度${p['特技槽自动恢复倍率']}`],
 '自动咏唱速度增减':p=>[nonZero(p['咏唱时间增减值'])&&`魔法咏唱时间${p['咏唱时间增减值']}`],
 '自动MP持续恢复':p=>[`法力持续恢复：恢复值${p['MP恢复值']}、恢复倍率${p['MP恢复倍率']}`],
 '自动移动速度增减':p=>[`移动速度+${p['移动速度加算值']}`],
};
const valueSegments=values=>String(values||'').split('；').map(seg=>{
 const m=seg.match(/^【([^】]*)】(.*)$/);if(!m)return null;
 const params={};for(const kv of m[2].split('，')){const i=kv.indexOf('=');if(i>0)params[kv.slice(0,i)]=kv.slice(i+1);}
 return {head:m[1],params,raw:m[2]};
}).filter(Boolean);
function stateNote(text,values,f,problems,label,id){
 const clause=text.match(STATE_CLAUSE)?.[1];if(!clause||values==null)return text;
 let note=f.stateNote;
 if(note==null){
  const segs=valueSegments(values).filter(s=>/演出(等级|编号)/.test(s.raw)||s.head.startsWith('自动'));
  const unknown=segs.filter(s=>!STATE_PHRASES[s.head]).map(s=>s.head);
  if(!segs.length||unknown.length){problems.push(`${label}：“${clause}”的数值无法从读取器数据自动写出（${unknown.join('、')||'未找到对应效果'}），需在 docs/game-text-fills.json 登记 stateNote（游戏编号 ${id}）`);return text;}
  const phrases=segs.flatMap(s=>STATE_PHRASES[s.head](s.params)).filter(Boolean);
  if(!phrases.length||(phrases.join('').match(/\d+(\.\d+)?/g)||[]).every(n=>clause.includes(n)))return text;
  note=`（${phrases.join(phrases.some(x=>x.includes('、'))?'；':'、')}）`;
 }
 return text.replace(clause,clause+note);
}

export function gameDescription(id,raw,problems,label,values=null){
 const f=fills[String(id)]||{};let used=0;
 let text=String(raw||'');
 for(const [from,to] of f.replace||[]){
  if(text.split(from).length!==2){problems.push(`${label}：登记的数值替换“${from}”在原文中不是恰好出现一次（游戏编号 ${id}）`);continue;}
  text=text.replace(from,to);
 }
 text=text.replace(/\?/g,()=>{
  const value=f.fills?.[used++];
  if(value==null){problems.push(`${label}：说明原文中的“?”尚未登记补值（游戏编号 ${id}）`);return '?';}
  return value;
 });
 if(f.fills&&used!==f.fills.length)problems.push(`${label}：登记的补值数量与原文“?”数量不符（游戏编号 ${id}）`);
 text=text.replace(/\s+/g,' ').trim();
 if(!text)problems.push(`${label}：游戏数据里没有说明原文（游戏编号 ${id}）`);
 text=stateNote(text,values,f,problems,label,id);
 return text+(f.append||'');
}

export function syncCharacterPage(siteId,html,game,problems=[]){
 const passive=id=>game.passives[String(id)]&&{name:game.passives[String(id)].nameS,text:game.passives[String(id)].textS,values:game.passives[String(id)].values};
 const moves=[...(game.normal||[]),...(game.specials||[]),game.ultimate,...(game.form2||[]),...(game.magic?.normal||[]),...(game.magic?.heavy||[])].filter(Boolean);
 const move=id=>{const m=moves.find(x=>String(x.id)===String(id));return m&&{name:m.nameS,text:m.explainS??m.explain};};
 const equipment=id=>{
  const e=game.exclusiveEquipment.find(x=>String(x.id)===String(id));
  if(!e)return null;
  for(const p of e.passives){
   const enhanced=sameNamePassives(p);
   if(enhanced.length&&!enhanced.includes(fills[String(p)]?.enhanced))problems.push(`装备「${e.nameS}」：有神装强化后的同名被动（${enhanced.join('、')}），需在 docs/game-text-fills.json 登记强化后的数值`);
  }
  return {name:e.nameS,text:e.passives.map(p=>game.passives[String(p)]?.textS||'').join('\n'),values:e.passives.map(p=>game.passives[String(p)]?.values||'').join('；'),passiveId:e.passives[0]};
 };
 const lookup={traits:passive,'exclusive-skills':passive,'common-skills':passive,transcend:passive,specials:move,magic:move};
 const legacy=legacyIds[siteId]||{};
 const idFor=(section,attrs,name)=>attr(attrs,'data-game-id')??legacy[section]?.[name];
 const describe=(id,entry,label)=>gameDescription(entry.passiveId??id,entry.text,problems,label,entry.values??null);

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
   let row=inner.replace(nameMatch[0],nameMatch[0].replace(nameMatch[1],esc(entry.name)));
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

if(import.meta.url===`file://${process.argv[1]}`){
 const problems=[],changed=[];
 for(const [siteId,unitDressId] of Object.entries(index.site)){
  const path=`dist/character-${siteId}.html`,before=read(path);
  const game=JSON.parse(read(`dist/game-data/c/${unitDressId}.json`));
  const local=[];const after=syncCharacterPage(siteId,before,game,local);
  problems.push(...local.map(p=>`character-${siteId}：${p}`));
  if(after!==before){changed.push(path);if(!check)fs.writeFileSync(new URL(path,root),after);}
 }
 if(problems.length){console.error(problems.join('\n'));process.exit(1);}
 if(check&&changed.length){console.error(`以下角色页的技能名称／说明与游戏数据不一致，请运行 node scripts/sync-character-game-text.mjs：\n${changed.join('\n')}`);process.exit(1);}
 console.log(check?'角色页技能名称与说明均与游戏数据一致。':`已按游戏数据更新：${changed.join('、')||'无变化'}`);
}
