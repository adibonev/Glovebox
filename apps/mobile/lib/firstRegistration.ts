import { firstRegistrationProblem } from "@glovebox/core";

import { todayAsDate } from "./mileage";

/** The car's year as typed in the form, or null when there is none to go by. */
function parseYear(year: string): number | null {
  const parsed = Number(year.trim());
  return year.trim() && Number.isInteger(parsed) ? parsed : null;
}

/**
 * Why a date of first registration cannot be saved with this car, in the form's words; null when
 * it can. Checked on save as well as in the picker, because the year may change after the date.
 */
export function firstRegistrationError(date: Date | null, year: string): string | null {
  if (!date) return null;
  const vehicleYear = parseYear(year);
  switch (firstRegistrationProblem(date, vehicleYear, todayAsDate())) {
    case "beforeYear":
      return `Датата на първа регистрация е преди ${vehicleYear} г., годината на колата. Провери едното от двете.`;
    case "inFuture":
      return "Датата на първа регистрация е в бъдещето.";
    default:
      return null;
  }
}

/** 1 January of the car's year, the earliest date the picker offers; none without a year. */
export function earliestFirstRegistration(year: string): Date | undefined {
  const vehicleYear = parseYear(year);
  return vehicleYear !== null && vehicleYear > 1900 ? new Date(vehicleYear, 0, 1) : undefined;
}
