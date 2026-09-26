/* ---------- jazyky starověku: stránka o civilizaci (jazyk a písmo) ----------
   Jedna šablona pro okno nad glóbem (app.js) i samostatnou stránku webu (scripts/stranky.mjs): vrací HTML jako text.
   Obsah je v data/starovek.json (psaný ručně, ověřený), fotky ve static/starovek/<id>/ z Wikimedia Commons.
   o = { U: texty rozhraní (T.starovek), foto(klic) → adresa obrázku, fotoMala(klic) → menší verze (720 px, nepovinné),
         malba: SVG nebo <img> ilustrace,
         tecka(kod) → {nazev, href} (href jen na webu; v aplikaci tlačítko s data-tecka) } */
var STAROVEK = (function(){
  function esc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  /* písma starověku v Unicode a třída, která jim dá písmo Noto (src/starovek.css) */
  const PISMA = [["civ-klin", "\\u{12000}-\\u{1254F}"], ["civ-hier", "\\u{14400}-\\u{1467F}"], ["civ-egy", "\\u{13000}-\\u{1345F}"], ["civ-kopt", "\\u2C80-\\u2CFF\\u03E2-\\u03EF"], ["civ-fen", "\\u{10900}-\\u{1091F}"], ["civ-ugar", "\\u{10380}-\\u{1039F}"], ["civ-perskl", "\\u{103A0}-\\u{103DF}"]]
    .map(function(p){ return [p[0], new RegExp("[" + p[1] + "]", "u"), new RegExp("([" + p[1] + "][" + p[1] + "\\u0300-\\u036F\\s]*)", "gu")]; });
  function tridaPisma(z){ for (const p of PISMA) if (p[1].test(z)) return p[0]; return ""; }
  /* úseky starověkých písem v textu dostanou vlastní písmo */
  function text(s){
    let h = esc(s);
    PISMA.forEach(function(p){ h = h.replace(p[2], function(m){ const t = m.replace(/\s+$/, ""); return '<span class="' + p[0] + '">' + t + "</span>" + m.slice(t.length); }); });
    return h;
  }
  /* řádek znaků (věta, příklad): třída podle prvního znaku */
  function radekPisma(z, trida){ const t = tridaPisma(z); return '<span class="' + t + " " + trida + '" aria-hidden="true"' + (t === "civ-fen" ? ' dir="rtl"' : "") + ">" + esc(z) + "</span>"; }
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
      '" loading="lazy" decoding="async" alt="' + esc(f[lang]) + '"><figcaption>' + esc(f[lang]) + " " + kredit(f, o.U) + "</figcaption></figure>";
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
      case "zdroje": return '<section class="civ-zdroje">' + h + "<ul>" + b.p.map(function(p){ return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></section>";
    }
    return "";
  }
  function html(c, lang, o){
    const L = c[lang], U = o.U;
    return '<article class="civ" lang="' + lang + '">' +
      '<header class="civ-hero"><div class="civ-malba">' + (o.malba || "") + '</div><div class="civ-titul"><p class="civ-stitek">' + esc(L.stitek) + '</p><h1 id="civ-nadpis">' + esc(L.nazev) +
      '</h1><p class="civ-podtitul">' + esc(L.podtitul) + "</p></div></header>" +
      '<div class="civ-telo"><aside class="civ-fakta" aria-label="' + esc(U.vKostce) + '"><h2>' + esc(U.vKostce) + "</h2><dl>" +
      L.fakta.map(function(f){ return "<div><dt>" + esc(f[0]) + "</dt><dd>" + text(f[1]) + "</dd></div>"; }).join("") + "</dl></aside>" +
      '<p class="civ-perex">' + text(L.perex) + "</p>" +
      L.oddily.map(function(b){ return oddil(c, b, lang, o); }).join("") +
      '<footer class="civ-pata"><p>' + esc(U.pata) + "</p></footer></div></article>";
  }
  /* znaky, pro které je potřeba stáhnout písmo Noto (Google Fonts s parametrem text=) */
  function znakyPisma(c){
    const s = JSON.stringify([c.cs, c.en]), m = {};
    for (const z of s) if (tridaPisma(z)) m[z] = 1;
    return Object.keys(m).join("");
  }
  function odkazPisma(c){
    const z = znakyPisma(c);
    return z ? "https://fonts.googleapis.com/css2?" + (c.pisma || []).map(function(p){ return "family=" + p.replace(/ /g, "+"); }).join("&") + "&text=" + encodeURIComponent(z) + "&display=swap" : "";
  }
  return { html: html, odkazPisma: odkazPisma };
})();
