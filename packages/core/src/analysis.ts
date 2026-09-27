/**
 * Spend analysis — pure aggregation over recorded costs (EUR). Powers the "Анализ"
 * pie + line charts. No I/O. The caller keys items however it wants (by Service Type,
 * by Vehicle, …) so the same maths drives every breakdown.
 */

import type { Renewal, ServiceRecord } from "./domain";
import { isExpiringServiceType } from "./reminder";

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

/** A running spend total at a point in time (`t` = ms epoch). */
export interface CumulativePoint {
  t: number;
  cumulative: number;
}

/** Running total of spend over time — events sorted by date, each point the sum so far. */
export function cumulativePoints(
  events: readonly { t: number; cost: number | null }[],
): CumulativePoint[] {
  const sorted = events
    .filter((e): e is { t: number; cost: number } => e.cost != null && e.cost > 0)
    .sort((a, b) => a.t - b.t);

  let sum = 0;
  return sorted.map((e) => {
    sum += e.cost;
    return { t: e.t, cumulative: sum };
  });
}

/** The cumulative total as of time `t` (0 before the first event). Points must be sorted. */
export function cumulativeAt(points: readonly CumulativePoint[], t: number): number {
  let value = 0;
  for (const p of points) {
    if (p.t <= t) value = p.cumulative;
    else break;
  }
  return value;
}

/** One amount paid, on the day it was paid. */
export interface Spend {
  vehicleId: string;
  serviceType: string;
  cost: number;
  paidOn: Date;
}

/**
 * Every recorded cost as spending on the day it was paid: each Service Record's current cost on
 * the day it was entered, and the cost of every period a renewal replaced on its own day.
 *
 * It used to count on the Expiry Date, which put a policy paid in 2026 under 2027 and ran the
 * spend line into the future. A Repair keeps its own date, which is the day of the expense.
 * Until the database keeps the day (`cost_date`), the Expiry Date stands in.
 */
export function spendingOf(records: readonly ServiceRecord[], renewals: readonly Renewal[]): Spend[] {
  const spending: Spend[] = [];
  for (const record of records) {
    if (record.cost == null || record.cost <= 0) continue;
    const paidOn = isExpiringServiceType(record.serviceType)
      ? (record.costDate ?? record.expiryDate)
      : record.expiryDate;
    spending.push({ vehicleId: record.vehicleId, serviceType: record.serviceType, cost: record.cost, paidOn });
  }
  for (const renewal of renewals) {
    if (renewal.previousCost == null || renewal.previousCost <= 0) continue;
    spending.push({
      vehicleId: renewal.vehicleId,
      serviceType: renewal.serviceType,
      cost: renewal.previousCost,
      paidOn: renewal.previousCostDate ?? renewal.previousExpiryDate,
    });
  }
  return spending.sort((a, b) => a.paidOn.getTime() - b.paidOn.getTime());
}
