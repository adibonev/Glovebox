import { describe, expect, it } from "vitest";

import { readCampaign } from "./campaign";

describe("readCampaign", () => {
  it("keeps the campaign labels an ad link carries, and the page it landed on", () => {
    const params = new URLSearchParams("utm_source=facebook&utm_medium=paid&utm_campaign=autumn-go&utm_content=video1");

    expect(readCampaign(params, "/", new Date("2026-09-26T10:00:00Z"))).toEqual({
      source: "facebook",
      medium: "paid",
      campaign: "autumn-go",
      content: "video1",
      term: null,
      landing: "/",
      at: "2026-09-26",
    });
  });

  it("is nothing for a visit that did not come from a tagged link", () => {
    expect(readCampaign(new URLSearchParams("v=3"), "/", new Date("2026-09-26"))).toBeNull();
  });

  it("keeps no click identifier and cuts labels down to a sane length", () => {
    const params = new URLSearchParams(`utm_source=${"x".repeat(300)}&fbclid=IwAR123&gclid=abc`);
    const campaign = readCampaign(params, "/", new Date("2026-09-26"));

    expect(campaign?.source).toHaveLength(100);
    expect(JSON.stringify(campaign)).not.toContain("IwAR123");
    expect(JSON.stringify(campaign)).not.toContain("abc");
  });
});
