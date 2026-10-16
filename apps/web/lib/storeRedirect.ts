import { APP_STORE_URL } from "./appStore";

/**
 * Where an ad click on /iphone should land. An iPhone or iPad goes straight to the App Store
 * listing (one tap fewer than the landing page); anything else gets the landing page, since the
 * app is iOS-only and the website works everywhere.
 */
export function storeRedirectFor(userAgent: string | null): string {
  return userAgent && /\b(iPhone|iPad|iPod)\b/.test(userAgent) ? APP_STORE_URL : "/";
}
