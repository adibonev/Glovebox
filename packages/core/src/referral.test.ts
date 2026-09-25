import { describe, expect, it } from "vitest";

import { inviteLink, normalizeReferralCode } from "./referral";

describe("normalizeReferralCode", () => {
  it("accepts an Invite Code however it was typed: lower case, spaced or hyphenated", () => {
    expect(normalizeReferralCode(" k7q-2mx ")).toBe("K7Q2MX");
  });

  it("rejects anything that cannot be an Invite Code", () => {
    expect(normalizeReferralCode("")).toBeNull();
    expect(normalizeReferralCode("K7Q2M")).toBeNull();
    // 0, O, 1, I and L are never issued: each looks like another when read off a screen.
    expect(normalizeReferralCode("K7Q20X")).toBeNull();
  });
});

describe("inviteLink", () => {
  it("builds the link a User sends to a friend", () => {
    expect(inviteLink("https://www.glovebox.bg/", "K7Q2MX")).toBe("https://www.glovebox.bg/i/K7Q2MX");
  });
});
