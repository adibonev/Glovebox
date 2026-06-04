// Vehicle body silhouettes (mirrors apps/web/app/_lib/bodyType.ts; BG labels, i18n-ready).
export type BodyType = "hatchback" | "sedan" | "wagon" | "suv" | "coupe" | "pickup";

export const BODY_TYPES: BodyType[] = ["hatchback", "sedan", "wagon", "suv", "coupe", "pickup"];

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
