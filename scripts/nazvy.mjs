// Názvy v dalším jazyce webu (italština, později třeba němčina) z otevřených zdrojů → data/nazvy-<jazyk>.json
//   node scripts/nazvy.mjs it      (chybějící zdroje stáhne do .cache/, pak pracuje offline)
// Čeština a angličtina mají názvy v data/podrobnosti.json (scripts/podrobnosti.mjs); tohle je doplněk pro další jazyky,
// aby se kvůli nim nemusel přepočítávat celý rejstřík.
//   jazyky: glottocode → název jazyka (Unicode CLDR, jen kde ho CLDR má; jinak web ukáže anglické jméno z Glottologu)
//   staty:  ISO 3166 → název státu (i18n-iso-countries)
//   zeme:   název státu na mapě (world-atlas) → název státu; státy bez kódu ISO ručně v RUCNE
//   pisma:  kód písma ISO 15924 → název písma (Unicode CLDR)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(KOREN, ".cache");
const L = process.argv[2];
if (!/^[a-z]{2}$/.test(L || "")) { console.error("Použití: node scripts/nazvy.mjs <kód jazyka, např. it>"); process.exit(1); }
const NPM = "https://cdn.jsdelivr.net/npm";
const ZDROJE = {
  [`cldr-${L}.json`]: `${NPM}/cldr-localenames-full@48.2.0/main/${L}/languages.json`,
  [`cldr-pisma-${L}.json`]: `${NPM}/cldr-localenames-full@48.2.0/main/${L}/scripts.json`,
  [`zeme-${L}.json`]: `${NPM}/i18n-iso-countries@7.14.0/langs/${L}.json`,
  "zeme-kody.json": `${NPM}/i18n-iso-countries@7.14.0/codes.json`,
  "iso6393.js": `${NPM}/iso-639-3@3.0.1/iso6393.js`,
  "glottolog-languages.csv": "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/languages.csv"
};
fs.mkdirSync(CACHE, { recursive: true });
for (const [soubor, url] of Object.entries(ZDROJE)) {
  const cil = path.join(CACHE, soubor);
  if (!fs.existsSync(cil)) { console.log("stahuji", url); execFileSync("curl", ["-sSfL", "-o", cil, url]); }
}
const cti = s => fs.readFileSync(path.join(CACHE, s), "utf8");
const json = p => JSON.parse(fs.readFileSync(path.join(KOREN, p), "utf8"));

/* státy na mapě, které nemají vlastní kód ISO 3166 (world-atlas je vede zvlášť) */
const RUCNE = {
  it: { "Kosovo": "Kosovo", "N. Cyprus": "Cipro del Nord", "Somaliland": "Somaliland" },
  de: { "Kosovo": "Kosovo", "N. Cyprus": "Nordzypern", "Somaliland": "Somaliland" }
};

// --- glottocode → ISO 639-3 (Glottolog) a ISO 639-1 → 639-3
const radky = cti("glottolog-languages.csv").split("\n");
const hlava = radky[0].split(","), iId = hlava.indexOf("ID"), iIso = hlava.indexOf("ISO639P3code");
const isoGlotta = {};
for (const r of radky.slice(1)) { const s = r.split(","); if (s[iIso]) isoGlotta[s[iIso]] = s[iId]; }   // ID a ISO jsou před sloupci s čárkami v uvozovkách
const dvaNaTri = {};
for (const m of cti("iso6393.js").matchAll(/\{[^{}]*?\}/g)) {
  const t3 = /iso6393: '([a-z]{3})'/.exec(m[0]), t1 = /iso6391: '([a-z]{2})'/.exec(m[0]);
  if (t3 && t1) dvaNaTri[t1[1]] = t3[1];
}
const rejstrik = new Set(json("data/glottolog.json").body.map(b => b[6]));

const jazyky = {};
for (const [k, v] of Object.entries(JSON.parse(cti(`cldr-${L}.json`)).main[L].localeDisplayNames.languages)) {
  if (k.includes("-") || k.includes("_")) continue;
  const gc = isoGlotta[k.length === 2 ? dvaNaTri[k] : k];
  if (gc && rejstrik.has(gc) && !jazyky[gc]) jazyky[gc] = v;
}
const z = JSON.parse(cti(`zeme-${L}.json`)).countries;
/* úřední tvary s čárkou („Tansania, Vereinigte Republik“) nahradit běžným názvem */
const BEZNE = {
  de: { SY: "Syrien", TZ: "Tansania", US: "Vereinigte Staaten", UM: "Kleinere Amerikanische Überseeinseln", CZ: "Tschechien" }
};
const staty = Object.fromEntries(Object.entries(z).map(([k, v]) => [k, (BEZNE[L] || {})[k] || (Array.isArray(v) ? v[0] : v)]));
const mapaStatu = json("data/podrobnosti.json").mapaStatu;
const zeme = {};
for (const n of Object.keys(json("data/country-names.json").en)) {
  const v = (RUCNE[L] || {})[n] || staty[mapaStatu[n]];
  if (v) zeme[n] = v; else console.warn("  bez názvu:", n);
}
const pisma = {};
for (const [k, v] of Object.entries(JSON.parse(cti(`cldr-pisma-${L}.json`)).main[L].localeDisplayNames.scripts))
  if (/^[A-Z][a-z]{3}$/.test(k)) pisma[k] = v;

const vystup = { _zdroj: "Unicode CLDR 48.2 (jazyky, písma), i18n-iso-countries 7.14 (státy); scripts/nazvy.mjs", jazyky, staty, zeme, pisma };
fs.writeFileSync(path.join(KOREN, `data/nazvy-${L}.json`), JSON.stringify(vystup, null, 1) + "\n");
console.log(`data/nazvy-${L}.json: jazyky ${Object.keys(jazyky).length}, státy ${Object.keys(staty).length}, mapa ${Object.keys(zeme).length}, písma ${Object.keys(pisma).length}`);
