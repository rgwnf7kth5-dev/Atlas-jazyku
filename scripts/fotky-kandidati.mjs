// Kandidáti na fotky pohlednic: pro každý jazyk až 8 fotek z Wikimedia Commons → data/fotky-kandidati.json
//   node scripts/fotky-kandidati.mjs
// Hledá se jen mezi „kvalitními obrázky“ Commons (Category:Quality images – prošly hodnocením komunity)
// uvnitř kategorie místa (deepcat), takže fotka je opravdu z místa, odkud jazyk pochází;
// na šířku, aspoň 1600 px, se svobodnou licencí. Hledaný výraz je místo, odkud jazyk pochází:
// kategorie místa na Commons: ruční „kategorie“ z data/fotky-opravy.json, jinak P373 místa z Wikidat (P2341, jinak P17).
// Z kandidátů pak vybírá scripts/fotky.mjs (výchozí první, ručně „vyber“: pořadí v seznamu).
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const UA = "AtlasJazyku/1.0 (https://github.com/rgwnf7kth5-dev/atlas-jazyku; educational project for children)";
const json = f => JSON.parse(fs.readFileSync(path.join(KOREN, f), "utf8"));
const jazyky = json("data/languages.json"), glottolog = json("data/glottolog.json"), wikidata = json("data/wikidata.json").zaznamy;
const opravy = fs.existsSync(path.join(KOREN, "data/fotky-opravy.json")) ? json("data/fotky-opravy.json") : {};
const pockej = ms => new Promise(r => setTimeout(r, ms));
async function stahni(url) {
  for (let pokus = 1; pokus <= 5; pokus++) {
    try {
      const o = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(90000) });
      if (o.ok) return o.json();
      console.log(`  HTTP ${o.status}, pokus ${pokus}`);
    } catch (e) { console.log(`  ${e.message}, pokus ${pokus}`); }
    await pockej(4000 * pokus);
  }
  throw new Error("Nepodařilo se stáhnout " + url);
}

/* místo jazyka z Wikidat (anglický název), nejbližší středu jazyka v atlasu */
const glottoPodleId = {};
for (const b of glottolog.body) if (b[5] && !glottoPodleId[b[5]]) glottoPodleId[b[5]] = b[6];
const qJazyka = {};
for (const j of jazyky) {
  const q = (opravy[j.id] && opravy[j.id].jazyk) || (wikidata[glottoPodleId[j.id]] || {}).q;
  if (q) qJazyka[j.id] = "Q" + String(q).replace(/^Q/, "");
}
async function polozky(qs) {
  const v = {}, s = [...new Set(qs)];
  for (let i = 0; i < s.length; i += 50) {
    const d = await stahni("https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=en&ids=" + s.slice(i, i + 50).join("|"));
    Object.assign(v, d.entities || {}); await pockej(300);
  }
  return v;
}
const hodnoty = (e, p) => ((e && e.claims && e.claims[p]) || []).filter(c => c.rank !== "deprecated" && c.mainsnak.datavalue).map(c => c.mainsnak.datavalue.value);
const jp = await polozky(Object.values(qJazyka));
const mistaJ = {};
for (const [id, q] of Object.entries(qJazyka)) mistaJ[id] = [...hodnoty(jp[q], "P2341").map(v => [v.id, 1]), ...hodnoty(jp[q], "P17").map(v => [v.id, 2])];
const mp = await polozky(Object.values(mistaJ).flat().map(m => m[0]));
function vzdalenost(a, b) {
  if (!a || !b) return 1e9;
  const R = Math.PI / 180;
  return Math.acos(Math.min(1, Math.sin(a[1] * R) * Math.sin(b[1] * R) + Math.cos(a[1] * R) * Math.cos(b[1] * R) * Math.cos((a[0] - b[0]) * R)));
}
/* místo = kategorie na Commons (P373), ve které se hledá; ruční „kategorie“ v opravách má přednost */
function misto(j) {
  const o = opravy[j.id] || {};
  if (o.kategorie) return o.kategorie;
  const m = (mistaJ[j.id] || []).map(([q, typ]) => {
    const e = mp[q], s = hodnoty(e, "P625")[0];
    return { kat: hodnoty(e, "P373")[0], typ, d: vzdalenost(s ? [s.longitude, s.latitude] : null, j.stred) };
  }).filter(x => x.kat).sort((a, b) => a.typ - b.typ || a.d - b.d)[0];
  return m ? m.kat : null;
}

const SVOBODNA = /^(CC0|CC[ -]BY(-SA)?( \d(\.\d)?)?|Public domain|PD\b)/i;
const NE = /\b(map|mapa|flag|coat of arms|locator|logo|seal|emblem|portrait|interior|inside|detail|macro|museum|insect|bird|flower|food|car|cars|vehicle|automobile|bus|train|locomotive|aircraft|airplane|ship|boat|statue|sculpture|grave|tomb|church interior|altar|organ|fresco|painting)\b/i;
async function hledej(dotaz) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=40" +
    "&gsrsearch=" + encodeURIComponent(dotaz) + "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=330";
  const d = await stahni(u);
  const stranky = Object.values((d.query && d.query.pages) || {}).sort((a, b) => a.index - b.index);
  const v = [];
  for (const s of stranky) {
    const ii = s.imageinfo && s.imageinfo[0];
    if (!ii || !/jpeg/.test(ii.mime)) continue;
    const soubor = s.title.replace(/^File:/, "");
    const m = ii.extmetadata || {}, txt = k => (m[k] && m[k].value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (NE.test(soubor) || ii.width < 1600 || ii.width < ii.height * 1.25 || !SVOBODNA.test(txt("LicenseShortName"))) continue;
    v.push({ soubor, sirka: ii.width, vyska: ii.height, licence: txt("LicenseShortName"), nahled: ii.thumburl });
  }
  return v;
}

// už nalezené kandidáty neměň (ruční „vyber“ ukazuje na pořadí v seznamu); znovu jen s --znovu nebo po změně „hledat“
const soubor = path.join(KOREN, "data/fotky-kandidati.json");
const vystup = fs.existsSync(soubor) && !process.argv.includes("--znovu") ? JSON.parse(fs.readFileSync(soubor, "utf8")) : {};
for (const j of jazyky) {
  if (vystup[j.id] && !(opravy[j.id] && opravy[j.id].kategorie && opravy[j.id].kategorie !== vystup[j.id].hledano)) continue;
  const kde = misto(j);
  if (!kde) { console.log(`${j.id}: bez místa`); continue; }
  const videne = new Set(), kandidati = [];
  // jen kvalitní fotky uvnitř kategorie místa (deepcat projde i podkategorie): fotka je opravdu odtamtud
  const kat = `deepcat:"${kde.replace(/"/g, "")}" incategory:Quality_images`;
  for (const dotaz of [`landscape ${kat}`, `(view OR panorama OR mountains OR village OR coast OR valley) ${kat}`, kat]) {
    for (const k of await hledej(dotaz)) if (!videne.has(k.soubor) && kandidati.length < 8) { videne.add(k.soubor); kandidati.push(k); }
    await pockej(400);
    if (kandidati.length >= 8) break;
  }
  vystup[j.id] = { hledano: kde, kandidati };
  console.log(`${j.id}: ${kde} → ${kandidati.length} kandidátů`);
}
fs.writeFileSync(soubor, JSON.stringify(vystup, null, 1));
