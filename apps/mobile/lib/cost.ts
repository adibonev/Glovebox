/** Parse an optional cost (EUR) from a text field; accepts comma or dot decimals. */
export function parseCost(input: string): number | null {
  const raw = input.trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
