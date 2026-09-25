import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupabaseUserRepository } from "@glovebox/core";
import type { Session } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

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

/** "0" once the User switched notifications off in the app; anything else means on. */
const PREFERENCE = "glovebox.push.enabled";
/** This device's Expo token, kept so switching off can delete exactly this device's row. */
const DEVICE_TOKEN = "glovebox.push.token";

/**
 * What the phone allows. `undetermined`: never asked, so the system dialog can still be shown.
 * `denied`: the User said no (or turned it off in Settings); only Settings can undo that.
 */
export type PushPermission = "granted" | "denied" | "undetermined";

async function permission(): Promise<PushPermission> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";
  return current.status === "undetermined" ? "undetermined" : "denied";
}

async function preferenceOn(): Promise<boolean> {
  return (await AsyncStorage.getItem(PREFERENCE)) !== "0";
}

/**
 * Get this device's Expo push token and store it for the User. No-op on a simulator or without an
 * EAS project id (Expo Go). Never asks for permission: callers decide when that is fair to ask.
 */
async function registerDevice(session: Session): Promise<void> {
  if (!Device.isDevice) return;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Напомняния",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return;

  const user = await new SupabaseUserRepository(supabase).findOrCreateByAuthId({
    authUserId: session.user.id,
    email: session.user.email ?? "",
  });
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await supabase
    .from("push_tokens")
    .upsert({ user_id: Number(user.id), token, platform: Platform.OS }, { onConflict: "token" });
  await AsyncStorage.setItem(DEVICE_TOKEN, token);
}

/** Delete this device's token, so the reminder job stops sending here. */
async function unregisterDevice(): Promise<void> {
  const token = await AsyncStorage.getItem(DEVICE_TOKEN);
  if (!token) return;
  await supabase.from("push_tokens").delete().eq("token", token);
  await AsyncStorage.removeItem(DEVICE_TOKEN);
}

/**
 * Switch notifications on: ask the system if it has never been asked, then register this device.
 * Returns what the phone allows afterwards; `denied` means only Settings can turn them on.
 */
export async function enablePush(session: Session): Promise<PushPermission> {
  await AsyncStorage.setItem(PREFERENCE, "1");
  let allowed = await permission();
  if (allowed === "undetermined") {
    const answer = await Notifications.requestPermissionsAsync();
    allowed = answer.granted ? "granted" : "denied";
  }
  if (allowed === "granted") await registerDevice(session).catch(() => undefined);
  return allowed;
}

/**
 * The moment to ask: a car is in, so there is now something to remind about. Asks the system only
 * if it has never been asked and the User has not switched notifications off in the app; after
 * that, the switch and the dashboard banner are the way back.
 */
export async function offerPush(session: Session): Promise<void> {
  if (!(await preferenceOn()) || (await permission()) !== "undetermined") return;
  await enablePush(session);
}

/** Switch notifications off for this device, whatever the phone allows. */
export async function disablePush(): Promise<void> {
  await AsyncStorage.setItem(PREFERENCE, "0");
  await unregisterDevice().catch(() => undefined);
}

/**
 * Keep this device registered while the User is signed in, notifications are allowed and they have
 * not switched them off. Asks nothing: a permission dialog on first launch, before there is even a
 * car, gets a "Don't Allow" that only Settings can undo. The asking happens after the first car
 * (vehicle/setup) or from the notifications switch. Mount in the signed-in area.
 */
export function usePushRegistration() {
  const { session } = useAuth();
  useEffect(() => {
    if (!session) return;
    void (async () => {
      if ((await preferenceOn()) && (await permission()) === "granted") await registerDevice(session);
    })().catch(() => {
      // best-effort: never block the UI on push registration (e.g. in Expo Go)
    });
  }, [session]);
}

/**
 * Whether notifications reach this phone, for the switch and the dashboard banner. Re-read each
 * time the app comes back to the foreground: the User may have just changed it in Settings, and a
 * permission granted there is registered straight away.
 */
export function usePushStatus() {
  const { session } = useAuth();
  const [state, setState] = useState<{ permission: PushPermission; enabled: boolean } | null>(null);

  const refresh = useCallback(async () => {
    const [allowed, on] = await Promise.all([permission(), preferenceOn()]);
    setState({ permission: allowed, enabled: on });
    // Just allowed in Settings: register now. Already registered: nothing to write.
    if (session && on && allowed === "granted" && !(await AsyncStorage.getItem(DEVICE_TOKEN))) {
      await registerDevice(session).catch(() => undefined);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return {
    /** Null until read. */
    status: state,
    /** Notifications actually reach this phone. */
    reaching: state?.permission === "granted" && state.enabled,
    refresh,
  };
}

/**
 * Routes a notification may open. The reminder job only ever sends renewal links; anything else
 * in a payload is ignored rather than followed.
 */
const NOTIFICATION_ROUTE = /^\/renew(\/\d+)?$/;

/**
 * Opens the screen a tapped notification points at (`data.url`, set by the reminder job): the
 * renewal of the obligation it was about.
 *
 * A tap arrives two ways. With the app running, the listener gets it. With the app closed, the tap
 * is what launches it, before any listener exists, so the last response is read once on mount.
 * That one is cleared after use, or the same notification would reopen the renewal on every
 * launch. Mount in the signed-in area, where the navigator is ready.
 */
export function useNotificationRoutes() {
  const router = useRouter();
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url !== "string" || !NOTIFICATION_ROUTE.test(url)) return;
      Notifications.clearLastNotificationResponse();
      router.push(url as Href);
    };
    open(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [router]);
}
