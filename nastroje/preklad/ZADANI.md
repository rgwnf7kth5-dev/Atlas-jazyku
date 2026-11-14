# Překlad do čínštiny (zjednodušené znaky) – etapa 2 Atlasu jazyků

Web Atlas jazyků má čínskou verzi thelanguageatlas.com/zh/ pro čtenáře z pevninské Číny a Singapuru (zjednodušené znaky,
spisovná čínština). Rozhraní a karty jazyků už čínsky jsou. Teď se překládají delší texty: stránky o starověkých civilizacích
a Příběhy jazyků, putování jazyků, cesty slov, Jazyk dne, popisy písem, typologie (WALS) a vymyšlené jazyky.
Čtenáři: vysokoškoláci, učitelé, dospělí, odborníci – tón věcný, encyklopedický (百科 / kvalitní populárně-naučná kniha).

Složka: `/tmp/claude-0/-home-user/cab2e3aa-1a7f-5c6b-9270-6a90a0a9d3ec/scratchpad/zh2/`

## Vstup a výstup
- Vstup `src/<dávka>.json`: `{"klíč": anglický originál}` (text, nebo celý objekt – stránka s oddíly).
- Výstup `out/<dávka>.json`: **stejné klíče, stejná struktura**, jen texty čínsky. Názvy polí (`nazev`, `p`, `h`, `typ`…) neměnit.
- Velkou dávku piš po částech (`out/<dávka>.part1.json`…), na konci je slouč skriptem do `out/<dávka>.json` a části smaž.
- Kontrola: `cd <složka> && python3 kontrola.py <dávka>` → **0 chyb**; upozornění projdi.
- Repozitář `/home/user/atlas-jazyku` jen čti (české originály `cs` v `data/*.json` smíš použít k ověření smyslu). **Nic v něm neměň.**

## Co se nepřekládá (kopíruj beze změny)
- Pole `typ`, `f`, `siroka`, `na-vysku`, `id`, `rodic`, `civ`, `jistota`, `vynechat`, `vlastnost`; ukázky písma a přepisy
  `ukazka`, `klin` a znaky jiných písem (klínopis, hieroglyfy…). Pole `prepis` přelož jen tam, kde obsahuje popisný text
  (např. „1 over 13“), samotný přepis nech.
- Slova a věty popisovaných jazyků (latinkou psané příklady *lugal-e*, *kunnan*, *thee*) zůstávají latinkou; překládá se jen
  význam. Čínské znaky v originálu (např. 茶, 汉字, citáty z klasické čínštiny) zachovej přesně.
- Oddíl s `"vynechat": true` se nezobrazuje – **zkopíruj ho anglicky**.
- Oddíl `zdroje`: bibliografie (autor, název, nakladatel, rok, URL) v originále; přelož jen spojovací slova. Čínské publikace,
  pokud jsou v originálu, uveď v čínské podobě, jestli ji spolehlivě znáš.

## Čínština
- Zjednodušené znaky, plnošířková interpunkce （，。：；？！“”《》、）, názvy děl v 《》. **Obsah a fakta se nemění** – nic
  nepřidávat ani nevypouštět; když najdeš pravděpodobnou chybu v originálu, napiš ji do zprávy a text nech.
- Data: BCE = 公元前, CE = 公元 (jen kde to originál má nebo kde je to v čínštině nutné pro jednoznačnost), c. = 约 / 大约,
  „7th century BCE“ = 公元前7世纪, „1st millennium BCE“ = 公元前1千纪. Velká čísla po 万/亿 (约2000万人).
- **Názvy jazyků, rodin, větví, států a písem podle `glosar.json`** (to, co atlas už používá). Co v něm není, podle čínské
  Wikipedie (zh-cn) a 新华社译名; u méně známých jmen při prvním výskytu latinka v závorce: 商博良（Champollion）.
- Termíny lingvistiky a dějin podle zavedeného čínského úzu: 楔形文字、象形文字、字母、辅音音素文字、元音附标文字、
  印欧语系、甲骨文、金文、小篆、隶书、楷书、《切韵》、中古汉语、上古汉语、训民正音、假名、万叶假名、汉文训读…
- Stránky o Číně, Japonsku a Koreji a putování týkající se Číny čte čínský čtenář s vlastními znalostmi: čínské reálie (dynastie,
  osobnosti, díla, místa) piš zavedenými čínskými tvary, citované čínské texty v originálním znění (jen když si jsi jistý/á).
- Pojmy rozhraní a názvy vymyšlených jazyků: `glosar.json` → `pojmy_rozhrani`.
- Neutrálně u politicky citlivých míst (Tchaj-wan = 台湾, Tibet, Sin-ťiang, Západní Sahara 西撒哈拉): překládej věrně originál,
  nic neměň, nepřidávej ani neubírej.

## Závěrečná zpráva (česky, krátce)
Počet klíčů, výsledek `kontrola.py`, sporné termíny, podezření na věcné chyby v originálu.
