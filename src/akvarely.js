/* ---------- akvarely: malované krajiny na pohlednicích jazyků ----------
   Krajina podle toho, odkud jazyk pochází (data/krajiny.json), ne podle památek. Kreslí se v SVG jako akvarel:
   - lazury: plocha s jemně roztřepeným okrajem (šum posune obrys), pigment se usadí do zrn a na okraji ztmavne
     jako zaschlá voda; plochy se násobí (mix-blend multiply), takže se prosvítají jako vrstvy barvy,
   - každý hřbet má uvnitř přechod (světlejší hrana, tmavší úpatí) a čím dál, tím víc tone v modravém oparu
     (vzdušná perspektiva),
   - mraky mají osvětlený vršek a stínované spodky, stromy jsou z několika tónů zeleně se světlem zleva,
   - drobnosti (tráva, květy, vlnky) jsou jemné tahy štětcem, vždy v jedné skupině s jedním filtrem (kvůli výkonu).
   Světlé barvy (sníh, domy, pěna) se kreslí normálně, jinak by násobením zmizely.
   Náhodnost je daná jazykem, takže jazyk má vždy stejný obrázek. */
var AKVARELY = (function(){
  const W = 400, H = 250;
  let citac = 0;
  function nahoda(sem){ let s = sem % 2147483646 + 1; return function(){ return (s = (s * 16807) % 2147483647) / 2147483647; }; }
  const f1 = function(v){ return (Math.round(v * 10) / 10).toString(); };
  function hex(h){ return [1, 3, 5].map(function(i){ return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t){ const x = hex(a), y = hex(b); return "#" + x.map(function(v, i){ return Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0"); }).join(""); }
  /* světlé barvy (sníh, křída, domy, pěna) se nesmí násobit: všechny složky aspoň 0xE0 */
  function svetla(b){ return /^#[0-9a-f]{6}$/i.test(b) && hex(b).every(function(v){ return v >= 0xE0; }); }

  function filtry(sem){
    const p = "a" + (++citac) + "_";
    const zrno = function(id, f, a, b){ return '<feTurbulence type="fractalNoise" baseFrequency="' + f + '" numOctaves="2" seed="' + (sem + id) + '" result="z' + id + '"/>' +
      '<feColorMatrix in="z' + id + '" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ' + a + ' ' + b + '" result="zA' + id + '"/>'; };
    return { sem: sem, id: p, lazura: p + "l", mokra: p + "m", jemna: p + "j", stetec: p + "s", papir: p + "p", n: 0, defs:
    /* lazura: roztřepený okraj, skvrnitý a zrnitý pigment, ztmavlý okraj */
    '<filter id="' + p + 'l" x="-8%" y="-8%" width="116%" height="116%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="4" seed="' + sem + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      zrno(7, ".045", "-.32", "1.1") + zrno(3, ".85", "-.35", "1.12") +
      '<feComposite in="d" in2="zA7" operator="in" result="d2"/><feComposite in="d2" in2="zA3" operator="in" result="g"/>' +
      '<feMorphology in="d" operator="erode" radius="1" result="er"/><feComposite in="d" in2="er" operator="out" result="ok"/>' +
      '<feGaussianBlur in="ok" stdDeviation=".5" result="okB"/><feComponentTransfer in="okB" result="okT"><feFuncA type="linear" slope=".45"/></feComponentTransfer>' +
      '<feMerge><feMergeNode in="g"/><feMergeNode in="okT"/></feMerge></filter>' +
    /* mokrá lazura: rozpitá do ztracena (nebe, mlha, dálky) */
    '<filter id="' + p + 'm" x="-15%" y="-15%" width="130%" height="130%">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency=".016" numOctaves="3" seed="' + (sem + 13) + '" result="n"/>' +
      '<feDisplacementMap in="b" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      zrno(5, ".8", "-.25", "1.1") + '<feComposite in="d" in2="zA5" operator="in"/></filter>' +
    /* jemný tah: drobné tvary (koruny, domky, skály) */
    '<filter id="' + p + 'j" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="' + (sem + 11) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      zrno(9, "1.1", "-.4", "1.15") + '<feComposite in="d" in2="zA9" operator="in"/></filter>' +
    /* štětec: čáry (tráva, větve, vlnky) */
    '<filter id="' + p + 's" filterUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="290"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="' + (sem + 2) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.3"/></filter>' +
    /* zrno papíru přes celý obrázek */
    '<filter id="' + p + 'p" x="0" y="0" width="100%" height="100%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="4" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .28  0 0 0 .1 0"/></filter>' };
  }

  /* ---- základní tahy ---- */
  function plocha(F, filtr, d, barva, op){
    return '<path d="' + d + '" fill="' + barva + '" opacity="' + op + '" filter="url(#' + filtr + ')" style="mix-blend-mode:' + (svetla(barva) ? "normal" : "multiply") + '"/>';
  }
  const laz = function(F, d, b, op){ return plocha(F, F.lazura, d, b, op == null ? .8 : op); };
  const mok = function(F, d, b, op){ return plocha(F, F.mokra, d, b, op == null ? .6 : op); };
  /* papír pod bližší plochou, aby zakryla, co je za ní */
  const kryt = function(F, d, filtr){ return plocha(F, filtr || F.lazura, d, "#FBF7EE", .92); };
  const jem = function(F, d, b, op){ return plocha(F, F.jemna, d, b, op == null ? .88 : op); };
  /* lazura s přechodem uvnitř: nahoře světlejší (osvětlená hrana), dole tmavší */
  function vrstva(F, d, horni, dolni, op, filtr){
    const g = F.id + "g" + (++F.n);
    return '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + horni + '"/><stop offset="1" stop-color="' + dolni + '"/></linearGradient></defs>' +
      '<path d="' + d + '" fill="url(#' + g + ')" opacity="' + (op == null ? .85 : op) + '" filter="url(#' + (filtr || F.lazura) + ')" style="mix-blend-mode:multiply"/>';
  }
  /* skupina tahů s jedním filtrem (tráva, vlnky, květy) */
  function skupina(F, filtr, obsah, extra){ return '<g filter="url(#' + filtr + ')"' + (extra || "") + '>' + obsah + '</g>'; }
  function tah(d, barva, sirka, op){ return '<path d="' + d + '" stroke="' + barva + '" stroke-width="' + f1(sirka) + '" fill="none" stroke-linecap="round" opacity="' + (op == null ? .85 : op) + '"/>'; }

  function hrbet(y0, amp, per, faze, dno, krok){
    dno = dno == null ? H : dno; krok = krok || 5;
    let d = "M-10 " + dno + " L-10 " + f1(vyska(-10, y0, amp, per, faze));
    for (let x = -10; x <= W + 10; x += krok) d += " L" + x + " " + f1(vyska(x, y0, amp, per, faze));
    return d + " L" + (W + 10) + " " + dno + " Z";
  }
  function vyska(x, y0, amp, per, faze){ return y0 + Math.sin(x / per + faze) * amp + Math.sin(x / (per * .41) + faze * 1.7) * amp * .35 + Math.sin(x / (per * .17) + faze * 3.1) * amp * .08; }
  function hrana(y0, amp, per, faze){ let d = "M-10 " + f1(vyska(-10, y0, amp, per, faze)); for (let x = -5; x <= W + 10; x += 5) d += " L" + x + " " + f1(vyska(x, y0, amp, per, faze)); return d; }
  /* řada hřbetů od nejvzdálenějšího: s = [y, amplituda, perioda, fáze, barva, opar 0–1] */
  function hrebeny(F, rady){
    return rady.map(function(s){
      const b = mix(s[4], F.opar, s[5] || 0);
      /* napřed papír: bližší hřbet zakryje, co je za ním (akvarel se jinak prosvítá) */
      return plocha(F, F.lazura, hrbet(s[0], s[1], s[2], s[3]), "#FBF7EE", .9) + vrstva(F, hrbet(s[0], s[1], s[2], s[3]), mix(b, "#FFFFFF", .18), mix(b, "#1C2A1C", .12), s[6] == null ? .88 : s[6]) +
        skupina(F, F.stetec, tah(hrana(s[0], s[1], s[2], s[3]), mix(b, "#1B2230", .35), .7, .35));
    }).join("");
  }

  /* ---- nebe ---- */
  function nebe(F, horni, dolni, zare){
    F.opar = mix(dolni, horni, .35);
    const g = F.id + "nb";
    let o = '<rect width="' + W + '" height="' + H + '" fill="#FBF7EE"/>' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + horni + '"/><stop offset=".62" stop-color="' + mix(horni, dolni, .7) + '"/><stop offset="1" stop-color="' + dolni + '"/></linearGradient></defs>' +
      '<rect x="-30" y="-30" width="' + (W + 60) + '" height="' + (H * .8) + '" fill="url(#' + g + ')" opacity=".72" filter="url(#' + F.mokra + ')" style="mix-blend-mode:multiply"/>';
    if (zare) o += '<ellipse cx="' + zare[0] + '" cy="' + zare[1] + '" rx="170" ry="60" fill="' + zare[2] + '" opacity=".35" filter="url(#' + F.mokra + ')" style="mix-blend-mode:multiply"/>';
    return o;
  }
  /* kupovitý mrak: stínovaný spodek, pak bílý vršek */
  function mrak(F, r, x, y, w){
    let spod = "", vrch = "";
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const cx = x + (i - (n - 1) / 2) * w / n + (r() - .5) * 6, ry = w / n * (.55 + r() * .45), cy = y - ry * .3 - (i > 0 && i < n - 1 ? ry * .35 : 0);
      vrch += '<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(w / n * .75) + '" ry="' + f1(ry) + '"/>';
    }
    spod = '<ellipse cx="' + f1(x) + '" cy="' + f1(y + 3) + '" rx="' + f1(w * .55) + '" ry="' + f1(w * .09) + '"/>';
    return '<g fill="#B7BCCB" opacity=".45" filter="url(#' + F.mokra + ')" style="mix-blend-mode:multiply">' + spod + '</g>' +
           '<g fill="#FFFFFF" opacity=".85" filter="url(#' + F.mokra + ')">' + vrch + '</g>';
  }
  function mraky(F, r, n, y0, y1, w){ let o = ""; for (let i = 0; i < n; i++) o += mrak(F, r, 30 + r() * 340, y0 + r() * (y1 - y0), (w || 70) * (.6 + r() * .7)); return o; }
  /* protáhlé řasy mraků (cirry) */
  function rasy(F, r, n, y0, y1){ let o = ""; for (let i = 0; i < n; i++) o += '<ellipse cx="' + f1(r() * W) + '" cy="' + f1(y0 + r() * (y1 - y0)) + '" rx="' + f1(40 + r() * 70) + '" ry="' + f1(2 + r() * 3) + '"/>';
    return '<g fill="#FFFFFF" opacity=".7" filter="url(#' + F.mokra + ')">' + o + '</g>'; }
  function slunce(F, x, y, rr, barva){ return '<circle cx="' + x + '" cy="' + y + '" r="' + (rr * 2.2) + '" fill="' + (barva || "#F6C98A") + '" opacity=".3" filter="url(#' + F.mokra + ')" style="mix-blend-mode:multiply"/>' +
    '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" fill="' + (barva || "#F2B880") + '" opacity=".75" filter="url(#' + F.lazura + ')" style="mix-blend-mode:multiply"/>'; }
  function ptaci(F, r, n, x, y){ let o = ""; for (let i = 0; i < n; i++) { const px = x + i * 11 + r() * 9, py = y + r() * 10, s = 2 + r() * 2;
    o += tah("M" + f1(px - s) + " " + f1(py) + " q" + f1(s / 2) + " " + f1(-s * .7) + " " + f1(s) + " 0 q" + f1(s / 2) + " " + f1(-s * .7) + " " + f1(s) + " 0", "#3A4050", .8, .75); }
    return skupina(F, F.stetec, o); }

  /* ---- vegetace ---- */
  /* listnatý strom: kmen a koruna z několika tónů (stín vpravo dole, světlo vlevo nahoře) */
  function strom(F, r, x, y, s, zelen){
    zelen = zelen || "#5E8A45";
    let o = skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(y) + " L" + f1(x + .6) + " " + f1(y - 13 * s) + " M" + f1(x + .4) + " " + f1(y - 8 * s) + " l" + f1(3 * s) + " " + f1(-4 * s), "#4E3E2E", 1.3 * s, .9));
    const tony = [mix(zelen, "#1E2E1A", .35), zelen, mix(zelen, "#E8E08A", .3)];
    let k = "", sv = "";
    for (let t = 0; t < 3; t++) for (let i = 0; i < 3; i++) {
      const dx = (r() - .5) * 9 * s + (t === 0 ? 2.5 : t === 2 ? -2.5 : 0) * s, dy = (t === 0 ? 2 : t === 2 ? -3 : 0) * s - (r() * 5) * s;
      const e = '<ellipse cx="' + f1(x + dx) + '" cy="' + f1(y - 17 * s + dy) + '" rx="' + f1((4 + r() * 3) * s * (t === 2 ? .7 : 1)) + '" ry="' + f1((3.5 + r() * 2.5) * s * (t === 2 ? .7 : 1)) + '" fill="' + tony[t] + '"/>';
      if (t === 2) sv += e; else k += e;
    }
    /* světlá temena se nenásobí, jinak by koruna jen ztmavla */
    return o + '<g opacity=".88" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + k + '</g><g opacity=".5" filter="url(#' + F.jemna + ')">' + sv + '</g>';
  }
  /* pás lesa na horizontu: husté drobné koruny */
  function lesik(F, r, x0, x1, y, s, zelen, jehl){
    let k = "";
    for (let x = x0; x < x1; x += (jehl ? 4 : 5) * s + r() * 3) {
      const h = (jehl ? 12 : 7) * s * (.7 + r() * .6), c = mix(zelen, r() < .5 ? "#1E2E1A" : "#C8D08A", r() * .3);
      k += jehl ? '<path d="M' + f1(x - 3 * s) + " " + f1(y) + " L" + f1(x) + " " + f1(y - h) + " L" + f1(x + 3 * s) + " " + f1(y) + ' Z" fill="' + c + '"/>'
                : '<ellipse cx="' + f1(x) + '" cy="' + f1(y - h * .6) + '" rx="' + f1(3.5 * s + r() * 2) + '" ry="' + f1(h * .6) + '" fill="' + c + '"/>';
    }
    return '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + k + '</g>';
  }
  function palma(F, r, x, y, s, barva){
    barva = barva || "#3F7A3E";
    let kmen = "";
    for (let i = 0; i < 9; i++) { const t = i / 9, px = x + 8 * s * Math.sin(t * 1.4) * t, py = y - 60 * s * t; kmen += tah("M" + f1(px - 1.6 * s) + " " + f1(py) + " l" + f1(3.2 * s) + " -1", "#5A4430", .6 * s, .7); }
    let o = skupina(F, F.stetec, tah("M" + x + " " + y + " Q" + f1(x + 9 * s) + " " + f1(y - 30 * s) + " " + f1(x + 3 * s) + " " + f1(y - 60 * s), "#7A6048", 3 * s, .9) + kmen);
    const tx = x + 3 * s, ty = y - 60 * s;
    let l = "";
    [[-36, 12], [-26, -6], [-4, -16], [22, -8], [36, 10], [-12, 16], [14, 18]].forEach(function(v){ const dx = v[0] * s, dy = v[1] * s;
      l += '<path d="M' + f1(tx) + " " + f1(ty) + " Q" + f1(tx + dx * .5) + " " + f1(ty + dy - 14 * s) + " " + f1(tx + dx) + " " + f1(ty + dy) + " Q" + f1(tx + dx * .45) + " " + f1(ty + dy - 5 * s) + " " + f1(tx) + " " + f1(ty) + ' Z" fill="' + mix(barva, v[1] > 0 ? "#12240F" : "#D8E08A", .2) + '"/>'; });
    return o + '<g opacity=".9" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + l + '</g>';
  }
  function trava(F, r, n, y0, y1, barvy){
    let o = "";
    for (let i = 0; i < n; i++) { const x = r() * W, y = y0 + r() * (y1 - y0), h = (2.5 + r() * 6) * (.6 + (y - y0) / (y1 - y0 + 1));
      o += tah("M" + f1(x) + " " + f1(y) + " q" + f1((r() - .5) * 2) + " " + f1(-h * .6) + " " + f1((r() - .5) * 4) + " " + f1(-h), barvy[i % barvy.length], .45 + r() * .45, .75); }
    return skupina(F, F.stetec, o);
  }
  function kvety(F, r, n, y0, y1, barvy, vel){
    let o = "";
    for (let i = 0; i < n; i++) o += '<circle cx="' + f1(r() * W) + '" cy="' + f1(y0 + r() * (y1 - y0)) + '" r="' + f1((vel || 1.1) * (.6 + r() * .8)) + '" fill="' + barvy[i % barvy.length] + '"/>';
    return '<g opacity=".9" filter="url(#' + F.jemna + ')">' + o + '</g>';
  }
  /* voda: přechod, světlé pruhy odlesků a drobné vlnky */
  function voda(F, r, d, horni, dolni, y0, y1, n){
    /* voda leží na papíru, jinak by se jí prosvítala tráva a vyšla tmavá */
    let o = kryt(F, d) + vrstva(F, d, horni, dolni, .85), p = "";
    for (let i = 0; i < (n || 14); i++) { const y = y0 + Math.pow(r(), 1.4) * (y1 - y0), x = r() * 380, w = 8 + r() * 26 * (1 + (y - y0) / (y1 - y0 + 1));
      p += tah("M" + f1(x) + " " + f1(y) + " q" + f1(w / 2) + " -1 " + f1(w) + " 0", "#FFFFFF", .5 + r() * .7, .7); }
    for (let i = 0; i < 5; i++) { const y = y0 + 2 + i * (y1 - y0) / 6; p += tah("M-10 " + f1(y) + " L410 " + f1(y + (r() - .5) * 2), "#FFFFFF", .4, .25); }
    const c = F.id + "vc" + (++F.n);
    return o + '<defs><clipPath id="' + c + '"><path d="' + d + '"/></clipPath></defs><g clip-path="url(#' + c + ')">' + skupina(F, F.stetec, p) + '</g>';
  }
  /* zlomená čára: půlení úseků s náhodným vychýlením (hřebeny, žebra, okraje skal) */
  function clenit(body, r, jx, jy, kroky){
    let b = body.map(function(p){ return [p[0], p[1]]; });
    for (let k = 0; k < (kroky || 4); k++) { const n = [b[0]];
      for (let i = 1; i < b.length; i++) { const a = b[i - 1], c = b[i], l = Math.hypot(c[0] - a[0], c[1] - a[1]) / Math.pow(1.6, k * .35);
        n.push([(a[0] + c[0]) / 2 + (r() - .5) * l * jx, (a[1] + c[1]) / 2 + (r() - .5) * l * jy]); n.push(c); }
      b = n; }
    return b;
  }
  const cesta = function(b){ return b.map(function(p, i){ return (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); }).join(" "); };
  /* pohoří: rozeklaný obrys, stinná strana za žebrem od vrcholu, žlaby, sníh s jazyky do žlabů, opar u paty.
     Hrubost obrysu má vlastní náhodu podle tvaru, takže odraz ve vodě je stejný jako hora. */
  function hory(F, r, body, dno, barva, stin, snih, drs){
    let sm = F.sem; body.forEach(function(b){ sm += b[0] * 7 + b[1] * 13; });
    const q = nahoda(Math.abs(Math.round(sm)) + 1), K = 16;
    drs = drs == null ? .2 : drs;
    const obr = clenit(body, q, .05, drs, 4);
    let o = vrstva(F, "M-10 " + dno + " " + cesta(obr).replace(/^M/, "L") + " L410 " + dno + " Z", mix(barva, "#FFFFFF", .3), mix(barva, "#FFFFFF", .05), .9);
    let st = "", sn = "", zl = "", sv = "";
    for (let i = 1; i < body.length - 1; i++) { const b = body[i], p = body[i - 1];
      if (!(b[1] < p[1] && b[1] < body[i + 1][1])) continue;
      /* stinná strana sahá až do sedla (u sopky až k patě), ne jen k dalšímu bodu obrysu */
      let vi = i + 1; while (vi < body.length - 1 && body[vi + 1][1] > body[vi][1]) vi++;
      let vl = i - 1; while (vl > 0 && body[vl - 1][1] > body[vl][1]) vl--;
      const n = body[vi], ip = i * K, iv = vi * K, dx = n[0] - b[0], vys = dno - b[1];
      /* žebro od vrcholu k patě: napřed prudce dolů, pak ven */
      const zebro = clenit([[b[0], b[1]], [b[0] + dx * .12, b[1] + vys * .3], [b[0] + dx * .2, b[1] + vys * .68], [b[0] + dx * .24, dno + 2]], q, .3, .08, 3);
      /* stinná strana končí šikmo: osvětlený svah sousední hory ji dole překrývá */
      const lem = clenit([[n[0] - dx * .12, dno + 2], [n[0], n[1]]], q, .25, .05, 3).slice(0, -1);
      st += cesta(zebro) + " " + cesta(lem).replace(/^M/, "L") + " " + cesta(obr.slice(ip, iv + 1).reverse()).replace(/^M/, "L") + " Z ";
      /* žlaby na obou svazích po spádnici */
      for (let k = 0; k < 9; k++) { const lev = k < 4, t = .12 + q() * .6,
        a = lev ? obr[Math.round(ip - K * t)] : obr[Math.round(ip + K * t)];
        if (!a) continue;
        const dl = 10 + q() * 26, sm2 = lev ? -1 : 1, z = clenit([[a[0], a[1] + 2], [a[0] + sm2 * dl * .18, a[1] + dl * .55], [a[0] + sm2 * dl * .28, a[1] + dl]], q, .6, .1, 2);
        const d = cesta(z);
        if (lev) sv += tah(d, mix(barva, "#1B2230", .35), .55, .45); else zl += tah(d, mix(stin, "#10141E", .3), .6, .5); }
      if (snih && b[1] < snih) {
        const hl = Math.min(44, 16 + (snih - b[1]) * .55), mez = b[1] + hl;
        let l = ip, pr = ip;
        while (l > vl * K && obr[l - 1][1] < mez) l--;
        while (pr < iv && obr[pr + 1][1] < mez) pr++;
        const L = obr[l], R = obr[pr], m = 6 + Math.floor(q() * 4 + (obr[pr][0] - obr[l][0]) / 30);
        let spod = "";
        /* spodní okraj sněhu: nepravidelné jazyky, občas dlouhý do žlabu */
        for (let k = 1; k < m; k++) { const t = (k + (q() - .5) * .6) / m, x = R[0] + (L[0] - R[0]) * t, okraj = Math.pow(Math.sin(t * Math.PI), .7);
          const jazyk = k % 2 ? hl * (q() < .3 ? .5 + q() * .5 : .05 + q() * .3) : -hl * (.1 + q() * .3);
          const y = (R[1] + (L[1] - R[1]) * t) * (1 - okraj) + (mez + jazyk) * okraj;
          spod += " L" + f1(x + (q() - .5) * 2) + " " + f1(Math.min(y, dno - 3)); }
        sn += cesta(obr.slice(l, pr + 1)) + spod + " Z "; }
    }
    if (sn) o += jem(F, sn, "#FFFFFF", .97);
    o += skupina(F, F.stetec, sv) + vrstva(F, st, stin, mix(stin, F.opar, .45), .55) + skupina(F, F.stetec, zl);
    if (sn) o += laz(F, sn, mix(stin, "#E8EEF8", .6), .18);
    /* opar u paty: hora se ztrácí do dálky */
    const g = F.id + "op" + (++F.n), top = Math.min.apply(null, body.map(function(b){ return b[1]; }));
    o += '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + F.opar + '" stop-opacity="0"/><stop offset="1" stop-color="' + F.opar + '" stop-opacity=".75"/></linearGradient></defs>' +
      '<path d="M-10 ' + dno + ' ' + cesta(obr).replace(/^M/, "L") + ' L410 ' + dno + ' Z" fill="url(#' + g + ')" filter="url(#' + F.mokra + ')" style="mix-blend-mode:normal" opacity="' + (top < dno - 40 ? .8 : .5) + '"/>';
    return o;
  }
  /* terasy po vrstevnicích svahu: pruhy políček oddělené kamennými zídkami */
  function terasy(F, r, y0, n, krok, amp, per, faze, barvy, zed){
    let o = "", z = "";
    for (let i = 0; i < n; i++) { const a = y0 + i * krok * (1 + i * .05), b = y0 + (i + 1) * krok * (1 + (i + 1) * .05), c = barvy[i % barvy.length];
      const hor = [], dol = [];
      for (let x = -10; x <= W + 10; x += 5) { hor.push([x, vyska(x, a, amp, per, faze)]); dol.unshift([x, vyska(x, b, amp, per, faze)]); }
      const d = cesta(hor.concat(dol)) + " Z";
      o += vrstva(F, d, mix(c, "#FFFFFF", .22), mix(c, "#2A2A12", .12), .78);
      z += tah(hrana(b, amp, per, faze), zed || "#7A6A52", .9 + i * .08, .55) + tah(hrana(b - 1.2, amp, per, faze), "#E6DEB8", .5, .35); }
    return o + skupina(F, F.stetec, z);
  }
  /* husté koruny (prales, háje): tmavý spodek a střední tón se násobí, světlá temena vlevo nahoře leží navrch */
  function koruny(F, r, x0, x1, y, s, zelen, op, filtr){
    const t = ["", "", ""];
    for (let x = x0; x < x1; x += (5 + r() * 7) * s) {
      /* každá koruna trochu jiný odstín: do žluta, nebo do modra */
      const z = mix(zelen, r() < .5 ? "#B4C050" : "#2E6A5E", r() * .35), rx = (6 + r() * 6) * s, cy = y - (3 + r() * 10) * s;
      t[0] += '<ellipse cx="' + f1(x + 1.5 * s) + '" cy="' + f1(cy + 2.5 * s) + '" rx="' + f1(rx) + '" ry="' + f1(rx * .78) + '" fill="' + mix(z, "#142414", .3) + '"/>';
      t[1] += '<ellipse cx="' + f1(x - .5 * s) + '" cy="' + f1(cy) + '" rx="' + f1(rx * .72) + '" ry="' + f1(rx * .6) + '" fill="' + z + '"/>';
      if (r() < .75) t[2] += '<ellipse cx="' + f1(x - 2.5 * s - rx * .2) + '" cy="' + f1(cy - 2.5 * s) + '" rx="' + f1(rx * .36) + '" ry="' + f1(rx * .26) + '" fill="' + mix(z, "#EEF0A8", .45) + '"/>';
    }
    const fl = filtr || (s < .55 ? F.mokra : F.jemna);
    return '<g opacity="' + (op || .88) + '" filter="url(#' + fl + ')" style="mix-blend-mode:multiply">' + t[0] + t[1] + '</g>' +
      '<g opacity="' + ((op || .88) * .55) + '" filter="url(#' + fl + ')">' + t[2] + '</g>';
  }
  /* pás lesa: papír, podklad, koruny po horním okraji */
  function pas(F, r, y, s, zelen, x0, x1, dno){
    x0 = x0 == null ? -20 : x0; x1 = x1 == null ? W + 20 : x1;
    const d = "M" + x0 + " " + (dno || H + 5) + " L" + x0 + " " + f1(y - 4 * s) + " L" + x1 + " " + f1(y - 4 * s) + " L" + x1 + " " + (dno || H + 5) + " Z";
    /* koruny ve třech řadách za sebou, přední překrývají zadní */
    return kryt(F, d) + vrstva(F, d, zelen, mix(zelen, "#142414", .35), .85) + koruny(F, r, x0 + 4, x1 - 4, y, s, zelen) +
      koruny(F, r, x0 + 8, x1 - 4, y + 9 * s, s * .9, mix(zelen, "#142414", .12)) + koruny(F, r, x0 + 2, x1 - 4, y + 17 * s, s * .8, mix(zelen, "#142414", .22));
  }
  /* mlha: bílý rozpitý pruh */
  function mlha(F, y0, y1, op){ return mok(F, "M-20 " + y0 + " Q200 " + (y0 - 4) + " 420 " + y0 + " L420 " + y1 + " Q200 " + (y1 + 3) + " -20 " + y1 + " Z", "#FFFFFF", op == null ? .5 : op); }
  /* velký list (banánovník) od řapíku v bodě x,y směrem uhel */
  function list(F, x, y, dl, uhel, zelen){
    const c = Math.cos(uhel), s = Math.sin(uhel), w = dl * .24;
    const P = function(t, o){ return f1(x + c * dl * t - s * o) + " " + f1(y + s * dl * t + c * o); };
    const d = "M" + P(0, 0) + " Q" + P(.28, w * 1.15) + " " + P(.58, w * .95) + " Q" + P(.9, w * .45) + " " + P(1, 0) + " Q" + P(.9, -w * .4) + " " + P(.58, -w * .9) + " Q" + P(.28, -w * 1.1) + " " + P(0, 0) + " Z";
    let z = tah("M" + P(0, 0) + " Q" + P(.5, w * .08) + " " + P(1, 0), mix(zelen, "#EEF0B8", .45), 1, .75);
    for (let k = 1; k < 10; k++) { const t = k / 11, sir = w * .85 * Math.sin((t * .9 + .08) * Math.PI);
      z += tah("M" + P(t, 0) + " L" + P(t + .07, sir), mix(zelen, "#0E1E0E", .35), .45, .45) + tah("M" + P(t, 0) + " L" + P(t + .07, -sir), mix(zelen, "#0E1E0E", .35), .45, .45); }
    return kryt(F, d, F.jemna) + vrstva(F, d, mix(zelen, "#E8F0A0", .12), mix(zelen, "#0E1E0E", .3), .95, F.jemna) + skupina(F, F.stetec, z);
  }
  /* řada keřů po vrstevnici (čaj, vinice) */
  function radaKeru(F, r, y0, amp, per, faze, s, zelen){
    let t = ["", ""];
    for (let x = -8; x < W + 8; x += 3.2 * s + r() * 2) { const y = vyska(x, y0, amp, per, faze);
      t[0] += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(4.2 * s) + '" ry="' + f1(3 * s) + '"/>';
      if (r() < .6) t[1] += '<ellipse cx="' + f1(x - s) + '" cy="' + f1(y - 1.6 * s) + '" rx="' + f1(2 * s) + '" ry="' + f1(1.1 * s) + '"/>'; }
    return '<g fill="' + mix(zelen, "#142414", .2) + '" opacity=".88" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + t[0] + '</g>' +
      '<g fill="' + mix(zelen, "#F0F0A8", .45) + '" opacity=".6" filter="url(#' + F.jemna + ')">' + t[1] + '</g>';
  }
  /* duna: hladký obrys, od každého vrcholu se dolů stáčí ostrý hřbet; vlevo od něj světlo, vpravo stín */
  function duna(F, r, y0, amp, per, faze, svetly, stinovy){
    const yy = function(x){ return y0 + Math.sin(x / per + faze) * amp + Math.sin(x / (per * .47) + faze * 2.1) * amp * .3; };
    const b = []; for (let x = -12; x <= W + 12; x += 4) b.push([x, yy(x)]);
    const d = "M-12 " + (H + 5) + " " + cesta(b).replace(/^M/, "L") + " L" + (W + 12) + " " + (H + 5) + " Z";
    let o = kryt(F, d) + vrstva(F, d, mix(svetly, "#FFFFFF", .18), svetly, .9), st = "", hr = "", vl = "";
    for (let i = 1; i < b.length - 1; i++) {
      if (!(b[i][1] <= b[i - 1][1] && b[i][1] < b[i + 1][1])) continue;
      let j = i + 1; while (j < b.length - 1 && b[j + 1][1] > b[j][1]) j++;
      const t = b[i], dx = Math.max(24, b[j][0] - t[0]), hl = 34 + amp * 2;
      const k1 = [t[0] + dx * .12, t[1] + hl * .45], k2 = [t[0] + dx * .5, t[1] + hl];
      /* spodek stínu běží souběžně s obrysem, takže ho další duna schová */
      const spod = b.slice(i, j + 1).filter(function(p){ return p[0] > k2[0]; }).map(function(p){ return "L" + f1(p[0] + 6) + " " + f1(p[1] + hl); }).join(" ");
      st += "M" + f1(t[0]) + " " + f1(t[1]) + " Q" + f1(k1[0]) + " " + f1(k1[1]) + " " + f1(k2[0]) + " " + f1(k2[1]) + " " + spod + " " + cesta(b.slice(i, j + 1).reverse()).replace(/^M/, "L") + " Z ";
      hr += "M" + f1(t[0] - .8) + " " + f1(t[1] + .5) + " Q" + f1(k1[0] - 1) + " " + f1(k1[1]) + " " + f1(k2[0] - 1) + " " + f1(k2[1]) + " ";
    }
    for (let i = 0; i < 18; i++) { const x = r() * W, y = yy(x) + 8 + r() * 36, w = 10 + r() * 22;
      vl += tah("M" + f1(x) + " " + f1(y) + " q" + f1(w * .5) + " " + f1(-1.5 - r() * 2) + " " + f1(w) + " " + f1(r() * 2 - 1), mix(stinovy, svetly, .45), .5, .3); }
    return o + vrstva(F, st, stinovy, mix(stinovy, svetly, .45), .55) + skupina(F, F.stetec, '<path d="' + hr + '" stroke="#FFF6E2" stroke-width="1.2" fill="none" opacity=".7"/>' + vl);
  }
  /* jehličnan: převislá patra s roztřepeným spodkem, tmavší dole, světlé konce větví vlevo */
  function jehlicnan(F, r, x, y, s, barva){
    let k = "", sv = "";
    const n = 8, h = 46 * s;
    for (let i = 0; i < n; i++) {
      const t = i / n, yy = y - 3 * s - t * h * .9, w = (10 * (1 - t) + 1.4) * s * (.9 + r() * .2), hh = 8 * s;
      let d = "M" + f1(x - w) + " " + f1(yy + 1.8 * s) + " Q" + f1(x - w * .4) + " " + f1(yy - hh * .25) + " " + f1(x) + " " + f1(yy - hh) + " Q" + f1(x + w * .4) + " " + f1(yy - hh * .25) + " " + f1(x + w) + " " + f1(yy + 1.8 * s);
      for (let z = 5; z >= 1; z--) d += " L" + f1(x - w + 2 * w * z / 6) + " " + f1(yy + (z % 2 ? -.2 : 1.4) * s);
      k += '<path d="' + d + ' Z" fill="' + mix(barva, "#0A140E", .28 * (1 - t)) + '"/>';
      sv += '<ellipse cx="' + f1(x - w * .5) + '" cy="' + f1(yy - hh * .15) + '" rx="' + f1(w * .32) + '" ry="' + f1(1.3 * s) + '"/>';
    }
    return skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(y + 2 * s) + " L" + f1(x) + " " + f1(y - 5 * s), "#3A2E22", 1.3 * s, .9) + tah("M" + f1(x) + " " + f1(y - h - 2 * s) + " l0 " + f1(-5 * s), mix(barva, "#0A140E", .1), .9 * s, .9)) +
      '<g opacity=".92" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + k + '</g><g fill="' + mix(barva, "#DCE8A8", .45) + '" opacity=".45" filter="url(#' + F.jemna + ')">' + sv + '</g>';
  }
  /* bříza: bílý kmen s černými znaménky, převislé větvičky, drobné listí */
  function briza(F, r, x, y, s){
    const h = 64 * s;
    const d = "M" + f1(x - 1.5 * s) + " " + f1(y) + " Q" + f1(x - 1.2 * s) + " " + f1(y - h * .5) + " " + f1(x + .6 * s) + " " + f1(y - h) + " L" + f1(x + 1.2 * s) + " " + f1(y - h) + " Q" + f1(x + 1.6 * s) + " " + f1(y - h * .5) + " " + f1(x + 1.5 * s) + " " + f1(y) + " Z";
    let o = jem(F, d, "#F6F3EC", .97) + laz(F, "M" + f1(x + .3 * s) + " " + f1(y) + " Q" + f1(x + .5 * s) + " " + f1(y - h * .5) + " " + f1(x + 1 * s) + " " + f1(y - h) + " L" + f1(x + 1.2 * s) + " " + f1(y - h) + " Q" + f1(x + 1.6 * s) + " " + f1(y - h * .5) + " " + f1(x + 1.5 * s) + " " + f1(y) + " Z", "#A8A49A", .45);
    let zn = "", vet = "", li = "", sv = "";
    for (let i = 0; i < 11; i++) { const yy = y - 3 * s - r() * h * .85; zn += tah("M" + f1(x - 1.4 * s) + " " + f1(yy) + " l" + f1((1 + r() * 1.6) * s) + " " + f1((r() - .5) * .6), "#262626", (.5 + r() * .5) * s, .85); }
    for (let i = 0; i < 7; i++) { const yy = y - h * (.42 + i * .07), sm = i % 2 ? 1 : -1, l = (4 + r() * 5) * s;
      vet += tah("M" + f1(x + .5 * s) + " " + f1(yy) + " q" + f1(sm * l * .6) + " " + f1(-l * .5) + " " + f1(sm * l) + " " + f1(-l * .2), "#5A4A3E", .45 * s, .6); }
    for (let i = 0; i < 110; i++) { const a = r() * 6.283, rr = Math.sqrt(r()), ex = x + Math.cos(a) * rr * 13 * s, ey = y - h * .64 + Math.sin(a) * rr * 24 * s + rr * 4 * s;
      li += '<ellipse cx="' + f1(ex) + '" cy="' + f1(ey) + '" rx="' + f1((1 + r() * 1.1) * s) + '" ry="' + f1((.7 + r() * .6) * s) + '" fill="' + mix("#7E9E3E", r() < .5 ? "#C8D060" : "#3E6A2E", r() * .4) + '"/>';
      if (ex < x && r() < .5) sv += '<ellipse cx="' + f1(ex - s) + '" cy="' + f1(ey - s) + '" rx="' + f1(1.2 * s) + '" ry="' + f1(.8 * s) + '"/>'; }
    return o + skupina(F, F.stetec, zn + vet) + '<g opacity=".72" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + li + '</g><g fill="#E6EC9A" opacity=".55" filter="url(#' + F.jemna + ')">' + sv + '</g>';
  }
  /* akácie: rozvětvený kmen a plochá vrstvená koruna */
  function akacie(F, r, x, y, s){
    let t = tah("M" + f1(x) + " " + f1(y) + " C" + f1(x) + " " + f1(y - 14 * s) + " " + f1(x - 2 * s) + " " + f1(y - 20 * s) + " " + f1(x - 9 * s) + " " + f1(y - 25 * s) + " M" + f1(x) + " " + f1(y - 11 * s) + " C" + f1(x + 4 * s) + " " + f1(y - 18 * s) + " " + f1(x + 8 * s) + " " + f1(y - 22 * s) + " " + f1(x + 12 * s) + " " + f1(y - 25 * s), "#4A3A2A", 1.5 * s, .9) +
      tah("M" + f1(x - 4 * s) + " " + f1(y - 21 * s) + " l" + f1(-7 * s) + " " + f1(-3 * s) + " M" + f1(x + 6 * s) + " " + f1(y - 19 * s) + " l" + f1(10 * s) + " " + f1(-4 * s), "#4A3A2A", .7 * s, .8);
    let tm = "", st = "", sv = "";
    tm += '<ellipse cx="' + f1(x + 1.5 * s) + '" cy="' + f1(y - 25 * s) + '" rx="' + f1(22 * s) + '" ry="' + f1(3 * s) + '"/>';
    for (let i = 0; i < 9; i++) { const cx = x + (i - 4) * 4.6 * s + (r() - .5) * 3 * s, cy = y - 27.5 * s - Math.sin((i / 8) * 3.14) * 2.5 * s - r() * 1.5 * s;
      st += '<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1((4.5 + r() * 2.5) * s) + '" ry="' + f1((2 + r()) * s) + '"/>';
      if (r() < .7) sv += '<ellipse cx="' + f1(cx - 1.5 * s) + '" cy="' + f1(cy - 1.4 * s) + '" rx="' + f1(2.6 * s) + '" ry="' + f1(.9 * s) + '"/>'; }
    return skupina(F, F.stetec, t) + '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply"><g fill="#3E4E2A">' + tm + '</g><g fill="#6E8442">' + st + '</g></g><g fill="#D6D88E" opacity=".5" filter="url(#' + F.jemna + ')">' + sv + '</g>';
  }
  /* baobab: tlustý hladký kmen, krátké větve s chomáči listí */
  function baobab(F, r, x, y, s){
    const d = "M" + f1(x - 6 * s) + " " + f1(y) + " Q" + f1(x - 7.4 * s) + " " + f1(y - 36 * s) + " " + f1(x - 4.6 * s) + " " + f1(y - 74 * s) + " L" + f1(x + 4.6 * s) + " " + f1(y - 74 * s) + " Q" + f1(x + 7.4 * s) + " " + f1(y - 36 * s) + " " + f1(x + 6 * s) + " " + f1(y) + " Z";
    let o = kryt(F, d, F.jemna) + vrstva(F, d, "#C4A898", "#8E7064", .95, F.jemna) + laz(F, "M" + f1(x + 1.5 * s) + " " + f1(y) + " Q" + f1(x + 3 * s) + " " + f1(y - 36 * s) + " " + f1(x + 1.4 * s) + " " + f1(y - 74 * s) + " L" + f1(x + 4.6 * s) + " " + f1(y - 74 * s) + " Q" + f1(x + 7.4 * s) + " " + f1(y - 36 * s) + " " + f1(x + 6 * s) + " " + f1(y) + " Z", "#6A4E48", .4);
    let vet = "", kr = "";
    [[-16, -14], [-9, -20], [-2, -22], [6, -21], [13, -15], [18, -8]].forEach(function(k){ const ex = x + k[0] * s, ey = y - 74 * s + k[1] * s;
      vet += tah("M" + f1(x + k[0] * .2 * s) + " " + f1(y - 72 * s) + " Q" + f1(x + k[0] * .6 * s) + " " + f1(y - 76 * s + k[1] * .4 * s) + " " + f1(ex) + " " + f1(ey), "#7A5E52", 1.6 * s, .9);
      kr += '<ellipse cx="' + f1(ex) + '" cy="' + f1(ey - 1.5 * s) + '" rx="' + f1(4.5 * s) + '" ry="' + f1(2.4 * s) + '" fill="' + ["#5E7A40", "#6E8A4A", "#4E6A36"][Math.floor(r() * 3)] + '"/>'; });
    return o + skupina(F, F.stetec, vet) + '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + kr + '</g>';
  }
  /* kulatá chýše: hliněná stěna, doškový kužel */
  function chyse(F, r, x, y, s){
    const st = "M" + f1(x - 7 * s) + " " + f1(y) + " L" + f1(x - 7 * s) + " " + f1(y - 8 * s) + " L" + f1(x + 7 * s) + " " + f1(y - 8 * s) + " L" + f1(x + 7 * s) + " " + f1(y) + " Q" + f1(x) + " " + f1(y + 1.6 * s) + " " + f1(x - 7 * s) + " " + f1(y) + " Z";
    const kr = "M" + f1(x - 9.5 * s) + " " + f1(y - 7 * s) + " Q" + f1(x - 3 * s) + " " + f1(y - 15 * s) + " " + f1(x) + " " + f1(y - 20 * s) + " Q" + f1(x + 3 * s) + " " + f1(y - 15 * s) + " " + f1(x + 9.5 * s) + " " + f1(y - 7 * s) + " Q" + f1(x) + " " + f1(y - 5 * s) + " " + f1(x - 9.5 * s) + " " + f1(y - 7 * s) + " Z";
    let d = ""; for (let i = 0; i < 9; i++) { const t = i / 8; d += tah("M" + f1(x) + " " + f1(y - 19 * s) + " L" + f1(x - 9 * s + 18 * s * t) + " " + f1(y - 6.5 * s + Math.sin(t * 3.14) * 1.2 * s), "#6E5430", .35 * s, .5); }
    return kryt(F, st + " " + kr, F.jemna) + vrstva(F, st, "#D6A87C", "#A8784E", .92, F.jemna) + laz(F, "M" + f1(x + 2 * s) + " " + f1(y) + " L" + f1(x + 2 * s) + " " + f1(y - 8 * s) + " L" + f1(x + 7 * s) + " " + f1(y - 8 * s) + " L" + f1(x + 7 * s) + " " + f1(y) + " Z", "#7A5234", .35) +
      jem(F, "M" + f1(x - 3 * s) + " " + f1(y) + " l0 " + f1(-5 * s) + " l" + f1(2.6 * s) + " 0 l0 " + f1(5 * s) + " z", "#4A3222", .8) + vrstva(F, kr, "#C8AA6A", "#8A6A3A", .92, F.jemna) + skupina(F, F.stetec, d);
  }
  /* oliva: pokroucený kmen a stříbřitě zelená řídká koruna */
  function oliva(F, r, x, y, s){
    let t = tah("M" + f1(x - 2 * s) + " " + f1(y) + " C" + f1(x + 2 * s) + " " + f1(y - 6 * s) + " " + f1(x - 4 * s) + " " + f1(y - 10 * s) + " " + f1(x) + " " + f1(y - 16 * s), "#5E5046", 2.4 * s, .9) +
      tah("M" + f1(x + 1 * s) + " " + f1(y) + " C" + f1(x + 3 * s) + " " + f1(y - 7 * s) + " " + f1(x + 1 * s) + " " + f1(y - 11 * s) + " " + f1(x + 5 * s) + " " + f1(y - 15 * s), "#6E6054", 1.6 * s, .85);
    let k = "", sv = "";
    for (let i = 0; i < 26; i++) { const a = r() * 6.283, rr = Math.sqrt(r()), ex = x + 1.5 * s + Math.cos(a) * rr * 13 * s, ey = y - 21 * s + Math.sin(a) * rr * 7 * s;
      k += '<ellipse cx="' + f1(ex) + '" cy="' + f1(ey) + '" rx="' + f1((2.2 + r() * 2) * s) + '" ry="' + f1((1.4 + r()) * s) + '" fill="' + mix("#7C8A5E", r() < .5 ? "#4E5E3E" : "#A8B08A", r() * .5) + '"/>';
      if (r() < .45) sv += '<ellipse cx="' + f1(ex - s) + '" cy="' + f1(ey - s) + '" rx="' + f1(1.6 * s) + '" ry="' + f1(.8 * s) + '"/>'; }
    return skupina(F, F.stetec, t) + '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + k + '</g><g fill="#DCE0C4" opacity=".6" filter="url(#' + F.jemna + ')">' + sv + '</g>';
  }
  /* cypřiš: úzký plamen, světlejší levý okraj */
  function cypris(F, r, x, y, h, s){
    const w = h * .11;
    const d = "M" + f1(x) + " " + f1(y) + " Q" + f1(x - w * 1.3) + " " + f1(y - h * .45) + " " + f1(x - w * .2) + " " + f1(y - h) + " Q" + f1(x + w * 1.4) + " " + f1(y - h * .45) + " " + f1(x) + " " + f1(y) + " Z";
    let t = ""; for (let i = 0; i < 9; i++) { const yy = y - h * (.1 + i * .09); t += tah("M" + f1(x - w * .7) + " " + f1(yy) + " q" + f1(w * .4) + " " + f1(-3) + " " + f1(w * .8) + " " + f1(-1), "#A8BC7A", .6, .45); }
    return kryt(F, d, F.jemna) + vrstva(F, d, "#4E6E48", "#2A4030", .95, F.jemna) + skupina(F, F.stetec, t);
  }
  /* pole v perspektivě: pruhy k obzoru, každý rozdělený na lány různých barev; bližší lány mají řádky k úběžníku */
  function pole(F, r, yh, vx, barvy, stromy){
    const kx = function(xb, y){ return vx + (xb - vx) * (y - yh) / (H - yh); }, by = [];
    for (let i = 0; yh + 1.6 * (Math.pow(1.52, i) - 1) < H + 40; i++) by.push(yh + 1.6 * (Math.pow(1.52, i) - 1));
    const cesty = barvy.map(function(){ return ""; });
    let rady = "", meze = "";
    for (let i = 0; i < by.length - 1; i++) {
      const a = by[i], b = by[i + 1];
      for (let xb = -1400 + r() * 200; xb < 1800;) { const w = 160 + r() * 420, c = Math.floor(r() * barvy.length);
        cesty[c] += "M" + f1(kx(xb, a)) + " " + f1(a) + " L" + f1(kx(xb + w, a)) + " " + f1(a) + " L" + f1(kx(xb + w, b)) + " " + f1(b) + " L" + f1(kx(xb, b)) + " " + f1(b) + " Z ";
        if (i >= 3 && r() < .6) { const n = Math.min(14, 3 + i); for (let k = 1; k < n; k++) { const x2 = xb + w * k / n; rady += "M" + f1(kx(x2, a)) + " " + f1(a) + " L" + f1(kx(x2, b)) + " " + f1(b) + " "; } }
        meze += "M" + f1(kx(xb, a)) + " " + f1(a) + " L" + f1(kx(xb, b)) + " " + f1(b) + " ";
        xb += w; }
    }
    let o = "";
    barvy.forEach(function(c, i){ if (cesty[i]) o += vrstva(F, cesty[i], mix(c, "#FFFFFF", .12), mix(c, "#3A3A1A", .08), .82); });
    o += skupina(F, F.stetec, '<path d="' + rady + '" stroke="#5A5A2A" stroke-width=".5" opacity=".3" fill="none"/><path d="' + meze + '" stroke="#6A7A3A" stroke-width=".7" opacity=".4" fill="none"/>');
    /* remízky a stromořadí na mezích */
    for (let i = 1; i < Math.min(by.length - 2, 6); i++) if (stromy && r() < .7) { const x0 = r() * 300 - 20; o += koruny(F, r, x0, x0 + 40 + r() * 120, by[i] + 1, .25 + i * .1, mix("#5E8446", F.opar, .5 - i * .08), .8, F.jemna); }
    return o;
  }
  /* větrný mlýn: kuželová věž, ochoz, čepice a lopatky s mřížkou */
  function mlyn(F, r, x, y, s){
    const vez = "M" + f1(x - 9 * s) + " " + f1(y) + " L" + f1(x - 5.5 * s) + " " + f1(y - 40 * s) + " L" + f1(x + 5.5 * s) + " " + f1(y - 40 * s) + " L" + f1(x + 9 * s) + " " + f1(y) + " Z";
    let o = kryt(F, vez, F.jemna) + vrstva(F, vez, "#7A6A5A", "#4E4036", .95, F.jemna) + laz(F, "M" + f1(x + 2 * s) + " " + f1(y) + " L" + f1(x + 1.5 * s) + " " + f1(y - 40 * s) + " L" + f1(x + 5.5 * s) + " " + f1(y - 40 * s) + " L" + f1(x + 9 * s) + " " + f1(y) + " Z", "#2E2620", .4);
    o += jem(F, "M" + f1(x - 6.5 * s) + " " + f1(y - 40 * s) + " Q" + f1(x) + " " + f1(y - 49 * s) + " " + f1(x + 6.5 * s) + " " + f1(y - 40 * s) + " Z", "#3E3430", .95);
    let l = tah("M" + f1(x - 11 * s) + " " + f1(y - 17 * s) + " L" + f1(x + 11 * s) + " " + f1(y - 17 * s), "#3A3028", 1 * s, .9) + tah("M" + f1(x - 1.4 * s) + " " + f1(y) + " l0 " + f1(-6 * s) + " l" + f1(2.8 * s) + " 0 l0 " + f1(6 * s), "#2A2420", .7 * s, .8);
    const hx = x, hy = y - 42 * s;
    [[-.6, -1], [1, -.55], [.6, 1], [-1, .55]].forEach(function(k){ const L = 30 * s, ex = hx + k[0] * L, ey = hy + k[1] * L * .8, px = -k[1] * 3.2 * s, py = k[0] * 3.2 * s;
      l += tah("M" + f1(hx) + " " + f1(hy) + " L" + f1(ex) + " " + f1(ey), "#3A3028", 1.1 * s, .95) + tah("M" + f1(hx + (ex - hx) * .25 + px) + " " + f1(hy + (ey - hy) * .25 + py) + " L" + f1(ex + px) + " " + f1(ey + py), "#3A3028", .5 * s, .8);
      for (let j = 1; j < 7; j++) { const t = .25 + j * .12; l += tah("M" + f1(hx + (ex - hx) * t) + " " + f1(hy + (ey - hy) * t) + " l" + f1(px) + " " + f1(py), "#3A3028", .4 * s, .7); }
      l += '<path d="M' + f1(hx + (ex - hx) * .25) + " " + f1(hy + (ey - hy) * .25) + " L" + f1(ex) + " " + f1(ey) + " l" + f1(px) + " " + f1(py) + " L" + f1(hx + (ex - hx) * .25 + px) + " " + f1(hy + (ey - hy) * .25 + py) + ' Z" fill="#F2ECE0" opacity=".55"/>'; });
    return o + skupina(F, F.stetec, l);
  }
  /* ---- stavby: typické domy a kostely zemí (ne konkrétní památky) ---- */
  const bod = function(p){ return f1(p[0]) + " " + f1(p[1]); };
  const mnoho = function(b){ return "M" + b.map(bod).join(" L") + " Z "; };
  /* světlou barvu nanese papírem (nenásobí se), tmavou jako lazuru */
  function nanes(F, d, barva, op, filtr){ return plocha(F, filtr || F.jemna, d, barva, op == null ? .95 : op); }
  /* dům ve volném pohledu: průčelí, pravý bok ve stínu, střecha. x, y = levý dolní roh průčelí.
     o.typ: sedlo (hřeben souběžně s průčelím), valba, stit (štít do ulice), stupne (stupňovitý štít), plocha, dosky (doškový) */
  function dum(F, r, x, y, w, h, o){
    o = o || {};
    const typ = o.typ || "sedlo", d = o.d == null ? w * .55 : o.d, dx = d * .62, dy = -d * .28, stena = o.stena || "#F4EEE2",
      strecha = o.strecha || (typ === "plocha" ? mix(stena, "#FFFFFF", .25) : "#B84E36"), rh = o.rh == null ? (typ === "stit" || typ === "stupne" ? w * .55 : typ === "dosky" ? w * .5 : w * .38) : o.rh,
      bok = o.bok || mix(stena, "#5A5E78", .32), e = Math.max(1, w * .05), top = y - h;
    let sil = "", zed = "", st = "", str = "", str2 = "", cary = "", tasky = "";
    const Fr = [[x, y], [x + w, y], [x + w, top], [x, top]], Sd = [[x + w, y], [x + w + dx, y + dy], [x + w + dx, top + dy], [x + w, top]];
    if (typ === "stit" || typ === "stupne") {
      const ap = [x + w / 2, top - rh];
      let stit = [[x, top], ap, [x + w, top]];
      if (typ === "stupne") { stit = [[x, top]]; const n = 3; for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, yy = top - rh * t1;
          stit.push([x + w / 2 * t0 + w * .02, yy]); stit.push([x + w / 2 * t1 - (i === n - 1 ? 0 : w * .02), yy]); }
        stit.push([x + w / 2, top - rh - w * .06]);
        for (let i = n - 1; i >= 0; i--) { const t0 = i / n, t1 = (i + 1) / n, yy = top - rh * t1; stit.push([x + w - w / 2 * t1 + (i === n - 1 ? 0 : w * .02), yy]); stit.push([x + w - w / 2 * t0 - w * .02, yy]); }
        stit.push([x + w, top]); }
      zed = mnoho([[x, y], [x + w, y]].concat(stit.slice().reverse()));
      str = mnoho([ap, [ap[0] + dx, ap[1] + dy], [x + w + dx + e * .5, top + dy + e * .4], [x + w + e * .5, top + e * .4]]);
      st = mnoho(Sd);
      sil = mnoho([[x, y], [x + w + dx, y + dy], [x + w + dx + e, top + dy], [ap[0] + dx, ap[1] + dy], ap, [x, top]]);
      if (o.hrazdi) { cary += mnoho(stit); for (let k = 1; k < 3; k++) cary += "M" + bod([x + w * k / 3, top]) + " L" + bod([x + w * k / 3, top - rh * (k === 1 || k === 2 ? .66 : 0)]) + " "; }
    } else if (typ === "plocha") {
      zed = mnoho(Fr); st = mnoho(Sd); str = mnoho([[x - .5, top], [x + w, top], [x + w + dx, top + dy], [x + dx - .5, top + dy]]);
      sil = mnoho([[x, y], [x + w + dx, y + dy], [x + w + dx, top + dy], [x + dx, top + dy], [x, top]]);
    } else {
      const rl = typ === "valba" || typ === "dosky" ? w * .2 : 0, R0 = [x + dx / 2 + rl, top + dy / 2 - rh], R1 = [x + w + dx / 2 - rl, top + dy / 2 - rh];
      const ee = typ === "dosky" ? e * 2.2 : e;
      str = mnoho([[x - ee, top + ee * .6], [x + w + ee * .4, top + ee * .6], R1, R0]);
      zed = mnoho(Fr); st = mnoho(Sd);
      const gab = [[x + w + ee * .4, top + ee * .6], [x + w + dx + ee * .5, top + dy + ee * .6], R1];
      if (typ === "sedlo") { st += mnoho([[x + w, top], [x + w + dx, top + dy], R1]); str2 = "M" + bod(R1) + " L" + bod(gab[0]) + " M" + bod(R1) + " L" + bod(gab[1]) + " "; }
      else str2 = mnoho(gab);
      sil = mnoho([[x, y], [x + w + dx, y + dy], gab[1], R1, R0, [x - ee, top + ee * .6]]);
      for (let k = 1; k < 5; k++) { const t = k / 5; tasky += "M" + bod([x - ee + (R0[0] - x + ee) * t, top + ee * .6 + (R0[1] - top - ee * .6) * t]) + " L" + bod([x + w + ee * .4 + (R1[0] - x - w - ee * .4) * t, top + ee * .6 + (R1[1] - top - ee * .6) * t]) + " "; }
    }
    /* okna, okenice, dveře */
    const patra = o.patra || 1, nok = o.okna == null ? Math.max(1, Math.round(w / 9)) : o.okna, pv = h / patra;
    let ok = "", oken = "";
    for (let p = 0; p < patra; p++) for (let i = 0; i < nok; i++) {
      if (o.dvere !== false && p === 0 && i === Math.floor(nok / 2) && nok > 1) continue;
      const cx = x + w * (i + .5) / nok, ww = Math.min(w / nok * .42, pv * .4), wh = pv * .42, yy = y - p * pv - pv * .3;
      ok += mnoho([[cx - ww / 2, yy], [cx + ww / 2, yy], [cx + ww / 2, yy - wh], [cx - ww / 2, yy - wh]]);
      if (o.okenice) oken += mnoho([[cx - ww * 1.05, yy], [cx - ww / 2, yy], [cx - ww / 2, yy - wh], [cx - ww * 1.05, yy - wh]]) + mnoho([[cx + ww / 2, yy], [cx + ww * 1.05, yy], [cx + ww * 1.05, yy - wh], [cx + ww / 2, yy - wh]]); }
    if (o.dvere !== false) { const cx = x + w * (Math.floor(nok / 2) + .5) / nok, dw = Math.min(w * .16, pv * .3); ok += mnoho([[cx - dw / 2, y], [cx + dw / 2, y], [cx + dw / 2, y - pv * .62], [cx - dw / 2, y - pv * .62]]); }
    if (o.hrazdi) { cary += mnoho(Fr); for (let p = 1; p < patra; p++) cary += "M" + bod([x, y - p * pv]) + " L" + bod([x + w, y - p * pv]) + " ";
      for (let i = 0; i <= nok; i++) { const xx = x + w * i / nok; cary += "M" + bod([xx, y]) + " L" + bod([xx, top]) + " "; }
      cary += "M" + bod([x, y - pv * .1]) + " L" + bod([x + w / nok, top + pv * .15]) + " M" + bod([x + w, y - pv * .1]) + " L" + bod([x + w - w / nok, top + pv * .15]) + " "; }
    let out = kryt(F, sil, F.jemna) + nanes(F, zed, stena) + nanes(F, st, stena) + laz(F, st, bok, .5);
    if (o.hrazdi) out += skupina(F, F.stetec, '<path d="' + cary + '" stroke="' + o.hrazdi + '" stroke-width="' + f1(Math.max(.5, w * .035)) + '" fill="none" opacity=".85"/>');
    if (oken) out += nanes(F, oken, o.okenice, .85);
    out += nanes(F, ok, o.okno || "#3E4656", .78);
    const barvaStr = typ === "dosky" ? (o.strecha || "#C8A860") : strecha;
    out += vrstva(F, str, mix(barvaStr, "#FFFFFF", .12), mix(barvaStr, "#1A1A1A", .12), .95, F.jemna);
    if (str2) out += typ === "sedlo" ? skupina(F, F.stetec, tah(str2, mix(barvaStr, "#1A1A1A", .3), .5, .6)) : nanes(F, str2, mix(barvaStr, "#2A2A3A", .28), .95);
    if (tasky) out += skupina(F, F.stetec, '<path d="' + tasky + '" stroke="' + mix(barvaStr, "#1A1A1A", .35) + '" stroke-width=".4" fill="none" opacity="' + (typ === "dosky" ? .6 : .35) + '"/>');
    if (o.komin) { const kx = x + w * .7; out += nanes(F, mnoho([[kx, top - rh * .2], [kx + w * .08, top - rh * .2], [kx + w * .08, top - rh * .9], [kx, top - rh * .9]]), o.komin === true ? "#8A5A48" : o.komin, .95); }
    return out;
  }
  /* kostel: loď a věž se střechou podle kraje.
     vez: jehlan, barok (cibulová báň), ctverec (anglická věž s cimbuřím), kampanila, stupne (dánská sedlová věž), dreveny (maramurešská šindelová) */
  function kostel(F, r, x, y, s, o){
    o = o || {};
    const vez = o.vez || "jehlan", stena = o.stena || "#F4EEE2", strecha = o.strecha || "#B84E36", tw = 10 * s, th = (vez === "kampanila" ? 44 : vez === "dreveny" ? 22 : 30) * s, dx = 3.4 * s, dy = -1.6 * s;
    let out = dum(F, r, x + tw * .6, y, 30 * s, 13 * s, { typ: "sedlo", stena: stena, strecha: o.strechaLodi || strecha, okna: 0, dvere: false, d: 14 * s, rh: 10 * s });
    let okna = ""; for (let i = 0; i < 3; i++) { const cx = x + tw * .6 + 8 * s + i * 8 * s; okna += "M" + f1(cx - 1.1 * s) + " " + f1(y - 3 * s) + " L" + f1(cx - 1.1 * s) + " " + f1(y - 8.5 * s) + " Q" + f1(cx) + " " + f1(y - 10.5 * s) + " " + f1(cx + 1.1 * s) + " " + f1(y - 8.5 * s) + " L" + f1(cx + 1.1 * s) + " " + f1(y - 3 * s) + " Z "; }
    out += nanes(F, okna, "#4A5060", .7);
    const T = y - th, front = mnoho([[x, y], [x + tw, y], [x + tw, T], [x, T]]), bok = mnoho([[x + tw, y], [x + tw + dx, y + dy], [x + tw + dx, T + dy], [x + tw, T]]);
    out += kryt(F, front + bok, F.jemna) + nanes(F, front, stena) + nanes(F, bok, stena) + laz(F, bok, mix(stena, "#5A5E78", .35), .5);
    const zv = "M" + f1(x + tw / 2 - 1.3 * s) + " " + f1(T + 7 * s) + " L" + f1(x + tw / 2 - 1.3 * s) + " " + f1(T + 3.2 * s) + " Q" + f1(x + tw / 2) + " " + f1(T + 1.6 * s) + " " + f1(x + tw / 2 + 1.3 * s) + " " + f1(T + 3.2 * s) + " L" + f1(x + tw / 2 + 1.3 * s) + " " + f1(T + 7 * s) + " Z";
    out += nanes(F, zv, "#3A3E4A", .75);
    if (vez === "kampanila") { for (let k = 1; k < 4; k++) out += skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(T + th * k / 4) + " l" + f1(tw) + " 0", mix(stena, "#5A4A3A", .4), .5, .5)); }
    const cx = x + tw / 2 + dx / 2, sv = o.vezStrecha || (vez === "barok" ? "#3E6A5A" : vez === "dreveny" ? "#4A3A30" : "#5A6A7A");
    if (vez === "jehlan" || vez === "dreveny") {
      const vh = (vez === "dreveny" ? 46 : 24) * s;
      out += nanes(F, mnoho([[x - .6 * s, T + .5], [x + tw + .4 * s, T + .5], [cx, T - vh]]), sv) + nanes(F, mnoho([[x + tw + .4 * s, T + .5], [x + tw + dx + .6 * s, T + dy + .5], [cx, T - vh]]), mix(sv, "#141820", .35));
      if (vez === "dreveny") [[x - 1 * s, 1], [x + tw + dx - 1 * s, 1]].forEach(function(p){ out += nanes(F, mnoho([[p[0], T + 1], [p[0] + 2.4 * s, T + 1], [p[0] + 1.2 * s, T - 8 * s]]), sv); });
      out += skupina(F, F.stetec, tah("M" + f1(cx) + " " + f1(T - vh) + " l0 " + f1(-3.5 * s) + " M" + f1(cx - 1.2 * s) + " " + f1(T - vh - 2.2 * s) + " l" + f1(2.4 * s) + " 0", "#3A3A3A", .5 * s, .8));
    } else if (vez === "barok") {
      const b = T;
      const d = "M" + f1(x - .4 * s) + " " + f1(b) + " C" + f1(x - 2.4 * s) + " " + f1(b - 5 * s) + " " + f1(cx - 1.2 * s) + " " + f1(b - 7 * s) + " " + f1(cx - 1.2 * s) + " " + f1(b - 10 * s) +
        " L" + f1(cx - 1.6 * s) + " " + f1(b - 10.5 * s) + " C" + f1(cx - 4.2 * s) + " " + f1(b - 12 * s) + " " + f1(cx - 1 * s) + " " + f1(b - 16 * s) + " " + f1(cx) + " " + f1(b - 17 * s) +
        " C" + f1(cx + 1 * s) + " " + f1(b - 16 * s) + " " + f1(cx + 4.2 * s) + " " + f1(b - 12 * s) + " " + f1(cx + 1.6 * s) + " " + f1(b - 10.5 * s) + " L" + f1(cx + 1.2 * s) + " " + f1(b - 10 * s) +
        " C" + f1(cx + 1.2 * s) + " " + f1(b - 7 * s) + " " + f1(x + tw + dx + 2.4 * s) + " " + f1(b - 5 * s) + " " + f1(x + tw + dx + .4 * s) + " " + f1(b + dy) + " Z";
      out += vrstva(F, d, mix(sv, "#FFFFFF", .15), mix(sv, "#101818", .25), .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(cx) + " " + f1(b - 17 * s) + " l0 " + f1(-4 * s) + " M" + f1(cx - 1.2 * s) + " " + f1(b - 19.5 * s) + " l" + f1(2.4 * s) + " 0", "#3A3A3A", .5 * s, .8));
    } else if (vez === "ctverec") {
      let c = ""; for (let i = 0; i < 4; i++) c += mnoho([[x + i * tw / 3.5, T], [x + i * tw / 3.5 + tw / 7, T], [x + i * tw / 3.5 + tw / 7, T - 2.4 * s], [x + i * tw / 3.5, T - 2.4 * s]]);
      c += mnoho([[x + tw, T], [x + tw + dx, T + dy], [x + tw + dx, T + dy - 2.4 * s], [x + tw, T - 2.4 * s]]);
      out += nanes(F, c, stena) + laz(F, c, mix(stena, "#5A5E78", .3), .3);
    } else if (vez === "kampanila") {
      out += nanes(F, mnoho([[x - .8 * s, T + .5], [x + tw + .6 * s, T + .5], [cx, T - 5 * s]]), strecha) + nanes(F, mnoho([[x + tw + .6 * s, T + .5], [x + tw + dx + .8 * s, T + dy + .5], [cx, T - 5 * s]]), mix(strecha, "#1A1A1A", .3));
    } else if (vez === "stupne") {
      let st = [[x, T]]; for (let i = 0; i < 3; i++) { const t = (i + 1) / 3; st.push([x + tw / 2 * (i / 3) + .5 * s, T - 9 * s * t]); st.push([x + tw / 2 * t - (i === 2 ? 0 : .5 * s), T - 9 * s * t]); }
      st.push([x + tw / 2, T - 10 * s]); for (let i = 2; i >= 0; i--) { const t = (i + 1) / 3; st.push([x + tw - tw / 2 * t + (i === 2 ? 0 : .5 * s), T - 9 * s * t]); st.push([x + tw - tw / 2 * (i / 3) - .5 * s, T - 9 * s * t]); }
      st.push([x + tw, T]);
      out += nanes(F, mnoho(st), stena) + nanes(F, mnoho([[x + tw / 2, T - 9 * s], [x + tw / 2 + dx, T - 9 * s + dy], [x + tw + dx, T + dy], [x + tw, T]]), strecha);
    }
    return out;
  }
  /* pravoslavný kostel: bílé zdi, bubny s cibulovými bání (zlatá nebo modrá), zvonice se stanovou střechou */
  function cibule(F, r, x, y, s, o){
    o = o || {};
    const stena = o.stena || "#F4EEE2", ban = o.ban || "#D8A640", strecha = o.strecha || "#4E7A6A";
    let out = dum(F, r, x, y, 26 * s, 15 * s, { typ: "valba", stena: stena, strecha: strecha, okna: 3, dvere: false, d: 20 * s, rh: 5 * s, okno: "#5A6070" });
    const cib = function(cx, cy, rr){ const d = "M" + f1(cx - rr) + " " + f1(cy) + " C" + f1(cx - rr * 1.5) + " " + f1(cy - rr * 1.1) + " " + f1(cx - rr * .2) + " " + f1(cy - rr * 1.6) + " " + f1(cx) + " " + f1(cy - rr * 2.3) +
        " C" + f1(cx + rr * .2) + " " + f1(cy - rr * 1.6) + " " + f1(cx + rr * 1.5) + " " + f1(cy - rr * 1.1) + " " + f1(cx + rr) + " " + f1(cy) + " Z";
      return vrstva(F, d, mix(ban, "#FFF4D0", .35), mix(ban, "#4A3010", .3), .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(cx) + " " + f1(cy - rr * 2.3) + " l0 " + f1(-rr * 1.3) + " M" + f1(cx - rr * .45) + " " + f1(cy - rr * 3) + " l" + f1(rr * .9) + " 0", "#6A5020", .4 * s, .8)); };
    const buben = function(cx, by, bw, bh){ const d = mnoho([[cx - bw / 2, by], [cx + bw / 2, by], [cx + bw / 2, by - bh], [cx - bw / 2, by - bh]]);
      return kryt(F, d, F.jemna) + nanes(F, d, stena) + laz(F, mnoho([[cx + bw * .1, by], [cx + bw / 2, by], [cx + bw / 2, by - bh], [cx + bw * .1, by - bh]]), mix(stena, "#5A5E78", .3), .4) + nanes(F, mnoho([[cx - .6 * s, by - bh * .3], [cx + .6 * s, by - bh * .3], [cx + .6 * s, by - bh * .8], [cx - .6 * s, by - bh * .8]]), "#4A5060", .7); };
    const mx = x + 13 * s + 5 * s, my = y - 15 * s - 4 * s;
    [[x + 6 * s, 3 * s], [x + 24 * s, 3 * s]].forEach(function(p){ out += buben(p[0] + 3 * s, my + 3 * s, 4.4 * s, 6 * s) + cib(p[0] + 3 * s, my - 3 * s, 2.6 * s); });
    out += buben(mx, my + 1 * s, 7 * s, 10 * s) + cib(mx, my - 9 * s, 4.2 * s);
    /* zvonice */
    const zx = x - 9 * s, zv = mnoho([[zx, y], [zx + 8 * s, y], [zx + 8 * s, y - 30 * s], [zx, y - 30 * s]]);
    out += kryt(F, zv, F.jemna) + nanes(F, zv, stena) + laz(F, mnoho([[zx + 5 * s, y], [zx + 8 * s, y], [zx + 8 * s, y - 30 * s], [zx + 5 * s, y - 30 * s]]), mix(stena, "#5A5E78", .3), .4) +
      nanes(F, mnoho([[zx - .5 * s, y - 30 * s], [zx + 8.5 * s, y - 30 * s], [zx + 4 * s, y - 42 * s]]), strecha) + cib(zx + 4 * s, y - 42 * s, 1.6 * s);
    return out;
  }
  /* byzantský kostel (Srbsko, Bulharsko, Makedonie): pruhy kamene a cihel, kupole na bubnu, oblé střechy z prejzů */
  function byzant(F, r, x, y, s, o){
    o = o || {};
    const stena = o.stena || "#E8D6B8", strecha = o.strecha || "#C0603E", w = 32 * s, h = 14 * s;
    let out = dum(F, r, x, y, w, h, { typ: "sedlo", stena: stena, strecha: strecha, okna: 0, dvere: false, d: 18 * s, rh: 7 * s });
    let pr = ""; for (let k = 1; k < 4; k++) pr += tah("M" + f1(x) + " " + f1(y - h * k / 4) + " l" + f1(w) + " 0", "#B06A48", .5 * s, .55);
    let ob = ""; for (let i = 0; i < 3; i++) { const cx = x + 7 * s + i * 9 * s; ob += "M" + f1(cx - 2.6 * s) + " " + f1(y - h) + " Q" + f1(cx) + " " + f1(y - h - 4 * s) + " " + f1(cx + 2.6 * s) + " " + f1(y - h) + " "; }
    out += skupina(F, F.stetec, pr + tah(ob, strecha, 1.2 * s, .9));
    let ok = ""; for (let i = 0; i < 3; i++) { const cx = x + 7 * s + i * 9 * s; ok += "M" + f1(cx - 1 * s) + " " + f1(y - 3 * s) + " L" + f1(cx - 1 * s) + " " + f1(y - 8 * s) + " Q" + f1(cx) + " " + f1(y - 9.5 * s) + " " + f1(cx + 1 * s) + " " + f1(y - 8 * s) + " L" + f1(cx + 1 * s) + " " + f1(y - 3 * s) + " Z "; }
    out += nanes(F, ok, "#4A4650", .7);
    const cx = x + w / 2 + 4 * s, by = y - h - 5 * s, bw = 9 * s, bh = 8 * s, buben = mnoho([[cx - bw / 2, by + 3 * s], [cx + bw / 2, by + 3 * s], [cx + bw / 2, by - bh], [cx - bw / 2, by - bh]]);
    out += kryt(F, buben, F.jemna) + nanes(F, buben, stena) + laz(F, mnoho([[cx + bw * .1, by + 3 * s], [cx + bw / 2, by + 3 * s], [cx + bw / 2, by - bh], [cx + bw * .1, by - bh]]), mix(stena, "#5A5E78", .3), .4);
    out += skupina(F, F.stetec, tah("M" + f1(cx - bw / 2) + " " + f1(by - bh * .45) + " l" + f1(bw) + " 0", "#B06A48", .5 * s, .5)) + nanes(F, mnoho([[cx - .7 * s, by - 1 * s], [cx + .7 * s, by - 1 * s], [cx + .7 * s, by - 5 * s], [cx - .7 * s, by - 5 * s]]), "#4A4650", .7);
    const k = "M" + f1(cx - bw / 2 - .6 * s) + " " + f1(by - bh) + " Q" + f1(cx - bw / 2) + " " + f1(by - bh - 6 * s) + " " + f1(cx) + " " + f1(by - bh - 6.4 * s) + " Q" + f1(cx + bw / 2) + " " + f1(by - bh - 6 * s) + " " + f1(cx + bw / 2 + .6 * s) + " " + f1(by - bh) + " Z";
    out += vrstva(F, k, mix(strecha, "#FFFFFF", .15), mix(strecha, "#2A1A10", .2), .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(cx) + " " + f1(by - bh - 6.4 * s) + " l0 " + f1(-3.5 * s) + " M" + f1(cx - 1.1 * s) + " " + f1(by - bh - 8.4 * s) + " l" + f1(2.2 * s) + " 0", "#5A4A3A", .45 * s, .8));
    return out;
  }
  /* kykladský dům: bílá kostka, modré dveře a okenice; kostelík s modrou kupolí */
  function kyklady(F, r, x, y, w, h, s, kupole){
    let out = dum(F, r, x, y, w, h, { typ: "plocha", stena: "#FBFAF6", bok: "#C8CCDA", okna: Math.max(1, Math.round(w / 10)), okno: "#2E5EA8", okenice: null });
    if (kupole) { const cx = x + w / 2 + 2 * s, by = y - h, bw = w * .5, k = "M" + f1(cx - bw / 2) + " " + f1(by) + " Q" + f1(cx - bw / 2) + " " + f1(by - bw * .75) + " " + f1(cx) + " " + f1(by - bw * .78) + " Q" + f1(cx + bw / 2) + " " + f1(by - bw * .75) + " " + f1(cx + bw / 2) + " " + f1(by) + " Z";
      out += kryt(F, k, F.jemna) + vrstva(F, k, "#4E86D0", "#1E4E98", .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(cx) + " " + f1(by - bw * .78) + " l0 " + f1(-3 * s) + " M" + f1(cx - 1 * s) + " " + f1(by - bw * .78 - 1.8 * s) + " l" + f1(2 * s) + " 0", "#6A6A6A", .4 * s, .8)); }
    return out;
  }
  /* hrad na skále: hradby s cimbuřím, válcová věž, palác */
  function hrad(F, r, x, y, s, o){
    o = o || {};
    const stena = o.stena || "#D8CCB4", strecha = o.strecha || "#6A7488";
    let out = dum(F, r, x + 10 * s, y - 4 * s, 24 * s, 16 * s, { typ: "sedlo", stena: stena, strecha: strecha, okna: 3, patra: 2, dvere: false, d: 12 * s, rh: 9 * s });
    const vz = mnoho([[x, y], [x + 9 * s, y], [x + 9 * s, y - 34 * s], [x, y - 34 * s]]);
    out += kryt(F, vz, F.jemna) + nanes(F, vz, stena) + laz(F, mnoho([[x + 5.5 * s, y], [x + 9 * s, y], [x + 9 * s, y - 34 * s], [x + 5.5 * s, y - 34 * s]]), mix(stena, "#4A4E68", .35), .45) +
      nanes(F, mnoho([[x - 1 * s, y - 34 * s], [x + 10 * s, y - 34 * s], [x + 4.5 * s, y - 48 * s]]), strecha) + nanes(F, "M" + f1(x + 3.5 * s) + " " + f1(y - 22 * s) + " l" + f1(1.6 * s) + " 0 l0 " + f1(-3 * s) + " l" + f1(-1.6 * s) + " 0 z", "#3A3E4A", .75);
    let c = ""; const hx = x + 34 * s, hr = mnoho([[x + 8 * s, y + 2 * s], [hx + 10 * s, y + 2 * s], [hx + 10 * s, y - 8 * s], [x + 8 * s, y - 8 * s]]);
    for (let i = 0; i < 9; i++) c += mnoho([[x + 8 * s + i * 4.2 * s, y - 8 * s], [x + 10.2 * s + i * 4.2 * s, y - 8 * s], [x + 10.2 * s + i * 4.2 * s, y - 10.4 * s], [x + 8 * s + i * 4.2 * s, y - 10.4 * s]]);
    out += kryt(F, hr + c, F.jemna) + nanes(F, hr + c, stena) + laz(F, hr, mix(stena, "#4A4E68", .25), .25);
    const v2 = mnoho([[hx, y], [hx + 8 * s, y], [hx + 8 * s, y - 24 * s], [hx, y - 24 * s]]);
    return out + kryt(F, v2, F.jemna) + nanes(F, v2, stena) + laz(F, mnoho([[hx + 5 * s, y], [hx + 8 * s, y], [hx + 8 * s, y - 24 * s], [hx + 5 * s, y - 24 * s]]), mix(stena, "#4A4E68", .35), .45) +
      nanes(F, mnoho([[hx - .8 * s, y - 24 * s], [hx + 8.8 * s, y - 24 * s], [hx + 4 * s, y - 34 * s]]), strecha);
  }
  /* čapí hnízdo na sloupu s čápem */
  function capi(F, x, y, s){
    const n = "M" + f1(x - 9 * s) + " " + f1(y - 36 * s) + " Q" + x + " " + f1(y - 32 * s) + " " + f1(x + 9 * s) + " " + f1(y - 36 * s) + " L" + f1(x + 7 * s) + " " + f1(y - 40 * s) + " L" + f1(x - 7 * s) + " " + f1(y - 40 * s) + " Z";
    let o = skupina(F, F.stetec, tah("M" + x + " " + y + " l0 " + f1(-36 * s), "#6A5A4A", 1.8 * s, .95)) + vrstva(F, n, "#9A7A52", "#6A5038", .95, F.jemna);
    const t = "M" + f1(x - 5 * s) + " " + f1(y - 42 * s) + " Q" + f1(x - 1 * s) + " " + f1(y - 47 * s) + " " + f1(x + 4 * s) + " " + f1(y - 44 * s) + " L" + f1(x + 5 * s) + " " + f1(y - 51 * s) + " L" + f1(x + 6.5 * s) + " " + f1(y - 51 * s) + " L" + f1(x + 6 * s) + " " + f1(y - 43 * s) + " Q" + f1(x + 1 * s) + " " + f1(y - 39 * s) + " " + f1(x - 5 * s) + " " + f1(y - 42 * s) + " Z";
    return o + kryt(F, t, F.jemna) + nanes(F, t, "#FBFAF6") + nanes(F, "M" + f1(x - 5 * s) + " " + f1(y - 42 * s) + " Q" + f1(x - 2 * s) + " " + f1(y - 41 * s) + " " + f1(x + 1 * s) + " " + f1(y - 42 * s) + " L" + f1(x - 1 * s) + " " + f1(y - 44 * s) + " Z", "#2A2A2A", .85) +
      skupina(F, F.stetec, tah("M" + f1(x + 6.3 * s) + " " + f1(y - 50 * s) + " l" + f1(3.4 * s) + " " + f1(1.2 * s), "#D8502E", .9 * s, .95));
  }
  /* kupka sena kolem tyče (Rumunsko, Balkán) */
  function seno(F, x, y, s, barva){
    const d = "M" + f1(x - 8 * s) + " " + f1(y) + " Q" + f1(x - 9 * s) + " " + f1(y - 12 * s) + " " + f1(x) + " " + f1(y - 20 * s) + " Q" + f1(x + 9 * s) + " " + f1(y - 12 * s) + " " + f1(x + 8 * s) + " " + f1(y) + " Z";
    let t = ""; for (let i = 0; i < 6; i++) t += tah("M" + f1(x - 6 * s + i * 2.4 * s) + " " + f1(y - 1 * s) + " q" + f1(1 * s) + " " + f1(-8 * s) + " " + f1(4 * s - i * .8 * s) + " " + f1(-16 * s), "#7A6030", .4 * s, .45);
    return kryt(F, d, F.jemna) + vrstva(F, d, barva || "#C8A45A", mix(barva || "#C8A45A", "#3A2A10", .35), .95, F.jemna) + skupina(F, F.stetec, t + tah("M" + x + " " + f1(y - 18 * s) + " l0 " + f1(-8 * s), "#5A4632", .9 * s, .9));
  }
  /* studna s vahadlem (maďarská pusta, Ukrajina) */
  function studna(F, x, y, s){
    const kr = "M" + f1(x - 5 * s) + " " + y + " l0 " + f1(-5 * s) + " l" + f1(10 * s) + " 0 l0 " + f1(5 * s) + " z";
    return kryt(F, kr, F.jemna) + vrstva(F, kr, "#A8906E", "#6E5A44", .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(x + 16 * s) + " " + y + " l0 " + f1(-26 * s), "#5A4632", 1.6 * s, .95) +
      tah("M" + f1(x + 16 * s) + " " + f1(y - 24 * s) + " l" + f1(-4 * s) + " " + f1(-3 * s) + " M" + f1(x + 16 * s) + " " + f1(y - 24 * s) + " l" + f1(4 * s) + " " + f1(-3 * s), "#5A4632", 1 * s, .9) +
      tah("M" + f1(x + 34 * s) + " " + f1(y - 10 * s) + " L" + f1(x - 2 * s) + " " + f1(y - 42 * s), "#5A4632", 1.1 * s, .95) + tah("M" + f1(x - 1 * s) + " " + f1(y - 41 * s) + " l0 " + f1(32 * s), "#5A4632", .5 * s, .8));
  }
  /* kozolec: slovinská dřevěná sušárna sena se stříškou */
  function kozolec(F, x, y, w, h, s){
    let t = ""; for (let i = 0; i <= 4; i++) t += tah("M" + f1(x + w * i / 4) + " " + y + " l0 " + f1(-h), "#5A4632", 1.3 * s, .95);
    let sen = ""; for (let k = 1; k < 7; k++) sen += "M" + f1(x) + " " + f1(y - h * k / 7) + " l" + f1(w) + " 0 ";
    const st = "M" + f1(x - 3 * s) + " " + f1(y - h) + " L" + f1(x + w + 3 * s) + " " + f1(y - h) + " L" + f1(x + w - 2 * s) + " " + f1(y - h - 6 * s) + " L" + f1(x + 2 * s) + " " + f1(y - h - 6 * s) + " Z";
    return skupina(F, F.stetec, t + '<path d="' + sen + '" stroke="#C8A45A" stroke-width="' + f1(2.2 * s) + '" opacity=".85" fill="none"/><path d="' + sen + '" stroke="#6A5A3A" stroke-width="' + f1(.4 * s) + '" opacity=".7" fill="none"/>') + nanes(F, st, "#7A6A5A");
  }
  /* sloupové průčelí panského domu (Polsko): štít a čtyři sloupy */
  function portikus(F, x, y, w, h, s){
    let t = ""; for (let i = 0; i < 4; i++) t += tah("M" + f1(x + w * (.1 + i * .27)) + " " + y + " l0 " + f1(-h), "#FBFAF6", 1.8 * s, .95);
    const st = "M" + f1(x - 1 * s) + " " + f1(y - h) + " L" + f1(x + w / 2) + " " + f1(y - h - w * .3) + " L" + f1(x + w + 1 * s) + " " + f1(y - h) + " Z";
    return kryt(F, st, F.jemna) + nanes(F, st, "#FBFAF6") + laz(F, st, "#C8CCD8", .2) + skupina(F, F.stetec, t + tah("M" + f1(x) + " " + f1(y - h) + " l" + f1(w) + " 0", "#B8B8C4", .6, .7));
  }
  /* maják: kuželová věž s pruhy, galerie a lucerna */
  function majak(F, x, y, s, pruh){
    const d = "M" + f1(x - 5 * s) + " " + y + " L" + f1(x - 3.4 * s) + " " + f1(y - 34 * s) + " L" + f1(x + 3.4 * s) + " " + f1(y - 34 * s) + " L" + f1(x + 5 * s) + " " + y + " Z";
    let p = ""; for (let i = 0; i < 3; i++) { const y0 = y - (6 + i * 10) * s, y1 = y0 - 5 * s, w0 = 5 - (6 + i * 10) / 34 * 1.6, w1 = 5 - (11 + i * 10) / 34 * 1.6; p += mnoho([[x - w0 * s, y0], [x + w0 * s, y0], [x + w1 * s, y1], [x - w1 * s, y1]]); }
    return kryt(F, d, F.jemna) + nanes(F, d, "#FBFAF6") + nanes(F, p, pruh || "#C8402E") + laz(F, "M" + f1(x + 1 * s) + " " + y + " L" + f1(x + .8 * s) + " " + f1(y - 34 * s) + " L" + f1(x + 3.4 * s) + " " + f1(y - 34 * s) + " L" + f1(x + 5 * s) + " " + y + " Z", "#9AA0B4", .35) +
      nanes(F, mnoho([[x - 4.4 * s, y - 34 * s], [x + 4.4 * s, y - 34 * s], [x + 4.4 * s, y - 35.5 * s], [x - 4.4 * s, y - 35.5 * s]]), "#3A3A40") + nanes(F, mnoho([[x - 2.4 * s, y - 35.5 * s], [x + 2.4 * s, y - 35.5 * s], [x + 2.4 * s, y - 40 * s], [x - 2.4 * s, y - 40 * s]]), "#F2D890") +
      nanes(F, "M" + f1(x - 3 * s) + " " + f1(y - 40 * s) + " L" + x + " " + f1(y - 44 * s) + " L" + f1(x + 3 * s) + " " + f1(y - 40 * s) + " Z", "#3A3A40");
  }
  /* galicijská sýpka hórreo: kamenná komora na sloupcích s kříži na štítech */
  function horreo(F, x, y, s){
    let o = skupina(F, F.stetec, tah("M" + f1(x + 3 * s) + " " + y + " l0 " + f1(-6 * s) + " M" + f1(x + 25 * s) + " " + y + " l0 " + f1(-6 * s), "#8A8070", 2.4 * s, .95));
    o += dum(F, null, x, y - 7 * s, 28 * s, 8 * s, { typ: "sedlo", stena: "#C8BEA8", bok: "#8A806E", strecha: "#B8603E", okna: 0, dvere: false, d: 9 * s, rh: 5 * s });
    let m = ""; for (let i = 1; i < 9; i++) m += tah("M" + f1(x + i * 28 * s / 9) + " " + f1(y - 7 * s) + " l0 " + f1(-8 * s), "#7A7060", .5 * s, .6);
    return o + skupina(F, F.stetec, m + tah("M" + f1(x - .5 * s) + " " + f1(y - 20 * s) + " l0 " + f1(-3.5 * s) + " M" + f1(x - 1.8 * s) + " " + f1(y - 22 * s) + " l" + f1(2.6 * s) + " 0", "#6A6050", .6 * s, .9));
  }
  /* krávy na pastvě; barvy [tělo, skvrny] */
  function kravy(F, r, body, barva, skvrny){
    let k = "", sk = "";
    body.forEach(function(b){ const x = b[0], y = b[1], s = b[2];
      k += '<path d="M' + f1(x) + " " + f1(y) + " l" + f1(.8 * s) + " " + f1(-7 * s) + " l" + f1(13 * s) + " 0 l" + f1(3 * s) + " " + f1(-1.5 * s) + " l" + f1(1.5 * s) + " " + f1(3 * s) + " l" + f1(-2 * s) + " " + f1(1.5 * s) + " l0 " + f1(4 * s) + " l" + f1(-1.4 * s) + " 0 l0 " + f1(-3.5 * s) + " l" + f1(-11 * s) + " 0 l" + f1(-.8 * s) + " " + f1(3.5 * s) + ' z"/>';
      if (skvrny) sk += '<ellipse cx="' + f1(x + 5 * s) + '" cy="' + f1(y - 5 * s) + '" rx="' + f1(3 * s) + '" ry="' + f1(1.6 * s) + '"/><ellipse cx="' + f1(x + 11 * s) + '" cy="' + f1(y - 4.5 * s) + '" rx="' + f1(2 * s) + '" ry="' + f1(1.4 * s) + '"/>'; });
    return '<g filter="url(#' + F.jemna + ')" opacity=".93"><g fill="' + barva + '">' + k + '</g><g fill="' + (skvrny || "none") + '">' + sk + '</g></g>';
  }
  /* kupole nad základnou (cx = střed, by = spodek); tvar: pul (polokoule), perska (mírně hrotitá, s bubnem), ploska */
  function kupole(F, cx, by, w, barva, tvar){
    const h = tvar === "ploska" ? w * .32 : tvar === "perska" ? w * .72 : w * .52, d = tvar === "perska"
      ? "M" + f1(cx - w / 2) + " " + f1(by) + " C" + f1(cx - w * .62) + " " + f1(by - h * .7) + " " + f1(cx - w * .16) + " " + f1(by - h * .86) + " " + f1(cx) + " " + f1(by - h) + " C" + f1(cx + w * .16) + " " + f1(by - h * .86) + " " + f1(cx + w * .62) + " " + f1(by - h * .7) + " " + f1(cx + w / 2) + " " + f1(by) + " Z"
      : "M" + f1(cx - w / 2) + " " + f1(by) + " Q" + f1(cx - w / 2) + " " + f1(by - h * 1.3) + " " + f1(cx) + " " + f1(by - h) + " Q" + f1(cx + w / 2) + " " + f1(by - h * 1.3) + " " + f1(cx + w / 2) + " " + f1(by) + " Z";
    let z = ""; if (tvar === "perska") for (let i = 1; i < 6; i++) { const t = i / 6; z += "M" + f1(cx - w / 2 + w * t) + " " + f1(by) + " Q" + f1(cx - w / 2 + w * t + (cx - (cx - w / 2 + w * t)) * .3) + " " + f1(by - h * .6) + " " + f1(cx) + " " + f1(by - h) + " "; }
    return kryt(F, d, F.jemna) + vrstva(F, d, mix(barva, "#FFFFFF", .25), mix(barva, "#101820", .25), .96, F.jemna) + (z ? skupina(F, F.stetec, tah(z, mix(barva, "#FFFFFF", .5), .45, .6)) : "") +
      skupina(F, F.stetec, tah("M" + f1(cx) + " " + f1(by - h) + " l0 " + f1(-w * .18), "#8A7030", Math.max(.5, w * .03), .9));
  }
  /* minaret: štíhlá věž, ochoz, zakončení tuzka (osmanská špička), banka (cibulka), hranol (hliněný čtverhranný) */
  function minaret(F, x, y, h, s, o){
    o = o || {};
    const w = (o.typ === "hranol" ? 5 : 3.4) * s, st = o.stena || "#F2EADA", d = mnoho([[x - w / 2, y], [x + w / 2, y], [x + w / 2 * .85, y - h], [x - w / 2 * .85, y - h]]);
    let out = kryt(F, d, F.jemna) + nanes(F, d, st) + laz(F, mnoho([[x + w * .1, y], [x + w / 2, y], [x + w / 2 * .85, y - h], [x + w * .1, y - h]]), mix(st, "#4A4E68", .35), .4);
    const b = y - h * .72;
    out += nanes(F, mnoho([[x - w * .9, b], [x + w * .9, b], [x + w * .7, b - 1.4 * s], [x - w * .7, b - 1.4 * s]]), o.ochoz || st);
    if (o.typ === "hranol") out += nanes(F, mnoho([[x - w / 2 - .6 * s, y - h], [x + w / 2 + .6 * s, y - h], [x + w / 2 + .6 * s, y - h - 2 * s], [x - w / 2 - .6 * s, y - h - 2 * s]]), st);
    else if (o.typ === "banka") out += kupole(F, x, y - h, w * 1.3, o.vrch || "#3E8A7A", "pul");
    else out += nanes(F, mnoho([[x - w / 2 * .85, y - h], [x + w / 2 * .85, y - h], [x, y - h - 9 * s]]), o.vrch || "#6E7888") + skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(y - h - 9 * s) + " l0 " + f1(-2.5 * s), "#8A7030", .5 * s, .9));
    if (o.pasy) { let p = ""; for (let i = 1; i < 5; i++) p += tah("M" + f1(x - w / 2) + " " + f1(y - h * i / 5) + " l" + f1(w) + " 0", o.pasy, .9 * s, .8); out += skupina(F, F.stetec, p); }
    return out;
  }
  /* mešita: hranolová stavba, hlavní kupole (a menší), minarety */
  function mesita(F, r, x, y, s, o){
    o = o || {};
    const w = 40 * s, h = 12 * s, st = o.stena || "#F2EADA";
    let out = dum(F, r, x, y, w, h, { typ: "plocha", stena: st, bok: o.bok || mix(st, "#5A5E78", .3), okna: 4, dvere: true, okno: o.okno || "#4A4E62", d: 14 * s });
    if (o.male !== false) [[x + w * .2, 1], [x + w * .8, 1]].forEach(function(k){ out += kupole(F, k[0] + 3 * s, y - h, 9 * s, o.kupole || "#9AA4B8", o.tvar || "pul"); });
    const bw = 14 * s, cx = x + w / 2 + 3 * s, bb = mnoho([[cx - bw / 2, y - h], [cx + bw / 2, y - h], [cx + bw / 2, y - h - 5 * s], [cx - bw / 2, y - h - 5 * s]]);
    out += kryt(F, bb, F.jemna) + nanes(F, bb, st) + kupole(F, cx, y - h - 5 * s, bw * 1.25, o.kupole || "#9AA4B8", o.tvar || "pul");
    (o.minarety || [[-6, 1], [w + 8, 1]]).forEach(function(m){ out += minaret(F, x + m[0] * (m[0] > 0 && m[0] < 1 ? w : 1), y + 1, (o.vyska || 42) * s * m[1], s, { typ: o.minaret, stena: o.stenaMin || st, vrch: o.vrch, pasy: o.pasy }); });
    return out;
  }
  /* kamenná strážní věž (Svanetie, Čečensko): vysoký hranol, střílny, střecha plochá (sedlo) nebo stupňovitý jehlan */
  function strazni(F, x, y, w, h, s, o){
    o = o || {};
    const st = o.stena || "#C8BEA8", d = mnoho([[x, y], [x + w, y], [x + w * .93, y - h], [x + w * .07, y - h]]), dx = w * .3;
    let out = kryt(F, d + mnoho([[x + w, y], [x + w + dx, y - dx * .4], [x + w * .93 + dx, y - h - dx * .4], [x + w * .93, y - h]]), F.jemna) + vrstva(F, d, mix(st, "#FFFFFF", .15), st, .95, F.jemna) +
      nanes(F, mnoho([[x + w, y], [x + w + dx, y - dx * .4], [x + w * .93 + dx, y - h - dx * .4], [x + w * .93, y - h]]), mix(st, "#4A4E68", .3), .9);
    let ok = ""; for (let i = 1; i < 5; i++) ok += mnoho([[x + w * .42, y - h * i / 5], [x + w * .58, y - h * i / 5], [x + w * .58, y - h * i / 5 - 2.4 * s], [x + w * .42, y - h * i / 5 - 2.4 * s]]);
    out += nanes(F, ok, "#3A3634", .8);
    let kam = ""; for (let i = 1; i < 10; i++) kam += tah("M" + f1(x + w * .08) + " " + f1(y - h * i / 10) + " l" + f1(w * .84) + " 0", mix(st, "#3A3A34", .3), .35 * s, .4);
    out += skupina(F, F.stetec, kam);
    if (o.jehlan) { let st2 = ""; for (let i = 0; i < 5; i++) { const t = i / 5, ww = w * (1 - t * .8); st2 += mnoho([[x + w / 2 - ww / 2 + dx * .5, y - h - i * 3 * s], [x + w / 2 + ww / 2 + dx * .5, y - h - i * 3 * s], [x + w / 2 + ww / 2 * .85 + dx * .5, y - h - (i + 1) * 3 * s], [x + w / 2 - ww / 2 * .85 + dx * .5, y - h - (i + 1) * 3 * s]]); }
      out += nanes(F, st2, mix(st, "#3A3A40", .25)) + nanes(F, mnoho([[x + w * .45 + dx * .5, y - h - 15 * s], [x + w * .55 + dx * .5, y - h - 15 * s], [x + w / 2 + dx * .5, y - h - 21 * s]]), mix(st, "#3A3A40", .35)); }
    else out += nanes(F, mnoho([[x - w * .05, y - h], [x + w * .5, y - h - w * .4], [x + w * 1.05, y - h], [x + w * 1.05 + dx, y - h - dx * .4], [x + w * .5 + dx, y - h - w * .4 - dx * .4]]), o.strecha || "#6E6A68");
    return out;
  }
  /* arménský kostel: kamenná loď, válcový buben s kuželovou střechou */
  function armensky(F, r, x, y, s, st){
    st = st || "#C89A7E";
    let out = dum(F, r, x, y, 28 * s, 13 * s, { typ: "sedlo", stena: st, strecha: mix(st, "#3A3A3A", .2), okna: 0, dvere: false, d: 16 * s, rh: 6 * s });
    out += nanes(F, "M" + f1(x + 13 * s) + " " + y + " l0 " + f1(-7 * s) + " q" + f1(2 * s) + " " + f1(-3 * s) + " " + f1(4 * s) + " 0 l0 " + f1(7 * s) + " z", "#4A3A34", .8);
    const cx = x + 14 * s + 4 * s, by = y - 13 * s - 5 * s, bw = 9 * s, b = mnoho([[cx - bw / 2, by + 4 * s], [cx + bw / 2, by + 4 * s], [cx + bw / 2, by - 7 * s], [cx - bw / 2, by - 7 * s]]);
    out += kryt(F, b, F.jemna) + vrstva(F, b, mix(st, "#FFFFFF", .15), st, .95, F.jemna) + laz(F, mnoho([[cx + 1 * s, by + 4 * s], [cx + bw / 2, by + 4 * s], [cx + bw / 2, by - 7 * s], [cx + 1 * s, by - 7 * s]]), "#6A4A40", .35);
    out += nanes(F, mnoho([[cx - .5 * s, by - 1 * s], [cx + .5 * s, by - 1 * s], [cx + .5 * s, by - 5 * s], [cx - .5 * s, by - 5 * s]]), "#3A3230", .8);
    out += nanes(F, mnoho([[cx - bw / 2 - .8 * s, by - 7 * s], [cx + bw / 2 + .8 * s, by - 7 * s], [cx, by - 17 * s]]), mix(st, "#3A3A3A", .3)) + skupina(F, F.stetec, tah("M" + f1(cx) + " " + f1(by - 17 * s) + " l0 " + f1(-3 * s) + " M" + f1(cx - 1.2 * s) + " " + f1(by - 19 * s) + " l" + f1(2.4 * s) + " 0", "#4A3A34", .5 * s, .8));
    return out;
  }
  /* portál íwán: vysoký pravoúhlý rám s hrotitým obloukem a modrými obklady */
  function iwan(F, x, y, w, h, s, st, dlazba){
    const ram = mnoho([[x, y], [x + w, y], [x + w, y - h], [x, y - h]]), ob = "M" + f1(x + w * .2) + " " + y + " L" + f1(x + w * .2) + " " + f1(y - h * .55) + " Q" + f1(x + w * .2) + " " + f1(y - h * .85) + " " + f1(x + w / 2) + " " + f1(y - h * .9) + " Q" + f1(x + w * .8) + " " + f1(y - h * .85) + " " + f1(x + w * .8) + " " + f1(y - h * .55) + " L" + f1(x + w * .8) + " " + y + " Z";
    return kryt(F, ram, F.jemna) + nanes(F, ram, st || "#E6D2AC") + nanes(F, mnoho([[x + w * .1, y - h * .05], [x + w * .9, y - h * .05], [x + w * .9, y - h * .95], [x + w * .1, y - h * .95]]), dlazba || "#2E7AB0", .9) + nanes(F, ob, "#1E3A5A", .85) +
      skupina(F, F.stetec, tah("M" + f1(x + w * .1) + " " + f1(y - h * .95) + " l" + f1(w * .8) + " 0", "#E8C860", .8 * s, .8));
  }
  /* hinduistický chrám nágara: věž šikhara (vypouklý kužel s žebry a plochým kotoučem amalaka), předsíň */
  function sikhara(F, x, y, s, st){
    st = st || "#E0B890";
    const w = 16 * s, h = 34 * s, d = "M" + f1(x - w / 2) + " " + f1(y - 8 * s) + " C" + f1(x - w * .55) + " " + f1(y - h * .6) + " " + f1(x - w * .3) + " " + f1(y - h * .95) + " " + f1(x) + " " + f1(y - h) + " C" + f1(x + w * .3) + " " + f1(y - h * .95) + " " + f1(x + w * .55) + " " + f1(y - h * .6) + " " + f1(x + w / 2) + " " + f1(y - 8 * s) + " Z";
    const zak = mnoho([[x - w * .6, y], [x + w * .6, y], [x + w * .6, y - 8 * s], [x - w * .6, y - 8 * s]]), pr = mnoho([[x - w * 1.5, y], [x - w * .6, y], [x - w * .6, y - 6 * s], [x - w * 1.5, y - 6 * s]]);
    let z = ""; for (let i = 1; i < 7; i++) { const t = i / 7; z += "M" + f1(x - w / 2 + w * t) + " " + f1(y - 8 * s) + " Q" + f1(x - w / 2 + w * t + (x - (x - w / 2 + w * t)) * .3) + " " + f1(y - h * .6) + " " + f1(x) + " " + f1(y - h) + " "; }
    for (let i = 1; i < 6; i++) z += "M" + f1(x - w * .52) + " " + f1(y - 8 * s - (h - 8 * s) * i / 7) + " l" + f1(w * 1.04 * (1 - i / 9)) + " 0 ";
    return kryt(F, d + zak + pr, F.jemna) + vrstva(F, d, mix(st, "#FFFFFF", .2), mix(st, "#4A2A1A", .2), .96, F.jemna) + laz(F, "M" + f1(x) + " " + f1(y - h) + " C" + f1(x + w * .3) + " " + f1(y - h * .95) + " " + f1(x + w * .55) + " " + f1(y - h * .6) + " " + f1(x + w / 2) + " " + f1(y - 8 * s) + " L" + f1(x + w * .1) + " " + f1(y - 8 * s) + " Z", "#6A3A2A", .3) +
      skupina(F, F.stetec, tah(z, mix(st, "#5A3A2A", .5), .4 * s, .55)) + nanes(F, zak + pr, st) + laz(F, pr, "#8A5A40", .2) +
      nanes(F, "M" + f1(x - 3 * s) + " " + f1(y - h) + " q" + f1(3 * s) + " " + f1(-2.5 * s) + " " + f1(6 * s) + " 0 z", mix(st, "#4A2A1A", .2)) + skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(y - h - 2 * s) + " l0 " + f1(-4 * s), "#C8402E", .6 * s, .9) + tah("M" + f1(x) + " " + f1(y - h - 6 * s) + " l" + f1(3 * s) + " " + f1(1 * s), "#E8802E", .9 * s, .9));
  }
  /* jihoindická brána gópuram: stupňovitý lichoběžník s pestrými patry a valenou střechou */
  function gopuram(F, x, y, s){
    let out = "";
    const pat = 7, w0 = 30 * s, h0 = 7 * s, barvy = ["#E8C890", "#D8A868", "#E8D0A0", "#C89060"];
    for (let i = 0; i < pat; i++) { const w = w0 * (1 - i * .1), yy = y - i * h0, d = mnoho([[x - w / 2, yy], [x + w / 2, yy], [x + w / 2 * .94, yy - h0], [x - w / 2 * .94, yy - h0]]);
      out += kryt(F, d, F.jemna) + nanes(F, d, barvy[i % 4]) + laz(F, mnoho([[x + w * .15, yy], [x + w / 2, yy], [x + w / 2 * .94, yy - h0], [x + w * .15, yy - h0]]), "#7A4A2A", .3);
      let fg = ""; for (let k = 0; k < 5 - Math.floor(i / 2); k++) fg += '<circle cx="' + f1(x - w * .38 + k * w * .76 / Math.max(1, 4 - Math.floor(i / 2))) + '" cy="' + f1(yy - h0 * .5) + '" r="' + f1(.9 * s) + '" fill="' + ["#3E8A6A", "#C8402E", "#2E6AB0", "#E8C040"][(k + i) % 4] + '"/>';
      out += '<g opacity=".8">' + fg + '</g>'; }
    const tw = w0 * .3, ty = y - pat * h0;
    out += vrstva(F, "M" + f1(x - tw / 2) + " " + f1(ty) + " Q" + f1(x) + " " + f1(ty - 9 * s) + " " + f1(x + tw / 2) + " " + f1(ty) + " Z", "#E8C890", "#A87850", .95, F.jemna);
    out += nanes(F, "M" + f1(x - 3 * s) + " " + y + " l0 " + f1(-9 * s) + " q" + f1(3 * s) + " " + f1(-3 * s) + " " + f1(6 * s) + " 0 l0 " + f1(9 * s) + " z", "#3A2A20", .85);
    return out;
  }
  /* stúpa (dagoba, čhorten): bílá zvonovitá kupole na podstavci, hranolek a špice */
  function stupa(F, x, y, s, barva, spice){
    barva = barva || "#FBFAF6";
    const pod = mnoho([[x - 16 * s, y], [x + 16 * s, y], [x + 14 * s, y - 4 * s], [x - 14 * s, y - 4 * s]]), kop = "M" + f1(x - 13 * s) + " " + f1(y - 4 * s) + " Q" + f1(x - 13 * s) + " " + f1(y - 24 * s) + " " + f1(x) + " " + f1(y - 25 * s) + " Q" + f1(x + 13 * s) + " " + f1(y - 24 * s) + " " + f1(x + 13 * s) + " " + f1(y - 4 * s) + " Z";
    const hr = mnoho([[x - 3.5 * s, y - 24 * s], [x + 3.5 * s, y - 24 * s], [x + 3.5 * s, y - 29 * s], [x - 3.5 * s, y - 29 * s]]), sp = mnoho([[x - 2.2 * s, y - 29 * s], [x + 2.2 * s, y - 29 * s], [x, y - 44 * s]]);
    return kryt(F, pod + kop + hr + sp, F.jemna) + nanes(F, pod + kop + hr, barva) + laz(F, "M" + f1(x + 2 * s) + " " + f1(y - 25 * s) + " Q" + f1(x + 13 * s) + " " + f1(y - 24 * s) + " " + f1(x + 13 * s) + " " + f1(y - 4 * s) + " L" + f1(x + 3 * s) + " " + f1(y - 4 * s) + " Z", "#9AA0B8", .35) +
      nanes(F, sp, spice || "#C8A040") + skupina(F, F.stetec, tah("M" + f1(x - 2 * s) + " " + f1(y - 33 * s) + " l" + f1(4 * s) + " 0 M" + f1(x - 1.6 * s) + " " + f1(y - 37 * s) + " l" + f1(3.2 * s) + " 0", mix(spice || "#C8A040", "#3A2A10", .4), .5 * s, .8));
  }
  /* pagoda: patrová věž s prohnutými střechami (Nepál, Čína, Japonsko); o.patra, o.stena, o.strecha */
  function pagoda(F, x, y, s, o){
    o = o || {};
    const n = o.patra || 3, st = o.stena || "#A8402E", str = o.strecha || "#4A4A50";
    let out = "", yy = y;
    for (let i = 0; i < n; i++) { const w = (18 - i * 3) * s, h = (i ? 6 : 9) * s, tel = mnoho([[x - w / 2, yy], [x + w / 2, yy], [x + w / 2, yy - h], [x - w / 2, yy - h]]);
      out += kryt(F, tel, F.jemna) + nanes(F, tel, st) + laz(F, mnoho([[x + w * .1, yy], [x + w / 2, yy], [x + w / 2, yy - h], [x + w * .1, yy - h]]), "#3A1A10", .3);
      const rw = w * 1.7, ry = yy - h, strecha = "M" + f1(x - rw / 2) + " " + f1(ry - 2 * s) + " Q" + f1(x - rw * .3) + " " + f1(ry + .5 * s) + " " + f1(x - w * .4) + " " + f1(ry) + " L" + f1(x - w * .25) + " " + f1(ry - 6 * s) + " L" + f1(x + w * .25) + " " + f1(ry - 6 * s) + " L" + f1(x + w * .4) + " " + f1(ry) + " Q" + f1(x + rw * .3) + " " + f1(ry + .5 * s) + " " + f1(x + rw / 2) + " " + f1(ry - 2 * s) + " Z";
      out += kryt(F, strecha, F.jemna) + vrstva(F, strecha, mix(str, "#FFFFFF", .15), mix(str, "#101010", .2), .96, F.jemna);
      yy = ry - 6 * s; }
    return out + nanes(F, mnoho([[x - 1 * s, yy], [x + 1 * s, yy], [x, yy - 9 * s]]), o.spice || "#C8A040");
  }
  /* modlitební praporky: šňůry pestrých vlaječek */
  function praporky(F, x0, y0, x1, y1, s){
    let o = tah("M" + f1(x0) + " " + f1(y0) + " Q" + f1((x0 + x1) / 2) + " " + f1((y0 + y1) / 2 + 8 * s) + " " + f1(x1) + " " + f1(y1), "#6A5A4A", .4, .7), v = "";
    const barvy = ["#2E6AC8", "#FBFAF6", "#C8402E", "#3E9A4A", "#E8C040"];
    for (let i = 1; i < 14; i++) { const t = i / 14, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 8 * s * .9; v += mnoho([[x - 1.6 * s, y], [x + 1.6 * s, y], [x + 1.4 * s, y + 4 * s], [x - 1.4 * s, y + 4 * s]]).replace(/ Z $/, " Z").replace(/^/, '<path fill="' + barvy[i % 5] + '" d="') + '"/>'; }
    return skupina(F, F.stetec, o) + '<g opacity=".92" filter="url(#' + F.jemna + ')">' + v + '</g>';
  }
  /* síň s prohnutou střechou (Čína, Korea, Japonsko): zdi, sloupy, střecha s vytaženými rohy; o.patra = počet střech */
  function sin(F, x, y, w, h, s, o){
    o = o || {};
    const st = o.stena || "#B8402E", str = o.strecha || "#4A4E56", zv = o.zvednuti == null ? 1 : o.zvednuti;
    let out = "", yy = y, ww = w;
    const n = o.patra || 1;
    for (let i = 0; i < n; i++) {
      const hh = i ? h * .6 : h, tel = mnoho([[x + (w - ww) / 2, yy], [x + (w + ww) / 2, yy], [x + (w + ww) / 2, yy - hh], [x + (w - ww) / 2, yy - hh]]);
      out += kryt(F, tel, F.jemna) + nanes(F, tel, st) + laz(F, mnoho([[x + w / 2 + ww * .2, yy], [x + (w + ww) / 2, yy], [x + (w + ww) / 2, yy - hh], [x + w / 2 + ww * .2, yy - hh]]), "#2A1A10", .25);
      if (o.okna !== false) { let ok = ""; const k = Math.max(2, Math.round(ww / (8 * s))); for (let j = 0; j < k; j++) ok += tah("M" + f1(x + (w - ww) / 2 + ww * (j + .5) / k) + " " + f1(yy) + " l0 " + f1(-hh * .8), o.sloup || "#6A2A1E", .7 * s, .8); out += skupina(F, F.stetec, ok); }
      const rw = ww * 1.36, rx = x + w / 2, ry = yy - hh, rh = (i ? 7 : 10) * s;
      const d = "M" + f1(rx - rw / 2) + " " + f1(ry - 3 * s * zv) + " Q" + f1(rx - rw * .36) + " " + f1(ry + 1 * s) + " " + f1(rx - ww * .45) + " " + f1(ry) + " L" + f1(rx - ww * .32) + " " + f1(ry - rh) + " L" + f1(rx + ww * .32) + " " + f1(ry - rh) + " L" + f1(rx + ww * .45) + " " + f1(ry) + " Q" + f1(rx + rw * .36) + " " + f1(ry + 1 * s) + " " + f1(rx + rw / 2) + " " + f1(ry - 3 * s * zv) + " Z";
      out += kryt(F, d, F.jemna) + vrstva(F, d, mix(str, "#FFFFFF", .15), mix(str, "#101010", .25), .96, F.jemna);
      let t = ""; for (let j = 1; j < 8; j++) t += "M" + f1(rx - ww * .32 + ww * .64 * j / 8) + " " + f1(ry - rh) + " L" + f1(rx - ww * .45 + ww * .9 * j / 8) + " " + f1(ry - .5) + " ";
      out += skupina(F, F.stetec, tah(t, mix(str, "#101010", .4), .4 * s, .45) + tah("M" + f1(rx - ww * .34) + " " + f1(ry - rh) + " L" + f1(rx + ww * .34) + " " + f1(ry - rh), mix(str, "#101010", .4), 1 * s, .8));
      yy = ry - rh; ww *= .72; }
    return out;
  }
  /* obloukový kamenný most */
  function mostek(F, x, y, w, s, barva){
    const d = "M" + f1(x) + " " + f1(y) + " Q" + f1(x + w / 2) + " " + f1(y - w * .45) + " " + f1(x + w) + " " + f1(y) + " L" + f1(x + w * .82) + " " + f1(y) + " Q" + f1(x + w / 2) + " " + f1(y - w * .28) + " " + f1(x + w * .18) + " " + f1(y) + " Z";
    return kryt(F, d, F.jemna) + vrstva(F, d, barva || "#C8C0B0", mix(barva || "#C8C0B0", "#3A3A3A", .3), .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(y - 1) + " Q" + f1(x + w / 2) + " " + f1(y - w * .45 - 1) + " " + f1(x + w) + " " + f1(y - 1), "#6A6460", .5 * s, .6));
  }
  /* brána torii: dva sloupy, dvojitý prohnutý nosník */
  function torii(F, x, y, w, h, s){
    const b = "#C8402E";
    return skupina(F, F.stetec, tah("M" + f1(x + w * .15) + " " + y + " l" + f1(w * .02) + " " + f1(-h) + " M" + f1(x + w * .85) + " " + y + " l" + f1(-w * .02) + " " + f1(-h), b, 2.2 * s, .95) +
      tah("M" + f1(x) + " " + f1(y - h - 1 * s) + " Q" + f1(x + w / 2) + " " + f1(y - h + 2 * s) + " " + f1(x + w) + " " + f1(y - h - 1 * s), "#2A2A2A", 2.4 * s, .95) + tah("M" + f1(x + w * .08) + " " + f1(y - h * .78) + " L" + f1(x + w * .92) + " " + f1(y - h * .78), b, 1.6 * s, .95));
  }
  /* thajský chrám wat: bílý podstavec, vrstvené strmé střechy (oranžová se zeleným lemem) se zdviženými konci */
  function wat(F, x, y, s, o){
    o = o || {};
    const w = 34 * s, st = o.stena || "#FBFAF6", barvy = o.barvy || ["#D86A2E", "#3E8A5A"];
    let out = dum(F, null, x, y, w, 10 * s, { typ: "plocha", stena: st, bok: "#C8CCD8", okna: 3, okno: "#C8A040", d: 10 * s });
    for (let i = 0; i < 3; i++) { const ww = w * (1.1 - i * .22), cx = x + w / 2 + 2 * s, by = y - 10 * s - i * 7 * s, hh = 12 * s,
        d = "M" + f1(cx - ww / 2) + " " + f1(by) + " L" + f1(cx - ww * .18) + " " + f1(by - hh) + " L" + f1(cx + ww * .18) + " " + f1(by - hh) + " L" + f1(cx + ww / 2) + " " + f1(by) + " Z";
      out += kryt(F, d, F.jemna) + vrstva(F, d, mix(barvy[0], "#FFFFFF", .15), mix(barvy[0], "#3A1A0A", .2), .96, F.jemna) + skupina(F, F.stetec, tah("M" + f1(cx - ww / 2) + " " + f1(by) + " L" + f1(cx - ww * .18) + " " + f1(by - hh) + " M" + f1(cx + ww / 2) + " " + f1(by) + " L" + f1(cx + ww * .18) + " " + f1(by - hh), barvy[1], 1.2 * s, .9) +
        tah("M" + f1(cx - ww / 2) + " " + f1(by) + " q" + f1(-2 * s) + " " + f1(-1 * s) + " " + f1(-2 * s) + " " + f1(-4 * s) + " M" + f1(cx + ww / 2) + " " + f1(by) + " q" + f1(2 * s) + " " + f1(-1 * s) + " " + f1(2 * s) + " " + f1(-4 * s), "#C8A040", 1 * s, .9)); }
    return out;
  }
  /* bůvol */
  function buvol(F, x, y, s){
    return '<g filter="url(#' + F.jemna + ')" opacity=".93"><path d="M' + f1(x) + " " + f1(y) + " l" + f1(1 * s) + " " + f1(-8 * s) + " q" + f1(6 * s) + " " + f1(-2 * s) + " " + f1(12 * s) + " 0 l" + f1(3 * s) + " " + f1(1 * s) + " l" + f1(1.5 * s) + " " + f1(4 * s) + " l" + f1(-2 * s) + " " + f1(1 * s) + " l0 " + f1(4 * s) + " l" + f1(-1.4 * s) + " 0 l0 " + f1(-3 * s) + " l" + f1(-10 * s) + " 0 l" + f1(-.8 * s) + " " + f1(3 * s) + ' z" fill="#4A4448"/><path d="M' + f1(x + 15 * s) + " " + f1(y - 7 * s) + " q" + f1(-3 * s) + " " + f1(-4 * s) + " " + f1(-6 * s) + " " + f1(-2 * s) + " M" + f1(x + 16 * s) + " " + f1(y - 7 * s) + " q" + f1(4 * s) + " " + f1(-4 * s) + " " + f1(6 * s) + " " + f1(-1 * s) + '" stroke="#3A3434" stroke-width="' + f1(.8 * s) + '" fill="none"/></g>';
  }
  /* dům na kůlech: kůly a pod nimi stín, nahoře dum() */
  function naKulech(F, r, x, y, w, h, k, o){
    let t = ""; for (let i = 0; i <= 3; i++) t += tah("M" + f1(x + 1 + (w - 2) * i / 3) + " " + y + " l0 " + f1(-k), "#5A4632", 1.3, .95);
    return skupina(F, F.stetec, t) + dum(F, r, x, y - k, w, h, o);
  }
  /* skupina domů: seřadí je odzadu dopředu, aby bližší zakryly vzdálenější. d = [x, y, w, h, volby] */
  function vesnice(F, r, domy){ return domy.slice().sort(function(a, b){ return a[1] - b[1]; }).map(function(d){ return d[4] && d[4].kostel ? kostel(F, r, d[0], d[1], d[2], d[4]) : dum(F, r, d[0], d[1], d[2], d[3], d[4]); }).join(""); }
  /* skála / pahorek pod stavbou */
  function skalka(F, x, y, w, h, barva){
    /* rozeklaná skála: svislé stěny, vrstvy a stín vpravo */
    const q = nahoda(Math.round(x * 13 + y * 7) + 5), b = clenit([[x - w, y + h], [x - w * .8, y + h * .45], [x - w * .6, y + h * .1], [x - w * .3, y - 1], [x + w * .35, y], [x + w * .6, y + h * .15], [x + w * .75, y + h * .5], [x + w, y + h]], q, .25, .12, 3);
    const d = cesta(b) + " Z";
    let o = kryt(F, d) + vrstva(F, d, mix(barva, "#FFFFFF", .15), mix(barva, "#2A2A2A", .25), .92);
    o += laz(F, "M" + f1(x + w * .15) + " " + f1(y) + " " + cesta(b.filter(function(p){ return p[0] > x + w * .15; })).replace(/^M/, "L") + " L" + f1(x + w * .3) + " " + f1(y + h) + " Z", mix(barva, "#2A3040", .45), .4);
    let t = ""; for (let i = 0; i < 7; i++) { const yy = y + h * (.15 + i * .12); t += tah("M" + f1(x - w * (.7 - i * .02) + q() * 6) + " " + f1(yy) + " l" + f1(w * (.5 + q() * .6)) + " " + f1((q() - .5) * 2), mix(barva, "#2A2A2A", .4), .5, .35); }
    return o + skupina(F, F.stetec, t);
  }

  function domky(F, r, x0, y0, n, strecha, rozestup){
    let st = "", zd = "", ok = "";
    for (let i = 0; i < n; i++) { const x = x0 + i * (rozestup || 12) + r() * 4, y = y0 + (r() - .5) * 4, w = 8 + r() * 4;
      zd += "M" + f1(x) + " " + f1(y) + " l0 -7 l" + f1(w) + " 0 l0 7 z ";
      st += "M" + f1(x - 1.5) + " " + f1(y - 7) + " l" + f1(w / 2 + 1.5) + " -6 l" + f1(w / 2 + 1.5) + " 6 z ";
      ok += "M" + f1(x + 2) + " " + f1(y - 4.5) + " l1.6 0 l0 1.8 l-1.6 0 z "; }
    return jem(F, zd, "#F6F1E6", .97) + laz(F, zd, "#C9BBA2", .25) + jem(F, st, strecha || "#C4553A", .9) + jem(F, ok, "#4A4A55", .7);
  }
  function vinetace(F){
    const g = F.id + "vg";
    return '<defs><radialGradient id="' + g + '" cx="50%" cy="46%" r="72%"><stop offset=".78" stop-color="#FBF7EE" stop-opacity="0"/><stop offset="1" stop-color="#FBF7EE" stop-opacity=".32"/></radialGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + g + ')"/>';
  }

  const K = {
    /* Porýní (němčina): řeka v údolí, vinice na svahu, zřícenina hradu, městečko hrázděných domů, kostel s břidlicovou věží */
    porynsko: function(F, r){
      const q = nahoda(F.sem + 101);
      let o = nebe(F, "#82AAD8", "#F2E8D2") + mraky(F, r, 3, 26, 64, 80) + rasy(F, r, 2, 12, 28);
      o += hrebeny(F, [[98, 8, 70, 1, "#8A9CB6", .55], [116, 10, 60, 2.2, "#6E8E6A", .35]]);
      const svah = "M-10 256 L-10 108 Q40 96 90 114 Q140 132 180 162 L180 256 Z";
      o += kryt(F, svah) + vrstva(F, svah, "#8EAE62", "#5E8A46", .9);
      let vin = ""; for (let i = 0; i < 16; i++) { const y = 116 + i * 5; vin += tah("M-10 " + f1(y) + " Q60 " + f1(y - 6 + i) + " " + f1(120 + i * 4) + " " + f1(y + 20 + i * 2), "#4E7A36", .9, .7); }
      o += '<defs><clipPath id="' + F.id + 'sv"><path d="' + svah + '"/></clipPath></defs><g clip-path="url(#' + F.id + 'sv)">' + skupina(F, F.stetec, vin) + '</g>';
      o += skalka(F, 58, 104, 22, 14, "#9A9280") + hrad(F, q, 44, 104, .55, { stena: "#CFC4AE", strecha: "#5A6070" });
      const pr = "M90 256 Q150 200 180 162 Q260 150 420 156 L420 256 Z";
      o += kryt(F, pr) + vrstva(F, pr, "#A8BE7A", "#7E9E5A", .9) + koruny(F, q, 190, 420, 160, .5, "#5E8A50", .8, F.jemna);
      o += voda(F, r, "M-10 196 Q140 186 250 180 Q340 176 420 178 L420 196 Q300 196 200 206 Q90 216 -10 230 Z", "#B4CCE0", "#7E9EC0", 182, 226, 10);
      o += vesnice(F, q, [[228, 176, 16, 14, { typ: "stit", hrazdi: "#5A3A2A", patra: 2, strecha: "#9A4232" }], [246, 178, 20, 12, { typ: "sedlo", hrazdi: "#5A3A2A", patra: 2, strecha: "#A84A34", komin: true }],
        [300, 176, 18, 15, { typ: "stit", hrazdi: "#4A3A30", patra: 2, strecha: "#5E6272", stena: "#F2E6C8" }], [320, 177, 16, 12, { typ: "stit", stena: "#EAD2A8", patra: 2, strecha: "#9A4232" }],
        [340, 176, 22, 13, { typ: "sedlo", hrazdi: "#5A3A2A", patra: 2, strecha: "#5E6272" }], [372, 178, 16, 14, { typ: "stit", hrazdi: "#5A3A2A", patra: 2, strecha: "#A84A34" }],
        [268, 176, 1, 0, { kostel: 1, vez: "jehlan", strecha: "#5E6272", vezStrecha: "#4E5666" }]]);
      o += hrebeny(F, [[232, 4, 80, 3, "#7EA04E", 0]]) + strom(F, q, 30, 244, 1.3, "#5E8440") + strom(F, q, 356, 246, 1.2, "#5E8440");
      return o + trava(F, r, 120, 234, 254, ["#557F38", "#78A04A", "#46692E"]) + kvety(F, r, 14, 238, 252, ["#F4F0E4", "#E8D56A"], .9);
    },
    /* Burgundsko (francouzština): vinice v řádcích k obzoru, kamenná vesnice s břidlicí a kostelní věží, topoly */
    vinice: function(F, r){
      const q = nahoda(F.sem + 103);
      let o = nebe(F, "#7EA8DA", "#F4E6CC") + mraky(F, r, 3, 30, 72, 90) + rasy(F, r, 2, 12, 28);
      o += hrebeny(F, [[118, 6, 80, 1, "#8C9EB6", .5], [136, 8, 60, 2, "#8EA868", .25]]);
      o += vesnice(F, q, [[170, 146, 16, 10, { typ: "valba", stena: "#E6D6B8", strecha: "#5E6878", okenice: "#7E8A96" }], [190, 147, 14, 9, { typ: "sedlo", stena: "#EADCC0", strecha: "#A85A3E" }],
        [240, 146, 18, 11, { typ: "valba", stena: "#E6D6B8", strecha: "#5E6878", patra: 2, okenice: "#7E8A96" }], [262, 148, 14, 9, { typ: "sedlo", stena: "#EADCC0", strecha: "#A85A3E" }],
        [214, 148, .8, 0, { kostel: 1, vez: "jehlan", stena: "#E2D2B2", strecha: "#5E6878", vezStrecha: "#4E5666" }]]);
      for (let i = 0; i < 7; i++) o += cypris(F, q, 300 + i * 11, 150, 30 + q() * 6).replace(/#4E6E48/g, "#5E7E4A");
      o += hrebeny(F, [[152, 3, 90, 3, "#9AB06A", 0]]);
      /* řádky vinné révy k úběžníku */
      const vx = 200, vy = 150; let rady = "", listy = "";
      for (let k = -9; k <= 9; k++) { const xb = 200 + k * 46;
        for (let t = .1; t <= 1.05; t += .03 + t * .03) { const x = vx + (xb - vx) * t, y = vy + (H - vy) * t, s = .4 + t * 2.4;
          if (y < 156) continue;
          listy += '<ellipse cx="' + f1(x + (q() - .5) * s) + '" cy="' + f1(y - s * 1.2) + '" rx="' + f1(s * 1.3) + '" ry="' + f1(s * .9) + '" fill="' + mix("#5E8A3A", q() < .5 ? "#B4C050" : "#2E5A2E", q() * .4) + '"/>'; }
        rady += "M" + f1(vx + (xb - vx) * .1) + " " + f1(vy + (H - vy) * .1) + " L" + f1(xb) + " " + H + " "; }
      o += vrstva(F, "M-10 256 L-10 156 L410 156 L410 256 Z", "#C8A878", "#A8845A", .6) + skupina(F, F.stetec, '<path d="' + rady + '" stroke="#6A5A3A" stroke-width=".6" opacity=".5" fill="none"/>');
      o += '<g opacity=".88" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + listy + '</g>';
      return o;
    },
    /* Toskánsko (italština): zvlněné kopce, cesta lemovaná cypřiši k statku na návrší, městečko se zvonicí v dálce */
    toskansko: function(F, r){
      const q = nahoda(F.sem + 107);
      let o = nebe(F, "#86B0DE", "#F6E6C8") + rasy(F, r, 3, 14, 40) + mraky(F, r, 2, 40, 66, 70);
      o += hrebeny(F, [[112, 8, 70, 1, "#9AA6BE", .55]]);
      o += vesnice(F, q, [[64, 116, 10, 8, { typ: "valba", stena: "#E8CFA4", strecha: "#B8643E", okna: 1 }], [78, 115, 12, 9, { typ: "valba", stena: "#E2C69A", strecha: "#B8643E", okna: 1 }], [96, 116, 10, 7, { typ: "valba", stena: "#E8CFA4", strecha: "#B8643E", okna: 1 }], [88, 117, .5, 0, { kostel: 1, vez: "kampanila", stena: "#E2C69A", strecha: "#B8643E" }]]);
      o += hrebeny(F, [[132, 12, 60, 2.5, "#A8B472", .25], [158, 14, 55, 4, "#B8B86E", .05]]);
      const kx = 280, ky = vyska(kx, 158, 14, 55, 4) + 3;
      o += vesnice(F, q, [[kx, ky, 28, 14, { typ: "valba", stena: "#E6CCA0", strecha: "#B8643E", patra: 2, okenice: "#7E6A56", rh: 6 }], [kx + 18, ky - 1, 8, 22, { typ: "valba", stena: "#E0C498", strecha: "#B8643E", okna: 1, dvere: false, rh: 4 }]]);
      const cesta_ = "M300 " + f1(ky + 2) + " C250 176 330 196 250 210 C170 224 230 240 180 262";
      o += skupina(F, F.stetec, tah(cesta_, "#E6D2A8", 5, .9) + tah(cesta_, "#C8A878", 1, .5));
      [[296, ky + 4, 22], [262, 182, 26], [300, 194, 30], [226, 212, 36], [210, 232, 44], [258, 206, 32]].forEach(function(c){ o += cypris(F, q, c[0], c[1], c[2]); });
      /* zorané pole a pšenice v popředí */
      let br = ""; for (let i = 0; i < 12; i++) br += tah("M-10 " + f1(214 + i * 4) + " Q80 " + f1(206 + i * 4.5) + " 170 " + f1(222 + i * 4), "#A8905A", .6, .4);
      o += hrebeny(F, [[210, 8, 70, 5.5, "#D4BC78", 0]]) + skupina(F, F.stetec, br);
      for (let i = 0; i < 3; i++) o += oliva(F, q, 330 + i * 26, 232 + q() * 8, 1.1);
      return o + kvety(F, r, 22, 220, 252, ["#D23A2B", "#E0452F"], 1.1);
    },
    /* Provence (okcitánština): levandulová pole v řádcích, kamenný statek s prejzovou střechou, cypřiše */
    levandule: function(F, r){
      const q = nahoda(F.sem + 109);
      let o = nebe(F, "#6EA6E0", "#F6E8CE") + rasy(F, r, 3, 14, 40);
      o += hrebeny(F, [[118, 10, 60, 1, "#9AA2C4", .55], [140, 6, 80, 2.4, "#A8B476", .25]]);
      o += vesnice(F, q, [[210, 150, 34, 14, { typ: "valba", stena: "#E8D2AC", strecha: "#C4704A", patra: 2, okenice: "#8AA2B4", rh: 6 }], [246, 151, 16, 10, { typ: "valba", stena: "#E2C8A0", strecha: "#C4704A", okenice: "#8AA2B4", rh: 5 }]]);
      o += cypris(F, q, 200, 152, 40) + cypris(F, q, 272, 153, 34) + koruny(F, q, 120, 170, 150, .6, "#6E8E4E", .85, F.jemna);
      o += hrebeny(F, [[156, 2, 90, 3, "#B8B070", 0]]);
      const vx = 230, vy = 156; let l = "";
      for (let k = -12; k <= 12; k++) { const xb = 230 + k * 34;
        for (let t = .05; t <= 1.05; t += .025 + t * .025) { const x = vx + (xb - vx) * t, y = vy + (H - vy) * t, s = .3 + t * 2.6;
          l += '<ellipse cx="' + f1(x) + '" cy="' + f1(y - s) + '" rx="' + f1(s * 1.5) + '" ry="' + f1(s * 1.05) + '" fill="' + mix("#8A6AC8", q() < .5 ? "#C8A8E8" : "#5A3E9A", q() * .45) + '"/>'; } }
      o += vrstva(F, "M-10 256 L-10 158 L410 158 L410 256 Z", "#C8B07E", "#A89060", .55) + '<g opacity=".9" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + l + '</g>';
      return o + ptaci(F, r, 3, 90, 60);
    },
    /* Lucembursko: hrad na skále nad údolím, lesnaté kopce, řeka s kamenným mostem, domy s břidlicovými střechami */
    lucembursko: function(F, r){
      const q = nahoda(F.sem + 113);
      let o = nebe(F, "#84A8D4", "#F0E8D6") + mraky(F, r, 3, 26, 66, 80);
      o += hrebeny(F, [[104, 10, 60, 1, "#8C9EB2", .55]]) + pas(F, q, 124, .6, mix("#5E8052", F.opar, .3));
      o += skalka(F, 150, 128, 34, 40, "#A89C86") + hrad(F, q, 124, 130, .8, { stena: "#D8CCB2", strecha: "#4E5666" });
      [["M-20 256 L-20 170 Q40 164 90 176 Q120 190 130 214 L130 256 Z", 0], ["M290 256 L290 212 Q300 186 340 170 Q380 160 420 164 L420 256 Z", 1]].forEach(function(b){
        o += kryt(F, b[0]) + vrstva(F, b[0], "#6E9A5A", "#4E7A48", .9) + koruny(F, q, b[1] ? 300 : -20, b[1] ? 420 : 120, b[1] ? 174 : 176, .75, "#4E7A48", .85, F.jemna); });
      o += voda(F, r, "M-10 214 Q200 204 420 212 L420 230 Q200 222 -10 232 Z", "#AEC6DA", "#7C9CBC", 208, 230, 8);
      let most = "M110 210 L300 206 L300 214 "; for (let i = 5; i >= 0; i--) { const x0 = 110 + i * 31.6; most += "L" + f1(x0 + 31.6) + " 214 Q" + f1(x0 + 15.8) + " 200 " + f1(x0) + " 216 "; } most += "Z";
      o += kryt(F, most) + vrstva(F, most, "#D2C6AC", "#A89C84", .95, F.jemna);
      o += vesnice(F, q, [[12, 206, 16, 16, { typ: "valba", stena: "#F2EEE4", strecha: "#4E5666", patra: 3, okenice: null }], [32, 207, 14, 14, { typ: "valba", stena: "#EAD8B8", strecha: "#4E5666", patra: 2 }], [50, 206, 18, 17, { typ: "valba", stena: "#F2EEE4", strecha: "#4E5666", patra: 3 }],
        [318, 204, 16, 16, { typ: "valba", stena: "#EEE6D2", strecha: "#4E5666", patra: 3 }], [338, 205, 14, 13, { typ: "valba", stena: "#E6D2B0", strecha: "#4E5666", patra: 2 }], [356, 204, 20, 16, { typ: "valba", stena: "#F2EEE4", strecha: "#4E5666", patra: 3 }]]);
      o += hrebeny(F, [[236, 4, 70, 4, "#7EA04E", 0]]);
      return o + trava(F, r, 110, 236, 254, ["#557F38", "#78A04A", "#46692E"]);
    },
    /* Anglie: kopcovitá políčka s živými ploty, doškové chaloupky, kamenný kostel se čtvercovou věží, duby, ovce */
    anglie: function(F, r){
      const q = nahoda(F.sem + 127);
      let o = nebe(F, "#8EAED6", "#EEEADC") + mraky(F, r, 4, 26, 76, 90) + rasy(F, r, 2, 12, 26);
      o += hrebeny(F, [[118, 8, 70, 1, "#8EA2B0", .5]]);
      const barvy = ["#9DBB64", "#B4C874", "#88AE5A", "#C4C47A", "#A6BE6A"];
      [[128, 10, 60, 2], [150, 12, 70, 3.4], [176, 10, 60, 5]].forEach(function(h, i){
        o += hrebeny(F, [[h[0], h[1], h[2], h[3], barvy[i], .1 - i * .05]]);
        let pl = "", ploty = "";
        for (let x = -10 + q() * 30; x < W; x += 40 + q() * 50) { const y = vyska(x, h[0], h[1], h[2], h[3]);
          pl += "M" + f1(x) + " " + f1(y + 1) + " L" + f1(x + 36) + " " + f1(vyska(x + 36, h[0], h[1], h[2], h[3]) + 1) + " L" + f1(x + 44) + " " + f1(y + 22) + " L" + f1(x - 6) + " " + f1(y + 22) + " Z ";
          ploty += "M" + f1(x) + " " + f1(y + 1) + " L" + f1(x - 6) + " " + f1(y + 22) + " "; }
        o += laz(F, pl, barvy[(i + 2) % 5], .35) + koruny(F, q, -10, 410, vyska(0, h[0], h[1], h[2], h[3]) + 2, .22 + i * .08, mix("#3E6A36", F.opar, .3 - i * .1), .7, F.jemna).replace(/cy="([\d.]+)"/g, function(m, v){ return m; });
        o += skupina(F, F.stetec, '<path d="' + ploty + '" stroke="#3E6A36" stroke-width="' + (1 + i * .6) + '" opacity=".6" fill="none"/>'); });
      o += vesnice(F, q, [[250, 178, 1.1, 0, { kostel: 1, vez: "ctverec", stena: "#D8CCB0", strecha: "#6A6A70", strechaLodi: "#6A6A70" }],
        [300, 184, 22, 9, { typ: "dosky", stena: "#FBF8F0", strecha: "#B89A60", okna: 2 }], [330, 186, 18, 8, { typ: "dosky", stena: "#F6EEDC", strecha: "#A88A52", okna: 2 }], [206, 186, 20, 9, { typ: "dosky", stena: "#FBF8F0", strecha: "#B89A60", okna: 2 }]]);
      o += hrebeny(F, [[210, 6, 80, 6, "#8EB45A", 0]]) + strom(F, q, 60, 226, 2, "#4E7A3E") + strom(F, q, 110, 214, 1.4, "#5E8446");
      let zed = ""; for (let x = -10; x < 420; x += 5) zed += '<ellipse cx="' + f1(x + q() * 2) + '" cy="' + f1(236 + Math.sin(x / 50) * 3 + q() * 2) + '" rx="3" ry="2" fill="' + ["#B8B0A0", "#A89E8C", "#C8C0B0"][Math.floor(q() * 3)] + '"/>';
      o += '<g opacity=".9" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + zed + '</g>';
      let ovce = ""; for (let i = 0; i < 6; i++) { const x = 150 + q() * 200, y = 214 + q() * 14, s2 = .9 + (y - 214) / 20; ovce += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3.2 * s2) + '" ry="' + f1(2.1 * s2) + '" fill="#F7F4EC"/><circle cx="' + f1(x + 3 * s2) + '" cy="' + f1(y - .5) + '" r="' + f1(.9 * s2) + '" fill="#3A3A3A"/>'; }
      return o + '<g filter="url(#' + F.jemna + ')">' + ovce + '</g>' + trava(F, r, 90, 238, 254, ["#557F38", "#78A04A"]);
    },
    /* Baskicko: strmé zelené kopce, velký statek baserri se štítem, stohy kapradí, zátoka s rybářským městečkem */
    baskicko: function(F, r){
      const q = nahoda(F.sem + 131);
      let o = nebe(F, "#8AAED8", "#EEEADC") + mraky(F, r, 4, 26, 70, 80);
      o += hrebeny(F, [[104, 14, 50, 1, "#7E9A86", .5]]);
      o += voda(F, r, "M-10 124 Q90 120 190 128 L190 152 L-10 154 Z", "#8AAEC8", "#5A86A8", 126, 152, 6);
      const pr = "M-10 256 L-10 150 Q40 146 90 150 Q130 152 170 128 Q230 96 300 100 Q370 104 420 120 L420 256 Z";
      o += kryt(F, pr) + vrstva(F, pr, "#8CB45E", "#5E8A42", .9);
      o += vesnice(F, q, [[10, 150, 10, 12, { typ: "stit", stena: "#F4EEE2", strecha: "#B8543A", patra: 3, okenice: "#2E6A4A" }], [22, 151, 9, 11, { typ: "stit", stena: "#E8D8B8", strecha: "#B8543A", patra: 3, okenice: "#A8342A" }], [33, 150, 10, 13, { typ: "stit", stena: "#F4EEE2", strecha: "#B8543A", patra: 3, okenice: "#2E5E9A" }], [46, 151, 9, 11, { typ: "stit", stena: "#EAC8A0", strecha: "#B8543A", patra: 3 }]]);
      o += hrebeny(F, [[176, 16, 60, 3.2, "#7EAA52", 0]]);
      /* baserri: široký dům, nízký štít do údolí, rudé trámy a okenice, kamenné přízemí */
      const bx = 196, by = vyska(bx, 176, 16, 60, 3.2) + 26;
      o += dum(F, q, bx, by, 56, 24, { typ: "stit", stena: "#F4EEE2", strecha: "#B8543A", rh: 13, d: 34, patra: 2, okna: 4, okenice: "#A8342A", hrazdi: "#8A3A2A" });
      o += laz(F, "M" + bx + " " + by + " l0 -9 l56 0 l0 9 z", "#B4A88E", .5);
      [[110, 216, 1.2], [140, 208, .9], [340, 214, 1.1]].forEach(function(p){ const x = p[0], y = p[1], s = p[2], d = "M" + f1(x - 7 * s) + " " + y + " Q" + f1(x - 7 * s) + " " + f1(y - 12 * s) + " " + x + " " + f1(y - 20 * s) + " Q" + f1(x + 7 * s) + " " + f1(y - 12 * s) + " " + f1(x + 7 * s) + " " + y + " Z";
        o += kryt(F, d, F.jemna) + vrstva(F, d, "#B8844A", "#7A5230", .95, F.jemna) + skupina(F, F.stetec, tah("M" + x + " " + f1(y - 20 * s) + " l0 " + f1(-5 * s), "#5A4A3A", .8, .9)); });
      o += hrebeny(F, [[234, 4, 70, 5, "#6E9A46", 0]]);
      return o + trava(F, r, 130, 222, 254, ["#4E7A34", "#6E9A44", "#3E6A2E"]) + kvety(F, r, 14, 232, 252, ["#F4F0E4", "#E8D56A"], .9);
    },
    /* Douro (portugalština): strmé údolí s terasovými vinicemi, řeka s loďkami, bílá vinařská usedlost */
    douro: function(F, r){
      const q = nahoda(F.sem + 137);
      let o = nebe(F, "#7EAEE2", "#F4E8CE") + rasy(F, r, 3, 12, 36) + mraky(F, r, 2, 40, 60, 60);
      o += hrebeny(F, [[100, 12, 60, 1, "#9AA6BE", .55]]);
      const L = "M-10 256 L-10 110 Q80 112 160 150 Q190 166 200 182 L200 256 Z", P = "M200 256 L200 184 Q220 160 280 128 Q350 100 420 104 L420 256 Z";
      [[L, "#A8A862"], [P, "#98A45C"]].forEach(function(s, i){ o += kryt(F, s[0]) + vrstva(F, s[0], s[1], mix(s[1], "#3A3A1A", .25), .9);
        let t = ""; for (let k = 0; k < 18; k++) { const y = 108 + k * 5.5; t += i ? "M200 " + f1(y + 80) + " Q300 " + f1(y + 8) + " 420 " + f1(y) + " " : "M-10 " + f1(y) + " Q100 " + f1(y + 6) + " 200 " + f1(y + 80) + " "; }
        o += '<defs><clipPath id="' + F.id + 'd' + i + '"><path d="' + s[0] + '"/></clipPath></defs><g clip-path="url(#' + F.id + 'd' + i + ')">' + skupina(F, F.stetec, '<path d="' + t + '" stroke="#5E6E32" stroke-width="1.2" opacity=".75" fill="none"/><path d="' + t.replace(/ (\d+(\.\d+)?) /g, function(m){ return m; }) + '" stroke="#E6DCA8" stroke-width=".5" opacity=".5" fill="none" transform="translate(0 -1.3)"/>') + '</g>'; });
      o += vesnice(F, q, [[300, 132, 26, 11, { typ: "valba", stena: "#FBF8F0", strecha: "#C0603E", patra: 2, okna: 4, rh: 6 }], [330, 128, 12, 8, { typ: "valba", stena: "#F4EEE2", strecha: "#C0603E", okna: 1, rh: 5 }]]);
      o += voda(F, r, "M120 256 Q180 214 190 196 Q200 184 210 184 Q222 196 250 214 Q300 240 330 256 Z", "#8AB0C8", "#4E7E9E", 188, 250, 8);
      [[196, 214, .8], [236, 236, 1.2]].forEach(function(b){ const x = b[0], y = b[1], s = b[2];
        o += jem(F, "M" + f1(x - 12 * s) + " " + f1(y - 2 * s) + " Q" + x + " " + f1(y + 3 * s) + " " + f1(x + 12 * s) + " " + f1(y - 3 * s) + " L" + f1(x + 9 * s) + " " + f1(y) + " Q" + x + " " + f1(y + 2.4 * s) + " " + f1(x - 10 * s) + " " + f1(y) + " Z", "#4A3426", .9) +
          jem(F, "M" + f1(x - 1 * s) + " " + f1(y - 3 * s) + " l0 " + f1(-14 * s) + " l" + f1(9 * s) + " " + f1(1 * s) + " l0 " + f1(11 * s) + " z", "#E8DCC0", .95) + skupina(F, F.stetec, tah("M" + f1(x - 1 * s) + " " + f1(y - 2 * s) + " l0 " + f1(-17 * s), "#3A2A20", .7 * s, .9)); });
      return o + oliva(F, q, 30, 244, 1.3) + oliva(F, q, 380, 246, 1.2);
    },
    /* Rusko: řeka, břízy, dřevěné izby s modrými rámy oken, bílý kostel s cibulovými bání na návrší */
    rusko: function(F, r){
      const q = nahoda(F.sem + 139);
      let o = nebe(F, "#86ACD8", "#F2EADA") + mraky(F, r, 3, 26, 64, 90) + rasy(F, r, 2, 12, 28);
      o += hrebeny(F, [[118, 4, 90, 1, "#8C9EAE", .55]]) + lesik(F, q, -10, 410, 132, .9, mix("#445E4E", F.opar, .3), true);
      o += hrebeny(F, [[138, 10, 70, 2, "#98B468", .1]]);
      o += cibule(F, q, 238, vyska(250, 138, 10, 70, 2) + 22, .95, { ban: "#D8A640", strecha: "#4E7A9A" });
      o += voda(F, r, "M-10 176 Q120 168 240 176 Q330 182 420 176 L420 196 Q300 200 200 196 Q90 192 -10 200 Z", "#B4CCE0", "#86A6C4", 178, 198, 8);
      o += hrebeny(F, [[196, 3, 90, 3, "#8EAE5A", 0]]);
      const izba = { typ: "stit", stena: "#9A7654", bok: "#6A4E3A", strecha: "#7A7670", okenice: "#4E86C4", okno: "#E8EEF4", okna: 2, dvere: false };
      o += vesnice(F, q, [[40, 214, 20, 13, izba], [70, 218, 18, 12, Object.assign({}, izba, { okenice: "#3E9A6A" })], [100, 212, 20, 13, izba], [330, 218, 22, 14, izba]]);
      let pl = ""; for (let x = 20; x < 140; x += 4) pl += tah("M" + x + " 226 l0 -6", "#7A6048", .7, .8);
      o += skupina(F, F.stetec, pl + tah("M18 222 L140 222", "#7A6048", .5, .7));
      [[160, 240, 1.2], [186, 246, 1.4], [212, 238, 1.1], [390, 244, 1.3]].forEach(function(t){ o += briza(F, q, t[0], t[1], t[2]); });
      return o + trava(F, r, 150, 222, 254, ["#607F44", "#809D55", "#4C6A36"]) + kvety(F, r, 18, 228, 252, ["#F4F0E4", "#E8D56A", "#8E7FC8"], .9);
    },
    /* Bělorusko: jezero, borovice, dřevěné chalupy s modrými okenicemi, čapí hnízdo na sloupu */
    belorusko: function(F, r){
      const q = nahoda(F.sem + 149);
      let o = nebe(F, "#8EB0D8", "#F0EAD8") + mraky(F, r, 4, 26, 70, 80);
      o += lesik(F, q, -10, 410, 140, 1.2, "#3E5A48", true) + lesik(F, q, -10, 410, 146, 1, "#34503E", true);
      o += voda(F, r, "M-10 148 L410 147 L410 184 L-10 186 Z", "#B0C8DC", "#7896B8", 150, 182, 10);
      o += hrebeny(F, [[184, 3, 90, 2, "#8EB05E", 0]]);
      const ch = { typ: "sedlo", stena: "#A07C58", bok: "#6E5038", strecha: "#8A8A84", okenice: "#3E78C0", okno: "#EEF2F6", okna: 3 };
      o += vesnice(F, q, [[40, 206, 30, 12, ch], [96, 210, 26, 11, Object.assign({}, ch, { strecha: "#6E7E6A" })], [250, 208, 30, 12, Object.assign({}, ch, { okenice: "#E8E8F0" })]]);
      o += capi(F, 196, 236, 1.5);
      let pl = ""; for (let x = 20; x < 380; x += 3.6) if (x < 150 || x > 236) pl += tah("M" + f1(x) + " 222 l" + f1((q() - .5)) + " -7", "#8A6E50", .6, .75);
      o += skupina(F, F.stetec, pl);
      [[160, 236, 1.2], [330, 242, 1.4]].forEach(function(t){ o += jehlicnan(F, q, t[0], t[1], t[2], "#2F4B3A"); });
      return o + trava(F, r, 160, 220, 254, ["#607F44", "#809D55", "#4C6A36"]) + kvety(F, r, 20, 226, 252, ["#5A7ED0", "#F4F0E4", "#E8D56A"], 1);
    },
    /* Švédsko: louka, jezero, rudé dřevěné domy s bílými rohy, bílý kostel s černou věží, břízy */
    svedsko: function(F, r){
      const q = nahoda(F.sem + 151);
      let o = nebe(F, "#8AB0DC", "#F0EAD8") + mraky(F, r, 3, 26, 64, 90);
      o += hrebeny(F, [[124, 6, 80, 1, "#8C9EAE", .55]]) + lesik(F, q, -10, 410, 140, 1.1, "#3E5A48", true);
      o += voda(F, r, "M-10 142 L410 141 L410 170 L-10 172 Z", "#B4CCE0", "#86A6C4", 144, 168, 8);
      o += hrebeny(F, [[170, 5, 80, 2, "#9CBA66", 0]]);
      const falu = { typ: "sedlo", stena: "#A8382E", bok: "#6E2A24", strecha: "#4A4A50", okenice: "#FBFAF6", okno: "#E8EEF4", okna: 3 };
      o += kostel(F, q, 300, 176, .9, { vez: "jehlan", stena: "#FBFAF6", strecha: "#4A4A50", vezStrecha: "#2A2A30" });
      o += vesnice(F, q, [[60, 196, 34, 14, falu], [120, 204, 22, 11, Object.assign({}, falu, { okna: 2 })], [210, 200, 26, 12, falu]]);
      let rohy = ""; [[60, 196, 34, 14], [120, 204, 22, 11], [210, 200, 26, 12]].forEach(function(d){ rohy += tah("M" + f1(d[0] + .6) + " " + d[1] + " l0 " + f1(-d[3]) + " M" + f1(d[0] + d[2] - .6) + " " + d[1] + " l0 " + f1(-d[3]), "#FBFAF6", 1.2, .95); });
      o += skupina(F, F.stetec, rohy);
      [[26, 238, 1.2], [180, 246, 1.3], [372, 240, 1.2]].forEach(function(t){ o += briza(F, q, t[0], t[1], t[2]); });
      return o + trava(F, r, 170, 214, 254, ["#607F44", "#809D55", "#4C6A36"]) + kvety(F, r, 40, 216, 252, ["#F4F0E4", "#E8D56A", "#9A8AD0", "#E8A8C8"], 1);
    },
    /* Finsko: jezero se žulovými balvany, rudá sauna a molo, loďka, borovice */
    finsko: function(F, r){
      const q = nahoda(F.sem + 157);
      let o = nebe(F, "#8EB2DE", "#F2EAD8") + rasy(F, r, 3, 12, 40) + mraky(F, r, 2, 40, 60, 70);
      const brehy = lesik(F, q, -10, 410, 132, 1, "#445E4E", true);
      o += hrebeny(F, [[122, 4, 90, 1, "#8C9EAE", .55]]) + brehy + lesik(F, q, 250, 410, 136, 1.2, "#34503E", true);
      o += voda(F, r, "M-10 136 L410 135 L410 256 L-10 256 Z", "#B8CEE2", "#6E92B4", 140, 250, 18);
      o += '<g transform="matrix(1 0 0 -.6 0 217.6)" opacity=".28">' + brehy + '</g>';
      const ostr = "M170 150 Q200 142 240 146 Q260 150 262 154 L168 154 Z";
      o += kryt(F, ostr) + vrstva(F, ostr, "#7E9A6A", "#4E6A4A", .9) + lesik(F, q, 180, 250, 150, .6, "#34503E", true);
      const bh = "M-10 256 L-10 196 Q40 186 90 194 Q140 202 170 222 Q190 240 200 256 Z";
      o += kryt(F, bh) + vrstva(F, bh, "#B4AFA6", "#7A766E", .92);
      let bal = ""; [[40, 200, 20], [110, 206, 16], [150, 224, 12]].forEach(function(b){ bal += "M" + (b[0] - b[2]) + " " + (b[1] + 4) + " Q" + (b[0] - b[2]) + " " + (b[1] - b[2] * .5) + " " + b[0] + " " + (b[1] - b[2] * .55) + " Q" + (b[0] + b[2]) + " " + (b[1] - b[2] * .5) + " " + (b[0] + b[2]) + " " + (b[1] + 4) + " Z "; });
      o += vrstva(F, bal, "#C8C2B8", "#8A847C", .9, F.jemna);
      o += dum(F, q, 56, 196, 26, 11, { typ: "sedlo", stena: "#A8382E", bok: "#6E2A24", strecha: "#4A4A50", okenice: "#FBFAF6", okno: "#E8EEF4", okna: 2, komin: "#6A6A6A" });
      let molo = tah("M84 204 L150 210", "#8A6E50", 3.4, .95); for (let x = 90; x < 150; x += 10) molo += tah("M" + x + " " + f1(205 + (x - 84) * .09) + " l0 8", "#6A5038", 1, .9);
      o += skupina(F, F.stetec, molo);
      o += jem(F, "M150 222 Q168 228 188 220 L184 224 Q168 230 152 225 Z", "#A0482E", .95);
      [[20, 200, 1.4], [290, 150, 1], [330, 148, .9]].forEach(function(t){ o += jehlicnan(F, q, t[0], t[1], t[2], "#2F4B3A"); });
      return o + ptaci(F, r, 2, 300, 70);
    },
    /* Litva: jezero mezi kopci, dřevěný statek, dřevěná boží muka se stříškou, čápi */
    litva: function(F, r){
      const q = nahoda(F.sem + 163);
      let o = nebe(F, "#8AB0DA", "#F2EAD6") + mraky(F, r, 4, 26, 70, 80);
      o += hrebeny(F, [[124, 8, 70, 1, "#8C9EAE", .5]]) + lesik(F, q, -10, 410, 140, .9, "#445E4E", true);
      o += voda(F, r, "M-10 144 Q200 140 420 146 L420 170 Q200 164 -10 172 Z", "#B4CCE0", "#86A6C4", 146, 168, 8);
      o += hrebeny(F, [[168, 12, 60, 3, "#9CBA66", .05]]);
      const st = { typ: "sedlo", stena: "#8A6A4E", bok: "#5E4634", strecha: "#7E7A6A", okenice: "#E8E8E0", okno: "#3E4656", okna: 3 };
      o += vesnice(F, q, [[210, 184, 30, 12, st], [252, 190, 20, 10, Object.assign({}, st, { typ: "dosky", strecha: "#9A8A5A", okenice: null })]]);
      o += capi(F, 330, 234, 1.4);
      /* boží muka: vysoký vyřezávaný sloup se stříškou a křížkem */
      const kx = 90, ky = 238;
      o += skupina(F, F.stetec, tah("M" + kx + " " + ky + " l0 -46", "#6A5038", 3, .95)) + jem(F, "M" + (kx - 7) + " " + (ky - 42) + " l7 -8 l7 8 z", "#5A4634", .95) +
        jem(F, "M" + (kx - 4) + " " + (ky - 42) + " l8 0 l0 7 l-8 0 z", "#8A6E50", .95) + skupina(F, F.stetec, tah("M" + kx + " " + (ky - 50) + " l0 -6 M" + (kx - 2.5) + " " + (ky - 53) + " l5 0", "#4A3A2A", .7, .9));
      o += hrebeny(F, [[226, 4, 70, 5, "#8EB05A", 0]]);
      return o + trava(F, r, 150, 226, 254, ["#607F44", "#809D55", "#4C6A36"]) + kvety(F, r, 24, 230, 252, ["#F4F0E4", "#E8D56A", "#5A7ED0"], 1);
    },
    /* Lotyšsko: pobřeží Baltu, duny s borovicemi, rybářské chalupy, loďky na písku, sítě */
    lotyssko: function(F, r){
      const q = nahoda(F.sem + 167);
      let o = nebe(F, "#90B2DA", "#F2EADA") + mraky(F, r, 3, 26, 64, 80);
      o += voda(F, r, "M-10 130 L410 130 L410 188 L-10 196 Z", "#9EBCD4", "#6A90B4", 132, 190, 18);
      let pena = ""; for (let i = 0; i < 4; i++) pena += tah(cesta(clenit([[-10, 184 + i * 3], [200, 186 + i * 3.5], [420, 176 + i * 3]], q, 0, .05, 4)), "#FFFFFF", 1.2 - i * .2, .7);
      o += skupina(F, F.stetec, pena);
      const pl = "M-10 256 L-10 196 Q200 186 420 178 L420 256 Z";
      o += kryt(F, pl) + vrstva(F, pl, "#EEDCB4", "#D4BC8C", .9);
      const dn = "M150 256 Q190 206 240 186 Q290 168 340 164 Q380 160 420 164 L420 256 Z";
      o += kryt(F, dn) + vrstva(F, dn, "#C8C090", "#A8A070", .9);
      o += vesnice(F, q, [[250, 196, 22, 10, { typ: "sedlo", stena: "#6E5A48", bok: "#4E3E30", strecha: "#5A5A5A", okenice: "#E8E8E0", okno: "#3E4656", okna: 2 }], [290, 190, 18, 9, { typ: "sedlo", stena: "#8A7058", bok: "#5E4A38", strecha: "#9A8A5A", okna: 1 }]]);
      [[330, 176, 1.3], [352, 180, 1.6], [378, 172, 1.4], [400, 178, 1.7], [224, 188, 1]].forEach(function(t){ o += skupina(F, F.stetec, tah("M" + t[0] + " " + t[1] + " q2 -18 -2 -" + f1(34 * t[2]), "#9A5A3A", 1.6 * t[2], .9)) + koruny(F, q, t[0] - 14 * t[2], t[0] + 12 * t[2], t[1] - 32 * t[2], .45 * t[2], "#3E6A48", .9, F.jemna); });
      [[60, 214, 1], [130, 222, 1.2]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 17 * s) + " " + f1(y - 6 * s) + " L" + f1(x + 17 * s) + " " + f1(y - 7 * s) + " Q" + f1(x + 12 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 12 * s) + " " + f1(y + 2 * s) + " " + f1(x - 17 * s) + " " + f1(y - 6 * s) + " Z", "#6E7E90", "#3E4A5A", .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(x - 16 * s) + " " + f1(y - 6 * s) + " L" + f1(x + 16 * s) + " " + f1(y - 7 * s), "#E8E4DA", .8, .8)); });
      let sit = ""; for (let i = 0; i < 4; i++) sit += tah("M" + (160 + i * 12) + " 232 l0 -18", "#6A5038", 1, .9); for (let k = 0; k < 6; k++) sit += tah("M160 " + (216 + k * 2.4) + " L196 " + (216 + k * 2.4), "#6A6A5A", .4, .6);
      for (let i = 0; i < 6; i++) sit += tah("M" + (162 + i * 6) + " 215 l0 13", "#6A6A5A", .4, .6);
      return o + skupina(F, F.stetec, sit) + trava(F, r, 70, 236, 254, ["#A8A060", "#8A9A50"]);
    },
    /* Estonsko: rašeliniště s povalovým chodníkem, černá jezírka, zakrslé borovice, doškový statek, jalovce */
    estonsko: function(F, r){
      const q = nahoda(F.sem + 173);
      let o = nebe(F, "#8EAED8", "#F2E8D6") + rasy(F, r, 3, 12, 40) + mraky(F, r, 3, 34, 64, 80);
      o += lesik(F, q, -10, 410, 140, 1, "#445E4E", true);
      const bz = "M-10 256 L-10 142 L410 142 L410 256 Z";
      o += kryt(F, bz) + vrstva(F, bz, "#B8A874", "#8E8E5A", .9);
      let mech = ""; for (let i = 0; i < 90; i++) mech += '<ellipse cx="' + f1(q() * W) + '" cy="' + f1(146 + Math.pow(q(), .8) * 108) + '" rx="' + f1(2 + q() * 6) + '" ry="' + f1(1 + q() * 2) + '" fill="' + ["#A8603E", "#8E9A52", "#C4A860", "#7E8A4A"][i % 4] + '"/>';
      o += '<g opacity=".5" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + mech + '</g>';
      [[70, 170, 40, 6], [260, 184, 54, 8], [160, 210, 36, 7]].forEach(function(j){ const d = "M" + (j[0] - j[2]) + " " + j[1] + " Q" + j[0] + " " + (j[1] - j[3]) + " " + (j[0] + j[2]) + " " + j[1] + " Q" + j[0] + " " + (j[1] + j[3]) + " " + (j[0] - j[2]) + " " + j[1] + " Z"; o += voda(F, r, d, "#8EA6C0", "#3E5068", j[1] - 4, j[1] + 4, 2); });
      o += dum(F, q, 300, 160, 44, 7, { typ: "dosky", stena: "#8A6E50", bok: "#5E4A36", strecha: "#9A8A5A", rh: 16, okna: 2, okno: "#3E4656" });
      let chod = ""; for (let i = 0; i < 40; i++) { const t = i / 40, x = 120 + t * t * 30 + t * 40, y = 160 + t * 100, w = 3 + t * 16; chod += tah("M" + f1(x - w) + " " + f1(y) + " l" + f1(w * 2) + " 0", "#9A7A52", .8 + t * 2, .85); }
      o += skupina(F, F.stetec, chod);
      [[40, 190, .8], [226, 172, .6], [380, 214, 1], [350, 180, .7]].forEach(function(t){ o += jehlicnan(F, q, t[0], t[1], t[2], "#3E5A40"); });
      let jal = ""; for (let i = 0; i < 6; i++) { const x = 20 + q() * 360, y = 200 + q() * 44, s2 = .8 + (y - 200) / 40; jal += '<ellipse cx="' + f1(x) + '" cy="' + f1(y - 6 * s2) + '" rx="' + f1(3 * s2) + '" ry="' + f1(7 * s2) + '" fill="#3E5A40"/>'; }
      return o + '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + jal + '</g>' + ptaci(F, r, 3, 90, 60);
    },
    /* Tatarstán: vesnice barevných dřevěných domů s vyřezávanými štíty, dřevěná mešita s minaretem, řeka */
    tatarsko: function(F, r){
      const q = nahoda(F.sem + 179);
      let o = nebe(F, "#84ACDA", "#F2E8D4") + mraky(F, r, 3, 26, 64, 90);
      o += hrebeny(F, [[128, 6, 80, 1, "#8C9EAE", .5]]) + lesik(F, q, -10, 410, 140, .8, "#445E4E", true);
      o += voda(F, r, "M-10 144 Q200 140 420 146 L420 162 Q200 158 -10 166 Z", "#B4CCE0", "#86A6C4", 146, 162, 6);
      o += hrebeny(F, [[164, 6, 70, 3, "#9CBA66", 0]]);
      /* mešita: dřevěný dům, na hřebeni osmiboký minaret se zelenou jehlancovou střechou a půlměsícem */
      const mx = 200, my = 194;
      o += dum(F, q, mx, my, 34, 14, { typ: "valba", stena: "#E8E2C8", bok: "#A8A080", strecha: "#3E8A6A", okna: 3, okenice: "#3E8A6A", rh: 7 });
      const mt = "M" + (mx + 17) + " " + (my - 18) + " l6 0 l0 -24 l-6 0 z";
      o += kryt(F, mt, F.jemna) + nanes(F, mt, "#E8E2C8") + laz(F, "M" + (mx + 20.5) + " " + (my - 18) + " l2.5 0 l0 -24 l-2.5 0 z", "#8A8A6A", .45) +
        nanes(F, "M" + (mx + 16) + " " + (my - 42) + " l8 0 l-4 -14 z", "#3E8A6A") + skupina(F, F.stetec, tah("M" + (mx + 20) + " " + (my - 56) + " l0 -3", "#8A7030", .6, .9) + '<path d="M' + (mx + 18.8) + " " + (my - 61) + ' a1.8 1.8 0 1 0 2.6 -1.6 a1.4 1.4 0 1 1 -2.6 1.6 z" fill="#C8A040"/>');
      const d = { typ: "stit", bok: "#5E6A7A", strecha: "#7A7670", okno: "#E8EEF4", okna: 2, dvere: false };
      o += vesnice(F, q, [[40, 212, 20, 13, Object.assign({}, d, { stena: "#5E9A8A", okenice: "#F4EEE2" })], [70, 216, 18, 12, Object.assign({}, d, { stena: "#6A8AC0", okenice: "#F4EEE2" })],
        [300, 214, 20, 13, Object.assign({}, d, { stena: "#C0A04A", okenice: "#3E6A9A" })], [330, 218, 20, 12, Object.assign({}, d, { stena: "#5E9A8A", okenice: "#F4EEE2" })]]);
      let br = ""; for (let x = 20; x < 110; x += 3.4) br += tah("M" + f1(x) + " 226 l0 -7", ["#3E8A6A", "#4E7AB0", "#C8A040"][Math.floor(x / 20) % 3], .9, .85);
      o += skupina(F, F.stetec, br) + briza(F, q, 150, 240, 1.2) + briza(F, q, 380, 244, 1.3);
      return o + trava(F, r, 140, 226, 254, ["#607F44", "#809D55", "#4C6A36"]) + kvety(F, r, 20, 230, 252, ["#F4F0E4", "#E8D56A", "#D05A8A"], 1);
    },
    /* Chorvatsko: opevněné kamenné městečko na poloostrově, rudé střechy, štíhlá zvonice, ostrovy v oparu */
    chorvatsko: function(F, r){
      const q = nahoda(F.sem + 181);
      let o = nebe(F, "#6AA4DE", "#F4E8CE") + rasy(F, r, 3, 14, 40) + mrak(F, r, 90, 50, 60);
      o += hrebeny(F, [[128, 7, 50, 1, "#98A6C0", .6]]);
      o += voda(F, r, "M-10 136 L410 134 L410 256 L-10 256 Z", "#5E9ED0", "#1F6AA8", 138, 250, 26);
      const pol = "M90 256 Q110 196 150 184 L360 176 Q400 180 410 200 L410 256 Z";
      o += kryt(F, pol) + vrstva(F, pol, "#D8C8A4", "#B4A07A", .92);
      /* hradby */
      let zed = "M120 212 Q150 190 190 186 L380 180 L380 196 L190 202 Q150 206 128 226 Z";
      o += kryt(F, zed, F.jemna) + vrstva(F, zed, "#E0D2B2", "#B8A882", .95, F.jemna);
      let c = ""; for (let x = 190; x < 380; x += 6) c += "M" + x + " " + f1(186 - (x - 190) * .032) + " l3 0 l0 -2.6 l-3 0 z "; o += nanes(F, c, "#E0D2B2");
      const dm = []; for (let rada = 0; rada < 4; rada++) for (let i = 0; i < 9 - rada; i++) { const x = 180 + rada * 12 + i * 21 + q() * 5, y = 182 - rada * 9 - (x - 180) * .03;
        dm.push([x, y, 14 + q() * 6, 8 + q() * 4, { typ: q() < .5 ? "sedlo" : "stit", stena: ["#EADCC0", "#E2D0AC", "#F0E6D0"][Math.floor(q() * 3)], strecha: ["#C0603E", "#B4553A", "#CC6A44"][Math.floor(q() * 3)], okna: 2, dvere: false, okenice: q() < .4 ? "#5E7E5E" : null }]); }
      o += vesnice(F, q, dm) + kostel(F, q, 250, 150, .9, { vez: "kampanila", stena: "#E6D8B8", strecha: "#C0603E" });
      o += cypris(F, q, 150, 190, 30) + cypris(F, q, 162, 188, 24);
      [[60, 214, 1], [40, 236, 1.2]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 12 * s) + " " + f1(y - 4 * s) + " L" + f1(x + 12 * s) + " " + f1(y - 5 * s) + " Q" + f1(x + 8 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 8 * s) + " " + f1(y + 2 * s) + " " + f1(x - 12 * s) + " " + f1(y - 4 * s) + " Z", "#F4EEE2", "#B8B0A0", .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(x - 11 * s) + " " + f1(y - 4.5 * s) + " L" + f1(x + 11 * s) + " " + f1(y - 5.5 * s), "#2E5E9A", 1 * s, .8)); });
      return o + ptaci(F, r, 3, 300, 60);
    },
    /* Andalusie (španělština): bílá vesnice na kopci s kostelní věží, olivové háje v řadách přes zvlněné kopce */
    andalusie: function(F, r){
      const q = nahoda(F.sem + 191);
      let o = nebe(F, "#6EA6E2", "#F6E6C4") + rasy(F, r, 2, 14, 36);
      o += hrebeny(F, [[112, 10, 60, 1, "#A8A8C0", .55]]);
      const kop = "M100 256 L100 170 Q140 130 200 116 Q260 108 320 124 Q370 140 400 170 L400 256 Z";
      o += kryt(F, kop) + vrstva(F, kop, "#D8C08C", "#B89A68", .92);
      const dm = []; for (let rada = 0; rada < 6; rada++) for (let i = 0; i < 8 - Math.abs(rada - 2); i++) { const x = 150 + Math.abs(rada - 2) * 10 + i * 22 + q() * 5, y = 126 + rada * 10 + Math.abs(x - 250) * .08;
        dm.push([x, y, 13 + q() * 7, 7 + q() * 4, { typ: q() < .7 ? "sedlo" : "plocha", stena: "#FBFAF6", bok: "#C8C8D4", strecha: ["#C8704A", "#B8643E"][Math.floor(q() * 2)], okna: 1 + Math.floor(q() * 2), dvere: false, okno: "#4A4A58" }]); }
      o += vesnice(F, q, dm.slice(0, 12)) + kostel(F, q, 228, 132, .9, { vez: "kampanila", stena: "#FBFAF6", strecha: "#C8704A" }) + vesnice(F, q, dm.slice(12));
      o += hrebeny(F, [[196, 8, 60, 3.2, "#C8B07A", 0]]);
      let ol = ""; for (let rada = 0; rada < 6; rada++) { const y0 = 202 + rada * 9; for (let x = -10 + (rada % 2) * 8; x < 420; x += 16 + rada * 3) { const y = y0 + Math.sin(x / 60 + 3.2) * 6, s2 = .4 + rada * .12;
          ol += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(5 * s2) + '" ry="' + f1(3.6 * s2) + '" fill="' + mix("#7C8A5E", q() < .5 ? "#A8B08A" : "#4E5E3E", q() * .5) + '"/>'; } }
      return o + '<g opacity=".9" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + ol + '</g>' + oliva(F, q, 30, 250, 1.5) + oliva(F, q, 376, 252, 1.3);
    },
    /* Katalánsko: skalnatá zátoka s borovicemi, tyrkysová voda, kamenná vesnice s románskou zvonicí, loďky na pláži */
    katalansko: function(F, r){
      const q = nahoda(F.sem + 193);
      let o = nebe(F, "#72AAE0", "#F4E8CE") + rasy(F, r, 3, 14, 36) + mrak(F, r, 300, 50, 60);
      o += voda(F, r, "M-10 134 L410 132 L410 256 L-10 256 Z", "#4EA0C8", "#1E6E9E", 136, 250, 20);
      o += kryt(F, "M60 256 Q120 214 200 206 Q280 204 340 256 Z") + vrstva(F, "M60 256 Q120 214 200 206 Q280 204 340 256 Z", "#7EDAD0", "#3EAABA", .7);
      [["M-10 256 L-10 124 Q30 116 64 132 Q92 150 96 190 Q100 230 80 256 Z", 1], ["M320 256 Q306 200 324 160 Q350 130 420 124 L420 256 Z", 0]].forEach(function(h){
        o += kryt(F, h[0]) + vrstva(F, h[0], "#C4AC90", "#8A7462", .92);
        let v = ""; for (let i = 0; i < 12; i++) { const y = 150 + i * 9; v += tah("M" + (h[1] ? -10 : 300 + i * 1.5) + " " + f1(y) + " l" + (h[1] ? 110 - i * 2 : 120) + " " + f1((q() - .5) * 6), "#8A7060", .6, .4); }
        o += '<defs><clipPath id="' + F.id + 'k' + h[1] + '"><path d="' + h[0] + '"/></clipPath></defs><g clip-path="url(#' + F.id + 'k' + h[1] + ')">' + skupina(F, F.stetec, v) + '</g>';
        [0, 10, 20].forEach(function(dy, k){ o += koruny(F, q, h[1] ? -10 : 306 + k * 4, h[1] ? 96 - k * 8 : 420, (h[1] ? 126 : 130) + dy, .5 - k * .05, k ? "#4E7446" : "#3E6A40", .88, F.jemna); }); });
      o += vesnice(F, q, [[330, 150, 16, 10, { typ: "sedlo", stena: "#D8C6A2", strecha: "#B4643E", okenice: "#4E7AA0" }], [350, 146, 14, 9, { typ: "sedlo", stena: "#E6D8BA", strecha: "#B4643E" }], [376, 148, 18, 11, { typ: "sedlo", stena: "#D8C6A2", strecha: "#A85A3A", okenice: "#4E7AA0", patra: 2 }],
        [352, 138, .8, 0, { kostel: 1, vez: "kampanila", stena: "#D0BC96", strecha: "#A85A3A" }]]);
      o += kryt(F, "M100 256 Q150 236 200 234 Q250 234 300 256 Z") + vrstva(F, "M100 256 Q150 236 200 234 Q250 234 300 256 Z", "#F2E2BC", "#D8C090", .95);
      [[170, 244, 1, "#C8402E"], [226, 246, 1.1, "#2E6AA8"]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 12 * s) + " " + f1(y - 4 * s) + " L" + f1(x + 12 * s) + " " + f1(y - 5 * s) + " Q" + f1(x + 8 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 8 * s) + " " + f1(y + 2 * s) + " " + f1(x - 12 * s) + " " + f1(y - 4 * s) + " Z", "#F4EEE2", "#B8B0A0", .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(x - 11 * s) + " " + f1(y - 4.5 * s) + " L" + f1(x + 11 * s) + " " + f1(y - 5.5 * s), b[3], 1.2 * s, .85)); });
      o += skupina(F, F.stetec, tah("M52 162 C54 140 60 124 72 108", "#6A4E3E", 2.6, .9)) + koruny(F, q, 40, 110, 108, .5, "#3E6440", .9, F.jemna);
      return o;
    },
    /* Řecko: útes nad temně modrým mořem, bílé kostky domů, modré kupole, větrný mlýn, bugenvílie */
    recko: function(F, r){
      const q = nahoda(F.sem + 197);
      let o = nebe(F, "#5EA0E4", "#F2EEE0") + rasy(F, r, 2, 12, 30);
      o += hrebeny(F, [[132, 6, 60, 1, "#9AA8C4", .6]]);
      o += voda(F, r, "M-10 138 L410 136 L410 256 L-10 256 Z", "#3E7EC4", "#123E86", 140, 250, 24);
      const ut = "M150 256 L150 176 Q180 150 230 144 Q300 136 420 140 L420 256 Z";
      o += kryt(F, ut) + vrstva(F, ut, "#B8906E", "#7A5A48", .92);
      let vr = ""; for (let i = 0; i < 12; i++) vr += tah("M150 " + f1(180 + i * 6) + " Q280 " + f1(170 + i * 7) + " 420 " + f1(176 + i * 6.5), ["#A87A5E", "#C8A080", "#8A6450"][i % 3], .8, .5);
      o += skupina(F, F.stetec, vr);
      const dm = []; for (let rada = 0; rada < 4; rada++) for (let i = 0; i < 8 - rada; i++) { const x = 176 + rada * 16 + i * 26 + q() * 6, y = 150 + rada * 12 + (q() - .5) * 4;
        dm.push([x, y, 14 + q() * 8, 8 + q() * 5, { typ: "plocha", stena: "#FBFAF6", bok: "#C4CADA", okna: 1 + Math.floor(q() * 2), okno: q() < .5 ? "#2E5EA8" : "#3E4656", dvere: q() < .5 }]); }
      o += vesnice(F, q, dm) + kyklady(F, q, 238, 146, 22, 13, 1, true) + kyklady(F, q, 330, 164, 18, 11, .8, true);
      /* větrný mlýn: bílý válec, kuželová střecha, plachty */
      const mx = 390, my = 144; o += dum(F, q, mx - 7, my, 14, 18, { typ: "plocha", stena: "#FBFAF6", bok: "#C4CADA", okna: 1, d: 4 });
      o += nanes(F, "M" + (mx - 8) + " " + (my - 18) + " L" + mx + " " + (my - 27) + " L" + (mx + 9) + " " + (my - 18) + " Z", "#8A6A50");
      let pl = ""; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; pl += tah("M" + mx + " " + (my - 22) + " l" + f1(Math.cos(a) * 14) + " " + f1(Math.sin(a) * 14), "#5A4A3A", .5, .8); } o += skupina(F, F.stetec, pl);
      let bug = ""; for (let i = 0; i < 40; i++) bug += '<circle cx="' + f1(200 + q() * 60) + '" cy="' + f1(150 + q() * 14) + '" r="' + f1(1 + q() * 1.4) + '" fill="' + ["#D8408A", "#E860A0", "#B83070"][i % 3] + '"/>';
      return o + '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + bug + '</g>' + ptaci(F, r, 3, 70, 70);
    },
    /* Malta: přístav, medově žluté vápencové domy, barokní kostel s kupolí a dvěma věžemi, pestré loďky luzzu */
    malta: function(F, r){
      const q = nahoda(F.sem + 199);
      let o = nebe(F, "#6EA8E0", "#F6EAD0") + rasy(F, r, 3, 12, 36);
      const bre = "M-10 190 L-10 110 L410 120 L410 190 Z";
      o += kryt(F, bre) + vrstva(F, bre, "#E2C894", "#C4A470", .92);
      const dm = []; for (let rada = 0; rada < 4; rada++) for (let i = 0; i < 12; i++) { const x = -8 + i * 36 + q() * 10 + rada * 8, y = 128 + rada * 14;
        if (x > 150 && x < 240 && rada < 2) continue;
        dm.push([x, y, 18 + q() * 10, 12 + q() * 6, { typ: "plocha", stena: ["#E8CE9C", "#EED8AC", "#E0C48E"][Math.floor(q() * 3)], bok: "#B89A6A", patra: 2, okna: 2, okenice: ["#2E7A4A", "#2E5EA8", "#A8342A"][Math.floor(q() * 3)], dvere: false }]); }
      o += vesnice(F, q, dm.slice(0, 20));
      /* barokní kostel: průčelí, dvě věže, kupole s lucernou */
      const cx = 196, cy = 150, st = "#E8CE9C";
      o += dum(F, q, cx - 18, cy, 36, 20, { typ: "plocha", stena: st, bok: "#B89A6A", okna: 3, patra: 2 });
      const kup = "M" + (cx - 14) + " " + (cy - 30) + " Q" + (cx - 14) + " " + (cy - 50) + " " + cx + " " + (cy - 52) + " Q" + (cx + 14) + " " + (cy - 50) + " " + (cx + 14) + " " + (cy - 30) + " Z";
      o += kryt(F, "M" + (cx - 11) + " " + (cy - 20) + " l22 0 l0 -10 l-22 0 z", F.jemna) + nanes(F, "M" + (cx - 11) + " " + (cy - 20) + " l22 0 l0 -10 l-22 0 z", st) + kryt(F, kup, F.jemna) + vrstva(F, kup, "#B8B4C0", "#6E6A80", .95, F.jemna) +
        nanes(F, "M" + (cx - 2) + " " + (cy - 52) + " l4 0 l0 -6 l-4 0 z", st) + skupina(F, F.stetec, tah("M" + cx + " " + (cy - 58) + " l0 -4", "#5A4A3A", .6, .9));
      [cx - 24, cx + 16].forEach(function(x){ o += dum(F, q, x, cy, 8, 30, { typ: "plocha", stena: st, bok: "#B89A6A", okna: 1, patra: 3, dvere: false, d: 5 }) + nanes(F, "M" + (x - .5) + " " + (cy - 30) + " Q" + (x + 4) + " " + (cy - 40) + " " + (x + 8.5) + " " + (cy - 30) + " Z", "#8A7A6A"); });
      o += vesnice(F, q, dm.slice(20));
      o += voda(F, r, "M-10 188 L410 186 L410 256 L-10 256 Z", "#4E96C0", "#1E5E8E", 190, 250, 18);
      o += '<g transform="matrix(1 0 0 -.4 0 263)" opacity=".2">' + vesnice(F, q, dm.slice(20)) + '</g>';
      [[70, 214, 1.3, ["#E8C040", "#2E6AB0", "#C8402E"]], [160, 232, 1.6, ["#2E6AB0", "#E8C040", "#3E9A5A"]], [300, 220, 1.4, ["#C8402E", "#2E9A8A", "#E8C040"]]].forEach(function(b){ const x = b[0], y = b[1], s = b[2], c = b[3];
        const tr = "M" + f1(x - 14 * s) + " " + f1(y - 7 * s) + " L" + f1(x + 14 * s) + " " + f1(y - 8 * s) + " Q" + f1(x + 10 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 10 * s) + " " + f1(y + 2 * s) + " " + f1(x - 14 * s) + " " + f1(y - 7 * s) + " Z";
        o += kryt(F, tr, F.jemna) + nanes(F, tr, c[0], .95) + skupina(F, F.stetec, tah("M" + f1(x - 13 * s) + " " + f1(y - 4 * s) + " Q" + x + " " + f1(y - 1 * s) + " " + f1(x + 13 * s) + " " + f1(y - 5 * s), c[1], 1.6 * s, .9) + tah("M" + f1(x - 14 * s) + " " + f1(y - 7 * s) + " l" + f1(-2 * s) + " " + f1(-4 * s) + " M" + f1(x + 14 * s) + " " + f1(y - 8 * s) + " l" + f1(2 * s) + " " + f1(-4 * s), c[2], 1 * s, .9)); });
      return o;
    },
    /* Sardinie: žulové balvany, tyrkysová mělčina, kamenná věž nuraghe na návrší, macchie */
    sardinie: function(F, r){
      const q = nahoda(F.sem + 211);
      let o = nebe(F, "#6AA8E2", "#F4EAD2") + rasy(F, r, 3, 12, 36) + mrak(F, r, 110, 50, 60);
      o += hrebeny(F, [[118, 10, 50, 1, "#A0A8C0", .55]]);
      const kp = "M160 256 L160 150 Q220 118 290 120 Q360 124 420 140 L420 256 Z";
      o += kryt(F, kp) + vrstva(F, kp, "#B8B07A", "#8A8A56", .92) + koruny(F, q, 170, 420, 150, .45, "#5E6E3E", .8, F.jemna);
      /* nuraghe: komolý kužel z kvádrů */
      const nx = 280, ny = 126, nu = "M" + (nx - 20) + " " + ny + " L" + (nx - 13) + " " + (ny - 30) + " L" + (nx + 13) + " " + (ny - 30) + " L" + (nx + 20) + " " + ny + " Z";
      o += kryt(F, nu, F.jemna) + vrstva(F, nu, "#C8B898", "#8A7A62", .95, F.jemna) + laz(F, "M" + (nx + 4) + " " + ny + " L" + (nx + 4) + " " + (ny - 30) + " L" + (nx + 13) + " " + (ny - 30) + " L" + (nx + 20) + " " + ny + " Z", "#5A4E40", .4);
      let kv = ""; for (let k = 0; k < 8; k++) { const y = ny - 3 - k * 3.6, w = 20 - k * .9; kv += tah("M" + f1(nx - w) + " " + f1(y) + " L" + f1(nx + w) + " " + f1(y), "#7A6A54", .5, .5); for (let x = nx - w + (k % 2) * 3; x < nx + w; x += 6) kv += tah("M" + f1(x) + " " + f1(y) + " l0 -3.4", "#7A6A54", .4, .45); }
      o += skupina(F, F.stetec, kv) + nanes(F, "M" + (nx - 2) + " " + ny + " l0 -7 q2 -2 4 0 l0 7 z", "#3A3430", .85);
      o += voda(F, r, "M-10 140 L160 138 L200 256 L-10 256 Z", "#58B8C8", "#1E7EA0", 142, 250, 14);
      o += laz(F, "M-10 200 Q80 190 170 200 L190 256 L-10 256 Z", "#9EE8D8", .4).replace("multiply", "normal");
      let bal = ""; [[120, 220, 26, 18], [170, 206, 30, 26], [60, 244, 22, 12], [200, 236, 40, 30]].forEach(function(b){ bal += "M" + (b[0] - b[2]) + " " + (b[1] + 4) + " Q" + (b[0] - b[2]) + " " + (b[1] - b[3]) + " " + (b[0] - b[2] * .2) + " " + (b[1] - b[3] * 1.05) + " Q" + (b[0] + b[2]) + " " + (b[1] - b[3] * .9) + " " + (b[0] + b[2]) + " " + (b[1] + 4) + " Z "; });
      o += kryt(F, bal) + vrstva(F, bal, "#E0CCB4", "#A08874", .95);
      return o + oliva(F, q, 360, 230, 1.6) + trava(F, r, 60, 236, 254, ["#8A8A48", "#A89A5A"]);
    },
    /* Tatry (slovenština): rozeklané štíty, smrkový les, dřevěnice s bílými ornamenty, salaš a ovce */
    tatry: function(F, r){
      const q = nahoda(F.sem + 223);
      let o = nebe(F, "#6E9ED8", "#EEEAE0") + mraky(F, r, 2, 30, 56, 70) + rasy(F, r, 2, 12, 26);
      o += hory(F, r, [[-10, 130], [30, 96], [60, 70], [84, 88], [120, 50], [150, 78], [186, 60], [226, 96], [262, 64], [300, 86], [340, 58], [380, 92], [410, 84]], 160, "#A4AEC0", "#6E7A96", 100, .3);
      o += pas(F, q, 162, .6, "#3E5E48");
      o += hrebeny(F, [[184, 10, 60, 3, "#8EB05E", 0]]);
      const drev = { typ: "sedlo", stena: "#5E4634", bok: "#3E2E24", strecha: "#5E5A56", hrazdi: "#F2EEE4", okna: 2, okno: "#E8EEF4", okenice: null, rh: 9 };
      o += vesnice(F, q, [[60, 214, 30, 11, drev], [110, 220, 26, 10, Object.assign({}, drev, { strecha: "#6E665A" })], [290, 210, 22, 9, Object.assign({}, drev, { hrazdi: null, stena: "#7A5E46" })]]);
      let orn = ""; [[60, 214, 30, 11], [110, 220, 26, 10]].forEach(function(d){ for (let i = 0; i < 6; i++) orn += '<circle cx="' + f1(d[0] + 3 + i * d[2] / 6) + '" cy="' + f1(d[1] - d[3] * .5) + '" r=".8" fill="#FBFAF6"/>'; });
      o += '<g filter="url(#' + F.jemna + ')">' + orn + '</g>';
      [[200, 232, 1.6], [226, 238, 1.9], [370, 236, 1.8], [20, 240, 1.7]].forEach(function(t){ o += jehlicnan(F, q, t[0], t[1], t[2], "#2F4B3A"); });
      let ovce = ""; for (let i = 0; i < 8; i++) { const x = 150 + q() * 120, y = 196 + q() * 14, s2 = .8 + (y - 196) / 24; ovce += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3 * s2) + '" ry="' + f1(2 * s2) + '" fill="#F7F4EC"/><circle cx="' + f1(x + 2.8 * s2) + '" cy="' + f1(y - .5) + '" r="' + f1(.9 * s2) + '" fill="#3A3A3A"/>'; }
      return o + '<g filter="url(#' + F.jemna + ')">' + ovce + '</g>' + trava(F, r, 150, 222, 254, ["#557F38", "#78A04A", "#46692E"]) + kvety(F, r, 22, 226, 252, ["#F4F0E4", "#E8D56A", "#8E7FC8"], .9);
    },
    /* Julské Alpy (slovinština): vápencové štíty, zelené údolí, kozolce se senem, bílý kostelík na pahorku */
    alpy: function(F, r){
      const q = nahoda(F.sem + 227);
      let o = nebe(F, "#76A6DC", "#F0EAE0") + mraky(F, r, 3, 26, 60, 80);
      o += hory(F, r, [[-10, 140], [40, 90], [90, 64], [130, 96], [180, 52], [230, 88], [280, 70], [340, 100], [410, 80]], 158, "#C4C8D0", "#8A90A4", 90, .2);
      o += pas(F, q, 160, .55, "#4E6E50");
      o += hrebeny(F, [[176, 12, 60, 2.5, "#98BC62", 0]]);
      o += skalka(F, 300, 170, 30, 20, "#8EAE5E") + kostel(F, q, 280, 174, .9, { vez: "jehlan", stena: "#FBFAF6", strecha: "#B84E36", vezStrecha: "#B84E36" });
      o += vesnice(F, q, [[60, 196, 26, 14, { typ: "sedlo", stena: "#F4EEE2", strecha: "#6E5A4A", patra: 2, okna: 3, okenice: "#5E4634", rh: 10 }], [100, 200, 20, 11, { typ: "sedlo", stena: "#6E5438", bok: "#4A3828", strecha: "#6E5A4A", okna: 2 }]]);
      o += hrebeny(F, [[212, 5, 70, 4.5, "#8AB05A", 0]]) + kozolec(F, 150, 232, 60, 26, 1.1) + kozolec(F, 250, 214, 34, 15, .7);
      return o + trava(F, r, 150, 226, 254, ["#557F38", "#78A04A", "#46692E"]) + kvety(F, r, 24, 230, 252, ["#F4F0E4", "#E8D56A", "#5A7ED0"], .9);
    },
    /* Bulharsko: horská vesnice obrozeneckých domů (bílé patro na kamenném přízemí, kamenné střechy), kostelík, růžová pole */
    bulharsko: function(F, r){
      const q = nahoda(F.sem + 229);
      let o = nebe(F, "#7EAADC", "#F2E8D6") + mraky(F, r, 3, 26, 62, 80);
      o += hory(F, r, [[-10, 130], [60, 96], [130, 84], [200, 102], [280, 80], [350, 98], [410, 90]], 150, "#98A8BE", "#6A7A9A", 90, .1);
      o += pas(F, q, 150, .6, "#4E6E50") + hrebeny(F, [[166, 14, 60, 2, "#98B468", 0]]);
      const ob = { typ: "valba", stena: "#FBF8F0", strecha: "#8A8680", patra: 2, okna: 3, okno: "#4A4050", hrazdi: "#5E4634", rh: 6, d: 14 };
      const dm = [[150, 176, 26, 14, ob], [182, 172, 22, 13, ob], [216, 178, 28, 15, ob], [250, 170, 22, 13, ob], [120, 182, 22, 12, ob]];
      o += vesnice(F, q, dm) + byzant(F, q, 280, 180, .7, { stena: "#E0CCA8", strecha: "#9A8A7A" });
      let pod = ""; dm.forEach(function(d){ pod += "M" + d[0] + " " + d[1] + " l0 " + f1(-d[3] * .45) + " l" + d[2] + " 0 l0 " + f1(d[3] * .45) + " z "; });
      o += laz(F, pod, "#B0A48E", .55);
      o += hrebeny(F, [[200, 4, 80, 3, "#7EA04E", 0]]);
      let ruze = ""; for (let rada = 0; rada < 8; rada++) { const y = 206 + rada * 6 + rada * rada * .3; for (let x = -8 + (rada % 2) * 4; x < 420; x += 7 + rada) { const s2 = .5 + rada * .14;
          ruze += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3.6 * s2) + '" ry="' + f1(2.4 * s2) + '" fill="#4E7A3A"/>' + (q() < .8 ? '<circle cx="' + f1(x + (q() - .5) * 3 * s2) + '" cy="' + f1(y - 1.4 * s2) + '" r="' + f1(1.1 * s2) + '" fill="' + ["#E8609A", "#D84A88", "#F090B8"][Math.floor(q() * 3)] + '"/>' : ""); } }
      return o + '<g opacity=".9" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + ruze + '</g>';
    },
    /* Makedonie: velké jezero pod horami, byzantský kostelík na skalním výběžku, bílé domy s tmavými trámy, rybářská loďka */
    makedonie: function(F, r){
      const q = nahoda(F.sem + 233);
      let o = nebe(F, "#72A6DE", "#F4E8D2") + rasy(F, r, 3, 12, 36) + mrak(F, r, 110, 50, 60);
      o += hory(F, r, [[-10, 120], [60, 92], [140, 104], [220, 86], [300, 100], [410, 94]], 138, mix("#98A6C0", F.opar, .3), mix("#6A7A9A", F.opar, .2), 0, .1);
      o += voda(F, r, "M-10 138 L410 137 L410 256 L-10 256 Z", "#7EB0D4", "#3E78A8", 142, 250, 22);
      const vy = "M190 256 Q210 206 250 184 Q300 170 360 172 Q400 174 420 180 L420 256 Z";
      o += skalka(F, 300, 176, 70, 80, "#B4A088") + kryt(F, vy) + vrstva(F, vy, "#A89A6A", "#7A6E4A", .9);
      o += byzant(F, q, 262, 176, 1, { stena: "#D8BC98", strecha: "#B8603E" }) + cypris(F, q, 250, 180, 30);
      const ob = { typ: "valba", stena: "#FBF8F0", strecha: "#B8603E", patra: 2, okna: 2, okno: "#4A4050", hrazdi: "#5E4634", rh: 6 };
      o += vesnice(F, q, [[330, 196, 22, 13, ob], [356, 200, 22, 13, ob], [384, 196, 22, 13, ob], [320, 214, 26, 14, ob], [360, 222, 30, 15, ob]]);
      o += vrstva(F, "M70 218 L130 216 Q124 226 100 227 Q80 227 70 218 Z", "#6A5040", "#4A3A2E", .95, F.jemna) + skupina(F, F.stetec, tah("M96 216 l0 -20", "#4A3A2E", .8, .9));
      return o + ptaci(F, r, 3, 60, 70);
    },
    /* Albánie: kamenné město na svahu, domy s šedými střechami z kamenných desek, suché hory, olivy */
    albanie: function(F, r){
      const q = nahoda(F.sem + 239);
      let o = nebe(F, "#76AAE0", "#F4E6CC") + rasy(F, r, 3, 12, 36);
      o += hory(F, r, [[-10, 110], [70, 70], [140, 92], [220, 60], [300, 84], [360, 66], [410, 80]], 150, "#B4A894", "#7E7466", 0, .15);
      const sv = "M-10 256 L-10 140 Q100 120 200 132 Q300 144 420 150 L420 256 Z";
      o += kryt(F, sv) + vrstva(F, sv, "#B8AE84", "#8A8058", .9);
      const ob = { typ: "valba", stena: "#EEE8DA", bok: "#A8A090", strecha: "#7E7C7A", patra: 3, okna: 3, okno: "#3E3A40", rh: 6, d: 12 };
      const dm = []; for (let rada = 0; rada < 4; rada++) for (let i = 0; i < 6; i++) { const x = 30 + i * 52 + rada * 14 + q() * 10, y = 150 + rada * 20 + q() * 4;
        dm.push([x, y, 22 + q() * 8, 14 + q() * 6, Object.assign({}, ob, { stena: q() < .5 ? "#EEE8DA" : "#D8CCB4" })]); }
      o += vesnice(F, q, dm);
      let pod = ""; dm.forEach(function(d){ pod += "M" + f1(d[0]) + " " + f1(d[1]) + " l0 " + f1(-d[3] * .35) + " l" + f1(d[2]) + " 0 l0 " + f1(d[3] * .35) + " z "; });
      return o + laz(F, pod, "#A89C84", .5) + oliva(F, q, 20, 252, 1.4) + oliva(F, q, 390, 252, 1.3);
    },
    /* Srbsko: zvlněné kopce se švestkovými sady, klášter s byzantským kostelem v hradbách, stohy */
    srbsko: function(F, r){
      const q = nahoda(F.sem + 241);
      let o = nebe(F, "#80ACDC", "#F2E8D4") + mraky(F, r, 3, 26, 66, 80);
      o += hrebeny(F, [[118, 10, 60, 1, "#8C9EB6", .5]]) + pas(F, q, 136, .55, "#4E6E50") + hrebeny(F, [[150, 12, 70, 2.6, "#9AB868", 0]]);
      const mx = 160, my = 176, zed = "M" + (mx - 20) + " " + my + " L" + (mx + 90) + " " + (my - 2) + " L" + (mx + 90) + " " + (my - 9) + " L" + (mx - 20) + " " + (my - 7) + " Z";
      o += byzant(F, q, mx + 20, my - 8, 1.1, { stena: "#E6D2B0", strecha: "#B8603E" }) + dum(F, q, mx - 18, my - 6, 24, 12, { typ: "sedlo", stena: "#F2EADA", strecha: "#B8603E", patra: 2, okna: 3, hrazdi: "#6A4A36" });
      o += kryt(F, zed, F.jemna) + vrstva(F, zed, "#E6D8BC", "#B8A888", .95, F.jemna);
      o += hrebeny(F, [[196, 6, 70, 4, "#8EB05A", 0]]);
      for (let rada = 0; rada < 3; rada++) for (let i = 0; i < 7; i++) { const x = 20 + i * 56 + rada * 20 + q() * 10, y = 214 + rada * 14, s2 = .9 + rada * .3;
        o += strom(F, q, x, y, s2, "#5E8A44"); if (q() < .8) { let sv = ""; for (let k = 0; k < 6; k++) sv += '<circle cx="' + f1(x + (q() - .5) * 12 * s2) + '" cy="' + f1(y - 17 * s2 + (q() - .5) * 8 * s2) + '" r="' + f1(.9 * s2) + '"/>'; o += '<g fill="#5A3A8A" opacity=".8">' + sv + '</g>'; } }
      return o + seno(F, 360, 200, 1) + trava(F, r, 100, 236, 254, ["#557F38", "#78A04A"]);
    },
    /* Maramureš (rumunština): zelené kopce, vysoký dřevěný kostel se šindelovou věží, dřevěné domy, kupky sena */
    maramures: function(F, r){
      const q = nahoda(F.sem + 251);
      let o = nebe(F, "#80ACDC", "#F2E8D4") + mraky(F, r, 3, 26, 66, 80);
      o += hrebeny(F, [[112, 10, 60, 1, "#8C9EB6", .5]]) + pas(F, q, 132, .55, "#3E5E48") + hrebeny(F, [[150, 14, 60, 2.2, "#98B868", 0]]);
      o += kostel(F, q, 250, 170, 1.15, { vez: "dreveny", stena: "#7A5A42", strecha: "#4A3A30", strechaLodi: "#4A3A30", vezStrecha: "#3E3028" });
      const drev = { typ: "valba", stena: "#8A6A4E", bok: "#5E4634", strecha: "#5E5048", okna: 2, okno: "#E8EEF4", rh: 11 };
      o += vesnice(F, q, [[90, 186, 24, 10, drev], [140, 192, 22, 10, drev], [330, 190, 24, 10, drev]]);
      /* vyřezávaná brána se stříškou */
      o += skupina(F, F.stetec, tah("M40 222 l0 -30 M72 222 l0 -30", "#6A4E38", 3, .95) + tah("M40 204 Q56 196 72 204", "#6A4E38", 1.6, .9)) + nanes(F, "M34 192 L78 192 L70 184 L42 184 Z", "#4A3A30");
      o += hrebeny(F, [[210, 6, 70, 4, "#8EB05A", 0]]);
      [[150, 226, 1.2], [190, 232, 1.4], [230, 228, 1.1], [300, 236, 1.5], [360, 226, 1.1]].forEach(function(k){ o += seno(F, k[0], k[1], k[2]); });
      return o + trava(F, r, 140, 226, 254, ["#557F38", "#78A04A", "#46692E"]) + kvety(F, r, 22, 230, 252, ["#F4F0E4", "#E8D56A", "#D05A8A"], .9);
    },
    /* romština: jarní rozkvetlý sad u cesty, barevně natřené domky, koně na pastvě */
    sady: function(F, r){
      const q = nahoda(F.sem + 257);
      let o = nebe(F, "#86B0DE", "#F2EAD8") + mraky(F, r, 4, 26, 70, 80);
      o += hrebeny(F, [[124, 8, 70, 1, "#8C9EB6", .5], [146, 8, 60, 2.4, "#9AB868", .1]]);
      const d = { typ: "valba", strecha: "#B8543A", okna: 2, rh: 7 };
      o += vesnice(F, q, [[180, 160, 22, 11, Object.assign({}, d, { stena: "#8EC0D8" })], [208, 162, 20, 10, Object.assign({}, d, { stena: "#F0D070" })], [234, 160, 22, 11, Object.assign({}, d, { stena: "#E8A0B0" })], [262, 163, 20, 10, Object.assign({}, d, { stena: "#A8D09A" })]]);
      o += hrebeny(F, [[172, 6, 70, 3, "#8EB05A", 0]]);
      o += skupina(F, F.stetec, tah("M200 172 C230 190 150 210 180 256", "#D8C8A0", 8, .9) + tah("M200 172 C230 190 150 210 180 256", "#B8A078", 1, .4));
      for (let i = 0; i < 9; i++) { const x = 20 + i * 44 + q() * 10, y = 196 + (i % 3) * 16 + q() * 6, s2 = 1 + (y - 196) / 30;
        if (Math.abs(x - 190) < 30) continue;
        o += strom(F, q, x, y, s2, "#7E9A52"); let kv = ""; for (let k = 0; k < 22; k++) kv += '<circle cx="' + f1(x + (q() - .5) * 16 * s2) + '" cy="' + f1(y - 17 * s2 + (q() - .5) * 11 * s2) + '" r="' + f1((.8 + q() * .7) * s2) + '"/>';
        o += '<g fill="' + (i % 2 ? "#FBF4F4" : "#F4C8D4") + '" opacity=".9" filter="url(#' + F.jemna + ')">' + kv + '</g>'; }
      let kone = ""; [[300, 232, 1.4, "#6E5038"], [336, 238, 1.6, "#3A2E26"]].forEach(function(k){ const x = k[0], y = k[1], s = k[2];
        kone += '<path d="M' + f1(x) + " " + f1(y) + " l" + f1(1.5 * s) + " " + f1(-7 * s) + " l" + f1(12 * s) + " 0 l" + f1(2.5 * s) + " " + f1(-4 * s) + " l" + f1(2.5 * s) + " " + f1(.5 * s) + " l" + f1(-1 * s) + " " + f1(5 * s) + " l0 " + f1(5.5 * s) + " l" + f1(-1.6 * s) + " 0 l0 " + f1(-4.5 * s) + " l" + f1(-11 * s) + " 0 l" + f1(-1 * s) + " " + f1(4.5 * s) + ' z" fill="' + k[3] + '"/>'; });
      o += '<g filter="url(#' + F.jemna + ')" opacity=".92">' + kone + '</g>';
      return o + trava(F, r, 150, 222, 254, ["#557F38", "#78A04A", "#46692E"]) + kvety(F, r, 30, 226, 252, ["#F4F0E4", "#E8D56A"], .9);
    },
    /* maďarská pusta: rovina, studna s vahadlem, dlouhé bílé stavení s doškovou střechou, šedý dobytek */
    puszta: function(F, r){
      const q = nahoda(F.sem + 263);
      let o = nebe(F, "#78A6DA", "#F6E6C4") + mraky(F, r, 4, 30, 90, 110) + rasy(F, r, 2, 12, 28);
      o += hrebeny(F, [[150, 1, 90, 1, "#A8B08A", .5]]) + koruny(F, q, 20, 120, 152, .3, mix("#6E8A5A", F.opar, .4), .7, F.jemna);
      o += hrebeny(F, [[154, 2, 90, 2, "#C4C07A", .05]]);
      o += dum(F, q, 210, 170, 70, 10, { typ: "dosky", stena: "#FBF8F0", strecha: "#A8905A", okna: 4, okenice: "#4E6E9A", rh: 11, d: 18 });
      let sl = ""; for (let i = 0; i < 6; i++) sl += tah("M" + f1(214 + i * 12) + " 170 l0 -10", "#8A6E50", .8, .8); o += skupina(F, F.stetec, sl);
      o += studna(F, 120, 194, 1.3);
      let kr = ""; [[240, 214, 1.7], [282, 220, 1.9], [322, 210, 1.5], [356, 226, 2.1]].forEach(function(k){ const x = k[0], y = k[1], s = k[2];
        kr += '<path d="M' + f1(x) + " " + f1(y) + " l" + f1(1 * s) + " " + f1(-7 * s) + " l" + f1(13 * s) + " 0 l" + f1(3 * s) + " " + f1(-2 * s) + " l" + f1(2 * s) + " " + f1(2.5 * s) + " l" + f1(-2 * s) + " " + f1(2 * s) + " l0 " + f1(5 * s) + " l" + f1(-1.4 * s) + " 0 l0 " + f1(-4 * s) + " l" + f1(-11 * s) + " 0 l" + f1(-.8 * s) + " " + f1(4 * s) + ' z" fill="#A8A29A"/>' +
          '<path d="M' + f1(x + 16 * s) + " " + f1(y - 9 * s) + " q" + f1(-3 * s) + " " + f1(-4 * s) + " " + f1(-5 * s) + " " + f1(-3 * s) + " M" + f1(x + 17 * s) + " " + f1(y - 9 * s) + " q" + f1(3 * s) + " " + f1(-4 * s) + " " + f1(6 * s) + " " + f1(-3 * s) + '" stroke="#4A4440" stroke-width="' + f1(.6 * s) + '" fill="none"/>'; });
      o += '<g filter="url(#' + F.jemna + ')" opacity=".92">' + kr + '</g>';
      return o + trava(F, r, 260, 190, 254, ["#9AA050", "#B8B060", "#7E8A40", "#C8C070"]) + kvety(F, r, 22, 206, 252, ["#9A7AC8", "#F4F0E4"], .9);
    },
    /* štetl (jidiš): dřevěné domy podél blátivé ulice, dřevěná synagoga s patrovou střechou, ploty, břízy, studna */
    stetl: function(F, r){
      const q = nahoda(F.sem + 269);
      let o = nebe(F, "#8AAED6", "#F0E8D6") + mraky(F, r, 3, 26, 64, 90);
      o += hrebeny(F, [[134, 3, 90, 1, "#8C9EAE", .5]]) + lesik(F, q, -10, 410, 146, .8, "#445E4E", true);
      o += hrebeny(F, [[150, 2, 90, 2, "#9AB468", 0]]);
      /* synagoga: mohutná dřevěná stavba, dvoupatrová lámaná střecha */
      const sx = 170, sy = 178;
      o += dum(F, q, sx, sy, 44, 18, { typ: "valba", stena: "#8A6A4E", bok: "#5E4634", strecha: "#5E5A56", okna: 4, okno: "#E8E4D0", rh: 8, d: 24 }) +
        dum(F, q, sx + 8, sy - 22, 28, 8, { typ: "valba", stena: "#7A5E46", bok: "#5E4634", strecha: "#5E5A56", okna: 3, okno: "#E8E4D0", dvere: false, rh: 10, d: 16 });
      const dr = { typ: "stit", stena: "#9A7A5A", bok: "#6A5038", strecha: "#7A7670", okna: 2, okno: "#E8EEF4", okenice: "#6A8AB0", dvere: false };
      o += vesnice(F, q, [[60, 196, 18, 11, dr], [84, 200, 18, 11, Object.assign({}, dr, { strecha: "#6E6A5A" })], [262, 198, 18, 11, dr], [288, 202, 20, 12, Object.assign({}, dr, { okenice: "#8A5A4A" })], [30, 192, 16, 10, dr], [320, 196, 18, 11, dr]]);
      const ul = "M150 256 Q180 210 200 196 L230 196 Q250 214 290 256 Z";
      o += kryt(F, ul) + vrstva(F, ul, "#B8A480", "#8A7658", .9);
      let kal = ""; for (let i = 0; i < 12; i++) kal += tah("M" + f1(170 + q() * 90) + " " + f1(208 + q() * 44) + " q6 -1 12 0", "#C8D4DE", .8, .6); o += skupina(F, F.stetec, kal);
      let pl = ""; for (let x = 20; x < 140; x += 3.6) pl += tah("M" + f1(x) + " 214 l0 -8", "#7A6048", .7, .8); for (let x = 300; x < 400; x += 3.6) pl += tah("M" + f1(x) + " 214 l0 -8", "#7A6048", .7, .8);
      o += skupina(F, F.stetec, pl) + briza(F, q, 130, 240, 1.2) + briza(F, q, 360, 244, 1.3) + studna(F, 60, 238, 1.1);
      return o + trava(F, r, 120, 222, 254, ["#607F44", "#809D55", "#4C6A36"]);
    },
    /* Island: mechová lávová pláň, vodopád z čedičové stěny, drnové domky s bílými štíty, kostelík, zasněžené hory */
    island: function(F, r){
      const q = nahoda(F.sem + 271);
      let o = nebe(F, "#8AAAD4", "#EEEAE2") + mraky(F, r, 3, 24, 60, 90) + rasy(F, r, 3, 10, 36);
      o += hory(F, r, [[-10, 130], [50, 104], [110, 112], [170, 92], [240, 110], [310, 96], [370, 108], [410, 102]], 140, "#C8CEDA", "#8E9AB4", 140, .12);
      const pl = "M-10 256 L-10 150 L420 148 L420 256 Z", st = "M-10 256 L-10 136 L200 130 L230 132 L230 176 Q220 200 250 206 Q330 210 420 204 L420 256 Z";
      o += kryt(F, pl) + vrstva(F, pl, "#8A9A62", "#6E7A4E", .9) + kryt(F, st) + vrstva(F, st, "#6E7458", "#4A4E3A", .92);
      let sl = ""; for (let x = 0; x < 230; x += 7 + q() * 4) sl += tah("M" + f1(x) + " 136 l" + f1((q() - .5) * 2) + " " + f1(18 + q() * 16), "#3A3A34", .8, .5); o += skupina(F, F.stetec, sl);
      o += mok(F, "M196 132 L214 132 Q218 170 224 208 L200 208 Q198 170 196 132 Z", "#FFFFFF", .92) + mok(F, "M186 206 Q210 196 240 206 Q210 214 186 206 Z", "#FFFFFF", .7);
      o += voda(F, r, "M190 208 Q220 204 250 210 Q230 230 260 256 L200 256 Q210 232 190 208 Z", "#B8D0E2", "#7E9EC0", 210, 250, 6);
      let mech = ""; for (let i = 0; i < 80; i++) mech += '<ellipse cx="' + f1(q() * W) + '" cy="' + f1(150 + q() * 100) + '" rx="' + f1(3 + q() * 7) + '" ry="' + f1(1.4 + q() * 2.4) + '" fill="' + ["#8EA05A", "#7A8A4A", "#A8B06A", "#5E6A40"][i % 4] + '"/>';
      o += '<g opacity=".7" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + mech + '</g>';
      const dr = { typ: "stit", stena: "#FBFAF6", bok: "#6E7A4E", strecha: "#7E9A4E", okna: 2, dvere: true, okno: "#3E4656", d: 16 };
      o += vesnice(F, q, [[280, 208, 14, 9, dr], [296, 209, 13, 8, dr], [311, 208, 14, 9, dr]]) + kostel(F, q, 340, 212, .7, { vez: "jehlan", stena: "#FBFAF6", strecha: "#B8402E", vezStrecha: "#B8402E" });
      return o + trava(F, r, 60, 226, 254, ["#8A9A58", "#6E7A48"]);
    },
    /* Faerské ostrovy: strmé zelené svahy do moře, skalní útesy, černé dřevěné domy s travnatými střechami, ovce */
    faerske: function(F, r){
      const q = nahoda(F.sem + 277);
      let o = nebe(F, "#8CA8CC", "#EEEAE2") + mraky(F, r, 4, 20, 60, 100) + rasy(F, r, 3, 10, 30);
      o += voda(F, r, "M-10 150 L410 148 L410 256 L-10 256 Z", "#7E9CB8", "#3E6284", 152, 250, 20);
      o += hory(F, r, [[-10, 150], [30, 110], [80, 70], [130, 100], [170, 150]], 150, "#8AA06A", "#4E6A4A", 0, .08);
      o += skalka(F, 230, 118, 12, 32, "#7A7A70");
      const sv = "M180 256 Q190 180 250 150 Q320 118 420 110 L420 256 Z";
      o += kryt(F, sv) + vrstva(F, sv, "#8CAE62", "#5E8A48", .92);
      o += laz(F, "M180 256 Q186 216 200 190 L214 196 Q200 226 204 256 Z", "#6E6E6A", .6);
      const cd = { typ: "sedlo", stena: "#2E2E34", bok: "#1E1E24", strecha: "#7EA04E", okna: 2, okno: "#F4EEE2", okenice: null, rh: 7 };
      o += vesnice(F, q, [[250, 176, 22, 10, cd], [284, 168, 18, 9, Object.assign({}, cd, { stena: "#A8382E", bok: "#6E2A24" })], [310, 176, 22, 10, cd], [340, 164, 18, 9, Object.assign({}, cd, { stena: "#FBFAF6", bok: "#A8ACB8" })], [270, 190, 20, 10, cd]]);
      o += kostel(F, q, 360, 186, .75, { vez: "jehlan", stena: "#FBFAF6", strecha: "#2E2E34", strechaLodi: "#6E8E4A", vezStrecha: "#2E2E34" });
      let ovce = ""; for (let i = 0; i < 7; i++) { const x = 230 + q() * 170, y = 206 + q() * 40, s2 = .9 + (y - 206) / 30; ovce += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3 * s2) + '" ry="' + f1(2 * s2) + '" fill="#F7F4EC"/><circle cx="' + f1(x + 2.8 * s2) + '" cy="' + f1(y - .5) + '" r="' + f1(.9 * s2) + '" fill="#3A3A3A"/>'; }
      return o + '<g filter="url(#' + F.jemna + ')">' + ovce + '</g>' + ptaci(F, r, 4, 120, 60);
    },
    /* Skotská vysočina (gaelština): jezero mezi vřesovými horami, bílá chalupa s břidlicí, kamenná věž na břehu */
    skotsko: function(F, r){
      const q = nahoda(F.sem + 281);
      let o = nebe(F, "#8AA6CC", "#EEE8DE") + mraky(F, r, 4, 20, 64, 100);
      o += hory(F, r, [[-10, 130], [60, 90], [120, 110], [190, 84], [260, 112], [330, 88], [410, 110]], 150, "#9A8EA4", "#6A5E78", 0, .1);
      o += hrebeny(F, [[146, 8, 60, 1.5, "#8A7A6A", .2]]);
      const vr = []; for (let i = 0; i < 50; i++) vr.push('<ellipse cx="' + f1(q() * W) + '" cy="' + f1(140 + q() * 20) + '" rx="' + f1(4 + q() * 8) + '" ry="' + f1(1.5 + q() * 2) + '" fill="' + ["#9A6A8A", "#7E5A6E", "#8A7A4A"][i % 3] + '"/>');
      o += '<g opacity=".55" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + vr.join("") + '</g>';
      o += voda(F, r, "M-10 160 Q200 154 420 160 L420 206 Q200 200 -10 210 Z", "#9EB4CC", "#5E7A9A", 162, 204, 12);
      o += skalka(F, 100, 162, 24, 12, "#8A8478");
      const vz = "M92 162 l0 -30 l14 0 l0 30 z";
      o += kryt(F, vz, F.jemna) + vrstva(F, vz, "#B8B0A0", "#8A8272", .95, F.jemna) + laz(F, "M101 162 l0 -30 l5 0 l0 30 z", "#4A4A58", .4) +
        nanes(F, "M92 132 l0 -3 l2.5 0 l0 3 M97 132 l0 -3 l2.5 0 l0 3 M102 132 l0 -3 l2.5 0 l0 3 z", "#B8B0A0") + nanes(F, "M97 150 l2 0 l0 -4 l-2 0 z M97 140 l2 0 l0 -3 l-2 0 z", "#3A3A44", .8);
      o += hrebeny(F, [[210, 6, 70, 3.5, "#8A8A58", 0]]);
      o += dum(F, q, 250, 222, 40, 11, { typ: "sedlo", stena: "#FBFAF6", bok: "#B8BCC8", strecha: "#4E5462", okna: 3, okno: "#3E4656", rh: 10, komin: "#D8D4CC" });
      let vres = ""; for (let i = 0; i < 70; i++) vres += '<circle cx="' + f1(q() * W) + '" cy="' + f1(220 + q() * 34) + '" r="' + f1(1 + q() * 1.4) + '" fill="' + ["#A0508A", "#B86AA0", "#8A4A7A"][i % 3] + '"/>';
      return o + trava(F, r, 140, 216, 254, ["#7E7A48", "#9A8A58", "#6A6A3E"]) + '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + vres + '</g>';
    },
    /* Wales (velština): zelené hory, kamenné zídky přes svahy, kamenné chalupy s břidlicovými střechami, kaple, ovce */
    wales: function(F, r){
      const q = nahoda(F.sem + 283);
      let o = nebe(F, "#8AA8D0", "#EEEAE0") + mraky(F, r, 4, 20, 64, 100);
      o += hory(F, r, [[-10, 120], [70, 70], [140, 96], [210, 62], [290, 98], [350, 80], [410, 100]], 160, "#8E9E86", "#5A6A5E", 0, .15);
      o += hrebeny(F, [[164, 12, 70, 2, "#86AE5A", 0]]);
      let zd = ""; for (let i = 0; i < 7; i++) { const x = -10 + i * 70 + q() * 20; zd += "M" + f1(x) + " " + f1(vyska(x, 164, 12, 70, 2)) + " Q" + f1(x + 20) + " 200 " + f1(x - 10 + q() * 20) + " 256 "; }
      zd += "M-10 206 Q200 194 420 210 ";
      o += skupina(F, F.stetec, '<path d="' + zd + '" stroke="#8A8676" stroke-width="1.6" opacity=".75" fill="none" stroke-dasharray="2 1"/>');
      const ch = { typ: "sedlo", stena: "#A8A294", bok: "#76726A", strecha: "#4A5060", okna: 2, okno: "#3E4656", rh: 8, komin: "#8A8478" };
      o += vesnice(F, q, [[210, 196, 26, 10, ch], [250, 200, 22, 10, Object.assign({}, ch, { stena: "#B4AE9E" })], [290, 196, 1, 0, { kostel: 1, vez: "stupne", stena: "#A8A294", strecha: "#4A5060", strechaLodi: "#4A5060" }]]);
      let ovce = ""; for (let i = 0; i < 12; i++) { const x = q() * 400, y = 214 + q() * 36, s2 = .9 + (y - 214) / 30; ovce += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3 * s2) + '" ry="' + f1(2 * s2) + '" fill="#F7F4EC"/><circle cx="' + f1(x + 2.8 * s2) + '" cy="' + f1(y - .5) + '" r="' + f1(.9 * s2) + '" fill="#3A3A3A"/>'; }
      return o + trava(F, r, 150, 220, 254, ["#557F38", "#78A04A", "#46692E"]) + '<g filter="url(#' + F.jemna + ')">' + ovce + '</g>';
    },
    /* Bretaň: růžové žulové skály u moře, maják, kamenné domy s břidlicí, kaple, žlutý hlodáš */
    bretan: function(F, r){
      const q = nahoda(F.sem + 293);
      let o = nebe(F, "#86AAD6", "#F0EAE0") + mraky(F, r, 3, 24, 64, 90);
      o += voda(F, r, "M-10 136 L410 134 L410 256 L-10 256 Z", "#6EA0C4", "#2E6A94", 138, 250, 22);
      const pz = "M160 256 Q190 180 260 156 Q330 140 420 144 L420 256 Z";
      o += kryt(F, pz) + vrstva(F, pz, "#9AB46A", "#6E8A4A", .9);
      o += vesnice(F, q, [[270, 160, 26, 11, { typ: "sedlo", stena: "#C8C0B0", bok: "#8A847A", strecha: "#4A5060", okna: 3, okenice: "#3E6AA0", rh: 10, komin: "#B0A898" }], [310, 156, 20, 10, { typ: "sedlo", stena: "#D0C8B8", bok: "#8A847A", strecha: "#4A5060", okna: 2, rh: 9, komin: "#B0A898" }],
        [350, 152, .8, 0, { kostel: 1, vez: "jehlan", stena: "#C0B8A8", strecha: "#4A5060", strechaLodi: "#4A5060", vezStrecha: "#4A5060" }]]);
      o += skalka(F, 90, 176, 44, 24, "#C89A8A") + majak(F, 86, 178, 1.3, "#C8402E");
      let bal = ""; [[190, 232, 34, 22], [140, 248, 30, 16], [240, 250, 40, 20], [60, 236, 30, 18]].forEach(function(b){ bal += "M" + (b[0] - b[2]) + " " + (b[1] + 8) + " Q" + (b[0] - b[2] * 1.1) + " " + (b[1] - b[3] * .8) + " " + (b[0] - b[2] * .1) + " " + (b[1] - b[3]) + " Q" + (b[0] + b[2]) + " " + (b[1] - b[3] * .7) + " " + (b[0] + b[2]) + " " + (b[1] + 8) + " Z "; });
      o += kryt(F, bal) + vrstva(F, bal, "#E0B0A0", "#A0706A", .95);
      let pena = ""; for (let i = 0; i < 14; i++) pena += tah("M" + f1(20 + q() * 260) + " " + f1(200 + q() * 50) + " q6 -2 12 0", "#FFFFFF", 1.2, .8);
      let hl = ""; for (let i = 0; i < 50; i++) hl += '<circle cx="' + f1(200 + q() * 210) + '" cy="' + f1(176 + q() * 50) + '" r="' + f1(1 + q() * 1.2) + '" fill="' + ["#E8C030", "#D8A820"][i % 2] + '"/>';
      return o + skupina(F, F.stetec, pena) + '<g opacity=".85" filter="url(#' + F.jemna + ')">' + hl + '</g>';
    },
    /* Galicie: zátoka ría mezi zelenými kopci, sýpka hórreo, kamenný dům, eukalypty, rybářské loďky */
    galicie: function(F, r){
      const q = nahoda(F.sem + 307);
      let o = nebe(F, "#86AAD6", "#EEEAE0") + mraky(F, r, 4, 24, 66, 90);
      o += hrebeny(F, [[118, 12, 60, 1, "#8A9EB2", .5]]);
      o += hrebeny(F, [[128, 10, 70, 2, "#7EA46A", .25]]);
      o += voda(F, r, "M-10 150 Q200 140 420 152 L420 192 Q200 180 -10 198 Z", "#7EAACC", "#4A7EA8", 152, 192, 12);
      const pr = "M-10 256 L-10 190 Q120 170 220 186 Q320 200 420 186 L420 256 Z";
      o += kryt(F, pr) + vrstva(F, pr, "#8CB45E", "#5E8A42", .92);
      o += dum(F, q, 60, 208, 30, 13, { typ: "sedlo", stena: "#B8B0A0", bok: "#80786C", strecha: "#B8603E", patra: 2, okna: 3, okenice: "#FBFAF6", rh: 8 });
      o += horreo(F, 180, 214, 1.4);
      [[300, 212, 1.4], [330, 218, 1.7], [362, 210, 1.5]].forEach(function(t){ o += skupina(F, F.stetec, tah("M" + t[0] + " " + t[1] + " l" + f1((q() - .5) * 3) + " -" + f1(44 * t[2]), "#C8B8A0", 1.4 * t[2], .95)) + koruny(F, q, t[0] - 10 * t[2], t[0] + 10 * t[2], t[1] - 38 * t[2], .4 * t[2], "#6E8A6A", .85, F.jemna); });
      [[80, 172, .8, "#2E6AA8"], [140, 176, .9, "#C8402E"]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 12 * s) + " " + f1(y - 4 * s) + " L" + f1(x + 12 * s) + " " + f1(y - 5 * s) + " Q" + f1(x + 8 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 8 * s) + " " + f1(y + 2 * s) + " " + f1(x - 12 * s) + " " + f1(y - 4 * s) + " Z", "#F4EEE2", "#B8B0A0", .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(x - 11 * s) + " " + f1(y - 4.5 * s) + " L" + f1(x + 11 * s) + " " + f1(y - 5.5 * s), b[3], 1.2 * s, .85)); });
      return o + trava(F, r, 150, 222, 254, ["#557F38", "#78A04A", "#46692E"]) + kvety(F, r, 18, 226, 252, ["#F4F0E4", "#E8D56A"], .9);
    },
    /* Dánsko: rovná zelená krajina, bílý kostel se stupňovitou věží, žlutý hrázděný statek s doškovou střechou, pobřeží s dunami */
    dansko: function(F, r){
      const q = nahoda(F.sem + 311);
      let o = nebe(F, "#82AADA", "#F2EADA") + mraky(F, r, 4, 26, 86, 110);
      o += voda(F, r, "M-10 148 L410 146 L410 158 L-10 160 Z", "#8EB2D0", "#5E88AE", 148, 158, 4);
      o += hrebeny(F, [[160, 2, 90, 1, "#9CBC68", 0]]) + koruny(F, q, 250, 400, 162, .35, "#5E8446", .8, F.jemna);
      o += kostel(F, q, 70, 176, 1.1, { vez: "stupne", stena: "#FBFAF6", strecha: "#B84E36", strechaLodi: "#B84E36" });
      o += hrebeny(F, [[214, 3, 80, 3, "#8EB05A", 0]]);
      o += dum(F, q, 170, 228, 90, 18, { typ: "dosky", stena: "#E8C860", bok: "#A8883A", strecha: "#9A8A5A", hrazdi: "#4A3A2E", okna: 6, okenice: null, okno: "#FBFAF6", rh: 20, d: 26 });
      let ob = ""; for (let rada = 0; rada < 5; rada++) for (let x = -8; x < 420; x += 6) ob += tah("M" + f1(x) + " " + f1(222 + rada * 7) + " l0 " + f1(-2 - rada), "#C8A840", .6 + rada * .1, .6);
      return o + skupina(F, F.stetec, ob) + kvety(F, r, 30, 222, 252, ["#D23A2B", "#5A7ED0", "#F4F0E4"], 1);
    },
    /* Frísko: louky s příkopy, cihlový kostel na pahorku (terpu), velký frískýstatek, černobílé krávy */
    frisko: function(F, r){
      const q = nahoda(F.sem + 313);
      let o = nebe(F, "#7EA8DA", "#F2EADA") + mraky(F, r, 4, 26, 86, 110) + rasy(F, r, 2, 10, 26);
      o += hrebeny(F, [[150, 1, 90, 1, "#9CBC68", .2]]) + koruny(F, q, 30, 140, 150, .3, "#5E8446", .8, F.jemna);
      o += skalka(F, 300, 150, 60, 10, "#8EAE5E") + kostel(F, q, 282, 152, .9, { vez: "stupne", stena: "#A85A44", strecha: "#5A5A60", strechaLodi: "#B84E36" });
      o += dum(F, q, 80, 176, 22, 13, { typ: "stit", stena: "#A85A44", bok: "#6E3A2E", strecha: "#5A5A60", patra: 2, okna: 2, okenice: "#2E6A4A" }) +
        dum(F, q, 102, 176, 60, 10, { typ: "valba", stena: "#A85A44", bok: "#6E3A2E", strecha: "#9A8A5A", okna: 3, rh: 20, d: 30 });
      o += hrebeny(F, [[180, 2, 90, 2, "#98BA62", 0]]);
      let pr = ""; [[184, 150], [206, 116], [234, 90]].forEach(function(p){ pr += "M" + f1(200 - p[1] * .3) + " " + p[0] + " L" + f1(200 + p[1] * 2.8) + " " + (p[0] + 2) + " "; });
      o += skupina(F, F.stetec, '<path d="' + pr + '" stroke="#9EC0DA" stroke-width="2.4" opacity=".9" fill="none"/>');
      o += kravy(F, q, [[40, 214, 1.6], [90, 222, 1.8], [150, 210, 1.4], [320, 226, 2]], "#FBFAF6", "#2A2A2A");
      return o + trava(F, r, 150, 214, 254, ["#557F38", "#78A04A", "#46692E"]);
    },
    /* Laponsko (sámština): zasněžené oblé hory, zakrslé břízy, stan lávvu s kouřem, sobi na sněhu */
    laponsko: function(F, r){
      const q = nahoda(F.sem + 331);
      let o = nebe(F, "#9EB4D8", "#F6E0CC") + rasy(F, r, 4, 16, 70) + slunce(F, 300, 128, 10, "#F2B07A");
      o += hory(F, r, [[-10, 140], [60, 110], [140, 124], [220, 100], [300, 122], [370, 108], [410, 116]], 150, "#C8D0E0", "#8E9CBC", 150, .06);
      const sn = "M-10 256 L-10 148 Q200 140 420 150 L420 256 Z";
      o += kryt(F, sn) + nanes(F, sn, "#F6F8FC", .97, F.lazura) + laz(F, "M-10 196 Q120 186 240 204 Q320 214 420 200 L420 256 L-10 256 Z", "#C8D4EA", .4);
      for (let i = 0; i < 14; i++) { const x = q() * W, y = 152 + q() * 40, s2 = .6 + (y - 150) / 40; o += skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(y) + " q" + f1((q() - .5) * 4) + " " + f1(-10 * s2) + " " + f1((q() - .5) * 3) + " " + f1(-20 * s2), "#E8E4DC", 1.2 * s2, .9) + tah("M" + f1(x - .5) + " " + f1(y - 4 * s2) + " l1 0 M" + f1(x) + " " + f1(y - 11 * s2) + " l1 0", "#2A2A2A", .6 * s2, .8)) + koruny(F, q, x - 6 * s2, x + 6 * s2, y - 16 * s2, .25 * s2 + .1, "#8A7A5A", .6, F.jemna); }
      /* lávvu: kužel z plachtoviny na tyčích */
      const lx = 120, ly = 214, lv = "M" + (lx - 22) + " " + ly + " L" + lx + " " + (ly - 40) + " L" + (lx + 22) + " " + ly + " Z";
      o += kryt(F, lv, F.jemna) + vrstva(F, lv, "#D8CCB4", "#A8987C", .95, F.jemna) + laz(F, "M" + lx + " " + (ly - 40) + " L" + (lx + 22) + " " + ly + " L" + (lx + 4) + " " + ly + " Z", "#6E6456", .35) +
        nanes(F, "M" + (lx - 4) + " " + ly + " L" + lx + " " + (ly - 14) + " L" + (lx + 4) + " " + ly + " Z", "#3A342E", .9) + skupina(F, F.stetec, tah("M" + (lx - 3) + " " + (ly - 36) + " l-4 -10 M" + (lx + 1) + " " + (ly - 38) + " l2 -10 M" + (lx + 3) + " " + (ly - 36) + " l5 -9", "#5A4A3A", .9, .9)) +
        mok(F, "M" + (lx - 2) + " " + (ly - 46) + " q-8 -10 -2 -22 q8 -8 2 -20 l6 0 q4 12 -4 20 q-4 12 4 22 z", "#D8DCE4", .5);
      /* sobi */
      let sob = ""; [[220, 226, 1.3], [256, 232, 1.5], [300, 222, 1.2], [338, 236, 1.6]].forEach(function(k){ const x = k[0], y = k[1], s = k[2];
        sob += '<path d="M' + f1(x) + " " + f1(y) + " l" + f1(1 * s) + " " + f1(-7 * s) + " l" + f1(11 * s) + " 0 l" + f1(3 * s) + " " + f1(-4 * s) + " l" + f1(2 * s) + " " + f1(1 * s) + " l" + f1(-1.5 * s) + " " + f1(4.5 * s) + " l0 " + f1(5.5 * s) + " l" + f1(-1.4 * s) + " 0 l0 " + f1(-4.5 * s) + " l" + f1(-9 * s) + " 0 l" + f1(-1 * s) + " " + f1(4.5 * s) + ' z" fill="' + (k[2] > 1.4 ? "#6E5E50" : "#8A7A6A") + '"/>' +
          '<path d="M' + f1(x + 15 * s) + " " + f1(y - 11 * s) + " l" + f1(-2 * s) + " " + f1(-6 * s) + " l" + f1(-2 * s) + " " + f1(1.5 * s) + " M" + f1(x + 14 * s) + " " + f1(y - 15 * s) + " l" + f1(2 * s) + " " + f1(-3 * s) + " M" + f1(x + 16 * s) + " " + f1(y - 11 * s) + " l" + f1(3 * s) + " " + f1(-5 * s) + '" stroke="#5A4A3A" stroke-width="' + f1(.6 * s) + '" fill="none"/>'; });
      o += '<g filter="url(#' + F.jemna + ')" opacity=".93">' + sob + '</g>';
      return o + ptaci(F, r, 2, 60, 70);
    },
    /* Gruzie (Svanetie): zasněžené štíty Kavkazu, vesnice s kamennými obrannými věžemi, louky */
    gruzie: function(F, r){
      const q = nahoda(F.sem + 401);
      let o = nebe(F, "#72A2DA", "#EEEAE0") + mraky(F, r, 2, 26, 56, 70);
      o += hory(F, r, [[-10, 110], [50, 70], [110, 40], [160, 76], [220, 50], [280, 84], [340, 56], [410, 90]], 150, "#B0BACC", "#76829E", 110, .25);
      o += pas(F, q, 154, .55, "#4E6E50") + hrebeny(F, [[170, 14, 60, 2.4, "#98B468", 0]]);
      const vy = vyska(200, 170, 14, 60, 2.4);
      o += vesnice(F, q, [[150, vy + 20, 20, 9, { typ: "sedlo", stena: "#B8AE98", bok: "#7E7666", strecha: "#6E6A68", okna: 1 }], [230, vy + 22, 22, 9, { typ: "sedlo", stena: "#C0B6A0", bok: "#7E7666", strecha: "#6E6A68", okna: 1 }], [276, vy + 16, 18, 8, { typ: "sedlo", stena: "#B8AE98", bok: "#7E7666", strecha: "#6E6A68", okna: 1 }]]);
      [[172, vy + 18, 11, 48], [206, vy + 22, 12, 56], [256, vy + 20, 10, 44], [300, vy + 14, 10, 40]].forEach(function(v){ o += strazni(F, v[0], v[1], v[2], v[3], 1, { stena: "#C4BAA4", strecha: "#6E6A68" }); });
      o += hrebeny(F, [[222, 5, 70, 4, "#8AB05A", 0]]);
      return o + trava(F, r, 150, 222, 254, ["#557F38", "#78A04A", "#46692E"]) + kvety(F, r, 30, 226, 252, ["#F4F0E4", "#E8D56A", "#D05A8A", "#8E7FC8"], 1);
    },
    /* Arménie: zasněžená sopka nad náhorní plošinou, kamenný kostel s kuželovou střechou, meruňkové sady */
    armenie: function(F, r){
      const q = nahoda(F.sem + 409);
      let o = nebe(F, "#78AADE", "#F4E8D4") + rasy(F, r, 3, 12, 40);
      o += hory(F, r, [[-10, 150], [60, 140], [140, 100], [190, 70], [206, 64], [224, 66], [260, 90], [320, 128], [410, 146]], 150, "#B8B4C4", "#7E7A94", 110, .06);
      o += hrebeny(F, [[152, 4, 80, 1, "#B8A878", .2], [172, 8, 60, 2.6, "#B4A870", 0]]);
      o += skalka(F, 120, 176, 40, 20, "#B89A7E") + armensky(F, q, 96, 178, 1.3, "#C8977A");
      for (let i = 0; i < 8; i++) { const x = 190 + i * 28 + q() * 8, y = 200 + (i % 2) * 12; o += strom(F, q, x, y, 1.1, "#6E8A44"); let pl = ""; for (let k = 0; k < 7; k++) pl += '<circle cx="' + f1(x + (q() - .5) * 12) + '" cy="' + f1(y - 18 + (q() - .5) * 8) + '" r=".9"/>'; o += '<g fill="#E8943A" opacity=".85">' + pl + '</g>'; }
      o += hrebeny(F, [[226, 4, 70, 4, "#A8A868", 0]]);
      return o + trava(F, r, 120, 226, 254, ["#8A8A48", "#A8A060", "#6E7A3E"]) + kvety(F, r, 18, 230, 252, ["#D23A2B", "#F4F0E4"], 1);
    },
    /* Ázerbájdžán: horské městečko s kamennými domy a dřevěnými pavlačemi, mešita s kupolí, sady */
    azerbajdzan: function(F, r){
      const q = nahoda(F.sem + 419);
      let o = nebe(F, "#7EAADC", "#F2E8D2") + mraky(F, r, 3, 26, 60, 70);
      o += hory(F, r, [[-10, 120], [70, 80], [150, 104], [230, 70], [310, 96], [410, 84]], 150, "#A8B0C4", "#727C98", 96, .12);
      o += pas(F, q, 152, .55, "#4E6E50") + hrebeny(F, [[176, 10, 70, 2.2, "#98B468", 0]]);
      const ob = { typ: "valba", stena: "#D8C8AC", bok: "#9A8A70", strecha: "#B8603E", patra: 2, okna: 3, hrazdi: "#6A4A36", rh: 6 };
      o += vesnice(F, q, [[40, 196, 26, 14, ob], [74, 200, 22, 12, ob], [270, 198, 24, 13, ob], [300, 202, 24, 13, ob], [334, 196, 22, 12, ob]]);
      o += mesita(F, q, 130, 196, 1, { stena: "#D8C4A0", kupole: "#6E8A9A", minarety: [[-4, 1]], vyska: 38, male: false });
      o += hrebeny(F, [[222, 5, 70, 4, "#8AB05A", 0]]);
      for (let i = 0; i < 5; i++) o += strom(F, q, 20 + i * 90 + q() * 20, 244, 1.4, "#5E8A44");
      return o + trava(F, r, 120, 226, 254, ["#557F38", "#78A04A"]);
    },
    /* Čečensko: hluboká soutěska, kamenné bojové věže se stupňovitou střechou, bystřina */
    cecensko: function(F, r){
      const q = nahoda(F.sem + 421);
      let o = nebe(F, "#7AA8DA", "#F0EAE0") + mraky(F, r, 2, 24, 50, 70);
      o += hory(F, r, [[-10, 90], [60, 60], [140, 96], [200, 120], [260, 94], [340, 54], [410, 80]], 190, "#9AA2A0", "#626E6A", 80, .2);
      o += hrebeny(F, [[176, 6, 50, 1, "#7E9E62", .2]]);
      const L = "M-10 256 L-10 140 Q60 130 120 160 Q160 190 170 256 Z", P = "M240 256 Q250 190 290 162 Q350 130 420 140 L420 256 Z";
      [L, P].forEach(function(d){ o += kryt(F, d) + vrstva(F, d, "#8CAE62", "#4E7A42", .9); });
      o += strazni(F, 50, 152, 12, 60, 1.1, { stena: "#B8AE98", jehlan: true }) + strazni(F, 300, 166, 10, 50, 1, { stena: "#C0B6A0", jehlan: true }) + strazni(F, 340, 158, 9, 40, .9, { stena: "#B8AE98", jehlan: true });
      o += dum(F, q, 72, 164, 20, 10, { typ: "plocha", stena: "#B8AE98", bok: "#7E7666", okna: 1 });
      o += voda(F, r, "M180 256 Q176 220 196 196 Q206 184 214 196 Q230 220 240 256 Z", "#C4D8E4", "#8EAEC4", 190, 252, 6);
      return o + trava(F, r, 100, 226, 254, ["#557F38", "#78A04A"]);
    },
    /* Osetie: horské údolí, vesnice plochých kamenných domů na svahu, kamenná věž, ovce */
    osetie: function(F, r){
      const q = nahoda(F.sem + 431);
      let o = nebe(F, "#78A6DA", "#F0EAE0") + mraky(F, r, 3, 24, 56, 80);
      o += hory(F, r, [[-10, 100], [80, 56], [160, 90], [240, 66], [320, 94], [410, 70]], 160, "#B4BCCA", "#7A849E", 100, .15);
      const sv = "M-10 256 L-10 150 Q120 140 240 156 Q330 164 420 156 L420 256 Z";
      o += kryt(F, sv) + vrstva(F, sv, "#A8AE72", "#7A8A52", .9);
      const dm = []; for (let rada = 0; rada < 3; rada++) for (let i = 0; i < 5; i++) dm.push([30 + i * 34 + rada * 10 + q() * 6, 162 + rada * 12 + i * 3, 20 + q() * 6, 9 + q() * 3, { typ: "plocha", stena: q() < .5 ? "#C4B8A0" : "#B0A48C", bok: "#7A7060", okna: 2, dvere: q() < .6 }]);
      o += vesnice(F, q, dm) + strazni(F, 200, 184, 11, 46, 1, { stena: "#BCB29C", strecha: "#6E6A68" });
      let ovce = ""; for (let i = 0; i < 10; i++) { const x = 220 + q() * 180, y = 206 + q() * 40, s2 = .9 + (y - 206) / 30; ovce += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3 * s2) + '" ry="' + f1(2 * s2) + '" fill="#F2EEE4"/><circle cx="' + f1(x + 2.8 * s2) + '" cy="' + f1(y - .5) + '" r="' + f1(.9 * s2) + '" fill="#3A3A3A"/>'; }
      return o + '<g filter="url(#' + F.jemna + ')">' + ovce + '</g>' + trava(F, r, 110, 222, 254, ["#8A8A48", "#A8A060", "#6E7A3E"]);
    },
    /* Abcházie: subtropické pobřeží Černého moře, palmy a eukalypty pod horami, čajové svahy, domy s verandami */
    abchazie: function(F, r){
      const q = nahoda(F.sem + 433);
      let o = nebe(F, "#78AEE0", "#F2EAD6") + mraky(F, r, 3, 26, 60, 80);
      o += hory(F, r, [[-10, 100], [60, 70], [140, 96], [220, 60], [300, 90], [410, 76]], 140, "#9AAEC0", "#66789A", 90, .12);
      o += pas(F, q, 144, .55, "#3E6A48");
      o += voda(F, r, "M-10 196 Q200 186 420 192 L420 256 L-10 256 Z", "#5EA0C8", "#1E6A94", 198, 250, 18);
      const bř = "M-10 200 Q200 184 420 192 L420 150 Q200 148 -10 152 Z";
      o += kryt(F, bř) + vrstva(F, bř, "#8CB460", "#5E8A44", .9);
      for (let i = 0; i < 8; i++) o += radaKeru(F, q, 156 + i * 4, 3, 60, 1 + i * .1, .5 + i * .05, "#3E7A3A");
      o += vesnice(F, q, [[120, 190, 26, 11, { typ: "valba", stena: "#FBF8F0", strecha: "#B8603E", patra: 2, okna: 3, okenice: "#3E7A9A", rh: 6 }], [170, 188, 22, 10, { typ: "valba", stena: "#F2EAD8", strecha: "#B8603E", patra: 2, okna: 2, rh: 6 }]]);
      [[40, 200, .9], [70, 196, 1.1], [240, 196, 1], [360, 194, 1.2], [390, 198, .9]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2] * .8, "#3F7A3E"); });
      return o + ptaci(F, r, 3, 280, 60);
    },
    /* Kurdistán: terasovitá horská vesnice z plochých kamenných domů, střecha jednoho je dvorkem druhého, suché hory */
    kurdistan: function(F, r){
      const q = nahoda(F.sem + 439);
      let o = nebe(F, "#7AAADC", "#F4E6CC") + rasy(F, r, 3, 12, 36);
      o += hory(F, r, [[-10, 100], [70, 60], [150, 88], [230, 50], [310, 80], [410, 64]], 150, "#B8AA94", "#806E60", 70, .15);
      const sv = "M-10 256 L-10 110 Q120 100 240 120 Q340 140 420 150 L420 256 Z";
      o += kryt(F, sv) + vrstva(F, sv, "#B8A882", "#8A7A58", .9);
      const dm = []; for (let rada = 0; rada < 6; rada++) for (let i = 0; i < 7; i++) dm.push([10 + i * 36 + rada * 16 + q() * 6, 118 + rada * 16 + i * 1.5, 26 + q() * 8, 10 + q() * 3, { typ: "plocha", stena: ["#D2C0A0", "#C4B090", "#DCCCB0"][Math.floor(q() * 3)], bok: "#8A7A60", okna: 2, okno: "#3E3A40", dvere: q() < .5, d: 10 }]);
      o += vesnice(F, q, dm);
      for (let i = 0; i < 6; i++) o += strom(F, q, 30 + i * 70 + q() * 20, 236 + q() * 10, 1.3, "#6E8A44");
      return o;
    },
    /* Turecko: městečko s rudými střechami na svahu, mešita s kupolí a štíhlými minarety, anatolské kopce */
    turecko: function(F, r){
      const q = nahoda(F.sem + 443);
      let o = nebe(F, "#76AADE", "#F4E8D0") + rasy(F, r, 3, 12, 36) + mraky(F, r, 2, 40, 60, 70);
      o += hrebeny(F, [[118, 10, 70, 1, "#A8A8BE", .55], [140, 12, 60, 2.2, "#B8B078", .2]]);
      const dm = []; for (let rada = 0; rada < 4; rada++) for (let i = 0; i < 9; i++) { const x = -6 + i * 48 + rada * 12 + q() * 8; if (x > 150 && x < 250 && rada < 2) continue; dm.push([x, 172 + rada * 14 + (q() - .5) * 4, 20 + q() * 8, 10 + q() * 5, { typ: "valba", stena: ["#F4EEE2", "#EADCC0", "#F0E4CC"][Math.floor(q() * 3)], strecha: ["#B8543A", "#C4603E"][Math.floor(q() * 2)], patra: 2, okna: 2, rh: 5, dvere: false }]); }
      o += vesnice(F, q, dm.slice(0, 16)) + mesita(F, q, 168, 186, 1.3, { stena: "#EAE2D0", kupole: "#8A94A8", vrch: "#6E7888", minarety: [[-8, 1.2], [60, 1.2]], vyska: 44 }) + vesnice(F, q, dm.slice(16));
      return o + ptaci(F, r, 3, 60, 60);
    },
    /* Izrael (hebrejština): pahorky s olivovníky, město z pískově světlého kamene s plochými střechami a klenbami, na obzoru poušť */
    izrael: function(F, r){
      const q = nahoda(F.sem + 449);
      let o = nebe(F, "#7EB0E2", "#F6EAD0") + rasy(F, r, 2, 12, 30);
      o += hrebeny(F, [[120, 8, 70, 1, "#C8B89A", .5], [140, 12, 60, 2.4, "#C8B48A", .2]]);
      const dm = []; for (let rada = 0; rada < 5; rada++) for (let i = 0; i < 8; i++) dm.push([60 + i * 36 + rada * 8 + q() * 6, 150 + rada * 12 + (q() - .5) * 3, 22 + q() * 8, 10 + q() * 5, { typ: "plocha", stena: ["#EEDFC0", "#E6D2AC", "#F2E6CC"][Math.floor(q() * 3)], bok: "#B09A76", patra: 2, okna: 3, okno: "#4A4640", dvere: false, d: 10 }]);
      o += vesnice(F, q, dm);
      [[130, 144], [260, 150]].forEach(function(k){ o += kupole(F, k[0], k[1], 12, "#C8B48A", "pul"); });
      o += hrebeny(F, [[214, 6, 70, 4, "#B8A870", 0]]);
      for (let i = 0; i < 5; i++) o += oliva(F, q, 30 + i * 84 + q() * 20, 236 + q() * 12, 1.3);
      return o + kvety(F, r, 18, 226, 252, ["#D23A2B", "#F4F0E4"], 1);
    },
    /* Persie: zahrada s dlouhým bazénem a cypřiši, portál íwán s modrými obklady a tyrkysovou kupolí, hory v poušti */
    persie: function(F, r){
      const q = nahoda(F.sem + 457);
      let o = nebe(F, "#7AAEE0", "#F6E6C8") + rasy(F, r, 2, 12, 30);
      o += hory(F, r, [[-10, 130], [80, 100], [170, 116], [260, 90], [340, 112], [410, 104]], 150, "#C8B4A0", "#907A6A", 104, .1);
      const zd = "M-10 256 L-10 150 L420 150 L420 256 Z";
      o += kryt(F, zd) + vrstva(F, zd, "#D8C4A0", "#B8A07A", .9);
      o += dum(F, q, 110, 168, 180, 22, { typ: "plocha", stena: "#E0CCA6", bok: "#A89070", okna: 8, okno: "#2E6A9A", dvere: false, d: 10 });
      o += nanes(F, mnoho([[188, 148], [222, 148], [222, 118], [188, 118]]), "#E0CCA6") + kupole(F, 205, 118, 40, "#3EA8B8", "perska") + iwan(F, 180, 170, 50, 46, 1, "#E0CCA6", "#2E7AB0");
      [[96, 176], [306, 176], [80, 196], [322, 196]].forEach(function(c){ o += cypris(F, q, c[0], c[1], 42); });
      o += voda(F, r, "M180 190 L230 190 L260 256 L150 256 Z", "#7EC0D8", "#3E8AB0", 192, 250, 6);
      let zah = ""; for (let i = 0; i < 40; i++) zah += '<circle cx="' + f1(q() < .5 ? 20 + q() * 120 : 270 + q() * 130) + '" cy="' + f1(210 + q() * 44) + '" r="' + f1(1 + q() * 1.4) + '" fill="' + ["#D84A5A", "#E8A0B0", "#F4E6D0"][i % 3] + '"/>';
      return o + koruny(F, q, -10, 150, 222, .8, "#4E8A44", .85, F.jemna) + koruny(F, q, 260, 420, 222, .8, "#4E8A44", .85, F.jemna) + '<g opacity=".9" filter="url(#' + F.jemna + ')">' + zah + '</g>';
    },
    /* Arábie: pouštní oáza s datlovníky, hliněné domy s plochými střechami a cimbuřím, minaret */
    arabie: function(F, r){
      const q = nahoda(F.sem + 461);
      let o = nebe(F, "#86B8E2", "#F8E6C4") + rasy(F, r, 2, 12, 30);
      o += duna(F, r, 146, 8, 60, 1, "#ECC48C", "#C08A58");
      const dm = []; for (let i = 0; i < 9; i++) dm.push([80 + i * 30 + q() * 6, 186 + (i % 3) * 6, 22 + q() * 8, 14 + q() * 10, { typ: "plocha", stena: ["#C89A6A", "#B8885A", "#D0A676"][Math.floor(q() * 3)], bok: "#8A5E3E", patra: 2, okna: 2, okno: "#3A2E26", d: 10 }]);
      o += vesnice(F, q, dm);
      let cim = ""; dm.forEach(function(d){ for (let k = 0; k < 4; k++) cim += mnoho([[d[0] + k * d[2] / 4, d[1] - d[3]], [d[0] + k * d[2] / 4 + d[2] / 8, d[1] - d[3]], [d[0] + k * d[2] / 4 + d[2] / 8, d[1] - d[3] - 2], [d[0] + k * d[2] / 4, d[1] - d[3] - 2]]); });
      o += nanes(F, cim, "#C89A6A") + minaret(F, 214, 176, 44, 1.2, { typ: "hranol", stena: "#D0A676" });
      [[40, 210, 1.1], [64, 204, .9], [330, 208, 1.2], [360, 212, .9], [388, 206, 1]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2], "#4E7A3A"); });
      return o + duna(F, r, 220, 8, 70, 4, "#EAB67A", "#B06C3C");
    },
    /* Afghánistán (paštština): vyprahlé hory, hliněná pevnost qala s nárožními věžemi, morušovníky a pole */
    afghanistan: function(F, r){
      const q = nahoda(F.sem + 463);
      let o = nebe(F, "#78AADE", "#F4E6CC") + rasy(F, r, 3, 12, 36);
      o += hory(F, r, [[-10, 110], [60, 70], [140, 96], [220, 56], [300, 90], [370, 70], [410, 84]], 160, "#C4B4A0", "#8A7866", 76, .2);
      o += hrebeny(F, [[166, 6, 70, 2, "#C8B088", 0]]);
      const qx = 150, qy = 206, zed = mnoho([[qx, qy], [qx + 90, qy], [qx + 90, qy - 20], [qx, qy - 20]]);
      o += kryt(F, zed, F.jemna) + vrstva(F, zed, "#C8A47A", "#A07A56", .95, F.jemna);
      [qx - 6, qx + 84].forEach(function(x){ const v = mnoho([[x, qy + 1], [x + 12, qy + 1], [x + 11, qy - 30], [x + 1, qy - 30]]); o += kryt(F, v, F.jemna) + vrstva(F, v, "#CCA880", "#9A7450", .95, F.jemna); });
      o += nanes(F, "M" + (qx + 40) + " " + qy + " l0 -10 q5 -5 10 0 l0 10 z", "#4A3426", .85);
      o += terasy(F, r, 214, 4, 8, 4, 70, 3, ["#9AB060", "#B8B070", "#88A456"], "#8A7050");
      for (let i = 0; i < 5; i++) o += strom(F, q, 20 + i * 90 + q() * 20, 232 + q() * 10, 1.3, "#6E8A44");
      return o;
    },
    /* Uzbekistán: město na Hedvábné stezce, tyrkysové kupole, minaret s ornamenty, hliněné domy, moruše */
    uzbekistan: function(F, r){
      const q = nahoda(F.sem + 467);
      let o = nebe(F, "#7AB0E2", "#F6E8CC") + rasy(F, r, 2, 12, 30);
      o += hrebeny(F, [[150, 3, 90, 1, "#C8B89A", .45], [160, 2, 90, 2, "#D8C49A", 0]]);
      const dm = []; for (let i = 0; i < 12; i++) dm.push([-6 + i * 36 + q() * 8, 206 + (i % 2) * 8, 26 + q() * 6, 10 + q() * 4, { typ: "plocha", stena: "#D8BC92", bok: "#A08058", okna: 2, dvere: q() < .5, d: 10 }]);
      o += dum(F, q, 110, 190, 160, 26, { typ: "plocha", stena: "#D4B288", bok: "#A07C56", okna: 7, okno: "#2E6A9A", dvere: false, d: 10 });
      o += kupole(F, 150, 164, 30, "#34A8B8", "perska") + kupole(F, 250, 164, 24, "#34A8B8", "perska") + iwan(F, 180, 190, 44, 50, 1, "#D4B288", "#2E78B8");
      o += minaret(F, 300, 190, 70, 2, { typ: "banka", stena: "#D0AC82", vrch: "#C8A070", pasy: "#2E8AB0" });
      o += vesnice(F, q, dm);
      return o + strom(F, q, 40, 248, 1.6, "#5E8A44") + strom(F, q, 380, 250, 1.5, "#5E8A44");
    },
    /* Ujgursko: oáza pod pouští a horami, řady topolů, hliněné domy, mešita se zelenou kupolí, vinná réva */
    ujgursko: function(F, r){
      const q = nahoda(F.sem + 479);
      let o = nebe(F, "#86B4E0", "#F6E6C6") + rasy(F, r, 2, 12, 30);
      o += hory(F, r, [[-10, 120], [80, 94], [160, 110], [250, 80], [330, 104], [410, 90]], 146, "#C8C0C8", "#8E8698", 100, .1);
      o += duna(F, r, 146, 5, 70, 1, "#E8C48E", "#C09058");
      for (let i = 0; i < 12; i++) { const x = 10 + i * 34; o += cypris(F, q, x, 190, 50).replace(/#4E6E48/g, "#6E8E4A").replace(/#2A4030/g, "#4E6A3A"); }
      o += mesita(F, q, 150, 204, 1, { stena: "#D8C09A", kupole: "#3E8A5A", minarety: [[-4, 1], [48, 1]], minaret: "hranol", stenaMin: "#D0B690", vyska: 36 });
      o += vesnice(F, q, [[40, 214, 30, 11, { typ: "plocha", stena: "#D0B088", bok: "#9A7A56", okna: 2, d: 10 }], [300, 216, 34, 12, { typ: "plocha", stena: "#D8BC92", bok: "#9A7A56", okna: 3, d: 10 }]]);
      let vin = ""; for (let rada = 0; rada < 4; rada++) for (let x = -8; x < 420; x += 7) vin += '<ellipse cx="' + f1(x + (q() - .5) * 2) + '" cy="' + f1(232 + rada * 6) + '" rx="' + f1(3 + rada * .4) + '" ry="2" fill="' + mix("#5E8A3A", "#B4C050", q() * .4) + '"/>';
      return o + '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + vin + '</g>';
    },
    /* Sindh: široký Indus s loďkami, rovina, hliněná vesnice s větrnými lapači, hrobky s kupolemi, datlovníky */
    sindh: function(F, r){
      const q = nahoda(F.sem + 487);
      let o = nebe(F, "#82B0DC", "#F6E4C2") + rasy(F, r, 2, 12, 30) + slunce(F, 320, 110, 12, "#F0A860");
      o += hrebeny(F, [[146, 2, 90, 1, "#C8B08A", .4]]);
      o += voda(F, r, "M-10 176 Q200 168 420 174 L420 214 Q200 206 -10 216 Z", "#A8C0C8", "#6E8EA0", 178, 212, 12);
      [[80, 196, 1], [250, 190, .8]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 20 * s) + " " + f1(y - 5 * s) + " L" + f1(x + 20 * s) + " " + f1(y - 7 * s) + " Q" + f1(x + 14 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 14 * s) + " " + f1(y + 2 * s) + " " + f1(x - 20 * s) + " " + f1(y - 5 * s) + " Z", "#8A6A4A", "#5A4232", .95, F.jemna) + nanes(F, "M" + f1(x) + " " + f1(y - 6 * s) + " l0 " + f1(-24 * s) + " l" + f1(14 * s) + " " + f1(20 * s) + " z", "#E8DCC0", .95); });
      const pr = "M-10 256 L-10 158 Q200 150 420 160 L420 176 Q200 168 -10 178 Z";
      o += kryt(F, pr) + vrstva(F, pr, "#C8B080", "#A89060", .9);
      o += vesnice(F, q, [[40, 172, 22, 10, { typ: "plocha", stena: "#C8A47A", bok: "#8A6A4A", okna: 1, d: 8 }], [68, 170, 18, 9, { typ: "plocha", stena: "#D0AC82", bok: "#8A6A4A", okna: 1, d: 8 }], [300, 172, 22, 10, { typ: "plocha", stena: "#C8A47A", bok: "#8A6A4A", okna: 1, d: 8 }]]);
      [[48, 162], [74, 161], [308, 162]].forEach(function(v){ o += nanes(F, mnoho([[v[0], v[1]], [v[0] + 5, v[1]], [v[0] + 5, v[1] - 8], [v[0] - 1, v[1] - 10]]), "#B89068"); });
      o += dum(F, q, 150, 172, 20, 12, { typ: "plocha", stena: "#E8D8B8", bok: "#A89070", okna: 1, d: 8 }) + kupole(F, 162, 160, 16, "#E8DCC4", "pul");
      [[120, 168, 1], [210, 166, .9], [370, 168, 1.1]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2] * .8, "#4E7A3A"); });
      const bh = "M-10 256 L-10 222 Q200 212 420 220 L420 256 Z";
      return o + kryt(F, bh) + vrstva(F, bh, "#C8B080", "#A08858", .9) + trava(F, r, 100, 226, 254, ["#9A9050", "#B0A060"]);
    },
    /* Ganga (hindština): kamenné ghaty sestupující k řece, chrámy s věžemi šikhara, loďky, měkké ranní světlo */
    ganga: function(F, r){
      const q = nahoda(F.sem + 503);
      let o = nebe(F, "#8EB2D8", "#F6DCC0") + slunce(F, 330, 110, 12, "#F0A060") + rasy(F, r, 3, 20, 70);
      o += hrebeny(F, [[150, 1, 90, 1, "#D8C8A0", .3]]) + koruny(F, q, 250, 420, 152, .3, mix("#6E8A5A", F.opar, .4), .7, F.jemna);
      o += voda(F, r, "M-10 156 L420 156 L420 256 L-10 256 Z", "#C8C8C0", "#8EA0A8", 160, 250, 18);
      const g = "M-10 186 L-10 110 L240 116 Q300 130 330 186 Z";
      o += kryt(F, g) + vrstva(F, g, "#D8BE98", "#B89870", .9);
      let sch = ""; for (let i = 0; i < 12; i++) sch += tah("M-10 " + f1(150 + i * 2.8) + " L" + f1(280 - i * 1.5) + " " + f1(150 + i * 2.8), i % 2 ? "#A88A64" : "#EAD6B4", .8, .6);
      o += skupina(F, F.stetec, sch);
      o += vesnice(F, q, [[0, 150, 30, 30, { typ: "plocha", stena: "#E8C8A0", bok: "#A88660", patra: 3, okna: 3, d: 10 }], [60, 148, 26, 26, { typ: "plocha", stena: "#EED6B0", bok: "#A88660", patra: 3, okna: 3, d: 10 }], [190, 150, 30, 24, { typ: "plocha", stena: "#E0B890", bok: "#A07850", patra: 2, okna: 3, d: 10 }], [230, 152, 34, 30, { typ: "plocha", stena: "#F0DCBC", bok: "#A88660", patra: 3, okna: 4, d: 10 }]]);
      o += sikhara(F, 116, 150, 1.4, "#E6B88A") + sikhara(F, 158, 150, 1, "#EAC8A0");
      [[90, 214, 1.2], [200, 230, 1.5], [340, 208, 1]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 16 * s) + " " + f1(y - 5 * s) + " L" + f1(x + 16 * s) + " " + f1(y - 6 * s) + " Q" + f1(x + 11 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 11 * s) + " " + f1(y + 2 * s) + " " + f1(x - 16 * s) + " " + f1(y - 5 * s) + " Z", "#6E5A48", "#4A3A2E", .95, F.jemna) + nanes(F, "M" + f1(x - 8 * s) + " " + f1(y - 5 * s) + " l0 " + f1(-5 * s) + " l" + f1(12 * s) + " 0 l0 " + f1(5 * s) + " z", "#C8402E", .85); });
      let kv = ""; for (let i = 0; i < 24; i++) kv += '<circle cx="' + f1(q() * 280) + '" cy="' + f1(186 + q() * 30) + '" r="1.2" fill="' + ["#E8902E", "#F0B830"][i % 2] + '"/>';
      return o + '<g opacity=".85" filter="url(#' + F.jemna + ')">' + kv + '</g>';
    },
    /* Bengálsko: zelená delta, řeka s plachetnicemi, doškové chýše s prohnutou střechou, banánovníky a palmy */
    bengalsko: function(F, r){
      const q = nahoda(F.sem + 509);
      let o = nebe(F, "#86B0DC", "#F2EAD4") + mraky(F, r, 4, 26, 76, 90);
      o += hrebeny(F, [[148, 2, 90, 1, "#8EAE70", .4]]) + koruny(F, q, -10, 410, 150, .4, mix("#5E8A46", F.opar, .3), .8, F.jemna);
      o += voda(F, r, "M-10 156 Q200 150 420 158 L420 196 Q200 186 -10 200 Z", "#B0C8D4", "#7E9EB0", 158, 196, 12);
      [[120, 180, 1], [300, 172, .8]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 18 * s) + " " + f1(y - 4 * s) + " L" + f1(x + 18 * s) + " " + f1(y - 6 * s) + " Q" + f1(x + 12 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 12 * s) + " " + f1(y + 2 * s) + " " + f1(x - 18 * s) + " " + f1(y - 4 * s) + " Z", "#6E5A40", "#4A3A2A", .95, F.jemna) + nanes(F, "M" + f1(x - 2 * s) + " " + f1(y - 5 * s) + " l0 " + f1(-26 * s) + " q" + f1(14 * s) + " " + f1(8 * s) + " " + f1(12 * s) + " " + f1(24 * s) + " z", "#E8D4B0", .95); });
      const br = "M-10 256 L-10 198 Q200 186 420 196 L420 256 Z";
      o += kryt(F, br) + vrstva(F, br, "#9CC064", "#6E9A46", .9);
      /* chýše s prohnutou doškovou střechou (bangla) */
      [[60, 222, 1.2], [110, 226, 1], [300, 220, 1.3]].forEach(function(h){ const x = h[0], y = h[1], s = h[2], w = 26 * s;
        o += dum(F, q, x, y, w, 10 * s, { typ: "plocha", stena: "#D8B888", bok: "#9A7A56", okna: 1, d: 10 * s });
        const st = "M" + f1(x - 4 * s) + " " + f1(y - 9 * s) + " Q" + f1(x + w / 2) + " " + f1(y - 26 * s) + " " + f1(x + w + 4 * s) + " " + f1(y - 9 * s) + " Q" + f1(x + w / 2) + " " + f1(y - 13 * s) + " " + f1(x - 4 * s) + " " + f1(y - 9 * s) + " Z";
        o += kryt(F, st, F.jemna) + vrstva(F, st, "#C8A868", "#8A6A3A", .95, F.jemna); });
      [[20, 226, .9], [170, 224, 1.1], [360, 222, 1]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2] * .8, "#3F7A3E"); });
      for (let i = 0; i < 3; i++) { const x = 220 + i * 18; o += skupina(F, F.stetec, tah("M" + x + " 244 l0 -16", "#6E7A48", 2, .9)); [-2.2, -1.6, -1, -.5].forEach(function(u){ o += list(F, x, 230, 14 + q() * 4, u, "#5E9A48"); }); }
      return o + trava(F, r, 100, 232, 254, ["#5F8A3A", "#7EA04A"]);
    },
    /* Mughalská zahrada (urdština): bílá kupole s pavilonky čhatrí a minarety, červený pískovec, vodní kanál, cypřiše */
    mughal: function(F, r){
      const q = nahoda(F.sem + 521);
      let o = nebe(F, "#86B4E0", "#F6E6CC") + rasy(F, r, 2, 12, 30);
      o += hrebeny(F, [[150, 2, 90, 1, "#C8B89A", .4]]);
      const zd = "M-10 256 L-10 158 L420 158 L420 256 Z";
      o += kryt(F, zd) + vrstva(F, zd, "#A8C07A", "#7EA058", .9);
      /* mešita z rudého pískovce se třemi bílými mramorovými kupolemi a minarety v nárožích */
      o += dum(F, q, 100, 180, 200, 12, { typ: "plocha", stena: "#B85E42", bok: "#8A4430", okna: 9, okno: "#5A2A20", dvere: false, d: 8 });
      o += dum(F, q, 140, 170, 120, 26, { typ: "plocha", stena: "#B85E42", bok: "#8A4430", okna: 4, okno: "#5A2A20", dvere: false, d: 10 }) + iwan(F, 186, 170, 28, 34, 1, "#B85E42", "#E8DCCC");
      o += kupole(F, 200, 142, 34, "#F2EEE6", "perska") + kupole(F, 160, 144, 22, "#F2EEE6", "perska") + kupole(F, 240, 144, 22, "#F2EEE6", "perska");
      [104, 296].forEach(function(x){ o += minaret(F, x, 182, 56, 1.3, { typ: "banka", stena: "#B85E42", vrch: "#F2EEE6", pasy: "#F2EEE6" }); });
      o += voda(F, r, "M190 180 L210 180 L236 256 L164 256 Z", "#8EC0DC", "#4E8AB0", 182, 250, 5);
      [[150, 196, 36], [250, 196, 36], [120, 220, 46], [280, 220, 46]].forEach(function(c){ o += cypris(F, q, c[0], c[1], c[2]); });
      let zah = ""; for (let i = 0; i < 50; i++) zah += '<circle cx="' + f1(q() < .5 ? q() * 150 : 250 + q() * 170) + '" cy="' + f1(200 + q() * 54) + '" r="' + f1(1 + q() * 1.3) + '" fill="' + ["#D84A5A", "#E8A040", "#F4E6D0"][i % 3] + '"/>';
      return o + '<g opacity=".9" filter="url(#' + F.jemna + ')">' + zah + '</g>';
    },
    /* Paňdžáb: zlatá pšenice a žlutá hořčice, bílá gurdvára se zlatou kupolí, vesnice, zavlažovací kanál */
    pandzab: function(F, r){
      const q = nahoda(F.sem + 523);
      let o = nebe(F, "#82B0DE", "#F6E8C8") + mraky(F, r, 3, 30, 70, 90);
      o += hrebeny(F, [[146, 2, 90, 1, "#9AAA80", .45]]) + koruny(F, q, -10, 410, 150, .35, mix("#5E8A46", F.opar, .35), .75, F.jemna);
      o += dum(F, q, 240, 160, 44, 14, { typ: "plocha", stena: "#FBFAF6", bok: "#C8CCD8", okna: 4, okno: "#8A7040", d: 10 }) + kupole(F, 264, 146, 22, "#E0B040", "perska");
      [[244, 146], [282, 146]].forEach(function(c){ o += kupole(F, c[0], c[1], 7, "#E0B040", "perska"); });
      o += vesnice(F, q, [[60, 160, 22, 9, { typ: "plocha", stena: "#D8BC92", bok: "#9A7A56", okna: 1, d: 8 }], [90, 162, 20, 8, { typ: "plocha", stena: "#E0C8A0", bok: "#9A7A56", okna: 1, d: 8 }]]);
      o += pole(F, q, 160, 200, ["#E0C050", "#D8B848", "#E8D060", "#A8C064", "#E8C858"], false);
      let hor = ""; for (let i = 0; i < 90; i++) { const y = 200 + Math.pow(q(), .7) * 56, x = q() * 180, s2 = .4 + (y - 200) / 40; hor += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(1.3 * s2) + '" fill="' + ["#F2D020", "#E8C010"][i % 2] + '"/>'; }
      o += '<g opacity=".9" filter="url(#' + F.jemna + ')">' + hor + '</g>';
      return o + voda(F, r, "M300 256 L318 170 L322 170 L330 256 Z", "#A8C8DC", "#6E9AB8", 172, 250, 3) + trava(F, r, 120, 214, 254, ["#C8A840", "#B89830", "#D8B850"]);
    },
    /* Kač (gudžarátština): bílá solná pláň, kulaté hliněné chýše bhunga s bíle malovanými ornamenty */
    kutch: function(F, r){
      const q = nahoda(F.sem + 541);
      let o = nebe(F, "#8AB6E0", "#F6E8D0") + rasy(F, r, 2, 12, 30);
      const sul = "M-10 256 L-10 150 L420 150 L420 256 Z";
      o += kryt(F, sul) + nanes(F, sul, "#F6F4EC", .97, F.lazura);
      let pr = ""; for (let i = 0; i < 40; i++) { const y = 152 + Math.pow(q(), 1.5) * 100, x = q() * W, w = 10 + (y - 150) * .6; pr += tah("M" + f1(x) + " " + f1(y) + " l" + f1(w) + " " + f1((q() - .5) * 2), "#D8D4CC", .5, .6); }
      o += skupina(F, F.stetec, pr);
      [[80, 180, 1.1], [120, 176, .9], [160, 182, 1.2]].forEach(function(h){ const x = h[0], y = h[1], s = h[2];
        o += chyse(F, q, x, y, s * 1.4).replace(/#D6A87C/g, "#F2EAD8").replace(/#A8784E/g, "#C8B89A");
        let orn = ""; for (let k = 0; k < 7; k++) orn += '<circle cx="' + f1(x - 8 * s + k * 2.6 * s) + '" cy="' + f1(y - 5 * s) + '" r="' + f1(.6 * s) + '" fill="' + ["#C8402E", "#2E6AB0", "#E8A030"][k % 3] + '"/>';
        o += '<g opacity=".85">' + orn + '</g>'; });
      o += akacie(F, q, 300, 178, .7) + akacie(F, q, 350, 172, .5);
      return o + ptaci(F, r, 5, 230, 60);
    },
    /* Dekkán (maráthština): stolové čedičové hory se stupni, hradby horské pevnosti, suché pole, banyán */
    dekkan: function(F, r){
      const q = nahoda(F.sem + 547);
      let o = nebe(F, "#7EAEDE", "#F4E6C8") + mraky(F, r, 3, 26, 64, 80);
      const pl = "M-10 170 L20 130 L60 118 L150 116 L190 136 L220 134 L240 112 L340 108 L380 126 L420 130 L420 170 Z";
      o += kryt(F, pl) + vrstva(F, pl, "#8A8A78", "#5E6258", .9);
      let st = ""; for (let i = 1; i < 5; i++) st += tah("M20 " + f1(130 + i * 8) + " L" + f1(190 + i * 6) + " " + f1(130 + i * 8) + " M240 " + f1(112 + i * 10) + " L" + f1(390 + i * 6) + " " + f1(112 + i * 10), "#4E524A", .6, .45);
      o += skupina(F, F.stetec, st);
      let hr = ""; for (let x = 244; x < 340; x += 5) hr += mnoho([[x, 110], [x + 3, 110], [x + 3, 106], [x, 106]]);
      o += nanes(F, mnoho([[244, 112], [340, 108], [340, 104], [244, 108]]) + hr, "#8A8070") + nanes(F, "M286 108 l0 -8 q3 -3 6 0 l0 8 z", "#8A8070");
      o += hrebeny(F, [[170, 4, 80, 2, "#B8A870", 0]]) + pole(F, q, 176, 200, ["#C8B070", "#B8A060", "#A8B068", "#D0B878"], false);
      o += strom(F, q, 330, 236, 2.4, "#4E7A3E") + skupina(F, F.stetec, tah("M320 236 l-2 -20 M340 236 l2 -18 M312 236 l-4 -14", "#6A5A48", .8, .8));
      return o + sikhara(F, 120, 190, .8, "#E0C8A0");
    },
    /* Tibet: vysoká náhorní plošina, bílý klášter s rudým pásem pod štíty, čhorten, modlitební praporky, jaci */
    tibet: function(F, r){
      const q = nahoda(F.sem + 557);
      let o = nebe(F, "#4E8AD8", "#E8EEF4") + rasy(F, r, 3, 10, 30);
      o += hory(F, r, [[-10, 110], [70, 70], [150, 96], [230, 56], [310, 90], [410, 74]], 146, "#C8CCD8", "#8A92AA", 120, .15);
      const pl = "M-10 256 L-10 146 L420 146 L420 256 Z";
      o += kryt(F, pl) + vrstva(F, pl, "#C8B888", "#A89868", .9);
      const kl = [[150, 170, 60, 26], [196, 160, 40, 34], [120, 178, 30, 18]];
      kl.forEach(function(k){ o += dum(F, q, k[0], k[1], k[2], k[3], { typ: "plocha", stena: "#FBFAF6", bok: "#C8CCD8", patra: 2, okna: Math.round(k[2] / 10), okno: "#3A2A24", dvere: false, d: 12 }); o += nanes(F, mnoho([[k[0], k[1] - k[3]], [k[0] + k[2], k[1] - k[3]], [k[0] + k[2], k[1] - k[3] + 4], [k[0], k[1] - k[3] + 4]]), "#9A2E24"); });
      o += nanes(F, "M208 126 l16 0 l-4 -6 l-8 0 z", "#D8A840") + stupa(F, 290, 190, .8) + praporky(F, 240, 150, 330, 170, 1) + praporky(F, 60, 170, 130, 150, 1);
      let jaci = ""; [[60, 214, 1.4], [96, 222, 1.6], [340, 222, 1.5]].forEach(function(k){ const x = k[0], y = k[1], s = k[2];
        jaci += '<path d="M' + f1(x) + " " + f1(y) + " l" + f1(1 * s) + " " + f1(-8 * s) + " q" + f1(6 * s) + " " + f1(-3 * s) + " " + f1(12 * s) + " 0 l" + f1(3 * s) + " " + f1(1 * s) + " l" + f1(1 * s) + " " + f1(4 * s) + " l" + f1(-2 * s) + " " + f1(1 * s) + " l0 " + f1(4 * s) + " l" + f1(-1.4 * s) + " 0 l0 " + f1(-3 * s) + " l" + f1(-10 * s) + " 0 l" + f1(-.8 * s) + " " + f1(3 * s) + ' z" fill="#3A302A"/><path d="M' + f1(x + 15 * s) + " " + f1(y - 8 * s) + " q" + f1(2 * s) + " " + f1(-3 * s) + " " + f1(4 * s) + " " + f1(-2 * s) + '" stroke="#E8E0D0" stroke-width="' + f1(.6 * s) + '" fill="none"/>'; });
      return o + '<g filter="url(#' + F.jemna + ')" opacity=".93">' + jaci + '</g>' + trava(F, r, 80, 220, 254, ["#9A9050", "#B0A060"]);
    },
    /* Bhútán (dzongkha): pevnost dzong s bílými svahovitými zdmi, rudým pásem a zlatými střechami, rýžové terasy, borovice, praporky */
    bhutan: function(F, r){
      const q = nahoda(F.sem + 563);
      let o = nebe(F, "#7AA8DC", "#EEEAE0") + mraky(F, r, 3, 26, 60, 80);
      o += hory(F, r, [[-10, 100], [60, 60], [140, 84], [220, 50], [300, 76], [410, 64]], 150, "#8EA696", "#5E766A", 70, .15);
      o += pas(F, q, 150, .55, "#3E6044") + terasy(F, r, 176, 6, 7, 10, 50, 2, ["#A8C468", "#C4C472", "#8EB458"], "#6E7A3A");
      const dz = mnoho([[130, 176], [270, 176], [264, 140], [136, 140]]);
      o += kryt(F, dz, F.jemna) + nanes(F, dz, "#FBFAF6") + laz(F, mnoho([[230, 176], [270, 176], [264, 140], [230, 140]]), "#A8ACC0", .35) + nanes(F, mnoho([[136, 140], [264, 140], [264, 134], [136, 134]]), "#9A2E24");
      let ok = ""; for (let i = 0; i < 8; i++) ok += mnoho([[146 + i * 15, 158], [152 + i * 15, 158], [152 + i * 15, 150], [146 + i * 15, 150]]); o += nanes(F, ok, "#5A3A2A", .85);
      const utse = mnoho([[180, 134], [220, 134], [220, 110], [180, 110]]);
      o += kryt(F, utse, F.jemna) + nanes(F, utse, "#FBFAF6") + nanes(F, mnoho([[180, 114], [220, 114], [220, 110], [180, 110]]), "#9A2E24");
      [[130, 134, 140, 12], [174, 110, 52, 10]].forEach(function(s2){ const x = s2[0], y = s2[1], w = s2[2], d = "M" + f1(x - 6) + " " + f1(y - 2) + " Q" + f1(x + w * .15) + " " + f1(y) + " " + f1(x + w * .2) + " " + f1(y - s2[3]) + " L" + f1(x + w * .8) + " " + f1(y - s2[3]) + " Q" + f1(x + w * .85) + " " + f1(y) + " " + f1(x + w + 6) + " " + f1(y - 2) + " Z"; o += kryt(F, d, F.jemna) + vrstva(F, d, "#E8C050", "#B08A2A", .95, F.jemna); });
      o += praporky(F, 20, 200, 110, 220, 1) + praporky(F, 300, 206, 400, 196, 1);
      [[40, 240, 1.6], [370, 244, 1.8]].forEach(function(t){ o += jehlicnan(F, q, t[0], t[1], t[2], "#2F4B3A"); });
      return o + trava(F, r, 80, 226, 254, ["#557F38", "#78A04A"]);
    },
    /* Srí Lanka (sinhálština): čajové svahy v mlze, bílá dagoba na návrší, kokosové palmy */
    srilanka: function(F, r){
      const q = nahoda(F.sem + 569);
      let o = nebe(F, "#8EB6DA", "#F0ECDC") + mraky(F, r, 3, 30, 64, 70);
      o += hrebeny(F, [[112, 14, 50, 1, "#8EA2B4", .6], [130, 10, 40, 2.5, "#7FA27A", .4]]) + mlha(F, 124, 144, .5);
      o += skalka(F, 290, 144, 40, 16, "#8EAE62") + stupa(F, 290, 146, 1.1);
      o += duna(F, r, 152, 8, 60, 1.5, "#A8CC78", "#7EA456").replace(/stroke="#FFF6E2"/, 'stroke="#F0F6D0"');
      for (let i = 0; i < 12; i++) { const y = 158 + i * 7.5 + i * i * .35; o += radaKeru(F, q, y, 8 + i * .3, 60, 1.5, .7 + i * .09, "#4E8A3E"); }
      [[40, 214, 1.1], [360, 220, 1.2]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2], "#3F7A3E"); });
      return o + mlha(F, 150, 164, .3);
    },
    /* Ásám: plochá čajová zahrada se stínícími stromy, široká Brahmaputra, bambusové domy na kůlech */
    assam: function(F, r){
      const q = nahoda(F.sem + 571);
      let o = nebe(F, "#8AB2DA", "#F0EAD8") + mraky(F, r, 4, 26, 70, 90);
      o += hrebeny(F, [[128, 10, 60, 1, "#8EA2B4", .6]]);
      o += voda(F, r, "M-10 140 Q200 134 420 142 L420 164 Q200 158 -10 168 Z", "#B8C8D0", "#8AA0B0", 142, 164, 8);
      o += hrebeny(F, [[168, 2, 90, 2, "#8EB05E", 0]]);
      for (let i = 0; i < 12; i++) { const y = 176 + i * 6 + i * i * .3; o += radaKeru(F, q, y, 1.5, 90, 1, .7 + i * .1, "#3E7A3A"); }
      [[80, 190, 1.2], [200, 184, 1], [330, 196, 1.4]].forEach(function(t){ o += skupina(F, F.stetec, tah("M" + t[0] + " " + t[1] + " l0 -" + f1(30 * t[2]), "#8A7A68", 1.3 * t[2], .9)) + koruny(F, q, t[0] - 18 * t[2], t[0] + 18 * t[2], t[1] - 28 * t[2], .45 * t[2], "#5E8A4A", .8, F.jemna); });
      const hx = 250, hy = 168;
      o += skupina(F, F.stetec, tah("M" + (hx + 2) + " " + hy + " l0 -6 M" + (hx + 14) + " " + hy + " l0 -6 M" + (hx + 26) + " " + hy + " l0 -6", "#6A5A40", 1.2, .9)) + dum(F, q, hx, hy - 6, 30, 9, { typ: "sedlo", stena: "#C8B080", bok: "#8A7650", strecha: "#9A8A5A", okna: 2, rh: 9 });
      return o;
    },
    /* Tamilnádu: vysoká pestrá brána gópuram nad chrámovým rybníkem, kokosové palmy, rýžová pole */
    tamil: function(F, r){
      const q = nahoda(F.sem + 577);
      let o = nebe(F, "#7EB0E2", "#F6E8CC") + rasy(F, r, 3, 12, 36);
      o += hrebeny(F, [[160, 2, 90, 1, "#9AB078", .3]]) + koruny(F, q, -10, 410, 162, .35, "#5E8A46", .75, F.jemna);
      o += dum(F, q, 90, 186, 220, 12, { typ: "plocha", stena: "#E8D0A8", bok: "#A88A62", okna: 0, dvere: false, d: 8 });
      o += gopuram(F, 200, 186, 1.5);
      const ryb = "M100 200 L300 200 L310 230 L90 230 Z";
      o += voda(F, r, ryb, "#8EB0C0", "#5E8098", 202, 228, 6);
      let sch = ""; for (let i = 0; i < 4; i++) sch += tah("M" + (96 - i * 2) + " " + (202 + i * 7) + " L" + (304 + i * 2) + " " + (202 + i * 7), "#D8B888", .8, .5); o += skupina(F, F.stetec, sch);
      [[40, 214, 1.2], [70, 208, .9], [340, 212, 1.1], [376, 216, 1.3]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2], "#3F7A3E"); });
      const bh = "M-10 256 L-10 234 Q200 228 420 234 L420 256 Z";
      return o + kryt(F, bh) + vrstva(F, bh, "#A8C868", "#7EA04A", .9) + trava(F, r, 70, 236, 254, ["#5E8A3A", "#7EA04A"]);
    },
    /* Telangana (telugština): žulové balvany, malá svatyně na skále, rýžová pole a palmyrové palmy */
    telangana: function(F, r){
      const q = nahoda(F.sem + 587);
      let o = nebe(F, "#82B2E0", "#F4E8CC") + mraky(F, r, 3, 30, 60, 80);
      let bal = ""; [[90, 150, 30, 24], [130, 140, 22, 30], [60, 160, 26, 16], [300, 156, 34, 22], [340, 146, 20, 26], [110, 124, 14, 14]].forEach(function(b){ bal += "M" + (b[0] - b[2]) + " " + (b[1] + 8) + " Q" + (b[0] - b[2] * 1.1) + " " + (b[1] - b[3] * .8) + " " + (b[0] - b[2] * .1) + " " + (b[1] - b[3]) + " Q" + (b[0] + b[2]) + " " + (b[1] - b[3] * .7) + " " + (b[0] + b[2]) + " " + (b[1] + 8) + " Z "; });
      o += kryt(F, bal) + vrstva(F, bal, "#C8B0A0", "#8A7466", .92) + laz(F, bal, "#6A5448", .15);
      o += dum(F, q, 104, 112, 12, 7, { typ: "plocha", stena: "#FBFAF6", bok: "#C8CCD8", okna: 0, d: 5 }) + nanes(F, "M104 105 l6 -10 l6 10 z", "#FBFAF6");
      o += hrebeny(F, [[168, 2, 90, 2, "#9AB866", 0]]);
      for (let i = 0; i < 6; i++) { const y = 176 + i * 12 + i * i; o += voda(F, r, "M-10 " + f1(y) + " L410 " + f1(y - 1) + " L410 " + f1(y + 8 + i) + " L-10 " + f1(y + 9 + i) + " Z", i % 2 ? "#B8D0DE" : "#A8CC7A", i % 2 ? "#8EB0C8" : "#7EAA56", y, y + 8, 2); }
      [[200, 176, 1.1], [240, 172, .9], [380, 180, 1.2], [30, 180, 1]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2] * .9, "#3F6A3E"); });
      return o;
    },
    /* Karnátaka (kannadština): kamenný chrám se sloupovou síní mezi balvany a banánovníky, řeka */
    karnataka: function(F, r){
      const q = nahoda(F.sem + 593);
      let o = nebe(F, "#86B2DE", "#F6E6C8") + rasy(F, r, 3, 12, 36);
      o += hrebeny(F, [[130, 12, 50, 1, "#B8A898", .5]]);
      let bal = ""; [[40, 150, 40, 30], [360, 146, 44, 36], [320, 170, 24, 16]].forEach(function(b){ bal += "M" + (b[0] - b[2]) + " " + (b[1] + 8) + " Q" + (b[0] - b[2] * 1.1) + " " + (b[1] - b[3] * .8) + " " + (b[0] - b[2] * .1) + " " + (b[1] - b[3]) + " Q" + (b[0] + b[2]) + " " + (b[1] - b[3] * .7) + " " + (b[0] + b[2]) + " " + (b[1] + 8) + " Z "; });
      o += kryt(F, bal) + vrstva(F, bal, "#C8A890", "#8A6E5E", .92);
      o += hrebeny(F, [[160, 3, 90, 2, "#A8B470", 0]]);
      /* sloupová síň mandapa a věž */
      const x = 140, y = 186; let sl = "";
      for (let i = 0; i < 8; i++) sl += tah("M" + (x + 4 + i * 12) + " " + y + " l0 -18", "#B8A080", 3, .95);
      o += nanes(F, mnoho([[x - 2, y - 18], [x + 96, y - 18], [x + 92, y - 24], [x + 2, y - 24]]), "#C8B08E") + skupina(F, F.stetec, sl) + gopuram(F, x + 118, y, .8).replace(/#E8C890|#D8A868|#E8D0A0|#C89060/g, "#C8B08E");
      o += voda(F, r, "M-10 200 Q200 192 420 202 L420 226 Q200 214 -10 228 Z", "#9EB8C0", "#6E8E98", 202, 224, 8);
      for (let i = 0; i < 4; i++) { const x2 = 30 + i * 100 + q() * 20; o += skupina(F, F.stetec, tah("M" + f1(x2) + " 250 l0 -16", "#6E7A48", 2, .9)); [-2.2, -1.6, -1, -.5].forEach(function(u){ o += list(F, x2, 236, 14 + q() * 4, u, "#5E9A48"); }); }
      return o + trava(F, r, 80, 234, 254, ["#5E8A3A", "#7EA04A"]);
    },
    /* Kérala (malajálamština): kanály lemované kokosovými palmami, hausbót s doškovou klenbou, dům se strmými taškovými střechami */
    kerala: function(F, r){
      const q = nahoda(F.sem + 599);
      let o = nebe(F, "#8AB6DC", "#F2EAD6") + mraky(F, r, 3, 28, 64, 80);
      o += koruny(F, q, -10, 410, 146, .4, mix("#4E8A46", F.opar, .3), .8, F.jemna);
      o += voda(F, r, "M-10 150 L420 148 L420 256 L-10 256 Z", "#A8C4B8", "#5E8A80", 152, 250, 16);
      const br = "M-10 150 L150 148 L140 176 Q60 184 -10 182 Z";
      o += kryt(F, br) + vrstva(F, br, "#8CB85E", "#5E8A42", .9);
      o += dum(F, q, 40, 176, 36, 10, { typ: "valba", stena: "#F4EEE2", strecha: "#A84A34", okna: 3, rh: 12, d: 18 });
      [[20, 180, 1.2], [100, 172, 1], [130, 178, 1.3], [300, 150, .8], [340, 150, .9], [380, 150, .7]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2], "#3F7A3E"); });
      /* hausbót kettuvallam */
      const bx = 230, by = 206, tr = "M" + (bx - 60) + " " + (by - 6) + " Q" + bx + " " + (by + 6) + " " + (bx + 60) + " " + (by - 8) + " L" + (bx + 56) + " " + by + " Q" + bx + " " + (by + 10) + " " + (bx - 56) + " " + by + " Z";
      o += kryt(F, tr, F.jemna) + vrstva(F, tr, "#7A5A3A", "#4A3424", .95, F.jemna);
      const kl = "M" + (bx - 44) + " " + (by - 4) + " Q" + (bx - 40) + " " + (by - 22) + " " + bx + " " + (by - 24) + " Q" + (bx + 40) + " " + (by - 22) + " " + (bx + 44) + " " + (by - 5) + " Z";
      o += kryt(F, kl, F.jemna) + vrstva(F, kl, "#C8A868", "#8A6A3A", .95, F.jemna);
      let rb = ""; for (let i = 0; i < 9; i++) rb += tah("M" + (bx - 40 + i * 10) + " " + (by - 5) + " q0 -8 " + (i < 4 ? 3 : i > 4 ? -3 : 0) + " -16", "#8A6A3A", .5, .6); o += skupina(F, F.stetec, rb);
      o += '<g transform="matrix(1 0 0 -.4 0 ' + f1((by + 2) * 1.4) + ')" opacity=".2">' + vrstva(F, kl, "#C8A868", "#8A6A3A", .95, F.jemna) + '</g>';
      return o + ptaci(F, r, 3, 260, 60);
    },
    /* Urísa (urijština): chrám se zakřivenou věží rekha deula mezi palmami a rýží, pobřeží s rybářskými loďkami */
    odisa: function(F, r){
      const q = nahoda(F.sem + 601);
      let o = nebe(F, "#86B4E0", "#F6E6C8") + rasy(F, r, 3, 12, 36) + slunce(F, 80, 100, 10, "#F0A860");
      o += voda(F, r, "M-10 150 L420 148 L420 176 L-10 178 Z", "#7EAACC", "#4A7EA8", 152, 176, 10);
      const pl = "M-10 256 L-10 176 Q200 170 420 176 L420 256 Z";
      o += kryt(F, pl) + vrstva(F, pl, "#E8D4A8", "#C8B080", .9);
      o += sikhara(F, 260, 190, 2, "#C89A78") + sikhara(F, 206, 190, 1.1, "#C89A78");
      [[60, 196, 1], [100, 204, 1.2], [340, 200, 1.1], [376, 206, .9]].forEach(function(p){ o += palma(F, r, p[0], p[1], p[2], "#3F7A3E"); });
      [[160, 222, 1.2], [300, 232, 1.4]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 16 * s) + " " + f1(y - 5 * s) + " L" + f1(x + 16 * s) + " " + f1(y - 6 * s) + " Q" + f1(x + 11 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 11 * s) + " " + f1(y + 2 * s) + " " + f1(x - 16 * s) + " " + f1(y - 5 * s) + " Z", "#4E86A8", "#2E5A7A", .95, F.jemna); });
      return o;
    },
    /* Mithila (maithilština): hliněné chýše s malovanými zdmi, rybník s lotosy, mangovníky */
    mithila: function(F, r){
      const q = nahoda(F.sem + 607);
      let o = nebe(F, "#88B4DE", "#F4E8CE") + mraky(F, r, 3, 30, 66, 80);
      o += hrebeny(F, [[146, 2, 90, 1, "#9AB078", .35]]) + koruny(F, q, -10, 410, 150, .5, "#4E7A40", .85, F.jemna);
      o += hrebeny(F, [[160, 3, 90, 2, "#A8BC70", 0]]);
      [[60, 196, 1.3], [150, 190, 1.1], [240, 196, 1.4]].forEach(function(h){ const x = h[0], y = h[1], s = h[2], w = 30 * s;
        o += dum(F, q, x, y, w, 12 * s, { typ: "dosky", stena: "#D8B888", bok: "#9A7A56", strecha: "#B89A5A", okna: 1, rh: 12 * s });
        let m = ""; for (let k = 0; k < 6; k++) m += '<path d="M' + f1(x + 3 * s + k * 4.2 * s) + " " + f1(y - 3 * s) + " l" + f1(2 * s) + " " + f1(-4 * s) + " l" + f1(2 * s) + " " + f1(4 * s) + '" stroke="' + ["#C8402E", "#2E6AB0", "#E8A030", "#3E8A4A"][k % 4] + '" stroke-width="' + f1(.7 * s) + '" fill="none"/>';
        o += '<g opacity=".85">' + m + '</g>'; });
      o += voda(F, r, "M60 220 Q200 208 360 220 Q300 246 200 246 Q100 246 60 220 Z", "#8EB4B8", "#5E8A8A", 214, 244, 4);
      let lot = ""; for (let i = 0; i < 12; i++) { const x = 90 + q() * 240, y = 222 + q() * 18; lot += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="4" ry="1.6" fill="#4E8A4A"/>' + (i % 2 ? '<circle cx="' + f1(x + 1) + '" cy="' + f1(y - 2) + '" r="1.5" fill="#E890B0"/>' : ""); }
      return o + '<g opacity=".9" filter="url(#' + F.jemna + ')">' + lot + '</g>' + strom(F, q, 380, 244, 2, "#3E6A36");
    },
    /* Santálové: vesnice hliněných domů s geometrickými malbami, sálový les, rudá cesta */
    santal: function(F, r){
      const q = nahoda(F.sem + 613);
      let o = nebe(F, "#86B2DC", "#F4E6CC") + mraky(F, r, 3, 30, 66, 80);
      o += hrebeny(F, [[130, 10, 60, 1, "#8EA2A0", .5]]) + pas(F, q, 150, .7, "#4E7A40");
      const zem = "M-10 256 L-10 176 Q200 168 420 176 L420 256 Z";
      o += kryt(F, zem) + vrstva(F, zem, "#C89A6A", "#A87A4A", .9);
      [[40, 206, 1.2], [120, 202, 1], [280, 208, 1.3]].forEach(function(h){ const x = h[0], y = h[1], s = h[2], w = 34 * s;
        o += dum(F, q, x, y, w, 12 * s, { typ: "sedlo", stena: "#B85E42", bok: "#7A3E2A", strecha: "#8A7A6A", okna: 1, rh: 10 * s });
        o += nanes(F, mnoho([[x, y], [x + w, y], [x + w, y - 4 * s], [x, y - 4 * s]]), "#2A2420", .85);
        let m = ""; for (let k = 0; k < 8; k++) m += '<path d="M' + f1(x + 2 * s + k * 4 * s) + " " + f1(y - 6 * s) + " l" + f1(2 * s) + " " + f1(-3 * s) + " l" + f1(2 * s) + " " + f1(3 * s) + '" stroke="#FBFAF6" stroke-width="' + f1(.6 * s) + '" fill="none"/>';
        o += '<g opacity=".85">' + m + '</g>'; });
      o += skupina(F, F.stetec, tah("M190 256 Q220 220 210 180", "#D8A878", 8, .8));
      return o + trava(F, r, 80, 220, 254, ["#8A9A48", "#A8A858"]);
    },
    /* Manípur (mejtejština): jezero s plovoucími kruhovými ostrůvky trávy a chýšemi, zelené kopce */
    manipur: function(F, r){
      const q = nahoda(F.sem + 617);
      let o = nebe(F, "#88B2DC", "#F0EAD8") + mraky(F, r, 3, 26, 60, 80);
      o += hrebeny(F, [[112, 14, 50, 1, "#8E9EB4", .55], [130, 10, 40, 2.5, "#6E9A6A", .3]]);
      o += voda(F, r, "M-10 144 L420 142 L420 256 L-10 256 Z", "#A8C0D0", "#6E8EA8", 146, 250, 14);
      [[60, 170, 30], [150, 160, 22], [250, 176, 36], [350, 164, 26], [110, 214, 44], [300, 226, 52]].forEach(function(p){ const d = "M" + (p[0] - p[2]) + " " + p[1] + " Q" + p[0] + " " + (p[1] - p[2] * .3) + " " + (p[0] + p[2]) + " " + p[1] + " Q" + p[0] + " " + (p[1] + p[2] * .3) + " " + (p[0] - p[2]) + " " + p[1] + " Z";
        o += kryt(F, d) + vrstva(F, d, "#9AB860", "#6E8A40", .92) + voda(F, r, "M" + (p[0] - p[2] * .6) + " " + p[1] + " Q" + p[0] + " " + (p[1] - p[2] * .16) + " " + (p[0] + p[2] * .6) + " " + p[1] + " Q" + p[0] + " " + (p[1] + p[2] * .16) + " " + (p[0] - p[2] * .6) + " " + p[1] + " Z", "#A8C0D0", "#6E8EA8", p[1] - 2, p[1] + 2, 1); });
      o += dum(F, q, 290, 222, 16, 7, { typ: "sedlo", stena: "#B8A070", bok: "#7A6A48", strecha: "#9A8A5A", okna: 1, rh: 7 }) + dum(F, q, 100, 210, 14, 6, { typ: "sedlo", stena: "#B8A070", bok: "#7A6A48", strecha: "#9A8A5A", okna: 1, rh: 6 });
      return o + ptaci(F, r, 3, 200, 70);
    },
    /* Kazachstán: zlatá step pod zasněženým Ťan-šanem, plstěná jurta s ornamentem, koně, orel */
    kazachstan: function(F, r){
      const q = nahoda(F.sem + 619);
      let o = nebe(F, "#74A6DE", "#F2E8D0") + mraky(F, r, 3, 26, 60, 90);
      o += hory(F, r, [[-10, 130], [60, 90], [140, 108], [220, 78], [300, 104], [370, 86], [410, 96]], 150, "#B8C0D4", "#7C88A6", 130, .15);
      o += hrebeny(F, [[152, 4, 90, 1, "#C8B878", .1], [180, 6, 80, 3, "#D4BC70", 0]]);
      const x = 240, y = 200, s = 1.8, j = "M" + f1(x - 14 * s) + " " + y + " L" + f1(x - 14 * s) + " " + f1(y - 11 * s) + " Q" + x + " " + f1(y - 22 * s) + " " + f1(x + 14 * s) + " " + f1(y - 11 * s) + " L" + f1(x + 14 * s) + " " + y + " Z";
      o += kryt(F, j, F.jemna) + nanes(F, j, "#F4EEE2") + laz(F, "M" + x + " " + y + " L" + x + " " + f1(y - 16 * s) + " Q" + f1(x + 8 * s) + " " + f1(y - 16 * s) + " " + f1(x + 14 * s) + " " + f1(y - 11 * s) + " L" + f1(x + 14 * s) + " " + y + " Z", "#B8AC94", .45);
      let orn = ""; for (let k = 0; k < 7; k++) orn += '<path d="M' + f1(x - 13 * s + k * 4 * s) + " " + f1(y - 7 * s) + " q" + f1(2 * s) + " " + f1(-3 * s) + " " + f1(4 * s) + " 0" + '" stroke="#B8402E" stroke-width="' + f1(.8 * s) + '" fill="none"/>';
      o += '<g opacity=".85">' + orn + '</g>' + nanes(F, "M" + f1(x - 3 * s) + " " + y + " l0 " + f1(-9 * s) + " l" + f1(6 * s) + " 0 l0 " + f1(9 * s) + " z", "#B8402E");
      let kone = ""; [[60, 214, 1.5, "#6E5038"], [100, 220, 1.7, "#3A2E26"], [140, 212, 1.4, "#A8804A"]].forEach(function(k){ const x2 = k[0], y2 = k[1], s2 = k[2];
        kone += '<path d="M' + f1(x2) + " " + f1(y2) + " l" + f1(1.5 * s2) + " " + f1(-7 * s2) + " l" + f1(12 * s2) + " 0 l" + f1(2.5 * s2) + " " + f1(-4 * s2) + " l" + f1(2.5 * s2) + " " + f1(.5 * s2) + " l" + f1(-1 * s2) + " " + f1(5 * s2) + " l0 " + f1(5.5 * s2) + " l" + f1(-1.6 * s2) + " 0 l0 " + f1(-4.5 * s2) + " l" + f1(-11 * s2) + " 0 l" + f1(-1 * s2) + " " + f1(4.5 * s2) + ' z" fill="' + k[3] + '"/>'; });
      o += '<g filter="url(#' + F.jemna + ')" opacity=".92">' + kone + '</g>' + skupina(F, F.stetec, tah("M320 70 q8 -4 14 2 q6 -6 14 -2", "#3A3030", 1.4, .9));
      return o + trava(F, r, 220, 196, 254, ["#B8A050", "#C8B060", "#9A9048"]);
    },
    /* severní Čína (mandarínština): jezero s obloukovým mostem, pavilon s prohnutou střechou, domy se šedými taškami, vrby, pagoda na kopci */
    cina: function(F, r){
      const q = nahoda(F.sem + 701);
      let o = nebe(F, "#8AB0D8", "#F2E8D6") + rasy(F, r, 3, 12, 36);
      o += hrebeny(F, [[110, 12, 60, 1, "#9AA6B8", .55], [130, 10, 50, 2.3, "#8A9E7A", .35]]);
      o += pagoda(F, 300, vyska(300, 130, 10, 50, 2.3) + 4, .8, { patra: 5, stena: "#D8C8A8", strecha: "#5A5A60" });
      o += voda(F, r, "M-10 168 L420 166 L420 256 L-10 256 Z", "#A8C4D0", "#6E92A8", 170, 250, 16);
      const br = "M-10 170 L-10 140 Q100 132 200 146 L230 170 Z";
      o += kryt(F, br) + vrstva(F, br, "#9CB870", "#6E9050", .9);
      o += vesnice(F, q, [[10, 162, 34, 10, { typ: "sedlo", stena: "#B8B4AC", bok: "#7E7A74", strecha: "#5A5E66", okna: 2, dvere: true, rh: 7 }], [52, 160, 30, 10, { typ: "sedlo", stena: "#C0BCB4", bok: "#7E7A74", strecha: "#5A5E66", okna: 2, rh: 7 }]]);
      o += sin(F, 120, 162, 40, 14, 1, { stena: "#B8402E", strecha: "#4A5058", patra: 2 });
      o += mostek(F, 250, 196, 80, 1, "#E0DCD0");
      /* smuteční vrby: koruna a převislé větvičky */
      [[30, 250, 1.5], [380, 248, 1.7]].forEach(function(v){ const x = v[0], y = v[1], k = v[2]; o += strom(F, q, x, y, k * 1.4, "#8AAE58"); let vl = ""; for (let i = 0; i < 22; i++) { const xx = x - 16 * k + i * 1.5 * k, yy = y - 26 * k - Math.sin(i / 21 * 3.14) * 6 * k; vl += tah("M" + f1(xx) + " " + f1(yy) + " q" + f1((q() - .5) * 2) + " " + f1(8 * k) + " " + f1((q() - .5) * 2) + " " + f1((12 + q() * 8) * k), "#7EA050", .6, .75); } o += skupina(F, F.stetec, vl); });
      return o + ptaci(F, r, 3, 200, 60);
    },
    /* Kanton (kantonština): řeka Perlová s džunkami a sampany, domy s „ušatými“ štíty, banyány */
    kanton: function(F, r){
      const q = nahoda(F.sem + 709);
      let o = nebe(F, "#8CB2D8", "#F2E6D0") + mraky(F, r, 3, 26, 60, 80);
      o += hrebeny(F, [[128, 10, 60, 1, "#8EA2B4", .55]]);
      const br = "M-10 176 L-10 146 L420 146 L420 176 Z";
      o += kryt(F, br) + vrstva(F, br, "#9CB870", "#6E9050", .9);
      const dm = []; for (let i = 0; i < 9; i++) dm.push([10 + i * 44 + q() * 8, 172, 30 + q() * 6, 16 + q() * 6, { typ: "stit", stena: ["#D8D0C0", "#C8BEA8", "#E0D8C8"][Math.floor(q() * 3)], bok: "#8A847A", strecha: "#4A4E56", patra: 2, okna: 3, okenice: q() < .4 ? "#3E8A6A" : null, rh: 10 }]);
      o += vesnice(F, q, dm);
      let us = ""; dm.forEach(function(d){ const x = d[0] + d[2] / 2, y = d[1] - d[3] - 10; us += "M" + f1(x - d[2] / 2) + " " + f1(d[1] - d[3]) + " Q" + f1(x - d[2] * .5) + " " + f1(y - 2) + " " + f1(x) + " " + f1(y - 4) + " Q" + f1(x + d[2] * .5) + " " + f1(y - 2) + " " + f1(x + d[2] / 2) + " " + f1(d[1] - d[3]) + " "; });

      o += voda(F, r, "M-10 176 L420 176 L420 256 L-10 256 Z", "#A8B8B0", "#6E8A88", 180, 250, 18);
      /* džunka s plachtami z rohoží */
      const jx = 250, jy = 222, trup = "M" + (jx - 40) + " " + (jy - 10) + " Q" + jx + " " + (jy + 4) + " " + (jx + 44) + " " + (jy - 14) + " L" + (jx + 38) + " " + jy + " Q" + jx + " " + (jy + 8) + " " + (jx - 36) + " " + jy + " Z";
      o += kryt(F, trup, F.jemna) + vrstva(F, trup, "#8A5A3A", "#4A2E1E", .95, F.jemna);
      [[jx - 18, 40, 26], [jx + 8, 52, 32], [jx + 30, 34, 20]].forEach(function(p){ const pl = "M" + p[0] + " " + (jy - 8) + " l0 -" + p[1] + " q" + (p[2] * .6) + " 4 " + p[2] + " 0 l-2 " + p[1] + " z"; let z = ""; for (let k = 1; k < 7; k++) z += tah("M" + p[0] + " " + f1(jy - 8 - p[1] * k / 7) + " l" + f1(p[2] - 1) + " 0", "#6A4A30", .5, .7); o += kryt(F, pl, F.jemna) + nanes(F, pl, "#C8784A", .95) + skupina(F, F.stetec, z); });
      [[60, 206, .8], [140, 236, 1]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 16 * s) + " " + f1(y - 5 * s) + " L" + f1(x + 16 * s) + " " + f1(y - 6 * s) + " Q" + f1(x + 11 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 11 * s) + " " + f1(y + 2 * s) + " " + f1(x - 16 * s) + " " + f1(y - 5 * s) + " Z", "#6E5A48", "#4A3A2E", .95, F.jemna) + vrstva(F, "M" + f1(x - 8 * s) + " " + f1(y - 5 * s) + " Q" + x + " " + f1(y - 14 * s) + " " + f1(x + 8 * s) + " " + f1(y - 5 * s) + " Z", "#C8A868", "#8A6A3A", .95, F.jemna); });
      return o;
    },
    /* vodní město (šanghajština, wu): kanál, bílé domy s černými taškami a stupňovitými štíty, kamenný most, loďky */
    vodnimesto: function(F, r){
      const q = nahoda(F.sem + 719);
      let o = nebe(F, "#9AB6D2", "#F0ECE0") + rasy(F, r, 3, 12, 40);
      o += voda(F, r, "M-10 150 L420 150 L420 256 L-10 256 Z", "#B8C8C8", "#7E9898", 154, 250, 14);
      const L = [], P = [];
      for (let i = 0; i < 5; i++) { L.push([-10 + i * 30, 180 + i * 12, 38, 22 + i * 3, { typ: "stupne", stena: "#F6F4EE", bok: "#C4C8CC", strecha: "#2E3036", patra: 2, okna: 2, okno: "#4A4E56", rh: 12, d: 30 }]); P.push([290 - i * 16, 170 + i * 16, 40, 22 + i * 4, { typ: "stupne", stena: "#F6F4EE", bok: "#C4C8CC", strecha: "#2E3036", patra: 2, okna: 2, okno: "#4A4E56", rh: 12, d: 10 }]); }
      o += mostek(F, 160, 176, 80, 1, "#C8C4B8");
      o += vesnice(F, q, P) + vesnice(F, q, L);
      o += '<g transform="matrix(1 0 0 -.4 0 246)" opacity=".2">' + mostek(F, 160, 176, 80, 1, "#C8C4B8") + '</g>';
      o += vrstva(F, "M170 226 L230 224 Q224 232 200 232 Q180 232 170 226 Z", "#5A4A3A", "#3A2E24", .95, F.jemna) + vrstva(F, "M184 224 Q200 214 216 224 Z", "#3A3A40", "#2A2A30", .95, F.jemna);
      let lam = ""; for (let i = 0; i < 6; i++) lam += '<ellipse cx="' + f1(40 + i * 60) + '" cy="' + f1(150 + (i % 2) * 20) + '" rx="2.4" ry="3.2" fill="#D8402E"/>'; o += '<g opacity=".85" filter="url(#' + F.jemna + ')">' + lam + '</g>';
      return o + koruny(F, q, 280, 420, 150, .45, "#6E9A5A", .8, F.jemna);
    },
    /* Min-nan (hokkien): cihlové domy s vlaštovčími ocasy na hřebenech, pobřeží, rybářské lodě */
    minnan: function(F, r){
      const q = nahoda(F.sem + 727);
      let o = nebe(F, "#86B2DC", "#F4E6D0") + mraky(F, r, 3, 26, 60, 80);
      o += hrebeny(F, [[124, 10, 60, 1, "#8EA2B4", .55]]);
      o += voda(F, r, "M-10 150 L420 148 L420 186 L-10 188 Z", "#7EAACC", "#4A7EA8", 152, 186, 10);
      const zem = "M-10 256 L-10 184 Q200 176 420 184 L420 256 Z";
      o += kryt(F, zem) + vrstva(F, zem, "#C8B48A", "#A89468", .9);
      const cd = { typ: "sedlo", stena: "#B8543A", bok: "#7A3426", strecha: "#A84A34", okna: 2, okno: "#3A2A24", rh: 8 };
      const dm = [[40, 214, 50, 14, cd], [110, 210, 40, 13, cd], [200, 216, 60, 15, cd], [290, 212, 44, 13, cd]];
      o += vesnice(F, q, dm);
      let ocas = ""; dm.forEach(function(d){ const y = d[1] - d[3] - (d[4].rh) + 1, x0 = d[0] + d[2] * .12, x1 = d[0] + d[2] * .88 + 4; ocas += "M" + f1(x0 - 6) + " " + f1(y - 7) + " Q" + f1(x0 - 2) + " " + f1(y) + " " + f1(x0 + 6) + " " + f1(y) + " L" + f1(x1 - 6) + " " + f1(y) + " Q" + f1(x1 + 2) + " " + f1(y) + " " + f1(x1 + 6) + " " + f1(y - 7) + " "; });
      o += skupina(F, F.stetec, tah(ocas, "#7A3426", 2, .95));
      [[80, 172, .9, "#C8402E"], [300, 166, .8, "#2E6AA8"]].forEach(function(b){ const x = b[0], y = b[1], s = b[2]; o += vrstva(F, "M" + f1(x - 16 * s) + " " + f1(y - 6 * s) + " L" + f1(x + 16 * s) + " " + f1(y - 7 * s) + " Q" + f1(x + 11 * s) + " " + f1(y + 2 * s) + " " + x + " " + f1(y + 2 * s) + " Q" + f1(x - 11 * s) + " " + f1(y + 2 * s) + " " + f1(x - 16 * s) + " " + f1(y - 6 * s) + " Z", "#F4EEE2", "#B8B0A0", .95, F.jemna) + skupina(F, F.stetec, tah("M" + f1(x - 15 * s) + " " + f1(y - 6.5 * s) + " L" + f1(x + 15 * s) + " " + f1(y - 7.5 * s), b[3], 1.4 * s, .85)); });
      return o + palma(F, r, 370, 236, 1, "#3F7A3E");
    },
    /* tulou (hakka): kruhové hliněné opevněné domy v horském údolí, čajové terasy, bambusy */
    tulou: function(F, r){
      const q = nahoda(F.sem + 733);
      let o = nebe(F, "#8AB2D8", "#F0EAD8") + mraky(F, r, 3, 26, 60, 80);
      o += hrebeny(F, [[108, 14, 50, 1, "#8E9EB4", .55], [128, 12, 44, 2.4, "#6E9A6A", .3]]) + mlha(F, 124, 142, .4);
      o += hrebeny(F, [[150, 6, 60, 3, "#8EB064", 0]]);
      /* tulou: válec z hlíny, nahoře kruhová střecha s taškami */
      const tul = function(x, y, rx, h){
        const d = "M" + f1(x - rx) + " " + f1(y - h) + " L" + f1(x - rx) + " " + f1(y) + " A" + f1(rx) + " " + f1(rx * .3) + " 0 0 0 " + f1(x + rx) + " " + f1(y) + " L" + f1(x + rx) + " " + f1(y - h) + " Z";
        const st = "M" + f1(x - rx * 1.1) + " " + f1(y - h) + " A" + f1(rx * 1.1) + " " + f1(rx * .34) + " 0 0 1 " + f1(x + rx * 1.1) + " " + f1(y - h) + " A" + f1(rx * 1.1) + " " + f1(rx * .34) + " 0 0 1 " + f1(x - rx * 1.1) + " " + f1(y - h) + " Z";
        const vnitr = "M" + f1(x - rx * .6) + " " + f1(y - h - 1) + " A" + f1(rx * .6) + " " + f1(rx * .18) + " 0 0 1 " + f1(x + rx * .6) + " " + f1(y - h - 1) + " A" + f1(rx * .6) + " " + f1(rx * .18) + " 0 0 1 " + f1(x - rx * .6) + " " + f1(y - h - 1) + " Z";
        let ok = ""; for (let i = 0; i < 7; i++) { const a = -1.2 + i * .4; ok += mnoho([[x + Math.sin(a) * rx * .9 - 1, y - h * .35 + Math.cos(a) * 2], [x + Math.sin(a) * rx * .9 + 1, y - h * .35 + Math.cos(a) * 2], [x + Math.sin(a) * rx * .9 + 1, y - h * .35 + Math.cos(a) * 2 - 3], [x + Math.sin(a) * rx * .9 - 1, y - h * .35 + Math.cos(a) * 2 - 3]]); }
        return kryt(F, d + st, F.jemna) + vrstva(F, d, "#E0C8A0", "#A88A60", .96, F.jemna) + laz(F, "M" + f1(x + rx * .3) + " " + f1(y - h) + " L" + f1(x + rx * .3) + " " + f1(y + rx * .28) + " A" + f1(rx) + " " + f1(rx * .3) + " 0 0 0 " + f1(x + rx) + " " + f1(y) + " L" + f1(x + rx) + " " + f1(y - h) + " Z", "#6A4A30", .3) +
          nanes(F, ok, "#3A2A20", .8) + vrstva(F, st, "#6E6A6A", "#4A4648", .96, F.jemna) + nanes(F, vnitr, "#8A7A60", .9);
      };
      o += tul(140, 196, 44, 30) + tul(270, 186, 34, 24) + tul(350, 200, 26, 20);
      for (let i = 0; i < 6; i++) o += radaKeru(F, q, 214 + i * 7, 3, 60, 2, .8 + i * .1, "#4E8A3E");
      let bam = ""; for (let i = 0; i < 10; i++) { const x = 10 + i * 5 + q() * 4; bam += tah("M" + f1(x) + " 256 q" + f1((q() - .5) * 6) + " -40 " + f1((q() - .5) * 14) + " -70", "#6E9A4A", 1.4, .85); }
      return o + skupina(F, F.stetec, bam) + koruny(F, q, -10, 60, 190, .5, "#6E9A4A", .75, F.jemna);
    },
    /* Japonsko: sopka se sněhem nad jezerem, pětipatrová pagoda, torii, rozkvetlé sakury */
    japonsko: function(F, r){
      const q = nahoda(F.sem + 739);
      let o = nebe(F, "#86AED8", "#F3E6D4") + rasy(F, r, 4, 14, 46) + mrak(F, r, 318, 58, 64);
      const hora = [[-10, 164], [40, 160], [100, 142], [140, 116], [168, 90], [186, 70], [195, 64], [203, 63.4], [211, 62.8], [226, 80], [256, 112], [300, 140], [360, 158], [410, 164]];
      o += hory(F, r, hora, 164, "#98A2BC", "#5A6688", 118, .06);
      o += mlha(F, 136, 152, .45) + hrebeny(F, [[154, 8, 50, 1, "#6E8E62", .2]]) + lesik(F, q, -10, 410, 160, .8, "#3E5E3E", true);
      o += voda(F, r, "M-10 164 L410 162 L410 216 L-10 218 Z", "#A4BED6", "#4E7CA6", 166, 212, 16);
      o += '<g transform="matrix(1 0 0 -.5 0 246)" opacity=".3">' + hory(F, r, hora, 164, "#98A2BC", "#5A6688", 118, .06) + '</g>';
      o += hrebeny(F, [[220, 5, 70, 4, "#789C58", 0]]);
      o += pagoda(F, 60, 222, 1, { patra: 5, stena: "#B8402E", strecha: "#3A3E46" }) + torii(F, 300, 212, 40, 34, 1);
      for (let i = 0; i < 4; i++) { const x = 140 + i * 34 + q() * 8, y = 234 + q() * 8; o += strom(F, q, x, y, 1.3, "#8A7A60"); let kv = ""; for (let k = 0; k < 30; k++) kv += '<circle cx="' + f1(x + (q() - .5) * 20) + '" cy="' + f1(y - 22 + (q() - .5) * 14) + '" r="' + f1(1 + q()) + '"/>'; o += '<g fill="#F4C4D4" opacity=".9" filter="url(#' + F.jemna + ')">' + kv + '</g>'; }
      return o + trava(F, r, 110, 222, 252, ["#5E8A42", "#7EA24E"]);
    },
    /* Korea: domy hanok s prohnutými taškovými střechami, borovice, hory, kakibaum s oranžovými plody */
    korea: function(F, r){
      const q = nahoda(F.sem + 743);
      let o = nebe(F, "#86B0DC", "#F2E8D6") + mraky(F, r, 3, 26, 60, 80);
      o += hory(F, r, [[-10, 120], [70, 80], [150, 104], [230, 70], [310, 96], [410, 84]], 160, "#9AAABE", "#66789A", 0, .18);
      o += pas(F, q, 160, .55, "#3E6044") + hrebeny(F, [[178, 6, 70, 2.4, "#A8B470", 0]]);
      o += sin(F, 60, 206, 70, 13, 1, { stena: "#F2EEE4", strecha: "#3E4048", sloup: "#6A4A30", zvednuti: 1.6 }) + sin(F, 170, 200, 54, 11, .9, { stena: "#F2EEE4", strecha: "#3E4048", sloup: "#6A4A30", zvednuti: 1.6 }) + sin(F, 250, 212, 64, 12, 1, { stena: "#F2EEE4", strecha: "#3E4048", sloup: "#6A4A30", zvednuti: 1.6 });
      let zed = ""; for (let x = -10; x < 420; x += 5) zed += '<ellipse cx="' + f1(x + q() * 2) + '" cy="' + f1(226 + q() * 2) + '" rx="3" ry="2" fill="' + ["#B8B0A0", "#A89E8C", "#C8C0B0"][Math.floor(q() * 3)] + '"/>';
      o += '<g opacity=".9" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + zed + '</g>';
      o += skupina(F, F.stetec, tah("M360 250 C356 220 370 200 350 176", "#5A4A3A", 2.4, .9)) + koruny(F, q, 320, 400, 180, .5, "#3E6044", .9, F.jemna);
      let kaki = ""; for (let i = 0; i < 10; i++) kaki += '<circle cx="' + f1(24 + q() * 36) + '" cy="' + f1(200 + q() * 20) + '" r="1.6" fill="#E8782E"/>';
      return o + strom(F, q, 40, 240, 1.8, "#7A8A4A") + '<g opacity=".9">' + kaki + '</g>' + trava(F, r, 80, 232, 254, ["#5E8A42", "#7EA24E"]);
    },
    /* Hmongové: strmé rýžové terasy v mlžných horách, dřevěné domy, bambusové háje */
    hmong: function(F, r){
      const q = nahoda(F.sem + 751);
      let o = nebe(F, "#8EB2D8", "#EEEAE0") + mraky(F, r, 2, 26, 50, 80);
      o += hrebeny(F, [[96, 16, 50, 1, "#8E9EB4", .6], [118, 14, 44, 2.4, "#6E8E6A", .4]]) + mlha(F, 110, 136, .55);
      o += terasy(F, r, 138, 12, 8, 14, 36, 3.2, ["#B4CC70", "#C8C878", "#9CC064", "#D0C878", "#A8C46A"], "#7A7A4A");
      o += vesnice(F, q, [[250, 170, 28, 10, { typ: "sedlo", stena: "#8A6E50", bok: "#5E4A36", strecha: "#6E6A68", okna: 2, rh: 9 }], [290, 176, 24, 9, { typ: "sedlo", stena: "#7A5E46", bok: "#5E4A36", strecha: "#6E6A68", okna: 1, rh: 8 }]]);
      let bam = ""; for (let i = 0; i < 14; i++) { const x = 330 + i * 5 + q() * 4; bam += tah("M" + f1(x) + " 256 q" + f1((q() - .5) * 6) + " -40 " + f1((q() - .5) * 14) + " -" + f1(60 + q() * 20), "#6E9A4A", 1.3, .85); }
      return o + skupina(F, F.stetec, bam) + koruny(F, q, 320, 420, 190, .5, "#6E9A4A", .7, F.jemna) + mlha(F, 150, 170, .25);
    },
    /* Ainuové (Hokkaidó): horská řeka s lososy, jehličnatý les, doškový dům čise, sýpka na kůlech */
    ainu: function(F, r){
      const q = nahoda(F.sem + 757);
      let o = nebe(F, "#8AAED6", "#EEEAE0") + mraky(F, r, 3, 24, 60, 90);
      o += hory(F, r, [[-10, 120], [80, 84], [160, 104], [240, 76], [330, 98], [410, 86]], 150, "#A8B4C8", "#6E7C98", 100, .15);
      o += lesik(F, q, -10, 410, 150, 1.1, "#3E5A48", true) + hrebeny(F, [[166, 6, 70, 2, "#8EAE5E", 0]]);
      o += dum(F, q, 60, 200, 44, 10, { typ: "dosky", stena: "#B8A078", bok: "#7A6648", strecha: "#A89060", okna: 1, rh: 18, d: 24 });
      o += naKulech(F, q, 130, 206, 18, 9, 10, { typ: "dosky", stena: "#A8906A", bok: "#6E5A40", strecha: "#A89060", okna: 0, dvere: false, rh: 10 });
      o += voda(F, r, "M200 256 Q220 220 250 196 Q280 176 330 170 L360 172 Q300 190 290 220 Q280 240 300 256 Z", "#B8D0DE", "#7E9EB8", 174, 250, 8);
      let los = ""; [[270, 220], [284, 234], [262, 244]].forEach(function(l){ los += '<path d="M' + l[0] + " " + l[1] + ' q5 -3 10 0 l3 -2 l0 4 l-3 -2 q-5 3 -10 0 z" fill="#C8604A"/>'; });
      o += '<g opacity=".85" filter="url(#' + F.jemna + ')">' + los + '</g>';
      [[20, 240, 1.6], [380, 244, 1.8], [350, 236, 1.3]].forEach(function(t){ o += jehlicnan(F, q, t[0], t[1], t[2], "#2F4B3A"); });
      return o + trava(F, r, 100, 222, 254, ["#557F38", "#78A04A"]);
    },
    /* Jakutsko: modřínová tajga, dřevěný srub balagan se šikmými stěnami, jakutští koně, zasněžená pláň */
    jakutsko: function(F, r){
      const q = nahoda(F.sem + 761);
      let o = nebe(F, "#A4B8DA", "#F4E4D4") + rasy(F, r, 4, 16, 60) + slunce(F, 110, 120, 10, "#F2B07A");
      const sn = "M-10 256 L-10 150 L420 150 L420 256 Z";
      o += kryt(F, sn) + nanes(F, sn, "#F6F8FC", .97, F.lazura) + laz(F, "M-10 200 Q200 190 420 204 L420 256 L-10 256 Z", "#C8D4EA", .35);
      o += lesik(F, q, -10, 410, 152, 1, "#8A7A5A", true) + lesik(F, q, -10, 410, 156, .9, "#6E6A50", true);
      const bx = 190, by = 204, bal = mnoho([[bx, by], [bx + 50, by], [bx + 46, by - 18], [bx + 4, by - 18]]);
      o += kryt(F, bal, F.jemna) + vrstva(F, bal, "#9A7A5A", "#6A5038", .95, F.jemna) + nanes(F, mnoho([[bx + 2, by - 18], [bx + 48, by - 18], [bx + 40, by - 24], [bx + 10, by - 24]]), "#F6F8FC") + nanes(F, "M" + (bx + 20) + " " + by + " l0 -10 l8 0 l0 10 z", "#4A3426", .9);
      let t = ""; for (let k = 1; k < 6; k++) t += tah("M" + (bx + 1) + " " + (by - k * 3) + " l48 0", "#5A4430", .5, .6); o += skupina(F, F.stetec, t) + mok(F, "M" + (bx + 30) + " " + (by - 26) + " q-6 -10 0 -20 q6 -8 0 -18 l5 0 q4 10 -2 18 q-4 10 3 20 z", "#D8DCE4", .5);
      let kone = ""; [[90, 226, 1.6, "#E8E0D0"], [130, 232, 1.8, "#8A6A4E"], [300, 228, 1.7, "#5E4A3A"]].forEach(function(k){ const x2 = k[0], y2 = k[1], s2 = k[2];
        kone += '<path d="M' + f1(x2) + " " + f1(y2) + " l" + f1(1.5 * s2) + " " + f1(-7 * s2) + " l" + f1(12 * s2) + " 0 l" + f1(2.5 * s2) + " " + f1(-4 * s2) + " l" + f1(2.5 * s2) + " " + f1(.5 * s2) + " l" + f1(-1 * s2) + " " + f1(5 * s2) + " l0 " + f1(5.5 * s2) + " l" + f1(-1.6 * s2) + " 0 l0 " + f1(-4.5 * s2) + " l" + f1(-11 * s2) + " 0 l" + f1(-1 * s2) + " " + f1(4.5 * s2) + ' z" fill="' + k[3] + '"/>'; });
      return o + '<g filter="url(#' + F.jemna + ')" opacity=".92">' + kone + '</g>';
    },
    /* střední Evropa: zvlněná pole, remízky, vesnice s kostelíkem, vlčí máky */
    kopce: function(F, r){
      let o = nebe(F, "#86ADDA", "#F4E6C8") + rasy(F, r, 3, 20, 50) + mraky(F, r, 3, 40, 75, 80) + ptaci(F, r, 3, 70, 44);
      o += hrebeny(F, [[112, 6, 80, 1, "#7E97B8", .55], [128, 8, 60, 2.5, "#7FA064", .35]]);
      o += lesik(F, r, 20, 150, 130, .9, "#4F7442");
      const pole = ["#D5BC62", "#E6D272", "#A8C466", "#BFCB7E", "#DDB86A", "#9DBB5E"];
      let pl = "";
      for (let i = 0; i < 10; i++) { const x = -20 + i * 44 + r() * 10, a = vyska(x, 146, 10, 60, 4), b = vyska(x + 50, 146, 10, 60, 4);
        pl += vrstva(F, "M" + f1(x) + " " + f1(a) + " L" + f1(x + 50) + " " + f1(b) + " L" + f1(x + 64) + " " + f1(b + 24) + " L" + f1(x + 6) + " " + f1(a + 28) + " Z", mix(pole[i % pole.length], "#FFFFFF", .2), pole[i % pole.length], .7);
        for (let k = 1; k < 5; k++) pl += skupina(F, F.stetec, tah("M" + f1(x + k * 3) + " " + f1(a + k * 6) + " L" + f1(x + 50 + k * 3) + " " + f1(b + k * 6), mix(pole[i % pole.length], "#5A4A22", .4), .5, .35)); }
      o += pl + laz(F, hrbet(146, 10, 60, 4), "#7FA35A", .3);
      const vx = 236 + r() * 50, vy = vyska(vx, 146, 10, 60, 4) + 5;
      /* česká náves: domy štítem do cesty, barokní kostelík s cibulovou bání */
      const q = nahoda(F.sem + 97);
      o += vesnice(F, q, [[vx - 20, vy + 2, 12, 8, { typ: "stit", stena: "#F4EEE2", strecha: "#B84E36", okna: 2, dvere: false }], [vx - 4, vy + 3, 11, 7, { typ: "stit", stena: "#F2E4C4", strecha: "#B84E36", okna: 2, dvere: false }],
        [vx + 12, vy + 1, .75, 0, { kostel: 1, vez: "barok", stena: "#F4EEE2", strecha: "#B84E36", vezStrecha: "#4E6E5E" }], [vx + 48, vy + 3, 12, 8, { typ: "stit", stena: "#F4EEE2", strecha: "#A84632", okna: 2, dvere: false }], [vx + 64, vy + 2, 11, 7, { typ: "stit", stena: "#EEDCB4", strecha: "#B84E36", okna: 2, dvere: false }]]);
      for (let i = 0; i < 9; i++) o += strom(F, r, 18 + i * 22 + r() * 8, 184 + r() * 6, 1.05, "#58823F");
      o += hrebeny(F, [[194, 6, 80, 5.5, "#8FB45E", 0]]);
      o += trava(F, r, 260, 196, 252, ["#557F38", "#78A04A", "#46692E", "#98B45A"]);
      o += kvety(F, r, 46, 204, 250, ["#D23A2B", "#C9322A", "#E0452F"], 1.3) + kvety(F, r, 18, 206, 250, ["#F4F0E4", "#6E7FC4"], .9);
      return o;
    },
    /* nížina: lány pod velkým nebem, remízky, cesta se stromořadím; „mlyn“ = poldry s kanálem a mlýnem, „slunecnice“ = slunečnicové pole */
    rovina: function(F, r, v){
      const q = nahoda(F.sem + 17), mlyn_ = v === "mlyn", slun = v === "slunecnice";
      let o = nebe(F, "#78A4D8", "#F3E8CE") + rasy(F, r, 3, 12, 30) + mraky(F, r, 4, 34, 92, 110);
      o += hrebeny(F, [[146, 1.5, 90, 1, "#8EA2A0", .55]]) + koruny(F, q, -10, 410, 148, .3, mix("#6E8A5A", F.opar, .45), .75, F.jemna);
      const barvy = mlyn_ ? ["#8EBE62", "#A6CC72", "#7EAE58", "#B4CC7A", "#98C06A"] : slun ? ["#D8C050", "#A8C068", "#E2C860", "#8EB060", "#C8B464"] : ["#C8C070", "#A8C468", "#DCC47A", "#8EB060", "#BCA866", "#B4B870"];
      o += pole(F, q, 148, 230, barvy, true);
      if (mlyn_) {
        const d = "M200 148 L214 148 L140 256 L60 256 Z";
        o += kryt(F, d) + voda(F, r, d, "#C2D6E6", "#8EB0CC", 150, 250, 6) + skupina(F, F.stetec, tah("M200 148 L60 256", "#5E8A42", 1.2, .6) + tah("M214 148 L140 256", "#5E8A42", 1.2, .6));
        o += mlyn(F, r, 292, 170, 1.15) + mlyn(F, r, 120, 152, .45);
        /* cihlové domy se stupňovitými štíty u kanálu */
        o += vesnice(F, q, [[20, 176, 14, 14, { typ: "stupne", stena: "#A85A44", bok: "#6E3A2E", strecha: "#4A4A50", patra: 2, okna: 2, okenice: null, okno: "#F4EEE2" }], [36, 177, 13, 12, { typ: "stit", stena: "#8A4A3A", bok: "#5E2E26", strecha: "#4A4A50", patra: 2, okna: 2, okno: "#F4EEE2" }], [51, 176, 14, 15, { typ: "stupne", stena: "#B8664A", bok: "#6E3A2E", strecha: "#4A4A50", patra: 2, okna: 2, okno: "#F4EEE2" }], [67, 177, 12, 12, { typ: "stit", stena: "#9A4E3E", bok: "#5E2E26", strecha: "#4A4A50", patra: 2, okna: 2, okno: "#F4EEE2" }]]);
        for (let i = 0; i < 5; i++) { const x = 250 + i * 28 + q() * 8, y = 214 + q() * 20; o += '<g filter="url(#' + F.jemna + ')" opacity=".9"><ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="5.5" ry="3" fill="#F4F0E6"/><path d="M' + f1(x - 3) + " " + f1(y - 2) + " l3 -.5 l2 2 l-3 1.5 z M" + f1(x + 1) + " " + f1(y + 1) + ' l3 -1 l1 2 l-3 .5 z" fill="#2E2A28"/><circle cx="' + f1(x + 5.5) + '" cy="' + f1(y - 1.5) + '" r="1.8" fill="#2E2A28"/></g>'; }
      } else {
        /* polní cesta k obzoru a stromořadí podél ní */
        o += kryt(F, "M226 148 L234 148 L300 256 L236 256 Z") + vrstva(F, "M226 148 L234 148 L300 256 L236 256 Z", "#E0D0A8", "#C0A880", .85) + skupina(F, F.stetec, tah("M229 150 L258 256", "#8EA858", 1.6, .5) + tah("M231 150 L276 256", "#8EA858", 1.2, .4));
        for (let i = 0; i < 9; i++) { const t = Math.pow(i / 8, 1.8), x = 238 + t * 110, y = 150 + t * 100, s2 = .25 + t * 1.5; o += strom(F, r, x + 4 * s2, y, s2, "#5E8440"); }
        if (slun) o += dum(F, q, 60, 160, 30, 9, { typ: "dosky", stena: "#FBF8F0", strecha: "#B89A5A", okna: 2, okenice: "#3E78C0", rh: 12 }) + cibule(F, q, 120, 150, .5, { ban: "#D8A640", strecha: "#4E8A6A" });
        else o += dum(F, q, 50, 158, 40, 10, { typ: "valba", stena: "#FBF8F0", strecha: "#A8483A", okna: 5, rh: 8, d: 16 }) + portikus(F, 62, 158, 16, 10, 1) + capi(F, 150, 196, 1.2);
      }
      if (slun) { let st = "", pl = "", ct = "", li = "";
        for (let i = 0; i < 140; i++) { const y = 190 + Math.pow(q(), .7) * 64, x = q() * W, s2 = .5 + (y - 190) / 22;
          li += '<ellipse cx="' + f1(x + 2 * s2) + '" cy="' + f1(y + 4 * s2) + '" rx="' + f1(3 * s2) + '" ry="' + f1(1.4 * s2) + '"/>';
          for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; pl += '<ellipse cx="' + f1(x + Math.cos(a) * 2.4 * s2) + '" cy="' + f1(y + Math.sin(a) * 1.9 * s2) + '" rx="' + f1(1.3 * s2) + '" ry="' + f1(.6 * s2) + '" transform="rotate(' + f1(a * 57.3) + " " + f1(x + Math.cos(a) * 2.4 * s2) + " " + f1(y + Math.sin(a) * 1.9 * s2) + ')"/>'; }
          ct += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(1.5 * s2) + '" ry="' + f1(1.2 * s2) + '"/>'; st += "M" + f1(x) + " " + f1(y + s2) + " l" + f1(.4 * s2) + " " + f1(8 * s2) + " "; }
        o += skupina(F, F.stetec, '<path d="' + st + '" stroke="#4E6E2E" stroke-width="1" fill="none" opacity=".7"/>') + '<g fill="#5E8A3A" opacity=".8" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + li + '</g>' +
          '<g fill="#F2B82A" opacity=".95" filter="url(#' + F.jemna + ')">' + pl + '</g><g fill="#5C3E1E" opacity=".9" filter="url(#' + F.jemna + ')">' + ct + '</g>';
        return o;
      }
      return o + trava(F, r, 200, 214, 254, mlyn_ ? ["#5E8A3A", "#7EA84A", "#4A7430"] : ["#B8A050", "#C8B060", "#8A9A48", "#A08A40"]) + (mlyn_ ? "" : kvety(F, r, 34, 222, 252, ["#D23A2B", "#E0452F", "#5A6EC8"], 1.2));
    },
    /* severský les: jezero s odrazem, tajga, břízy a smrky na břehu */
    les: function(F, r){
      const q = nahoda(F.sem + 23);
      let o = nebe(F, "#92B2D8", "#F0E8D6") + mraky(F, r, 3, 30, 70, 80) + rasy(F, r, 2, 14, 32);
      o += hrebeny(F, [[118, 7, 60, 1, "#8C9EAE", .6]]);
      const brehy = lesik(F, q, -10, 410, 142, 1.3, "#445E4E", true) + lesik(F, q, -10, 410, 148, 1.1, "#34503E", true);
      o += mlha(F, 124, 140, .4) + brehy;
      o += voda(F, r, "M-10 148 L410 147 L410 214 L-10 216 Z", "#AEC4D8", "#6A8EAE", 152, 210, 14);
      o += '<g transform="matrix(1 0 0 -.6 0 237)" opacity=".3">' + brehy + '</g>';
      o += hrebeny(F, [[212, 5, 70, 3, "#6E8E4E", 0]]);
      let kam = ""; [[150, 214, 9], [168, 218, 6], [60, 222, 7]].forEach(function(k){ kam += "M" + (k[0] - k[2]) + " " + k[1] + " Q" + k[0] + " " + (k[1] - k[2]) + " " + (k[0] + k[2]) + " " + k[1] + " Z "; });
      o += vrstva(F, kam, "#B4B0A8", "#7A7670", .9, F.jemna);
      [[252, 226, 1.2], [276, 234, 1.5], [302, 222, 1.1], [330, 238, 1.8], [362, 228, 1.4], [392, 240, 1.9]].forEach(function(t){ o += jehlicnan(F, q, t[0], t[1], t[2], "#2F4B3A"); });
      [[40, 238, 1.1], [66, 244, 1.25], [96, 236, 1], [122, 246, 1.3]].forEach(function(t){ o += briza(F, q, t[0], t[1], t[2]); });
      return o + trava(F, r, 170, 220, 254, ["#607F44", "#809D55", "#4C6A36"]) + kvety(F, r, 16, 228, 252, ["#F4F0E4", "#E8D56A", "#B8A0D8"], .9);
    },
    /* fjord: strmé skály do moře, sníh nahoře, domky u vody */
    fjordy: function(F, r){
      let o = nebe(F, "#8AA8CE", "#EEE8DC") + mraky(F, r, 3, 30, 60, 70) + rasy(F, r, 3, 14, 40);
      o += hory(F, r, [[-10, 118], [30, 66], [92, 56], [132, 100], [150, 170]], 170, "#7C8CA2", "#56657E", 80);
      o += hory(F, r, [[240, 170], [258, 108], [292, 52], [352, 62], [410, 96]], 170, "#7C8CA2", "#56657E", 76);
      ["M-10 112 L58 118 L122 170 L-10 170 Z", "M262 152 L330 118 L410 114 L410 170 L246 170 Z"].forEach(function(d){ o += kryt(F, d) + vrstva(F, d, "#7E9C6E", "#4F6B4A", .8); });
      o += lesik(F, r, 262, 410, 164, .8, "#35523E", true);
      o += voda(F, r, "M-10 168 L410 166 L410 250 L-10 250 Z", "#7D9CBC", "#3F6386", 172, 248, 22);
      o += '<g transform="matrix(1 0 0 -.5 0 253)" opacity=".28">' + hory(F, r, [[-10, 118], [30, 66], [92, 56], [132, 100], [150, 170]], 170, "#7C8CA2", "#56657E", 0) + '</g>';
      /* norské dřevěné domy (rudé, okrové, bílé), loděnice na kůlech u vody a bílý kostelík */
      const q = nahoda(F.sem + 317), nd = { typ: "sedlo", bok: "#6E2A24", strecha: "#3E3E44", okna: 2, okno: "#F4EEE2", rh: 7 };
      o += vesnice(F, q, [[290, 160, 16, 9, Object.assign({}, nd, { stena: "#A8382E" })], [320, 158, 18, 10, Object.assign({}, nd, { stena: "#FBFAF6", bok: "#A8ACB8" })], [350, 160, 16, 9, Object.assign({}, nd, { stena: "#D8A840", bok: "#8A6A2A" })], [376, 156, .7, 0, { kostel: 1, vez: "jehlan", stena: "#FBFAF6", strecha: "#3E3E44", vezStrecha: "#3E3E44" }]]);
      o += dum(F, q, 300, 170, 20, 9, { typ: "stit", stena: "#A8382E", bok: "#6E2A24", strecha: "#3E3E44", okna: 1, okno: "#F4EEE2" }) + dum(F, q, 330, 171, 18, 8, { typ: "stit", stena: "#A8382E", bok: "#6E2A24", strecha: "#3E3E44", okna: 1, okno: "#F4EEE2" }) +
        skupina(F, F.stetec, tah("M302 170 l0 5 M312 170 l0 5 M320 170 l0 5 M332 171 l0 5 M342 171 l0 5 M348 171 l0 5", "#4A3A30", 1, .9));
      return o + ptaci(F, r, 3, 180, 90);
    },
    /* atlantské pobřeží: útesy ustupující do dálky, příboj, travnatý útes s kvítím, zídky a ovce */
    pobrezi: function(F, r){
      const q = nahoda(F.sem + 29);
      let o = nebe(F, "#8CACD4", "#EEE9DC") + mraky(F, r, 4, 28, 70, 85) + rasy(F, r, 3, 14, 30) + ptaci(F, r, 4, 60, 70);
      o += voda(F, r, "M-10 138 L410 136 L410 256 L-10 256 Z", "#8AAEC8", "#3E6E90", 140, 250, 26);
      /* útes: travnatá plošina, světlá skalní stěna se svislými rýhami, pěna u paty */
      const utes = function(x0, yt, yb, stena, zelen, op){
        const hr = clenit([[x0, yb], [x0 + 3, yt + (yb - yt) * .4], [x0 + 6, yt + 2], [x0 + 16, yt], [x0 + 80, yt - 4], [x0 + 200, yt - 6], [430, yt - 8]], q, .15, .05, 3);
        const d = cesta(hr) + " L430 " + yb + " Z";
        const sv = cesta(clenit([[x0, yb], [x0 + 3, yt + (yb - yt) * .4], [x0 + 6, yt + 3], [x0 + 16, yt + 2], [x0 + 16 + (yb - yt) * .9, yt + 3], [x0 + 20 + (yb - yt) * 1.3, yb]], q, .2, .06, 3)) + " Z";
        let o = kryt(F, d) + vrstva(F, d, mix(zelen, "#FFFFFF", .15), mix(zelen, "#1E2E1A", .2), op) + kryt(F, sv) + vrstva(F, sv, mix(stena, "#FFFFFF", .2), stena, op);
        let ry = ""; for (let i = 0; i < 8; i++) { const x = x0 + 4 + q() * (yb - yt) * 1.2; ry += tah("M" + f1(x) + " " + f1(yt + 4 + q() * 4) + " l" + f1((q() - .2) * 3) + " " + f1((yb - yt) * (.3 + q() * .5)), mix(stena, "#1B2230", .4), .5, .4); }
        return o + laz(F, "M" + f1(x0 + 10 + (yb - yt) * .5) + " " + (yt + 3) + " L" + f1(x0 + 16 + (yb - yt) * .9) + " " + (yt + 3) + " L" + f1(x0 + 20 + (yb - yt) * 1.3) + " " + yb + " L" + f1(x0 + 8 + (yb - yt) * .7) + " " + yb + " Z", mix(stena, "#2A3040", .5), .3) +
          skupina(F, F.stetec, ry + tah("M" + f1(x0 - 12) + " " + f1(yb + 1) + " q" + f1((yb - yt) * .8) + " -3 " + f1((yb - yt) * 1.6 + 20) + " 0", "#FFFFFF", 1.4, .8));
      };
      o += utes(40, 128, 142, mix("#C8C0B0", F.opar, .5), mix("#8EAA7A", F.opar, .5), .7) + utes(150, 132, 162, mix("#D6D0C0", F.opar, .25), mix("#86AA6E", F.opar, .25), .82) + utes(236, 150, 212, "#DCD6C6", "#7EA45E", .92);
      let zidky = ""; for (let i = 0; i < 3; i++) zidky += tah("M" + (300 + i * 40) + " " + (144 - i * 2) + " Q" + (310 + i * 42) + " 170 " + (304 + i * 46) + " 200", "#6E6A58", .9, .5);
      o += skupina(F, F.stetec, zidky) + dum(F, q, 330, 150, 30, 9, { typ: "dosky", stena: "#FBFAF6", strecha: "#A8905A", okna: 2, okenice: null, rh: 10, komin: "#D8D4CC" }) + nanes(F, "M343 150 l0 -6 l3 0 l0 6 z", "#C8402E");
      let ovce = ""; for (let i = 0; i < 7; i++) { const x = 290 + q() * 110, y = 156 + q() * 44, s2 = .7 + (y - 156) / 60; ovce += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3.2 * s2) + '" ry="' + f1(2.1 * s2) + '" fill="#F7F4EC"/><circle cx="' + f1(x + 3 * s2) + '" cy="' + f1(y - .5) + '" r="' + f1(.9 * s2) + '" fill="#3A3A3A"/>'; }
      o += '<g filter="url(#' + F.jemna + ')">' + ovce + '</g>';
      let pena = ""; for (let i = 0; i < 16; i++) pena += tah("M" + f1(q() * 230) + " " + f1(160 + q() * 90) + " q8 -2 16 0", "#FFFFFF", 1.1, .7);
      o += skupina(F, F.stetec, pena);
      const tr = "M-10 256 L-10 232 Q60 222 130 234 Q170 240 190 256 Z";
      o += kryt(F, tr) + vrstva(F, tr, "#94B86A", "#5E8A42", .92) + trava(F, r, 80, 230, 254, ["#5E8A42", "#88A857", "#4B7236"]);
      let kv = ""; for (let i = 0; i < 30; i++) kv += '<circle cx="' + f1(q() * 170) + '" cy="' + f1(234 + q() * 20) + '" r="' + f1(.8 + q()) + '" fill="' + ["#E890B8", "#D878A8", "#F2B8D0", "#F4F0E4"][i % 4] + '"/>';
      return o + '<g opacity=".9" filter="url(#' + F.jemna + ')">' + kv + '</g>';
    },
    /* Středomoří: modré moře, městečko na kopci, cypřiše, olivy na terasách, pinie */
    stredomori: function(F, r){
      const q = nahoda(F.sem + 41);
      let o = nebe(F, "#62A0DC", "#F5E9CC") + rasy(F, r, 3, 18, 40) + mrak(F, r, 110, 58, 60);
      o += hrebeny(F, [[128, 5, 60, 1, "#8C9CB8", .55]]);
      o += voda(F, r, "M-10 134 L410 132 L410 256 L-10 256 Z", "#5E9ED0", "#1F6AA8", 136, 250, 26);
      /* kopec s městečkem: macchie, terasy s olivami, domy v řadách nad sebou */
      const kop = "M96 256 Q150 214 200 170 Q250 124 300 108 Q350 100 420 114 L420 256 Z";
      o += kryt(F, kop) + vrstva(F, kop, "#B8B47A", "#8A8A52", .9);
      let mac = ""; for (let i = 0; i < 90; i++) { const x = 120 + q() * 300, yk = x < 300 ? 256 - (x - 96) * .72 : 108 + (x - 300) * .05, y = yk + 6 + q() * (250 - yk);
        if (y < 256) mac += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(1.5 + q() * 2.5) + '" ry="' + f1(1 + q() * 1.5) + '" fill="' + ["#5E6E3E", "#6E7A46", "#4E5E36"][i % 3] + '"/>'; }
      o += '<g opacity=".7" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + mac + '</g>';
      let domy = [], rr = nahoda(F.sem + 5);
      for (let rada = 0; rada < 5; rada++) { const y = 124 + rada * 11, x0 = 262 - rada * 6, n = 5 + rada;
        for (let i = 0; i < n; i++) domy.push([x0 + i * (17 - rada) + rr() * 4, y + rr() * 3]); }
      let zd = "", st = "", sn = "", ok = "";
      domy.forEach(function(d){ const x = d[0], y = d[1], w = 8 + rr() * 5, h = 6 + rr() * 5;
        zd += "M" + f1(x) + " " + f1(y) + " l0 " + f1(-h) + " l" + f1(w) + " 0 l0 " + f1(h) + " z ";
        sn += "M" + f1(x + w * .62) + " " + f1(y) + " l0 " + f1(-h) + " l" + f1(w * .38) + " 0 l0 " + f1(h) + " z ";
        st += "M" + f1(x - .8) + " " + f1(y - h) + " l" + f1(w / 2 + .8) + " -2.6 l" + f1(w / 2 + .8) + " 2.6 z ";
        if (rr() < .8) ok += "M" + f1(x + 2) + " " + f1(y - h * .6) + " l1.3 0 l0 2 l-1.3 0 z "; });
      o += jem(F, zd, "#FBF6EC", .97) + laz(F, sn, "#D8C8AC", .5) + jem(F, st, "#C8643E", .9) + jem(F, ok, "#4A4A5A", .75);
      o += jem(F, "M318 112 l0 -30 l8 0 l0 30 z", "#F6F0E4", .97) + laz(F, "M323 112 l0 -30 l3 0 l0 30 z", "#CDBEA2", .5) + jem(F, "M317.5 82 l4.5 -9 l4.5 9 z", "#B85A3A", .9) + jem(F, "M320 90 l2 -3 l2 3 l0 3 l-4 0 z", "#5A4A40", .8);
      [[248, 146, 40], [258, 138, 34], [392, 150, 44], [404, 156, 52], [226, 170, 46]].forEach(function(c){ o += cypris(F, q, c[0], c[1], c[2]); });
      for (let k = 0; k < 3; k++) { const y = 196 + k * 22; o += skupina(F, F.stetec, tah("M" + f1(250 - k * 40) + " " + f1(y + 2) + " Q330 " + f1(y - 4) + " 420 " + f1(y + 1), "#9A8A68", 1, .5));
        for (let i = 0; i < 6 + k; i++) o += oliva(F, q, 262 - k * 36 + i * 26 + q() * 8, y, .75 + k * .15); }
      /* pinie na skalce vlevo */
      const sk = "M-10 256 L-10 222 Q30 208 70 216 Q100 222 118 256 Z";
      o += kryt(F, sk) + vrstva(F, sk, "#C8B48A", "#8E7A56", .92);
      o += skupina(F, F.stetec, tah("M52 220 C54 196 60 176 70 158", "#5E4A3E", 3.4, .9) + tah("M66 168 C58 160 48 156 38 154 M68 162 C78 156 88 154 98 152", "#5E4A3E", 1.6, .85));
      o += koruny(F, q, 20, 120, 152, .6, "#3E6440", .9, F.jemna) + koruny(F, q, 30, 108, 144, .55, "#4A7048", .9, F.jemna) + koruny(F, q, 44, 96, 138, .45, "#5A8054", .85, F.jemna);
      o += trava(F, r, 70, 218, 254, ["#8A7E48", "#A99A5A", "#6E6A3C"]);
      let lev = ""; for (let i = 0; i < 40; i++) { const x = q() * 120, y = 224 + q() * 30; lev += tah("M" + f1(x) + " " + f1(y) + " l" + f1((q() - .5) * 1.5) + " " + f1(-3 - q() * 3), ["#9A6AC8", "#B88AD8", "#7E5AB0"][i % 3], 1.3, .85); }
      return o + skupina(F, F.stetec, lev);
    },
    /* hory: Alpy, Kavkaz, Zagros – zasněžené štíty, louky, smrky; varianta „suche“ bez lesů */
    hory: function(F, r, v){
      const suche = v === "suche";
      let o = nebe(F, "#6A9AD4", "#EFEADF") + mraky(F, r, 3, 24, 60, 70) + rasy(F, r, 2, 12, 26);
      o += hory(F, r, [[-10, 118], [40, 68], [100, 50], [150, 90], [210, 42], [270, 88], [320, 58], [410, 100]], 170, "#98A6BE", "#66769A", 76);
      o += hrebeny(F, [[150, 12, 50, 2, suche ? "#BCA87A" : "#7FA35E", .15]]);
      if (!suche) { o += lesik(F, r, 150, 410, 172, 1, "#3C5B43", true); for (let i = 0; i < 9; i++) o += jehlicnan(F, r, 200 + i * 20 + r() * 8, 186 + r() * 8, 1 + r() * .4, "#34503C"); }
      else for (let i = 0; i < 12; i++) o += strom(F, r, 160 + r() * 240, 176 + r() * 14, .7, "#7C8450");
      o += hrebeny(F, [[196, 6, 70, 4, suche ? "#CDB77E" : "#98BC66", 0]]);
      o += domky(F, r, 40, 206, 3, suche ? "#A0643E" : "#7A5236");
      o += trava(F, r, 200, 200, 252, suche ? ["#9A8A52", "#B09C5E", "#7E7040"] : ["#5F8D40", "#7FA84E", "#4A7432"]);
      return o + (suche ? "" : kvety(F, r, 30, 204, 250, ["#F4F0E4", "#E8D56A", "#8E7FC8"], .9));
    },
    /* Himálaj: ledovce s modrými stíny, terasová políčka, praporky ne – jen krajina */
    velehory: function(F, r){
      let o = nebe(F, "#5A8ACC", "#E8EFF6") + rasy(F, r, 4, 10, 36) + mraky(F, r, 2, 110, 124, 90);
      o += hory(F, r, [[0, 150], [40, 104], [92, 56], [132, 94], [178, 32], [236, 90], [284, 60], [336, 102], [400, 82], [410, 150]], 160, "#B4C0D6", "#7688AE", 72);
      o += hrebeny(F, [[148, 14, 45, 1, "#6E8B6A", .2], [174, 8, 60, 3, "#8FA567", .05]]);
      o += terasy(F, r, 176, 7, 6, 7, 55, 2.2, ["#9DB060", "#C4C476", "#88A452", "#B6B86A", "#A4B45E"], "#6E6250");
      /* nepálská vesnice: cihlové domy s vyřezávanými okny, patrový chrám pagoda, modlitební praporky */
      const q = nahoda(F.sem + 499);
      o += vesnice(F, q, [[30, 188, 20, 14, { typ: "sedlo", stena: "#A85A44", bok: "#6E3A2E", strecha: "#6E6A68", patra: 2, okna: 2, okno: "#3A2420", rh: 6 }], [54, 190, 18, 12, { typ: "sedlo", stena: "#B8664A", bok: "#6E3A2E", strecha: "#6E6A68", patra: 2, okna: 2, okno: "#3A2420", rh: 6 }]]);
      o += pagoda(F, 100, 190, 1.1, { patra: 3, stena: "#8A3A2A", strecha: "#5A4A40" }) + praporky(F, 120, 150, 200, 166, 1);
      return o + hrebeny(F, [[222, 5, 70, 5, "#8A9A52", 0]]) + trava(F, r, 150, 224, 252, ["#6F7F40", "#8E9A52", "#5A6A34"]);
    },
    /* poušť: duny s ostrými hřbety, hory v oparu, oáza; varianta „kanon“ = červené stolové hory (Navajové) */
    poust: function(F, r, v){
      const q = nahoda(F.sem + 31);
      if (v === "kanon") {
        let o = nebe(F, "#86B2DC", "#F6E2C6") + rasy(F, r, 3, 16, 44) + mraky(F, r, 2, 44, 64, 70);
        /* stolová hora: svislé stěny, rovné temeno, suťové svahy, vrstvy pískovce */
        const butte = function(x, y, w, h, b, op){
          const top = y - h, obr = clenit([[x - w * 1.9, y], [x - w * 1.3, y - h * .26], [x - w * 1.04, y - h * .4], [x - w, top + 3], [x - w * .96, top], [x + w * .95, top + 1], [x + w, top + 3], [x + w * 1.04, y - h * .42], [x + w * 1.32, y - h * .24], [x + w * 1.9, y]], q, .12, .05, 3), d = cesta(obr) + " Z";
          let o = kryt(F, d) + vrstva(F, d, mix(b, "#FFFFFF", .14), mix(b, "#3A1A0E", .1), op || .92);
          o += vrstva(F, "M" + f1(x + w * .45) + " " + f1(top + 1) + " L" + f1(x + w) + " " + f1(top + 3) + " L" + f1(x + w * 1.04) + " " + f1(y - h * .42) + " L" + f1(x + w * 1.32) + " " + f1(y - h * .24) + " L" + f1(x + w * 1.9) + " " + y + " L" + f1(x + w * .8) + " " + y + " L" + f1(x + w * .58) + " " + f1(y - h * .4) + " Z", mix(b, "#2A0E08", .4), mix(b, "#2A0E08", .2), .5);
          let s = "";
          for (let i = 1; i < 7; i++) { const yy = top + h * .6 * i / 7 + (q() - .5) * 3; s += tah(cesta(clenit([[x - w * 1.01, yy], [x + w * 1.03, yy + (q() - .5) * 2]], q, 0, .06, 3)), i % 2 ? mix(b, "#FFE8C8", .45) : mix(b, "#3A1A0E", .3), .4 + q() * .6, .28); }
          for (let i = 0; i < 4; i++) { const xx = x - w + q() * w * 2, yy = top + 2 + q() * h * .3; s += tah("M" + f1(xx) + " " + f1(yy) + " l" + f1((q() - .5) * 2) + " " + f1(5 + q() * 10), mix(b, "#2A0E08", .4), .4, .25); }
          for (let i = 0; i < 12; i++) { const lev = i % 2, xx = lev ? x - w * (1.05 + q() * .7) : x + w * (1.05 + q() * .7), yy = y - h * (.05 + q() * .3);
            s += tah("M" + f1(xx) + " " + f1(yy) + " l" + f1(lev ? -4 - q() * 5 : 4 + q() * 5) + " " + f1(4 + q() * 6), mix(b, "#2A0E08", .3), .5, .35); }
          return o + skupina(F, F.stetec, s);
        };
        o += butte(40, 158, 16, 40, mix("#C88A6A", F.opar, .5), .75) + butte(372, 160, 14, 50, mix("#C88A6A", F.opar, .5), .75);
        o += hrebeny(F, [[160, 3, 90, 0, "#DCAA80", .3]]);
        o += butte(120, 176, 26, 84, "#BC6A48") + butte(170, 176, 7, 58, "#B4603E") + butte(292, 180, 34, 70, "#C4704C");
        o += duna(F, r, 196, 6, 70, 2, "#E0A474", "#A45A38") + duna(F, r, 222, 5, 60, 4, "#D8945E", "#9A5030");
        /* pelyňkové keříky: shluk drobných skvrn */
        let ker = ""; for (let i = 0; i < 34; i++) { const x = q() * W, y = 198 + Math.pow(q(), .8) * 52, s2 = .5 + (y - 198) / 40;
          for (let k = 0; k < 4; k++) ker += '<ellipse cx="' + f1(x + (q() - .5) * 5 * s2) + '" cy="' + f1(y - q() * 2 * s2) + '" rx="' + f1((1 + q() * 1.2) * s2) + '" ry="' + f1((.7 + q() * .8) * s2) + '" fill="' + ["#7E8A62", "#96A078", "#6A7650", "#8A9468"][k] + '"/>'; }
        o += '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + ker + '</g>';
        return o + trava(F, r, 80, 214, 252, ["#9A8A5A", "#B0A06A", "#7E6E42"]);
      }
      let o = nebe(F, "#92B8DA", "#F6E4C4") + rasy(F, r, 2, 18, 40);
      o += hory(F, r, [[-10, 150], [40, 130], [90, 120], [140, 134], [200, 112], [262, 130], [330, 118], [410, 138]], 150, mix("#C6A48E", F.opar, .45), mix("#A07A6A", F.opar, .3), 0, .14);
      o += duna(F, r, 150, 7, 55, 1, "#ECC48E", "#C08A5A");
      o += duna(F, r, 170, 12, 48, 3.2, "#E8B880", "#B4764A");
      /* oáza: palmy, keře a jezírko v úžlabí */
      o += koruny(F, q, 40, 150, 190, .45, "#5E8440") + vrstva(F, "M58 196 Q100 190 142 196 Q100 202 58 196 Z", "#8EC0C8", "#4E8EA0", .9);
      [[62, .7], [84, .95], [108, .75], [130, .6]].forEach(function(p){ o += palma(F, r, p[0], 194, p[1] * .75, "#4E7A3A"); });
      o += duna(F, r, 206, 14, 60, 5, "#EAB67A", "#B06C3C");
      return o + ptaci(F, r, 2, 300, 60);
    },
    /* Sahel: suchá savana, baobab, kulaté chýše s ohradou, nízké stolové hory, nízké slunce */
    sahel: function(F, r){
      const q = nahoda(F.sem + 47);
      let o = nebe(F, "#A0BEDA", "#F6DCB0") + rasy(F, r, 2, 26, 46) + slunce(F, 316, 118, 11, "#EE9A56");
      o += hrebeny(F, [[146, 2, 90, 1, "#C4AE8A", .45]]);
      [[60, 30, 12], [150, 22, 8], [350, 40, 14]].forEach(function(m){ const d = "M" + (m[0] - m[1]) + " 150 L" + (m[0] - m[1] * .7) + " " + (150 - m[2]) + " L" + (m[0] + m[1] * .7) + " " + (150 - m[2]) + " L" + (m[0] + m[1]) + " 150 Z"; o += vrstva(F, d, mix("#B89A7A", F.opar, .45), mix("#9A7A5E", F.opar, .4), .7, F.mokra); });
      o += hrebeny(F, [[152, 2, 70, 2, "#D8BC84", .15], [176, 3, 80, 3.5, "#D4B076", .05]]);
      o += koruny(F, q, -10, 410, 156, .3, mix("#8A8A52", F.opar, .3), .7, F.jemna);
      o += akacie(F, q, 230, 162, .45) + akacie(F, q, 380, 166, .55);
      let ohr = ""; for (let x = 238; x < 350; x += 2.2 + q()) ohr += tah("M" + f1(x) + " " + f1(190 + Math.sin(x / 20) * 2) + " l" + f1((q() - .5) * 1.4) + " " + f1(-5 - q() * 3), "#7A6040", .6, .7);
      o += chyse(F, q, 262, 184, 1.1) + chyse(F, q, 292, 180, .95) + chyse(F, q, 318, 186, 1.2) + skupina(F, F.stetec, ohr);
      o += baobab(F, q, 100, 214, 1.25);
      o += hrebeny(F, [[222, 4, 70, 4, "#CDA464", 0]]);
      let keriky = ""; for (let i = 0; i < 20; i++) { const x = q() * W, y = 196 + q() * 50, s2 = .6 + (y - 196) / 40;
        for (let k = 0; k < 4; k++) keriky += '<ellipse cx="' + f1(x + (q() - .5) * 6 * s2) + '" cy="' + f1(y - q() * 3 * s2) + '" rx="' + f1((1.2 + q() * 1.5) * s2) + '" ry="' + f1((.8 + q()) * s2) + '" fill="' + ["#7E7A42", "#9A9050", "#6A6A38", "#8A8A48"][k] + '"/>'; }
      o += '<g opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply">' + keriky + '</g>';
      return o + trava(F, r, 240, 200, 254, ["#A8894A", "#C4A45A", "#8F7A40", "#D8BC72"]);
    },
    /* východní Afrika: savana, akácie, žirafy, hora se sněhem; varianta „zelena“ = zelené kopce s políčky, chýše, banánovníky */
    savana: function(F, r, v){
      const q = nahoda(F.sem + 59), zelena = v === "zelena";
      let o = nebe(F, "#82ACD8", "#F4E2BC") + mraky(F, r, 3, 30, 70, 80) + rasy(F, r, 2, 14, 30) + ptaci(F, r, 3, 60, 50);
      if (!zelena) {
        o += hory(F, r, [[-10, 164], [80, 156], [140, 128], [178, 108], [202, 101], [224, 99], [246, 101], [274, 116], [332, 146], [410, 162]], 162, mix("#A8B4CC", F.opar, .25), mix("#7C8AAE", F.opar, .2), 124, .05);
        o += mlha(F, 146, 164, .5) + hrebeny(F, [[160, 2, 80, 1, "#C9B26A", .3], [174, 3, 90, 2, "#D8BD6E", .1]]);
        o += akacie(F, q, 90, 172, .5) + akacie(F, q, 150, 168, .35) + akacie(F, q, 330, 170, .45);
        /* žirafy: dlouhý krk, šikmý hřbet, tenké nohy */
        const zirafa = function(x, y, s, sm){ const b = "#C08A48", t = "#7A5230";
          const d = "M" + f1(x) + " " + f1(y - 14 * s) + " q" + f1(sm * 7 * s) + " " + f1(-3 * s) + " " + f1(sm * 12 * s) + " " + f1(1.5 * s) + " l" + f1(sm * .5 * s) + " " + f1(3.5 * s) + " q" + f1(-sm * 6 * s) + " " + f1(1 * s) + " " + f1(-sm * 12.5 * s) + " " + f1(-.5 * s) + " z";
          const k = "M" + f1(x + sm * 11 * s) + " " + f1(y - 12.5 * s) + " l" + f1(sm * 5 * s) + " " + f1(-14 * s) + " l" + f1(sm * 3.4 * s) + " " + f1(-.6 * s) + " l" + f1(sm * 1.4 * s) + " " + f1(1.6 * s) + " l" + f1(-sm * 2.4 * s) + " " + f1(.6 * s) + " l" + f1(-sm * 4.6 * s) + " " + f1(13.6 * s) + " z";
          let n = ""; [[.5, 0], [2.5, 0], [9.5, 1.5], [11.5, 1.5]].forEach(function(p){ n += tah("M" + f1(x + sm * p[0] * s) + " " + f1(y - 11 * s + p[1] * s) + " l" + f1(sm * .3 * s) + " " + f1(11 * s - p[1] * s), t, .9 * s, .9); });
          let sk = ""; for (let i = 0; i < 7; i++) sk += '<circle cx="' + f1(x + sm * (1.5 + i * 1.5) * s) + '" cy="' + f1(y - 13.5 * s + (i % 2) * 1.2 * s) + '" r="' + f1(.55 * s) + '"/>';
          return jem(F, d + " " + k, b, .92) + skupina(F, F.stetec, n) + '<g fill="' + t + '" opacity=".6">' + sk + '</g>'; };
        o += zirafa(214, 190, 1.1, 1) + zirafa(250, 192, .95, -1);
        o += hrebeny(F, [[206, 4, 70, 4, "#C9A457", 0]]) + akacie(F, q, 318, 216, 1.45);
        return o + trava(F, r, 280, 204, 254, ["#A88A3E", "#C4A24E", "#8C7A36", "#D8BC66"]);
      }
      o += hrebeny(F, [[118, 12, 40, 1, "#7E9A7A", .55], [136, 10, 36, 2.4, "#7E9E62", .3]]) + mlha(F, 130, 146, .4);
      o += hrebeny(F, [[154, 12, 44, 4, "#8AAE5A", .1]]);
      o += terasy(F, r, 164, 5, 5, 9, 44, 4.2, ["#A8C468", "#8EB458", "#C4C472", "#7EA84E", "#B4BE64"], "#6E7A3A");
      o += chyse(F, q, 120, 172, .9) + chyse(F, q, 140, 176, .75) + akacie(F, q, 300, 180, .7);
      for (let i = 0; i < 5; i++) { const x = 20 + i * 18 + q() * 6, y = 212 + q() * 6;
        o += skupina(F, F.stetec, tah("M" + f1(x) + " " + f1(y) + " l" + f1((q() - .5) * 2) + " -16", "#6E7A48", 2, .9));
        [-2.2, -1.6, -1, -.5, -2.7].forEach(function(u){ o += list(F, x, y - 15, 16 + q() * 6, u, "#5E9A48"); }); }
      o += hrebeny(F, [[218, 4, 70, 4, "#7FA04C", 0]]);
      return o + trava(F, r, 200, 214, 254, ["#5F8A3A", "#7EA04A", "#4A7430"]) + kvety(F, r, 14, 224, 252, ["#F0D060", "#F4F0E4"], .9);
    },
    /* prales: vrstvy korun v mlze, řeka, obří listy; „baobab“ = alej baobabů (Madagaskar), „cenote“ = krasová studna (Yucatán) */
    prales: function(F, r, v){
      const q = nahoda(F.sem + 53);
      if (v === "baobab") {
        let o = nebe(F, "#98B4D0", "#F6D6AE") + slunce(F, 206, 136, 12, "#F2A860") + rasy(F, r, 3, 30, 70);
        o += hrebeny(F, [[146, 3, 80, 1, "#9AA07A", .5]]) + koruny(F, q, -10, 410, 148, .45, mix("#7E8A5A", F.opar, .45), .7);
        o += vrstva(F, "M-10 250 L-10 148 L410 148 L410 250 Z", "#D8B070", "#B88A52", .85);
        o += vrstva(F, "M200 148 L212 148 L300 256 L110 256 Z", "#D69468", "#B4643E", .85) + skupina(F, F.stetec, tah("M204 150 L168 250", "#E8B488", 1, .4) + tah("M208 150 L250 250", "#9A5434", .8, .4));
        [[176, 158, .42], [236, 158, .42], [160, 170, .62], [254, 170, .62], [130, 190, .95], [290, 192, .95], [70, 226, 1.5], [350, 230, 1.5]].forEach(function(b){ o += baobab(F, q, b[0], b[1], b[2]); });
        return o + trava(F, r, 160, 200, 252, ["#A08A4A", "#B89E5A", "#7E7A3E", "#8A9848"]);
      }
      let o = nebe(F, "#9DBAD0", "#EEEEDC") + mraky(F, r, 3, 34, 64, 90);
      o += hrebeny(F, [[108, 14, 40, 1, "#7E9A8A", .6]]) + mlha(F, 104, 126, .55);
      o += pas(F, q, 136, .7, mix("#6E9A70", F.opar, .45)) + mlha(F, 128, 146, .5);
      /* vysoké stromy nad korunami */
      [[96, 108, .7], [300, 100, .8]].forEach(function(t){ o += skupina(F, F.stetec, tah("M" + t[0] + " 160 L" + (t[0] + 2) + " " + t[1], "#E6E0CE", 2.2 * t[2], .9) + tah("M" + (t[0] + 1) + " " + (t[1] + 5) + " q-8 -2 -16 -7 M" + (t[0] + 1) + " " + (t[1] + 4) + " q8 -3 17 -8", "#D8D0BC", 1.2, .8)) +
        koruny(F, q, t[0] - 26 * t[2], t[0] + 26 * t[2], t[1] - 2, t[2] * .8, "#6A9A5E", .85, F.jemna) + koruny(F, q, t[0] - 20 * t[2], t[0] + 20 * t[2], t[1] + 3, t[2] * .7, "#5A8A56", .85, F.jemna); });
      o += pas(F, q, 160, 1, "#4E8450");
      if (v === "cenote") {
        const d = "M-20 256 L-20 176 L420 176 L420 256 Z";
        o += kryt(F, d) + vrstva(F, d, "#7EA462", "#4E7A44", .9);
        const c = F.id + "cn";
        const okraj = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; okraj.push([200 + Math.cos(a) * 146, 214 + Math.sin(a) * 32]); }
        okraj.push(okraj[0]);
        const obr = cesta(clenit(okraj, q, .1, .25, 3)) + " Z";
        o += '<defs><clipPath id="' + c + '"><path d="' + obr + '"/></clipPath></defs><g clip-path="url(#' + c + ')">' +
          vrstva(F, "M40 170 L360 170 L360 222 L40 222 Z", "#D6C8A6", "#8E7E62", .95) + vrstva(F, "M40 216 Q200 208 360 216 L360 260 L40 260 Z", "#5ECCC4", "#1E7E8E", .95) + '</g>';
        let st = ""; for (let i = 0; i < 26; i++) { const x = 64 + q() * 272; st += tah("M" + f1(x) + " " + f1(184 + q() * 6) + " l" + f1((q() - .5) * 2) + " " + f1(10 + q() * 16), "#7A6A52", .5, .4); }
        for (let i = 0; i < 12; i++) { const y = 196 + i * 1.8 + (q() - .5) * 2; st += tah("M60 " + f1(y) + " Q200 " + f1(y - 4) + " 340 " + f1(y), i % 3 ? "#A89878" : "#EEE4CC", .5, .3); }
        for (let i = 0; i < 7; i++) { const x = 90 + q() * 220, l = 10 + q() * 26, y = 184 + q() * 3; st += tah("M" + f1(x) + " " + f1(y) + " q" + f1((q() - .5) * 8) + " " + f1(l / 2) + " " + f1((q() - .5) * 4) + " " + f1(l), "#3E6A36", .6, .75);
          for (let k = 0; k < 4; k++) st += '<ellipse cx="' + f1(x + (q() - .5) * 4) + '" cy="' + f1(y + l * (.2 + k * .2)) + '" rx="1.4" ry=".9" fill="#4E7E40" opacity=".8"/>'; }
        for (let i = 0; i < 12; i++) st += tah("M" + f1(90 + q() * 220) + " " + f1(222 + q() * 18) + " q10 -1 20 0", "#E8FFFA", .8, .6);
        o += skupina(F, F.stetec, st) + skupina(F, F.stetec, '<path d="' + obr + '" fill="none" stroke="#3E4A30" stroke-width="1.2" opacity=".5"/>');
        o += koruny(F, q, 50, 350, 186, .6, "#5E8A4E", .85, F.jemna) + koruny(F, q, -10, 70, 236, 1, "#3E7040") + koruny(F, q, 330, 410, 236, 1, "#3E7040");
      } else {
        o += pas(F, q, 192, 1.1, "#4E8450");
        const d = "M192 182 Q206 181 214 183 Q232 194 224 208 Q214 226 262 258 L118 258 Q160 232 170 210 Q180 194 192 182 Z";
        o += kryt(F, d) + voda(F, r, d, "#C6CCAE", "#728A6C", 186, 250, 9);
        o += koruny(F, q, 150, 186, 200, .55, "#4E8250", .8, F.jemna) + koruny(F, q, 220, 250, 206, .55, "#4E8250", .8, F.jemna);
        o += palma(F, r, 318, 226, 1.05, "#2F6A3A") + palma(F, r, 82, 230, .85, "#2F6A3A");
      }
      [[-6, 256, 86, -.95, "#3E7A3E"], [-10, 250, 70, -.45, "#4E8A44"], [8, 256, 64, -1.35, "#356E38"], [406, 256, 90, -2.2, "#3E7A3E"], [410, 248, 66, -2.7, "#4E8A44"], [392, 256, 60, -1.8, "#356E38"]].forEach(function(l){ o += list(F, l[0], l[1], l[2], l[3], l[4]); });
      return o + trava(F, r, 60, 230, 252, ["#3E6E34", "#5E8A42"]);
    },
    /* rýžové terasy: zatopená políčka odrážejí nebe, zelené meze, palmy v oparu; varianta „caj“ = čajové svahy */
    ryze: function(F, r, v){
      const q = nahoda(F.sem + 91);
      let o = nebe(F, "#96BADC", "#F2EAD4") + mraky(F, r, 3, 30, 64, 70) + rasy(F, r, 2, 14, 30);
      o += hrebeny(F, [[112, 14, 50, 1, "#8EA2B4", .6], [132, 10, 40, 2.5, "#7FA27A", .4]]) + mlha(F, 124, 144, .5);
      if (v === "caj") {
        o += koruny(F, q, -10, 410, 146, .5, mix("#5E8A56", F.opar, .3), .8);
        o += duna(F, r, 150, 8, 60, 1.5, "#A8CC78", "#7EA456").replace(/stroke="#FFF6E2"/, 'stroke="#F0F6D0"');
        for (let i = 0; i < 13; i++) { const y = 156 + i * 7.5 + i * i * .35; o += radaKeru(F, q, y, 8 + i * .3, 60, 1.5, .7 + i * .09, "#4E8A3E"); }
        [[110, 190, .9], [270, 176, .8], [360, 206, 1.1]].forEach(function(t){ o += skupina(F, F.stetec, tah("M" + t[0] + " " + t[1] + " l1 -" + f1(34 * t[2]), "#6A5646", 1.2 * t[2], .9)) + koruny(F, q, t[0] - 16 * t[2], t[0] + 16 * t[2], t[1] - 32 * t[2], .5 * t[2], "#557E48", .75); });
        return o + mlha(F, 146, 160, .3);
      }
      [[40, .5], [70, .42], [300, .5], [340, .46], [372, .4]].forEach(function(p){ o += palma(F, r, p[0], 150, p[1], mix("#4E7A4A", F.opar, .35)); });
      o += koruny(F, q, -10, 410, 152, .45, mix("#6E9A60", F.opar, .35), .75);
      let meze = "", sazenice = "", odlesky = "";
      for (let i = 0; i < 10; i++) {
        const a = 152 + i * 7 * (1 + i * .1), b = 152 + (i + 1) * 7 * (1 + (i + 1) * .1), zatopene = i % 3 !== 1, amp = 7 + i * .6, per = 38, fz = 1.2 + i * .05;
        const hor = [], dol = [];
        for (let x = -10; x <= W + 10; x += 5) { hor.push([x, vyska(x, a, amp, per, fz)]); dol.unshift([x, vyska(x, b, amp, per, fz)]); }
        const d = cesta(hor.concat(dol)) + " Z";
        o += kryt(F, d) + (zatopene ? vrstva(F, d, "#E4ECF0", "#9CBCD2", .8) : vrstva(F, d, "#B4D478", "#7EAA4E", .85));
        meze += tah(hrana(b, amp, per, fz), "#5E8A3A", 1.4 + i * .25, .75) + tah(hrana(b - 1.4 - i * .12, amp, per, fz), "#C8E08A", .6 + i * .08, .55);
        for (let k = 0; k < (zatopene ? 34 : 60); k++) { const x = q() * W, y = vyska(x, a + (b - a) * (.2 + q() * .7), amp, per, fz);
          if (zatopene) { if (k < 10) odlesky += tah("M" + f1(x) + " " + f1(y) + " l" + f1(8 + q() * 16) + " 0", "#FFFFFF", .6, .6); else sazenice += tah("M" + f1(x) + " " + f1(y) + " l0 -" + f1(1 + i * .25), "#6E9A3E", .5 + i * .05, .55); }
          else sazenice += tah("M" + f1(x) + " " + f1(y) + " l" + f1((q() - .5) * 1.5) + " -" + f1(1.5 + i * .35), "#5E8A34", .6 + i * .06, .6); }
      }
      o += skupina(F, F.stetec, odlesky + sazenice + meze);
      o += palma(F, r, 338, 226, 1.05, "#3F7A3E") + palma(F, r, 372, 234, .8, "#3F7A3E");
      return o + list(F, -6, 256, 70, -.8, "#4E8A44") + list(F, 4, 256, 56, -1.3, "#3E7A3E");
    },
    /* krasové věže nad řekou v mlze (jižní Čína, Vietnam) */
    kras: function(F, r){
      let o = nebe(F, "#A6BACF", "#F2EEE2") + rasy(F, r, 3, 14, 40);
      const q = nahoda(F.sem + 77);
      const obrys = function(x, y, w, h){ return clenit([[x - w, y], [x - w * 1.02, y - h * .3], [x - w * .86, y - h * .66], [x - w * .55, y - h * .92], [x - w * .12, y - h], [x + w * .3, y - h * .96], [x + w * .66, y - h * .8], [x + w * .9, y - h * .5], [x + w * 1.02, y - h * .22], [x + w, y]], q, .22, .05, 3); };
      const vez = function(x, y, w, h, barva, op, filtr){ const d = cesta(obrys(x, y, w, h)) + " Z"; return (filtr ? "" : kryt(F, d)) + vrstva(F, d, mix(barva, "#FFFFFF", .2), mix(barva, "#1C2A1C", .1), op, filtr); };
      /* velká věž zblízka: zeleň na temeni a římsách, holá skála, stinná strana */
      const velka = function(x, y, w, h){
        const obr = obrys(x, y, w, h), d = cesta(obr) + " Z";
        let top = 0; obr.forEach(function(p, i){ if (p[1] < obr[top][1]) top = i; });
        let o = kryt(F, d) + vrstva(F, d, "#8EAE80", "#56765A", .9);
        let skala = ""; for (let i = 0; i < 4; i++) { const sx = x + (q() - .5) * w * 1.3, sy = y - h * (.2 + q() * .55), sw = w * (.12 + q() * .14), sh = h * (.18 + q() * .22);
          skala += cesta(clenit([[sx - sw, sy + sh], [sx - sw * .8, sy], [sx, sy - sh * .3], [sx + sw * .9, sy + sh * .1], [sx + sw, sy + sh]], q, .3, .1, 2)) + " Z "; }
        o += laz(F, skala, "#B4B0A0", .4);
        const zebro = clenit([[obr[top][0], obr[top][1]], [x + w * .12, y - h * .6], [x + w * .2, y]], q, .4, .05, 3);
        o += vrstva(F, cesta(obr.slice(top)) + " " + cesta(zebro.slice().reverse()).replace(/^M/, "L") + " Z", "#3E5A4A", "#5E7A70", .42);
        let ryhy = ""; for (let i = 0; i < 10; i++) { const sx = x + (q() - .5) * w * 1.5, sy = y - h * (.3 + q() * .6);
          ryhy += tah(cesta(clenit([[sx, sy], [sx + (q() - .5) * 3, sy + 8 + q() * 20]], q, .5, 0, 2)), "#4A5244", .5, .4); }
        o += skupina(F, F.stetec, ryhy);
        o += koruny(F, q, x - w * .55, x + w * .5, y - h + 7, .34, "#6E9A5A", .8, F.jemna) + koruny(F, q, x - w * .45, x + w * .35, y - h + 12, .3, "#6E9A5A", .7, F.jemna) +
          koruny(F, q, x - w * .95, x - w * .4, y - h * .52, .3, "#6E9A5A", .75, F.jemna) + koruny(F, q, x + w * .3, x + w * .9, y - h * .3, .3, "#648E52", .75, F.jemna);
        return o;
      };
      [[20, 30, 70], [74, 20, 92], [126, 26, 62], [176, 18, 98], [232, 28, 74], [286, 20, 100], [342, 24, 70], [392, 22, 88]].forEach(function(t){ o += vez(t[0], 170, t[1], t[2], mix("#9AABBC", F.opar, .5), .62, F.mokra); });
      o += mlha(F, 140, 172, .55);
      [[48, 26, 66], [150, 22, 80], [250, 30, 58], [372, 26, 74]].forEach(function(t){ o += vez(t[0], 182, t[1], t[2], mix("#7E9A88", F.opar, .3), .8); o += koruny(F, q, t[0] - t[1] * .5, t[0] + t[1] * .5, 182 - t[2] + 6, .28, mix("#6E9A60", F.opar, .3), .6, F.jemna); });
      o += mlha(F, 166, 186, .5);
      o += voda(F, r, "M-10 184 L410 183 L410 250 L-10 250 Z", "#AECACE", "#5E8E98", 188, 248, 18);
      o += velka(84, 190, 38, 124) + velka(318, 190, 44, 102);
      o += '<g transform="matrix(1 0 0 -.55 0 294.5)" opacity=".22">' + vez(84, 190, 38, 124, "#56765A", .9) + vez(318, 190, 44, 102, "#56765A", .9) + '</g>';
      o += mlha(F, 184, 196, .35);
      o += jem(F, "M170 222 L226 222 L220 227 L176 227 Z", "#5A4430", .9) + skupina(F, F.stetec, tah("M198 222 L203 200", "#5A4430", 1, .9) + tah("M198 220 L172 204", "#5A4430", .5, .6) + tah("M160 230 q30 -2 70 0", "#FFFFFF", .8, .5));
      return o + ptaci(F, r, 3, 200, 70);
    },
    /* step: tráva do obzoru, nízké kopce, jurty a koně */
    step: function(F, r){
      let o = nebe(F, "#78A8DE", "#F0E8D0") + mraky(F, r, 5, 26, 70, 80) + rasy(F, r, 2, 12, 24);
      o += hory(F, r, [[-10, 140], [60, 118], [110, 126], [170, 108], [240, 130], [300, 114], [360, 124], [410, 118]], 140, mix("#A8B0C4", F.opar, .35), mix("#7E88A4", F.opar, .3), 116, .1);
      o += hrebeny(F, [[140, 8, 90, 1, "#9AA888", .4], [158, 5, 100, 2, "#B8BE78", .15]]);
      /* řeka meandruje stepí */
      const rk = "M150 160 Q190 158 210 164 Q240 172 180 180 Q120 190 170 204 Q230 220 190 256 L150 256 Q180 222 130 206 Q80 190 150 176 Q190 168 160 164 Z";
      o += kryt(F, rk) + voda(F, r, rk, "#C4D8E6", "#8EB0CC", 162, 250, 6);
      for (let i = 0; i < 3; i++) { const x = 230 + i * 44, y = 192, s = 1.5;
        const d = "M" + f1(x - 14 * s) + " " + y + " L" + f1(x - 14 * s) + " " + f1(y - 11 * s) + " Q" + x + " " + f1(y - 22 * s) + " " + f1(x + 14 * s) + " " + f1(y - 11 * s) + " L" + f1(x + 14 * s) + " " + y + " Z";
        o += jem(F, d, "#F6F2E8", .97) + laz(F, "M" + x + " " + y + " L" + x + " " + f1(y - 16 * s) + " Q" + f1(x + 8 * s) + " " + f1(y - 16 * s) + " " + f1(x + 14 * s) + " " + f1(y - 11 * s) + " L" + f1(x + 14 * s) + " " + y + " Z", "#C8BCA4", .45) +
          skupina(F, F.stetec, tah("M" + f1(x - 14 * s) + " " + f1(y - 11 * s) + " Q" + x + " " + f1(y - 22 * s) + " " + f1(x + 14 * s) + " " + f1(y - 11 * s), "#8A7A60", .9, .8) + tah("M" + f1(x - 14 * s) + " " + f1(y - 5 * s) + " L" + f1(x + 14 * s) + " " + f1(y - 5 * s), "#B85A3A", 1.2, .7)) +
          jem(F, "M" + (x - 4) + " " + y + " l0 -10 l8 0 l0 10 z", "#B84A32", .9); }
      let kone = ""; for (let i = 0; i < 6; i++) { const x = 44 + i * 24 + r() * 10, y = 216 + r() * 8, b = ["#6E5038", "#8A6A48", "#4A3A2A"][i % 3];
        kone += '<path d="M' + f1(x) + " " + f1(y) + " l1.5 -7 l12 0 l2.5 -4 l2.5 .5 l-1 5 l0 5.5 l-1.6 0 l0 -4.5 l-11 0 l-1 4.5 z" + '" fill="' + b + '"/>'; }
      o += '<g filter="url(#' + F.jemna + ')" opacity=".92">' + kone + '</g>';
      return o + trava(F, r, 280, 190, 252, ["#8A9A48", "#A4B058", "#76883E", "#C0C070"]) + kvety(F, r, 18, 200, 250, ["#E8D56A", "#F4F0E4"], .8);
    },
    /* sopka nad jezerem nebo mořem (Japonsko, Chile, Guatemala, Mexiko); varianta „dve“ = dvě sopky */
    sopka: function(F, r, v){
      let o = nebe(F, "#86AED8", "#F2E6D4") + rasy(F, r, 4, 14, 46) + mrak(F, r, 318, 58, 64);
      if (v === "dve") o += hory(F, r, [[160, 170], [240, 150], [284, 116], [306, 98], [313, 96.5], [320, 96], [342, 118], [390, 148], [430, 166]], 164, mix("#9AA6C0", F.opar, .35), mix("#6E7C9C", F.opar, .25), 0, .07);
      const hora = [[-10, 164], [40, 160], [100, 142], [140, 116], [168, 90], [186, 70], [195, 64], [203, 63.4], [211, 62.8], [226, 80], [256, 112], [300, 140], [360, 158], [410, 164]];
      o += hory(F, r, hora, 164, "#98A2BC", "#5A6688", 118, .06);
      o += mlha(F, 136, 152, .45) + hrebeny(F, [[154, 6, 50, 1, "#6E8E62", .25]]) + lesik(F, r, -10, 410, 160, .8, "#3E5E3E");
      o += voda(F, r, "M-10 164 L410 162 L410 216 L-10 218 Z", "#A4BED6", "#4E7CA6", 166, 212, 16);
      o += '<g transform="matrix(1 0 0 -.5 0 246)" opacity=".3">' + hory(F, r, hora, 164, "#98A2BC", "#5A6688", 118, .06) + '</g>';
      o += hrebeny(F, [[222, 5, 70, 4, "#789C58", 0]]);
      for (let i = 0; i < 6; i++) o += strom(F, r, 250 + i * 22 + r() * 6, 234 + r() * 6, 1.25, "#4E7A44");
      return o + trava(F, r, 150, 222, 252, ["#5E8A42", "#7EA24E", "#4A7234"]) + kvety(F, r, 16, 228, 250, ["#F0B8C8", "#F4F0E4"], .9);
    },
    /* Andy: vysoké hory, terasy s kamennými zídkami; varianta „jezero“ = jezero na náhorní plošině */
    andy: function(F, r, v){
      let o = nebe(F, "#5A8ED4", "#F0E8D8") + rasy(F, r, 3, 12, 40) + mraky(F, r, 2, 60, 80, 60);
      o += hory(F, r, [[-10, 130], [50, 64], [110, 94], [170, 48], [230, 86], [300, 56], [360, 88], [410, 78]], 170, "#A2A6B8", "#727894", 72);
      if (v === "jezero") { o += voda(F, r, "M-10 170 L410 168 L410 206 L-10 210 Z", "#6A9ACC", "#2E6AA4", 172, 204, 14) + hrebeny(F, [[212, 4, 80, 3, "#BCA878", 0]]);
        let rakos = ""; for (let i = 0; i < 40; i++) { const x = r() * W; rakos += tah("M" + f1(x) + " " + f1(214 + r() * 6) + " l" + f1((r() - .5) * 3) + " -" + f1(8 + r() * 8), "#8A8A4A", .8, .8); }
        o += skupina(F, F.stetec, rakos); }
      else { o += hrebeny(F, [[160, 12, 50, 2, "#8E9A62", .05]]);
        o += terasy(F, r, 170, 8, 6.5, 9, 48, 1.3, ["#A8A860", "#C8B878", "#8E9C56", "#BCAE6E", "#9AA45C"], "#6A5E4A"); }
      return o + trava(F, r, 140, 214, 252, ["#8A8A4A", "#A8A258", "#6E703A"]);
    },
    /* ostrovy v oceánu: sopečný ostrov s žebrovanými svahy, mraky na vrcholu, laguna za útesem, pláž s palmami */
    ostrovy: function(F, r){
      const q = nahoda(F.sem + 67);
      let o = nebe(F, "#76AEE4", "#F2E8D0") + rasy(F, r, 2, 16, 32) + mraky(F, r, 2, 40, 70, 70) + ptaci(F, r, 3, 260, 44);
      o += hrebeny(F, [[134, 5, 50, 1, "#8EA8B8", .55]]);
      const ostrov = [[90, 150], [140, 128], [170, 98], [196, 74], [214, 64], [230, 70], [250, 86], [268, 80], [290, 96], [320, 126], [360, 150]];
      o += hory(F, r, ostrov, 150, "#78A870", "#4E7A5A", 0, .14);
      o += mrak(F, r, 214, 70, 52) + mrak(F, r, 262, 82, 40);
      o += koruny(F, q, 96, 356, 150, .4, "#4E8450", .85, F.jemna);
      o += voda(F, r, "M-10 150 L410 150 L410 256 L-10 256 Z", "#3E94C0", "#1E6494", 152, 200, 14);
      /* útes s příbojem, za ním tyrkysová laguna */
      o += skupina(F, F.stetec, tah(cesta(clenit([[-10, 178], [120, 174], [260, 176], [410, 170]], q, 0, .06, 4)), "#FFFFFF", 2.2, .85) + tah(cesta(clenit([[-10, 181], [140, 177], [300, 179], [410, 173]], q, 0, .06, 4)), "#FFFFFF", .8, .6));
      o += kryt(F, "M-10 181 L410 174 L410 256 L-10 256 Z") + vrstva(F, "M-10 181 L410 174 L410 256 L-10 256 Z", "#8EE0D6", "#3EAEBE", .8);
      let sv = ""; for (let i = 0; i < 16; i++) { const x = q() * W, y = 186 + q() * 40; sv += tah("M" + f1(x) + " " + f1(y) + " q" + f1(6 + q() * 8) + " -1.5 " + f1(14 + q() * 14) + " 0", "#E8FFFA", .8, .6); }
      o += skupina(F, F.stetec, sv);
      const pl = "M-10 256 L-10 214 Q80 204 170 222 Q220 232 250 256 Z";
      o += kryt(F, pl) + vrstva(F, pl, "#F6ECCA", "#DCC494", .95) + jem(F, "M-10 214 Q80 204 170 222 Q220 232 250 256 L242 256 Q212 234 166 226 Q80 210 -10 219 Z", "#FFFFFF", .8);
      o += laz(F, "M-10 222 Q80 214 160 230 Q200 240 220 256 L-10 256 Z", "#C8AC7C", .25);
      let st = ""; [[48, 234], [98, 240]].forEach(function(p){ st += '<ellipse cx="' + (p[0] + 18) + '" cy="' + (p[1] + 2) + '" rx="22" ry="2.6"/>'; });
      o += '<g fill="#A89060" opacity=".35" filter="url(#' + F.mokra + ')" style="mix-blend-mode:multiply">' + st + '</g>';
      return o + palma(F, r, 48, 236, 1.2) + palma(F, r, 98, 242, .9) + palma(F, r, 150, 236, .7) + kvety(F, r, 10, 236, 252, ["#C8A070", "#FFFFFF"], .8);
    },
    /* Arktida: nízké slunce, zasněžené hory, ledové kry s modrými stíny, zasněžený břeh */
    tundra: function(F, r){
      const q = nahoda(F.sem + 71);
      let o = nebe(F, "#9EB0D6", "#F7DCC0") + rasy(F, r, 4, 20, 80) + slunce(F, 250, 138, 13, "#F2B07A");
      o += hory(F, r, [[-10, 150], [40, 128], [90, 110], [130, 126], [170, 116], [210, 136], [260, 142], [330, 124], [380, 112], [410, 120]], 150, "#C6CEE0", "#8A9ABE", 150, .1);
      o += voda(F, r, "M-10 150 L410 150 L410 256 L-10 256 Z", "#7E92B4", "#3E5878", 154, 250, 18);
      let tr = ""; for (let i = 0; i < 14; i++) { const y = 154 + i * i * .5, w = 6 + i * 2.2; tr += tah("M" + f1(250 - w / 2 + (q() - .5) * 6) + " " + f1(y) + " l" + f1(w) + " 0", "#FFE4CC", .8 + i * .08, .75); }
      o += skupina(F, F.stetec, tr);
      /* kra: tabulový nebo špičatý led, osvětlený vršek, modrá stinná stěna, odraz */
      const kra = function(x, y, w, h, spic){
        const top = spic ? clenit([[x, y], [x + w * .2, y - h * .6], [x + w * .45, y - h], [x + w * .6, y - h * .7], [x + w * .8, y - h * .5], [x + w, y]], q, .2, .1, 2)
                         : clenit([[x, y], [x + w * .04, y - h], [x + w * .5, y - h - 1], [x + w * .96, y - h], [x + w, y]], q, .1, .08, 2);
        const d = cesta(top) + " Z", st = "M" + f1(x + w * .55) + " " + f1(y - h * (spic ? .75 : 1)) + " " + cesta(top.filter(function(p){ return p[0] > x + w * .55; })).replace(/^M/, "L") + " L" + f1(x + w * .55) + " " + f1(y) + " Z";
        return jem(F, d, "#F6F8FC", .97) + laz(F, st, "#9EB2D4", .55) + laz(F, "M" + f1(x) + " " + f1(y - 1) + " L" + f1(x + w) + " " + f1(y - 1) + " L" + f1(x + w * .9) + " " + f1(y + h * .4) + " L" + f1(x + w * .1) + " " + f1(y + h * .4) + " Z", "#AFC4E0", .35) +
          skupina(F, F.stetec, tah("M" + f1(x - 3) + " " + f1(y + .5) + " L" + f1(x + w + 3) + " " + f1(y + .5), "#FFFFFF", .8, .7));
      };
      o += kra(24, 172, 60, 8, 0) + kra(140, 164, 34, 5, 0) + kra(300, 182, 70, 30, 1) + kra(200, 196, 50, 7, 0) + kra(60, 214, 90, 10, 0);
      const br = "M-10 256 L-10 232 Q140 218 260 236 Q330 244 410 230 L410 256 Z";
      o += jem(F, br, "#F6F8FC", .97) + laz(F, "M-10 256 L-10 242 Q140 234 260 248 L260 256 Z", "#AEBEDA", .45);
      let kam = ""; [[300, 238, 7], [322, 242, 4], [110, 236, 5]].forEach(function(k){ kam += "M" + (k[0] - k[2]) + " " + k[1] + " Q" + k[0] + " " + (k[1] - k[2]) + " " + (k[0] + k[2]) + " " + k[1] + " Z "; });
      return o + vrstva(F, kam, "#6E6A70", "#3E3A44", .9, F.jemna) + ptaci(F, r, 2, 120, 90);
    }
  };
  function sem(text){ let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 900000 + 1000; }
  const pamet = {};
  /* krajina = "druh" nebo "druh:varianta"; vrací SVG jako text (na jazyk jednou, pak z paměti) */
  function obraz(klic, krajina){
    if (!krajina) return "";
    if (pamet[klic]) return pamet[klic];
    const c = krajina.split(":"), druh = c[0], varianta = c[1] || null;
    if (!K[druh]) return "";
    const s = sem(klic), F = filtry(s);
    F.opar = "#E8ECF2";
    return (pamet[klic] = '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + F.defs +
      '</defs><g style="isolation:isolate">' + K[druh](F, nahoda(s), varianta) + '</g>' + vinetace(F) + '<rect width="' + W + '" height="' + H + '" filter="url(#' + F.papir + ')"/></svg>');
  }
  return { obraz: obraz, druhy: Object.keys(K) };
})();
