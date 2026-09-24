// Vehicle body silhouettes (mirrors apps/web/app/_lib/bodyType.ts; BG labels, i18n-ready).
export type BodyType = "hatchback" | "sedan" | "wagon" | "suv" | "coupe" | "pickup" | "truck";

export const BODY_TYPES: BodyType[] = [
  "hatchback",
  "sedan",
  "wagon",
  "suv",
  "coupe",
  "pickup",
  "truck",
];

/**
 * What the pickers offer. The lorry is built and stored Vehicles keep it, but it is held back
 * until its silhouette is drawn to the standard of the cars — put "truck" back to show it.
 */
export const BODY_TYPE_OPTIONS: BodyType[] = BODY_TYPES.filter((type) => type !== "truck");

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  hatchback: "Хечбек",
  sedan: "Седан",
  wagon: "Комби",
  suv: "Джип",
  coupe: "Купе",
  pickup: "Пикап",
  truck: "Камион",
};

/** Coerce a stored `cars.body_type` value to a known silhouette (default: sedan). */
export function parseBodyType(value: string | null | undefined): BodyType {
  return (BODY_TYPES as string[]).includes(value ?? "") ? (value as BodyType) : "sedan";
}
