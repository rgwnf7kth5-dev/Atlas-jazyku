// Doplní k tečkám světového rejstříku podrobnosti z otevřených zdrojů → data/podrobnosti.json
//   node scripts/podrobnosti.mjs     (chybějící zdroje stáhne do .cache/, pak už pracuje offline)
// Spusť po scripts/glottolog.mjs. Každý údaj má doložený zdroj – viz data/ZDROJE.md.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(KOREN, ".cache");
const GL = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf";
const WALS = "https://raw.githubusercontent.com/cldf-datasets/wals/master/cldf";
const PHOIBLE = "https://raw.githubusercontent.com/cldf-datasets/phoible/master/cldf";
const NPM = "https://cdn.jsdelivr.net/npm";
const ZDROJE = {
  "glottolog-languages.csv": `${GL}/languages.csv`,
  "gl-values.csv": `${GL}/values.csv`,
  "wals-languages.csv": `${WALS}/languages.csv`,
  "wals-values.csv": `${WALS}/values.csv`,
  "phoible-values.csv": `${PHOIBLE}/values.csv`,
  "phoible-parameters.csv": `${PHOIBLE}/parameters.csv`,
  "cldr-cs.json": `${NPM}/cldr-localenames-full@48.2.0/main/cs/languages.json`,
  "cldr-territory.json": `${NPM}/cldr-core@48.2.0/supplemental/territoryInfo.json`,
  "cldr-langdata.json": `${NPM}/cldr-core@48.2.0/supplemental/languageData.json`,
  "cldr-likely.json": `${NPM}/cldr-core@48.2.0/supplemental/likelySubtags.json`,
  "cldr-aliases.json": `${NPM}/cldr-core@48.2.0/supplemental/aliases.json`,
  "cldr-pismo-meta.json": `${NPM}/cldr-core@48.2.0/scriptMetadata.json`,
  "cldr-pisma-cs.json": `${NPM}/cldr-localenames-full@48.2.0/main/cs/scripts.json`,
  "cldr-pisma-en.json": `${NPM}/cldr-localenames-full@48.2.0/main/en/scripts.json`,
  "zeme-cs.json": `${NPM}/i18n-iso-countries@7.14.0/langs/cs.json`,
  "zeme-en.json": `${NPM}/i18n-iso-countries@7.14.0/langs/en.json`,
  "zeme-kody.json": `${NPM}/i18n-iso-countries@7.14.0/codes.json`,
  "iso6393.js": `${NPM}/iso-639-3@3.0.1/iso6393.js`
};

fs.mkdirSync(CACHE, { recursive: true });
for (const [soubor, url] of Object.entries(ZDROJE)) {
  const cil = path.join(CACHE, soubor);
  if (fs.existsSync(cil)) continue;
  process.stdout.write(`stahuji ${soubor}… `);
  const odpoved = await fetch(url);
  if (!odpoved.ok) throw new Error(`${url}: ${odpoved.status}`);
  fs.writeFileSync(cil, Buffer.from(await odpoved.arrayBuffer()));
  console.log("hotovo");
}
if (!fs.existsSync(path.join(CACHE, "udhr/index.js"))) {
  process.stdout.write("stahuji udhr… ");
  const tgz = path.join(CACHE, "udhr.tgz");
  fs.writeFileSync(tgz, Buffer.from(await (await fetch("https://registry.npmjs.org/udhr/-/udhr-6.0.0.tgz")).arrayBuffer()));
  execFileSync("tar", ["-xzf", tgz, "-C", CACHE]);               // tar má i Windows 10 a novější
  fs.renameSync(path.join(CACHE, "package"), path.join(CACHE, "udhr"));
  console.log("hotovo");
}

const cti = s => fs.readFileSync(path.join(CACHE, s), "utf8");
function csv(soubor) {
  const t = cti(soubor), radky = []; let pole = [], b = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { b += '"'; i++; } else q = false; } else b += c; }
    else if (c === '"') q = true;
    else if (c === ",") { pole.push(b); b = ""; }
    else if (c === "\n") { pole.push(b); radky.push(pole); pole = []; b = ""; }
    else if (c !== "\r") b += c;
  }
  if (b || pole.length) { pole.push(b); radky.push(pole); }
  const h = radky[0];
  return radky.slice(1).filter(r => r.length > 1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

const rejstrik = JSON.parse(fs.readFileSync(path.join(KOREN, "data/glottolog.json"), "utf8"));
const kody = rejstrik.body.map(b => b[6]);
if (kody.some(k => !k)) throw new Error("data/glottolog.json nemá kódy Glottologu – spusť nejdřív node scripts/glottolog.mjs");
const naIndex = new Map(kody.map((k, i) => [k, i]));

/* --- Glottolog: jména uzlů, nářečí, státy, ISO --- */
const languoidy = csv("glottolog-languages.csv");
const jmeno = new Map(languoidy.map(r => [r.ID, r.Name]));
const iso = new Array(kody.length).fill(""), staty = new Array(kody.length).fill(""), nareci = new Array(kody.length).fill(0);
for (const r of languoidy) {
  if (naIndex.has(r.ID)) { const i = naIndex.get(r.ID); iso[i] = r.ISO639P3code || ""; staty[i] = (r.Countries || "").split(/[;\s]+/).filter(Boolean).join(" "); }
  if (r.Level === "dialect" && naIndex.has(r.Language_ID)) nareci[naIndex.get(r.Language_ID)]++;
}

/* --- Glottolog: vitalita (stupnice AES = šest stupňů UNESCO), popsanost, příbuzenstvo --- */
const AES = { "aes-not_endangered": 0, "aes-threatened": 1, "aes-shifting": 2, "aes-moribund": 3, "aes-nearly_extinct": 4, "aes-extinct": 5 };
const MED = { "med-long_grammar": 0, "med-grammar": 1, "med-grammar_sketch": 2, "med-phonology_or_text": 3, "med-wordlist_or_less": 4 };
const aes = new Array(kody.length).fill(-1), med = new Array(kody.length).fill(-1), rodic = new Array(kody.length).fill(-1);
// strom příbuzenstva: uzel zná jen svého rodiče, jazyk jen svou nejbližší skupinu; cestu dopočítá stránka
const uzly = [], nad = [], uzlyIx = new Map();
const uzel = (kod, nadrazeny) => {
  if (!uzlyIx.has(kod)) { uzlyIx.set(kod, uzly.length); uzly.push(jmeno.get(kod) || kod); nad.push(nadrazeny); }
  return uzlyIx.get(kod);
};
for (const v of csv("gl-values.csv")) {
  const i = naIndex.get(v.Language_ID);
  if (i === undefined) continue;
  if (v.Parameter_ID === "aes" && v.Code_ID in AES) {
    aes[i] = AES[v.Code_ID];
    // „probouzený“ (awakening, reawakening): na stupnici UNESCO patří mezi vymřelé, ale lidé ho vracejí do života.
    // Glottolog to nemá jako stupeň, jen v komentáři s kategorií z původního zdroje (ElCat, Ethnologue).
    if (aes[i] === 5 && /\b(re)?awakening\b/i.test(v.Comment || "")) aes[i] = 6;
  }
  else if (v.Parameter_ID === "med" && v.Code_ID in MED) med[i] = MED[v.Code_ID];
  else if (v.Parameter_ID === "classification" && v.Value) {
    let predchozi = -1;
    for (const kod of v.Value.split("/")) predchozi = uzel(kod, predchozi);
    rodic[i] = predchozi;
  }
}

/* --- WALS: vybrané vlastnosti, které se dají dětem vysvětlit --- */
const WALS_VLASTNOSTI = ["81A", "13A", "138A", "131A", "129A", "133A", "30A", "49A", "19A"];
const walsNaIndex = new Map();
for (const l of csv("wals-languages.csv")) if (naIndex.has(l.Glottocode)) walsNaIndex.set(l.ID, naIndex.get(l.Glottocode));
const wals = kody.map(() => new Array(WALS_VLASTNOSTI.length).fill(0));
for (const v of csv("wals-values.csv")) {
  const i = walsNaIndex.get(v.Language_ID), k = WALS_VLASTNOSTI.indexOf(v.Parameter_ID);
  if (i === undefined || k < 0) continue;
  const hodnota = +(v.Code_ID || "").split("-")[1] || +v.Value;
  if (hodnota >= 1 && hodnota <= 9 && !wals[i][k]) wals[i][k] = hodnota;
}

/* --- PHOIBLE: počet souhlásek, samohlásek a tónů (medián přes zdroje) --- */
const trida = new Map(csv("phoible-parameters.csv").map(p => [p.ID, p.SegmentClass]));
const inventare = new Map();   // Inventory_ID → {gc, c, v, t}
for (const v of csv("phoible-values.csv")) {
  if (!naIndex.has(v.Language_ID)) continue;
  let inv = inventare.get(v.Inventory_ID);
  if (!inv) { inv = { gc: v.Language_ID, c: 0, v: 0, t: 0 }; inventare.set(v.Inventory_ID, inv); }
  const tr = trida.get(v.Parameter_ID);
  if (tr === "consonant") inv.c++; else if (tr === "vowel") inv.v++; else if (tr === "tone") inv.t++;
}
const podleJazyka = new Map();
for (const inv of inventare.values()) { if (!podleJazyka.has(inv.gc)) podleJazyka.set(inv.gc, []); podleJazyka.get(inv.gc).push(inv); }
const hlasky = new Array(kody.length).fill(0);
for (const [gc, seznam] of podleJazyka) {
  seznam.sort((a, b) => (a.c + a.v) - (b.c + b.v));
  const m = seznam[(seznam.length - 1) >> 1];
  hlasky[naIndex.get(gc)] = [m.c, m.v, m.t];
}

/* --- ISO 639-1 → 639-3 (CLDR používá dvoupísmenné kódy, kde existují) --- */
const isoTabulka = cti("iso6393.js");
const dvaNaTri = {};
for (const m of isoTabulka.matchAll(/\{[^{}]*?iso6391: '([a-z]{2})'[^{}]*?\}|\{[^{}]*?\}/g)) {
  const zaznam = m[0], t3 = /iso6393: '([a-z]{3})'/.exec(zaznam), t1 = /iso6391: '([a-z]{2})'/.exec(zaznam);
  if (t3 && t1) dvaNaTri[t1[1]] = t3[1];
}
const naTri = k => k.length === 2 ? dvaNaTri[k] : k;
const isoNaIndex = new Map();
iso.forEach((k, i) => { if (k && !isoNaIndex.has(k)) isoNaIndex.set(k, i); });

/* --- CLDR: české názvy jazyků --- */
const nazvyCs = new Array(kody.length).fill("");
const cldrCs = JSON.parse(cti("cldr-cs.json")).main.cs.localeDisplayNames.languages;
for (const [k, v] of Object.entries(cldrCs)) {
  if (k.includes("-") || k.includes("_") || /-alt-/.test(k)) continue;
  const i = isoNaIndex.get(naTri(k));
  if (i !== undefined && !nazvyCs[i]) nazvyCs[i] = v;
}

/* --- CLDR: odhad počtu uživatelů = součet (obyvatelé státu × podíl uživatelů jazyka) --- */
const uzivatelu = new Array(kody.length).fill(0);
const uzemi = JSON.parse(cti("cldr-territory.json")).supplemental.territoryInfo;
const soucty = {};
for (const t of Object.values(uzemi)) {
  const obyv = +t._population || 0;
  for (const [k, v] of Object.entries(t.languagePopulation || {})) {
    const zaklad = naTri(k.split("_")[0]);
    if (zaklad) soucty[zaklad] = (soucty[zaklad] || 0) + obyv * (+v._populationPercent || 0) / 100;
  }
}
const zaokrouhli = n => { if (n < 1) return 0; const r = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / r) * r; };
for (const [k, n] of Object.entries(soucty)) { const i = isoNaIndex.get(k); if (i !== undefined) uzivatelu[i] = zaokrouhli(n); }

/* --- CLDR: písmo a úřední status ve státech ---
   Makrojazyk CLDR (ar, zh, fa…) patří k tečce jazyka, který za něj CLDR uvádí (arb, cmn, pes…). */
const zMakra = {};
for (const [k, v] of Object.entries(JSON.parse(cti("cldr-aliases.json")).supplemental.metadata.alias.languageAlias))
  if (v._reason === "macrolanguage" && !zMakra[v._replacement]) zMakra[v._replacement] = k;
const cldrNaIndex = k => { const i = isoNaIndex.get(naTri(k)); return i !== undefined ? i : zMakra[k] ? isoNaIndex.get(zMakra[k]) : undefined; };
const jazykData = JSON.parse(cti("cldr-langdata.json")).supplemental.languageData;
const pravdepodobne = JSON.parse(cti("cldr-likely.json")).supplemental.likelySubtags;
const pismaJazyka = {};                      // CLDR kód → [písmo, …], nejběžnější první
const vyrazene = new Set(Object.entries(JSON.parse(cti("cldr-pismo-meta.json")).scriptMetadata)
  .filter(([, m]) => m.idUsage === "EXCLUSION").map(([p]) => p));   // historická a kuriózní písma (Shawova abeceda…)
const pridejPismo = (k, p) => {
  const a = pismaJazyka[k] || (pismaJazyka[k] = []);
  if (p && !a.includes(p) && !(a.length && vyrazene.has(p))) a.push(p);     // vyřazené jen jako jediné (egyptština)
};
for (const k of Object.keys(jazykData)) if (!k.includes("-alt")) {
  const odhad = ((pravdepodobne[k] || "").split("-")[1]) || "";
  if (/^[A-Z][a-z]{3}$/.test(odhad)) pridejPismo(k, odhad);
  (jazykData[k]._scripts || []).forEach(p => pridejPismo(k, p));
}
const znameStaty = JSON.parse(cti("zeme-cs.json")).countries;
const vedlejsi = k => (jazykData[k + "-alt-secondary"] || {})._scripts || [];   // hi_Latn, pa_Arab: CLDR je vede jako vedlejší
const STATUS = { official: 1, de_facto_official: 2, official_regional: 3 };
const statusJazyka = {};                     // CLDR kód → {stát: status}
for (const [stat, t] of Object.entries(uzemi)) {
  for (const [k, v] of Object.entries(t.languagePopulation || {})) {
    const [zaklad, pismo] = k.split("_");
    if (pismo && pismaJazyka[zaklad] && !vedlejsi(zaklad).includes(pismo)) pridejPismo(zaklad, pismo);   // sr_Latn, uz_Arab…
    const s = STATUS[v._officialStatus];
    if (!s || !znameStaty[stat]) continue;                          // jen státy ISO 3166 (ne Kanárské ostrovy, Sark…)
    const z = statusJazyka[zaklad] || (statusJazyka[zaklad] = {});
    if (!z[stat] || s < z[stat]) z[stat] = s;
  }
}
const pisma = new Array(kody.length).fill(""), uredni = new Array(kody.length).fill("");
for (const [k, a] of Object.entries(pismaJazyka)) {
  const i = cldrNaIndex(k);
  if (i !== undefined && !pisma[i] && a.length) pisma[i] = a.filter(p => p !== "Zyyy").slice(0, 4).join(" ");
}
for (const [k, z] of Object.entries(statusJazyka)) {
  const i = cldrNaIndex(k);
  if (i === undefined || uredni[i]) continue;
  uredni[i] = Object.entries(z).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([st, s]) => st + s).join(" ");
}
/* jazyky atlasu bez tečky v rejstříku (srbština, chorvatština…): podle kódu jazyka v languages.json */
const atlasCldr = {};
{
  const propojene = new Set(rejstrik.body.map(b => b[5]).filter(Boolean));
  for (const j of JSON.parse(fs.readFileSync(path.join(KOREN, "data/languages.json"), "utf8"))) {
    const k = (j.kod || "").split("-")[0];
    if (propojene.has(j.id) || !k) continue;
    const a = (pismaJazyka[k] || []).slice(0, 4).join(" "), u = Object.entries(statusJazyka[k] || {})
      .sort((x, y) => x[1] - y[1] || x[0].localeCompare(y[0])).map(([st, s]) => st + s).join(" ");
    if (a || u) atlasCldr[j.id] = [a, u];
  }
}
const pouzitaPisma = new Set(pisma.concat(Object.values(atlasCldr).map(x => x[0])).join(" ").split(" ").filter(Boolean));
const nazvyPisem = {}, nazvyPisemEn = JSON.parse(cti("cldr-pisma-en.json")).main.en.localeDisplayNames.scripts;
const PISMA_OPRAVY = {                       // kde CLDR uvádí jen přívlastek nebo odbornou zkratku
  cs: { Hans: "čínské znaky (zjednodušené)", Hant: "čínské znaky (tradiční)", Olck: "ol čiki (santálské písmo)",
        Cher: "čerokézské slabičné písmo", Osge: "osedžské písmo" },
  en: { Hans: "Chinese characters (simplified)", Hant: "Chinese characters (traditional)", Lisu: "Lisu (Fraser)" }
};
for (const l of ["cs", "en"]) {
  const n = JSON.parse(cti(`cldr-pisma-${l}.json`)).main[l].localeDisplayNames.scripts;
  nazvyPisem[l] = {};
  for (const p of pouzitaPisma) {
    let x = (PISMA_OPRAVY[l] || {})[p] || n[p + "-alt-stand-alone"] || n[p] || nazvyPisemEn[p] || p;
    if (l === "cs" && /(é|ovo|psací)$/.test(x)) x += " písmo";   // „arabské“ → „arabské písmo“
    nazvyPisem[l][p] = x;
  }
}

/* --- UDHR: článek 1 Všeobecné deklarace lidských práv --- */
const udhrMeta = cti("udhr/index.js");
const udhr = [], udhrIndex = new Array(kody.length).fill(-1);
for (const m of udhrMeta.matchAll(/\{[^{}]*?code: '([^']+)'[^{}]*?\}/g)) {
  const zaznam = m[0];
  const kod = m[1], i3 = (/iso6393: '([^']*)'/.exec(zaznam) || [])[1], stupen = +(/stage: (\d)/.exec(zaznam) || [])[1];
  const smer = (/direction: '([^']+)'/.exec(zaznam) || [])[1] || "ltr";
  if (!i3 || stupen < 4) continue;                              // jen hotové překlady
  const i = isoNaIndex.get(i3);
  if (i === undefined || udhrIndex[i] >= 0) continue;
  const soubor = path.join(CACHE, "udhr/declaration", kod + ".html");
  if (!fs.existsSync(soubor)) continue;
  const html = fs.readFileSync(soubor, "utf8");
  const clanek = /<article data-number="1">([\s\S]*?)<\/article>/.exec(html);
  if (!clanek) continue;
  const odstavec = /<p>([\s\S]*?)<\/p>/.exec(clanek[1]);
  if (!odstavec) continue;
  const text = odstavec[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (text.length < 20 || text.length > 400) continue;
  udhrIndex[i] = udhr.length;
  udhr.push(smer === "rtl" ? [text, 1] : [text]);
}

/* --- názvy států (ISO 3166) česky a anglicky --- */
const nazvyStatu = {};
for (const l of ["cs", "en"]) {
  const z = JSON.parse(cti(`zeme-${l}.json`)).countries;
  nazvyStatu[l] = Object.fromEntries(Object.entries(z).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

/* --- Wikidata (stahuje scripts/wikidata.mjs v GitHub Actions; bez souboru se přeskočí) --- */
const wdSoubor = path.join(KOREN, "data/wikidata.json");
const wd = fs.existsSync(wdSoubor) ? JSON.parse(fs.readFileSync(wdSoubor, "utf8")).zaznamy : {};
const wdMluvci = new Array(kody.length).fill(0), wdQ = new Array(kody.length).fill(0), wdWiki = new Array(kody.length).fill(0);
kody.forEach((gc, i) => {
  const z = wd[gc];
  if (!z) return;
  if (z.m) wdMluvci[i] = z.m;
  if (z.q) wdQ[i] = z.q;
  if (z.w) wdWiki[i] = z.w;
  // český název z Wikidat jen tam, kde ho nemá CLDR, a jen když to není opsané anglické jméno
  if (!nazvyCs[i] && z.cs && z.cs !== rejstrik.body[i][0]) nazvyCs[i] = z.cs;
});

/* --- výstup: jeden řádek na tečku, ve stejném pořadí jako data/glottolog.json --- */
const radky = kody.map((_, i) => {
  const w = wals[i].join("");
  const r = [aes[i], med[i], rodic[i], staty[i], nareci[i], /[1-9]/.test(w) ? w : "", hlasky[i] || 0, udhrIndex[i], uzivatelu[i], nazvyCs[i],
             wdMluvci[i], wdQ[i], wdWiki[i], pisma[i], uredni[i]];
  while (r.length && (r[r.length - 1] === "" || r[r.length - 1] === 0 || r[r.length - 1] === -1)) r.pop();   // ořízni prázdný konec
  return r;
});
/* --- státy na mapě (číselný kód ISO 3166 z world-atlas) → dvoupísmenný kód, jaký používá Glottolog --- */
const ciselne = {};
for (const [a2, , num] of JSON.parse(cti("zeme-kody.json"))) ciselne[String(num).padStart(3, "0")] = a2;
const svet = JSON.parse(fs.readFileSync(path.join(KOREN, "data/countries-110m.json"), "utf8"));
const mapaStatu = {};
for (const g of svet.objects.countries.geometries) if (g.id && ciselne[g.id]) mapaStatu[g.properties.name] = ciselne[g.id];

const vystup = {
  stazeno: new Date().toISOString().slice(0, 10),
  wals: WALS_VLASTNOSTI,
  uzly, nad, staty: nazvyStatu, udhr, mapaStatu, pisma: nazvyPisem, atlasCldr, radky
};
fs.writeFileSync(path.join(KOREN, "data/podrobnosti.json"), JSON.stringify(vystup));

const pocet = f => radky.filter(f).length;
console.log(`Podrobnosti pro ${kody.length} jazyků (${(fs.statSync(path.join(KOREN, "data/podrobnosti.json")).size / 1024).toFixed(0)} kB):`);
console.log(`  vitalita ${pocet(r => r[0] >= 0)}, popsanost ${pocet(r => r[1] >= 0)}, příbuzenstvo ${pocet(r => r[2] >= 0)}, státy ${pocet(r => r[3])}, nářečí ${pocet(r => r[4] > 0)}`);
console.log(`  stavba jazyka (WALS) ${pocet(r => r[5] && /[1-9]/.test(r[5]))}, hlásky (PHOIBLE) ${pocet(r => Array.isArray(r[6]))}, ukázka textu (UDHR) ${pocet(r => r[7] >= 0)}`);
console.log(`  odhad uživatelů (CLDR) ${pocet(r => r[8] > 0)}, český název (CLDR/Wikidata) ${pocet(r => r[9])}, písmo (CLDR) ${pocet(r => r[13])}, úřední status (CLDR) ${pocet(r => r[14])}`);
console.log(`  Wikidata: mluvčí ${pocet(r => Array.isArray(r[10]))}, položka ${pocet(r => r[11] > 0)}, článek cs ${pocet(r => r[12] & 1)}, en ${pocet(r => r[12] & 2)}` +
  (Object.keys(wd).length ? "" : "  (data/wikidata.json chybí – spusť node scripts/wikidata.mjs nebo GitHub Actions)"));
