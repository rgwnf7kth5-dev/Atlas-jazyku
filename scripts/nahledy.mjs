// Náhledové obrázky pro sdílení (static/nahled-cs.jpg, nahled-en.jpg, 1200×630) a ikonka static/apple-touch-icon.png.
// Potřebuje Playwright a Chromium (npm i -D playwright; v Claude Code na webu jsou předinstalované):
//   PLAYWRIGHT=/cesta/k/playwright/index.mjs CHROMIUM=/cesta/k/chrome node scripts/nahledy.mjs   (po npm run build)
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const R = new URL('..', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args:['--no-sandbox'] });
for (const [lang, url, nadpis, pod] of [['cs','dist/index.html','Atlas jazyků','Všech 7 967 jazyků světa na otáčivém glóbu'],['en','dist/en/index.html','Language Atlas','All 7,967 languages of the world on a spinning globe']]) {
  const ctx = await b.newContext({viewport:{width:1200,height:630}, deviceScaleFactor:1, colorScheme:'dark', reducedMotion:'reduce'});
  const p = await ctx.newPage();
  await p.route('**/*', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  await p.goto('file://'+R+url); await p.waitForTimeout(800);
  await p.addStyleTag({content:`.hlava,.police,.dok,.panel-zobrazeni,.ukazatel,.napoveda,.legenda,.hud{display:none!important}
    .app{padding:0}.mriz{display:block;height:630px}.scena{position:fixed;left:440px;top:-30px;width:820px;height:690px;border-radius:0}
    #og{position:fixed;left:64px;top:0;bottom:0;width:430px;display:flex;flex-direction:column;justify-content:center;gap:18px;z-index:10}
    #og h1{font-size:64px;line-height:1.02}#og p{margin:0;font-family:var(--pismo-text);font-size:27px;line-height:1.3;color:var(--text2)}
    #og svg{width:84px;height:84px}`});
  await p.evaluate(([n,t])=>{ const d=document.createElement('div'); d.id='og'; d.innerHTML=document.querySelector('.znak').outerHTML+'<h1>'+n+'</h1><p>'+t+'</p>'; document.body.appendChild(d); window.dispatchEvent(new Event('resize')); },[nadpis,pod]);
  await p.waitForTimeout(1500);
  await p.screenshot({path:R+`static/nahled-${lang}.jpg`, type:'jpeg', quality:86});
  await ctx.close();
}
const ctx = await b.newContext({viewport:{width:180,height:180}}); const p = await ctx.newPage();
await p.setContent(`<body style="margin:0;background:#050a1f;display:grid;place-items:center;height:180px">@@</body>`.replace("@@", (await import('node:fs')).readFileSync(R+'static/favicon.svg','utf8').replace('<svg ','<svg width="150" height="150" ')));
await p.screenshot({path:R+'static/apple-touch-icon.png'});
await b.close(); console.log('hotovo');
