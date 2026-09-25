/**
 * Vehicle Passport — everything recorded about one Vehicle, gathered into one document a driver
 * can hand to a buyer. Pure, no I/O; `today` is passed in.
 *
 * It is only as good as what was recorded, and it says where each number came from: a Mileage
 * Reading read off an Inspection certificate is marked as such, and a drop in the odometer is
 * shown rather than smoothed over.
 */

import type { MileageReading, MileageSource, Renewal, ServiceRecord, Vehicle } from "./domain";
import { distanceDriven } from "./mileage";
import { expiryStatus, isExpiringServiceType, type ExpiryStatus } from "./reminder";

/** One stretch an obligation covered, ending on `until`. */
export interface PassportPeriod {
  until: Date;
  /** Null when not recorded, or when the owner shares the passport without costs. */
  cost: number | null;
  /** The period in force now (the Service Record itself), as opposed to a renewed one. */
  current: boolean;
}

export interface PassportObligation {
  serviceType: string;
  /** Null when the Vehicle no longer has this obligation and only its history remains. */
  status: ExpiryStatus | null;
  /** Newest first. */
  periods: PassportPeriod[];
}

export interface PassportExpense {
  serviceType: string;
  date: Date;
  cost: number | null;
}

export interface PassportMileage {
  /** Oldest first. */
  readings: { km: number; readOn: Date; source: MileageSource | null }[];
  /** Average distance a year from the first reading to the last; null with fewer than two. */
  kmPerYear: number | null;
  /** True when some reading is lower than one taken before it. */
  rolledBack: boolean;
}

export interface VehiclePassport {
  vehicle: Pick<Vehicle, "brand" | "model" | "year" | "plate" | "vin" | "fuelType">;
  obligations: PassportObligation[];
  mileage: PassportMileage;
  /** Dated expenses (Repairs), newest first. */
  expenses: PassportExpense[];
  /** Every recorded amount added up; null when costs are left out. */
  totalCost: number | null;
  generatedOn: Date;
}

export interface PassportInput {
  vehicle: Vehicle;
  serviceRecords: ServiceRecord[];
  renewals: Renewal[];
  mileageReadings: MileageReading[];
}

export interface PassportOptions {
  today: Date;
  /** The owner decides whether a buyer sees what the car cost to keep. */
  includeCosts: boolean;
}

/** Status is judged against a fixed month: a buyer has no Reminder Windows of their own. */
const STATUS_WINDOW_DAYS = 30;

/** The order a driver thinks of them in: the certificate first, then the insurances. */
const OBLIGATION_ORDER = [
  "inspection",
  "civil_liability",
  "casco",
  "vignette",
  "tax",
  "fire_extinguisher",
  "maintenance",
];

const rank = (serviceType: string) => {
  const index = OBLIGATION_ORDER.indexOf(serviceType);
  return index === -1 ? OBLIGATION_ORDER.length : index;
};

export function vehiclePassport(input: PassportInput, options: PassportOptions): VehiclePassport {
  const { vehicle, serviceRecords, renewals, mileageReadings } = input;
  const { today, includeCosts } = options;
  const cost = (value: number | null) => (includeCosts ? value : null);

  const current = serviceRecords.filter((record) => isExpiringServiceType(record.serviceType));
  const serviceTypes = [
    ...new Set([...current.map((record) => record.serviceType), ...renewals.map((r) => r.serviceType)]),
  ].sort((a, b) => rank(a) - rank(b));

  const obligations: PassportObligation[] = serviceTypes.map((serviceType) => {
    const record = current.find((candidate) => candidate.serviceType === serviceType);
    const periods: PassportPeriod[] = renewals
      .filter((renewal) => renewal.serviceType === serviceType)
      .map((renewal) => ({ until: renewal.previousExpiryDate, cost: cost(renewal.previousCost), current: false }));
    if (record) periods.push({ until: record.expiryDate, cost: cost(record.cost), current: true });
    periods.sort((a, b) => b.until.getTime() - a.until.getTime());

    return {
      serviceType,
      status: record ? expiryStatus(record, STATUS_WINDOW_DAYS, today) : null,
      periods,
    };
  });

  const expenses: PassportExpense[] = serviceRecords
    .filter((record) => !isExpiringServiceType(record.serviceType))
    .map((record) => ({ serviceType: record.serviceType, date: record.expiryDate, cost: cost(record.cost) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const amounts = [
    ...obligations.flatMap((obligation) => obligation.periods.map((period) => period.cost)),
    ...expenses.map((expense) => expense.cost),
  ];
  const totalCost = includeCosts
    ? amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0)
    : null;

  return {
    vehicle: {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      plate: vehicle.plate,
      vin: vehicle.vin,
      fuelType: vehicle.fuelType,
    },
    obligations,
    mileage: passportMileage(mileageReadings),
    expenses,
    totalCost,
    generatedOn: today,
  };
}

function passportMileage(readings: MileageReading[]): PassportMileage {
  const ordered = [...readings]
    .sort((a, b) => a.readOn.getTime() - b.readOn.getTime())
    .map(({ km, readOn, source }) => ({ km, readOn, source }));

  let highest = -1;
  let rolledBack = false;
  for (const reading of ordered) {
    if (reading.km < highest) rolledBack = true;
    highest = Math.max(highest, reading.km);
  }

  // One average over the whole span, measured the same way as each stretch in Analysis (and with
  // the same readings passed over: a lower one cannot be paired with anything).
  const stretches = distanceDriven(ordered);
  const first = stretches[0];
  const last = stretches[stretches.length - 1];
  const kmPerYear =
    first && last
      ? (distanceDriven([
          { km: 0, readOn: first.from },
          { km: stretches.reduce((sum, stretch) => sum + stretch.km, 0), readOn: last.to },
        ])[0]?.kmPerYear ?? null)
      : null;

  return { readings: ordered, kmPerYear, rolledBack };
}
