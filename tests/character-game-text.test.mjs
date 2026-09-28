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

test('an always-kept state named without numbers gets its reader-decoded values written after it',()=>{
 const game={passives:{
  1:{nameS:'自动充能',textS:'始终保持「速充」效果',values:'【自动SCT恢复量增减】特技槽自动恢复倍率=+25%，演出编号=1'},
  2:{nameS:'双重',textS:'常时保有EX鼓舞与EX守护的效果。\n战斗开始时恢复充能',values:'【攻击/魔力(战斗中)】STR倍率=+50%，演出等级=2；【防御/精神】DEF倍率=+50%，演出等级=2；【战斗开始时单体SCT恢复】特技编号=-1'},
  3:{nameS:'已写',textS:'常时保有充能恢复速度+35%的增益效果',values:'【自动SCT恢复量增减】特技槽自动恢复倍率=+35%，演出编号=1'},
  4:{nameS:'未知',textS:'始终保持「高阶护盾」效果',values:'【受到伤害/其他效果】伤害倍率=-35%，演出等级=1'},
 },exclusiveEquipment:[],specials:[],magic:{normal:[],heavy:[]}};
 const row=id=>`<tr data-game-id="${id}"><td><span class="skill-name">x</span></td><td>x</td></tr>`;
 const html=`<section id="exclusive-skills"><table><tbody>${[1,2,3,4].map(row).join('')}</tbody></table></section><p class="source-note">x</p>`;
 const problems=[],out=syncCharacterPage('999',html,game,problems);
 assert.match(out,/始终保持「速充」效果（充能恢复速度\+25%）/);
 assert.match(out,/常时保有EX鼓舞与EX守护的效果（攻击\+50%、防御\+50%）。 战斗开始时恢复充能/);
 assert.match(out,/常时保有充能恢复速度\+35%的增益效果</,'numbers already in the text are not repeated');
 assert.equal(problems.length,1);assert.match(problems[0],/高阶护盾.*stateNote/);
});
