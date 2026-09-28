import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {syncCharacterPage} from '../scripts/sync-character-game-text.mjs';

// Every character page (every character mapped to game data, including ones added later) shows the
// game's own skill names and descriptions: the page must be exactly what the generator writes from
// dist/game-data, and every skill row, trait and exclusive-gear card must carry its game id.
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const index=JSON.parse(read('dist/game-data/index.json'));

for(const [siteId,unitDressId] of Object.entries(index.site)){
 test(`character-${siteId}: skill names and descriptions are the game's own text`,()=>{
  const html=read(`dist/character-${siteId}.html`),game=JSON.parse(read(`dist/game-data/c/${unitDressId}.json`)),problems=[];
  const synced=syncCharacterPage(siteId,html,game,problems);
  assert.deepEqual(problems,[]);
  assert.equal(synced,html,'运行 node scripts/sync-character-game-text.mjs 后提交');
 });
 test(`character-${siteId}: every skill row, trait and exclusive-gear card has a game id`,()=>{
  const html=read(`dist/character-${siteId}.html`);
  const traits=[...html.matchAll(/<article class="trait"([^>]*)>/g)],cards=[...html.matchAll(/<article class="equipment-card"([^>]*)>/g)];
  const rows=['exclusive-skills','common-skills','transcend','specials','magic'].flatMap(section=>{
   const block=html.match(new RegExp(`<section id="${section}"[\\s\\S]*?</section>`))?.[0]||'';
   return [...block.matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)].filter(m=>/<td/.test(m[2]));
  });
  assert(traits.length+rows.length>0);
  for(const m of [...traits,...cards,...rows])assert.match(m[1],/data-game-id="\d+"/,m[0].slice(0,120));
 });
}

test('the game data carries a simplified description for every move, as the generator expects',()=>{
 for(const unitDressId of Object.values(index.site)){
  const game=JSON.parse(read(`dist/game-data/c/${unitDressId}.json`));
  for(const move of [...game.normal,...game.specials,game.ultimate,...game.magic.normal,...game.magic.heavy].filter(Boolean))assert.equal(typeof move.explainS,'string',move.nameS);
 }
});

test('an unregistered "?" in a description is reported instead of shown',()=>{
 const game={passives:{1:{nameS:'测试',textS:'伤害上限提升至+?'}},exclusiveEquipment:[],specials:[],magic:{normal:[],heavy:[]}};
 const html='<section id="exclusive-skills"><table><tbody><tr data-game-id="1"><td><span class="skill-name">旧名</span></td><td>旧说明</td></tr></tbody></table></section><p class="source-note">x</p>';
 const problems=[];const out=syncCharacterPage('999',html,game,problems);
 assert.match(out,/<span class="skill-name">测试<\/span>/);
 assert.equal(problems.length,1);assert.match(problems[0],/“\?”尚未登记补值/);
});
