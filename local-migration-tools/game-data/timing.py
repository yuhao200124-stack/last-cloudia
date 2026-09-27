import sys,json,collections;sys.path.insert(0,'/home/claude/decode')
from codeclass2 import *
from codeclass2 import _SEEN
from params import P
_,PS=load('/root/.claude/uploads/25ef6236-cfdc-5bd3-86df-1f3c5a5ffe2b/2390809c-PassiveSkillMst.bin')
ps={r['PASSIVE_SKILL_ID']:r for r in PS}
PERHIT={20,21,22,23,24,25,26,27,28,29,30,36,37,38,39}
def pval(pid,params,name_pred):
    names=P.get(('process',pid),{})
    for i,n in names.items():
        if name_pred(n) and i-1<len(params) and params[i-1].strip().lstrip('-').isdigit(): return int(params[i-1])
    return None
def timing(process_info):
    """per process: (label, pid, trigger, detail)"""
    out=[]
    for seg in str(process_info).split('@'):
        f=seg.split(':')
        if not f[0].strip().isdigit(): continue
        pid=int(f[0]); r=PM.get(pid)
        if not r: continue
        prm=f[2:]; t=trig(r['PROCESS_COND'])
        _SEEN.clear(); tags=proc_tags(pid,prm)
        dur=pval(pid,prm,lambda n:n=='継続時間')
        if r['OPE_WAY']==3: lab='state'
        elif t==1: lab='permanent-panel'
        elif t==65: lab='always-buff'           # 自動XX: kept on while alive
        elif t==10:
            lab='opening' if (dur or 0)>0 else 'always-buff'
        elif t==40:
            d=pval(pid,prm,lambda n:'方向' in n); th=pval(pid,prm,lambda n:'閾値' in n and 'HP' in n or n=='残りHP閾値')
            if dur and dur>0: lab='hp-trigger-buff'
            elif d==1 and th==10000: lab='fullHp'
            elif d==0 and th is not None and th<=3000: lab='lowHp'
            else: lab='hp-condition'
        elif t in PERHIT: lab='per-hit'
        else: lab='event-buff'
        out.append((lab,pid,t,dur,sorted(tags)))
    return out
