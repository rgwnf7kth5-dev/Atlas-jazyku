// Sestaví obě jazykové verze Atlasu jazyků z jedné šablony.
//   node scripts/build.mjs                    → dist/index.html (česky), dist/en/index.html (anglicky)
//   node scripts/build.mjs --artefakt SLOŽKA  → navíc samotné fragmenty pro publikování jako artefakt
// Adresy druhé jazykové verze u artefaktů: proměnné ODKAZ_CS a ODKAZ_EN.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { vyrobStranky } from "./stranky.mjs";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cti = p => fs.readFileSync(path.join(KOREN, p), "utf8");
const json = p => JSON.parse(cti(p));

const jazykyAtlasu = json("data/languages.json");
const nazvyZemi = json("data/country-names.json");
const glottolog = json("data/glottolog.json");
const podrobnosti = json("data/podrobnosti.json");
const rodinyCz = json("data/glottolog-families.cs.json");
const svet = cti("data/countries-110m.json");
const knihovny = ["vendor/d3-array.min.js", "vendor/d3-geo.min.js", "vendor/topojson-client.min.js"].map(cti);
const styly = cti("src/styles.css");
const telo = cti("src/body.html");
const aplikace = cti("src/akvarely.js") + "\n" + cti("src/app.js");   // malované krajiny pohlednic + aplikace
// pojistka: značka nedořešeného konfliktu po sloučení větví tiše vyřadí pravidlo stylu pod ní (stalo se u Dne jazyků)
for (const [soubor, text] of [["src/styles.css", styly], ["src/body.html", telo], ["src/akvarely.js + src/app.js", aplikace]]) {
  const m = text.match(/^(<{7}|={7}|>{7})(\s|$)/m);
  if (m) throw new Error(`V ${soubor} zůstala značka konfliktu po sloučení (${m[1]}).`);
}

const RODINY_EN = { "Isolate": "isolate – no known relatives", "Sign Language": "sign language", "Pidgin": "pidgin",
  "Artificial Language": "constructed language", "Mixed Language": "mixed language", "Speech Register": "speech register" };
/* skupiny Glottologu, které nejsou jazykovou rodinou (jazyky v nich spolu nejsou příbuzné) */
const BEZ_RODU = ["Artificial Language", "Mixed Language", "Pidgin", "Speech Register"];
const opravyPoloh = json("data/polohy-opravy.json");
const nareci = json("data/nareci.json");                 // jména nářečí z Glottologu (scripts/nareci.mjs)
// adresy webu: česká verze na atlasjazyku.cz, anglická na thelanguageatlas.com (dist/en/ servírovaná z kořene).
// Canonical, og:url a og:image musí mířit na tu doménu, na které stránka opravdu leží: Facebook podle og:url stránku
// načte znovu a se starou adresou atlasoflanguages.netlify.app ukazoval odkaz bez obrázku (25. 9. 2026).
const DOMENA = { cs: "https://atlasjazyku.cz", en: "https://thelanguageatlas.com" };
// ověření vlastnictví v Google Search Console (značka HTML), na úvodních stránkách obou domén; kódy nemazat,
// jinak Search Console ověření po čase zruší
const GOOGLE_OVERENI = ["zyKCEYlegO4cJQmz22iaMH9QuphSUalznP-e4iU_Gzg", "R9cFXotbubItuaKstc9NVaT-CoYj0BqfVyLau7QR_GY"];
const WEB = p => p === "/en" || p.startsWith("/en/") ? DOMENA.en + p.slice(3) : DOMENA.cs + p;   // cesta v dist/ → plná adresa
const ikona = cti("static/favicon.svg").trim();
// náhled pro sdílení s otiskem v adrese: X, Facebook a spol. si obrázek pamatují podle adresy, takže po změně
// obrázku by pod odkazem dál ukazovaly starý (uživatel 25. 9. 2026 na X: „pořád ještě ukazuje starou upoutávku“)
// Soubor s otiskem build kopíruje do dist/ i dist/en/, aby ho anglická doména našla i bez zvláštního pravidla.
const NAHLED = Object.fromEntries(["cs", "en"].map(l => [l, `/nahled-${l}.` +
  crypto.createHash("sha256").update("2").update(fs.readFileSync(path.join(KOREN, `static/nahled-${l}.jpg`))).digest("hex").slice(0, 10) + ".jpg"]));
const FONTY = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap";
const escHtml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// data jdou do <script>, proto „<“ zapíšu jako < – řetězec „</script>“ v datech by stránku rozbil
const doSkriptu = hodnota => (typeof hodnota === "string" ? hodnota : JSON.stringify(hodnota)).replace(/</g, "\\u003c");

// texty rozhraní obou jazyků
const UI = {};
for (const l of ["cs", "en"]) UI[l] = json(`src/ui/${l}.json`);
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
  b: glottolog.body.map(b => { const o = opravyPoloh[b[6]]; const r = b.slice(0, 6); if (o && o.poloha) { r[1] = o.poloha[0]; r[2] = o.poloha[1]; } return r; }),
  bp: glottolog.body.map((b, i) => opravyPoloh[b[6]] && opravyPoloh[b[6]].poloha === null ? i : -1).filter(i => i >= 0),   // tečky bez polohy
  nr: BEZ_RODU.map(n => glottolog.rodiny.indexOf(n)).filter(i => i >= 0),
  // znakové jazyky: rodina „Sign Language“ a pár dalších, které Glottolog řadí jinam (Rennellese Sign Language)
  g: glottolog.body.map(b => b[6]),           // glottocode – stálý kód tečky pro odkaz #corn1251
  zn: glottolog.body.flatMap((b, i) => glottolog.rodiny[b[3]] === "Sign Language" || /\bsign language\b/i.test(b[0]) ? [i] : [])
};

/* skript stránky s daty; na webu je jeden pro obě jazykové verze (jazyk si přečte z <html lang>) */
function skriptStranky(vychozi, artefakt) {
  const skript = aplikace
    .replace("/*__UI__*/null", () => doSkriptu(UI))
    .replace('/*__VYCHOZI__*/"cs"', () => vychozi)
    .replace("/*__ARTEFAKT__*/false", () => String(!!artefakt))
    .replace("/*__SVET__*/null", () => doSkriptu(svet))
    .replace("/*__JAZYKY__*/null", () => doSkriptu(JAZYKY))
    .replace("/*__DNY__*/null", () => { const d = json("data/dny-jazyku.json"); delete d._pozn; return doSkriptu(d); })
    .replace("/*__VERZE__*/null", () => doSkriptu({ glottolog: glottolog.stazeno, podrobnosti: podrobnosti.stazeno, wikidata: json("data/wikidata.json").stazeno }))
    .replace("/*__STATY__*/null", () => doSkriptu(nazvyZemi))
    .replace("/*__REJSTRIK__*/null", () => doSkriptu(REJSTRIK))
    .replace("/*__VYMYSLENE__*/null", () => doSkriptu(json("data/vymyslene.json")))
    .replace("/*__KRAJINY__*/null", () => doSkriptu(json("data/krajiny.json")))
    .replace("/*__RELIEF__*/null", () => JSON.stringify("data:image/webp;base64," + fs.readFileSync(path.join(KOREN, "data/relief.webp")).toString("base64")))
    .replace("/*__TYPOLOGIE__*/null", () => { const d = json("data/typologie.json"), p = json("data/typologie-popis.json");   // typologické mapy (WALS)
      return doSkriptu({ oblasti: p.oblasti, vlastnosti: p.vlastnosti.map(function(v, k){ return Object.assign({}, v, d.vlastnosti[k]); }) }); })
    .replace("/*__PODROBNOSTI__*/null", () => doSkriptu({ uzly: podrobnosti.uzly, nad: podrobnosti.nad,
                                                          staty: podrobnosti.staty, udhr: podrobnosti.udhr, mapaStatu: podrobnosti.mapaStatu, pisma: podrobnosti.pisma, atlasCldr: podrobnosti.atlasCldr,
                                                          radky: podrobnosti.radky, vetve: json("data/glottolog-branches.cs.json"),
                                                          nareci: glottolog.body.map(b => nareci[b[6]] || ""), nareciCs: json("data/nareci-cs.json") }));
  // pojistka: rozbitý skript by stránku úplně vyřadil (stalo se při úklidu kódu), proto ho build zkusí přeložit
  try { new Function(skript); } catch (e) { throw new Error(`Skript stránky má chybu syntaxe: ${e.message}`); }
  return skript;
}
// Web: knihovny + aplikace + data v jednom souboru js/atlas.<otisk>.js. Otisk se mění s obsahem, takže ho prohlížeč
// smí držet v mezipaměti natrvalo (_headers) a obě jazykové verze sdílejí jedno stažení. Dřív byl skript (2,3 MB)
// vložený přímo do každé stránky a stahoval se znovu při každé návštěvě i při přechodu mezi / a /en/.
const skriptWebu = knihovny.join("\n;\n") + "\n;\n" +
  // pojistka: na anglické doméně angličtina, i kdyby pravidlo v netlify.toml nevrátilo anglickou stránku
  skriptStranky('document.documentElement.lang === "en" || /(^|\\.)thelanguageatlas\\.com$/.test(location.hostname) ? "en" : "cs"', false);
const souborSkriptu = `js/atlas.${crypto.createHash("sha256").update(skriptWebu).digest("hex").slice(0, 10)}.js`;

function sestav(lang, { odkazJinam, artefakt }) {
  const T = UI[lang];
  const jiny = lang === "cs" ? "en" : "cs";

  const zastupne = { ...T, odkazJinam, jinyKod: jiny };
  let html = telo.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in zastupne)) throw new Error(`V šabloně je {{${k}}}, ale v src/ui/${lang}.json chybí.`);
    return escHtml(zastupne[k]);
  });

  // artefakt musí být jeden soubor, proto v něm zůstává všechno vložené
  const skripty = artefakt
    ? knihovny.map(k => `<script>${k}</script>`).join("\n") + `\n<script>${skriptStranky(JSON.stringify(lang), true)}</script>`
    : `<script src="${lang === "cs" ? "" : "../"}${souborSkriptu}"></script>`;

  const hlavicka =
    `<title>${escHtml(T.nazev)}</title>\n` +
    `<meta name="description" content="${escHtml(T.popis)}">\n` +
    `<meta name="theme-color" content="#FBF9F4" media="(prefers-color-scheme: light)">\n` +
    `<meta name="theme-color" content="#050914" media="(prefers-color-scheme: dark)">\n` +
    `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(ikona)}">\n` +
    // vzhled (podle počítače, nebo podle přepínače) nastavím hned, ať stránka při načtení neblikne
    `<script>(function(){var m=null;try{m=localStorage.getItem("atlas-motiv")}catch(e){}` +
    `if(!m)m=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";` +
    `document.documentElement.setAttribute("data-theme",m)})()</script>\n` +
    `<link rel="preconnect" href="https://fonts.googleapis.com">\n` +
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
    `<link rel="stylesheet" href="${FONTY}">\n` +
    `<style>\n${styly}</style>\n`;

  const fragment = hlavicka + html + "\n" + skripty + "\n";
  // náhled při sdílení odkazu (Facebook, WhatsApp, Messenger…) – jen pro web, artefakt ho nepotřebuje
  const adresa = DOMENA[lang] + "/";
  const sdileni =
    `<link rel="canonical" href="${adresa}">\n` +
    GOOGLE_OVERENI.map(k => `<meta name="google-site-verification" content="${k}">\n`).join("") +
    `<link rel="alternate" hreflang="cs" href="${DOMENA.cs}/">\n<link rel="alternate" hreflang="en" href="${DOMENA.en}/">\n` +
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n` +
    `<meta property="og:type" content="website">\n<meta property="og:url" content="${adresa}">\n` +
    `<meta property="og:title" content="${escHtml(T.nazev)}">\n<meta property="og:description" content="${escHtml(T.popis)}">\n` +
    `<meta property="og:image" content="${DOMENA[lang]}${NAHLED[lang]}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n` +
    `<meta property="og:image:alt" content="${escHtml(T.nahledPopis)}">\n` +
    `<meta property="og:locale" content="${lang === "cs" ? "cs_CZ" : "en_GB"}">\n<meta name="twitter:card" content="summary_large_image">\n` +
    // X bere og: jen jako náhradu; vlastní značky twitter: náhled na X spolehlivěji ukážou
    `<meta name="twitter:title" content="${escHtml(T.nazev)}">\n<meta name="twitter:description" content="${escHtml(T.popis)}">\n` +
    `<meta name="twitter:image" content="${DOMENA[lang]}${NAHLED[lang]}">\n<meta name="twitter:image:alt" content="${escHtml(T.nahledPopis)}">\n`;
  const dokument = `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
    hlavicka + sdileni + `</head>\n<body>\n${html}\n${skripty}\n</body>\n</html>\n`;
  return { fragment, dokument };
}

const argumenty = process.argv.slice(2);
const i = argumenty.indexOf("--artefakt");
const slozkaArtefaktu = i >= 0 ? path.resolve(argumenty[i + 1]) : null;

const cs = sestav("cs", { odkazJinam: "en/index.html", artefakt: false });
const en = sestav("en", { odkazJinam: "../index.html", artefakt: false });
fs.mkdirSync(path.join(KOREN, "dist/en"), { recursive: true });
fs.rmSync(path.join(KOREN, "dist/js"), { recursive: true, force: true });   // starý skript s jiným otiskem pryč
fs.mkdirSync(path.join(KOREN, "dist/js"), { recursive: true });
fs.writeFileSync(path.join(KOREN, "dist", souborSkriptu), skriptWebu);
fs.writeFileSync(path.join(KOREN, "dist/index.html"), cs.dokument);
fs.writeFileSync(path.join(KOREN, "dist/en/index.html"), en.dokument);
fs.cpSync(path.join(KOREN, "static"), path.join(KOREN, "dist"), { recursive: true });   // ikonky a náhledy

// samostatné stránky jazyků, přehled a O datech (scripts/stranky.mjs); staré složky pryč, kdyby se jazyk přejmenoval
for (const d of ["jazyk", "jazyky", "o-datech", "kalendar-jazyku", "navod", "en/language", "en/languages", "en/about-data", "en/language-days", "en/guide"]) fs.rmSync(path.join(KOREN, "dist", d), { recursive: true, force: true });
const polozekSeznamu = JAZYKY.length + glottolog.body.length - new Set(glottolog.body.map(b => b[5]).filter(Boolean)).size;
const { stranky } = vyrobStranky({ KOREN, WEB, NAHLED, UI, jazyky: jazykyAtlasu, glottolog, podrobnosti, nazvyZemi, ikona, fontyOdkaz: FONTY,
  verze: { g: glottolog.body.length, n: polozekSeznamu, glottolog: glottolog.stazeno, podrobnosti: podrobnosti.stazeno, wikidata: json("data/wikidata.json").stazeno },
  dny: json("data/dny-jazyku.json") });

// pro vyhledávače: obě jazykové verze a jejich vzájemné odkazy
const dnes = process.env.DATUM_STAVU || new Date().toISOString().slice(0, 10);
for (const l of ["cs", "en"]) {
  const d = path.join(KOREN, l === "cs" ? "dist" : "dist/en");
  for (const f of fs.readdirSync(d)) if (/^nahled-(cs|en)\.[0-9a-f]{10}\.jpg$/.test(f)) fs.rmSync(path.join(d, f));   // staré otisky pryč
  for (const k of ["cs", "en"]) fs.copyFileSync(path.join(KOREN, `static/nahled-${k}.jpg`), path.join(d, NAHLED[k].slice(1)));
  // každá doména má vlastní robots.txt a sitemap.xml (anglická je v dist/en/, tedy v kořeni thelanguageatlas.com)
  fs.writeFileSync(path.join(d, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${DOMENA[l]}/sitemap.xml\n`);
  fs.writeFileSync(path.join(d, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    [["/", "/en/", "cs"], ["/en/", "/", "en"]].concat(stranky).filter(x => x[2] === l).map(([u, jina]) => {
      const cs = l === "cs" ? u : jina, en = l === "en" ? u : jina;
      return `  <url>\n    <loc>${WEB(u)}</loc>\n    <lastmod>${dnes}</lastmod>\n` +
        `    <xhtml:link rel="alternate" hreflang="cs" href="${WEB(cs)}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${WEB(en)}"/>\n  </url>\n`; }).join("") +
    `</urlset>\n`);
}
// vlastní stránka 404 (Netlify ji vrátí u neexistující adresy), dvojjazyčná a bez skriptů
fs.writeFileSync(path.join(KOREN, "dist/404.html"), `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escHtml(UI.cs.nenalezenaNadpis)} · ${escHtml(UI.cs.nazev)}</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
:root{color-scheme:light dark; --papir:#FBF9F4; --text:#15192B; --text2:#5A6073; --akcent:#D23A2B}
@media (prefers-color-scheme:dark){:root{--papir:#050914; --text:#EAF4FF; --text2:#A3B6D8; --akcent:#E0503F}}
body{margin:0; min-height:100vh; display:grid; place-items:center; background:var(--papir); color:var(--text);
  font:17px/1.5 Georgia,"Times New Roman",serif; padding:24px; box-sizing:border-box; text-align:center}
main{max-width:34rem}
img{width:96px; height:96px}
h1{font-size:2.2rem; margin:18px 0 6px; font-weight:600}
p{margin:0 0 14px; color:var(--text2); font-family:system-ui,sans-serif; font-size:1rem}
a.tl{display:inline-block; margin:6px; padding:11px 20px; border-radius:999px; background:var(--akcent); color:#fff;
  text-decoration:none; font-family:system-ui,sans-serif; font-weight:600}
a.tl:focus-visible{outline:3px solid var(--text); outline-offset:3px}
hr{border:0; border-top:1px solid color-mix(in srgb,var(--text) 15%,transparent); margin:26px auto; width:60%}
</style>
</head>
<body>
<main>
<img src="/favicon.svg" alt="">
<h1>${escHtml(UI.cs.nenalezenaNadpis)}</h1>
<p>${escHtml(UI.cs.nenalezenaText)}</p>
<a class="tl" href="/">${escHtml(UI.cs.nenalezenaZpet)}</a>
<hr>
<div lang="en">
<h1>${escHtml(UI.en.nenalezenaNadpis)}</h1>
<p>${escHtml(UI.en.nenalezenaText)}</p>
<a class="tl" href="/en/">${escHtml(UI.en.nenalezenaZpet)}</a>
</div>
</main>
</body>
</html>
`);
// skript s otiskem v názvu se nikdy nemění, smí zůstat v mezipaměti prohlížeče napořád
fs.writeFileSync(path.join(KOREN, "dist/_headers"), `/js/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + " kB";
console.log(`stránky jazyků: ${stranky.length} (včetně přehledů a O datech)`);
console.log(`dist/index.html (česky) ${kb(cs.dokument)}, dist/en/index.html (anglicky) ${kb(en.dokument)}, dist/${souborSkriptu} ${kb(skriptWebu)}`);

if (slozkaArtefaktu) {
  fs.mkdirSync(slozkaArtefaktu, { recursive: true });
  const acs = sestav("cs", { odkazJinam: process.env.ODKAZ_EN || "#", artefakt: true });
  const aen = sestav("en", { odkazJinam: process.env.ODKAZ_CS || "#", artefakt: true });
  fs.writeFileSync(path.join(slozkaArtefaktu, "atlas-jazyku.html"), acs.fragment);
  fs.writeFileSync(path.join(slozkaArtefaktu, "language-atlas.html"), aen.fragment);
  console.log(`artefakty v ${slozkaArtefaktu}`);
}
