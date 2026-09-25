// Samostatné stránky jazyků pro vyhledávače a sdílení (jen web, artefakt je nemá):
//   /jazyk/<jméno>/            česky, např. /jazyk/baskictina/
//   /en/language/<name>/       anglicky, např. /en/language/basque/
//   /jazyky/, /en/languages/   přehled všech jazyků s pozdravem
//   /o-datech/, /en/about-data/  O datech (stejný text jako okno v aplikaci)
// Stránky jsou lehké (bez skriptu glóbu): malba (static/malby/<id>.jpg, vyrábí scripts/malby.mjs), pozdrav,
// výslovnost, zajímavost, údaje a tlačítko, které otevře jazyk na glóbu (/#<id>). Dřív byl atlas pro vyhledávač
// jediná stránka a o jednotlivých jazycích nevěděl nic, protože se ukazují až po kliknutí.
import fs from "node:fs";
import path from "node:path";

const escHtml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bezDiakritiky = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
export const slug = s => bezDiakritiky(s).toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* jazyky atlasu, které v Glottologu nemají vlastní tečku: příbuzné hledám od jazyka, pod který je Glottolog řadí */
const NAHRADNI_TECKA = { sr: "sout1528", hr: "sout1528", hmn: "hmon1333" };
const BEZ_RODU = ["Artificial Language", "Mixed Language", "Pidgin", "Speech Register", "Sign Language"];

function tvar(lang, n, tvary) {
  if (!Array.isArray(tvary)) return tvary;
  if (Math.floor(n) !== n) return tvary[3] || tvary[2];
  if (n === 1) return tvary[0];
  if (lang === "cs" && n >= 2 && n <= 4) return tvary[1];
  return tvary[2];
}
function cislo(lang, n, des) { return n.toLocaleString(lang === "cs" ? "cs-CZ" : "en-GB", { minimumFractionDigits: des || 0, maximumFractionDigits: des || 0 }); }
/* stejně jako lidi() v app.js: malá čísla přesně, velká zaokrouhleně */
function lidi(lang, T, n) {
  if (n < 10000) return cislo(lang, n);
  if (n < 1e6) { const k = Math.round(n / 1000); return cislo(lang, k) + " " + tvar(lang, k, T.tisic); }
  if (n < 1e9) { const m = n < 1e7 ? Math.round(n / 1e5) / 10 : Math.round(n / 1e6); return cislo(lang, m, Math.floor(m) === m ? 0 : 1) + " " + tvar(lang, m, T.milionu); }
  const g = Math.round(n / 1e8) / 10; return cislo(lang, g, Math.floor(g) === g ? 0 : 1) + " " + tvar(lang, g, T.miliardy);
}

export function vyrobStranky({ KOREN, WEB, UI, jazyky, glottolog, podrobnosti, nazvyZemi, ikona, fontyOdkaz, verze }) {
  const DIST = path.join(KOREN, "dist");
  const bodPodleKodu = new Map(glottolog.body.map((b, i) => [b[6], i]));
  const bodJazyka = {};
  glottolog.body.forEach((b, i) => { if (b[5] && !(b[5] in bodJazyka)) bodJazyka[b[5]] = i; });
  const cesta = i => { const c = []; for (let u = podrobnosti.radky[i][2]; u >= 0; u = podrobnosti.nad[u]) c.unshift(u); return c; };
  const bezRodu = new Set(BEZ_RODU.map(n => glottolog.rodiny.indexOf(n)));

  /* adresy stránek; jméno musí být jedinečné */
  const adresy = { cs: {}, en: {} };
  for (const lang of ["cs", "en"]) {
    const videno = new Map();
    for (const j of jazyky) {
      const s = slug(j[lang].nazev);
      if (!s) throw new Error(`Jazyk „${j.id}“ nemá z čeho udělat adresu stránky (${lang}).`);
      if (videno.has(s)) throw new Error(`Dva jazyky mají stejnou adresu stránky „${s}“: ${videno.get(s)} a ${j.id}.`);
      videno.set(s, j.id);
      adresy[lang][j.id] = (lang === "cs" ? "/jazyk/" : "/en/language/") + s + "/";
    }
  }
  const prehled = { cs: "/jazyky/", en: "/en/languages/" }, oDatech = { cs: "/o-datech/", en: "/en/about-data/" }, domov = { cs: "/", en: "/en/" };

  /* příbuzní v atlasu: nejhlubší společný předek ve stromu Glottologu (jako oblouky na glóbu) */
  const cesty = {};
  for (const j of jazyky) {
    const i = j.id in bodJazyka ? bodJazyka[j.id] : bodPodleKodu.get(NAHRADNI_TECKA[j.id]);
    if (i >= 0 && !bezRodu.has(glottolog.body[i][3])) cesty[j.id] = { rod: glottolog.body[i][3], c: cesta(i) };
  }
  function pribuzni(id) {
    const a = cesty[id]; if (!a || !a.c.length) return [];
    return jazyky.filter(j => j.id !== id && cesty[j.id] && cesty[j.id].rod === a.rod).map(j => {
      const b = cesty[j.id].c; let k = 0; while (k < a.c.length && k < b.length && a.c[k] === b[k]) k++;
      return { j, k };
    }).filter(x => x.k > 0).sort((x, y) => y.k - x.k || x.j.cs.nazev.localeCompare(y.j.cs.nazev, "cs")).slice(0, 6).map(x => x.j);
  }

  function staty(j, lang) {
    const i = bodJazyka[j.id];
    const kody = i >= 0 ? (podrobnosti.radky[i][3] || "").split(" ").filter(Boolean) : [];
    if (kody.length) return kody.map(k => podrobnosti.staty[lang][k] || k);
    return (j.zeme || []).map(z => nazvyZemi[lang][z] || z);
  }

  const styl = `
:root{color-scheme:light dark; --papir:#FBF9F4; --karta:#FFFFFF; --text:#15192B; --text2:#5A6073; --linka:rgba(20,24,40,.1); --akcent:#D23A2B; --odkaz:#1F4FB8;
  --nadpis:"Playfair Display",Georgia,serif; --pismo:"Outfit",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--papir:#070C1C; --karta:#101834; --text:#EAF4FF; --text2:#A3B6D8; --linka:rgba(150,205,255,.16); --akcent:#E0503F; --odkaz:#8FB4FF}}
*{box-sizing:border-box}
body{margin:0; background:var(--papir); color:var(--text); font:17px/1.55 var(--pismo)}
a{color:var(--odkaz)}
.hlava{display:flex; align-items:center; gap:14px; max-width:980px; margin:0 auto; padding:16px 20px; border-bottom:1px solid var(--linka)}
.hlava .domu{display:flex; align-items:center; gap:10px; color:inherit; text-decoration:none; font:600 1.6rem/1 var(--nadpis)}
.hlava .domu svg{width:40px; height:40px}
.hlava .jinam{margin-left:auto; padding:7px 14px; border:1px solid var(--linka); border-radius:999px; color:inherit; text-decoration:none; font-weight:600; font-size:.9rem}
main{max-width:980px; margin:0 auto; padding:18px 20px 40px}
.drobky{font-size:.85rem; color:var(--text2); margin:0 0 14px}
.drobky a{color:inherit}
.jazyk{display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:28px; align-items:start}
.malba{width:100%; height:auto; aspect-ratio:8/5; border-radius:18px; display:block; background:#EFE9DC; box-shadow:0 18px 40px -26px rgba(25,32,60,.5)}
@media (prefers-color-scheme:dark){.malba{filter:brightness(.85)}}
.pozdrav{margin:0; font:600 clamp(2.6rem,6vw,3.6rem)/1.1 var(--nadpis)}
.cteme{margin:4px 0 14px; font:italic 1.1rem var(--nadpis); color:var(--text2)}
h1{margin:0; font:600 2rem/1.2 var(--nadpis)}
.domaci{margin:2px 0 18px; color:var(--text2)}
.tl{display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border-radius:999px; background:var(--akcent); color:#fff; text-decoration:none; font-weight:700}
.tl:focus-visible{outline:3px solid var(--text); outline-offset:3px}
dl{display:grid; grid-template-columns:auto 1fr; gap:6px 16px; margin:22px 0 0; font-size:.95rem}
dt{color:var(--text2)} dd{margin:0}
h2{font:600 1.35rem var(--nadpis); margin:30px 0 8px}
.fakt{font-size:1.1rem; max-width:44em}
.mrizka{display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:10px; padding:0; margin:0; list-style:none}
.mrizka a{display:block; padding:10px 14px; border-radius:14px; background:var(--karta); border:1px solid var(--linka); color:inherit; text-decoration:none}
.mrizka a:hover,.mrizka a:focus-visible{border-color:var(--odkaz)}
.mrizka b{display:block; font:600 1.25rem/1.25 var(--nadpis)}
.mrizka span{font-size:.88rem; color:var(--text2)}
.text p{max-width:46em; color:var(--text2)} .text .uvod{color:var(--text); font-size:1.08rem}
table{border-collapse:collapse; width:100%; max-width:46em; font-size:.92rem}
td{padding:7px 10px 7px 0; border-bottom:1px solid var(--linka); vertical-align:top}
footer{max-width:980px; margin:0 auto; padding:18px 20px 32px; border-top:1px solid var(--linka); font-size:.85rem; color:var(--text2)}
footer a{color:inherit}
@media (max-width:760px){.jazyk{grid-template-columns:1fr; gap:18px} .hlava .domu{font-size:1.3rem} .hlava .domu svg{width:34px; height:34px}}
`;
  const znak = ikona.replace("<svg ", '<svg aria-hidden="true" ');

  function stranka({ lang, adresa, jinaAdresa, titulek, popis, obrazek, obsah }) {
    const T = UI[lang], jiny = lang === "cs" ? "en" : "cs", S = T.stranky;
    const cs = lang === "cs" ? adresa : jinaAdresa, en = lang === "en" ? adresa : jinaAdresa;
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(titulek)}</title>
<meta name="description" content="${escHtml(popis)}">
<link rel="canonical" href="${WEB}${adresa}">
<link rel="alternate" hreflang="cs" href="${WEB}${cs}">
<link rel="alternate" hreflang="en" href="${WEB}${en}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#FBF9F4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#070C1C" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:url" content="${WEB}${adresa}">
<meta property="og:title" content="${escHtml(titulek)}">
<meta property="og:description" content="${escHtml(popis)}">
<meta property="og:image" content="${WEB}${obrazek.src}">
<meta property="og:image:width" content="${obrazek.w}">
<meta property="og:image:height" content="${obrazek.h}">
<meta property="og:locale" content="${lang === "cs" ? "cs_CZ" : "en_GB"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontyOdkaz}">
<style>${styl}</style>
</head>
<body>
<header class="hlava">
 <a class="domu" href="${domov[lang]}">${znak}<span>${escHtml(T.nazev)}</span></a>
 <a class="jinam" href="${jinaAdresa}" hreflang="${jiny}" lang="${jiny}">${escHtml(T.jinyJazyk)}</a>
</header>
<main>
${obsah}
</main>
<footer>
 <p><a href="${prehled[lang]}">${escHtml(S.vsechnyOdkaz)}</a> · <a href="${oDatech[lang]}">${escHtml(T.oDatech.odkaz)}</a> · <a href="${domov[lang]}">${escHtml(S.globus)}</a></p>
 <p>${escHtml(T.zpetna)} <a href="mailto:${escHtml(T.zpetnaAdresa)}?subject=${encodeURIComponent(T.zpetnaPredmet)}">${escHtml(T.zpetnaAdresa)}</a></p>
 <p>${escHtml(T.zdroje)}</p>
</footer>
</body>
</html>
`;
  }
  const zapis = (adresa, html) => { const d = path.join(DIST, adresa); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "index.html"), html); };
  const obrazekWebu = lang => ({ src: `/nahled-${lang}.jpg`, w: 1200, h: 630 });
  const vsechny = [];

  for (const lang of ["cs", "en"]) {
    const T = UI[lang], S = T.stranky, jiny = lang === "cs" ? "en" : "cs", razic = new Intl.Collator(lang);
    const serazene = jazyky.slice().sort((a, b) => razic.compare(a[lang].nazev, b[lang].nazev));
    const dlazdice = seznam => `<ul class="mrizka">${seznam.map(j => `<li><a href="${adresy[lang][j.id]}"><b dir="auto" lang="${escHtml(j.kod || "")}">${escHtml(j[lang].pozdrav || j.pozdrav)}</b><span>${escHtml(j[lang].nazev)}</span></a></li>`).join("")}</ul>`;

    for (const j of jazyky) {
      const P = j[lang], pozdrav = P.pozdrav || j.pozdrav, i = bodJazyka[j.id], r = i >= 0 ? podrobnosti.radky[i] : null;
      const znakovy = r && glottolog.rodiny[glottolog.body[i][3]] === "Sign Language";
      const udaje = [];
      if (j.mluvcich) udaje.push([znakovy ? S.uzivatelu : T.mluvcich, Math.round(j.mluvcich * 1e6) < 100 ? T.hrstka : lidi(lang, T, Math.round(j.mluvcich * 1e6))]);
      if (P.rodina) udaje.push([T.rodina, P.rodina]);
      if (r && r[0] >= 0) udaje.push([T.vitalita, (znakovy ? T.aesZnak : T.aes)[r[0]][0]]);
      const st = staty(j, lang);
      if (st.length) udaje.push([znakovy ? S.kdeZnakuje : S.kdeMluvi, st.slice(0, 12).join(", ") + (st.length > 12 ? " " + S.aDalsi.replace("{n}", st.length - 12) : "")]);
      const pr = pribuzni(j.id);
      const obsah = `<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › <a href="${prehled[lang]}">${escHtml(S.vsechnyOdkaz)}</a> › ${escHtml(P.nazev)}</nav>
<article class="jazyk">
 <img class="malba" src="/malby/${j.id}.jpg" width="800" height="500" alt="${escHtml(S.malbaAlt.replace("{n}", P.nazev))}">
 <div>
  <p class="pozdrav" dir="auto" lang="${escHtml(j.kod || "")}">${escHtml(pozdrav)}</p>
  ${P.vyslovnost ? `<p class="cteme">${escHtml(T.vyslovnost.replace("{x}", P.vyslovnost))}</p>` : ""}
  <h1>${escHtml(P.nazev)}</h1>
  ${j.domaci ? `<p class="domaci">${escHtml(T.domaciJmeno.replace("{x}", j.domaci))}</p>` : ""}
  <a class="tl" href="${domov[lang]}#${j.id}">${escHtml(S.najit)}</a>
  <dl>${udaje.map(u => `<dt>${escHtml(u[0])}</dt><dd>${escHtml(u[1])}</dd>`).join("")}</dl>
 </div>
</article>
${P.fakt ? `<h2>${escHtml(T.zalozkaZajimavost)}</h2>\n<p class="fakt">${escHtml(P.fakt)}</p>` : ""}
${pr.length ? `<h2>${escHtml(T.pribuzniAtlas)}</h2>\n${dlazdice(pr)}` : ""}`;
      const titulek = S.titulek.replace("{n}", P.nazev) + " · " + T.nazev;
      const popis = `${pozdrav} ${P.vyslovnost ? T.vyslovnost.replace("{x}", P.vyslovnost) + ". " : ""}${P.fakt || ""}`.trim();
      zapis(adresy[lang][j.id], stranka({ lang, adresa: adresy[lang][j.id], jinaAdresa: adresy[jiny][j.id], titulek, popis,
        obrazek: { src: `/malby/${j.id}.jpg`, w: 800, h: 500 }, obsah }));
      vsechny.push([adresy[lang][j.id], adresy[jiny][j.id], lang]);
    }

    /* přehled všech jazyků s pozdravem */
    const nadpis = S.vsechnyNadpis.replace("{a}", cislo(lang, jazyky.length));
    zapis(prehled[lang], stranka({ lang, adresa: prehled[lang], jinaAdresa: prehled[jiny], titulek: nadpis + " · " + T.nazev,
      popis: S.vsechnyPopis, obrazek: obrazekWebu(lang),
      obsah: `<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › ${escHtml(S.vsechnyOdkaz)}</nav>
<h1>${escHtml(nadpis)}</h1>
<p class="fakt">${escHtml(S.vsechnyPopis)}</p>
${dlazdice(serazene)}` }));
    vsechny.push([prehled[lang], prehled[jiny], lang]);

    /* O datech: stejný obsah jako okno v aplikaci */
    const O = T.oDatech, datum = d => d ? new Date(d + "T12:00:00Z").toLocaleDateString(T.locale, { day: "numeric", month: "long", year: "numeric" }) : "–";
    const dosad = s => s.replace(/\{(\w+)\}/g, (_, k) => ({ g: cislo(lang, verze.g), n: cislo(lang, verze.n), a: cislo(lang, jazyky.length),
      gdat: datum(verze.glottolog), pdat: datum(verze.podrobnosti), wdat: datum(verze.wikidata) })[k] ?? "");
    zapis(oDatech[lang], stranka({ lang, adresa: oDatech[lang], jinaAdresa: oDatech[jiny], titulek: O.nadpis + " · " + T.nazev,
      popis: dosad(O.uvod), obrazek: obrazekWebu(lang),
      obsah: `<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › ${escHtml(O.odkaz)}</nav>
<div class="text">
<h1>${escHtml(O.nadpis)}</h1>
<p class="uvod">${escHtml(dosad(O.uvod))}</p>
${O.oddily.map(o => `<h2>${escHtml(dosad(o.h))}</h2>\n${o.p.map(p => `<p>${escHtml(dosad(p))}</p>`).join("\n")}`).join("\n")}
<h2>${escHtml(O.verzeNadpis)}</h2>
<table><tbody>${O.verze.map(v => `<tr>${v.map(b => `<td>${escHtml(dosad(b))}</td>`).join("")}</tr>`).join("")}</tbody></table>
</div>` }));
    vsechny.push([oDatech[lang], oDatech[jiny], lang]);
  }
  return { adresy, prehled, stranky: vsechny };
}
