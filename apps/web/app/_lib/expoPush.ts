type ExpoPushMessage = { to: string; title: string; body: string };

/**
 * Best-effort delivery of Expo push notifications (https://docs.expo.dev/push-notifications/).
 * Errors never throw — a push failure must not break the reminder job. Returns the number
 * of messages handed to Expo.
 */
export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<number> {
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch.map((m) => ({ ...m, sound: "default" }))),
      });
      if (res.ok) sent += batch.length;
    } catch {
      // best-effort — ignore push transport errors
    }
  }
  return sent;
}
