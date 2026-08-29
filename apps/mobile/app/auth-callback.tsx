import { colors } from "@glovebox/ui";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useAuth } from "@/lib/auth";

/** How long to wait for the code exchange before assuming the link was stale. */
const EXCHANGE_GRACE_MS = 5000;

/**
 * Where Supabase auth links land (`glovebox://auth-callback?code=…`).
 *
 * The code itself is exchanged by useAuthDeepLink in the root layout; this screen exists so
 * expo-router has a route to match — without it the link opened the app straight onto the
 * "Unmatched Route" screen — and so the User sees a spinner rather than a flash of the login
 * form while the exchange is in flight.
 *
 * On success the auth gate takes over and routes into the app. If the exchange never lands
 * (an expired or already-used link) fall back to the login screen instead of spinning forever.
 */
export default function AuthCallbackScreen() {
  const { session } = useAuth();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExpired(true), EXCHANGE_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (session) return <Redirect href="/" />;
  if (expired) return <Redirect href="/login" />;

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-ink">
      <ActivityIndicator color={colors.copper} />
      <Text className="text-base text-silver">Влизаме в профила ти…</Text>
    </View>
  );
}
