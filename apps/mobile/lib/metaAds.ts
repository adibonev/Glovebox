import { Platform } from "react-native";
import { AppEventsLogger, Settings } from "react-native-fbsdk-next";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";

let started = false;

/**
 * Start the Meta SDK once the User has said yes to analytics. On iOS the system ATT prompt
 * comes next; a "no" there still lets Meta count the install through SKAdNetwork, just without
 * the advertiser id.
 */
export async function startMetaAds(): Promise<void> {
  if (started) return;
  started = true;
  let tracking = true;
  if (Platform.OS === "ios") {
    const { status } = await requestTrackingPermissionsAsync();
    tracking = status === "granted";
    await Settings.setAdvertiserTrackingEnabled(tracking);
  }
  Settings.setAdvertiserIDCollectionEnabled(tracking);
  Settings.setAutoLogAppEventsEnabled(true); // install + app open
  Settings.initializeSDK();
}

/** First Vehicle saved: the moment an install becomes a real User. */
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
