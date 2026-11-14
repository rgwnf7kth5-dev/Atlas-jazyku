# Kontrola struktury překladu: python3 kontrola.py h01  (porovná out/h01.json se src/h01.json)
import json,sys,re
NEMENIT={'typ','f','siroka','na-vysku','id','rodic','civ','jistota','ukazka','klin','vynechat','vlastnost','soubor','kod','glottocode','barva','iso','src','url','href','obr'}
HEB=re.compile('[\u3400-\u9FFF]')   # čínské znaky
NIKUD=re.compile('(?!x)x')   # u čínštiny se nekontroluje
chyby=[];upoz=[]
def cmp(e,h,p,klic=None):
    if isinstance(e,dict):
        if not isinstance(h,dict): chyby.append(f'{p}: má být objekt'); return
        if list(e)!=list(h): chyby.append(f'{p}: klíče se liší {list(e)} × {list(h)}'); return
        for k in e: cmp(e[k],h[k],p+'.'+k,k)
    elif isinstance(e,list):
        if not isinstance(h,list) or len(e)!=len(h): chyby.append(f'{p}: seznam má mít {len(e)} položek'); return
        for i,(a,b) in enumerate(zip(e,h)): cmp(a,b,f'{p}[{i}]',klic)
    elif isinstance(e,str):
        if not isinstance(h,str): chyby.append(f'{p}: má být text'); return
        if klic in NEMENIT and e!=h: chyby.append(f'{p}: pole „{klic}“ se nepřekládá, má zůstat {e!r}')
        elif re.search('[A-Za-z]{3}',e) and not HEB.search(h) and e==h and klic not in NEMENIT and len(e)>25: upoz.append(f'{p}: nepřeloženo? {e[:60]!r}')
        if NIKUD.search(h): upoz.append(f'{p}: nikud {h[:40]!r}')
        for z in re.findall(r'\{[a-z]+\}',e):
            if z not in h: chyby.append(f'{p}: chybí zástupný znak {z}')
    elif e!=h: chyby.append(f'{p}: hodnota {e!r} se nemá měnit')
for d in sys.argv[1:]:
    chyby.clear(); upoz.clear()
    E=json.load(open(f'src/{d}.json'))
    try: H=json.load(open(f'out/{d}.json'))
    except Exception as x: print(d,'NELZE NAČÍST',x); continue
    if set(E)!=set(H): chyby.append(f'chybí klíče: {sorted(set(E)-set(H))[:5]} navíc: {sorted(set(H)-set(E))[:5]}')
    # vynechané oddíly smí zůstat anglicky
    for k in E:
        if k in H: cmp(E[k],H[k],k)
    print(d,'chyby',len(chyby),'upozornění',len(upoz))
    for c in chyby[:40]: print('  CHYBA',c)
    for c in upoz[:20]: print('  pozor',c)
