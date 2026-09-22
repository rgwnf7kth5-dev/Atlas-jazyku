# Atlas jazyků – pokyny pro Claude Code

Otáčivý glóbus se všemi jazyky světa pro děti, česky a anglicky. Komunikuj česky.
Uživatel není programátor a pracuje na Windows: vysvětluj jednoduše a když něco chybí, řekni přesně co a odkud nainstalovat.

## Příkazy

```
npm run check      # validace + sestavení; spusť vždy před commitem
npm run build -- --artefakt build   # navíc fragmenty pro publikování jako artefakt (ODKAZ_CS, ODKAZ_EN)
```

## Web

Nasazení přes Netlify z větve `main` podle `netlify.toml` (build `npm run check`, publikuje `dist/`).
Česky na `/`, anglicky na `/en/`. Když validace spadne, Netlify nový web nezveřejní – tak to má být.

## Struktura a pravidla

- `data/*.json` je jediný zdroj pravdy. `dist/` se generuje, needituj ho ručně.
- **Jedna šablona, dva jazyky.** `src/body.html` + `src/app.js` + `src/styles.css` jsou společné,
  texty jsou v `src/ui/cs.json` a `src/ui/en.json` (musí mít stejné klíče, validace to hlídá).
  Každý jazyk v `data/languages.json` má část `cs` i `en`.
- **Stránka nesmí záviset na CDN.** d3-geo, d3-array a topojson-client jsou ve `vendor/` a build je vkládá
  do stránky. Dřívější verze tahala d3 z cdnjs a v náhledu artefaktu pak nefungovalo vůbec nic.
- Glóbus je v pojistce: když selže, police jazyků a karty musí fungovat dál.
- **Přepnutí jazyka je na místě, ne odkazem do nového listu** (přání uživatele). Každá stránka nese oba jazyky;
  texty v šabloně mají `data-t`, `data-t-title`, `data-t-aria-label`, `data-t-placeholder` a JS je přepíše.
  Nový text v šabloně proto musí dostat i tuhle značku. Na webu se při přepnutí mění adresa `/` ↔ `/en/`.
- **Samo-otáčení je volba, výchozí vypnutá** (přání uživatele: při přiblížení nešlo zaměřit bod).
  Výběr jazyka ho vypne. Při přiblížení se otáčí pomaleji (rychlost / zoom).
- Od přiblížení 2× se u teček kreslí jména jazyků (přepínač „Jména“, výchozí zapnutý). Napřed jazyky z atlasu, pak ostatní; popisek, který by
  překryl jiný, se vynechá (mřížka obsazenosti 4 px). Nejvýš 450 popisků na snímek.
- Areál jazyka = seznam kruhů `[délka, šířka, poloměr ve stupních]`, kreslí se oříznutý na pevninu.
  Státy v `zeme` se kreslí celé – jen tam, kde se jazykem opravdu mluví v celém státě.

## Podrobnosti k tečkám

`scripts/podrobnosti.mjs` spojí k 7 967 tečkám data z Glottologu (ohrožení, popsanost, příbuzenstvo, státy,
nářečí), WALS (stavba jazyka), PHOIBLE (hlásky), UDHR (ukázka textu) a CLDR (české názvy, odhad uživatelů).
Zdroje stahuje do `.cache/` (není v gitu). Pořadí: `node scripts/glottolog.mjs`, pak `node scripts/podrobnosti.mjs`.
Příbuzenstvo je uložené jako strom (uzel zná rodiče), cestu a „nejbližší příbuzné“ dopočítá stránka.
Údaj bez doloženého zdroje nepřidávat.

**Wikidata** jsou z prostředí Claude Code na webu blokovaná, proto je stahuje GitHub Actions
(`.github/workflows/wikidata.yml`, 1. v měsíci a ručně přes Actions → Run workflow). Výsledek přijde jako pull request;
Netlify k němu udělá náhled. Pro pull request musí být v Settings → Actions → General zapnuté
„Allow GitHub Actions to create and approve pull requests“. `.github/workflows/kontrola.yml` spouští `npm run check`
u každého pushe.

## Barvy

- Barvy rodin (`--r-*`) prošly validátorem palet (skill dataviz) ve světlém (bílý panel) i tmavém režimu.
  **Pořadí ie → st → an → afro → nk → ost je součást ověření, neměnit.** Osm barev neprošlo, proto je
  šest skupin a menší rodiny jsou v „ostatních“ (přesná rodina je vždy napsaná na kartě).
- Zlatá (afro) má ve světlém režimu kontrast 2,4 : 1, proto nese tmavý text (`--t-afro`) a každá barva má
  vždy i textový popisek. V tmavém režimu leží areály na světlé „měsíční“ pevnině s nízkým kontrastem,
  proto mají tmavý obrys (`--obrys`). Obojí je druhotné rozlišení – nerušit.
- Vzhled (22. 9. 2026, na přání uživatele pryč od krémové a jantarové): planeta v kobaltovém vesmíru se
  hvězdami, bílé karty s tvrdým inkoustovým stínem, akcent růžový.

## Výkon

Glóbus kreslí na canvas ~8 000 teček. Neměř jen JS – drahá je rasterizace. `ctx.filter` (blur) stál
52 ms na snímek, proto se nepoužívá. Hustota pixelů je u velkého plátna omezená na 1,35.

## Ověření faktů

Zajímavosti jsou pro děti, ale musí být pravdivé. 22. 9. 2026 opraveno 19 nepřesností (např. zulská
odpověď na pozdrav je „Ngikhona“, ne „shiboka“; „mrož“ není z nizozemštiny). Novou zajímavost ověř.
