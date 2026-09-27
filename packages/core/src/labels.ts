/**
 * The Bulgarian words and formats both apps show: Service Type names, statuses, day counts,
 * euros, dates, and what an auth failure says. One place, so the website and the phone never
 * word the same thing two ways (they used to keep a copy each). Presentation only: colours and
 * layout stay in the apps. Imported alone as "@glovebox/core/labels" by client bundles.
 */

import { isExpiringServiceType, type ExpiryStatus } from "./reminder";
import { authErrorKind, type AuthErrorKind } from "./signIn";

/** Canonical Service Type order (UBIQUITOUS_LANGUAGE.md) for pickers, lists and settings. */
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

/** Bulgarian name per Service Type code (UBIQUITOUS_LANGUAGE.md). */
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

/** Two-letter codes per Service Type, for the tightest spots. */
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

/**
 * The Expiry Status in words. "Изтекъл срок" rather than "Изтекъл": the adjective alone agreed
 * with a policy but not with a vignette or a casco.
 */
export const STATUS_LABELS: Record<ExpiryStatus, string> = {
  Valid: "В сила",
  ExpiringSoon: "Изтича",
  Expired: "Изтекъл срок",
};

/**
 * "след 12 дни" · "след 1 ден" · "изтича днес" · "изтече вчера" · "изтече преди 5 дни". The past
 * is a verb, which has no gender, so it reads right after any Service Type.
 */
export function formatDaysRemaining(daysUntil: number): string {
  if (daysUntil === 0) return "изтича днес";
  if (daysUntil === 1) return "след 1 ден";
  if (daysUntil > 1) return `след ${daysUntil} дни`;
  if (daysUntil === -1) return "изтече вчера";
  return `изтече преди ${Math.abs(daysUntil)} дни`;
}

const eurFormatter = new Intl.NumberFormat("bg-BG", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "120,00 €" for a recorded cost, or null when none. */
export function formatCost(cost: number | null | undefined): string | null {
  return cost == null ? null : eurFormatter.format(cost);
}

const eurCompactFormatter = new Intl.NumberFormat("bg-BG", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Whole euros for tight spots (the donut's centre): "5670 €". */
export function formatCostCompact(cost: number | null | undefined): string {
  return cost == null ? "0 €" : eurCompactFormatter.format(cost);
}

/** "04.12.2026". */
export function formatDateShort(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

const longDateFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "4 декември 2026 г.". */
export function formatDate(date: Date): string {
  return longDateFormatter.format(date);
}

/**
 * A Service Record named among others, as a picker or a file's caption lists it: "Гражданска
 * отговорност · до 11.08.2027", or for a Repair its date alone, "Ремонт · 11.08.2027".
 */
export function formatRecordLabel(serviceType: string, expiryDate: Date): string {
  const type = SERVICE_TYPE_LABELS[serviceType] ?? serviceType;
  const date = formatDateShort(expiryDate);
  return isExpiringServiceType(serviceType) ? `${type} · до ${date}` : `${type} · ${date}`;
}

/**
 * The count at the end of a deadline's row: "68 дни" over "остават", "Днес" over "последен ден"
 * (the Expiry Date is the last valid day), "9 дни" over "след срока".
 */
export function formatDaysFigure(days: number): { figure: string; note: string } {
  const count = Math.abs(days);
  return {
    figure: days === 0 ? "Днес" : `${count} ${count === 1 ? "ден" : "дни"}`,
    note: days < 0 ? "след срока" : days === 0 ? "последен ден" : "остават",
  };
}

/**
 * One Service Record in a sentence, as its own page opens: "В сила до 04.12.2026, още 68 дни",
 * "Изтече преди 9 дни, на 04.12.2026", or for a Repair (never due) "Разход на 04.05.2026".
 */
export function formatRecordSummary({
  expiring,
  expiryDate,
  days,
}: {
  expiring: boolean;
  expiryDate: Date;
  days: number;
}): string {
  const when = formatDateShort(expiryDate);
  if (!expiring) return `Разход на ${when}`;
  if (days === 0) return `В сила до ${when}, последен ден`;
  if (days > 0) return `В сила до ${when}, още ${days} ${days === 1 ? "ден" : "дни"}`;
  if (days === -1) return `Изтече вчера, на ${when}`;
  return `Изтече преди ${-days} дни, на ${when}`;
}

/**
 * A cost in euros as people type it: "120", "49,60", "49.6", "1 200", "1.200,50", "385,67 €".
 * A mark followed by one or two digits is the decimal one; marks between groups of three are
 * thousands. Null for anything else, rather than a guess: "1 200" used to be dropped silently.
 */
export function parseCost(input: string): number | null {
  // `\s` already covers the no-break spaces Intl puts between thousands (U+00A0, U+202F).
  const compact = input.replace(/[\s€]/g, "");
  if (!compact) return null;
  const match = /^(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,](\d{1,2}))?$/.exec(compact);
  if (!match) return null;
  const whole = (match[1] ?? "").replace(/[.,]/g, "");
  const value = Number(match[2] ? `${whole}.${match[2]}` : whole);
  return Number.isFinite(value) ? value : null;
}

/** What each kind of auth failure says (see `authErrorKind`): short, and what to do next. */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorKind, string> = {
  invalidCredentials: "Грешен имейл или парола.",
  emailNotConfirmed: "Имейлът още не е потвърден. Отвори писмото, което ти пратихме, и натисни бутона в него.",
  alreadyRegistered: "Вече има профил с този имейл. Влез или поискай нова парола.",
  weakPassword: "Паролата е твърде слаба. Нека е поне 6 знака.",
  samePassword: "Новата парола трябва да е различна от старата.",
  rateLimited: "Опита твърде много пъти. Изчакай минута и опитай пак.",
  unknown: "Нещо се обърка. Опитай пак след малко.",
};

/** The Bulgarian message for an auth error from Supabase, or for anything thrown on the way. */
export function authErrorMessage(error: unknown): string {
  const fields =
    typeof error === "object" && error !== null ? (error as { code?: string; status?: number; message?: string }) : {};
  return AUTH_ERROR_MESSAGES[authErrorKind(fields)];
}
