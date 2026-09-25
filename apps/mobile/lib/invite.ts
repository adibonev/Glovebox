import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupabaseReferralRepository, SupabaseUserRepository } from "@glovebox/core";
import { useEffect } from "react";

import { useAuth } from "./auth";
import { supabase } from "./supabase";

const PENDING = "glovebox.pendingInviteCode";

const referrals = new SupabaseReferralRepository(supabase);
const users = new SupabaseUserRepository(supabase);

/**
 * Keep a friend's Invite Code until there is an account to credit it to. Signing up by e-mail
 * ends at a confirmation link, often opened much later, so the code cannot be claimed on the spot.
 */
export async function rememberInviteCode(code: string): Promise<void> {
  await AsyncStorage.setItem(PENDING, code);
}

/** Claim a remembered Invite Code once the User is signed in. Mount in the signed-in area. */
export function useInviteClaim() {
  const { session } = useAuth();
  useEffect(() => {
    if (!session) return;
    void (async () => {
      const code = await AsyncStorage.getItem(PENDING);
      if (!code) return;
      // The claim attaches to the users row, which a first sign-in has not necessarily made yet.
      await users.findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" });
      await referrals.claim(code);
      // Claimed, or refused for good (own code, already invited): either way it is settled.
      await AsyncStorage.removeItem(PENDING);
    })().catch(() => {
      // Offline or a server error: the code stays, and the next launch tries again.
    });
  }, [session]);
}
