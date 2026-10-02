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
/* česká jména teček, která doplňují nebo opravují CLDR a Wikidata (data/jazyky-cs.json); platí pro aplikaci i statické stránky */
{ const jm = json("data/jazyky-cs.json"), kde = new Map(glottolog.body.map((b, i) => [b[6], i]));
  for (const [k, v] of Object.entries(jm)) if (!k.startsWith("_") && kde.has(k)) podrobnosti.radky[kde.get(k)][9] = v; }
const rodinyCz = json("data/glottolog-families.cs.json");
/* jazyky webu: čeština a angličtina jsou úplné; další (italština od 2. 10. 2026) se doplňují postupně a co v nich chybí,
   bere se z angličtiny – texty rozhraní po klíčích (spoj), data v prohlížeči (doplnJazyky v app.js) */
const JAZYKY_WEBU = ["cs", "en", "it"];
const DALSI = JAZYKY_WEBU.filter(l => l !== "cs" && l !== "en");
const NAZVY = Object.fromEntries(DALSI.map(l => [l, json(`data/nazvy-${l}.json`)]));          // státy, písma, jazyky (scripts/nazvy.mjs)
const RODINY = Object.fromEntries(DALSI.map(l => [l, json(`data/glottolog-families.${l}.json`)]));
/* hluboké spojení: klíče z „nad“ přepíšou „pod“, chybějící zůstanou z „pod“ (anglické texty místo chybějícího překladu) */
const spoj = (pod, nad) => {
  if (nad === undefined) return pod;
  if (!pod || typeof pod !== "object" || Array.isArray(pod) || !nad || typeof nad !== "object" || Array.isArray(nad)) return nad;
  const v = { ...pod };
  for (const k of Object.keys(nad)) v[k] = spoj(pod[k], nad[k]);
  return v;
};
const svet = cti("data/countries-110m.json");
const knihovny = ["vendor/d3-array.min.js", "vendor/d3-geo.min.js", "vendor/topojson-client.min.js"].map(cti);
const styly = cti("src/styles.css") + "\n" + cti("src/starovek.css");   // + stránky o civilizacích starověku
const telo = cti("src/body.html");
const aplikace = cti("src/akvarely.js") + "\n" + cti("src/starovek.js") + "\n" + cti("src/app.js");   // malované krajiny pohlednic + šablona stránek o civilizacích + aplikace
// pojistka: značka nedořešeného konfliktu po sloučení větví tiše vyřadí pravidlo stylu pod ní (stalo se u Dne jazyků)
for (const [soubor, text] of [["src/styles.css + src/starovek.css", styly], ["src/body.html", telo], ["src/akvarely.js + src/starovek.js + src/app.js", aplikace]]) {
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
const DOMENA = { cs: "https://atlasjazyku.cz", en: "https://thelanguageatlas.com", it: "https://thelanguageatlas.com/it" };   // italština na anglické doméně v /it/ (dist/it/)
// ověření vlastnictví v Google Search Console (značka HTML), na úvodních stránkách obou domén; kódy nemazat,
// jinak Search Console ověření po čase zruší
const GOOGLE_OVERENI = ["zyKCEYlegO4cJQmz22iaMH9QuphSUalznP-e4iU_Gzg", "R9cFXotbubItuaKstc9NVaT-CoYj0BqfVyLau7QR_GY"];
const WEB = p => p === "/en" || p.startsWith("/en/") ? DOMENA.en + p.slice(3) : p.startsWith("/it/") ? DOMENA.en + p : DOMENA.cs + p;   // cesta v dist/ → plná adresa
const ikona = cti("static/favicon.svg").trim();
// náhled pro sdílení s otiskem v adrese: X, Facebook a spol. si obrázek pamatují podle adresy, takže po změně
// obrázku by pod odkazem dál ukazovaly starý (uživatel 25. 9. 2026 na X: „pořád ještě ukazuje starou upoutávku“)
// Soubor s otiskem build kopíruje do dist/ i dist/en/, aby ho anglická doména našla i bez zvláštního pravidla.
const NAHLED = Object.fromEntries(["cs", "en"].map(l => [l, `/nahled-${l}.` +
  crypto.createHash("sha256").update("2").update(fs.readFileSync(path.join(KOREN, `static/nahled-${l}.jpg`))).digest("hex").slice(0, 10) + ".jpg"]));
for (const l of DALSI) NAHLED[l] = NAHLED.en;   // vlastní obrázek pro sdílení zatím nemají (anglický je bez textu v jazyce)
const FONTY = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap";
const escHtml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// data jdou do <script>, proto „<“ zapíšu jako < – řetězec „</script>“ v datech by stránku rozbil
const doSkriptu = hodnota => (typeof hodnota === "string" ? hodnota : JSON.stringify(hodnota)).replace(/</g, "\\u003c");

// texty rozhraní obou jazyků
const UI = {};
for (const l of ["cs", "en"]) UI[l] = json(`src/ui/${l}.json`);
for (const l of DALSI) UI[l] = spoj(UI.en, json(`src/ui/${l}.json`));
// každá stránka nese oba jazyky, aby šlo přepnout na místě (bez nového listu a bez ztráty výběru)
const JAZYKY = jazykyAtlasu.map(j => {
  const t = {};
  for (const l of JAZYKY_WEBU) {
    const p = spoj(j.en, j[l]);
    t[l] = { n: p.nazev, prep: p.vyslovnost, rod: p.rodina, fakt: p.fakt };
    if (p.pozdrav) t[l].pis = p.pozdrav;
  }
  return { id: j.id, sk: j.skupina, pis0: j.pozdrav, dom: j.domaci, mlu: j.mluvcich, kod: j.kod,
           stred: j.stred, zeme: j.zeme, ob: j.areal, t };
});
const REJSTRIK = {
  r: { cs: glottolog.rodiny.map(r => rodinyCz[r] || r), en: glottolog.rodiny.map(r => RODINY_EN[r] || r),
       ...Object.fromEntries(DALSI.map(l => [l, glottolog.rodiny.map(r => RODINY[l][r] || RODINY_EN[r] || r)])) },
  m: Object.fromEntries(JAZYKY_WEBU.map(l => [l, glottolog.makro.map(m => (m && UI[l].makro[m]) || "")])),
  b: glottolog.body.map(b => { const o = opravyPoloh[b[6]]; const r = b.slice(0, 6); if (o && o.poloha) { r[1] = o.poloha[0]; r[2] = o.poloha[1]; } return r; }),
  bp: glottolog.body.map((b, i) => opravyPoloh[b[6]] && opravyPoloh[b[6]].poloha === null ? i : -1).filter(i => i >= 0),   // tečky bez polohy
  nr: BEZ_RODU.map(n => glottolog.rodiny.indexOf(n)).filter(i => i >= 0),
  // znakové jazyky: rodina „Sign Language“ a pár dalších, které Glottolog řadí jinam (Rennellese Sign Language)
  g: glottolog.body.map(b => b[6]),           // glottocode – stálý kód tečky pro odkaz #corn1251
  zn: glottolog.body.flatMap((b, i) => glottolog.rodiny[b[3]] === "Sign Language" || /\bsign language\b/i.test(b[0]) ? [i] : [])
};

/* stránky o civilizacích starověku: na webu fotky ze static/starovek/<id>/ (a menší verze -720.jpg),
   v artefaktu (jeden soubor) vložené malé verze z artefakt/starovek/ (scripts/fotky-artefakt.py) jako data: adresy –
   s verzemi -720 by artefakt přesáhl limit 16 MB */
const STAROVEK = json("data/starovek.json");
function starovekDoSkriptu(artefakt) {
  const foto = {}, nahled = {};
  for (const c of STAROVEK.civilizace) {
    const soubor = path.join(KOREN, `static/starovek/${c.id}/nahled.jpg`);
    nahled[c.id] = artefakt ? "data:image/jpeg;base64," + fs.readFileSync(soubor).toString("base64") : `/starovek/${c.id}/nahled.jpg`;
    if (!artefakt) { foto[c.id] = { zaklad: `/starovek/${c.id}/` }; continue; }
    foto[c.id] = Object.fromEntries(Object.keys(c.fotky).map(k => [k, "data:image/jpeg;base64," + fs.readFileSync(path.join(KOREN, `artefakt/starovek/${c.id}/${k}.jpg`)).toString("base64")]));
  }
  return { civilizace: STAROVEK.civilizace, foto, nahled };
}
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
    .replace("/*__STATY__*/null", () => doSkriptu({ ...nazvyZemi, ...Object.fromEntries(DALSI.map(l => [l, NAZVY[l].zeme])) }))
    .replace("/*__REJSTRIK__*/null", () => doSkriptu(REJSTRIK))
    .replace("/*__VYMYSLENE__*/null", () => doSkriptu(json("data/vymyslene.json")))
    .replace("/*__STAROVEK__*/null", () => doSkriptu(starovekDoSkriptu(artefakt)))
    .replace("/*__IKONY__*/null", () => doSkriptu(Object.fromEntries(   // obrázky medailonů pod glóbem a náhledy map v okně Mapy (mapa-<id>)
      ["starovek", "pribehy", "rodokmen", "mapy", "vitalita"].map(k => ["ikony/" + k, k])
        .concat(fs.readdirSync(path.join(KOREN, "static/mapy")).filter(f => f.endsWith(".jpg")).map(f => ["mapy/" + f.slice(0, -4), "mapa-" + f.slice(0, -4)]))
        .map(([soubor, k]) => [k, artefakt ? "data:image/jpeg;base64," + fs.readFileSync(path.join(KOREN, `static/${soubor}.jpg`)).toString("base64") : `/${soubor}.jpg`]))))
    .replace("/*__CESTY__*/null", () => doSkriptu(json("data/cesty-slov.json").slova))
    .replace("/*__PUTOVANI__*/null", () => doSkriptu(json("data/putovani.json").jazyky   // putování jazyka na glóbu; "koncept": true = čeká na ověření,
      .filter(j => !j.koncept || process.env.PUT_KONCEPTY)))                              //   do webu jde jen s PUT_KONCEPTY=1 (náhled)
    // cesty slov na glóbu (Příběhy)
    .replace("/*__PISMA__*/null", () => doSkriptu(json("data/pisma.json").pisma))   // vrstva Písma světa
    .replace("/*__KRAJINY__*/null", () => doSkriptu(json("data/krajiny.json")))
    .replace("/*__RELIEF__*/null", () => JSON.stringify("data:image/webp;base64," + fs.readFileSync(path.join(KOREN, "data/relief.webp")).toString("base64")))
    .replace("/*__TYPOLOGIE__*/null", () => { const d = json("data/typologie.json"), p = json("data/typologie-popis.json");   // typologické mapy (WALS)
      return doSkriptu({ oblasti: p.oblasti, vlastnosti: p.vlastnosti.map(function(v, k){ return Object.assign({}, v, d.vlastnosti[k]); }) }); })
    .replace("/*__PODROBNOSTI__*/null", () => doSkriptu({ uzly: podrobnosti.uzly, nad: podrobnosti.nad,
                                                          staty: { ...podrobnosti.staty, ...Object.fromEntries(DALSI.map(l => [l, NAZVY[l].staty])) }, udhr: podrobnosti.udhr, mapaStatu: podrobnosti.mapaStatu,
                                                          pisma: { ...podrobnosti.pisma, ...Object.fromEntries(DALSI.map(l => [l, { ...podrobnosti.pisma.en, ...NAZVY[l].pisma }])) }, atlasCldr: podrobnosti.atlasCldr,
                                                          // jména teček v dalších jazycích: index tečky → jméno (CLDR); bez jména zůstane anglické z Glottologu
                                                          nazvy: Object.fromEntries(DALSI.map(l => [l, Object.fromEntries(glottolog.body.map((b, i) => [i, NAZVY[l].jazyky[b[6]]]).filter(x => x[1]))])),
                                                          radky: podrobnosti.radky, vetve: json("data/glottolog-branches.cs.json"),
                                                          vetveJ: Object.fromEntries(DALSI.map(l => [l, json(`data/glottolog-branches.${l}.json`)])),   // názvy větví v dalších jazycích
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
  skriptStranky(`${JSON.stringify(DALSI)}.indexOf(document.documentElement.lang) >= 0 ? document.documentElement.lang : ` +
    'document.documentElement.lang === "en" || /(^|\\.)thelanguageatlas\\.com$/.test(location.hostname) ? "en" : "cs"', false);
const souborSkriptu = `js/atlas.${crypto.createHash("sha256").update(skriptWebu).digest("hex").slice(0, 10)}.js`;

const LOCALE = { cs: "cs_CZ", en: "en_GB", it: "it_IT" };
function sestav(lang, { odkazy, artefakt }) {
  const T = UI[lang];
  // přepínač jazyků v záhlaví: odkaz na každou verzi (aktuální označí skript)
  const zastupne = { ...T, odkazCs: odkazy.cs, odkazEn: odkazy.en, odkazIt: odkazy.it };
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
    JAZYKY_WEBU.map(l => `<link rel="alternate" hreflang="${l}" href="${DOMENA[l]}/">\n`).join("") +
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n` +
    `<meta property="og:type" content="website">\n<meta property="og:url" content="${adresa}">\n` +
    `<meta property="og:title" content="${escHtml(T.nazev)}">\n<meta property="og:description" content="${escHtml(T.popis)}">\n` +
    `<meta property="og:image" content="${DOMENA[lang]}${NAHLED[lang]}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n` +
    `<meta property="og:image:alt" content="${escHtml(T.nahledPopis)}">\n` +
    `<meta property="og:locale" content="${LOCALE[lang]}">\n<meta name="twitter:card" content="summary_large_image">\n` +
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

const cs = sestav("cs", { odkazy: { cs: "index.html", en: "en/index.html", it: "it/index.html" }, artefakt: false });
const en = sestav("en", { odkazy: { cs: "../index.html", en: "index.html", it: "../it/index.html" }, artefakt: false });
const dalsi = Object.fromEntries(DALSI.map(l => [l, sestav(l, { odkazy: { cs: "../index.html", en: "../en/index.html", [l]: "index.html", ...Object.fromEntries(DALSI.filter(x => x !== l).map(x => [x, `../${x}/index.html`])) }, artefakt: false })]));
fs.mkdirSync(path.join(KOREN, "dist/en"), { recursive: true });
for (const l of DALSI) fs.mkdirSync(path.join(KOREN, "dist", l), { recursive: true });
fs.rmSync(path.join(KOREN, "dist/js"), { recursive: true, force: true });   // starý skript s jiným otiskem pryč
fs.mkdirSync(path.join(KOREN, "dist/js"), { recursive: true });
fs.writeFileSync(path.join(KOREN, "dist", souborSkriptu), skriptWebu);
fs.writeFileSync(path.join(KOREN, "dist/index.html"), cs.dokument);
fs.writeFileSync(path.join(KOREN, "dist/en/index.html"), en.dokument);
for (const l of DALSI) fs.writeFileSync(path.join(KOREN, `dist/${l}/index.html`), dalsi[l].dokument);
for (const d of ["starovek", "en/ancient", "pribehy", "en/stories", "it/antichita", "it/storie"]) fs.rmSync(path.join(KOREN, "dist", d), { recursive: true, force: true });   // stránky o civilizacích (fotky se zkopírují znovu)
fs.cpSync(path.join(KOREN, "static"), path.join(KOREN, "dist"), { recursive: true });   // ikonky, náhledy, fotky civilizací

// samostatné stránky jazyků, přehled a O datech (scripts/stranky.mjs); staré složky pryč, kdyby se jazyk přejmenoval
for (const d of ["jazyk", "jazyky", "o-datech", "kalendar-jazyku", "navod", "en/language", "en/languages", "en/about-data", "en/language-days", "en/guide",
  "it/lingua", "it/lingue", "it/sui-dati", "it/giornate-delle-lingue", "it/guida", "it/vitalita"]) fs.rmSync(path.join(KOREN, "dist", d), { recursive: true, force: true });
const polozekSeznamu = JAZYKY.length + glottolog.body.length - new Set(glottolog.body.map(b => b[5]).filter(Boolean)).size;
/* statické stránky dalších jazyků: data {cs, en} doplněná o chybějící překlad z angličtiny (stejně jako doplnJazyky v app.js) */
const doplnJ = o => {
  if (Array.isArray(o)) { o.forEach(doplnJ); return o; }
  if (!o || typeof o !== "object") return o;
  const jaz = "cs" in o && "en" in o;
  if (jaz) for (const l of DALSI) o[l] = spoj(o.en, o[l]);
  for (const k of Object.keys(o)) if (!(jaz && JAZYKY_WEBU.includes(k))) doplnJ(o[k]);
  return o;
};
const { stranky } = vyrobStranky({ KOREN, WEB, NAHLED, UI, JAZYKY_WEBU,
  jmenoTecky: (i, lang) => (lang === "cs" ? podrobnosti.radky[i][9] : NAZVY[lang] ? NAZVY[lang].jazyky[glottolog.body[i][6]] : "") || glottolog.body[i][0],
  rodinyJ: RODINY,
  jazyky: jazykyAtlasu.map(j => ({ ...j, ...Object.fromEntries(DALSI.map(l => [l, spoj(j.en, j[l])])) })), glottolog,
  podrobnosti: { ...podrobnosti, staty: { ...podrobnosti.staty, ...Object.fromEntries(DALSI.map(l => [l, NAZVY[l].staty])) },
    pisma: { ...podrobnosti.pisma, ...Object.fromEntries(DALSI.map(l => [l, { ...podrobnosti.pisma.en, ...NAZVY[l].pisma }])) } },
  nazvyZemi: { ...nazvyZemi, ...Object.fromEntries(DALSI.map(l => [l, NAZVY[l].zeme])) }, ikona, fontyOdkaz: FONTY,
  verze: { g: glottolog.body.length, n: polozekSeznamu, glottolog: glottolog.stazeno, podrobnosti: podrobnosti.stazeno, wikidata: json("data/wikidata.json").stazeno },
  dny: doplnJ(json("data/dny-jazyku.json")), starovek: doplnJ(structuredClone(STAROVEK)), cestySlov: doplnJ(json("data/cesty-slov.json").slova),
  sablonaStarovek: cti("src/starovek.js"), stylStarovek: cti("src/starovek.css") });

// pro vyhledávače: všechny jazykové verze a jejich vzájemné odkazy
const UVODY = { cs: "/", en: "/en/", ...Object.fromEntries(DALSI.map(x => [x, `/${x}/`])) };
const dnes = process.env.DATUM_STAVU || new Date().toISOString().slice(0, 10);
for (const l of ["cs", "en"]) {
  const d = path.join(KOREN, l === "cs" ? "dist" : "dist/en");
  if (l === "en") for (const x of DALSI) {      // obrázek pro sdílení i v /it/ (og:image míří na thelanguageatlas.com/it/…)
    const dx = path.join(KOREN, "dist", x);
    for (const f of fs.readdirSync(dx)) if (/^nahled-(cs|en)\.[0-9a-f]{10}\.jpg$/.test(f)) fs.rmSync(path.join(dx, f));
    fs.copyFileSync(path.join(KOREN, "static/nahled-en.jpg"), path.join(dx, NAHLED[x].slice(1)));
  }
  for (const f of fs.readdirSync(d)) if (/^nahled-(cs|en)\.[0-9a-f]{10}\.jpg$/.test(f)) fs.rmSync(path.join(d, f));   // staré otisky pryč
  for (const k of ["cs", "en"]) fs.copyFileSync(path.join(KOREN, `static/nahled-${k}.jpg`), path.join(d, NAHLED[k].slice(1)));
  // každá doména má vlastní robots.txt a sitemap.xml (anglická je v dist/en/, tedy v kořeni thelanguageatlas.com)
  fs.writeFileSync(path.join(d, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${DOMENA[l]}/sitemap.xml\n`);
  fs.writeFileSync(path.join(d, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    /* stránky další jazykové verze (/it/…) leží na anglické doméně, proto jsou v její mapě */
    [["/", UVODY, "cs"], ["/en/", UVODY, "en"]].concat(DALSI.map(x => [`/${x}/`, UVODY, x])).concat(stranky)
      .filter(x => x[2] === l || (l === "en" && DALSI.includes(x[2]))).map(([u, alt]) =>
        `  <url>\n    <loc>${WEB(u)}</loc>\n    <lastmod>${dnes}</lastmod>\n` +
        JAZYKY_WEBU.map(h => `    <xhtml:link rel="alternate" hreflang="${h}" href="${WEB(alt[h])}"/>\n`).join("") + `  </url>\n`).join("") +
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
console.log(`dist/index.html (česky) ${kb(cs.dokument)}, dist/en/index.html (anglicky) ${kb(en.dokument)}, ` +
  DALSI.map(l => `dist/${l}/index.html ${kb(dalsi[l].dokument)}, `).join("") + `dist/${souborSkriptu} ${kb(skriptWebu)}`);

if (slozkaArtefaktu) {
  fs.mkdirSync(slozkaArtefaktu, { recursive: true });
  // v artefaktu přepíná jazyk skript na místě; odkazy vedou na ostatní artefakty (ODKAZ_CS, ODKAZ_EN, ODKAZ_IT)
  const odkazy = Object.fromEntries(JAZYKY_WEBU.map(l => [l, process.env["ODKAZ_" + l.toUpperCase()] || "#"]));
  const soubory = { cs: "atlas-jazyku.html", en: "language-atlas.html", it: "atlante-delle-lingue.html" };
  for (const l of JAZYKY_WEBU) fs.writeFileSync(path.join(slozkaArtefaktu, soubory[l]), sestav(l, { odkazy, artefakt: true }).fragment);
  console.log(`artefakty v ${slozkaArtefaktu}`);
}
