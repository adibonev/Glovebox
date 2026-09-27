import { describe, expect, it } from "vitest";

import { formatKm, parseKm } from "./mileage";

describe("parseKm", () => {
  it("reads kilometres however the thousands are marked", () => {
    expect(parseKm("185000")).toBe(185000);
    expect(parseKm("185 000")).toBe(185000);
    expect(parseKm("185.000")).toBe(185000);
    expect(parseKm("185,000")).toBe(185000);
  });

  it("takes nothing that is not a count", () => {
    expect(parseKm("")).toBeNull();
    expect(parseKm("около 185")).toBeNull();
    expect(parseKm("-5")).toBeNull();
  });
});

describe("formatKm", () => {
  it("groups thousands with spaces that do not break the line", () => {
    expect(formatKm(369786)).toBe("369 786 км");
    expect(formatKm(950)).toBe("950 км");
  });
});
