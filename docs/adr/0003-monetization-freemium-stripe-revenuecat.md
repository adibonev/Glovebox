# ADR-0003 — Monetization: freemium, Stripe (web) + RevenueCat (mobile)

**Status:** Accepted

**Context.** Real subscription product. Apple/Google require in-app purchase for digital
subscriptions sold inside native apps; web has no such rule.

**Decision.** Freemium. **Free**: 1 Vehicle, all Service Types + statuses, email reminders,
1 Document, PDF export. **Pro** (~2.99 €/mo or ~24.99 €/yr, 14-day trial): unlimited
Vehicles, push, unlimited Documents, custom Reminder Windows, family sharing (later).
**Legacy**: existing users grandfathered, capabilities kept forever.
Billing: **Stripe** on web (+ Stripe Tax); **RevenueCat** wrapping App Store / Play on mobile.
An Edge Function consumes both webhooks and writes a single **Entitlement** to Supabase;
clients read one flag.

**Consequences.** Highest conversion + App-Store-compliant. Store fee (15–30%) on in-app
sales. Gating must read the server-resolved Entitlement, never a raw plan/price in the client.
