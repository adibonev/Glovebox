import { describe, expect, it } from "vitest";

import { dueReminders } from "./reminder";

describe("dueReminders", () => {
  it("returns a Reminder for a Service Record whose Expiry Date is within its Service Type's Reminder Window", () => {
    // A Civil Liability Insurance Service Record expiring on 2026-06-15.
    const serviceRecords = [
      {
        id: "go-2026",
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
});
