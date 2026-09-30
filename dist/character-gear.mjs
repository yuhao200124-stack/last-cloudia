// Each character's exclusive gear for the calculator's 专武 selector: the option ids and the items' real display
// names (verified against dist/game-data; for 梅莉 the further-upgraded tier's name, since enhancement is taken at
// its maximum). The listed order is the selector's order and the slot order when every item is worn (the first
// weapon in the weapon slot). Kept from the old rule template when the old calculator was removed.
const GEAR = {
  '182': { '182-equipment-1693': { name: '崇神狂翼基格罗亚' }, '182-equipment-1694': { name: '魔祸呪翼格吉尔斯' } },
  '259': { '259-equipment-42': { name: '艾莉丝之剑' }, '259-equipment-43': { name: '艾莉丝的衣服' } },
  '260': { 'roxy-staff': { name: '洛琪希之魔杖' }, 'roxy-robe': { name: '洛琪希的衣服' } },
  '257': { '257-equipment-106091': { name: '幻夜之魔暗锁' }, '257-equipment-304560': { name: '魔想羁绊项链' } },
  '261': { '261-equipment-101315': { name: '神裁剑奥尔迪尔' }, '261-equipment-201127': { name: '天裁神的圣铠' } },
};
export const characterGear = id => GEAR[String(id)] || {};
