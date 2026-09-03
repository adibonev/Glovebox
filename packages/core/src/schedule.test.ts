import { describe, expect, it } from "vitest";

import {
  inspectionSchedule,
  nextInspectionDate,
  vehicleTaxDeadlines,
  vignetteExpiry,
} from "./schedule";

describe("nextInspectionDate", () => {
  it("falls on the third anniversary of first registration for a Vehicle registered new", () => {
    // Наредба Н-32, чл. 29 (M1/N1): the first Roadworthiness Inspection is due before the
    // third year from first registration as new elapses.
    const firstRegistration = new Date("2024-05-10");
    const today = new Date("2026-09-02");

    expect(nextInspectionDate(firstRegistration, today)).toEqual(new Date("2027-05-10"));
  });

  it("falls on the fifth anniversary once the third-year Inspection is behind us", () => {
    const firstRegistration = new Date("2020-05-10");
    // The 2023 Inspection has passed; the next statutory one is the fifth year.
    const today = new Date("2024-01-01");

    expect(nextInspectionDate(firstRegistration, today)).toEqual(new Date("2025-05-10"));
  });

  it("repeats every year after the fifth anniversary", () => {
    const firstRegistration = new Date("2015-03-20");
    const today = new Date("2026-09-02");

    expect(nextInspectionDate(firstRegistration, today)).toEqual(new Date("2027-03-20"));
  });

  it("returns the anniversary itself on the day it is due, not the following one", () => {
    const firstRegistration = new Date("2021-06-15");
    // Exactly the fifth anniversary — the Inspection is due today, not next year.
    const today = new Date("2026-06-15");

    expect(nextInspectionDate(firstRegistration, today)).toEqual(new Date("2026-06-15"));
  });

  it("clamps a 29 February first registration to 28 February in a non-leap year", () => {
    const firstRegistration = new Date("2020-02-29");
    const today = new Date("2026-09-02");

    // 2027 is not a leap year — the anniversary lands on 28 February, never 1 March.
    expect(nextInspectionDate(firstRegistration, today)).toEqual(new Date("2027-02-28"));
  });
});

describe("inspectionSchedule", () => {
  it("lists the statutory Inspection dates: third year, fifth year, then annually", () => {
    const firstRegistration = new Date("2024-05-10");

    expect(inspectionSchedule(firstRegistration, 4)).toEqual([
      new Date("2027-05-10"),
      new Date("2029-05-10"),
      new Date("2030-05-10"),
      new Date("2031-05-10"),
    ]);
  });
});

describe("vignetteExpiry", () => {
  it("expires after seven consecutive days for a weekly Vignette", () => {
    // A weekly Vignette bought on 1 June is valid through 7 June inclusive.
    expect(vignetteExpiry(new Date("2026-06-01"), "weekly")).toEqual(new Date("2026-06-07"));
  });

  it("expires after thirty days for a monthly Vignette", () => {
    expect(vignetteExpiry(new Date("2026-06-01"), "monthly")).toEqual(new Date("2026-06-30"));
  });

  it("expires after ninety days for a quarterly Vignette", () => {
    expect(vignetteExpiry(new Date("2026-01-01"), "quarterly")).toEqual(new Date("2026-03-31"));
  });

  it("expires a year on from the chosen start date for an annual Vignette", () => {
    expect(vignetteExpiry(new Date("2026-06-15"), "annual")).toEqual(new Date("2027-06-14"));
  });

  it("expires on the Sunday of the same weekend for a weekend Vignette", () => {
    // 2026-06-05 is a Friday; the weekend Vignette runs to that Sunday.
    expect(vignetteExpiry(new Date("2026-06-05"), "weekend")).toEqual(new Date("2026-06-07"));
  });
});

describe("vehicleTaxDeadlines", () => {
  it("gives the discount date and both instalment dates fixed by law", () => {
    // 2031 is a year where all three statutory dates fall on working days.
    const deadlines = vehicleTaxDeadlines(2031);

    // ЗМДТ: pay in full by 30 April for the 5% discount, otherwise two equal
    // instalments by 30 June and 31 October.
    expect(deadlines.discount).toEqual(new Date("2031-04-30"));
    expect(deadlines.firstInstalment).toEqual(new Date("2031-06-30"));
    expect(deadlines.secondInstalment).toEqual(new Date("2031-10-31"));
  });

  it("rolls a deadline falling on a weekend to the next working day", () => {
    // 31 October 2026 is a Saturday — the deadline moves to Monday 2 November.
    expect(vehicleTaxDeadlines(2026).secondInstalment).toEqual(new Date("2026-11-02"));
  });
});
