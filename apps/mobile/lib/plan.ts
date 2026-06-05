import { BILLING_ENABLED, type Plan } from "@glovebox/core";

import { supabase } from "./supabase";

const PLANS = new Set<Plan>(["free", "pro", "legacy"]);

/** Resolve the User's active Plan (subscriptions.plan; no row → Free). RLS scopes to owner. */
export async function getPlan(userId: string): Promise<Plan> {
  // Billing off → everyone is unlimited (Legacy). No Quota/Paywall can trigger anywhere.
  if (!BILLING_ENABLED) return "legacy";
  const { data } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", Number(userId))
    .maybeSingle();
  const plan = data?.plan as Plan | undefined;
  return plan && PLANS.has(plan) ? plan : "free";
}
