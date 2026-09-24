// Vyrobí data/nareci.json – jména nářečí ke každému jazyku rejstříku – z Glottologu (CC BY 4.0).
//   node scripts/nareci.mjs      (použije .cache/glottolog-languages.csv, když chybí, stáhne ho z GitHubu)
// Glottolog vede nářečí jako samostatné záznamy s úrovní „dialect“ a odkazem na jazyk (Language_ID).
// Na glóbu tečku nemají; atlas je ukazuje na kartě jazyka a hledání přes ně najde jejich jazyk.
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(KOREN, ".cache/glottolog-languages.csv");
const ZDROJ = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/languages.csv";

let text;
if (fs.existsSync(CACHE)) text = fs.readFileSync(CACHE, "utf8");
else { text = await (await fetch(ZDROJ)).text(); fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, text); }

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
const kody = new Set(JSON.parse(fs.readFileSync(path.join(KOREN, "data/glottolog.json"), "utf8")).body.map(b => b[6]));
const nareci = {};
for (const r of radky) {
  if (r[ix.Level] !== "dialect" || !kody.has(r[ix.Language_ID])) continue;
  (nareci[r[ix.Language_ID]] ||= []).push(r[ix.Name]);
}
const vystup = {};
for (const k of Object.keys(nareci).sort()) vystup[k] = nareci[k].sort((a, b) => a.localeCompare(b, "en")).join("|");
fs.writeFileSync(path.join(KOREN, "data/nareci.json"), JSON.stringify(vystup) + "\n");
console.log(`${Object.values(nareci).reduce((s, x) => s + x.length, 0)} nářečí u ${Object.keys(nareci).length} jazyků → data/nareci.json`);
