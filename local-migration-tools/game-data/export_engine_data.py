"""Export the master rows the battle-script sandbox (dist/engine) needs, split for the browser.

Usage: python3 export_engine_data.py <reader output dir with *.bin> <dist/game-data dir>

Writes <out>/engine/core.json       ProcessMst, ProcessCondMst, BuffMst (complete)
       <out>/engine/shared.json     player-usable rows every character may need: blessings, common/relic/
                                    equipment passives, magic & ark skills and their bullets, ItemEquipMst
       <out>/engine/c/<dress>.json  the character's own passives (own, personality, transcend, exclusive
                                    gear) and skills (+ enhanced variants) with their bullets
Tables keep the {"cols": [...], "rows": [[...]]} shape used by dist/engine/battle.mjs (Master).
"""
import collections, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sheet import load

COLS = {
    'ProcessMst': ['PROCESS_ID', 'NAME', 'PROCESS_COND', 'PROCESS_COND_PARAM', 'UNIT_COND', 'PRIORITY', 'MISS_TYPE', 'OPE_WAY', 'OPE_INFO', 'OPE_EFFECT', 'SOURCE', 'TARGET', 'USE_SCRIPT', 'REF_BULLET', 'REF_PROCESS', 'PROCESS_CATEGORY', 'PARAM_BEHAVIOR'],
    'ProcessCondMst': ['PROCESS_COND_ID', 'NAME', 'HAPPEN_COND', 'LUA_FUNC_NAME'],
    'BuffMst': ['BUFF_ID', 'NAME', 'PROCESS_COND', 'PROCESS_COND_PARAM', 'UNIT_COND', 'PRIORITY', 'OPE_WAY', 'OPE_EFFECT', 'PROCESS_OPE_TYPE', 'SOURCE', 'TARGET', 'USE_SCRIPT', 'PROCESS_CATEGORY', 'BUFF_TYPE', 'BUFF_CATEGORY', 'BUFF_GROUP', 'BUFF_ICON_ID'],
    'PassiveSkillMst': ['PASSIVE_SKILL_ID', 'NAME', 'COST', 'SWITCH_INDEX', 'PROCESS_INFO'],
    'SkillMst': ['SKILL_ID', 'NAME', 'SKILL_TYPE', 'SKILL_DEPENDENT', 'SKILL_ROLE', 'SKILL_ROLE_DETAIL', 'ELEM', 'INHERIT_WEAPON_ELEM', 'KILLER_INFO', 'NEED_AP', 'USE_CNT', 'INVOKE_COST', 'ABSOLUTE_LV', 'SKILL_PARAM', 'TARGET_INFO', 'COST', 'BULLET_INFO'],
    'BulletMst': ['BULLET_ID', 'NAME', 'PARAM', 'HIT_DAMAGE'],
    'BulletLvInfoMst': ['BULLET_ID', 'LV', 'BULLET_PARAM', 'PROCESS_INFO'],
    'UnitDressMst': ['UNIT_DRESS_ID', 'NAME', 'UNIT_ID', 'EQUIP_TYPE_INFO', 'PARAMETER_INFO', 'RESIST_ELEM_INFO', 'RESIST_STATUS_INFO', 'CHARACTER_TYPE', 'CRITICAL_RATE', 'PRESET_SKILL', 'PRESET_SKILL2', 'SKILL_SLOT_INFO', 'SKILL_SLOT_INFO2', 'PERSONAL_SKILL', 'CHARACTER_INFO'],
    'ItemEquipMst': ['ITEM_EQUIP_ID', 'NAME', 'RARE', 'EQUIP_TYPE', 'ELEM', 'PARAMETER_INFO', 'RESIST_ELEM_INFO', 'PASSIVE_SKILL_INFO', 'UNIT_DRESS_ID', 'MAX_LV', 'EQUIP_GROWTH_TYPE', 'PARAMETER_MAX_INFO', 'SUB_TYPE'],
    # out-of-battle panel: level growth (GrowthMst, one curve, GROWTH_ID 2), awakening and ability-board stat pieces
    'GrowthMst': ['GROWTH_ID', 'GROWTH_RATE'],
    'ItemEquipParameterGrowthMst': ['EQUIP_GROWTH_TYPE', 'PARAM_MAP'],
    'UnitDressAwakeMst': ['UNIT_DRESS_ID', 'AWAKE_LV', 'HP', 'MP', 'ATK', 'DEF', 'MATK', 'MDEF'],
    'UnitDressLimitbreakMst': ['UNIT_DRESS_ID', 'LIMITBREAK_LV', 'MAX_LV'],
    'UnitDressAbilityPieceMst': ['UNIT_DRESS_ID', 'PIECE_NO', 'ABILITY_PIECE_TYPE', 'PARAM', 'LIMITBREAK_LV'],
}

def ints(s):
    return [int(x) for x in str(s or '').split(':') if x.strip().lstrip('-').isdigit()]

def table(name, rows):
    cols = COLS[name]
    return {'cols': cols, 'rows': [[r[c] for c in cols] for r in rows]}

def main(src, out):
    T = {n: load(os.path.join(src, n + '.bin'))[1] for n in ['ProcessMst', 'ProcessCondMst', 'BuffMst', 'PassiveSkillMst', 'SkillMst', 'BulletMst', 'BulletLvInfoMst', 'UnitDressMst', 'UnitDressAbilityPieceMst', 'UnitDressAwakeMst', 'UnitDressLimitbreakMst', 'ItemEquipMst', 'ArkMst']}
    # growth curves arrive with reader v0.10; older dumps simply leave them out (dist/engine/panel.mjs keeps the verified Lv120 rate)
    for n in ['GrowthMst', 'ItemEquipParameterGrowthMst']:
        path = os.path.join(src, n + '.bin')
        T[n] = load(path)[1] if os.path.exists(path) else None
    ps = {r['PASSIVE_SKILL_ID']: r for r in T['PassiveSkillMst']}
    sk = {r['SKILL_ID']: r for r in T['SkillMst']}
    bm = {r['BULLET_ID']: r for r in T['BulletMst']}
    bl = collections.defaultdict(list)
    for r in T['BulletLvInfoMst']: bl[r['BULLET_ID']].append(r)
    pieces = collections.defaultdict(list)
    for r in T['UnitDressAbilityPieceMst']: pieces[r['UNIT_DRESS_ID']].append(r)

    def with_enhanced(skill_ids):
        out_ids = set()
        for s in skill_ids:
            if s in sk: out_ids.add(s)
            # An empty pre-enhancement entry defers to the enhanced version (same name, id + 100000).
            if s + 100000 in sk and sk[s + 100000]['NAME'] == sk.get(s, {}).get('NAME'): out_ids.add(s + 100000)
        return out_ids

    def bullets_of(skill_ids):
        ids = set()
        for s in skill_ids:
            ids.update(ints(sk[s]['BULLET_INFO']))
        return ids

    def bundle(passive_ids, skill_ids):
        skill_ids = with_enhanced(skill_ids)
        bullet_ids = bullets_of(skill_ids)
        return {
            'PassiveSkillMst': table('PassiveSkillMst', [ps[p] for p in sorted(passive_ids) if p in ps]),
            'SkillMst': table('SkillMst', [sk[s] for s in sorted(skill_ids)]),
            'BulletMst': table('BulletMst', [bm[b] for b in sorted(bullet_ids) if b in bm]),
            'BulletLvInfoMst': table('BulletLvInfoMst', [r for b in sorted(bullet_ids) for r in bl.get(b, [])]),
        }

    def dump(path, data):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        return os.path.getsize(path)

    eng = os.path.join(out, 'engine')
    size = dump(os.path.join(eng, 'core.json'), {n: table(n, T[n]) for n in ['ProcessMst', 'ProcessCondMst', 'BuffMst']})
    print('core.json', size)

    # Shared rows: blessings (6000xxxx), relic-learnable and equipment passives, ark skills, all magic/precast/summon skills.
    shared_p, shared_s = set(), set()
    for p in ps:
        if 60000000 <= p < 70000000: shared_p.add(p)
    for e in T['ItemEquipMst']: shared_p.update(ints(e['PASSIVE_SKILL_INFO']))
    for a in T['ArkMst']:
        shared_p.update(ints(a['LEARNING_SKILL_INFO']))
        if a['ARK_SKILL_ID']: shared_s.add(a['ARK_SKILL_ID'])
    # magic every character may learn (ability piece type 70) is shared; character skills stay per character
    for r in T['UnitDressAbilityPieceMst']:
        f = str(r['PARAM']).split(':')
        if r['ABILITY_PIECE_TYPE'] == 70 and f[0].isdigit(): shared_s.add(int(f[0]))
    shared = bundle(shared_p, shared_s)
    shared['ItemEquipMst'] = table('ItemEquipMst', T['ItemEquipMst'])
    shared['UnitDressMst'] = table('UnitDressMst', T['UnitDressMst'])
    shared['UnitDressAwakeMst'] = table('UnitDressAwakeMst', T['UnitDressAwakeMst'])
    shared['UnitDressLimitbreakMst'] = table('UnitDressLimitbreakMst', T['UnitDressLimitbreakMst'])
    for n in ['GrowthMst', 'ItemEquipParameterGrowthMst']:
        if T[n] is not None: shared[n] = table(n, T[n])
    size = dump(os.path.join(eng, 'shared.json'), shared)
    print('shared.json', size, 'passives', len(shared['PassiveSkillMst']['rows']), 'skills', len(shared['SkillMst']['rows']), 'bullets', len(shared['BulletMst']['rows']))

    total = 0
    for u in T['UnitDressMst']:
        if 'coming soon' in str(u['NAME']): continue
        uid = u['UNIT_DRESS_ID']
        p_ids, s_ids = set(ints(u['PERSONAL_SKILL'])), set()
        for key in ('PRESET_SKILL', 'PRESET_SKILL2', 'SKILL_SLOT_INFO', 'SKILL_SLOT_INFO2'): s_ids.update(x for x in ints(u[key]) if x)
        for r in pieces.get(uid, []):
            t, f = r['ABILITY_PIECE_TYPE'], str(r['PARAM']).split(':')
            if not f[0].isdigit(): continue
            v = int(f[0])
            if t in (50, 51): s_ids.add(v)
            elif t in (60, 61, 80, 100): p_ids.add(v)
            elif t == 70: s_ids.add(v)
        for e in T['ItemEquipMst']:
            if e['UNIT_DRESS_ID'] == uid: p_ids.update(ints(e['PASSIVE_SKILL_INFO']))
        data = bundle(p_ids - shared_p, s_ids - shared_s)
        # the character's ability board (stat / resist pieces and which limit break opens them) for the out-of-battle panel
        data['UnitDressAbilityPieceMst'] = table('UnitDressAbilityPieceMst', [r for r in pieces.get(uid, []) if r['ABILITY_PIECE_TYPE'] in (10, 11, 12, 13, 14, 15, 30, 40)])
        total += dump(os.path.join(eng, 'c', f'{uid}.json'), data)
    print('characters total', total)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
