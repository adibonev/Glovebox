/**
 * AI document extraction (seam): a vehicle document (ГО/Каско/винетка/талон photo) → the few
 * fields we can prefill on a Service Record. Pure here — building the prompt and validating the
 * model's output. The actual model call lives at the edge (a server route), never in `core`.
 */

/** Canonical Service Type codes the extractor may return (UBIQUITOUS_LANGUAGE.md). */
export const SERVICE_TYPE_CODES = [
  "civil_liability",
  "casco",
  "vignette",
  "inspection",
  "tax",
  "fire_extinguisher",
  "maintenance",
  "repair",
] as const;
export type ServiceTypeCode = (typeof SERVICE_TYPE_CODES)[number];

/** Best-effort fields read from a document — every field is optional (it's a suggestion the User confirms). */
export interface ExtractedServiceInfo {
  serviceType: ServiceTypeCode | null;
  /** Expiry / valid-until date as ISO `YYYY-MM-DD`. */
  expiryDate: string | null;
  cost: number | null;
}

/** The instruction sent to the vision model. Bulgarian documents; ask for strict JSON. */
export const SERVICE_EXTRACTION_PROMPT = [
  "Ти си асистент, който разчита български документи за автомобил (застраховка Гражданска",
  "отговорност, Каско, винетка, талон, технически преглед, данък и др.).",
  "Върни САМО JSON обект с ключове:",
  '- "serviceType": един от ' +
    SERVICE_TYPE_CODES.join(", ") +
    " (civil_liability=ГО, casco=Каско, vignette=винетка, inspection=технически преглед, tax=данък МПС, fire_extinguisher=пожарогасител, maintenance=обслужване, repair=ремонт) или null;",
  '- "expiryDate": датата, до която документът е валиден / изтича, във формат YYYY-MM-DD, или null;',
  '- "cost": платената сума в евро като число, или null.',
  "Ако нещо не е ясно от документа, върни null за това поле. Не измисляй стойности.",
].join("\n");

/** Defensively normalise the model's JSON into a typed result (never trust the model). */
export function parseExtractedServiceInfo(raw: unknown): ExtractedServiceInfo {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const type = obj.serviceType;
  const serviceType =
    typeof type === "string" && (SERVICE_TYPE_CODES as readonly string[]).includes(type)
      ? (type as ServiceTypeCode)
      : null;

  const date = obj.expiryDate;
  const expiryDate =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
      ? date
      : null;

  const rawCost = typeof obj.cost === "string" ? Number(obj.cost) : obj.cost;
  const cost =
    typeof rawCost === "number" && Number.isFinite(rawCost) && rawCost >= 0 ? rawCost : null;

  return { serviceType, expiryDate, cost };
}
