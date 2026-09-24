"""Podklad pro reliéfní glóbus: jeden šedý obrázek 3072 × 1536 (rovnoběžková projekce), WebP.

Pevnina: stínovaný reliéf z Natural Earth (Tom Patterson, shadedrelief.com, public domain).
Moře:    tvar mořského dna z ETOPO1 (NOAA, public domain).
Oba obrázky jsou v pythonovém balíčku basemap-data (mpl_toolkits/basemap_data/shadedrelief.jpg
a etopo1.jpg): `pip download --no-deps basemap-data`, rozbalit .whl a zkopírovat do .cache/relief/.

Kódování: moře je v hodnotách 0–0,45 (tmavší = hlubší), pevnina 0,55–1 (tmavší = stín svahu).
Stránka podle hodnoty pozná, co je moře a co pevnina, a obarví je podle vzhledu (den / noc).
Spuštění: python3 scripts/relief.py   (potřebuje pillow, numpy a scipy)
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZDROJ = os.path.join(KOREN, ".cache", "relief")
VYSTUP = os.path.join(KOREN, "data", "relief.webp")
W, H = 3072, 1536

def nacti(jmeno):
    return np.asarray(Image.open(os.path.join(ZDROJ, jmeno)).convert("RGB").resize((W, H), Image.LANCZOS), dtype=np.float32) / 255

sr, et = nacti("shadedrelief.jpg"), nacti("etopo1.jpg")

# moře v Natural Earth I je modré: modrá nad zelenou a zelená nad červenou
# (zelené nížiny mají modrou pod zelenou, led a sníh mají zelenou skoro stejnou jako červenou)
more = ((sr[..., 2] - sr[..., 1]) > 0.03) & ((sr[..., 1] - sr[..., 0]) > 0.04)
more = ndimage.binary_opening(more, iterations=1)
more = ndimage.binary_closing(more, iterations=1)

# pevnina: jen stínování svahů, bez hypsometrických barev (světlo / průměr okolí)
jas = sr @ np.array([0.3, 0.55, 0.15], dtype=np.float32)
okoli = ndimage.gaussian_filter(jas, 24)
stin = np.clip((jas / np.maximum(okoli, 1e-3) - 0.72) / 0.5, 0, 1)
# vysoké hory o kousek tmavší, ať je Himálaj nebo Andy poznat i z dálky
vyska_et = et @ np.array([0.3, 0.55, 0.15], dtype=np.float32)

# moře: hloubka z barev ETOPO1 (mělčiny světlé, hlubiny tmavé) a jemná struktura dna
dno = ndimage.gaussian_filter(vyska_et, 2.2)   # dno hladší: zrnitost na glóbu nevidět a obrázek je o polovinu menší
dno = np.clip((dno - 0.12) / 0.55, 0, 1)

hodnota = np.where(more, 0.45 * dno, 0.55 + 0.45 * stin)
os.makedirs(os.path.dirname(VYSTUP), exist_ok=True)
# WebP je při stejné kvalitě asi o 35 % menší než JPEG (Safari ho umí od verze 14)
Image.fromarray((hodnota * 255 + 0.5).astype(np.uint8), "L").save(VYSTUP, "WEBP", quality=76, method=6)
print(VYSTUP, os.path.getsize(VYSTUP) // 1024, "kB")
