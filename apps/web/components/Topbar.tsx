import Link from "next/link";

import { signOut } from "@/app/login/actions";

import { MainNav } from "./MainNav";

function Wheel() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }}
    >
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="6" />
      <circle cx="32" cy="32" r="7" fill="currentColor" />
      <path d="M32 12 L32 25" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M16 41 L26.5 35" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 41 L37.5 35" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/** Topbar: the Glovebox wordmark (steering-wheel "o"), nav, PRO badge, avatar/sign-out. */
export function Topbar({ email }: { email: string }) {
  const initial = (email.trim()[0] ?? "Г").toUpperCase();

  return (
    <header className="flex items-center gap-4 py-6">
      <Link
        href="/"
        className="flex items-baseline font-display text-[25px] font-semibold leading-none tracking-tight"
      >
        <span className="text-ivory">Glove</span>
        <span className="flex items-baseline text-copper">
          b
          <Wheel />x
        </span>
      </Link>

      <MainNav />

      <div className="flex-1" />

      <span className="rounded-lg border border-copper/40 bg-copper/[0.07] px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-copper">
        PRO
      </span>

      <form action={signOut}>
        <button
          type="submit"
          title="Изход"
          aria-label="Изход"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-emerald to-panel2 font-display text-[15px] font-semibold text-ivory transition hover:border-copper/50"
        >
          {initial}
        </button>
      </form>
    </header>
  );
}
