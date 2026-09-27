import re,json
L='/mnt/user-data/uploads/LastCloudiaDamageReader-v0.41/evidence/mechanisms/process.lua'
src=open(L,encoding='utf-8').read()
# capture comment block + function body
pat=re.compile(r'((?:^--[^\n]*\n)*)^function process(\d+)\(_target, params\)\n(.*?)^end',re.S|re.M)
D={}
for m in pat.finditer(src):
    body=m.group(3);pid=int(m.group(2))
    if not re.search(r'Bullet:Damage\((DAMAGE_TYPE_\w+)',body): continue
    names={int(a):b.strip() for a,b in re.findall(r'--\s*params\[(\d+)\]\s*[:：]\s*([^\n]*)',m.group(1))}
    title=[l[2:].strip() for l in m.group(1).split('\n') if l.startswith('--') and 'params[' not in l]
    dm=re.findall(r'Bullet:Damage\((DAMAGE_TYPE_\w+),\s*([^)]*)\)',body)
    D[pid]={'title':title[-1] if title else '','names':names,'damage':dm,'edits':re.findall(r'Bullet:(Edit\w+)\(([^)]*)\)',body),'pvp':'IsPvP' in body}
json.dump(D,open('dmgproc.json','w'),ensure_ascii=False,indent=0)
print(len(D))
import collections
for pid in list(D)[:6]: print(pid,D[pid])
