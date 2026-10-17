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
  hint: "Glovebox е безплатно приложение за iPhone.",
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
a.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:340px;box-sizing:border-box;padding:18px 24px;border-radius:14px;background:#14503A;color:#F4F1EA;font-size:19px;font-weight:600;text-decoration:none}
a.btn svg{width:22px;height:22px;fill:#F4F1EA}
</style></head>
<body><main>
<p>${COPY.hint}</p>
<a class="btn" href="${APP_STORE_URL}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8C7 7.3 5.6 8.2 4.8 9.6c-1.6 2.8-.4 6.9 1.2 9.1.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.6zM14.1 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.8 1 .1 2.1-.5 2.7-1.3z"/></svg>${COPY.button}</a>
</main>
<script>if(/iPhone|iPad|iPod/.test(navigator.userAgent)){location.href=${JSON.stringify(APP_STORE_DEEP_LINK)};}else{location.replace("/");}</script>
</body></html>`;
}
