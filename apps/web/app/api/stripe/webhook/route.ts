import crypto from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook → resolve the active Plan server-side (ADR-0003). Writes with the
// service-role key. Verifies the signature manually (no Stripe SDK).
export const dynamic = "force-dynamic";

/** Verify Stripe's `t=…,v1=…` signature against the raw body (HMAC-SHA256). */
function verifySignature(rawBody: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type StripeObject = {
  client_reference_id?: string | null;
  status?: string;
  customer?: string;
  subscription?: string;
  id?: string;
  current_period_end?: number;
  items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
};
type StripeEvent = { type: string; data: { object: StripeObject } };

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const raw = await request.text();

  if (!secret || !signature || !verifySignature(raw, signature, secret)) {
    return new Response("invalid signature", { status: 400 });
  }

  const event = JSON.parse(raw) as StripeEvent;
  const admin = createAdminClient();
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    const userId = Number(obj.client_reference_id);
    if (userId) {
      await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          status: String(obj.status ?? "complete"),
          billing_channel: "web",
          stripe_customer_id: obj.customer ? String(obj.customer) : null,
          stripe_subscription_id: obj.subscription ? String(obj.subscription) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
  } else if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const interval = obj.items?.data?.[0]?.price?.recurring?.interval;
    await admin
      .from("subscriptions")
      .update({
        plan: ACTIVE.has(String(obj.status)) ? "pro" : "free",
        status: String(obj.status),
        billing_period: interval === "year" ? "annual" : interval === "month" ? "monthly" : null,
        current_period_end: obj.current_period_end
          ? new Date(obj.current_period_end * 1000).toISOString()
          : null,
        stripe_subscription_id: String(obj.id),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", String(obj.customer));
  }

  return new Response("ok", { status: 200 });
}
