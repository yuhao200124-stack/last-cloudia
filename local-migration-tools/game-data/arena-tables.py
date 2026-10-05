# 竞技场（PvP）计算用的两张表（2026-10-05）：
#   python3 local-migration-tools/game-data/arena-tables.py   → dist/game-data/engine/arena.json
# formations：FormationMst（阵型编号 → 简体名字、站位格 OFFSET_INFO、效果段 PROCESS_INFO）。来自 PvP 读取器的主数据导出
#   （tests/fixtures/pvp/formation-mst.json，同一份）。
# arkLevels：ArkLvMst 每个圣物每一级的属性和效果段（对手的圣物不一定满级；arks.json 只有最高级）。
# arkSkillLevels：ArkSkillLvMst 每一级的被动圣物技能效果段。
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from sheet import load
from cc import t2s
U = '/mnt/user-data/uploads/LastCloudiaLoadoutReader-v0.6/'
T = os.path.join(HERE, 'ark-tables') + '/'
ROOT = os.path.join(HERE, '..', '..')
OUT = os.path.join(ROOT, 'dist', 'game-data', 'engine', 'arena.json')
F = json.load(open(os.path.join(ROOT, 'tests', 'fixtures', 'pvp', 'formation-mst.json'), encoding='utf-8'))['FormationMst']['rows']
formations = {str(r['FORMATION_ID']): {'name': t2s(r['NAME']), 'offsets': r['OFFSET_INFO'], 'process': r['PROCESS_INFO']} for r in F if r['FORMATION_ID'] < 900000}
_, LV = load(T + 'ArkLvMst.bin')
_, SKL = load(U + 'ArkSkillLvMst.bin')
ark = {}
for r in LV: ark.setdefault(str(r['ARK_ID']), {})[str(r['LV'])] = {'stats': [r['HP'], r['MP'], r['ATK'], r['DEF'], r['MATK'], r['MDEF']], 'process': r['PROCESS_INFO']}
skl = {}
for r in SKL: skl.setdefault(str(r['ARK_ID']), {})[str(r['LV'])] = r['PROCESS_INFO']
out = {'note': '竞技场计算用：formations＝FormationMst（阵型效果段）；arkLevels＝ArkLvMst 每一级的属性［HP,MP,攻击,防御,魔力,精神］和效果段；arkSkillLevels＝ArkSkillLvMst 每一级的效果段。local-migration-tools/game-data/arena-tables.py 生成。',
       'formations': formations, 'arkLevels': ark, 'arkSkillLevels': skl}
with open(OUT, 'w', encoding='utf-8') as f: json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print(json.dumps({'formations': len(formations), 'arks': len(ark), 'arkSkills': len(skl), 'bytes': os.path.getsize(OUT)}, ensure_ascii=False))
