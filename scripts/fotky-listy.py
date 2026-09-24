"""Přehledové listy kandidátů na fotky pohlednic → .nahledy-fotek/list-NN.jpg (jen pro výběr, na web nejdou).
Řádek = jazyk, v něm až 8 kandidátů s pořadím; vybraná fotka má červený rámeček.
Spouští GitHub Actions po scripts/fotky-kandidati.mjs a scripts/fotky.mjs; potřebuje pillow."""
import io, json, os, urllib.request
from PIL import Image, ImageDraw, ImageFont

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = "AtlasJazyku/1.0 (https://github.com/rgwnf7kth5-dev/atlas-jazyku; educational project for children)"
kand = json.load(open(os.path.join(KOREN, "data/fotky-kandidati.json")))
fotky = json.load(open(os.path.join(KOREN, "data/fotky.json")))["fotky"]
jazyky = {j["id"]: j["cs"]["nazev"] for j in json.load(open(os.path.join(KOREN, "data/languages.json")))}
VYST = os.path.join(KOREN, ".nahledy-fotek")
os.makedirs(VYST, exist_ok=True)
for f in os.listdir(VYST): os.remove(os.path.join(VYST, f))
TW, TH, POPIS, NA_LIST = 220, 140, 200, 12
pismo = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13) if os.path.exists("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf") else ImageFont.load_default()
tucne = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14) if os.path.exists("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") else pismo

def nahled(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert("RGB")
    except Exception as e:
        print("  náhled se nestáhl:", e); return None

ids = sorted(kand)
for n in range(0, len(ids), NA_LIST):
    cast = ids[n:n + NA_LIST]
    list_ = Image.new("RGB", (POPIS + 8 * (TW + 6), len(cast) * (TH + 10)), "white")
    d = ImageDraw.Draw(list_)
    for r, i in enumerate(cast):
        y = r * (TH + 10)
        d.text((6, y + 6), f"{i}", fill="black", font=tucne)
        d.text((6, y + 26), jazyky.get(i, "")[:22], fill="black", font=pismo)
        d.text((6, y + 46), kand[i]["hledano"][:24], fill=(90, 90, 110), font=pismo)
        vybrany = (fotky.get(i) or {}).get("nazev")
        for k, c in enumerate(kand[i]["kandidati"]):
            x = POPIS + k * (TW + 6)
            im = nahled(c["nahled"])
            if im:
                im.thumbnail((TW, TH)); list_.paste(im, (x, y))
            if c["soubor"] == vybrany: d.rectangle([x - 3, y - 3, x + TW + 2, y + TH + 2], outline=(220, 40, 30), width=5)
            d.rectangle([x, y, x + 22, y + 20], fill="black"); d.text((x + 6, y + 2), str(k), fill="white", font=tucne)
    cesta = os.path.join(VYST, f"list-{n // NA_LIST:02d}.jpg")
    list_.save(cesta, quality=72)
    print(cesta)
