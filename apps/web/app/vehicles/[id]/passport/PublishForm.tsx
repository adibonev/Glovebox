"use client";

import Link from "next/link";
import { useState } from "react";

import { createPassportLink } from "./actions";

/**
 * Publishing the passport, with a look at it first: the preview follows the "amounts" choice, so
 * what the owner checks is what the link will show.
 */
export function PublishForm({ vehicleId }: { vehicleId: string }) {
  const [includeCosts, setIncludeCosts] = useState(false);

  return (
    <form action={createPassportLink} className="mt-7 rounded-card border border-white/10 bg-panel p-5">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <label className="flex items-start gap-3 font-body text-sm text-silver">
        <input
          type="checkbox"
          name="includeCosts"
          checked={includeCosts}
          onChange={(event) => setIncludeCosts(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-emerald"
        />
        <span>
          Покажи и сумите
          <span className="block text-[13px] text-dim">Колко са стрували полиците, прегледите и ремонтите.</span>
        </span>
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/vehicles/${vehicleId}/passport/preview${includeCosts ? "?costs=1" : ""}`}
          className="rounded-lg border border-white/12 px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:border-white/30"
        >
          Виж как ще изглежда
        </Link>
        <button
          type="submit"
          className="rounded-lg bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Създай връзката
        </button>
      </div>
      <p className="mt-3 font-body text-[13px] text-dim">
        Всеки с връзката вижда паспорта. Можеш да я спреш по всяко време.
      </p>
    </form>
  );
}
