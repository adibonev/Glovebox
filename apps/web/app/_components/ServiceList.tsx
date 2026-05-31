"use client";

import { motion } from "framer-motion";

type ServiceItem = {
  id: string;
  typeLabel: string;
  statusLabel: string;
  color: string;
  daysText: string;
};

/** The Service Records list with a status dot, colored status label and time remaining. */
export function ServiceList({ items }: { items: ServiceItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.15 + index * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
            />
            <span className="font-body text-[15px] text-ivory">{item.typeLabel}</span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="font-mono text-[11px] uppercase tracking-[0.12em]"
              style={{ color: item.color }}
            >
              {item.statusLabel}
            </span>
            <span className="w-32 text-right font-mono text-[13px] text-silver/75">
              {item.daysText}
            </span>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
