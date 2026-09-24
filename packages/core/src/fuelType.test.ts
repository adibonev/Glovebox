import { describe, expect, it } from "vitest";

import { parseFuelType } from "./fuelType";

describe("parseFuelType", () => {
  it("keeps a way of powering a car that the app knows", () => {
    expect(parseFuelType("electric")).toBe("electric");
  });

  it("leaves it unset when nothing was recorded", () => {
    // Every Vehicle saved before this field existed has none, and that is not an error.
    expect(parseFuelType(null)).toBeNull();
  });

  it("refuses a value the app does not know", () => {
    expect(parseFuelType("nuclear")).toBeNull();
  });
});
