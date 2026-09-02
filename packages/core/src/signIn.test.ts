import { describe, expect, it } from "vitest";

import { hasPassword, signInProviders } from "./signIn";

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
