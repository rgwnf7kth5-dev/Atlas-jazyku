# Sjednocení napříč čínskými dávkami (opakovatelné)
import json,glob,re
NAHRADY=[('阿拉米语','阿拉姆语'),('阿拉米字母','阿拉姆字母'),('帕尔米拉','巴尔米拉'),('帕尔迈拉','巴尔米拉'),
 ('异语书写词','训读词'),('“美索不达米亚”页面','“苏美尔与阿卡德”页面'),
 ('古突厥语在地球仪上','地球仪上的古突厥语'),('日琉诸语言在地球仪上','地球仪上的日琉诸语言'),('斯拉夫诸语言在地球仪上','地球仪上的斯拉夫诸语言'),
 ('点按','点击')]
CJK=re.compile('[一-鿿]')
def uprav(s,davka):
    for a,b in NAHRADY: s=s.replace(a,b)
    if davka!='z11' and CJK.search(s): s=re.sub(r'(?<=\d)[–‒](?=\d)','—',s)
    return s
def projdi(o,d):
    if isinstance(o,str): return uprav(o,d)
    if isinstance(o,list): return [projdi(x,d) for x in o]
    if isinstance(o,dict): return {k:projdi(v,d) for k,v in o.items()}
    return o
for f in sorted(glob.glob('out/z??.json')):
    d=f[4:7]; a=json.load(open(f)); b=projdi(a,d)
    if a!=b: json.dump(b,open(f,'w'),ensure_ascii=False,indent=1); print('upraveno',f)
