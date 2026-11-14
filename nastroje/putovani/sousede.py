# sousední oblasti stejné barvy v jedné etapě (mezera mezi kruhy ve stupních) + mezery mezi body proudů
import json,sys,math
d=json.load(open(sys.argv[1]))
for e in d['etapy']:
    ob=e['oblasti']
    for i in range(len(ob)):
        for j in range(i+1,len(ob)):
            a,b=ob[i],ob[j]
            gap=min(math.hypot((x1-x2)*math.cos(math.radians((y1+y2)/2)),y1-y2)-r1-r2 for x1,y1,r1 in a['kruhy'] for x2,y2,r2 in b['kruhy'])
            if a['barva']==b['barva'] and gap<2.5: print(f"{e['id']}: {a['id']} ~ {b['id']} ({a['barva']}) mezera {gap:.2f}°")
    for p in e['proudy']:
        mx=max(math.dist(u,v) if abs(u[0]-v[0])<180 else 0 for u,v in zip(p['body'],p['body'][1:]))
        if mx>2.6: print('MEZERA',e['id'],p['id'],mx)
    print(e['id'], sorted({o['barva'] for o in ob}|{p['barva'] for p in e['proudy']}))
