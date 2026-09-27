"""Code-based classification of Last Cloudia effects by damage-formula position.

Evidence chain (all from the game build the user supplied):
  * PROCESS_INFO -> ProcessMst row (USE_SCRIPT, OPE_WAY, OPE_INFO, PROCESS_COND, REF_PROCESS)
  * USE_SCRIPT=1 -> process<ID>/buff<ID> body in process.lua; wrappers in procCondCommon.lua
    map every Lua call to a native ControlType (c.ProcControl ... ControlTypes.X)
  * USE_SCRIPT=0 -> OPE_INFO is itself a ControlType (OPE_WAY=1: OPE_INFO is a BuffMst id)
  * PROCESS_COND -> ProcessCondMst.HAPPEN_COND = TriggerTypes (procCondCommon.lua)
  * Native pipeline (GameAssembly.dll):
      ProcessWork.ProcControlDamage 0x1865A90:
        bullet triggers (20/21/22) -> ProcStatus.CalcFinalStatus (attack stat A, defence D)
        -> ApplyBeforeDamagePassive 0x185B270 (trigger 23 attacker, 24 target) -> CalcFinalStatus again
        -> ProcessWork.CalcDamage 0x185C690:
             CalcElement -> CalcKiller(308/509) -> CheckDamagePower(attacker, 504)
             -> CheckDamagePower(target, 504) -> CheckReductionDamage(502/503)   == Q (step 2)
             -> ProcessUtils.CalcDamage 0x1840290 core A*0.9^(kD/A)*Q*U
             -> ApplyAfterDamagePassive 0x185AFF0 (trigger 27 attacker, 28 target):
                  Lua Bullet:EditDamagePer, one entry at a time, rounded   == step 3
             -> CombineDmgLimit (cap) -> guard -> ApplyRealTimeDamage
  * BulletFunc:EditDamagePer only works at triggers 27/28 (checked in procCondCommon.lua);
    every EditDamagePer in process.lua is on trigger 27 or 28.
"""
import sys, re, collections
sys.path.insert(0, '/home/claude/decode')
from sheet import load

U = '/mnt/user-data/uploads/LastCloudiaLoadoutReader-v0.6/'
M = '/mnt/user-data/uploads/LastCloudiaDamageReader-v0.41/evidence/mechanisms/'
PM = {r['PROCESS_ID']: r for r in load(U + 'ProcessMst.bin')[1]}
PC = {r['PROCESS_COND_ID']: r for r in load(U + 'ProcessCondMst.bin')[1]}
BM = {r['BUFF_ID']: r for r in load(U + 'BuffMst.bin')[1]}
src = open(M + 'process.lua', encoding='utf-8').read()
FN = {}
for m in re.finditer(r'^function (process|buff)(\d+)\(.*?\n(.*?)^end', src, re.S | re.M):
    FN[(m.group(1), int(m.group(2)))] = m.group(3)
_lc = open(M + 'luaCommon.lua', encoding='utf-8').read()
BID = {}
for _name in ('DebuffIds', 'BuffIds'):
    _bi = _lc[_lc.index(_name + ' = {'):]
    _bi = _bi[:re.search(r'^\}', _bi, re.M).end()]
    _pre = '' if _name == 'BuffIds' else 'D.'
    for m in re.finditer(r'^\t(\w+)\s*=\s*(\d+)\s*,', _bi, re.M):
        BID.setdefault(_pre + m.group(1), [int(m.group(2))])
    for m in re.finditer(r'^\t(\w+)\s*=\s*\{(.*?)^\t\}', _bi, re.M | re.S):
        BID.setdefault(_pre + m.group(1), [int(x) for x in re.findall(r'=\s*(\d+)', m.group(2))])

TRIG_NAME = {1: '状态计算时', 10: 'Wave开始', 20: '子弹处理', 21: '命中时', 22: '被命中时', 23: '伤害计算时',
             24: '被伤害计算时', 25: '命中后', 26: '被命中后', 27: '伤害计算后', 28: '被伤害计算后', 29: '命中后处理前',
             40: 'HP条件', 42: 'MP条件', 54: 'Buff变化', 60: 'Buff生效中', 65: '生存人数', 70: '定时'}
DEALT = {21, 23, 25, 27, 29, 36, 38}
RECV = {22, 24, 26, 28, 30, 37, 39}


def trig(cond):
    return PC.get(cond, {}).get('HAPPEN_COND')


# ---------------------------------------------------------------- labels
LABEL = {
    'A_PERM':   '第1步 攻击力/魔力·常驻面板层',
    'A_RUN':    '第1步 攻击力/魔力·战斗实时层（条件/Buff）',
    'A_HIT':    '第1步 攻击力/魔力·本次攻击（与实时层同层相加）',
    'A_EQUIP':  '第1步 装备数值（面板基础）',
    'KILLER':   '第2步 特攻（种族特攻资格）',
    'KILLERP':  '第2步 特攻倍率',
    'TDEF':     '第2步 敌方防御/精神（降低/无视）',
    'ELEM':     '第2步 属性（改属性/敌方耐性）',
    'NATDMG':   '第2步 原生伤害增减（乘入系数）',
    'S3':       '第3步 造成伤害增加（逐条、各自取整）',
    'S3E':      '第3步 敌方受到伤害增加（减益，逐条）',
    'CAP':      '伤害上限',
    'CRT':      '暴击率',
    'CRTEN':    '暴击资格（魔法/超必杀可暴击）',
    'FATAL':    '致命一击',
    'ADD':      '追加伤害（独立伤害）',
    'HITS':     '段数/多段',
    'HIT':      '命中/回避',
    'SETDMG':   '直接改写伤害值',
    'NEWBULLET':'另行发动的攻击（新子弹，按公式另算）',
    'INDEP':    '独立伤害（持续/固定/百分比/裂伤，不走普通公式）',
    'PROCEDIT': '修改其他效果的数值或几率',
    'RECV':     '防御侧·受到伤害减少/增加（自身）',
    'RECVN':    '防御侧·原生受伤减免（自身）',
    'DEFSTAT':  '防御侧·防御/精神',
    'RESIST':   '防御侧·属性耐性',
    'IMMUNE':   '防御侧·免疫/屏障',
    'HP':       'HP/MP',
    'VIT':      '破防值',
    'FLAG':     '计数标记（给其他效果用）',
    'OTHER':    '不影响伤害',
    'UNKNOWN':  '未能判断',
}
ORDER = list(LABEL)

# ---------------------------------------------------------------- native ControlTypes (procCondCommon.lua ControlTypes)
def nat(way, info, name, t):
    recv_t = t in RECV
    if info in (300, 302):
        if way == 2: return 'A_HIT'
        return 'A_PERM' if t == 1 else 'A_RUN'
    if info in (301, 303):
        if way == 2 and info == 301 and '貫通' in name: return 'TDEF'
        return 'DEFSTAT'
    if info == 319: return 'A_EQUIP'
    if info in (305, 318, 327): return 'HP'
    if info == 304: return 'CRT'
    if info in (800, 829): return 'CRTEN'
    if info == 308: return 'KILLER'
    if info == 509: return 'RECVN' if '被' in name else 'KILLERP'
    if info == 504: return 'RECVN' if ('被' in name or recv_t) else 'NATDMG'
    if info in (502, 503): return 'RECVN'
    if info in (505, 508): return 'IMMUNE'
    if info == 506: return 'HIT'
    if info == 507: return 'ELEM'
    if info == 307: return 'RESIST'
    if info == 329: return 'FATAL'
    if info == 801: return 'ADD'
    if info in (825, 808): return 'HITS'
    if info in (824, 826, 513): return 'CAP'
    if info == 314: return 'VIT'
    return 'OTHER'


# Lua call -> tag (wrappers resolved in procCondCommon.lua)
CALLS = [
    (r'Bullet:EditDamagePer\b', 'DMGPER'),
    (r'Bullet:EditDamage\b', 'SETDMG'),
    (r'Bullet:(EditDamageLimit|SetDamageLimit)|Process:EditDamageLimit', 'CAP'),
    (r'Bullet:SetKiller\b', 'KILLER'),
    (r'Bullet:EditKillerPer\b', 'KILLERP'),
    (r'Bullet:(EditTargetDEF|EditTargetMND)', 'TDEF'),
    (r'Bullet:EditElement\b', 'ELEM'),
    (r'Bullet:EditCRT\b|\b(?!Bullet)\w+:EditCRT\b', 'CRT'),
    (r'Bullet:EditFatalBlow', 'FATAL'),
    (r'Bullet:AddDamage', 'ADD'),
    (r'Bullet:(EditSTR|EditINT)\b', 'A_HIT'),
    (r'\b(?!Bullet)\w+:(EditSTR|EditINT)\b', 'ASTAT'),
    (r'\b(?!Bullet)\w+:(EditDEF|EditMND)\b', 'DEFSTAT'),
    (r'\w+:SetDamagePer\b', 'NATDMG'),
    (r'\w+:EditElemResist', 'RESIST'),
    (r'\w+:(EditMaxHP|EditMaxMP)', 'HP'),
    (r'\w+:EditEquipStatus', 'A_EQUIP'),
    (r'Bullet:EditVitDamage', 'VIT'),
    (r'\w+:(MultiCast|SetMultiMagic)', 'HITS'),
    (r'Bullet:EditHitRate', 'HIT'),
    (r'Bullet:(NoDamage|Erase)\b', 'IMMUNE'),
    (r'Process:GenerateBullet', 'NEWBULLET'),
    (r'\w+:(DotDamage|SimpleDamage|DecLAC|AddLaceration\w*)\b|TimeLine:DecLAC|Bullet:Kill\b|\w+:Kill\(', 'INDEP'),
    (r'TrigProc:(EditParam|EditProb|EditProcParam|EditProcFlag)', 'PROCEDIT'),
]
CONTROL_BUFF = re.compile(r'制御|Control|control')


_SEEN = set()


def lua_tags(kind, id_, params, cond, depth, refs, onEnemy=False):
    body = FN.get((kind, id_))
    if body is None:
        return None
    t = trig(cond)
    out = set()
    for pat, tag in CALLS:
        if not re.search(pat, body):
            continue
        if tag == 'DMGPER':
            tag = 'RECV' if t == 28 else 'S3'
        elif tag == 'ASTAT':
            tag = 'A_PERM' if t == 1 else 'A_RUN'
        out.add(tag)
    # buffs granted by this function (BuffIds tables, literal ids, params[n])
    granted = []  # (buffId, onEnemy)
    for line in body.split('\n'):
        enemy = bool(re.search(r'Bullet:Target\(\):SetBuff', line))
        for m in re.finditer(r'(Debuff|Buff)Ids\.(\w+)', line):
            for b in BID.get(('D.' if m.group(1) == 'Debuff' else '') + m.group(2), []):
                granted.append((b, enemy))
        for m in re.finditer(r'\w+(?:\(\))?:SetBuff\(\s*(?:params\[(\d+)\]|(\d+))', line):
            if m.group(1):
                i = int(m.group(1)) - 1
                if i < len(params) and params[i].strip().isdigit():
                    granted.append((int(params[i]), enemy))
            else:
                granted.append((int(m.group(2)), enemy))
    if depth < 5:
        for b, enemy in set(granted):
            row = BM.get(b)
            if not row or b in _SEEN:
                continue
            _SEEN.add(b)
            for tag in buff_tags(b, depth + 1):
                if enemy:
                    tag = {'RECV': 'S3E', 'RECVN': 'NATDMG', 'DEFSTAT': 'TDEF', 'RESIST': 'ELEM'}.get(tag, 'OTHER')
                out.add(tag)
        for m in re.finditer(r'Process:SubProc\(\s*(\d+)', body):
            i = int(m.group(1)) - 1
            if i < len(refs):
                out |= proc_tags(refs[i], [], depth + 1)
    if not out and re.search(r'AddGeneralCount|SetGeneralCount|SetValue|SetProcValue', body):
        out.add('FLAG')
    if not out:
        out.add('OTHER')
    return out


def buff_tags(bid, depth=0):
    b = BM.get(bid)
    if not b:
        return set()
    if b['USE_SCRIPT']:
        r = lua_tags('buff', bid, [], b['PROCESS_COND'], depth, [])
        if r is not None:
            return {('A_RUN' if x == 'A_PERM' else x) for x in r}
    tag = nat(0, b['PROCESS_OPE_TYPE'], b['NAME'], trig(b['PROCESS_COND']))
    return {'A_RUN' if tag == 'A_PERM' else tag}


def proc_tags(pid, params, depth=0):
    r = PM.get(pid)
    if not r:
        return {'UNKNOWN'}
    refs = [int(x) for x in str(r['REF_PROCESS']).split(':') if x.strip().isdigit()]
    if r['USE_SCRIPT']:
        tg = lua_tags('process', pid, params, r['PROCESS_COND'], depth, refs)
        if tg is not None:
            return tg
    if r['OPE_WAY'] == 1:
        return buff_tags(r['OPE_INFO'], depth + 1)
    return {nat(r['OPE_WAY'], r['OPE_INFO'], r['NAME'], trig(r['PROCESS_COND']))}


def classify(process_info):
    """process_info: 'pid:prob:lv:p1:p2...@pid:...' -> (label, basis, tags)"""
    tags = set()
    basis = []
    _SEEN.clear()
    for seg in str(process_info).split('@'):
        f = seg.split(':')
        if not f[0].strip().isdigit():
            continue
        pid = int(f[0])
        t = proc_tags(pid, f[2:])
        tags |= t
        r = PM.get(pid, {})
        if not r:
            basis.append('%d ?' % pid)
            continue
        how = ('脚本 process%d' % pid) if r['USE_SCRIPT'] and ('process', pid) in FN else \
              ('Buff %d' % r['OPE_INFO'] if r['OPE_WAY'] == 1 else '内置操作%d' % r['OPE_INFO'])
        tr = trig(r['PROCESS_COND'])
        basis.append('%d %s［%s；触发:%s(%s)］' % (pid, r['NAME'], how,
                                               PC.get(r['PROCESS_COND'], {}).get('NAME', ''), tr))
    if not basis:
        return '无效果（游戏里没有处理）', '', set()
    lab = [LABEL[k] for k in ORDER if k in tags]
    for x in (LABEL['OTHER'], LABEL['FLAG']):
        if len(lab) > 1 and x in lab:
            lab.remove(x)
    return ' + '.join(lab) or LABEL['UNKNOWN'], '；'.join(basis), tags


PANEL = {'A_PERM', 'DEFSTAT', 'HP', 'A_EQUIP'}


def scope(process_info):
    """局内/局外 by the process trigger (ProcessCondMst.HAPPEN_COND)."""
    out = []
    for seg in str(process_info).split('@'):
        f = seg.split(':')
        if not f[0].strip().isdigit():
            continue
        pid = int(f[0]); r = PM.get(pid)
        if not r:
            continue
        _SEEN.clear()
        tg = proc_tags(pid, f[2:])
        t = trig(r['PROCESS_COND'])
        if r['OPE_WAY'] == 3:
            lab = '局内·条件触发'
        elif t == 1:
            lab = '局外常驻·计入角色面板' if tg & PANEL else '局外常驻·不显示在面板'
        elif t == 10:
            lab = '局内·战斗/每波开始时'
        else:
            lab = '局内·条件触发'
        if lab not in out:
            out.append(lab)
    SO = ['局外常驻·计入角色面板', '局外常驻·不显示在面板', '局内·战斗/每波开始时', '局内·条件触发']
    return ' + '.join(x for x in SO if x in out) or '无效果'
