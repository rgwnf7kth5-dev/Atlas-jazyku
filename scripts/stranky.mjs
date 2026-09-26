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

/* adresa stránky o civilizaci: /starovek/chetite/, /en/ancient/hittites/ */
const starovekA = { cs: "/starovek/", en: "/en/ancient/" };
/* Příběhy jazyků (sekce „pribehy“ v data/starovek.json): /pribehy/caj/, /en/stories/tea/ */
const pribehyA = { cs: "/pribehy/", en: "/en/stories/" };
const sekceA = c => c.sekce === "pribehy" ? pribehyA : starovekA;
const civAdresa = (c, lang) => sekceA(c)[lang] + c.adresa[lang] + "/";
export function vyrobStranky({ KOREN, WEB, NAHLED, UI, jazyky: vsechnyJazyky, glottolog, podrobnosti, nazvyZemi, ikona, fontyOdkaz, verze, dny, starovek, sablonaStarovek, stylStarovek }) {
  const DIST = path.join(KOREN, "dist");
  const STAROVEK = new Function(sablonaStarovek + "\nreturn STAROVEK;")();   // šablona stránky o civilizaci (i pro aplikaci)
  const bodPodleKodu = new Map(glottolog.body.map((b, i) => [b[6], i]));
  const bodJazyka = {};
  glottolog.body.forEach((b, i) => { if (b[5] && !(b[5] in bodJazyka)) bodJazyka[b[5]] = i; });
  /* znakové jazyky tu stránku nemají: pozdrav se u nich neříká ani neposlouchá, znakuje se (uživatel 25. 9. 2026:
     „znakový jazyk si poslechnout nejde, vyhoď to“). Na glóbu, v aplikaci a v kalendáři zůstávají. */
  const znakovyId = id => { const i = bodJazyka[id]; return i >= 0 && glottolog.rodiny[glottolog.body[i][3]] === "Sign Language"; };
  const jazyky = vsechnyJazyky.filter(j => !znakovyId(j.id));
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
  const prehled = { cs: "/jazyky/", en: "/en/languages/" }, oDatech = { cs: "/o-datech/", en: "/en/about-data/" }, kalendarA = { cs: "/kalendar-jazyku/", en: "/en/language-days/" }, navodA = { cs: "/navod/", en: "/en/guide/" }, domov = { cs: "/", en: "/en/" };

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
:root{color-scheme:light dark; --listek:#FFFDF6; --linka-listku:rgba(60,110,200,.10); --papir:#FBF9F4; --karta:#FFFFFF; --text:#15192B; --text2:#5A6073; --linka:rgba(20,24,40,.1); --akcent:#D23A2B; --odkaz:#1F4FB8;
  --nadpis:"Playfair Display",Georgia,serif; --pismo:"Outfit",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--listek:#121A36; --linka-listku:rgba(140,180,255,.08); --papir:#070C1C; --karta:#101834; --text:#EAF4FF; --text2:#A3B6D8; --linka:rgba(150,205,255,.16); --akcent:#E0503F; --odkaz:#8FB4FF}}
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
.akce{display:flex; flex-wrap:wrap; align-items:center; gap:10px}
.prehraj{display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border-radius:999px; border:0; cursor:pointer; font:inherit; font-weight:700;
  background:#1F4FB8; color:#fff}
@media (prefers-color-scheme:dark){.prehraj{background:#4C7BE0}}
.prehraj svg{width:18px; height:18px}
.prehraj:focus-visible,.posl:focus-visible{outline:3px solid var(--text); outline-offset:3px}
.zvuk-stav{margin:10px 0 0; font-size:.9rem; color:var(--text2)}
.zvuk-stav.bublina{position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:10; max-width:min(520px, calc(100% - 32px)); margin:0;
  padding:10px 16px; border-radius:14px; background:var(--karta); color:var(--text); border:1px solid var(--linka); box-shadow:0 12px 30px -12px rgba(0,0,0,.4)}
.mrizka li{position:relative}
.posl{position:absolute; top:8px; right:8px; width:34px; height:34px; display:grid; place-items:center; border-radius:50%; border:1px solid var(--linka);
  background:var(--papir); color:var(--odkaz); cursor:pointer}
.posl:hover{border-color:var(--odkaz)}
.posl svg{width:16px; height:16px}
.mrizka li:has(.posl) a{padding-right:48px}
.mrizka a b{overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.mrizka a{display:block; padding:10px 14px; border-radius:14px; background:var(--karta); border:1px solid var(--linka); color:inherit; text-decoration:none}
.mrizka a:hover,.mrizka a:focus-visible{border-color:var(--odkaz)}
.mrizka b{display:block; font:600 1.25rem/1.25 var(--nadpis)}
.mrizka span{font-size:.88rem; color:var(--text2)}
.text p{max-width:46em; color:var(--text2)} .text .uvod{color:var(--text); font-size:1.08rem}
table{border-collapse:collapse; width:100%; max-width:46em; font-size:.92rem}
td{padding:7px 10px 7px 0; border-bottom:1px solid var(--linka); vertical-align:top}
ul.kal{list-style:none; padding:0; margin:0 0 8px; max-width:46em}
ul.kal li{display:flex; gap:14px; padding:9px 0; border-bottom:1px solid var(--linka)}
.kal-d{flex:none; width:5.5em; font:600 1rem var(--nadpis)}
ul.kal a{font-weight:600; text-decoration:none} ul.kal a:hover{text-decoration:underline}
ul.kal b{font-family:var(--nadpis)} .kal-p{font-size:.92rem; color:var(--text2)}
footer{max-width:980px; margin:0 auto; padding:10px 20px 24px; border-top:1px solid var(--linka); font-size:.85rem; color:var(--text2)}
footer summary{cursor:pointer; font-weight:600; padding:6px 0}
footer details p{margin:8px 0}
/* kartoteční lístek nad seznamem */
body.s-listkem{overflow:hidden}
.listek-pozadi{position:fixed; inset:0; z-index:50; overflow:auto; padding:32px 16px; background:rgba(20,24,40,.42); backdrop-filter:blur(2px)}
.listek-pozadi[hidden]{display:none}
.listek{position:relative; max-width:940px; margin:0 auto; padding:14px 28px 40px; border-radius:6px 6px 10px 10px; background:var(--listek);
  box-shadow:0 30px 70px -30px rgba(0,0,0,.55), 0 2px 0 rgba(0,0,0,.04); border-top:4px solid var(--akcent)}
.listek::after{content:""; position:absolute; left:50%; bottom:12px; width:16px; height:16px; margin-left:-8px; border-radius:50%;
  background:rgba(20,24,40,.42); box-shadow:inset 0 1px 3px rgba(0,0,0,.35)}
.listek-hlava{display:flex; align-items:center; gap:8px; margin:0 -12px 14px; padding-bottom:10px; border-bottom:2px solid color-mix(in srgb, var(--akcent) 55%, transparent)}
.listek-poradi{font-size:.85rem; color:var(--text2); font-variant-numeric:tabular-nums}
.listek-sip,.listek-x{display:grid; place-items:center; width:40px; height:40px; border-radius:50%; text-decoration:none; color:var(--text);
  font-size:1.6rem; line-height:1; border:1px solid var(--linka)}
.listek-x{margin-left:auto; font-size:1.7rem}
.listek-sip:hover,.listek-x:hover{border-color:var(--odkaz); color:var(--odkaz)}
.listek-sip:focus-visible,.listek-x:focus-visible{outline:3px solid var(--odkaz); outline-offset:2px}
.listek-linky{margin-top:6px; background-image:repeating-linear-gradient(to bottom, transparent 0 31px, var(--linka-listku) 31px 32px)}
.listek h1{font:600 2rem/1.2 var(--nadpis); margin:0}
.nadpis-seznamu{font:600 2rem/1.2 var(--nadpis); margin:0}
@media (max-width:760px){ .listek-pozadi{padding:0} .listek{min-height:100%; border-radius:0; padding:10px 16px 40px} }
footer a{color:inherit}
@media (max-width:760px){.jazyk{grid-template-columns:1fr; gap:18px} .hlava .domu{font-size:1.3rem} .hlava .domu svg{width:34px; height:34px}}
`;
  const znak = ikona.replace("<svg ", '<svg aria-hidden="true" ');
  const IKONA_ZVUK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 9.2h3.4L12 5v14l-4.6-4.2H4z" fill="currentColor"/><path d="M16 9.4a3.7 3.7 0 0 1 0 5.2M18.7 6.7a7.5 7.5 0 0 1 0 10.6" stroke-linecap="round"/></svg>';
  /* tlačítko Poslechni si to: data-kod (jazyk pro hlas), data-text (pozdrav), data-prep (výslovnost) */
  const znakovyJ = j => { const i = bodJazyka[j.id]; return i >= 0 && glottolog.rodiny[glottolog.body[i][3]] === "Sign Language"; };
  /* jako v atlasu: bez kódu jazyka (a u znakového jazyka) se nic nepřehrává */
  const tlacitkoZvuk = (lang, j, maly) => !j.kod || znakovyJ(j) ? "" : `<button type="button" class="${maly ? "posl" : "prehraj"}" data-kod="${escHtml(j.kod || "")}" data-text="${escHtml(j[lang].pozdrav || j.pozdrav)}" data-prep="${escHtml(j[lang].vyslovnost || "")}"${maly ? ` aria-label="${escHtml(UI[lang].poslechni + ": " + j[lang].nazev)}" title="${escHtml(UI[lang].poslechni)}"` : ""}>${IKONA_ZVUK}${maly ? "" : `<span>${escHtml(UI[lang].poslechni)}</span>`}</button>`;
  const skriptZvuk = lang => { const T = UI[lang], texty = JSON.stringify({ rodily: T.zvukRodily, zalozni: T.zvukZalozni, zadny: T.zvukZadny, neumi: T.zvukNeumi,
      chyba: T.zvukChyba, posloucha: T.posloucha, znovu: T.znovu, hlas: T.hlasZalozni, en: lang === "en" }).replace(/</g, "\\u003c");
    return `<script>(function(){var T=${texty},hlasy=[],ss=window.speechSynthesis;function nacti(){try{hlasy=ss.getVoices()||[]}catch(e){hlasy=[]}}
if(ss){nacti();ss.addEventListener("voiceschanged",nacti)}
function najdi(k){if(!k||!hlasy.length)return null;k=k.toLowerCase().replace("_","-");var z=k.split("-")[0],n=function(v){return v.lang.toLowerCase().replace("_","-")};
return hlasy.filter(function(v){return n(v)===k})[0]||hlasy.filter(function(v){return n(v).split("-")[0]===z})[0]||null}
var casStav=0;function rekni(t,x){var stav=document.getElementById("zvuk-stav");if(!stav){stav=document.createElement("p");stav.id="zvuk-stav";stav.className="zvuk-stav bublina";stav.setAttribute("role","status");document.body.appendChild(stav)}stav.hidden=false;stav.textContent=t.replace("{x}",x);if(stav.classList.contains("bublina")){clearTimeout(casStav);casStav=setTimeout(function(){stav.hidden=true},6000)}}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("button[data-text]");if(!b)return;e.preventDefault();
var prep=b.dataset.prep,sp=b.querySelector("span");if(!ss){rekni(T.neumi,prep);return}nacti();
var r=najdi(b.dataset.kod),z=najdi(T.hlas),text,hlas,rych;
if(r){text=b.dataset.text.replace(/[!¡?¿]/g,"");hlas=r;rych=.8;rekni(T.rodily,"")}
else if(z&&prep){text=T.en?prep.toLowerCase():prep;hlas=z;rych=.75;rekni(T.zalozni,"")}
else{rekni(T.zadny,prep);return}
try{var u=new SpeechSynthesisUtterance(text);u.voice=hlas;u.lang=hlas.lang;u.rate=rych;if(sp)sp.textContent=T.posloucha;
u.onend=function(){if(sp)sp.textContent=T.znovu};u.onerror=function(){if(sp)sp.textContent=T.znovu;rekni(T.chyba,prep)};ss.cancel();ss.speak(u)}catch(err){rekni(T.chyba,prep)}});})();</script>`; };

  const SKRIPT_LISTEK = `<script>(function(){var poz=document.getElementById("listek-pozadi");if(!poz||!window.fetch||!window.DOMParser)return;
var seznam=poz.dataset.seznam,titS=poz.dataset.titulek,JE=/\\/(jazyk|language)\\/[^\\/]+\\/$/;
function otevreny(){return !poz.hidden}
function schovej(){poz.hidden=true;document.body.classList.remove("s-listkem");document.title=titS}
function zavri(){if(history.state&&history.state.zeSeznamu){history.back();return}schovej();history.replaceState(null,"",seznam)}
function ukaz(html,url,tit,pridat){poz.innerHTML=html;poz.hidden=false;document.body.classList.add("s-listkem");document.title=tit;
if(pridat)history.pushState({listek:1,zeSeznamu:1},"",url);else history.replaceState({listek:1,zeSeznamu:history.state&&history.state.zeSeznamu},"",url);
poz.scrollTop=0;var x=poz.querySelector(".listek-x");if(x)x.focus({preventScroll:true})}
function nacti(url,pridat){fetch(url).then(function(r){return r.text()}).then(function(t){var d=new DOMParser().parseFromString(t,"text/html"),l=d.getElementById("listek-pozadi");
if(!l||!l.innerHTML.trim()){location.href=url;return}ukaz(l.innerHTML,url,d.title,pridat)}).catch(function(){location.href=url})}
if(otevreny())document.body.classList.add("s-listkem");
document.addEventListener("click",function(e){if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
if(e.target===poz){zavri();return}var a=e.target.closest&&e.target.closest("a");if(!a)return;
if(a.classList.contains("listek-x")){e.preventDefault();zavri();return}
var h=a.getAttribute("href");if(!h||!JE.test(h))return;e.preventDefault();nacti(h,!otevreny())});
document.addEventListener("keydown",function(e){if(!otevreny())return;if(e.key==="Escape"){e.preventDefault();zavri();return}
if((e.key==="ArrowLeft"||e.key==="ArrowRight")&&!(e.target.closest&&e.target.closest("input,textarea,select"))){var s=poz.querySelector(e.key==="ArrowLeft"?".listek-pred":".listek-dalsi");if(s){e.preventDefault();nacti(s.getAttribute("href"),false)}}});
window.addEventListener("popstate",function(){if(JE.test(location.pathname))nacti(location.pathname,false);else schovej()});})();</script>`;
  function stranka({ lang, adresa, jinaAdresa, titulek, popis, obrazek, obsah, listek }) {
    const T = UI[lang], jiny = lang === "cs" ? "en" : "cs", S = T.stranky;
    const cs = lang === "cs" ? adresa : jinaAdresa, en = lang === "en" ? adresa : jinaAdresa;
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(titulek)}</title>
<meta name="description" content="${escHtml(popis)}">
<link rel="canonical" href="${WEB(adresa)}">
<link rel="alternate" hreflang="cs" href="${WEB(cs)}">
<link rel="alternate" hreflang="en" href="${WEB(en)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#FBF9F4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#070C1C" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:url" content="${WEB(adresa)}">
<meta property="og:title" content="${escHtml(titulek)}">
<meta property="og:description" content="${escHtml(popis)}">
<meta property="og:image" content="${WEB((lang === "en" ? "/en" : "") + obrazek.src)}">
<meta property="og:image:width" content="${obrazek.w}">
<meta property="og:image:height" content="${obrazek.h}">
<meta property="og:locale" content="${lang === "cs" ? "cs_CZ" : "en_GB"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(titulek)}">
<meta name="twitter:description" content="${escHtml(popis)}">
<meta name="twitter:image" content="${WEB((lang === "en" ? "/en" : "") + obrazek.src)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontyOdkaz}">
<style>${styl}</style>
</head>
<body>
<header class="hlava">
 <a class="domu" href="${domov[lang]}">${znak}<span>${escHtml(T.nazev)}</span></a>
 <a class="jinam" href="${WEB(jinaAdresa)}" hreflang="${jiny}" lang="${jiny}">${escHtml(T.jinyJazyk)}</a>
</header>
<main>
${obsah}
${obsah.indexOf("data-text=") >= 0 ? skriptZvuk(lang) : ""}
${listek ? SKRIPT_LISTEK : ""}
</main>
<footer>
 <details>
  <summary>${escHtml(T.patickaSouhrn)}</summary>
  <p><a href="${domov[lang]}">${escHtml(S.globus)}</a> · <a href="${prehled[lang]}">${escHtml(S.vsechnyOdkaz)}</a> · <a href="${kalendarA[lang]}">${escHtml(T.kalendarOdkaz)}</a> · <a href="${navodA[lang]}">${escHtml(T.navod.odkaz)}</a> · <a href="${oDatech[lang]}">${escHtml(T.oDatech.odkaz)}</a></p>
  <p>${escHtml(T.zpetna)} <a href="mailto:${escHtml(T.zpetnaAdresa)}?subject=${encodeURIComponent(T.zpetnaPredmet)}">${escHtml(T.zpetnaAdresa)}</a></p>
  <p>${escHtml(T.zdroje)}</p>
 </details>
</footer>
</body>
</html>
`;
  }
  const zapis = (adresa, html) => { const d = path.join(DIST, adresa); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "index.html"), html); };
  const obrazekWebu = lang => ({ src: NAHLED[lang], w: 1200, h: 630 });
  const vsechny = [];

  for (const lang of ["cs", "en"]) {
    const T = UI[lang], S = T.stranky, jiny = lang === "cs" ? "en" : "cs", razic = new Intl.Collator(lang);
    const serazene = jazyky.slice().sort((a, b) => razic.compare(a[lang].nazev, b[lang].nazev));
    const dlazdice = seznam => `<ul class="mrizka">${seznam.map(j => `<li><a href="${adresy[lang][j.id]}"><b dir="auto" lang="${escHtml(j.kod || "")}">${escHtml(j[lang].pozdrav || j.pozdrav)}</b><span>${escHtml(j[lang].nazev)}</span></a>${tlacitkoZvuk(lang, j, true)}</li>`).join("")}</ul>`;

    /* Stránka jazyka je kartotéční lístek otevřený nad seznamem všech jazyků s pozdravem (uživatel 25. 9. 2026:
       „ze stránky se nedá odejít jinak než do glóbu“). Lístek zavře křížek, klik vedle nebo Escape a zůstane seznam;
       šipkami se listuje na předchozí a další jazyk. S JavaScriptem se lístky načítají bez přechodu na jinou stránku. */
    const nadpis = S.vsechnyNadpis.replace("{a}", cislo(lang, jazyky.length)), titulekSeznamu = nadpis + " · " + T.nazev;
    const seznamHtml = uroven => `<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › ${escHtml(S.vsechnyOdkaz)}</nav>
<${uroven} class="nadpis-seznamu">${escHtml(nadpis)}</${uroven}>
<p class="fakt">${escHtml(S.vsechnyPopis)}</p>
${dlazdice(serazene)}`;
    const pozadi = (vnitrek, skryte) => `<div class="listek-pozadi" id="listek-pozadi" data-seznam="${prehled[lang]}" data-titulek="${escHtml(titulekSeznamu)}"${skryte ? " hidden" : ""}>${vnitrek}</div>`;

    serazene.forEach((j, poradi) => {
      const P = j[lang], pozdrav = P.pozdrav || j.pozdrav, i = bodJazyka[j.id], r = i >= 0 ? podrobnosti.radky[i] : null;
      const znakovy = r && glottolog.rodiny[glottolog.body[i][3]] === "Sign Language";
      const udaje = [];
      if (j.mluvcich) udaje.push([znakovy ? S.uzivatelu : T.mluvcich, Math.round(j.mluvcich * 1e6) < 100 ? T.hrstka : lidi(lang, T, Math.round(j.mluvcich * 1e6))]);
      if (P.rodina) udaje.push([T.rodina, P.rodina]);
      if (r && r[0] >= 0) udaje.push([T.vitalita, (znakovy ? T.aesZnak : T.aes)[r[0]][0]]);
      const st = staty(j, lang);
      if (st.length) udaje.push([znakovy ? S.kdeZnakuje : S.kdeMluvi, st.slice(0, 12).join(", ") + (st.length > 12 ? " " + S.aDalsi.replace("{n}", st.length - 12) : "")]);
      const cldr = r && (r[13] || r[14]) ? [r[13], r[14]] : podrobnosti.atlasCldr[j.id] || [];   // písmo a úřední status (CLDR)
      const pisma = cldr[0] ? cldr[0].split(" ").map(k => podrobnosti.pisma[lang][k] || k) : [];
      if (pisma.length) udaje.push([T.pismo, pisma.join(", ").replace(/^./, c => c.toUpperCase())]);
      const jmenoStatu = x => podrobnosti.staty[lang][x.slice(0, 2)] || x.slice(0, 2);
      const uredni = cldr[1] ? cldr[1].split(" ").sort((x, y) => x.slice(2) - y.slice(2) || jmenoStatu(x).localeCompare(jmenoStatu(y), T.locale))
        .map(x => jmenoStatu(x) + (T.uredniStav[+x.slice(2)] ? " (" + T.uredniStav[+x.slice(2)] + ")" : "")) : [];
      if (uredni.length) udaje.push([T.uredni, uredni.slice(0, 12).join(", ") + (uredni.length > 12 ? " " + S.aDalsi.replace("{n}", uredni.length - 12) : "")]);
      const pr = pribuzni(j.id);
      const pred = serazene[(poradi - 1 + serazene.length) % serazene.length], dalsi = serazene[(poradi + 1) % serazene.length];
      const listek = `<article class="listek" role="dialog" aria-modal="true" aria-labelledby="listek-nazev">
 <div class="listek-hlava">
  <a class="listek-sip listek-pred" href="${adresy[lang][pred.id]}" aria-label="${escHtml(S.predchozi + ": " + pred[lang].nazev)}" title="${escHtml(pred[lang].nazev)}">‹</a>
  <span class="listek-poradi">${poradi + 1} / ${serazene.length}</span>
  <a class="listek-sip listek-dalsi" href="${adresy[lang][dalsi.id]}" aria-label="${escHtml(S.dalsi + ": " + dalsi[lang].nazev)}" title="${escHtml(dalsi[lang].nazev)}">›</a>
  <a class="listek-x" href="${prehled[lang]}" aria-label="${escHtml(S.zavrit)}" title="${escHtml(S.zavrit)}">×</a>
 </div>
 <div class="jazyk">
  <img class="malba" src="/malby/${j.id}.jpg" width="800" height="500" alt="${escHtml(S.malbaAlt.replace("{n}", P.nazev))}">
  <div>
   <p class="pozdrav" dir="auto" lang="${escHtml(j.kod || "")}">${escHtml(pozdrav)}</p>
   ${P.vyslovnost ? `<p class="cteme">${escHtml(T.vyslovnost.replace("{x}", P.vyslovnost))}</p>` : ""}
   <h1 id="listek-nazev">${escHtml(P.nazev)}</h1>
   ${j.domaci ? `<p class="domaci">${escHtml(T.domaciJmeno.replace("{x}", j.domaci))}</p>` : ""}
   <div class="akce">${tlacitkoZvuk(lang, j, false)}<a class="tl" href="${domov[lang]}#${j.id}">${escHtml(S.najit)}</a></div>
   <p class="zvuk-stav" id="zvuk-stav" role="status" hidden></p>
   <dl>${udaje.map(u => `<dt>${escHtml(u[0])}</dt><dd>${escHtml(u[1])}</dd>`).join("")}</dl>
  </div>
 </div>
 <div class="listek-linky">
 ${P.fakt ? `<h2>${escHtml(T.zalozkaZajimavost)}</h2>\n <p class="fakt">${escHtml(P.fakt)}</p>` : ""}
 ${pr.length ? `<h2>${escHtml(T.pribuzniAtlas)}</h2>\n ${dlazdice(pr)}` : ""}
 </div>
</article>`;
      const titulek = S.titulek.replace("{n}", P.nazev) + " · " + T.nazev;
      const popis = `${pozdrav} ${P.vyslovnost ? T.vyslovnost.replace("{x}", P.vyslovnost) + ". " : ""}${P.fakt || ""}`.trim();
      zapis(adresy[lang][j.id], stranka({ lang, adresa: adresy[lang][j.id], jinaAdresa: adresy[jiny][j.id], titulek, popis,
        obrazek: { src: `/malby/${j.id}.jpg`, w: 800, h: 500 }, obsah: seznamHtml("h2") + "\n" + pozadi(listek, false), listek: true }));
      vsechny.push([adresy[lang][j.id], adresy[jiny][j.id], lang]);
    });

    /* přehled všech jazyků s pozdravem (lístky se nad ním otevírají) */
    zapis(prehled[lang], stranka({ lang, adresa: prehled[lang], jinaAdresa: prehled[jiny], titulek: titulekSeznamu,
      popis: S.vsechnyPopis, obrazek: obrazekWebu(lang), obsah: seznamHtml("h1") + "\n" + pozadi("", true), listek: true }));
    vsechny.push([prehled[lang], prehled[jiny], lang]);

    /* O datech: stejný obsah jako okno v aplikaci */
    const O = T.oDatech, datum = d => d ? new Date(d + "T12:00:00Z").toLocaleDateString(T.locale, { day: "numeric", month: "long", year: "numeric" }) : "–";
    const dosad = s => s.replace(/\{(\w+)\}/g, (_, k) => ({ g: cislo(lang, verze.g), n: cislo(lang, verze.n), a: cislo(lang, vsechnyJazyky.length),
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

    /* podrobný návod: stejný text jako okno v aplikaci */
    const N = T.navod;
    zapis(navodA[lang], stranka({ lang, adresa: navodA[lang], jinaAdresa: navodA[jiny], titulek: N.nadpis + " · " + T.nazev,
      popis: N.uvod, obrazek: obrazekWebu(lang),
      obsah: `<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › ${escHtml(N.nadpis)}</nav>
<div class="text">
<h1>${escHtml(N.nadpis)}</h1>
<p class="uvod">${escHtml(N.uvod)}</p>
${N.oddily.map(o => `<h2>${escHtml(o.h)}</h2>\n${o.p.map(p => `<p>${escHtml(p)}</p>`).join("\n")}`).join("\n")}
<p><a class="tl" href="${domov[lang]}">${escHtml(S.globus)}</a></p>
</div>` }));
    vsechny.push([navodA[lang], navodA[jiny], lang]);

    /* kalendář jazykových dnů: stejný seznam jako okno v aplikaci, odkazy na stránky jazyků */
    const K = T.kalendar, TYDEN = ["ne", "po", "ut", "st", "ct", "pa", "so"], rok = 2026;
    const denPohyblivy = k => { const m = +k.slice(0, 2) - 1, wd = TYDEN.indexOf(k.slice(3, 5)), n = +k.slice(5), p1 = new Date(rok, m, 1);
      return new Date(rok, m, 1 + (wd - p1.getDay() + 7) % 7 + (n - 1) * 7); };
    const radky = Object.keys(dny).filter(k => k !== "_pozn").concat(["09-26"]).map(k => ({ k, pohyb: !/^\d\d-\d\d$/.test(k),
      d: /^\d\d-\d\d$/.test(k) ? new Date(rok, +k.slice(0, 2) - 1, +k.slice(3)) : denPohyblivy(k) })).sort((a, b) => a.d - b.d);
    const nazevDne = (k, d) => k.pohyb ? S.druhaSobota : lang === "cs" ? d.getDate() + ". " + (d.getMonth() + 1) + "." : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    let mes = -1, html = "";
    for (const x of radky) {
      if (x.d.getMonth() !== mes) { if (mes >= 0) html += "</ul>\n"; mes = x.d.getMonth(); html += `<h2>${escHtml(new Date(rok, mes, 1).toLocaleDateString(T.locale, { month: "long" }))}</h2>\n<ul class="kal">`; }
      let odkaz, jmeno, pozdrav = "", lg = "", proc;
      if (x.k === "09-26") { odkaz = domov[lang] + "?den-jazyku"; jmeno = T.denJazykuNadpis; proc = K.edl; }
      else { const s2 = dny[x.k]; proc = s2[lang];
        if (s2.kod) { const b2 = glottolog.body.find(b => b[6] === s2.kod); odkaz = domov[lang] + "#" + s2.kod; jmeno = (lang === "cs" && podrobnosti.radky[glottolog.body.indexOf(b2)][9]) || b2[0]; pozdrav = s2.pozdrav; lg = s2.jazyk || ""; }
        else { const j = vsechnyJazyky.find(j => j.id === s2.id); odkaz = adresy[lang][j.id] || domov[lang] + "#" + j.id; jmeno = j[lang].nazev; pozdrav = j[lang].pozdrav || j.pozdrav; lg = j.kod || ""; } }
      if (jmeno) jmeno = jmeno.charAt(0).toUpperCase() + jmeno.slice(1);
      html += `<li><span class="kal-d">${escHtml(nazevDne(x, x.d))}</span><span><a href="${odkaz}">${pozdrav ? `<b dir="auto" lang="${escHtml(lg)}">${escHtml(pozdrav)}</b> ` : ""}${escHtml(jmeno)}</a><br><span class="kal-p">${escHtml(proc)}</span></span></li>\n`;
    }
    html += "</ul>";
    zapis(kalendarA[lang], stranka({ lang, adresa: kalendarA[lang], jinaAdresa: kalendarA[jiny], titulek: K.nadpis + " · " + T.nazev,
      popis: K.uvod, obrazek: obrazekWebu(lang),
      obsah: `<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › ${escHtml(K.nadpis)}</nav>
<div class="text">
<h1>${escHtml(K.nadpis)}</h1>
<p class="uvod">${escHtml(K.uvod)}</p>
${html}
<p>${escHtml(K.ostatni)}</p>
</div>` }));
    vsechny.push([kalendarA[lang], kalendarA[jiny], lang]);

    /* jazyky starověku: stránky o civilizacích, stejná šablona (src/starovek.js) jako okno v aplikaci */
    for (const c of starovek.civilizace) {
      const adresa = civAdresa(c, lang), jina = civAdresa(c, jiny), L = c[lang], Us = T.starovek, Uk = c.sekce === "pribehy" ? T.pribehy : T.starovek;
      const tecka = k => { const i = bodPodleKodu.get(k); if (i === undefined) return null;
        const n = (lang === "cs" && podrobnosti.radky[i][9]) || glottolog.body[i][0]; return { nazev: n.charAt(0).toUpperCase() + n.slice(1), href: domov[lang] + "#" + k }; };
      const clanek = STAROVEK.html(c, lang, { U: Us, foto: k => `/starovek/${c.id}/${c.fotky[k].soubor}`, fotoMala: k => `/starovek/${c.id}/${k}-720.jpg`,
        malba: `<img src="/starovek/${c.id}/malba.jpg" alt="" width="1200" height="630">`, tecka,
        vsechny: starovek.civilizace, dalsi: starovek.civilizace.filter(x => (x.sekce || "") === (c.sekce || "")), odkazCiv: x => civAdresa(x, lang),
        odkazMapa: id => domov[lang] + "#mapa-" + id });
      const pisma = STAROVEK.odkazPisma(c);
      zapis(adresa, stranka({ lang, adresa, jinaAdresa: jina, titulek: (c.prehled || c.sekce ? L.nazev : Us.titulek.replace("{n}", L.nazev)) + " · " + T.nazev, popis: L.perex,
        obrazek: { src: `/starovek/${c.id}/malba.jpg`, w: 1200, h: 630 },
        obsah: `${pisma ? `<link rel="stylesheet" href="${escHtml(pisma)}">` : ""}<style>${stylStarovek}
main{max-width:1100px} .civ{border-radius:18px; overflow:hidden; box-shadow:0 30px 70px -40px rgba(25,32,60,.55); border:1px solid var(--linka)}
.civ dl{display:block} .civ .civ-glosy{display:flex}</style>
<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › <a href="${sekceA(c)[lang]}">${escHtml(Uk.stitek)}</a> › ${escHtml(L.nazev)}</nav>
${clanek}
<p><a class="tl" href="${domov[lang]}#${c.adresa[lang]}">${escHtml(Us.zpet)}</a></p>` }));
      vsechny.push([adresa, jina, lang]);
    }
    /* rozcestníky Jazyky starověku (/starovek/, /en/ancient/) a Příběhy jazyků (/pribehy/, /en/stories/) */
    for (const [sekce, Us, A] of [["", T.starovek, starovekA], ["pribehy", T.pribehy, pribehyA]]) {
      const stranky = starovek.civilizace.filter(c => (c.sekce || "") === sekce);
      if (!stranky.length) continue;
      const karty = stranky.map(c => `<li><a class="civ-rozcestnik" href="${civAdresa(c, lang)}"><img src="/starovek/${c.id}/malba.jpg" alt="" width="1200" height="630" loading="lazy"><b>${escHtml(c[lang].nazev)}</b><small>${escHtml(c[lang].podtitul)}</small><span>${escHtml(c[lang].perex)}</span></a></li>`).join("");
      zapis(A[lang], stranka({ lang, adresa: A[lang], jinaAdresa: A[jiny], titulek: Us.stitek + " · " + T.nazev, popis: Us.uvod,
        obrazek: { src: `/starovek/${stranky[0].id}/malba.jpg`, w: 1200, h: 630 },
        obsah: `<style>.civ-rozcestniky{list-style:none; margin:18px 0 0; padding:0; display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px}
.civ-rozcestnik{display:flex; flex-direction:column; gap:4px; height:100%; padding:0 0 16px; border-radius:16px; overflow:hidden; background:var(--karta); border:1px solid var(--linka); color:inherit; text-decoration:none}
.civ-rozcestnik:hover{border-color:var(--odkaz)} .civ-rozcestnik img{width:100%; height:auto; aspect-ratio:16/9; object-fit:cover; display:block; margin-bottom:8px}
.civ-rozcestnik b{font:600 1.35rem var(--nadpis); padding:0 16px} .civ-rozcestnik small{color:var(--text2); padding:0 16px} .civ-rozcestnik span{font-size:.92rem; padding:4px 16px 0}</style>
<nav class="drobky" aria-label="${escHtml(S.drobky)}"><a href="${domov[lang]}">${escHtml(T.nazev)}</a> › ${escHtml(Us.stitek)}</nav>
<h1>${escHtml(Us.stitek)}</h1>
<p class="fakt">${escHtml(Us.uvod)}</p>
<ul class="civ-rozcestniky">${karty}</ul>` }));
      vsechny.push([A[lang], A[jiny], lang]); }
  }
  return { adresy, prehled, stranky: vsechny };
}
