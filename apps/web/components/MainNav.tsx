"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Primary nav. Active state is derived from the current path (client-side). */
export function MainNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="ml-2 hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.025] p-1 md:flex">
      <NavLink href="/" active={isActive("/")}>
        Табло
      </NavLink>
      <NavLink href="/vehicles" active={isActive("/vehicles")}>
        Автомобили
      </NavLink>
      <NavLink href="/documents" active={isActive("/documents")}>
        Документи
      </NavLink>
      <NavLink href="/reminders" active={isActive("/reminders")}>
        Напомняния
      </NavLink>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
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
