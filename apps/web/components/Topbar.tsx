import Link from "next/link";

import { MainNav } from "./MainNav";
import { ProfileMenu } from "./ProfileMenu";
import { Wheel } from "./Wheel";

/** Topbar: the Glovebox wordmark (steering-wheel "o"), nav, PRO badge, profile menu. */
export function Topbar({ email }: { email: string }) {
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

      <span className="rounded-lg border border-copper/40 bg-copper/[0.07] px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-copper">
        PRO
      </span>

      <ProfileMenu email={email} />
    </header>
  );
}
