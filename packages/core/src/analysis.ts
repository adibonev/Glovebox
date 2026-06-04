/**
 * Spend analysis — pure aggregation over Service Records' costs (EUR). Powers the
 * "Анализ" pie chart: where the money goes, by Service Type. No I/O.
 */

/** A Service Type's slice of the total spend. */
export interface SpendByType {
  serviceType: string;
  total: number;
  /** Fraction of the overall total (0..1). */
  share: number;
}

export interface SpendAnalysis {
  /** Sum of all recorded costs (EUR). */
  total: number;
  /** Spend per Service Type, largest first; only types with a positive cost. */
  byType: SpendByType[];
  /** Number of Service Records that contributed a cost. */
  count: number;
}

/** Aggregate the recorded costs of Service Records into a spend breakdown by Service Type. */
export function spendAnalysis(
  records: readonly { serviceType: string; cost: number | null }[],
): SpendAnalysis {
  const totals = new Map<string, number>();
  let total = 0;
  let count = 0;

  for (const record of records) {
    if (record.cost == null || record.cost <= 0) continue;
    total += record.cost;
    count += 1;
    totals.set(record.serviceType, (totals.get(record.serviceType) ?? 0) + record.cost);
  }

  const byType: SpendByType[] = [...totals.entries()]
    .map(([serviceType, sum]) => ({
      serviceType,
      total: sum,
      share: total > 0 ? sum / total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { total, byType, count };
}
