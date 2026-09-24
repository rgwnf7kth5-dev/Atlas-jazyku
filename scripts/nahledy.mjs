// Náhledové obrázky pro sdílení (static/nahled-cs.jpg, nahled-en.jpg, 1200×630) a ikonka static/apple-touch-icon.png.
// Potřebuje Playwright a Chromium (npm i -D playwright; v Claude Code na webu jsou předinstalované):
//   PLAYWRIGHT=/cesta/k/playwright/index.mjs CHROMIUM=/cesta/k/chrome node scripts/nahledy.mjs   (po npm run build)
// Vzhled „obrázková encyklopedie“: papír, patkový nápis s pečetí, reliéfní glóbus a malovaná pohlednice jazyka.
// Glóbus kreslí WebGL, proto Chromium běží se softwarovým SwiftShaderem. Písma se berou z Google Fonts
// (stránka je načítá sama); bez sítě by náhled vyšel náhradním písmem. FONTY_CSS=/cesta/k/fonty.css podstrčí
// místo Google Fonts vlastní styl s @font-face (tak se náhledy dělají v Claude Code na webu).
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const fs = await import('node:fs');
const R = new URL('..', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined,
  args:['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const TEXTY = {
  cs: { url:'dist/index.html', nadpis:'Atlas jazyků', pod:'Všech 7 967 jazyků světa na otáčivém glóbu', jazyk:'cs', pozdrav:'Ahoj!', nazev:'Čeština' },
  en: { url:'dist/en/index.html', nadpis:'Language Atlas', pod:'All 7,967 languages of the world on a spinning globe', jazyk:'en', pozdrav:'Hello!', nazev:'English' },
};
const POZDRAVY = ['Hola', 'Jambo', 'Привет', 'こんにちは', 'مرحبا', 'Kia ora'];
const ZNAK = fs.readFileSync(R + 'static/favicon.svg', 'utf8').replace('<svg ', '<svg class="znak" ');
for (const [lang, T] of Object.entries(TEXTY)) {
  const ctx = await b.newContext({viewport:{width:1200,height:630}, deviceScaleFactor:1, colorScheme:'light', reducedMotion:'reduce'});
  await ctx.addInitScript(() => { try { localStorage.setItem('atlas-uvitano', '1'); } catch (e) {} });
  const p = await ctx.newPage();
  if (process.env.FONTY_CSS) await p.route('https://fonts.googleapis.com/**', r => r.fulfill({contentType:'text/css', body: fs.readFileSync(process.env.FONTY_CSS, 'utf8')}));
  await p.goto('file://' + R + T.url); await p.waitForTimeout(1200);
  const krajina = JSON.parse(fs.readFileSync(R + 'data/krajiny.json', 'utf8'))[T.jazyk];
  await p.addStyleTag({content:`.hlava,.police,.dok,.panel-zobrazeni,.hud,.tl-napoveda,.napoveda,.karta,.den-jazyku{display:none!important}
    body{background:#FBF9F4}.app{padding:0}.mriz{display:block;height:630px}
    .scena{position:fixed;left:560px;top:-10px;width:700px;height:680px;border-radius:0;background:transparent}
    #og{position:fixed;left:70px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center;gap:0;z-index:10}
    #og svg.znak{width:92px;height:92px;margin-bottom:22px}
    #og h1{margin:0;font-family:var(--pismo-nadpis);font-weight:600;font-size:82px;line-height:1;letter-spacing:-.01em;color:#141B28}
    #og .linka{width:90px;height:3px;background:#D8402E;border-radius:2px;margin:26px 0 22px}
    #og p{margin:0;font-family:var(--pismo-text);font-size:29px;line-height:1.3;color:#465062;max-width:470px}
    #og .pozdravy{margin-top:30px;white-space:nowrap;font-family:var(--pismo-nadpis);font-style:italic;font-size:23px;color:#8A93A3;letter-spacing:.01em}
    #og-karta{position:fixed;right:52px;bottom:40px;width:300px;background:#fff;border-radius:16px;overflow:hidden;z-index:11;
      box-shadow:0 26px 50px -24px rgba(20,27,40,.55),0 0 0 1px rgba(20,27,40,.06);transform:rotate(3deg)}
    #og-karta .malba{aspect-ratio:400/250;display:block}#og-karta .malba svg{width:100%;height:100%;display:block}
    #og-karta .t{padding:12px 18px 16px}#og-karta b{display:block;font-family:var(--pismo-nadpis);font-size:40px;line-height:1.05;color:#141B28}
    #og-karta span{font-family:var(--pismo-nadpis);font-size:19px;color:#465062}`});
  await p.evaluate(([T, POZDRAVY, krajina, ZNAK]) => {
    const d = document.createElement('div'); d.id = 'og';
    d.innerHTML = ZNAK + '<h1>' + T.nadpis + '</h1><div class="linka"></div><p>' + T.pod + '</p><div class="pozdravy">' + POZDRAVY.map(function(x){ return '<bdi>' + x + '</bdi>'; }).join(' · ') + '</div>';
    const k = document.createElement('div'); k.id = 'og-karta';
    k.innerHTML = '<div class="malba">' + AKVARELY.obraz(T.jazyk, krajina) + '</div><div class="t"><b>' + T.pozdrav + '</b><span>' + T.nazev + '</span></div>';
    document.body.append(d, k); window.dispatchEvent(new Event('resize'));
  }, [T, POZDRAVY, krajina, ZNAK]);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);
  await p.screenshot({path:R + `static/nahled-${lang}.jpg`, type:'jpeg', quality:88});
  await ctx.close();
}
const ctx = await b.newContext({viewport:{width:180,height:180}}); const p = await ctx.newPage();
await p.setContent(`<body style="margin:0;background:#FBF9F4;display:grid;place-items:center;height:180px">@@</body>`.replace("@@", fs.readFileSync(R+'static/favicon.svg','utf8').replace('<svg ','<svg width="146" height="146" ')));
await p.screenshot({path:R+'static/apple-touch-icon.png'});
await b.close(); console.log('hotovo');
