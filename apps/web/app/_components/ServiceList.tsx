import Link from "next/link";

import type { ExpiryStatus } from "@glovebox/core";

import { formatDaysFigure } from "../_lib/labels";
import { ServiceTypeIcon } from "./ServiceTypeIcon";

type ServiceItem = {
  id: string;
  serviceType: string;
  code: string;
  typeLabel: string;
  dateLabel: string;
  status: ExpiryStatus;
  statusLabel: string;
  color: string;
  days: number;
  isExpense: boolean;
  costLabel: string | null;
};

/**
 * The Service Records of one car. Each row opens its own page (`/services/[id]`), where it is
 * renewed, documented or deleted: the pencil and the cross on every row were small targets, the
 * cross deleted without a word, and together they cut the names short on a phone.
 */
export function ServiceList({ items }: { items: ServiceItem[] }) {
  return (
    <ul className="overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-panel to-ink2">
      {items.map((item) => (
        <Row key={item.id} item={item} />
      ))}
    </ul>
  );
}

function Row({ item }: { item: ServiceItem }) {
  // "68 дни" over "остават", worded in core so the phone's rows say the same.
  const { figure, note } = formatDaysFigure(item.days);
  // Only what needs attention gets a label; "в сила" on every row said nothing the colour did not.
  const flagged = !item.isExpense && item.status !== "Valid";

  return (
    <li className="border-t border-white/[0.05] first:border-t-0">
      <Link
        href={`/services/${item.id}`}
        className="relative flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r"
          style={{ backgroundColor: item.color }}
        />

        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10"
          style={{ backgroundColor: `${item.color}14`, color: item.color }}
        >
          <ServiceTypeIcon type={item.serviceType} className="h-6 w-6" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-body text-[15px] leading-snug text-ivory">{item.typeLabel}</span>
          <span className="font-mono text-[12px] text-dim">
            {item.dateLabel}
            {item.costLabel && <span className="text-copper"> · {item.costLabel}</span>}
          </span>
        </span>

        {item.isExpense ? (
          <span className="shrink-0 rounded-md bg-white/[0.06] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-silver/70">
            Разход
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-4">
            <span className="text-right">
              <span
                className={`block font-display text-[17px] font-bold leading-none ${item.status === "Valid" ? "text-ivory" : ""}`}
                style={item.status === "Valid" ? undefined : { color: item.color }}
              >
                {figure}
              </span>
              <span className="mt-0.5 block font-body text-[11px] text-dim">{note}</span>
            </span>
            {flagged && (
              <span
                className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
                style={{ color: item.color, backgroundColor: `${item.color}1f` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.statusLabel}
              </span>
            )}
          </span>
        )}

        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-dim" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </li>
  );
}
