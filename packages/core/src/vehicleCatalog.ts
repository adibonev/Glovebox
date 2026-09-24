/**
 * Vehicle Catalogue — the makes and models a User picks from instead of typing. Pure, no I/O.
 *
 * Typing a make and model by hand gives "VW", "Volkswagen", "фолксваген" and "Volksvagen" for one
 * car, which no list, filter or statistic can put back together. The catalogue is the one spelling
 * of each, and the same list serves the web and the mobile app.
 *
 * The functions take the catalogue rather than reaching for it, so the behaviour can be tested
 * without the shipped data, and so a scan can be matched against any list.
 */

import { latinMakeName } from "./documentScan";

/** One make and the models recorded under it. */
export interface CatalogEntry {
  make: string;
  models: readonly string[];
}

/** The makes and their models, in the order they are offered. */
export type VehicleCatalog = readonly CatalogEntry[];

/**
 * A name reduced to what two spellings of it can be trusted to agree on.
 *
 * The certificate prints "A 6" for what the catalogue calls "A6", accents survive neither OCR nor
 * typing ("Mégane"), and a make comes back upper-case as often as not. Letters and digits are what
 * is left when all of that is taken away.
 */
function normalise(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/gu, "");
}

/** Two names for the same thing, however either is spelled. */
function sameName(a: string, b: string): boolean {
  return normalise(a) === normalise(b);
}

/** The makes, in catalogue order. */
export function makeNames(catalog: VehicleCatalog): string[] {
  return catalog.map((entry) => entry.make);
}

/** The models of one make; empty for a make the catalogue does not carry. */
export function modelsFor(catalog: VehicleCatalog, make: string): string[] {
  return [...(catalog.find((entry) => sameName(entry.make, make))?.models ?? [])];
}

/**
 * The catalogue's name for a make written any way — including the Cyrillic of a certificate.
 * Null when the catalogue has no such make, which leaves the User picking it from the list.
 */
export function matchMake(catalog: VehicleCatalog, raw: string): string | null {
  const wanted = latinMakeName(raw) ?? raw;
  return catalog.find((entry) => sameName(entry.make, wanted))?.make ?? null;
}

/**
 * The catalogue's name for a model of one make, written any way. Null when that make has no such
 * model — the scan then filled in nothing and the User picks the model from the list.
 */
export function matchModel(catalog: VehicleCatalog, make: string, raw: string): string | null {
  return modelsFor(catalog, make).find((model) => sameName(model, raw)) ?? null;
}

/** Older than this and a car is a museum piece, not something to remind about. */
const EARLIEST_MODEL_YEAR = 1960;

/**
 * The model years to offer, newest first. Next year is on the list because cars are registered
 * ahead of the calendar — a new model bought in autumn is already next year's.
 */
export function vehicleYears(today: Date): number[] {
  const years: number[] = [];
  for (let year = today.getFullYear() + 1; year >= EARLIEST_MODEL_YEAR; year -= 1) {
    years.push(year);
  }
  return years;
}
