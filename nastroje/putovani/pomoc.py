import json, math, sys
sys.path.insert(0, __import__('os').path.dirname(__file__))

def L_puv(cs, en, it, de, fr):
    return {"cs": cs, "en": en, "it": it, "de": de, "fr": fr}

def O(id, kruhy, barva, popisek, po=None, sporna=False):
    o = {"id": id, "kruhy": [list(k) for k in kruhy], "barva": barva}
    if sporna: o["sporna"] = True
    if po: o["po"] = po
    o["popisek"] = popisek
    return o

def _xyz(lon, lat):
    lo, la = math.radians(lon), math.radians(lat)
    return (math.cos(la)*math.cos(lo), math.cos(la)*math.sin(lo), math.sin(la))

def _ll(v):
    x, y, z = v
    return (math.degrees(math.atan2(y, x)), math.degrees(math.atan2(z, math.hypot(x, y))))

def husta(body, krok=2.5):
    out = [tuple(body[0])]
    for a, b in zip(body, body[1:]):
        A, B = _xyz(*a), _xyz(*b)
        d = math.degrees(math.acos(max(-1, min(1, sum(p*q for p, q in zip(A, B))))))
        n = max(1, math.ceil(d / krok))
        om = math.radians(d)
        for i in range(1, n):
            t = i / n
            if om < 1e-9: break
            s1 = math.sin((1-t)*om)/math.sin(om); s2 = math.sin(t*om)/math.sin(om)
            v = tuple(s1*p + s2*q for p, q in zip(A, B))
            out.append(_ll(v))
        out.append(tuple(b))
    return [[round(x, 2), round(y, 2)] for x, y in out]

def P(id, body, barva, popisek, sporna=False):
    o = {"id": id, "body": husta(body), "barva": barva}
    if sporna: o["sporna"] = True
    o["popisek"] = popisek
    return o

# ---------------------------------------------------------------- spolecne useky
