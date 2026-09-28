import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Damage calculator: the two preset boss targets (轟鳥龍恩德爾羅納, 神獸帕帕拉納) carry their race from the
// game's MonsterMst (龙, 鱼). Without a race the game script's "对BOSS特攻" had no race to apply the killer
// to, so it never fired on a preset or custom target. Sessions saved before take the preset's race.
const allowed=new Set(['dist/damage-calculator.mjs','dist/damage-calculator.html']);
const hash=text=>createHash('sha256').update(text).digest('hex');
const base=execFileSync('git',['rev-parse','5f691f4'],{encoding:'utf8'}).trim();
const files={};
for(const path of [...execFileSync('git',['diff',base,'--name-only','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),...execFileSync('git',['ls-files','--others','--exclude-standard','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)].filter(p=>!p.startsWith('dist/game-data/')&&!p.startsWith('dist/engine/')&&p!=='dist/engine-panel.mjs')){
 if(!allowed.has(path))throw Error(`Unexpected boss-race edit: ${path}`);
 let beforeText='';try{beforeText=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']});}catch{}
 files[path]={beforeHash:hash(beforeText),afterHash:hash(fs.readFileSync(path,'utf8')),beforeText};
}
fs.writeFileSync('docs/boss-race-preservation-2026-09-28.json',JSON.stringify({baseline:base,reason:'伤害计算器的两个预设 BOSS 目标按游戏怪物表带上种族（轟鳥龍恩德爾羅納＝龙，神獸帕帕拉納＝鱼）；游戏脚本对 BOSS 特攻是按目标的种族挂特攻，目标没有种族时永远不触发。旧存档沿用预设时补上预设的种族。版本号更新。',files},null,2)+'\n');
console.log(`Recorded ${Object.keys(files).length} boss-race edits.`);
