/* ---------- jazyky starověku: stránka o civilizaci (jazyk a písmo) ----------
   Jedna šablona pro okno nad glóbem (app.js) i samostatnou stránku webu (scripts/stranky.mjs): vrací HTML jako text.
   Obsah je v data/starovek.json (psaný ručně, ověřený), fotky ve static/starovek/<id>/ z Wikimedia Commons.
   o = { U: texty rozhraní (T.starovek), foto(klic) → adresa obrázku, fotoMala(klic) → menší verze (720 px, nepovinné),
         malba: SVG nebo <img> ilustrace,
         tecka(kod) → {nazev, href} (href jen na webu; v aplikaci tlačítko s data-tecka) } */
var STAROVEK = (function(){
  function esc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  /* písma starověku v Unicode a třída, která jim dá písmo Noto (src/starovek.css) */
  /* písmo: třída v textu, rozsah Unicode a rodina Noto (Google Fonts); rodiny pro stránku se odvodí ze znaků v ní */
  const PISMA = [
    ["civ-klin", "\\u{12000}-\\u{1254F}", "Noto Sans Cuneiform"],
    ["civ-hier", "\\u{14400}-\\u{1467F}", "Noto Sans Anatolian Hieroglyphs"],
    ["civ-egy", "\\u{13000}-\\u{1345F}", "Noto Sans Egyptian Hieroglyphs"],
    ["civ-kopt", "Ⲁ-⳿Ϣ-ϯ", "Noto Sans Coptic"],
    ["civ-fen", "\\u{10900}-\\u{1091F}", "Noto Sans Phoenician"],
    ["civ-ugar", "\\u{10380}-\\u{1039F}", "Noto Sans Ugaritic"],
    ["civ-perskl", "\\u{103A0}-\\u{103DF}", "Noto Sans Old Persian"],
    ["civ-linb", "\\u{10000}-\\u{100FF}", "Noto Sans Linear B"],
    ["civ-lina", "\\u{10600}-\\u{1077F}", "Noto Sans Linear A"],
    ["civ-mayc", "\\u{1D2E0}-\\u{1D2FF}", "Noto Sans Mayan Numerals"],
    ["civ-ital", "\\u{10300}-\\u{1032F}", "Noto Sans Old Italic"],
    ["civ-brahmi", "\\u{11000}-\\u{1107F}", "Noto Sans Brahmi"],
    ["civ-khar", "\\u{10A00}-\\u{10A5F}", "Noto Sans Kharoshthi"],
    ["civ-deva", "ऀ-ॿ", "Noto Serif Devanagari"],
    ["civ-aram", "\\u{10840}-\\u{1085F}", "Noto Sans Imperial Aramaic"],
    ["civ-avest", "\\u{10B00}-\\u{10B3F}", "Noto Sans Avestan"],
    ["civ-pahl", "\\u{10B60}-\\u{10B7F}", "Noto Sans Inscriptional Pahlavi"],
    ["civ-sarab", "\\u{10A60}-\\u{10A7F}", "Noto Sans Old South Arabian"],
    ["civ-etio", "ሀ-᎟ⶀ-⷟", "Noto Serif Ethiopic"],
    ["civ-han", "㐀-䶿一-鿿", "Noto Serif TC"],
    ["civ-run", "ᚠ-᛿", "Noto Sans Runic"],
    ["civ-orkh", "\\u{10C00}-\\u{10C4F}", "Noto Sans Old Turkic"],
    ["civ-got", "\\u{10330}-\\u{1034F}", "Noto Sans Gothic"],
    ["civ-ogam", " -᚟", "Noto Sans Ogham"],
    ["civ-hlah", "Ⰰ-ⱟ\\u{1E000}-\\u{1E02F}", "Noto Sans Glagolitic"],
    ["civ-hebr", "֐-׿", "Noto Serif Hebrew"],
    ["civ-syr", "܀-ݏ", "Noto Sans Syriac"],
    ["civ-nab", "\\u{10880}-\\u{108AF}", "Noto Sans Nabataean"],
    ["civ-palm", "\\u{10860}-\\u{1087F}", "Noto Sans Palmyrene"],
    ["civ-sam", "ࠀ-࠿", "Noto Sans Samaritan"],
    ["civ-arab", "؀-ۿ", "Noto Naskh Arabic"],
    ["civ-arm", "԰-֏", "Noto Serif Armenian"],
    ["civ-gruz", "Ⴀ-ჿⴀ-⴯Ა-Ჿ", "Noto Serif Georgian"],
    ["civ-tib", "ༀ-࿿", "Noto Serif Tibetan"],
    ["civ-taml", "஀-௿", "Noto Serif Tamil"]]
    .map(function(p){ return [p[0], new RegExp("[" + p[1] + "]", "u"), new RegExp("([" + p[1] + "][" + p[1] + "\\u0300-\\u036F\\s]*)", "gu"), p[2]]; });
  /* písma psaná zprava doleva: řádek znaků dostane dir="rtl" */
  const RTL = ["civ-fen", "civ-khar", "civ-aram", "civ-avest", "civ-pahl", "civ-sarab", "civ-hebr", "civ-syr", "civ-nab", "civ-palm", "civ-sam", "civ-arab", "civ-orkh"];
  function tridaPisma(z){ for (const p of PISMA) if (p[1].test(z)) return p[0]; return ""; }
  /* úseky starověkých písem v textu dostanou vlastní písmo */
  function text(s){
    let h = esc(s);
    PISMA.forEach(function(p){ h = h.replace(p[2], function(m){ const t = m.replace(/\s+$/, ""); return '<span class="' + p[0] + '">' + t + "</span>" + m.slice(t.length); }); });
    return h;
  }
  /* řádek znaků (věta, příklad): třída podle prvního znaku */
  function radekPisma(z, trida){ const t = tridaPisma(z); return '<span class="' + t + " " + trida + '" aria-hidden="true"' + (RTL.indexOf(t) >= 0 ? ' dir="rtl"' : "") + ">" + esc(z) + "</span>"; }
  function kredit(f, U){
    const lic = f.licenceUrl ? '<a href="' + esc(f.licenceUrl) + '" rel="license noopener" target="_blank">' + esc(f.licence) + "</a>" : esc(f.licence === "Public domain" ? U.volneDilo : f.licence);
    return '<span class="civ-kredit">' + esc(U.foto) + ": " + (f.autor ? esc(f.autor) + ", " : "") + lic +
      (f.zdroj ? ', <a href="' + esc(f.zdroj) + '" target="_blank" rel="noopener">Wikimedia Commons</a>' : "") + "</span>";
  }
  function foto(c, klic, lang, o, trida){
    const f = c.fotky[klic];
    if (!f) return "";
    const sada = o.fotoMala ? ' srcset="' + esc(o.fotoMala(klic)) + " " + Math.min(720, f.sirka) + "w, " + esc(o.foto(klic)) + " " + f.sirka + 'w" sizes="' + (trida === "siroka" ? "(max-width:1100px) 100vw, 1020px" : "(max-width:760px) 100vw, 360px") + '"' : "";
    return '<figure class="civ-foto' + (trida ? " " + trida : "") + '"><img src="' + esc(o.foto(klic)) + '"' + sada + ' width="' + f.sirka + '" height="' + f.vyska +
      '" loading="lazy" decoding="async" alt="' + esc(f[lang]) + '"><figcaption>' + text(f[lang]) + " " + kredit(f, o.U) + "</figcaption></figure>";
  }
  function oddil(c, b, lang, o){
    const U = o.U, h = b.h ? "<h2>" + esc(b.h) + "</h2>" : "";
    switch (b.typ) {
      case "text": return '<section class="civ-text">' + h + b.p.map(function(p){ return "<p>" + text(p) + "</p>"; }).join("") + "</section>";
      case "rameček": return '<aside class="civ-ramecek"><h3>' + esc(b.h) + "</h3>" + b.p.map(function(p){ return "<p>" + text(p) + "</p>"; }).join("") + "</aside>";
      case "foto": return foto(c, b.f, lang, o, b.siroka ? "siroka" : b["na-vysku"] ? "na-vysku" : "");
      case "galerie": return '<section class="civ-galerie">' + h + '<div class="civ-mrizka">' + b.f.map(function(k){ return foto(c, k, lang, o, ""); }).join("") + "</div></section>";
      case "znaky": return '<section class="civ-znaky">' + h + '<ul class="civ-znaky-seznam">' + b.znaky.map(function(z){
          return "<li>" + radekPisma(z[0], "civ-znak") + '<b lang="und">' + esc(z[1]) + "</b><small>" + esc(z[2]) + "</small></li>"; }).join("") + "</ul>" +
        (b.priklad ? '<p class="civ-priklad">' + radekPisma(b.priklad.klin, "civ-znak-radek") + '<span class="civ-prepis">' + esc(b.priklad.prepis) + "</span><span>" + text(b.priklad.vyznam) + "</span></p>" : "") +
        (b.pozn ? '<p class="civ-pozn">' + text(b.pozn) + "</p>" : "") + "</section>";
      case "veta": return '<figure class="civ-veta"><p class="civ-veta-klin">' + radekPisma(b.klin, "") + '</p><p class="civ-prepis">' + esc(b.prepis) + "</p>" +
        '<dl class="civ-glosy">' + b.slova.map(function(s){ return "<div><dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>"; }).join("") + "</dl>" +
        "<figcaption><q>" + esc(b.preklad.replace(/^[„“"]|[“”"]$/g, "")) + "</q><span>" + text(b.vyklad) + "</span></figcaption></figure>";
      case "slova": return '<section class="civ-slova">' + h + (b.uvod ? "<p>" + text(b.uvod) + "</p>" : "") + '<div class="civ-tabulka"><table><thead><tr>' +
        b.hlavicka.map(function(x){ return '<th scope="col">' + esc(x) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        b.radky.map(function(r){ return "<tr>" + r.map(function(x, i){ return i ? "<td>" + text(x) + "</td>" : '<th scope="row">' + text(x) + "</th>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></section>";
      case "osa": return '<section class="civ-osa">' + h + "<ol>" + b.udalosti.map(function(u){ return "<li><b>" + esc(u[0]) + "</b><span>" + text(u[1]) + "</span></li>"; }).join("") + "</ol></section>";
      case "tecky": return '<section class="civ-tecky">' + h + (b.uvod ? "<p>" + esc(b.uvod) + "</p>" : "") + '<ul class="civ-tecky-seznam">' + (c.tecky || []).map(function(k){
          const t = o.tecka(k); if (!t) return "";
          const nazev = (c[lang].nazvyTecek || {})[k] || t.nazev;
          const ikona = '<svg aria-hidden="true" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 8h12.4M8 1.8c2.2 2.4 2.2 10 0 12.4M8 1.8c-2.2 2.4-2.2 10 0 12.4" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
          return "<li>" + (t.href ? '<a class="civ-tecka" href="' + esc(t.href) + '">' + ikona + esc(nazev) + "</a>" : '<button class="civ-tecka" type="button" data-tecka="' + esc(k) + '">' + ikona + esc(nazev) + "</button>") + "</li>"; }).join("") + "</ul></section>";
      /* rodokmen písem: uzly s odkazem na rodiče, vnořený seznam; přerušovaná čára = sporné odvození */
      case "strom": {
        const deti = {}; b.uzly.forEach(function(u){ (deti[u.rodic || ""] = deti[u.rodic || ""] || []).push(u); });
        const civ = function(id){ return (o.vsechny || []).find(function(x){ return x.id === id; }); };
        const uzel = function(u){
          const cc = u.civ && civ(u.civ);
          const jmeno = cc ? (o.odkazCiv ? '<a href="' + esc(o.odkazCiv(cc)) + '">' + esc(u.nazev) + "</a>" : '<button type="button" data-civ="' + esc(cc.id) + '">' + esc(u.nazev) + "</button>") : esc(u.nazev);
          const pod = deti[u.id] || [];
          return '<li class="civ-uzel' + (u.jistota === "sporna" ? " sporna" : "") + '"><div class="civ-uzel-karta">' +
            (u.ukazka ? radekPisma(u.ukazka, "civ-uzel-ukazka") : '<span class="civ-uzel-ukazka civ-bez-ukazky" aria-hidden="true">·</span>') +
            '<span class="civ-uzel-text"><b>' + jmeno + "</b>" + (u.doba ? "<small>" + esc(u.doba) + "</small>" : "") + (u.pozn ? "<span>" + text(u.pozn) + "</span>" : "") + "</span></div>" +
            (pod.length ? "<ul>" + pod.map(uzel).join("") + "</ul>" : "") + "</li>";
        };
        return '<section class="civ-strom">' + h + (b.uvod ? "<p>" + text(b.uvod) + "</p>" : "") + '<ul class="civ-strom-koren">' + (deti[""] || []).map(uzel).join("") + "</ul>" +
          (b.pozn ? '<p class="civ-pozn">' + text(b.pozn) + "</p>" : "") + "</section>";
      }
      /* slovníček pojmů */
      case "pojmy": return '<section class="civ-pojmy">' + h + (b.uvod ? "<p>" + text(b.uvod) + "</p>" : "") + "<dl>" + b.pojmy.map(function(p){
          return "<div><dt>" + esc(p[0]) + "</dt><dd>" + text(p[1]) + (p[2] ? '<span class="civ-pojem-priklad">' + text(p[2]) + "</span>" : "") + "</dd></div>"; }).join("") + "</dl></section>";
      /* odkaz na typologickou mapu na glóbu (Příběhy: čaj → WALS 138A); v aplikaci tlačítko data-mapa, na webu odkaz */
      case "mapa": {
        const ikona = '<svg aria-hidden="true" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 8h12.4M8 1.8c2.2 2.4 2.2 10 0 12.4M8 1.8c-2.2 2.4-2.2 10 0 12.4" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
        const tl = o.odkazMapa ? '<a class="civ-mapa-tl" href="' + esc(o.odkazMapa(b.vlastnost)) + '">' + ikona + esc(o.U.mapaTlacitko) + "</a>"
          : '<button class="civ-mapa-tl" type="button" data-mapa="' + esc(b.vlastnost) + '">' + ikona + esc(o.U.mapaTlacitko) + "</button>";
        return '<section class="civ-mapa">' + h + (b.p || []).map(function(p){ return "<p>" + text(p) + "</p>"; }).join("") + tl + "</section>";
      }
      /* cesty slov na glóbu (Příběhy): tlačítko pro každé slovo; v aplikaci data-cesta, na webu odkaz #cesta-<id> */
      case "cesta": {
        const ikona = '<svg aria-hidden="true" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 10.5c1.5-3 3-4.2 5.5-4.2M9.5 6.3l-1.4-1.3M9.5 6.3l-1.2 1.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
        const nazev = function(id){ const w = (o.cesty || []).find(function(x){ return x.id === id; }); return w ? w.nazev[lang] : id; };
        return '<section class="civ-mapa civ-cesta">' + h + (b.p || []).map(function(p){ return "<p>" + text(p) + "</p>"; }).join("") + '<div class="civ-cesty">' +
          b.slova.map(function(id){ return o.odkazCesta ? '<a class="civ-mapa-tl" href="' + esc(o.odkazCesta(id)) + '">' + ikona + esc(nazev(id)) + "</a>"
            : '<button class="civ-mapa-tl" type="button" data-cesta="' + esc(id) + '">' + ikona + esc(nazev(id)) + "</button>"; }).join("") + "</div></section>";
      }
      case "zdroje": return '<section class="civ-zdroje">' + h + "<ul>" + b.p.map(function(p){ return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></section>";
    }
    return "";
  }
  /* rozcestník na konci stránky: ostatní civilizace (v aplikaci tlačítka data-civ, na webu odkazy) */
  function ostatni(c, lang, o){
    const dalsi = (o.dalsi || o.vsechny || []).filter(function(x){ return x.id !== c.id; });   // o.dalsi: jen stránky téže sekce
    if (!dalsi.length) return "";
    return '<nav class="civ-dalsi" aria-label="' + esc(o.U.dalsi) + '"><h2>' + esc(o.U.dalsi) + "</h2><ul>" + dalsi.map(function(x){
      const obsah = "<b>" + esc(x[lang].nazev) + "</b><small>" + esc(x[lang].podtitul) + "</small>";
      return "<li>" + (o.odkazCiv ? '<a class="civ-dalsi-tl" href="' + esc(o.odkazCiv(x)) + '">' + obsah + "</a>" : '<button class="civ-dalsi-tl" type="button" data-civ="' + esc(x.id) + '">' + obsah + "</button>") + "</li>";
    }).join("") + "</ul></nav>";
  }
  function html(c, lang, o){
    const L = c[lang], U = o.U;
    return '<article class="civ" lang="' + lang + '">' +
      '<header class="civ-hero"><div class="civ-malba">' + (o.malba || "") + '</div><div class="civ-titul"><p class="civ-stitek">' + esc(L.stitek) + '</p><h1 id="civ-nadpis">' + esc(L.nazev) +
      '</h1><p class="civ-podtitul">' + esc(L.podtitul) + "</p></div></header>" +
      '<div class="civ-telo">' + (L.fakta && L.fakta.length ? '<aside class="civ-fakta" aria-label="' + esc(U.vKostce) + '"><h2>' + esc(U.vKostce) + "</h2><dl>" +
      L.fakta.map(function(f){ return "<div><dt>" + esc(f[0]) + "</dt><dd>" + text(f[1]) + "</dd></div>"; }).join("") + "</dl></aside>" : "") +
      '<p class="civ-perex">' + text(L.perex) + "</p>" +
      L.oddily.map(function(b){ return oddil(c, b, lang, o); }).join("") +
      ostatni(c, lang, o) +
      '<footer class="civ-pata"><p>' + esc(U.pata) + "</p></footer></div></article>";
  }
  /* znaky, pro které je potřeba stáhnout písmo Noto (Google Fonts s parametrem text=) */
  function znakyPisma(c){
    const s = JSON.stringify([c.cs, c.en, Object.values(c.fotky || {}).map(function(f){ return [f.cs, f.en]; })]), m = {};
    for (const z of s) if (tridaPisma(z)) m[z] = 1;
    return Object.keys(m).join("");
  }
  /* rodiny písem, které stránka potřebuje (podle znaků, které v ní opravdu jsou) */
  function rodinyPisma(c){
    const r = [];
    for (const z of znakyPisma(c)) for (const p of PISMA) if (p[1].test(z) && r.indexOf(p[3]) < 0) r.push(p[3]);
    return r;
  }
  function odkazPisma(c){
    const z = znakyPisma(c);
    return z ? "https://fonts.googleapis.com/css2?" + rodinyPisma(c).map(function(p){ return "family=" + p.replace(/ /g, "+"); }).join("&") + "&text=" + encodeURIComponent(z) + "&display=swap" : "";
  }
  return { html: html, odkazPisma: odkazPisma, rodinyPisma: rodinyPisma };
})();
