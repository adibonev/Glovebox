import { describe, expect, it } from "vitest";

import {
  InMemoryRegistryChecker,
  normalizeInspectionResult,
  normalizePlate,
  shouldRecheck,
  type CheckResult,
} from "./registryCheck";

const TODAY = new Date("2026-06-05T09:00:00.000Z");
const WINDOW = 30;

describe("normalizePlate", () => {
  it("uppercases, drops spaces and maps Cyrillic plate letters to Latin", () => {
    expect(normalizePlate(" са 1234 вн ")).toBe("CA1234BH");
  });

  it("leaves an already-Latin plate canonical", () => {
    expect(normalizePlate("ca1234bh")).toBe("CA1234BH");
  });
});

describe("normalizeInspectionResult", () => {
  it("marks a Roadworthiness Inspection valid when far from its Expiry Date", () => {
    const result = normalizeInspectionResult({ validUntil: "2026-12-01" }, TODAY, WINDOW);
    expect(result).toMatchObject({
      serviceType: "inspection",
      expiryDate: "2026-12-01",
      status: "valid",
      source: "rta.government.bg",
    });
    expect(result.checkedAt).toBe(TODAY.toISOString());
  });

  it("marks it expiring inside the Reminder Window", () => {
    const result = normalizeInspectionResult({ validUntil: "2026-06-20" }, TODAY, WINDOW);
    expect(result.status).toBe("expiring");
  });

  it("marks it expired past the Expiry Date", () => {
    const result = normalizeInspectionResult({ validUntil: "2026-05-01" }, TODAY, WINDOW);
    expect(result.status).toBe("expired");
  });

  it("parses a Bulgarian DD.MM.YYYY date", () => {
    const result = normalizeInspectionResult({ validUntil: "01.12.2026" }, TODAY, WINDOW);
    expect(result.expiryDate).toBe("2026-12-01");
    expect(result.status).toBe("valid");
  });

  it("returns unknown with a null Expiry Date for an unrecognisable raw response", () => {
    expect(normalizeInspectionResult({ foo: "bar" }, TODAY, WINDOW)).toMatchObject({
      expiryDate: null,
      status: "unknown",
    });
    expect(normalizeInspectionResult(null, TODAY, WINDOW).status).toBe("unknown");
  });
});

describe("InMemoryRegistryChecker", () => {
  it("returns the configured Check Result for a plate (matching on the normalized plate)", async () => {
    const stored: CheckResult = {
      serviceType: "inspection",
      expiryDate: "2027-01-10",
      status: "valid",
      checkedAt: TODAY.toISOString(),
      source: "in-memory",
    };
    const checker = new InMemoryRegistryChecker({ CA1234BH: stored });

    expect(await checker.check("са 1234 вн")).toEqual(stored);
    expect((await checker.check("XX0000XX")).status).toBe("unknown");
  });
});

describe("shouldRecheck", () => {
  it("rechecks when never checked and skips a same-day check (at most once daily)", () => {
    expect(shouldRecheck(null, TODAY)).toBe(true);
    expect(shouldRecheck(TODAY.toISOString(), TODAY)).toBe(false);
    expect(shouldRecheck("2026-06-03T09:00:00.000Z", TODAY)).toBe(true);
  });
});
