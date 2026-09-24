/* ---------- akvarely: malované krajiny na pohlednicích jazyků ----------
   Krajina podle toho, odkud jazyk pochází (data/krajiny.json), ne podle památek. Kreslí se v SVG jako akvarel:
   každá plocha je lazura s roztřepeným okrajem (šum posune obrys), zrnitým pigmentem a ztmavlým okrajem,
   plochy se násobí (mix-blend multiply), takže se prosvítají jako vrstvy barvy; bílá (sníh, pěna, domy)
   se kreslí normálně, jinak by zmizela. Náhodnost je daná jazykem, takže jazyk má vždy stejný obrázek. */
var AKVARELY = (function(){
  const W = 400, H = 250;
  let citac = 0;
  function nahoda(sem){ let s = sem % 2147483646 + 1; return function(){ return (s = (s * 16807) % 2147483647) / 2147483647; }; }
  function filtry(sem){
    const p = "a" + (++citac) + "_";
    return { lazura: p + "l", jemna: p + "j", stetec: p + "s", papir: p + "p", id: p, defs:
    '<filter id="' + p + 'l" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="' + sem + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="15" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="' + (sem + 7) + '" result="sk"/>' +
      '<feColorMatrix in="sk" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.45 1.12" result="skA"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="' + (sem + 3) + '" result="z"/>' +
      '<feColorMatrix in="z" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.5 1.15" result="zA"/>' +
      '<feComposite in="d" in2="skA" operator="in" result="d2"/><feComposite in="d2" in2="zA" operator="in" result="g"/>' +
      '<feMorphology in="d" operator="erode" radius="1.6" result="er"/><feComposite in="d" in2="er" operator="out" result="ok"/>' +
      '<feGaussianBlur in="ok" stdDeviation=".7" result="okB"/><feComponentTransfer in="okB" result="okT"><feFuncA type="linear" slope=".55"/></feComponentTransfer>' +
      '<feMerge><feMergeNode in="g"/><feMergeNode in="okT"/></feMerge></filter>' +
    '<filter id="' + p + 'j" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="3" seed="' + (sem + 11) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="' + (sem + 5) + '" result="z"/>' +
      '<feColorMatrix in="z" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.6 1.2" result="zA"/>' +
      '<feComposite in="d" in2="zA" operator="in"/></filter>' +
    '<filter id="' + p + 's"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="1" seed="' + (sem + 2) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2"/></filter>' +
    '<filter id="' + p + 'p" x="0" y="0" width="100%" height="100%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="4" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .28  0 0 0 .13 0"/></filter>' };
  }
  /* světlé barvy (sníh, křída, domy, pěna) se nesmí násobit, jinak zmizí: všechny složky aspoň 0xE0 */
  const BILA = { test: function(b){ return /^#[0-9a-f]{6}$/i.test(b) && [1, 3, 5].every(function(i){ return parseInt(b.substr(i, 2), 16) >= 0xE0; }); } };
  function hrbet(y0, amp, per, faze, dno, krok){
    dno = dno == null ? H : dno; krok = krok || 6;
    let d = "M-10 " + dno + " L-10 " + y0;
    for (let x = -10; x <= W + 10; x += krok) d += " L" + x + " " + vyska(x, y0, amp, per, faze).toFixed(1);
    return d + " L" + (W + 10) + " " + dno + " Z";
  }
  function vyska(x, y0, amp, per, faze){ return y0 + Math.sin(x / per + faze) * amp + Math.sin(x / (per * .41) + faze * 1.7) * amp * .35; }
  function plocha(F, filtr, d, barva, op){
    return '<path d="' + d + '" fill="' + barva + '" opacity="' + op + '" filter="url(#' + filtr + ')" style="mix-blend-mode:' + (BILA.test(barva) ? "normal" : "multiply") + '"/>';
  }
  const laz = function(F, d, b, op){ return plocha(F, F.lazura, d, b, op == null ? .8 : op); };
  const jem = function(F, d, b, op){ return plocha(F, F.jemna, d, b, op == null ? .88 : op); };
  function tah(F, d, barva, sirka, op){ return '<path d="' + d + '" stroke="' + barva + '" stroke-width="' + sirka + '" fill="none" stroke-linecap="round" opacity="' + (op == null ? .85 : op) + '" filter="url(#' + F.stetec + ')"/>'; }
  function nebe(F, horni, dolni){
    return '<defs><linearGradient id="' + F.id + 'n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + horni + '"/><stop offset="1" stop-color="' + dolni + '"/></linearGradient></defs>' +
      '<rect x="-20" y="-20" width="' + (W + 40) + '" height="' + (H * .78) + '" fill="url(#' + F.id + 'n)" opacity=".75" filter="url(#' + F.lazura + ')" style="mix-blend-mode:multiply"/>';
  }
  function mraky(F, r, n, y, barva){
    let o = "";
    for (let i = 0; i < n; i++) o += '<ellipse cx="' + (r() * W).toFixed(0) + '" cy="' + (y + r() * 26).toFixed(0) + '" rx="' + (45 + r() * 70).toFixed(0) + '" ry="' + (7 + r() * 6).toFixed(0) + '" fill="' + barva + '" opacity="' + (BILA.test(barva) ? .55 : .3) + '" filter="url(#' + F.lazura + ')" style="mix-blend-mode:' + (BILA.test(barva) ? "normal" : "multiply") + '"/>';
    return o;
  }
  function slunce(F, x, y, rr, barva){ return '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" fill="' + (barva || "#F2B880") + '" opacity=".7" filter="url(#' + F.lazura + ')" style="mix-blend-mode:multiply"/>'; }
  function strom(F, x, y, s, barvy, r){
    let o = tah(F, "M" + x + " " + y + " L" + (x + .5) + " " + (y - 12 * s), "#5A4632", 1.6 * s, .9);
    for (let k = 0; k < 3; k++) o += '<ellipse cx="' + (x + (r() - .5) * 8 * s).toFixed(1) + '" cy="' + (y - (14 + r() * 8) * s).toFixed(1) + '" rx="' + ((6 + r() * 3) * s).toFixed(1) + '" ry="' + ((5 + r() * 3) * s).toFixed(1) + '" fill="' + barvy[k % barvy.length] + '" opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply"/>';
    return o;
  }
  function jehlicnan(F, x, y, s, barva){ return jem(F, "M" + x + " " + (y - 30 * s) + " L" + (x + 7 * s) + " " + (y - 14 * s) + " L" + (x + 4 * s) + " " + (y - 14 * s) + " L" + (x + 9 * s) + " " + y + " L" + (x - 9 * s) + " " + y + " L" + (x - 4 * s) + " " + (y - 14 * s) + " L" + (x - 7 * s) + " " + (y - 14 * s) + " Z", barva, .9); }
  function palma(F, x, y, s, barva){
    let o = tah(F, "M" + x + " " + y + " Q" + (x + 8 * s) + " " + (y - 30 * s) + " " + (x + 3 * s) + " " + (y - 60 * s), "#6B5236", 3 * s, .9);
    const tx = x + 3 * s, ty = y - 60 * s;
    [[-34, 10], [-24, -8], [0, -16], [24, -6], [34, 12], [-8, 16]].forEach(function(v){ const dx = v[0], dy = v[1];
      o += jem(F, "M" + tx + " " + ty + " Q" + (tx + dx * .5 * s) + " " + (ty + (dy - 14) * s) + " " + (tx + dx * s) + " " + (ty + dy * s) + " Q" + (tx + dx * .45 * s) + " " + (ty + (dy - 6) * s) + " " + tx + " " + ty + " Z", barva || "#3F7A3E", .9); });
    return o;
  }
  function trava(F, r, n, y0, y1, barvy){
    let o = "";
    for (let i = 0; i < n; i++) { const x = r() * W, y = y0 + r() * (y1 - y0), h = 4 + r() * 8;
      o += tah(F, "M" + x.toFixed(1) + " " + y.toFixed(1) + " q" + ((r() - .5) * 3).toFixed(1) + " " + (-h * .6).toFixed(1) + " " + ((r() - .5) * 6).toFixed(1) + " " + (-h).toFixed(1), barvy[i % barvy.length], .8 + r(), .7); }
    return o;
  }
  function vlny(F, r, n, y0, y1, barva){
    let o = "";
    for (let i = 0; i < n; i++) { const y = y0 + r() * (y1 - y0), x = r() * 380; o += tah(F, "M" + x.toFixed(0) + " " + y.toFixed(0) + " q" + (10 + r() * 14).toFixed(0) + " -2 " + (24 + r() * 20).toFixed(0) + " 0", barva || "#FFFFFF", 1.3, .7); }
    return o;
  }
  function hory(F, body, dno, barva, stin, snih){
    let d = "M-10 " + dno; body.forEach(function(b){ d += " L" + b[0] + " " + b[1]; }); d += " L410 " + dno + " Z";
    let o = laz(F, d, barva, .88);
    for (let i = 1; i < body.length - 1; i++) { const b = body[i], n = body[i + 1];
      if (b[1] < body[i - 1][1] && b[1] < n[1]) o += laz(F, "M" + b[0] + " " + b[1] + " L" + n[0] + " " + n[1] + " L" + n[0] + " " + dno + " L" + (b[0] + 8) + " " + dno + " Z", stin, .5); }
    if (snih) body.filter(function(b){ return b[1] < snih; }).forEach(function(b){ const x = b[0], y = b[1];
      o += jem(F, "M" + (x - 22) + " " + (y + 28) + " L" + x + " " + y + " L" + (x + 24) + " " + (y + 28) + " L" + (x + 11) + " " + (y + 22) + " L" + (x + 3) + " " + (y + 30) + " L" + (x - 8) + " " + (y + 21) + " Z", "#FFFFFF", .95); });
    return o;
  }
  function domky(F, r, x0, y0, n, strecha){
    let o = "";
    for (let i = 0; i < n; i++) { const x = x0 + i * 12 + r() * 4, y = y0 + (r() - .5) * 4;
      o += jem(F, "M" + x + " " + y + " l0 -7 l10 0 l0 7 z", "#F6F1E6", .95) + jem(F, "M" + (x - 1.5) + " " + (y - 7) + " l6.5 -6 l6.5 6 z", strecha || "#C4553A", .9); }
    return o;
  }
  const papir = '<rect width="' + W + '" height="' + H + '" fill="#FBF7EE"/>';

  const K = {
    /* střední Evropa: zvlněná pole, remízky, vesnice s kostelíkem, vlčí máky */
    kopce: function(F, r){
      let o = papir + nebe(F, "#8FB4DE", "#F3E3C3") + mraky(F, r, 4, 16, "#FFFFFF") + mraky(F, r, 2, 30, "#C9D3E4");
      o += laz(F, hrbet(118, 7, 70, 1), "#9FB2C8", .75) + laz(F, hrbet(134, 9, 55, 2.5), "#8FAF6E", .8);
      const pole = ["#C9B15A", "#E3D06A", "#9DBB5E", "#B9C77A", "#D8B86A"];
      for (let i = 0; i < 9; i++) { const x = -20 + i * 50, a = vyska(x, 150, 10, 60, 4) - 2, b = vyska(x + 55, 150, 10, 60, 4) - 2;
        o += jem(F, "M" + x + " " + a + " L" + (x + 55) + " " + b + " L" + (x + 70) + " " + (b + 26) + " L" + (x + 8) + " " + (a + 30) + " Z", pole[i % pole.length], .7); }
      o += laz(F, hrbet(150, 10, 60, 4), "#7FA35A", .45);
      const vx = 230 + r() * 60, vy = vyska(vx, 150, 10, 60, 4) + 4;
      o += domky(F, r, vx, vy, 6) + jem(F, "M" + (vx + 36) + " " + (vy - 6) + " l0 -22 l6 0 l0 22 z", "#F2EDE2", .95) + jem(F, "M" + (vx + 35) + " " + (vy - 28) + " l4 -12 l4 12 z", "#3F5A4A", .95);
      for (let i = 0; i < 8; i++) o += strom(F, 20 + i * 24 + r() * 8, 186 + r() * 6, 1.1, ["#4E7A3A", "#6B9148", "#3E6431"], r);
      o += laz(F, hrbet(196, 6, 80, 5.5), "#8DB25E", .85) + trava(F, r, 160, 200, 250, ["#5D8A3C", "#7BA34E", "#4A7032"]);
      for (let i = 0; i < 28; i++) o += '<circle cx="' + (r() * W).toFixed(0) + '" cy="' + (205 + r() * 42).toFixed(0) + '" r="' + (1.4 + r() * 1.4).toFixed(1) + '" fill="#D2362B" opacity=".85" filter="url(#' + F.jemna + ')"/>';
      return o;
    },
    /* nížina: široká pole pod velkým nebem, stromořadí, větrný mlýn (Nizozemsko, Frísko) nebo slunečnice */
    rovina: function(F, r, v){
      let o = papir + nebe(F, "#7DA7D8", "#F1E6CC") + mraky(F, r, 6, 20, "#FFFFFF") + mraky(F, r, 3, 44, "#BCC8DC");
      o += laz(F, hrbet(150, 1.5, 90, 1), "#8FA7A0", .7);
      for (let i = 0; i < 14; i++) o += strom(F, 10 + i * 30 + r() * 8, 152, .6, ["#5C7F4A", "#72935A"], r);
      const pruhy = v === "slunecnice" ? ["#E7C63E", "#D9B435", "#8FAF5A"] : ["#A9C46A", "#D8C56A", "#8FB25C", "#C7B05E"];
      for (let i = 0; i < 6; i++) o += laz(F, "M-10 " + (156 + i * 16) + " L410 " + (154 + i * 16) + " L410 " + (172 + i * 16) + " L-10 " + (174 + i * 16) + " Z", pruhy[i % pruhy.length], .75);
      if (v === "slunecnice") for (let i = 0; i < 70; i++) { const x = r() * W, y = 200 + r() * 48; o += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (2.2 + r() * 1.5).toFixed(1) + '" fill="#E9B92F" opacity=".95" filter="url(#' + F.jemna + ')"/><circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="1" fill="#6B4A24"/>'; }
      if (v === "mlyn") { const x = 290, y = 150;
        o += jem(F, "M" + (x - 7) + " " + y + " L" + (x - 4) + " " + (y - 34) + " L" + (x + 4) + " " + (y - 34) + " L" + (x + 7) + " " + y + " Z", "#6E5A48", .95);
        [[-26, -18], [22, -20], [-20, 16], [18, 18]].forEach(function(k){ o += tah(F, "M" + x + " " + (y - 34) + " l" + k[0] + " " + k[1], "#5A4838", 2.4, .9); });
        o += tah(F, "M20 196 L380 194", "#6C8FB8", 3, .6); }
      return o + trava(F, r, 90, 226, 250, ["#6D8C45", "#8BA457"]);
    },
    /* severský les: jezero, jehličnany, březový břeh */
    les: function(F, r){
      let o = papir + nebe(F, "#9DB8D8", "#EEE6D2") + mraky(F, r, 3, 24, "#FFFFFF");
      o += laz(F, hrbet(128, 6, 60, 1), "#8FA0A8", .7);
      for (let i = 0; i < 26; i++) o += jehlicnan(F, i * 16 + r() * 8, 142 + r() * 6, .8 + r() * .4, "#3F5E4A");
      o += laz(F, "M-10 150 L410 148 L410 200 L-10 204 Z", "#6F93B4", .75) + vlny(F, r, 8, 158, 196, "#E9F0F6");
      for (let i = 0; i < 8; i++) o += jem(F, "M" + (i * 55 + r() * 20) + " " + (164 + r() * 30) + " l" + (18 + r() * 20) + " 0 l0 3 l-" + (18 + r() * 20) + " 0 z", "#3F5E4A", .25);
      o += laz(F, hrbet(206, 5, 70, 3), "#5E7F48", .85);
      for (let i = 0; i < 12; i++) o += jehlicnan(F, 250 + i * 14 + r() * 6, 214 + r() * 10, 1.2 + r() * .5, "#2F4B3A");
      for (let i = 0; i < 4; i++) { const x = 40 + i * 30 + r() * 10; o += tah(F, "M" + x + " 236 L" + (x + 2) + " 196", "#F3F0E8", 2.6, .95) + '<ellipse cx="' + (x + 2) + '" cy="194" rx="10" ry="12" fill="#9DBA5C" opacity=".8" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply"/>'; }
      return o + trava(F, r, 90, 216, 250, ["#607F44", "#809D55"]);
    },
    /* fjord: strmé skály do moře, sníh nahoře, domky u vody */
    fjordy: function(F, r){
      let o = papir + nebe(F, "#8DAAD0", "#EDE7DA") + mraky(F, r, 4, 20, "#FFFFFF");
      o += hory(F, [[-10, 120], [30, 70], [90, 60], [130, 100]], 170, "#7F8FA3", "#5E6D84", 80);
      o += hory(F, [[250, 110], [290, 56], [350, 64], [410, 96]], 170, "#7F8FA3", "#5E6D84", 76);
      o += laz(F, "M-10 110 L60 118 L120 170 L-10 170 Z", "#5D7A5A", .75) + laz(F, "M270 150 L330 120 L410 116 L410 170 L250 170 Z", "#5D7A5A", .75);
      o += laz(F, "M-10 168 L410 166 L410 250 L-10 250 Z", "#4E7394", .8) + vlny(F, r, 10, 176, 240, "#DCE6EF");
      o += laz(F, "M120 170 L260 170 L250 200 L140 204 Z", "#8FAEC8", .35);
      return o + domky(F, r, 300, 168, 4, "#B8443A");
    },
    /* atlantské pobřeží: zelené útesy, bílé skály, příboj, kamenné zídky */
    pobrezi: function(F, r){
      let o = papir + nebe(F, "#8FAFD6", "#EDE8DA") + mraky(F, r, 5, 18, "#FFFFFF") + mraky(F, r, 3, 40, "#C3CCDA");
      o += laz(F, "M-10 140 L410 138 L410 250 L-10 250 Z", "#4D7F9E", .8);
      o += laz(F, "M150 250 L150 150 Q220 120 300 128 Q360 132 410 124 L410 250 Z", "#8DB566", .9);
      o += jem(F, "M150 250 L150 150 L172 146 L186 162 L196 250 Z", "#F4F1E8", .97) + laz(F, "M178 250 L184 160 L196 150 L214 152 L222 250 Z", "#D8D2C2", .75);
      o += jem(F, "M150 150 L172 146 L196 150 L214 152 L214 156 L150 156 Z", "#6E9A50", .9);
      for (let i = 0; i < 5; i++) o += tah(F, "M" + (226 + i * 38) + " " + (138 - i * 2) + " Q" + (240 + i * 38) + " 190 " + (236 + i * 40) + " 250", "#4E7038", 2.2, .7);
      for (let i = 0; i < 7; i++) o += '<ellipse cx="' + (240 + r() * 160).toFixed(0) + '" cy="' + (160 + r() * 70).toFixed(0) + '" rx="3" ry="2" fill="#F5F2EA" opacity=".95" filter="url(#' + F.jemna + ')"/>';
      o += vlny(F, r, 14, 150, 245, "#FFFFFF") + jem(F, "M120 246 Q138 236 150 246 Z", "#FFFFFF", .9);
      o += domky(F, r, 300, 136, 2, "#6A6A72");
      return o + trava(F, r, 70, 150, 250, ["#5E8A42", "#88A857"]);
    },
    /* Středomoří: modré moře, olivy, cypřiše, bílé domky na svahu */
    stredomori: function(F, r){
      let o = papir + nebe(F, "#6FA6DC", "#F4E7C8") + mraky(F, r, 2, 20, "#FFFFFF");
      o += laz(F, hrbet(126, 6, 80, 1), "#A8B4C4", .7);
      o += laz(F, "M-10 140 L410 138 L410 196 L-10 200 Z", "#2E7DB5", .8) + vlny(F, r, 10, 146, 190, "#FFFFFF");
      o += laz(F, "M-10 250 L-10 170 Q90 150 190 176 Q260 196 410 186 L410 250 Z", "#B9A56A", .85);
      o += domky(F, r, 40, 172, 7, "#D8A067");
      for (let i = 0; i < 3; i++) { const x = 250 + i * 22; o += jem(F, "M" + x + " 200 Q" + (x - 6) + " 170 " + x + " 142 Q" + (x + 6) + " 170 " + x + " 200 Z", "#3C5A3A", .9); }
      for (let i = 0; i < 9; i++) o += strom(F, 20 + i * 44 + r() * 10, 234 + r() * 8, 1.2, ["#7E8E5E", "#98A36E", "#6C7C52"], r);
      return o + trava(F, r, 70, 216, 250, ["#8A7E48", "#A99A5A"]);
    },
    /* hory: Alpy, Kavkaz, Zagros – zasněžené štíty, louky, smrky */
    hory: function(F, r, v){
      const suche = v === "suche";
      let o = papir + nebe(F, "#6E9ED6", "#EEE9DE") + mraky(F, r, 3, 22, "#FFFFFF");
      o += hory(F, [[-10, 120], [40, 70], [100, 52], [150, 92], [210, 44], [270, 90], [320, 60], [410, 100]], 170, "#9AA8C0", "#6F7F9E", 76);
      o += laz(F, hrbet(150, 12, 50, 2), suche ? "#B9A676" : "#7FA35E", .85);
      if (!suche) for (let i = 0; i < 16; i++) o += jehlicnan(F, 180 + i * 14 + r() * 6, 170 + r() * 12, .9 + r() * .4, "#3C5B43");
      o += laz(F, hrbet(196, 6, 70, 4), suche ? "#C8B27A" : "#96BA64", .85);
      o += domky(F, r, 40, 206, 3, "#7A5236");
      return o + trava(F, r, 120, 204, 250, suche ? ["#9A8A52", "#B09C5E"] : ["#5F8D40", "#7FA84E"]);
    },
    /* Himálaj: ledovce s modrými stíny, terasy */
    velehory: function(F, r){
      let o = papir + nebe(F, "#5F8FD0", "#E6EEF5") + mraky(F, r, 3, 30, "#FFFFFF");
      o += hory(F, [[0, 150], [40, 104], [92, 58], [132, 96], [178, 36], [236, 92], [284, 62], [336, 104], [400, 84], [410, 150]], 160, "#B7C3D6", "#7C8FB2", 70);
      o += laz(F, hrbet(150, 14, 45, 1), "#6E8B6A", .85) + laz(F, hrbet(176, 8, 60, 3), "#8FA567", .8);
      for (let i = 0; i < 7; i++) o += tah(F, "M" + (120 + i * 6) + " " + (190 + i * 8) + " Q260 " + (178 + i * 8) + " 410 " + (192 + i * 8), "#6E7F48", 1.4, .6);
      return o + laz(F, hrbet(206, 6, 70, 5), "#A7B06A", .8) + trava(F, r, 90, 212, 250, ["#6F7F40", "#8E9A52"]);
    },
    /* poušť: duny, stolová hora, oáza s datlovníky; varianta „kanon“ = červené stolové hory (Navajové) */
    poust: function(F, r, v){
      const kanon = v === "kanon";
      let o = papir + nebe(F, "#9CC0E0", "#F6E4C2");
      o += laz(F, "M250 150 L268 " + (kanon ? 92 : 118) + " L330 " + (kanon ? 90 : 116) + " L350 150 Z", kanon ? "#B8664A" : "#D6A57E", .8);
      if (kanon) o += laz(F, "M60 150 L72 110 L120 108 L130 150 Z", "#C27456", .75);
      o += laz(F, hrbet(150, 3, 90, 0), kanon ? "#D69A6E" : "#E9C28C", .8);
      o += laz(F, "M-10 250 L-10 170 Q80 128 170 160 Q250 186 410 146 L410 250 Z", kanon ? "#CF8A5C" : "#E3AE6B", .85);
      o += laz(F, "M170 160 Q250 186 410 146 L410 172 Q290 200 170 176 Z", "#B06E35", .45);
      o += laz(F, "M-10 250 L-10 204 Q120 176 240 198 Q330 212 410 186 L410 250 Z", kanon ? "#C07A50" : "#D99A55", .85);
      o += tah(F, "M-10 170 Q80 128 170 160", "#FFF3DC", 2, .7);
      if (!kanon) [[78, 1], [100, .8], [60, .7]].forEach(function(p){ o += palma(F, p[0], 204, p[1] * .7, "#4E7A3A"); });
      else for (let i = 0; i < 20; i++) o += '<circle cx="' + (r() * W).toFixed(0) + '" cy="' + (212 + r() * 34).toFixed(0) + '" r="' + (2 + r() * 2).toFixed(1) + '" fill="#7C8A5A" opacity=".8" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply"/>';
      return o;
    },
    /* Sahel: suchá savana, baobab, řeka s lodičkami nebo stáda */
    sahel: function(F, r){
      let o = papir + nebe(F, "#A7C2DA", "#F5DDB0") + slunce(F, 300, 96, 22, "#F0B060");
      o += laz(F, hrbet(150, 2, 90, 1), "#C9B58A", .7) + laz(F, hrbet(168, 3, 80, 2), "#D9B878", .85);
      o += laz(F, "M-10 196 Q200 186 410 200 L410 214 Q200 202 -10 212 Z", "#7FA0B0", .6);
      const x = 110, y = 198;
      o += jem(F, "M" + (x - 12) + " " + y + " Q" + (x - 10) + " " + (y - 30) + " " + (x - 6) + " " + (y - 44) + " L" + (x + 6) + " " + (y - 44) + " Q" + (x + 10) + " " + (y - 30) + " " + (x + 12) + " " + y + " Z", "#8A6A52", .9);
      [[-30, -58], [-14, -66], [8, -68], [28, -60], [36, -50]].forEach(function(k){ o += tah(F, "M" + x + " " + (y - 42) + " Q" + (x + k[0] * .4) + " " + (y + k[1] * .8) + " " + (x + k[0]) + " " + (y + k[1]), "#7A5C46", 2.2, .9) + '<ellipse cx="' + (x + k[0]) + '" cy="' + (y + k[1] - 3) + '" rx="10" ry="5" fill="#8C9A52" opacity=".75" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply"/>'; });
      o += laz(F, hrbet(222, 4, 70, 4), "#C9A060", .85);
      return o + trava(F, r, 160, 214, 250, ["#A8894A", "#C4A45A", "#8F7A40"]);
    },
    /* východní Afrika: savana, akácie, žirafy, hora se sněhem (Kilimandžáro) */
    savana: function(F, r, v){
      const zelena = v === "zelena";
      let o = papir + nebe(F, "#86B0DA", "#F2DFB8") + mraky(F, r, 4, 26, "#FFFFFF");
      if (!zelena) o += laz(F, "M110 150 Q170 90 205 86 Q240 90 300 150 Z", "#9AA7BE", .75) + jem(F, "M186 94 Q205 82 224 94 L216 100 L206 94 L196 101 Z", "#FFFFFF", .95);
      else o += laz(F, hrbet(130, 12, 40, 1), "#7E9A62", .8) + laz(F, "M-10 150 L410 146 L410 170 L-10 172 Z", "#7EA2B8", .6);
      o += laz(F, hrbet(150, 2, 80, 1), zelena ? "#9DB866" : "#C9B26A", .7) + laz(F, hrbet(166, 3, 90, 2), zelena ? "#8DAE58" : "#D8BD6E", .8) + laz(F, hrbet(200, 4, 70, 4), zelena ? "#7FA04C" : "#C9A457", .75);
      const akacie = function(x, y, s){ return tah(F, "M" + x + " " + y + " C" + x + " " + (y - 14 * s) + " " + (x - 2 * s) + " " + (y - 20 * s) + " " + (x - 7 * s) + " " + (y - 25 * s) + " M" + x + " " + (y - 11 * s) + " C" + (x + 4 * s) + " " + (y - 18 * s) + " " + (x + 7 * s) + " " + (y - 22 * s) + " " + (x + 10 * s) + " " + (y - 25 * s), "#4A3A2A", 1.8 * s, .9) +
        jem(F, "M" + (x - 24 * s) + " " + (y - 25 * s) + " Q" + x + " " + (y - 38 * s) + " " + (x + 26 * s) + " " + (y - 26 * s) + " Q" + x + " " + (y - 21 * s) + " " + (x - 24 * s) + " " + (y - 25 * s) + " Z", "#56703A", .9); };
      o += akacie(300, 196, 1.4) + akacie(90, 172, .8) + akacie(210, 168, .55);
      if (!zelena) [[150, 1], [170, .85]].forEach(function(p){ const x = p[0], s = p[1];
        o += jem(F, "M" + x + " 178 l" + 2 * s + " " + -16 * s + " l" + 6 * s + " 0 l" + 2 * s + " " + 16 * s + " l-2 0 l" + -s + " " + -10 * s + " l" + -6 * s + " 0 l" + -s + " " + 10 * s + " z M" + (x + 8 * s) + " 162 l" + 6 * s + " " + -14 * s + " l" + 3 * s + " 1 l" + -6 * s + " " + 14 * s + " z", "#B07A3A", .85); });
      return o + trava(F, r, 200, 196, 250, zelena ? ["#5F8A3A", "#7EA04A"] : ["#A88A3E", "#C4A24E", "#8C7A36"]);
    },
    /* tropický prales: řeka, obří stromy, palmy, mlha */
    prales: function(F, r, v){
      let o = papir + nebe(F, "#9FBCD4", "#EDEBD8") + mraky(F, r, 3, 40, "#FFFFFF");
      for (let i = 0; i < 18; i++) { const x = i * 24 + r() * 10, y = 120 + r() * 18; o += '<ellipse cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" rx="' + (16 + r() * 10).toFixed(0) + '" ry="' + (12 + r() * 6).toFixed(0) + '" fill="#6E9A68" opacity=".7" filter="url(#' + F.lazura + ')" style="mix-blend-mode:multiply"/>'; }
      o += laz(F, hrbet(140, 8, 30, 1, 190), "#4E7E4A", .8);
      o += laz(F, "M-10 250 L-10 170 L410 172 L410 250 Z", "#5E8A4E", .85);
      o += laz(F, "M-10 176 Q140 166 220 180 Q300 192 410 184 L410 214 Q300 222 200 206 Q100 196 -10 208 Z", v === "cenote" ? "#3E9AA0" : "#B39A66", .85);
      o += vlny(F, r, 5, 182, 206, v === "cenote" ? "#E0F2F0" : "#EFE4C8");
      for (let i = 0; i < 14; i++) { const x = r() * W, y = 218 + r() * 24; o += '<ellipse cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" rx="' + (18 + r() * 12).toFixed(0) + '" ry="' + (10 + r() * 6).toFixed(0) + '" fill="' + ["#3E6E3E", "#5A8A48", "#2F5A36"][i % 3] + '" opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply"/>'; }
      o += palma(F, 330, 236, 1.1, "#2F6A3A") + palma(F, 50, 230, .9, "#2F6A3A");
      if (v === "baobab") { const x = 200, y = 200;
        o += jem(F, "M" + (x - 10) + " " + y + " L" + (x - 7) + " " + (y - 62) + " L" + (x + 7) + " " + (y - 62) + " L" + (x + 10) + " " + y + " Z", "#9A7A62", .95) + '<ellipse cx="' + x + '" cy="' + (y - 66) + '" rx="22" ry="8" fill="#5E7E42" opacity=".85" filter="url(#' + F.jemna + ')" style="mix-blend-mode:multiply"/>'; }
      return o;
    },
    /* rýžová pole: zatopené terasy odrážejí nebe, palmy, hory v oparu */
    ryze: function(F, r, v){
      let o = papir + nebe(F, "#9BBEDE", "#F1E9D2") + mraky(F, r, 3, 26, "#FFFFFF");
      o += laz(F, hrbet(120, 14, 50, 1, 180), "#9AAFB8", .7) + laz(F, hrbet(140, 10, 40, 2.5, 190), "#7FA27A", .75);
      if (v === "caj") for (let i = 0; i < 9; i++) o += tah(F, "M-10 " + (160 + i * 10) + " Q200 " + (150 + i * 10) + " 410 " + (164 + i * 10), "#4E7E3E", 3.2, .7);
      else for (let i = 0; i < 6; i++) { const y = 160 + i * 15;
        o += laz(F, "M-10 " + y + " Q200 " + (y - 8) + " 410 " + (y + 2) + " L410 " + (y + 12) + " Q200 " + (y + 4) + " -10 " + (y + 12) + " Z", i % 2 ? "#A9C8D8" : "#8DBA6A", .75) +
          tah(F, "M-10 " + (y + 12) + " Q200 " + (y + 4) + " 410 " + (y + 12), "#6F8A4A", 1.4, .7); }
      o += palma(F, 330, 214, 1, "#3F7A3E") + palma(F, 366, 222, .8, "#3F7A3E");
      return o + trava(F, r, 120, 214, 250, ["#6C9A42", "#8AB852"]);
    },
    /* krasové věže nad řekou (jižní Čína, Vietnam) */
    kras: function(F, r){
      let o = papir + nebe(F, "#A8BED6", "#EFEADA");
      const vez = function(x, w, h, barva, op){ return laz(F, "M" + (x - w) + " 180 Q" + (x - w * .9) + " " + (180 - h * .8) + " " + (x - w * .3) + " " + (180 - h) + " Q" + x + " " + (180 - h - 8) + " " + (x + w * .3) + " " + (180 - h) + " Q" + (x + w * .9) + " " + (180 - h * .8) + " " + (x + w) + " 180 Z", barva, op); };
      [[40, 26, 70], [110, 20, 90], [170, 30, 60], [240, 22, 96], [300, 28, 70], [370, 24, 84]].forEach(function(t){ o += vez(t[0], t[1], t[2], "#A6B6C2", .75); });
      [[70, 30, 60], [200, 26, 74], [330, 34, 64]].forEach(function(t){ o += vez(t[0], t[1], t[2], "#6F9270", .85); });
      o += laz(F, "M-10 176 L410 174 L410 250 L-10 250 Z", "#7FA6B8", .75) + vlny(F, r, 10, 184, 236, "#EAF2F4");
      o += jem(F, "M150 214 L200 214 L196 218 L154 218 Z", "#5A4430", .9) + tah(F, "M176 214 L180 196", "#5A4430", 1.2, .9);
      return o;
    },
    /* step: tráva do obzoru, nízké kopce, jurty */
    step: function(F, r){
      let o = papir + nebe(F, "#7FAEE0", "#EFE7CF") + mraky(F, r, 5, 20, "#FFFFFF");
      o += laz(F, hrbet(140, 8, 90, 1), "#A7B38A", .7) + laz(F, hrbet(160, 5, 100, 2), "#B8BE78", .8) + laz(F, hrbet(190, 4, 90, 4), "#A9B566", .8);
      for (let i = 0; i < 3; i++) { const x = 230 + i * 44, y = 192, s = 1.5;
        o += jem(F, "M" + (x - 14 * s) + " " + y + " L" + (x - 14 * s) + " " + (y - 11 * s) + " Q" + x + " " + (y - 22 * s) + " " + (x + 14 * s) + " " + (y - 11 * s) + " L" + (x + 14 * s) + " " + y + " Z", "#F5F1E7", .97) +
          tah(F, "M" + (x - 14 * s) + " " + (y - 11 * s) + " Q" + x + " " + (y - 22 * s) + " " + (x + 14 * s) + " " + (y - 11 * s), "#9A8A70", 1.2, .8) + jem(F, "M" + (x - 4) + " " + y + " l0 -10 l8 0 l0 10 z", "#C4553A", .9); }
      for (let i = 0; i < 5; i++) { const x = 50 + i * 26 + r() * 10, y = 214 + r() * 8;
        o += jem(F, "M" + x + " " + y + " l2 -8 l14 0 l3 -5 l3 1 l-2 6 l0 6 l-2 0 l0 -5 l-12 0 l-1 5 z", "#6E5038", .9); }
      return o + trava(F, r, 180, 196, 250, ["#8A9A48", "#A4B058", "#76883E"]);
    },
    /* sopka nad jezerem nebo mořem (Japonsko, Chile, Guatemala, Mexiko) */
    sopka: function(F, r, v){
      let o = papir + nebe(F, "#86ADD8", "#F2E4CE") + mraky(F, r, 3, 26, "#FFFFFF");
      o += laz(F, "M90 160 Q170 70 200 62 Q230 70 310 160 Z", "#8E9CB8", .85) + jem(F, "M184 76 Q200 58 216 76 L208 86 L200 78 L192 88 Z", "#FFFFFF", .95);
      if (v === "dve") o += laz(F, "M250 160 Q300 100 320 98 Q340 100 390 160 Z", "#7F8FAE", .8);
      o += laz(F, hrbet(152, 8, 50, 1), "#6E8E62", .8);
      o += laz(F, "M-10 166 L410 164 L410 214 L-10 218 Z", "#5E8CB4", .8) + vlny(F, r, 8, 172, 210, "#EEF3F8");
      o += laz(F, "M130 166 L270 166 L262 196 L140 200 Z", "#A9B8CC", .35);
      o += laz(F, hrbet(222, 5, 70, 4), "#789C58", .85);
      for (let i = 0; i < 6; i++) o += strom(F, 250 + i * 22 + r() * 6, 232 + r() * 6, 1.2, ["#3E6A40", "#5A8A48"], r);
      return o + trava(F, r, 80, 222, 250, ["#5E8A42", "#7EA24E"]);
    },
    /* Andy: vysoké hory, terasy, jezero na náhorní plošině */
    andy: function(F, r, v){
      let o = papir + nebe(F, "#5E92D6", "#EFE6D6") + mraky(F, r, 2, 24, "#FFFFFF");
      o += hory(F, [[-10, 130], [50, 66], [110, 96], [170, 50], [230, 88], [300, 58], [360, 90], [410, 80]], 170, "#A5A9B8", "#7A7E96", 72);
      if (v === "jezero") o += laz(F, "M-10 170 L410 168 L410 206 L-10 210 Z", "#3E78B0", .8) + vlny(F, r, 6, 176, 202, "#EAF0F6") + laz(F, hrbet(214, 4, 80, 3), "#B8A878", .85);
      else { o += laz(F, hrbet(160, 12, 50, 2), "#8E9A62", .85); for (let i = 0; i < 7; i++) o += tah(F, "M-10 " + (178 + i * 9) + " Q180 " + (168 + i * 9) + " 410 " + (180 + i * 9), "#6E7440", 1.4, .6); }
      return o + trava(F, r, 100, 214, 250, ["#8A8A4A", "#A8A258"]);
    },
    /* ostrovy v oceánu: sopečný ostrov, laguna, palmy, příboj */
    ostrovy: function(F, r){
      let o = papir + nebe(F, "#7FB3E3", "#F1E7CF") + mraky(F, r, 5, 22, "#FFFFFF");
      o += laz(F, "M120 150 Q190 70 226 66 Q262 70 330 150 Z", "#5E8A5A", .85) + laz(F, "M226 66 Q262 70 330 150 L250 150 Q240 110 226 66 Z", "#3E6A45", .5);
      o += laz(F, "M-10 150 L410 150 L410 250 L-10 250 Z", "#2F8FB0", .8) + laz(F, "M-10 168 L410 160 L410 196 L-10 206 Z", "#4EC0C4", .55);
      o += vlny(F, r, 16, 158, 228, "#FFFFFF") + laz(F, "M-10 250 L-10 214 Q70 204 140 222 Q170 232 190 250 Z", "#EAD9A8", .9);
      return o + palma(F, 52, 226, 1.1) + palma(F, 96, 232, .8);
    },
    /* Arktida: nízké slunce, kry na tmavé vodě, sníh s modrými stíny */
    tundra: function(F, r){
      let o = papir + nebe(F, "#A9B8D8", "#F6DCC0") + slunce(F, 210, 150, 26);
      o += laz(F, hrbet(148, 4, 90, 1), "#B9C3D6", .8) + laz(F, "M-10 156 L410 156 L410 250 L-10 250 Z", "#4F6E8F", .75);
      o += laz(F, "M170 158 L250 158 L262 250 L158 250 Z", "#E8B98C", .35);
      [[20, 176, 80], [140, 190, 60], [250, 172, 100], [330, 198, 70], [60, 214, 110]].forEach(function(k){ const x = k[0], y = k[1], w = k[2];
        o += jem(F, "M" + x + " " + y + " L" + (x + w * .15) + " " + (y - 6) + " L" + (x + w * .8) + " " + (y - 7) + " L" + (x + w) + " " + y + " L" + (x + w * .7) + " " + (y + 5) + " L" + (x + w * .1) + " " + (y + 4) + " Z", "#F5F7FB", .95) +
          jem(F, "M" + (x + w * .1) + " " + (y + 4) + " L" + (x + w * .7) + " " + (y + 5) + " L" + (x + w) + " " + y + " L" + (x + w) + " " + (y + 3) + " L" + (x + w * .7) + " " + (y + 8) + " L" + (x + w * .1) + " " + (y + 7) + " Z", "#9FB3D0", .8); });
      return o + laz(F, "M-10 250 L-10 226 Q140 212 260 230 Q330 238 410 224 L410 250 Z", "#F3F5FA", .95) + laz(F, "M-10 250 L-10 238 Q140 230 260 244 L260 250 Z", "#B6C4DC", .5);
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
    return (pamet[klic] = '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + F.defs +
      '</defs><g style="isolation:isolate">' + K[druh](F, nahoda(s), varianta) + '</g><rect width="' + W + '" height="' + H + '" filter="url(#' + F.papir + ')"/></svg>');
  }
  return { obraz: obraz, druhy: Object.keys(K) };
})();
