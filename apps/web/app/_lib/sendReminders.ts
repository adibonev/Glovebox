import { dueReminders, type ServiceRecord } from "@glovebox/core";

import type { createAdminClient } from "@/lib/supabase/admin";

import { renderReminderEmail, type EmailMessage, type ReminderLine, type SendResult } from "./email";
import { sendExpoPush } from "./expoPush";
import { SERVICE_TYPE_LABELS, formatDaysRemaining } from "./labels";
import { parseWindows } from "./reminderSettings";

/** A short push title + body for a User's due Reminders (the mobile app delivery). */
function pushContent(lines: ReminderLine[]): { title: string; body: string } {
  const first = lines[0];
  if (lines.length === 1 && first) {
    const label = SERVICE_TYPE_LABELS[first.serviceType] ?? first.serviceType;
    return {
      title: "Наближаващ срок",
      body: `${label} (${first.vehicleName}) — ${formatDaysRemaining(first.daysUntilExpiry)}`,
    };
  }
  return { title: "Наближаващи срокове", body: `Имаш ${lines.length} наближаващи срока за колите си.` };
}

type AdminClient = ReturnType<typeof createAdminClient>;
type Mailer = (message: EmailMessage) => Promise<SendResult>;

export type ReminderJobResult = {
  usersProcessed: number;
  emailsSent: number;
  pushSent: number;
  remindersSent: number;
  skippedAlreadySent: number;
  errors: string[];
};

/**
 * The reminder cron's work: for every User with email reminders on, compute the due
 * Reminders (pure `dueReminders` from core) against their Reminder Windows, skip any
 * already sent (one email per car × service type × expiry, logged in `service_logs`),
 * email the rest, and record what was sent. I/O is injected (admin client + mailer) so
 * the policy stays testable.
 */
export async function runReminderJob(
  admin: AdminClient,
  mailer: Mailer,
  today: Date = new Date(),
  options: { persist?: boolean } = {},
): Promise<ReminderJobResult> {
  const persist = options.persist ?? true;
  const result: ReminderJobResult = {
    usersProcessed: 0,
    emailsSent: 0,
    pushSent: 0,
    remindersSent: 0,
    skippedAlreadySent: 0,
    errors: [],
  };

  const [usersRes, carsRes, servicesRes, logsRes, tokensRes] = await Promise.all([
    admin.from("users").select("id, email, reminder_settings, reminder_enabled"),
    admin.from("cars").select("id, user_id, brand, model"),
    admin
      .from("services")
      .select("id, car_id, user_id, service_type, expiry_date")
      .not("expiry_date", "is", null),
    admin.from("service_logs").select("car_id, service_type, expiry_date"),
    admin.from("push_tokens").select("user_id, token"),
  ]);

  // Expo push tokens grouped per User (push goes to any app device that registered one).
  const tokensByUser = new Map<number, string[]>();
  for (const t of tokensRes.data ?? []) {
    const list = tokensByUser.get(t.user_id) ?? [];
    list.push(t.token);
    tokensByUser.set(t.user_id, list);
  }
  const pushMessages: { to: string; title: string; body: string }[] = [];

  if (usersRes.error || carsRes.error || servicesRes.error) {
    result.errors.push(
      `load failed: ${usersRes.error?.message ?? carsRes.error?.message ?? servicesRes.error?.message}`,
    );
    return result;
  }
  const users = usersRes.data ?? [];
  const cars = carsRes.data ?? [];
  const services = servicesRes.data ?? [];

  const carName = new Map<number, string>();
  for (const c of cars) carName.set(c.id, `${c.brand} ${c.model}`);

  // One reminder per (car, service type, expiry date) — keyed against service_logs.
  const key = (carId: number, serviceType: string, expiry: string) => `${carId}|${serviceType}|${expiry}`;
  const alreadySent = new Set<string>();
  for (const log of logsRes.data ?? []) {
    if (log.car_id != null && log.service_type && log.expiry_date) {
      alreadySent.add(key(log.car_id, log.service_type, log.expiry_date));
    }
  }

  // Raw rows by id (to recover car_id + the exact expiry string after dueReminders).
  const rowById = new Map<string, (typeof services)[number]>();
  const recordsByUser = new Map<number, ServiceRecord[]>();
  for (const s of services) {
    if (s.expiry_date == null) continue;
    rowById.set(String(s.id), s);
    const list = recordsByUser.get(s.user_id) ?? [];
    list.push({
      id: String(s.id),
      vehicleId: String(s.car_id),
      serviceType: s.service_type,
      expiryDate: new Date(s.expiry_date),
      cost: null, // not needed for reminders
    });
    recordsByUser.set(s.user_id, list);
  }

  for (const user of users) {
    if (user.reminder_enabled === false || !user.email) continue;
    result.usersProcessed += 1;

    const windows = parseWindows(user.reminder_settings);
    const due = dueReminders(recordsByUser.get(user.id) ?? [], windows, today);

    const lines: ReminderLine[] = [];
    const toLog: { car_id: number; user_id: number; service_type: string; expiry_date: string }[] = [];
    for (const reminder of due) {
      const row = rowById.get(reminder.serviceRecordId);
      if (!row || row.expiry_date == null) continue;
      if (alreadySent.has(key(row.car_id, reminder.serviceType, row.expiry_date))) {
        result.skippedAlreadySent += 1;
        continue;
      }
      lines.push({
        serviceType: reminder.serviceType,
        vehicleName: carName.get(row.car_id) ?? "—",
        expiryDate: reminder.expiryDate,
        daysUntilExpiry: reminder.daysUntilExpiry,
      });
      toLog.push({
        car_id: row.car_id,
        user_id: user.id,
        service_type: reminder.serviceType,
        expiry_date: row.expiry_date,
      });
    }

    if (lines.length === 0) continue;

    const { subject, html } = renderReminderEmail(lines);
    const sent = await mailer({ to: user.email, subject, html });
    if (!sent.ok) {
      result.errors.push(`user ${user.id}: ${sent.error}`);
      continue;
    }

    result.emailsSent += 1;
    result.remindersSent += lines.length;

    if (!persist) continue; // dry run: don't record/push, so it stays repeatable

    // Push to the User's app devices — same due Reminders as the email (best-effort).
    const tokens = tokensByUser.get(user.id) ?? [];
    if (tokens.length > 0) {
      const { title, body } = pushContent(lines);
      for (const to of tokens) pushMessages.push({ to, title, body });
    }

    const { error: logError } = await admin
      .from("service_logs")
      .insert(toLog.map((t) => ({ ...t, email: user.email, sent_at: new Date().toISOString() })));
    if (logError) result.errors.push(`log user ${user.id}: ${logError.message}`);
    else for (const t of toLog) alreadySent.add(key(t.car_id, t.service_type, t.expiry_date));
  }

  result.pushSent = await sendExpoPush(pushMessages);
  return result;
}
