import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

// Checkout success redirect: confirm the session is paid with Stripe and grant Pro
// immediately (verify-on-return). The webhook stays the source of truth for the
// subscription lifecycle (renewals / cancellations); this just unblocks the happy path.
export const dynamic = "force-dynamic";

type StripeSession = {
  status?: string;
  payment_status?: string;
  client_reference_id?: string | null;
  customer?: string;
  subscription?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const secret = process.env.STRIPE_SECRET_KEY;

  if (sessionId && secret) {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const session = (await res.json()) as StripeSession;
    const paid = session.payment_status === "paid" || session.status === "complete";
    const userId = Number(session.client_reference_id);

    if (res.ok && paid && userId) {
      const admin = createAdminClient();
      await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          status: String(session.status ?? "complete"),
          billing_channel: "web",
          stripe_customer_id: session.customer ? String(session.customer) : null,
          stripe_subscription_id: session.subscription ? String(session.subscription) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
  }

  return NextResponse.redirect(new URL("/?upgraded=1", url.origin));
}
