# Překlad putování čínštiny – zadání

Atlas jazyků (repozitář `/home/user/atlas-jazyku`, **jen čti, nic v něm neměň**) má nové, nezávisle ověřené putování čínštiny:
`/tmp/claude-0/-home-user/cab2e3aa-1a7f-5c6b-9270-6a90a0a9d3ec/scratchpad/put-zh/cinstina-overeno.json` (texty `cs` a `en`).
Přelož ho do jednoho jazyka webu (zadaný kód `XX`). Překládej z angličtiny, českou verzi měj k ruce na smysl.

- **Výstup**: `put-zh/cinstina-XX.json` – kopie celého souboru, ve které každý objekt s klíči `cs` a `en` dostane navíc klíč `XX`
  (hned za `en`). Nic jiného neměň (geometrie, barvy, `sporna`, `po`, `zdroje` – ty jen pokud mají texty cs/en).
  `adresa` už jazyky it/de/fr má; pro he a zh doplň `adresa.XX` = `adresa.en`.
- **Věrnost**: obsah a fakta se nemění, nic nepřidávat ani neubírat; čísla, data, rozsahy, „sporné“ formulace zachovat přesně.
  Text je ověřený a pečlivě neutrální (Tchaj-wan, Hongkong, menšiny, „dialekt × jazyk“) – zachovej přesně tu míru a symetrii.
- **Styl**: jako ostatní putování v `data/putovani.json` v daném jazyce (podívej se např. na `nemcina` nebo `hebrejstina`:
  `nazev`, `podtitul`, `uvod`, `doba`, popisky). Popisky oblastí a proudů krátké – kreslí se na glóbus.
  it/de/fr: vyká se (Sie/vous), jména jazyků jako v ostatních textech (it/fr malým), pinyin pro čínská jména (Qin, Han, Beijing),
  fr století v `doba` s horním indexem (« XIIIᵉ siècle »), nezlomitelné mezery jako okolní francouzské texty.
  he: moderní izraelská hebrejština bez nikudu, jména podle he.wikipedia, latinka/čísla tak, aby se v RTL nerozsypaly.
  zh: zjednodušené znaky, plnošířková interpunkce, 《》, rozsahy let „—“; čínské reálie, osoby, díla a místa v zavedené čínské podobě
  (胡适、鲁迅《狂人日记》、注音符号、《中原音韵》、《切韵》、客家五次迁徙…), názvy jazyků a rodin podle
  `/tmp/claude-0/-home-user/cab2e3aa-1a7f-5c6b-9270-6a90a0a9d3ec/scratchpad/zh2/glosar.json`; Tchaj-wan 台湾, Mandžusko 今中国东北;
  čínské znaky, které už originál uvádí (汉语, 普通话…), nech; vysvětlivky pro cizince (např. „ (汉语, ‚jazyk Chanů‘)“) přizpůsob tak,
  aby čínskému čtenáři dávaly smysl, ale nic věcně nového nepřidávej.
- **Kontrola**: `python3 -c` – soubor se načte, počet objektů s `cs` = počet s `XX`, a geometrie je beze změny proti originálu
  (porovnej JSON po odstranění klíče `XX`).

Závěrečná zpráva česky, krátce: hotovo, sporné termíny, podezření na chyby.
