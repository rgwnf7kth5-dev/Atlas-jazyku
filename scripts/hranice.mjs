// Opravy státních hranic podkladové mapy (data/countries-110m.json z world-atlas / Natural Earth).
// Atlas kreslí hranice podle mezinárodního práva a postoje OSN, ne podle stavu, který vznikl silou.
// 17. 10. 2026 (uživatel): Natural Earth vede Krym a Sevastopol jako součást Ruska. Anexe z roku 2014 je
// protiprávní (rezoluce Valného shromáždění OSN 68/262 o územní celistvosti Ukrajiny), proto patří k Ukrajině.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const KOREN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let tj = null;
function topojson(){                           // topojson-client z vendor/ (stejná knihovna jako na stránce)
  if (!tj) { const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(KOREN, "vendor/topojson-client.min.js"), "utf8"), ctx); tj = ctx.topojson; }
  return tj;
}

export function opravHranice(svet){
  const t = typeof svet === "string" ? JSON.parse(svet) : svet, T = topojson(), g = t.objects.countries.geometries;
  const ru = g.find(x => x.properties.name === "Russia"), ua = g.find(x => x.properties.name === "Ukraine");
  if (!ru || !ua) throw new Error("oprava hranic: v mapě chybí Rusko nebo Ukrajina");
  /* polygon Krymu: celý obrys leží na poloostrově (32–37° v. d., 44–46,4° s. š.) */
  const naKrymu = p => T.feature(t, {type: "Polygon", arcs: p}).geometry.coordinates[0].every(([x, y]) => x > 32 && x < 37 && y > 44 && y < 46.4);
  const krym = ru.type === "MultiPolygon" ? ru.arcs.filter(naKrymu) : [];
  if (krym.length !== 1) throw new Error("oprava hranic: Krym v ruské části mapy nenalezen (" + krym.length + ") – zkontrolovat data mapy");
  ru.arcs = ru.arcs.filter(p => p !== krym[0]);
  /* sloučit s Ukrajinou: společná hranice na Perekopské šíji zmizí (nekreslí se jako státní hranice) */
  const spoj = T.mergeArcs(t, [ua, {type: "Polygon", arcs: krym[0]}]);
  ua.type = spoj.type; ua.arcs = spoj.arcs;
  return t;
}
