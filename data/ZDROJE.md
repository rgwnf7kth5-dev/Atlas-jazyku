# Zdroje dat a licence

| Soubor | Co obsahuje | Zdroj | Licence |
| --- | --- | --- | --- |
| `glottolog.json` | 7 967 jazyků světa se souřadnicemi a rodinou (tečky na glóbu) | [Glottolog](https://glottolog.org), Hammarström, Forkel, Haspelmath, Bank; Max Planck Institute for Evolutionary Anthropology. Vyrobeno skriptem `scripts/glottolog.mjs` z `glottolog-cldf/cldf/languages.csv`. | CC BY 4.0 – **uvedení zdroje je povinné**, proto je v patičce stránky |
| `countries-110m.json` | hranice států a pevnina | [world-atlas](https://github.com/topojson/world-atlas) z dat [Natural Earth](https://www.naturalearthdata.com) | ISC; Natural Earth je volné dílo |
| `languages.json` | 163 jazyků s pozdravem, výslovností, zajímavostí a areálem | vlastní práce tohoto projektu | – |
| `country-names.json` | české a anglické názvy států | vlastní práce | – |
| `iso639.json` | převod kódů ISO 639-1 → 639-3 pro propojení s Glottologem | vlastní práce | – |

Knihovny ve `vendor/` jsou vložené přímo do stránky (stránka nesmí záviset na CDN):
[d3-array a d3-geo](https://d3js.org) (ISC), [topojson-client](https://github.com/topojson/topojson-client) (ISC).

## Co je odhad

- **Jazykové areály** (`areal` v `languages.json`) jsou ručně zakreslené přibližné oblasti, ne měření.
  Otevřená data s polygony jazyků ve světovém měřítku neexistují.
- **Počty mluvčích** jsou zaokrouhlené odhady (rodilí i ti, kdo se jazyk naučili).
