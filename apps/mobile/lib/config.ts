/**
 * The Glovebox web app. It hosts the server routes the mobile app calls (account
 * deletion needs a service-role key, which must never ship in an app bundle) and the
 * pages we link out to (admin panel, legal). Override per build with EXPO_PUBLIC_SITE_URL.
 */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? "https://www.glovebox.bg").replace(
  /\/+$/,
  "",
);

/** The app's page in the App Store, and the entry that opens it straight on writing a review. */
export const APP_STORE_URL = "https://apps.apple.com/bg/app/id6806023587";
export const APP_STORE_REVIEW_URL = `${APP_STORE_URL}?action=write-review`;
