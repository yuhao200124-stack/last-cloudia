// Boss is an enemy classification or a wave state, never an ordinary race tag.
export function validateBossCoverage(view,d,a,e){
 const c=d.coverage;
 if(view.passKind!=='boss-effects-and-condition'||d.relation!==view.passKind||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing Boss coverage');
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(new Set(ids).size!==ids.length||ids.length!==a.partIds.length||ids.some(id=>!a.partIds.includes(id)))throw Error('Boss coverage mismatch');
 for(const[kind,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>e.parts.find(p=>p.id===id)?.kind!==kind))throw Error('Boss fragment kinds mixed');
 if(c.effectPartIds.some(id=>!d.bindings.some(b=>b.partIds.includes(id)))||c.conditionPartIds.some(id=>!/boss/i.test(e.parts.find(p=>p.id===id).text)))throw Error('Boss coverage must identify only Boss fragments');
 if(new Set(d.bindings.map(b=>b.effectIdentity)).size!==d.bindings.length)throw Error('Boss effects duplicated');
 for(const b of d.bindings)if(b.associatedGroups&&(e.url!=='https://altema.jp/lastcloudia/gino/1883'||b.operation!=='stat-up'||b.scope.stat!=='STR'||JSON.stringify(b.associatedGroups)!=='["physical-damage"]'||b.associationKind!=='user-requested-stat-reference'))throw Error('Only the requested Dragon Awakening association is allowed');
}
export function validateBossBinding(d,a,b){
 if(b.bossRole!=='direct-effect'||!b.operation||!b.effectIdentity||!['self','target-enemy'].includes(b.target)||b.isBuff!==false||b.durationSeconds!==undefined||b.stacking!==undefined||b.effectStacking!=='once-per-skill'||b.partIds.some(id=>!d.coverage.effectPartIds.includes(id)))throw Error('Invalid Boss effect semantics');
 const s=b.scope;
 if(b.operation==='stat-up'){
  if(s.direction!=='self-stat'||!['STR','DEF'].includes(s.stat)||s.waveType!=='boss'||s.enemyType||s.attackerType||b.activationMode!=='boss-wave-state'||b.trigger||!(b.valuePercent>0)||b.capPoints!==undefined)throw Error('Boss Wave attributes are a current wave state');return;
 }
 if(s.direction==='resource'){
  if(b.trigger?.event!=='boss-wave-start'||s.enemyType||s.attackerType||b.valuePercent!==undefined||b.capPoints!==undefined)throw Error('Boss Wave opening recovery must retain its trigger');
  if(b.operation==='restore-hp'){if(b.restorePercent!==50||b.restoreBase!=='maximum-HP')throw Error('Wrong Boss HP recovery');}
  else if(b.operation==='restore-sct-seconds'){if(b.restoreSeconds!==30||b.skillSelection!=='all'||b.restorePercent!==undefined)throw Error('SCT seconds are not stocks or speed');}
  else if(b.operation==='restore-ultimate-gauge'){if(b.restorePercent!==10||b.restoreBase!=='maximum-ultimate-gauge')throw Error('Wrong Boss ultimate gauge recovery');}
  else throw Error('Unknown Boss resource operation');return;
 }
 if(b.operation==='incoming-damage-down'){
  if(s.direction!=='incoming'||!['boss','non-boss'].includes(s.attackerType)||s.enemyType||s.attackType!=='unspecified'||!(b.valuePercent>0)||b.capPoints!==undefined||b.changesDefenseStat!==false)throw Error('Boss defense must identify attacker and all incoming damage');return;
 }
 if(b.operation==='instant-kill-attempt'){
  if(s.direction!=='outgoing'||s.attackType!=='physical'||!s.excludedEnemyTypes?.includes('boss')||!s.excludedModes?.includes('arena')||b.chanceStatus!=='unconfirmed'||b.chancePercent!==undefined||b.valuePercent!==undefined)throw Error('Instant kill remains invalid against Boss and arena, with unknown chance');return;
 }
 if(s.direction!=='outgoing'||!['boss','non-boss'].includes(s.enemyType)||s.attackerType||s.waveType||!['unspecified','physical','attack-magic','skill','ultimate'].includes(s.attackType))throw Error('Wrong Boss attack target or type');
 if(b.operation==='damage-up'&&(!(b.valuePercent>0)||b.capPoints!==undefined))throw Error('Boss damage is percent');
 if(b.operation==='cap-up'&&(!(b.capPoints>0)||b.valuePercent!==undefined))throw Error('Boss cap is points');
 if(b.operation.startsWith('tiered-')&&(b.countMetric!=='allies-with-same-skill'||!b.requiredSkillId||!b.tiers?.length||b.valuePercent!==undefined||b.capPoints!==undefined))throw Error('Boss tiers require actual equipped ally count');
 if(b.group.startsWith('critical-')&&(b.requiresCriticalHit!==true||b.grantsCriticalEligibility!==false))throw Error('Boss critical effects do not grant critical eligibility');
 if(b.addsToPartId&&d.bindings.some(x=>x.partIds.includes(b.addsToPartId)&&x.scope.attackType!==s.attackType))throw Error('Extra Boss caps must match base attack type');
}
