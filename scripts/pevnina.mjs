// Vyrobí data/pevnina.json – tečky pevniny pro částicový glóbus.
// Body jsou rovnoměrně na kouli (Fibonacciho spirála, N bodů); ukládá se jen, které z nich jsou na pevnině
// (bitová mapa) a ve kterém státě leží (číslo státu). Souřadnice si stránka dopočítá z pořadí bodu.
//   node scripts/pevnina.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const N = 120000;

// knihovny z vendor/ načtu do samostatného prostředí (jsou psané pro prohlížeč)
const prostredi = {};
vm.createContext(prostredi);
for (const k of ["d3-array.min.js", "d3-geo.min.js", "topojson-client.min.js"])
  vm.runInContext(fs.readFileSync(path.join(KOREN, "vendor", k), "utf8"), prostredi);
const { d3, topojson } = prostredi;

const svet = JSON.parse(fs.readFileSync(path.join(KOREN, "data/countries-110m.json"), "utf8"));
const zeme = topojson.feature(svet, svet.objects.countries).features.filter(f => f.properties.name !== "Antarctica");
const hranice = zeme.map(f => d3.geoBounds(f));
const nazvy = zeme.map(f => f.properties.name);

const bity = new Uint8Array(Math.ceil(N / 8));
const staty = [];
const zlaty = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - 2 * (i + 0.5) / N;
  const lat = Math.asin(y) * 180 / Math.PI;
  if (lat < -60) continue;
  let lon = ((zlaty * i * 180 / Math.PI) % 360 + 540) % 360 - 180;
  for (let k = 0; k < zeme.length; k++) {
    const [[w, s], [e, n]] = hranice[k];
    if (lat < s || lat > n) continue;
    if (w <= e ? (lon < w || lon > e) : (lon < w && lon > e)) continue;     // přes 180. poledník
    if (d3.geoContains(zeme[k], [lon, lat])) { bity[i >> 3] |= 1 << (i & 7); staty.push(k); break; }
  }
}
const b64 = u8 => Buffer.from(u8).toString("base64");
fs.writeFileSync(path.join(KOREN, "data/pevnina.json"),
  JSON.stringify({ n: N, bity: b64(bity), staty: b64(Uint8Array.from(staty)), nazvy }));
console.log(`Pevnina: ${staty.length} teček z ${N}, ${nazvy.length} států, ${(fs.statSync(path.join(KOREN, "data/pevnina.json")).size / 1024).toFixed(0)} kB`);
