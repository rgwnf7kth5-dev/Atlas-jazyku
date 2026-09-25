// Typologické mapy: vybrané vlastnosti WALS pro každou tečku rejstříku → data/typologie.json
//   node scripts/typologie.mjs     (chybějící tabulky WALS stáhne do .cache/, pak pracuje offline)
// Které vlastnosti, jejich texty a skupiny pro barvy mapy jsou v data/typologie-popis.json (psané ručně).
// Zdroj: Dryer, Matthew S. & Haspelmath, Martin (eds.) 2013. The World Atlas of Language Structures Online.
// Leipzig: Max Planck Institute for Evolutionary Anthropology. CC BY 4.0. Data z CLDF (cldf-datasets/wals).
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(KOREN, ".cache");
const WALS = "https://raw.githubusercontent.com/cldf-datasets/wals/master/cldf";
const GL = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf";
const ZDROJE = {
  "wals-languages.csv": `${WALS}/languages.csv`, "wals-values.csv": `${WALS}/values.csv`,
  "wals-parameters.csv": `${WALS}/parameters.csv`, "wals-chapters.csv": `${WALS}/chapters.csv`,
  "glottolog-languages.csv": `${GL}/languages.csv`
};
fs.mkdirSync(CACHE, { recursive: true });
for (const [soubor, url] of Object.entries(ZDROJE)) {
  const cil = path.join(CACHE, soubor);
  if (fs.existsSync(cil)) continue;
  process.stdout.write(`stahuji ${soubor}… `);
  const odpoved = await fetch(url);
  if (!odpoved.ok) throw new Error(`${url}: ${odpoved.status}`);
  fs.writeFileSync(cil, Buffer.from(await odpoved.arrayBuffer()));
  console.log("hotovo");
}

function csv(soubor) {
  const t = fs.readFileSync(path.join(CACHE, soubor), "utf8"), radky = []; let pole = [], b = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { b += '"'; i++; } else q = false; } else b += c; }
    else if (c === '"') q = true;
    else if (c === ",") { pole.push(b); b = ""; }
    else if (c === "\n") { pole.push(b); radky.push(pole); pole = []; b = ""; }
    else if (c !== "\r") b += c;
  }
  if (b || pole.length) { pole.push(b); radky.push(pole); }
  const h = radky[0];
  return radky.slice(1).filter(r => r.length === h.length).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

const popis = JSON.parse(fs.readFileSync(path.join(KOREN, "data/typologie-popis.json"), "utf8"));
const body = JSON.parse(fs.readFileSync(path.join(KOREN, "data/glottolog.json"), "utf8")).body;
const naIndex = new Map(body.map((b, i) => [b[6], i]));
/* nářečí v WALS připojit k jejich jazyku (tečky jsou jen jazyky) */
const jazykNareci = new Map();
for (const r of csv("glottolog-languages.csv")) if (r.Level === "dialect" && r.Language_ID) jazykNareci.set(r.ID, r.Language_ID);
const walsNaIndex = new Map();
for (const l of csv("wals-languages.csv")) {
  const g = naIndex.has(l.Glottocode) ? l.Glottocode : jazykNareci.get(l.Glottocode);
  if (g && naIndex.has(g)) walsNaIndex.set(l.ID, naIndex.get(g));
}

const parametry = new Map(csv("wals-parameters.csv").map(p => [p.ID, p]));
const kapitoly = new Map(csv("wals-chapters.csv").map(c => [c.ID, c]));
const ids = popis.vlastnosti.map(v => v.id);
const hodnoty = ids.map(() => new Array(body.length).fill(0));
for (const v of csv("wals-values.csv")) {
  const k = ids.indexOf(v.Parameter_ID), i = walsNaIndex.get(v.Language_ID);
  if (k < 0 || i === undefined) continue;
  const h = +(v.Code_ID || "").split("-")[1] || +v.Value;
  if (h >= 1 && h <= 9 && !hodnoty[k][i]) hodnoty[k][i] = h;      // víc jazyků WALS na jedné tečce: první vyhrává
}

const vlastnosti = popis.vlastnosti.map((v, k) => {
  const p = parametry.get(v.id);
  if (!p) throw new Error(`WALS nezná vlastnost ${v.id}`);
  const ch = kapitoly.get(p.Chapter_ID) || {};
  return { id: v.id, kapitola: +p.Chapter_ID, nazevWals: p.Name, autor: ch.Contributor || "",
           pocet: hodnoty[k].filter(Boolean).length, h: hodnoty[k].join("") };
});
fs.writeFileSync(path.join(KOREN, "data/typologie.json"), JSON.stringify({
  zdroj: "WALS Online (Dryer & Haspelmath 2013), CLDF cldf-datasets/wals",
  stazeno: new Date(fs.statSync(path.join(CACHE, "wals-values.csv")).mtime).toISOString().slice(0, 10),
  vlastnosti
}) + "\n");
console.log("typologie.json: " + vlastnosti.map(v => `${v.id} ${v.pocet}`).join(", "));
