import { describe, expect, it } from "vitest";

import type { Vehicle } from "./domain";
import { isSharedWithMe, shareLink } from "./sharing";

const vehicle: Vehicle = {
  id: "car-1",
  userId: "owner",
  brand: "BMW",
  model: "320d",
  year: 2016,
  plate: "CB4521KX",
  vin: null,
  bodyType: "sedan",
  fuelType: "diesel",
  firstRegistration: null,
};

describe("shareLink", () => {
  it("builds the one-time link the owner sends to a family member", () => {
    expect(shareLink("https://www.glovebox.bg/", "0123456789abcdef0123456789abcdef")).toBe(
      "https://www.glovebox.bg/s/0123456789abcdef0123456789abcdef",
    );
  });
});

describe("isSharedWithMe", () => {
  it("tells a Vehicle someone shared with the User from one they own", () => {
    expect(isSharedWithMe(vehicle, "member")).toBe(true);
    expect(isSharedWithMe(vehicle, "owner")).toBe(false);
  });
});
