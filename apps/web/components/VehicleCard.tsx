"use client";

import { useState } from "react";

import type { BodyType } from "@/app/_lib/bodyType";

/**
 * The vehicle silhouette floating directly on the dark scene — a soft emerald halo
 * and a ground shadow, no panel, no border. The PNG (public/cars/<bodyType>.png) is
 * transparent; if it isn't there yet we show a subtle placeholder instead of a broken image.
 */
export function VehicleCard({ bodyType, alt }: { bodyType: BodyType; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative mt-7 flex min-h-[220px] items-center justify-center px-2 py-3">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "96%",
          height: "86%",
          background:
            "radial-gradient(closest-side, rgba(31,99,71,0.5), rgba(196,149,76,0.05) 56%, transparent 72%)",
          filter: "blur(18px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-1/2 h-6 w-[70%] -translate-x-1/2 rounded-[50%]"
        style={{
          background: "radial-gradient(closest-side, rgba(0,0,0,0.6), transparent 76%)",
          filter: "blur(7px)",
        }}
      />

      {failed ? (
        <VehiclePlaceholder />
      ) : (
        <img
          src={`/cars/${bodyType}.png`}
          alt={alt}
          draggable={false}
          onError={() => setFailed(true)}
          className="relative z-[1] w-full max-w-[580px] select-none"
          style={{ filter: "drop-shadow(0 28px 26px rgba(0,0,0,0.55))" }}
        />
      )}
    </div>
  );
}

function VehiclePlaceholder() {
  return (
    <div className="relative z-[1] flex flex-col items-center gap-3 py-12 text-center">
      <svg
        viewBox="0 0 64 64"
        className="h-16 w-16 animate-[spin_9s_linear_infinite] text-silver/25"
        fill="none"
        aria-hidden
      >
        <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4" />
        <circle cx="32" cy="32" r="6" fill="currentColor" />
        <path d="M32 8 L32 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M11 44 L25 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M53 44 L39 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">Силует на колата</p>
    </div>
  );
}
