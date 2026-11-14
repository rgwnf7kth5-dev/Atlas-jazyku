# Použije opravy kontrolora: python3 oprava.py kontrola/k-h05.json  (seznam {"davka","klic","stare","nove","proc"})
# "stare" musí být mezi texty pod klíčem "klic" v out/<davka>.json právě jednou. --zkus = jen ověří, nic nezapíše.
import json,sys
zkus='--zkus' in sys.argv
soubory=[a for a in sys.argv[1:] if not a.startswith('--')]
OUT={}; ok=chyby=0
def texty(o,f):
    if isinstance(o,dict):
        for k in o: 
            if isinstance(o[k],str): f(o,k)
            else: texty(o[k],f)
    elif isinstance(o,list):
        for i in range(len(o)):
            if isinstance(o[i],str): f(o,i)
            else: texty(o[i],f)
for s in soubory:
    for x in json.load(open(s)):
        d=x['davka']
        if d not in OUT: OUT[d]=json.load(open(f'out/{d}.json'))
        if x['klic'] not in OUT[d]: print('NENÍ KLÍČ',x['klic']); chyby+=1; continue
        mista=[]
        def najdi(o,k):
            if x['stare'] in o[k]: mista.append((o,k,o[k].count(x['stare'])))
        kor={'v':OUT[d][x['klic']]}
        texty(kor,najdi)
        if sum(m[2] for m in mista)!=1: print('NEJEDNOZNAČNÉ/NENALEZENO',sum(m[2] for m in mista),x['klic'],x['stare'][:50]); chyby+=1; continue
        o,k,_=mista[0]; o[k]=o[k].replace(x['stare'],x['nove']); OUT[d][x['klic']]=kor['v']; ok+=1
print('použito',ok,'chyb',chyby)
if not zkus:
    for d,v in OUT.items(): json.dump(v,open(f'out/{d}.json','w'),ensure_ascii=False,indent=1)
