# Atlas jazyků – předání do nového chatu (stav 14. 11. 2026)

Vlož tenhle soubor (nebo odkaz na něj) na začátek nového chatu. Podrobnosti o všem jsou v `CLAUDE.md` – nový chat ho načte sám,
tady je jen to nejdůležitější a co je rozdělané.

## Kdo, kde, jak

- Komunikace **česky**. Uživatel (Tomáš Kubín) není programátor, pracuje na Macu a iPhonu – vysvětlovat jednoduše.
- Repozitář `rgwnf7kth5-dev/Atlas-jazyku`, pracovní větev **`redesign-encyklopedie`**.
- **Nasazení** = push do `redesign-encyklopedie` a hned fast-forward `main` (`git push origin redesign-encyklopedie:main`).
  Netlify staví z `main` (`npm run check`), `dist/` je v gitu. Neověřený obsah jen do `redesign-encyklopedie` (nebo jako `koncept`).
- Po každé viditelné změně: `npm run build -- --artefakt build` a znovu zveřejnit oba artefakty (jen cs a en):
  - česky https://claude.ai/artifact/Hn5yzLvaVWXqFgaanUUdmn ← `build/atlas-jazyku.html` (naposledy verze 137)
  - anglicky https://claude.ai/artifact/1XdgMqQZJJnJku4anjxqwC ← `build/language-atlas.html` (verze 135)
- Před commitem vždy `npm run check` (0 chyb). Commit končí řádky `Co-Authored-By: …` a `Claude-Session: …` podle systémové připomínky.
  Hook na konci vyžaduje commit a push.
- Web: atlasjazyku.cz (cs), thelanguageatlas.com (en a /it/, /de/, /fr/, /he/, /zh/).

## Pravidla, která uživatel výslovně chce

- Obsah je **encyklopedický pro studenty a výš** – věcně, doloženě, bez zvolání a dětských prvků.
- **Každý nový text projde nezávislou kontrolou faktů** (samostatný agent proti zdrojům), pak teprve na web. Sporné výklady označit jako sporné.
- Neutralita u citlivých témat (Tchaj-wan, Tibet, menšiny, Krym – hranice podle mezinárodního práva v `scripts/hranice.mjs`).
- Testovat v Playwrightu (Chromium je předinstalované v `/opt/pw-browsers`, nespouštět `playwright install`).
- **Bezpečnost:** API klíč (`ANTHROPIC_API_KEY`) je jen v nastavení Netlify – nikdy ho nežádat, nepsat do chatu, kódu ani gitu.
  Uživatel rotaci klíče odmítl. E-mail uživatele nikam neposílat.

## Stav (14. 11. 2026)

- **7 jazyků webu:** cs, en, it, de, fr, he (zprava doleva), zh (zjednodušené znaky). Všechny přeložené celé – rozhraní, 164 karet,
  29–31 stránek Jazyků starověku a Příběhů, 18 putování, cesty slov, Jazyk dne, písma, typologie WALS, vymyšlené jazyky.
- **Naposledy hotovo (8.–14. 11.):**
  - čínská etapa 2 (14 překladatelů + 10 kontrol, ~310 oprav);
  - **putování čínštiny** v 9 etapách, ve všech 7 jazycích (`#putovani-cinstina` / `#journey-chinese`);
  - 10 věcných oprav originálu ve všech jazycích (věštebné kosti, 甲骨文 od 1921, coffee 1598, čaj 1607 jako tradice, Behistun u Elamu,
    Hašimoto/Arisaka a osm samohlásek, etruská zrcadla přes 3 000, čchinská sekera ke z Pchjongjangu, Chammurapi 1901–1902, Hebrejci);
  - oprava CSS: barvy putování němčiny a španělštiny a celá denní sada barev se od 25. 10. zahazovaly; validace teď hlídá závorky.
- Nástroje pro překlad a putování jsou nově v `nastroje/` (viz `nastroje/README.md`) – dřív ležely jen v dočasné složce.

## Rozdělané / k ověření

1. **Ethnologue přímo:** počty mluvčích čínských jazyků v putování čínštiny (1,3–1,4 miliardy; mandarínština 940–990 milionů)
   jsou jen přes Wikipedii – ethnologue.com odsud vracelo 403. Až to půjde, ověřit.
2. Čínská jména badatelů v zh verzi putování čínštiny: 范德瑞姆 (van Driem), 高奕睿 (Galambos) – ověřit ustálený tvar.
3. Nápady uživatele **na později, ne teď:** varianta pro děti. Zamítnuté věci (hra „Kde se tak mluví?“, sbírka pozdravů, 3D rodokmen,
   „myšlenková mapa“ rodin…) jsou v `CLAUDE.md` – nenavrhovat znovu.

## Jak začít nový chat

Napiš třeba: „Pokračujeme na Atlasu jazyků, přečti si NOVY-CHAT.md a CLAUDE.md.“ a pak, co chceš dělat.
