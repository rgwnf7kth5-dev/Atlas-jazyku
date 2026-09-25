/* Atlas jazyků – glóbus, police jazyků a karty. Build sem vkládá data i texty rozhraní. */
(function(){
"use strict";
const UI = /*__UI__*/null;             // texty rozhraní obou jazyků {cs, en}
const VYCHOZI = /*__VYCHOZI__*/"cs";   // jazyk, ve kterém stránka startuje
const ARTEFAKT = /*__ARTEFAKT__*/false;
const SVET = /*__SVET__*/null;
const JAZYKY = /*__JAZYKY__*/null;
const VERZE = /*__VERZE__*/null;                 // kdy byla stažena data (stránka O datech)
const STATY_VSE = /*__STATY__*/null;
const REJSTRIK = /*__REJSTRIK__*/null;
const VYMYSLENE = /*__VYMYSLENE__*/null; // jazyky z knih a filmů, jen v Bráně do jiných světů („mellon“)
const PD = /*__PODROBNOSTI__*/null;   // podrobnosti k tečkám (Glottolog, WALS, PHOIBLE, UDHR, CLDR)
let T = UI[VYCHOZI];
let denni = document.documentElement.getAttribute("data-theme") === "light";   // denní vzhled (viz níž)
let STATY = STATY_VSE[VYCHOZI];

const SKUPINY = ["ie", "st", "an", "afro", "nk", "ost"];   // pořadí je součást ověření palety
const R = Math.PI / 180;
const $ = function(id){ return document.getElementById(id); };
const bezPohybu = window.matchMedia("(prefers-reduced-motion: reduce)");
const nazevZeme = function(en){ return STATY[en] || en; };
const bezDiakritiky = function(s){ return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
const cislo = function(n, des){
  return n.toLocaleString(T.locale, {maximumFractionDigits: des || 0, minimumFractionDigits: des || 0});
};
/* text rozhraní; ve dne má pár textů vlastní znění („bod“ místo „světélka“) s příponou Den */
function tx(klic){ return denni && T[klic + "Den"] != null ? T[klic + "Den"] : T[klic]; }
function t(klic, promenne){
  return String(tx(klic)).replace(/\{(\w+)\}/g, function(_, k){ return promenne && k in promenne ? promenne[k] : ""; });
}
function tvar(n, tvary){ /* [1, 2–4, 5+, desetinné] – čeština je potřebuje, angličtině stačí dva */
  if (!Array.isArray(tvary)) return tvary;
  if (Math.floor(n) !== n) return tvary[3] || tvary[2];     // 1,6 milionu
  if (n === 1) return tvary[0];
  if (T.lang === "cs" && n >= 2 && n <= 4 && Math.floor(n) === n) return tvary[1];
  return tvary[2];
}
function plynule(t2){ return ((t2 *= 2) <= 1 ? t2 * t2 * t2 : (t2 -= 2) * t2 * t2 + 2) / 2; }

/* ---------- mapa (smí selhat, stránka přežije) ---------- */
let ZEME = [], SOUS = null, globusOk = false;
try {
  if (typeof d3 === "undefined" || !d3.geoOrthographic) throw new Error("chybí d3-geo");
  if (typeof topojson === "undefined") throw new Error("chybí topojson");
  ZEME = topojson.feature(SVET, SVET.objects.countries).features;
  SOUS = topojson.feature(SVET, SVET.objects.land);
  globusOk = true;
} catch (e) { console.error("Glóbus se nepodařilo připravit:", e); }
const ZEME_PODLE_JMENA = {};
ZEME.forEach(function(f){ ZEME_PODLE_JMENA[f.properties.name] = f; });

/* ---------- rejstříky ---------- */
const PODLE_ID = {}, V_ZEMI = {};
JAZYKY.forEach(function(j){
  PODLE_ID[j.id] = j;
  j.zeme.forEach(function(z){ (V_ZEMI[z] = V_ZEMI[z] || []).push(j); });
});
/* texty jazyků v aktuálním jazyce rozhraní; hledat jde oběma jazyky */
function prelozData(){
  JAZYKY.forEach(function(j){
    const p = j.t[T.lang];
    j.n = p.n; j.prep = p.prep; j.rod = p.rod; j.fakt = p.fakt; j.pis = p.pis || j.pis0;
    j.hledat = bezDiakritiky([j.t.cs.n, j.t.en.n, j.dom, j.pis, j.prep, j.rod]
      .concat(j.zeme.map(function(z){ return STATY_VSE.cs[z] + " " + STATY_VSE.en[z]; })).join(" "));
  });
  REJSTRIK.rr = REJSTRIK.r[T.lang];
  REJSTRIK.mm = REJSTRIK.m[T.lang];
}
prelozData();
const B = REJSTRIK.b, POCET_B = B.length;
const bLon = new Float64Array(POCET_B), bSinLat = new Float64Array(POCET_B), bCosLat = new Float64Array(POCET_B);
const bPx = new Float32Array(POCET_B), bPy = new Float32Array(POCET_B), bVid = new Uint8Array(POCET_B);
const bHledat = new Array(POCET_B);
const radek = function(i){ return PD.radky[i] || []; };
const velke = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
const sourozenci = new Map();                     // skupina → tečky, které do ní patří
for (let i = 0; i < POCET_B; i++) {
  const lat = B[i][2] * R;
  bLon[i] = B[i][1] * R; bSinLat[i] = Math.sin(lat); bCosLat[i] = Math.cos(lat);
  const nar = PD.nareci[i] ? PD.nareci[i].split("|") : [];          // hledání najde jazyk i podle jeho nářečí
  bHledat[i] = bezDiakritiky(B[i][0] + " " + (radek(i)[9] || "") + " " + nar.join(" ") + " " + nar.map(function(n){ return PD.nareciCs[n] || ""; }).join(" "));
  const sk = radek(i)[2];
  if (sk >= 0) { if (!sourozenci.has(sk)) sourozenci.set(sk, []); sourozenci.get(sk).push(i); }
}
const BEZ_RODU = new Set(REJSTRIK.nr);
const BEZ_POLOHY = new Uint8Array(REJSTRIK.b.length);    // esperanto a spol.: v seznamu jsou, na glóbu ne
REJSTRIK.bp.forEach(function(i){ BEZ_POLOHY[i] = 1; });           // umělé jazyky, pidžiny, smíšené jazyky, zvláštní mluvy: nejsou rodina
const BOD_ATLASU = {};                            // jazyk z atlasu → jeho tečka v rejstříku
for (let i = POCET_B - 1; i >= 0; i--) if (B[i][5]) BOD_ATLASU[B[i][5]] = i;
const POLOZEK_SEZNAMU = JAZYKY.length + POCET_B - Object.keys(BOD_ATLASU).length;   // jazyky atlasu + tečky bez jazyka atlasu
/* rodina a světadíl jazyka z atlasu pro řazení police; tři jazyky atlasu (srbština, chorvatština, hmongština) tečku nemají:
   rodinu vezmu z jejího českého popisu, světadíl od nejbližší tečky */
const RODINA_ATLASU = {}, OBLAST_ATLASU = {};
JAZYKY.forEach(function(j){
  const i = BOD_ATLASU[j.id];
  if (i >= 0) { RODINA_ATLASU[j.id] = B[i][3]; OBLAST_ATLASU[j.id] = B[i][4]; return; }
  RODINA_ATLASU[j.id] = REJSTRIK.r.cs.indexOf((j.t.cs.rod || "").split(" – ")[0]);
  let nej = -1, d = Infinity;
  for (let k = 0; k < POCET_B; k++) {
    const dx = (B[k][1] - j.stred[0]) * Math.cos(j.stred[1] * R), dy = B[k][2] - j.stred[1], dd = dx * dx + dy * dy;
    if (dd < d) { d = dd; nej = k; }
  }
  OBLAST_ATLASU[j.id] = nej >= 0 ? B[nej][4] : -1;
});
/* ---------- znakové jazyky: všechny / bez nich / jen ony ---------- */
const ZNAKOVY = new Uint8Array(POCET_B);
REJSTRIK.zn.forEach(function(i){ ZNAKOVY[i] = 1; });
const skryty = new Uint8Array(POCET_B);   // tečka, kterou filtr schovává
let rezimZnak = "vse", povolenych = POCET_B;
function jeZnakovyJazyk(j){ const i = BOD_ATLASU[j.id]; return i >= 0 && ZNAKOVY[i] === 1; }
/* vitalita: 0–5 = šest stupňů UNESCO (bezpečný … vymřelý), 6 = probouzený, -1 = bez údaje */
const VSECHNY_STUPNE = [0, 1, 2, 3, 4, 5, 6, -1], OHROZENE = [1, 2, 3, 4];
let povoleneStupne = new Set(VSECHNY_STUPNE);
let barvitVitalitu = false;              // tečky v barvách vitality: zapnuté tlačítkem v liště, nebo otevřený panel „Vitalita“
let vitalitaZap = false;                 // tlačítko „Vitalita“ v liště (pamatuje se, atlas-barvy-vitality)
function promennaVitality(v){ return "var(--" + (v < 0 ? "vit-nic" : "vit-" + v) + ")"; }
function vitalitaBodu(i){ const v = radek(i)[0]; return v == null ? -1 : v; }
function atlasSkryty(j){
  const i = BOD_ATLASU[j.id];
  if (!povoleneStupne.has(i >= 0 ? vitalitaBodu(i) : -1)) return true;
  return rezimZnak === "bez" ? jeZnakovyJazyk(j) : rezimZnak === "jen" ? !jeZnakovyJazyk(j) : false;
}
function jmenoBodu(i){
  const id = B[i][5];
  if (id && PODLE_ID[id]) return PODLE_ID[id].n;
  const cs = T.lang === "cs" && radek(i)[9];
  return cs ? velke(cs) : B[i][0];
}

try { localStorage.removeItem("atlas-sbirka"); } catch (e) {}   // úklid po zrušené sbírce pozdravů

/* ---------- denní a noční vzhled: podle nastavení počítače, přepínač má přednost ---------- */
const svetlySystem = window.matchMedia("(prefers-color-scheme: light)");
function ulozenyMotiv(){ try { return localStorage.getItem("atlas-motiv"); } catch (e) { return null; } }
function obnovPrepinacMotivu(){
  $("ikona-rezim").setAttribute("href", denni ? "#i-mesic" : "#i-slunce");
  $("prepinac").setAttribute("aria-pressed", denni ? "true" : "false");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", denni ? "#E4EEFF" : "#02030A");
}
function nastavMotiv(den){
  if (!!den === denni) return;
  denni = !!den;
  document.documentElement.setAttribute("data-theme", denni ? "light" : "dark");
  obnovPrepinacMotivu();
  obnovTexty();
  kresliHvezdy();
  if (globusOk && ctx) {
    nactiBarvy(); koule.klic = ""; koule.kandidat = ""; SVETLA = null;
    potrebaKresli = true; teckyZmeneny = true; popiskyZmeneny = true; ozivit();
  }
}
$("prepinac").addEventListener("click", function(){
  nastavMotiv(!denni);
  /* volba shodná s počítačem se nepamatuje – stránka se pak zase řídí počítačem */
  try {
    if (denni === svetlySystem.matches) localStorage.removeItem("atlas-motiv");
    else localStorage.setItem("atlas-motiv", denni ? "light" : "dark");
  } catch (e) {}
});
svetlySystem.addEventListener("change", function(){ if (!ulozenyMotiv()) nastavMotiv(svetlySystem.matches); });
obnovPrepinacMotivu();

/* ---------- police ---------- */
const seznam = $("seznam");
function tlacitko(nazev, podtitul, barva, trida){
  const tl = document.createElement("button");
  tl.type = "button"; tl.className = "jaz" + (trida ? " " + trida : "");
  if (barva) tl.style.setProperty("--r-barva", barva);
  const pruh = document.createElement("span"); pruh.className = "pruh";
  const txt = document.createElement("span"); txt.className = "txt";
  const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = nazev;
  const sub = document.createElement("span"); sub.className = "sub"; sub.textContent = podtitul;
  txt.appendChild(nm); txt.appendChild(sub); tl.appendChild(pruh); tl.appendChild(txt);
  return tl;
}
/* dlaždice jazyka z atlasu: hlavní je pozdrav ve vlastním písmu, pod ním název */
function dlazdice(j){
  const tl = document.createElement("button");
  tl.type = "button"; tl.className = "jaz s-pozdravem";
  tl.style.setProperty("--r-barva", "var(--r-" + j.sk + ")");
  const pz = prvek("span", "pz", j.pis);
  if (j.kod) pz.lang = j.kod;
  tl.appendChild(pz); tl.appendChild(prvek("span", "nm", j.n));
  tl.dataset.id = j.id;
  tl.setAttribute("aria-pressed", vybrany && vybrany.typ === "atlas" && vybrany.id === j.id ? "true" : "false");
  tl.addEventListener("click", function(){ vyber(j.id); });
  return tl;
}
/* jazyk dne: každý den jiný, stejný pro všechny */
/* ---------- Jazyk dne má vždy důvod (přání uživatele 25. 9. 2026) ----------
   Význačné dny (data/dny-jazyku.json: den jazyka, státní svátek, výročí) mají svůj jazyk a vysvětlení.
   Ostatní dny Jazyk dne cestuje kolem světa: pořadí CESTA vede od češtiny vždy k nejbližšímu dosud
   nenavštívenému jazyku a karta řekne, o kolik kilometrů a kterým směrem jsme se od včerejška posunuli. */
const DNY = /*__DNY__*/null;
function stredJazyka(j){ const i = BOD_ATLASU[j.id]; return i >= 0 && !BEZ_POLOHY[i] ? [B[i][1], B[i][2]] : j.stred; }
const CESTA = (function(){
  const zbyva = JAZYKY.slice(), c = [];
  let ted = zbyva.splice(Math.max(0, zbyva.findIndex(function(j){ return j.id === "cs"; })), 1)[0];
  while (ted) {
    c.push(ted);
    const p = stredJazyka(ted);
    let nej = -1, d = Infinity;
    zbyva.forEach(function(j, k){ const x = d3.geoDistance(p, stredJazyka(j)); if (x < d) { d = x; nej = k; } });
    ted = nej >= 0 ? zbyva.splice(nej, 1)[0] : null;
  }
  return c;
})();
function mistniDen(d){ return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5); }   // místní den, ať sedí s datem na kartě
const DNY_TYDNE = ["ne", "po", "ut", "st", "ct", "pa", "so"];
function klicDne(d){ return String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function klicPohyblivy(d){ return String(d.getMonth() + 1).padStart(2, "0") + "-" + DNY_TYDNE[d.getDay()] + Math.ceil(d.getDate() / 7); }
function dataPohyblivehoDne(k, rok){          /* „09-so2“ → datum druhé soboty v září daného roku */
  const m = +k.slice(0, 2) - 1, wd = DNY_TYDNE.indexOf(k.slice(3, 5)), n = +k.slice(5);
  const prvni = new Date(rok, m, 1), posun = (wd - prvni.getDay() + 7) % 7;
  return new Date(rok, m, 1 + posun + (n - 1) * 7);
}
function bodDne(s){ return s && s.kod && PODLE_KODU.has(s.kod) ? PODLE_KODU.get(s.kod) : -1; }
function platnyDen(s){
  if (!s) return false;
  if (s.kod) { const i = bodDne(s); return i >= 0 && !skryty[i]; }
  return !!PODLE_ID[s.id] && !atlasSkryty(PODLE_ID[s.id]);
}
function svatekDne(d){
  if (!DNY) return null;
  const s = DNY[klicDne(d)], s2 = DNY[klicPohyblivy(d)];
  return platnyDen(s) ? s : platnyDen(s2) ? s2 : null;
}
/* tečka rejstříku jako Jazyk dne (esperanto, latina): jméno z rejstříku, pozdrav a výslovnost z dny-jazyku.json */
function jazykZDne(s){
  if (!s.kod) return PODLE_ID[s.id];
  const i = bodDne(s);
  return {id: s.kod, n: jmenoBodu(i), pis: s.pozdrav, prep: s.vyslovnost ? s.vyslovnost[T.lang] : "", kod: s.jazyk || "", bod: i};
}
function jazykCesty(den){
  for (let n = 0; n < CESTA.length; n++) { const j = CESTA[((den - n) % CESTA.length + CESTA.length) % CESTA.length]; if (!atlasSkryty(j)) return j; }
  return null;
}
function smerCesty(a, b){                  /* směr a vzdálenost z bodu a do bodu b (délka, šířka) */
  const r = Math.PI / 180, f1 = a[1] * r, f2 = b[1] * r, dl = (b[0] - a[0]) * r;
  const az = (Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)) / r + 360) % 360;
  return {km: d3.geoDistance(a, b) * 6371, smer: Math.round(az / 45) % 8};
}
function jazykDne(){
  const dnes = new Date(), den = mistniDen(dnes), s = svatekDne(dnes);
  if (s) return {j: jazykZDne(s), duvod: s[T.lang]};
  const j = jazykCesty(den);
  if (!j) return null;
  const vcera = new Date(dnes.getTime() - 864e5), sv = svatekDne(vcera), pred = sv ? jazykZDne(sv) : jazykCesty(den - 1);
  if (vcera.getMonth() === 8 && vcera.getDate() === 26) return {j: j, duvod: T.cestaPoDniJazyku};   // včera byl Evropský den jazyků, ne Jazyk dne
  if (!pred || pred === j) return {j: j, duvod: T.cestaUvod};
  const c = smerCesty(stredJazyka(pred), stredJazyka(j));
  const km = c.km < 30 ? 0 : c.km < 1000 ? Math.round(c.km / 10) * 10 : Math.round(c.km / 50) * 50;
  /* uprostřed věty česky malým písmenem („u jazyka čeština“); vlastní jména jako Tok Pisin nechat */
  const jm = T.lang === "cs" && /ina( |$)|jazyk/.test(pred.n) ? pred.n.charAt(0).toLowerCase() + pred.n.slice(1) : pred.n;
  return {j: j, duvod: km ? t("cestaDuvod", {a: jm, km: cislo(km), smer: T.svetoveStrany[c.smer]}) : t("cestaVedle", {a: jm})};
}
let razeni = "rodiny";
try { razeni = localStorage.getItem("atlas-razeni") || "rodiny"; } catch (e) {}
const tlRazeni = Array.prototype.slice.call(document.querySelectorAll("[data-razeni]"));
function nastavRazeni(r2){
  razeni = ["rodiny", "abeceda", "svetadil"].indexOf(r2) >= 0 ? r2 : "rodiny";
  tlRazeni.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.razeni === razeni ? "true" : "false"); });
  try { localStorage.setItem("atlas-razeni", razeni); } catch (e) {}
}
tlRazeni.forEach(function(b){ b.addEventListener("click", function(){ nastavRazeni(b.dataset.razeni); postavPolici($("hledej").value); }); });
function nadpis(text, barva){
  const h2 = document.createElement("h2");       // nadpis skupiny v seznamu (karta jazyka má h2 pro název, oddíly h3)
  if (barva) { const s = document.createElement("span"); s.className = "tecka"; s.style.background = barva; h2.appendChild(s); }
  h2.appendChild(document.createTextNode(text));
  return h2;
}
/* Evropský den jazyků (26. září, Rada Evropy od roku 2001): ten den je místo Jazyka dne karta „Evropské jazyky“
   s vysvětlením a se všemi evropskými jazyky atlasu najednou (přání uživatele 25. 9. 2026); tlačítko je rozsvítí
   na glóbu (spustEU("evropa")). Vyzkoušet jde kdykoli adresou s ?den-jazyku. Zavřená karta se do dalšího roku
   neukáže a místo ní je zase Jazyk dne. */
const EVROPSKE = ["cs", "sk", "pl", "de", "en", "fr", "es", "it", "pt", "nl", "sv", "da", "no", "fi", "is", "ga", "cy", "el", "hu", "ro",
  "bg", "hr", "sr", "sl", "uk", "ru", "be", "lt", "lv", "et", "sq", "mk", "mt", "ca", "eu", "gl", "lb", "fo", "br", "gd", "se", "hy", "ka", "tr",
  "fy", "oc", "sc", "rom", "yi", "czj", "ce", "os"];
let denJazykuZavren = false;
function denJazyku(){
  const d = new Date(), klic = "atlas-den-jazyku-" + d.getFullYear();
  if (denJazykuZavren) return false;
  try { if (localStorage.getItem(klic)) return false; } catch (e) {}
  return (d.getMonth() === 8 && d.getDate() === 26) || /(^|[?&])den-jazyku/.test(location.search);
}
function kartaDneJazyku(){
  const razic = new Intl.Collator(T.locale);
  const jazyky = EVROPSKE.map(function(id){ return PODLE_ID[id]; }).filter(function(j){ return j && !atlasSkryty(j); })
    .sort(function(a, b){ return razic.compare(a.n, b.n); });
  const k = prvek("section", "den-jazyku");
  k.setAttribute("aria-labelledby", "dj-nadpis");
  const x = prvek("button", "dj-zavrit"); x.type = "button"; x.setAttribute("aria-label", T.denJazykuZavrit);
  x.innerHTML = '<svg aria-hidden="true"><use href="#i-krizek"/></svg>';
  x.addEventListener("click", function(){
    denJazykuZavren = true;
    try { localStorage.setItem("atlas-den-jazyku-" + new Date().getFullYear(), "1"); } catch (e) {}
    postavPolici($("hledej").value);           // místo karty se vrátí Jazyk dne
  });
  k.appendChild(x);
  k.appendChild(prvek("span", "dj-stitek", T.denJazykuDatum));
  const h = prvek("h2", "dj-nadpis", T.denJazykuNadpis); h.id = "dj-nadpis"; k.appendChild(h);
  k.appendChild(prvek("p", "dj-text", t("denJazykuText", {n: cislo(jazyky.length)})));
  const akce = prvek("div", "dj-akce");
  const b1 = prvek("button", "dj-tl hlavni", T.denJazykuGlobus); b1.type = "button";
  b1.addEventListener("click", function(){ spustEU("evropa"); });
  const b2 = prvek("button", "dj-tl", T.denJazykuEU); b2.type = "button";
  b2.addEventListener("click", function(){ spustEU(); });
  akce.appendChild(b1); akce.appendChild(b2); k.appendChild(akce);
  const m = prvek("div", "dj-jazyky");
  jazyky.forEach(function(j){
    const b = prvek("button", "dj-j"); b.type = "button";
    b.style.setProperty("--r-barva", "var(--r-" + j.sk + ")");
    const pz = prvek("span", "dj-pz", j.pis); if (j.kod) pz.lang = j.kod; pz.dir = "auto";
    b.appendChild(pz); b.appendChild(prvek("span", "dj-jm", j.n));
    b.addEventListener("click", function(){ vyber(j.id); });
    m.appendChild(b);
  });
  k.appendChild(m);
  return k;
}
function postavPolici(filtr){
  const hledane = bezDiakritiky(filtr || "").trim();
  $("hledej-x").hidden = !$("hledej").value;
  seznam.textContent = "";
  const evropskyDen = !hledane && denJazyku();
  if (evropskyDen) seznam.appendChild(kartaDneJazyku());
  if (!hledane && !evropskyDen) {            /* jazyk dne nahoře (na Evropský den jazyků místo něj evropské jazyky) */
    const dd = jazykDne(), d = dd && dd.j;
    if (d) {
      const tl = prvek("button", "jazyk-dne");
      tl.type = "button";
      const st = prvek("span", "jd-stitek");
      st.innerHTML = '<svg aria-hidden="true"><use href="#i-hvezda"/></svg>';
      st.appendChild(document.createTextNode(T.jazykDne + " · " + new Intl.DateTimeFormat(T.locale, {day: "numeric", month: "long"}).format(new Date())));
      tl.appendChild(st);
      const pz = prvek("span", "jd-pozdrav", d.pis); if (d.kod) pz.lang = d.kod; tl.appendChild(pz);
      tl.appendChild(prvek("span", "jd-nazev", d.prep ? d.n + " · " + d.prep : d.n));
      if (dd.duvod) { const pr = prvek("span", "jd-proc"); pr.appendChild(prvek("b", null, T.jazykDneProc + " ")); pr.appendChild(document.createTextNode(dd.duvod)); tl.appendChild(pr); }
      if (d.fakt) tl.appendChild(prvek("span", "jd-fakt", d.fakt));
      const cta = prvek("span", "jd-akce", T.jazykDneUkaz);
      cta.insertAdjacentHTML("beforeend", '<svg aria-hidden="true"><use href="#i-dal"/></svg>');
      tl.appendChild(cta);
      if (KRAJINY[d.id] && typeof AKVARELY !== "undefined") { const m = prvek("span", "jd-malba"); vlozMalbu(m, d.id); tl.insertBefore(m, tl.firstChild); tl.classList.add("s-malbou"); }
      tl.addEventListener("click", function(){ if (d.bod >= 0) vyberBod(d.bod); else vyber(d.id); });
      seznam.appendChild(tl);
    }
  }
  /* celý rejstřík: jazyky z atlasu jako dlaždice s pozdravem, ostatní tečky menší; kreslí se po dávkách */
  const polozky = [];
  JAZYKY.forEach(function(j){
    if (atlasSkryty(j) || (hledane && j.hledat.indexOf(hledane) === -1 && !(BOD_ATLASU[j.id] >= 0 && bHledat[BOD_ATLASU[j.id]].indexOf(hledane) !== -1))) return;
    polozky.push({j: j, jm: j.n, rod: RODINA_ATLASU[j.id], mm: OBLAST_ATLASU[j.id]});
  });
  for (let i = 0; i < POCET_B; i++) {
    if (skryty[i] || (B[i][5] && PODLE_ID[B[i][5]]) || (hledane && bHledat[i].indexOf(hledane) === -1)) continue;
    polozky.push({i: i, jm: jmenoBodu(i), rod: B[i][3], mm: B[i][4]});
  }
  const razic = new Intl.Collator(T.locale);
  polozky.sort(function(a, b){ return razic.compare(a.jm, b.jm); });
  const podle = new Map();
  polozky.forEach(function(p){
    const k = razeni === "abeceda" ? pismeno(p.jm) : razeni === "svetadil" ? p.mm : p.rod;
    if (!podle.has(k)) podle.set(k, {klic: k, s: [], bez: []});
    const g = podle.get(k);
    (p.j ? g.s : g.bez).push(p);
    if (p.j && !g.barva) g.barva = "var(--r-" + p.j.sk + ")";
  });
  let skupiny = Array.from(podle.values());
  if (razeni === "abeceda") {
    skupiny.sort(function(a, b){ return (a.klic === "#") - (b.klic === "#"); });
    skupiny.forEach(function(g){ g.nazev = g.klic; g.barva = null; });
  } else {
    const izolat = REJSTRIK.r.en.findIndex(function(r){ return /^isolate/.test(r); }),
          znakove = REJSTRIK.r.en.indexOf("sign language");
    const nakonec = function(g){ return g.klic == null || g.klic < 0 || (razeni === "rodiny" && g.klic === izolat) ? 1 : 0; };
    /* napřed rodina a světadíl jazyka, ve kterém čtenář stránku čte (čeština i angličtina: indoevropská, Eurasie) */
    const domov = PODLE_ID[T.lang] ? (razeni === "svetadil" ? OBLAST_ATLASU[T.lang] : RODINA_ATLASU[T.lang]) : null;
    const doma = function(g){ return g.klic === domov ? 0 : 1; };
    skupiny.sort(function(a, b){ return nakonec(a) - nakonec(b) || doma(a) - doma(b) || (b.s.length + b.bez.length) - (a.s.length + a.bez.length); });
    skupiny.forEach(function(g){
      if (razeni === "svetadil") { g.nazev = (g.klic >= 0 && REJSTRIK.mm[g.klic]) || T.svetadilOstatni; g.barva = null; }
      else g.nazev = g.klic === izolat ? T.izolovane : g.klic === znakove ? T.znakoveSkupina : g.klic >= 0 ? velke(REJSTRIK.rr[g.klic]) : T.nezarazene;
    });
  }
  let vymNalez = 0;
  if (hledane.length >= 3) {                 /* vymyšlené jazyky jen při hledání, zvlášť a jinak vypadají */
    const nalez = VYMYSLENE.jazyky.filter(function(v){
      return bezDiakritiky([v.cs.nazev, v.en.nazev, v.domaci || "", v.pozdrav, v.autor, v.cs.hledat, v.en.hledat, v.cs.dilo, v.en.dilo].join(" ")).indexOf(hledane) !== -1;
    });
    vymNalez = nalez.length;
    if (nalez.length) {
      const sekce = document.createElement("section"); sekce.className = "rodina z-jinych";
      sekce.appendChild(nadpis(T.zJinychSvetu, null));
      const m = document.createElement("div"); m.className = "mrizka";
      nalez.forEach(function(v){
        const tl = prvek("button", "jaz s-pozdravem vymysleny"); tl.type = "button";
        tl.appendChild(prvek("span", "pz", v.pozdrav));
        tl.appendChild(prvek("span", "nm", v[T.lang].nazev + " · " + v[T.lang].dilo));
        tl.addEventListener("click", function(){ otevriBranu(); ukazVymysleny(v.id); });
        m.appendChild(tl);
      });
      sekce.appendChild(m); seznam.appendChild(sekce);
    }
  }
  fronta = skupiny;
  seznam.appendChild(zarazka);
  pridavej(true);
  hlidej();

  if (!polozky.length && !vymNalez) {
    const p = document.createElement("p"); p.className = "prazdno"; p.textContent = T.nicNenalezeno; seznam.insertBefore(p, zarazka);
  }
  const sPozdravem = polozky.filter(function(p){ return p.j; }).length;
  $("pocet").textContent = t(hledane ? "nalezeno" : "vychoziPocet",
    {a: cislo(polozky.length) + " " + tvar(polozky.length, T.jazyk), b: cislo(sPozdravem)});
}
/* dávkové kreslení police: dalších ~240 dlaždic, když se k jejímu konci doroluje */
const zarazka = document.createElement("div"); zarazka.className = "zarazka";
let fronta = [], hlidac = null;
const DAVKA = 240;
function pridavej(prvni){
  let n = 0;
  while (fronta.length && n < (prvni ? DAVKA / 2 : DAVKA)) {
    const g = fronta[0];
    if (!g.sekce) {
      g.sekce = document.createElement("section"); g.sekce.className = "rodina";
      g.sekce.appendChild(nadpis(g.nazev + " (" + cislo(g.s.length + g.bez.length) + ")", g.barva));
      if (g.s.length) {
        const m = document.createElement("div"); m.className = "mrizka";
        g.s.forEach(function(p){ m.appendChild(dlazdice(p.j)); });
        g.sekce.appendChild(m); n += g.s.length;
      }
      if (g.s.length && g.bez.length) g.sekce.appendChild(prvek("p", "dalsi", t("dalsiJazyky", {a: cislo(g.bez.length)})));
      g.m = document.createElement("div"); g.m.className = "mrizka drobne";
      g.sekce.appendChild(g.m); g.od = 0;
      seznam.insertBefore(g.sekce, zarazka);
    }
    const do_ = Math.min(g.bez.length, g.od + DAVKA - n);
    for (; g.od < do_; g.od++, n++) {
      const i = g.bez[g.od].i;
      const tl = tlacitko(g.bez[g.od].jm, razeni === "abeceda" ? velke(REJSTRIK.rr[B[i][3]]) : kdeBod(i), null, "tecka-jaz");
      tl.addEventListener("click", function(){ vyberBod(i); });
      g.m.appendChild(tl);
    }
    if (g.od >= g.bez.length) fronta.shift();
  }
  zarazka.hidden = !fronta.length;
  pripravKlavesnici();
}
/* ---------- seznam z klávesnice ----------
   Dlaždic je až 8 000, proto se tabulátorem do seznamu vstoupí jen jednou (na jednu dlaždici, tabindex 0)
   a mezi dlaždicemi se chodí šipkami: vlevo/vpravo o jednu, nahoru/dolů o řádek (nejbližší dlaždice pod/nad),
   Home/End na začátek a konec, PageUp/PageDown o deset řádků. Další Tab seznam opustí. */
const DLAZDICE = "#seznam .mrizka > button, #seznam button.jazyk-dne, #seznam .dj-jazyky > button";
let aktivniDlazdice = null;
function pripravKlavesnici(){
  const vse = seznam.querySelectorAll(DLAZDICE);
  if (!aktivniDlazdice || !seznam.contains(aktivniDlazdice)) aktivniDlazdice = vse[0] || null;
  for (let k = 0; k < vse.length; k++) if (!vse[k].hasAttribute("tabindex")) vse[k].tabIndex = vse[k] === aktivniDlazdice ? 0 : -1;
  if (aktivniDlazdice) aktivniDlazdice.tabIndex = 0;
}
function zamerDlazdici(el){
  if (!el) return;
  if (aktivniDlazdice && aktivniDlazdice !== el) aktivniDlazdice.tabIndex = -1;
  aktivniDlazdice = el; el.tabIndex = 0; el.focus();
  el.scrollIntoView({block: "nearest"});
}
/* dlaždice o řádek níž (smer 1) nebo výš (-1): první jiný řádek ve směru, v něm vodorovně nejbližší */
function dlazdiceVRadku(vse, i, smer){
  const r0 = vse[i].getBoundingClientRect(), x0 = r0.left + r0.width / 2;
  let radek = null, nej = null, nejD = Infinity;
  for (let k = i + smer; k >= 0 && k < vse.length; k += smer) {
    const r = vse[k].getBoundingClientRect();
    if (radek === null) { if (smer > 0 ? r.top > r0.top + 2 : r.top < r0.top - 2) radek = r.top; else continue; }
    if (Math.abs(r.top - radek) > 2) break;
    const d = Math.abs(r.left + r.width / 2 - x0);
    if (d < nejD) { nejD = d; nej = vse[k]; }
  }
  return nej;
}
seznam.addEventListener("keydown", function(e){
  if (e.altKey || e.ctrlKey || e.metaKey || !e.target.matches || !e.target.matches(DLAZDICE)) return;
  const klic = e.key;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].indexOf(klic) < 0) return;
  e.preventDefault();
  let vse = Array.prototype.slice.call(seznam.querySelectorAll(DLAZDICE));
  let i = vse.indexOf(e.target), cil = null;
  const dolu = klic === "ArrowDown" || klic === "ArrowRight" || klic === "PageDown" || klic === "End";
  if (dolu && fronta.length && (klic === "End" || i > vse.length - 40)) {      // dokreslit další dávku, ať je kam jít
    if (klic === "End") while (fronta.length) pridavej(); else pridavej();
    vse = Array.prototype.slice.call(seznam.querySelectorAll(DLAZDICE)); i = vse.indexOf(e.target);
  }
  const rtl = getComputedStyle(seznam).direction === "rtl";
  if (klic === "ArrowRight") cil = vse[i + (rtl ? -1 : 1)];
  else if (klic === "ArrowLeft") cil = vse[i + (rtl ? 1 : -1)];
  else if (klic === "Home") cil = vse[0];
  else if (klic === "End") cil = vse[vse.length - 1];
  else {
    const smer = klic === "ArrowDown" || klic === "PageDown" ? 1 : -1, kroku = klic.indexOf("Page") === 0 ? 10 : 1;
    let k = i;
    for (let n = 0; n < kroku; n++) { const d = dlazdiceVRadku(vse, k, smer); if (!d) break; cil = d; k = vse.indexOf(d); }
  }
  zamerDlazdici(cil);
});
seznam.addEventListener("focusin", function(e){         // klik nebo Tab na dlaždici: ta se stane aktivní
  if (e.target.matches && e.target.matches(DLAZDICE) && e.target !== aktivniDlazdice) {
    if (aktivniDlazdice) aktivniDlazdice.tabIndex = -1;
    aktivniDlazdice = e.target; aktivniDlazdice.tabIndex = 0;
  }
});
function hlidej(){
  if (hlidac) hlidac.disconnect();
  if (!fronta.length) return;
  if (!("IntersectionObserver" in window)) { while (fronta.length) pridavej(); return; }
  const vlastniRolovani = getComputedStyle(seznam).overflowY !== "visible";
  hlidac = new IntersectionObserver(function(zaznamy){
    if (!zaznamy.some(function(z){ return z.isIntersecting; })) return;
    pridavej();
    hlidej();                  // znovu pozorovat: když je zarážka pořád na očích, přijde další dávka
  }, {root: vlastniRolovani ? seznam : null, rootMargin: "900px 0px"});
  hlidac.observe(zarazka);
}
/* podtitul malé dlaždice: první stát (a kolik dalších), jinak světadíl */
function kdeBod(i){
  if (BEZ_POLOHY[i]) return T.bezDomova;
  const staty = (radek(i)[3] || "").split(" ").filter(Boolean);
  if (!staty.length) return REJSTRIK.mm[B[i][4]] || "";
  return (PD.staty[T.lang][staty[0]] || staty[0]) + (staty.length > 1 ? " +" + (staty.length - 1) : "");
}
/* první písmeno pro řazení podle abecedy; čeština má Č, Ch, Ř, Š, Ž jako samostatná písmena */
function pismeno(jm){
  if (T.lang === "cs" && /^ch/i.test(jm)) return "Ch";
  const c = jm.charAt(0).toUpperCase();
  if (T.lang === "cs" && "ČŘŠŽ".indexOf(c) >= 0) return c;
  const z = c.normalize("NFD").charAt(0);
  return /[A-Z]/.test(z) ? z : "#";
}
$("hledej").addEventListener("input", function(e){ postavPolici(e.target.value); });
$("hledej-x").addEventListener("click", function(){ const h = $("hledej"); h.value = ""; postavPolici(""); h.focus(); });
/* odkaz „Přeskočit na seznam“ pro klávesnici: jen přesune fokus, adresu (#jazyk) nemění */
document.querySelector(".preskocit").addEventListener("click", function(e){ e.preventDefault(); $("hledej").focus(); });

/* ---------- glóbus: čtyři vrstvy nad sebou ----------
   #podklad  – atmosféra, moře, pevnina, území vybraného jazyka, hranice (2D, jen když se pohne pohled)
   #gl       – světélka jazyků (WebGL; když chybí, kreslí se 2D)
   #popisky  – jména jazyků
   #globus   – oblouky k příbuzným a zaměřovač vybraného místa; bere myš a prsty */
const scena = $("scena"), platno = $("globus"), podklad = $("podklad"), platnoGl = $("gl"), platnoPopisky = $("popisky");
let ctx = null, ctxPodklad = null, ctxPopisky = null, ctxBody = null;
const proj = globusOk ? d3.geoOrthographic().clipAngle(90).precision(0.9) : null;
const sit = globusOk ? d3.geoGraticule().step([20, 20])() : null;
let cestaPodklad = null;
const ZOOM_MAX = 8;
let stredY = 0, sirka = 0, vyska = 0, polomer = 0, polomerZaklad = 0, zoom = 1, dpr = 1;
let posun = 0, posunCil = 0;          // střed glóbu se odsune doprava, aby ho nezakrývala karta
let rot = [-14, -48];
let autoOtaceni = false, tahne = false, prechod = null;
let pulsDo = 0, potrebaKresli = true, teckyZmeneny = true, popiskyZmeneny = true;
let zvyraznenyBod = -1;
let vybrany = null;
const barvy = {};

function rgb(hex){
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}
function nactiBarvy(){
  const s = getComputedStyle(document.documentElement);
  ["vit-0", "vit-1", "vit-2", "vit-3", "vit-4", "vit-5", "vit-6", "vit-nic",
   "pevnina", "pobrezi", "stin-koule", "tecka-jazyk", "tecka-bod", "cyan", "fialova", "cervena", "hvezda", "koule1", "koule2", "popisek", "popisek-lem",
   "atmosfera", "atmosfera2", "sit", "hranice", "okraj-koule", "zamerovac-lem",
   "r-ie", "r-st", "r-an", "r-afro", "r-nk", "r-ost", "more1", "more2", "souse1", "souse2", "souse-vit", "uzemi",
   "podlaha", "podlaha-2", "obzor", "stin-plochy", "stin-plochy-2"].forEach(function(k){ barvy[k] = s.getPropertyValue("--" + k).trim(); });
}

const fJaz = new Float32Array(POCET_B), zakladJaz = new Float32Array(POCET_B);   // příznaky teček: 0 obyčejná, 1 vybraná, 2 příbuzná, 3 pod myší

/* ---------- WebGL ---------- */
let gl = null, glProg = null, glU = {}, glA = {}, glJaz = null;
/* příznak tečky: 0 obyčejná, 1 vybraná, 2 příbuzná, 3 pod myší, 4 schovaná filtrem, 5 v zvýrazněné zemi */
const VS = [
  "attribute vec2 a_pos; attribute float a_flag; attribute float a_vit;",
  "uniform float u_l0, u_sf0, u_cf0, u_r, u_dpr, u_jadro, u_barvit, u_cas;",
  "uniform vec2 u_stred, u_rozliseni;",
  "uniform vec4 u_b[6]; uniform float u_vel[6]; uniform float u_mek[6];",
  "uniform vec4 u_vit[8];",                    // barvy vitality: 0 = bez údaje, 1–6 = stupně UNESCO, 7 = probouzený
  "varying vec4 v_barva; varying float v_mek; varying float v_jadro;",
  "void main(){",
  "  v_jadro = u_jadro;",
  "  float dl = a_pos.x - u_l0, sl = sin(a_pos.y), cl = cos(a_pos.y), cdl = cos(dl);",
  "  float z = sl * u_sf0 + cl * u_cf0 * cdl;",
  "  vec2 p = u_stred + vec2(cl * sin(dl), -(u_cf0 * sl - u_sf0 * cl * cdl)) * u_r;",
  "  vec2 c = p / u_rozliseni * 2.0 - 1.0;",
  "  int f = int(a_flag + 0.5);",
  "  vec4 b = u_b[f];",
  "  if (f == 0 && u_barvit > 0.5) b = u_vit[int(a_vit + 1.5)];",
  "  v_mek = u_mek[f];",
  "  float trpyt = u_cas > 0.0 && f == 0 ? 0.72 + 0.28 * sin(u_cas * 1.7 + fract(sin(dot(a_pos, vec2(12.9898, 78.233))) * 43758.5453) * 6.2832) : 1.0;",
  "  v_barva = vec4(b.rgb, b.a * trpyt * (0.3 + 0.7 * z));",
  "  gl_PointSize = u_vel[f] * (0.6 + 0.4 * z) * u_dpr;",
  "  gl_Position = (z < 0.0 || f == 4) ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(c.x, -c.y, 0.0, 1.0);",
  "}"].join("\n");
const FS = [
  "precision mediump float;",
  "varying vec4 v_barva; varying float v_mek; varying float v_jadro;",
  "void main(){",
  "  vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q);",
  "  if (d > 1.0) discard;",
  "  float a = mix(1.0 - smoothstep(0.45, 1.0, d), exp(-d * 4.0), v_mek) * v_barva.a;",
  "  vec3 c = mix(v_barva.rgb, vec3(1.0), v_mek * smoothstep(0.14, 0.0, d) * v_jadro);",
  "  gl_FragColor = vec4(c * a, a);",
  "}"].join("\n");
function pripravGl(){
  try { gl = platnoGl.getContext("webgl", {alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false}); }
  catch (e) { gl = null; }
  if (!gl) return false;
  const shader = function(typ, zdroj){
    const s = gl.createShader(typ); gl.shaderSource(s, zdroj); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  try {
    glProg = gl.createProgram();
    gl.attachShader(glProg, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(glProg, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(glProg);
    if (!gl.getProgramParameter(glProg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(glProg));
  } catch (e) { console.error("WebGL shader:", e); gl = null; return false; }
  gl.useProgram(glProg);
  ["u_l0", "u_sf0", "u_cf0", "u_r", "u_dpr", "u_stred", "u_rozliseni", "u_b", "u_vel", "u_mek", "u_jadro", "u_barvit", "u_vit", "u_cas"]
    .forEach(function(k){ glU[k] = gl.getUniformLocation(glProg, k); });
  glA.pos = gl.getAttribLocation(glProg, "a_pos"); glA.flag = gl.getAttribLocation(glProg, "a_flag");
  glA.vit = gl.getAttribLocation(glProg, "a_vit");
  const vrstva = function(lon, lat, priznaky){
    const poz = new Float32Array(lon.length * 2);
    for (let i = 0; i < lon.length; i++) { poz[2 * i] = lon[i]; poz[2 * i + 1] = lat[i]; }
    const bPoz = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bPoz); gl.bufferData(gl.ARRAY_BUFFER, poz, gl.STATIC_DRAW);
    const bFlag = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bFlag); gl.bufferData(gl.ARRAY_BUFFER, priznaky, gl.DYNAMIC_DRAW);
    return {poz: bPoz, flag: bFlag, n: lon.length, data: priznaky};
  };
  const jLon = new Float32Array(POCET_B), jLat = new Float32Array(POCET_B);
  for (let i = 0; i < POCET_B; i++) { jLon[i] = bLon[i]; jLat[i] = B[i][2] * R; }
  glJaz = vrstva(jLon, jLat, fJaz);
  const vit = new Float32Array(POCET_B);
  for (let i = 0; i < POCET_B; i++) vit[i] = vitalitaBodu(i);
  glJaz.vit = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, glJaz.vit); gl.bufferData(gl.ARRAY_BUFFER, vit, gl.STATIC_DRAW);
  gl.enable(gl.BLEND);
  return true;
}
function nahrajPriznaky(v){ if (!gl) return; gl.bindBuffer(gl.ARRAY_BUFFER, v.flag); gl.bufferSubData(gl.ARRAY_BUFFER, 0, v.data); }
function barvaGl(u, hex, alfa){ const c = rgb(hex); gl.uniform4f(u, c[0], c[1], c[2], alfa); }

/* velikost světélek v CSS pixelech; s přiblížením mírně roste */
function velikosti(){
  return {jaz: Math.max(5, Math.min(13, 3.6 + polomer / 170))};
}
function barvaVyberu(){
  if (!vybrany) return barvy.cyan;
  return vybrany.typ === "atlas" ? barvy["r-" + vybrany.sk] : barvy.cervena;
}
/* barvy teček pro příznaky 0–5 a velikosti (násobky základní velikosti) */
function nastaveniTecek(){
  const vb = barvaVyberu();
  return {
    barvy: [[barvy["tecka-jazyk"], denni ? 0.9 : 0.8], [vb, 1], [barvy.fialova, 1], [barvy["tecka-bod"], 1], [vb, 0], [barvy.cyan, 1]],
    vel: barvitVitalitu ? (denni ? [1.05, 1.9, 1.6, 2, 0, 1.9] : [1.25, 2.6, 2.1, 2.8, 0, 1.9]) : denni ? [0.62, 1.9, 1.6, 2, 0, 1.9] : [1, 2.6, 2.1, 2.8, 0, 1.9],
    mek: denni ? [0.25, 0.55, 0.55, 0.4, 0, 0.45] : [1, 1, 1, 1, 0, 1]
  };
}
/* barvy vitality v pořadí pro shader: bez údaje, stupně 0–5, probouzený */
function barvyVitality(){ return ["vit-nic", "vit-0", "vit-1", "vit-2", "vit-3", "vit-4", "vit-5", "vit-6"].map(function(k){ return barvy[k]; }); }
function kresliBodyGl(){
  const v = velikosti(), l0 = -rot[0] * R, f0 = -rot[1] * R, n = nastaveniTecek();
  gl.viewport(0, 0, platnoGl.width, platnoGl.height);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(glProg);
  gl.uniform1f(glU.u_l0, l0); gl.uniform1f(glU.u_sf0, Math.sin(f0)); gl.uniform1f(glU.u_cf0, Math.cos(f0));
  gl.uniform1f(glU.u_r, polomer); gl.uniform1f(glU.u_dpr, platnoGl.width / sirka);
  gl.uniform2f(glU.u_stred, sirka / 2 + posun, stredY); gl.uniform2f(glU.u_rozliseni, sirka, vyska);
  const b = new Float32Array(24);
  n.barvy.forEach(function(x, k){ const c = rgb(x[0]); b.set([c[0], c[1], c[2], x[1]], k * 4); });
  gl.uniform4fv(glU.u_b, b);
  gl.uniform1fv(glU.u_vel, n.vel.map(function(k){ return k * v.jaz; }));
  gl.uniform1fv(glU.u_mek, n.mek);
  const vit = new Float32Array(32);
  barvyVitality().forEach(function(x, k){ const c = rgb(x); vit.set([c[0], c[1], c[2], 0.95], k * 4); });
  gl.uniform4fv(glU.u_vit, vit);
  gl.uniform1f(glU.u_barvit, barvitVitalitu ? 1 : 0);
  gl.uniform1f(glU.u_cas, !denni && !barvitVitalitu && !bezPohybu.matches ? (casSnimku / 1000) % 1000 + 0.001 : 0);
  gl.uniform1f(glU.u_jadro, denni ? 0.35 : (barvitVitalitu ? 0.4 : 0.85));
  /* světélka jazyků: v noci se sčítají, takže hustá místa září víc; ve dne (a při barvení podle vitality,
     kde musí barva zůstat pravdivá) se kreslí obyčejně */
  if (denni || barvitVitalitu) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); else gl.blendFunc(gl.ONE, gl.ONE);
  gl.bindBuffer(gl.ARRAY_BUFFER, glJaz.poz); gl.enableVertexAttribArray(glA.pos); gl.vertexAttribPointer(glA.pos, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, glJaz.flag); gl.enableVertexAttribArray(glA.flag); gl.vertexAttribPointer(glA.flag, 1, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, glJaz.vit); gl.enableVertexAttribArray(glA.vit); gl.vertexAttribPointer(glA.vit, 1, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, glJaz.n);
}

/* ---------- reliéf: modré moře se dnem a stínovaná pevnina (WebGL 2, obrázek z scripts/relief.py) ----------
   Šedý obrázek v rovnoběžkové projekci: 0–0,45 moře (tmavší = hlubší), 0,55–1 pevnina (tmavší = stín svahu).
   Barvy dodá CSS (--more-*, --souse-*), takže z jednoho obrázku je denní i noční glóbus.
   Kreslí se do vlastního plátna mimo stránku a to se vloží do #podklad místo ploché koule a pevniny. */
const RELIEF = /*__RELIEF__*/null;
/* krajina na pohlednici jazyka (data/krajiny.json, malují src/akvarely.js) */
const KRAJINY = /*__KRAJINY__*/null || {};
function malbaJazyka(id){ return KRAJINY[id] && typeof AKVARELY !== "undefined" ? AKVARELY.obraz(id, KRAJINY[id]) : ""; }
/* Malba je SVG s desítkami filtrů. Vložená přímo do stránky se při každém pohybu glóbu počítala znovu a animace
   trhala (uživatel 24. 9. 2026: „všechno je trhané, pomalé“). Proto se jednou vykreslí do bitmapy a ukazuje se
   jen obrázek; když by převod selhal, zůstane obrázek ze SVG. */
const MALBY = {};
function malbaObrazek(id){
  if (MALBY[id]) return MALBY[id];
  const svg = malbaJazyka(id);
  if (!svg) return null;
  const zdroj = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg width="800" height="500" '));
  return (MALBY[id] = new Promise(function(hotovo){
    const obr = new Image();
    obr.onload = function(){
      try {
        const c = document.createElement("canvas"); c.width = 800; c.height = 500;
        c.getContext("2d").drawImage(obr, 0, 0, 800, 500);
        hotovo(c.toDataURL("image/jpeg", .9));
      } catch (e) { hotovo(zdroj); }
    };
    obr.onerror = function(){ hotovo(null); };
    obr.src = zdroj;
  }));
}
/* Převod jedné malby blokuje stránku (desetiny sekundy), proto se nedělá během letu glóbu, vlny území a oblouků:
   počká se, až animace doběhne a prohlížeč má volno. Hotová malba se pak jen plynule objeví. */
function vlozMalbu(el, id){
  const img = document.createElement("img");
  img.alt = ""; img.decoding = "async"; img.setAttribute("aria-hidden", "true");
  el.replaceChildren(img);
  const ukaz = function(){ const cesta = malbaObrazek(id); if (cesta) cesta.then(function(url){ if (url && img.isConnected) { img.onload = function(){ img.classList.add("ukazana"); }; img.src = url; } }); };
  if (MALBY[id]) ukaz();
  else setTimeout(function(){ if (!img.isConnected) return; if (window.requestIdleCallback) requestIdleCallback(ukaz, {timeout: 1500}); else ukaz(); }, 2200);
}
function malbaNaKarte(id){
  const ma = !!(id && KRAJINY[id] && typeof AKVARELY !== "undefined"), el = $("k-malba");
  kartaHero.classList.toggle("s-malbou", ma);
  el.hidden = !ma;
  if (el.dataset.id !== (id || "")) { if (ma) vlozMalbu(el, id); else el.replaceChildren(); el.dataset.id = id || ""; }
}
const relief = {platno: null, gl: null, u: {}, hotovo: false, sirkaTex: 1};
function pripravRelief(){
  if (!RELIEF) return;
  const p = document.createElement("canvas");
  let g = null;
  try { g = p.getContext("webgl2", {alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true}); } catch (e) {}
  if (!g) return;
  const vs = "#version 300 es\nin vec2 a_p; void main(){ gl_Position = vec4(a_p, 0.0, 1.0); }";
  const fs = [
    "#version 300 es",
    "precision highp float;",
    "uniform sampler2D u_tex; uniform vec2 u_stred; uniform float u_r, u_l0, u_sf0, u_cf0, u_dpr, u_vyska, u_texw;",
    "uniform vec3 u_more1, u_more2, u_souse1, u_souse2;",
    "out vec4 barva;",
    "void main(){",
    "  vec2 px = vec2(gl_FragCoord.x, u_vyska - gl_FragCoord.y) / u_dpr;",
    "  vec2 d = (px - u_stred) / u_r; float rr = dot(d, d);",
    "  if (rr >= 1.0) { barva = vec4(0.0); return; }",
    "  float z = sqrt(1.0 - rr), X = d.x, Y = -d.y;",
    "  float lat = asin(clamp(z * u_sf0 + Y * u_cf0, -1.0, 1.0));",
    "  float lon = u_l0 + atan(X, z * u_cf0 - Y * u_sf0);",
    "  vec2 uv = vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927);",
    "  float lod = max(0.0, log2(u_texw / (6.2831853 * u_r * u_dpr) / max(z, 0.2)));",   // bez švu na 180. poledníku
    "  float v = textureLod(u_tex, uv, lod).r;",
    "  float souse = smoothstep(0.47, 0.53, v);",
    "  vec3 more = mix(u_more1, u_more2, clamp(v / 0.45, 0.0, 1.0));",
    "  vec3 zeme = mix(u_souse1, u_souse2, clamp((v - 0.55) / 0.45, 0.0, 1.0));",
    "  float a = clamp((1.0 - sqrt(rr)) * u_r * u_dpr, 0.0, 1.0);",           // hladký okraj koule
    "  barva = vec4(mix(more, zeme, souse) * a, a);",
    "}"].join("\n");
  const shader = function(typ, zdroj){
    const s = g.createShader(typ); g.shaderSource(s, zdroj); g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s));
    return s;
  };
  try {
    const prog = g.createProgram();
    g.attachShader(prog, shader(g.VERTEX_SHADER, vs)); g.attachShader(prog, shader(g.FRAGMENT_SHADER, fs));
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog));
    g.useProgram(prog);
    ["u_tex", "u_stred", "u_r", "u_l0", "u_sf0", "u_cf0", "u_dpr", "u_vyska", "u_texw", "u_more1", "u_more2", "u_souse1", "u_souse2"]
      .forEach(function(k){ relief.u[k] = g.getUniformLocation(prog, k); });
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(prog, "a_p"); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
  } catch (e) { console.error("Reliéf:", e); return; }
  relief.platno = p; relief.gl = g;
  const obr = new Image();
  obr.onload = function(){
    const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    g.pixelStorei(g.UNPACK_ALIGNMENT, 1);
    g.texImage2D(g.TEXTURE_2D, 0, g.R8, g.RED, g.UNSIGNED_BYTE, obr);
    g.generateMipmap(g.TEXTURE_2D);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    relief.sirkaTex = obr.naturalWidth; relief.hotovo = true;
    koule.klic = ""; potrebaKresli = true;
  };
  obr.src = RELIEF;
}
function kresliRelief(cx, cy, r){
  const g = relief.gl, p = relief.platno, u = relief.u;
  if (p.width !== podklad.width || p.height !== podklad.height) { p.width = podklad.width; p.height = podklad.height; }
  g.viewport(0, 0, p.width, p.height);
  g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
  const f0 = -rot[1] * R;
  g.uniform1i(u.u_tex, 0);
  g.uniform2f(u.u_stred, cx, cy); g.uniform1f(u.u_r, r);
  g.uniform1f(u.u_l0, -rot[0] * R); g.uniform1f(u.u_sf0, Math.sin(f0)); g.uniform1f(u.u_cf0, Math.cos(f0));
  g.uniform1f(u.u_dpr, p.width / sirka); g.uniform1f(u.u_vyska, p.height); g.uniform1f(u.u_texw, relief.sirkaTex);
  /* při barvení podle vitality je pevnina jednolitá (--souse-vit): na stínovaném reliéfu by světlé stupně na svazích zmizely */
  ["more1", "more2", "souse1", "souse2"].forEach(function(k){
    const c = rgb(barvitVitalitu && k.indexOf("souse") === 0 ? barvy["souse-vit"] : barvy[k]); g.uniform3f(u["u_" + k], c[0], c[1], c[2]); });
  g.drawArrays(g.TRIANGLES, 0, 3);
  return p;
}

/* ---------- záložní kreslení světélek bez WebGL ---------- */
function kresliBody2D(){
  const c = ctxBody, v = velikosti(), n = nastaveniTecek(), rj = v.jaz * 0.2;
  c.clearRect(0, 0, sirka, vyska);
  c.globalAlpha = 0.85;
  if (barvitVitalitu) {                   // obyčejné tečky po barvách vitality
    barvyVitality().forEach(function(barva, k){
      c.fillStyle = barva; c.beginPath();
      for (let i = 0; i < POCET_B; i++) if (bVid[i] && !fJaz[i] && vitalitaBodu(i) + 1 === k) c.rect(bPx[i] - rj, bPy[i] - rj, 2 * rj, 2 * rj);
      c.fill();
    });
  } else {
    c.fillStyle = n.barvy[0][0]; c.beginPath();
    for (let i = 0; i < POCET_B; i++) { if (bVid[i] && !fJaz[i]) c.rect(bPx[i] - rj, bPy[i] - rj, 2 * rj, 2 * rj); }
    c.fill();
  }
  c.globalAlpha = 1;
  [5, 2, 1, 3].forEach(function(f){
    const rr = rj * n.vel[f] * 1.1;
    c.fillStyle = n.barvy[f][0]; c.beginPath();
    for (let i = 0; i < POCET_B; i++) {
      if (!bVid[i] || fJaz[i] !== f) continue;
      c.moveTo(bPx[i] + rr, bPy[i]); c.arc(bPx[i], bPy[i], rr, 0, 6.283185);
    }
    c.fill();
  });
}

/* ---------- velikost a přiblížení ---------- */
const desktop = window.matchMedia("(min-width: 921px)");
function spoctiPosun(){
  const karta = $("karta");
  if (!desktop.matches || karta.hidden) { posunCil = 0; return; }
  const pravy = karta.offsetLeft + karta.offsetWidth + 10;
  posunCil = Math.max(0, Math.min(sirka * 0.2, pravy + polomerZaklad * 0.88 - sirka / 2));
}
function nastavPlatno(c, pomer){
  c.width = Math.round(sirka * pomer); c.height = Math.round(vyska * pomer);
}
function zmer(){
  const r = platno.getBoundingClientRect();
  sirka = Math.max(1, Math.round(r.width)); vyska = Math.max(1, Math.round(r.height));
  /* rasterizace 2D roste s plochou – u velkého plátna stačí nižší hustota pixelů */
  dpr = Math.min(window.devicePixelRatio || 1, sirka * vyska > 620000 ? 1.35 : 1.75);
  [platno, podklad, platnoPopisky].forEach(function(c){ nastavPlatno(c, dpr); });
  nastavPlatno(platnoGl, gl ? Math.min(window.devicePixelRatio || 1, 2) : dpr);
  [ctx, ctxPodklad, ctxPopisky, ctxBody].forEach(function(c){ if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0); });
  /* na počítači leží lišta přes spodek plátna: glóbus se vejde nad ni (dřív ho lišta zakrývala) */
  const dok = desktop.matches ? $("dok").offsetHeight + 30 : 26;   // na telefonu místo pro řádek „vidíš … jazyků“
  /* pod koulí je místo na stín (sahá do 1,26 r pod střed), proto je koule o kus menší a výš */
  polomerZaklad = Math.max(40, Math.min(sirka / 2 - 18, (vyska - dok - 30) / 2.26));
  stredY = (vyska - dok - polomerZaklad * 0.26) / 2 + 6;
  spoctiPosun(); posun = posunCil;
  uplatniZoom();
}
let zobrazenyZoom = "";
let uvod = null, uvodK = 1, casSnimku = 0;
const trpyt = {naposled: 0};
function uplatniZoom(){
  polomer = polomerZaklad * zoom * uvodK;
  proj.scale(polomer).translate([sirka / 2 + posun, stredY]);
  potrebaKresli = true;
  const txt = cislo(Math.max(1, zoom), 1) + "×";
  if (txt !== zobrazenyZoom) {
    zobrazenyZoom = txt;
    $("zoom-hod").textContent = txt;
    $("tl-oddal").disabled = zoom <= 1.001;
    $("tl-priblizi").disabled = zoom >= ZOOM_MAX - 0.001;
  }
}
function nastavZoom(z){
  const novy = Math.max(1, Math.min(ZOOM_MAX, z));
  if (Math.abs(novy - zoom) < 0.0005) return;
  prechod = null; zoom = novy; uplatniZoom();
}
function plynulyZoom(z){
  const cil = Math.max(1, Math.min(ZOOM_MAX, z));
  if (bezPohybu.matches) { zoom = cil; uplatniZoom(); return; }
  prechod = {z: rot.slice(), k: rot.slice(), z2: zoom, k2: cil, zac: performance.now(), delka: 380};
}
/* jak blízko přiblížit, aby byl vidět celý jazyk */
function zoomProJazyk(j){
  const s = j.stred;
  let max = 0;
  j.ob.forEach(function(o){ max = Math.max(max, d3.geoDistance(s, [o[0], o[1]]) + o[2] * 1.3 * R); });
  j.zeme.forEach(function(nazev){
    const f = ZEME_PODLE_JMENA[nazev], g = f && f.geometry;
    if (!g) return;
    const kruhy = g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? [].concat.apply([], g.coordinates) : [];
    kruhy.forEach(function(r){ for (let i = 0; i < r.length; i += 2) { const d = d3.geoDistance(s, r[i]); if (d > max) max = d; } });
  });
  if (!max) return 3.2;
  return Math.max(1, Math.min(3.2, 0.8 / Math.max(Math.sin(Math.min(max, 1.45)), 0.02)));
}

/* ---------- podklad: atmosféra, moře, pevnina, území vybraného jazyka, hranice ---------- */
/* koule s atmosférou a stín koule se při otáčení nemění – kreslí se jednou do zásoby a pak se jen kopírují */
const koule = {platno: null, stin: null, klic: "", kandidat: ""};
const kruh = globusOk ? d3.geoCircle() : null;
function kresliStin(c, cx, cy, r){          /* koule k okraji tmavne, ať vypadá kulatě */
  let g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.15, cx, cy, r);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, barvy["stin-koule"]);
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.283185); c.fill();
  /* odlesk světla vlevo nahoře: ve dne slunce, v noci jen slabý nádech */
  g = c.createRadialGradient(cx - r * 0.42, cy - r * 0.46, 0, cx - r * 0.42, cy - r * 0.46, r * 0.62);
  g.addColorStop(0, denni ? "rgba(255,255,255,.55)" : "rgba(150,210,255,.10)"); g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.283185); c.fill();
}
function kresliUzemi(c){                    /* území vybraného jazyka jednou oranžovou (--uzemi): barva rodiny by na modrém moři splývala */
  if (zeme) {                               /* kliknutá země: podbarvená a obtažená, dokud je otevřené její okno */
    c.beginPath(); cestaPodklad(zeme.f);
    c.globalAlpha = 0.3; c.fillStyle = barvy.uzemi || barvy.cyan; c.fill(); c.globalAlpha = 0.95;
    c.lineWidth = 2; c.strokeStyle = barvy.uzemi || barvy.cyan; c.stroke(); c.globalAlpha = 1;
  }
  if (!vybrany || vybrany.typ !== "atlas") return;
  const barva = barvy.uzemi || barvaVyberu(), p = odhaleni(casSnimku);
  if (!p) return;                           // ještě se letí
  c.save();
  if (p < 1) {                              /* území se rozlévá od domovské tečky jako vlna */
    const h = BOD_ATLASU[vybrany.id], stred = h >= 0 ? [B[h][1], B[h][2]] : vybrany.stred;
    c.beginPath(); cestaPodklad(kruh.center(stred).radius(3 + 110 * (1 - Math.pow(1 - p, 3)))()); c.clip();
  }
  if (vybrany.zeme.length) {
    c.beginPath();
    vybrany.zeme.forEach(function(n){ const f = ZEME_PODLE_JMENA[n]; if (f) cestaPodklad(f); });
    c.globalAlpha = 0.9; c.fillStyle = barva; c.fill(); c.globalAlpha = 1;
  }
  if (vybrany.ob.length) {                  /* areál: kruhy oříznuté na pevninu, s měkkým okrajem */
    c.save();
    c.beginPath(); cestaPodklad(SOUS); c.clip();
    c.fillStyle = barva;
    c.globalAlpha = 0.35; c.beginPath();
    vybrany.ob.forEach(function(o){ cestaPodklad(kruh.center([o[0], o[1]]).radius(o[2] * 1.75)()); });
    c.fill();
    c.globalAlpha = 0.9; c.beginPath();
    vybrany.ob.forEach(function(o){ cestaPodklad(kruh.center([o[0], o[1]]).radius(o[2] * 1.3)()); });
    c.fill();
    c.restore();
  }
  c.restore();
}
/* glóbus se vznáší nad hladkou plochou a vrhá na ni měkký stín (přání uživatele 25. 9. 2026: „stín, bez mřížky“).
   Kreslí se do zásoby spolu s koulí; při přiblížení plocha i stín zmizí (koule pak vyplní scénu). */
function kresliPlochu(c, cx, cy, r){
  const a = Math.max(0, Math.min(1, (1.5 - r / Math.max(1, polomerZaklad)) / 0.5));
  if (!a) return;
  c.save(); c.globalAlpha = a;
  const hy = cy + r * 0.55;                                      // odkud plocha začíná (linku obzoru uživatel nechtěl)
  let g;
  if (desktop.matches) {                  // na telefonu je plátno úzké a plocha by vypadala jako šedý obdélník: jen stín
  g = c.createLinearGradient(0, hy, 0, vyska);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.3, barvy.podlaha); g.addColorStop(0.75, barvy["podlaha-2"]); g.addColorStop(1, "rgba(0,0,0,0)");   // k okraji plátna vybledne (na telefonu nekončí hranou)
  c.fillStyle = g; c.fillRect(0, hy, sirka, vyska - hy);
  }
  const sy = cy + r * 1.14, sw = r * 0.95;                       // měkký stín: kruhový přechod zploštělý do elipsy
  c.translate(cx, sy); c.scale(1, 0.12);
  g = c.createRadialGradient(0, 0, 0, 0, 0, sw);
  g.addColorStop(0, barvy["stin-plochy"]); g.addColorStop(0.55, barvy["stin-plochy-2"]); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, sw, 0, 6.283185); c.fill();
  c.restore();
}
function kresliKouli(c, cx, cy, r){
  kresliPlochu(c, cx, cy, r);
  let g = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.36);
  g.addColorStop(0, barvy.atmosfera); g.addColorStop(0.35, barvy.atmosfera2); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.36, 0, 6.283185); c.fill();
  g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, barvy.koule1); g.addColorStop(1, barvy.koule2);
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.283185); c.fill();
  c.beginPath(); c.arc(cx, cy, r, 0, 6.283185); c.strokeStyle = barvy["okraj-koule"]; c.lineWidth = 1.2; c.stroke();
}
function kresliPodklad(){
  const c = ctxPodklad, cx = sirka / 2 + posun, cy = stredY, r = polomer;
  const klic = [podklad.width, podklad.height, cx.toFixed(1), r.toFixed(1)].join();
  if (koule.klic !== klic && koule.kandidat === klic) {       // při plynulém přibližování se zásoba nevyplatí
    if (!koule.platno) koule.platno = document.createElement("canvas");
    koule.platno.width = podklad.width; koule.platno.height = podklad.height;
    const k = koule.platno.getContext("2d"); k.setTransform(dpr, 0, 0, dpr, 0, 0);
    kresliKouli(k, cx, cy, r);
    if (!koule.stin) koule.stin = document.createElement("canvas");
    koule.stin.width = podklad.width; koule.stin.height = podklad.height;
    const st = koule.stin.getContext("2d"); st.setTransform(dpr, 0, 0, dpr, 0, 0);
    kresliStin(st, cx, cy, r); koule.klic = klic;
  }
  koule.kandidat = klic;
  c.clearRect(0, 0, sirka, vyska);
  if (koule.klic === klic) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(koule.platno, 0, 0); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  } else kresliKouli(c, cx, cy, r);
  c.lineWidth = 1;
  if (relief.hotovo) {                 /* reliéf nahradí plochou kouli i pevninu */
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(kresliRelief(cx, cy, r), 0, 0); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.beginPath(); cestaPodklad(sit); c.strokeStyle = barvy.sit; c.stroke();
  } else {
    c.beginPath(); cestaPodklad(sit); c.strokeStyle = barvy.sit; c.stroke();
    c.beginPath(); cestaPodklad(SOUS); c.fillStyle = barvy.pevnina; c.fill();
  }
  kresliUzemi(c);
  if (zoom >= 1.4) {                   /* hranice států až při přiblížení – z dálky by jen rušily */
    c.beginPath(); ZEME.forEach(function(f){ cestaPodklad(f); });
    c.strokeStyle = "rgba(" + barvy.hranice + "," + Math.min(0.4, (zoom - 1.4) * 0.14).toFixed(3) + ")"; c.lineWidth = 0.8; c.stroke();
  }
  if (!relief.hotovo) { c.beginPath(); cestaPodklad(SOUS); c.strokeStyle = barvy.pobrezi; c.lineWidth = 0.9; c.stroke(); }
  if (koule.klic === klic) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(koule.stin, 0, 0); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  } else kresliStin(c, cx, cy, r);
}

/* ---------- jména jazyků malým písmem, bez překrývání ---------- */
const POPISKY_OD = 2, POPISKU_MAX = 450, BUNKA = 4;
let popiskyZapnute = true;
function nastavPopisky(zapnout){
  popiskyZapnute = !!zapnout;
  $("tl-jmena").setAttribute("aria-pressed", popiskyZapnute ? "true" : "false");
  try { localStorage.setItem("atlas-popisky", popiskyZapnute ? "1" : "0"); } catch (e) {}
  popiskyZmeneny = true;
}
$("tl-jmena").addEventListener("click", function(){ nastavPopisky(!popiskyZapnute); });
const poradiPopisku = new Int32Array(POCET_B);   // napřed jazyky z atlasu, pak ostatní
(function(){ let k = 0;
  for (let i = 0; i < POCET_B; i++) if (B[i][5]) poradiPopisku[k++] = i;
  for (let i = 0; i < POCET_B; i++) if (!B[i][5]) poradiPopisku[k++] = i; })();
const sirka10 = new Float32Array(POCET_B);          // šířka popisku při písmu 10 px
const PISMO = "px Outfit, system-ui, sans-serif";
function zmerPopisky(){
  if (!ctxPopisky) return;
  ctxPopisky.save(); ctxPopisky.font = "600 10" + PISMO;
  for (let i = 0; i < POCET_B; i++) sirka10[i] = ctxPopisky.measureText(jmenoBodu(i)).width;
  ctxPopisky.restore(); popiskyZmeneny = true;
}
let obsazeno = new Uint8Array(0);
const umisteno = [];
let dulezite = [];                                   // vybraný jazyk a příbuzní: popisek mají i bez přiblížení
function kresliPopisky(){
  const c = ctxPopisky;
  c.clearRect(0, 0, sirka, vyska);
  if (!popiskyZapnute || eu) return;       // v režimu EU mají jména jen jazyky se zlatou hvězdičkou
  const vsechny = zoom >= POPISKY_OD;
  if (!vsechny && !dulezite.length) return;
  const vel = Math.min(11.5, 9.5 + Math.max(0, zoom - POPISKY_OD) * 0.4);
  const k = vel / 10, vys = vel + 3, rb = velikosti().jaz * 0.25;
  const cw = Math.ceil(sirka / BUNKA) + 1, ch = Math.ceil(vyska / BUNKA) + 1;
  if (obsazeno.length < cw * ch) obsazeno = new Uint8Array(cw * ch); else obsazeno.fill(0, 0, cw * ch);
  umisteno.length = 0;
  const zkus = function(i, vetsi){
    if (!bVid[i] || (eu && EU_BOD[i])) return;       // jazyky EU mají jméno u zlaté hvězdičky
    const kk = vetsi ? k * 1.18 : k, w = sirka10[i] * kk, x = bPx[i] + (vetsi ? 23 : rb + 4), y = bPy[i];
    if (x < 2 || y < vys || y > vyska - vys || x + w > sirka - 2) return;
    const x0 = Math.max(0, ((bPx[i] - rb - 2) / BUNKA) | 0), x1 = ((x + w + 3) / BUNKA) | 0;
    const y0 = ((y - vys / 2) / BUNKA) | 0, y1 = ((y + vys / 2) / BUNKA) | 0;
    for (let yy = y0; yy <= y1; yy++) { const r = yy * cw; for (let xx = x0; xx <= x1; xx++) if (obsazeno[r + xx]) return; }
    for (let yy = y0; yy <= y1; yy++) { const r = yy * cw; for (let xx = x0; xx <= x1; xx++) obsazeno[r + xx] = 1; }
    umisteno.push(i, x, y, vetsi ? 1 : 0);
  };
  dulezite.forEach(function(i, n){ zkus(i, (n === 0 && zakladJaz[i] === 1) || (srovnani && srovnani.b.i === i)); });   // u kroužku druhého jazyka odsazené
  if (vsechny) for (let q = 0; q < POCET_B && umisteno.length < POPISKU_MAX * 4; q++) zkus(poradiPopisku[q], false);
  c.textBaseline = "middle"; c.lineJoin = "round"; c.lineWidth = 3; c.strokeStyle = barvy["popisek-lem"]; c.fillStyle = barvy.popisek;
  [0, 1].forEach(function(velky){
    c.font = (velky ? "700 " + (vel * 1.18).toFixed(1) : "600 " + vel.toFixed(1)) + PISMO;
    for (let n = 0; n < umisteno.length; n += 4) if (umisteno[n + 3] === velky) c.strokeText(jmenoBodu(umisteno[n]), umisteno[n + 1], umisteno[n + 2]);
    for (let n = 0; n < umisteno.length; n += 4) if (umisteno[n + 3] === velky) c.fillText(jmenoBodu(umisteno[n]), umisteno[n + 1], umisteno[n + 2]);
  });
}

let videtJazyku = 0;
function spocitejBody(){
  const l0 = -rot[0] * R, f0 = -rot[1] * R, sf0 = Math.sin(f0), cf0 = Math.cos(f0);
  const cx = sirka / 2 + posun, cy = stredY;
  let n = 0;
  for (let i = 0; i < POCET_B; i++) {
    if (skryty[i] || BEZ_POLOHY[i]) { bVid[i] = 0; continue; }
    const dl = bLon[i] - l0, cdl = Math.cos(dl);
    if (bSinLat[i] * sf0 + bCosLat[i] * cf0 * cdl <= 0.002) { bVid[i] = 0; continue; }
    const x = cx + polomer * (bCosLat[i] * Math.sin(dl)), y = cy - polomer * (cf0 * bSinLat[i] - sf0 * bCosLat[i] * cdl);
    bPx[i] = x; bPy[i] = y;
    bVid[i] = 1;
    if (x > -4 && x < sirka + 4 && y > -4 && y < vyska + 4) n++;
  }
  videtJazyku = n;
}

/* ---------- HUD: souřadnice středu pohledu a počet světélek na očích ---------- */
function souradnice(lon, lat){
  lon = ((lon % 360) + 540) % 360 - 180;
  return cislo(Math.abs(lat), 1) + "°\u00a0" + T.strany[lat >= 0 ? 0 : 1] + " · " + cislo(Math.abs(lon), 1) + "°\u00a0" + T.strany[lon >= 0 ? 2 : 3];
}
const hudSouradnice = $("hud-souradnice"), hudStav = $("hud-stav");
let hudTxt = "", hudTxt2 = "";
function obnovHud(){
  const a = souradnice(-rot[0], -rot[1]), b = t("hudVidet", {n: cislo(videtJazyku), m: cislo(povolenych)});
  if (a !== hudTxt) { hudTxt = a; hudSouradnice.textContent = a; }
  if (b !== hudTxt2) { hudTxt2 = b; hudStav.textContent = b; }
}

/* ---------- oblouky k příbuzným ---------- */
let oblouky = [];                  // každý: body jako jednotkové vektory + výška nad povrchem
function vektor(lon, lat){ const f = lat * R, l = lon * R; return [Math.cos(f) * Math.cos(l), Math.cos(f) * Math.sin(l), Math.sin(f)]; }
function oblouk(a, b){
  const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(d), so = Math.sin(om);
  if (om < 0.004 || om > 3.1) return null;
  const kroku = Math.max(12, Math.min(64, Math.round(om * 40))), zdvih = Math.min(0.34, 0.22 * om), body = [];
  for (let k = 0; k <= kroku; k++) {
    const t2 = k / kroku, s1 = Math.sin((1 - t2) * om) / so, s2 = Math.sin(t2 * om) / so;
    body.push([a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2, 1 + zdvih * Math.sin(Math.PI * t2)]);
  }
  return body;
}
function nastavOblouky(odkud, kam){
  const a = vektor(odkud[0], odkud[1]);
  oblouky = kam.map(function(i){ return oblouk(a, vektor(B[i][1], B[i][2])); }).filter(Boolean);
}
/* příbuzní podle stromu Glottologu: čím hlubší společný předek, tím bližší */
function pribuzniBodu(i, jenAtlas, max){
  const u0 = radek(i)[2];
  if (!(u0 >= 0) || BEZ_RODU.has(B[i][3])) return [];   // umělé jazyky apod. spolu příbuzné nejsou
  const hloubka = new Map(), retez = [];
  for (let u = u0; u >= 0; u = PD.nad[u]) retez.push(u);
  retez.forEach(function(u, k){ hloubka.set(u, retez.length - k); });
  const kand = [], fam = B[i][3];
  for (let k = 0; k < POCET_B; k++) {
    if (k === i || B[k][3] !== fam || skryty[k]) continue;
    if (jenAtlas && (!B[k][5] || B[k][5] === B[i][5] || !PODLE_ID[B[k][5]])) continue;
    let u = radek(k)[2];
    while (u >= 0 && !hloubka.has(u)) u = PD.nad[u];
    if (u < 0) continue;
    kand.push([k, hloubka.get(u), -(bCosLat[i] * bCosLat[k] * Math.cos(bLon[i] - bLon[k]) + bSinLat[i] * bSinLat[k])]);
  }
  kand.sort(function(a, b){ return b[1] - a[1] || a[2] - b[2]; });
  return kand.slice(0, max).map(function(x){ return x[0]; });
}

/* ---------- popředí: oblouky a zaměřovač ---------- */
function svetylko(barva, vel){
  const c = document.createElement("canvas"); c.width = c.height = vel;
  const g = c.getContext("2d"), r = vel / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.2, barva); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, vel, vel); return c;
}
let SVETLA = null;
function kresliPopredi(cas){
  const c = ctx, cx = sirka / 2 + posun, cy = stredY;
  c.clearRect(0, 0, sirka, vyska);
  if (!SVETLA) SVETLA = {bila: svetylko(denni ? "rgba(10,119,173,.55)" : "rgba(255,255,255,.9)", 32)};
  const skladani = denni ? "source-over" : "lighter";

  const l0 = -rot[0] * R, f0 = -rot[1] * R, sf0 = Math.sin(f0), cf0 = Math.cos(f0), cl0 = Math.cos(l0), sl0 = Math.sin(l0);
  const vb = barvaVyberu();
  const promitni = function(v, vysl){
    const e = v[0] * cl0 + v[1] * sl0, x = v[1] * cl0 - v[0] * sl0, y = cf0 * v[2] - sf0 * e, z = sf0 * v[2] + cf0 * e;
    vysl[0] = cx + x * polomer * v[3]; vysl[1] = cy - y * polomer * v[3];
    return z > 0 || (x * x + y * y) * v[3] * v[3] > 1;     // nad povrchem je vidět i kousek za okrajem
  };
  const p = [0, 0], q = [0, 0];
  const od = odhaleniOd < 0 ? -1 : odhaleniOd;
  oblouky.forEach(function(body, k){
    const podil = od < 0 ? 0 : bezPohybu.matches || !od ? 1 : Math.max(0, Math.min(1, (cas - od - 250 - k * 150) / 480));
    if (!podil) return;
    const konec = Math.max(1, Math.round(podil * (body.length - 1)));
    promitni(body[0], p); promitni(body[konec], q);
    const gr = c.createLinearGradient(p[0], p[1], q[0], q[1]);
    gr.addColorStop(0, vb); gr.addColorStop(1, barvy.fialova);
    [[6, 0.16], [1.6, 0.95]].forEach(function(s){
      c.beginPath();
      let kresli = false;
      for (let n = 0; n <= konec; n++) {
        const vid = promitni(body[n], p);
        if (vid) { if (kresli) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
        kresli = vid;
      }
      c.globalAlpha = s[1]; c.lineWidth = s[0]; c.strokeStyle = gr; c.lineCap = "round"; c.stroke();
    });
    c.globalAlpha = 1;
    if (podil < 1) {                  // hlava letícího oblouku
      if (promitni(body[konec], p)) { c.globalCompositeOperation = skladani; c.drawImage(SVETLA.bila, p[0] - 12, p[1] - 12, 24, 24); c.globalCompositeOperation = "source-over"; }
    } else if (!bezPohybu.matches) {
      const f = ((cas * 0.00042) + k * 0.19) % 1, b = body[Math.floor(f * (body.length - 1))];
      if (promitni(b, p)) { c.globalCompositeOperation = skladani; c.drawImage(SVETLA.bila, p[0] - 10, p[1] - 10, 20, 20); c.globalCompositeOperation = "source-over"; }
    }
  });

  if (eu) {                             /* zlaté hvězdičky jazyků EU, vyskakují jedna po druhé */
    const obsazene = [];
    c.font = "700 11.5" + PISMO; c.textBaseline = "middle"; c.lineJoin = "round";
    EU.forEach(function(x, k){
      x.sx = -1;
      const v = x.v;
      if (sf0 * v[2] + cf0 * (v[0] * cl0 + v[1] * sl0) <= 0.03) return;
      const vstup = eu.od < 0 ? 0 : bezPohybu.matches || !eu.od ? 1 : Math.max(0, Math.min(1, (cas - eu.od - k * 55) / 420));
      if (!vstup) return;
      promitni(v, p);
      x.sx = p[0]; x.sy = p[1];
      const e = 1 + 2.7 * Math.pow(vstup - 1, 3) + 1.7 * Math.pow(vstup - 1, 2);     // mírné přeskočení
      const r = 8 * e;
      c.beginPath();
      for (let n = 0; n < 10; n++) {
        const rr = n % 2 ? r * 0.42 : r, a = -Math.PI / 2 + n * Math.PI / 5 + (1 - vstup) * 2.4;
        if (n) c.lineTo(p[0] + rr * Math.cos(a), p[1] + rr * Math.sin(a)); else c.moveTo(p[0] + rr * Math.cos(a), p[1] + rr * Math.sin(a));
      }
      c.closePath();
      if (eu.druh === "evropa") { c.fillStyle = barvy.cervena; c.fill(); c.lineWidth = 1.6; c.strokeStyle = barvy["popisek-lem"]; c.stroke(); }   // barvy vlajky EU patří jen EU
      else { c.fillStyle = "#FFCC00"; c.fill(); c.lineWidth = 1.6; c.strokeStyle = "#003399"; c.stroke(); }
      if (vstup < 1) return;
      const jm = PODLE_ID[x.id].n, w = c.measureText(jm).width;
      const moznosti = [[p[0] + 12, p[1]], [p[0] - 12 - w, p[1]], [p[0] - w / 2, p[1] - 16], [p[0] - w / 2, p[1] + 16]];
      for (let m2 = 0; m2 < moznosti.length; m2++) {
        const tx0 = moznosti[m2][0], ty = moznosti[m2][1], box = [tx0 - 3, ty - 8, tx0 + w + 3, ty + 8];
        if (obsazene.some(function(o){ return box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1]; })) continue;
        obsazene.push(box);
        c.lineWidth = 3.2; c.strokeStyle = barvy["popisek-lem"]; c.strokeText(jm, tx0, ty);
        c.fillStyle = barvy.popisek; c.fillText(jm, tx0, ty);
        break;
      }
    });
  }
  if (srovnani && !(srovnani.b.i >= 0 && BEZ_POLOHY[srovnani.b.i])) {   /* druhý jazyk srovnání: kroužek v jeho barvě */
    const v = vektor(srovnani.b.lon, srovnani.b.lat); v.push(1);
    if (sf0 * v[2] + cf0 * (v[0] * cl0 + v[1] * sl0) > 0.02) {
      promitni(v, p);
      c.beginPath(); c.arc(p[0], p[1], 10, 0, 6.283185);
      c.lineWidth = 4; c.strokeStyle = barvy["zamerovac-lem"]; c.stroke();
      c.lineWidth = 2; c.strokeStyle = srovnani.b.sk && srovnani.b.sk !== srovnani.a.sk ? barvy["r-" + srovnani.b.sk] : barvy.fialova; c.stroke();
    }
  }
  if (vybrany && !vybrany.bezPolohy) {  /* zaměřovač na vybraném místě */
    const hlavni = vybrany.typ === "atlas" ? BOD_ATLASU[vybrany.id] : vybrany.i;    // zaměřovač na domovské tečce jazyka
    const v = hlavni >= 0 ? vektor(B[hlavni][1], B[hlavni][2]) : vektor(vybrany.stred[0], vybrany.stred[1]); v.push(1);
    const e = v[0] * cl0 + v[1] * sl0;
    if (sf0 * v[2] + cf0 * e > 0.02) {
      promitni(v, p);
      const x = p[0], y = p[1];
      const faze = pulsDo > cas && !bezPohybu.matches ? ((cas % 1400) / 1400) : 0;
      if (faze) {
        c.beginPath(); c.arc(x, y, 10 + faze * 26, 0, 6.283185);
        c.strokeStyle = vb; c.globalAlpha = 1 - faze; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
      }
      c.globalCompositeOperation = skladani; c.drawImage(SVETLA.bila, x - 12, y - 12, 24, 24); c.globalCompositeOperation = "source-over";
      c.beginPath(); c.arc(x, y, 10, 0, 6.283185);
      c.lineWidth = 4; c.strokeStyle = barvy["zamerovac-lem"]; c.stroke();
      c.lineWidth = 2; c.strokeStyle = vb; c.stroke();
      c.beginPath();
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function(d){ c.moveTo(x + d[0] * 13, y + d[1] * 13); c.lineTo(x + d[0] * 19, y + d[1] * 19); });
      c.lineWidth = 1.6; c.stroke();
    }
  }
}
/* okrasný pohyb (světla na obloucích, obvod karty) po chvíli bez dotyku usne – šetří baterii */
let zivoDo = 0, spi = false;
function ozivit(){ zivoDo = performance.now() + 20000; }
function animujePopredi(cas){
  if (bezPohybu.matches) return false;
  return pulsDo > cas || (cas < zivoDo && oblouky.length > 0) || (odhaleniOd > 0 && cas - odhaleniOd < 1400) ||
    (eu && (eu.od < 0 || (eu.od > 0 && cas - eu.od < EU.length * 55 + 700)));
}

/* ---------- hvězdné nebe za stránkou (kreslí se jen při změně velikosti) ---------- */
function kresliHvezdy(){
  const hv = $("hvezdy"), w = window.innerWidth, h = window.innerHeight, d = Math.min(window.devicePixelRatio || 1, 2);
  hv.width = Math.round(w * d); hv.height = Math.round(h * d);
  const g = hv.getContext("2d"); if (!g) return;
  g.setTransform(d, 0, 0, d, 0, 0);
  if (denni) return;                   // ve dne hvězdy nesvítí
  let semeno = 11;
  const nahoda = function(){ semeno = (semeno * 16807) % 2147483647; return semeno / 2147483647; };
  const pocet = Math.min(900, Math.round(w * h / 2400));
  for (let i = 0; i < pocet; i++) {
    const x = nahoda() * w, y = nahoda() * h, velka = nahoda() > 0.94;
    g.globalAlpha = 0.18 + nahoda() * 0.62;
    g.fillStyle = nahoda() > 0.82 ? "#B9E8FF" : nahoda() > 0.9 ? "#E4D2FF" : "#FFFFFF";
    g.beginPath(); g.arc(x, y, velka ? 1.25 : 0.65, 0, 6.283185); g.fill();
    if (velka) { g.globalAlpha *= 0.25; g.beginPath(); g.arc(x, y, 3.2, 0, 6.283185); g.fill(); }
  }
}
kresliHvezdy();
window.addEventListener("resize", kresliHvezdy);

/* ---------- příznaky teček podle výběru ---------- */
let bodyVybranehoJazyka = [];
function obnovPriznaky(){
  zakladJaz.fill(0);
  dulezite = []; oblouky = [];
  bodyVybranehoJazyka = [];
  if (vybrany && vybrany.typ === "atlas") {
    for (let i = 0; i < POCET_B; i++) if (B[i][5] === vybrany.id) { zakladJaz[i] = 1; bodyVybranehoJazyka.push(i); }
    const hlavni = BOD_ATLASU[vybrany.id], pribuzni = vybrany.pribuzni;
    pribuzni.forEach(function(k){ zakladJaz[k] = 2; });
    if (hlavni >= 0) { dulezite = [hlavni].concat(pribuzni); nastavOblouky([B[hlavni][1], B[hlavni][2]], pribuzni); }
  } else if (vybrany && vybrany.typ === "rejstrik") {
    zakladJaz[vybrany.i] = 1;
    const pribuzni = vybrany.pribuzni;
    pribuzni.forEach(function(k){ zakladJaz[k] = 2; });
    dulezite = [vybrany.i].concat(pribuzni);
    nastavOblouky([B[vybrany.i][1], B[vybrany.i][2]], pribuzni);
  }
  if (srovnani) {                          /* srovnání: jen poloha obou jazyků, žádná čára mezi nimi (přání uživatele) */
    if (vybrany && vybrany.pribuzni) vybrany.pribuzni.forEach(function(k){ if (zakladJaz[k] === 2) zakladJaz[k] = 0; });
    const b = srovnani.b;
    if (b.i >= 0 && !zakladJaz[b.i]) zakladJaz[b.i] = 2;
    oblouky = [];
    dulezite = [srovnani.a.i, b.i].filter(function(i){ return i >= 0; });
  }
  if (zeme) zeme.body.forEach(function(i){ if (!zakladJaz[i]) zakladJaz[i] = 5; });
  if (eu) EU.forEach(function(x){ if (x.i >= 0 && !zakladJaz[x.i]) zakladJaz[x.i] = 5; });
  for (let i = 0; i < POCET_B; i++) if (skryty[i] || BEZ_POLOHY[i]) zakladJaz[i] = 4;
  fJaz.set(zakladJaz);
  if (zvyraznenyBod >= 0) fJaz[zvyraznenyBod] = 3;
  if (gl) nahrajPriznaky(glJaz);
  teckyZmeneny = true; popiskyZmeneny = true; potrebaKresli = true;
}
function nastavZvyrazneni(i){
  if (i === zvyraznenyBod) return;
  if (zvyraznenyBod >= 0) fJaz[zvyraznenyBod] = zakladJaz[zvyraznenyBod];
  zvyraznenyBod = i;
  if (i >= 0) fJaz[i] = 3;
  if (gl) nahrajPriznaky(glJaz);
  teckyZmeneny = true;
}

function kresliVse(cas, pohled){
  if (pohled) {
    proj.rotate(rot).translate([sirka / 2 + posun, stredY]).scale(polomer);
    spocitejBody(); kresliPodklad(); obnovHud(); polohaUkazatele();
    teckyZmeneny = true; popiskyZmeneny = true;
  }
  if (teckyZmeneny) { if (gl) kresliBodyGl(); else kresliBody2D(); teckyZmeneny = false; }
  if (popiskyZmeneny) { kresliPopisky(); popiskyZmeneny = false; }
}

/* ---------- pohyb ---------- */
function dlouheDo(a, b){ let d = (b - a) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return a + d; }
function letKe(stred, cilZoom){
  const cil = [dlouheDo(rot[0], -stred[0]), Math.max(-80, Math.min(80, -stred[1]))];
  const zc = cilZoom == null ? zoom : Math.max(1, Math.min(ZOOM_MAX, cilZoom));
  if (bezPohybu.matches) { rot = cil; zoom = zc; uplatniZoom(); pulsDo = performance.now() + 2600; odhaleniOd = 0; return; }
  /* daleký let: kamera se cestou oddálí a zase přiblíží, jako letadlo */
  const vzd = d3.geoDistance([-rot[0], -rot[1]], stred);
  const skok = vzd > 0.35 ? Math.min(0.75, 0.32 * vzd) : 0;
  prechod = {z: rot.slice(), k: cil, z2: zoom, k2: zc, zac: performance.now(), delka: 1000 + 650 * Math.min(1, vzd / 2.2), skok: skok};
}
/* dok a panel „Zobrazení“ jezdí se středem glóbu (když karta odsune glóbus doprava) */
let dokX = -1;
function posunDok(){
  if (!desktop.matches) return;
  const w = $("dok").offsetWidth || 400;
  const x = Math.round(Math.max(w / 2 + 12, Math.min(sirka - w / 2 - 12, sirka / 2 + posun)));
  if (x !== dokX) { dokX = x; scena.style.setProperty("--dok-x", x + "px"); }
}
/* Nápověda za otazníkem vpravo nahoře: tři kroky (zatoč, přibliž, klikni), které se odškrtávají; po všech třech zmizí.
   Místo bubliny „Klikni na mě“ jedna tečka slabě pulzuje, dokud si člověk poprvé nevybere jazyk. */
const ukazatel = $("ukazatel"), napoveda = $("napoveda"), tlNapoveda = $("tl-napoveda");
let ukazatelBod = -1;
const pamet = function(k){ try { return localStorage.getItem(k); } catch (e) { return null; } };
const zapamatuj = function(k){ try { localStorage.setItem(k, "1"); } catch (e) {} };
function ukazUkazatel(){
  if (pamet("atlas-uvitano") || vybrany || !globusOk) return;
  ukazatelBod = BOD_ATLASU[T.lang === "en" ? "en" : "cs"];
  potrebaKresli = true;
}
function schovejUkazatel(trvale){
  ukazatelBod = -1; ukazatel.hidden = true;
  if (trvale) { zapamatuj("atlas-uvitano"); krokNapovedy("klikni"); }
}
function krokNapovedy(krok){
  if (napoveda.hidden) return;
  const li = napoveda.querySelector('[data-krok="' + krok + '"]');
  if (!li || li.classList.contains("hotovo")) return;
  li.classList.add("hotovo");
  if (napoveda.querySelectorAll("li[data-krok]:not(.hotovo)").length === 0) zavriNapovedu();   // odkaz na návod není krok
}
let mizeniNapovedy = 0;
function otevriNapovedu(){
  clearTimeout(mizeniNapovedy); napoveda.classList.remove("mizi");
  napoveda.querySelectorAll("li.hotovo").forEach(function(li){ li.classList.remove("hotovo"); });
  napoveda.hidden = false; tlNapoveda.setAttribute("aria-expanded", "true");
}
function zavriNapovedu(hned){
  if (napoveda.hidden) return;
  tlNapoveda.setAttribute("aria-expanded", "false");
  if (hned === true || bezPohybu.matches) { napoveda.hidden = true; return; }
  napoveda.classList.add("mizi");            // ať je chvilku vidět poslední odškrtnutí
  mizeniNapovedy = setTimeout(function(){ napoveda.hidden = true; napoveda.classList.remove("mizi"); }, 1100);
}
tlNapoveda.addEventListener("click", function(){ if (napoveda.hidden || napoveda.classList.contains("mizi")) otevriNapovedu(); else zavriNapovedu(true); });
$("napoveda-x").addEventListener("click", function(){ zavriNapovedu(true); });
document.addEventListener("keydown", function(e){ if (e.key === "Escape") zavriNapovedu(true); });
function polohaUkazatele(){
  if (ukazatelBod < 0) return;
  if (!bVid[ukazatelBod]) { ukazatel.hidden = true; return; }
  ukazatel.hidden = false;
  ukazatel.style.transform = "translate(" + bPx[ukazatelBod].toFixed(1) + "px," + bPy[ukazatelBod].toFixed(1) + "px)";
}

/* rozlití území a oblouky začnou až po doletu; -1 = čeká se na přílet */
let odhaleniOd = 0;
const ODHALENI = 950;
function odhaleni(cas){ return odhaleniOd < 0 ? 0 : Math.max(0.001, Math.min(1, (cas - odhaleniOd) / ODHALENI)); }
let posledni = 0, popredBezelo = true;
function smycka(cas){
  requestAnimationFrame(smycka);
  if ((strom && strom.zapnuto) || (brana && !prechodBrany)) { posledni = cas; return; }   // glóbus je schovaný
  let zmena = potrebaKresli;
  const dt = Math.min(64, cas - (posledni || cas));
  if (prechod) {
    const k = Math.max(0, Math.min(1, (cas - prechod.zac) / prechod.delka)), e = plynule(k);
    rot = [prechod.z[0] + (prechod.k[0] - prechod.z[0]) * e, prechod.z[1] + (prechod.k[1] - prechod.z[1]) * e];
    if (prechod.k2 !== prechod.z2 || prechod.skok) {
      zoom = prechod.z2 * Math.pow(prechod.k2 / prechod.z2, e) * Math.exp(-(prechod.skok || 0) * Math.sin(Math.PI * k));
      uplatniZoom();
    }
    if (k >= 1) { const let2 = prechod.delka > 500; prechod = null; if (let2) pulsDo = cas + 2600; if (odhaleniOd < 0) odhaleniOd = cas; if (eu && eu.od < 0) eu.od = cas; }
    zmena = true;
  } else if (autoOtaceni && !tahne) {
    rot[0] = (rot[0] + dt * 0.006 / zoom) % 360;
    zmena = true;
  }
  if (Math.abs(posunCil - posun) > 0.5) {
    posun = bezPohybu.matches ? posunCil : posun + (posunCil - posun) * Math.min(1, dt / 160);
    zmena = true;
  } else if (posun !== posunCil) { posun = posunCil; zmena = true; }
  if (odhaleniOd > 0 && cas - odhaleniOd < ODHALENI + 40) zmena = true;   // území se právě rozlévá
  if (uvod) {                                                            // úvodní přílet z vesmíru
    const k = Math.max(0, Math.min(1, (cas - uvod.od) / uvod.delka)), e = 1 - Math.pow(1 - k, 3);
    uvodK = 0.08 + 0.92 * e; rot[0] = uvod.rot - 150 * (1 - e);
    uplatniZoom(); zmena = true;
    if (k >= 1) { uvod = null; uvodK = 1; uplatniZoom(); ukazUkazatel(); }
  }
  if (trpyt && gl && !denni && !barvitVitalitu && !bezPohybu.matches && cas < zivoDo && cas - trpyt.naposled > 60) {
    trpyt.naposled = cas; teckyZmeneny = true;                          // světélka se jemně třpytí
  }
  posledni = cas; casSnimku = cas;
  potrebaKresli = false;
  kresliVse(cas, zmena);
  if (zmena) posunDok();
  const anim = animujePopredi(cas);
  if (spi !== (cas >= zivoDo)) { spi = !spi; scena.classList.toggle("spi", spi); }
  if (zmena || anim || popredBezelo) kresliPopredi(cas);
  popredBezelo = anim;                  // ještě jeden snímek po konci animace, ať nic nezůstane viset
}

/* ---------- myš a prsty: tažení otáčí, dva prsty a kolečko přibližují ---------- */
if (globusOk) {
  let start = null, pinch = null;
  const prsty = new Map();
  const vzdalenostPrstu = function(){ const p = Array.from(prsty.values()); return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
  platno.addEventListener("pointerdown", function(e){
    ozivit();
    /* První prst nového dotyku (isPrimary) znamená, že žádný jiný na displeji není. Telefon občas zvednutí prstu
       neohlásí (pod prstem se otevře karta nebo odroluje stránka) a v paměti zůstal „duch“; jeden prst se pak
       počítal jako dva a glóbus jen přibližoval, místo aby se otáčel (uživatel 24. 9. 2026). */
    if (e.isPrimary) { prsty.clear(); pinch = null; }
    try { platno.setPointerCapture(e.pointerId); } catch (x) {}
    prsty.set(e.pointerId, {x: e.clientX, y: e.clientY});
    prechod = null;
    if (prsty.size === 2) { pinch = {d: vzdalenostPrstu(), zoom: zoom}; start = null; }
    else if (prsty.size === 1) {
      start = {x: e.clientX, y: e.clientY, rot: rot.slice(), posun: 0};
      tahne = true; platno.classList.add("tahne");
    }
  });
  platno.addEventListener("pointermove", function(e){
    if (prsty.has(e.pointerId)) prsty.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pinch && prsty.size >= 2) { const d = vzdalenostPrstu(); if (d > 0 && pinch.d > 0) { nastavZoom(pinch.zoom * d / pinch.d); krokNapovedy("pribliz"); } return; }
    ozivit();
    if (!start) { if (!prsty.size) najedNaBod(e); return; }
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    start.posun = Math.max(start.posun, Math.abs(dx) + Math.abs(dy));
    if (start.posun > 40) krokNapovedy("zatoc");
    const k = 0.32 * (320 / Math.max(160, polomer));
    rot = [start.rot[0] + dx * k, Math.max(-88, Math.min(88, start.rot[1] - dy * k))];
    potrebaKresli = true;
  });
  const pustPrst = function(e, klik){
    prsty.delete(e.pointerId);
    if (prsty.size < 2) pinch = null;
    if (prsty.size === 0) {
      const posun = start ? start.posun : 99;
      start = null; tahne = false; platno.classList.remove("tahne");
      if (klik && posun < 6) klikDoMapy(e);
    }
  };
  platno.addEventListener("pointerup", function(e){ pustPrst(e, true); });
  platno.addEventListener("pointercancel", function(e){ pustPrst(e, false); });
  platno.addEventListener("lostpointercapture", function(e){ if (prsty.has(e.pointerId)) pustPrst(e, false); });
  platno.addEventListener("pointerleave", function(){
    nastavZvyrazneni(-1);
    $("bublina-bod").hidden = true;
  });
  platno.addEventListener("wheel", function(e){
    e.preventDefault(); ozivit();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    nastavZoom(zoom * Math.exp(-d * 0.0015));
    krokNapovedy("pribliz");
  }, {passive: false});
  platno.addEventListener("dblclick", function(e){
    const r = platno.getBoundingClientRect();
    const bod = proj.invert([e.clientX - r.left, e.clientY - r.top]);
    if (bod && !isNaN(bod[0])) { letKe(bod, zoom * 2); krokNapovedy("pribliz"); }
  });
  $("tl-priblizi").addEventListener("click", function(){ plynulyZoom(zoom * 1.6); krokNapovedy("pribliz"); });
  $("tl-oddal").addEventListener("click", function(){ plynulyZoom(zoom / 1.6); krokNapovedy("pribliz"); });
  document.addEventListener("keydown", function(e){
    const c = e.target;
    if (c && (c.tagName === "INPUT" || c.tagName === "TEXTAREA")) return;
    if (e.key === "+" || e.key === "=") { plynulyZoom(zoom * 1.6); krokNapovedy("pribliz"); }
    else if (e.key === "-" || e.key === "_") { plynulyZoom(zoom / 1.6); krokNapovedy("pribliz"); }
  });
}

function nejblizsiBod(mx, my, limit){
  let nej = -1, nejd = limit * limit;
  for (let i = 0; i < POCET_B; i++) {
    if (!bVid[i]) continue;
    const dx = bPx[i] - mx, dy = bPy[i] - my, d = dx * dx + dy * dy;
    if (d < nejd) { nejd = d; nej = i; }
  }
  return nej;
}
function umisti(el, e){
  const sc = $("scena").getBoundingClientRect();
  el.style.left = Math.min(Math.max(8, e.clientX - sc.left + 14), sc.width - el.offsetWidth - 8) + "px";
  el.style.top = Math.min(Math.max(8, e.clientY - sc.top + 14), sc.height - el.offsetHeight - 8) + "px";
}
const bublinaBod = $("bublina-bod");
function najedNaBod(e){
  const r = platno.getBoundingClientRect();
  const i = nejblizsiBod(e.clientX - r.left, e.clientY - r.top, 9);
  if (i === zvyraznenyBod && (i < 0 || !bublinaBod.hidden)) return;
  nastavZvyrazneni(i);
  if (i < 0) { bublinaBod.hidden = true; return; }
  bublinaBod.textContent = jmenoBodu(i) + " · " + REJSTRIK.rr[B[i][3]];
  bublinaBod.hidden = false;
  umisti(bublinaBod, e);
}

const okno = $("zeme-okno");
/* ---------- země: všechny jazyky státu z rejstříku, na přání rozsvícené na glóbu ---------- */
let zeme = null;                          // {f: tvar státu, body: tečky jeho jazyků}
/* velikonoční vajíčko: napsáním „eulang“ se rozsvítí 24 úředních jazyků EU a objeví se vlajka EU */
const EU_JAZYKY = ["bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "ga", "hr", "hu", "it", "lt", "lv", "mt", "nl", "pl", "pt", "ro", "sk", "sl", "sv"];
const EU_BOD = new Uint8Array(POCET_B);
/* hvězdičky na glóbu: 24 jazyků EU („eulang“), nebo na Evropský den jazyků všechny evropské jazyky atlasu */
function hvezdyJazyku(ids){
  EU_BOD.fill(0);
  return ids.filter(function(id){ return PODLE_ID[id]; }).map(function(id){
    const i = BOD_ATLASU[id], j = PODLE_ID[id];               // chorvatština tečku nemá (Glottolog ji vede se srbštinou jako jeden jazyk): poloha z atlasu
    if (i >= 0) EU_BOD[i] = 1;
    const v = i >= 0 ? vektor(B[i][1], B[i][2]) : vektor(j.stred[0], j.stred[1]); v.push(1);
    return {id: id, i: i, v: v, sx: -1, sy: -1};
  });
}
let EU = hvezdyJazyku(EU_JAZYKY);
let eu = null;                            // {od: kdy začaly vyskakovat hvězdičky (-1 = čeká se na přílet), druh: "eu" | "evropa"}
/* srovnání dvou jazyků: první je zároveň vybraný (vybrany), druhý se k němu jen přidá */
var srovnani = null;                      // {a: jazyk, b: jazyk} (viz jazykAtlasu / jazykBodu)
var cekaNaDruhy = null;                   // první jazyk, dokud se vybírá druhý
var brana = false, vymysleny = null;      // Brána do jiných světů je otevřená / id vymyšleného jazyka na kartě
function bodyVeStatu(nazev){
  const kod = PD.mapaStatu && PD.mapaStatu[nazev];
  if (!kod) return null;
  const v = [];
  for (let i = 0; i < POCET_B; i++) if (!skryty[i] && (" " + (radek(i)[3] || "") + " ").indexOf(" " + kod + " ") >= 0) v.push(i);
  return v;
}
/* jak blízko přiblížit, aby byl vidět celý tvar (stát) kolem daného středu */
function zoomProTvar(g, s){
  let max = 0;
  const kruhy = g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? [].concat.apply([], g.coordinates) : [];
  kruhy.forEach(function(r){ for (let i = 0; i < r.length; i += 2) { const d = d3.geoDistance(s, r[i]); if (d > max) max = d; } });
  return max ? Math.max(1, Math.min(4, 0.8 / Math.max(Math.sin(Math.min(max, 1.45)), 0.02))) : 3;
}
function zhasniZemi(){ if (!zeme) return; zeme = null; if (globusOk) obnovPriznaky(); }
function klikDoMapy(e){
  const r = platno.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  if (eu) {                                   // hvězdička jazyka EU má přednost (chorvatština tečku nemá)
    const h = EU.filter(function(x){ return x.sx >= 0 && Math.hypot(x.sx - mx, x.sy - my) < 13; })[0];
    if (h) { okno.hidden = true; vyber(h.id); return; }
  }
  const i = nejblizsiBod(mx, my, 11);
  if (i >= 0) { okno.hidden = true; vyberBod(i); return; }
  const bod = proj.invert([mx, my]);
  if (!bod || isNaN(bod[0])) { okno.hidden = true; return; }
  let nalezena = null;
  for (let k = 0; k < ZEME.length; k++) { if (d3.geoContains(ZEME[k], bod)) { nalezena = ZEME[k]; break; } }
  if (!nalezena) { okno.hidden = true; return; }
  /* jedno kliknutí: stát se hned podbarví a jeho jazyky na glóbu rozsvítí; zavřením okna zvýraznění zmizí */
  if (vybrany) { vybrany = null; srovnani = null; zrusCekani(); karta.hidden = true; delete karta.dataset.jazyk; oznacTlacitka(null); zapisOdkaz(); }
  zeme = {f: nalezena, body: bodyVeStatu(nalezena.properties.name) || []};
  obnovPriznaky(); spoctiPosun(); ozivit();
  $("tl-cely").hidden = false;
  ukazOknoZeme(nalezena);
  okno.hidden = false;
  umisti(okno, e);
  krokNapovedy("klikni");
}
new MutationObserver(function(){ if (okno.hidden && zeme) { zhasniZemi(); if (!vybrany) $("tl-cely").hidden = true; } }).observe(okno, {attributes: true, attributeFilter: ["hidden"]});
function ukazOknoZeme(f){
  const zde = (V_ZEMI[f.properties.name] || []).filter(function(j){ return !atlasSkryty(j); });
  const body = bodyVeStatu(f.properties.name);
  okno.textContent = "";
  okno.appendChild(prvek("h4", null, nazevZeme(f.properties.name)));
  if (body && body.length) {
    okno.appendChild(prvek("p", "zeme-pocet", t("zemeRejstrik", {n: cislo(body.length) + " " + tvar(body.length, T.jazyk)})));
  }
  if (!zde.length) {
    okno.appendChild(prvek("p", null, tx("zemeBezPozdravu")));
  } else {
    okno.appendChild(prvek("p", "zeme-pozn", T.zemeAtlas));
    const ul = document.createElement("ul");
    zde.slice(0, 12).forEach(function(j){
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.textContent = j.n; b.style.borderColor = "var(--r-" + j.sk + ")";
      b.addEventListener("click", function(){ okno.hidden = true; vyber(j.id); });
      li.appendChild(b); ul.appendChild(li);
    });
    okno.appendChild(ul);
  }
}
document.addEventListener("keydown", function(e){ if (e.key === "Escape") { okno.hidden = true; bublinaBod.hidden = true; } });

/* ---------- výběr ---------- */
function poVyberu(cilZoom){
  if (!desktop.matches && window.scrollY > 40) window.scrollTo({top: 0, behavior: bezPohybu.matches ? "auto" : "smooth"});
  ozivit(); zapisOdkaz(); schovejUkazatel(true);
  odhaleniOd = bezPohybu.matches ? 0 : -1;
  if (autoOtaceni) nastavOtaceni(false);   // vybraný jazyk ať neujíždí z očí
  okno.hidden = true; bublinaBod.hidden = true;
  if (globusOk) { spoctiPosun(); if (!vybrany.bezPolohy) letKe(vybrany.stred, cilZoom); }   // jazyk bez polohy: glóbus zůstane
  $("tl-cely").hidden = false;
  if (strom) strom.poVyberu();
}
function nastavOtaceni(zapnout){
  autoOtaceni = !!zapnout;
  $("tl-otacet").setAttribute("aria-pressed", autoOtaceni ? "true" : "false");
  try { localStorage.setItem("atlas-otaceni", autoOtaceni ? "1" : "0"); } catch (e) {}
}
$("tl-otacet").addEventListener("click", function(){ nastavOtaceni(!autoOtaceni); });
function oznacTlacitka(id){
  Array.prototype.forEach.call(document.querySelectorAll(".jaz[data-id]"), function(el){
    const je = el.dataset.id === id;
    el.setAttribute("aria-pressed", je ? "true" : "false");
  });
}
function vyber(id){
  const j = PODLE_ID[id]; if (!j) return;
  if (cekaNaDruhy) { dokonciSrovnani(jazykAtlasu(id)); return; }   // vybírá se druhý jazyk ke srovnání
  if (brana) zavriBranu(true);
  if (srovnani) ukonciSrovnani();
  zeme = null;
  vybrany = {typ: "atlas", id: j.id, sk: j.sk, zeme: j.zeme, ob: j.ob, stred: j.stred,
             pribuzni: BOD_ATLASU[j.id] >= 0 ? pribuzniBodu(BOD_ATLASU[j.id], true, 6) : []};
  if (globusOk) obnovPriznaky();
  ukazKartu(j);
  poVyberu(globusOk ? zoomProJazyk(j) : 1);
  oznacTlacitka(id);
  const tl = document.querySelector('.jaz[data-id="' + id + '"]');
  if (tl && desktop.matches) tl.scrollIntoView({block: "center", behavior: bezPohybu.matches ? "auto" : "smooth"});   // na mobilu naopak nahoru ke glóbu
}
function vyberBod(i){
  if (cekaNaDruhy) { dokonciSrovnani(jazykBodu(i)); return; }
  if (brana) zavriBranu(true);
  if (B[i][5] && PODLE_ID[B[i][5]]) { vyber(B[i][5]); return; }
  if (srovnani) ukonciSrovnani();
  zeme = null;
  vybrany = {typ: "rejstrik", i: i, zeme: [], ob: [], stred: [B[i][1], B[i][2]], pribuzni: pribuzniBodu(i, false, 6), bezPolohy: !!BEZ_POLOHY[i]};
  if (globusOk) obnovPriznaky();
  ukazKartuBodu(i);
  poVyberu(Math.max(zoom, 2.6));
  oznacTlacitka(null);
}
function odznac(){
  srovnani = null; zrusCekani(); vymysleny = null;
  vybrany = null; zeme = null; prechod = null; ozivit(); zapisOdkaz();
  if (eu) ukonciEU(true);
  karta.hidden = true; delete karta.dataset.jazyk; $("tl-cely").hidden = true;
  if (globusOk) { obnovPriznaky(); spoctiPosun(); plynulyZoom(1); }
  okno.hidden = true; bublinaBod.hidden = true;
  oznacTlacitka(null);
  if (strom) strom.zavrenaKarta();
}
$("tl-cely").addEventListener("click", odznac);
/* logo = „domů“: zavře všechno (rodokmen, Bránu, EU, srovnání, panely, hledání) a vrátí glóbus do výchozího pohledu */
function domu(){
  zavriNapovedu(true);
  if (brana) zavriBranu(true);
  if (strom && strom.zapnuto) strom.prepni(false);
  otevriZobrazeni(false);
  odznac(); zhasniZemi();
  if ($("hledej").value) { $("hledej").value = ""; postavPolici(""); }
  seznam.scrollTop = 0;
  if (globusOk) letKe([15, 25], 1);
  if (!ARTEFAKT && history.replaceState) { try { history.replaceState(null, "", location.pathname); obnovOdkazJinam(); } catch (e) {} }
  window.scrollTo({top: 0, behavior: bezPohybu.matches ? "auto" : "smooth"});
}
$("domu").addEventListener("click", function(e){ e.preventDefault(); domu(); });
$("k-zavrit").addEventListener("click", odznac);
$("tl-nahoda").addEventListener("click", function(){
  if ($("hledej").value) { $("hledej").value = ""; postavPolici(""); }
  if (rezimZnak === "jen") {                  // v atlasu je jen jeden znakový jazyk, beru z celého rejstříku
    let i;
    do { i = REJSTRIK.zn[Math.floor(Math.random() * REJSTRIK.zn.length)]; } while (skryty[i] || (vybrany && vybrany.i === i && REJSTRIK.zn.length > 1));
    vyberBod(i); return;
  }
  const moznosti = JAZYKY.filter(function(j){ return !atlasSkryty(j) && !(vybrany && vybrany.id === j.id); });
  vyber(moznosti[Math.floor(Math.random() * moznosti.length)].id);
});

/* ---------- filtry teček: znakové jazyky a vitalita ---------- */
const tlZnak = Array.prototype.slice.call(document.querySelectorAll(".segment [data-znak]"));
function uplatniFiltry(start){
  povolenych = 0;
  for (let i = 0; i < POCET_B; i++) {
    const znak = rezimZnak === "bez" ? ZNAKOVY[i] : rezimZnak === "jen" ? 1 - ZNAKOVY[i] : 0;
    skryty[i] = znak || !povoleneStupne.has(vitalitaBodu(i)) ? 1 : 0;
    if (!skryty[i]) povolenych++;
  }
  if (vybrany) {                            /* vybraný jazyk, který filtr schoval, se odznačí */
    const i = vybrany.typ === "atlas" ? BOD_ATLASU[vybrany.id] : vybrany.i;
    if ((vybrany.typ === "atlas" && atlasSkryty(PODLE_ID[vybrany.id])) || (i >= 0 && skryty[i])) odznac();
    else {
      vybrany.pribuzni = i >= 0 ? pribuzniBodu(i, vybrany.typ === "atlas", 6) : [];
      if (vybrany.typ === "atlas") ukazKartu(PODLE_ID[vybrany.id]); else ukazKartuBodu(vybrany.i);
      if (srovnani) ukazSrovnani();
    }
  }
  if (zeme) zeme.body = bodyVeStatu(zeme.f.properties.name) || [];
  okno.hidden = true; bublinaBod.hidden = true;
  if (start) return;                        // při startu se police a glóbus postaví samy
  postavPolici($("hledej").value);
  if (vybrany && vybrany.typ === "atlas") oznacTlacitka(vybrany.id);
  if (globusOk && ctx) { if (zvyraznenyBod >= 0 && skryty[zvyraznenyBod]) zvyraznenyBod = -1; obnovPriznaky(); hudTxt2 = ""; ozivit(); }
  if (strom) strom.obnov();
}
function nastavZnakove(rezim, ulozit){
  if (["vse", "bez", "jen"].indexOf(rezim) < 0) rezim = "vse";
  rezimZnak = rezim;
  tlZnak.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.znak === rezim ? "true" : "false"); });
  if (ulozit) { try { localStorage.setItem("atlas-znakove", rezim); } catch (e) {} }
  obnovOdznakZobrazeni();
  obnovVitalituPanel();
  uplatniFiltry(!ulozit);
}
tlZnak.forEach(function(b){ b.addEventListener("click", function(){ nastavZnakove(b.dataset.znak, true); }); });

/* výběr stupňů vitality (panel pod tlačítkem „Vitalita“) */
const panelVit = $("vitalita-panel"), tlVit = $("tl-vitalita");
const POCTY_STUPNU = {};
for (let i = 0; i < POCET_B; i++) { const v = vitalitaBodu(i); POCTY_STUPNU[v] = (POCTY_STUPNU[v] || 0) + 1; }
const PORADI_V_PANELU = [0, 1, 2, 3, 4, 5, 6, -1];
function nazevStupne(v){ return v < 0 ? T.vitalitaBezUdaje : T.aes[v][0]; }
function obnovVitalituPanel(){
  const ul = $("vitalita-stupne");
  ul.textContent = "";
  PORADI_V_PANELU.forEach(function(v){
    const li = prvek("li"), b = prvek("button");
    b.type = "button"; b.setAttribute("aria-pressed", povoleneStupne.has(v) ? "true" : "false");
    if (v >= 0) b.title = T.aes[v][1];
    b.appendChild(prvek("span", "zatrzeni", povoleneStupne.has(v) ? "✓" : ""));
    const mini = prvek("span", "mini");
    mini.style.setProperty("--vit-barva", promennaVitality(v));
    for (let k = 0; k < 6; k++) mini.appendChild(prvek("i", v < 0 || k <= Math.min(v, 5) ? "plny" : null));
    b.appendChild(mini);
    b.appendChild(prvek("span", null, nazevStupne(v)));
    b.appendChild(prvek("span", "pocet-st", cislo(POCTY_STUPNU[v] || 0)));
    b.addEventListener("click", function(){
      if (povoleneStupne.has(v)) povoleneStupne.delete(v); else povoleneStupne.add(v);
      nastavVitalitu(Array.from(povoleneStupne));
    });
    li.appendChild(b); ul.appendChild(li);
  });
  const n = povoleneStupne.size, filtruje = n < VSECHNY_STUPNE.length;
  $("vitalita-pocet").hidden = !filtruje;
  $("vitalita-pocet").textContent = n + "/" + VSECHNY_STUPNE.length;
  obnovOdznakZobrazeni();
}
function nastavVitalitu(stupne, start){
  povoleneStupne = new Set(stupne.filter(function(v){ return VSECHNY_STUPNE.indexOf(v) >= 0; }));
  if (!start) { try { localStorage.setItem("atlas-vitalita", JSON.stringify(Array.from(povoleneStupne))); } catch (e) {} }
  obnovVitalituPanel();
  uplatniFiltry(!!start);
}
/* panel „Zobrazení“ nad dokem: přepínače a filtry; vitalita v něm má vlastní podstránku */
const panelZob = $("panel-zobrazeni"), tlZob = $("tl-zobrazeni"), pzHlavni = $("pz-hlavni");
function obnovOdznakZobrazeni(){
  const n = (rezimZnak !== "vse" ? 1 : 0) + (povoleneStupne.size < VSECHNY_STUPNE.length ? 1 : 0);
  $("zobrazeni-pocet").hidden = !n; $("zobrazeni-pocet").textContent = n;
  $("tl-zobrazeni").setAttribute("aria-label", n ? T.zobrazeni + ", " + t("filtryZapnute", {n: n}) : T.zobrazeni);
}
function otevriZobrazeni(otevrit){
  if (!otevrit && !panelVit.hidden) otevriVitalitu(false);
  panelZob.hidden = !otevrit;
  tlZob.setAttribute("aria-expanded", otevrit ? "true" : "false");
  obnovLegenduVitality();
}
tlZob.addEventListener("click", function(){ otevriZobrazeni(panelZob.hidden); });
$("zobrazeni-zavrit").addEventListener("click", function(){ otevriZobrazeni(false); tlZob.focus(); });
let vitalitaZLegendy = false;           // podstránka Vitalita otevřená z vysvětlivky pod glóbem
function otevriVitalitu(otevrit){
  vitalitaZLegendy = false;
  if (otevrit) panelZob.hidden = false, tlZob.setAttribute("aria-expanded", "true");
  panelVit.hidden = !otevrit; pzHlavni.hidden = !!otevrit;
  tlVit.setAttribute("aria-expanded", otevrit ? "true" : "false");
  barvitVitalitu = vitalitaZap || !!otevrit;
  obnovVitalituPanel();
  obnovLegenduVitality();
  teckyZmeneny = true; potrebaKresli = true; ozivit();
}
tlVit.addEventListener("click", function(){ otevriVitalitu(panelVit.hidden); });
/* ---------- tlačítko „Vitalita“ v liště: barvy vitality na jedno klepnutí, s vysvětlivkou jen po dobu zapnutí ----------
   (uživatel 25. 9. 2026: vitalita byla schovaná v podnabídce; trvalou vysvětlivku na glóbu ale nechce, proto se
   ukazuje jen se zapnutými barvami a volba se pamatuje) */
const tlVitDok = $("tl-vitalita-dok"), legendaVit = $("vit-legenda");
function nastavBarvyVitality(zap, start){
  vitalitaZap = !!zap;
  tlVitDok.setAttribute("aria-pressed", vitalitaZap ? "true" : "false");
  if (!start) { try { if (vitalitaZap) localStorage.setItem("atlas-barvy-vitality", "1"); else localStorage.removeItem("atlas-barvy-vitality"); } catch (e) {} }
  barvitVitalitu = vitalitaZap || !panelVit.hidden;
  obnovLegenduVitality();
  teckyZmeneny = true; potrebaKresli = true; ozivit();
}
function postavLegenduVitality(){
  const tl = $("vit-legenda-tl");
  tl.textContent = "";
  tl.setAttribute("title", T.vitalitaLegendaPopis);
  tl.appendChild(prvek("span", "vl-krajni", T.aes[0][0]));
  const pruh = prvek("span", "vl-pruh");
  for (let v = 0; v <= 5; v++) { const i = prvek("i"); i.style.background = promennaVitality(v); i.title = T.aes[v][0]; pruh.appendChild(i); }
  tl.appendChild(pruh);
  tl.appendChild(prvek("span", "vl-krajni", T.aes[5][0]));
  [[6, T.aes[6] ? T.aes[6][0] : ""], [-1, T.vitalitaBezUdaje]].forEach(function(d){
    if (!d[1]) return;
    const s = prvek("span", "vl-dalsi"), i = prvek("i"); i.style.background = promennaVitality(d[0]);
    s.appendChild(i); s.appendChild(document.createTextNode(d[1])); tl.appendChild(s);
  });
}
function obnovLegenduVitality(){
  if (!legendaVit) return;
  legendaVit.hidden = !(vitalitaZap && panelZob.hidden);
  if (!legendaVit.hidden) postavLegenduVitality();
}
tlVitDok.addEventListener("click", function(){ nastavBarvyVitality(!vitalitaZap); });
$("vit-legenda-tl").addEventListener("click", function(){ otevriVitalitu(true); vitalitaZLegendy = true; });   // vysvětlivka otevře stupně (filtr)
/* šipka zpět vede do panelu Zobrazení; když se stupně otevřely z vysvětlivky pod glóbem, zavře rovnou všechno */
$("vitalita-zavrit").addEventListener("click", function(){
  if (vitalitaZLegendy) { otevriZobrazeni(false); $("vit-legenda-tl").focus(); return; }
  otevriVitalitu(false); tlVit.focus();
});
$("vitalita-x").addEventListener("click", function(){ const zLeg = vitalitaZLegendy; otevriZobrazeni(false); (zLeg && !legendaVit.hidden ? $("vit-legenda-tl") : tlZob).focus(); });
$("vitalita-vse").addEventListener("click", function(){ nastavVitalitu(VSECHNY_STUPNE); });
$("vitalita-ohrozene").addEventListener("click", function(){ nastavVitalitu(OHROZENE); });
document.addEventListener("keydown", function(e){
  if (e.key !== "Escape") return;
  if (!panelVit.hidden) otevriVitalitu(false); else if (!panelZob.hidden) otevriZobrazeni(false);
});

/* ---------- odkaz na jazyk: #cs (jazyk z atlasu) nebo #corn1251 (glottocode tečky) ---------- */
const PODLE_KODU = new Map();
REJSTRIK.g.forEach(function(g, i){ if (g) PODLE_KODU.set(g, i); });
function kodVyberu(){
  if (brana) return vymysleny ? "mellon~" + vymysleny : "mellon";
  if (srovnani) return srovnani.a.kod + "~" + srovnani.b.kod;          // #cs~ar = srovnání dvou jazyků
  return !vybrany ? "" : vybrany.typ === "atlas" ? vybrany.id : REJSTRIK.g[vybrany.i] || "";
}
function zapisOdkaz(){
  const k = kodVyberu();
  if (decodeURIComponent(location.hash.slice(1)) === k) return;
  try { history.replaceState(null, "", location.pathname + location.search + (k ? "#" + k : "")); obnovOdkazJinam(); } catch (e) {}
}
function zrusFiltry(){                    /* odkaz na jazyk, který filtr schovává: filtry pryč */
  rezimZnak = "vse"; povoleneStupne = new Set(VSECHNY_STUPNE);
  try { localStorage.removeItem("atlas-znakove"); localStorage.removeItem("atlas-vitalita"); } catch (e) {}
  tlZnak.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.znak === "vse" ? "true" : "false"); });
  obnovVitalituPanel(); uplatniFiltry(false);
}
function prectiOdkaz(){
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h || h === kodVyberu()) return;
  if (h.toLowerCase() === "eulang") { spustEU(); return; }
  if (/^(o-datech|about-data)$/i.test(h)) { otevriODatech(); return; }
  if (/^(kalendar|language-days)$/i.test(h)) { otevriKalendar(); return; }
  if (/^(navod|guide)$/i.test(h)) { otevriNavod(); return; }
  if (/^mellon(~|$)/i.test(h)) { otevriBranu(); const v = h.split("~")[1]; if (v) ukazVymysleny(v); return; }
  if (h.indexOf("~") > 0) {
    const d = h.split("~"), najdi = function(k){ return PODLE_ID[k] ? jazykAtlasu(k) : PODLE_KODU.has(k) ? jazykBodu(PODLE_KODU.get(k)) : null; };
    const a = najdi(d[0]), b = najdi(d[1]);
    if (!a || !b) return;
    if ((a.i >= 0 && skryty[a.i]) || (b.i >= 0 && skryty[b.i])) zrusFiltry();
    if (a.j) vyber(a.kod); else vyberBod(a.i);
    cekaNaDruhy = jazykZVyberu(); dokonciSrovnani(b);
    return;
  }
  if (PODLE_ID[h]) { if (atlasSkryty(PODLE_ID[h])) zrusFiltry(); vyber(h); }
  else if (PODLE_KODU.has(h)) { const i = PODLE_KODU.get(h); if (skryty[i]) zrusFiltry(); vyberBod(i); }
}
window.addEventListener("hashchange", prectiOdkaz);
const tlSdilet = $("k-sdilet"), zkopirovano = $("k-zkopirovano");
if (ARTEFAKT) tlSdilet.hidden = true;       // v náhledu artefaktu by odkaz vedl na náhled, ne na web
let casZkopirovano = 0;
tlSdilet.addEventListener("click", function(){
  const url = location.href;
  const hotovo = function(text){
    zkopirovano.textContent = text; zkopirovano.hidden = false;
    clearTimeout(casZkopirovano); casZkopirovano = setTimeout(function(){ zkopirovano.hidden = true; }, 4000);
  };
  try { navigator.clipboard.writeText(url).then(function(){ hotovo(T.sdiletHotovo); }, function(){ hotovo(url); }); }
  catch (e) { hotovo(url); }
});

/* ---------- karty ---------- */
function pocetMluvcich(m){          /* m = miliony, jak jsou v data/languages.json */
  const n = Math.round(m * 1e6);
  return n < 100 ? T.hrstka : lidi(n);
}
const tlPrehraj = $("k-prehraj"), popisPrehraj = tlPrehraj.querySelector("span");
const karta = $("karta"), kartaTelo = $("k-telo"), kartaStitky = $("k-stitky"), kartaHero = $("k-hero");
/* karta jako pohlednice: barevné záhlaví, štítky s hlavními údaji, zbytek v záložkách */
function otevriKartu(barva, textBarva, novyJazyk){
  karta.hidden = false;
  kartaHero.classList.remove("srovnani", "vymysleny");    // karta srovnání a vymyšleného jazyka mají vlastní záhlaví
  malbaNaKarte(null);
  const dvojice = kartaHero.querySelector(".k-dvojice"); if (dvojice) dvojice.remove();
  $("k-porovnat").hidden = false;
  kartaHero.style.setProperty("--r-barva", barva);
  kartaHero.style.setProperty("--r-text", textBarva);
  kartaTelo.textContent = ""; kartaStitky.textContent = "";
  $("k-stav").hidden = true;
  if (novyJazyk) {                          // nový jazyk: karta vjede znovu a začne sbalená (na mobilu)
    karta.classList.remove("vjezd"); void karta.offsetWidth; karta.classList.add("vjezd");
    velikostKarty(""); karta.scrollTop = 0;
  }
}
function stitek(nazev, hodnota, vit){
  const d = prvek("div", "stitek");
  d.appendChild(prvek("span", "st-nazev", nazev));
  const h = prvek("span", "st-hodnota");
  if (vit != null) { const t2 = prvek("i", "st-tecka"); t2.style.background = promennaVitality(vit); h.appendChild(t2); }
  h.appendChild(document.createTextNode(hodnota));
  d.appendChild(h);
  kartaStitky.appendChild(d);
}
let zalozkaVybrana = 0;
function zalozky(skupiny){                  /* [{nazev, uzly: [prvky]}]; prázdné skupiny se vynechají */
  skupiny = skupiny.filter(function(g){ return g.uzly.filter(Boolean).length; });
  if (!skupiny.length) return;
  const panely = [], tlacitka = [];
  if (zalozkaVybrana >= skupiny.length) zalozkaVybrana = 0;
  if (skupiny.length > 1) {
    const lista = prvek("div", "zalozky"); lista.setAttribute("role", "tablist");
    skupiny.forEach(function(g, k){
      const b = prvek("button", null, g.nazev);
      b.type = "button"; b.setAttribute("role", "tab");
      b.addEventListener("click", function(){ zalozkaVybrana = k; ukaz(k); });
      tlacitka.push(b); lista.appendChild(b);
    });
    kartaTelo.appendChild(lista);
  }
  skupiny.forEach(function(g){
    const panel = prvek("div", "podrobnosti"); panel.setAttribute("role", "tabpanel");
    g.uzly.forEach(function(u){ if (u) panel.appendChild(u); });
    panely.push(panel); kartaTelo.appendChild(panel);
  });
  function ukaz(k){
    panely.forEach(function(p2, n){ p2.hidden = n !== k; });
    tlacitka.forEach(function(b, n){ b.setAttribute("aria-selected", n === k ? "true" : "false"); b.tabIndex = n === k ? 0 : -1; });
  }
  ukaz(zalozkaVybrana);
}
/* mobil: karta je list zespodu ve třech velikostech – malá lišta („mala“), běžná a celá („plna“).
   Tažením za úchyt nebo barevné záhlaví jde nahoru a dolů (list jede za prstem), klepnutí na úchyt ji
   uklidí do lišty a zase vytáhne. Dotek glóbu nebo stromu ji uklidí sám, ať nezakrývá, na co se díváš. */
function velikostKarty(v){
  karta.classList.toggle("mala", v === "mala");
  karta.classList.toggle("plna", v === "plna");
  if (v === "mala") karta.scrollTop = 0;
}
function uklidKartu(){ if (!desktop.matches && !karta.hidden && !karta.classList.contains("mala")) velikostKarty("mala"); }
$("k-uchyt").addEventListener("click", function(e){
  if (e.detail === 0 || !tazeniKarty.posun) velikostKarty(karta.classList.contains("mala") ? "" : "mala");
});
const tazeniKarty = {y0: null, posun: false};
(function(){
  const start = function(e){
    if (desktop.matches || e.touches.length !== 1) return;
    if (e.target.closest("button") && e.currentTarget !== $("k-uchyt")) { tazeniKarty.y0 = e.touches[0].clientY; tazeniKarty.posun = false; return; }
    tazeniKarty.y0 = e.touches[0].clientY; tazeniKarty.posun = false;
  };
  const pohyb = function(e){
    if (tazeniKarty.y0 == null) return;
    const dy = e.touches[0].clientY - tazeniKarty.y0;
    if (Math.abs(dy) > 6) tazeniKarty.posun = true;
    if (tazeniKarty.posun) { e.preventDefault(); karta.style.transition = "none"; karta.style.transform = "translateY(" + Math.max(-12, dy) + "px)"; }
  };
  const konec = function(e){
    if (tazeniKarty.y0 == null) return;
    const dy = (e.changedTouches[0] || {clientY: tazeniKarty.y0}).clientY - tazeniKarty.y0;
    tazeniKarty.y0 = null;
    karta.style.transition = ""; karta.style.transform = "";
    if (!tazeniKarty.posun) return;
    const mala = karta.classList.contains("mala"), plna = karta.classList.contains("plna");
    if (dy < -35) velikostKarty(mala ? "" : "plna");
    else if (dy > 45) { if (plna) velikostKarty(""); else if (!mala) velikostKarty("mala"); else odznac(); }
    setTimeout(function(){ tazeniKarty.posun = false; }, 0);
  };
  [$("k-uchyt"), kartaHero].forEach(function(el){
    el.addEventListener("touchstart", start, {passive: true});
    el.addEventListener("touchmove", pohyb, {passive: false});
    el.addEventListener("touchend", konec);
    el.addEventListener("touchcancel", konec);
  });
  ["globus", "strom"].forEach(function(id){ $(id).addEventListener("pointerdown", uklidKartu); });
})();
function ukazKartu(j){
  const novy = !karta.dataset.jazyk || karta.dataset.jazyk !== j.id;
  if (novy) zalozkaVybrana = 0;
  karta.dataset.jazyk = j.id;
  otevriKartu("var(--r-" + j.sk + ")", "var(--t-" + j.sk + ")", novy);
  $("k-plne").hidden = false; $("k-odznak").hidden = true;
  malbaNaKarte(j.id);
  const domov = BOD_ATLASU[j.id] >= 0 ? B[BOD_ATLASU[j.id]] : [0, j.stred[0], j.stred[1]];
  $("k-kod").textContent = souradnice(domov[1], domov[2]); $("k-kod").classList.add("sour");
  $("k-nazev").textContent = j.n;
  $("k-domaci").textContent = t("domaciJmeno", {x: j.dom});
  const pz = $("k-pozdrav");
  pz.textContent = j.pis;
  pz.style.fontSize = j.pis.length > 20 ? "1.5rem" : j.pis.length > 14 ? "1.85rem" : j.pis.length > 10 ? "2.2rem" : "";
  if (j.kod) pz.setAttribute("lang", j.kod); else pz.removeAttribute("lang");
  $("k-prepis").textContent = t("vyslovnost", {x: j.prep});
  tlPrehraj.hidden = !j.kod;
  popisPrehraj.textContent = T.poslechni;

  const znakAtlas = jeZnakovyJazyk(j);                 /* u znakového jazyka se nemluví, ale znakuje */
  const bodJ = BOD_ATLASU[j.id], stupenJ = bodJ >= 0 ? vitalitaBodu(bodJ) : -1;
  cestaRodokmenu(bodJ);
  stitek(znakAtlas ? T.uzivateluZnak : T.mluvcich, pocetMluvcich(j.mlu));
  stitek(T.rodina, j.rod);
  if (stupenJ >= 0) stitek(T.vitalita, (znakAtlas ? T.aesZnak : T.aes)[stupenJ][0], stupenJ);

  const fakt = prvek("section", "fakt-oddil");
  fakt.appendChild(prvek("p", "fakt", j.fakt));
  if (VYMYSLENE.stopy[j.id]) fakt.appendChild(prvek("p", "stopa", "✦ " + VYMYSLENE.stopy[j.id][T.lang]));   // stopa k Bráně („mellon“)
  let kde = null;
  const jmena = j.zeme.map(nazevZeme);
  if (jmena.length || j.ob.length) {
    kde = oddil(znakAtlas ? T.kdeZnakuje : T.kdeMluvi);
    const ul = prvek("ul", "staty");
    jmena.slice(0, 14).forEach(function(z){ ul.appendChild(prvek("li", null, z)); });
    if (jmena.length > 14) ul.appendChild(prvek("li", "vic", t("aDalsich", {n: jmena.length - 14})));
    if (j.ob.length) ul.appendChild(prvek("li", "vic", T.areal));
    kde.appendChild(ul);
  }
  let pribuzni = null;
  const ids = vybrany && vybrany.id === j.id ? vybrany.pribuzni : [];
  if (ids.length) {
    pribuzni = oddil(T.pribuzniAtlas);
    const seznamP = prvek("ul", "pribuzni");
    ids.forEach(function(k){
      const jj = PODLE_ID[B[k][5]], li = prvek("li"), b = prvek("button", null, jj.n);
      b.type = "button"; b.style.setProperty("--r-barva", "var(--r-" + jj.sk + ")");
      b.addEventListener("click", function(){ vyber(jj.id); });
      li.appendChild(b); seznamP.appendChild(li);
    });
    pribuzni.appendChild(seznamP);
    if (globusOk) pribuzni.appendChild(prvek("p", "pozn", tx("pribuzniOblouky")));
  }
  zalozky([
    {nazev: T.zalozkaZajimavost, uzly: [fakt, kde, oddilNareci(BOD_ATLASU[j.id])]},
    {nazev: T.vitalita, uzly: [stupenJ >= 0 ? oddilVitality(stupenJ, znakAtlas) : null]},
    {nazev: T.zalozkaPribuzni, uzly: [pribuzni, tlacitkoRodokmenu(BOD_ATLASU[j.id])]}
  ]);
}
/* vitalita jazyka: pruh se šesti stupni UNESCO v barvě stupně, název, vysvětlení a zdroj */
function oddilVitality(stupen, znak){
  const o = oddil(T.ohrozeni), popis = (znak ? T.aesZnak : T.aes)[stupen];
  const m = prvek("div", "ohrozeni");
  m.style.setProperty("--vit-barva", promennaVitality(stupen));
  m.setAttribute("role", "img"); m.setAttribute("aria-label", popis[0] + " (" + Math.min(stupen + 1, 6) + "/6)");
  for (let k = 0; k < 6; k++) m.appendChild(prvek("i", k <= Math.min(stupen, 5) ? "plny" : null));
  const p = prvek("p"); p.appendChild(prvek("span", "ohrozeni-nazev", popis[0])); p.appendChild(document.createTextNode(" – " + popis[1]));
  o.appendChild(m); o.appendChild(p); o.appendChild(prvek("p", "pozn", T.vitalitaZdroj));
  return o;
}
function prvek(tag, trida, text){
  const e = document.createElement(tag);
  if (trida) e.className = trida;
  if (text != null) e.textContent = text;
  return e;
}
/* nářečí jazyka podle Glottologu (na glóbu nemají vlastní tečku); česky jen tam, kde máme překlad */
function oddilNareci(i){
  if (!(i >= 0) || !PD.nareci[i]) return null;
  const jmena = PD.nareci[i].split("|").map(function(n){ return T.lang === "cs" && PD.nareciCs[n] ? PD.nareciCs[n] : n; });
  const o = oddil(T.nareci + " (" + cislo(jmena.length) + ")"), ul = prvek("ul", "staty");
  jmena.slice(0, 24).forEach(function(n){ ul.appendChild(prvek("li", null, n)); });
  if (jmena.length > 24) ul.appendChild(prvek("li", "vic", t("aDalsich", {n: jmena.length - 24})));
  o.appendChild(ul);
  o.appendChild(prvek("p", "pozn", T.nareciPozn));
  return o;
}
function oddil(nadpisText){ const o = prvek("section"); o.appendChild(prvek("h3", null, nadpisText)); return o; }
function lidi(n){                  /* počet lidí: malá čísla přesně, velká zaokrouhleně, ale ne hrubě */
  if (n < 10000) return cislo(n);
  if (n < 1e6) { const k = Math.round(n / 1000); return cislo(k) + " " + tvar(k, T.tisic); }
  if (n < 1e9) {
    const m = n < 1e7 ? Math.round(n / 1e5) / 10 : Math.round(n / 1e6);
    return cislo(m, Math.floor(m) === m ? 0 : 1) + " " + tvar(m, T.milionu);
  }
  const g = Math.round(n / 1e8) / 10;
  return cislo(g, Math.floor(g) === g ? 0 : 1) + " " + tvar(g, T.miliardy);
}
let hlaskyVzor = null;   // hlásky češtiny (nebo angličtiny) pro porovnání
function hlaskySrovnani(){
  const i = B.findIndex(function(b){ return b[5] === T.srovnavaciJazyk; });
  const h = i >= 0 ? radek(i)[6] : null;
  return Array.isArray(h) ? h : null;
}
/* cesta v rodokmenu jako řada štítků (rodina › větve › jazyk); klik otevře rodokmen */
function cestaRodokmenu(i){
  const nav = $("k-cesta");
  nav.textContent = "";
  if (!(i >= 0) || !strom || !strom.ma(i)) { nav.hidden = true; return; }
  const uzly = [];
  for (let u = radek(i)[2]; u >= 0; u = PD.nad[u]) uzly.unshift(u);
  let zobraz = uzly.map(function(u){ return nazevVetve(u, B[i][3]); });
  if (zobraz.length > 4) zobraz = [zobraz[0], "…"].concat(zobraz.slice(-2));
  zobraz.push(jmenoBodu(i));
  zobraz.forEach(function(n, k){
    if (k) nav.appendChild(prvek("span", "k-cesta-sip", "›"));
    const b = prvek("button", k === zobraz.length - 1 ? "posledni" : null, n);
    b.type = "button";
    b.addEventListener("click", function(){ strom.otevriPro(i); });
    nav.appendChild(b);
  });
  nav.hidden = false;
}
function ukazKartuBodu(i){
  const r = radek(i), kodB = "b" + i;
  const novy = karta.dataset.jazyk !== kodB;
  if (novy) zalozkaVybrana = 0;
  karta.dataset.jazyk = kodB;
  otevriKartu("var(--cyan)", "var(--na-cyan)", novy);
  $("k-plne").hidden = true; tlPrehraj.hidden = true;
  const jmeno = jmenoBodu(i);
  $("k-kod").textContent = BEZ_POLOHY[i] ? T.bezDomova : souradnice(B[i][1], B[i][2]); $("k-kod").classList.add("sour");
  $("k-nazev").textContent = jmeno;
  $("k-domaci").textContent = jmeno !== B[i][0] ? t("teckaNazev", {x: B[i][0]}) : T.teckaMezinarodni;
  const od = $("k-odznak");
  const oblast = BEZ_POLOHY[i] ? "" : REJSTRIK.mm[B[i][4]];
  od.textContent = REJSTRIK.rr[B[i][3]] + (oblast ? " · " + oblast : "");
  od.hidden = false;

  cestaRodokmenu(i);
  const znak = ZNAKOVY[i] === 1;                       /* znakový jazyk: vlastní vysvětlení, ne „mluví se“ */
  const wdm = Array.isArray(r[10]) ? r[10] : null;     // [počet, rok, rodilí?] z Wikidat
  if (r[0] >= 0) stitek(T.vitalita, (znak ? T.aesZnak : T.aes)[r[0]][0], r[0]);
  if (wdm) stitek(znak ? T.znakuje : T.mluvci, lidi(wdm[0]));
  else if (r[8] > 0) stitek(T.uzivatelu, lidi(r[8]));
  if (r[4] > 0) stitek(T.nareci, cislo(r[4]));

  const prehled = [], stavba = [], rod = [];
  if (znak) { const o = oddil(T.znakovyCo); o.appendChild(prvek("p", null, T.znakovyVysvetleni)); prehled.push(o); }
  if (r[0] >= 0) prehled.push(oddilVitality(r[0], znak));
  const staty = BEZ_POLOHY[i] ? [] : (r[3] || "").split(" ").filter(Boolean);
  if (BEZ_POLOHY[i]) { const o = oddil(T.kdeMluviTecka); o.appendChild(prvek("p", null, t("bezDomovaText", {a: jmenoBodu(i)}))); prehled.push(o); }
  if (staty.length) {
    const o = oddil(znak ? T.kdeZnakuje : T.kdeMluviTecka), ul = prvek("ul", "staty");
    staty.slice(0, 12).forEach(function(k){ ul.appendChild(prvek("li", null, PD.staty[T.lang][k] || k)); });
    if (staty.length > 12) ul.appendChild(prvek("li", "vic", t("aDalsich", {n: staty.length - 12})));
    o.appendChild(ul); prehled.push(o);
  }
  const narO = oddilNareci(i); if (narO) prehled.push(narO);
  if (wdm) {
    const o = oddil(znak ? T.znakuje : T.mluvci);
    o.appendChild(prvek("p", null, t("mluvciHodnota", {n: lidi(wdm[0])})));
    o.appendChild(prvek("p", "pozn", t(wdm[2] ? (znak ? "mluvciPoznRodiliZnak" : "mluvciPoznRodili") : "mluvciPozn", {rok: wdm[1] ? " " + wdm[1] : ""})));
    prehled.push(o);
  } else if (r[8] > 0) {
    const o = oddil(T.uzivatelu);
    o.appendChild(prvek("p", null, t("uzivateluHodnota", {n: lidi(r[8])})));
    o.appendChild(prvek("p", "pozn", T.uzivateluPozn));
    prehled.push(o);
  }
  if (r[7] >= 0) {                                     /* ukázka textu: článek 1 deklarace */
    const u = PD.udhr[r[7]], o = oddil(T.ukazka);
    const q = prvek("blockquote", "ukazka", u[0]);
    if (u[1]) q.dir = "rtl";
    o.appendChild(q); o.appendChild(prvek("p", "pozn", T.ukazkaPopis)); prehled.push(o);
  }

  if (r[5]) {                                          /* stavba jazyka z WALS */
    const ul = prvek("ul", "vlastnosti");
    PD.wals.forEach(function(kod, k){
      const v = +r[5][k], popis = T.wals[kod];
      if (!v || !popis || !popis[1][v - 1]) return;
      const li = prvek("li"); li.appendChild(prvek("b", null, popis[0])); li.appendChild(prvek("span", null, popis[1][v - 1]));
      ul.appendChild(li);
    });
    if (ul.children.length) { const o = oddil(T.stavba); o.appendChild(ul); stavba.push(o); }
  }
  if (Array.isArray(r[6])) {                           /* hlásky z PHOIBLE */
    const h = r[6], o = oddil(T.hlasky);
    let txt = t("hlaskyHodnota", {c: h[0], cs: tvar(h[0], T.souhlaska), v: h[1], vs: tvar(h[1], T.samohlaska)});
    if (h[2] > 0) txt += t("hlaskyTony", {t: h[2], ts: tvar(h[2], T.ton)});
    o.appendChild(prvek("p", null, txt + "."));
    if (!hlaskyVzor || hlaskyVzor.lang !== T.lang) hlaskyVzor = {lang: T.lang, h: hlaskySrovnani()};
    if (hlaskyVzor.h) o.appendChild(prvek("p", "pozn", t("hlaskySrovnani", {c: hlaskyVzor.h[0], v: hlaskyVzor.h[1]})));
    stavba.push(o);
  }
  if (r[1] >= 0) { const o = oddil(T.popsanost); o.appendChild(prvek("p", null, velke(T.med[r[1]]) + ".")); stavba.push(o); }

  if (BEZ_RODU.has(B[i][3])) {                         /* umělý jazyk, pidžin…: žádná rodina, žádní příbuzní */
    const o = oddil(T.pribuzenstvo);
    o.appendChild(prvek("p", null, t("bezRodu", {a: jmenoBodu(i), druh: REJSTRIK.rr[B[i][3]]})));
    rod.push(o);
  } else if (r[2] >= 0) {                              /* příbuzenstvo a nejbližší příbuzní */
    const cesta = [];
    for (let u = r[2]; u >= 0; u = PD.nad[u]) cesta.unshift(PD.uzly[u]);
    cesta[0] = velke(REJSTRIK.rr[B[i][3]] || cesta[0]);
    const zobrazit = cesta.length > 4 ? [cesta[0], "…", cesta[cesta.length - 2], cesta[cesta.length - 1]] : cesta;
    const o = oddil(T.pribuzenstvo), p = prvek("p", "cesta");
    zobrazit.forEach(function(x, k){
      if (k) p.appendChild(prvek("span", "sipka", "›"));
      p.appendChild(prvek("span", null, x));
    });
    o.appendChild(p); rod.push(o);

    const oblouk = vybrany && vybrany.i === i ? vybrany.pribuzni : [];   // ti, ke kterým vede oblouk, jdou první
    const bratri = (sourozenci.get(r[2]) || []).filter(function(j){ return j !== i; })
      .sort(function(x, y){ return (oblouk.indexOf(x) < 0) - (oblouk.indexOf(y) < 0); });
    if (bratri.length) {
      const o2 = oddil(T.sourozenci + " (" + bratri.length + ")"), ul = prvek("ul", "pribuzni");
      bratri.slice(0, 8).forEach(function(j){
        const li = prvek("li"), b = prvek("button", null, jmenoBodu(j));
        b.type = "button";
        b.addEventListener("click", function(){ vyberBod(j); });
        li.appendChild(b); ul.appendChild(li);
      });
      if (bratri.length > 8) ul.appendChild(prvek("li", "vic", t("aDalsichPribuznych", {n: bratri.length - 8})));
      o2.appendChild(ul); rod.push(o2);
    }
  }
  rod.push(tlacitkoRodokmenu(i));
  zalozky([{nazev: T.zalozkaPrehled, uzly: prehled}, {nazev: T.zalozkaStavba, uzly: stavba}, {nazev: T.zalozkaPribuzni, uzly: rod}]);

  const o = oddil(T.odkazyPopis), odk = prvek("div", "odkazy");
  const hledat = T.lang === "cs" && r[9] ? r[9] : B[i][0] + " language";
  let wiki = "https://" + T.wikiDomena + "/w/index.php?search=" + encodeURIComponent(hledat);
  const clanky = r[12] || 0;                            // 1 = článek na cs Wikipedii, 2 = na en
  if (r[11] && clanky) {
    const web = (T.lang === "cs" && (clanky & 1)) || !(clanky & 2) ? "cswiki" : "enwiki";
    wiki = "https://www.wikidata.org/wiki/Special:GoToLinkedPage/" + web + "/Q" + r[11];
  }
  [[T.odkazGlottolog, "https://glottolog.org/glottolog?search=" + encodeURIComponent(B[i][0])],
   [T.odkazWikipedie, wiki]].forEach(function(x){
    const a = prvek("a", null, x[0] + " ↗"); a.href = x[1]; a.target = "_blank"; a.rel = "noopener";
    odk.appendChild(a);
  });
  o.appendChild(odk); o.appendChild(prvek("p", "pozn", T.teckaPozn));
  const pata = prvek("div", "podrobnosti k-pata"); pata.appendChild(o);
  kartaTelo.appendChild(pata);
}

/* ---------- zvuk: rodilý hlas, jinak výslovnost hlasem stránky, jinak aspoň text ---------- */
let hlasy = [];
function nactiHlasy(){ try { hlasy = window.speechSynthesis.getVoices() || []; } catch (e) { hlasy = []; } }
if ("speechSynthesis" in window) { nactiHlasy(); window.speechSynthesis.addEventListener("voiceschanged", nactiHlasy); }
function najdiHlas(kod){
  if (!kod || !hlasy.length) return null;
  const k = kod.toLowerCase().replace("_", "-"), zaklad = k.split("-")[0];
  const norm = function(v){ return v.lang.toLowerCase().replace("_", "-"); };
  return hlasy.filter(function(v){ return norm(v) === k; })[0]
      || hlasy.filter(function(v){ return norm(v).split("-")[0] === zaklad; })[0] || null;
}
tlPrehraj.addEventListener("click", function(){
  if (!vybrany || vybrany.typ !== "atlas") return;
  const j = PODLE_ID[vybrany.id], stav = $("k-stav");
  stav.hidden = false;
  if (!("speechSynthesis" in window)) { stav.textContent = t("zvukNeumi", {x: j.prep}); return; }
  nactiHlasy();
  const rodily = najdiHlas(j.kod), zalozni = najdiHlas(T.hlasZalozni);
  let text, hlas, rychlost;
  if (rodily) { text = j.pis.replace(/[!¡?¿]/g, ""); hlas = rodily; rychlost = 0.8; stav.textContent = T.zvukRodily; }
  else if (zalozni) { text = T.lang === "en" ? j.prep.toLowerCase() : j.prep; hlas = zalozni; rychlost = 0.75; stav.textContent = T.zvukZalozni; }
  else { stav.textContent = t("zvukZadny", {x: j.prep}); return; }
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = hlas; u.lang = hlas.lang; u.rate = rychlost;
    popisPrehraj.textContent = T.posloucha;
    u.onend = function(){ popisPrehraj.textContent = T.znovu; };
    u.onerror = function(){ popisPrehraj.textContent = T.znovu; stav.textContent = t("zvukChyba", {x: j.prep}); };
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  } catch (e) { stav.textContent = t("zvukChyba", {x: j.prep}); }
});

/* ---------- přepnutí jazyka bez nového listu ---------- */
const adresa = location.pathname.replace(/index\.html$/, "");
const korenWebu = VYCHOZI === "en" ? adresa.replace(/en\/$/, "") : adresa;
const odkazJinam = $("jazyk-prepinac");
/* ---------- O datech: odkud co je, co je odhad, verze dat a licence (texty T.oDatech, data VERZE z buildu) ---------- */
const oDatech = $("o-datech");
function postavODatech(){
  const O = T.oDatech, datum = function(d){ return d ? new Date(d + "T12:00:00").toLocaleDateString(T.locale, {day: "numeric", month: "long", year: "numeric"}) : "–"; };
  const dosad = function(s){ return s.replace(/\{(\w+)\}/g, function(_, k){
    return {g: cislo(POCET_B), n: cislo(POLOZEK_SEZNAMU), a: cislo(JAZYKY.length), gdat: datum(VERZE.glottolog), pdat: datum(VERZE.podrobnosti), wdat: datum(VERZE.wikidata)}[k] || ""; }); };
  oDatech.textContent = "";
  const hlava = prvek("div", "od-hlava");
  const h = prvek("h2", null, O.nadpis); h.id = "od-nadpis"; hlava.appendChild(h);
  const x = prvek("button", "zavrit"); x.type = "button"; x.setAttribute("aria-label", O.zavrit);
  x.innerHTML = '<svg aria-hidden="true"><use href="#i-krizek"/></svg>'; x.addEventListener("click", function(){ oDatech.close(); });
  hlava.appendChild(x); oDatech.appendChild(hlava);
  const telo = prvek("div", "od-telo");
  telo.appendChild(prvek("p", "od-uvod", dosad(O.uvod)));
  O.oddily.forEach(function(o){
    const sekce = prvek("section"); sekce.appendChild(prvek("h3", null, dosad(o.h)));
    o.p.forEach(function(t){ sekce.appendChild(prvek("p", null, dosad(t))); });
    telo.appendChild(sekce);
  });
  const sekce = prvek("section"); sekce.appendChild(prvek("h3", null, O.verzeNadpis));
  const tab = prvek("table", "od-verze"), tb = document.createElement("tbody");
  O.verze.forEach(function(v){ const tr = document.createElement("tr"); v.forEach(function(b){ tr.appendChild(prvek("td", null, dosad(b))); }); tb.appendChild(tr); });
  tab.appendChild(tb); sekce.appendChild(tab); telo.appendChild(sekce);
  oDatech.appendChild(telo);
}
function otevriODatech(){
  postavODatech();
  if (oDatech.showModal) { if (!oDatech.open) oDatech.showModal(); } else oDatech.setAttribute("open", "");
  oDatech.querySelector(".od-telo").scrollTop = 0;
}
$("tl-o-datech").addEventListener("click", otevriODatech);
/* ---------- kalendář jazykových dnů: všechny význačné dny Jazyka dne, klik vybere jazyk (přání uživatele 25. 9. 2026) ---------- */
const kalendar = $("kalendar");
function postavKalendar(){
  const K = T.kalendar, dnes = new Date(), dnesKlic = String(dnes.getMonth() + 1).padStart(2, "0") + "-" + String(dnes.getDate()).padStart(2, "0");
  kalendar.textContent = "";
  const hlava = prvek("div", "od-hlava");
  const h = prvek("h2", null, K.nadpis); h.id = "kal-nadpis"; hlava.appendChild(h);
  const x = prvek("button", "zavrit"); x.type = "button"; x.setAttribute("aria-label", T.oDatech.zavrit);
  x.innerHTML = '<svg aria-hidden="true"><use href="#i-krizek"/></svg>'; x.addEventListener("click", function(){ kalendar.close(); });
  hlava.appendChild(x); kalendar.appendChild(hlava);
  const telo = prvek("div", "od-telo");
  telo.appendChild(prvek("p", "od-uvod", K.uvod));
  const rok = dnes.getFullYear();
  const dny = Object.keys(DNY).concat(["09-26"]).map(function(k){       // pohyblivé dny („09-so2“) na letošní datum
    const d = /^\d\d-\d\d$/.test(k) ? new Date(rok, +k.slice(0, 2) - 1, +k.slice(3)) : dataPohyblivehoDne(k, rok);
    return {k: k, d: d, t: klicDne(d)};
  }).sort(function(a, b){ return a.d - b.d; });
  let mesic = -1, seznamM = null, cil = null;
  dny.forEach(function(x){
    const k = x.k, m = x.d.getMonth() + 1, den = x.d.getDate(), edl = k === "09-26", s = DNY[k];
    const j = edl ? null : s.kod ? (bodDne(s) >= 0 ? jazykZDne(s) : null) : PODLE_ID[s.id];
    if (!edl && !j) return;
    if (m !== mesic) {
      mesic = m;
      telo.appendChild(prvek("h3", null, new Date(2026, m - 1, 1).toLocaleDateString(T.locale, {month: "long"})));
      seznamM = prvek("ul", "kal-seznam"); telo.appendChild(seznamM);
    }
    const jeDnes = x.t === dnesKlic;
    const li = prvek("li"), b = prvek("button", "kal-den" + (jeDnes ? " dnes" : "")); b.type = "button";
    b.appendChild(prvek("span", "kal-datum", T.lang === "cs" ? den + ". " + m + "." : new Date(2026, m - 1, den).toLocaleDateString(T.locale, {day: "numeric", month: "short"})));
    const st = prvek("span", "kal-stred");
    if (edl) { st.appendChild(prvek("b", "kal-jazyk", T.denJazykuNadpis)); st.appendChild(prvek("span", "kal-proc", K.edl)); }
    else {
      const jm = prvek("b", "kal-jazyk"); const pz = prvek("span", "kal-pz", j.pis); if (j.kod) pz.lang = j.kod; pz.dir = "auto";
      jm.appendChild(pz); jm.appendChild(document.createTextNode(" " + j.n)); st.appendChild(jm);
      st.appendChild(prvek("span", "kal-proc", s[T.lang]));
    }
    if (jeDnes) st.appendChild(prvek("span", "kal-dnes", K.dnes));
    b.appendChild(st);
    b.addEventListener("click", function(){
      kalendar.close();
      if (edl) { spustEU("evropa"); return; }
      if (j.bod >= 0) { if (skryty[j.bod]) zrusFiltry(); vyberBod(j.bod); return; }
      if (atlasSkryty(j)) zrusFiltry();
      vyber(j.id);
    });
    li.appendChild(b); seznamM.appendChild(li);
    if (!cil && x.t >= dnesKlic) cil = b;        // otevře se u dnešního nebo nejbližšího dalšího dne
  });
  telo.appendChild(prvek("p", "kal-pozn", K.ostatni));
  kalendar.appendChild(telo);
  return cil;
}
function otevriKalendar(){
  const cil = postavKalendar();
  if (kalendar.showModal) { if (!kalendar.open) kalendar.showModal(); } else kalendar.setAttribute("open", "");
  const telo = kalendar.querySelector(".od-telo");
  telo.scrollTop = cil ? Math.max(0, cil.offsetTop - telo.offsetTop - 60) : 0;
}
$("tl-kalendar-pat").addEventListener("click", otevriKalendar);
/* ---------- podrobný návod (přání uživatele 25. 9. 2026): okno z patičky a z nápovědy pod otazníkem ---------- */
const navodOkno = $("navod");
function postavNavod(){
  const N = T.navod;
  navodOkno.textContent = "";
  const hlava = prvek("div", "od-hlava");
  const h = prvek("h2", null, N.nadpis); h.id = "nav-nadpis"; hlava.appendChild(h);
  const x = prvek("button", "zavrit"); x.type = "button"; x.setAttribute("aria-label", T.oDatech.zavrit);
  x.innerHTML = '<svg aria-hidden="true"><use href="#i-krizek"/></svg>'; x.addEventListener("click", function(){ navodOkno.close(); });
  hlava.appendChild(x); navodOkno.appendChild(hlava);
  const telo = prvek("div", "od-telo");
  telo.appendChild(prvek("p", "od-uvod", N.uvod));
  N.oddily.forEach(function(o){
    const sekce = prvek("section"); sekce.appendChild(prvek("h3", null, o.h));
    o.p.forEach(function(t){ sekce.appendChild(prvek("p", null, t)); });
    telo.appendChild(sekce);
  });
  navodOkno.appendChild(telo);
}
function otevriNavod(){
  zavriNapovedu(true);
  postavNavod();
  if (navodOkno.showModal) { if (!navodOkno.open) navodOkno.showModal(); } else navodOkno.setAttribute("open", "");
  navodOkno.querySelector(".od-telo").scrollTop = 0;
}
$("tl-navod-pat").addEventListener("click", otevriNavod);
$("napoveda-navod").addEventListener("click", otevriNavod);
navodOkno.addEventListener("click", function(e){ if (e.target === navodOkno) navodOkno.close(); });
kalendar.addEventListener("click", function(e){ if (e.target === kalendar) kalendar.close(); });
oDatech.addEventListener("click", function(e){ if (e.target === oDatech) oDatech.close(); });   // klik vedle okna zavře
const puvodniOdkaz = odkazJinam.getAttribute("href");
function prelozStranku(){
  document.documentElement.lang = T.lang;
  document.title = T.nazev;
  Array.prototype.forEach.call(document.querySelectorAll("[data-t]"), function(el){ el.textContent = tx(el.dataset.t); });
  [["title", "tTitle"], ["aria-label", "tAriaLabel"], ["placeholder", "tPlaceholder"]].forEach(function(a){
    Array.prototype.forEach.call(document.querySelectorAll("[data-t-" + a[0] + "]"), function(el){ el.setAttribute(a[0], T[el.dataset[a[1]]]); });
  });
  const zpetna = $("zpetna-odkaz");        // e-mail se zpětnou vazbou (info@atlasjazyku.cz), předmět podle jazyka
  zpetna.setAttribute("href", "mailto:" + T.zpetnaAdresa + "?subject=" + encodeURIComponent(T.zpetnaPredmet));
  if (ARTEFAKT) { zpetna.target = "_blank"; zpetna.rel = "noopener"; }   // v náhledu artefaktu smí ven jen nové okno
  $("tl-o-datech-text").textContent = T.oDatech.odkaz;
  obnovLegenduVitality();
  /* samostatné stránky jazyků (jen na webu, artefakt ani soubor z disku je nemají) */
  const oj = $("odkaz-jazyky");
  oj.hidden = ARTEFAKT || location.protocol === "file:";
  oj.textContent = T.stranky.vsechnyOdkaz;
  oj.setAttribute("href", korenWebu + (T.lang === "en" ? "en/languages/" : "jazyky/"));
  if (oDatech.open) postavODatech();
  if (kalendar.open) postavKalendar();
  if (navodOkno.open) postavNavod();
  const jiny = T.lang === "cs" ? "en" : "cs";
  odkazJinam.setAttribute("hreflang", jiny); odkazJinam.setAttribute("lang", jiny);
  obnovOdkazJinam();
}
/* odkaz na druhou jazykovou verzi nese i otevřený jazyk (#cs~sk), aby ho šlo otevřít i v novém listu */
function obnovOdkazJinam(){
  const jiny = T.lang === "cs" ? "en" : "cs";
  if (!ARTEFAKT && location.protocol !== "file:") odkazJinam.setAttribute("href", (jiny === "en" ? korenWebu + "en/" : korenWebu) + location.hash);
  else odkazJinam.setAttribute("href", T.lang === VYCHOZI ? puvodniOdkaz : "#");
}
window.addEventListener("hashchange", obnovOdkazJinam);
/* texty na stránce po změně jazyka nebo vzhledu */
function obnovTexty(){
  prelozStranku();
  obnovVitalituPanel();
  postavPolici($("hledej").value);
  okno.hidden = true; bublinaBod.hidden = true;
  if (vybrany && vybrany.typ === "atlas") { ukazKartu(PODLE_ID[vybrany.id]); oznacTlacitka(vybrany.id); }
  else if (vybrany && vybrany.typ === "rejstrik") ukazKartuBodu(vybrany.i);
  if (srovnani) ukazSrovnani();
  if (cekaNaDruhy) $("sv-text").textContent = t("porovnatVyzva", {a: jmenoL(cekaNaDruhy)});
  if (strom) strom.texty();
  if (eu) postavEuPanel();
  if (brana) { postavBranu(); if (vymysleny) ukazVymysleny(vymysleny); }
}
function prepniJazyk(lang){
  T = UI[lang]; STATY = STATY_VSE[lang];
  prelozData(); zmerPopisky();
  obnovTexty();
  zobrazenyZoom = ""; if (globusOk) { uplatniZoom(); hudTxt = ""; }
  if (!ARTEFAKT && location.protocol !== "file:" && history.replaceState) {
    try { history.replaceState(null, "", (lang === "en" ? korenWebu + "en/" : korenWebu) + location.hash); } catch (e) {}
  }
}
odkazJinam.addEventListener("click", function(e){
  e.preventDefault();
  prepniJazyk(T.lang === "cs" ? "en" : "cs");
});

/* ---------- start ---------- */
/* stránka začíná celým světem, bez vybraného jazyka (přání uživatele) */
(function(){
  let z = null, v = null;
  try { z = localStorage.getItem("atlas-znakove"); v = JSON.parse(localStorage.getItem("atlas-vitalita") || "null"); } catch (e) {}
  let bv = null; try { bv = localStorage.getItem("atlas-barvy-vitality"); } catch (e) {}
  if (bv === "1") nastavBarvyVitality(true, true);
  rezimZnak = ["vse", "bez", "jen"].indexOf(z) >= 0 ? z : "vse";
  tlZnak.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.znak === rezimZnak ? "true" : "false"); });
  nastavVitalitu(Array.isArray(v) && v.length ? v : VSECHNY_STUPNE, true);
})();
nastavRazeni(razeni); prelozStranku(); postavPolici("");

if (globusOk) {
  try {
    rot = [-15, -25];                 // pohled na Evropu, Afriku a Asii
    ctx = platno.getContext("2d"); ctxPodklad = podklad.getContext("2d"); ctxPopisky = platnoPopisky.getContext("2d");
    if (!ctx || !ctxPodklad || !ctxPopisky) throw new Error("plátno neumí 2D");
    if (!pripravGl()) { ctxBody = platnoGl.getContext("2d"); if (!ctxBody) throw new Error("plátno neumí kreslit tečky"); }
    platnoGl.addEventListener("webglcontextlost", function(e){ e.preventDefault(); });
    platnoGl.addEventListener("webglcontextrestored", function(){ if (pripravGl()) { nahrajPriznaky(glJaz); teckyZmeneny = true; } });
    cestaPodklad = d3.geoPath(proj, ctxPodklad);
    nactiBarvy();
    pripravRelief();
    new ResizeObserver(zmer).observe(platno);
    zmer();
    obnovPriznaky();
    zmerPopisky();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ zmerPopisky(); });
    let ulozeneOtaceni = null;
    try { ulozeneOtaceni = localStorage.getItem("atlas-otaceni"); } catch (e) {}
    nastavOtaceni(ulozeneOtaceni === "1");
    let ulozenePopisky = null;
    try { ulozenePopisky = localStorage.getItem("atlas-popisky"); } catch (e) {}
    nastavPopisky(ulozenePopisky !== "0");
    requestAnimationFrame(smycka);
    ozivit();
    /* úvod: glóbus přiletí z dálky a pootočí se; při odkazu na jazyk nebo omezeném pohybu se vynechá */
    if (!bezPohybu.matches && !location.hash) { uvod = {od: performance.now(), delka: 2200, rot: rot[0]}; uvodK = 0.08; uplatniZoom(); }
    else ukazUkazatel();
    posunDok();
  } catch (e) { console.error("Kreslení glóbu selhalo:", e); globusOk = false; }
}
/* ---------- rodokmen: strom jedné jazykové rodiny jako vějíř ----------
   Dole uprostřed je společný předek rodiny (kořen stromu Glottologu), větve se rozbíhají nahoru do půlkruhu
   a na jejich koncích jsou jednotlivé jazyky. Vzdálenost od kořene = hloubka ve stromu, úhel = pořadí listů.
   Tloušťka větve roste s počtem jazyků, které z ní vyrostly. Plochý obrázek: nic se neotáčí ani nepřekrývá,
   tažení posouvá, kolečko a dva prsty přibližují. (Dřívější 3D kornout uživatel zamítl: otáčení nedávalo smysl
   a větve se schovávaly za sebe.) */
var strom = (function(){   // var: filtry a texty se na něj ptají dřív, než vznikne
  const platnoS = $("strom"), cS = platnoS.getContext("2d"), scenaS = $("scena");
  const DETI = new Map();                                   // uzel → podřízené uzly
  PD.nad.forEach(function(n, u){ if (n >= 0) { if (!DETI.has(n)) DETI.set(n, []); DETI.get(n).push(u); } });
  const LISTY = new Map();                                  // uzel → tečky, které pod něj patří přímo
  for (let i = 0; i < POCET_B; i++) { const u = radek(i)[2]; if (u >= 0) { if (!LISTY.has(u)) LISTY.set(u, []); LISTY.get(u).push(i); } }
  const IZOLAT = REJSTRIK.r.en.findIndex(function(r){ return /^isolate/.test(r); });
  let OKRAJ = 0.07 * Math.PI;                               // vějíř nezačíná úplně vodorovně; na úzkém displeji je užší
  let zapnuto = false, rodina = -1, m = null, sw = 0, sh = 0, dprS = 1;
  let mer = 1, cil = [0, 0.5], let_ = null;                 // přiblížení a bod uprostřed pohledu (souřadnice stromu)
  let rustOd = 0, beziSmycka = false, posledniS = 0, najeto = null, podNajetym = null;
  let cxPosun = 0, barvy = null, barvyDen = null, prekreslit = true, tahneS = false;
  const RUST = 1300;

  function koren(i){ let u = radek(i)[2], k = -1; while (u >= 0) { k = u; u = PD.nad[u]; } return k; }
  function nazevUzlu(u){
    const n = PD.uzly[u];
    if (m && u === m.koren.u) return velke(REJSTRIK.rr[rodina] || n);
    return T.lang === "cs" && PD.vetve && PD.vetve[n] ? velke(PD.vetve[n]) : n;
  }
  /* rodiny, které mají strom (aspoň tři jazyky; izolované jazyky strom nemají) */
  function rodinyStromu(){
    const pocet = new Map();
    for (let i = 0; i < POCET_B; i++) if (!skryty[i] && B[i][3] !== IZOLAT && !BEZ_RODU.has(B[i][3]) && radek(i)[2] >= 0) pocet.set(B[i][3], (pocet.get(B[i][3]) || 0) + 1);
    return Array.from(pocet.entries()).filter(function(x){ return x[1] >= 3; }).sort(function(a, b){ return b[1] - a[1]; });
  }
  function naplnVyber(){
    const s = $("strom-rodina"); s.textContent = "";
    rodinyStromu().forEach(function(x){
      const o = document.createElement("option"); o.value = x[0];
      o.textContent = velke(REJSTRIK.rr[x[0]]) + " (" + cislo(x[1]) + ")"; s.appendChild(o);
    });
    s.value = String(rodina);
  }
  function barvaRodiny(f){
    for (let k = 0; k < JAZYKY.length; k++) { const i = BOD_ATLASU[JAZYKY[k].id]; if (i >= 0 && B[i][3] === f) return "--r-" + JAZYKY[k].sk; }
    return "--r-ost";
  }
  /* model: uzly a listy s polohou ve vějíři */
  function postav(f){
    rodina = f;
    const uzly = new Map();
    let kor = -1;
    for (let i = 0; i < POCET_B; i++) {
      if (B[i][3] !== f || skryty[i] || radek(i)[2] < 0) continue;
      const k = koren(i); if (kor < 0) kor = k; if (k !== kor) continue;
      for (let u = radek(i)[2]; u >= 0; u = PD.nad[u]) { if (uzly.has(u)) break; uzly.set(u, null); }
    }
    if (kor < 0) { m = null; return; }
    const vsechny = [];
    function uzel(u, rodic){
      const n = {u: u, i: -1, rodic: rodic, deti: [], listu: 0, hl: rodic ? rodic.hl + 1 : 0};
      vsechny.push(n);
      (DETI.get(u) || []).forEach(function(d){ if (uzly.has(d)) n.deti.push(uzel(d, n)); });
      (LISTY.get(u) || []).forEach(function(i){
        if (B[i][3] !== f || skryty[i]) return;
        const l = {u: -1, i: i, rodic: n, deti: [], listu: 1, hl: n.hl + 1, atlas: !!(B[i][5] && PODLE_ID[B[i][5]])};
        vsechny.push(l); n.deti.push(l);
      });
      n.listu = n.deti.reduce(function(s, d){ return s + d.listu; }, 0);
      return n;
    }
    const k0 = uzel(kor, null);
    let D = 1; vsechny.forEach(function(n){ if (n.hl > D) D = n.hl; });
    (function rozloz(n, a0, a1){
      n.a = (a0 + a1) / 2;
      let a = a0;
      n.deti.forEach(function(d){ const da = (a1 - a0) * d.listu / n.listu; rozloz(d, a, a + da); a += da; });
    })(k0, 0, 1);
    m = {koren: k0, uzly: vsechny, D: D, barva: barvaRodiny(f), podle: new Map()};
    vsechny.forEach(function(n){ if (n.i >= 0) m.podle.set(n.i, n); });
    rozmisti();
    rustOd = bezPohybu.matches ? -1e9 : performance.now();
    najeto = null; podNajetym = null;
    mer = 1; cil = m.stred.slice(); let_ = null;
  }
  /* poloha uzlů ve vějíři; volá se znovu, když se změní šířka displeje (telefon ↔ počítač) */
  function rozmisti(){
    const D = m.D;
    OKRAJ = (sw && sw < 600 ? 0.2 : 0.07) * Math.PI;
    m.uzky = !!(sw && sw < 600);
    m.sx = m.uzky ? 0.85 : 1; m.sy = m.uzky ? 1.6 : 1;           // na telefonu je vějíř elipsa protažená nahoru
    m.uzly.forEach(function(n){
      /* vzdálenost od kořene = hloubka; jazyk je o krok za svou větví (sourozenci střídavě o kousek dál,
         ať nesplývají). Stáhnout všechny jazyky na obvod dělalo stovky dlouhých paprsků, které splynuly v plochu. */
      n.r = n.hl / D + (n.i >= 0 ? 0.022 * (n.rodic.deti.indexOf(n) % 3) : 0);
      n.f = Math.PI - OKRAJ - n.a * (Math.PI - 2 * OKRAJ);
      n.x = n.r * Math.cos(n.f) * m.sx; n.y = n.r * Math.sin(n.f) * m.sy;
      n.sila = n.i >= 0 ? 0.8 : Math.min(5.5, 0.9 + Math.log2(n.listu) * 0.55);   // tloušťka čáry k uzlu
      n.jm = n.i >= 0 ? jmenoBodu(n.i) : null;
    });
    let x0 = 0, x1 = 0, y1 = 0;
    m.uzly.forEach(function(n){ x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); });
    m.sirka = x1 - x0 + (m.uzky ? 0.75 : 0.3); m.vyska = y1 + 0.08; m.stred = [(x0 + x1) / 2, y1 / 2];   // rezerva na popisky po stranách
  }
  function letNa(mer2, cil2){
    let_ = {z: [mer, cil.slice()], k: [mer2, cil2], od: performance.now(), delka: 800};
    if (bezPohybu.matches) { mer = mer2; cil = cil2; let_ = null; }
    probud();
  }
  function celek(){ if (m) letNa(1, m.stred.slice()); }
  function zaostri(n){
    let x0 = n.x, x1 = n.x, y0 = n.y, y1 = n.y;
    (function sber(u){ u.deti.forEach(function(d){ x0 = Math.min(x0, d.x); x1 = Math.max(x1, d.x); y0 = Math.min(y0, d.y); y1 = Math.max(y1, d.y); sber(d); }); })(n);
    const z = zaklad();
    const mer2 = Math.max(1, Math.min(40, Math.min((z.w - 60) / Math.max(0.02, x1 - x0) / z.k, (z.h - 120) / Math.max(0.02, y1 - y0) / z.k)));
    letNa(mer2, [(x0 + x1) / 2, (y0 + y1) / 2]);
  }
  /* cesta vybraného jazyka ke kořeni */
  function vybranyList(){
    if (!m || !vybrany) return null;
    const i = vybrany.typ === "atlas" ? BOD_ATLASU[vybrany.id] : vybrany.i;
    return i >= 0 ? m.podle.get(i) || null : null;
  }
  function nactiBarvyS(){
    const st = getComputedStyle(document.documentElement), v = function(n){ return st.getPropertyValue(n).trim(); };
    barvy = {cara: v("--tecka-jazyk"), text: v("--text"), text2: v("--text2"), plocha: v("--plocha"), rodina: v(m ? m.barva : "--r-ost"),
             krouzek: denni ? "#B07A10" : "#F2C25A", zvyrazneni: denni ? "#0E1838" : "#FFFFFF",
             druha: v(srovnani && srovnani.b.sk && srovnani.b.sk !== srovnani.a.sk ? "--r-" + srovnani.b.sk : "--fialova")};
    barvyDen = klicBarev();
  }
  function klicBarev(){ return denni + (m ? m.barva : "") + (srovnani ? srovnani.a.sk + "/" + srovnani.b.sk : ""); }
  function velikost(){
    const r = platnoS.getBoundingClientRect();
    dprS = Math.min(window.devicePixelRatio || 1, 1.5);
    if (Math.round(r.width) !== sw || Math.round(r.height) !== sh) {
      sw = Math.round(r.width); sh = Math.round(r.height);
      platnoS.width = Math.round(sw * dprS); platnoS.height = Math.round(sh * dprS);
      if (m && m.uzky !== (sw < 600)) { rozmisti(); cil = m.stred.slice(); mer = 1; }
    }
  }
  function posunKarty(){
    const k = $("karta");
    if (!desktop.matches || k.hidden) return 0;
    return Math.max(0, Math.min(sw * 0.22, (k.offsetLeft + k.offsetWidth + 10) / 2));
  }
  /* měřítko, při kterém se celý vějíř vejde (2,2 × 1,15 jednotky), a střed volné plochy */
  function zaklad(){
    const w = sw - 2 * cxPosun, h = sh;
    const sirka = m ? m.sirka : 2.3, vyska = m ? m.vyska : 1.1;
    return {w: w, h: h, k: Math.max(40, Math.min((w - 60) / sirka, (h - (desktop.matches ? 150 : 120)) / vyska)), cx: sw / 2 + cxPosun, cy: sh / 2 + (desktop.matches ? 12 : 26)};
  }
  function kresli(cas){
    velikost();
    if (!m || !sw) return;
    if (barvyDen !== klicBarev()) nactiBarvyS();
    const c = cS, B_ = barvy, z = zaklad(), k = z.k * mer;
    c.setTransform(dprS, 0, 0, dprS, 0, 0); c.clearRect(0, 0, sw, sh);
    const rust = Math.min(1, (cas - rustOd) / RUST) * 1.12;
    m.uzly.forEach(function(n){
      n.sx = z.cx + k * (n.x - cil[0]); n.sy = z.cy - k * (n.y - cil[1]);
      n.vid = n.sx > -40 && n.sx < sw + 40 && n.sy > -40 && n.sy < sh + 40;
      if (!n.rodic) n.ukaz = 1;
      else n.ukaz = n.rodic.ukaz < 1 ? 0 : Math.max(0, Math.min(1, (rust - n.rodic.r) / Math.max(0.001, n.r - n.rodic.r)));
    });
    const vyber_ = vybranyList(), cesta = new Set();
    for (let n = vyber_; n; n = n.rodic) cesta.add(n);
    const druhy_ = srovnani && srovnani.b.i >= 0 ? m.podle.get(srovnani.b.i) || null : null, cesta2 = new Set();   // srovnání: cesta druhého jazyka
    for (let n = druhy_; n; n = n.rodic) cesta2.add(n);
    const podNaj = podNajetym || new Set();
    const ox = z.cx - k * cil[0], oy = z.cy + k * cil[1];      // kořen = střed oblouků
    /* hrana jako v kruhovém rodokmenu: po oblouku rodiče k úhlu potomka, pak paprskem ven */
    function hrana(n, q){
      const r = n.rodic;
      c.moveTo(r.sx, r.sy);
      if (r.r > 0 && Math.abs(r.f - n.f) > 1e-4) c.ellipse(ox, oy, r.r * k * m.sx, r.r * k * m.sy, 0, -r.f, -n.f, n.f > r.f);
      const bx = ox + r.r * k * m.sx * Math.cos(n.f), by = oy - r.r * k * m.sy * Math.sin(n.f);
      c.lineTo(bx + (n.sx - bx) * q, by + (n.sy - by) * q);
    }
    /* větve: od kmene k listům tenčí */
    c.lineCap = "round";
    const tloustky = new Map();
    m.uzly.forEach(function(n){
      if (!n.rodic || !n.ukaz || cesta.has(n) || cesta2.has(n) || podNaj.has(n)) return;   // i mimo obraz: oblouk může vést přes něj
      const t = Math.round(n.sila * 2) / 2;
      if (!tloustky.has(t)) tloustky.set(t, []);
      tloustky.get(t).push(n);
    });
    c.strokeStyle = B_.cara; c.globalAlpha = (denni ? 0.6 : 0.5) * (cesta.size || cesta2.size ? 0.6 : 1);
    tloustky.forEach(function(seznam, t){
      c.beginPath();
      seznam.forEach(function(n){ hrana(n, n.ukaz); });
      c.lineWidth = t; c.stroke();
    });
    c.globalAlpha = 1;
    if (podNaj.size) {
      c.beginPath();
      podNaj.forEach(function(n){ if (n.rodic && n.ukaz) hrana(n, n.ukaz); });
      c.strokeStyle = B_.krouzek; c.lineWidth = 1.6; c.stroke();
    }
    if (cesta2.size) {
      c.beginPath();
      cesta2.forEach(function(n){ if (n.rodic && n.ukaz && !cesta.has(n)) hrana(n, n.ukaz); });
      c.shadowColor = B_.druha; c.shadowBlur = 14; c.strokeStyle = B_.druha; c.lineWidth = 5; c.stroke();
      c.shadowBlur = 0; c.strokeStyle = B_.zvyrazneni; c.lineWidth = 1.6; c.stroke();
    }
    if (cesta.size) {
      c.beginPath();
      cesta.forEach(function(n){ if (n.rodic && n.ukaz) hrana(n, n.ukaz); });
      c.shadowColor = B_.rodina; c.shadowBlur = 14; c.strokeStyle = B_.rodina; c.lineWidth = 5; c.stroke();
      c.shadowBlur = 0; c.strokeStyle = B_.zvyrazneni; c.lineWidth = 1.6; c.stroke();
    }
    /* uzly: rozvětvení jako kroužky, jazyky jako tečky; jazyky s pozdravem navrch */
    const tecky = [], velke_ = [];
    m.uzly.forEach(function(n){
      if (!n.vid || n.ukaz < 1) return;
      if (n.i < 0) {
        if (n.deti.length < 2 && n !== m.koren && !cesta.has(n) && n !== najeto) return;   // průchozí uzel bez rozvětvení
        const r = n === m.koren ? Math.max(5, Math.min(11, k * 0.018)) : Math.max(2, Math.min(6, k * 0.006));
        c.beginPath(); c.arc(n.sx, n.sy, r, 0, Math.PI * 2); c.fillStyle = B_.plocha; c.fill();
        c.lineWidth = cesta.has(n) || n === najeto ? 2.4 : 1.5; c.strokeStyle = cesta.has(n) ? B_.rodina : B_.krouzek; c.stroke();
      } else if (n.atlas || n === vyber_ || n === druhy_) velke_.push(n);
      else tecky.push(n);
    });
    const rt = Math.max(1.5, Math.min(4, k * 0.0035));
    c.beginPath();
    tecky.forEach(function(n){ c.moveTo(n.sx + rt, n.sy); c.arc(n.sx, n.sy, rt, 0, Math.PI * 2); });
    c.fillStyle = B_.cara; c.fill();
    velke_.forEach(function(n){
      const r = Math.max(4, Math.min(9, k * 0.01)) * (n === vyber_ || n === druhy_ ? 1.35 : 1);
      c.beginPath(); c.arc(n.sx, n.sy, r, 0, Math.PI * 2);
      c.fillStyle = n === druhy_ ? B_.druha : B_.rodina; c.fill(); c.lineWidth = 1.6; c.strokeStyle = B_.zvyrazneni; c.stroke();
      if (n === vyber_) { c.beginPath(); c.arc(n.sx, n.sy, r + 5, 0, Math.PI * 2); c.strokeStyle = B_.rodina; c.lineWidth = 2; c.stroke(); }
    });
    /* popisky: najetý, cesta vybraného, kořen, jazyky s pozdravem, přeložené velké větve, při přiblížení ostatní jazyky */
    const obsazeno = [];
    const volno = function(x0, y0, x1, y1){
      for (let q = 0; q < obsazeno.length; q++) { const o = obsazeno[q]; if (x0 < o[2] && x1 > o[0] && y0 < o[3] && y1 > o[1]) return false; }
      return true;
    };
    const kandidati = [];
    if (najeto) kandidati.push([najeto, 3]);
    if (vyber_) cesta.forEach(function(n){ if (n.i >= 0 || n.deti.length > 1 || n === m.koren) kandidati.push([n, n === vyber_ ? 3 : 2]); });
    if (druhy_) cesta2.forEach(function(n){ if (n.i >= 0 || n.deti.length > 1) kandidati.push([n, n === druhy_ ? 3 : 2]); });
    kandidati.push([m.koren, 3]);
    velke_.forEach(function(n){ kandidati.push([n, 1]); });
    m.uzly.filter(function(n){ return n.i < 0 && n.vid && n.deti.length > 1 && n !== m.koren; })   // bez překladu anglický název z Glottologu
      .sort(function(a, b){ return b.listu - a.listu; }).forEach(function(n){ kandidati.push([n, 0]); });
    if (mer >= 2.5) tecky.forEach(function(n){ kandidati.push([n, 0]); });
    let pocet = 0;
    const videno = new Set();
    c.textBaseline = "middle";
    kandidati.forEach(function(x){
      const n = x[0], vaha = x[1];
      if (videno.has(n) || !n.vid || n.ukaz < 1 || pocet > 220) return;
      videno.add(n);
      const text = n.i >= 0 ? n.jm : nazevUzlu(n.u) + (n === m.koren || n === najeto ? " · " + cislo(n.listu) + " " + tvar(n.listu, T.jazyk) : "");
      const vel = vaha >= 3 ? 13 : vaha === 2 ? 12 : 11.5;
      c.font = (vaha >= 1 || n.i < 0 ? "600 " : "500 ") + vel + "px Outfit, system-ui, sans-serif";
      const tw = c.measureText(text).width;
      let x0, y = n.sy;
      if (n.i >= 0) x0 = Math.cos(n.f) < 0 ? n.sx - 9 - tw : n.sx + 9;          // jazyk: popisek ven od kořene
      else if (n === m.koren) { x0 = n.sx - tw / 2; y = n.sy + 22; }
      else { x0 = n.sx - tw / 2; y = n.sy - 14; }                                   // větev: nad kroužkem
      const box = [x0 - 5, y - vel / 2 - 3, x0 + tw + 5, y + vel / 2 + 3];
      if (vaha < 3 && !volno(box[0], box[1], box[2], box[3])) return;
      obsazeno.push(box); pocet++;
      if (vaha >= 2 || n.i < 0) {
        c.fillStyle = B_.plocha; c.globalAlpha = vaha >= 2 ? 0.94 : 0.8;
        c.beginPath(); if (c.roundRect) c.roundRect(box[0] - 2, box[1], box[2] - box[0] + 4, box[3] - box[1], 7); else c.rect(box[0] - 2, box[1], box[2] - box[0] + 4, box[3] - box[1]);
        c.fill(); c.globalAlpha = 1;
      } else { c.lineWidth = 3; c.strokeStyle = B_.plocha; c.globalAlpha = 0.85; c.strokeText(text, x0, y); c.globalAlpha = 1; }
      c.fillStyle = n.i < 0 && vaha < 2 ? B_.text2 : B_.text;
      c.fillText(text, x0, y);
    });
  }
  function smyckaS(cas){
    if (!zapnuto) { beziSmycka = false; return; }
    const dt = Math.min(64, cas - (posledniS || cas)); posledniS = cas;
    let hybe = false;
    if (let_) {
      const q = Math.max(0, Math.min(1, (cas - let_.od) / let_.delka)), e = plynule(q);
      mer = let_.z[0] * Math.pow(let_.k[0] / let_.z[0], e);
      cil = [let_.z[1][0] + (let_.k[1][0] - let_.z[1][0]) * e, let_.z[1][1] + (let_.k[1][1] - let_.z[1][1]) * e];
      if (q >= 1) let_ = null;
      hybe = true;
    }
    const cilPosun = posunKarty();
    if (Math.abs(cilPosun - cxPosun) > 0.5) { cxPosun = bezPohybu.matches ? cilPosun : cxPosun + (cilPosun - cxPosun) * Math.min(1, dt / 160); hybe = true; }
    else if (cxPosun !== cilPosun) { cxPosun = cilPosun; hybe = true; }
    if (cas - rustOd < RUST + 50) hybe = true;
    if (hybe || prekreslit) { prekreslit = false; kresli(cas); }
    if (hybe || let_) requestAnimationFrame(smyckaS); else beziSmycka = false;   // v klidu se nic nepřekresluje
  }
  function probud(){ prekreslit = true; if (zapnuto && !beziSmycka) { beziSmycka = true; posledniS = 0; requestAnimationFrame(smyckaS); } }

  /* myš a prsty: tažení posouvá, kolečko a dva prsty přibližují k místu pod kurzorem */
  const prsty = new Map();
  let start = null, pinch = null;
  function najdi(x, y){
    if (!m) return null;
    let nej = null, d = 14 * 14;
    m.uzly.forEach(function(n){
      if (!n.vid || n.ukaz < 1 || (n.i < 0 && n.deti.length < 2 && n !== m.koren)) return;
      const dd = (n.sx - x) * (n.sx - x) + (n.sy - y) * (n.sy - y), v = n.atlas ? dd * 0.6 : dd;   // jazyk s pozdravem má přednost
      if (v < d) { d = v; nej = n; }
    });
    return nej;
  }
  function nastavNajeto(n){
    if (n === najeto) return;
    najeto = n; podNajetym = null;
    if (n && n.i < 0 && n !== m.koren) { podNajetym = new Set(); (function sber(x){ x.deti.forEach(function(d){ podNajetym.add(d); sber(d); }); })(n); }
    platnoS.style.cursor = n ? "pointer" : "grab";
    probud();
  }
  function priblizK(mer2, sx, sy){
    const z = zaklad(), k1 = z.k * mer;
    mer2 = Math.max(0.8, Math.min(40, mer2));
    const k2 = z.k * mer2, wx = cil[0] + (sx - z.cx) / k1, wy = cil[1] - (sy - z.cy) / k1;
    cil = [wx - (sx - z.cx) / k2, wy + (sy - z.cy) / k2]; mer = mer2;
  }
  platnoS.addEventListener("pointerdown", function(e){
    if (e.isPrimary) { prsty.clear(); pinch = null; }   // „duch“ neohlášeného prstu, viz glóbus
    try { platnoS.setPointerCapture(e.pointerId); } catch (x) {}
    prsty.set(e.pointerId, {x: e.clientX, y: e.clientY});
    let_ = null;
    if (prsty.size === 2) { const q = Array.from(prsty.values()); pinch = {d: Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y), mer: mer}; start = null; }
    else start = {x: e.clientX, y: e.clientY, cil: cil.slice(), pohyb: 0};
  });
  platnoS.addEventListener("pointermove", function(e){
    const r = platnoS.getBoundingClientRect();
    if (!prsty.has(e.pointerId)) { if (e.pointerType === "mouse") nastavNajeto(najdi(e.clientX - r.left, e.clientY - r.top)); return; }
    prsty.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pinch && prsty.size === 2) {
      const q = Array.from(prsty.values());
      priblizK(pinch.mer * Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y) / Math.max(20, pinch.d), (q[0].x + q[1].x) / 2 - r.left, (q[0].y + q[1].y) / 2 - r.top);
      probud(); return;
    }
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y, k = zaklad().k * mer;
    start.pohyb = Math.max(start.pohyb, Math.hypot(dx, dy));
    if (start.pohyb > 4) { tahneS = true; platnoS.classList.add("tahne"); }
    cil = [start.cil[0] - dx / k, start.cil[1] + dy / k];
    probud();
  });
  function konec(e){
    const r = platnoS.getBoundingClientRect();
    const klik = start && start.pohyb <= 4 && prsty.size === 1;
    prsty.delete(e.pointerId);
    if (prsty.size < 2) pinch = null;
    tahneS = false; platnoS.classList.remove("tahne");
    if (klik) {
      const n = najdi(e.clientX - r.left, e.clientY - r.top);
      if (n && n.i >= 0) vyberBod(n.i);
      else if (n) zaostri(n);
    }
    start = null;
  }
  platnoS.addEventListener("pointerup", konec);
  platnoS.addEventListener("pointercancel", konec);
  platnoS.addEventListener("lostpointercapture", function(e){ if (prsty.has(e.pointerId)) { prsty.delete(e.pointerId); if (prsty.size < 2) pinch = null; if (!prsty.size) { start = null; tahneS = false; platnoS.classList.remove("tahne"); } } });
  platnoS.addEventListener("pointerleave", function(e){ if (e.pointerType === "mouse" && !prsty.size) nastavNajeto(null); });
  platnoS.addEventListener("wheel", function(e){
    e.preventDefault(); let_ = null;
    const r = platnoS.getBoundingClientRect();
    priblizK(mer * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    probud();
  }, {passive: false});
  platnoS.addEventListener("dblclick", function(){ celek(); });
  $("strom-rodina").addEventListener("change", function(e){ postav(+e.target.value); nactiBarvyS(); probud(); });
  $("strom-cely").addEventListener("click", celek);
  new ResizeObserver(function(){ if (zapnuto) probud(); }).observe(platnoS);

  function prepni(zapnout, f){
    zapnuto = !!zapnout;
    scenaS.classList.toggle("rezim-strom", zapnuto);
    platnoS.hidden = !zapnuto; $("strom-hlava").hidden = !zapnuto; $("strom-napoveda").hidden = !zapnuto;
    const tl = $("tl-strom");
    tl.setAttribute("aria-pressed", zapnuto ? "true" : "false");
    tl.querySelector("use").setAttribute("href", zapnuto ? "#i-svet" : "#i-strom");
    const popisek = tl.querySelector("span"); popisek.dataset.t = zapnuto ? "globus" : "rodokmen"; popisek.textContent = zapnuto ? T.globus : T.rodokmen;
    if (!zapnuto) { if (globusOk && ctx) { potrebaKresli = true; teckyZmeneny = true; popiskyZmeneny = true; ozivit(); } return; }
    const vl = vybranyList(), i = vybrany ? (vybrany.typ === "atlas" ? BOD_ATLASU[vybrany.id] : vybrany.i) : -1;
    const cilova = f != null ? f : i >= 0 && B[i][3] !== IZOLAT && !BEZ_RODU.has(B[i][3]) && radek(i)[2] >= 0 ? B[i][3] : rodina >= 0 ? rodina : B[BOD_ATLASU[T.lang]][3];
    if (brana) zavriBranu(true);
    uklidKartu();                              // na mobilu karta do lišty, ať je strom vidět
    if (cilova !== rodina || !m || !vl) postav(cilova);
    naplnVyber(); nactiBarvyS();
    cxPosun = posunKarty();
    probud();
  }
  $("tl-strom").addEventListener("click", function(){ prepni(!zapnuto); });
  return {
    get zapnuto(){ return zapnuto; },
    prepni: prepni,
    /* po výběru jazyka: když je strom otevřený, přepne se na jeho rodinu */
    poVyberu: function(){
      if (!zapnuto || !vybrany) return;
      const i = vybrany.typ === "atlas" ? BOD_ATLASU[vybrany.id] : vybrany.i;
      if (i >= 0 && B[i][3] !== rodina && B[i][3] !== IZOLAT && !BEZ_RODU.has(B[i][3]) && radek(i)[2] >= 0) { postav(B[i][3]); naplnVyber(); nactiBarvyS(); }
      probud();
    },
    /* má tečka strom? (izolované jazyky ne) */
    ma: function(i){ return i >= 0 && B[i][3] !== IZOLAT && !BEZ_RODU.has(B[i][3]) && radek(i)[2] >= 0; },
    otevriPro: function(i){ prepni(true, B[i][3]); if (!desktop.matches) window.scrollTo({top: 0, behavior: bezPohybu.matches ? "auto" : "smooth"}); },
    obnov: function(){ if (zapnuto) { barvyDen = null; if (m && rodina >= 0) { postav(rodina); naplnVyber(); } probud(); } else m = null; },
    texty: function(){
      if (!m) return;
      m.uzly.forEach(function(n){ if (n.i >= 0) n.jm = jmenoBodu(n.i); });
      naplnVyber(); probud();
    },
    zavrenaKarta: function(){ if (zapnuto) probud(); },
    /* srovnání: přiblíží nejbližšího společného předka obou jazyků */
    zaostriNaDvojici: function(i1, i2){
      if (!m) return;
      velikost();                                   // plátno se právě ukázalo, ať je známá jeho velikost
      const x = m.podle.get(i1), y = m.podle.get(i2);
      if (!x || !y) return;
      const predci = new Set();
      for (let n = x; n; n = n.rodic) predci.add(n);
      let n = y; while (n && !predci.has(n)) n = n.rodic;
      if (n && n !== m.koren) zaostri(n);
    }
  };
})();
/* ---------- velikonoční vajíčko „eulang“ ---------- */
function postavEuPanel(){
  const evropa = eu && eu.druh === "evropa";
  $("eu-panel").classList.toggle("evropa", evropa);
  $("eu-nadpis").textContent = evropa ? t("evropaNadpis", {n: cislo(EU.length)}) : T.euNadpis;
  $("eu-panel").querySelector(".eu-text p").textContent = evropa ? T.evropaText : T.euText;
  const el = $("eu-jazyky"); el.textContent = "";
  EU.map(function(x){ return PODLE_ID[x.id]; }).sort(function(a, b){ return a.n.localeCompare(b.n, T.locale); }).forEach(function(j){
    const b = prvek("button", null, j.n); b.type = "button";
    b.addEventListener("click", function(){ vyber(j.id); });
    el.appendChild(b);
  });
}
function spustEU(druh){
  if (strom && strom.zapnuto) strom.prepni(false);
  if (brana) zavriBranu(true);
  if (vybrany) { vybrany = null; karta.hidden = true; delete karta.dataset.jazyk; oznacTlacitka(null); }
  zeme = null; okno.hidden = true; bublinaBod.hidden = true;
  schovejUkazatel(true);
  EU = hvezdyJazyku(druh === "evropa" ? EVROPSKE : EU_JAZYKY);
  eu = {od: -1, druh: druh === "evropa" ? "evropa" : "eu"};
  postavEuPanel();
  $("eu-panel").hidden = false; scena.classList.add("rezim-eu");
  $("tl-cely").hidden = false;
  if (globusOk && ctx) {
    obnovPriznaky(); spoctiPosun();
    letKe(desktop.matches ? [22, 54] : [14, 54], desktop.matches ? 2.4 : 2.6);   // Evropa mimo panel s vlajkou
    if (bezPohybu.matches) eu.od = 0;
    ozivit(); potrebaKresli = true;
  }
  if (!desktop.matches) window.scrollTo({top: 0, behavior: bezPohybu.matches ? "auto" : "smooth"});
}
function ukonciEU(bezZoomu){
  eu = null;
  $("eu-panel").hidden = true; scena.classList.remove("rezim-eu");
  if (globusOk && ctx) { obnovPriznaky(); potrebaKresli = true; ozivit(); }
  if (!bezZoomu && !vybrany) odznac();
}
$("eu-zavrit").addEventListener("click", function(){ ukonciEU(); });
/* spouštěč: „eulang“ napsané kdekoli na stránce, nebo do hledání (na telefonu jiná klávesnice není) */
(function(){
  let napsano = "";
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && eu) { ukonciEU(); return; }
    const c = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (c && (c.tagName === "INPUT" || c.tagName === "TEXTAREA" || c.tagName === "SELECT" || c.isContentEditable)) return;
    napsano = (napsano + e.key.toLowerCase()).slice(-6);
    if (napsano === "eulang") { napsano = ""; spustEU(); }
    if (napsano === "mellon") { napsano = ""; otevriBranu(); }      // „přítel“ elfsky: heslo Durinových dveří
  });
  $("hledej").addEventListener("input", function(e){
    const h = bezDiakritiky(e.target.value).trim();
    if (h !== "eulang" && h !== "mellon") return;
    e.target.value = ""; postavPolici(""); e.target.blur();
    if (h === "eulang") spustEU(); else otevriBranu();
  });
})();
/* ---------- srovnání dvou jazyků ----------
   Jazyk = {kod, j (jazyk z atlasu nebo null), i (tečka, nebo -1), lon, lat, rod (rodina Glottologu), sk (barevná skupina)}.
   Příbuznost je ze stromu Glottologu (nejbližší společný předek), stavba z WALS, hlásky z PHOIBLE. Nic se nedomýšlí:
   když údaj u jednoho z jazyků chybí, vlastnost se nesrovnává. */
const IZOLAT_R = REJSTRIK.r.en.findIndex(function(r){ return /^isolate/.test(r); });
function jazykAtlasu(id){
  const j = PODLE_ID[id], i = BOD_ATLASU[id] >= 0 ? BOD_ATLASU[id] : -1;
  return {kod: id, j: j, i: i, lon: i >= 0 ? B[i][1] : j.stred[0], lat: i >= 0 ? B[i][2] : j.stred[1], rod: i >= 0 ? B[i][3] : RODINA_ATLASU[id], sk: j.sk};
}
function jazykBodu(i){
  if (B[i][5] && PODLE_ID[B[i][5]]) return jazykAtlasu(B[i][5]);
  return {kod: REJSTRIK.g[i] || "", j: null, i: i, lon: B[i][1], lat: B[i][2], rod: B[i][3], sk: null};
}
function jazykZVyberu(){ return !vybrany ? null : vybrany.typ === "atlas" ? jazykAtlasu(vybrany.id) : jazykBodu(vybrany.i); }
/* barva druhého jazyka: když je ze stejné barevné skupiny jako první, dostane fialovou, ať jdou rozlišit */
function barvaDruheho(){ const a = srovnani.a, b = srovnani.b; return b.sk && b.sk !== a.sk ? barvaL(b) : "var(--fialova)"; }
function barvaRole(L){ return srovnani && L === srovnani.b ? barvaDruheho() : barvaL(L); }
function jmenoL(L){ return L.j ? L.j.n : jmenoBodu(L.i); }
function barvaL(L){ return L.sk ? "var(--r-" + L.sk + ")" : "var(--cyan)"; }
function textL(L){ return L.sk ? "var(--t-" + L.sk + ")" : "var(--na-cyan)"; }
function nazevVetve(u, rod){
  if (PD.nad[u] < 0) return velke(REJSTRIK.rr[rod] || PD.uzly[u]);
  const n = PD.uzly[u];
  return T.lang === "cs" && PD.vetve[n] ? velke(PD.vetve[n]) : n;
}
/* příbuznost: nejbližší společný předek ve stromu Glottologu */
function vztah(a, b){
  if (a.rod == null || b.rod == null || a.rod < 0 || b.rod < 0) return {typ: "nevime"};
  if (a.rod === IZOLAT_R || b.rod === IZOLAT_R) return {typ: "izolat"};
  if (BEZ_RODU.has(a.rod) || BEZ_RODU.has(b.rod)) return {typ: "bezrodu"};
  if (a.rod !== b.rod) return {typ: "ne"};
  if (a.i < 0 || b.i < 0 || !(radek(a.i)[2] >= 0) || !(radek(b.i)[2] >= 0)) return {typ: "rodina"};
  const retezA = [];
  for (let u = radek(a.i)[2]; u >= 0; u = PD.nad[u]) retezA.push(u);
  const retezB = [];
  let spolecny = -1;
  for (let u = radek(b.i)[2]; u >= 0; u = PD.nad[u]) { if (retezA.indexOf(u) >= 0) { spolecny = u; break; } retezB.push(u); }
  if (spolecny < 0) return {typ: "rodina"};
  return {typ: "predek", u: spolecny, koren: PD.nad[spolecny] < 0,
          cestaA: retezA.slice(0, retezA.indexOf(spolecny)).reverse(), cestaB: retezB.reverse()};
}
function zacniSrovnani(){
  const a = jazykZVyberu(); if (!a) return;
  if (srovnani) ukonciSrovnani(true);
  cekaNaDruhy = a;
  $("sv-text").textContent = t("porovnatVyzva", {a: jmenoL(a)});
  $("srovnani-vyzva").hidden = false;
  uklidKartu();
}
function zrusCekani(){ cekaNaDruhy = null; $("srovnani-vyzva").hidden = true; }
$("sv-zrusit").addEventListener("click", zrusCekani);
$("k-porovnat").addEventListener("click", zacniSrovnani);
function dokonciSrovnani(b){
  const a = cekaNaDruhy;
  if (!a) return;
  if ((a.i >= 0 && a.i === b.i) || (a.j && a.j === b.j)) return;       // stejný jazyk: čeká se dál
  zrusCekani();
  srovnani = {a: a, b: b};
  zapisOdkaz();
  ukazSrovnani();
  velikostKarty("");
  if (globusOk && ctx) {
    obnovPriznaky(); spoctiPosun();
    const bezA = a.i >= 0 && BEZ_POLOHY[a.i], bezB = b.i >= 0 && BEZ_POLOHY[b.i];   // jazyk bez polohy: jen k tomu druhému
    const va = vektor(bezA ? b.lon : a.lon, bezA ? b.lat : a.lat), vb = vektor(bezB ? a.lon : b.lon, bezB ? a.lat : b.lat);
    const s2 = [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]], d = Math.hypot(s2[0], s2[1], s2[2]) || 1;
    const stred = [Math.atan2(s2[1], s2[0]) / R, Math.asin(s2[2] / d) / R];
    const uhel = Math.acos(Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])));
    odhaleniOd = bezPohybu.matches ? 0 : -1;
    letKe(stred, Math.max(1, Math.min(4.5, 1.5 / (uhel + 0.22))));
    ozivit();
  }
  if (strom) strom.poVyberu();
  if (!desktop.matches && window.scrollY > 40) window.scrollTo({top: 0, behavior: bezPohybu.matches ? "auto" : "smooth"});
}
function ukonciSrovnani(tise){
  srovnani = null;
  if (tise) return;
  if (globusOk && ctx) { obnovPriznaky(); ozivit(); }
}
function zpetNaPrvni(){
  ukonciSrovnani();
  if (vybrany && vybrany.typ === "atlas") ukazKartu(PODLE_ID[vybrany.id]); else if (vybrany) ukazKartuBodu(vybrany.i);
  zapisOdkaz();
  if (strom) strom.poVyberu();
}
/* texty WALS se jinde vztahují ke čtenáři („stejně jako čeština“); ve srovnání dvou jiných jazyků to mate */
function bezOdkazuNaCtenare(txt){
  return txt.replace(/\s+(Stejně jako čeština|Just like English)\.?/g, "")
            .replace(/,\s*(stejně jako (čeština|my)|just like English|like in English|like we do)/gi, "");
}
function radekSrovnani(L, text){
  const d = prvek("div", "sr-radek"), te = prvek("i", "sr-tecka");
  te.style.background = barvaRole(L);
  d.appendChild(te); d.appendChild(prvek("b", null, jmenoL(L) + ": ")); d.appendChild(document.createTextNode(text));
  return d;
}
function ukazSrovnani(){
  const a = srovnani.a, b = srovnani.b, klic = "srovnani:" + a.kod + "~" + b.kod;
  const novy = karta.dataset.jazyk !== klic;
  if (novy) zalozkaVybrana = 0;
  karta.dataset.jazyk = klic;
  otevriKartu(barvaL(a), textL(a), novy);
  kartaHero.classList.add("srovnani");
  $("k-porovnat").hidden = true;
  $("k-kod").textContent = "⇄ " + T.srovnani; $("k-kod").classList.remove("sour");
  const dv = prvek("div", "k-dvojice");
  [a, b].forEach(function(L, n){
    if (n) dv.appendChild(prvek("span", "k-mezi", "⇄"));
    const d = prvek("div", "k-strana");
    d.style.setProperty("--r-barva", barvaL(L)); d.style.setProperty("--r-text", textL(L));
    if (L.j) { const pz = prvek("span", "ks-pozdrav", L.j.pis); if (L.j.kod) pz.lang = L.j.kod; d.appendChild(pz); }
    d.appendChild(prvek("strong", "ks-nazev", jmenoL(L)));
    if (L.rod >= 0) d.appendChild(prvek("span", "ks-rodina", velke(REJSTRIK.rr[L.rod])));
    dv.appendChild(d);
  });
  kartaHero.appendChild(dv);

  const v = vztah(a, b);
  stitek(T.pribuzne, v.typ === "predek" || v.typ === "rodina" ? T.ano : v.typ === "nevime" ? "?" : T.ne);

  /* příbuznost */
  const rod = oddil(T.zalozkaPribuznost);
  if (v.typ === "ne" || v.typ === "izolat" || v.typ === "bezrodu") {
    rod.appendChild(prvek("p", "sr-verdikt", T.pribuzneNe));
    if (v.typ === "bezrodu") [a, b].forEach(function(L){ if (BEZ_RODU.has(L.rod)) rod.appendChild(prvek("p", null, t("bezRodu", {a: jmenoL(L), druh: REJSTRIK.rr[L.rod]}))); });
    else if (v.typ === "izolat") [a, b].forEach(function(L){ if (L.rod === IZOLAT_R) rod.appendChild(prvek("p", null, t("izolatText", {a: jmenoL(L)}))); });
    else rod.appendChild(prvek("p", null, T.pribuzneNeText));
    [a, b].forEach(function(L){ if (L.rod !== IZOLAT_R) rod.appendChild(radekSrovnani(L, velke(REJSTRIK.rr[L.rod]))); });
  } else if (v.typ === "rodina") {
    rod.appendChild(prvek("p", "sr-verdikt", T.pribuzneAno));
    rod.appendChild(prvek("p", null, t("pribuzneRodina", {r: REJSTRIK.rr[a.rod]})));
  } else if (v.typ === "predek") {
    rod.appendChild(prvek("p", "sr-verdikt", T.pribuzneAno));
    rod.appendChild(prvek("p", null, v.koren ? t("pribuzneKoren", {r: REJSTRIK.rr[a.rod]}) : t("pribuzneSpolecny", {v: T.lang === "cs" && PD.vetve[PD.uzly[v.u]] ? nazevVetve(v.u, a.rod).toLowerCase() : nazevVetve(v.u, a.rod)})));
    const mini = prvek("div", "strom-mini");
    mini.appendChild(prvek("div", "sm-predek", nazevVetve(v.u, a.rod)));
    [[a, v.cestaA], [b, v.cestaB]].forEach(function(x){
      const L = x[0], cesta = x[1].map(function(u){ return nazevVetve(u, L.rod); });
      const kratka = cesta.length > 4 ? [cesta[0], "…", cesta[cesta.length - 2], cesta[cesta.length - 1]] : cesta;
      const sl = prvek("div", "sm-vetev"); sl.style.setProperty("--r-barva", barvaRole(L));
      kratka.forEach(function(n){ sl.appendChild(prvek("span", null, "↓ " + n)); });
      sl.appendChild(prvek("b", null, "↓ " + jmenoL(L)));
      mini.appendChild(sl);
    });
    rod.appendChild(mini);
    if (strom.ma(a.i)) {
      const tl = prvek("button", "tl-rodokmen"); tl.type = "button";
      tl.innerHTML = '<svg aria-hidden="true"><use href="#i-strom"/></svg>';
      tl.appendChild(document.createTextNode(T.stromObe));
      tl.addEventListener("click", function(){ strom.otevriPro(a.i); strom.zaostriNaDvojici(a.i, b.i); });
      rod.appendChild(tl);
    }
  } else rod.appendChild(prvek("p", null, T.pribuzneNevime));

  /* stavba: jen vlastnosti, které mají zapsané oba jazyky */
  const stavba = [];
  const ra = a.i >= 0 ? radek(a.i) : [], rb = b.i >= 0 ? radek(b.i) : [];
  if (ra[5] && rb[5]) {
    const stejne = prvek("ul", "vlastnosti"), jine = prvek("ul", "vlastnosti");
    PD.wals.forEach(function(kod, k){
      const x = +ra[5][k], y = +rb[5][k], popis = T.wals[kod];
      if (!x || !y || !popis || !popis[1][x - 1] || !popis[1][y - 1]) return;
      const li = prvek("li"); li.appendChild(prvek("b", null, popis[0]));
      if (x === y) { li.appendChild(prvek("span", null, bezOdkazuNaCtenare(popis[1][x - 1]))); stejne.appendChild(li); }
      else { li.appendChild(radekSrovnani(a, bezOdkazuNaCtenare(popis[1][x - 1]))); li.appendChild(radekSrovnani(b, bezOdkazuNaCtenare(popis[1][y - 1]))); jine.appendChild(li); }
    });
    if (stejne.children.length) { const o = oddil(T.spolecne); o.appendChild(stejne); stavba.push(o); }
    if (jine.children.length) { const o = oddil(T.rozdily); o.appendChild(jine); stavba.push(o); }
  }
  if (Array.isArray(ra[6]) && Array.isArray(rb[6])) {
    const o = oddil(T.hlasky);
    [[a, ra[6]], [b, rb[6]]].forEach(function(x){
      const h = x[1];
      let txt = t("hlaskyHodnota", {c: h[0], cs: tvar(h[0], T.souhlaska), v: h[1], vs: tvar(h[1], T.samohlaska)});
      if (h[2] > 0) txt += t("hlaskyTony", {t: h[2], ts: tvar(h[2], T.ton)});
      o.appendChild(radekSrovnani(x[0], txt));
    });
    stavba.push(o);
  }
  if (!stavba.length) stavba.push(prvek("p", "pozn", T.bezUdaju));

  /* čísla */
  const cisla = [];
  const mluvci = function(L){
    if (L.j) return pocetMluvcich(L.j.mlu);
    const r = radek(L.i);
    return Array.isArray(r[10]) ? lidi(r[10][0]) : r[8] > 0 ? lidi(r[8]) : "?";
  };
  const oM = oddil(T.mluvcich); [a, b].forEach(function(L){ oM.appendChild(radekSrovnani(L, mluvci(L))); }); cisla.push(oM);
  const va = a.i >= 0 ? vitalitaBodu(a.i) : -1, vb = b.i >= 0 ? vitalitaBodu(b.i) : -1;
  if (va >= 0 || vb >= 0) {
    const oVi = oddil(T.vitalita);
    [[a, va], [b, vb]].forEach(function(x){ oVi.appendChild(radekSrovnani(x[0], x[1] >= 0 ? T.aes[x[1]][0] : "?")); });
    cisla.push(oVi);
  }
  const statyA = (ra[3] || "").split(" ").filter(Boolean), statyB = (rb[3] || "").split(" ").filter(Boolean);
  const spolecneStaty = statyA.filter(function(k){ return statyB.indexOf(k) >= 0; });
  if (spolecneStaty.length) {
    const oS = oddil(T.spolecneStaty), ul = prvek("ul", "staty");
    spolecneStaty.slice(0, 12).forEach(function(k){ ul.appendChild(prvek("li", null, PD.staty[T.lang][k] || k)); });
    oS.appendChild(ul); cisla.push(oS);
  }
  zalozky([{nazev: T.zalozkaPribuznost, uzly: [rod]}, {nazev: T.zalozkaStavba, uzly: stavba}, {nazev: T.zalozkaCisla, uzly: cisla}]);

  const pata = prvek("div", "k-pata sr-pata");
  const zpet = prvek("button", "tl-rodokmen", t("zpetNa", {a: jmenoL(a)})); zpet.type = "button";
  zpet.addEventListener("click", zpetNaPrvni);
  const jiny = prvek("button", "tl-rodokmen", T.porovnatJiny); jiny.type = "button";
  jiny.addEventListener("click", function(){ zpetNaPrvni(); zacniSrovnani(); });
  pata.appendChild(zpet); pata.appendChild(jiny);
  kartaTelo.appendChild(pata);
}
/* ---------- Brána do jiných světů: vymyšlené jazyky z knih a filmů ----------
   Otevírá ji heslo „mellon“ (elfsky „přítel“, heslo Durinových dveří), odkaz #mellon nebo dlaždice z hledání.
   Glóbus se zmenší a zmizí, místo něj se ve hvězdách vznášejí vymyšlené světy s jazyky. Vymyšlený jazyk není
   „vybraný“ jako skutečný (vybrany zůstává null): nemá tečku, rodinu, vitalitu ani srovnání. */
let prechodBrany = false;
function svetVym(id){ return VYMYSLENE.svety.filter(function(s){ return s.id === id; })[0]; }
/* obrázky na koulích světů: vlastní kresby obecných motivů (čepele, elfský list, svítící rostliny, drak),
   žádné postavy, znaky ani loga z filmů – ty jsou chráněné autorským právem */
const OBRAZKY_SVETU = (function(){
const STIN = (id) => `<radialGradient id="st-${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>`;
function koule(id, pozadi, obsah, defs){
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img">
<defs><clipPath id="kr-${id}"><circle cx="100" cy="100" r="96"/></clipPath>${STIN(id)}${defs||""}</defs>
<g clip-path="url(#kr-${id})">${pozadi}${obsah}<circle cx="100" cy="100" r="96" fill="url(#st-${id})"/></g>
<circle cx="100" cy="100" r="95.5" fill="none" stroke="#fff" stroke-opacity=".18"/></svg>`;
}
const hvezdy = (n, seed, barva) => { let s = seed, o = ""; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; const x = s / 233280 * 200; s = (s * 9301 + 49297) % 233280; const y = s / 233280 * 110; o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + (i % 3) * 0.4).toFixed(1)}" fill="${barva}" opacity=".8"/>`; } return o; };

const QONOS = koule("qonos",
  `<rect width="200" height="200" fill="url(#qn-nebe)"/><ellipse cx="120" cy="70" rx="90" ry="45" fill="url(#qn-mlha)"/>${hvezdy(22, 7, "#ffd9cc")}
   <path d="M0 150 L22 118 L38 136 L58 96 L76 128 L96 104 L112 132 L134 92 L152 124 L170 106 L200 140 L200 200 L0 200Z" fill="#2a0906"/>
   <path d="M0 168 L30 146 L56 162 L84 140 L118 160 L150 142 L176 158 L200 150 L200 200 L0 200Z" fill="#170403"/>`,
  // dvě zkřížené zahnuté čepele – obecný válečnický motiv
  `<g transform="translate(100 104)" stroke="#1a0503" stroke-width="2" stroke-linejoin="round">
     <g transform="rotate(-35)"><path d="M-6 -58 C 14 -40 14 30 -6 52 C 4 30 4 -38 -6 -58Z" fill="url(#qn-kov)"/><rect x="-9" y="52" width="10" height="16" rx="3" fill="#5a1a10"/></g>
     <g transform="rotate(35) scale(-1 1)"><path d="M-6 -58 C 14 -40 14 30 -6 52 C 4 30 4 -38 -6 -58Z" fill="url(#qn-kov)"/><rect x="-9" y="52" width="10" height="16" rx="3" fill="#5a1a10"/></g>
   </g>`,
  `<linearGradient id="qn-nebe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0a07"/><stop offset=".6" stop-color="#8e2417"/><stop offset="1" stop-color="#d4502e"/></linearGradient>
   <radialGradient id="qn-mlha"><stop offset="0" stop-color="#ff9a6a" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a6a" stop-opacity="0"/></radialGradient>
   <linearGradient id="qn-kov" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4e6dc"/><stop offset="1" stop-color="#9a8a84"/></linearGradient>`);

const STREDOZEM = koule("stredozem",
  `<rect width="200" height="200" fill="url(#sz-nebe)"/><circle cx="150" cy="58" r="15" fill="#fff6c8" opacity=".9"/>
   <path d="M0 122 L34 70 L50 92 L78 48 L104 94 L122 76 L148 112 L200 96 L200 200 L0 200Z" fill="#7d8fa8"/>
   <path d="M78 48 L88 64 L80 62 L72 66Z M34 70 L42 82 L36 80 L28 84Z" fill="#fff"/>
   <path d="M0 140 C 40 118 70 134 100 124 C 132 114 160 132 200 120 L200 200 L0 200Z" fill="#4f8a32"/>
   <path d="M0 162 C 50 146 90 170 130 154 C 160 142 180 154 200 150 L200 200 L0 200Z" fill="#2f6a22"/>
   <g transform="translate(128 96)"><rect x="-5" y="0" width="10" height="34" fill="#e9e2cf"/><path d="M-8 0 L0 -14 L8 0Z" fill="#6b4c8a"/><rect x="-1.5" y="10" width="3" height="5" fill="#34405a"/></g>`,
  // elfský list
  `<g transform="translate(62 118) rotate(-25)"><path d="M0 -34 C 22 -18 22 18 0 36 C -22 18 -22 -18 0 -34Z" fill="url(#sz-list)" stroke="#e9f7c0" stroke-width="1.5"/>
     <path d="M0 -30 L0 40 M0 -12 L10 -20 M0 -12 L-10 -20 M0 4 L12 -4 M0 4 L-12 -4 M0 20 L10 12 M0 20 L-10 12" stroke="#e9f7c0" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`,
  `<linearGradient id="sz-nebe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0e8"/><stop offset="1" stop-color="#e7f3c8"/></linearGradient>
   <linearGradient id="sz-list" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9e07a"/><stop offset="1" stop-color="#4f9a2f"/></linearGradient>`);

const PANDORA = koule("pandora",
  `<rect width="200" height="200" fill="url(#pd-nebe)"/>${hvezdy(18, 3, "#bff9ff")}
   <g fill="#0c3a4a"><path d="M40 60 C 60 50 88 52 92 62 C 86 74 70 86 58 84 C 50 80 44 70 40 60Z"/><path d="M120 40 C 140 34 164 38 168 46 C 162 58 146 64 136 62 C 128 58 122 50 120 40Z"/></g>
   <path d="M62 84 L60 100 M146 62 L148 80" stroke="#8ff5ff" stroke-width="1.5" opacity=".6"/>
   <path d="M0 150 C 40 136 70 150 110 140 C 150 130 176 146 200 138 L200 200 L0 200Z" fill="#06283a"/>`,
  // svítící rostliny a poletující semínka
  `<g stroke-linecap="round" fill="none">
     <path d="M70 200 C 66 170 78 150 70 128" stroke="#1fd0c8" stroke-width="4"/>
     <path d="M104 200 C 110 168 96 150 106 118" stroke="#1fd0c8" stroke-width="5"/>
     <path d="M140 200 C 136 176 148 162 142 142" stroke="#1fd0c8" stroke-width="4"/></g>
   <g fill="url(#pd-zar)"><circle cx="70" cy="126" r="11"/><circle cx="106" cy="114" r="14"/><circle cx="142" cy="140" r="10"/></g>
   <g fill="#e6ffe0"><circle cx="70" cy="126" r="3.5"/><circle cx="106" cy="114" r="4.5"/><circle cx="142" cy="140" r="3.2"/></g>
   <g fill="#d6fff2" opacity=".9"><circle cx="86" cy="94" r="1.8"/><circle cx="124" cy="88" r="1.5"/><circle cx="96" cy="76" r="1.2"/><circle cx="160" cy="112" r="1.6"/><circle cx="50" cy="108" r="1.4"/></g>`,
  `<linearGradient id="pd-nebe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#062a44"/><stop offset=".7" stop-color="#0d6d78"/><stop offset="1" stop-color="#23b3a8"/></linearGradient>
   <radialGradient id="pd-zar"><stop offset="0" stop-color="#b8fff0"/><stop offset=".5" stop-color="#3be0d0" stop-opacity=".8"/><stop offset="1" stop-color="#3be0d0" stop-opacity="0"/></radialGradient>`);

const ESSOS = koule("essos",
  `<rect width="200" height="200" fill="url(#es-nebe)"/><circle cx="58" cy="70" r="20" fill="#fff1c2" opacity=".95"/>
   <path d="M0 136 C 30 120 60 128 90 138 C 120 148 150 122 200 130 L200 200 L0 200Z" fill="#d99b52"/>
   <path d="M0 160 C 40 146 80 166 120 156 C 150 148 176 158 200 152 L200 200 L0 200Z" fill="#b8763a"/>
   <path d="M0 182 C 50 172 100 188 150 176 C 170 172 186 176 200 174 L200 200 L0 200Z" fill="#8f5526"/>`,
  // obecný drak
  `<g transform="translate(118 86) rotate(-8)" fill="#3a1a0c">
     <path d="M-40 6 C -24 0 -10 2 0 4 C 14 6 26 2 36 -6 L42 -4 L34 4 C 26 12 12 14 0 12 C -14 10 -28 12 -44 18 C -52 22 -60 20 -64 14 C -56 16 -48 12 -40 6Z"/>
     <path d="M-8 4 C -16 -18 -30 -32 -48 -38 C -40 -28 -40 -22 -44 -16 C -34 -18 -26 -12 -24 -4 C -18 -10 -10 -6 -8 4Z"/>
     <path d="M8 4 C 6 -20 16 -40 32 -50 C 28 -38 30 -30 36 -24 C 26 -24 22 -16 22 -6 C 16 -10 10 -4 8 4Z"/>
     <path d="M36 -6 L46 -12 L44 -4 L50 -2 L42 2Z"/></g>`,
  `<linearGradient id="es-nebe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2b25a"/><stop offset=".7" stop-color="#ffdca0"/><stop offset="1" stop-color="#ffe9c0"/></linearGradient>`);
  return {qonos: QONOS, stredozem: STREDOZEM, pandora: PANDORA, essos: ESSOS};
})();
function postavBranu(){
  const el = $("brana-svety"); el.textContent = "";
  const zeme = prvek("button", "svet zeme"); zeme.type = "button";
  zeme.appendChild(prvek("span", "koule"));
  zeme.appendChild(prvek("b", null, T.branaZeme));
  zeme.appendChild(prvek("small", null, t("branaZemePocet", {n: cislo(POCET_B)})));
  zeme.addEventListener("click", function(){ zavriBranu(); });
  el.appendChild(zeme);
  VYMYSLENE.svety.forEach(function(sv, k){
    const d = prvek("div", "svet"); d.dataset.svet = sv.id;
    d.style.setProperty("--k1", sv.barva[0]); d.style.setProperty("--k2", sv.barva[1]); d.style.setProperty("--k3", sv.barva[2]);
    d.style.setProperty("--i", k);
    const koule = prvek("span", "koule");
    if (OBRAZKY_SVETU[sv.id]) { koule.classList.add("obrazek"); koule.innerHTML = OBRAZKY_SVETU[sv.id]; koule.firstChild.setAttribute("aria-hidden", "true"); }
    d.appendChild(koule);
    d.appendChild(prvek("b", null, sv[T.lang].nazev));
    const jz = prvek("div", "svet-jazyky");
    VYMYSLENE.jazyky.filter(function(j){ return j.svet === sv.id; }).forEach(function(j){
      const b = prvek("button", null, j[T.lang].nazev); b.type = "button"; b.dataset.id = j.id;
      b.setAttribute("aria-pressed", vymysleny === j.id ? "true" : "false");
      b.addEventListener("click", function(){ ukazVymysleny(j.id); });
      jz.appendChild(b);
    });
    d.appendChild(jz); el.appendChild(d);
  });
}
function otevriBranu(){
  if (strom && strom.zapnuto) strom.prepni(false);
  if (eu) ukonciEU(true);
  zrusCekani();
  if (vybrany || srovnani) odznac();
  schovejUkazatel(true); okno.hidden = true; bublinaBod.hidden = true;
  if (brana) return;
  brana = true; prechodBrany = true;
  postavBranu();
  $("brana").hidden = false; scena.classList.add("rezim-brana");
  setTimeout(function(){ prechodBrany = false; }, 1000);         // glóbus dojede do dálky, pak se přestane kreslit
  zapisOdkaz();
  if (!desktop.matches && window.scrollY > 40) window.scrollTo({top: 0, behavior: bezPohybu.matches ? "auto" : "smooth"});
}
function zavriBranu(tise){
  if (!brana) return;
  brana = false; prechodBrany = false;
  $("brana").hidden = true; scena.classList.remove("rezim-brana");
  if (vymysleny) { vymysleny = null; karta.hidden = true; delete karta.dataset.jazyk; }
  if (globusOk && ctx) { potrebaKresli = true; teckyZmeneny = true; popiskyZmeneny = true; ozivit(); }
  if (!tise) zapisOdkaz();
}
$("brana-zpet").addEventListener("click", function(){ zavriBranu(); });
document.addEventListener("keydown", function(e){ if (e.key === "Escape" && brana && !vymysleny) zavriBranu(); });
function ukazVymysleny(id){
  const j = VYMYSLENE.jazyky.filter(function(x){ return x.id === id; })[0];
  if (!j) return;
  const tj = j[T.lang], sv = svetVym(j.svet), ts = sv[T.lang];
  vymysleny = id;
  const klic = "v:" + id, novy = karta.dataset.jazyk !== klic;
  if (novy) zalozkaVybrana = 0;
  karta.dataset.jazyk = klic;
  otevriKartu("#6B3FB8", "#FFFFFF", novy);
  kartaHero.classList.add("vymysleny");
  $("k-porovnat").hidden = true;
  $("k-cesta").hidden = true;                // rodokmen předchozího jazyka k vymyšlenému nepatří
  $("k-plne").hidden = false;
  $("k-kod").textContent = "✦ " + T.vymyslenyJazyk; $("k-kod").classList.remove("sour");
  $("k-nazev").textContent = tj.nazev;
  $("k-domaci").textContent = j.domaci ? t("domaciJmeno", {x: j.domaci}) : "";
  const od = $("k-odznak"); od.hidden = false; od.textContent = tj.dilo;
  const pz = $("k-pozdrav"); pz.textContent = j.pozdrav; pz.style.fontSize = j.pozdrav.length > 12 ? "1.85rem" : ""; pz.removeAttribute("lang");
  $("k-prepis").textContent = t("vyslovnost", {x: tj.vyslovnost});
  tlPrehraj.hidden = true;
  stitek(T.svet, ts.nazev);
  stitek(T.autorJazyka, j.autor);
  const fakt = prvek("section", "fakt-oddil"); fakt.appendChild(prvek("p", "fakt", tj.fakt));
  const vyznam = oddil(T.vyznamPozdravu); vyznam.appendChild(prvek("p", null, tj.vyznam));
  const svet = oddil(ts.nazev); svet.appendChild(prvek("p", null, ts.popis));
  zalozky([{nazev: T.zalozkaZajimavost, uzly: [fakt, vyznam, svet]}]);
  Array.prototype.forEach.call(document.querySelectorAll(".svet-jazyky button"), function(b){ b.setAttribute("aria-pressed", b.dataset.id === id ? "true" : "false"); });
  velikostKarty("");
  zapisOdkaz();
}
function tlacitkoRodokmenu(i){
  if (!strom.ma(i)) return null;
  const b = prvek("button", "tl-rodokmen");
  b.type = "button";
  b.innerHTML = '<svg aria-hidden="true"><use href="#i-strom"/></svg>';
  b.appendChild(document.createTextNode(T.stromUkazat));
  b.addEventListener("click", function(){ strom.otevriPro(i); });
  return b;
}
prectiOdkaz();                              // otevřeno přes odkaz na jazyk
if (!globusOk) {
  [platno, podklad, platnoGl, platnoPopisky].forEach(function(c){ c.hidden = true; });
  $("hud").hidden = true; $("napoveda").hidden = true; $("vypadek").hidden = false; }
})();
