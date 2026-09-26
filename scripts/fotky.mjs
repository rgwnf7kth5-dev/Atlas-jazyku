// Fotky z Wikimedia Commons i s autorem a licencí (Commons je z Claude Code na webu blokované, běží v GitHub Actions).
//   node scripts/fotky.mjs          podle data/fotky-hledat.json → kandidati/ (obrázky + meta.json)
// „hledat“: dotazy pro výběr kandidátů, „soubory“: přesné názvy souborů („File:…“). Bere se jen volná licence
// (CC0, public domain, CC BY, CC BY-SA), ne NC ani ND. Výsledek pushne workflow na větev foto-kandidati.
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const zadani = JSON.parse(fs.readFileSync(path.join(KOREN, "data/fotky-hledat.json"), "utf8"));
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "AtlasJazyku/1.0 (https://atlasjazyku.cz; educational encyclopedic project)";
const CIL = path.join(KOREN, "kandidati");
const SIRKA = zadani.sirka || 1280;
fs.mkdirSync(CIL, { recursive: true });

const pockej = ms => new Promise(r => setTimeout(r, ms));
async function api(parametry) {
  const u = API + "?" + new URLSearchParams({ format: "json", formatversion: "2", ...parametry });
  for (let pokus = 0; pokus < 4; pokus++) {
    const o = await fetch(u, { headers: { "User-Agent": UA } });
    if (o.ok) return o.json();
    await pockej(2000 * (pokus + 1));
  }
  throw new Error("Commons API neodpovídá: " + u);
}
const bezHtml = s => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const volna = l => /^(cc0|public domain|pd\b|cc[ -]by(-sa)?( \d(\.\d)?)?)/i.test(l) && !/nc|nd/i.test(l);

async function info(nazvy) {
  const d = await api({ action: "query", prop: "imageinfo", titles: nazvy.join("|"), iiprop: "url|extmetadata|size|mime", iiurlwidth: String(SIRKA) });
  return (d.query.pages || []).filter(p => p.imageinfo).map(p => ({ title: p.title, ii: p.imageinfo[0] }));
}

const meta = [];
async function uloz(skupina, polozky) {
  let n = 0;
  for (const { title, ii } of polozky) {
    const m = ii.extmetadata || {}, licence = bezHtml(m.LicenseShortName && m.LicenseShortName.value);
    if (!/image\/(jpeg|png|webp)/.test(ii.mime) || !volna(licence)) { console.log(`  přeskakuji (${licence || ii.mime}): ${title}`); continue; }
    const url = ii.thumburl || ii.url;
    const o = await fetch(url, { headers: { "User-Agent": UA } });
    if (!o.ok) { console.log(`  nestaženo ${o.status}: ${title}`); continue; }
    const pripona = ii.mime === "image/png" ? ".png" : ii.mime === "image/webp" ? ".webp" : ".jpg";
    const soubor = `${skupina}/${String(++n).padStart(2, "0")}${pripona}`;
    fs.mkdirSync(path.join(CIL, skupina), { recursive: true });
    fs.writeFileSync(path.join(CIL, soubor), Buffer.from(await o.arrayBuffer()));
    meta.push({ soubor, title, autor: bezHtml(m.Artist && m.Artist.value), licence, licenceUrl: m.LicenseUrl ? m.LicenseUrl.value : "",
      popis: bezHtml(m.ImageDescription && m.ImageDescription.value).slice(0, 400), stranka: ii.descriptionurl, sirka: ii.thumbwidth || ii.width, vyska: ii.thumbheight || ii.height,
      original: [ii.width, ii.height] });
    console.log(`  ${soubor}  ${licence}  ${title}`);
    await pockej(300);
  }
}

for (const dotaz of zadani.hledat || []) {
  const skupina = dotaz.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  console.log(`hledám: ${dotaz}`);
  const d = await api({ action: "query", list: "search", srsearch: dotaz + " filetype:bitmap", srnamespace: "6", srlimit: String(zadani.pocet || 6) });
  const nazvy = (d.query.search || []).map(s => s.title);
  if (nazvy.length) await uloz(skupina, await info(nazvy));
}
if ((zadani.soubory || []).length) {
  console.log("přesné soubory:");
  for (let i = 0; i < zadani.soubory.length; i += 20) await uloz("soubory", await info(zadani.soubory.slice(i, i + 20)));
}
fs.writeFileSync(path.join(CIL, "meta.json"), JSON.stringify(meta, null, 1) + "\n");
console.log(`hotovo: ${meta.length} obrázků`);
