# Zdroje dat a licence

| Soubor | Co obsahuje | Zdroj | Licence |
| --- | --- | --- | --- |
| `glottolog.json` | 7 967 jazyků světa se souřadnicemi a rodinou (tečky na glóbu) | [Glottolog](https://glottolog.org), Hammarström, Forkel, Haspelmath, Bank; Max Planck Institute for Evolutionary Anthropology. Vyrobeno skriptem `scripts/glottolog.mjs` z `glottolog-cldf/cldf/languages.csv`. | CC BY 4.0 – **uvedení zdroje je povinné**, proto je v patičce stránky |
| `podrobnosti.json` | podrobnosti k tečkám (vyrábí `scripts/podrobnosti.mjs`) | viz řádky níže | podle jednotlivých zdrojů |
| ↳ ohrožení, popsanost, příbuzenstvo, státy, nářečí | stupeň ohrožení (AES, stupnice UNESCO), nejpodrobnější popis (MED), klasifikace | [Glottolog](https://glottolog.org) `glottolog-cldf/cldf/values.csv`, `languages.csv` | CC BY 4.0 |
| ↳ stavba jazyka | pořadí slov (81A), tóny (13A), čaj (138A), počítání (131A), ruka a paže (129A), barvy (133A), rody (30A), pády (49A), zvláštní hlásky (19A) | [WALS Online](https://wals.info), Dryer & Haspelmath (eds.) 2013, Max Planck Institute for Evolutionary Anthropology; `cldf-datasets/wals` | CC BY 4.0 |
| ↳ počet hlásek | souhlásky, samohlásky, tóny (medián přes zdroje v databázi) | [PHOIBLE 2.0](https://phoible.org), Moran & McCloy (eds.) 2019; `cldf-datasets/phoible` | **CC BY-SA 3.0** – odvozená čísla se šíří pod stejnou licencí |
| ↳ ukázka textu | článek 1 Všeobecné deklarace lidských práv | [UDHR in Unicode](https://www.unicode.org/udhr/) přes balíček [`udhr`](https://github.com/wooorm/udhr); texty OHCHR | balíček MIT; jen hotové překlady (stupeň 4) |
| ↳ odhad počtu uživatelů, české názvy jazyků | součet obyvatel států × podíl uživatelů jazyka; názvy jazyků | [Unicode CLDR](https://cldr.unicode.org) 48 (`cldr-core`, `cldr-localenames-full`) | Unicode License |
| ↳ názvy států, převod kódů | ISO 3166 česky/anglicky, ISO 639-1 → 639-3 | [`i18n-iso-countries`](https://github.com/michaelwittig/node-i18n-iso-countries), [`iso-639-3`](https://github.com/wooorm/iso-639-3) | MIT |
| `countries-110m.json` | hranice států a pevnina | [world-atlas](https://github.com/topojson/world-atlas) z dat [Natural Earth](https://www.naturalearthdata.com) | ISC; Natural Earth je volné dílo |
| `languages.json` | 163 jazyků s pozdravem, výslovností, zajímavostí a areálem | vlastní práce tohoto projektu | – |
| `country-names.json` | české a anglické názvy států | vlastní práce | – |
| `iso639.json` | převod kódů ISO 639-1 → 639-3 pro propojení s Glottologem | vlastní práce | – |

Knihovny ve `vendor/` jsou vložené přímo do stránky (stránka nesmí záviset na CDN):
[d3-array a d3-geo](https://d3js.org) (ISC), [topojson-client](https://github.com/topojson/topojson-client) (ISC).

## Co je odhad

- **Jazykové areály** (`areal` v `languages.json`) jsou ručně zakreslené přibližné oblasti, ne měření.
  Otevřená data s polygony jazyků ve světovém měřítku neexistují.
- **Počty mluvčích** u 163 jazyků atlasu jsou zaokrouhlené odhady (rodilí i ti, kdo se jazyk naučili).
- **Počty uživatelů** u teček jsou odhad z Unicode CLDR (zaokrouhleno na dvě platné číslice), jen u 649 jazyků.
  Balíček `speakers` z npm jsem zamítl: neuvádí, odkud čísla bere.
