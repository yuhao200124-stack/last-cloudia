# Every ark (圣物) at its top level for the damage calculator's 添加圣物 (2026-09-30, user: “圣物直接按照最大的算”):
#   python3 local-migration-tools/game-data/arks.py   → dist/game-data/arks.json
# UnitUtil.CalcUnitStatus adds an ark after the equipment and the crest (UnitUtil.AddArkParameter → CalcArkStatus), and
# CalcArkStatus reads ArkLvMst (ark id, level): HP / MP / ATK / DEF / MATK / MDEF and the level's PROCESS_INFO (the ark's
# effect). ArkPurityMst only changes AP (its stat columns are all 0). The three tables came from loadout reader v0.13
# (local-migration-tools/game-data/ark-tables/); ArkMst from the v0.6 export. Per ark: id, simplified name, rarity,
# top level, stats at that level, the level's PROCESS_INFO and its text (the “?” filled), the passives it teaches, and
# a passive ark skill's top level (ArkSkillLvMst) when it has one.
import os, sys, json, collections, re
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from sheet import load
from cc import t2s
from gametext import clean, filled

U = '/mnt/user-data/uploads/LastCloudiaLoadoutReader-v0.6/'
T = os.path.join(HERE, 'ark-tables') + '/'
OUT = os.path.join(HERE, '..', '..', 'dist', 'game-data', 'arks.json')
RARE = {1: 'R', 2: 'SR', 3: 'SSR', 4: 'LR', 5: 'UR'}      # ArkMst RARE 4 = LR, 5 = UR (checked against Altema, 2026-09-30)

_, ARK = load(U + 'ArkMst.bin')
_, LV = load(T + 'ArkLvMst.bin')
_, SKL = load(U + 'ArkSkillLvMst.bin')
top = {}
for r in LV:
    if r['ARK_ID'] not in top or r['LV'] > top[r['ARK_ID']]['LV']: top[r['ARK_ID']] = r
skill_top = {}
for r in SKL:
    if r['ARK_ID'] not in skill_top or r['LV'] > skill_top[r['ARK_ID']]['LV']: skill_top[r['ARK_ID']] = r
text = lambda r: t2s(clean(filled(r))) if str(r.get('PROCESS_EXPLAIN') or '').strip() else ''
items = []
for a in sorted(ARK, key=lambda r: (-r['RARE'], -r['SORT_ORDER'])):
    name = clean(a['NAME'])
    if not name or re.match(r'^Ark\d+$', name) or 'coming soon' in name.lower(): continue    # test / unreleased rows
    r = top.get(a['ARK_ID'])
    if not r: continue
    teaches = [int(x.split(':')[-1]) for x in str(a['LEARNING_SKILL_INFO']).split(',') if x.split(':')[-1].strip().isdigit()]
    sk = skill_top.get(a['ARK_ID'])
    items.append({'id': a['ARK_ID'], 'name': t2s(name), 'rarity': RARE.get(a['RARE'], str(a['RARE'])), 'level': r['LV'],
                  'stats': [r['HP'], r['MP'], r['ATK'], r['DEF'], r['MATK'], r['MDEF']],
                  'process': r['PROCESS_INFO'], 'text': text(r), 'teaches': teaches,
                  **({'skill': {'level': sk['LV'], 'process': sk['PROCESS_INFO'], 'text': text(sk)}} if sk else {})})
out = {'note': '全部圣物（测试和未上线的除外）按最高等级：local-migration-tools/game-data/arks.py 从 ArkMst / ArkLvMst / ArkSkillLvMst 生成。stats＝最高等级的 HP、MP、攻击、防御、魔力、精神（游戏在装备、徽章之后加进面板）；process／text＝该等级的圣物效果；teaches＝可学技能；skill＝被动型圣物技能的最高等级。',
       'items': items}
with open(OUT, 'w', encoding='utf-8') as f: json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print(json.dumps({'arks': len(items), 'withText': sum(1 for i in items if i['text']), 'withSkill': sum(1 for i in items if 'skill' in i), 'bytes': os.path.getsize(OUT)}, ensure_ascii=False))
