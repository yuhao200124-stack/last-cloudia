import pickle,re
P,D=pickle.load(open('/home/claude/decode/params.pkl','rb'))
ELEM={-16:'非暗',-15:'非光',-14:'非雷',-13:'非樹',-12:'非冰',-11:'非炎',-10:'副武器屬性(非無)',-9:'主武器屬性(非無)',-8:'任一武器屬性(非無)',-7:'同武器屬性(非無)',-6:'副武器屬性',-5:'主武器屬性',-4:'任一武器屬性',-3:'同武器屬性',-2:'不限',-1:'全屬性',0:'無',1:'炎',2:'冰',3:'樹',4:'雷',5:'光',6:'暗'}
ROLE={0:'全部',1:'攻擊',2:'恢復',3:'輔助',8:'減益',16:'詠唱'}
GL=[('ダメージ上限','伤害上限'),('ダメージ','伤害'),('与','造成'),('被','受到'),('倍率補正','倍率修正'),('最大補正','最大修正'),('補正','修正'),('加算値','加算值'),('加算最大値','加算最大值'),('増減値','增减值'),('増減倍率','增减倍率'),('倍率','倍率'),
    ('継続時間','持续时间'),('制限回数','限制次数'),('発動回数','发动次数'),('発生確率','发生几率'),('確率','几率'),('条件','条件'),('属性','属性'),('スキルタイプ','技能类型'),('スキルロール','技能用途'),
    ('詠唱時間','咏唱时间'),('詠唱速度','咏唱速度'),('回復','恢复'),('消費','消耗'),('閾値','阈值'),('方向','方向'),('演出レベル','演出等级'),('演出番号','演出编号'),('汎用数値情報','通用计数'),('番号','编号'),
    ('キャラタイプ','角色类型'),('エネミータイプ','敌人类型'),('装備','装备'),('状態異常','异常状态'),('移動速度','移动速度'),('最大','最大'),('最小','最小'),('効果','效果'),('人数','人数'),('バフ','Buff'),('カテゴリ','类别'),
    ('敵・味方','敌/我'),('敵味方','敌/我'),('オプション','选项'),('特技','特技'),('魔法','魔法'),('超必殺','超必杀'),('残りHP','剩余HP'),('値','值')]
from gloss import tr as _tr
def zh(s): return _tr(s)
PCT=re.compile(r'倍率|補正|割合|確率|率')
EQUIP={0:'不限',10:'剑',11:'斧',12:'枪',13:'锤',14:'弓',15:'机械',16:'拳',17:'杖',20:'铠甲',21:'衣服',22:'长袍',30:'饰品'}
STYPE={0:'不限',1:'特技',2:'魔法',3:'魔法阵展开',4:'召唤',5:'超必杀',6:'被动',7:'圣物技能',9:'普通攻击',10:'物理(普攻+特技)',15:'反击'}
CHARA={-1:'自身类型',1:'无',1001:'士兵',1002:'射手',1003:'骑士',1004:'法师',1005:'治疗者',2001:'兽族',2002:'植物',2003:'昆虫',2004:'鸟类',2005:'魔法生物',2006:'不死族',2007:'岩石',2008:'机械',2009:'精灵',2010:'龙族',2011:'神族',2012:'鱼类'}
def _stype(iv):
    if iv<=15: return STYPE.get(iv,str(iv))
    return '/'.join(STYPE.get(i-4,str(i-4)) for i in range(1,40) if iv>>(i-1)&1)
def _chara(iv):
    if iv in CHARA: return CHARA[iv]
    if iv>0 and not (iv>>9)&1:
        return '/'.join(CHARA.get(((i//16)+1)*1000+(i%16),'?') for i in range(1,33) if iv>>(i-1)&1)
    return str(iv)
def fmt(name,v):
    if v=='' : return None
    zn=zh(name)
    try: iv=int(v)
    except ValueError: return '%s=%s'%(zn,v)
    if re.search(r'属性条件\d*$|^指定属性$|^属性$|装備属性条件|追加ダメージ属性|^対象属性$|発動スキル属性条件|スキル属性条件|^属性ID$',name): return '%s=%s'%(zn,ELEM.get(iv,iv))
    if 'スキルロール' in name: return '%s=%s'%(zn,ROLE.get(iv,iv))
    if re.search(r'スキルタイプ|スキル種別',name): return '%s=%s'%(zn,_stype(iv))
    if re.search(r'装備タイプ|装備種|対象装備タイプ',name): return '%s=%s'%(zn,EQUIP.get(iv,iv))
    if re.search(r'キャラ(クター)?タイプ|エネミータイプ',name) or name=='タイプ': return '%s=%s'%(zn,_chara(iv))
    if re.search(r'方向',name) and iv in (0,1): return '%s=%s'%(zn,'以下' if iv==0 else '以上')
    if re.search(r'HP閾値|HP割合|HP条件$|MP閾値|MP割合',name) and not PCT.search(name): return '%s=%s%%'%(zn,iv/100)
    if '継続時間' in name and '倍率' not in name: return '%s=%d帧(约%g秒)'%(zn,iv,round(iv/60,1)) if iv>0 else '%s=%s'%(zn,'永久' if iv<0 else iv)
    if (PCT.search(name) or '詠唱時間' in name) and not re.search(r'条件|INDEX|番号|ID|レベル',name): return '%s=%+g%%'%(zn,iv/100)
    if iv==0 and re.search(r'加算|値$|増減値',name) and not re.search(r'条件|閾値|方向',name): return None
    return '%s=%s'%(zn,iv)
def render(kind,fid,params):
    names=P.get((kind,fid),{})
    out=[]
    for i,v in enumerate(params,1):
        if v.strip()=='' : continue
        n=names.get(i,'参数%d'%i)
        s=fmt(n,v.strip())
        if s: out.append(s)
    return out
def desc(kind,fid): return D.get((kind,fid),'')
# native ControlTypes parameter names from procCondCommon.lua comments
_pc=open('/mnt/user-data/uploads/LastCloudiaDamageReader-v0.41/evidence/mechanisms/procCondCommon.lua',encoding='utf-8').read()
CT={}
def _split(txt):
    depth=0;i=0;marks=[]
    while i<len(txt):
        ch=txt[i]
        if ch in '（(': depth+=1
        elif ch in '）)': depth-=1
        elif depth==0 and ch.isdigit() and (i==0 or not txt[i-1].isdigit()) and i+1<len(txt) and txt[i+1] in ':：' :
            marks.append(i)
        i+=1
    ps={}
    for k,a in enumerate(marks):
        b=marks[k+1] if k+1<len(marks) else len(txt)
        idx=int(txt[a]); name=txt[a+2:b].strip()
        ps[idx]=name.split('\t')[0].strip()
    head=txt[:marks[0]] if marks else txt
    return head,ps
for m in re.finditer(r'^(\w+)\s*=\s*(\d+),\s*--\s*(.*)$',_pc[_pc.index('ControlTypes = {'):_pc.index('-- トリガーリスト')],re.M):
    head,ps=_split(m.group(3))
    head=re.sub(r'^\s*\d*\s*[A-Z\-]+/[A-Z\-]+\s*(TRUE|FALSE)?\s*','',head).strip()
    CT[int(m.group(2))]=(head.split('\t')[0].split(' ')[0] or m.group(1),ps)
def render_native(info,params):
    title,ps=CT.get(info,('操作%d'%info,{}))
    out=[]
    for i,v in enumerate(params):
        if v.strip()=='': continue
        s=fmt(ps.get(i,'参数%d'%(i+1)),v.strip())
        if s: out.append(s)
    return title,out
