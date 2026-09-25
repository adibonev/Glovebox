import { normalizeReferralCode } from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { rememberInviteCode } from "@/lib/invite";

/**
 * Where a friend's invite link (glovebox.bg/i/K7Q2MX) lands when the app is installed: the code
 * is kept for the account, and the visitor goes on to sign up with it filled in, or straight to
 * the dashboard if they are already signed in (the code is then claimed, if the account is new
 * enough to count).
 */
export default function InviteLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const invite = normalizeReferralCode(code ?? "");
    void (async () => {
      if (invite) await rememberInviteCode(invite);
      if (session) router.replace("/");
      else router.replace(invite ? `/login?invite=${invite}` : "/login");
    })();
  }, [code, session, loading, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
      <ActivityIndicator color={colors.copper} />
    </View>
  );
}
