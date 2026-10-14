# Atlas jazyků / The Language Atlas

Encyklopedický atlas jazyků světa na otáčivém glóbu. Čtyři jazykové verze:

| Verze | Adresa |
| --- | --- |
| česky | **https://atlasjazyku.cz** |
| anglicky | **https://thelanguageatlas.com** |
| italsky | https://thelanguageatlas.com/it/ |
| německy | https://thelanguageatlas.com/de/ |

Atlas je pro studenty a výš – pro vysokoškoláky, učitele, dospělé zájemce i odborníky. Texty jsou věcné
a doložené, odborné termíny se vysvětlují, sporné výklady se tak i označují.

## Co atlas umí

- **7 967 teček** – každá je jeden jazyk ze světového rejstříku [Glottolog](https://glottolog.org).
  Seznam má 7 970 položek (srbština, chorvatština a hmongština tečku nemají, viz stránka O datech).
- **164 jazyků má vlastní kartu**: pozdrav ve vlastním písmu, výslovnost, počet mluvčích, jazyková rodina,
  vitalita, písmo, úřední status, zajímavost a **jazykový areál** na mapě (ne celé státy – tibetština svítí
  na náhorní plošině, ne v celé Číně). Malba krajiny je u každého jazyka jiná.
- **Vitalita jazyka** podle šestistupňové stupnice UNESCO (+ probouzené jazyky), s vlastní přehledovou
  stránkou: čísla, stupně, makrooblasti, největší rodiny, metodika a zdroje.
- **Barevné mapy**: písmo a 24 typologických vlastností z [WALS](https://wals.info) v pěti oblastech
  (fonologie, morfologie, slovosled, větná stavba, slovní zásoba).
- **Rodokmen** jazykové rodiny jako plochý vějíř a **kruhový přehled** všech rodin.
- **Srovnání dvou jazyků**: příbuznost podle stromu Glottologu, stavba podle WALS, čísla.
- **Jazyky starověku** – 25 stránek o civilizacích a písmech (Chetité, Egypt, Sumer a Akkad, Mayové,
  Čína, Korea… ) včetně Rodokmenu písem a Slovníčku pojmů, s fotografiemi a ověřenými zdroji.
- **Příběhy jazyků** – 6 stránek (čaj, slova z češtiny, od latiny k románským jazykům, vracející se jazyky,
  jazykové záhady, vznik spisovné češtiny), **12 cest slov** na glóbu a **14 putování jazyků** (čeština,
  kurdština, maďarština, romština, maorština, turečtina, angličtina, navažština, jidiš, maltština,
  italština, hebrejština, aramejština a putování abecedy).
- **36 písem světa** na mapě Písmo, s kartou každého písma.
- **Jazyk dne** s odůvodněním a **kalendář 65 jazykových dnů**.
- **Chytré hledání** rozumí otázkám běžnou větou („kde se mluví persky“, „jazyky Brazílie“); čemu nerozumí,
  může položit AI, která odpovídá z dat atlasu, z jeho textů a z webu.
- Přepínače: znakové jazyky (všechny / bez nich / jen ony), jména u teček, samo-otáčení, denní a noční vzhled.
- Pozdrav si lze poslechnout hlasem ze zařízení; když ho zařízení nemá, přečte se výslovnost.

## Otevření bez internetu

Stačí otevřít `dist/index.html` (česky), `dist/en/index.html`, `dist/it/index.html` nebo `dist/de/index.html`
v prohlížeči. Stránka nic nestahuje z cizích serverů kromě písem Google Fonts (bez nich funguje taky).

## Web (Netlify)

Netlify si stránku sestaví sám podle `netlify.toml`: spustí `npm run check` a zveřejní složku `dist/`.
Každý push do větve `main` web obnoví. Kterou verzi dostane která doména, rozhoduje edge funkce
`netlify/edge-functions/domeny.js`. Když kontrola dat spadne, Netlify nový web nezveřejní – tak to má být.
Živý web jde prověřit zvenku přes Actions → **Diagnóza webu**.

## Úpravy

Potřeba je [Node.js](https://nodejs.org) 22 nebo novější. Jediný npm balíček (`@anthropic-ai/sdk`) potřebuje
jen serverová funkce pro dotazy na AI, samotné sestavení se obejde bez něj.

```
npm run check      # kontrola dat + sestavení všech verzí do dist/; spusť vždy před commitem
npm run validate   # jen kontrola dat
npm run glottolog  # znovu stáhne a zpracuje Glottolog
npm run build -- --artefakt build   # navíc fragmenty pro publikování jako artefakt (jen cs a en)
```

| Co chci změnit | Kde |
| --- | --- |
| jazyk, pozdrav, zajímavost, areál | `data/languages.json` (každý jazyk má část `cs`, `en`, `it`, `de`) |
| texty rozhraní | `src/ui/cs.json`, `src/ui/en.json`, `src/ui/it.json`, `src/ui/de.json` |
| stránky civilizací a příběhů | `data/starovek.json` |
| putování jazyků, cesty slov, písma, jazykové dny | `data/putovani.json`, `data/cesty-slov.json`, `data/pisma.json`, `data/dny-jazyku.json` |
| vzhled | `src/styles.css`, `src/starovek.css` |
| chování glóbu | `src/app.js` |
| malby krajin | `src/akvarely.js`, `data/krajiny.json` |
| rozložení stránky | `src/body.html` |

`data/*.json` je jediný zdroj pravdy, složka `dist/` se generuje – needituje se ručně.
Podrobné pokyny k projektu jsou v [`CLAUDE.md`](CLAUDE.md), zdroje dat a licence v
[`data/ZDROJE.md`](data/ZDROJE.md).
