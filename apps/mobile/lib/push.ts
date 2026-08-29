import { SupabaseUserRepository } from "@glovebox/core";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "./auth";
import { supabase } from "./supabase";

// How a notification behaves while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission, gets the Expo push token and stores it for this User. No-op on a
 * simulator, when permission is denied, or without an EAS project id — so it's a safe
 * silent no-op in Expo Go (push needs a development/production build).
 */
export async function registerForPush(userId: string): Promise<void> {
  if (!Device.isDevice) return;

  let granted = (await Notifications.getPermissionsAsync()).granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Напомняния",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return; // set by `eas init`; no token until then

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  await supabase
    .from("push_tokens")
    .upsert({ user_id: Number(userId), token, platform: Platform.OS }, { onConflict: "token" });
}

/** Registers this device for push once the User is known (mount in the authed area). */
export function usePushRegistration() {
  const { session } = useAuth();
  useEffect(() => {
    if (!session) return;
    let active = true;
    void (async () => {
      // Provision the User row if this is their first run, exactly as every other
      // screen does. Looking it up without creating it silently skipped registration
      // for a just-registered User — the row is written by whichever screen wins the
      // race — so they saw no permission prompt and got no push until a later launch.
      const repo = new SupabaseUserRepository(supabase);
      const user =
        (await repo.findByAuthId(session.user.id)) ??
        (await repo.create({ authUserId: session.user.id, email: session.user.email ?? "" }));
      if (active && user) await registerForPush(user.id);
    })().catch(() => {
      // best-effort — never block the UI on push registration (e.g. in Expo Go)
    });
    return () => {
      active = false;
    };
  }, [session]);
}
