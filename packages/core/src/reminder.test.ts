import { describe, expect, it } from "vitest";

import type { ServiceRecord } from "./domain";
import { dueReminders, remindByEmail } from "./reminder";

describe("dueReminders", () => {
  it("returns a Reminder for a Service Record whose Expiry Date is within its Service Type's Reminder Window", () => {
    // A Civil Liability Insurance Service Record expiring on 2026-06-15.
    const serviceRecords = [
      {
        id: "go-2026",
        vehicleId: "car-1",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-06-15"),
        cost: null,
      },
    ];

    // Reminder Window per Service Type: fire 30 days before the Expiry Date.
    const windows = {
      civil_liability: 30,
    };

    // 14 days before the Expiry Date — inside the 30-day Reminder Window.
    const today = new Date("2026-06-01");

    const due = dueReminders(serviceRecords, windows, today);

    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({
      serviceRecordId: "go-2026",
      serviceType: "civil_liability",
    });
  });

  it("returns an empty array for a Service Record whose Expiry Date is outside its Service Type's Reminder Window", () => {
    // A Civil Liability Insurance Service Record expiring 60 days out.
    const serviceRecords = [
      {
        id: "go-2026",
        vehicleId: "car-1",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-07-31"),
        cost: null,
      },
    ];

    // Reminder Window of 30 days — the Expiry Date (60 days away) is beyond it.
    const windows = {
      civil_liability: 30,
    };

    const today = new Date("2026-06-01");

    const due = dueReminders(serviceRecords, windows, today);

    expect(due).toEqual([]);
  });

  it("still reminds about an Expired Service Record — that is the message that saves a fine", () => {
    // A Civil Liability Insurance Service Record whose Expiry Date is 10 days in the past.
    const serviceRecords = [
      {
        id: "go-2026",
        vehicleId: "car-1",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-05-22"),
        cost: null,
      },
    ];

    const windows = {
      civil_liability: 30,
    };

    const today = new Date("2026-06-01");

    const due = dueReminders(serviceRecords, windows, today);

    expect(due).toHaveLength(1);
    expect(due[0]?.stage).toBe("expired");
  });

  it("never raises a Reminder for a non-expiring Service Type (Repair)", () => {
    // A Repair is a dated expense — even with a window set, it must be skipped.
    const serviceRecords = [
      { id: "repair-1", vehicleId: "car-1", serviceType: "repair", expiryDate: new Date("2026-06-05"), cost: 250 },
    ];
    const windows = { repair: 30 };
    const today = new Date("2026-06-01");

    expect(dueReminders(serviceRecords, windows, today)).toEqual([]);
  });

  it("returns exactly the due Reminders across multiple Service Types, each honoring its own Reminder Window", () => {
    const windows = {
      civil_liability: 30,
      vignette: 14,
    };
    const today = new Date("2026-06-01");

    const serviceRecords = [
      // Civil Liability expiring in 14 days — within its 30-day Reminder Window → due.
      { id: "go-due", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-15"), cost: null },
      // Vignette expiring in 10 days — within its 14-day Reminder Window → due.
      { id: "vignette-due", vehicleId: "car-1", serviceType: "vignette", expiryDate: new Date("2026-06-11"), cost: null },
      // Civil Liability expiring in 60 days — beyond its 30-day window → not due.
      { id: "go-far", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-07-31"), cost: null },
      // Vignette expiring in 20 days — within 30 but beyond its own 14-day window → not due.
      { id: "vignette-far", vehicleId: "car-1", serviceType: "vignette", expiryDate: new Date("2026-06-21"), cost: null },
    ];

    const due = dueReminders(serviceRecords, windows, today);

    expect(due).toEqual([
      {
        serviceRecordId: "vignette-due",
        serviceType: "vignette",
        expiryDate: new Date("2026-06-11"),
        daysUntilExpiry: 10,
        stage: "window",
      },
      {
        serviceRecordId: "go-due",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-06-15"),
        daysUntilExpiry: 14,
        stage: "window",
      },
    ]);
  });

  it("includes the Expiry Date and days until expiry on each Reminder for the UI to display", () => {
    const serviceRecords = [
      {
        id: "go-2026",
        vehicleId: "car-1",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-06-15"),
        cost: null,
      },
    ];
    const windows = { civil_liability: 30 };
    const today = new Date("2026-06-01");

    const due = dueReminders(serviceRecords, windows, today);

    expect(due).toEqual([
      {
        serviceRecordId: "go-2026",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-06-15"),
        daysUntilExpiry: 14,
        stage: "window",
      },
    ]);
  });

  it("returns the Reminders sorted by soonest Expiry Date first", () => {
    const windows = { civil_liability: 30 };
    const today = new Date("2026-06-01");

    // Given out of order: 25 days, 5 days, 14 days until expiry.
    const serviceRecords = [
      { id: "go-far", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-26"), cost: null },
      { id: "go-soon", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-06"), cost: null },
      { id: "go-mid", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-15"), cost: null },
    ];

    const due = dueReminders(serviceRecords, windows, today);

    expect(due.map((r) => r.daysUntilExpiry)).toEqual([5, 14, 25]);
  });
});

describe("reminderStage — the ladder that keeps nagging until it is renewed", () => {
  const record = (expiryDate: Date): ServiceRecord => ({
    id: "1",
    vehicleId: "1",
    serviceType: "civil_liability",
    expiryDate,
    cost: null,
  });
  const inDays = (days: number) => new Date(Date.UTC(2026, 0, 1 + days));
  const today = new Date(Date.UTC(2026, 0, 1));
  const stageAt = (days: number) =>
    dueReminders([record(inDays(days))], { civil_liability: 15 }, today)[0]?.stage;

  it("opens at the Reminder Window the User chose", () => {
    expect(stageAt(15)).toBe("window");
    expect(stageAt(9)).toBe("window");
  });

  it("says nothing while the Expiry Date is still beyond that window", () => {
    expect(stageAt(16)).toBeUndefined();
  });

  it("escalates two days out, then one", () => {
    expect(stageAt(2)).toBe("twoDays");
    expect(stageAt(1)).toBe("oneDay");
  });

  it("treats the Expiry Date itself as still valid — the document runs to the end of that day", () => {
    expect(stageAt(0)).toBe("oneDay");
  });

  it("reports it expired once the day has passed", () => {
    expect(stageAt(-1)).toBe("expired");
    expect(stageAt(-40)).toBe("expired");
  });

  it("carries e-mail only at the opening step; the rest are a nudge on the phone", () => {
    expect(remindByEmail("window")).toBe(true);
    expect(remindByEmail("twoDays")).toBe(false);
    expect(remindByEmail("oneDay")).toBe(false);
    expect(remindByEmail("expired")).toBe(false);
  });
});
