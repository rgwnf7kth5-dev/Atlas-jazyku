// Fotky na pohlednice jazyků z Wikimedia Commons → static/fotky/<id>.jpg a data/fotky.json (autor, licence, zdroj)
//   node scripts/fotky.mjs            stáhne chybějící fotky
//   node scripts/fotky.mjs --znovu    stáhne všechny znovu
// Spouští se v GitHub Actions (.github/workflows/fotky.yml), z prostředí Claude Code je Wikimedia blokovaná.
//
// Jak se vybírá fotka: jazyk z atlasu → jeho položka ve Wikidatech (přes kód Glottologu, data/wikidata.json)
// → místo, odkud jazyk pochází (P2341 „původní v“; když chybí, země P17) → hlavní obrázek místa (P18),
// který vybrali editoři Wikidat. Z více míst vyhraje to nejbližší středu jazyka v atlasu.
// Bere se jen fotka na šířku, aspoň 800 px, se svobodnou licencí (CC0, public domain, CC BY, CC BY-SA).
// Ruční opravy jsou v data/fotky-opravy.json: {"id": {"misto": "Q…"}} nebo {"id": {"soubor": "Název.jpg"}}.
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const UA = "AtlasJazyku/1.0 (https://github.com/rgwnf7kth5-dev/atlas-jazyku; educational project for children)";
const SIRKA = 960;                                   // standardní šířka náhledu na Commons
const ZNOVU = process.argv.includes("--znovu");
const json = f => JSON.parse(fs.readFileSync(path.join(KOREN, f), "utf8"));

const jazyky = json("data/languages.json"), glottolog = json("data/glottolog.json"), wikidata = json("data/wikidata.json").zaznamy;
const opravy = fs.existsSync(path.join(KOREN, "data/fotky-opravy.json")) ? json("data/fotky-opravy.json") : {};
const vystupSoubor = path.join(KOREN, "data/fotky.json");
const stare = fs.existsSync(vystupSoubor) ? JSON.parse(fs.readFileSync(vystupSoubor, "utf8")).fotky : {};
const slozka = path.join(KOREN, "static/fotky");
fs.mkdirSync(slozka, { recursive: true });

const pockej = ms => new Promise(r => setTimeout(r, ms));
async function stahni(url, moznosti = {}, jako = "json") {
  for (let pokus = 1; pokus <= 5; pokus++) {
    try {
      const o = await fetch(url, { ...moznosti, headers: { "User-Agent": UA, ...(moznosti.headers || {}) }, signal: AbortSignal.timeout(90000) });
      if (o.ok) return jako === "json" ? o.json() : Buffer.from(await o.arrayBuffer());
      console.log(`  HTTP ${o.status} (${url.slice(0, 90)}…), pokus ${pokus}`);
      if (o.status === 404) return null;
    } catch (e) { console.log(`  ${e.message}, pokus ${pokus}`); }
    await pockej(4000 * pokus);
  }
  throw new Error("Nepodařilo se stáhnout " + url);
}
/* jazyk z atlasu → položka ve Wikidatech */
const glottoPodleId = {};
for (const b of glottolog.body) if (b[5] && !glottoPodleId[b[5]]) glottoPodleId[b[5]] = b[6];
const qJazyka = {};
for (const j of jazyky) {
  const q = (opravy[j.id] && opravy[j.id].jazyk) || (wikidata[glottoPodleId[j.id]] || {}).q;
  if (q) qJazyka[j.id] = "Q" + String(q).replace(/^Q/, "");
}
console.log(`Jazyků v atlasu: ${jazyky.length}, s položkou ve Wikidatech: ${Object.keys(qJazyka).length}`);

/* položky z Wikidat po padesáti přes wbgetentities (dotaz SPARQL v Actions opakovaně vypršel) */
async function polozky(qs) {
  const vysledek = {};
  const seznam = [...new Set(qs)];
  for (let i = 0; i < seznam.length; i += 50) {
    const u = "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=cs|en&ids=" + seznam.slice(i, i + 50).join("|");
    const d = await stahni(u);
    Object.assign(vysledek, d.entities || {});
    await pockej(300);
  }
  return vysledek;
}
const hodnotyVlastnosti = (e, p) => ((e && e.claims && e.claims[p]) || [])
  .filter(c => c.rank !== "deprecated" && c.mainsnak.datavalue)
  .sort((a, b) => (b.rank === "preferred") - (a.rank === "preferred"))
  .map(c => c.mainsnak.datavalue.value);
const jazykovePolozky = await polozky(Object.values(qJazyka));
const mistaJazyka = {};
for (const [id, q] of Object.entries(qJazyka)) {
  const e = jazykovePolozky[q];
  mistaJazyka[id] = [
    ...hodnotyVlastnosti(e, "P2341").map(v => ({ misto: v.id, typ: 1 })),
    ...hodnotyVlastnosti(e, "P17").map(v => ({ misto: v.id, typ: 2 }))
  ];
}
for (const [id, o] of Object.entries(opravy)) if (o.misto) mistaJazyka[id] = [{ misto: o.misto, typ: 0 }];
const mistaPolozky = await polozky(Object.values(mistaJazyka).flat().map(m => m.misto));
console.log(`Míst ve Wikidatech: ${Object.keys(mistaPolozky).length}`);
function kandidatiPro(id) {
  const vse = [];
  for (const m of mistaJazyka[id] || []) {
    const e = mistaPolozky[m.misto];
    if (!e) continue;
    const s = hodnotyVlastnosti(e, "P625")[0];
    const kde = s ? [s.longitude, s.latitude] : null;
    const lab = k => e.labels && e.labels[k] && e.labels[k].value;
    for (const soubor of hodnotyVlastnosti(e, "P18")) vse.push({ misto: m.misto, typ: m.typ, soubor, kde, cs: lab("cs"), en: lab("en") });
  }
  return vse;
}
function vzdalenost(a, b) {
  if (!a || !b) return 1e9;
  const R = Math.PI / 180, dl = (a[0] - b[0]) * R;
  return Math.acos(Math.min(1, Math.sin(a[1] * R) * Math.sin(b[1] * R) + Math.cos(a[1] * R) * Math.cos(b[1] * R) * Math.cos(dl)));
}

/* údaje o souboru z Commons: náhled, rozměry, autor, licence */
async function infoSouboru(soubor) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata" +
    `&iiurlwidth=${SIRKA}&titles=` + encodeURIComponent("File:" + soubor);
  const d = await stahni(u);
  const s = d && Object.values(d.query.pages)[0];
  const ii = s && s.imageinfo && s.imageinfo[0];
  if (!ii) return null;
  const m = ii.extmetadata || {}, txt = k => (m[k] && m[k].value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return { sirka: ii.width, vyska: ii.height, mime: ii.mime, nahled: ii.thumburl, stranka: ii.descriptionurl,
    autor: txt("Artist") || txt("Credit"), licence: txt("LicenseShortName"), licenceUrl: txt("LicenseUrl") };
}
const SVOBODNA = /^(CC0|CC[ -]BY(-SA)?( \d(\.\d)?)?|Public domain|PD\b)/i;
const NE = /\b(map|mapa|flag|vlajka|coat of arms|locator|location|logo|seal|emblem)\b/i;
function vhodna(i, soubor) {
  if (!i) return "soubor nenalezen";
  if (!/jpeg|png/.test(i.mime)) return "není fotka (" + i.mime + ")";
  if (NE.test(soubor)) return "vypadá jako mapa nebo znak";
  if (i.sirka < 800) return "malé rozlišení";
  if (i.sirka < i.vyska * 1.2) return "není na šířku";
  if (!SVOBODNA.test(i.licence)) return "licence „" + i.licence + "“";
  return null;
}

const fotky = {}, hlaseni = [];
for (const j of jazyky) {
  const oprava = opravy[j.id] || {};
  let kandidati = [];
  if (oprava.soubor) kandidati = [{ soubor: oprava.soubor, misto: null, typ: 0 }];
  else kandidati = kandidatiPro(j.id).sort((a, b) => (a.typ - b.typ) || (vzdalenost(a.kde, j.stred) - vzdalenost(b.kde, j.stred)));
  const cil = path.join(slozka, j.id + ".jpg");
  const stara = stare[j.id];
  if (!ZNOVU && stara && fs.existsSync(cil) && kandidati.some(k => k.soubor === stara.nazev)) { fotky[j.id] = stara; continue; }
  let vybrano = null;
  const duvody = [];
  for (const k of kandidati.slice(0, 6)) {
    const info = await infoSouboru(k.soubor);
    const proc = vhodna(info, k.soubor);
    if (proc) { duvody.push(`${k.soubor}: ${proc}`); continue; }
    vybrano = { k, info }; break;
  }
  if (!vybrano) { hlaseni.push(`- **${j.cs.nazev}** – bez fotky${duvody.length ? " (" + duvody.join("; ") + ")" : " (místo ani obrázek ve Wikidatech)"}`); continue; }
  const data = await stahni(vybrano.info.nahled, {}, "buffer");
  fs.writeFileSync(cil, data);
  fotky[j.id] = { soubor: "fotky/" + j.id + ".jpg", nazev: vybrano.k.soubor, misto: vybrano.k.misto,
    mistoCs: vybrano.k.cs || null, mistoEn: vybrano.k.en || null, autor: vybrano.info.autor || "neznámý autor",
    licence: vybrano.info.licence, licenceUrl: vybrano.info.licenceUrl || null, zdroj: vybrano.info.stranka };
  hlaseni.push(`- **${j.cs.nazev}** – ${vybrano.k.cs || vybrano.k.en || "ručně"}: [${vybrano.k.soubor}](${vybrano.info.stranka}) · ${vybrano.info.licence}`);
  console.log(`${j.id}: ${vybrano.k.soubor} (${Math.round(data.length / 1024)} kB)`);
  await pockej(300);
}
// fotky jazyků, které už fotku nemají, smaž
for (const f of fs.readdirSync(slozka)) if (!fotky[f.replace(/\.jpg$/, "")]) fs.unlinkSync(path.join(slozka, f));
fs.writeFileSync(vystupSoubor, JSON.stringify({ stazeno: new Date().toISOString().slice(0, 10), zdroj: "Wikimedia Commons přes Wikidata (P18)", fotky }, null, 1));
fs.writeFileSync(path.join(KOREN, "data/fotky-hlaseni.md"), `Fotek: ${Object.keys(fotky).length} z ${jazyky.length}\n\n` + hlaseni.join("\n") + "\n");
console.log(`Hotovo: ${Object.keys(fotky).length} fotek z ${jazyky.length} jazyků. Přehled je v data/fotky-hlaseni.md.`);
