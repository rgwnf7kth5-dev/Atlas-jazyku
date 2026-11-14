# Nástroje pro překlady a putování (mimo build)

Pomocné skripty, které dřív ležely jen v dočasné složce relace. Build ani validace je nepoužívají.

## preklad/ – překlad delších textů do dalšího jazyka webu (naposledy čínština, etapa 2)
- `vytahni.py` – najde v `data/*.json` objekty s předchozím jazykem a bez nového, rozdělí je do dávek (`src/zNN.json`, anglický originál).
- `ZADANI.md` – zadání pro překladatele (agent na dávku), `KONTROLA.md` – zadání pro nezávislého kontrolora.
- `kontrola.py <dávka>` – struktura, nepřekládaná pole, interpunkce. `oprava.py kontrola/k-zNN.json [--zkus]` – použije opravy kontrolorů.
- `sjednoceni.py` – sjednocení termínů napříč dávkami. `vloz.py zNN …` – vloží překlad do dat (klíč za předchozím jazykem).
- Skripty mají v sobě kód jazyka (`zh`, za `he`) a pracují v aktuální složce (`src/`, `out/`, `kontrola/`) – pro další jazyk upravit.

## putovani/ – nové putování jazyka na glóbu
- `ZADANI-autor.md` (vzor zadání pro autora), `ZADANI-preklad.md` (překlad hotového putování do ostatních jazyků).
- `stavba.py` + `pomoc.py` – generátor záznamu (oblasti, proudy zhuštěné po hlavní kružnici). `sousede.py` – sousední oblasti stejné barvy.
- `chk.py <soubor.json> 50m|10m` – šipky a oblasti proti pevnině. Potřebuje `shapely` a vedle sebe `land-50m.geojson` / `land-10m.geojson`
  (Natural Earth, např. https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson → přejmenovat).
  Pozor: v 10m se Fidži přes 180. poledník rozpadá na pás kolem 16–17° j. š. (falešné hlášení).
