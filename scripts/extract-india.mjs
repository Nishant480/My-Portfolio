// One-off: extract India's border rings from world-atlas into a small JSON file.
import fs from "node:fs";
import { feature } from "topojson-client";
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const fc = feature(topo, topo.objects.countries);
const india = fc.features.find((f) => f.properties.name === "India");
const polys = india.geometry.type === "Polygon" ? [india.geometry.coordinates] : india.geometry.coordinates;
const rings = polys.map((p) => p[0]).filter((r) => r.length > 20).map((r) => r.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]));
fs.writeFileSync("src/data/india-border.json", JSON.stringify(rings));
console.log(rings.length, rings.map((r) => r.length));
