# Atlas jazyků – pokyny pro Claude Code

Encyklopedický atlas jazyků světa na otáčivém glóbu, česky, anglicky, od 2. 10. 2026 italsky a od 3. 10. 2026 německy. Komunikuj česky.
**Publikum od 26. 9. 2026: studenti a výš** – vysokoškoláci, učitelé, dospělí zájemci i odborníci (uživatel: „pro studenty a výše, nejenom pro ně“). Česky se vyká. Texty věcné,
encyklopedické, odborné termíny s vysvětlením, bez zvolání, výzev („Zkus to vyslovit!“) a zdrobnělin. Samostatná
**varianta pro děti** (jiná grafika, animace, obrázky, mnohem méně jazyků) je nápad uživatele **na později, ne teď**.
**Směr od 25. 9. 2026 (uživatel): „nechci nic pro děti, chci vážně, encyklopedické“.** Nové funkce navrhovat jako
seriózní jazykovědný atlas pro dospělé (doložená data, zdroje, typologie), ne hry a dětské prvky. Hra „Kde se tak
mluví?“ byla ze stejného důvodu odstraněna – nevracet.
Uživatel není programátor a pracuje na Macu (a iPhonu), ne na Windows: vysvětluj jednoduše a když něco chybí, řekni přesně co a odkud nainstalovat.

## Příkazy

```
npm run check      # validace + sestavení; spusť vždy před commitem
npm run build -- --artefakt build   # navíc fragmenty pro publikování jako artefakt (jen cs a en; ODKAZ_CS, ODKAZ_EN)
```

## Web

**Domény (25. 9. 2026):** `atlasjazyku.cz` (česky; registrace a DNS u Českého hostingu, záznamy A na Netlify
`75.2.60.5`, AAAA smazané) a `thelanguageatlas.com` (anglicky; koupená v Netlify, Netlify DNS, primary domain).
Jeden web, obě domény v Netlify → Domain management. **Kterou verzi dostane která doména, rozhoduje edge funkce
`netlify/edge-functions/domeny.js`** (thelanguageatlas.com → `dist/en/` z kořene, společné `/js`, `/malby`, ikony a náhledy
z kořene; `www.atlasjazyku.cz` → `atlasjazyku.cz`). Pravidla s doménou ve `from` v `netlify.toml` Netlify u tohoto webu
nepoužíval – 25. 9. 2026 vracela anglická doména českou stránku. Živý web jde zvenku prověřit workflow
`.github/workflows/diagnoza-webu.yml` (Actions → Diagnóza webu → Run workflow; spouští se i po změně `netlify.toml`
nebo `netlify/`): přesměrování, certifikáty, DNS, značky og: a obrázek náhledu. 25. 9. 2026 dopoledne neměla `atlasjazyku.cz`
ani `www` platný certifikát (Netlify posílal `*.netlify.app`) a X ani Facebook ji nenačetly; od 13:50 certifikát funguje (oprava: Domain management > HTTPS > Renew certificate).
**Adresy v buildu jsou od 25. 9. 2026 na nových doménách** (`DOMENA`, `WEB(cesta)` v build.mjs; Facebook ukazoval
odkaz bez obrázku, protože og:url mířil na netlify.app): canonical, og:url, og:image a hreflang každé stránky míří na
její doménu, anglické bez `/en/`. Každá doména má vlastní `robots.txt` a `sitemap.xml` (anglické v `dist/en/`).
**`atlasoflanguages.netlify.app` od 27. 9. 2026 přesměrovává** (301) na nové domény: edge funkce `netlify/edge-functions/stara-adresa.js` (`/en/…` → thelanguageatlas.com, ostatní → atlasjazyku.cz, cesta i parametry zůstávají; náhledy pull requestů `deploy-preview-…` ne). Diagnóza webu to vypisuje v oddílu „stará adresa“. Odkaz na druhou jazykovou verzi
vede na vlastních doménách na druhou doménu (`korenVerze` v app.js, statické stránky přes `WEB`) a přepnutí na místě
tam nemění adresu. **Google Search Console** (25. 9. 2026): služby s předponou URL `https://atlasjazyku.cz/`
a `https://thelanguageatlas.com/`, ověření značkou HTML – kódy jsou v `GOOGLE_OVERENI` v build.mjs a build je dává
na úvodní stránky obou domén. Nemazat, jinak Search Console ověření zruší. Pak odeslat `sitemap.xml` u obou služeb.

Anglický název je **The Language Atlas** (podle domény, 25. 9. 2026). Web dosud běží i na **https://atlasoflanguages.netlify.app** (anglicky `/en/`).
Nasazení přes Netlify z větve `main` podle `netlify.toml` (build `npm run check`, publikuje `dist/`).
Z prostředí Claude Code na webu je `*.netlify.app` blokované (curl i WebFetch vrací 403), živý web tedy odsud
zkontrolovat nejde – ověřuj `dist/` v Playwrightu a živý web workflow Diagnóza webu (viz výš).
Česky na `/`, anglicky na `/en/`. Když validace spadne, Netlify nový web nezveřejní – tak to má být.

## Italská verze (od 2. 10. 2026)

Uživatel se ptal, jak velký problém by byly další jazyky (IT, DE, FR), a zvolil **začít italštinou**, po etapách. Adresa
**thelanguageatlas.com/it/** (`dist/it/`; edge funkce `domeny.js` cesty `/it/*` vynechává, `/it` → `/it/`; `DOMENA.it`, `WEB()`
v build.mjs, `DOMENY.it` a `korenVerze` v app.js). V záhlaví je místo odkazu „English/Česky“ **přepínač CS · EN · IT**
(`<nav id="jazyk-prepinac">` se třemi `a[data-l]`, aktuální `aria-current`; přepíná na místě jako dřív, `obnovOdkazJinam`).
- **Jak funguje záloha:** jazyky webu jsou `JAZYKY_WEBU` v build.mjs, další (ne cs/en) `DALSI`. **Co v italštině chybí, ukáže se
  anglicky**: texty rozhraní spojí build (`spoj(UI.en, it.json)` po klíčích), data `{cs, en}` doplní prohlížeč (`doplnJazyky`
  v app.js: `it = en`, částečný překlad se doplní po klíčích; volá se na STAROVEK, VYMYSLENE, PUTOVANI, CESTY, TYP, DNY,
  PISMA_SVETA). Validace u it.json hlídá jen navíc klíče a `lang`, chybějící klíč je upozornění.
- **Přeloženo:** celé rozhraní `src/ui/it.json` (i návod, O datech, Vitalita, tajemství), karty 164 jazyků (`it` v languages.json:
  název, výslovnost pro italského čtenáře, rodina, zajímavost – validace je hlídá jako cs/en), důvody Jazyka dne (`dny-jazyku.json`),
  36 písem (`pisma.json`), typologické mapy (`typologie-popis.json`; příklady přizpůsobené italštině ověřené ve WALS: 81A SVO,
  112A non, 116A jen intonace, 129A mano/braccio). Hlas záložní výslovnosti `it-IT`.
- **Nezávislá kontrola překladu** (2. 10. 2026) našla 44 připomínek, opraveny: niger-congo (ne niger-kordofaniana – to je širší skupina), „e altri {n}“ (země, nářečí), vzájemná srozumitelnost (srbština aj., wu), Bulharsko „annuire = no“, Slovensko 1993 jako stát, „lingue giudaiche“ (ne ebraiche), „indoaria“, „brittonico“, „cananeo“, vynechané pasáže návodu vráceny, jednotný přepis /ʒ/ jako „sg“ (bon-SGIUR, SGIV-io, bon-SGIU) a /ʃ/ jako „sc“, bez „ă“ a koncového „cc“; typologie: toni di contorno, marcatura marginale, „Nessuno“ u rodů.
- **Názvy:** `data/nazvy-it.json` vyrábí `node scripts/nazvy.mjs it` (CLDR 48.2 a i18n-iso-countries přes jsDelivr): 537 jmen
  teček (`PD.nazvy.it`, index → jméno; bez jména anglicky z Glottologu), státy, státy na mapě (Kosovo, Severní Kypr, Somaliland
  ručně), písma. Rodiny `data/glottolog-families.it.json` (~40 největších), větve `data/glottolog-branches.it.json` (~170
  nejčastějších na cestách jazyků atlasu; `prekladVetve()` v app.js, `PD.vetveJ`). Validace hlídá, že rodiny a větve v Glottologu jsou.
- **Druhá etapa (2. 10. 2026, uživatel: „přelož všechno“):** přeloženo i 31 stránek Jazyků starověku a Příběhů (`it` v `data/starovek.json`,
  `adresa.it` např. `antico-egitto`, `il-te` – ne `te`, to je kód telugštiny; popisky fotek `fotky[k].it`), 11 putování (`adresa.it`
  `viaggio-ceco`…), cesty slov a vymyšlené jazyky. Překládalo osm pomocných agentů podle zadání (věrně, bez změny tvrzení, znaky písem,
  přepisy a bibliografie beze změny), glosy ukázkových vět (oddíl `veta`, pole `slova`) doplněny zvlášť; pak čtyři nezávislé kontroly
  (68 oprav: mj. „non è necessariamente imparentata“ u čaje – byl obrácený smysl, Tavolozza di Narmer, bustrofedo, Mikulčice: nejstarší
  kamenné kostely ~800, Genji „figlio dell’imperatore“, ge’ez z nedoložené mateřské řeči, „alfabeto albano“ = kavkazské). Názvosloví:
  české národní obrození = **„Rinascita nazionale (ceca)“, ne „Risorgimento“** (to je italské sjednocení); stupně UNESCO jako v rozhraní
  („decisamente in pericolo“); „Lungo Computo“. Validace hlídá u stránek s `it` stejné oddíly jako `en`, `adresa.it` a popisky fotek.
- **Artefakt nese od 3. 10. 2026 jen češtinu a angličtinu** (`ARTEFAKT_JAZYKY` a `jenJazyky` v build.mjs vyhodí z dat klíče ostatních jazyků; s italštinou měl 15,2 MB, s němčinou by přesáhl limit 16 MB; teď ~15,0 MB = 14,3 MiB). V přepínači artefaktu vedou IT a DE na web (nový list).
- **Italské statické stránky** (`scripts/stranky.mjs` je od 2. 10. 2026 pro libovolné jazyky `JAZYKY_WEBU`): `/it/lingua/<nome>/`,
  `/it/lingue/`, `/it/sui-dati/`, `/it/giornate-delle-lingue/`, `/it/guida/`, `/it/vitalita/`, `/it/antichita/<…>/`, `/it/storie/<…>/`;
  záhlaví má přepínač CS · EN · IT, hreflang všech tří verzí, sitemapa anglické domény obsahuje i `/it/`. Build stránkám předává data
  doplněná angličtinou (`doplnJ`), jména teček (`jmenoTecky`) a rodiny (`rodinyJ`). Obrázky (malby, fotky, náhled) leží v kořeni a
  og:image italských stránek míří na anglickou doménu bez `/it/`. Wikidata italská jména nemají (stahují se v Actions jen cs/en),
  Wikipedie se v italské verzi hledá italsky.
- **Chytré hledání** zná italská slova (`DOTAZ_SPUSTE`, předložky del/della/nel…, `DOTAZ_VYPLN`, „dove“) a italské názvy
  rodin, větví, států a jazyků; „lingue del Brasile“, „lingue slave“, „dove si parla il persiano“ fungují. AI odpovídá jazykem otázky.
- Obrázek pro sdílení je zatím anglický (`NAHLED.it = NAHLED.en`, kopie v `dist/it/`), og:locale `it_IT`, hreflang všech tří
  verzí na úvodních stránkách a v sitemapě anglické domény.
- Nový jazyk (DE, FR) = přidat do `JAZYKY_WEBU`, `LOCALE`, `DOMENA`, `DOMENY`, `src/ui/xx.json`, `node scripts/nazvy.mjs xx`,
  rodiny a větve, odkaz v přepínači v `body.html`, edge funkce a netlify.toml; pak překlady dat.

## Německá verze (od 3. 10. 2026)

Uživatel: „přidělej teď ještě v plném rozsahu také verzi pro DE“. Adresa **thelanguageatlas.com/de/** (`dist/de/`), stejná kostra
jako italština, přepínač **CS · EN · IT · DE**. Název **Atlas der Sprachen** („Sprachatlas“ je v němčině nářeční atlas). **Vyká se („Sie“).**
- Kostra je teď obecná: `JAZYKY_WEBU` v build.mjs je jediný zdroj (validace si ho čte), `DOMENA`, `LOCALE`, `WEB()` a odkazy přepínače
  (`odkaz<Jazyk>` v šabloně) se odvozují; `body.html` má odkaz na každý jazyk, edge funkce `domeny.js` vynechává `/it/*` i `/de/*`,
  netlify.toml přesměruje `/de` → `/de/`. Statické stránky `/de/sprache/<name>/`, `/de/sprachen/`, `/de/ueber-die-daten/`,
  `/de/sprachentage/`, `/de/anleitung/`, `/de/vitalitaet/`, `/de/antike/<…>/`, `/de/geschichten/<…>/`. Procenta s pevnou mezerou jako česky.
- Názvy: `node scripts/nazvy.mjs de` (CLDR 48.2: 544 jmen teček, státy, písma; `BEZNE` nahrazuje úřední tvary s čárkou – „Tansania“,
  „Syrien“, „Vereinigte Staaten“, „Tschechien“), rodiny `glottolog-families.de.json`, větve `glottolog-branches.de.json` (stejné klíče jako it).
- Hledání zná německá slova (`DOTAZ_SPUSTE` sprach/sprech/gesproch/zweig/dialekt, předložky im/von/aus/der, `DOTAZ_VYPLN`, „wo“); Wikipedie
  se hledá německy („<Name> Sprache“). Záložní hlas výslovnosti `de-DE`, srovnání hlásek s němčinou, ukázka VDLP německy.
- Přeloženo **vše** (dvanáct pomocných agentů z angličtiny podle zadání, devět nezávislých kontrol, asi 150 oprav): rozhraní `src/ui/de.json`,
  164 karet (`de` v languages.json, výslovnost přepsaná pro německého čtenáře: sch/tsch/dsch/w/j, přízvuk velkými), Jazyk dne, 36 písem,
  typologie (německé příklady ověřené ve WALS: 85A předložky, 87A, 88A, 116A slovosled; u 86A genitivu zůstaly anglické příklady, WALS
  vede němčinu jako „jméno – genitiv“), 31 stránek Jazyků starověku a Příběhů (`adresa.de` např. `hethiter`, `altes-aegypten`, `der-tee`),
  12 putování (`reise-tschechisch`…), cesty slov, vymyšlené jazyky. Nástroje překladu a kontroly jsou ve scratchpadu `de-preklad/`
  (ZADANI.md, KONTROLA.md, `vytahni*.mjs`, `kontrola*.mjs`, `vedle*.mjs`, `opravy.mjs`, `vloz-de.py`) – pro další jazyk zkopírovat.
- **Názvosloví:** stupně UNESCO **sicher · gefährdet (vulnerable) · definitiv gefährdet · ernsthaft gefährdet · kritisch gefährdet ·
  ausgestorben · wiedererweckt**, souhrnně „bedroht“ (nesmí kolidovat s „gefährdet“); indogermanisch; Glagoliza; Kiewer Blätter; tschechische
  nationale Wiedergeburt; Kralitzer Bibel; karta atlasu = „Steckbrief“ („Karte“ = mapa). Opraveno při kontrole mj.: obrácený smysl u
  akkadštiny a aramejštiny, Omri a Moab na stéle Méšově, „Lesezeichen“ (= záložka) u kunten, předpona kh- (přepis se nemění), „den Zehnten“,
  angl. daler „spätestens seit“, ethnicita × původ u maorštiny, Mendele/Perez a jidiš, „Republik Moldau“ × Moldau (kraj).

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
- **Patička seznamu je sbalená** do jednoho řádku „O atlasu, zdroje, kontakt, návod a kalendář“ (`<details class="pat-det">`, uživatel
  25. 9. 2026: „zabírá zbytečně moc místa, musí se schovávat“). Rozbalí se kontakt, O datech, Jazyky s pozdravem a zdroje.
- **Autor** (uživatel 3. 10. 2026): první řádek rozbalené patičky v aplikaci i na statických stránkách „Nápad, koncepce, vývoj: Tomáš Kubín“
  (klíče `autor`, `autorJmeno` v `src/ui/*.json`, ve všech jazycích; `<meta name="author">` na všech stránkách). Nemazat.
- Zpětná vazba e-mailem na **info@atlasjazyku.cz** (přesměrovaná na autora; 25. 9. 2026 místo dřívější soukromé adresy,
  kterou uživatel smazal – soukromou adresu na web nedávat). Řádek je v patičce seznamu i na statických stránkách,
  předmět podle jazyka, v artefaktu se odkaz otevírá v novém okně. Klíče `zpetna…` v `src/ui/*.json`.
- **Přepnutí jazyka je na místě, ne odkazem do nového listu** (přání uživatele). Každá stránka nese oba jazyky;
  texty v šabloně mají `data-t`, `data-t-title`, `data-t-aria-label`, `data-t-placeholder` a JS je přepíše.
  Nový text v šabloně proto musí dostat i tuhle značku. Na webu se při přepnutí mění adresa `/` ↔ `/en/`.
- **Samo-otáčení je volba, výchozí vypnutá** (přání uživatele: při přiblížení nešlo zaměřit bod).
  Výběr jazyka ho vypne. Při přiblížení se otáčí pomaleji (rychlost / zoom).
- Od přiblížení 2× se u teček kreslí jména jazyků, **jen když je zapnutý přepínač „Jména“ v Nastavení – výchozí je vypnutý**
  (uživatel 28. 9. 2026 podle hodnocení webu: v Evropě se jména překrývala). Pamatuje se jen volba člověka (`atlas-jmena`;
  dřívější `atlas-popisky` ukládal i výchozí stav, proto nový klíč). Napřed jazyky z atlasu, pak ostatní; popisek, který by
  překryl jiný, se vynechá (mřížka obsazenosti 4 px). Nejvýš 450 popisků na snímek.
  Vybraný jazyk a jeho příbuzní (konce oblouků) mají jméno vždy, i bez přiblížení a i s vypnutými Jmény.
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
  Navíc **probouzený** (awakening): Glottolog ho vede jako vymřelý, ale oživuje se (UNESCO sám v atlasu 2010 převedl
  kornštinu a manštinu z vymřelých mezi kriticky ohrožené – proto „vymřelý podle Glottologu“, ne „podle UNESCO“); Glottolog ho má jen v komentáři
  z původního zdroje (ElCat „Awakening“, Ethnologue „Reawakening“), `scripts/podrobnosti.mjs` ho ukládá jako 6.
  V `radky` je tedy vitalita -1 (bez údaje) až 6. Filtr stupňů je na **stránce Vitalita** (lze vybrat víc,
  předvolby „Všechny“ a „Jen ohrožené“ = zranitelný až kriticky); volba se pamatuje (`atlas-vitalita`).
  Filtry vitality a znakových jazyků se skládají v `uplatniFiltry()`.
  Se zapnutými barvami vitality mají tečky **barvu podle vitality**, rozlišenou podle významu (25. 9. 2026 na přání
  uživatele „výrazněji odlišit“ – jednobarevná oranžová stupnice na malých tečkách splývala): bezpečný **modře**,
  čtyři stupně ohrožení **teplou stupnicí** zlatá → oranžová → červená → vínová (validátor palet `--ordinal` na
  pevnině `--souse-vit`, v noci i ve dne; rozptyl odstínu do 40°), vymřelý **šedě** (v noci bledě, ve dne tmavě),
  probouzený **zeleně** (fialová splývala s modrou při deuteranopii), bez údaje světle/tmavě šedě. Sousední dvojice
  v legendě prošly kontrolou CVD. `--vit-0`…`--vit-6`, `--vit-nic`. Neměnit bez nového ověření.
  Vitalita je na kartě tečky i na kartě jazyka z atlasu (`oddilVitality`).
  **Medailon „Vitalita“ pod glóbem** (dřív tlačítko v liště, 25. 9. 2026, návrh schválený uživatelem místo barev vitality rovnou po otevření):
  od 27. 9. 2026 otevírá **stránku Vitalita** (viz níž). Barvy vitality (`vitalitaZap`, pamatuje se `atlas-barvy-vitality`,
  zapíná je tlačítko na stránce nebo dlaždice v okně Mapy; medailon pak má červený rám, třída `.zapnuto`) nad medailony
  ukážou vysvětlivku stupňů `#vit-legenda` (bezpečný → vymřelý, probouzený, bez údaje) – jen dokud jsou barvy zapnuté,
  jinak žádná vysvětlivka na glóbu (to uživatel nechce). Klepnutí na vysvětlivku otevře stránku Vitalita. Barvy rovnou po otevření
  nedoporučeno: bez vysvětlivky nic neříkají, pevnina přijde o reliéf, noc o třpyt a oranžové území by splývalo.
- **Odkaz na jazyk**: `#cs` (id jazyka z atlasu) nebo `#corn1251` (glottocode tečky, build ho dává do `REJSTRIK.g`).
  Výběr zapíše adresu (`history.replaceState`), otevření odkazu jazyk vybere; když ho schovává filtr, filtry se zruší.
  Tlačítko s řetízkem na kartě odkaz zkopíruje (v artefaktu je skryté).
- **Klik na zemi** stát hned podbarví, rozsvítí jeho jazyky (příznak 5) a ukáže počet všech jazyků státu z rejstříku
  (Glottolog `Countries`; převod názvu státu z mapy na kód je `mapaStatu` v `podrobnosti.json`); zavřením okna vše zhasne.
  Kosovo, Severní Kypr a Somaliland kód nemají – ukáže se jen seznam jazyků z atlasu.
- Náhled pro sdílení odkazu (og:image) je `static/nahled-cs.jpg` / `nahled-en.jpg`, ikonka `static/favicon.svg`
  (vkládá se do stránky) a `apple-touch-icon.png`. Build kopíruje `static/` do `dist/`. Obrázky vyrábí
  `scripts/nahledy.mjs` (potřebuje Playwright). Po přestavbě na medailony (27. 9. 2026) je uživatel **obnovovat nechce** („1 dělat nebudeme vůbec“) – nenavrhovat. V `og:image` je soubor s otiskem obsahu
  v názvu (`nahled-cs.<otisk>.jpg`, `NAHLED` v build.mjs, kopie v `dist/` i `dist/en/`): X a Facebook si obrázek pamatují podle adresy a po výměně obrázku ukazovaly
  starou upoutávku (uživatel 25. 9. 2026). Adresa webu je v `build.mjs` (`WEB`).
- **Skupiny Glottologu, které nejsou rodinou**: umělé jazyky, pidžiny, smíšené jazyky a zvláštní způsoby mluvy
  (`BEZ_RODU` v build.mjs → `REJSTRIK.nr`). Jazyky v nich spolu příbuzné nejsou, proto nemají oblouky k „příbuzným“,
  rodokmen ani společného předka ve srovnání; karta místo toho vysvětlí, proč do žádné rodiny nepatří.
  (Uživatel narazil na esperanto s oblouky k interslovanštině a znakovému jazyku na Šalamounových ostrovech.)
- **Nářečí** (dotaz z Twitteru: „proč bavorština a ne hanáčtina?“): tečky jsou jen jazyky Glottologu, nářečí ne.
  Jejich jména jsou v `data/nareci.json` (`node scripts/nareci.mjs`), karta jazyka je vypíše (`oddilNareci`,
  nejvýš 24) s poznámkou, proč nemají tečku, a hledání přes ně najde jejich jazyk („hanáčtina“ → čeština).
  České názvy nářečí češtiny jsou v `data/nareci-cs.json` (validace hlídá, že nářečí v Glottologu existuje).
- **Opravy poloh** jsou v `data/polohy-opravy.json` (glottocode → poloha a důvod), build je použije místo
  Glottologu. `"poloha": null` tečku z glóbu schová (`REJSTRIK.bp`, v aplikaci `BEZ_POLOHY`): jazyk zůstane
  v seznamu, hledání i srovnání, ale nemá tečku, zaměřovač ani let glóbu, karta místo států řekne proč.
  Tak jsou esperanto, interlingua a interslovanština – mezinárodní pomocné jazyky nevznikly na žádném místě
  (uživatel: „umělé jazyky by neměly mít polohu“). Efatština a rennellský znakový jazyk jsou v Glottologu také
  „umělé“, ale patří ke konkrétním ostrovům, tečku si nechávají. Glottolog jinak neopravovat bez důvodu.
- **Bavorština** (`bar`, 1. 10. 2026, podnět uživatele: „existuje Bairisch – jasně, dialekty, ale sranda to je“; vybral plnou kartu):
  164. jazyk atlasu. Tečku Glottologu `bava1246` jí dal ručně zapsaný odkaz v `data/glottolog.json` (sloupec 5 = `bar`), protože
  `scripts/glottolog.mjs` by stáhl novou verzi Glottologu; při jeho dalším spuštění se propojí sama přes kód ISO `bar`.
  Zajímavost vysvětluje, proč je jazykem i nářečím (ISO 639-3 × dialektologie v Německu a Rakousku), a šibolet Oachkatzlschwoaf.
  Při ověření opraveno: areál z 20 malých kruhů (velké kruhy zasahovaly do Švábska, Frank, Vorarlberska i Česka – Plzeň, Brno;
  kruh se kreslí ×1,3 s okrajem ×1,75), střed na tečce Glottologu, „jazykovědci v Německu a Rakousku“, en výslovnost SAIR-vus.
- **Jazyk dne den po tečce z rejstříku** (1. 10. 2026): po latině (30. 9.) spadla stránka – tečka rejstříku nemá `stred`, jen
  `bod`; `stredJazyka` teď bere `j.bod` a bez polohy (esperanto) se směr cesty vynechá.
- Od vybraného jazyka vedou světelné oblouky k nejbližším příbuzným (nejvýš 6, podle nejhlubšího společného
  předka ve stromu Glottologu). U jazyka z atlasu jen k jiným jazykům atlasu, karta je vypisuje.

## Rozhraní (grafické vylepšení 23. 9. 2026, uživatel schválil všech 7 bodů)

- **Medailony pod glóbem** (27. 9. 2026, uživatel vybral variantu „B, medailony s rámem, pod glóbem, nová ikonka
  Mapy OK, na telefonu Náhodný jazyk v panelu“): `<nav class="dok medailony">` se šesti kulatými tlačítky `.med`
  s obrázkem v rámu s bezelem (`.med-obr`, proměnné `--med-*` pro den i noc): **Jazyky starověku, Příběhy jazyků,
  Rodokmen, Mapy, Vitalita** a menší **Nastavení** (ozubené kolečko). Obrázky jsou `static/ikony/<klic>.jpg`
  (akvarely z `scripts/ikony.mjs`; `mapy.jpg` je snímek glóbu), build je vkládá jako `IKONY` (v artefaktu data:).
  Řada se drží vpravo od otevřené karty (`posunDok`), pod ní je rozmazaný podklad, aby jí neprosvítala jména teček.
  Na telefonu jsou medailony pod glóbem ve dvou řadách po třech. Ikony chrámu a knihy v záhlaví zmizely.
  **V rodokmenu je Mapy šedý a nečinný** (`aria-disabled`, odstíny šedi, `title` „V rodokmenu nejsou barevné
  mapy k dispozici“; uživatel 27. 9. 2026: barví jen glóbus). **Vitalita v rodokmenu funguje** (uživatel 27. 9. 2026:
  „oboje udělej“): se zapnutými barvami vitality mají jazyky ve stromu barvu stupně (`barvaVit` v kreslení stromu,
  barvy `--vit-*` v `nactiBarvyS`, `strom.prekresli()` z `nastavBarvyVitality`), vysvětlivka `#vit-legenda` zůstává
  i v rodokmenu a strom se na počítači vejde nad medailony a vysvětlivku (`zaklad()` odečte výšku `#dok` a legendy). Medailon Rodokmen se v rodokmenu
  mění na Glóbus.
  **Náhodný jazyk** je malé červené tlačítko v záhlaví seznamu vedle počtu jazyků (`.pocet-radek`), na počítači
  i telefonu. **Zoom a Celý svět** jsou nenápadně vpravo nahoře na glóbu pod otazníkem, bez pilulky (`.roh-ovladani`);
  na telefonu jen Celý svět (zoom dvěma prsty). Uživatel: „+ − nechat nenápadně někde v rohu bez pilulky“.
  **Panel Nastavení** (dřív „Zobrazení“, `#panel-zobrazeni`): jen otáčení, jména a znakové jazyky; odznak ukazuje
  zapnutý filtr znakových jazyků. **Barevné mapy ani vitalita v Nastavení nejsou** – jsou v okně Mapy a na stránce Vitalita.
- **Okno Mapy** (`<dialog id="mapy-okno">`, `postavMapy`, `otevriMapy`): všechny barevné mapy s kulatým náhledem –
  Písmo, Vitalita a 24 vlastností WALS po oblastech, zapnutá mapa má červený rám a nahoře „Vypnout barevnou mapu“.
  Výběr okno zavře (mapa nesmí být zakrytá). Tlačítko „Jiná mapa…“ v legendě typologie i písma okno otevře znovu.
  Náhledy jsou `static/mapy/<id>.jpg` (160 px, snímky glóbu v úzkém okně, aby byly tečky vidět), vyrábí je
  `scripts/mapy-nahledy.mjs` – po změně vzhledu glóbu nebo palet map spustit znovu. Build je přidává do `IKONY`
  jako `mapa-<id>`; edge funkce pouští `/mapy/*` na obou doménách.
- **Stránka Vitalita** (27. 9. 2026, `<dialog id="vitalita-okno">`, `postavStrankuVitality`, `otevriStrankuVitality`, odkaz
  `#vitalita` / `#vitality`, odkaz „Vitalita jazyků světa ›“ v oddílu vitality na kartě jazyka): úvod, čtyři hlavní čísla
  (bezpečné, ohrožené 1–4, vymřelé, probouzené, s podílem), tlačítko „Obarvit glóbus podle vitality“ (zapne barvy a stránku
  zavře), **stupně** jako vodorovné pruhy s počtem a podílem a zaškrtnutím = filtr (předvolby Všechny / Jen ohrožené; odznak
  `n/8` na medailonu Vitalita, když filtr něco skrývá), tabulka **podle makrooblastí Glottologu** s pruhem skladby stupňů,
  **ohrožené a probouzené jazyky atlasu** (dlaždice, klik vybere jazyk), **všechny probouzené jazyky** (štítky, klik ukáže
  tečku) s odkazem na příběh „Jazyky, které se vracejí“, tabulka **15 největších rodin** (bez izolátů, znakových jazyků
  a `BEZ_RODU`) s odkazem „Ukázat v rodokmenu“ (`tabulkaVitality`, stejná jako u oblastí), a **metodika a zdroje** (UNESCO 2003, Moseley 2010,
  Hammarström a kol. 2018 o AES, Glottolog, ElCat). Všechna čísla se počítají z dat při otevření; texty `vitStranka`
  v `src/ui/*.json`. Filtr stupňů byl dřív podstránkou panelu Zobrazení (`#vitalita-panel`, zrušeno).
  **Na webu je i samostatná stránka** `/vitalita/` a `/en/vitality/` (`scripts/stranky.mjs`, stejné texty `vitStranka` a čísla
  z dat při buildu; tabulky, ohrožené jazyky atlasu s odkazy na jejich stránky, probouzené jazyky s odkazy na glóbus, metodika).
  Je v sitemapě a v patičce statických stránek.
  Při ověření opraveno: probouzené jazyky jsou vymřelé podle Glottologu, ne podle UNESCO; AES jen „u většiny jazyků“ a
  „především“ z UNESCO, Ethnologue a ElCat (i z dalších publikací); latina nemá rodilé mluvčí, ale není doložená jen
  historicky; stupně UNESCO 2003 se jmenovaly unsafe a definitively endangered, názvy a popisy jsou z atlasu 2010;
  podíl je ze všech jazyků na glóbu (7 967), ne z Glottologu (8 618). **Verze Glottologu v citaci (5.2.1) je napsaná
  ručně** – po novém stažení dat ji zkontrolovat v `cldf-metadata.json` (`dc:bibliographicCitation`).
- **Karta jako pohlednice**: nahoře „hero“ v barvě rodiny (u teček bez atlasu azurová) s velkým pozdravem,
  pod ním štítky (mluvčích, rodina, vitalita) a záložky (atlas: Zajímavost / Vitalita / Příbuzní;
  tečka: Přehled / Jak funguje / Příbuzní). Při výběru nového jazyka karta vjede (`vjezd`).
  **Od 25. 9. 2026 vypadá jako kartotéční lístek** (uživatel: lístek na stránkách jazyků „velice povedený, nemohli bychom
  touto cestou jít i u karet na glóbu?“): krémový papír `--listek`, červená linka nahoře, hlava lístku (poloha, odkaz,
  křížek) nad červenou čarou, malba vsazená s okrajem, štítky jako linkované řádky (název vlevo, hodnota vpravo),
  záložky jako výřezy kartotéky, linkovaný spodek a dírka dole. Záhlaví v barvě rodiny zmizelo i u teček; barva rodiny
  zůstala na tlačítku Poslechni si to, rámečku odznaku a posledním štítku rodokmenu. Blok „kartotéční lístek“ na konci
  `styles.css`. **Karta vymyšleného jazyka a Brána si nechávají hologram a hvězdné sklo.** Uklizená karta na telefonu
  (`.mala`) má tlačítka vpravo a polohu schovanou.
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
  **Jazyk dne má vždy důvod** („Proč dnes?“, přání uživatele 25. 9. 2026). Význačné dny jsou v `data/dny-jazyku.json`
  (MM-DD → jazyk a důvod cs/en: dny jazyků OSN a UNESCO, národní dny jazyka, státní svátky, výročí; validace
  hlídá tvar, jazyk a oba texty; 60 dní – 23. 4. je v OSN den angličtiny i španělštiny, karta ukáže angličtinu a zmíní obě,
  romština má 8. 4. Mezinárodní den Romů i 5. 11. Mezinárodní den romského jazyka). **Každý důvod musí být pravdivý** – nový den ověřit. Ostatní dny Jazyk dne
  **cestuje kolem světa** (`CESTA`: od češtiny vždy k nejbližšímu dosud nenavštívenému jazyku, index = místní den
  mod 163) a karta řekne, u kterého jazyka jsme byli včera a o kolik km a kterým směrem jsme dál. Den po 26. 9.
  (Evropský den jazyků, bez Jazyka dne) má vlastní větu. Skrytý jazyk (filtr) se přeskočí.
  Klíč může být i pohyblivý (`09-so2` = druhá sobota v září: Den německého jazyka) a den může patřit tečce rejstříku
  bez karty atlasu (`kod` = glottocode, `pozdrav`, `jazyk`, `vyslovnost`): esperanto 26. 7., latina 30. 9. (Den překladu).
  **Kalendář jazykových dnů** (přání uživatele 25. 9. 2026: „naklikávací seznam s linkem na jazyk“): okno `#kalendar`
  jen z patičky seznamu (uživatel 25. 9. 2026: odkaz pod Jazykem dne pryč, „stačí v servisním menu“; odkaz
  `#kalendar` / `#language-days`), po měsících, dnešek
  zvýrazněný, otevře se u nejbližšího dne; klik vybere jazyk (26. 9. rozsvítí evropské jazyky). Statická stránka
  `/kalendar-jazyku/` a `/en/language-days/` odkazuje na stránky jazyků.
- **Živější glóbus**: v noci světélka jemně třpytí (překresluje se jen WebGL, co 60 ms, usíná s okrasným
  pohybem), koule má odlesk slunce (ve dne výraznější).
- **Tablet a menší notebook (921–1400 px): karta místo seznamu** (29. 9. 2026, uživatel ze snímků z tabletu: „pro glóbus
  zůstane jenom kousek uprostřed“; vybral variantu A z náhledu): s otevřenou kartou dostane `#obsah` třídu `karta-vpravo`
  (`tabletKarta`, `kartaVpravo()`, MutationObserver na `hidden` karty), seznam se schová, plocha glóbu se roztáhne a karta
  sedí vpravo na místě seznamu (380 px). Glóbus se vycentruje do levé části (`spoctiPosun` záporný posun), medailony
  (`posunDok`), vějíř Rodokmenu (`posunKarty` záporný, `zaklad()` s `Math.abs`) i kruhový přehled (`geometrie`) počítají
  s kartou vpravo; nápověda, zoom, počítadlo, panely EU a cesty, hlavička Rodokmenu a panel přehledu se odsunou vlevo
  od karty. Křížek kartu zavře a seznam se vrátí. Nad 1400 px zůstává karta vlevo přes glóbus, pod 921 px spodní list.
- **Mobil (≤ 920 px)**: karta je spodní list ve třech velikostech: malá lišta jen s pozdravem a jménem (`.mala`),
  běžná (50 vh) a celá (`.plna`). Uživatel si stěžoval, že zakrývá půl obrazovky a nejde uklidit, proto: tažení
  za úchyt nebo barevné záhlaví (dotykové události, `touch-action:none` na záhlaví – ukazatelové události iOS při
  posunu stránky rušil) posouvá list za prstem; nahoru = větší, dolů = menší, z lišty dolů = zavřít. Klepnutí
  na úchyt přepíná lištu a běžnou velikost. Tažení glóbu nebo stromu a otevření rodokmenu kartu samo uklidí
  do lišty (`uklidKartu`). Lišta je pod glóbem, pod 480 px jen ikony. Po výběru stránka odroluje nahoru ke glóbu.
  **Počítání prstů** (glóbus i rodokmen, mapa `prsty`): první prst nového dotyku (`isPrimary`) paměť vymaže
  a ztracené zachycení (`lostpointercapture`) prst uklidí. Telefon totiž občas zvednutí prstu neohlásí a „duch“
  v paměti pak dělal z jednoho prstu dva – po výběru země nebo jazyka se glóbus jedním prstem jen přibližoval
  a neotáčel (uživatel 24. 9. 2026). Test: v emulaci telefonu podstrčit `pointerdown` bez `pointerup` a táhnout.
  Rodokmen je na telefonu užší a protažený nahoru (elipsa `m.sx`/`m.sy`, `OKRAJ` 0,2 π), jinak byl moc široký.
- **Úvod**: glóbus přiletí z vesmíru (2,2 s). Jedna tečka (česky čeština, anglicky angličtina) pak tiše pulzuje
  dvěma tenkými kroužky, dokud si člověk poprvé nevybere jazyk (`atlas-uvitano`). Při `prefers-reduced-motion`
  ani s odkazem `#…` přílet neběží.
- **Nápověda je jen za otazníkem** vpravo nahoře na glóbu (`#tl-napoveda`, po najetí myší štítek „NÁPOVĚDA“).
  Klik otevře tři kroky Zatoč – Přibliž – Klikni (`#napoveda`); hotový krok se sám odškrtne (tažení, kolečko /
  dva prsty / tlačítka zoomu, klik na tečku nebo zemi, výběr jazyka), po všech třech nápověda zmizí; zavírá ji
  i křížek, Escape a druhý klik na otazník. Uživatel (24. 9. 2026): trvalý text „Chytni glóbus…“ a žlutá bublina
  „Klikni na mě!“ po chvíli překážely a web působil nedodělaně, **sám se nápověda neotevírá a žádná trvalá
  instrukce na glóbus nepatří**. Stejně zmizely **navždy** rámeček legendy vpravo nahoře („Každé světélko je
  jeden ze 7 967 jazyků světa“) a podtitul pod „Atlas jazyků“ v záhlaví – byly zdvojené a zbytečné. Nevracet.
- **Rodokmen** (medailon pod glóbem, dřív tlačítko v liště, 24. 9. 2026): místo glóbu se na plátně `#strom` ukáže strom jedné rodiny
  z Glottologu (`PD.nad`, `PD.uzly`) jako **plochý vějíř**: kořen (společný předek) dole uprostřed, větve se
  rozbíhají nahoru do půlkruhu, vzdálenost od kořene = hloubka ve stromu, úhel = pořadí listů. Hrany jsou lomené
  (oblouk rodiče + paprsek), tloušťka větve roste s počtem jazyků pod ní. Jazyk je o krok za svou větví.
  **Nic se neotáčí a není to 3D** – první verze byla 3D „kornout“ s otáčením podle videa rodokmenu, uživatel ji
  zamítl („otáčení nedává smysl“): ve 3D se větve schovávaly za sebe a třetí rozměr nic nenesl. Nevracet.
  Nestahovat ani všechny jazyky na obvod: stovky dlouhých paprsků splynuly v plochu.
  Kroužek jen u rozvětvení, průchozí uzly se nekreslí. Jazyky s pozdravem jsou velké tečky v barvě rodiny.
  Vybraný jazyk má zvýrazněnou cestu ke kořeni, ostatní větve ztmavnou; najetá větev zezlátne celá.
  Tažení posouvá, kolečko a dva prsty přibližují k místu pod kurzorem, klik na větev na ni zaostří, klik na jazyk
  ho vybere (karta, glóbus), dvojklik / „Celý strom“ vrátí celek. Strom při otevření vyroste od kořene (1,3 s,
  `prefers-reduced-motion` vypne); v klidu se nepřekresluje. Měřítko se řídí skutečnou velikostí stromu (`m.sirka`,
  `m.vyska`) a volnou plochou vedle karty. Glóbus se mezitím nepřekresluje.
  Výběr rodiny nabízí rodiny s aspoň třemi jazyky; izolované jazyky strom nemají. Na kartě je v záložce
  Příbuzní tlačítko „Ukázat v rodokmenu“ (`tlacitkoRodokmenu`). Filtry (znakové, vitalita) platí i ve stromu.
  Názvy větví jsou z Glottologu anglicky; české překlady hlavních větví jsou v `data/glottolog-branches.cs.json`
  (validace hlídá, že větev v Glottologu existuje). Popisky větví se ukazují ve stejném počtu česky i anglicky; kde
  překlad chybí, je v české verzi anglický název z Glottologu (dřív se nepřeložené schovávaly a česká verze byla chudší).
  Přeloženy jsou hlavní větve všech velkých rodin a skoro všechny viditelné větve indoevropské rodiny.
- **Srovnání dvou jazyků** (nápad uživatele 24. 9. 2026, „třeba češtinu a arabštinu“): na kartě tlačítko
  „Porovnat s jiným jazykem“, pak se druhý jazyk vybere čímkoli (tečka na glóbu, dlaždice, hledání, Překvap mě,
  list v rodokmenu) – `vyber`/`vyberBod` ho při `cekaNaDruhy` jen předají do `dokonciSrovnani`. Stav `srovnani`
  stojí vedle `vybrany` (první jazyk zůstává vybraný), takže se nemusely měnit všechny výběrové cesty.
  Glóbus: jen poloha obou jazyků (zaměřovač u prvního, kroužek u druhého), **žádná čára ani vzdálenost mezi nimi** – uživatel obojí výslovně nechce, „jen pozici na mapě“. Karta: dvě pole s pozdravy, záložky Příbuznost
  (nejbližší společný předek ze stromu Glottologu a cesta od něj k oběma; různé rodiny = „Nejsou příbuzné“ s
  větou „podle toho, co dnes jazykovědci vědí“, izolované jazyky zvlášť), Jak funguje (jen vlastnosti WALS,
  které mají zapsané oba; texty „stejně jako čeština“ se tu vypouštějí – `bezOdkazuNaCtenare`), Čísla
  (mluvčí, vitalita, společné státy). Rodokmen ukáže obě cesty a přiblíží společného předka.
  Druhý jazyk má fialovou, když je ze stejné barevné skupiny jako první. Odkaz `#cs~ar`. Nic se nedomýšlí:
  výpůjčky slov ani podobnost slovní zásoby v datech nemáme, proto je srovnání neukazuje.
- **Typologické mapy (WALS)** (25. 9. 2026, první funkce nového „vážného“ směru): okno **Mapy**
  nabídne 24 vlastností v pěti oblastech (fonologie, morfologie, slovosled, větná stavba, slovní zásoba). Výběr, odborné
  texty cs/en (název, popis, přesné hodnoty WALS a skupiny pro barvy) jsou ručně v `data/typologie-popis.json`; hodnoty
  pro každou tečku vyrábí `node scripts/typologie.mjs` → `data/typologie.json` (znak na tečku, 0 = bez údaje; nářečí
  z WALS se připojí k jazyku). Build je vkládá jako `TYP`, validace hlídá, že skupiny pokrývají každou hodnotu a že
  barevných skupin je nejvýš 5 (nominální, `kat`) / 7 (seřazené, `rada`). **Příklady v popisech musí odpovídat datům
  WALS** – při psaní se ukázalo, že WALS vede češtinu u otázek jako „slovosled“, baskičtinu a gruzínštinu jako
  aktivní–inaktivní a francouzštinu u záporu jako částici; ověřovat v `.cache/wals-values.csv`.
  Tečky se barví stejnou cestou jako vitalita (`barvit()`, `barvyVrstvy()`, `hodnotaVrstvy()`, buffer `glJaz.typ`);
  jedna barevná vrstva naráz, otevřené stupně vitality mají přednost (`typZobrazena`). Paleta `--typ-1…5`, `--typ-jine`
  (barva inkoustu), `--typ-nic`, stupnice `--typ-r0…r6` na konci `styles.css` – ověřená pro všechny dvojice (mapa!),
  pořadí neměnit. Legenda vpravo dole (na telefonu pod medailony) s popisky, počty, popisem a odkazem na kapitolu WALS;
  klepnutí na hodnotu ji zvýrazní (`typIzolace`). Výběr vlastnosti okno zavře, aby nezakrývalo mapu (uživatel 26. 9. 2026); jinou mapu otevře tlačítko „Jiná mapa…“ v legendě. Tečky bez údaje jsou jen slabě vidět (průhlednost 0,3). Volba se pamatuje (`atlas-typologie`). Karta tečky i jazyka z atlasu
  má záložku **Stavba** (`oddilTypologie`) s přesnými hodnotami; název vlastnosti ji ukáže na mapě. Srovnání dvou jazyků
  bere stavbu také z `TYP`. Dřívější dětské texty WALS (`T.wals`, „Pes kost hryže“) jsou pryč; `r[5]` v podrobnostech
  se už nepoužívá.
- **Evropský den jazyků** (26. září, Rada Evropy od roku 2001): ten den **místo Jazyka dne** karta „Evropské jazyky“
  (přání uživatele 25. 9. 2026: „ukázat je najednou s odůvodněním proč“) – odstavec „Proč dnes?“ (Rada Evropy 2001,
  přes 200 jazyků v Evropě, povzbudit k učení), tlačítka „Ukaž je všechny na glóbu“ (`spustEU("evropa")`: stejné
  hvězdičky jako u „eulang“, ale **bez vlajky EU a v červené** – Den jazyků je Rady Evropy, ne EU) a „24 jazyků
  Evropské unie“, pod tím mřížka všech evropských jazyků atlasu s pozdravem (`EVROPSKE`, 52 včetně českého
  znakového jazyka, fríštiny, okcitánštiny, sardštiny, romštiny, jidiš, čečenštiny a osetštiny). Křížek kartu
  schová do dalšího roku (`atlas-den-jazyku-RRRR`) a vrátí Jazyk dne. Vyzkoušet jde kdykoli adresou s `?den-jazyku`.
- **Velikonoční vajíčko „eulang“** (přání uživatele 24. 9. 2026): napsání „eulang“ kdekoli na stránce (mimo
  políčka) nebo do hledání (kvůli telefonu), případně odkaz `#eulang`, přeletí glóbus nad Evropu, u všech
  24 úředních jazyků EU (`EU_JAZYKY`) vyskočí jedna po druhé zlaté hvězdičky se jménem (ostatní jména zmizí,
  tečky jazyků EU svítí příznakem 5) a vpravo nahoře se objeví panel s vlající vlajkou EU, jejíž hvězdy
  naskočí postupně, a se seznamem jazyků. Chorvatština v Glottologu tečku nemá (je pod srbochorvatštinou), její hvězdička
  stojí na `stred` z atlasu a klik na ni funguje přes `EU` (ne přes tečku). Zavírá se křížkem, Escape
  a tlačítkem Celý svět. Barvy vlajky `#003399` a `#FFCC00` jsou oficiální a patří jen sem.
  **Od 5. 10. 2026 není jen tajemstvím** (uživatel: „nejenom eulang easter egg, někam dej malinké logo EU“): pod zoomem vpravo
  nahoře na glóbu je malé kolečko s logem EU (`#tl-eu` v `.roh-ovladani`, na telefonu pod otazníkem), klik panel otevře / zavře.
  **Hledání zná EU** (`dotazEU` v app.js; dřív AI odpovídala „atlas nemá údaje o úředních jazycích EU“ a ptala se zpět):
  „jazyky EU“, „oficiální / úřední jazyky EU“, „EU languages“, „lingue dell'UE“, „EU-Sprachen“ → karta 24 úředních jazyků
  a Enter otevře panel; se slovem členské státy / země / member / Stati / Mitgliedstaaten → **jazyky členských států**
  (`bodyEU`: každá tečka, kterou Glottolog uvádí aspoň v jednom z 27 států `EU_STATY`, 243 jazyků) a rozsvítí je.
  AI má nástroj **`jazyky_eu`** (`druh`: `uredni` / `clenske_staty`). Systémový pokyn AI nově: **neptat se zpět** (každá otázka
  je nová konverzace, uživatel nemůže odpovědět – AI dřív končila „Co z toho chcete?“), česky bez rodových tvarů („musel(a)“),
  odpovídat i italsky a německy.
- **Brána do jiných světů – vymyšlené jazyky** (nápad uživatele 24. 9. 2026): klingonština, quenijština,
  sindarština, na'vijština, dothračtina a vznešená valyrijština v `data/vymyslene.json` (světy Qo'noS, Středozem,
  Pandora, Essos; validace hlídá strukturu). **Nejsou na glóbu, v běžném seznamu, v Jazyku dne ani v Překvap mě.**
  Otevře je heslo **„mellon“** (elfsky „přítel“, heslo Durinových dveří) napsané kdekoli nebo do hledání, odkaz
  `#mellon` / `#mellon~klingon`, nebo hledání („elf“, „klingon“, „Avatar“, „Hra o trůny“…), které ukáže sekci
  „✦ Z jiných světů“. Glóbus se zmenší a zmizí (CSS přechod pláten, pak se nekreslí), ve hvězdách se vznášejí
  koule světů (vznáší se jen koule, tlačítka stojí – jinak se po nich špatně kliká); na telefonu mřížka.
  Na koulích jsou vlastní SVG kresby (`OBRAZKY_SVETU`: zkřížené čepele, elfský list s horami a věží, svítící
  rostliny, drak nad pouští). **Žádné postavy (Klingon, Na'vi…), znaky ani loga z filmů** – jsou chráněné
  autorským právem a vadily by i v App Storu; uživatel variantu s obecnými motivy schválil.
  Karta vymyšleného jazyka má hologramové záhlaví, štítek „Vymyšlený jazyk“, dílo, svět a autora; `vybrany`
  zůstává null (žádná tečka, rodina, vitalita ani srovnání). Stopy k Bráně jsou na kartách finštiny a velštiny
  (`stopy`). Zajímavosti musí být pravdivé jako u skutečných jazyků.
- **Tajemství v návodu** (29. 9. 2026, přání uživatele): úplně na konci návodu (okno `#navod` i statická `/navod/`, `/en/guide/`)
  je malé malované vajíčko (`<details class="navod-tajemstvi">`, `VEJCE_SVG` v app.js i stranky.mjs); klepnutím se návod dole rozšíří
  o popis všech tajemství (texty `navod.tajemstvi` v `src/ui/*.json`: eulang, mellon, babel, kytovci, převrácený glóbus). Běžný text
  návodu je dál neprozrazuje. Nové tajemství doplnit i sem.
- **Tři drobná tajemství** (28. 9. 2026, nápady uživatele; v běžném textu návodu neprozrazovat, jako hesla „eulang“ a „mellon“ – popis je jen pod vajíčkem):
  **tři rychlá klepnutí na oceán** (stejné místo, do 1,2 s; `klikNaOcean` v `klikDoMapy`) nebo `#velryby` / `#whales` otevřou
  kartu **„Mluví kytovci?“** (29. 9. 2026 rozšířeno z „Mluví velryby?“ o záložku **Delfíni** (4 záložky: Velryby, Delfíni, Je to jazyk?, Zdroje; šest se na kartu nevešlo) – podpisová hvízdnutí
  jako jména, Hermanovy pokusy s umělým jazykem, DolphinGemma – a kosatky – nářečí rodin, mlčení Biggových kosatek,
  napodobování; odkaz `#kytovci` / `#cetaceans`, staré `#velryby` / `#whales` platí dál; plurál „vorvani“, ne „vorvaně“; při ověření opraveno: delfín kapverdský
  (ne „kropenatý“), napodobení cizího hvízdnutí je vzácné (King a kol. 2013), na cizí hvízdnutí neodpovídají; DolphinGemma od Googlu,
  bez publikovaných výsledků; Biggovy kosatky loví mořské savce; Musser: víc hvízdnutí a cvakání, ne převzatá hvízdnutí; kody
  a volání prozrazují skupinu (Hersh 2022), nejisté je jen „význam jako slova“; nadpis „Není prokázáno“;
  kody vorvaňů, klan EC1 a koda 1+1+3, Sharma a kol. 2024; zpěv keporkaků, Payne a McVay 1971,
  Garland 2011, Arnon 2025, Voyager; proč to zatím není jazyk a proč velryby nemají tečku) s akvarelem `ocean` (ocasní ploutev,
  výtrysk) a tlačítkem „Přehrát rytmus kody“ (cvaknutí z WebAudio, výslovně schéma, ne nahrávka – nahrávky nemáme ověřené).
  **Sedm rychlých kliknutí na logo** (`prevrat`): vrstvy `#podklad`, `#gl`, `#popisky` se otočí o 180° kolem středu koule
  (plocha se stínem se mezitím nekreslí, `bezPlochy`), tečky se schovají a jejich kopie na plátně `canvas.padani` spadnou
  do kopečku pod koulí, pak tečky
  vyletí zpět a glóbus se otočí zpátky. **Bez nápisu** – vtip „Jazyky nepadají z nebe…“ uživatel 29. 9. 2026 zrušil
  („nedává smysl“), nevracet. Oceán se při převrácení nijak zvlášť nechová (uživatel: „nech to jak to je“).
  **„babel“** napsané kdekoli, do hledání nebo `#babel` (`spustBabel`, `zmatJazyky`): slova na obrazovce se na 3,4 s
  rozsypou do cizích písem (každé slovo jiné: azbuka, řečtina, hebrejština, gruzínština, arménština, dévanágarí, arabské
  písmo, thajské, katakana, hangul) a pak se otevře karta **„Babylónská věž“** (Genesis 11, hříčka Bável/bālal, Bāb-ili,
  Etemenanki, Esagilská tabulka, počet rodin a izolátů z dat, meze srovnávací metody) s akvarelem Mezopotámie.
  Obě karty používají stejnou kartu jako jazyky (`ukazZvlastni`, stav `zvlastni`, texty `T.tajemstvi` v `src/ui/*.json`),
  malby tajemství mají id `z-…` a kreslí se hned (hotové obrázky nemají). Při `prefers-reduced-motion` se nepřevrací ani
  nerozsypává: převrácení se vůbec nespustí, u „babel“ se jen ukáže karta. Texty prošly nezávislým ověřením (opraveno: metoda Arnon a kol. je jen
  inspirovaná učením dětí, dokončení Etemenanki jen „podle vlastních nápisů“ Nebukadnesara, Esagilská tabulka je opis
  z Uruku 229 př. n. l., rubato = délka po sobě jdoucích kod, učení mláďat „nejspíš“, Šineár, citace se stranami).
- Pořád platí: žádný satelit, prstenec, rohy zaměřovače ani sbírka pozdravů.
- **Kruhový přehled všech rodin** (27. 9. 2026, uživatel: výseče „vyklikávat jako v DaisyDisk“, „přijatelnější design
  odpovídající současnému“; klikací náhled schválil „je to OK, spusť to“). **Jen volitelný doplněk**: jako výchozí pohled Rodokmenu ho uživatel
  hned zamítl („tohle je blbě … kruh je spíše doplněk, vrať se k tomu stromu“), Rodokmen proto vždy začíná vějířem jako dřív
  a kruh se otevírá tlačítkem **„Kruhový přehled rodin“** (`#strom-vse`) v hlavičce Rodokmenu; v kruhu se z něj stane
  „Zpět na rodokmen“. Nedělat z kruhu znovu výchozí pohled. Plátno `#prehled` a panel `#prehled-panel` uvnitř modulu `strom`
  (`postavPrehled`, `kresliP`, `zamerP`, `panel`, `prehledZap`). Šířka výseče = počet jazyků (filtry platí), 5 prstenců,
  klepnutí na výseč z ní udělá nový střed (plynulý přechod 520 ms, `prefers-reduced-motion` bez něj), střed = o úroveň výš,
  najetí myší ukáže název a počet ve středu. Střed je medailon (`--med-*`). **Vzhled „akvarel“** (uživatel 27. 9. 2026 vybral
  B ze tří návrhů – Kartotéka, Akvarel, Stará mapa; syté `--r-*` „nějak neladí ke zbytku webu“): vlastní tlumená zemitá paleta
  `BP.z` v `nactiBarvyP` (den `#3D6CC0 #C8553D #16968A #C98A1A #1F7448 #9055B0`, noc `#5B82C8 #CF6450 #239A8C #B8892A #2A7F4E #9B6CC4`,
  pořadí jako `--r-*`, obě prošly validátorem palet; neměnit bez nového ověření), trochu sépie, k okraji kruhu vybledá;
  výseč se k vnějšímu okraji sytí (radiální přechod) a má tmavší okraj jako zaschlá barva – jen výseče širší než 6 px, kvůli výkonu.
  Názvy prvního prstence Playfair Display. Tečky a proužky v seznamu a legenda mají plnou barvu z `BP.z` (`barvaBodu`).
  Se zapnutými barvami vitality mají jazyky barvu stupně. Rodiny pod 25 jazyků jsou pod „Menší
  rodiny“, izolované, znakové a umělé jazyky a pidžiny pod „Mimo rodiny“; průchozí větve se přeskakují. Panel vpravo
  (na telefonu pod kruhem, nejvýš 52 vh): cesta, název, počty, „Otevřít rodokmen rodiny“ (vějíř), seznam dětí s poměrným
  proužkem a jazyky atlasu kurzívou (obdoba tištěného seznamu z 24. 9.), legenda barev. Klepnutí na jazyk ho vybere (karta), kruh zůstává. Zoom + a − se v Rodokmenu schovávají.
- **Dřívější náhledy přehledu rodin** (24. 9. 2026). Kruhová „myšlenková mapa“ (rodiny v bublinách
  kolem středu, svítící tečky, tučné popisky, kroucené čáry) uživatel zamítl: „strašně ošklivé, čiší z toho AI“.
  Nenavrhovat znovu. Dva další náhledy uživatel viděl a nechal zatím ležet: **stará tištěná mapa** (rodokmen jako
  v knižním atlasu: EB Garamond, tenké lomené čáry, rodiny ručně podbarvené, větve s počty a jazyky atlasu kurzívou,
  menší rodiny ve sloupcích, poznámky pod čarou) a **výseče** (sunburst: šířka výseče = počet jazyků, vnitřní prstenec
  rodiny, vnější větve, indoevropská nahoře, jazyky atlasu paprskovitě kolem; na telefonu kruh + seznam rodin).
  Větve pro přehled: rozbalovat uzel, který nese přes 80 % rodiny (jinak je u indoevropské jediná větev
  „Classical Indo-European“). Náhledy kresli **písmy atlasu** (stáhnout z Google Fonts a vložit přes `@font-face`);
  první náhled se omylem vykreslil náhradním systémovým písmem a vypadal lacině.

## Web: skript zvlášť, přístupnost, vyhledávače (podle dvou hodnocení webu, 24. 9. 2026)

- **Na webu je skript v samostatném souboru** `dist/js/atlas.<otisk>.js` (knihovny + aplikace + data, ~2,4 MB),
  sdílený českou i anglickou stránkou; jazyk si přečte z `<html lang>`. Otisk v názvu se mění s obsahem, proto
  `dist/_headers` dovoluje prohlížeči držet ho v mezipaměti natrvalo. Stránky samy mají ~107 kB. Build starý
  `dist/js/` maže. **Artefakt zůstává jeden soubor** se vším vloženým (`--artefakt`).
- Build vyrábí i `robots.txt`, `sitemap.xml` (obě verze s hreflang) a dvojjazyčnou `404.html` (texty `nenalezena…`).
  `theme-color` je zvlášť pro světlý a tmavý vzhled.
- **Počet mluvčích na kartě jazyka z atlasu** má u čísla šedé „odhad“ a v záložce Zajímavost oddíl s vysvětlením (zaokrouhlený
  odhad atlasu včetně nerodilých mluvčích) a údajem z Wikidat s rokem, pokud je (`oddilMluvciAtlas`; hodnocení webu 28. 9. 2026:
  zdroj přímo u čísla). Statické stránky jazyků mají „(odhad)“. Počítadlo dole na glóbu je „v záběru N z 7 967 jazyků“
  (dřív „na glóbu“, hodnotitelé to četli jako nesoulad dat). Nápověda u kroku Výběr zmiňuje i klepnutí na zemi.
- **Počty**: glóbus má 7 967 teček (jazyky Glottologu), seznam 7 970 položek. Srbštinu a chorvatštinu vede Glottolog
  jako jeden jazyk (srbochorvatština má tečku) a hmongštinu jako několik, atlas je má zvlášť – tečku nemají.
  Vysvětluje to jen stránka O datech (oddíl Jazyk, nebo nářečí). Věta v patičce seznamu byla 25. 9. 2026 na přání
  uživatele odstraněna („co je to za blbost“ – zněla, jako by atlas srbštinu a chorvatštinu slučoval). Téma je citlivé:
  psát neutrálně – lingvisticky blízké spisovné varianty na štokavském základě, úředně a společensky samostatné jazyky. Lotyštinu a norštinu vede Glottolog jen jako nářečí (`lvs`, `nob`) svého
  jazyka; `scripts/glottolog.mjs` proto jazyk atlasu připojí k nadřazené tečce, když na ni nečeká jiný jazyk atlasu.
- Přepínač English/Česky nese v odkazu i otevřený jazyk (`/en/#cs~sk`, `obnovOdkazJinam`).
- Přístupnost: odkaz „Přeskočit na seznam jazyků“ (jen přesune fokus, adresu nemění), `<main>`, patička
  `<footer class="paticka">` (`display:contents`), řádky v panelu Zobrazení mají jméno z `<b>` a popis ze `<small>`
  (`aria-labelledby` / `aria-describedby`, dřív se slepovaly v „OtáčetZeměkoule…“), odznaky filtrů jsou pro čtečky
  schované a počet je v `aria-label` tlačítka. Hledání má vlastní křížek `#hledej-x`.
- Kontrast: `--text3` ve dne `#676D7E` (4,9 : 1 na papíře), v noci `#8494BA` (5,2 : 1). Drobné písmo nejméně ~11 px,
  čtené poznámky (počet, zdroje, popisy voleb) 12,5 px. Na dotykových displejích mají zoom a křížky 40 px.
- Souřadnice česky „48,0° s. š. · 2,0° v. d.“ (na kartě malými písmeny, `.kod.sour`).
- V nočním vzhledu je malba ztlumená (`brightness(.8)`).
- Francie (`vinice`) má zámek na Loiře (`zamek`: kulaté věže s kuželovými břidlicovými střechami, vikýře) a vlašské
  topoly (`topol`); cypřiše patří Toskánsku a Provenci.

## Stránky jazyků, O datech, klávesnice (24. 9. 2026)

- **Samostatné stránky jazyků** (uživatel schválil): `scripts/stranky.mjs`, volá ho build, jen pro web.
  `/jazyk/<jméno>/` česky (např. `/jazyk/baskictina/`) a `/en/language/<name>/`, přehled `/jazyky/` a
  `/en/languages/`, O datech `/o-datech/` a `/en/about-data/`. Stránka je lehká (bez skriptu glóbu): malba,
  pozdrav, výslovnost, vlastní jméno, mluvčí, rodina, vitalita, státy, zajímavost, příbuzní v atlasu
  (nejhlubší společný předek jako oblouky; srbština, chorvatština a hmongština přes náhradní tečku) a tlačítko
  „Najít na glóbu“ na `/#<id>`. **Poslechni si to** je i tady (uživatel 25. 9. 2026: „musím proklikem až do glóbu,
  to je blbost“): na stránce jazyka velké tlačítko, v přehledu `/jazyky/` malý reproduktor v každé dlaždici; stejná
  logika jako v app.js (rodilý hlas zařízení, jinak výslovnost hlasem stránky, jinak text), hláška pod tlačítkem nebo
  jako bublina. Bez kódu jazyka se tlačítko neukazuje.
  **Znakové jazyky stránku ani dlaždici v přehledu nemají** (uživatel 25. 9. 2026: „poslechnout si nejde, vyhoď to“), přehled
  má proto 162 jazyků; na glóbu, v aplikaci a v kalendáři (23. 9., odkaz na `/#czj`) zůstávají.
  **Stránka jazyka je kartotéční lístek nad seznamem** (uživatel 25. 9. 2026: „z té obrazovky se nedá odejít jinak
  než do glóbu“): každá `/jazyk/<jméno>/` obsahuje celý seznam a nad ním lístek (`.listek`, krémový, červená linka,
  linkovaný spodek, dírka). Šipky předchozí/další (abecedně, dokola, i klávesy ←/→), „n / 162“ a křížek. Z přehledu
  se lístek načte bez přechodu stránky (`fetch`, `pushState`); křížek, Escape i klik vedle vrátí seznam (`history.back()`),
  šipky adresu jen nahradí. Přímo otevřená stránka jazyka zavře lístek na `/jazyky/`. Na telefonu je lístek přes celou
  obrazovku. Patička statických stránek je sbalená (`<details>`, stejný souhrn jako v aplikaci). Vlastní titulek, popis, canonical, hreflang a og:image = malba jazyka.
  Adresa je z názvu bez diakritiky; build spadne, když by dva jazyky měly stejnou. Všechny jsou v `sitemap.xml`.
  Na hlavní stránce vede v patičce seznamu odkaz „Jazyky s pozdravem“ (jen web; v artefaktu a z disku skrytý).
- **Malby jako obrázky**: `static/malby/<id>.jpg` (800 × 500, ~36 kB) vyrábí `scripts/malby.mjs` (Playwright,
  z `dist/index.html`). **Po změně krajiny v akvarely.js nebo krajiny.json je vyrob znovu** (lze jen pro dané id:
  `node scripts/malby.mjs cs fr`), jinak stránka jazyka ukáže starou malbu. Aplikace malby dál kreslí živě.
- **O datech**: okno `<dialog id="o-datech">` z odkazu v patičce seznamu (i v artefaktu), odkaz `#o-datech`
  / `#about-data`; texty `oDatech` v `src/ui/*.json` (oddíly, verze dat, licence), data stažení dosadí build
  (`VERZE`). Stejný text je na statické stránce. Údaje v něm musí odpovídat `data/ZDROJE.md`.
- **Podrobný návod** (přání uživatele 25. 9. 2026): okno `#navod` (texty `navod` v `src/ui/*.json`: glóbus, karta,
  seznam, medailony, srovnání, klávesnice, další; tajemství jen naznačit, hesla neprozrazovat), odkaz v patičce „O atlasu…“
  a jako **čtvrtý řádek nápovědy pod otazníkem** – není to krok: nápověda zmizí po třech krocích jako dřív
  (`li[data-krok]`). Návod má oddíl **Putování jazyků** (29. 9. 2026: věta o putování češtiny se předtím omylem vlepila do nadpisu oddílu Klávesnice – po úpravě návodu zkontrolovat nadpisy) a oddíl o sbalené patičce (kalendář, O datech, Jazyky s pozdravem, kontakt, zdroje) – při změně patičky ho upravit. Odkaz `#navod` / `#guide`, statická stránka `/navod/` a `/en/guide/`. Při změně ovládání návod upravit.
- **Chytré hledání – otázky běžnou větou** (1. 10. 2026; uživatel chtěl „dialogovou řádku pro AI“, zvolil „postupně“: nejdřív
  bez AI, AI později jako nadstavba přes serverovou funkci Netlify a klíč Claude API – klíč zatím není): `rozumejDotazu` v app.js
  pozná srovnání dvou jazyků atlasu („co má společného němčina s italštinou“, „rozdíl mezi češtinou a slovenštinou“), jeden jazyk
  s „kde/where“ („kde se mluví persky“ – i česká příslovce italsky, německy), stát (s předložkou v/ve/na/in/of má přednost, bez ní
  jen když nesedí rodina) a rodinu či větev Glottologu (`PD.uzly`, české názvy z `PD.vetve` a rodin; alias „ugrofinské“ → uralská
  s vysvětlením). Slova se porovnávají podle kmene bez **jedné** koncové samohlásky (víc dělalo z Romance Rumunsko a z turkických
  Turecko); obecná slova (jazyky, languages, rodina…) se v názvech nepočítají („jazyky že“ sedělo na každý dotaz). Odpověď je
  karta nahoře v polici (`kartaDotazu`: čemu rozumělo, počet jazyků, tlačítko, Enter v poli) a police ukáže místo textového
  hledání příslušné jazyky (`bodyDotazu`). Akce: `ukazZemi` (jako klepnutí na zemi), `ukazSkupinu` (stav `dotazSkupina`, tečky
  příznak 5, let nad střed), srovnání, výběr jazyka – **tytéž akce mají později dostat AI jako nástroje**. Zkušební sada 29 dotazů
  cs/en je v testu `dotaz-test.mjs` (scratchpad) – při změně pravidel ji projít znovu. Návod (oddíl Seznam) to popisuje.
- **Otázky na AI – krok 2** (1. 10. 2026, **od téhož dne pro všechny**, model **Claude Sonnet 5.5** – uživatel vybral po porovnání `#ai-test`; `#ai-vyp` vypne jen pro sebe; návod (Seznam) a O datech (Otázky na AI: otázka jde přes Netlify k Anthropicu, atlas ji neukládá) to popisují): když chytré hledání otázce nerozumí (aspoň 3 slova), karta nabídne
  „Zeptat se AI“ (`kartaAI`, Enter). Prohlížeč posílá konverzaci serverové funkci **`netlify/functions/zeptej.mjs`** (cesta
  `/api/zeptej`, závislost `@anthropic-ai/sdk` v package.json – jediná npm závislost projektu, jen pro funkci; edge funkce
  `domeny.js` pouští `/api/*` na obou doménách). Klíč `ANTHROPIC_API_KEY` je **jen v Netlify** (Environment variables, Secret,
  scope Functions, Production + Deploy Previews; uložen 1. 10. 2026); do stránky ani gitu nepatří. Funkce drží pevný systémový
  pokyn (jen otázky o jazycích, odpovídat z nástrojů, 2–4 věty, jazyk otázky, vykání), čtyři nástroje se `strict` a limity: jedna
  otázka ≤ 300 znaků, dál jen výsledky nástrojů, nejvýš 4 kola, tělo ≤ 60 kB, 20 nových otázek / 10 min na adresu (v instanci; s parametrem `model` z `#ai-test` 80 – první verze počítala
  každé volání a porovnání skončilo „chyba: limit“). Na `limit-api` (429 od Anthropicu) stránka dvakrát počká a zkusí znovu.
  Nástroje (`naradiAI` v app.js) běží v prohlížeči nad daty atlasu: `jazyky_statu`, `jazyky_skupiny`, `info_o_jazyku`,
  `srovnej_jazyky` a od 1. 10. 2026 i žebříčky (uživatel: „funguje jak prase“ – AI na „kde je 5 a víc jazyků“ a „který jazyk má
  nejvíc nářečí“ jen krčila rameny): `zebricek_statu` (min/max jazyků, rodina, řazení) a `vyber_jazyky` (stát, rodina, vitalita,
  řazení podle nářečí / mluvčích / států; všechny vybrané rozsvítí na glóbu). `zebricek_statu` podbarví vypsané státy (`ukazStaty`, `dotazSkupina.staty`, kreslí `kresliUzemi`) – dřív AI psala „na glóbu jsou zvýrazněné“, ale nic nebylo (uživatel 1. 10. 2026). `vyber_jazyky` rozsvítí všechny vybrané jen do 400, jinak jen vypsané (dřív „nejvíc nářečí“ rozsvítilo všech 7 742, uživatel 2. 10. 2026); skupina do 40 teček (`dotazSkupina`) má výrazné tečky se jmény (příznak 2 a `dulezite`). Pod odpovědí AI se neukazuje „Našlo se: 0 jazyků“. **Každý výsledek nástroje má pole `na_globu`** a pokyn AI smí glóbus zmínit jen tak, jak ho to pole popisuje. Když chytré hledání pochopí jen část otázky
  (`SLOZITA_OTAZKA`: nejvíc, kolik, ohrožené, proč, čísla…), nabídne se pod jeho kartou i AI;
  **s AI se pravidly řeší jen dotaz, kterému rozumí celému** (`celyDotaz`: každé slovo je část nalezeného názvu, nebo výplňové
  z `DOTAZ_VYPLN`), jinak jde AI – pravidla vytrhávala kousky („budu se stěhovat do Bernu… jaký jazyk tam“ → větev Taa ze slova
  „tam“, „Je rumunština slovanský jazyk?“ → větev Slovanská; dřívější hranice 4 slova nestačila); krátké názvy (Taa, Čad) se porovnávají jen celé. Pokyn AI dovoluje u měst a krajů (atlas
  je nemá) přidat obecně známý fakt, ale čísla, data a žebříčky jen z nástrojů;
  **Čekání na AI je vidět** (3. 10. 2026, uživatel: „když přemýšlí AI, věci neznalý ani nepozná“): karta dostane třídu `ceka` – podbarvení
  a záře v barvě akcentu, běžící barevný okraj, točící se hvězdička, stav podle průběhu (`prubeh` v `zeptejSeAI`: `aiKrokCte` → `aiKrokData`
  → `aiKrokOdpoved`), otázka v uvozovkách, probleskující řádky budoucí odpovědi a běžící sekundy (`aiCas`); `prefers-reduced-motion` bez pohybu.
  V poli hledání je krátký text „Hledejte, nebo se zeptejte…“ (dlouhý se ořezával) a pod polem řádek „✦ Zkuste: <otázka>“
  (`#hledej-tip`, `obnovTipHledani`; náhodný z `hledejPriklady`, bez AI krátké dotazy) – klepnutí otázku vloží a položí
  (uživatel 1. 10. 2026: „nikdo nepochopí, že se lze ptát“); po odpovědi se provede akce posledního nástroje (`provedAkciAI`). Obsah odpovědí AI se posílá zpět beze změny
  (i bloky přemýšlení). Model: `ATLAS_AI_MODEL` v Netlify (opus / sonnet / haiku nebo celé id), bez něj `claude-sonnet-5-5`;
  Opus a Sonnet s `effort: low` a záložním modelem při odmítnutí (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`).
  **Vypnutí pro sebe:** `#ai-vyp` (pamatuje se v `atlas-ai`), `#ai` zase zapne. **Porovnání modelů:**
  `#ai-test` položí 16 otázek (`AI_SADA`) Opusu 5.5, Sonnetu 5.5 a Haiku 4.5 a ukáže odpovědi, nástroje, čas a cenu. Uživatel
  vybere model, pak nastavit `ATLAS_AI_MODEL` v Netlify a AI zveřejnit (zrušit skrytí, doplnit návod a O datech: dotazy jdou
  AI). Z prostředí Claude Code se API zkoušet nedá (klíč v nastavení prostředí se načte až v nové relaci; uživatele to mátlo,
  nenutit) – zkouší se na webu. Test bez klíče: napodobenina serveru `mock-server.mjs` ve scratchpadu (pozor: `pkill -f` s jejím
  jménem zabije i vlastní příkaz).
- **Seznam z klávesnice**: do seznamu se vstoupí jedním Tabem (jedna dlaždice má `tabindex=0`), šipky
  vlevo/vpravo o dlaždici, nahoru/dolů o řádek (nejbližší dlaždice), Home/End, PageUp/PageDown o 10 řádků;
  další Tab seznam opustí. Při pohybu ke konci se dokreslí další dávka. Nadpisy skupin jsou `h2`.

## Podrobnosti k tečkám

`scripts/podrobnosti.mjs` spojí k 7 967 tečkám data z Glottologu (ohrožení, popsanost, příbuzenstvo, státy,
nářečí), WALS (stavba jazyka), PHOIBLE (hlásky), UDHR (ukázka textu) a CLDR (české názvy, odhad uživatelů, písmo, úřední status).
Zdroje stahuje do `.cache/` (není v gitu). Pořadí: `node scripts/glottolog.mjs`, pak `node scripts/podrobnosti.mjs`.
Příbuzenstvo je uložené jako strom (uzel zná rodiče), cestu a „nejbližší příbuzné“ dopočítá stránka.
Údaj bez doloženého zdroje nepřidávat.

**Písmo a úřední status** (26. 9. 2026, „odborná data“ pro studenty): sloupce `r[13]` (kódy ISO 15924, nejběžnější
první, např. `Cyrl Latn`) a `r[14]` (stát + stupeň: `RS1 AT3`; 1 úřední, 2 de facto, 3 regionálně) v `radky`,
názvy písem v `pisma.cs/en`, jazyky atlasu bez tečky (srbština, chorvatština, hmongština) v `atlasCldr`. Zdroj CLDR
`languageData` + `likelySubtags` + `territoryInfo`; písma, která CLDR vede jako vedlejší (`-alt-secondary`, např.
hindština latinkou) nebo `scriptMetadata` jako vyřazená (Shawova abeceda), se vynechávají. Makrojazyk CLDR se přes
`aliases.json` přiřadí k tečce jednotlivého jazyka (ar → arb). Jen státy ISO 3166 (bez Kanárských ostrovů, Sarku).
Zobrazuje se na kartě jazyka (Zajímavost / Přehled), ve srovnání (písmo) a na statických stránkách jazyků. Návod
a O datech to popisují; při změně upravit obojí.

**Mapa písem** (26. 9. 2026, podnět z hodnocení webu, uživatel vybral): mapa **Písmo** v okně Mapy obarví
tečky podle hlavního písma: latinka, cyrilice, arabské, bráhmská písma, čínské znaky s kanou a bopomofem, ostatní (paleta
typologie `--typ-1…5`, `--typ-jine` – ověřená pro všechny dvojice, neměnit pořadí). Jede stejnou cestou jako typologie:
`PISMO_K` je index za koncem `TYP.vlastnosti` a `typVl(k)` vrací pro něj `pismoVl()`, takže se neobjeví v seznamu vlastností
WALS, v záložce Stavba ani ve srovnání; jedna barevná vrstva naráz, volba se pamatuje v `atlas-typologie` jako `pismo`.
Skupina tečky: `skupinaPisma(i)` z `r[13]` (doložené) nebo `r[15]` (odhad z CLDR `likelySubtags`, jen pro jazyky bez
`languageData`; `scripts/podrobnosti.mjs`). Odhad karta ukazuje jako „latinka (odhad)“ s vysvětlením. Skupiny a sporná
zařazení jsou v `data/ZDROJE.md`. Na telefonu se po výběru mapy (písmo i typologie) stránka vrátí ke glóbu (`nahoruKeGlobu`).
**Písma světa na mapě Písmo** (30. 9. 2026, uživatel: „písma na mapě, kde se jakým písmem píše, jako už máme jazyky“; náhled
schválil „je to OK“): `data/pisma.json` (36 živých písem: `kod` ISO 15924, `kody` – které kódy CLDR k písmu patří, `ukazka` psaná písmem
samým, `typ` abeceda / abdzad / abugida / slabicne / logograficke / smisene, `smer` ltr / rtl / ttb, `stitky` [délka, šířka] míst
popisků, `font` – rodina Noto z Google Fonts pro písma, která systém nemusí mít, texty `cs`/`en`), build → `PISMA_SVETA`
(`/*__PISMA__*/null`). Se zapnutou mapou Písmo kreslí `kresliPismaSveta` (v `kresliPopredi`, ne při putování ani cestě slova)
rozlité oblasti skupin písem kolem teček (plátno 1/6 jako u putování) a popisky: ukázka znaků v barvě skupiny, pod ní název;
co by se překrylo, vynechá, mongolské písmo svisle. Klepnutí na popisek (`stitekPismaNa` v `klikDoMapy`) **i do barevné oblasti**
(`pismoNaMiste`: nejbližší tečka v dosahu oblasti, při zvýrazněné skupině jen z ní; uživatel 30. 9. 2026: s vybranou cyrilicí
klepnutí do mapy otevřelo jazyk místo písma) otevře kartu písma s tlačítkem „Jazyk na tomto místě“
(`ukazPismo` přes `ukazZvlastni("pismo:<kod>")`, odkaz `#pismo-latn`): štítky Typ / Směr / Jazyků na glóbu (z toho odhadem),
záložky O písmu (výklad, Rodokmen písem, putování písma), Jazyky (jazyky atlasu, klepnutím vybere) a Kde je úřední (státy
z `r[14]` se stupněm 1). Legenda mapy Písmo má tip a tlačítko putování písma. Texty prošly nezávislým ověřením (opraveno mj.:
thaana doložena od přelomu 16. a 17. století, Mongolsko od 2. 1. 2025 úřední dokumenty v obou písmech, nejstarší datovaný nápis
arabským písmem Zabad 512, barmské písmo přes monské jen podle tradičního výkladu, kanadské slabičné písmo – autorství Evanse
sporné a typologicky abugida, ladino dnes většinou latinkou, manipurština souběžně meitei majek, syrské písmo „syrských křesťanů
(Asyřanů, Chaldejců, Aramejců)“ – neutrálně, hangul „v KLDR čosongul“, popisek hebrejského písma v nesporném území Izraele,
čerokízský v Oklahomě).

**Wikidata** jsou z prostředí Claude Code na webu blokovaná, proto je stahuje GitHub Actions
(`.github/workflows/wikidata.yml`, 1. v měsíci a ručně přes Actions → Run workflow). Výsledek přijde jako pull request;
Netlify k němu udělá náhled. Pro pull request musí být v Settings → Actions → General zapnuté
„Allow GitHub Actions to create and approve pull requests“. `.github/workflows/kontrola.yml` spouští `npm run check`
u každého pushe.

## Jazyky starověku: stránky o civilizacích (od 26. 9. 2026)

Nápad uživatele: „pro starověké jazyky extra stránky o té které civilizaci zaměřené na řeč a písmo, plovoucí nad
glóbem, jako stránka moderní ilustrované encyklopedie; hodně ilustrací, zajímavý text, fotky“. Vstupy: **medailon Jazyky starověku pod glóbem**
(`#tl-starovek`; do 27. 9. 2026 ikona chrámu v záhlaví) otevře nabídku `#starovek-okno`
(i odkaz `#starovek` / `#ancient`); dlaždice v seznamu jazyků se ukáže jen při hledání (sedí-li na `hledat`); tlačítko na
kartě tečky jazyka civilizace (`tecky` v datech) a odkaz `#chetite` / `#hittites`. Vzorová stránka: **Chetité**
(uživatel vybral ze dvou návrhů, Chetité vs. Egypt), 26. 9. 2026 pak **Starověký Egypt** („pokračuj egyptem“;
adresa `#egypt`, `/starovek/egypt/`, `/en/ancient/egypt/`). Dlaždice řadí civilizace chronologicky (pořadí
v `data/starovek.json`). Tentýž den přibyly **Sumer a Akkad** (`#sumer-a-akkad`, id `mezopotamie`) a **Féničané**
(`#fenicane` / `#phoenicians`); ikona chrámu v záhlaví měla bublinu s vysvětlením při najetí myší (od 27. 9. 2026 medailon s popiskem a `title`) (uživatel: „na tu
ikonu mouseover, o co jde“). V okně civilizace je vlevo nahoře „‹ Jazyky starověku“ zpět do výběru a na konci
rozcestník ostatních civilizací (uživatel: „nedostanu se zpátky na výběr civilizací“); web má rozcestník `/starovek/`
a `/en/ancient/`. Na přání uživatele („ano, Řecko, Mayové …“) přibyly **Starověké Řecko** (`#recko` / `#greece`: lineární
písmo A a B, Ventris, abeceda, bústrofédon, nářečí a koiné, hlaholice) a **Mayové** (`#mayove` / `#maya`: logosylabické
písmo, číslice a kalendář, kodexy, Knorozov). Mayské číslice v příkladu stojí nad sebou (znak nového řádku v datech
a `.civ-znak-radek.civ-mayc`). Unicode má z mayského písma jen číslice, ostatní znaky se proto ukazují jen na fotkách
a v přepisu. Na pokyn „postupně všechny“ (26. 9. 2026) přibyly **Indie** (`#indie`/`#india`), **Čína** (`#cina`/`#china`),
**Etruskové** (`#etruskove`/`#etruscans`), **Persie** (`#persie`/`#persia`), **Řím** (`#rim`/`#rome`) a **Aksum** (`#aksum`);
civilizací je 12, řazené zhruba podle počátku (`data/starovek.json`). Postup u nich: fotky a texty přes workflow najednou,
každou stránku napsal samostatný pomocný agent podle `zadani-autor` (výběr fotek, `foto-prep.py`), jiný ji nezávisle
zkontroloval a opravy šly zpět do stránky. Nová písma v `PISMA`: staroitalské, bráhmí, kharóšthí, dévanágarí, říšská
aramejština, avestánské, nápisná pahlavština, jihoarabské, etiopské a čínské znaky (Noto Serif TC); písma psaná zprava
doleva jsou v poli `RTL`. Popisky fotek i tabulky slov dostávají písmo přes `text()`; v tabulce slov je první sloupec
kurzívou, ale znaky písem ne (`.civ-slova tbody th [class^="civ-"]`). Validace bere i jurisdikční licence („CC BY-SA 2.0 de“).
Tečka jazyka patří jen jedné civilizaci (karta tečky ukáže první), proto Persie nemá elamštinu ani aramejštinu (má je Mezopotámie).
**Přehledy a dalších pět civilizací** (26. 9. 2026, uživatel: „kdi do toho všeho, postupně“): v nabídce jsou první dva
přehledy s `"prehled": true` (bez fotek, teček a faktů nemusí mít): **Rodokmen písem** (`#rodokmen-pisem` / `#family-of-scripts`,
oddíl `strom`: uzly `{id, rodic, nazev, doba, ukazka, civ, jistota}`, `jistota: "sporna"` = přerušovaná čára, `civ` odkazuje
na stránku; tabulka slova „král“ ve 20 písmech) a **Slovníček pojmů** (`#slovnicek-pisma` / `#writing-glossary`, oddíl
`pojmy`). Ilustrace přehledů je `pisarna` (stůl písaře). Přibyli **Hebrejci a Aramejci** (`#hebrejci`), **Keltové**
(`#keltove`/`#celts`), **Arméni a Gruzínci** (`#armeni-a-gruzinci`), **Germáni a runy** (`#germani`/`#germanic-peoples`)
a **Slované a Velká Morava** (`#slovane`/`#slavs`); tečku staroslověnštiny dostali Slované (ne Řecko), starohebrejštiny
Hebrejci (ne Féničané), čeština vede na Slovany. Tlačítko civilizace je i na kartě jazyka z atlasu (záložka Zajímavost), nejen na kartě tečky.
V nabídce Jazyků starověku jsou přehledy v jemně podbarveném bloku (`.starovek-prehledy`) a pod nimi ozdobný předěl
(`.starovek-predel`: tenká čára s kosočtvercem), pak civilizace – uživatel 26. 9. 2026: „oddělit ty dva první body graficky“.
Náhledy ilustrací v nabídce a na tlačítkách civilizací jsou hotové obrázky `static/starovek/<id>/nahled.jpg` (240 × 150,
vyrábí `scripts/fotky-artefakt.py` z `malba.jpg`; v artefaktu jako data:), ne živě kreslené akvarely – 19 akvarelů se na
iPhonu kreslilo několik sekund a uživatel viděl prázdné čtverce. Rozcestník na konci stránek se jmenuje „Další stránky“.
**Písma se odvozují ze znaků**: `PISMA` v šabloně má i rodinu Noto a `rodinyPisma(c)` z textu, popisků fotek a tabulek
zjistí, co stránka potřebuje; pole `pisma` v datech je jen kontrolní (validace upozorní na nesoulad). Validace hlídá, že
každé písmo v `PISMA` má pravidlo ve `starovek.css` – bez něj se ukáže náhradní systémové písmo (stalo se u 14 nových písem).
Při ověřování opraveno mj.: nejstarší česká věta v litoměřické listině je ze začátku 13. st. (listina 1057), Kyjevské listy
„obvykle pokládané za nejstarší“, na Themistoklových střepech čtrnáct rukou, De orthographia bohemica anonymní, háček až
z 16. st.; nejstarší nápis na českém území není runový (římské cihly z Mušova), jen nejstarší ze slovanského prostředí.

**Příběhy jazyků** (26. 9. 2026, podněty z hodnocení webu, uživatel vybral „všechny čtyři“): druhá sekce ve stejné
šabloně. Stránky jsou v `data/starovek.json` s `"sekce": "pribehy"` a `"skupina"` (`slova`, `promeny`, `lide`, `zahady`;
názvy skupin v `src/ui/*.json` → `pribehy.skupiny`, validace je hlídá). Vstup: **medailon Příběhy jazyků pod glóbem**
(`#tl-pribehy`, do 27. 9. 2026 ikona knihy v záhlaví; `otevriSekci("pribehy")`, stejné okno `#starovek-okno` s nadpisy skupin), odkaz `#pribehy` / `#stories`,
hledání; web `/pribehy/<adresa>/` a `/en/stories/<adresa>/` s rozcestníkem. Příběhy **nedávají tlačítko na kartu jazyka**
a do „jedna tečka = jedna civilizace“ se nepočítají (`civPodleTecky` a validace je přeskakují). Rozcestník na konci stránky
ukazuje jen stránky téže sekce (`o.dalsi`). Oddíl **`mapa`** `{h, p, vlastnost}` dá tlačítko „Ukázat na glóbu“, které zavře
stránku a zapne typologickou mapu WALS (čaj → 138A; `ukazMapu`, odkaz `#mapa-138A`, `#mapa-pismo`). Stránky: Čaj a slova
na cestách (`#caj`/`#tea`), Slova z češtiny ve světě, Jak z latiny vznikly románské jazyky, Jazyky, které se vracejí,
Jazykové záhady. Při ověřování opraveno mj.: nejstarší česká přejetí nejsou husitská (něm. Petschaft z pečeť, kolem 1300),
čeština měla dřív thé a čaj až od 19. st. jako rusismus, WALS vede polštinu (herbata) jako „jiné“, Ramusio 1559 (ne 1545),
nejstarší anglický doklad cha je Linschoten 1598, manská Bible celá 1775, Neacșuův dopis není datovaný (jen přesně
datovatelný), Glottolog vede manštinu jako „extinct“ a „awakening“ je jen v komentáři z ElCat, rongorongo – sporné, zda je to písmo.
**Cesty slov na glóbu** (26. 9. 2026, podnět z hodnocení webu; uživatel zvolil před nahrávkami rodilých mluvčích – ty si
atlas nemůže poslechnout a ověřit a artefakt by přerostl 16 MB): `data/cesty-slov.json` (build → `CESTY`, validace hlídá tečky,
pořadí rodičů a texty). Slovo má kroky jako strom `{id, rodic, kod, jazyk?, tvar, doba, pozn?, jistota?}`; `jazyk` přepíše název
tečky, když historický jazyk tečku nemá (osmanská turečtina na tečce turečtiny, dolnoněmčina na `nort2627`). Režim `cesta`
v app.js (`spustCestu`, `ukonciCestu`, kreslení v `kresliPopredi`): let nad střed teček, oblouky po `CESTA_KROK` ms od rodiče,
sporné přerušovaně, u tečky tvar a jazyk (popisek, který by překryl jiný, se zkrátí na tvar nebo vynechá), tečky kroků svítí
příznakem 5, běžná jména teček jsou schovaná. Panel `#cesta-panel` (třída `eu-panel`): na počítači vpravo nahoře a glóbus se
posune do volné plochy vlevo (`spoctiPosun`), na telefonu pod glóbem jako legenda typologie. Vstupy: oddíl `cesta` v Příbězích
(`{h, p, slova}`) a odkaz `#cesta-<id>`. Řadu pilulek nahoře v nabídce Příběhů uživatel 27. 9. 2026 zamítl („nemá logiku,
nahoře jsou slova a teprve pod nimi o co jde; pilulky jsou nadbytečné, když ta slova jsou v článku“) – nevracet. Při ověření opraveno: něm. Kaffee
přes fr. café (ne přímo z turečtiny), angl. dollar z dolnoněm. daler, Pomeranze ze středolat. pomerancia, české káva zavedli
obrozenci podle pol. kawa (dříve kafe z němčiny; krok je přerušovaný). Nové slovo = kroky v datech + nezávislé ověření. 27. 9. 2026 přibylo šest slov (čokoláda, rajče, šach a mat, alkohol,
nula a cifra, šampon; tlačítka na stránce o čaji). Opraveno při ověření: české čokoláda z italštiny (č-, tvar čokolata), něm.
Tomate z francouzštiny, rajče odvozeno od „rajské jablko“ (kalk rak.-něm. Paradeisapfel), „mat“ = perské māt ‚bezradný‘
(„král zemřel“ je lidový výklad), akkadský zdroj arab. kuḥl nedoložený (krok vypuštěn), něm. Ziffer ze stfr. cifre, česká nula
z latiny, shampoo 1762 = masáž těla v lázni.
**Putování jazyka na glóbu** (29. 9. 2026, nápad uživatele: „pouť vývoje jazyka … tah Slovanů z východu, barevné animované
široké šipky, rozlité řeči“; náhled schválil, „mohlo by to být rychlejší“ → 4 s na etapu, `PUT_ETAPA`): `data/putovani.json`
(build → `PUTOVANI`, validace hlídá jazyk atlasu, texty cs/en, souřadnice, barvy `--put-*` a vazbu oblasti na proud `po`).
Jazyk má `etapy` s `doba`, `nazev`, `text`, `pohled` [délka, šířka, přiblížení], `oblasti` (kruhy [délka, šířka, poloměr °],
`barva`, `popisek`, `sporna`, `po` = objeví se, až dorazí proud) a `proudy` (`body` [délka, šířka], `barva`, `popisek`, `sporna`).
Režim `putovani` v app.js (`spustPutovani`, `jdiNaEtapu`, `ukonciPutovani`, `kresliPutovani` v `kresliPopredi`): proudy jsou široké
průsvitné čáry po povrchu s hrotem šipky, oblasti se kreslí do plátna v 1/6 rozlišení a roztáhnou se (měkký „rozlitý“ okraj
bez `ctx.filter`), sporné oblasti bledé, sporné proudy přerušovaně; starší etapy zůstávají slabě jako vrstvy dějin. Panel
`#putovani-panel` (přehrát/pozastavit, posuvník, etapy s textem, zdroje), glóbus se posune vlevo od panelu (`spoctiPosun`),
tečky jazyků jsou ztlumené. Vstupy: tlačítko „Putování češtiny“ na kartě jazyka (Zajímavost, `tlacitkoPutovani`), odkaz
`#putovani-cestina` / `#journey-czech`. Barvy `--put-*` jsou tlumená paleta z kruhového přehledu (ie, bs, sl, zsl, jsl, vsl, cs).
Zatím **čeština**; další na řadě **kurdština** (uživatel: „hodně stojím o kurdštinu“). Texty etap nezávisle ověřit jako vše ostatní.
U češtiny při ověření opraveno: PIE „v 5. a 4. tisíciletí“, anatolská hypotéza „asi o dvě až tři tisíciletí dřív“, do Anatolie
dvě sporné cesty (Balkán, nebo Kavkaz – Lazaridis 2025), proud do Íránu skutečně do Íránu a odbočka do Indie, praslovanština
„asi 1000 př. n. l. – 500 n. l.“ s rozdílnými datacemi (Lamprecht vs. 1. tis. n. l.), etapa „Šíření slovanštiny“ (ne „stěhování“ –
migrace je sporná, Curta 2001), Ilmeň až v 8. století (přerušovaně), proud do Čech přes Moravu, čeština asi 10 milionů rodilých
mluvčích (ČSÚ 2021), s nerodilými kolem 11 milionů.
**Kurdština** (29. 9. 2026, `#putovani-kurdstina` / `#journey-kurdish`, tlačítko na kartě kurdštiny): PIE, indoíránština (Sintašta,
Andronovo), íránské jazyky na náhorní plošině (Médové, Peršané, sporná cesta přes Kavkaz), předkové kurdštiny (SZ íránský jazyk
s JZ rysy, médská teorie neprokazatelná, MacKenzie: sousedství Peršanů u Isfahánu – sporné), šíření do Tauru a Anatolie,
přesídlení do Chorásánu, dnes kurmándží / sorání / jižní kurdština. Barvy `--put-ii`, `--put-ir`, `--put-ku`, `--put-kmr`,
`--put-ckb`, `--put-sdh`. Popisky proudů a oblastí se nepřekrývají (posun o ±17 px, jinak vynechat). Při ověření opraveno:
Parsua 843 a Médové (Amadai) 835 př. n. l. u Salmanassara III., spojení Parsua s Peršany sporné; médština doložena i jmény;
teorie středního Íránu je MacKenzieho (Isfahán); přesídlení do Chorásánu kolem 1600 přes Varámin (proud nesmí přes Kaspik);
hranice ustálena mírem ze Zuhábu 1639; Cizîrî asi 1570–1640, Ehmedê Xanî, „klasická literatura v kurmándží“; v SSSR arménské
písmo, latinka, od 1946 cyrilice; úřední jazyk celého Iráku od 2004 (potvrzeno 2005); 25–30 milionů mluvčích; zazaki a gorání
neutrálně (mluvčí se většinou hlásí ke Kurdům, jazykovědci je řadí zvlášť).
**Maďarština a romština** (29. 9. 2026, `#putovani-madarstina` / `#journey-hungarian`, `#putovani-romstina` / `#journey-romani`).
Maďarština: prauralština (střední Volha a Kama, nebo Sibiř – západní, či u Minusinsku podle Grünthala a kol. 2022; obojí přerušovaně),
ugrické jazyky a odchod Chantů a Mansů k Obu, pramaďarština na jižním Uralu (Magna Hungaria, íránští kočovníci), Levedie
(poloha sporná) a Etelköz, příchod přes Verecke 895 (do Sedmihradska přerušovaně), maďarština dnes. Romština: indické kořeny
(centrální indoárijské, sporný přesun na SZ), Persie a Arménie, Byzantská říše, do celé Evropy, nářečí dnes (balkánská, valašská,
středorumská, severovýchodní, severozápadní), romština v Česku. Barvy `--put-ur, ug, hu, ko, in, rom, bal, vla, cen, svy, szap`
(stejná tlumená paleta, jen nové klíče). Při ověření opraveno: Grünthal a kol. 2022 kladou pravlast na Sibiř (Minusinsk), datace
2000 př. n. l. je Kalliova (2006), „střední“ (ne horní) Volha; Julián 1235–1236; Kabaři jako odštěpenci od Chazarů; Tihany =
nejstarší slovní spoj, Mariin pláč asi 1280–1310; Sikulsko ne u Kluže (zvlášť „Sedmihradsko a Partium“); trasy nesmí přes Ladogu,
Marmarské moře ani Kattegat. U romštiny: „centrální indoárijské“ (česky „středoindické“ = vývojové stadium), s češtinou příbuzná
jako indoevropský jazyk, ne „přes hindštinu“; Mendizabal datuje počátek populace, ne odchod; lomavren je smíšený jazyk; listina
1385 potvrzuje dar 40 rodin z Vodițy; Čechy 1399 nejistě, spolehlivě 1416; Zikmund 1417 římský král (ne císař); Španělsko 1425;
Británie a Skandinávie od 1505; nejméně 4 miliony mluvčích; u Česka genocida Romů a Sintů (z asi 6 500 přes 5 000 obětí, téměř
540 v Letech a Hodoníně, ostatní v Osvětimi), Hübschmannová zakladatelka romistiky (ne „prosazovala do škol“), Charta (část II).
**Maorština** (29. 9. 2026, `#putovani-maorstina` / `#journey-maori`, 7 etap: Tchaj-wan, Filipíny a Indonésie s Marianami, Lapita,
odbočka na Madagaskar, dlouhá pauza a východní Polynésie, Havaj / Rapa Nui / Aotearoa se sporným kontaktem s Amerikou, maorština dnes).
Šipky přes oceán nesmí být modré (`--put-oc` je proto fialová), na světlém oceánu by zmizely. Posuvník má 100 kroků na etapu
(`put-osa.max` podle počtu etap). Při ověření opraveno: kontakt s Amerikou z Markéz (Fatu Hiva) ke Kolumbii, ne z Rapa Nui
(Ioannidis 2020); batáty „pocházejí z Ameriky“, sporné je jen kdo ke komu doplul; Hawaiki „pradávná“, ne „bájná“; Madagaskar
5.–10. století (lingvistika 5.–7., archeologie a genetika 8.–10.); papuánské jazyky jen souhrnné označení, „desítky tisíc let“;
Tonga asi 880 př. n. l., „jako první lidé“ až od Vanuatu; dlouhá pauza skoro dva tisíce let, Wilmshurst: nejdřív Tahiti, pak
po 70–265 letech ostatní; úpadek maorštiny výslovně (výuka jen anglicky, tresty, 1913 přes 90 %, 1975 pod 5 %), sčítání 2023
asi 214 tisíc; šipky nesmí přes Mindanao, Novou Guineu, Jávu (Sundský průliv).
**Turečtina** (29. 9. 2026, `#putovani-turectina` / `#journey-turkish`, 6 etap: praturkičtina a ogurská větev, Turkický kaganát
a orchonské nápisy, Oguzové, Seldžukové a Anatolie, osmanská turečtina, dnes). Při ověření opraveno: „turečtina pochází z řeči
Oguzů“ (ne „předky Turků byli Oguzové“), výchozí bod Oguzů sporný; Mahmúd psal slovník v Bagdádu, „první souhrnný“; Rúm nejdřív
v Nikaii, Konya od 1097; v Anatolii dál řecky, arménsky a kurdsky mluvící komunity; Tonjukukův nápis v údolí Tuulu; „Türk“ poprvé
542; do Evropy přes Dardanely (1354), ne přes Bospor; balkánské jazyky převzaly tisíce slov (Škaljić); altajskou hypotézu
většina lingvistů odmítá; šipky nesmí přes Zajsan ani Vanské jezero.
**Angličtina** (29. 9. 2026, `#putovani-anglictina` / `#journey-english`, 6 etap: Anglové a Sasové, vikingové a Danelaw, Normané
a střední angličtina, Shakespeare a první kolonie, po celém světě, světový jazyk). Při ověření opraveno: Alfréd ve Wessexu (ne
„v Sasku“); nejbližší příbuzné fríské jazyky (Scots stranou); Thames není jistě keltské (Avon, Exe, Derwent); velká změna samohlásek
asi 1400–1700, tisk ustálil pravopis; Chaucer asi 1387–1400; Caxton ve Westminsteru; ústup původních jazyků výslovně (úbytek
obyvatel, ztráta půdy, školy a úřední opatření), angličtinu přinesli osadníci (ne „se usadila“); varianty „svébytné“, ne
„rovnocenné“; 370–400 milionů rodilých; První flotila do Austrálie přes Kapské Město kolem Tasmánie; šipky nesmí přes Nizozemsko,
Skotsko, Karibské ostrovy, západní Afriku ani Madagaskar.
**Navažština** (29. 9. 2026, `#putovani-navazstina` / `#journey-navajo`, 5 etap: sporná dene-jenisejská stopa na Sibiř, severní
Atabaskové, cesta na jih (Velké pláně / Velká pánev přerušovaně), Dinétah a Dlouhý pochod, navažština dnes). Při ověření opraveno:
hypotéza „kdyby se potvrdila“, první spojení rodiny Starého a Nového světa (eskymácko-aleutské jazyky jsou jedna rodina na obou
březích); předkové na-dené převážně z prvního osídlení, část z pozdější vlny (Reich 2012); eyačtina zanikla jako rodný jazyk 2008,
znovu se učí (barva na-dené, ne jenisejská); navažské podání o vynoření mezi čtyřmi posvátnými horami; Dlouhý pochod 1864–1866,
přes 50 pochodů, přes 9 tisíc lidí, tisíce mrtvých cestou i v táboře, Hwéeldi, předcházelo ničení úrody a stád; internátní školy
od konce 19. století (Fort Defiance 1883); „kód“, ne šifra; asi 160 tisíc mluvčích (ACS 2017–2021).
**Jidiš** (29. 9. 2026, `#putovani-jidis` / `#journey-yiddish`, 6 etap: vznik v Aškenazu (Porýní, přerušovaně Podunají a Čechy),
na východ do Polska a Litvy, jazyk milionů, za oceán, holokaust (`predel`), jidiš dnes). Při ověření opraveno: románský jazyk
příchozích je Weinreichův model; bentshn přes románštinu; wormský machzor „užívaný ve wormské synagoze“; Polsko-Litva hlavním
střediskem od 16. století, většina Aškenázů až v polovině 17.; Cene-rene (hebr. Ceena u-reena), Tóra, haftary a pět svitků,
nejstarší dochované vydání 1622; sčítání 1897; 11–13 milionů před válkou; přes 2,5 milionu emigrantů, přes 2 miliony do USA;
„Německo, jeho spojenci a kolaboranti“; asi pět milionů obětí mluvilo jidiš (odhad); SSSR 1948–1949 a 12. 8. 1952 jmenovitě;
Izrael prosazoval hebrejštinu a omezoval jidiš tisk a divadlo; dnes půl milionu až milion mluvčích; YIVO ve Vilně; uznání jen
potvrzené státy (Švédsko, Nizozemsko, Polsko, Rumunsko, BiH, Ukrajina); šipky emigrace po moři, ne přes Nizozemsko a Anglii.
**Putování abecedy** (30. 9. 2026, náhled schválen; `#putovani-abecedy` / `#journey-alphabet`): putování
písma, ne jazyka – místo `atlas` má `pisma` (kódy z `data/pisma.json`, karta písma a legenda mapy Písmo na něj dávají tlačítko)
a `obrazek` (id stránky Jazyků starověku, jejíž náhled je dlaždicí v Příbězích; validace obojí hlídá). Oblasti mohou mít `znak`
{`text`, `font`} – písmeno na papírovém kolečku s linkou v barvě oblasti nad popiskem (fonty Noto se načtou z Google Fonts jen
s použitými znaky, `nactiZnakyPutovani`). 8 etap: vznik písma (vůl v klínopisu, hieroglyfech a čínsky – předkem A je jen
egyptská volská hlava), Vádí el-Hól a Serábít, Féničané, Řekové, Etruskové a Řím, aramejské písmo a potomci (bráhmí sporné),
hlaholice a cyrilice, dnes. Barvy `--put-psa, sin, fen, rek, etr, lat, ara, heb, arb, kha, hla, cyr`. Šířka šipky je nejvýš 22 px
(při velkém přiblížení rostla přes celý ostrov), `sirka` zúží i hrot. Při ověření opraveno mj.: Uruk protoklínové písmo 3350–3200,
hrob U-j v Abydu 3300–3150 a prvenství nerozhodnutelné, Mezoamerika zapotécké a mayské nápisy (olmécké sporné), směr Egypt → Sinaj
sporný, Naveh (11. st.), al-Mína dnes v Turecku, „soustavně zapisuje i samohlásky“, Marsiliana 675–650, spona z Praeneste,
F = digamma přes etruské FH, aramejština v Asýrii vedle akkadštiny, nejstarší datovaný arabský nápis Hima 470, Gandhára dnes
Pákistán, tvary hlaholice sporné, cyrilici sestavili žáci (Preslav), Sázava do 1096, Poláci hlaholicí nepsali; šipky nesmí přes
Cap Bon, Bizertu, Peloponés ani Kalábrii (Messinská úžina).
**Putování maltštiny** (30. 9. 2026, `#putovani-maltstina` / `#journey-maltese`, 6 etap: semitské kořeny, Arabové
v severní Africe a na Sicílii, nové osídlení 1048/1049, Normané, johanité a Britové, dnes). Barvy `--put-sem, sar, mt, itm, enm`.
Při ověření opraveno: nejstarší stará arabština už z posledních století př. n. l. (Karjat al-Fáw), dobývání Sicílie 827–902,
al-Himjarí je pramen z 15. století a původ osadníků (Sicílie, snad Ifríkija) je výklad, Roger II. roku 1127 ještě hrabě (král
od 1130), jazyková otázka byl spor italštiny s angličtinou (britská strana podporovala i maltštinu), angličtina úřední od 1921,
Għaqda tal-Kittieba tal-Malti založena 1920, pravopis zveřejněn 1924 a uznán 1934, Kantilenu složil Pietru Caxaro († 1485)
a zapsal ji synovec 1533–1536, „ve spisovné podobě píše latinkou“, necelých 600 tisíc obyvatel (NSO 2025); šipky nesmí přes
Bretaň, mys sv. Vincence, Cap Bon ani jihovýchodní cíp Sicílie.
**Putování italštiny** (2. 10. 2026, uživatel: „přidělej ještě cestu jazyka Italština“; `#putovani-italstina` / `#journey-italian` /
`#viaggio-italiano`, 8 etap: italické jazyky a sousedé (příchod přes Alpy / Jadran přerušovaně), latina Říma, lidová latina a rozdělená
Itálie, první zápisy (Veronská hádanka sporně, Placito capuano 960), sicilská škola a tři florentské koruny, spor o jazyk (Bembo, Crusca,
Manzoni), sjednocení a vystěhovalectví (šipky do New Yorku, Buenos Aires, São Paula; `predel` u etapy Dnes), italština dnes). Barvy
`--put-ita, osu, etq, lgb, byz, vlg, sic, tos, it, emi, itx`. **Nový klíč `--put-*` musí být i ve výčtu v `nactiBarvy` (app.js)**, jinak se
kreslí červeně – stalo se tu, validace to od té doby hlídá. Při ověření opraveno: italština úřední v celém Švýcarsku (spolkový jazyk, kantony
Ticino a Graubünden), „risciacquare i panni in Arno“ je zlidovělé rčení podle Manzoniho dopisu (ne jeho doslovný výrok), Placito = první
datovaný záměrný doklad (graffito Commodilla je starší), občanství 89 př. n. l. jen jižně od Pádu (za Pádem 49), oskičtina v Pompejích snad
i v 1. století n. l., Langobardi „většinu severu“, Byzanc Ravenna do 751 a Neapol, Rometta 965, sicilská škola „první básnická škola“ (ne
první poezie), zákon 482/1999 jazyky „chrání“, Itálie 1861 bez Benátska a Lazia (popisek jen „Itálie“), Manzoni 1827 přes Livorno; šipky
nesmí přes zálivy Gioia Tauro a Sant'Eufemia (ze Sicílie do Toskánska po souši Kalábrií) ani přes pevninu u Punta Indio (La Plata).
**Putování hebrejštiny a aramejštiny** (5. 10. 2026, uživatel: „přidej putování hebrejštiny / jivrit a aramejštiny“; texty rovnou cs/en/it/de).
Hebrejština (`#putovani-hebrejstina` / `#journey-hebrew` / `#viaggio-ebraico` / `#reise-hebraeisch`, 7 etap: kenaanské jazyky, biblická hebrejština,
babylonské zajetí a aramejština, Mišna a masoreti, diaspora, oživení se šipkou první aliji – Bilu z Charkova přes Oděsu, Bospor, Dardanely
a Egejské moře do Jaffy –, ivrit dnes). Aramejština (`#putovani-aramejstina` …, 6 etap: aramejské státy, jazyk říší s šipkami do Egypta a na
východ, Ježíšova doba/Petra/Palmýra, syrština a Církev Východu s Hedvábnou stezkou a cestou do Indie, ústup před arabštinou a sajfo, novoaramejština
dnes s emigrací). **Aramejština nemá kartu atlasu:** nový typ putování s `tecky` (glottocody teček rejstříku) a `obrazek` (dlaždice v Příbězích =
náhled stránky Hebrejci a Aramejci); tlačítko je na kartách těch teček (`tlacitkoPutovaniBodu` v `ukazKartuBodu`), validace hlídá kódy.
`tecky` může mít i putování s `atlas` (hebrejština: `anci1244`). Barvy `--put-hbr, kna, dia, ziv, aram, asy, nab, pal, syr, neo`.
Při ověření opraveno: v němčině obrácený smysl 2 Kr 18,26, šipka aliji přes Istanbul, Marmaru, Gelibolu, Astypalaiu a Kasos, šipka do Indie přes
Kešm a Makrán, tři chybné citace (Healey, Khan, Arnold) a Rendsburg, sajfo neutrálně (IAGS 2007 a parlamenty → genocida, Turecko odmítá, i
severozápadní Persie), západní novoaramejština ~15 000 před válkou a Bachʿa, židovská nářečí v Izraeli, pojmenování Asyřané/Aramejci/Chaldejci,
zákon 2018 (§ 4 c: postavení arabštiny v praxi nedotčeno), „téměř tři tisíciletí“, patriarcha od 780 v Bagdádu, jeruzalémský (ne galilejský)
Talmud, Juda ha-Nasi Mišnu „uspořádal“ (zápis sporný), všechny aramejské pasáže Bible, filozofie v židovské arabštině, 587/586; oblast „ivrit“
jen v hranicích Izraele z roku 1949 (bez územního tvrzení).
**Vstup do putování** (29. 9. 2026, uživatel vybral z návrhů jen „skupinu v Příbězích“): v okně Příběhy jazyků je za skupinou
Slova na cestách skupina **Putování jazyků** (`vlozPutovani` v `otevriSekci`) s dlaždicí pro každé putování – akvarel jazyka
(`/malby/<atlas>.jpg`, v artefaktu `malbaObrazek`, bez oživení), název a `podtitul` (povinný, validace). Tlačítko na kartě jazyka
(záložka Zajímavost) zůstává. Návrhy „tlačítko pod názvem jazyka na kartě“ a „Další putování na konci panelu“ uživatel nevybral.
Výběr jazyka nebo tečky (`vyber`, `vyberBod`) putování ukončí (dřív zůstalo kreslené pod kartou, 29. 9. 2026).
**Koncepty:** putování s `"koncept": true` build vynechá (jen `PUT_KONCEPTY=1 npm run build` pro náhled), takže neověřená
putování mohou ležet v datech, zatímco se zveřejňují jiná. Po ověření příznak smazat. Etapa s `"predel": true`
nekreslí šipky předchozí etapy (u jidiš Holokaust, aby přes zničené obce nevedly šipky emigrace).
**Jak vznikla spisovná čeština** (`#spisovna-cestina` / `#standard-czech`, skupina „Jazyky v čase“, akvarel `tiskarna`; 27. 9. 2026):
glosy a první věty, spřežky a diakritika, Blahoslav, Bible kralická, pobělohorské období („doba temna“ jen jako obrozenecký pojem),
Dobrovský, Jungmann, Rukopisy, Gebauer, Pravidla 1902, Pražský lingvistický kroužek, spisovná × obecná čeština (diglosie jako sporná).
Tečku češtiny nemá (má ji stránka Slované). Při ověření opraveno: Ploškovice = dnešní Ploskovice, oprava skladná (v místo w, ou místo au)
prosazena až 1849–1850, Dobrovský sjednotil jen koncovky (cyzý → cizí až ve 40. letech), Philomata, zz ve starším pravopisu = s.
**Tři další civilizace** tentýž den: **Elam a Urartu** (`#elam-a-urartu`; tečka elamštiny se přesunula od Sumeru a Akkadu),
**Turkuti a orchonské písmo** (`#orchon`/`#orkhon`; nové písmo `civ-orkh`, Noto Sans Old Turkic, zprava doleva; v rodokmenu
písem uzel pod sogdským s přerušovanou čarou) a **Aztékové** (`#aztekove`/`#aztecs`; aztécké písmo Unicode nemá, jen fotky).
Při ověřování opraveno mj.: Dessetův protoelamský návrh je z 2022 (2020 šlo o lineární elamské), není jisté, že protoelamské
písmo zapisovalo elamštinu, urartské opasky tepané (ne lité), citát „Slyšte, bekové“ je z východní strany Külteginovy stély,
staroturkičtina není předkem všech turkických jazyků. Anglický štítek civilizací je jednotně „Languages of antiquity“.

**Korea, Japonsko a Inkové** (27. 9. 2026, uživatel: „udělej body 2, 5, 6, 7“): `#korea` (Korea: čínské znaky a hangul;
idu, hjangčchal, Tripitaka Koreana, Čikči, Sedžong a Hunmin čŏngŭm, tvar písmen), `#japonsko`/`#japan` (Japonsko: čínské
znaky a kana; kanbun, man'jógana, vznik kany, heianské písemnictví, iroha) a `#inkove`/`#incas` (Inkové: kečuánština a kipu;
tečky kečuánštiny přešly od Aztéků). Pořadí: Korea před Orchonem, Japonsko za ním, Inkové za Aztéky. Nová písma v `PISMA`:
**kana** (`civ-kana`, Noto Serif JP) a **hangul** (`civ-hang`, Noto Serif KR); pole civilizace **`hanPismo`** přesměruje
čínské znaky (`civ-han`) na japonské/korejské tvary (`--civ-han` na `<article>`, `rodinyPisma` načte správnou rodinu).
Korejštinu přepisuje česká odborná transkripce (ŏ, ŭ, ä: Päkče, kugjŏl, Čŏng In-dži), japonštinu česká transkripce
(Murasaki Šikibu, Kúkai). Rodokmen písem má uzly `kana` (pod čínským písmem) a `hangul` (samostatný kořen).
Akvarely `machupikcu`, `heian`, `kjongbok`; ilustrace `malba.jpg` se renderuje z akvarelu 1200 × 630 (`xMidYMid slice`).
Při ověření opraveno mj.: Doctrina Christiana „pokládaná za“ první knihu tištěnou v Jižní Americe, puquina ovlivněná ajmarštinou
(ne naopak), Locke – tabule z knihy 1923; 甲/乙 jsou nebeské kmeny, Důvěrné sešity (Sei Šónagon), karate původně 唐手,
čínskou předmluvu Kokinšú psal Ki no Jošimoči; 不冬 = andʌl, 主 v 善化公主主隱 stojí za -nim podle významu, hangul je u Sampsona
„nejznámější příklad“ písma rysů, Den hangulu 1926 4. listopadu (9. října až od 1945).
- Data `data/starovek.json`: `civilizace[]` s `id`, `adresa{cs,en}`, `krajina` (druh akvarelu), `tecky` (glottocody),
  `pisma` (písma Noto), `fotky{klic: soubor, sirka, vyska, autor, licence, licenceUrl, zdroj, cs, en}` a texty `cs`/`en`
  (`nazev, stitek, podtitul, perex, fakta, nazvyTecek, oddily[]`). Oddíly: `text, foto (siroka / na-vysku), rameček,
  znaky, veta, slova, osa, galerie, tecky, zdroje`. Obě jazykové verze musí mít stejné pořadí oddílů (validace).
- Šablona `src/starovek.js` (vrací HTML jako text) je jedna pro okno v aplikaci i pro samostatnou stránku webu
  (`/starovek/chetite/`, `/en/ancient/hittites/`, v sitemapě). Styl `src/starovek.css` (papír a inkoust, v tmavém
  vzhledu sépiová noc, proměnné `--civ-*`). Okno je `<dialog id="civ-okno">`, text se posouvá v `.civ-svitek`.
- Fotky: `static/starovek/<id>/<klic>.jpg` (1200 px) a `<klic>-720.jpg` (srcset); **artefakt** vkládá jako data: malé verze
  z `artefakt/starovek/<id>/<klic>.jpg` (420 px, JPEG 62, `python3 scripts/fotky-artefakt.py`, spustit po změně fotek; 26. 9. 2026 zmenšeno z 480 px, s 27 stránkami měl artefakt 15,6 MB) – s verzemi -720
  měl artefakt s 12 civilizacemi 17,6 MB a limit je 16 MB; teď ~9 MB. Validace hlídá, že malé verze existují,
  ilustrace pro sdílení `malba.jpg` (1200 × 630, vyrenderovaný akvarel). **Wikimedia je z Claude Code na webu
  blokovaná**: kandidáty stahuje `scripts/fotky.mjs` v GitHub Actions (`.github/workflows/fotky.yml`, spustí se po
  změně `data/fotky-hledat.json`) na samostatnou větev `foto-kandidati` i s autorem a licencí; stejně tak `texty`
  (wikitext Wikipedie) k ověření faktů. Větev se při každém běhu přepíše (force push), proto stahovat s plusem:
  `git fetch origin +foto-kandidati:refs/remotes/origin/foto-kandidati`. Brát jen CC0, public domain, CC BY, CC BY-SA; autora a licenci uvést u fotky.
- Edge funkce pouští `/starovek/*` na obou doménách z kořene (fotky jsou společné).
- Písma starověku (`PISMA` v šabloně: klínopis, anatolské a egyptské hieroglyfy, koptština, fénické, ugaritské, staroperské, lineární A a B, mayské číslice) dostanou v textu třídu
  a písmo Noto automaticky. Klínové písmo a hieroglyfy: Google Fonts s `&text=` (jen použité znaky), odkaz dělá `STAROVEK.odkazPisma()`.
  Znaky ověřit (`unicodedata.name`, hodnoty znaků podle chetitské tabulky znaků); písmo Unicode má mezopotámské tvary,
  stránka to říká.
- **Postup ověření:** texty napsat, pak je nechat nezávisle zkontrolovat (agent proti staženým zdrojům) a opravit.
  U Chetitů tak opraveno např. Istanbul jen 1914 (ne 1914–1915), -ma = „však“, Lví brána bez pevné datace,
  „jedna z nejstarších“ mírových smluv, Egyptské znění i v Ramesseu.
  U Egypta: r n km.t je doloženo jen v Příběhu Sinuhetově (ne „vlastní jméno jazyka“), Kleopatra není na
  Rosettské desce (je na obelisku z Philae), ústav 1958 vedl nejdřív Lexa a od 1960 Žába, arabské dobytí 639–642.
  U Mezopotámie: „život“ je til (ne ti), číslice se vtlačovaly, pečeť patří Hašhamerovi (ne Ur-Nammuovi), Rawlinson
  pracoval ze žebříků (na lanech visel kurdský chlapec), Grotefend luštil podle opisů z Persepole.
  U Féničanů: české „abeceda“ je z a-b-c-d (z alfa–beta je „alfabeta“), Ahiram „asi 1000, sporné“, 1050 jen
  konvenční datum, Pyrgi obdobné (ne stejné) věnování, jména písmen jsou rekonstrukce, murex = ostranka.
  U Řecka: nejdelší písemná historie jen mezi **živými** indoevropskými jazyky (chetitština je starší) a ne „nepřetržitá“
  (na Kypru se mezitím psalo kyperským slabičným písmem), tabulky 15.–14. st., paláce asi 1400–1200, ko-no-so ukazuje
  pomocnou samohlásku u kn-, ostrakismus: kvórum 6 000 a část střepů popsali předem písaři (ne důkaz masové gramotnosti),
  bústrofédon = otáčí se vůl, Kyjevské listy z 10. st. pravděpodobně z Čech nebo Moravy, chur1257 = církevní slovanština.
  U Mayů: Landa byl roku 1562 františkán, biskupem až od 1573; Thompson patří do poloviny 20. století; klasická mayština
  je podle Houstona a spol. předkem východočolských jazyků (čortí), čol je jen blízce příbuzný; „jako latina“ jen jako
  pravděpodobný výklad; „jediné písmo Ameriky, o kterém víme…“ (jiná mezoamerická písma nejsou rozluštěná); nulu znali
  už mezoameričtí předchůdci; knih „patrně mnoho set, možná tisíce“; Ruz zvedl desku 1948 (jinde 1949).
  U dalších šesti opraveno mj.: Aksum – datace mincí jsou datace Britského muzea, ne vlády, obelisk ležel povalený už před
  odvozem 1937, ražba mincí „jediný stát subsaharské Afriky své doby“; Čína – 1600–1046 je novodobá, ne tradiční datace,
  rekonstrukce Baxter–Sagart *pˤok, *mˤrˤək; Řím – Lapis Niger je dlažba, ne nápis, kostel/klášter/oltář/mše přišly přes
  starou horní němčinu, na východě říše úřadovali řecky; Persie – Niebuhr v Persepoli 1765, středoperština (ne „středověká“).
- Nová civilizace: druh akvarelu v `src/akvarely.js`, fotky přes `data/fotky-hledat.json`, zmenšit (PIL) do
  `static/starovek/<id>/`, texty cs/en, ověření, `npm run check`, test v prohlížeči.

## Barvy

- **Vzhled „Hvězdná mapa se sklem“** (vybral uživatel 22. 9. 2026 ze tří návrhů: „B se sklem z A“).
  Tečky (světélka) na glóbu jsou **jen jazyky**. Pevnina je plná plocha – v noci světlejší než moře, ve dne
  tmavší (přání uživatele: tečky pevniny stejně velké jako jazyky mátly). Území vybraného jazyka má barvu rodiny, kolem je atmosféra (prstenec ani obíhající satelit tam být nemají – uživatel je nechtěl). Dole je
  souřadnice středu pohledu a počet jazyků na očích; rohy „zaměřovacího rámečku“ jsou pryč, protože mátly. Panely jsou „tekuté sklo“ (`.sklo`, `backdrop-filter`).
  Písma Chakra Petch (nadpisy), Outfit (text), JetBrains Mono (data).
- **Noc a den.** Vzhled se řídí nastavením počítače (`prefers-color-scheme`, i za běhu), přepínač
  sluníčko/měsíček ho přebije. Volba se pamatuje (`atlas-motiv`); když se shoduje s počítačem, smaže se
  a stránka se zase řídí počítačem. Skript v hlavičce nastaví `data-theme` hned, aby stránka neblikla. Denní barvy jsou v `:root[data-theme="light"]`; glóbus je čte z CSS proměnných
  (`nactiBarvy`).
- **Tečky jazyků jsou teplý inkoust se světlým lemem** (28. 9. 2026, uživatel vybral „C + A“ ze čtyř náhledů proti „modré kaši“
  z hodnocení webu: modré tečky na modrém moři v hustých oblastech splývaly): `--tecka-jazyk` ve dne cihlová `#7A2E1C`,
  v noci jantarová `#FFC98A`, lem `--tecka-lem` v barvě papíru / noční plochy (shader: `u_lem`, `u_lemB`, tečka je 1,45× větší,
  aby jádro zůstalo stejné). V hustých oblastech (víc než dvě tečky do 1,5°, `a_hust` z mřížky v `pripravGl`) jsou tečky
  menší a průsvitnější (`u_hust`) – **jen při pohledu na celý svět, s přiblížením odezní a od 2× jsou všechny tečky stejné**
  (uživatel 28. 9. 2026: „různě velké a vybarvené tečky působí matoucím dojmem“). **Nesčítají se už ani v noci** – s lemem se nejhustší místa slila do bílé skvrny.
  Při barvení podle vitality nebo typologie je lem i ztenčení vypnuté (barva musí zůstat pravdivá).
  Ve dne se neříká „světélko“, ale „bod“: texty s tímto slovem mají denní znění s příponou `Den`
  (`krokKlikniJakDen`…), vybírá je `tx()` a po přepnutí vzhledu se texty obnoví (`obnovTexty`).
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

Zajímavosti musí být pravdivé. 22. 9. 2026 opraveno 19 nepřesností (např. zulská
odpověď na pozdrav je „Ngikhona“, ne „shiboka“; „mrož“ není z nizozemštiny). Novou zajímavost ověř.
26. 9. 2026 přepsány všechny zajímavosti (163 jazyků i vymyšlené jazyky) do věcného encyklopedického tónu:
jedna až dvě věty, doložitelný údaj (letopočet, zákon, odborný termín s vysvětlením), žádná zvolání.
Sporné výklady se tak i označují („jedno z vysvětlení“, „podle některých rozborů“, „původ je sporný“).
Opraveno přitom: pončo není doloženě z kečuánštiny, klasické mayské nápisy nejsou v yucatécké mayštině
(jsou v jazyce čolské větve), inuitské slabičné písmo pochází z kríjského, ne naopak.

## Vzhled „obrázková encyklopedie“ (redesign, na webu od 24. 9. 2026)

Podle obrázků uživatele (B: světlá encyklopedie, C: tmavá s bohatou kartou), 24. 9. 2026. Vznikl na větvi
`redesign-encyklopedie` a 24. 9. 2026 ho uživatel pustil na `main` („vše, co se změnilo, pusť na main a zveřejni“).
Dřívější náhledový artefakt https://claude.ai/artifact/XS67Gsv9d4y2pMu7UWEGRi už jen dubluje hlavní artefakty.
- **Reliéfní glóbus**: modré moře se dnem a stínovaná pevnina. Podklad `data/relief.webp` (3072 × 1536, ~0,3 MB) vyrábí `scripts/relief.py`
  z Natural Earth shaded relief a NOAA ETOPO1 (public domain, z pythonového balíčku basemap-data); šedý obrázek,
  moře 0–0,45, pevnina 0,55–1. Kreslí ho WebGL 2 do plátna mimo stránku (`kresliRelief`), barvy z CSS
  (`--more1/2`, `--souse1/2`), takže den i noc z jednoho obrázku. Dřív 4096 × 2048 JPEG (1,2 MB), zmenšeno na přání uživatele.
- **Území vybraného jazyka je plně oranžové** (`--uzemi`), ne v barvě rodiny: indoevropská modrá by na modrém
  moři splývala s vodou. Šrafování uživatel zamítl („zaplnění plochy jako dosud, jen jiná barva“).
- Pozadí stránky je světlý papír `#FBF9F4` („aby to vypadalo jako kniha“). Pevnina glóbu zůstává šedobílý reliéf
  (`--souse1/2` `#9EA6B2`/`#FCFBF7`) – zesvětlení pevniny uživatel nechtěl, myslel podklad stránky.
- **Logo** (návrh C „písma světa“, 24. 9. 2026): **plochá** pečeť – kruh, vnitřní kroužek, poledníky a rovník (s mezerou kolem א) v modré
  rodiny `--r-ie`, červená tečka nahoře a pět písmen z pěti písem: A (latinka), Я (azbuka), א (hebrejština, přání
  uživatele), ع (arabština), あ (japonština). Plastickou verzi (lesklá koule, zlatá písmena) uživatel zamítl
  („vypadá to blbě, nebudeme to dělat plastické“). Písmena jsou obrysy vytažené z písem (Playfair Display, Noto
  Serif Hebrew / Naskh Arabic / Serif JP přes fonttools), ne text. Ve stránce kreslí inkoust `currentColor`, takže
  funguje ve dne i v noci; `static/favicon.svg` a `apple-touch-icon.png` mají pevné barvy na papíře.
  Logo s nápisem je odkaz **„domů“** (`#domu`, `domu()`): zavře kartu, rodokmen, Bránu, EU, srovnání, panely
  a hledání, zruší odkaz v adrese a vrátí glóbus do výchozího pohledu.
- Patkové titulky Playfair Display (nápis v záhlaví větší), papírové pozadí, bílé karty, červené hlavní tlačítko.
  Záhlaví bez karty, jen linka. Na kartě řádek „Rodokmen jazykové rodiny“ (cesta v Glottologu, `cestaRodokmenu`).
- **Pohlednice jsou malované akvarely** (`src/akvarely.js`, build ho vkládá před `app.js`): krajina podle toho,
  odkud jazyk pochází (`data/krajiny.json`, validace hlídá každý jazyk a existenci druhu), 19 druhů s variantami.
  Uživatel zamítl: plakátové ploché ilustrace v barvě rodiny („nelíbí“), satelitní snímky („nic se nepozná“)
  a nakonec i skutečné fotky z Wikimedia Commons (automatický výběr přes Wikidata dával mapy, vlajky,
  cizí místa a u lakotštiny Mount Rushmore; uživatel práci zastavil). Památky a lidi na pohlednice nekreslit
  (výjimka: Říp u češtiny, viz níž).
  **Přání uživatele 24. 9. 2026:** sousední země nesmí mít stejný obrázek („Německo a Francie nemohou mít
  ten samý“), obrázků má být aspoň trojnásobek a mají nést **architektonické znaky země** – typickou lidovou
  a městskou stavbu (hrázděné domy, břidlicové střechy, pagody, mešitové kopule…), ne konkrétní památku.
  Postup po světadílech, po každém galerie k připomínkám. **Evropa hotová a na webu (24. 9. 2026)** (47 jazyků, každý jiný obrázek, druhy
  pojmenované podle kraje: `porynsko`, `vinice`, `toskansko`, `tatry`, `maramures`, `laponsko`…). Stavby kreslí
  knihovna v akvarely.js: `dum` (typy sedlo, valba, stit, stupne, plocha, dosky; hrázdění, okenice, komín),
  `kostel` (věže jehlan, barok, ctverec, kampanila, stupne, dreveny), `cibule`, `byzant`, `kyklady`, `hrad`,
  `mlyn`, `majak`, `horreo`, `kozolec`, `seno`, `studna`, `capi`, `kravy`, `portikus`; `vesnice` řadí domy odzadu.
  Hotové také Kavkaz, Blízký východ a Střední Asie (15) a jižní Asie s Kazachstánem (20); další stavby: `kupole`
  (pul, perska, ploska), `minaret` (tuzka, banka, hranol), `mesita`, `strazni` (svanetská/čečenská věž),
  `armensky`, `iwan`, `sikhara`, `gopuram`, `stupa`, `pagoda`, `praporky`. Uživatel 24. 9. 2026: „pokračuj pořád
  dál“ – dávky se po kontrole galerie rovnou pouštějí na web. Hotová i východní a jihovýchodní Asie (23; `sin`, `mostek`, `torii`, `wat`, `buvol`, `naKulech`). Hotová i Afrika (28; `ul`, `zebu`, `velbloud`,
  `hlinenaMesita`, `dhau`, `piroga`, `kapskyStit`). Hotová i Amerika (17; `lamy`, `bizoni`, `tipi`, `agave`, `araukarie`, `misie`). Hotová i Oceánie (10). **Všech 164 jazyků má vlastní krajinu**
  (164 druhů; 1. 10. 2026 přibyla bavorština s druhem `bavorsko`: Alpy, barokní kostel s cibulovou věží, statky s dřevěným
  balkonem, modrobílá májka, strakatý dobytek). Nový jazyk atlasu potřebuje vlastní druh, ne sdílený.
  **Čeština má horu Říp** (`rip`: zalesněná „obrácená mísa“ nad rovinou Polabí s rotundou sv. Jiří na temeni, lány,
  vesnice s červenými střechami, vlčí máky) – výslovné přání uživatele 24. 9. 2026 („Říp, nebo Pražský hrad“), jediná
  výjimka z pravidla bez památek. Český znakový jazyk má dál `kopce`.
  Světlé barvy (sníh, domy, křída) se v akvarelu nesmí násobit, jinak zmizí (`svetla()`: všechny složky ≥ 0xE0).
  **Perokresbu / rytinu uživatel zamítl** („je na nic“) a chtěl akvarely „daleko jemnější, detailnější, propracovanější“
  (24. 9. 2026). Proto: hory mají rozeklaný obrys (`clenit`), stinnou stranu za žebrem od vrcholu až do sedla, žlaby
  a sníh s jazyky, u paty opar; bližší plochy leží na papíru (`kryt`), jinak by se jimi akvarel prosvítal; koruny
  jsou vrstvené (`koruny`, `pas`), světlá temena se nenásobí; duny mají ostrý hřbet od vrcholu a stín za ním; pole
  jsou v perspektivě k úběžníku (`pole`); stromy mají vlastní kresbu (`jehlicnan`, `briza`, `akacie`, `baobab`,
  `oliva`, `cypris`, `palma`), stavby taky (`domky`, `chyse`, `mlyn`). Odraz ve vodě kreslí stejný tvar znovu
  převrácený, proto má `hory` vlastní náhodu podle tvaru. Jedna malba má 30–110 filtrů a kreslí se 50–140 ms
  (softwarově, 2× hustota) – víc nepřidávat bez změření.
- **Na webu se malba na kartě (i u Jazyka dne) načte rovnou jako hotový obrázek `/malby/<id>.jpg`** (28. 9. 2026: hodnocení
  webu vidělo nahoře na kartě „velký prázdný světlý blok“ – živá malba se kreslí až 2,2 s po otevření). Při chybě načtení
  a v artefaktu se kreslí živě jako dřív. Proto po změně krajin **vždy znovu `scripts/malby.mjs`**, jinak karta ukáže starou malbu.
- **Živé akvarely** (28. 9. 2026, uživatel: „lehce animovat, vítr, stromy, mraky“, z náhledu vybral sílu **Výrazná**, pouští se
  hned): na kartě i u Jazyka dne se stromy, keře a tráva vlní v poryvech větru, mraky pomalu plují a voda se čeří; hory,
  stavby, pole a Říp stojí. Co se hýbe, určují **značky v kresbě**: v `akvarely.js` jsou funkce `strom`, `lesik`, `palma`,
  `trava`, `koruny`, `pas`, `radaKeru`, `jehlicnan`, `briza`, `akacie`, `baobab`, `oliva`, `cypris`, `topol`, `kvety`
  obalené `<g data-z="veg">` (28. 9. 2026 i `agave`, `araukarie`, `list`, `praporky`; ručně kreslené rostliny přímo
  v krajinách – čirok, réva, bambus, levandule, papyrus… – obaluje `rost(...)`, 70 míst), `mrak`/`rasy`/`ptaci` jako `mrak` a `voda` jako `voda` (podle barev to nešlo – hýbal by se celý Říp
  a sníh na horách). `maskaMalby` v app.js vykreslí SVG bez filtrů s barvami podle značek do 400 × 250 (styl musí být
  v `<defs>`, pravidlo schovává vinětaci a papír jako další prvky za krajinou), `upravMasku` ji rozšíří a rozmaže
  (stromy o 1 px, mraky o 5 px). `ozivMalbu` pak přes obrázek položí WebGL plátno `canvas.zive`, které posouvá pixely podle
  masky (`ZIVE_FS`, ořez jako `object-fit: cover`), asi 30 snímků za sekundu, jen když je malba na očích; odpojené plátno
  uvolní kontext. Při `prefers-reduced-motion` nic. Nový strom nebo keř v akvarelech obalit stejně, jinak bude stát.
  U norštiny se nevlní odraz hory ve vodě (kreslí se jako hora).
  **Jen malé obrázky jazyků** (karta a Jazyk dne) – uživatel 28. 9. 2026: „chci animaci jenom u malých obrázků jazyků“.
  Ilustrace Jazyků starověku a Příběhů, medailony, statické stránky jazyků ani vymyšlené jazyky nerozhýbávat.
  Obalení kresbu nemění – po úpravě ověřit, že `scripts/malby.mjs` vyrobí všech 164 maleb bajt po bajtu stejně
  (`git status static/malby` prázdné). Plochy kopců, polí a mlhu neobalovat (vlnil by se horizont, pod mlhou kopce).
  Suché krajiny (Kutch, Kalahari, Tibet…) mají jen mraky a pár stébel, hýbou se proto málo – tak to je.
- **Malby se ukazují jako bitmapa, ne jako živé SVG** (`malbaObrazek`, `vlozMalbu` v app.js). SVG s desítkami filtrů
  vložené do stránky se při každém pohybu glóbu přepočítávalo a výběr jazyka (let, vlna území, oblouky) trhal
  (uživatel 24. 9. 2026: „všechno je trhané, pomalé“; v měření 2,1 s práce GPU za 4 s animace, s bitmapou 0,07 s).
  Převod SVG → JPEG 800 × 500 (data: URL, kvůli artefaktu ne blob:) blokuje stránku, proto se spouští až 2,2 s po
  otevření karty v nečinnosti prohlížeče a malba se pak plynule objeví. Hotové malby se pamatují (`MALBY`).
- Build odmítne zdroj se značkou nedořešeného konfliktu (`<<<<<<<`, `=======`, `>>>>>>>`): po sloučení `main`
  do větve zůstala v `styles.css` a tiše vyřadila pravidlo pod sebou (křížek Dne jazyků utekl do rohu stránky).
- Build zkouší skript stránky přeložit (`new Function`): při úklidu fotek zůstaly v kódu osiřelé řádky
  a stránka byla úplně nefunkční, aniž by `npm run check` něco hlásil.
- **Barvy vitality na reliéfu**: na stínovaných svazích neměl nejsvětlejší stupeň kontrast (1,4–1,6 : 1), proto je
  při barvení podle vitality pevnina jednolitá (`--souse-vit`: den `#E6E8EC`, noc `#1F2B55`) a tečky větší.
  Obě stupnice na těchto plochách prošly validátorem `--ordinal` (světlý konec 3,2 : 1 a 3,6 : 1).
- Glóbus se na počítači vejde nad medailony (`stredY`, rezerva výšky `#dok` v `zmer()`); dřív ho lišta zakrývala.
- **Glóbus se vznáší nad hladkou plochou a vrhá měkký stín** (uživatel 25. 9. 2026 ze dvou náhledů: „stín – bez mřížky“;
  mřížku ubíhající k obzoru nechtěl). `kresliPlochu` v app.js kreslí do zásoby s koulí: na počítači plochu od obzoru
  (0,55 r pod středem) dolů s přechodem `--podlaha`, na telefonu jen stín (úzké plátno by z plochy
  udělalo šedý obdélník); stín je zploštělý kruhový přechod 1,14 r pod středem. Při přiblížení nad 1,5× zmizí.
  Kvůli místu na stín je koule menší (`polomerZaklad` = výška / 2,26) a posunutá výš.
- Klik na zemi ji jedním kliknutím podbarví a rozsvítí její jazyky (příznak 5); tlačítko „Zvýraznit na glóbu“
  zmizelo, protože po kliknutí už nic viditelného nedělalo. Zavřením okna zvýraznění zmizí.
- Brána do jiných světů má i ve dne tmavé hvězdné nebe (`.scena.rezim-brana` přepíná textové barvy na noční).
- **České názvy (27. 9. 2026):** do `glottolog-branches.cs.json` přibylo 725 větví (vnitřní uzly velkých rodin, které strom
  popisuje) a nový soubor **`data/jazyky-cs.json`** (glottocode → české jméno; build ho použije přednostně před CLDR
  a Wikidaty, validace hlídá kódy) má 776 jmen: znakové jazyky („guinejský znakový jazyk“), průhledné variety („súdánská
  arabština“, „mixtéčtina (Peñoles)“) a ustálené názvy (monština, šorština). Opraveny i chyby z Wikidat (severní dolnosaština
  vedená jako fríština, asyrská novoaramejština jako chaldejská, Lokono jako „arawacké jazyky“, americký znakový jazyk).
  Vše prošlo nezávislou kontrolou. Nepřekládat vymyšlenými názvy – málo známé jazyky bez ustáleného českého jména zůstávají
  anglicky. **Druhé kolo (27. 9. 2026, „2 a 3 udělej“):** prošlo všech 892 převzatých jmen – 210 oprav v `jazyky-cs.json`
  (věcné chyby jako „aleutština“ u vanuatského Ale, „čukština“ u chuukštiny, „ladinština“ u judeošpanělštiny; velká písmena;
  sjednocení se jmény atlasu); prázdné jméno "" zruší chybné jméno z Wikidat. Čínské variety česky („chajnanština“,
  „čínština (dialekty Ťin)“), ne pinyinem. Rodiny: doplněno 128 českých názvů, 28 zastaralých klíčů smazáno (validace
  nově hlídá, že rodina v Glottologu je), sjednoceno **drávidská** (rodina i větve), **otomangueská (Mexiko)**, **mandé**
  (ne „mandejská“ – to je o Mandejcích), **na-dené** (rodina Athabaskan-Eyak-Tlingit), **ainská**, **velkoandamanská**;
  zdvojené popisky ve stromu rozlišeny („mongolská (užší)“, „japonská (užší)“, „lakotsko-dakotská“). Anglicky zůstávají
  nejisté rodiny (Teberan, Jarrakan, Coosan, Jicaquean, Gunwinyguan, Walioic, Giimbiyu, Palaihnihan). Štítky rodin na kartách
  mn, bm, zap, ain, gn sjednoceny s rodokmenem; ainština už není „izolovaný jazyk“ (Glottolog: malá ainská rodina).
- Přeložené jsou všechny větve na cestě rodokmenu u jazyků atlasu (576 názvů v `glottolog-branches.cs.json`,
  24. 9. 2026). Zbývají větve, které se objeví jen u ostatních teček nebo ve stromu, a anglická jména teček
  bez českého názvu (např. Dgèrnésiais, Jèrriais) – překládat postupně (přání uživatele).
