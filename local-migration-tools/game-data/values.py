import sys;sys.path.insert(0,'/home/claude/decode')
from codeclass2 import PM,BM,FN,proc_tags,ORDER,_SEEN
from params import render,render_native,desc,zh
def values_of(process_info):
    parts=[]
    for seg in str(process_info).split('@'):
        f=seg.split(':')
        if not f[0].strip().isdigit(): continue
        pid=int(f[0]); prm=f[2:]
        prob=f[1].strip()
        r=PM.get(pid)
        if not r: parts.append('%d(未知处理)'%pid); continue
        _SEEN.clear(); tg=proc_tags(pid,prm)
        HEAD={'A_PERM':'攻击/魔力(常驻)','A_RUN':'攻击/魔力(战斗中)','A_HIT':'本次攻击的攻击/魔力','A_EQUIP':'装备数值','KILLER':'特攻','KILLERP':'特攻倍率','TDEF':'敌方防御','ELEM':'属性','NATDMG':'原生伤害增减','S3':'造成伤害','S3E':'敌方受到伤害','CAP':'伤害上限','CRT':'暴击率','CRTEN':'暴击资格','FATAL':'致命一击','ADD':'追加伤害','HITS':'段数','HIT':'命中/回避','SETDMG':'改写伤害','NEWBULLET':'另行攻击','INDEP':'独立伤害','PROCEDIT':'修改其他效果','RECV':'受到伤害','RECVN':'受到伤害','DEFSTAT':'防御/精神','RESIST':'属性耐性','IMMUNE':'免疫/屏障','HP':'HP/MP','VIT':'破防值','FLAG':'计数','OTHER':'其他效果','UNKNOWN':'未知'}
        hd='/'.join(HEAD[k] for k in ORDER if k in tg)
        if hd in ('其他效果','计数'):
            import re as _re
            from gloss import tr as _tr
            hd=_tr(_re.sub(r'^[A-Z]+_','',r['NAME']))
        if r['USE_SCRIPT'] and ('process',pid) in FN:
            head=''; vals=render('process',pid,prm)
        elif r['OPE_WAY']==1:
            b=BM.get(r['OPE_INFO'],{}); head='Buff「%s」'%b.get('NAME',r['OPE_INFO']); vals=['参数%d=%s'%(i+1,v) for i,v in enumerate(prm) if v.strip()]
        else:
            head,vals=render_native(r['OPE_INFO'],prm); head=''
        p='' if prob in ('','10000') else '（几率%s%%）'%(int(prob)/100 if prob.lstrip('-').isdigit() else prob)
        if head: hd=hd+'·'+head
        parts.append('【%s】'%hd+('，'.join(vals) or '（无参数）')+p)
    return '；'.join(parts) or '无处理（游戏里没有任何效果）'
