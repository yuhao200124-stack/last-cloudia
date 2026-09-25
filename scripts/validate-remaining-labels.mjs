export const remainingTags={'misc':'杂项','element-weakness':'属性弱点','combo':'连击','enemy-defeat':'击败敌人','battle-end':'战斗结束','aerial':'空中','back-attack':'背后攻击','party':'队伍联动','battle-time':'战斗时间','distance':'距离','hp-consumption':'HP持续消耗','lethal-survival':'致命伤害存活','damage-cap':'通用伤害上限','trigger-limits':'触发次数与重置'};
export const remainingKeys=Object.keys(remainingTags);
export function validateRemainingCoverage(key,view,d,a,e){
 const c=d.coverage;
 if(view.passKind!==key+'-effects-and-condition'||!Array.isArray(c?.effectPartIds)||!Array.isArray(c?.conditionPartIds))throw Error('Missing remaining-family coverage: '+key);
 const ids=[...c.effectPartIds,...c.conditionPartIds];
 if(new Set(ids).size!==ids.length||ids.length!==a.partIds.length||ids.some(id=>!a.partIds.includes(id)))throw Error('Remaining-family coverage mismatch: '+e.name);
 for(const[k,list]of[['effect',c.effectPartIds],['condition',c.conditionPartIds]])if(list.some(id=>e.parts.find(p=>p.id===id)?.kind!==k))throw Error('Remaining-family fragment kinds mixed: '+e.name);
 if(c.conditionPartIds.some(id=>/待确认|未知|尚待|仍待(?!标签)/.test(e.parts.find(p=>p.id===id).text)))throw Error('Unknown condition marked complete: '+e.name);
 if(c.effectPartIds.some(id=>!d.bindings.some(b=>b.remainingRole==='direct-effect'&&b.partIds.includes(id))))throw Error('Missing direct binding: '+e.name);
 if(new Set(d.bindings.map(b=>b.effectIdentity)).size!==d.bindings.length)throw Error('Duplicate effect in '+key+': '+e.name);
}
export function validateRemainingBinding(key,d,a,b){
 if(!b.operation||!b.effectIdentity||!b.sourceClause||!b.target||!b.scope||typeof b.isBuff!=='boolean'||!Array.isArray(b.skillReviewConditions)||!Array.isArray(b.pendingPartIds))throw Error('Missing remaining-family semantics');
 if(b.remainingRole==='direct-effect'){
  if(b.partIds.some(id=>!d.coverage.effectPartIds.includes(id)))throw Error('Unreviewed direct effect');
 }else if(b.remainingRole==='condition-benefit'){
  if(!d.coverage.conditionPartIds.length||b.partIds.some(id=>a.partIds.includes(id)))throw Error('Condition display cannot complete independent effects');
 }else throw Error('Missing remaining-family role');
 if(b.isBuff&&b.stacking!=='highest-active-buff-of-same-type-only')throw Error('Same-type Buffs only use the highest active value');
 if(b.realClockPredicate?.basis==='game-local-clock'&&b.realClockPredicate.startInclusive){
  const c=b.realClockPredicate;if(!['06:00','18:00'].includes(c.startInclusive)||c.endExclusive!==(c.startInclusive==='06:00'?'18:00':'06:00')||c.crossesMidnight!==(c.startInclusive==='18:00'))throw Error('Real clock must preserve half-open day/night boundaries');
 }
 if(b.operation==='conditional-target-priority'&&(b.branchMode!=='mutually-exclusive'||b.valuePercent!==undefined))throw Error('Sex-specific aggro branches cannot add together');
 if(b.operation==='target-priority-change'&&b.valuePercent!==undefined)throw Error('Target priority uses points, not percentages');
 if(key==='hp-consumption'&&(b.operation!=='current-hp-drain'||b.changesMaximumHP!==false||b.minimumHpStatus!=='unconfirmed'||b.minimumHp!==undefined))throw Error('Continuous HP loss must not invent an HP floor');
 if(b.operation==='stun-ease-up'&&(b.valuePercent!==undefined||!b.pendingPartIds.length))throw Error('Unquantified stun buildup must remain pending');
 if(['stun-duration-down','stun-resistance-up'].includes(b.operation)&&(b.changesParalysisResistance!==false||b.grantsAllAilmentImmunity!==false||b.magnitudeStatus!=='unconfirmed'||b.valuePercent!==undefined))throw Error('Stun resistance cannot become paralysis or all-ailment immunity');
 if(b.partyPredicate?.mode==='solo-entry'&&b.partyPredicate.downedAlliesDoNotQualify!==true)throw Error('Solo entry differs from being the only survivor');
 if(b.partyPredicate?.mode==='exact-other-same-skill-pair'&&(b.partyPredicate.otherEquippedCount!==1||!b.partyPredicate.requiredSkillId))throw Error('Pair needs exactly one other matching holder');
 if(b.partyPredicate?.mode?.includes('any-allowed-race')&&(b.partyPredicate.logicalOperator!=='OR-per-unit'||b.partyPredicate.eachUnitCountsOnce!==true))throw Error('Alternative races match once per unit');
 if(b.triggerLimit?.scope==='pair'&&(b.triggerLimit.maximum!==1||b.triggerLimit.eachHolderHasSeparateUse!==false))throw Error('A pair shares one trigger');
 if(b.operation==='reset-accumulation'&&(b.trigger?.event!=='wave-start'||b.grantsMaximumAtStart!==false))throw Error('Wave reset cannot grant maximum growth immediately');
 if(b.battleClock?.selection==='one-random-element-wall'&&b.battleClock.simultaneousSixWalls!==false)throw Error('Each wall tick grants one random wall');
 if(b.operation==='survive-lethal-damage'&&(b.doesRevive!==false||b.maxTriggers!==1||b.resetScopeStatus!=='unconfirmed'))throw Error('Survival is not revival and its reset scope remains unknown');
}
