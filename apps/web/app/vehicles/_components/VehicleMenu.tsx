"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DeleteVehicleButton } from "./DeleteVehicleButton";

const itemClass =
  "block w-full rounded-lg px-3 py-2 text-left font-body text-sm text-silver transition hover:bg-white/[0.06] hover:text-ivory";

/**
 * Everything a car card does besides opening the car, behind one ⋯ button: five equal buttons
 * put "Изтрий" as loud as "Отвори". A car shared with the User has no passport and no delete.
 * A disclosure (Tab moves through the links), not an ARIA menu, which would promise arrow keys.
 */
export function VehicleMenu({ id, name, shared }: { id: string; name: string; shared: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={`Още за ${name}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-muted transition hover:border-white/25 hover:text-ivory"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute bottom-12 right-0 z-20 w-52 rounded-xl border border-white/10 bg-ink2 p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          <Link href={`/vehicles/${id}/edit`} className={itemClass}>
            Редактирай
          </Link>
          <Link href={`/vehicles/${id}/share`} className={itemClass}>
            {shared ? "Семейство" : "Сподели"}
          </Link>
          {!shared && (
            <Link href={`/vehicles/${id}/passport`} className={itemClass}>
              Паспорт
            </Link>
          )}
          {!shared && (
            <>
              <div className="my-1 h-px bg-white/[0.08]" />
              <DeleteVehicleButton
                id={id}
                name={name}
                className="block w-full rounded-lg px-3 py-2 text-left font-body text-sm text-status-expired transition hover:bg-status-expired/10"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
