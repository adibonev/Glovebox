---
description: Billing & entitlement rules (Stripe + RevenueCat)
paths:
  - "**/billing/**"
  - "**/entitlement*/**"
  - "supabase/functions/**"
---

# Billing & entitlements (ADR-0003)

- Gating reads a **single Entitlement resolved server-side**. Never compute access from a raw
  price/plan string in the client.
- **Web** payments: Stripe (+ Stripe Tax for EU VAT). **Mobile**: RevenueCat wrapping App Store
  / Play Billing (Apple/Google require IAP for in-app digital subscriptions; they remit VAT).
- Stripe and RevenueCat **webhooks → an Edge Function → writes the active Entitlement to Supabase.**
- Plans: **Free**, **Pro**, **Legacy**. Trial = 14 days of Pro. A `Paywall` appears when a Free
  user hits a `Quota` (e.g. adding a 2nd Vehicle or 2nd Document).
- Never delete or hard-lock data a user already created; at most make it read-only.
