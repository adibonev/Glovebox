"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/app/login/actions";

/** Avatar that opens a small menu (account settings + sign out) instead of signing out on click. */
export function ProfileMenu({ email, isAdmin = false }: { email: string; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email.trim()[0] ?? "Г").toUpperCase();

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Профил"
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-emerald to-panel2 font-display text-[15px] font-semibold text-ivory transition hover:border-copper/50"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md"
        >
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Профил</p>
            <p className="mt-1 truncate font-body text-sm text-ivory">{email}</p>
          </div>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 font-body text-sm text-silver transition hover:bg-white/[0.05] hover:text-ivory"
          >
            Настройки на акаунта
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 font-body text-sm text-copper transition hover:bg-copper/10"
            >
              <span aria-hidden>♛</span>
              Админ панел
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left font-body text-sm text-silver transition hover:bg-status-expired/10 hover:text-status-expired"
            >
              Изход
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
