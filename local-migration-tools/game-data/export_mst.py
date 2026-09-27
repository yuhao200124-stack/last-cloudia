"""Export the master tables the battle-script sandbox needs to compact JSON.

Usage: python3 export_mst.py <reader output dir with *.bin> <out dir>
Each table becomes {"cols": [...], "rows": [[...], ...]} with only the columns listed below.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sheet import load

TABLES = {
    'ProcessMst': ['PROCESS_ID', 'NAME', 'PROCESS_COND', 'PROCESS_COND_PARAM', 'UNIT_COND', 'PRIORITY', 'MISS_TYPE', 'OPE_WAY', 'OPE_INFO', 'OPE_EFFECT', 'SOURCE', 'TARGET', 'USE_SCRIPT', 'REF_BULLET', 'REF_PROCESS', 'PROCESS_CATEGORY', 'PARAM_BEHAVIOR'],
    'ProcessCondMst': ['PROCESS_COND_ID', 'NAME', 'HAPPEN_COND', 'LUA_FUNC_NAME'],
    'ProcessOpeTypeMst': ['PROCESS_OPE_TYPE', 'NAME'],
    'BuffMst': ['BUFF_ID', 'NAME', 'PROCESS_COND', 'PROCESS_COND_PARAM', 'UNIT_COND', 'PRIORITY', 'OPE_WAY', 'OPE_EFFECT', 'PROCESS_OPE_TYPE', 'SOURCE', 'TARGET', 'USE_SCRIPT', 'PROCESS_CATEGORY', 'BUFF_TYPE', 'BUFF_CATEGORY', 'BUFF_GROUP', 'BUFF_ICON_ID'],
    'PassiveSkillMst': ['PASSIVE_SKILL_ID', 'NAME', 'COST', 'NEED_AP', 'SWITCH_INDEX', 'PROCESS_INFO'],
    'SkillMst': ['SKILL_ID', 'NAME', 'SKILL_TYPE', 'SKILL_DEPENDENT', 'SKILL_ROLE', 'SKILL_ROLE_DETAIL', 'ELEM', 'INHERIT_WEAPON_ELEM', 'KILLER_INFO', 'NEED_AP', 'USE_CNT', 'INVOKE_COST', 'ABSOLUTE_LV', 'SKILL_PARAM', 'TARGET_INFO', 'COST', 'BULLET_INFO'],
    'BulletMst': ['BULLET_ID', 'NAME', 'PARAM', 'HIT_DAMAGE'],
    'BulletLvInfoMst': ['BULLET_ID', 'LV', 'BULLET_PARAM', 'PROCESS_INFO'],
    'UnitDressMst': ['UNIT_DRESS_ID', 'NAME', 'UNIT_ID', 'EQUIP_TYPE_INFO', 'PARAMETER_INFO', 'RESIST_ELEM_INFO', 'RESIST_STATUS_INFO', 'CHARACTER_TYPE', 'CRITICAL_RATE', 'PRESET_SKILL', 'PRESET_SKILL2', 'SKILL_SLOT_INFO', 'SKILL_SLOT_INFO2', 'PERSONAL_SKILL', 'CHARACTER_INFO'],
    'UnitDressAbilityPieceMst': None,
    'UnitDressAwakeMst': ['UNIT_DRESS_ID', 'AWAKE_LV', 'HP', 'MP', 'ATK', 'DEF', 'MATK', 'MDEF', 'SPECIAL_LV'],
    'UnitDressLimitbreakMst': ['UNIT_DRESS_ID', 'LIMITBREAK_LV', 'MAX_LV', 'SWITCH_EFFECT'],
    'ItemEquipMst': ['ITEM_EQUIP_ID', 'NAME', 'RARE', 'EQUIP_TYPE', 'ELEM', 'PARAMETER_INFO', 'RESIST_ELEM_INFO', 'RESIST_STATUS_INFO', 'PASSIVE_SKILL_INFO', 'UNIT_DRESS_ID', 'MAX_LV', 'PARAMETER_MAX_INFO', 'SUB_TYPE'],
    'ArkMst': None,
    'ArkPartyTraitMst': None,
    'ArkSkillLvMst': None,
    'CrestMst': None,
    'SacredSkillMst': None,
}

def export(src, out):
    os.makedirs(out, exist_ok=True)
    for name, cols in TABLES.items():
        path = os.path.join(src, name + '.bin')
        if not os.path.exists(path):
            print('skip', name); continue
        allcols, rows = load(path)
        names = [c[0] for c in allcols]
        keep = cols or names
        data = {'table': name, 'cols': keep, 'rows': [[r[c] for c in keep] for r in rows]}
        with open(os.path.join(out, name + '.json'), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        print(name, len(rows), 'rows', os.path.getsize(os.path.join(out, name + '.json')), 'bytes')

if __name__ == '__main__':
    export(sys.argv[1], sys.argv[2])
