// Malby jazyků jako obrázky pro samostatné stránky jazyků a náhled při sdílení: static/malby/<id>.jpg (800 × 500).
// Stránka aplikace kreslí malby živě (SVG), ale samostatná stránka jazyka má být lehká a vyhledávač i Facebook
// potřebují obyčejný obrázek. Po změně src/akvarely.js nebo data/krajiny.json je potřeba skript spustit znovu:
//   npm run build && PLAYWRIGHT=/cesta/k/playwright/index.mjs CHROMIUM=/cesta/k/chrome node scripts/malby.mjs [id…]
// Bez id vyrobí všechny. Potřebuje Playwright a Chromium (v Claude Code na webu jsou předinstalované).
const { chromium } = await import(process.env.PLAYWRIGHT || "playwright");
const fs = await import("node:fs");
const R = new URL("..", import.meta.url).pathname;
const krajiny = JSON.parse(fs.readFileSync(R + "data/krajiny.json", "utf8"));
const jazyky = JSON.parse(fs.readFileSync(R + "data/languages.json", "utf8")).map(j => j.id);
const chci = process.argv.slice(2).length ? process.argv.slice(2) : jazyky;
fs.mkdirSync(R + "static/malby", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 800, height: 500 }, deviceScaleFactor: 1 })).newPage();
await p.route("**/*", r => r.request().url().startsWith("file://") ? r.continue() : r.abort());   // písma ani nic jiného zvenku
await p.goto("file://" + R + "dist/index.html");
await p.waitForFunction(() => typeof AKVARELY !== "undefined");
for (const id of chci) {
  if (!krajiny[id]) { console.log(`${id}: nemá krajinu, přeskakuji`); continue; }
  await p.evaluate(([id, druh]) => {
    document.body.innerHTML = '<div id="m" style="position:fixed;inset:0;width:800px;height:500px;background:#FBF7EE">' + AKVARELY.obraz(id, druh) + "</div>";
    document.querySelector("#m svg").style.cssText = "width:100%;height:100%;display:block";
  }, [id, krajiny[id]]);
  await p.waitForTimeout(150);
  await p.screenshot({ path: R + `static/malby/${id}.jpg`, type: "jpeg", quality: 80 });
}
await b.close();
console.log(`hotovo: ${chci.length} maleb v static/malby/`);
