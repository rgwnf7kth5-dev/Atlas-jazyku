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
function t(klic, promenne){
  return String(T[klic]).replace(/\{(\w+)\}/g, function(_, k){ return promenne && k in promenne ? promenne[k] : ""; });
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
let ZEME = [], PEVNINA = null, globusOk = false;
try {
  if (typeof d3 === "undefined" || !d3.geoOrthographic) throw new Error("chybí d3-geo");
  if (typeof topojson === "undefined") throw new Error("chybí topojson");
  ZEME = topojson.feature(SVET, SVET.objects.countries).features;
  PEVNINA = topojson.feature(SVET, SVET.objects.land);
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
function jmenoBodu(i){
  const id = B[i][5];
  if (id && PODLE_ID[id]) return PODLE_ID[id].n;
  const cs = T.lang === "cs" && radek(i)[9];
  return cs ? velke(cs) : B[i][0];
}

/* ---------- sbírka pozdravů (jen v tomto prohlížeči) ---------- */
let sbirka = new Set();
try { sbirka = new Set(JSON.parse(localStorage.getItem("atlas-sbirka") || "[]")); } catch (e) {}
function ulozSbirku(){ try { localStorage.setItem("atlas-sbirka", JSON.stringify(Array.from(sbirka))); } catch (e) {} }
function obnovSbirku(){
  const n = sbirka.size;
  const slovo = n === 1 ? T.pozdrav1 : (T.lang === "cs" && n >= 2 && n <= 4 ? T.pozdrav2 : T.pozdrav5);
  $("sbirka-text").textContent = n + " " + slovo;
}

/* ---------- světlý a tmavý režim ---------- */
function jeTmavy(){
  const a = document.documentElement.getAttribute("data-theme");
  return a ? a === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function obnovIkonu(){ $("ikona-rezim").setAttribute("href", jeTmavy() ? "#i-slunce" : "#i-mesic"); }
function nastavMotiv(m){
  document.documentElement.setAttribute("data-theme", m);
  try { localStorage.setItem("atlas-motiv", m); } catch (e) {}
  obnovIkonu(); barvyNeplatne = true; potrebaKresli = true;
}
(function(){ let u = null; try { u = localStorage.getItem("atlas-motiv"); } catch (e) {} if (u) document.documentElement.setAttribute("data-theme", u); obnovIkonu(); })();
$("prepinac").addEventListener("click", function(){ nastavMotiv(jeTmavy() ? "light" : "dark"); });
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(){ obnovIkonu(); barvyNeplatne = true; potrebaKresli = true; });

/* ---------- police ---------- */
const seznam = $("seznam");
function pridejHvezdu(tl){
  if (tl.querySelector(".znamka")) return;
  const hv = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  hv.setAttribute("class", "znamka"); hv.setAttribute("viewBox", "0 0 24 24"); hv.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#i-hvezda"); hv.appendChild(use); tl.appendChild(hv);
}
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
    const jazyky = JAZYKY.filter(function(j){ return j.sk === sk && (!hledane || j.hledat.indexOf(hledane) !== -1); });
    if (!jazyky.length) return;
    vAtlasu += jazyky.length;
    const sekce = document.createElement("section"); sekce.className = "rodina";
    sekce.appendChild(nadpis(T.rodiny[sk] + " (" + jazyky.length + ")", "var(--r-" + sk + ")"));
    const mrizka = document.createElement("div"); mrizka.className = "mrizka";
    jazyky.forEach(function(j){
      const tl = tlacitko(j.n, j.pis, "var(--r-" + j.sk + ")");
      tl.dataset.id = j.id;
      tl.setAttribute("aria-pressed", vybrany && vybrany.typ === "atlas" && vybrany.id === j.id ? "true" : "false");
      if (sbirka.has(j.id)) pridejHvezdu(tl);
      tl.addEventListener("click", function(){ vyber(j.id); });
      mrizka.appendChild(tl);
    });
    sekce.appendChild(mrizka); seznam.appendChild(sekce);
  });

  let vRejstriku = 0;
  if (hledane.length >= 2) {
    const nalez = [];
    for (let i = 0; i < POCET_B && nalez.length < 80; i++) {
      if (!B[i][5] && bHledat[i].indexOf(hledane) !== -1) nalez.push(i);
    }
    vRejstriku = nalez.length;
    if (vRejstriku) {
      const sekce = document.createElement("section"); sekce.className = "rodina";
      sekce.appendChild(nadpis(T.rejstrik + " (" + vRejstriku + (vRejstriku >= 80 ? "+" : "") + ")", null));
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
    : t("vychoziPocet", {a: JAZYKY.length, b: cislo(POCET_B)});
}
$("hledej").addEventListener("input", function(e){ postavPolici(e.target.value); });

/* ---------- glóbus ---------- */
const platno = $("globus");
const ctx = globusOk ? platno.getContext("2d") : null;
const proj = globusOk ? d3.geoOrthographic().clipAngle(90).precision(0.9) : null;
const cesta = globusOk ? d3.geoPath(proj, ctx) : null;
const sit = globusOk ? d3.geoGraticule().step([20, 20])() : null;
const kruh = globusOk ? d3.geoCircle() : null;
const ZOOM_MAX = 8;
let sirka = 0, vyska = 0, polomer = 0, polomerZaklad = 0, zoom = 1;
let rot = [-14, -48];
let autoOtaceni = false, tahne = false, prechod = null;
let pulsDo = 0, potrebaKresli = true, barvyNeplatne = true;
let barvy = {}, oceanGrad = null, zareGrad = null;
let zvyraznenyBod = -1;
let vybrany = null;

function nactiBarvy(){
  const s = getComputedStyle(document.documentElement);
  ["ocean","ocean2","pevnina","pevnina-linka","sit","obrys","tecky","papir2","akcent","zare","popisek","popisek-lem",
   "r-ie","r-st","r-an","r-afro","r-nk","r-ost"].forEach(function(k){ barvy[k] = s.getPropertyValue("--" + k).trim(); });
  barvyNeplatne = false; oceanGrad = null; zareGrad = null;
}
function zmer(){
  const r = platno.getBoundingClientRect();
  sirka = Math.max(1, Math.round(r.width)); vyska = Math.max(1, Math.round(r.height));
  /* rasterizace roste s plochou – u velkého plátna stačí nižší hustota pixelů */
  const dpr = Math.min(window.devicePixelRatio || 1, sirka * vyska > 620000 ? 1.35 : 1.75);
  platno.width = sirka * dpr; platno.height = vyska * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  polomerZaklad = Math.max(40, Math.min(sirka, vyska) / 2 - 22);
  proj.translate([sirka / 2, vyska / 2]);
  uplatniZoom();
}
let zobrazenyZoom = "";
function uplatniZoom(){
  polomer = polomerZaklad * zoom;
  proj.scale(polomer);
  oceanGrad = null; zareGrad = null; potrebaKresli = true;
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

/* ---------- jména jazyků malým písmem, bez překrývání ---------- */
const POPISKY_OD = 2, POPISKU_MAX = 450, BUNKA = 4;
let popiskyZapnute = true;
function nastavPopisky(zapnout){
  popiskyZapnute = !!zapnout;
  $("tl-jmena").setAttribute("aria-pressed", popiskyZapnute ? "true" : "false");
  try { localStorage.setItem("atlas-popisky", popiskyZapnute ? "1" : "0"); } catch (e) {}
  potrebaKresli = true;
}
$("tl-jmena").addEventListener("click", function(){ nastavPopisky(!popiskyZapnute); });
const poradiPopisku = new Int32Array(POCET_B);   // napřed jazyky z atlasu, pak ostatní
(function(){ let k = 0;
  for (let i = 0; i < POCET_B; i++) if (B[i][5]) poradiPopisku[k++] = i;
  for (let i = 0; i < POCET_B; i++) if (!B[i][5]) poradiPopisku[k++] = i; })();
const sirka10 = new Float32Array(POCET_B);          // šířka popisku při písmu 10 px
const PISMO = "px Nunito, system-ui, sans-serif";
function textPopisku(i){ return jmenoBodu(i); }
function zmerPopisky(jenAtlas){
  if (!globusOk) return;
  ctx.save(); ctx.font = "700 10" + PISMO;
  for (let i = 0; i < POCET_B; i++) if (!jenAtlas || B[i][5]) sirka10[i] = ctx.measureText(textPopisku(i)).width;
  ctx.restore(); potrebaKresli = true;
}
let obsazeno = new Uint8Array(0);
const umisteno = [];
function kresliPopisky(rb){
  if (!popiskyZapnute || zoom < POPISKY_OD) return;
  const vel = Math.min(11.5, 9.5 + (zoom - POPISKY_OD) * 0.4);
  const k = vel / 10, vys = vel + 3;
  const cw = Math.ceil(sirka / BUNKA) + 1, ch = Math.ceil(vyska / BUNKA) + 1;
  if (obsazeno.length < cw * ch) obsazeno = new Uint8Array(cw * ch); else obsazeno.fill(0, 0, cw * ch);
  umisteno.length = 0;
  for (let q = 0; q < POCET_B && umisteno.length < POPISKU_MAX; q++) {
    const i = poradiPopisku[q];
    if (!bVid[i]) continue;
    const x = bPx[i] + rb + 3, y = bPy[i], w = sirka10[i] * k;
    if (x < 2 || y < vys || y > vyska - vys || x + w > sirka - 2) continue;
    const x0 = ((bPx[i] - rb - 2) / BUNKA) | 0, x1 = ((x + w + 3) / BUNKA) | 0;
    const y0 = ((y - vys / 2) / BUNKA) | 0, y1 = ((y + vys / 2) / BUNKA) | 0;
    let volno = true;
    for (let yy = y0; yy <= y1 && volno; yy++) { const r = yy * cw; for (let xx = x0; xx <= x1; xx++) if (obsazeno[r + xx]) { volno = false; break; } }
    if (!volno) continue;
    for (let yy = y0; yy <= y1; yy++) { const r = yy * cw; for (let xx = x0; xx <= x1; xx++) obsazeno[r + xx] = 1; }
    umisteno.push(i, x, y);
  }
  ctx.font = "700 " + vel.toFixed(1) + PISMO;
  ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  ctx.lineWidth = 3; ctx.strokeStyle = barvy["popisek-lem"];
  for (let n = 0; n < umisteno.length; n += 3) ctx.strokeText(textPopisku(umisteno[n]), umisteno[n + 1], umisteno[n + 2]);
  ctx.fillStyle = barvy.popisek;
  for (let n = 0; n < umisteno.length; n += 3) ctx.fillText(textPopisku(umisteno[n]), umisteno[n + 1], umisteno[n + 2]);
}

function spocitejBody(){
  const l0 = -rot[0] * R, f0 = -rot[1] * R, sf0 = Math.sin(f0), cf0 = Math.cos(f0);
  const cx = sirka / 2, cy = vyska / 2;
  for (let i = 0; i < POCET_B; i++) {
    const dl = bLon[i] - l0, cdl = Math.cos(dl);
    if (bSinLat[i] * sf0 + bCosLat[i] * cf0 * cdl <= 0.002) { bVid[i] = 0; continue; }
    bVid[i] = 1;
    bPx[i] = cx + polomer * (bCosLat[i] * Math.sin(dl));
    bPy[i] = cy - polomer * (cf0 * bSinLat[i] - sf0 * bCosLat[i] * cdl);
  }
}

function kresli(cas){
  if (barvyNeplatne) nactiBarvy();
  proj.rotate(rot);
  ctx.clearRect(0, 0, sirka, vyska);
  const cx = sirka / 2, cy = vyska / 2;

  /* záře kolem planety */
  if (zoom < 1.6) {
    if (!zareGrad) {
      zareGrad = ctx.createRadialGradient(cx, cy, polomer * 0.96, cx, cy, polomer * 1.16);
      zareGrad.addColorStop(0, barvy.zare); zareGrad.addColorStop(1, "rgba(0,0,0,0)");
    }
    ctx.beginPath(); ctx.arc(cx, cy, polomer * 1.16, 0, 6.283185);
    ctx.fillStyle = zareGrad; ctx.fill();
  }

  if (!oceanGrad) {
    oceanGrad = ctx.createRadialGradient(cx - polomer * 0.35, cy - polomer * 0.4, polomer * 0.1, cx, cy, polomer * 1.02);
    oceanGrad.addColorStop(0, barvy.ocean); oceanGrad.addColorStop(1, barvy.ocean2);
  }
  ctx.beginPath(); cesta({type: "Sphere"}); ctx.fillStyle = oceanGrad; ctx.fill();
  ctx.beginPath(); cesta(sit); ctx.lineWidth = 1; ctx.strokeStyle = barvy.sit; ctx.stroke();

  const jeAtlas = vybrany && vybrany.typ === "atlas";
  const staty = jeAtlas && vybrany.zeme.length ? new Set(vybrany.zeme) : null;
  ctx.beginPath();
  ZEME.forEach(function(f){ if (!staty || !staty.has(f.properties.name)) cesta(f); });
  ctx.fillStyle = barvy.pevnina; ctx.fill();
  ctx.lineWidth = 0.7; ctx.strokeStyle = barvy["pevnina-linka"]; ctx.stroke();

  const barva = jeAtlas ? barvy["r-" + vybrany.sk] : barvy.akcent;
  if (staty) {
    ctx.beginPath();
    ZEME.forEach(function(f){ if (staty.has(f.properties.name)) cesta(f); });
    ctx.fillStyle = barva; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = barvy.obrys; ctx.lineJoin = "round"; ctx.stroke();
  }
  /* areál: kruhy oříznuté na pevninu; obrys jen po okraji celku (tah pod výplní) */
  if (jeAtlas && vybrany.ob.length) {
    ctx.save();
    ctx.beginPath(); cesta(PEVNINA); ctx.clip();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    vybrany.ob.forEach(function(o){ cesta(kruh.center([o[0], o[1]]).radius(o[2] * 1.75)()); });
    ctx.fillStyle = barva; ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    vybrany.ob.forEach(function(o){ cesta(kruh.center([o[0], o[1]]).radius(o[2] * 1.3)()); });
    ctx.lineWidth = 3.6; ctx.strokeStyle = barvy.obrys; ctx.lineJoin = "round"; ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  spocitejBody();
  const rb = Math.max(1.0, Math.min(2.6, polomer / 300));
  ctx.beginPath();
  for (let i = 0; i < POCET_B; i++) {
    if (!bVid[i] || i === zvyraznenyBod) continue;
    ctx.moveTo(bPx[i] + rb, bPy[i]); ctx.arc(bPx[i], bPy[i], rb, 0, 6.283185);
  }
  ctx.globalAlpha = 0.55; ctx.fillStyle = barvy.tecky; ctx.fill(); ctx.globalAlpha = 1;
  if (zvyraznenyBod >= 0 && bVid[zvyraznenyBod]) {
    ctx.beginPath(); ctx.arc(bPx[zvyraznenyBod], bPy[zvyraznenyBod], rb + 3.6, 0, 6.283185);
    ctx.fillStyle = barvy.akcent; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = barvy.papir2; ctx.stroke();
  }

  kresliPopisky(rb);
  ctx.beginPath(); cesta({type: "Sphere"}); ctx.lineWidth = 3; ctx.strokeStyle = barvy.obrys; ctx.stroke();

  if (vybrany) {
    const s = vybrany.stred;
    if (d3.geoDistance(s, [-rot[0], -rot[1]]) < Math.PI / 2 - 0.02) {
      const p = proj(s);
      const faze = pulsDo > cas ? ((cas % 1400) / 1400) : 0;
      if (faze) {
        ctx.beginPath(); ctx.arc(p[0], p[1], 9 + faze * 22, 0, 6.283185);
        ctx.strokeStyle = barvy.akcent; ctx.globalAlpha = 1 - faze; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.beginPath(); ctx.arc(p[0], p[1], 8, 0, 6.283185);
      ctx.lineWidth = 6; ctx.strokeStyle = barvy.papir2; ctx.stroke();
      ctx.lineWidth = 3.2; ctx.strokeStyle = barvy.akcent; ctx.stroke();
    }
  }
}

/* ---------- pohyb ---------- */
function dlouheDo(a, b){ let d = (b - a) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return a + d; }
function letKe(stred, cilZoom){
  const cil = [dlouheDo(rot[0], -stred[0]), Math.max(-80, Math.min(80, -stred[1]))];
  const zc = cilZoom == null ? zoom : Math.max(1, Math.min(ZOOM_MAX, cilZoom));
  if (bezPohybu.matches) { rot = cil; zoom = zc; uplatniZoom(); pulsDo = performance.now() + 2600; return; }
  prechod = {z: rot.slice(), k: cil, z2: zoom, k2: zc, zac: performance.now(), delka: 1100};
}
let posledni = 0, pulsBezi = false;
function smycka(cas){
  requestAnimationFrame(smycka);
  let zmena = false;
  if (prechod) {
    const k = Math.min(1, (cas - prechod.zac) / prechod.delka), e = plynule(k);
    rot = [prechod.z[0] + (prechod.k[0] - prechod.z[0]) * e, prechod.z[1] + (prechod.k[1] - prechod.z[1]) * e];
    if (prechod.k2 !== prechod.z2) { zoom = prechod.z2 * Math.pow(prechod.k2 / prechod.z2, e); uplatniZoom(); }
    if (k >= 1) { const let2 = prechod.delka > 500; prechod = null; if (let2) pulsDo = cas + 2600; }
    zmena = true;
  } else if (autoOtaceni && !tahne) {
    rot[0] = (rot[0] + Math.min(64, cas - (posledni || cas)) * 0.006 / zoom) % 360;
    zmena = true;
  }
  posledni = cas;
  if (pulsDo > cas) { zmena = true; pulsBezi = true; }
  else if (pulsBezi) { zmena = true; pulsBezi = false; }   // ještě jeden snímek, ať po pulzu nezůstane kroužek
  if (zmena || potrebaKresli) { kresli(cas); potrebaKresli = false; }
}

/* ---------- myš a prsty: tažení otáčí, dva prsty a kolečko přibližují ---------- */
if (globusOk) {
  let start = null, pinch = null;
  const prsty = new Map();
  const vzdalenostPrstu = function(){ const p = Array.from(prsty.values()); return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
  platno.addEventListener("pointerdown", function(e){
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
    if (zvyraznenyBod !== -1 && !(vybrany && vybrany.typ === "rejstrik")) { zvyraznenyBod = -1; potrebaKresli = true; }
    $("bublina-bod").hidden = true;
  });
  platno.addEventListener("wheel", function(e){
    e.preventDefault();
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
  if (!(vybrany && vybrany.typ === "rejstrik")) { zvyraznenyBod = i; potrebaKresli = true; }
  if (i < 0) { bublinaBod.hidden = true; return; }
  bublinaBod.textContent = jmenoBodu(i) + " · " + REJSTRIK.rr[B[i][3]];
  bublinaBod.hidden = false;
  umisti(bublinaBod, e);
}

const okno = $("zeme-okno");
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
  const zde = V_ZEMI[nalezena.properties.name] || [];
  okno.textContent = "";
  const h4 = document.createElement("h4"); h4.textContent = nazevZeme(nalezena.properties.name); okno.appendChild(h4);
  if (!zde.length) {
    const p = document.createElement("p"); p.textContent = T.zemeBezPozdravu; okno.appendChild(p);
  } else {
    const ul = document.createElement("ul");
    zde.slice(0, 12).forEach(function(j){
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.textContent = j.n; b.style.borderColor = "var(--r-" + j.sk + ")";
      b.addEventListener("click", function(){ okno.hidden = true; vyber(j.id); });
      li.appendChild(b); ul.appendChild(li);
    });
    okno.appendChild(ul);
  }
  okno.hidden = false;
  umisti(okno, e);
}
document.addEventListener("keydown", function(e){ if (e.key === "Escape") { okno.hidden = true; bublinaBod.hidden = true; } });

/* ---------- výběr ---------- */
function poVyberu(cilZoom){
  if (autoOtaceni) nastavOtaceni(false);   // vybraný jazyk ať neujíždí z očí
  okno.hidden = true; bublinaBod.hidden = true;
  if (globusOk) { letKe(vybrany.stred, cilZoom); potrebaKresli = true; }
  $("tl-cely").hidden = false;
  $("napoveda").textContent = T.napovedaVyber;
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
    if (je) pridejHvezdu(el);
  });
}
function vyber(id){
  const j = PODLE_ID[id]; if (!j) return;
  vybrany = {typ: "atlas", id: j.id, sk: j.sk, zeme: j.zeme, ob: j.ob, stred: j.stred};
  zvyraznenyBod = -1;
  poVyberu(globusOk ? zoomProJazyk(j) : 1);
  if (!sbirka.has(id)) { sbirka.add(id); ulozSbirku(); obnovSbirku(); }
  ukazKartu(j);
  oznacTlacitka(id);
  const tl = document.querySelector('.jaz[data-id="' + id + '"]');
  if (tl) tl.scrollIntoView({block: "center", behavior: bezPohybu.matches ? "auto" : "smooth"});
}
function vyberBod(i){
  if (B[i][5] && PODLE_ID[B[i][5]]) { vyber(B[i][5]); return; }
  vybrany = {typ: "rejstrik", i: i, zeme: [], ob: [], stred: [B[i][1], B[i][2]]};
  zvyraznenyBod = i;
  poVyberu(Math.max(zoom, 2.6));
  ukazKartuBodu(i);
  oznacTlacitka(null);
}
function odznac(){
  vybrany = null; zvyraznenyBod = -1; prechod = null;
  if (globusOk) plynulyZoom(1);
  $("karta").hidden = true; $("tl-cely").hidden = true;
  okno.hidden = true; bublinaBod.hidden = true; potrebaKresli = true;
  $("napoveda").textContent = T.napovedaStart;
  oznacTlacitka(null);
}
$("tl-cely").addEventListener("click", odznac);
$("k-zavrit").addEventListener("click", odznac);
$("tl-nahoda").addEventListener("click", function(){
  if ($("hledej").value) { $("hledej").value = ""; postavPolici(""); }
  let j = JAZYKY[Math.floor(Math.random() * JAZYKY.length)];
  if (vybrany && vybrany.id === j.id) j = JAZYKY[(JAZYKY.indexOf(j) + 7) % JAZYKY.length];
  vyber(j.id);
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
  $("k-fakt").textContent = j.fakt;
  $("k-stav").hidden = true;
  tlPrehraj.hidden = !j.kod;
  popisPrehraj.textContent = T.poslechni;

  const ul = $("k-staty"); ul.textContent = "";
  const jmena = j.zeme.map(nazevZeme);
  if (jmena.length) {
    jmena.slice(0, 14).forEach(function(z){ const li = document.createElement("li"); li.textContent = z; ul.appendChild(li); });
    if (jmena.length > 14) { const li = document.createElement("li"); li.className = "vic"; li.textContent = t("aDalsich", {n: jmena.length - 14}); ul.appendChild(li); }
  }
  if (j.ob.length) { const li = document.createElement("li"); li.className = "vic"; li.textContent = T.areal; ul.appendChild(li); }
  $("k-kde").hidden = !jmena.length && !j.ob.length;
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
  $("k-nazev").textContent = jmeno;
  $("k-domaci").textContent = jmeno !== B[i][0] ? t("teckaNazev", {x: B[i][0]}) : T.teckaMezinarodni;
  const od = $("k-odznak");
  const oblast = REJSTRIK.mm[B[i][4]];
  od.textContent = REJSTRIK.rr[B[i][3]] + (oblast ? " · " + oblast : "");
  od.hidden = false;

  const box = $("k-podrobnosti");
  box.textContent = ""; box.hidden = false;

  if (r[0] >= 0) {                                     /* ohrožení podle UNESCO */
    const o = oddil(T.ohrozeni), stupen = T.aes[r[0]];
    const m = prvek("div", "ohrozeni");
    m.setAttribute("role", "img"); m.setAttribute("aria-label", stupen[0] + " (" + (r[0] + 1) + "/6)");
    for (let k = 0; k < 6; k++) m.appendChild(prvek("i", k <= r[0] ? "plny" : null));
    const p = prvek("p"); p.appendChild(prvek("span", "ohrozeni-nazev", stupen[0])); p.appendChild(document.createTextNode(" – " + stupen[1]));
    o.appendChild(m); o.appendChild(p); box.appendChild(o);
  }

  const staty = (r[3] || "").split(" ").filter(Boolean);
  if (staty.length) {
    const o = oddil(T.kdeMluviTecka), ul = prvek("ul", "staty");
    staty.slice(0, 12).forEach(function(k){ ul.appendChild(prvek("li", null, PD.staty[T.lang][k] || k)); });
    if (staty.length > 12) ul.appendChild(prvek("li", "vic", t("aDalsich", {n: staty.length - 12})));
    o.appendChild(ul); box.appendChild(o);
  }
  const wdm = Array.isArray(r[10]) ? r[10] : null;   // [počet, rok, rodilí?] z Wikidat
  if (wdm || r[8] > 0 || r[4] > 0) {
    const d = prvek("div", "dvojice");
    if (wdm) {
      const o = oddil(T.mluvci);
      o.appendChild(prvek("p", null, t("mluvciHodnota", {n: lidi(wdm[0])})));
      o.appendChild(prvek("p", "pozn", t(wdm[2] ? "mluvciPoznRodili" : "mluvciPozn", {rok: wdm[1] ? " " + wdm[1] : ""})));
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

    const bratri = (sourozenci.get(r[2]) || []).filter(function(j){ return j !== i; });
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
  Array.prototype.forEach.call(document.querySelectorAll("[data-t]"), function(el){ el.textContent = T[el.dataset.t]; });
  [["title", "tTitle"], ["aria-label", "tAriaLabel"], ["placeholder", "tPlaceholder"]].forEach(function(a){
    Array.prototype.forEach.call(document.querySelectorAll("[data-t-" + a[0] + "]"), function(el){ el.setAttribute(a[0], T[el.dataset[a[1]]]); });
  });
  const jiny = T.lang === "cs" ? "en" : "cs";
  odkazJinam.setAttribute("hreflang", jiny); odkazJinam.setAttribute("lang", jiny);
  if (!ARTEFAKT && location.protocol !== "file:") odkazJinam.setAttribute("href", jiny === "en" ? korenWebu + "en/" : korenWebu);
  else odkazJinam.setAttribute("href", T.lang === VYCHOZI ? puvodniOdkaz : "#");
}
function prepniJazyk(lang){
  T = UI[lang]; STATY = STATY_VSE[lang];
  prelozData(); prelozStranku(); zmerPopisky(false);
  obnovSbirku();
  postavPolici($("hledej").value);
  zobrazenyZoom = ""; if (globusOk) uplatniZoom();
  okno.hidden = true; bublinaBod.hidden = true;
  if (vybrany && vybrany.typ === "atlas") { ukazKartu(PODLE_ID[vybrany.id]); oznacTlacitka(vybrany.id); }
  else if (vybrany && vybrany.typ === "rejstrik") ukazKartuBodu(vybrany.i);
  $("napoveda").textContent = vybrany ? T.napovedaVyber : T.napovedaStart;
  if (!ARTEFAKT && location.protocol !== "file:" && history.replaceState) {
    try { history.replaceState(null, "", lang === "en" ? korenWebu + "en/" : korenWebu); } catch (e) {}
  }
}
odkazJinam.addEventListener("click", function(e){
  e.preventDefault();
  prepniJazyk(T.lang === "cs" ? "en" : "cs");
});

/* ---------- start ---------- */
obnovSbirku();
const prvni = PODLE_ID[T.lang === "en" ? "en" : "cs"];
vybrany = {typ: "atlas", id: prvni.id, sk: prvni.sk, zeme: prvni.zeme, ob: prvni.ob, stred: prvni.stred};
ukazKartu(prvni);
$("tl-cely").hidden = false;
if (!sbirka.has(prvni.id)) { sbirka.add(prvni.id); ulozSbirku(); }
obnovSbirku(); postavPolici("");

if (globusOk) {
  try {
    rot = [-prvni.stred[0], -prvni.stred[1]];
    new ResizeObserver(zmer).observe(platno);
    zmer();
    zmerPopisky(false);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ zmerPopisky(false); });
    let ulozeneOtaceni = null;
    try { ulozeneOtaceni = localStorage.getItem("atlas-otaceni"); } catch (e) {}
    nastavOtaceni(ulozeneOtaceni === "1");
    let ulozenePopisky = null;
    try { ulozenePopisky = localStorage.getItem("atlas-popisky"); } catch (e) {}
    nastavPopisky(ulozenePopisky !== "0");
    requestAnimationFrame(smycka);
    pulsDo = performance.now() + 2600;
  } catch (e) { console.error("Kreslení glóbu selhalo:", e); globusOk = false; }
}
if (!globusOk) { platno.hidden = true; $("legenda").hidden = true; $("napoveda").hidden = true; $("vypadek").hidden = false; }
})();
