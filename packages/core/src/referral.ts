/**
 * Invites — a User sends a friend a personal link, and the friend's new account remembers who
 * sent it (Invite Code, UBIQUITOUS_LANGUAGE.md). Pure parts here; the Supabase adapter is below.
 *
 * Nothing is rewarded yet: the link works today, and the record of who invited whom is what a
 * reward can be built on once paid plans are switched on.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Six characters from an alphabet with no 0, O, 1, I or L: a code is read off one screen and
 * typed into another (the App Store drops the link on the way), and those five are the ones that
 * get mistaken for each other. Mirrors `new_referral_code()` in the referrals migration.
 */
const INVITE_CODE = /^[2-9A-HJKMNP-Z]{6}$/;

/** The Invite Code in its stored form, or null when the input cannot be one. */
export function normalizeReferralCode(input: string): string | null {
  const code = input.replace(/[\s-]+/g, "").toUpperCase();
  return INVITE_CODE.test(code) ? code : null;
}

/** The link a User sends to a friend. */
export function inviteLink(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/i/${code}`;
}

/**
 * The invite side of a User's account. `claim` and `invitedCount` act on the signed-in User
 * (they go through security-definer functions in the database, which know who that is).
 */
export interface ReferralRepository {
  /** This User's own Invite Code. */
  codeFor(userId: string): Promise<string | null>;
  /**
   * Record that the signed-in User was invited with `code`. False when the code is unknown, is
   * their own, the account already has an inviter, or is too old to have come from an invite.
   */
  claim(code: string): Promise<boolean>;
  /** How many Users signed up with the signed-in User's code. */
  invitedCount(): Promise<number>;
}

export class SupabaseReferralRepository implements ReferralRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async codeFor(userId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("users")
      .select("referral_code")
      .eq("id", Number(userId))
      .maybeSingle();
    if (error) throw new Error(`Supabase users.referral_code failed: ${error.message}`);
    return data?.referral_code ?? null;
  }

  async claim(code: string): Promise<boolean> {
    const normalized = normalizeReferralCode(code);
    if (!normalized) return false;
    const { data, error } = await this.client.rpc("claim_referral", { code: normalized });
    if (error) throw new Error(`Supabase claim_referral failed: ${error.message}`);
    return data === true;
  }

  async invitedCount(): Promise<number> {
    const { data, error } = await this.client.rpc("referral_count");
    if (error) throw new Error(`Supabase referral_count failed: ${error.message}`);
    return data ?? 0;
  }
}
