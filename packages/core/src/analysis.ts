/**
 * Spend analysis — pure aggregation over recorded costs (EUR). Powers the "Анализ"
 * pie + line charts. No I/O. The caller keys items however it wants (by Service Type,
 * by Vehicle, …) so the same maths drives every breakdown.
 */

/** One group's slice of the total spend. */
export interface SpendSlice {
  key: string;
  total: number;
  /** Fraction of the overall total (0..1). */
  share: number;
}

export interface SpendBreakdown {
  /** Sum of all costs (EUR). */
  total: number;
  /** Number of items that contributed a cost. */
  count: number;
  /** Spend per key, largest first; only keys with a positive cost. */
  slices: SpendSlice[];
}

/** Group recorded costs by an arbitrary key (Service Type, Vehicle, …) into shares. */
export function spendShares(
  items: readonly { key: string; cost: number | null }[],
): SpendBreakdown {
  const totals = new Map<string, number>();
  let total = 0;
  let count = 0;

  for (const item of items) {
    if (item.cost == null || item.cost <= 0) continue;
    total += item.cost;
    count += 1;
    totals.set(item.key, (totals.get(item.key) ?? 0) + item.cost);
  }

  const slices: SpendSlice[] = [...totals.entries()]
    .map(([key, sum]) => ({ key, total: sum, share: total > 0 ? sum / total : 0 }))
    .sort((a, b) => b.total - a.total);

  return { total, count, slices };
}

/** Spend in a calendar month (`"YYYY-MM"`). */
export interface PeriodSpend {
  period: string;
  total: number;
}

/** Sum recorded costs into monthly buckets, oldest first (for the spend-over-time line). */
export function spendByMonth(
  items: readonly { date: Date; cost: number | null }[],
): PeriodSpend[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    if (item.cost == null || item.cost <= 0) continue;
    const period = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
    totals.set(period, (totals.get(period) ?? 0) + item.cost);
  }

  return [...totals.entries()]
    .map(([period, total]) => ({ period, total }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
