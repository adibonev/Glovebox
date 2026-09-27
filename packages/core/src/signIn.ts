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

/** What went wrong with a sign-in, sign-up or password request, in terms an app can word. */
export type AuthErrorKind =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "alreadyRegistered"
  | "weakPassword"
  | "samePassword"
  | "rateLimited"
  | "unknown";

const AUTH_ERROR_CODES: Record<string, AuthErrorKind> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "alreadyRegistered",
  email_exists: "alreadyRegistered",
  weak_password: "weakPassword",
  same_password: "samePassword",
  over_email_send_rate_limit: "rateLimited",
  over_request_rate_limit: "rateLimited",
};

/**
 * The kind of an auth error, from its code, or its status or message on servers that send no
 * code. The apps used to show the raw English message ("Invalid login credentials") to people
 * who had just mistyped a password, which is when they most need to understand the screen.
 */
export function authErrorKind(error: { code?: string; status?: number; message?: string }): AuthErrorKind {
  const byCode = error.code ? AUTH_ERROR_CODES[error.code] : undefined;
  if (byCode) return byCode;
  if (error.status === 429) return "rateLimited";
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("invalid login credentials")) return "invalidCredentials";
  if (message.includes("email not confirmed")) return "emailNotConfirmed";
  if (message.includes("already registered")) return "alreadyRegistered";
  return "unknown";
}
