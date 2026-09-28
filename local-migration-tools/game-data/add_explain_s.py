# One-off backfill (2026-09-28): add the simplified move description `explainS` next to `explain`
# in already-published dist/game-data files, using the same OpenCC t2s as publish.py (which now
# emits explainS itself for future exports). Formatting of each file is preserved.
import json,glob,os,sys
sys.path.insert(0,os.path.dirname(__file__))
from cc import t2s
ROOT=os.path.join(os.path.dirname(__file__),'..','..','dist','game-data')
def fix(m):
    if not isinstance(m,dict) or 'explain' not in m: return m
    out={}
    for k,v in m.items():
        if k=='explainS': continue
        out[k]=v
        if k=='explain': out['explainS']=t2s(v)
    return out
changed=0
for f in sorted(glob.glob(ROOT+'/c/*.json'))+[ROOT+'/magic.json']:
    s=open(f,encoding='utf-8').read()
    o=json.loads(s)
    sep=(',',':') if json.dumps(o,ensure_ascii=False,separators=(',',':'))==s.rstrip('\n') else (', ',': ')
    if 'normal' in o and 'specials' in o:
        for k in ('normal','specials','form2'): o[k]=[fix(x) for x in o.get(k) or []]
        o['ultimate']=fix(o.get('ultimate'))
        o['magic']={k:[fix(x) for x in v] for k,v in (o.get('magic') or {}).items()}
    else:
        o={k:[fix(x) for x in v] if isinstance(v,list) else v for k,v in o.items()}
    t=json.dumps(o,ensure_ascii=False,separators=sep)+('\n' if s.endswith('\n') else '')
    if t!=s: open(f,'w',encoding='utf-8').write(t);changed+=1
print('files updated',changed)
