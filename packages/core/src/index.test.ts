import { describe, expect, it } from "vitest";

import { CORE_PACKAGE_NAME } from "./index";

describe("@glovebox/core package", () => {
  it("exposes its package name (Phase 0 scaffold smoke test)", () => {
    expect(CORE_PACKAGE_NAME).toBe("@glovebox/core");
  });
});
