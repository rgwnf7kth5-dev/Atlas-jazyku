// Vyrobí data/glottolog.json – tečky všech jazyků světa – z otevřené databáze Glottolog (CC BY 4.0).
//   node scripts/glottolog.mjs                 stáhne aktuální languages.csv z GitHubu
//   node scripts/glottolog.mjs cesta/k.csv     použije už stažený soubor
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ZDROJ = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/languages.csv";

const text = process.argv[2]
  ? fs.readFileSync(process.argv[2], "utf8")
  : await (await fetch(ZDROJ)).text();

function nactiCsv(t) {
  const radky = []; let pole = [], bunka = "", uvozovky = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (uvozovky) {
      if (c === '"') { if (t[i + 1] === '"') { bunka += '"'; i++; } else uvozovky = false; }
      else bunka += c;
    } else if (c === '"') uvozovky = true;
    else if (c === ",") { pole.push(bunka); bunka = ""; }
    else if (c === "\n") { pole.push(bunka); radky.push(pole); pole = []; bunka = ""; }
    else if (c !== "\r") bunka += c;
  }
  if (bunka || pole.length) { pole.push(bunka); radky.push(pole); }
  return radky;
}

const [hlavicka, ...radky] = nactiCsv(text);
const ix = Object.fromEntries(hlavicka.map((k, i) => [k, i]));
const zaznamy = radky.filter(r => r.length > 5);
const jmenoRodiny = {};
for (const r of zaznamy) if (r[ix.Level] === "family") jmenoRodiny[r[ix.ID]] = r[ix.Name];

// „Bookkeeping“, „Unattested“ a „Unclassifiable“ nejsou rodiny, ale evidenční přihrádky
const VYRADIT = new Set(["Bookkeeping", "Unattested", "Unclassifiable"]);
const jazyky = zaznamy
  .filter(r => r[ix.Level] === "language" && r[ix.Latitude] && r[ix.Longitude])
  .filter(r => !VYRADIT.has(jmenoRodiny[r[ix.Family_ID]] || ""));

// propojení s jazyky atlasu přes kód ISO 639-3
const atlas = JSON.parse(fs.readFileSync(path.join(KOREN, "data/languages.json"), "utf8"));
const iso = JSON.parse(fs.readFileSync(path.join(KOREN, "data/iso639.json"), "utf8"));
const isoNaId = {};
for (const j of atlas) { const k = iso[j.id] || (j.id.length === 3 ? j.id : null); if (k) isoNaId[k] = j.id; }

const MAKRO = { "Africa": "Africa", "Eurasia": "Eurasia", "Papunesia": "Papunesia",
  "North America": "North America", "South America": "South America", "Australia": "Australia" };
const rodiny = [], rodinyIx = {}, makro = [], makroIx = {};
const index = (seznam, rejstrik, n) => (n in rejstrik) ? rejstrik[n] : (rejstrik[n] = seznam.push(n) - 1);

const body = jazyky.map(r => {
  const kod = r[ix.ISO639P3code] || r[ix.Closest_ISO369P3code] || "";
  return [
    r[ix.Name],
    Math.round(+r[ix.Longitude] * 100) / 100,
    Math.round(+r[ix.Latitude] * 100) / 100,
    index(rodiny, rodinyIx, jmenoRodiny[r[ix.Family_ID]] || "Isolate"),
    index(makro, makroIx, MAKRO[(r[ix.Macroarea] || "").split(";")[0]] || ""),
    isoNaId[kod] || ""
  ];
});

fs.writeFileSync(path.join(KOREN, "data/glottolog.json"),
  JSON.stringify({ zdroj: ZDROJ, stazeno: new Date().toISOString().slice(0, 10), rodiny, makro, body }));
const propojeno = new Set(body.map(b => b[5]).filter(Boolean));
console.log(`Glottolog: ${body.length} jazyků, ${rodiny.length} rodin, propojeno s atlasem ${propojeno.size} z ${atlas.length}.`);
