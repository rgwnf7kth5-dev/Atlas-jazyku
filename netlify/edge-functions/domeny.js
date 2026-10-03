// Dvě domény, jeden web. Pravidla s doménou v netlify.toml Netlify u tohoto webu nepoužíval
// (25. 9. 2026 vracela thelanguageatlas.com českou stránku), proto rozhoduje tahle edge funkce:
//   thelanguageatlas.com  → anglická verze z dist/en/ servírovaná z kořene
//   www.atlasjazyku.cz    → atlasjazyku.cz
// /api/* (serverová funkce otázek na AI) jde na obou doménách přímo do funkce.
// Společné soubory (skript, malby, ikony medailonů, náhledy map, obrázky pro sdílení, fotky stránek o civilizacích v /starovek/) leží v kořeni dist/
// a berou se odtud pro obě domény. Česká stránka /starovek/<id>/ je tak dostupná i z anglické domény, odkazy tam nevedou.
// Italská verze (od 2. 10. 2026) leží v dist/it/ a na anglické doméně je na thelanguageatlas.com/it/, německá (od 3. 10. 2026)
// v dist/de/ na thelanguageatlas.com/de/ – cesty /it/… a /de/… funkce
// vynechává, takže se servírují přímo (na atlasjazyku.cz/it/ by šly taky, odkazy tam nevedou).
// Cesty /en/… funkce vynechává (excludedPath): přepis na /en/… by ji jinak mohl spustit znovu a zacyklit.
// Staré odkazy /en/… proto na anglické doméně fungují dál, jen s /en/ v adrese.
const SPOLECNE = /^\/(js|malby|starovek|ikony|mapy|api)\/|^\/(favicon\.svg|apple-touch-icon\.png|nahled-[^/]*\.jpg|_headers)$/;

export default async (request) => {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase(), p = url.pathname;
  if (host === "thelanguageatlas.com" || host === "www.thelanguageatlas.com") {
    if (p === "/en") return Response.redirect("https://thelanguageatlas.com/" + url.search, 301);
    if (p === "/it" || p === "/de") return Response.redirect("https://thelanguageatlas.com" + p + "/" + url.search, 301);
    if (SPOLECNE.test(p)) return;
    return new URL("/en" + p + url.search, url);          // přepis (rewrite): adresa v prohlížeči zůstane
  }
  if (host === "www.atlasjazyku.cz") return Response.redirect("https://atlasjazyku.cz" + p + url.search, 301);
};

export const config = { path: "/*", excludedPath: ["/en/*", "/it/*", "/de/*", "/js/*", "/malby/*", "/starovek/*", "/ikony/*", "/mapy/*", "/api/*"] };
