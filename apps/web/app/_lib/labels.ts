import type { ExpiryStatus } from "@glovebox/core";

import { statusColors } from "@glovebox/ui";

/** Bulgarian labels per Service Type code (UBIQUITOUS_LANGUAGE.md). Centralized / i18n-ready. */
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  civil_liability: "Гражданска отговорност",
  casco: "Каско",
  vignette: "Винетка",
  inspection: "Технически преглед",
  tax: "Данък МПС",
  fire_extinguisher: "Пожарогасител",
  maintenance: "Поддръжка",
};

/** Bulgarian labels for the Expiry Status. */
export const STATUS_LABELS: Record<ExpiryStatus, string> = {
  Valid: "Валидно",
  ExpiringSoon: "Изтича",
  Expired: "Изтекло",
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

const dateFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** A small icon per Service Type for the picker cards. */
export const SERVICE_TYPE_ICONS: Record<string, string> = {
  civil_liability: "🛡️",
  casco: "💎",
  vignette: "🛣️",
  inspection: "🔧",
  tax: "💰",
  fire_extinguisher: "🧯",
  maintenance: "🛢️",
};
