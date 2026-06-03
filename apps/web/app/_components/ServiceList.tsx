"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import type { ExpiryStatus } from "@glovebox/core";

import { deleteService } from "../_lib/actions";
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
};

/** Service Records list: left status accent, code chip, name + date, days, status badge, delete. */
export function ServiceList({ items }: { items: ServiceItem[] }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-panel to-ink2">
      {items.map((item, index) => (
        <Row key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

function Row({ item, index }: { item: ServiceItem; index: number }) {
  const expired = item.status === "Expired";
  const note = expired ? "преди това" : item.days === 0 ? "днес" : "остават";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center gap-4 border-t border-white/[0.05] px-5 py-4 first:border-t-0"
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

      <div className="min-w-0 flex-1">
        <div className="truncate font-body text-[15px] text-ivory">{item.typeLabel}</div>
        <div className="font-mono text-[12px] text-dim">{item.dateLabel}</div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="min-w-[78px] text-right">
          <div
            className={`font-display text-[17px] font-semibold leading-none ${
              item.status === "Valid" ? "text-ivory" : ""
            }`}
            style={item.status === "Valid" ? undefined : { color: item.color }}
          >
            {Math.abs(item.days)} дни
          </div>
          <div className="mt-0.5 font-body text-[11px] text-dim">{note}</div>
        </div>

        <span
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: item.color, backgroundColor: `${item.color}1f` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.statusLabel}
        </span>

        <Link
          href={`/services/${item.id}/edit`}
          aria-label="Редакция"
          title="Редакция / подновяване"
          className="text-base leading-none text-dim transition hover:text-copper"
        >
          ✎
        </Link>

        <form action={deleteService}>
          <input type="hidden" name="serviceId" value={item.id} />
          <button
            type="submit"
            aria-label="Изтрий"
            className="text-base leading-none text-dim transition hover:text-status-expired"
          >
            ✕
          </button>
        </form>
      </div>
    </motion.div>
  );
}
