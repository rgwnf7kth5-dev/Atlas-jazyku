# Atlas jazyků – pokyny pro Claude Code

Otáčivý glóbus se všemi jazyky světa pro děti, česky a anglicky. Komunikuj česky.
Uživatel není programátor a pracuje na Macu (a iPhonu), ne na Windows: vysvětluj jednoduše a když něco chybí, řekni přesně co a odkud nainstalovat.

## Příkazy

```
npm run check      # validace + sestavení; spusť vždy před commitem
npm run build -- --artefakt build   # navíc fragmenty pro publikování jako artefakt (ODKAZ_CS, ODKAZ_EN)
```

## Web

**Domény (25. 9. 2026):** `atlasjazyku.cz` (česky; registrace a DNS u Českého hostingu, záznamy A na Netlify
`75.2.60.5`, AAAA smazané) a `thelanguageatlas.com` (anglicky; koupená v Netlify, Netlify DNS, primary domain).
Jeden web, obě domény v Netlify → Domain management. **Kterou verzi dostane která doména, rozhoduje edge funkce
`netlify/edge-functions/domeny.js`** (thelanguageatlas.com → `dist/en/` z kořene, společné `/js`, `/malby`, ikony a náhledy
z kořene; `www.atlasjazyku.cz` → `atlasjazyku.cz`). Pravidla s doménou ve `from` v `netlify.toml` Netlify u tohoto webu
nepoužíval – 25. 9. 2026 vracela anglická doména českou stránku. Živý web jde zvenku prověřit workflow
`.github/workflows/diagnoza-webu.yml` (Actions → Diagnóza webu → Run workflow; spouští se i po změně `netlify.toml`
nebo `netlify/`): přesměrování, certifikáty, DNS, značky og: a obrázek náhledu. **25. 9. 2026 neměla `atlasjazyku.cz`
ani `www` platný certifikát** (Netlify posílal `*.netlify.app`), X ani Facebook ji proto nenačetly.
**Adresy v buildu jsou od 25. 9. 2026 na nových doménách** (`DOMENA`, `WEB(cesta)` v build.mjs; Facebook ukazoval
odkaz bez obrázku, protože og:url mířil na netlify.app): canonical, og:url, og:image a hreflang každé stránky míří na
její doménu, anglické bez `/en/`. Každá doména má vlastní `robots.txt` a `sitemap.xml` (anglické v `dist/en/`).
`atlasoflanguages.netlify.app` zatím nepřesměrovává (dokud `atlasjazyku.cz` nemá certifikát, rozbilo by to web). Odkaz na druhou jazykovou verzi
vede na vlastních doménách na druhou doménu (`korenVerze` v app.js, statické stránky přes `WEB`) a přepnutí na místě
tam nemění adresu. Zbývá: Google Search Console pro obě domény.

Anglický název je **The Language Atlas** (podle domény, 25. 9. 2026). Web dosud běží i na **https://atlasoflanguages.netlify.app** (anglicky `/en/`).
Nasazení přes Netlify z větve `main` podle `netlify.toml` (build `npm run check`, publikuje `dist/`).
Z prostředí Claude Code na webu je `*.netlify.app` blokované (curl i WebFetch vrací 403), živý web tedy odsud
zkontrolovat nejde – ověřuj `dist/` v Playwrightu a živý web workflow Diagnóza webu (viz výš).
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
- **Patička seznamu je sbalená** do jednoho řádku „O atlasu, zdroje, kontakt, návod a kalendář“ (`<details class="pat-det">`, uživatel
  25. 9. 2026: „zabírá zbytečně moc místa, musí se schovávat“). Rozbalí se kontakt, O datech, Jazyky s pozdravem a zdroje.
- Zpětná vazba e-mailem na **info@atlasjazyku.cz** (přesměrovaná na autora; 25. 9. 2026 místo dřívější soukromé adresy,
  kterou uživatel smazal – soukromou adresu na web nedávat). Řádek je v patičce seznamu i na statických stránkách,
  předmět podle jazyka, v artefaktu se odkaz otevírá v novém okně. Klíče `zpetna…` v `src/ui/*.json`.
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
  Dokud je podstránka otevřená, tečky mají **barvu podle vitality**, rozlišenou podle významu (25. 9. 2026 na přání
  uživatele „výrazněji odlišit“ – jednobarevná oranžová stupnice na malých tečkách splývala): bezpečný **modře**,
  čtyři stupně ohrožení **teplou stupnicí** zlatá → oranžová → červená → vínová (validátor palet `--ordinal` na
  pevnině `--souse-vit`, v noci i ve dne; rozptyl odstínu do 40°), vymřelý **šedě** (v noci bledě, ve dne tmavě),
  probouzený **zeleně** (fialová splývala s modrou při deuteranopii), bez údaje světle/tmavě šedě. Sousední dvojice
  v legendě prošly kontrolou CVD. `--vit-0`…`--vit-6`, `--vit-nic`. Neměnit bez nového ověření.
  Vitalita je na kartě tečky i na kartě jazyka z atlasu (`oddilVitality`).
  **Tlačítko „Vitalita“ v liště** (25. 9. 2026, návrh schválený uživatelem místo barev vitality rovnou po otevření):
  zapne barvy vitality natrvalo (`vitalitaZap`, pamatuje se `atlas-barvy-vitality`) a nad lištou ukáže vysvětlivku
  stupňů `#vit-legenda` (bezpečný → vymřelý, probouzený, bez údaje) – jen dokud jsou barvy zapnuté, jinak žádná
  vysvětlivka na glóbu (to uživatel nechce). Klepnutí na vysvětlivku otevře stupně (filtr). Podstránka otevřená z vysvětlivky
  se zavře šipkou zpět i křížkem rovnou celá (`vitalitaZLegendy`); křížek `#vitalita-x` je v podstránce vždy. Barvy rovnou po otevření
  nedoporučeno: bez vysvětlivky nic neříkají, pevnina přijde o reliéf, noc o třpyt a oranžové území by splývalo.
  Lišta s tlačítkem Vitalita je širší: do 700 px a v užší scéně na počítači (`@container scena`, do 820 px) má
  tlačítka jen ikony, do 480 px schovává i + a − (zoom dvěma prsty).
- **Odkaz na jazyk**: `#cs` (id jazyka z atlasu) nebo `#corn1251` (glottocode tečky, build ho dává do `REJSTRIK.g`).
  Výběr zapíše adresu (`history.replaceState`), otevření odkazu jazyk vybere; když ho schovává filtr, filtry se zruší.
  Tlačítko s řetízkem na kartě odkaz zkopíruje (v artefaktu je skryté).
- **Klik na zemi** stát hned podbarví, rozsvítí jeho jazyky (příznak 5) a ukáže počet všech jazyků státu z rejstříku
  (Glottolog `Countries`; převod názvu státu z mapy na kód je `mapaStatu` v `podrobnosti.json`); zavřením okna vše zhasne.
  Kosovo, Severní Kypr a Somaliland kód nemají – ukáže se jen seznam jazyků z atlasu.
- Náhled pro sdílení odkazu (og:image) je `static/nahled-cs.jpg` / `nahled-en.jpg`, ikonka `static/favicon.svg`
  (vkládá se do stránky) a `apple-touch-icon.png`. Build kopíruje `static/` do `dist/`. Obrázky vyrábí
  `scripts/nahledy.mjs` (potřebuje Playwright) – po větší změně vzhledu je vyrob znovu. V `og:image` je soubor s otiskem obsahu
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
- Od vybraného jazyka vedou světelné oblouky k nejbližším příbuzným (nejvýš 6, podle nejhlubšího společného
  předka ve stromu Glottologu). U jazyka z atlasu jen k jiným jazykům atlasu, karta je vypisuje.

## Rozhraní (grafické vylepšení 23. 9. 2026, uživatel schválil všech 7 bodů)

- **Lišta dole na glóbu** (`.dok`): Náhodný jazyk (hlavní tlačítko), Celý svět (jen když je něco vybrané), zoom
  a „Zobrazení“. Pod tím je **panel Zobrazení** (`#panel-zobrazeni`): otáčení, jména, znakové jazyky a řádek
  Vitalita, který otevře podstránku se stupni (šipka Zpět, Escape zavře napřed ji, pak panel). Odznak na
  tlačítku Zobrazení ukazuje počet zapnutých filtrů. Vpravo nahoře je jen otazník s nápovědou.
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
- **Rodokmen** (tlačítko v liště, 24. 9. 2026): místo glóbu se na plátně `#strom` ukáže strom jedné rodiny
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
- Pořád platí: žádný satelit, prstenec, rohy zaměřovače ani sbírka pozdravů.
- **Přehled všech rodin nad rodokmenem – odloženo** (24. 9. 2026). Kruhová „myšlenková mapa“ (rodiny v bublinách
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
  seznam, lišta, srovnání, klávesnice, další; tajemství jen naznačit, hesla neprozrazovat), odkaz v patičce „O atlasu…“
  a jako **čtvrtý řádek nápovědy pod otazníkem** – není to krok: nápověda zmizí po třech krocích jako dřív
  (`li[data-krok]`). Návod má i oddíl o sbalené patičce (kalendář, O datech, Jazyky s pozdravem, kontakt, zdroje) – při změně patičky ho upravit. Odkaz `#navod` / `#guide`, statická stránka `/navod/` a `/en/guide/`. Při změně ovládání návod upravit.
- **Seznam z klávesnice**: do seznamu se vstoupí jedním Tabem (jedna dlaždice má `tabindex=0`), šipky
  vlevo/vpravo o dlaždici, nahoru/dolů o řádek (nejbližší dlaždice), Home/End, PageUp/PageDown o 10 řádků;
  další Tab seznam opustí. Při pohybu ke konci se dokreslí další dávka. Nadpisy skupin jsou `h2`.

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

Zajímavosti jsou pro děti, ale musí být pravdivé. 22. 9. 2026 opraveno 19 nepřesností (např. zulská
odpověď na pozdrav je „Ngikhona“, ne „shiboka“; „mrož“ není z nizozemštiny). Novou zajímavost ověř.

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
  `hlinenaMesita`, `dhau`, `piroga`, `kapskyStit`). Hotová i Amerika (17; `lamy`, `bizoni`, `tipi`, `agave`, `araukarie`, `misie`). Hotová i Oceánie (10). **Všech 163 jazyků má vlastní krajinu**
  (163 druhů). Nový jazyk atlasu potřebuje vlastní druh, ne sdílený.
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
- Glóbus se na počítači vejde nad lištu (`stredY`, rezerva výšky `#dok`); dřív ho lišta zakrývala.
- **Glóbus se vznáší nad hladkou plochou a vrhá měkký stín** (uživatel 25. 9. 2026 ze dvou náhledů: „stín – bez mřížky“;
  mřížku ubíhající k obzoru nechtěl). `kresliPlochu` v app.js kreslí do zásoby s koulí: na počítači plochu od obzoru
  (0,55 r pod středem) dolů s přechodem `--podlaha`, na telefonu jen stín (úzké plátno by z plochy
  udělalo šedý obdélník); stín je zploštělý kruhový přechod 1,14 r pod středem. Při přiblížení nad 1,5× zmizí.
  Kvůli místu na stín je koule menší (`polomerZaklad` = výška / 2,26) a posunutá výš.
- Klik na zemi ji jedním kliknutím podbarví a rozsvítí její jazyky (příznak 5); tlačítko „Zvýraznit na glóbu“
  zmizelo, protože po kliknutí už nic viditelného nedělalo. Zavřením okna zvýraznění zmizí.
- Brána do jiných světů má i ve dne tmavé hvězdné nebe (`.scena.rezim-brana` přepíná textové barvy na noční).
- Přeložené jsou všechny větve na cestě rodokmenu u jazyků atlasu (576 názvů v `glottolog-branches.cs.json`,
  24. 9. 2026). Zbývají větve, které se objeví jen u ostatních teček nebo ve stromu, a anglická jména teček
  bez českého názvu (např. Dgèrnésiais, Jèrriais) – překládat postupně (přání uživatele).
