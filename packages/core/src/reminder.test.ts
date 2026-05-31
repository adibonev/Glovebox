import { describe, expect, it } from "vitest";

import { dueReminders } from "./reminder";

describe("dueReminders", () => {
  it("returns a Reminder for a Service Record whose Expiry Date is within its Service Type's Reminder Window", () => {
    // A Civil Liability Insurance Service Record expiring on 2026-06-15.
    const serviceRecords = [
      {
        id: "go-2026",
        vehicleId: "car-1",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-06-15"),
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

  it("returns an empty array for an already-Expired Service Record", () => {
    // A Civil Liability Insurance Service Record whose Expiry Date is 10 days in the past.
    const serviceRecords = [
      {
        id: "go-2026",
        vehicleId: "car-1",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-05-22"),
      },
    ];

    const windows = {
      civil_liability: 30,
    };

    const today = new Date("2026-06-01");

    const due = dueReminders(serviceRecords, windows, today);

    expect(due).toEqual([]);
  });

  it("returns exactly the due Reminders across multiple Service Types, each honoring its own Reminder Window", () => {
    const windows = {
      civil_liability: 30,
      vignette: 14,
    };
    const today = new Date("2026-06-01");

    const serviceRecords = [
      // Civil Liability expiring in 14 days — within its 30-day Reminder Window → due.
      { id: "go-due", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-15") },
      // Vignette expiring in 10 days — within its 14-day Reminder Window → due.
      { id: "vignette-due", vehicleId: "car-1", serviceType: "vignette", expiryDate: new Date("2026-06-11") },
      // Civil Liability expiring in 60 days — beyond its 30-day window → not due.
      { id: "go-far", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-07-31") },
      // Vignette expiring in 20 days — within 30 but beyond its own 14-day window → not due.
      { id: "vignette-far", vehicleId: "car-1", serviceType: "vignette", expiryDate: new Date("2026-06-21") },
    ];

    const due = dueReminders(serviceRecords, windows, today);

    expect(due).toEqual([
      {
        serviceRecordId: "vignette-due",
        serviceType: "vignette",
        expiryDate: new Date("2026-06-11"),
        daysUntilExpiry: 10,
      },
      {
        serviceRecordId: "go-due",
        serviceType: "civil_liability",
        expiryDate: new Date("2026-06-15"),
        daysUntilExpiry: 14,
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
      },
    ]);
  });

  it("returns the Reminders sorted by soonest Expiry Date first", () => {
    const windows = { civil_liability: 30 };
    const today = new Date("2026-06-01");

    // Given out of order: 25 days, 5 days, 14 days until expiry.
    const serviceRecords = [
      { id: "go-far", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-26") },
      { id: "go-soon", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-06") },
      { id: "go-mid", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-15") },
    ];

    const due = dueReminders(serviceRecords, windows, today);

    expect(due.map((r) => r.daysUntilExpiry)).toEqual([5, 14, 25]);
  });
});
