import { SERVICE_TYPE_LABELS, formatDate, formatDaysRemaining } from "./labels";

export type EmailMessage = { to: string; subject: string; html: string };
export type SendResult = { ok: boolean; error?: string };

/** One due obligation, ready to render in a reminder email. */
export type ReminderLine = {
  serviceType: string;
  vehicleName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
};

/**
 * Send an email via Resend (https://resend.com). Server-only — reads RESEND_API_KEY.
 * In dev/test without a verified domain, Resend only delivers from `onboarding@resend.dev`
 * to the Resend account owner's own address.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM || "Glovebox <onboarding@resend.dev>";
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set" };

  // Testing without a verified domain: Resend only delivers to the account owner, so
  // REMINDER_TEST_TO (when set) redirects every email there. Leave it unset in production.
  const to = process.env.REMINDER_TEST_TO || message.to;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: message.subject, html: message.html }),
  });

  if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
  return { ok: true };
}

/** Render the Bulgarian reminder email (inline styles — email clients ignore <style>). */
export function renderReminderEmail(lines: ReminderLine[]): { subject: string; html: string } {
  const subject =
    lines.length === 1
      ? "Glovebox · наближаващ срок за автомобила ти"
      : `Glovebox · ${lines.length} наближаващи срока`;

  const rows = lines
    .map((line) => {
      const label = SERVICE_TYPE_LABELS[line.serviceType] ?? line.serviceType;
      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #18241d;">
            <div style="font:600 16px Georgia,serif;color:#F4F1EA;">${escapeHtml(label)}</div>
            <div style="font:13px Arial,sans-serif;color:#9AA79C;margin-top:2px;">${escapeHtml(line.vehicleName)}</div>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #18241d;text-align:right;">
            <div style="font:600 14px Arial,sans-serif;color:#E3A93A;">${escapeHtml(formatDaysRemaining(line.daysUntilExpiry))}</div>
            <div style="font:12px Arial,sans-serif;color:#69736A;margin-top:2px;">изтича ${escapeHtml(formatDate(line.expiryDate))}</div>
          </td>
        </tr>`;
    })
    .join("");

  const html = `
  <div style="background:#07100C;padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
      <tr><td style="padding:0 4px 18px;">
        <span style="font:700 22px Georgia,serif;color:#F4F1EA;">Glove</span><span style="font:700 22px Georgia,serif;color:#C4954C;">box</span>
      </td></tr>
      <tr><td style="background:#0C1813;border:1px solid #18241d;border-radius:18px;overflow:hidden;">
        <div style="padding:20px 16px 8px;">
          <div style="font:600 18px Georgia,serif;color:#F4F1EA;">Наближават срокове</div>
          <div style="font:13px Arial,sans-serif;color:#9AA79C;margin-top:4px;">Подсещаме те преди да изтекат — обнови ги навреме.</div>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>
      <tr><td style="padding:16px 6px;font:12px Arial,sans-serif;color:#69736A;">
        Получаваш това, защото имейл напомнянията са включени в Glovebox. Можеш да ги изключиш от Напомняния.
      </td></tr>
    </table>
  </div>`;

  return { subject, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
