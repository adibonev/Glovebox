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
    <nav className="ml-3 hidden items-center gap-1 md:flex">
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
      className={`rounded-lg px-3.5 py-2 font-body text-sm font-medium transition ${
        active
          ? "bg-white/[0.06] text-ivory"
          : "text-muted hover:bg-white/[0.04] hover:text-ivory"
      }`}
    >
      {children}
    </Link>
  );
}
