import sys,json,collections,re
sys.path.insert(0,'/home/claude/decode')
from codeclass2 import classify,scope
from values import values_of
from timing import timing
from sheet import load
from cc import t2s
U='/mnt/user-data/uploads/LastCloudiaLoadoutReader-v0.6/'
_,PS=load(U+'PassiveSkillMst.bin');ps={r['PASSIVE_SKILL_ID']:r for r in PS}
_,PX=load(U+'PassiveSkillExplainMst.bin');pxl={r['PASSIVE_SKILL_ID']:r['EXPLAIN_LONG'] for r in PX}
_,UD=load(U+'UnitDressMst.bin');_,AP=load(U+'UnitDressAbilityPieceMst.bin');_,EQ=load(U+'ItemEquipMst.bin')
_,ARK=load(U+'ArkMst.bin');_,PT=load(U+'ArkPartyTraitMst.bin');_,ASL=load(U+'ArkSkillLvMst.bin')
act=json.load(open('/tmp/claude-0/active_skills.json'))
at=json.load(open('arkteach.json'))
relicPassives={int(k) for k in at['pas']}
def clean(s): return re.sub(r'<[^>]+>','',str(s or '')).replace('\r','').strip()
def filled(r,text_key='PROCESS_EXPLAIN',quote_key='PROCESS_EXPLAIN_QUOTE'):
    procs=[seg.split(':') for seg in str(r['PROCESS_INFO']).split('@')]
    txt=r.get(text_key) or ''
    for i,q in enumerate([q for q in (r.get(quote_key) or '').split(',') if q]):
        parts=q.split(':')
        try:
            pi,ai=int(parts[0]),int(parts[1]);fmt=int(parts[2]) if len(parts)>2 and parts[2] else 1
            v=int(procs[pi-1][ai+1] or 0);val=v/100 if fmt==0 else v/1000 if fmt==2 else v
            val=int(val) if val==int(val) else val
        except Exception: val='?'
        txt=txt.replace('{%d}'%i,str(val))
    return clean(txt)
PC={}
def passive(pid):
    if pid in PC: return pid
    r=ps.get(pid)
    if not r: return None
    lab,basis,_=classify(r['PROCESS_INFO'])
    txt=filled(r)
    tm=[{'kind':t[0],'trigger':t[2],'durationFrames':t[3]} for t in timing(r['PROCESS_INFO'])]
    PC[pid]={'id':pid,'name':clean(r['NAME']),'nameS':t2s(clean(r['NAME'])),'sc':r['COST'],'ap':r['NEED_AP'],'text':txt,'textS':t2s(txt),
      'explainLong':clean(pxl.get(pid,'')),'steps':lab,'values':values_of(r['PROCESS_INFO']),'scope':scope(r['PROCESS_INFO']),'timing':tm,
      'relicLearnable':pid in relicPassives,'processInfo':r['PROCESS_INFO']}
    return pid
ETYPE={10:'剑',11:'刀',12:'斧',13:'锤',14:'枪',15:'弓',16:'机械',17:'杖',20:'铠甲',21:'衣服',22:'长袍',30:'饰品',40:'其他'}
pieces=collections.defaultdict(list)
for r in AP: pieces[r['UNIT_DRESS_ID']].append(r)
eqByUnit=collections.defaultdict(list)
for e in EQ:
    if e['UNIT_DRESS_ID']: eqByUnit[e['UNIT_DRESS_ID']].append(e)
actByUnit={u['unitDressId']:u for u in act['units']}
chars=[]
for u in UD:
    if 'coming soon' in str(u['NAME']): continue
    uid=u['UNIT_DRESS_ID'];P=pieces.get(uid,[]);A=actByUnit.get(uid,{})
    # 个性：每条个性取最高等级
    pers={}
    for r in P:
        if r['ABILITY_PIECE_TYPE'] in (60,61):
            f=str(r['PARAM']).split(':')
            if len(f)>=3 and f[0].isdigit():
                base=int(f[2] or f[0]);lvl=int(f[1] or 1)
                if base not in pers or lvl>pers[base][1]: pers[base]=(int(f[0]),lvl)
    for b in [int(x) for x in str(u['PERSONAL_SKILL']).split(':') if x.strip().isdigit()]:
        pers.setdefault(b,(b,1))
    personality=[{'passive':passive(pid),'level':lv,'base':b} for b,(pid,lv) in pers.items() if passive(pid)]
    own=[];trans=[];blessing=[]
    for r in P:
        if r['ABILITY_PIECE_TYPE']==80 and str(r['PARAM']).isdigit():
            pid=int(r['PARAM'])
            if not passive(pid): continue
            (trans if pid>=70000000 else own).append({'passive':pid,'limitBreak':r['LIMITBREAK_LV'],'common':pid in relicPassives})
        elif r['ABILITY_PIECE_TYPE']==100 and str(r['PARAM']).isdigit():
            blessing.append(int(r['PARAM']))
    equipment=[]
    for e in eqByUnit.get(uid,[]):
        pids=[int(x) for x in str(e['PASSIVE_SKILL_INFO']).replace('@',':').split(':') if x.strip().isdigit() and passive(int(x))]
        equipment.append({'id':e['ITEM_EQUIP_ID'],'name':clean(e['NAME']),'nameS':t2s(clean(e['NAME'])),'type':ETYPE.get(e['EQUIP_TYPE'],str(e['EQUIP_TYPE'])),'element':e['ELEM'],
          'stats':e['PARAMETER_INFO'],'maxStats':e['PARAMETER_MAX_INFO'],'maxLv':e['MAX_LV'],'passives':pids})
    mg=A.get('magic',[]) or []
    chars.append({'unitDressId':uid,'unitId':u['UNIT_ID'],'name':clean(u['NAME']),'nameS':t2s(clean(u['NAME'])),'fullName':clean(u['NAME_FULL']),'fullNameS':t2s(clean(u['NAME_FULL'])),
      'dress':clean(u['DRESS_NAME']),'dressS':t2s(clean(u['DRESS_NAME'])),'characterType':u['CHARACTER_TYPE'],'equipTypes':[ETYPE.get(int(x),x) for x in str(u['EQUIP_TYPE_INFO']).split(',') if x.strip().isdigit()],
      'parameters':u['PARAMETER_INFO'],'criticalRate':u['CRITICAL_RATE'],'resistElem':u['RESIST_ELEM_INFO'],
      'normal':A.get('normal',[]),'specials':(A.get('skills') or [])[:3],'ultimate':(A.get('skills') or [None]*4)[3] if len(A.get('skills') or [])>3 else None,'form2':A.get('skills2',[]),
      'magic':{'normal':[m for m in mg if m and not m['nonStackable']],'heavy':[m for m in mg if m and m['nonStackable']]},
      'personality':personality,'ownPassives':own,'transcend':trans,'blessings':blessing,'exclusiveEquipment':equipment})
RARE={1:'R',2:'SR',3:'SSR',4:'UR',5:'LR'}
asl=collections.defaultdict(list)
for r in ASL: asl[r['ARK_ID']].append({'lv':r['LV'],'text':filled(r),'values':values_of(r['PROCESS_INFO'])})
traits={r['ARK_PARTY_TRAIT_ID']:{'id':r['ARK_PARTY_TRAIT_ID'],'name':clean(r['NAME']),'group':r['ARK_PARTY_TRAIT_GROUP'],'text':filled(r),'values':values_of(r['PROCESS_INFO']),'scope':scope(r['PROCESS_INFO']),'steps':classify(r['PROCESS_INFO'])[0]} for r in PT}
relics=[]
for a in ARK:
    learn=[x.split(':') for x in str(a['LEARNING_SKILL_INFO']).split(',') if x]
    pas=[int(x[3]) for x in learn if len(x)>3 and x[2]=='6' and x[3].isdigit()]
    mag=[int(x[3]) for x in learn if len(x)>3 and x[2]=='2' and x[3].isdigit()]
    for p in pas: passive(p)
    relics.append({'id':a['ARK_ID'],'name':clean(a['NAME']),'nameS':t2s(clean(a['NAME'])),'rarity':RARE.get(a['RARE'],str(a['RARE'])),'passives':pas,'magic':mag,
      'stats':{k:a[k] for k in ('MAX_HP','MAX_MP','MAX_ATK','MAX_DEF','MAX_MATK','MAX_MDEF')},'partyTraits':[a[f'PARTY_TRAIT_LV_{i}'] for i in (1,2,3) if a[f'PARTY_TRAIT_LV_{i}']],'arkSkill':asl.get(a['ARK_ID'],[])})
for p in relicPassives: passive(p)
magicAll=act['magic']
out={'generated':'2026-09-27','source':'读取器 v0.8 导出的游戏主数据','characters':chars,'relics':relics,'partyTraits':list(traits.values()),
     'passives':PC,'commonSkills':sorted(relicPassives),
     'magic':{'normal':[m for m in magicAll if not m['nonStackable']],'heavy':[m for m in magicAll if m['nonStackable']]}}
json.dump(out,open('/tmp/claude-0/fulldata.json','w'),ensure_ascii=False,separators=(',',':'))
r=[c for c in chars if c['unitDressId']==502220][0]
print('chars',len(chars),'relics',len(relics),'passives',len(PC))
print('personality',[(PC[p['passive']]['nameS'],p['level']) for p in r['personality']])
print('own',[(PC[p['passive']]['nameS'],p['limitBreak'],p['common']) for p in r['ownPassives']])
print('trans',[PC[p['passive']]['nameS'] for p in r['transcend']])
print('equip',[(e['nameS'],e['type'],[PC[p]['nameS'] for p in e['passives']]) for e in r['exclusiveEquipment']])
print('magic',[m['nameS'] for m in r['magic']['normal']],[m['nameS'] for m in r['magic']['heavy']])
