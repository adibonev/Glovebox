import { describe, expect, it } from "vitest";

import { APP_STORE_URL } from "./appStore";
import { APP_STORE_DEEP_LINK, storeHandoffHtml, storeRedirectFor } from "./storeRedirect";

const FACEBOOK_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 [FBAN/FBIOS;FBAV/480.0]";

describe("storeRedirectFor", () => {
  it("sends an iPhone to the App Store, including Facebook's in-app browser", () => {
    expect(storeRedirectFor(FACEBOOK_IOS)).toBe(APP_STORE_URL);
  });

  it("sends an iPad to the App Store too", () => {
    expect(storeRedirectFor("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)")).toBe(APP_STORE_URL);
  });

  it("sends Android and desktop visitors to the landing page", () => {
    expect(storeRedirectFor("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe("/");
    expect(storeRedirectFor("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("/");
    expect(storeRedirectFor(null)).toBe("/");
  });
});

describe("storeHandoffHtml", () => {
  it("opens the App Store app at once and keeps a tappable App Store link as the fallback", () => {
    const html = storeHandoffHtml();
    expect(html).toContain(`location.href=${JSON.stringify(APP_STORE_DEEP_LINK)}`);
    expect(html).toContain(`href="${APP_STORE_URL}"`);
  });
});
