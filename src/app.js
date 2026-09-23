/* Atlas jazyků – glóbus, police jazyků a karty. Build sem vkládá data i texty rozhraní. */
(function(){
"use strict";
const UI = /*__UI__*/null;             // texty rozhraní obou jazyků {cs, en}
const VYCHOZI = /*__VYCHOZI__*/"cs";   // jazyk, ve kterém stránka startuje
const ARTEFAKT = /*__ARTEFAKT__*/false;
const SVET = /*__SVET__*/null;
const JAZYKY = /*__JAZYKY__*/null;
const STATY_VSE = /*__STATY__*/null;
const REJSTRIK = /*__REJSTRIK__*/null;
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
  bHledat[i] = bezDiakritiky(B[i][0] + " " + (radek(i)[9] || ""));
  const sk = radek(i)[2];
  if (sk >= 0) { if (!sourozenci.has(sk)) sourozenci.set(sk, []); sourozenci.get(sk).push(i); }
}
const BOD_ATLASU = {};                            // jazyk z atlasu → jeho tečka v rejstříku
for (let i = POCET_B - 1; i >= 0; i--) if (B[i][5]) BOD_ATLASU[B[i][5]] = i;
/* ---------- znakové jazyky: všechny / bez nich / jen ony ---------- */
const ZNAKOVY = new Uint8Array(POCET_B);
REJSTRIK.zn.forEach(function(i){ ZNAKOVY[i] = 1; });
const skryty = new Uint8Array(POCET_B);   // tečka, kterou filtr schovává
let rezimZnak = "vse", povolenych = POCET_B;
function jeZnakovyJazyk(j){ const i = BOD_ATLASU[j.id]; return i >= 0 && ZNAKOVY[i] === 1; }
/* vitalita: 0–5 = šest stupňů UNESCO (bezpečný … vymřelý), 6 = probouzený, -1 = bez údaje */
const VSECHNY_STUPNE = [0, 1, 2, 3, 4, 5, 6, -1], OHROZENE = [1, 2, 3, 4];
let povoleneStupne = new Set(VSECHNY_STUPNE);
let barvitVitalitu = false;              // tečky v barvách vitality, dokud je otevřený panel „Vitalita“
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
function nadpis(text, barva){
  const h3 = document.createElement("h3");
  if (barva) { const s = document.createElement("span"); s.className = "tecka"; s.style.background = barva; h3.appendChild(s); }
  h3.appendChild(document.createTextNode(text));
  return h3;
}
function postavPolici(filtr){
  const hledane = bezDiakritiky(filtr || "").trim();
  seznam.textContent = "";
  let vAtlasu = 0;
  SKUPINY.forEach(function(sk){
    const jazyky = JAZYKY.filter(function(j){ return j.sk === sk && !atlasSkryty(j) && (!hledane || j.hledat.indexOf(hledane) !== -1); });
    if (!jazyky.length) return;
    vAtlasu += jazyky.length;
    const sekce = document.createElement("section"); sekce.className = "rodina";
    sekce.appendChild(nadpis(T.rodiny[sk] + " (" + jazyky.length + ")", "var(--r-" + sk + ")"));
    const mrizka = document.createElement("div"); mrizka.className = "mrizka";
    jazyky.forEach(function(j){
      const tl = tlacitko(j.n, j.pis, "var(--r-" + j.sk + ")");
      tl.dataset.id = j.id;
      tl.setAttribute("aria-pressed", vybrany && vybrany.typ === "atlas" && vybrany.id === j.id ? "true" : "false");
      tl.addEventListener("click", function(){ vyber(j.id); });
      mrizka.appendChild(tl);
    });
    sekce.appendChild(mrizka); seznam.appendChild(sekce);
  });

  let vRejstriku = 0;
  const vsechnyZnakove = rezimZnak === "jen" && hledane.length < 2;   // „jen znakové“ bez hledání: ukážu je všechny
  if (hledane.length >= 2 || vsechnyZnakove) {
    const nalez = [], max = vsechnyZnakove ? POCET_B : 80;
    for (let i = 0; i < POCET_B && nalez.length < max; i++) {
      if (!B[i][5] && !skryty[i] && (vsechnyZnakove || bHledat[i].indexOf(hledane) !== -1)) nalez.push(i);
    }
    if (vsechnyZnakove) nalez.sort(function(a, b){ return jmenoBodu(a).localeCompare(jmenoBodu(b), T.locale); });
    vRejstriku = nalez.length;
    if (vRejstriku) {
      const sekce = document.createElement("section"); sekce.className = "rodina";
      sekce.appendChild(nadpis((vsechnyZnakove ? T.znakoveSeznam : T.rejstrik) + " (" + vRejstriku + (vRejstriku >= max ? "+" : "") + ")", null));
      const mrizka = document.createElement("div"); mrizka.className = "mrizka";
      nalez.forEach(function(i){
        const tl = tlacitko(jmenoBodu(i), REJSTRIK.rr[B[i][3]], null, "tecka-jaz");
        tl.addEventListener("click", function(){ vyberBod(i); });
        mrizka.appendChild(tl);
      });
      sekce.appendChild(mrizka); seznam.appendChild(sekce);
    }
  }
  if (!vAtlasu && !vRejstriku) {
    const p = document.createElement("p"); p.className = "prazdno"; p.textContent = T.nicNenalezeno; seznam.appendChild(p);
  }
  $("pocet").textContent = hledane
    ? t("nalezeno", {a: vAtlasu}) + (vRejstriku ? t("nalezenoRejstrik", {b: vRejstriku}) : "")
    : (function(){ const a = JAZYKY.filter(function(j){ return !atlasSkryty(j); }).length;
        return t("vychoziPocet", {a: cislo(a) + " " + tvar(a, T.jazyk), b: cislo(povolenych)}); })();
}
$("hledej").addEventListener("input", function(e){ postavPolici(e.target.value); });

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
let sirka = 0, vyska = 0, polomer = 0, polomerZaklad = 0, zoom = 1, dpr = 1;
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
   "r-ie", "r-st", "r-an", "r-afro", "r-nk", "r-ost"].forEach(function(k){ barvy[k] = s.getPropertyValue("--" + k).trim(); });
}

const fJaz = new Float32Array(POCET_B), zakladJaz = new Float32Array(POCET_B);   // příznaky teček: 0 obyčejná, 1 vybraná, 2 příbuzná, 3 pod myší

/* ---------- WebGL ---------- */
let gl = null, glProg = null, glU = {}, glA = {}, glJaz = null;
/* příznak tečky: 0 obyčejná, 1 vybraná, 2 příbuzná, 3 pod myší, 4 schovaná filtrem, 5 v zvýrazněné zemi */
const VS = [
  "attribute vec2 a_pos; attribute float a_flag; attribute float a_vit;",
  "uniform float u_l0, u_sf0, u_cf0, u_r, u_dpr, u_jadro, u_barvit;",
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
  "  v_barva = vec4(b.rgb, b.a * (0.3 + 0.7 * z));",
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
  ["u_l0", "u_sf0", "u_cf0", "u_r", "u_dpr", "u_stred", "u_rozliseni", "u_b", "u_vel", "u_mek", "u_jadro", "u_barvit", "u_vit"]
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
    vel: denni ? [0.62, 1.9, 1.6, 2, 0, 1.3] : [1, 2.6, 2.1, 2.8, 0, 1.9],
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
  gl.uniform2f(glU.u_stred, sirka / 2 + posun, vyska / 2); gl.uniform2f(glU.u_rozliseni, sirka, vyska);
  const b = new Float32Array(24);
  n.barvy.forEach(function(x, k){ const c = rgb(x[0]); b.set([c[0], c[1], c[2], x[1]], k * 4); });
  gl.uniform4fv(glU.u_b, b);
  gl.uniform1fv(glU.u_vel, n.vel.map(function(k){ return k * v.jaz; }));
  gl.uniform1fv(glU.u_mek, n.mek);
  const vit = new Float32Array(32);
  barvyVitality().forEach(function(x, k){ const c = rgb(x); vit.set([c[0], c[1], c[2], 0.95], k * 4); });
  gl.uniform4fv(glU.u_vit, vit);
  gl.uniform1f(glU.u_barvit, barvitVitalitu ? 1 : 0);
  gl.uniform1f(glU.u_jadro, denni ? 0.35 : (barvitVitalitu ? 0.4 : 0.85));
  /* světélka jazyků: v noci se sčítají, takže hustá místa září víc; ve dne (a při barvení podle vitality,
     kde musí barva zůstat pravdivá) se kreslí obyčejně */
  if (denni || barvitVitalitu) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); else gl.blendFunc(gl.ONE, gl.ONE);
  gl.bindBuffer(gl.ARRAY_BUFFER, glJaz.poz); gl.enableVertexAttribArray(glA.pos); gl.vertexAttribPointer(glA.pos, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, glJaz.flag); gl.enableVertexAttribArray(glA.flag); gl.vertexAttribPointer(glA.flag, 1, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, glJaz.vit); gl.enableVertexAttribArray(glA.vit); gl.vertexAttribPointer(glA.vit, 1, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, glJaz.n);
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
  polomerZaklad = Math.max(40, Math.min(sirka, vyska) / 2 - 22);
  spoctiPosun(); posun = posunCil;
  uplatniZoom();
}
let zobrazenyZoom = "";
function uplatniZoom(){
  polomer = polomerZaklad * zoom;
  proj.scale(polomer).translate([sirka / 2 + posun, vyska / 2]);
  potrebaKresli = true;
  const txt = cislo(zoom, 1) + "×";
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
  const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.15, cx, cy, r);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, barvy["stin-koule"]);
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.283185); c.fill();
}
function kresliUzemi(c){                    /* území vybraného jazyka barvou jeho rodiny */
  if (zeme) {                               /* zvýrazněná země */
    c.beginPath(); cestaPodklad(zeme.f);
    c.globalAlpha = 0.16; c.fillStyle = barvy.cyan; c.fill(); c.globalAlpha = 0.8;
    c.lineWidth = 1.6; c.strokeStyle = barvy.cyan; c.stroke(); c.globalAlpha = 1;
  }
  if (!vybrany || vybrany.typ !== "atlas") return;
  const barva = barvaVyberu();
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
}
function kresliKouli(c, cx, cy, r){
  let g = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.36);
  g.addColorStop(0, barvy.atmosfera); g.addColorStop(0.35, barvy.atmosfera2); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.36, 0, 6.283185); c.fill();
  g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, barvy.koule1); g.addColorStop(1, barvy.koule2);
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.283185); c.fill();
  c.beginPath(); c.arc(cx, cy, r, 0, 6.283185); c.strokeStyle = barvy["okraj-koule"]; c.lineWidth = 1.2; c.stroke();
}
function kresliPodklad(){
  const c = ctxPodklad, cx = sirka / 2 + posun, cy = vyska / 2, r = polomer;
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
  c.beginPath(); cestaPodklad(sit); c.strokeStyle = barvy.sit; c.stroke();
  c.beginPath(); cestaPodklad(SOUS); c.fillStyle = barvy.pevnina; c.fill();
  kresliUzemi(c);
  if (zoom >= 1.4) {                   /* hranice států až při přiblížení – z dálky by jen rušily */
    c.beginPath(); ZEME.forEach(function(f){ cestaPodklad(f); });
    c.strokeStyle = "rgba(" + barvy.hranice + "," + Math.min(0.4, (zoom - 1.4) * 0.14).toFixed(3) + ")"; c.lineWidth = 0.8; c.stroke();
  }
  c.beginPath(); cestaPodklad(SOUS); c.strokeStyle = barvy.pobrezi; c.lineWidth = 0.9; c.stroke();
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
  if (!popiskyZapnute) return;
  const vsechny = zoom >= POPISKY_OD;
  if (!vsechny && !dulezite.length) return;
  const vel = Math.min(11.5, 9.5 + Math.max(0, zoom - POPISKY_OD) * 0.4);
  const k = vel / 10, vys = vel + 3, rb = velikosti().jaz * 0.25;
  const cw = Math.ceil(sirka / BUNKA) + 1, ch = Math.ceil(vyska / BUNKA) + 1;
  if (obsazeno.length < cw * ch) obsazeno = new Uint8Array(cw * ch); else obsazeno.fill(0, 0, cw * ch);
  umisteno.length = 0;
  const zkus = function(i, vetsi){
    if (!bVid[i]) return;
    const kk = vetsi ? k * 1.18 : k, w = sirka10[i] * kk, x = bPx[i] + (vetsi ? 23 : rb + 4), y = bPy[i];
    if (x < 2 || y < vys || y > vyska - vys || x + w > sirka - 2) return;
    const x0 = Math.max(0, ((bPx[i] - rb - 2) / BUNKA) | 0), x1 = ((x + w + 3) / BUNKA) | 0;
    const y0 = ((y - vys / 2) / BUNKA) | 0, y1 = ((y + vys / 2) / BUNKA) | 0;
    for (let yy = y0; yy <= y1; yy++) { const r = yy * cw; for (let xx = x0; xx <= x1; xx++) if (obsazeno[r + xx]) return; }
    for (let yy = y0; yy <= y1; yy++) { const r = yy * cw; for (let xx = x0; xx <= x1; xx++) obsazeno[r + xx] = 1; }
    umisteno.push(i, x, y, vetsi ? 1 : 0);
  };
  dulezite.forEach(function(i, n){ zkus(i, n === 0 && zakladJaz[i] === 1); });
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
  const cx = sirka / 2 + posun, cy = vyska / 2;
  let n = 0;
  for (let i = 0; i < POCET_B; i++) {
    if (skryty[i]) { bVid[i] = 0; continue; }
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
  return cislo(Math.abs(lat), 1) + "° " + T.strany[lat >= 0 ? 0 : 1] + " · " + cislo(Math.abs(lon), 1) + "° " + T.strany[lon >= 0 ? 2 : 3];
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
  if (!(u0 >= 0)) return [];
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
  const c = ctx, cx = sirka / 2 + posun, cy = vyska / 2;
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
  oblouky.forEach(function(body, k){
    promitni(body[0], p); promitni(body[body.length - 1], q);
    const gr = c.createLinearGradient(p[0], p[1], q[0], q[1]);
    gr.addColorStop(0, vb); gr.addColorStop(1, barvy.fialova);
    [[6, 0.16], [1.6, 0.95]].forEach(function(s){
      c.beginPath();
      let kresli = false;
      for (let n = 0; n < body.length; n++) {
        const vid = promitni(body[n], p);
        if (vid) { if (kresli) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
        kresli = vid;
      }
      c.globalAlpha = s[1]; c.lineWidth = s[0]; c.strokeStyle = gr; c.lineCap = "round"; c.stroke();
    });
    c.globalAlpha = 1;
    if (!bezPohybu.matches) {
      const f = ((cas * 0.00042) + k * 0.19) % 1, b = body[Math.floor(f * (body.length - 1))];
      if (promitni(b, p)) { c.globalCompositeOperation = skladani; c.drawImage(SVETLA.bila, p[0] - 10, p[1] - 10, 20, 20); c.globalCompositeOperation = "source-over"; }
    }
  });

  if (vybrany) {                        /* zaměřovač na vybraném místě */
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
  return pulsDo > cas || (cas < zivoDo && oblouky.length > 0);
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
  if (zeme) zeme.body.forEach(function(i){ if (!zakladJaz[i]) zakladJaz[i] = 5; });
  for (let i = 0; i < POCET_B; i++) if (skryty[i]) zakladJaz[i] = 4;
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
    proj.rotate(rot).translate([sirka / 2 + posun, vyska / 2]).scale(polomer);
    spocitejBody(); kresliPodklad(); obnovHud();
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
  if (bezPohybu.matches) { rot = cil; zoom = zc; uplatniZoom(); pulsDo = performance.now() + 2600; return; }
  prechod = {z: rot.slice(), k: cil, z2: zoom, k2: zc, zac: performance.now(), delka: 1100};
}
let posledni = 0, popredBezelo = true;
function smycka(cas){
  requestAnimationFrame(smycka);
  let zmena = potrebaKresli;
  const dt = Math.min(64, cas - (posledni || cas));
  if (prechod) {
    const k = Math.min(1, (cas - prechod.zac) / prechod.delka), e = plynule(k);
    rot = [prechod.z[0] + (prechod.k[0] - prechod.z[0]) * e, prechod.z[1] + (prechod.k[1] - prechod.z[1]) * e];
    if (prechod.k2 !== prechod.z2) { zoom = prechod.z2 * Math.pow(prechod.k2 / prechod.z2, e); uplatniZoom(); }
    if (k >= 1) { const let2 = prechod.delka > 500; prechod = null; if (let2) pulsDo = cas + 2600; }
    zmena = true;
  } else if (autoOtaceni && !tahne) {
    rot[0] = (rot[0] + dt * 0.006 / zoom) % 360;
    zmena = true;
  }
  if (Math.abs(posunCil - posun) > 0.5) {
    posun = bezPohybu.matches ? posunCil : posun + (posunCil - posun) * Math.min(1, dt / 160);
    zmena = true;
  } else if (posun !== posunCil) { posun = posunCil; zmena = true; }
  posledni = cas;
  potrebaKresli = false;
  kresliVse(cas, zmena);
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
    if (pinch && prsty.size >= 2) { const d = vzdalenostPrstu(); if (d > 0 && pinch.d > 0) nastavZoom(pinch.zoom * d / pinch.d); return; }
    ozivit();
    if (!start) { if (!prsty.size) najedNaBod(e); return; }
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    start.posun = Math.max(start.posun, Math.abs(dx) + Math.abs(dy));
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
  platno.addEventListener("pointerleave", function(){
    nastavZvyrazneni(-1);
    $("bublina-bod").hidden = true;
  });
  platno.addEventListener("wheel", function(e){
    e.preventDefault(); ozivit();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    nastavZoom(zoom * Math.exp(-d * 0.0015));
  }, {passive: false});
  platno.addEventListener("dblclick", function(e){
    const r = platno.getBoundingClientRect();
    const bod = proj.invert([e.clientX - r.left, e.clientY - r.top]);
    if (bod && !isNaN(bod[0])) letKe(bod, zoom * 2);
  });
  $("tl-priblizi").addEventListener("click", function(){ plynulyZoom(zoom * 1.6); });
  $("tl-oddal").addEventListener("click", function(){ plynulyZoom(zoom / 1.6); });
  document.addEventListener("keydown", function(e){
    const c = e.target;
    if (c && (c.tagName === "INPUT" || c.tagName === "TEXTAREA")) return;
    if (e.key === "+" || e.key === "=") plynulyZoom(zoom * 1.6);
    else if (e.key === "-" || e.key === "_") plynulyZoom(zoom / 1.6);
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
function zvyrazniZemi(f){
  if (vybrany) { vybrany = null; $("karta").hidden = true; oznacTlacitka(null); }
  zeme = {f: f, body: bodyVeStatu(f.properties.name) || []};
  const s = d3.geoCentroid(f);
  obnovPriznaky(); spoctiPosun(); zapisOdkaz();
  letKe(s, zoomProTvar(f.geometry, s));
  $("tl-cely").hidden = false; ozivit();
}
function zhasniZemi(){ if (!zeme) return; zeme = null; if (globusOk) obnovPriznaky(); }
function klikDoMapy(e){
  const r = platno.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  const i = nejblizsiBod(mx, my, 11);
  if (i >= 0) { okno.hidden = true; vyberBod(i); return; }
  const bod = proj.invert([mx, my]);
  if (!bod || isNaN(bod[0])) { okno.hidden = true; return; }
  let nalezena = null;
  for (let k = 0; k < ZEME.length; k++) { if (d3.geoContains(ZEME[k], bod)) { nalezena = ZEME[k]; break; } }
  if (!nalezena) { okno.hidden = true; return; }
  ukazOknoZeme(nalezena);
  okno.hidden = false;
  umisti(okno, e);
}
function ukazOknoZeme(f){
  const zde = (V_ZEMI[f.properties.name] || []).filter(function(j){ return !atlasSkryty(j); });
  const body = bodyVeStatu(f.properties.name);
  okno.textContent = "";
  okno.appendChild(prvek("h4", null, nazevZeme(f.properties.name)));
  if (body && body.length) {
    okno.appendChild(prvek("p", "zeme-pocet", t("zemeRejstrik", {n: cislo(body.length) + " " + tvar(body.length, T.jazyk)})));
    const sviti = zeme && zeme.f === f;
    const b = prvek("button", "zeme-tl", sviti ? T.zemeZhasnout : tx("zemeRozsvitit"));
    b.type = "button";
    b.addEventListener("click", function(){
      if (zeme && zeme.f === f) { zhasniZemi(); $("tl-cely").hidden = !vybrany; zapisOdkaz(); } else zvyrazniZemi(f);
      ukazOknoZeme(f);
    });
    okno.appendChild(b);
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
  ozivit(); zapisOdkaz();
  if (autoOtaceni) nastavOtaceni(false);   // vybraný jazyk ať neujíždí z očí
  okno.hidden = true; bublinaBod.hidden = true;
  if (globusOk) { spoctiPosun(); letKe(vybrany.stred, cilZoom); }
  $("tl-cely").hidden = false;
  $("napoveda").textContent = tx("napovedaVyber");
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
  zeme = null;
  vybrany = {typ: "atlas", id: j.id, sk: j.sk, zeme: j.zeme, ob: j.ob, stred: j.stred,
             pribuzni: BOD_ATLASU[j.id] >= 0 ? pribuzniBodu(BOD_ATLASU[j.id], true, 6) : []};
  if (globusOk) obnovPriznaky();
  ukazKartu(j);
  poVyberu(globusOk ? zoomProJazyk(j) : 1);
  oznacTlacitka(id);
  const tl = document.querySelector('.jaz[data-id="' + id + '"]');
  if (tl) tl.scrollIntoView({block: "center", behavior: bezPohybu.matches ? "auto" : "smooth"});
}
function vyberBod(i){
  if (B[i][5] && PODLE_ID[B[i][5]]) { vyber(B[i][5]); return; }
  zeme = null;
  vybrany = {typ: "rejstrik", i: i, zeme: [], ob: [], stred: [B[i][1], B[i][2]], pribuzni: pribuzniBodu(i, false, 6)};
  if (globusOk) obnovPriznaky();
  ukazKartuBodu(i);
  poVyberu(Math.max(zoom, 2.6));
  oznacTlacitka(null);
}
function odznac(){
  vybrany = null; zeme = null; prechod = null; ozivit(); zapisOdkaz();
  $("karta").hidden = true; $("tl-cely").hidden = true;
  if (globusOk) { obnovPriznaky(); spoctiPosun(); plynulyZoom(1); }
  okno.hidden = true; bublinaBod.hidden = true;
  $("napoveda").textContent = T.napovedaStart;
  oznacTlacitka(null);
}
$("tl-cely").addEventListener("click", odznac);
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
    }
  }
  if (zeme) zeme.body = bodyVeStatu(zeme.f.properties.name) || [];
  okno.hidden = true; bublinaBod.hidden = true;
  obnovLegendu();
  if (start) return;                        // při startu se police a glóbus postaví samy
  postavPolici($("hledej").value);
  if (vybrany && vybrany.typ === "atlas") oznacTlacitka(vybrany.id);
  if (globusOk && ctx) { if (zvyraznenyBod >= 0 && skryty[zvyraznenyBod]) zvyraznenyBod = -1; obnovPriznaky(); hudTxt2 = ""; ozivit(); }
}
function nastavZnakove(rezim, ulozit){
  if (["vse", "bez", "jen"].indexOf(rezim) < 0) rezim = "vse";
  rezimZnak = rezim;
  tlZnak.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.znak === rezim ? "true" : "false"); });
  if (ulozit) { try { localStorage.setItem("atlas-znakove", rezim); } catch (e) {} }
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
  tlVit.setAttribute("aria-pressed", filtruje || !panelVit.hidden ? "true" : "false");
}
function nastavVitalitu(stupne, start){
  povoleneStupne = new Set(stupne.filter(function(v){ return VSECHNY_STUPNE.indexOf(v) >= 0; }));
  if (!start) { try { localStorage.setItem("atlas-vitalita", JSON.stringify(Array.from(povoleneStupne))); } catch (e) {} }
  obnovVitalituPanel();
  uplatniFiltry(!!start);
}
function otevriVitalitu(otevrit){
  panelVit.hidden = !otevrit;
  tlVit.setAttribute("aria-expanded", otevrit ? "true" : "false");
  barvitVitalitu = !!otevrit;
  obnovVitalituPanel(); obnovLegendu();
  teckyZmeneny = true; ozivit();
}
tlVit.addEventListener("click", function(){ otevriVitalitu(panelVit.hidden); });
$("vitalita-zavrit").addEventListener("click", function(){ otevriVitalitu(false); tlVit.focus(); });
$("vitalita-vse").addEventListener("click", function(){ nastavVitalitu(VSECHNY_STUPNE); });
$("vitalita-ohrozene").addEventListener("click", function(){ nastavVitalitu(OHROZENE); });
document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !panelVit.hidden) otevriVitalitu(false); });

/* ---------- popisek dole na glóbu: podle filtru a barvení ---------- */
function obnovLegendu(){
  const el = document.querySelector("#legenda span");
  if (barvitVitalitu) el.textContent = tx("legendaVitalita");
  else if (povolenych < POCET_B) el.textContent = t("legendaFiltr", {n: cislo(povolenych), m: cislo(POCET_B)});
  else el.textContent = tx("legenda");
}

/* ---------- odkaz na jazyk: #cs (jazyk z atlasu) nebo #corn1251 (glottocode tečky) ---------- */
const PODLE_KODU = new Map();
REJSTRIK.g.forEach(function(g, i){ if (g) PODLE_KODU.set(g, i); });
function kodVyberu(){ return !vybrany ? "" : vybrany.typ === "atlas" ? vybrany.id : REJSTRIK.g[vybrany.i] || ""; }
function zapisOdkaz(){
  const k = kodVyberu();
  if (decodeURIComponent(location.hash.slice(1)) === k) return;
  try { history.replaceState(null, "", location.pathname + location.search + (k ? "#" + k : "")); } catch (e) {}
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
function ukazKartu(j){
  $("karta").hidden = false; $("k-plne").hidden = false; $("k-pozn").hidden = true; $("k-odznak").hidden = true;
  $("k-podrobnosti").hidden = true;
  const domov = BOD_ATLASU[j.id] >= 0 ? B[BOD_ATLASU[j.id]] : [0, j.stred[0], j.stred[1]];
  $("k-kod").textContent = souradnice(domov[1], domov[2]);
  $("k-nazev").textContent = j.n;
  $("k-domaci").textContent = t("domaciJmeno", {x: j.dom});
  const bub = $("k-bublina");
  bub.style.setProperty("--r-barva", "var(--r-" + j.sk + ")");
  bub.style.setProperty("--r-text", "var(--t-" + j.sk + ")");
  const pz = $("k-pozdrav");
  pz.textContent = j.pis;
  pz.style.fontSize = j.pis.length > 20 ? "1.25rem" : j.pis.length > 14 ? "1.5rem" : j.pis.length > 10 ? "1.75rem" : "";
  if (j.kod) pz.setAttribute("lang", j.kod); else pz.removeAttribute("lang");
  $("k-prepis").textContent = t("vyslovnost", {x: j.prep});
  $("k-mluvcich").textContent = pocetMluvcich(j.mlu);
  $("k-rodina").textContent = j.rod;
  const znakAtlas = jeZnakovyJazyk(j);                 /* u znakového jazyka se nemluví, ale znakuje */
  document.querySelector('#k-plne [data-t="mluvcich"]').textContent = znakAtlas ? T.uzivateluZnak : T.mluvcich;
  document.querySelector('#k-kde [data-t="kdeMluvi"]').textContent = znakAtlas ? T.kdeZnakuje : T.kdeMluvi;
  $("k-fakt").textContent = j.fakt;
  $("k-stav").hidden = true;
  tlPrehraj.hidden = !j.kod;
  popisPrehraj.textContent = T.poslechni;

  const kv = $("k-vitalita"), bodJ = BOD_ATLASU[j.id], stupenJ = bodJ >= 0 ? vitalitaBodu(bodJ) : -1;
  kv.textContent = ""; kv.hidden = stupenJ < 0;
  if (stupenJ >= 0) kv.appendChild(oddilVitality(stupenJ, znakAtlas));

  const pr = $("k-pribuzni"), ids = vybrany && vybrany.id === j.id ? vybrany.pribuzni : [];
  pr.textContent = ""; pr.hidden = !ids.length;
  if (ids.length) {
    const o = oddil(T.pribuzniAtlas), seznamP = prvek("ul", "pribuzni");
    ids.forEach(function(k){
      const jj = PODLE_ID[B[k][5]], li = prvek("li"), b = prvek("button", null, jj.n);
      b.type = "button"; b.style.setProperty("--r-barva", "var(--r-" + jj.sk + ")");
      b.addEventListener("click", function(){ vyber(jj.id); });
      li.appendChild(b); seznamP.appendChild(li);
    });
    o.appendChild(seznamP);
    if (globusOk) o.appendChild(prvek("p", "pozn", tx("pribuzniOblouky")));
    pr.appendChild(o);
  }

  const ul = $("k-staty"); ul.textContent = "";
  const jmena = j.zeme.map(nazevZeme);
  if (jmena.length) {
    jmena.slice(0, 14).forEach(function(z){ const li = document.createElement("li"); li.textContent = z; ul.appendChild(li); });
    if (jmena.length > 14) { const li = document.createElement("li"); li.className = "vic"; li.textContent = t("aDalsich", {n: jmena.length - 14}); ul.appendChild(li); }
  }
  if (j.ob.length) { const li = document.createElement("li"); li.className = "vic"; li.textContent = T.areal; ul.appendChild(li); }
  $("k-kde").hidden = !jmena.length && !j.ob.length;
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
let srovnani = null;   // hlásky češtiny (nebo angličtiny) pro porovnání
function hlaskySrovnani(){
  const i = B.findIndex(function(b){ return b[5] === T.srovnavaciJazyk; });
  const h = i >= 0 ? radek(i)[6] : null;
  return Array.isArray(h) ? h : null;
}
function ukazKartuBodu(i){
  const r = radek(i);
  $("karta").hidden = false; $("k-plne").hidden = true; $("k-kde").hidden = true; $("k-pozn").hidden = true;
  const jmeno = jmenoBodu(i);
  $("k-kod").textContent = souradnice(B[i][1], B[i][2]);
  $("k-nazev").textContent = jmeno;
  $("k-domaci").textContent = jmeno !== B[i][0] ? t("teckaNazev", {x: B[i][0]}) : T.teckaMezinarodni;
  const od = $("k-odznak");
  const oblast = REJSTRIK.mm[B[i][4]];
  od.textContent = REJSTRIK.rr[B[i][3]] + (oblast ? " · " + oblast : "");
  od.hidden = false;

  const box = $("k-podrobnosti");
  box.textContent = ""; box.hidden = false;
  const znak = ZNAKOVY[i] === 1;                       /* znakový jazyk: vlastní vysvětlení, ne „mluví se“ */
  if (znak) { const o = oddil(T.znakovyCo); o.appendChild(prvek("p", null, T.znakovyVysvetleni)); box.appendChild(o); }

  if (r[0] >= 0) box.appendChild(oddilVitality(r[0], znak));

  const staty = (r[3] || "").split(" ").filter(Boolean);
  if (staty.length) {
    const o = oddil(znak ? T.kdeZnakuje : T.kdeMluviTecka), ul = prvek("ul", "staty");
    staty.slice(0, 12).forEach(function(k){ ul.appendChild(prvek("li", null, PD.staty[T.lang][k] || k)); });
    if (staty.length > 12) ul.appendChild(prvek("li", "vic", t("aDalsich", {n: staty.length - 12})));
    o.appendChild(ul); box.appendChild(o);
  }
  const wdm = Array.isArray(r[10]) ? r[10] : null;   // [počet, rok, rodilí?] z Wikidat
  if (wdm || r[8] > 0 || r[4] > 0) {
    const d = prvek("div", "dvojice");
    if (wdm) {
      const o = oddil(znak ? T.znakuje : T.mluvci);
      o.appendChild(prvek("p", null, t("mluvciHodnota", {n: lidi(wdm[0])})));
      o.appendChild(prvek("p", "pozn", t(wdm[2] ? (znak ? "mluvciPoznRodiliZnak" : "mluvciPoznRodili") : "mluvciPozn", {rok: wdm[1] ? " " + wdm[1] : ""})));
      d.appendChild(o);
    } else if (r[8] > 0) {
      const o = oddil(T.uzivatelu);
      o.appendChild(prvek("p", null, t("uzivateluHodnota", {n: lidi(r[8])})));
      o.appendChild(prvek("p", "pozn", T.uzivateluPozn));
      d.appendChild(o);
    }
    if (r[4] > 0) { const o = oddil(T.nareci); o.appendChild(prvek("p", null, cislo(r[4]))); d.appendChild(o); }
    box.appendChild(d);
  }

  if (r[7] >= 0) {                                     /* ukázka textu: článek 1 deklarace */
    const u = PD.udhr[r[7]], o = oddil(T.ukazka);
    const q = prvek("blockquote", "ukazka", u[0]);
    if (u[1]) q.dir = "rtl";
    o.appendChild(q); o.appendChild(prvek("p", "pozn", T.ukazkaPopis)); box.appendChild(o);
  }

  if (r[5]) {                                          /* stavba jazyka z WALS */
    const ul = prvek("ul", "vlastnosti");
    PD.wals.forEach(function(kod, k){
      const v = +r[5][k], popis = T.wals[kod];
      if (!v || !popis || !popis[1][v - 1]) return;
      const li = prvek("li"); li.appendChild(prvek("b", null, popis[0])); li.appendChild(prvek("span", null, popis[1][v - 1]));
      ul.appendChild(li);
    });
    if (ul.children.length) { const o = oddil(T.stavba); o.appendChild(ul); box.appendChild(o); }
  }

  if (Array.isArray(r[6])) {                           /* hlásky z PHOIBLE */
    const h = r[6], o = oddil(T.hlasky);
    let txt = t("hlaskyHodnota", {c: h[0], cs: tvar(h[0], T.souhlaska), v: h[1], vs: tvar(h[1], T.samohlaska)});
    if (h[2] > 0) txt += t("hlaskyTony", {t: h[2], ts: tvar(h[2], T.ton)});
    o.appendChild(prvek("p", null, txt + "."));
    if (!srovnani || srovnani.lang !== T.lang) srovnani = {lang: T.lang, h: hlaskySrovnani()};
    if (srovnani.h) o.appendChild(prvek("p", "pozn", t("hlaskySrovnani", {c: srovnani.h[0], v: srovnani.h[1]})));
    box.appendChild(o);
  }

  if (r[2] >= 0) {                                     /* příbuzenstvo a nejbližší příbuzní */
    const cesta = [];
    for (let u = r[2]; u >= 0; u = PD.nad[u]) cesta.unshift(PD.uzly[u]);
    cesta[0] = velke(REJSTRIK.rr[B[i][3]] || cesta[0]);
    const zobrazit = cesta.length > 4 ? [cesta[0], "…", cesta[cesta.length - 2], cesta[cesta.length - 1]] : cesta;
    const o = oddil(T.pribuzenstvo), p = prvek("p", "cesta");
    zobrazit.forEach(function(x, k){
      if (k) p.appendChild(prvek("span", "sipka", "›"));
      p.appendChild(prvek("span", null, x));
    });
    o.appendChild(p); box.appendChild(o);

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
      o2.appendChild(ul); box.appendChild(o2);
    }
  }

  if (r[1] >= 0) { const o = oddil(T.popsanost); o.appendChild(prvek("p", null, velke(T.med[r[1]]) + ".")); box.appendChild(o); }

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
  o.appendChild(odk); box.appendChild(o);
  box.appendChild(prvek("p", "pozn", T.teckaPozn));
  $("karta").scrollTop = 0;
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
const puvodniOdkaz = odkazJinam.getAttribute("href");
function prelozStranku(){
  document.documentElement.lang = T.lang;
  document.title = T.nazev;
  Array.prototype.forEach.call(document.querySelectorAll("[data-t]"), function(el){ el.textContent = tx(el.dataset.t); });
  [["title", "tTitle"], ["aria-label", "tAriaLabel"], ["placeholder", "tPlaceholder"]].forEach(function(a){
    Array.prototype.forEach.call(document.querySelectorAll("[data-t-" + a[0] + "]"), function(el){ el.setAttribute(a[0], T[el.dataset[a[1]]]); });
  });
  const zpetna = $("zpetna-odkaz");        // e-mail se zpětnou vazbou, předmět podle jazyka
  zpetna.setAttribute("href", "mailto:" + T.zpetnaAdresa + "?subject=" + encodeURIComponent(T.zpetnaPredmet));
  if (ARTEFAKT) { zpetna.target = "_blank"; zpetna.rel = "noopener"; }   // v náhledu artefaktu smí ven jen nové okno
  const jiny = T.lang === "cs" ? "en" : "cs";
  odkazJinam.setAttribute("hreflang", jiny); odkazJinam.setAttribute("lang", jiny);
  if (!ARTEFAKT && location.protocol !== "file:") odkazJinam.setAttribute("href", jiny === "en" ? korenWebu + "en/" : korenWebu);
  else odkazJinam.setAttribute("href", T.lang === VYCHOZI ? puvodniOdkaz : "#");
}
/* texty na stránce po změně jazyka nebo vzhledu */
function obnovTexty(){
  prelozStranku();
  obnovLegendu();
  obnovVitalituPanel();
  postavPolici($("hledej").value);
  okno.hidden = true; bublinaBod.hidden = true;
  if (vybrany && vybrany.typ === "atlas") { ukazKartu(PODLE_ID[vybrany.id]); oznacTlacitka(vybrany.id); }
  else if (vybrany && vybrany.typ === "rejstrik") ukazKartuBodu(vybrany.i);
  $("napoveda").textContent = vybrany ? tx("napovedaVyber") : T.napovedaStart;
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
  rezimZnak = ["vse", "bez", "jen"].indexOf(z) >= 0 ? z : "vse";
  tlZnak.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.znak === rezimZnak ? "true" : "false"); });
  nastavVitalitu(Array.isArray(v) && v.length ? v : VSECHNY_STUPNE, true);
})();
prelozStranku(); postavPolici("");

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
  } catch (e) { console.error("Kreslení glóbu selhalo:", e); globusOk = false; }
}
prectiOdkaz();                              // otevřeno přes odkaz na jazyk
if (!globusOk) {
  [platno, podklad, platnoGl, platnoPopisky].forEach(function(c){ c.hidden = true; });
  $("hud").hidden = true; $("legenda").hidden = true; $("napoveda").hidden = true; $("vypadek").hidden = false; }
})();
