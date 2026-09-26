// Stáhne z Wikidat údaje k jazykům, které mají kód Glottologu (vlastnost P1394) → data/wikidata.json
//   node scripts/wikidata.mjs
// Spouští se hlavně v GitHub Actions (.github/workflows/wikidata.yml); Wikidata jsou volné dílo (CC0).
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ENDPOINT = "https://query.wikidata.org/sparql";
const UA = "AtlasJazyku/1.0 (https://github.com/rgwnf7kth5-dev/atlas-jazyku; educational encyclopedic project)";
const PRVNI_JAZYK = "http://www.wikidata.org/entity/Q36870";      // „first language“ v kvalifikátoru P518

async function dotaz(sparql, popis) {
  for (let pokus = 1; pokus <= 5; pokus++) {
    try {
      const odpoved = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        body: "query=" + encodeURIComponent(sparql),
        signal: AbortSignal.timeout(90000)
      });
      if (odpoved.ok) {
        const data = await odpoved.json();
        console.log(`${popis}: ${data.results.bindings.length} řádků`);
        return data.results.bindings;
      }
      console.log(`${popis}: HTTP ${odpoved.status}, pokus ${pokus}`);
    } catch (e) { console.log(`${popis}: ${e.message}, pokus ${pokus}`); }
    await new Promise(r => setTimeout(r, 5000 * pokus));
  }
  throw new Error(`${popis}: Wikidata neodpověděla ani na pátý pokus`);
}
const qid = uri => +uri.replace(/^.*\/Q/, "");

/* počet mluvčích (P1098) se všemi výroky, hodností, rokem a tím, zda jde o rodilé mluvčí */
const mluvci = await dotaz(`
SELECT ?item ?glotto ?pocet ?hodnost ?cas ?cast WHERE {
  ?item wdt:P1394 ?glotto ; p:P1098 ?vyrok .
  ?vyrok ps:P1098 ?pocet ; wikibase:rank ?hodnost .
  OPTIONAL { ?vyrok pq:P585 ?cas }
  OPTIONAL { ?vyrok pq:P518 ?cast }
}`, "počty mluvčích");

/* české a anglické jméno, články na Wikipedii */
const jmena = await dotaz(`
SELECT ?item ?glotto ?cs ?wcs ?wen WHERE {
  ?item wdt:P1394 ?glotto .
  OPTIONAL { ?item rdfs:label ?cs FILTER(LANG(?cs) = "cs") }
  OPTIONAL { ?wcs schema:about ?item ; schema:isPartOf <https://cs.wikipedia.org/> }
  OPTIONAL { ?wen schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
}`, "jména a články");

const zaznamy = {};
const zaznam = g => (zaznamy[g] = zaznamy[g] || {});
for (const r of jmena) {
  const z = zaznam(r.glotto.value);
  z.q = z.q || qid(r.item.value);
  if (r.cs && !z.cs) z.cs = r.cs.value;
  if (r.wcs) z.w = (z.w || 0) | 1;
  if (r.wen) z.w = (z.w || 0) | 2;
}

/* z více výroků vyber jeden: bez zastaralých, přednost má „preferovaný“, pak rodilí mluvčí, pak nejnovější */
const kandidati = {};
for (const r of mluvci) {
  const hodnost = r.hodnost.value.replace(/^.*#/, "");
  if (hodnost === "DeprecatedRank") continue;
  const pocet = Math.round(+r.pocet.value);
  if (!(pocet > 0) || pocet > 2e9) continue;
  // rok z data typu „2010-01-01T…“; historické údaje (před rokem 1900, i před naším letopočtem) nepopisují dnešek
  const rok = r.cas ? parseInt(r.cas.value, 10) : 0;
  if (r.cas && !(rok >= 1900 && rok <= new Date().getFullYear() + 1)) continue;
  (kandidati[r.glotto.value] = kandidati[r.glotto.value] || []).push({
    pocet, rok, preferovany: hodnost === "PreferredRank", rodili: r.cast ? r.cast.value === PRVNI_JAZYK : false,
    druhy: !!r.cast && r.cast.value !== PRVNI_JAZYK
  });
}
let sMluvcimi = 0;
for (const [g, seznam] of Object.entries(kandidati)) {
  const pouzitelne = seznam.filter(k => !k.druhy);                 // „jen druhý jazyk“ samostatně neukazuj
  if (!pouzitelne.length) continue;
  pouzitelne.sort((a, b) => (b.preferovany - a.preferovany) || (b.rodili - a.rodili) || (b.rok - a.rok) || (b.pocet - a.pocet));
  const k = pouzitelne[0];
  zaznam(g).m = [k.pocet, k.rok, k.rodili ? 1 : 0];
  sMluvcimi++;
}

const vystup = { stazeno: new Date().toISOString().slice(0, 10), zdroj: "Wikidata (CC0)", zaznamy };
fs.writeFileSync(path.join(KOREN, "data/wikidata.json"), JSON.stringify(vystup));
const vse = Object.values(zaznamy);
console.log(`Wikidata: ${vse.length} jazyků, počet mluvčích u ${sMluvcimi}, český název u ${vse.filter(z => z.cs).length}, ` +
  `článek na cs Wikipedii u ${vse.filter(z => z.w & 1).length}, na en u ${vse.filter(z => z.w & 2).length}.`);
if (vse.length < 5000) { console.error("Podezřele málo jazyků – soubor je uložen, ale zkontroluj dotaz."); process.exit(1); }
