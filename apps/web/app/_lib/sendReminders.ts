import {
  dueReminders,
  remindByEmail,
  renewalLink,
  type ReminderStage,
  type ServiceRecord,
} from "@glovebox/core";

import type { createAdminClient } from "@/lib/supabase/admin";

import { renderReminderEmail, type EmailMessage, type ReminderLine, type SendResult } from "./email";
import { sendExpoPush, type ExpoPushMessage } from "./expoPush";
import { SERVICE_TYPE_LABELS, formatDaysRemaining } from "./labels";
import { parseWindows } from "./reminderSettings";

/** What each step of the ladder is called on a lock screen. */
const STAGE_TITLES: Record<ReminderStage, string> = {
  window: "Наближаващ срок",
  twoDays: "Остават 48 часа",
  oneDay: "Остават 24 часа",
  expired: "Изтекъл срок",
};

/**
 * A short push title + body for one step of the ladder.
 *
 * The closing step says what to do rather than what happened. A notification reading "Casco
 * expired" tells a driver something they can no longer change; one that also says to enter the
 * new date is the difference between the app knowing about the next year and going quiet.
 */
function pushContent(stage: ReminderStage, lines: ReminderLine[]): { title: string; body: string } {
  const title = STAGE_TITLES[stage];
  const first = lines[0];

  if (lines.length === 1 && first) {
    const label = SERVICE_TYPE_LABELS[first.serviceType] ?? first.serviceType;
    const subject = `${label} (${first.vehicleName})`;
    return {
      title,
      body:
        stage === "expired"
          ? `${subject} изтече. Поднови я и въведи новия срок.`
          : `${subject} — ${formatDaysRemaining(first.daysUntilExpiry)}`,
    };
  }

  return {
    title,
    body:
      stage === "expired"
        ? `${lines.length} срока са изтекли. Поднови ги и въведи новите дати.`
        : `Имаш ${lines.length} срока за подновяване.`,
  };
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

  const [usersRes, carsRes, servicesRes, logsRes, tokensRes, membersRes] = await Promise.all([
    admin.from("users").select("id, email, reminder_settings, reminder_enabled"),
    admin.from("cars").select("id, user_id, brand, model"),
    admin
      .from("services")
      .select("id, car_id, user_id, service_type, expiry_date")
      .not("expiry_date", "is", null),
    admin.from("service_logs").select("car_id, user_id, service_type, expiry_date, stage"),
    admin.from("push_tokens").select("user_id, token"),
    // Missing until the sharing migration is applied: then every car simply has its owner alone.
    admin.from("vehicle_members").select("car_id, user_id"),
  ]);

  // Expo push tokens grouped per User (push goes to any app device that registered one).
  const tokensByUser = new Map<number, string[]>();
  for (const t of tokensRes.data ?? []) {
    const list = tokensByUser.get(t.user_id) ?? [];
    list.push(t.token);
    tokensByUser.set(t.user_id, list);
  }
  const pushMessages: ExpoPushMessage[] = [];

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
  // Who hears about a car: its owner, then everyone it is shared with.
  const recipients = new Map<number, number[]>();
  for (const c of cars) {
    carName.set(c.id, `${c.brand} ${c.model}`);
    recipients.set(c.id, [c.user_id]);
  }
  for (const m of membersRes.error ? [] : (membersRes.data ?? [])) {
    recipients.get(m.car_id)?.push(m.user_id);
  }

  // Each step of the ladder is owed once per person, car, service type and expiry date. Per
  // person, so a member added later still hears the step the owner already heard. A renewal moves
  // the Expiry Date, which starts the whole ladder again on its own — no state to reset.
  const key = (userId: number, carId: number, serviceType: string, expiry: string, stage: string) =>
    `${userId}|${carId}|${serviceType}|${expiry}|${stage}`;
  const alreadySent = new Set<string>();
  for (const log of logsRes.data ?? []) {
    if (log.car_id == null || !log.service_type || !log.expiry_date) continue;
    // Old rows may lack the person; those were always the owner's.
    const userId = log.user_id ?? recipients.get(log.car_id)?.[0];
    if (userId == null) continue;
    // Rows written before the ladder existed were the single warning, which is the first step.
    alreadySent.add(key(userId, log.car_id, log.service_type, log.expiry_date, log.stage ?? "window"));
  }

  // Raw rows by id (to recover car_id + the exact expiry string after dueReminders).
  const rowById = new Map<string, (typeof services)[number]>();
  const recordsByUser = new Map<number, ServiceRecord[]>();
  for (const s of services) {
    if (s.expiry_date == null) continue;
    rowById.set(String(s.id), s);
    const record: ServiceRecord = {
      id: String(s.id),
      vehicleId: String(s.car_id),
      serviceType: s.service_type,
      expiryDate: new Date(s.expiry_date),
      cost: null, // not needed for reminders
    };
    for (const userId of recipients.get(s.car_id) ?? [s.user_id]) {
      const list = recordsByUser.get(userId) ?? [];
      list.push(record);
      recordsByUser.set(userId, list);
    }
  }

  for (const user of users) {
    // The e-mail switch is for e-mail only; notifications have their own switch on the phone,
    // which removes the device's token. A User with neither gets nothing.
    const emailOn = user.reminder_enabled !== false && !!user.email;
    const tokens = tokensByUser.get(user.id) ?? [];
    if (!emailOn && tokens.length === 0) continue;
    result.usersProcessed += 1;

    const windows = parseWindows(user.reminder_settings);
    const due = dueReminders(recordsByUser.get(user.id) ?? [], windows, today);

    // Group what is owed by step: each goes out as its own notification, and only the first
    // step also goes by e-mail.
    const byStage = new Map<
      ReminderStage,
      { line: ReminderLine; carId: number; expiry: string; serviceRecordId: string }[]
    >();
    for (const reminder of due) {
      const row = rowById.get(reminder.serviceRecordId);
      if (!row || row.expiry_date == null) continue;
      if (alreadySent.has(key(user.id, row.car_id, reminder.serviceType, row.expiry_date, reminder.stage))) {
        result.skippedAlreadySent += 1;
        continue;
      }
      const group = byStage.get(reminder.stage) ?? [];
      group.push({
        line: {
          serviceType: reminder.serviceType,
          vehicleName: carName.get(row.car_id) ?? "—",
          expiryDate: reminder.expiryDate,
          daysUntilExpiry: reminder.daysUntilExpiry,
        },
        carId: row.car_id,
        expiry: row.expiry_date,
        serviceRecordId: reminder.serviceRecordId,
      });
      byStage.set(reminder.stage, group);
    }

    if (byStage.size === 0) continue;

    for (const [stage, group] of byStage) {
      const lines = group.map((item) => item.line);

      // The e-mail carries the opening step only, and a failure must not mark it as sent —
      // it is the step the User set the timing of, so it is worth retrying tomorrow.
      if (emailOn && remindByEmail(stage)) {
        const { subject, html } = renderReminderEmail(lines);
        const sent = await mailer({ to: user.email, subject, html });
        if (!sent.ok) {
          result.errors.push(`user ${user.id}: ${sent.error}`);
          continue;
        }
        result.emailsSent += 1;
      }

      result.remindersSent += lines.length;
      if (!persist) continue; // dry run: don't record/push, so it stays repeatable

      if (tokens.length > 0) {
        const { title, body } = pushContent(stage, lines);
        // A tap goes where the notification asks the driver to act: entering the new date.
        const data = { url: renewalLink(group.map((item) => item.serviceRecordId)) };
        for (const to of tokens) pushMessages.push({ to, title, body, data });
      }

      const { error: logError } = await admin.from("service_logs").insert(
        group.map((item) => ({
          car_id: item.carId,
          user_id: user.id,
          service_type: item.line.serviceType,
          expiry_date: item.expiry,
          stage,
          email: user.email,
          sent_at: new Date().toISOString(),
        })),
      );
      if (logError) result.errors.push(`log user ${user.id}: ${logError.message}`);
      else {
        for (const item of group) {
          alreadySent.add(key(user.id, item.carId, item.line.serviceType, item.expiry, stage));
        }
      }
    }
  }

  result.pushSent = await sendExpoPush(pushMessages);
  return result;
}
