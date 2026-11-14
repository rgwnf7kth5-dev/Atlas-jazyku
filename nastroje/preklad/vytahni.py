# Vytáhne anglické texty bez čínského překladu do dávek src/<davka>.json: {"soubor|cesta-json": en}
import json,sys,os
R='/home/user/atlas-jazyku/'
L={'cs','en','it','de','fr','he','zh'}
SOUBORY=['starovek','putovani','cesty-slov','dny-jazyku','pisma','typologie-popis','vymyslene']
pol=[]
def walk(o,cesta,soubor):
    if isinstance(o,dict):
        if 'en' in o and 'he' in o and cesta[-1:]!=['adresa']:
            if 'zh' not in o: pol.append((soubor,cesta,o['en']))
            elif isinstance(o['zh'],dict) and isinstance(o['en'],dict):   # částečný překlad (např. jen hledat) – vytáhnout chybějící klíče
                chybi={k:v for k,v in o['en'].items() if k not in o['zh']}
                if chybi: pol.append((soubor,cesta,chybi))
        for k,v in o.items():
            if k not in L: walk(v,cesta+[k],soubor)
    elif isinstance(o,list):
        for i,v in enumerate(o): walk(v,cesta+[i],soubor)
D={}
for s in SOUBORY:
    D[s]=json.load(open(R+'data/'+s+'.json')); walk(D[s],[],s)
# stránky jen pro české čtenáře vynechat
cs_only={i for i,c in enumerate(D['starovek']['civilizace']) if c.get('jazyky')==['cs']}
pol=[p for p in pol if not (p[0]=='starovek' and len(p[1])>1 and p[1][1] in cs_only)]
# dávky: starovek po stránkách (stránka + její popisky fotek), ostatní soubory po velikosti
davky={}
for s,c,en in pol:
    if s=='starovek': k='st-'+D['starovek']['civilizace'][c[1]]['id']
    elif s=='putovani': k='put-'+D['putovani']['jazyky'][c[1]]['id']
    else: k=s
    davky.setdefault(k,{})[s+'|'+json.dumps(c)]=en
vel=lambda d: len(json.dumps(d,ensure_ascii=False))
SKUPINY=json.load(open('skupiny.json'))
for g,cleny in SKUPINY.items():
    d={}
    for k in cleny: d.update(davky.pop(k))
    json.dump(d,open('src/'+g+'.json','w'),ensure_ascii=False,indent=1)
    print(g,vel(d),len(d),cleny)
assert not davky, list(davky)
print('celkem',sum(vel(d) for d in davky.values()))
