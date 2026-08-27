/**
 * The Glovebox web app. It hosts the server routes the mobile app calls (account
 * deletion needs a service-role key, which must never ship in an app bundle) and the
 * pages we link out to (admin panel, legal). Override per build with EXPO_PUBLIC_SITE_URL.
 */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? "https://www.glovebox.bg").replace(
  /\/+$/,
  "",
);
