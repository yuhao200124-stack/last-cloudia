D='/tmp/opencc/data/dictionary/'
CH={};PH={}
for line in open(D+'TSCharacters.txt',encoding='utf8'):
    p=line.rstrip('\n').split('\t')
    if len(p)==2 and not p[0].startswith('#'): CH[p[0]]=p[1].split()[0]
for fn in ['TWVariantsRevPhrases.txt'] if False else []: pass
try:
    for line in open(D+'TSPhrases.txt',encoding='utf8'):
        p=line.rstrip('\n').split('\t')
        if len(p)==2 and not p[0].startswith('#'): PH[p[0]]=p[1].split()[0]
except FileNotFoundError: pass
MAXP=max(map(len,PH)) if PH else 1
def t2s(s):
    s=str(s or '');out=[];i=0
    while i<len(s):
        for L in range(min(MAXP,len(s)-i),1,-1):
            if s[i:i+L] in PH: out.append(PH[s[i:i+L]]);i+=L;break
        else:
            out.append(CH.get(s[i],s[i]));i+=1
    return ''.join(out)
