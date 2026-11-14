# Nezávislá kontrola čínského překladu – etapa 2 Atlasu jazyků

Překlad dělal jiný model podle `ZADANI.md` (přečti ho – platí stejná pravidla). Ty ho kontroluješ jako zkušený redaktor
populárně-naučných a encyklopedických textů z pevninské Číny (zjednodušené znaky) a zároveň jako ověřovatel faktů. Složka:
`/tmp/claude-0/-home-user/cab2e3aa-1a7f-5c6b-9270-6a90a0a9d3ec/scratchpad/zh2/`

- Originál: `src/<dávka>.json` (angličtina). Překlad: `out/<dávka>.json` (stejné klíče).
- **Nic needituj přímo.** Opravy zapiš do `kontrola/k-<dávka>.json` jako seznam:
  `[{"davka": "z05", "klic": "<klíč ze souboru>", "stare": "<přesný úsek čínského textu>", "nove": "<oprava>", "proc": "<krátce česky>"}]`
  `stare` musí být úsek, který se mezi texty pod tím klíčem vyskytuje **právě jednou** (u celé stránky je pod klíčem celý
  objekt stránky, takže vezmi dost dlouhý úsek). Ověř: `python3 oprava.py kontrola/k-<dávka>.json --zkus` → „chyb 0“.
- Repozitář `/home/user/atlas-jazyku` jen čti.

## Co hledat (v tomto pořadí důležitosti)

1. **Věrnost:** posunutý nebo opačný smysl, vynechaná nebo přidaná věta či údaj, změněné číslo, datum, jméno, jednotka,
   zaměněné 公元前/公元, tisíciletí × století. Porovnávej odstavec po odstavci s angličtinou. Oddíly `"vynechat": true`
   zůstávají anglicky – to je správně.
2. **Fakta:** když je chyba už v anglickém originálu (ověř – WebSearch, zh/en Wikipedie), **v čínštině ji neopravuj**,
   jen ji napiš do závěrečné zprávy se zdrojem; opravím ji ve všech jazycích naráz.
3. **Čínština:** gramatika, kolokace, slovosled, přirozenost (čtenář nesmí cítit překlad z angličtiny – žádné řetězy 的,
   zbytečné 被, kalky „作为…的一个…“), registr encyklopedie, plnošířková interpunkce, 《》 u děl, 、 ve výčtech,
   čísla po 万/亿, žádné tradiční znaky (kromě citací a ukázek, kde jde právě o ně).
4. **Termíny a jména:** zavedený úzus (zh.wikipedia zh-cn, 新华社译名, čínská lingvistika a sinologie); názvy jazyků,
   rodin a států podle `glosar.json`. Čínské reálie (dynastie, osobnosti, díla, místa, citáty klasických textů) musí být
   ve standardní čínské podobě – pozor na zpětné překlady z angličtiny (např. jméno díla, které má zavedený čínský název).
   Jednotnost v celé dávce.
5. **Neutralita** u politicky citlivých míst: věrně podle originálu, nic nepřidáno ani neubráno.

Neopravuj vkus: když je čínská věta správná a přirozená, nech ji, i když bys ji napsal/a jinak.

## Závěrečná zpráva (česky, krátce)

Počet oprav podle druhu, nejzávažnější nálezy, podezření na věcné chyby v originálu (se zdrojem), výsledek `oprava.py --zkus`.
