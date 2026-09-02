/**
 * How a User signs in, and what follows from it.
 *
 * Someone who only ever pressed "Continue with Apple" or "Continue with Google" has no password
 * on the account — there is nothing to change. Offering them a password form is at best
 * meaningless and at worst a trap: with Apple's Hide My Email the confirmation code goes to a
 * relay address that Apple may or may not forward, so the form can sit there failing for reasons
 * the User cannot see or fix.
 */

/** The sign-in methods Glovebox offers. */
export const SIGN_IN_PROVIDERS = ["email", "google", "apple"] as const;

export type SignInProvider = (typeof SIGN_IN_PROVIDERS)[number];

/** The recognised providers out of whatever the auth layer reports. */
export function signInProviders(providers: readonly string[]): SignInProvider[] {
  return SIGN_IN_PROVIDERS.filter((known) => providers.includes(known));
}

/**
 * Whether this User has a password at all. Only an e-mail sign-up creates one; a social User
 * gains one only by linking an e-mail sign-in later.
 */
export function hasPassword(providers: readonly string[]): boolean {
  return providers.includes("email");
}
