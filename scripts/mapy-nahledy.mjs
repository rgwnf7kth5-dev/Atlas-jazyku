// Náhledy barevných map pro okno Mapy: static/mapy/<id>.jpg (160 × 160, kolečko 64 px na displeji s dvojitou hustotou).
// Snímek glóbu ve výchozím pohledu obarveného podle mapy (písmo, vitalita, 24 vlastností WALS), oříznutý na kouli.
// Po změně vzhledu glóbu nebo palet map spusť znovu:
//   npm run build && PLAYWRIGHT=/cesta/k/playwright/index.mjs CHROMIUM=/cesta/k/chrome node scripts/mapy-nahledy.mjs [id…]
// Bez id vyrobí všechny. Potřebuje Playwright a Chromium (v Claude Code na webu jsou předinstalované).
const { chromium } = await import(process.env.PLAYWRIGHT || "playwright");
const fs = await import("node:fs");
const R = new URL("..", import.meta.url).pathname;
const typ = JSON.parse(fs.readFileSync(R + "data/typologie-popis.json", "utf8"));
const vse = ["pismo", "vitalita"].concat(typ.vlastnosti.map(v => v.id));
const chci = process.argv.slice(2).length ? process.argv.slice(2) : vse;
fs.mkdirSync(R + "static/mapy", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--no-sandbox"] });
for (const id of chci) {
  const ctx = await b.newContext({ viewport: { width: 400, height: 760 }, deviceScaleFactor: 1, isMobile: true, colorScheme: "light" });   // každá mapa čistá, bez paměti předchozí volby
  const p = await ctx.newPage();
  await p.route("**/*", r => r.request().url().startsWith("file://") ? r.continue() : r.abort());   // písma ani nic jiného zvenku
  await p.goto("file://" + R + "dist/index.html" + (id === "vitalita" ? "" : "#mapa-" + id));
  await p.addStyleTag({ content: ".dok,.roh-ovladani,.typ-legenda,.vit-legenda,.tl-napoveda,.souradnice,.pocet-glob,.hlavicka{visibility:hidden!important}" });
  await p.waitForTimeout(1500);
  if (id === "vitalita") await p.evaluate(() => document.getElementById("tl-vitalita-dok").click());
  await p.waitForTimeout(1800);
  const snimek = (await p.locator("#scena").screenshot({ type: "png" })).toString("base64");
  if (process.env.LADENI) fs.writeFileSync(process.env.LADENI + id + ".png", Buffer.from(snimek, "base64"));
  // koule = ohraničení sytých (modrých) pixelů moře; výřez čtverce kolem ní zmenšený na 160 px
  const jpeg = await p.evaluate(async png => {
    const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) {
      const o = (y * c.width + i) * 4, r = d[o], g = d[o + 1], bl = d[o + 2];
      if (bl > 120 && bl - r > 70 && bl - g > 25) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const s = Math.max(x1 - x0, y1 - y0) + 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const v = document.createElement("canvas"); v.width = v.height = 160;
    const vx = v.getContext("2d"); vx.fillStyle = "#FBF9F4"; vx.fillRect(0, 0, 160, 160);
    vx.imageSmoothingQuality = "high"; vx.drawImage(img, cx - s / 2, cy - s / 2, s, s, 0, 0, 160, 160);
    return v.toDataURL("image/jpeg", 0.8).split(",")[1];
  }, snimek);
  fs.writeFileSync(R + `static/mapy/${id}.jpg`, Buffer.from(jpeg, "base64"));
  await ctx.close();
}
await b.close();
console.log(`hotovo: ${chci.length} náhledů v static/mapy/`);
