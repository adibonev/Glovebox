import type { ExpiryStatus } from "@glovebox/core";

import { statusColors } from "@glovebox/ui";

// Centralized BG strings (i18n-ready). Mirrors apps/web/app/_lib/labels.ts — a future
// cleanup could lift these shared presentation strings into a common package.

/** Canonical Service Type order (UBIQUITOUS_LANGUAGE.md) for pickers. */
export const SERVICE_TYPE_ORDER = [
  "civil_liability",
  "casco",
  "vignette",
  "inspection",
  "tax",
  "fire_extinguisher",
  "maintenance",
  "repair",
] as const;

/** Bulgarian labels per Service Type code (UBIQUITOUS_LANGUAGE.md). */
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  civil_liability: "Гражданска отговорност",
  casco: "Каско",
  vignette: "Винетка",
  inspection: "Технически преглед",
  tax: "Данък МПС",
  fire_extinguisher: "Пожарогасител",
  maintenance: "Обслужване",
  repair: "Ремонт",
};

/** Short mono code chips per Service Type. */
export const SERVICE_TYPE_CODES: Record<string, string> = {
  civil_liability: "ГО",
  casco: "КС",
  vignette: "ВН",
  inspection: "ТП",
  tax: "ДН",
  fire_extinguisher: "ПГ",
  maintenance: "ОБ",
  repair: "РМ",
};

/** Euro amount formatter for Service Record costs. */
const eurFormatter = new Intl.NumberFormat("bg-BG", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

/** "120,00 €" for a recorded cost, or null when none. */
export function formatCost(cost: number | null | undefined): string | null {
  return cost == null ? null : eurFormatter.format(cost);
}

/** Whole-euro amount for tight spots (e.g. the donut centre): "5670 €". */
const eurCompactFormatter = new Intl.NumberFormat("bg-BG", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
export function formatCostCompact(cost: number | null | undefined): string {
  return cost == null ? "0 €" : eurCompactFormatter.format(cost);
}

/** Bulgarian labels for the Expiry Status. */
export const STATUS_LABELS: Record<ExpiryStatus, string> = {
  Valid: "В сила",
  ExpiringSoon: "Изтича",
  Expired: "Изтекъл",
};

/** Functional status colors from the shared design tokens. */
export const STATUS_COLORS: Record<ExpiryStatus, string> = {
  Valid: statusColors.valid,
  ExpiringSoon: statusColors.expiring,
  Expired: statusColors.expired,
};

/** "след N дни" · "изтича днес" · "изтекло преди N дни". */
export function formatDaysRemaining(daysUntil: number): string {
  if (daysUntil === 0) return "изтича днес";
  if (daysUntil > 0) {
    return daysUntil === 1 ? "след 1 ден" : `след ${daysUntil} дни`;
  }
  const overdue = Math.abs(daysUntil);
  return overdue === 1 ? "изтекло преди 1 ден" : `изтекло преди ${overdue} дни`;
}

/** Compact "dd.mm.yyyy" for the service rows. */
export function formatDateShort(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
