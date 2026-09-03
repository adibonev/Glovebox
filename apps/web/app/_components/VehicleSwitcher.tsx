"use client";

import { DOCUMENT_SCAN_ENABLED } from "@glovebox/core";
import Link from "next/link";

import type { VehicleSummary } from "../_lib/dashboard";

/**
 * Chips to switch which Vehicle the dashboard shows, plus the way to add another.
 *
 * The switching chips appear only with more than one Vehicle — with a single car its name is
 * already the heading above. The "add" chip is always there: an existing User standing on their
 * own dashboard is exactly the person who wants a second car, and before this they had to go
 * looking for the garage page to find one.
 */
export function VehicleSwitcher({
  vehicles,
  activeId,
}: {
  vehicles: VehicleSummary[];
  activeId: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {vehicles.length > 1 &&
        vehicles.map((v) => {
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

      <Link
        href={DOCUMENT_SCAN_ENABLED ? "/vehicles/scan" : "/vehicles/new"}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/20 px-3.5 py-1.5 font-body text-[13px] font-medium text-muted transition hover:border-copper/50 hover:text-copper"
      >
        <span aria-hidden>+</span>
        Нова кола
      </Link>
    </div>
  );
}
