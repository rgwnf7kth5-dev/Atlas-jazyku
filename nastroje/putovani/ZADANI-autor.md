# Putování čínštiny – zadání pro autora

Atlas jazyků (repozitář `/home/user/atlas-jazyku`, **jen čti, nic v něm neměň**) má na glóbu „putování jazyků“: animovaný příběh,
jak se jazyk šířil od prajazyka po dnešek – etapy s textem, barevné oblasti („rozlité řeči“) a široké šipky (proudy). Hotových je 17
(čeština, angličtina, němčina, španělština, hebrejština…). Přibývá **putování čínštiny** (uživatel: „napřed udělej příběh čínštiny“).
Čtenáři: vysokoškoláci, učitelé, dospělí, odborníci; tón věcný, encyklopedický, bez zvolání. Data musí být doložená.

Pracovní složka: `/tmp/claude-0/-home-user/cab2e3aa-1a7f-5c6b-9270-6a90a0a9d3ec/scratchpad/put-zh/`

## Co si přečíst
- `/home/user/atlas-jazyku/CLAUDE.md`, oddíly **„Putování jazyka na glóbu“** a odstavce o jednotlivých putováních (co se při
  ověřování opravovalo – stejné chyby nedělat: neutralita, „sporné“ výklady označovat, šipky nesmí přes pevninu/moře, kde nemají).
- Vzor celého záznamu: `../put-de/nemcina.json` a poznámky `../put-de/POZNAMKY.md`; generátor `../put-de-skripty/stavba.py`
  (pomocné funkce pro oblasti, proudy a zhuštění tras po hlavní kružnici) – smíš ho zkopírovat a upravit.
- Validace: `/home/user/atlas-jazyku/scripts/validate.mjs` (část o putovani.json) – co je povinné.
- Kontrola šipek a oblastí proti pevnině: `python3 ../geo/chk.py <soubor.json> 50m` (a `10m` u úzkých průlivů).

## Výstup
1. `put-zh/cinstina.json` – jeden záznam jako v `nemcina.json`: `id` "cinstina", `atlas` "zh", `adresa` {cs: "putovani-cinstina",
   en: "journey-chinese", it: "viaggio-cinese", de: "reise-chinesisch", fr: "voyage-chinois"}, `nazev`, `podtitul`, `uvod`,
   `etapy` (každá: `id`, `doba`, `nazev`, `text`, `pohled` [délka, šířka, přiblížení], `oblasti`, `proudy`), `zdroje`.
   **Texty jen `cs` a `en`** (ostatní jazyky doplní překladatelé). Česky spisovně, vykání není potřeba; anglicky britský pravopis
   jako zbytek webu (podívej se na en texty jiných putování).
2. `put-zh/POZNAMKY.md` – jako u němčiny: nové barevné klíče, trasy, a u každé etapy klíčová tvrzení s doložením (zdroj, URL nebo
   publikace). Wikipedie jen k dohledání, ne jako jediný zdroj.

## Obsah (návrh – uprav podle zdrojů, 7–9 etap)
1. **Prasinotibetština** – rodina sinotibetská; převládající hypotéza severní Čína (střední a horní Žlutá řeka, pěstitelé prosa,
   kultury Jang-šao / Ma-ťia-jao, asi 7.–6. tisíciletí BP; Zhang et al. 2019 Nature, Sagart et al. 2019 PNAS) proti alternativám
   (jihozápad, Sečuán – van Driem) → `sporna`; šíření tibetobarmských jazyků na západ a jihozápad.
2. **Stará čínština a nápisy na věštebných kostech** (Šang, An-jang, asi 1250 př. n. l.), bronzy Čou; jazyk na střední Žluté řece.
3. **Klasická čínština a sjednocení Čchin** (období Válčících států, Konfucius; 221 př. n. l. sjednocení a malá pečetní / úřednické
   písmo; Chan – odtud „chanská“ čínština 汉语).
4. **Na jih od Jang-c'-ťiang** – stěhování obyvatel ze severu (pozdní Chan, Východní Ťin po 311, Tang, Song), vznik jižních skupin
   (wu, jüe/kantonština, min, hakka, kan, siang), střední čínština, rýmový slovník Čchie-jün 601. Formulovat opatrně, co je
   „dialekt“ a co „jazyk“ (atlas: neutrálně – lingvisticky samostatné variety, tradičně v Číně 方言).
5. **Čínské písmo a klasická čínština ve východní Asii** – Korea, Japonsko, Vietnam (sinoxenní slovní zásoba, kanbun, hanja, chữ Hán
   / chữ Nôm). Proudy přes moře jen tam, kde vedou po moři (Korejský průliv apod.).
6. **Kuan-chua – „řeč úředníků“** – severní koiné jako úřední mluva (Ming, Čching, Peking), lidová literatura.
7. **Do světa** – vystěhovalectví z Fu-ťienu a Kuang-tungu do jihovýchodní Asie (Nanyang), 19. století do Ameriky a Austrálie
   (zlatá horečka, železnice) → šipky po moři; huaqiao; jazyky diaspory byly hlavně jižní (kantonština, hokkien, hakka, teochew).
8. **Spisovný jazyk 20. století** – hnutí 4. května a paj-chua (1917–1919), kuo-jü (Čínská republika), pchu-tchung-chua (ČLR, 1955–1956),
   pinyin 1958, zjednodušené znaky (1956/1964); Tchaj-wan (kuo-jü, tradiční znaky), Singapur (kampaň Speak Mandarin 1979,
   zjednodušené znaky). Neutrálně: žádné hodnocení politiky, jen doložitelná fakta.
9. **Dnes** – počet mluvčích (mandarínština ~1 miliarda, všechny čínské jazyky ~1,3+ miliardy, zdroj a rok), úřední jazyk ČLR,
   Tchaj-wanu, Singapuru, OSN (1945/1973 v pracovních jazycích); jazyky menšin a regionální variety v tlaku pchu-tchung-chua –
   jen doložená fakta, neutrálně.

Přepis čínských jmen: **česky česká transkripce** (Čchin, Chan, Pej-ťing, Kuang-tung, Jang-c'-ťiang; pinyin v závorce u prvního
výskytu smí být), **anglicky pinyin** (Qin, Han, Beijing, Guangdong, Yangtze). Čínské znaky smíš v textu uvést (汉语, 普通话, 白话).

## Geometrie
- Oblasti: kruhy [délka, šířka, poloměr °], střed na pevnině; proudy: body [délka, šířka], **zhuštěné po hlavní kružnici** (krok ≤ 2,5°),
  pozemní trasy po souši, námořní po moři (Tchajwanský průliv, Jihočínské moře, Malakka, Pacifik: přes Havaj? jen pokud je to doložená
  trasa; jinak rovnou přes oceán, ne přes pevninu). Ověř `chk.py` – 0 nežádoucích přechodů.
- `pohled` tak, aby byla etapa na glóbu vidět (u Ameriky širší záběr).
- Barvy: existující klíče `--put-*` najdeš v `src/styles.css` (bloky s `--put-hbr`). Pro čínštinu navrhni **nové klíče** (např. `sit` –
  sinotibetská, `tb` – tibetobarmské, `och` – stará čínština, `zhn` – severní/mandarínská, `zhs` – jižní čínské jazyky, `sx` – sinosféra,
  `hq` – diaspora) a napiš do POZNAMKY, jaký mají význam; barvy dosadí koordinátor z ověřené palety. V jedné etapě nesmí mít dvě
  sousední oblasti stejnou barvu. Šipky přes oceán nesmí být modré (splývají s mořem).
- Popisky (`popisek` u oblastí a proudů) krátké – kreslí se na glóbus.

## Závěrečná zpráva
Česky, krátce: počet etap, nové barevné klíče, sporná místa, výsledek chk.py.
