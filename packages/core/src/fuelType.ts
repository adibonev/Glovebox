/**
 * Fuel Type — how a Vehicle is powered (`cars.fuel_type`). Pure, no I/O.
 *
 * The codes live here so both apps record the same values; the Bulgarian labels stay with each
 * app's other user-facing strings. An electric car is the reason this exists: nothing else about
 * a Vehicle says that its Vehicle Tax and its servicing are not the usual ones.
 */

/** The ways a Vehicle can be powered, in the order they are offered. */
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric", "lpg", "cng"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

/** A stored `cars.fuel_type` as a known Fuel Type; null when unset or unrecognised. */
export function parseFuelType(value: string | null | undefined): FuelType | null {
  return (FUEL_TYPES as readonly string[]).includes(value ?? "") ? (value as FuelType) : null;
}
