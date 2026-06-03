"use client";

import Link from "next/link";

import type { VehicleSummary } from "../_lib/dashboard";

/** Chips to switch which Vehicle the dashboard shows (only rendered when >1). */
export function VehicleSwitcher({
  vehicles,
  activeId,
}: {
  vehicles: VehicleSummary[];
  activeId: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {vehicles.map((v) => {
        const active = v.id === activeId;
        return (
          <Link
            key={v.id}
            href={`/?v=${v.id}`}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`rounded-full border px-3.5 py-1.5 font-body text-[13px] font-medium transition ${
              active
                ? "border-copper/50 bg-copper/[0.12] text-copper"
                : "border-white/10 bg-white/[0.03] text-muted hover:border-white/20 hover:text-ivory"
            }`}
          >
            {v.name}
          </Link>
        );
      })}
    </div>
  );
}
