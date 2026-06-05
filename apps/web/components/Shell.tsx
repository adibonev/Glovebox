import type { ReactNode } from "react";

import { SupabaseUserRepository, type Plan } from "@glovebox/core";

import { getPlan } from "@/app/_lib/plan";
import { createClient } from "@/lib/supabase/server";

import { PostHogIdentify } from "./PostHogIdentify";
import { Topbar } from "./Topbar";

/** Shared page chrome: the cinematic scene glows, centered container and Topbar. */
export async function Shell({ email, children }: { email: string; children: ReactNode }) {
  // Resolve the Plan once here for the Topbar badge (Free → upsell, Pro/Legacy → PRO).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let plan: Plan = "free";
  let isAdmin = false;
  if (user) {
    const profile = await new SupabaseUserRepository(supabase).findByAuthId(user.id);
    if (profile) {
      isAdmin = profile.isAdmin;
      plan = await getPlan(supabase, profile.id);
    }
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
