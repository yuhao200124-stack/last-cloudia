import json,collections,re
from sheet import load
from cc import t2s
U='/mnt/user-data/uploads/LastCloudiaLoadoutReader-v0.6/'
_,S=load(U+'SkillMst.bin');SK={r['SKILL_ID']:r for r in S}
_,BM=load(U+'BulletMst.bin');BMm={r['BULLET_ID']:r for r in BM}
_,BL=load(U+'BulletLvInfoMst.bin')
_,UD=load(U+'UnitDressMst.bin')
_,EX=load(U+'SkillExplainMst.bin')
_,PMr=load(U+'ProcessMst.bin');PM={r['PROCESS_ID']:r for r in PMr}
D={int(k):{**v,'names':{int(a):b for a,b in v['names'].items()}} for k,v in json.load(open('dmgproc.json')).items()}
lv=collections.defaultdict(dict)
for r in BL: lv[r['BULLET_ID']][r['LV']]=r
expl=collections.defaultdict(dict)
for r in EX: expl[r['SKILL_ID']][r['LV']]=r
STYPE={1:'特技',2:'魔法',5:'超必杀',9:'普通攻击',7:'圣物技能',3:'魔法阵',4:'召唤'}
ELEM={0:'无',1:'火',2:'冰',3:'树',4:'雷',5:'光',6:'暗'}
def clean(s): return re.sub(r'<[^>]+>','',str(s or '')).strip()
def proc_list(pi):
    out=[]
    for seg in str(pi).split('@'):
        f=seg.split(':')
        if not f[0].strip().isdigit(): continue
        out.append((int(f[0]),[int(x) if x.strip().lstrip('-').isdigit() else 0 for x in f[2:]]))
    return out
def damage_of(pid,p):
    d=D.get(pid)
    if not d: return None
    names=d['names']
    get=lambda n: p[n-1] if n-1<len(p) else 0
    idx=lambda key: next((i for i,n in names.items() if n==key),None)
    ratio=idx('ダメージ倍率');statp=idx('STR倍率') or idx('INT倍率');stata=idx('STR加算値') or idx('INT加算値')
    kind='物理' if 'PHYSICAL' in d['damage'][0][0] else '魔法'
    if pid==10004: kind='物理/魔法（按敌人DEF/MND切换）'
    ex={}
    if idx('INT倍率') and idx('STR倍率'):
        other='INT倍率' if kind.startswith('物理') else 'STR倍率'
        ex['附加另一属性%']=get(idx(other))/100
    return {'process':pid,'kind':kind,'coef':get(ratio)/10000 if ratio else None,'statPercent':get(statp)/100 if statp else 0,'statAdd':get(stata) if stata else 0,**ex,'title':d['title']}
def bullet_info(bid,level=None):
    L=lv.get(bid,{})
    if not L: return None
    lvl=level if level in L else max(L)
    r=L[lvl];out={'bullet':bid,'bulletName':BMm.get(bid,{}).get('NAME',''),'level':lvl,'maxLevel':max(L),'bulletParam':r['BULLET_PARAM'],'damage':[],'cap':0,'others':[]}
    for pid,p in proc_list(r['PROCESS_INFO']):
        dm=damage_of(pid,p)
        if dm: out['damage'].append(dm)
        elif pid==82600: out['cap']+=p[0] if p else 0
        else: out['others'].append(PM.get(pid,{}).get('NAME',str(pid)))
    return out
def skill_info(sid,level=None):
    s=SK.get(sid)
    if not s: return None
    # An empty slot skill is the pre-enhancement entry; the enhanced version (same name, id+100000) carries the bullets.
    if not str(s['BULLET_INFO']).strip(':') and SK.get(sid+100000,{}).get('NAME')==s['NAME']:
        info=skill_info(sid+100000,level)
        if info: info['enhancedFrom']=sid
        return info
    bl=[int(b) for b in str(s['BULLET_INFO']).split(':') if b.strip().isdigit()]
    bullets=[b for b in (bullet_info(b,level) for b in bl) if b and (b['damage'] or b['cap'] or b['others'])]
    E=expl.get(sid,{});e=E[max(E)] if E else {}
    sp=str(s['SKILL_PARAM']).split(':')
    return {'id':sid,'name':clean(s['NAME']),'nameS':t2s(clean(s['NAME'])),'type':STYPE.get(s['SKILL_TYPE'],str(s['SKILL_TYPE'])),'element':ELEM.get(s['ELEM'],str(s['ELEM'])),'inheritWeaponElement':bool(s['INHERIT_WEAPON_ELEM']),
     'nonStackable':len(sp)>1 and sp[1]=='1','mpCost':s['INVOKE_COST'],'sc':s['COST'],'explain':clean(e.get('EXPLAIN_LONG') or e.get('EXPLAIN_SHORT') or ''),'explainLevel':max(E) if E else None,
     'bullets':bullets}
_,AP=load(U+'UnitDressAbilityPieceMst.bin')
pieces=collections.defaultdict(list)
for r in AP: pieces[r['UNIT_DRESS_ID']].append(r)
units=[]
for u in UD:
    P=pieces.get(u['UNIT_DRESS_ID'],[])
    skillLv=collections.defaultdict(int)
    for r in P:
        if r['ABILITY_PIECE_TYPE'] in (50,51):
            f=str(r['PARAM']).split(':')
            if f[0].isdigit(): skillLv[int(f[0])]=max(skillLv[int(f[0])],int(f[1] or 1))
    magicIds=[int(r['PARAM']) for r in P if r['ABILITY_PIECE_TYPE']==70 and str(r['PARAM']).isdigit()]
    passiveIds=[int(r['PARAM']) for r in P if r['ABILITY_PIECE_TYPE']==80 and str(r['PARAM']).isdigit()]
    personal=sorted({int(str(r['PARAM']).split(':')[0]) for r in P if r['ABILITY_PIECE_TYPE'] in (60,61) and str(r['PARAM']).split(':')[0].isdigit()})
    slots=[int(x) for x in str(u['SKILL_SLOT_INFO']).split(':') if x.strip().isdigit() and int(x)]
    slots2=[int(x) for x in str(u['SKILL_SLOT_INFO2']).split(':') if x.strip().isdigit() and int(x)]
    pre=[int(x) for x in str(u['PRESET_SKILL']).split(':') if x.strip().isdigit() and int(x)]
    units.append({'unitDressId':u['UNIT_DRESS_ID'],'name':clean(u['NAME']),'nameS':t2s(clean(u['NAME'])),'dress':clean(u['DRESS_NAME']),'dressS':t2s(clean(u['DRESS_NAME'])),
      'normal':[skill_info(x) for x in pre],'skills':[skill_info(x,skillLv.get(x)) for x in slots],'skills2':[skill_info(x,skillLv.get(x)) for x in slots2],'magic':[skill_info(x) for x in magicIds],'passiveIds':passiveIds,'personalIds':personal,
      'personalPassives':[int(x) for x in str(u['PERSONAL_SKILL']).split(':') if x.strip().isdigit()]})
magic=[skill_info(r['SKILL_ID']) for r in S if r['SKILL_TYPE']==2]
magic=[m for m in magic if any(b['damage'] for b in m['bullets'])]
json.dump({'units':units,'magic':magic},open('/tmp/claude-0/active_skills.json','w'),ensure_ascii=False)
r=[u for u in units if u['unitDressId']==502220][0]
for s in r['normal']+r['skills']:
    print(s['nameS'],s['type'],s['element'],[(b['bullet'],b['level'],[(d['kind'],d['statPercent'],d['coef']) for d in b['damage']],b['cap'],b['bulletParam']) for b in s['bullets']])
x=[m for m in magic if m['id']==270090][0];print(x['nameS'],x['nonStackable'],x['mpCost'],[(b['bullet'],[(d['kind'],d['statPercent'],d['coef']) for d in b['damage']],b['cap']) for b in x['bullets']],x['explain'])
print('units',len(units),'magic w/ damage',len(magic))
