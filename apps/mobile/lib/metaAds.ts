import { AppState, Platform } from "react-native";
import { AppEventsLogger, Settings } from "react-native-fbsdk-next";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";

/** The Meta SDK ships in every native build, so the consent question is needed even without PostHog. */
export const metaAdsAvailable = Platform.OS === "ios" || Platform.OS === "android";

let started = false;
let asking: Promise<void> | null = null;

/**
 * Start the Meta SDK once the User has said yes to analytics. On iOS the system ATT prompt
 * comes next; a "no" there still lets Meta count the install through SKAdNetwork, just without
 * the advertiser id. Safe to call again: the SDK starts once, and an ATT question iOS did not
 * show (it ignores one asked before the app is active) is asked on the next call.
 */
export async function startMetaAds(): Promise<void> {
  if (!metaAdsAvailable) return;
  if (!started) {
    started = true;
    Settings.setAdvertiserIDCollectionEnabled(false);
    Settings.setAutoLogAppEventsEnabled(true); // install + app open
    Settings.initializeSDK();
  } else {
    Settings.setAutoLogAppEventsEnabled(true);
  }
  if (Platform.OS === "ios") {
    asking ??= askForTracking().finally(() => (asking = null));
    await asking;
  } else {
    Settings.setAdvertiserIDCollectionEnabled(true);
  }
}

/** The User said no in Профил: stop sending app events. */
export function stopMetaAds(): void {
  if (!started) return;
  Settings.setAutoLogAppEventsEnabled(false);
  Settings.setAdvertiserIDCollectionEnabled(false);
}

/** iOS answers an ATT request made before the app is active with "undetermined" and no prompt. */
async function askForTracking(): Promise<void> {
  let { status, canAskAgain } = await getTrackingPermissionsAsync();
  if (status === "undetermined" && canAskAgain) {
    await whenActive();
    ({ status } = await requestTrackingPermissionsAsync());
  }
  const tracking = status === "granted";
  await Settings.setAdvertiserTrackingEnabled(tracking);
  Settings.setAdvertiserIDCollectionEnabled(tracking);
}

function whenActive(): Promise<void> {
  // A beat after "active" too: right at launch iOS can still drop the prompt.
  const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));
  if (AppState.currentState === "active") return settle();
  return new Promise((resolve) => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      sub.remove();
      void settle().then(resolve);
    });
  });
}

/** First Vehicle saved: the moment an install becomes a real User. Call it for that one only. */
export function metaVehicleSaved(): void {
  if (!started) return;
  // Standard event so Meta can optimise for it (custom names are weaker under AEM/SKAN).
  AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedTutorial);
}

export function metaSignedUp(method: string): void {
  if (!started) return;
  AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
    [AppEventsLogger.AppEventParams.RegistrationMethod]: method,
  });
}
