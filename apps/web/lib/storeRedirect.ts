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
  eyebrow: "Безплатно приложение за iPhone",
  headline: "Нито един срок не те изненадва.",
  points: [
    "Снимаш талона, а то попълва номера, рамата, пробега и срока на прегледа.",
    "Гражданска, винетка, преглед, данък и каско на едно място.",
    "Напомняне 30 дни преди срока, после 48 и 24 часа преди него.",
  ],
  button: "Изтегли от App Store",
  note: "Безплатно. Без карта.",
  screenAlt: "Екранът „Автомобили“ в Glovebox",
} as const;

const APPLE_LOGO =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8C7 7.3 5.6 8.2 4.8 9.6c-1.6 2.8-.4 6.9 1.2 9.1.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.6zM14.1 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.8 1 .1 2.1-.5 2.7-1.3z"/></svg>';

/**
 * The page /iphone serves to everyone. A plain 302 to apps.apple.com leaves Facebook's and
 * Instagram's in-app browsers on a blank page, and Messenger blocks the automatic itms-apps://
 * hand-over, so most ad clicks land here and have to choose to tap through. The page therefore
 * says in three lines what the app does, shows the real Vehicles screen, and puts the App Store
 * button above and below. The device is checked on the phone itself: Facebook's link crawler is
 * not an iPhone, and a server redirect for it would make Messenger remember the landing page.
 */
export function storeHandoffHtml(): string {
  const button = `<a class="btn" href="${APP_STORE_URL}">${APPLE_LOGO}${COPY.button}</a>`;
  const points = COPY.points.map((point) => `<li>${point}</li>`).join("");
  return `<!doctype html>
<html lang="bg"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${COPY.title}</title>
<style>
html,body{margin:0;background:#07100C;color:#F4F1EA;font-family:-apple-system,system-ui,sans-serif}
main{max-width:420px;margin:0 auto;padding:28px 20px 40px;display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center}
.eyebrow{margin:0;color:#C4954C;font-size:13px;letter-spacing:.12em;text-transform:uppercase}
h1{margin:0;font-size:30px;line-height:1.1;font-weight:800}
ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;text-align:left;width:100%}
li{position:relative;padding-left:26px;color:#CFD2CB;font-size:16px;line-height:1.35}
li::before{content:"";position:absolute;left:4px;top:7px;width:10px;height:10px;border-radius:50%;background:#5FCF9A}
a.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;padding:18px 24px;border-radius:14px;background:#14503A;color:#F4F1EA;font-size:19px;font-weight:600;text-decoration:none}
a.btn svg{width:22px;height:22px;fill:#F4F1EA}
.note{margin:-8px 0 0;color:#8D938B;font-size:14px}
img{width:72%;max-width:260px;border-radius:28px;border:6px solid #1b1f1d;box-shadow:0 20px 50px rgba(0,0,0,.6)}
</style></head>
<body><main>
<p class="eyebrow">${COPY.eyebrow}</p>
<h1>${COPY.headline}</h1>
<ul>${points}</ul>
${button}
<p class="note">${COPY.note}</p>
<img src="/screens/avtomobili.webp" alt="${COPY.screenAlt}">
${button}
</main>
<script>if(/iPhone|iPad|iPod/.test(navigator.userAgent)){location.href=${JSON.stringify(APP_STORE_DEEP_LINK)};}else{location.replace("/");}</script>
</body></html>`;
}
