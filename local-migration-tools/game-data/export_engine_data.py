"""Export the master rows the battle-script sandbox (dist/engine) needs, split for the browser.

Usage: python3 export_engine_data.py <reader output dir with *.bin> <dist/game-data dir>

Writes <out>/engine/core.json       ProcessMst, ProcessCondMst, BuffMst (complete)
       <out>/engine/p/<id//10000>.json  every PassiveSkillMst row, bucketed by id, fetched on demand for passives a
                                    loadout carries that no other bundle has (learned from other characters)
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
    'UnitDressMst': ['UNIT_DRESS_ID', 'NAME', 'UNIT_ID', 'EQUIP_TYPE_INFO', 'PARAMETER_INFO', 'RESIST_ELEM_INFO', 'RESIST_STATUS_INFO', 'CHARACTER_TYPE', 'CRITICAL_RATE', 'PRESET_SKILL', 'PRESET_SKILL2', 'SKILL_SLOT_INFO', 'SKILL_SLOT_INFO2', 'PERSONAL_SKILL', 'CHARACTER_INFO', 'ADD_PASSIVE'],
    'ItemEquipMst': ['ITEM_EQUIP_ID', 'NAME', 'RARE', 'EQUIP_TYPE', 'ELEM', 'PARAMETER_INFO', 'RESIST_ELEM_INFO', 'PASSIVE_SKILL_INFO', 'UNIT_DRESS_ID', 'MAX_LV', 'EQUIP_GROWTH_TYPE', 'PARAMETER_MAX_INFO', 'SUB_TYPE'],
    # out-of-battle panel: level growth (GrowthMst, one curve, GROWTH_ID 2), awakening and ability-board stat pieces
    'GrowthMst': ['GROWTH_ID', 'GROWTH_RATE'],
    'ItemEquipParameterGrowthMst': ['EQUIP_GROWTH_TYPE', 'PARAM_MAP'],
    'UnitDressAwakeMst': ['UNIT_DRESS_ID', 'AWAKE_LV', 'HP', 'MP', 'ATK', 'DEF', 'MATK', 'MDEF'],
    'UnitDressLimitbreakMst': ['UNIT_DRESS_ID', 'LIMITBREAK_LV', 'MAX_LV'],
    'UnitDressAbilityPieceMst': ['UNIT_DRESS_ID', 'PIECE_NO', 'ABILITY_PIECE_TYPE', 'PARAM', 'LIMITBREAK_LV', 'SWITCH_INDEX'],
    # targets: boss-class monsters (their stats, race, resistances and own passives) for the calculator's target picker
    'MonsterMst': ['MONSTER_ID', 'NAME', 'LV', 'HP', 'MP', 'ATK', 'DEF', 'MATK', 'MDEF', 'CHARACTER_TYPE', 'CRITICAL_RATE', 'RESIST_ELEM_INFO', 'RESIST_STATUS_INFO', 'BREAK_TIME', 'PASSIVE_SKILL_INFO'],
    'MonsterPassiveSkillMst': ['MONSTER_PASSIVE_SKILL_ID', 'NAME', 'PROCESS_INFO'],
    # crests (徽章): the crest's own stats/resistances and the trait passive pool (reader v0.11 adds the group table)
    'CrestMst': ['CREST_ID', 'NAME', 'LV', 'RARE', 'PARAMETER_INFO', 'RESIST_ELEM_INFO', 'RESIST_STATUS_INFO', 'CREST_TRAIT_LOTTERY_GROUP_NUMBER'],
    'CrestTraitParameterGroupMst': ['CREST_TRAIT_PARAMETER_GROUP_NUMBER', 'PASSIVE_SKILL_ID', 'RATE'],  # (ORDER_NUMBER has a trailing space in the sheet)
    'CrestTraitLotteryMst': ['CREST_TRAIT_LOTTERY_GROUP_NUMBER', 'RANK', 'TRAIT_LOTTERY_NUMBER', 'RATE', 'IS_DUPLICATE_ALLOWED', 'CREST_TRAIT_PARAMETER_GROUP_NUMBER'],
}
CREST_TRAIT_RANGE = (5000000, 5200000)  # PassiveSkillMst ids of the crest trait pool (family 5xxx + rank/parameter suffix)
MONSTER_MIN_HP = 500000  # below this the rows are stage fodder; the calculator targets bosses

def ints(s):
    return [int(x) for x in str(s or '').split(':') if x.strip().lstrip('-').isdigit()]

def table(name, rows):
    cols = COLS[name]
    return {'cols': cols, 'rows': [[r[c] for c in cols] for r in rows]}

def main(src, out):
    T = {n: load(os.path.join(src, n + '.bin'))[1] for n in ['ProcessMst', 'ProcessCondMst', 'BuffMst', 'PassiveSkillMst', 'SkillMst', 'BulletMst', 'BulletLvInfoMst', 'UnitDressMst', 'UnitDressAbilityPieceMst', 'UnitDressAwakeMst', 'UnitDressLimitbreakMst', 'ItemEquipMst', 'ArkMst']}
    # growth curves arrive with reader v0.10; older dumps simply leave them out (dist/engine/panel.mjs keeps the verified Lv120 rate)
    for n in ['GrowthMst', 'ItemEquipParameterGrowthMst', 'MonsterMst', 'MonsterPassiveSkillMst', 'CrestMst', 'CrestTraitParameterGroupMst', 'CrestTraitLotteryMst']:
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

    # Loadout-report bitmasks (CommonUtil.FlagDecryptor) index SWITCH_INDEX; the game maps it back to an id in
    # master row order, first row wins on duplicates (PassiveSkillDataHolder.SwitchIndexToSkillId).
    switch = {}
    for name, key in (('PassiveSkillMst', 'PASSIVE_SKILL_ID'), ('SkillMst', 'SKILL_ID')):
        seen, pairs = set(), []
        for r in T[name]:
            si = r.get('SWITCH_INDEX')
            if si is None or si in seen: continue
            seen.add(si); pairs.append([si, r[key]])
        switch[name] = pairs
    size = dump(os.path.join(eng, 'switch.json'), switch)
    print('switch.json', size)

    # Targets: one row per distinct (name, level, stats, race, resistances, passives) among boss-class monsters,
    # plus the monster passives they reference (same shape as PassiveSkillMst; separate id space).
    if T['MonsterMst'] is not None:
        seen, monsters, mp_ids = set(), [], set()
        for r in T['MonsterMst']:
            if r['HP'] < MONSTER_MIN_HP or 'coming soon' in str(r['NAME']): continue
            key = (r['NAME'], r['LV'], r['HP'], r['ATK'], r['DEF'], r['MATK'], r['MDEF'], r['CHARACTER_TYPE'], r['RESIST_ELEM_INFO'], r['PASSIVE_SKILL_INFO'])
            if key in seen: continue
            seen.add(key); monsters.append(r)
            for part in str(r['PASSIVE_SKILL_INFO']).split('-'):
                f = part.split(':')
                if len(f) == 2 and f[1].isdigit(): mp_ids.add(int(f[1]))
        # PROCESS_INFO padding ('@:::::::::::' empty segments, trailing empty fields) carries no data: parseProcessInfo
        # skips empty segments and the scripts see missing parameters as 0
        compact = lambda info: '@'.join(seg.rstrip(':') for seg in str(info).split('@') if seg.strip(':'))
        mps = [dict(r, PROCESS_INFO=compact(r['PROCESS_INFO'])) for r in (T['MonsterPassiveSkillMst'] or []) if r['MONSTER_PASSIVE_SKILL_ID'] in mp_ids]
        size = dump(os.path.join(eng, 'monsters.json'), {'MonsterMst': table('MonsterMst', monsters)})
        size2 = dump(os.path.join(eng, 'monster-passives.json'), {'MonsterPassiveSkillMst': table('MonsterPassiveSkillMst', mps)})
        print('monsters.json', size, 'monsters', len(monsters), '| monster-passives.json', size2, 'passives', len(mps))

    # Equippable common passives (SC cost 1–99; 99 marks special free-slot passives such as 迷宮踏破; ids ≥ 5,000,000 are crest traits, 7xxxxxxx the characters' own transcend passives)
    # for the calculator's loadout builder: id, name (traditional + simplified), SC.
    try:
        from cc import t2s
    except Exception:
        t2s = lambda x: x
    pool = [r for r in T['PassiveSkillMst'] if 0 < r['COST'] <= 99 and r['PASSIVE_SKILL_ID'] < 5000000 and 'coming soon' not in str(r['NAME'])]
    strip = lambda s: __import__('re').sub(r'<[^>]+>', '', str(s or '')).strip()
    idx = {'cols': ['PASSIVE_SKILL_ID', 'NAME', 'NAME_S', 'COST', 'SORT_ORDER'], 'rows': [[r['PASSIVE_SKILL_ID'], strip(r['NAME']), t2s(strip(r['NAME'])), r['COST'], r['SORT_ORDER']] for r in pool]}
    size = dump(os.path.join(eng, 'passive-index.json'), idx)
    print('passive-index.json', size, 'passives', len(pool))

    # Every passive, bucketed by id // 10000 (≈1.4 MB in 105 files): a loadout report can carry passives learned
    # from any character, so the panel fetches the missing buckets on demand (engine-data.mjs loadPassives).
    compact_info = lambda info: '@'.join(seg.rstrip(':') for seg in str(info).split('@') if seg.strip(':'))
    buckets = collections.defaultdict(list)
    for r in T['PassiveSkillMst']: buckets[r['PASSIVE_SKILL_ID'] // 10000].append(dict(r, PROCESS_INFO=compact_info(r['PROCESS_INFO'])))
    psize = 0
    for k, rs in buckets.items(): psize += dump(os.path.join(eng, 'p', f'{k}.json'), {'PassiveSkillMst': table('PassiveSkillMst', rs)})
    print('p/*.json', psize, 'buckets', len(buckets))

    # Crests: CrestMst (stats per crest id) + the trait passive pool, loaded on demand when a loadout carries a crest.
    if T['CrestMst'] is not None:
        pool = {p for p in ps if CREST_TRAIT_RANGE[0] <= p < CREST_TRAIT_RANGE[1]}
        if T['CrestTraitParameterGroupMst'] is not None: pool.update(r['PASSIVE_SKILL_ID'] for r in T['CrestTraitParameterGroupMst'] if r['PASSIVE_SKILL_ID'] in ps)
        crests = bundle(pool, set())
        crests['CrestMst'] = table('CrestMst', T['CrestMst'])
        for n in ['CrestTraitParameterGroupMst', 'CrestTraitLotteryMst']:
            if T[n] is not None: crests[n] = table(n, T[n])
        size = dump(os.path.join(eng, 'crests.json'), crests)
        print('crests.json', size, 'crests', len(crests['CrestMst']['rows']), 'trait passives', len(crests['PassiveSkillMst']['rows']))

    total = 0
    for u in T['UnitDressMst']:
        if 'coming soon' in str(u['NAME']): continue
        uid = u['UNIT_DRESS_ID']
        # ADD_PASSIVE: passives the dress always carries (e.g. 101270 魔王凯娜雷殊 28586:28587 — 终剧增益效果中 攻防魔 +80%…;
        # added 2026-09-30 after 忘却终焉 showed no effect)
        p_ids, s_ids = set(ints(u['PERSONAL_SKILL'])) | set(ints(u.get('ADD_PASSIVE'))), set()
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
        # the character's whole ability board (stat / resist pieces for the panel; skill, personality, magic and
        # passive pieces so a loadout report's opened-piece bitmask (over SWITCH_INDEX) can be applied)
        data['UnitDressAbilityPieceMst'] = table('UnitDressAbilityPieceMst', pieces.get(uid, []))
        total += dump(os.path.join(eng, 'c', f'{uid}.json'), data)
    print('characters total', total)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
