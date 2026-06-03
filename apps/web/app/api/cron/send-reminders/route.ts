import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { sendEmail } from "../../../_lib/email";
import { runReminderJob } from "../../../_lib/sendReminders";

// The reminder cron endpoint. Protect it with a shared secret (Authorization: Bearer
// <CRON_SECRET>) since it runs as service-role across every User. Trigger it from a
// scheduler (Supabase pg_cron + pg_net, a hosting cron, etc.) once a day.
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  const url = new URL(req.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    // ?dry=1 → compute who/what would be emailed without sending or recording (repeatable).
    const dry = new URL(req.url).searchParams.get("dry") === "1";
    const mailer = dry ? async () => ({ ok: true }) : sendEmail;
    const result = await runReminderJob(createAdminClient(), mailer, new Date(), { persist: !dry });
    return NextResponse.json({ dry, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return run(req);
}

// GET allowed too, so simple schedulers / a manual browser hit (with ?secret=) can fire it.
export async function GET(req: Request) {
  return run(req);
}
