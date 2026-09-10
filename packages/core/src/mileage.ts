/**
 * Mileage — the distance a Vehicle is driven, worked out from its Mileage Readings. Pure, no I/O.
 */

/** The distance driven between two consecutive Mileage Readings. */
export interface DistanceDriven {
  from: Date;
  to: Date;
  /** Kilometres between the two readings. */
  km: number;
  /** The same distance scaled to twelve months. */
  kmPerYear: number;
}

/** Calendar months between two days, the odd days counted as a fraction of an average month. */
function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth()) +
    (to.getUTCDate() - from.getUTCDate()) / 30.4375
  );
}

/**
 * The distance driven between each pair of consecutive Mileage Readings, oldest first.
 *
 * Each stretch is also scaled to twelve months. Inspections are a year apart only roughly — one
 * done a month late covers thirteen months of driving — and without scaling a late Inspection
 * would read as a year of more driving than there was.
 */
export function distanceDriven(
  readings: readonly { km: number; readOn: Date }[],
): DistanceDriven[] {
  const ordered = [...readings].sort((a, b) => a.readOn.getTime() - b.readOn.getTime());

  // An odometer only counts up. A reading below the one before it is a digit lost in recognition
  // or in typing, so it is passed over rather than paired: either stretch it touched would be
  // nonsense. A second reading on the same day has no stretch to measure.
  const trusted: typeof ordered = [];
  for (const reading of ordered) {
    const last = trusted[trusted.length - 1];
    if (last && (reading.km < last.km || reading.readOn.getTime() === last.readOn.getTime())) {
      continue;
    }
    trusted.push(reading);
  }

  const driven: DistanceDriven[] = [];
  for (let i = 1; i < trusted.length; i++) {
    const from = trusted[i - 1]!;
    const to = trusted[i]!;
    const km = to.km - from.km;
    driven.push({
      from: from.readOn,
      to: to.readOn,
      km,
      kmPerYear: Math.round((km * 12) / monthsBetween(from.readOn, to.readOn)),
    });
  }
  return driven;
}
