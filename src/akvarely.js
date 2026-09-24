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
    '<filter id="' + p + 's"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="' + (sem + 2) + '" result="n"/>' +
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
    let o = vrstva(F, d, horni, dolni, .85), p = "";
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
      o += domky(F, r, vx, vy, 7, "#B84E36", 11) + jem(F, "M" + f1(vx + 38) + " " + f1(vy - 6) + " l0 -24 l7 0 l0 24 z", "#F4EFE4", .97) + jem(F, "M" + f1(vx + 37) + " " + f1(vy - 30) + " l4.5 -14 l4.5 14 z", "#3F5A4A", .95);
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
        for (let i = 0; i < 5; i++) { const x = 250 + i * 28 + q() * 8, y = 214 + q() * 20; o += '<g filter="url(#' + F.jemna + ')" opacity=".9"><ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="5.5" ry="3" fill="#F4F0E6"/><path d="M' + f1(x - 3) + " " + f1(y - 2) + " l3 -.5 l2 2 l-3 1.5 z M" + f1(x + 1) + " " + f1(y + 1) + ' l3 -1 l1 2 l-3 .5 z" fill="#2E2A28"/><circle cx="' + f1(x + 5.5) + '" cy="' + f1(y - 1.5) + '" r="1.8" fill="#2E2A28"/></g>'; }
      } else {
        /* polní cesta k obzoru a stromořadí podél ní */
        o += kryt(F, "M226 148 L234 148 L300 256 L236 256 Z") + vrstva(F, "M226 148 L234 148 L300 256 L236 256 Z", "#E0D0A8", "#C0A880", .85) + skupina(F, F.stetec, tah("M229 150 L258 256", "#8EA858", 1.6, .5) + tah("M231 150 L276 256", "#8EA858", 1.2, .4));
        for (let i = 0; i < 9; i++) { const t = Math.pow(i / 8, 1.8), x = 238 + t * 110, y = 150 + t * 100, s2 = .25 + t * 1.5; o += strom(F, r, x + 4 * s2, y, s2, "#5E8440"); }
        o += domky(F, r, 70, 152, 3, "#A8483A", 9);
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
      o += domky(F, r, 300, 168, 4, "#A8403A") + jem(F, "M300 170 L360 170 L358 172 L302 172 Z", "#5A4A3A", .6);
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
      o += skupina(F, F.stetec, zidky) + domky(F, r, 340, 146, 2, "#5E5E68");
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
      o += domky(F, r, 40, 184, 3, "#8A3A2E") + strom(F, r, 120, 190, .8, "#5E7A40") + strom(F, r, 136, 192, .7, "#5E7A40");
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
