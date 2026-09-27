import { timingSafeEqual } from "node:crypto";

import { calendarDay } from "@glovebox/core";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { sendEmail } from "../../../_lib/email";
import { runReminderJob } from "../../../_lib/sendReminders";

// The reminder cron endpoint. It runs as service-role across every User, so it takes a shared
// secret, and only in the Authorization header (Bearer <CRON_SECRET>), which is how Vercel Cron
// sends it. Not in the address: a URL ends up in logs, browser history and proxies.
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  // Compared in constant time, so the answer does not leak how much of a guess was right.
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    // ?dry=1 → compute who/what would be emailed without sending or recording (repeatable).
    const dry = new URL(req.url).searchParams.get("dry") === "1";
    const mailer = dry ? async () => ({ ok: true }) : sendEmail;
    const result = await runReminderJob(createAdminClient(), mailer, calendarDay(new Date()), { persist: !dry });
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

// GET as well as POST: Vercel Cron calls with GET. By hand: curl -H "Authorization: Bearer …".
export async function GET(req: Request) {
  return run(req);
}
