# Zdroje dat a licence

| Soubor | Co obsahuje | Zdroj | Licence |
| --- | --- | --- | --- |
| `glottolog.json` | 7 967 jazyků světa se souřadnicemi a rodinou (tečky na glóbu) | [Glottolog](https://glottolog.org), Hammarström, Forkel, Haspelmath, Bank; Max Planck Institute for Evolutionary Anthropology. Vyrobeno skriptem `scripts/glottolog.mjs` z `glottolog-cldf/cldf/languages.csv`. | CC BY 4.0 – **uvedení zdroje je povinné**, proto je v patičce stránky |
| `nareci.json` | jména 13 706 nářečí u 3 122 jazyků (na kartě jazyka a v hledání) | [Glottolog](https://glottolog.org) `languages.csv` (úroveň „dialect“), vyrábí `scripts/nareci.mjs`; české názvy nářečí češtiny v `nareci-cs.json` jsou vlastní práce | CC BY 4.0 |
| `podrobnosti.json` | podrobnosti k tečkám (vyrábí `scripts/podrobnosti.mjs`) | viz řádky níže | podle jednotlivých zdrojů |
| ↳ vitalita, popsanost, příbuzenstvo, státy, nářečí | vitalita jazyka (AES = šestistupňová stupnice UNESCO, Moseley 2010; „probouzený“ podle komentáře Awakening/Reawakening z ElCat a Ethnologue), nejpodrobnější popis (MED), klasifikace | [Glottolog](https://glottolog.org) `glottolog-cldf/cldf/values.csv`, `languages.csv` | CC BY 4.0 |
| ↳ typologie (mapy a karta) | 24 vlastností: 1A, 2A, 12A, 13A, 19A, 26A, 30A, 49A, 37A, 38A, 81A, 83A, 85A, 86A, 87A, 88A, 98A, 112A, 116A, 129A, 130A, 131A, 133A, 138A (výběr a texty v `data/typologie-popis.json`, data `scripts/typologie.mjs` → `data/typologie.json`; autor kapitoly se uvádí v legendě) | [WALS Online](https://wals.info), Dryer & Haspelmath (eds.) 2013, Max Planck Institute for Evolutionary Anthropology; `cldf-datasets/wals` | CC BY 4.0 |
| ↳ počet hlásek | souhlásky, samohlásky, tóny (medián přes zdroje v databázi) | [PHOIBLE 2.0](https://phoible.org), Moran & McCloy (eds.) 2019; `cldf-datasets/phoible` | **CC BY-SA 3.0** – odvozená čísla se šíří pod stejnou licencí |
| ↳ ukázka textu | článek 1 Všeobecné deklarace lidských práv | [UDHR in Unicode](https://www.unicode.org/udhr/) přes balíček [`udhr`](https://github.com/wooorm/udhr); texty OHCHR | balíček MIT; jen hotové překlady (stupeň 4) |
| ↳ odhad počtu uživatelů, české názvy jazyků, písmo, úřední status | součet obyvatel států × podíl uživatelů jazyka; názvy jazyků; písma jazyka (`languageData`, `likelySubtags`, bez vedlejších a vyřazených písem podle `scriptMetadata`) a jejich české a anglické názvy; úřední status ve státech (`territoryInfo`: úřední, de facto, regionální) | [Unicode CLDR](https://cldr.unicode.org) 48 (`cldr-core`, `cldr-localenames-full`) | Unicode License |
| ↳ počty mluvčích, české názvy, články na Wikipedii | počet mluvčích (P1098) s rokem, zda jde o rodilé mluvčí, český popisek, odkaz na článek | [Wikidata](https://www.wikidata.org) – `data/wikidata.json`, stahuje `scripts/wikidata.mjs` v GitHub Actions jednou měsíčně | CC0 (volné dílo) |
| ↳ názvy států, převod kódů | ISO 3166 česky/anglicky, číselný kód státu na mapě → dvoupísmenný (`mapaStatu`), ISO 639-1 → 639-3 | [`i18n-iso-countries`](https://github.com/michaelwittig/node-i18n-iso-countries), [`iso-639-3`](https://github.com/wooorm/iso-639-3) | MIT |
| `countries-110m.json` | hranice států a pevnina | [world-atlas](https://github.com/topojson/world-atlas) z dat [Natural Earth](https://www.naturalearthdata.com) | ISC; Natural Earth je volné dílo |
| `languages.json` | 163 jazyků s pozdravem, výslovností, zajímavostí a areálem | vlastní práce tohoto projektu | – |
| `country-names.json` | české a anglické názvy států | vlastní práce | – |
| `iso639.json` | převod kódů ISO 639-1 → 639-3 pro propojení s Glottologem | vlastní práce | – |
| `starovek.json` + `static/starovek/<id>/` | stránky o civilizacích starověku (Sumer a Akkad, Egypt, Indie, Chetité, Čína, Féničané, Hebrejci a Aramejci, Řecko, Keltové, Etruskové, Persie, Řím, Arméni a Gruzínci, Germáni, Aksum, Slované, Mayové; přehledy Rodokmen písem a Slovníček pojmů): texty, ukázky znaků, časová osa, fotografie | texty vlastní práce podle literatury uvedené na stránce, ověřené proti odborným zdrojům; fotografie z [Wikimedia Commons](https://commons.wikimedia.org) (stahuje `scripts/fotky.mjs` v GitHub Actions, u každé autor, licence a odkaz); ilustrace vlastní (`src/akvarely.js`, druhy `mezopotamie`, `egypt`, `chattusa`, `fenicie`, `akropole`, `maya`, `forum`, `etrurie`, `sang`, `sanci`, `persepolis`, `aksum`, `pisarna`, `oppidum`, `runy`, `hradiste`, `kumran`, `klaster`); písma [Noto Sans Cuneiform, Anatolian Hieroglyphs, Egyptian Hieroglyphs, Coptic, Phoenician, Ugaritic, Linear B, Mayan Numerals, Old Italic, Brahmi, Kharoshthi, Old Persian, Avestan, Inscriptional Pahlavi, Imperial Aramaic, Old South Arabian, Serif Devanagari, Serif Ethiopic, Serif TC, Runic, Gothic, Ogham, Glagolitic, Serif Hebrew, Syriac, Nabataean, Palmyrene, Samaritan, Naskh Arabic, Serif Armenian, Serif Georgian, Serif Tibetan a Serif Tamil](https://fonts.google.com/noto) | texty a ilustrace atlasu; fotky CC BY / CC BY-SA / CC0 / volné dílo – **uvedení autora a licence je povinné**, proto je u každé fotky; písma SIL OFL |

Knihovny ve `vendor/` jsou vložené přímo do stránky (stránka nesmí záviset na CDN):
[d3-array a d3-geo](https://d3js.org) (ISC), [topojson-client](https://github.com/topojson/topojson-client) (ISC).

## Úpravy oproti zdrojům

- `polohy-opravy.json`: úpravy poloh teček. Esperanto, interlingua a interslovanština jsou mezinárodní
  pomocné jazyky bez domovského území, proto na glóbu tečku nemají (Glottolog jim ji dává, esperantu dokonce
  ve Francii se zemí Polsko). V seznamu a hledání zůstávají.

## Co je odhad

- **Jazykové areály** (`areal` v `languages.json`) jsou ručně zakreslené přibližné oblasti, ne měření.
  Otevřená data s polygony jazyků ve světovém měřítku neexistují.
- **Počty mluvčích** u 163 jazyků atlasu jsou zaokrouhlené odhady (rodilí i ti, kdo se jazyk naučili).
- **Písmo a úřední status** (Unicode CLDR) jsou u 773 a 210 jazyků. Makrojazyk CLDR (arabština, čínština, perština…)
  patří k tečce jazyka, který za něj CLDR uvádí (standardní arabština, mandarínština, západní perština). Úřední status
  CLDR sleduje jen u části jazyků, u menšinových jazyků tedy často chybí i tam, kde nějaké úřední postavení mají.
- **Odhad písma** (`r[15]`, 26. 9. 2026) je u dalších 5 984 jazyků, o kterých CLDR nevede `languageData`: „pravděpodobné
  písmo“ z `likelySubtags` (CLDR ho přebírá z langtags SIL; písmo, kterým se jazyk zapisuje, pokud se zapisuje). Slouží jen
  mapě písem (Zobrazení › Písmo) a karta tečky ho ukazuje výslovně jako odhad. Skupiny mapy: latinka (Latn, Latf), cyrilice,
  arabské písmo (Arab, Aran), bráhmská písma (dévanágarí, bengálské … thajské, barmské, tibetské, jávské, tai…; výčet
  `SKUPINY_PISEM` v app.js), čínské znaky s kanou a bopomofem (Hani, Hans, Hant, Jpan, Kana, Hira, Bopo) a ostatní
  (mj. etiopské, hebrejské, řecké, gruzínské, arménské, korejské, yiské, kanadské slabičné). Rozhoduje první (nejběžnější)
  písmo. Znakové jazyky se nepočítají. Sporně zařazená písma (kayah li, sorang sompeng, ol čiki, meitei mayek) jsou
  v ostatních, ne v bráhmských.
  Srbština a chorvatština nemají v rejstříku vlastní tečku, údaj mají podle kódu jazyka (`atlasCldr`).
- **Počty uživatelů** u teček jsou odhad z Unicode CLDR (zaokrouhleno na dvě platné číslice), jen u 649 jazyků.
  Balíček `speakers` z npm jsem zamítl: neuvádí, odkud čísla bere.
- **Počty mluvčích z Wikidat** mají přednost před odhadem CLDR. Z více výroků se bere „preferovaný“,
  pak údaj o rodilých mluvčích, pak nejnovější; zastaralé a „jen druhý jazyk“ se vynechávají.
