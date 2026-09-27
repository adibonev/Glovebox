import { describe, expect, it } from "vitest";

import {
  STATUS_LABELS,
  authErrorMessage,
  formatCost,
  formatDateShort,
  formatDaysFigure,
  formatDaysRemaining,
  formatRecordLabel,
  formatRecordSummary,
  parseCost,
} from "./labels";

describe("formatDaysRemaining", () => {
  it("counts down in whole days, with the singular for one", () => {
    expect(formatDaysRemaining(12)).toBe("след 12 дни");
    expect(formatDaysRemaining(1)).toBe("след 1 ден");
    expect(formatDaysRemaining(0)).toBe("изтича днес");
  });

  it("says when it ran out with a verb, which fits every Service Type whatever its gender", () => {
    expect(formatDaysRemaining(-1)).toBe("изтече вчера");
    expect(formatDaysRemaining(-5)).toBe("изтече преди 5 дни");
  });
});

describe("formatDaysFigure", () => {
  it("counts the days left, and calls the last valid one today", () => {
    expect(formatDaysFigure(68)).toEqual({ figure: "68 дни", note: "остават" });
    expect(formatDaysFigure(1)).toEqual({ figure: "1 ден", note: "остават" });
    expect(formatDaysFigure(0)).toEqual({ figure: "Днес", note: "последен ден" });
  });

  it("counts the days since a deadline passed", () => {
    expect(formatDaysFigure(-1)).toEqual({ figure: "1 ден", note: "след срока" });
    expect(formatDaysFigure(-9)).toEqual({ figure: "9 дни", note: "след срока" });
  });
});

describe("formatRecordLabel", () => {
  it("names a Service Record among others by its kind and its date", () => {
    const on = new Date("2027-08-11T00:00:00Z");
    expect(formatRecordLabel("civil_liability", on)).toBe("Гражданска отговорност · до 11.08.2027");
    expect(formatRecordLabel("repair", on)).toBe("Ремонт · 11.08.2027");
  });
});

describe("formatRecordSummary", () => {
  const on = new Date("2026-12-04T00:00:00Z");

  it("says until when an obligation holds and how long is left", () => {
    expect(formatRecordSummary({ expiring: true, expiryDate: on, days: 68 })).toBe("В сила до 04.12.2026, още 68 дни");
    expect(formatRecordSummary({ expiring: true, expiryDate: on, days: 1 })).toBe("В сила до 04.12.2026, още 1 ден");
    expect(formatRecordSummary({ expiring: true, expiryDate: on, days: 0 })).toBe("В сила до 04.12.2026, последен ден");
  });

  it("says when a lapsed obligation ran out", () => {
    expect(formatRecordSummary({ expiring: true, expiryDate: on, days: -1 })).toBe("Изтече вчера, на 04.12.2026");
    expect(formatRecordSummary({ expiring: true, expiryDate: on, days: -9 })).toBe("Изтече преди 9 дни, на 04.12.2026");
  });

  it("dates an expense instead of counting towards it", () => {
    expect(formatRecordSummary({ expiring: false, expiryDate: on, days: -30 })).toBe("Разход на 04.12.2026");
  });
});

describe("STATUS_LABELS", () => {
  it("names a lapsed obligation as a lapsed deadline, right for a vignette and a policy alike", () => {
    expect(STATUS_LABELS.Expired).toBe("Изтекъл срок");
  });
});

describe("formatCost and formatDateShort", () => {
  it("writes euros and dates the Bulgarian way", () => {
    expect(formatCost(49.6)).toMatch(/^49,60\s€$/);
    expect(formatCost(null)).toBeNull();
    expect(formatDateShort(new Date("2026-12-04"))).toBe("04.12.2026");
  });
});

describe("parseCost", () => {
  it("reads a cost however it was typed", () => {
    expect(parseCost("120")).toBe(120);
    expect(parseCost("49,60")).toBe(49.6);
    expect(parseCost("49.6")).toBe(49.6);
    expect(parseCost("1 200")).toBe(1200);
    expect(parseCost("1.200,50")).toBe(1200.5);
    expect(parseCost("1,200.50")).toBe(1200.5);
    expect(parseCost("385,67 €")).toBe(385.67);
  });

  it("leaves out what is not a cost rather than guessing", () => {
    expect(parseCost("")).toBeNull();
    expect(parseCost("   ")).toBeNull();
    expect(parseCost("-5")).toBeNull();
    expect(parseCost("около 100")).toBeNull();
  });
});

describe("authErrorMessage", () => {
  it("words an auth failure in Bulgarian, and anything else as a plain retry", () => {
    expect(authErrorMessage({ code: "invalid_credentials", status: 400 })).toBe("Грешен имейл или парола.");
    expect(authErrorMessage(new Error("fetch failed"))).toBe("Нещо се обърка. Опитай пак след малко.");
    expect(authErrorMessage("boom")).toBe("Нещо се обърка. Опитай пак след малко.");
  });
});
