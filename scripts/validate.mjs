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

const pd = json("data/podrobnosti.json");
if (pd.radky.length !== glottolog.body.length) chyby.push(`data/podrobnosti.json má ${pd.radky.length} řádků, rejstřík ${glottolog.body.length} – spusť node scripts/podrobnosti.mjs`);
let divnychMluvcich = 0;
for (const r of pd.radky) if (Array.isArray(r[10]) && !(r[10][0] > 0 && r[10][0] < 2e9 && (r[10][1] === 0 || (r[10][1] >= 1900 && r[10][1] <= new Date().getFullYear() + 1)))) divnychMluvcich++;
if (divnychMluvcich) chyby.push(`data/podrobnosti.json: ${divnychMluvcich} jazyků má nesmyslný počet mluvčích nebo rok (Wikidata)`);
if (pd.radky.some(r => !(Number.isInteger(r[0]) && r[0] >= -1 && r[0] <= 6))) chyby.push("data/podrobnosti.json: stupeň vitality musí být -1 až 6");
{ /* písmo a úřední status (CLDR): každý kód písma má název v obou jazycích, stát je známý, status 1–3 */
  let spatne = 0;
  for (const r of pd.radky.concat(Object.values(pd.atlasCldr || {}).map(x => [,,,,,,,,,,,,, x[0], x[1]]))) {
    for (const k of (r[13] || "").split(" ").filter(Boolean)) if (!pd.pisma || !pd.pisma.cs[k] || !pd.pisma.en[k]) spatne++;
    for (const x of (r[14] || "").split(" ").filter(Boolean)) if (!/^[A-Z]{2}[123]$/.test(x) || !pd.staty.cs[x.slice(0, 2)]) spatne++;
  }
  if (spatne) chyby.push(`data/podrobnosti.json: ${spatne} neplatných údajů o písmu nebo úředním statusu – spusť node scripts/podrobnosti.mjs`);
}
if (pd.uzly.length !== pd.nad.length) chyby.push("data/podrobnosti.json: strom příbuzenstva je poškozený");
{ /* jazyky starověku (data/starovek.json): fotky s licencí a zdrojem, obě jazykové verze se stejnými oddíly, tečky v rejstříku */
  const st = json("data/starovek.json"), co = "data/starovek.json", kody = new Set(glottolog.body.map(b => b[6]));
  const volna = /^(CC0|Public domain|CC BY(-SA)? \d\.\d( [a-z]{2})?)$/;   // i jurisdikční verze, např. „CC BY-SA 2.0 de“
  for (const c of st.civilizace) {
    if (!c.adresa || !c.adresa.cs || !c.adresa.en) chyby.push(`${co}: ${c.id} nemá adresu stránky`);
    for (const [k, f] of Object.entries(c.fotky)) {
      for (const soubor of [f.soubor, k + "-720.jpg"]) if (!fs.existsSync(path.join(KOREN, "static/starovek", c.id, soubor))) chyby.push(`${co}: fotka ${c.id}/${soubor} chybí ve static/starovek/`);
      if (!volna.test(f.licence || "")) chyby.push(`${co}: fotka ${k} má licenci „${f.licence}“ (jen CC0, public domain, CC BY, CC BY-SA)`);
      if (f.licence !== "CC0" && f.licence !== "Public domain" && !f.autor) chyby.push(`${co}: fotka ${k} nemá autora (licence ho vyžaduje)`);
      if (!f.zdroj || !f.cs || !f.en) chyby.push(`${co}: fotka ${k} nemá zdroj nebo popisek v obou jazycích`);
    }
    if (!fs.existsSync(path.join(KOREN, "static/starovek", c.id, "malba.jpg"))) chyby.push(`${co}: chybí static/starovek/${c.id}/malba.jpg (náhled ilustrace)`);
    const typy = l => (c[l].oddily || []).map(b => b.typ).join(",");
    if (typy("cs") !== typy("en")) chyby.push(`${co}: ${c.id} má v češtině a angličtině jiné oddíly`);
    for (const l of ["cs", "en"]) for (const b of c[l].oddily) for (const f of [].concat(b.f || [])) if (!c.fotky[f]) chyby.push(`${co}: ${c.id}/${l} odkazuje na neznámou fotku „${f}“`);
    for (const k of c.tecky || []) if (!kody.has(k)) chyby.push(`${co}: ${c.id} má tečku „${k}“, kterou rejstřík nezná`);
  }
}
{ /* typologické mapy: popis (ručně) a data (scripts/typologie.mjs) musí sedět; barvy mapy jsou ověřené jen pro 5 odstínů + „jiné“ a 7 stupňů */
  const p = json("data/typologie-popis.json"), d = json("data/typologie.json"), co = "data/typologie-popis.json";
  if (p.vlastnosti.length !== d.vlastnosti.length || p.vlastnosti.some((v, k) => v.id !== d.vlastnosti[k].id)) chyby.push("data/typologie.json neodpovídá popisu – spusť node scripts/typologie.mjs");
  for (const v of p.vlastnosti) {
    if (!p.oblasti[v.oblast]) chyby.push(`${co}: ${v.id} má neznámou oblast „${v.oblast}“`);
    if (v.druh !== "kat" && v.druh !== "rada") chyby.push(`${co}: ${v.id} má druh „${v.druh}“ (kat nebo rada)`);
    for (const l of ["cs", "en"]) {
      if (!v.nazev[l] || !v.popis[l]) chyby.push(`${co}: ${v.id} nemá název nebo popis (${l})`);
      for (const [k, h] of Object.entries(v.hodnoty)) if (!h[l]) chyby.push(`${co}: ${v.id} hodnota ${k} nemá text (${l})`);
      for (const t of v.tridy) if (!t[l]) chyby.push(`${co}: ${v.id} skupina bez textu (${l})`);
    }
    const kody = v.tridy.flatMap(t => t.wals).sort((a, b) => a - b), mame = Object.keys(v.hodnoty).map(Number).sort((a, b) => a - b);
    if (kody.join() !== mame.join()) chyby.push(`${co}: ${v.id} skupiny nepokrývají každou hodnotu právě jednou`);
    const barevne = v.tridy.filter(t => t.barva !== "jine").length;
    if (v.tridy.filter(t => t.barva === "jine").length > 1) chyby.push(`${co}: ${v.id} má víc skupin „jine“`);
    if (barevne > (v.druh === "kat" ? 5 : 7)) chyby.push(`${co}: ${v.id} má ${barevne} barevných skupin – ověřená paleta jich unese ${v.druh === "kat" ? 5 : 7}`);
  }
  const dv = d.vlastnosti.find(v => v.h.length !== glottolog.body.length);
  if (dv) chyby.push(`data/typologie.json: ${dv.id} nemá hodnotu pro každou tečku – spusť node scripts/typologie.mjs`);
}
{ const v = json("data/vymyslene.json"), svety = new Set(v.svety.map(s => s.id)), ids = new Set();   // vymyšlené jazyky („mellon“)
  for (const s of v.svety) for (const l of ["cs", "en"]) if (!s[l] || !s[l].nazev || !s[l].popis) chyby.push(`data/vymyslene.json: svět „${s.id}“ nemá ${l}`);
  for (const j of v.jazyky) {
    if (ids.has(j.id)) chyby.push(`data/vymyslene.json: „${j.id}“ je dvakrát`); ids.add(j.id);
    if (!svety.has(j.svet)) chyby.push(`data/vymyslene.json: „${j.id}“ má neznámý svět „${j.svet}“`);
    if (!j.pozdrav || !j.autor) chyby.push(`data/vymyslene.json: „${j.id}“ nemá pozdrav nebo autora`);
    for (const l of ["cs", "en"]) for (const k of ["nazev", "vyslovnost", "dilo", "vyznam", "fakt", "hledat"])
      if (!j[l] || !j[l][k]) chyby.push(`data/vymyslene.json: „${j.id}“ nemá ${l}.${k}`);
  }
  for (const id of Object.keys(v.stopy || {})) if (!ids.size || !jazyky.some(x => x.id === id)) chyby.push(`data/vymyslene.json: stopa u neznámého jazyka „${id}“`); }
{ const nareci = json("data/nareci.json"), jmena = new Set(Object.values(nareci).join("|").split("|"));   // nářečí a jejich české názvy
  for (const k of Object.keys(json("data/nareci-cs.json"))) if (!k.startsWith("_") && !jmena.has(k)) chyby.push(`data/nareci-cs.json: nářečí „${k}“ v Glottologu není`); }
{ const kody = new Set(glottolog.body.map(b => b[6]));   // opravy poloh jen pro tečky, které v Glottologu jsou
  for (const [k, o] of Object.entries(json("data/polohy-opravy.json"))) {
    if (k.startsWith("_")) continue;
    if (!kody.has(k)) chyby.push(`data/polohy-opravy.json: tečka „${k}“ v Glottologu není`);
    if (!o.proc || (o.poloha !== null && (!Array.isArray(o.poloha) || Math.abs(o.poloha[0]) > 180 || Math.abs(o.poloha[1]) > 90))) chyby.push(`data/polohy-opravy.json: „${k}“ potřebuje polohu [délka, šířka] nebo null a důvod`);
  } }
{ const uzly = new Set(pd.uzly);                // české názvy větví pro rodokmen: jen větve, které ve stromu opravdu jsou
  for (const k of Object.keys(json("data/glottolog-branches.cs.json"))) if (!uzly.has(k)) chyby.push(`data/glottolog-branches.cs.json: větev „${k}“ v Glottologu není`); }
/* Jazyk dne: význačné dny (MM-DD → jazyk atlasu a důvod česky i anglicky) */
{ const dny = json("data/dny-jazyku.json");
  for (const [k, d] of Object.entries(dny)) {
    if (k === "_pozn") continue;
    const m = k.match(/^(\d\d)-(\d\d|(po|ut|st|ct|pa|so|ne)[1-5])$/);
    if (!m || +m[1] < 1 || +m[1] > 12 || (!m[3] && (+m[2] < 1 || +m[2] > 31))) chyby.push(`data/dny-jazyku.json: „${k}“ není den ve tvaru MM-DD ani MM-soN`);
    if (d.kod) {
      if (!glottolog.body.some(b => b[6] === d.kod)) chyby.push(`data/dny-jazyku.json: ${k} odkazuje na neznámou tečku „${d.kod}“`);
      if (!d.pozdrav) chyby.push(`data/dny-jazyku.json: ${k} (tečka rejstříku) nemá pozdrav`);
    } else if (!ids.has(d.id)) chyby.push(`data/dny-jazyku.json: ${k} odkazuje na neznámý jazyk „${d.id}“`);
    if (!d.cs || !d.en) chyby.push(`data/dny-jazyku.json: ${k} nemá důvod česky i anglicky`);
  }
  if (dny["09-26"]) chyby.push("data/dny-jazyku.json: 26. 9. je Evropský den jazyků, Jazyk dne ten den není");
}
/* krajina na pohlednici: každý jazyk atlasu ji má a druh krajiny existuje v src/akvarely.js */
{ const druhy = new Set([...fs.readFileSync(path.join(KOREN, "src/akvarely.js"), "utf8").matchAll(/^    (\w+): function/gm)].map(m => m[1]));
  const krajiny = json("data/krajiny.json");
  for (const j of jazyky) {
    const k = krajiny[j.id];
    if (!k) chyby.push(`data/krajiny.json: jazyk „${j.id}“ nemá krajinu`);
    else if (!druhy.has(k.split(":")[0])) chyby.push(`data/krajiny.json: „${j.id}“ má neznámou krajinu „${k}“`);
  } }
for (const [l, ui] of [["cs", uiCs], ["en", uiEn]]) {
  if (!Array.isArray(ui.aes) || ui.aes.length !== 7) chyby.push(`src/ui/${l}.json: „aes“ musí mít 7 položek (6 stupňů UNESCO + probouzený)`);
  if (!Array.isArray(ui.aesZnak) || ui.aesZnak.length !== 7) chyby.push(`src/ui/${l}.json: „aesZnak“ musí mít 7 položek jako „aes“`);
  if (!Array.isArray(ui.med) || ui.med.length !== 5) chyby.push(`src/ui/${l}.json: „med“ musí mít 5 stupňů popsanosti`);
  if (!Array.isArray(ui.strany) || ui.strany.length !== 4) chyby.push(`src/ui/${l}.json: „strany“ musí mít 4 světové strany (sever, jih, východ, západ)`);
}

for (const v of varovani) console.log("upozornění: " + v);
for (const c of chyby) console.log("CHYBA: " + c);
console.log(`${jazyky.length} jazyků v atlasu, ${glottolog.body.length} v rejstříku, ${propojene.size} propojených · ${chyby.length} chyb, ${varovani.length} upozornění`);
process.exit(chyby.length ? 1 : 0);
