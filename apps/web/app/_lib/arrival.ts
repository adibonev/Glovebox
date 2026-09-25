"use server";

import { SupabaseReferralRepository, SupabaseVehicleSharingRepository, type Json } from "@glovebox/core";
import { cookies } from "next/headers";

import { CAMPAIGN_COOKIE } from "@/lib/campaign";
import { INVITE_COOKIE, SHARE_COOKIE } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";

import { currentUser } from "./session";

/**
 * Write what the signed-in User arrived with onto their account, then forget it: the friend
 * whose invite link brought them, and the campaign of the first tagged link they followed. The
 * database decides whether each still counts (a new account, only once), so a cookie that no
 * longer applies is cleared all the same. On a server error the cookie stays for the next load.
 */
export async function claimArrival(): Promise<{ joinedCar: boolean }> {
  let joinedCar = false;
  const jar = await cookies();
  const code = jar.get(INVITE_COOKIE)?.value;
  const campaign = jar.get(CAMPAIGN_COOKIE)?.value;
  const share = jar.get(SHARE_COOKIE)?.value;
  if (!code && !campaign && !share) return { joinedCar };

  const user = await currentUser(); // provisions the users row the claims attach to
  if (!user) return { joinedCar };
  const supabase = await createClient();

  if (code) {
    try {
      await new SupabaseReferralRepository(supabase).claim(code);
      jar.delete(INVITE_COOKIE);
    } catch {
      // Kept for the next page load.
    }
  }

  // A car invitation opened before signing in: join it now. Used or expired, it is dropped too.
  if (share) {
    try {
      joinedCar = (await new SupabaseVehicleSharingRepository(supabase).join(share)) !== null;
      jar.delete(SHARE_COOKIE);
    } catch {
      // Kept for the next page load.
    }
  }

  if (campaign) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(campaign);
    } catch {
      jar.delete(CAMPAIGN_COOKIE); // unreadable: nothing to keep
    }
    if (parsed && typeof parsed === "object") {
      const { error } = await supabase.rpc("claim_campaign", { campaign: parsed as Json });
      if (!error) jar.delete(CAMPAIGN_COOKIE);
    }
  }
  return { joinedCar };
}
