import { describe, expect, it, vi } from "vitest";

import { fetchAll, runReminderJob } from "./sendReminders";

type Row = Record<string, unknown>;
type AdminClient = Parameters<typeof runReminderJob>[0];

/**
 * Just enough of the Supabase admin client for the reminder job: select, the two filters it
 * uses, ordering, ranges, insert. Like PostgREST, a response holds at most 1000 rows.
 */
function fakeAdmin(tables: Record<string, Row[]>) {
  const inserted: Record<string, Row[]> = {};
  const client = {
    from(table: string) {
      const filters: ((row: Row) => boolean)[] = [];
      let range: [number, number] | null = null;
      const builder = {
        select: () => builder,
        not: (column: string) => {
          filters.push((row) => row[column] != null);
          return builder;
        },
        gte: (column: string, value: string) => {
          filters.push((row) => String(row[column]) >= value);
          return builder;
        },
        order: () => builder,
        range: (from: number, to: number) => {
          range = [from, to];
          return builder;
        },
        insert: (rows: Row[]) => {
          (inserted[table] ??= []).push(...rows);
          return Promise.resolve({ error: null });
        },
        then: (resolve: (value: { data: Row[]; error: null }) => unknown) => {
          let rows = (tables[table] ?? []).filter((row) => filters.every((keep) => keep(row)));
          if (range) rows = rows.slice(range[0], range[1] + 1);
          return Promise.resolve({ data: rows.slice(0, 1000), error: null }).then(resolve);
        },
      };
      return builder;
    },
  };
  return { client: client as unknown as AdminClient, raw: client, inserted };
}

const today = new Date("2026-09-27T00:00:00Z");
const users = [{ id: 1, email: "driver@example.com", reminder_settings: null, reminder_enabled: true }];
const cars = [{ id: 10, user_id: 1, brand: "Audi", model: "A6" }];
// A Vignette running out in four days: inside its Reminder Window, the first step.
const services = [{ id: 100, car_id: 10, user_id: 1, service_type: "vignette", expiry_date: "2026-10-01" }];

/** Log rows for someone else's cars, to push a real one past the first thousand. */
const filler = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({
    car_id: 1000 + i,
    user_id: 2,
    service_type: "casco",
    expiry_date: "2026-12-01",
    stage: "window",
  }));

describe("fetchAll", () => {
  it("keeps asking for pages until one comes back short", async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => ({ id: i }));
    const page = vi.fn((from: number, to: number) => Promise.resolve({ data: rows.slice(from, to + 1), error: null }));
    await expect(fetchAll(page)).resolves.toHaveLength(2500);
    expect(page).toHaveBeenCalledTimes(3);
  });

  it("stops at the first failed page rather than work with part of the rows", async () => {
    const page = () => Promise.resolve({ data: null, error: { message: "timeout" } });
    await expect(fetchAll(page)).rejects.toThrow("timeout");
  });
});

describe("runReminderJob", () => {
  it("e-mails a Reminder that is due and not yet sent, and logs it", async () => {
    const { client, inserted } = fakeAdmin({ users, cars, services, service_logs: [], push_tokens: [] });
    const mailer = vi.fn(async () => ({ ok: true }));

    const result = await runReminderJob(client, mailer, today);

    expect(mailer).toHaveBeenCalledTimes(1);
    expect(mailer).toHaveBeenCalledWith(expect.objectContaining({ to: "driver@example.com" }));
    expect(result.emailsSent).toBe(1);
    expect(inserted.service_logs).toEqual([
      expect.objectContaining({ car_id: 10, user_id: 1, service_type: "vignette", expiry_date: "2026-10-01" }),
    ]);
  });

  it("does not send again what the log holds, even when the log runs past a thousand rows", async () => {
    const sent = { car_id: 10, user_id: 1, service_type: "vignette", expiry_date: "2026-10-01", stage: "window" };
    const { client } = fakeAdmin({
      users,
      cars,
      services,
      service_logs: [...filler(1100), sent],
      push_tokens: [],
    });
    const mailer = vi.fn(async () => ({ ok: true }));

    const result = await runReminderJob(client, mailer, today);

    expect(mailer).not.toHaveBeenCalled();
    expect(result.skippedAlreadySent).toBe(1);
  });

  it("sends nothing when the log cannot be read, rather than everything again", async () => {
    const { raw } = fakeAdmin({ users, cars, services, push_tokens: [] });
    const broken = {
      from: (table: string) =>
        table === "service_logs"
          ? {
              select: () => ({
                gte: () => ({
                  order: () => ({ range: () => Promise.resolve({ data: null, error: { message: "down" } }) }),
                }),
              }),
            }
          : raw.from(table),
    } as unknown as AdminClient;
    const mailer = vi.fn(async () => ({ ok: true }));

    const result = await runReminderJob(broken, mailer, today);

    expect(mailer).not.toHaveBeenCalled();
    expect(result.errors).toEqual(["load failed: down"]);
  });
});
