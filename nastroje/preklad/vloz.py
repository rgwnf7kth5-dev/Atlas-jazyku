# Vloží out/<dávka>.json do data/*.json jako klíč "zh" hned za "he". Opakovatelné; částečný zh (jen hledat) se doplní.
# python3 vloz.py h01 h02 ...
import json,sys
R='/home/user/atlas-jazyku/data/'
D={}; n=0
def dej(soubor):
    if soubor not in D: D[soubor]=json.load(open(R+soubor+'.json'))
    return D[soubor]
for davka in sys.argv[1:]:
    for k,v in json.load(open(f'out/{davka}.json')).items():
        soubor,cesta=k.split('|',1); o=dej(soubor)
        for c in json.loads(cesta): o=o[c]
        assert 'he' in o, k
        if isinstance(o.get('zh'),dict) and isinstance(v,dict):   # doplnit k částečnému překladu (hledat), ale nové klíče napřed
            v={**v, **{kk:vv for kk,vv in o['zh'].items() if kk not in v}}
        novy={}
        for kk,vv in o.items():
            if kk=='zh': continue
            novy[kk]=vv
            if kk=='he': novy['zh']=v
        o.clear(); o.update(novy); n+=1
        if soubor=='starovek' and 'adresa' in o and 'zh' not in o['adresa']:   # adresa stránky: hebrejština v URL je nečitelná → anglická
            a=o['adresa']; a2={}
            for kk,vv in a.items():
                a2[kk]=vv
                if kk=='he': a2['zh']=a['en']
            a.clear(); a.update(a2)
for s,d in D.items():
    puvodni=open(R+s+'.json').read()
    ind=1 if puvodni.startswith('{\n "') or puvodni.startswith('[\n {') else (2 if puvodni.startswith('{\n  "') else None)
    open(R+s+'.json','w').write(json.dumps(d,ensure_ascii=False,indent=ind)+('\n' if puvodni.endswith('\n') else ''))
    print(s,'indent',ind)
print('vloženo',n)
