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

/** Bulgarian labels for the body type picker. Centralized / i18n-ready. */
export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  hatchback: "Хечбек",
  sedan: "Седан",
  wagon: "Комби",
  suv: "Джип",
  coupe: "Купе",
  pickup: "Пикап",
};

/** Coerce a stored `cars.body_type` value to a known silhouette (default: sedan). */
export function parseBodyType(value: string | null | undefined): BodyType {
  return (BODY_TYPES as string[]).includes(value ?? "") ? (value as BodyType) : "sedan";
}

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
