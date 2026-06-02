/**
 * Vehicle body silhouettes. The asset `public/cars/<bodyType>.png` is rendered
 * directly on the dark scene by VehicleCard. VIN decoding (NHTSA) comes later —
 * for now bodyType is a data field that defaults to "sedan".
 */
export type BodyType = "hatchback" | "sedan" | "wagon" | "suv" | "coupe" | "pickup";

export const BODY_TYPES: BodyType[] = [
  "hatchback",
  "sedan",
  "wagon",
  "suv",
  "coupe",
  "pickup",
];

/** Map an NHTSA "Body Class" string to one of our silhouettes (default: sedan). */
export function mapBodyClass(nhtsaBodyClass: string | null | undefined): BodyType {
  const value = (nhtsaBodyClass ?? "").toLowerCase();
  if (value.includes("hatchback")) return "hatchback";
  if (value.includes("wagon") || value.includes("estate")) return "wagon";
  if (value.includes("sport utility") || value.includes("suv")) return "suv";
  if (value.includes("coupe")) return "coupe";
  if (value.includes("pickup")) return "pickup";
  if (value.includes("sedan") || value.includes("saloon")) return "sedan";
  return "sedan";
}
