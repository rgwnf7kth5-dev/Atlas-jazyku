// Obrázky medailonů pod glóbem: static/ikony/<klic>.jpg (320 × 320, pro 70px kolečko na displeji s dvojitou hustotou).
// Akvarely z src/akvarely.js (druhy akropole, cajovnik, lipa, klicek) se ořežou na čtverec kolem motivu. Medailon Mapy
// (static/ikony/mapy.jpg) je snímek glóbu obarveného podle písma a skriptem se nevyrábí. Po změně akvarelů spusť znovu:
//   npm run build && PLAYWRIGHT=/cesta/k/playwright/index.mjs CHROMIUM=/cesta/k/chrome node scripts/ikony.mjs
const { chromium } = await import(process.env.PLAYWRIGHT || "playwright");
const fs = await import("node:fs");
const R = new URL("..", import.meta.url).pathname;
// klíč: druh akvarelu a čtverec výřezu ve 640 × 400 (střed x, střed y, strana)
const IKONY = { starovek: ["akropole", 320, 175, 280], pribehy: ["cajovnik", 420, 215, 330], rodokmen: ["lipa", 320, 175, 290], vitalita: ["klicek", 355, 230, 280] };
fs.mkdirSync(R + "static/ikony", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 2 })).newPage();
await p.route("**/*", r => r.request().url().startsWith("file://") ? r.continue() : r.abort());
await p.goto("file://" + R + "dist/index.html");
await p.waitForFunction(() => typeof AKVARELY !== "undefined");
for (const [klic, [druh, cx, cy, s]] of Object.entries(IKONY)) {
  await p.evaluate(([klic, druh, cx, cy, s]) => {
    const k = 160 / s;
    document.body.innerHTML = '<div id="m" style="position:fixed;left:0;top:0;width:160px;height:160px;overflow:hidden;background:#FBF7EE"><div style="position:absolute;left:' +
      (-(cx - s / 2) * k) + "px;top:" + (-(cy - s / 2) * k) + "px;width:" + (640 * k) + "px;height:" + (400 * k) + 'px">' + AKVARELY.obraz("ikona-" + klic, druh) + "</div></div>";
    document.querySelector("#m svg").style.cssText = "width:100%;height:100%;display:block";
  }, [klic, druh, cx, cy, s]);
  await p.waitForTimeout(200);
  await p.screenshot({ path: R + `static/ikony/${klic}.jpg`, type: "jpeg", quality: 84, clip: { x: 0, y: 0, width: 160, height: 160 } });
}
await b.close();
console.log("hotovo: " + Object.keys(IKONY).join(", "));
