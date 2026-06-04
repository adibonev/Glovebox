import Link from "next/link";
import type { ReactNode } from "react";

import { Wheel } from "./Wheel";

/** Public, dark-themed wrapper for the legal pages (no auth chrome). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(110%_60%_at_50%_-10%,rgba(20,80,58,0.25),transparent_55%)]" />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-2xl px-5 pb-16 sm:px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-baseline font-display text-[22px] font-semibold leading-none tracking-tight">
            <span className="text-ivory">Glove</span>
            <span className="flex items-baseline text-copper">
              b
              <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
              x
            </span>
          </Link>
          <Link href="/" className="font-body text-sm text-muted transition hover:text-ivory">
            ← Начало
          </Link>
        </header>

        <h1 className="mt-4 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          {title}
        </h1>
        <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.14em] text-dim">
          Последна актуализация: {updated}
        </p>

        <div
          className="mt-8 space-y-4 font-body text-[15px] leading-relaxed text-muted
            [&_a]:text-copper [&_a]:underline
            [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ivory
            [&_li]:marker:text-dim [&_strong]:text-ivory
            [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
        >
          {children}
        </div>

        <footer className="mt-12 flex items-center gap-4 border-t border-white/[0.06] pt-6 font-body text-[13px] text-dim">
          <Link href="/privacy" className="transition hover:text-ivory">
            Поверителност
          </Link>
          <Link href="/terms" className="transition hover:text-ivory">
            Общи условия
          </Link>
        </footer>
      </div>
    </main>
  );
}
