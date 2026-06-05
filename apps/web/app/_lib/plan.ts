import { BILLING_ENABLED, type Plan } from "@glovebox/core";

import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const PLANS = new Set<Plan>(["free", "pro", "legacy"]);

/** Resolve the User's active Plan (subscriptions.plan; no row → Free). RLS scopes to owner. */
export async function getPlan(supabase: ServerClient, userId: string | number): Promise<Plan> {
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

/** Count the Vehicles a User owns (for the Vehicle Quota). */
export async function countVehicles(supabase: ServerClient, userId: string | number): Promise<number> {
  const { count } = await supabase
    .from("cars")
    .select("*", { count: "exact", head: true })
    .eq("user_id", Number(userId));
  return count ?? 0;
}

/** Count the Service Records on a Vehicle (for the Service Record Quota). */
export async function countServices(supabase: ServerClient, vehicleId: number): Promise<number> {
  const { count } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("car_id", vehicleId);
  return count ?? 0;
}

/** Count the Documents already attached to a Service Record (for the Document Quota). */
export async function countDocuments(supabase: ServerClient, serviceId: number): Promise<number> {
  const { count } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);
  return count ?? 0;
}
