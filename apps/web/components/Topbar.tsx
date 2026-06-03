import Link from "next/link";

import type { Plan } from "@glovebox/core";

import { MainNav } from "./MainNav";
import { ProfileMenu } from "./ProfileMenu";
import { Wheel } from "./Wheel";

/** Topbar: the Glovebox wordmark (steering-wheel "o"), nav, plan badge, profile menu. */
export function Topbar({ email, plan = "free" }: { email: string; plan?: Plan }) {
  return (
    <header className="flex items-center gap-4 py-6">
      <Link
        href="/"
        className="flex items-baseline font-display text-[25px] font-semibold leading-none tracking-tight"
      >
        <span className="text-ivory">Glove</span>
        <span className="flex items-baseline text-copper">
          b
          <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
          x
        </span>
      </Link>

      <MainNav />

      <div className="flex-1" />

      {plan === "free" ? (
        <Link
          href="/paywall"
          className="rounded-lg border border-copper/40 bg-copper/[0.07] px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-copper transition hover:bg-copper/15"
        >
          НАДГРАДИ
        </Link>
      ) : (
        <span className="rounded-lg border border-copper/40 bg-copper/[0.07] px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-copper">
          PRO
        </span>
      )}

      <ProfileMenu email={email} />
    </header>
  );
}
