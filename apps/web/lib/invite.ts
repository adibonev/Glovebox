/**
 * The cookie an invite link leaves behind (see middleware.ts). It holds the Invite Code until
 * the visitor has an account, and is cleared the moment the code is claimed for it.
 */
export const INVITE_COOKIE = "gb_invite";

/** Thirty days: long enough to come back and sign up, short enough to mean this invite. */
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
