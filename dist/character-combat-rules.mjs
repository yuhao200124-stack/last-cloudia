// Only character-specific exceptions belong here. Core engines consume these
// scoped records; ordinary dual wield has no universal 2-hit / 0.6 preset.
export const CHARACTER_COMBAT_RULES=Object.freeze({
 '260':{exclusiveSources:['water-king'],hitRules:[{sourceId:'water-king',ruleId:'water-ice-hits',attackKind:'magic',element:'ice',excludedMagicFamilies:['science','sword','other'],multiplier:2,ratio:0.6,stage:'core'}],legacyHitRevision:2},
});
export function characterSourceAllowed(characterId,sourceId) {
 const owners=Object.entries(CHARACTER_COMBAT_RULES).filter(([,r])=>r.exclusiveSources.includes(sourceId)).map(([id])=>id);
 return !owners.length||owners.includes(String(characterId));
}
export function characterHitStage(characterId,entry,context) {
 const match=CHARACTER_COMBAT_RULES[String(characterId)]?.hitRules.find(r=>r.sourceId===entry.sourceId&&r.ruleId===entry.ruleId&&r.attackKind===context.attackKind&&r.element===context.element&&!r.excludedMagicFamilies.includes(context.magicFamily)&&r.multiplier===entry.effect.value&&r.ratio===entry.effect.secondary);
 return match?.stage;
}
export function migrateCharacterHitDrafts(characterId,saved,drafts) {
 const rules=CHARACTER_COMBAT_RULES[String(characterId)];
 if(!rules||saved.hitMechanicsRevision===rules.legacyHitRevision)return;
 const s=saved.selection||{},key=`${s.attack}:${s.preset||'unselected'}:dual`,p=drafts[key];
 if(!p)return;
 for(const rule of rules.hitRules)if(['magic','heavy_magic'].includes(s.attack)&&s.element==='冰'&&p.hitScaleStage==='beforeCap'&&(p.hitMultiplier==null||Number(p.hitMultiplier)===rule.multiplier)&&(p.hitDamageRatio==null||Number(p.hitDamageRatio)===rule.ratio))delete p.hitScaleStage;
}
