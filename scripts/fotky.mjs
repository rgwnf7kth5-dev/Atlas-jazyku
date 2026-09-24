// Fotky na pohlednice jazyků z Wikimedia Commons → static/fotky/<id>.jpg a data/fotky.json (autor, licence, zdroj)
//   node scripts/fotky.mjs            stáhne chybějící nebo změněné fotky
//   node scripts/fotky.mjs --znovu    stáhne všechny znovu
// Spouští se v GitHub Actions (.github/workflows/fotky.yml), z prostředí Claude Code je Wikimedia blokovaná.
//
// Kandidáty připraví scripts/fotky-kandidati.mjs (kvalitní fotky místa, odkud jazyk pochází).
// Vybere se první, ruční volba je v data/fotky-opravy.json: {"id": {"vyber": 3}} (pořadí kandidáta od 0),
// {"id": {"soubor": "Název.jpg"}} (konkrétní soubor z Commons) nebo {"id": {"bez": "důvod"}} (bez fotky).
// Pozn.: hlavní obrázky míst z Wikidat (P18) se neosvědčily – byly mezi nimi mapy, vlajky a satelitní snímky.
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const UA = "AtlasJazyku/1.0 (https://github.com/rgwnf7kth5-dev/atlas-jazyku; educational project for children)";
const SIRKA = 960;                                   // standardní šířka náhledu na Commons
const ZNOVU = process.argv.includes("--znovu");
const json = f => JSON.parse(fs.readFileSync(path.join(KOREN, f), "utf8"));

const jazyky = json("data/languages.json"), kandidati = json("data/fotky-kandidati.json");
const opravy = fs.existsSync(path.join(KOREN, "data/fotky-opravy.json")) ? json("data/fotky-opravy.json") : {};
const vystupSoubor = path.join(KOREN, "data/fotky.json");
const stare = fs.existsSync(vystupSoubor) ? json("data/fotky.json").fotky : {};
const slozka = path.join(KOREN, "static/fotky");
fs.mkdirSync(slozka, { recursive: true });

const pockej = ms => new Promise(r => setTimeout(r, ms));
async function stahni(url, jako = "json") {
  for (let pokus = 1; pokus <= 5; pokus++) {
    try {
      const o = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(90000) });
      if (o.ok) return jako === "json" ? o.json() : Buffer.from(await o.arrayBuffer());
      console.log(`  HTTP ${o.status} (${url.slice(0, 90)}…), pokus ${pokus}`);
      if (o.status === 404) return null;
    } catch (e) { console.log(`  ${e.message}, pokus ${pokus}`); }
    await pockej(4000 * pokus);
  }
  throw new Error("Nepodařilo se stáhnout " + url);
}
async function infoSouboru(soubor) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata" +
    `&iiurlwidth=${SIRKA}&titles=` + encodeURIComponent("File:" + soubor);
  const d = await stahni(u);
  const s = d && Object.values(d.query.pages)[0];
  const ii = s && s.imageinfo && s.imageinfo[0];
  if (!ii) return null;
  const m = ii.extmetadata || {}, txt = k => (m[k] && m[k].value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return { nahled: ii.thumburl, stranka: ii.descriptionurl, autor: txt("Artist") || txt("Credit"),
    licence: txt("LicenseShortName"), licenceUrl: txt("LicenseUrl") };
}

const fotky = {}, hlaseni = [];
for (const j of jazyky) {
  const o = opravy[j.id] || {}, k = kandidati[j.id];
  if (o.bez) { hlaseni.push(`- **${j.cs.nazev}** – bez fotky (${o.bez})`); continue; }
  const soubor = o.soubor || ((k && k.kandidati[o.vyber || 0]) || {}).soubor;
  if (!soubor) { hlaseni.push(`- **${j.cs.nazev}** – bez fotky (žádný kandidát pro „${k ? k.hledano : "?"}“)`); continue; }
  const cil = path.join(slozka, j.id + ".jpg");
  if (!ZNOVU && stare[j.id] && stare[j.id].nazev === soubor && fs.existsSync(cil)) { fotky[j.id] = stare[j.id]; continue; }
  const info = await infoSouboru(soubor);
  if (!info || !info.nahled) { hlaseni.push(`- **${j.cs.nazev}** – soubor ${soubor} na Commons není`); continue; }
  const data = await stahni(info.nahled, "buffer");
  fs.writeFileSync(cil, data);
  fotky[j.id] = { soubor: "fotky/" + j.id + ".jpg", nazev: soubor, misto: k ? k.hledano : null,
    autor: info.autor || "neznámý autor", licence: info.licence, licenceUrl: info.licenceUrl || null, zdroj: info.stranka };
  console.log(`${j.id}: ${soubor} (${Math.round(data.length / 1024)} kB)`);
  await pockej(300);
}
for (const [id, f] of Object.entries(fotky)) hlaseni.push(`- **${jazyky.find(j => j.id === id).cs.nazev}** – ${f.misto || ""}: [${f.nazev}](${f.zdroj}) · ${f.licence}`);
for (const f of fs.readdirSync(slozka)) if (!fotky[f.replace(/\.jpg$/, "")]) fs.unlinkSync(path.join(slozka, f));
fs.writeFileSync(vystupSoubor, JSON.stringify({ stazeno: new Date().toISOString().slice(0, 10), zdroj: "Wikimedia Commons (kvalitní obrázky)", fotky }, null, 1));
fs.writeFileSync(path.join(KOREN, "data/fotky-hlaseni.md"), `Fotek: ${Object.keys(fotky).length} z ${jazyky.length}\n\n` + hlaseni.join("\n") + "\n");
console.log(`Hotovo: ${Object.keys(fotky).length} fotek z ${jazyky.length} jazyků.`);
