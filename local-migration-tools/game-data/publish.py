import json,os,shutil
from cc import t2s
d=json.load(open('/tmp/claude-0/fulldata.json'))
OUT='/home/claude/v160/LastCloudia-Local-v160/project/dist/game-data'
shutil.rmtree(OUT,ignore_errors=True);os.makedirs(OUT+'/c')
def move(s):
    if not s: return None
    parts=[];seen=set()
    for b in s['bullets']:
        others=list(dict.fromkeys(b['others']))
        for dm in (b['damage'] or [None]):
            p={'kind':dm['kind'] if dm else None,'statPercent':dm['statPercent'] if dm else None,'statAdd':dm['statAdd'] if dm else None,'coef':dm['coef'] if dm else None,
               **({'otherStatPercent':dm['附加另一属性%']} if dm and '附加另一属性%' in dm else {}),'cap':b['cap'],'others':others,'level':b['level']}
            k=json.dumps(p,sort_keys=True,ensure_ascii=False)
            if k in seen: continue
            seen.add(k);parts.append(p)
    return {'id':s['id'],'name':s['name'],'nameS':s['nameS'],'type':s['type'],'element':s['element'],'inheritWeaponElement':s['inheritWeaponElement'],
            'nonStackable':s['nonStackable'],'mpCost':s['mpCost'],'sc':s['sc'],'explain':s['explain'],'explainS':t2s(s['explain']),'parts':parts}
P=d['passives']
def pas(pid):
    x=P[str(pid)] if str(pid) in P else P.get(pid)
    return {k:x[k] for k in ('id','name','nameS','sc','ap','text','textS','explainLong','steps','values','scope','timing','relicLearnable')}
index=[]
for c in d['characters']:
    ids=set()
    for p in c['personality']: ids.add(p['passive'])
    for p in c['ownPassives']+c['transcend']: ids.add(p['passive'])
    for e in c['exclusiveEquipment']: ids.update(e['passives'])
    out={**{k:c[k] for k in ('unitDressId','unitId','name','nameS','fullName','fullNameS','dress','dressS','characterType','equipTypes','parameters','criticalRate','resistElem','personality','ownPassives','transcend','blessings','exclusiveEquipment')},
         'normal':[move(x) for x in c['normal']],'specials':[move(x) for x in c['specials']],'ultimate':move(c['ultimate']),'form2':[move(x) for x in c['form2']],
         'magic':{'normal':[move(x) for x in c['magic']['normal']],'heavy':[move(x) for x in c['magic']['heavy']]},
         'passives':{str(i):pas(i) for i in ids}}
    json.dump(out,open(f"{OUT}/c/{c['unitDressId']}.json",'w'),ensure_ascii=False,separators=(',',':'))
    index.append({'u':c['unitDressId'],'n':c['nameS'],'d':c['dressS'],'t':c['characterType']})
magic={'normal':[],'heavy':[]};seen=set()
for k in ('normal','heavy'):
    for m in d['magic'][k]:
        mm=move(m);key=(mm['nameS'],json.dumps(mm['parts'],sort_keys=True,ensure_ascii=False))
        if key in seen or not any(p['coef'] for p in mm['parts']): continue
        seen.add(key);magic[k].append(mm)
relicP={}
for r in d['relics']:
    for p in r['passives']:
        if str(p) in P: relicP[str(p)]=pas(p)
json.dump({'relics':d['relics'],'partyTraits':d['partyTraits'],'passives':relicP},open(f'{OUT}/relics.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(magic,open(f'{OUT}/magic.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump({'generated':d['generated'],'source':d['source'],'characters':index,
  'site':{'182':100642,'245':101011,'259':502230,'260':502220},
  'magicAlias':{'260':{'泽诺克莱昂':'异度克里昂','暴雪':'暴风雪','究极虚弱':'亿万虚弱'},'245':{'龙王巨型领袖魅力':'龙王的超阶魅力','龙之爆发':'龙化爆裂'}}},
  open(f'{OUT}/index.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(index),len(magic['normal']),len(magic['heavy']))
