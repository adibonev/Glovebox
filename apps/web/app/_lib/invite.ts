"use server";

import { SupabaseReferralRepository } from "@glovebox/core";
import { cookies } from "next/headers";

import { INVITE_COOKIE } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";

import { currentUser } from "./session";

/**
 * Credit the signed-in User's account to the friend whose invite link brought them here, then
 * forget the code. The database decides whether it counts (new account, not one's own code, only
 * once), so a code that no longer applies is cleared all the same.
 */
export async function claimInvite(): Promise<void> {
  const jar = await cookies();
  const code = jar.get(INVITE_COOKIE)?.value;
  if (!code) return;

  const user = await currentUser(); // provisions the users row the claim attaches to
  if (!user) return;
  try {
    await new SupabaseReferralRepository(await createClient()).claim(code);
  } catch {
    // Keep the cookie: the next page load tries again.
    return;
  }
  jar.delete(INVITE_COOKIE);
}
