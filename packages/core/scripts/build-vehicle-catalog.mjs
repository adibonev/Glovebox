// Regenerates src/vehicleCatalog.data.ts from data/car-models.json.
//
// The catalogue is data, not code: keeping the JSON as the source and generating the module means
// a newer list is imported by dropping the file in and running `node scripts/build-vehicle-catalog.mjs`,
// with no hand-editing of two thousand model names.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(join(here, "../data/car-models.json"), "utf8"));

const lines = [
  "// Generated from data/car-models.json by scripts/build-vehicle-catalog.mjs — do not edit by hand.",
  "",
  'import type { VehicleCatalog } from "./vehicleCatalog";',
  "",
  "/** Every make and model the Vehicle pickers offer, in the order the catalogue lists them. */",
  "export const VEHICLE_CATALOG: VehicleCatalog = [",
];

for (const [make, models] of Object.entries(source)) {
  const entries = models.map((model) => JSON.stringify(model)).join(", ");
  lines.push(`  { make: ${JSON.stringify(make)}, models: [${entries}] },`);
}

lines.push("];", "");
writeFileSync(join(here, "../src/vehicleCatalog.data.ts"), lines.join("\n"));

const models = Object.values(source).reduce((sum, list) => sum + list.length, 0);
console.log(`wrote src/vehicleCatalog.data.ts — ${Object.keys(source).length} makes, ${models} models`);
