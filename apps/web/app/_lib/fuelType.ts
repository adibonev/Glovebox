import type { FuelType } from "@glovebox/core";

/** Bulgarian labels for the Fuel Type picker. Centralized / i18n-ready. */
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Бензин",
  diesel: "Дизел",
  hybrid: "Хибрид",
  electric: "Електрически",
  lpg: "Газ (LPG)",
  cng: "Метан (CNG)",
};
