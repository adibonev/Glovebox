import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { acceptShare, rememberShareToken } from "@/lib/share";

/**
 * Where an owner's car invitation (glovebox.bg/s/…) lands in the app. Signed in: accepted on the
 * spot. Not yet: kept, and accepted right after sign-in (lib/share).
 */
export default function ShareLinkScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !token) return;
    void (async () => {
      if (!session) {
        await rememberShareToken(token);
        router.replace("/login");
        return;
      }
      const joined = await acceptShare(session.user.id, session.user.email ?? "", token).catch(() => false);
      router.replace(joined ? "/(tabs)/vehicles" : "/");
    })();
  }, [token, session, loading, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
      <ActivityIndicator color={colors.copper} />
    </View>
  );
}
