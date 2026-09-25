import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupabaseReferralRepository, SupabaseUserRepository, inviteLink } from "@glovebox/core";
import { useEffect } from "react";
import { Alert, Share } from "react-native";

import { track } from "./analytics";
import { useAuth } from "./auth";
import { SITE_URL } from "./config";
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

const INVITE_OFFERED = "glovebox.inviteOfferedAt";
const OFFER_EVERY = 60 * 24 * 60 * 60 * 1000;

/**
 * Right after a renewal went through, the moment the app has just been useful: ask once whether
 * someone else could use it too. At most every 60 days, and never in the way of the next step.
 */
export async function maybeOfferInvite(userId: string): Promise<void> {
  const last = Number((await AsyncStorage.getItem(INVITE_OFFERED)) ?? 0);
  if (Date.now() - last < OFFER_EVERY) return;
  const code = await referrals.codeFor(userId).catch(() => null);
  if (!code) return;
  await AsyncStorage.setItem(INVITE_OFFERED, String(Date.now()));

  Alert.alert("Готово, срокът е подновен", "Знаеш ли някой, който също забравя кога му изтича гражданската?", [
    { text: "Не сега", style: "cancel" },
    {
      text: "Покани",
      onPress: () => {
        const link = inviteLink(SITE_URL, code);
        void Share.share({
          message: `Пробвай Glovebox. Помни кога изтичат гражданската, прегледът и винетката, и пише навреме. Ако се регистрираш от iPhone, въведи кода ${code}. ${link}`,
          url: link,
        }).then((result) => {
          if (result.action === Share.sharedAction) track("invite_sent", { from: "renewal" });
        });
      },
    },
  ]);
}
