import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "./database.types";
import { SupabaseReferralRepository, inviteLink, normalizeReferralCode } from "./referral";

/** A client whose only database is the set of Invite Codes that exist; records what it was asked. */
function clientWithCodes(codes: string[]) {
  const asked: string[] = [];
  const client = {
    rpc: async (fn: string, args: { code: string }) => {
      asked.push(`${fn}(${args.code})`);
      return { data: codes.includes(args.code), error: null };
    },
  } as unknown as SupabaseClient<Database>;
  return { client, asked };
}

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

describe("Invite Code check before sign-up", () => {
  it("knows an Invite Code that belongs to someone, however it was typed", async () => {
    const { client } = clientWithCodes(["K7Q2MX"]);
    expect(await new SupabaseReferralRepository(client).codeExists("k7q 2mx")).toBe(true);
  });

  it("refuses six characters that are nobody's Invite Code", async () => {
    const { client } = clientWithCodes(["K7Q2MX"]);
    expect(await new SupabaseReferralRepository(client).codeExists("ABCDEF")).toBe(false);
  });

  it("refuses what cannot be an Invite Code without asking the database", async () => {
    const { client, asked } = clientWithCodes(["K7Q2MX"]);
    expect(await new SupabaseReferralRepository(client).codeExists("K7Q20X")).toBe(false);
    expect(asked).toEqual([]);
  });
});
