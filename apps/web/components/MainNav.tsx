"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const LINKS = [
  { href: "/", label: "Табло" },
  { href: "/vehicles", label: "Автомобили" },
  { href: "/documents", label: "Документи" },
  { href: "/reminders", label: "Напомняния" },
];

/** Primary nav: a segmented control on desktop, a hamburger menu on mobile. */
export function MainNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <nav className="ml-2 hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.025] p-1 md:flex">
        {LINKS.map((l) => (
          <NavLink key={l.href} href={l.href} active={isActive(l.href)}>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="relative ml-1 md:hidden" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Меню"
          aria-expanded={open}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-ivory transition hover:border-white/25"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`block px-4 py-2.5 font-body text-sm transition ${
                  isActive(l.href)
                    ? "bg-copper/[0.14] text-copper"
                    : "text-silver hover:bg-white/[0.05] hover:text-ivory"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-xl px-3.5 py-2 font-body text-[14px] font-semibold transition ${
        active
          ? "bg-copper/[0.16] text-copper shadow-[inset_0_0_0_1px_rgba(196,149,76,0.35)]"
          : "text-silver/80 hover:bg-white/[0.07] hover:text-ivory"
      }`}
    >
      {children}
    </Link>
  );
}
