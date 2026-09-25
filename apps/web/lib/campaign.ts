/**
 * The cookie that remembers which campaign brought a visitor (see middleware.ts): the utm labels
 * of their first tagged visit, kept until they sign up and then written onto their account.
 * First touch wins: a later tagged visit does not overwrite it.
 */
export const CAMPAIGN_COOKIE = "gb_campaign";

/** Thirty days, the usual attribution window for an ad click. */
export const CAMPAIGN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
