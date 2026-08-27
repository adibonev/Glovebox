import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { SupabaseAccountPurge, purgeAccount } from "@glovebox/core";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Delete the calling User's account and all of their data (GDPR Art. 17 / App Store
 * Guideline 5.1.1(v)). Called by the **mobile** app with the Supabase access token as a
 * Bearer header; the web app uses the `deleteAccount` Server Action, which runs the same
 * `core` purge.
 *
 * Irreversible: the ordering rule and the cascade live in `@glovebox/core` (`account.ts`).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // The token identifies WHO is being deleted — never take a user id from the body.
  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await purgeAccount(new SupabaseAccountPurge(admin), user.id);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
