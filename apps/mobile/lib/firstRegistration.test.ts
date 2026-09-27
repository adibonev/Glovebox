import { describe, expect, it } from "vitest";

import { earliestFirstRegistration, firstRegistrationError } from "./firstRegistration";

describe("firstRegistrationError", () => {
  it("refuses a first registration before the car's year, saying which year", () => {
    expect(firstRegistrationError(new Date(Date.UTC(2010, 5, 1)), "2011")).toContain("2011 г.");
  });

  it("refuses a date in the future", () => {
    const nextYear = new Date(Date.UTC(new Date().getFullYear() + 1, 0, 1));
    expect(firstRegistrationError(nextYear, "")).toBe("Датата на първа регистрация е в бъдещето.");
  });

  it("accepts a date that fits, and no date at all", () => {
    expect(firstRegistrationError(new Date(Date.UTC(2011, 3, 12)), "2011")).toBeNull();
    expect(firstRegistrationError(null, "2011")).toBeNull();
  });
});

describe("earliestFirstRegistration", () => {
  it("starts the picker on 1 January of the car's year, or nowhere without one", () => {
    expect(earliestFirstRegistration("2011")).toEqual(new Date(2011, 0, 1));
    expect(earliestFirstRegistration("")).toBeUndefined();
  });
});
