import type { ReactNode } from "react";

import type { Plan } from "@glovebox/core";

import { getPlan } from "@/app/_lib/plan";
import { currentAuthUser, currentUser } from "@/app/_lib/session";
import { createClient } from "@/lib/supabase/server";

import { PostHogIdentify } from "./PostHogIdentify";
import { Topbar } from "./Topbar";

/** Shared page chrome: the cinematic scene glows, centered container and Topbar. */
export async function Shell({ email, children }: { email: string; children: ReactNode }) {
  // Resolve the Plan once here for the Topbar badge (Free → upsell, Pro/Legacy → PRO).
  // The lookups are request-cached, so the page body's own `currentUser()` costs nothing.
  const user = await currentAuthUser();
  const profile = await currentUser();
  let plan: Plan = "free";
  let isAdmin = false;
  if (profile) {
    isAdmin = profile.isAdmin;
    plan = await getPlan(await createClient(), profile.id);
  }

  return (
    <main className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-10%,rgba(20,80,58,0.30),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_45%_at_50%_115%,rgba(196,149,76,0.08),transparent_70%)]" />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-[1180px] px-5 pb-20 sm:px-6">
        {process.env.NEXT_PUBLIC_POSTHOG_KEY && user && (
          <PostHogIdentify id={user.id} email={email} />
        )}
        <Topbar email={email} plan={plan} isAdmin={isAdmin} />
        {children}
      </div>
    </main>
  );
}
