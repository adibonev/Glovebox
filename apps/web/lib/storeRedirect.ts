import { APP_STORE_URL } from "./appStore";

/** The same listing, opened straight in the App Store app (works from in-app browsers too). */
export const APP_STORE_DEEP_LINK = "itms-apps://apps.apple.com/app/id6806023587";

export function isAppleMobile(userAgent: string | null): boolean {
  return !!userAgent && /\b(iPhone|iPad|iPod)\b/.test(userAgent);
}

/**
 * Where an ad click on /iphone should land: the App Store for an iPhone or iPad, the landing
 * page for everyone else (the app is iOS-only; the website works everywhere).
 */
export function storeRedirectFor(userAgent: string | null): string {
  return isAppleMobile(userAgent) ? APP_STORE_URL : "/";
}

const COPY = {
  title: "Glovebox в App Store",
  opening: "Отваряме App Store…",
  button: "Изтегли от App Store",
} as const;

/**
 * The page /iphone serves to everyone. A plain 302 to apps.apple.com leaves Facebook's and
 * Instagram's in-app browsers on a blank page, so on an iPhone it opens the itms-apps:// link at
 * once and shows a real App Store button for the tap the in-app browser does let through. The
 * device is checked on the phone itself: Facebook's link crawler is not an iPhone, and a server
 * redirect for it would make Messenger remember the landing page instead of /iphone.
 */
export function storeHandoffHtml(): string {
  return `<!doctype html>
<html lang="bg"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${COPY.title}</title>
<style>
html,body{margin:0;height:100%;background:#07100C;color:#F4F1EA;font-family:-apple-system,system-ui,sans-serif}
main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:24px;text-align:center}
p{margin:0;color:#CFD2CB;font-size:17px}
a{display:inline-block}
img{height:56px}
</style></head>
<body><main>
<p>${COPY.opening}</p>
<a href="${APP_STORE_URL}" id="store"><img src="/app-store-badge.svg" alt="${COPY.button}"></a>
</main>
<script>if(/iPhone|iPad|iPod/.test(navigator.userAgent)){location.href=${JSON.stringify(APP_STORE_DEEP_LINK)};}else{location.replace("/");}</script>
</body></html>`;
}
