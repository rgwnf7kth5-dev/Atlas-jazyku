// Kontrola dat Atlasu jazyků. Chyba = konec s kódem 1.
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const json = p => JSON.parse(fs.readFileSync(path.join(KOREN, p), "utf8"));
const chyby = [], varovani = [];

const jazyky = json("data/languages.json");
const svet = json("data/countries-110m.json");
const nazvy = json("data/country-names.json");
const glottolog = json("data/glottolog.json");
const uiCs = json("src/ui/cs.json"), uiEn = json("src/ui/en.json");

const zeme = new Set(svet.objects.countries.geometries.map(g => g.properties.name));
const SKUPINY = new Set(["ie", "st", "an", "afro", "nk", "ost"]);
const ids = new Set();

for (const j of jazyky) {
  const kde = `jazyk „${j.id}“`;
  if (ids.has(j.id)) chyby.push(`${kde}: id je dvakrát`);
  ids.add(j.id);
  if (!SKUPINY.has(j.skupina)) chyby.push(`${kde}: neznámá barevná skupina „${j.skupina}“`);
  if (!j.pozdrav || !j.domaci) chyby.push(`${kde}: chybí pozdrav nebo vlastní jméno`);
  if (!(j.mluvcich > 0)) chyby.push(`${kde}: počet mluvčích musí být kladné číslo (v milionech)`);
  if (!Array.isArray(j.stred) || Math.abs(j.stred[0]) > 180 || Math.abs(j.stred[1]) > 90) chyby.push(`${kde}: špatný střed`);
  if (!j.zeme.length && !j.areal.length) chyby.push(`${kde}: nemá státy ani areál, na mapě by nebyl`);
  for (const z of j.zeme) if (!zeme.has(z)) chyby.push(`${kde}: stát „${z}“ na mapě není`);
  for (const a of j.areal) {
    if (a.length !== 3 || Math.abs(a[0]) > 180 || Math.abs(a[1]) > 90 || !(a[2] > 0 && a[2] <= 8))
      chyby.push(`${kde}: podezřelý kruh areálu ${JSON.stringify(a)} (délka, šířka, poloměr ve stupních 0–8)`);
  }
  for (const lang of ["cs", "en"]) {
    const p = j[lang];
    if (!p) { chyby.push(`${kde}: chybí verze ${lang}`); continue; }
    for (const k of ["nazev", "vyslovnost", "rodina", "fakt"]) if (!p[k]) chyby.push(`${kde}: v ${lang} chybí „${k}“`);
    if (p.fakt && p.fakt.length > 240) varovani.push(`${kde}: zajímavost v ${lang} je dlouhá (${p.fakt.length} znaků)`);
  }
}
for (const lang of ["cs", "en"]) for (const z of zeme) if (!nazvy[lang][z]) chyby.push(`stát „${z}“ nemá název v ${lang}`);
const kCs = Object.keys(uiCs), kEn = Object.keys(uiEn);
for (const k of kCs) if (!(k in uiEn)) chyby.push(`text „${k}“ chybí v src/ui/en.json`);
for (const k of kEn) if (!(k in uiCs)) chyby.push(`text „${k}“ chybí v src/ui/cs.json`);
if (!glottolog.body || glottolog.body.length < 5000) chyby.push("data/glottolog.json vypadá neúplně – spusť node scripts/glottolog.mjs");
const propojene = new Set(glottolog.body.map(b => b[5]).filter(Boolean));
for (const id of propojene) if (!ids.has(id)) chyby.push(`Glottolog odkazuje na neexistující jazyk „${id}“`);

for (const v of varovani) console.log("upozornění: " + v);
for (const c of chyby) console.log("CHYBA: " + c);
console.log(`${jazyky.length} jazyků v atlasu, ${glottolog.body.length} v rejstříku, ${propojene.size} propojených · ${chyby.length} chyb, ${varovani.length} upozornění`);
process.exit(chyby.length ? 1 : 0);
