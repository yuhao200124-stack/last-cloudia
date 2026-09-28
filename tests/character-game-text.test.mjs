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

test('the export substitutes every number the game text quotes, for every character in the game data',()=>{
 // gametext.py understands all PROCESS_EXPLAIN_QUOTE forms ("1:3:*:2", "2:7:/:100:+:10", "2:10:/:[5]", …),
 // so no "?" is left for anyone to fill in by hand, and every exclusive gear carries its max-stage passives.
 for(const file of fs.readdirSync(new URL('../dist/game-data/c/',import.meta.url))){
  const game=JSON.parse(read(`dist/game-data/c/${file}`));
  for(const p of Object.values(game.passives))assert.doesNotMatch(p.textS,/\?/,`${file} ${p.id} ${p.nameS}`);
  for(const e of game.exclusiveEquipment){
   assert.equal(e.maxPassives?.length,e.passives.length,`${file} ${e.nameS}`);
   for(const id of e.maxPassives)assert(game.passives[String(id)],`${file} ${e.nameS} ${id}`);
  }
 }
});

const pageWith=(rows,section='exclusive-skills')=>`<section id="${section}"><table><tbody>${rows.map(id=>`<tr data-game-id="${id}"><td><span class="skill-name">x</span></td><td>x</td></tr>`).join('')}</tbody></table></section><p class="source-note">x</p>`;

test('a "?" left in the game text is reported instead of shown',()=>{
 const game={passives:{1:{nameS:'测试',textS:'伤害上限提升至+?'}},exclusiveEquipment:[],specials:[],magic:{normal:[],heavy:[]}};
 const problems=[];const out=syncCharacterPage('999',pageWith([1]),game,problems);
 assert.match(out,/<span class="skill-name">测试<\/span>/);
 assert.equal(problems.length,1);assert.match(problems[0],/未代入的“\?”/);
});

test('exclusive gear shows the passives of its highest enhancement stage',()=>{
 const game={passives:{
  10:{nameS:'神翼',textS:'伤害+35%',values:''},
  12:{nameS:'神翼',textS:'伤害+40%',values:''},
 },exclusiveEquipment:[{id:5,nameS:'神翼装',passives:[10],maxPassives:[12]}],specials:[],magic:{normal:[],heavy:[]}};
 const html='<article class="equipment-card" data-game-id="5"><h4>x</h4><dl><dt>最高效果</dt><dd>x</dd></dl></article><p class="source-note">x</p>';
 const problems=[],out=syncCharacterPage('999',html,game,problems);
 assert.deepEqual(problems,[]);assert.match(out,/<dd>伤害\+40%<\/dd>/);
});

test('an always-on state named without numbers gets the numbers of its always-on process written after it',()=>{
 const auto=(process,values)=>({process,values});
 const game={passives:{
  1:{nameS:'自动充能',textS:'始终保持「速充」效果',autoStates:[auto('オートSCT回復量増減','【自动SCT恢复量增减】特技槽自动恢复倍率=+25%，演出编号=1')]},
  2:{nameS:'双重',textS:'常时保有EX鼓舞与EX守护的效果。\n战斗开始时恢复充能',autoStates:[auto('オートSTR増減','【攻击/魔力(战斗中)】STR倍率=+50%，演出等级=2'),auto('オートDEF増減','【防御/精神】DEF倍率=+50%，演出等级=2')]},
  3:{nameS:'已写',textS:'常时保有充能恢复速度+35%的增益效果',autoStates:[auto('オートSCT回復量増減','【自动SCT恢复量增减】特技槽自动恢复倍率=+35%，演出编号=1')]},
  4:{nameS:'护盾',textS:'始终保持「高阶护盾」「高阶魔法屏障」效果',autoStates:[auto('オート物理被ダメージ増減','【受到伤害/其他效果】伤害倍率=-35%，演出等级=2'),auto('オート魔法被ダメージ増減','【受到伤害/其他效果】伤害倍率=-35%，演出等级=2')]},
  5:{nameS:'两句',textS:'始终保持「自愈」的效果\n始终保持「鼓舞」的效果',autoStates:[auto('オートリジェネ','【防御/精神/其他效果】MND倍率=+80%，恢复最低值=1600，恢复倍率=+20%，演出编号=6'),auto('オートSTR増減','【攻击/魔力(战斗中)】STR倍率=+20%，演出等级=1')]},
  6:{nameS:'提速写作速充',textS:'始终保持「提速」的效果',autoStates:[auto('オートSCT回復量増減','【自动SCT恢复量增减】特技槽自动恢复倍率=+25%，演出编号=1')]},
  7:{nameS:'条件自愈',textS:'体力低于50%时始终保持「自愈」效果',values:'【防御/精神】发动条件方向=以下，剩余HP阈值=50.0%，MDEF倍率=+100%，恢复最低值=1900，恢复倍率=+7%'},
  8:{nameS:'属性壁',textS:'常时保有光壁II与 影壁II的效果',autoStates:[auto('オート属性被ダメージ増減','【受到伤害/其他效果】属性ID=光，伤害倍率=-35%，演出等级=1'),auto('オート属性被ダメージ増減','【受到伤害/其他效果】属性ID=暗，伤害倍率=-35%，演出等级=1')]},
 },exclusiveEquipment:[],specials:[],magic:{normal:[],heavy:[]}};
 const problems=[],notices=[],out=syncCharacterPage('999',pageWith([1,2,3,4,5,6,7,8]),game,problems,notices);
 assert.deepEqual(problems,[]);assert.deepEqual(notices,[]);
 assert.match(out,/始终保持「速充」效果（充能恢复速度\+25%）/);
 assert.match(out,/常时保有EX鼓舞与EX守护的效果（攻击\+50%、防御\+50%）。 战斗开始时恢复充能/);
 assert.match(out,/常时保有充能恢复速度\+35%的增益效果</,'numbers already in the text are not repeated');
 assert.match(out,/「高阶护盾」「高阶魔法屏障」效果（受到的物理伤害-35%、受到的魔法伤害-35%）/);
 assert.match(out,/「自愈」的效果（体力持续恢复：精神倍率\+80%、恢复最低值1600、恢复倍率\+20%） 始终保持「鼓舞」的效果（攻击\+20%）/);
 assert.match(out,/始终保持「提速」的效果（充能恢复速度\+25%）/,'the passive\'s own always-on process decides, not the word');
 assert.match(out,/「自愈」效果（体力持续恢复：精神倍率\+100%、恢复最低值1900、恢复倍率\+7%）/);
 assert.match(out,/影壁II的效果（受到的光属性伤害-35%、受到的暗属性伤害-35%）/);
});

test('a chance the text leaves out is written after it when the reader data is unambiguous',()=>{
 const game={passives:{
  1:{nameS:'一个',textS:'战斗开始时，一定机率对敌人全体赋予麻痺',values:'【战斗开始时全体异常赋予】敌/我=1，发生几率=+40%，异常状态种类=2'},
  2:{nameS:'两个',textS:'普通攻击时，一定机率赋予出血 物理攻击时，一定机率使敌人沉默',values:'【特定属性特定攻击技能出血赋予】技能类型条件=普通攻击（几率2.5%）；【物理攻击时异常赋予】异常状态种类=6（几率0.5%）；【攻击/魔力(常驻)】倍率=+15%'},
  3:{nameS:'分技能',textS:'一定机率免疫暴击 特技･超必杀技的攻击时，一定机率使敌方即死',values:'【暴击率】发生几率=+50%；【死神】技能类型条件=特技（几率0.25%）；【死神】技能类型条件=超必杀（几率0.8%）'},
  4:{nameS:'对不上',textS:'一定机率A，一定机率B',values:'【X】（几率15.0%）；【修改其他效果】发生几率=+100%'},
 },exclusiveEquipment:[],specials:[],magic:{normal:[],heavy:[]}};
 const problems=[],notices=[],out=syncCharacterPage('999',pageWith([1,2,3,4]),game,problems,notices);
 assert.deepEqual(problems,[]);
 assert.match(out,/一定机率（40%）对敌人全体赋予麻痺/);
 assert.match(out,/一定机率（2.5%）赋予出血 物理攻击时，一定机率（0.5%）使敌人沉默/);
 assert.match(out,/一定机率（50%）免疫暴击 特技･超必杀技的攻击时，一定机率（特技0.25%、超必杀0.8%）使敌方即死/);
 assert.match(out,/>一定机率A，一定机率B</,'an ambiguous match is left as the game wrote it');
 assert.equal(notices.length,1);assert.match(notices[0],/对不上.*无法一一对应/);
});
