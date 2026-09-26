#!/usr/bin/env python3
"""Menší fotky pro artefakt (jeden soubor se vším vloženým, limit 16 MB).
Web používá static/starovek/<id>/<klic>.jpg a <klic>-720.jpg; artefakt tyhle menší verze
z artefakt/starovek/<id>/<klic>.jpg (nejvýš 420 px, JPEG 62). Spusť po přidání nebo výměně fotek:
    python3 scripts/fotky-artefakt.py        (potřebuje Pillow: pip install pillow)"""
import json, os
from PIL import Image
KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(os.path.join(KOREN, "data/starovek.json")))
celkem = 0
# náhledy ilustrací do nabídky „Jazyky starověku“ a na tlačítka civilizací (240 × 150, 16:10 jako .starovek-malba);
# hotový obrázek se ukáže hned, živé kreslení 19 akvarelů trvalo na telefonu několik sekund
for c in data["civilizace"]:
    im = Image.open(os.path.join(KOREN, "static/starovek", c["id"], "malba.jpg")).convert("RGB")
    w, h = im.size; cw = min(w, int(h * 1.6)); x0 = (w - cw) // 2
    im = im.crop((x0, 0, x0 + cw, h)).resize((240, 150), Image.LANCZOS)
    im.save(os.path.join(KOREN, "static/starovek", c["id"], "nahled.jpg"), quality=78, optimize=True, progressive=True)
for c in data["civilizace"]:
    cil = os.path.join(KOREN, "artefakt/starovek", c["id"]); os.makedirs(cil, exist_ok=True)
    for k in c["fotky"]:
        im = Image.open(os.path.join(KOREN, "static/starovek", c["id"], k + "-720.jpg")).convert("RGB")
        im.thumbnail((420, 420), Image.LANCZOS)
        p = os.path.join(cil, k + ".jpg"); im.save(p, quality=62, optimize=True, progressive=True); celkem += os.path.getsize(p)
print("fotky pro artefakt: %.1f MB" % (celkem / 1048576))
