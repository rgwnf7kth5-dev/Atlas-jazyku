// Stará adresa atlasoflanguages.netlify.app → nové domény (27. 9. 2026, uživatel: „ano, zapni“).
// Netlify adresu .netlify.app vypnout nedovolí a pravidla s doménou v netlify.toml u tohoto webu nepoužíval,
// proto trvalé přesměrování (301) dělá tahle funkce: /en/… → thelanguageatlas.com/…, vše ostatní → atlasjazyku.cz/….
// Jen přesně tahle adresa: náhledy pull requestů (deploy-preview-N--atlasoflanguages.netlify.app) zůstávají, jak jsou.
// U ostatních domén funkce nic nedělá a o dalším rozhoduje domeny.js.
export default async (request) => {
  const url = new URL(request.url);
  if (url.hostname.toLowerCase() !== "atlasoflanguages.netlify.app") return;
  const p = url.pathname;
  const cil = p === "/en" || p.startsWith("/en/")
    ? "https://thelanguageatlas.com" + (p.slice(3) || "/")
    : "https://atlasjazyku.cz" + p;
  return Response.redirect(cil + url.search, 301);
};

export const config = { path: "/*" };
