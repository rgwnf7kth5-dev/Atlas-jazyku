// Sestaví obě jazykové verze Atlasu jazyků z jedné šablony.
//   node scripts/build.mjs                    → dist/index.html (česky), dist/en/index.html (anglicky)
//   node scripts/build.mjs --artefakt SLOŽKA  → navíc samotné fragmenty pro publikování jako artefakt
// Adresy druhé jazykové verze u artefaktů: proměnné ODKAZ_CS a ODKAZ_EN.
import fs from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cti = p => fs.readFileSync(path.join(KOREN, p), "utf8");
const json = p => JSON.parse(cti(p));

const jazykyAtlasu = json("data/languages.json");
const nazvyZemi = json("data/country-names.json");
const glottolog = json("data/glottolog.json");
const podrobnosti = json("data/podrobnosti.json");
const rodinyCz = json("data/glottolog-families.cs.json");
const svet = cti("data/countries-110m.json");
const pevnina = json("data/pevnina.json");   // tečky pevniny pro částicový glóbus (scripts/pevnina.mjs)
const knihovny = ["vendor/d3-array.min.js", "vendor/d3-geo.min.js", "vendor/topojson-client.min.js"].map(cti);
const styly = cti("src/styles.css");
const telo = cti("src/body.html");
const aplikace = cti("src/app.js");

const RODINY_EN = { "Isolate": "isolate – no known relatives", "Sign Language": "sign language", "Pidgin": "pidgin" };
const escHtml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// data jdou do <script>, proto „<“ zapíšu jako < – řetězec „</script>“ v datech by stránku rozbil
const doSkriptu = hodnota => (typeof hodnota === "string" ? hodnota : JSON.stringify(hodnota)).replace(/</g, "\\u003c");

// texty rozhraní obou jazyků; {pocet} doplním hned tady
const UI = {};
for (const l of ["cs", "en"]) {
  const ui = json(`src/ui/${l}.json`);
  const pocet = glottolog.body.length.toLocaleString(ui.locale);
  UI[l] = { ...ui, podnadpis: ui.podnadpis.replace("{pocet}", pocet), legenda: ui.legenda.replace("{pocet}", pocet) };
}
// každá stránka nese oba jazyky, aby šlo přepnout na místě (bez nového listu a bez ztráty výběru)
const JAZYKY = jazykyAtlasu.map(j => {
  const t = {};
  for (const l of ["cs", "en"]) {
    const p = j[l];
    t[l] = { n: p.nazev, prep: p.vyslovnost, rod: p.rodina, fakt: p.fakt };
    if (p.pozdrav) t[l].pis = p.pozdrav;
  }
  return { id: j.id, sk: j.skupina, pis0: j.pozdrav, dom: j.domaci, mlu: j.mluvcich, kod: j.kod,
           stred: j.stred, zeme: j.zeme, ob: j.areal, t };
});
const REJSTRIK = {
  r: { cs: glottolog.rodiny.map(r => rodinyCz[r] || r), en: glottolog.rodiny.map(r => RODINY_EN[r] || r) },
  m: { cs: glottolog.makro.map(m => (m && UI.cs.makro[m]) || ""), en: glottolog.makro.map(m => (m && UI.en.makro[m]) || "") },
  b: glottolog.body.map(b => b.slice(0, 6))   // 7. pole (glottocode) stránka nepotřebuje
};

function sestav(lang, { odkazJinam, artefakt }) {
  const T = UI[lang];
  const jiny = lang === "cs" ? "en" : "cs";

  const zastupne = { ...T, odkazJinam, jinyKod: jiny };
  let html = telo.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in zastupne)) throw new Error(`V šabloně je {{${k}}}, ale v src/ui/${lang}.json chybí.`);
    return escHtml(zastupne[k]);
  });

  const skript = aplikace
    .replace("/*__UI__*/null", () => doSkriptu(UI))
    .replace('/*__VYCHOZI__*/"cs"', () => JSON.stringify(lang))
    .replace("/*__ARTEFAKT__*/false", () => String(!!artefakt))
    .replace("/*__SVET__*/null", () => doSkriptu(svet))
    .replace("/*__PEVNINA__*/null", () => doSkriptu(pevnina))
    .replace("/*__JAZYKY__*/null", () => doSkriptu(JAZYKY))
    .replace("/*__STATY__*/null", () => doSkriptu(nazvyZemi))
    .replace("/*__REJSTRIK__*/null", () => doSkriptu(REJSTRIK))
    .replace("/*__PODROBNOSTI__*/null", () => doSkriptu({ wals: podrobnosti.wals, uzly: podrobnosti.uzly, nad: podrobnosti.nad,
                                                          staty: podrobnosti.staty, udhr: podrobnosti.udhr, radky: podrobnosti.radky }));
  const skripty = knihovny.map(k => `<script>${k}</script>`).join("\n") + `\n<script>${skript}</script>`;

  const hlavicka =
    `<title>${escHtml(T.nazev)}</title>\n` +
    `<meta name="description" content="${escHtml(T.popis)}">\n` +
    `<meta name="theme-color" content="#02030A">\n` +
    // denní vzhled nastavím hned, ať stránka při načtení neblikne tmou
    `<script>try{if(localStorage.getItem("atlas-motiv")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}</script>\n` +
    `<link rel="preconnect" href="https://fonts.googleapis.com">\n` +
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap">\n` +
    `<style>\n${styly}</style>\n`;

  const fragment = hlavicka + html + "\n" + skripty + "\n";
  const dokument = `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
    hlavicka + `</head>\n<body>\n${html}\n${skripty}\n</body>\n</html>\n`;
  return { fragment, dokument };
}

const argumenty = process.argv.slice(2);
const i = argumenty.indexOf("--artefakt");
const slozkaArtefaktu = i >= 0 ? path.resolve(argumenty[i + 1]) : null;

const cs = sestav("cs", { odkazJinam: "en/index.html", artefakt: false });
const en = sestav("en", { odkazJinam: "../index.html", artefakt: false });
fs.mkdirSync(path.join(KOREN, "dist/en"), { recursive: true });
fs.writeFileSync(path.join(KOREN, "dist/index.html"), cs.dokument);
fs.writeFileSync(path.join(KOREN, "dist/en/index.html"), en.dokument);
const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + " kB";
console.log(`dist/index.html (česky) ${kb(cs.dokument)}, dist/en/index.html (anglicky) ${kb(en.dokument)}`);

if (slozkaArtefaktu) {
  fs.mkdirSync(slozkaArtefaktu, { recursive: true });
  const acs = sestav("cs", { odkazJinam: process.env.ODKAZ_EN || "#", artefakt: true });
  const aen = sestav("en", { odkazJinam: process.env.ODKAZ_CS || "#", artefakt: true });
  fs.writeFileSync(path.join(slozkaArtefaktu, "atlas-jazyku.html"), acs.fragment);
  fs.writeFileSync(path.join(slozkaArtefaktu, "language-atlas.html"), aen.fragment);
  console.log(`artefakty v ${slozkaArtefaktu}`);
}
