# Kontrola šipek a oblastí putování proti pevnině Natural Earth (50m / 10m)
import json,sys,math
from shapely.geometry import shape,Point,LineString
from shapely.ops import unary_union
from shapely.prepared import prep
S=sys.argv[0].rsplit('/',1)[0]
res=sys.argv[2] if len(sys.argv)>2 else '50m'
g=json.load(open(f'{S}/land-{res}.geojson'))
from shapely.validation import make_valid
land=unary_union([make_valid(shape(f['geometry'])) for f in (g['features'] if 'features' in g else [g])]); L=prep(land)
pj=json.load(open(sys.argv[1]))
for e in pj['etapy']:
    print(f"## {e['id']}")
    for p in e.get('proudy',[]):
        b=p['body']; useky=[]
        for (x1,y1),(x2,y2) in zip(b,b[1:]):
            if x2-x1>180: x2-=360
            if x1-x2>180: x2+=360
            n=max(2,int(math.hypot(x2-x1,y2-y1)/0.05))
            for k in range(n):
                t=k/n; x=x1+(x2-x1)*t; y=y1+(y2-y1)*t
                xx=((x+180)%360)-180; useky.append((L.contains(Point(xx,y)),xx,y))
        sous=sum(1 for u in useky if u[0])/len(useky)
        # úseky na moři / na souši
        zmeny=[];prev=None
        for s_,x,y in useky:
            if s_!=prev: zmeny.append(('SOUŠ' if s_ else 'MOŘE',round(x,2),round(y,2))); prev=s_
        print(f"  proud {p['id']}: souš {sous:.0%}, přechody {len(zmeny)-1}: "+' | '.join(f'{a}@{x},{y}' for a,x,y in zmeny[:14]))
    for o in e.get('oblasti',[]):
        mimo=[k for k in o['kruhy'] if not L.contains(Point(k[0],k[1]))]
        if mimo: print(f"  oblast {o['id']}: střed kruhu na moři: {mimo}")
