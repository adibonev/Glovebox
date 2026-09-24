import {
  VEHICLE_CATALOG,
  makeNames,
  matchMake,
  matchModel,
  modelsFor,
  vehicleYears,
} from "@glovebox/core";

/** The makes in alphabetical order — a list this long is read by eye as often as it is searched. */
const MAKES = [...makeNames(VEHICLE_CATALOG)].sort((a, b) => a.localeCompare(b, "bg"));

/** Model years, newest first. */
export function yearOptions(): string[] {
  return vehicleYears(new Date()).map(String);
}

/**
 * The makes to offer, keeping `current` on the list when the catalogue does not carry it.
 *
 * A Vehicle saved before the catalogue existed holds whatever its owner typed. Opening the form
 * must not quietly rewrite the car, so its own spelling stays selectable until they change it.
 */
export function makeOptions(current: string): string[] {
  return current && !MAKES.includes(current) ? [current, ...MAKES] : MAKES;
}

/** The models of a make, on the same terms. */
export function modelOptions(make: string, current: string): string[] {
  const known = modelsFor(VEHICLE_CATALOG, make);
  return current && !known.includes(current) ? [current, ...known] : known;
}

/** Whether a make actually has this model — changing the make invalidates the one chosen. */
export function hasModel(make: string, model: string): boolean {
  return modelsFor(VEHICLE_CATALOG, make).includes(model);
}

/**
 * What a scanned certificate's make and model are called in the catalogue.
 *
 * Anything the catalogue does not recognise comes back empty rather than as free text: the fields
 * are lists now, and a value outside them would be a spelling nobody else uses.
 */
export function catalogueVehicle(
  brand: string | null,
  model: string | null,
): { brand: string; model: string } {
  const make = brand ? matchMake(VEHICLE_CATALOG, brand) : null;
  if (!make) return { brand: "", model: "" };
  return { brand: make, model: (model && matchModel(VEHICLE_CATALOG, make, model)) || "" };
}
