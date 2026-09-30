# Every piece of equipment for the damage calculator's 装备 slots (2026-09-30, user: “把武器系统完成”):
#   python3 local-migration-tools/game-data/equipment.py   → dist/game-data/equipment.json
# From the reader's ItemEquipMst / PassiveSkillMst (LastCloudiaLoadoutReader-v0.6). Per item: id, simplified name,
# EQUIP_TYPE, RARE, element, stats at max level (PARAMETER_MAX_INFO; PARAMETER_INFO when the item has no levels),
# its passives (an exclusive item's at its highest enhancement stage, gametext.max_enhanced), the character it
# belongs to (UNIT_DRESS_ID, 0 = anyone), SERIAL_NUM and whether it is the top tier of its SERIAL_NUM (the higher
# RARE is the upgrade); and each passive's effect text (PROCESS_EXPLAIN with its “?” filled, simplified).
import os, sys, json, collections
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from sheet import load
from cc import t2s
from gametext import clean, filled, max_enhanced

U = '/mnt/user-data/uploads/LastCloudiaLoadoutReader-v0.6/'
OUT = os.path.join(HERE, '..', '..', 'dist', 'game-data', 'equipment.json')
_, EQ = load(U + 'ItemEquipMst.bin')
_, PS = load(U + 'PassiveSkillMst.bin'); ps = {r['PASSIVE_SKILL_ID']: r for r in PS}
names = {pid: r['NAME'] for pid, r in ps.items()}; by_name = collections.defaultdict(list)
for pid, r in ps.items(): by_name[r['NAME']].append(pid)

ints = lambda s: [int(x) for x in str(s).replace('@', ':').split(':') if x.strip().lstrip('-').isdigit() and int(x)]
top = {}
for e in EQ:
    k = e['SERIAL_NUM'] or e['ITEM_EQUIP_ID']; b = top.get(k)
    if not b or (e['RARE'], e['ITEM_EQUIP_ID']) > (b['RARE'], b['ITEM_EQUIP_ID']): top[k] = e
items, texts = [], {}
for e in sorted(EQ, key=lambda r: r['ITEM_EQUIP_ID']):
    if e['EQUIP_TYPE'] == 40: continue          # 外观: no stats, no passives
    pids = [p for p in ints(e['PASSIVE_SKILL_INFO']) if p in ps]
    if e['UNIT_DRESS_ID']: pids = [max_enhanced(p, by_name, names) for p in pids]
    for p in pids: texts[p] = t2s(clean(filled(ps[p])))
    stats = e['PARAMETER_MAX_INFO'] if e['MAX_LV'] and any(ints(e['PARAMETER_MAX_INFO'])) else e['PARAMETER_INFO']
    k = e['SERIAL_NUM'] or e['ITEM_EQUIP_ID']
    items.append([e['ITEM_EQUIP_ID'], t2s(clean(e['NAME'])), e['EQUIP_TYPE'], e['RARE'], e['ELEM'], stats, pids, e['UNIT_DRESS_ID'], e['SERIAL_NUM'], 1 if top[k] is e else 0])
out = {'note': '全部装备（外观除外）：local-migration-tools/game-data/equipment.py 从 ItemEquipMst / PassiveSkillMst 生成。stats＝满级六项 HP:MP:STR:DEF:INT:MND；passives＝装备效果（专属装备取最高强化阶段）；top＝同 SERIAL_NUM 里稀有度最高的一阶。',
       'cols': ['id', 'name', 'type', 'rare', 'elem', 'stats', 'passives', 'dress', 'serial', 'top'], 'items': items,
       'passiveText': {str(k): v for k, v in sorted(texts.items())}}
with open(OUT, 'w', encoding='utf-8') as f: json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print(json.dumps({'items': len(items), 'top': sum(i[9] for i in items), 'passives': len(texts), 'bytes': os.path.getsize(OUT)}))
