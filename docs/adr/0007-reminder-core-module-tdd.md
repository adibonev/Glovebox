# ADR-0007 — Reminder is a pure `core` module, built first with TDD

**Status:** Accepted

**Context.** Reminders are the product's core value, and in the legacy app the logic was
scattered across a dead Express service, a cron job, and a missing Edge Function — untestable.

**Decision.** Implement reminders as a **pure module** in `packages/core`:
`dueReminders(serviceRecords, windows, today): Reminder[]` (no I/O; `today` is a parameter).
Delivery (`EmailReminder`, `PushNotification`) sits behind a seam; a cron Edge Function only
wires cron → module → adapters. Build this **first**, via red-green-refactor TDD, as the
project's tracer bullet. Test names use ubiquitous-language terms.

**Consequences.** The most important behaviour is fully tested and reusable by web, mobile and
cron. Establishes the testing and module-depth pattern for the codebase.
