import { describe, expect, it } from "vitest";

import { shouldAskForReview } from "./reviewPrompt";

const TODAY = new Date("2026-09-24T10:00:00.000Z");
const daysAgo = (days: number) => new Date(TODAY.getTime() - days * 86_400_000);

describe("shouldAskForReview", () => {
  it("asks the first time the User reaches a moment worth asking at", () => {
    expect(shouldAskForReview({ askedOn: [] }, TODAY)).toBe(true);
  });

  it("does not ask twice in the same quarter", () => {
    expect(shouldAskForReview({ askedOn: [daysAgo(30)] }, TODAY)).toBe(false);
  });

  it("asks again once the quarter has passed", () => {
    expect(shouldAskForReview({ askedOn: [daysAgo(91)] }, TODAY)).toBe(true);
  });

  it("stops at the three prompts a year iOS will actually show", () => {
    // A fourth call is swallowed by the system, so spending it would only cost us the record of
    // having asked.
    const asked = [daysAgo(300), daysAgo(200), daysAgo(100)];

    expect(shouldAskForReview({ askedOn: asked }, TODAY)).toBe(false);
  });

  it("asks again once those three fall outside the year", () => {
    const asked = [daysAgo(500), daysAgo(420), daysAgo(380)];

    expect(shouldAskForReview({ askedOn: asked }, TODAY)).toBe(true);
  });
});
