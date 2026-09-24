# Atlas jazyků – pokyny pro Claude Code

Otáčivý glóbus se všemi jazyky světa pro děti, česky a anglicky. Komunikuj česky.
Uživatel není programátor a pracuje na Windows: vysvětluj jednoduše a když něco chybí, řekni přesně co a odkud nainstalovat.

## Příkazy

```
npm run check      # validace + sestavení; spusť vždy před commitem
npm run build -- --artefakt build   # navíc fragmenty pro publikování jako artefakt (ODKAZ_CS, ODKAZ_EN)
```

## Web

Web běží na **https://atlasoflanguages.netlify.app** (anglicky `/en/`).
Nasazení přes Netlify z větve `main` podle `netlify.toml` (build `npm run check`, publikuje `dist/`).
Z prostředí Claude Code na webu je `*.netlify.app` blokované (curl i WebFetch vrací 403), živý web tedy odsud
zkontrolovat nejde – ověřuj `dist/` v Playwrightu a stav nasazení nech na uživateli.
Česky na `/`, anglicky na `/en/`. Když validace spadne, Netlify nový web nezveřejní – tak to má být.

## Struktura a pravidla

- `data/*.json` je jediný zdroj pravdy. `dist/` se generuje, needituj ho ručně.
- **Jedna šablona, dva jazyky.** `src/body.html` + `src/app.js` + `src/styles.css` jsou společné,
  texty jsou v `src/ui/cs.json` a `src/ui/en.json` (musí mít stejné klíče, validace to hlídá).
  Každý jazyk v `data/languages.json` má část `cs` i `en`.
- **Stránka nesmí záviset na CDN.** d3-geo, d3-array a topojson-client jsou ve `vendor/` a build je vkládá
  do stránky. Dřívější verze tahala d3 z cdnjs a v náhledu artefaktu pak nefungovalo vůbec nic.
- Glóbus je v pojistce: když selže, police jazyků a karty musí fungovat dál.
- **Stránka začíná celým světem bez vybraného jazyka** (přání uživatele: neotevírat češtinou ani jiným jazykem).
- Sbírka pozdravů (počítadlo v hlavičce, hvězdičky u otevřených jazyků) byla 23. 9. 2026 na přání uživatele
  odstraněna – nedávala smysl. Znovu ji nepřidávat.
- Dole v panelu se seznamem je odkaz na zpětnou vazbu e-mailem (`castor2@me.com`, klíče `zpetna…` v `src/ui/*.json`).
  Předmět e-mailu se nastaví podle jazyka; v artefaktu se odkaz otevírá v novém okně, jinak by ho náhled zablokoval.
- **Přepnutí jazyka je na místě, ne odkazem do nového listu** (přání uživatele). Každá stránka nese oba jazyky;
  texty v šabloně mají `data-t`, `data-t-title`, `data-t-aria-label`, `data-t-placeholder` a JS je přepíše.
  Nový text v šabloně proto musí dostat i tuhle značku. Na webu se při přepnutí mění adresa `/` ↔ `/en/`.
- **Samo-otáčení je volba, výchozí vypnutá** (přání uživatele: při přiblížení nešlo zaměřit bod).
  Výběr jazyka ho vypne. Při přiblížení se otáčí pomaleji (rychlost / zoom).
- Od přiblížení 2× se u teček kreslí jména jazyků (přepínač „Jména“, výchozí zapnutý). Napřed jazyky z atlasu, pak ostatní; popisek, který by
  překryl jiný, se vynechá (mřížka obsazenosti 4 px). Nejvýš 450 popisků na snímek.
  Vybraný jazyk a jeho příbuzní (konce oblouků) mají jméno vždy, i bez přiblížení.
- Areál jazyka = seznam kruhů `[délka, šířka, poloměr ve stupních]`, kreslí se barvou rodiny oříznutý na pevninu
  (jádro ×1,3, měkký okraj ×1,75). Státy v `zeme` se vybarví celé – jen tam, kde se jazykem opravdu mluví v celém státě.
- **Znakové jazyky** (225 teček: rodina „Sign Language“ v Glottologu + názvy se „Sign Language“; build je dává do
  `REJSTRIK.zn`). Přepínač „Všechny / Bez znakových / Jen znakové“ v panelu Zobrazení schová tečky, popisky, výsledky
  hledání i jazyky atlasu (z atlasu je znakový jen český znakový jazyk `czj`); volba se pamatuje (`atlas-znakove`).
  V režimu „Jen znakové“ ukáže police všechny znakové jazyky i bez hledání.
  **Karta znakového jazyka nesmí používat texty pro mluvené jazyky** (uživatel: „vypadá to, že se děti napřed učí
  znakovou řeč“): má úvod „Co je znakový jazyk“, vlastní stupně ohrožení `aesZnak` (o neslyšících dětech)
  a „Kde se jím znakuje“ / „Znakuje jím“ místo „mluví“.
- **Vitalita jazyka** (dřív „ohrožení“). Data jsou stupnice AES z Glottologu, která je 1:1 šestistupňová stupnice
  UNESCO (Atlas of the World's Languages in Danger, Moseley 2010) – převod je v `glottolog/config/aes_status.ini`:
  not endangered = safe, threatened = vulnerable, shifting = definitely endangered, moribund = severely endangered,
  nearly extinct = critically endangered, extinct = extinct. Názvy proto používej UNESCO: **bezpečný, zranitelný,
  jednoznačně ohrožený, vážně ohrožený, kriticky ohrožený, vymřelý** (safe … extinct), popisy podle definic UNESCO.
  Navíc **probouzený** (awakening): na stupnici UNESCO vymřelý, ale oživovaný; Glottolog ho má jen v komentáři
  z původního zdroje (ElCat „Awakening“, Ethnologue „Reawakening“), `scripts/podrobnosti.mjs` ho ukládá jako 6.
  V `radky` je tedy vitalita -1 (bez údaje) až 6. Řádek „Vitalita“ v panelu Zobrazení otevře podstránku se stupni (lze vybrat víc,
  předvolby „Všechny“ a „Jen ohrožené“ = zranitelný až kriticky); volba se pamatuje (`atlas-vitalita`).
  Filtry vitality a znakových jazyků se skládají v `uplatniFiltry()`.
  Dokud je podstránka otevřená, tečky mají **barvu podle vitality**: ordinální stupnice jednoho odstínu (oranžová,
  bezpečný → vymřelý, `--vit-0`…`--vit-5`), prošla validátorem palet `--ordinal` na pevnině v noci i ve dne;
  probouzený zeleně (`--vit-6`), bez údaje šedě. Pořadí ani odstíny neměnit bez nového ověření.
  Vitalita je na kartě tečky i na kartě jazyka z atlasu (`oddilVitality`).
- Popisek dole na glóbu se mění podle filtru („Podle filtru svítí 4 095 z 7 967…“) a při barvení vitality.
- **Odkaz na jazyk**: `#cs` (id jazyka z atlasu) nebo `#corn1251` (glottocode tečky, build ho dává do `REJSTRIK.g`).
  Výběr zapíše adresu (`history.replaceState`), otevření odkazu jazyk vybere; když ho schovává filtr, filtry se zruší.
  Tlačítko s řetízkem na kartě odkaz zkopíruje (v artefaktu je skryté).
- **Klik na zemi** ukáže počet všech jazyků státu z rejstříku (Glottolog `Countries`; převod názvu státu z mapy
  na kód je `mapaStatu` v `podrobnosti.json`) a tlačítko, které je na glóbu rozsvítí (příznak 5) a přiblíží stát.
  Kosovo, Severní Kypr a Somaliland kód nemají – ukáže se jen seznam jazyků z atlasu.
- Náhled pro sdílení odkazu (og:image) je `static/nahled-cs.jpg` / `nahled-en.jpg`, ikonka `static/favicon.svg`
  (vkládá se do stránky) a `apple-touch-icon.png`. Build kopíruje `static/` do `dist/`. Obrázky vyrábí
  `scripts/nahledy.mjs` (potřebuje Playwright) – po větší změně vzhledu je vyrob znovu. Adresa webu je v `build.mjs` (`WEB`).
- Od vybraného jazyka vedou světelné oblouky k nejbližším příbuzným (nejvýš 6, podle nejhlubšího společného
  předka ve stromu Glottologu). U jazyka z atlasu jen k jiným jazykům atlasu, karta je vypisuje.

## Rozhraní (grafické vylepšení 23. 9. 2026, uživatel schválil všech 7 bodů)

- **Lišta dole na glóbu** (`.dok`): Náhodný jazyk (hlavní tlačítko), Celý svět (jen když je něco vybrané), zoom
  a „Zobrazení“. Pod tím je **panel Zobrazení** (`#panel-zobrazeni`): otáčení, jména, znakové jazyky a řádek
  Vitalita, který otevře podstránku se stupni (šipka Zpět, Escape zavře napřed ji, pak panel). Odznak na
  tlačítku Zobrazení ukazuje počet zapnutých filtrů. Legenda je vpravo nahoře.
- **Karta jako pohlednice**: nahoře „hero“ v barvě rodiny (u teček bez atlasu azurová) s velkým pozdravem,
  pod ním štítky (mluvčích, rodina, vitalita) a záložky (atlas: Zajímavost / Vitalita / Příbuzní;
  tečka: Přehled / Jak funguje / Příbuzní). Při výběru nového jazyka karta vjede (`vjezd`).
- **Kouzlo výběru**: let k jazyku s „poskokem“ (u daleké cesty se glóbus cestou oddálí), po doletu se území
  rozlije vlnou od domovské tečky (`ODHALENI`, 950 ms) a oblouky k příbuzným vystřelí jeden po druhém.
- **Police ukazuje všechny jazyky**, ne jen atlas (uživatel: jen pár desítek působilo neúplně). Ve skupině jsou
  napřed jazyky z atlasu jako velké dlaždice s pozdravem, pod nimi „Další jazyky“ z rejstříku jako malé dlaždice
  (podtitul stát, u abecedy rodina). Řazení podle rodin (rodiny Glottologu od největší, izolované jazyky na konec) /
  A–Z (česky i Č, Ch, Ř, Š, Ž) / světadílů (`atlas-razeni`). Filtry i hledání platí i tady. Dlaždic je skoro 8 000,
  proto se kreslí po dávkách 240 (`pridavej`, zarážka hlídaná `IntersectionObserver`).
  Skupiny začínají tam, kde je čtenář doma: u rodin indoevropská (rodina češtiny i angličtiny), u světadílů Eurasie.
- **Jazyk dne** nahoře v polici musí být vidět (uživatel: malý a v barvě rodiny si ho nikdo nevšiml). Má vlastní
  přechod „východu slunce“ `#C2410C → #BE185D → #7E22CE` (bílý text min. 5,2 : 1), bílý štítek s hvězdičkou a dnešním
  datem, velký pozdrav, zajímavost a tlačítko „Ukaž mi ho na glóbu“. Barvu rodiny nepoužívá, aby nevypadal jako další dlaždice.
  Jazyk se mění o půlnoci místního času.
- **Živější glóbus**: v noci světélka jemně třpytí (překresluje se jen WebGL, co 60 ms, usíná s okrasným
  pohybem), koule má odlesk slunce (ve dne výraznější).
- **Mobil (≤ 920 px)**: karta je spodní vysouvací list (úchyt, tažení nahoru = celá, dolů = menší / zavřít),
  lišta je pod glóbem, pod 480 px jen ikony. Po výběru stránka odroluje nahoru ke glóbu.
- **Úvod**: glóbus přiletí z vesmíru (2,2 s), pak ukazatel „Klikni na mě!“ ukáže na jazyk (česky na češtinu,
  anglicky na angličtinu). Po prvním výběru se už nikdy neukáže (`atlas-uvitano`). Při
  `prefers-reduced-motion` ani s odkazem `#…` přílet neběží (ukazatel se ukáže hned, pokud nic není vybrané).
- **Rodokmen** (tlačítko v liště, 24. 9. 2026 podle videa rodokmenu ve 3D od uživatele): místo glóbu se na
  plátně `#strom` ukáže 3D strom jedné rodiny z Glottologu (`PD.nad`, `PD.uzly`). Dole je kořen (společný předek),
  výška = hloubka ve stromu, úhel = pořadí listů, poloměr roste s hloubkou, takže strom má tvar koruny; sourozenecké
  listy jsou do vějíře. Kroužek („prstýnek“) jen u rozvětvení, průchozí uzly se nekreslí. Jazyky s pozdravem jsou
  velké tečky v barvě rodiny. Vybraný jazyk má zvýrazněnou cestu ke kořeni a ostatní větve ztmavnou. Tažení otáčí,
  kolečko / dva prsty přibližují, klik na větev na ni zaostří, klik na jazyk ho vybere (karta, glóbus). Strom
  vyroste od kořene (1,5 s), pak se pomalu otáčí a po 20 s usne; `prefers-reduced-motion` obojí vypne.
  Kreslí se vlastní perspektivou na 2D plátno (žádná knihovna). Glóbus se mezitím nepřekresluje.
  Výběr rodiny nabízí rodiny s aspoň třemi jazyky; izolované jazyky strom nemají. Na kartě je v záložce
  Příbuzní tlačítko „Ukázat v rodokmenu“ (`tlacitkoRodokmenu`). Filtry (znakové, vitalita) platí i ve stromu.
  Názvy větví jsou z Glottologu anglicky; české překlady hlavních větví jsou v `data/glottolog-branches.cs.json`
  (validace hlídá, že větev v Glottologu existuje). V české verzi se u větví ukazují popisky jen přeložených větví.
- Pořád platí: žádný satelit, prstenec, rohy zaměřovače ani sbírka pozdravů.

## Podrobnosti k tečkám

`scripts/podrobnosti.mjs` spojí k 7 967 tečkám data z Glottologu (ohrožení, popsanost, příbuzenstvo, státy,
nářečí), WALS (stavba jazyka), PHOIBLE (hlásky), UDHR (ukázka textu) a CLDR (české názvy, odhad uživatelů).
Zdroje stahuje do `.cache/` (není v gitu). Pořadí: `node scripts/glottolog.mjs`, pak `node scripts/podrobnosti.mjs`.
Příbuzenstvo je uložené jako strom (uzel zná rodiče), cestu a „nejbližší příbuzné“ dopočítá stránka.
Údaj bez doloženého zdroje nepřidávat.

**Wikidata** jsou z prostředí Claude Code na webu blokovaná, proto je stahuje GitHub Actions
(`.github/workflows/wikidata.yml`, 1. v měsíci a ručně přes Actions → Run workflow). Výsledek přijde jako pull request;
Netlify k němu udělá náhled. Pro pull request musí být v Settings → Actions → General zapnuté
„Allow GitHub Actions to create and approve pull requests“. `.github/workflows/kontrola.yml` spouští `npm run check`
u každého pushe.

## Barvy

- **Vzhled „Hvězdná mapa se sklem“** (vybral uživatel 22. 9. 2026 ze tří návrhů: „B se sklem z A“).
  Tečky (světélka) na glóbu jsou **jen jazyky**. Pevnina je plná plocha – v noci světlejší než moře, ve dne
  tmavší (přání uživatele: tečky pevniny stejně velké jako jazyky mátly). Území vybraného jazyka má barvu rodiny, kolem je atmosféra (prstenec ani obíhající satelit tam být nemají – uživatel je nechtěl). Dole je
  souřadnice středu pohledu a počet jazyků na očích; rohy „zaměřovacího rámečku“ jsou pryč, protože mátly. Panely jsou „tekuté sklo“ (`.sklo`, `backdrop-filter`).
  Písma Chakra Petch (nadpisy), Outfit (text), JetBrains Mono (data).
- **Noc a den.** Vzhled se řídí nastavením počítače (`prefers-color-scheme`, i za běhu), přepínač
  sluníčko/měsíček ho přebije. Volba se pamatuje (`atlas-motiv`); když se shoduje s počítačem, smaže se
  a stránka se zase řídí počítačem. Skript v hlavičce nastaví `data-theme` hned, aby stránka neblikla. Denní barvy jsou v `:root[data-theme="light"]`; glóbus je čte z CSS proměnných
  (`nactiBarvy`). Ve dne se světélka nesčítají (na světlé kouli by zmizela), kreslí se obyčejně.
  Ve dne se neříká „světélko“, ale „bod“: texty s tímto slovem mají denní znění s příponou `Den`
  (`podnadpisDen`, `legendaDen`…), vybírá je `tx()` a po přepnutí vzhledu se texty obnoví (`obnovTexty`).
- Barvy rodin (`--r-*`): noční sada prošla validátorem palet (skill dataviz) na `#04060F` i `#101634`,
  denní sada (`#2E63D6 #E2544A #0A9BB5 #E09A18 #0A7541 #8A44C8`) na bílé. Zlatá má ve dne kontrast
  jen 2,4 : 1, proto nese tmavý text (`--t-afro`).
  **Pořadí ie → st → an → afro → nk → ost je součást ověření, neměnit.** Osm barev neprošlo, proto je
  šest skupin a menší rodiny jsou v „ostatních“ (přesná rodina je vždy napsaná na kartě).
  Každá barva má vždy i textový popisek (druhotné rozlišení – nerušit).

## Výkon

Glóbus má čtyři plátna nad sebou: `#podklad` (koule, pevnina, území vybraného jazyka, hranice – 2D),
`#gl` (7 967 světélek – WebGL, bez něj záložní 2D; barva a velikost podle příznaku 0–5 z polí `u_b`, `u_vel`, `u_mek`), `#popisky` a `#globus` (oblouky a zaměřovač; bere myš).
Každé se překresluje, jen když je potřeba. Neměř jen JS – drahá je rasterizace a skládání vrstev.
`ctx.filter` (blur) stál 52 ms na snímek, proto se nepoužívá. Hustota pixelů 2D pláten je u velkého
plátna omezená na 1,35. Koule s atmosférou i stín koule se kreslí do zásoby; pevnina je jeden obrys
(`objects.land`), hranice států se kreslí až od přiblížení 1,4×.
Okrasný pohyb (světla na obloucích, obvod karty) po 20 s bez dotyku usne.

## Ověření faktů

Zajímavosti jsou pro děti, ale musí být pravdivé. 22. 9. 2026 opraveno 19 nepřesností (např. zulská
odpověď na pozdrav je „Ngikhona“, ne „shiboka“; „mrož“ není z nizozemštiny). Novou zajímavost ověř.
