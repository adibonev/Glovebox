/**
 * Derived Schedule — Expiry Dates computed from Bulgarian statutory rules instead of
 * looked up in a registry. Pure, no I/O, no `Date.now()` (pass `today` / the year).
 *
 * The Registry Check seam (`registryCheck.ts`) needs an official data source, and every
 * state registry is CAPTCHA-gated. These rules need no source at all: given one date the
 * User already has on their registration certificate, the obligations that follow are
 * fixed by law. One input, a lifetime of Expiry Dates.
 *
 * Dates are date-only, at UTC midnight — the same convention as Service Record expiry
 * dates elsewhere in the domain.
 */

// --- UTC date helpers -------------------------------------------------------------------

/** Days in `month` (0-indexed) of `year`, accounting for leap years. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** A date-only UTC Date, with the day clamped to the month's last day. */
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, Math.min(day, daysInMonth(year, month))));
}

/**
 * `date` shifted by whole years, clamping 29 February to 28 February in a non-leap year
 * (a legal anniversary never rolls into the next month).
 */
function addYears(date: Date, years: number): Date {
  return utcDate(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate());
}

/** `date` shifted by whole days. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** A Saturday or Sunday. Public holidays are not modelled — see `vehicleTaxDeadlines`. */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** `date`, or the following Monday when it falls on a weekend. */
function rollToWorkingDay(date: Date): Date {
  let result = date;
  while (isWeekend(result)) result = addDays(result, 1);
  return result;
}

// --- Roadworthiness Inspection ----------------------------------------------------------

/**
 * Anniversaries (years since first registration) at which a Roadworthiness Inspection is
 * due for categories M1 and N1 — Наредба Н-32, чл. 29: before the third year elapses,
 * before the fifth, and every year after that.
 */
const FIRST_INSPECTION_YEAR = 3;
const SECOND_INSPECTION_YEAR = 5;

/** The n-th statutory Inspection anniversary: 3, 5, 6, 7, 8 … years after registration. */
function inspectionYearOffset(index: number): number {
  if (index === 0) return FIRST_INSPECTION_YEAR;
  return SECOND_INSPECTION_YEAR + index - 1;
}

/**
 * The next Roadworthiness Inspection due for a Vehicle first registered as new on
 * `firstRegistration`, as of `today`. Returns the anniversary itself on the day it falls due.
 *
 * A Vehicle imported used carries its original first-registration date, so the same rule
 * applies — which is why this works for the majority of the Bulgarian fleet.
 */
export function nextInspectionDate(firstRegistration: Date, today: Date): Date {
  for (let index = 0; ; index += 1) {
    const due = addYears(firstRegistration, inspectionYearOffset(index));
    if (due.getTime() >= today.getTime()) return due;
  }
}

/** The first `count` statutory Inspection dates for a Vehicle, oldest first. */
export function inspectionSchedule(firstRegistration: Date, count: number): Date[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) =>
    addYears(firstRegistration, inspectionYearOffset(index)),
  );
}

// --- Vignette ---------------------------------------------------------------------------

/** The Vignette durations sold by the Road Infrastructure Agency. */
export type VignetteKind = "weekend" | "weekly" | "monthly" | "quarterly" | "annual";

/** Days of validity per Vignette kind, counting the start date as day one. */
const VIGNETTE_DAYS: Record<Exclude<VignetteKind, "weekend" | "annual">, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

/**
 * The last day a Vignette bought on `start` is valid.
 *
 * A weekend Vignette runs from Friday noon to Sunday night, so it expires on the Sunday of
 * the start's own weekend. Where a duration could be read as ending a day either side, the
 * earlier day wins — a Reminder that fires a day early costs nothing; a day late costs a fine.
 */
export function vignetteExpiry(start: Date, kind: VignetteKind): Date {
  if (kind === "weekend") {
    // getUTCDay: 0 = Sunday. From a Friday (5) that is two days on; from a Sunday, zero.
    const day = start.getUTCDay();
    return addDays(start, day === 0 ? 0 : 7 - day);
  }
  if (kind === "annual") return addDays(addYears(start, 1), -1);
  return addDays(start, VIGNETTE_DAYS[kind] - 1);
}

// --- Vehicle Tax ------------------------------------------------------------------------

/** The statutory Vehicle Tax dates for one calendar year. */
export interface VehicleTaxDeadlines {
  /** Pay the year in full by this date for the 5% discount. */
  discount: Date;
  /** First of two equal instalments. */
  firstInstalment: Date;
  /** Second of two equal instalments. */
  secondInstalment: Date;
}

/**
 * Vehicle Tax deadlines for `year`, fixed by ЗМДТ: 30 April (in full, for the 5% discount),
 * then two equal instalments by 30 June and 31 October. A deadline landing on a weekend
 * rolls to the next working day.
 *
 * These need no input from the User at all — every Vehicle owner in the country shares them,
 * so the Reminders can be raised the moment a Vehicle is added.
 *
 * Public holidays are **not** modelled: a statutory holiday falling on one of these dates
 * would push it one day further than returned here. Erring early is deliberate.
 */
export function vehicleTaxDeadlines(year: number): VehicleTaxDeadlines {
  return {
    discount: rollToWorkingDay(utcDate(year, 3, 30)),
    firstInstalment: rollToWorkingDay(utcDate(year, 5, 30)),
    secondInstalment: rollToWorkingDay(utcDate(year, 9, 31)),
  };
}
