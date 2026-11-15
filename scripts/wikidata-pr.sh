#!/usr/bin/env bash
# Spouštěj až po stažení dat a úspěšném npm run check (viz wikidata.yml).
# dist/ slouží jen k ověření. Netlify jej po Merge sestaví z aktuálního mainu.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
: "${GITHUB_RUN_ID:?Chybí ID běhu GitHub Actions}"
: "${GITHUB_REPOSITORY:?Chybí název repozitáře}"

# Nikdy nepřibalit cizí předem připravené změny.
if ! git diff --cached --quiet; then
  echo "::error::Index není prázdný; datový PR by mohl obsahovat nesouvisející změny."
  exit 1
fi

# Výslovný seznam výstupů obou stahovacích skriptů. Nikdy celé data/ ani dist/.
git add -- data/wikidata.json data/podrobnosti.json
if git diff --cached --quiet; then
  echo "Data se od minula nezměnila, pull request není potřeba."
  exit 0
fi

DNES=$(date -u +%Y-%m-%d)
VETEV="data/wikidata-$DNES-$GITHUB_RUN_ID-${GITHUB_RUN_ATTEMPT:-1}"
POPIS=$(mktemp)
trap 'rm -f "$POPIS"' EXIT

node --input-type=module > "$POPIS" <<'NODE'
import fs from "node:fs";
const d = JSON.parse(fs.readFileSync("data/wikidata.json", "utf8"));
const z = Object.values(d.zaznamy);
console.log("Automatická aktualizace: počty mluvčích, české názvy a odkazy na Wikipedii z Wikidat;");
console.log("obnovené podrobnosti z Glottologu, WALS, PHOIBLE, UDHR a CLDR.");
console.log("");
console.log("- jazyků z Wikidat: " + z.length);
console.log("- s počtem mluvčích: " + z.filter(x => x.m).length);
console.log("- s českým názvem: " + z.filter(x => x.cs).length);
console.log("");
console.log("PR mění pouze `data/wikidata.json` a `data/podrobnosti.json`.");
console.log("Generované `dist/` ani redakční soubory (např. `data/starovek.json`) neobsahuje.");
console.log("Kontrola dat a zkušební sestavení (`npm run check`) při přípravě PR prošly.");
console.log("Netlify k PR vytvoří náhled; před sloučením jej prosím prohlédněte a zkontrolujte výsledky kontrol.");
console.log("Po ručním Merge Netlify znovu spustí `npm run check` nad sloučeným mainem.");
console.log("Web tak použije schválená data i aktuální texty, překlady a kód.");
NODE

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git switch -c "$VETEV"
git commit -m "Data z Wikidat a dalších zdrojů ($DNES)"
git push -u origin "$VETEV"
if ! gh pr create --repo "$GITHUB_REPOSITORY" --base main --head "$VETEV" --title "Data z Wikidat ($DNES)" --body-file "$POPIS"; then
  echo "::error::Pull request se nepodařilo založit. Ověř Settings → Actions → General → Allow GitHub Actions to create and approve pull requests. Větev $VETEV je nahraná."
  exit 1
fi
