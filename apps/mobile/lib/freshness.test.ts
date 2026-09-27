import { describe, expect, it, vi } from "vitest";

import { MAX_AGE_MS, dataChanged, dataVersion, isFresh } from "./freshness";

// The hook half of the module needs a navigator; only the rule is tested here.
vi.mock("expo-router", () => ({ useFocusEffect: () => undefined }));

describe("isFresh", () => {
  it("keeps what was loaded while nothing was written and it is not old", () => {
    const stamp = { version: dataVersion(), at: 1_000 };
    expect(isFresh(stamp, 1_000 + MAX_AGE_MS - 1)).toBe(true);
  });

  it("loads again after any write", () => {
    const stamp = { version: dataVersion(), at: 1_000 };
    dataChanged();
    expect(isFresh(stamp, 1_001)).toBe(false);
  });

  it("loads again once the data is old, written to or not", () => {
    const stamp = { version: dataVersion(), at: 1_000 };
    expect(isFresh(stamp, 1_000 + MAX_AGE_MS)).toBe(false);
  });

  it("loads when nothing was loaded yet", () => {
    expect(isFresh(null)).toBe(false);
  });
});
