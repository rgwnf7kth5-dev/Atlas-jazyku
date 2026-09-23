# Atlas jazyků / Language Atlas

Otáčivý glóbus se všemi jazyky světa, udělaný pro děti. Česky i anglicky.
Web: **https://atlasoflanguages.netlify.app** (anglicky https://atlasoflanguages.netlify.app/en/)

- **7 967 teček** – každá je jeden jazyk ze světového rejstříku [Glottolog](https://glottolog.org).
- **163 jazyků** umí pozdravit: pozdrav ve vlastním písmu, výslovnost, počet mluvčích, jazyková rodina,
  zajímavost a **jazykový areál** na mapě (ne celé státy – tibetština svítí na náhorní plošině, ne v celé Číně).
- Přiblížení kolečkem, dvěma prsty, tlačítky nebo dvojklikem. Po výběru jazyka se glóbus sám přiblíží.
- Pozdrav si lze poslechnout hlasem z vlastního zařízení; když ho zařízení nemá, přečte se výslovnost.
- Přepínače: **vitalita jazyka** podle šestistupňové stupnice UNESCO (+ probouzené jazyky), **znakové jazyky**
  (všechny / bez nich / jen ony), jména u teček, samo-otáčení, denní a noční vzhled (podle počítače).

## Otevření

Stačí otevřít `dist/index.html` (česky) nebo `dist/en/index.html` (anglicky) v prohlížeči.
Stránka nic nestahuje z cizích serverů kromě písem Google Fonts (bez nich funguje taky).

## Web (Netlify)

Netlify si stránku sestaví sám podle `netlify.toml`: spustí `npm run check` a zveřejní složku `dist/`.
Česká verze je na hlavní adrese https://atlasoflanguages.netlify.app, anglická na `/en/`.
Každý push do větve `main` web obnoví.

## Úpravy

Potřeba je jen [Node.js](https://nodejs.org) 22 nebo novější, žádné další balíčky.

```
npm run check      # kontrola dat + sestavení obou verzí do dist/
npm run validate   # jen kontrola dat
npm run glottolog  # znovu stáhne a zpracuje Glottolog
```

| Co chci změnit | Kde |
| --- | --- |
| jazyk, pozdrav, zajímavost, areál | `data/languages.json` (každý jazyk má část `cs` a `en`) |
| texty rozhraní | `src/ui/cs.json`, `src/ui/en.json` |
| vzhled | `src/styles.css` |
| chování glóbu | `src/app.js` |
| rozložení stránky | `src/body.html` |

Zdroje dat a licence jsou v [`data/ZDROJE.md`](data/ZDROJE.md).
