/** Parse a kilometre count from a text field; "185 000" and "185.000" both read as 185000. */
export function parseKm(input: string): number | null {
  const digits = input.replace(/[\s.,]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const km = Number(digits);
  return Number.isSafeInteger(km) ? km : null;
}

/** "369 786 км" — thousands grouped by a space, with no line break inside the figure. */
export function formatKm(km: number): string {
  return `${String(Math.round(km)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")}\u00A0км`;
}

/**
 * Today as a calendar day at UTC midnight — the way a Mileage Reading's day is stored. Built from
 * the local date, so a reading typed in at 00:30 is not filed under yesterday.
 */
export function todayAsDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
