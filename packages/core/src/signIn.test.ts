import { describe, expect, it } from "vitest";

import { authErrorKind, hasPassword, signInProviders } from "./signIn";

describe("signInProviders", () => {
  it("lists the methods a User can sign in with", () => {
    expect(signInProviders(["email", "google"])).toEqual(["email", "google"]);
  });

  it("ignores anything it does not recognise", () => {
    expect(signInProviders(["apple", "carrier-pigeon"])).toEqual(["apple"]);
  });
});

describe("hasPassword", () => {
  it("is true for a User who signed up with an e-mail address", () => {
    expect(hasPassword(["email"])).toBe(true);
  });

  it("is false for a User who only ever signed in with Apple", () => {
    expect(hasPassword(["apple"])).toBe(false);
  });

  it("is false for a User who only ever signed in with Google", () => {
    expect(hasPassword(["google"])).toBe(false);
  });

  it("is true once a social User has also linked an e-mail sign-in", () => {
    expect(hasPassword(["apple", "email"])).toBe(true);
  });

  it("is false when nothing is known about the User", () => {
    expect(hasPassword([])).toBe(false);
  });
});

describe("authErrorKind", () => {
  it("names what went wrong from the auth layer's code", () => {
    expect(authErrorKind({ code: "invalid_credentials", status: 400 })).toBe("invalidCredentials");
    expect(authErrorKind({ code: "email_not_confirmed", status: 400 })).toBe("emailNotConfirmed");
    expect(authErrorKind({ code: "user_already_exists", status: 422 })).toBe("alreadyRegistered");
    expect(authErrorKind({ code: "weak_password", status: 422 })).toBe("weakPassword");
    expect(authErrorKind({ code: "same_password", status: 422 })).toBe("samePassword");
  });

  it("treats any refusal to send yet as a wait, whatever the code", () => {
    expect(authErrorKind({ code: "over_email_send_rate_limit", status: 429 })).toBe("rateLimited");
    expect(authErrorKind({ status: 429 })).toBe("rateLimited");
  });

  it("falls back to the message for servers that send no code", () => {
    expect(authErrorKind({ message: "Invalid login credentials", status: 400 })).toBe("invalidCredentials");
    expect(authErrorKind({ message: "Email not confirmed" })).toBe("emailNotConfirmed");
    expect(authErrorKind({ message: "User already registered" })).toBe("alreadyRegistered");
  });

  it("calls anything else unknown", () => {
    expect(authErrorKind({ message: "fetch failed" })).toBe("unknown");
  });
});
